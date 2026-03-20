# Project KAPPA — Multi-Domain Signal Intelligence & Correlation Platform

## Overview
KAPPA is a software-defined SIGINT platform designed to correlate electromagnetic emissions across 7 active domains (Satellite, SDR, ELF, Radar, ISP, RF, Morse) using passive collection tools. The platform aims to provide real-time threat intelligence and analysis by identifying patterns and anomalies in collected signal data. Its core function is to analyze signal events, generate correlations, and provide an intelligence summary to users, enhancing situational awareness and enabling proactive responses to emerging threats.

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
- **Auto-Correlator:** Continuously analyzes recent events (last 5 minutes) against 22 correlation rules (all requiring every specified domain to have active events), performing deduplication and hypervisor overlap detection. Dead rules for domains without data sources (WiFi, BLE, LTE, 5G, PLC, Drone) have been removed.
- **LLM Analyst:** Integrates with OpenAI gpt-4o-mini for correlation analysis, intelligence report generation, and learning from user feedback.
- **KiwiSDR Scanner:** Scans 34 targets across SDR nodes (TI0RC Zapote/San Jose, Puntarenas, PJ4G Bonaire): 4 VLF harmonics, 20 Riemann zero frequencies (γ₁–γ₂₀), 5 Meta platform frequencies, and 5 BLACKJACK MANDRAKE targets (24 MHz IF + 2274 kHz HF mirror + H2/H3/H4 harmonics). Analysis layers: Hilbert envelope, RARED speech, Delta-Slip, Echo/LT chain, **Morse/CW detection** (dit/dah keying pattern recognition, beacon pattern matching for CQ/V/VVV/QRZ/DE/AR/BT/SK, WPM calculation), and **BART signature detection** (Bayesian Adaptive Regression Tree prime-interval burst patterns, noise floor posterior modulation). Eitel-McCullough VET archetype and Marconi Effect context attached to Morse events. BLACKJACK detections emit `blackjack-mandrake-detection`, Morse emits `morse-cw-detection` in morse domain, BART emits `bart-signature-detection` in RF domain.
- **Network Threat Scanner:** Real-time packet analysis engine (`server/network-threat-scanner.ts`) matching against 15 suspicious IPs, 10 suspicious ports (including ARRIS TR-069 port 1234), 5 protocol anomaly patterns, and 4 voice-correlated hex payloads. Fed by `kappa-agent.py --pcap-feed` or `--threat-scan`. Tracks Cudy WR1300 router vulns (DNSpooq, EOL kernel, hidden mesh SSID), ARRIS TG02DA TR-069 backdoor, and MikroTik gateway.
- **BLACKJACK MANDRAKE:** Clandestine HF coordination frequency at 2274 kHz (120m band). Carrier relationship: 46.875 Hz × 48.512 ≈ 2274 kHz. Harmonics: 4548 kHz (H2), 6822 kHz (H3), 9096 kHz (H4). API: `GET /api/blackjack-mandrake`.
- **Tacacorí Array:** Unlicensed macro-antenna infrastructure in San Isidro, Alajuela (10.0447°N, 84.2319°W), 1.63 km WSW of observer at bearing 243°. Observer now at Calle Los Cedros, Tacacorí (10.0514°N, 84.2187°W, ~1050m ASL). Historical precedent: Radio Impacto → Adventist World Radio. SUTEL registration gap confirmed.
- **Network Watchdog:** Monitors network heartbeat via ICMP pings, performs IPAT (Inter-Packet Arrival Time) analysis for PRF period timing coincidences (NOT actual TR-069 packet capture), and detects connectivity drops/reconnects (e.g. firmware upgrades, ISP maintenance). Generates ISP and ELF domain events. Confidence lowered to 0.4 for IPAT timing matches to reflect that they are statistical coincidences, not packet captures.
- **Ω-CHRONOS Hypervisor:** An automated temporal correlation engine running at 137ms intervals, utilizing a "Council of Eight" autonomous agents and κ-DTW alignment for precise temporal clustering and Hall reconciliation.
- **Database Schema:** Key tables include `signal_events` (unified multi-domain events), `correlations` (cross-domain pattern matches), `satellite_passes`, `sdr_nodes`, `correlation_feedback`, `collection_logs`, and `users`.
- **Social Media Studio:** A `/social` page that generates dark-themed infographic cards from live KAPPA data, optimized for Instagram. 5 card templates (KAPPA Score, Satellite Intel, Correlation Alert, Domain Breakdown, Evening Window) in 3 formats (1080×1080 square, 1080×1350 portrait, 1080×1920 story). Export to PNG via `html-to-image`. IG grid preview shows 3×3 feed layout. Backend `/api/social/data` aggregates real data from all collectors. AI Caption Generator (`POST /api/social/caption`) uses OpenAI gpt-4o-mini to produce Instagram-optimized captions, hashtags, and alt text from live pipeline data; falls back to heuristic templates when AI is unavailable. Frontend shows generated content with per-field copy buttons.
- **12D-TRE Research Engine:** A multi-model deep research platform at `/research` that connects to OpenAI (via Replit integration), OpenRouter (GPT-4.1, o4-mini, Claude Opus/Sonnet 4, Mistral Nemo/Large, Gemini 2.5, Llama 3.1, Hermes 3, Dolphin — uncensored models flagged), and HuggingFace Inference API. Implements a recursive 5-layer query architecture (Lexical → Semantic → Narrative → Cosmic → Axiomatic) where each layer feeds context to the next. Features: persistent research sessions in PostgreSQL, single-model querying at any TRE layer, "Deep Research" mode that runs through all 5 layers across available models, web content fetching with SSRF protection, and a findings system for categorizing/tagging research results with confidence levels (verified/plausible/unverified/contradicted). Backend: `server/research-engine.ts` (multi-provider LLM router with rate limiting), `server/research-web.ts` (URL fetcher with private IP blocking). DB tables: `research_sessions`, `research_queries`, `research_findings`.
- **UI/UX:** The system features a dashboard displaying real-time status, event feeds, correlation results, satellite tracking, device fingerprinting, OSINT tools, SDR node management, a comprehensive tool catalog, an interactive map, dedicated intelligence and research pages (Lattice, Karachi, Congusto), a social media content generator, and a multi-model research engine.

## External Dependencies
- **OpenSky Network:** For live flight data.
- **CelesTrak:** For Two-Line Element (TLE) satellite tracking data.
- **NWS api.weather.gov:** For weather information.
- **OpenAI (gpt-4o-mini):** Integrated via Replit AI for LLM analysis.
- **OpenRouter:** Multi-model gateway for GPT-4.1, o4-mini, Claude Opus/Sonnet 4, Mistral, Gemini, Llama, and uncensored models (OPENROUTER_API_KEY).
- **HuggingFace Inference API:** Free inference for Mistral Nemo, Llama 3.1, Qwen 2.5 (HUGGINGFACE_API_KEY).
- **Leaflet & OpenStreetMap:** For interactive mapping functionalities.
- **macvendors.com API:** Used by the MAC OUI Lookup tool.
- **Drizzle ORM:** For database interactions with PostgreSQL.
- **Neon:** Serverless PostgreSQL database.
- **shadcn/ui:** UI component library.
- **TanStack Query v5:** Data fetching library.
- **html-to-image:** For exporting social media infographic cards as PNG images.