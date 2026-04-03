import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  type SatellitePass,
  type KappaStatus,
  type SignalEvent,
  type Correlation,
  KAPPA_CONSTANTS,
  THREAT_LEVELS,
} from "@shared/schema";
import {
  RefreshCw, Shield, AlertTriangle, Globe,
  Eye, Wifi, Cpu, Lock, Zap, Target,
  FileText, Building2, Lightbulb, Clock,
  CheckCircle2, HelpCircle, ArrowRight, Users,
  Search, Filter, ChevronDown, ChevronRight,
  Activity, Satellite, Radio, Signal,
  TrendingUp, BarChart3, Download,
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

function getThreatColor(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].color;
  }
  return THREAT_LEVELS[0].color;
}

const UNC_TIMELINE = [
  { date: "2022-04-17", event: "Conti ransomware (UNC1756) hits ~30 Costa Rican institutions", severity: "critical", actor: "UNC1756/Conti", phase: 0, detail: "The Conti group (tracked as UNC1756) launched a coordinated ransomware campaign against Costa Rican government institutions, encrypting systems across the Ministry of Finance (Hacienda), CCSS, and approximately 28 other agencies. This was the first 'Phase 0' probe — noisy by design, mapping institutional response capabilities, backup procedures, and inter-agency communication channels." },
  { date: "2022-05-08", event: "President Chaves declares national emergency — 'state of war'", severity: "critical", actor: "State Response", phase: 0, detail: "President Rodrigo Chaves declared a national emergency, describing the situation as a 'state of war' against the cybercriminals. This unprecedented declaration for a cyber incident signaled to adversaries that Costa Rica's defenses were overwhelmed and that institutional coordination was fragile — valuable intelligence for Phase 1 planning." },
  { date: "2022-05-31", event: "Hive ransomware targets CCSS (EDUS + SICERE destroyed)", severity: "high", actor: "Hive", phase: 0, detail: "The Hive ransomware group attacked CCSS (Caja Costarricense de Seguro Social), destroying the EDUS (Unified Digital Health Record) and SICERE (Centralized Collection System) databases. This forced healthcare workers back to paper records and disrupted social security payments for millions. The attack demonstrated that critical social infrastructure could be held hostage." },
  { date: "2023-08-XX", event: "Budapest Convention 5G decree — Huawei/ZTE banned from CR infrastructure", severity: "medium", actor: "Geopolitical", phase: 1, detail: "An executive decree required all 5G infrastructure vendors to be signatories of the Budapest Convention on Cybercrime — which China has not signed. This effectively banned Huawei and ZTE from Costa Rica's 5G rollout. The decree triggered aggressive legal challenges from Huawei through the Constitutional Court and allegedly prompted Beijing to leverage ICE's internal workers' union as a proxy to appeal the ban." },
  { date: "2024-06-XX", event: "CISA/ZDI publish DSE855 CVEs (5947/5950/5949/5952)", severity: "high", actor: "CISA", phase: 1, detail: "CISA and the Zero Day Initiative published four critical vulnerabilities in DSE855 Ethernet gateways manufactured by Deep Sea Electronics, distributed exclusively in Costa Rica by SETECOM S.A. These gateways control backup generators for ICE's power grid, hospitals, and cellular towers. CVE-2024-5947 allows unauthenticated download of the configuration backup containing plaintext SCADA credentials." },
  { date: "2025-06-21", event: "Fiber splitter (NAP/Colilla) installed at Telecable distribution box", severity: "high", actor: "Physical", phase: 1, detail: "A physical fiber optic splitter (NAP/Colilla) was identified installed at a Telecable distribution box serving the Sabana Norte area. This type of passive optical tap allows interception of all fiber traffic without introducing detectable signal degradation. The installation suggests actors with physical access to ISP infrastructure — a capability consistent with domestic surveillance rather than remote APT operations." },
  { date: "2026-01-XX", event: "PRC bans ~12 Western/Israeli cybersecurity firms (Document 79)", severity: "medium", actor: "Geopolitical", phase: 2, detail: "The PRC issued 'Document 79' ordering state-owned enterprises in the financial and energy sectors to replace all Western and Israeli cybersecurity software by 2027. This retaliatory action — following the Budapest Convention decree and other Western tech restrictions — signals escalating cyber-geopolitical tensions with direct implications for Costa Rica's positioning." },
  { date: "2026-01-25", event: "ICE breach detected by GTIG/Mandiant — GRIDTIDE C2 identified", severity: "critical", actor: "UNC2814/Gallium", phase: 2, detail: "Google's Threat Intelligence Group (GTIG), operating through Mandiant, detected the ICE breach and identified GRIDTIDE — a novel C-based backdoor using Google Sheets API as its command-and-control channel. The backdoor masquerades as 'xapt' (mimicking the APT package manager) and persists via systemd service. Its use of legitimate Google infrastructure makes it invisible to traditional network IDS/IPS." },
  { date: "2026-01-30", event: "Unauthorized TR-069 admin password reset on ARRIS router", severity: "high", actor: "UNC2814", phase: 2, detail: "An unauthorized administrative password reset was detected on an ARRIS router via the TR-069 (CPE WAN Management Protocol) interface. TR-069 gives ISPs full remote management capability over customer premises equipment. This event indicates either ISP-level access or compromise of the TR-069 Auto Configuration Server (ACS) — both scenarios imply deep infrastructure penetration." },
  { date: "2026-03-12", event: "ICE publicly discloses ~9GB email data breach", severity: "critical", actor: "UNC2814/Gallium", phase: 2, detail: "ICE officially disclosed that approximately 9GB of internal email data had been exfiltrated from a locally-hosted email server. The exfiltration used SoftEther VPN Bridge to offshore infrastructure, with data encoded in URL-safe Base64. The locally-hosted nature of the server means the attacker required either persistent local network access or insider credentials — not typical of purely remote PRC operations." },
  { date: "2026-03-13", event: "Media attributes ICE breach to Chinese APT 'Gallium'", severity: "critical", actor: "Attribution", phase: 2, detail: "Costa Rican and international media attributed the ICE breach to the Chinese APT group 'Gallium' (tracked by Mandiant as UNC2814). The attribution is based on GRIDTIDE's C2 infrastructure patterns and overlaps with previous UNC2814 campaigns across 53 organizations in 42 countries. However, GRIDTIDE's technique was publicly documented in the Voldemort Campaign (Proofpoint, Aug 2024), making false-flag operations feasible." },
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
  { cve: "CVE-2022-41328", target: "FortiOS", mechanism: "Path traversal", actor: "UNC3886", cvss: "—", status: "confirmed", detail: "Allows authenticated attackers to read and write files via crafted CLI commands. Used by UNC3886 to deploy BOLDMOVE backdoor on FortiGate firewalls, providing persistent access to network perimeter devices." },
  { cve: "CVE-2023-20867", target: "VMware Tools", mechanism: "Guest Operations bypass", actor: "UNC3886", cvss: "—", status: "confirmed", detail: "Authentication bypass in VMware Tools Guest Operations allows a fully compromised ESXi host to perform unauthenticated guest operations on any virtual machine. UNC3886 uses this to move laterally across virtualized infrastructure without triggering guest-level alerts." },
  { cve: "CVE-2023-30799", target: "MikroTik RouterOS", mechanism: "Privilege escalation", actor: "UNC3886", cvss: "—", status: "confirmed", detail: "Super Admin privilege escalation via FTP/API. MikroTik routers are extremely common in Costa Rican ISP infrastructure. Once compromised, attackers gain full control of routing, DNS, and traffic mirroring capabilities." },
  { cve: "CVE-2023-34048", target: "VMware vCenter", mechanism: "Out-of-bounds write (DCERPC)", actor: "UNC3886", cvss: "—", status: "confirmed", detail: "Memory corruption vulnerability in vCenter's DCERPC protocol implementation. Allows unauthenticated remote code execution on vCenter servers, giving attackers control of the entire virtualization management plane." },
  { cve: "CVE-2024-5947", target: "DSE855 Gateway", mechanism: "HTTP GET /Backup.bin → plaintext SCADA creds", actor: "SETECOM exposure", cvss: "6.5 Med", status: "confirmed", detail: "An unauthenticated HTTP GET request to /Backup.bin on DSE855 gateways returns the complete configuration backup file containing plaintext SCADA credentials, network settings, and generator control parameters. Every SETECOM-distributed unit in Costa Rica is affected." },
  { cve: "CVE-2024-5950", target: "DSE855 Gateway", mechanism: "Stack buffer overflow → RCE on NXP LPC4357", actor: "SETECOM exposure", cvss: "—", status: "confirmed", detail: "Stack-based buffer overflow in the DSE855 web server running on an NXP LPC4357 microcontroller. Successful exploitation provides arbitrary code execution on the embedded controller, enabling full control of the connected generator including start/stop, load management, and alarm suppression." },
  { cve: "CVE-2024-5949", target: "DSE855 Gateway", mechanism: "Multipart boundary → infinite loop DoS", actor: "SETECOM exposure", cvss: "—", status: "confirmed", detail: "A crafted multipart HTTP request with a malformed boundary triggers an infinite loop in the DSE855 web server, causing a denial of service. This can be used to disable remote monitoring of generators during a coordinated attack." },
  { cve: "CVE-2024-5952", target: "DSE855 Gateway", mechanism: "Unauth web UI restart → device reboot", actor: "SETECOM exposure", cvss: "—", status: "confirmed", detail: "An unauthenticated request to the DSE855 web UI can trigger a device reboot. Combined with CVE-2024-5949, this enables intermittent disruption of generator monitoring and control systems." },
  { cve: "CVE-2025-10948", target: "MikroTik REST API", mechanism: "Heap overflow in libjson.so parse_json_element()", actor: "UNC3886/Botnet", cvss: "8.8–9.8 Crit", status: "confirmed", detail: "Critical heap-based buffer overflow in MikroTik RouterOS libjson.so library. Triggered by a crafted JSON payload to the REST API. CVSS 8.8-9.8 depending on configuration. Actively exploited in the wild for botnet recruitment and persistent router compromise. Ubiquitous in Costa Rican ISP infrastructure." },
  { cve: "CVE-2025-21590", target: "Juniper MX", mechanism: "Improper isolation of shared resources", actor: "UNC3886", cvss: "—", status: "confirmed", detail: "Improper isolation of shared resources in Juniper MX series routers allows a local attacker to inject arbitrary code into the FreeBSD process space. UNC3886 uses TINYSHELL variants for persistent access to Juniper infrastructure." },
  { cve: "CVE-2025-9491", target: "Windows LNK", mechanism: "Zero-day exploitation", actor: "UNC6384", cvss: "—", status: "confirmed", detail: "Zero-day vulnerability in Windows LNK file processing. Exploited by UNC6384 (Mustang Panda) for initial access via spear-phishing. The LNK file executes arbitrary commands when the user views the containing folder in Explorer." },
  { cve: "ZDI-CAN-25373", target: "Windows LNK", mechanism: "Spear-phishing via LNK", actor: "UNC6384/Mustang Panda", cvss: "—", status: "confirmed", detail: "Related to CVE-2025-9491. ZDI tracked this variant separately. Mustang Panda (UNC6384) used crafted LNK files in spear-phishing campaigns targeting government institutions. The STATICPLUGIN downloader is delivered through AitM captive portal with valid code-signing certificates." },
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
  { protocol: "Modbus TCP/IP", port: "502", vulnerability: "No authentication, no encryption, no integrity checking by protocol design", detail: "Modbus was designed in 1979 for serial communication between PLCs. It has zero security features. Any device that can reach port 502 can read registers, write coils, and issue commands to connected equipment. In ICE's generator infrastructure, this means fuel injection rates, RPM targets, and emergency shutdown commands are accessible to any network-adjacent attacker." },
  { protocol: "SNMP v2c", port: "161/162 UDP", vulnerability: "Cleartext community strings 'public' (read) / 'private' (read-write) routinely unchanged", detail: "SNMP v2c transmits community strings (effectively passwords) in cleartext. The default 'public' and 'private' strings are rarely changed on SETECOM-distributed equipment. An attacker with network access can enumerate all devices, read configuration, and — with the 'private' string — modify device settings including alarm thresholds and operational parameters." },
  { protocol: "J1939 CAN Bus", port: "—", vulnerability: "29-bit identifier (3P + 18PGN + 8SA); direct ECU access for fuel injection, RPM, engine overspeed", detail: "J1939 CAN Bus is the standard communication protocol for heavy-duty diesel generators. It provides direct access to Engine Control Units (ECUs) with no authentication. An attacker on the CAN bus can modify fuel injection timing, override RPM limiters, suppress overspeed alarms, and potentially cause physical damage to generators." },
  { protocol: "DSE WebNet", port: "HTTP", vulnerability: "Default Admin/Password1234 across entire fleet (DSE 855, 890 MKII, 891, 892)", detail: "DSE WebNet is the cloud management platform for Deep Sea Electronics controllers. SETECOM S.A. has deployed these across the entire Costa Rican generator fleet with default credentials Admin/Password1234. This provides web-based remote access to start/stop generators, modify load sharing, adjust protection settings, and suppress alarms across the national infrastructure." },
];

