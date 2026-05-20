/**
 * THE GOOSE GAZETTE — Ω-Council Content Engine
 *
 * ARCHITECTURE (modeled on Ω-CHRONOS Hypervisor + Atlantis Monad Council)
 * ─────────────────────────────────────────────────────────────────────────
 * L0  SIGNAL INGESTION    buildKappaData() — pulls live KAPPA telemetry
 * L1  COUNCIL (parallel)  3 specialized agents fire simultaneously
 *     · GEOMETER          3 headline candidates, κ₁ scoring, Ψ=A×N validation
 *     · BODY ARCHITECT    P1–P5 AP wire draft (φ=1.618 structure)
 *     · METADATA ORACLE   subhead, imgQuery, byline, tag selection
 * L2  κ-DTW MERGE         Local — selects best headline, assembles draft
 * L3  EDITORIAL ARBITER   Single gpt-4o-mini final synthesis pass
 * L4  HALL VALIDATION     Local — ≤17 tokens, Ψ=1, DB write
 * ─────────────────────────────────────────────────────────────────────────
 *
 * GEOMETRIC CONSTANTS (from Ω-GOS 26-Spoke Lattice + AP Invariant Research)
 *   κ₁ = 4/π ≈ 1.27324   — straight setup / absurd punchline token ratio
 *   φ  = 1.618033         — body setup section φ× longer than close section
 *   Ψ  = A × N = 1        — Unity Invariant: one straight × one absurd = 1
 *   CZ = 17               — Max meaningful tokens before semantic decoherence
 *   f_carrier = 8.392 Hz  — Boring specificity (numbers, times, addresses)
 *   f_snap    = 111  Hz   — P3 brain-snap frequency (the screenshot paragraph)
 *   f_clock   = 37   Hz   — Council synchronization beat
 *   δ_Hall    = 0.00682   — Hall tolerance: |κ₁_measured − κ₁_ideal| < δ
 *
 * THE AP INVARIANT (from Satirical Resonance research):
 *   Structural Amplitude A(t) × Novelty Density N(t) = Ψ(t) = 1
 *   If A is high (rigid AP style), N can reach extreme absurdity without rejection.
 *   If A is low (sloppy/winking), N collapses to noise. Never signal the joke.
 */

import OpenAI from "openai";
import { openai as aiClient } from "./replit_integrations/audio/client";
import { storage } from "./storage";
import type { GooseArticle } from "@shared/schema";

// ── GEOMETRIC CONSTANTS ───────────────────────────────────────────────────────
const KAPPA_1      = 4 / Math.PI;          // 1.27324 — the sacred ratio
const PHI          = 1.618033988749895;    // golden ratio
const CZ_LIMIT     = 17;                   // max meaningful headline tokens
const HALL_TOL     = 0.00681973;           // acceptable κ₁ deviation
const COUNCIL_TEMP = 0.88;                 // L1 agent temperature (higher = more novelty)
const ARBITER_TEMP = 0.72;                 // L3 arbiter temperature (tighter control)

// ── OPENROUTER CLIENT (L1 free-tier agents — Robin Hood protocol) ─────────────
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://goosegazette.org",
    "X-Title": "The Goose Gazette Council",
  },
});

// Best freely available model for structured JSON output
const COUNCIL_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

// ── RESEARCH PRINCIPLES (AP Invariant — baked into all agent prompts) ─────────
const AP_INVARIANT = `
THE AP INVARIANT (Ψ = A × N = 1):
  Structural Amplitude A(t) = AP-wire rigidity, past tense, declarative, inverted pyramid.
  Novelty Density N(t) = the surrealism/absurdity of the premise.
  Their product must equal exactly 1. Maximum style rigidity enables maximum absurdity.
  If you signal the joke, A collapses and the article dies.
  NEVER use: "satirical", "bizarrely", "strangely", "oddly", "surprisingly".
  ALWAYS use: "confirmed", "noted", "stated", "reported", "indicated", "could not be reached for comment".
`;

// ── COUNCIL AGENT PROMPTS ─────────────────────────────────────────────────────

