import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import {
  KAPPA_CONSTANTS,
  TLE_CATALOG_GROUPS,
  type CollectorStatusType,
  type FlightData,
} from "@shared/schema";

interface CollectorState {
  name: string;
  running: boolean;
  lastRun: number | null;
  eventsCreated: number;
  errors: number;
  intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
}

const collectors: Map<string, CollectorState> = new Map();

async function collectFlights(): Promise<number> {
  const latCenter = (KAPPA_CONSTANTS.OBSERVER_LAT + KAPPA_CONSTANTS.JACO_LAT) / 2;
  const lonCenter = (KAPPA_CONSTANTS.OBSERVER_LON + KAPPA_CONSTANTS.JACO_LON) / 2;
  const latMin = latCenter - 1.5;
  const latMax = latCenter + 1.5;
  const lonMin = lonCenter - 1.5;
  const lonMax = lonCenter + 1.5;

  const url = `https://opensky-network.org/api/states/all?lamin=${latMin}&lomin=${lonMin}&lamax=${latMax}&lomax=${lonMax}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[flights] OpenSky fetch failed: ${msg}`);
    return 0;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    if (response.status === 429) {
      console.log(`[flights] OpenSky rate-limited (429) — backing off`);
    } else {
      console.log(`[flights] OpenSky HTTP ${response.status} — ${response.statusText}`);
    }
    return 0;
  }

  let data: any;
  try {
    data = await response.json();
  } catch (parseErr) {
    console.log(`[flights] OpenSky returned non-JSON response`);
    return 0;
  }

  if (!data.states || data.states.length === 0) {
    return 0;
  }

  console.log(`[flights] OpenSky returned ${data.states.length} aircraft`);

  let created = 0;
  for (const s of data.states) {
    const flight: FlightData = {
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
    };

    if (!flight.latitude || !flight.longitude) continue;

    const event = await storage.createSignalEvent({
      domain: "radar",
      source: "opensky-collector",
      eventType: "adsb-track",
      frequency: 1090,
      confidence: 0.9,
      latitude: flight.latitude,
      longitude: flight.longitude,
      metadata: {
        icao24: flight.icao24,
        callsign: flight.callsign,
        altitude: flight.altitude,
        velocity: flight.velocity,
        heading: flight.heading,
        onGround: flight.onGround,
        originCountry: flight.originCountry,
      },
      raw: null,
    });

    kappaEngine.ingest(event);
    hypervisor.ingestEvent(event);
    created++;
  }

  return created;
}

const PRIORITY_NORAD_IDS: { noradId: number; name: string; program: string }[] = [
  { noradId: 48915, name: "YAM-3 (DARPA Blackjack/SDA POET)", program: "CASINO/Blackjack" },
  { noradId: 55076, name: "YAM-5 (NASA MURI/Kinéis)", program: "CASINO/Loft Orbital" },
];

interface TLEHistoryEntry {
  tleLine1: string;
  tleLine2: string;
  meanMotion: number;
  meanAnomaly: number;
  epochTimestamp: number;
  fetchedAt: number;
  elevation: number;
}

const tleHistory: Map<number, TLEHistoryEntry> = new Map();

const TLE_SPOOF_THRESHOLDS = {
  DELTA_N_REV_PER_DAY: 0.05,
  DELTA_M_DEG: 5.0,
  ELEVATION_OFFSET_DEG: 10.0,
  MIN_EPOCH_GAP_MS: 60_000,
};

function parseTLEFields(line2: string): { meanMotion: number; meanAnomaly: number } | null {
  try {
    const meanAnomaly = parseFloat(line2.substring(43, 51).trim());
    const meanMotion = parseFloat(line2.substring(52, 63).trim());
    if (isNaN(meanMotion) || isNaN(meanAnomaly)) return null;
    return { meanMotion, meanAnomaly };
  } catch {
    return null;
  }
}

