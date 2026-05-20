/**
 * GOOSE GAZETTE VIRALITY ENGINE
 * Modeled on Meridian system architecture (gos_engine.py / backtester.py)
 *
 * MERIDIAN → GOOSE MAPPING
 * ─────────────────────────────────────────────────────────────────────────────
 * κ (1.27324)       → headline geometry ratio (setup-words / punchline-words)
 * φ (1.61803)       → article depth multiplier (body paragraphs vs ideal)
 * κₕ (1.435)        → upper bound — content is "overheated" above this
 * α⁻¹ = 137         → max shares per day before circuit breaker fires
 * Ω-cycle (14.4d)   → content freshness cycle (DEPLOY/MONITOR/CONTRARIAN/REBALANCE)
 * Turbulence ceil.  → if CR news cycle is too "hot", hold content back
 * Scarab daily 5%   → Honk Protocol: if daily share velocity drops >5%, pause
 * signal_score      → v_score = κ_headline + timing + platform + momentum
 * composite Ψ(t)    → overall virality readiness ∈ [0,1]
 *
 * PHASE SYSTEM (14.4-day content cycle, mirroring Meridian Ω-cycle):
 *   DEPLOY      (day 0.0  – 3.4):  Full distribution push, all platforms
 *   MONITOR     (day 3.4  – 6.8):  Watch what's resonating, hold new posts
 *   CONTRARIAN  (day 6.8  – 10.2): Counter-programming — post unexpected angles
 *   REBALANCE   (day 10.2 – 14.4): Archive old content, prep next cycle
 *
 * SIGNAL THRESHOLD
 *   v_score ≥ 1.0 → ACTIVE (promote)
 *   v_score ≥ 2.0 → SPREADING (push across all platforms)
 *   v_score ≥ 3.0 → VIRAL (circuit-breaker arms; track compounding)
 *
 * ASYMMETRIC EXIT (compounding edge — backtester.py lines 278-293 analog):
 *   WIN:  shares overshoot → actual reach unbounded above v_score target
 *   LOSS: engagement floor → capped, never worse than -stop floor
 *   Over many articles the expected share-value tilts positive at ~67% hit rate
 */

// ── CONSTANTS (from gos_engine.py → GOSConstants) ────────────────────────────
const KAPPA        = 4 / Math.PI;        // 1.27324 — primary virality ratio
const PHI          = (1 + Math.sqrt(5)) / 2; // 1.61803 — depth multiplier
const KAPPA_H      = 1.435;              // upper bound (overheated content)
const ALPHA_INV    = 137;                // max daily share events before Scarab
const OMEGA_DAYS   = 14.4;              // content cycle period in days
const SCARAB_DAILY = 0.05;              // 5% daily velocity drop → pause
const SCARAB_TOTAL = 0.20;              // 20% total drop from peak → rebalance
const TURB_CEILING = 90.836;            // inherited from Meridian, maps to CR news noise
const HSF          = (KAPPA * KAPPA) / 10; // 0.162 — dampening threshold

// Peak sharing hours Costa Rica (UTC-6): 7–9am, 12–1pm, 7–10pm CR → UTC+6
const PEAK_HOURS_UTC = [13, 14, 18, 19, 25, 26, 27, 28].map(h => h % 24);
// Peak sharing days: Tue=2, Wed=3, Thu=4
const PEAK_DAYS = [2, 3, 4];
// Platform weights (WhatsApp dominates CR social)
const PLATFORM_WEIGHTS: Record<string, number> = {
  whatsapp: 2.0, twitter: 1.5, facebook: 1.0, copy: 0.5, other: 0.75,
};

// ── TYPES ─────────────────────────────────────────────────────────────────────
export type ContentPhase = "DEPLOY" | "MONITOR" | "CONTRARIAN" | "REBALANCE";

export interface VSignal {
  articleId: string;
  headline: string;
  vScore: number;            // composite virality signal (like signal_score)
  kappaComponent: number;    // κ_headline
  timingComponent: number;   // RSI analog — time of day/week
  platformComponent: number; // volume analog — platform diversity
  momentumComponent: number; // MACD analog — share velocity
  threshold: number;         // fires when vScore ≥ threshold
  fires: boolean;
}

