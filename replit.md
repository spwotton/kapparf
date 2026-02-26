# Project KAPPA — Multi-Domain Signal Intelligence & Correlation Platform

## Overview
KAPPA is a software-defined SIGINT platform built with React + Tailwind + TypeScript (frontend), Express (backend), and PostgreSQL (database). It correlates electromagnetic emissions across 11 domains — WiFi, BLE, LTE, 5G, Satellite, SDR, ELF, Radar (ADS-B), PLC, ISP, and Drone — using passive collection tools.

**Observer location:** Calle Caballo Real, Guácima Abajo, Alajuela, Costa Rica (9.9536°N, 84.2907°W, 0.9 km alt)

## KAPPA Engine (server/kappa-engine.ts)
Real-time correlation engine ported from Python. Key features:
- **Kappa Score:** 0–100 with ×0.95 decay every 5 seconds
- **Threat Levels:** NOMINAL (<30), ELEVATED (<60), HIGH (<80), CRITICAL (<95), EMERGENCY (≥95)
- **Constants:** κ = 4/π, Klein Twist = 128.23° (±2°), Giza Cutoff = 51.77°, Clock = 46.875 Hz
- **Evening Windows:** 18:00–20:00 (I) and 20:00–22:00 (II) CST (UTC-6)
- **Correlations:** MAC cross-domain, Congusto (full/partial), stingray chain, IMSI tower hop, Klein twist satellite detection, φ-harmonic timing
- **Device Fingerprinting:** MAC tracked across domains; suspicious = 2+ domains

## Analysis Points
- **Observer** — Guácima Abajo (9.9536°N, 84.2907°W)
- **Jacó** — Pacific coast analysis point (9.6142°N, 84.6278°W)
- **SJO** — Juan Santamaría International Airport, ICAO: MROC (9.9939°N, 84.2088°W)
- **TI0RC** — Radio Club de Costa Rica KiwiSDR node (9.9360°N, 84.1088°W)

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui, wouter routing, TanStack Query v5, Leaflet/OpenStreetMap
- **Backend:** Express.js with typed routes, Drizzle ORM
- **Database:** PostgreSQL (Neon serverless driver)
- **i18n:** EN/ES language toggle with localStorage persistence
- **Theme:** Light/dark toggle, warm neutral Notion-style design
- **Map:** Leaflet + react-leaflet v4 with OpenStreetMap tiles
- **Kappa Engine:** In-memory real-time correlator with score decay and device fingerprinting

## Database Tables
- `signal_events` — unified multi-domain events (wifi, ble, lte, 5g, satellite, sdr, elf, radar, plc, isp, drone)
- `correlations` — cross-domain temporal pattern matches with linked event IDs
- `satellite_passes` — TLE-based satellite tracking data from CelesTrak (41 catalog groups)
- `sdr_nodes` — remote SDR receiver configuration (KiwiSDR, etc.)
- `users` — authentication (unused currently)

## Key API Endpoints
- `GET /api/kappa/status` — kappa score, threat level, evening window, device tracking, correlation counts
- `GET /api/stats` — event counts by domain, total correlations
- `GET/POST /api/events` — signal event CRUD (filterable by ?domain=)
- `GET /api/events/recent` — last 20 events
- `GET /api/devices` — tracked device fingerprints
- `POST /api/osint/lookup` — DNS/reverse lookup for IP or hostname
- `GET /api/weather/radar` — weather conditions at observer location (NOAA)
- `POST /api/correlations/run` — execute correlation engine on 5-min window
- `GET /api/correlations` — list correlation results
- `GET /api/satellites` — satellite data
- `GET /api/satellites/groups` — list all 41 TLE catalog groups and categories
- `POST /api/satellites/refresh` — multi-group TLE refresh from CelesTrak
- `GET /api/flights` — live flight data from OpenSky Network
- `GET /api/analysis-points` — observer, Jacó, SJO, TI0RC locations
- `GET/POST /api/nodes` — SDR node management
- `GET /api/tools` — tool catalog (68 tools across 11 domains)
- `GET /api/tools/meta` — live GitHub metadata with 30-min cache
- `GET /api/rules` — correlation rule definitions
- `GET /api/karachi/modules` — 9 offensive counter-surveillance modules
- `GET /api/congusto/architecture` — VET triode architecture (Cathode/Grid/Anode)
- `GET /api/congusto/modules` — 7 Congusto-Eitel modules
- `GET /api/phoenix/countdown` — Phoenix countdown (2012-07-04 to 2037-01-01)
- `GET /api/finspy/intel` — FinSpy intelligence brief (V1.2 Ghost Protocol + V2.0 Airbnb Ghost)

## Pages
1. **Dashboard** (`/`) — kappa score gauge (SVG arc), threat level, evening window, observer location, domain bars, correlation stats, alerts, events, Phoenix countdown card
2. **Events** (`/events`) — multi-domain event feed with domain filter tabs, ingest dialog
3. **Correlations** (`/correlations`) — correlation results + rule reference + run button
4. **Satellites** (`/satellites`) — TLE catalog selector, category filter, Klein/Giza badges
5. **Devices** (`/devices`) — MAC fingerprint tracking table with suspicious detection
6. **OSINT** (`/osint`) — DNS probe, hidden network detection, surveillance indicators, camera OUIs, OSINT tools
7. **Nodes** (`/nodes`) — SDR node cards with add dialog
8. **Tools** (`/tools`) — 68-tool catalog with domain filtering + live GitHub stars, plus 8 integrated interactive tools (tabbed: Interactive / Catalog)
9. **Map** (`/map`) — interactive Leaflet map showing observer, Jacó, SJO, satellites, flights, SDR nodes
10. **Karachi** (`/karachi`) — offensive counter-surveillance modules (9 Karachi + FinSpy V1.2 Ghost Protocol + V2.0 Airbnb Ghost/Kyndryl), execution flow, success criteria, hardware/infra layer, Alexanderplatz Protocol, Partytown/Service Worker MITM, V2 deliverables
11. **Congusto** (`/congusto`) — Virtual Eitel Triode (VET) architecture (Cathode/Grid/Anode), Phoenix countdown, 7 core modules, mathematical constants table, data sources, confidence levels

