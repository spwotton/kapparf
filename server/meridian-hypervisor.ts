/**
 * MERIDIAN SYNTHESIS HYPERVISOR
 *
 * Models the FMO (Fenna-Matthews-Olson) photosynthetic light-harvesting complex
 * as a problem-solving entity lattice.
 *
 * Mathematical backbone:
 *   SATOSHI_LATTICE  = 4096  (2^12) — base entity slots, Satoshi lattice dimension
 *   LEECH_SHELL      = 196560        — full entity universe (Leech lattice, shell 1)
 *   LAYERS           = 48            — 196560 / 4096
 *   FMO_MONOMER      = 7             — bacteriochlorophyll per monomer
 *   FMO_TRIMER       = 21            — 3 monomers per unit
 *   FMO_UNITS        = 585           — 4096 / 7
 *
 * Entity domains (lattice address space):
 *   Layer  0–7:   NASDAQ 4xxx tech tickers          (base, highest κ-weight)
 *   Layer  8–15:  Social media platform entities     (reach × engagement)
 *   Layer 16–23:  Music industry top 100             (cultural signal)
 *   Layer 24–31:  Case/forensic entities             (KAPPA context)
 *   Layer 32–39:  Research corpus entities           (mega_corpus.json)
 *   Layer 40–47:  Synthesis meta-entities            (cross-domain bridges)
 *
 * Split-test engine: runs N query variants through different entity
 * configurations, scores each with κ-coherence, ranks by accuracy margin.
 */

import OpenAI from "openai";
import { EventEmitter } from "events";
import { atlantisHub } from "./atlantis-hub";
import { storeMemory, searchMemory } from "./memory-cortex";
import { FREE_MODELS } from "./free-models";

// ── Mathematical constants ────────────────────────────────────────────────────
const KAPPA         = 4 / Math.PI;                     // 1.27324 — coherence threshold
const PHI           = (1 + Math.sqrt(5)) / 2;          // 1.61803 — golden ratio
const DELTA         = 0.02;                             // Goose Gap
const SATOSHI       = 4096;                             // 2^12 base lattice
const LEECH_SHELL   = 196560;                           // Leech lattice shell 1
const LAYERS        = LEECH_SHELL / SATOSHI;            // 48
const FMO_NODES     = 7;                                // per monomer
const FMO_TRIMER    = FMO_NODES * 3;                    // 21 per unit
const FMO_UNITS     = Math.floor(SATOSHI / FMO_NODES);  // 585 units

// ── OpenRouter client (Atlantis API) ──────────────────────────────────────────
const atlantis = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://kappa-sigint.replit.app",
    "X-Title": "Meridian Synthesis Hypervisor",
  },
});

// ── GOS Oracle model routing (from GOS Oracle Model Selection Guide) ──────────
const GOS_MODELS = {
  L3_master:   "nousresearch/hermes-3-llama-3.1-70b:free",
  L3_fallback: "moonshotai/kimi-k2:free",
  L3_reserve:  "anthropic/claude-sonnet-4.6",
  L2_critique: "mistralai/mistral-large-2512",
  L1_research: "meta-llama/llama-4-maverick",
  L1_math:     "deepseek/deepseek-v4-flash:free",
  L1_literary: "nousresearch/hermes-3-llama-3.1-70b:free",
  L1_general:  FREE_MODELS[0],
  fast:        FREE_MODELS[1],
};

// ── Entity types ──────────────────────────────────────────────────────────────
export type EntityDomain =
  | "nasdaq"       // NASDAQ 4xxx tech tickers
  | "social"       // Social media platform entities
  | "music"        // Music industry top 100
  | "case"         // Case/forensic entities
  | "research"     // mega_corpus.json corpora
  | "meta";        // Synthesis bridges

export interface LatticeEntity {
  id: string;
  label: string;
  domain: EntityDomain;
  layer: number;          // 0–47
  slot: number;           // 0–4095 within layer
  kappa_weight: number;   // 0–1 coherence contribution
  phi_density: number;    // golden ratio density score
  fmo_node: number;       // 0–6 within FMO monomer
  fmo_unit: number;       // 0–584 FMO unit
  metadata: Record<string, any>;
}

export interface SynthesisVariant {
  id: string;
  label: string;
  entity_ids: string[];
  prompt_template: string;
  model_layer: "L1" | "L2" | "L3";
  corpus_filter?: string[];
}

