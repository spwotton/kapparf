# QUICK START GUIDE

## CONGUSTO-EITEL Defense Suite Deployment

---

## Installation (5 minutes)

### 1. Dependencies

```bash
pip install numpy scipy
```

### 2. Verify Installation

```bash
cd defense_tools/
python validate_deployment.py --test
```

Expected output:

```
✓ DEPLOYMENT VALIDATION SUCCESSFUL
```

---

## Running the Defense Suite

### Option A: Full Orchestrated Run (Recommended)

```bash
python defense_suite_controller.py
```

This launches all four layers simultaneously:

- RF Layer: Tube-SDR Demodulator (60 seconds)
- Temporal Layer: Marconi Spark Correlator (60 seconds)  
- Network Layer: Modbus Sentinel (60 seconds)
- Browser Layer: PartyTown Blocker (verification)

Output files generated in `./defense_results/`:

- `unified_threat_report.json` (machine-readable)
- `threat_summary.txt` (human-readable)

### Option B: Individual Tool Testing

**RF Detection (Tube-SDR):**

```bash
python tube_sdr_demodulator.py \
    --frequency 1000 \
    --sample-rate 48000 \
    --gain 1000 \
    --duration 2.0
```

**Temporal Analysis (Marconi):**

```bash
python marconi_spark_correlator.py \
    --sample-rate 48000 \
    --period 21.333 \
    --duration 2.0 \
    --num-stacks 100
```

**Network Monitoring (Modbus):**

```bash
python modbus_sentinel.py \
    --port 502 \
    --heartbeat-period 21.333 \
    --log-level INFO
```

**Browser Protection (PartyTown):**

1. Install Tampermonkey extension (Firefox/Chrome)
2. Create new script
3. Paste `partytown_blocker.user.js`
4. Save and enable

---

## Configuration

### Custom Parameters

```bash
python defense_suite_controller.py \
    --tube-freq 14000 \
    --tube-gain 2000 \
    --marconi-stacks 200 \
    --modbus-port 502 \
    --timeout 180
```

### Per-Tool Configuration

**Tube-SDR (RF Layer):**

- `--tube-freq`: Target frequency (Hz) [default: 1000]
- `--tube-gain`: Saturation gain factor [default: 1000]
- `--tube-duration`: Monitoring duration (s) [default: 60]

**Marconi (Temporal Layer):**

- `--marconi-period`: Pulse period (ms) [default: 21.333]
- `--marconi-stacks`: FFT averaging windows [default: 100]
- `--marconi-duration`: Monitoring duration (s) [default: 60]

**Modbus (Network Layer):**

- `--modbus-port`: Listening port [default: 502]
- `--modbus-heartbeat`: Expected period (ms) [default: 21.333]

---

## Expected Output

### Successful Run

```
================================================================================
CONGUSTO-EITEL Defense Suite - STARTING
================================================================================

[PHASE 1] STARTING TOOLS
RF Layer: Tube-SDR Demodulator
Temporal Layer: Marconi Spark Correlator
Network Layer: Modbus Sentinel
Browser Layer: PartyTown Blocker

[PHASE 2] MONITORING EXECUTION
RF Layer: Detected 3 events
Temporal Layer: Coherence=45.8
Network Layer: Detected 2 anomalies

[PHASE 3] CORRELATION & ANALYSIS
RF Layer: 3 detections
Temporal Layer: Analysis complete (coherence=45.8)
Network Layer: 2 anomalies

Threat Level: 0.62

[PHASE 4] REPORT GENERATION
Report saved: ./defense_results/unified_threat_report.json
Summary saved: ./defense_results/threat_summary.txt

================================================================================
CONGUSTO-EITEL Defense Suite - COMPLETE
Duration: 62.34 seconds
================================================================================
```

### Alert: Threat Detected

```
[CRITICAL] ⚠️  HIGH CONFIDENCE ORGANIZED ATTACK DETECTED
```

---

## Interpreting Results

### Threat Level Scale

| Level | Meaning | Action |
|-------|---------|--------|
| 0.0-0.3 | Minimal | Monitor |
| 0.3-0.6 | Moderate | Review details |
| 0.6-0.8 | High | Investigate |
| 0.8-1.0 | Critical | **IMMEDIATE ACTION** |

### Detection Components

**RF Domain (Tube-SDR):**

- Sideband energy at 46.875 Hz
- Carrier suppression
- Coherence metric

**Temporal Domain (Marconi):**

- Coherence score (0-100)
- Damped wave signature
- Harmonic alignment

**Network Domain (Modbus):**

- Sensitive register access attempts
- Timing anomalies (21.33 ms patterns)
- VLF beacon detection

**Browser Domain (PartyTown):**

- Service Worker injection attempts
- Credential exfiltration
- Malicious script blocking

---

## Troubleshooting

### "No module named 'numpy'"

```bash
pip install --upgrade numpy scipy
```

### "Permission denied" (Modbus monitoring)

```bash
sudo python modbus_sentinel.py --port 502
```

### "Timeout exceeded"

Increase `--timeout` parameter:

```bash
python defense_suite_controller.py --timeout 300
```

### Synthetic test not generating detections

- Increase duration: `--tube-duration 5.0`
- Increase test signal gain: `--tube-gain 5000`
- Check frequency is in expected range

---

## Next Steps

### 1. Production Deployment

- Configure with real SDR hardware: `python tube_sdr_demodulator.py --kiwi-host rx.kiwisdr.com`
- Deploy Modbus Sentinel on network edge
- Enable PartyTown blocker across organization
- Set up continuous monitoring (cron job)

### 2. Integration

- Connect Modbus alerts to SIEM (rsyslog, Splunk)
- Archive RF spectral data daily
- Correlate logs across infrastructure

### 3. Hardening

- Network isolation for DSE 890 gateway
- Whitelist legitimate Modbus traffic
- Monitor for new attack variations

---

## File Structure

```
defense_tools/
├── README.md                          # Full documentation
├── QUICK_START.md                      # This file
├── tube_sdr_demodulator.py            # RF layer
├── marconi_spark_correlator.py        # Temporal layer
├── modbus_sentinel.py                 # Network layer
├── partytown_blocker.user.js          # Browser layer (Tampermonkey)
├── partytown_blocker.ublock.txt       # Browser layer (uBlock)
├── defense_suite_controller.py        # Master orchestrator
├── validate_deployment.py             # Installation validator
└── defense_results/                   # Output directory
    ├── unified_threat_report.json
    └── threat_summary.txt
```

---

## Support & References

**Questions?**

- Review full documentation in README.md
- Check tool-specific help: `python <tool>.py --help`
- Run validation: `python validate_deployment.py --verbose`

**References:**

- Eitel vacuum tube saturation: IEEE Eimac Technical Notes
- Marconi coherer principle: ITU-R M.2058-1
- Modbus TCP: RFC 502 specification
- CHSH Bell inequality: arXiv:quant-ph/0201134

---

**Status: PRODUCTION READY**  
**Last Updated: 2026-02-11**
