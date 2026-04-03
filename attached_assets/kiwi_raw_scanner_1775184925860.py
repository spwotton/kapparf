#!/usr/bin/env python3
"""
🌀 RAW KIWISDR SCANNER — No Browser, No Chrome, No Trust Chain
================================================================
Pure Python WebSocket + HTTP. Talks KiwiSDR protocol directly.
Captures waterfall data, audio snapshots, S-meter readings.
Zero browser dependencies. Zero service workers. Zero attack surface.

Usage: py kiwi_raw_scanner.py
"""

import asyncio
import json
import struct
import time
import numpy as np
from datetime import datetime
from pathlib import Path

try:
    import websockets
except ImportError:
    print("Need: py -m pip install websockets")
    exit(1)

try:
    import requests
except ImportError:
    print("Need: py -m pip install requests")
    exit(1)

# ── Config ──────────────────────────────────────────────────
KIWI_HOST = "ti0rc.proxy.kiwisdr.com"
KIWI_PORT = 8073
KIWI_WS = f"ws://{KIWI_HOST}:{KIWI_PORT}/kiwi"
KIWI_HTTP = f"http://{KIWI_HOST}:{KIWI_PORT}"

OUTPUT_DIR = Path("signal_forensics/kiwi_raw_captures")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

CAPTURE_SECONDS = 5  # seconds of audio per frequency

# Priority freqs (kHz) — same targets as the selenium scanner
PRIORITY_FREQS = [
    (1234, "am",  "TR-069 correlation"),
    (4687, "am",  "46.875Hz harmonic x100"),
    (7410, "am",  "Pirate radio"),
    (6925, "am",  "Pirate radio"),
    (3900, "lsb", "80m SSB"),
    (7200, "lsb", "40m SSB"),
    (14200, "usb", "20m SSB"),
    (27025, "am",  "CB Channel 6"),
    (27185, "am",  "CB Channel 19"),
    (8992, "usb",  "USAF HFGCS primary"),
    (11175, "usb", "USAF HFGCS Andrews"),
]

# ── KiwiSDR Protocol Messages ──────────────────────────────
def make_msg(cmd: str) -> bytes:
    """Encode a KiwiSDR text command."""
    return cmd.encode("ascii")


async def capture_frequency(freq_khz, mode, note, session_dir):
    """Connect to KiwiSDR via WebSocket and capture audio + waterfall data."""
    result = {
        "frequency_khz": freq_khz,
        "mode": mode,
        "note": note,
        "timestamp": datetime.now().isoformat(),
        "status": "pending",
    }

    uri = f"{KIWI_WS}/{freq_khz}/{mode}"
    print(f"  📡 {freq_khz:>7} kHz ({mode:>3}) — {note}")

    try:
        async with websockets.connect(
            KIWI_WS,
            ping_interval=None,
            close_timeout=5,
            max_size=2**20,
            open_timeout=10,
        ) as ws:
            # KiwiSDR handshake
            await ws.send(make_msg("SET auth t=kiwi p=#"))
            await ws.send(make_msg(f"SET mod={mode} low_cut=-6000 high_cut=6000 freq={freq_khz}"))
            await ws.send(make_msg("SET agc=1 hang=0 thresh=-100 slope=6 decay=1000 manGain=50"))
            await ws.send(make_msg("SET compression=0"))
            await ws.send(make_msg("SET OVERRIDE inactivity_timeout=0"))
            await ws.send(make_msg("SET AR OK in=12000 out=44100"))
            # Request waterfall
            await ws.send(make_msg("SET wf_speed=1 wf_comp=0 zoom=0 start=0"))

            audio_chunks = []
            wf_lines = []
            smeter_readings = []
            start = time.time()
            msg_count = 0

            while time.time() - start < CAPTURE_SECONDS:
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=3)
                except asyncio.TimeoutError:
                    break

                msg_count += 1

                if isinstance(raw, bytes) and len(raw) > 3:
                    tag = raw[:3]

                    # SND — audio samples
                    if tag == b"SND":
                        # Header: 3-byte tag + flags + sequence + smeter(2) + rssi(2)
                        if len(raw) > 7:
                            smeter_val = struct.unpack(">H", raw[5:7])[0] if len(raw) > 6 else 0
                            smeter_db = (smeter_val / 10.0) - 127.0
                            smeter_readings.append(smeter_db)
                            audio_data = raw[7:]
                            audio_chunks.append(audio_data)

                    # W/F — waterfall line
                    elif tag == b"W/F" or raw[:2] == b"WF":
                        wf_lines.append(raw[3:] if tag == b"W/F" else raw[2:])

                    # MSG — text messages from server
                    elif tag == b"MSG":
                        text = raw[3:].decode("ascii", errors="replace")
                        # Silently consume status messages

            elapsed = time.time() - start

            # ── Process Audio ──
            if audio_chunks:
                all_audio = b"".join(audio_chunks)
                # KiwiSDR sends 16-bit signed PCM (little-endian) at 12kHz
                if len(all_audio) >= 2:
                    samples = np.frombuffer(all_audio, dtype=np.int16).astype(np.float32)
                    samples /= 32768.0

                    # FFT
                    sr = 12000
                    fft = np.fft.rfft(samples)
                    freqs = np.fft.rfftfreq(len(samples), 1 / sr)
                    mag = np.abs(fft)

                    # Top 20 peaks
                    peak_indices = np.argsort(mag)[-20:][::-1]
                    peaks = []
                    for idx in peak_indices:
                        if mag[idx] > 0:
                            peaks.append({
                                "freq_hz": round(float(freqs[idx]), 2),
                                "magnitude": round(float(mag[idx]), 2),
                                "snr": round(float(mag[idx] / (np.median(mag) + 1e-10)), 1),
                            })

                    # Save raw audio
                    audio_path = session_dir / f"{freq_khz}kHz_{mode}_audio.npy"
                    np.save(str(audio_path), samples)

                    result["audio"] = {
                        "samples": len(samples),
                        "duration_s": round(len(samples) / sr, 2),
                        "peak_amplitude": round(float(np.max(np.abs(samples))), 4),
                        "rms": round(float(np.sqrt(np.mean(samples**2))), 6),
                        "top_peaks": peaks[:10],
                        "saved": str(audio_path),
                    }

            # ── Process S-Meter ──
            if smeter_readings:
                arr = np.array(smeter_readings)
                result["smeter"] = {
                    "mean_dBm": round(float(np.mean(arr)), 1),
                    "max_dBm": round(float(np.max(arr)), 1),
                    "min_dBm": round(float(np.min(arr)), 1),
                    "std": round(float(np.std(arr)), 2),
                    "readings": len(smeter_readings),
                }

            # ── Process Waterfall ──
            if wf_lines:
                # Save raw waterfall data
                wf_path = session_dir / f"{freq_khz}kHz_{mode}_waterfall.npy"
                wf_array = []
                for line in wf_lines:
                    if len(line) > 0:
                        wf_array.append(np.frombuffer(line[:1024], dtype=np.uint8))
                if wf_array:
                    # Pad to uniform length
                    max_len = max(len(w) for w in wf_array)
                    padded = [np.pad(w, (0, max_len - len(w))) for w in wf_array]
                    wf_matrix = np.array(padded)
                    np.save(str(wf_path), wf_matrix)
                    result["waterfall"] = {
                        "lines": len(wf_array),
                        "bins": max_len,
                        "saved": str(wf_path),
                    }

            result["status"] = "captured"
            result["messages_received"] = msg_count
            result["elapsed_s"] = round(elapsed, 2)

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        print(f"    ❌ {e}")

    return result


