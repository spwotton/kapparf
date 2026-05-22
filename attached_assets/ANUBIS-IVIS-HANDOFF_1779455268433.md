# ANUBIS — Interactive Video Intelligence System (IVIS)
## Speculative Architecture & Feature Handoff Document
**Version:** 0.1-DRAFT  
**Origin artifact:** `Ψ-TERMINAL ASCENT` (psi-ascent) + `Ω-REEL` (omega-gram)  
**Classification:** Extrapolative Engineering Spec — Near-term proven, long-term speculative  

---

## 0. What This Document Is

This is a forward-looking engineering handoff that starts from **what we have already proven works** (programmatic cinematic video in React/Three.js), extrapolates through a series of concretely implementable phases, and arrives at a speculative but technically grounded vision: **a system where answers to questions materialize in real time as cinematic video, driven by a Liquid Neuron Network renderer.**

Every section is marked with a feasibility tag:
- `[NOW]` — Already built or trivially buildable this week
- `[NEAR]` — 1–6 weeks, clear implementation path
- `[MID]` — 2–4 months, requires new primitives
- `[FAR]` — 6–18 months, requires ML infrastructure
- `[SPECULATIVE]` — Moonshot, described for architectural coherence

---

## 1. Origin Proof: What Ψ-TERMINAL ASCENT Demonstrates

The psi-ascent artifact proves a core thesis: **cinematic video can be authored entirely in JavaScript**, rendered in-browser, driven by data, and made interactive without any video file format.

### 1.1 What was built

```
7 → 10 scenes | 110s → 91s runtime | 9:16 portrait format
React + Framer Motion + Three.js/R3F + Tailwind
Scene components: particle field, 3D geometry, impact, matrix rain,
                  fibonacci spiral, black hole accretion, quantum wave
Scene router: useVideoPlayer hook → scene key → component
Control layer: scene jumping, loop lock, progress segments
```

### 1.2 The key architectural insight

A "video" in this system is just a **React component tree gated by time**. This means:
- Scenes are **swappable at runtime** — not compiled frames
- Content (headlines, equations, colors) is **data, not pixels**
- The renderer is the **browser GPU** — zero encoding, zero storage
- The scene grammar is **extensible** — new scene kinds = new components

### 1.3 What this unlocks for Anubis

The same renderer that plays a pre-authored 91s cinematic can be made to:
1. Accept a `VideoManifest` JSON and render it on the fly
2. Stream scene configs from an AI and render them as they arrive
3. Respond to user input mid-render (interactive hotspots)
4. Dynamically extend the timeline based on follow-up questions

This is the foundation. Everything below builds on it.

---

## 2. The Vision: Answer-as-Video `[MID → FAR]`

### 2.1 The Experience

User types into Anubis:

> *"How does a black hole form from a dying star?"*

As they type, the system begins generating. By the time they hit enter:
- A 9:16 canvas is already rendering a stellar nebula particle field
- The scene sequence populates left-to-right: stellar nursery → red giant → supernova → collapse → accretion disk → event horizon
- Each scene's headline, stat, and color palette are AI-generated and match the question
- The user can **pause, rewind, click into a scene** to ask a follow-up — which immediately appends new scenes to the end of the timeline

This is not a video player. It is a **generative cinematic reasoning engine**.

### 2.2 Why This Is Technically Coherent (Not Magic)

The rendering cost is negligible — it's CSS/WebGL, not video decoding. The latency bottleneck is entirely AI inference, and we can pipeline it: **start rendering scene 1 while generating scenes 2–N**. The "video" is just a queue of `SceneBlueprint` objects consumed by the existing renderer.

The speculative part is not rendering — it's getting the AI to generate high-quality `SceneBlueprint` JSON reliably. That is a **fine-tuning / structured output** problem, solvable with the right prompt engineering and schema validation.

---

## 3. VideoManifest System — The Core Abstraction `[NOW]`

### 3.1 Schema

