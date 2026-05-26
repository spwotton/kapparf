#!/usr/bin/env python3
"""
Full Satellite & Network Scan — 2026-02-22
Location: 9.9535°N, 84.2908°W (Guácima, Costa Rica)
"""
import urllib.request, json, math, datetime, os, subprocess, sys

LAT, LON, ALT = 9.9535, -84.2908, 900  # meters
TIMESTAMP = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
EVIDENCE_DIR = os.path.dirname(os.path.abspath(__file__))
REPORT_FILE = os.path.join(EVIDENCE_DIR, f"sat_net_scan_report_{TIMESTAMP}.txt")

lines = []
def log(msg=""):
    print(msg)
    lines.append(msg)

def fetch_json(url, timeout=20):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Satellite-Scanner/1.0)'})
    resp = urllib.request.urlopen(req, timeout=timeout)
    return json.loads(resp.read())

log("=" * 72)
log("SATELLITE & NETWORK FORENSIC SCAN")
log(f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} CST (UTC-6)")
log(f"Location: {LAT}°N, {LON}°W — Guácima, Alajuela, Costa Rica")
log(f"Elevation: {ALT}m")
log("=" * 72)

# ── COSMO-SkyMed (Italian SAR) ──
log("\n╔══════════════════════════════════════════╗")
log("║  COSMO-SkyMed (Italian SAR Constellation)  ║")
log("╚══════════════════════════════════════════╝")

cosmo_ids = {
    31598: 'COSMO-SkyMed 1 (FM1)',
    32376: 'COSMO-SkyMed 2 (FM2)',
    33412: 'COSMO-SkyMed 3 (FM3)',
    37216: 'COSMO-SkyMed 4 (FM4)',
    47874: 'CSG-1 (2nd Generation)',
    51080: 'CSG-2 (2nd Generation)',
}

for catid, name in cosmo_ids.items():
    try:
        data = fetch_json(f'https://celestrak.org/NORAD/elements/gp.php?CATNR={catid}&FORMAT=json')
        if data:
            d = data[0]
            log(f"\n  {name} — NORAD #{catid}")
            log(f"    Inclination:   {d.get('INCLINATION')}°")
            log(f"    Period:        {d.get('PERIOD')} min")
            log(f"    RAAN:          {d.get('RA_OF_ASC_NODE')}°")
            log(f"    Eccentricity:  {d.get('ECCENTRICITY')}")
            log(f"    Mean Motion:   {d.get('MEAN_MOTION')} rev/day")
            log(f"    Epoch:         {d.get('EPOCH')}")
            log(f"    Apoapsis:      {d.get('APOAPSIS')} km")
            log(f"    Periapsis:     {d.get('PERIAPSIS')} km")
            # Check if orbit covers our latitude
            inc = float(d.get('INCLINATION', 0))
            if inc >= abs(LAT):
                log(f"    ⚠ ORBIT COVERS GUÁCIMA (Inc {inc}° >= Lat {abs(LAT)}°)")
            else:
                log(f"    ○ Does not overfly this latitude")
    except Exception as e:
        log(f"  {name}: FETCH FAILED — {e}")

# ── DARPA Blackjack / SDA Tranche ──
log("\n╔══════════════════════════════════════════╗")
log("║  DARPA Blackjack / SDA Tranche Satellites  ║")
log("╚══════════════════════════════════════════╝")

for search_term in ['BLACKJACK', 'SDA']:
    try:
        data = fetch_json(f'https://celestrak.org/NORAD/elements/gp.php?NAME={search_term}&FORMAT=json')
        if data:
            log(f"\n  '{search_term}' search: {len(data)} satellites")
            for d in data[:10]:
                name = d.get('OBJECT_NAME', '?')
                norad = d.get('NORAD_CAT_ID', '?')
                inc = d.get('INCLINATION', '?')
                period = d.get('PERIOD', '?')
                apo = d.get('APOAPSIS', '?')
                per = d.get('PERIAPSIS', '?')
                epoch = d.get('EPOCH', '?')
                log(f"    {name} (#{norad}) Inc={inc}° Per={period}min Alt={per}-{apo}km Epoch={epoch}")
                if isinstance(inc, (int, float)) and inc >= abs(LAT):
                    log(f"      ⚠ COVERS GUÁCIMA")
            if len(data) > 10:
                log(f"    ... plus {len(data)-10} more")
        else:
            log(f"\n  '{search_term}': No results")
    except Exception as e:
        log(f"  '{search_term}': {e}")

