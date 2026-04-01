import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";

interface FeedResult {
  feed: string;
  entries: number;
  errors: number;
  lastFetch: number;
}

interface ExternalFeedState {
  running: boolean;
  timer: ReturnType<typeof setInterval> | null;
  lastRun: number | null;
  cycleCount: number;
  results: Record<string, FeedResult>;
  totalEventsIngested: number;
}

const feedState: ExternalFeedState = {
  running: false,
  timer: null,
  lastRun: null,
  cycleCount: 0,
  results: {},
  totalEventsIngested: 0,
};

const FEED_INTERVAL_MS = 120_000;

const USGS_EARTHQUAKE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_hour.geojson";
const USGS_SIGNIFICANT_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson";

const NOAA_SWPC_MAG_URL = "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json";
const NOAA_SWPC_PLASMA_URL = "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json";
const NOAA_KINDEX_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
const NOAA_XRAY_URL = "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json";

const IRIS_QUAKE_URL = "https://service.iris.edu/fdsnws/event/1/query?format=text&starttime=-1hours&minmagnitude=2.5&latitude=9.936&longitude=-84.109&maxradius=30&orderby=time";

const GEONET_QUAKE_URL = "https://api.geonet.org.nz/quake?MMI=3";

const IONOSONDE_STATIONS = [
  { id: "jicamarca", name: "Jicamarca Peru", url: "https://lgdc.uml.edu/common/DIDBFastStationData?ursiCode=JI91J&charName=foF2&DMUF(3000)F2" },
];

const WWLLN_PROXY_URL = "https://wwlln.net/new/map/data/current.json";

const SAOPAULO_EMBRACE_URL = "https://www2.inpe.br/climaespacial/portal/tec-map-api";

async function safeFetch(url: string, timeoutMs: number = 15000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "KAPPA-SIGINT/4.20 Research" },
    });
    clearTimeout(timeout);
    return resp;
  } catch {
    return null;
  }
}

async function fetchUSGSEarthquakes(): Promise<number> {
  let ingested = 0;

  for (const url of [USGS_EARTHQUAKE_URL, USGS_SIGNIFICANT_URL]) {
    const resp = await safeFetch(url);
    if (!resp || !resp.ok) continue;

    try {
      const data = await resp.json() as any;
      if (!data?.features) continue;

      for (const feature of data.features.slice(0, 20)) {
        const props = feature.properties;
        const coords = feature.geometry?.coordinates;
        if (!props || !coords) continue;

        const [lon, lat, depth] = coords;
        const distKm = haversineKm(9.936, -84.109, lat, lon);

        const event = await storage.createSignalEvent({
          domain: "elf",
          source: "usgs-earthquake",
          eventType: "seismic-event",
          frequency: null,
          confidence: Math.min(1, (props.mag || 0) / 8),
          latitude: lat,
          longitude: lon,
          metadata: {
            magnitude: props.mag,
            magnitudeType: props.magType,
            place: props.place,
            depthKm: depth,
            distanceFromTargetKm: Math.round(distKm),
            tsunami: props.tsunami,
            felt: props.felt,
            cdi: props.cdi,
            mmi: props.mmi,
            alert: props.alert,
            status: props.status,
            url: props.url,
            time: new Date(props.time).toISOString(),
            significant: url === USGS_SIGNIFICANT_URL,
            feed: "USGS",
          },
          raw: null,
        });

        kappaEngine.ingest(event);
        hypervisor.ingestEvent(event);
        ingested++;
      }
    } catch {}
  }

  return ingested;
}

async function fetchIRISQuakes(): Promise<number> {
  const resp = await safeFetch(IRIS_QUAKE_URL);
  if (!resp || !resp.ok) return 0;

  let ingested = 0;
  try {
    const text = await resp.text();
    const lines = text.trim().split("\n").slice(1);

    for (const line of lines.slice(0, 10)) {
      const parts = line.split("|");
      if (parts.length < 10) continue;

      const [eventId, time, lat, lon, depth, , mag, magType, , region] = parts;

      const event = await storage.createSignalEvent({
        domain: "elf",
        source: "iris-fdsn",
        eventType: "seismic-event-regional",
        frequency: null,
        confidence: Math.min(1, parseFloat(mag || "0") / 8),
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        metadata: {
          eventId,
          magnitude: parseFloat(mag),
          magnitudeType: magType,
          region: region?.trim(),
          depthKm: parseFloat(depth),
          distanceFromTargetKm: Math.round(haversineKm(9.936, -84.109, parseFloat(lat), parseFloat(lon))),
          time,
          feed: "IRIS FDSN",
          radiusQuery: "30° from San José",
        },
        raw: null,
      });

      kappaEngine.ingest(event);
      hypervisor.ingestEvent(event);
      ingested++;
    }
  } catch {}

  return ingested;
}