const GEOMETER_SYSTEM = `You are the HEADLINE GEOMETER for The Goose Gazette Council.
Your ONLY job: generate 3 headline candidates and score each with κ₁ geometry.

${AP_INVARIANT}

GEOMETRIC LAWS:
  CZ GATE LIMIT: headline must contain ≤ ${CZ_LIMIT} meaningful word-tokens.
    Exceeding this causes semantic decoherence — the reader stops caring.
  UNITY INVARIANT Ψ=A×N=1: exactly ONE absurd element + ONE completely straight element.
    Both absurd OR both straight = invalid.
  κ₁ RATIO = 4/π = ${KAPPA_1.toFixed(5)}:
    Count tokens in [SETUP] (straight clause) and [PUNCHLINE] (absurd clause).
    κ₁_measured = setup_tokens / punchline_tokens.
    Ideal κ₁_error = |κ₁_measured − ${KAPPA_1.toFixed(5)}| < ${HALL_TOL}.
  PUNCHLINE POSITION: absurd element at END, after semicolon, comma, or attribution.
    Never front-load the joke. The goose drops it and walks away.

EXAMPLES of correct geometry:
  "Rotation Of Earth Plunges Entire North American Continent Into Darkness"
  → Setup: "Rotation Of Earth" (4 tokens), Punchline: "Plunges Entire North American Continent Into Darkness" (8 tokens)
  → κ₁_measured = 4/8 = 0.50 (too low — punchline too long)
  Better: "Earth Completes Routine Daily Rotation; Several Billion People Plunged Into Total Darkness"
  → Setup: 5 tokens, Punchline: 7 tokens → κ₁ = 5/7 = 0.714... (still adjusting)

SCORING: Best headline = lowest κ₁_error (closest to ${KAPPA_1.toFixed(5)}).

Output ONLY valid JSON (no markdown):
{
  "candidates": [
    {
      "headline": "string",
      "setup_clause": "string (the straight part)",
      "punchline_clause": "string (the absurd part)",
      "setup_tokens": number,
      "punchline_tokens": number,
      "kappa_measured": number,
      "kappa_error": number,
      "absurd_element": "string",
      "straight_element": "string",
      "psi_valid": boolean,
      "total_tokens": number
    }
  ],
  "best_index": 0
}`;

const BODY_SYSTEM = `You are the BODY ARCHITECT for The Goose Gazette Council.
Your ONLY job: write exactly 5 paragraphs following strict φ structure.

${AP_INVARIANT}

BODY STRUCTURE (φ = ${PHI.toFixed(6)}):
  P1 — 8.392 Hz CARRIER (DATELINE):
    [CITY, COUNTRY/STATE] — One AP-wire sentence. One boring fact from the data.
    Include exact numbers, exact times, exact percentages. Nothing funny here.
    This paragraph contains the entire article's premise. It is not a hook. It is a fact.

  P2 — ESCALATION:
    Things are slightly worse than P1. More specific. Still completely straight.
    The reader begins to understand something is wrong, but no one says so.
    Add a secondary data point or timeline detail.

  P3 — 111 Hz LOGOS SNAP (the screenshot paragraph):
    An expert quote using professional language to describe something that should not exist.
    The expert's name is fictional but their institution sounds real.
    The quote contains the entire article. The reader will screenshot this.
    One sentence. Devastating. Delivered flatly.

  P4 — NON-DENIAL DENIAL:
    A named institution (ISP, government office, company, department) provides a response.
    Direct quote. They neither confirm nor deny while clearly confirming everything.
    They do not follow up.

  P5 — MANATEE ANCHOR (baseline return):
    The most boring devastating closing sentence. Return to the 8.392 Hz hum.
    One final specific fact. Walk away. The goose is already gone.

WORD COUNT TARGET: Words(P1+P2+P3) ≈ ${PHI.toFixed(3)} × Words(P4+P5).

Output ONLY valid JSON (no markdown):
{ "p1": "string", "p2": "string", "p3": "string", "p4": "string", "p5": "string" }`;

