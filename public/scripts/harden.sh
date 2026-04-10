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

echo "[6/8] Installing Cloudflare WARP VPN..."
if ! command -v warp-cli &> /dev/null; then
    echo "       WARP not found — installing..."
    curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ noble main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
    sudo sed -i '/cdrom/d' /etc/apt/sources.list
    sudo apt update && sudo apt install cloudflare-warp -y
    echo "       Waiting for WARP service to start..."
    sleep 3
else
    echo "       WARP already installed"
fi

echo "[7/8] Registering & connecting WARP..."
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
else
    echo "       Attempting WARP connection..."
    warp-cli connect 2>/dev/null
    sleep 3
fi

echo "[8/8] Verifying..."
echo ""
echo "--- UFW STATUS ---"
sudo ufw status numbered
echo ""
echo "--- WARP STATUS ---"
warp-cli status 2>/dev/null || echo "WARP issue — try manually: warp-cli registration new && warp-cli connect"
echo ""
echo "--- YOUR PUBLIC IP (should be Cloudflare, not your ISP) ---"
curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "Could not check IP"
echo ""
echo "--- NETWORK INTERFACE ---"
nmcli dev status
echo ""
echo "========================================="
echo "  HARDENING COMPLETE — You are a ghost."
echo "========================================="
echo ""
echo "  If WARP shows 'Disconnected', run:"
echo "    warp-cli registration new"
echo "    warp-cli connect"
echo ""
echo "  Verify with: warp-cli status"
echo "========================================="
