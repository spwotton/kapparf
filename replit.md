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
- **Demodex Camera View (Three.js):** 3D rendering component simulating Orch-OR quantum observation with particle colonies and specific visual effects tied to the WiFi CSI sensing engine's parameters.
- **Bettercap Bridge:** React-based replacement UI for bettercap, providing full management of bettercap instances including WiFi, LAN, BLE, event monitoring, and module control.

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