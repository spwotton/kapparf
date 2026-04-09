#!/bin/bash
echo "========================================="
echo "  KAPPA HARDENING SCRIPT — Echo Protocol"
echo "  $(date)"
echo "========================================="

echo "[1/7] Disabling CUPS print service..."
sudo systemctl stop cups 2>/dev/null
sudo systemctl disable cups 2>/dev/null

echo "[2/7] Masking avahi-daemon (mDNS)..."
sudo systemctl stop avahi-daemon 2>/dev/null
sudo systemctl mask avahi-daemon 2>/dev/null
sudo systemctl mask avahi-daemon.socket 2>/dev/null

echo "[3/7] Enabling UFW firewall..."
sudo ufw --force enable
sudo ufw default deny incoming

echo "[4/7] Blocking high ports (10000-65535)..."
sudo ufw deny in proto tcp to any port 10000:65535
sudo ufw deny in proto udp to any port 10000:65535

echo "[5/7] Blocking surveillance/backdoor ports..."
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

echo "[6/7] Installing & connecting Cloudflare WARP VPN..."
if ! command -v warp-cli &> /dev/null; then
    curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ noble main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
    sudo sed -i '/cdrom/d' /etc/apt/sources.list
    sudo apt update && sudo apt install cloudflare-warp -y
fi
sleep 2
warp-cli registration new 2>/dev/null || true
warp-cli connect 2>/dev/null || true

echo "[7/7] Verifying..."
echo ""
echo "--- UFW STATUS ---"
sudo ufw status numbered
echo ""
echo "--- WARP STATUS ---"
warp-cli status 2>/dev/null || echo "WARP not yet connected — run: warp-cli registration new && warp-cli connect"
echo ""
echo "--- NETWORK INTERFACE ---"
nmcli dev status
echo ""
echo "========================================="
echo "  HARDENING COMPLETE — You are a ghost."
echo "========================================="
