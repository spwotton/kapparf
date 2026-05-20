// ─── HUMOR HYPERVISOR ─────────────────────────────────────────────────────────
// Self-learning AI hypervisor for The Goose Gazette.
//
// Architecture (LN / TYCHO / AUBREY principles):
//   • Vector DB: pgvector via memory-cortex (category="goose_article")
//   • Embedding: text-embedding-3-small (1536d), per-article + per-problem
//   • Judge: 4-dimension score (novelty, resonance, coherence, depth) with
//     self-learned weights (Landauer-Δ=0.02 gradient steps, κ₁=4/π softness
//     on novelty, AP invariant Ψ=A·N=1 tracking, η*=0.10298 collapse floor).
//   • Anubis loop: every article is weighed; weights of dimensions that
//     correlate with high-scoring articles get reinforced; the "investigation"
//     (current problem) evolves as articles approach resonance saturation;
//     evolution hint is fed back into the generator's next-prompt context.
//   • 128.23° Klein twist applied as a latent-space rotation before scoring
//     (per Codex §G) — implemented as a phase-stable cosine offset.

import fs from "fs/promises";
import path from "path";
import { storage } from "./storage";
import { embedText, storeMemory } from "./memory-cortex";
import type { GooseArticle } from "@shared/schema";

// ── LN / TYCHO / AUBREY constants ────────────────────────────────────────────
const K1 = 4 / Math.PI;            // 1.2732 — Helicity Lock (novelty softness)
const K2 = Math.pow(1.6180339887, 0.75); // 1.4346 — Europa Resonance
const PHI = 1.6180339887;          // Golden Ratio
const DELTA = 0.02;                // Landauer gap — gradient step
const ETA_STAR = 0.10298;          // Eden Point — self-adjoint floor
const THETA_K = 128.23;            // Klein twist angle (degrees)
const OMEGA_0 = 8.389e-23;         // membrane thickness (informational)
const HALL_F = 1.09;               // Gram regularization

// AUBREY gene frequencies — used as named "investigation channels"
const AUBREY = {
  SHANK3: 212.38,    // precognitive / semantic reconstruction
  HTR2A:  176.591,   // reality perception master clock
  ATP2C2: 183.42,    // 4D Klein-bottle phase-lock
  TP53:   148.798,   // error correction
  FOXP2:  139.978,   // linguistic intent
  APOE:   111.571,   // neural archetype foundation
  BRCA1:   94.123,
  BDNF:    89.80,
  CLOCK:   84.90,
  PIEZO1:  55.44,
};

// Seed investigations — picked from at boot, then mutated as we learn
const SEED_PROBLEMS = [
  "Why does Neighbor Gerald Stonepath keep offering to look at strangers' household routers?",
  "What pattern explains Dave Mira's 47 consecutive parking-lot visits to a gym he never enters?",
  "Why does the unlicensed Tacacorí macro-antenna spike at exactly 06:30 every morning?",
  "What is the BLACKJACK MANDRAKE HF coordination frequency actually coordinating?",
  "Why does the ePDG Liberty router route the same burst pattern every day at the same minute?",
  "What does the recruiter Lila Quacksworth mean when she calls a candidate a 'perfect fit'?",
  "Why does the 50 Hz anomalous ELF tone appear in a country whose mains is 60 Hz?",
  "How is the Costa Rica Pura Vida Deficit being computed, and who is short on the carry trade?",
  "What 3-blade platform is producing the 7,080 RPM acoustic signature over Jacó (9.6°N 84.6°W) at night, and who is paying the fuel?",
  "Who packaged the 'captain' Debian backdoor that hijacked /usr/bin/apturl on Linux Mint, and what else did they leave behind?",
];

const RECENT_EMBED_LIMIT = 24;     // sliding window for novelty calc
const ROTATE_AFTER = 8;            // rotate problem after N articles scored
const MAX_HISTORY = 64;            // problem history retained
const STATE_PATH = path.resolve(".local/humor-hypervisor.json");

