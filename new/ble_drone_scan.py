#!/usr/bin/env python3
"""Quick BLE drone scanner"""
import asyncio
from bleak import BleakScanner
from datetime import datetime

DRONE_PATTERNS = ['DJI', 'Mavic', 'Phantom', 'Spark', 'Mini', 'Parrot', 'Bebop', 
                  'Anafi', 'Autel', 'EVO', 'Skydio', 'FIMI', 'Hubsan', 'Potensic',
                  'RemoteID', 'RID', 'UAV', 'DRONE', 'FPV', 'Quadcopter']

async def scan():
    print(f"BLE DRONE SCAN - {datetime.now().strftime('%H:%M:%S')}")
    print("="*60)
    print("Scanning for 15 seconds...")
    
    devices = await BleakScanner.discover(timeout=15.0, return_adv=True)
    print(f"\nFound {len(devices)} BLE devices:\n")
    
    drones = []
    # Sort by RSSI from advertisement data
    sorted_devices = sorted(devices.items(), key=lambda x: x[1][1].rssi if x[1][1] else -100, reverse=True)
    
    for addr, (device, adv_data) in sorted_devices:
        name = device.name or adv_data.local_name or "(unnamed)"
        rssi = adv_data.rssi if adv_data else -100
        is_drone = any(p.lower() in name.lower() for p in DRONE_PATTERNS)
        
        # Also check for DJI Remote ID service UUID
        # DJI uses specific UUIDs for Remote ID broadcast
        flag = " 🚨 DRONE?" if is_drone else ""
        print(f"{rssi:4d} dBm | {addr} | {name}{flag}")
        if is_drone:
            drones.append((device, adv_data))
    
    print(f"\n{'='*60}")
    if drones:
        print(f"⚠️  POTENTIAL DRONES DETECTED: {len(drones)}")
        for device, adv in drones:
            name = device.name or adv.local_name or "(unnamed)"
            rssi = adv.rssi if adv else -100
            print(f"   - {name} @ {device.address} ({rssi} dBm)")
    else:
        print("✅ No obvious drone WiFi/BLE signatures")
        print("⚠️  Military/encrypted drones won't show names")
        print("💡 Check for unnamed devices with strong signal that move")

if __name__ == "__main__":
    asyncio.run(scan())
