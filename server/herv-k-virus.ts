/**
 * HERV-K SHARING VIRUS ENGINE
 *
 * Reverse-engineers the HERV-K endogenous retrovirus lifecycle into a
 * love-and-funny content virality model for The Goose Gazette.
 *
 * HERV-K Biology → Gazette Metaphor:
 *   ENV glycoprotein (entry)    → shareable card (the thing that spreads)
 *   RT transcription            → article remixing / quote extraction
 *   LTR promoter activation     → humor score threshold triggers "activation"
 *   Möbius topology (HIV block) → Klein-twist headline geometry (can't be copied flat)
 *   R₀ (reproduction number)    → viral coefficient = humor × specificity × κ-geometry
 *   Fossilization               → article cited by AI / indexed in SERP
 *
 * LIFECYCLE PHASES:
 *   DORMANT   — article exists, R₀ < 1, nobody has shared it
 *   ACTIVE    — R₀ ≥ 1, first share event detected
 *   SPREADING — R₀ > 1.5, multiple share events, Tico Satire briefing mentions it
 *   FOSSILIZED — article cited/referenced externally (AI mention or search click)
 *
 * GEOMETRIC CONSTANTS (from GOS_CURE_HIV_PROTOCOL v2.0):
 *   θ_K   = 128.23°  — Klein twist / HERV-K prion rotation axis
 *   φ     = 1.618     — golden frequency (1.618 THz pulse → mapped to humor depth)
 *   ZNF532 binding    → specificity score (exactly-named CR place = max affinity)
 *   KRAB silencing    → AP-wire rigidity (keeps the joke straight-faced)
 */

import { storage } from "./storage";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const THETA_K = 128.23;          // Klein-twist torsion angle
const PHI = 1.618033988749895;   // golden ratio
const R0_ACTIVATION = 1.0;       // R₀ threshold for ACTIVE phase
const R0_SPREADING  = 1.5;       // R₀ threshold for SPREADING phase
const KRAB_RIGIDITY = 4 / Math.PI; // κ₁ = AP-wire rigidity coefficient

// ── TYPES ─────────────────────────────────────────────────────────────────────
export type HervPhase = "DORMANT" | "ACTIVE" | "SPREADING" | "FOSSILIZED";

export interface HervState {
  articleId: string;
  headline: string;
  phase: HervPhase;
  r0: number;
  shareEvents: number;
  envExpressed: boolean;   // share card has been generated
  ltrActivated: boolean;   // humor score ≥ threshold
  kleinAngle: number;      // headline torsion (κ₁-derived, in degrees)
  mobiusLocked: boolean;   // headline passes κ-geometry (can't be flattened)
  fossilNote: string | null;
  activatedAt: number | null;
  lastShareAt: number | null;
  viralCard: string | null; // pre-rendered share text
}

export interface VirusState {
  totalArticles: number;
  phases: Record<HervPhase, number>;
  topR0: HervState | null;
  recentFossils: HervState[];
  globalR0: number;        // mean R₀ across all ACTIVE+SPREADING articles
  ltrActive: number;       // count of articles with humor score ≥ threshold
  lastCycle: number;
}

// ── IN-MEMORY REGISTRY ────────────────────────────────────────────────────────
const registry = new Map<string, HervState>();
let virusState: VirusState = {
  totalArticles: 0,
  phases: { DORMANT: 0, ACTIVE: 0, SPREADING: 0, FOSSILIZED: 0 },
  topR0: null,
  recentFossils: [],
  globalR0: 0,
  ltrActive: 0,
  lastCycle: 0,
};

