# Ω-REEL — Architecture & SaaS Product Specification

> **One-line pitch:** The only AI video tool that uses Hall-regularized narrative coherence math to guarantee your clips flow together — not just look good, but *mathematically* hold together as a single arc.

---

## 1. Executive Summary

Ω-REEL is a standalone AI cinematic video composer. A user types a theme ("a storm over a desert at golden hour"), optionally picks visual anchors from their existing images, and the system outputs a fully-stitched MP4 — complete with narration, music bed, and frame-precise beat onsets — in one click.

The differentiator is not aesthetic. It is mathematical. Every reel is backed by a **narrative Gram matrix** whose Hall-regularized condition number κ_H must stay below 65.18. If it doesn't, the system automatically synthesizes bridge beats and re-runs until it converges. No other AI video tool does this. It is a genuine moat.

**SaaS conversion thesis:** The free trial produces a 4-beat, watermarked, 9:16 vertical reel in ~3 minutes. Users immediately see something coherent and beautiful. The paywall is the thing they already want: longer reels, audio, no watermark, sonata mode, concept imagination, and bridge repair. Trial → paid conversion is almost entirely driven by the output quality of the free tier — there is no "aha moment" gap because the aha moment *is* the free output.

---

## 2. User Journey (3 Phases)

```
OUTLINE ──────────────────────────────────────────────────────────────────────
  User types theme
  Optionally selects feed image anchors (visual grounding)
  Optionally runs AI Concept Imaginator (4 creative directions)
  Clicks "Generate Outline"
    → 2-pass AI pipeline runs (Architecture HV + Beat Composer HV)
    → N beats returned with Ψ-targets, coherence score, and κ_H metric
  Optionally runs "Auto-Repair" to patch coherence faults
  Advances to Generation phase

GENERATION ───────────────────────────────────────────────────────────────────
  Each beat → async Veo clip job (POST /reel/clip → returns jobId)
  Frontend polls GET /reel/clip-status/:id every 4 s
  Clips arrive with terminal frame (used as seed for next clip = visual continuity)
  All done → auto-stitch fires
  Partial done → user opts in to "stitch partial"
  Cancel at any point → pipeline saves checkpoint for resume

PLAYBACK ─────────────────────────────────────────────────────────────────────
  Final stitched MP4 with beat-accurate onsets
  Optional narration (10 TTS voices) per beat, offset-snapped to actual onsets
  Optional music bed (user upload) with volume control
  Score → mixed video with narration + music
  Cover frame selectable (scrub to any timestamp)
  Download final video
```

---

## 3. Full API Surface

All endpoints are mounted at `/api/reel/*` on the Express 5 API server.

### 3.1 `POST /api/reel/outline`

**Purpose:** Generate a structured N-beat cinematic arc from a theme.

**2-pass pipeline:**
- **Pass 1 — Architecture Hypervisor:** Designs the structural skeleton only. Returns `title`, `acts[]`, `spine`, `subjectAnchor`, `lightingArc`. No beat prompts yet. Forces the AI to think in structure before content.
- **Pass 2 — Beat Composer Hypervisor:** Receives the skeleton and expands into exactly N cinematic visual prompts. Each beat is one Veo-bound clip — mobile-vertical (9:16), short, vivid, no dialogue, no on-screen text.

**Request body:**
```ts
{
  theme: string;              // max 600 chars
  beatCount: number;          // 1–24 (24-spoke icositetragon)
  tier?: "free" | "$" | "$$" | "$$$";
  sonataMode?: boolean;       // Exposition 25% / Development 50% / Recap 25%
  referencePrompts?: string[]; // up to 8 image prompts from feed anchors
}
```

