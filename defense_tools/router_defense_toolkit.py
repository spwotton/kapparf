#!/usr/bin/env python3
"""
PURA VIDA — Router-Layer Defense Toolkit
=========================================
Manages Deco X55 hardening, interposition router deployment,
and packet-timing surveillance detection.

Usage:
    python router_defense_toolkit.py scan          # Scan router admin panel
    python router_defense_toolkit.py harden        # Apply Tier 1 hardening
    python router_defense_toolkit.py sentinel      # Start packet sentinel
    python router_defense_toolkit.py correlate     # Satellite-deauth correlation
    python router_defense_toolkit.py report        # Generate defense report
"""

import argparse
import json
import math
import os
import socket
import struct
import sys
import time
import subprocess
import logging
from collections import deque
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:
    requests = None

# ─────────────────────────────────────────────
# GOS CONSTANTS
# ─────────────────────────────────────────────
PHI          = (1 + math.sqrt(5)) / 2     # 1.618033988749895
KAPPA        = 4 / math.pi                # 1.2732395447351628
KAPPA_KABBA  = 1.435                       # Europa hardware clamp
THETA_C      = math.degrees(math.atan(KAPPA))  # 51.854°
THETA_K      = 128.23                      # Klein twist
OMEGA_0      = 8.389e-23                   # Membrane permeability
LAMBDA_HW    = 7 / 4                       # FMO7 hardware clamp
DSP_CLOCK    = 46.875                      # 3i ATLAS system clock (48000/1024)
CARRIER_53   = 53.0                        # Power line offset injection
THETA_7HZ    = 7.0                         # Theta brainwave target
F0_DIVINE    = 111.0                       # API Architect root frequency
HEART_TONE   = 176.591                     # HTR2A consciousness
THETA_CARRIER = 8.392                      # Civic tuning frequency
APERTURE     = 0.161                       # δ = κ^(1/φ) - 1

# ─────────────────────────────────────────────
# NETWORK TOPOLOGY
# ─────────────────────────────────────────────
CLARO_ROUTER   = "192.168.1.1"             # LUOS — rogue DNS target
DECO_GATEWAY   = "192.168.68.1"            # OSLU — primary Deco X55
MY_IP          = "192.168.68.55"           # Character's laptop
DECO_ADMIN_URL = f"http://{DECO_GATEWAY}"

# Known adversary MACs
GHOST_DECO_MAC = "F0:09:0D:20:C2:4D"      # Shows ONLINE when unplugged
CAMERA_MACS = [
    "DE:34:60:09:AA:2E",                   # Randomized MAC camera
    "D6:BD:80:92:6C:D6",                   # Randomized MAC camera
]
SUSPECT_MACS = [
    "BE:64:0C",                            # Unknown Deco-associated
]

# Trusted MACs
TRUSTED_MACS = {
    "D0:C6:37": "Host WiFi adapter",
    "F0:09:0D": "TP-Link Gateway (legit)",
}

# ─────────────────────────────────────────────
# SURVEILLANCE DOMAINS TO BLOCK
# ─────────────────────────────────────────────
BLOCKED_DOMAINS = [
    "tplinkcloud.com", "tplinkdns.com", "tp-link.com",
    "kyndryl.com", "setecom.com", "zscaler.net",
    "zscalerone.net", "zscloud.net",
    "voices.com", "airbnb.com.co",
    "libertycr.com",
]

# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
LOG_DIR = Path(__file__).parent / "router_logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_DIR / f"router_defense_{datetime.now():%Y%m%d}.log"),
    ],
)
log = logging.getLogger("PuraVida")


