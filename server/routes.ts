import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertSignalEventSchema,
  insertSdrNodeSchema,
  KAPPA_CONSTANTS,
  TOOL_CATALOG,
  CORRELATION_RULES,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/stats", async (_req, res) => {
    const [domainCounts, correlationCount] = await Promise.all([
      storage.getEventCountsByDomain(),
      storage.getCorrelationCount(),
    ]);
    const totalEvents = Object.values(domainCounts).reduce((a, b) => a + b, 0);
    res.json({ totalEvents, correlationCount, domainCounts });
  });

  app.get("/api/events", async (req, res) => {
    const domain = req.query.domain as string | undefined;
    const events = await storage.getSignalEvents(domain || undefined);
    res.json(events);
  });

  app.get("/api/events/recent", async (_req, res) => {
    const events = await storage.getRecentSignalEvents(20);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    const parsed = insertSignalEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const event = await storage.createSignalEvent(parsed.data);
    res.json(event);
  });

  app.get("/api/correlations", async (_req, res) => {
    const results = await storage.getCorrelations();
    res.json(results);
  });

  app.post("/api/correlations/run", async (_req, res) => {
    const windowEvents = await storage.getSignalEventsByWindow(300);

    if (windowEvents.length < 2) {
      return res.json({ correlationsFound: 0, message: "Not enough events in window for correlation" });
    }

    const domainGroups: Record<string, typeof windowEvents> = {};
    for (const evt of windowEvents) {
      if (!domainGroups[evt.domain]) domainGroups[evt.domain] = [];
      domainGroups[evt.domain].push(evt);
    }

    const newCorrelations = [];

    for (const rule of CORRELATION_RULES) {
      const relevantDomains = rule.domains.filter(d => domainGroups[d]?.length > 0);
      if (relevantDomains.length < 2) continue;

      const eventSets = relevantDomains.map(d => domainGroups[d]);
      const firstSet = eventSets[0];
      const secondSet = eventSets[1];

      for (const evt1 of firstSet) {
        for (const evt2 of secondSet) {
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
              const correlation = await storage.createCorrelation({
                ruleName: rule.name,
                description: `${rule.description} — ${linkedIds.length} events within ${delta.toFixed(1)}s window`,
                severity,
                eventIds: linkedIds,
                metadata: {
                  ruleId: rule.id,
                  windowSeconds: rule.windowSeconds,
                  actualDeltaSeconds: delta,
                  domains: relevantDomains,
                },
              });
              newCorrelations.push(correlation);
            }
            break;
          }
        }
        if (newCorrelations.length > 0) break;
      }
    }

    res.json({ correlationsFound: newCorrelations.length, correlations: newCorrelations });
  });

  app.get("/api/satellites", async (_req, res) => {
    const satellites = await storage.getSatellites();
    res.json(satellites);
  });

  app.post("/api/satellites/refresh", async (_req, res) => {
    try {
      const tleUrl = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle";
      const response = await fetch(tleUrl);
      if (!response.ok) {
        return res.status(502).json({ error: "Failed to fetch TLE data from CelesTrak" });
      }
      const text = await response.text();
      const lines = text.trim().split("\n").map((l) => l.trim());

      const targetSats = [
        "ISS (ZARYA)",
        "STARLINK",
        "NOAA 15",
        "NOAA 18",
        "NOAA 19",
        "BLACKJACK",
      ];

      let count = 0;
      for (let i = 0; i < lines.length - 2 && count < 12; i += 3) {
        const name = lines[i];
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];

        if (!line1?.startsWith("1 ") || !line2?.startsWith("2 ")) continue;

        const matchesTarget = targetSats.some((t) => name.includes(t));
        if (!matchesTarget && count >= 6) continue;

        const noradId = parseInt(line1.substring(2, 7).trim(), 10);

        try {
          const satellite = await import("satellite.js");
          const satrec = satellite.twoline2satrec(line1, line2);
          const now = new Date();
          const positionAndVelocity = satellite.propagate(satrec, now);
          const gmst = satellite.gstime(now);

          let elevation = null;
          let azimuth = null;
          let rangeSat = null;

          if (positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
            const observerGd = {
              longitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LON),
              latitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LAT),
              height: KAPPA_CONSTANTS.OBSERVER_ALT,
            };

            const positionEci = positionAndVelocity.position;
            const lookAngles = satellite.ecfToLookAngles(
              observerGd,
              satellite.eciToEcf(positionEci, gmst)
            );

            elevation = satellite.radiansToDegrees(lookAngles.elevation);
            azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
            rangeSat = lookAngles.rangeSat;
          }

          await storage.upsertSatellite({
            satelliteName: name.trim(),
            noradId,
            tleLine1: line1,
            tleLine2: line2,
            elevation,
            azimuth,
            range: rangeSat,
            passTime: elevation !== null && elevation >= KAPPA_CONSTANTS.MIN_ELEVATION ? new Date() : null,
          });
          count++;
        } catch {
          continue;
        }
      }

      res.json({ refreshed: count });
    } catch (err) {
      console.error("TLE refresh error:", err);
      res.status(500).json({ error: "Failed to refresh satellite data" });
    }
  });

  app.get("/api/nodes", async (_req, res) => {
    const nodes = await storage.getNodes();
    res.json(nodes);
  });

  app.post("/api/nodes", async (req, res) => {
    const parsed = insertSdrNodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const node = await storage.createNode(parsed.data);
    res.json(node);
  });

  app.get("/api/tools", (_req, res) => {
    res.json(TOOL_CATALOG);
  });

  app.get("/api/rules", (_req, res) => {
    res.json(CORRELATION_RULES);
  });

  return httpServer;
}
