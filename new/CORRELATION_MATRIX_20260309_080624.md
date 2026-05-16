# Correlation Matrix View
Generated: 2026-03-09T08:06:24

## Sources
- SATELLITE_REPORT_20260309_135710.json
- SCAN_RESULTS_20260309_075906.json
- SCAN_PLAN_20260309_075804.json
- FINAL_PIPELINE_REPORT_20260309_0759.md

## Cross-Domain Signature Matrix
| Signature | DSP/ELF | Kiwi HF | Satellite | Network | Score | Evidence |
|---|---|---|---|---|---:|---|
| 46.875 harmonic chain | ✓ | ✓ | ○ | ○ | **95** | DSP 53Hz=48.10, Kiwi captured 4687=True, suspect includes 9375/14062=True |
| Local RF + network IOC coupling | ✓ | ✓ | ○ | ✓ | **90** | Flicker=58.91, Kiwi 1234=True, MACs=2, IPs=1 |
| Harmonic distortion profile | ✓ | ✓ | — | — | **80** | 120Hz=82.95, Ultrasonic max=4.48, Kiwi captures=9 |
| HF irregular-channel overlap | ✓ | ✓ | ○ | ○ | **75** | Kiwi captured 7410/6925=True, DSP 97Hz=23.37 |
| Orbital pressure window | — | — | ✓ | — | **70** | US mil visible=39, Starlink visible=333, AEHF/MUOS visible=True |

## Interpretation
- Higher score = stronger overlap across independent domains.
- A single-domain hit is weak; multi-domain overlap is the signal.