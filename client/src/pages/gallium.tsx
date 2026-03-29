import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type SatellitePass, KAPPA_CONSTANTS } from "@shared/schema";
import {
  RefreshCw, Shield, AlertTriangle, Radio, Server, Globe, Crosshair,
  ChevronDown, ChevronUp, Eye, Wifi, Cpu, Lock, Zap, Target
} from "lucide-react";

const CHINESE_SAT_PREFIXES = [
  "BEIDOU", "BD-", "FENGYUN", "FY-", "YAOGAN", "YG-", "SHIJIAN", "SJ-",
  "TIANLIAN", "TIANWEN", "GAOFEN", "GF-", "JILIN", "ZIYUAN", "ZY-",
  "SHIYAN", "SY-", "CBERS", "HAIYANG", "HY-", "CHANG'E", "ZHONGXING",
  "ZX-", "APSTAR", "CHINASAT", "TIANTONG", "LUOJIA", "CFOSAT",
  "TIANHE", "WENTIAN", "MENGTIAN", "SHENZHOU", "TIANZHOU", "CSS ",
  "CZ-", "KUAIZHOU", "YUNHAI", "LUDI TANCE", "HUANJING", "HJ-",
  "TONGXIN", "CHUANGXIN", "BANXING", "TAIJI", "EINSTEIN PROBE",
  "XUNTIAN", "DARKSAT", "TIANMU", "QIANFAN"
];

function isChineseSatellite(name: string): boolean {
  const upper = (name || "").toUpperCase();
  return CHINESE_SAT_PREFIXES.some(prefix => upper.includes(prefix));
}

const UNC_TIMELINE = [
  { date: "2022-04-17", event: "Conti ransomware (UNC1756) hits ~30 Costa Rican institutions", severity: "critical", actor: "UNC1756/Conti", phase: 0 },
  { date: "2022-05-08", event: "President Chaves declares national emergency — 'state of war'", severity: "critical", actor: "State Response", phase: 0 },
  { date: "2022-05-31", event: "Hive ransomware targets CCSS (EDUS + SICERE destroyed)", severity: "high", actor: "Hive", phase: 0 },
  { date: "2023-08-XX", event: "Budapest Convention 5G decree — Huawei/ZTE banned from CR infrastructure", severity: "medium", actor: "Geopolitical", phase: 1 },
  { date: "2024-06-XX", event: "CISA/ZDI publish DSE855 CVEs (5947/5950/5949/5952)", severity: "high", actor: "CISA", phase: 1 },
  { date: "2025-06-21", event: "Fiber splitter (NAP/Colilla) installed at Telecable distribution box", severity: "high", actor: "Physical", phase: 1 },
  { date: "2026-01-XX", event: "PRC bans ~12 Western/Israeli cybersecurity firms (Document 79)", severity: "medium", actor: "Geopolitical", phase: 2 },
  { date: "2026-01-25", event: "ICE breach detected by GTIG/Mandiant — GRIDTIDE C2 identified", severity: "critical", actor: "UNC2814/Gallium", phase: 2 },
  { date: "2026-01-30", event: "Unauthorized TR-069 admin password reset on ARRIS router", severity: "high", actor: "UNC2814", phase: 2 },
  { date: "2026-03-12", event: "ICE publicly discloses ~9GB email data breach", severity: "critical", actor: "UNC2814/Gallium", phase: 2 },
  { date: "2026-03-13", event: "Media attributes ICE breach to Chinese APT 'Gallium'", severity: "critical", actor: "Attribution", phase: 2 },
];

const GRIDTIDE_SPEC = {
  type: "C-based backdoor",
  c2: "Google Sheets API (no traditional infrastructure)",
  encryption: "AES-128-CBC, 16-byte local key file",
  cells: [
    { cell: "A1", function: "Command register — polled for shell commands, S-C-R status on exec" },
    { cell: "A2–An", function: "Data transfer — 45KB fragments for exfil/payload upload" },
    { cell: "V1", function: "Host fingerprint — hostname, IP, OS, user, language" },
  ],
  polling: "1s initial → 5–10min backoff (randomized)",
  sanitization: "Clears 1,000 rows × A–Z columns on first execution",
  masquerade: "Binary renamed 'xapt' (mimics apt packaging tool)",
  persistence: "systemd service at /etc/systemd/system/xapt.service → /usr/sbin/xapt",
  lateral: "SSH service account hijacking",
  exfil: "SoftEther VPN Bridge to offshore infrastructure, URL-safe Base64",
  scope: "53 organizations across 42 countries, active since 2017",
  iceData: "~9GB internal emails from locally-hosted server",
};

