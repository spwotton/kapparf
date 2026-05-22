/**
 * GAZETTE PRESS ROOM VISION HYPERVISOR
 * Autonomous screenshot → vision scoring → surgical CSS proposal → rollback log
 */

import { chromium } from "playwright-core";
import OpenAI from "openai";
import { db } from "./db";
import { gazetteSnapshots } from "@shared/schema";
import type { GazetteSnapshot } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

const CHROMIUM_PATH = "/nix/store/12iaw5ng4xvxxffm381lgxlh1ysh0bl4-playwright-browsers/chromium-1134/chrome-linux/chrome";
const GAZETTE_URL = "http://localhost:5000/goose";

const aiBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const aiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const aiClient = aiBaseURL && aiKey
  ? new OpenAI({ apiKey: aiKey, baseURL: aiBaseURL })
  : null;

// ─── THE CONSTITUTION ──────────────────────────────────────────────────────────
export const CONSTITUTION = {
  version: "1.0",
  scoreWeights: { readability: 0.25, satireSharpness: 0.30, visualHierarchy: 0.20, hookStrength: 0.25 },
  maxChanges: {
    fontSizeDeltaRem: 0.3,
    spacingDeltaRem: 0.25,
    colorLightnessDeltaPct: 20,
    borderRadiusDeltaPx: 6,
    opacityDelta: 0.10,
  },
  protectedKeywords: ["kappa", "masthead-brand", "goose-logo", "breaking-ticker"],
  minScoreDelta: 2,
  onlyOneRulePerProposal: true,
};

// ─── IN-MEMORY STATE ──────────────────────────────────────────────────────────
let activeCss = "";
let activeVersionId: string | null = null;
let autoRunEnabled = false;
let autoRunTimer: NodeJS.Timeout | null = null;
let lastRunAt: Date | null = null;
let isRunning = false;
let cycleCount = 0;
const AUTO_INTERVAL_MS = 30 * 60 * 1000;

