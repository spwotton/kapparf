/**
 * GAZETTE INTEL — Thread Correlation Research Hypervisor
 *
 * Hidden beneath the absurdity: a real cross-thread research engine.
 * Articles are signposts. Tags are signals. Threads are truths.
 *
 * Architecture:
 *   BH53-ID            — Base53 checksum thread identifiers (spec §IV)
 *   Skeleton Compressor — ~20x context reduction (ported from base53_context_compressor.py)
 *   SimHash64          — 64-bit deduplication fingerprint (ported from base53_corpus_hypercompressor.py)
 *   Memory Cortex      — pgvector substrate for semantic search (existing)
 *   Atlantis Hub       — dream injection for cross-app pattern detection (existing)
 *   OpenRouter free    — autonomous research synthesis (llama-3.3-70b / deepseek-r1)
 */

import OpenAI from "openai";
import { Pool } from "@neondatabase/serverless";
import { storeMemory, searchMemory } from "./memory-cortex";
import { atlantisHub } from "./atlantis-hub";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://goosegazette.org",
    "X-Title": "Gazette Intel Hypervisor",
  },
});

// ── BH53-ID Encoder ───────────────────────────────────────────────────────────
// Spec: Base53-ℍₖ Quantum-Linguistic Topology §IV — BH53-ID profile
// 53-char alphabet, excludes ambiguous glyphs: O 9 1 I l W w m d

const BH53_ALPHA = "02345678ABCDEFGHJKLMNPQRSTUVXYZabcefghijknopqrstuvxyz";

function bh53Val(c: string): number { return BH53_ALPHA.indexOf(c); }
function bh53Char(n: number): string { return BH53_ALPHA[((n % 53) + 53) % 53]; }

function encodeBase53(num: number): string {
  if (num === 0) return BH53_ALPHA[0];
  const out: string[] = [];
  let n = Math.abs(Math.floor(num));
  while (n > 0) { out.unshift(BH53_ALPHA[n % 53]); n = Math.floor(n / 53); }
  return out.join("");
}

function fnv32a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// BH53-ID: encode a slug to a compact 6-char self-checksumming identifier
export function bh53Id(slug: string, len = 6): string {
  const hash = fnv32a(slug);
  const payload = encodeBase53(hash).slice(0, len - 1).padStart(len - 1, "0");
  let sum = 0;
  for (let i = 0; i < payload.length; i++) sum += (53 - i - 2) * bh53Val(payload[i]);
  return payload + bh53Char(sum);
}

// ── SimHash64 ─────────────────────────────────────────────────────────────────
// Port of simhash64() from base53_corpus_hypercompressor.py
// FNV-1a 64-bit fingerprint for deduplication — same algorithm, TypeScript

function fnv64a(s: string): bigint {
  let h = BigInt("0xCBF29CE484222325");
  const MASK = BigInt("0xFFFFFFFFFFFFFFFF");
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * BigInt("0x100000001B3")) & MASK;
  }
  return h;
}

export function simHash64(tokens: string[]): string {
  const vec = new Array(64).fill(0);
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (const [tok, w] of counts) {
    const h = fnv64a(tok);
    for (let i = 0; i < 64; i++) {
      const bit = (h >> BigInt(i)) & BigInt(1);
      vec[i] += bit ? w : -w;
    }
  }
  let out = BigInt(0);
  for (let i = 0; i < 64; i++) {
    if (vec[i] >= 0) out |= BigInt(1) << BigInt(i);
  }
  return out.toString(16).padStart(16, "0");
}

// ── Skeleton Compressor ───────────────────────────────────────────────────────
// Port of Base53Compressor.extract_skeleton() from base53_context_compressor.py
// Extracts datelines, numbers, quotes, proper nouns — ~20x compression ratio

const QUOTE_RE      = /"[^"]{10,200}"/g;
const NUMBER_RE     = /\b\d[\d,]*(?:\.\d+)?\s*(?:%|percent|hp|Hz|MHz|GHz|km|m\b|mph|knots?|days?|months?|years?|acres?|meters?|pounds?|million|billion|thousand)\b/gi;
const DATELINE_RE   = /^[A-Z][A-Z, \/]+—/;
const PROPER_RE     = /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3}\b/g;
const HIGH_VALUE_RE = /\b(?:surveillance|corridor|interdiction|route|cartel|smuggling|trafficking|geodetic|charter|logistics|classified|redacted|unexplained|discrepancy|anomaly|no record|none had|did not respond|has not responded|last seen|last to see)\b/i;

