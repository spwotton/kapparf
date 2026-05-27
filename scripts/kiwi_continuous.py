#!/usr/bin/env python3
"""
Long-running KiwiSDR capture loop.
Cycles through the priority frequency list, recording short IQ/audio snapshots
from any reachable public node. Writes WAV + metadata to signal_forensics/kiwi_raw_captures/.

Designed to run for hours unattended. Exits cleanly on SIGINT.
"""
import os, sys, json, time, signal, asyncio, struct
from pathlib import Path
from datetime import datetime
import numpy as np
import soundfile as sf

try:
    import websockets
except ImportError:
    print("websockets missing"); sys.exit(1)
try:
    import requests
except ImportError:
    print("requests missing"); sys.exit(1)

OUT = Path("signal_forensics/kiwi_raw_captures"); OUT.mkdir(parents=True, exist_ok=True)

# Candidate public KiwiSDR nodes (ordered by Costa Rica proximity)
NODES = [
    ("ti0rc.proxy.kiwisdr.com", 8073),
    ("kiwi.radioscanusa.com",   8073),
    ("hb9ryz-1.proxy.kiwisdr.com", 8073),
    ("kiwi.scheveld.nl",        8073),
    ("kiwisdr.tunbridge.com",   8073),
]

FREQS = [
    (1234,  "am",  "TR069_numeric"),
    (4687,  "am",  "DSP_x100"),
    (7410,  "am",  "Mora_SUTEL"),
    (9375,  "am",  "DSP_x200"),
    (6925,  "am",  "pirate"),
    (3900,  "lsb", "80m"),
    (7200,  "lsb", "40m"),
    (14200, "usb", "20m"),
    (8992,  "usb", "USAF_HFGCS"),
    (11175, "usb", "USAF_Andrews"),
    (27025, "am",  "CB6"),
    (27185, "am",  "CB19"),
    (60,    "am",  "WWVB_LF"),  # may not tune below LF on most nodes
]

CAPTURE_SECS = 6
PAUSE_BETWEEN = 2
SAMPLE_RATE = 12000  # KiwiSDR default decimated audio rate

stop_flag = False
def handle_sig(*a):
    global stop_flag
    stop_flag = True
    print("\n[kiwi-cont] SIGINT received — finishing current capture then exiting")
signal.signal(signal.SIGINT, handle_sig)
signal.signal(signal.SIGTERM, handle_sig)

def probe_node(host, port):
    try:
        r = requests.get(f"http://{host}:{port}/status", timeout=5)
        if r.status_code != 200: return False
        return "name=" in r.text or "users=" in r.text
    except Exception:
        return False

async def capture_one(host, port, freq_khz, mode, note, session_dir):
    uri = f"ws://{host}:{port}/kiwi/{int(time.time())}/SND"
    samples = []
    try:
        async with websockets.connect(uri, ping_interval=None, max_size=2**22) as ws:
            # Handshake
            await ws.send(f"SET auth t=kiwi p=#")
            await ws.send(f"SET AR OK in=12000 out=44100")
            await ws.send(f"SET mod={mode} low_cut=-3000 high_cut=3000 freq={freq_khz}")
            await ws.send(f"SET agc=1 hang=0 thresh=-100 slope=6 decay=1000 manGain=0")
            await ws.send(f"SET squelch=0 max=0")
            await ws.send(f"SET lms_autonotch=0")
            await ws.send(f"SET genattn=0")
            await ws.send(f"SET gen=0 mix=-1")
            t_end = time.time() + CAPTURE_SECS
            while time.time() < t_end:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=3.0)
                except asyncio.TimeoutError:
                    break
                if isinstance(msg, bytes) and len(msg) > 20 and msg[:3] == b"SND":
                    # 10-byte header then int16 LE samples
                    body = msg[10:]
                    n = len(body) // 2
                    if n > 0:
                        arr = np.frombuffer(body, dtype="<i2", count=n).astype(np.float32) / 32768.0
                        samples.append(arr)
    except Exception as e:
        return {"freq_khz": freq_khz, "mode": mode, "note": note, "error": str(e), "host": host}
    if not samples:
        return {"freq_khz": freq_khz, "mode": mode, "note": note, "error": "no_audio", "host": host}
    audio = np.concatenate(samples)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    fn = session_dir / f"kiwi_{freq_khz}kHz_{mode}_{ts}.wav"
    sf.write(fn, audio, SAMPLE_RATE)
    return {"freq_khz": freq_khz, "mode": mode, "note": note, "host": host,
            "file": str(fn), "samples": int(len(audio)),
            "duration_s": round(len(audio) / SAMPLE_RATE, 2),
            "rms": round(float(np.sqrt(np.mean(audio*audio))), 5)}

async def main():
    session = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_dir = OUT / f"session_{session}"
    session_dir.mkdir(parents=True, exist_ok=True)
    log_path = session_dir / "session_log.jsonl"
    print(f"[kiwi-cont] session dir: {session_dir}")

    # Pick first reachable node
    active_host = None
    for host, port in NODES:
        print(f"[kiwi-cont] probing {host}:{port} ...")
        if probe_node(host, port):
            active_host = (host, port)
            print(f"[kiwi-cont] using {host}:{port}")
            break
    if not active_host:
        print("[kiwi-cont] NO public node reachable — exiting")
        return

    cycle = 0
    while not stop_flag:
        cycle += 1
        print(f"[kiwi-cont] === cycle {cycle} ===")
        for fk, md, note in FREQS:
            if stop_flag: break
            r = await capture_one(active_host[0], active_host[1], fk, md, note, session_dir)
            with open(log_path, "a") as fp:
                fp.write(json.dumps({"cycle": cycle, **r}) + "\n")
            print(f"  {fk:>6}kHz {md:>3} {note:<16} -> {r.get('file','ERR') if 'file' in r else r.get('error')}")
            await asyncio.sleep(PAUSE_BETWEEN)
        # Re-probe node between cycles
        if not probe_node(active_host[0], active_host[1]):
            print(f"[kiwi-cont] {active_host[0]} dropped; rescanning")
            for host, port in NODES:
                if probe_node(host, port):
                    active_host = (host, port); break
    print(f"[kiwi-cont] session ended at cycle {cycle}")

if __name__ == "__main__":
    asyncio.run(main())