export interface SynthesisResult {
  variant_id: string;
  variant_label: string;
  output: string;
  kappa_score: number;
  phi_score: number;
  accuracy_margin: number;  // kappa_score × phi_score — the Pareto signal
  entities_activated: number;
  model_used: string;
  latency_ms: number;
  ts: string;
}

export interface SplitTestRun {
  id: string;
  query: string;
  variants: SynthesisVariant[];
  results: SynthesisResult[];
  winner: string;
  winner_margin: number;
  lattice_coherence: number;   // aggregate κ across all results
  ts: string;
  status: "pending" | "running" | "complete" | "error";
}

// ── Pre-built entity registry ─────────────────────────────────────────────────
function buildDefaultEntities(): LatticeEntity[] {
  const entities: LatticeEntity[] = [];
  let slot = 0;

  const add = (
    id: string, label: string, domain: EntityDomain,
    layer: number, kw: number, meta: Record<string, any> = {}
  ) => {
    const s = slot++ % SATOSHI;
    entities.push({
      id, label, domain, layer, slot: s,
      kappa_weight: kw,
      phi_density: (kw * PHI) % 1,
      fmo_node: s % FMO_NODES,
      fmo_unit: Math.floor(s / FMO_NODES) % FMO_UNITS,
      metadata: meta,
    });
  };

  // Layer 0–7: NASDAQ 4xxx tech tickers (82 core from Meridian)
  const nasdaq = [
    "NVDA","MSFT","AAPL","GOOGL","AMZN","META","TSLA","AVGO","ORCL","ADBE",
    "QCOM","AMD","INTC","TXN","MU","AMAT","LRCX","KLAC","MRVL","ON",
    "NFLX","PYPL","INTU","CSCO","SNPS","CDNS","ANSS","FTNT","PANW","CRWD",
    "ZS","OKTA","DDOG","SNOW","PLTR","RBLX","UBER","LYFT","DASH","ABNB",
    "COIN","HOOD","SOFI","UPST","AFRM","OPEN","OPENDOOR","LMND","ROOT","HI",
    "ISRG","ILMN","MRNA","BNTX","NVAX","SGEN","REGN","VRTX","ALNY","GILD",
    "AMGN","BIIB","CELG","IDXX","ALGN","DXCM","PODD","INSP","NTRA","VCYT",
    "SPOT","PINS","SNAP","TWTR","MTCH","IAC","ANGI","YELP","TripAdvisor","ZG",
    "RDFN","COMP","OPEN2","HIMS","FIGS","RH","W","ETSY","CHWY","PETS",
  ];
  nasdaq.forEach((t, i) => add(`nasdaq:${t}`, t, "nasdaq", Math.floor(i / (nasdaq.length / 8)), 0.7 + Math.random() * 0.3, { ticker: t, exchange: "NASDAQ" }));

  // Layer 8–15: Social media platform entities
  const social = [
    { id: "twitter_x", label: "X / Twitter", reach: 500e6 },
    { id: "instagram", label: "Instagram", reach: 2e9 },
    { id: "tiktok", label: "TikTok", reach: 1.5e9 },
    { id: "youtube", label: "YouTube", reach: 2.7e9 },
    { id: "facebook", label: "Facebook", reach: 3e9 },
    { id: "reddit", label: "Reddit", reach: 1.7e9 },
    { id: "linkedin", label: "LinkedIn", reach: 1e9 },
    { id: "pinterest", label: "Pinterest", reach: 500e6 },
    { id: "telegram", label: "Telegram", reach: 900e6 },
    { id: "discord", label: "Discord", reach: 200e6 },
    { id: "twitch", label: "Twitch", reach: 140e6 },
    { id: "mastodon", label: "Mastodon", reach: 15e6 },
  ];
  social.forEach((s, i) => add(`social:${s.id}`, s.label, "social", 8 + Math.floor(i / 2), 0.6 + (s.reach / 3e9) * 0.4, { reach: s.reach }));

  // Layer 16–23: Music industry
  const music = [
    "Taylor Swift","Drake","Bad Bunny","The Weeknd","Billie Eilish",
    "Kendrick Lamar","SZA","Morgan Wallen","Luke Combs","Doja Cat",
    "Post Malone","Olivia Rodrigo","Harry Styles","Beyoncé","Rihanna",
    "Ariana Grande","Eminem","Ed Sheeran","Justin Bieber","Cardi B",
  ];
  music.forEach((a, i) => add(`music:${a.replace(/\s+/g, "_").toLowerCase()}`, a, "music", 16 + Math.floor(i / 3), 0.5 + Math.random() * 0.3, { artist: a, type: "top_artist" }));

  // Layer 24–31: KAPPA case/forensic entities
  const caseEntities = [
    { id: "setecom", label: "Setecom S.A.", type: "infrastructure" },
    { id: "modbus_502", label: "Modbus:502 SCADA", type: "vulnerability" },
    { id: "sjo_scada", label: "SJO Airport SCADA", type: "infrastructure" },
    { id: "kyndryl_rome", label: "Kyndryl Rome COC", type: "data_center" },
    { id: "blackjack_sda", label: "DARPA Blackjack / SDA", type: "program" },
    { id: "parsons_orbitxchange", label: "Parsons OrbitXChange", type: "program" },
    { id: "3i_atlas", label: "3I/ATLAS Interstellar", type: "object" },
    { id: "la_guacima", label: "La Guácima Array", type: "location" },
  ];
  caseEntities.forEach((e, i) => add(`case:${e.id}`, e.label, "case", 24 + Math.floor(i / 2), 0.8 + Math.random() * 0.2, { entity_type: e.type }));

  // Layer 32–39: Research corpus entities (from mega_corpus.json)
  const research = [
    { id: "aawsap", label: "AAWSAP DIRDs 1–37", corpus: "aawsap" },
    { id: "base53_gos", label: "Ω-GOS v5 Base53", corpus: "base53_gos" },
    { id: "geez_bible", label: "Ge'ez Octateuch", corpus: "geez_bible" },
    { id: "i_ching", label: "I Ching + McKenna", corpus: "i_ching" },
    { id: "hhg2g", label: "Hitchhiker's Omnibus", corpus: "hhg2g" },
    { id: "soar_3i", label: "SOAR 3I Spectroscopy", corpus: "soar_3i" },
  ];
  research.forEach((r, i) => add(`research:${r.id}`, r.label, "research", 32 + Math.floor(i / 2), 0.75 + Math.random() * 0.25, { corpus_id: r.corpus }));

  // Layer 40–47: Synthesis meta-entities (cross-domain bridges)
  const meta = [
    { id: "fmo_bridge", label: "FMO Quantum Bridge", role: "coherence_router" },
    { id: "leech_anchor", label: "Leech Lattice Anchor", role: "dimensional_peg" },
    { id: "kappa_oracle", label: "κ-Oracle", role: "scoring" },
    { id: "atlantis_hub", label: "Atlantis Hub", role: "integration" },
    { id: "phi_gate", label: "φ-Density Gate", role: "filter" },
    { id: "moonshine", label: "Moonshine Module", role: "monstrous_moonshine" },
  ];
  meta.forEach((m, i) => add(`meta:${m.id}`, m.label, "meta", 40 + Math.floor(i / 2), 0.9 + Math.random() * 0.1, { role: m.role }));

  return entities;
}