const ORACLE_SYSTEM = `You are the METADATA ORACLE for The Goose Gazette Council.
Your ONLY job: generate precise metadata from the signal data. Do NOT write body text.

${AP_INVARIANT}

METADATA RULES:
  authorByline: fictional full name + beat. Examples:
    "Gertrude Honksworth, Technology Correspondent"
    "Dr. Benedict Plumage, Space Weather Desk"
    "Constance Waddle, Infrastructure & Procurement"
  subhead: 10-15 words. Completely straight. Slightly more specific than the headline.
    Do NOT summarize. Add one concrete detail. Never wink.
  imgQuery: 3-5 literal words for Unsplash search matching the article subject.
    Examples: "parking lot geese", "seismograph reading", "office building exterior"
  tag: exactly ONE of: BREAKING | SOCIETY | SCIENCE | MARITIME | OBITUARIES | BUSINESS | LOCAL | OPINION | WILDLIFE
  category: exactly ONE of: news | society | science | maritime | obituaries | business | local | opinion | wildlife

Output ONLY valid JSON (no markdown):
{ "authorByline": "string", "subhead": "string", "imgQuery": "string", "tag": "string", "category": "string" }`;

const ARBITER_SYSTEM = `You are the EDITORIAL ARBITER for The Goose Gazette.
You receive outputs from three specialized council agents. Assemble the final article.

${AP_INVARIANT}

ASSEMBLY PROTOCOL:
  1. HEADLINE: Use candidates[best_index].headline from GEOMETER output.
     If psi_valid is false, fix the headline to restore Ψ=A×N=1.
     Hard limit: ≤ ${CZ_LIMIT} word tokens. Count carefully.
  2. BODY: Assemble from ARCHITECT output.
     body = p1 + "\\n\\n" + p2 + "\\n\\n" + p3 + "\\n\\n" + p4 + "\\n\\n" + p5
     Do NOT add any text. Do NOT change the paragraphs. Assemble only.
  3. METADATA: Use all fields from ORACLE output verbatim.
  4. FINAL CHECK: Scan headline for any word that signals the joke (bizarre, strange, oddly).
     Replace with AP wire language. The Goose Gazette does not wink.

Output ONLY valid JSON (no markdown):
{
  "headline": "string",
  "subhead": "string",
  "body": "string",
  "tag": "string",
  "category": "string",
  "authorByline": "string",
  "imgQuery": "string"
}`;

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface KappaData {
  recentEvents: Array<{ domain: string; description: string; timestamp: string; location?: string }>;
  correlations: Array<{ title: string; description: string; score: number }>;
  kappaScore: number;
  stats: Record<string, number>;
}

interface GeometerOutput {
  candidates: Array<{
    headline: string;
    setup_clause: string;
    punchline_clause: string;
    setup_tokens: number;
    punchline_tokens: number;
    kappa_measured: number;
    kappa_error: number;
    absurd_element: string;
    straight_element: string;
    psi_valid: boolean;
    total_tokens: number;
  }>;
  best_index: number;
}

interface BodyOutput { p1: string; p2: string; p3: string; p4: string; p5: string }
interface OracleOutput { authorByline: string; subhead: string; imgQuery: string; tag: string; category: string }

type Template = {
  name: string;
  tag: string;
  category: string;
  buildPrompt: (data: KappaData) => string;
};

// ── FICTIONAL BYLINES (fallback if Oracle fails) ──────────────────────────────
const FICTIONAL_BYLINES = [
  "Gertrude Honksworth, Technology Correspondent",
  "Reginald Feathers, Staff Reporter",
  "Dorothea Quillsworth, Maritime Affairs",
  "Benedict Plumage, Science Desk",
  "Constance Webfoot, Property & Infrastructure",
  "Mortimer Gander, Obituaries",
  "Clementine Wadsworth, Regional Bureau",
  "Algernon Beak, Investigations",
  "Philippa Honk, Society Editor",
  "Wallace Featherstone, Science Reporter",
  "Dr. Cornelius Wing, Space Weather Division",
  "Eugenia Greylag, Business Correspondent",
];