// ─── SCREENSHOTS ──────────────────────────────────────────────────────────────
async function captureScreenshots(): Promise<{ desktop: string; mobile: string; error?: string }> {
  let browser: any = null;
  try {
    browser = await chromium.launch({
      executablePath: CHROMIUM_PATH,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      headless: true,
    });

    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopCtx.newPage();
    await desktopPage.goto(GAZETTE_URL, { waitUntil: "domcontentloaded", timeout: 25000 });
    await desktopPage.waitForTimeout(2500);
    const desktopBuf: Buffer = await desktopPage.screenshot({ type: "jpeg", quality: 72 });
    await desktopCtx.close();

    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(GAZETTE_URL, { waitUntil: "domcontentloaded", timeout: 25000 });
    await mobilePage.waitForTimeout(2000);
    const mobileBuf: Buffer = await mobilePage.screenshot({ type: "jpeg", quality: 72 });
    await mobileCtx.close();

    return {
      desktop: `data:image/jpeg;base64,${desktopBuf.toString("base64")}`,
      mobile: `data:image/jpeg;base64,${mobileBuf.toString("base64")}`,
    };
  } catch (e: any) {
    console.error("[GAZETTE-REFINER] Screenshot failed:", e.message);
    return { desktop: "", mobile: "", error: e.message };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ─── VISION SCORING ───────────────────────────────────────────────────────────
interface ScoreResult {
  readability: number;
  satireSharpness: number;
  visualHierarchy: number;
  hookStrength: number;
  composite: number;
  lowestDimension: string;
  visionNotes: string;
  criticalIssue: string;
}

async function analyzeScreenshots(desktopB64: string, mobileB64: string): Promise<ScoreResult> {
  if (!aiClient) throw new Error("AI client not configured");

  const content: any[] = [
    { type: "text", text: "Desktop view (1440px wide):" },
  ];
  if (desktopB64) content.push({ type: "image_url", image_url: { url: desktopB64, detail: "low" } });
  if (mobileB64) {
    content.push({ type: "text", text: "Mobile view (390px wide):" });
    content.push({ type: "image_url", image_url: { url: mobileB64, detail: "low" } });
  }

  const resp = await (aiClient as any).chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert satirical newspaper web designer reviewing "The Goose Gazette" — a Costa Rican satirical site in the tradition of The Onion.

Score on four dimensions (0–100):
• READABILITY (25%): Legibility, font clarity, contrast, scanability
• SATIRE_SHARPNESS (30%): Does the visual design amplify the satirical voice?
• VISUAL_HIERARCHY (20%): Eye flow, headline prominence, section organization
• HOOK_STRENGTH (25%): Would a casual visitor stop and read?

Return JSON exactly:
{
  "readability": <int>,
  "satireSharpness": <int>,
  "visualHierarchy": <int>,
  "hookStrength": <int>,
  "composite": <float weighted 0.25/0.30/0.20/0.25>,
  "lowestDimension": "<camelCase name of lowest>",
  "visionNotes": "<2 sentences: what works, what doesn't>",
  "criticalIssue": "<the single most impactful visual problem — specific and actionable>"
}`,
      },
      { role: "user", content },
    ],
    response_format: { type: "json_object" },
    max_tokens: 350,
  });

  const r = JSON.parse(resp.choices[0].message.content!);
  const w = CONSTITUTION.scoreWeights;
  r.composite = parseFloat(
    (r.readability * w.readability +
      r.satireSharpness * w.satireSharpness +
      r.visualHierarchy * w.visualHierarchy +
      r.hookStrength * w.hookStrength).toFixed(1)
  );
  return r as ScoreResult;
}

// ─── CSS PROPOSAL ─────────────────────────────────────────────────────────────
export interface PatchRule {
  selector: string;
  property: string;
  from: string;
  to: string;
  rationale: string;
}

async function generateCssPatch(
  scores: ScoreResult,
  currentCss: string,
  screenshotB64: string
): Promise<{ rules: PatchRule[]; rawCss: string; rationale: string; expectedImprovement: string }> {
  if (!aiClient) throw new Error("AI client not configured");

  const content: any[] = [{ type: "text", text: "Current page screenshot:" }];
  if (screenshotB64) content.push({ type: "image_url", image_url: { url: screenshotB64, detail: "low" } });

  const resp = await (aiClient as any).chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a surgical CSS editor for The Goose Gazette satirical newspaper.

THE CONSTITUTION (strict, non-negotiable):
1. Change ONLY ONE CSS property — surgical, never sweeping
2. Font size changes: max ±0.3rem or ±4px
3. Spacing changes: max ±0.25rem
4. Colors: only adjust opacity or use similar hues — max 20% lightness shift, no new palette colors
5. NEVER touch selectors containing: ${CONSTITUTION.protectedKeywords.map(k => `"${k}"`).join(", ")}
6. Write valid CSS only
7. Target the most specific element that addresses the critical issue

Currently active CSS overrides:
${currentCss || "(none — clean baseline)"}

Critical issue to address: "${scores.criticalIssue}"
Lowest scoring dimension: ${scores.lowestDimension} (score: ${(scores as any)[scores.lowestDimension] ?? "?"})

Return JSON:
{
  "rule": {
    "selector": "<specific CSS selector>",
    "property": "<one CSS property name>",
    "from": "<current value>",
    "to": "<improved value>",
    "rationale": "<why this specifically helps>"
  },
  "rawCss": "<complete CSS rule block ready to inject as <style>>",
  "rationale": "<1 sentence summary of the change>",
  "expectedImprovement": "<dimension name and estimated point gain>"
}`,
      },
      { role: "user", content },
    ],
    response_format: { type: "json_object" },
    max_tokens: 450,
  });

  const p = JSON.parse(resp.choices[0].message.content!);
  return {
    rules: p.rule ? [p.rule] : [],
    rawCss: p.rawCss ?? "",
    rationale: p.rationale ?? "",
    expectedImprovement: p.expectedImprovement ?? "",
  };
}

