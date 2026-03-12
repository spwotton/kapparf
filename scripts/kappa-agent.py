#!/usr/bin/env python3
"""
KAPPA Local Agent — Multi-Domain SIGINT Collector
Runs on your laptop to scan WiFi, BLE, and network traffic,
then POSTs events to your deployed KAPPA instance.

Usage:
  python3 kappa-agent.py                    # Run all available scans
  python3 kappa-agent.py --wifi             # WiFi only
  python3 kappa-agent.py --ble              # BLE only
  python3 kappa-agent.py --network          # Network capture only
  python3 kappa-agent.py --continuous       # Run continuously (30s loop)
  python3 kappa-agent.py --url https://...  # Custom KAPPA server URL

Requirements:
  - Python 3.7+
  - No external packages needed (uses stdlib only)
  - For WiFi scanning: iwlist, nmcli, or airport (macOS)
  - For BLE scanning: bluetoothctl or hcitool
  - For network capture: tshark or tcpdump
  - Run with sudo for full hardware access
"""

import subprocess
import json
import sys
import os
import time
import re
import uuid
import platform
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone

KAPPA_URL = os.environ.get("KAPPA_URL", "https://e3c83b39-23b6-4d00-8bcd-067e19790109-00-q2ogrez5zpc7.spock.replit.dev")
OBSERVER_LAT = 9.9836122
OBSERVER_LON = -84.2497059

def post_event(event):
    url = f"{KAPPA_URL}/api/events"
    data = json.dumps(event).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode())
            domain = event.get("domain", "?")
            etype = event.get("eventType", "?")
            print(f"  [+] {domain}/{etype} -> id={result.get('id','?')[:8]}")
            return result
    except urllib.error.HTTPError as e:
        print(f"  [!] HTTP {e.code}: {e.read().decode()[:200]}")
    except urllib.error.URLError as e:
        print(f"  [!] Connection error: {e.reason}")
    except Exception as e:
        print(f"  [!] Error: {e}")
    return None


def which(cmd):
    try:
        result = subprocess.run(["which", cmd], capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except:
        return False


def run_cmd(cmd, timeout=30):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, shell=isinstance(cmd, str))
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "timeout", -1
    except Exception as e:
        return "", str(e), -1


def detect_os():
    system = platform.system().lower()
    if system == "darwin":
        return "macos"
    elif system == "linux":
        return "linux"
    elif system == "windows":
        return "windows"
    return system


def scan_wifi_linux_nmcli():
    stdout, stderr, rc = run_cmd(["nmcli", "-t", "-f", "SSID,BSSID,SIGNAL,FREQ,SECURITY,CHAN", "dev", "wifi", "list", "--rescan", "yes"], timeout=15)
    if rc != 0:
        return []

    events = []
    for line in stdout.strip().split("\n"):
        if not line.strip():
            continue
        parts = line.split(":")
        if len(parts) < 6:
            continue
        ssid = parts[0].strip().replace("\\:", ":")
        bssid = ":".join(parts[1:7]).strip() if len(parts) >= 7 else parts[1].strip()
        remaining = parts[7:] if len(parts) >= 7 else parts[2:]
        signal = remaining[0] if len(remaining) > 0 else ""
        freq = remaining[1] if len(remaining) > 1 else ""
        security = remaining[2] if len(remaining) > 2 else ""
        channel = remaining[3] if len(remaining) > 3 else ""

        freq_mhz = 0
        try:
            freq_mhz = int(re.sub(r'[^\d]', '', freq))
        except:
            pass

        signal_pct = 0
        try:
            signal_pct = int(signal)
        except:
            pass

        events.append({
            "domain": "wifi",
            "eventType": "beacon",
            "source": "kappa-agent/nmcli",
            "frequency": freq_mhz,
            "confidence": min(signal_pct, 100),
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "ssid": ssid or "(hidden)",
                "bssid": bssid,
                "signalStrength": signal_pct,
                "security": security,
                "channel": channel,
                "collector": "kappa-agent",
                "scanMethod": "nmcli"
            }
        })
    return events


