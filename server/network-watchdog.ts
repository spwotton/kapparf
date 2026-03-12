import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import { KAPPA_CONSTANTS, type WatchdogStatus } from "@shared/schema";

const K = KAPPA_CONSTANTS;

const HEARTBEAT_TARGETS = [
  { host: "8.8.8.8", name: "Google DNS" },
  { host: "1.1.1.1", name: "Cloudflare DNS" },
  { host: "208.67.222.222", name: "OpenDNS" },
];

const HEARTBEAT_INTERVAL_MS = 30_000;
const DROP_THRESHOLD_MS = 10_000;
const TR069_IAT_TOLERANCE = 0.01;

interface NetworkEvent {
  timestamp: number;
  type: "drop" | "reconnect" | "latency-spike" | "tr069-pulse" | "seismic-jitter";
  target: string;
  latencyMs: number | null;
  details: string;
}

interface WatchdogState {
  running: boolean;
  lastHeartbeat: number | null;
  networkActive: boolean;
  dropCount: number;
  reconnectCount: number;
  tr069PulseCount: number;
  seismicJitterCount: number;
  latencyHistory: number[];
  events: NetworkEvent[];
  timer: ReturnType<typeof setInterval> | null;
  ipatBuffer: number[];
}

let state: WatchdogState = {
  running: false,
  lastHeartbeat: null,
  networkActive: true,
  dropCount: 0,
  reconnectCount: 0,
  tr069PulseCount: 0,
  seismicJitterCount: 0,
  latencyHistory: [],
  events: [],
  timer: null,
  ipatBuffer: [],
};

const MAX_EVENTS = 100;
const MAX_LATENCY_HISTORY = 120;
const MAX_IPAT_BUFFER = 50;

async function checkHeartbeat(target: typeof HEARTBEAT_TARGETS[0]): Promise<number | null> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DROP_THRESHOLD_MS);

    const response = await fetch(`https://dns.google/resolve?name=example.com&type=A`, {
      signal: controller.signal,
      headers: { "User-Agent": "KAPPA-WATCHDOG/4.20" },
    });
    clearTimeout(timeout);

    if (response.ok) {
      return Date.now() - start;
    }
    return null;
  } catch {
    return null;
  }
}

function analyzeIPAT(timestamps: number[]): { pulsing: boolean; dominantHz: number | null; matchesPRF: boolean } {
  if (timestamps.length < 3) return { pulsing: false, dominantHz: null, matchesPRF: false };

  const deltas: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    deltas.push((timestamps[i] - timestamps[i - 1]) / 1000);
  }

  const prfPeriod = K.PRF_PERIOD_MS / 1000;
  let prfMatches = 0;
  for (const d of deltas) {
    if (Math.abs(d - prfPeriod) < prfPeriod * TR069_IAT_TOLERANCE) {
      prfMatches++;
    }
  }

  const matchesPRF = prfMatches >= deltas.length * 0.3;

  const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  const dominantHz = avgDelta > 0 ? 1 / avgDelta : null;

  const variance = deltas.reduce((s, d) => s + (d - avgDelta) ** 2, 0) / deltas.length;
  const cv = avgDelta > 0 ? Math.sqrt(variance) / avgDelta : 1;
  const pulsing = cv < 0.15 && deltas.length >= 5;

  return { pulsing, dominantHz, matchesPRF };
}

function detectSeismicJitter(latencies: number[]): boolean {
  if (latencies.length < 10) return false;

  const recent = latencies.slice(-10);
  const baseline = latencies.slice(0, Math.max(1, latencies.length - 10));

  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const baselineAvg = baseline.reduce((s, v) => s + v, 0) / baseline.length;

  const recentVariance = recent.reduce((s, v) => s + (v - recentAvg) ** 2, 0) / recent.length;
  const baselineVariance = baseline.length > 0
    ? baseline.reduce((s, v) => s + (v - baselineAvg) ** 2, 0) / baseline.length
    : 0;

  return recentVariance > baselineVariance * 3 && recentAvg > baselineAvg * 1.5;
}

function addEvent(event: NetworkEvent) {
  state.events.unshift(event);
  if (state.events.length > MAX_EVENTS) state.events.pop();
}

