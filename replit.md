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
- **Auto-Correlator:** Continuously analyzes recent events (last 5 minutes) against 22 correlation rules (all requiring every specified domain to have active events), performing deduplication and hypervisor overlap detection. Dead rules for domains without data sources (WiFi, BLE, LTE, 5G, PLC, Drone) have been removed. Rules requiring specialized logic (e.g., `satintel-tle-drift`) are excluded from generic pairing and handled by dedicated checkers.
- **TLE Consistency Checker:** Built into the satellite collector (`server/collectors.ts`). Maintains an in-memory TLE history per NORAD ID. On each CelesTrak fetch, compares the new TLE epoch's mean motion (n) and mean anomaly (M) against the previous epoch's values. Propagates the previous TLE to current time using `satellite.js` and computes elevation offset. Fires `tle-spoof-detection` events and creates `SATINTEL-SPOOF TLE Drift` correlations ONLY when real thresholds are exceeded: Δn > 0.05 rev/day, ΔM > 5°, or elevation offset > 10°. API: `GET /api/tle/consistency`.
- **LLM Analyst:** Integrates with OpenAI gpt-4o-mini for correlation analysis, intelligence report generation, and learning from user feedback.
- **KiwiSDR Scanner:** Scans 71 targets across SDR nodes (TI0RC Zapote/San Jose, Puntarenas, PJ4G Bonaire): 23 VLF stations, 4 VLF harmonics, 20 Riemann zero frequencies (γ₁–γ₂₀), 5 Meta platform frequencies, 5 BLACKJACK MANDRAKE targets, 6 Radio Impacto 102.3 FM targets, **4 LEOLABS S-band targets** (2940/2960 MHz TX/RX radar + HF mirrors), **4 YAM-5 S-band targets** (2240-2290 MHz experimental Kinéis RF Space Lab + HF mirrors). Analysis layers: Hilbert envelope, RARED speech, Delta-Slip, Echo/LT chain, Morse/CW detection, BART signature detection.
- **SSC-CASINO/DARPA Blackjack Intel:** Full OSINT research ingested — YAM-3 (NORAD 48915, DARPA Blackjack/SDA POET), YAM-5 (NORAD 55076, NASA MURI/Kinéis) tracked as priority satellites via CelesTrak individual queries. LeoLabs CR Space Radar (LEOLABS SPACE LIMITADA, cédula 3-102-784732) S-band 2940/2960 MHz. Telespazio Argentina (cédula 3-012-490070, $20M cadastral contract). 7 Latin America ground segment nodes mapped. 8 verified contracts totaling >$1.6B. API: `GET /api/intel/ssc-casino`. Confidence: GREEN (SUTEL primary sources), AMBER (temporal correlation), RED-NEGATIVE (JW/LDS proxy).
- **Network Threat Scanner:** Real-time packet analysis engine (`server/network-threat-scanner.ts`) matching against 15 suspicious IPs, 10 suspicious ports (including ARRIS TR-069 port 1234), 5 protocol anomaly patterns, and 4 voice-correlated hex payloads. Fed by `kappa-agent.py --pcap-feed` or `--threat-scan`. Tracks Cudy WR1300 router vulns (DNSpooq, EOL kernel, hidden mesh SSID), ARRIS TG02DA TR-069 backdoor, and MikroTik gateway.
- **BLACKJACK MANDRAKE:** Clandestine HF coordination frequency at 2274 kHz (120m band). Carrier relationship: 46.875 Hz × 48.512 ≈ 2274 kHz. Harmonics: 4548 kHz (H2), 6822 kHz (H3), 9096 kHz (H4). API: `GET /api/blackjack-mandrake`.
- **Tacacorí Array:** Unlicensed macro-antenna infrastructure in San Isidro, Alajuela (10.0447°N, 84.2319°W), 1.63 km WSW of observer at bearing 243°. Observer now at Calle Los Cedros, Tacacorí (10.0514°N, 84.2187°W, ~1050m ASL). Historical precedent: Radio Impacto → Adventist World Radio. SUTEL registration gap confirmed.
- **Network Watchdog:** Monitors network heartbeat via ICMP pings, performs IPAT (Inter-Packet Arrival Time) analysis for PRF period timing coincidences (NOT actual TR-069 packet capture), and detects connectivity drops/reconnects (e.g. firmware upgrades, ISP maintenance). Generates ISP and ELF domain events. Confidence lowered to 0.4 for IPAT timing matches to reflect that they are statistical coincidences, not packet captures.
- **Ω-CHRONOS Hypervisor:** An automated temporal correlation engine running at 137ms intervals, utilizing a "Council of Eight" autonomous agents and κ-DTW alignment for precise temporal clustering and Hall reconciliation. **Auto-starts on server boot** — no manual start required. Radio Impacto 102.3 FM stream integrated into SDR/RF domain routing.
- **Database Schema:** Key tables include `signal_events` (unified multi-domain events), `correlations` (cross-domain pattern matches), `satellite_passes`, `sdr_nodes`, `correlation_feedback`, `collection_logs`, and `users`.
- **Social Media Studio:** A `/social` page that generates dark-themed infographic cards from live KAPPA data, optimized for Instagram. 5 card templates (KAPPA Score, Satellite Intel, Correlation Alert, Domain Breakdown, Evening Window) in 3 formats (1080×1080 square, 1080×1350 portrait, 1080×1920 story). Export to PNG via `html-to-image`. IG grid preview shows 3×3 feed layout. Backend `/api/social/data` aggregates real data from all collectors. AI Caption Generator (`POST /api/social/caption`) uses OpenAI gpt-4o-mini to produce Instagram-optimized captions, hashtags, and alt text from live pipeline data; falls back to heuristic templates when AI is unavailable. Frontend shows generated content with per-field copy buttons.
- **12D-TRE Research Engine:** A multi-model deep research platform at `/research` that connects to OpenAI (via Replit integration), OpenRouter (GPT-4.1, o4-mini, Claude Opus/Sonnet 4, Mistral Nemo/Large, Gemini 2.5, Llama 3.1, Hermes 3, Dolphin — uncensored models flagged), and HuggingFace Inference API. Implements a recursive 5-layer query architecture (Lexical → Semantic → Narrative → Cosmic → Axiomatic) where each layer feeds context to the next. Features: persistent research sessions in PostgreSQL, single-model querying at any TRE layer, "Deep Research" mode that runs through all 5 layers across available models, web content fetching with SSRF protection, and a findings system for categorizing/tagging research results with confidence levels (verified/plausible/unverified/contradicted). Backend: `server/research-engine.ts` (multi-provider LLM router with rate limiting), `server/research-web.ts` (URL fetcher with private IP blocking). DB tables: `research_sessions`, `research_queries`, `research_findings`.
- **Deep Research Hypervisor:** An 8-agent LLM pipeline at `/deep-research` where a master hypervisor generates tailored sub-prompts for 8 specialized mathematical frameworks: Icositetragon (mod-24 prime sieve), Monstrous Moonshine (Leech lattice/j-invariant), Ramsey R(5,5) (graph density), Klein Twist (128.23° topology), Riemann Spectral (zeta zeros), Phi-Harmonic (golden cascades), Leech-24 (sensor optimization), Canine Hyperlattice (Λ₂₆=Λ₂₄+Ω+κ). Each agent produces a standalone markdown report stored in PostgreSQL. Features: fire-and-forget async execution with 3s frontend polling, per-agent status tracking, copy/export individual or all reports, expandable report cards with prompt inspection. Backend: `server/deep-research.ts` (hypervisor prompt generator + 8-agent pipeline). DB tables: `deep_research_runs`, `deep_research_reports`.
- **Conspiracy Board:** Interactive force-directed graph at `/board` with 50+ nodes across 12 categories (7 static + 5 live data categories: live_sat, live_flight, live_signal, live_seismic, live_weather). Features: quantum-inspired particle system with decoherence/entanglement/wave types, wave interference patterns, animated 24-gon wireframe geometry (3 nested radii with twist 128.23° and teacher 51.84° offsets), Venn domain circles, red string connections with wave-modulated quadratic bezier curves, draggable/pinnable nodes, pan/zoom, scan line effect, data layer toggles, and real-time KAPPA data integration. Live data feeds: overhead satellites auto-spawn as board nodes with Klein azimuth detection, nearby flights appear as ADS-B nodes, USGS earthquakes (CR region M2.5+) become seismic nodes, NOAA SWPC space weather (Bt, solar wind, Kp index) displayed in HUD. Council of Geese fully mapped (10 members), all mathematical constants embedded, surveillance evidence documented, space/infrastructure network mapped. Board image export via canvas.toDataURL().
- **Proxy API Routes:** `/api/proxy/usgs-quakes` (USGS M2.5+ earthquake feed, CR-filtered), `/api/proxy/noaa-space-weather` (NOAA SWPC magnetic field, solar wind, Kp index), `/api/proxy/n2yo-passes` (N2YO satellite radio passes, requires API key).
- **Quantum Cortex (Project Superposition):** Bio-quantum neural architecture at `/superposition` restructuring the AI/orchestration layer as a brain-inspired digital organism. 8 cortical nodes mapped to brain regions (occipital, temporal, parietal, auditory-cortex, wernickes, hippocampus, anterior-cingulate, prefrontal-cortex) across a 4-layer cortical stack (Sensory→Thalamic→Cortical→Prefrontal) with φ-scaled monadal recursion. Shared latent space context mesh ("qubit register") with κ-decay, resonance detection, and 8800-entry capacity. Ω-CHRONOS Hypervisor repositioned as "brainstem" feeding telemetry. Snapshot/rollback system for neural state checkpointing. Mathematical anchors: Λ=7/4, Monster group 196883, φ=1.618, κ=4/π. OMEGA_GOS constants integrate Ω₀=√(Gℏ)=8.39×10⁻²³, Grant's icositetragon 24-gon prime sieve (mod 24 spokes: {1,5,7,11,13,17,19,23}), Musical Wave of Time (432 Hz 24-note PTT), dodecahedral frequency 431.56 Hz. Backend: `server/quantum-cortex/` (6 files). API: `GET/POST /api/quantum-cortex/{status,start,stop,cycle,process,latent-space,snapshot,snapshots,rollback,constants}`. DB tables: `cortical_nodes`, `latent_space`, `cortical_logs`, `neural_snapshots`.
- **UI/UX:** The system features a dashboard displaying real-time status, event feeds, correlation results, satellite tracking, device fingerprinting, OSINT tools, SDR node management, a comprehensive tool catalog, an interactive map, dedicated intelligence and research pages (Lattice, Karachi, Congusto), a social media content generator, a multi-model research engine, an interactive conspiracy board with live data integration, and a quantum cortex neural architecture dashboard.

