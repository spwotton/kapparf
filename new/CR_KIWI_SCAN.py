#!/usr/bin/env python3
"""
COSTA RICA KIWISDR PERPETUAL SCANNER
Local RF baseline from RADIOCLUB COSTA RICA (TI0RC)
Distance: ~20 km from DORJE_STATION

KiwiSDR Frequency Range: 10 kHz - 30 MHz
Target: VLF/LF/HF anomalies, harmonics of attack frequencies
"""

import urllib.request
import json
import time
from datetime import datetime
from pathlib import Path
import struct

# Costa Rica Radio Club - 20km from target
KIWI_HOST = "ti0rc.proxy.kiwisdr.com"
KIWI_PORT = 8073
KIWI_STATUS_URL = f"http://{KIWI_HOST}/status"

# Output directory
OUTPUT_DIR = Path("signal_forensics/cr_kiwi_scans")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Target frequencies (in Hz) - things we can check in VLF/HF range
# Note: 53 Hz and 7.83 Hz are BELOW KiwiSDR range (10 kHz minimum)
# So we look for HARMONICS and related signals

TARGET_FREQUENCIES = {
    # VLF Stations (10-30 kHz) - military/navigation
    "NAA_Cutler": 24000,        # US Navy, Maine
    "NML_La_Moure": 25200,      # US Navy, North Dakota  
    "NAU_Aguada": 40800,        # US Navy, Puerto Rico (closest to CR!)
    "NPM_Hawaii": 21400,        # US Navy, Hawaii
    
    # LF Time Signals
    "WWVB": 60000,              # NIST time signal
    
    # HF Chinese stations to monitor
    "Firedrake_6900": 6900000,  # Chinese jamming frequency
    "Firedrake_7280": 7280000,
    "CNR1_6175": 6175000,       # China National Radio
    "CNR1_9580": 9580000,
    "CRI_9790": 9790000,        # China Radio International
    
    # 53 Hz harmonics in KiwiSDR range
    "53Hz_x200": 10600,         # 53 * 200 = 10,600 Hz
    "53Hz_x250": 13250,         # 53 * 250 = 13,250 Hz
    "53Hz_x500": 26500,         # 53 * 500 = 26,500 Hz
    
    # 7.83 Hz (Schumann) harmonics
    "Schumann_x1500": 11745,    # 7.83 * 1500 ≈ 11,745 Hz
    "Schumann_x2000": 15660,    # 7.83 * 2000 ≈ 15,660 Hz
    
    # Costa Rica local AM broadcast (for comparison)
    "Radio_Reloj_CR": 840000,   # Local San Jose station
    
    # Emergency/distress
    "VLF_Alpha": 11905,         # Russian Alpha nav (if active)
    "VLF_Omega": 10200,         # Omega (discontinued but freq still used)
}

def check_kiwi_status():
    """Check if KiwiSDR is online and get status"""
    try:
        req = urllib.request.Request(KIWI_STATUS_URL, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=10)
        data = resp.read().decode()
        
        status = {}
        for line in data.split('\n'):
            if '=' in line:
                key, val = line.split('=', 1)
                status[key.strip()] = val.strip()
        
        return status
    except Exception as e:
        return {"error": str(e)}

def format_frequency(hz):
    """Format frequency for display"""
    if hz >= 1000000:
        return f"{hz/1000000:.3f} MHz"
    elif hz >= 1000:
        return f"{hz/1000:.3f} kHz"
    else:
        return f"{hz} Hz"

