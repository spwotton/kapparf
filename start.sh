#!/bin/bash
set -e
if [ ! -f dist/index.cjs ]; then
  echo "[startup] dist/index.cjs missing — building now..."
  npm run build
fi
exec node dist/index.cjs