# ── Starlink ──
log("\n╔══════════════════════════════════════════╗")
log("║  Starlink Constellation                     ║")
log("╚══════════════════════════════════════════╝")

try:
    data = fetch_json('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json', timeout=45)
    log(f"\n  Total in catalog: {len(data)}")
    
    # Group by inclination band
    incs = {}
    for d in data:
        inc = round(float(d.get('INCLINATION', 0)), 0)
        incs[inc] = incs.get(inc, 0) + 1
    
    log("  Orbital shells by inclination:")
    for i in sorted(incs.keys()):
        if incs[i] > 5:
            covers = "⚠ COVERS" if i >= abs(LAT) else "  below"
            log(f"    {i:5.0f}°: {incs[i]:5d} sats  {covers}")
    
    # Count how many could overfly Guácima
    covering = sum(v for k,v in incs.items() if k >= abs(LAT))
    log(f"\n  Starlinks that can overfly Guácima: {covering}/{len(data)}")
except Exception as e:
    log(f"  Starlink fetch: {e}")

# ── Other surveillance-capable satellites ──
log("\n╔══════════════════════════════════════════╗")
log("║  Other Surveillance / Radar Satellites      ║")
log("╚══════════════════════════════════════════╝")

other_sats = {
    'SENTINEL': 'Copernicus Sentinel (EU SAR)',
    'RADARSAT': 'RADARSAT (Canadian SAR)',
    'ICEYE': 'ICEYE (Finnish SAR)',
    'CAPELLA': 'Capella Space (US SAR)',
    'SAR': 'SAR keyword search',
}

for keyword, desc in other_sats.items():
    try:
        data = fetch_json(f'https://celestrak.org/NORAD/elements/gp.php?NAME={keyword}&FORMAT=json', timeout=15)
        if data:
            covering = sum(1 for d in data if float(d.get('INCLINATION', 0)) >= abs(LAT))
            log(f"  {desc}: {len(data)} total, {covering} cover Guácima")
            for d in data[:3]:
                log(f"    {d.get('OBJECT_NAME','?')} Inc={d.get('INCLINATION','?')}° #{d.get('NORAD_CAT_ID','?')}")
            if len(data) > 3:
                log(f"    ... +{len(data)-3} more")
    except:
        log(f"  {desc}: no results or error")

# ── OneWeb ──
log("\n  OneWeb constellation:")
try:
    data = fetch_json('https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=json', timeout=30)
    covering = sum(1 for d in data if float(d.get('INCLINATION', 0)) >= abs(LAT))
    log(f"    Total: {len(data)}, covering Guácima: {covering}")
except Exception as e:
    log(f"    OneWeb: {e}")

# ── Wi-Fi scan (netsh) ──
log("\n╔══════════════════════════════════════════╗")
log("║  Wireless Network Environment               ║")
log("╚══════════════════════════════════════════╝")

try:
    result = subprocess.run(['netsh', 'wlan', 'show', 'networks', 'mode=bssid'], 
                          capture_output=True, text=True, timeout=15)
    log(result.stdout)
except Exception as e:
    log(f"  Wi-Fi scan failed: {e}")

# ── Hosts file check ──
log("\n╔══════════════════════════════════════════╗")
log("║  Hosts File Sinkhole Check                  ║")
log("╚══════════════════════════════════════════╝")

try:
    with open(r'C:\Windows\System32\drivers\etc\hosts', 'r') as f:
        hosts = f.readlines()
    sinkholed = [l.strip() for l in hosts if l.strip() and not l.strip().startswith('#') and '0.0.0.0' in l]
    log(f"  Active sinkhole entries: {len(sinkholed)}")
    for s in sinkholed:
        log(f"    {s}")
except Exception as e:
    log(f"  Hosts check: {e}")

# ── Running processes check ──
log("\n╔══════════════════════════════════════════╗")
log("║  Suspicious Process Check                   ║")
log("╚══════════════════════════════════════════╝")

try:
    result = subprocess.run(
        ['powershell', '-Command', 
         'Get-Process | Where-Object {$_.Path} | Select-Object ProcessName,Id,Path | Sort-Object ProcessName -Unique | Format-Table -AutoSize | Out-String -Width 200'],
        capture_output=True, text=True, timeout=15
    )
    log(result.stdout[:3000])
except Exception as e:
    log(f"  Process check: {e}")

# ── Save report ──
log("\n" + "=" * 72)
log(f"SCAN COMPLETE — {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
log("=" * 72)

with open(REPORT_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"\n📄 Report saved to: {REPORT_FILE}")
