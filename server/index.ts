import express, { type Request, Response, NextFunction } from "express";
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

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const { seedDatabase } = await import("./seed");
  await seedDatabase().catch((err) => console.error("Seed error:", err));

  await registerRoutes(httpServer, app);

  const { startCollectors } = await import("./collectors");
  const { startAutoCorrelator } = await import("./auto-correlator");
  const { startKiwiSDRScanner } = await import("./kiwisdr-scanner");
  const { startNetworkWatchdog } = await import("./network-watchdog");
  const { startPipeline } = await import("./pipeline");
  const { startNetworkThreatScanner } = await import("./network-threat-scanner");
  const { hypervisor } = await import("./hypervisor");
  const { startKiwiVision } = await import("./kiwisdr-vision");
  startCollectors();
  startAutoCorrelator();
  startKiwiSDRScanner();
  startNetworkWatchdog();
  startPipeline();
  startNetworkThreatScanner();
  startKiwiVision(300_000);
  hypervisor.start();

  // Goose Gazette — automated satirical content engine
  const { startGooseScheduler } = await import("./goose-generator");
  startGooseScheduler();

  const { startHumorHypervisor } = await import("./humor-hypervisor");
  startHumorHypervisor();
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
  console.log("[KAPPA] Hypervisor auto-started — all systems 24/7");

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // Serve public/scripts/ at /scripts — must run before Vite/static catch-all in all environments
  const publicScriptsDir = path.join(process.cwd(), "public", "scripts");
  if (fs.existsSync(publicScriptsDir)) {
    app.use("/scripts", express.static(publicScriptsDir, {
      setHeaders: (res, filePath) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        if (filePath.endsWith(".sh")) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
        }
      },
    }));
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