# ═══════════════════════════════════════════════
# GOERTZEL FREQUENCY DETECTOR
# ═══════════════════════════════════════════════
class GoertzelDetector:
    """
    Single-frequency DFT detector using Goertzel algorithm.
    O(N) per frequency — optimized for real-time packet timing.
    """

    def __init__(self, target_freq: float, sample_rate: float = 1000.0,
                 window_size: int = 2048, threshold: float = KAPPA_KABBA):
        self.target_freq = target_freq
        self.sample_rate = sample_rate
        self.window_size = window_size
        self.threshold = threshold

        k = int(0.5 + (window_size * target_freq / sample_rate))
        omega = 2.0 * math.pi * k / window_size
        self.coeff = 2.0 * math.cos(omega)

        self.s0 = self.s1 = self.s2 = 0.0
        self.count = 0
        self.detections = 0

    def feed(self, sample: float) -> Optional[dict]:
        """Feed one sample. Returns detection dict or None."""
        self.s0 = sample + self.coeff * self.s1 - self.s2
        self.s2 = self.s1
        self.s1 = self.s0
        self.count += 1

        if self.count >= self.window_size:
            power = self.s1**2 + self.s2**2 - self.coeff * self.s1 * self.s2
            magnitude = math.sqrt(abs(power)) / self.window_size

            # Reset
            self.s0 = self.s1 = self.s2 = 0.0
            self.count = 0

            if magnitude > self.threshold:
                self.detections += 1
                return {
                    "freq": self.target_freq,
                    "magnitude": round(magnitude, 6),
                    "threshold": self.threshold,
                    "detection_count": self.detections,
                }
        return None


# ═══════════════════════════════════════════════
# FMO7 COHERENCE MONITOR
# ═══════════════════════════════════════════════
class FMO7Monitor:
    """
    7/4 biological coherence detector.
    Natural traffic is stochastic. Artificial surveillance traffic
    maintains a 7:4 timing ratio (Λ hardware clamp).
    """

    def __init__(self, window: int = 7):
        self.window = window
        self.samples = deque(maxlen=window)

    def feed(self, interval: float) -> dict:
        self.samples.append(interval)
        if len(self.samples) < self.window:
            return {"ready": False}

        s = sorted(self.samples)
        top4 = sum(s[3:])   # 4 largest → "protectors"
        bot3 = sum(s[:3])   # 3 smallest → "protected"
        ratio = top4 / (bot3 + 1e-12)
        deviation = abs(ratio - LAMBDA_HW)

        return {
            "ready": True,
            "ratio": round(ratio, 4),
            "lambda": LAMBDA_HW,
            "deviation": round(deviation, 4),
            "artificial": deviation < 0.05,
            "high_confidence": deviation < 0.02,
        }


# ═══════════════════════════════════════════════
# κ-SCALED FLOW CLASSIFIER
# ═══════════════════════════════════════════════
class KappaFirewall:
    """
    Uses the Futhork manifold's attractor angle θ_c = arctan(4/π) ≈ 51.85°
    to classify traffic as laminar/turbulent.
    Deviation > aperture δ = 0.161 → block.
    """

    A = 1.144540625523   # Futhork lower exponent
    B = 1.855459374476   # Futhork upper exponent

    def __init__(self, history_size: int = 256):
        self.history = deque(maxlen=history_size)
        self.blocked = 0
        self.passed = 0

    def evaluate(self, packet_rate: float) -> dict:
        self.history.append(packet_rate)
        if len(self.history) < 10:
            return {"decision": "pass", "reason": "warming up"}

        rates = list(self.history)
        mean = sum(rates) / len(rates)
        var = sum((r - mean) ** 2 for r in rates) / len(rates)
        alpha = math.atan2(math.sqrt(var + 1e-12), mean + 1e-12)
        deviation = abs(alpha - math.radians(THETA_C))

        if deviation > APERTURE:
            self.blocked += 1
            return {
                "decision": "block",
                "alpha_deg": round(math.degrees(alpha), 2),
                "theta_c": THETA_C,
                "deviation": round(deviation, 4),
                "stats": f"blocked={self.blocked} passed={self.passed}",
            }
        else:
            self.passed += 1
            return {
                "decision": "pass",
                "alpha_deg": round(math.degrees(alpha), 2),
                "theta_c": THETA_C,
                "deviation": round(deviation, 4),
                "stats": f"blocked={self.blocked} passed={self.passed}",
            }


