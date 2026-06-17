# KAPPA Navigation Audit Report
**Date:** June 17, 2026  
**Method:** Full code-level inventory of all registered routes vs sidebar entries vs page files. No live analytics data (see § Analytics below).

---

## 1. Size of the Problem

| Category | Count |
|---|---|
| Page files in /pages/ | 83 |
| Routes registered in App.tsx | 80 |
| Sidebar entries visible to user | 66 |
| Routes orphaned (in code but NOT in sidebar) | 16 |
| Sidebar entries in wrong group | ~10 |

The nav has grown organically to the point where it's become a long-tail problem: **users (you) cannot find things, and many pages have drifted out of the sidebar entirely.**

---

## 2. Current Sidebar Structure

The sidebar has 8 collapsible groups in this order:

1. **EVIDENCE** — 15 items (expanded by default)
2. **COMMAND** — 3 items
3. **MONITOR** — 7 items
4. **FORENSICS** — 5 items
5. **SIGINT** — 8 items
6. **INTELLIGENCE** — 17 items ← **way too many**
7. **PUBLIC** — 4 items
8. **OPERATIONS** — 7 items

**Critical problem:** INTELLIGENCE has 17 items — including Satoshi Lattice, Quantum Solver, Ω-GOS LNN, Ω-REEL, and Media Pitch — which are not intelligence tools. They got dumped there because there was nowhere else to put them.

**Second critical problem:** EVIDENCE has 15 items including a Drone Dogfight game, a 24-Gon Spoke Wheel, and a Jacó Valley 3D WebGPU map. None of these are "evidence."

---

## 3. Orphaned Pages (in routes but NOT in sidebar)

These pages exist and are reachable if you know the URL, but cannot be found through the sidebar:

| Path | File | Notes |
|---|---|---|
| `/` | home.tsx | Root page — different from /command |
| `/command-center` | command-center.tsx | Duplicate alias for /command |
| `/pochote` | pochote-analysis.tsx | Different from /pochote-incident (which IS in sidebar) |
| `/atlas` | atlas-observatory.tsx | Atlas Observatory — no sidebar entry |
| `/mailer` | mailer.tsx | Mailer page — no sidebar entry |
| `/nexus-slides` | nexus-slides.tsx | Nexus slides — no sidebar entry |
| `/articles/jaco-files` | article-jaco-convergence.tsx | Only 2 of 3 articles are in sidebar |
| `/crank` | crank.tsx | Crank editor — no sidebar entry |
| `/network-analysis` | network-analysis.tsx | HUMINT network analysis — NOT in sidebar despite being substantial |
| `/evidence-directory` | evidence-directory.tsx | Evidence directory — no sidebar entry |
| `/goose/signals` | goose-signals.tsx | Accessible only from within Gazette |
| `/goose/lattice` | signal-lattice.tsx | Accessible only from within Gazette |
| `/goose/admin` | goose-admin.tsx | Accessible only from within Gazette |
| `/goose/editorial` | goose-editorial.tsx | Accessible only from within Gazette |
| `/goose/drone` | drone-blog.tsx | Accessible only from within Gazette |
| `/goose/press-room` | gazette-refiner.tsx | Accessible only from within Gazette |
| `/goose/humor` | goose-humor.tsx | Accessible only from within Gazette |

**Most concerning:** `/network-analysis` is listed in replit.md as having 25+ persons, 14+ locations, 14+ companies, 31+ evidence items — it's a core investigative tool — and it has NO sidebar entry.

---

## 4. Pages in Wrong Groups

| Item | Current Group | Suggested Group |
|---|---|---|
| Drone Dogfight (/game) | EVIDENCE | OPERATIONS or remove |
| 24-Gon Spoke Wheel (/spoke-wheel) | EVIDENCE | OPERATIONS or INTELLIGENCE |
| Jacó Valley 3D (/jaco) | EVIDENCE | MONITOR or standalone |
| Suites Cristina (/cristina) | EVIDENCE | INTELLIGENCE/OPERATIONS |
| C-UAS Intel Library (/drone-intel) | EVIDENCE | INTELLIGENCE |
| ATLANTIS (/atlantis) | MONITOR | INTELLIGENCE |
| Cortex Bus (/cortex-bus) | MONITOR | OPERATIONS |
| Imagery (/imagery) | INTELLIGENCE | FORENSICS or EVIDENCE |
| Ω-GOS 7/4 LNN (/omega-gos) | INTELLIGENCE | SIGINT |
| Ω-REEL (/reel) | INTELLIGENCE | OPERATIONS or PUBLIC |
| Media Pitch (/media-pitch) | INTELLIGENCE | PUBLIC or OPERATIONS |
| Satoshi Lattice (/satoshi-lattice) | INTELLIGENCE | OPERATIONS or remove |
| Quantum Solver (/quantum-solver) | INTELLIGENCE | OPERATIONS or remove |
| Karachi (/karachi) | OPERATIONS | Unknown — needs investigation |
| Congusto (/congusto) | OPERATIONS | Unknown — needs investigation |
| ICE Briefing/Gallium (/gallium) | OPERATIONS | Unknown — needs investigation |

---

## 5. Pages That May Be Broken / Unused

These are in the sidebar but have unclear purpose or known external dependencies that likely fail (KiwiSDR is unreachable from Replit containers per previous diagnostics):

