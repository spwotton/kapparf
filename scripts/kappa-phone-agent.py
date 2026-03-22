#!/usr/bin/env python3
"""
KAPPA Phone Agent — Android/Termux Multi-Sensor Collector
Runs on your phone via Termux to feed sensors, PCAP Droid exports,
and network data into KAPPA in real-time.

SETUP (Termux):
  pkg install python termux-api
  python3 kappa-phone-agent.py --continuous

SETUP (PCAP Droid integration):
  1. Open PCAP Droid, start capture
  2. Export as CSV/text
  3. python3 kappa-phone-agent.py --pcapdroid /path/to/export.csv

SETUP (Kyma bridge):
  python3 kappa-phone-agent.py --kyma-bridge --kyma-url https://your-kyma.replit.app

Requirements:
  - Python 3.7+ (Termux ships with it)
  - termux-api package (for sensors)
  - No pip packages needed
"""

import subprocess
import json
import sys
import os
import time
import re
import platform
import argparse
import urllib.request
import urllib.error
import threading
from datetime import datetime, timezone

KAPPA_URL = os.environ.get("KAPPA_URL", "https://kappa-sigint.replit.app")
KYMA_URL = os.environ.get("KYMA_URL", "")
OBSERVER_LAT = 10.0513892
OBSERVER_LON = -84.2186578
PHONE_ID = os.environ.get("PHONE_ID", f"phone-{platform.node()}")


def post_json(url, data, timeout=10):
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  [!] HTTP {e.code}: {e.read().decode()[:200]}")
    except urllib.error.URLError as e:
        print(f"  [!] Connection error: {e.reason}")
    except Exception as e:
        print(f"  [!] Error: {e}")
    return None


def get_json(url, timeout=10):
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  [!] GET error: {e}")
    return None


def run_cmd(cmd, timeout=15):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                                shell=isinstance(cmd, str))
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "timeout", -1
    except Exception as e:
        return "", str(e), -1


def which(cmd):
    try:
        result = subprocess.run(["which", cmd], capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except:
        return False


def is_termux():
    return os.path.exists("/data/data/com.termux") or "com.termux" in os.environ.get("PREFIX", "")


def register_phone():
    capabilities = []
    if is_termux():
        if which("termux-sensor"):
            capabilities.extend(["magnetometer", "accelerometer", "gyroscope", "light", "proximity", "barometer"])
        if which("termux-wifi-scaninfo"):
            capabilities.append("wifi-scan")
        if which("termux-location"):
            capabilities.append("gps")
        if which("termux-battery-status"):
            capabilities.append("battery")
        if which("termux-telephony-cellinfo"):
            capabilities.append("cell-info")

    result = post_json(f"{KAPPA_URL}/api/phone/register", {
        "phoneId": PHONE_ID,
        "os": "android-termux" if is_termux() else platform.system().lower(),
        "capabilities": capabilities,
    })
    if result:
        print(f"  [+] Registered as {PHONE_ID} with {len(capabilities)} capabilities")
    return capabilities


def scan_sensors_termux():
    print("[Sensors] Reading phone sensors...")
    readings = []

    sensor_map = {
        "accelerometer": "android.sensor.accelerometer",
        "magnetometer": "android.sensor.magnetic_field",
        "gyroscope": "android.sensor.gyroscope",
        "light": "android.sensor.light",
        "proximity": "android.sensor.proximity",
        "barometer": "android.sensor.pressure",
    }

    for sensor_type, android_name in sensor_map.items():
        stdout, stderr, rc = run_cmd(
            ["termux-sensor", "-s", android_name, "-n", "1"],
            timeout=8
        )
        if rc != 0 or not stdout.strip():
            continue

        try:
            data = json.loads(stdout)
            values = None
            if isinstance(data, dict):
                values = data.get("values") or data.get(android_name, {}).get("values")
            elif isinstance(data, list) and len(data) > 0:
                values = data[0].get("values") if isinstance(data[0], dict) else data

            if values and isinstance(values, list):
                reading = {
                    "sensorType": sensor_type,
                    "timestamp": int(time.time() * 1000),
                    "source": f"kappa-phone/{PHONE_ID}",
                }
                if len(values) >= 3:
                    reading["x"] = float(values[0])
                    reading["y"] = float(values[1])
                    reading["z"] = float(values[2])
                elif len(values) >= 1:
                    reading["value"] = float(values[0])

                readings.append(reading)
                if sensor_type == "magnetometer" and "x" in reading:
                    mag = (reading["x"]**2 + reading["y"]**2 + reading["z"]**2)**0.5
                    print(f"  [{sensor_type}] x={reading['x']:.1f} y={reading['y']:.1f} z={reading['z']:.1f} |B|={mag:.1f} uT")
                elif "value" in reading:
                    print(f"  [{sensor_type}] value={reading['value']:.2f}")
                else:
                    print(f"  [{sensor_type}] x={reading.get('x',0):.2f} y={reading.get('y',0):.2f} z={reading.get('z',0):.2f}")
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            print(f"  [!] {sensor_type} parse error: {e}")

    if readings:
        result = post_json(f"{KAPPA_URL}/api/phone/sensors", {"readings": readings})
        if result:
            print(f"  [+] Sent {result.get('ingested', 0)} sensor readings")

    return readings


def scan_wifi_termux():
    print("[WiFi] Scanning via Termux...")
    stdout, stderr, rc = run_cmd(["termux-wifi-scaninfo"], timeout=15)
    if rc != 0:
        print("  [!] termux-wifi-scaninfo failed")
        return []

    try:
        networks = json.loads(stdout)
    except:
        return []

    events = []
    for net in networks:
        events.append({
            "domain": "wifi",
            "eventType": "beacon",
            "source": f"kappa-phone/{PHONE_ID}",
            "frequency": net.get("frequency_mhz", net.get("frequency", 0)),
            "confidence": max(0, min(100, net.get("level", -80) + 100)),
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "ssid": net.get("ssid", net.get("SSID", "(hidden)")),
                "bssid": net.get("bssid", net.get("BSSID", "")),
                "signalStrength": net.get("level", 0),
                "security": net.get("capabilities", ""),
                "collector": "kappa-phone",
                "phoneId": PHONE_ID,
            }
        })

    for event in events:
        post_json(f"{KAPPA_URL}/api/events", event)

    print(f"  [+] Found {len(events)} WiFi networks")
    return events


