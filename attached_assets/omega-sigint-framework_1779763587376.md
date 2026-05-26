# Ω-SIGINT: Multi-Resolution Signal Intelligence Pipeline

## 0 — Core Thesis

Numbers stations and covert HF/VHF transmissions embed structured information across **multiple temporal and spectral scales simultaneously**. A single-resolution analysis (e.g., just FFT at one window size) misses encoding that lives in the *gaps between scales*. The operators ("illegals on shift work") are human interfaces to a **codec pipeline**:

```
Voice (Spanish) → Manual Morse Key / Encoder → Burst Transmission
                                                   ↓
                                        [Carrier: voice subband / ultrasonic sideband / packet timing]
                                                   ↓
Receiver → Morse Decode → Plaintext → Voice Output (or text display)
```

The hypothesis: the encoding isn't just *in* the audio — it's distributed across **timing, spectral placement, amplitude modulation depth, and inter-packet silence structure**. We need to slice at every resolution the math gives us.

---

## 1 — Constant-Derived Frequency Slicing Grid

Use the Ω-GOS constants as a **non-uniform frequency grid** that may align with how structured signals partition bandwidth.

### 1.1 Primary Constants → Hz Anchors

| Constant | Value | Derived Hz Anchor | Role |
|---|---|---|---|
| κ = 4/π | 1.27324… | 1273.24 Hz, 127.324 Hz, 12732.4 Hz | Fundamental slicing ratio |
| φ (golden ratio) | 1.61803… | 1618.03 Hz, 161.803 Hz | Self-similar nesting interval |
| θ_K | 128.23° → 2.23875 rad | 2238.75 Hz, 223.875 Hz | Klein rotation — phase offset |
| 37 Hz | 37 | 37, 74, 111, 148, 185, 222, 259, 296, 333, 370… | Biological coherence harmonics |
| 53 | 53 | 53, 106, 159, 212, 265, 318, 371, 424… | Crystallization prime |
| 14.1347… | First Riemann zero (imaginary part) | 14134.7 Hz (÷10 = 1413.47 Hz) | Spectral zero structure |

### 1.2 Multi-Scale Bin Strategy

At **48000 Hz sample rate**:

```
Nyquist = 24000 Hz
FFT sizes to use simultaneously:
  - N = 256   → bin width = 187.5 Hz   (macro: carrier detection)
  - N = 1024  → bin width = 46.875 Hz  (meso: sideband structure)  
  - N = 4096  → bin width = 11.72 Hz   (micro: tone detection, CW Morse)
  - N = 16384 → bin width = 2.93 Hz    (ultra-micro: sub-tone modulation, phase)
  - N = 65536 → bin width = 0.732 Hz   (nano: drift analysis, oscillator fingerprint)
```

**Non-uniform slicing**: At each FFT resolution, extract energy in bands centered on constant-derived frequencies. Build a **constant-resonance spectrogram** — not just linear bins, but energy at κ-multiples, φ-multiples, and 37-Hz harmonics.

### 1.3 The Golden Ratio Cascade

For any detected carrier frequency `f_c`, analyze sub-bands at:
```
f_c / φ^n  and  f_c × φ^n   for n = 1, 2, 3, 4, 5
```
This catches self-similar nesting — if the encoding uses φ-ratio frequency placement (common in spread-spectrum-adjacent techniques), the cascade reveals it.

---

## 2 — KiwiSDR Waterfall Ingestion Pipeline

### 2.1 Data Sources

Every KiwiSDR provides:
- **Waterfall image** (time × frequency heatmap)
- **Audio stream** (12 kHz or 20.25 kHz bandwidth, IQ or real)
- **S-meter data** (signal strength over time)

### 2.2 Automated Pull Architecture