// ── R₀ CALCULATOR ────────────────────────────────────────────────────────────
function calculateR0(article: {
  headline: string;
  body: string;
  humorScore?: number | null;
}): number {
  // Humor score component (LTR promoter strength)
  const humorComponent = ((article.humorScore ?? 50) / 100) * PHI;

  // Specificity component: ZNF532 binding — exact CR place names boost affinity
  const crPlaces = [
    "Jacó", "Escazú", "Barrio Escalante", "La Uruca", "Turrialba",
    "Liberia", "Quepos", "Moravia", "Tibás", "Curridabat", "Cahuita",
    "Nosara", "Tamarindo", "Puerto Viejo", "Desamparados", "Santo Domingo",
    "Tres Ríos", "San Ramón", "Hatillo", "Uvita",
  ];
  const placeMatches = crPlaces.filter(p =>
    article.body.includes(p) || article.headline.includes(p)
  ).length;
  const specificityComponent = Math.min(1.0, placeMatches * 0.4) * KRAB_RIGIDITY;

  // Headline geometry: κ₁ resonance (closer to 4/π = tighter Möbius lock)
  const words = article.headline.split(/\s+/);
  const semicolonIdx = article.headline.indexOf(";");
  let kleinComponent = 0;
  if (semicolonIdx > 0) {
    const setupTokens = article.headline.slice(0, semicolonIdx).split(/\s+/).length;
    const punchTokens = words.length - setupTokens;
    if (punchTokens > 0) {
      const kappa = setupTokens / punchTokens;
      const kappaErr = Math.abs(kappa - KRAB_RIGIDITY);
      kleinComponent = Math.max(0, 1 - kappaErr * 3) * (THETA_K / 360);
    }
  }

  // Colones signal: authentic CR monetary amounts boost spread
  const colonesBonus = article.body.includes("₡") ? 0.1 : 0;

  // Don Beto / tico colloquial bonus (one permitted informal witness)
  const ticoBonus = /Don\s+\w+|tuanis|chunche|diay|mae\b/i.test(article.body) ? 0.12 : 0;

  const r0 = humorComponent + specificityComponent + kleinComponent + colonesBonus + ticoBonus;
  return Math.round(r0 * 1000) / 1000;
}

// ── VIRAL CARD GENERATOR ──────────────────────────────────────────────────────
function generateViralCard(article: { headline: string; subhead: string | null; authorByline: string | null }, r0: number): string {
  const r0Label = r0 >= R0_SPREADING ? "🔴 SPREADING" : r0 >= R0_ACTIVATION ? "🟡 ACTIVE" : "⚪ DORMANT";
  const kleinLock = r0 >= R0_ACTIVATION ? "🌀 Klein-locked" : "";
  return [
    `📰 THE GOOSE GAZETTE`,
    `"${article.headline}"`,
    article.subhead ? `   ${article.subhead}` : "",
    ``,
    `${r0Label}  R₀ = ${r0.toFixed(3)}  ${kleinLock}`,
    article.authorByline ? `— ${article.authorByline}` : "",
    ``,
    `θ_K = 128.23° | κ = 4/π | HONK`,
    `ciajw.com/goose`,
  ].filter(l => l !== null).join("\n").trim();
}

// ── PHASE CALCULATOR ─────────────────────────────────────────────────────────
function calculatePhase(state: HervState): HervPhase {
  if (state.fossilNote) return "FOSSILIZED";
  if (state.r0 >= R0_SPREADING && state.shareEvents >= 2) return "SPREADING";
  if (state.r0 >= R0_ACTIVATION) return "ACTIVE";
  return "DORMANT";
}

// ── INGEST ARTICLE ────────────────────────────────────────────────────────────
export function ingestToHervK(article: {
  id: string;
  headline: string;
  subhead: string | null;
  body: string;
  authorByline: string | null;
  humorScore?: number | null;
}): HervState {
  const r0 = calculateR0(article);
  const words = article.headline.split(/\s+/);
  const semicolonIdx = article.headline.indexOf(";");
  const setupTokens = semicolonIdx > 0
    ? article.headline.slice(0, semicolonIdx).split(/\s+/).length
    : Math.floor(words.length / 2);
  const punchTokens = words.length - setupTokens;
  const kleinAngle = punchTokens > 0
    ? Math.round((Math.atan2(punchTokens, setupTokens) * 180 / Math.PI) * 100) / 100
    : 0;
  const mobiusLocked = Math.abs(kleinAngle - THETA_K) < 15;

  const state: HervState = {
    articleId: article.id,
    headline: article.headline,
    phase: "DORMANT",
    r0,
    shareEvents: 0,
    envExpressed: false,
    ltrActivated: (article.humorScore ?? 0) >= 60,
    kleinAngle,
    mobiusLocked,
    fossilNote: null,
    activatedAt: r0 >= R0_ACTIVATION ? Date.now() : null,
    lastShareAt: null,
    viralCard: null,
  };
  state.phase = calculatePhase(state);
  if (state.phase !== "DORMANT") {
    state.envExpressed = true;
    state.viralCard = generateViralCard(article, r0);
  }
  registry.set(article.id, state);
  return state;
}

