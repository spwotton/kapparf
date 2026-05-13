# KAPPA RF Observatory — API Reference

**Base URL:** `https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev`
**System:** 24/7 autonomous multi-domain SIGINT correlation platform
**Observer:** jaco hotel pochote grande
---

## Core Constants

| Constant | Value | Description |
|----------|-------|-------------|
| κ (kappa) | 4/π ≈ 1.2732 | Universal scaling constant |
| φ (phi) | 1.618 | Golden ratio |
| TWIST_ANGLE | 128.23° | Klein twist azimuth |
| TEACHER_ANGLE | 51.84° | Teacher angle |
| TARGET_FREQ | 46.875 Hz | κ-scaled sub-carrier frequency |
| DELTA_SLIP | 13.125 Hz | Delta slip frequency |
| MAINS_FREQ | 60 Hz | Costa Rica mains frequency |

---

## 1. System Status

### GET /api/kappa/status
Returns KAPPA engine state — threat level, score, domain windows, correlation counts.
```json
{
  "score": 0.39,
  "threatLevel": "NOMINAL",
  "eventsProcessed": 31,
  "devicesTracked": 7,
  "suspiciousDevices": 0,
  "domainWindows": {"radar": 0, "elf": 0, "sdr": 13},
  "correlationCounts": {"klein-twist": 1},
  "eveningWindow": {"active": false, "localTime": "13:39"},
  "satOverhead": 25,
  "satKlein": 168,
  "kleinPasses": 168,
  "recentAlerts": [...]
}
```

### GET /api/stats
Aggregate event counts by domain.
```json
{
  "totalEvents": 175639,
  "correlationCount": 15182,
  "domainCounts": {"ble": 4, "elf": 1116, "lte": 3, "radar": 71, "satellite": 173640, "sdr": 797, "wifi": 8}
}
```

### GET /api/pipeline/status
Collection pipeline mode, interval, last result.

### GET /api/collectors/status
Status of all collectors (flights, satellites, weather).

### GET /api/watchdog/status
Network watchdog — heartbeat, drop count, TR-069 pulses, seismic jitter.

### GET /api/correlations/stats
Correlation engine stats — rules checked, correlations found.

---

## 2. Events

### GET /api/events/recent
Returns the 20 most recent SIGINT events across all domains.

### GET /api/events?domain={domain}&limit={n}
Filter events by domain (elf, sdr, radar, satellite, wifi, ble, lte).

### POST /api/events
Ingest a new SIGINT event.
```json
{
  "domain": "wifi|sdr|elf|radar|satellite|ble|lte",
  "eventType": "beacon|signal|detection|...",
  "source": "collector-name",
  "frequency": 2437,
  "confidence": 85,
  "latitude": 10.0513892,
  "longitude": -84.2186578,
  "metadata": { ... }
}
```

### POST /api/events/by-ids
Bulk fetch events by ID array: `{"ids": ["uuid1", "uuid2"]}`

### GET /api/events/search?q={term}
Full-text search across events.

---

## 3. Correlations

### GET /api/correlations?limit={n}
Fetch recent correlations (multi-domain pattern matches).

### POST /api/correlations/run
Force a correlation engine cycle.

### GET /api/analysis/correlation/{id}
Deep analysis of a specific correlation (LLM-powered).

### POST /api/correlations/{id}/feedback
Submit human feedback: `{"rating": 1-5, "comment": "..."}`

### GET /api/correlations/{id}/feedback
Read feedback for a correlation.

---

## 4. Devices & Network

### GET /api/devices
All tracked devices (WiFi, BLE, LTE).

### GET /api/threat-scanner/status
Network threat scanner — packets processed, threats detected, recent threats.

### POST /api/threat-scanner/packet
Submit a single packet for threat analysis:
```json
{
  "srcIp": "192.168.1.1",
  "dstIp": "8.8.8.8",
  "srcPort": 443,
  "dstPort": 52301,
  "protocol": "TCP",
  "length": 1500,
  "flags": "PSH,ACK"
}
```

### POST /api/threat-scanner/batch
Submit multiple packets: `{"packets": [...]}`

### POST /api/threat-scanner/pcap-text
Submit tcpdump text output: `{"text": "..."}`

