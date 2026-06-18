---
name: Whistleblower chapter architecture
description: The /whistleblower page is a 7-chapter tabbed wiki; AI wand uses /api/intel/wand; accordion sub-sections per chapter.
---

The page at `/whistleblower` was rebuilt from a 2,883-line monolith into a clean 7-chapter tabbed wiki.

**Tab order (backwards chronological):**
1. BREAKING — Recording 49 FFT, June 18 2026
2. POCHOTE GRANDE — May–June 2026 operation
3. FLAMBOYANT ERA — crane, sonar, satellite
4. JACO NEXUS — origin, Los Ríos, actors
5. SIGNALS — live KAPPA + KiwiSDR + ELF + PCAP
6. THE NETWORK — 6 HUMINT clusters + adversary
7. ARCHIVE — all downloadable files

**AI Wand:** POST `/api/intel/wand` body `{ chapter, context }` → GPT-4o-mini SIGINT analyst synthesis. Added to server/routes.ts before the `// ── POCHOTE BATCH` comment. Uses `audioOpenAI` (Replit-managed client).

**Why:** User wanted interactive wiki/Medium-style article for ciajw.com with chapters, accordion sub-sections, AI synthesis per chapter, and downloadable evidence. The old page was a single-scroll monolith with no AI integration.

**How to apply:** When extending the page, add new chapters to the `CHAPTERS` const array and create a new `ChapterXxx` component following the same pattern (accordion + AiWand at bottom). Do not add mock data — all evidence cards must point to real files in `/evidence/` or `/assets/`.
