import express, { type Express } from "express";
import fs from "fs";
import path from "path";

const HOLDING_PAGE = `<!DOCTYPE html><html><head><title>KAPPA — Starting</title>` +
  `<meta http-equiv="refresh" content="5"></head>` +
  `<body style="font-family:monospace;padding:2rem;background:#0a0a0a;color:#ccc">` +
  `<h2 style="color:#fff">KAPPA is starting up</h2>` +
  `<p>Client assets are building. This page will refresh automatically every 5 seconds.</p>` +
  `</body></html>`;

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.warn(`[static] dist/public not found at startup — will serve holding page until assets are ready`);
  }

  // Serve attached_assets directly so large files work even when Vite skips copying them
  const attachedAssetsPath = path.resolve(process.cwd(), "attached_assets");
  if (fs.existsSync(attachedAssetsPath)) {
    app.use("/attached-assets", express.static(attachedAssetsPath, {
      setHeaders: (res) => { res.setHeader("Access-Control-Allow-Origin", "*"); },
    }));
  }

  // Serve forensic slides
  const forensicSlidesPath = path.resolve(process.cwd(), "public/forensic_slides");
  if (fs.existsSync(forensicSlidesPath)) {
    app.use("/forensic-slides", express.static(forensicSlidesPath, {
      setHeaders: (res) => { res.setHeader("Access-Control-Allow-Origin", "*"); },
    }));
  }

  // Serve raw capture files before SPA catch-all
  const capturesPath = path.resolve(process.cwd(), "captures");
  if (fs.existsSync(capturesPath)) {
    app.use("/captures", express.static(capturesPath, {
      setHeaders: (res) => { res.setHeader("Access-Control-Allow-Origin", "*"); },
    }));
  }

  const kiwiScreenshotsPath = path.resolve(process.cwd(), "kiwisdr_screenshots");
  if (fs.existsSync(kiwiScreenshotsPath)) {
    app.use("/kiwisdr_screenshots", express.static(kiwiScreenshotsPath, {
      setHeaders: (res) => { res.setHeader("Access-Control-Allow-Origin", "*"); },
    }));
  }

  const publicScriptsPath = path.resolve(process.cwd(), "public");
  if (fs.existsSync(publicScriptsPath)) {
    app.use("/scripts", express.static(path.join(publicScriptsPath, "scripts"), {
      setHeaders: (res, filePath) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        if (filePath.endsWith(".sh")) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
        }
      },
    }));
  }

  // Static file serving — Express will skip this middleware if distPath doesn't exist yet
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  }));

  // SPA catch-all — checks dynamically on every request so the server never
  // gets permanently stuck in holding mode if dist/public wasn't ready at startup.
  // Returns 200 (not 503) during build so Replit health checks pass immediately.
  app.use("/{*path}", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return res.status(200).send(HOLDING_PAGE);
    }
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(indexPath);
  });
}