## Domains (11)
wifi, ble, lte, 5g, satellite, sdr, elf, radar, plc, isp, drone

## Correlation Rules (54 active)
Includes all previous rules plus Karachi/Congusto rules (chameleon-ble-clone, ltesniffer-rogue-tower, kyanos-rst-injection, satintel-tle-drift, blackjack-blinder-active, dse-gateway-compromise, tr069-persistence, holographic-sideband, humint-biometric-correlation, plc-theta-modulation) and κ-scaled detection rules (GPR-masked uplink, DSE892 SNMP TRAP, MUOS-3 WCDMA, COSMO-SkyMed X-band, rain fade, TR-069 botnet, 5G backhaul κ-tunnel, LSCSA-SVD, system bus exfil, DSE mode change, optical+RF+GPR fusion, ISM LoRa).

## κ-Scaled Architecture Constants
- Masimo Patent: US 5,919,134 / US 6,229,856 B1 (origin of 46.875 Hz)
- κ harmonics: 93.75 Hz, 140.625 Hz, 187.5 Hz (evade all 60 Hz power grid harmonics)
- MUOS-3 (NORAD 40374): GEO tactical narrowband, SA-WCDMA noise floor
- COSMO-SkyMed: X-band (9.6 GHz) SAR, Telespazio cadastral survey cover
- LSCSA-SVD: Weak signal extraction at -30 dB SNR
- GPR: Ground Potential Rise masking via DSE892 SNMP TRAP correlation
- Infrastructure ports: TR-069 (7547), SNMP (161/162), Modbus TCP (502)

## Satellite Tracking
- **Visible**: elevation > 30° from observer
- **Overhead**: elevation > 75°
- **KLEIN**: azimuth within ±2° of 128.23° (Klein twist angle)
- **GIZA**: elevation within ±2° of 51.77° (Giza cutoff)

## Integrated Interactive Tools (8 tools)
All live — no mock data. Located on the Tools page under "Interactive" tab.
1. **HTTP Probe** (Wireshark/Bettercap/tcpdump) — HTTP header analysis, security header audit, latency measurement
2. **Packet Decoder** (tcpdump/Wireshark/Bettercap) — Decode raw Ethernet/IP/TCP/UDP frames from hex
3. **Port Scanner** (nmap/Above) — TCP connect scan on 20 common ports with service identification
4. **DNS Harvester** (theHarvester/SpiderFoot) — DNS records, SOA, MX, TXT, subdomain enumeration
5. **MAC OUI Lookup** (Wireshark/Bettercap) — Device vendor identification via macvendors.com API
6. **RF Calculator** (PhastFT/urh) — Frequency/wavelength/harmonics with κ-Clock, Schumann, ISM presets
7. **ADS-B Decoder** (dump1090/pyModeS) — Decode raw Mode S hex (DF17 Extended Squitter, ICAO, callsign, altitude)
8. **Morse Code** (ggmorse/Morserino-32) — Encode/decode ITU Morse code

### Backend Endpoints
- `POST /api/tools/mac-lookup` — MAC OUI vendor lookup (macvendors.com)
- `POST /api/tools/whois` — DNS harvesting with subdomain enumeration
- `POST /api/tools/port-scan` — TCP connect port scan
- `POST /api/tools/http-probe` — HTTP HEAD request with security header analysis

## OSINT Capabilities
- DNS/reverse lookup (Node.js dns module)
- Hidden SSID detection techniques
- Camera vendor OUI database (Hikvision, Dahua, Reolink, TP-Link)
- Corporate signatures (Kyndryl, IBM, Cisco Meraki)
- Port signatures (RTSP 554, MQTT 1883, CoAP 5683)
- Tool references (theHarvester, Maltego, Shodan, Censys, VirusTotal, nmap, Recon-ng)

## Ω-CHRONOS Hypervisor v4.20 (server/hypervisor.ts)
Automated Tri-Honk temporal correlation engine running at 137ms intervals:
- **Clock:** 37 Hz biological anchor (27.027ms period)
- **Council of Eight:** 8 autonomous agents (PCAP Parser, ELF Dissector, TLE Orbital, KiwiSDR Scanner, Morse Decoder, Temporal Aligner κ-DTW, Symmetry Validator Hall, Report Generator)
- **13 Streams:** 3 KiwiSDR, 2 ELF, 2 satellite, 2 PCAP, ADS-B, Morse FRFT, 46.875 Hz RF, PLC/Modbus
- **κ-DTW Alignment:** Uses HALL_DRIFT_DEG/360 (≈0.00189) as DTW tolerance for φ/κ ratio detection; temporal clustering for simultaneous cross-domain events within burst window (137ms)
- **Hall Reconciliation:** ±0.681973° phase tolerance (HALL_TOLERANCE = 0.00681973), frequency correlation bonus for 46.875 Hz matches
- **Confidence:** HIGH ≥ 0.85 Ψ, MEDIUM ≥ 0.50 Ψ (cross-domain, temporal cluster, frequency match all contribute)
- **Deduplication:** Per-pair tracking prevents re-detection of same event pairs across Tri-Honk cycles
- **API:** /api/hypervisor/status, /start, /stop, /constants

## Rules
- No mock data — all events must come from real sources or manual entry
- No simulated detection pipelines
- Notion-style minimal professional UI (not sci-fi)
