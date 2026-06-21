"""
Network Scanner — local subnet scan using nmap + socket probing.
Identifies hosts, open ports, MAC vendors.
Flags management interfaces (TR-069, CWMP, Telnet, unusual SSH).
"""
import json
import os
import socket
import subprocess
import time
from datetime import datetime, timezone
from typing import Optional

SCAN_INTERVAL = int(os.getenv("NET_SCAN_INTERVAL", 180))  # seconds

FLAGGED_PORTS = {
    7547: "TR-069 CWMP — ISP remote management (surveillance vector)",
    4567: "TR-069 alternative",
    8291: "Mikrotik Winbox — router admin",
    8728: "Mikrotik API",
    23:   "Telnet — cleartext (legacy or backdoor)",
    2323: "Telnet alternative",
    5555: "Android ADB — debug bridge open",
    5556: "ADB alternate",
    9000: "Supervisord / debug interface",
    8443: "Alt HTTPS management",
    8080: "Alt HTTP — proxy or management",
    4444: "Metasploit default listener",
    1337: "Common backdoor port",
}


def _get_local_subnet() -> Optional[str]:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        parts = ip.split(".")
        return f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"
    except Exception:
        return None


def _nmap_scan(subnet: str) -> list:
    """Run nmap -sn -T4 to discover live hosts, then port-scan each."""
    hosts = []
    try:
        # Host discovery
        result = subprocess.run(
            ["nmap", "-sn", "-T4", "--open", subnet],
            capture_output=True, text=True, timeout=60
        )
        lines = result.stdout.splitlines()
        ips = []
        for line in lines:
            if "Nmap scan report for" in line:
                parts = line.split()
                ip = parts[-1].strip("()")
                ips.append(ip)

        # Port scan each discovered host
        for ip in ips[:20]:  # cap at 20 to be fast
            host = {"ip": ip, "mac": None, "hostname": None,
                    "open_ports": [], "vendor": None}
            try:
                port_result = subprocess.run(
                    ["nmap", "-sV", "-T4", "--open",
                     "-p", "21,22,23,80,443,7547,8080,8291,8443,8728,5555,4444,1337,2323,4567,9000",
                     ip],
                    capture_output=True, text=True, timeout=30
                )
                for pline in port_result.stdout.splitlines():
                    if "/tcp" in pline and "open" in pline:
                        port_num = int(pline.split("/")[0].strip())
                        host["open_ports"].append(port_num)
                    if "MAC Address:" in pline:
                        parts = pline.split("MAC Address:")
                        if len(parts) > 1:
                            mac_parts = parts[1].strip().split(" ", 1)
                            host["mac"] = mac_parts[0]
                            if len(mac_parts) > 1:
                                host["vendor"] = mac_parts[1].strip("()")
            except Exception:
                pass

            try:
                host["hostname"] = socket.gethostbyaddr(ip)[0]
            except Exception:
                pass

            hosts.append(host)
    except FileNotFoundError:
        pass  # nmap not installed
    except Exception as e:
        print(f"[network] nmap error: {e}")
    return hosts


def _socket_scan(subnet: str) -> list:
    """Fallback: socket-based scan of common ports when nmap unavailable."""
    hosts = []
    parts = subnet.split(".")
    base  = ".".join(parts[:3])
    PORTS = [22, 23, 80, 443, 7547, 8080, 8291, 8443, 5555]

    for i in range(1, 255):
        ip = f"{base}.{i}"
        open_ports = []
        for port in PORTS:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.3)
                if s.connect_ex((ip, port)) == 0:
                    open_ports.append(port)
                s.close()
            except Exception:
                pass
        if open_ports:
            hosts.append({"ip": ip, "mac": None, "hostname": None,
                          "open_ports": open_ports, "vendor": None})
    return hosts


def scan_loop(db):
    while True:
        try:
            subnet = _get_local_subnet()
            if not subnet:
                db.log_event("network", "error", "Cannot detect local subnet", severity="info")
                time.sleep(SCAN_INTERVAL)
                continue

            # Try nmap first, fall back to socket scan
            try:
                subprocess.run(["nmap", "--version"], capture_output=True, timeout=5)
                hosts = _nmap_scan(subnet)
            except (FileNotFoundError, subprocess.TimeoutExpired):
                hosts = _socket_scan(subnet)

            flagged = 0
            for h in hosts:
                db.log_host(h["ip"], h["mac"], h["hostname"],
                            h["open_ports"], h["vendor"])
                for port in h["open_ports"]:
                    if port in FLAGGED_PORTS:
                        flagged += 1
                        db.log_event(
                            domain="network",
                            type_="flagged_port",
                            description=f"FLAGGED {h['ip']}:{port} — {FLAGGED_PORTS[port]}",
                            severity="high" if port in (7547, 5555, 4444) else "medium",
                            metadata={"ip": h["ip"], "port": port,
                                      "vendor": h["vendor"], "flag": FLAGGED_PORTS[port]}
                        )

            db.log_event("network", "scan_complete",
                         f"Subnet {subnet}: {len(hosts)} hosts, {flagged} flagged ports",
                         severity="info",
                         metadata={"subnet": subnet, "hosts": len(hosts), "flagged": flagged})
            print(f"[network] {subnet}: {len(hosts)} hosts, {flagged} flagged")

        except Exception as e:
            db.log_event("network", "error", str(e), severity="info")
            print(f"[network] error: {e}")

        time.sleep(SCAN_INTERVAL)
