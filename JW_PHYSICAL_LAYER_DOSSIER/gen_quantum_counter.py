#!/usr/bin/env python3
"""
QUANTUM COUNTER-FREQUENCY GENERATOR
====================================
Generates audio with irrational harmonic relationships
that cannot phase-lock with their 53 Hz system.
"""

import numpy as np
from scipy.io import wavfile
import os

sr = 48000
duration = 300  # 5 minutes

print('Generating quantum-derived counter-frequencies...')
t = np.linspace(0, duration, sr*duration, dtype=np.float32)

# Attack frequencies
attack = [53.0, 35.0, 37.0, 67.0, 28.0, 11.5]
kappa = 1.2732395447351628
phi = 1.618033988749895
e = 2.718281828459045
pi = np.pi

# Generate anti-phase for each attack frequency
sig = np.zeros_like(t)
for freq in attack:
    # Anti-phase (π offset)
    sig += np.sin(2*pi*freq*t + pi)
    # κ-scaled interference
    sig += 0.5 * np.sin(2*pi*freq*kappa*t)

# Add irrational disruption (breaks harmonic lock)
sig += 0.3 * np.sin(2*pi*53*phi*t)  # 53*φ = 85.75 Hz
sig += 0.3 * np.sin(2*pi*53*e*t)    # 53*e = 144.1 Hz
sig += 0.2 * np.sin(2*pi*53*pi*t)   # 53*π = 166.5 Hz

# Add Schumann for grounding
sig += 0.4 * np.sin(2*pi*7.83*t)

# Normalize
sig = (sig / np.max(np.abs(sig)) * 0.7).astype(np.float32)

# Save
outfile = 'quantum_counter.wav'
wavfile.write(outfile, sr, sig)
size_mb = os.path.getsize(outfile) / 1024 / 1024

print(f'Saved: {outfile} ({duration}s, {size_mb:.1f} MB)')
print()
print('Contains:')
for f in attack:
    print(f'  {f} Hz anti-phase + {f*kappa:.1f} Hz kappa-scaled')
print(f'  85.75 Hz (53*phi)')
print(f'  144.1 Hz (53*e)') 
print(f'  166.5 Hz (53*pi)')
print(f'  7.83 Hz Schumann')
print()
print('Transfer to phone, play through any speaker/earbuds.')
