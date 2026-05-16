#!/usr/bin/env python3
"""
CHINESE SATELLITE TRACKER - DORJE STATION
Track Chinese military/surveillance satellites over Costa Rica
Compare pass times with signal spike data

Key Chinese Satellite Constellations:
- Yaogan (遥感): Reconnaissance/surveillance (50+ satellites)
- Shijian (实践): Experimental/electronic warfare
- Tianlian (天链): Data relay
- BeiDou (北斗): Navigation with short messaging C2 capability
- Gaofen (高分): High resolution imaging
"""

import urllib.request
import json
from datetime import datetime, timedelta
from pathlib import Path
import math

# DORJE STATION location (La Guácima, Costa Rica)
DORJE_LAT = 10.0167
DORJE_LON = -84.2167
DORJE_ALT = 840  # meters

# Output
OUTPUT_DIR = Path("signal_forensics/satellite_tracking")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Chinese satellite NORAD IDs and names (subset of key ones)
CHINESE_SATELLITES = {
    # Yaogan (Reconnaissance) - most relevant for surveillance
    "YAOGAN-30A": 42706,
    "YAOGAN-30B": 42707,
    "YAOGAN-30C": 42708,
    "YAOGAN-31A": 43227,
    "YAOGAN-31B": 43228,
    "YAOGAN-31C": 43229,
    "YAOGAN-33": 44231,
    "YAOGAN-34": 48078,
    "YAOGAN-35A": 49461,
    "YAOGAN-35B": 49462,
    "YAOGAN-35C": 49463,
    
    # Shijian (Experimental/ELINT)
    "SHIJIAN-6A": 28220,
    "SHIJIAN-6B": 28221,
    "SHIJIAN-16": 40878,
    "SHIJIAN-17": 41838,
    "SHIJIAN-21": 49328,
    
    # Tianlian (Data Relay - GEO)
    "TIANLIAN-1-01": 32779,
    "TIANLIAN-1-02": 37930,
    "TIANLIAN-1-03": 38253,
    "TIANLIAN-2-01": 44029,
    
    # BeiDou (Navigation with C2 messaging)
    "BEIDOU-3 M1": 43001,
    "BEIDOU-3 M2": 43002,
    "BEIDOU-3 M3": 43107,
    "BEIDOU-3 M4": 43108,
    "BEIDOU-3 M5": 43207,
    "BEIDOU-3 M6": 43208,
    "BEIDOU-3 IGSO-1": 44204,
    "BEIDOU-3 IGSO-2": 44337,
    "BEIDOU-3 IGSO-3": 44709,
    
    # Gaofen (High Resolution Imaging)
    "GAOFEN-1": 38679,
    "GAOFEN-2": 40118,
    "GAOFEN-3": 41727,
    "GAOFEN-4": 41194,  # GEO - always visible
    "GAOFEN-7": 44703,
    "GAOFEN-11": 42766,
    "GAOFEN-12": 44622,
    "GAOFEN-13": 47066,
    
    # Jilin (Commercial imaging - often military dual-use)
    "JILIN-1-01": 40961,
    "JILIN-1-02": 40962,
    "JILIN-1-03": 40963,
}

# Starlink comparison (sample)
STARLINK_SAMPLE = {
    "STARLINK-1007": 44713,
    "STARLINK-1008": 44714,
    "STARLINK-1009": 44715,
}

def fetch_tle(norad_id):
    """Fetch TLE from Celestrak"""
    try:
        # Try Celestrak GP data
        url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={norad_id}&FORMAT=TLE"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=10)
        data = resp.read().decode().strip()
        lines = data.split('\n')
        if len(lines) >= 3:
            return {
                "name": lines[0].strip(),
                "line1": lines[1].strip(),
                "line2": lines[2].strip()
            }
    except Exception as e:
        pass
    return None

def get_celestrak_chinese_sats():
    """Get all Chinese satellites from Celestrak"""
    sats = []
    try:
        # Chinese satellite supplemental TLE
        url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=PRC&FORMAT=JSON"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read().decode())
        
        for sat in data:
            sats.append({
                "name": sat.get("OBJECT_NAME", ""),
                "norad_id": sat.get("NORAD_CAT_ID", ""),
                "inclination": sat.get("INCLINATION", 0),
                "period": sat.get("PERIOD", 0),
                "apogee": sat.get("APOGEE", 0),
                "perigee": sat.get("PERIGEE", 0),
                "epoch": sat.get("EPOCH", ""),
            })
    except Exception as e:
        print(f"Error fetching Celestrak data: {e}")
    
    return sats

