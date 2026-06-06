#!/bin/bash
# Production startup script.
# Strategy:
#   1. Start Ollama local LLM server in background (if binary exists).
#   2. Build server binary if missing (~1-2s with esbuild).
#   3. Start Express server IMMEDIATELY — health check returns 200 right away.
#   4. If Vite client assets are missing, rebuild them in the BACKGROUND.
#      The SPA catch-all serves a 200 holding page (auto-refresh every 5s)
#      until dist/public/index.html appears — health checks always pass.

set -e

# ── Ollama local LLM ────────────────────────────────────────────────────────
OLLAMA_BIN="$HOME/.local/bin/ollama"
OLLAMA_LIB="$HOME/.local/lib/ollama"
if [ -f "$OLLAMA_BIN" ]; then
  export OLLAMA_MODELS="$HOME/.ollama/models"
  export OLLAMA_HOST="127.0.0.1:11434"
  export LD_LIBRARY_PATH="$OLLAMA_LIB:$LD_LIBRARY_PATH"
  echo "[startup] Starting Ollama local LLM server (deepseek-r1:1.5b ready)..."
  "$OLLAMA_BIN" serve &>/tmp/ollama.log &
  echo "[startup] Ollama started (PID $!) — localhost:11434"
else
  echo "[startup] Ollama binary not found — local LLM unavailable"
fi

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
