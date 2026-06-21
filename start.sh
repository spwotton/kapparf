#!/bin/bash
# Production startup script.
# Strategy:
#   1. Build server binary if missing (~1-2s with esbuild).
#   2. Start Express server IMMEDIATELY — health check returns 200 right away.
#   3. If Vite client assets are missing, rebuild them in the BACKGROUND.
#      The SPA catch-all serves a 200 holding page (auto-refresh every 5s)
#      until dist/public/index.html appears — health checks always pass.

set -e

# ── Server binary ────────────────────────────────────────────────────────────
if [ ! -f dist/index.cjs ]; then
  echo "[startup] Building server binary..."
  npx tsx script/build-server.ts 2>&1
  if [ ! -f dist/index.cjs ]; then
    echo "[startup] Server build failed — cannot start"
    exit 1
  fi
  echo "[startup] Server binary ready"
fi

# ── Client assets ────────────────────────────────────────────────────────────
if [ ! -f dist/public/index.html ]; then
  echo "[startup] Client assets missing — launching background Vite build..."
  (npx vite build 2>&1 && echo "[startup] Background Vite build complete") &
  echo "[startup] Server starting now — health checks will pass during build (200 holding page)"
else
  echo "[startup] Client assets ready"
fi

echo "[startup] Starting server..."
exec node dist/index.cjs