def scan_cell_termux():
    print("[Cell] Reading cell tower info...")
    stdout, stderr, rc = run_cmd(["termux-telephony-cellinfo"], timeout=10)
    if rc != 0:
        return []

    try:
        cells = json.loads(stdout)
    except:
        return []

    events = []
    for cell in (cells if isinstance(cells, list) else [cells]):
        cell_type = cell.get("type", "unknown")
        events.append({
            "domain": "lte",
            "eventType": "cell-info",
            "source": f"kappa-phone/{PHONE_ID}",
            "frequency": cell.get("earfcn", cell.get("arfcn", 0)),
            "confidence": 80,
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "cellType": cell_type,
                "mcc": cell.get("mcc", ""),
                "mnc": cell.get("mnc", ""),
                "lac": cell.get("lac", cell.get("tac", "")),
                "cid": cell.get("cid", cell.get("ci", "")),
                "tower_id": str(cell.get("cid", cell.get("ci", ""))),
                "pci": cell.get("pci", ""),
                "rsrp": cell.get("rsrp", cell.get("signal_strength", "")),
                "rsrq": cell.get("rsrq", ""),
                "collector": "kappa-phone",
                "phoneId": PHONE_ID,
            }
        })

    for event in events:
        post_json(f"{KAPPA_URL}/api/events", event)

    print(f"  [+] Found {len(events)} cell towers")
    return events


def scan_location_termux():
    print("[GPS] Getting location...")
    stdout, stderr, rc = run_cmd(["termux-location", "-p", "gps", "-r", "once"], timeout=30)
    if rc != 0:
        stdout, stderr, rc = run_cmd(["termux-location", "-p", "network", "-r", "once"], timeout=15)
    if rc != 0:
        return None

    try:
        loc = json.loads(stdout)
        lat = loc.get("latitude", OBSERVER_LAT)
        lon = loc.get("longitude", OBSERVER_LON)
        alt = loc.get("altitude", 0)
        acc = loc.get("accuracy", 0)
        print(f"  [+] Location: {lat:.6f}, {lon:.6f} (alt={alt:.0f}m, acc={acc:.0f}m)")
        return {"latitude": lat, "longitude": lon, "altitude": alt, "accuracy": acc}
    except:
        return None


