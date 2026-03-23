import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertTriangle, Wifi, Router, Globe, Terminal, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ForensicCheck {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "info";
  category: "network" | "dns" | "device" | "browser" | "router" | "process";
  command?: string;
  commandOS?: "linux" | "macos" | "windows" | "all";
  indicator: string;
  evidenceRef?: string;
}

const FORENSIC_CHECKS: ForensicCheck[] = [
  {
    id: "tr069-reset",
    title: "TR-069 Remote Router Reset Detection",
    description: "Check if your router has been remotely reset via TR-069 (CWMP) protocol. ISPs use this for management but it can be exploited for surveillance resets.",
    severity: "critical",
    category: "router",
    command: "curl -s http://192.168.0.1/cgi-bin/luci/admin/system/admin | grep -i 'tr069\\|cwmp\\|acs_url' ; echo '---' ; cat /var/log/syslog | grep -i 'tr-069\\|cwmp\\|factory.reset\\|config.restore' | tail -20",
    commandOS: "linux",
    indicator: "Router reboots at unusual times, config changes without user action, ACS URL pointing to unknown server",
    evidenceRef: "TR-069 reset 2026-01-30 documented in KAPPA corpus"
  },
  {
    id: "ghost-mesh-node",
    title: "Ghost Mesh Network Node Detection",
    description: "Scan for unauthorized devices joining your mesh network (e.g., phantom TP-Link Deco nodes that appear and disappear).",
    severity: "critical",
    category: "network",
    command: "# Check ARP table for unknown MACs\narp -a | sort\n\n# Scan local network\nnmap -sn 192.168.0.0/24 | grep -B1 'MAC Address'\n\n# Check mesh controller for unknown nodes\ncurl -s http://192.168.0.1/cgi-bin/luci/admin/status/overview | python3 -c \"import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))\" 2>/dev/null",
    commandOS: "linux",
    indicator: "Unknown MAC addresses in ARP table, extra mesh nodes that weren't configured, devices with manufacturer 'TP-LINK' or 'HUAWEI' you didn't purchase",
    evidenceRef: "Ghost Deco node documented in KAPPA corpus"
  },
  {
    id: "service-worker-size",
    title: "Oversized Service Worker Detection (Kyndryl/Zscaler)",
    description: "Check for abnormally large service workers injected by enterprise proxy systems. Normal service workers are <100KB. An 8.3MB service worker indicates deep browser-level interception.",
    severity: "critical",
    category: "browser",
    command: "# In Chrome DevTools:\n# 1. Open chrome://serviceworker-internals/\n# 2. Check 'Script Size' column for any entry >500KB\n# 3. Or in DevTools > Application > Service Workers\n#    Look for scripts not from your domains\n\n# Check in Firefox:\n# about:debugging#/runtime/this-firefox > Service Workers",
    commandOS: "all",
    indicator: "Service worker >500KB, scripts from unknown origins, Kyndryl/Zscaler/Akamai domains in service worker scope",
    evidenceRef: "Kyndryl 8.3MB service worker documented in KAPPA corpus"
  },
  {
    id: "dns-poisoning",
    title: "DNS Poisoning / Interception Check",
    description: "Verify DNS responses match expected values. Compare results from your ISP DNS vs known clean resolvers (Cloudflare, Google).",
    severity: "high",
    category: "dns",
    command: "# Compare DNS responses from different resolvers\necho '=== Your ISP DNS ===' && nslookup google.com\necho '=== Cloudflare 1.1.1.1 ===' && nslookup google.com 1.1.1.1\necho '=== Google 8.8.8.8 ===' && nslookup google.com 8.8.8.8\necho '=== Quad9 9.9.9.9 ===' && nslookup google.com 9.9.9.9\n\n# Check for DNS leaks\ncurl -s https://dnsleaktest.com/test | head -20\n\n# Flush DNS cache\n# Linux: sudo systemd-resolve --flush-caches\n# macOS: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder\n# Windows: ipconfig /flushdns",
    commandOS: "all",
    indicator: "Different IP addresses returned by different DNS resolvers for the same domain, unexpected DNS servers in resolv.conf"
  },
  {
    id: "zscaler-injection",
    title: "Zscaler/Partytown Script Injection Detection",
    description: "Check for proxy-injected JavaScript in web pages. Zscaler Client Connector and similar enterprise proxies inject scripts into all HTTPS traffic.",
    severity: "high",
    category: "browser",
    command: "# In browser DevTools (F12 > Sources tab):\n# Look for scripts from these domains:\n#   - *.zscaler.com / *.zscalerone.net / *.zscloud.net\n#   - partytown-*\n#   - cdn.kyndryl.*\n#\n# Or check via curl (compare sizes):\ncurl -sI https://example.com | grep -i 'content-length\\|x-forwarded\\|via\\|x-proxy'\n\n# Check for proxy certificates:\n# macOS: security find-certificate -a | grep -i 'zscaler\\|kyndryl\\|forcepoint'\n# Linux: ls /etc/ssl/certs/ | grep -i 'zscaler\\|corporate\\|proxy'",
    commandOS: "all",
    indicator: "Extra <script> tags in page source not present in original HTML, proxy headers in HTTP responses, corporate CA certificates in trust store",
    evidenceRef: "Partytown/Zscaler injection documented in KAPPA corpus"
  },
  {
    id: "finspy-processes",
    title: "FinSpy/Gamma Group Process Detection",
    description: "Check for known FinSpy surveillance malware processes and registry keys.",
    severity: "critical",
    category: "process",
    command: "# Linux/macOS:\nps aux | grep -iE 'FinService|C2Client|svchost.*gamma|svchost.*fin|update.*gamma' | grep -v grep\nfind /tmp /var/tmp ~/.local -name '*.fin' -o -name '*gamma*' -o -name '*c2client*' 2>/dev/null\nnetstat -tlnp 2>/dev/null | grep -E ':443[0-9]|:8443|:4443'\n\n# Windows (run in elevated PowerShell):\n# Get-Process | Where-Object { $_.Name -match 'FinService|C2Client' }\n# Get-ItemProperty HKLM:\\SOFTWARE\\GammaGroup -ErrorAction SilentlyContinue\n# reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run | findstr /i 'fin gamma c2'",
    commandOS: "all",
    indicator: "Processes named FinService.exe or C2Client.exe, registry keys under GammaGroup, outbound connections on unusual HTTPS ports",
    evidenceRef: "Gamma Group IPs documented in KAPPA corpus"
  },
  {
    id: "suspicious-certs",
    title: "Rogue Certificate Authority Detection",
    description: "Check for unauthorized CA certificates that enable MITM interception of HTTPS traffic.",
    severity: "high",
    category: "network",
    command: "# macOS:\nsecurity find-certificate -a -p /Library/Keychains/System.keychain | openssl x509 -noout -subject -issuer 2>/dev/null | grep -v 'Apple\\|DigiCert\\|VeriSign\\|GlobalSign\\|Comodo\\|Let.s.Encrypt\\|ISRG\\|Entrust\\|GeoTrust\\|Baltimore\\|Amazon\\|Starfield\\|Sectigo'\n\n# Linux:\nfor cert in /etc/ssl/certs/*.pem; do openssl x509 -in \"$cert\" -noout -subject 2>/dev/null; done | grep -v 'DigiCert\\|VeriSign\\|GlobalSign\\|Comodo\\|ISRG\\|Entrust\\|GeoTrust\\|Amazon\\|Baltimore\\|Starfield\\|Sectigo\\|Mozilla\\|USERTrust'\n\n# Windows:\n# certutil -store Root | findstr /i 'subject\\|issuer' | findstr /v /i 'Microsoft\\|DigiCert\\|VeriSign'",
    commandOS: "all",
    indicator: "CA certificates from unknown issuers, corporate proxy CAs you didn't install, Zscaler/Kyndryl/Forcepoint root CAs"
  },
  {
    id: "router-firmware",
    title: "Router Firmware Integrity Check",
    description: "Verify your router firmware hasn't been modified. Check version against manufacturer's latest and look for unexpected open ports.",
    severity: "high",
    category: "router",
    command: "# Check router's external port exposure\nnmap -sV 192.168.0.1\n\n# Check for TR-069 port (default 7547)\nnmap -p 7547 192.168.0.1\n\n# Check WAN-side exposure (from external service)\ncurl -s https://api.ipify.org && echo ''\ncurl -s \"https://api.shodan.io/shodan/host/$(curl -s https://api.ipify.org)?key=YOUR_KEY\" 2>/dev/null | python3 -m json.tool\n\n# TP-Link Deco specific:\ncurl -s http://192.168.0.1/cgi-bin/luci/admin/system/admin 2>/dev/null",
    commandOS: "linux",
    indicator: "Port 7547 open (TR-069), unexpected services running, firmware version not matching latest from manufacturer"
  },
  {
    id: "mac-rotation",
    title: "MAC Address Anomaly Detection",
    description: "Monitor for MAC address changes on your network interfaces that you didn't initiate. Surveillance tools may rotate MACs to avoid fingerprinting.",
    severity: "medium",
    category: "device",
    command: "# Show current MACs\nip link show | grep -A1 '^[0-9]' | grep -E 'state|ether'\n\n# Monitor for MAC changes (run in background)\nwhile true; do ip link show | grep ether | md5sum; sleep 60; done\n\n# Check for randomized MACs (locally administered bit)\nip link show | grep ether | awk '{print $2}' | while read mac; do\n  second_char=$(echo $mac | cut -c2)\n  case $second_char in\n    2|3|6|7|a|b|e|f|A|B|E|F) echo \"RANDOMIZED: $mac\" ;;\n    *) echo \"REAL: $mac\" ;;\n  esac\ndone",
    commandOS: "linux",
    indicator: "MAC address changed without user action, locally administered bit set on hardware interfaces"
  },
  {
    id: "airbnb-ghost",
    title: "Hidden Device / Airbnb Ghost Detection",
    description: "Scan for hidden wireless devices broadcasting in your environment — hidden cameras, microphones, or rogue access points.",
    severity: "high",
    category: "device",
    command: "# Scan WiFi environment for hidden SSIDs\nsudo iwlist wlan0 scan | grep -E 'ESSID|Address|Channel|Signal'\n\n# Look for Bluetooth LE devices (beacons, trackers)\nsudo hcitool lescan --duplicates 2>/dev/null &\nsleep 10 && kill %1\n\n# Check for unexpected DHCP clients\ncat /var/lib/dhcp/dhcpd.leases 2>/dev/null\n\n# ARP scan for all devices on network\nsudo arp-scan --localnet 2>/dev/null || arp -a",
    commandOS: "linux",
    indicator: "Unknown SSIDs broadcasting near you, Bluetooth LE devices you don't own, hidden SSID networks, devices with camera/IoT manufacturer OUIs",
    evidenceRef: "Airbnb Ghost/Kenwood TV documented in KAPPA corpus"
  },
  {
    id: "outbound-c2",
    title: "Outbound C2 Connection Detection",
    description: "Monitor for persistent outbound connections to command & control servers. FinSpy and similar tools maintain beacons to C2 infrastructure.",
    severity: "critical",
    category: "network",
    command: "# Show all established connections with PIDs\nss -tnp state established | column -t\n\n# Look for connections to unusual ports\nnetstat -tn | grep ESTABLISHED | awk '{print $5}' | sort | uniq -c | sort -rn | head -20\n\n# Check for connections outside your country\nfor ip in $(ss -tn state established | awk '{print $5}' | grep -oP '[\\d.]+(?=:)' | sort -u); do\n  echo -n \"$ip -> \"\n  curl -s \"https://ipinfo.io/$ip/country\" 2>/dev/null\n  echo ''\ndone\n\n# Monitor for DNS queries to suspicious TLDs\nsudo tcpdump -n -i any port 53 2>/dev/null | head -50",
    commandOS: "linux",
    indicator: "Persistent connections to IPs in unusual countries, connections on non-standard HTTPS ports (4443, 8443, 9443), high-frequency beaconing"
  },
  {
    id: "browser-extensions",
    title: "Malicious Browser Extension Audit",
    description: "Check installed browser extensions for data exfiltration capabilities. Some extensions are modified post-install to become spyware.",
    severity: "medium",
    category: "browser",
    command: "# Chrome extensions directory:\n# macOS: ls ~/Library/Application\\ Support/Google/Chrome/Default/Extensions/\n# Linux: ls ~/.config/google-chrome/Default/Extensions/\n# Windows: dir %LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\\n\n# Check extension permissions:\n# chrome://extensions > Developer mode > Details for each\n# Red flags: 'Read and change all your data on all websites'\n\n# Firefox:\n# about:debugging#/runtime/this-firefox",
    commandOS: "all",
    indicator: "Extensions with broad permissions you didn't install, extensions requesting 'all URLs' access, recently modified extension files"
  },
];

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const categoryIcons: Record<string, typeof Shield> = {
  network: Globe,
  dns: Globe,
  device: Wifi,
  browser: Terminal,
  router: Router,
  process: AlertTriangle,
};

