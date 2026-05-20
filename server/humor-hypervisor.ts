/**
 * HUMOR HYPERVISOR — Ω-Council Quality Feedback Loop
 *
 * A meta-layer on top of goose-generator.ts that:
 *  1. Judges recent articles on 5 humor dimensions using gpt-4o-mini.
 *  2. Persists scores in `goose_humor_scores` (never re-judges).
 *  3. Builds a rolling κ-style feedback bundle (top-3 exemplars + bottom-3 failures).
 *  4. Exposes that bundle for injection into the L1 Council prompts on the
 *     next generation cycle — forward-only, no rewrites of published copy.
 *
 * Cycle: every 10 minutes. Startup delay: 5 minutes (after generator warmup).
 */

import { db } from "./db";
import { gooseArticles, gooseHumorScores, type GooseHumorScore } from "@shared/schema";
import { desc, sql, eq } from "drizzle-orm";
import { openai as aiClient } from "./replit_integrations/audio/client";

/**
 * RUBRIC_VERSION — bump this constant after any meaningful change to JUDGE_SYSTEM
 * or the dimension definitions. The hypervisor will then re-judge every article
 * whose latest score was produced under an older rubric on the next cycle.
 */
export const RUBRIC_VERSION = 1;

const CYCLE_MS = 10 * 60 * 1000;
const STARTUP_DELAY_MS = 5 * 60 * 1000;
const SCORE_BATCH = 10;
const BUNDLE_TOP = 3;
const BUNDLE_BOTTOM = 3;

const DIMENSIONS = [
  "apRigidity",
  "premiseAbsurdity",
  "jokeDiscipline",
  "specificityCarrier",
  "resolutionUnresolved",
] as const;
type Dimension = typeof DIMENSIONS[number];

const JUDGE_SYSTEM = `You are the HUMOR JUDGE for The Goose Gazette.
You evaluate Onion-style AP-wire satire on 5 strict humor dimensions.

THE AP INVARIANT (Ψ = A × N = 1):
  Structural Amplitude A(t) = AP-wire rigidity, past tense, declarative.
  Novelty Density N(t) = the surrealism/absurdity of the premise.
  Their product must equal 1. Maximum style rigidity enables maximum absurdity.

The 5 DIMENSIONS (each scored 0–100, integer):
  1. apRigidity         — does it read like real AP wire copy? Past tense, declarative,
                          inverted pyramid, "could not be reached for comment"? 100 = indistinguishable
                          from AP. 0 = sloppy, modern, conversational, blog-like.
  2. premiseAbsurdity   — is the CORE premise genuinely funny / weird / Onion-grade?
                          100 = an Onion classic. 0 = a real, boring news event.
  3. jokeDiscipline     — does it NEVER wink at the reader? Penalize HEAVILY any use of:
                          "satirical", "bizarrely", "strangely", "oddly", "surprisingly",
                          "unbelievably", "somehow", "ironically". 100 = zero winking.
                          0 = signposted, explained, apologetic, framed as a joke.
  4. specificityCarrier — does it ground absurdity in boring concrete carriers? Specific
                          times, addresses, phone numbers, percentages, form numbers,
                          measurements, durations. The f_carrier = 8.392 Hz principle.
                          100 = saturated with mundane specifics. 0 = vague, abstract.
  5. resolutionUnresolved — does P4 end with a non-deadline bureaucratic loop, a
                          statement that confirms nothing, a "review under way"?
                          100 = perfect anticlimax. 0 = neat resolution, moral, or
                          actual deadline. The goose has already left the building.

Return JSON ONLY with this exact shape:
{
  "apRigidity": <int 0-100>,
  "premiseAbsurdity": <int 0-100>,
  "jokeDiscipline": <int 0-100>,
  "specificityCarrier": <int 0-100>,
  "resolutionUnresolved": <int 0-100>,
  "notes": {
    "apRigidity": "<one sentence>",
    "premiseAbsurdity": "<one sentence>",
    "jokeDiscipline": "<one sentence>",
    "specificityCarrier": "<one sentence>",
    "resolutionUnresolved": "<one sentence>"
  },
  "summary": "<one sentence — what makes this article work or fail overall>"
}
Score honestly. Most articles should fall in 40–80. Reserve 90+ for genuinely excellent work.
Reserve sub-30 for genuine failures. Do not be a cheerleader.`;

interface JudgeResult {
  apRigidity: number;
  premiseAbsurdity: number;
  jokeDiscipline: number;
  specificityCarrier: number;
  resolutionUnresolved: number;
  notes: Record<Dimension, string>;
  summary: string;
}

function safeJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]) as T; } catch {} }
    return fallback;
  }
}

