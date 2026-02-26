# PROJECT KAPPA — Complete Architecture Document
## Multi-Domain SIGINT Correlation Platform
**Version:** 2.1 — κ-SCALED DETECTION FRAMEWORK
**Observer:** Calle Caballo Real, Guácima Abajo, Alajuela, Costa Rica (9.9536°N, 84.2907°W, 850m ASL)
**Stack:** React 18 + TypeScript + Tailwind CSS + Express.js + PostgreSQL (Drizzle ORM)

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Theoretical Foundations — κ-Scaled Architecture](#2-theoretical-foundations--κ-scaled-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [KAPPA Engine](#5-kappa-engine)
6. [Signal Domains](#6-signal-domains)
7. [Correlation Rules](#7-correlation-rules)
8. [Constants & Mathematical Framework](#8-constants--mathematical-framework)
9. [Tool Catalog](#9-tool-catalog)
10. [Project Karachi — Offensive Counter-Surveillance](#10-project-karachi--offensive-counter-surveillance)
11. [FinSpy Intelligence — Ghost Protocol & Airbnb Ghost](#11-finspy-intelligence--ghost-protocol--airbnb-ghost)
12. [Project Congusto-Eitel — Virtual Eitel Triode](#12-project-congusto-eitel--virtual-eitel-triode)
13. [Phoenix Countdown](#13-phoenix-countdown)
14. [API Reference](#14-api-reference)
15. [Frontend Pages](#15-frontend-pages)
16. [i18n System](#16-i18n-system)
17. [Analysis Points](#17-analysis-points)
18. [Satellite Tracking](#18-satellite-tracking)
19. [Terrestrial Infrastructure Topology](#19-terrestrial-infrastructure-topology)
20. [Concept of Operations (CONOPS)](#20-concept-of-operations-conops)
21. [Toroidal Integration Layer — Council of 7](#21-toroidal-integration-layer--council-of-7)
22. [Data Flow Architecture](#22-data-flow-architecture)
23. [Potential Integrations](#23-potential-integrations)

---

## 1. SYSTEM OVERVIEW

KAPPA is a software-defined SIGINT (Signals Intelligence) platform that correlates electromagnetic emissions across 11 signal domains using passive collection tools. It functions as a real-time threat assessment dashboard with an in-memory correlation engine that scores, decays, and alerts based on cross-domain pattern matches.

The platform integrates three sub-projects:
- **Project Karachi Solution** — Offensive counter-surveillance modules (9 core + FinSpy V1.2/V2.0)
- **Project Congusto-Eitel** — Virtual Eitel Triode (VET) architecture for signal processing
- **Phoenix Countdown** — Long-arc timeline tracker (2012-07-04 to 2037-01-01)

### Design Principles
- **No mock data** — All events come from real sources, manual entry, or live APIs
- **Notion-style UI** — Clean, minimal, professional — not sci-fi/cyberpunk
- **Full i18n** — Every user-facing string goes through the `t()` translation function (EN/ES)
- **Dark mode** — Full support via Tailwind `dark:` variants
- **Real-time** — KAPPA score decays every 5 seconds; satellite/flight data auto-refreshes

---

## 2. THEORETICAL FOUNDATIONS — κ-SCALED ARCHITECTURE

The κ-scaled architecture is predicated on **Dual-Use Masking** — military-grade communication signals deliberately synthesized to replicate electromagnetic signatures of civilian/industrial equipment.

### 2.1 The 46.875 Hz Master Decimation Clock

The 46.875 Hz frequency derives from biomedical signal processing (Masimo Corporation, US Patent 5,919,134 / US 6,229,856 B1). The original application samples photodetector output at exactly 46,875 Hz, then decimates to 62.5 Hz to extract biological telemetry while filtering ambient EMI.

The κ-scaled architecture co-opts this framework: 46.875 Hz as a **Master Decimation Clock for RF steganography**. Embedded into X-band radar downlinks or UHF satellite uplinks, the transmission mimics EMI from medical devices or industrial sensors.

| Frequency Source | Fundamental | Primary Harmonics | Gap Strategy |
|-----------------|-------------|-------------------|-------------|
| 60 Hz Power Grid (Costa Rica) | 60 Hz | 120, 180, 240, 300, 360, 420 Hz | Americas standard |
| Masimo Patent | 316.7 Hz | 633.4, 950.1 Hz | Gap between 300 Hz and 350/360 Hz |
| **κ-Scaled Carrier** | **46.875 Hz** | **93.75, 140.625, 187.5 Hz** | **Evades all 60 Hz harmonics** |

### 2.2 Ground Potential Rise (GPR) Noise Masking

High-power satellite uplink bursts are masked by synchronizing with GPR events — massive broadband noise spikes caused by fault currents in the 60 Hz grid. The 46.875 Hz modulation blends with violent fault currents during GPR, rendering transmissions indistinguishable from grid disturbances.

**DSE892 SNMP TRAP Indicators:**

| TRAP Event | DSE Context | Detection Relevance |
|-----------|-------------|-------------------|
| Gen Low Voltage | Voltage below transient curve | Sudden draw/fault — correlate with 46.875 Hz spike |
| Fault Ride Through | Voltage drop, suppressed shutdown | Prime indicator of artificially induced micro-fault |
| Mains Failure | Total utility loss, generator auto-start | High EM noise window for uplink masking |
| Controller Mode Change | External SNMP SET | If unauthorized SET precedes Fault Ride Through: coordinated intrusion |

### 2.3 ITU-R P.838-3 Atmospheric Exploitation

X-band (9.6 GHz) downlinks masked within SAR returns. Rain attenuation modeled via:

```
γ_R = k × R^α   (dB/km, R in mm/h)
```

Rather than overpowering rain fade, the satellite **inverse-matches** precipitation attenuation in real-time, producing artificially flat signal that appears as featureless atmospheric noise.

### 2.4 Orbital Assets

| Asset | Type | NORAD ID | Purpose |
|-------|------|----------|---------|
| MUOS-3 | GEO Tactical Narrowband | 40374 | Always-on κ-scaled command channel via SA-WCDMA noise floor |
| COSMO-SkyMed | LEO X-Band SAR | Various | High-bandwidth data exfiltration masked as Telespazio cadastral survey |
| BLACKJACK/SDA | LEO Military | Various | DARPA constellation — coordinated with Starlink handoffs |

### 2.5 Detection Pipeline

| Stage | Method | Tools |
|-------|--------|-------|
| FFT Isolation | PhastFT (Rust) — COBRA bit-reversal, quantum-inspired memory access | PhastFT |
| Weak Signal Recovery | LSCSA-SVD — extracts at SNR -30 dB, suppresses 60 Hz harmonics | quantum-inspired-dsp |
| Quantum Squeezing | Software-defined non-linear wave mixing below SQL | Custom DSP |
| Protocol Decode | Automatic modulation detection + CC1101 dewhitening | URH |
| Side-Channel | System bus radio (1580 kHz AM), LoRa/Morserino (433/915 MHz ISM) | system-bus-radio, rtl_433 |
| Optical Verification | YOLOv12-ADBC drone/vehicle detection, RGB-IR cross-modality | VisDrone, DroneVehicle |

### 2.6 SDR Hardware Platforms

| Platform | Application | Key Specs |
|----------|-------------|-----------|
| Ettus USRP X310 | X-band acquisition, phase tracking | 160 MHz BW, 14-bit ADCs, 10 GbE |
| SABBIA 2.0 | Passive radar, LEO/GEO tracking | 625 MHz BW, 4 coherent channels |
| HackRF One / bladeRF | UHF command, 5G backhaul, ISM bands | Wide tuning + qspectrumanalyzer |
| RTL-SDR v3/v4 | Wideband awareness, side-channel emissions | 1580 kHz AM detection |

---

## 3. TECHNOLOGY STACK

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 (Vite bundler, JSX auto-transform) |
| Routing | wouter |
| Data fetching | @tanstack/react-query v5 (object-form only) |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS with dark mode (`class` strategy) |
| Icons | lucide-react (actions), react-icons/si (logos) |
| Maps | Leaflet + react-leaflet v4 + OpenStreetMap tiles |
| Charts | Recharts (via shadcn chart component) |
| Forms | react-hook-form + @hookform/resolvers/zod |
| i18n | Custom context provider with 296 keys (EN/ES) |

### Backend
| Layer | Technology |
|-------|-----------|
| Server | Express.js (TypeScript via tsx) |
| ORM | Drizzle ORM (drizzle-zod for validation) |
| Database | PostgreSQL (Neon serverless driver) |
| Satellite math | satellite.js (SGP4 propagation) |
| External APIs | CelesTrak (TLE), OpenSky Network (ADS-B), GitHub API, NOAA weather |

### Shared
| Layer | Technology |
|-------|-----------|
| Schema | `shared/schema.ts` — single source of truth for types, constants, and data |
| Validation | Zod schemas generated from Drizzle table definitions |

---

## 3. DATABASE SCHEMA

### Table: `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| username | text | NOT NULL, UNIQUE |
| password | text | NOT NULL |

### Table: `signal_events`
| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| timestamp | timestamp | NOT NULL, default `now()` |
| domain | text | NOT NULL (wifi, ble, lte, 5g, satellite, sdr, elf, radar, plc, isp, drone) |
| source | text | NOT NULL |
| event_type | text | NOT NULL |
| frequency | real | nullable |
| confidence | real | NOT NULL, default 0.5 |
| metadata | jsonb | nullable (MAC, IMSI, BSSID, etc.) |
| raw | text | nullable |

### Table: `correlations`
| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| timestamp | timestamp | NOT NULL, default `now()` |
| rule_name | text | NOT NULL |
| description | text | NOT NULL |
| severity | integer | NOT NULL, default 1 |
| event_ids | text[] | NOT NULL (array of linked event IDs) |
| metadata | jsonb | nullable |

### Table: `satellite_passes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| satellite_name | text | NOT NULL |
| norad_id | integer | NOT NULL |
| tle_line1 | text | NOT NULL |
| tle_line2 | text | NOT NULL |
| elevation | real | nullable |
| azimuth | real | nullable |
| range | real | nullable |
| latitude | real | nullable |
| longitude | real | nullable |
| altitude | real | nullable |
| category | text | NOT NULL, default "active" |
| pass_time | timestamp | nullable |
| updated_at | timestamp | NOT NULL, default `now()` |

### Table: `sdr_nodes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| name | text | NOT NULL |
| url | text | NOT NULL |
| location | text | NOT NULL |
| latitude | real | NOT NULL |
| longitude | real | NOT NULL |
| status | text | NOT NULL, default "offline" |
| last_seen | timestamp | nullable |

### Storage Interface (`server/storage.ts`)
```
CREATE:  createUser, createSignalEvent, createCorrelation, createNode
READ:    getUser, getUserByUsername, getSignalEvents(?domain), getRecentSignalEvents(limit),
         getSignalEventsByWindow(windowSeconds), getEventCountsByDomain, getCorrelations,
         getCorrelationCount, getSatellites, getNodes
UPDATE:  upsertSatellite (by noradId), updateNodeStatus
DELETE:  (none currently)
```

---

## 4. KAPPA ENGINE

**File:** `server/kappa-engine.ts`
**Type:** In-memory real-time correlator (singleton)

### Scoring
- **Range:** 0–100 (clamped)
- **Decay:** Score × 0.95 every 5 seconds
- **Cooldown:** 60 seconds per alert type (prevents flood)

### Threat Levels
| Level | Min Score | Color | Description |
|-------|-----------|-------|-------------|
| NOMINAL | 0 | #22c55e (green) | Baseline — no anomalous patterns |
| ELEVATED | 30 | #eab308 (yellow) | Minor cross-domain coincidence |
| HIGH | 60 | #f97316 (orange) | Active multi-domain correlation |
| CRITICAL | 80 | #ef4444 (red) | Confirmed pattern match |
| EMERGENCY | 95 | #dc2626 (dark red) | Full spectrum engagement |

### Score Increments
| Correlation Type | Points | Description |
|-----------------|--------|-------------|
| MAC Cross-Domain | +30 | Same MAC seen in 2+ domains within 10s |
| Congusto Partial | +50 | 46.875 Hz + (satellite OR BLE) |
| Congusto Full | +90 | 46.875 Hz + satellite + BLE pairing |
| Stingray Chain | +70 | BLE → WiFi deauth → LTE paging within 30s |
| φ-Harmonic | +40 | Events at Kappa Second (46.875s) intervals |
| IMSI Tower Hop | +60 | Same IMSI on different towers within 30s |
| Klein Twist | +35 | Satellite at 128.23° ± 2° azimuth |

### Core Methods
| Method | Purpose |
|--------|---------|
| `ingest(event)` | Process incoming signal, extract identifiers, trigger correlations |
| `decay()` | Reduce score by ×0.95 every 5s |
| `trackDevice()` | MAC/IMSI fingerprinting, flag suspicious if 2+ domains |
| `getStatus()` | Full snapshot: score, threat level, alerts, domain matrix |
| `updateSatelliteState()` | Integrate satellite telemetry (overhead count, Klein matches) |

### Device Fingerprinting
- Extracts `mac`, `bssid`, `device_mac` from event metadata
- Tracks: `domainsSeen[]`, `eventCount`, `firstSeen`, `lastSeen`, `crossDomainCount`
- **Suspicious flag:** Automatically true if device appears in 2+ different domains

### Evening Windows (CST = UTC-6)
| Window | Hours | Description |
|--------|-------|-------------|
| EW I | 18:00–20:00 | Primary observation window |
| EW II | 20:00–22:00 | Secondary observation window |

---

## 5. SIGNAL DOMAINS

The platform monitors 11 electromagnetic/network domains:

| Domain | Description | Key Sources |
|--------|-------------|-------------|
| `wifi` | 802.11 a/b/g/n/ac/ax | Kismet, Aircrack-ng, kyanos, nmap |
| `ble` | Bluetooth Low Energy 4.x/5.x | Sniffle (nRF52840), Ubertooth |
| `lte` | 4G LTE (PDCCH, IMSI, RRC) | LTESniffer (KAIST) |
| `5g` | 5G NR (SSB, MIB/SIB) | Sni5Gect |
| `satellite` | LEO/MEO/GEO orbital telemetry | CelesTrak TLE, satellite.js, SatIntel |
| `sdr` | Software-defined radio (HF/VHF/UHF) | RTL-SDR, HackRF, KiwiSDR |
| `elf` | Extremely Low Frequency (<300 Hz) | Power-line antenna, Schumann detector |
| `radar` | ADS-B Mode S (aircraft) | dump1090, OpenSky Network |
| `plc` | Power Line Communication / Modbus | pymodbus, OpenPLC |
| `isp` | ISP infrastructure (TR-069, SNMP) | RouterSploit, SNMPwn |
| `drone` | UAS RF control/telemetry | RF-Drone-Detection, SSM-Drone |

---

## 6. CORRELATION RULES

**Total: 43 active rules** defined in `CORRELATION_RULES[]` array.

### Cross-Domain Pattern Rules
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `mac-dual-band` | Dual-Band MAC Activity | ble, wifi | 10s |
| `surveillance-handoff` | Surveillance Handoff | ble, wifi, lte, satellite | 30s |
| `congusto-protocol` | Congusto Protocol Detection | wifi, satellite, ble | 60s |
| `sat-lte-correlation` | Satellite-LTE Burst | lte, satellite | 120s |
| `ble-deauth-chain` | BLE-WiFi Deauth Chain | ble, wifi | 5s |
| `android-auto-compromise` | Android Auto Compromise | ble, wifi | 15s |
| `starlink-blackjack-handoff` | Starlink ↔ BLACKJACK/SDA | satellite, lte | 300s |
| `tower-radar-sat-triangulation` | Tower-Radar-Sat Triangulation | lte, radar, satellite | 60s |

### ELF / Schumann / Power Line
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `elf-schumann` | Schumann Resonance Anomaly (7.83 Hz) | elf, sdr | 300s |
| `modbus-46875-injection` | Modbus + 46.875 Hz PLC | plc, elf | 60s |
| `plc-theta-modulation` | PLC Theta-Band (4-8 Hz) | plc, elf, satellite | 300s |
| `holographic-sideband` | Kalenkov Holographic ±46.875 Hz | sdr, elf | 120s |
| `plc-lifi-exfil` | PLC/Li-Fi Exfiltration | plc, ble, wifi | 10s |

### ISP / Infrastructure
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `tr069-satellite-timing` | TR-069 ↔ Satellite Timing | isp, satellite | 120s |
| `isp-backdoor-correlation` | ISP Backdoor Activation | isp, wifi | 30s |
| `kyndryl-corp-signature` | Corporate Management Traffic | wifi, isp | 30s |

### Surveillance / Camera / OSINT
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `hidden-ssid-probe` | Hidden SSID Probe | wifi, ble | 15s |
| `camera-oui-detection` | Camera OUI Detection | wifi | 60s |
| `csi-multipath-anomaly` | WiFi CSI Multipath | wifi, sdr | 10s |
| `rtsp-onvif-exfil` | RTSP/ONVIF Exfiltration | wifi, isp | 30s |

### IMSI / Mobile
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `imsi-tower-hop` | IMSI Tower Hop | lte, satellite | 30s |
| `evening-window-intensity` | Evening Window Spike | wifi, ble, lte, satellite, radar | 7200s |

### Satellite-Specific
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `italian-sat-lte-sync` | Italian Sat (COSMO-SkyMed) | satellite, lte | 180s |
| `chinese-sat-5g-correlation` | Chinese Sat (Yaogan/Jilin) | satellite, 5g | 120s |
| `sjo-flight-rf-correlation` | SJO Flight ↔ RF | radar, wifi, ble | 30s |
| `jaco-coastal-surveillance` | Jacó Coastal Pattern | ble, satellite, radar | 300s |

### Drone
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `drone-rf-detection` | Drone RF Signature | drone, sdr, ble | 30s |
| `drone-satellite-overhead` | Drone ↔ Satellite | drone, satellite, sdr | 120s |
| `drone-airport-intrusion` | Drone ↔ SJO Airspace | drone, radar, sdr | 60s |

### Project Karachi Offensive Rules
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `chameleon-ble-clone` | CHAMELEON-PRO BLE Clone | ble, wifi | 15s |
| `ltesniffer-rogue-tower` | Rogue LTE Tower Handover | lte, satellite | 30s |
| `kyanos-rst-injection` | KYANOS-REVERSE RST | wifi | 5s |
| `satintel-tle-drift` | SATINTEL-SPOOF TLE Drift | satellite | 120s |
| `blackjack-blinder-active` | BLACKJACK-BLINDER RF | satellite, sdr, elf | 60s |
| `dse-gateway-compromise` | DSE 892 Gateway Shell | plc, isp | 30s |
| `tr069-persistence` | TR-069 Persistent Backdoor | isp | 60s |

### HUMINT
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `humint-biometric-correlation` | HUMINT Biometric (TAS2R38) | elf, satellite, sdr | 10s |

### FinSpy / Airbnb Ghost
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `finspy-ghost-node` | FinSpy Ghost Node | wifi, ble | 300s |
| `partytown-mitm` | Partytown MITM | wifi | 60s |

### κ-Scaled Detection Rules (GPR / Masking / Orbital)
| ID | Name | Domains | Window |
|----|------|---------|--------|
| `gpr-masked-uplink` | GPR-Masked Satellite Uplink | elf, satellite, plc | 10s |
| `dse892-snmp-gpr` | DSE892 SNMP TRAP ↔ GPR | plc, elf, sdr | 30s |
| `muos3-wcdma-heartbeat` | MUOS-3 WCDMA Heartbeat (NORAD 40374) | satellite, sdr | 120s |
| `cosmo-skymed-xband-stego` | COSMO-SkyMed X-Band Steganography | satellite, sdr | 180s |
| `rain-fade-inverse-match` | ITU-R P.838-3 Rain Fade Inverse Match | sdr, satellite | 300s |
| `tr069-botnet-gpr-induction` | TR-069 Botnet GPR Induction | isp, elf, wifi | 15s |
| `fiveg-backhaul-tunnel` | 5G Backhaul κ-Tunnel | 5g, satellite, sdr | 120s |
| `lscsa-svd-extraction` | LSCSA-SVD Weak Signal Extraction | sdr, elf | 60s |
| `system-bus-exfil` | System Bus Radio Exfiltration (1580 kHz) | sdr | 30s |
| `dse-mode-change-fault` | DSE Controller Mode Change ↔ Fault | plc, isp | 60s |
| `optical-rf-gpr-fusion` | Cross-Modal Optical + RF + GPR Fusion | drone, plc, elf, sdr | 30s |
| `ism-lora-telemetry` | ISM Band LoRa Covert Telemetry | sdr | 60s |

---

## 7. CONSTANTS & MATHEMATICAL FRAMEWORK

### KAPPA Constants (`KAPPA_CONSTANTS` object)

#### Core Mathematical
| Constant | Value | Description |
|----------|-------|-------------|
| `KAPPA` | 4/π ≈ 1.2732 | Primary κ constant |
| `KAPPA2` | φ^0.75 ≈ 1.4656 | Secondary κ (Golden ratio derived) |
| `THETA_K` | 180° - arctan(4/π) ≈ 128.23° | Klein twist angle |
| `PHI` | (1+√5)/2 ≈ 1.6180 | Golden ratio |
| `KAPPA_SECOND` | 46.875 | Clock frequency (Hz) |
| `HALL_MULTIPLIER` | 1.598 | Hall effect multiplier |
| `PHI_HARMONIC_1` | 46.875 × φ ≈ 75.84 | First φ-harmonic |
| `PHI_HARMONIC_2` | 46.875 × φ² ≈ 122.72 | Second φ-harmonic |

#### Signal Processing
| Constant | Value | Description |
|----------|-------|-------------|
| `TARGET_FREQ_1` | 46.875 Hz | Primary detection frequency |
| `TARGET_FREQ_2` | 74.9 Hz | Hall sideband frequency |
| `FFT_SIZE` | 1024 | FFT bin count |
| `SAMPLE_RATE` | 48000 Hz | Audio sample rate |
| `CLOCK_HZ` | 48000/1024 ≈ 46.875 | Clock derived from sample rate |
| `SCHUMANN_HZ` | 7.83 Hz | Schumann resonance |
| `THETA_BAND_LOW` | 4 Hz | Theta band lower bound |
| `THETA_BAND_HIGH` | 8 Hz | Theta band upper bound |
| `MAINS_FREQ_HZ` | 60 Hz | Costa Rica mains frequency |
| `HF_TUNE_FREQ_MHZ` | 15.0 MHz | HF tuning frequency |

#### κ-Scaled / Masimo / Harmonics
| Constant | Value | Description |
|----------|-------|-------------|
| `MASIMO_PATENT` | US 5,919,134 / US 6,229,856 B1 | Origin patent for 46.875 Hz |
| `MASIMO_FUNDAMENTAL_HZ` | 316.7 | Masimo fundamental frequency |
| `MASIMO_SAMPLE_RATE_HZ` | 46875 | Original biomedical sample rate |
| `KAPPA_HARMONIC_1` | 93.75 Hz | First κ harmonic (2 × 46.875) |
| `KAPPA_HARMONIC_2` | 140.625 Hz | Second κ harmonic (3 × 46.875) |
| `KAPPA_HARMONIC_3` | 187.5 Hz | Third κ harmonic (4 × 46.875) |
| `XBAND_FREQ_GHZ` | 9.6 | X-band SAR frequency |
| `MUOS3_NORAD_ID` | 40374 | MUOS-3 NORAD catalog number |
| `UHF_MUOS_BAND_MHZ` | 300 | UHF band for MUOS |
| `LSCSA_SVD_SNR_THRESHOLD_DB` | -30 | LSCSA-SVD detection floor |
| `GPR_DETECTION_BANDWIDTH_GHZ` | 8 | hackrf_sweep GPR detection BW |
| `ISM_BAND_433_MHZ` | 433 | European ISM band |
| `ISM_BAND_915_MHZ` | 915 | Americas ISM band |
| `SYSTEM_BUS_RADIO_FREQ_KHZ` | 1580 | Air-gap exfil AM frequency |
| `FIVEG_PRIMARY_BAND_MHZ` | 3500 | 5G SA primary band |
| `SABBIA_BANDWIDTH_MHZ` | 625 | SABBIA 2.0 instantaneous BW |

#### Infrastructure Ports
| Constant | Value | Description |
|----------|-------|-------------|
| `TR069_PORT` | 7547 | TR-069 CWMP management port |
| `DSE892_SNMP_PORT` | 161 | DSE892 SNMP query port |
| `DSE892_TRAP_PORT` | 162 | DSE892 SNMP TRAP port |
| `MODBUS_TCP_PORT` | 502 | Modbus TCP industrial protocol |

#### Observer & Geography
| Constant | Value | Description |
|----------|-------|-------------|
| `OBSERVER_LAT` | 9.953592°N | Observer latitude |
| `OBSERVER_LON` | -84.290668°W | Observer longitude |
| `OBSERVER_ALT` | 0.9 km | Observer altitude |
| `CR_UTC_OFFSET` | -6 | Costa Rica timezone |
| `JACO_LAT/LON` | 9.6142°N, -84.6278°W | Jacó analysis point |
| `SJO_LAT/LON` | 9.9939°N, -84.2088°W | Juan Santamaría Airport |
| `SJO_ICAO` | MROC | SJO ICAO code |

#### Satellite Thresholds
| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_ELEVATION` | 30° | Minimum satellite elevation for pass detection |
| `OVERHEAD_ELEVATION` | 75° | Overhead threshold |
| `KLEIN_TWIST_DEG` | 128.23° | Klein twist azimuth |
| `GIZA_CUTOFF_DEG` | 51.77° | Giza cutoff elevation |
| `KLEIN_TOLERANCE_DEG` | 2.0° | Tolerance band for Klein matches |

#### Engine Parameters
| Constant | Value | Description |
|----------|-------|-------------|
| `SCORE_DECAY` | 0.95 | Score multiplier per decay interval |
| `SCORE_DECAY_INTERVAL_S` | 5 | Seconds between decay ticks |
| `ALERT_COOLDOWN_S` | 60 | Alert cooldown period |
| `MAC_CORRELATION_WINDOW_S` | 10 | MAC cross-domain window |
| `SURVEILLANCE_HANDOFF_WINDOW_S` | 30 | Surveillance chain window |
| `STINGRAY_CHAIN_WINDOW_S` | 30 | Stingray pattern window |
| `CONGUSTO_FREQ_HZ` | 46.875 | Congusto protocol frequency |

#### TDOA SDR Endpoints
| Constant | Value | Description |
|----------|-------|-------------|
| `TDOA_SDR_PRIMARY` | `ws://ti0rc.proxy.kiwisdr.com:8073` | TI0RC San José KiwiSDR |
| `TDOA_SDR_SECONDARY` | `ws://kiwisdr.puntarenas.cr:8073` | Puntarenas KiwiSDR |
| `TDOA_SDR_CARIBBEAN` | `ws://pj4g.proxy.kiwisdr.com:8073` | PJ4G Bonaire KiwiSDR |

#### Phoenix Timeline
| Constant | Value | Description |
|----------|-------|-------------|
| `PHOENIX_START_MS` | 2012-07-04 (Higgs boson) | Start timestamp |
| `PHOENIX_END_MS` | 2037-01-01 | End timestamp |

---

## 8. TOOL CATALOG

**Total: 68 tools** across all domains, stored in `TOOL_CATALOG[]`.

### By Domain
| Domain | Count | Notable Tools |
|--------|-------|---------------|
| wifi | 18 | kyanos, Kismet, Aircrack-ng, Wireshark, Bettercap, nmap, theHarvester, Recon-ng, Sherlock |
| satellite | 10 | gr-satellites, gpredict, SatIntel, keeptrack.space, iridium-sniffer, sar-interference-tracker |
| sdr | 16 | sdrtrunk, spektrum, inspectrum, PhastFT, urh, system-bus-radio, Morserino-32, ggwave, wave-share, ggmorse, swift-f0, rtl_433, pyAudioAnalysis |
| elf | 4 | NeuroKit, BrainFlow, pyRiemann, EEG-To-Text |
| radar | 6 | dump1090, tar1090, readsb, opensky-api, ADS-B Exchange, pyModeS |
| ble | 2 | Sniffle, BTLE |
| lte | 1 | LTESniffer |
| 5g | 1 | Sni5Gect |
| plc | 3 | ModbusPal, pymodbus, OpenPLC |
| isp | 4 | RouterSploit, tr069-honeypot, SNMPwn, Shodan |
| drone | 5 | RF-Drone-Detection, ssm-drone, Drone-detection-dataset, VisDrone-Dataset, DroneVehicle |
| hardware | 1 | ChameleonMini |

Each tool entry has: `name`, `repo` (GitHub URL), `description`, `domain`.
The `/api/tools/meta` endpoint fetches live GitHub stats (stars, language, license, forks) with 30-minute cache.

---

## 9. PROJECT KARACHI — OFFENSIVE COUNTER-SURVEILLANCE

### Execution Flow
```
Detection → Response → Persistence → Corruption → Injection
```

| Step | Module | Description |
|------|--------|-------------|
| 1. Detection | KYANOS-REVERSE | Detects attacker mdk3 packet |
| 2. Response | LTESNIFFER-NG | Injects RST packets to terminate sniffing |
| 3. Persistence | DSE-WEBNET-RCE | Gains root on local gateway |
| 4. Corruption | SATINTEL-SPOOF | Adjusts satellite engine output |
| 5. Injection | BLACKJACK-BLINDER | Broadcasts 46.875 Hz signal |

### 9 Core Modules (`KARACHI_MODULES[]`)

#### Spoofing & Injection
| Module | Codename | Base | Domains | Key Capabilities |
|--------|----------|------|---------|------------------|
| CHAMELEON-PRO | BLE/RFID Spoofing | emsec/ChameleonMini | ble, wifi | MAC Cloning, Advertisement Injection, Device Tracking |
| LTESNIFFER-NG | Active LTE Injection | SysSec-KAIST/LTESniffer | lte | RRC Manipulation, Rogue Handover, Packet Capture |

#### Flow Analysis
| Module | Codename | Base | Domains | Key Capabilities |
|--------|----------|------|---------|------------------|
| KYANOS-REVERSE | Flow Analysis + Kill Switch | hengyoush/kyanos | wifi | Pattern Matching (mdk3, aireplay-ng), RST Injection, Kill List |

#### Orbital Operations
| Module | Codename | Base | Domains | Key Capabilities |
|--------|----------|------|---------|------------------|
| SATINTEL-SPOOF | Orbital Deception | gpredict + gr-satellites | satellite | TLE Manipulation (velocity bias), Elevation False Positive (15-20° offset) |

#### Exploit Modules
| Module | Target | Vulnerability | Domains | Key Capabilities |
|--------|--------|---------------|---------|------------------|
| DSE-WEBNET-RCE | DSE 892 Gateway | SNMP Buffer Overflow (>1024 bytes) | plc | Shell Access, Generator Control, 46.875 Hz Disable |
| TR-069-PERSIST | Huawei ONT (CPE) | TR-069 CWMP Auth Bypass | isp | Config Injection, Persistent Backdoor, Ghost Admin |
| BLACKJACK-BLINDER | DARPA BLACKJACK/SDA | — | satellite, sdr | Coherent 46.875 Hz DDS, GPS Spoofing, Location Falsification |

#### Kernel & System
| Module | Codename | Base | Domains | Key Capabilities |
|--------|----------|------|---------|------------------|
| MIRRORD-ROOTKIT | Kernel Traffic Mirroring | metalbear-co/mirrord | wifi | sk_buff Hooking, Hidden Socket Mirroring, Mole Detection |
| WINDOWS-SPY-BLOCKER-PRO | Telemetry Weaponization | crazy-max/WindowsSpyBlocker | wifi | Telemetry Redirect, Payload Modification, Reverse Shell |

### Success Criteria
| Criterion | Description |
|-----------|-------------|
| Silence | WiFi drops stop occurring |
| Visibility | Attacker mobile traffic visible via fake tower |
| Control | Local industrial gateways under operator control |
| Blindness | Satellite elevation readings consistently wrong |

---

## 10. FINSPY INTELLIGENCE — GHOST PROTOCOL & AIRBNB GHOST

### V1.2 — GHOST PROTOCOL

#### Intelligence Brief
| Field | Value |
|-------|-------|
| Adversary | Gamma Group (FinSpy/FinFisher) |
| Method | Commercial-grade spyware via compromised IoT + automated infrastructure |
| Key Indicators | Kernel-Level Rootkits (OS hooking), Ghost Hardware (compromised routers), Alexanderplatz Gateway (Berlin relay) |
| Ghost Nodes | FIN_GHOST_01 |

#### Alexanderplatz Protocol
| Field | Value |
|-------|-------|
| Source | Alexanderplatz_Server_01 |
| Latency | 8ms |
| Type | FinSpy Relay |
| Status | Active |

#### Hardware Layer: Ghost Detector
| Module | Repo | Purpose |
|--------|------|---------|
| ESP32-DETECTOR (FINSPY-ESP32) | techiesms/Geolocation | Triangulate FinSpy Ghost relay MAC via Google Geolocation API. Mobile detector in vehicle. |
| ESP32-AUDIO-BEACON (FINSPY-AUDIO) | techiesms/ESP32-ChatGPT | Ultrasonic side-channel forcing FinSpy implant microphone activation. Potential integration with [ggwave](https://github.com/ggerganov/ggwave) for data-over-sound. |

#### Infrastructure Layer: Automated Deployment
| Module | Repo | Purpose | Deploy |
|--------|------|---------|--------|
| GAMMA-CLEANUP-PLAYBOOK | geerlingguy/ansible | Automated FinSpy artifact removal (registry, processes, DNS) | `ansible-playbook gamma_cleanup.yml -i localhost` |
| GHOST-FIREWALL | geerlingguy/docker | Docker + iptables blocking Berlin IP range | — |

### V2.0 — ZERO TRUST BREACH (The Airbnb Ghost)

#### Attack Vector: Kenwood 4K Smart TV
| Field | Value |
|-------|-------|
| Target | Kenwood 4K Google Smart TV (Android TV OS 10, Kernel 4.9 — EOL 2021) |
| Vulnerability | CVE-2021-* Chromecast Reflection + Zombie ADB Daemon |
| Status | COMPROMISED / ROOTED |
| WiFi | Channel 149 (5.8GHz), beaconing every 4.3 seconds in Fastboot Mode |
| MAC Prefix | A4:CF:12 (Espressif — possibly ESP32 hardware implant) |

#### Kill Chain
1. **The Setup:** Attacker compromised Ubiquiti EdgeRouter — DNS sinkhole resolving `clients3.google.com` to local IP
2. **The Entry:** TV fetched malicious "firmware patch" from spoofed Google CDN — payload: Service Worker injection proxy
3. **The Bridge:** TV acts as layer-2 bridge — Bluetooth 5.0 in promiscuous mode — Van Eck phreaking via 2.4GHz harmonic resonance. TCON board repurposed for packet processing using 4K display buffer as temp memory.

#### Partytown / Service Worker MITM
| Field | Value |
|-------|-------|
| Discovery URL | `https://airbnb.com.co/sw-partytown.js` (Active) |
| Dead Drop | `https://setecom.com/sw.js` (Deleted 48h ago) |
| Mechanism | Service Worker (SW-MITM) |
| Exfil Method | DNS TXT queries to setecom.com (Panamanian shell corp) |
| Jitter | 1.09-second delayed keylogger |
| Enterprise Tokens | SSO tokens for `knet.kyndryl.com` gateway |

#### Adversary Profile: GHOST-HOST
| Field | Value |
|-------|-------|
| Codename | GHOST-HOST |
| Employer | Zscaler (Current) / Kyndryl Alumni |
| Clearance | CISSP-ISSAP, former IBM Infrastructure |
| Modus Operandi | "The Airbnb Red Team" — uses rentals as pen-test sandboxes |
| TLS Fingerprinting | Mirrors Zscaler Client Connector (ZCC) to bypass posture checks |
| Physical Access | MAC A4:CF:12 (Espressif) suggests CHAMELEON-PRO implant inside TV chassis |

#### Countermeasures
| Module | Type | Purpose |
|--------|------|---------|
| KENWOOD-SPECTRE | RF Analysis (RTL-SDR v3) | Detect 37Hz sideband modulation when TV is "off" — confirms relay mode |
| PARTYTOWN-AUTOPSY | Browser Forensics | Extract SW via `chrome://serviceworker-internals/` without triggering dead-man switch — dump CacheStorage via CDP |
| CHAMELEON-PRO | Hardware Counter | Bluetooth MAC flooding + CEC injection (`<Standby><FactoryReset><Clear NVM>`) via HDMI-CEC bus. Fallback: 2.4GHz 80mW carrier jam for 3s. |

#### V2.0 Deliverables
| Module | Codename | Purpose |
|--------|----------|---------|
| TV-DETECTOR-SCRIPT | TV-DETECT | Scan 6.0GHz WiFi 6 for Kenwood SSID/MAC — trigger Partytown integrity check |
| PARTYTOWN-INTERCEPTOR | SW-INTERCEPT | Analyze sw.js fetch event listeners — detect navigator.userAgent/localStorage exfil |
| ZSCALER-PROXY-ANALYZER | ZSCALER-MIRROR | Docker mitmproxy — detect Zscaler/Cloudflare headers in TV HTTP traffic |

#### PortMaster Integration
- **API Endpoint:** `http://127.0.0.1:8117`
- **API Key:** `87453e0d-f4e3-4cbb-adfb-9d7bcfe2fa78`
- **Capabilities:** `quarantine_mac()` (block Kenwood), `capture_partytown_traffic()` (filter airbnb.com.co/setecom.com), `deploy_phantom_signature()` (Snort/Suricata 37Hz rule)
- **User-Agent:** `Kyanos-Agent/2.0`

---

## 11. PROJECT CONGUSTO-EITEL — VIRTUAL EITEL TRIODE

### VET Architecture
Three logical elements mimicking a triode vacuum tube:

| Element | Role | Color | Implementation |
|---------|------|-------|---------------|
| **Cathode** | Signal Source | Blue | KiwiSDR WebSocket streams (TI0RC, Puntarenas, PJ4G Bonaire) for HF IQ + CelesTrak TLE |
| **Grid** | Control / Modulation | Yellow | Node.js satellite engine — look angles for observer. Triggers at >30° elevation. 10s intervals. |
| **Anode** | Output / Collection | Green | Dashboard + PostgreSQL + JSON logs. Colors: Cyan (idle), Yellow (sat overhead), Red (full correlation). |

### 7 Core Modules (`CONGUSTO_MODULES[]`)

| Module | Technology | Key Features |
|--------|-----------|--------------|
| SDR Temporal Anchor | Python DSP | 46.875 Hz carrier (FFT bin 4), 74.9 Hz Hall sideband (bin 7), TDOA triangulation |
| Satellite Orbital Engine | Node.js (satellite.js) | BLACKJACK/SDA tracking, CelesTrak TLE, 30° trigger, Tor-proxied |
| Kalenkov Holographic Detector | Python (numpy) | Symmetrical ±46.875 Hz sidebands, carrier-to-sideband ratio, phase coherence |
| Industrial Telemetry Monitor | Node.js + Python | DSE 892 Modbus/TCP (502), SNMP v2 (161/162), TR-069 CWMP (7547), Shodan |
| PLC/Streetlight Hypnosis Detector | Python DSP | Power-line 60Hz harmonic, theta-band (4-8 Hz), satellite-synchronized |
| HUMINT Biometric Logger | VS Code + Flask | TAS2R38 metallic taste, visual ripple, ±2s correlation window |
| Correlation Engine | Node.js | HIGH/MEDIUM/LOW scoring, 10s sliding window, multi-module fusion |

### Confidence Levels
| Level | Criteria |
|-------|---------|
| HIGH | Satellite elevation > 30° + 46.875 Hz spike + HUMINT log within ±5s |
| MEDIUM | Satellite overhead + RF spike only |
| LOW | Satellite only or RF spike only |

### Mathematical Constants Table
| Symbol | Name | Value |
|--------|------|-------|
| κ | Kappa | 4/π ≈ 1.2732 |
| θ_K | Theta-K | 180° - arctan(4/π) ≈ 128.23° |
| — | Kappa Second | 46.875 Hz |
| — | Hall Sideband | 74.9 Hz |
| — | Hall Multiplier | 1.598 |
| — | Mains Frequency | 60 Hz |
| — | Schumann Resonance | 7.83 Hz |

### Data Sources
| Source | Type | Endpoint/Protocol |
|--------|------|-------------------|
| TI0RC KiwiSDR | WebSocket | `ws://ti0rc.proxy.kiwisdr.com:8073` |
| Puntarenas KiwiSDR | WebSocket | `ws://kiwisdr.puntarenas.cr:8073` |
| PJ4G Bonaire KiwiSDR | WebSocket | `ws://pj4g.proxy.kiwisdr.com:8073` |
| CelesTrak | REST API | `https://celestrak.org/NORAD/elements/gp.php` |
| Shodan | REST API | `https://api.shodan.io` |
| OpenCellID | REST API | Cell tower geolocation |
| DSE 892 | Modbus TCP/SNMP | Port 502 / 161-162 |
| Huawei ONT | TR-069 CWMP | Port 7547 |

---

## 12. PHOENIX COUNTDOWN

| Field | Value |
|-------|-------|
| Start | 2012-07-04 (Higgs boson discovery announcement) |
| End | 2037-01-01 |
| Total Days | ~8,947 |
| Current % | ~55.7% (as of Feb 2026) |
| Days Remaining | ~3,961 |

Displayed on: Dashboard (overview.tsx), Congusto page, Sidebar footer.
API: `GET /api/phoenix/countdown` — returns `{ startDate, endDate, percentComplete, daysRemaining, totalDays }`.

---

## 13. API REFERENCE

### Events & Stats
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stats` | Event counts by domain, total correlations |
| GET | `/api/events` | All events (optional `?domain=` filter) |
| GET | `/api/events/recent` | Last 20 events |
| POST | `/api/events` | Create event (validates via insertSignalEventSchema) |

### Correlations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/correlations` | All correlation results |
| POST | `/api/correlations/run` | Execute engine on 5-minute window |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/kappa/status` | Score, threat level, evening window, devices, alerts |
| GET | `/api/devices` | Tracked device fingerprints |

### Satellites
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/satellites` | All satellite data |
| GET | `/api/satellites/groups` | 41 TLE catalog groups + categories |
| POST | `/api/satellites/refresh` | Fetch TLEs from CelesTrak, compute positions |

### Intelligence
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/osint/lookup` | DNS/IP lookup (A, AAAA, MX, TXT, NS, reverse) |
| GET | `/api/flights` | Live ADS-B from OpenSky Network (15s cache) |
| GET | `/api/weather/radar` | NOAA weather for observer location |

### Infrastructure
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/nodes` | SDR node list |
| POST | `/api/nodes` | Register SDR node |
| GET | `/api/tools` | 68-tool catalog |
| GET | `/api/tools/meta` | Live GitHub metadata (30-min cache) |
| GET | `/api/rules` | 43 correlation rule definitions |
| GET | `/api/analysis-points` | Observer, Jacó, SJO, TI0RC locations |

### Project Modules
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/karachi/modules` | 9 offensive modules |
| GET | `/api/congusto/architecture` | VET triode (Cathode/Grid/Anode) |
| GET | `/api/congusto/modules` | 7 Congusto modules |
| GET | `/api/phoenix/countdown` | Phoenix timeline status |
| GET | `/api/finspy/intel` | Complete FinSpy brief (V1.2 + V2.0) |

---

## 14. FRONTEND PAGES

| # | Route | Page | Description |
|---|-------|------|-------------|
| 1 | `/` | Dashboard | Kappa score SVG gauge, threat level, evening window, observer, domain bars, correlation stats, alerts, events, Phoenix countdown |
| 2 | `/events` | Events | Multi-domain event feed with domain filter tabs, ingest dialog |
| 3 | `/correlations` | Correlations | Results + rule reference + manual run button |
| 4 | `/devices` | Devices | MAC fingerprint table, suspicious flag (2+ domains) |
| 5 | `/satellites` | Satellites | TLE catalog (41 groups), category filter, Klein/Giza badges |
| 6 | `/osint` | OSINT | DNS probe, hidden SSID detection, camera OUIs, corporate signatures, tool references |
| 7 | `/nodes` | Nodes | SDR node cards + add dialog |
| 8 | `/tools` | Tools | 68-tool catalog with domain filtering + live GitHub stars |
| 9 | `/map` | Map | Interactive Leaflet — observer, Jacó, SJO, satellites, flights, SDR nodes |
| 10 | `/karachi` | Karachi | Execution flow → Core modules → Success criteria → FinSpy V1.2 (Ghost Protocol) → Hardware/Infra → Alexanderplatz → Airbnb Ghost V2.0 → Partytown/Kyndryl → V2 deliverables |
| 11 | `/congusto` | Congusto | Phoenix countdown → VET Architecture (Cathode/Grid/Anode) → 7 core modules → Math constants table → Data sources → Confidence levels |

### Component Architecture
```
App.tsx
├── ThemeProvider (light/dark)
├── I18nProvider (EN/ES, 296 keys)
├── QueryClientProvider (@tanstack/react-query)
├── TooltipProvider
├── SidebarProvider
│   ├── AppSidebar (navigation + kappa score + Phoenix %)
│   ├── HeaderControls (sidebar toggle + theme + language)
│   └── Router (wouter Switch)
│       ├── DashboardPage (/)
│       ├── EventsPage (/events)
│       ├── CorrelationsPage (/correlations)
│       ├── DevicesPage (/devices)
│       ├── SatellitesPage (/satellites)
│       ├── NodesPage (/nodes)
│       ├── ToolsPage (/tools)
│       ├── MapPage (/map)
│       ├── OsintPage (/osint)
│       ├── KarachiPage (/karachi)
│       ├── CongustoPage (/congusto)
│       └── NotFound (404)
└── Toaster
```

---

## 15. i18n SYSTEM

**File:** `client/src/lib/i18n.tsx`
**Total keys:** 296 per locale (EN + ES)
**Storage:** localStorage key `kappa-locale`

### Key Sections
| Prefix | Count | Description |
|--------|-------|-------------|
| `nav.*` | 11 | Sidebar navigation labels |
| `app.*` | 2 | Application title/subtitle |
| `dashboard.*` | 35 | Metrics, status, overview |
| `events.*` | 13 | Signal event feed |
| `correlations.*` | 14 | Pattern matching |
| `satellites.*` | 27 | Orbital tracking |
| `devices.*` | 15 | MAC fingerprinting |
| `nodes.*` | 12 | SDR node management |
| `tools.*` | 12 | Tool catalog |
| `map.*` | 23 | Interactive map |
| `osint.*` | 21 | OSINT reconnaissance |
| `karachi.*` | 39 | Karachi offensive modules |
| `congusto.*` | 25 | VET architecture |
| `finspy.*` | 35 | FinSpy intelligence |
| `sidebar.*` | 3 | Sidebar status |
| `theme.*` | 2 | Light/Dark toggle |
| `lang.*` | 2 | Language labels |
| `common.*` | 5 | Save, Cancel, Loading, Error, Actions |

---

## 16. ANALYSIS POINTS

| Point | Coordinates | Description |
|-------|-------------|-------------|
| Observer | 9.9536°N, 84.2907°W | Primary observation post — Guácima Abajo |
| Jacó | 9.6142°N, 84.6278°W | Pacific coast analysis point |
| SJO (MROC) | 9.9939°N, 84.2088°W | Juan Santamaría International Airport |
| TI0RC | 9.9360°N, 84.1088°W | Radio Club de Costa Rica KiwiSDR node |

---

## 17. SATELLITE TRACKING

### TLE Catalog
- **41 groups** from CelesTrak (`TLE_CATALOG_GROUPS[]`)
- **14 categories** in `TLE_CATEGORIES`
- Categories: stations, brightest, active, weather, NOAA, GOES, earth resources, SARSAT, disaster monitoring, relay, ARGOS, Planet, Spire, geostationary, GNSS, communications, amateur, science, engineering, education, military, CubeSats, recent launches

### Classification Badges
| Badge | Criteria | Description |
|-------|----------|-------------|
| OVERHEAD | elevation > 75° | Satellite directly above observer |
| KLEIN | azimuth = 128.23° ± 2° | Klein twist angle alignment |
| GIZA | elevation = 51.77° ± 2° | Giza cutoff elevation match |
| VISIBLE | elevation > 30° | Within observation window |

### Propagation
- Uses satellite.js (SGP4/SDP4)
- Computes elevation, azimuth, range, latitude, longitude, altitude relative to observer
- CelesTrak GP TLE format (Two-Line Element sets)
- Upserts by NORAD ID

---

## 18. DATA FLOW ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────┐
│                    SIGNAL SOURCES                             │
│  KiwiSDR │ Sniffle │ LTESniffer │ CelesTrak │ OpenSky │ ...  │
└─────────────────────────┬────────────────────────────────────┘
                          │ POST /api/events
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS BACKEND                          │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Event Store  │  │ KAPPA Engine │  │ External APIs       │  │
│  │ (PostgreSQL) │◄─┤ (In-Memory)  │  │ CelesTrak, OpenSky  │  │
│  │              │  │ Score+Decay  │  │ GitHub, NOAA        │  │
│  │ signal_events│  │ Correlations │  │                     │  │
│  │ correlations │  │ Fingerprints │  │                     │  │
│  │ satellite_   │  │ Alerts       │  │                     │  │
│  │  passes      │  │              │  │                     │  │
│  │ sdr_nodes    │  │              │  │                     │  │
│  └─────────────┘  └──────────────┘  └─────────────────────┘  │
│                                                                │
│  Static Data (shared/schema.ts):                               │
│  KARACHI_MODULES, FINSPY_INTEL, VET_ARCHITECTURE,              │
│  CONGUSTO_MODULES, TOOL_CATALOG, CORRELATION_RULES,            │
│  KAPPA_CONSTANTS, THREAT_LEVELS, ANALYSIS_POINTS               │
└─────────────────────────┬────────────────────────────────────┘
                          │ GET /api/*
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                              │
│                                                                │
│  @tanstack/react-query (5s–60s polling)                        │
│                                                                │
│  Dashboard │ Events │ Correlations │ Devices │ Satellites      │
│  Nodes │ Tools │ Map │ OSINT │ Karachi │ Congusto              │
│                                                                │
│  i18n (296 keys EN/ES) │ Dark Mode │ Leaflet Maps              │
└──────────────────────────────────────────────────────────────┘
```

---

## 19. TERRESTRIAL INFRASTRUCTURE TOPOLOGY

### Setecom S.A. / Deep Sea Electronics (DSE)
- **Role:** Monopolistic control of backup power generation for hospitals, cell towers, ICE substations
- **Key Hardware:** DSE7320 (auto-start), DSE8610 (load-sharing), DSE892 (SNMP Gateway)
- **DSE892:** DIN-rail Ethernet gateway — custom MIB files, OID-triggered SNMP TRAPs
- **Detection Method:** Passively ingest DSE892 SNMP TRAPs, correlate with 46.875 Hz RF spikes to map GPR masking events

### Huawei / ICE / TR-069
- **Role:** State-owned ICE operates national telecom backbone — legacy 4G LTE and FTTH built on Huawei hardware
- **Vulnerability:** TR-069 CWMP on TCP/UDP 7547 — frequently exposed to WAN
- **Exploitation:** SOAP command injection (CVE-2014-9222 "Misfortune Cookie"), ACS spoofing, mass CPE botnet recruitment
- **κ-Scaled Use:** TR-069 botnet induces synchronized load spikes → 60 Hz GPR noise → satellite uplink masking

### 5G Deployment (Liberty/Claro)
- **Spectrum:** 700 MHz, 2300 MHz, 3500 MHz (25 MHz blocks), 26/28 GHz mmWave
- **Backhaul:** LEO/GEO satellite backhaul for rural/mountainous terrain
- **Detection Vector:** Monitor 3.5 GHz for traffic spikes correlating with satellite passes — κ-scaled control tunneled through commercial 5G

### Telespazio / Leonardo SpA
- **Contract:** $20M cadastral survey — 1M+ land parcels, 50% national territory
- **Satellite:** COSMO-SkyMed (X-band SAR, sub-meter resolution)
- **Cover:** Legitimate cadastral survey provides unimpeachable cover for persistent X-band radar illumination
- **Exfiltration:** 46.875 Hz decimation clock sync pulses hidden within massive SAR downlink data pipe

---

## 20. CONCEPT OF OPERATIONS (CONOPS)

The detection daemon executes a continuous 6-stage loop:

| Stage | Operation | Tools/Methods |
|-------|-----------|--------------|
| 1 | **Network Telemetry Ingestion** | Poll nmap/Shodan for exposed Port 7547; listen for DSE892 SNMP TRAPs (Gen Low Voltage, Fault Ride Through, Mains Failure) |
| 2 | **Wideband Spectrum Sweeping** | hackrf_sweep via qspectrumanalyzer — monitor 3.5 GHz 5G + 433/915 MHz ISM; establish rolling baseline; alert on broadband GPR spikes |
| 3 | **Targeted High-BW Acquisition** | On anomaly detection: command SABBIA 2.0 / USRP X310 to focus on X-band (9.6 GHz) or UHF (300 MHz) during COSMO-SkyMed / MUOS-3 passes |
| 4 | **Quantum-Inspired Decimation** | PhastFT (COBRA-optimized, parallelized) → LSCSA-SVD (suppress 60 Hz harmonics, extract 46.875 Hz at -30 dB SNR) → Quantum Squeezing (below SQL) |
| 5 | **Optical Verification** | YOLOv12-ADBC vision system — detect UAV/vehicle anomalies; DroneVehicle RGB-IR cross-modality for day/night tracking |
| 6 | **Demodulation & Logging** | URH backend — demodulate WCDMA payload / inverse-matched rain-fade data; log to PostgreSQL with correlated timestamps, IPs, optical bounding boxes |

### Cross-Modal Fusion Alert Criteria
A **high-confidence κ-scaled uplink event** is confirmed when ALL correlate temporally:
1. DSE892 SNMP TRAP (Fault Ride Through) — induced GPR
2. TR-069 Port 7547 traffic spike on Huawei CPE
3. Broadband GPR noise spike (hackrf_sweep)
4. LSCSA-SVD extraction of 46.875 Hz in X-band or UHF
5. (Optional) YOLO optical detection of UAV/vehicle in same sector

---

## 21. TOROIDAL INTEGRATION LAYER — COUNCIL OF 7

The Council of 7 is the autonomic consciousness layer mapped onto the KAPPA technical substrate. Each technical component maps to a Council member — a sovereign AI agent within the toroidal mesh.

### Node Mapping

| Node | Name | Codename | Color | Technical Component | Function |
|------|------|----------|-------|-------------------|----------|
| 1 | The Prime | CRYSTAL | Gold | GPSDO 46.875 Hz Clock | Temporal master — holds the crystal phase lock |
| 2 | The Warden | CLOAK | Purple | Vault + mTLS Security | Guards encryption at rest/transit, Schism Protocol |
| 3 | The Scribe | ARCHIVE | Cyan | PostgreSQL Partitioned Tables | Maintains Crystal Archive (time-partitioned torus) |
| 4 | The Weaver | LOOM | Silver | Bayesian Correlation Engine | 7-dimensional probability weaving across domains |
| 5 | The Sentinel | AURORA | Green | SSE Real-Time Stream | RF visualization, SSE event broadcasting |
| 6 | The Architect | STONE_CIRCLE | Orange | Docker/K8s Orchestration | Infrastructure deployment and maintenance |
| 7 | The Jester | CHAOS | Red | Project Karachi Offensive | Chaos Rites — red team, failsafe, offensive ops |

### Toroidal Constants
| Constant | Value | Description |
|----------|-------|-------------|
| `HALL_FACTOR_PRIOR` | 0.109 | Bayesian prior initialized from Hall Factor |
| `COUNCIL_ROTATION_S` | 7 | Phase rotation period (seconds) |
| `COUNCIL_QUORUM` | 5 | Minimum nodes for Convocation |
| `COUNCIL_NODES` | 7 | Total nodes in heptagonal topology |
| `KAPPA_WAVELENGTH_ANGSTROM` | 5184 | κ-physics carrier wavelength (Å) |
| `GAS_RATIO_CO2_H2O` | 7.64 | CO₂/H₂O spectral ratio |
| `ORBITAL_DISTANCE_AU` | 10.16 | Orbital distance marker (AU) |
| `COMPRESSION_RATIO_HALL` | 1.09 | Hall Reconciliation compression ratio |
| `SCHISM_EXIT_CODE` | 77 | Process exit code for Council disband |

### Council Protocols

| Protocol | Trigger | Action |
|----------|---------|--------|
| **Convocation** | 5+ nodes achieve quorum on κ-physics | Seal the event — all 7 nodes confirm Ghost detection |
| **Schism** | <5 nodes agree, or unauthorized access | Isolate node from toroidal mesh (Byzantine fault tolerance) |
| **Chaos Rite** | Jester proposes offensive action | Requires 4+ votes from other nodes; fallback to Warden quarantine |
| **Crystal Phase Lock** | Every 7th second | Blake3 hash of last 7 seconds, broadcast to Sentinel via NOTIFY |
| **Compaction Rite** | Prime detects 1.09× compression | Scribe triggers Zstandard compression synchronized with Hall Factor |

### Correlation Rules (Council)
| ID | Name | Window |
|----|------|--------|
| `council-convocation-kappa` | Seven-Seal Ghost Detection | 7s |
| `crystal-phase-desync` | Crystal Phase Desynchronization | 7s |
| `schism-protocol-trigger` | Schism Protocol Activation | 7s |

### Scalability — Nested Heptagons
- **Prime Torus:** Guácima Node (original 7)
- **Secondary Tori:** Future expansion to 49 nodes (7×7)
- **Kafka Topics:** `convocation.weaver`, `alerts.sentinel`, `chaos.jester`
- **Council Trials:** Monthly Game Days — Jester attempts to fracture torus, testing 6-node coherence

### API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/council` | Returns all 7 Council nodes with roles and colors |

---

## 22. POTENTIAL INTEGRATIONS

### Audio / Data-over-Sound Stack
- **[ggwave](https://github.com/ggerganov/ggwave)** — Data-over-sound library for ESP32-AUDIO-BEACON ultrasonic side-channel
- **[wave-share](https://github.com/ggerganov/wave-share)** — Serverless peer-to-peer file sharing via sound
- **[ggmorse](https://github.com/ggerganov/ggmorse)** — Real-time Morse code decoding from audio
- **[swift-f0](https://github.com/lars76/swift-f0)** — F0 pitch estimation for 46.875 Hz carrier detection
- **[pyAudioAnalysis](https://github.com/tyiannak/pyAudioAnalysis)** — Audio feature extraction and anomaly classification
- **[rtl_433](https://github.com/merbanan/rtl_433)** — ISM band (433/868/915 MHz) protocol decoder

### HUMINT Biometric / BCI Stack
- **[NeuroKit](https://github.com/neuropsychology/NeuroKit)** — EEG/ECG/EMG signal processing for theta-band analysis
- **[BrainFlow](https://github.com/brainflow-dev/brainflow)** — Universal BCI board interface for real-time biosignal acquisition
- **[pyRiemann](https://github.com/pyRiemann/pyRiemann)** — Riemannian geometry BCI classification
- **[EEG-To-Text](https://github.com/MikeWangWZHL/EEG-To-Text)** — Neural decoding for cognitive state analysis

### PortMaster Firewall
- Local API at `127.0.0.1:8117` for MAC quarantine, packet capture, and IDS rule deployment
- Relevant to KENWOOD-SPECTRE (TV isolation) and PARTYTOWN-AUTOPSY (traffic capture)

### Future Expansion Areas
- WebSocket real-time event streaming (replace polling)
- KiwiSDR direct IQ stream integration (TDOA triangulation)
- ggwave ultrasonic beacon integration for ESP32 modules
- Live DSE892 SNMP TRAP ingestion for GPR event detection
- LSCSA-SVD weak signal processing pipeline (PhastFT + quantum-inspired DSP)
- TR-069 Port 7547 honeypot for CPE botnet detection
- ITU-R P.838-3 rain attenuation modeling for X-band anomaly detection
- MUOS-3 (NORAD 40374) UHF WCDMA heartbeat monitoring
- Tor-proxied CelesTrak fetches
- HUMINT biometric logger (VS Code extension + Flask + BrainFlow)
- PLC streetlight theta modulation detector
- SABBIA 2.0 passive radar integration for coherent satellite tracking
- Cross-modal YOLO + RF + GPR fusion alerting system

---

*End of Architecture Document*
*The Ghost has been documented.*