def scan_frequencies():
    """Perform a frequency scan via KiwiSDR"""
    timestamp = datetime.now().isoformat()
    scan_result = {
        "timestamp": timestamp,
        "kiwi_host": KIWI_HOST,
        "location": "San Jose, Costa Rica",
        "gps": "(9.920611, -84.059417)",
        "distance_from_target_km": 20,
        "frequencies_checked": {},
        "anomalies": []
    }
    
    print(f"\n{'='*60}")
    print(f"COSTA RICA KIWISDR SCAN - {timestamp}")
    print(f"Receiver: RADIOCLUB COSTA RICA (TI0RC)")
    print(f"Location: 9.92°N, 84.06°W (~20 km from target)")
    print(f"{'='*60}\n")
    
    # Check status first
    status = check_kiwi_status()
    if "error" in status:
        print(f"❌ KiwiSDR OFFLINE: {status['error']}")
        scan_result["status"] = "offline"
        scan_result["error"] = status["error"]
        return scan_result
    
    users = status.get('users', '?')
    users_max = status.get('users_max', '?')
    snr = status.get('snr', '?')
    antenna = status.get('antenna', '?')
    
    print(f"✅ KiwiSDR ONLINE")
    print(f"   Users: {users}/{users_max}")
    print(f"   SNR: {snr} dB")
    print(f"   Antenna: {antenna}")
    print(f"\n{'─'*60}")
    print(f"TARGET FREQUENCIES TO MONITOR:")
    print(f"{'─'*60}")
    
    scan_result["kiwi_status"] = {
        "users": users,
        "users_max": users_max,
        "snr": snr,
        "antenna": antenna
    }
    
    # List target frequencies
    for name, freq in sorted(TARGET_FREQUENCIES.items(), key=lambda x: x[1]):
        if freq >= 10000 and freq <= 30000000:  # KiwiSDR range
            print(f"  [{name:20s}] {format_frequency(freq):>12s}")
            scan_result["frequencies_checked"][name] = {
                "frequency_hz": freq,
                "in_kiwi_range": True
            }
        else:
            print(f"  [{name:20s}] {format_frequency(freq):>12s} (OUT OF RANGE)")
            scan_result["frequencies_checked"][name] = {
                "frequency_hz": freq,
                "in_kiwi_range": False
            }
    
    # Generate direct links to KiwiSDR for each frequency
    print(f"\n{'─'*60}")
    print(f"DIRECT KIWISDR LINKS (click to listen):")
    print(f"{'─'*60}")
    
    priority_freqs = ["NAU_Aguada", "53Hz_x200", "Schumann_x1500", "Firedrake_6900"]
    for name in priority_freqs:
        if name in TARGET_FREQUENCIES:
            freq = TARGET_FREQUENCIES[name]
            freq_khz = freq / 1000
            url = f"http://{KIWI_HOST}:{KIWI_PORT}/?f={freq_khz:.2f}am"
            print(f"  {name}: {url}")
            scan_result["frequencies_checked"][name]["kiwi_url"] = url
    
    return scan_result

def save_scan(scan_result):
    """Save scan result to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = OUTPUT_DIR / f"cr_scan_{timestamp}.json"
    with open(filename, 'w') as f:
        json.dump(scan_result, f, indent=2)
    print(f"\n📁 Saved: {filename}")
    return filename

def perpetual_scan(interval_seconds=60):
    """Run continuous scans"""
    print("\n" + "="*60)
    print("🔄 PERPETUAL SCAN MODE")
    print(f"   Interval: {interval_seconds} seconds")
    print(f"   Output: {OUTPUT_DIR}")
    print("   Press Ctrl+C to stop")
    print("="*60)
    
    scan_count = 0
    anomaly_count = 0
    
    try:
        while True:
            scan_count += 1
            print(f"\n[SCAN #{scan_count}] {datetime.now().isoformat()}")
            
            result = scan_frequencies()
            save_scan(result)
            
            if result.get("anomalies"):
                anomaly_count += len(result["anomalies"])
                print(f"⚠️  ANOMALIES DETECTED: {len(result['anomalies'])}")
            
            print(f"\n⏱️  Next scan in {interval_seconds} seconds...")
            time.sleep(interval_seconds)
            
    except KeyboardInterrupt:
        print(f"\n\n{'='*60}")
        print(f"SCAN SUMMARY")
        print(f"  Total scans: {scan_count}")
        print(f"  Total anomalies: {anomaly_count}")
        print(f"  Output directory: {OUTPUT_DIR}")
        print(f"{'='*60}")

if __name__ == "__main__":
    import sys
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║  COSTA RICA KIWISDR SCANNER - RADIOCLUB COSTA RICA (TI0RC)  ║
║  Distance from target: ~20 km                                 ║
║  Frequency range: 10 kHz - 30 MHz                             ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    if "--perpetual" in sys.argv:
        interval = 60
        for arg in sys.argv:
            if arg.startswith("--interval="):
                interval = int(arg.split("=")[1])
        perpetual_scan(interval)
    else:
        # Single scan (prelim)
        result = scan_frequencies()
        save_scan(result)
        
        print(f"\n{'='*60}")
        print("To run perpetual scan:")
        print("  python signal_forensics/CR_KIWI_SCAN.py --perpetual")
        print("  python signal_forensics/CR_KIWI_SCAN.py --perpetual --interval=30")
        print(f"{'='*60}")