export interface ContentPhaseState {
  phase: ContentPhase;
  dayInCycle: number;
  cyclePosition: number;     // 0.0–1.0
  phaseLabel: string;        // UI label (Meridian "UI:" convention)
  nextPhaseIn: number;       // ms until next phase
  recommendedAction: string;
}

export interface ViralityReadiness {
  psi: number;               // Ψ(t) ∈ [0,1] — composite readiness
  rotation: number;          // 128.23° × Ψ(t) — Klein twist analog
  kappaState: number;        // oscillates between κ and κₕ
  bellS: number;             // 2.0 + Ψ(t) × 0.828 (Bell S-value analog)
  dims: {
    timeOfDay: number;       // dim 1 — circadian posting window
    dayOfWeek: number;       // dim 2 — weekly engagement cycle
    shareVelocity: number;   // dim 3 — momentum (κ-Drift analog)
    platformDiversity: number; // dim 4 — spread across platforms
    contentAge: number;      // dim 5 — freshness (inverse decay)
    headlineGeometry: number; // dim 6 — κ ratio quality
    crNewsNoise: number;     // dim 7 — turbulence inverse
  };
}

export interface HonkProtocol {
  active: boolean;           // Scarab equivalent
  trigger: "daily_drop" | "total_drawdown" | null;
  dailyShareChange: number;
  totalDropFromPeak: number;
  blockedUntil: number | null;
  triggerCount: number;
}

export interface ArticleVirality {
  articleId: string;
  headline: string;
  vScore: number;
  phase: ContentPhase;
  readiness: number;
  shareEvents: Record<string, number>; // platform → count
  totalShares: number;
  peakSharesPerHour: number;
  currentSharesPerHour: number;
  capitalAnalog: number;    // "return" — shares compounded over time
  honkActive: boolean;
  publishedAt: number;
  lastShareAt: number | null;
}

export interface VEngine {
  phase: ContentPhaseState;
  readiness: ViralityReadiness;
  honk: HonkProtocol;
  articles: ArticleVirality[];
  topV: ArticleVirality | null;
  globalVScore: number;
  totalSharesToday: number;
  lastCycle: number;
}

// ── PHASE CALCULATOR ─────────────────────────────────────────────────────────
// Mirrors gos_engine.py → PhoenixHorizon
export function getContentPhase(now = Date.now()): ContentPhaseState {
  const CYCLE_MS = OMEGA_DAYS * 24 * 60 * 60 * 1000;
  const EPOCH = new Date("2026-01-01T00:00:00Z").getTime();
  const dayInCycle = ((now - EPOCH) % CYCLE_MS) / (24 * 60 * 60 * 1000);
  const cyclePosition = dayInCycle / OMEGA_DAYS;

  let phase: ContentPhase;
  let phaseLabel: string;
  let phaseEnd: number;
  let recommendedAction: string;

  if (dayInCycle < 3.395) {
    phase = "DEPLOY";
    phaseLabel = "PUSH";
    phaseEnd = 3.395;
    recommendedAction = "Full distribution — share on all platforms, prime audience";
  } else if (dayInCycle < 6.79) {
    phase = "MONITOR";
    phaseLabel = "WATCH";
    phaseEnd = 6.79;
    recommendedAction = "Observe resonance — identify which headlines are spreading";
  } else if (dayInCycle < 10.185) {
    phase = "CONTRARIAN";
    phaseLabel = "FLIP";
    phaseEnd = 10.185;
    recommendedAction = "Counter-programming — post unexpected angle, invert premise";
  } else {
    phase = "REBALANCE";
    phaseLabel = "ARCHIVE";
    phaseEnd = OMEGA_DAYS;
    recommendedAction = "Wind down — archive low performers, prep next cycle";
  }

  const nextPhaseIn = (phaseEnd - dayInCycle) * 24 * 60 * 60 * 1000;

  return { phase, dayInCycle, cyclePosition, phaseLabel, nextPhaseIn, recommendedAction };
}

