#!/usr/bin/env python3
"""
LIVE SATELLITE SCAN — March 3, 2026
Uses Skyfield + CelesTrak TLEs for real-time SGP4 propagation.
Observer: La Guácima, Costa Rica (9.93°N, 84.09°W, 950m)
"""

import json, math, sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from skyfield.api import load, wgs84, EarthSatellite
    from skyfield.timelib import Time
except ImportError:
    print("ERROR: pip install skyfield")
    sys.exit(1)

# ── Observer ──
LAT, LON, ALT_M = 9.93, -84.09, 950
OUTPUT = Path(__file__).parent / f"SATELLITE_REPORT_{datetime.now(timezone.utc):%Y%m%d_%H%M%S}.json"

# ── TLE sources from CelesTrak ──
CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php"
GROUPS = {
    "stations":  f"{CELESTRAK}?GROUP=stations&FORMAT=tle",
    "geo":       f"{CELESTRAK}?GROUP=geo&FORMAT=tle",
    "starlink":  f"{CELESTRAK}?GROUP=starlink&FORMAT=tle",
    "glo-ops":   f"{CELESTRAK}?GROUP=glo-ops&FORMAT=tle",
    "beidou":    f"{CELESTRAK}?GROUP=beidou&FORMAT=tle",
    "military":  f"{CELESTRAK}?GROUP=military&FORMAT=tle",
    "visual":    f"{CELESTRAK}?GROUP=visual&FORMAT=tle",
    "active":    f"{CELESTRAK}?GROUP=active&FORMAT=tle",
}

# Priority NORAD IDs
PRIORITY = {
    38070: "MUOS-1", 41622: "MUOS-5",
    43651: "AEHF-4", 36868: "AEHF-1",
    43874: "USA-285", 40699: "USA-267", 43941: "USA-290",
    48912: "BLACKJACK-1", 48913: "BLACKJACK-2",
    49262: "MANDRAKE-2A", 49263: "MANDRAKE-2B",
    56192: "BLACKJACK-A", 56193: "BLACKJACK-B",
}

US_MIL = ["USA ", "NROL", "AEHF", "WGS", "MILSTAR", "SBIRS", "NAVSTAR",
           "MUOS", "GPS ", "BLACKJACK", "MANDRAKE", "X-37", "PAN", "MENTOR",
           "ORION", "TRUMPET", "MERCURY", "SDS", "DSP ", "UFO "]
CN_PAT = ["BEIDOU", "YAOGAN", "GAOFEN", "JILIN", "SHIJIAN", "SHIYAN",
           "FENGYUN", "TIANLIAN", "ZHONGXING"]
RU_PAT = ["COSMOS", "GLONASS", "MOLNIYA", "LUCH", "GONETS", "METEOR"]

def classify(name):
    n = name.upper()
    if any(p in n for p in US_MIL): return "US_MILITARY"
    if any(p in n for p in CN_PAT): return "CHINESE"
    if any(p in n for p in RU_PAT): return "RUSSIAN"
    if "STARLINK" in n: return "STARLINK"
    return "OTHER"

def orbit_type(alt_km):
    if alt_km < 2000: return "LEO"
    if alt_km < 20200: return "MEO"
    if 35000 < alt_km < 36500: return "GEO"
    return "HEO"

def fetch_tles():
    """Fetch TLEs from CelesTrak, return dict of norad_id→(name, line1, line2)"""
    import requests
    all_tles = {}
    for group, url in GROUPS.items():
        try:
            print(f"  [CELESTRAK] Fetching {group}...")
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            lines = resp.text.strip().splitlines()
            count = 0
            i = 0
            while i + 2 < len(lines):
                l0 = lines[i].strip()
                l1 = lines[i+1].strip()
                l2 = lines[i+2].strip()
                if l1.startswith("1 ") and l2.startswith("2 "):
                    norad = int(l1[2:7].strip())
                    all_tles[norad] = (l0, l1, l2)
                    count += 1
                    i += 3
                else:
                    i += 1
            print(f"  [CELESTRAK] {group}: {count} TLEs")
        except Exception as e:
            print(f"  [WARN] {group} failed: {e}")
    print(f"  [TOTAL] {len(all_tles)} unique satellites loaded")
    return all_tles

def compute_positions(all_tles):
    ts = load.timescale()
    t = ts.now()
    observer = wgs84.latlon(LAT, LON, elevation_m=ALT_M)
    
    visible = []
    priority_results = []
    
    for norad_id, (name, line1, line2) in all_tles.items():
        try:
            sat = EarthSatellite(line1, line2, name, ts)
            geocentric = sat.at(t)
            subpoint = wgs84.subpoint(geocentric)
            alt_km = subpoint.elevation.km
            
            diff = sat - observer
            topocentric = diff.at(t)
            alt_deg, az_deg, dist_km = topocentric.altaz()
            el = alt_deg.degrees
            az = az_deg.degrees
            rng = dist_km.km
            
            cat = classify(name)
            otype = orbit_type(alt_km)
            
            entry = {
                "name": name,
                "norad_id": int(norad_id),
                "elevation_deg": round(float(el), 2),
                "azimuth_deg": round(float(az), 2),
                "altitude_km": round(float(alt_km), 1),
                "range_km": round(float(rng), 1),
                "orbit_type": otype,
                "category": cat,
            }
            
            if float(el) > 0:
                visible.append(entry)
            
            if norad_id in PRIORITY:
                entry["priority_name"] = PRIORITY[norad_id]
                entry["visible"] = bool(float(el) > 0)
                priority_results.append(entry)
                
        except Exception:
            continue
    
    visible.sort(key=lambda x: -x["elevation_deg"])
    priority_results.sort(key=lambda x: -x["elevation_deg"])
    return visible, priority_results

