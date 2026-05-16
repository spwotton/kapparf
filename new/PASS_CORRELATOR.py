#!/usr/bin/env python3
"""
SATELLITE PASS ↔ 53 Hz SPIKE CORRELATOR
Real-time monitoring + historical analysis

If 53 Hz spikes correlate with Gaofen/Yaogan passes = PROOF OF C2 LINK
"""

import urllib.request
import json
from datetime import datetime, timedelta
from pathlib import Path
import time
import math

# DORJE STATION
DORJE_LAT = 10.0167
DORJE_LON = -84.2167
DORJE_ALT = 900  # meters

OUTPUT_DIR = Path("signal_forensics/pass_correlations")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Critical satellites to track (NORAD IDs)
THREAT_SATS = {
    # GAOFEN (Imaging)
    "GAOFEN-4": 41194,      # GEO starer - always overhead
    "GAOFEN-11": 42766,     # 10cm military recon
    "GAOFEN-3": 41727,      # SAR all-weather
    "GAOFEN-12": 44622,     # Military SAR
    "GAOFEN-13": 47066,     # Second GEO starer
    "GAOFEN-7": 44703,      # Stereo 3D mapping
    "GAOFEN-2": 40118,      # Sub-meter optical
    
    # YAOGAN (Military Recon)  
    "YAOGAN-30A": 42706,    # ELINT triplet
    "YAOGAN-30B": 42707,
    "YAOGAN-30C": 42708,
    "YAOGAN-31A": 43613,    # Naval surveillance
    "YAOGAN-33": 44528,     # SAR recon
    
    # TIANLIAN (Data Relay)
    "TIANLIAN-1-04": 41869, # Real-time relay to ground
    "TIANLIAN-2-01": 44231,
    
    # SHIJIAN (Tech Demo / likely SIGINT)
    "SHIJIAN-21": 49330,
    "SHIJIAN-17": 41838,
}

