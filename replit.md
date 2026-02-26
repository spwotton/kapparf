# Project KAPPA — Multi-Domain Signal Intelligence & Correlation Platform

## Overview
KAPPA is a software-defined SIGINT platform built with React + Tailwind + TypeScript (frontend), Express (backend), and PostgreSQL (database). It correlates electromagnetic emissions across five domains — Cellular (LTE/5G), Satellite, WiFi, Bluetooth/BLE, and SDR — using passive collection tools.

**Observer location:** Guacima, Costa Rica (9.95°N, 84.15°W, 0.9 km alt)

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui, wouter routing, TanStack Query v5
- **Backend:** Express.js with typed routes, Drizzle ORM
- **Database:** PostgreSQL (Neon serverless driver)
- **i18n:** EN/ES language toggle with localStorage persistence
- **Theme:** Light/dark toggle, warm neutral Notion-style design

## Database Tables
- `signal_events` — unified multi-domain events (wifi, ble, lte, 5g, satellite, sdr, elf)
- `correlations` — cross-domain temporal pattern matches with linked event IDs
- `satellite_passes` — TLE-based satellite tracking data from CelesTrak
- `sdr_nodes` — remote SDR receiver configuration (KiwiSDR, etc.)
- `users` — authentication (unused currently)

## Key API Endpoints
- `GET /api/stats` — event counts by domain, total correlations
- `GET/POST /api/events` — signal event CRUD (filterable by ?domain=)
- `GET /api/events/recent` — last 20 events
- `POST /api/correlations/run` — execute correlation engine on 5-min window
- `GET /api/correlations` — list correlation results
- `GET/POST /api/satellites` — satellite data, TLE refresh from CelesTrak
- `GET/POST /api/nodes` — SDR node management
- `GET /api/tools` — tool catalog (27 tools across 7 domains)
- `GET /api/rules` — 8 correlation rule definitions

## Pages
1. **Dashboard** (`/`) — stats, domain breakdown, observer location, recent events
2. **Events** (`/events`) — multi-domain event feed with domain filter tabs, ingest dialog
3. **Correlations** (`/correlations`) — correlation results + rule reference + run button
4. **Satellites** (`/satellites`) — TLE refresh, pass predictions
5. **Nodes** (`/nodes`) — SDR node cards with add dialog
6. **Tools** (`/tools`) — 27-tool catalog with domain filtering

## Correlation Rules (8 active)
- MAC Dual-Band Activity (BLE+WiFi, 10s window)
- Surveillance Handoff (BLE+WiFi+LTE+Satellite, 30s window)
- Congusto Protocol Detection (WiFi+Satellite+BLE, 60s window)
- Satellite-LTE Burst Correlation (LTE+Satellite, 120s window)
- BLE-WiFi Deauth Chain (BLE+WiFi, 5s window)
- Schumann Resonance Anomaly (ELF+SDR, 300s window)
- IMSI Tower Hop (LTE+Satellite, 30s window)
- Android Auto Compromise (BLE+WiFi, 15s window)

## Constants (KAPPA_CONSTANTS)
- κ = 4/π, θ_K ≈ 128.23°, φ = golden ratio
- Target frequencies: 46.875 Hz, 74.9 Hz
- FFT: 1024-point at 48 kHz sample rate
- κ-second interval: 46.875s

## SDR Nodes (Real)
- TI0RC Radio Club de Costa Rica: http://ti0rc.proxy.kiwisdr.com:8073

## Rules
- No mock data — all events must come from real sources or manual entry
- No simulated detection pipelines
- Notion-style minimal professional UI (not sci-fi)
