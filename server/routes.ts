import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import { getCollectorStatus, getTLEConsistencyStatus } from "./collectors";
import { getCorrelatorStatus } from "./auto-correlator";
import { getScannerStatus } from "./kiwisdr-scanner";
import { getWatchdogStatus } from "./network-watchdog";
import { getNetworkThreatStatus, processPacket, processBatch, parsePacketLine, type NetworkPacket } from "./network-threat-scanner";
import { getVisionStatus, getVisionAnalyses, getContextMemory, runVisionOnce } from "./kiwisdr-vision";
import { analyzeCorrelation, generateReport, suggestRuleWeights, generateSocialCaption } from "./llm-analyst";
import { getPipelineStatus, runPipelineOnce, startPipeline, stopPipeline, type PipelineStatus, type PipelineResult } from "./pipeline";
import { getAvailableModels, queryModel, recursiveQuery, getProviderStatus } from "./research-engine";
import { fetchUrl } from "./research-web";
import {
  insertResearchSessionSchema,
  insertResearchQuerySchema,
  insertResearchFindingSchema,
  TRE_LAYERS,
} from "@shared/schema";
import {
  insertSignalEventSchema,
  insertSdrNodeSchema,
  insertCorrelationFeedbackSchema,
  KAPPA_CONSTANTS,
  OMEGA_CHRONOS,
  TOOL_CATALOG,
  CORRELATION_RULES,
  TLE_CATALOG_GROUPS,
  TLE_CATEGORIES,
  ANALYSIS_POINTS,
  KARACHI_MODULES,
  VET_ARCHITECTURE,
  CONGUSTO_MODULES,
  FINSPY_INTEL,
  FINSPY_HARDWARE_MODULES,
  FINSPY_INFRA_MODULES,
  ALEXANDERPLATZ_PROTOCOL,
  AIRBNB_GHOST_VECTOR,
  PARTYTOWN_THREAT,
  KYNDRYL_ZSCALER_PROFILE,
  FINSPY_V2_DELIVERABLES,
  COUNCIL_OF_7,
  type ToolGitHubMeta,
  type FlightData,
  type PhoenixCountdown,
} from "@shared/schema";
import {
  LATTICE_CONSTANTS,
  NIEMEIER_LATTICES,
  CLOCK_DERIVATION,
  CLOCK_ADOPTED,
  DEMODEX_CYCLE,
  SMC_NODES_DATA,
  PASQAL_LAYERS_DATA,
  RIEMANN_PREVIEW,
  ICOSITETRAGON,
  MOONSHINE_TOWER,
  RIEMANN_SONNET,
  type LatticeAllResponse,
} from "@shared/lattice-data";

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
    const n = parseInt(req.query.limit as string);
    const limit = Number.isFinite(n) ? Math.max(1, Math.min(Math.floor(n), 500)) : 200;
    const events = await storage.getSignalEvents(domain || undefined, limit);
    res.json(events);
  });

  app.get("/api/events/recent", async (_req, res) => {
    const events = await storage.getRecentSignalEvents(20);
    res.json(events);
  });

  app.post("/api/events/by-ids", async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }
    const limitedIds = ids.slice(0, 50);
    const events = await storage.getSignalEventsByIds(limitedIds);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    const parsed = insertSignalEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const event = await storage.createSignalEvent(parsed.data);
    kappaEngine.ingest(event);
    hypervisor.ingestEvent(event);
    res.json(event);
  });

  app.get("/api/correlations", async (req, res) => {
    const n = parseInt(req.query.limit as string);
    const limit = Number.isFinite(n) ? Math.max(1, Math.min(Math.floor(n), 500)) : 200;
    const results = await storage.getCorrelations(limit);
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
    const CACHE_TTL = 30 * 1000;
    const STALE_TTL = 300 * 1000;
    if (flightCache.data && Date.now() - flightCache.fetchedAt < CACHE_TTL) {
      return res.json(flightCache.data);
    }

    try {
      const latCenter = (KAPPA_CONSTANTS.OBSERVER_LAT + KAPPA_CONSTANTS.JACO_LAT) / 2;
      const lonCenter = (KAPPA_CONSTANTS.OBSERVER_LON + KAPPA_CONSTANTS.JACO_LON) / 2;
      const latMin = latCenter - 1.5;
      const latMax = latCenter + 1.5;
      const lonMin = lonCenter - 1.5;
      const lonMax = lonCenter + 1.5;

      const url = `https://opensky-network.org/api/states/all?lamin=${latMin}&lomin=${lonMin}&lamax=${latMax}&lomax=${lonMax}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
          signal: controller.signal,
        });

        if (!response.ok) {
          console.log(`[api/flights] OpenSky HTTP ${response.status}`);
          if (flightCache.data && Date.now() - flightCache.fetchedAt < STALE_TTL) {
            return res.json(flightCache.data);
          }
          return res.json([]);
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
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      console.log(`[api/flights] Error: ${err instanceof Error ? err.message : String(err)}`);
      if (flightCache.data && Date.now() - flightCache.fetchedAt < 300_000) {
        return res.json(flightCache.data);
      }
      res.json([]);
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

  app.get("/api/karachi/modules", (_req, res) => {
    res.json(KARACHI_MODULES);
  });

  app.get("/api/congusto/architecture", (_req, res) => {
    res.json(VET_ARCHITECTURE);
  });

  app.get("/api/congusto/modules", (_req, res) => {
    res.json(CONGUSTO_MODULES);
  });

  app.get("/api/phoenix/countdown", (_req, res) => {
    const now = Date.now();
    const start = KAPPA_CONSTANTS.PHOENIX_START_MS;
    const end = KAPPA_CONSTANTS.PHOENIX_END_MS;
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.floor((end - now) / (1000 * 60 * 60 * 24)));
    const percentComplete = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    const countdown: PhoenixCountdown = {
      startDate: new Date(start).toISOString(),
      endDate: new Date(end).toISOString(),
      percentComplete,
      daysRemaining,
      totalDays,
    };
    res.json(countdown);
  });

  app.get("/api/council", (_req, res) => {
    res.json(COUNCIL_OF_7);
  });

  app.get("/api/hypervisor/status", (_req, res) => {
    res.json(hypervisor.getStatus());
  });

  app.post("/api/hypervisor/start", (_req, res) => {
    hypervisor.start();
    res.json({ ok: true, status: hypervisor.getStatus() });
  });

  app.post("/api/hypervisor/stop", (_req, res) => {
    hypervisor.stop();
    res.json({ ok: true, status: hypervisor.getStatus() });
  });

  app.get("/api/hypervisor/constants", (_req, res) => {
    res.json(OMEGA_CHRONOS);
  });

  function isPrivateIp(ip: string): boolean {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    return false;
  }

  app.post("/api/tools/mac-lookup", async (req, res) => {
    const { mac } = req.body;
    if (!mac || typeof mac !== "string") {
      return res.status(400).json({ error: "MAC address required" });
    }

    const cleaned = mac.replace(/[^a-fA-F0-9]/g, "").slice(0, 12);
    if (cleaned.length < 6) {
      return res.status(400).json({ error: "Invalid MAC address — need at least 6 hex characters" });
    }

    try {
      const oui = cleaned.slice(0, 6).toUpperCase();
      const response = await fetch(`https://api.macvendors.com/${oui}`, {
        headers: { "User-Agent": "KAPPA-SIGINT" },
      });

      if (!response.ok) {
        return res.json({
          mac: cleaned.replace(/(.{2})(?=.)/g, "$1:").toUpperCase(),
          oui,
          vendor: null,
          found: false,
        });
      }

      const vendor = await response.text();
      res.json({
        mac: cleaned.replace(/(.{2})(?=.)/g, "$1:").toUpperCase(),
        oui,
        vendor: vendor.trim(),
        found: true,
      });
    } catch (err) {
      console.error("MAC lookup error:", err);
      res.status(500).json({ error: "MAC lookup failed" });
    }
  });

  app.post("/api/tools/whois", async (req, res) => {
    const { domain } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({ error: "Domain required" });
    }

    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];

    try {
      const dns = await import("dns");
      const { promisify } = await import("util");
      const resolve4 = promisify(dns.resolve4);
      const resolveNs = promisify(dns.resolveNs);
      const resolveMx = promisify(dns.resolveMx);
      const resolveTxt = promisify(dns.resolveTxt);
      const resolveSoa = promisify(dns.resolveSoa);
      const resolveCname = promisify(dns.resolveCname);

      const result: Record<string, unknown> = {
        domain: cleaned,
        timestamp: new Date().toISOString(),
      };

      try { result.ipv4 = await resolve4(cleaned); } catch { result.ipv4 = []; }
      try { result.ns = await resolveNs(cleaned); } catch { result.ns = []; }
      try { result.mx = await resolveMx(cleaned); } catch { result.mx = []; }
      try { result.soa = await resolveSoa(cleaned); } catch { result.soa = null; }
      try { result.cname = await resolveCname(cleaned); } catch { result.cname = []; }
      try {
        const txt = await resolveTxt(cleaned);
        result.txt = txt.map(r => r.join(""));
      } catch { result.txt = []; }

      const subdomains = ["www", "mail", "ftp", "api", "dev", "staging", "admin", "vpn", "remote", "mx", "ns1", "ns2", "cdn", "app", "portal"];
      const found: string[] = [];
      await Promise.allSettled(
        subdomains.map(async (sub) => {
          try {
            const ips = await resolve4(`${sub}.${cleaned}`);
            if (ips.length > 0) found.push(`${sub}.${cleaned}`);
          } catch {}
        })
      );
      result.subdomains = found.sort();

      res.json(result);
    } catch (err) {
      console.error("WHOIS lookup error:", err);
      res.status(500).json({ error: "WHOIS lookup failed" });
    }
  });

  app.post("/api/tools/port-scan", async (req, res) => {
    const { target, ports } = req.body;
    if (!target || typeof target !== "string") {
      return res.status(400).json({ error: "Target hostname or IP required" });
    }

    const net = await import("net");
    const dns = await import("dns");
    const { promisify } = await import("util");

    let resolvedIp = target;
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target);
    if (isIp && isPrivateIp(target)) {
      return res.status(400).json({ error: "Private/reserved IP addresses are not allowed" });
    }
    if (!isIp) {
      try {
        const resolve4 = promisify(dns.resolve4);
        const ips = await resolve4(target);
        resolvedIp = ips[0];
        if (isPrivateIp(resolvedIp)) {
          return res.status(400).json({ error: "Target resolves to a private IP address" });
        }
      } catch {
        return res.status(400).json({ error: `Cannot resolve hostname: ${target}` });
      }
    }

    const MAX_PORTS = 30;
    const defaultPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 3306, 3389, 5432, 5900, 8080, 8443, 8888];
    const scanPorts: number[] = (Array.isArray(ports)
      ? ports.filter((p: unknown) => typeof p === "number" && p > 0 && p < 65536)
      : defaultPorts
    ).slice(0, MAX_PORTS);

    const portNames: Record<number, string> = {
      21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
      80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 445: "SMB",
      993: "IMAPS", 995: "POP3S", 1433: "MSSQL", 3306: "MySQL",
      3389: "RDP", 5432: "PostgreSQL", 5900: "VNC", 8080: "HTTP-Alt",
      8443: "HTTPS-Alt", 8888: "HTTP-Alt2", 161: "SNMP", 162: "SNMP-Trap",
      502: "Modbus", 7547: "TR-069",
    };

    const results = await Promise.allSettled(
      scanPorts.map(
        (port) =>
          new Promise<{ port: number; open: boolean; service: string }>((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(2000);
            socket.on("connect", () => {
              socket.destroy();
              resolve({ port, open: true, service: portNames[port] || "unknown" });
            });
            socket.on("timeout", () => {
              socket.destroy();
              resolve({ port, open: false, service: portNames[port] || "unknown" });
            });
            socket.on("error", () => {
              socket.destroy();
              resolve({ port, open: false, service: portNames[port] || "unknown" });
            });
            socket.connect(port, resolvedIp);
          })
      )
    );

    const portResults = results
      .filter((r): r is PromiseFulfilledResult<{ port: number; open: boolean; service: string }> => r.status === "fulfilled")
      .map((r) => r.value)
      .sort((a, b) => a.port - b.port);

    res.json({
      target,
      resolvedIp,
      timestamp: new Date().toISOString(),
      ports: portResults,
      openCount: portResults.filter((p) => p.open).length,
      scannedCount: portResults.length,
    });
  });

  app.post("/api/tools/http-probe", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL required" });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const hostname = parsedUrl.hostname;
      if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|169\.254\.|localhost)/i.test(hostname)) {
        return res.status(400).json({ error: "Private/reserved addresses are not allowed" });
      }

      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(targetUrl, {
        method: "HEAD",
        headers: { "User-Agent": "KAPPA-SIGINT/1.0" },
        signal: controller.signal,
        redirect: "manual",
      });
      clearTimeout(timeout);

      const latency = Date.now() - startTime;
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const securityHeaders = {
        "strict-transport-security": headers["strict-transport-security"] || null,
        "content-security-policy": headers["content-security-policy"] || null,
        "x-frame-options": headers["x-frame-options"] || null,
        "x-content-type-options": headers["x-content-type-options"] || null,
        "x-xss-protection": headers["x-xss-protection"] || null,
        "referrer-policy": headers["referrer-policy"] || null,
        "permissions-policy": headers["permissions-policy"] || null,
      };

      const presentCount = Object.values(securityHeaders).filter(Boolean).length;

      res.json({
        url: targetUrl,
        status: response.status,
        statusText: response.statusText,
        latency,
        headers,
        securityHeaders,
        securityScore: Math.round((presentCount / 7) * 100),
        server: headers["server"] || null,
        poweredBy: headers["x-powered-by"] || null,
        contentType: headers["content-type"] || null,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "HTTP probe failed";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/finspy/intel", (_req, res) => {
    res.json({
      intel: FINSPY_INTEL,
      hardwareModules: FINSPY_HARDWARE_MODULES,
      infraModules: FINSPY_INFRA_MODULES,
      alexanderplatz: ALEXANDERPLATZ_PROTOCOL,
      airbnbGhost: AIRBNB_GHOST_VECTOR,
      partytown: PARTYTOWN_THREAT,
      kyndrylProfile: KYNDRYL_ZSCALER_PROFILE,
      v2Deliverables: FINSPY_V2_DELIVERABLES,
    });
  });

  app.get("/api/collectors/status", (_req, res) => {
    res.json(getCollectorStatus());
  });

  app.get("/api/tle/consistency", (_req, res) => {
    res.json(getTLEConsistencyStatus());
  });

  app.get("/api/correlations/stats", (_req, res) => {
    res.json(getCorrelatorStatus());
  });

  app.get("/api/scanner/status", (_req, res) => {
    res.json(getScannerStatus());
  });

  app.get("/api/watchdog/status", (_req, res) => {
    res.json(getWatchdogStatus());
  });

  app.get("/api/threat-scanner/status", (_req, res) => {
    res.json(getNetworkThreatStatus());
  });

  app.post("/api/threat-scanner/packet", async (req, res) => {
    const pkt = req.body as NetworkPacket;
    if (!pkt.srcIp || !pkt.dstIp) {
      return res.status(400).json({ error: "srcIp and dstIp required" });
    }
    pkt.timestamp = pkt.timestamp || Date.now();
    const threats = await processPacket(pkt);
    res.json({ threats: threats.length, matches: threats });
  });

  app.post("/api/threat-scanner/batch", async (req, res) => {
    const { packets } = req.body;
    if (!Array.isArray(packets)) {
      return res.status(400).json({ error: "packets must be an array" });
    }
    const result = await processBatch(packets);
    res.json(result);
  });

  app.post("/api/threat-scanner/pcap-text", async (req, res) => {
    const { lines } = req.body;
    if (!Array.isArray(lines)) {
      return res.status(400).json({ error: "lines must be an array of strings" });
    }
    const packets: NetworkPacket[] = [];
    for (const line of lines) {
      const pkt = parsePacketLine(line);
      if (pkt) packets.push(pkt);
    }
    if (packets.length === 0) {
      return res.json({ processed: 0, threats: 0, matches: [], parsed: 0 });
    }
    const result = await processBatch(packets);
    res.json({ ...result, parsed: packets.length });
  });

  app.get("/api/vision/status", (_req, res) => {
    res.json(getVisionStatus());
  });

  app.get("/api/vision/analyses", (_req, res) => {
    res.json(getVisionAnalyses());
  });

  app.get("/api/vision/context", (_req, res) => {
    res.json(getContextMemory());
  });

  app.post("/api/vision/capture", async (req, res) => {
    try {
      const { profileId } = req.body || {};
      const analysis = await runVisionOnce(profileId);
      if (analysis) {
        res.json({ success: true, analysis });
      } else {
        res.json({ success: false, error: "Capture or analysis failed" });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get("/api/riemann-zeros", (_req, res) => {
    res.json({
      zeros: KAPPA_CONSTANTS.RIEMANN_ZEROS,
      metaPlatforms: KAPPA_CONSTANTS.META_PLATFORM_FREQS,
      triadicHypervisor: KAPPA_CONSTANTS.TRIADIC_HYPERVISOR_MAP,
      threatIndicators: {
        suspiciousIps: KAPPA_CONSTANTS.THREAT_INDICATORS.SUSPICIOUS_IPS.length,
        suspiciousPorts: KAPPA_CONSTANTS.THREAT_INDICATORS.SUSPICIOUS_PORTS.length,
        protocolAnomalies: KAPPA_CONSTANTS.THREAT_INDICATORS.PROTOCOL_ANOMALIES.length,
        voiceSignatures: KAPPA_CONSTANTS.THREAT_INDICATORS.VOICE_CORRELATION.hexPayloads.length,
      },
    });
  });

  app.get("/api/threat-indicators", (_req, res) => {
    res.json(KAPPA_CONSTANTS.THREAT_INDICATORS);
  });

  app.get("/api/blackjack-mandrake", (_req, res) => {
    const bj = KAPPA_CONSTANTS.BLACKJACK_MANDRAKE;
    res.json({
      satellite: bj.satellite,
      rfLink: {
        frequencyMhz: bj.rfFreqMhz,
        band: bj.rfBand,
        mode: bj.rfMode,
      },
      downconversion: bj.downconversion,
      dsp: bj.dsp,
      hfMirror: bj.hfMirror,
      harmonics: bj.harmonics,
      carriers: bj.carriers,
      dopplerLeo: bj.dopplerLeo,
      context: bj.context,
      scanTargets: [
        { name: "blackjack_mandrake_if24mhz", freqKhz: bj.downconversion.ifFreqKhz, type: "IF downconvert", band: "12m" },
        { name: "blackjack_mandrake_hf_mirror", freqKhz: bj.hfMirror.freqKhz, type: "HF mirror", band: bj.hfMirror.band },
        ...bj.harmonics.map(h => ({
          name: `blackjack_mandrake_h${h.order}`, freqKhz: h.freqKhz, type: `H${h.order}`, band: `harmonic`
        })),
      ],
      tacacoriArray: KAPPA_CONSTANTS.TACACORI_ARRAY,
      infrastructure: {
        cudyRouter: KAPPA_CONSTANTS.THREAT_INDICATORS.CUDY_ROUTER,
        arrisGateway: KAPPA_CONSTANTS.THREAT_INDICATORS.ARRIS_GATEWAY,
        mikrotikGateway: KAPPA_CONSTANTS.THREAT_INDICATORS.MIKROTIK_GATEWAY,
      },
      sdrNodes: {
        primary: "TI0RC Zapote (San Jose metro)",
        wsUrl: KAPPA_CONSTANTS.TDOA_SDR_PRIMARY,
      },
    });
  });

  app.get("/api/eitel-marconi", (_req, res) => {
    res.json({
      eitelMcCullough: KAPPA_CONSTANTS.EITEL_MCCULLOUGH,
      marconi: KAPPA_CONSTANTS.MARCONI,
    });
  });

  app.get("/api/morse-cw", (_req, res) => {
    const scanner = getScannerStatus();
    res.json({
      detection: KAPPA_CONSTANTS.MORSE_CW_DETECTION,
      detections: scanner.morseCwDetections,
      marconiContext: KAPPA_CONSTANTS.MARCONI.cwLegacy,
      eitelContext: KAPPA_CONSTANTS.EITEL_MCCULLOUGH.vetArchetype,
    });
  });

  app.get("/api/bart-signatures", (_req, res) => {
    const scanner = getScannerStatus();
    res.json({
      signatures: KAPPA_CONSTANTS.BART_SIGNATURES,
      detections: scanner.bartDetections,
    });
  });

  app.get("/api/events/search", async (req, res) => {
    const q = (req.query.q as string) || "";
    const domainsParam = req.query.domains as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const domains = domainsParam ? domainsParam.split(",") : undefined;
    const events = await storage.searchEvents(q, domains, limit);
    res.json(events);
  });

  app.post("/api/correlations/:id/feedback", async (req, res) => {
    const parsed = insertCorrelationFeedbackSchema.safeParse({
      correlationId: req.params.id,
      ...req.body,
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    if (parsed.data.rating < 1 || parsed.data.rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    const feedback = await storage.createFeedback(parsed.data);
    res.json(feedback);
  });

  app.get("/api/correlations/:id/feedback", async (req, res) => {
    const feedback = await storage.getFeedbackForCorrelation(req.params.id);
    res.json(feedback);
  });

  app.get("/api/collection-logs", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await storage.getRecentCollectionLogs(limit);
    res.json(logs);
  });

  app.get("/api/analysis/correlation/:id", async (req, res) => {
    try {
      const allCorrelations = await storage.getCorrelations();
      const correlation = allCorrelations.find(c => c.id === req.params.id);
      if (!correlation) {
        return res.status(404).json({ error: "Correlation not found" });
      }
      const events = await storage.getRecentSignalEvents(100);
      const linkedEvents = events.filter(e => correlation.eventIds.includes(e.id));
      const analysis = await analyzeCorrelation(correlation, linkedEvents);
      res.json(analysis);
    } catch (err) {
      console.error("Analysis error:", err);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.get("/api/analysis/report", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const from = new Date(Date.now() - hours * 3600 * 1000);
      const allCorrelations = await storage.getCorrelations();
      const recentCorrelations = allCorrelations.filter(
        c => new Date(c.timestamp) >= from
      );
      const report = await generateReport(recentCorrelations, hours);
      res.json(report);
    } catch (err) {
      console.error("Report error:", err);
      res.status(500).json({ error: "Report generation failed" });
    }
  });

  app.post("/api/analysis/learn", async (_req, res) => {
    try {
      const allCorrelations = await storage.getCorrelations();
      const allFeedback = [];
      for (const c of allCorrelations.slice(0, 50)) {
        const fb = await storage.getFeedbackForCorrelation(c.id);
        allFeedback.push(...fb);
      }
      const result = await suggestRuleWeights(allFeedback);
      res.json(result);
    } catch (err) {
      console.error("Learn error:", err);
      res.status(500).json({ error: "Learning failed" });
    }
  });

  app.get("/api/pipeline/status", (_req, res) => {
    res.json(getPipelineStatus());
  });

  app.post("/api/pipeline/run", async (_req, res) => {
    try {
      console.log("[pipeline] Manual full sweep triggered");
      const result = await runPipelineOnce();
      res.json(result);
    } catch (err) {
      console.error("[pipeline] Manual run error:", err);
      res.status(500).json({ error: "Pipeline sweep failed" });
    }
  });

  app.post("/api/pipeline/start", (_req, res) => {
    startPipeline();
    res.json(getPipelineStatus());
  });

  app.post("/api/pipeline/stop", (_req, res) => {
    stopPipeline();
    res.json(getPipelineStatus());
  });

  app.get("/api/lattice/all", (_req, res) => {
    const response: LatticeAllResponse = {
      constants: LATTICE_CONSTANTS,
      niemeier: NIEMEIER_LATTICES,
      clock: { derivations: CLOCK_DERIVATION, adopted: CLOCK_ADOPTED },
      demodex: DEMODEX_CYCLE,
      smc: SMC_NODES_DATA,
      pasqal: PASQAL_LAYERS_DATA,
      riemann: RIEMANN_PREVIEW,
      icositetragon: ICOSITETRAGON,
      moonshine: MOONSHINE_TOWER,
      sonnet: RIEMANN_SONNET,
    };
    res.json(response);
  });

  app.get("/api/social/data", async (_req, res) => {
    const [domainCounts, correlationCount, events, correlations, satellites] = await Promise.all([
      storage.getEventCountsByDomain(),
      storage.getCorrelationCount(),
      storage.getRecentSignalEvents(10),
      storage.getCorrelations(),
      storage.getSatellites(),
    ]);

    const totalEvents = Object.values(domainCounts).reduce((a, b) => a + b, 0);
    const kappaStatus = kappaEngine.getStatus();
    const visibleSats = satellites.filter((s: any) => (s.elevation ?? 0) > 30);
    const overheadSats = satellites.filter((s: any) => (s.elevation ?? 0) > 75);

    res.json({
      kappa: kappaStatus,
      totalEvents,
      totalCorrelations: correlationCount,
      domainCounts,
      recentCorrelations: correlations.slice(0, 5),
      recentEvents: events,
      satelliteCount: satellites.length,
      visibleSatellites: visibleSats.length,
      overheadSatellites: overheadSats.length,
      generatedAt: new Date().toISOString(),
    });
  });

  app.post("/api/social/caption", async (req, res) => {
    try {
    const { template } = req.body;
    if (!template || !["kappa", "satellite", "correlation", "domains", "evening"].includes(template)) {
      return res.status(400).json({ error: "Invalid template" });
    }

    const [domainCounts, correlationCount, correlations, satellites] = await Promise.all([
      storage.getEventCountsByDomain(),
      storage.getCorrelationCount(),
      storage.getCorrelations(),
      storage.getSatellites(),
    ]);

    const totalEvents = Object.values(domainCounts).reduce((a, b) => a + b, 0);
    const kappaStatus = kappaEngine.getStatus();
    const activeDomains = Object.entries(domainCounts).filter(([, v]) => v > 0).map(([k]) => k);
    const topRules = correlations.slice(0, 5).map((c: any) => c.ruleName);

    let threatLevel = "NOMINAL";
    const score = kappaStatus.score ?? 0;
    if (score >= 95) threatLevel = "EMERGENCY";
    else if (score >= 80) threatLevel = "CRITICAL";
    else if (score >= 60) threatLevel = "HIGH";
    else if (score >= 30) threatLevel = "ELEVATED";

    const caption = await generateSocialCaption(template, {
      kappaScore: score,
      threatLevel,
      totalEvents,
      totalCorrelations: correlationCount,
      satelliteCount: satellites.length,
      visibleSatellites: satellites.filter((s: any) => (s.elevation ?? 0) > 30).length,
      overheadSatellites: satellites.filter((s: any) => (s.elevation ?? 0) > 75).length,
      activeDomains,
      eveningWindowActive: kappaStatus.eveningWindow?.active ?? false,
      topCorrelationRules: topRules,
    });

    res.json(caption);
    } catch (err) {
      console.error("[routes] /api/social/caption error:", err);
      res.status(500).json({ error: "Caption generation failed" });
    }
  });

  app.get("/api/research/models", (_req, res) => {
    res.json({
      models: getAvailableModels(),
      providers: getProviderStatus(),
      layers: TRE_LAYERS,
    });
  });

  app.post("/api/research/sessions", async (req, res) => {
    try {
      const parsed = insertResearchSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const session = await storage.createResearchSession(parsed.data);
      res.json(session);
    } catch (err) {
      console.error("[routes] create research session error:", err);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/research/sessions", async (_req, res) => {
    try {
      const sessions = await storage.getResearchSessions();
      res.json(sessions);
    } catch (err) {
      console.error("[routes] get research sessions error:", err);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.get("/api/research/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getResearchSession(req.params.id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      const [queries, findings] = await Promise.all([
        storage.getResearchQueries(session.id),
        storage.getResearchFindings(session.id),
      ]);
      res.json({ session, queries, findings });
    } catch (err) {
      console.error("[routes] get research session error:", err);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  app.post("/api/research/query", async (req, res) => {
    try {
      const { sessionId, prompt, provider, model, layer } = req.body;
      if (!sessionId || !prompt || !provider || !model) {
        return res.status(400).json({ error: "sessionId, prompt, provider, and model are required" });
      }
      if (typeof prompt !== "string" || prompt.length > 50000) {
        return res.status(400).json({ error: "Prompt must be a string under 50,000 characters" });
      }
      if (!["openai", "openrouter", "huggingface"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }
      const queryLayer = typeof layer === "number" && layer >= 1 && layer <= 5 ? layer : 1;

      const session = await storage.getResearchSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });

      const result = await queryModel(provider, model, [{ role: "user", content: prompt }], queryLayer);

      const saved = await storage.createResearchQuery({
        sessionId,
        layer: queryLayer,
        prompt,
        modelProvider: provider,
        modelName: model,
        response: result.response || null,
        metadata: { durationMs: result.durationMs, error: result.error || null },
      });

      res.json({ query: saved, result });
    } catch (err) {
      console.error("[routes] research query error:", err);
      res.status(500).json({ error: "Query failed" });
    }
  });

  app.post("/api/research/query/recursive", async (req, res) => {
    try {
      const { sessionId, prompt, layers, preferredModels } = req.body;
      if (!sessionId || !prompt) {
        return res.status(400).json({ error: "sessionId and prompt are required" });
      }
      if (typeof prompt !== "string" || prompt.length > 50000) {
        return res.status(400).json({ error: "Prompt must be a string under 50,000 characters" });
      }

      const session = await storage.getResearchSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });

      const validLayers = [1, 2, 3, 4, 5];
      const layerIds = Array.isArray(layers) ? layers.filter((l: number) => validLayers.includes(l)) : validLayers;
      const results = await recursiveQuery(prompt, layerIds.length > 0 ? layerIds : validLayers, preferredModels);

      const savedQueries = [];
      for (const result of results) {
        const saved = await storage.createResearchQuery({
          sessionId,
          layer: result.layer,
          prompt,
          modelProvider: result.provider,
          modelName: result.model,
          response: result.response || null,
          metadata: { durationMs: result.durationMs, error: result.error || null, layerName: result.layerName },
          parentQueryId: savedQueries.length > 0 ? savedQueries[0].id : undefined,
        });
        savedQueries.push(saved);
      }

      res.json({ queries: savedQueries, results });
    } catch (err) {
      console.error("[routes] recursive query error:", err);
      res.status(500).json({ error: "Recursive query failed" });
    }
  });

  app.post("/api/research/findings", async (req, res) => {
    try {
      const parsed = insertResearchFindingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const session = await storage.getResearchSession(parsed.data.sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });
      const finding = await storage.createResearchFinding(parsed.data);
      res.json(finding);
    } catch (err) {
      console.error("[routes] create finding error:", err);
      res.status(500).json({ error: "Failed to create finding" });
    }
  });

  app.get("/api/research/findings/:sessionId", async (req, res) => {
    try {
      const findings = await storage.getResearchFindings(req.params.sessionId);
      res.json(findings);
    } catch (err) {
      console.error("[routes] get findings error:", err);
      res.status(500).json({ error: "Failed to get findings" });
    }
  });

  app.post("/api/research/web/fetch", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }
      const result = await fetchUrl(url);
      res.json(result);
    } catch (err) {
      console.error("[routes] web fetch error:", err);
      res.status(500).json({ error: "Fetch failed" });
    }
  });

  app.get("/api/intel/ssc-casino", (_req, res) => {
    const K = KAPPA_CONSTANTS as any;
    res.json({
      program: K.SSC_CASINO_INTEL,
      leolabs: K.LEOLABS_COSTA_RICA,
      telespazio: K.TELESPAZIO_CR,
      groundSegment: K.LATAM_GROUND_SEGMENT,
      govAgreements: K.GOV_AGREEMENTS_LATAM,
      blackjackMandrake: {
        satellite: K.BLACKJACK_MANDRAKE.satellite,
        rfBand: K.BLACKJACK_MANDRAKE.rfBand,
        rfFreqMhz: K.BLACKJACK_MANDRAKE.rfFreqMhz,
        context: K.BLACKJACK_MANDRAKE.context,
      },
      scanTargets: {
        leolabsSband: ["2940 MHz TX/RX", "2960 MHz TX/RX"],
        yam5ExperimentalSband: ["2240-2290 MHz"],
        priorityNoradIds: [
          { noradId: 48915, name: "YAM-3", program: "DARPA Blackjack/SDA POET" },
          { noradId: 55076, name: "YAM-5", program: "NASA MURI/Kinéis" },
        ],
      },
      confidenceRatings: {
        leolabsFrequencies: "GREEN — SUTEL Expediente DNPT-074-2019-2",
        yamOrbitalParams: "GREEN — CelesTrak/N2YO verified",
        temporalCorrelation: "AMBER — LeoLabs operational 2021-04-22 → Blackjack launch 2021-06-30 (68 days)",
        telespazioCostaRica: "AMBER — entity confirmed, no LeoLabs sub-licensing evidence",
        groundSegmentUsage: "AMBER — infrastructure documented, specific program attribution unverified",
        jwLdsProxy: "RED (NEGATIVE) — exhaustive search finds zero evidence",
      },
      sources: [
        "SUTEL Oficio N° 07262-SUTEL-DGC-2024",
        "SUTEL Expediente Administrativo N° DNPT-074-2019-2",
        "Registro Nacional — cédula 3-102-784732 (LeoLabs Space Limitada)",
        "Registro Nacional — cédula 3-012-490070 (Telespazio Argentina S.A.)",
        "CelesTrak NORAD 48915 (YAM-3), 55076 (YAM-5)",
        "DARPA Blackjack risk-reduction release (2020)",
        "SSC CASINO/PredaSAR on-orbit cooperative demo",
        "CPJ-002-2026 (Poder Generalísimo RTBF circular)",
      ],
    });
  });

  return httpServer;
}