```typescript
// The atomic unit — one cinematic moment
interface SceneBlueprint {
  key: string;              // unique within manifest
  kind: SceneKind;          // maps to a renderer component
  duration: number;         // ms
  headline: string;         // primary text overlay
  subline?: string;         // secondary text
  stat?: string;            // formula, number, equation
  palette?: {
    primary?: string;       // CSS hex — glow/accent color
    secondary?: string;     // CSS hex — secondary accent
    bg?: string;            // CSS hex — scene background
  };
  config?: Record<string, unknown>; // kind-specific params
  interactive?: InteractiveHotspot[];
}

// Available scene kind renderers
type SceneKind =
  | 'title'             // Intro card — logo, headline, particle burst
  | 'particle-field'    // N-body particle system (configurable density/color)
  | 'geometry-3d'       // Three.js geometry (sphere, torus, dodecahedron, etc.)
  | 'impact'            // High-energy clash — shockwave, chromatic aberration
  | 'matrix-rain'       // Digital rain + equation overlay
  | 'spiral'            // Golden/logarithmic/Archimedean spiral
  | 'orbital'           // Orbital mechanics — accretion, gravitational lensing
  | 'wave-function'     // Interference pattern, Schrödinger, probability density
  | 'terrain'           // Procedural landscape / displacement mesh
  | 'network-graph'     // Force-directed node graph (synapses, relationships)
  | 'timeline'          // Historical timeline with animated markers
  | 'data-pulse'        // Animated data visualization (bar, line, area)
  | 'outro';            // End card — branding + CTA

// The full video — a self-contained specification
interface VideoManifest {
  id: string;
  title: string;
  subtitle: string;
  category: VideoCategory;
  palette: { primary: string; secondary: string; bg: string };
  scenes: SceneBlueprint[];
  meta?: {
    prompt?: string;        // The question that generated this
    model?: string;         // AI model used
    generatedAt?: string;   // ISO timestamp
    iterationCount?: number;
  };
}

type VideoCategory =
  | 'sacred-geometry' | 'cosmos' | 'biology'
  | 'philosophy' | 'technology' | 'history'
  | 'mathematics' | 'chemistry' | 'linguistics'
  | 'economics' | 'custom';

interface InteractiveHotspot {
  id: string;
  trigger: 'click' | 'hover' | 'viewport';
  region: { x: number; y: number; w: number; h: number }; // 0–1 normalized
  action: 'pause' | 'branch' | 'expand' | 'link';
  payload?: string; // follow-up prompt, URL, etc.
}
```

### 3.2 The Scene Registry

The scene registry is a `Map<SceneKind, React.ComponentType<SceneProps>>`. Adding a new visual capability is just adding a new entry. The manifest is the API surface; the component library is the implementation.

```typescript
// artifacts/omega-gram/src/lib/scene-registry.ts
import { GenericTitle } from '@/components/scenes/GenericTitle';
import { GenericParticleField } from '@/components/scenes/GenericParticleField';
import { GenericGeometry3D } from '@/components/scenes/GenericGeometry3D';
// ... etc.

export const SCENE_REGISTRY: Map<SceneKind, React.ComponentType<SceneBlueprint>> = new Map([
  ['title', GenericTitle],
  ['particle-field', GenericParticleField],
  ['geometry-3d', GenericGeometry3D],
  ['matrix-rain', GenericMatrixRain],
  ['spiral', GenericSpiral],
  ['orbital', GenericOrbital],
  ['wave-function', GenericWaveFunction],
  ['network-graph', GenericNetworkGraph],
  ['outro', GenericOutro],
]);
```

The existing `psi-ascent` scenes are **specialized, high-fidelity instances** of these generic kinds. The Forge/player uses generic renderers; psi-ascent is a hand-crafted showpiece.

---

## 4. The Forge — Video Factory UI `[NOW → NEAR]`

### 4.1 What It Is

A page in Anubis where a user:
1. Selects a category or pastes a prompt
2. Reviews the AI-generated (or manually composed) manifest
3. Customizes palette, scene order, durations
4. Hits "Render" → sees the video play back immediately
5. Iterates — adds scenes, changes content, re-renders

### 4.2 Forge Page Architecture

