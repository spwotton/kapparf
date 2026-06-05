#!/bin/bash
# Production startup script.
# If dist/index.cjs is missing (cold-start without a build phase), build
# only the server binary (~6s) — skip the Vite client build so we fit
# within the platform's 60-second port-open window.
# Client assets are expected to be pre-built by the deployment build phase.

if [ ! -f dist/index.cjs ]; then
  echo "[startup] dist/index.cjs missing — building server binary only (fast path)..."
  npx tsx script/build-server.ts
  if [ ! -f dist/index.cjs ]; then
    echo "[startup] Server build failed — cannot start"
    exit 1
  fi
  echo "[startup] Server binary ready"
fi

exec node dist/index.cjs
