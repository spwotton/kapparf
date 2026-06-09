---
name: Inter-app API contracts
description: Where to find and how to maintain all cross-app endpoint specs for the KAPPA ecosystem (Atlantis, KYMA, Oracle, Meridian)
---

## Rule
Read `docs/INTER_APP_CONTRACTS.md` at the start of ANY session that touches Atlantis Hub, KYMA, Oracle, or Meridian. Do not reconstruct this from scratch.

## Why
Sam's ecosystem spans 15+ apps. API endpoints are not in the code comments or replit.md, so they get rebuilt from scratch every session at significant cost. The contracts doc is the fix.

## How to apply
- Before editing `server/atlantis-satellite.ts` → read the contracts doc first.
- When Sam provides an Atlantis endpoint → update docs/INTER_APP_CONTRACTS.md immediately, mark it ✅.
- When a new app joins the ecosystem → add a section to the contracts doc AND to `seedNativeApps()` in `server/atlantis-hub.ts`.

## Current known gaps (as of Jun 2026)
- Atlantis Hub API endpoints are GUESSED (POST /api/cortex/register, POST /api/cortex/tag) — need Sam to confirm from the live app.
- KYMA ingest endpoint (does KYMA accept push from KAPPA?) — unknown.
- Oracle query endpoint — unknown.
- Meridian external URL — unknown (may be internal-only).

## Key files
- `docs/INTER_APP_CONTRACTS.md` — the living spec
- `server/atlantis-satellite.ts` — KAPPA → Atlantis push (every 30s)
- `server/atlantis-hub.ts` — internal hub mirror + app registry
- `server/atlantis-probe.ts` — app health polling + GOS constants
- `server/memory-cortex.ts` — KYMA_BASE URL constant