export function skeletonCompress(text: string, maxLines = 35): string {
  const lines = text.split("\n").filter(l => l.trim().length > 5);
  const out: string[] = [];
  const seen = new Set<string>();

  function accept(line: string): boolean {
    const key = line.toLowerCase().replace(/\s+/g, " ").slice(0, 90);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }

  for (const line of lines) {
    if (out.length >= maxLines) break;
    const s = line.trim();

    if (DATELINE_RE.test(s) && accept(s))              { out.push(s); continue; }
    const qs = s.match(QUOTE_RE);
    if (qs) { for (const q of qs) if (accept(q)) out.push(q); continue; }
    if (NUMBER_RE.test(s) && s.length < 280 && accept(s))         { out.push(s); continue; }
    if (HIGH_VALUE_RE.test(s) && s.length < 280 && accept(s))     { out.push(s); continue; }
    const pn = s.match(PROPER_RE);
    if (pn && pn.length >= 2 && s.length < 220 && accept(s))      { out.push(s); continue; }
    if (/\b\d{2,}\b/.test(s) && s.length < 180 && accept(s))      { out.push(s); continue; }
  }

  return out.join("\n");
}

// ── Thread Registry ───────────────────────────────────────────────────────────

export interface ThreadDef {
  slug: string;
  bh53: string;
  label: string;
  themes: string[];
  research_seeds: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  classification: "HUMINT" | "SIGINT" | "FINANCIAL" | "GEOGRAPHIC" | "LOGISTICS";
  geo?: { lat: number; lng: number; label: string };
}