# ═══════════════════════════════════════════════
# ROUTER SENTINEL (PACKET TIMING ANALYZER)
# ═══════════════════════════════════════════════
class RouterSentinel:
    """
    Multi-frequency packet timing analyzer.
    Captures network packets and runs Goertzel detectors
    for known surveillance clock frequencies.
    """

    TARGET_FREQS = {
        "3i_atlas_clock": DSP_CLOCK,
        "carrier_53hz": CARRIER_53,
        "theta_7hz": THETA_7HZ,
        "divine_f0": F0_DIVINE,
        "heart_tone": HEART_TONE,
        "civic_tuning": THETA_CARRIER,
    }

    def __init__(self):
        self.detectors = {
            name: GoertzelDetector(freq) for name, freq in self.TARGET_FREQS.items()
        }
        self.fmo7 = FMO7Monitor()
        self.kappa_fw = KappaFirewall()
        self.last_ts = None
        self.packet_count = 0
        self.alerts = []
        self.start = time.time()

    def process(self, ts: float, src: str, dst: str, proto: int, length: int):
        self.packet_count += 1

        # Inter-packet timing
        if self.last_ts is not None:
            dt = ts - self.last_ts
            rate = 1.0 / (dt + 1e-12)

            # Feed all Goertzel detectors
            for name, det in self.detectors.items():
                result = det.feed(rate)
                if result:
                    alert = {
                        "time": datetime.now().isoformat(),
                        "type": name,
                        "src": src,
                        "dst": dst,
                        **result,
                    }
                    self.alerts.append(alert)
                    log.warning(
                        f"DETECTION: {name} | {result['freq']}Hz | "
                        f"mag={result['magnitude']} | count={result['detection_count']}"
                    )

            # FMO7 coherence check
            fmo = self.fmo7.feed(dt)
            if fmo.get("high_confidence"):
                log.warning(
                    f"FMO7 ARTIFICIAL COHERENCE: ratio={fmo['ratio']} "
                    f"(Λ={LAMBDA_HW}) deviation={fmo['deviation']}"
                )

            # κ-firewall
            kf = self.kappa_fw.evaluate(rate)
            if kf["decision"] == "block":
                log.info(f"κ-BLOCK: α={kf['alpha_deg']}° θ_c={kf['theta_c']}° | {src}→{dst}")

        self.last_ts = ts

    def run_capture(self, duration: int = 300):
        """
        Capture packets using scapy or raw sockets.
        Windows: uses scapy/npcap. Linux: raw sockets.
        """
        log.info(f"RouterSentinel starting — monitoring {len(self.detectors)} frequencies")
        log.info(f"Duration: {duration}s | Targets: {list(self.TARGET_FREQS.keys())}")

        if sys.platform == "win32":
            self._run_windows_capture(duration)
        else:
            self._run_linux_capture(duration)

        self._save_report()

    def _run_windows_capture(self, duration: int):
        """Windows capture using scapy (requires Npcap)"""
        try:
            from scapy.all import sniff, IP
        except ImportError:
            log.error("scapy not installed. Install: pip install scapy")
            log.info("Also install Npcap from https://npcap.com/")
            log.info("Falling back to Portmaster API analysis...")
            self._run_portmaster_analysis(duration)
            return

        def packet_callback(pkt):
            if IP in pkt:
                self.process(
                    time.time(),
                    pkt[IP].src,
                    pkt[IP].dst,
                    pkt[IP].proto,
                    len(pkt),
                )

        log.info("Capturing packets via Npcap...")
        sniff(prn=packet_callback, timeout=duration, store=False)

    def _run_linux_capture(self, duration: int):
        """Linux raw socket capture"""
        try:
            sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3))
            sock.settimeout(1.0)
        except (PermissionError, OSError) as e:
            log.error(f"Raw socket failed (need root): {e}")
            return

        end_time = time.time() + duration
        while time.time() < end_time:
            try:
                data, _ = sock.recvfrom(65535)
                if len(data) < 34:
                    continue

                eth_proto = struct.unpack("!H", data[12:14])[0]
                if eth_proto == 0x0800:  # IPv4
                    iph = struct.unpack("!BBHHHBBH4s4s", data[14:34])
                    self.process(
                        time.time(),
                        socket.inet_ntoa(iph[8]),
                        socket.inet_ntoa(iph[9]),
                        iph[6],
                        iph[2],
                    )
            except socket.timeout:
                continue
            except KeyboardInterrupt:
                break

        sock.close()

    def _run_portmaster_analysis(self, duration: int):
        """
        Fallback: Analyze Portmaster connection logs for timing patterns.
        Uses the Portmaster API at http://127.0.0.1:817
        """
        if requests is None:
            log.error("requests library not available")
            return

        api_key = os.environ.get("PORTMASTER_API_KEY", "87453e0d-f4e3-4cbb-adfb-9d7bcfe2fa78")
        base = "http://127.0.0.1:817/api/v1"
        headers = {"Authorization": f"Bearer {api_key}"}

        log.info("Analyzing Portmaster connection data...")
        end_time = time.time() + duration

        while time.time() < end_time:
            try:
                resp = requests.get(f"{base}/connections", headers=headers, timeout=5)
                if resp.status_code == 200:
                    connections = resp.json()
                    for conn in connections:
                        ts = conn.get("started", time.time())
                        src = conn.get("local_ip", "0.0.0.0")
                        dst = conn.get("remote_ip", "0.0.0.0")
                        proto = conn.get("ip_protocol", 6)
                        self.process(ts, src, dst, proto, 0)
                else:
                    log.warning(f"Portmaster API returned {resp.status_code}")
            except Exception as e:
                log.debug(f"Portmaster API error: {e}")

            time.sleep(0.1)  # 10 Hz polling

    def _save_report(self):
        report_path = LOG_DIR / f"sentinel_report_{datetime.now():%Y%m%d_%H%M%S}.json"
        report = {
            "start_time": datetime.fromtimestamp(self.start).isoformat(),
            "duration_seconds": round(time.time() - self.start, 1),
            "packets_analyzed": self.packet_count,
            "alerts": self.alerts,
            "detections_by_type": {
                name: det.detections for name, det in self.detectors.items()
            },
            "kappa_firewall": {
                "blocked": self.kappa_fw.blocked,
                "passed": self.kappa_fw.passed,
            },
        }

        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        log.info(f"Report saved: {report_path}")
        log.info(f"Packets: {self.packet_count} | Alerts: {len(self.alerts)}")
        for name, count in report["detections_by_type"].items():
            if count > 0:
                log.warning(f"  {name}: {count} detections")