function clamp(n: any): number {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return 50;
  return Math.max(0, Math.min(100, x));
}

async function judgeArticle(article: { id: string; headline: string; subhead: string | null; body: string }): Promise<JudgeResult | null> {
  const userPrompt = `Judge this Goose Gazette article on all 5 dimensions.

HEADLINE: ${article.headline}
SUBHEAD: ${article.subhead ?? "(none)"}

BODY:
${article.body}`;
  try {
    const resp = await (aiClient as any).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: JUDGE_SYSTEM },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.3,
    });
    const raw = resp.choices[0]?.message?.content;
    const parsed = safeJSON<JudgeResult | null>(raw, null);
    if (!parsed) return null;
    return {
      apRigidity: clamp(parsed.apRigidity),
      premiseAbsurdity: clamp(parsed.premiseAbsurdity),
      jokeDiscipline: clamp(parsed.jokeDiscipline),
      specificityCarrier: clamp(parsed.specificityCarrier),
      resolutionUnresolved: clamp(parsed.resolutionUnresolved),
      notes: parsed.notes ?? ({} as any),
      summary: parsed.summary ?? "",
    };
  } catch (e) {
    console.error("[HUMOR:JUDGE] error:", (e as Error).message);
    return null;
  }
}

export async function scoreRecentArticles(): Promise<{ scored: number; skipped: number; rejudged: number }> {
  // Pick articles that either have no score yet, or whose latest score is from
  // an older rubric version. The LEFT JOIN + version filter handles both cases.
  const candidates = await db.execute<{
    id: string;
    headline: string;
    subhead: string | null;
    body: string;
    prev_version: number | null;
  }>(sql`
    SELECT a.id, a.headline, a.subhead, a.body,
           (SELECT MAX(s.rubric_version) FROM goose_humor_scores s WHERE s.article_id = a.id) AS prev_version
    FROM goose_articles a
    WHERE NOT EXISTS (
      SELECT 1 FROM goose_humor_scores s
      WHERE s.article_id = a.id AND s.rubric_version >= ${RUBRIC_VERSION}
    )
    ORDER BY a.published_at DESC
    LIMIT ${SCORE_BATCH}
  `);

  const rows: Array<{ id: string; headline: string; subhead: string | null; body: string; prev_version: number | null }> =
    (candidates as any).rows ?? (candidates as any);

  let scored = 0;
  let rejudged = 0;
  for (const art of rows) {
    const result = await judgeArticle(art);
    if (!result) continue;
    const overall = Math.round(
      (result.apRigidity + result.premiseAbsurdity + result.jokeDiscipline +
       result.specificityCarrier + result.resolutionUnresolved) / 5
    );
    const judgeNotes = JSON.stringify({ notes: result.notes, summary: result.summary });
    const isRejudge = art.prev_version !== null && art.prev_version < RUBRIC_VERSION;
    try {
      // Replace any stale-rubric rows for this article so the rolling avg stops
      // mixing rubric versions, then insert the fresh score.
      if (isRejudge) {
        await db.delete(gooseHumorScores).where(
          sql`${gooseHumorScores.articleId} = ${art.id} AND ${gooseHumorScores.rubricVersion} < ${RUBRIC_VERSION}`
        );
        rejudged++;
      }
      await db.insert(gooseHumorScores).values({
        articleId: art.id,
        apRigidity: result.apRigidity,
        premiseAbsurdity: result.premiseAbsurdity,
        jokeDiscipline: result.jokeDiscipline,
        specificityCarrier: result.specificityCarrier,
        resolutionUnresolved: result.resolutionUnresolved,
        overall,
        judgeNotes,
        rubricVersion: RUBRIC_VERSION,
      });
      scored++;
    } catch (e) {
      console.warn("[HUMOR:PERSIST] failed for", art.id, (e as Error).message);
    }
  }
  return { scored, skipped: rows.length - scored, rejudged };
}

export interface HumorFeedback {
  exemplars: Array<{ headline: string; overall: number; whyItWorked: string }>;
  failures: Array<{ headline: string; overall: number; whatToAvoid: string }>;
  rollingAvg: {
    apRigidity: number;
    premiseAbsurdity: number;
    jokeDiscipline: number;
    specificityCarrier: number;
    resolutionUnresolved: number;
    overall: number;
    sampleSize: number;
  };
  recent?: Array<{
    articleId: string;
    headline: string;
    apRigidity: number;
    premiseAbsurdity: number;
    jokeDiscipline: number;
    specificityCarrier: number;
    resolutionUnresolved: number;
    overall: number;
    summary: string;
    scoredAt: string;
  }>;
}

