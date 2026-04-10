#!/bin/bash
echo "========================================="
echo "  KAPPA HARDENING SCRIPT — Echo Protocol"
echo "  $(date)"
echo "========================================="

echo "[1/8] Disabling CUPS print service..."
sudo systemctl stop cups 2>/dev/null
sudo systemctl disable cups 2>/dev/null

echo "[2/8] Masking avahi-daemon (mDNS)..."
sudo systemctl stop avahi-daemon 2>/dev/null
sudo systemctl mask avahi-daemon 2>/dev/null
sudo systemctl mask avahi-daemon.socket 2>/dev/null

echo "[3/8] Enabling UFW firewall..."
sudo ufw --force enable
sudo ufw default deny incoming

echo "[4/8] Blocking high ports (10000-65535)..."
sudo ufw deny in proto tcp to any port 10000:65535
sudo ufw deny in proto udp to any port 10000:65535

echo "[5/8] Blocking surveillance/backdoor ports..."
sudo ufw deny in proto udp to any port 161:162
sudo ufw deny in to any port 502
sudo ufw deny in to any port 7547
sudo ufw deny in to any port 4444
sudo ufw deny in proto tcp to any port 9050:9150
sudo ufw deny in proto udp to any port 9050:9150
sudo ufw deny in to any port 31337
sudo ufw deny in to any port 1080
sudo ufw deny in to any port 3128
sudo ufw deny in to any port 8080
sudo ufw deny in to any port 4443
sudo ufw deny in to any port 8443
sudo ufw deny in to any port 817
sudo ufw deny in to any port 5353
sudo ufw deny in to any port 1900

echo "[6/8] Installing VPN..."
VPN_CONNECTED=false

if command -v mullvad &> /dev/null; then
    echo "       Mullvad already installed"
else
    echo "       Installing Mullvad VPN (primary — no account, no email, no logs)..."
    wget -q https://mullvad.net/en/download/app/deb/latest -O /tmp/mullvad.deb 2>/dev/null
    if [ -f /tmp/mullvad.deb ]; then
        sudo dpkg -i /tmp/mullvad.deb 2>/dev/null
        sudo apt --fix-broken install -y 2>/dev/null
        rm -f /tmp/mullvad.deb
    else
        echo "       Mullvad download failed — will fall back to Cloudflare WARP"
    fi
fi

if command -v mullvad &> /dev/null; then
    echo "       Mullvad found — checking status..."
    MULLVAD_STATUS=$(mullvad status 2>&1 || true)
    if echo "$MULLVAD_STATUS" | grep -qi "connected"; then
        echo "       Mullvad already connected"
        VPN_CONNECTED=true
    else
        echo ""
        echo "  ================================================"
        echo "  MULLVAD SETUP — You need an account number."
        echo "  Go to: https://mullvad.net/en/account/create"
        echo "  No email needed. Just get the number."
        echo "  Then run:"
        echo "    mullvad account login YOUR_ACCOUNT_NUMBER"
        echo "    mullvad connect"
        echo "  ================================================"
        echo ""
    fi
fi

if [ "$VPN_CONNECTED" = false ]; then
    echo "       Setting up Cloudflare WARP as fallback VPN..."
    if ! command -v warp-cli &> /dev/null; then
        echo "       WARP not found — installing..."
        curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
        echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ noble main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
        sudo sed -i '/cdrom/d' /etc/apt/sources.list
        sudo apt update && sudo apt install cloudflare-warp -y
        sleep 3
    else
        echo "       WARP already installed"
    fi

    echo "[7/8] Connecting WARP VPN..."
    sudo systemctl start warp-svc 2>/dev/null
    sleep 2

    WARP_STATUS=$(warp-cli status 2>&1 || true)
    if echo "$WARP_STATUS" | grep -qi "registration missing"; then
        echo "       Registering new WARP account..."
        yes | warp-cli registration new 2>/dev/null
        sleep 2
    else
        echo "       WARP already registered"
    fi

    WARP_STATUS=$(warp-cli status 2>&1 || true)
    if echo "$WARP_STATUS" | grep -qi "disconnected"; then
        echo "       Connecting WARP tunnel..."
        warp-cli connect 2>/dev/null
        sleep 3
    elif echo "$WARP_STATUS" | grep -qi "connected"; then
        echo "       WARP already connected"
        VPN_CONNECTED=true
    else
        echo "       Attempting WARP connection..."
        warp-cli connect 2>/dev/null
        sleep 3
    fi
fi

echo "[8/8] Verifying..."
echo ""
echo "--- UFW STATUS ---"
sudo ufw status numbered
echo ""
echo "--- VPN STATUS ---"
if command -v mullvad &> /dev/null; then
    echo "Mullvad:"
    mullvad status 2>/dev/null || echo "  Not connected"
fi
if command -v warp-cli &> /dev/null; then
    echo "WARP:"
    warp-cli status 2>/dev/null || echo "  Not connected"
fi
echo ""
echo "--- YOUR PUBLIC IP (should NOT be your ISP) ---"
curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "Could not check IP"
echo ""
echo "--- NETWORK INTERFACE ---"
nmcli dev status
echo ""
echo "========================================="
echo "  HARDENING COMPLETE — You are a ghost."
echo "========================================="
echo ""
echo "  RECOMMENDED: Switch to Mullvad VPN"
echo "  https://mullvad.net — No email, no logs"
echo "  5 EUR/month, accepts cash & crypto"
echo ""
echo "  Setup: mullvad account login YOUR_NUMBER"
echo "         mullvad connect"
echo ""
echo "  If using WARP fallback and disconnected:"
echo "    warp-cli registration new"
echo "    warp-cli connect"
echo "========================================="