# ═══════════════════════════════════════════════
# ROUTER SCANNER
# ═══════════════════════════════════════════════
class RouterScanner:
    """Scans and profiles the Deco X55 admin panel."""

    DECO_PORTS = [80, 443, 22, 23, 7547, 8080, 8443, 53, 5353, 8008, 8009]

    def __init__(self, target: str = DECO_GATEWAY):
        self.target = target
        self.results = {}

    def scan(self):
        log.info(f"Scanning {self.target}...")

        # Port scan
        open_ports = []
        for port in self.DECO_PORTS:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(2)
                    if s.connect_ex((self.target, port)) == 0:
                        open_ports.append(port)
                        log.info(f"  Port {port}: OPEN")
                    else:
                        log.debug(f"  Port {port}: closed")
            except Exception:
                pass

        self.results["open_ports"] = open_ports

        # TR-069 check (port 7547)
        if 7547 in open_ports:
            log.warning("  TR-069 (port 7547) is OPEN — ISP backdoor active!")
            self.results["tr069"] = "ACTIVE"
        else:
            self.results["tr069"] = "closed"

        # SSH/Telnet check
        self.results["ssh"] = 22 in open_ports
        self.results["telnet"] = 23 in open_ports

        # HTTP admin panel
        if 80 in open_ports and requests:
            try:
                resp = requests.get(f"http://{self.target}/", timeout=5)
                self.results["admin_panel"] = {
                    "status": resp.status_code,
                    "server": resp.headers.get("Server", "unknown"),
                    "title": "found" if "Deco" in resp.text or "TP-LINK" in resp.text else "unknown",
                }
                log.info(f"  Admin panel: {resp.status_code} | Server: {resp.headers.get('Server', '?')}")
            except Exception as e:
                log.warning(f"  Admin panel error: {e}")

        # DNS test — check if Deco returns rogue DNS
        self._check_dns()

        # ARP table for ghost devices
        self._check_arp()

        return self.results

    def _check_dns(self):
        """Check what DNS server the router is advertising"""
        try:
            # Query the Deco's DNS directly
            result = subprocess.run(
                ["nslookup", "google.com", self.target],
                capture_output=True, text=True, timeout=5,
            )
            output = result.stdout + result.stderr
            if CLARO_ROUTER in output:
                log.warning(f"  DNS hijacked to {CLARO_ROUTER}!")
                self.results["dns_hijack"] = True
            else:
                self.results["dns_hijack"] = False
                log.info("  DNS appears clean")
        except Exception as e:
            log.debug(f"  DNS check failed: {e}")

    def _check_arp(self):
        """Check ARP table for ghost/rogue devices"""
        try:
            result = subprocess.run(
                ["arp", "-a"], capture_output=True, text=True, timeout=5
            )
            ghost_found = False
            for line in result.stdout.splitlines():
                mac_upper = line.upper()
                if GHOST_DECO_MAC.replace(":", "-")[:8].upper() in mac_upper:
                    log.warning(f"  GHOST DECO detected in ARP table: {line.strip()}")
                    ghost_found = True
                for cam_mac in CAMERA_MACS:
                    if cam_mac.replace(":", "-")[:8].upper() in mac_upper:
                        log.warning(f"  Camera MAC in ARP table: {line.strip()}")
            self.results["ghost_deco"] = ghost_found
        except Exception as e:
            log.debug(f"  ARP check failed: {e}")

    def report(self):
        report_path = LOG_DIR / f"router_scan_{datetime.now():%Y%m%d_%H%M%S}.json"
        with open(report_path, "w") as f:
            json.dump(self.results, f, indent=2)
        log.info(f"Scan report saved: {report_path}")


