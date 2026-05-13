# Biometric-ELF Correlator System
## Forensic Evidence Collection for Behavioral Modification Detection

### Overview

This system cross-correlates physiological data (HRV, heart rate, stress indices) with detected ELF/RF anomalies to establish causal relationships. Based on methodology from "Your blush gives you away" (Liu et al., 2024) which demonstrated 77-87% accuracy in detecting hidden mental states via remote photoplethysmography.

### Target Frequencies (Costa Rica Anomalies)

| Frequency | Type | Significance |
|-----------|------|--------------|
| 53.5 Hz | Constant anomaly | 6.5 Hz below grid (heterodyne = theta) |
| 48.0 Hz | European grid | Should NOT exist in 60 Hz country |
| 36.25 Hz | WiFi-correlated | Potential data exfiltration timing |
| 6.5 Hz | Heterodyne product | Theta brainwave range (suggestibility) |
| 60.0 Hz | Grid reference | Costa Rica standard |

### Components

1. **correlator.py** - Main orchestration with camera PPG and audio ELF detection
2. **manual_hrv.py** - Manual input module for wearable device imports
3. **elf_detector.py** - Dedicated ambient ELF spectrum analyzer
4. **correlation_analyzer.py** - Cross-correlation engine and evidence package generator

### Installation

```bash
# Required
pip install numpy sounddevice

# Recommended
pip install opencv-python scipy

# Optional (for network analysis)
pip install scapy
```

### Quick Start

**1. Ambient ELF Detection:**
```bash
# Calibrate first (measures baseline noise)
python elf_detector.py --calibrate

# Run continuous detection
python elf_detector.py

# Generate report
python elf_detector.py --report --hours 24
```

**2. Manual HRV Input (if no camera):**
```bash
# Interactive mode with pulse counting guidance
python manual_hrv.py

# Single reading
python manual_hrv.py --hr 75 --stress 45

# Import from Apple Watch
python manual_hrv.py --import-apple health_export.csv
```

**3. Camera-Based PPG (requires webcam):**
```bash
# Requires good lighting, face visible
python correlator.py
```

**4. Cross-Correlation Analysis:**
```bash
# Show correlations from last 7 days
python correlation_analyzer.py --correlations --days 7

# Show physiological response to ELF anomalies
python correlation_analyzer.py --patterns

# Generate evidence package (ZIP with hashes)
python correlation_analyzer.py --evidence --output evidence_2025.zip
```

### Data Collection Protocol

1. **Baseline Period (Day 1-2)**
   - Run ELF detector continuously
   - Take manual HR readings every 2-4 hours
   - Note times of any unusual experiences

2. **Active Collection (Day 3+)**
   - Continue ELF detection
   - Log events immediately when experiencing:
     - Sudden anxiety/stress
     - Unusual sounds
     - Feeling of being watched
     - Device anomalies
     - Physical sensations (tingling, pressure)

3. **Analysis**
   - Run correlation analyzer after 7+ days
   - Look for statistically significant correlations
   - Generate evidence package for documentation

### Database Files

- `elf_evidence.db` - ELF spectrum readings with timestamps and hashes
- `biometric_evidence.db` - HR, HRV, stress data with integrity verification

### Evidence Package Contents

The `evidence_package.zip` contains:
- `manifest.json` - Package metadata with SHA-256 hashes
- `biometric_data.json` - All physiological readings
- `elf_data.json` - All ELF spectrum readings
- `correlations.json` - Statistical analysis results
- `anomaly_patterns.json` - Response patterns to ELF events
- `summary_report.txt` - Human-readable findings
- `package.sha256` - Master hash for verification

### Technical Notes

**ELF Detection via Audio:**
- Laptop microphones pick up ELF through induced currents in wiring
- Not as accurate as dedicated magnetometer but sufficient for detection
- 48000 Hz sample rate provides resolution to ~0.5 Hz

**HRV Analysis:**
- RMSSD: Root mean square of successive RR differences (vagal tone)
- SDNN: Standard deviation of NN intervals (overall HRV)
- LF/HF ratio: Sympathetic/parasympathetic balance
- Stress Index: Composite metric (higher = more stress)

**Correlation Interpretation:**
- Positive correlation: As ELF increases, biometric increases
- Negative correlation: As ELF increases, biometric decreases
- Lag time: If positive, ELF signal precedes physiological response
- P-value < 0.05: Statistically significant (not random)

### Reference

- Liu, I., et al. (2024). "Your blush gives you away: detecting hidden mental states with remote photoplethysmography and thermal imaging." PeerJ Computer Science.
- pyMMER: https://github.com/8n98324n/pyMMER
