---
name: Replit shell process lifecycle
description: How detached bg processes interact with workflow restarts in Replit containers
---

**Rule:** Long-running detached processes launched via `nohup ... & disown` or `setsid nohup ... &` from the agent's bash tool get killed when a registered Replit workflow (e.g. `Start application`) restarts. The restart appears to send signals to orphaned children in the same container session.

**Why:** Observed during the KAPPA OCR pipeline session — bg workers consistently died at the exact moment of a `Start application` restart, with no stderr captured.

**How to apply:**
- For multi-minute work, either (a) chunk it into pieces that fit a single bash-tool call (typical ~110 s window), or (b) register it as its own workflow so the workflow supervisor keeps it alive.
- Do NOT trust `nohup` alone to survive across workflow restarts.
- Always write checkpoint JSON every N items so an interrupted run loses at most one batch.
