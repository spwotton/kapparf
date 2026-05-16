"""
FULL NEIGHBORHOOD SCAN
30 seconds, all frequencies
"""
import numpy as np
import sounddevice as sd
from scipy.fft import rfft, rfftfreq
from scipy.signal import find_peaks

print('='*60)
print('FULL SPECTRUM NEIGHBORHOOD SCAN')
print('='*60)
print('Recording 30 seconds...')

fs = 44100
audio = sd.rec(int(30*fs), samplerate=fs, channels=1, dtype='float32')
sd.wait()
audio = audio.flatten()

fft = np.abs(rfft(audio))
freqs = rfftfreq(len(audio), 1/fs)

bands = [
    ('INFRASONIC 1-10Hz', 1, 10),
    ('THETA 4-8Hz', 4, 8),
    ('SCHUMANN 7-8Hz', 7, 8.5),
    ('ELF 10-30Hz', 10, 30),
    ('36Hz ANOMALY', 35, 37),
    ('48Hz BLEED', 47, 49),
    ('53Hz PERSISTENT', 52, 54),
    ('60Hz GRID', 59, 61),
    ('97Hz DRONE', 95, 100),
    ('120Hz 2ND HARM', 118, 122),
    ('180Hz 3RD HARM', 178, 182),
    ('VOICE 300-3kHz', 300, 3000),
    ('HIGH 8-12kHz', 8000, 12000),
    ('ULTRASONIC 18-22kHz', 18000, 22000),
]

print()
print('BAND ANALYSIS:')
print('-'*60)
for name, lo, hi in bands:
    mask = (freqs >= lo) & (freqs <= hi)
    power = np.mean(fft[mask])
    alert = ' <<<' if power > 10 else ''
    print(f'{name:28} {power:8.2f}{alert}')

print()
print('TOP 15 PEAKS (0-500Hz):')
print('-'*60)
lm = (freqs > 1) & (freqs < 500)
lf = freqs[lm]
lfft = fft[lm]
pk, _ = find_peaks(lfft, height=np.max(lfft)*0.05, distance=5)
if len(pk) > 0:
    pf = lf[pk]
    pp = lfft[pk]
    si = np.argsort(pp)[::-1][:15]
    for i, idx in enumerate(si):
        f, p = pf[idx], pp[idx]
        n = ''
        if 59 < f < 61: n = 'GRID'
        elif 95 < f < 100: n = 'DRONE!'
        elif 52 < f < 54: n = '53Hz'
        elif 35 < f < 37: n = '36Hz'
        print(f'  {f:7.1f} Hz  {p:8.2f}  {n}')

print()
print('ULTRASONIC (15-22kHz):')
um = (freqs >= 15000) & (freqs <= 22000)
uf = freqs[um]
ufft = fft[um]
print(f'  Mean: {np.mean(ufft):.4f}  Max: {np.max(ufft):.4f}')

print()
print('FLICKER (100-130Hz):')
fm = (freqs >= 100) & (freqs <= 130)
fp = np.mean(fft[fm])
print(f'  Power: {fp:.2f}')
if fp > 5: print('  >>> FLICKERING DETECTED <<<')

print()
print('DONE')