```
/forge
  ├── CategoryPicker          — grid of VideoCategory cards with accent colors
  ├── ManifestEditor          — ordered list of SceneBlueprint rows
  │     ├── SceneRow          — kind picker, duration slider, headline/stat inputs
  │     └── DurationBar       — visual timeline showing relative scene lengths
  ├── PaletteEditor           — primary/secondary/bg color pickers + preview swatch
  ├── PreviewPane             — embedded ManifestPlayer iframe (live re-renders)
  └── ActionBar               — Save · Export JSON · Share · Publish
```

### 4.3 ManifestPlayer Component

```typescript
// artifacts/omega-gram/src/components/ManifestPlayer.tsx
// Renders any VideoManifest using the scene registry + useVideoPlayer hook

interface ManifestPlayerProps {
  manifest: VideoManifest;
  interactive?: boolean;
  onSceneClick?: (scene: SceneBlueprint, hotspot?: InteractiveHotspot) => void;
}
```

The player is the same `useVideoPlayer` hook already built in psi-ascent, but instead of hardcoded scene components it looks up the registry.

---

## 5. Generative Pipeline — AI → Manifest → Video `[NEAR → MID]`

### 5.1 The Prompt → Manifest Flow

```
User Input (question/topic)
         │
         ▼
  ┌─────────────────────────────────────┐
  │  ManifestGeneratorService           │
  │  POST /api/manifest/generate        │
  │                                     │
  │  1. System prompt: scene grammar    │
  │     + category palette library      │
  │     + SceneBlueprint JSON schema    │
  │                                     │
  │  2. Gemini 2.5 Flash (structured    │
  │     output / JSON mode)             │
  │                                     │
  │  3. Schema validation (Zod)         │
  │  4. Duration normalization          │
  │  5. Palette coherence check         │
  └─────────────────────────────────────┘
         │
         ▼ SSE stream: scene by scene
  ┌──────────────────────┐
  │  ManifestPlayer      │  ← begins rendering scene 1
  │  scene queue: []     │    while scenes 2–N still
  │  streaming: true     │    generating
  └──────────────────────┘
```

### 5.2 Scene-by-Scene Streaming

The key UX insight: don't wait for the full manifest. Stream `SceneBlueprint` objects one at a time via SSE. The player starts rendering scene 1 the moment it arrives. By the time scene 1 finishes playing (7–10s), scenes 2–4 have generated. The experience feels instantaneous.

```typescript
// API route: POST /api/manifest/generate → SSE
// Event types:
// { type: 'manifest_start', id: string, category, palette }
// { type: 'scene', blueprint: SceneBlueprint }
// { type: 'manifest_complete', totalScenes: number, totalDuration: number }
// { type: 'error', message: string }
```

### 5.3 System Prompt Engineering for Scene Generation

The quality of the manifest depends on the system prompt. Critical elements:
- **Scene grammar** — exhaustive description of each `SceneKind` and when to use it
- **Narrative arc patterns** — tension → release → revelation → synthesis
- **Palette psychology** — color choices that match emotional tone of the topic
- **Pacing rules** — title ≤ 8s, feature scenes 9–14s, outro ≤ 8s, total 60–120s
- **Anti-patterns** — avoid repeating the same kind consecutively, no more than 2 geometry-3d in a row
- **Stat formatting** — equations in Unicode math notation, numbers with SI prefixes

### 5.4 Structured Output Schema (Zod)

```typescript
const sceneBlueprintSchema = z.object({
  key: z.string().min(2).max(32).regex(/^[a-z0-9-]+$/),
  kind: z.enum(['title','particle-field','geometry-3d','impact',
                'matrix-rain','spiral','orbital','wave-function',
                'network-graph','timeline','data-pulse','outro']),
  duration: z.number().int().min(5000).max(20000),
  headline: z.string().max(40),
  subline: z.string().max(80).optional(),
  stat: z.string().max(30).optional(),
  palette: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    bg: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
});

const videoManifestSchema = z.object({
  title: z.string().max(60),
  subtitle: z.string().max(100),
  category: z.enum([...CATEGORIES]),
  palette: paletteSchema,
  scenes: z.array(sceneBlueprintSchema).min(3).max(16),
});
```

---

## 6. Liquid Neuron Network (LNN) Rendering Engine `[MID → SPECULATIVE]`

### 6.1 The Concept