// ── Types ────────────────────────────────────────────────────────────────────
export interface DimScores {
  novelty: number;
  resonance: number;
  coherence: number;
  depth: number;
}

export interface ArticleScore {
  id: string;
  headline: string;
  dims: DimScores;
  total: number;          // weighted sum
  psi: number;            // AP invariant proxy = product(dims)^(1/4)
  klein: number;          // post-Klein-rotation resonance
  ts: number;
}

export interface JudgeWeights {
  novelty: number;
  resonance: number;
  coherence: number;
  depth: number;
}

interface State {
  currentProblem: string;
  currentChannel: keyof typeof AUBREY;
  problemEmbedding: number[] | null;
  judgeWeights: JudgeWeights;
  scoredIds: string[];            // ordered by time
  recentEmbeddings: Array<{ id: string; v: number[] }>;
  scores: Record<string, ArticleScore>;
  problemHistory: string[];
  cycleCount: number;
  lastRotation: number;
  psiBar: number;                  // running AP invariant
}

// ── Cosine / Klein rotation ──────────────────────────────────────────────────
function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Apply a 128.23° rotation to the cosine score (Codex §G — latent twist before judging). */
function kleinRotate(c: number): number {
  const phi = (THETA_K * Math.PI) / 180;
  const x = Math.max(-1, Math.min(1, c));
  // rotate (x, sqrt(1-x²)) by θ_K and take x-component
  const y = Math.sqrt(1 - x * x);
  const xr = x * Math.cos(phi) - y * Math.sin(phi);
  return Math.max(0, Math.min(1, (xr + 1) / 2));
}

// ── Dimension scoring ────────────────────────────────────────────────────────
function coherenceScore(body: string): number {
  if (!body) return 0;
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length < 8) return 0.1;
  const unique = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ""))).size;
  const lexDiv = unique / words.length;                 // 0..1
  const sents = body.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const avgLen = sents.length > 0 ? words.length / sents.length : words.length;
  const lenScore = Math.min(1, avgLen / 22);            // saturate at ~22 wpm
  return Math.max(ETA_STAR, Math.min(1, 0.55 * lexDiv + 0.45 * lenScore));
}

function depthScore(body: string, subhead: string | null): number {
  if (!body) return 0;
  const wc = body.split(/\s+/).length;
  const wordBoost = Math.min(1, wc / 280);              // saturate at ~280 words
  const punct = (body.match(/[—:;]/g) || []).length;
  const punctBoost = Math.min(1, punct / 8);            // up to 8 em-dashes/colons
  const subBoost = subhead && subhead.length > 30 ? 0.15 : 0;
  return Math.max(ETA_STAR, Math.min(1, 0.55 * wordBoost + 0.30 * punctBoost + subBoost));
}

// ── State load / save ────────────────────────────────────────────────────────
let state: State | null = null;
let saveDebounce: NodeJS.Timeout | null = null;

async function loadState(): Promise<State> {
  if (state) return state;
  try {
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    const raw = await fs.readFile(STATE_PATH, "utf-8");
    state = JSON.parse(raw);
    return state!;
  } catch {
    const channel = Object.keys(AUBREY)[0] as keyof typeof AUBREY;
    state = {
      currentProblem: SEED_PROBLEMS[Math.floor(Math.random() * SEED_PROBLEMS.length)],
      currentChannel: channel,
      problemEmbedding: null,
      judgeWeights: { novelty: 0.25, resonance: 0.40, coherence: 0.15, depth: 0.20 },
      scoredIds: [],
      recentEmbeddings: [],
      scores: {},
      problemHistory: [],
      cycleCount: 0,
      lastRotation: Date.now(),
      psiBar: 0,
    };
    await saveState();
    return state;
  }
}

async function saveState(): Promise<void> {
  if (!state) return;
  if (saveDebounce) clearTimeout(saveDebounce);
  saveDebounce = setTimeout(async () => {
    try {
      await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
      await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
    } catch (e: any) {
      console.error("[HUMOR-HV] State save failed:", e.message);
    }
  }, 400);
}