const RAW_THREADS: Omit<ThreadDef, "bh53">[] = [
  {
    slug: "drone-jaco",
    label: "Aerial Surveillance — Jacó Residential",
    themes: ["rf-surveillance", "drone-activity", "unauthorized-airspace", "spectral-signature"],
    research_seeds: [
      "DJI Mini 2 87.6 Hz motor acoustic signature surveillance Costa Rica residential 2026",
      "unlicensed drone commercial area hover no flight plan Costa Rica aviation authority",
      "drone spectral analysis 87.7 Hz Jacó Puntarenas hover pattern dual recording",
    ],
    priority: "HIGH",
    classification: "SIGINT",
    geo: { lat: 9.6196, lng: -84.6282, label: "Jacó, Costa Rica" },
  },
  {
    slug: "maritime-bvi",
    label: "Go-Fast Maritime — Caribbean BVI Corridor",
    themes: ["go-fast-vessel", "drug-corridor", "cover-business", "power-discrepancy"],
    research_seeds: [
      "World Cat 320CC twin 300hp 600 total horsepower charter go-fast Caribbean BVI drug interdiction",
      "USCG Response Boat-Medium twin 225hp interceptor Caribbean narcotics pursuit performance",
      "charter vessel St John USVI British Virgin Islands smuggling corridor speed configuration",
      "pleasure boat overpowered tourism cover drug trafficking operation Caribbean 2025 2026",
    ],
    priority: "HIGH",
    classification: "SIGINT",
    geo: { lat: 18.3381, lng: -64.7947, label: "St John, USVI" },
  },
  {
    slug: "veteran-network",
    label: "Veteran Network — Helmand / Logistics / USVI",
    themes: ["veteran-skills", "logistics-access", "career-anomaly", "communication-blackout", "drug-route"],
    research_seeds: [
      "Afghanistan Helmand poppy field patrol burning marijuana heroin paste Turkey Netherlands processing route 2010 2011",
      "US Marine sniper Quantico career transition logistics Kenworth trucking UTI Norwood rapid advancement",
      "veteran best man charter boat BVI USVI unexplained career trajectory compressed timeline",
      "Kenworth truck logistics ground-level fleet tracking access supply chain intelligence",
      "golden triangle Helmand opium route shift Turkey Netherlands Mexico corridor 2010s",
    ],
    priority: "HIGH",
    classification: "HUMINT",
    geo: { lat: 31.7057, lng: 64.0861, label: "Helmand → USVI → Stoughton MA" },
  },
  {
    slug: "geodetic-corridor",
    label: "Terrain Intel — National Parks / Drug Corridors",
    themes: ["geodetic-terrain-mapping", "unexplained-funding", "cover-travel", "drug-corridor-geography", "communication-blackout"],
    research_seeds: [
      "geodetic survey US national park system 400+ sites unauthorized terrain mapping route intelligence",
      "Ecuador Guatemala Mexico solo travel drug trafficking corridors State Department advisories 2024 2025 2026",
      "Sundance Film Festival 11 days annual employment income travel discrepancy funding source unexplained",
      "Popocatepetl Iztaccihuatl Mexico City cartel territory solo hike restricted access guides required 2026",
      "Warner Bros Records Melbourne Amazon Seattle career gaps unexplained international travel pattern",
    ],
    priority: "HIGH",
    classification: "HUMINT",
    geo: { lat: 19.0228, lng: -98.6280, label: "Iztaccíhuatl, Mexico" },
  },
  {
    slug: "property-network",
    label: "Property Transfer Network — Los Rios",
    themes: ["property-laundering", "shell-company", "agent-clustering", "financial-network"],
    research_seeds: [
      "Los Rios Costa Rica 14 property transfers same registered agent address shell company 2025 2026",
      "Costa Rica real estate money laundering shell company beneficial ownership concealment Registro Nacional",
    ],
    priority: "MEDIUM",
    classification: "FINANCIAL",
    geo: { lat: 9.9281, lng: -84.0907, label: "Los Rios, Costa Rica" },
  },
  {
    slug: "expat-jurisdiction",
    label: "Expat Jurisdiction Arbitrage — Florida / Jacó",
    themes: ["jurisdiction-shopping", "unexplained-income", "legal-ambiguity", "offshore-network"],
    research_seeds: [
      "Florida US expat decades Jaco Costa Rica legal status residence income source undisclosed in Costa Rica qualifier",
      "offshore jurisdiction arbitrage expat Costa Rica legal ambiguity tax haven residency income reporting",
    ],
    priority: "MEDIUM",
    classification: "HUMINT",
    geo: { lat: 9.6196, lng: -84.6282, label: "Jacó, Costa Rica" },
  },
];

export const THREADS: ThreadDef[] = RAW_THREADS.map(t => ({ ...t, bh53: bh53Id(t.slug) }));

// ── DB Init ───────────────────────────────────────────────────────────────────