The LNN is the most speculative piece — but it has a clear implementation trajectory. The idea: instead of discrete scene components (Scene1, Scene2...), the video surface is a **continuous fluid canvas** where neural-network-like nodes and edges form, morph, and dissolve to represent information.

Think of it as the **visual language of thought**: a question enters the system, and the canvas reacts like a living organism — neurons fire, connections form, patterns crystallize into knowledge structures, then dissolve into the next idea.

### 6.2 The Three Layers

```
Layer 3: Semantic Overlay        ← Text, equations, labels
Layer 2: Topology Layer          ← Node graph, edge weights, clusters  
Layer 1: Liquid Field            ← Particle fluid, react-three-fiber
```

**Layer 1 — Liquid Field** `[NEAR]`

A particle system (WGSL compute shader or CPU fallback) where 2,000–8,000 particles flow according to:
- A base vector field (curl noise, Perlin flow)
- Attractor points that correspond to **semantic concepts**
- Repulsor points that create visual separation between ideas
- Color gradients that encode semantic category (biology = green, cosmos = cyan, etc.)

This layer is always running. It is the "resting brain state" of Anubis.

```glsl
// WGSL compute pass — particle update
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if i >= uniforms.count { return; }
  
  let pos = positions[i];
  let vel = velocities[i];
  
  // Curl noise vector field
  let n = curl_noise(pos.xy * uniforms.scale + uniforms.time * 0.1);
  
  // Semantic attractor pull
  var attract = vec2f(0.0);
  for (var j = 0u; j < uniforms.attractorCount; j++) {
    let a = attractors[j];
    let d = distance(pos.xy, a.position);
    let strength = a.weight * exp(-d * d * 0.5);
    attract += normalize(a.position - pos.xy) * strength;
  }
  
  let new_vel = vel * uniforms.damping + (n + attract) * uniforms.dt;
  velocities[i] = new_vel;
  positions[i] = pos + vec4f(new_vel, 0.0, 0.0);
}
```

**Layer 2 — Topology Layer** `[MID]`

A force-directed graph rendered in WebGL (or SVG for simpler cases) where:
- **Nodes** = concepts extracted from the AI response
- **Edges** = semantic relationships (is-a, causes, contains, contradicts)
- **Node size** = importance weight from AI
- **Edge thickness** = relationship strength
- **Pulse animations** = information flow direction

The graph is generated from the AI response alongside the manifest. It renders as a semi-transparent overlay on the liquid field. As scenes advance, different node clusters light up.

```typescript
interface SemanticGraph {
  nodes: Array<{
    id: string;
    label: string;
    category: string;
    weight: number;       // 0–1, affects size
    position?: [number, number]; // normalized, auto-placed if absent
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'causes' | 'contains' | 'opposes' | 'defines' | 'enables';
    strength: number;     // 0–1, affects thickness
  }>;
  activeNodeIds?: string[]; // which nodes are highlighted in current scene
}
```

**Layer 3 — Semantic Overlay** `[NOW]`

This is what already exists: Framer Motion text overlays, stat badges, equation rendering. In the LNN system, these become anchored to graph nodes rather than positioned absolutely in scene components.

### 6.3 Liquid Neuron Transitions

Instead of scene cuts, the LNN system has **state transitions**:
- New attractors are added at the positions of the next scene's key concepts
- The particle field flows toward them over 1.5–2.5s
- Text fades in as the particle density reaches a threshold at attractor positions
- The previous scene's attractors gradually lose weight and dissolve

This creates a seamless, continuous visual that feels like watching a mind think.

### 6.4 Implementation Trajectory

```
Phase A [NEAR]:   
  WebGL particle system (react-three-fiber) with CPU-side 
  attractor updates. 500 particles, 3 attractors max.
  Smooth but basic.

Phase B [MID]:
  WGSL compute shader for 4,000 particles.
  Force-directed graph overlay with d3-force.
  Scene-driven attractor configs.

Phase C [MID-FAR]:  
  Full semantic graph from AI.
  Particle field reacts to graph topology in real time.
  Color mapping to semantic category.
  8,000+ particles at 60fps (M1+ / RTX20+).

Phase D [FAR]:
  WebGPU ML inference runs attractor prediction locally.
  Particle field "predicts" next concept before AI confirms it.
  Perceived zero-latency response.

Phase E [SPECULATIVE]:  
  Trained latent space: concept vectors map directly to
  particle field configurations. The visual IS the embedding.
```

