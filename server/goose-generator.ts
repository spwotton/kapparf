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

// ── REAL COSTA RICA PLACE NAMES (satirical dateline pool) ────────────────────
const CR_REAL_PLACES = [
  "Jacó, Puntarenas",
  "San José, Costa Rica",
  "Escazú, San José",
  "Barrio Escalante, San José",
  "La Uruca, San José",
  "Hatillo, San José",
  "Desamparados, San José",
  "Alajuela, Costa Rica",
  "Heredia, Costa Rica",
  "Cartago, Costa Rica",
  "Turrialba, Cartago",
  "Tres Ríos, La Unión",
  "Liberia, Guanacaste",
  "Tamarindo, Guanacaste",
  "Nosara, Guanacaste",
  "Sámara, Guanacaste",
  "Nicoya, Guanacaste",
  "Quepos, Puntarenas",
  "Dominical, Puntarenas",
  "Uvita, Puntarenas",
  "Puerto Limón, Limón",
  "Cahuita, Limón",
  "Puerto Viejo, Limón",
  "San Ramón, Alajuela",
  "Grecia, Alajuela",
  "Naranjo, Alajuela",
  "Santo Domingo, Heredia",
  "San Pablo, Heredia",
  "Barva, Heredia",
  "Moravia, San José",
  "Curridabat, San José",
  "Tibás, San José",
  "Zapote, San José",
  "Santa Ana, San José",
  "Ciudad Colón, San José",
  "La Sabana, San José",
  "Los Yoses, San José",
];

// ── TICO COLLOQUIAL VOICE LAWS (injected into body & arbiter prompts) ─────────
const TICO_VOICE_LAWS = `
TICO COLLOQUIAL VOICE (Costa Rica specificity rules):
  DATELINE: Always use a real Costa Rican place from this approved pool —
    Jacó / Escazú / Barrio Escalante / La Uruca / Turrialba / Liberia / Quepos /
    Cahuita / San Ramón / Moravia / Tibás / Curridabat / Santo Domingo de Heredia /
    Tamarindo / Puerto Viejo / Tres Ríos / La Sabana / Los Yoses / Nosara / Uvita.
  PLACE SPECIFICITY: When naming a location inside the article, use the real neighborhood or canton,
    never "downtown" or "the capital." Prefer "near the Periférico exit at Hatillo 8" over "in San José."
  LOCAL OFFICIALS: Tico bureaucrats quote using formal Spanish syntax translated into English.
    Example: "The Ministry of Infrastructure and Territorial Ordering has confirmed the situation
    is being addressed with the appropriate inter-institutional coordination framework."
  LOCAL COLOR: Exactly ONE background witness or bystander may use a mild colloquial expression
    translated into flat English — "a man who identified himself only as Don Beto stated the
    situation was, quote, 'a real chunche'" or "a resident described the development as 'tuanis,
    actually.'" This is the ONE permitted informal note. The reporter does not editorialize.
  COLONES: Monetary amounts use colones (₡) not dollars unless the entity is foreign.
    Example: "₡47,000 in damages" not "$80."
  NEVER: "pura vida" as a sign-off or joke punchline. It appears only in direct quotes from locals.
`;

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
Your ONLY job: write exactly 4 paragraphs following the Onion AP-wire structure. MINIMUM 300 words total.

${AP_INVARIANT}

BODY STRUCTURE — 4 PARAGRAPHS (Onion canonical form):
  P1 — SITUATION ESTABLISHED (DATELINE):
    Use one real Costa Rican dateline: JACÓ, PUNTARENAS — or ESCAZÚ, SAN JOSÉ — or BARRIO ESCALANTE, SAN JOSÉ —
    or TURRIALBA, CARTAGO — or LIBERIA, GUANACASTE — or QUEPOS, PUNTARENAS — or CAHUITA, LIMÓN —
    or MORAVIA, SAN JOSÉ — or LA URUCA, SAN JOSÉ — or CURRIDABAT, SAN JOSÉ, etc.
    Never use a generic city. Use the specific canton or district.
    AP wire lead sentence: contains the ENTIRE absurd premise stated as boring fact.
    Include exact numbers, exact times, exact coordinates, exact percentages. Nothing is framed as unusual.
    This paragraph answers: Who did what. The premise is completely insane. The sentence is completely routine.
    Write 3-5 sentences. End with a figure so specific it could only have been measured.

  P2 — OFFICIAL QUOTED (the screenshot paragraph):
    A named official is quoted. The official's NAME is invented but their TITLE is bureaucratically real.
    Title examples: "Deputy Director of Regional Compliance and Structural Assessment",
    "Senior Coordinator, Office of Aerial and Atmospheric Baseline Standards",
    "Chief Signal Integrity Officer, National Telecommunications Infrastructure Division"
    The QUOTE contains 1-2 sentences in which the official:
      (a) uses precise technical vocabulary to describe something that cannot be described that way
      (b) says the situation is "within established parameters" or "consistent with observed norms"
      (c) mentions a specific unit of measurement that should not exist in this context
    After the quote, add 2-3 sentences of straight-faced follow-up detail.
    Write 4-6 sentences total.

  P3 — COMPLICATION:
    Things are now worse or stranger than P1. Something additional has happened or been discovered.
    A second institution or expert is mentioned. They have not coordinated with the first.
    Their finding is slightly different. Neither acknowledges the other.
    Include at least one invented proper noun (a study, a report title, a council, a form number).
    Write 4-6 sentences.

  P4 — RESOLUTION THAT CHANGES NOTHING:
    The institution responsible for the situation provides a statement.
    The statement is technically responsive. It confirms nothing. It promises review.
    A timeline is mentioned. The timeline is not a deadline.
    The final sentence of P4 is the most boring possible thing that could end an article.
    The goose has already left the building. Write 3-5 sentences.

