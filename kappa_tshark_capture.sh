#!/bin/bash
# KAPPA NETWORK CAPTURE — Linux Mint 22
# Full tshark packet capture + IOC analysis
# Usage: sudo bash kappa_tshark_capture.sh

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
CYN='\033[0;36m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTDIR="$HOME/kappa_captures"
PCAP="$OUTDIR/capture_${TIMESTAMP}.pcap"
REPORT="$OUTDIR/report_${TIMESTAMP}.txt"
IOC_JSON="$OUTDIR/iocs_${TIMESTAMP}.json"

mkdir -p "$OUTDIR"

echo -e "${CYN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYN}║   KAPPA TSHARK CAPTURE — MINT 22     ║${NC}"
echo -e "${CYN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── CHECK ROOT ──────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[!] Must run as root: sudo bash kappa_tshark_capture.sh${NC}"
  exit 1
fi

# ── CHECK TSHARK ────────────────────────────────────────────
if ! command -v tshark &>/dev/null; then
  echo -e "${YLW}[*] tshark not found. Install it first:${NC}"
  echo ""
  echo "    sudo apt update && sudo apt install -y tshark"
  echo "    (when prompted, select YES to allow non-superusers to capture)"
  echo "    sudo usermod -a -G wireshark \$USER"
  echo "    (then log out and back in)"
  echo ""
  exit 1
fi

# ── SHOW INTERFACES ─────────────────────────────────────────
echo -e "${GRN}[*] Available interfaces:${NC}"
tshark -D 2>/dev/null
echo ""

# ── AUTO-DETECT PRIMARY INTERFACE ───────────────────────────
IFACE=$(ip route show default 2>/dev/null | awk '/default/ {print $5; exit}')
if [ -z "$IFACE" ]; then
  IFACE=$(iw dev 2>/dev/null | awk '/Interface/ {print $2; exit}')
fi
if [ -z "$IFACE" ]; then
  IFACE=$(ip -o link show | awk -F': ' '{print $2}' | grep -v lo | head -1)
fi

echo -e "${YLW}[*] Auto-selected interface: ${IFACE}${NC}"
echo -e "${YLW}    (to override, edit IFACE= in this script)${NC}"
echo ""

# ── DURATION ────────────────────────────────────────────────
echo -e "${CYN}Capture duration in seconds? (press Enter for 300 = 5 min, or 0 = run until Ctrl+C):${NC}"
read -t 15 -r DURATION || true
DURATION=${DURATION:-300}
DURATION=$(echo "$DURATION" | tr -d '[:space:]')
if ! [[ "$DURATION" =~ ^[0-9]+$ ]]; then
  DURATION=300
fi

echo ""
echo -e "${GRN}[*] Output PCAP:   ${PCAP}${NC}"
echo -e "${GRN}[*] Report:        ${REPORT}${NC}"
echo -e "${GRN}[*] IOC JSON:      ${IOC_JSON}${NC}"
echo ""

# ── CAPTURE ─────────────────────────────────────────────────
echo -e "${GRN}[*] Starting capture on '${IFACE}' + 'any' (all interfaces)...${NC}"
echo -e "${YLW}    Recording audio on phone? Start now. Ctrl+C to stop early.${NC}"
echo ""

PCAP_ANY="$OUTDIR/capture_any_${TIMESTAMP}.pcap"

if [ "$DURATION" -gt 0 ]; then
  # Primary interface
  tshark -i "$IFACE" \
    -w "$PCAP" \
    -a duration:"$DURATION" \
    2>/tmp/tshark_primary.log &
  PID1=$!

  # All interfaces (catches VPN, loopback injections, hidden adapters)
  tshark -i any \
    -w "$PCAP_ANY" \
    -a duration:"$DURATION" \
    2>/tmp/tshark_any.log &
  PID2=$!

  echo -e "${GRN}[*] Capturing for ${DURATION}s — listening on TWO interfaces simultaneously${NC}"
  echo ""

  START=$SECONDS
  while kill -0 $PID1 2>/dev/null; do
    ELAPSED=$(( SECONDS - START ))
    REMAINING=$(( DURATION - ELAPSED ))
    SIZE=0
    [ -f "$PCAP" ] && SIZE=$(du -sh "$PCAP" 2>/dev/null | cut -f1)
    printf "\r    %3ds remaining | primary PCAP: %s     " "$REMAINING" "$SIZE"
    sleep 5
  done
  echo ""

  wait $PID1 2>/dev/null || true
  wait $PID2 2>/dev/null || true