// ── κ HEADLINE SCORE ─────────────────────────────────────────────────────────
// Mirrors κ_score in backtester.py lines 492-518
function kappaHeadlineScore(headline: string): number {
  const semicolonIdx = headline.indexOf(";");
  if (semicolonIdx < 0) {
    // No semicolon — check comma split
    const commaIdx = headline.indexOf(",");
    if (commaIdx < 0) return 0.5; // flat prose, neutral
    const ratio = commaIdx / (headline.length - commaIdx);
    const delta = Math.abs(ratio - KAPPA);
    return delta < 0.1 ? 1.5 : delta < 0.3 ? 0.5 : 0;
  }
  const setup = headline.slice(0, semicolonIdx).split(/\s+/).length;
  const punch = headline.slice(semicolonIdx + 1).trim().split(/\s+/).length;
  if (punch === 0) return 0;
  const ratio = setup / punch;
  const delta = Math.abs(ratio - KAPPA);
  if (delta < 0.005) return 3.0; // tight κ alignment
  if (delta < 0.02)  return 1.5; // near alignment
  if (delta < 0.05)  return 0.5; // loose alignment
  return 0.0;
}

// ── TIMING SCORE ─────────────────────────────────────────────────────────────
// RSI analog — measures how "overbought" or "oversold" the time slot is
function timingScore(now = Date.now()): number {
  const d = new Date(now);
  const hourUTC = d.getUTCHours();
  const dayOfWeek = d.getUTCDay();

  const hourScore  = PEAK_HOURS_UTC.includes(hourUTC) ? 2.0 : 0.5;
  const dayScore   = PEAK_DAYS.includes(dayOfWeek) ? 1.0 : 0.3;
  return hourScore + dayScore;
}

// ── PLATFORM SCORE ───────────────────────────────────────────────────────────
// Volume analog — κ-spike when diverse platform spread
function platformScore(shareEvents: Record<string, number>): number {
  const platforms = Object.keys(shareEvents).filter(p => (shareEvents[p] ?? 0) > 0);
  const totalShares = Object.values(shareEvents).reduce((s, v) => s + v, 0);
  const weightedTotal = platforms.reduce((s, p) =>
    s + (shareEvents[p] ?? 0) * (PLATFORM_WEIGHTS[p] ?? 0.75), 0);
  const diversity = platforms.length / Object.keys(PLATFORM_WEIGHTS).length;
  if (weightedTotal / Math.max(1, totalShares) >= KAPPA) return 2.0; // κ-spike
  if (diversity > 0.5) return 1.0;
  return 0.5;
}

// ── MOMENTUM SCORE ───────────────────────────────────────────────────────────
// MACD analog — share velocity vs phase direction
function momentumScore(
  sharesPerHour: number,
  phase: ContentPhase
): number {
  const momentum = sharesPerHour > KAPPA ? 2.0 : sharesPerHour > 0.5 ? 1.0 : 0.0;
  // Phase direction: CONTRARIAN phase inverts scoring (like INVERSE in Meridian)
  if (phase === "CONTRARIAN") return momentum > 0 ? 0.5 : 1.5; // reward low-momentum contrarian
  return momentum;
}

// ── COMPOSITE V-SCORE ────────────────────────────────────────────────────────
export function calcVScore(
  headline: string,
  shareEvents: Record<string, number>,
  sharesPerHour: number,
  phase: ContentPhase,
  now = Date.now()
): VSignal & { articleId: string } {
  const kappaComponent    = kappaHeadlineScore(headline);
  const timingComponent   = timingScore(now);
  const platformComponent = platformScore(shareEvents);
  const momentumComponent = momentumScore(sharesPerHour, phase);
  const vScore = kappaComponent + timingComponent + platformComponent + momentumComponent;

  // Full distribution mode: threshold relaxed (like full reinvest in Meridian)
  const baseThreshold = 2.5;
  const threshold = phase === "DEPLOY"
    ? Math.max(1.0, baseThreshold * 0.6) // relaxed in DEPLOY phase
    : baseThreshold;

  return {
    articleId: "",
    headline,
    vScore: Math.round(vScore * 1000) / 1000,
    kappaComponent,
    timingComponent,
    platformComponent,
    momentumComponent,
    threshold,
    fires: vScore >= threshold,
  };
}