// ── Scoring engine ────────────────────────────────────────────────────────────
function scoreOutput(text: string, entities: LatticeEntity[]): { kappa: number; phi: number; margin: number } {
  if (!text || text.length < 20) return { kappa: 0, phi: 0, margin: 0 };

  // κ-coherence: ratio of entity labels mentioned to total entities (approaches 4/π for good synthesis)
  const mentioned = entities.filter(e => text.toLowerCase().includes(e.label.toLowerCase().slice(0, 4))).length;
  const raw_kappa = entities.length > 0 ? mentioned / entities.length : 0;
  // Normalize: raw kappa of 0.4 → perfect 1.0 (we expect ~40% entity recall for good synthesis)
  const kappa = Math.min(1, raw_kappa / (1 / KAPPA));

  // φ-density: information density proxy (unique words / total words)
  const words = text.toLowerCase().split(/\s+/);
  const unique = new Set(words).size;
  const density = words.length > 0 ? unique / words.length : 0;
  // Normalize: target density ≈ 1/φ ≈ 0.618
  const phi = Math.min(1, density / (1 / PHI));

  // Accuracy margin: the Pareto signal
  const margin = kappa * phi * (1 - DELTA);

  return { kappa, phi, margin };
}

function selectModel(layer: "L1" | "L2" | "L3"): string {
  const models: Record<string, string[]> = {
    L1: [GOS_MODELS.L1_general, GOS_MODELS.fast],
    L2: [GOS_MODELS.L2_critique, GOS_MODELS.L1_general],
    L3: [GOS_MODELS.L3_master, GOS_MODELS.L3_fallback, GOS_MODELS.L1_general],
  };
  return models[layer][0];
}