const CVE_TABLE = [
  { cve: "CVE-2022-41328", target: "FortiOS", mechanism: "Path traversal", actor: "UNC3886", cvss: "—", status: "confirmed" },
  { cve: "CVE-2023-20867", target: "VMware Tools", mechanism: "Guest Operations bypass", actor: "UNC3886", cvss: "—", status: "confirmed" },
  { cve: "CVE-2023-30799", target: "MikroTik RouterOS", mechanism: "Privilege escalation", actor: "UNC3886", cvss: "—", status: "confirmed" },
  { cve: "CVE-2023-34048", target: "VMware vCenter", mechanism: "Out-of-bounds write (DCERPC)", actor: "UNC3886", cvss: "—", status: "confirmed" },
  { cve: "CVE-2024-5947", target: "DSE855 Gateway", mechanism: "HTTP GET /Backup.bin → plaintext SCADA creds", actor: "SETECOM exposure", cvss: "6.5 Med", status: "confirmed" },
  { cve: "CVE-2024-5950", target: "DSE855 Gateway", mechanism: "Stack buffer overflow → RCE on NXP LPC4357", actor: "SETECOM exposure", cvss: "—", status: "confirmed" },
  { cve: "CVE-2024-5949", target: "DSE855 Gateway", mechanism: "Multipart boundary → infinite loop DoS", actor: "SETECOM exposure", cvss: "—", status: "confirmed" },
  { cve: "CVE-2024-5952", target: "DSE855 Gateway", mechanism: "Unauth web UI restart → device reboot", actor: "SETECOM exposure", cvss: "—", status: "confirmed" },
  { cve: "CVE-2025-10948", target: "MikroTik REST API", mechanism: "Heap overflow in libjson.so parse_json_element()", actor: "UNC3886/Botnet", cvss: "8.8–9.8 Crit", status: "confirmed" },
  { cve: "CVE-2025-21590", target: "Juniper MX", mechanism: "Improper isolation of shared resources", actor: "UNC3886", cvss: "—", status: "confirmed" },
  { cve: "CVE-2025-9491", target: "Windows LNK", mechanism: "Zero-day exploitation", actor: "UNC6384", cvss: "—", status: "confirmed" },
  { cve: "ZDI-CAN-25373", target: "Windows LNK", mechanism: "Spear-phishing via LNK", actor: "UNC6384/Mustang Panda", cvss: "—", status: "confirmed" },
];

const HUAWEI_EVIDENCE = [
  { item: "Budapest Convention 5G Decree (Aug 2023)", detail: "Executive decree mandating all 5G vendors be Budapest Convention signatories — effectively banning Huawei and ZTE", type: "regulatory" },
  { item: "ICE Internal Workers' Front Proxy", detail: "Beijing reportedly leveraged ICE internal union to appeal 5G ban in lower courts, stalling deployment and creating institutional friction", type: "influence" },
  { item: "Chinese Embassy Rejection", detail: "Embassy publicly rejected ICE breach accusations, demanded technical evidence from Costa Rican authorities", type: "diplomatic" },
  { item: "Document 79 Directive", detail: "PRC ordered SOEs in financial/energy sectors to replace all Western cybersecurity software by 2027 — retaliatory action", type: "retaliatory" },
  { item: "Huawei Legal Appeals", detail: "Huawei initiated aggressive legal appeals through Costa Rican Constitutional Court to challenge 5G exclusion", type: "legal" },
  { item: "US $25M Cybersecurity Grant", detail: "US State Department committed $25M to assist Costa Rica in building defenses — direct counter to PRC influence", type: "countermeasure" },
  { item: "Supply Chain Gap", detail: "US-funded SOC monitors application layer while underlying edge devices (MikroTik, DSE) remain PRC-accessible at Tier-0", type: "vulnerability" },
];