export async function buildHumorFeedback(): Promise<HumorFeedback> {
  const rowsWithId = await db.select({
    articleId: gooseHumorScores.articleId,
    headline: gooseArticles.headline,
    overall: gooseHumorScores.overall,
    apRigidity: gooseHumorScores.apRigidity,
    premiseAbsurdity: gooseHumorScores.premiseAbsurdity,
    jokeDiscipline: gooseHumorScores.jokeDiscipline,
    specificityCarrier: gooseHumorScores.specificityCarrier,
    resolutionUnresolved: gooseHumorScores.resolutionUnresolved,
    judgeNotes: gooseHumorScores.judgeNotes,
    scoredAt: gooseHumorScores.scoredAt,
  }).from(gooseHumorScores)
    .innerJoin(gooseArticles, eq(gooseHumorScores.articleId, gooseArticles.id))
    .orderBy(desc(gooseHumorScores.scoredAt))
    .limit(40);

  if (rowsWithId.length === 0) {
    return {
      exemplars: [],
      failures: [],
      rollingAvg: {
        apRigidity: 0, premiseAbsurdity: 0, jokeDiscipline: 0,
        specificityCarrier: 0, resolutionUnresolved: 0, overall: 0, sampleSize: 0,
      },
    };
  }

  const avg = (key: keyof typeof rowsWithId[0]) =>
    Math.round(rowsWithId.reduce((s, r) => s + (r[key] as number), 0) / rowsWithId.length * 10) / 10;

  const sortedDesc = [...rowsWithId].sort((a, b) => b.overall - a.overall);
  const top = sortedDesc.slice(0, BUNDLE_TOP);
  const bottom = sortedDesc.slice(-BUNDLE_BOTTOM).reverse();

  const parseSummary = (raw: string | null): string => {
    if (!raw) return "";
    try {
      const j = JSON.parse(raw);
      return (j.summary ?? "").toString().slice(0, 200);
    } catch { return ""; }
  };

  return {
    exemplars: top.map(r => ({
      headline: r.headline.slice(0, 140),
      overall: r.overall,
      whyItWorked: parseSummary(r.judgeNotes),
    })),
    failures: bottom.map(r => ({
      headline: r.headline.slice(0, 140),
      overall: r.overall,
      whatToAvoid: parseSummary(r.judgeNotes),
    })),
    rollingAvg: {
      apRigidity: avg("apRigidity"),
      premiseAbsurdity: avg("premiseAbsurdity"),
      jokeDiscipline: avg("jokeDiscipline"),
      specificityCarrier: avg("specificityCarrier"),
      resolutionUnresolved: avg("resolutionUnresolved"),
      overall: avg("overall"),
      sampleSize: rowsWithId.length,
    },
    recent: rowsWithId.map(r => ({
      articleId: r.articleId,
      headline: r.headline,
      apRigidity: r.apRigidity,
      premiseAbsurdity: r.premiseAbsurdity,
      jokeDiscipline: r.jokeDiscipline,
      specificityCarrier: r.specificityCarrier,
      resolutionUnresolved: r.resolutionUnresolved,
      overall: r.overall,
      summary: parseSummary(r.judgeNotes),
      scoredAt: r.scoredAt instanceof Date ? r.scoredAt.toISOString() : String(r.scoredAt),
    })),
  };
}

/** Returns ≤1KB preamble to inject into L1 council prompts. */
export function formatFeedbackPreamble(fb: HumorFeedback): string {
  if (fb.exemplars.length === 0 && fb.failures.length === 0) return "";
  const lines: string[] = [];
  lines.push("═══ HUMOR HYPERVISOR FEEDBACK (κ-rolling) ═══");
  if (fb.exemplars.length) {
    lines.push("RECENT EXEMPLARS — emulate the rhythm and discipline of these:");
    for (const e of fb.exemplars) {
      lines.push(`  ✓ [${e.overall}] ${e.headline}`);
      if (e.whyItWorked) lines.push(`     why: ${e.whyItWorked.slice(0, 140)}`);
    }
  }
  if (fb.failures.length) {
    lines.push("RECENT FAILURES — DO NOT REPEAT these mistakes:");
    for (const f of fb.failures) {
      lines.push(`  ✗ [${f.overall}] ${f.headline}`);
      if (f.whatToAvoid) lines.push(`     avoid: ${f.whatToAvoid.slice(0, 140)}`);
    }
  }
  lines.push(`Rolling avg: overall=${fb.rollingAvg.overall} (n=${fb.rollingAvg.sampleSize})`);
  lines.push("═══ END FEEDBACK ═══");
  const out = lines.join("\n");
  return out.length > 1024 ? out.slice(0, 1024) : out;
}

