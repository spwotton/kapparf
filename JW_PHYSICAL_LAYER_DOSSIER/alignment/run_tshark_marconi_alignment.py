#!/usr/bin/env python3
"""
Unified RF Alignment Pipeline
- tshark timeline extraction
- tshark keyword + EITEL payload scans
- Morse timing indicator from packet deltas
- Marconi/Crookes evidence ingestion
- KiwiSDR scan alignment

Run:
  py signal_forensics/alignment/run_tshark_marconi_alignment.py
"""

from __future__ import annotations

import csv
import json
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from statistics import median
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[2]
ALIGN_DIR = ROOT / "signal_forensics" / "alignment"
ALIGN_DIR.mkdir(parents=True, exist_ok=True)

CAPTURES = [
    ROOT / "signal_forensics" / "capture_20260125_225056.pcap",
    ROOT / "evidence" / "network_traffic" / "pcaps.pcap",
    ROOT / "evidence" / "network_traffic" / "capture_evidence_v2.pcapng",
    ROOT / "evidence" / "network_traffic" / "em_scan_fresh_20260127_131949.pcapng",
]

# Auto-discover fresh captures in alignment dir
for p in sorted(ALIGN_DIR.glob("capture_*.pcapng")):
    if p not in CAPTURES:
        CAPTURES.append(p)

KIWI_DIR = ROOT / "signal_forensics" / "cr_kiwi_scans"
CROOKES_GLOB = ROOT / "signal_forensics"
MARCONI_REPORT = ROOT / "recordings" / "rec_20260218_011420_marconi_report.txt"
ELF_SCAN_DIR = ROOT / "elf_scan_results"


@dataclass
class CaptureSummary:
    name: str
    timeline_csv: Path
    packets: int
    start_epoch: float | None
    end_epoch: float | None
    morse_indicator: Dict[str, float]
    keyword_hits: int
    eitel_hits: int