// ── COMPOSITE Ψ(t) ───────────────────────────────────────────────────────────
// Maps quantum_state.py 13-dim composite to 7-dim content readiness
// Weights sum to 1.0, mirroring quantum_state.py weight structure
export function calcReadiness(
  article: ArticleVirality,
  now = Date.now()
): ViralityReadiness {
  const d = new Date(now);
  const hourUTC = d.getUTCHours();
  const dayOfWeek = d.getUTCDay();

  const ageHours = (now - article.publishedAt) / (1000 * 60 * 60);
  const ageDecay = Math.max(0, 1 - ageHours / (OMEGA_DAYS * 24)); // decays over full cycle

  const dims = {
    timeOfDay:         PEAK_HOURS_UTC.includes(hourUTC) ? 1.0 : 0.3,  // w=0.15
    dayOfWeek:         PEAK_DAYS.includes(dayOfWeek) ? 1.0 : 0.3,     // w=0.10
    shareVelocity:     Math.min(1.0, article.currentSharesPerHour / KAPPA_H), // w=0.20
    platformDiversity: Math.min(1.0, Object.keys(article.shareEvents).filter(p => (article.shareEvents[p] ?? 0) > 0).length / 4), // w=0.15
    contentAge:        ageDecay,                                         // w=0.15
    headlineGeometry:  Math.min(1.0, kappaHeadlineScore(article.headline) / 3.0), // w=0.15
    crNewsNoise:       0.7, // placeholder — would integrate CRHoy RSS noise level // w=0.10
  };

  const weights = [0.15, 0.10, 0.20, 0.15, 0.15, 0.15, 0.10];
  const dimVals = Object.values(dims);
  const psi = dimVals.reduce((s, v, i) => s + v * weights[i], 0);

  return {
    psi: Math.round(psi * 1000) / 1000,
    rotation: Math.round(128.23 * psi * 100) / 100,
    kappaState: KAPPA + (KAPPA_H - KAPPA) * psi,
    bellS: 2.0 + psi * 0.828,
    dims,
  };
}

// ── HONK PROTOCOL (Scarab Circuit Breaker) ────────────────────────────────────
// Direct port of backtester.py Scarab Protocol to content virality
let honkProtocol: HonkProtocol = {
  active: false,
  trigger: null,
  dailyShareChange: 0,
  totalDropFromPeak: 0,
  blockedUntil: null,
  triggerCount: 0,
};

let peakDailyShares = 0;
let yesterdayShares = 0;
let todayShares = 0;
let lastDayReset = Date.now();

function updateHonkProtocol(newShares: number): void {
  todayShares += newShares;
  if (todayShares > peakDailyShares) peakDailyShares = todayShares;

  const now = Date.now();
  if (now - lastDayReset > 24 * 60 * 60 * 1000) {
    const dailyChange = yesterdayShares > 0
      ? (todayShares - yesterdayShares) / yesterdayShares : 0;
    const totalDrop = peakDailyShares > 0
      ? (peakDailyShares - todayShares) / peakDailyShares : 0;

    honkProtocol.dailyShareChange = dailyChange;
    honkProtocol.totalDropFromPeak = totalDrop;

    if (dailyChange < -SCARAB_DAILY) {
      honkProtocol.active = true;
      honkProtocol.trigger = "daily_drop";
      honkProtocol.blockedUntil = now + 2 * 24 * 60 * 60 * 1000;
      honkProtocol.triggerCount++;
      console.log(`[VIRALITY] Honk Protocol: daily share drop ${(dailyChange * 100).toFixed(1)}% — pausing 48h`);
    } else if (totalDrop > SCARAB_TOTAL) {
      honkProtocol.active = true;
      honkProtocol.trigger = "total_drawdown";
      honkProtocol.blockedUntil = now + 2 * 24 * 60 * 60 * 1000;
      honkProtocol.triggerCount++;
      console.log(`[VIRALITY] Honk Protocol: total drop ${(totalDrop * 100).toFixed(1)}% from peak — rebalancing`);
    } else if (honkProtocol.active && honkProtocol.blockedUntil && now > honkProtocol.blockedUntil) {
      honkProtocol.active = false;
      honkProtocol.trigger = null;
      honkProtocol.blockedUntil = null;
      console.log("[VIRALITY] Honk Protocol lifted — resuming distribution");
    }

    yesterdayShares = todayShares;
    todayShares = 0;
    lastDayReset = now;
  }
}

// ── IN-MEMORY REGISTRY ────────────────────────────────────────────────────────
const articles = new Map<string, ArticleVirality>();
let engineState: VEngine | null = null;