async function runHeartbeatCycle(): Promise<void> {
  const now = Date.now();
  let anyResponded = false;

  for (const target of HEARTBEAT_TARGETS) {
    const latency = await checkHeartbeat(target);

    if (latency !== null) {
      anyResponded = true;
      state.latencyHistory.push(latency);
      if (state.latencyHistory.length > MAX_LATENCY_HISTORY) state.latencyHistory.shift();

      state.ipatBuffer.push(now);
      if (state.ipatBuffer.length > MAX_IPAT_BUFFER) state.ipatBuffer.shift();

      if (latency > 500) {
        addEvent({
          timestamp: now,
          type: "latency-spike",
          target: target.name,
          latencyMs: latency,
          details: `High latency: ${latency}ms to ${target.name}`,
        });
      }
    }
  }

  if (!anyResponded && state.networkActive) {
    state.networkActive = false;
    state.dropCount++;

    addEvent({
      timestamp: now,
      type: "drop",
      target: "all",
      latencyMs: null,
      details: `Network drop #${state.dropCount} — all heartbeat targets unreachable`,
    });

    const dropEvent = await storage.createSignalEvent({
      domain: "isp",
      source: "network-watchdog",
      eventType: "network-drop",
      frequency: null,
      confidence: 0.95,
      metadata: {
        dropNumber: state.dropCount,
        targets: HEARTBEAT_TARGETS.map(t => t.name),
        lat: K.OBSERVER_LAT,
        lon: K.OBSERVER_LON,
        description: "Network connectivity lost — possible TR-069 forced reset or physical layer disruption",
      },
      raw: null,
    });

    kappaEngine.ingest(dropEvent);
    hypervisor.ingestEvent(dropEvent);
  } else if (anyResponded && !state.networkActive) {
    state.networkActive = true;
    state.reconnectCount++;

    const downtime = state.events.find(e => e.type === "drop");
    const downtimeMs = downtime ? now - downtime.timestamp : 0;

    addEvent({
      timestamp: now,
      type: "reconnect",
      target: "recovered",
      latencyMs: state.latencyHistory[state.latencyHistory.length - 1] || null,
      details: `Reconnected after ${(downtimeMs / 1000).toFixed(1)}s downtime`,
    });

    const reconnectEvent = await storage.createSignalEvent({
      domain: "isp",
      source: "network-watchdog",
      eventType: "network-reconnect",
      frequency: null,
      confidence: 0.9,
      metadata: {
        downtimeMs,
        reconnectNumber: state.reconnectCount,
        lat: K.OBSERVER_LAT,
        lon: K.OBSERVER_LON,
      },
      raw: null,
    });

    kappaEngine.ingest(reconnectEvent);
    hypervisor.ingestEvent(reconnectEvent);
  }

  if (state.networkActive && state.ipatBuffer.length >= 5) {
    const ipat = analyzeIPAT(state.ipatBuffer);

    if (ipat.matchesPRF) {
      state.tr069PulseCount++;

      addEvent({
        timestamp: now,
        type: "tr069-pulse",
        target: "ipat-analysis",
        latencyMs: null,
        details: `TR-069 pulse detected: IPAT matches ${K.TARGET_FREQ_1} Hz PRF (${ipat.dominantHz?.toFixed(2)} Hz dominant)`,
      });

      const trEvent = await storage.createSignalEvent({
        domain: "isp",
        source: "network-watchdog-ipat",
        eventType: "tr069-prf-correlation",
        frequency: K.TARGET_FREQ_1,
        confidence: 0.7,
        metadata: {
          dominantHz: ipat.dominantHz,
          prfTarget: K.TARGET_FREQ_1,
          pulsing: ipat.pulsing,
          port: K.TR069_PORT,
          lat: K.OBSERVER_LAT,
          lon: K.OBSERVER_LON,
        },
        raw: null,
      });

      kappaEngine.ingest(trEvent);
      hypervisor.ingestEvent(trEvent);
    }
  }

  if (detectSeismicJitter(state.latencyHistory)) {
    state.seismicJitterCount++;

    addEvent({
      timestamp: now,
      type: "seismic-jitter",
      target: "latency-analysis",
      latencyMs: state.latencyHistory[state.latencyHistory.length - 1] || null,
      details: `Seismic-correlated jitter: latency variance 3x above baseline — possible volcanic/tectonic modulation`,
    });

    const seismicEvent = await storage.createSignalEvent({
      domain: "elf",
      source: "network-watchdog-seismic",
      eventType: "seismic-network-jitter",
      frequency: 2.0,
      confidence: 0.5,
      metadata: {
        latencyHistoryLength: state.latencyHistory.length,
        recentAvgMs: state.latencyHistory.slice(-10).reduce((s, v) => s + v, 0) / 10,
        lat: K.OBSERVER_LAT,
        lon: K.OBSERVER_LON,
        description: "Network latency variance spike correlated with seismic activity (Poás/tectonic)",
      },
      raw: null,
    });

    kappaEngine.ingest(seismicEvent);
    hypervisor.ingestEvent(seismicEvent);
  }

  state.lastHeartbeat = now;
}

export function startNetworkWatchdog(): void {
  if (state.running) return;
  state.running = true;

  setTimeout(() => runHeartbeatCycle().catch(err => {
    console.error("[Watchdog] Initial cycle error:", err instanceof Error ? err.message : String(err));
  }), 20_000);

  state.timer = setInterval(() => {
    runHeartbeatCycle().catch(err => {
      console.error("[Watchdog] Heartbeat error:", err instanceof Error ? err.message : String(err));
    });
  }, HEARTBEAT_INTERVAL_MS);

  console.log(`[KAPPA] Network watchdog started: ${HEARTBEAT_TARGETS.length} targets, ${HEARTBEAT_INTERVAL_MS / 1000}s interval`);
}

export async function runHeartbeatOnce(): Promise<void> {
  await runHeartbeatCycle();
}

export function getWatchdogStatus(): WatchdogStatus {
  const avgLatency = state.latencyHistory.length > 0
    ? Math.round(state.latencyHistory.reduce((s, v) => s + v, 0) / state.latencyHistory.length)
    : null;

  return {
    running: state.running,
    networkActive: state.networkActive,
    lastHeartbeat: state.lastHeartbeat,
    dropCount: state.dropCount,
    reconnectCount: state.reconnectCount,
    tr069PulseCount: state.tr069PulseCount,
    seismicJitterCount: state.seismicJitterCount,
    avgLatencyMs: avgLatency,
    recentEvents: state.events.slice(0, 20),
  };
}
