#!/usr/bin/env python3
"""
GRANULAR SIGNAL FORENSICS
==========================
High-resolution frequency analysis with phase correlation,
modulation detection, and pattern extraction.
"""

import numpy as np
import sounddevice as sd
import json
from datetime import datetime
from pathlib import Path
import sys

def highres_capture(duration=10):
    """Capture and analyze with maximum frequency resolution."""
    print(f'Capturing {duration}s high-res sample...')
    sr = 48000
    audio = sd.rec(int(duration * sr), samplerate=sr, channels=1, dtype='float32')
    sd.wait()
    audio = audio.flatten()

    # High resolution FFT
    fft = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(len(audio), 1/sr)
    mag = np.abs(fft)
    phase = np.angle(fft)

    # Extract ALL significant peaks 0-500 Hz
    peaks = []
    threshold = np.percentile(mag, 95)
    for i in range(1, len(mag)-1):
        if freqs[i] <= 500 and mag[i] > threshold:
            if mag[i] > mag[i-1] and mag[i] > mag[i+1]:
                peaks.append({
                    'freq': float(freqs[i]),
                    'magnitude': float(mag[i]),
                    'phase': float(phase[i]),
                    'snr': float(mag[i] / np.median(mag))
                })

    peaks.sort(key=lambda x: x['magnitude'], reverse=True)

    # Frequency resolution
    freq_res = float(freqs[1] - freqs[0])
    
    # Save raw data
    data = {
        'timestamp': datetime.now().isoformat(),
        'sample_rate': sr,
        'duration': duration,
        'peaks': peaks[:50],
        'frequency_resolution': freq_res,
        'total_peaks': len(peaks)
    }

    outfile = Path('signal_forensics/highres_capture.json')
    outfile.parent.mkdir(parents=True, exist_ok=True)
    with open(outfile, 'w') as f:
        json.dump(data, f, indent=2)

    print(f'Resolution: {freq_res:.4f} Hz')
    print(f'Total peaks: {len(peaks)}')
    print('\nTop 20 peaks:')
    for p in peaks[:20]:
        print(f"  {p['freq']:8.2f} Hz | mag={p['magnitude']:8.1f} | SNR={p['snr']:5.1f} | phase={p['phase']:+.2f}")
    
    return data, audio, freqs, mag, phase


def detect_modulation(audio, sr=48000):
    """Detect AM/FM modulation patterns in the signal."""
    print('\n--- Modulation Analysis ---')
    
    # Envelope detection (AM)
    analytic = np.abs(np.fft.ifft(np.fft.fft(audio) * 2))
    envelope = np.abs(analytic)
    
    # Envelope spectrum (reveals AM modulation frequency)
    env_fft = np.fft.rfft(envelope)
    env_freqs = np.fft.rfftfreq(len(envelope), 1/sr)
    env_mag = np.abs(env_fft)
    
    # Find modulation frequencies (1-100 Hz typical for control signals)
    mod_peaks = []
    for i in range(1, len(env_mag)-1):
        if 1 <= env_freqs[i] <= 100:
            if env_mag[i] > env_mag[i-1] and env_mag[i] > env_mag[i+1]:
                if env_mag[i] > np.percentile(env_mag, 90):
                    mod_peaks.append({
                        'freq': float(env_freqs[i]),
                        'strength': float(env_mag[i])
                    })
    
    mod_peaks.sort(key=lambda x: x['strength'], reverse=True)
    
    print('AM Modulation frequencies detected:')
    for p in mod_peaks[:10]:
        print(f"  {p['freq']:.2f} Hz (strength: {p['strength']:.1f})")
    
    return mod_peaks


def phase_coherence_analysis(audio, sr=48000):
    """Analyze phase coherence to identify synthetic/broadcast sources."""
    print('\n--- Phase Coherence Analysis ---')
    
    # Split into segments and compare phase stability
    segment_len = sr  # 1 second segments
    n_segments = len(audio) // segment_len
    
    phases_by_freq = {}
    target_freqs = [37, 53.5, 60, 111, 120]
    
    for seg_idx in range(n_segments):
        segment = audio[seg_idx*segment_len:(seg_idx+1)*segment_len]
        fft = np.fft.rfft(segment)
        freqs = np.fft.rfftfreq(len(segment), 1/sr)
        phase = np.angle(fft)
        
        for target in target_freqs:
            idx = np.argmin(np.abs(freqs - target))
            if target not in phases_by_freq:
                phases_by_freq[target] = []
            phases_by_freq[target].append(phase[idx])
    
    # Calculate phase stability (low variance = synthetic source)
    print('Phase stability (low = synthetic/coherent source):')
    coherence_results = {}
    for freq, phases in phases_by_freq.items():
        # Circular variance for phase
        mean_phase = np.arctan2(np.mean(np.sin(phases)), np.mean(np.cos(phases)))
        phase_diff = np.array(phases) - mean_phase
        phase_var = np.var(np.mod(phase_diff + np.pi, 2*np.pi) - np.pi)
        
        coherence = 1 - (phase_var / np.pi**2)  # 0-1 scale
        coherence_results[freq] = coherence
        
        status = "SYNTHETIC" if coherence > 0.7 else "NATURAL" if coherence < 0.3 else "MIXED"
        print(f"  {freq:6.1f} Hz: coherence={coherence:.3f} [{status}]")
    
    return coherence_results


