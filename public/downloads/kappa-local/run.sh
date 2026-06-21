#!/usr/bin/env bash
# KAPPA LOCAL — Launch script
set -e

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$INSTALL_DIR/.venv"
ENV_FILE="$INSTALL_DIR/.env"

RED='\033[0;31m'; YEL='\033[1;33m'; GRN='\033[0;32m'; CYN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}[✗]${NC} .env not found — run install.sh first"
    exit 1
fi

source "$ENV_FILE"
source "$VENV_DIR/bin/activate" 2>/dev/null || {
    echo -e "${RED}[✗]${NC} venv not found — run install.sh first"
    exit 1
}

echo -e "${CYN}${BOLD}KAPPA LOCAL${NC} — starting..."

# Ensure Ollama is running
if ! pgrep -x ollama &>/dev/null; then
    echo -e "${YEL}[!]${NC} Starting Ollama..."
    ollama serve &>/dev/null &
    sleep 2
fi

echo -e "${GRN}[+]${NC} Ollama: running"
echo -e "${GRN}[+]${NC} Model:  ${OLLAMA_MODEL}"
echo -e "${GRN}[+]${NC} Web UI: http://localhost:${KAPPA_WEB_PORT}"
echo ""

cd "$INSTALL_DIR"
python3 -m kappa_local "$@"
