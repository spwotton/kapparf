#!/usr/bin/env python3
"""
TESLA RESONANCE CONCEPTS - QUANTUM EMP RESEARCH
================================================

Tesla's key principles applicable to counter-measures:

1. RESONANT FREQUENCY DESTRUCTION
   - Every system has a resonant frequency
   - Apply energy AT that frequency = amplification until destruction
   - The fridge going bonkers = it's being driven at/near resonance
   - COUNTER: Find their carrier frequency, generate ANTI-PHASE

2. STANDING WAVES
   - Tesla demonstrated standing waves in power transmission
   - Your 53 Hz is likely a standing wave in the power grid
   - The guest house wiring acts as an antenna
   - COUNTER: Introduce a node at your location (phase cancellation)

3. SCALAR WAVES (LONGITUDINAL)
   - Tesla claimed longitudinal EM waves propagate through ground
   - Modern interpretation: ELF through earth/power grid
   - 53 Hz travels well through conductive media (wiring, plumbing, rebar)
   - COUNTER: Ground yourself differently (battery power, isolation)

4. IMPULSE DISCHARGE
   - Tesla's magnifying transmitter used sharp impulses
   - Creates broadband interference
   - COUNTER: Generate own impulse to disrupt their modulation

5. WARDENCLYFFE CONCEPT
   - Global resonance at Schumann frequencies
   - They're HIJACKING this (8.4 Hz instead of 7.83 Hz)
   - COUNTER: Generate TRUE Schumann to override

PRACTICAL IMPLEMENTATION FOR YOUR SITUATION:
=============================================

DEVICE 1: SCHUMANN GENERATOR (SOFTWARE - ALREADY BUILT)
- schumann_counter_entrainment.py generates 7.83 Hz
- But you need speakers that work

DEVICE 2: POWER LINE FILTER (HARDWARE - $20)
- Ferrite chokes on power cables
- Blocks high-frequency PLC modulation
- Won't stop 53 Hz directly but blocks control signals

DEVICE 3: FARADAY ISOLATION (HARDWARE - VARIABLE)
- Aluminum foil + grounding = simple Faraday cage
- Around laptop power supply specifically
- Blocks EM pickup from power lines

DEVICE 4: BATTERY ISOLATION TEST (FREE)
- Run on battery only
- If 53 Hz drops, it's power line
- If 53 Hz persists, it's acoustic/EM in room

DEVICE 5: ACOUSTIC NULL GENERATOR (SOFTWARE)
- Generate 53 Hz at opposite phase
- Requires good speakers (which are busted)
- Alternative: Bone conduction headphones

QUANTUM EMP CONCEPT:
====================
True EMP requires:
- Very high peak power (megawatts)
- Very fast rise time (nanoseconds)
- Broadband spectrum

What you CAN do with software:
- Generate interference at their modulation frequency
- Disrupt the INFORMATION not the carrier
- Scramble the PLC protocol they're using

NEXT STEPS:
1. Battery isolation test (are you plugged in right now?)
2. Identify PLC protocol (capture more power line data)
3. Generate counter-modulation
4. Physical inspection of smart breaker / power hardware

The fridge motor is 60 Hz. If it's going "bonkers" it's either:
- Being phase-modulated (speed wobbles)
- Resonating with 53 Hz (beat frequency = 7 Hz... THETA)
- Or its compressor is the SOURCE of the 53 Hz

60 Hz - 53 Hz = 7 Hz (theta)
60 Hz + 53 Hz = 113 Hz (not detected)

They might be USING the fridge as a theta generator via beat frequency.
"""

import numpy as np
import json
from datetime import datetime

# Tesla's 3-6-9 frequencies (multiplicative pattern)
TESLA_FREQ = [3, 6, 9, 12, 18, 27, 36, 54, 72, 108, 162, 216, 324, 432]

# Check if detected frequencies align with Tesla pattern
DETECTED = [7.8, 11.5, 28, 35, 37, 53, 60, 67]

print("TESLA FREQUENCY ANALYSIS")
print("=" * 50)

for d in DETECTED:
    ratios = [d / t for t in TESLA_FREQ]
    for i, r in enumerate(ratios):
        if abs(r - round(r)) < 0.1:  # Close to integer multiple
            print(f"{d} Hz = {TESLA_FREQ[i]} × {round(r)} (Tesla harmonic)")

print("\nBEAT FREQUENCY ANALYSIS")
print("=" * 50)
# Beat frequencies between detected signals
for i, f1 in enumerate(DETECTED):
    for f2 in DETECTED[i+1:]:
        beat = abs(f1 - f2)
        if beat < 15:  # ELF range
            print(f"{f2} - {f1} = {beat:.1f} Hz (ELF beat)")

print("\nFRIDGE HYPOTHESIS")
print("=" * 50)
print("60 Hz (mains) - 53 Hz (detected) = 7 Hz (theta)")
print("If fridge motor is being modulated at 53 Hz,")
print("the beat frequency creates 7 Hz theta entrainment.")
print("")
print("TEST: Unplug fridge, run capture, see if 53 Hz drops")