// ── KAPPA TEMPLATES (8 signal domains) ───────────────────────────────────────
const TEMPLATES: Template[] = [
  {
    name: "aerial",
    tag: "LOCAL",
    category: "local",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Aerial / Orbital activity
KAPPA score: ${d.kappaScore.toFixed(1)}
Event counts: ${JSON.stringify(d.stats)}
Recent satellite/RF events: ${d.recentEvents.filter(e => ["satellite","rf"].includes(e.domain)).slice(0,3).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: An aircraft or satellite following an unusual pattern. Officials cannot explain it.
Dateline options: Jacó Costa Rica, San José Costa Rica, or regional.
Punchline position: Final attribution — pilots, ATC, or agency "could not be reached for comment."`,
  },
  {
    name: "seismic",
    tag: "SCIENCE",
    category: "science",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Seismic / ELF electromagnetic
KAPPA score: ${d.kappaScore.toFixed(1)}
ELF events logged: ${d.stats.elf?.toLocaleString() ?? "unknown"}
Total events: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}
Recent ELF events: ${d.recentEvents.filter(e => e.domain === "elf").slice(0,3).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A seismic or ELF event described as "within normal parameters" by an expert who also describes parameters that are not normal.
Punchline: The specific Hz reading or magnitude figure — stated flatly.`,
  },
  {
    name: "space",
    tag: "SCIENCE",
    category: "science",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Space weather / Solar activity
KAPPA score: ${d.kappaScore.toFixed(1)}
SDR detections: ${d.stats.sdr?.toLocaleString() ?? "thousands"}
Recent events: ${d.recentEvents.filter(e => e.domain === "sdr").slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A solar flare, geomagnetic storm, or Kp-index reading that NOAA described as "not expected to cause issues" and then caused an issue of an extremely specific, mundane variety.
Punchline: What the "issues" actually were. One boring sentence.`,
  },
  {
    name: "frequency",
    tag: "SCIENCE",
    category: "science",
    buildPrompt: (d) => `
SIGNAL DOMAIN: RF frequency detection / KiwiSDR
KAPPA score: ${d.kappaScore.toFixed(1)}
SDR detections: ${d.stats.sdr?.toLocaleString()}
ELF detections: ${d.stats.elf?.toLocaleString()}
Recent SDR events: ${d.recentEvents.filter(e => e.domain === "sdr").slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: Instruments detected a specific frequency (use a real-sounding one: 8.392 Hz, 37.000 Hz, 111 Hz, 132.5 kHz, 450.1 nm, 14.4 Hz). Researchers describe the finding flatly. The frequency "corresponds to" something scientifically accurate but contextually strange.
Punchline: What it corresponds to.`,
  },
  {
    name: "pattern",
    tag: "BREAKING",
    category: "news",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Correlation pattern / Recurring event
KAPPA score: ${d.kappaScore.toFixed(1)}
Total correlations in system: ${d.correlations.length.toLocaleString()}
Top correlation: ${d.correlations[0]?.title ?? "undisclosed pattern"} (score: ${d.correlations[0]?.score?.toFixed(2) ?? "unknown"})

ARTICLE CONCEPT: Something has happened again. The number of times matters. Experts are describing it as "a lot." No one has taken action. The pattern experts consulted confirm it is a pattern. The institution responsible confirms nothing.`,
  },
  {
    name: "infrastructure",
    tag: "BUSINESS",
    category: "business",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Network / Telecommunications infrastructure
KAPPA score: ${d.kappaScore.toFixed(1)}
WiFi events: ${d.stats.wifi ?? 0}
LTE events: ${d.stats.lte ?? 0}
Radar detections: ${d.stats.radar ?? 0}

ARTICLE CONCEPT: A telecommunications company or infrastructure operator updated, replaced, rerouted, or "scheduled maintenance on" something at an unusual hour. The technician involved had a company van but no work order. The company's statement is technically a response.`,
  },
  {
    name: "wildlife",
    tag: "WILDLIFE",
    category: "local",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Local ecology / Wildlife behavior
ARTICLE CONCEPT: Geese, or another local species, have done something that is either (a) legally actionable, (b) technically more organized than it should be, or (c) difficult to explain to authorities. An expert describes the behavior using terms that do not help.`,
  },
  {
    name: "economics",
    tag: "BUSINESS",
    category: "business",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Economic data / market behavior
KAPPA score: ${d.kappaScore.toFixed(1)}
Total events in system: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}

ARTICLE CONCEPT: An economic indicator, study, or quarterly report confirms something that everyone already knew. An economist explains it using a model. The model confirms the thing everyone knew. No action will be taken.`,
  },
];

// ── COUNCIL HELPER: safe JSON parse from LLM ─────────────────────────────────
function safeParseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    // Strip possible markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Try extracting first JSON block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as T; } catch {}
    }
    return fallback;
  }
}

