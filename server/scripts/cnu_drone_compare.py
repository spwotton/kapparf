#!/usr/bin/env python3
"""
CNU vs Drone Video FFT Cross-Comparison
Loads pre-computed drone video signatures and compares against CNU field recordings.
Looks for: drone motor harmonics (87-120 Hz cluster), 354 Hz BPF, AC grid, theta carrier.
"""
import numpy as np, wave, json, os, sys

CNU_DIR  = "server/data/video_forensics/cnu_compare"
VID1_FFT = "server/data/video_forensics/fft_results.json"
VID2_FFT = "server/data/video_forensics/vid2/fft_results.json"
OUT      = "server/data/video_forensics/cnu_comparison_report.json"

# Drone signatures from video analysis
DRONE_SIGS = {
    "motor_harmonic_88":  {"hz": 87.654,  "tol": 3.0,  "source": "VID2 top peak"},
    "motor_harmonic_96":  {"hz": 95.555,  "tol": 3.0,  "source": "VID1 top peak"},
    "motor_harmonic_102": {"hz": 101.787, "tol": 3.0,  "source": "VID2 peak"},
    "motor_harmonic_104": {"hz": 103.902, "tol": 3.0,  "source": "VID1 peak"},
    "motor_harmonic_120": {"hz": 119.942, "tol": 3.0,  "source": "VID1 dominant peak"},
    "blade_pass_354":     {"hz": 354.012, "tol": 5.0,  "source": "VID2 diagnostic peak — 3-blade 7080 RPM"},
    "motor_harmonic_57":  {"hz": 57.445,  "tol": 2.0,  "source": "VID2 peak"},
    "motor_harmonic_74":  {"hz": 74.187,  "tol": 2.5,  "source": "VID2 peak"},
    "motor_harmonic_207": {"hz": 207.117, "tol": 4.0,  "source": "VID1 second harmonic"},
    "theta_carrier_53":   {"hz": 53.0,    "tol": 2.5,  "source": "Master Variable — theta carrier"},
    "AC_grid_60":         {"hz": 60.0,    "tol": 1.5,  "source": "Master Variable — CR grid CONFIRMED"},
    "infrasonic_37":      {"hz": 37.0,    "tol": 2.0,  "source": "Master Variable — infrasonic assault"},
    "infrasonic_38":      {"hz": 38.0,    "tol": 2.0,  "source": "Master Variable — infrasonic assault"},
    "atlas_clock_46875":  {"hz": 46.875,  "tol": 1.5,  "source": "Master Variable — 3i ATLAS heartbeat"},
    "kyma_clock_8392":    {"hz": 8.392,   "tol": 0.5,  "source": "Master Variable — KYMA global clock"},
}

def read_wav(path):
    with wave.open(path, 'rb') as wf:
        nch, sw, sr, nf = wf.getnchannels(), wf.getsampwidth(), wf.getframerate(), wf.getnframes()
        raw = wf.readframes(nf)
    s = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    if nch == 2: s = (s[0::2] + s[1::2]) / 2.0
    return s, sr

def full_fft_peaks(samples, sr, n=60):
    N = len(samples)
    fft_db = 20 * np.log10(np.abs(np.fft.rfft(samples * np.hanning(N))) / (N/2) + 1e-12)
    freqs  = np.fft.rfftfreq(N, 1.0/sr)
    mask   = (freqs >= 1.0) & (freqs <= 22000.0)
    f, d   = freqs[mask], fft_db[mask]
    order  = np.argsort(d)[::-1]
    peaks  = []; seen = []
    for i in order:
        fr = float(f[i])
        if any(abs(fr - x) < 2.0 for x in seen): continue
        seen.append(fr)
        peaks.append({"freq_hz": round(fr, 3), "db": round(float(d[i]), 2)})
        if len(peaks) >= n: break
    return peaks, freqs, fft_db