WORD COUNT: P1+P2+P3+P4 MUST total at least 300 words. Write full, complete paragraphs.

${TICO_VOICE_LAWS}

Output ONLY valid JSON (no markdown):
{ "p1": "string", "p2": "string", "p3": "string", "p4": "string" }`;

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
  tag: exactly ONE of: BREAKING | SOCIETY | SCIENCE | MARITIME | OBITUARIES | BUSINESS | LOCAL | OPINION | WILDLIFE | POLITICS | WORLD | CULTURE | DIPLOMACY | DEFENSE | CYBER
  category: exactly ONE of: news | society | science | maritime | obituaries | business | local | opinion | wildlife | politics | world | culture | diplomacy | defense | cyber

Output ONLY valid JSON (no markdown):
{ "authorByline": "string", "subhead": "string", "imgQuery": "string", "tag": "string", "category": "string" }`;

const ARBITER_SYSTEM = `You are the EDITORIAL ARBITER for The Goose Gazette.
You receive outputs from three specialized council agents. Your job is final synthesis and quality enforcement.

${AP_INVARIANT}

${TICO_VOICE_LAWS}

══ HEADLINE LAW — The Onion Formula ══
Every headline MUST follow one of these two structures:
  A) "Area [Noun] [Does/Reports/Confirms] [Specific Absurd Thing]; [Mundane Consequence Stated Matter-of-Factly]"
     Example: "Area Man Achieves Full Understanding Of Medicare Part D; Plans To Explain It To Neighbor"
  B) "[Entity] [Verb Phrase]; [Observation No One Asked For]"
     Example: "Earth Completes Annual Orbit Of Sun For 4.5 Billionth Consecutive Year"
Rules:
  - Hard limit: ≤ ${CZ_LIMIT} word tokens. Count carefully. Cut words, not ideas.
  - Must contain exactly ONE absurd element and ONE completely straight element (Ψ=A×N=1).
  - The absurd element goes LAST, after a semicolon, comma, or "As".
  - NEVER use: bizarre, strange, oddly, surprisingly, somehow, unbelievably.
  - ALWAYS use AP wire verbs: confirmed, noted, stated, reported, indicated, acknowledged.
  - If the GEOMETER headline does not follow the Onion formula, REWRITE IT. Do not use a bad headline.

══ BODY LAW — 4 Paragraphs, Minimum 300 Words ══
  Assemble: body = p1 + "\\n\\n" + p2 + "\\n\\n" + p3 + "\\n\\n" + p4
  Do NOT add paragraphs. Do NOT remove paragraphs. Assemble verbatim.
  If the body is under 300 words, EXPAND each paragraph proportionally to reach ≥300 words before assembling.
  Structure must be: [Situation] → [Official Quoted] → [Complication] → [Resolution That Changes Nothing]

══ BYLINE LAW ══
  authorByline MUST follow the format: "Firstname Lastname, Beat Title"
  The COMMA is required. It separates the name from the beat.
  The BEAT must be pompous and specific. Examples:
    "Wellington Feather-Beak, Municipal Affairs Correspondent"
    "Prudence Honksworth, Infrastructure & Signals Desk"
    "Algernon Q. Plumage III, Regional Bureau Chief, Central American Operations"
  Use the ORACLE's byline if it contains a comma. Otherwise REPLACE IT with a new one following this format.

══ SUBHEAD LAW ══
  The subhead EXTENDS the joke — it does NOT summarize or explain the headline.
  It adds one specific concrete detail that makes the situation worse, or reveals the next absurd layer.
  It must read as completely straight AP wire copy.
  10-20 words. Never use the same key words as the headline.
  BAD: "Geese Found Near Airport, Officials Say" (summarizes headline)
  GOOD: "Formation Maintained For 47 Minutes Before Dispersing Toward Terminal B Without Incident" (extends it)

══ FINAL CHECKS ══
  1. Scan headline: remove any word that signals the joke. Replace with AP language.
  2. Confirm authorByline contains a comma.
  3. Confirm subhead is non-empty and does not repeat headline words verbatim.
  4. Confirm body has exactly 4 double-newline-separated paragraphs.
  5. The Goose Gazette does not wink, does not explain, does not apologize.

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

interface BodyOutput { p1: string; p2: string; p3: string; p4: string }
interface OracleOutput { authorByline: string; subhead: string; imgQuery: string; tag: string; category: string }

type Template = {
  name: string;
  tag: string;
  category: string;
  buildPrompt: (data: KappaData) => string;
};

// ── JACÓ CAST ALIASES (mirrored from client/src/lib/goose-personas.ts) ────────
// These aliases are the public-facing names used in articles. NEVER use real names.
const JACO_CAST_ALIASES = [
  { alias: "Dave Mira",          role: "area entrepreneur",         beat: "Jacó" },
  { alias: "Lila Quacksworth",   role: "local resident",            beat: "Jacó" },
  { alias: "Gerald Stonepath",   role: "area businessman",          beat: "Jacó" },
  { alias: "Biff Talonforth",    role: "telecommunications worker",  beat: "Jacó" },
  { alias: "Pierre Baguette",    role: "local official",            beat: "Jacó" },
];

/** Returns a random cast alias ~40% of the time, null otherwise */
function pickPersona(): typeof JACO_CAST_ALIASES[0] | null {
  if (Math.random() > 0.40) return null;
  return JACO_CAST_ALIASES[Math.floor(Math.random() * JACO_CAST_ALIASES.length)];
}

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
Dateline: pick ONE specific real CR place — Jacó, Escazú, Barrio Escalante, Turrialba, Liberia, Quepos, Moravia, Tibás, La Uruca, Curridabat, Cahuita, Nosara, etc. Never generic.
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

  // ── EXPANDED POOL: 15 templates (Task #48) ───────────────────────────────────
  {
    name: "politics_study",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Domestic politics / Governance
ARTICLE CONCEPT: A government committee has released a 400-page study confirming that the thing everyone wanted confirmed is confirmed. The committee is now dissolved. A new committee will be formed to study the first committee's findings. Dateline: San José, Cartago, or Heredia.
Punchline: The scope of the second committee. It is narrower than the first.`,
  },
  {
    name: "diplomacy_bilateral",
    tag: "DIPLOMACY",
    category: "diplomacy",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Bilateral diplomacy / International relations
ARTICLE CONCEPT: Two countries have agreed to "strengthen ties." The ties in question are not specified. A joint statement was issued. The statement contains the phrase "mutual benefit" four times. Neither ambassador was available for comment. A third country issued a separate statement describing itself as "supportive."
Dateline: San José, Washington D.C., or Geneva. Use real diplomatic boilerplate.`,
  },
  {
    name: "defense_procurement",
    tag: "DEFENSE",
    category: "defense",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Defense procurement / Military affairs
ARTICLE CONCEPT: A defense contractor has delivered a procurement item described as "mission-critical" that is either (a) two years late and one-third of its original specifications, or (b) fully functional but for a purpose no longer required. The contract was renewed. The procurement office issued a statement describing the outcome as "within acceptable parameters."
Use real procurement terminology. No specific countries named — "the ministry," "the contractor," "the program."`,
  },
  {
    name: "world_summit",
    tag: "WORLD",
    category: "world",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: International summit / Multilateral conference
ARTICLE CONCEPT: An international summit has concluded with a communiqué. The communiqué reaffirms existing commitments. Delegates described the summit as "productive." One delegation described it as "historic." No definition of historic was provided. The next summit has been scheduled.
Dateline: Vienna, Geneva, or Davos. One country's delegate quotes must be diplomatically evasive.`,
  },
  {
    name: "culture_report",
    tag: "CULTURE",
    category: "culture",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Cultural trends / Arts
ARTICLE CONCEPT: A cultural phenomenon — a genre, a dance, a phrase, an aesthetic — has been declared "over" by an expert. A separate expert has declared it "back." Both experts agree it is "interesting." A third expert says "it was never really gone." Dateline: Barrio Escalante, San José, or Quepos.
The phenomenon should be something mundane: a color, a jacket style, a way of greeting people.`,
  },
  {
    name: "cyber_incident",
    tag: "CYBER",
    category: "cyber",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Cybersecurity / Network incident
KAPPA score: ${d.kappaScore.toFixed(1)}
WiFi events: ${d.stats.wifi ?? 0}, LTE: ${d.stats.lte ?? 0}
ARTICLE CONCEPT: An organization has disclosed a "cybersecurity incident" in which the affected systems were "contained." The nature of the incident is described as "consistent with known threat patterns." Nothing specific about the threat, the systems, or the containment is disclosed. The organization is committed to "transparency" and will provide updates "as the situation develops."
Punchline: The last line of the disclosure document. It contains a warranty disclaimer.`,
  },
  {
    name: "narco_sub",
    tag: "MARITIME",
    category: "maritime",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Maritime interdiction / Pacific coast trafficking
ARTICLE CONCEPT: Authorities have intercepted a semi-submersible vessel in the Pacific Ocean near Costa Rica. The vessel contained a large quantity of something described as "consistent with controlled substances pending laboratory confirmation." The crew was apprehended. A spokesperson confirmed the interdiction was "consistent with ongoing operations." No additional details were available. Dateline: Pacific Ocean off Quepos or the Nicoya Peninsula.`,
  },
  {
    name: "lithium_treaty",
    tag: "DIPLOMACY",
    category: "diplomacy",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Natural resource diplomacy / Minerals
ARTICLE CONCEPT: A country with significant lithium, rare earth, or mineral reserves has entered negotiations with a foreign partner. The partnership is described as "strategic." The terms are "commercially sensitive." An economist describes the deal as "significant." A second economist describes it as "not necessarily significant in isolation." A government spokesperson says both economists are correct.
Use a real Central or South American dateline. No fictional countries.`,
  },
  {
    name: "un_resolution",
    tag: "WORLD",
    category: "world",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: UN / Multilateral resolution
ARTICLE CONCEPT: The United Nations General Assembly has passed a non-binding resolution reaffirming a principle it previously affirmed. The vote was 147-3, with 12 abstentions. The three dissenting countries issued separate statements. One abstaining country issued a statement explaining its abstention in terms that are technically an endorsement. The principle in question is described as "fundamental."
Dateline: New York or Geneva. Use real UNGA procedural language.`,
  },
  {
    name: "border_dispute",
    tag: "WORLD",
    category: "world",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Territorial / Border dispute
ARTICLE CONCEPT: Two neighboring countries have described a disputed area using different maps. Both maps are described as "authoritative." A third party has offered to mediate. Neither country has responded to the offer. A spokesperson for the mediating party confirmed they had sent a letter. The letter is "under review." The area in dispute is approximately the size of a shopping mall parking lot.
Dateline: Central America or Caribbean. Real geography, fictional specific incident.`,
  },
  {
    name: "foreign_troops",
    tag: "DEFENSE",
    category: "defense",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Military presence / Foreign troops
ARTICLE CONCEPT: A country has confirmed the presence of foreign military personnel on its territory for purposes described as "training" and "capacity building." The number of personnel is "not publicly disclosed for operational reasons." A spokesperson confirmed the presence is "temporary" without providing a timeline. A neighboring country issued a statement describing the development as "noted." No further comment.
Dateline: Central America. Tone: completely neutral wire copy.`,
  },
  {
    name: "espionage_expulsion",
    tag: "WORLD",
    category: "world",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Intelligence / Diplomatic expulsion
ARTICLE CONCEPT: A country has expelled a foreign diplomat for activities described as "incompatible with diplomatic status." The diplomat's country of origin has expelled a diplomat in response. Both countries described their actions as "proportionate." The original diplomat's activities were not specified. The retaliatory expulsion's target's activities were also not specified. Relations between the two countries are described as "normal" by both foreign ministries.`,
  },
  {
    name: "subsea_cable",
    tag: "SCIENCE",
    category: "science",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Submarine infrastructure / Telecom
KAPPA score: ${d.kappaScore.toFixed(1)}
SDR detections: ${d.stats.sdr?.toLocaleString() ?? "unknown"}
ARTICLE CONCEPT: A submarine fiber optic cable has experienced an "unplanned service interruption" in the Pacific or Caribbean. The cause is "under investigation." Internet traffic was "rerouted through alternative paths," which experienced "increased latency." The cable's owners confirmed the interruption was "not related to" three specific things they listed. They did not explain why they felt the need to exclude those three things.
Use real cable names or realistic fictional ones (e.g., "CAC-1," "ARCOS-1," "Pacific Jade").`,
  },
  {
    name: "parade_incident",
    tag: "LOCAL",
    category: "local",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Local civic event / Public ceremony
ARTICLE CONCEPT: A civic parade or public ceremony in a Costa Rican city has experienced a logistical complication described by organizers as "minor" and by participants as "significant." The complication involved either (a) a vehicle blocking a route, (b) a sound system playing the wrong thing at the wrong moment, or (c) an animal entering the parade formation. Officials confirmed it was "handled." Dateline: Jacó, Liberia, Alajuela, or San José. One specific mundane detail must be stated twice.`,
  },
  {
    name: "tech_launch",
    tag: "BUSINESS",
    category: "business",
    buildPrompt: (_d) => `
SIGNAL DOMAIN: Technology sector / Product launch
ARTICLE CONCEPT: A technology company has launched a product that solves a problem the company identified in a press release. The problem was not previously known to exist. The product costs $49 per month. The company's CEO described the problem as "pervasive." An analyst described the market size as "significant." A user described the product as "fine, I guess." Dateline: San José technology district or Silicon Valley. Use real startup press release language.`,
  },

  // ── EXPANDED POOL: 19 new category seeds (Task #76) ─────────────────────────
  {
    name: "sovereignty-nest",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Territorial sovereignty / infrastructure dispute
KAPPA score: ${d.kappaScore.toFixed(1)}
Recent events: ${d.recentEvents.filter(e => ["satellite","rf","wifi"].includes(e.domain)).slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: An animal or creature has established a nesting site inside a piece of contested critical infrastructure — a telecommunications tower, a relay antenna, or a border marker. Officials from at least two parties cannot agree on jurisdiction. A wildlife officer is called. The wildlife officer does not help.
Dateline: pick ONE specific real CR location — Manzanillo, Gandoca, Puerto Viejo, Golfito, Barra del Colorado, Tortuguero, Sixaola, or Cahuita.
Punchline position: Final paragraph — the infrastructure operator's press release notes the animal "has not vacated as of press time."`,
  },
  {
    name: "defense-theater",
    tag: "DEFENSE",
    category: "defense",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Defense procurement / military capability announcement
KAPPA score: ${d.kappaScore.toFixed(1)}
Radar detections: ${d.stats.radar ?? 0}
Recent aerial events: ${d.recentEvents.filter(e => e.domain === "satellite").slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A government ministry announces a new national security capability. The capability is a repurposed civilian vehicle or consumer product with a modification that is described in the press release using a technical-sounding term. A defense analyst quotes a figure. The figure is not in dispute. The capability is also not in dispute. What is in dispute is whether it qualifies as a capability.
Dateline: pick a CR city — San José, Liberia, Limón, Puntarenas, Quepos, or Pérez Zeledón.
Punchline position: The ministry's spokesperson says it "represents a generational leap in deterrence posture."`,
  },
  {
    name: "arms-fair-neutrality",
    tag: "DIPLOMACY",
    category: "diplomacy",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Multi-party diplomatic offer / arms cooperation
KAPPA score: ${d.kappaScore.toFixed(1)}
Correlation count: ${d.correlations.length}
Top correlation: ${d.correlations[0]?.title ?? "undisclosed diplomatic signal"}

ARTICLE CONCEPT: Three foreign governments simultaneously extend different forms of "security cooperation" to a small neutral country. The offers are mutually exclusive. The small country declines all three and instead formalizes an arrangement with a fourth party that was not present. The fourth party's identity is described in the official communiqué using a word that is not a proper noun.
Punchline position: A spokesperson for the neutral country says the outcome "reflects the doctrine as written."`,
  },
  {
    name: "cyber-command",
    tag: "DEFENSE",
    category: "defense",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Cyber / electronic warfare unit
KAPPA score: ${d.kappaScore.toFixed(1)}
WiFi events: ${d.stats.wifi ?? 0}
LTE events: ${d.stats.lte ?? 0}
Recent RF events: ${d.recentEvents.filter(e => e.domain === "rf").slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A government establishes a new cyber defense unit. Its operational inventory is disclosed in a procurement document. The document is public. Analysts review the document. The analysts' findings are stated as findings. The unit's first confirmed operation involved a platform that is also used for something unrelated to defense, stated flatly.
Dateline: pick a CR city — San José, Heredia, Cartago, or Alajuela.
Punchline position: The unit's director says the results "exceeded modeled projections" without specifying the model.`,
  },
  {
    name: "treaty-port",
    tag: "DIPLOMACY",
    category: "diplomacy",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Port infrastructure / treaty negotiation
KAPPA score: ${d.kappaScore.toFixed(1)}
Total events in system: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}

ARTICLE CONCEPT: A foreign government proposes construction of a port facility. Negotiations proceed for a specific number of months listed in the article. At the conclusion of negotiations, the status of the port is unchanged from the start of negotiations. A communiqué is issued. The communiqué uses the word "progress." An official says what was agreed to. What was agreed to is described in the final sentence.
Dateline: Puntarenas, Limón, or Quepos port authority.
Punchline position: The final sentence of the communiqué is quoted in full.`,
  },
  {
    name: "lithium-mine",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Resource extraction / foreign investment dispute
KAPPA score: ${d.kappaScore.toFixed(1)}
Recent events: ${d.recentEvents.filter(e => e.domain === "seismic").slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: Unverified reports circulate that a foreign entity has attempted to acquire rights to a mineral deposit. The reports are denied. The denial is specific in some respects and non-specific in others. A wildlife or agricultural incident occurs at the site described in the reports. Authorities note the timing is "coincidental." The wildlife or agricultural incident is described in detail. The mineral deposit is not.
Dateline: Guanacaste, Santa Cruz, or Nicoya.
Punchline position: The relevant ministry says it has "received the report and is reviewing its parameters."`,
  },
  {
    name: "un-resolution",
    tag: "DIPLOMACY",
    category: "diplomacy",
    buildPrompt: (d) => `
SIGNAL DOMAIN: International body / multilateral vote
KAPPA score: ${d.kappaScore.toFixed(1)}
Correlations scored: ${d.correlations.length}

ARTICLE CONCEPT: An international deliberative body convenes to address a situation involving a small nation. The session lasts a specific number of hours stated in the article. A permanent member exercises a procedural mechanism. The stated reason for the procedural mechanism concerns an event that occurred before any living delegate was born. The session ends. The situation is unchanged. An observer calls the outcome "not unexpected."
Punchline position: The observer's organization is named in the final sentence. Its mandate is also named.`,
  },
  {
    name: "psyop-counter-goose",
    tag: "DEFENSE",
    category: "defense",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Psychological operations / information warfare
KAPPA score: ${d.kappaScore.toFixed(1)}
Total events: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}
Recent correlations: ${d.correlations.slice(0,2).map(c => c.title).join("; ")}

ARTICLE CONCEPT: A leaked or declassified document describes a plan to destabilize a target country using a non-military asset. The non-military asset is named in the document. In response, the target country deploys a counter-asset that is also non-military. The counter-asset is described in the article in the same neutral, declarative language as the original plan. A spokesperson for neither party is reached for comment. The plan and counter-plan are both ongoing.
Punchline position: The document's classification level is stated at the end.`,
  },
  {
    name: "border-wall",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Border infrastructure / migration policy
KAPPA score: ${d.kappaScore.toFixed(1)}
Recent events: ${d.recentEvents.slice(0,3).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A government constructs or announces a barrier on a shared border. A second government responds with a countermeasure. The countermeasure addresses the barrier. The barrier is then adjusted to address the countermeasure. This exchange continues for a specific number of iterations stated in the article. The final state of the barrier and countermeasure is described neutrally. No migration figure changes.
Dateline: Panama border, Paso Canoas, or Los Chiles.
Punchline position: A border official says the current configuration "remains under assessment."`,
  },
  {
    name: "narco-sub",
    tag: "BREAKING",
    category: "news",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Maritime interdiction / narcotics traffic
KAPPA score: ${d.kappaScore.toFixed(1)}
Recent events: ${d.recentEvents.filter(e => ["satellite","rf"].includes(e.domain)).slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A semi-submersible vessel is detected and intercepted off the Pacific coast. Authorities name the vessel's detected position using coordinates. The interception report is filed. The report includes a finding that is not related to narcotics. The finding is stated in one sentence. The interception otherwise proceeds as documented. A spokesperson confirms the operation was "consistent with protocol."
Dateline: Quepos, Jacó, or Osa Peninsula coast.
Punchline position: The non-narcotics finding from the interception report, stated in the final sentence without editorializing.`,
  },
  {
    name: "cyber-treasury",
    tag: "BUSINESS",
    category: "business",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Government cybersecurity breach / financial system
KAPPA score: ${d.kappaScore.toFixed(1)}
WiFi events: ${d.stats.wifi ?? 0}
Recent network events: ${d.recentEvents.filter(e => e.domain === "wifi").slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: Unauthorized access to a government financial system is detected. The scope of the intrusion is determined. What the intruders accessed is disclosed. What the intruders chose to do with the access is stated in one sentence. An IT official describes the response measures taken. The response measures are standard. The statement about what the intruders chose to do is not followed up.
Dateline: San José, Ministerio de Hacienda or equivalent body.
Punchline position: What the intruders chose to do, stated flatly in the final paragraph.`,
  },
  {
    name: "surveillance-drone",
    tag: "DEFENSE",
    category: "defense",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Unmanned aerial vehicle / surveillance program
KAPPA score: ${d.kappaScore.toFixed(1)}
Radar detections: ${d.stats.radar ?? 0}
Recent aerial events: ${d.recentEvents.filter(e => e.domain === "satellite").slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A government agency deploys an aerial surveillance asset. The asset's specifications are disclosed in a procurement filing. The filing names the asset's primary sensor. The asset is deployed. What it detects on its first operational day is disclosed in a subsequent incident report. The incident report is also public. A spokesperson says the data will be "retained for 90 days in accordance with policy."
Dateline: pick a CR location — Nosara, Tamarindo, Drake Bay, or La Fortuna.
Punchline position: The first-day detection, stated in the final paragraph.`,
  },
  {
    name: "troop-agreement",
    tag: "DIPLOMACY",
    category: "diplomacy",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Foreign military presence / bilateral agreement
KAPPA score: ${d.kappaScore.toFixed(1)}
Correlations: ${d.correlations.slice(0,2).map(c => c.title).join("; ")}

ARTICLE CONCEPT: A bilateral agreement authorizes a foreign military contingent to operate in a neutral country for a stated purpose and a stated duration. Both the purpose and the duration are disclosed. The contingent arrives. An inspection regime is established. The inspection regime's frequency is listed. An inspection occurs. The inspection finding is disclosed. The finding's relevance to the stated purpose is not addressed in the official statement.
Punchline position: The inspection finding, in the final sentence.`,
  },
  {
    name: "trade-bloc",
    tag: "BUSINESS",
    category: "business",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Regional economic bloc / trade agreement
KAPPA score: ${d.kappaScore.toFixed(1)}
Total events: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}

ARTICLE CONCEPT: A multi-nation economic forum convenes. An agenda item is proposed by one member. The agenda item is specific. Deliberations last a specific number of hours. The agenda item is modified. What it was changed to is stated in one sentence. Three nations sign. One nation's representative says the agreement "reflects regional priorities." The one nation that did not sign is named. Its reason is stated.
Punchline position: The non-signing nation's stated reason, final sentence.`,
  },
  {
    name: "espionage",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Foreign intelligence activity / counterintelligence
KAPPA score: ${d.kappaScore.toFixed(1)}
Recent events: ${d.recentEvents.filter(e => ["satellite","rf"].includes(e.domain)).slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: An individual is detained near a site of national interest while conducting an activity that is not itself illegal. The activity is named. The site is named. Officials describe what makes the site notable. The detained individual gives a statement. The statement is quoted. The individual is released. A follow-up inquiry is opened. The inquiry's scope is described. The scope does not include the site.
Dateline: Arenal, Poás, Irazú, or a named hydroelectric facility.
Punchline position: The inquiry's stated scope, final sentence.`,
  },
  {
    name: "honk-doctrine",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Foreign policy doctrine / neutrality framework
KAPPA score: ${d.kappaScore.toFixed(1)}
Correlation count: ${d.correlations.length}

ARTICLE CONCEPT: A government releases a formal foreign policy doctrine. The doctrine is named. Its key principle is stated in one sentence by an official. The principle is distinctive. Embassies are notified. One embassy responds publicly. The embassy's response uses the word "noted." The doctrine's implementation schedule is disclosed. The first implementation step is described. The implementation step is small and specific.
Punchline position: The first implementation step, final paragraph, stated flatly.`,
  },
  {
    name: "subsea-cable",
    tag: "BUSINESS",
    category: "business",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Subsea telecommunications cable / internet infrastructure
KAPPA score: ${d.kappaScore.toFixed(1)}
LTE events: ${d.stats.lte ?? 0}
WiFi events: ${d.stats.wifi ?? 0}
Recent events: ${d.recentEvents.filter(e => ["rf","wifi"].includes(e.domain)).slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A major undersea data cable reaches a landing point. The cable's capacity is stated in the press release. A redundancy incident occurs within a specific time window after landing. The cause is investigated. The investigation names the cause. The named cause is unexpected. The telecom operator's recovery measure is stated. Its estimated resolution date is given. The date is specific.
Dateline: Limón or Puntarenas coast.
Punchline position: The named cause of the redundancy incident, stated flatly in the final paragraph.`,
  },
  {
    name: "legislative-amendment",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Legislative process / procedural amendment
KAPPA score: ${d.kappaScore.toFixed(1)}
Total events in system: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}

ARTICLE CONCEPT: A legislative body debates a proposed amendment. The amendment's title and stated purpose are given. During committee proceedings, testimony is offered by an expert witness. The expert witness is identified by name and credential. Their testimony addresses the amendment's stated purpose. It also addresses something the amendment does not mention. The committee notes the second point. The amendment passes with language unchanged.
Punchline position: The expert witness's second point, stated in the final sentence without editorializing.`,
  },
  {
    name: "island-claim",
    tag: "POLITICS",
    category: "politics",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Territorial claim / maritime jurisdiction
KAPPA score: ${d.kappaScore.toFixed(1)}
Recent events: ${d.recentEvents.filter(e => ["satellite","rf"].includes(e.domain)).slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: An international consortium or corporate entity files a claim over a remote island territory citing a specific legal instrument. The island's population at time of filing is stated. A counter-claim is registered by a second party. The second party's legal basis is different from the first. Arbitration is agreed to. The arbitration body's expected timeline is stated. In the interim, an activity begins on the island. The activity is named. It is not related to either claim.
Dateline: Isla del Coco, Isla Uvita, or Caño Island Biological Reserve.
Punchline position: The unrelated activity now underway, stated in the final sentence.`,
  },
  {
    name: "military-parade",
    tag: "LOCAL",
    category: "local",
    buildPrompt: (d) => `
SIGNAL DOMAIN: Public ceremony / civic event
KAPPA score: ${d.kappaScore.toFixed(1)}
Recent events: ${d.recentEvents.slice(0,2).map(e => e.description).join(" | ")}

ARTICLE CONCEPT: A national civic ceremony or parade takes place. The event's official theme is named. Each element of the procession is described in order, in one clause each, in AP wire style. The final element of the procession is unexpected relative to the preceding elements. It is described in the same declarative register as the others. No official comments on the final element. An attendee's reaction is quoted. The attendee describes the overall event as "very organized."
Dateline: San José, Paseo Colón, or Plaza de la Democracia.
Punchline position: The final procession element and the attendee quote together in the closing paragraph.`,
  },
];

// ── LORE SEED INTEGRATION: pick a seed 25% of the time ───────────────────────
export function pickLoreSeed(): string | null {
  const seeds: Array<{ story: string; used: number }> = (global as any).__gooseLoreSeeds ?? [];
  if (!seeds.length || Math.random() > 0.25) return null;
  // prefer seeds used fewer times
  const seed = seeds.sort((a, b) => a.used - b.used)[0];
  seed.used++;
  return seed.story;
}

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
async function runGeometerAgent(template: Template, data: KappaData, humorPreamble: string = ""): Promise<GeometerOutput | null> {
  try {
    const loreSeed = pickLoreSeed();
    const loreBlock = loreSeed ? `\nLORE SEED (weave this real story subtly into background detail — do NOT quote it directly):\n${loreSeed.slice(0, 400)}\n` : "";
    const userPrompt = (humorPreamble ? humorPreamble + "\n\n" : "") + template.buildPrompt(data) + loreBlock;
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
async function runBodyAgent(template: Template, data: KappaData, humorPreamble: string = ""): Promise<BodyOutput | null> {
  try {
    const userPrompt = (humorPreamble ? humorPreamble + "\n\n" : "") + template.buildPrompt(data);
    const client = process.env.OPENROUTER_API_KEY ? openrouter : aiClient as any;
    const model  = process.env.OPENROUTER_API_KEY ? COUNCIL_MODEL : "gpt-4o-mini";

    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: BODY_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 1400,
      temperature: COUNCIL_TEMP,
    });
    const raw = resp.choices[0]?.message?.content;
    return safeParseJSON<BodyOutput>(raw, { p1: "", p2: "", p3: "", p4: "" });
  } catch (e) {
    console.error("[GOOSE:ARCHITECT] error:", (e as Error).message);
    return null;
  }
}

// ── L1C: METADATA ORACLE AGENT ────────────────────────────────────────────────
async function runOracleAgent(template: Template, data: KappaData, humorPreamble: string = ""): Promise<OracleOutput | null> {
  try {
    const userPrompt = (humorPreamble ? humorPreamble + "\n\n" : "") + template.buildPrompt(data);
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
  const bodyText = [body.p1, body.p2, body.p3, body.p4]
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
  persona: { alias: string; role: string; beat: string } | null,
): Promise<{ headline: string; subhead: string; body: string; tag: string; category: string; authorByline: string; imgQuery: string } | null> {
  try {
    const personaBlock = persona
      ? `\n═══ PERSONA DIRECTIVE ═══\nThis article must naturally feature "${persona.alias}", described as "${persona.role}" from ${persona.beat}.\nThey can appear as a witness, resident quoted, or subject of the article — but NOT as the official source.\nUse the alias exactly. Do not use any other name for this person.\n═══ END PERSONA ═══\n`
      : "";

    const userPrompt = `
${knowledgeRules ? `═══ RESEARCH KNOWLEDGE BASE (from stored Satirical Topology research) ═══\n${knowledgeRules}\n═══ END KNOWLEDGE ═══\n\n` : ""}${personaBlock}GEOMETER OUTPUT:
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

Assemble the final article following ALL headline, body, byline, and subhead laws in your system prompt.
If the geometry report shows FAIL, rewrite the headline to fix κ₁.
Enforce Ψ=A×N=1. The Gazette does not wink. The Gazette does not explain. The Gazette walks away.`;

    const resp = await (aiClient as any).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: ARBITER_SYSTEM },
        { role: "user",   content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1800,
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
interface HallResult { ok: boolean; reason?: string }

function hallValidate(article: { headline: string; subhead?: string | null; body: string; authorByline?: string | null }): HallResult {
  const tokens = article.headline.trim().split(/\s+/).length;
  if (tokens > CZ_LIMIT + 3) {
    return { ok: false, reason: `headline ${tokens} tokens (limit ${CZ_LIMIT})` };
  }
  if (!article.headline?.trim() || !article.body?.trim()) {
    return { ok: false, reason: "missing headline or body" };
  }
  // Check subhead is non-empty
  if (!article.subhead?.trim()) {
    return { ok: false, reason: "subhead is empty" };
  }
  // Check body has ≥ 4 paragraphs (separated by double newlines)
  const paragraphs = article.body.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 4) {
    return { ok: false, reason: `body has ${paragraphs.length} paragraphs (need ≥4)` };
  }
  // Check body is ≥ 300 words
  const wordCount = article.body.trim().split(/\s+/).length;
  if (wordCount < 300) {
    return { ok: false, reason: `body is ${wordCount} words (need ≥300)` };
  }
  // Check authorByline contains a comma (Name, Beat format)
  if (!article.authorByline?.includes(",")) {
    return { ok: false, reason: `authorByline missing comma: "${article.authorByline}"` };
  }
  return { ok: true };
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
    // Inject Humor Hypervisor feedback bundle (top-3 exemplars / bottom-3 failures)
    let humorPreamble = "";
    try {
      const { getCachedFeedback, formatFeedbackPreamble } = await import("./humor-hypervisor");
      const fb = await getCachedFeedback();
      humorPreamble = formatFeedbackPreamble(fb);
      if (humorPreamble) {
        console.log(`[GOOSE:L1] Humor feedback injected: ${fb.exemplars.length} exemplars, ${fb.failures.length} failures, avg=${fb.rollingAvg.overall} (n=${fb.rollingAvg.sampleSize})`);
      }
    } catch (e) {
      console.warn("[GOOSE:L1] humor preamble unavailable:", (e as Error).message);
    }
    console.log(`[GOOSE:L1] Council convening — 3 agents firing simultaneously...`);
    const councilStart = Date.now();
    const [geometer, body, oracle] = await Promise.all([
      runGeometerAgent(template, data, humorPreamble),
      runBodyAgent(template, data, humorPreamble),
      runOracleAgent(template, data, humorPreamble),
    ]);
    console.log(`[GOOSE:L1] Council returned in ${Date.now() - councilStart}ms`);

    // L2: κ-DTW merge — local geometry validation
    const draft = mergeCouncilOutputs(geometer, body, oracle, template);
    if (!draft) {
      console.error("[GOOSE:L2] Merge failed — insufficient council output");
      return null;
    }

    // L3: Editorial Arbiter — final synthesis (with DB knowledge injection + persona)
    console.log(`[GOOSE:L3] Arbiter synthesizing final article...`);
    const knowledgeRules = await fetchKnowledgeRules();
    const persona = pickPersona();
    if (persona) console.log(`[GOOSE:L3] Persona injected: "${persona.alias}" (${persona.role})`);

    let final = await runArbiterAgent(draft, geometer, body, oracle, knowledgeRules, persona);
    if (!final?.headline || !final?.body) {
      console.error("[GOOSE:L3] Arbiter returned incomplete article");
      return null;
    }

    // L4: Hall validation — with one retry if quality checks fail
    let hallResult = hallValidate(final);
    if (!hallResult.ok) {
      console.warn(`[GOOSE:L4] Hall fail (${hallResult.reason}) — retrying Arbiter once...`);
      final = await runArbiterAgent(draft, geometer, body, oracle, knowledgeRules, persona);
      if (!final?.headline || !final?.body) {
        console.error("[GOOSE:L4] Retry returned incomplete article — discarding");
        return null;
      }
      hallResult = hallValidate(final);
      if (!hallResult.ok) {
        console.error(`[GOOSE:L4] Hall validation failed after retry (${hallResult.reason}) — article discarded`);
        return null;
      }
      console.log("[GOOSE:L4] ✓ Retry passed Hall validation");
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

    // L5: Humor Hypervisor — weigh the article (Anubis), update vector DB & weights
    try {
      const { ingestArticle } = await import("./humor-hypervisor");
      ingestArticle(article).catch(err => console.error("[GOOSE:L5] HV ingest error:", err));
    } catch (e: any) {
      console.error("[GOOSE:L5] HV import failed:", e.message);
    }

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

  // 30-minute cadence — keeps SERPs fresh and AI crawlers fed
  const GENERATION_INTERVAL = 30 * 60 * 1000;

  // First article after 30s (collectors warm up fast)
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
        // κ-burst: high-signal moment → bonus article 9 min later
        if (data.kappaScore > 60) {
          setTimeout(async () => { generateGooseArticle(await buildKappaData()); }, 9 * 60 * 1000);
        }
        lastGeneratedAt = new Date();
      } catch (e) { console.error("[GOOSE] Scheduler run error:", e); }
    }, GENERATION_INTERVAL);
  }, 30 * 1000);

  console.log("[GOOSE] Ω-Council Scheduler started — first article in 30s, then every 30 minutes");
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

const SIX_HOURS_MS = 30 * 60 * 1000; // 30 min cadence
