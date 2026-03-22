import { storage } from "./storage";
import {
  CORRELATION_RULES,
  type CorrelatorStats,
  type SignalEvent,
} from "@shared/schema";

let running = false;
let lastRun: number | null = null;
let rulesChecked = 0;
let correlationsFound = 0;
let totalCorrelations = 0;
let cycleCount = 0;
let timer: ReturnType<typeof setInterval> | null = null;

const processedPairs = new Set<string>();
const MAX_PAIRS = 10000;

const RULES_REQUIRING_SPECIALIZED_LOGIC = new Set([
  "satintel-tle-drift",
]);

function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
}

const NON_DETECTION_EVENT_TYPES = new Set([
  "sdr-node-health",
  "sdr-node-offline",
  "atmospheric-conditions",
  "adsb-track",
  "satellite-pass",
  "weather-update",
]);

function isRealDetection(evt: SignalEvent): boolean {
  if (NON_DETECTION_EVENT_TYPES.has(evt.eventType)) return false;
  if (evt.confidence !== null && evt.confidence < 0.4) return false;
  return true;
}

async function runCorrelationCycle(): Promise<void> {
  try {
    const windowEvents = await storage.getSignalEventsByWindow(600);

    lastRun = Date.now();
    cycleCount++;

    const detectionEvents = windowEvents.filter(isRealDetection);

    if (detectionEvents.length < 2) {
      return;
    }

    const sortedEvents = [...detectionEvents].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const domainGroups: Record<string, SignalEvent[]> = {};
    for (const evt of sortedEvents) {
      if (!domainGroups[evt.domain]) domainGroups[evt.domain] = [];
      domainGroups[evt.domain].push(evt);
    }

    let cycleCorrelations = 0;
    let cycleRulesChecked = 0;
    const MAX_CORRELATIONS_PER_CYCLE = 20;

    for (const rule of CORRELATION_RULES) {
      if (cycleCorrelations >= MAX_CORRELATIONS_PER_CYCLE) break;
      cycleRulesChecked++;

      if (RULES_REQUIRING_SPECIALIZED_LOGIC.has(rule.id)) continue;

      const allDomainsPresent = rule.domains.every(d => domainGroups[d]?.length > 0);
      if (!allDomainsPresent) continue;

      const relevantDomains = rule.domains;
      const eventSets = relevantDomains.map(d => domainGroups[d]);

      if (relevantDomains.length === 1) {
        const events = eventSets[0];
        if (events.length < 2) continue;

        for (let i = 0; i < Math.min(events.length - 1, 10); i++) {
          const evt1 = events[i];
          const evt2 = events[i + 1];
          const pk = pairKey(evt1.id, evt2.id);
          if (processedPairs.has(pk)) continue;

          const t1 = new Date(evt1.timestamp).getTime();
          const t2 = new Date(evt2.timestamp).getTime();
          const delta = Math.abs(t2 - t1) / 1000;

          if (delta <= rule.windowSeconds) {
            await storage.createCorrelation({
              ruleName: rule.name,
              description: `[AUTO] ${rule.description} — 2 events within ${delta.toFixed(1)}s`,
              severity: 2,
              eventIds: [evt1.id, evt2.id],
              metadata: {
                ruleId: rule.id,
                windowSeconds: rule.windowSeconds,
                actualDeltaSeconds: delta,
                domains: relevantDomains,
                auto: true,
              },
            });

            cycleCorrelations++;
            totalCorrelations++;
            processedPairs.add(pk);

            if (cycleCorrelations >= MAX_CORRELATIONS_PER_CYCLE) break;
          }
        }
        continue;
      }

      const firstSet = eventSets[0];
      const secondSet = eventSets[1];

      let ruleCorrelations = 0;
      for (const evt1 of firstSet) {
        if (ruleCorrelations >= 5) break;
        for (const evt2 of secondSet) {
          if (ruleCorrelations >= 5) break;
          const pk = pairKey(evt1.id, evt2.id);
          if (processedPairs.has(pk)) continue;

          const t1 = new Date(evt1.timestamp).getTime();
          const t2 = new Date(evt2.timestamp).getTime();
          const delta = Math.abs(t2 - t1) / 1000;

          if (delta <= rule.windowSeconds) {
            const linkedIds = [evt1.id, evt2.id];

            if (eventSets.length > 2) {
              for (let i = 2; i < eventSets.length; i++) {
                const closest = eventSets[i].find(e => {
                  const t = new Date(e.timestamp).getTime();
                  return Math.abs(t - t1) / 1000 <= rule.windowSeconds;
                });
                if (closest) linkedIds.push(closest.id);
              }
            }

            const severity = Math.min(5, Math.max(1, linkedIds.length));
            await storage.createCorrelation({
              ruleName: rule.name,
              description: `[AUTO] ${rule.description} — ${linkedIds.length} events within ${delta.toFixed(1)}s`,
              severity,
              eventIds: linkedIds,
              metadata: {
                ruleId: rule.id,
                windowSeconds: rule.windowSeconds,
                actualDeltaSeconds: delta,
                domains: relevantDomains,
                auto: true,
              },
            });

            cycleCorrelations++;
            totalCorrelations++;
            ruleCorrelations++;

            for (let i = 0; i < linkedIds.length; i++) {
              for (let j = i + 1; j < linkedIds.length; j++) {
                processedPairs.add(pairKey(linkedIds[i], linkedIds[j]));
              }
            }
          }
        }
      }
    }

    rulesChecked += cycleRulesChecked;
    correlationsFound += cycleCorrelations;

    if (processedPairs.size > MAX_PAIRS) {
      const entries = Array.from(processedPairs);
      for (let i = 0; i < entries.length - MAX_PAIRS / 2; i++) {
        processedPairs.delete(entries[i]);
      }
    }

    const filtered = windowEvents.length - detectionEvents.length;
    if (cycleCorrelations > 0) {
      console.log(`[auto-correlator] Cycle ${cycleCount}: ${cycleCorrelations} correlations from ${detectionEvents.length} real detections (${filtered} routine events filtered) — ${Object.keys(domainGroups).join(", ")} domains`);
    } else if (cycleCount % 10 === 0) {
      console.log(`[auto-correlator] Cycle ${cycleCount}: 0 correlations — ${detectionEvents.length} detections, ${filtered} filtered`);
    }
  } catch (err) {
    console.error("[auto-correlator] Cycle error:", err instanceof Error ? err.message : String(err));
  }
}

export function startAutoCorrelator(): void {
  if (running) return;
  running = true;

  setTimeout(() => runCorrelationCycle(), 15000);

  timer = setInterval(() => runCorrelationCycle(), 30_000);

  console.log("[KAPPA] Auto-correlator started (30s cycle)");
}

export async function runCorrelationCycleOnce(): Promise<number> {
  await runCorrelationCycle();
  return totalCorrelations;
}

export function getCorrelatorStatus(): CorrelatorStats {
  return {
    running,
    lastRun,
    rulesChecked,
    correlationsFound,
    totalCorrelations,
    cycleCount,
  };
}