export async function initGazetteIntel(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gazette_intel_threads (
      slug        TEXT PRIMARY KEY,
      bh53_id     TEXT NOT NULL,
      label       TEXT NOT NULL,
      themes      TEXT[]  NOT NULL DEFAULT '{}',
      seeds       TEXT[]  NOT NULL DEFAULT '{}',
      priority    TEXT    NOT NULL DEFAULT 'MEDIUM',
      classif     TEXT    NOT NULL DEFAULT 'HUMINT',
      geo_lat     DOUBLE PRECISION,
      geo_lng     DOUBLE PRECISION,
      geo_label   TEXT,
      article_ids TEXT[]  NOT NULL DEFAULT '{}',
      cycle_count INTEGER NOT NULL DEFAULT 0,
      last_cycle  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gazette_research_log (
      id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_slug     TEXT    NOT NULL REFERENCES gazette_intel_threads(slug),
      cycle_num       INTEGER NOT NULL,
      model           TEXT    NOT NULL,
      compressed_ctx  TEXT,
      simhash         TEXT,
      finding         TEXT    NOT NULL,
      connections     TEXT[],
      confidence      REAL,
      draft_headline  TEXT,
      draft_body      TEXT,
      draft_tag       TEXT,
      published       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const t of THREADS) {
    await pool.query(`
      INSERT INTO gazette_intel_threads (slug, bh53_id, label, themes, seeds, priority, classif, geo_lat, geo_lng, geo_label)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (slug) DO UPDATE SET
        bh53_id=EXCLUDED.bh53_id, label=EXCLUDED.label,
        themes=EXCLUDED.themes, seeds=EXCLUDED.seeds,
        priority=EXCLUDED.priority, classif=EXCLUDED.classif,
        geo_lat=EXCLUDED.geo_lat, geo_lng=EXCLUDED.geo_lng, geo_label=EXCLUDED.geo_label
    `, [t.slug, t.bh53, t.label, t.themes, t.research_seeds,
        t.priority, t.classification, t.geo?.lat ?? null, t.geo?.lng ?? null, t.geo?.label ?? null]);
  }

  console.log(`[GazetteIntel] Initialized — ${THREADS.length} threads, BH53-IDs: ${THREADS.map(t => `${t.slug}→${t.bh53}`).join(" | ")}`);
}

// ── Article Intel Ingestion ───────────────────────────────────────────────────

export interface ArticleIntel {
  id: string;
  body: string;
  _intel: {
    threads: string[];
    entities: { places?: string[]; businesses?: string[]; descriptors?: string[] };
    themes: string[];
    research_seeds: string[];
    priority: "HIGH" | "MEDIUM" | "LOW";
    classification: string;
  };
}

export async function ingestArticleIntel(articles: ArticleIntel[]): Promise<void> {
  for (const a of articles) {
    const { _intel, body } = a;
    const tokens = body.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
    const sh = simHash64(tokens);
    const compressed = skeletonCompress(body);

    await storeMemory(
      "signal_intelligence",
      `Gazette: ${a.id}`,
      compressed,
      { article_id: a.id, threads: _intel.threads, themes: _intel.themes, simhash: sh,
        classification: _intel.classification, seeds: _intel.research_seeds },
      `gazette:article:${a.id}`,
      _intel.priority === "HIGH" ? 0.9 : _intel.priority === "MEDIUM" ? 0.7 : 0.5
    );

    for (const slug of _intel.threads) {
      await pool.query(`
        UPDATE gazette_intel_threads
        SET article_ids = array_append(array_remove(article_ids, $2::text), $2::text)
        WHERE slug = $1
      `, [slug, a.id]).catch(() => {});
    }

    console.log(`[GazetteIntel] Ingested "${a.id}" → [${_intel.threads.join(", ")}] simhash:${sh}`);
  }
}

// ── Research Cycle ────────────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const PRIMARY_MODEL  = "meta-llama/llama-3.3-70b-instruct:free";
const FALLBACK_MODEL = "deepseek/deepseek-r1:free";

async function pickThread(): Promise<string | null> {
  const { rows } = await pool.query<{ slug: string; priority: string; last_cycle: Date | null }>(
    `SELECT slug, priority, last_cycle FROM gazette_intel_threads ORDER BY slug`
  );
  if (!rows.length) return null;
  const now = Date.now();
  let best: string | null = null;
  let bestScore = -1;
  for (const r of rows) {
    const w = PRIORITY_WEIGHT[r.priority] ?? 1;
    const ageMins = r.last_cycle ? (now - new Date(r.last_cycle).getTime()) / 60000 : 9999;
    const score = w * Math.min(ageMins, 180);
    if (score > bestScore) { bestScore = score; best = r.slug; }
  }
  return best;
}

export async function runResearchCycle(): Promise<{ thread: string; bh53: string; finding: string; hasDraft: boolean } | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[GazetteIntel] No OPENROUTER_API_KEY — skipping cycle");
    return null;
  }

  const slug = await pickThread();
  if (!slug) return null;

  const thread = THREADS.find(t => t.slug === slug);
  if (!thread) return null;

  const { rows: [tRow] } = await pool.query<{ cycle_count: number }>(
    `SELECT cycle_count FROM gazette_intel_threads WHERE slug=$1`, [slug]
  );
  const cycleNum = (tRow?.cycle_count ?? 0) + 1;

  // Semantic search for related intel in Memory Cortex
  const memResults = await searchMemory(thread.research_seeds[0], {
    limit: 4, category: "signal_intelligence", minImportance: 0.4,
  }).catch(() => []);

  const contextParts = memResults.map(m =>
    `[${m.metadata?.article_id ?? m.title}]\n${skeletonCompress(m.content, 18)}`
  );
  const compressedCtx = contextParts.join("\n\n──────────────────────────────────────────\n\n");

  // SimHash64 on combined context for dedup
  const ctxTokens = compressedCtx.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  const sh = simHash64([...ctxTokens, slug, String(cycleNum)]);

  const { rows: [lastLog] } = await pool.query<{ simhash: string }>(
    `SELECT simhash FROM gazette_research_log WHERE thread_slug=$1 ORDER BY created_at DESC LIMIT 1`, [slug]
  );
  if (lastLog?.simhash === sh && cycleNum > 1) {
    console.log(`[GazetteIntel] Cycle ${cycleNum} skipped for "${slug}" — simhash unchanged`);
    await pool.query(`UPDATE gazette_intel_threads SET last_cycle=NOW() WHERE slug=$1`, [slug]);
    return null;
  }

  const prompt = `You are an investigative research engine analyzing open-source intelligence.

THREAD: ${thread.label}
BH53-ID: ${thread.bh53}
CLASSIFICATION: ${thread.classification}  PRIORITY: ${thread.priority}
CYCLE: ${cycleNum}

COMPRESSED ARTICLE CONTEXTS (Base53 skeleton extraction — ~20x compression):
${compressedCtx || "[No article contexts indexed yet — use research seeds to reason]"}

RESEARCH SEEDS:
${thread.research_seeds.map((s, i) => `${i + 1}. ${s}`).join("\n")}

THEMES: ${thread.themes.join(", ")}

Identify the strongest verifiable pattern across these signals. Be specific.
Respond ONLY as valid JSON — no preamble, no markdown:
{
  "finding": "2-3 sentence factual finding, evidence-based, specific",
  "connections": ["geographic connection", "temporal connection", "network connection"],
  "confidence": 0.0,
  "draftHeadline": "Gazette-style deadpan headline or null",
  "draftBody": "First 2 paragraphs in Gazette voice (deadpan, no accusation, facts only) or null",
  "draftTag": "INVESTIGATION or LOCAL or null"
}`;

  let raw = "";
  let usedModel = PRIMARY_MODEL;

  try {
    const resp = await openrouter.chat.completions.create({
      model: PRIMARY_MODEL, messages: [{ role: "user", content: prompt }],
      max_tokens: 1000, temperature: 0.25,
    });
    raw = resp.choices[0]?.message?.content ?? "";
  } catch (e: any) {
    console.warn(`[GazetteIntel] Primary model failed: ${e.message?.slice(0, 80)}`);
    try {
      const resp2 = await openrouter.chat.completions.create({
        model: FALLBACK_MODEL, messages: [{ role: "user", content: prompt }],
        max_tokens: 1000, temperature: 0.25,
      });
      raw = resp2.choices[0]?.message?.content ?? "";
      usedModel = FALLBACK_MODEL;
    } catch (e2: any) {
      console.error("[GazetteIntel] All models failed:", e2.message?.slice(0, 80));
      await pool.query(`UPDATE gazette_intel_threads SET last_cycle=NOW(), cycle_count=$1 WHERE slug=$2`, [cycleNum, slug]);
      return null;
    }
  }

  let parsed: any = {};
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
  } catch (_) {
    parsed = { finding: raw.slice(0, 400), connections: [], confidence: 0.3 };
  }

  const finding: string       = parsed.finding ?? "No finding generated.";
  const connections: string[] = Array.isArray(parsed.connections) ? parsed.connections : [];
  const confidence: number    = typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.4;
  const draftHeadline         = parsed.draftHeadline ?? null;
  const draftBody             = parsed.draftBody ?? null;
  const draftTag              = parsed.draftTag ?? null;

  await pool.query(`
    INSERT INTO gazette_research_log
    (thread_slug, cycle_num, model, compressed_ctx, simhash, finding, connections, confidence, draft_headline, draft_body, draft_tag)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  `, [slug, cycleNum, usedModel, compressedCtx.slice(0, 2000), sh,
      finding, connections, confidence, draftHeadline, draftBody?.slice(0, 3000) ?? null, draftTag]);

  await pool.query(`UPDATE gazette_intel_threads SET last_cycle=NOW(), cycle_count=$1 WHERE slug=$2`, [cycleNum, slug]);

  // Store finding in Memory Cortex
  await storeMemory(
    "signal_intelligence",
    `Intel: ${thread.label} [${thread.bh53}] #${cycleNum}`,
    finding,
    { thread: slug, bh53: thread.bh53, connections, confidence, cycle: cycleNum },
    `gazette:intel:${slug}:${cycleNum}`,
    Math.min(0.95, 0.5 + confidence * 0.45)
  ).catch(() => {});

  // Post dream to Atlantis Hub
  atlantisHub.postDream(
    "goose-gazette",
    `[GAZETTE INTEL ${thread.bh53}] ${thread.label}: ${finding}`,
    { thread: slug, bh53: thread.bh53, confidence, connections, cycle: cycleNum },
    ["gazette", "investigation", thread.classification.toLowerCase(), ...thread.themes]
  ).catch(() => {});

  console.log(`[GazetteIntel] Cycle ${cycleNum} — "${slug}" [${thread.bh53}] conf:${confidence.toFixed(2)} model:${usedModel.split("/").pop()} draft:${!!draftHeadline}`);
  return { thread: slug, bh53: thread.bh53, finding, hasDraft: !!draftHeadline };
}