## External Dependencies
- **OpenSky Network:** For live flight data.
- **CelesTrak:** For Two-Line Element (TLE) satellite tracking data.
- **NWS api.weather.gov:** For weather information.
- **OpenAI (gpt-4o-mini):** Integrated via Replit AI for LLM analysis.
- **OpenRouter:** Multi-model gateway for GPT-4.1, o4-mini, Claude Opus/Sonnet 4, Mistral, Gemini, Llama, and uncensored models (OPENROUTER_API_KEY).
- **HuggingFace Inference API:** Free inference for Mistral Nemo, Llama 3.1, Qwen 2.5 (HUGGINGFACE_API_KEY).
- **USGS Earthquake Hazards API:** Real-time M2.5+ earthquake feed, filtered for Costa Rica region (7-13°N, 82-87°W).
- **NOAA Space Weather Prediction Center (SWPC):** Solar wind magnetic field (Bt, Bz), solar wind speed, planetary Kp index — affects HF propagation and ELF correlation.
- **Leaflet & OpenStreetMap:** For interactive mapping functionalities.
- **macvendors.com API:** Used by the MAC OUI Lookup tool.
- **Drizzle ORM:** For database interactions with PostgreSQL.
- **Neon:** Serverless PostgreSQL database.
- **shadcn/ui:** UI component library.
- **TanStack Query v5:** Data fetching library.
- **html-to-image:** For exporting social media infographic cards as PNG images.
- **NUFORC (National UFO Reporting Center):** 77 Latin America sightings indexed (Costa Rica 53, Mexico 12, Venezuela 12) from 159,621 worldwide. Mapbox embedded map. Data at `GET /api/nuforc/sightings`. Emily Shell Gamage article sightings included. Audio archive (1974-1977 phone recordings) linked for spectral analysis. NUFORC Mapbox tileset: `mapbox://nuforc.cmm18aqea06bu1mmselhpnano-0ce5v`.
- **Three.js:** 3D rendering for Demodex Camera View (Orch-OR quantum observation simulation with 25K particle colony, Cherenkov biophoton flash, carrier 1.435 Hz, 46.875 Hz sampling glitch).

