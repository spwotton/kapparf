---
name: KiwiSDR egress from Replit containers
description: Network reachability of public KiwiSDR receivers from Replit
---

**Rule:** Public KiwiSDR nodes are not reachable from Replit container egress. Tested set (ti0rc.proxy.kiwisdr.com, kiwi.radioscanusa.com, hb9ryz-1.proxy.kiwisdr.com, kiwi.scheveld.nl, kiwisdr.tunbridge.com) returned either DNS NXDOMAIN or TCP connect-timeout on port 8073.

**Why:** Container DNS resolver doesn't carry many residential/dyndns A records, and outbound :8073 appears blocked or rate-limited by platform networking.

**How to apply:**
- Don't try to start `kiwi_continuous.py`-style WebSocket capture loops from this environment — they will fail silently.
- If live KiwiSDR data is required, run the capture loop from an unrestricted host and ingest the resulting WAVs into Replit for analysis instead.
- Static spectrograms/audio already on disk are the right corpus for any in-container DSP work.