---

## 5. Phone Sensor Integration

### POST /api/phone/register
Register a phone as a sensor node.
```json
{
  "phoneId": "phone-samsung-a52",
  "os": "android-termux",
  "capabilities": ["magnetometer", "accelerometer", "wifi-scan", "cell-info"]
}
```
**Response:** `{"registered": true, "phoneId": "...", "capabilities": [...]}`

### POST /api/phone/sensors
Batch sensor readings from phone.
```json
{
  "readings": [
    {
      "sensorType": "magnetometer",
      "timestamp": 1774208310817,
      "x": 12.5, "y": -3.2, "z": 45.1,
      "source": "kappa-phone/phone-1"
    },
    {
      "sensorType": "light",
      "timestamp": 1774208310817,
      "value": 450.0,
      "source": "kappa-phone/phone-1"
    }
  ]
}
```
**Sensor types:** magnetometer, accelerometer, gyroscope, light, proximity, barometer

### POST /api/phone/sensors/single
Single sensor reading (same fields as above, no array wrapper).

### POST /api/phone/pcapdroid
Ingest PCAP Droid connection data:
```json
{
  "connections": [
    {
      "srcIp": "192.168.1.100",
      "dstIp": "104.16.132.229",
      "srcPort": 52301,
      "dstPort": 443,
      "protocol": "TCP",
      "length": 1500,
      "info": "Chrome"
    }
  ]
}
```

---

## 6. Kyma Consciousness Engine Integration

### POST /api/kyma/frame
Ingest a full Kyma engine frame for biometric-RF correlation.
```json
{
  "timestamp": 1774208310817,
  "dominantState": "focused",
  "kalmanConfidence": 0.85,
  "signal": {
    "affect_valence": 0.6,
    "affect_arousal": 0.4,
    "affect_primary": "calm",
    "quantum_coherence": 0.72,
    "doppler_coherence": 0.68,
    "pll_lock": true
  },
  "kappa": {
    "thoughtRhythm": 0.85,
    "kappaPhase": 2.15,
    "fmo7_coherence": 0.91
  }
}
```
**Response includes:**
```json
{
  "received": true,
  "kymaState": {
    "dominantState": "focused",
    "affectValence": 0.6,
    "affectArousal": 0.4,
    "affectPrimary": "calm",
    "coherence": 0.72
  },
  "kappaStatus": {
    "score": 0.39,
    "threatLevel": "NOMINAL",
    "eventsProcessed": 31
  },
  "correlations": [
    {
      "type": "stress-threat",
      "description": "HRV deviation during RF anomaly",
      "kappaEvent": {...},
      "biometricReading": {...}
    }
  ]
}
```

### POST /api/kyma/reading
Simple biometric reading (legacy/lightweight):
```json
{
  "timestamp": 1774208310817,
  "stress": 42,
  "mood": 65,
  "coherence": 0.72,
  "source": "kyma-affect"
}
```

### GET /api/biometric/status
Biometric correlator state — phones registered, readings ingested, anomaly count.

### GET /api/biometric/correlations
Recent biometric-RF correlations.

### GET /api/biometric/kyma/latest
Latest Kyma engine frame stored in KAPPA.

### GET /api/biometric/kyma/timeline?hours={n}
Kyma state timeline for last N hours (default 24).

---

## 7. Satellites

### GET /api/satellites
All tracked satellites with TLE data, azimuth, elevation.

### GET /api/satellites/groups
Satellite groups and categories.

### POST /api/satellites/refresh
Force TLE refresh: `{"group": "group-name"}`

---

## 8. SDR / KiwiSDR

### GET /api/nodes
KiwiSDR node status (ti0rc, Puntarenas, PJ4G Bonaire).

### POST /api/nodes
Add a new SDR node: `{"name": "...", "url": "...", "lat": ..., "lon": ...}`

### GET /api/vision/status
KiwiVision AI analysis status.

### GET /api/vision/analyses
Recent KiwiSDR spectrum analyses (GPT-4o powered).

### GET /api/vision/context
Context for current VLF/HF monitoring cycle.

### POST /api/vision/capture
Force a KiwiSDR capture: `{"profile": "vlf_nav_37-42"}`

---

## 9. OSINT Tools

