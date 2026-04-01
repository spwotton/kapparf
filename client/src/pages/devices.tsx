import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import type { DeviceFingerprint } from "@shared/schema";
import {
  Fingerprint, AlertTriangle, Layers, Satellite, Radio, Globe, Plane, Crosshair, Activity,
  Smartphone, Wifi, Brain, Copy, Check, Download, QrCode, Zap, Heart, Compass, ThermometerSun,
  Monitor, Bell, BellOff, Cpu, Clock, Signal, ExternalLink
} from "lucide-react";

const domainColors: Record<string, string> = {
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  rf: "bg-green-500/10 text-green-700 dark:text-green-400",
  morse: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

function getEntityIcon(id: string) {
  if (id.startsWith("SAT-")) return <Satellite className="h-3.5 w-3.5 text-purple-500" />;
  if (id.startsWith("SDR-")) return <Radio className="h-3.5 w-3.5 text-yellow-500" />;
  if (id.startsWith("NET-")) return <Globe className="h-3.5 w-3.5 text-slate-500" />;
  if (id.startsWith("ADS-")) return <Plane className="h-3.5 w-3.5 text-rose-500" />;
  if (id.startsWith("TGT-")) return <Crosshair className="h-3.5 w-3.5 text-red-500" />;
  if (id.startsWith("SIG-") || id.startsWith("SRC-")) return <Activity className="h-3.5 w-3.5 text-green-500" />;
  if (id.startsWith("PHONE-")) return <Smartphone className="h-3.5 w-3.5 text-blue-500" />;
  return <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />;
}

function getEntityType(id: string): string {
  if (id.startsWith("SAT-")) return "Satellite";
  if (id.startsWith("SDR-")) return "SDR Node";
  if (id.startsWith("NET-")) return "Network";
  if (id.startsWith("ADS-")) return "Aircraft";
  if (id.startsWith("TGT-")) return "Target";
  if (id.startsWith("SIG-")) return "Signal";
  if (id.startsWith("SRC-")) return "Source";
  if (id.startsWith("PHONE-")) return "Phone";
  return "Device";
}

function getEntityLabel(id: string): string {
  if (id.startsWith("SAT-")) return `NORAD ${id.replace("SAT-", "")}`;
  if (id.startsWith("SDR-")) return id.replace("SDR-", "").toUpperCase();
  if (id.startsWith("NET-")) return id.replace("NET-", "");
  if (id.startsWith("ADS-")) return id.replace("ADS-", "");
  if (id.startsWith("TGT-")) return id.replace("TGT-", "");
  if (id.startsWith("SIG-")) return id.replace("SIG-", "");
  if (id.startsWith("SRC-")) return id.replace("SRC-", "");
  if (id.startsWith("PHONE-")) return id.replace("PHONE-", "");
  return id;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      data-testid={`copy-${label || "text"}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function PhoneConnectPanel() {
  const [phoneId, setPhoneId] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<any>(null);
  const [scriptCopied, setScriptCopied] = useState(false);

  const kappaUrl = window.location.origin;

  const { data: biometricStatus } = useQuery({
    queryKey: ["/api/biometric/status"],
    refetchInterval: 10000,
  });

  const { data: kymaLatest } = useQuery({
    queryKey: ["/api/biometric/kyma/latest"],
    refetchInterval: 5000,
  });

  const { data: correlations } = useQuery({
    queryKey: ["/api/biometric/correlations"],
    refetchInterval: 8000,
  });

  const handleRegister = async () => {
    const name = phoneId.trim() || `phone-${Date.now().toString(36)}`;
    setRegistering(true);
    try {
      const res = await fetch("/api/phone/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneId: name,
          os: "android-termux",
          capabilities: ["magnetometer", "accelerometer", "gyroscope", "light", "proximity", "barometer", "wifi-scan", "cell-info"],
        }),
      });
      const data = await res.json();
      setRegisterResult({ ...data, phoneId: name });
    } catch (err) {
      setRegisterResult({ error: String(err) });
    }
    setRegistering(false);
  };

  const termuxScript = `#!/bin/bash
# KAPPA Phone Agent — Quick Setup
# Run this in Termux on your Android phone

# 1. Install dependencies
pkg update -y && pkg install -y python termux-api

# 2. Download the agent
curl -sL "${kappaUrl}/api/phone/agent-script" -o kappa-phone-agent.py 2>/dev/null || \\
  echo "Download manually from KAPPA > Karachi > Deploy tab"

# 3. Run continuous sensor collection
python3 kappa-phone-agent.py \\
  --continuous \\
  --url "${kappaUrl}" \\
  --phone-id "${registerResult?.phoneId || phoneId || "my-phone"}" \\
  --interval 30

# Optional: Add Kyma bridge
# python3 kappa-phone-agent.py --continuous --url "${kappaUrl}" --kyma-url https://your-kyma.replit.app`;

  const curlTest = `# Quick test — send a magnetometer reading
curl -X POST "${kappaUrl}/api/phone/sensors" \\
  -H "Content-Type: application/json" \\
  -d '{"readings":[{"sensorType":"magnetometer","timestamp":'$(date +%s000)',"x":12.5,"y":-3.2,"z":45.1,"source":"manual-test"}]}'`;

  const handleDownloadScript = () => {
    const blob = new Blob([termuxScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kappa-phone-setup.sh";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-500" />
            Register Your Phone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Android phone as a sensor node. It will feed magnetometer, accelerometer, WiFi scans,
            cell tower data, and PCAP Droid network captures into KAPPA for biometric-RF correlation.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Phone name (e.g. samsung-a52, pixel-7)"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              data-testid="input-phone-id"
            />
            <Button onClick={handleRegister} disabled={registering} data-testid="button-register-phone">
              {registering ? "Registering..." : "Register"}
            </Button>
          </div>

          {registerResult && !registerResult.error && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-3" data-testid="register-success">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Phone registered successfully</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-background">
                  <span className="text-muted-foreground">Phone ID:</span>
                  <span className="ml-1 font-mono font-bold">{registerResult.phoneId}</span>
                </div>
                <div className="p-2 rounded bg-background">
                  <span className="text-muted-foreground">Capabilities:</span>
                  <span className="ml-1 font-mono">{registerResult.capabilities?.length || 8}</span>
                </div>
              </div>
            </div>
          )}

          {registerResult?.error && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-sm text-red-600">
              {registerResult.error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="w-4 h-4 text-violet-500" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="min-w-[28px] justify-center mt-0.5">1</Badge>
              <div>
                <p className="text-sm font-medium">Install Termux + Termux:API</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get Termux from F-Droid (not Play Store). Then install Termux:API add-on from F-Droid too.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="min-w-[28px] justify-center mt-0.5">2</Badge>
              <div>
                <p className="text-sm font-medium">Install Python + termux-api</p>
                <code className="text-xs font-mono bg-background rounded px-1.5 py-0.5 mt-1 inline-block">
                  pkg install python termux-api
                </code>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="min-w-[28px] justify-center mt-0.5">3</Badge>
              <div>
                <p className="text-sm font-medium">Grant sensor permissions</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Run <code className="bg-background rounded px-1 py-0.5">termux-sensor -l</code> and allow all sensor access when Android prompts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="min-w-[28px] justify-center mt-0.5">4</Badge>
              <div>
                <p className="text-sm font-medium">Run the agent</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download <code className="bg-background rounded px-1 py-0.5">kappa-phone-agent.py</code> from the Karachi Deploy tab, then run:
                </p>
                <code className="text-xs font-mono bg-background rounded px-1.5 py-0.5 mt-1 inline-block">
                  python3 kappa-phone-agent.py --continuous --url {kappaUrl}
                </code>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="min-w-[28px] justify-center mt-0.5">5</Badge>
              <div>
                <p className="text-sm font-medium">Optional: PCAP Droid</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Install PCAP Droid, start a capture, export as CSV. The agent auto-finds exports in /sdcard/PCAPdroid/.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="min-w-[28px] justify-center mt-0.5">6</Badge>
              <div>
                <p className="text-sm font-medium">Optional: Kyma Bridge</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add <code className="bg-background rounded px-1 py-0.5">--kyma-url https://your-kyma.replit.app</code> to pull consciousness data into KAPPA.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Setup Script
            </CardTitle>
            <div className="flex gap-2">
              <CopyButton text={termuxScript} label="script" />
              <button
                onClick={handleDownloadScript}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="download-script"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="p-3 rounded bg-muted text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto" data-testid="setup-script">
            {termuxScript}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              Quick Test (curl)
            </CardTitle>
            <CopyButton text={curlTest} label="curl" />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="p-3 rounded bg-muted text-xs font-mono overflow-x-auto" data-testid="curl-test">
            {curlTest}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function BiometricPanel() {
  const { data: biometricStatus } = useQuery<{
    phonesRegistered: number;
    readingsIngested: number;
    anomalyCount: number;
    kymaFramesReceived: number;
    correlationsFound: number;
    lastReading: any;
    lastKymaFrame: any;
  }>({
    queryKey: ["/api/biometric/status"],
    refetchInterval: 5000,
  });

  const { data: kymaLatest } = useQuery<any>({
    queryKey: ["/api/biometric/kyma/latest"],
    refetchInterval: 5000,
  });

  const { data: correlations } = useQuery<any[]>({
    queryKey: ["/api/biometric/correlations"],
    refetchInterval: 8000,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-blue-500" data-testid="stat-phones">
              {biometricStatus?.phonesRegistered ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Phones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono" data-testid="stat-readings">
              {biometricStatus?.readingsIngested ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Readings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-violet-500" data-testid="stat-kyma-frames">
              {biometricStatus?.kymaFramesReceived ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Kyma Frames</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-amber-500" data-testid="stat-anomalies">
              {biometricStatus?.anomalyCount ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Anomalies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-red-500" data-testid="stat-correlations">
              {biometricStatus?.correlationsFound ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Bio-RF Correlations</div>
          </CardContent>
        </Card>
      </div>

      {kymaLatest && kymaLatest.timestamp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-500" />
              Latest Kyma State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">Dominant State</div>
                <div className="text-sm font-medium" data-testid="kyma-state">{kymaLatest.dominantState || "—"}</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">Affect</div>
                <div className="text-sm font-medium" data-testid="kyma-affect">
                  {kymaLatest.signal?.affect_primary || kymaLatest.affectPrimary || "—"}
                </div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">Valence / Arousal</div>
                <div className="text-sm font-mono" data-testid="kyma-va">
                  {(kymaLatest.signal?.affect_valence ?? kymaLatest.affectValence ?? 0).toFixed(2)} / {(kymaLatest.signal?.affect_arousal ?? kymaLatest.affectArousal ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">Coherence</div>
                <div className="text-sm font-mono" data-testid="kyma-coherence">
                  {(kymaLatest.signal?.quantum_coherence ?? kymaLatest.coherence ?? 0).toFixed(3)}
                </div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">Kalman Confidence</div>
                <div className="text-sm font-mono">{(kymaLatest.kalmanConfidence ?? 0).toFixed(3)}</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">κ Phase</div>
                <div className="text-sm font-mono">{(kymaLatest.kappa?.kappaPhase ?? 0).toFixed(3)}</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">Thought Rhythm</div>
                <div className="text-sm font-mono">{(kymaLatest.kappa?.thoughtRhythm ?? 0).toFixed(3)}</div>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground">Last Update</div>
                <div className="text-sm font-mono">{kymaLatest.timestamp ? new Date(kymaLatest.timestamp).toLocaleTimeString() : "—"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {correlations && correlations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Biometric-RF Correlations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {correlations.slice(0, 20).map((c: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded bg-muted/30 text-xs" data-testid={`correlation-${i}`}>
                  <Badge variant={c.severity === "high" ? "destructive" : "secondary"} className="text-xs min-w-[60px] justify-center">
                    {c.type || c.correlationType || "bio-rf"}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-foreground/90">{c.description || c.message || "Biometric-RF correlation detected"}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {c.timestamp ? new Date(c.timestamp).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {biometricStatus?.lastReading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-500" />
              Latest Sensor Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 rounded bg-muted text-xs font-mono overflow-x-auto max-h-[150px] overflow-y-auto">
              {JSON.stringify(biometricStatus.lastReading, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {(!kymaLatest || !kymaLatest.timestamp) && (!correlations || correlations.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <Brain className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No biometric data yet. Connect your phone or Kyma engine to start seeing correlations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HeartbeatPanel() {
  const { data: trackerStatus } = useQuery<{
    devices: any[];
    onlineCount: number;
    alerts: any[];
    recentHeartbeats: Record<string, any>;
    serverUptime: number;
    lastFetch: number;
    trackerUrl: string;
    polling: boolean;
  }>({
    queryKey: ["/api/tracker/status"],
    refetchInterval: 5000,
  });

  const { data: trackerStats } = useQuery<{
    total: number;
    online: number;
    offline: number;
    byType: Record<string, number>;
    uptimePercent24h: number;
    lastFetch: number;
  }>({
    queryKey: ["/api/tracker/stats"],
    refetchInterval: 5000,
  });

  const { data: activeAlerts } = useQuery<any[]>({
    queryKey: ["/api/tracker/alerts/active"],
    refetchInterval: 8000,
  });

  const devices = trackerStatus?.devices || [];
  const onlineDevices = devices.filter((d: any) => d.online);
  const offlineDevices = devices.filter((d: any) => !d.online);

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case "pc": return <Monitor className="w-4 h-4 text-blue-500" />;
      case "phone": return <Smartphone className="w-4 h-4 text-green-500" />;
      case "sensor": return <ThermometerSun className="w-4 h-4 text-amber-500" />;
      case "iot": return <Cpu className="w-4 h-4 text-violet-500" />;
      default: return <Signal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4" data-testid="heartbeat-panel">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-blue-500" data-testid="stat-tracker-total">
              {trackerStats?.total ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Total Devices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-green-500" data-testid="stat-tracker-online">
              {trackerStats?.online ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-red-500" data-testid="stat-tracker-offline">
              {trackerStats?.offline ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Offline</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono text-amber-500" data-testid="stat-tracker-alerts">
              {activeAlerts?.length ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Active Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-bold font-mono" data-testid="stat-tracker-uptime">
              {trackerStats?.uptimePercent24h ? `${trackerStats.uptimePercent24h.toFixed(1)}%` : "—"}
            </div>
            <div className="text-[10px] text-muted-foreground">24h Uptime</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${trackerStatus?.polling ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        <span>Tracker: {trackerStatus?.trackerUrl || "Not connected"}</span>
        <span className="ml-auto">
          Server uptime: {trackerStatus?.serverUptime ? formatUptime(trackerStatus.serverUptime) : "—"}
        </span>
      </div>

      {devices.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Signal className="w-4 h-4 text-blue-500" />
              Device Fleet ({devices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {onlineDevices.map((device: any) => (
                <div key={device.id || device.deviceId} className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20" data-testid={`tracker-device-${device.id || device.deviceId}`}>
                  {getDeviceTypeIcon(device.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{device.name || device.deviceId || device.id}</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs">Online</Badge>
                      {device.type && <Badge variant="outline" className="text-xs">{device.type}</Badge>}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {device.latency_ms != null && <span>Latency: {device.latency_ms}ms</span>}
                      {device.jitter_ms != null && <span>Jitter: {device.jitter_ms.toFixed(1)}ms</span>}
                      {device.uptime_24h != null && <span>Uptime: {device.uptime_24h.toFixed(1)}%</span>}
                      {device.lastHeartbeat && <span>Last: {new Date(device.lastHeartbeat).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {offlineDevices.map((device: any) => (
                <div key={device.id || device.deviceId} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 opacity-60" data-testid={`tracker-device-${device.id || device.deviceId}`}>
                  {getDeviceTypeIcon(device.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{device.name || device.deviceId || device.id}</span>
                      <Badge variant="destructive" className="text-xs">Offline</Badge>
                      {device.type && <Badge variant="outline" className="text-xs">{device.type}</Badge>}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {device.lastHeartbeat && <span>Last seen: {new Date(device.lastHeartbeat).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Signal className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No devices registered yet. Deploy agents from the tracker dashboard to start monitoring.
            </p>
            <a
              href="https://heartbeat-tracker-monitor.replit.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-2"
              data-testid="link-tracker-dashboard"
            >
              <ExternalLink className="w-3 h-3" /> Open Tracker Dashboard
            </a>
          </CardContent>
        </Card>
      )}

      {activeAlerts && activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {activeAlerts.map((alert: any, i: number) => (
                <div key={alert.id || i} className="flex items-start gap-3 p-2 rounded bg-red-500/5 text-xs" data-testid={`tracker-alert-${i}`}>
                  <Badge
                    variant={alert.severity >= 3 ? "destructive" : "secondary"}
                    className="text-xs min-w-[50px] justify-center"
                  >
                    {alert.severity >= 4 ? "CRIT" : alert.severity >= 3 ? "HIGH" : alert.severity >= 2 ? "MED" : "LOW"}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-foreground/90">{alert.message || alert.type || "Alert"}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {alert.deviceId && <span className="font-mono">{alert.deviceId}</span>}
                      {alert.timestamp && <span className="ml-2">{new Date(alert.timestamp).toLocaleString()}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Agent Downloads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a href="https://heartbeat-tracker-monitor.replit.app/api/agents/pc" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors" data-testid="link-agent-pc">
              <Monitor className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">PC Agent</div>
                <div className="text-xs text-muted-foreground">Windows/Mac/Linux</div>
              </div>
              <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
            </a>
            <a href="https://heartbeat-tracker-monitor.replit.app/api/agents/phone" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors" data-testid="link-agent-phone">
              <Smartphone className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Phone Agent</div>
                <div className="text-xs text-muted-foreground">Termux / Android</div>
              </div>
              <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
            </a>
            <a href="https://heartbeat-tracker-monitor.replit.app/api/agents/bash" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors" data-testid="link-agent-bash">
              <Cpu className="w-4 h-4 text-violet-500" />
              <div>
                <div className="text-sm font-medium">Bash Agent</div>
                <div className="text-xs text-muted-foreground">Headless / IoT</div>
              </div>
              <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DevicesPage() {
  const { t } = useI18n();

  const { data: devices, isLoading, isError } = useQuery<DeviceFingerprint[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 5000,
  });

  const sortedDevices = devices
    ? [...devices].sort((a, b) => {
        if (a.suspicious !== b.suspicious) return a.suspicious ? -1 : 1;
        return b.crossDomainCount - a.crossDomainCount || b.eventCount - a.eventCount;
      })
    : [];

  const totalDevices = devices?.length ?? 0;
  const suspiciousCount = devices?.filter((d) => d.suspicious).length ?? 0;
  const multiDomainCount = devices?.filter((d) => d.domainsSeen.length >= 3).length ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="devices-page">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          Devices & Sensors
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tracked entities, phone sensors, and biometric-RF correlation.
        </p>
      </div>

      <Tabs defaultValue="tracked">
        <TabsList data-testid="device-tabs">
          <TabsTrigger value="tracked" data-testid="tab-tracked">
            <Fingerprint className="w-4 h-4 mr-1.5" /> Tracked ({totalDevices})
          </TabsTrigger>
          <TabsTrigger value="phone" data-testid="tab-phone">
            <Smartphone className="w-4 h-4 mr-1.5" /> Connect Phone
          </TabsTrigger>
          <TabsTrigger value="biometric" data-testid="tab-biometric">
            <Heart className="w-4 h-4 mr-1.5" /> Biometric
          </TabsTrigger>
          <TabsTrigger value="heartbeat" data-testid="tab-heartbeat">
            <Signal className="w-4 h-4 mr-1.5" /> Heartbeat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracked" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-mono font-semibold tabular-nums" data-testid="text-total-devices">
                    {totalDevices}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className={`text-3xl font-mono font-semibold tabular-nums ${suspiciousCount > 0 ? "text-red-600" : ""}`} data-testid="text-suspicious-count">
                    {suspiciousCount}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Multi-Domain</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-mono font-semibold tabular-nums" data-testid="text-multi-domain-count">
                    {multiDomainCount}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-destructive" data-testid="text-devices-error">
                Error loading devices
              </CardContent>
            </Card>
          ) : sortedDevices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No devices tracked yet. Events will populate devices as they arrive.
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 p-3 text-xs font-medium text-muted-foreground border-b min-w-[700px]">
                <span>Entity</span>
                <span>Domains</span>
                <span>Events</span>
                <span>Cross-Domain</span>
                <span>First Seen</span>
                <span>Last Seen</span>
                <span>Status</span>
              </div>
              {sortedDevices.map((device, index) => (
                <div
                  key={device.mac}
                  className="grid grid-cols-7 gap-2 p-3 text-sm border-b last:border-b-0 items-center min-w-[700px]"
                  data-testid={`row-device-${index}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getEntityIcon(device.mac)}
                    <div className="min-w-0">
                      <div className="font-mono text-xs truncate" title={device.mac}>
                        {getEntityLabel(device.mac)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {getEntityType(device.mac)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {device.domainsSeen.map((d) => (
                      <Badge
                        key={d}
                        variant="secondary"
                        className={`text-xs ${domainColors[d] || ""}`}
                      >
                        {d.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                  <span className="font-mono text-xs">{device.eventCount}</span>
                  <span className="font-mono text-xs">{device.crossDomainCount}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(device.firstSeen).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(device.lastSeen).toLocaleString()}
                  </span>
                  <div>
                    {device.suspicious ? (
                      <Badge variant="destructive" className="text-xs" data-testid={`badge-status-suspicious-${index}`}>
                        Suspicious
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs" data-testid={`badge-status-normal-${index}`}>
                        Normal
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="phone" className="mt-4">
          <PhoneConnectPanel />
        </TabsContent>

        <TabsContent value="biometric" className="mt-4">
          <BiometricPanel />
        </TabsContent>

        <TabsContent value="heartbeat" className="mt-4">
          <HeartbeatPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