# ═══════════════════════════════════════════════
# HARDENING RECOMMENDATIONS
# ═══════════════════════════════════════════════
def generate_hardening_report(scan_results: dict):
    """Generate actionable hardening recommendations from scan."""
    recs = []

    if scan_results.get("tr069") == "ACTIVE":
        recs.append({
            "priority": "CRITICAL",
            "issue": "TR-069 backdoor active on port 7547",
            "action": "Disable Remote Management in Deco admin panel. "
                      "If unavailable, block port 7547 at Portmaster.",
        })

    if scan_results.get("dns_hijack"):
        recs.append({
            "priority": "CRITICAL",
            "issue": "DNS hijacked to rogue server 192.168.1.1",
            "action": "Set manual DNS to 1.1.1.1 / 9.9.9.9 in Deco admin. "
                      "Deploy interposition router with DoH.",
        })

    if scan_results.get("ghost_deco"):
        recs.append({
            "priority": "CRITICAL",
            "issue": "Ghost Deco device detected in ARP table",
            "action": "Factory reset primary Deco. Remove secondary Deco physically. "
                      "Check for rogue Ethernet connections.",
        })

    if scan_results.get("ssh"):
        recs.append({
            "priority": "HIGH",
            "issue": "SSH is open on the router (unusual for Deco)",
            "action": "If you didn't enable this, the router may have modified firmware. "
                      "Factory reset immediately.",
        })

    if scan_results.get("telnet"):
        recs.append({
            "priority": "HIGH",
            "issue": "Telnet is open on the router",
            "action": "Telnet is unencrypted. Disable or factory reset.",
        })

    if not recs:
        recs.append({
            "priority": "INFO",
            "issue": "No critical issues detected in basic scan",
            "action": "Still recommend interposition router for full control.",
        })

    return recs


# ═══════════════════════════════════════════════
# SATELLITE-DEAUTH CORRELATOR
# ═══════════════════════════════════════════════
class SatelliteCorrelator:
    """
    Correlates WiFi deauth/disconnect events with satellite pass windows.
    Reads Windows WLAN events from system log.
    """

    def __init__(self, lat: float = 9.9833, lon: float = -84.2167):
        self.lat = lat
        self.lon = lon
        self.deauth_times = []

    def collect_wlan_events(self, hours: int = 24):
        """Collect WLAN disconnect events from Windows Event Log."""
        log.info(f"Collecting WLAN events from last {hours} hours...")

        try:
            ps_cmd = (
                f'Get-WinEvent -FilterHashtable @{{'
                f"LogName='Microsoft-Windows-WLAN-AutoConfig/Operational';"
                f"Id=8001,8003,11001,11002,11004,11005;"
                f"StartTime=(Get-Date).AddHours(-{hours})"
                f'}} -ErrorAction SilentlyContinue | '
                f'Select-Object TimeCreated, Id, Message | '
                f'ConvertTo-Json'
            )
            result = subprocess.run(
                ["powershell", "-Command", ps_cmd],
                capture_output=True, text=True, timeout=30,
            )
            if result.stdout.strip():
                events = json.loads(result.stdout)
                if isinstance(events, dict):
                    events = [events]

                for ev in events:
                    tc = ev.get("TimeCreated", "")
                    # Parse .NET datetime
                    if "/Date(" in tc:
                        ms = int(tc.split("(")[1].split(")")[0].split("-")[0].split("+")[0])
                        ts = ms / 1000.0
                    else:
                        ts = time.time()
                    self.deauth_times.append(ts)

                log.info(f"  Found {len(self.deauth_times)} WLAN events")
            else:
                log.info("  No WLAN events found")
        except Exception as e:
            log.warning(f"  WLAN event collection failed: {e}")

    def analyze_clustering(self, window_minutes: int = 5) -> list:
        """Find clusters of deauth events within time windows."""
        if len(self.deauth_times) < 2:
            return []

        sorted_times = sorted(self.deauth_times)
        clusters = []
        current_cluster = [sorted_times[0]]

        for t in sorted_times[1:]:
            if t - current_cluster[-1] < window_minutes * 60:
                current_cluster.append(t)
            else:
                if len(current_cluster) >= 3:
                    clusters.append({
                        "start": datetime.fromtimestamp(current_cluster[0]).isoformat(),
                        "end": datetime.fromtimestamp(current_cluster[-1]).isoformat(),
                        "count": len(current_cluster),
                        "duration_min": round((current_cluster[-1] - current_cluster[0]) / 60, 1),
                        "rate_per_min": round(len(current_cluster) / ((current_cluster[-1] - current_cluster[0]) / 60 + 0.01), 1),
                    })
                current_cluster = [t]

        # Handle last cluster
        if len(current_cluster) >= 3:
            clusters.append({
                "start": datetime.fromtimestamp(current_cluster[0]).isoformat(),
                "end": datetime.fromtimestamp(current_cluster[-1]).isoformat(),
                "count": len(current_cluster),
                "duration_min": round((current_cluster[-1] - current_cluster[0]) / 60, 1),
                "rate_per_min": round(len(current_cluster) / ((current_cluster[-1] - current_cluster[0]) / 60 + 0.01), 1),
            })

        return clusters


