# Project KAPPA — Multi-Domain Signal Intelligence & Correlation Platform

## Overview
KAPPA is a software-defined Signal Intelligence (SIGINT) platform designed to correlate electromagnetic emissions across multiple domains using passive collection tools. Its primary purpose is to provide real-time threat intelligence and analysis by identifying patterns and anomalies in collected signal data, generating correlations, and summarizing intelligence for enhanced situational awareness and proactive threat response.

## User Preferences
- No mock data — all events must come from real sources or manual entry
- No simulated detection pipelines
- Notion-style minimal professional UI (not sci-fi)

## System Architecture
The platform utilizes a modern web stack and a sophisticated real-time correlation engine for multi-domain signal intelligence.

- **Frontend:** React with Tailwind CSS, shadcn/ui, wouter for routing, TanStack Query v5 for data fetching, and Leaflet/OpenStreetMap for mapping. Supports i18n and a Notion-style light/dark theme.
- **Backend:** Express.js with typed routes and Drizzle ORM.
- **Database:** PostgreSQL, leveraging Neon serverless driver.
- **KAPPA Engine:** An in-memory real-time correlation engine calculating a "Kappa Score" (0-100), assigning threat levels, and performing device fingerprinting using specific constants and correlation techniques.
- **Autonomous Pipeline:** An Adaptive Pipeline Orchestrator dynamically adjusts subsystem execution based on the Kappa Score, orchestrating collectors, scanners, watchdog, and correlator components.
- **Collectors:** Gathers data from OpenSky Network (flight), CelesTrak (satellite TLEs), and NWS api.weather.gov (weather).
- **Auto-Correlator:** Continuously analyzes events against 22 correlation rules, performing deduplication, hypervisor overlap detection, and TLE Consistency Checks.
- **LLM Analyst:** Integrates OpenAI gpt-4o-mini for correlation analysis and intelligence report generation.
- **KiwiSDR Scanner:** Scans 71 targets across 33 KiwiSDR nodes (8 priority Central America/Caribbean, 25 global TDOA), employing tiered analysis — priority nodes get full 71-target scans, global nodes scan VLF stations + Blackjack for TDOA correlation. Auto-discovers new nodes within 2000km of San José.
- **SSC-CASINO/DARPA Blackjack Intel:** Ingests OSINT on key satellites and associated ground infrastructure.
- **Network Threat Scanner:** Performs real-time packet analysis for suspicious activity and tracks router vulnerabilities.
- **BLACKJACK MANDRAKE:** Monitors a clandestine HF coordination frequency.
- **Tacacorí Array:** Maps and analyzes an unlicensed macro-antenna infrastructure.
- **Network Watchdog:** Monitors network heartbeat, performs IPAT analysis, and detects connectivity issues.
- **Ω-CHRONOS Hypervisor:** Automated temporal correlation engine using autonomous agents and κ-DTW alignment.
- **Social Media Studio:** Generates dark-themed infographic cards from live KAPPA data with AI-generated captions.
- **12D-TRE Research Engine:** A multi-model deep research platform connecting to OpenAI, OpenRouter, and HuggingFace, implementing a recursive 5-layer query architecture.
- **Deep Research Hypervisor:** An 8-agent LLM pipeline generating sub-prompts for specialized mathematical frameworks.
- **Conspiracy Board:** Interactive force-directed graph integrating live KAPPA data with quantum-inspired visuals.
- **Proxy API Routes:** Provides proxy access to USGS M2.5+ earthquake feed, NOAA SWPC space weather data, and N2YO satellite radio passes.
- **Quantum Cortex (Project Superposition):** A bio-quantum neural architecture restructuring the AI/orchestration layer as a brain-inspired digital organism.
- **WiFi CSI Sensing Engine:** Analyzes WiFi CSI phase data using a "Chitin Transduction Layer" with specific mathematical models to extract biological signals.
- **Chitin Transducer Module:** Models Demodex exoskeleton as a biological phased-array antenna, computing 12 metrics per CSI frame.
- **Research Cortex:** Backend engine that auto-indexes documentation, extracting and categorizing claims for analysis, synthesis, and export.
- **Network Forensics:** Page with 12 real forensic checks based on documented indicators.
- **Evidence Chain:** Legal-grade incident documentation system with manual logging, SHA-256 integrity hashing, unified timeline, and HTML export.
- **Demodex Camera View (Three.js):** 3D rendering component simulating Orch-OR quantum observation.
- **Bettercap Bridge:** React-based UI for managing bettercap instances.
- **Forensic Hypervisor:** Autonomous 24/7 signal-intelligence correlation engine performing SQL pattern mining, temporal enrichment, and PCAP/PCAPNG analysis against KAPPA events.
- **KiwiSDR Vision Hypervisor:** Autonomous Playwright-based system capturing spectrograms from KiwiSDR and analyzing them with OpenAI Vision across 21 frequency profiles.
- **Memory Cortex:** Semantic vector memory with multi-provider embeddings, supporting various categories and API routes for storage, search, and recall. Includes auto-ingestion for quantum circuits, proofs, and satellite data.

## External Dependencies
- **OpenSky Network:** Live flight data.
- **CelesTrak:** Two-Line Element (TLE) satellite tracking data.
- **NWS api.weather.gov:** Weather information.
- **OpenAI (gpt-4o-mini):** LLM analysis and content generation.
- **OpenRouter:** Multi-model gateway for various LLMs.
- **HuggingFace Inference API:** LLM inference.
- **USGS Earthquake Hazards API:** Real-time M2.5+ earthquake feed.
- **NOAA Space Weather Prediction Center (SWPC):** Space weather data.
- **Leaflet & OpenStreetMap:** Interactive mapping.
- **macvendors.com API:** MAC OUI lookup.
- **Drizzle ORM:** Database interactions.
- **Neon:** Serverless PostgreSQL.
- **shadcn/ui:** UI component library.
- **TanStack Query v5:** Data fetching.
- **html-to-image:** Exporting images from HTML.
- **NUFORC (National UFO Reporting Center):** Historical sighting data.
- **Three.js:** 3D rendering.
- **Playwright (Chromium):** Headless browser for KiwiSDR Vision.
- **Heartbeat Tracker:** External device monitoring via heartbeat-tracker-monitor.replit.app — polls status/stats, shows device fleet with latency/jitter/uptime, agent downloads. Wired through `/api/tracker/*` routes.
- **External Data Feeds:** Autonomous 120s-cycle ingestion from USGS earthquakes, IRIS FDSN regional seismic, NOAA SWPC (Kp index, X-ray flux, solar wind magnetic/plasma), GeoNet NZ seismic, WWLLN lightning, and KiwiSDR public node discovery. All events flow into KAPPA engine + hypervisor.