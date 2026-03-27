import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from "fs";
import * as nodePath from "path";
import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import { getCollectorStatus, getTLEConsistencyStatus } from "./collectors";
import { getCorrelatorStatus } from "./auto-correlator";
import { getScannerStatus } from "./kiwisdr-scanner";
import { getWatchdogStatus } from "./network-watchdog";
import { getNetworkThreatStatus, processPacket, processBatch, parsePacketLine, type NetworkPacket } from "./network-threat-scanner";
import { biometricCorrelator, type PhoneSensorReading, type KymaReading } from "./biometric-correlator";
import { getVisionStatus, getVisionAnalyses, getContextMemory, runVisionOnce } from "./kiwisdr-vision";
import { analyzeCorrelation, generateReport, suggestRuleWeights, generateSocialCaption } from "./llm-analyst";
import { getPipelineStatus, runPipelineOnce, startPipeline, stopPipeline, type PipelineStatus, type PipelineResult } from "./pipeline";
import { getAvailableModels, queryModel, recursiveQuery, getProviderStatus } from "./research-engine";
import { executeDeepResearchRun } from "./deep-research";
import { fetchUrl } from "./research-web";
import { analyzeImage, INVESTIGATION_PRESETS, getNasaGibsUrl } from "./icositetragon-engine";
import { RESEARCH_CONSTANTS } from "./research-constants";
import { processCSIFrame, recordMetrics, getMetricsHistory, ENGINE_CONSTANTS, getDemodexSimState, getTychoAntipodeData, getBellCHSHData } from "./wifi-csi-engine";
import { computeChitinTransduction, getLifecycleMap, getChitinConstants } from "./signal/chitin-transducer";
import { addInstance, removeInstance, getInstances, getInstance, fetchSession, fetchEvents, sendCommand, getCommandHistory, getSessionSummary } from "./bettercap/bridge";
import {
  indexAllDocuments, getCortexStatus, getClaims, getDocumentContent, writeDocumentContent,
  createDocument, executeSynthesisRun, getSynthesisRun, exportCorpus, getExportFormats,
} from "./research-cortex";
import * as jpeg from "jpeg-js";
import { PNG } from "pngjs";
import multer from "multer";
import {
  runForensicAnalysis, analyzePcap, scanGitHubRepos, getForensicReports,
  getPcapUploads, startHypervisor, stopHypervisor, getHypervisorStatus,
} from "./forensic-hypervisor";
import {
  startQuantumCortex,
  stopQuantumCortex,
  getQuantumCortexStatus,
  runCorticalCycle,
  processThroughCortex,
  feedBrainstemData,
  createAndPersistSnapshot,
  rollbackToSnapshot,
  getPersistedSnapshots,
  latentSpace,
  setLLMProcessor,
  OMEGA_GOS,
} from "./quantum-cortex";
import {
  insertResearchSessionSchema,
  insertResearchQuerySchema,
  insertResearchFindingSchema,
  insertAudioFlagSchema,
  TRE_LAYERS,
  DEEP_RESEARCH_AGENTS,
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

  setLLMProcessor(async (systemPrompt: string, userPrompt: string, modelPreference?: string) => {
    const { queryModel: qm } = await import("./research-engine");
    const modelMap: Record<string, { provider: string; model: string }> = {
      reasoning: { provider: "openai", model: "gpt-4o-mini" },
      generation: { provider: "openai", model: "gpt-4o-mini" },
    };
    const selected = modelMap[modelPreference || "generation"] || modelMap.generation;
    const result = await qm(selected.provider, selected.model, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], 1);
    return result.response;
  });

  hypervisor.setBrainstemCallback((data) => {
    feedBrainstemData(data);
  });

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
          location: "Calle Los Cedros, Tacacorí, Alajuela 20106",
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
        location: "Calle Los Cedros, Tacacorí, Alajuela 20106",
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
    const status = hypervisor.getStatus();
    res.json(status);
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

  app.post("/api/phone/register", (req, res) => {
    const { phoneId, os, capabilities } = req.body;
    if (!phoneId || !os) {
      return res.status(400).json({ error: "phoneId and os required" });
    }
    biometricCorrelator.registerPhone(phoneId, os, capabilities || []);
    res.json({ registered: true, phoneId });
  });

  app.post("/api/phone/sensors", (req, res) => {
    const { readings } = req.body;
    if (!Array.isArray(readings)) {
      return res.status(400).json({ error: "readings must be an array" });
    }
    let ingested = 0;
    for (const r of readings) {
      if (r.sensorType && r.timestamp) {
        biometricCorrelator.ingestSensor(r as PhoneSensorReading);
        ingested++;
      }
    }
    res.json({ ingested, total: readings.length });
  });

  app.post("/api/phone/sensors/single", (req, res) => {
    const reading = req.body as PhoneSensorReading;
    if (!reading.sensorType || !reading.timestamp) {
      return res.status(400).json({ error: "sensorType and timestamp required" });
    }
    biometricCorrelator.ingestSensor(reading);
    res.json({ ingested: true });
  });

  app.post("/api/phone/pcapdroid", async (req, res) => {
    const { connections } = req.body;
    if (!Array.isArray(connections)) {
      return res.status(400).json({ error: "connections must be an array" });
    }
    const packets: NetworkPacket[] = connections.map((c: any) => ({
      timestamp: c.timestamp || Date.now(),
      srcIp: c.srcIp || c.src_ip || "",
      dstIp: c.dstIp || c.dst_ip || "",
      srcPort: c.srcPort || c.src_port || null,
      dstPort: c.dstPort || c.dst_port || null,
      protocol: c.protocol || c.proto || "TCP",
      length: c.length || c.bytes || 0,
      info: c.info || c.app || "",
      hexPayload: c.payload || null,
    }));
    const validPackets = packets.filter(p => p.srcIp && p.dstIp);
    if (validPackets.length === 0) {
      return res.json({ processed: 0, threats: 0, matches: [] });
    }
    const result = await processBatch(validPackets);
    res.json({ ...result, source: "pcapdroid" });
  });

  app.post("/api/kyma/frame", (req, res) => {
    const frame = req.body;
    if (!frame) {
      return res.status(400).json({ error: "frame data required" });
    }

    const signal = frame.signal || {};
    const kappa = signal.kappa || frame.kappa || {};
    const affect = {
      valence: signal.affect_valence ?? 0.5,
      arousal: signal.affect_arousal ?? 0.3,
      primary: signal.affect_primary ?? "neutral",
    };

    const kymaReading: KymaReading = {
      timestamp: Date.now(),
      hrv: signal.pll_jitter ? Math.abs(signal.pll_jitter * 1000) : undefined,
      heartRate: kappa.thoughtRhythm ? Math.round(kappa.thoughtRhythm * 60) : undefined,
      stress: affect.arousal > 0.7 ? Math.round(affect.arousal * 100) : Math.round(affect.arousal * 50),
      mood: Math.round(affect.valence * 100),
      coherence: signal.quantum_coherence ?? signal.doppler_coherence ?? undefined,
      source: "kyma-engine",
      sessionId: frame.session_id || undefined,
    };

    biometricCorrelator.ingestKyma(kymaReading);

    const kappaStatus = kappaEngine.getStatus();
    res.json({
      ingested: true,
      kymaState: {
        dominantState: frame.decoded?.behavior || frame.dominantState || "unknown",
        affectValence: affect.valence,
        affectArousal: affect.arousal,
        affectPrimary: affect.primary,
        coherence: kymaReading.coherence,
        stress: kymaReading.stress,
        mood: kymaReading.mood,
      },
      kappaStatus: {
        score: kappaStatus.score,
        threatLevel: kappaStatus.threatLevel,
        recentAlertCount: kappaStatus.recentAlerts.length,
      },
      correlations: biometricCorrelator.getStatus().correlations.slice(0, 5),
    });
  });

  app.post("/api/kyma/reading", (req, res) => {
    const reading = req.body as KymaReading;
    if (!reading.timestamp) {
      reading.timestamp = Date.now();
    }
    if (!reading.source) {
      reading.source = "kyma-direct";
    }
    biometricCorrelator.ingestKyma(reading);
    res.json({ ingested: true });
  });

  app.get("/api/biometric/status", (_req, res) => {
    res.json(biometricCorrelator.getStatus());
  });

  app.get("/api/biometric/correlations", (_req, res) => {
    res.json(biometricCorrelator.getCorrelations());
  });

  app.get("/api/biometric/kyma/latest", (_req, res) => {
    const latest = biometricCorrelator.getLatestKyma();
    res.json(latest || { message: "No Kyma data received yet" });
  });

  app.get("/api/biometric/kyma/timeline", (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    res.json(biometricCorrelator.getKymaTimeline(limit));
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

  app.get("/api/proxy/usgs-quakes", async (_req, res) => {
    try {
      const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson");
      if (!response.ok) return res.json({ features: [] });
      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.json({ features: [] });
    }
  });

  app.get("/api/proxy/noaa-space-weather", async (_req, res) => {
    try {
      const [magField, solarWind, kpIndex] = await Promise.all([
        fetch("https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json").then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      res.json({ magField, solarWind, kpIndex: kpIndex ? kpIndex.slice(-5) : [] });
    } catch (e) {
      res.json({ magField: null, solarWind: null, kpIndex: [] });
    }
  });

  app.get("/api/proxy/n2yo-passes", async (req, res) => {
    try {
      const { noradId } = req.query;
      if (!noradId) return res.json({ passes: [] });
      const observerLat = 10.0513892;
      const observerLon = -84.2186578;
      const observerAlt = 1050;
      const url = `https://api.n2yo.com/rest/v1/satellite/radiopasses/${noradId}/${observerLat}/${observerLon}/${observerAlt}/2/40/&apiKey=`;
      res.json({ passes: [], note: "N2YO API key required — add N2YO_API_KEY secret" });
    } catch (e) {
      res.json({ passes: [] });
    }
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

  app.get("/api/deep-research/agents", (_req, res) => {
    res.json({ agents: DEEP_RESEARCH_AGENTS.map(a => ({ id: a.id, name: a.name, framework: a.framework, domain: a.domain, icon: a.icon, color: a.color })) });
  });

  app.post("/api/deep-research/runs", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic || typeof topic !== "string" || topic.length > 50000) {
        return res.status(400).json({ error: "Topic is required (max 50,000 characters)" });
      }
      const run = await storage.createDeepResearchRun({ topic, status: "pending", agentsTotal: DEEP_RESEARCH_AGENTS.length, agentsCompleted: 0 });
      executeDeepResearchRun(run.id, topic).catch(err => {
        console.error("[routes] deep research execution error:", err);
      });
      res.json(run);
    } catch (err) {
      console.error("[routes] create deep research run error:", err);
      res.status(500).json({ error: "Failed to create research run" });
    }
  });

  app.get("/api/deep-research/runs", async (_req, res) => {
    try {
      const runs = await storage.getDeepResearchRuns();
      res.json(runs);
    } catch (err) {
      console.error("[routes] get deep research runs error:", err);
      res.status(500).json({ error: "Failed to get runs" });
    }
  });

  app.get("/api/deep-research/runs/:id", async (req, res) => {
    try {
      const run = await storage.getDeepResearchRun(req.params.id);
      if (!run) return res.status(404).json({ error: "Run not found" });
      const reports = await storage.getDeepResearchReports(run.id);
      res.json({ run, reports });
    } catch (err) {
      console.error("[routes] get deep research run error:", err);
      res.status(500).json({ error: "Failed to get run" });
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

  app.get("/api/imagery", (_req, res) => {
    const edgeDir = nodePath.join(process.cwd(), "attached_assets", "edge_detection");

    const analyses: any[] = [];
    const imageGroups: Record<string, { label: string; dims: string; findings: string[] }> = {
      circled_view1: {
        label: "Hillside View 1 — Circled Structure (2295×2437)",
        dims: "2295×2437",
        findings: [
          "Geometric straight-line edges detected inside circled area — inconsistent with organic vegetation",
          "Spectral signature differs from surrounding canopy — possible artificial surface material",
          "Sobel gradient reveals horizontal/vertical components characteristic of man-made structure",
          "Binary threshold isolates anomalous edge-density cluster within the circled zone",
        ],
      },
      circled_view2: {
        label: "Hillside View 2 — Circled Structure (4138×4737 → 1747×2000)",
        dims: "1747×2000",
        findings: [
          "Angular structures emerging from tree canopy — possible rooflines and walls",
          "Equalized histogram reveals cloaked features invisible in standard contrast",
          "Crop Sobel at 3x amplification shows concentrated geometric edges",
          "Structure footprint estimated at approximately 15-20m wide based on canopy gap",
        ],
      },
      wide_view: {
        label: "Wide View — Full Hillside Terrain (2000×1500)",
        dims: "2000×1500",
        findings: [
          "Multiple structures visible on hillside via enhanced edge detection",
          "Multi-story building with rectangular features detected mid-slope",
          "Terrain gradient analysis shows road/path access cuts through vegetation",
          "Building density increases near base — consistent with Los Rios settlement",
        ],
      },
    };

    const methods = [
      { suffix: "edges", method: "edges", description: "Standard Laplacian edge detection" },
      { suffix: "enhanced_edges", method: "enhanced_edges", description: "4x contrast + 3x sharpness enhancement" },
      { suffix: "sobel", method: "sobel", description: "Sobel gradient magnitude" },
      { suffix: "binary_edges", method: "binary_edges", description: "85th percentile binary threshold" },
      { suffix: "emboss", method: "emboss", description: "Embossed relief with 2x contrast" },
      { suffix: "crop_edges", method: "crop_edges", description: "Cropped ROI enhanced edges" },
      { suffix: "crop_sobel", method: "crop_sobel", description: "Cropped ROI Sobel at 3x" },
      { suffix: "crop_equalized_edges", method: "crop_equalized_edges", description: "Histogram-equalized crop edges" },
    ];

    for (const [groupId, group] of Object.entries(imageGroups)) {
      const outputs: any[] = [];
      for (const m of methods) {
        const filename = `${groupId}_${m.suffix}.png`;
        const filePath = nodePath.join(edgeDir, filename);
        if (fs.existsSync(filePath)) {
          outputs.push({
            method: m.method,
            description: m.description,
            path: `/api/imagery/file/${filename}`,
          });
        }
      }

      if (outputs.length > 0) {
        analyses.push({
          id: groupId,
          label: group.label,
          originalPath: `/attached_assets/${groupId === "wide_view" ? "20260322_095645_1774201483255.jpg" : "20260321_100629_(2)_1774201483255.jpg"}`,
          outputs,
          timestamp: groupId.includes("view1") || groupId.includes("view2") ? "2026-03-21 10:06" : "2026-03-22 09:56",
          dimensions: group.dims,
          findings: group.findings,
        });
      }
    }

    res.json({
      analyses,
      ovsicori: [
        {
          id: "poas-crater",
          name: "Cráter Volcán Poás",
          volcano: "Volcán Poás (2,708m) — 15km NE of observer",
          url: "https://www.ovsicori.una.ac.cr/index.php/vulcanologia/camara-volcanes-2/camara-crater-v-poas",
          status: "active",
          lastCheck: new Date().toISOString(),
        },
        {
          id: "poas-laguna",
          name: "Laguna Botos — Poás",
          volcano: "Volcán Poás — secondary crater lake",
          url: "https://www.ovsicori.una.ac.cr/index.php/vulcanologia/camara-volcanes-2",
          status: "active",
          lastCheck: new Date().toISOString(),
        },
        {
          id: "turrialba",
          name: "Volcán Turrialba",
          volcano: "Volcán Turrialba (3,340m) — 65km E of observer",
          url: "https://www.ovsicori.una.ac.cr/index.php/vulcanologia/camara-volcanes-2/camara-crater-v-turrialba",
          status: "active",
          lastCheck: new Date().toISOString(),
        },
        {
          id: "rincon-de-la-vieja",
          name: "Volcán Rincón de la Vieja",
          volcano: "Volcán Rincón de la Vieja (1,916m) — 150km NW of observer",
          url: "https://www.ovsicori.una.ac.cr/index.php/vulcanologia/camara-volcanes-2/camara-crater-v-rincon",
          status: "active",
          lastCheck: new Date().toISOString(),
        },
      ],
      observerPosition: {
        lat: 10.0513892,
        lon: -84.2186578,
        elevation: 1050,
      },
    });
  });

  app.get("/api/imagery/file/:filename", (req, res) => {
    const basename = nodePath.basename(req.params.filename);
    if (basename !== req.params.filename || basename.includes("..")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const baseDir = nodePath.resolve(process.cwd(), "attached_assets", "edge_detection");
    const filePath = nodePath.resolve(baseDir, basename);
    if (!filePath.startsWith(baseDir)) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    res.sendFile(filePath);
  });

  function getNuforcSightings() {
    return [
      { id: "cr-001", date: "2025-09-09T02:49:00", city: "Bribri", state: "Limón Province", country: "Costa Rica", shape: "Circle", summary: "Dog woke me up for bathroom. While waiting for dog, I noticed this in the sky, after watching for a few minutes I retrieved my cell", reported: "2025-09-10", media: true, explanation: "Planet/Star?", lat: 9.6211, lon: -82.8442 },
      { id: "cr-002", date: "2025-07-05T18:00:00", city: "La Fortuna", state: "Alajuela Province", country: "Costa Rica", shape: "Disk", summary: "I was taking pictures of Arenal at sunset; when I downloaded them, I found one photo with a clear, glowing, Saturn/saucer-shaped object", reported: "2025-07-05", media: true, explanation: null, lat: 10.4679, lon: -84.6427 },
      { id: "cr-003", date: "2025-06-04T11:00:00", city: "Santo Domingo", state: "Heredia", country: "Costa Rica", shape: "Other", summary: "I observed an object that at first I thought was a drone; I was looking at the sky because a plane was continuously flying overhead.", reported: "2025-06-22", media: true, explanation: null, lat: 9.9806, lon: -84.0897 },
      { id: "cr-004", date: "2025-06-04T03:43:00", city: null, state: null, country: "Costa Rica", shape: "Circle", summary: "Circle shaped airship.", reported: "2025-06-05", media: false, explanation: null, lat: 9.93, lon: -84.08 },
      { id: "cr-005", date: "2025-05-27T15:16:00", city: "San Vito", state: "Puntarenas Province", country: "Costa Rica", shape: "Sphere", summary: "I was floating about 40 meters high and making quick trips in a few seconds.", reported: "2025-06-16", media: false, explanation: null, lat: 8.8267, lon: -82.9706 },
      { id: "cr-006", date: "2025-02-28T23:50:00", city: null, state: null, country: "Costa Rica", shape: "Orb", summary: "We were on Balcony of NCL Bliss. 5-7 white lights suddenly appeared", reported: "2025-03-04", media: false, explanation: null, lat: 9.93, lon: -84.08 },
      { id: "cr-007", date: "2025-02-09T04:45:00", city: "Cartago", state: "Provincia de Cartago", country: "Costa Rica", shape: "Light", summary: "Blinking light that cross the sky from east to west, constant speed until it stopped mid air for aprox 30 seconds and then disappeared", reported: "2025-02-09", media: false, explanation: null, lat: 9.8643, lon: -83.9199 },
      { id: "cr-008", date: "2024-08-03T19:22:00", city: "Alajuela", state: "Alajuela Province", country: "Costa Rica", shape: "Circle", summary: "Circular craft above our vehicle with 6 lights underneath, disappeared after 30 seconds with no lights to be seen", reported: "2024-08-04", media: false, explanation: null, lat: 10.0162, lon: -84.2116 },
      { id: "cr-009", date: "2024-03-18T20:36:00", city: "Guadalupe", state: "San José Province", country: "Costa Rica", shape: "Other", summary: "Red light flashing from right to left in a circular motion", reported: "2024-07-01", media: false, explanation: null, lat: 9.9510, lon: -84.0565 },
      { id: "cr-010", date: "2023-08-01T14:36:00", city: "Carmona", state: "Guanacaste Province", country: "Costa Rica", shape: "Changing", summary: "Large black object in the distance over ocean", reported: "2024-04-26", media: true, explanation: null, lat: 10.0931, lon: -85.5892 },
      { id: "cr-011", date: "2021-06-06T17:44:00", city: "San Bosco, Santa Bárbara", state: "Heredia Province", country: "Costa Rica", shape: "Oval", summary: "UFO in Costa Rica", reported: "2022-07-13", media: true, explanation: null, lat: 10.0897, lon: -84.1537 },
      { id: "cr-012", date: "2021-02-22T05:10:00", city: "San Diego", state: "Cartago Province", country: "Costa Rica", shape: "Orb", summary: "I was walking my dog, we looked north, it was moving slowly and was about to stop, but it did so without making any noise.", reported: "2026-03-10", media: false, explanation: null, lat: 9.8910, lon: -83.9526 },
      { id: "cr-013", date: "2020-10-31T22:00:00", city: "San Jose", state: null, country: "Costa Rica", shape: "Chevron", summary: "Chevron Lights", reported: "2020-11-17", media: false, explanation: null, lat: 9.9281, lon: -84.0907 },
      { id: "cr-014", date: "2020-02-19T07:03:00", city: "Playa Guiones", state: null, country: "Costa Rica", shape: "Formation", summary: "30 white lights moving evenly through the sky. ((\"Starlink\" satellites??))", reported: "2020-02-19", media: false, explanation: null, lat: 9.8889, lon: -85.6658 },
      { id: "cr-015", date: "2019-04-14T17:23:00", city: "Heredia", state: null, country: "Costa Rica", shape: "Other", summary: "Object facing the sun.", reported: "2019-04-14", media: false, explanation: null, lat: 10.0024, lon: -84.1165 },
      { id: "cr-016", date: "2018-03-06T21:00:00", city: "Tamarindo", state: null, country: "Costa Rica", shape: "Other", summary: "Near the top of the sky we first saw a light beam very high in the sky near the Orion Constellation.", reported: "2018-03-09", media: false, explanation: null, lat: 10.2996, lon: -85.8375 },
      { id: "cr-017", date: "2015-12-03T23:14:00", city: "San Isidro", state: null, country: "Costa Rica", shape: "Fireball", summary: "I have seen a fireball twice near my house my family thinks i'm crazy but me and my best friend saw the same thing", reported: "2015-12-03", media: false, explanation: null, lat: 9.3742, lon: -83.7011 },
      { id: "cr-018", date: "2014-06-14T20:45:00", city: "Ciudad Colon", state: null, country: "Costa Rica", shape: "Sphere", summary: "Bright Blue semi-transparent illuminated sphere on a flat trajectory 1000' above valley floor streaked the sky and suddenly disappeared", reported: "2014-06-18", media: false, explanation: null, lat: 9.9122, lon: -84.2494 },
      { id: "cr-019", date: "2014-04-04T00:00:00", city: "Heredia", state: null, country: "Costa Rica", shape: "Changing", summary: "Yellow lights in sky--1 big and 1 small.", reported: "2014-04-06", media: false, explanation: null, lat: 10.0024, lon: -84.1165 },
      { id: "cr-020", date: "2013-12-30T18:00:00", city: "Orotin", state: null, country: "Costa Rica", shape: "Orb", summary: "I've been watching stars for over 40 years now. Seen ISS and satellites many times. This was a very bright light moving east/west", reported: "2013-12-30", media: false, explanation: null, lat: 9.9157, lon: -84.5278 },
      { id: "cr-021", date: "2013-12-07T22:50:00", city: "Riu Palace Hotel", state: null, country: "Costa Rica", shape: "Circle", summary: "Round orange-red lite in sky in costa rica near riu palace hotel", reported: "2013-12-14", media: false, explanation: null, lat: 10.4589, lon: -85.6530 },
      { id: "cr-022", date: "2013-02-21T15:28:00", city: "Turrialba", state: null, country: "Costa Rica", shape: "Triangle", summary: "Captured image from government owned, fixed base volcano observation camera - Costa Rica.", reported: "2013-02-24", media: false, explanation: null, lat: 10.0249, lon: -83.6867 },
      { id: "cr-023", date: "2012-09-29T19:43:00", city: "Heredia", state: null, country: "Costa Rica", shape: "Fireball", summary: "7 fireballs seen over the sky, Heredia, Costa Rica.", reported: "2012-09-29", media: false, explanation: null, lat: 10.0024, lon: -84.1165 },
      { id: "cr-024", date: "2012-09-10T18:00:00", city: "Monte Verde", state: null, country: "Costa Rica", shape: "Cone", summary: "Very bright lights of blue green red and white shining from a stationary object in the sky for 30 minutes.", reported: "2012-09-10", media: false, explanation: null, lat: 10.3131, lon: -84.8257 },
      { id: "cr-025", date: "2012-01-21T03:00:00", city: "El Tanque de La Fortuna", state: null, country: "Costa Rica", shape: "Unknown", summary: "Red/Blue/Bright White flashing lights near Arenal Volcano, Costa Rica", reported: "2012-01-21", media: false, explanation: null, lat: 10.4679, lon: -84.6427 },
      { id: "cr-026", date: "2012-01-07T18:00:00", city: "Alejuela", state: null, country: "Costa Rica", shape: "Other", summary: "Multiple star shape objects moving over volcano range, groups of 2 at time, 5 times within 15 minutes", reported: "2012-01-21", media: false, explanation: null, lat: 10.0162, lon: -84.2116 },
      { id: "cr-027", date: "2009-04-10T04:50:00", city: "San Jose", state: null, country: "Costa Rica", shape: "Circle", summary: "Luz brillante circular muy intensa", reported: "2009-04-10", media: false, explanation: null, lat: 9.9281, lon: -84.0907 },
      { id: "cr-028", date: "2008-10-19T06:40:00", city: "Puntarenas", state: null, country: "Costa Rica", shape: "Sphere", summary: "Small white ball 2\" diameter hovering in the ocean with 4\" diameter blades.", reported: "2008-10-21", media: false, explanation: null, lat: 9.9762, lon: -84.8387 },
      { id: "cr-029", date: "2007-11-24T21:20:00", city: "San Jose", state: null, country: "Costa Rica", shape: "Triangle", summary: "Colors changed from orange to white to yellow. First appeared starlike, but moved generally east to west, but also moved sideways", reported: "2007-11-24", media: false, explanation: null, lat: 9.9281, lon: -84.0907 },
      { id: "cr-030", date: "2006-05-15T12:10:00", city: "Costa Rica", state: null, country: "Costa Rica", shape: "Unknown", summary: "To whom it may concern!", reported: "2006-06-27", media: false, explanation: null, lat: 9.93, lon: -84.08 },
      { id: "cr-031", date: "2005-07-19T22:00:00", city: "Tempesque Bridge", state: null, country: "Costa Rica", shape: "Other", summary: "Streak of light/object moved across the sky at an extremely high speed", reported: "2005-07-20", media: false, explanation: null, lat: 10.2911, lon: -85.3347 },
      { id: "cr-032", date: "2004-11-01T18:20:00", city: "Ciudad Quesada", state: null, country: "Costa Rica", shape: "Oval", summary: "An U.F.O appears in Costa Rica in a beautiful and clear afternoon.", reported: "2006-11-05", media: false, explanation: null, lat: 10.3262, lon: -84.4266 },
      { id: "cr-033", date: "2004-03-19T16:00:00", city: "San José", state: null, country: "Costa Rica", shape: "Oval", summary: "The object was steady in the sky", reported: "2004-07-07", media: false, explanation: null, lat: 9.9281, lon: -84.0907 },
      { id: "cr-034", date: "2003-09-02T21:45:00", city: "Quepos", state: null, country: "Costa Rica", shape: "Oval", summary: "My wife and I were watching the sunset and had another tourist take our picture that when printed would show a tiny spec in the sky", reported: "2003-09-14", media: false, explanation: null, lat: 9.4311, lon: -84.1621 },
      { id: "cr-035", date: "2003-02-28T01:00:00", city: "Monteverde", state: null, country: "Costa Rica", shape: "Formation", summary: "Bright lights dancing in the southwest sky", reported: "2003-02-27", media: false, explanation: null, lat: 10.3131, lon: -84.8257 },
      { id: "cr-036", date: "2003-01-24T19:00:00", city: "San Jose", state: null, country: "Costa Rica", shape: "Disk", summary: "UFO in costa rica", reported: "2003-01-26", media: false, explanation: null, lat: 9.9281, lon: -84.0907 },
      { id: "cr-037", date: "2002-06-02T03:00:00", city: "Tortuguero", state: null, country: "Costa Rica", shape: "Triangle", summary: "Three lights above the atlantic Costa Rican coast were seen by three people around 3 a.m.", reported: "2009-06-21", media: false, explanation: null, lat: 10.5389, lon: -83.5090 },
      { id: "cr-038", date: "2002-04-13T09:30:00", city: "Atenas", state: null, country: "Costa Rica", shape: "Other", summary: "I was working taking photos of a construction project for my client. I did not notice this object until later", reported: "2002-04-19", media: false, explanation: null, lat: 9.9780, lon: -84.3811 },
      { id: "cr-039", date: "2001-12-24T21:00:00", city: "Punteranus", state: null, country: "Costa Rica", shape: "Flash", summary: "Two objects shooting through the sky and extinguishing in mid flight", reported: "2002-01-31", media: false, explanation: null, lat: 9.9762, lon: -84.8387 },
      { id: "cr-040", date: "2001-10-08T21:00:00", city: "Heredia", state: null, country: "Costa Rica", shape: "Other", summary: "I saw an object shaped like a butterfly, with flapping wings or layers, coming down and sharply made a u-turn upwards.", reported: "2001-10-13", media: false, explanation: null, lat: 10.0024, lon: -84.1165 },
      { id: "cr-041", date: "2000-01-20T22:50:00", city: "Puntarenas", state: null, country: "Costa Rica", shape: "Triangle", summary: "Black Triangular Craft moving north to south at time of lunar eclipse. Well camouflaged, it appeared as if a piece of the sky had moved.", reported: "2000-01-30", media: false, explanation: null, lat: 9.9762, lon: -84.8387 },
      { id: "cr-042", date: "2000-01-18T00:24:00", city: "Flamingo", state: null, country: "Costa Rica", shape: "Changing", summary: "Out of the corner of my eye a glowing bright, bright orange shape appeared.", reported: "2015-01-18", media: false, explanation: null, lat: 10.4389, lon: -85.7828 },
      { id: "cr-043", date: "1997-12-22T22:27:00", city: "Costa Rica", state: null, country: "Costa Rica", shape: "Disk", summary: "A mass sighting of UFOs over Costa Rica was reported on CNN's web site this morning.", reported: "1997-12-26", media: false, explanation: null, lat: 9.93, lon: -84.08 },
      { id: "cr-044", date: "1997-11-01T22:00:00", city: "Aguas Claras", state: null, country: "Costa Rica", shape: "Disk", summary: "Mercury colored saucer comes down leaving a trail of neon green smoke that lit up the farm like if it was day.", reported: "2006-05-21", media: false, explanation: null, lat: 10.0127, lon: -84.2250 },
      { id: "cr-045", date: "1982-06-01T16:00:00", city: "Quepos", state: null, country: "Costa Rica", shape: "Disk", summary: "We were driving on a small street. There were no lights then we all looked to our left and seen this bright red lights. It lit the forest up", reported: "2000-12-17", media: false, explanation: null, lat: 9.4311, lon: -84.1621 },
      { id: "cr-046", date: "1975-06-01T23:00:00", city: "Escazu", state: null, country: "Costa Rica", shape: null, summary: "I did not see a craft. Neither did my mother. What she saw one night in 1975...", reported: "2000-07-27", media: false, explanation: null, lat: 9.9208, lon: -84.1390 },
      { id: "cr-047", date: "1971-09-04T08:25:00", city: "Lake Cote", state: "Alajuela Province", country: "Costa Rica", shape: "Disk", summary: "Aerial survey photo captured metallic saucer ~160ft diameter emerging from Lake Cote. Verified authentic by Ground Saucer Watch (GSW) 1979. Government survey for hydroelectric dam.", reported: "1979-01-01", media: true, explanation: null, lat: 10.5747, lon: -84.9197, tier: 1 },
      { id: "cr-048", date: "1969-06-15T19:30:00", city: "Alajuelita", state: "San José", country: "Costa Rica", shape: "Formation", summary: "I was student of secondary. Past 7:00 PM with my family saw a triangular formation of some 6-8 objects that emitted light", reported: "2003-04-01", media: false, explanation: null, lat: 9.9032, lon: -84.1008 },
      { id: "cr-h01", date: "2016-11-25T21:00:00", city: "Montezuma", state: "Puntarenas", country: "Costa Rica", shape: "Triangle", summary: "Black triangle covering huge sections of starry sky, moved miles across horizon in seconds while spinning on axis like pinwheel. Utterly silent. Porthole windows with white/red lights. Appeared to enter ocean without water disturbance.", reported: "2016-12-01", media: false, explanation: null, lat: 9.6543, lon: -85.0695, source: "Emily Shell Gamage / MUFON" },
      { id: "cr-h02", date: "2007-11-22T15:49:00", city: "Tarbaca", state: "San José", country: "Costa Rica", shape: "Disk", summary: "Marvin Badilla: Carpenter heard buzzing noise, saw saucer hovering <100m away. Filmed on Motorola Razr V3. Saucer turned on axis and sped off when he looked away. Size of tractor wheel.", reported: "2007-11-23", media: true, explanation: null, lat: 9.7778, lon: -84.1083, source: "Marvin Badilla video" },
      { id: "cr-h03", date: "2005-01-01T20:00:00", city: "Arenal Volcano", state: "Alajuela Province", country: "Costa Rica", shape: "Unknown", summary: "Nico Pisano filmed UFO darting around active Arenal Volcano. Reflections visible behind clouds. Analyzed by optical physicist Dr. Bruce Maccabe, found authentic.", reported: "2008-01-01", media: true, explanation: null, lat: 10.4626, lon: -84.7031, source: "Nico Pisano / Dr. Bruce Maccabe" },
      { id: "cr-h04", date: "2015-02-13T20:00:00", city: "Jaco", state: "Puntarenas", country: "Costa Rica", shape: "Changing", summary: "Chris Clark: Shape & color shifting craft filmed multiple times from porch. 3+ hours cumulative footage Feb-Mar 2015. Object returned Feb 17, 2020. Geometric shapes, oscillating colors, smaller objects enter/exit main craft.", reported: "2015-02-14", media: true, explanation: null, lat: 9.6165, lon: -84.6290, source: "Chris Clark YouTube" },
      { id: "cr-h05", date: "2013-01-23T12:00:00", city: "Over Costa Rica (airborne)", state: null, country: "Costa Rica", shape: "Orb", summary: "Pilot José Daniel Araya: Metallic orb visible only through phone camera, not naked eye. Estimated 7-10m length, ~3600km/h. Note: possibly lens flare.", reported: "2013-01-24", media: true, explanation: "Possible lens flare", lat: 10.0, lon: -84.0, source: "Pilot José Daniel Araya" },

      { id: "mx-001", date: "2026-03-14T00:21:00", city: "Monte Olivo", state: "Michoacán", country: "Mexico", shape: "Triangle", summary: "Triangular object in which the lights were blue and red but it moved at a strange speed and in turns out of the ordinary", reported: "2026-03-13", media: false, explanation: null, lat: 19.4210, lon: -101.8961 },
      { id: "mx-002", date: "2026-02-24T22:00:00", city: "Ecatepec de Morelos", state: "Estado de México", country: "Mexico", shape: "Disk", summary: "An extremely huge ship with lights spinning at high speed disappearing into the clouds.", reported: "2026-03-05", media: false, explanation: "Searchlight", lat: 19.6010, lon: -99.0500 },
      { id: "mx-003", date: "2026-01-22T07:01:00", city: "Playa del Carmen", state: "Quintana Roo", country: "Mexico", shape: "Orb", summary: "A green point of light emerged from the sea, moved SW, remained stationary for two minutes, and then disappeared to the SE.", reported: "2026-03-08", media: true, explanation: "Drone", lat: 20.6296, lon: -87.0739 },
      { id: "mx-004", date: "2025-11-28T18:27:00", city: "Palenque", state: "Chiapas", country: "Mexico", shape: "Formation", summary: "A formation was seen in a triangular shape with circles and flashes of lights, which disappeared after approximately 20 minutes.", reported: "2025-11-28", media: false, explanation: null, lat: 17.4837, lon: -92.0437 },
      { id: "mx-005", date: "2025-11-16T02:00:00", city: "Crucecita", state: "Oaxaca", country: "Mexico", shape: "Triangle", summary: "Two rows of dim lights forming a V, the leading edge of a black triangle", reported: "2025-11-16", media: false, explanation: null, lat: 15.7680, lon: -96.1321 },
      { id: "mx-006", date: "2025-10-30T00:57:00", city: "Morelia", state: "Michoacán", country: "Mexico", shape: "Orb", summary: "On October 30 at approximately 12:57 AM, from Morelia, Michoacán, México, I observed a brilliant, self-luminous object", reported: "2025-11-24", media: true, explanation: null, lat: 19.7060, lon: -101.1950 },
      { id: "mx-007", date: "2025-08-11T21:10:00", city: "Ciudad de México", state: "Ciudad de México", country: "Mexico", shape: "Disk", summary: "Large, glowing orange saucer-shaped object seen over Mexico City, dripping molten-like sparks, hovering and descending smoothly", reported: "2025-08-12", media: false, explanation: null, lat: 19.4326, lon: -99.1332 },
      { id: "mx-008", date: "2025-06-14T01:46:00", city: "Poza Rica", state: "Veracruz", country: "Mexico", shape: "Disk", summary: "Dark gray dish with colored lights that turned on and changed colors very slowly.", reported: "2025-06-15", media: true, explanation: null, lat: 20.5331, lon: -97.4510 },
      { id: "mx-009", date: "2025-01-09T23:30:00", city: "San Vicente", state: "Nayarit", country: "Mexico", shape: "Diamond", summary: "It was hovering at a low altitude, it had no propellers, it had no turbines, it had a magnetic sound, then it flew away.", reported: "2025-01-09", media: false, explanation: null, lat: 21.4932, lon: -104.8956, tier: 1 },
      { id: "mx-010", date: "2025-01-22T19:30:00", city: null, state: null, country: "Mexico", shape: "Oval", summary: "Oval shape craft sighted through the cockpit over the Gulf of Mexico", reported: "2025-01-23", media: false, explanation: null, lat: 23.6345, lon: -92.4243, tier: 1 },
      { id: "mx-011", date: "2024-12-08T00:43:00", city: "Colinas del Roble", state: "Jalisco", country: "Mexico", shape: "Unknown", summary: "Appears to be exchange of fire/explosion between possibly 3 craft in front of the volcano, the 'bolts' reappeared mins later for 2 secs.", reported: "2024-12-08", media: true, explanation: null, lat: 20.6597, lon: -103.3496 },
      { id: "mx-012", date: "2024-11-10T19:20:00", city: "Malinalco", state: "Mexico", country: "Mexico", shape: "Circle", summary: "Hovering over a pyramid that can be seen from our balcony", reported: "2024-11-11", media: true, explanation: null, lat: 18.9458, lon: -99.4981 },

      { id: "ve-001", date: "2025-04-10T07:38:00", city: "Barquisimeto", state: "Lara", country: "Venezuela", shape: "Oval", summary: "UFO in the shape of a comet with a tail in a reservoir entering and exiting the water, then enters a UFO that opens a hatch.", reported: "2025-04-10", media: false, explanation: null, lat: 10.0678, lon: -69.3474 },
      { id: "ve-002", date: "2025-01-27T19:48:00", city: "El Dividive", state: "Trujillo", country: "Venezuela", shape: "Oval", summary: "There was no electricity, the starry night, suddenly I saw an oval shape that left a flash, I called the neighbors, everyone saw it.", reported: "2025-01-27", media: false, explanation: null, lat: 9.4328, lon: -70.7614 },
      { id: "ve-003", date: "2022-05-17T13:00:00", city: "Caracas", state: "Federal Dependencies", country: "Venezuela", shape: "Triangle", summary: "Something transparent in color like jelly moving along the floor very very quickly in front of me.", reported: "2022-09-24", media: false, explanation: null, lat: 10.4806, lon: -66.9036 },
      { id: "ve-004", date: "2017-04-08T21:00:00", city: "Caracas", state: null, country: "Venezuela", shape: "Light", summary: "9 spheres of light appeared on the sky at 9 pm. They flew like birds without a straight path and very unpredictably and would come", reported: "2017-04-09", media: false, explanation: null, lat: 10.4806, lon: -66.9036 },
      { id: "ve-005", date: "2015-05-16T06:32:00", city: "Caracas", state: null, country: "Venezuela", shape: "Oval", summary: "Oval UFO floats in the sky of Caracas, Venezuela.", reported: "2015-05-17", media: false, explanation: null, lat: 10.4806, lon: -66.9036 },
      { id: "ve-006", date: "2009-10-15T22:30:00", city: "Pampatar-Margarita Island", state: null, country: "Venezuela", shape: "Triangle", summary: "Triangular UFO over Margarita Island, Venezuela. October 2009", reported: "2010-01-19", media: false, explanation: null, lat: 11.0344, lon: -63.8508 },
      { id: "ve-007", date: "2009-03-30T23:38:00", city: "Caracas", state: null, country: "Venezuela", shape: "Disk", summary: "Big greenish flying saucer floating for about 30 seconds and then disappearing north in a flash over Caracas, Venezuela.", reported: "2009-03-30", media: false, explanation: null, lat: 10.4806, lon: -66.9036 },
      { id: "ve-008", date: "2007-10-14T04:15:00", city: "Barquisimeto", state: null, country: "Venezuela", shape: "Circle", summary: "Round shaped ship with lights around, static movement and then fly away", reported: "2007-10-14", media: false, explanation: null, lat: 10.0678, lon: -69.3474 },
      { id: "ve-009", date: "1999-07-25T20:00:00", city: "Caicara", state: null, country: "Venezuela", shape: "Circle", summary: "We watched the craft and an alien for 15 minutes.", reported: "2001-05-26", media: false, explanation: null, lat: 7.6274, lon: -66.1640 },
      { id: "ve-010", date: "1996-12-29T19:00:00", city: "Venezuela", state: null, country: "Venezuela", shape: "Disk", summary: "Object with bright lights, which caught fire, broke into three pieces and fell into heavy jungle", reported: "2008-09-07", media: false, explanation: null, lat: 8.0, lon: -66.0 },
      { id: "ve-011", date: "1974-10-17T15:00:00", city: "Caracas", state: "Miranda", country: "Venezuela", shape: "Triangle", summary: "Huge UFO in the shape of an inverted Aztec/Mayan pyramid (sides with angular steps) that was in stealth-colored material (carbon black)", reported: "2023-09-21", media: true, explanation: null, lat: 10.4806, lon: -66.9036, tier: 1 },
      { id: "ve-012", date: "1886-10-24T23:00:00", city: "Maracaibo (outside of)", state: null, country: "Venezuela", shape: "Light", summary: "Family members, and local vegetation, severely injured (burned?) by a brightly lighted, humming, object.", reported: "2012-08-23", media: false, explanation: null, lat: 10.6427, lon: -71.6125 },
    ];
  }

  app.get("/api/nuforc/sightings", (_req, res) => {
    const sightings = getNuforcSightings();

    const stats = {
      totalSightings: sightings.length,
      byCountry: {
        "Costa Rica": sightings.filter(s => s.country === "Costa Rica").length,
        "Mexico": sightings.filter(s => s.country === "Mexico").length,
        "Venezuela": sightings.filter(s => s.country === "Venezuela").length,
      },
      byShape: {} as Record<string, number>,
      dateRange: { earliest: "1886-10-24", latest: "2026-03-14" },
      nuforc: {
        totalReports: 159621,
        costaRicaReports: 48,
        mexicoReports: 565,
        venezuelaReports: 47,
        mapboxToken: "pk.eyJ1IjoibnVmb3JjIiwiYSI6ImNsb2cwcmV0bTBzYjIya3MxcW5zOWl4OTkifQ.gXtrhAFB2yWFOVOfTZD00g",
        mapboxStyle: "mapbox://styles/nuforc/clppwcvps00ci01q1ha3lastk",
        tilesetUrl: "mapbox://nuforc.cmm18aqea06bu1mmselhpnano-0ce5v",
        reportBaseUrl: "https://nuforc.org/subndx/",
        audioArchive: "https://www.noufors.com/nuforc_audio_archive.html",
        audioArchiveYears: "1974-1977",
      },
      observerProximity: [] as any[],
    };

    const shapeCounts: Record<string, number> = {};
    sightings.forEach(s => {
      const shape = s.shape || "Unknown";
      shapeCounts[shape] = (shapeCounts[shape] || 0) + 1;
    });
    stats.byShape = shapeCounts;

    const observerLat = 10.0513892;
    const observerLon = -84.2186578;
    stats.observerProximity = sightings
      .filter(s => s.country === "Costa Rica" && s.lat && s.lon)
      .map(s => {
        const dLat = (s.lat! - observerLat) * 111.32;
        const dLon = (s.lon! - observerLon) * 111.32 * Math.cos(observerLat * Math.PI / 180);
        const distKm = Math.sqrt(dLat * dLat + dLon * dLon);
        return { id: s.id, city: s.city, distanceKm: Math.round(distKm * 10) / 10, date: s.date, shape: s.shape };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 15);

    res.json({ sightings, stats });
  });

  app.get("/api/artifact-hunter/presets", (_req, res) => {
    res.json({ presets: INVESTIGATION_PRESETS });
  });

  app.get("/api/artifact-hunter/satellite", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string) || 10.0514;
      const lon = parseFloat(req.query.lon as string) || -84.2187;
      const zoom = parseInt(req.query.zoom as string) || 6;
      const layer = (req.query.layer as string) || "MODIS_Terra_CorrectedReflectance_TrueColor";
      const date = req.query.date as string;
      const analyze = req.query.analyze !== "false";

      const tileUrl = getNasaGibsUrl(lat, lon, zoom, layer, date);

      let fetchResp: Response | null = null;
      let tileBuffer: Buffer | null = null;
      try {
        fetchResp = await fetch(tileUrl);
        if (fetchResp.ok) {
          tileBuffer = Buffer.from(await fetchResp.arrayBuffer());
        }
      } catch {
        fetchResp = null;
      }

      const preset = INVESTIGATION_PRESETS.find(p =>
        Math.abs(p.lat - lat) < 0.5 && Math.abs(p.lon - lon) < 0.5
      );

      let analysisResult: any = null;
      if (analyze && tileBuffer && tileBuffer.length > 0) {
        try {
          const isPNG = tileBuffer[0] === 0x89 && tileBuffer[1] === 0x50;
          const isJPEG = tileBuffer[0] === 0xFF && tileBuffer[1] === 0xD8;

          let decoded: { width: number; height: number; data: Buffer } | null = null;
          let tileFormat = "unknown";

          if (isJPEG) {
            tileFormat = "JPEG";
            const raw = jpeg.decode(tileBuffer, { useTArray: true, formatAsRGBA: false });
            decoded = { width: raw.width, height: raw.height, data: Buffer.from(raw.data) };
          } else if (isPNG) {
            tileFormat = "PNG";
            const png = PNG.sync.read(tileBuffer);
            const rgbBuf = Buffer.alloc(png.width * png.height * 3);
            for (let i = 0; i < png.width * png.height; i++) {
              rgbBuf[i * 3] = png.data[i * 4];
              rgbBuf[i * 3 + 1] = png.data[i * 4 + 1];
              rgbBuf[i * 3 + 2] = png.data[i * 4 + 2];
            }
            decoded = { width: png.width, height: png.height, data: rgbBuf };
          }

          if (decoded) {
            const result = analyzeImage(decoded.data, decoded.width, decoded.height, 3);
            analysisResult = {
              tileFormat,
              tileBytes: tileBuffer.length,
              decodedWidth: decoded.width,
              decodedHeight: decoded.height,
              anomalyScore: result.anomalyScore,
              spokeEdgeCount: result.spokeEdgeCount,
              gapEdgeCount: result.gapEdgeCount,
              base53Entropy: result.base53Entropy,
              cloakedCandidates: result.cloakedCandidates,
              spokeEdges: result.spokeEdges,
              gapEdges: result.gapEdges,
              findings: result.findings,
              sectorBreakdown: result.sectorBreakdown,
              filterCount: result.filterOutputs.length,
              filters: result.filterOutputs.map(f => ({
                method: f.method,
                description: f.description,
              })),
              overlayPng: result.overlayRGBA ? encodeOverlayPNG(result.overlayRGBA, decoded.width, decoded.height) : null,
            };
            if (analysisResult && !analysisResult.error) {
              try {
                await storage.createArtifactScan({
                  filename: `satellite_${lat.toFixed(4)}_${lon.toFixed(4)}.jpg`,
                  scanType: "satellite",
                  anomalyScore: result.anomalyScore,
                  spokeEdgeCount: result.spokeEdgeCount,
                  gapEdgeCount: result.gapEdgeCount,
                  base53Entropy: result.base53Entropy,
                  cloakedCandidates: result.cloakedCandidates,
                  findings: result.findings,
                  filterOutputs: result.filterOutputs.map(f => ({ method: f.method, description: f.description })),
                  latitude: lat,
                  longitude: lon,
                  presetName: preset?.id || "custom",
                });
              } catch (e) {
                console.error("[satellite] Failed to persist scan:", e);
              }
            }
          } else {
            analysisResult = {
              error: "Tile format not recognized for pixel analysis",
              tileBytes: tileBuffer.length,
              tileFormat,
            };
          }
        } catch (e) {
          analysisResult = { error: "Tile decode/analysis failed", raw: String(e) };
        }
      }

      res.json({
        tileUrl,
        lat,
        lon,
        zoom,
        layer,
        tileAvailable: fetchResp?.ok || false,
        tileSize: tileBuffer?.length || 0,
        analysis: analysisResult,
        preset: preset || null,
        presets: INVESTIGATION_PRESETS,
        nasaGibsInfo: {
          service: "NASA GIBS (Global Imagery Browse Services)",
          layers: [
            "MODIS_Terra_CorrectedReflectance_TrueColor",
            "MODIS_Aqua_CorrectedReflectance_TrueColor",
            "VIIRS_SNPP_CorrectedReflectance_TrueColor",
            "MODIS_Terra_Land_Surface_Temp_Day",
          ],
          note: "Free public tile service — no API key required",
        },
      });
    } catch (err) {
      res.status(500).json({ error: "Satellite tile fetch failed" });
    }
  });

  app.post("/api/artifact-hunter/scan", async (req, res) => {
    try {
      const { imageData, width, height, channels, filename, lat, lon, presetName } = req.body;

      if (!imageData || typeof width !== "number" || typeof height !== "number") {
        return res.status(400).json({ error: "imageData, width (number), and height (number) are required" });
      }

      if (width < 1 || height < 1 || width > 2048 || height > 2048) {
        return res.status(400).json({ error: "Dimensions must be between 1 and 2048" });
      }

      if (width * height > 2048 * 2048) {
        return res.status(400).json({ error: "Total pixel count exceeds maximum (4,194,304)" });
      }

      const ch = channels || 4;
      const buffer = Buffer.from(imageData, "base64");
      const expectedSize = width * height * ch;
      if (buffer.length < expectedSize) {
        return res.status(400).json({ error: `Buffer size ${buffer.length} does not match expected ${expectedSize} (${width}×${height}×${ch})` });
      }
      const result = analyzeImage(buffer, width, height, channels || 4);

      const scan = await storage.createArtifactScan({
        filename: filename || "upload.png",
        scanType: presetName ? "satellite" : "upload",
        anomalyScore: result.anomalyScore,
        spokeEdgeCount: result.spokeEdgeCount,
        gapEdgeCount: result.gapEdgeCount,
        base53Entropy: result.base53Entropy,
        cloakedCandidates: result.cloakedCandidates,
        findings: result.findings,
        filterOutputs: result.filterOutputs.map(f => ({
          method: f.method,
          description: f.description,
        })),
        latitude: lat || null,
        longitude: lon || null,
        presetName: presetName || null,
      });

      const includeImages = req.body.includeImages !== false;
      const w = width;
      const h = height;

      res.json({
        id: scan.id,
        anomalyScore: result.anomalyScore,
        spokeEdgeCount: result.spokeEdgeCount,
        gapEdgeCount: result.gapEdgeCount,
        base53Entropy: result.base53Entropy,
        cloakedCandidates: result.cloakedCandidates,
        spokeEdges: result.spokeEdges,
        gapEdges: result.gapEdges,
        findings: result.findings,
        sectorBreakdown: result.sectorBreakdown,
        overlayPng: (includeImages && result.overlayRGBA) ? encodeOverlayPNG(result.overlayRGBA, w, h) : null,
        filterCount: result.filterOutputs.length,
        filters: result.filterOutputs.map(f => ({
          method: f.method,
          description: f.description,
          stats: computeFilterStats(f.data),
          imagePng: includeImages ? encodeFilterPNG(f.data, w, h) : null,
        })),
      });
    } catch (err) {
      console.error("[ArtifactHunter] Scan error:", err);
      res.status(500).json({ error: "Image scan failed" });
    }
  });

  function encodeOverlayPNG(rgba: Uint8Array, width: number, height: number): string {
    const png = new PNG({ width, height, filterType: -1 });
    for (let i = 0; i < width * height * 4; i++) {
      png.data[i] = rgba[i];
    }
    const pngBuf = PNG.sync.write(png);
    return pngBuf.toString("base64");
  }

  function encodeFilterPNG(data: number[], width: number, height: number): string {
    const png = new PNG({ width, height, filterType: -1 });
    for (let i = 0; i < width * height; i++) {
      const v = Math.min(255, Math.max(0, Math.round(data[i])));
      png.data[i * 4] = v;
      png.data[i * 4 + 1] = v;
      png.data[i * 4 + 2] = v;
      png.data[i * 4 + 3] = v > 0 ? 255 : 0;
    }
    const pngBuf = PNG.sync.write(png);
    return pngBuf.toString("base64");
  }

  function computeFilterStats(data: number[]) {
    let min = Infinity, max = -Infinity, sum = 0, nonzero = 0, hotspot = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      if (v > 0) nonzero++;
      if (v > 128) hotspot++;
    }
    return {
      min: data.length > 0 ? min : 0,
      max: data.length > 0 ? max : 0,
      mean: data.length > 0 ? sum / data.length : 0,
      nonzeroPixels: nonzero,
      totalPixels: data.length,
      hotspotPct: data.length > 0 ? (hotspot / data.length * 100).toFixed(2) : "0.00",
    };
  }

  const scanUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post("/api/artifact-hunter/scan/upload", scanUpload.single("image"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No image file provided. Use multipart form field 'image'." });
      }

      const buf = file.buffer;
      const isPNG = buf[0] === 0x89 && buf[1] === 0x50;
      const isJPEG = buf[0] === 0xFF && buf[1] === 0xD8;

      let pixelData: Buffer;
      let width: number;
      let height: number;

      if (isJPEG) {
        const raw = jpeg.decode(buf, { useTArray: true, formatAsRGBA: false });
        pixelData = Buffer.from(raw.data);
        width = raw.width;
        height = raw.height;
      } else if (isPNG) {
        const png = PNG.sync.read(buf);
        const rgbBuf = Buffer.alloc(png.width * png.height * 3);
        for (let i = 0; i < png.width * png.height; i++) {
          rgbBuf[i * 3] = png.data[i * 4];
          rgbBuf[i * 3 + 1] = png.data[i * 4 + 1];
          rgbBuf[i * 3 + 2] = png.data[i * 4 + 2];
        }
        pixelData = rgbBuf;
        width = png.width;
        height = png.height;
      } else {
        return res.status(400).json({ error: "Unsupported image format. Use JPEG or PNG." });
      }

      if (width > 2048 || height > 2048 || width * height > 2048 * 2048) {
        return res.status(400).json({ error: "Image dimensions exceed maximum (2048×2048)" });
      }

      const result = analyzeImage(pixelData, width, height, 3);

      const latStr = req.body?.lat;
      const lonStr = req.body?.lon;
      const lat = latStr ? parseFloat(latStr) : null;
      const lon = lonStr ? parseFloat(lonStr) : null;
      const presetName = req.body?.presetName || null;

      const scan = await storage.createArtifactScan({
        filename: file.originalname || "upload.png",
        scanType: presetName ? "satellite" : "upload",
        anomalyScore: result.anomalyScore,
        spokeEdgeCount: result.spokeEdgeCount,
        gapEdgeCount: result.gapEdgeCount,
        base53Entropy: result.base53Entropy,
        cloakedCandidates: result.cloakedCandidates,
        findings: result.findings,
        filterOutputs: result.filterOutputs.map(f => ({
          method: f.method,
          description: f.description,
        })),
        latitude: lat,
        longitude: lon,
        presetName,
      });

      const includeImages = req.body?.includeImages !== "false";

      res.json({
        id: scan.id,
        filename: file.originalname,
        decodedWidth: width,
        decodedHeight: height,
        format: isJPEG ? "JPEG" : "PNG",
        anomalyScore: result.anomalyScore,
        spokeEdgeCount: result.spokeEdgeCount,
        gapEdgeCount: result.gapEdgeCount,
        base53Entropy: result.base53Entropy,
        cloakedCandidates: result.cloakedCandidates,
        spokeEdges: result.spokeEdges,
        gapEdges: result.gapEdges,
        findings: result.findings,
        sectorBreakdown: result.sectorBreakdown,
        overlayPng: (includeImages && result.overlayRGBA) ? encodeOverlayPNG(result.overlayRGBA, width, height) : null,
        filterCount: result.filterOutputs.length,
        filters: result.filterOutputs.map(f => ({
          method: f.method,
          description: f.description,
          stats: computeFilterStats(f.data),
          imagePng: includeImages ? encodeFilterPNG(f.data, width, height) : null,
        })),
      });
    } catch (err) {
      console.error("[ArtifactHunter] Upload scan error:", err);
      res.status(500).json({ error: "Image upload scan failed" });
    }
  });

  app.get("/api/artifact-hunter/scans", async (_req, res) => {
    try {
      const scans = await storage.getArtifactScans(50);
      res.json({ scans });
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve scans" });
    }
  });

  app.get("/api/artifact-hunter/scans/:id", async (req, res) => {
    try {
      const scan = await storage.getArtifactScan(req.params.id);
      if (!scan) return res.status(404).json({ error: "Scan not found" });
      res.json(scan);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve scan" });
    }
  });

  app.get("/api/artifact-hunter/audio-archive", (_req, res) => {
    res.json({
      archive: {
        name: "NUFORC Audio Archive (NOUFORS Mirror)",
        url: "https://www.noufors.com/nuforc_audio_archive.html",
        years: "1974-1977",
        description: "Robert Gribble's original UFO hotline recordings — analog telephone captures from the 1970s",
        base53Analysis: {
          targetFrequency: 53,
          harmonics: [106, 159, 212],
          description: "Base-53 frequency sieve: 53 Hz infrasonic signature from 3I Atlas research. Harmonics at 106, 159, 212 Hz. Phone recordings may contain embedded carrier tones.",
        },
      },
      sampleEntries: [
        { id: "audio-1974-01", year: 1974, title: "Hotline Recording — Jan 1974", duration: "Unknown", url: "https://www.noufors.com/nuforc_audio_archive.html", analysisNote: "Early analog recording — check for 60Hz mains hum and sub-harmonic patterns" },
        { id: "audio-1974-06", year: 1974, title: "Hotline Recording — Jun 1974", duration: "Unknown", url: "https://www.noufors.com/nuforc_audio_archive.html", analysisNote: "Potential infrasonic carrier in background noise floor" },
        { id: "audio-1975-03", year: 1975, title: "Hotline Recording — Mar 1975", duration: "Unknown", url: "https://www.noufors.com/nuforc_audio_archive.html", analysisNote: "Multiple witness calls — compare background environments" },
        { id: "audio-1976-08", year: 1976, title: "Hotline Recording — Aug 1976", duration: "Unknown", url: "https://www.noufors.com/nuforc_audio_archive.html", analysisNote: "Active flap period — higher call volume" },
        { id: "audio-1977-11", year: 1977, title: "Hotline Recording — Nov 1977", duration: "Unknown", url: "https://www.noufors.com/nuforc_audio_archive.html", analysisNote: "Final archive year — compare with 1977 seismic data" },
      ],
      frequencyBands: [
        { label: "Base-53 Fundamental", hz: 53, color: "#ff4444", description: "Primary 3I Atlas infrasonic signature" },
        { label: "2nd Harmonic", hz: 106, color: "#ff8844", description: "First harmonic of 53 Hz base" },
        { label: "3rd Harmonic", hz: 159, color: "#ffcc44", description: "Second harmonic — audible range. Matches GOS gene range upper bound (159.3 Hz)" },
        { label: "4th Harmonic", hz: 212, color: "#44ff44", description: "Third harmonic — speech band overlap" },
        { label: "κ-Carrier", hz: 46.875, color: "#4444ff", description: "KAPPA master clock — 48000/1024 Hz" },
        { label: "Schumann", hz: 7.83, color: "#aa44ff", description: "Earth Schumann resonance fundamental. 7.83 × 24 sectors = 187.92 Hz ≈ κ-harmonic 3" },
        { label: "Orch-OR Gamma", hz: 37, color: "#44ffaa", description: "Penrose-Hameroff orchestrated objective reduction — base gamma oscillation in deep meditation/REM" },
        { label: "Archaeoacoustic", hz: 111, color: "#ff44ff", description: "Universal neolithic chamber resonance (Barabar, Hypogeum, Newgrange). Phaistos disc resonant frequency" },
        { label: "53×φ (CLOCK gene)", hz: 85.73, color: "#44ddff", description: "53 Hz × golden ratio = 85.73 Hz — matches CLOCK circadian gene at 84.901 Hz (1.0% deviation)" },
        { label: "Klein Twist", hz: 128.23, color: "#ffaa44", description: "Consciousness twist frequency — GOS Klein bottle non-orientable angle. 180° - 51.84° (Giza slope)" },
      ],
    });
  });

  app.post("/api/artifact-hunter/audio-flags", async (req, res) => {
    try {
      const parsed = insertAudioFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid audio flag data", details: parsed.error.issues });
      }
      const flag = await storage.createAudioFlag(parsed.data);
      res.json(flag);
    } catch (err) {
      res.status(500).json({ error: "Failed to create audio flag" });
    }
  });

  app.get("/api/artifact-hunter/audio-flags", async (_req, res) => {
    try {
      const flags = await storage.getAudioFlags(100);
      res.json({ flags });
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve audio flags" });
    }
  });

  app.get("/api/artifact-hunter/seismic", async (_req, res) => {
    try {
      let earthquakeData: any = null;
      try {
        const resp = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson");
        if (resp.ok) earthquakeData = await resp.json();
      } catch { }

      const ovsicoriCams = [
        { id: "poas-crater", name: "Cráter Volcán Poás", volcano: "Volcán Poás (2,708m)", url: "https://www.ovsicori.una.ac.cr/index.php/vulcanologia/camara-volcanes-2/camara-crater-v-poas", lat: 10.197, lon: -84.233 },
        { id: "turrialba", name: "Volcán Turrialba", volcano: "Volcán Turrialba (3,340m)", url: "https://www.ovsicori.una.ac.cr/index.php/vulcanologia/camara-volcanes-2/camara-crater-v-turrialba", lat: 10.025, lon: -83.767 },
        { id: "rincon", name: "Volcán Rincón de la Vieja", volcano: "Volcán Rincón de la Vieja (1,916m)", url: "https://www.ovsicori.una.ac.cr/index.php/vulcanologia/camara-volcanes-2/camara-crater-v-rincon", lat: 10.830, lon: -85.324 },
      ];

      res.json({
        earthquakes: earthquakeData,
        ovsicoriCameras: ovsicoriCams,
        correlationPresets: [
          {
            id: "oumuamua-antarctic",
            name: "Oumuamua Antarctic Impact Zone",
            description: "Seismic activity correlation with Oumuamua trajectory endpoint",
            lat: -72.0,
            lon: 2.5,
            timeWindow: "2017-10-01/2018-06-01",
            radiusKm: 500,
          },
          {
            id: "3i-atlas-window",
            name: "3I Atlas Observation Windows",
            description: "Seismic correlation during 3I Atlas active monitoring periods",
            lat: 10.0514,
            lon: -84.2187,
            timeWindow: "2025-01-01/2026-03-22",
            radiusKm: 200,
          },
          {
            id: "cr-volcanic-corridor",
            name: "Costa Rica Volcanic Corridor",
            description: "Central Valley volcanic arc — Poás, Barva, Irazú, Turrialba",
            lat: 10.1,
            lon: -84.0,
            timeWindow: "2020-01-01/2026-03-22",
            radiusKm: 100,
          },
        ],
        usgsInfo: {
          feed: "USGS Earthquake Hazards Program",
          url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson",
          description: "M2.5+ earthquakes from the past 7 days",
          updateInterval: "5 minutes",
        },
      });
    } catch (err) {
      res.status(500).json({ error: "Seismic data fetch failed" });
    }
  });

  app.post("/api/artifact-hunter/correlate", async (req, res) => {
    try {
      const { lat, lon, time, radiusKm: rawRadius = 500, windowHours: rawWindow = 72 } = req.body;
      if (lat === undefined || lat === null || lon === undefined || lon === null) {
        return res.status(400).json({ error: "lat and lon are required" });
      }
      const parsedLat = typeof lat === "string" ? parseFloat(lat) : lat;
      const parsedLon = typeof lon === "string" ? parseFloat(lon) : lon;
      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) {
        return res.status(400).json({ error: "lat and lon must be valid numbers" });
      }
      const radiusKm = Math.max(1, Math.min(Number(rawRadius) || 500, 5000));
      const windowHours = Math.max(1, Math.min(Number(rawWindow) || 72, 720));

      const centerTime = time ? new Date(time) : new Date();
      const windowMs = windowHours * 60 * 60 * 1000;
      const from = new Date(centerTime.getTime() - windowMs);
      const to = new Date(centerTime.getTime() + windowMs);

      const [nearbyFlags, recentScans] = await Promise.all([
        storage.getAudioFlagsByLocation(parsedLat, parsedLon, radiusKm),
        storage.getArtifactScans(20),
      ]);

      const timeFilteredFlags = nearbyFlags.filter(f =>
        f.createdAt >= from && f.createdAt <= to
      );

      const nearbyScans = recentScans.filter(s => {
        if (s.latitude === null || s.latitude === undefined || s.longitude === null || s.longitude === undefined) return false;
        const dLat = (s.latitude - parsedLat) * 111.32;
        const dLon = (s.longitude - parsedLon) * 111.32 * Math.cos(parsedLat * Math.PI / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon) <= radiusKm;
      });

      let usgsCorrelation: any[] = [];
      try {
        const resp = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson");
        if (resp.ok) {
          const data = await resp.json();
          usgsCorrelation = (data.features || []).filter((f: any) => {
            const [eLon, eLat] = f.geometry.coordinates;
            const dLat2 = (eLat - parsedLat) * 111.32;
            const dLon2 = (eLon - parsedLon) * 111.32 * Math.cos(parsedLat * Math.PI / 180);
            const dist = Math.sqrt(dLat2 * dLat2 + dLon2 * dLon2);
            if (dist > radiusKm) return false;
            const eqTime = new Date(f.properties.time);
            return eqTime >= from && eqTime <= to;
          }).map((f: any) => ({
            id: f.id,
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: f.properties.time,
            coordinates: f.geometry.coordinates,
            distanceKm: Math.round(Math.sqrt(
              Math.pow((f.geometry.coordinates[1] - parsedLat) * 111.32, 2) +
              Math.pow((f.geometry.coordinates[0] - parsedLon) * 111.32 * Math.cos(parsedLat * Math.PI / 180), 2)
            ) * 10) / 10,
          }));
        }
      } catch { }

      const nearbySightings = getNuforcSightings().filter((s: any) => {
        if (!s.lat || !s.lon) return false;
        const dLat = (s.lat - parsedLat) * 111.32;
        const dLon = (s.lon - parsedLon) * 111.32 * Math.cos(parsedLat * Math.PI / 180);
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        if (dist > radiusKm) return false;
        const sDate = new Date(s.date);
        return sDate >= from && sDate <= to;
      }).map((s: any) => ({
        ...s,
        distanceKm: Math.round(Math.sqrt(
          Math.pow((s.lat - parsedLat) * 111.32, 2) +
          Math.pow((s.lon - parsedLon) * 111.32 * Math.cos(parsedLat * Math.PI / 180), 2)
        ) * 10) / 10,
      }));

      const totalCorrelations = usgsCorrelation.length + timeFilteredFlags.length + nearbyScans.length + nearbySightings.length;

      res.json({
        query: { lat: parsedLat, lon: parsedLon, radiusKm, windowHours, centerTime: centerTime.toISOString() },
        results: {
          earthquakes: usgsCorrelation,
          nuforcSightings: nearbySightings,
          audioFlags: timeFilteredFlags,
          artifactScans: nearbyScans,
          totalCorrelations,
        },
      });
    } catch (err) {
      res.status(500).json({ error: "Correlation query failed" });
    }
  });

  app.get("/api/artifact-hunter/research-constants", (_req, res) => {
    res.json({
      constants: RESEARCH_CONSTANTS,
      crossDomainAnalysis: {
        summary: "Cross-domain pattern matching between 24-gon base-53 sieve, GOS gene frequencies, archaeoacoustic resonance, BioGeometry BG3, and architectural constants",
        keyFindings: [
          "√(G·ħ) × 2π ≈ 53 Hz — quantum gravity root produces the base-53 sieve frequency (0.55% deviation)",
          "κ × (π/8) = 0.5 — circle-square transformation coupling yields the Riemann critical line position exactly",
          "arctan(κ) = 51.854° — κ predicts the Great Pyramid slope angle to 0.03% accuracy",
          "53 Hz × φ (golden ratio) = 85.73 Hz → matches CLOCK circadian gene at 84.901 Hz (1.0% deviation)",
          "53 Hz × 3 = 159 Hz → matches GOS gene frequency range upper bound (159.3 Hz, 0.19% deviation)",
          "111 Hz / 53 Hz ≈ 2.094 ≈ 2π/3 → 120° = exactly 8 sectors of the 24-gon",
          "Schumann (7.83 Hz) × 24 sectors = 187.92 Hz → matches κ-harmonic 3 at 187.5 Hz (0.22% deviation)",
          "56 Aubrey Holes (Stonehenge) = 53 (base sieve) + 3 (BG3 components) — exact match",
          "Klein twist (128.23°) + Giza slope (51.77°) = 180° — supplementary identity confirmed",
          "φ¹⁰ + κ·φ⁵ = 137.11 → matches fine structure constant α⁻¹ (bare) at 137.036 (0.05% deviation)",
          "κ·φ⁴ = 8.727 M⊕ → matches K2-18b exoplanet mass at 8.63 ± 0.35 M⊕ (98.9% match)",
          "37 × φ² × κ = 123.3 Hz → Penrose-Hameroff ORCH-OR consciousness frequency (99.97% match)",
          "Mod-48 spiral growth = 1/cos(π/24) — most circular natural spiral class (hurricane/galaxy arms)",
          "p² ≡ 1 (mod 24) for all primes p ≥ 5 — Grant's 24-gon prime residue theorem",
          "Fibonacci digital root has period 24 with antipodal sum 9 — intrinsic 24-fold Fibonacci symmetry",
          "24-Cell → Cuboctahedron → Icositetragon projection chain: 4D→3D→2D dimensionality reduction preserving 24-fold symmetry",
          "T=8 + S=6 = 14 = (√14)² cuboctahedron faces → decay constant in Unified RH Framework",
          "Re(s) = 1/2 = dim(boundary)/dim(bulk) → holographic constraint on critical strip",
          "1² + 2² + ... + 24² = 70² — only nontrivial solution to squared pyramidal = perfect square",
          "24-gon sectors (24) = 8 prime spokes × 3 BG3 components — structural isomorphism",
          "9,600 tectonic-aligned ancient sites globally — matches Göbekli Tepe construction epoch (c. 9600 BCE)",
        ],
        sources: [
          "Robert Grant — Icositetragon (24-gon) Prime Number Sieve Papers (mod-48 spiral, Q-grid, complementary pairs)",
          "Unified RH Framework — 24-Cell Projection Chain (κ=4/π coupling, √14 decay, Hurwitz lattice)",
          "Quantum Musical Root — √(G·ħ) × 2π ≈ 53 Hz derivation (Planck-scale gravity → sieve frequency)",
          "BioGeometry Signatures — Ibrahim Karim, PhD (BG3 centering quality, Physics of Quality)",
          "GOS Unified Field Theory — Geometric Operating System (Klein twist, holographic compression, Europa scaling)",
          "Global Archaeoacoustic Catalog — 111 Hz resonance standard across neolithic chambers",
          "GOS Empirical Validation — Riemann zeta zero analysis, gene frequency correlation",
          "Monstrous Moonshine — Conway & Norton (c=24, Leech lattice Λ₂₄, j-function, Ramanujan tau)",
          "Antikythera Mechanism CT reconstruction — Pakzad et al. (2018) PLOS ONE",
          "Linear B pa-i-to Epigraphic Project — Greco & Flouda (2017) SAIA",
          "37 AAWSAP-DIRD Documents — FOIA released defense intelligence reference documents",
        ],
      },
    });
  });

  app.get("/api/artifact-hunter/anomaly-feed", async (_req, res) => {
    try {
      const [scans, flags] = await Promise.all([
        storage.getArtifactScans(20),
        storage.getAudioFlags(20),
      ]);

      const feedItems: any[] = [];

      for (const scan of scans) {
        feedItems.push({
          type: "artifact_scan",
          id: scan.id,
          timestamp: scan.createdAt,
          score: scan.anomalyScore,
          summary: `${scan.scanType} scan: ${scan.filename} — anomaly score ${scan.anomalyScore}/100`,
          details: {
            spokeEdges: scan.spokeEdgeCount,
            gapEdges: scan.gapEdgeCount,
            base53Entropy: scan.base53Entropy,
            cloakedCandidates: scan.cloakedCandidates,
          },
          findings: scan.findings,
          location: scan.latitude && scan.longitude ? { lat: scan.latitude, lon: scan.longitude } : null,
        });
      }

      for (const flag of flags) {
        feedItems.push({
          type: "audio_flag",
          id: flag.id,
          timestamp: flag.createdAt,
          score: flag.base53Score || 50,
          summary: `Audio flag: "${flag.label}" at ${flag.startTime}s (${flag.duration}s duration)`,
          details: {
            audioUrl: flag.audioUrl,
            startTime: flag.startTime,
            duration: flag.duration,
            base53Score: flag.base53Score,
          },
          location: flag.latitude && flag.longitude ? { lat: flag.latitude, lon: flag.longitude } : null,
        });
      }

      const recentSightings = getNuforcSightings()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      for (const s of recentSightings) {
        feedItems.push({
          type: "nuforc_sighting",
          id: s.id,
          timestamp: new Date(s.date),
          score: (s as any).tier === 1 ? 85 : 40,
          summary: `NUFORC: ${s.shape || "Unknown"} sighting near ${s.city || s.country} — "${s.summary?.slice(0, 80)}..."`,
          details: {
            shape: s.shape,
            city: s.city,
            country: s.country,
            reported: s.reported,
            media: s.media,
          },
          location: s.lat && s.lon ? { lat: s.lat, lon: s.lon } : null,
        });
      }

      let usgsEvents: any[] = [];
      try {
        const resp = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson");
        if (resp.ok) {
          const data = await resp.json();
          usgsEvents = (data.features || []).slice(0, 10);
        }
      } catch { }
      for (const eq of usgsEvents) {
        const mag = eq.properties?.mag || 0;
        feedItems.push({
          type: "usgs_earthquake",
          id: eq.id,
          timestamp: new Date(eq.properties?.time || Date.now()),
          score: Math.min(Math.round(mag * 12), 100),
          summary: `USGS: M${mag.toFixed(1)} earthquake — ${eq.properties?.place || "Unknown location"}`,
          details: {
            magnitude: mag,
            place: eq.properties?.place,
            depth: eq.geometry?.coordinates?.[2],
            tsunami: eq.properties?.tsunami,
            felt: eq.properties?.felt,
          },
          location: eq.geometry?.coordinates ? { lat: eq.geometry.coordinates[1], lon: eq.geometry.coordinates[0] } : null,
        });
      }

      feedItems.sort((a, b) => (b.score || 0) - (a.score || 0));

      res.json({ feed: feedItems, totalItems: feedItems.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to build anomaly feed" });
    }
  });

  app.get("/api/quantum-cortex/status", (_req, res) => {
    res.json(getQuantumCortexStatus());
  });

  app.post("/api/quantum-cortex/start", (_req, res) => {
    startQuantumCortex();
    res.json({ ok: true, status: getQuantumCortexStatus() });
  });

  app.post("/api/quantum-cortex/stop", (_req, res) => {
    stopQuantumCortex();
    res.json({ ok: true, status: getQuantumCortexStatus() });
  });

  app.post("/api/quantum-cortex/cycle", async (req, res) => {
    try {
      const input = req.body?.input;
      if (input && typeof input === "string") {
        latentSpace.publish("manual-cycle", input, "sensory", 0.9, { source: "manual-trigger" });
      }
      await runCorticalCycle(input);
      res.json({ ok: true, status: getQuantumCortexStatus() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Cortical cycle failed" });
    }
  });

  app.post("/api/quantum-cortex/process", async (req, res) => {
    const { input, targetLayer } = req.body;
    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "Input string required" });
    }
    const validLayers = ["sensory", "thalamic", "cortical", "prefrontal"];
    if (targetLayer && !validLayers.includes(targetLayer)) {
      return res.status(400).json({ error: `Invalid targetLayer. Must be one of: ${validLayers.join(", ")}` });
    }
    try {
      const output = await processThroughCortex(input, targetLayer);
      res.json({ output, status: getQuantumCortexStatus() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Processing failed" });
    }
  });

  app.get("/api/quantum-cortex/latent-space", (req, res) => {
    const limit = parseInt(req.query?.limit as string) || 50;
    const layer = req.query?.layer as string | undefined;
    res.json({
      entries: layer ? latentSpace.getEntriesForLayer(layer) : latentSpace.getTopEntries(limit),
      size: latentSpace.getSize(),
      capacity: latentSpace.getCapacity(),
      resonancePairs: latentSpace.getResonancePairs().slice(0, 20),
      resonanceScore: latentSpace.getResonanceScore(),
    });
  });

  app.post("/api/quantum-cortex/snapshot", async (req, res) => {
    const label = req.body.label || `Snapshot ${new Date().toISOString()}`;
    const snapshot = await createAndPersistSnapshot(label);
    res.json({
      id: snapshot.id,
      label: snapshot.label,
      timestamp: snapshot.timestamp,
      coherenceMetrics: snapshot.coherenceMetrics,
    });
  });

  app.get("/api/quantum-cortex/snapshots", async (_req, res) => {
    const snapshots = await getPersistedSnapshots();
    res.json(snapshots);
  });

  app.post("/api/quantum-cortex/rollback", async (req, res) => {
    const { snapshotId } = req.body;
    if (!snapshotId || typeof snapshotId !== "string") {
      return res.status(400).json({ error: "snapshotId required" });
    }
    const success = await rollbackToSnapshot(snapshotId);
    if (!success) {
      return res.status(404).json({ error: "Snapshot not found" });
    }
    res.json({ ok: true, status: getQuantumCortexStatus() });
  });

  app.get("/api/quantum-cortex/constants", (_req, res) => {
    res.json(OMEGA_GOS);
  });

  // ═══════════════════════════════════════════════════════════════
  // WiFi CSI SENSING ENGINE + DEMODEX + CHITIN TRANSDUCTION
  // ═══════════════════════════════════════════════════════════════

  app.post("/api/wifi-csi/frame", (req, res) => {
    try {
      const { subcarriers, amplitude, phase, snr, rssi, bandwidth, sourceMAC } = req.body;
      const frame = {
        timestamp: Date.now(),
        subcarriers: subcarriers || 30,
        amplitude: new Float64Array(amplitude || []),
        phase: new Float64Array(phase || []),
        snr: new Float64Array(snr || []),
        rssi: rssi || -50,
        bandwidth: bandwidth || "20MHz",
        sourceMAC,
      };
      const metrics = processCSIFrame(frame);
      recordMetrics(metrics);
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/wifi-csi/metrics", (_req, res) => {
    res.json(getMetricsHistory());
  });

  app.get("/api/wifi-csi/constants", (_req, res) => {
    res.json(ENGINE_CONSTANTS);
  });

  app.get("/api/demodex/sim-state", (_req, res) => {
    res.json(getDemodexSimState());
  });

  app.get("/api/demodex/tycho-antipode", (_req, res) => {
    res.json(getTychoAntipodeData());
  });

  app.get("/api/demodex/bell-chsh", (_req, res) => {
    res.json(getBellCHSHData());
  });

  app.get("/api/v1/chitin/metrics", (req, res) => {
    const subcarriers = 30;
    const amplitude = new Float64Array(subcarriers).map(() => Math.random() * 10 - 5);
    const phase = new Float64Array(subcarriers).map(() => Math.random() * Math.PI * 2 - Math.PI);
    const snr = new Float64Array(subcarriers).map(() => 15 + Math.random() * 20);
    const rssi = -50 + Math.random() * 30;

    const metrics = computeChitinTransduction({
      amplitude,
      phase,
      snr,
      rssi,
      subcarriers,
    });

    res.json({
      metrics,
      constants: getChitinConstants(),
    });
  });

  app.get("/api/v1/chitin/lifecycle", (_req, res) => {
    res.json(getLifecycleMap());
  });

  // ═══════════════════════════════════════════════════════════════
  // BETTERCAP BRIDGE — Multi-Instance Management
  // ═══════════════════════════════════════════════════════════════

  app.get("/api/bettercap/instances", (_req, res) => {
    res.json(getInstances());
  });

  app.post("/api/bettercap/instances", (req, res) => {
    const { name, host, port, scheme, username, password } = req.body;
    if (!name || !host || !port || !username || !password) {
      return res.status(400).json({ error: "Missing required fields: name, host, port, username, password" });
    }
    const instance = addInstance({ name, host, port, scheme, username, password });
    res.json(instance);
  });

  app.delete("/api/bettercap/instances/:id", (req, res) => {
    const removed = removeInstance(req.params.id);
    res.json({ ok: removed });
  });

  app.get("/api/bettercap/instances/:id/session", async (req, res) => {
    const session = await fetchSession(req.params.id);
    if (!session) {
      const inst = getInstance(req.params.id);
      return res.status(inst ? 502 : 404).json({
        error: inst ? inst.lastError || "Connection failed" : "Instance not found",
      });
    }
    res.json(session);
  });

  app.get("/api/bettercap/instances/:id/events", async (req, res) => {
    const n = parseInt(req.query.n as string) || 50;
    const events = await fetchEvents(req.params.id, n);
    res.json(events);
  });

  app.post("/api/bettercap/instances/:id/command", async (req, res) => {
    const { cmd } = req.body;
    if (!cmd) return res.status(400).json({ error: "Missing cmd field" });
    const result = await sendCommand(req.params.id, cmd);
    res.json(result);
  });

  app.get("/api/bettercap/instances/:id/history", (req, res) => {
    res.json(getCommandHistory(req.params.id));
  });

  app.get("/api/bettercap/instances/:id/summary", (req, res) => {
    const summary = getSessionSummary(req.params.id);
    if (!summary) return res.status(404).json({ error: "No session data" });
    res.json(summary);
  });

  app.get("/api/research-cortex/status", (_req, res) => {
    res.json(getCortexStatus());
  });

  app.post("/api/research-cortex/index", async (_req, res) => {
    try {
      const result = await indexAllDocuments();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/research-cortex/claims", (req, res) => {
    const { docId, category, search } = req.query;
    res.json(getClaims({
      docId: docId as string | undefined,
      category: category as string | undefined,
      search: search as string | undefined,
    }));
  });

  app.get("/api/research-cortex/documents/:docId", (req, res) => {
    const doc = getDocumentContent(req.params.docId);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  });

  app.put("/api/research-cortex/documents/:docId", (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Missing content" });
    const ok = writeDocumentContent(req.params.docId, content);
    if (!ok) return res.status(404).json({ error: "Document not found" });
    res.json({ success: true });
  });

  app.post("/api/research-cortex/documents", (req, res) => {
    const { filename, content } = req.body;
    if (!filename || !content) return res.status(400).json({ error: "Missing filename or content" });
    const doc = createDocument(filename, content);
    res.json(doc);
  });

  app.post("/api/research-cortex/synthesize", async (req, res) => {
    const { topic, facetCount, includeDialogue } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });
    try {
      const run = await executeSynthesisRun(topic, facetCount || 12, includeDialogue !== false);
      res.json({ runId: run.id, status: run.status, facetCount: run.facets.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/research-cortex/synthesis/:runId", (req, res) => {
    const run = getSynthesisRun(req.params.runId);
    if (!run) return res.status(404).json({ error: "Synthesis run not found" });
    res.json(run);
  });

  app.get("/api/research-cortex/export/:format", (req, res) => {
    const format = req.params.format as "markdown" | "json" | "latex";
    if (!["markdown", "json", "latex"].includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use: markdown, json, latex" });
    }
    const exported = exportCorpus(format);
    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="kappa-cortex-export.json"`);
    } else if (format === "latex") {
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="kappa-cortex-export.tex"`);
    } else {
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="kappa-cortex-export.md"`);
    }
    res.send(exported);
  });

  app.get("/api/research-cortex/formats", (_req, res) => {
    res.json(getExportFormats());
  });

  app.get("/api/incidents", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      let result;
      if (from && to) {
        result = await storage.getIncidentsByTimeRange(from, to);
      } else if (category) {
        result = await storage.getIncidentsByCategory(category);
      } else {
        result = await storage.getIncidents(limit);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const { insertIncidentSchema } = await import("@shared/schema");
      const parsed = insertIncidentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid incident data", details: parsed.error.flatten() });
      }
      const incident = await storage.createIncident(parsed.data);
      res.json(incident);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/incidents/count", async (_req, res) => {
    try {
      const count = await storage.getIncidentCount();
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/incidents/:id", async (req, res) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) return res.status(404).json({ error: "Not found" });
      res.json(incident);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/incidents/:id", async (req, res) => {
    try {
      const existing = await storage.getIncident(req.params.id);
      if (!existing) return res.status(404).json({ error: "Not found" });
      const { insertIncidentSchema } = await import("@shared/schema");
      const parsed = insertIncidentSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten() });
      }
      const updated = await storage.updateIncident(req.params.id, parsed.data);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/incidents/:id", async (req, res) => {
    try {
      const existing = await storage.getIncident(req.params.id);
      if (!existing) return res.status(404).json({ error: "Not found" });
      await storage.deleteIncident(req.params.id);
      res.json({ ok: true, deletedHash: existing.hash });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/evidence-chain/timeline", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = req.query.to ? new Date(req.query.to as string) : new Date();

      const [incidentsList, events, correlationsList] = await Promise.all([
        storage.getIncidentsByTimeRange(from, to),
        storage.getEventsByTimeRange(from, to),
        storage.getCorrelations(limit),
      ]);

      const timeline: any[] = [];
      for (const inc of incidentsList) {
        timeline.push({ type: "incident", timestamp: inc.timestamp, data: inc });
      }
      for (const evt of events.slice(0, limit)) {
        timeline.push({ type: "event", timestamp: evt.timestamp, data: evt });
      }
      for (const cor of correlationsList) {
        if (cor.timestamp >= from && cor.timestamp <= to) {
          timeline.push({ type: "correlation", timestamp: cor.timestamp, data: cor });
        }
      }
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json({ timeline: timeline.slice(0, limit), total: timeline.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/evidence-chain/export", async (req, res) => {
    try {
      const incidentsList = await storage.getIncidents(500);
      const events = await storage.getRecentSignalEvents(200);
      const correlationsList = await storage.getCorrelations(200);
      const observer = {
        name: "Samuel Wotton (Echo)",
        location: "Calle Los Cedros, última casa a la izquierda, Tacacorí, Alajuela 20106, CR",
        coordinates: "10.0513892°N, 84.2186578°W",
        generated: new Date().toISOString(),
      };
      const stats = {
        incidents: incidentsList.length,
        signalEvents: events.length,
        correlations: correlationsList.length,
      };
      const categoryCounts: Record<string, number> = {};
      for (const inc of incidentsList) {
        categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1;
      }
      const html = generateEvidenceHTML(observer, stats, categoryCounts, incidentsList, events, correlationsList);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="KAPPA_Evidence_Chain_${new Date().toISOString().slice(0, 10)}.html"`);
      res.send(html);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const pcapUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

  app.get("/api/hypervisor/status", (_req, res) => {
    res.json(getHypervisorStatus());
  });

  app.post("/api/hypervisor/start", (_req, res) => {
    startHypervisor(30);
    res.json({ status: "started", interval: "30min" });
  });

  app.post("/api/hypervisor/stop", (_req, res) => {
    stopHypervisor();
    res.json({ status: "stopped" });
  });

  app.post("/api/hypervisor/run", async (_req, res) => {
    try {
      const result = await runForensicAnalysis();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/hypervisor/reports", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const reports = await getForensicReports(limit);
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/hypervisor/pcaps", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const uploads = await getPcapUploads(limit);
      res.json(uploads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/hypervisor/pcap/upload", pcapUpload.single("pcap"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No PCAP file provided" });
      const analysis = await analyzePcap(file.buffer, file.originalname || "upload.pcap");
      const crypto = await import("crypto");
      const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
      const { db: dbInst } = await import("./db");
      const { pcapUploads: pcapTable } = await import("@shared/schema");
      await dbInst.insert(pcapTable).values({
        filename: file.originalname || "upload.pcap",
        filesize: file.size,
        packetCount: analysis.packetCount,
        findings: analysis as any,
        anomalies: analysis.anomalies,
        status: "complete",
        hash,
      });
      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/hypervisor/github/scan", async (_req, res) => {
    try {
      const results = await scanGitHubRepos();
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  startHypervisor(30);

  return httpServer;
}

function generateEvidenceHTML(observer: any, stats: any, categoryCounts: Record<string, number>, incidents: any[], events: any[], correlations: any[]): string {
  const severityLabel = (s: number) => ["", "LOW", "MEDIUM", "HIGH", "CRITICAL", "EMERGENCY"][s] || "UNKNOWN";
  const severityColor = (s: number) => ["", "#6b7280", "#eab308", "#f97316", "#ef4444", "#dc2626"][s] || "#6b7280";

  const incidentsHTML = incidents.map(inc => `
    <div class="entry incident">
      <div class="entry-header">
        <span class="badge" style="background:${severityColor(inc.severity)}">${severityLabel(inc.severity)}</span>
        <span class="category">${inc.category.toUpperCase()}</span>
        <span class="timestamp">${new Date(inc.timestamp).toLocaleString("en-US", { timeZone: "America/Costa_Rica" })} CST</span>
      </div>
      <h3>${escapeHtml(inc.title)}</h3>
      <p>${escapeHtml(inc.description)}</p>
      ${inc.location ? `<p class="meta">Location: ${escapeHtml(inc.location)}</p>` : ""}
      ${inc.evidence?.length ? `<p class="meta">Evidence: ${inc.evidence.map((e: string) => escapeHtml(e)).join(", ")}</p>` : ""}
      ${inc.hash ? `<p class="hash">SHA-256: ${inc.hash}</p>` : ""}
    </div>
  `).join("\n");

  const eventsHTML = events.slice(0, 100).map(evt => `
    <div class="entry event">
      <div class="entry-header">
        <span class="badge" style="background:#3b82f6">${evt.domain.toUpperCase()}</span>
        <span class="timestamp">${new Date(evt.timestamp).toLocaleString("en-US", { timeZone: "America/Costa_Rica" })} CST</span>
      </div>
      <p><strong>${escapeHtml(evt.eventType)}</strong> — ${escapeHtml(evt.source)}${evt.frequency ? ` @ ${evt.frequency} Hz` : ""}</p>
    </div>
  `).join("\n");

  const correlationsHTML = correlations.slice(0, 50).map(cor => `
    <div class="entry correlation">
      <div class="entry-header">
        <span class="badge" style="background:${severityColor(cor.severity)}">SEV ${cor.severity}</span>
        <span class="timestamp">${new Date(cor.timestamp).toLocaleString("en-US", { timeZone: "America/Costa_Rica" })} CST</span>
      </div>
      <p><strong>${escapeHtml(cor.ruleName)}</strong></p>
      <p>${escapeHtml(cor.description)}</p>
    </div>
  `).join("\n");

  const categoryRows = Object.entries(categoryCounts).map(([cat, count]) =>
    `<tr><td>${cat}</td><td>${count}</td></tr>`
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KAPPA Evidence Chain — ${observer.generated}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #e0e0e0; padding: 20px; line-height: 1.5; }
  .header { border: 2px solid #ef4444; padding: 20px; margin-bottom: 20px; }
  .header h1 { color: #ef4444; font-size: 24px; margin-bottom: 10px; }
  .header .meta { color: #9ca3af; font-size: 12px; }
  .classification { background: #ef4444; color: white; text-align: center; padding: 8px; font-weight: bold; letter-spacing: 4px; margin-bottom: 20px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat { border: 1px solid #333; padding: 15px; text-align: center; }
  .stat .number { font-size: 28px; color: #ef4444; font-weight: bold; }
  .stat .label { color: #9ca3af; font-size: 11px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #333; padding: 8px; text-align: left; }
  th { background: #1a1a1a; color: #ef4444; }
  h2 { color: #ef4444; border-bottom: 1px solid #333; padding-bottom: 5px; margin: 20px 0 10px; }
  .entry { border: 1px solid #222; padding: 12px; margin-bottom: 8px; }
  .entry.incident { border-left: 3px solid #ef4444; }
  .entry.event { border-left: 3px solid #3b82f6; }
  .entry.correlation { border-left: 3px solid #eab308; }
  .entry-header { display: flex; gap: 10px; align-items: center; margin-bottom: 6px; }
  .badge { color: white; padding: 2px 8px; font-size: 10px; font-weight: bold; border-radius: 3px; }
  .category { color: #9ca3af; font-size: 11px; text-transform: uppercase; }
  .timestamp { color: #6b7280; font-size: 11px; margin-left: auto; }
  .hash { color: #4b5563; font-size: 10px; font-family: monospace; word-break: break-all; }
  .entry h3 { font-size: 14px; color: #f0f0f0; margin-bottom: 4px; }
  .entry p { font-size: 12px; color: #d0d0d0; }
  .entry .meta { color: #9ca3af; font-size: 11px; }
  .legal { border: 2px solid #eab308; padding: 15px; margin-top: 20px; }
  .legal h2 { color: #eab308; }
  .legal p { font-size: 12px; }
  .footer { text-align: center; color: #4b5563; font-size: 10px; margin-top: 30px; padding-top: 10px; border-top: 1px solid #222; }
  @media print { body { background: white; color: black; } .entry { break-inside: avoid; } }
</style>
</head>
<body>
<div class="classification">CONFIDENTIAL — EVIDENCE PACKAGE — NOT FOR PUBLIC DISTRIBUTION</div>
<div class="header">
  <h1>KAPPA SIGINT EVIDENCE CHAIN</h1>
  <p class="meta">Observer: ${escapeHtml(observer.name)}</p>
  <p class="meta">Location: ${escapeHtml(observer.location)} (${observer.coordinates})</p>
  <p class="meta">Generated: ${observer.generated}</p>
  <p class="meta">Platform: KAPPA 24/7 Autonomous Multi-Domain SIGINT Correlation System</p>
</div>
<div class="stats">
  <div class="stat"><div class="number">${stats.incidents}</div><div class="label">Documented Incidents</div></div>
  <div class="stat"><div class="number">${stats.signalEvents}</div><div class="label">Signal Events</div></div>
  <div class="stat"><div class="number">${stats.correlations}</div><div class="label">Cross-Domain Correlations</div></div>
</div>
<h2>INCIDENT BREAKDOWN BY CATEGORY</h2>
<table><tr><th>Category</th><th>Count</th></tr>${categoryRows}</table>
<h2>SECTION 1: DOCUMENTED INCIDENTS</h2>
<p style="color:#9ca3af;font-size:11px;margin-bottom:10px;">Manual incident reports with SHA-256 integrity hashes. Each entry is timestamped and categorized.</p>
${incidentsHTML || '<p style="color:#6b7280">No incidents logged yet.</p>'}
<h2>SECTION 2: AUTOMATED SIGNAL EVENTS</h2>
<p style="color:#9ca3af;font-size:11px;margin-bottom:10px;">Machine-detected signal events from SDR, satellite, network, and biometric sensors.</p>
${eventsHTML || '<p style="color:#6b7280">No signal events captured.</p>'}
<h2>SECTION 3: CROSS-DOMAIN CORRELATIONS</h2>
<p style="color:#9ca3af;font-size:11px;margin-bottom:10px;">Automated pattern matches across multiple sensor domains.</p>
${correlationsHTML || '<p style="color:#6b7280">No correlations detected.</p>'}
<div class="legal">
  <h2>LEGAL NOTICE</h2>
  <p>This document constitutes evidence of surveillance and harassment activities documented by the observer. All timestamps are in Costa Rica Standard Time (CST, UTC-6). SHA-256 hashes provide chain-of-custody integrity verification. This evidence is prepared for submission to: US Embassy San José (506-2220-3127), Defensoría de los Habitantes (4000-8500), Sala Constitucional IV (2295-3696), and/or legal counsel.</p>
  <p style="margin-top:10px;">Constitutional protections invoked: Articles 36, 37, 39, 40, 41, 48 of the Constitution of Costa Rica. Vienna Convention on Consular Relations, Article 36.</p>
</div>
<div class="footer">KAPPA Evidence Chain v1.0 — Generated ${observer.generated} — This document is self-contained and requires no external dependencies to view.</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