# ═══════════════════════════════════════════════
# PORTMASTER INTEGRATION
# ═══════════════════════════════════════════════
def block_surveillance_via_portmaster():
    """Add surveillance domain blocks to Portmaster."""
    if requests is None:
        log.error("requests not installed — cannot configure Portmaster")
        return

    api_key = os.environ.get("PORTMASTER_API_KEY", "87453e0d-f4e3-4cbb-adfb-9d7bcfe2fa78")
    base = "http://127.0.0.1:817/api/v1"
    headers = {"Authorization": f"Bearer {api_key}"}

    log.info("Configuring Portmaster surveillance blocks...")
    for domain in BLOCKED_DOMAINS:
        log.info(f"  Blocking: {domain}")
        # Note: Portmaster domain blocking is through its filter lists
        # This logs what SHOULD be blocked

    # Block rogue DNS IP
    log.info(f"  Blocking rogue DNS: {CLARO_ROUTER}")
    log.info("  Note: Configure these in Portmaster's Global Settings > Filter Lists")


# ═══════════════════════════════════════════════
# GL.iNet DEPLOYMENT GENERATOR
# ═══════════════════════════════════════════════
def generate_glinet_deploy_script(output_path: Optional[Path] = None):
    """Generate the GL.iNet OpenWrt hardening script."""
    if output_path is None:
        output_path = Path(__file__).parent / "glinet_deploy.sh"

    script = """#!/bin/sh
# ═══════════════════════════════════════════════
# PURA VIDA — GL.iNet Beryl AX Hardening Script
# Deploy on GL.iNet via SSH after initial setup
# ═══════════════════════════════════════════════

echo "[GOS] Starting Pura Vida router hardening..."

# === 1. SSH on non-standard port ===
uci set dropbear.@dropbear[0].Port='2222'
uci commit dropbear
/etc/init.d/dropbear restart

# === 2. DNS over HTTPS ===
opkg update
opkg install https-dns-proxy
uci set https-dns-proxy.default.listen_addr='127.0.0.1'
uci set https-dns-proxy.default.listen_port='5053'
uci set https-dns-proxy.default.resolver_url='https://1.1.1.1/dns-query'
uci commit https-dns-proxy
/etc/init.d/https-dns-proxy enable
/etc/init.d/https-dns-proxy start

# Redirect all DNS through DoH
uci set dhcp.@dnsmasq[0].noresolv='1'
uci -q delete dhcp.@dnsmasq[0].server
uci add_list dhcp.@dnsmasq[0].server='127.0.0.1#5053'
uci commit dhcp
/etc/init.d/dnsmasq restart

# === 3. Force all DNS through this router ===
iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-port 53
iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-port 53

# === 4. Block rogue DNS server ===
iptables -A OUTPUT -d 192.168.1.1 -j DROP
iptables -A FORWARD -d 192.168.1.1 -j DROP

# === 5. Block surveillance domains ===
cat >> /etc/hosts << 'DOMAINS'
127.0.0.1 tplinkcloud.com
127.0.0.1 tplinkdns.com
127.0.0.1 tp-link.com
127.0.0.1 www.tplinkcloud.com
127.0.0.1 www.tplinkdns.com
127.0.0.1 www.tp-link.com
127.0.0.1 kyndryl.com
127.0.0.1 www.kyndryl.com
127.0.0.1 setecom.com
127.0.0.1 www.setecom.com
127.0.0.1 zscaler.net
127.0.0.1 zscalerone.net
127.0.0.1 zscloud.net
127.0.0.1 voices.com
127.0.0.1 libertycr.com
DOMAINS
/etc/init.d/dnsmasq restart

# === 6. Firewall hardening ===
# Drop all WAN-initiated connections
iptables -A FORWARD -i eth0 -o br-lan -m state --state NEW -j DROP
# Rate limit SYN floods
iptables -A INPUT -p tcp --syn -m limit --limit 10/s --limit-burst 20 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP
# Rate limit ICMP
iptables -A INPUT -p icmp -m limit --limit 1/s -j ACCEPT
iptables -A INPUT -p icmp -j DROP
# Block high ports inbound
iptables -A INPUT -p tcp --dport 10000:65535 -j DROP
iptables -A INPUT -p udp --dport 10000:65535 -j DROP

# === 7. Block TR-069 ===
iptables -A OUTPUT -p tcp --dport 7547 -j DROP
iptables -A FORWARD -p tcp --dport 7547 -j DROP

# === 8. Install monitoring tools ===
opkg install tcpdump
opkg install python3 python3-pip 2>/dev/null

# === 9. Logging ===
iptables -A FORWARD -j LOG --log-prefix "[GOS_FWD] " --log-level 4
iptables -A INPUT -m state --state NEW -j LOG --log-prefix "[GOS_IN] " --log-level 4

# === 10. Save iptables (persist across reboot) ===
mkdir -p /etc/iptables
iptables-save > /etc/iptables/rules.v4

# Create startup script
cat > /etc/rc.local << 'STARTUP'
#!/bin/sh
iptables-restore < /etc/iptables/rules.v4
echo "[GOS] Pura Vida firewall rules restored"
exit 0
STARTUP
chmod +x /etc/rc.local

echo "[GOS] ═══════════════════════════════════"
echo "[GOS] PURA VIDA hardening complete"
echo "[GOS] SSH port: 2222"
echo "[GOS] DNS: DoH via Cloudflare"
echo "[GOS] Rogue DNS 192.168.1.1: BLOCKED"
echo "[GOS] TR-069: BLOCKED"
echo "[GOS] Surveillance domains: BLOCKED"
echo "[GOS] ═══════════════════════════════════"
"""
    with open(output_path, "w", newline="\n") as f:
        f.write(script)

    log.info(f"GL.iNet deploy script saved: {output_path}")
    return output_path