def feed_pcapdroid_csv(filepath):
    print(f"[PCAP Droid] Loading: {filepath}")
    if not os.path.exists(filepath):
        print(f"  [!] File not found: {filepath}")
        return

    connections = []
    with open(filepath, "r", errors="replace") as f:
        lines = f.readlines()

    header = None
    for line in lines:
        line = line.strip()
        if not line:
            continue

        if header is None:
            header = [h.strip().lower() for h in line.split(",")]
            continue

        parts = line.split(",")
        if len(parts) < len(header):
            continue

        row = dict(zip(header, parts))
        conn = {
            "timestamp": int(time.time() * 1000),
            "srcIp": row.get("src_ip", row.get("source", "")),
            "dstIp": row.get("dst_ip", row.get("destination", "")),
            "srcPort": int(row.get("src_port", "0") or "0"),
            "dstPort": int(row.get("dst_port", "0") or "0"),
            "protocol": row.get("protocol", row.get("proto", "TCP")),
            "length": int(row.get("bytes", row.get("length", "0")) or "0"),
            "info": row.get("app", row.get("info", "")),
        }
        if conn["srcIp"] and conn["dstIp"]:
            connections.append(conn)

    if not connections:
        print("  [!] No valid connections parsed")
        return

    batch_size = 50
    total_threats = 0
    for i in range(0, len(connections), batch_size):
        batch = connections[i:i+batch_size]
        result = post_json(f"{KAPPA_URL}/api/phone/pcapdroid", {"connections": batch})
        if result:
            threats = result.get("threats", 0)
            total_threats += threats
            if threats > 0:
                print(f"  [!] Batch {i//batch_size+1}: {threats} threats detected")

    print(f"  [+] Processed {len(connections)} connections, {total_threats} threats")


def feed_pcapdroid_live():
    print("[PCAP Droid] Looking for live PCAP Droid dumps...")
    pcap_dirs = [
        "/sdcard/PCAPdroid",
        "/storage/emulated/0/PCAPdroid",
        os.path.expanduser("~/storage/shared/PCAPdroid"),
    ]

    for d in pcap_dirs:
        if os.path.exists(d):
            files = sorted([f for f in os.listdir(d) if f.endswith(".csv") or f.endswith(".txt")],
                           key=lambda f: os.path.getmtime(os.path.join(d, f)), reverse=True)
            if files:
                latest = os.path.join(d, files[0])
                age_s = time.time() - os.path.getmtime(latest)
                if age_s < 300:
                    print(f"  Found recent export: {latest} ({age_s:.0f}s ago)")
                    feed_pcapdroid_csv(latest)
                    return True
                else:
                    print(f"  Found {latest} but it's {age_s:.0f}s old")
    return False


def bridge_kyma(kyma_url):
    print(f"[Kyma Bridge] Pulling from {kyma_url}...")

    frame = get_json(f"{kyma_url}/api/engine/latest")
    if not frame:
        print("  [!] No Kyma frame available")
        return

    result = post_json(f"{KAPPA_URL}/api/kyma/frame", frame)
    if result:
        state = result.get("kymaState", {})
        kappa = result.get("kappaStatus", {})
        corr_count = len(result.get("correlations", []))
        print(f"  [+] Kyma state: {state.get('dominantState','?')} | "
              f"affect: {state.get('affectPrimary','?')} (v={state.get('affectValence',0):.2f}) | "
              f"coherence: {state.get('coherence',0):.3f}")
        print(f"  [+] KAPPA: score={kappa.get('score',0):.1f} threat={kappa.get('threatLevel','?')} | "
              f"{corr_count} correlations")

    affect = get_json(f"{kyma_url}/api/engine/affect")
    if affect and affect.get("timestamp"):
        reading = {
            "timestamp": int(time.time() * 1000),
            "stress": int(affect.get("arousal", 0.3) * 100),
            "mood": int(affect.get("valence", 0.5) * 100),
            "coherence": affect.get("dominance", 0.5),
            "source": "kyma-affect",
        }
        post_json(f"{KAPPA_URL}/api/kyma/reading", reading)
        print(f"  [+] Affect: {affect.get('primaryEmotion','?')} "
              f"(v={affect.get('valence',0):.2f} a={affect.get('arousal',0):.2f})")

    consciousness = get_json(f"{kyma_url}/api/engine/consciousness")
    if consciousness and consciousness.get("timestamp"):
        print(f"  [+] Consciousness: {consciousness.get('level','?')} "
              f"(depth={consciousness.get('depth',0):.2f} meta={consciousness.get('metacognitionScore',0):.2f})")


