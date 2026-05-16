#!/usr/bin/env python3
"""Quick audio-based drone detection"""
import sounddevice as sd
import numpy as np
from scipy.fft import rfft, rfftfreq
from datetime import datetime

SAMPLE_RATE = 44100
DURATION = 15  # seconds
DRONE_FREQ_LOW = 40
DRONE_FREQ_HIGH = 200
TARGET_FREQS = [97.0, 46.87, 8.4]  # Known drone/anomaly signatures

print(f"AUDIO DRONE DETECTOR - {datetime.now().strftime('%H:%M:%S')}")
print("="*60)
print(f"Recording {DURATION}s of audio...")
print("(place laptop near window or where you hear drones)")

# Record
audio = sd.rec(int(DURATION * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='float32')
sd.wait()
audio = audio.flatten()

# FFT
fft = np.abs(rfft(audio))
freqs = rfftfreq(len(audio), 1/SAMPLE_RATE)

# Drone band power (40-200 Hz)
drone_mask = (freqs >= DRONE_FREQ_LOW) & (freqs <= DRONE_FREQ_HIGH)
drone_power = np.mean(fft[drone_mask])

# Find peaks in drone band
drone_freqs = freqs[drone_mask]
drone_fft = fft[drone_mask]
peak_indices = np.argsort(drone_fft)[-10:][::-1]

print(f"\nDRONE BAND ({DRONE_FREQ_LOW}-{DRONE_FREQ_HIGH} Hz):")
print(f"  Average power: {drone_power:.4f}")
print(f"\n  Top 10 frequencies:")
for i in peak_indices:
    f = drone_freqs[i]
    p = drone_fft[i]
    marker = " <<< KNOWN SIGNATURE" if any(abs(f - tf) < 3 for tf in TARGET_FREQS) else ""
    print(f"    {f:7.2f} Hz - power {p:8.4f}{marker}")

# Check for 97 Hz specifically
idx_97 = np.argmin(np.abs(freqs - 97))
power_97 = fft[idx_97]
print(f"\n97 Hz DRONE MOTOR: {power_97:.4f}")

if power_97 > drone_power * 2:
    print("  🚨 ELEVATED - Possible drone nearby!")
else:
    print("  ✅ Normal level")

# ELF check
elf_mask = freqs < 20
elf_power = np.mean(fft[elf_mask])
print(f"\nELF BAND (<20 Hz): {elf_power:.4f}")

# Schumann check
idx_783 = np.argmin(np.abs(freqs - 7.83))
power_783 = fft[idx_783]
print(f"7.83 Hz (Schumann): {power_783:.4f}")

# 60 Hz power line
idx_60 = np.argmin(np.abs(freqs - 60))
power_60 = fft[idx_60]
print(f"60 Hz (Power grid): {power_60:.4f}")

# 120 Hz harmonic
idx_120 = np.argmin(np.abs(freqs - 120))
power_120 = fft[idx_120]
print(f"120 Hz (Grid harmonic): {power_120:.4f}")

print("\n" + "="*60)
print("ANALYSIS COMPLETE")
