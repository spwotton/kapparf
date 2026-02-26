import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnomalyReportSchema, insertDetectionEventSchema, GOS_CONSTANTS } from "@shared/schema";

let pipelineRunning = false;
let cycleCount = 0;
let lastCycle: Date | null = null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/pipeline/status", (_req, res) => {
    res.json({
      running: pipelineRunning,
      cycleCount,
      lastCycle: lastCycle?.toISOString() || null,
      nextCycle: lastCycle
        ? new Date(lastCycle.getTime() + GOS_CONSTANTS.KAPPA_SECOND * 1000).toISOString()
        : null,
    });
  });

  app.post("/api/pipeline/toggle", (_req, res) => {
    pipelineRunning = !pipelineRunning;
    res.json({ running: pipelineRunning });
  });

  app.get("/api/detections", async (_req, res) => {
    const detections = await storage.getDetections();
    res.json(detections);
  });

  app.get("/api/detections/recent", async (_req, res) => {
    const detections = await storage.getRecentDetections(10);
    res.json(detections);
  });

  app.get("/api/anomalies", async (_req, res) => {
    const anomalies = await storage.getAnomalies();
    res.json(anomalies);
  });

  app.post("/api/anomalies", async (req, res) => {
    const parsed = insertAnomalyReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const anomaly = await storage.createAnomaly(parsed.data);
    res.json(anomaly);
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
      ];

      let count = 0;
      for (let i = 0; i < lines.length - 2 && count < 10; i += 3) {
        const name = lines[i];
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];

        if (!line1?.startsWith("1 ") || !line2?.startsWith("2 ")) continue;

        const matchesTarget = targetSats.some((t) => name.includes(t));
        if (!matchesTarget && count >= 5) continue;

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
              longitude: satellite.degreesToRadians(GOS_CONSTANTS.OBSERVER_LON),
              latitude: satellite.degreesToRadians(GOS_CONSTANTS.OBSERVER_LAT),
              height: GOS_CONSTANTS.OBSERVER_ALT,
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
            passTime: elevation !== null && elevation >= GOS_CONSTANTS.MIN_ELEVATION ? new Date() : null,
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

  app.post("/api/detections", async (req, res) => {
    const parsed = insertDetectionEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const detection = await storage.createDetection(parsed.data);
    cycleCount++;
    lastCycle = new Date();
    res.json(detection);
  });

  app.get("/api/nodes", async (_req, res) => {
    const nodes = await storage.getNodes();
    res.json(nodes);
  });

  return httpServer;
}