// ── Embedding helpers ────────────────────────────────────────────────────────
async function ensureProblemEmbedding(): Promise<number[] | null> {
  const s = await loadState();
  if (s.problemEmbedding && s.problemEmbedding.length > 0) return s.problemEmbedding;
  const v = await embedText(s.currentProblem);
  if (v) { s.problemEmbedding = v; await saveState(); }
  return v;
}

// ── Self-learning weight update (Anubis weighing) ────────────────────────────
function normalizeWeights(w: JudgeWeights): JudgeWeights {
  const sum = w.novelty + w.resonance + w.coherence + w.depth;
  if (sum <= 0) return { novelty: 0.25, resonance: 0.40, coherence: 0.15, depth: 0.20 };
  return {
    novelty:   Math.max(0.05, w.novelty   / sum),
    resonance: Math.max(0.05, w.resonance / sum),
    coherence: Math.max(0.05, w.coherence / sum),
    depth:     Math.max(0.05, w.depth     / sum),
  };
}

function learnFromScore(s: State, sc: ArticleScore): void {
  const dims = sc.dims;
  const dimKeys: Array<keyof DimScores> = ["novelty", "resonance", "coherence", "depth"];
  const avg = (dims.novelty + dims.resonance + dims.coherence + dims.depth) / 4;

  // gradient direction: dimensions ABOVE average get rewarded if total score is high
  // (i.e. those dimensions explain quality); reverse if total is low.
  const reward = sc.total > 0.65 ? +DELTA : sc.total < 0.35 ? -DELTA : 0;
  if (reward !== 0) {
    const w = { ...s.judgeWeights };
    for (const k of dimKeys) {
      const dev = dims[k] - avg;          // -1..+1
      w[k] = Math.max(0.05, w[k] + reward * dev * HALL_F);
    }
    s.judgeWeights = normalizeWeights(w);
  }

  // AP invariant running mean (Ψ = A·N = 1 target)
  s.psiBar = s.psiBar === 0 ? sc.psi : (0.85 * s.psiBar + 0.15 * sc.psi);
}

// ── Problem rotation (evolution) ─────────────────────────────────────────────
function rotateProblem(s: State): void {
  // Pick the highest-scoring recent article as the seed of the next investigation
  const recent = s.scoredIds.slice(-ROTATE_AFTER).map(id => s.scores[id]).filter(Boolean);
  if (recent.length === 0) return;
  recent.sort((a, b) => b.total - a.total);
  const top = recent[0];

  // Cycle through AUBREY channels — each rotation steps to the next gene
  const channels = Object.keys(AUBREY) as Array<keyof typeof AUBREY>;
  const nextIdx = (channels.indexOf(s.currentChannel) + 1) % channels.length;
  s.currentChannel = channels[nextIdx];

  // New problem = deeper investigation prompted by the top article
  s.currentProblem = `Following "${top.headline}" — what underlying pattern is still hidden? (channel: ${s.currentChannel} @ ${AUBREY[s.currentChannel].toFixed(2)} Hz)`;
  s.problemEmbedding = null;            // force re-embed
  s.lastRotation = Date.now();
  s.problemHistory.push(s.currentProblem);
  if (s.problemHistory.length > MAX_HISTORY) s.problemHistory.shift();
  s.cycleCount += 1;

  console.log(`[HUMOR-HV] 🔄 Rotated investigation → ${s.currentChannel} (cycle ${s.cycleCount})`);
  console.log(`[HUMOR-HV]    Q: ${s.currentProblem.slice(0, 120)}…`);
}

