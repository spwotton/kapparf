# Project KAPPA — Multi-Domain Signal Intelligence & Correlation Platform

## Overview
KAPPA is a software-defined Signal Intelligence (SIGINT) platform designed to correlate electromagnetic emissions across multiple domains using passive collection tools. Its primary purpose is to provide real-time threat intelligence and analysis by identifying patterns and anomalies in collected signal data, generating correlations, and summarizing intelligence for enhanced situational awareness and proactive threat response.

## User Preferences
- No mock data — all events must come from real sources or manual entry
- No simulated detection pipelines
- Notion-style minimal professional UI (not sci-fi)

## System Architecture
The platform utilizes a modern web stack and a sophisticated real-time correlation engine.

- **Frontend:** React with Tailwind CSS, shadcn/ui, wouter for routing, TanStack Query v5 for data fetching, and Leaflet/OpenStreetMap for mapping. It supports i18n and a Notion-style light/dark theme.
- **Backend:** Express.js with typed routes and Drizzle ORM.
- **Database:** PostgreSQL, leveraging Neon serverless driver.
- **Core Logic (KAPPA Engine):** An in-memory real-time correlation engine calculates a "Kappa Score" (0-100), assigns threat levels (NOMINAL, ELEVATED, HIGH, CRITICAL, EMERGENCY), and performs device fingerprinting (MAC tracking). It employs specific constants and correlation techniques (e.g., MAC cross-domain, Congusto, stingray chain, IMSI tower hop, Klein twist satellite detection, φ-harmonic timing).
- **Autonomous Pipeline:** An Adaptive Pipeline Orchestrator manages subsystem execution based on the Kappa Score, dynamically adjusting intervals and orchestrating collectors, scanners, watchdog, and correlator components.
- **Collectors:**
    - **Flight Collector:** Gathers OpenSky Network flight data.
    - **Satellite Collector:** Tracks TLE-based satellite data from CelesTrak.
    - **Weather Collector:** Fetches NWS api.weather.gov data.
