#!/usr/bin/env python3
"""
NETWORK TRIANGULATION & GEOLOCATION
====================================
Triangulate hidden networks using signal strength and known geography.

Location: Calle Cabello Real, La Guácima, Alajuela, Costa Rica
Target: Hidden network f6:09:0d:20:e6:46 (31% signal = ~40m)

Known landmarks:
- 5G tower in neighbor's yard
- House across valley with drone activity

Author: OMEGA PROTOCOL
"""

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple

# DORJE STATION - Your location
DORJE_LAT = 10.0167
DORJE_LON = -84.2167
DORJE_ALT = 840  # meters

# More precise: Calle Cabello Real, La Guácima
# Using Google Maps approximate center
DORJE_PRECISE = {
    "lat": 9.9765,  # Approximate - need to verify
    "lon": -84.2285,
    "address": "Calle Cabello Real, La Guácima, Alajuela, Costa Rica"
}

@dataclass
class NetworkEvidence:
    """Evidence for a detected network"""
    bssid: str
    ssid: str
    signal_percent: int
    channel: int
    band: str
    is_hidden: bool
    is_spoofed: bool
    estimated_distance_m: float
    timestamp: str
    notes: str

@dataclass
class LocationEstimate:
    """Estimated source location"""
    lat: float
    lon: float
    radius_m: float
    confidence: float
    bearing_deg: float  # Direction from observer
    evidence: List[str]


def signal_to_distance(signal_percent: int, frequency_ghz: float = 2.4) -> float:
    """
    Estimate distance from signal strength using Free Space Path Loss.
    
    Formula: FSPL = 20*log10(d) + 20*log10(f) + 20*log10(4π/c)
    Inverted to solve for d.
    
    signal_percent is approximate - real RSSI needed for accuracy.
    Rough mapping:
    - 100% = -30 dBm = ~1m
    - 70% = -55 dBm = ~10m
    - 50% = -65 dBm = ~30m
    - 30% = -75 dBm = ~50m
    - 20% = -80 dBm = ~80m
    - 10% = -85 dBm = ~150m
    """
    # Approximate RSSI from percentage
    # Signal bars are not linear - this is a rough estimate
    rssi_dbm = -30 - (100 - signal_percent) * 0.55
    
    # FSPL inversion for 2.4GHz
    # d = 10^((FSPL - 20*log10(f_MHz) - 32.44) / 20)
    f_mhz = frequency_ghz * 1000
    fspl = abs(rssi_dbm)
    
    # Solve for distance
    distance_m = 10 ** ((fspl - 20 * math.log10(f_mhz) - 32.44) / 20)
    
    return distance_m