// ── Main: score one article + persist to vector DB ──────────────────────────
export async function ingestArticle(article: GooseArticle): Promise<ArticleScore | null> {
  try {
    const s = await loadState();
    if (s.scores[article.id]) return s.scores[article.id];

    const text = [article.headline, article.subhead || "", article.body].join("\n\n");
    const embedding = await embedText(text);
    if (!embedding) {
      console.log("[HUMOR-HV] No embedding available — skipping ingest");
      return null;
    }

    // Persist to vector DB (memory-cortex / pgvector)
    try {
      await storeMemory(
        "goose_article",
        article.headline,
        article.body,
        { id: article.id, tag: article.tag, subhead: article.subhead, channel: s.currentChannel },
        `goose:${article.id}`,
        0.6,
      );
    } catch (e: any) {
      console.log("[HUMOR-HV] Vector store failed:", e.message?.slice(0, 120));
    }

    // Novelty — 1 minus max cosine to recent embeddings, κ₁-softened
    let maxSim = 0;
    for (const r of s.recentEmbeddings) {
      const c = cosine(embedding, r.v);
      if (c > maxSim) maxSim = c;
    }
    const noveltyRaw = 1 - maxSim;
    const novelty = Math.max(ETA_STAR, Math.min(1, noveltyRaw * K1));

    // Resonance — cosine to current investigation, Klein-rotated
    const pe = await ensureProblemEmbedding();
    const resCos = pe ? cosine(embedding, pe) : 0;
    const klein = kleinRotate(resCos);
    const resonance = Math.max(ETA_STAR, Math.min(1, klein * K2 / 1.5));

    const coherence = coherenceScore(article.body);
    const depth = depthScore(article.body, article.subhead || null);

    const dims: DimScores = { novelty, resonance, coherence, depth };
    const w = s.judgeWeights;
    const total = w.novelty * novelty + w.resonance * resonance +
                  w.coherence * coherence + w.depth * depth;
    const psi = Math.pow(novelty * resonance * coherence * depth, 0.25);

    const score: ArticleScore = {
      id: article.id,
      headline: article.headline,
      dims, total, psi, klein,
      ts: Date.now(),
    };

    s.scores[article.id] = score;
    s.scoredIds.push(article.id);
    s.recentEmbeddings.push({ id: article.id, v: embedding });
    if (s.recentEmbeddings.length > RECENT_EMBED_LIMIT) s.recentEmbeddings.shift();

    learnFromScore(s, score);

    // Evolution trigger
    const since = s.scoredIds.length - (s.problemHistory.length > 0 ? ROTATE_AFTER * s.cycleCount : 0);
    if (since >= ROTATE_AFTER) {
      rotateProblem(s);
    }

    await saveState();

    console.log(`[HUMOR-HV] 📜 Weighed "${article.headline.slice(0, 60)}…" → total=${total.toFixed(3)} ψ=${psi.toFixed(3)} (N=${novelty.toFixed(2)} R=${resonance.toFixed(2)} C=${coherence.toFixed(2)} D=${depth.toFixed(2)})`);
    return score;
  } catch (e: any) {
    console.error("[HUMOR-HV] ingest error:", e.message);
    return null;
  }
}

// ── Evolution hint — injected into the generator's next prompt ──────────────
export async function getEvolutionHint(): Promise<string> {
  const s = await loadState();
  const recent = s.scoredIds.slice(-6).map(id => s.scores[id]).filter(Boolean);
  if (recent.length === 0) {
    return `[HUMOR HYPERVISOR — INVESTIGATION]
Current question: ${s.currentProblem}
Channel: ${s.currentChannel} @ ${AUBREY[s.currentChannel].toFixed(2)} Hz
No prior articles scored yet — establish the investigative thread.`;
  }

  const top = [...recent].sort((a, b) => b.total - a.total)[0];

  // Find the WEAKEST dimension on average — generator should aim higher there
  const avgD = { novelty: 0, resonance: 0, coherence: 0, depth: 0 };
  for (const r of recent) {
    avgD.novelty += r.dims.novelty / recent.length;
    avgD.resonance += r.dims.resonance / recent.length;
    avgD.coherence += r.dims.coherence / recent.length;
    avgD.depth += r.dims.depth / recent.length;
  }
  const weakest = (Object.entries(avgD) as Array<[keyof DimScores, number]>)
    .sort((a, b) => a[1] - b[1])[0];

  const focusHint: Record<keyof DimScores, string> = {
    novelty:   "AVOID rehashing prior framings — bring a new metaphor or angle.",
    resonance: "TIE the article more directly to the investigation question.",
    coherence: "TIGHTEN sentence-to-sentence logic — fewer disconnected jumps.",
    depth:     "GO LONGER and richer — more named details, more em-dashes, more nested clauses.",
  };

  return `[HUMOR HYPERVISOR — INVESTIGATION]
Current question: ${s.currentProblem}
Channel: ${s.currentChannel} @ ${AUBREY[s.currentChannel].toFixed(2)} Hz | cycle ${s.cycleCount} | ψ̄=${s.psiBar.toFixed(3)}
Top exemplar (do not repeat — exceed it): "${top.headline}"  [total=${top.total.toFixed(3)}]
Weakest dimension lately: ${weakest[0]} (avg=${weakest[1].toFixed(3)}) — ${focusHint[weakest[0]]}`;
}