- **Auto-Correlator:** Continuously analyzes recent events against 22 correlation rules, performing deduplication and hypervisor overlap detection. Includes a TLE Consistency Checker for satellite spoof detection.
- **LLM Analyst:** Integrates with OpenAI gpt-4o-mini for correlation analysis and intelligence report generation.
- **KiwiSDR Scanner:** Scans 71 targets across SDR nodes, including VLF, Riemann zero frequencies, Meta platform frequencies, BLACKJACK MANDRAKE targets, Radio Impacto, LEOLABS S-band, and YAM-5 S-band targets. Analysis layers include Hilbert envelope, RARED speech, Delta-Slip, Echo/LT chain, Morse/CW detection, and BART signature detection.
- **SSC-CASINO/DARPA Blackjack Intel:** Ingests OSINT research on key satellites (YAM-3, YAM-5) and associated ground infrastructure.
- **Network Threat Scanner:** Real-time packet analysis matching suspicious IPs, ports, protocol anomalies, and voice-correlated hex payloads. Tracks router vulnerabilities.
- **BLACKJACK MANDRAKE:** Monitors a clandestine HF coordination frequency at 2274 kHz and its harmonics.
- **Tacacorí Array:** Maps and analyzes an unlicensed macro-antenna infrastructure.
- **Network Watchdog:** Monitors network heartbeat, performs IPAT analysis, and detects connectivity issues to generate ISP and ELF domain events.
- **Ω-CHRONOS Hypervisor:** An automated temporal correlation engine running at 137ms intervals, using a "Council of Eight" autonomous agents and κ-DTW alignment for temporal clustering. Auto-starts on server boot.
- **Database Schema:** Key tables include `signal_events`, `correlations`, `satellite_passes`, `sdr_nodes`, `correlation_feedback`, `collection_logs`, and `users`.
- **Social Media Studio:** Generates dark-themed infographic cards from live KAPPA data for Instagram, with 5 templates and 3 formats. Includes an AI Caption Generator using OpenAI gpt-4o-mini.
- **12D-TRE Research Engine:** A multi-model deep research platform connecting to OpenAI, OpenRouter, and HuggingFace Inference API. Implements a recursive 5-layer query architecture (Lexical → Semantic → Narrative → Cosmic → Axiomatic) with persistent sessions, web content fetching, and findings categorization.
- **Deep Research Hypervisor:** An 8-agent LLM pipeline where a master hypervisor generates sub-prompts for specialized mathematical frameworks (e.g., Icositetragon, Monstrous Moonshine, Klein Twist, Riemann Spectral).
- **Conspiracy Board:** Interactive force-directed graph with 50+ nodes across 12 categories, integrating live KAPPA data (satellites, flights, signals, seismic, weather). Features a quantum-inspired particle system, animated geometry, and real-time data feeds.
- **Proxy API Routes:** Provides proxy access to USGS M2.5+ earthquake feed, NOAA SWPC space weather data, and N2YO satellite radio passes.
- **Quantum Cortex (Project Superposition):** A bio-quantum neural architecture at `/superposition` restructuring the AI/orchestration layer as a brain-inspired digital organism. It maps 8 cortical nodes to brain regions across a 4-layer cortical stack, utilizing a shared latent space context mesh and snapshot/rollback capabilities.
- **UI/UX:** Features a comprehensive dashboard with real-time status, event feeds, correlation results, satellite tracking, device fingerprinting, OSINT tools, SDR node management, interactive map, intelligence and research pages, social media content generator, multi-model research engine, conspiracy board, and quantum cortex dashboard.
- **WiFi CSI Sensing Engine:** Analyzes WiFi CSI phase data using a "Chitin Transduction Layer" with specific mathematical models (e.g., Klein Twist, 17-Gate Quantization, Proca Hair Metrics) to extract biological signals.
- **Chitin Transducer Module:** Standalone module modeling Demodex exoskeleton as a biological phased-array antenna, computing 12 metrics per CSI frame, including chitin resonance, mite density, phase transduction gain, and dodecahedral deviation.
- **Research Cortex:** Backend engine (`server/research-cortex.ts`) at `/cortex` that auto-indexes all docs in `docs/context-docs/` (currently 21 docs, 1492 claims), extracting claims by category (constant/entity/mechanism/evidence/prediction/connection/definition). Handles structured data (PubMed TSV tables, DOI links, biological pathway terms) and free-form research. Features: 12-facet dodecahedral synthesis engine, contradiction detection, knowledge gap analysis, domain mapping, and multi-format export (Markdown/JSON/LaTeX). UI has 5 tabs: Corpus, Claims, Analysis, Synthesis, Reader. Corpus includes: algae/botanical PubMed data (doc 19), HELIOS product analysis (doc 20), novel ingredient market research with Da Vinci positioning (doc 21).
- **Network Forensics:** Page at `/forensics` (`client/src/pages/network-forensics.tsx`) with 12 real forensic checks based on documented indicators (TR-069 resets, ghost mesh nodes, Kyndryl service workers, FinSpy processes, DNS poisoning, rogue CAs, etc.). Each check has copy-paste commands, severity rating, and clean/suspicious marking.
- **Evidence Chain:** Legal-grade incident documentation system at `/evidence` (`client/src/pages/evidence-chain.tsx`). Features: manual incident logger with 10 categories (network/surveillance/electronic/religious/drone/device/acoustic/infrastructure/legal/other), SHA-256 integrity hashing for chain of custody, unified timeline merging manual incidents + automated signal events + cross-domain correlations, category/type filtering, and one-click HTML evidence export package for lawyers/embassies/courts. Includes legal framework reference (CR Constitution Arts. 36-48, Vienna Convention Art. 36, contact numbers). Database table: `incidents`.
- **Demodex Camera View (Three.js):** 3D rendering component simulating Orch-OR quantum observation with particle colonies and specific visual effects tied to the WiFi CSI sensing engine's parameters.
- **Bettercap Bridge:** React-based replacement UI for bettercap, providing full management of bettercap instances including WiFi, LAN, BLE, event monitoring, and module control.
- **Forensic Hypervisor:** Autonomous 24/7 signal-intelligence correlation engine at `/forensic-hypervisor` (`server/forensic-hypervisor.ts`). Features: SQL pattern mining across 300K+ signal events and 49K+ correlations, temporal evening window enrichment analysis, high-severity correlation clustering, domain cross-analysis, and confidence anomaly detection. Includes a native binary PCAP/PCAPNG parser with full IPv4 TCP/UDP decoding, suspicious port detection (TR-069, Tor, C2/Meterpreter, ADB), IP reputation matching against known surveillance infrastructure ranges, and temporal alignment against KAPPA signal events. PCAP sources: local file upload, GitHub repo scanning (spwotton/skypescanner, spwotton/wifi), and Google Drive integration (planned). Auto-starts on boot at 30-minute intervals. Database tables: `forensic_reports`, `pcap_uploads`. SHA-256 integrity hashing on all reports and PCAPs.