### POST /api/tools/mac-lookup
`{"mac": "AA:BB:CC:DD:EE:FF"}` — Vendor lookup.

### POST /api/tools/whois
`{"target": "104.16.132.229"}` — WHOIS lookup.

### POST /api/tools/port-scan
`{"target": "192.168.1.1", "ports": "1-1024"}` — Port scan.

### POST /api/tools/http-probe
`{"url": "https://example.com"}` — HTTP header probe.

### POST /api/osint/lookup
`{"type": "ip|domain|email|phone", "query": "..."}` — Multi-type OSINT.

---

## 10. Intelligence Data

### GET /api/finspy/intel
FinSpy/Gamma Group infrastructure intel.

### GET /api/threat-indicators
Known threat indicators (IPs, domains, patterns).

### GET /api/blackjack-mandrake
Blackjack/Mandrake malware signatures.

### GET /api/eitel-marconi
Eitel-Marconi antenna correlation data.

### GET /api/bart-signatures
BART spectral signature database.

### GET /api/morse-cw
Active Morse/CW intercepts.

### GET /api/riemann-zeros
Riemann zeta function zeros for frequency analysis.

---

## 11. Analysis & Reports

### GET /api/analysis/report
Generate comprehensive analysis report (LLM-powered).

### POST /api/analysis/learn
Trigger ML learning cycle on collected data.

### GET /api/collection-logs?limit={n}
Collection activity logs.

---

## 12. Flights & Weather

### GET /api/flights
Current ADS-B flight tracks in observation area.

### GET /api/weather/radar
Weather radar data affecting RF propagation.

### GET /api/proxy/usgs-quakes
USGS earthquake data (seismic correlation).

### GET /api/proxy/noaa-space-weather
NOAA space weather (ionospheric effects).

### GET /api/proxy/n2yo-passes?id={norad_id}
N2YO satellite pass predictions.

---

## 13. System Architecture

### GET /api/rules
Active correlation rules.

### GET /api/analysis-points
Key analysis points and patterns.

### GET /api/tools
Available OSINT tools.

### GET /api/tools/meta
Tool metadata and capabilities.

### GET /api/karachi/modules
Karachi FinSpy module catalog.

### GET /api/congusto/architecture
Congusto quantum architecture.

### GET /api/congusto/modules
Congusto module definitions.

### GET /api/phoenix/countdown
Phoenix protocol countdown.

### GET /api/council
AI council status.

### GET /api/hypervisor/status
Hypervisor state.

### GET /api/hypervisor/constants
System constants (κ, φ, angles, frequencies).

---

## 14. Lattice & Social

### GET /api/lattice/all
Full lattice network topology.

### GET /api/social/data
Social graph intelligence data.

---

## Integration Pattern: Kyma → KAPPA

For the Kyma consciousness engine to send data to KAPPA:

```python
import requests, time

KAPPA = "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev"

# 1. Send full engine frame every cycle
frame = {
    "timestamp": int(time.time() * 1000),
    "dominantState": "focused",
    "kalmanConfidence": 0.85,
    "signal": {
        "affect_valence": 0.6,
        "affect_arousal": 0.4,
        "affect_primary": "calm",
        "quantum_coherence": 0.72,
        "doppler_coherence": 0.68,
        "pll_lock": True
    },
    "kappa": {
        "thoughtRhythm": 0.85,
        "kappaPhase": 2.15,
        "fmo7_coherence": 0.91
    }
}
result = requests.post(f"{KAPPA}/api/kyma/frame", json=frame)
# result.json() contains correlations, kappaStatus, kymaState

# 2. Check if KAPPA found biometric-RF correlations
correlations = requests.get(f"{KAPPA}/api/biometric/correlations").json()

# 3. Get KAPPA threat status
status = requests.get(f"{KAPPA}/api/kappa/status").json()
print(f"Threat: {status['threatLevel']}, Score: {status['score']}")
```

## Integration Pattern: Phone → KAPPA

```bash
# Termux setup
pkg install python termux-api
python3 kappa-phone-agent.py --continuous --url $KAPPA_URL

# With Kyma bridge
python3 kappa-phone-agent.py --continuous --kyma-url https://your-kyma.replit.app
```