| Page | Issue |
|---|---|
| Bio-Acoustic Correlator (/bio-acoustic) | Experimental — unclear data source |
| 450nm Optical Scan (/optical-scan) | Experimental — unclear data source |
| Demodex Phone (/demodex-phone) | Three.js Demodex simulation |
| Superposition (/superposition) | Quantum cortex experiment |
| Satoshi Lattice (/satoshi-lattice) | Purpose unclear in current context |
| Karachi (/karachi) | Purpose unclear |
| Congusto (/congusto) | Purpose unclear |
| ICE Briefing (/gallium) | Purpose unclear |
| Local LLM Hypervisor (/local-llm) | Requires local LLM — likely broken in production |
| ATLANTIS Hub (/atlantis) | Depends on Atlantis cross-app contract |

---

## 6. Analytics Data

**Current status:** No Google Analytics tracking code is installed in the frontend (confirmed — no GA snippet in index.html, App.tsx, or main.tsx). The available Replit secrets are `ELEVENLABS_API_KEY` and `MAILER_FIRE_SECRET` — no GA Measurement ID is present.

**Implication:** Usage data cannot be pulled from the Analytics API because no pageview data has been collected. To enable analytics going forward, a GA4 Measurement ID (format: G-XXXXXXXXXX) needs to be added to the frontend.

**To get one:** Go to analytics.google.com → Admin → Create Property → get Measurement ID → add as `VITE_GA_MEASUREMENT_ID` secret.

---

## 7. Suggested Actions (VOTE REQUIRED — no action taken yet)

Listed in priority order. Each one is a discrete, reversible action.

---

### ACTION A — Add /network-analysis to sidebar [CRITICAL]
The HUMINT correlation page (25+ persons, 31+ evidence items) is completely missing from the nav. Add it to the EVIDENCE group immediately.

---

### ACTION B — Add /articles/jaco-files to sidebar
Third article exists but isn't in sidebar. Add it to PUBLIC group.

---

### ACTION C — Rename EVIDENCE → FIELD INTELLIGENCE, restructure
Remove Drone Dogfight, Spoke Wheel from this group. Keep: Pochote Incident, Parabolic Antenna, Forensic Evidence, SETECOM, CIAJW Home, Evidence Chain, Audio, Video, Network Forensics, Board, Suites Cristina, Drone Intel.

---

### ACTION D — Split INTELLIGENCE into two groups: RESEARCH and ANALYSIS
- **RESEARCH:** Research, Deep Research, Local LLM, Research Cortex, Liquid Cortex, Memory Cortex, OSINT
- **ANALYSIS:** Intel Reports, Imagery, Meridian Hypervisor, Zersetzung, Follow the Money, Hyperobjects

This alone cuts INTELLIGENCE from 17 items to 7+7.

---

### ACTION E — Create TOOLS group in sidebar
Move these into a dedicated TOOLS group: Karachi, Congusto, Cortex Bus, Social, STELE Studio, Tools, Crank Editor (currently orphaned), Mailer (currently orphaned).

---

### ACTION F — Move SIGINT items that don't belong
Move Ω-GOS LNN, Ω-REEL to SIGINT (where they make more sense). Move Bio-Acoustic, Optical Scan to a sub-section or merge into Spectrum Sweeper.

---

### ACTION G — Archive or remove dead pages
Remove routes for: Drone Dogfight (or move to easter egg), Spoke Wheel (or move to easter egg), Satoshi Lattice (if unused), Quantum Solver (if unused), Superposition (if unused), Karachi (if unused), Congusto (if unused), Gallium/ICE Briefing (if unused). These should be investigated first — if you can tell me which ones you actually use, I can target just those.

---

### ACTION H — Add GA4 tracking
Install 10-line GA4 snippet in index.html with your Measurement ID so future sessions have actual usage data. Requires you to provide the G-XXXXXXXXXX ID.

---

### ACTION I — /pochote-analysis vs /pochote-incident dedup
Two pages with similar names, one is in sidebar, one is orphaned. Decide which to keep or merge.

---

### ACTION J — Add Goose Gazette sub-pages to sidebar (gazette mode only)
The gazette has 7 sub-pages (/signals, /lattice, /admin, /editorial, /drone, /press-room, /humor) that are only accessible if you already know to look inside the gazette. Consider adding a nested goose nav in gazette mode.

---

## 8. Summary Recommendation

The core fix is **Actions A, B, C, D** — these alone would cut cognitive load by ~40% and surface the two most important hidden pages (network-analysis, jaco-files article). Actions E–J are improvements; G needs your input on which pages you actually use.

**Proposed new group structure (7 groups):**
1. FIELD INTELLIGENCE (evidence-heavy, ~10 items)
2. COMMAND (3 items)
3. MONITOR (6 items)
4. SIGINT (8 items)
5. FORENSICS (5 items)
6. RESEARCH (7 items) ← new split
7. ANALYSIS (6 items) ← new split from INTELLIGENCE
8. OPERATIONS / TOOLS (8 items)
9. PUBLIC (4–5 items)

That's ~57 items across 9 groups vs 66 items across 8 groups today — but with much better distribution (max 10 items per group vs 17 today).

---

*Report generated by code-level analysis. No action has been taken. Vote on individual Actions A–J above.*