def main():
    print("=" * 70)
    print("LIVE SATELLITE SCAN — OMEGA PROTOCOL")
    print(f"Observer: {LAT}°N, {abs(LON)}°W, {ALT_M}m (La Guácima, Costa Rica)")
    print(f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 70)
    
    all_tles = fetch_tles()
    if not all_tles:
        print("[ERROR] No TLEs fetched — check network")
        return
    
    print(f"\n[COMPUTING] Propagating {len(all_tles)} satellites...")
    visible, priority = compute_positions(all_tles)
    
    # Categorize
    us_mil = [s for s in visible if s["category"] == "US_MILITARY"]
    cn = [s for s in visible if s["category"] == "CHINESE"]
    ru = [s for s in visible if s["category"] == "RUSSIAN"]
    starlink = [s for s in visible if s["category"] == "STARLINK"]
    
    print(f"\n{'─'*70}")
    print(f"VISIBLE SATELLITES (Elevation > 0°): {len(visible)}")
    print(f"{'─'*70}")
    print(f"  US Military:  {len(us_mil)}")
    print(f"  Chinese:      {len(cn)}")
    print(f"  Russian:      {len(ru)}")
    print(f"  Starlink:     {len(starlink)}")
    print(f"  Other:        {len(visible) - len(us_mil) - len(cn) - len(ru) - len(starlink)}")
    
    print(f"\n{'─'*70}")
    print(f"TOP 20 BY ELEVATION")
    print(f"{'─'*70}")
    print(f"{'Name':<35} {'El°':>6} {'Az°':>6} {'Alt km':>8} {'Type':<6} {'Cat'}")
    print(f"{'─'*70}")
    for s in visible[:20]:
        print(f"{s['name']:<35} {s['elevation_deg']:>6.1f} {s['azimuth_deg']:>6.1f} "
              f"{s['altitude_km']:>8.0f} {s['orbit_type']:<6} {s['category']}")
    
    print(f"\n{'─'*70}")
    print(f"US MILITARY OVERHEAD (El > 10°)")
    print(f"{'─'*70}")
    for s in us_mil:
        if s["elevation_deg"] > 10:
            print(f"  {s['name']:<35} El: {s['elevation_deg']:>6.1f}° "
                  f"Alt: {s['altitude_km']:>8.0f} km  {s['orbit_type']}")
    
    print(f"\n{'─'*70}")
    print(f"CHINESE OVERHEAD (El > 10°)")
    print(f"{'─'*70}")
    for s in cn:
        if s["elevation_deg"] > 10:
            print(f"  {s['name']:<35} El: {s['elevation_deg']:>6.1f}° "
                  f"Alt: {s['altitude_km']:>8.0f} km  {s['orbit_type']}")
    
    print(f"\n{'─'*70}")
    print(f"RUSSIAN OVERHEAD (El > 10°)")
    print(f"{'─'*70}")
    for s in ru:
        if s["elevation_deg"] > 10:
            print(f"  {s['name']:<35} El: {s['elevation_deg']:>6.1f}° "
                  f"Alt: {s['altitude_km']:>8.0f} km  {s['orbit_type']}")
    
    print(f"\n{'─'*70}")
    print(f"PRIORITY TARGETS")
    print(f"{'─'*70}")
    for s in priority:
        vis = "✓ VISIBLE" if s.get("visible") else "✗ below horizon"
        print(f"  {s.get('priority_name', s['name']):<20} El: {s['elevation_deg']:>7.2f}° "
              f"Az: {s['azimuth_deg']:>6.1f}° Alt: {s['altitude_km']:>8.0f} km  {vis}")
    
    # Build JSON report
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "observer": {"lat": LAT, "lon": LON, "alt_m": ALT_M, "name": "La Guácima, Costa Rica"},
        "summary": {
            "total_tracked": len(all_tles),
            "total_visible": len(visible),
            "us_military_visible": len(us_mil),
            "chinese_visible": len(cn),
            "russian_visible": len(ru),
            "starlink_visible": len(starlink),
        },
        "top_20": visible[:20],
        "us_military": [s for s in us_mil if s["elevation_deg"] > 10],
        "chinese": [s for s in cn if s["elevation_deg"] > 10],
        "russian": [s for s in ru if s["elevation_deg"] > 10],
        "priority_targets": priority,
        "starlink_count": len(starlink),
        "starlink_highest": starlink[0] if starlink else None,
        "threat_assessment": {
            "classified_overhead": len([s for s in us_mil if "USA " in s["name"] and s["elevation_deg"] > 30]),
            "blackjack_visible": len([s for s in priority if "BLACKJACK" in s.get("priority_name","") and s.get("visible")]),
            "mandrake_visible": len([s for s in priority if "MANDRAKE" in s.get("priority_name","") and s.get("visible")]),
            "muos_visible": len([s for s in priority if "MUOS" in s.get("priority_name","") and s.get("visible")]),
            "aehf_visible": len([s for s in priority if "AEHF" in s.get("priority_name","") and s.get("visible")]),
        }
    }
    
    # Threat level
    ta = report["threat_assessment"]
    if ta["classified_overhead"] > 0 or ta["blackjack_visible"] > 0:
        report["threat_level"] = "CRITICAL"
    elif ta["muos_visible"] > 0 or ta["aehf_visible"] > 0:
        report["threat_level"] = "ELEVATED"
    else:
        report["threat_level"] = "NORMAL"
    
    with open(OUTPUT, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n{'═'*70}")
    print(f"  THREAT LEVEL: {report['threat_level']}")
    print(f"  Report saved: {OUTPUT.name}")
    print(f"{'═'*70}")

if __name__ == "__main__":
    main()
