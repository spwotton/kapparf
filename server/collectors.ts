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
  const latMin = KAPPA_CONSTANTS.JACO_LAT - 0.5;
  const latMax = KAPPA_CONSTANTS.OBSERVER_LAT + 0.5;
  const lonMin = KAPPA_CONSTANTS.JACO_LON - 0.5;
  const lonMax = KAPPA_CONSTANTS.OBSERVER_LON + 0.5;

  const url = `https://opensky-network.org/api/states/all?lamin=${latMin}&lomin=${lonMin}&lamax=${latMax}&lomax=${lonMax}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "KAPPA-SIGINT" },
  });

  if (!response.ok) return 0;

  const data = await response.json();
  if (!data.states) return 0;

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
      metadata: {
        icao24: flight.icao24,
        callsign: flight.callsign,
        altitude: flight.altitude,
        velocity: flight.velocity,
        heading: flight.heading,
        lat: flight.latitude,
        lon: flight.longitude,
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

async function collectSatellites(): Promise<number> {
  const satellite = await import("satellite.js");
  const priorityGroups = TLE_CATALOG_GROUPS.filter(g =>
    ["stations", "active", "starlink", "weather", "noaa"].includes(g.id)
  );

  let created = 0;

  for (const group of priorityGroups) {
    try {
      const response = await fetch(group.url);
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

          if (elevation >= KAPPA_CONSTANTS.MIN_ELEVATION) {
            const event = await storage.createSignalEvent({
              domain: "satellite",
              source: "celestrak-collector",
              eventType: "overhead-pass",
              frequency: null,
              confidence: elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION ? 1.0 : 0.7,
              metadata: {
                noradId,
                name: name.trim(),
                elevation: parseFloat(elevation.toFixed(2)),
                azimuth: parseFloat(azimuth.toFixed(2)),
                range: parseFloat(rangeSat.toFixed(1)),
                lat: parseFloat(satLat.toFixed(4)),
                lon: parseFloat(satLon.toFixed(4)),
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
      metadata: {
        conditions,
        temperature,
        wind,
        lat: KAPPA_CONSTANTS.OBSERVER_LAT,
        lon: KAPPA_CONSTANTS.OBSERVER_LON,
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
    { name: "flights", fn: collectFlights, intervalMs: 60_000 },
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

  console.log("[KAPPA] Auto-collectors started: flights (60s), satellites (5m), weather (10m)");
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