const SETECOM_EVIDENCE = [
  { protocol: "Modbus TCP/IP", port: "502", vulnerability: "No authentication, no encryption, no integrity checking by protocol design" },
  { protocol: "SNMP v2c", port: "161/162 UDP", vulnerability: "Cleartext community strings 'public' (read) / 'private' (read-write) routinely unchanged" },
  { protocol: "J1939 CAN Bus", port: "—", vulnerability: "29-bit identifier (3P + 18PGN + 8SA); direct ECU access for fuel injection, RPM, engine overspeed" },
  { protocol: "DSE WebNet", port: "HTTP", vulnerability: "Default Admin/Password1234 across entire fleet (DSE 855, 890 MKII, 891, 892)" },
];

const ROOTKIT_ARSENAL = [
  { family: "REPTILE", layer: "Kernel", mechanism: "Loadable kernel module", persistence: "Auto-loads via modprobe.d", actor: "UNC3886" },
  { family: "MEDUSA", layer: "Kernel", mechanism: "Credential harvester via LD_PRELOAD", persistence: "Intercepts PAM auth", actor: "UNC3886" },
  { family: "GRIDTIDE", layer: "Application", mechanism: "Google Sheets API C2", persistence: "systemd service (xapt)", actor: "UNC2814" },
  { family: "SOGU.SEC/PlugX", layer: "Memory", mechanism: "DLL side-loading, memory-resident", persistence: "No disk footprint", actor: "UNC6384" },
  { family: "TINYSHELL", layer: "Application", mechanism: "Custom reverse shell variants", persistence: "Juniper FreeBSD process injection", actor: "UNC3886" },
  { family: "STATICPLUGIN", layer: "Application", mechanism: "Signed downloader via AitM captive portal", persistence: "Valid code-signing certs", actor: "UNC6384" },
];

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return (
    <Badge variant="outline" className={colors[severity] || colors.low} data-testid={`badge-severity-${severity}`}>
      {severity.toUpperCase()}
    </Badge>
  );
}

function PhaseBadge({ phase }: { phase: number }) {
  const labels = ["PHASE 0: NOISE", "PHASE 1: TRANSITION", "PHASE 2: SILENT"];
  const colors = [
    "bg-red-900/30 text-red-300 border-red-700/40",
    "bg-amber-900/30 text-amber-300 border-amber-700/40",
    "bg-violet-900/30 text-violet-300 border-violet-700/40",
  ];
  return <Badge variant="outline" className={colors[phase]}>{labels[phase]}</Badge>;
}

