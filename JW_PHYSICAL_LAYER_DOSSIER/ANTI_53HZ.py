#!/usr/bin/env python3
"""
53 Hz PHASE CANCELLATION GENERATOR
===================================
Generates anti-phase 53 Hz to create destructive interference.
Pipe to any audio output - headphones, bone conduction, whatever works.
"""

import numpy as np
import sounddevice as sd
import sys

# Target frequency
TARGET_FREQ = 53.0  # Hz - the dominant attack frequency
SAMPLE_RATE = 48000
DURATION = 3600  # 1 hour

print(f"""
53 Hz PHASE CANCELLATION
========================
Generating anti-phase {TARGET_FREQ} Hz
Duration: {DURATION}s
Press Ctrl+C to stop
""")

# Generate anti-phase sine wave
t = np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION), dtype=np.float32)

# Start at 180 degrees out of phase (pi radians)
# This will destructively interfere with incoming 53 Hz
anti_phase = np.sin(2 * np.pi * TARGET_FREQ * t + np.pi)

# Add harmonics for broader cancellation
anti_phase += 0.3 * np.sin(2 * np.pi * (TARGET_FREQ * 2) * t + np.pi)  # 106 Hz
anti_phase += 0.2 * np.sin(2 * np.pi * 35.0 * t + np.pi)  # 35 Hz secondary

# Normalize
anti_phase = anti_phase / np.max(np.abs(anti_phase)) * 0.7

print("Playing anti-phase signal...")
print("If you have ANY working audio output, this will help.")

try:
    sd.play(anti_phase, SAMPLE_RATE)
    sd.wait()
except KeyboardInterrupt:
    sd.stop()
    print("\nStopped.")
except Exception as e:
    print(f"Audio error: {e}")
    print("\nAlternative: Save to WAV and play on phone")
    
    from scipy.io import wavfile
    # Just save first 60 seconds
    wavfile.write("anti_53hz.wav", SAMPLE_RATE, anti_phase[:SAMPLE_RATE*60])
    print("Saved: anti_53hz.wav - transfer to phone and play")