const ROOTKIT_ARSENAL = [
  { family: "REPTILE", layer: "Kernel", mechanism: "Loadable kernel module", persistence: "Auto-loads via modprobe.d", actor: "UNC3886", detail: "REPTILE is a Linux kernel rootkit distributed as a loadable kernel module (LKM). It provides process hiding, file hiding, network traffic hiding, and a magic packet backdoor for reverse shell access. Auto-loads at boot via modprobe.d configuration. Extremely difficult to detect without kernel-level memory forensics." },
  { family: "MEDUSA", layer: "Kernel", mechanism: "Credential harvester via LD_PRELOAD", persistence: "Intercepts PAM auth", detail: "MEDUSA hooks into the PAM (Pluggable Authentication Module) stack via LD_PRELOAD injection. Every authentication event — SSH logins, sudo commands, service account authentications — is captured and logged. Credentials are either stored locally for later exfiltration or forwarded in real-time to C2 infrastructure.", actor: "UNC3886" },
  { family: "GRIDTIDE", layer: "Application", mechanism: "Google Sheets API C2", persistence: "systemd service (xapt)", actor: "UNC2814", detail: "GRIDTIDE is the novel C2 backdoor identified in the ICE breach. It uses Google Sheets API for command-and-control, eliminating the need for attacker-controlled infrastructure. Commands are written to cell A1, data exfiltration occurs through cells A2-An in 45KB fragments, and host fingerprinting is stored in V1. The binary masquerades as 'xapt' to mimic the apt package manager." },
  { family: "SOGU.SEC/PlugX", layer: "Memory", mechanism: "DLL side-loading, memory-resident", persistence: "No disk footprint", actor: "UNC6384", detail: "PlugX (also tracked as SOGU.SEC) is a memory-resident remote access trojan delivered via DLL side-loading. It runs entirely in memory with no persistent disk footprint, making it invisible to traditional file-based antivirus scanning. Used by UNC6384 (Mustang Panda) for espionage operations." },
  { family: "TINYSHELL", layer: "Application", mechanism: "Custom reverse shell variants", persistence: "Juniper FreeBSD process injection", actor: "UNC3886", detail: "TINYSHELL is a lightweight custom reverse shell that UNC3886 has adapted for Juniper MX series routers running FreeBSD. It injects into legitimate system processes, making detection via process listing difficult. The Juniper-specific variant exploits CVE-2025-21590 for initial injection." },
  { family: "STATICPLUGIN", layer: "Application", mechanism: "Signed downloader via AitM captive portal", persistence: "Valid code-signing certs", actor: "UNC6384", detail: "STATICPLUGIN is a downloader that uses adversary-in-the-middle (AitM) captive portal techniques to deliver payloads signed with valid code-signing certificates. Because the payloads are properly signed, they bypass SmartScreen, WDAC, and other code-signing verification checks." },
];

