#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# KAPPA LOCAL — One-shot installer for Linux Mint / Debian / Ubuntu
# Installs: Python deps, Ollama, pulls llama3.2:3b, sets up suite
# Usage: chmod +x install.sh && ./install.sh
# ─────────────────────────────────────────────────────────────────
set -e

RED='\033[0;31m'; YEL='\033[1;33m'; GRN='\033[0;32m'; CYN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'

echo -e "${CYN}${BOLD}"
echo "  ██╗  ██╗ █████╗ ██████╗ ██████╗  █████╗     ██╗      ██████╗  ██████╗ █████╗ ██╗"
echo "  ██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗    ██║     ██╔═══██╗██╔════╝██╔══██╗██║"
echo "  █████╔╝ ███████║██████╔╝██████╔╝███████║    ██║     ██║   ██║██║     ███████║██║"
echo "  ██╔═██╗ ██╔══██║██╔═══╝ ██╔═══╝ ██╔══██║    ██║     ██║   ██║██║     ██╔══██║██║"
echo "  ██║  ██╗██║  ██║██║     ██║     ██║  ██║    ███████╗╚██████╔╝╚██████╗██║  ██║███████╗"
echo "  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚═╝  ╚═╝    ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝"
echo -e "${NC}"
echo -e "${YEL}  Signal Intelligence Platform — Local Edition${NC}"
echo -e "${YEL}  Jacó Beach, Costa Rica // ciajw.com${NC}"
echo ""

log()  { echo -e "${GRN}[+]${NC} $1"; }
warn() { echo -e "${YEL}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
step() { echo -e "\n${CYN}${BOLD}── $1 ──${NC}"; }

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$INSTALL_DIR/.venv"
DATA_DIR="$INSTALL_DIR/data"
LOGS_DIR="$INSTALL_DIR/logs"
MODEL_DEFAULT="llama3.2:3b"
MODEL_EMBED="nomic-embed-text"

# ── Detect USB ─────────────────────────────────────────────────────
USB_MODE=false
if mount | grep -q "$(df "$INSTALL_DIR" | tail -1 | awk '{print $1}').*vfat\|fuseblk\|exfat"; then
    USB_MODE=true
    warn "USB filesystem detected — enabling persistence mode"
fi

# ── System packages ────────────────────────────────────────────────
step "System dependencies"
if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
        python3 python3-pip python3-venv \
        bluetooth bluez bluez-tools \
        nmap net-tools curl wget git \
        libpcap-dev build-essential \
        sqlite3 jq 2>/dev/null || warn "Some packages failed — continuing"
    log "apt packages installed"
elif command -v dnf &>/dev/null; then
    sudo dnf install -y python3 python3-pip nmap bluez curl wget sqlite 2>/dev/null || true
    log "dnf packages installed"
else
    warn "Unknown package manager — install Python3, pip, nmap, bluez manually if missing"
fi

# ── Python virtual environment ─────────────────────────────────────
step "Python virtual environment"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip -q
pip install -r "$INSTALL_DIR/requirements.txt" -q
log "Python environment ready at $VENV_DIR"

# ── Create data dirs ───────────────────────────────────────────────
mkdir -p "$DATA_DIR"/{evidence,captures,exports,ble,network,llm}
mkdir -p "$LOGS_DIR"
log "Data directories created"

# ── Ollama ─────────────────────────────────────────────────────────
step "Ollama (local LLM runtime)"
if ! command -v ollama &>/dev/null; then
    log "Downloading and installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    log "Ollama installed"
else
    log "Ollama already installed: $(ollama --version 2>/dev/null || echo 'version unknown')"
fi

# Start Ollama service if not running
if ! pgrep -x ollama &>/dev/null; then
    log "Starting Ollama service..."
    ollama serve &>/dev/null &
    sleep 3
fi

# ── Pull models ─────────────────────────────────────────────────────
step "LLM model download"
echo ""
warn "About to pull: ${MODEL_DEFAULT} (~2GB) and ${MODEL_EMBED} (~270MB)"
warn "This requires internet. Skip with Ctrl+C and run manually later:"
warn "  ollama pull ${MODEL_DEFAULT}"
warn "  ollama pull ${MODEL_EMBED}"
echo ""
read -t 10 -p "  Continue? [Y/n] " PULL_CONFIRM || PULL_CONFIRM="y"
if [[ "$PULL_CONFIRM" =~ ^[Yy]?$ ]]; then
    ollama pull "$MODEL_DEFAULT" && log "Pulled $MODEL_DEFAULT"
    ollama pull "$MODEL_EMBED"   && log "Pulled $MODEL_EMBED"
else
    warn "Skipping model pull — run manually before using LLM features"
fi

# ── make run.sh executable ─────────────────────────────────────────
chmod +x "$INSTALL_DIR/run.sh"
chmod +x "$INSTALL_DIR/kappa_local/scanner/ble_scan.sh" 2>/dev/null || true

# ── Write .env ─────────────────────────────────────────────────────
step "Configuration"
cat > "$INSTALL_DIR/.env" << ENV_EOF
KAPPA_DATA_DIR=$DATA_DIR
KAPPA_LOGS_DIR=$LOGS_DIR
KAPPA_INSTALL_DIR=$INSTALL_DIR
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=$MODEL_DEFAULT
OLLAMA_EMBED_MODEL=$MODEL_EMBED
KAPPA_WEB_PORT=7979
KAPPA_USB_MODE=$USB_MODE
ENV_EOF
log "Config written to .env"

# ── USB persistence note ───────────────────────────────────────────
if $USB_MODE; then
    echo ""
    warn "USB MODE: data written to $DATA_DIR on stick"
    warn "Do NOT use FAT32 — use ext4 or exFAT partition for write support"
fi

# ── Done ────────────────────────────────────────────────────────────
step "Installation complete"
echo ""
echo -e "${GRN}${BOLD}  To start KAPPA Local:${NC}"
echo -e "  ${CYN}./run.sh${NC}"
echo ""
echo -e "  Web dashboard → ${CYN}http://localhost:7979${NC}"
echo -e "  LLM model     → ${CYN}${MODEL_DEFAULT}${NC}"
echo -e "  Data          → ${CYN}${DATA_DIR}${NC}"
echo ""