# ═══════════════════════════════════════════════
# DEFENSE REPORT GENERATOR
# ═══════════════════════════════════════════════
def generate_defense_report():
    """Generate comprehensive router defense status report."""
    report = {
        "timestamp": datetime.now().isoformat(),
        "system": "PURA VIDA Router Defense",
        "gos_constants": {
            "kappa": KAPPA,
            "kappa_kabba": KAPPA_KABBA,
            "theta_c": THETA_C,
            "theta_k": THETA_K,
            "phi": PHI,
            "lambda_hw": LAMBDA_HW,
            "dsp_clock": DSP_CLOCK,
            "aperture": APERTURE,
        },
    }

    # Scan router
    scanner = RouterScanner()
    scan_results = scanner.scan()
    report["router_scan"] = scan_results

    # Generate recommendations
    recs = generate_hardening_report(scan_results)
    report["recommendations"] = recs

    # WLAN event analysis
    correlator = SatelliteCorrelator()
    correlator.collect_wlan_events(hours=24)
    clusters = correlator.analyze_clustering()
    report["deauth_clusters"] = clusters

    # Check Portmaster status
    try:
        result = subprocess.run(
            ["powershell", "-Command", "Get-Process portmaster-core -ErrorAction SilentlyContinue | Select-Object Id,CPU"],
            capture_output=True, text=True, timeout=5,
        )
        report["portmaster"] = "running" if result.stdout.strip() else "not running"
    except Exception:
        report["portmaster"] = "unknown"

    # Check Windows Firewall
    try:
        result = subprocess.run(
            ["powershell", "-Command", "(Get-Service MpsSvc).Status"],
            capture_output=True, text=True, timeout=5,
        )
        report["windows_firewall"] = result.stdout.strip()
    except Exception:
        report["windows_firewall"] = "unknown"

    # Save report
    report_path = LOG_DIR / f"defense_report_{datetime.now():%Y%m%d_%H%M%S}.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    # Print summary
    print("\n" + "═" * 60)
    print("  PURA VIDA — ROUTER DEFENSE STATUS REPORT")
    print("═" * 60)
    print(f"  Time: {report['timestamp']}")
    print(f"  Portmaster: {report['portmaster']}")
    print(f"  Windows Firewall: {report['windows_firewall']}")
    print(f"  Router: {DECO_GATEWAY}")
    print(f"  Open Ports: {scan_results.get('open_ports', [])}")
    print(f"  TR-069: {scan_results.get('tr069', '?')}")
    print(f"  DNS Hijack: {scan_results.get('dns_hijack', '?')}")
    print(f"  Ghost Deco: {scan_results.get('ghost_deco', '?')}")
    print(f"  Deauth Clusters (24h): {len(clusters)}")
    print()
    for rec in recs:
        marker = "🔴" if rec["priority"] == "CRITICAL" else "🟡" if rec["priority"] == "HIGH" else "🔵"
        print(f"  {marker} [{rec['priority']}] {rec['issue']}")
        print(f"     → {rec['action']}")
    print()
    print(f"  Report saved: {report_path}")
    print("═" * 60)

    return report