export default function GalliumPage() {
  const { toast } = useToast();
  const [expandedTimeline, setExpandedTimeline] = useState(true);

  const { data: satellites, isLoading: satsLoading } = useQuery<SatellitePass[]>({
    queryKey: ["/api/satellites"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/satellites/refresh", { groups: ["beidou"] }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/satellites"] });
      toast({ title: "Beidou constellation refreshed" });
    },
  });

  const chineseSats = useMemo(() => {
    if (!satellites) return [];
    return satellites.filter(s => isChineseSatellite(s.satelliteName));
  }, [satellites]);

  const beidouSats = useMemo(() => chineseSats.filter(s => s.satelliteName.toUpperCase().includes("BEIDOU")), [chineseSats]);
  const reconSats = useMemo(() => chineseSats.filter(s => {
    const n = s.satelliteName.toUpperCase();
    return n.includes("YAOGAN") || n.includes("YG-") || n.includes("GAOFEN") || n.includes("GF-") || n.includes("JILIN");
  }), [chineseSats]);
  const overheadChinese = useMemo(() => chineseSats.filter(s => (s.elevation ?? 0) > 30), [chineseSats]);
  const kleinChinese = useMemo(() => chineseSats.filter(s =>
    s.azimuth != null && Math.abs(s.azimuth - KAPPA_CONSTANTS.KLEIN_TWIST_DEG) <= KAPPA_CONSTANTS.KLEIN_TOLERANCE_DEG
  ), [chineseSats]);

  return (
    <div className="p-4 space-y-4 max-w-[1400px] mx-auto" data-testid="gallium-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-gallium-title">
            <Shield className="h-6 w-6 text-red-500" />
            UNC2814 / GALLIUM — China Nexus Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            PRC-linked threat actor attribution, Chinese satellite tracking, GRIDTIDE C2 architecture, and Huawei/ICE evidence chain
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          data-testid="button-refresh-beidou"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          Refresh Beidou
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-red-950/20 border-red-900/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-red-400" data-testid="text-chinese-sat-count">{chineseSats.length}</div>
            <div className="text-xs text-muted-foreground">Chinese Sats Tracked</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-950/20 border-amber-900/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-amber-400" data-testid="text-beidou-count">{beidouSats.length}</div>
            <div className="text-xs text-muted-foreground">Beidou GNSS</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-950/20 border-orange-900/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-orange-400" data-testid="text-recon-count">{reconSats.length}</div>
            <div className="text-xs text-muted-foreground">Recon/ISR Sats</div>
          </CardContent>
        </Card>
        <Card className="bg-violet-950/20 border-violet-900/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-violet-400" data-testid="text-overhead-chinese">{overheadChinese.length}</div>
            <div className="text-xs text-muted-foreground">Overhead (&gt;30°)</div>
          </CardContent>
        </Card>
        <Card className="bg-fuchsia-950/20 border-fuchsia-900/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-fuchsia-400" data-testid="text-klein-chinese">{kleinChinese.length}</div>
            <div className="text-xs text-muted-foreground">Klein Twist (128.23°)</div>
          </CardContent>
        </Card>
        <Card className="bg-sky-950/20 border-sky-900/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-sky-400" data-testid="text-cve-count">{CVE_TABLE.length}</div>
            <div className="text-xs text-muted-foreground">CVEs Documented</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-3">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="gridtide" data-testid="tab-gridtide">GRIDTIDE</TabsTrigger>
          <TabsTrigger value="satellites" data-testid="tab-satellites">Chinese Sats</TabsTrigger>
          <TabsTrigger value="cves" data-testid="tab-cves">CVEs</TabsTrigger>
          <TabsTrigger value="huawei" data-testid="tab-huawei">Huawei/ICE</TabsTrigger>
          <TabsTrigger value="setecom" data-testid="tab-setecom">SETECOM/SCADA</TabsTrigger>
          <TabsTrigger value="rootkits" data-testid="tab-rootkits">Rootkits</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-3">
          <Card className="bg-zinc-950/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                UNC Attack Timeline (2022–2026)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ψ(t) = A(t)·N(t) ≡ 1 — As espionage amplitude increases, noise decreases. Phase 2 = perfect structure.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {UNC_TIMELINE.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-800/50"
                    data-testid={`timeline-entry-${i}`}
                  >
                    <div className="w-24 flex-shrink-0 font-mono text-xs text-muted-foreground pt-0.5">
                      {entry.date}
                    </div>
                    <div className="flex-shrink-0 pt-0.5">
                      <PhaseBadge phase={entry.phase} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{entry.event}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] bg-zinc-900/50">{entry.actor}</Badge>
                        <SeverityBadge severity={entry.severity} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gridtide" className="space-y-3">
          <Card className="bg-zinc-950/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-5 w-5 text-red-500" />
                GRIDTIDE Command & Control Architecture
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                UNC2814's novel living-off-the-cloud C2 via Google Sheets API — no traditional infrastructure
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-400">Technical Profile</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries({
                      "Type": GRIDTIDE_SPEC.type,
                      "C2 Channel": GRIDTIDE_SPEC.c2,
                      "Encryption": GRIDTIDE_SPEC.encryption,
                      "Binary Masquerade": GRIDTIDE_SPEC.masquerade,
                      "Persistence": GRIDTIDE_SPEC.persistence,
                      "Lateral Movement": GRIDTIDE_SPEC.lateral,
                      "Exfiltration": GRIDTIDE_SPEC.exfil,
                      "Polling": GRIDTIDE_SPEC.polling,
                      "Sanitization": GRIDTIDE_SPEC.sanitization,
                    }).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-muted-foreground w-36 flex-shrink-0">{k}:</span>
                        <span className="font-mono text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-400">Google Sheets Cell Map</h3>
                  <div className="space-y-2">
                    {GRIDTIDE_SPEC.cells.map((c, i) => (
                      <div key={i} className="p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-700/40 font-mono">{c.cell}</Badge>
                          <span className="text-xs">{c.function}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 rounded bg-red-950/20 border border-red-900/30">
                    <h4 className="text-xs font-semibold text-red-400 mb-1">Operational Scope</h4>
                    <p className="text-xs text-muted-foreground">{GRIDTIDE_SPEC.scope}</p>
                    <p className="text-xs text-red-300 mt-1 font-semibold">{GRIDTIDE_SPEC.iceData}</p>
                  </div>
                  <div className="mt-2 p-2 rounded bg-amber-950/20 border border-amber-900/30">
                    <h4 className="text-xs font-semibold text-amber-400 mb-1">κ-Convergence</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      Λ₂₆ vector (9, 53, 42) → norm ≈ 68.9 — ratio 53/42 ≈ 1.2619 → κ = 4/π ≈ 1.2732
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-semibold text-amber-400 mb-2">Google Sheets C2 Precedents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { name: "TOUGHPROGRESS / TONGUESHED", detail: "China-nexus; Google Sheets API read/write as tasking/exfil", year: "2024" },
                    { name: "Voldemort Campaign (Proofpoint)", detail: "Google Sheets C2, AES payloads, DLL side-loading; ~70 orgs, 18 countries", year: "Aug 2024" },
                    { name: "systemd Persistence (T1543.002)", detail: "MITRE ATT&CK technique — service-level persistence via systemd", year: "2024" },
                  ].map((p, i) => (
                    <div key={i} className="p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                      <div className="text-xs font-semibold text-amber-300">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.detail}</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">{p.year}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satellites" className="space-y-3">
          <Card className="bg-zinc-950/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-500" />
                Chinese Satellite Constellation — Live Tracking
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Beidou GNSS, Yaogan/Gaofen ISR, Fengyun weather, Jilin commercial imaging — filtered from all tracked constellations
              </p>
            </CardHeader>
            <CardContent>
              {satsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : chineseSats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No Chinese satellites currently tracked. Click "Refresh Beidou" to pull the constellation.</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-xs" data-testid="table-chinese-sats">
                    <thead className="sticky top-0 bg-zinc-950">
                      <tr className="border-b border-zinc-800">
                        <th className="text-left p-1.5 font-semibold">Name</th>
                        <th className="text-left p-1.5 font-semibold">NORAD</th>
                        <th className="text-left p-1.5 font-semibold">Category</th>
                        <th className="text-right p-1.5 font-semibold">El°</th>
                        <th className="text-right p-1.5 font-semibold">Az°</th>
                        <th className="text-right p-1.5 font-semibold">Range km</th>
                        <th className="text-right p-1.5 font-semibold">Alt km</th>
                        <th className="text-center p-1.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chineseSats
                        .sort((a, b) => (b.elevation ?? -999) - (a.elevation ?? -999))
                        .map((sat, i) => {
                          const isOverhead = (sat.elevation ?? 0) > 30;
                          const isKlein = sat.azimuth != null && Math.abs(sat.azimuth - KAPPA_CONSTANTS.KLEIN_TWIST_DEG) <= KAPPA_CONSTANTS.KLEIN_TOLERANCE_DEG;
                          const isRecon = ["YAOGAN", "YG-", "GAOFEN", "GF-", "JILIN"].some(p => (sat.satelliteName || "").toUpperCase().includes(p));
                          return (
                            <tr
                              key={sat.id}
                              className={`border-b border-zinc-900/50 hover:bg-zinc-900/30 ${isRecon ? "bg-red-950/10" : ""}`}
                              data-testid={`sat-row-${sat.noradId}`}
                            >
                              <td className="p-1.5 font-mono">
                                {sat.satelliteName}
                                {isRecon && <Badge variant="outline" className="ml-1 text-[8px] bg-red-900/30 text-red-400 border-red-700/40">ISR</Badge>}
                              </td>
                              <td className="p-1.5 font-mono text-muted-foreground">{sat.noradId}</td>
                              <td className="p-1.5">
                                <Badge variant="outline" className="text-[10px]">{sat.category}</Badge>
                              </td>
                              <td className={`p-1.5 text-right font-mono ${isOverhead ? "text-green-400" : "text-muted-foreground"}`}>
                                {sat.elevation?.toFixed(1) ?? "—"}
                              </td>
                              <td className={`p-1.5 text-right font-mono ${isKlein ? "text-fuchsia-400 font-bold" : "text-muted-foreground"}`}>
                                {sat.azimuth?.toFixed(1) ?? "—"}
                                {isKlein && " ⟐"}
                              </td>
                              <td className="p-1.5 text-right font-mono text-muted-foreground">
                                {sat.range?.toFixed(0) ?? "—"}
                              </td>
                              <td className="p-1.5 text-right font-mono text-muted-foreground">
                                {sat.altitude?.toFixed(0) ?? "—"}
                              </td>
                              <td className="p-1.5 text-center">
                                {isOverhead ? (
                                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                ) : (
                                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-700" />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cves" className="space-y-3">
          <Card className="bg-zinc-950/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                Exploited CVEs — Full Chain
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                12 confirmed CVEs across FortiOS, VMware, MikroTik, DSE855, Juniper MX, and Windows LNK
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-xs" data-testid="table-cves">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left p-2 font-semibold">CVE</th>
                      <th className="text-left p-2 font-semibold">Target</th>
                      <th className="text-left p-2 font-semibold">Mechanism</th>
                      <th className="text-left p-2 font-semibold">Actor</th>
                      <th className="text-left p-2 font-semibold">CVSS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CVE_TABLE.map((cve, i) => (
                      <tr key={i} className="border-b border-zinc-900/50 hover:bg-zinc-900/30" data-testid={`cve-row-${cve.cve}`}>
                        <td className="p-2 font-mono text-red-400 font-semibold">{cve.cve}</td>
                        <td className="p-2">{cve.target}</td>
                        <td className="p-2 text-muted-foreground">{cve.mechanism}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-[10px] bg-zinc-900/50">{cve.actor}</Badge>
                        </td>
                        <td className="p-2 font-mono">
                          {cve.cvss.includes("Crit") ? (
                            <span className="text-red-400 font-bold">{cve.cvss}</span>
                          ) : cve.cvss.includes("Med") ? (
                            <span className="text-amber-400">{cve.cvss}</span>
                          ) : (
                            <span className="text-muted-foreground">{cve.cvss}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="huawei" className="space-y-3">
          <Card className="bg-zinc-950/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wifi className="h-5 w-5 text-amber-500" />
                Huawei / ICE / Geopolitical Evidence Chain
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                How the 5G vendor ban, ICE breach, and Chinese diplomatic response connect
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {HUAWEI_EVIDENCE.map((item, i) => {
                const typeColors: Record<string, string> = {
                  regulatory: "text-blue-400 bg-blue-900/20 border-blue-800/30",
                  influence: "text-red-400 bg-red-900/20 border-red-800/30",
                  diplomatic: "text-amber-400 bg-amber-900/20 border-amber-800/30",
                  retaliatory: "text-orange-400 bg-orange-900/20 border-orange-800/30",
                  legal: "text-violet-400 bg-violet-900/20 border-violet-800/30",
                  countermeasure: "text-green-400 bg-green-900/20 border-green-800/30",
                  vulnerability: "text-red-400 bg-red-900/20 border-red-800/30",
                };
                return (
                  <div key={i} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50" data-testid={`huawei-evidence-${i}`}>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${typeColors[item.type] || ""}`}>
                        {item.type.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="text-sm font-semibold">{item.item}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setecom" className="space-y-3">
          <Card className="bg-zinc-950/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                SETECOM S.A. — SCADA/OT Exposure
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Monopoly DSE distributor — default credentials Admin/Password1234 across the entire Costa Rican generator fleet
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded bg-red-950/20 border border-red-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-bold text-red-400">CRITICAL: Default Credentials Across Fleet</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div>
                    <span className="text-muted-foreground">Username:</span> <span className="text-red-300">Admin</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Password:</span> <span className="text-red-300">Password1234</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Applied to: DSE 855, DSE 890 MKII, DSE 891, DSE 892 gateways, DSE WebNet cloud management.
                  Controls backup generators for ICE national power grid, Liberty telecom, hospitals, cellular towers.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Insecure Protocol Exposure</h3>
                <div className="overflow-auto">
                  <table className="w-full text-xs" data-testid="table-setecom">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left p-2 font-semibold">Protocol</th>
                        <th className="text-left p-2 font-semibold">Port</th>
                        <th className="text-left p-2 font-semibold">Vulnerability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SETECOM_EVIDENCE.map((p, i) => (
                        <tr key={i} className="border-b border-zinc-900/50 hover:bg-zinc-900/30">
                          <td className="p-2 font-mono text-orange-400 font-semibold">{p.protocol}</td>
                          <td className="p-2 font-mono">{p.port}</td>
                          <td className="p-2 text-muted-foreground">{p.vulnerability}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 rounded bg-amber-950/20 border border-amber-900/30">
                <h4 className="text-xs font-semibold text-amber-400 mb-1">Supply Chain Gap</h4>
                <p className="text-xs text-muted-foreground">
                  US-funded SOC (Mandiant/Google SecOps) monitors application-layer traffic. But underlying OT infrastructure
                  (DSE controllers, Modbus, SNMP) remains accessible at Tier-0 through SETECOM's architecture.
                  UNC3886 persists at hypervisor level while SOC monitors only above guest OS.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rootkits" className="space-y-3">
          <Card className="bg-zinc-950/50 border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                PRC-Nexus Rootkit & Malware Arsenal
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Kernel-level rootkits, memory-resident backdoors, and application-layer C2 — multi-tiered persistence
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-xs" data-testid="table-rootkits">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left p-2 font-semibold">Family</th>
                      <th className="text-left p-2 font-semibold">Layer</th>
                      <th className="text-left p-2 font-semibold">Mechanism</th>
                      <th className="text-left p-2 font-semibold">Persistence</th>
                      <th className="text-left p-2 font-semibold">Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROOTKIT_ARSENAL.map((r, i) => {
                      const layerColors: Record<string, string> = {
                        Kernel: "text-red-400",
                        Application: "text-amber-400",
                        Memory: "text-violet-400",
                      };
                      return (
                        <tr key={i} className="border-b border-zinc-900/50 hover:bg-zinc-900/30" data-testid={`rootkit-row-${r.family}`}>
                          <td className="p-2 font-mono font-bold text-red-300">{r.family}</td>
                          <td className={`p-2 font-semibold ${layerColors[r.layer] || "text-muted-foreground"}`}>{r.layer}</td>
                          <td className="p-2 text-muted-foreground">{r.mechanism}</td>
                          <td className="p-2 text-muted-foreground">{r.persistence}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-[10px] bg-zinc-900/50">{r.actor}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 rounded bg-violet-950/20 border border-violet-900/30">
                <h4 className="text-xs font-semibold text-violet-400 mb-1">Glyph Injection Attack (S2 Unique)</h4>
                <p className="text-xs text-muted-foreground">
                  CVE-2025-10948 buffer overflow used to inject specialized glyph mapping font into browser sessions.
                  DOM contains innocuous text but glyph rendering displays malicious instructions or reverse shell triggers —
                  visible only to the human eye, invisible to AI assistants analyzing raw HTML.
                  The human visual system becomes the final execution link in the cyber-physical attack chain.
                </p>
              </div>

              <div className="mt-3 p-3 rounded bg-zinc-900/50 border border-zinc-800/50">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">UNC3886 Dwell Time</h4>
                <p className="text-xs text-muted-foreground">
                  Median dwell time for cyber espionage incidents: <span className="text-red-400 font-bold font-mono">122 days</span> (~10× average eCrime).
                  Operates below guest OS at Tier-0 hypervisor level — invisible to EDR solutions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