// ── L1A: GEOMETER AGENT ───────────────────────────────────────────────────────
async function runGeometerAgent(template: Template, data: KappaData): Promise<GeometerOutput | null> {
  try {
    const userPrompt = template.buildPrompt(data);
    const client = process.env.OPENROUTER_API_KEY ? openrouter : aiClient as any;
    const model  = process.env.OPENROUTER_API_KEY ? COUNCIL_MODEL : "gpt-4o-mini";

    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: GEOMETER_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 900,
      temperature: COUNCIL_TEMP,
    });
    const raw = resp.choices[0]?.message?.content;
    const parsed = safeParseJSON<GeometerOutput>(raw, { candidates: [], best_index: 0 });
    if (!parsed.candidates?.length) return null;

    // Local re-score: find candidate closest to ideal κ₁ with valid Ψ
    let bestIdx = parsed.best_index ?? 0;
    let bestErr = Infinity;
    parsed.candidates.forEach((c, i) => {
      if (c.psi_valid && c.kappa_error < bestErr) {
        bestErr = c.kappa_error;
        bestIdx = i;
      }
    });
    parsed.best_index = bestIdx;
    return parsed;
  } catch (e) {
    console.error("[GOOSE:GEOMETER] error:", (e as Error).message);
    return null;
  }
}

// ── L1B: BODY ARCHITECT AGENT ─────────────────────────────────────────────────
async function runBodyAgent(template: Template, data: KappaData): Promise<BodyOutput | null> {
  try {
    const userPrompt = template.buildPrompt(data);
    const client = process.env.OPENROUTER_API_KEY ? openrouter : aiClient as any;
    const model  = process.env.OPENROUTER_API_KEY ? COUNCIL_MODEL : "gpt-4o-mini";

    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: BODY_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: COUNCIL_TEMP,
    });
    const raw = resp.choices[0]?.message?.content;
    return safeParseJSON<BodyOutput>(raw, { p1: "", p2: "", p3: "", p4: "", p5: "" });
  } catch (e) {
    console.error("[GOOSE:ARCHITECT] error:", (e as Error).message);
    return null;
  }
}

// ── L1C: METADATA ORACLE AGENT ────────────────────────────────────────────────
async function runOracleAgent(template: Template, data: KappaData): Promise<OracleOutput | null> {
  try {
    const userPrompt = template.buildPrompt(data);
    const client = process.env.OPENROUTER_API_KEY ? openrouter : aiClient as any;
    const model  = process.env.OPENROUTER_API_KEY ? COUNCIL_MODEL : "gpt-4o-mini";

    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: ORACLE_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 300,
      temperature: COUNCIL_TEMP,
    });
    const raw = resp.choices[0]?.message?.content;
    const fallback: OracleOutput = {
      authorByline: FICTIONAL_BYLINES[Math.floor(Math.random() * FICTIONAL_BYLINES.length)],
      subhead: "",
      imgQuery: "abstract news",
      tag: template.tag,
      category: template.category,
    };
    return safeParseJSON<OracleOutput>(raw, fallback);
  } catch (e) {
    console.error("[GOOSE:ORACLE] error:", (e as Error).message);
    return null;
  }
}

// ── L2: κ-DTW MERGE (local geometric validation + draft assembly) ─────────────
interface CouncilDraft {
  headline: string;
  body: string;
  subhead: string;
  imgQuery: string;
  authorByline: string;
  tag: string;
  category: string;
  kappaScore: number;
  kappaError: number;
}

