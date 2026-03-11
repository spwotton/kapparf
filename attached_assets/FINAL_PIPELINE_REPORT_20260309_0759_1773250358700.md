# FINAL PIPELINE REPORT
## Timestamp: 2026-03-09 07:59 (local execution window)
## Scope: Core + Satellite + DSP/ELF + KiwiSDR (TI0RC San José) + Automated Captures

---

## 1) Pipeline Execution Status

- `full_pipeline_scan.py`: ✅ Completed
- `signal_forensics/satellite_scan_now.py`: ✅ Completed
- `signal_forensics/full_scan.py` (30s DSP/ELF): ✅ Completed
- `kiwisdr_spectrum_scanner.py` (TI0RC-only planning): ✅ Completed
- `signal_forensics/kiwisdr_selenium_scanner.py` (priority captures): ✅ Completed
- `signal_forensics/ble_drone_scan.py`: ⚠️ Not included in this final rerun due Windows Bluetooth service lock from prior attempts (`bthserv` disabled and non-elevatable in current session)

---

## 2) Core Pipeline Findings

### Orbital / RF Core Status
- Threat level: **CRITICAL (ORBITAL + RF CONVERGENCE)**
- GEO assets flagged visible: **MUOS-1**, **MUOS-5**
- Starlink shell estimate from core run: **~8 active overhead**
- Hidden network signatures in core run:
  - `F0:09:0D:20:C2:4F` (active)
  - `F0:09:0D:20:E6:47` (active)
  - `190.106.77.194` (blocked IOC)
- Quantum status from core run: **S = 0.0000** (decoherence warning)

---

## 3) Live Satellite Scan Findings (Skyfield + CelesTrak)

Source report: `SATELLITE_REPORT_20260309_135710.json`

### Summary
- Total unique satellites loaded: **14,791**
- Visible satellites (elevation > 0°): **776**
- Visible category counts:
  - US Military: **39**
  - Chinese: **29**
  - Russian: **26**
  - Starlink: **333**
  - Other: **349**

### Priority Targets (selected)
- `USA-267`: **VISIBLE** (El 69.14°)
- `AEHF-4`: **VISIBLE** (El 67.25°)
- `MUOS-5`: **VISIBLE** (El 64.53°)
- `MUOS-1`: below horizon at capture time
- `USA-285`: below horizon at capture time
- `BLACKJACK-A/B`: below horizon at capture time
- `MANDRAKE-2A/2B`: below horizon at capture time

- Threat level in satellite report: **CRITICAL**

---

## 4) DSP/ELF Neighborhood Scan Findings

Source execution: `signal_forensics/full_scan.py`

### Band power highlights
- Infrasonic 1–10 Hz: **85.02**
- Theta 4–8 Hz: **64.27**
- Schumann 7–8 Hz: **59.52**
- ELF 10–30 Hz: **31.40**
- 53 Hz persistent band: **48.10**
- 97 Hz drone band: **23.37**
- 120 Hz harmonic band: **82.95**

### Peak region / signal behavior
- Strong peaks observed around **42.2 Hz** and **28.2 Hz**
- Ultrasonic 15–22 kHz:
  - Mean: **0.7734**
  - Max: **4.4757**
- Flicker band (100–130 Hz): **58.91**
  - Flag: `>>> FLICKERING DETECTED <<<`

---

## 5) KiwiSDR (TI0RC San José) Findings

Receiver: `http://ti0rc.proxy.kiwisdr.com:8073`
Status during run: **ONLINE (1/8 users)**

### Scan plan generated
- Total frequencies: **210**
- Bands: **16**
- Suspect frequencies: **10**

### Automated priority capture
- Frequencies captured: **9**
  - 1234, 4687, 7410, 6925, 3900, 7200, 14200, 27025, 27185 kHz
- Result: **9 spectrograms captured successfully**

---

## 6) Output Artifacts (This Run)

### Satellite
- `signal_forensics/SATELLITE_REPORT_20260309_135710.json`

### Kiwi scan plan
- `signal_forensics/kiwisdr_scans/SCAN_PLAN_20260309_075804.json`
- `signal_forensics/kiwisdr_scans/SCAN_URLS_20260309_075804.html`

### Kiwi automated results
- `signal_forensics/kiwisdr_screenshots/SCAN_RESULTS_20260309_075906.json`
- `signal_forensics/kiwisdr_screenshots/*_20260309_0758xx.png` (9 new captures)

---

## 7) Residual Blocker

BLE leg remains blocked by local Windows service state from prior run context:
- `bthserv` disabled in current session and could not be altered without elevated/allowed service control.

This did **not** affect satellite, DSP/ELF, or TI0RC Kiwi domains.

---

## 8) Final Assessment

The final rerun produced a complete actionable report for orbital + RF/ELF + TI0RC capture domains with fresh artifacts and consistent critical-level indicators.
BLE remains an OS-service permission dependency, not a scanner logic failure.