async function fetchNOAASpaceWeather(): Promise<number> {
  let ingested = 0;

  const kResp = await safeFetch(NOAA_KINDEX_URL);
  if (kResp && kResp.ok) {
    try {
      const kData = await kResp.json() as any[];
      if (Array.isArray(kData) && kData.length > 1) {
        const latest = kData[kData.length - 1];
        const kpValue = parseFloat(latest[1] || "0");

        if (kpValue >= 0) {
          const event = await storage.createSignalEvent({
            domain: "elf",
            source: "noaa-swpc-kindex",
            eventType: "geomagnetic-kp-index",
            frequency: null,
            confidence: 0.95,
            metadata: {
              kpIndex: kpValue,
              timeTag: latest[0],
              stormLevel: kpValue >= 7 ? "G3-STRONG" : kpValue >= 5 ? "G1-MINOR" : kpValue >= 4 ? "ACTIVE" : "QUIET",
              hfPropagationImpact: kpValue >= 5 ? "DEGRADED" : kpValue >= 4 ? "MARGINAL" : "NORMAL",
              vlfPropagationImpact: kpValue >= 7 ? "ENHANCED-D-LAYER" : "NORMAL",
              feed: "NOAA SWPC",
            },
            raw: null,
          });
          kappaEngine.ingest(event);
          hypervisor.ingestEvent(event);
          ingested++;
        }
      }
    } catch {}
  }

  const xResp = await safeFetch(NOAA_XRAY_URL);
  if (xResp && xResp.ok) {
    try {
      const xData = await xResp.json() as any[];
      if (Array.isArray(xData) && xData.length > 0) {
        const latest = xData[xData.length - 1];
        const flux = latest?.flux ?? latest?.current_flux;

        if (flux && flux > 1e-7) {
          const flareClass = flux >= 1e-4 ? "X" : flux >= 1e-5 ? "M" : flux >= 1e-6 ? "C" : flux >= 1e-7 ? "B" : "A";

          const event = await storage.createSignalEvent({
            domain: "elf",
            source: "noaa-goes-xray",
            eventType: "solar-xray-flux",
            frequency: null,
            confidence: 0.9,
            metadata: {
              flux,
              flareClass,
              satellite: latest.satellite || "GOES-16",
              timeTag: latest.time_tag,
              energy: latest.energy || "0.1-0.8nm",
              hfBlackout: flareClass === "X" ? "R3+" : flareClass === "M" ? "R1-R2" : "NONE",
              vlfEnhancement: flareClass >= "C" ? "SID-POSSIBLE" : "NONE",
              feed: "NOAA GOES X-Ray",
            },
            raw: null,
          });
          kappaEngine.ingest(event);
          hypervisor.ingestEvent(event);
          ingested++;
        }
      }
    } catch {}
  }

  const magResp = await safeFetch(NOAA_SWPC_MAG_URL);
  if (magResp && magResp.ok) {
    try {
      const magData = await magResp.json() as any[];
      if (Array.isArray(magData) && magData.length > 2) {
        const latest = magData[magData.length - 1];
        const bt = parseFloat(latest[6] || "0");
        const bz = parseFloat(latest[3] || "0");

        if (bt > 0) {
          const event = await storage.createSignalEvent({
            domain: "elf",
            source: "noaa-swpc-mag",
            eventType: "solar-wind-magnetic",
            frequency: null,
            confidence: 0.9,
            metadata: {
              btNt: bt,
              bzNt: bz,
              bxNt: parseFloat(latest[1] || "0"),
              byNt: parseFloat(latest[2] || "0"),
              timeTag: latest[0],
              geoeffective: bz < -5,
              substormRisk: bz < -10 ? "HIGH" : bz < -5 ? "MODERATE" : "LOW",
              feed: "NOAA SWPC MAG",
            },
            raw: null,
          });
          kappaEngine.ingest(event);
          hypervisor.ingestEvent(event);
          ingested++;
        }
      }
    } catch {}
  }

  const plasmaResp = await safeFetch(NOAA_SWPC_PLASMA_URL);
  if (plasmaResp && plasmaResp.ok) {
    try {
      const plasmaData = await plasmaResp.json() as any[];
      if (Array.isArray(plasmaData) && plasmaData.length > 2) {
        const latest = plasmaData[plasmaData.length - 1];
        const density = parseFloat(latest[1] || "0");
        const speed = parseFloat(latest[2] || "0");
        const temp = parseFloat(latest[3] || "0");

        if (speed > 0) {
          const event = await storage.createSignalEvent({
            domain: "elf",
            source: "noaa-swpc-plasma",
            eventType: "solar-wind-plasma",
            frequency: null,
            confidence: 0.9,
            metadata: {
              densityPerCm3: density,
              speedKmS: speed,
              temperatureK: temp,
              timeTag: latest[0],
              cmeArrival: speed > 600 ? "POSSIBLE" : "UNLIKELY",
              ionosphericImpact: speed > 500 ? "ELEVATED" : "NORMAL",
              feed: "NOAA SWPC Plasma",
            },
            raw: null,
          });
          kappaEngine.ingest(event);
          hypervisor.ingestEvent(event);
          ingested++;
        }
      }
    } catch {}
  }

  return ingested;
}