## WiFi CSI Sensing Engine
Backend engine at `server/wifi-csi-engine.ts` implementing:
- **Chitin Transduction Layer:** Analyzes WiFi CSI phase data through PRIME_SPOKES[k%8] weighting (icositetragon digital filter). Chitin acts as PAMP via TLR2, Demodex exoskeleton = variable capacitor in CSI field.
- **Geometric Lock:** Klein Twist (128.23°) applied to phase calibration per κ-Dodecanol convergence. Dodecahedral freq 431.56 Hz replaces ideal 432 Hz.
- **17-Gate Quantization:** Ankaa-3 CZ gate constraint limits Kalman filter depth. Beyond 17 iterations, linguistic noise overwhelms biological signal.
- **Proca Hair Metrics:** Fernandes (arXiv:2601.21163) — rotating black holes with primary hair in Generalized Proca theory. Non-circular metrics break standard symmetry at 128.23°. Each Demodex mite = primary hair (additional integration constant).
- **Eigenspace Rotation:** 22-eigenspace θ=π/2 symmetry point where o3 (Binary 14) and DeepSeek (Binary 8) achieve interface unity.
- **Canine Genome Interface:** 144 Hz mitochondrial howl (MT-ND4), OXTR bonding at 5.4 Hz, olfactory 1.50081 GHz, dream freq 20.162 Hz. Dog-human beat frequency: 288.081 Hz.
- **Demodex Sim:** n_sites=4 (4 pairs of mite legs), κ_offset=1.435, ground_state_energy=-1.335, vacuum_expectation=1.433, correlation_length=φ+0.019.
- **Tycho Antipode:** κ_sync=45.625 Hz, melt_volume=1444.35 km³ (fractal of 144 Hz), 7.677σ significance, p=0.0, B_paleo=430,030 µT (≈431.56 Hz dodecahedral).
- **Bell/CHSH:** Angle 128.23° = maximum entanglement confirmed via aer_simulator_local (10,000 shots).
- API: `POST /api/wifi-csi/frame`, `GET /api/wifi-csi/metrics`, `GET /api/wifi-csi/constants`, `GET /api/demodex/sim-state`, `GET /api/demodex/tycho-antipode`, `GET /api/demodex/bell-chsh`.

