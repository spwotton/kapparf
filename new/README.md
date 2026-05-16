# Signal Forensics Toolkit
## Sonar Imaging & Reverse Engineering Suite

### Overview

Tools for analyzing, reverse engineering, and countering hostile RF/acoustic signals.

### Modules

| Module | Purpose |
|--------|---------|
| `signal_reverse_engineer.py` | Analyze modulation, PRF, encoding of captured signals |
| `wifi_csi_analyzer.py` | Detect WiFi CSI extraction for through-wall imaging |
| `countermeasure_sonar.py` | Active FMCW sonar to image signal sources |

---

## Quick Start

### 1. Analyze a Captured Signal

```bash
# Full analysis of WAV file
python signal_reverse_engineer.py audio_capture.wav

# PRF analysis only
python signal_reverse_engineer.py --prf audio_capture.wav

# Demodulate AM signal
python signal_reverse_engineer.py --demod am --carrier 20000 audio_capture.wav
```

### 2. WiFi Imaging Threat Assessment

```bash
# Scan environment and assess threat level
python wifi_csi_analyzer.py --assess

# JSON output for integration
python wifi_csi_analyzer.py --scan --json
```

### 3. Countermeasure Sonar (Image the Operators)

```bash
# Single room scan
python countermeasure_sonar.py --scan

# Continuous scanning for 5 minutes
python countermeasure_sonar.py --continuous 300 --report --export evidence.json
```

---

## Signal Analysis Details

### Detected Signatures

From your `sonar_events.csv`:

| PRF (Hz) | Interpretation |
|----------|----------------|
| 46.875 | Exact 48000/1024 - software-defined acoustic system |
| 11.71875 | 48000/4096 - long-frame timing |
| ~100 | Dominant frequency in many captures (control signal?) |

### ELF Anomalies

| Frequency | Source | Heterodyne with 60Hz Grid |
|-----------|--------|--------------------------|
| 53.5 Hz | Unknown | 6.5 Hz (theta brainwave) |
| 48.0 Hz | European grid | 12 Hz (alpha-beta boundary) |
| 36.25 Hz | WiFi-correlated | 23.75 Hz (beta) |

### Modulation Types Detected

- **OOK/AM**: Ultrasonic data carrier (BVTSONAR)
- **FMCW**: Room imaging sonar (18-22 kHz chirps)
- **ELF Injection**: Subharmonic power grid manipulation

---

## WiFi Imaging Capabilities

Based on academic research:

| Paper | Capability | Your Risk |
|-------|------------|-----------|
| Feng et al. 2019 | Passive bistatic radar imaging | HIGH - uses existing WiFi |
| Shi et al. 2024 | 256×256 from 20 nodes | HIGH if >10 APs visible |
| WiFi HAR (various) | 97.5% activity recognition | CRITICAL |

### Countermeasures

1. **RF shielding**: Faraday curtains, mesh
2. **WiFi monitoring**: Detect unusual probe requests
3. **Randomize MAC**: Prevent device fingerprinting
4. **Active sonar**: Image operators attempting surveillance

---

## Integration with Biometric Correlator

```python
from signal_forensics.signal_reverse_engineer import SignalReverseEngineer
from biometric_correlator.correlation_analyzer import CorrelationAnalyzer

# Analyze captured signal
engineer = SignalReverseEngineer()
sig = engineer.analyze_file("suspicious_audio.wav")

# Correlate with biometric data
analyzer = CorrelationAnalyzer(
    biometric_db="biometric_evidence.db",
    elf_db="elf_evidence.db"
)

# Generate combined evidence package
analyzer.generate_evidence_package("combined_evidence.zip")
```

---

## Technical Notes

### FMCW Sonar Parameters

- **Frequency range**: 18-22 kHz (inaudible to most adults)
- **Chirp duration**: 50ms
- **Range resolution**: ~4cm (c / 2×BW)
- **Max range**: 5m (limited by laptop speaker power)

### PRF Analysis

The 46.875 Hz PRF is mathematically significant:

```
48000 / 1024 = 46.875 Hz exactly
```

This indicates:
- Digital frame timing (1024-sample FFT blocks)
- Software-defined signal processing
- Likely PC or embedded Linux source (not analog hardware)

### CSI Extraction Detection

Look for:
- High data frame rate (>10 Hz sustained)
- Regular timing (low jitter)
- Concentrated on single BSSID
- Elevated probe request activity

---

## Evidence Chain

All modules maintain forensic integrity:

1. **Timestamps**: Unix epoch, UTC
2. **Hashing**: SHA-256 for all raw data
3. **JSON export**: Machine-readable evidence
4. **Reports**: Human-readable summaries

---

## Dependencies

```bash
pip install numpy scipy sounddevice
```

Optional:
```bash
pip install scapy  # For packet capture
pip install pyshark  # For PCAP analysis
```
