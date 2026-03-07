# Project KAPPA — Multi-Domain Signal Intelligence & Correlation Platform

## Overview
KAPPA is a software-defined SIGINT platform designed to correlate electromagnetic emissions across 11 domains (WiFi, BLE, LTE, 5G, Satellite, SDR, ELF, Radar, PLC, ISP, and Drone) using passive collection tools. The platform aims to provide real-time threat intelligence and analysis by identifying patterns and anomalies in collected signal data. Its core function is to analyze signal events, generate correlations, and provide an intelligence summary to users, enhancing situational awareness and enabling proactive responses to emerging threats.

## User Preferences
- No mock data — all events must come from real sources or manual entry
- No simulated detection pipelines
- Notion-style minimal professional UI (not sci-fi)

## System Architecture
The platform is built with a modern web stack:
- **Frontend:** React with Tailwind CSS, shadcn/ui for components, wouter for routing, TanStack Query v5 for data fetching, and Leaflet/OpenStreetMap for interactive mapping. It supports i18n with EN/ES language toggle and a warm neutral Notion-style light/dark theme.
- **Backend:** Express.js with typed routes, utilizing Drizzle ORM for database interactions.
- **Database:** PostgreSQL, leveraging Neon serverless driver.
- **Core Logic (KAPPA Engine):** An in-memory real-time correlation engine processes signal events, calculates a "Kappa Score" (0-100 with decay), assigns threat levels (NOMINAL, ELEVATED, HIGH, CRITICAL, EMERGENCY), and performs device fingerprinting based on MAC tracking across domains. It uses specific constants (κ, Klein Twist, Giza Cutoff, Clock) and correlation techniques (MAC cross-domain, Congusto, stingray chain, IMSI tower hop, Klein twist satellite detection, φ-harmonic timing).
- **Autonomous Pipeline:** An Adaptive Pipeline Orchestrator (`server/pipeline.ts`) manages the execution of various subsystems based on the Kappa Score, adapting its interval from STANDBY (15 min) to SURGE (2 min). It orchestrates collectors, scanners, watchdog, and correlator components.
- **Collectors:**
    - **Flight Collector:** Gathers OpenSky Network flight data for radar domain events.
    - **Satellite Collector:** Tracks TLE-based satellite data from CelesTrak for satellite domain events.
    - **Weather Collector:** Fetches NWS api.weather.gov data for ELF domain events.
- **Auto-Correlator:** Continuously analyzes recent events (last 5 minutes) against 54 predefined correlation rules, performing deduplication and hypervisor overlap detection.
- **LLM Analyst:** Integrates with OpenAI gpt-4o-mini for correlation analysis, intelligence report generation, and learning from user feedback.
- **KiwiSDR Scanner:** Scans SDR nodes for VLF targets, performs audio analysis (Hilbert envelope, RARED speech, Delta-Slip extraction), and detects harmonic chains, creating SDR and ELF domain events.
- **Network Watchdog:** Monitors network heartbeat, performs IPAT analysis for TR-069 PRF matches, and detects seismic jitter, generating ISP and ELF domain events.
- **Ω-CHRONOS Hypervisor:** An automated temporal correlation engine running at 137ms intervals, utilizing a "Council of Eight" autonomous agents and κ-DTW alignment for precise temporal clustering and Hall reconciliation.
- **Database Schema:** Key tables include `signal_events` (unified multi-domain events), `correlations` (cross-domain pattern matches), `satellite_passes`, `sdr_nodes`, `correlation_feedback`, `collection_logs`, and `users`.
- **Social Media Studio:** A `/social` page that generates dark-themed infographic cards from live KAPPA data, optimized for Instagram. 5 card templates (KAPPA Score, Satellite Intel, Correlation Alert, Domain Breakdown, Evening Window) in 3 formats (1080×1080 square, 1080×1350 portrait, 1080×1920 story). Export to PNG via `html-to-image`. IG grid preview shows 3×3 feed layout. Backend `/api/social/data` aggregates real data from all collectors. AI Caption Generator (`POST /api/social/caption`) uses OpenAI gpt-4o-mini to produce Instagram-optimized captions, hashtags, and alt text from live pipeline data; falls back to heuristic templates when AI is unavailable. Frontend shows generated content with per-field copy buttons.
- **UI/UX:** The system features a dashboard displaying real-time status, event feeds, correlation results, satellite tracking, device fingerprinting, OSINT tools, SDR node management, a comprehensive tool catalog, an interactive map, dedicated intelligence and research pages (Lattice, Karachi, Congusto), and a social media content generator.

## External Dependencies
- **OpenSky Network:** For live flight data.
- **CelesTrak:** For Two-Line Element (TLE) satellite tracking data.
- **NWS api.weather.gov:** For weather information.
- **OpenAI (gpt-4o-mini):** Integrated via Replit AI for LLM analysis.
- **Leaflet & OpenStreetMap:** For interactive mapping functionalities.
- **macvendors.com API:** Used by the MAC OUI Lookup tool.
- **Drizzle ORM:** For database interactions with PostgreSQL.
- **Neon:** Serverless PostgreSQL database.
- **shadcn/ui:** UI component library.
- **TanStack Query v5:** Data fetching library.
- **html-to-image:** For exporting social media infographic cards as PNG images.