---

## 7. Real-Time Q&A Visualization `[MID]`

### 7.1 The Interaction Model

```
┌──────────────────────────────────────────────┐
│  Anubis                              [9:16]  │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │     [LNN Canvas — always running]      │  │
│  │     particles drift, neurons idle      │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Ask anything...              [Send]   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Keystroke → Prediction `[FAR]`**: As the user types, the system sends partial queries to a lightweight embedding model. Top-3 predicted categories are returned, and the LNN particle field shifts its global hue toward the predicted category's color. By the time the user hits send, the visual is already primed.

**Send → Stream → Render `[MID]`**: 
1. Full query sent to Gemini with structured output schema
2. SSE stream returns: `manifest_start` → palette applied immediately
3. First `scene` blueprint arrives (< 500ms) → rendering begins
4. Subsequent blueprints arrive as the first scene plays
5. User sees a fully coherent, themed video for their specific question

**Interactive Branching `[MID]`**:
- Pause on any scene → click-to-ask overlay appears
- User types follow-up → new scenes appended to timeline
- The video never ends; it extends as long as curiosity does
- The semantic graph updates in Layer 2 with new nodes

### 7.2 The Timeline Model

```typescript
interface LiveTimeline {
  committed: SceneBlueprint[];   // already played / confirmed
  pending: SceneBlueprint[];     // generated, not yet playing
  generating: boolean;           // true if AI still producing
  cursor: number;                // current position (ms)
  branches: Array<{
    atSceneKey: string;
    question: string;
    manifest: VideoManifest;
  }>;
}
```

The timeline is append-only. Users can scrub back into committed scenes, pause on pending scenes, and branch from any point. Each branch is a new manifest rooted at the branch point.

---

## 8. Anubis App Architecture `[NOW → MID]`

### 8.1 New Routes to Add

```typescript
// In Anubis App.tsx Router:
<Route path="/forge"           component={ForgePage} />
<Route path="/forge/:id"       component={ForgeEditorPage} />
<Route path="/player/:id"      component={PlayerPage} />
<Route path="/ask"             component={AskPage} />           // real-time Q&A
<Route path="/library"         component={LibraryPage} />       // saved manifests
```

### 8.2 New API Endpoints Needed

```
POST   /api/manifest/generate           # prompt → SSE stream of SceneBlueprints
GET    /api/manifest/:id                # retrieve saved manifest
POST   /api/manifest                    # save manifest
PUT    /api/manifest/:id                # update manifest
DELETE /api/manifest/:id                # delete manifest

POST   /api/manifest/:id/branch         # create branch from scene key
POST   /api/manifest/from-template      # clone preset + apply customizations

