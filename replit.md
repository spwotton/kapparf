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
- `GET /api/tools` — tool catalog (40+ tools across 11 domains)
- `GET /api/tools/meta` — live GitHub metadata with 30-min cache
- `GET /api/rules` — correlation rule definitions

## Pages
1. **Dashboard** (`/`) — kappa score gauge (SVG arc), threat level, evening window, observer location, domain bars, correlation stats, alerts, events
2. **Events** (`/events`) — multi-domain event feed with domain filter tabs, ingest dialog
3. **Correlations** (`/correlations`) — correlation results + rule reference + run button
4. **Satellites** (`/satellites`) — TLE catalog selector, category filter, Klein/Giza badges
5. **Devices** (`/devices`) — MAC fingerprint tracking table with suspicious detection
6. **OSINT** (`/osint`) — DNS probe, hidden network detection, surveillance indicators, camera OUIs, OSINT tools
7. **Nodes** (`/nodes`) — SDR node cards with add dialog
8. **Tools** (`/tools`) — 40+ tool catalog with domain filtering + live GitHub stars
9. **Map** (`/map`) — interactive Leaflet map showing observer, Jacó, SJO, satellites, flights, SDR nodes

## Domains (11)
wifi, ble, lte, 5g, satellite, sdr, elf, radar, plc, isp, drone

## Correlation Rules (26 active)
Includes: MAC cross-domain, surveillance handoff, Congusto protocol, satellite-LTE burst, BLE-WiFi deauth chain, Schumann resonance, IMSI tower hop, evening window spike, hidden-ssid-probe, camera-oui-detection, kyndryl-corp-signature, CSI multipath anomaly, RTSP/ONVIF exfiltration, modbus injection, and more.

## Satellite Tracking
- **Visible**: elevation > 30° from observer
- **Overhead**: elevation > 75°
- **KLEIN**: azimuth within ±2° of 128.23° (Klein twist angle)
- **GIZA**: elevation within ±2° of 51.77° (Giza cutoff)

## OSINT Capabilities
- DNS/reverse lookup (Node.js dns module)
- Hidden SSID detection techniques
- Camera vendor OUI database (Hikvision, Dahua, Reolink, TP-Link)
- Corporate signatures (Kyndryl, IBM, Cisco Meraki)
- Port signatures (RTSP 554, MQTT 1883, CoAP 5683)
- Tool references (theHarvester, Maltego, Shodan, Censys, VirusTotal, nmap, Recon-ng)

## Rules
- No mock data — all events must come from real sources or manual entry
- No simulated detection pipelines
- Notion-style minimal professional UI (not sci-fi)
