import { runAllCollectorsOnce } from "./collectors";
import { runCorrelationCycleOnce, getCorrelatorStatus } from "./auto-correlator";
import { runScanCycleOnce, getScannerStatus } from "./kiwisdr-scanner";
import { runHeartbeatOnce, getWatchdogStatus } from "./network-watchdog";
import { kappaEngine } from "./kappa-engine";

export type PipelineMode = "STANDBY" | "PATROL" | "ELEVATED" | "SURGE";

interface PipelineState {
  running: boolean;
  mode: PipelineMode;
  intervalMs: number;
  lastRun: number | null;
  nextRun: number | null;
  cycleCount: number;
  lastResult: PipelineResult | null;
  timer: ReturnType<typeof setTimeout> | null;
  consecutiveElevated: number;
}

export interface PipelineResult {
  timestamp: number;
  durationMs: number;
  mode: PipelineMode;
  collectors: { flights: number; satellites: number; weather: number };
  correlationsTotal: number;
  scannerDetections: number;
  watchdogDrops: number;
  kappaScore: number;
  threatLevel: string;
  eveningWindowActive: boolean;
  rampedUp: boolean;
}

export interface PipelineStatus {
  running: boolean;
  mode: PipelineMode;
  intervalMs: number;
  intervalLabel: string;
  lastRun: number | null;
  nextRun: number | null;
  cycleCount: number;
  lastResult: PipelineResult | null;
  consecutiveElevated: number;
  thresholds: typeof THRESHOLDS;
}

const INTERVALS: Record<PipelineMode, number> = {
  STANDBY: 15 * 60_000,
  PATROL: 10 * 60_000,
  ELEVATED: 5 * 60_000,
  SURGE: 2 * 60_000,
};

const INTERVAL_LABELS: Record<PipelineMode, string> = {
  STANDBY: "15 min",
  PATROL: "10 min",
  ELEVATED: "5 min",
  SURGE: "2 min",
};

const THRESHOLDS = {
  PATROL_SCORE: 30,
  ELEVATED_SCORE: 60,
  SURGE_SCORE: 80,
  EVENING_WINDOW_BOOST: true,
  CONSECUTIVE_FOR_SURGE: 3,
  COOLDOWN_CYCLES: 5,
};

let state: PipelineState = {
  running: false,
  mode: "STANDBY",
  intervalMs: INTERVALS.STANDBY,
  lastRun: null,
  nextRun: null,
  cycleCount: 0,
  lastResult: null,
  timer: null,
  consecutiveElevated: 0,
};

function determineMode(kappaScore: number, eveningActive: boolean, consecutiveElevated: number): PipelineMode {
  if (kappaScore >= THRESHOLDS.SURGE_SCORE || consecutiveElevated >= THRESHOLDS.CONSECUTIVE_FOR_SURGE) {
    return "SURGE";
  }
  if (kappaScore >= THRESHOLDS.ELEVATED_SCORE || eveningActive) {
    return "ELEVATED";
  }
  if (kappaScore >= THRESHOLDS.PATROL_SCORE) {
    return "PATROL";
  }
  return "STANDBY";
}

