import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import fs from "fs";
import path from "path";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 12 * 60 * 60 * 1000,
  },
}));

// Public — /evidence/boom served WITHOUT auth (antenna frames, face crops for /pochote-incident)
// Must be registered at top-level BEFORE registerRoutes() so it precedes the auth-gated /evidence route
app.use("/evidence/boom", express.static(path.join(process.cwd(), "public", "evidence", "boom"), {
  setHeaders: (res) => { res.setHeader("Cache-Control", "public, max-age=3600"); },
}));

// Serve public/scripts/ at /scripts before any route or Vite catch-all, in all environments
app.get("/scripts/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(process.cwd(), "public", "scripts", filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send("Not found");
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (filename.endsWith(".sh")) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
  }
  res.sendFile(filePath);
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const SENSITIVE_API_PREFIXES = [
  "/api/research/",
  "/api/evidence",
  "/api/evidence-chain/",
  "/api/bettercap/",
  "/api/tracker/",
];

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const isSensitive = SENSITIVE_API_PREFIXES.some(p => path.startsWith(p));
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms${isSensitive ? "" : ""}`;
      log(logLine);
    }
  });

  next();
});

// Public denuncia documents + photos — no auth, registered before any route middleware
const PUBLIC_DENUNCIA: Record<string, string> = {
  "DENUNCIA_SAM_WOTTON_20260530.html": "text/html; charset=utf-8",
  "ICWPA_WOTTON_20260530.html": "text/html; charset=utf-8",
  "los_rios_rf_camouflage_0282.jpg": "image/jpeg",
  "los_rios_compound_20251021.jpg": "image/jpeg",
};
// Evidence HTML (served from public/evidence/)
app.get("/evidence/DENUNCIA_SAM_WOTTON_20260530.html", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.join(process.cwd(), "public", "evidence", "DENUNCIA_SAM_WOTTON_20260530.html"));
});
// Denuncia assets + ICWPA form (served from public/denuncia/)
Object.entries(PUBLIC_DENUNCIA).forEach(([filename, contentType]) => {
  app.get(`/denuncia/${filename}`, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", contentType);
    res.sendFile(path.join(process.cwd(), "public", "denuncia", filename));
  });
});

(async () => {
  const { seedDatabase } = await import("./seed");
  await seedDatabase().catch((err) => console.error("Seed error:", err));

  await registerRoutes(httpServer, app);

  // Serve public/evidence/ at /evidence — video & audio forensic files (auth-gated)
  const publicEvidenceDir = path.join(process.cwd(), "public", "evidence");
  if (fs.existsSync(publicEvidenceDir)) {
    app.get("/evidence/DENUNCIA_SAM_WOTTON_20260530.html", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(publicEvidenceDir, "DENUNCIA_SAM_WOTTON_20260530.html"));
    });
    // Public — boom subdir (faces, antenna frames, people frames) served without auth
    // so they load on the public /pochote-incident editorial page
    app.use("/evidence/boom", express.static(path.join(publicEvidenceDir, "boom"), {
      setHeaders: (res) => { res.setHeader("Cache-Control", "public, max-age=3600"); },
    }));
    // Public — image files (jpg/jpeg/png/gif/webp) in evidence/ served without auth
    // so article pages and forensic pages can load still images publicly
    app.use("/evidence", (req, res, next) => {
      if (/\.(jpe?g|png|gif|webp)$/i.test(req.path)) {
        return express.static(publicEvidenceDir, {
          setHeaders: (r) => { r.setHeader("Cache-Control", "public, max-age=3600"); },
        })(req, res, next);
      }
      next();
    });
    const { requireAuth: evidenceAuth } = await import("./middleware/auth");
    app.use("/evidence", evidenceAuth, express.static(publicEvidenceDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".mp4") || filePath.endsWith(".mov")) {
          res.setHeader("Content-Type", "video/mp4");
          res.setHeader("Accept-Ranges", "bytes");
        }
      },
    }));
  }

  // ── Register error handler + static serving BEFORE listen so health checks
  //    pass immediately.  Background services start AFTER the port is open.
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });

  // ── Background services — start AFTER the server is already listening ──────
  const { startCollectors } = await import("./collectors");
  const { startAutoCorrelator } = await import("./auto-correlator");
  const { startKiwiSDRScanner } = await import("./kiwisdr-scanner");
  const { startNetworkWatchdog } = await import("./network-watchdog");
  const { startPipeline } = await import("./pipeline");
  const { startNetworkThreatScanner } = await import("./network-threat-scanner");
  const { hypervisor } = await import("./hypervisor");
  startCollectors();
  startAutoCorrelator();
  startKiwiSDRScanner();
  startNetworkWatchdog();
  startPipeline();
  startNetworkThreatScanner();
  // KiwiSDR Vision requires Playwright/Chromium — only run in explicit development mode.
  // Deployment container has no PulseAudio and port 8073 is unreachable from cloud.
  if (process.env.NODE_ENV === "development") {
    const { startKiwiVision } = await import("./kiwisdr-vision");
    startKiwiVision(300_000);
  }
  hypervisor.start();

  // Goose Gazette — automated satirical content engine
  const { startGooseScheduler } = await import("./goose-generator");
  startGooseScheduler();
  const { startHumorHypervisor } = await import("./humor-hypervisor");
  startHumorHypervisor();
  const { startTicoSatireHypervisor } = await import("./tico-satire-hypervisor");
  startTicoSatireHypervisor();
  const { startComedyCorpusLoader } = await import("./comedy-corpus");
  startComedyCorpusLoader();
  const { startHervKVirus } = await import("./herv-k-virus");
  startHervKVirus();
  const { startViralityEngine } = await import("./virality-engine");
  startViralityEngine();
  const { cortexBus } = await import("./cortex-bus");
  cortexBus.init().catch(e => console.error("[CortexBus] init error:", e.message));
  const { atlantisHub } = await import("./atlantis-hub");
  atlantisHub.init().catch(e => console.error("[Atlantis] init error:", e.message));
  const { startAtlantisProbe } = await import("./atlantis-probe");
  setTimeout(startAtlantisProbe, 5000);
  const { ak7 } = await import("./ak7-hypervisor");
  ak7.start();
  const { startAtlantisSatellite } = await import("./atlantis-satellite");
  setTimeout(() => startAtlantisSatellite().catch(e => console.warn("[AtlantisSatellite]", e.message)), 8000);

  // Signal Lattice Hypervisor — κ-constrained peg-hole pattern engine
  const { initSignalLattice, startLatticeHypervisor } = await import("./signal-lattice");
  await initSignalLattice().catch(e => console.error("[Lattice] init error:", e instanceof Error ? e.message : String(e)));
  startLatticeHypervisor();

  // Gazette Intel Hypervisor — thread correlation research engine
  const { initGazetteIntel, startIntelHypervisor, ingestArticleIntel } = await import("./gazette-intel");
  await initGazetteIntel().catch(e => console.error("[GazetteIntel] init error:", e.message));
  startIntelHypervisor();
  // Ingest static investigation article intel tags into Memory Cortex
  ingestArticleIntel([
    {
      id: "drone-investigation-2026",
      body: `JACÓ, PUNTARENAS — Unmanned aerial platform DJI Mini 2 documented over residential property Calle Vista Las Palmas. Spectral analysis: 87.6–87.7 Hz motor signature in two independent recordings. No DGAC flight plan filed. KAPPA scores 49–60 ELEVATED during hover windows. 29 satellite correlation events logged. Phi-harmonic ELF correlations at 119-second intervals. Platform operating from Hotel Pochote Grande construction crane, 8 meters elevation.`,
      _intel: {
        threads: ["drone-jaco"],
        entities: { places: ["jaco-cr", "calle-vista-las-palmas", "hotel-pochote-grande"] },
        themes: ["rf-surveillance", "drone-activity", "unauthorized-airspace", "spectral-signature"],
        research_seeds: ["DJI Mini 2 87.6 Hz motor acoustic signature surveillance Costa Rica 2026", "drone spectral FFT 87.7 Hz hover dual independent recording KAPPA elevated"],
        priority: "HIGH", classification: "SIGINT",
      },
    },
    {
      id: "wotton-geodetic",
      body: `PARK CITY, UTAH / MEXICO CITY — USC Marshall 2014 graduate. Sundance Film Festival 11-day annual employment. 400+ US National Park geodetic surveys, no institutional record. Amazon Seattle, Warner Bros Records Melbourne — no subsequent role either city. Solo trips Ecuador 2024 (armed conflict zone decree), Guatemala (Level 2 State Dept advisory organized crime corridors), Mexico City 2026. Planned solo ascent Iztaccíhuatl 5,230m — guides required, undocumented. Last contact: read receipt. Most recent post: clouds. Elon Musk USC 2014 commencement keynote.`,
      _intel: {
        threads: ["geodetic-corridor"],
        entities: { places: ["park-city-utah", "mexico-city", "ecuador", "guatemala", "iztaccihuatl"], businesses: ["sundance-film-festival", "amazon", "warner-bros-records"] },
        themes: ["unexplained-funding", "cover-travel", "geodetic-terrain-mapping", "drug-corridor-geography", "communication-blackout"],
        research_seeds: ["geodetic survey national park 400 unauthorized terrain mapping route intelligence", "Ecuador Guatemala Mexico solo travel drug corridor State Dept advisory 2024 2026", "Iztaccihuatl Mexico City cartel territory solo ascent undocumented 2026"],
        priority: "HIGH", classification: "HUMINT",
      },
    },
    {
      id: "st-johns-thread",
      body: `ST. JOHN, USVI — Shades of Blue Charters, Cruz Bay. World Cat 320CC twin 300hp Suzuki = 600hp total. Standard snorkeling: 80–120hp required. USCG Response Boat-Medium interceptor: twin 225hp. Charter vessel has 75hp per side MORE than USCG pursuit craft. Marine engineers: not standard charter tourism, associated with vessel categories declined to name. Operator: best man to decorated Afghanistan veteran, two tours 2010-2011, Quantico sniper training. Veteran: Stoughton MA, Kenworth trucking sales, no prior industry experience to shop floor to sales — timeline colleagues describe as compressed. Both describe BVI arrangement as coincidental. Veteran unresponsive since parent death November. 600hp. The ride was smooth.`,
      _intel: {
        threads: ["maritime-bvi", "veteran-network"],
        entities: { places: ["st-john-usvi", "bvi", "stoughton-ma", "helmand-af"], businesses: ["shades-of-blue-charters"] },
        themes: ["go-fast-vessel", "drug-corridor", "cover-business", "power-discrepancy", "veteran-skills", "career-anomaly"],
        research_seeds: ["World Cat 320CC 600hp charter go-fast BVI Caribbean USCG pursuit performance", "Afghanistan Helmand veteran sniper logistics Kenworth compressed career USVI"],
        priority: "HIGH", classification: "SIGINT",
      },
    },
    {
      id: "los-rios-parcels",
      body: `LOS RÍOS, PUNTARENAS — 14 parcels transferred January 2024–June 2025. Entities: 2–3 initials + Inversiones SA or Gestión SRL. All: same Escazú street address, same registered agent. Total: 4.2 hectares along secondary road network Route 34 to eastern agricultural boundary. 9 of 14: rezoning consultations filed same window. 6: preliminary approvals mixed residential-commercial. Beneficial owner: unidentifiable through public filings for any of 14. One adjacent owner received offer from entity not in public registry. She described offer as reasonable, which she described as part of what made it feel off.`,
      _intel: {
        threads: ["property-network"],
        entities: { places: ["los-rios-cr", "escazu-cr"] },
        themes: ["property-laundering", "shell-company", "agent-clustering", "beneficial-owner-concealment"],
        research_seeds: ["Los Rios Costa Rica 14 parcels same registered agent Escazu shell company Inversiones Gestión 18 months"],
        priority: "MEDIUM", classification: "FINANCIAL",
      },
    },
    {
      id: "scott-ryan-profile",
      body: `JACÓ, PUNTARENAS — Florida-born expat, several decades residence. Occupation: independent. Schedule: whatever makes sense. Observer reports: considerably more structured. Same general window each morning, same spot. Not a tourist. Well-connected across multiple unrelated social circles — introduced via three separate mutual acquaintances, each believing they were primary connection. Long-term residents of Jacó tend to be known and legible. He is known but not legible. Most complete characterization available: he's just around. Not charged. Not accused. Nonetheless the subject of this article.`,
      _intel: {
        threads: ["expat-jurisdiction"],
        entities: { places: ["jaco-cr"], descriptors: ["florida-expat", "long-term-resident"] },
        themes: ["jurisdiction-shopping", "social-network-anomaly", "unexplained-income"],
        research_seeds: ["Florida US expat decades Jaco Costa Rica unexplained income regimented undisclosed schedule social network anomaly"],
        priority: "MEDIUM", classification: "HUMINT",
      },
    },
  ]).catch(e => console.error("[GazetteIntel] article ingestion error:", e.message));

  // Seed manually authored field-discovery articles (idempotent)
  const { seedFieldDiscoveryArticles } = await import("./goose-seeds");
  seedFieldDiscoveryArticles().catch(e => console.error("[GOOSE:SEED] error:", e.message));

  // FTM — Follow the Money Entity Lattice Hypervisor
  const { startFtmHypervisor } = await import("./lib/ftm/ftmHypervisor");
  setTimeout(() => startFtmHypervisor().catch(e => console.warn("[FTM] startup error:", e.message)), 12_000);

  // Liquid Cortex — start background polling from KAPPA event stream
  const { liquidCortex } = await import("./liquid-cortex");
  const { storage: lcStorage } = await import("./storage");
  liquidCortex.startPolling(async () => {
    const evts = await lcStorage.getSignalEventsByWindow(60);
    return evts.map(e => ({
      frequency: e.frequency,
      domain: e.domain,
      confidence: e.confidence ?? 0.5,
      timestamp: new Date(e.timestamp).getTime(),
    }));
  });

  console.log("[KAPPA] Hypervisor auto-started — all systems 24/7");
})();
