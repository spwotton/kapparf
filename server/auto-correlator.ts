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

function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
}

async function runCorrelationCycle(): Promise<void> {
  try {
    const windowEvents = await storage.getSignalEventsByWindow(300);

    if (windowEvents.length < 2) {
      lastRun = Date.now();
      cycleCount++;
      return;
    }

    const domainGroups: Record<string, SignalEvent[]> = {};
    for (const evt of windowEvents) {
      if (!domainGroups[evt.domain]) domainGroups[evt.domain] = [];
      domainGroups[evt.domain].push(evt);
    }

    let cycleCorrelations = 0;
    let cycleRulesChecked = 0;

    for (const rule of CORRELATION_RULES) {
      cycleRulesChecked++;
      const relevantDomains = rule.domains.filter(d => domainGroups[d]?.length > 0);
      if (relevantDomains.length < 2) continue;

      const eventSets = relevantDomains.map(d => domainGroups[d]);
      const firstSet = eventSets[0];
      const secondSet = eventSets[1];

      for (const evt1 of firstSet) {
        for (const evt2 of secondSet) {
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

            if (linkedIds.length >= 2) {
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

              for (let i = 0; i < linkedIds.length; i++) {
                for (let j = i + 1; j < linkedIds.length; j++) {
                  processedPairs.add(pairKey(linkedIds[i], linkedIds[j]));
                }
              }
            }

            break;
          }
        }
        if (cycleCorrelations > 0) break;
      }
    }

    rulesChecked += cycleRulesChecked;
    correlationsFound += cycleCorrelations;
    lastRun = Date.now();
    cycleCount++;

    if (processedPairs.size > MAX_PAIRS) {
      const entries = Array.from(processedPairs);
      for (let i = 0; i < entries.length - MAX_PAIRS / 2; i++) {
        processedPairs.delete(entries[i]);
      }
    }

    if (cycleCorrelations > 0) {
      console.log(`[auto-correlator] Cycle ${cycleCount}: ${cycleCorrelations} new correlations found`);
    }
  } catch (err) {
    console.error("[auto-correlator] Error:", err);
  }
}

export function startAutoCorrelator(): void {
  if (running) return;
  running = true;

  setTimeout(() => runCorrelationCycle(), 15000);

  timer = setInterval(() => runCorrelationCycle(), 30_000);

  console.log("[KAPPA] Auto-correlator started (30s cycle)");
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