async function fetchGeoNetQuakes(): Promise<number> {
  const resp = await safeFetch(GEONET_QUAKE_URL);
  if (!resp || !resp.ok) return 0;

  let ingested = 0;
  try {
    const data = await resp.json() as any;
    const features = data?.features || [];

    for (const f of features.slice(0, 5)) {
      const props = f.properties;
      const coords = f.geometry?.coordinates;
      if (!props || !coords) continue;

      const event = await storage.createSignalEvent({
        domain: "elf",
        source: "geonet-nz",
        eventType: "seismic-event-global",
        frequency: null,
        confidence: Math.min(1, (props.magnitude || 0) / 8),
        latitude: coords[1],
        longitude: coords[0],
        metadata: {
          magnitude: props.magnitude,
          depth: props.depth,
          mmi: props.mmi,
          locality: props.locality,
          quality: props.quality,
          time: props.time,
          distanceFromTargetKm: Math.round(haversineKm(9.936, -84.109, coords[1], coords[0])),
          feed: "GeoNet NZ",
        },
        raw: null,
      });
      kappaEngine.ingest(event);
      hypervisor.ingestEvent(event);
      ingested++;
    }
  } catch {}

  return ingested;
}

async function fetchPublicLightning(): Promise<number> {
  const resp = await safeFetch(WWLLN_PROXY_URL, 10000);
  if (!resp || !resp.ok) return 0;

  let ingested = 0;
  try {
    const data = await resp.json() as any[];
    if (!Array.isArray(data)) return 0;

    const nearbyStrikes = data.filter((s: any) => {
      if (!s.lat || !s.lon) return false;
      return haversineKm(9.936, -84.109, s.lat, s.lon) < 500;
    }).slice(0, 15);

    for (const strike of nearbyStrikes) {
      const event = await storage.createSignalEvent({
        domain: "elf",
        source: "wwlln-lightning",
        eventType: "lightning-strike",
        frequency: null,
        confidence: 0.7,
        latitude: strike.lat,
        longitude: strike.lon,
        metadata: {
          distanceKm: Math.round(haversineKm(9.936, -84.109, strike.lat, strike.lon)),
          time: strike.time || strike.timestamp,
          energy: strike.energy,
          feed: "WWLLN",
          elfRelevance: "Atmospheric ELF/VLF noise source — Schumann resonance exciter",
        },
        raw: null,
      });
      kappaEngine.ingest(event);
      hypervisor.ingestEvent(event);
      ingested++;
    }
  } catch {}

  return ingested;
}

