#!/usr/bin/env python3
"""Phone Finder - Continuous BLE signal tracker"""
import asyncio
from bleak import BleakScanner
from datetime import datetime
import sys

TARGET_MAC = "38:68:A4:A7:69:F3"

def signal_bars(rssi):
    """Visual signal strength"""
    if rssi > -50: return "█████ VERY CLOSE!"
    if rssi > -60: return "████░ CLOSE"
    if rssi > -70: return "███░░ NEARBY"
    if rssi > -80: return "██░░░ MEDIUM"
    if rssi > -90: return "█░░░░ FAR"
    return "░░░░░ VERY FAR"

def direction_hint(prev_rssi, curr_rssi):
    """Movement hint"""
    if prev_rssi is None:
        return ""
    diff = curr_rssi - prev_rssi
    if diff > 3:
        return " ⬆️ GETTING CLOSER!"
    elif diff < -3:
        return " ⬇️ MOVING AWAY"
    else:
        return " ➡️ SAME DISTANCE"

async def find_phone():
    print("=" * 60)
    print("  📱 PHONE FINDER - Target: Samsung " + TARGET_MAC)
    print("=" * 60)
    print("Walk around slowly. Signal strength shows distance.")
    print("Higher number (less negative) = CLOSER")
    print("Press Ctrl+C to stop\n")
    
    prev_rssi = None
    scan_count = 0
    
    while True:
        scan_count += 1
        found = False
        
        try:
            devices = await BleakScanner.discover(timeout=5.0, return_adv=True)
            
            for addr, (device, adv) in devices.items():
                if TARGET_MAC.lower() in addr.lower():
                    found = True
                    rssi = adv.rssi
                    bars = signal_bars(rssi)
                    hint = direction_hint(prev_rssi, rssi)
                    
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    print(f"[{timestamp}] {rssi:4d} dBm {bars}{hint}")
                    
                    if rssi > -50:
                        print("\n🎯 PHONE IS VERY CLOSE! Check within 5 meters!\n")
                    
                    prev_rssi = rssi
                    break
            
            if not found:
                timestamp = datetime.now().strftime("%H:%M:%S")
                print(f"[{timestamp}] ---- NOT FOUND (move to different spot)")
                prev_rssi = None
                
        except Exception as e:
            print(f"Scan error: {e}")
        
        await asyncio.sleep(2)

if __name__ == "__main__":
    try:
        asyncio.run(find_phone())
    except KeyboardInterrupt:
        print("\n\nStopped. Good luck finding your phone!")