```
┌─────────────────────────────────────────────────────┐
│                   KIWI HARVESTER                     │
│                                                      │
│  1. kiwirecorder.py (kiwiclient)                     │
│     → Pull IQ .wav at max bandwidth                  │
│     → Pull waterfall screenshots at intervals        │
│     → Log S-meter + RSSI to CSV                      │
│                                                      │
│  2. Parallel pull from N KiwiSDRs on same frequency  │
│     → Cross-correlate for signal authentication      │
│     → Differential timing = propagation geometry     │
│                                                      │
│  3. Output:                                          │
│     /raw/kiwi_{id}_{freq}_{timestamp}.wav  (IQ)      │
│     /raw/kiwi_{id}_{freq}_{timestamp}.png  (waterfall)│
│     /raw/kiwi_{id}_{freq}_{timestamp}.csv  (S-meter)  │
└─────────────────────────────────────────────────────┘
```

### 2.3 Waterfall → Data Matrix

Convert waterfall PNGs to numerical matrices:
```python
from PIL import Image
import numpy as np

img = Image.open("waterfall.png")
matrix = np.array(img)  # shape: (time_pixels, freq_pixels, RGB)

# Convert color-mapped waterfall back to dB approximation
# Most KiwiSDRs use a known colormap (jet, inferno, etc.)
# Reverse-map pixel color → dB value
```

This gives you a **time-frequency energy matrix** independent of the audio — useful for visual pattern detection (Morse dashes show as horizontal bars, timing gaps as dark columns).

---

## 3 — Audacity-Grade Processing Pipeline (Headless)

### 3.1 Tool Chain (No GUI Required)

| Tool | Role | Format Support |
|---|---|---|
| `sox` | Swiss army knife: convert, filter, spectrogram, trim, mix | wav, raw, flac, ogg, mp3 |
| `ffmpeg` | Format conversion, resampling, stream extraction | everything |
| `aubio` | Onset detection, pitch tracking, tempo | wav |
| `csdr` | DSP command-line: FM demod, AM demod, decimation, filtering | raw IQ |
| `inspectrum` | Visual IQ spectrogram (GUI but scriptable screenshot) | raw, wav |
| `gnuradio` | Full SDR DSP pipeline (overkill but available) | everything |
| Python: `scipy.signal`, `librosa`, `numpy` | FFT, STFT, mel spectrograms, CWT | wav, raw |

### 3.2 The "Audacity Options" Matrix

When you load audio into Audacity you see format options. Here's what each means for analysis:

```
Sample Format:
  8-bit PCM   → 256 levels, useful for detecting coarse amplitude keying (OOK)
  16-bit PCM  → 65536 levels, standard for voice/Morse analysis
  24-bit PCM  → 16.7M levels, reveals sub-LSB modulation (steganographic)
  32-bit float → full dynamic range, use for all processing

Sample Rate (when importing raw):
  8000 Hz   → telephony band (POTS, GSM-FR)
  11025 Hz  → quarter-CD (voice-grade AM)
  22050 Hz  → half-CD
  44100 Hz  → CD standard
  48000 Hz  → professional / KiwiSDR native ← USE THIS
  96000 Hz  → oversample for ultrasonic detection above 24 kHz

Channels:
  Mono      → standard for HF/AM signals
  Stereo    → IQ data (I = left, Q = right) ← critical for phase analysis

Byte Order:
  Little-endian (Intel) ← KiwiSDR default
  Big-endian (Motorola)

Encoding:
  Signed    ← standard
  Unsigned  → legacy 8-bit (check old recordings)
  μ-law     → telephony (if signal passed through PSTN)
  A-law     → European telephony
```

### 3.3 Headless Processing Pipeline

