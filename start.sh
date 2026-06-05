#!/bin/bash
# Production startup script.
# Strategy:
#   1. Build server binary fast (~1s) if missing — fits within 60s port-open window.
#   2. Start the server immediately (serves 503 holding page if dist/public missing).
#   3. Build Vite client in background — once done, dist/public exists and app is live.

if [ ! -f dist/index.cjs ]; then
  echo "[startup] dist/index.cjs missing — building server binary only (fast path)..."
  npx tsx script/build-server.ts
  if [ ! -f dist/index.cjs ]; then
    echo "[startup] Server build failed — cannot start"
    exit 1
  fi
  echo "[startup] Server binary ready"
fi

# If client assets are also missing, build them in the background.
# The server will serve a 503 holding page until dist/public exists.
if [ ! -d dist/public ]; then
  echo "[startup] dist/public missing — launching background Vite build..."
  (npx vite build >> /tmp/vite-build.log 2>&1 && echo "[startup] Vite build complete") &
fi

exec node dist/index.cjs