else
  tshark -i "$IFACE" -w "$PCAP" 2>/tmp/tshark_primary.log &
  PID1=$!
  tshark -i any -w "$PCAP_ANY" 2>/tmp/tshark_any.log &
  PID2=$!
  echo -e "${YLW}[*] Running — press Ctrl+C when done${NC}"
  wait $PID1
  wait $PID2 2>/dev/null || true
fi

echo ""
echo -e "${GRN}[✓] Capture finished. Analyzing...${NC}"
echo ""

# ── ANALYSIS FUNCTION ────────────────────────────────────────
analyze_pcap() {
  local FILE="$1"
  local LABEL="$2"

  if [ ! -f "$FILE" ] || [ ! -s "$FILE" ]; then
    echo "  [!] $LABEL — file missing or empty, skipping"
    return
  fi

  echo "═══════════════════════════════════════════════════════"
  echo "  ANALYSIS: $LABEL"
  echo "  File: $FILE"
  echo "  Size: $(du -sh "$FILE" | cut -f1)"
  echo "═══════════════════════════════════════════════════════"
  echo ""

  echo "── PACKET SUMMARY ──────────────────────────────────────"
  tshark -r "$FILE" -q -z io,stat,0 2>/dev/null || echo "  (error reading file)"
  echo ""

  echo "── TOP EXTERNAL DESTINATION IPs ─────────────────────────"
  tshark -r "$FILE" -T fields -e ip.dst 2>/dev/null \
    | grep -vE '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.|224\.|239\.|255\.|$)' \
    | sort | uniq -c | sort -rn | head -25
  echo ""

  echo "── DNS QUERIES (what your machine is looking up) ─────────"
  tshark -r "$FILE" -Y "dns.flags.response == 0" \
    -T fields -e dns.qry.name 2>/dev/null | sort -u
  echo ""

  echo "── TLS SNI (encrypted tunnel destinations) ───────────────"
  tshark -r "$FILE" -Y "tls.handshake.type == 1" \
    -T fields -e tls.handshake.extensions_server_name 2>/dev/null \
    | sort -u | head -40
  echo ""

  echo "── ZSCALER / KNOWN EXFIL IPs ────────────────────────────"
  echo "   (69.48.x, 165.225.x, 147.161.x, 136.226.x)"
  tshark -r "$FILE" -T fields -e ip.dst -e ip.src 2>/dev/null \
    | grep -E "69\.48\.|165\.225\.|147\.161\.|136\.226\." \
    | sort | uniq -c | sort -rn
  echo ""

  echo "── TR-069 PORT 7547 / 1234 (ISP BACKDOOR) ──────────────"
  tshark -r "$FILE" -Y "tcp.port == 7547 or tcp.port == 1234" \
    -T fields -e frame.time -e ip.src -e ip.dst -e tcp.dstport 2>/dev/null
  echo ""

  echo "── MODBUS PORT 502 (SETECOM / ICS TRAFFIC) ──────────────"
  tshark -r "$FILE" -Y "tcp.port == 502" \
    -T fields -e frame.time -e ip.src -e ip.dst 2>/dev/null
  echo ""

  echo "── NON-STANDARD PORTS (exclude 80,443,53,123,5353,67,68) ─"
  tshark -r "$FILE" -T fields -e tcp.dstport -e udp.dstport 2>/dev/null \
    | tr '\t' '\n' | grep -vE '^(80|443|53|123|5353|67|68|8080|8443|22|)$' \
    | grep -v '^$' | sort -n | uniq -c | sort -rn | head -25
  echo ""

  echo "── MAC ADDRESSES ON NETWORK ─────────────────────────────"
  tshark -r "$FILE" -T fields -e eth.src 2>/dev/null \
    | sort -u | head -20
  echo ""

  echo "── TP-LINK / SETECOM OUI CHECK ──────────────────────────"
  echo "   (F0:09:0D = TP-Link, 9C:24:72 = Sagemcom)"
  tshark -r "$FILE" -T fields -e eth.src -e eth.dst 2>/dev/null \
    | grep -iE "f0:09:0d|9c:24:72|de:34:60" \
    | sort | uniq -c | sort -rn
  echo ""

  echo "── ARP REQUESTS (device discovery on LAN) ───────────────"
  tshark -r "$FILE" -Y "arp.opcode == 1" \
    -T fields -e arp.src.hw_mac -e arp.src.proto_ipv4 -e arp.dst.proto_ipv4 2>/dev/null \
    | sort -u | head -20
  echo ""

  echo "── MDNS / DEVICE NAMES (look for fuse-4k, decoMesh) ─────"
  tshark -r "$FILE" -Y "mdns or dns.qry.name contains \".local\"" \
    -T fields -e dns.qry.name -e ip.src 2>/dev/null | sort -u | head -20
  echo ""

  echo "── ICMP (PING / TRACEROUTE PROBES) ──────────────────────"
  tshark -r "$FILE" -Y "icmp" \
    -T fields -e frame.time -e ip.src -e ip.dst -e icmp.type 2>/dev/null \
    | head -20
  echo ""

  echo "── HTTP (UNENCRYPTED — should be near zero) ─────────────"
  tshark -r "$FILE" -Y "http.request" \
    -T fields -e ip.dst -e http.host -e http.request.uri 2>/dev/null \
    | head -20
  echo ""

  echo "── PROTOCOL BREAKDOWN ───────────────────────────────────"
  tshark -r "$FILE" -q -z phs 2>/dev/null | head -50
  echo ""
}