export function registerArticle(id: string, headline: string, publishedAt: number): ArticleVirality {
  const phase = getContentPhase().phase;
  const existing = articles.get(id);
  if (existing) return existing;

  const av: ArticleVirality = {
    articleId: id,
    headline,
    vScore: 0,
    phase,
    readiness: 0,
    shareEvents: {},
    totalShares: 0,
    peakSharesPerHour: 0,
    currentSharesPerHour: 0,
    capitalAnalog: 1.0, // starts at 1.0 like Meridian $1 seed
    honkActive: false,
    publishedAt,
    lastShareAt: null,
  };

  const sig = calcVScore(headline, {}, 0, phase);
  av.vScore = sig.vScore;

  const r = calcReadiness(av);
  av.readiness = r.psi;

  articles.set(id, av);
  return av;
}

export function recordVShare(id: string, platform: string): ArticleVirality | null {
  const av = articles.get(id);
  if (!av) return null;

  av.shareEvents[platform] = (av.shareEvents[platform] ?? 0) + 1;
  av.totalShares++;
  av.lastShareAt = Date.now();

  // Compounding edge: capitalAnalog grows exponentially on share events
  // Mirrors: wins exit at market close, actual gains > target (overshoot captured)
  const platformBoost = PLATFORM_WEIGHTS[platform] ?? 0.75;
  av.capitalAnalog = av.capitalAnalog * (1 + (platformBoost * 0.01));

  // Recalculate velocity (simple hourly estimate)
  const ageHours = Math.max(1, (Date.now() - av.publishedAt) / (1000 * 60 * 60));
  av.currentSharesPerHour = av.totalShares / ageHours;
  if (av.currentSharesPerHour > av.peakSharesPerHour) {
    av.peakSharesPerHour = av.currentSharesPerHour;
  }

  // Recalc v-score with new data
  const phase = getContentPhase().phase;
  const sig = calcVScore(av.headline, av.shareEvents, av.currentSharesPerHour, phase);
  av.vScore = sig.vScore;
  av.phase = phase;

  const r = calcReadiness(av);
  av.readiness = r.psi;

  updateHonkProtocol(1);

  articles.set(id, av);
  return av;
}

// ── STATE BUILDER ─────────────────────────────────────────────────────────────
function buildEngineState(): VEngine {
  const phase = getContentPhase();
  const allArts = Array.from(articles.values());
  const sorted = allArts.sort((a, b) => b.vScore - a.vScore);

  const now = Date.now();
  const dayStart = new Date(now); dayStart.setUTCHours(0,0,0,0);
  const todayArts = allArts.filter(a => a.lastShareAt && a.lastShareAt >= dayStart.getTime());
  const totalSharesToday = todayArts.reduce((s, a) => s + a.totalShares, 0);

  const activeArts = allArts.filter(a => a.vScore >= 1.0);
  const globalVScore = activeArts.length > 0
    ? activeArts.reduce((s, a) => s + a.vScore, 0) / activeArts.length : 0;

  // Ψ(t) readiness for the top article (or neutral if none)
  const top = sorted[0];
  const readiness = top
    ? calcReadiness(top)
    : { psi: 0.5, rotation: 64.12, kappaState: KAPPA, bellS: 2.414, dims: {} as any };

  return {
    phase,
    readiness,
    honk: honkProtocol,
    articles: sorted.slice(0, 20),
    topV: top ?? null,
    globalVScore: Math.round(globalVScore * 1000) / 1000,
    totalSharesToday,
    lastCycle: Date.now(),
  };
}

// ── CYCLE ─────────────────────────────────────────────────────────────────────
async function runCycle() {
  try {
    const { storage } = await import("./storage");
    const dbArticles = await storage.getGooseArticles(50);
    for (const a of dbArticles) {
      if (!articles.has(a.id)) {
        registerArticle(a.id, a.headline, new Date(a.publishedAt).getTime());
      }
    }
    engineState = buildEngineState();
  } catch (e: any) {
    console.warn("[VIRALITY] Cycle error:", e.message);
  }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export function getVEngineState(): VEngine | null { return engineState; }
export function getArticleVScore(id: string) { return articles.get(id) ?? null; }
export function getPhaseState() { return getContentPhase(); }

let _timer: ReturnType<typeof setInterval> | null = null;

export function startViralityEngine() {
  console.log(`[VIRALITY] Meridian Virality Engine started — κ=${KAPPA.toFixed(5)}, Ω=${OMEGA_DAYS}d, α⁻¹=${ALPHA_INV}`);
  setTimeout(() => runCycle(), 8000);
  _timer = setInterval(() => runCycle(), 5 * 60 * 1000);
}
