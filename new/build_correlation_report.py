#!/usr/bin/env python3
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def latest(pattern: str) -> Path:
    matches = sorted(ROOT.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    if not matches:
        raise FileNotFoundError(f"No files for pattern: {pattern}")
    return matches[0]


def read_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def read_text(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def parse_dsp_metrics(report_text: str):
    wanted = {
        "infrasonic": r"Infrasonic 1–10 Hz:\s*\*\*(\d+\.\d+)\*\*",
        "theta": r"Theta 4–8 Hz:\s*\*\*(\d+\.\d+)\*\*",
        "schumann": r"Schumann 7–8 Hz:\s*\*\*(\d+\.\d+)\*\*",
        "elf": r"ELF 10–30 Hz:\s*\*\*(\d+\.\d+)\*\*",
        "hz53": r"53 Hz persistent band:\s*\*\*(\d+\.\d+)\*\*",
        "hz97": r"97 Hz drone band:\s*\*\*(\d+\.\d+)\*\*",
        "hz120": r"120 Hz harmonic band:\s*\*\*(\d+\.\d+)\*\*",
        "flicker": r"Flicker band \(100–130 Hz\):\s*\*\*(\d+\.\d+)\*\*",
        "ultra_mean": r"Mean:\s*\*\*(\d+\.\d+)\*\*",
        "ultra_max": r"Max:\s*\*\*(\d+\.\d+)\*\*",
    }
    out = {}
    for key, pat in wanted.items():
        m = re.search(pat, report_text)
        if m:
            out[key] = float(m.group(1))
    return out


def parse_network_iocs(report_text: str):
    macs = re.findall(r"`([0-9A-F]{2}(?::[0-9A-F]{2}){5})`", report_text)
    ips = re.findall(r"`((?:\d{1,3}\.){3}\d{1,3})`", report_text)
    return sorted(set(macs)), sorted(set(ips))


def build_rows(sat, kiwi, plan, dsp, macs, ips):
    visible_priorities = {x.get("priority_name", x.get("name", "")): x for x in sat.get("priority_targets", []) if x.get("visible")}
    kiwi_freqs = {int(r.get("frequency")) for r in kiwi.get("results", [])}
    suspect = {int(x) for x in plan.get("scan_config", {}).get("suspect_frequencies", [])}

    us_mil = sat.get("summary", {}).get("us_military_visible", 0)
    starlink = sat.get("summary", {}).get("starlink_visible", 0)

    rows = []

    # 1) Orbital pressure signature
    s1 = 0
    checks1 = {
        "DSP/ELF": "—",
        "Kiwi HF": "—",
        "Satellite": "✓" if us_mil >= 30 else "○",
        "Network": "—",
    }
    s1 += 35 if us_mil >= 30 else 10
    s1 += 20 if starlink >= 250 else 5
    s1 += 15 if any(k in visible_priorities for k in ["AEHF-4", "MUOS-5"]) else 0
    rows.append({
        "signature": "Orbital pressure window",
        "checks": checks1,
        "score": min(s1, 100),
        "evidence": f"US mil visible={us_mil}, Starlink visible={starlink}, AEHF/MUOS visible={any(k in visible_priorities for k in ['AEHF-4','MUOS-5'])}",
    })

    # 2) 46.875 harmonic chain
    s2 = 0
    hz53 = dsp.get("hz53", 0)
    checks2 = {
        "DSP/ELF": "✓" if hz53 >= 40 else "○",
        "Kiwi HF": "✓" if 4687 in kiwi_freqs else "○",
        "Satellite": "○",
        "Network": "○",
    }
    s2 += 40 if hz53 >= 40 else 15
    s2 += 35 if 4687 in kiwi_freqs else 0
    s2 += 10 if 9375 in suspect else 0
    s2 += 10 if 14062 in suspect else 0
    rows.append({
        "signature": "46.875 harmonic chain",
        "checks": checks2,
        "score": min(s2, 100),
        "evidence": f"DSP 53Hz={hz53:.2f}, Kiwi captured 4687={4687 in kiwi_freqs}, suspect includes 9375/14062={9375 in suspect and 14062 in suspect}",
    })

    # 3) HF irregular channels
    s3 = 0
    checks3 = {
        "DSP/ELF": "○" if dsp.get("hz97", 0) < 20 else "✓",
        "Kiwi HF": "✓" if ({7410, 6925} <= kiwi_freqs) else "○",
        "Satellite": "○",
        "Network": "○",
    }
    s3 += 60 if ({7410, 6925} <= kiwi_freqs) else 20
    s3 += 15 if dsp.get("hz97", 0) >= 20 else 0
    rows.append({
        "signature": "HF irregular-channel overlap",
        "checks": checks3,
        "score": min(s3, 100),
        "evidence": f"Kiwi captured 7410/6925={({7410, 6925} <= kiwi_freqs)}, DSP 97Hz={dsp.get('hz97',0):.2f}",
    })

    # 4) Local RF + network IOC
    s4 = 0
    checks4 = {
        "DSP/ELF": "✓" if dsp.get("flicker", 0) >= 50 else "○",
        "Kiwi HF": "✓" if 1234 in kiwi_freqs else "○",
        "Satellite": "○",
        "Network": "✓" if (len(macs) + len(ips)) > 0 else "○",
    }
    s4 += 35 if dsp.get("flicker", 0) >= 50 else 10
    s4 += 25 if 1234 in kiwi_freqs else 0
    s4 += 30 if (len(macs) + len(ips)) > 0 else 0
    rows.append({
        "signature": "Local RF + network IOC coupling",
        "checks": checks4,
        "score": min(s4, 100),
        "evidence": f"Flicker={dsp.get('flicker',0):.2f}, Kiwi 1234={1234 in kiwi_freqs}, MACs={len(macs)}, IPs={len(ips)}",
    })

    # 5) Harmonic distortion profile
    s5 = 0
    checks5 = {
        "DSP/ELF": "✓" if (dsp.get("hz120", 0) >= 70 and dsp.get("ultra_max", 0) >= 3.0) else "○",
        "Kiwi HF": "✓" if len(kiwi_freqs) >= 8 else "○",
        "Satellite": "—",
        "Network": "—",
    }
    s5 += 55 if (dsp.get("hz120", 0) >= 70 and dsp.get("ultra_max", 0) >= 3.0) else 20
    s5 += 25 if len(kiwi_freqs) >= 8 else 10
    rows.append({
        "signature": "Harmonic distortion profile",
        "checks": checks5,
        "score": min(s5, 100),
        "evidence": f"120Hz={dsp.get('hz120',0):.2f}, Ultrasonic max={dsp.get('ultra_max',0):.2f}, Kiwi captures={len(kiwi_freqs)}",
    })

    rows.sort(key=lambda r: r["score"], reverse=True)
    return rows


def to_markdown(ts, sat_path, kiwi_path, plan_path, report_path, rows):
    lines = []
    lines.append("# Correlation Matrix View")
    lines.append(f"Generated: {ts}")
    lines.append("")
    lines.append("## Sources")
    lines.append(f"- {sat_path.name}")
    lines.append(f"- {kiwi_path.name}")
    lines.append(f"- {plan_path.name}")
    lines.append(f"- {report_path.name}")
    lines.append("")
    lines.append("## Cross-Domain Signature Matrix")
    lines.append("| Signature | DSP/ELF | Kiwi HF | Satellite | Network | Score | Evidence |")
    lines.append("|---|---|---|---|---|---:|---|")
    for r in rows:
        c = r["checks"]
        lines.append(
            f"| {r['signature']} | {c['DSP/ELF']} | {c['Kiwi HF']} | {c['Satellite']} | {c['Network']} | **{r['score']}** | {r['evidence']} |"
        )
    lines.append("")
    lines.append("## Interpretation")
    lines.append("- Higher score = stronger overlap across independent domains.")
    lines.append("- A single-domain hit is weak; multi-domain overlap is the signal.")
    return "\n".join(lines)


def to_html(ts, rows):
    def color(score):
        if score >= 80:
            return "#8b0000"
        if score >= 60:
            return "#b35c00"
        if score >= 40:
            return "#6b6b00"
        return "#205020"

    row_html = []
    for r in rows:
        c = r["checks"]
        row_html.append(
            f"<tr><td>{r['signature']}</td><td>{c['DSP/ELF']}</td><td>{c['Kiwi HF']}</td><td>{c['Satellite']}</td><td>{c['Network']}</td><td style='background:{color(r['score'])};font-weight:700'>{r['score']}</td><td>{r['evidence']}</td></tr>"
        )

    return f"""<!doctype html>
<html><head><meta charset='utf-8'><title>Correlation Matrix</title>
<style>
body{{font-family:Segoe UI,Arial,sans-serif;background:#0b1020;color:#e6edf3;padding:20px}}
.card{{background:#11172a;border:1px solid #223;padding:16px;border-radius:10px;max-width:1400px}}
table{{width:100%;border-collapse:collapse}}
th,td{{border:1px solid #223;padding:8px;text-align:left}}
th{{background:#18213a}}
small{{color:#9fb0d0}}
</style></head><body>
<div class='card'>
<h1>Correlation Matrix View</h1>
<small>Generated {ts}</small>
<table>
<thead><tr><th>Signature</th><th>DSP/ELF</th><th>Kiwi HF</th><th>Satellite</th><th>Network</th><th>Score</th><th>Evidence</th></tr></thead>
<tbody>{''.join(row_html)}</tbody>
</table>
<p><small>Score emphasizes multi-domain overlap over any single indicator.</small></p>
</div></body></html>"""


def main():
    sat_path = latest("SATELLITE_REPORT_*.json")
    kiwi_path = latest("kiwisdr_screenshots/SCAN_RESULTS_*.json")
    plan_path = latest("kiwisdr_scans/SCAN_PLAN_*.json")
    report_path = latest("FINAL_PIPELINE_REPORT_*.md")

    sat = read_json(sat_path)
    kiwi = read_json(kiwi_path)
    plan = read_json(plan_path)
    report_text = read_text(report_path)

    dsp = parse_dsp_metrics(report_text)
    macs, ips = parse_network_iocs(report_text)

    rows = build_rows(sat, kiwi, plan, dsp, macs, ips)
    ts = datetime.now().isoformat(timespec="seconds")

    md = to_markdown(ts, sat_path, kiwi_path, plan_path, report_path, rows)
    html = to_html(ts, rows)

    out_md = ROOT / f"CORRELATION_MATRIX_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    out_html = ROOT / f"CORRELATION_MATRIX_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"

    out_md.write_text(md, encoding="utf-8")
    out_html.write_text(html, encoding="utf-8")

    print(f"Wrote: {out_md}")
    print(f"Wrote: {out_html}")


if __name__ == "__main__":
    main()
