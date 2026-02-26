# Project KAPPA — Multi-Domain Signal Intelligence & Correlation Platform

## Overview
KAPPA is a software-defined SIGINT platform built with React + Tailwind + TypeScript (frontend), Express (backend), and PostgreSQL (database). It correlates electromagnetic emissions across 10 domains — WiFi, BLE, LTE, 5G, Satellite, SDR, ELF, Radar (ADS-B), PLC, and ISP — using passive collection tools.

**Observer location:** Calle Caballo Real, Guácima Abajo, Alajuela, Costa Rica (9.9536°N, 84.2907°W, 0.9 km alt)

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

## Database Tables
- `signal_events` — unified multi-domain events (wifi, ble, lte, 5g, satellite, sdr, elf, radar, plc, isp)
- `correlations` — cross-domain temporal pattern matches with linked event IDs
- `satellite_passes` — TLE-based satellite tracking data from CelesTrak (41 catalog groups, with lat/lon/alt/category)
- `sdr_nodes` — remote SDR receiver configuration (KiwiSDR, etc.)
- `users` — authentication (unused currently)

## Key API Endpoints
- `GET /api/stats` — event counts by domain, total correlations
- `GET/POST /api/events` — signal event CRUD (filterable by ?domain=)
- `GET /api/events/recent` — last 20 events
- `POST /api/correlations/run` — execute correlation engine on 5-min window
- `GET /api/correlations` — list correlation results
- `GET /api/satellites` — satellite data
- `GET /api/satellites/groups` — list all 41 TLE catalog groups and categories
- `POST /api/satellites/refresh` — multi-group TLE refresh from CelesTrak (body: {groups: string[]})
- `GET /api/flights` — live flight data from OpenSky Network (SJO/Costa Rica airspace)
- `GET /api/analysis-points` — observer, Jacó, SJO, TI0RC locations
- `GET/POST /api/nodes` — SDR node management
- `GET /api/tools` — tool catalog (40+ tools across 10 domains)
- `GET /api/tools/meta` — live GitHub metadata (stars, language, license, forks) with 30-min cache
- `GET /api/rules` — 18 correlation rule definitions

## Pages
1. **Dashboard** (`/`) — stats, domain breakdown, observer location, recent events
2. **Events** (`/events`) — multi-domain event feed with domain filter tabs, ingest dialog
3. **Correlations** (`/correlations`) — correlation results + rule reference + run button
4. **Satellites** (`/satellites`) — multi-group TLE catalog selector, category filter, pass predictions
5. **Nodes** (`/nodes`) — SDR node cards with add dialog
6. **Tools** (`/tools`) — 40+ tool catalog with domain filtering + live GitHub stars/language/license
7. **Map** (`/map`) — interactive Leaflet map showing observer, Jacó, SJO, satellites, flights, SDR nodes

## Satellite Tracking
- **Visible**: elevation > 30° from observer
- **Overhead**: elevation > 75° — satellite is near zenith, directly above observer. Shown with red pulsing marker on map and red OVERHEAD badge in table.

## Correlation Rules (21 active)
- MAC Dual-Band Activity (BLE+WiFi, 10s)
- Surveillance Handoff (BLE+WiFi+LTE+Satellite, 30s)
- Congusto Protocol Detection (WiFi+Satellite+BLE, 60s)
- Satellite-LTE Burst Correlation (LTE+Satellite, 120s)
- BLE-WiFi Deauth Chain (BLE+WiFi, 5s)
- Schumann Resonance Anomaly (ELF+SDR, 300s)
- IMSI Tower Hop (LTE+Satellite, 30s)
- Android Auto Compromise (BLE+WiFi, 15s)
- Starlink ↔ BLACKJACK/SDA Handoff (Satellite+LTE, 300s)
- Evening Window Intensity Spike (WiFi+BLE+LTE+Satellite+Radar, 2h)
- TR-069 ACS ↔ Satellite Pass Timing (ISP+Satellite, 120s)
- Tower–Radar–Satellite Triangulation (LTE+Radar+Satellite, 60s)
- PLC/Li-Fi Data Exfiltration (PLC+BLE+WiFi, 10s)
- ISP Backdoor Activation (ISP+WiFi, 30s)
- Italian Satellite ↔ LTE Sync (Satellite+LTE, 180s)
- Chinese Satellite ↔ 5G Burst (Satellite+5G, 120s)
- SJO Flight ↔ RF Anomaly (Radar+WiFi+BLE, 30s)
- Jacó Coastal Surveillance Pattern (BLE+Satellite+Radar, 300s)
- Drone RF Signature Detection (Drone+SDR+BLE, 30s)
- Drone ↔ Satellite Overhead Correlation (Drone+Satellite+SDR, 120s)
- Drone ↔ SJO Airspace Intrusion (Drone+Radar+SDR, 60s)

## Domains (11)
wifi, ble, lte, 5g, satellite, sdr, elf, radar, plc, isp, drone

## Drone Detection Suite
Tools: RF-Drone-Detection, ssm-drone, Drone-detection-dataset, VisDrone-Dataset
DSP: PhastFT, quantum-inspired-dsp, Quantum-Sparse-Coding
Morse/RF: Morserino-32, MorseCodeWithRF, saatja-rpi
Analysis: urh (Universal Radio Hacker), system-bus-radio (TEMPEST countermeasure), qspectrumanalyzer

## TLE Catalog Groups (41)
Organized by category: Space Stations, Brightest, Active, Weather, NOAA, GOES, Earth Resources, SARSAT, Disaster Monitoring, TDRSS, ARGOS, Planet, Spire, Geostationary, GPS/GLONASS/Galileo/Beidou/SBAS (GNSS), Iridium/Starlink/OneWeb/Orbcomm/Globalstar/Swarm/SES/Telesat/Intelsat (Comms), Amateur/Experimental, Science, Geodetic, Engineering, Education, Military, Radar Calibration, CubeSats, Recent Launches

## SDR Nodes (Real)
- TI0RC Radio Club de Costa Rica: http://ti0rc.proxy.kiwisdr.com:8073

## Rules
- No mock data — all events must come from real sources or manual entry
- No simulated detection pipelines
- Notion-style minimal professional UI (not sci-fi)