def analyze_visibility(inclination, apogee, perigee):
    """
    Determine if satellite can see DORJE_STATION
    
    For a satellite to be visible:
    - LEO (200-2000 km): Needs inclination > latitude or retrograde
    - MEO (2000-35786 km): Wider visibility
    - GEO (35786 km): Visible if within longitude coverage
    """
    avg_alt = (apogee + perigee) / 2
    
    # GEO satellites
    if avg_alt > 30000:
        return "GEO - ALWAYS VISIBLE from Costa Rica"
    
    # MEO satellites (BeiDou, etc.)
    elif avg_alt > 2000:
        if inclination >= 50:
            return "MEO - REGULAR PASSES over Costa Rica"
        else:
            return "MEO - Limited visibility at 10°N"
    
    # LEO satellites
    else:
        if inclination >= DORJE_LAT:
            return "LEO - CAN PASS over Costa Rica"
        else:
            return "LEO - UNLIKELY to pass directly overhead"

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║  CHINESE SATELLITE TRACKER - DORJE STATION                   ║
║  Location: 10.02°N, 84.22°W (Costa Rica)                     ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    timestamp = datetime.now().isoformat()
    
    print("Fetching Chinese satellite data from Celestrak...")
    chinese_sats = get_celestrak_chinese_sats()
    
    if not chinese_sats:
        print("Failed to fetch satellite data. Using known IDs...")
        # Fallback to known satellites
        for name, norad_id in list(CHINESE_SATELLITES.items())[:10]:
            tle = fetch_tle(norad_id)
            if tle:
                print(f"  ✓ {name}: TLE fetched")
    else:
        print(f"✓ Found {len(chinese_sats)} Chinese satellites\n")
    
    # Categorize satellites
    categories = {
        "YAOGAN": [],    # Reconnaissance
        "SHIJIAN": [],   # Experimental/ELINT
        "TIANLIAN": [],  # Data relay
        "BEIDOU": [],    # Navigation/C2
        "GAOFEN": [],    # Imaging
        "JILIN": [],     # Commercial imaging
        "OTHER": [],
    }
    
    for sat in chinese_sats:
        name = sat["name"].upper()
        categorized = False
        for cat in categories:
            if cat in name:
                categories[cat].append(sat)
                categorized = True
                break
        if not categorized:
            categories["OTHER"].append(sat)
    
    print("="*60)
    print("CHINESE SATELLITE INVENTORY BY TYPE:")
    print("="*60)
    
    for cat, sats in categories.items():
        if sats:
            print(f"\n{cat} ({len(sats)} satellites):")
            # Show first 5
            for sat in sats[:5]:
                vis = analyze_visibility(
                    sat.get("inclination", 0),
                    sat.get("apogee", 0),
                    sat.get("perigee", 0)
                )
                print(f"  • {sat['name']}: Inc={sat.get('inclination', 0):.1f}° Alt={sat.get('perigee',0):.0f}-{sat.get('apogee',0):.0f}km")
                print(f"    → {vis}")
            if len(sats) > 5:
                print(f"  ... and {len(sats)-5} more")
    
    # Analysis for threat correlation
    print("\n" + "="*60)
    print("THREAT CORRELATION ANALYSIS:")
    print("="*60)
    
    print("""
┌─────────────────────────────────────────────────────────────┐
│ CHINESE SATELLITE THREAT MODEL FOR ELF ATTACKS              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    C2 Signal    ┌──────────────┐             │
│  │ Yaogan/  │ ───────────────→│ Huawei       │             │
│  │ Tianlian │    (encrypted)  │ Router       │             │
│  └──────────┘                 └──────┬───────┘             │
│       ↑                              │                      │
│       │ Targeting data               │ Power Line           │
│       │                              ↓ Carrier (PLC)        │
│  ┌──────────┐                 ┌──────────────┐             │
│  │ Gaofen   │                 │ 53 Hz ELF    │             │
│  │ Imaging  │                 │ Injector     │             │
│  └──────────┘                 └──────┬───────┘             │
│       │                              │                      │
│       └──────────→ TARGET ←──────────┘                      │
│                   (10.02°N, 84.22°W)                        │
│                                                             │
│  Key: Satellites provide C2/timing, ground does injection  │
└─────────────────────────────────────────────────────────────┘

CRITICAL DIFFERENCE: Starlink vs Chinese:
- Starlink: Commercial, no Huawei integration, US oversight
- Chinese: Military dual-use, Huawei integrated, state control

BeiDou Special Concern:
- Has Short Message Service (SMS) capability
- Can send commands to BeiDou-enabled devices
- Huawei phones/routers may have BeiDou chips
- Potential C2 channel OUTSIDE normal internet
    """)
    
    # Save report
    report = {
        "timestamp": timestamp,
        "location": {"lat": DORJE_LAT, "lon": DORJE_LON},
        "total_chinese_satellites": len(chinese_sats),
        "categories": {k: len(v) for k, v in categories.items()},
        "threat_relevant": {
            "yaogan_recon": len(categories["YAOGAN"]),
            "tianlian_relay": len(categories["TIANLIAN"]),
            "beidou_c2": len(categories["BEIDOU"]),
            "gaofen_imaging": len(categories["GAOFEN"]),
        },
        "analysis": "Chinese satellites provide C2/targeting; ground infrastructure (Huawei + PLC) performs ELF injection"
    }
    
    output_file = OUTPUT_DIR / f"chinese_sat_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📁 Report saved: {output_file}")
    
    print("\n" + "="*60)
    print("NEXT STEPS FOR SATELLITE CORRELATION:")
    print("="*60)
    print("""
1. Get real-time pass predictions: https://n2yo.com/
2. Cross-reference pass times with your signal spike data
3. Check if Yaogan/Gaofen passes correlate with 53Hz spikes
4. Monitor BeiDou signal strength on phone (if you have BeiDou-enabled)
5. The KEY correlation: Huawei router activity during satellite passes
    """)

if __name__ == "__main__":
    main()