def scan_wifi_linux_iwlist():
    stdout, stderr, rc = run_cmd(["sudo", "iwlist", "wlan0", "scan"], timeout=15)
    if rc != 0:
        stdout, stderr, rc = run_cmd(["iwlist", "wlan0", "scan"], timeout=15)
    if rc != 0:
        return []

    events = []
    current = {}
    for line in stdout.split("\n"):
        line = line.strip()
        if line.startswith("Cell"):
            if current.get("bssid"):
                events.append(current)
            bssid_match = re.search(r'Address:\s*([\w:]+)', line)
            current = {"bssid": bssid_match.group(1) if bssid_match else ""}
        elif "ESSID:" in line:
            match = re.search(r'ESSID:"(.*?)"', line)
            current["ssid"] = match.group(1) if match else "(hidden)"
        elif "Frequency:" in line:
            match = re.search(r'Frequency:([\d.]+)\s*GHz', line)
            if match:
                current["freq"] = int(float(match.group(1)) * 1000)
        elif "Signal level=" in line:
            match = re.search(r'Signal level[=:]\s*(-?\d+)', line)
            if match:
                dbm = int(match.group(1))
                current["signal"] = max(0, min(100, 2 * (dbm + 100)))
        elif "Channel:" in line:
            match = re.search(r'Channel:(\d+)', line)
            if match:
                current["channel"] = match.group(1)

    if current.get("bssid"):
        events.append(current)

    return [{
        "domain": "wifi",
        "eventType": "beacon",
        "source": "kappa-agent/iwlist",
        "frequency": e.get("freq", 0),
        "confidence": e.get("signal", 50),
        "latitude": OBSERVER_LAT,
        "longitude": OBSERVER_LON,
        "metadata": {
            "ssid": e.get("ssid", "(hidden)"),
            "bssid": e.get("bssid", ""),
            "signalStrength": e.get("signal", 0),
            "channel": e.get("channel", ""),
            "collector": "kappa-agent",
            "scanMethod": "iwlist"
        }
    } for e in events]


def scan_wifi_macos():
    stdout, stderr, rc = run_cmd(["/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport", "-s"], timeout=15)
    if rc != 0:
        return []

    events = []
    lines = stdout.strip().split("\n")
    if len(lines) < 2:
        return []

    for line in lines[1:]:
        match = re.match(r'\s*(.+?)\s+([\w:]{17})\s+(-?\d+)\s+(\d+(?:,[\+\-]\d+)?)\s+\w+\s+\w+\s+(\S+)', line)
        if not match:
            continue
        ssid = match.group(1).strip()
        bssid = match.group(2)
        rssi = int(match.group(3))
        channel = match.group(4)
        security = match.group(5)
        signal_pct = max(0, min(100, 2 * (rssi + 100)))

        events.append({
            "domain": "wifi",
            "eventType": "beacon",
            "source": "kappa-agent/airport",
            "frequency": 0,
            "confidence": signal_pct,
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "ssid": ssid or "(hidden)",
                "bssid": bssid,
                "signalStrength": signal_pct,
                "rssi": rssi,
                "channel": channel,
                "security": security,
                "collector": "kappa-agent",
                "scanMethod": "airport"
            }
        })
    return events


def scan_wifi():
    print("[WiFi] Scanning...")
    os_type = detect_os()

    if os_type == "macos":
        events = scan_wifi_macos()
        if events:
            return events

    if which("nmcli"):
        events = scan_wifi_linux_nmcli()
        if events:
            return events

    if which("iwlist"):
        events = scan_wifi_linux_iwlist()
        if events:
            return events

    print("  [!] No WiFi scanning tools found (need nmcli, iwlist, or macOS airport)")
    return []


def scan_ble_bluetoothctl():
    run_cmd(["bluetoothctl", "power", "on"], timeout=5)
    run_cmd(["bluetoothctl", "scan", "on"], timeout=8)
    time.sleep(5)
    run_cmd(["bluetoothctl", "scan", "off"], timeout=5)

    stdout, stderr, rc = run_cmd(["bluetoothctl", "devices"], timeout=5)
    if rc != 0:
        return []

    events = []
    for line in stdout.strip().split("\n"):
        match = re.match(r'Device\s+([\w:]+)\s+(.*)', line.strip())
        if not match:
            continue
        mac = match.group(1)
        name = match.group(2).strip()

        events.append({
            "domain": "ble",
            "eventType": "advertisement",
            "source": "kappa-agent/bluetoothctl",
            "frequency": 2400,
            "confidence": 60,
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "mac": mac,
                "deviceName": name,
                "collector": "kappa-agent",
                "scanMethod": "bluetoothctl"
            }
        })
    return events