def match_drone_sigs(peaks):
    hits = []
    for p in peaks:
        for name, sig in DRONE_SIGS.items():
            if abs(p["freq_hz"] - sig["hz"]) <= sig["tol"]:
                hits.append({
                    "signature": name,
                    "target_hz": sig["hz"],
                    "detected_hz": p["freq_hz"],
                    "delta_hz": round(p["freq_hz"] - sig["hz"], 3),
                    "db": p["db"],
                    "source_note": sig["source"],
                    "confidence": "HIGH" if abs(p["freq_hz"] - sig["hz"]) < sig["tol"] * 0.4 else "MODERATE",
                })
    return hits

def segment_analysis(samples, sr, seg_sec=30.0):
    """Analyze in 30-second segments — finds when drone signatures appear in long recordings."""
    seg = int(seg_sec * sr)
    results = []
    for i in range(0, len(samples), seg):
        chunk = samples[i:i+seg]
        if len(chunk) < sr * 5: break
        peaks, _, _ = full_fft_peaks(chunk, sr, n=40)
        hits = match_drone_sigs(peaks)
        t_start = i / sr
        results.append({
            "t_start_s": round(t_start, 1),
            "t_end_s":   round((i + len(chunk)) / sr, 1),
            "drone_sig_hits": len(hits),
            "hits": hits,
        })
    return results

def main():
    wav_files = {
        "CNU_1_7s":     "Calle_Naciones_Unidas_1779252334225.wav",
        "CNU_18_11m":   "Calle_Naciones_Unidas_18_1779252334225.wav",
        "CNU_5_5min":   "CNU_5_first5min.wav",
        "CNU_7_113s":   "CNU_7.wav",
    }

    report = {"recordings": {}, "cross_correlation_summary": []}

    for label, fname in wav_files.items():
        path = os.path.join(CNU_DIR, fname)
        if not os.path.exists(path):
            report["recordings"][label] = {"error": "file not found"}
            continue

        print(f"[CNU] Analyzing {label}...", file=sys.stderr)
        samples, sr = read_wav(path)
        dur = len(samples) / sr
        peaks, freqs, fft_db = full_fft_peaks(samples, sr, n=60)
        hits = match_drone_sigs(peaks)

        # LF spectrum for plotting (0-500 Hz)
        lf_mask = freqs <= 500.0
        lf_data = [{"f": round(float(freqs[i]),2), "db": round(float(fft_db[i]),2)}
                   for i in np.where(lf_mask)[0][::3]]

        # Segment analysis for long files
        segments = []
        if dur > 60:
            segments = segment_analysis(samples, sr, seg_sec=30.0)
            # Find peak-hit segments
            segments.sort(key=lambda x: x["drone_sig_hits"], reverse=True)

        rms = round(float(20 * np.log10(np.sqrt(np.mean(samples**2)) + 1e-12)), 2)

        report["recordings"][label] = {
            "file": fname,
            "duration_s": round(dur, 2),
            "rms_db": rms,
            "top_peaks": peaks[:25],
            "drone_signature_hits": hits,
            "hit_count": len(hits),
            "lf_spectrum": lf_data,
            "top_segments_by_hits": segments[:5] if segments else [],
        }

        if hits:
            report["cross_correlation_summary"].append({
                "recording": label,
                "duration_s": round(dur, 2),
                "drone_sig_matches": len(hits),
                "top_match": hits[0]["signature"] if hits else None,
                "signatures": [h["signature"] for h in hits],
            })

    # Cross-video vs CNU comparison matrix
    drone_sig_names = set(DRONE_SIGS.keys())
    matrix = {}
    for label, rec in report["recordings"].items():
        if "drone_signature_hits" not in rec: continue
        matched = {h["signature"] for h in rec["drone_signature_hits"]}
        matrix[label] = {
            "matched_sigs": sorted(matched),
            "pct_drone_overlap": round(len(matched) / len(drone_sig_names) * 100, 1),
        }
    report["signature_overlap_matrix"] = matrix

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps({"status": "ok", "recordings": len(report["recordings"]),
                       "total_hits": sum(r.get("hit_count",0) for r in report["recordings"].values())}))

if __name__ == "__main__":
    main()