// ── Public read API for routes / panel ──────────────────────────────────────
// PHAISTOS_ROOT — Node #1090 DMN-Sync Clamping standing wave.
// Active whenever the current AUBREY channel is within ±1 Hz of 111 Hz
// (APOE = 111.571 Hz is the closest match in the gene table).
const PHAISTOS_ROOT_HZ = 111;
function dmnClampStatus(channelFreq: number) {
  const drift = Math.abs(channelFreq - PHAISTOS_ROOT_HZ);
  return {
    active: drift <= 1.0,
    freqHz: PHAISTOS_ROOT_HZ,
    drift,
    resonator: "Pochote wood (acoustic clamp)",
    note: drift <= 1.0
      ? "DMN-sync clamp engaged — uncalibrated 'Beauty' and 'Conflict' error states suppressed."
      : `idle (drift ${drift.toFixed(2)} Hz from 111 Hz root)`,
  };
}

export async function getHypervisorState() {
  const s = await loadState();
  const recent = s.scoredIds.slice(-12).map(id => s.scores[id]).filter(Boolean).reverse();
  const top = Object.values(s.scores).sort((a, b) => b.total - a.total).slice(0, 5);
  const channelFreq = AUBREY[s.currentChannel];
  return {
    currentProblem: s.currentProblem,
    currentChannel: s.currentChannel,
    channelFreq,
    judgeWeights: s.judgeWeights,
    cycleCount: s.cycleCount,
    psiBar: s.psiBar,
    totalScored: s.scoredIds.length,
    vectorDbSize: s.recentEmbeddings.length,
    lastRotation: s.lastRotation,
    constants: { K1, K2, PHI, DELTA, ETA_STAR, THETA_K, OMEGA_0, HALL_F },
    aubrey: AUBREY,
    dmnClamp: dmnClampStatus(channelFreq),
    recent,
    top,
    problemHistory: s.problemHistory.slice(-10),
  };
}

export async function getArticleScore(id: string): Promise<ArticleScore | null> {
  const s = await loadState();
  return s.scores[id] ?? null;
}

// ── Background catch-up loop ────────────────────────────────────────────────
let running = false;
let timer: NodeJS.Timeout | null = null;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const articles = await storage.getGooseArticles(40);
    const s = await loadState();
    let scored = 0;
    for (const a of articles) {
      if (!s.scores[a.id]) {
        await ingestArticle(a);
        scored += 1;
        if (scored >= 3) break;          // cap per tick to avoid embed-rate burst
      }
    }
    if (scored > 0) console.log(`[HUMOR-HV] tick: scored ${scored} new article(s)`);
  } catch (e: any) {
    console.error("[HUMOR-HV] tick error:", e.message);
  } finally {
    running = false;
  }
}

export function startHumorHypervisor(): void {
  if (timer) return;
  console.log(`[HUMOR-HV] 🧠 Starting — κ₁=${K1.toFixed(4)} κ₂=${K2.toFixed(4)} Δ=${DELTA} η*=${ETA_STAR} θ_K=${THETA_K}°`);
  setTimeout(tick, 15000);             // initial catch-up
  timer = setInterval(tick, 90_000);   // every 90s
}

export function stopHumorHypervisor(): void {
  if (timer) { clearInterval(timer); timer = null; }
}