// ─── CONSTITUTION VALIDATOR ───────────────────────────────────────────────────
export function validatePatch(rules: PatchRule[]): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const rule of rules) {
    for (const kw of CONSTITUTION.protectedKeywords) {
      if (rule.selector.toLowerCase().includes(kw)) {
        violations.push(`Protected selector: "${rule.selector}" contains "${kw}"`);
      }
    }
  }
  return { valid: violations.length === 0, violations };
}

// ─── VERSION MANAGEMENT ───────────────────────────────────────────────────────
async function getNextVersion(): Promise<number> {
  const rows = await db
    .select({ v: gazetteSnapshots.version })
    .from(gazetteSnapshots)
    .orderBy(desc(gazetteSnapshots.version))
    .limit(1);
  return rows.length > 0 ? (rows[0].v ?? 0) + 1 : 1;
}

export async function runGazetteSnapshot(): Promise<GazetteSnapshot> {
  if (isRunning) throw new Error("Snapshot already in progress");
  isRunning = true;
  const t0 = Date.now();

  try {
    console.log("[GAZETTE-REFINER] Starting snapshot…");
    const shots = await captureScreenshots();

    let scores: any = null;
    let visionNotes = "";
    let lowestDimension = "";
    if (shots.desktop && aiClient) {
      try {
        const s = await analyzeScreenshots(shots.desktop, shots.mobile);
        scores = s;
        visionNotes = s.visionNotes;
        lowestDimension = s.lowestDimension;
        console.log(`[GAZETTE-REFINER] composite=${s.composite} lowest=${s.lowestDimension}`);
      } catch (e: any) {
        console.warn("[GAZETTE-REFINER] Vision analysis failed:", e.message);
      }
    }

    const version = await getNextVersion();
    const [row] = await db
      .insert(gazetteSnapshots)
      .values({
        version,
        status: "snapshot",
        screenshotDesktop: shots.desktop || null,
        screenshotMobile: shots.mobile || null,
        scores,
        visionNotes,
        lowestDimension: lowestDimension || null,
        cssPatch: activeCss || null,
        generatedBy: "gpt-4o-mini",
        parentId: activeVersionId,
      })
      .returning();

    lastRunAt = new Date();
    cycleCount++;
    console.log(`[GAZETTE-REFINER] Snapshot v${version} stored in ${Date.now() - t0}ms`);
    return row;
  } finally {
    isRunning = false;
  }
}

export async function proposeGazetteChange(snapshotId: string): Promise<GazetteSnapshot> {
  const [snap] = await db.select().from(gazetteSnapshots).where(eq(gazetteSnapshots.id, snapshotId));
  if (!snap) throw new Error("Snapshot not found");
  if (!snap.scores) throw new Error("No vision scores on this snapshot — run snapshot first");
  if (!aiClient) throw new Error("AI client not configured");

  const proposal = await generateCssPatch(
    snap.scores as ScoreResult,
    activeCss,
    snap.screenshotDesktop ?? ""
  );

  const validation = validatePatch(proposal.rules);
  if (!validation.valid) {
    console.warn("[GAZETTE-REFINER] Proposal violated constitution:", validation.violations);
  }

  const version = await getNextVersion();
  const [row] = await db
    .insert(gazetteSnapshots)
    .values({
      version,
      status: "proposed",
      screenshotDesktop: snap.screenshotDesktop,
      screenshotMobile: snap.screenshotMobile,
      scores: snap.scores,
      visionNotes: snap.visionNotes,
      lowestDimension: snap.lowestDimension,
      cssPatch: proposal.rawCss,
      cssPatchRules: proposal.rules as any,
      rationale: proposal.rationale,
      generatedBy: "gpt-4o-mini",
      parentId: snapshotId,
    })
    .returning();

  console.log(`[GAZETTE-REFINER] Proposal v${version}: ${proposal.rationale}`);
  return row;
}