async function runPipelineCycle(): Promise<PipelineResult> {
  const startMs = Date.now();

  console.log(`[pipeline] === FULL SWEEP #${state.cycleCount + 1} (${state.mode}) ===`);

  console.log("[pipeline] Stage 1/4: Collectors...");
  const collectorResults = await runAllCollectorsOnce();
  const totalCollected = collectorResults.flights + collectorResults.satellites + collectorResults.weather;
  console.log(`[pipeline] Collected: ${totalCollected} events (flights=${collectorResults.flights}, sats=${collectorResults.satellites}, wx=${collectorResults.weather})`);

  console.log("[pipeline] Stage 2/4: Network watchdog...");
  await runHeartbeatOnce();
  const wdStatus = getWatchdogStatus();

  console.log("[pipeline] Stage 3/4: KiwiSDR scan...");
  await runScanCycleOnce();
  const scanStatus = getScannerStatus();

  console.log("[pipeline] Stage 4/4: Correlation engine...");
  await runCorrelationCycleOnce();
  const corrStatus = getCorrelatorStatus();

  const kappaStatus = kappaEngine.getStatus();
  const durationMs = Date.now() - startMs;

  const result: PipelineResult = {
    timestamp: Date.now(),
    durationMs,
    mode: state.mode,
    collectors: collectorResults,
    correlationsTotal: corrStatus.totalCorrelations,
    scannerDetections: scanStatus.detections,
    watchdogDrops: wdStatus.dropCount,
    kappaScore: kappaStatus.score,
    threatLevel: kappaStatus.threatLevel,
    eveningWindowActive: kappaStatus.eveningWindow?.active ?? false,
    rampedUp: false,
  };

  const isElevatedCycle = kappaStatus.score >= THRESHOLDS.ELEVATED_SCORE || (kappaStatus.eveningWindow?.active ?? false);
  if (isElevatedCycle) {
    state.consecutiveElevated++;
  } else {
    state.consecutiveElevated = 0;
  }

  const newMode = determineMode(
    kappaStatus.score,
    kappaStatus.eveningWindow?.active ?? false,
    state.consecutiveElevated
  );

  if (newMode !== state.mode) {
    console.log(`[pipeline] Mode change: ${state.mode} → ${newMode} (κ=${kappaStatus.score.toFixed(1)}, evening=${kappaStatus.eveningWindow?.active}, consecutive=${state.consecutiveElevated})`);
    result.rampedUp = INTERVALS[newMode] < INTERVALS[state.mode];
    state.mode = newMode;
    state.intervalMs = INTERVALS[newMode];
  }

  state.lastRun = Date.now();
  state.cycleCount++;
  state.lastResult = result;

  console.log(`[pipeline] Sweep complete in ${durationMs}ms — κ=${kappaStatus.score.toFixed(1)} ${kappaStatus.threatLevel}, next in ${INTERVAL_LABELS[state.mode]}`);

  return result;
}

function clearTimer(): void {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

function scheduleNext(): void {
  if (!state.running) return;

  clearTimer();
  state.nextRun = Date.now() + state.intervalMs;

  state.timer = setTimeout(async () => {
    if (!state.running) return;
    try {
      await runPipelineCycle();
    } catch (err) {
      console.error("[pipeline] Cycle error:", err);
    }
    scheduleNext();
  }, state.intervalMs);
}

export function startPipeline(): void {
  if (state.running) return;
  state.running = true;
  state.mode = "STANDBY";
  state.intervalMs = INTERVALS.STANDBY;

  console.log("[KAPPA] Adaptive pipeline started — 15min baseline, ramps on activity/evening window");
  console.log("[KAPPA] Note: Pipeline is the sole orchestrator. Subsystem timers run independently for real-time data; pipeline adds periodic full sweeps.");

  state.nextRun = Date.now() + 30_000;
  state.timer = setTimeout(async () => {
    if (!state.running) return;
    try {
      await runPipelineCycle();
    } catch (err) {
      console.error("[pipeline] Initial cycle error:", err);
    }
    scheduleNext();
  }, 30_000);
}

export function stopPipeline(): void {
  state.running = false;
  clearTimer();
  state.nextRun = null;
  console.log("[KAPPA] Adaptive pipeline stopped");
}

export async function runPipelineOnce(): Promise<PipelineResult> {
  const result = await runPipelineCycle();
  if (state.running) {
    scheduleNext();
  }
  return result;
}

export function getPipelineStatus(): PipelineStatus {
  return {
    running: state.running,
    mode: state.mode,
    intervalMs: state.intervalMs,
    intervalLabel: INTERVAL_LABELS[state.mode],
    lastRun: state.lastRun,
    nextRun: state.nextRun,
    cycleCount: state.cycleCount,
    lastResult: state.lastResult,
    consecutiveElevated: state.consecutiveElevated,
    thresholds: THRESHOLDS,
  };
}