export default function NetworkForensicsPage() {
  const { toast } = useToast();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [findings, setFindings] = useState<Record<string, "clean" | "suspicious" | "pending">>({});
  const [activeTab, setActiveTab] = useState("all");

  const toggleCheck = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  const markFinding = (id: string, status: "clean" | "suspicious") => {
    setFindings(prev => ({ ...prev, [id]: status }));
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast({ title: "Copied", description: "Command copied to clipboard" });
  };

  const filteredChecks = activeTab === "all"
    ? FORENSIC_CHECKS
    : FORENSIC_CHECKS.filter(c => c.category === activeTab);

  const completedCount = checkedItems.size;
  const suspiciousCount = Object.values(findings).filter(v => v === "suspicious").length;
  const cleanCount = Object.values(findings).filter(v => v === "clean").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="forensics-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-forensics-title">Network Forensics</h1>
          <p className="text-muted-foreground mt-1">
            Real-world forensic checks based on documented indicators from your environment
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1" data-testid="badge-completed">
            <CheckCircle2 className="h-3 w-3" /> {completedCount}/{FORENSIC_CHECKS.length} checked
          </Badge>
          {suspiciousCount > 0 && (
            <Badge className="bg-red-600 gap-1" data-testid="badge-suspicious">
              <AlertTriangle className="h-3 w-3" /> {suspiciousCount} suspicious
            </Badge>
          )}
          {cleanCount > 0 && (
            <Badge className="bg-green-600 gap-1" data-testid="badge-clean">
              <CheckCircle2 className="h-3 w-3" /> {cleanCount} clean
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="forensics-tabs">
          <TabsTrigger value="all" data-testid="tab-all">All ({FORENSIC_CHECKS.length})</TabsTrigger>
          <TabsTrigger value="network" data-testid="tab-network">Network</TabsTrigger>
          <TabsTrigger value="router" data-testid="tab-router">Router</TabsTrigger>
          <TabsTrigger value="browser" data-testid="tab-browser">Browser</TabsTrigger>
          <TabsTrigger value="device" data-testid="tab-device">Device</TabsTrigger>
          <TabsTrigger value="dns" data-testid="tab-dns">DNS</TabsTrigger>
          <TabsTrigger value="process" data-testid="tab-process">Process</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {filteredChecks.map((check) => {
            const IconComponent = categoryIcons[check.category] || Shield;
            const isChecked = checkedItems.has(check.id);
            const finding = findings[check.id];

            return (
              <Card
                key={check.id}
                className={`transition-all ${finding === "suspicious" ? "border-red-500 dark:border-red-700" : finding === "clean" ? "border-green-500 dark:border-green-700" : ""}`}
                data-testid={`card-check-${check.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleCheck(check.id)}
                      className="mt-1"
                      data-testid={`checkbox-${check.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{check.title}</CardTitle>
                        <Badge className={severityColors[check.severity]} data-testid={`badge-severity-${check.id}`}>
                          {check.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{check.category}</Badge>
                        {check.evidenceRef && (
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30">
                            KAPPA evidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant={finding === "clean" ? "default" : "outline"}
                        className={finding === "clean" ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={() => markFinding(check.id, "clean")}
                        data-testid={`btn-clean-${check.id}`}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Clean
                      </Button>
                      <Button
                        size="sm"
                        variant={finding === "suspicious" ? "default" : "outline"}
                        className={finding === "suspicious" ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => markFinding(check.id, "suspicious")}
                        data-testid={`btn-suspicious-${check.id}`}
                      >
                        <XCircle className="h-3 w-3 mr-1" /> Suspicious
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">What to look for</h4>
                    <p className="text-sm">{check.indicator}</p>
                  </div>
                  {check.evidenceRef && (
                    <div>
                      <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">Your documented evidence</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">{check.evidenceRef}</p>
                    </div>
                  )}
                  {check.command && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-medium uppercase text-muted-foreground">Commands ({check.commandOS})</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCommand(check.command!)}
                          data-testid={`btn-copy-${check.id}`}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <pre className="bg-neutral-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono" data-testid={`code-${check.id}`}>
                        {check.command}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <Card className="border-amber-500 dark:border-amber-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Clock className="h-5 w-5" /> Quick Reference — Your Documented Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Network Infrastructure</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• TR-069 remote reset — 2026-01-30</li>
                <li>• Ghost TP-Link Deco mesh node — appears/disappears</li>
                <li>• Kyndryl 8.3MB service worker injection</li>
                <li>• Partytown/Zscaler script injection in HTTPS</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Surveillance Indicators</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Gamma Group IPs (FinSpy infrastructure)</li>
                <li>• Airbnb Ghost / Kenwood TV incident</li>
                <li>• JW Los Rios network activity</li>
                <li>• Hotel Robledal — Alexanderplatz session</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Tools You Should Have</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <code className="bg-muted px-1 rounded">nmap</code> — network scanner</li>
                <li>• <code className="bg-muted px-1 rounded">wireshark</code> — packet capture</li>
                <li>• <code className="bg-muted px-1 rounded">arp-scan</code> — local device discovery</li>
                <li>• <code className="bg-muted px-1 rounded">tcpdump</code> — command-line capture</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Install on Your Machine</h4>
              <pre className="bg-neutral-900 text-green-400 p-2 rounded text-xs font-mono">
{`# Ubuntu/Debian:
sudo apt install nmap wireshark arp-scan tcpdump

# macOS:
brew install nmap wireshark arp-scan tcpdump

# Also install:
pip install scapy shodan`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