def bearing_between_points(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate bearing from point 1 to point 2 in degrees"""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlon_rad = math.radians(lon2 - lon1)
    
    x = math.sin(dlon_rad) * math.cos(lat2_rad)
    y = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dlon_rad)
    
    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360) % 360


def point_at_distance_bearing(lat: float, lon: float, distance_m: float, bearing_deg: float) -> Tuple[float, float]:
    """Calculate point at given distance and bearing from origin"""
    R = 6371000  # Earth radius in meters
    
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    bearing_rad = math.radians(bearing_deg)
    
    d = distance_m / R
    
    new_lat = math.asin(
        math.sin(lat_rad) * math.cos(d) +
        math.cos(lat_rad) * math.sin(d) * math.cos(bearing_rad)
    )
    
    new_lon = lon_rad + math.atan2(
        math.sin(bearing_rad) * math.sin(d) * math.cos(lat_rad),
        math.cos(d) - math.sin(lat_rad) * math.sin(new_lat)
    )
    
    return math.degrees(new_lat), math.degrees(new_lon)


# Known network evidence from your scans
KNOWN_NETWORKS = [
    NetworkEvidence(
        bssid="f6:09:0d:20:e6:46",
        ssid="[HIDDEN]",
        signal_percent=31,
        channel=6,
        band="2.4 GHz",
        is_hidden=True,
        is_spoofed=True,
        estimated_distance_m=0,  # Will calculate
        timestamp="2026-01-20T17:03:54-06:00",
        notes="Same device as OSLU network (bit-flip MAC)"
    ),
    NetworkEvidence(
        bssid="f0:09:0d:20:e6:46",
        ssid="OSLU",
        signal_percent=35,  # Approximate
        channel=6,
        band="2.4 GHz",
        is_hidden=False,
        is_spoofed=False,
        estimated_distance_m=0,
        timestamp="2026-01-20T17:03:54-06:00",
        notes="Visible version of hidden network"
    ),
    NetworkEvidence(
        bssid="9c:24:72:62:60:cb",
        ssid="LIB-9979854",
        signal_percent=72,
        channel=157,
        band="5 GHz",
        is_hidden=False,
        is_spoofed=False,
        estimated_distance_m=0,
        timestamp="2026-01-26T02:00:00Z",
        notes="Your router - Liberty Business"
    ),
]

# Spoofed LAN device
SPOOFED_DEVICES = [
    {
        "ip": "192.168.0.91",
        "mac": "d6-bd-80-92-6c-d6",
        "is_spoofed": True,
        "notes": "Locally administered MAC - unknown device on your network"
    },
    {
        "ip": "192.168.0.237",
        "packets": 61241,
        "notes": "Top talker in PCAP - high volume traffic"
    },
    {
        "ip": "192.168.0.110",
        "packets": 8857,
        "notes": "High port 8009 (Cast) traffic"
    }
]

# Potential source locations to investigate
SUSPECT_LOCATIONS = [
    {
        "name": "5G Tower Neighbor",
        "description": "House with 5G radio tower in yard",
        "bearing_estimate_deg": None,  # Need to determine
        "distance_estimate_m": 50,  # Within 50m based on signal
        "lat": None,
        "lon": None
    },
    {
        "name": "Valley House with Drone",
        "description": "House across valley where drone was seen flying into",
        "bearing_estimate_deg": None,
        "distance_estimate_m": 200,  # Approximate - across valley
        "lat": None,
        "lon": None
    }
]


def analyze_networks():
    """Analyze all known networks and estimate locations"""
    print("="*60)
    print("NETWORK TRIANGULATION ANALYSIS")
    print("="*60)
    print(f"Observer: {DORJE_PRECISE['address']}")
    print(f"Coordinates: {DORJE_PRECISE['lat']}, {DORJE_PRECISE['lon']}")
    print()
    
    results = []
    
    for net in KNOWN_NETWORKS:
        # Calculate estimated distance
        freq = 5.0 if "5 GHz" in net.band else 2.4
        distance = signal_to_distance(net.signal_percent, freq)
        net.estimated_distance_m = distance
        
        print(f"Network: {net.ssid} ({net.bssid})")
        print(f"  Signal: {net.signal_percent}%")
        print(f"  Estimated distance: {distance:.1f}m")
        print(f"  Hidden: {net.is_hidden} | Spoofed: {net.is_spoofed}")
        print(f"  Notes: {net.notes}")
        print()
        
        if net.is_hidden or net.is_spoofed:
            results.append({
                "network": asdict(net),
                "threat_level": "HIGH" if net.is_hidden and net.is_spoofed else "MEDIUM"
            })
    
    print("="*60)
    print("SPOOFED LAN DEVICES")
    print("="*60)
    for dev in SPOOFED_DEVICES:
        print(f"  {dev['ip']}: {dev.get('mac', 'N/A')} - {dev['notes']}")
    
    print()
    print("="*60)
    print("SUSPECT LOCATIONS TO INVESTIGATE")
    print("="*60)
    for loc in SUSPECT_LOCATIONS:
        print(f"  {loc['name']}")
        print(f"    {loc['description']}")
        print(f"    Est. distance: {loc['distance_estimate_m']}m")
    
    print()
    print("="*60)
    print("NEXT STEPS FOR TRIANGULATION")
    print("="*60)
    print("""
1. Walk perimeter with phone running WiFi analyzer
   - Note signal strength at multiple points
   - Hidden network should peak near source
   
2. Use Google Earth to measure:
   - Exact distance to 5G tower house
   - Exact distance to valley house
   - Any other structures within 50m
   
3. Time-correlate:
   - When does hidden network appear?
   - Does it correlate with drone activity?
   - Does it correlate with your symptoms?
   
4. Check power:
   - Hidden network on same power circuit?
   - PLC could be coming through electrical
""")
    
    # Save analysis
    output = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "observer": DORJE_PRECISE,
        "networks": [asdict(n) for n in KNOWN_NETWORKS],
        "spoofed_devices": SPOOFED_DEVICES,
        "suspect_locations": SUSPECT_LOCATIONS,
        "threat_assessment": results
    }
    
    outfile = Path(__file__).parent / "network_triangulation.json"
    with open(outfile, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n[SAVED] {outfile}")
    
    return output


if __name__ == "__main__":
    analyze_networks()
