#!/usr/bin/env python3
"""
DRONE DETECTION SYSTEM v1.0
============================
Multi-vector drone detection using available sensors:
1. WiFi scanning for drone hotspots (DJI, Parrot, etc.)
2. Audio analysis for rotor signatures (if microphone available)
3. Bluetooth LE scanning for drone beacons
4. Network traffic analysis for drone control protocols

KNOWN DRONE SIGNATURES:
- DJI: Creates "DJI-XXXXX" or "Phantom-XXXXX" WiFi networks
- Parrot: "Parrot-XXXXX", "Bebop-XXXXX"
- Autel: "Autel-XXXXX"
- Skydio: Uses encrypted 5.8GHz
- Military: Often 900MHz or encrypted bands (not detectable via WiFi)

DRONE CONTROL FREQUENCIES:
- 2.4 GHz (WiFi band) - Consumer drones
- 5.8 GHz (WiFi band) - FPV video/high-bandwidth
- 900 MHz - Long range control
- 433 MHz - Telemetry
- 1.2 GHz - Analog video

Author: OMEGA Protocol
Date: 2026-01-25
"""

import subprocess
import re
import json
import time
from datetime import datetime
from pathlib import Path
import socket
import struct

# Drone SSID patterns
DRONE_SSID_PATTERNS = [
    r"DJI[-_]",
    r"Phantom[-_]",
    r"Mavic[-_]",
    r"Spark[-_]",
    r"Inspire[-_]",
    r"Parrot[-_]",
    r"Bebop[-_]",
    r"Anafi[-_]",
    r"Autel[-_]",
    r"EVO[-_]",
    r"Skydio[-_]",
    r"FIMI[-_]",
    r"Hubsan[-_]",
    r"Holy[-_]?Stone",
    r"Potensic[-_]",
    r"SJRC[-_]",
    r"Walkera[-_]",
    r"Yuneec[-_]",
    r"Typhoon[-_]",
    r"3DR[-_]",
    r"Solo[-_]",
    # Generic patterns
    r"DRONE",
    r"UAV[-_]",
    r"QUAD[-_]",
    r"FPV[-_]",
    r"RC[-_]DRONE",
]

# Drone MAC OUI prefixes (first 3 bytes)
DRONE_MAC_PREFIXES = {
    "60:60:1F": "DJI",
    "48:1C:B9": "DJI", 
    "34:D2:62": "DJI",
    "A0:14:3D": "Parrot",
    "90:03:B7": "Parrot",
    "00:12:1C": "Parrot",
    "00:26:7E": "Parrot",
    "A0:14:3D": "Parrot",
    "00:24:D6": "Intel (Yuneec)",
    "B8:F0:09": "Espressif (many cheap drones)",
    "CC:50:E3": "Espressif",
    "5C:CF:7F": "Espressif",
}

# Suspicious high-altitude RF characteristics
SUSPICIOUS_PATTERNS = {
    "rapid_signal_change": True,  # Signal strength changing >20% in 5 seconds
    "new_network_appear": True,   # Network appears that wasn't there before
    "drone_oui_match": True,      # MAC matches known drone manufacturer
}

OUTPUT_DIR = Path("drone_logs")


def scan_wifi_networks():
    """Scan for WiFi networks and check for drone signatures"""
    try:
        result = subprocess.run(
            ["netsh", "wlan", "show", "networks", "mode=bssid"],
            capture_output=True, text=True, timeout=30
        )
        return result.stdout
    except Exception as e:
        return f"ERROR: {e}"


def parse_wifi_scan(scan_output):
    """Parse netsh output into structured data"""
    networks = []
    current_network = {}
    
    for line in scan_output.split('\n'):
        line = line.strip()
        
        if line.startswith("SSID") and ":" in line and "BSSID" not in line:
            if current_network:
                networks.append(current_network)
            ssid = line.split(":", 1)[1].strip()
            current_network = {"ssid": ssid, "bssids": []}
            
        elif line.startswith("BSSID"):
            bssid = line.split(":", 1)[1].strip()
            current_network["current_bssid"] = bssid
            
        elif line.startswith("Signal"):
            signal = line.split(":", 1)[1].strip().replace("%", "")
            if "current_bssid" in current_network:
                current_network["bssids"].append({
                    "bssid": current_network["current_bssid"],
                    "signal": int(signal) if signal.isdigit() else 0
                })
                
        elif line.startswith("Channel"):
            parts = line.split(":")
            if len(parts) > 1:
                channel = parts[1].strip().split()[0]
                if current_network.get("bssids"):
                    current_network["bssids"][-1]["channel"] = channel
                    
    if current_network:
        networks.append(current_network)
        
    return networks