function parseTLEEpoch(line1: string): number | null {
  try {
    const yearStr = line1.substring(18, 20).trim();
    const dayStr = line1.substring(20, 32).trim();
    let year = parseInt(yearStr, 10);
    if (year < 57) year += 2000; else year += 1900;
    const dayOfYear = parseFloat(dayStr);
    const jan1 = new Date(Date.UTC(year, 0, 1));
    return jan1.getTime() + (dayOfYear - 1) * 86400000;
  } catch {
    return null;
  }
}

async function checkTLEConsistency(
  sat: typeof import("satellite.js"),
  noradId: number,
  satName: string,
  newLine1: string,
  newLine2: string,
  currentElevation: number,
): Promise<void> {
  const newFields = parseTLEFields(newLine2);
  if (!newFields) return;

  const newEpoch = parseTLEEpoch(newLine1);
  if (!newEpoch) return;

  const now = Date.now();
  const prev = tleHistory.get(noradId);

  tleHistory.set(noradId, {
    tleLine1: newLine1,
    tleLine2: newLine2,
    meanMotion: newFields.meanMotion,
    meanAnomaly: newFields.meanAnomaly,
    epochTimestamp: newEpoch,
    fetchedAt: now,
    elevation: currentElevation,
  });

  if (!prev) return;

  const epochGap = Math.abs(newEpoch - prev.epochTimestamp);
  if (epochGap < TLE_SPOOF_THRESHOLDS.MIN_EPOCH_GAP_MS) return;

  const deltaN = Math.abs(newFields.meanMotion - prev.meanMotion);

  // Mean anomaly (M) advances continuously as the satellite orbits, so the raw
  // difference between two epochs is meaningless (a GEO sat legitimately shows
  // ~96-206°). To detect spoofing we propagate the PREVIOUS epoch forward using
  // its mean motion and compare the OBSERVED M against the EXPECTED M. Only a
  // real velocity/position manipulation produces a residual.
  const epochGapDays = (newEpoch - prev.epochTimestamp) / 86_400_000;
  const avgMeanMotion = (prev.meanMotion + newFields.meanMotion) / 2; // rev/day
  const expectedAdvanceDeg = avgMeanMotion * 360 * epochGapDays;
  const expectedM = (((prev.meanAnomaly + expectedAdvanceDeg) % 360) + 360) % 360;
  const rawDiff = Math.abs(newFields.meanAnomaly - expectedM) % 360;
  const deltaM = rawDiff > 180 ? 360 - rawDiff : rawDiff; // shortest angular distance, 0-180°

  let elevationOffset = 0;
  try {
    const prevSatrec = sat.twoline2satrec(prev.tleLine1, prev.tleLine2);
    const currentTime = new Date();
    const prevPosVel = sat.propagate(prevSatrec, currentTime);
    if (prevPosVel.position && typeof prevPosVel.position !== "boolean") {
      const gmst = sat.gstime(currentTime);
      const observerGd = {
        longitude: sat.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LON),
        latitude: sat.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LAT),
        height: KAPPA_CONSTANTS.OBSERVER_ALT,
      };
      const prevEcf = sat.eciToEcf(prevPosVel.position, gmst);
      const prevLook = sat.ecfToLookAngles(observerGd, prevEcf);
      const prevPredictedElev = sat.radiansToDegrees(prevLook.elevation);
      elevationOffset = Math.abs(currentElevation - prevPredictedElev);
    }
  } catch {
    elevationOffset = 0;
  }

  const nExceeded = deltaN > TLE_SPOOF_THRESHOLDS.DELTA_N_REV_PER_DAY;
  const mExceeded = deltaM > TLE_SPOOF_THRESHOLDS.DELTA_M_DEG;
  const elevExceeded = elevationOffset > TLE_SPOOF_THRESHOLDS.ELEVATION_OFFSET_DEG;

  if (!nExceeded && !mExceeded && !elevExceeded) return;

  const severity = (nExceeded ? 1 : 0) + (mExceeded ? 1 : 0) + (elevExceeded ? 2 : 0);
  const indicators: string[] = [];
  if (nExceeded) indicators.push(`Δn=${deltaN.toFixed(4)} rev/day (threshold ${TLE_SPOOF_THRESHOLDS.DELTA_N_REV_PER_DAY})`);
  if (mExceeded) indicators.push(`ΔM=${deltaM.toFixed(2)}° (threshold ${TLE_SPOOF_THRESHOLDS.DELTA_M_DEG}°)`);
  if (elevExceeded) indicators.push(`elevation offset=${elevationOffset.toFixed(1)}° (threshold ${TLE_SPOOF_THRESHOLDS.ELEVATION_OFFSET_DEG}°)`);

  const event = await storage.createSignalEvent({
    domain: "satellite",
    source: "tle-consistency-checker",
    eventType: "tle-spoof-detection",
    frequency: null,
    confidence: Math.min(1.0, 0.4 + severity * 0.15),
    latitude: parseFloat(KAPPA_CONSTANTS.OBSERVER_LAT.toFixed(4)),
    longitude: parseFloat(KAPPA_CONSTANTS.OBSERVER_LON.toFixed(4)),
    metadata: {
      noradId,
      satName,
      deltaN: parseFloat(deltaN.toFixed(6)),
      deltaM: parseFloat(deltaM.toFixed(4)),
      elevationOffset: parseFloat(elevationOffset.toFixed(2)),
      previousMeanMotion: prev.meanMotion,
      newMeanMotion: newFields.meanMotion,
      previousMeanAnomaly: prev.meanAnomaly,
      newMeanAnomaly: newFields.meanAnomaly,
      epochGapHours: parseFloat((epochGap / 3600000).toFixed(2)),
      previousEpoch: new Date(prev.epochTimestamp).toISOString(),
      newEpoch: new Date(newEpoch).toISOString(),
      indicators,
      thresholds: TLE_SPOOF_THRESHOLDS,
    },
    raw: `PREVIOUS TLE:\n${prev.tleLine1}\n${prev.tleLine2}\n\nNEW TLE:\n${newLine1}\n${newLine2}`,
  });

  kappaEngine.ingest(event);
  hypervisor.ingestEvent(event);

  await storage.createCorrelation({
    ruleName: "SATINTEL-SPOOF TLE Drift",
    description: `[TLE-CHECK] NORAD ${noradId} (${satName}) — ${indicators.join("; ")}`,
    severity: Math.min(5, severity + 1),
    eventIds: [event.id],
    metadata: {
      ruleId: "satintel-tle-drift",
      checker: "tle-consistency",
      noradId,
      deltaN,
      deltaM,
      elevationOffset,
      auto: true,
    },
  });

  console.log(`[TLE-CHECK] SPOOF DETECTED: NORAD ${noradId} (${satName}) — ${indicators.join("; ")}`);
}