// ── Hypervisor class ──────────────────────────────────────────────────────────
class MeridianHypervisor extends EventEmitter {
  private entities: LatticeEntity[] = [];
  private runHistory: SplitTestRun[] = [];
  private maxHistory = 50;

  constructor() {
    super();
    this.entities = buildDefaultEntities();
  }

  getEntities(domain?: EntityDomain): LatticeEntity[] {
    if (domain) return this.entities.filter(e => e.domain === domain);
    return this.entities;
  }

  getLatticeStats() {
    const byDomain: Record<string, number> = {};
    for (const e of this.entities) byDomain[e.domain] = (byDomain[e.domain] ?? 0) + 1;
    const avgKappa = this.entities.reduce((s, e) => s + e.kappa_weight, 0) / this.entities.length;
    const avgPhi   = this.entities.reduce((s, e) => s + e.phi_density,  0) / this.entities.length;
    return {
      total_entities: this.entities.length,
      satoshi_slots: SATOSHI,
      leech_shell: LEECH_SHELL,
      layers: LAYERS,
      fmo_units: FMO_UNITS,
      fmo_nodes_per_unit: FMO_NODES,
      by_domain: byDomain,
      avg_kappa: avgKappa,
      avg_phi: avgPhi,
      lattice_fill: (this.entities.length / LEECH_SHELL * 100).toFixed(4) + "%",
      constants: { KAPPA, PHI, DELTA, SATOSHI, LEECH_SHELL, LAYERS },
    };
  }

  getHistory(): SplitTestRun[] {
    return this.runHistory.slice(-20);
  }