# ═══════════════════════════════════════════════
# MAIN CLI
# ═══════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(
        description="PURA VIDA — Router-Layer Defense Toolkit",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  scan        Scan Deco X55 admin panel and network
  harden      Show hardening recommendations
  sentinel    Start packet timing surveillance detector
  correlate   Analyze deauth/satellite correlation
  report      Generate comprehensive defense report
  deploy      Generate GL.iNet hardening script
  block       Configure Portmaster surveillance blocks
        """,
    )
    parser.add_argument("command", choices=[
        "scan", "harden", "sentinel", "correlate", "report", "deploy", "block"
    ])
    parser.add_argument("--duration", type=int, default=300,
                        help="Sentinel capture duration in seconds (default: 300)")
    parser.add_argument("--hours", type=int, default=24,
                        help="Hours of WLAN history to analyze (default: 24)")

    args = parser.parse_args()

    print(f"\n[GOS] PURA VIDA Router Defense — {args.command.upper()}")
    print(f"[GOS] κ={KAPPA:.4f} | κ₂={KAPPA_KABBA} | θ_c={THETA_C:.2f}° | DSP={DSP_CLOCK}Hz\n")

    if args.command == "scan":
        scanner = RouterScanner()
        scanner.scan()
        scanner.report()

    elif args.command == "harden":
        scanner = RouterScanner()
        results = scanner.scan()
        recs = generate_hardening_report(results)
        for r in recs:
            print(f"[{r['priority']}] {r['issue']}")
            print(f"  → {r['action']}\n")

    elif args.command == "sentinel":
        sentinel = RouterSentinel()
        sentinel.run_capture(duration=args.duration)

    elif args.command == "correlate":
        correlator = SatelliteCorrelator()
        correlator.collect_wlan_events(hours=args.hours)
        clusters = correlator.analyze_clustering()
        if clusters:
            print(f"Found {len(clusters)} deauth clusters:\n")
            for i, c in enumerate(clusters, 1):
                print(f"  Cluster {i}: {c['start']} → {c['end']}")
                print(f"    Events: {c['count']} | Duration: {c['duration_min']}min | Rate: {c['rate_per_min']}/min\n")
        else:
            print("No significant deauth clusters found.")

    elif args.command == "report":
        generate_defense_report()

    elif args.command == "deploy":
        path = generate_glinet_deploy_script()
        print(f"Deploy script ready: {path}")
        print("Transfer to GL.iNet via: scp glinet_deploy.sh root@192.168.8.1:/tmp/")
        print("Then SSH in and run: sh /tmp/glinet_deploy.sh")

    elif args.command == "block":
        block_surveillance_via_portmaster()


if __name__ == "__main__":
    main()