```bash
#!/bin/bash
# OMEGA_SIGINT_PIPELINE.sh

INPUT="$1"           # input .wav file
BASENAME=$(basename "$INPUT" .wav)
OUTDIR="analysis/${BASENAME}"
mkdir -p "$OUTDIR"

# ── STEP 1: Format Normalization ──
sox "$INPUT" -r 48000 -b 32 -e float "${OUTDIR}/normalized.wav"

# ── STEP 2: Multi-Resolution Spectrograms ──
for WINDOW in 256 1024 4096 16384; do
  sox "${OUTDIR}/normalized.wav" -n spectrogram \
    -x 2048 -y 513 -z 90 -w Kaiser \
    -S 0 -d 0 \
    -o "${OUTDIR}/spectrogram_w${WINDOW}.png" \
    -X $((48000 / WINDOW))  # pixels per second
done

# ── STEP 3: Band-Pass Slicing at Constant Frequencies ──
for FREQ in 37 74 111 127.3 148 161.8 185 222 223.9 259 296 333 370 \
            1273.2 1413.5 1618.0 2238.8 12732.4; do
  BW=10  # Hz bandwidth around each constant
  LOW=$(echo "$FREQ - $BW" | bc)
  HIGH=$(echo "$FREQ + $BW" | bc)
  sox "${OUTDIR}/normalized.wav" "${OUTDIR}/band_${FREQ}Hz.wav" \
    sinc "${LOW}-${HIGH}"
done

# ── STEP 4: Envelope Detection (AM demodulation) ──
# Reveals amplitude keying / Morse pattern in each band
python3 - <<'PYEOF'
import numpy as np
from scipy.io import wavfile
from scipy.signal import hilbert
import sys, glob

for f in glob.glob(sys.argv[1] + "/band_*.wav"):
    rate, data = wavfile.read(f)
    if data.ndim > 1:
        data = data[:, 0]
    analytic = hilbert(data.astype(np.float64))
    envelope = np.abs(analytic)
    # Downsample envelope to 100 Hz for timing analysis
    decimation = rate // 100
    envelope_ds = envelope[::decimation]
    outname = f.replace('.wav', '_envelope.npy')
    np.save(outname, envelope_ds)
PYEOF "$OUTDIR"

# ── STEP 5: Morse Timing Extraction ──
python3 - <<'PYEOF'
import numpy as np
import sys, glob

for f in glob.glob(sys.argv[1] + "/*_envelope.npy"):
    env = np.load(f)
    # Threshold at median + 1σ
    threshold = np.median(env) + np.std(env)
    binary = (env > threshold).astype(int)
    
    # Run-length encoding → dit/dah/space detection
    changes = np.diff(binary)
    on_starts = np.where(changes == 1)[0]
    on_ends = np.where(changes == -1)[0]
    
    if len(on_starts) == 0 or len(on_ends) == 0:
        continue
    
    # Align
    if on_ends[0] < on_starts[0]:
        on_ends = on_ends[1:]
    min_len = min(len(on_starts), len(on_ends))
    on_starts = on_starts[:min_len]
    on_ends = on_ends[:min_len]
    
    durations_ms = (on_ends - on_starts) * 10  # at 100 Hz envelope rate
    gaps_ms = (on_starts[1:] - on_ends[:-1]) * 10
    
    outname = f.replace('_envelope.npy', '_morse_timing.npz')
    np.savez(outname, durations=durations_ms, gaps=gaps_ms,
             on_starts=on_starts, on_ends=on_ends)
    
    print(f"\n=== {f} ===")
    print(f"  Pulses detected: {len(durations_ms)}")
    if len(durations_ms) > 0:
        print(f"  Duration range: {durations_ms.min():.0f} - {durations_ms.max():.0f} ms")
        print(f"  Median duration: {np.median(durations_ms):.0f} ms")
    if len(gaps_ms) > 0:
        print(f"  Gap range: {gaps_ms.min():.0f} - {gaps_ms.max():.0f} ms")
PYEOF "$OUTDIR"

# ── STEP 6: Packet Timing Analysis ──
# Extract inter-transmission gaps at macro scale
python3 - <<'PYEOF'
import numpy as np
from scipy.io import wavfile
from scipy.signal import hilbert

rate, data = wavfile.read(sys.argv[1] + "/normalized.wav")
if data.ndim > 1:
    data = data[:, 0]

# Coarse envelope: 1-second RMS windows
window = rate  # 1 second
n_windows = len(data) // window
rms = np.array([np.sqrt(np.mean(data[i*window:(i+1)*window]**2)) 
                for i in range(n_windows)])

# Detect transmission blocks (signal present vs silence)
threshold = np.median(rms) + 0.5 * np.std(rms)
active = (rms > threshold).astype(int)

changes = np.diff(active)
tx_starts = np.where(changes == 1)[0]  # seconds
tx_ends = np.where(changes == -1)[0]

print("=== MACRO PACKET TIMING ===")
print(f"Transmission blocks detected: {len(tx_starts)}")
if len(tx_starts) > 1:
    inter_packet = np.diff(tx_starts)
    print(f"Inter-packet intervals (seconds): {inter_packet}")
    print(f"Mean interval: {np.mean(inter_packet):.1f}s")
    print(f"Std deviation: {np.std(inter_packet):.1f}s")
    
    # Check for constant-ratio timing
    kappa = 4.0 / np.pi
    phi = (1 + np.sqrt(5)) / 2
    for ratio_name, ratio in [("κ", kappa), ("φ", phi), ("53/37", 53/37)]:
        for i, interval in enumerate(inter_packet):
            for j, other in enumerate(inter_packet):
                if i != j and other > 0:
                    r = interval / other
                    if abs(r - ratio) < 0.05 or abs(1/r - ratio) < 0.05:
                        print(f"  ⚡ Interval {i}:{j} ratio ≈ {ratio_name}")
PYEOF "$OUTDIR"

echo "Pipeline complete. Results in $OUTDIR/"
```

