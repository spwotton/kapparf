#!/usr/bin/env python3
"""
KAPPA Video Forensics FFT Pipeline
Audio: full FFT + short-time spectral analysis cross-referenced against Master Variables
"""
import numpy as np
import wave
import json
import sys
import os

WAV_PATH = "server/data/video_forensics/field_recording_audio.wav"
OUT_PATH = "server/data/video_forensics/fft_results.json"

MASTER_VARS = {
    "3i_ATLAS_heartbeat":      46.875,
    "AC_grid_CR":              60.0,
    "theta_carrier":           53.0,
    "beat_theta_offset":       7.0,
    "infrasonic_assault_37":   37.0,
    "infrasonic_assault_38":   38.0,
    "infrasonic_trigger_53":   53.0,
    "delta_trigger_2":         2.0,
    "beta_trigger_14":         14.0,
    "beta_trigger_15":         15.0,
    "KYMA_global_clock":       8.392,
    "EHF_speech_low":          17859.0,
    "EHF_speech_high":         18035.0,
    "ultrasonic_burst":        20000.0,
    "subliminal_pulse":        2004.0,
    "V2K_harmonic_4687":       4687.0,
    "V2K_harmonic_9375":       9375.0,
    "kiwi_7410_40m":           7410.0,
    "VLF_SAQ_17200":           17200.0,
    "VLF_NAA_24000":           24000.0,
    "schumann_1":              7.83,
}

TOLERANCE_HZ = 2.5

def read_wav_mono(path):
    with wave.open(path, 'rb') as wf:
        nch = wf.getnchannels()
        sw  = wf.getsampwidth()
        sr  = wf.getframerate()
        nf  = wf.getnframes()
        raw = wf.readframes(nf)
    if sw == 2:
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    elif sw == 4:
        samples = np.frombuffer(raw, dtype=np.int32).astype(np.float64) / 2147483648.0
    else:
        samples = np.frombuffer(raw, dtype=np.uint8).astype(np.float64) / 128.0 - 1.0
    if nch == 2:
        samples = (samples[0::2] + samples[1::2]) / 2.0
    return samples, sr

def compute_full_fft(samples, sr):
    N = len(samples)
    windowed = samples * np.hanning(N)
    fft_mag = np.abs(np.fft.rfft(windowed))
    freqs   = np.fft.rfftfreq(N, d=1.0/sr)
    fft_db  = 20 * np.log10(fft_mag / (N/2) + 1e-12)
    return freqs, fft_db

def short_time_fft(samples, sr, win_sec=1.0, hop_sec=0.25):
    win  = int(win_sec * sr)
    hop  = int(hop_sec * sr)
    frames = []
    t_centers = []
    idx = 0
    while idx + win <= len(samples):
        seg = samples[idx:idx+win]
        windowed = seg * np.hanning(win)
        mag = np.abs(np.fft.rfft(windowed, n=win))
        db  = 20 * np.log10(mag / (win/2) + 1e-12)
        frames.append(db)
        t_centers.append((idx + win/2) / sr)
        idx += hop
    freqs = np.fft.rfftfreq(win, d=1.0/sr)
    return np.array(frames), freqs, np.array(t_centers)

def find_top_peaks(freqs, fft_db, n=40, min_freq=1.0, max_freq=22000.0):
    mask = (freqs >= min_freq) & (freqs <= max_freq)
    f = freqs[mask]
    d = fft_db[mask]
    order = np.argsort(d)[::-1]
    peaks = []
    seen = []
    for i in order:
        freq = float(f[i])
        if any(abs(freq - s) < 2.0 for s in seen):
            continue
        seen.append(freq)
        peaks.append({"freq_hz": round(freq, 3), "db": round(float(d[i]), 2)})
        if len(peaks) >= n:
            break
    return peaks

def match_master_vars(peaks):
    hits = []
    for peak in peaks:
        f = peak["freq_hz"]
        for name, target in MASTER_VARS.items():
            if abs(f - target) <= TOLERANCE_HZ:
                hits.append({
                    "master_var": name,
                    "target_hz": target,
                    "detected_hz": f,
                    "delta_hz": round(f - target, 3),
                    "db": peak["db"],
                    "match": "CONFIRMED" if abs(f - target) < 1.0 else "PROBABLE",
                })
    return hits

def temporal_presence(stft_frames, stft_freqs, stft_times, target_hz, tol=3.0):
    fidx = np.argmin(np.abs(stft_freqs - target_hz))
    series = stft_frames[:, fidx]
    present = []
    for i, (t, db) in enumerate(zip(stft_times, series)):
        if db > -55.0:
            present.append({"t": round(float(t), 2), "db": round(float(db), 1)})
    return present

def rms_db(samples):
    rms = np.sqrt(np.mean(samples**2))
    return round(float(20 * np.log10(rms + 1e-12)), 2)

def main():
    print(f"[FFT] Loading {WAV_PATH}", file=sys.stderr)
    samples, sr = read_wav_mono(WAV_PATH)
    duration_s = len(samples) / sr
    print(f"[FFT] {len(samples)} samples @ {sr}Hz = {duration_s:.2f}s", file=sys.stderr)

    freqs, fft_db = compute_full_fft(samples, sr)
    top_peaks = find_top_peaks(freqs, fft_db, n=40)

    stft_frames, stft_freqs, stft_times = short_time_fft(samples, sr, win_sec=1.0, hop_sec=0.25)

    mv_hits = match_master_vars(top_peaks)

    temporal = {}
    for name, target in MASTER_VARS.items():
        pres = temporal_presence(stft_frames, stft_freqs, stft_times, target)
        if pres:
            temporal[name] = {
                "target_hz": target,
                "windows_present": len(pres),
                "pct_time": round(len(pres) / len(stft_times) * 100, 1),
                "peak_db": max(p["db"] for p in pres),
                "timeline": pres[:20],
            }

    lf_mask = freqs <= 120.0
    lf_data = [{"f": round(float(freqs[i]),3), "db": round(float(fft_db[i]),2)}
               for i in np.where(lf_mask)[0][::2]]

    mid_mask = (freqs >= 1.0) & (freqs <= 500.0)
    mid_data = [{"f": round(float(freqs[i]),3), "db": round(float(fft_db[i]),2)}
                for i in np.where(mid_mask)[0][::5]]

    stats = {
        "duration_s": round(duration_s, 3),
        "sample_rate": sr,
        "rms_db": rms_db(samples),
        "peak_db": round(float(20 * np.log10(np.max(np.abs(samples)) + 1e-12)), 2),
        "dc_offset": round(float(np.mean(samples)), 6),
        "total_samples": len(samples),
    }

    result = {
        "file": "IMG_0084_1779253304057.mov",
        "stats": stats,
        "top_peaks": top_peaks,
        "master_variable_hits": mv_hits,
        "temporal_presence": temporal,
        "lf_spectrum": lf_data,
        "mid_spectrum": mid_data,
        "mv_match_count": len(mv_hits),
        "mv_total": len(MASTER_VARS),
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps({"status": "ok", "mv_hits": len(mv_hits), "peaks": len(top_peaks)}))

if __name__ == "__main__":
    main()