async function collectSatellites(): Promise<number> {
  const satellite = await import("satellite.js");
  const priorityGroups = TLE_CATALOG_GROUPS.filter(g =>
    ["stations", "active", "starlink", "weather", "noaa"].includes(g.id)
  );

  let created = 0;

  for (const group of priorityGroups) {
    try {
      const ctrl = new AbortController();
      const tmo = setTimeout(() => ctrl.abort(), 15000);
      const response = await fetch(group.url, { signal: ctrl.signal });
      clearTimeout(tmo);
      if (!response.ok) continue;

      const text = await response.text();
      const lines = text.trim().split("\n").map(l => l.trim());

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

          if (!positionAndVelocity.position || typeof positionAndVelocity.position === "boolean") continue;

          const observerGd = {
            longitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LON),
            latitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LAT),
            height: KAPPA_CONSTANTS.OBSERVER_ALT,
          };

          const positionEci = positionAndVelocity.position;
          const positionEcf = satellite.eciToEcf(positionEci, gmst);
          const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

          const elevation = satellite.radiansToDegrees(lookAngles.elevation);
          const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
          const rangeSat = lookAngles.rangeSat;

          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          const satLat = satellite.radiansToDegrees(positionGd.latitude);
          const satLon = satellite.radiansToDegrees(positionGd.longitude);

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
            altitude: positionGd.height,
            category: group.category,
            passTime: elevation >= KAPPA_CONSTANTS.MIN_ELEVATION ? new Date() : null,
          });

          await checkTLEConsistency(satellite, noradId, name.trim(), line1, line2, elevation);

          if (elevation >= KAPPA_CONSTANTS.MIN_ELEVATION) {
            const event = await storage.createSignalEvent({
              domain: "satellite",
              source: "celestrak-collector",
              eventType: "overhead-pass",
              frequency: null,
              confidence: elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION ? 1.0 : 0.7,
              latitude: parseFloat(satLat.toFixed(4)),
              longitude: parseFloat(satLon.toFixed(4)),
              metadata: {
                noradId,
                name: name.trim(),
                elevation: parseFloat(elevation.toFixed(2)),
                azimuth: parseFloat(azimuth.toFixed(2)),
                range: parseFloat(rangeSat.toFixed(1)),
                category: group.category,
              },
              raw: null,
            });

            kappaEngine.ingest(event);
            hypervisor.ingestEvent(event);
            created++;
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  for (const target of PRIORITY_NORAD_IDS) {
    try {
      const tleUrl = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${target.noradId}&FORMAT=tle`;
      const pCtrl = new AbortController();
      const pTmo = setTimeout(() => pCtrl.abort(), 10000);
      const resp = await fetch(tleUrl, { signal: pCtrl.signal });
      clearTimeout(pTmo);
      if (!resp.ok) continue;
      const text = await resp.text();
      const lines = text.trim().split("\n").map(l => l.trim());
      if (lines.length < 3 || !lines[1]?.startsWith("1 ") || !lines[2]?.startsWith("2 ")) continue;

      const satrec = satellite.twoline2satrec(lines[1], lines[2]);
      const now = new Date();
      const posVel = satellite.propagate(satrec, now);
      const gmst = satellite.gstime(now);
      if (!posVel.position || typeof posVel.position === "boolean") continue;

      const observerGd = {
        longitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LON),
        latitude: satellite.degreesToRadians(KAPPA_CONSTANTS.OBSERVER_LAT),
        height: KAPPA_CONSTANTS.OBSERVER_ALT,
      };
      const posEcf = satellite.eciToEcf(posVel.position, gmst);
      const look = satellite.ecfToLookAngles(observerGd, posEcf);
      const elev = satellite.radiansToDegrees(look.elevation);
      const azim = satellite.radiansToDegrees(look.azimuth);
      const posGd = satellite.eciToGeodetic(posVel.position, gmst);

      await storage.upsertSatellite({
        satelliteName: target.name,
        noradId: target.noradId,
        tleLine1: lines[1],
        tleLine2: lines[2],
        elevation: elev,
        azimuth: azim,
        range: look.rangeSat,
        latitude: satellite.radiansToDegrees(posGd.latitude),
        longitude: satellite.radiansToDegrees(posGd.longitude),
        altitude: posGd.height,
        category: "priority-blackjack",
        passTime: elev >= KAPPA_CONSTANTS.MIN_ELEVATION ? new Date() : null,
      });

      await checkTLEConsistency(satellite, target.noradId, target.name, lines[1], lines[2], elev);

      if (elev >= KAPPA_CONSTANTS.MIN_ELEVATION) {
        const event = await storage.createSignalEvent({
          domain: "satellite",
          source: `priority-tracker-${target.program}`,
          eventType: "priority-overhead-pass",
          frequency: null,
          confidence: elev >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION ? 1.0 : 0.85,
          latitude: parseFloat(satellite.radiansToDegrees(posGd.latitude).toFixed(4)),
          longitude: parseFloat(satellite.radiansToDegrees(posGd.longitude).toFixed(4)),
          metadata: {
            noradId: target.noradId,
            name: target.name,
            program: target.program,
            elevation: parseFloat(elev.toFixed(2)),
            azimuth: parseFloat(azim.toFixed(2)),
            range: parseFloat(look.rangeSat.toFixed(1)),
            category: "priority-blackjack",
            alert: "PRIORITY TARGET OVERHEAD — SSC/CASINO/DARPA Blackjack asset",
          },
          raw: null,
        });
        kappaEngine.ingest(event);
        hypervisor.ingestEvent(event);
        created++;
        console.log(`[KAPPA] PRIORITY: ${target.name} (NORAD ${target.noradId}) overhead — elev ${elev.toFixed(1)}° az ${azim.toFixed(1)}°`);
      }
    } catch {
      continue;
    }
  }

  const allSats = await storage.getSatellites();
  const overheadCount = allSats.filter(s => s.elevation != null && s.elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION).length;
  const kleinCount = allSats.filter(s =>
    s.azimuth != null && Math.abs(s.azimuth - KAPPA_CONSTANTS.KLEIN_TWIST_DEG) <= KAPPA_CONSTANTS.KLEIN_TOLERANCE_DEG
  ).length;
  kappaEngine.updateSatelliteState(overheadCount, kleinCount);

  return created;
}

async function collectWeather(): Promise<number> {
  const pointsUrl = `https://api.weather.gov/points/${KAPPA_CONSTANTS.OBSERVER_LAT},${KAPPA_CONSTANTS.OBSERVER_LON}`;

  try {
    const pointsRes = await fetch(pointsUrl, {
      headers: { "User-Agent": "KAPPA-SIGINT", "Accept": "application/geo+json" },
    });

    let conditions = "unavailable";
    let temperature: string | null = null;
    let wind: string | null = null;

    if (pointsRes.ok) {
      const pointsData = await pointsRes.json();
      const forecastUrl = pointsData.properties?.forecast;
      if (forecastUrl) {
        const forecastRes = await fetch(forecastUrl, {
          headers: { "User-Agent": "KAPPA-SIGINT", "Accept": "application/geo+json" },
        });
        if (forecastRes.ok) {
          const forecastData = await forecastRes.json();
          const period = forecastData.properties?.periods?.[0];
          if (period) {
            conditions = period.shortForecast || "unknown";
            temperature = `${period.temperature}°${period.temperatureUnit}`;
            wind = `${period.windSpeed} ${period.windDirection}`;
          }
        }
      }
    }

    const event = await storage.createSignalEvent({
      domain: "elf",
      source: "weather-collector",
      eventType: "atmospheric-conditions",
      frequency: KAPPA_CONSTANTS.SCHUMANN_HZ,
      confidence: 0.6,
      latitude: KAPPA_CONSTANTS.OBSERVER_LAT,
      longitude: KAPPA_CONSTANTS.OBSERVER_LON,
      metadata: {
        conditions,
        temperature,
        wind,
        note: "Atmospheric state affects ELF propagation and ionospheric reflection",
      },
      raw: null,
    });

    kappaEngine.ingest(event);
    hypervisor.ingestEvent(event);
    return 1;
  } catch {
    return 0;
  }
}

async function runCollector(name: string, fn: () => Promise<number>): Promise<void> {
  const state = collectors.get(name);
  if (!state) return;

  const startMs = Date.now();
  try {
    const count = await fn();
    state.eventsCreated += count;
    state.lastRun = Date.now();

    await storage.createCollectionLog({
      collector: name,
      eventsCreated: count,
      durationMs: Date.now() - startMs,
      status: "success",
      error: null,
    });
  } catch (err: unknown) {
    state.errors++;
    state.lastRun = Date.now();

    const errorMsg = err instanceof Error ? err.message : String(err);
    await storage.createCollectionLog({
      collector: name,
      eventsCreated: 0,
      durationMs: Date.now() - startMs,
      status: "error",
      error: errorMsg,
    }).catch(() => {});

    console.error(`[collector:${name}] Error:`, errorMsg);
  }
}

export function startCollectors(): void {
  const collectorDefs: { name: string; fn: () => Promise<number>; intervalMs: number }[] = [
    { name: "flights", fn: collectFlights, intervalMs: 120_000 },
    { name: "satellites", fn: collectSatellites, intervalMs: 300_000 },
    { name: "weather", fn: collectWeather, intervalMs: 600_000 },
  ];

  for (const def of collectorDefs) {
    const state: CollectorState = {
      name: def.name,
      running: true,
      lastRun: null,
      eventsCreated: 0,
      errors: 0,
      intervalMs: def.intervalMs,
      timer: null,
    };

    collectors.set(def.name, state);

    setTimeout(() => runCollector(def.name, def.fn), 5000 + collectorDefs.indexOf(def) * 3000);

    state.timer = setInterval(() => runCollector(def.name, def.fn), def.intervalMs);
  }

  console.log("[KAPPA] Auto-collectors started: flights (2m), satellites (5m), weather (10m)");
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`[pipeline] ${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

const COLLECTOR_TIMEOUT_MS = 30_000;

export async function runAllCollectorsOnce(): Promise<{ flights: number; satellites: number; weather: number }> {
  const results = { flights: 0, satellites: 0, weather: 0 };
  try { results.flights = await withTimeout(collectFlights(), COLLECTOR_TIMEOUT_MS, "flights"); } catch (e: any) { console.error("[pipeline] flights:", e.message ?? e); }
  try { results.satellites = await withTimeout(collectSatellites(), COLLECTOR_TIMEOUT_MS, "satellites"); } catch (e: any) { console.error("[pipeline] satellites:", e.message ?? e); }
  try { results.weather = await withTimeout(collectWeather(), COLLECTOR_TIMEOUT_MS, "weather"); } catch (e: any) { console.error("[pipeline] weather:", e.message ?? e); }
  for (const [name, count] of Object.entries(results)) {
    const s = collectors.get(name);
    if (s) { s.eventsCreated += count; s.lastRun = Date.now(); }
  }
  return results;
}

export function getTLEConsistencyStatus(): {
  trackedSatellites: number;
  thresholds: typeof TLE_SPOOF_THRESHOLDS;
  history: Array<{
    noradId: number;
    meanMotion: number;
    meanAnomaly: number;
    elevation: number;
    epochTimestamp: number;
    fetchedAt: number;
  }>;
} {
  const history: Array<{
    noradId: number;
    meanMotion: number;
    meanAnomaly: number;
    elevation: number;
    epochTimestamp: number;
    fetchedAt: number;
  }> = [];
  for (const [noradId, entry] of tleHistory) {
    history.push({
      noradId,
      meanMotion: entry.meanMotion,
      meanAnomaly: entry.meanAnomaly,
      elevation: entry.elevation,
      epochTimestamp: entry.epochTimestamp,
      fetchedAt: entry.fetchedAt,
    });
  }
  return {
    trackedSatellites: tleHistory.size,
    thresholds: TLE_SPOOF_THRESHOLDS,
    history,
  };
}

export function getCollectorStatus(): Record<string, CollectorStatusType> {
  const result: Record<string, CollectorStatusType> = {};
  for (const c of collectors.values()) {
    result[c.name] = {
      name: c.name,
      running: c.running,
      lastRun: c.lastRun,
      eventsCreated: c.eventsCreated,
      errors: c.errors,
      intervalMs: c.intervalMs,
    };
  }
  return result;
}