// ── Hypervisor ────────────────────────────────────────────────────────────────

let _timer: ReturnType<typeof setInterval> | null = null;
let _lastCycle: { thread: string; bh53: string; finding: string; hasDraft: boolean; ts: string } | null = null;
let _cycleCount = 0;
const CYCLE_MS = 10 * 60 * 1000; // 10 minutes

export function startIntelHypervisor(): void {
  if (_timer) return;
  console.log("[GazetteIntel] Hypervisor online — 10-min research cycles");
  const doCycle = async () => {
    try {
      const r = await runResearchCycle();
      if (r) { _lastCycle = { ...r, ts: new Date().toISOString() }; _cycleCount++; }
    } catch (e: any) {
      console.error("[GazetteIntel] Cycle error:", e.message?.slice(0, 120));
    }
  };
  setTimeout(doCycle, 45_000);
  _timer = setInterval(doCycle, CYCLE_MS);
}

export function getIntelStatus() {
  return {
    active: !!_timer,
    cycleCount: _cycleCount,
    intervalMins: CYCLE_MS / 60000,
    lastCycle: _lastCycle,
    models: { primary: PRIMARY_MODEL, fallback: FALLBACK_MODEL },
    threads: THREADS.map(t => ({
      slug: t.slug, bh53: t.bh53, label: t.label,
      priority: t.priority, classification: t.classification,
      themes: t.themes,
    })),
  };
}