def scan_ble_hcitool():
    stdout, stderr, rc = run_cmd(["sudo", "hcitool", "lescan", "--duplicates"], timeout=10)
    if rc != 0:
        stdout, stderr, rc = run_cmd(["hcitool", "lescan"], timeout=10)
    if rc != 0:
        return []

    events = []
    seen = set()
    for line in stdout.strip().split("\n"):
        match = re.match(r'([\w:]{17})\s+(.*)', line.strip())
        if not match:
            continue
        mac = match.group(1)
        name = match.group(2).strip()
        if mac in seen:
            continue
        seen.add(mac)

        events.append({
            "domain": "ble",
            "eventType": "advertisement",
            "source": "kappa-agent/hcitool",
            "frequency": 2400,
            "confidence": 60,
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "mac": mac,
                "deviceName": name or "(unknown)",
                "collector": "kappa-agent",
                "scanMethod": "hcitool"
            }
        })
    return events


def scan_ble():
    print("[BLE] Scanning...")

    if which("bluetoothctl"):
        events = scan_ble_bluetoothctl()
        if events:
            return events

    if which("hcitool"):
        events = scan_ble_hcitool()
        if events:
            return events

    print("  [!] No BLE scanning tools found (need bluetoothctl or hcitool)")
    return []


def scan_network_tshark():
    print("[Network] Capturing with tshark (10s)...")
    stdout, stderr, rc = run_cmd(
        ["tshark", "-i", "any", "-a", "duration:10", "-T", "json",
         "-e", "ip.src", "-e", "ip.dst", "-e", "tcp.dstport", "-e", "udp.dstport",
         "-e", "dns.qry.name", "-e", "frame.protocols", "-e", "frame.len",
         "-Y", "dns or tcp.flags.syn==1"],
        timeout=20
    )

    if rc != 0:
        stdout, stderr, rc = run_cmd(
            ["sudo", "tshark", "-i", "any", "-a", "duration:10", "-T", "json",
             "-e", "ip.src", "-e", "ip.dst", "-e", "tcp.dstport", "-e", "udp.dstport",
             "-e", "dns.qry.name", "-e", "frame.protocols", "-e", "frame.len",
             "-Y", "dns or tcp.flags.syn==1"],
            timeout=20
        )

    if rc != 0:
        return []

    try:
        packets = json.loads(stdout)
    except:
        return []

    events = []
    dns_seen = set()
    conn_seen = set()

    for pkt in packets:
        layers = pkt.get("_source", {}).get("layers", {})
        src = layers.get("ip.src", [""])[0] if isinstance(layers.get("ip.src"), list) else layers.get("ip.src", "")
        dst = layers.get("ip.dst", [""])[0] if isinstance(layers.get("ip.dst"), list) else layers.get("ip.dst", "")
        dns_name = layers.get("dns.qry.name", [""])[0] if isinstance(layers.get("dns.qry.name"), list) else layers.get("dns.qry.name", "")
        tcp_port = layers.get("tcp.dstport", [""])[0] if isinstance(layers.get("tcp.dstport"), list) else layers.get("tcp.dstport", "")
        protocols = layers.get("frame.protocols", [""])[0] if isinstance(layers.get("frame.protocols"), list) else layers.get("frame.protocols", "")

        if dns_name and dns_name not in dns_seen:
            dns_seen.add(dns_name)
            events.append({
                "domain": "isp",
                "eventType": "dns-query",
                "source": "kappa-agent/tshark",
                "frequency": 53,
                "confidence": 90,
                "latitude": OBSERVER_LAT,
                "longitude": OBSERVER_LON,
                "metadata": {
                    "dnsQuery": dns_name,
                    "srcIp": src,
                    "dstIp": dst,
                    "protocols": protocols,
                    "collector": "kappa-agent",
                    "scanMethod": "tshark"
                }
            })
        elif tcp_port and f"{dst}:{tcp_port}" not in conn_seen:
            conn_seen.add(f"{dst}:{tcp_port}")
            events.append({
                "domain": "isp",
                "eventType": "tcp-connection",
                "source": "kappa-agent/tshark",
                "frequency": int(tcp_port) if tcp_port.isdigit() else 0,
                "confidence": 85,
                "latitude": OBSERVER_LAT,
                "longitude": OBSERVER_LON,
                "metadata": {
                    "srcIp": src,
                    "dstIp": dst,
                    "dstPort": tcp_port,
                    "protocols": protocols,
                    "collector": "kappa-agent",
                    "scanMethod": "tshark"
                }
            })

    return events


