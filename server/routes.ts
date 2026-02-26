import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import {
  insertSignalEventSchema,
  insertSdrNodeSchema,
  KAPPA_CONSTANTS,
  TOOL_CATALOG,
  CORRELATION_RULES,
  TLE_CATALOG_GROUPS,
  TLE_CATEGORIES,
  ANALYSIS_POINTS,
  type ToolGitHubMeta,
  type FlightData,
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
    kappaEngine.ingest(event);
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

  app.get("/api/kappa/status", (_req, res) => {
    res.json(kappaEngine.getStatus());
  });

  app.get("/api/devices", (_req, res) => {
    res.json(kappaEngine.getDevices());
  });

  app.get("/api/satellites", async (_req, res) => {
    const satellites = await storage.getSatellites();
    res.json(satellites);
  });

  app.get("/api/satellites/groups", (_req, res) => {
    res.json({ groups: TLE_CATALOG_GROUPS, categories: TLE_CATEGORIES });
  });

  app.post("/api/satellites/refresh", async (req, res) => {
    try {
      const satellite = await import("satellite.js");
      const requestedGroups: string[] = req.body.groups;

      const groupsToFetch = requestedGroups?.length
        ? TLE_CATALOG_GROUPS.filter(g => requestedGroups.includes(g.id))
        : TLE_CATALOG_GROUPS.filter(g => ["stations", "noaa", "goes", "weather"].includes(g.id));

      if (groupsToFetch.length === 0) {
        return res.status(400).json({ error: "No valid catalog groups specified" });
      }

      let totalCount = 0;
      const results: Record<string, number> = {};

      for (const group of groupsToFetch) {
        try {
          const response = await fetch(group.url);
          if (!response.ok) continue;

          const text = await response.text();
          const lines = text.trim().split("\n").map((l) => l.trim());
          let groupCount = 0;

          for (let i = 0; i < lines.length - 2; i += 3) {
            const name = lines[i];
            const line1 = lines[i + 1];
            const line2 = lines[i + 2];

            if (!line1?.startsWith("1 ") || !line2?.startsWith("2 ")) continue;

            const noradId = parseInt(line1.substring(2, 7).trim(), 10);

            try {
              const satrec = satellite.twoline2satrec(line1, line2);
              const now = new Date();
              const positionAndVelocity = satellite.propagate(satrec, now);
              const gmst = satellite.gstime(now);

              let elevation: number | null = null;
              let azimuth: number | null = null;
              let rangeSat: number | null = null;
              let satLat: number | null = null;
              let satLon: number | null = null;
              let satAlt: number | null = null;

              if (positionAndVelocity.position && typeof positionAndVelocity.position !== "boolean") {
                const observerGd = {
                  longitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LON),
                  latitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LAT),
                  height: KAPPA_CONSTANTS.OBSERVER_ALT,
                };

                const positionEci = positionAndVelocity.position;
                const positionEcf = satellite.eciToEcf(positionEci, gmst);
                const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

                elevation = satellite.radiansToDegrees(lookAngles.elevation);
                azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
                rangeSat = lookAngles.rangeSat;

                const positionGd = satellite.eciToGeodetic(positionEci, gmst);
                satLat = satellite.radiansToDegrees(positionGd.latitude);
                satLon = satellite.radiansToDegrees(positionGd.longitude);
                satAlt = positionGd.height;
              }

              await storage.upsertSatellite({
                satelliteName: name.trim(),
                noradId,
                tleLine1: line1,
                tleLine2: line2,
                elevation,
                azimuth,
                range: rangeSat,
                latitude: satLat,
                longitude: satLon,
                altitude: satAlt,
                category: group.category,
                passTime: elevation !== null && elevation >= KAPPA_CONSTANTS.MIN_ELEVATION ? new Date() : null,
              });
              groupCount++;
            } catch {
              continue;
            }
          }

          results[group.id] = groupCount;
          totalCount += groupCount;
        } catch {
          results[group.id] = 0;
        }
      }

      const allSats = await storage.getSatellites();
      const overheadCount = allSats.filter(s => s.elevation != null && s.elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION).length;
      const kleinCount = allSats.filter(s =>
        s.azimuth != null && Math.abs(s.azimuth - KAPPA_CONSTANTS.KLEIN_TWIST_DEG) <= KAPPA_CONSTANTS.KLEIN_TOLERANCE_DEG
      ).length;
      kappaEngine.updateSatelliteState(overheadCount, kleinCount);

      res.json({ refreshed: totalCount, groups: results });
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

  const toolMetaCache: { data: ToolGitHubMeta[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

  app.get("/api/tools/meta", async (_req, res) => {
    const CACHE_TTL = 30 * 60 * 1000;
    if (toolMetaCache.data && Date.now() - toolMetaCache.fetchedAt < CACHE_TTL) {
      return res.json(toolMetaCache.data);
    }

    const results: ToolGitHubMeta[] = [];

    for (const tool of TOOL_CATALOG) {
      const match = tool.repo.match(/github\.com\/([^/]+\/[^/]+)/);
      if (!match) continue;

      try {
        const apiUrl = `https://api.github.com/repos/${match[1]}`;
        const response = await fetch(apiUrl, {
          headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "KAPPA-SIGINT" },
        });
        if (!response.ok) continue;

        const data = await response.json();
        results.push({
          name: tool.name,
          stars: data.stargazers_count ?? 0,
          language: data.language ?? null,
          license: data.license?.spdx_id ?? null,
          updatedAt: data.updated_at ?? "",
          description: data.description ?? null,
          archived: data.archived ?? false,
          forks: data.forks_count ?? 0,
          openIssues: data.open_issues_count ?? 0,
        });
      } catch {
        continue;
      }
    }

    toolMetaCache.data = results;
    toolMetaCache.fetchedAt = Date.now();
    res.json(results);
  });

  app.get("/api/rules", (_req, res) => {
    res.json(CORRELATION_RULES);
  });

  app.get("/api/analysis-points", (_req, res) => {
    res.json(ANALYSIS_POINTS);
  });

  const flightCache: { data: FlightData[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

  app.get("/api/flights", async (_req, res) => {
    const CACHE_TTL = 15 * 1000;
    if (flightCache.data && Date.now() - flightCache.fetchedAt < CACHE_TTL) {
      return res.json(flightCache.data);
    }

    try {
      const latMin = KAPPA_CONSTANTS.JACO_LAT - 0.5;
      const latMax = KAPPA_CONSTANTS.OBSERVER_LAT + 0.5;
      const lonMin = KAPPA_CONSTANTS.JACO_LON - 0.5;
      const lonMax = KAPPA_CONSTANTS.OBSERVER_LON + 0.5;

      const url = `https://opensky-network.org/api/states/all?lamin=${latMin}&lomin=${lonMin}&lamax=${latMax}&lomax=${lonMax}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "KAPPA-SIGINT" },
      });

      if (!response.ok) {
        return res.status(502).json({ error: "Failed to fetch flight data from OpenSky Network" });
      }

      const data = await response.json();
      const flights: FlightData[] = [];

      if (data.states) {
        for (const s of data.states) {
          flights.push({
            icao24: s[0] ?? "",
            callsign: s[1]?.trim() || null,
            originCountry: s[2] ?? "",
            longitude: s[5] ?? null,
            latitude: s[6] ?? null,
            altitude: s[7] ?? null,
            velocity: s[9] ?? null,
            heading: s[10] ?? null,
            verticalRate: s[11] ?? null,
            onGround: s[8] ?? false,
            squawk: s[14] ?? null,
          });
        }
      }

      flightCache.data = flights;
      flightCache.fetchedAt = Date.now();
      res.json(flights);
    } catch (err) {
      console.error("Flight data error:", err);
      res.status(500).json({ error: "Failed to fetch flight data" });
    }
  });

  app.post("/api/osint/lookup", async (req, res) => {
    const { target } = req.body;
    if (!target || typeof target !== "string") {
      return res.status(400).json({ error: "Target hostname or IP required" });
    }

    try {
      const dns = await import("dns");
      const { promisify } = await import("util");
      const resolve4 = promisify(dns.resolve4);
      const resolve6 = promisify(dns.resolve6);
      const resolveMx = promisify(dns.resolveMx);
      const resolveTxt = promisify(dns.resolveTxt);
      const resolveNs = promisify(dns.resolveNs);
      const reverse = promisify(dns.reverse);

      const results: Record<string, unknown> = { target, timestamp: new Date().toISOString() };

      const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target);

      if (isIp) {
        results.type = "ip";
        results.ip = target;
        try { results.reverse = await reverse(target); } catch { results.reverse = []; }
      } else {
        results.type = "hostname";
        results.hostname = target;
        try { results.ipv4 = await resolve4(target); } catch { results.ipv4 = []; }
        try { results.ipv6 = await resolve6(target); } catch { results.ipv6 = []; }
        try { results.mx = await resolveMx(target); } catch { results.mx = []; }
        try { results.ns = await resolveNs(target); } catch { results.ns = []; }
        try {
          const txt = await resolveTxt(target);
          results.txt = txt.map(r => r.join(""));
        } catch { results.txt = []; }
      }

      res.json(results);
    } catch (err) {
      console.error("OSINT lookup error:", err);
      res.status(500).json({ error: "Lookup failed" });
    }
  });

  const weatherCache: { data: unknown | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

  app.get("/api/weather/radar", async (_req, res) => {
    const CACHE_TTL = 10 * 60 * 1000;
    if (weatherCache.data && Date.now() - weatherCache.fetchedAt < CACHE_TTL) {
      return res.json(weatherCache.data);
    }

    try {
      const pointsUrl = `https://api.weather.gov/points/${KAPPA_CONSTANTS.OBSERVER_LAT},${KAPPA_CONSTANTS.OBSERVER_LON}`;
      const pointsRes = await fetch(pointsUrl, {
        headers: { "User-Agent": "KAPPA-SIGINT", "Accept": "application/geo+json" },
      });

      if (!pointsRes.ok) {
        return res.json({
          location: "Guácima Abajo, Alajuela",
          coordinates: { lat: KAPPA_CONSTANTS.OBSERVER_LAT, lon: KAPPA_CONSTANTS.OBSERVER_LON },
          note: "NWS API unavailable for this location — Costa Rica is outside US NWS coverage",
          radarStations: [
            { id: "MLAT", name: "Costa Rica Met Radar", lat: 10.0, lon: -84.2, type: "weather" },
          ],
        });
      }

      const pointsData = await pointsRes.json();
      const forecastUrl = pointsData.properties?.forecast;

      let forecast = null;
      if (forecastUrl) {
        try {
          const forecastRes = await fetch(forecastUrl, {
            headers: { "User-Agent": "KAPPA-SIGINT", "Accept": "application/geo+json" },
          });
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();
            forecast = forecastData.properties?.periods?.[0] ?? null;
          }
        } catch { /* continue */ }
      }

      const result = {
        location: "Guácima Abajo, Alajuela",
        coordinates: { lat: KAPPA_CONSTANTS.OBSERVER_LAT, lon: KAPPA_CONSTANTS.OBSERVER_LON },
        forecast,
        radarStations: [
          { id: "MLAT", name: "Costa Rica Met Radar", lat: 10.0, lon: -84.2, type: "weather" },
        ],
      };

      weatherCache.data = result;
      weatherCache.fetchedAt = Date.now();
      res.json(result);
    } catch (err) {
      console.error("Weather data error:", err);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  return httpServer;
}