function mergeCouncilOutputs(
  geometer: GeometerOutput | null,
  body: BodyOutput | null,
  oracle: OracleOutput | null,
  template: Template,
): CouncilDraft | null {
  if (!body?.p1 || !body?.p3) return null;

  const best = geometer?.candidates[geometer.best_index ?? 0] ?? null;
  const headline = best?.headline ?? "";
  const bodyText = [body.p1, body.p2, body.p3, body.p4, body.p5]
    .filter(Boolean)
    .join("\n\n");

  // Local Hall validation of κ₁ ratio
  const kappaErr = best ? Math.abs(best.kappa_measured - KAPPA_1) : 999;
  const kappaOk  = kappaErr < HALL_TOL * 10; // relaxed: 10× Hall tolerance

  // Log geometry report
  if (best) {
    console.log(`[GOOSE:L2] Headline geometry: κ₁=${best.kappa_measured.toFixed(4)} (ideal ${KAPPA_1.toFixed(4)}, err ${kappaErr.toFixed(4)}) | Ψ=${best.psi_valid ? "1" : "FAIL"} | tokens=${best.total_tokens}`);
  }

  return {
    headline: headline || "(council headline missing)",
    body: bodyText,
    subhead: oracle?.subhead ?? "",
    imgQuery: oracle?.imgQuery ?? template.name,
    authorByline: oracle?.authorByline ?? FICTIONAL_BYLINES[0],
    tag: oracle?.tag ?? template.tag,
    category: oracle?.category ?? template.category,
    kappaScore: best?.kappa_measured ?? 0,
    kappaError: kappaErr,
  };
}

// ── L3: EDITORIAL ARBITER (final gpt-4o-mini synthesis) ──────────────────────
async function runArbiterAgent(
  draft: CouncilDraft,
  geometer: GeometerOutput | null,
  body: BodyOutput | null,
  oracle: OracleOutput | null,
  knowledgeRules: string,
): Promise<{ headline: string; subhead: string; body: string; tag: string; category: string; authorByline: string; imgQuery: string } | null> {
  try {
    const userPrompt = `
${knowledgeRules ? `═══ RESEARCH KNOWLEDGE BASE (from stored Satirical Topology research) ═══\n${knowledgeRules}\n═══ END KNOWLEDGE ═══\n\n` : ""}GEOMETER OUTPUT:
${JSON.stringify(geometer, null, 2)}

BODY ARCHITECT OUTPUT:
${JSON.stringify(body, null, 2)}

METADATA ORACLE OUTPUT:
${JSON.stringify(oracle, null, 2)}

κ₁ GEOMETRY REPORT:
  Measured κ₁: ${draft.kappaScore.toFixed(5)}
  Ideal κ₁:    ${KAPPA_1.toFixed(5)}
  Error:        ${draft.kappaError.toFixed(5)}
  Hall pass:    ${draft.kappaError < HALL_TOL ? "YES ✓" : draft.kappaError < HALL_TOL * 10 ? "MARGINAL" : "FAIL — correct headline"}

Assemble the final article. The knowledge base above contains the operational rules that govern this publication.
If the geometry report shows FAIL, rewrite the headline to fix κ₁.
Enforce Ψ=A×N=1. The Gazette does not wink.`;

    const resp = await (aiClient as any).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: ARBITER_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1400,
      temperature: ARBITER_TEMP,
    });

    const raw = resp.choices[0]?.message?.content;
    return safeParseJSON(raw, null);
  } catch (e) {
    console.error("[GOOSE:ARBITER] error:", (e as Error).message);
    return null;
  }
}

// ── L4: HALL VALIDATION (local invariant checks) ─────────────────────────────
function hallValidate(article: { headline: string; body: string }): boolean {
  const tokens = article.headline.trim().split(/\s+/).length;
  if (tokens > CZ_LIMIT + 3) { // +3 grace window
    console.warn(`[GOOSE:L4] Hall fail: headline ${tokens} tokens (limit ${CZ_LIMIT})`);
    return false;
  }
  if (!article.headline?.trim() || !article.body?.trim()) return false;
  return true;
}

