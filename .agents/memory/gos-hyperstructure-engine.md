---
name: GOS Hyperstructure Engine
description: Multi-provider deep research synthesis engine at /gos-hyperstructure. Provider routing, secret keys needed, and job pattern.
---

## Provider Key Requirements

- `openai_gpt4o` — `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` (Replit integration, already set)
- `openrouter_kimi_k2` — `OPENROUTER_API_KEY` (Kimi K2 is already in the OpenRouter model list via `moonshotai/kimi-k2`)
- `kimi_direct` — `KIMI_API_KEY` (direct Moonshot API, `api.moonshot.cn/v1`, OpenAI-compatible, model `moonshot-v1-128k`)
- `openrouter_deepseek` / `openrouter_gemini_flash` / `openrouter_llama` / `openrouter_hermes` — all use `OPENROUTER_API_KEY`
- `gemini_native` — checks `GEM_2`, `GEMINI_API_KEY`, `GOOGLE_ALT`, `GOOGLE_API_E` (any one works)
- `huggingface_qwen` — `HUGGINGFACE_API_KEY`

## Job Pattern

In-memory store (no DB). Jobs expire on server restart. Pattern mirrors existing deep-research run pattern: create job → context builds synchronously → dispatch fires async via Promise.allSettled → meta-synthesis at end.

**Why:** Storage layer doesn't have a GOS table. In-memory is fine since jobs are working artifacts, not long-term records.

## Key Routes

- `GET /api/gos-hyperstructure/providers` — provider status + 9 subdoc vector definitions
- `POST /api/gos-hyperstructure/context` — builds master doc, pulls live KAPPA data (score, correlations, events)
- `POST /api/gos-hyperstructure/dispatch` — fires async, responds immediately
- `GET /api/gos-hyperstructure/download/:jobId/:providerId` — `master`, `meta`, or provider ID

## 9 GOS Research Vectors

Spoke order: satoshi_lattice → dodecahedral_consciousness → leech_topology → physical_instantiation → quantum_army → temporal_weapon → meta_weaponization → kappa_correlations → final_synthesis

Each provider has a default specialty spoke but processes whichever subdoc it's assigned.
