# Threat Model

## Project Overview

KAPPA is a public-facing Express + React SIGINT and forensic intelligence platform deployed on Replit autoscale with a PostgreSQL database and many outbound integrations (OpenAI/OpenRouter/HuggingFace, Google APIs, Earth Engine, external telemetry/weather/satellite feeds, KiwiSDR nodes, and fleet-tracker device endpoints). The production attack surface is concentrated in `server/index.ts`, `server/routes.ts`, `server/google-oauth.ts`, `server/research-web.ts`, `server/bettercap/*`, `server/heartbeat-client.ts`, and the React client under `client/src`.

Per deployment assumptions for this project: production runs with `NODE_ENV=production`, traffic is TLS-terminated by the platform, the current deployment is public, and mockup/dev sandbox assumptions do not reduce exposure for routes registered in the production server.

## Assets

- **Operational telemetry and forensic datasets** — signal events, correlations, screenshots, packet/PCAP-derived findings, research sessions, evidence-chain records, and uploaded media. Exposure or tampering could corrupt investigations or reveal sensitive monitoring data.
- **Device fleet data** — device identifiers, IPs, location updates, heartbeat metadata, sensor readings, alert states, and command logs handled by the tracker endpoints. This data can reveal live device presence, operator behavior, and physical location.
- **Third-party credentials and delegated access** — Google OAuth tokens for Earth Engine/Drive, Google API keys, OpenAI/OpenRouter/HuggingFace credentials, and Bettercap instance credentials held server-side.
- **Server-side execution capability** — APIs that trigger scans, external fetches, subprocesses, corpus indexing, uploads, and remote Bettercap commands can be abused for denial of service, unauthorized state change, or indirect network access.
- **Research corpus contents** — documents in `docs/context-docs` and Memory Cortex entries may contain sensitive investigative notes and derived intelligence.

## Trust Boundaries

- **Public browser/device to Express API** — every `/api/*` route is internet-reachable on the public deployment unless explicitly protected; the client must be treated as untrusted.
- **Express API to PostgreSQL** — route handlers can read and mutate fleet, memory, incident, research, and evidence data.
- **Express API to external services** — server-side fetches to Google, Earth Engine, NOAA, USGS, KiwiSDR, N2YO, OpenRouter/OpenAI, and user-supplied URLs cross a trust boundary where SSRF, token misuse, and unbounded fan-out matter.
- **Express API to local filesystem/processes** — uploads, corpus document writes, static evidence serving, and subprocess execution (`python3`, `ffmpeg`, `ffprobe`) cross a sensitive boundary. Public write routes must constrain resolved paths so callers cannot escape intended directories or overwrite other writable files.
- **Operator/admin-equivalent functions vs public readers** — tracker control, Bettercap bridge, corpus editing, ingestion triggers, and destructive CRUD routes should be treated as privileged even though the current code does not consistently separate them.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/google-oauth.ts`, `server/static.ts`, `client/src/main.tsx`.
- **Highest-risk code areas:** unauthenticated route handlers in `server/routes.ts`; outbound user-influenced fetches in `server/research-web.ts` and `/api/tools/http-probe`; Bettercap bridge under `server/bettercap/*`; tracker endpoints backed by `server/heartbeat-client.ts`; document/memory mutation endpoints; filesystem write sinks in `server/research-cortex.ts` used by public document-creation routes.
- **Public vs authenticated vs admin surfaces:** current production API appears effectively public-by-default; no central auth/authorization middleware is evident in the registered routes.
- **Usually ignore unless proven reachable:** evidence folders, attached assets, research archives, and other static/historical directories outside the registered Express routes. Deterministic SAST hits in archival data should be deprioritized unless code is imported by the production server.

## Threat Categories

### Spoofing

The public API accepts device registration, heartbeats, sensor uploads, and Google OAuth callbacks from untrusted clients. KAPPA must authenticate privileged callers and bind device updates or delegated OAuth state to an authorized principal; otherwise attackers can impersonate fleet devices, operators, or service callbacks.

### Tampering

Many routes create, modify, or delete research corpus documents, memory entries, incidents, tracker thresholds, device records, and hypervisor state. All state-changing endpoints that affect investigations, fleet state, or operational configuration must enforce server-side authorization and validate that the caller is allowed to perform the requested change.

### Information Disclosure

KAPPA stores and returns operational telemetry, device metadata, heartbeats, GPS-like location data, research notes, evidence references, and delegated service status. Public endpoints must not expose investigative data, device inventories, command history, or secrets/tokens to unauthenticated callers, and API logging must avoid echoing sensitive payloads.

### Denial of Service

The application starts numerous collectors and exposes routes that trigger expensive scans, recursive LLM research, uploads, indexing, synthesis, and subprocess execution. Public endpoints must have rate limits, payload limits, and caller authorization so attackers cannot consume compute, fill storage, or starve downstream APIs.

### Elevation of Privilege

The most important guarantee in this codebase is separation between passive public read access and privileged operator functions such as Bettercap control, corpus editing, fleet management, and internal-analysis actions. The server must enforce role-aware authorization on every privileged route, and user-controlled URLs or external targets must be constrained to prevent SSRF into internal services or cloud metadata endpoints.