**Response:**
```ts
{
  title: string;
  theme: string;
  sonataMode: boolean;
  beats: Beat[];              // see Beat type below
  coherence: {
    kappa: number;            // raw condition number κ(G)
    kappaHall: number;        // Hall-regularized κ_H — THE metric
    kappaMax: number;         // threshold = 65.18
    eta: number;              // η stability floor
    bridges: Array<{ from: number; to: number; kappa: number }>;
    observerPresence: number; // quantum observer coupling metric
    embeddingMode: string;    // "hall" | "raw"
    gram: number[][];         // full Gram matrix G
    gramHall: number[][];     // Hall-regularized Gram matrix G_H
  };
  model: string;
  tier: string;
  arch: {
    spine: string;
    subjectAnchor: string;
    lightingArc: string;
    acts: Act[];
    model: string;
  };
}
```

**Beat type:**
```ts
type Beat = {
  index: number;          // 1-based icositetragon spoke label (1..24)
  spoke: number;          // 0-based position (0..23)
  visualPrompt: string;   // the Veo prompt (max 600 chars)
  psiTarget: number;      // Ψ coherence target for this spoke
  A: number;              // real part of Ψ-target (aesthetic amplitude)
  N: number;              // narrative weight
  sigma: number;          // critical line σ = 0.5 (Riemann anchor)
  gamma: number;          // imaginary part: 14.134725 + spoke × 0.5
  phi: number;            // angular position: (spoke/24) × 2π × φ
  durationSeconds?: number; // per-beat override (bridge beats = 1–2s)
  sonataSection?: "exposition" | "development" | "recapitulation";
  bridge?: {              // editorial metadata for auto-inserted bridge beats
    status: "pending" | "accepted";
    leftSpoke: number;
    rightSpoke: number;
    leftPrompt: string;
    rightPrompt: string;
    pairKappa?: number;
  };
};
```

---

### 3.2 `POST /api/reel/repair`

**Purpose:** Auto-heal narrative coherence faults. The system detects adjacent beat pairs where the 2×2 Gram block exceeds κ_max = 65.18 ("bridges"), synthesizes a 1–2s transitional beat between each, and iterates until convergence or iteration cap.

**Request body:**
```ts
{
  beats: Beat[];
  theme: string;
  tier?: Tier;
  maxIterations?: number;   // 1–6, default 3
}
```