// ── Cached feedback (refreshed on cycle; cheap to read) ──────────────────────
let cachedFeedback: HumorFeedback | null = null;
let cachedAt = 0;

export async function getCachedFeedback(): Promise<HumorFeedback> {
  if (cachedFeedback && Date.now() - cachedAt < CYCLE_MS) return cachedFeedback;
  cachedFeedback = await buildHumorFeedback();
  cachedAt = Date.now();
  return cachedFeedback;
}

let hypervisorTimer: NodeJS.Timeout | null = null;
let started = false;
let cycleCount = 0;
let lastCycleAt: number | null = null;

async function cycle() {
  cycleCount++;
  const t0 = Date.now();
  try {
    const { scored, rejudged } = await scoreRecentArticles();
    cachedFeedback = await buildHumorFeedback();
    cachedAt = Date.now();
    lastCycleAt = Date.now();
    const avg = cachedFeedback.rollingAvg;
    console.log(
      `[HUMOR-HYPER] cycle #${cycleCount} scored=${scored} rejudged=${rejudged} rubric=v${RUBRIC_VERSION} | ` +
      `avg overall=${avg.overall} AP=${avg.apRigidity} ` +
      `premise=${avg.premiseAbsurdity} discipline=${avg.jokeDiscipline} ` +
      `carrier=${avg.specificityCarrier} resolution=${avg.resolutionUnresolved} ` +
      `(n=${avg.sampleSize}, ${Date.now() - t0}ms)`
    );
  } catch (e) {
    console.error("[HUMOR-HYPER] cycle error:", (e as Error).message);
  }
}

export function startHumorHypervisor() {
  if (started) return;
  started = true;
  setTimeout(() => {
    cycle();
    hypervisorTimer = setInterval(cycle, CYCLE_MS);
  }, STARTUP_DELAY_MS);
  console.log(`[HUMOR-HYPER] scheduled — first cycle in ${STARTUP_DELAY_MS / 60000} min, then every ${CYCLE_MS / 60000} min`);
}

export function stopHumorHypervisor() {
  if (hypervisorTimer) { clearInterval(hypervisorTimer); hypervisorTimer = null; }
  started = false;
}

export function getHumorHypervisorStatus() {
  return { running: started, cycleCount, lastCycleAt, cycleMs: CYCLE_MS };
}

// ── Single-article helpers (used by goose-generator L5 + HTTP routes) ────────

/**
 * Judge one article now and persist the result. Replaces any older-rubric score
 * rows for the same article so the rolling average stays consistent. Returns
 * the persisted score, or null if the judge call failed.
 */
export async function ingestArticle(article: {
  id: string;
  headline: string;
  subhead: string | null;
  body: string;
}): Promise<GooseHumorScore | null> {
  const result = await judgeArticle(article);
  if (!result) return null;
  const overall = Math.round(
    (result.apRigidity + result.premiseAbsurdity + result.jokeDiscipline +
     result.specificityCarrier + result.resolutionUnresolved) / 5
  );
  const judgeNotes = JSON.stringify({ notes: result.notes, summary: result.summary });
  try {
    await db.delete(gooseHumorScores).where(
      sql`${gooseHumorScores.articleId} = ${article.id} AND ${gooseHumorScores.rubricVersion} < ${RUBRIC_VERSION}`
    );
    const [row] = await db.insert(gooseHumorScores).values({
      articleId: article.id,
      apRigidity: result.apRigidity,
      premiseAbsurdity: result.premiseAbsurdity,
      jokeDiscipline: result.jokeDiscipline,
      specificityCarrier: result.specificityCarrier,
      resolutionUnresolved: result.resolutionUnresolved,
      overall,
      judgeNotes,
      rubricVersion: RUBRIC_VERSION,
    }).returning();
    // Bust the rolling-feedback cache so the next read reflects this score.
    cachedFeedback = null;
    return row;
  } catch (e) {
    console.warn("[HUMOR:INGEST] persist failed for", article.id, (e as Error).message);
    return null;
  }
}

/** Latest score for a single article (newest rubric wins), or null if unscored. */
export async function getArticleScore(articleId: string): Promise<GooseHumorScore | null> {
  const rows = await db.select()
    .from(gooseHumorScores)
    .where(eq(gooseHumorScores.articleId, articleId))
    .orderBy(desc(gooseHumorScores.rubricVersion), desc(gooseHumorScores.scoredAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Combined status + rolling feedback bundle — what the dashboard reads. */
export async function getHypervisorState() {
  const feedback = await getCachedFeedback();
  return {
    ...getHumorHypervisorStatus(),
    rubricVersion: RUBRIC_VERSION,
    feedback,
  };
}
