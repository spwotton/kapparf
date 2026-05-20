import { promises as fsp } from "node:fs";
import path from "node:path";
import os from "node:os";
import { logger } from "./logger.js";

export const CLIP_CACHE_DIR = path.join(os.tmpdir(), "reel-clip-cache");

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 2 * 60 * 60 * 1000;

function parseEnvMs(envVar: string, defaultMs: number): number {
  const raw = process.env[envVar];
  if (raw === undefined || raw.trim() === "") return defaultMs;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger.warn(
      { envVar, raw, fallback: defaultMs },
      `[clip-cache-sweep] invalid ${envVar} value; using default`,
    );
    return defaultMs;
  }
  return parsed;
}

export function resolveClipCacheConfig(): { ttlMs: number; intervalMs: number } {
  const ttlMs = parseEnvMs("CLIP_CACHE_TTL_MS", DEFAULT_TTL_MS);
  const intervalMs = parseEnvMs("CLIP_CACHE_SWEEP_INTERVAL_MS", DEFAULT_INTERVAL_MS);
  return { ttlMs, intervalMs };
}

export async function sweepClipCache(
  ttlMs: number = resolveClipCacheConfig().ttlMs,
  dir: string = CLIP_CACHE_DIR,
): Promise<void> {
  let entries: string[];
  try {
    entries = await fsp.readdir(dir);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    const skipped = code === "ENOENT" ? "dir-missing" : "readdir-error";
    if (code !== "ENOENT") {
      logger.warn({ dir, err, ttlMs }, "[clip-cache-sweep] could not read cache directory");
    }
    logger.info(
      { dir, scanned: 0, deleted: 0, errors: 0, ttlMs, skipped },
      "[clip-cache-sweep] sweep complete",
    );
    return;
  }

  const now = Date.now();
  let deleted = 0;
  let errors = 0;

  for (const entry of entries) {
    if (!entry.endsWith(".mp4")) continue;
    const filePath = path.join(dir, entry);
    try {
      const stat = await fsp.stat(filePath);
      const ageMs = now - stat.mtimeMs;
      if (ageMs >= ttlMs) {
        await fsp.unlink(filePath);
        deleted++;
      }
    } catch {
      errors++;
    }
  }

  logger.info(
    { dir, scanned: entries.length, deleted, errors, ttlMs },
    "[clip-cache-sweep] sweep complete",
  );
}

export function scheduleClipCacheSweep(
  intervalMs: number = resolveClipCacheConfig().intervalMs,
  ttlMs: number = resolveClipCacheConfig().ttlMs,
): NodeJS.Timeout {
  const interval = setInterval(() => {
    sweepClipCache(ttlMs).catch((err: unknown) => {
      logger.warn({ err }, "[clip-cache-sweep] periodic sweep failed");
    });
  }, intervalMs);
  interval.unref();
  return interval;
}