// ── SHARE EVENT ───────────────────────────────────────────────────────────────
export function recordShareEvent(articleId: string, medium: string = "unknown"): HervState | null {
  const state = registry.get(articleId);
  if (!state) return null;
  state.shareEvents++;
  state.lastShareAt = Date.now();
  if (!state.activatedAt) state.activatedAt = Date.now();
  state.envExpressed = true;
  state.phase = calculatePhase(state);
  if (!state.viralCard) {
    const article = { headline: state.headline, subhead: null, authorByline: null };
    state.viralCard = generateViralCard(article, state.r0);
  }
  console.log(`[HERV-K] Share event: "${state.headline.slice(0, 50)}" via ${medium} | R₀=${state.r0} | Phase=${state.phase}`);
  registry.set(articleId, state);
  return state;
}

// ── FOSSILIZE ─────────────────────────────────────────────────────────────────
export function fossilizeArticle(articleId: string, note: string): HervState | null {
  const state = registry.get(articleId);
  if (!state) return null;
  state.fossilNote = note;
  state.phase = "FOSSILIZED";
  console.log(`[HERV-K] FOSSILIZED: "${state.headline.slice(0, 50)}" — ${note}`);
  registry.set(articleId, state);
  return state;
}

// ── CYCLE ─────────────────────────────────────────────────────────────────────
async function runCycle() {
  try {
    const articles = await storage.getGooseArticles(50);
    for (const a of articles) {
      if (!registry.has(a.id)) {
        ingestToHervK({
          id: a.id,
          headline: a.headline,
          subhead: a.subhead ?? null,
          body: a.body,
          authorByline: a.authorByline ?? null,
          humorScore: null,
        });
      }
    }

    const states = Array.from(registry.values());
    const phaseCounts: Record<HervPhase, number> = { DORMANT: 0, ACTIVE: 0, SPREADING: 0, FOSSILIZED: 0 };
    let r0Sum = 0; let r0Count = 0; let ltrActive = 0;
    for (const s of states) {
      phaseCounts[s.phase]++;
      if (s.phase === "ACTIVE" || s.phase === "SPREADING") { r0Sum += s.r0; r0Count++; }
      if (s.ltrActivated) ltrActive++;
    }

    const sorted = states.sort((a, b) => b.r0 - a.r0);
    const fossils = states.filter(s => s.phase === "FOSSILIZED").sort((a, b) => (b.lastShareAt ?? 0) - (a.lastShareAt ?? 0));

    virusState = {
      totalArticles: states.length,
      phases: phaseCounts,
      topR0: sorted[0] ?? null,
      recentFossils: fossils.slice(0, 3),
      globalR0: r0Count > 0 ? Math.round((r0Sum / r0Count) * 1000) / 1000 : 0,
      ltrActive,
      lastCycle: Date.now(),
    };
  } catch (e: any) {
    console.warn("[HERV-K] Cycle error:", e.message);
  }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export function getVirusState(): VirusState { return virusState; }
export function getArticleHervState(id: string): HervState | null { return registry.get(id) ?? null; }
export function getAllHervStates(): HervState[] { return Array.from(registry.values()); }

let _timer: ReturnType<typeof setInterval> | null = null;

export function startHervKVirus() {
  console.log("[HERV-K] Sharing Virus started — HERV-K lifecycle model active (θ_K=128.23°, φ=1.618)");
  setTimeout(() => runCycle(), 5000);
  _timer = setInterval(() => runCycle(), 5 * 60 * 1000); // sync every 5 min
}
