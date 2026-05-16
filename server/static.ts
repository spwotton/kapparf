import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
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