def scan_network_tcpdump():
    print("[Network] Capturing with tcpdump (10s)...")
    stdout, stderr, rc = run_cmd(
        ["sudo", "tcpdump", "-i", "any", "-c", "100", "-nn", "-l", "--immediate-mode"],
        timeout=15
    )
    if rc != 0:
        return []

    events = []
    conn_seen = set()
    for line in stdout.strip().split("\n")[:50]:
        match = re.search(r'(\d+\.\d+\.\d+\.\d+)\.(\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)\.(\d+)', line)
        if not match:
            continue
        src_ip = match.group(1)
        src_port = match.group(2)
        dst_ip = match.group(3)
        dst_port = match.group(4)
        key = f"{dst_ip}:{dst_port}"
        if key in conn_seen:
            continue
        conn_seen.add(key)

        events.append({
            "domain": "isp",
            "eventType": "packet-capture",
            "source": "kappa-agent/tcpdump",
            "frequency": int(dst_port),
            "confidence": 80,
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "srcIp": src_ip,
                "srcPort": src_port,
                "dstIp": dst_ip,
                "dstPort": dst_port,
                "collector": "kappa-agent",
                "scanMethod": "tcpdump"
            }
        })
    return events


def scan_network():
    if which("tshark"):
        events = scan_network_tshark()
        if events:
            return events

    if which("tcpdump"):
        events = scan_network_tcpdump()
        if events:
            return events

    print("  [!] No network capture tools found (need tshark or tcpdump)")
    return []


def scan_active_connections():
    print("[Network] Scanning active connections...")
    stdout, stderr, rc = run_cmd(["ss", "-tunp"], timeout=5)
    if rc != 0:
        stdout, stderr, rc = run_cmd(["netstat", "-tunp"], timeout=5)
    if rc != 0:
        return []

    events = []
    seen = set()
    for line in stdout.strip().split("\n")[1:]:
        parts = line.split()
        if len(parts) < 5:
            continue
        proto = parts[0]
        remote = parts[4] if len(parts) > 4 else ""
        match = re.match(r'([\d.]+):(\d+)', remote)
        if not match:
            match = re.match(r'\[?([\da-f:]+)\]?:(\d+)', remote)
        if not match:
            continue
        ip = match.group(1)
        port = match.group(2)
        key = f"{ip}:{port}"
        if key in seen or ip.startswith("127.") or ip == "0.0.0.0":
            continue
        seen.add(key)

        events.append({
            "domain": "isp",
            "eventType": "active-connection",
            "source": "kappa-agent/ss",
            "frequency": int(port),
            "confidence": 95,
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "remoteIp": ip,
                "remotePort": port,
                "protocol": proto,
                "collector": "kappa-agent",
                "scanMethod": "ss"
            }
        })
    return events[:30]


def scan_arp():
    print("[Network] Scanning ARP table...")
    stdout, stderr, rc = run_cmd(["arp", "-a"], timeout=5)
    if rc != 0:
        return []

    events = []
    for line in stdout.strip().split("\n"):
        match = re.search(r'\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([\w:]+)', line)
        if not match:
            match = re.search(r'(\d+\.\d+\.\d+\.\d+)\s+([\w-]+)', line)
        if not match:
            continue
        ip = match.group(1)
        mac = match.group(2)
        if mac in ("(incomplete)", "<incomplete>", "ff:ff:ff:ff:ff:ff"):
            continue

        events.append({
            "domain": "wifi",
            "eventType": "arp-neighbor",
            "source": "kappa-agent/arp",
            "frequency": 0,
            "confidence": 90,
            "latitude": OBSERVER_LAT,
            "longitude": OBSERVER_LON,
            "metadata": {
                "ip": ip,
                "mac": mac,
                "collector": "kappa-agent",
                "scanMethod": "arp"
            }
        })
    return events