def run_scan_cycle(capabilities, args):
    print(f"\n{'='*60}")
    print(f"Scan cycle — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")

    if is_termux():
        if "magnetometer" in capabilities or "accelerometer" in capabilities:
            scan_sensors_termux()

        if "wifi-scan" in capabilities:
            scan_wifi_termux()

        if "cell-info" in capabilities:
            scan_cell_termux()

        feed_pcapdroid_live()
    else:
        stdout, stderr, rc = run_cmd(["arp", "-a"], timeout=5)
        if rc == 0:
            for line in stdout.strip().split("\n"):
                m = re.search(r'\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([\w:]+)', line)
                if m:
                    post_json(f"{KAPPA_URL}/api/events", {
                        "domain": "wifi", "eventType": "arp-presence",
                        "source": f"kappa-phone/{PHONE_ID}",
                        "frequency": 0, "confidence": 70,
                        "latitude": OBSERVER_LAT, "longitude": OBSERVER_LON,
                        "metadata": {"ip": m.group(1), "mac": m.group(2), "collector": "kappa-phone"}
                    })

    if args.kyma_url:
        bridge_kyma(args.kyma_url)


def main():
    parser = argparse.ArgumentParser(description="KAPPA Phone Agent — Android/Termux Sensor Collector")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=30, help="Scan interval (default: 30s)")
    parser.add_argument("--url", type=str, help="KAPPA server URL")
    parser.add_argument("--kyma-url", type=str, help="Kyma engine URL for biometric bridge")
    parser.add_argument("--kyma-bridge", action="store_true", help="Enable Kyma bridge mode")
    parser.add_argument("--pcapdroid", type=str, help="Feed PCAP Droid CSV export")
    parser.add_argument("--sensors-only", action="store_true", help="Phone sensors only")
    parser.add_argument("--phone-id", type=str, help="Phone identifier")
    args = parser.parse_args()

    global KAPPA_URL, KYMA_URL, PHONE_ID
    if args.url:
        KAPPA_URL = args.url.rstrip("/")
    if args.kyma_url:
        KYMA_URL = args.kyma_url.rstrip("/")
    if args.phone_id:
        PHONE_ID = args.phone_id

    print("=" * 60)
    print("KAPPA Phone Agent — Multi-Sensor Collector")
    print("=" * 60)
    print(f"Platform: {'Termux/Android' if is_termux() else platform.system()}")
    print(f"Phone ID: {PHONE_ID}")
    print(f"KAPPA:    {KAPPA_URL}")
    if KYMA_URL:
        print(f"Kyma:     {KYMA_URL}")
    print()

    if args.pcapdroid:
        feed_pcapdroid_csv(args.pcapdroid)
        return

    try:
        status = get_json(f"{KAPPA_URL}/api/kappa/status")
        if status:
            print(f"KAPPA online: score={status.get('score',0):.1f}, "
                  f"threat={status.get('threatLevel','?')}, "
                  f"events={status.get('eventsProcessed',0)}")
        else:
            print(f"[!] Cannot reach KAPPA at {KAPPA_URL}")
            sys.exit(1)
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        sys.exit(1)

    capabilities = register_phone()
    print(f"Capabilities: {', '.join(capabilities) if capabilities else 'basic (non-Termux)'}")
    print()

    if args.continuous:
        cycle = 0
        while True:
            cycle += 1
            try:
                run_scan_cycle(capabilities, args)
            except KeyboardInterrupt:
                print("\n[!] Stopped by user")
                break
            except Exception as e:
                print(f"[!] Cycle error: {e}")
            print(f"\nNext scan in {args.interval}s... (Ctrl+C to stop)")
            time.sleep(args.interval)
    else:
        run_scan_cycle(capabilities, args)


if __name__ == "__main__":
    main()