export async function applyGazetteVersion(id: string): Promise<void> {
  const [row] = await db.select().from(gazetteSnapshots).where(eq(gazetteSnapshots.id, id));
  if (!row) throw new Error("Version not found");

  if (activeVersionId && activeVersionId !== id) {
    await db
      .update(gazetteSnapshots)
      .set({ status: "archived" })
      .where(eq(gazetteSnapshots.id, activeVersionId));
  }

  activeCss = row.cssPatch ?? "";
  activeVersionId = id;

  await db
    .update(gazetteSnapshots)
    .set({ status: "live", appliedAt: new Date() })
    .where(eq(gazetteSnapshots.id, id));

  console.log(`[GAZETTE-REFINER] Applied v${row.version}: "${row.rationale ?? "(no rationale)"}"`);
}

export async function rollbackGazetteTo(id: string): Promise<void> {
  const [row] = await db.select().from(gazetteSnapshots).where(eq(gazetteSnapshots.id, id));
  if (!row) throw new Error("Version not found");

  if (activeVersionId && activeVersionId !== id) {
    await db
      .update(gazetteSnapshots)
      .set({ status: "rolled_back", revertedAt: new Date() })
      .where(eq(gazetteSnapshots.id, activeVersionId));
  }

  activeCss = row.cssPatch ?? "";
  activeVersionId = id;

  await db
    .update(gazetteSnapshots)
    .set({ status: "live", appliedAt: new Date(), revertedAt: null })
    .where(eq(gazetteSnapshots.id, id));

  console.log(`[GAZETTE-REFINER] Rolled back to v${row.version} (${row.tag ?? "untagged"})`);
}

export async function clearGazetteOverrides(): Promise<void> {
  if (activeVersionId) {
    await db
      .update(gazetteSnapshots)
      .set({ status: "archived" })
      .where(eq(gazetteSnapshots.id, activeVersionId));
  }
  activeCss = "";
  activeVersionId = null;
  console.log("[GAZETTE-REFINER] Cleared all overrides — clean baseline");
}

export async function tagGazetteVersion(id: string, tag: string): Promise<void> {
  await db.update(gazetteSnapshots).set({ tag }).where(eq(gazetteSnapshots.id, id));
}

export async function getGazetteLog(limit = 50): Promise<GazetteSnapshot[]> {
  return db
    .select()
    .from(gazetteSnapshots)
    .orderBy(desc(gazetteSnapshots.createdAt))
    .limit(limit);
}

export function getActiveCss(): string {
  return activeCss;
}

export function setAutoRun(enabled: boolean): void {
  autoRunEnabled = enabled;
  if (autoRunTimer) { clearTimeout(autoRunTimer); autoRunTimer = null; }
  if (enabled) scheduleNext();
  console.log(`[GAZETTE-REFINER] Auto-run ${enabled ? "enabled" : "disabled"} (${AUTO_INTERVAL_MS / 60000}min interval)`);
}

function scheduleNext(): void {
  autoRunTimer = setTimeout(async () => {
    if (!autoRunEnabled) return;
    try { await runGazetteSnapshot(); } catch (e: any) { console.warn("[GAZETTE-REFINER] Auto snapshot failed:", e.message); }
    if (autoRunEnabled) scheduleNext();
  }, AUTO_INTERVAL_MS);
}

export function getGazetteRefinerStatus() {
  return {
    autoRunEnabled,
    isRunning,
    lastRunAt: lastRunAt?.toISOString() ?? null,
    cycleCount,
    activeVersionId,
    activeCssLength: activeCss.length,
    constitution: CONSTITUTION,
  };
}

export async function initGazetteRefiner(): Promise<void> {
  try {
    const rows = await db
      .select()
      .from(gazetteSnapshots)
      .where(eq(gazetteSnapshots.status, "live"))
      .orderBy(desc(gazetteSnapshots.createdAt))
      .limit(1);

    if (rows.length > 0) {
      activeCss = rows[0].cssPatch ?? "";
      activeVersionId = rows[0].id;
      console.log(`[GAZETTE-REFINER] Restored live v${rows[0].version} from DB`);
    } else {
      console.log("[GAZETTE-REFINER] No live version — starting from clean baseline");
    }
  } catch (e: any) {
    console.warn("[GAZETTE-REFINER] Init error (DB may not be migrated yet):", e.message);
  }
}