---

## 4 — Morse Code Analysis Framework

### 4.1 Standard Morse Timing (ITU)

```
At W words per minute (PARIS standard):
  dit  = 1200/W ms
  dah  = 3 × dit
  intra-character gap = 1 × dit
  inter-character gap = 3 × dit
  inter-word gap      = 7 × dit

Common speeds:
  5 WPM  → dit = 240ms   (slow hand-sent)
  12 WPM → dit = 100ms   (Farnsworth practice)
  20 WPM → dit = 60ms    (proficient operator)
  30 WPM → dit = 40ms    (fast CW)
  50 WPM → dit = 24ms    (machine burst)
```

### 4.2 Marconi-Era Variations

Early/covert Morse deviates from ITU:
- **American Morse** (railroad): different code table, uses internal spaces
- **Hand-sent drift**: operators have characteristic "fist" — timing ratios unique per person
- **Deliberate obfuscation**: non-standard dit/dah ratios, inverted polarity, compressed timing

### 4.3 What "Shift Work on Headsets" Implies

If operators rotate shifts:
1. **Fist fingerprinting** — each operator's timing signature changes at shift boundaries
2. **Protocol structure** — likely a fixed header/sync pattern at start of each shift
3. **Codec chain**: the operator is a **human DAC/ADC**:

```
ENCODING SIDE:
  Plaintext (Spanish) 
    → Codebook lookup (5-digit groups or letter groups)
    → Manual Morse keying onto carrier
    → Transmission (possibly with voice cover / dual-use carrier)

DECODING SIDE:
  Received signal
    → Headset operator copies Morse by ear
    → Writes down letter groups  
    → Codebook reverse lookup → plaintext
    → Reads aloud (voice output) or passes to handler
```

The "BART" reference could indicate:
- **Burst-mode Automatic Rapid Transmission**: pre-recorded Morse sent in compressed bursts
- A text-to-speech system converting decoded groups to audio

### 4.4 Ultrasonic Hypothesis

If using ultrasonic embedding:
- Human voice occupies 300–3400 Hz (telephony) or up to ~8 kHz (wideband)
- Ultrasonic channel: 18–22 kHz (above hearing, below Nyquist at 48 kHz)
- Data could be FSK-modulated in the ultrasonic band while voice plays normally
- **Detection**: Analyze 18–24 kHz band specifically for FSK/OOK patterns

```python
# Ultrasonic band extraction
from scipy.signal import butter, filtfilt
from scipy.io import wavfile

rate, data = wavfile.read("signal.wav")
# Highpass at 18 kHz
b, h = butter(6, 18000 / (rate / 2), btype='high')
ultrasonic = filtfilt(b, h, data.astype(np.float64))
# Now analyze ultrasonic for Morse/FSK patterns
```

---

