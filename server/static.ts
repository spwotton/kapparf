import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.warn(`[static] dist/public not found — serving API-only mode until client build completes`);
    app.use("/{*path}", (_req, res) => {
      res.status(503).send(
        `<!DOCTYPE html><html><head><title>KAPPA — Starting</title>` +
        `<meta http-equiv="refresh" content="10"></head><body style="font-family:monospace;padding:2rem">` +
        `<h2>KAPPA is starting up</h2><p>Client assets are building. This page will refresh automatically.</p>` +
        `</body></html>`
      );
    });
    return;
  }

  // Serve attached_assets directly so large files work even when Vite skips copying them
  const attachedAssetsPath = path.resolve(process.cwd(), "attached_assets");
  if (fs.existsSync(attachedAssetsPath)) {
    app.use("/attached-assets", express.static(attachedAssetsPath, {
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

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  }));

  app.use("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