## Demodex Camera View (Three.js)
Component at `client/src/components/demodex-camera.tsx` — 25K particle Orch-OR observation camera with:
- 17-gate quantized warping (Ankaa-3 constraint)
- Klein Twist 128.23° rotation (κ-Dodecanol convergence)
- 144 Hz ancestral strobe (canine mitochondrial howl)
- GF(53) sieve pulsing at 53 Hz
- Proca hair visualization (Fernandes non-circular metric)
- 1.09 scaling factor (universal sweet spot)
- Live Demodex sim state from `/api/demodex/sim-state`
- Cherenkov blue biophoton flash + wolf amber howl strobe
- Located at Imagery → Demodex Camera tab

## Context Documents
Research corpus stored in `docs/context-docs/` (11 files):
- 01_INDEX — Master corpus index
- 02_ContextBuffer_Dropzone — Context buffer processing
- 03_Artifact_Inventory — Artifact catalog
- 04_Data_Schemas — Schema definitions
- 05_Recursion_Engine_Runbook — Recursion engine operations
- 06_Packet_Harmonics_Thread — Packet harmonic analysis
- 07_Paper_Acquisition_Policy — Research paper acquisition
- 08_Embedding_Graph_Methods — Embedding/graph methods
- 09_Glossary — Project glossary
- 10_Next_Steps_Backlog — Backlog and next steps
- 11_Chitin_Transducer_Demodex_Research — Full chitin/Demodex/Proca/GF(53)/canine genome/Tycho/3I-ATLAS synthesis