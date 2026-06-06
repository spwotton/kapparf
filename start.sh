#!/bin/bash
# Production startup script.
# Strategy:
#   1. Build server binary if missing (~1-2s with esbuild).
#   2. Build Vite client if missing (~15s) — wait for completion before
#      starting the server so GET / immediately passes the startup health check.
#   Both artifacts are excluded from the Repl layer via .gitignore and must be
#   rebuilt on every cold start. Total startup fits within the 60s window.

set -e

if [ ! -f dist/index.cjs ]; then
  echo "[startup] Building server binary..."
  npx tsx script/build-server.ts
  if [ ! -f dist/index.cjs ]; then
    echo "[startup] Server build failed — cannot start"
    exit 1
  fi
  echo "[startup] Server binary ready"
fi

if [ ! -f dist/public/index.html ]; then
  echo "[startup] Building client assets (Vite)..."
  npx vite build 2>&1
  if [ ! -f dist/public/index.html ]; then
    echo "[startup] Vite build failed — starting in API-only mode"
  else
    echo "[startup] Client assets ready"
  fi
fi

echo "[startup] Starting server..."
exec node dist/index.cjs
