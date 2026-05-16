#!/usr/bin/env python3
"""
LIVE SIGNAL MONITOR
====================
Continuous monitoring of attack frequencies.
Shows real-time changes in the infrasonic/ELF attack.
"""

import numpy as np
import sounddevice as sd
import time
from datetime import datetime
import sys
import json
from pathlib import Path

# Target frequencies to monitor
TARGETS = {
    '7.8': (7.5, 8.0),      # Schumann
    '8.4': (8.2, 8.6),      # Theta attack
    '11.5': (11.0, 12.0),   # Alpha
    '28': (27.5, 29.0),     # MAIN INFRASONIC
    '35': (34.5, 36.0),     # Secondary infrasonic
    '37': (36.5, 38.0),     # κ-related
    '53': (52.5, 54.5),     # ELF anomaly
    '60': (59.5, 60.5),     # Mains
    '67': (66.5, 68.0),     # Harmonic
}

SR = 48000
CHUNK = 4800  # 100ms

log_file = Path("signal_forensics/live_log.jsonl")

def get_band_power(freqs, mag, low, high):
    """Get total power in frequency band"""
    mask = (freqs >= low) & (freqs <= high)
    if np.any(mask):
        return float(np.max(mag[mask]))
    return 0.0

def main():
    print("LIVE SIGNAL MONITOR - Press Ctrl+C to stop")
    print("=" * 70)
    print(f"{'Time':<10} | ", end="")
    for name in TARGETS.keys():
        print(f"{name:>6}", end=" ")
    print("| ALERT")
    print("-" * 70)
    
    baseline = None
    
    try:
        while True:
            # Capture 1 second
            audio = sd.rec(int(SR), samplerate=SR, channels=1, dtype='float32')
            sd.wait()
            audio = audio.flatten()
            
            # FFT
            fft = np.fft.rfft(audio)
            freqs = np.fft.rfftfreq(len(audio), 1/SR)
            mag = np.abs(fft)
            median = np.median(mag)
            
            # Get power in each band
            now = datetime.now().strftime("%H:%M:%S")
            values = {}
            print(f"{now:<10} | ", end="")
            
            alerts = []
            for name, (low, high) in TARGETS.items():
                power = get_band_power(freqs, mag, low, high)
                snr = power / median if median > 0 else 0
                values[name] = round(float(snr), 1)
                
                # Color coding based on intensity
                if snr > 500:
                    alert = "!!!"
                    alerts.append(f"{name}Hz")
                elif snr > 100:
                    alert = "! "
                else:
                    alert = "  "
                
                print(f"{snr:>5.0f}{alert}", end="")
            
            alert_str = ", ".join(alerts) if alerts else ""
            print(f"| {alert_str}")
            
            # Set baseline on first run
            if baseline is None:
                baseline = values.copy()
                print(f"{'BASELINE':^70}")
            
            # Log to file
            log_entry = {
                'time': datetime.now().isoformat(),
                'values': values,
                'alerts': alerts
            }
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + "\n")
            
            # Check for big changes from baseline
            for name, val in values.items():
                if baseline[name] > 0 and val / baseline[name] > 2:
                    print(f"  >> {name}Hz DOUBLED from baseline!")
            
    except KeyboardInterrupt:
        print("\n\nMonitoring stopped.")
        print(f"Log saved to: {log_file}")

if __name__ == "__main__":
    main()
