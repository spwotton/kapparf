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
  ChevronDown, ChevronUp, Eye, Wifi, Cpu, Lock, Zap, Target,
  FileText, Download, Building2, Scale, Lightbulb, BookOpen, Clock,
  CheckCircle2, XCircle, HelpCircle, ArrowRight, Users
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

const RECOMMENDATIONS = [
  {
    priority: "IMMEDIATE",
    title: "Audit all DSE855/890/891/892 gateways for default credentials",
    detail: "Every SETECOM-distributed unit ships with Admin/Password1234. This controls backup generators for ICE's national grid, hospitals, and cell towers. Change credentials and segment OT networks immediately.",
    color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  {
    priority: "IMMEDIATE",
    title: "Sweep for GRIDTIDE persistence (xapt systemd service)",
    detail: "Check all Linux servers for /etc/systemd/system/xapt.service and /usr/sbin/xapt binary. GRIDTIDE uses Google Sheets API as C2 — traditional network IDS will not detect it.",
    color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  {
    priority: "HIGH",
    title: "Deploy Tier-0 hypervisor monitoring",
    detail: "UNC3886 operates below guest OS at the hypervisor level. Current SOC (Mandiant/Google SecOps) monitors application layer only. REPTILE and MEDUSA rootkits are invisible to EDR solutions.",
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  {
    priority: "HIGH",
    title: "Patch MikroTik fleet against CVE-2025-10948",
    detail: "Critical heap overflow (CVSS 8.8–9.8) in REST API. MikroTik routers are ubiquitous in Costa Rican ISP infrastructure. UNC3886 actively exploiting this for botnet recruitment.",
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  {
    priority: "HIGH",
    title: "Investigate TR-069 management plane access",
    detail: "Unauthorized admin password reset detected 2026-01-30 via TR-069 on ARRIS router. This protocol gives ISPs (and anyone with access) full remote control over customer premises equipment.",
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  {
    priority: "MEDIUM",
    title: "Audit Modbus TCP/502 exposure on SCADA networks",
    detail: "Modbus has zero authentication by design. Any device on the network can issue commands to generators, fuel systems, and RPM controllers. Segment and firewall port 502.",
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  {
    priority: "MEDIUM",
    title: "Review SoftEther VPN connections from ICE infrastructure",
    detail: "GRIDTIDE uses SoftEther VPN Bridge for exfiltration to offshore infrastructure. Check for unexpected outbound VPN tunnels from ICE servers.",
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  {
    priority: "STRATEGIC",
    title: "Engage KAPPA platform for continuous SIGINT monitoring",
    detail: "24/7 autonomous correlation across RF, satellite, network, and acoustic domains. Real-time threat scoring, automated evidence chain, and exportable legal-grade documentation.",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
];

const TWO_THEORIES = [
  {
    label: "THEORY A",
    title: "Gallium Attribution is a Cover",
    icon: Eye,
    color: "border-amber-500/30 bg-amber-950/10",
    headerColor: "text-amber-400",
    points: [
      "The breach timing coincides precisely with domestic surveillance activity against individuals who documented infrastructure vulnerabilities",
      "Attributing to a Chinese APT deflects attention from internal security failures and potential misuse of monitoring infrastructure",
      "GRIDTIDE's Google Sheets C2 technique is well-documented since 2024 — a convenient off-the-shelf attribution vector",
      "The 5G ban and Huawei legal battles create a pre-built geopolitical narrative that makes 'China did it' the path of least resistance",
      "Physical surveillance indicators (fiber splitters, TR-069 resets, EVOPRO room monitoring) suggest domestic actors with physical access, not remote APT operations",
      "9GB email exfiltration from a locally-hosted server requires either insider access or persistent local network presence — not typical of PRC remote operations",
    ],
  },
  {
    label: "THEORY B",
    title: "ICE Genuinely Needs Help",
    icon: Shield,
    color: "border-blue-500/30 bg-blue-950/10",
    headerColor: "text-blue-400",
    points: [
      "Costa Rica's critical infrastructure has real, documented vulnerabilities — SETECOM default credentials, unpatched MikroTik routers, exposed SCADA protocols",
      "UNC2814/UNC3886/UNC6384 are real, well-documented threat actors with confirmed global operations across 42+ countries",
      "The Conti ransomware attack (2022) proved Costa Rica is a viable target — the 'state of war' declaration was not theatre",
      "ICE's IT infrastructure predates modern cybersecurity standards and relies heavily on legacy systems with known vulnerabilities",
      "The US $25M cybersecurity grant acknowledges the problem is real and beyond ICE's current capacity to handle alone",
      "Chinese satellite constellation provides persistent overhead coverage — Beidou GNSS + Yaogan/Gaofen ISR creates a complete intelligence picture",
      "Whether or not this specific breach is PRC, the underlying vulnerabilities are real and exploitable by any motivated actor",
    ],
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
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
    "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20",
    "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
    "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20",
  ];
  return <Badge variant="outline" className={colors[phase]}>{labels[phase]}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    IMMEDIATE: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
    HIGH: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    STRATEGIC: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  };
  return (
    <Badge variant="outline" className={colors[priority] || ""}>
      {priority}
    </Badge>
  );
}

export default function GalliumPage() {
  const { toast } = useToast();

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

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto" data-testid="gallium-page">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] font-mono">
                CLASSIFIED — FOR ICE INTERNAL USE
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-gallium-title">
              Intelligence Briefing: ICE Breach & Infrastructure Vulnerabilities
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prepared by KAPPA SIGINT Platform — Project Echo
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
            Refresh Sats
          </Button>
        </div>

        <Card className="border-blue-500/20 bg-blue-500/5" data-testid="card-executive-summary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              On March 12, 2026, the Instituto Costarricense de Electricidad (ICE) publicly disclosed a breach
              resulting in the exfiltration of approximately 9GB of internal email data. Attribution has been directed
              at UNC2814, a China-nexus threat actor operating under the "Gallium" designation, using a novel
              command-and-control backdoor called GRIDTIDE that leverages Google Sheets API to evade traditional
              network detection.
            </p>
            <p>
              This briefing presents two analytical frameworks for evaluating the breach, documents the verified
              technical evidence, and provides actionable recommendations for securing ICE's critical infrastructure
              — regardless of which attribution theory proves correct.
            </p>
            <p className="font-medium">
              The underlying vulnerabilities are real. Whether the attacker is PRC, domestic, or opportunistic,
              ICE's SCADA systems, network edge devices, and OT infrastructure require immediate remediation.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-red-500 dark:text-red-400" data-testid="text-cve-count">{CVE_TABLE.length}</div>
            <div className="text-xs text-muted-foreground">CVEs Documented</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-amber-500 dark:text-amber-400" data-testid="text-rootkit-count">{ROOTKIT_ARSENAL.length}</div>
            <div className="text-xs text-muted-foreground">Rootkit Families</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-blue-500 dark:text-blue-400" data-testid="text-chinese-sat-count">{chineseSats.length}</div>
            <div className="text-xs text-muted-foreground">Chinese Sats Tracked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-mono font-bold text-violet-500 dark:text-violet-400" data-testid="text-recommendation-count">{RECOMMENDATIONS.length}</div>
            <div className="text-xs text-muted-foreground">Action Items</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="theories" className="space-y-3">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto">
          <TabsTrigger value="theories" className="text-xs" data-testid="tab-theories">Two Theories</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs" data-testid="tab-actions">Action Plan</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="gridtide" className="text-xs" data-testid="tab-gridtide">GRIDTIDE</TabsTrigger>
          <TabsTrigger value="vulns" className="text-xs hidden sm:inline-flex" data-testid="tab-vulns">CVEs & SCADA</TabsTrigger>
          <TabsTrigger value="satellites" className="text-xs hidden sm:inline-flex" data-testid="tab-satellites">Satellites</TabsTrigger>
          <TabsTrigger value="arsenal" className="text-xs hidden sm:inline-flex" data-testid="tab-arsenal">Arsenal</TabsTrigger>
        </TabsList>

        <TabsContent value="theories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {TWO_THEORIES.map((theory) => (
              <Card key={theory.label} className={theory.color} data-testid={`card-${theory.label.toLowerCase().replace(" ", "-")}`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-base flex items-center gap-2 ${theory.headerColor}`}>
                    <theory.icon className="h-5 w-5" />
                    <span className="font-mono text-xs">{theory.label}:</span>
                    {theory.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {theory.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                <Lightbulb className="h-4 w-4" />
                Convergence Point
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">
                Both theories lead to the same conclusion: ICE's infrastructure has real, exploitable
                vulnerabilities that require immediate action.
              </p>
              <p className="text-muted-foreground">
                Whether the 9GB email exfiltration was performed by PRC actors, domestic surveillance
                operators seeking cover, or opportunistic attackers exploiting known weaknesses — the
                remediation steps are identical. Secure the SCADA systems. Patch the routers. Audit the
                hypervisors. The attribution question is for diplomats. The vulnerability question is for engineers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Prioritized Remediation Plan
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ordered by criticality. Each item includes specific technical indicators and verification steps.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {RECOMMENDATIONS.map((rec, i) => (
                <div
                  key={i}
                  className={`p-3 sm:p-4 rounded-lg border ${rec.color}`}
                  data-testid={`action-item-${i}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 pt-0.5">
                      <PriorityBadge priority={rec.priority} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{rec.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{rec.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                How KAPPA Can Help
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                The KAPPA platform provides 24/7 autonomous multi-domain signal intelligence correlation.
                It currently monitors:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {[
                  { icon: Radio, text: "RF spectrum via 33 KiwiSDR nodes (71 frequency targets)" },
                  { icon: Satellite, text: "Satellite constellation tracking (Beidou, Yaogan, Gaofen ISR)" },
                  { icon: Wifi, text: "Network forensics — TR-069, PCAP analysis, MAC fingerprinting" },
                  { icon: Globe, text: "External feeds — USGS seismic, NOAA space weather, WWLLN lightning" },
                  { icon: Shield, text: "Automated evidence chain with SHA-256 integrity hashing" },
                  { icon: Users, text: "Device fleet monitoring with latency, jitter, and health scoring" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded border">
                    <item.icon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                Contact: ciajw.com | Platform: KAPPA SIGINT v1.0 | Location: 10.0514°N 84.2187°W
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Attack Timeline (2022–2026)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Three-phase progression: noisy ransomware → transitional infrastructure → silent espionage
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {UNC_TIMELINE.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`timeline-entry-${i}`}
                  >
                    <div className="w-20 sm:w-24 flex-shrink-0 font-mono text-xs text-muted-foreground pt-0.5">
                      {entry.date}
                    </div>
                    <div className="flex-shrink-0 pt-0.5 hidden sm:block">
                      <PhaseBadge phase={entry.phase} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{entry.event}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{entry.actor}</Badge>
                        <SeverityBadge severity={entry.severity} />
                        <span className="sm:hidden"><PhaseBadge phase={entry.phase} /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <HelpCircle className="h-4 w-4" />
                Pattern Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                The timeline follows a well-documented espionage progression: <strong>Phase 0</strong> uses
                noisy ransomware to map defenses and response capabilities.{" "}
                <strong>Phase 1</strong> transitions to infrastructure compromise — physical access (fiber splitters),
                edge device exploitation (DSE855 CVEs), and regulatory maneuvering.{" "}
                <strong>Phase 2</strong> achieves silent persistent access using novel C2 (GRIDTIDE via Google Sheets)
                that bypasses traditional IDS/IPS entirely.
              </p>
              <p className="mt-2 font-mono text-xs">
                As espionage amplitude increases, noise decreases: Ψ(t) = A(t)·N(t) ≡ 1
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gridtide" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-red-500" />
                GRIDTIDE C2 Architecture
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Novel command-and-control using Google Sheets API — no traditional infrastructure to detect
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Technical Profile</h3>
                  <div className="space-y-1.5 text-sm">
                    {Object.entries({
                      "Type": GRIDTIDE_SPEC.type,
                      "C2 Channel": GRIDTIDE_SPEC.c2,
                      "Encryption": GRIDTIDE_SPEC.encryption,
                      "Binary": GRIDTIDE_SPEC.masquerade,
                      "Persistence": GRIDTIDE_SPEC.persistence,
                      "Lateral": GRIDTIDE_SPEC.lateral,
                      "Exfiltration": GRIDTIDE_SPEC.exfil,
                      "Polling": GRIDTIDE_SPEC.polling,
                      "Sanitization": GRIDTIDE_SPEC.sanitization,
                    }).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-muted-foreground w-28 sm:w-36 flex-shrink-0 text-xs">{k}:</span>
                        <span className="font-mono text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Google Sheets Cell Map</h3>
                  {GRIDTIDE_SPEC.cells.map((c, i) => (
                    <div key={i} className="p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">{c.cell}</Badge>
                        <span className="text-xs">{c.function}</span>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 rounded bg-red-500/5 border border-red-500/20">
                    <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">ICE Impact</h4>
                    <p className="text-xs text-muted-foreground">{GRIDTIDE_SPEC.iceData}</p>
                    <p className="text-xs text-muted-foreground mt-1">Scope: {GRIDTIDE_SPEC.scope}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="text-sm font-semibold mb-2">Detection Guidance for ICE SOC</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { check: "Search for /usr/sbin/xapt binary on all Linux systems", type: "Filesystem" },
                    { check: "Audit systemd services for xapt.service", type: "Persistence" },
                    { check: "Monitor Google Sheets API OAuth tokens in outbound traffic", type: "Network" },
                    { check: "Check for AES-128-CBC key files (16-byte) in service account directories", type: "Crypto" },
                    { check: "Detect SoftEther VPN bridge connections to unknown endpoints", type: "Exfil" },
                    { check: "Scan for URL-safe Base64 encoded payloads in HTTP traffic", type: "Traffic" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded border text-xs">
                      <Badge variant="outline" className="text-[9px] flex-shrink-0">{item.type}</Badge>
                      <span>{item.check}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulns" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500" />
                CVE Chain — {CVE_TABLE.length} Confirmed Vulnerabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-xs" data-testid="table-cves">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">CVE</th>
                      <th className="text-left p-2 font-semibold">Target</th>
                      <th className="text-left p-2 font-semibold hidden sm:table-cell">Mechanism</th>
                      <th className="text-left p-2 font-semibold">Actor</th>
                      <th className="text-left p-2 font-semibold">CVSS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CVE_TABLE.map((cve, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50" data-testid={`cve-row-${cve.cve}`}>
                        <td className="p-2 font-mono text-red-600 dark:text-red-400 font-semibold">{cve.cve}</td>
                        <td className="p-2">{cve.target}</td>
                        <td className="p-2 text-muted-foreground hidden sm:table-cell">{cve.mechanism}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-[10px]">{cve.actor}</Badge>
                        </td>
                        <td className="p-2 font-mono">
                          {cve.cvss.includes("Crit") ? (
                            <span className="text-red-600 dark:text-red-400 font-bold">{cve.cvss}</span>
                          ) : cve.cvss.includes("Med") ? (
                            <span className="text-amber-600 dark:text-amber-400">{cve.cvss}</span>
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                SETECOM / SCADA Exposure — ICE Critical Infrastructure
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Default credentials (Admin/Password1234) across the entire Costa Rican generator fleet
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">CRITICAL: Default Credentials Across Fleet</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div><span className="text-muted-foreground">Username:</span> <span className="text-red-600 dark:text-red-300">Admin</span></div>
                  <div><span className="text-muted-foreground">Password:</span> <span className="text-red-600 dark:text-red-300">Password1234</span></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Applied to: DSE 855, DSE 890 MKII, DSE 891, DSE 892 gateways.
                  Controls backup generators for ICE national power grid, Liberty telecom, hospitals, cellular towers.
                </p>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-xs" data-testid="table-setecom">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Protocol</th>
                      <th className="text-left p-2 font-semibold">Port</th>
                      <th className="text-left p-2 font-semibold">Vulnerability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SETECOM_EVIDENCE.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-orange-600 dark:text-orange-400 font-semibold">{p.protocol}</td>
                        <td className="p-2 font-mono">{p.port}</td>
                        <td className="p-2 text-muted-foreground">{p.vulnerability}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4 text-amber-500" />
                Huawei / Geopolitical Evidence Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {HUAWEI_EVIDENCE.map((item, i) => {
                const typeColors: Record<string, string> = {
                  regulatory: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
                  influence: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
                  diplomatic: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
                  retaliatory: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
                  legal: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
                  countermeasure: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
                  vulnerability: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
                };
                return (
                  <div key={i} className="p-3 rounded-lg border" data-testid={`huawei-evidence-${i}`}>
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

        <TabsContent value="satellites" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Chinese Satellite Constellation — Live Tracking
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {chineseSats.length} satellites tracked | {beidouSats.length} Beidou GNSS | {reconSats.length} Recon/ISR | {overheadChinese.length} overhead (&gt;30°)
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
                  <p>No Chinese satellites currently tracked. Click "Refresh Sats" to pull the constellation.</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-xs" data-testid="table-chinese-sats">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-1.5 font-semibold">Name</th>
                        <th className="text-left p-1.5 font-semibold hidden sm:table-cell">NORAD</th>
                        <th className="text-right p-1.5 font-semibold">El°</th>
                        <th className="text-right p-1.5 font-semibold">Az°</th>
                        <th className="text-right p-1.5 font-semibold hidden sm:table-cell">Alt km</th>
                        <th className="text-center p-1.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chineseSats
                        .sort((a, b) => (b.elevation ?? -999) - (a.elevation ?? -999))
                        .map((sat) => {
                          const isOverhead = (sat.elevation ?? 0) > 30;
                          const isRecon = ["YAOGAN", "YG-", "GAOFEN", "GF-", "JILIN"].some(p => (sat.satelliteName || "").toUpperCase().includes(p));
                          return (
                            <tr
                              key={sat.id}
                              className={`border-b hover:bg-muted/50 ${isRecon ? "bg-red-500/5" : ""}`}
                              data-testid={`sat-row-${sat.noradId}`}
                            >
                              <td className="p-1.5 font-mono">
                                {sat.satelliteName}
                                {isRecon && <Badge variant="outline" className="ml-1 text-[8px]">ISR</Badge>}
                              </td>
                              <td className="p-1.5 font-mono text-muted-foreground hidden sm:table-cell">{sat.noradId}</td>
                              <td className={`p-1.5 text-right font-mono ${isOverhead ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                {sat.elevation?.toFixed(1) ?? "—"}
                              </td>
                              <td className="p-1.5 text-right font-mono text-muted-foreground">
                                {sat.azimuth?.toFixed(1) ?? "—"}
                              </td>
                              <td className="p-1.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                                {sat.altitude?.toFixed(0) ?? "—"}
                              </td>
                              <td className="p-1.5 text-center">
                                {isOverhead ? (
                                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                ) : (
                                  <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />
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

        <TabsContent value="arsenal" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-500" />
                PRC-Nexus Malware Arsenal — {ROOTKIT_ARSENAL.length} Families
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Multi-layered persistence from kernel rootkits to memory-resident backdoors
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-xs" data-testid="table-rootkits">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Family</th>
                      <th className="text-left p-2 font-semibold">Layer</th>
                      <th className="text-left p-2 font-semibold hidden sm:table-cell">Mechanism</th>
                      <th className="text-left p-2 font-semibold">Persistence</th>
                      <th className="text-left p-2 font-semibold">Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROOTKIT_ARSENAL.map((r, i) => {
                      const layerColors: Record<string, string> = {
                        Kernel: "text-red-600 dark:text-red-400",
                        Application: "text-amber-600 dark:text-amber-400",
                        Memory: "text-violet-600 dark:text-violet-400",
                      };
                      return (
                        <tr key={i} className="border-b hover:bg-muted/50" data-testid={`rootkit-row-${r.family}`}>
                          <td className="p-2 font-mono font-bold text-red-600 dark:text-red-300">{r.family}</td>
                          <td className={`p-2 font-semibold ${layerColors[r.layer] || "text-muted-foreground"}`}>{r.layer}</td>
                          <td className="p-2 text-muted-foreground hidden sm:table-cell">{r.mechanism}</td>
                          <td className="p-2 text-muted-foreground">{r.persistence}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-[10px]">{r.actor}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 rounded-lg border">
                <h4 className="text-xs font-semibold mb-1">Key Operational Insight</h4>
                <p className="text-xs text-muted-foreground">
                  UNC3886 operates below guest OS at Tier-0 hypervisor level — invisible to all EDR solutions.
                  Median dwell time for these espionage operations:{" "}
                  <span className="text-red-600 dark:text-red-400 font-bold font-mono">122 days</span> (~10x average eCrime).
                  The US-funded SOC monitors application-layer traffic while these actors persist at the hypervisor level.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-muted">
        <CardContent className="p-4 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">KAPPA SIGINT Platform — Intelligence Briefing</p>
          <p>Prepared for Instituto Costarricense de Electricidad (ICE) — {new Date().toLocaleDateString()}</p>
          <p className="font-mono">ciajw.com | 10.0514°N 84.2187°W | Project Echo</p>
        </CardContent>
      </Card>
    </div>
  );
}