**Algorithm per iteration:**
1. Sort flagged bridge pairs by index descending (so insertions don't shift later indices)
2. For each pair: call Beat Composer HV to synthesize a transitional beat (midSpoke = avg of left+right)
3. If κ(pair) ≥ 20 (near-duplicate): also regenerate the right-hand beat to break rank-1 symmetry
4. Re-run `computeNarrativeCoherence` on the expanded beat array
5. Convergence guard: stop early if neither κ_H improved by ≥ 0.5 nor bridge count shrank

**Response:**
```ts
{
  beats: Beat[];             // expanded (bridge beats inserted)
  coherence: CoherenceReport;
  iterations: Array<{
    pass: number;
    kappa: number;
    kappaHall: number;
    bridgesBefore: Array<{ from: number; to: number; kappa: number }>;
    inserted: Array<{
      atIndex: number;
      spoke: number;
      visualPrompt: string;
      durationSeconds: number;
      betweenSpokes: [number, number];
    }>;
  }>;
  stopReason: "converged" | "no-bridges" | "no-progress" | "iteration-cap";
  converged: boolean;
  insertedCount: number;
  initialCoherence: CoherenceReport;
}
```

---

### 3.3 `POST /api/reel/repair-pair`

**Purpose:** Single-pair bridge repair. Used by the editorial "regenerate this bridge" button in the Outline UI. Synthesizes one new transitional beat between a specified left and right beat.

**Request body:**
```ts
{
  leftBeat: Beat;
  rightBeat: Beat;
  theme?: string;
  tier?: Tier;
}
```

---

### 3.4 `POST /api/reel/clip`

**Purpose:** Start an async Veo clip generation job. Returns immediately with `{ jobId }`. Frontend polls `/reel/clip-status/:id`.

**Why async:** Veo generation takes 3–5 minutes per clip. Synchronous requests would time out through the proxy. The job store GC's entries older than 30 minutes every 5 minutes.

**Request body:**
```ts
{
  beat: Beat;
  prevFrame?: string;         // base64 PNG — last frame of previous clip (visual seeding)
  aspectRatio: "9:16" | "16:9";
  durationSeconds: number;    // 1–20s
}
```

**Response:**
```ts
{ jobId: string }
```

**Clip result (available via clip-status once done):**
```ts
{
  video: string;              // base64 mp4
  videoMimeType: string;
  model: string;
  tier: string;
  appliedDurationSeconds: number;
  appliedAspectRatio: string;
  psiScore: { A: number; N: number; psi: number };
  continuity: {
    dominantElements?: string[];
    continuityScore?: number;
    bridgeSuggestion?: string;
  } | null;
  terminalFrame: string;      // base64 PNG — last frame, for next beat seeding
  promptUsed: string;
  clipId?: string;            // server-side cache ID (avoids re-sending base64 to stitch)
}
```

---

### 3.5 `GET /api/reel/clip-status/:jobId`

**Purpose:** Poll async clip job. Returns `{ status: "pending" | "running" | "done" | "error", ...result }`.

Frontend polls every 4 seconds with a 10-minute hard timeout per clip.

---

### 3.6 `POST /api/reel/stitch`

**Purpose:** Assemble all completed clips into a single MP4 using ffmpeg with B(t)-weighted xfade transitions and palette-derived bridge frames.

**Request body (two forms):**
```ts
// Preferred — uses server-side clip cache IDs (avoids 413 on long reels)
{
  clipIds: string[];
  beats: Array<{ B: number; durationSeconds: number; visualPrompt: string }>;
  aspectRatio: "9:16" | "16:9";
}

// Fallback — raw base64 (legacy or cache-miss)
{
  clips: string[];  // base64 mp4 array
  beats: Array<{ B: number; durationSeconds: number; visualPrompt: string }>;
  aspectRatio: "9:16" | "16:9";
}
```

**B(t) — Aesthetic Gradient:**
```
B = max(0, min(1, 1 − |Ψ − 1.0|))
```
B close to 1 → tight cut (shorter xfade)
B close to 0 → slower fade

**Transition types:**
- **Normal pairs:** `xfade=transition=fade` with B(t)-derived duration
- **Bridge pairs (κ-flagged):** Two-step `fade → palette-midcolor frame → fade`. The bridge frame is a lavfi solid-color clip at the average dominant color of the two flanking clips — the visible seam dissolves through a perceptually plausible intermediate.

**ffmpeg filter graph (multi-clip):**
```
[0:v]scale=W:H:force_original_aspect_ratio=increase,crop=W:H,setsar=1,fps=30,format=yuv420p[v0];
[1:v]scale=...format=yuv420p[v1];
...
[N:v]...[lavfi bridge color input]...[b0];
[v0][v1]xfade=transition=fade:duration=D:offset=O[x1];
[x1][b0]xfade=fade:duration=0.2:offset=O2[s0];
[s0][v2]xfade=fade:duration=0.2:offset=O3[vout];
```

**Response:**
```ts
{
  video: string;              // base64 stitched mp4
  videoMimeType: string;
  duration: number;           // total seconds
  beatOnsets: number[];       // per-beat onset timestamps in stitched timeline
  resolution: { width: number; height: number };
  bridges: Array<{
    from: number; to: number;
    durationSeconds: number;
    transition: "palette-fade";
    color: string;            // hex dominant mid-color
  }>;
}
```

**Critical:** `beatOnsets` are authoritative — they account for xfade overlaps and bridge frame durations. Narration offsets are snapped to these after stitch, replacing any naive cumulative-sum estimate.

---

### 3.7 `POST /api/reel/score`

**Purpose:** Mix narration (TTS) and/or music bed into the stitched video.

**Request body:**
```ts
{
  video: string;              // base64 stitched mp4 (silent)
  narration: Array<{
    text: string;
    voice: TtsVoice;          // alloy|ash|ballad|coral|echo|fable|onyx|nova|sage|shimmer
    offsetSeconds: number;    // snapped to beatOnsets
  }>;
  music?: {
    audio: string;            // base64 music track
    mimeType: string;
    volume: number;           // 0..2
  };
  narrationVolume?: number;   // 0..2, default 1
}
```

TTS voices available: `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `onyx`, `nova`, `sage`, `shimmer`

---

### 3.8 `POST /api/reel/imagine`

**Purpose:** ConceptImaginator — generates 4 distinct creative directions from feed anchors. Eliminates "blank page" paralysis.

**Request body:**
```ts
{
  anchors: Array<{ text: string; imagePrompt: string }>;
  beatCount: number;
}
```

**Response:**
```ts
{
  concepts: Array<{
    id: string;
    title: string;           // 3–5 word creative title
    direction: string;       // prose description of creative direction
    visualTone: string;      // cinematography/palette description
    emotionalArc: string;    // one-phrase arc (e.g. "wonder → loss → acceptance")
    refinedPrompt: string;   // ready-to-use theme for /reel/outline
    hue: number;             // 0–360 accent color for UI card
  }>;
}
```

---

### 3.9 `POST /api/reel/imagine/refine`

**Purpose:** Iteratively refine a single concept direction. Second LLM pass sharpens one card into a more specific, actionable theme.

---

### 3.10 `POST /api/reel/narration/draft`

**Purpose:** Draft narration text for each beat using LLM. The AI reads each beat's visual prompt and the overall theme, then writes narration copy timed to each clip's duration.

---

## 4. Data Models

### 4.1 ReelSession (IndexedDB, key: `id`)
```ts
type ReelSession = {
  id: string;                    // "reel_<timestamp>_<random>"
  title: string;                 // AI-generated or user-edited
  theme: string;                 // original prompt
  beats: ReelBeat[];             // structured beat sequence
  clips: ReelClip[];             // one per beat
  coherence: ReelCoherence;      // κ_H, bridges, etc.
  finalVideo?: string;           // base64 stitched mp4 (silent)
  finalMime?: string;
  finalResolution?: { width: number; height: number };
  aspectRatio: "9:16" | "16:9" | "1:1";
  durationSeconds: number;       // per-clip requested duration
  audio?: ReelAudio;             // narration + music
  coverThumbnail?: string;       // data URL (SVG Ψ-curve or JPEG frame)
  coverKind?: "bridge" | "curve" | "frame";
  coverFrameSeconds?: number;    // for frame covers: which timestamp
  pipelineState?: {              // bridge auto-pipeline checkpoint
    kind: "running" | "cancelled" | "complete" | "error";
    stage: "repair" | "clips" | "stitch";
    updatedAt: number;
  };
  createdAt: number;
  updatedAt: number;
};
```

### 4.2 ReelClip
```ts
type ReelClip = {
  beatIndex: number;             // spoke index (matches beat.spoke)
  video?: string;                // base64 mp4
  videoMimeType?: string;
  clipId?: string;               // server-side cache ID
  terminalFrame?: string;        // base64 PNG — last frame
  psiScore?: { A: number; N: number; psi: number };
  continuity?: { dominantElements?: string[]; continuityScore?: number; bridgeSuggestion?: string } | null;
  promptUsed?: string;
  durationSeconds?: number;      // actual applied duration
  onsetSeconds?: number;         // authoritative position in stitched timeline
  status: "pending" | "running" | "done" | "error";
  error?: string;
};
```

### 4.3 ReelAudio
```ts
type ReelAudio = {
  enabled: boolean;
  narration: Array<{
    beatIndex: number;
    text: string;
    voice: string;
    offsetSeconds: number;       // snapped to beatOnsets post-stitch
  }>;
  music?: {
    audio: string;               // base64 music track
    mimeType: string;
    name: string;
    volume: number;              // 0..2
  } | null;
  narrationVolume: number;       // 0..2
  scoredVideo?: string;          // final mixed video base64
  scoredMime?: string;
  lastScoredAt?: number;
};
```

### 4.4 Persistence
- **Storage:** Browser IndexedDB (`omega-gram-reel`, version 1, object store `sessions`)
- **Limit:** 12 sessions max (oldest by `updatedAt` pruned on overflow)
- **Durability:** All pipeline stages persist via `saveReel()` after every state transition — page reload resumes from last checkpoint

---

## 5. Mathematical Foundations

### 5.1 The 24-Spoke Icositetragon

The beat sequence maps onto a 24-spoke wheel (icositetragon). Each spoke position defines a unique Ψ-target:

```
gamma(spoke) = 14.134725 + spoke × 0.5    // Riemann zeta first zero anchor
phi(spoke)   = (spoke / 24) × 2π × φ      // golden-angle traversal
sigma        = 0.5                          // critical line (Re(s) = 1/2)
```

These are not decoration. They enforce that the beat sequence traverses the complex plane in a φ-harmonic spiral, producing prompts that naturally vary in emotional register rather than clustering.

### 5.2 Ψ-Score (Coherence Target per Beat)

```
Ψ_target(spoke) = f(A, N)
A = aesthetic amplitude  (real component of Ψ)
N = narrative weight     (imaginary component)
```

Each generated clip returns a realized `psiScore = { A, N, psi }`. The deviation `|psi − 1.0|` drives the aesthetic gradient B(t) that controls xfade duration in stitching.

### 5.3 Hall-Regularized Narrative Gram Matrix

This is the core differentiator. The narrative coherence score is derived from the **Gram matrix** of the beat sequence's semantic embedding, regularized by Hall's method.

**Construction:**
1. Each beat's `visualPrompt` is embedded as a character-frequency bag vector (normalized)
2. The Gram matrix `G[i,j] = <prompt_i, prompt_j>` is computed (cosine similarity)
3. Hall regularization: `G_H = G + η × I` where η = 0.09 (floor to prevent near-singular G from causing κ → ∞ on near-identical prompts)
4. `κ_H = λ_max(G_H) / λ_min(G_H)` (condition number)

**Thresholds:**
- `κ_max = 65.18` — above this, the pair is a "bridge" (coherence fault)
- `NEAR_DUP_KAPPA = 20` — above this, the right-hand beat is regenerated (not just bridged)
- `KAPPA_PROGRESS_THRESHOLD = 0.5` — minimum meaningful κ_H improvement per repair iteration
- `VIEWER_PRESENCE_GAP` — observer coupling metric (gap between first two eigenvalues of G_H)

**Why it works:** If two adjacent beats are semantically identical (same scene, same palette, same subject — which an LLM tends to produce without constraint), their dot product is ~1, their 2×2 Gram block is nearly rank-1, and κ explodes. The system *cannot* produce visually coherent clips from near-duplicate prompts — the Veo model will generate the same scene twice, creating a stutter instead of a cut. Detecting and patching this before generation saves expensive Veo calls.

### 5.4 Bridge Beat Synthesis (κ-Fault Repair)

When a pair `(beat_i, beat_{i+1})` has κ > κ_max:
1. Compute `midSpoke = round((spoke_i + spoke_{i+1}) / 2) % 24`
2. Call Beat Composer HV with both flanking prompts and the Ψ-target at midSpoke
3. The bridge beat is synthesized to share concrete subject/palette/motion with BOTH neighbors
4. Insert between the pair in the beat array
5. Re-run Gram computation — if the new beat is sufficiently different from both neighbors, κ_H drops

**Fallback:** If the HV call fails, a deterministic cross-fade prompt is generated:
```
"Cross-fade morph: {left[0..60]} → {right[0..60]}"
```

### 5.5 B(t) — Aesthetic Gradient for Stitch

```
B(t) = max(0, min(1, 1 − |Ψ_realized − 1.0|))
```

B ≈ 1 → beat is near-ideal → tight cut (short xfade, ~0.1s)
B ≈ 0 → beat deviates from ideal → slower dissolve (long xfade, ~0.5s)

This makes the edit rhythm emerge from the content quality rather than a fixed tempo. High-quality beats cut faster; problematic beats dissolve more slowly to conceal seams.

### 5.6 Sonata Form Structure

When `sonataMode = true`, the Architecture HV enforces:
- **Exposition** (beats 1–25%): introduce primary visual theme, stable, grounded
- **Development** (beats 26–75%): fragment, vary, transform — rising tension
- **Recapitulation** (beats 76–100%): return to primary theme, resolution, stillness

The tension spine `stable → rising → peak → resolution` is embedded as a hard constraint in the Architecture HV system prompt, not a soft suggestion.

---

## 6. Bridge Auto-Pipeline (Cathedral Integration)

The Ω-CATHEDRAL view can detect "semantic bridges" between concepts in the latent space and dispatch a `omega:bridge-reel` event. The Reel hook handles this with a fully-automated repair → clips → stitch pipeline:

```
Stage 1: REPAIR
  computeNarrativeCoherence(beats)
  → patch all κ-faults
  → persist updated session

Stage 2: CLIPS  
  for each beat:
    POST /reel/clip → jobId
    poll /reel/clip-status every 4s
    on done: persist clip (video + terminalFrame + clipId)
    on error: retry × 3, mark error and continue
  fail-fast if 0 clips succeed

Stage 3: STITCH
  POST /reel/stitch (clipIds preferred over base64)
  → ffmpeg assembly
  → authoritative beatOnsets
  → persist finalVideo

Cancel at any stage → checkpoint saved → gallery shows "resume from <stage>"
Resume → reads freshest IDB snapshot, skips completed stages
```

**Event architecture:**
```
omega:bridge-reel        { session, autoRun }   → starts pipeline
omega:bridge-reel-cancel {}                     → sets cancel flag
omega:bridge-reel-status { kind, reelId, stage, clipsDone, clipsTotal }
```

The pipeline runs in the browser JS thread. The cancel flag (`isBridgeCancelRequested()`) is checked at every stage boundary AND inside the clip polling loop, so cancellation is responsive even if the React hook has been unmounted.

---

## 7. Frontend Architecture

### 7.1 State Machine

```
Phase: "outline" | "generation" | "playback"

Outline:
  - FeedContextPicker: thumbnail grid, up to 12 images, multi-select
  - ConceptImaginator: 4 AI-generated directions, per-card refine
  - Beat/duration/aspect/sonata controls
  - IcositetragonArc: visual 24-spoke wheel with active beat highlight
  - Coherence panel: κ_H bar, bridge list, accept/reject/regenerate per bridge

Generation:
  - Per-clip status pills (pending/running/done/error)
  - Psi score display per clip
  - Continuity overlay (dominant elements, continuity score)
  - Cancel → partial stitch option

Playback:
  - Native video player with final stitched MP4
  - Cover frame scrubber (tap any second to set gallery thumbnail)
  - Narration editor: per-beat text + voice + offset
  - Music upload + volume slider
  - "Score" button → mixed video
  - Download button
```

### 7.2 Persistence Strategy (`use-reel.ts`)

- `sessionRef` mirrors `session` state without triggering re-renders in async closures
- `pipelineRef` holds the latest pipeline runner closure (always has fresh dependencies)
- All stage transitions call `persist(session)` which writes to IndexedDB AND updates React state
- Gallery auto-reloads after every persist
- On mount: drain `bridgeHandoffQueue` (events that fired before the listener was attached)

### 7.3 Clip Cache

Server-side clip cache (`CLIP_CACHE_DIR`) stores each generated clip as a temp file. When the stitch request uses `clipIds`, the server reads clips directly from disk — avoiding sending large base64 payloads (typically 5–20 MB per clip) back through the API and then immediately re-uploading them.

GC: jobs older than 30 minutes are purged from the in-memory `clipJobs` Map every 5 minutes.

---

## 8. SaaS Tier Design

### Free Trial (no account required)
| Feature | Limit |
|---|---|
| Beats per reel | 4 max |
| Clip duration | 5s only |
| Aspect ratio | 9:16 only |
| Narration | 1 voice (alloy), no custom text |
| Music | none |
| Sonata mode | disabled |
| Concept Imaginator | 1 generate, no refine |
| Auto-repair | 1 iteration max |
| Output | watermarked MP4, 720p |
| Gallery | 1 saved session |
| Bridge pipeline | disabled |
| Export | in-browser only |

### Solo — $9/mo
| Feature | Limit |
|---|---|
| Beats per reel | 12 max |
| Clip duration | 3–10s |
| Aspect ratio | 9:16 and 16:9 |
| Narration | all 10 voices, AI draft |
| Music | upload MP3/WAV |
| Sonata mode | enabled |
| Concept Imaginator | unlimited |
| Auto-repair | 3 iterations |
| Output | no watermark, 720p |
| Gallery | 12 saved sessions |
| Bridge pipeline | enabled |
| Export | download |

### Studio — $29/mo
| Feature | Limit |
|---|---|
| Beats per reel | 24 (full icositetragon) |
| Clip duration | 1–20s per-beat override |
| Aspect ratio | 9:16, 16:9, 1:1 |
| Narration | all voices + AI draft per beat |
| Music | upload + volume mix |
| Sonata mode | enabled with act labels |
| Concept Imaginator | unlimited + per-card refine |
| Auto-repair | 6 iterations |
| Output | no watermark, 1080p |
| Gallery | 50 saved sessions |
| Bridge pipeline | full auto-pipeline with resume |
| Feed anchors | up to 8 images |
| Cover frame | scrub to any timestamp |
| Export | download + shareable link |

### Agency — $79/mo
| Feature | Limit |
|---|---|
| All Studio features | — |
| Reels per month | unlimited |
| API access | REST API key |
| Batch generation | queue up to 10 reels |
| White-label export | remove branding |
| Priority Veo queue | faster generation |
| Webhook on completion | POST to your URL |
| Team seats | 3 included |

---

## 9. Conversion Funnel Design

### The Core Loop
```
1. Landing → "make a reel in 60 seconds" CTA
2. Theme input (no account, no friction)
3. Free 4-beat reel generates (~3 min)
4. User watches output — coherent, beautiful, vertical
5. Paywall: "want 12 beats? narration? no watermark?"
6. $9/mo → one-click, Apple Pay / Stripe
7. Upsell to Studio when they hit 12-beat limit or want 1080p
```

### Why This Works
- **Zero friction trial:** No account required. Just a text box.
- **The output IS the aha moment:** The free reel is genuinely good. The watermark is the only obstacle between "wow" and "paid." No "aha moment gap."
- **Natural upgrade triggers:** "Your reel is limited to 4 beats. Add more →" appears inline after the session is generated — at the exact moment of maximum engagement.
- **Resume value:** Saved sessions (even on free tier) create return visits. "Your reel from Tuesday is waiting" email.
- **Social proof built-in:** Downloaded reels have a tiny "made with Ω-REEL" bottom-bar on watermarked exports. This is free distribution.

### Upsell Triggers
| User action | Trigger |
|---|---|
| Tries to add 5th beat | "Upgrade to Solo for 12 beats" |
| Tries to add narration | "Upgrade to Solo for narration" |
| Tries to download | "Upgrade to remove watermark" |
| Tries sonata mode | "Upgrade to Studio" |
| Tries 24 beats | "Upgrade to Studio" |
| Generates 3rd reel | "Upgrade to save up to 50 reels" |
| Tries to share | "Upgrade to Studio for shareable links" |

### Metrics to Track
- **Trial completion rate:** Theme entered → first reel generated (target: >60%)
- **Beat-wall hit rate:** Free users who hit the 4-beat limit (conversion signal)
- **Time-to-paywall:** Average time from first reel to first upgrade prompt (target: <5 min)
- **Trial → Solo conversion:** (target: 8–12% of trials who hit a paywall)
- **Solo → Studio expansion:** (target: 20–30% of Solo users within 60 days)
- **Reel share rate:** Downloads per session (organic distribution)

---

## 10. Infrastructure Requirements (Standalone Deployment)

### Compute
- **API Server:** Node.js 24, Express 5 — 1 vCPU / 2 GB RAM minimum. Veo calls are non-blocking (async job store). ffmpeg stitch is CPU-intensive: 2 vCPU recommended for concurrent stitches.
- **ffmpeg:** Must be in PATH or `FFMPEG_PATH` env var. Resolved at startup via `which ffmpeg` → Nix store scan → system paths.

### External Services
| Service | Usage | Key |
|---|---|---|
| Google Gemini / Veo 3.0 | Video generation | `GEMINI_API_KEY` |
| OpenRouter | LLM (outline, repair, imagine) | `USER_OPENROUTER_API_KEY` |
| OpenAI | TTS narration, vision | `OPENAI_API_KEY` |
| Anthropic (optional) | LLM fallback | `ANTHROPIC_API_KEY` |
| Moonshot/Kimi (optional) | LLM fallback | `KIMI_API` |

### Storage
- **Clip cache:** Temp directory (`CLIP_CACHE_DIR`), ephemeral. GC'd every 5 min.
- **Session persistence:** Browser IndexedDB — no server-side session storage required.
- **Paid tier:** Cloud storage (S3/GCS) for session export, shareable links, team access.

### Billing
- Stripe Checkout for subscription management
- Usage metering on Veo calls (most expensive) — each clip = ~$0.05–0.20 depending on duration
- Free tier budget: 4 clips × 5s × $0.05 = ~$0.20 per trial reel (acceptable for conversion rate)

---

## 11. The Moat

What cannot be replicated by a competitor in 6 months:

1. **The Gram matrix coherence system.** It requires understanding of Hall regularization, Riemann zeta zero anchoring, and the 24-spoke icositetragon. The math is in `narrative-coherence.ts` and took significant iteration to tune. It is not documented anywhere else.

2. **The 2-pass Architecture HV → Beat Composer HV pipeline.** Separating structure from content generation is an insight, not a feature. It prevents the "prompt drift" problem where an LLM writing 12 beats in one shot subtly converges on the same scene by beat 8.

3. **Terminal frame seeding.** Each clip's last frame feeds the next clip's generation prompt (via `prevFrame`). This creates genuine visual continuity — not post-hoc assembly — by anchoring Veo's diffusion prior to the actual pixels of the previous clip's ending state.

4. **The bridge auto-pipeline with resume.** Repair → clips → stitch with cancel/resume checkpoint is a production-grade orchestration system, not a demo. It handles the reality that Veo calls fail at ~10–15% rate and stitch must tolerate partial clip sets.

5. **B(t) edit rhythm.** The xfade duration being driven by the realized Ψ score means the editing rhythm is *emergent from the content quality*, not imposed. This is a fundamentally different philosophy from "fixed 0.5s crossfade everywhere."

---

*Document generated from source: `artifacts/api-server/src/routes/reel.ts` (1,767 lines), `artifacts/omega-gram/src/components/reel-panel.tsx` (1,642 lines), `artifacts/omega-gram/src/hooks/use-reel.ts` (1,017 lines), `artifacts/omega-gram/src/lib/reel-store.ts`, `artifacts/omega-gram/src/lib/reel-cover.ts`, `artifacts/api-server/src/lib/narrative-coherence.ts`.*
