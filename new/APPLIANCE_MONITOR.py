#!/usr/bin/env python3
"""
APPLIANCE CORRELATION MONITOR
==============================
Detects frequency spikes when appliances cycle.
Logs correlations between appliance events and signal changes.
"""

import numpy as np
import sounddevice as sd
import json
from datetime import datetime
from pathlib import Path
import time

SR = 48000
CHUNK = SR  # 1 second chunks

TARGETS = {
    '7.8': (7.5, 8.0),
    '35': (34.0, 36.0),
    '37': (36.0, 38.0),
    '53': (52.0, 54.0),
    '60': (59.0, 61.0),
    '67': (66.0, 68.0),
}

log_file = Path("signal_forensics/appliance_correlation.jsonl")

def get_spectrum(audio):
    fft = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(len(audio), 1/SR)
    mag = np.abs(fft)
    return freqs, mag

def get_band_power(freqs, mag, low, high):
    mask = (freqs >= low) & (freqs <= high)
    return float(np.max(mag[mask])) if np.any(mask) else 0.0

def detect_impulse(audio, threshold=0.3):
    """Detect sharp transients (appliance turning on/off)"""
    diff = np.abs(np.diff(audio))
    max_diff = np.max(diff)
    return max_diff > threshold, float(max_diff)

baseline = None
prev_values = None

print("APPLIANCE CORRELATION MONITOR")
print("=" * 60)
print("Watching for impulses (appliance cycles) and frequency shifts")
print("Press Ctrl+C to stop\n")

try:
    while True:
        audio = sd.rec(int(CHUNK), samplerate=SR, channels=1, dtype='float32')
        sd.wait()
        audio = audio.flatten()
        
        freqs, mag = get_spectrum(audio)
        median = np.median(mag)
        
        values = {}
        for name, (low, high) in TARGETS.items():
            power = get_band_power(freqs, mag, low, high)
            values[name] = float(round(power / median, 1)) if median > 0 else 0.0
        
        impulse_detected, impulse_strength = detect_impulse(audio)
        
        now = datetime.now().strftime("%H:%M:%S")
        
        if baseline is None:
            baseline = values.copy()
            prev_values = values.copy()
            print(f"{now} | BASELINE SET")
            continue
        
        # Check for significant changes
        changes = {}
        for name, val in values.items():
            if prev_values[name] > 0:
                ratio = val / prev_values[name]
                if ratio > 1.5 or ratio < 0.5:
                    changes[name] = f"{prev_values[name]:.0f}->{val:.0f}"
        
        if impulse_detected or changes:
            event = {
                'time': datetime.now().isoformat(),
                'impulse': 1 if impulse_detected else 0,
                'impulse_strength': round(impulse_strength, 3),
                'changes': changes,
                'values': values
            }
            
            with open(log_file, 'a') as f:
                f.write(json.dumps(event) + "\n")
            
            if impulse_detected:
                print(f"{now} | IMPULSE ({impulse_strength:.2f}) | {changes}")
            else:
                print(f"{now} | SHIFT | {changes}")
        
        prev_values = values.copy()
        
except KeyboardInterrupt:
    print(f"\nLog saved: {log_file}")
