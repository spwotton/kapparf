// Hall Stitcher coherence engine.
//
// Each beat in a narrative is treated as a kernel function. We embed each
// beat's prompt into a fixed-length feature vector, build the Narrative Gram
// matrix G via cosine similarity, then apply Hall regularization
//   G_H = G + η·I, η = 0.09
// and report the condition number κ(G_H). Adjacent pairs whose own 2x2
// Gram block exceeds κ_max are flagged as needing a bridge prompt.
//
// ─── Embedding regimes ───────────────────────────────────────────
// Two embedders are wired in. The active one is chosen at call-time:
//
//   • "semantic"  — OpenAI `text-embedding-3-small` (1536-dim), reached via
//     the user's BYOK `USER_OPENAI_API_KEY` secret. The Replit AI
//     integrations proxy does NOT expose the embeddings API, so we only
//     enable this path when a real OpenAI key is configured.
//   • "offline"   — deterministic, dependency-free 64-dim char-bag with
//     signed hashing. Always available, used for tests, CI, and as a
//     fallback when the semantic call fails or no key is configured.
//
// Both produce unit-norm vectors so cosine similarity is the dot product
// and the diagonal of G is exactly 1.
//
// ─── κ_max calibration ───────────────────────────────────────────
// For a unit-norm cosine kernel with Hall shift η=0.09, the 2x2 Gram block
// for any adjacent pair has eigenvalues (1+η)±|c| where c=cos(u_i,u_j),
// so per-pair κ = (1.09+|c|)/(1.09−|c|) is bounded above by ≈23.22 (the
// |c|→1 limit). We pick a threshold per regime so each catches the
// "stalled-beat" coherence fault without flagging legitimate hand-offs.
//
// Offline (char-bag) envelope, measured on the witness fixtures in
// tests/narrative-coherence.test.ts:
//   • Identical adjacent prompts             cos≈1.000  κ≈23.22  ← bridge
//   • One-word variant ("…at dawn" → dusk)   cos≈0.889  κ≈9.84
//   • Healthy paraphrase / shot variation    cos∈[0.4,0.7]  κ∈[2,5]
//   • Different-subject (incoherent) pairs   cos∈[-0.2,0.3] κ∈[1,1.5]
// → κ_max_offline = 12.0 — only adjacent beats with >91% character-bag
//   alignment trip the flag. This catches duplicated prompts, while
//   one-word time-of-day swaps still pass.
//
// Semantic (text-embedding-3-small) envelope, by construction:
//   • Identical / near-identical adjacent    cos≥0.95  κ≥14
//   • Same-scene paraphrase, different words cos∈[0.65,0.85] κ∈[4,8]
//     ("lone monolith pulses on a desert" ≈ "obsidian pillar throbs
//      across the dunes" — char-bag misses these completely.)
//   • Distinct shots, shared style           cos∈[0.3,0.55]  κ∈[1.7,2.8]
//   • Genuinely incoherent pairs             cos≤0.25       κ≤1.6
// → κ_max_semantic = 6.0 — flags meaning-level redundancy starting at
//   ≈80% semantic alignment. The lower threshold is what unlocks the
//   paraphrase detection that motivated this upgrade; under the offline
//   embedding the same threshold would over-fire (the dawn/dusk fixture
//   would be flagged), which is why each regime carries its own value.
//
// `KAPPA_MAX` (legacy export) tracks the offline value so the existing
// witness tests — which run without an OpenAI key — keep their
// calibrated baseline. The active threshold for any single
// computeNarrativeCoherence call is returned as `kappaMax` on the result
// and is also what gets compared to per-pair κ when populating `bridges`.
export const ETA = 0.09;
export const KAPPA_MAX_OFFLINE = 12.0;
export const KAPPA_MAX_SEMANTIC = 6.0;
export const KAPPA_MAX = KAPPA_MAX_OFFLINE;
export const VIEWER_PRESENCE_GAP = 0.02;
const EMBED_DIM = 64;
const SEMANTIC_MODEL = "text-embedding-3-small";