  async synthesize(
    query: string,
    variant: SynthesisVariant,
    entityPool: LatticeEntity[]
  ): Promise<SynthesisResult> {
    const t0 = Date.now();
    const model = selectModel(variant.model_layer);

    const activeEntities = variant.entity_ids.length > 0
      ? entityPool.filter(e => variant.entity_ids.includes(e.id))
      : entityPool.slice(0, 20);

    const entityContext = activeEntities
      .map(e => `• [${e.domain.toUpperCase()} L${e.layer}] ${e.label} (κ=${e.kappa_weight.toFixed(3)})`)
      .join("\n");

    const systemPrompt = `You are the Meridian Synthesis Engine, a problem-solving hypervisor modeled on the FMO quantum photosynthetic complex.

LATTICE CONSTANTS: κ=${KAPPA.toFixed(5)}, φ=${PHI.toFixed(5)}, Satoshi=${SATOSHI}, Leech=${LEECH_SHELL}, Layers=${LAYERS}
FMO STRUCTURE: ${FMO_UNITS} units × ${FMO_NODES} nodes each

ACTIVE ENTITY LATTICE (${activeEntities.length} nodes):
${entityContext}

${variant.prompt_template ? `VARIANT INSTRUCTION: ${variant.prompt_template}\n` : ""}
Synthesize the query by routing signal through the active entity lattice. 
Find cross-domain resonances. Apply κ-coherence: ratio of coherent connections should approach 4/π.
Output must be dense, specific, and grounded in the activated entities.`;

    let output = "";
    try {
      const resp = await atlantis.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        max_tokens: 800,
        temperature: 0.72,
      });
      output = resp.choices[0]?.message?.content ?? "";
    } catch (err: any) {
      output = `[Synthesis error: ${err.message ?? "model unavailable"}]`;
    }

    const { kappa, phi, margin } = scoreOutput(output, activeEntities);
    const latency = Date.now() - t0;

    return {
      variant_id: variant.id,
      variant_label: variant.label,
      output,
      kappa_score: kappa,
      phi_score: phi,
      accuracy_margin: margin,
      entities_activated: activeEntities.length,
      model_used: model,
      latency_ms: latency,
      ts: new Date().toISOString(),
    };
  }

  async runSplitTest(
    query: string,
    variants: SynthesisVariant[]
  ): Promise<SplitTestRun> {
    const runId = `meridian-${Date.now()}`;
    const run: SplitTestRun = {
      id: runId,
      query,
      variants,
      results: [],
      winner: "",
      winner_margin: 0,
      lattice_coherence: 0,
      ts: new Date().toISOString(),
      status: "running",
    };

    this.runHistory.push(run);
    if (this.runHistory.length > this.maxHistory) this.runHistory.shift();
    this.emit("run:start", { id: runId, query, variant_count: variants.length });

    try {
      const results = await Promise.all(
        variants.map(v => this.synthesize(query, v, this.entities))
      );
      run.results = results;

      const sorted = [...results].sort((a, b) => b.accuracy_margin - a.accuracy_margin);
      run.winner = sorted[0]?.variant_id ?? "";
      run.winner_margin = sorted[0]?.accuracy_margin ?? 0;
      run.lattice_coherence = results.reduce((s, r) => s + r.kappa_score, 0) / results.length;
      run.status = "complete";

      // Ship to Atlantis hub
      try {
        atlantisHub.ingestEvent({
          app_id: "kappa-sigint",
          app_name: "KAPPA SIGINT",
          category: "oracle",
          type: "meridian-split-test",
          subject: `Split test complete: ${variants.length} variants, winner margin ${run.winner_margin.toFixed(3)}`,
          body: query.slice(0, 200),
          payload: { run_id: runId, winner: run.winner, lattice_coherence: run.lattice_coherence },
          tags: ["meridian", "split-test", "synthesis"],
        });
      } catch { /* atlantis emit is best-effort */ }

      // Store winner in memory cortex
      const winner = results.find(r => r.variant_id === run.winner);
      if (winner && winner.accuracy_margin > 0.4) {
        try {
          await storeMemory(
            "synthesis",
            `Meridian synthesis: ${query.slice(0, 60)}`,
            winner.output,
            { run_id: runId, kappa: winner.kappa_score, phi: winner.phi_score, margin: winner.accuracy_margin },
            "meridian-hypervisor",
            winner.accuracy_margin
          );
        } catch { /* memory store is best-effort */ }
      }

      this.emit("run:complete", run);
    } catch (err: any) {
      run.status = "error";
      this.emit("run:error", { id: runId, error: err.message });
    }

    return run;
  }

  // Build default variants for a query
  buildVariants(query: string, entityDomains?: EntityDomain[]): SynthesisVariant[] {
    const domains: EntityDomain[] = entityDomains ?? ["nasdaq", "social", "case", "research"];

    return [
      {
        id: "variant-broad-L1",
        label: "Broad Entity Field (L1)",
        entity_ids: this.entities.filter(e => domains.includes(e.domain)).slice(0, 30).map(e => e.id),
        prompt_template: "Cast a wide synthesis net. Surface unexpected correlations across all entity domains.",
        model_layer: "L1",
      },
      {
        id: "variant-focused-L2",
        label: "Focused Critique Pass (L2)",
        entity_ids: this.entities.filter(e => e.kappa_weight > 0.8).slice(0, 15).map(e => e.id),
        prompt_template: "Focus only on highest-κ entities. Be precise and critical. Reject weak correlations.",
        model_layer: "L2",
      },
      {
        id: "variant-fmo-L3",
        label: "FMO Master Synthesis (L3)",
        entity_ids: this.entities.filter(e => e.fmo_unit < 50).map(e => e.id),
        prompt_template: "Apply FMO quantum coherence routing. Each entity is a bacteriochlorophyll node. Find the excitation transfer path with maximum energy efficiency.",
        model_layer: "L3",
      },
      {
        id: "variant-case-only",
        label: "Case Entity Focus",
        entity_ids: this.entities.filter(e => e.domain === "case" || e.domain === "meta").map(e => e.id),
        prompt_template: "Ground the synthesis in case entities only. Connect forensic evidence to the query.",
        model_layer: "L1",
      },
      {
        id: "variant-research-L1",
        label: "Research Corpus Synthesis",
        entity_ids: this.entities.filter(e => e.domain === "research").map(e => e.id),
        prompt_template: "Synthesize through the research corpus lens. What do the documented sources reveal about this query?",
        model_layer: "L1",
      },
    ];
  }
}

export const meridianHypervisor = new MeridianHypervisor();