async function fetchKiwiSDRPublicList(): Promise<number> {
  const resp = await safeFetch("http://kiwisdr.com/public/", 20000);
  if (!resp || !resp.ok) return 0;

  let ingested = 0;
  try {
    const html = await resp.text();
    const nodeMatches = html.matchAll(/data-url="([^"]+)"\s+data-name="([^"]+)"\s+data-lat="([^"]+)"\s+data-lon="([^"]+)"/g);

    let newNodes = 0;
    for (const match of nodeMatches) {
      const [, url, name, lat, lon] = match;
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const dist = haversineKm(9.936, -84.109, latNum, lonNum);

      if (dist < 2000) {
        const nodeId = `discovered-${name.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 30)}`;
        const exists = KIWI_NODES.some(n => n.url === url || n.id === nodeId);
        if (!exists) {
          KIWI_NODES.push({ id: nodeId, name: `${name} (discovered)`, url, lat: latNum, lon: lonNum });
          newNodes++;
        }
      }
    }

    if (newNodes > 0) {
      const event = await storage.createSignalEvent({
        domain: "sdr",
        source: "kiwisdr-discovery",
        eventType: "sdr-node-discovery",
        frequency: null,
        confidence: 0.6,
        metadata: {
          newNodesDiscovered: newNodes,
          totalNodes: KIWI_NODES.length,
          searchRadius: "2000km from San José",
          feed: "KiwiSDR Public List",
        },
        raw: null,
      });
      kappaEngine.ingest(event);
      hypervisor.ingestEvent(event);
      ingested++;
    }
  } catch {}

  return ingested;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function runFeedCycle(): Promise<void> {
  const startMs = Date.now();
  const results: Record<string, FeedResult> = {};

  const feeds: { name: string; fn: () => Promise<number> }[] = [
    { name: "usgs-earthquake", fn: fetchUSGSEarthquakes },
    { name: "iris-fdsn", fn: fetchIRISQuakes },
    { name: "noaa-space-weather", fn: fetchNOAASpaceWeather },
    { name: "geonet-nz", fn: fetchGeoNetQuakes },
    { name: "wwlln-lightning", fn: fetchPublicLightning },
    { name: "kiwisdr-discovery", fn: fetchKiwiSDRPublicList },
  ];

  let totalIngested = 0;

  for (const feed of feeds) {
    try {
      const count = await feed.fn();
      results[feed.name] = { feed: feed.name, entries: count, errors: 0, lastFetch: Date.now() };
      totalIngested += count;
    } catch (err) {
      results[feed.name] = { feed: feed.name, entries: 0, errors: 1, lastFetch: Date.now() };
    }
  }

  feedState.results = results;
  feedState.cycleCount++;
  feedState.lastRun = Date.now();
  feedState.totalEventsIngested += totalIngested;

  const durationMs = Date.now() - startMs;
  console.log(`[ExternalFeeds] Cycle #${feedState.cycleCount}: ${totalIngested} events from ${feeds.length} feeds, ${durationMs}ms`);
}

export function startExternalFeeds(): void {
  if (feedState.running) return;
  feedState.running = true;

  setTimeout(() => {
    runFeedCycle().catch(err => {
      console.error("[ExternalFeeds] Initial cycle error:", err instanceof Error ? err.message : String(err));
    });
  }, 30_000);

  feedState.timer = setInterval(() => {
    runFeedCycle().catch(err => {
      console.error("[ExternalFeeds] Cycle error:", err instanceof Error ? err.message : String(err));
    });
  }, FEED_INTERVAL_MS);

  console.log(`[KAPPA] External feeds started: USGS, IRIS, NOAA SWPC, GeoNet, WWLLN, KiwiSDR discovery | ${FEED_INTERVAL_MS / 1000}s interval`);
}

export function getExternalFeedStatus() {
  return {
    running: feedState.running,
    lastRun: feedState.lastRun,
    cycleCount: feedState.cycleCount,
    totalEventsIngested: feedState.totalEventsIngested,
    feeds: feedState.results,
    intervalMs: FEED_INTERVAL_MS,
  };
}

export { KIWI_NODES };