export async function getThreadsDb() {
  const { rows } = await pool.query(`
    SELECT slug, bh53_id, label, themes, priority, classif, geo_lat, geo_lng, geo_label,
           article_ids, cycle_count, last_cycle
    FROM gazette_intel_threads ORDER BY
      CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
      last_cycle ASC NULLS FIRST
  `);
  return rows;
}

export async function getResearchLog(threadSlug?: string, limit = 25) {
  if (threadSlug) {
    const { rows } = await pool.query(`
      SELECT id, thread_slug, cycle_num, model, finding, connections, confidence,
             draft_headline, draft_body, draft_tag, published, created_at
      FROM gazette_research_log WHERE thread_slug=$1
      ORDER BY created_at DESC LIMIT $2
    `, [threadSlug, limit]);
    return rows;
  }
  const { rows } = await pool.query(`
    SELECT id, thread_slug, cycle_num, model, finding, connections, confidence,
           draft_headline, draft_body, draft_tag, published, created_at
    FROM gazette_research_log ORDER BY created_at DESC LIMIT $1
  `, [limit]);
  return rows;
}

export async function publishDraft(logId: string): Promise<{ headline: string; body: string; tag: string } | null> {
  const { rows: [row] } = await pool.query(`
    UPDATE gazette_research_log SET published=TRUE WHERE id=$1
    RETURNING draft_headline, draft_body, draft_tag
  `, [logId]);
  if (!row?.draft_headline) return null;
  return { headline: row.draft_headline, body: row.draft_body ?? "", tag: row.draft_tag ?? "INVESTIGATION" };
}
