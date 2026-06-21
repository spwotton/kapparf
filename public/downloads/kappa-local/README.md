# KAPPA Local — Signal Intelligence Platform (Offline Edition)

**ciajw.com · kapparf.com**  
Samuel Wotton — Jacó Beach, Costa Rica

---

## What this is

A portable, fully offline SIGINT suite that runs on Linux Mint (or any Debian/Ubuntu system)
from a USB stick. Includes:

- **BLE Scanner** — continuous Bluetooth Low Energy discovery, flags elevated TX power, suspicious UUIDs (FCF1, FEA6, DF00), camera beacons
- **Network Scanner** — subnet host discovery, port scanning, flags TR-069 / CWMP / ADB / backdoor ports  
- **Local LLM** — Ollama integration (llama3.2:3b, ~2GB) for autonomous SIGINT analysis every 5 minutes
- **Evidence DB** — SQLite with SHA-256 integrity hashing on every event
- **κ-Score Engine** — local Kappa score (0–100) computed from live BLE + network data
- **Web Dashboard** — browser UI at `http://localhost:7979` with live event feed, BLE table, network hosts, manual logging, and LLM chat

---

## Quick start

```bash
# 1. Make installer executable and run
chmod +x install.sh
./install.sh

# 2. Start the suite
./run.sh
```

Then open **http://localhost:7979** in your browser.

---

## Requirements

- Linux Mint 21+ / Ubuntu 22.04+ / Debian 12+
- Python 3.10+
- `sudo` access (for apt packages, nmap, BLE)
- Internet for initial Ollama + model download (~2.3GB total)
- After install: **fully offline**

### USB stick requirements

- **Use ext4 or exFAT partition** — FAT32 does not support Linux file permissions (`chmod`)
- Minimum 8GB free space (3GB model + 4GB data + system)
- 8GB+ RAM recommended for llama3.2:3b

---

## BLE permissions

If BLE scanning shows a permission error:

```bash
sudo setcap cap_net_raw+eip $(which python3)
# or run with sudo:
sudo ./run.sh
```

---

## Manual LLM commands

```bash
# Start Ollama separately
ollama serve

# Test the model
ollama run llama3.2:3b "Summarize BLE surveillance indicators."

# Pull a larger model if you have RAM
ollama pull mistral        # 4.1GB, better reasoning
ollama pull llama3.1:8b   # 4.7GB, excellent for analysis
```

---

## Data location

All evidence stored in `data/`:
- `data/evidence.db` — main SQLite database (SHA-256 integrity)
- `data/evidence/` — manual evidence files
- `data/captures/` — packet captures
- `logs/` — application logs

---

## Architecture

```
kappa_local/
├── __main__.py     Entry point — starts all threads + Flask
├── evidence.py     SQLite DB with SHA-256 integrity
├── ble.py          Bluetooth scanner (bleak)
├── network.py      Subnet scanner (nmap + socket fallback)
├── llm.py          Ollama integration + κ-score computation
└── web/
    ├── app.py      Flask REST API
    └── templates/
        └── index.html  Single-page dashboard
```

---

## κ-Score computation (local)

| Signal | Contribution |
|--------|-------------|
| BLE device with TX > 0 dBm | +8 pts each (max 30) |
| Suspicious UUID (FCF1/FEA6/DF00) | +6 pts each (max 20) |
| TR-069 port (7547) open on host | +15 pts |
| Other open management ports | +1.5 pts each |
| Critical/High events (last 20) | +10/+5 pts each |

Levels: NOMINAL (<30) · ELEVATED (30–50) · HIGH (50–70) · CRITICAL (70–90) · EMERGENCY (90–100)

---

## License

Evidence for personal legal and journalistic use.  
Platform: open for personal/investigative use.