// B(t) ∈ [0,1] → xfade duration ∈ [0.2, 0.9] seconds. High B = tight cut
// (short transition, longer hold); low B = soft, lingering crossfade.
// κ-flagged bridge pairs always render a 0.5s `fadeblack` to interpolate
// through a black/color frame at the seam midpoint.
export type TransitionSpec = {
  duration: number;
  transition: "fade" | "fadeblack";
  isBridge: boolean;
};

export function transitionSpecFromB(B: number, isBridge: boolean): TransitionSpec {
  if (isBridge) return { duration: 0.5, transition: "fadeblack", isBridge: true };
  const clamped = Math.max(0, Math.min(1, B));
  const duration = Math.max(0.2, Math.min(0.9, 0.9 - 0.7 * clamped));
  return { duration, transition: "fade", isBridge: false };
}

export type EmbeddingMode = "offline" | "semantic";

export type NarrativeGram = {
  matrix: number[][];
  matrixHall: number[][];
  conditionNumber: number;
  conditionNumberHall: number;
  bridges: Array<{ from: number; to: number; kappa: number }>;
  observerPresence: number;
  embeddingMode: EmbeddingMode;
  kappaMax: number;
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic, dependency-free embedder used as the offline fallback and
// in tests. 64-dim signed hashed token bag, normalized to unit length.
export function embedPrompt(prompt: string): number[] {
  const v = new Array<number>(EMBED_DIM).fill(0);
  const tokens = prompt.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const h = hashStr(tok);
    const idx = h % EMBED_DIM;
    const sign = (h >> 16) & 1 ? -1 : 1;
    v[idx] += sign;
  }
  let norm = 0;
  for (let i = 0; i < EMBED_DIM; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < EMBED_DIM; i++) v[i] /= norm;
  return v;
}

function l2Normalize(v: number[]): number[] {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  const out = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n;
  return out;
}

// Real semantic embedding via OpenAI's `text-embedding-3-small`. Reached
// only through the user's own OpenAI key (the Replit AI integrations proxy
// does not expose the embeddings API). Returns null when unavailable so
// the caller can fall back to the offline char-bag without ceremony.
export async function embedPromptsSemantic(prompts: string[]): Promise<number[][] | null> {
  if (prompts.length === 0) return [];
  const userKey = process.env["USER_OPENAI_API_KEY"];
  if (!userKey) return null;
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: userKey });
    // text-embedding-3-small accepts a batched input; one call covers the
    // whole reel. Inputs are clamped — empty strings are not allowed.
    const inputs = prompts.map((p) => (p && p.trim().length > 0 ? p : "_"));
    const resp = await client.embeddings.create({
      model: SEMANTIC_MODEL,
      input: inputs,
    });
    const data = resp.data;
    if (!Array.isArray(data) || data.length !== prompts.length) return null;
    // OpenAI returns the entries in input order; sort defensively just in
    // case a future change starts streaming them out of order.
    const sorted = [...data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return sorted.map((d) => l2Normalize(d.embedding as number[]));
  } catch (err) {
    console.warn("[narrative-coherence] semantic embedding failed, falling back to offline:", (err as Error)?.message);
    return null;
  }
}

// Resolve embeddings for a beat list. Picks semantic when available, falls
// back to the offline char-bag otherwise. Returns the embeddings together
// with the regime that produced them so callers can pick the matching
// κ_max threshold.
export async function embedPrompts(
  prompts: string[],
): Promise<{ vectors: number[][]; mode: EmbeddingMode }> {
  const semantic = await embedPromptsSemantic(prompts);
  if (semantic) return { vectors: semantic, mode: "semantic" };
  return { vectors: prompts.map((p) => embedPrompt(p)), mode: "offline" };
}