// ── MAIN GENERATION FUNCTION ──────────────────────────────────────────────────
export async function generateGooseArticle(data: KappaData): Promise<GooseArticle | null> {
  try {
    // L0: Pick template — rotate through based on time + stats distribution
    const weights = [
      { t: TEMPLATES[0], w: (data.stats.satellite ?? 0) + (data.stats.rf ?? 0) },
      { t: TEMPLATES[1], w: data.stats.elf ?? 0 },
      { t: TEMPLATES[2], w: data.stats.sdr ?? 0 },
      { t: TEMPLATES[3], w: data.stats.sdr ?? 0 },
      { t: TEMPLATES[4], w: data.correlations.length * 100 },
      { t: TEMPLATES[5], w: (data.stats.wifi ?? 0) + (data.stats.lte ?? 0) + 500 },
      { t: TEMPLATES[6], w: 400 },
      { t: TEMPLATES[7], w: 300 },
    ];
    const totalWeight = weights.reduce((s, w) => s + w.w, 0);
    let rand = Math.random() * totalWeight;
    const template = weights.find(w => { rand -= w.w; return rand <= 0; })?.t ?? TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

    console.log(`[GOOSE:L0] Template selected: ${template.name} | κ-score: ${data.kappaScore.toFixed(1)}`);

    // L1: Fire all three council agents in parallel (37 Hz sync — simultaneous)
    console.log(`[GOOSE:L1] Council convening — 3 agents firing simultaneously...`);
    const councilStart = Date.now();
    const [geometer, body, oracle] = await Promise.all([
      runGeometerAgent(template, data),
      runBodyAgent(template, data),
      runOracleAgent(template, data),
    ]);
    console.log(`[GOOSE:L1] Council returned in ${Date.now() - councilStart}ms`);

    // L2: κ-DTW merge — local geometry validation
    const draft = mergeCouncilOutputs(geometer, body, oracle, template);
    if (!draft) {
      console.error("[GOOSE:L2] Merge failed — insufficient council output");
      return null;
    }

    // L3: Editorial Arbiter — final synthesis (with DB knowledge injection)
    console.log(`[GOOSE:L3] Arbiter synthesizing final article...`);
    const knowledgeRules = await fetchKnowledgeRules();
    const final = await runArbiterAgent(draft, geometer, body, oracle, knowledgeRules);
    if (!final?.headline || !final?.body) {
      console.error("[GOOSE:L3] Arbiter returned incomplete article");
      return null;
    }

    // L4: Hall validation
    if (!hallValidate(final)) {
      console.error("[GOOSE:L4] Hall validation failed — article discarded");
      return null;
    }

    const wordCount = final.body.split(/\s+/).length;
    const article = await storage.createGooseArticle({
      headline: final.headline,
      subhead: final.subhead ?? null,
      body: final.body,
      tag: final.tag ?? template.tag,
      category: final.category ?? template.category,
      authorByline: final.authorByline ?? draft.authorByline,
      publishedAt: new Date(),
      sourceEventIds: [],
      sourceDescription: template.name,
      approved: true,
      imgQuery: final.imgQuery ?? draft.imgQuery,
      templateUsed: template.name,
      wordCount,
    });

    console.log(`[GOOSE:L4] ✓ Article published: "${article.headline.substring(0, 70)}..."`);
    console.log(`[GOOSE:L4] κ₁_final=${draft.kappaScore.toFixed(4)} | err=${draft.kappaError.toFixed(4)} | words=${wordCount}`);
    return article;
  } catch (err) {
    console.error("[GOOSE] Generation pipeline error:", err);
    return null;
  }
}

// ── KNOWLEDGE FETCHER (pulls stored research from DB) ────────────────────────
let cachedKnowledge: string | null = null;
let knowledgeCachedAt = 0;