async def check_kiwi_status():
    """Quick WebSocket probe — is the KiwiSDR alive?"""
    try:
        async with websockets.connect(
            KIWI_WS, ping_interval=None, close_timeout=3, open_timeout=12
        ) as ws:
            await ws.send(make_msg("SET auth t=kiwi p=#"))
            raw = await asyncio.wait_for(ws.recv(), timeout=8)
            return {"online": True, "first_msg_len": len(raw)}
    except Exception as e:
        # Fallback: try HTTP
        try:
            r = requests.get(f"{KIWI_HTTP}/status", timeout=10)
            return {"online": True, "via": "http", "status": r.text[:300]}
        except Exception as e2:
            return {"online": False, "ws_error": str(e), "http_error": str(e2)}


async def run_scan():
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_dir = OUTPUT_DIR / ts
    session_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print(f"  🌀 RAW KIWISDR SCANNER — {ts}")
    print(f"  No browser. No Chrome. No service workers.")
    print(f"  Target: {KIWI_HOST}:{KIWI_PORT}")
    print(f"  Output: {session_dir}")
    print("=" * 65)

    # Status check
    print("\n🔍 Checking KiwiSDR status...")
    status = await check_kiwi_status()
    if status.get("online"):
        print(f"  ✅ Online")
    else:
        print(f"  ❌ Offline: {status.get('error')}")
        print("  Aborting.")
        return

    # Scan
    print(f"\n📡 Scanning {len(PRIORITY_FREQS)} frequencies ({CAPTURE_SECONDS}s each)...")
    print("-" * 65)

    all_results = []
    for freq, mode, note in PRIORITY_FREQS:
        result = await capture_frequency(freq, mode, note, session_dir)
        all_results.append(result)

        # Brief summary line
        if result["status"] == "captured":
            smeter = result.get("smeter", {})
            audio = result.get("audio", {})
            s_str = f"S-meter: {smeter.get('mean_dBm', '?')} dBm" if smeter else "no S-meter"
            a_str = f"audio: {audio.get('duration_s', 0)}s" if audio else "no audio"
            print(f"    ✅ {s_str} | {a_str} | {result.get('messages_received', 0)} msgs")
        # Small delay to avoid hammering the SDR
        await asyncio.sleep(0.5)

    print("-" * 65)

    # ── Summary ──
    captured = sum(1 for r in all_results if r["status"] == "captured")
    errors = sum(1 for r in all_results if r["status"] == "error")

    # Signal strength ranking
    ranked = sorted(
        [r for r in all_results if r.get("smeter")],
        key=lambda x: x["smeter"]["max_dBm"],
        reverse=True,
    )

    print(f"\n📊 RESULTS: {captured} captured, {errors} errors")
    if ranked:
        print("\n🔥 STRONGEST SIGNALS:")
        for r in ranked[:5]:
            sm = r["smeter"]
            print(f"  {r['frequency_khz']:>7} kHz — max {sm['max_dBm']:>6.1f} dBm  avg {sm['mean_dBm']:>6.1f} dBm  ({r['note']})")

    # Save report
    report = {
        "timestamp": ts,
        "kiwi_host": KIWI_HOST,
        "kiwi_status": status,
        "capture_seconds": CAPTURE_SECONDS,
        "frequencies_scanned": len(PRIORITY_FREQS),
        "captured": captured,
        "errors": errors,
        "results": all_results,
        "strongest": [
            {
                "freq_khz": r["frequency_khz"],
                "max_dBm": r["smeter"]["max_dBm"],
                "avg_dBm": r["smeter"]["mean_dBm"],
                "note": r["note"],
            }
            for r in ranked[:5]
        ] if ranked else [],
    }

    report_path = session_dir / "SCAN_REPORT.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n📁 Report: {report_path}")
    print("🔒 Done. No browsers were harmed.\n")


if __name__ == "__main__":
    asyncio.run(run_scan())