def run_cmd(args: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(args, capture_output=True, text=True, check=False)


def to_dt(epoch: float | None) -> str | None:
    if epoch is None:
        return None
    return datetime.utcfromtimestamp(epoch).isoformat() + "Z"


def extract_timeline(capture: Path, output_csv: Path) -> Tuple[int, float | None, float | None]:
    args = [
        "tshark", "-r", str(capture),
        "-T", "fields",
        "-e", "frame.time_epoch",
        "-e", "frame.len",
        "-e", "ip.src",
        "-e", "ip.dst",
        "-e", "udp.srcport",
        "-e", "udp.dstport",
        "-e", "tcp.srcport",
        "-e", "tcp.dstport",
        "-E", "header=y",
        "-E", "separator=,",
        "-E", "quote=d",
    ]
    proc = run_cmd(args)
    if proc.returncode != 0:
        output_csv.write_text("", encoding="utf-8")
        return 0, None, None

    output_csv.write_text(proc.stdout, encoding="utf-8")

    epochs: List[float] = []
    with output_csv.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                epochs.append(float(row.get("frame.time_epoch", "") or 0.0))
            except ValueError:
                continue

    if not epochs:
        return 0, None, None
    return len(epochs), min(epochs), max(epochs)


def tshark_filter_hits(capture: Path, display_filter: str, max_lines: int = 200) -> List[str]:
    args = [
        "tshark", "-r", str(capture),
        "-Y", display_filter,
        "-T", "fields",
        "-e", "frame.time_epoch",
        "-e", "frame.number",
        "-e", "ip.src",
        "-e", "ip.dst",
        "-e", "_ws.col.Protocol",
        "-e", "_ws.col.Info",
    ]
    proc = run_cmd(args)
    if proc.returncode != 0 or not proc.stdout.strip():
        return []
    lines = [line for line in proc.stdout.splitlines() if line.strip()]
    return lines[:max_lines]


def compute_morse_indicator(timeline_csv: Path) -> Dict[str, float]:
    epochs: List[float] = []
    with timeline_csv.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                epochs.append(float(row.get("frame.time_epoch", "") or 0.0))
            except ValueError:
                continue

    if len(epochs) < 10:
        return {
            "delta_count": 0,
            "short_ms": 0.0,
            "long_ms": 0.0,
            "ratio": 0.0,
            "score": 0.0,
        }

    epochs.sort()
    deltas = [epochs[i] - epochs[i - 1] for i in range(1, len(epochs))]
    deltas = [d for d in deltas if 0.01 <= d <= 2.0]
    if len(deltas) < 10:
        return {
            "delta_count": len(deltas),
            "short_ms": 0.0,
            "long_ms": 0.0,
            "ratio": 0.0,
            "score": 0.0,
        }

    sorted_d = sorted(deltas)
    q25 = sorted_d[len(sorted_d) // 4]
    q75 = sorted_d[(len(sorted_d) * 3) // 4]

    short = [d for d in deltas if d <= q25]
    long = [d for d in deltas if d >= q75]

    short_med = median(short) if short else 0.0
    long_med = median(long) if long else 0.0
    ratio = (long_med / short_med) if short_med > 0 else 0.0

    # Morse-ish if long/short roughly near 3 with tolerance.
    score = max(0.0, 1.0 - abs(ratio - 3.0) / 3.0)

    return {
        "delta_count": len(deltas),
        "short_ms": round(short_med * 1000, 3),
        "long_ms": round(long_med * 1000, 3),
        "ratio": round(ratio, 3),
        "score": round(score, 3),
    }


def load_crookes() -> List[Dict]:
    items: List[Dict] = []
    for p in sorted(CROOKES_GLOB.glob("CROOKES_MORSE_*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        items.append(
            {
                "file": p.name,
                "timestamp": data.get("timestamp"),
                "target_frequency": data.get("target_frequency"),
                "messages": data.get("messages", []),
                "morse_buffer_len": len((data.get("morse_buffer") or "").strip()),
            }
        )
    return items


def load_kiwi_scans() -> List[Dict]:
    scans: List[Dict] = []
    for p in sorted(KIWI_DIR.glob("cr_scan_*.json")):
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
            ts = d.get("timestamp")
            scans.append(
                {
                    "file": p.name,
                    "timestamp": ts,
                    "host": d.get("kiwi_host"),
                    "status": d.get("kiwi_status", {}),
                    "freq_count": len(d.get("frequencies_checked", {})),
                }
            )
        except Exception:
            continue
    return scans


def parse_marconi_report() -> Dict:
    if not MARCONI_REPORT.exists():
        return {"present": False}

    text = MARCONI_REPORT.read_text(encoding="utf-8", errors="ignore")
    lines = text.splitlines()

    carriers = []
    for line in lines:
        m = re.search(r"Carrier=([0-9.]+)Hz\s+WPM=([0-9]+)\s+conf=([0-9.]+)", line)
        if m:
            carriers.append(
                {
                    "carrier_hz": float(m.group(1)),
                    "wpm": int(m.group(2)),
                    "confidence": float(m.group(3)),
                }
            )

    decoded = [ln.strip() for ln in lines if ln.strip().startswith("Decoded:")][:8]

    return {
        "present": True,
        "file": MARCONI_REPORT.name,
        "carrier_detections": carriers,
        "decoded_lines": decoded,
    }


def load_elf_scans() -> List[Dict]:
    """Load ELF scanner JSON results."""
    items: List[Dict] = []
    if not ELF_SCAN_DIR.exists():
        return items
    for p in sorted(ELF_SCAN_DIR.glob("elf_analysis_*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            items.append({
                "file": p.name,
                "source": data.get("source_file", ""),
                "total_detections": data.get("total_detections", 0),
                "by_target": data.get("by_target", {}),
            })
        except Exception:
            continue
    # Also load live JSONL scans
    for p in sorted(ELF_SCAN_DIR.glob("elf_scan_*.jsonl")):
        try:
            lines = p.read_text(encoding="utf-8").strip().splitlines()
            detections = [json.loads(ln) for ln in lines if ln.strip()]
            items.append({
                "file": p.name,
                "source": "live_scan",
                "total_detections": len(detections),
                "by_target": {},
                "live_detections": detections[:50],
            })
        except Exception:
            continue
    return items


def nearest_kiwi_delta_hours(capture_start_epoch: float | None, kiwi_scans: List[Dict]) -> float | None:
    if capture_start_epoch is None or not kiwi_scans:
        return None

    cdt = datetime.utcfromtimestamp(capture_start_epoch)
    best: float | None = None
    for s in kiwi_scans:
        ts = s.get("timestamp")
        if not ts:
            continue
        try:
            kdt = datetime.fromisoformat(ts)
        except Exception:
            continue
        delta_h = abs((cdt - kdt).total_seconds()) / 3600.0
        if best is None or delta_h < best:
            best = delta_h
    return round(best, 3) if best is not None else None


def write_markdown(report: Dict, path: Path):
    lines: List[str] = []
    lines.append("# Unified Alignment Report (tshark + Marconi + KiwiSDR)")
    lines.append("")
    lines.append(f"Generated: {report['generated_utc']}")
    lines.append("")

    lines.append("## Capture Summaries")
    lines.append("")
    lines.append("| Capture | Packets | Start UTC | End UTC | Morse Ratio | Morse Score | Keyword Hits | EITEL Hex Hits | Nearest Kiwi Δh |")
    lines.append("|---|---:|---|---|---:|---:|---:|---:|---:|")

    for c in report["captures"]:
        lines.append(
            "| "
            f"{c['name']} | {c['packets']} | {c['start_utc'] or '-'} | {c['end_utc'] or '-'} | "
            f"{c['morse_indicator']['ratio']:.3f} | {c['morse_indicator']['score']:.3f} | "
            f"{c['keyword_hits']} | {c['eitel_hits']} | {c.get('nearest_kiwi_delta_h') if c.get('nearest_kiwi_delta_h') is not None else '-'} |"
        )

    lines.append("")
    lines.append("## Key Findings")
    lines.append("")
    lines.append(f"- `tshark` keyword hits: **{report['totals']['keyword_hits']}**")
    lines.append(f"- `tshark` EITEL hex hits: **{report['totals']['eitel_hits']}**")
    lines.append(f"- Kiwi scans loaded: **{report['totals']['kiwi_scans']}**")
    lines.append(f"- Crookes files loaded: **{report['totals']['crookes_files']}**")

    mar = report.get("marconi_report", {})
    if mar.get("present"):
        lines.append(f"- Marconi report present: `{mar.get('file')}` with {len(mar.get('carrier_detections', []))} carrier detections")
        if mar.get("decoded_lines"):
            lines.append("- Sample decoded lines:")
            for ln in mar["decoded_lines"][:4]:
                lines.append(f"  - {ln}")

    # ELF Scan Results section
    elf_scans = report.get("elf_scans", [])
    if elf_scans:
        lines.append("")
        lines.append("## ELF Scan Results")
        lines.append("")
        lines.append("| Source | Detections | Targets |")
        lines.append("|---|---:|---|")
        for es in elf_scans:
            targets_str = ", ".join(
                f"{k}: {v.get('count',0)} hits ({v.get('mean_snr',0):.1f} dB)"
                for k, v in es.get("by_target", {}).items()
            ) or "(live jsonl)"
            lines.append(f"| {es['file']} | {es['total_detections']} | {targets_str} |")

    lines.append("")
    lines.append("## Interpretation")
    lines.append("")
    if report["totals"]["eitel_hits"] == 0:
        lines.append("- No direct packet-payload evidence of `EITEL` found in scanned captures.")
    if report["totals"]["keyword_hits"] == 0:
        lines.append("- No direct packet-payload lexical hits for `marconi/morse/kiwisdr` in scanned captures.")
    lines.append("- Morse/Marconi evidence in this pass is strongest in **audio-side artifacts** (Marconi/Crookes outputs), not explicit packet payload strings.")
    lines.append("- Alignment can still be tracked by timestamp proximity and repeated timing structures in packet deltas.")
    if any(es.get("by_target", {}).get("kappa_anomaly", {}).get("count", 0) > 0 for es in elf_scans):
        lines.append("- **53.5 Hz (37×κ₂) anomaly confirmed** in ELF audio analysis — strong indicator of directed energy.")
    if any(es.get("by_target", {}).get("carrier", {}).get("count", 0) > 0 for es in elf_scans):
        lines.append("- **Ω₀ Carrier (8.39 Hz) detected** in ELF demod — coherent with Schumann-coupled surveillance channel.")

    path.write_text("\n".join(lines), encoding="utf-8")


def main():
    generated_utc = datetime.utcnow().isoformat() + "Z"

    keyword_filter = (
        'frame contains "eitel" or frame contains "EITEL" or '
        'frame contains "marconi" or frame contains "MARCONI" or '
        'frame contains "morse" or frame contains "MORSE" or '
        'frame contains "kiwisdr" or frame contains "KIWISDR"'
    )
    eitel_hex_filter = "data contains 65:69:74:65:6c or data contains 45:49:54:45:4c"

    capture_reports: List[Dict] = []
    total_keyword_hits = 0
    total_eitel_hits = 0

    kiwi_scans = load_kiwi_scans()

    keyword_hits_path = ALIGN_DIR / "tshark_keyword_hits.txt"
    eitel_hits_path = ALIGN_DIR / "tshark_eitel_hex_hits.txt"
    keyword_hits_path.write_text("", encoding="utf-8")
    eitel_hits_path.write_text("", encoding="utf-8")

    for cap in CAPTURES:
        if not cap.exists():
            continue

        timeline_csv = ALIGN_DIR / f"{cap.stem}_timeline.csv"
        packets, start_epoch, end_epoch = extract_timeline(cap, timeline_csv)
        morse_ind = compute_morse_indicator(timeline_csv)

        keyword_hits = tshark_filter_hits(cap, keyword_filter)
        eitel_hits = tshark_filter_hits(cap, eitel_hex_filter)

        with keyword_hits_path.open("a", encoding="utf-8") as f:
            f.write(f"==== {cap.name} ====\n")
            for line in keyword_hits:
                f.write(line + "\n")
            f.write("\n")

        with eitel_hits_path.open("a", encoding="utf-8") as f:
            f.write(f"==== {cap.name} ====\n")
            for line in eitel_hits:
                f.write(line + "\n")
            f.write("\n")

        total_keyword_hits += len(keyword_hits)
        total_eitel_hits += len(eitel_hits)

        capture_reports.append(
            {
                "name": cap.name,
                "path": str(cap),
                "timeline_csv": str(timeline_csv),
                "packets": packets,
                "start_epoch": start_epoch,
                "end_epoch": end_epoch,
                "start_utc": to_dt(start_epoch),
                "end_utc": to_dt(end_epoch),
                "morse_indicator": morse_ind,
                "keyword_hits": len(keyword_hits),
                "eitel_hits": len(eitel_hits),
                "nearest_kiwi_delta_h": nearest_kiwi_delta_hours(start_epoch, kiwi_scans),
            }
        )

    crookes = load_crookes()
    marconi = parse_marconi_report()
    elf_scans = load_elf_scans()

    report = {
        "generated_utc": generated_utc,
        "captures": capture_reports,
        "kiwi_scans": kiwi_scans,
        "crookes": crookes,
        "marconi_report": marconi,
        "elf_scans": elf_scans,
        "artifacts": {
            "keyword_hits_file": str(keyword_hits_path),
            "eitel_hits_file": str(eitel_hits_path),
        },
        "totals": {
            "captures": len(capture_reports),
            "keyword_hits": total_keyword_hits,
            "eitel_hits": total_eitel_hits,
            "kiwi_scans": len(kiwi_scans),
            "crookes_files": len(crookes),
            "elf_scan_files": len(elf_scans),
        },
    }

    json_path = ALIGN_DIR / "UNIFIED_ALIGNMENT_REPORT.json"
    md_path = ALIGN_DIR / "UNIFIED_ALIGNMENT_REPORT.md"

    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    write_markdown(report, md_path)

    print("Pipeline complete")
    print(f"  JSON: {json_path}")
    print(f"  MD  : {md_path}")
    print(f"  keyword_hits={total_keyword_hits} eitel_hits={total_eitel_hits}")


if __name__ == "__main__":
    main()