## External Dependencies
- **OpenSky Network:** Live flight data.
- **CelesTrak:** Two-Line Element (TLE) satellite tracking data.
- **NWS api.weather.gov:** Weather information.
- **OpenAI (gpt-4o-mini):** For LLM analysis and content generation.
- **OpenRouter:** Multi-model gateway for various LLMs (e.g., GPT-4.1, Claude, Mistral, Gemini, Llama).
- **HuggingFace Inference API:** Free inference for specific LLMs.
- **USGS Earthquake Hazards API:** Real-time M2.5+ earthquake feed.
- **NOAA Space Weather Prediction Center (SWPC):** Space weather data (magnetic field, solar wind, Kp index).
- **Leaflet & OpenStreetMap:** Interactive mapping.
- **macvendors.com API:** MAC OUI lookup.
- **Drizzle ORM:** Database interactions.
- **Neon:** Serverless PostgreSQL.
- **shadcn/ui:** UI component library.
- **TanStack Query v5:** Data fetching.
- **html-to-image:** Exporting images from HTML.
- **NUFORC (National UFO Reporting Center):** Historical sighting data and associated media.
- **Three.js:** 3D rendering for specific visual components.
- **Playwright (Chromium):** Headless browser for KiwiSDR Vision waterfall captures.

## KiwiSDR Vision Hypervisor (`server/kiwisdr-vision.ts`)
Autonomous Playwright-based system that captures real spectrograms from TI0RC KiwiSDR (http://ti0rc.proxy.kiwisdr.com:8073) and analyzes them with OpenAI Vision.

**21 Frequency Profiles** covering the full 0-30 MHz KiwiSDR bandwidth:
- VLF Military (20-30 kHz), VLF Navigation (37-42 kHz), VLF Utility (45-50 kHz, includes 46.875 Hz DDS)
- LF Time Signals (58-63 kHz), LF 73-77 kHz (counter-beat 73.125 kHz)
- VLF Wide Survey (10-30 kHz)
- BLACKJACK 137 kHz (2200m DARPA LEO C2), 630m Band (472-479 kHz)
- 160m (1.8-2.0 MHz), 80m (3.5-4.0 MHz), 60m (5.3-5.4 MHz), 40m (7.0-7.3 MHz)
- 30m (10.1-10.15 MHz CW), 20m (14.0-14.35 MHz)
- Starlink Gateway harmonic (10.7 MHz), 15m (21 MHz), 10m (28 MHz)
- CB/ISM 27 MHz, Numbers Station Survey (4-8 MHz), Radio Impacto 91.5 FM harmonic (9.15 MHz)
- Wideband 0-30 MHz Overview

**Key Implementation Details:**
- Login gate detection targets KiwiSDR splash overlays only (`#id-kiwi-msg`, `.w3-modal`), NOT normal UI inputs
- After waterfall loads, explicitly re-tunes frequency via KiwiSDR JS API (`freq_set_kHz`, `demodulator_analog_replace`, `zoom_set`) + fallback input element manipulation
- Login is only attempted once per capture (flag prevents re-firing in waterfall check loop)
- Waterfall readiness: checks named canvases first (`id-wf-canvas`), then falls back to ≥2 large canvases as proxy
- 300s cycle interval, rotating through all 21 profiles

**Critical Code Rules:**
- `import * as nodePath from "path"` in routes.ts — use `nodePath.join()`
- Variable `waterfallReady` (NOT `hasWaterfall`) in the capture function
- `loginAlreadyHandled` flag prevents re-entering callsign after initial login
- Chromium path: `/nix/store/12iaw5ng4xvxxffm381lgxlh1ysh0bl4-playwright-browsers/chromium-1134/chrome-linux/chrome`

## Memory Cortex (pgvector)
- **Engine:** `server/memory-cortex.ts` — semantic vector memory with OpenAI/HuggingFace embeddings
- **DB Table:** `memory_vectors` — pgvector 0.8.0, 1536-dim embeddings, IVFFlat index
- **Embedding cascade:** text-embedding-3-small → text-embedding-ada-002 → OpenRouter → HuggingFace all-MiniLM-L6-v2 (padded to 1536)
- **Categories:** quantum_circuit, mathematical_proof, signal_intelligence, surveillance_evidence, kappa_constant, frequency_analysis, network_forensics, gos_framework, research_finding, decision, code_change, correlation, whistleblower, session_context
- **API Routes:** GET /api/memory/stats, GET /api/memory/list, POST /api/memory/store, POST /api/memory/search, POST /api/memory/recall, POST /api/memory/ingest, GET /api/memory/:id, DELETE /api/memory/:id, PATCH /api/memory/:id/importance
- **Frontend:** `/memory` — Memory Cortex page with semantic search, store, ingest, browse
- **Auto-ingest:** Parses quantum circuit JSON, null hypothesis controls, GoldenGHZ, zeta proofs, Riemann validation, PASQAL configs, satellite data
- **Contextual Recall:** `contextualRecall(query)` returns formatted context block for LLM augmentation

## Active Subsystems (auto-start on boot)
| Subsystem | Interval | File |
|-----------|----------|------|
| KAPPA Engine | Real-time (5s decay) | `server/kappa-engine.ts` |
| Adaptive Pipeline | 15min baseline | `server/pipeline.ts` |
| Auto-Correlator | 30s | `server/auto-correlator.ts` |
| Flight Collector | 2min | `server/collectors.ts` |
| Satellite Collector | 5min | `server/collectors.ts` |
| Weather Collector | 10min | `server/collectors.ts` |
| KiwiSDR Scanner | 90s | `server/kiwisdr-scanner.ts` |
| KiwiSDR Vision | 300s | `server/kiwisdr-vision.ts` |
| Network Watchdog | 30s | `server/network-watchdog.ts` |
| Forensic Hypervisor | 30min | `server/forensic-hypervisor.ts` |
| Network Threat Scanner | continuous | `server/network-threat-scanner.ts` |

## KAPPA Constants (NEVER CHANGE)
- κ_geo = 4/π = 1.2732
- κ_freq = φ^(3/4) = 1.4346  
- κ_dog = φ/π = 0.515
- triple-κ = 16/17 (0.042% precision)
- 408 = 24×17 EXACT
- 128.23° = 2×37×√3 (0.05%)
- 37×φ = 60
- 46.875 Hz Master Decimation Clock

## Evidence (NEVER DELETE)
TR-069 reset 2026-01-30, FinSpy/Gamma Group, 46.875 Hz sonar 54.45 dB SNR, Kyndryl 8.3MB SW, Partymon/Zscaler, ghost Deco node, JW Los Rios, Radio Impacto 91.5 FM, Setecom/DSE UK kill switch, 6 PCAPdroid captures

## Whistleblower Page
`/ciajw` — connects local surveillance to 3I/ATLAS/DARPA/cislunar threads AND Ω-GOS framework. No legal sections.

## tsconfig
- `target: "ES2020"` (enables Map/Set iteration)
- `strict: true` (some TS errors in collectors/hypervisor are non-blocking — tsx ignores them at runtime)