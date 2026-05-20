#!/bin/bash

LOG_FILE="investigation_$(date +%Y%m%d_%H%M%S).log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Linux Mint Compromise Check ==="
echo "Started at: $(date)"
echo ""

echo "--- 1. Suspicious /usr/bin/captain script ---"
if [ -f /usr/bin/captain ]; then
    echo "Contents of /usr/bin/captain:"
    cat /usr/bin/captain
    echo ""
    ls -la /usr/bin/captain
else
    echo "Not found."
fi
echo ""

echo "--- 2. Captain processes (PIDs 20808, 26109) ---"
ps aux | grep -E "captain|20808|26109" | grep -v grep
echo ""

echo "--- 3. Hidden kernel modules (COLDEYE) ---"
echo "Current modules:"
lsmod | grep -v -e "^Module" -e "^Used by"
echo ""
echo "Diff check (10 sec apart):"
sudo lsmod > /tmp/lsmod.now
sleep 10
sudo lsmod > /tmp/lsmod.after
diff /tmp/lsmod.now /tmp/lsmod.after
echo ""

echo "--- 4. Suspicious system services (xapt, gride, proxy, etc.) ---"
systemctl list-unit-files | grep -E "(xapt|gride|http|proxy|update|captain)" | grep -v "@"
echo ""

echo "--- 5. Recently modified binaries in system directories ---"
sudo find /usr/sbin /usr/bin /etc -type f -mtime -30 -exec ls -la {} \; 2>/dev/null
echo ""

echo "--- 6. Connections to Google Sheets API (C2) ---"
sudo netstat -tupn | grep -E "sheets\.googleapis\.com|:443"
sudo lsof -i :443 | grep -i google
echo ""

echo "--- 7. SoftEther VPN processes ---"
ps aux | grep -i softether | grep -v grep
echo ""

echo "--- 8. Headless Chrome / Chromium processes ---"
ps -eo pid,cmd | grep -E "chrome|chromium" | grep -E "headless|remote-debugging|--no-sandbox|--disable-gpu"
echo ""

echo "--- 9. All Chrome processes ---"
ps aux | grep -E "chrome|chromium" | grep -v grep
echo ""

echo "--- 10. Remote debugging ports (9222-9225) ---"
sudo netstat -tulpn | grep -E "9222|9223|9224|9225"
echo ""

echo "--- 11. Chrome extensions (names) ---"
find ~/.config/google-chrome -name "manifest.json" -exec grep -H '"name":' {} \; 2>/dev/null | sort
echo ""

echo "--- 12. Chrome service worker directories ---"
find ~/.config/google-chrome -name "*Service Worker*" -type d 2>/dev/null
echo ""

echo "--- 13. Firefox add-ons ---"
find ~/.mozilla/firefox -name "*.xpi" -exec ls -la {} \; 2>/dev/null
find ~/.mozilla/firefox -type f -name "addons.json" -exec cat {} \; 2>/dev/null | grep -E "id|name"
echo ""

echo "--- 14. Persistence mechanisms (cron, systemd, autostart) ---"
echo "User crontab:"
crontab -l 2>/dev/null
echo "Root crontab:"
sudo crontab -l 2>/dev/null
echo "Systemd timers:"
systemctl list-timers --all | grep -i captain
echo "Autostart entries:"
ls -la ~/.config/autostart/ 2>/dev/null
echo ""

echo "--- 15. Network connections from captain PIDs (if still running) ---"
for pid in 20808 26109; do
    if ps -p $pid > /dev/null 2>&1; then
        echo "PID $pid:"
        sudo lsof -i -P -n -p $pid 2>/dev/null
    fi
done
echo ""

echo "=== Investigation complete. Log saved to $LOG_FILE ==="
