import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { KarachiModule, FinSpyIntelBrief, FinSpyHardwareModule, FinSpyInfraModule, AlexanderplatzProtocol, AirbnbGhostVector, PartytownThreat, KyndrylZscalerProfile, FinSpyDeliverable } from "@shared/schema";
import {
  ArrowRight, VolumeX, Eye, Gamepad2, EyeOff, Search, Zap, Shield, Orbit, Bug, Cpu, Monitor,
  ExternalLink, Ghost, Tv, Globe, ShieldAlert, Terminal, AlertTriangle, Server, Wifi,
  Activity, Radio, Download, Copy, Check, Network, Radar, CircleDot, RefreshCw,
  Fingerprint, ScanLine, Target, Crosshair
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const domainColors: Record<string, string> = {
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  rf: "bg-green-500/10 text-green-700 dark:text-green-400",
  morse: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  wifi: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  ble: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  lte: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const categoryColors: Record<string, string> = {
  spoofing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  injection: "bg-red-500/10 text-red-700 dark:text-red-400",
  "flow-analysis": "bg-green-500/10 text-green-700 dark:text-green-400",
  orbital: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  exploit: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  kernel: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  system: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

const categoryIcons: Record<string, typeof Shield> = {
  spoofing: Zap, injection: Zap, "flow-analysis": Search,
  orbital: Orbit, exploit: Bug, kernel: Cpu, system: Monitor,
};

const categoryGroupOrder = [
  { key: "spoofing-injection", categories: ["spoofing", "injection"], label: "karachi.spoofing" as const },
  { key: "flow-analysis", categories: ["flow-analysis"], label: "karachi.flowAnalysis" as const },
  { key: "orbital", categories: ["orbital"], label: "karachi.orbital" as const },
  { key: "exploit", categories: ["exploit"], label: "karachi.exploit" as const },
  { key: "kernel-system", categories: ["kernel", "system"], label: "karachi.kernel" as const },
];

function ThreatSeverityBar({ severity }: { severity: number }) {
  const color = severity >= 80 ? "bg-red-500" : severity >= 50 ? "bg-amber-500" : severity >= 30 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${severity}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{severity}</span>
    </div>
  );
}

function LiveOpsPanel() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: scannerStatus, isLoading: scannerLoading } = useQuery<{
    running: boolean;
    packetsProcessed: number;
    threatsDetected: number;
    lastPacketTime: number | null;
    recentThreats: Array<{
      timestamp: number;
      type: string;
      severity: number;
      indicator: string;
      description: string;
      packet: { srcIp: string; dstIp: string; srcPort: number | null; dstPort: number | null; protocol: string };
    }>;
    ipHitCounts: Record<string, number>;
    portHitCounts: Record<string, number>;
    protocolAnomalies: number;
    voiceCorrelations: number;
    c2Beacons: number;
  }>({ queryKey: ["/api/threat-scanner/status"], refetchInterval: 5000 });

  const { data: kappaStatus } = useQuery<{
    score: number;
    threatLevel: string;
    devicesTracked: number;
    suspiciousDevices: number;
    stingrayAlerts: number;
    phiHarmonics: number;
    recentAlerts: Array<{ type: string; timestamp: number; score: number; description: string }>;
  }>({ queryKey: ["/api/kappa/status"], refetchInterval: 5000 });

  const { data: devices } = useQuery<Array<{
    id: string;
    mac: string | null;
    domains: string[];
    firstSeen: number;
    lastSeen: number;
    eventCount: number;
    suspicious: boolean;
    crossDomainCount: number;
  }>>({ queryKey: ["/api/devices"], refetchInterval: 10000 });

  const { data: watchdog } = useQuery<{
    running: boolean;
    networkActive: boolean;
    dropCount: number;
    reconnectCount: number;
    tr069PulseCount: number;
    seismicJitterCount: number;
    avgLatencyMs: number;
  }>({ queryKey: ["/api/watchdog/status"], refetchInterval: 5000 });

  const suspiciousDevices = (devices || []).filter(d => d.suspicious);
  const recentThreats = scannerStatus?.recentThreats?.slice(0, 15) || [];
  const kappaAlerts = kappaStatus?.recentAlerts?.slice(0, 10) || [];

  const agentScript = `#!/usr/bin/env python3
# KAPPA Agent — Download and run on your PC
# Usage: python3 kappa-agent.py --continuous --url YOUR_KAPPA_URL
# Requires: Python 3.7+, tshark/tcpdump (for network capture)
# Run with: sudo python3 kappa-agent.py --continuous

import subprocess, json, sys, os, time, re, uuid, platform, argparse
import urllib.request, urllib.error
from datetime import datetime, timezone

# SET YOUR KAPPA URL HERE:
KAPPA_URL = "${window.location.origin}"
OBSERVER_LAT = 10.0513892
OBSERVER_LON = -84.2186578

def post_event(event):
    url = f"{KAPPA_URL}/api/events"
    data = json.dumps(event).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type":"application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            r = json.loads(resp.read().decode())
            print(f"  [+] {event.get('domain','?')}/{event.get('eventType','?')} -> id={r.get('id','?')[:8]}")
    except Exception as e:
        print(f"  [!] Error: {e}")

def post_packets(lines):
    url = f"{KAPPA_URL}/api/threat-scanner/pcap-text"
    data = json.dumps({"lines": lines}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type":"application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            r = json.loads(resp.read().decode())
            print(f"  [+] Sent {r.get('parsed',0)} packets, {r.get('threats',0)} threats detected")
    except Exception as e:
        print(f"  [!] Error: {e}")

def scan_network(duration=10):
    print(f"[NET] Capturing {duration}s of traffic...")
    for cmd in [["tshark","-a",f"duration:{duration}","-T","fields","-e","frame.time_epoch",
                 "-e","ip.src","-e","ip.dst","-e","tcp.srcport","-e","tcp.dstport","-e","frame.protocols",
                 "-e","frame.len","-e","_ws.col.Info"],
                ["tcpdump","-c","200","-nn","-l","-q"]]:
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=duration+5)
            if result.returncode == 0 and result.stdout.strip():
                lines = [l for l in result.stdout.strip().split("\\n") if l.strip()]
                post_packets(lines)
                return
        except: pass
    print("  [!] No capture tools found (need tshark or tcpdump)")

def scan_wifi():
    print("[WiFi] Scanning...")
    system = platform.system().lower()
    if system == "darwin":
        stdout,_,rc = subprocess.run(["/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport","-s"],capture_output=True,text=True,timeout=15).stdout,"",0
    elif system == "linux":
        r = subprocess.run(["nmcli","-t","-f","SSID,BSSID,SIGNAL,FREQ,SECURITY,CHAN","dev","wifi","list","--rescan","yes"],capture_output=True,text=True,timeout=15)
        for line in r.stdout.strip().split("\\n"):
            parts = line.split(":")
            if len(parts) >= 6:
                post_event({"domain":"wifi","eventType":"beacon","source":"kappa-agent",
                    "frequency":int(re.sub(r'[^\\d]','',parts[3] if len(parts)>3 else "0") or "0"),
                    "confidence":min(int(parts[2] or "0"),100),
                    "latitude":OBSERVER_LAT,"longitude":OBSERVER_LON,
                    "metadata":{"ssid":parts[0] or "(hidden)","bssid":":".join(parts[1:7]) if len(parts)>=7 else parts[1],
                        "collector":"kappa-agent"}})
    elif system == "windows":
        r = subprocess.run(["netsh","wlan","show","networks","mode=Bssid"],capture_output=True,text=True,timeout=15)
        ssid,bssid,signal = "","",0
        for line in r.stdout.split("\\n"):
            if "SSID" in line and "BSSID" not in line:
                ssid = line.split(":",1)[1].strip() if ":" in line else ""
            elif "BSSID" in line:
                bssid = line.split(":",1)[1].strip() if ":" in line else ""
            elif "Signal" in line:
                m = re.search(r'(\\d+)', line)
                signal = int(m.group(1)) if m else 0
                if bssid:
                    post_event({"domain":"wifi","eventType":"beacon","source":"kappa-agent/netsh",
                        "frequency":2400,"confidence":signal,
                        "latitude":OBSERVER_LAT,"longitude":OBSERVER_LON,
                        "metadata":{"ssid":ssid or "(hidden)","bssid":bssid,"signalStrength":signal,
                            "collector":"kappa-agent"}})
                    ssid,bssid,signal = "","",0

def scan_arp():
    print("[ARP] Scanning local network...")
    r = subprocess.run(["arp","-a"],capture_output=True,text=True,timeout=10)
    for line in r.stdout.strip().split("\\n"):
        m = re.search(r'\\(([\\d.]+)\\)\\s+at\\s+([\\w:]+)', line)
        if not m: m = re.search(r'([\\d.]+)\\s+([\\w:-]+)', line)
        if m:
            post_event({"domain":"wifi","eventType":"arp-presence","source":"kappa-agent/arp",
                "frequency":0,"confidence":70,
                "latitude":OBSERVER_LAT,"longitude":OBSERVER_LON,
                "metadata":{"ip":m.group(1),"mac":m.group(2),"collector":"kappa-agent"}})

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="KAPPA Local Agent")
    parser.add_argument("--continuous", action="store_true", help="Run continuously (30s loop)")
    parser.add_argument("--wifi", action="store_true", help="WiFi scan only")
    parser.add_argument("--network", action="store_true", help="Network capture only")
    parser.add_argument("--arp", action="store_true", help="ARP scan only")
    parser.add_argument("--url", type=str, help="KAPPA server URL")
    parser.add_argument("--duration", type=int, default=10, help="Network capture duration")
    args = parser.parse_args()
    if args.url: KAPPA_URL = args.url
    print(f"KAPPA Agent -> {KAPPA_URL}")
    while True:
        if args.wifi or not (args.network or args.arp): scan_wifi()
        if args.arp or not (args.wifi or args.network): scan_arp()
        if args.network or not (args.wifi or args.arp): scan_network(args.duration)
        if not args.continuous: break
        print(f"[LOOP] Sleeping 30s...")
        time.sleep(30)
`;

  const copyAgentScript = () => {
    navigator.clipboard.writeText(agentScript);
    setCopied(true);
    toast({ title: "Copied", description: "Agent script copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card data-testid="stat-packets">
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono">{scannerStatus?.packetsProcessed ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">Packets Processed</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-threats">
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-red-500">{scannerStatus?.threatsDetected ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">Threats Detected</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-devices">
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono">{kappaStatus?.devicesTracked ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">Devices Tracked</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-suspicious">
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-amber-500">{kappaStatus?.suspiciousDevices ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">Suspicious</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-kappa">
          <CardContent className="py-3 text-center">
            <div className={`text-lg font-bold font-mono ${(kappaStatus?.score ?? 0) > 60 ? "text-red-500" : (kappaStatus?.score ?? 0) > 30 ? "text-amber-500" : "text-green-500"}`}>
              {(kappaStatus?.score ?? 0).toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">κ Score</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-network">
          <CardContent className="py-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <div className={`h-2 w-2 rounded-full ${watchdog?.networkActive ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm font-mono">{watchdog?.avgLatencyMs ?? 0}ms</span>
            </div>
            <div className="text-[10px] text-muted-foreground">Network ({watchdog?.dropCount ?? 0} drops)</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-recent-threats">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Live Threat Feed
              {scannerStatus?.lastPacketTime && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  Last: {new Date(scannerStatus.lastPacketTime).toLocaleTimeString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentThreats.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No threats detected yet</p>
                <p className="text-[10px] mt-1">Deploy the KAPPA Agent on your PC to start scanning</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentThreats.map((t, i) => (
                  <div key={i} className="border rounded-lg p-2 space-y-1" data-testid={`threat-${i}`}>
                    <div className="flex items-center justify-between">
                      <Badge className={t.severity >= 70 ? "bg-red-500/10 text-red-500" : t.severity >= 40 ? "bg-amber-500/10 text-amber-500" : "bg-yellow-500/10 text-yellow-500"}>
                        {t.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <ThreatSeverityBar severity={t.severity} />
                    <p className="text-[11px] text-muted-foreground">{t.description}</p>
                    <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>{t.packet.srcIp}:{t.packet.srcPort}</span>
                      <span>→</span>
                      <span>{t.packet.dstIp}:{t.packet.dstPort}</span>
                      <span className="ml-auto">{t.packet.protocol}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-kappa-alerts">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-amber-500" />
              KAPPA Correlation Alerts
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {kappaStatus?.threatLevel ?? "NOMINAL"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kappaAlerts.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Correlation engine monitoring</p>
                <p className="text-[10px] mt-1">
                  {kappaStatus?.phiHarmonics ?? 0} φ-harmonics | {kappaStatus?.stingrayAlerts ?? 0} stingray alerts
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {kappaAlerts.map((a, i) => (
                  <div key={i} className="border rounded-lg p-2 space-y-1" data-testid={`alert-${i}`}>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono">{a.type}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <ThreatSeverityBar severity={a.score} />
                    <p className="text-[11px] text-muted-foreground">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {suspiciousDevices.length > 0 && (
        <Card data-testid="card-suspicious-devices">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-red-500" />
              Suspicious Devices (Cross-Domain)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suspiciousDevices.slice(0, 20).map((d, i) => (
                <div key={i} className="border rounded-lg p-2 flex items-center justify-between" data-testid={`device-suspicious-${i}`}>
                  <div>
                    <span className="text-xs font-mono">{d.mac || d.id}</span>
                    <div className="flex gap-1 mt-1">
                      {d.domains.map(dom => (
                        <Badge key={dom} variant="secondary" className={`text-[9px] ${domainColors[dom] || ""}`}>{dom}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">{d.eventCount} events</div>
                    <div className="text-[10px] text-muted-foreground">{d.crossDomainCount} cross-domain</div>
                    <div className="text-[10px] text-muted-foreground">
                      Last: {new Date(d.lastSeen).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card data-testid="card-ip-hits">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono">IP Hit Counts</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(scannerStatus?.ipHitCounts || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No IP hits yet</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {Object.entries(scannerStatus?.ipHitCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([ip, count]) => (
                  <div key={ip} className="flex justify-between text-[11px] font-mono">
                    <span className="text-red-400">{ip}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-port-hits">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono">Port Hit Counts</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(scannerStatus?.portHitCounts || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No port hits yet</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {Object.entries(scannerStatus?.portHitCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([port, count]) => (
                  <div key={port} className="flex justify-between text-[11px] font-mono">
                    <span className="text-amber-400">:{port}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-anomalies">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono">Detection Counters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Protocol Anomalies</span>
              <span className="font-mono">{scannerStatus?.protocolAnomalies ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Voice Correlations</span>
              <span className="font-mono">{scannerStatus?.voiceCorrelations ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">C2 Beacons</span>
              <span className="font-mono">{scannerStatus?.c2Beacons ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">TR-069 Pulses</span>
              <span className="font-mono">{watchdog?.tr069PulseCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Network Drops</span>
              <span className="font-mono">{watchdog?.dropCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Reconnects</span>
              <span className="font-mono">{watchdog?.reconnectCount ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-deploy-agent" className="border-green-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4 text-green-500" />
            Deploy KAPPA Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Run this Python script on your local PC to feed real WiFi, BLE, ARP, and network capture data into KAPPA.
            It uses only Python standard library — no pip install needed. For network capture, install tshark or tcpdump.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="border rounded p-2">
              <div className="font-medium mb-1">Windows</div>
              <code className="text-[10px] text-muted-foreground">python kappa-agent.py --continuous</code>
              <p className="text-[10px] text-muted-foreground mt-1">Uses netsh for WiFi, arp for devices. Install Wireshark for tshark.</p>
            </div>
            <div className="border rounded p-2">
              <div className="font-medium mb-1">macOS</div>
              <code className="text-[10px] text-muted-foreground">sudo python3 kappa-agent.py --continuous</code>
              <p className="text-[10px] text-muted-foreground mt-1">Uses airport for WiFi. sudo needed for network capture.</p>
            </div>
            <div className="border rounded p-2">
              <div className="font-medium mb-1">Linux</div>
              <code className="text-[10px] text-muted-foreground">sudo python3 kappa-agent.py --continuous</code>
              <p className="text-[10px] text-muted-foreground mt-1">Uses nmcli/iwlist for WiFi, bluetoothctl for BLE.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={copyAgentScript} data-testid="button-copy-agent">
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy Agent Script"}
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => {
              const blob = new Blob([agentScript], { type: "text/x-python" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "kappa-agent.py"; a.click();
              URL.revokeObjectURL(url);
            }} data-testid="button-download-agent">
              <Download className="h-3 w-3 mr-1" /> Download kappa-agent.py
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            Target: {window.location.origin} | Observer: 10.0514°N 84.2187°W | Scan interval: 30s
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KarachiPage() {
  const { t } = useI18n();

  const { data: modules, isLoading } = useQuery<KarachiModule[]>({
    queryKey: ["/api/karachi/modules"],
  });

  interface FinSpyIntelResponse {
    intel: FinSpyIntelBrief;
    hardwareModules: FinSpyHardwareModule[];
    infraModules: FinSpyInfraModule[];
    alexanderplatz: AlexanderplatzProtocol;
    airbnbGhost: AirbnbGhostVector;
    partytown: PartytownThreat;
    kyndrylProfile: KyndrylZscalerProfile;
    v2Deliverables: FinSpyDeliverable[];
  }

  const { data: finspy, isLoading: finspyLoading } = useQuery<FinSpyIntelResponse>({
    queryKey: ["/api/finspy/intel"],
  });

  const executionSteps = [
    { num: 1, title: t("karachi.detection"), desc: t("karachi.detectionDesc"), module: "KYANOS-REVERSE" },
    { num: 2, title: t("karachi.response"), desc: t("karachi.responseDesc"), module: "LTESNIFFER-NG" },
    { num: 3, title: t("karachi.persistence"), desc: t("karachi.persistenceDesc"), module: "DSE-WEBNET-RCE" },
    { num: 4, title: t("karachi.corruption"), desc: t("karachi.corruptionDesc"), module: "SATINTEL-SPOOF" },
    { num: 5, title: t("karachi.injection"), desc: t("karachi.injectionDesc"), module: "SATINTEL-SPOOF" },
  ];

  const successCriteria = [
    { key: "silence", title: t("karachi.silence"), desc: t("karachi.silenceDesc"), icon: VolumeX },
    { key: "visibility", title: t("karachi.visibility"), desc: t("karachi.visibilityDesc"), icon: Eye },
    { key: "control", title: t("karachi.control"), desc: t("karachi.controlDesc"), icon: Gamepad2 },
    { key: "blindness", title: t("karachi.blindness"), desc: t("karachi.blindnessDesc"), icon: EyeOff },
  ];

  const groupedModules = categoryGroupOrder.map((group) => ({
    ...group,
    modules: (modules ?? []).filter((m) => group.categories.includes(m.category)),
  })).filter((g) => g.modules.length > 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {t("karachi.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
          {t("karachi.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="ops" data-testid="tabs-karachi">
        <TabsList>
          <TabsTrigger value="ops" data-testid="tab-ops">
            <Activity className="h-3.5 w-3.5 mr-1.5" /> Live Operations
          </TabsTrigger>
          <TabsTrigger value="modules" data-testid="tab-modules">
            <Shield className="h-3.5 w-3.5 mr-1.5" /> Modules
          </TabsTrigger>
          <TabsTrigger value="finspy" data-testid="tab-finspy">
            <Ghost className="h-3.5 w-3.5 mr-1.5" /> FinSpy Intel
          </TabsTrigger>
          <TabsTrigger value="airbnb" data-testid="tab-airbnb">
            <Tv className="h-3.5 w-3.5 mr-1.5" /> Airbnb Ghost
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ops" className="mt-4">
          <LiveOpsPanel />
        </TabsContent>

        <TabsContent value="modules" className="mt-4 space-y-6">
          <div>
            <h2 className="text-sm font-medium mb-3" data-testid="text-execution-flow-heading">
              {t("karachi.executionFlow")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {executionSteps.map((step, i) => (
                <div key={step.num} className="flex items-start gap-2" data-testid={`step-execution-${step.num}`}>
                  <Card className="flex-1">
                    <CardContent className="py-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-mono font-semibold">
                          {step.num}
                        </span>
                        <span className="text-sm font-medium">{step.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                      <Badge variant="secondary" className="text-[10px] font-mono">{step.module}</Badge>
                    </CardContent>
                  </Card>
                  {i < executionSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-5 hidden sm:block flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium mb-3" data-testid="text-core-modules-heading">
              {t("karachi.coreModules")}
            </h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedModules.map((group) => (
                  <div key={group.key} data-testid={`group-category-${group.key}`}>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {t(group.label)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.modules.map((mod) => {
                        const CatIcon = categoryIcons[mod.category] || Shield;
                        return (
                          <Card key={mod.id} data-testid={`card-module-${mod.id}`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <CatIcon className="h-4 w-4 text-muted-foreground" />
                                  <CardTitle className="text-sm font-medium">{mod.name}</CardTitle>
                                </div>
                                <Badge className={categoryColors[mod.category] || "bg-muted"} data-testid={`badge-category-${mod.id}`}>
                                  {mod.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">{mod.codename}</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm">{mod.purpose}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {mod.domains.map((d) => (
                                  <Badge key={d} variant="secondary" className={`text-[10px] ${domainColors[d] || ""}`} data-testid={`badge-domain-${mod.id}-${d}`}>
                                    {d.toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                              {mod.base && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-muted-foreground">{t("karachi.base")}:</span>
                                  <span className="font-mono flex items-center gap-1">
                                    {mod.base}
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="text-xs text-muted-foreground">{t("karachi.capabilities")}:</span>
                                <div className="flex gap-1.5 mt-1 flex-wrap">
                                  {mod.capabilities.map((cap) => (
                                    <Badge key={cap} variant="outline" className="text-[10px]" data-testid={`badge-capability-${mod.id}`}>
                                      {cap}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-xs">
                                <span className="text-muted-foreground">{t("karachi.useCase")}:</span>{" "}
                                <span>{mod.useCase}</span>
                              </div>
                              {mod.target && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{t("karachi.target")}:</span>{" "}
                                  <span className="font-mono">{mod.target}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium mb-3" data-testid="text-success-criteria-heading">
              {t("karachi.successCriteria")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {successCriteria.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.key} data-testid={`card-criteria-${item.key}`}>
                    <CardContent className="py-4 text-center space-y-2">
                      <Icon className="h-5 w-5 mx-auto text-muted-foreground" />
                      <div className="text-sm font-medium">{item.title}</div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finspy" className="mt-4 space-y-6">
          {finspyLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : finspy && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Ghost className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold" data-testid="text-finspy-heading">
                  {t("finspy.intelBrief")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-finspy-desc">
                {t("finspy.intelBriefDesc")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-finspy-v12">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      {t("finspy.version12")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t("finspy.adversary")}:</span>{" "}
                      <span className="font-medium">{finspy.intel.adversary}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t("finspy.method")}:</span>{" "}
                      <span>{finspy.intel.method}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{t("finspy.keyIndicators")}:</span>
                      <ul className="mt-1 space-y-1">
                        {finspy.intel.keyIndicators.map((ind, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5" data-testid={`text-indicator-${i}`}>
                            <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t("finspy.ghostNodes")}:</span>
                      {finspy.intel.ghostNodes.map((n) => (
                        <Badge key={n} variant="outline" className="text-[10px] font-mono" data-testid={`badge-ghost-${n}`}>
                          {n}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-finspy-alexanderplatz">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      {t("finspy.alexanderplatz")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">{t("finspy.source")}:</span>
                        <div className="font-mono mt-0.5">{finspy.alexanderplatz.source}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("finspy.latency")}:</span>
                        <div className="font-mono mt-0.5">{finspy.alexanderplatz.latency}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("finspy.type")}:</span>
                        <div className="font-mono mt-0.5">{finspy.alexanderplatz.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("finspy.status")}:</span>
                        <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400 text-[10px] mt-0.5">
                          {finspy.alexanderplatz.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3" data-testid="text-hardware-heading">
                  {t("finspy.hardwareLayer")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {finspy.hardwareModules.map((hw) => (
                    <Card key={hw.id} data-testid={`card-hardware-${hw.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">{hw.name}</CardTitle>
                          <Badge variant="secondary" className="text-[10px] font-mono">{hw.codename}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        <p>{hw.purpose}</p>
                        <div>
                          <span className="text-muted-foreground">{t("finspy.repo")}:</span>{" "}
                          <span className="font-mono">{hw.repo}</span>
                        </div>
                        <p className="text-muted-foreground">{hw.implementation}</p>
                        <div>
                          <span className="text-muted-foreground">{t("karachi.useCase")}:</span>{" "}
                          <span>{hw.useCase}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3" data-testid="text-infra-heading">
                  {t("finspy.infraLayer")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {finspy.infraModules.map((inf) => (
                    <Card key={inf.id} data-testid={`card-infra-${inf.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">{inf.name}</CardTitle>
                          <Badge variant="secondary" className="text-[10px] font-mono">{inf.codename}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        <p>{inf.purpose}</p>
                        <div>
                          <span className="text-muted-foreground">{t("finspy.repo")}:</span>{" "}
                          <span className="font-mono">{inf.repo}</span>
                        </div>
                        <ul className="space-y-1">
                          {inf.implementation.map((step, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-muted-foreground">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                        {inf.deployCommand && (
                          <div className="bg-muted rounded px-2 py-1 font-mono text-[10px]" data-testid={`text-deploy-${inf.id}`}>
                            {t("finspy.deployCommand")}: {inf.deployCommand}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="airbnb" className="mt-4 space-y-6">
          {finspyLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : finspy && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Tv className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold" data-testid="text-airbnb-heading">
                  {t("finspy.airbnbGhost")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-airbnb-desc">
                {t("finspy.airbnbGhostDesc")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card data-testid="card-airbnb-vector">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tv className="h-4 w-4" />
                      {t("finspy.version20")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t("karachi.target")}:</span>{" "}
                      <span className="font-medium">{finspy.airbnbGhost.target}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t("karachi.vulnerability")}:</span>{" "}
                      <span>{finspy.airbnbGhost.weakness}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{t("finspy.attackSteps")}:</span>
                      <ol className="mt-1 space-y-1">
                        {finspy.airbnbGhost.attackSteps.map((step, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5" data-testid={`text-attack-step-${i}`}>
                            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 text-[10px] font-mono flex-shrink-0">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-partytown">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t("finspy.partytown")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t("finspy.domain")}:</span>{" "}
                      <span className="font-mono">{finspy.partytown.domain}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">{t("finspy.mechanism")}:</span>{" "}
                      <span className="font-mono">{finspy.partytown.mechanism}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{t("finspy.indicators")}:</span>
                      <ul className="mt-1 space-y-1">
                        {finspy.partytown.indicators.map((ind, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-kyndryl-profile">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    {t("finspy.kyndrylProfile")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t("finspy.role")}:</span>{" "}
                    <span className="font-medium">{finspy.kyndrylProfile.role}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("finspy.implications")}:</span>
                    <ul className="mt-1 space-y-1">
                      {finspy.kyndrylProfile.implications.map((imp, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" data-testid={`text-implication-${i}`}>
                          <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-sm font-medium mb-3" data-testid="text-v2-deliverables-heading">
                  {t("finspy.v2Deliverables")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {finspy.v2Deliverables.map((del) => (
                    <Card key={del.id} data-testid={`card-deliverable-${del.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm">{del.name}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-mono w-fit">{del.codename}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        <p>{del.purpose}</p>
                        {del.repo && (
                          <div>
                            <span className="text-muted-foreground">{t("finspy.repo")}:</span>{" "}
                            <span className="font-mono">{del.repo}</span>
                          </div>
                        )}
                        <p className="text-muted-foreground">{del.implementation}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