const RECOMMENDATIONS = [
  { priority: "IMMEDIATE", title: "Audit all DSE855/890/891/892 gateways for default credentials", detail: "Every SETECOM-distributed unit ships with Admin/Password1234. This controls backup generators for ICE's national grid, hospitals, and cell towers. Change credentials and segment OT networks immediately.", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", steps: ["Enumerate all DSE units via SNMP discovery or DSE WebNet inventory", "Change default credentials on every unit (Admin/Password1234)", "Implement network segmentation between OT and IT networks", "Deploy monitoring on port 502 (Modbus) and DSE WebNet HTTP interfaces", "Establish credential rotation policy for all SCADA equipment"] },
  { priority: "IMMEDIATE", title: "Sweep for GRIDTIDE persistence (xapt systemd service)", detail: "Check all Linux servers for /etc/systemd/system/xapt.service and /usr/sbin/xapt binary. GRIDTIDE uses Google Sheets API as C2 — traditional network IDS will not detect it.", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", steps: ["Run: find / -name 'xapt' -o -name 'xapt.service' on all Linux systems", "Check systemd: systemctl list-units --type=service | grep xapt", "Audit Google Sheets API OAuth tokens in outbound traffic logs", "Search for 16-byte key files in /etc/ and service account home directories", "Check for SoftEther VPN Bridge processes and connections"] },
  { priority: "HIGH", title: "Deploy Tier-0 hypervisor monitoring", detail: "UNC3886 operates below guest OS at the hypervisor level. Current SOC monitors application layer only. REPTILE and MEDUSA rootkits are invisible to EDR.", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20", steps: ["Deploy hypervisor-level integrity monitoring on all ESXi hosts", "Implement VMware vCenter audit logging with SIEM integration", "Check for unauthorized kernel modules: lsmod and /etc/modprobe.d/", "Verify LD_PRELOAD is not set in /etc/environment or PAM configs", "Conduct memory forensics on critical servers"] },
  { priority: "HIGH", title: "Patch MikroTik fleet against CVE-2025-10948", detail: "Critical heap overflow (CVSS 8.8–9.8) in REST API. MikroTik routers are ubiquitous in Costa Rican ISP infrastructure.", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20", steps: ["Inventory all MikroTik devices across ICE infrastructure", "Update RouterOS to latest stable release", "Disable REST API on all devices where not required", "Implement ACLs restricting management access to trusted IPs", "Monitor for exploitation attempts via IDS signatures"] },
  { priority: "HIGH", title: "Investigate TR-069 management plane access", detail: "Unauthorized admin password reset detected 2026-01-30 via TR-069 on ARRIS router.", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20", steps: ["Audit TR-069 ACS (Auto Configuration Server) access logs", "Review all CPE password reset events in the last 6 months", "Verify ACS authentication and authorization controls", "Implement TR-069 connection encryption (TLS)", "Consider restricting TR-069 access to management VLAN only"] },
  { priority: "MEDIUM", title: "Audit Modbus TCP/502 exposure on SCADA networks", detail: "Modbus has zero authentication by design. Segment and firewall port 502.", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", steps: ["Scan for open port 502 across all network segments", "Implement firewall rules restricting Modbus access to authorized HMIs only", "Deploy Modbus-aware IDS (e.g., Suricata with Modbus rules)", "Consider Modbus/TCP proxy with authentication overlay", "Document all legitimate Modbus communication paths"] },
  { priority: "MEDIUM", title: "Review SoftEther VPN connections from ICE infrastructure", detail: "GRIDTIDE uses SoftEther VPN Bridge for exfiltration.", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", steps: ["Search for SoftEther VPN processes on all servers", "Check for unexpected outbound VPN tunnels (ports 443, 992, 5555)", "Review firewall logs for SoftEther protocol signatures", "Block SoftEther at the perimeter unless explicitly authorized", "Implement DLP controls on outbound encrypted tunnels"] },
  { priority: "STRATEGIC", title: "Engage KAPPA platform for continuous SIGINT monitoring", detail: "24/7 autonomous correlation across RF, satellite, network, and acoustic domains.", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", steps: ["Review KAPPA platform capabilities at ciajw.com", "Schedule briefing with KAPPA operator (Suites Cristina, Sabana Norte)", "Evaluate integration with ICE SOC for continuous monitoring", "Consider deployment of passive RF sensors at ICE facilities", "Establish secure communication channel for intelligence sharing"] },
];

const TWO_THEORIES = [
  {
    label: "THEORY A",
    title: "Gallium Attribution is a Cover",
    icon: Eye,
    color: "border-amber-500/30 bg-amber-500/5",
    headerColor: "text-amber-600 dark:text-amber-400",
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
    color: "border-blue-500/30 bg-blue-500/5",
    headerColor: "text-blue-600 dark:text-blue-400",
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
  return <Badge variant="outline" className={colors[priority] || ""}>{priority}</Badge>;
}

function ExpandableRow({ children, detail }: { children: React.ReactNode; detail: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className="flex items-start gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
        onClick={() => setOpen(!open)}
        data-testid="expandable-row"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      {open && (
        <div className="ml-6 mr-2 mb-2 p-3 rounded-lg bg-muted/30 border text-xs text-muted-foreground leading-relaxed">
          {detail}
        </div>
      )}
    </div>
  );
}

function LiveKappaPanel({ kappaStatus, stats }: {
  kappaStatus?: KappaStatus;
  stats?: { totalEvents: number; correlationCount: number; domainCounts: Record<string, number> };
}) {
  const score = kappaStatus?.score ?? 0;
  const threat = kappaStatus?.threatLevel ?? "NOMINAL";
  const color = getThreatColor(score);

  return (
    <Card className="border-green-500/20 bg-green-500/5" data-testid="card-live-kappa">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          KAPPA Live Status — Real-Time Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded border">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
              <span className="text-lg font-mono font-bold" data-testid="text-live-score">{score.toFixed(1)}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">KAPPA Score</div>
            <Badge variant="outline" className="text-[9px] mt-0.5">{threat}</Badge>
          </div>
          <div className="text-center p-2 rounded border">
            <div className="text-lg font-mono font-bold" data-testid="text-live-events">{(stats?.totalEvents ?? 0).toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">Total Events</div>
          </div>
          <div className="text-center p-2 rounded border">
            <div className="text-lg font-mono font-bold" data-testid="text-live-correlations">{(stats?.correlationCount ?? 0).toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">Correlations</div>
          </div>
          <div className="text-center p-2 rounded border">
            <div className="text-lg font-mono font-bold">{kappaStatus?.eveningWindow?.localTime ?? "--:--"}</div>
            <div className="text-[10px] text-muted-foreground">Local Time CST</div>
            {kappaStatus?.eveningWindow?.active && <Badge variant="secondary" className="text-[9px] mt-0.5">EW ACTIVE</Badge>}
          </div>
        </div>
        {stats?.domainCounts && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Domains:</span>
            {Object.entries(stats.domainCounts).sort((a, b) => b[1] - a[1]).map(([domain, count]) => (
              <Badge key={domain} variant="outline" className="text-[9px] font-mono">
                {domain}: {count.toLocaleString()}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CorrelationExplorer({ correlations, events }: {
  correlations?: Correlation[];
  events?: SignalEvent[];
}) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const filteredCorrelations = useMemo(() => {
    if (!correlations) return [];
    return correlations
      .filter(c => {
        const meta = c.metadata as Record<string, unknown> | null;
        const cType = (meta?.type as string) ?? c.ruleName;
        const cDomains = (meta?.domains as string[]) ?? [];
        if (search && !cType.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (domainFilter !== "all" && !cDomains.includes(domainFilter)) return false;
        return true;
      })
      .slice(0, 50);
  }, [correlations, search, domainFilter]);

  const allDomains = useMemo(() => {
    if (!correlations) return [];
    const domains = new Set<string>();
    correlations.forEach(c => ((c.metadata as Record<string, unknown> | null)?.domains as string[] ?? []).forEach((d: string) => domains.add(d)));
    return Array.from(domains).sort();
  }, [correlations]);

  const recentEvents = useMemo(() => {
    if (!events) return [];
    return events
      .filter(e => {
        if (search && !e.source.toLowerCase().includes(search.toLowerCase()) && !e.domain.toLowerCase().includes(search.toLowerCase())) return false;
        if (domainFilter !== "all" && e.domain !== domainFilter) return false;
        return true;
      })
      .slice(0, 30);
  }, [events, search, domainFilter]);

  const domainIcons: Record<string, typeof Activity> = {
    satellite: Satellite,
    sdr: Radio,
    elf: Activity,
    radar: Radio,
    isp: Wifi,
    rf: Signal,
  };

  return (
    <Card data-testid="card-correlation-explorer">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          Live Data Explorer
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Search and filter real-time KAPPA events and correlations
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, correlations, sources..."
              className="pl-8 h-9 text-sm"
              data-testid="input-search-explorer"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant={domainFilter === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDomainFilter("all")}
              data-testid="filter-all"
            >
              All
            </Button>
            {allDomains.map(d => (
              <Button
                key={d}
                variant={domainFilter === d ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setDomainFilter(d)}
                data-testid={`filter-${d}`}
              >
                {d}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Recent Events ({recentEvents.length})
            </h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1 pr-2">
                {recentEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No events match your filter</p>
                ) : recentEvents.map((evt) => {
                  const Icon = domainIcons[evt.domain] ?? Activity;
                  return (
                    <div key={evt.id} className="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-muted/50" data-testid={`explorer-event-${evt.id}`}>
                      <Icon className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[8px] px-1 h-3.5">{evt.domain}</Badge>
                          <span className="font-mono truncate">{evt.source}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Correlations ({filteredCorrelations.length})
            </h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1 pr-2">
                {filteredCorrelations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No correlations match your filter</p>
                ) : filteredCorrelations.map((c) => (
                  <div key={c.id} className="text-xs p-1.5 rounded hover:bg-muted/50" data-testid={`explorer-corr-${c.id}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-[10px]">{(c.metadata as Record<string, unknown> | null)?.type as string ?? c.ruleName}</span>
                      <Badge variant="outline" className="text-[8px]">
                        {(((c.metadata as Record<string, unknown> | null)?.confidence as number) ?? 0 * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {((c.metadata as Record<string, unknown> | null)?.domains as string[] ?? []).map((d: string) => (
                        <Badge key={d} variant="secondary" className="text-[8px] h-3.5 px-1">{d}</Badge>
                      ))}
                      <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                        {new Date(c.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GalliumPage() {
  const { toast } = useToast();
  const [timelinePhaseFilter, setTimelinePhaseFilter] = useState<number | null>(null);
  const [cveSearch, setCveSearch] = useState("");
  const [satSearch, setSatSearch] = useState("");

  const { data: kappaStatus } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery<{
    totalEvents: number;
    correlationCount: number;
    domainCounts: Record<string, number>;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  const { data: recentEvents } = useQuery<SignalEvent[]>({
    queryKey: ["/api/events", "recent"],
    refetchInterval: 15000,
  });

  const { data: correlations } = useQuery<Correlation[]>({
    queryKey: ["/api/correlations"],
    refetchInterval: 15000,
  });

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

  const filteredSats = useMemo(() => {
    if (!satSearch) return chineseSats;
    const lower = satSearch.toLowerCase();
    return chineseSats.filter(s => s.satelliteName.toLowerCase().includes(lower));
  }, [chineseSats, satSearch]);

  const beidouSats = useMemo(() => chineseSats.filter(s => s.satelliteName.toUpperCase().includes("BEIDOU")), [chineseSats]);
  const reconSats = useMemo(() => chineseSats.filter(s => {
    const n = s.satelliteName.toUpperCase();
    return n.includes("YAOGAN") || n.includes("YG-") || n.includes("GAOFEN") || n.includes("GF-") || n.includes("JILIN");
  }), [chineseSats]);
  const overheadChinese = useMemo(() => chineseSats.filter(s => (s.elevation ?? 0) > 30), [chineseSats]);

  const filteredTimeline = useMemo(() => {
    if (timelinePhaseFilter === null) return UNC_TIMELINE;
    return UNC_TIMELINE.filter(e => e.phase === timelinePhaseFilter);
  }, [timelinePhaseFilter]);

  const filteredCVEs = useMemo(() => {
    if (!cveSearch) return CVE_TABLE;
    const lower = cveSearch.toLowerCase();
    return CVE_TABLE.filter(c =>
      c.cve.toLowerCase().includes(lower) ||
      c.target.toLowerCase().includes(lower) ||
      c.actor.toLowerCase().includes(lower) ||
      c.mechanism.toLowerCase().includes(lower)
    );
  }, [cveSearch]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto" data-testid="gallium-page">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] font-mono">
                CLASSIFIED — FOR ICE INTERNAL USE
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-gallium-title">
              Intelligence Briefing: ICE Breach & Infrastructure Vulnerabilities
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prepared by KAPPA SIGINT Platform — Project Echo | Interactive Report
            </p>
          </div>
          <div className="flex gap-2">
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
              command-and-control backdoor called GRIDTIDE that leverages Google Sheets API.
            </p>
            <p className="font-medium">
              This interactive briefing allows ICE analysts to explore the evidence, filter by domain,
              search across all datasets, and correlate findings with live KAPPA platform data.
              Click any timeline entry, CVE, or evidence item to expand its full analysis.
            </p>
          </CardContent>
        </Card>

        <LiveKappaPanel kappaStatus={kappaStatus} stats={stats} />
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
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto">
          <TabsTrigger value="theories" className="text-xs" data-testid="tab-theories">Theories</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs" data-testid="tab-actions">Actions</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="gridtide" className="text-xs" data-testid="tab-gridtide">GRIDTIDE</TabsTrigger>
          <TabsTrigger value="vulns" className="text-xs" data-testid="tab-vulns">CVEs</TabsTrigger>
          <TabsTrigger value="satellites" className="text-xs" data-testid="tab-satellites">Satellites</TabsTrigger>
          <TabsTrigger value="arsenal" className="text-xs" data-testid="tab-arsenal">Arsenal</TabsTrigger>
          <TabsTrigger value="explorer" className="text-xs" data-testid="tab-explorer">Explorer</TabsTrigger>
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
                The attribution question is for diplomats. The vulnerability question is for engineers.
                This briefing focuses on the engineering.
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
                Click any item to expand detailed implementation steps
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {RECOMMENDATIONS.map((rec, i) => (
                <ExpandableRow
                  key={i}
                  detail={rec.steps.map((s, j) => `${j + 1}. ${s}`).join("\n")}
                >
                  <div className={`p-2 rounded-lg border ${rec.color}`} data-testid={`action-item-${i}`}>
                    <div className="flex items-start gap-2">
                      <PriorityBadge priority={rec.priority} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold">{rec.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.detail}</p>
                      </div>
                    </div>
                  </div>
                </ExpandableRow>
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
              <p>The KAPPA platform provides 24/7 autonomous multi-domain signal intelligence correlation:</p>
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
                Contact: ciajw.com | Suites Cristina, Sabana Norte | 10.0514°N 84.2187°W
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
                Click any event to expand full analysis. Filter by phase below.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Button variant={timelinePhaseFilter === null ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setTimelinePhaseFilter(null)} data-testid="filter-phase-all">All Phases</Button>
                <Button variant={timelinePhaseFilter === 0 ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setTimelinePhaseFilter(0)} data-testid="filter-phase-0">Phase 0: Noise</Button>
                <Button variant={timelinePhaseFilter === 1 ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setTimelinePhaseFilter(1)} data-testid="filter-phase-1">Phase 1: Transition</Button>
                <Button variant={timelinePhaseFilter === 2 ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setTimelinePhaseFilter(2)} data-testid="filter-phase-2">Phase 2: Silent</Button>
              </div>
              <div className="space-y-0.5">
                {filteredTimeline.map((entry, i) => (
                  <ExpandableRow key={i} detail={entry.detail}>
                    <div className="flex items-start gap-2" data-testid={`timeline-entry-${i}`}>
                      <div className="w-20 sm:w-24 flex-shrink-0 font-mono text-xs text-muted-foreground pt-0.5">{entry.date}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{entry.event}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{entry.actor}</Badge>
                          <SeverityBadge severity={entry.severity} />
                          <PhaseBadge phase={entry.phase} />
                        </div>
                      </div>
                    </div>
                  </ExpandableRow>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <HelpCircle className="h-4 w-4" />
                Pattern: Espionage Amplitude Inversion
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-mono text-xs mb-2">Ψ(t) = A(t) · N(t) ≡ 1</p>
              <p>
                As espionage amplitude increases, noise decreases.
                Phase 0 was deliberately noisy (ransomware) to map defenses.
                Phase 2 achieves near-zero detection via Google Sheets C2.
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
                CVE Chain — Click any CVE to expand analysis
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={cveSearch}
                  onChange={(e) => setCveSearch(e.target.value)}
                  placeholder="Search CVEs, targets, actors..."
                  className="pl-8 h-8 text-xs"
                  data-testid="input-search-cves"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                {filteredCVEs.map((cve, i) => (
                  <ExpandableRow key={i} detail={cve.detail}>
                    <div className="flex items-center gap-2 flex-wrap" data-testid={`cve-row-${cve.cve}`}>
                      <span className="font-mono text-xs text-red-600 dark:text-red-400 font-bold w-28 flex-shrink-0">{cve.cve}</span>
                      <span className="text-xs">{cve.target}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">— {cve.mechanism}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto">{cve.actor}</Badge>
                      {cve.cvss !== "—" && (
                        <span className={`text-[10px] font-mono ${cve.cvss.includes("Crit") ? "text-red-600 dark:text-red-400 font-bold" : "text-amber-600 dark:text-amber-400"}`}>
                          {cve.cvss}
                        </span>
                      )}
                    </div>
                  </ExpandableRow>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                SETECOM / SCADA — Click to expand each protocol analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">CRITICAL: Default Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div><span className="text-muted-foreground">Username:</span> <span className="text-red-600 dark:text-red-300">Admin</span></div>
                  <div><span className="text-muted-foreground">Password:</span> <span className="text-red-600 dark:text-red-300">Password1234</span></div>
                </div>
              </div>
              {SETECOM_EVIDENCE.map((p, i) => (
                <ExpandableRow key={i} detail={p.detail}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-orange-600 dark:text-orange-400 font-semibold w-28 flex-shrink-0">{p.protocol}</span>
                    <span className="text-xs font-mono text-muted-foreground w-20 flex-shrink-0">{p.port}</span>
                    <span className="text-xs text-muted-foreground">{p.vulnerability}</span>
                  </div>
                </ExpandableRow>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4 text-amber-500" />
                Huawei / Geopolitical Evidence
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
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={satSearch}
                    onChange={(e) => setSatSearch(e.target.value)}
                    placeholder="Search satellites..."
                    className="pl-8 h-8 text-xs"
                    data-testid="input-search-sats"
                  />
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[9px]">{chineseSats.length} total</Badge>
                  <Badge variant="outline" className="text-[9px]">{beidouSats.length} Beidou</Badge>
                  <Badge variant="outline" className="text-[9px]">{reconSats.length} ISR</Badge>
                  <Badge variant="outline" className="text-[9px]">{overheadChinese.length} overhead</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {satsLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : filteredSats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>{chineseSats.length === 0 ? "No Chinese satellites tracked. Click 'Refresh Sats'." : "No satellites match your search."}</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <table className="w-full text-xs" data-testid="table-chinese-sats">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b">
                        <th className="text-left p-1.5 font-semibold">Name</th>
                        <th className="text-left p-1.5 font-semibold hidden sm:table-cell">NORAD</th>
                        <th className="text-right p-1.5 font-semibold">El°</th>
                        <th className="text-right p-1.5 font-semibold">Az°</th>
                        <th className="text-right p-1.5 font-semibold hidden sm:table-cell">Alt km</th>
                        <th className="text-center p-1.5 font-semibold">Vis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSats
                        .sort((a, b) => (b.elevation ?? -999) - (a.elevation ?? -999))
                        .map((sat) => {
                          const isOverhead = (sat.elevation ?? 0) > 30;
                          const isRecon = ["YAOGAN", "YG-", "GAOFEN", "GF-", "JILIN"].some(p => (sat.satelliteName || "").toUpperCase().includes(p));
                          return (
                            <tr key={sat.id} className={`border-b hover:bg-muted/50 ${isRecon ? "bg-red-500/5" : ""}`} data-testid={`sat-row-${sat.noradId}`}>
                              <td className="p-1.5 font-mono">
                                {sat.satelliteName}
                                {isRecon && <Badge variant="outline" className="ml-1 text-[8px]">ISR</Badge>}
                              </td>
                              <td className="p-1.5 font-mono text-muted-foreground hidden sm:table-cell">{sat.noradId}</td>
                              <td className={`p-1.5 text-right font-mono ${isOverhead ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                {sat.elevation?.toFixed(1) ?? "—"}
                              </td>
                              <td className="p-1.5 text-right font-mono text-muted-foreground">{sat.azimuth?.toFixed(1) ?? "—"}</td>
                              <td className="p-1.5 text-right font-mono text-muted-foreground hidden sm:table-cell">{sat.altitude?.toFixed(0) ?? "—"}</td>
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
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arsenal" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-500" />
                Malware Arsenal — Click to expand technical analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {ROOTKIT_ARSENAL.map((r, i) => {
                const layerColors: Record<string, string> = {
                  Kernel: "text-red-600 dark:text-red-400",
                  Application: "text-amber-600 dark:text-amber-400",
                  Memory: "text-violet-600 dark:text-violet-400",
                };
                return (
                  <ExpandableRow key={i} detail={r.detail}>
                    <div className="flex items-center gap-3 flex-wrap" data-testid={`rootkit-row-${r.family}`}>
                      <span className="font-mono font-bold text-xs text-red-600 dark:text-red-300 w-28 flex-shrink-0">{r.family}</span>
                      <span className={`text-xs font-semibold w-20 flex-shrink-0 ${layerColors[r.layer] || "text-muted-foreground"}`}>{r.layer}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{r.mechanism}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto">{r.actor}</Badge>
                    </div>
                  </ExpandableRow>
                );
              })}

              <div className="mt-4 p-3 rounded-lg border">
                <h4 className="text-xs font-semibold mb-1">Key Insight: Tier-0 Invisibility</h4>
                <p className="text-xs text-muted-foreground">
                  UNC3886 operates below guest OS at the hypervisor level — invisible to all EDR.
                  Median dwell time: <span className="text-red-600 dark:text-red-400 font-bold font-mono">122 days</span> (~10x eCrime average).
                  The US-funded SOC monitors application-layer while these actors persist at Tier-0.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explorer" className="space-y-3">
          <CorrelationExplorer correlations={correlations} events={recentEvents} />
        </TabsContent>
      </Tabs>

      <Card className="border-muted">
        <CardContent className="p-4 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">KAPPA SIGINT Platform — Interactive Intelligence Briefing</p>
          <p>Prepared for Instituto Costarricense de Electricidad (ICE) — {new Date().toLocaleDateString()}</p>
          <p className="font-mono">ciajw.com | Suites Cristina, Sabana Norte | 10.0514°N 84.2187°W</p>
        </CardContent>
      </Card>
    </div>
  );
}
