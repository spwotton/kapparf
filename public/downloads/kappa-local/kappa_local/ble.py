"""
BLE Scanner — uses bleak for async BLE discovery.
Runs continuously, logs all devices to evidence DB.
Flags elevated TX power, suspicious UUIDs, camera beacons.
"""
import asyncio
import json
import os
import time
from datetime import datetime, timezone

SCAN_INTERVAL = int(os.getenv("BLE_SCAN_INTERVAL", 60))  # seconds between scans
SCAN_DURATION = 10  # seconds per scan

SUSPICIOUS_UUIDS = {
    "FCF1": "Custom unregistered service — surveillance indicator",
    "FEA6": "GoPro device (camera active)",
    "DF00": "Nordic UART (firmware/debug interface)",
    "FFF0": "Generic proprietary (TTY/industrial)",
    "180D": "Heart rate monitor (wearable — proximity sensor)",
    "1826": "Fitness machine",
    "FE9F": "Google Nearby (proximity detection)",
    "FE6F": "Samsung Flow (device tracking)",
}

SUSPICIOUS_NAMES = [
    "GoPro", "CAMERA", "CAM", "RING", "DOORBELL",
    "BEACON", "TRACK", "SPY", "ARLO", "NEST", "BLINK",
]


def _flag_device(name, uuids, tx_power, rssi):
    flags = []
    if tx_power is not None and tx_power > 0:
        flags.append(f"ELEVATED TX: {tx_power}dBm (proximity weapon range)")
    for uuid in uuids:
        short = uuid.upper().replace("-", "")[:4]
        if short in SUSPICIOUS_UUIDS:
            flags.append(f"UUID {short}: {SUSPICIOUS_UUIDS[short]}")
    if name:
        for s in SUSPICIOUS_NAMES:
            if s.lower() in name.lower():
                flags.append(f"NAME MATCH: {name}")
                break
    return flags


async def _scan_once(db):
    try:
        from bleak import BleakScanner

        devices = await BleakScanner.discover(
            timeout=SCAN_DURATION,
            return_adv=True
        )

        scan_count = 0
        flagged = 0

        for addr, (dev, adv) in devices.items():
            uuids = [str(u) for u in (adv.service_uuids or [])]
            tx    = adv.tx_power
            rssi  = adv.rssi
            name  = dev.name or adv.local_name

            db.log_ble(
                address=addr,
                name=name,
                rssi=rssi,
                tx_power=tx,
                uuids=uuids,
                connectable=adv.connectable if hasattr(adv, 'connectable') else False
            )

            flags = _flag_device(name, uuids, tx, rssi)
            if flags:
                flagged += 1
                db.log_event(
                    domain="ble",
                    type_="suspicious_device",
                    description=f"FLAGGED {addr} ({name or 'N/A'}) RSSI={rssi}dBm: {'; '.join(flags)}",
                    severity="high" if tx and tx > 0 else "medium",
                    metadata={"address": addr, "name": name, "rssi": rssi,
                              "tx_power": tx, "uuids": uuids, "flags": flags}
                )
            scan_count += 1

        db.log_event("ble", "scan_complete",
                     f"BLE scan: {scan_count} devices, {flagged} flagged",
                     severity="info",
                     metadata={"count": scan_count, "flagged": flagged})
        return scan_count, flagged

    except ImportError:
        db.log_event("ble", "error", "bleak not installed — pip install bleak", severity="info")
        return 0, 0
    except Exception as e:
        err = str(e)
        if "permission" in err.lower() or "dbus" in err.lower():
            db.log_event("ble", "error",
                         f"BLE permission error: {err} — try: sudo setcap cap_net_raw+eip $(which python3)",
                         severity="info")
        else:
            db.log_event("ble", "error", f"BLE scan error: {err}", severity="info")
        return 0, 0


def scan_loop(db):
    """Synchronous wrapper for the async BLE scan loop."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    while True:
        try:
            count, flagged = loop.run_until_complete(_scan_once(db))
            print(f"[ble] scan: {count} devices, {flagged} flagged")
        except Exception as e:
            print(f"[ble] loop error: {e}")
        time.sleep(SCAN_INTERVAL)