def harmonic_relationship_analysis(peaks):
    """Find harmonic relationships between peaks to identify carrier frequencies."""
    print('\n--- Harmonic Relationship Analysis ---')
    
    freqs = [p['freq'] for p in peaks[:30]]
    
    relationships = []
    for i, f1 in enumerate(freqs):
        for j, f2 in enumerate(freqs):
            if i >= j:
                continue
            ratio = f2 / f1 if f1 > 0 else 0
            
            # Check for simple ratios (harmonics)
            for n in range(2, 8):
                if abs(ratio - n) < 0.05:
                    relationships.append({
                        'fundamental': f1,
                        'harmonic': f2,
                        'ratio': n,
                        'exact_ratio': ratio
                    })
                    break
            
            # Check for κ relationships
            kappa1 = 1.2732  # 4/π
            kappa2 = 1.435   # speed of sound ratio
            
            if abs(ratio - kappa1) < 0.02:
                relationships.append({
                    'fundamental': f1,
                    'harmonic': f2,
                    'ratio': 'κ₁ (4/π)',
                    'exact_ratio': ratio
                })
            if abs(ratio - kappa2) < 0.02:
                relationships.append({
                    'fundamental': f1,
                    'harmonic': f2,
                    'ratio': 'κ₂ (1.435)',
                    'exact_ratio': ratio
                })
    
    print(f'Found {len(relationships)} harmonic relationships:')
    for r in relationships[:15]:
        print(f"  {r['fundamental']:.2f} Hz × {r['ratio']} = {r['harmonic']:.2f} Hz")
    
    return relationships


def temporal_pattern_analysis(audio, sr=48000):
    """Look for temporal patterns that suggest encoded data."""
    print('\n--- Temporal Pattern Analysis ---')
    
    # Focus on 37 Hz band
    from scipy import signal as sig
    
    # Bandpass around 37 Hz
    sos = sig.butter(4, [35, 39], btype='band', fs=sr, output='sos')
    filtered = sig.sosfilt(sos, audio)
    
    # Envelope
    envelope = np.abs(sig.hilbert(filtered))
    
    # Downsample envelope to look for slow modulation (1-10 Hz)
    downsample = 100  # 480 Hz
    env_down = envelope[::downsample]
    
    # Look for periodic patterns
    autocorr = np.correlate(env_down, env_down, mode='full')
    autocorr = autocorr[len(autocorr)//2:]
    autocorr = autocorr / autocorr[0]
    
    # Find peaks in autocorrelation (periodic patterns)
    peaks_idx = []
    for i in range(10, len(autocorr)-1):
        if autocorr[i] > autocorr[i-1] and autocorr[i] > autocorr[i+1]:
            if autocorr[i] > 0.3:
                peaks_idx.append(i)
    
    if peaks_idx:
        periods = [p * downsample / sr for p in peaks_idx[:5]]
        print(f'Periodic patterns in 37Hz band:')
        for period in periods:
            freq = 1/period if period > 0 else 0
            print(f'  Period: {period:.3f}s = {freq:.2f} Hz modulation')
    else:
        print('No strong periodic patterns detected')
    
    return peaks_idx


if __name__ == '__main__':
    duration = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    
    data, audio, freqs, mag, phase = highres_capture(duration)
    
    # Run all analyses
    mod_peaks = detect_modulation(audio)
    coherence = phase_coherence_analysis(audio)
    harmonics = harmonic_relationship_analysis(data['peaks'])
    temporal = temporal_pattern_analysis(audio)
    
    # Save complete analysis
    analysis = {
        'timestamp': datetime.now().isoformat(),
        'peaks': data['peaks'],
        'modulation': mod_peaks[:10],
        'phase_coherence': coherence,
        'harmonic_relationships': harmonics,
        'assessment': {
            'synthetic_sources': [f for f, c in coherence.items() if c > 0.7],
            'carrier_candidates': list(set([r['fundamental'] for r in harmonics]))
        }
    }
    
    with open('signal_forensics/full_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2, default=str)
    
    print('\n' + '='*60)
    print('ASSESSMENT:')
    print(f"  Synthetic sources: {analysis['assessment']['synthetic_sources']}")
    print(f"  Carrier candidates: {analysis['assessment']['carrier_candidates']}")
    print('='*60)