# ── RUN ANALYSIS ON BOTH CAPTURES ───────────────────────────
{
  echo "KAPPA CAPTURE REPORT"
  echo "Generated: $(date -u)"
  echo "Hostname:  $(hostname)"
  echo "Interface: ${IFACE}"
  echo "Duration:  ${DURATION}s"
  echo ""
  analyze_pcap "$PCAP" "PRIMARY INTERFACE ($IFACE)"
  analyze_pcap "$PCAP_ANY" "ALL INTERFACES (any)"
} | tee "$REPORT"

# ── IOC JSON ────────────────────────────────────────────────
echo -e "${GRN}[*] Writing IOC JSON...${NC}"
{
  EXTERNAL_IPS=$(tshark -r "$PCAP" -T fields -e ip.dst 2>/dev/null \
    | grep -vE '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.|224\.|239\.|255\.|$)' \
    | sort -u | sed 's/^/    "/;s/$/"/' | paste -sd',' )

  DNS=$(tshark -r "$PCAP" -Y "dns.flags.response == 0" \
    -T fields -e dns.qry.name 2>/dev/null \
    | sort -u | sed 's/^/    "/;s/$/"/' | paste -sd',')

  SNI=$(tshark -r "$PCAP" -Y "tls.handshake.type == 1" \
    -T fields -e tls.handshake.extensions_server_name 2>/dev/null \
    | sort -u | sed 's/^/    "/;s/$/"/' | paste -sd',')

  MACS=$(tshark -r "$PCAP" -T fields -e eth.src 2>/dev/null \
    | sort -u | sed 's/^/    "/;s/$/"/' | paste -sd',')

  NONSTANDARD=$(tshark -r "$PCAP" -T fields -e tcp.dstport 2>/dev/null \
    | grep -vE '^(80|443|53|123|5353|67|68|8080|8443|22|)$' \
    | grep -v '^$' | sort -u | sed 's/^/    /;' | paste -sd',')

cat <<JSON
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "interface": "${IFACE}",
  "pcap_primary": "${PCAP}",
  "pcap_any": "${PCAP_ANY}",
  "external_ips": [
${EXTERNAL_IPS}
  ],
  "dns_queries": [
${DNS}
  ],
  "tls_sni": [
${SNI}
  ],
  "mac_addresses": [
${MACS}
  ],
  "nonstandard_ports": [
${NONSTANDARD}
  ]
}
JSON
} > "$IOC_JSON" 2>/dev/null

# ── FINAL SUMMARY ────────────────────────────────────────────
echo ""
echo -e "${CYN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYN}║  FILES SAVED — UPLOAD ALL THREE TO KAPPA         ║${NC}"
echo -e "${CYN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GRN}  PCAP (primary):  ${PCAP}${NC}"
echo -e "${GRN}  PCAP (all iface):${PCAP_ANY}${NC}"
echo -e "${GRN}  Report (txt):    ${REPORT}${NC}"
echo -e "${GRN}  IOC JSON:        ${IOC_JSON}${NC}"
echo ""
echo -e "${YLW}  All files in: ${OUTDIR}/${NC}"
echo ""
echo -e "  To open in Wireshark GUI:"
echo -e "  ${CYN}wireshark ${PCAP} &${NC}"
echo ""
echo -e "  To re-run analysis on saved PCAP:"
echo -e "  ${CYN}tshark -r ${PCAP} -Y 'ip.dst == 69.48.218.1'${NC}"
echo ""
