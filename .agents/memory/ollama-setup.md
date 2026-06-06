---
name: Ollama local LLM setup
description: How Ollama is installed and running on this Replit; paths, deps, and model status.
---

## Installation path
- Binary: `/home/runner/.local/bin/ollama` (v0.30.6)
- Libs: `/home/runner/.local/lib/ollama/` (all .so files from the tar.zst archive)
- Models: `/home/runner/.ollama/models/`
- Model installed: `deepseek-r1:1.5b` (1.1 GB, confirmed working)

## Critical: LD_LIBRARY_PATH must be set
`llama-server` inside Ollama's lib dir needs `libstdc++.so.6`.  
It was missing from the system. Fix: symlink from the nix gcc-10 package:
```
/home/runner/.local/lib/ollama/libstdc++.so.6 → /nix/store/055bzdrski1dwqa4km1gxpcjhpn73mng-gcc-10.3.0-lib/lib/libstdc++.so
```
All other versioned `.so` symlinks (libggml.so.0, libllama.so.0, etc.) were also created manually in that directory.

Always start Ollama with:
```
export LD_LIBRARY_PATH=/home/runner/.local/lib/ollama
ollama serve &
```

## start.sh integration
`start.sh` sets `LD_LIBRARY_PATH` and starts `ollama serve` in background before the Express server.  
Ollama listens on `127.0.0.1:11434`.

## How to extract Ollama from scratch
1. Download: `curl -fsSL https://github.com/ollama/ollama/releases/download/v0.30.6/ollama-linux-amd64.tar.zst -o /tmp/ollama.tar.zst`
2. Install zstandard: `uv add zstandard`
3. Use Python to extract (zstd CLI segfaults on Replit): `python3 -c "import zstandard, tarfile, os; ...extract all to /home/runner/.local/"`
4. Create .so symlinks for versioned names
5. Symlink libstdc++ from gcc-10 nix store path

## Why 7B failed / use 1.5B
Disk quota hit at 2.9 GB during 7B pull. 1.5B fits fine.

**Why:** Replit containers have disk quotas that 4.7 GB models exceed.
**How to apply:** Always use `deepseek-r1:1.5b` as the local default; user can pull larger models manually if they clear space.