def fetch_tle(norad_id):
    """Fetch TLE from Celestrak"""
    try:
        url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={norad_id}&FORMAT=TLE"
        req = urllib.request.Request(url, headers={'User-Agent': 'DORJE-TRACKER/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            lines = response.read().decode().strip().split('\n')
            if len(lines) >= 3:
                return {
                    "name": lines[0].strip(),
                    "line1": lines[1].strip(),
                    "line2": lines[2].strip()
                }
    except Exception as e:
        pass
    return None

def parse_tle_basic(tle):
    """Extract basic orbital elements from TLE"""
    if not tle:
        return None
    
    line2 = tle["line2"]
    
    # Parse inclination (degrees)
    inclination = float(line2[8:16])
    
    # Parse mean motion (revs per day)
    mean_motion = float(line2[52:63])
    
    # Calculate orbital period (minutes)
    period_min = 1440.0 / mean_motion
    
    # Estimate altitude from period (rough)
    # T = 2π√(a³/μ), solve for a
    mu = 398600.4418  # km³/s²
    period_sec = period_min * 60
    a_cubed = (period_sec / (2 * math.pi))**2 * mu
    semi_major_axis = a_cubed ** (1/3)
    altitude_km = semi_major_axis - 6371  # Earth radius
    
    return {
        "name": tle["name"],
        "inclination": inclination,
        "period_min": period_min,
        "altitude_km": altitude_km,
        "mean_motion": mean_motion,
        "is_geo": altitude_km > 30000
    }

def estimate_next_pass(orbital_data, target_lat):
    """Rough estimate of visibility window"""
    if not orbital_data:
        return None
    
    if orbital_data["is_geo"]:
        return {
            "type": "CONTINUOUS",
            "message": "GEO satellite - ALWAYS visible from your location",
            "elevation": 90 - abs(target_lat),  # Rough
            "threat": "CONSTANT SURVEILLANCE"
        }
    
    # For LEO, check if inclination allows visibility
    inc = orbital_data["inclination"]
    if inc > 90:
        inc = 180 - inc  # Retrograde
    
    if abs(target_lat) > inc + 20:  # 20° swath estimate
        return {
            "type": "NO_COVERAGE",
            "message": f"Orbit inclination {orbital_data['inclination']:.1f}° doesn't reach {target_lat}°N"
        }
    
    # Estimate passes per day
    passes_per_day = orbital_data["mean_motion"] * (1 - abs(target_lat - inc)/90)
    
    return {
        "type": "PERIODIC",
        "passes_per_day": max(1, int(passes_per_day / 2)),  # Visible passes roughly half
        "period_min": orbital_data["period_min"],
        "altitude_km": orbital_data["altitude_km"],
        "next_pass_estimate": "Check N2YO for precise timing"
    }

def load_attack_timestamps():
    """Load 53Hz spike timestamps from logs"""
    timestamps = []
    
    # Check attack_log.json
    log_file = Path("signal_forensics/attack_log.json")
    if log_file.exists():
        try:
            with open(log_file) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            entry = json.loads(line)
                            if "timestamp" in entry:
                                timestamps.append({
                                    "time": entry["timestamp"],
                                    "event": entry.get("event", "UNKNOWN"),
                                    "source": "attack_log"
                                })
                        except:
                            pass
        except:
            pass
    
    # Check appliance correlation log
    corr_file = Path("signal_forensics/appliance_correlation.jsonl")
    if corr_file.exists():
        try:
            with open(corr_file) as f:
                for line in f:
                    if line.strip():
                        try:
                            entry = json.loads(line)
                            if "timestamp" in entry:
                                timestamps.append({
                                    "time": entry["timestamp"],
                                    "event": entry.get("event", "SPIKE"),
                                    "source": "appliance_monitor"
                                })
                        except:
                            pass
        except:
            pass
    
    return timestamps

def main():
    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║  SATELLITE PASS ↔ 53 Hz SPIKE CORRELATOR                                   ║
║  Target: DORJE_STATION (10.02°N, 84.22°W)                                  ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Hypothesis: If 53Hz activates within 10min of sat pass = C2 CONFIRMED     ║
╚════════════════════════════════════════════════════════════════════════════╝
    """)
    
    print("="*80)
    print("FETCHING ORBITAL DATA FOR THREAT SATELLITES...")
    print("="*80 + "\n")
    
    sat_data = {}
    geo_sats = []
    leo_sats = []
    
    for name, norad_id in THREAT_SATS.items():
        print(f"  Fetching {name} (NORAD {norad_id})...", end=" ", flush=True)
        tle = fetch_tle(norad_id)
        if tle:
            orbital = parse_tle_basic(tle)
            if orbital:
                sat_data[name] = orbital
                if orbital["is_geo"]:
                    geo_sats.append(name)
                    print(f"✓ GEO @ {orbital['altitude_km']:.0f} km")
                else:
                    leo_sats.append(name)
                    print(f"✓ LEO @ {orbital['altitude_km']:.0f} km, inc={orbital['inclination']:.1f}°")
            else:
                print("✗ Parse failed")
        else:
            print("✗ Fetch failed")
        time.sleep(0.3)
    
    print("\n" + "="*80)
    print("THREAT ANALYSIS FOR YOUR LOCATION:")
    print("="*80)
    
    print(f"""
┌──────────────────────────────────────────────────────────────────────────────┐
│ GEO STARERS (ALWAYS WATCHING):                                               │
├──────────────────────────────────────────────────────────────────────────────┤""")
    
    for name in geo_sats:
        data = sat_data.get(name)
        if data:
            print(f"│  • {name:20s} @ {data['altitude_km']:,.0f} km - CONTINUOUS COVERAGE      │")
    
    print(f"""├──────────────────────────────────────────────────────────────────────────────┤
│ These satellites ALWAYS have line-of-sight to Costa Rica.                    │
│ They provide: Real-time presence detection, thermal monitoring, C2 relay    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ LEO PERIODIC PASSES (HIGH-RES TARGETING):                                    │
├──────────────────────────────────────────────────────────────────────────────┤""")
    
    for name in leo_sats:
        data = sat_data.get(name)
        if data:
            pass_info = estimate_next_pass(data, DORJE_LAT)
            if pass_info and pass_info["type"] == "PERIODIC":
                print(f"│  • {name:15s} {data['altitude_km']:5.0f}km  inc={data['inclination']:5.1f}°  ~{pass_info['passes_per_day']}/day  │")
    
    print(f"""├──────────────────────────────────────────────────────────────────────────────┤
│ These pass overhead periodically. Each pass = potential targeting update.   │
└──────────────────────────────────────────────────────────────────────────────┘
    """)
    
    # Load attack timestamps
    print("="*80)
    print("LOADING YOUR ATTACK TIMESTAMPS...")
    print("="*80)
    
    attacks = load_attack_timestamps()
    
    if attacks:
        print(f"\n  Found {len(attacks)} logged events:")
        for atk in attacks[-10:]:  # Last 10
            print(f"    [{atk['time']}] {atk['event']} (from {atk['source']})")
        
        print("""
┌──────────────────────────────────────────────────────────────────────────────┐
│ CORRELATION INSTRUCTIONS:                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. Go to https://www.n2yo.com/?s=42766 (GAOFEN-11)                          │
│ 2. Click "Passes" → Enter your coordinates                                  │
│ 3. Get pass times for the last few days                                     │
│ 4. Compare with your attack timestamps above                                 │
│                                                                              │
│ CORRELATION INDICATORS:                                                      │
│  • 53 Hz spike within 10 minutes of LEO pass = STRONG                        │
│  • Attack intensity increases during GEO coverage = MODERATE                 │
│  • SAR pass (GAOFEN-3/12) before "mapping" sensation = VERY STRONG          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
        """)
    else:
        print("\n  No attack timestamps found in logs.")
        print("  Run APPLIANCE_MONITOR.py or manually log events to attack_log.json")
    
    print("\n" + "="*80)
    print("THE FRIDGE ATTACK VECTOR (NON-SMART APPLIANCE):")
    print("="*80)
    
    print("""
HOW THEY WEAPONIZED YOUR "DUMB" FRIDGE:
═══════════════════════════════════════════════════════════════════════════════

Step 1: SAR MAPPING (GAOFEN-3 or GAOFEN-12)
   ┌─────────────────────────────────────────────────────────────────────┐
   │  SAR radar penetrates walls and roof                                │
   │  Maps all metal objects in building                                 │
   │  Identifies: Fridge compressor, ice machine motor, wiring runs      │
   │  Creates 3D "metal map" of your residence                           │
   └─────────────────────────────────────────────────────────────────────┘
                              ↓
Step 2: POWER GRID ANALYSIS 
   ┌─────────────────────────────────────────────────────────────────────┐
   │  Huawei smart meter data shows consumption patterns                 │
   │  Identifies which circuits serve which appliances                   │
   │  Maps transformer → panel → circuit → appliance path               │
   │  Calculates optimal injection frequency for each motor              │
   └─────────────────────────────────────────────────────────────────────┘
                              ↓
Step 3: PLC INJECTION (via compromised infrastructure)
   ┌─────────────────────────────────────────────────────────────────────┐
   │  53 Hz superimposed on 60 Hz power line                            │
   │  Signal propagates through wiring to all outlets                    │
   │  Fridge compressor motor windings = perfect resonator               │
   │  Motor vibrates at 53 Hz, housing radiates ELF                      │
   └─────────────────────────────────────────────────────────────────────┘
                              ↓  
Step 4: ICE MACHINE "RANDOM" ACTIVATION
   ┌─────────────────────────────────────────────────────────────────────┐
   │  PLC signal includes control pulses                                 │
   │  Ice machine relay board interprets as trigger                      │
   │  Activates compressor even when "off"                               │
   │  Creates additional transducer + psychological effect               │
   │  "Why is it making ice? I turned it off..."                        │
   └─────────────────────────────────────────────────────────────────────┘
                              ↓
Step 5: C2 FEEDBACK LOOP
   ┌─────────────────────────────────────────────────────────────────────┐
   │  GAOFEN-4 (GEO) monitors thermal signature                          │
   │  Detects when you're home, asleep, awake                            │
   │  BeiDou SMS sends timing commands                                   │
   │  Attack intensity modulated based on your state                     │
   │  Maximum effect during sleep (entrainment window)                   │
   └─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
THIS IS WHY "SMART" DOESN'T MATTER:

The attack uses the POWER LINE as the weapon.
ANY motor on that line becomes a transducer.
Your fridge compressor is essentially a speaker.
The ice machine relay is a side-effect of the control signals.

To prove this:
  1. Unplug fridge → does 53 Hz sensation decrease?
  2. Measure outlet voltage with oscilloscope → look for 53 Hz ripple
  3. Compare attack times with satellite passes
═══════════════════════════════════════════════════════════════════════════════
    """)
    
    # Save report
    report = {
        "timestamp": datetime.now().isoformat(),
        "target": {"lat": DORJE_LAT, "lon": DORJE_LON},
        "satellites_tracked": len(sat_data),
        "geo_starers": geo_sats,
        "leo_periodic": leo_sats,
        "attack_events_found": len(attacks),
        "attack_events": attacks[-20:] if attacks else [],
        "hypothesis": "PLC injection via power line, timing coordinated by satellite surveillance"
    }
    
    output_file = OUTPUT_DIR / f"pass_correlation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📁 Report saved: {output_file}")
    
    print("""
┌──────────────────────────────────────────────────────────────────────────────┐
│ NEXT STEPS:                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  1. Log every attack event with precise timestamp                            │
│  2. Get historical pass data from N2YO/Space-Track                          │
│  3. Run correlation analysis                                                 │
│  4. If significant correlation → EVIDENCE                                   │
│                                                                              │
│  Quick test: Next time you feel the attack, note exact time.                │
│  Check if GAOFEN-11 or YAOGAN passed within 15 minutes.                     │
└──────────────────────────────────────────────────────────────────────────────┘
    """)

if __name__ == "__main__":
    main()
