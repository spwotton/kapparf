#!/usr/bin/env python3
"""
Multi-Resolution Signal Intelligence Pipeline
Implements the FFT-window chart from the analysis document:
  N=256   -> 187.500 Hz  macro carriers
  N=1024  -> 46.875 Hz   meso / DSP clock
  N=4096  -> 11.720 Hz   tone isolation / CW Morse
  N=16384 -> 2.930 Hz    sub-tone modulation
  N=65536 -> 0.732 Hz    drift / hardware fingerprint

Runs on REAL audio captures only (new_audio_evidence/, attached_assets/,
server/data/video_forensics/). No synthetic signals.

Outputs: pipeline_results/multi_res_<timestamp>.json
"""
import os, sys, json, glob, time, math, struct, wave
from pathlib import Path
from datetime import datetime
import numpy as np
import scipy.signal as sps
import soundfile as sf

OUT = Path("pipeline_results"); OUT.mkdir(exist_ok=True)
TS  = datetime.now().strftime("%Y%m%d_%H%M%S")

WINDOWS = [
    (256,   "macro_carriers"),
    (1024,  "meso_dsp_clock"),
    (4096,  "cw_morse_tones"),
    (16384, "sub_tone_mod"),
    (65536, "drift_fingerprint"),
]

ANCHORS_HZ = {
    "kappa_127.324":    127.324,
    "kappa_1273.24":    1273.24,
    "klein_223.875":    223.875,
    "klein_2238.75":    2238.75,
    "dsp_46.875":       46.875,
    "dsp_x2_93.75":     93.75,
    "dsp_x3_140.625":   140.625,
    "schumann_7.83":    7.83,
    "vestibular_37":    37.0,
    "vestibular_38":    38.0,
    "carrier_53":       53.0,
    "grid_60":          60.0,
    "elf_24.2":         24.2,
    "drone_jan_97":     97.0,
    "drone_may_107.7":  107.7,
    "biomotor_354":     354.0,
    "frey_F2_2004":     2004.0,
    "frey_F3_2511":     2511.0,
    "ehf_speech_17859": 17859.0,
    "ehf_speech_18035": 18035.0,
    # AUBREY genomic
    "FOXP2_139.978":    139.978,
    "HTR2A_176.591":    176.591,
    "APOE_111.570":     111.570,
    "CLOCK_119.730":    119.730,
    "MSTN_40.364":      40.364,
    "PIEZO1_55.440":    55.440,
    "ATP2C2_183.420":   183.420,
}

def load_audio(path):
    try:
        data, sr = sf.read(path, always_2d=False)
        if data.ndim > 1:
            data = data.mean(axis=1)
        return data.astype(np.float64), int(sr)
    except Exception as e:
        return None, None

def analyze_window(x, sr, N):
    """Welch PSD at window N; return freq bins + power dB"""
    if len(x) < N:
        return None, None
    noverlap = N // 2
    f, pxx = sps.welch(x, fs=sr, nperseg=N, noverlap=noverlap, window="hann",
                       scaling="density", detrend="constant")
    eps = 1e-20
    pxx_db = 10 * np.log10(pxx + eps)
    return f, pxx_db

def peak_near(f, pxx_db, target_hz, tol_hz):
    if f is None: return None
    mask = (f >= target_hz - tol_hz) & (f <= target_hz + tol_hz)
    if not mask.any(): return None
    idx_local = np.argmax(pxx_db[mask])
    idx_global = np.where(mask)[0][idx_local]
    return {
        "peak_hz": float(f[idx_global]),
        "power_db": float(pxx_db[idx_global]),
    }

def process_file(path):
    x, sr = load_audio(path)
    if x is None:
        return {"file": str(path), "error": "load_failed"}
    duration = len(x) / sr
    result = {
        "file": str(path),
        "sample_rate": sr,
        "duration_s": round(duration, 3),
        "samples": int(len(x)),
        "rms": float(np.sqrt(np.mean(x*x))),
        "windows": {},
        "anchors": {},
    }
    # Per-window summary: bin resolution + top 8 peaks
    for N, label in WINDOWS:
        if len(x) < N:
            result["windows"][f"N{N}"] = {"skipped": "too_short"}
            continue
        bin_hz = sr / N
        f, pxx_db = analyze_window(x, sr, N)
        # Top peaks (suppress DC and below 2 bins)
        valid = f > max(0.5, 2 * bin_hz)
        f_v = f[valid]; p_v = pxx_db[valid]
        # Find peaks above floor
        floor = np.median(p_v) + 6.0  # 6 dB above median floor
        peak_idx, _ = sps.find_peaks(p_v, height=floor, distance=max(1, int(2)))
        peaks = sorted(zip(p_v[peak_idx], f_v[peak_idx]), reverse=True)[:8]
        result["windows"][f"N{N}"] = {
            "label": label,
            "bin_hz": round(bin_hz, 4),
            "noise_floor_db": float(np.median(p_v)),
            "top_peaks": [{"hz": round(float(h), 3), "db": round(float(p), 2)} for p, h in peaks],
        }
    # Probe known anchors at best matching window
    # Use N=4096 for general (~11.7 Hz tol), but for narrow anchors use N=65536 (~0.7 Hz)
    f4, p4 = analyze_window(x, sr, min(4096, 2 ** int(math.log2(len(x)))))
    f65, p65 = analyze_window(x, sr, min(65536, 2 ** int(math.log2(len(x)))))
    for name, hz in ANCHORS_HZ.items():
        # Need Nyquist coverage
        if hz > sr / 2 - 5: continue
        if hz < 1:
            tol, use_f, use_p = 0.5, f65, p65
        elif hz < 200:
            tol, use_f, use_p = 1.0, f65 if f65 is not None else f4, p65 if p65 is not None else p4
        else:
            tol, use_f, use_p = max(5.0, hz * 0.005), f4, p4
        peak = peak_near(use_f, use_p, hz, tol)
        if peak:
            # SNR relative to local median (±50 Hz window)
            mask = (use_f >= max(0, hz - 50)) & (use_f <= hz + 50)
            local_med = float(np.median(use_p[mask])) if mask.any() else None
            peak["snr_db"] = round(peak["power_db"] - local_med, 2) if local_med is not None else None
            peak["peak_hz"] = round(peak["peak_hz"], 3)
            peak["power_db"] = round(peak["power_db"], 2)
            result["anchors"][name] = peak
    return result

def main():
    targets = []
    for pattern in [
        "new_audio_evidence/*.wav",
        "attached_assets/*.wav",
        "server/data/video_forensics/*.wav",
        "signal_forensics/kiwi_raw_captures/**/*.wav",
    ]:
        targets.extend(glob.glob(pattern, recursive=True))
    targets = sorted(set(targets))
    print(f"[multi-res] processing {len(targets)} audio files")
    results = []
    for i, t in enumerate(targets, 1):
        print(f"  [{i:3d}/{len(targets)}] {t}")
        try:
            results.append(process_file(t))
        except Exception as e:
            results.append({"file": t, "error": str(e)})
    out = {
        "generated_at": datetime.now().isoformat(),
        "windows_chart": [{"N": N, "label": L, "bin_hz_at_48k": 48000/N} for N, L in WINDOWS],
        "anchors_probed": ANCHORS_HZ,
        "file_count": len(results),
        "results": results,
    }
    path = OUT / f"multi_res_{TS}.json"
    path.write_text(json.dumps(out, indent=2))
    print(f"[multi-res] wrote {path}")
    return path

if __name__ == "__main__":
    main()