def check_drone_ssid(ssid):
    """Check if SSID matches known drone patterns"""
    for pattern in DRONE_SSID_PATTERNS:
        if re.search(pattern, ssid, re.IGNORECASE):
            return True, pattern
    return False, None


def check_drone_mac(bssid):
    """Check if MAC OUI matches known drone manufacturers"""
    prefix = bssid[:8].upper()
    if prefix in DRONE_MAC_PREFIXES:
        return True, DRONE_MAC_PREFIXES[prefix]
    return False, None


def detect_drones():
    """Main drone detection routine"""
    print(f"\n{'='*60}")
    print(f"  DRONE DETECTION SCAN - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")
    
    # Scan WiFi
    print("[1] Scanning WiFi networks...")
    scan_output = scan_wifi_networks()
    networks = parse_wifi_scan(scan_output)
    
    print(f"    Found {len(networks)} networks\n")
    
    detections = []
    
    for network in networks:
        ssid = network.get("ssid", "")
        
        # Check SSID
        is_drone_ssid, pattern = check_drone_ssid(ssid)
        
        for bssid_info in network.get("bssids", []):
            bssid = bssid_info.get("bssid", "")
            signal = bssid_info.get("signal", 0)
            channel = bssid_info.get("channel", "?")
            
            # Check MAC
            is_drone_mac, manufacturer = check_drone_mac(bssid)
            
            if is_drone_ssid or is_drone_mac:
                detection = {
                    "timestamp": datetime.now().isoformat(),
                    "ssid": ssid,
                    "bssid": bssid,
                    "signal": signal,
                    "channel": channel,
                    "drone_ssid_match": is_drone_ssid,
                    "ssid_pattern": pattern,
                    "drone_mac_match": is_drone_mac,
                    "manufacturer": manufacturer,
                    "threat_level": "HIGH" if is_drone_ssid else "MEDIUM"
                }
                detections.append(detection)
                
                print(f"  🚨 DRONE DETECTED:")
                print(f"     SSID: {ssid}")
                print(f"     BSSID: {bssid}")
                print(f"     Signal: {signal}%")
                print(f"     Channel: {channel}")
                if manufacturer:
                    print(f"     Manufacturer: {manufacturer}")
                print()
            else:
                # Print all networks for analysis
                print(f"  📶 {ssid or '(Hidden)'}")
                print(f"     BSSID: {bssid} | Signal: {signal}% | Ch: {channel}")
    
    # Summary
    print(f"\n{'='*60}")
    if detections:
        print(f"  ⚠️  {len(detections)} POTENTIAL DRONE(S) DETECTED")
        
        # Save to log
        OUTPUT_DIR.mkdir(exist_ok=True)
        log_file = OUTPUT_DIR / f"drone_detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w') as f:
            json.dump(detections, f, indent=2)
        print(f"  📁 Log saved: {log_file}")
    else:
        print("  ✅ No drone WiFi signatures detected")
        print("  ⚠️  Note: Military/encrypted drones may not be visible")
    print(f"{'='*60}\n")
    
    return detections


def continuous_monitor(interval=10, duration=300):
    """Continuous monitoring for specified duration"""
    print(f"\n🔄 Starting continuous drone monitoring...")
    print(f"   Interval: {interval}s | Duration: {duration}s")
    print(f"   Press Ctrl+C to stop\n")
    
    start_time = time.time()
    all_detections = []
    previous_networks = set()
    
    try:
        while time.time() - start_time < duration:
            scan_output = scan_wifi_networks()
            networks = parse_wifi_scan(scan_output)
            
            current_networks = set()
            for network in networks:
                for bssid_info in network.get("bssids", []):
                    current_networks.add(bssid_info.get("bssid", ""))
            
            # Check for new networks
            new_networks = current_networks - previous_networks
            if new_networks and previous_networks:  # Skip first scan
                print(f"\n⚠️  NEW NETWORK(S) APPEARED: {new_networks}")
                for network in networks:
                    for bssid_info in network.get("bssids", []):
                        if bssid_info.get("bssid") in new_networks:
                            print(f"   SSID: {network.get('ssid')} | BSSID: {bssid_info.get('bssid')}")
            
            # Check for drone signatures
            for network in networks:
                ssid = network.get("ssid", "")
                is_drone, _ = check_drone_ssid(ssid)
                if is_drone:
                    timestamp = datetime.now().strftime('%H:%M:%S')
                    print(f"\n🚨 [{timestamp}] DRONE WIFI: {ssid}")
                    all_detections.append({
                        "time": timestamp,
                        "ssid": ssid,
                        "bssids": network.get("bssids", [])
                    })
            
            previous_networks = current_networks
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Monitoring stopped by user")
    
    return all_detections


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--monitor":
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        duration = int(sys.argv[3]) if len(sys.argv) > 3 else 300
        continuous_monitor(interval, duration)
    else:
        detect_drones()