POST   /api/semantic/graph              # extract concept graph from AI response
GET    /api/semantic/categories         # list category palettes
```

### 8.3 New Database Tables

```sql
-- Saved manifests
CREATE TABLE manifests (
  id          TEXT PRIMARY KEY,  -- nanoid
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  palette     JSONB NOT NULL,
  scenes      JSONB NOT NULL,    -- SceneBlueprint[]
  meta        JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Manifest branches (fork tree)
CREATE TABLE manifest_branches (
  id              TEXT PRIMARY KEY,
  parent_id       TEXT REFERENCES manifests(id),
  branch_at_key   TEXT NOT NULL,    -- scene key where branch originates
  question        TEXT,
  manifest_id     TEXT REFERENCES manifests(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic graphs linked to manifests
CREATE TABLE semantic_graphs (
  manifest_id  TEXT PRIMARY KEY REFERENCES manifests(id),
  nodes        JSONB NOT NULL,
  edges        JSONB NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.4 New Shared Library: `lib/video-manifest`

```
lib/video-manifest/
  src/
    types.ts          # SceneBlueprint, VideoManifest, SemanticGraph, etc.
    schema.ts         # Zod validation schemas
    presets.ts        # Built-in preset manifests (psi-ascent, cosmos-drift, bio-ascension)
    palette.ts        # Category → palette mapping
    duration.ts       # Duration calculation utilities
    index.ts          # barrel
  package.json
```

### 8.5 New Shared Library: `lib/lnn-renderer` `[MID]`

```
lib/lnn-renderer/
  src/
    LNNCanvas.tsx           # Top-level React component — the always-on canvas
    ParticleSystem.tsx      # R3F particle system with WGSL/CPU fallback
    AttractorManager.ts     # Manages attractor positions/weights per scene
    TopologyGraph.tsx       # Force-directed semantic graph overlay
    SemanticOverlay.tsx     # Framer Motion text layer anchored to graph nodes
    shaders/
      particles.wgsl        # WebGPU compute pass (with WebGL fallback)
      render.wgsl           # Render pass
    hooks/
      useLNNState.ts        # Global LNN state (attractors, particle config)
      useSemanticGraph.ts   # Manages graph updates on scene change
    index.ts
  package.json
```

---

## 9. Component Design Patterns

### 9.1 Generic Scene Component Interface

```typescript
// All generic scene components follow this interface
interface SceneProps extends SceneBlueprint {
  // From SceneBlueprint: key, kind, duration, headline, subline, stat, palette, config
  
  // Runtime injection
  isActive: boolean;
  elapsed: number;         // ms since scene start
  progress: number;        // 0–1
  onHotspotTrigger?: (hotspot: InteractiveHotspot) => void;
}
```

### 9.2 Scene Component Template

```typescript
// Template every new scene component should follow
export function GenericSomething({ headline, subline, stat, palette, config, elapsed }: SceneProps) {
  // 1. Phase system — drive internal states from elapsed
  const phase = elapsed < 800 ? 0 : elapsed < 2000 ? 1 : elapsed < 4000 ? 2 : 3;
  
  // 2. Use palette for all colors — never hardcode
  const { primary = '#FF3366', secondary = '#00FFCC', bg = '#050005' } = palette ?? {};
  
  // 3. CSS custom properties injection — propagate to children
  const style = {
    '--scene-primary': primary,
    '--scene-secondary': secondary,
    '--scene-bg': bg,
    background: bg,
  } as React.CSSProperties;
  
  // 4. Standard enter/exit animations
  return (
    <motion.div
      className="absolute inset-0 z-30 overflow-hidden flex flex-col items-center justify-center"
      style={style}
      {...sceneTransitions.fadeBlur}  // from lib/video/animations
    >
      {/* content */}
    </motion.div>
  );
}
```

### 9.3 The Attractor Config Pattern (LNN integration)

Every `SceneBlueprint` will eventually include `attractors` — positions and weights for the LNN particle system. This is backward compatible (missing = auto-generated from headline embeddings):

```typescript
interface SceneBlueprint {
  // ... existing fields ...
  attractors?: Array<{
    concept: string;          // label
    position: [number, number]; // 0–1 normalized canvas position
    weight: number;           // 0–1 pull strength
    radius: number;           // influence radius
    color?: string;           // override particle color in this zone
  }>;
}
```

---

## 10. Category Palette Library

Each `VideoCategory` gets a canonical palette that is psychologically and aesthetically coherent:

```typescript
export const CATEGORY_PALETTES: Record<VideoCategory, Palette> = {
  'sacred-geometry': { primary: '#FF3366', secondary: '#00FFCC', bg: '#050002', name: 'Crimson Oracle' },
  'cosmos':          { primary: '#00FFCC', secondary: '#0055FF', bg: '#000005', name: 'Deep Field' },
  'biology':         { primary: '#39FF14', secondary: '#FF6B00', bg: '#000a00', name: 'Chlorophyll' },
  'philosophy':      { primary: '#B8A0FF', secondary: '#FF88AA', bg: '#08000f', name: 'Violet Mind' },
  'technology':      { primary: '#00B4FF', secondary: '#FF3366', bg: '#000810', name: 'Cyan Voltage' },
  'history':         { primary: '#FFB800', secondary: '#FF3366', bg: '#0a0500', name: 'Amber Archive' },
  'mathematics':     { primary: '#FFFFFF', secondary: '#00FFCC', bg: '#000000', name: 'Zero Point' },
  'chemistry':       { primary: '#FF6B35', secondary: '#00FFB3', bg: '#050300', name: 'Valence' },
  'linguistics':     { primary: '#FF88FF', secondary: '#FFFF00', bg: '#050005', name: 'Glossolalia' },
  'economics':       { primary: '#00FF88', secondary: '#FF3366', bg: '#000805', name: 'Market Green' },
  'custom':          { primary: '#FFFFFF', secondary: '#888888', bg: '#111111', name: 'Custom' },
};
```

---

## 11. Phased Implementation Roadmap

### Phase 1 — Video Factory `[NOW: 1–2 days]`

**Deliverable:** The Forge page in Anubis where a user selects a category and creates/edits a `VideoManifest` manually, then renders it in a ManifestPlayer.

- [ ] `lib/video-manifest/` package (types, schema, presets, palette)
- [ ] `GenericTitle`, `GenericParticleField`, `GenericSpiral`, `GenericOrbital`, `GenericWaveFunction`, `GenericOutro` scene components
- [ ] `ManifestPlayer` component (uses scene registry + useVideoPlayer)
- [ ] `/forge` page in Anubis
- [ ] `/player/:id` route

**Success metric:** 3 preset manifests (Ψ-TERMINAL, Cosmos Drift, Bio Ascension) render correctly through the generic ManifestPlayer.

### Phase 2 — AI Manifest Generation `[NEAR: 1–2 weeks]`

**Deliverable:** User types a question, AI generates a VideoManifest, ManifestPlayer renders it.

- [ ] `POST /api/manifest/generate` — Gemini structured output → SceneBlueprint SSE stream
- [ ] Zod validation + palette coherence normalization
- [ ] Scene-by-scene streaming to frontend
- [ ] ManifestPlayer streaming mode (renders as blueprints arrive)
- [ ] `/ask` page with textarea + live player
- [ ] `manifests` DB table + save/load

**Success metric:** "How does photosynthesis work?" generates a coherent 6-scene bio manifest and renders it in < 3s perceived latency.

### Phase 3 — Interactive Branching `[NEAR-MID: 2–4 weeks]`

**Deliverable:** User can click any scene during playback to ask a follow-up, which appends new scenes.

- [ ] `InteractiveHotspot` system in ManifestPlayer
- [ ] Timeline model with `committed` / `pending` / `generating` states
- [ ] Branch API and `manifest_branches` table
- [ ] Visual branch indicator (scene segments that show "branched from here")
- [ ] Library page with manifest history + branch tree visualization

**Success metric:** Starting from a cosmos manifest, user branches 3 times, each branch generating a coherent extension of the narrative.

### Phase 4 — Liquid Neuron Field `[MID: 4–8 weeks]`

**Deliverable:** The LNN particle system as the video background. Attractors are driven by scene blueprints.

- [ ] `lib/lnn-renderer/` package
- [ ] `LNNCanvas` component (R3F + CPU particle system, 1,000 particles)
- [ ] `AttractorManager` — scene-driven attractor lifecycle
- [ ] `TopologyGraph` — d3-force graph overlay from semantic graph
- [ ] `POST /api/semantic/graph` — extract concept graph from AI
- [ ] LNN integrated as background layer in ManifestPlayer

**Success metric:** Playing any manifest, particles visibly flow toward scene-relevant positions. Scene transitions feel continuous rather than cut-based.

### Phase 5 — Real-Time LNN Response `[FAR: 2–4 months]`

**Deliverable:** Particle field reacts during query typing (predicted category hue shift). First visual frame appears before AI responds.

- [ ] Client-side embedding model (transformers.js) for keystroke prediction
- [ ] Predicted category → particle field hue shift (< 100ms)
- [ ] WGSL compute shader for 4,000+ particles
- [ ] Semantic graph updates propagated to LNN in real time during streaming

**Success metric:** Measurable reduction in "blank canvas time" before video starts. Target: 0ms perceived delay from keystroke to visual response.

### Phase 6 — Trained Visual Encoder `[SPECULATIVE: 6–18 months]`

**Deliverable:** A small model maps semantic content directly to attractor configs. The visual language is learned, not rule-based.

- [ ] Dataset: N thousand `(SceneBlueprint, attractor_config)` pairs
- [ ] Fine-tune embedding model to predict attractor layout from text
- [ ] Replace rule-based AttractorManager with inference
- [ ] Real-time on-device inference via ONNX / WebGPU ML

**Success metric:** The particle field accurately anticipates scene content, making transitions feel predictive rather than reactive.

---

## 12. Open Questions & Risks

### Technical

| Question | Risk Level | Notes |
|----------|-----------|-------|
| WebGPU browser support | Medium | Chrome/Edge ok, Safari 2024+, Firefox partial. Ship WebGL fallback. |
| Structured output reliability from Gemini | High | JSON schema adherence degrades with complex schemas. Mitigation: Zod + retry + graceful fallback to simpler schema. |
| 60fps particle system on mobile | Medium | Cap at 500 particles on mobile UA detection. CSS fallback mode. |
| SSE streaming across proxy/CDN | Low | Already proven in Gemini chat route. Add reconnect logic. |
| Manifest storage costs at scale | Low | JSONB manifests are tiny (~5–20KB each). 1M manifests = ~10GB. Fine. |

### Product

| Question | Notes |
|----------|-------|
| How long should generated videos be? | Research shows 60–90s is optimal for attention. Make it configurable; default to 75s. |
| Should manifests be shareable? | Yes. Short URL → manifest ID → player page. No auth required for viewing. |
| Watermarking AI-generated video? | Visual watermark in outro scene. Optional, toggle per plan tier. |
| Export to actual video file? | MediaRecorder API can capture canvas. Resolution-limited but works. Phase 2 bonus. |

### Design

| Question | Notes |
|----------|-------|
| What does "idle" LNN look like? | Slow, low-energy curl noise. Barely perceptible movement. Should feel like breathing. |
| How do we communicate "generating"? | Particle field accelerates + brightens. Loading is a visual state, not a spinner. |
| Scene count UX | 10+ scenes feels exhausting without branching. Default 5–7 for generated, unlimited for branching. |

---

## 13. Quick Reference — Key Files to Know

### psi-ascent (reference implementation)
```
src/components/video/VideoTemplate.tsx     # Scene registry + SCENE_DURATIONS
src/components/video/VideoWithControls.tsx # Control bar + jump/lock
src/components/video/useSceneControls.ts   # Scene state machine
src/components/video/video_scenes/         # 10 scene components (S1–S10 + S7 outro)
src/lib/video/hooks.ts                     # useVideoPlayer — core timing engine
src/lib/video/animations.ts               # Springs, easings, scene transitions, element anims
```

### omega-gram (Anubis home)
```
src/App.tsx                  # Router — add /forge /player /ask /library here
src/pages/home.tsx           # Home — add Forge + Ask buttons here
src/pages/studio.tsx         # Gemini Studio — chat/image/text tabs
src/lib/reel-store.tsx       # Global state
```

### api-server
```
src/routes/index.ts          # Mount new manifest/semantic routers here
src/routes/gemini.ts         # SSE streaming pattern to follow for manifest generation
```

### shared libs
```
lib/db/src/schema/           # Add manifests, manifest_branches, semantic_graphs tables
lib/integrations-gemini-ai/  # ai client — use for manifest generation
```

---

## 14. The Big Idea, Simply Put

Right now we have a **pre-authored 91-second cinematic** that proves the renderer works.

The near-term goal is to make that same renderer accept **AI-generated instructions** in real time, so every question gets its own cinematic.

The mid-term goal is to make the **canvas itself alive** — a liquid field of particles that thinks with the user, not just plays for them.

The long-term speculation is that the **visual and the knowledge become the same thing**: the particle configuration at any moment *is* the semantic state of the conversation, and the user can literally see ideas connect, conflict, and crystallize.

That's the Anubis vision. Everything above is the implementation path.

---

*Document status: v0.1-DRAFT — intended for engineering handoff, architecture review, and roadmap planning. All `[SPECULATIVE]` sections are intentionally aspirational; technical feasibility has been assessed but not validated.*