def check_tools():
    print("=" * 60)
    print("KAPPA Local Agent — Multi-Domain SIGINT Collector")
    print("=" * 60)
    print(f"OS: {platform.system()} {platform.release()}")
    print(f"Target: {KAPPA_URL}")
    print(f"Observer: {OBSERVER_LAT}, {OBSERVER_LON}")
    print()

    tools = {
        "nmcli": which("nmcli"),
        "iwlist": which("iwlist"),
        "bluetoothctl": which("bluetoothctl"),
        "hcitool": which("hcitool"),
        "tshark": which("tshark"),
        "tcpdump": which("tcpdump"),
        "ss": which("ss"),
        "arp": which("arp"),
    }

    if detect_os() == "macos":
        tools["airport"] = os.path.exists("/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport")

    print("Available tools:")
    for tool, available in tools.items():
        status = "OK" if available else "not found"
        print(f"  {tool}: {status}")
    print()

    return tools


def run_scan(scan_wifi_flag=True, scan_ble_flag=True, scan_net_flag=True):
    all_events = []

    if scan_wifi_flag:
        wifi_events = scan_wifi()
        print(f"  Found {len(wifi_events)} WiFi networks")
        all_events.extend(wifi_events)

        arp_events = scan_arp()
        print(f"  Found {len(arp_events)} ARP neighbors")
        all_events.extend(arp_events)

    if scan_ble_flag:
        ble_events = scan_ble()
        print(f"  Found {len(ble_events)} BLE devices")
        all_events.extend(ble_events)

    if scan_net_flag:
        net_events = scan_network()
        print(f"  Found {len(net_events)} network events")
        all_events.extend(net_events)

        conn_events = scan_active_connections()
        print(f"  Found {len(conn_events)} active connections")
        all_events.extend(conn_events)

    print(f"\nTotal events: {len(all_events)}")

    if all_events:
        print("Sending to KAPPA...")
        success = 0
        for event in all_events:
            result = post_event(event)
            if result:
                success += 1
        print(f"Sent {success}/{len(all_events)} events successfully")

    return all_events


def main():
    parser = argparse.ArgumentParser(description="KAPPA Local Agent — Multi-Domain SIGINT Collector")
    parser.add_argument("--wifi", action="store_true", help="WiFi scan only")
    parser.add_argument("--ble", action="store_true", help="BLE scan only")
    parser.add_argument("--network", action="store_true", help="Network capture only")
    parser.add_argument("--continuous", action="store_true", help="Run continuously (30s interval)")
    parser.add_argument("--interval", type=int, default=30, help="Scan interval in seconds (default: 30)")
    parser.add_argument("--url", type=str, help="KAPPA server URL")
    parser.add_argument("--lat", type=float, help="Observer latitude")
    parser.add_argument("--lon", type=float, help="Observer longitude")
    args = parser.parse_args()

    global KAPPA_URL, OBSERVER_LAT, OBSERVER_LON
    if args.url:
        KAPPA_URL = args.url.rstrip("/")
    if args.lat:
        OBSERVER_LAT = args.lat
    if args.lon:
        OBSERVER_LON = args.lon

    scan_all = not (args.wifi or args.ble or args.network)

    tools = check_tools()

    try:
        req = urllib.request.Request(f"{KAPPA_URL}/api/kappa/status", method="GET")
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = json.loads(resp.read().decode())
            print(f"KAPPA Status: score={status.get('score',0):.1f}, threat={status.get('threatLevel','?')}, events={status.get('eventsProcessed',0)}")
    except Exception as e:
        print(f"[!] Cannot reach KAPPA at {KAPPA_URL}: {e}")
        print("    Set --url or KAPPA_URL environment variable")
        sys.exit(1)

    print()

    if args.continuous:
        cycle = 0
        while True:
            cycle += 1
            print(f"\n{'='*60}")
            print(f"Scan cycle #{cycle} — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*60}")
            run_scan(
                scan_wifi_flag=scan_all or args.wifi,
                scan_ble_flag=scan_all or args.ble,
                scan_net_flag=scan_all or args.network
            )
            print(f"\nNext scan in {args.interval}s... (Ctrl+C to stop)")
            time.sleep(args.interval)
    else:
        run_scan(
            scan_wifi_flag=scan_all or args.wifi,
            scan_ble_flag=scan_all or args.ble,
            scan_net_flag=scan_all or args.network
        )


if __name__ == "__main__":
    main()