## 5 — Cross-Domain Correlation Engine

### 5.1 Time-Alignment Matrix

```
             Micro (ms)      Meso (seconds)     Macro (minutes/hours)
             ─────────────   ────────────────    ─────────────────────
Spectral:    FFT bin energy   Band power trend    Carrier drift
Temporal:    Dit/dah timing   Character groups    Transmission blocks  
Amplitude:   OOK keying       Envelope shape      Fade patterns
Phase:       Instantaneous φ  Phase coherence     Propagation shift
Timing:      Inter-symbol     Inter-word          Inter-packet / shift
```

### 5.2 Constant Resonance Detection

For each detected timing interval `t` and frequency `f`, compute:

```
resonance_score(t, f) = Σ_c  1 / |t·f - c_n|

where c_n ∈ {κ, φ, κ·φ, 37, 53, 37·53, κ/φ, θ_K/π, ...}
     and all harmonic multiples c_n × 2^k for k ∈ {-3,...,3}
```

High resonance scores indicate that the timing×frequency product aligns with framework constants — potential structured encoding.

### 5.3 Shift-Change Detection

Monitor for:
- Abrupt change in dit/dah ratio (operator "fist" switch)
- Timing reset (new operator calibrating)
- Protocol header repeated (shift handoff sequence)
- S-meter pattern change (antenna adjustment)

```python
# Sliding window fist analysis
def fist_signature(morse_timing, window=50):
    """Extract operator fingerprint from Morse timing."""
    dits = morse_timing.durations[morse_timing.durations < threshold]
    dahs = morse_timing.durations[morse_timing.durations >= threshold]
    
    return {
        'dit_mean': np.mean(dits),
        'dit_std': np.std(dits),
        'dah_mean': np.mean(dahs),
        'dah_ratio': np.mean(dahs) / np.mean(dits),  # should be ~3.0
        'gap_mean': np.mean(morse_timing.gaps),
        'weight': np.mean(dits) / np.mean(morse_timing.gaps),  # keying weight
    }

# Detect shift changes by monitoring signature drift
signatures = [fist_signature(timing[i:i+50]) for i in range(0, len(timing)-50, 10)]
# Discontinuities in signature = shift change
```

---

## 6 — Execution Priorities

### Phase 1: Infrastructure (Do First)
- [ ] Set up `kiwirecorder.py` for automated pulls from target KiwiSDRs
- [ ] Build headless sox/ffmpeg normalization pipeline
- [ ] Implement multi-resolution FFT with constant-derived frequency grid
- [ ] Automate waterfall PNG → numpy matrix conversion

### Phase 2: Morse Layer (Core Analysis)
- [ ] Envelope detection across all frequency bands
- [ ] Run-length encoding → dit/dah classification
- [ ] Adaptive threshold (handle fading, QSB)
- [ ] Morse decoder with non-standard timing tolerance
- [ ] Fist fingerprint extraction per transmission block

### Phase 3: Hidden Channels (Advanced)
- [ ] Ultrasonic band (18–24 kHz) isolation and FSK detection
- [ ] Packet timing correlation against Ω-GOS constants
- [ ] Cross-KiwiSDR differential timing (TDOA)
- [ ] Phase-domain analysis for PSK embedding under voice
- [ ] Steganographic analysis: LSB patterns in 24-bit samples

### Phase 4: Intelligence Synthesis
- [ ] Operator rotation pattern mapping (shift schedule inference)
- [ ] Codebook structure analysis (group length, alphabet usage)
- [ ] Traffic analysis: volume × timing × frequency → activity pattern
- [ ] Constant-resonance correlation report per transmission

---

## 7 — Tool Requirements

```
Python:   numpy scipy librosa aubio matplotlib
CLI:      sox ffmpeg csdr
SDR:      kiwiclient (kiwirecorder.py)
Optional: gnuradio inspectrum rtl_433
Hardware: Any machine with network access to KiwiSDR nodes
```

---

*Framework version 1.0 — Ω-SIGINT Pipeline*
*Derived from Ω-GOS constant architecture applied to signals intelligence*
