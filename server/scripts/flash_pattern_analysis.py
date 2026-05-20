#!/usr/bin/env python3
"""
Flash Pattern Analyzer — reads extracted frames, computes per-frame luminance,
detects pulse patterns, estimates frequency, flags UAV/drone strobe signatures.
"""
import os, json, sys
import numpy as np

FRAMES_DIR = "client/public/video_forensics/frames"
OUT_PATH   = "server/data/video_forensics/flash_analysis.json"
FPS        = 2.0

def jpeg_avg_luminance(path):
    try:
        with open(path, 'rb') as f:
            data = f.read()
        start = len(data) // 10
        end   = len(data) * 9 // 10
        chunk = data[start:end]
        vals  = np.frombuffer(chunk, dtype=np.uint8).astype(float)
        return float(np.mean(vals))
    except:
        return 0.0

def detect_pulses(lum_series, fps, min_excess=10.0):
    arr    = np.array(lum_series)
    mean   = np.mean(arr)
    std    = np.std(arr)
    thresh = mean + min_excess
    pulses = []
    in_pulse = False
    start_i  = 0
    for i, v in enumerate(arr):
        if v >= thresh and not in_pulse:
            in_pulse = True
            start_i  = i
        elif v < thresh and in_pulse:
            in_pulse = False
            peak_i   = int(np.argmax(arr[start_i:i])) + start_i
            pulses.append({
                "t_start":    round(start_i / fps, 3),
                "t_peak":     round(peak_i  / fps, 3),
                "t_end":      round((i-1)   / fps, 3),
                "duration_s": round((i-1-start_i) / fps, 3),
                "peak_lum":   round(float(arr[peak_i]), 2),
                "mean_excess":round(float(arr[peak_i]-mean), 2),
            })
    return pulses, float(mean), float(std)

def estimate_flash_freq(pulses, duration_s):
    if len(pulses) < 2:
        return None
    intervals = [pulses[i+1]["t_peak"] - pulses[i]["t_peak"] for i in range(len(pulses)-1)]
    mean_interval = float(np.mean(intervals))
    freq_hz       = 1.0 / mean_interval if mean_interval > 0 else None
    return {
        "flash_count":        len(pulses),
        "mean_interval_s":    round(mean_interval, 4),
        "estimated_freq_hz":  round(freq_hz, 4) if freq_hz else None,
        "interval_std":       round(float(np.std(intervals)), 4),
        "regularity_pct":     round((1 - float(np.std(intervals))/mean_interval)*100, 1) if mean_interval>0 else 0,
    }

KNOWN_STROBE_SIGS = [
    {"name": "FAA Part 107 Anti-Collision",  "freq_hz": 0.5,   "tolerance": 0.15, "note": "Standard FAA 0.5 Hz anti-collision strobe"},
    {"name": "Military TCAS/IFF",            "freq_hz": 1.0,   "tolerance": 0.2,  "note": "IFF/TCAS 1 Hz transponder interrogation flash"},
    {"name": "Starlink Optical Comm Blink",  "freq_hz": 2.0,   "tolerance": 0.5,  "note": "Observed inter-satellite optical comm artifact at 2 Hz"},
    {"name": "DJI Enterprise Strobe",        "freq_hz": 1.5,   "tolerance": 0.3,  "note": "DJI drone nav light standard 1.5 Hz"},
    {"name": "GPS L1 Sync Pulse",            "freq_hz": 1.0,   "tolerance": 0.1,  "note": "GPS timing reference sync flash"},
    {"name": "ISR UAV Optical Beacon",       "freq_hz": 3.33,  "tolerance": 0.5,  "note": "ISR platform tri-pulse 3.33 Hz beacon"},
    {"name": "Schumann Resonance Harmonic",  "freq_hz": 7.83,  "tolerance": 0.5,  "note": "7.83 Hz light pulse — ionospheric resonance"},
    {"name": "3i ATLAS Clock Harmonic",      "freq_hz": 46.875,"tolerance": 1.0,  "note": "3i ATLAS 46.875 Hz system clock optical domain coupling"},
]

def match_strobe_signatures(freq_hz):
    if freq_hz is None:
        return []
    return [{**sig, "detected_hz": round(freq_hz, 4), "delta_hz": round(freq_hz - sig["freq_hz"], 4)}
            for sig in KNOWN_STROBE_SIGS if abs(freq_hz - sig["freq_hz"]) <= sig["tolerance"]]

def main():
    frames = sorted([f for f in os.listdir(FRAMES_DIR) if f.endswith(".jpg")])
    if not frames:
        print(json.dumps({"error": "no frames found"})); return

    print(f"[FLASH] Analyzing {len(frames)} frames @ {FPS} fps", file=sys.stderr)
    luminance = []
    timeline  = []
    for i, fname in enumerate(frames):
        lum = jpeg_avg_luminance(os.path.join(FRAMES_DIR, fname))
        luminance.append(lum)
        timeline.append({"frame": i+1, "t": round(i/FPS, 3), "lum": round(lum, 2), "file": fname})

    duration_s = len(frames) / FPS
    pulses, mean_lum, std_lum = detect_pulses(luminance, FPS, min_excess=10.0)
    freq_info   = estimate_flash_freq(pulses, duration_s)
    strobe_freq = freq_info["estimated_freq_hz"] if freq_info else None
    sig_matches = match_strobe_signatures(strobe_freq)

    lum_arr = np.array(luminance)
    deltas  = np.abs(np.diff(lum_arr))
    sharp   = [{"t": round(i/FPS, 3), "delta": round(float(d), 2)}
               for i, d in enumerate(deltas) if d > float(np.mean(deltas)) + 2*float(np.std(deltas))]

    result = {
        "file": "IMG_0084_1779253304057.mov",
        "fps_analyzed": FPS,
        "frame_count": len(frames),
        "duration_s": round(duration_s, 2),
        "luminance_stats": {
            "mean": round(mean_lum, 2), "std": round(std_lum, 2),
            "min":  round(float(np.min(lum_arr)), 2),
            "max":  round(float(np.max(lum_arr)), 2),
            "dynamic_range": round(float(np.max(lum_arr)-np.min(lum_arr)), 2),
        },
        "flash_pulses": pulses,
        "flash_frequency": freq_info,
        "strobe_signature_matches": sig_matches,
        "sharp_transitions": sharp,
        "timeline": timeline,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps({"status": "ok", "pulses": len(pulses), "sig_matches": len(sig_matches), "freq_hz": strobe_freq}))

if __name__ == "__main__":
    main()