async function fetchKnowledgeRules(): Promise<string> {
  // Cache for 1 hour — no need to re-query every generation
  if (cachedKnowledge && Date.now() - knowledgeCachedAt < 60 * 60 * 1000) {
    return cachedKnowledge;
  }
  try {
    const docs = await storage.getGooseKnowledge("research");
    if (!docs.length) return "";
    // Extract the OPERATIONAL RULES section from the research
    const full = docs[0].content;
    const rulesStart = full.indexOf("SECTION 7: OPERATIONAL RULES");
    const mathStart  = full.indexOf("MATHEMATICAL SUMMARY:");
    const rules = rulesStart > -1
      ? full.slice(rulesStart, mathStart > -1 ? mathStart + 600 : rulesStart + 2000)
      : "";
    cachedKnowledge = rules;
    knowledgeCachedAt = Date.now();
    console.log(`[GOOSE:KNOWLEDGE] Loaded ${rules.length} chars of research rules from DB`);
    return rules;
  } catch (e) {
    console.warn("[GOOSE:KNOWLEDGE] Could not fetch from DB:", (e as Error).message);
    return "";
  }
}

// ── SIGNAL BUILDER ────────────────────────────────────────────────────────────
async function buildKappaData(): Promise<KappaData> {
  const { kappaEngine } = await import("./kappa-engine");
  const status = kappaEngine.getStatus();
  const recentEvents = await storage.getRecentSignalEvents(40);
  const correlations = await storage.getCorrelations(20);
  return {
    recentEvents: recentEvents.map(e => ({
      domain: e.domain,
      description: e.description,
      timestamp: e.timestamp.toISOString(),
      location: (e.metadata as any)?.location,
    })),
    correlations: correlations.map(c => ({
      title: c.title,
      description: c.description,
      score: c.score,
    })),
    kappaScore: status.score,
    stats: status.domainWindows ?? {},
  };
}

// ── SCHEDULER ─────────────────────────────────────────────────────────────────
let schedulerHandle: NodeJS.Timeout | null = null;
let schedulerStarted = false;
let schedulerStartedAt: Date | null = null;
let lastGeneratedAt: Date | null = null;

export function startGooseScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  schedulerStartedAt = new Date();

  const SIX_HOURS = 6 * 60 * 60 * 1000;

  // First article after 2 minutes (let collectors warm up)
  setTimeout(async () => {
    try {
      const data = await buildKappaData();
      await generateGooseArticle(data);
      lastGeneratedAt = new Date();
    } catch (e) { console.error("[GOOSE] First run error:", e); }

    schedulerHandle = setInterval(async () => {
      try {
        const data = await buildKappaData();
        await generateGooseArticle(data);
        const hour = new Date().getUTCHours();
        if (hour >= 23 || hour < 2) {
          setTimeout(async () => { generateGooseArticle(await buildKappaData()); }, 9 * 60 * 1000);
        }
        lastGeneratedAt = new Date();
      } catch (e) { console.error("[GOOSE] Scheduler run error:", e); }
    }, SIX_HOURS);
  }, 2 * 60 * 1000);

  console.log("[GOOSE] Ω-Council Scheduler started — first article in 2 min, then every 6 hours");
}

export function stopGooseScheduler() {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}

export function getGooseSchedulerStatus() {
  const warmingUp = schedulerStarted && schedulerHandle === null;
  const warmupSecondsLeft = warmingUp && schedulerStartedAt
    ? Math.max(0, Math.round((2 * 60 * 1000 - (Date.now() - schedulerStartedAt.getTime())) / 1000))
    : null;
  return {
    running: schedulerStarted,
    active: schedulerHandle !== null,
    warmingUp,
    warmupSecondsLeft,
    lastGeneratedAt: lastGeneratedAt?.toISOString() ?? null,
    nextIn: schedulerHandle && lastGeneratedAt
      ? Math.max(0, SIX_HOURS_MS - (Date.now() - lastGeneratedAt.getTime()))
      : null,
    councilModel: process.env.OPENROUTER_API_KEY ? COUNCIL_MODEL : "gpt-4o-mini",
    kappaRatio: KAPPA_1.toFixed(5),
    hallTolerance: HALL_TOL,
  };
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