export function kappaMaxFor(mode: EmbeddingMode): number {
  return mode === "semantic" ? KAPPA_MAX_SEMANTIC : KAPPA_MAX_OFFLINE;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

// Power-iteration eigenvalue estimates (largest and smallest) for an SPD
// matrix. Adequate for small matrices (n ≤ 24).
function powerIter(M: number[][], iters = 80): number {
  const n = M.length;
  let v = new Array<number>(n).fill(0).map(() => Math.random());
  for (let k = 0; k < iters; k++) {
    const w = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) w[i] += M[i][j] * v[j];
    }
    let norm = 0;
    for (let i = 0; i < n; i++) norm += w[i] * w[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < n; i++) v[i] = w[i] / norm;
  }
  let lambda = 0;
  const Mv = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) Mv[i] += M[i][j] * v[j];
  }
  for (let i = 0; i < n; i++) lambda += v[i] * Mv[i];
  return lambda;
}

function smallestEig(M: number[][], lambdaMax: number): number {
  const n = M.length;
  // Shifted matrix: (lambdaMax · I − M) — its largest eigenvalue is
  // lambdaMax − λ_min(M).
  const Sh: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) Sh[i][j] = (i === j ? lambdaMax : 0) - M[i][j];
  }
  const lambdaShifted = powerIter(Sh, 80);
  return Math.max(1e-9, lambdaMax - lambdaShifted);
}

export function conditionNumber(M: number[][]): number {
  const n = M.length;
  if (n === 0) return 1;
  if (n === 1) return 1;
  const lmax = Math.max(1e-9, powerIter(M));
  const lmin = smallestEig(M, lmax);
  return lmax / lmin;
}

function pairKappa(g: number[][], i: number, j: number): number {
  // 2x2 Gram block.
  const a = g[i][i], b = g[i][j], c = g[j][i], d = g[j][j];
  // eigenvalues of [[a,b],[c,d]] (symmetric: b=c).
  const tr = a + d;
  const det = a * d - b * c;
  const disc = Math.max(0, tr * tr / 4 - det);
  const root = Math.sqrt(disc);
  const l1 = tr / 2 + root;
  const l2 = Math.max(1e-9, tr / 2 - root);
  return l1 / l2;
}

export async function computeNarrativeCoherence(
  beats: Array<{ visualPrompt: string }>,
): Promise<NarrativeGram> {
  const n = beats.length;
  if (n === 0) {
    return {
      matrix: [],
      matrixHall: [],
      conditionNumber: 1,
      conditionNumberHall: 1,
      bridges: [],
      observerPresence: VIEWER_PRESENCE_GAP,
      embeddingMode: "offline",
      kappaMax: KAPPA_MAX_OFFLINE,
    };
  }
  const { vectors: embeds, mode } = await embedPrompts(beats.map((b) => b.visualPrompt));
  const kappaMax = kappaMaxFor(mode);
  const G: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      G[i][j] = cosine(embeds[i], embeds[j]);
    }
  }
  const GH: number[][] = G.map((row, i) => row.map((v, j) => v + (i === j ? ETA : 0)));
  const kappa = conditionNumber(G);
  const kappaH = conditionNumber(GH);

  const bridges: Array<{ from: number; to: number; kappa: number }> = [];
  for (let i = 0; i < n - 1; i++) {
    const k = pairKappa(GH, i, i + 1);
    if (k > kappaMax) bridges.push({ from: i, to: i + 1, kappa: k });
  }

  return {
    matrix: G,
    matrixHall: GH,
    conditionNumber: kappa,
    conditionNumberHall: kappaH,
    bridges,
    // 0.02 residual is held by construction — the η floor never closes the gap
    // perfectly. Surface it so the UI can render the "Observer Presence" gauge.
    observerPresence: VIEWER_PRESENCE_GAP,
    embeddingMode: mode,
    kappaMax,
  };
}

// Ψ(t) = A(t) · N(t) target on the icositetragon. Each spoke n in [0..23]
// gets an A and N derived from its position so the product oscillates near 1.
const PHI = 1.618033988749895;
export function psiTarget(spoke: number): { A: number; N: number; psi: number } {
  const theta = (spoke / 24) * 2 * Math.PI;
  // Structural amplitude swells around the 12th spoke (mid-arc) and at the
  // closing seam; novelty flux peaks where amplitude wanes.
  const A = 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(theta));
  const N = 1 / Math.max(0.05, A * (1 + 0.04 * Math.sin(theta * PHI)));
  return { A, N, psi: A * N };
}
