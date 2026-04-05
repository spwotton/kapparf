#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KAPPA LIVE MONITOR — Real-time SIGINT status from Replit
# Run: bash kappa_monitor.sh [interval_seconds]
# Default: 30s refresh
# ═══════════════════════════════════════════════════════════════
API="https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev"
INTERVAL=${1:-30}

while true; do
  clear
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║  KAPPA SIGINT MONITOR — $(date '+%H:%M:%S %Z %Y-%m-%d')        ║"
  echo "╚══════════════════════════════════════════════════════╝"

  S=$(curl -s --max-time 8 "$API/api/kappa/status" 2>/dev/null)
  T=$(curl -s --max-time 8 "$API/api/stats" 2>/dev/null)

  if [ -z "$S" ]; then
    echo "  !! KAPPA UNREACHABLE — check Replit"
    sleep "$INTERVAL"; continue
  fi

  python3 -c "
import json, sys
s = json.loads('''$S''')
t = json.loads('''$T''') if '''$T''' else {}
score = s.get('score', 0)
threat = s.get('threatLevel', '?')
ev = s.get('eventsProcessed', 0)
dev = s.get('devicesTracked', 0)
up = s.get('uptime', 0) / 3600
ew = s.get('eveningWindow', {})
sats = s.get('satOverhead', 0)
klein = s.get('kleinPasses', 0)
phi = s.get('phiHarmonics', 0)
total = t.get('totalEvents', 0)
corr = t.get('correlationCount', 0)
dc = t.get('domainCounts', {})

mark = '🔴' if score >= 60 else '🟡' if score >= 40 else '🟢'
print(f'  {mark} KAPPA Score: {score:.1f}  |  Threat: {threat}')
print(f'  Events (session): {ev:,}  |  Devices: {dev}  |  Uptime: {up:.1f}h')
if ew.get('active'):
    print(f'  ⚡ EVENING WINDOW ACTIVE — Window {ew.get(\"window\",\"?\")}')
print(f'  Sats: {sats}  |  Klein: {klein}  |  Phi: {phi}')
print()
print(f'  Total Events: {total:,}  |  Correlations: {corr:,}')
print('  Domain Breakdown:')
for k, v in sorted(dc.items(), key=lambda x: -x[1]):
    bar = '█' * min(int(v / max(dc.values()) * 25), 25) if dc.values() else ''
    print(f'    {k:12s} {v:>9,}  {bar}')

alerts = s.get('recentAlerts', [])[:5]
if alerts:
    print()
    print('  Recent Correlations:')
    for a in alerts:
        ts = a.get('timestamp','')[:19]
        rule = a.get('ruleName','')[:50]
        sev = a.get('severity', 0)
        m = '🔴' if sev >= 4 else '🟡' if sev >= 2 else '🟢'
        print(f'    {m} {ts}  {rule}')
print()
print(f'  Refresh: {$INTERVAL}s  |  Ctrl+C to stop')
"

  sleep "$INTERVAL"
done
