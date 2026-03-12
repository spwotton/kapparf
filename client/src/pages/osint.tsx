import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Wifi, Eye, Shield, ExternalLink, Loader2 } from "lucide-react";

interface LookupResult {
  target: string;
  timestamp: string;
  type: "ip" | "hostname";
  ip?: string;
  hostname?: string;
  ipv4?: string[];
  ipv6?: string[];
  mx?: { exchange: string; priority: number }[];
  ns?: string[];
  txt?: string[];
  reverse?: string[];
}

const cameraOuis = [
  { vendor: "Hikvision", ouis: ["28:57:BE", "C0:56:E3", "44:19:B6", "C4:2F:90"], origin: "China" },
  { vendor: "Dahua", ouis: ["3C:EF:8C", "B4:A3:82", "E0:50:8B", "40:F4:FD"], origin: "China" },
  { vendor: "Reolink", ouis: ["EC:71:DB", "B8:2E:1A"], origin: "China" },
  { vendor: "TP-Link", ouis: ["EC:71:DB", "50:C7:BF", "A8:42:A1"], origin: "China" },
];

const corpSignatures = [
  { name: "Kyndryl", indicators: ["Managed Infrastructure Services", "IBM spin-off", "Enterprise IT management"], note: "Former IBM subsidiary — enterprise device management" },
  { name: "IBM", indicators: ["IBM Cloud", "Watson IoT", "Maximo"], note: "Corporate infrastructure and IoT management" },
  { name: "Cisco Meraki", indicators: ["Meraki Dashboard", "MR/MS/MX series", "Cloud-managed networking"], note: "Cloud-managed enterprise networking" },
];

const portSignatures = [
  { port: 554, protocol: "RTSP", description: "Real Time Streaming Protocol — video camera streams" },
  { port: 80, protocol: "HTTP", description: "Web interface — camera/device management panels" },
  { port: 8080, protocol: "HTTP-Alt", description: "Alternate HTTP — common for IP cameras" },
  { port: 1883, protocol: "MQTT", description: "Message Queuing Telemetry — IoT device communication" },
  { port: 8883, protocol: "MQTT/TLS", description: "Encrypted MQTT — secure IoT communication" },
  { port: 5683, protocol: "CoAP", description: "Constrained Application Protocol — IoT devices" },
];

const osintTools = [
  { name: "theHarvester", url: "https://github.com/laramies/theHarvester", description: "OSINT email, subdomain, and domain harvester" },
  { name: "Maltego", url: "https://github.com/paterva/maltego-trx", description: "OSINT and forensics link analysis — entity relationship graphing" },
  { name: "Shodan", url: "https://www.shodan.io", description: "Internet-connected device search engine — infrastructure mapping" },
  { name: "Censys", url: "https://censys.io", description: "Internet-wide scanning and certificate transparency" },
  { name: "VirusTotal", url: "https://www.virustotal.com", description: "File, URL, IP, and domain analysis — threat intelligence" },
  { name: "WHOIS", url: "https://whois.domaintools.com", description: "Domain registration and ownership lookup" },
  { name: "nmap", url: "https://github.com/nmap/nmap", description: "Network scanner — port, service, and OS detection" },
  { name: "Recon-ng", url: "https://github.com/lanmaster53/recon-ng", description: "Full-featured OSINT reconnaissance framework" },
];

export default function OsintPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);

  const lookupMutation = useMutation({
    mutationFn: async (targetValue: string) => {
      const res = await apiRequest("POST", "/api/osint/lookup", { target: targetValue });
      return res.json() as Promise<LookupResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("osint.lookupFailed"),
        variant: "destructive",
      });
    },
  });

  const handleLookup = () => {
    if (!target.trim()) return;
    lookupMutation.mutate(target.trim());
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {t("osint.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("osint.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("osint.networkProbe")}</CardTitle>
          </div>
          <CardDescription>{t("osint.probeDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 8.8.8.8 or example.com"
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              data-testid="input-osint-target"
            />
            <Button
              onClick={handleLookup}
              disabled={!target.trim() || lookupMutation.isPending}
              data-testid="button-run-lookup"
            >
              {lookupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Search className="h-4 w-4 mr-1.5" />
              )}
              {lookupMutation.isPending ? t("osint.running") : t("osint.runLookup")}
            </Button>
          </div>

          {result && (
            <div className="border rounded-md p-4 space-y-3" data-testid="div-lookup-result">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono text-sm font-medium">{result.target}</span>
                <Badge variant="secondary">{result.type.toUpperCase()}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                {result.type === "ip" && (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-muted-foreground">{t("osint.ip")}</span>
                      <span className="font-mono">{result.ip}</span>
                    </div>
                    {result.reverse && result.reverse.length > 0 && (
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-muted-foreground">Reverse DNS</span>
                        <div className="text-right">
                          {result.reverse.map((r, i) => (
                            <div key={i} className="font-mono text-xs">{r}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {result.type === "hostname" && (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-muted-foreground">{t("osint.hostname")}</span>
                      <span className="font-mono">{result.hostname}</span>
                    </div>
                    {result.ipv4 && result.ipv4.length > 0 && (
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-muted-foreground">{"IPv4"}</span>
                        <div className="text-right">
                          {result.ipv4.map((ip, i) => (
                            <div key={i} className="font-mono text-xs">{ip}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.ipv6 && result.ipv6.length > 0 && (
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-muted-foreground">{"IPv6"}</span>
                        <div className="text-right">
                          {result.ipv6.map((ip, i) => (
                            <div key={i} className="font-mono text-xs break-all">{ip}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.mx && result.mx.length > 0 && (
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-muted-foreground">{"MX Records"}</span>
                        <div className="text-right">
                          {result.mx.map((mx, i) => (
                            <div key={i} className="font-mono text-xs">{mx.exchange} (pri: {mx.priority})</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.ns && result.ns.length > 0 && (
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-muted-foreground">{"NS Records"}</span>
                        <div className="text-right">
                          {result.ns.map((ns, i) => (
                            <div key={i} className="font-mono text-xs">{ns}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.txt && result.txt.length > 0 && (
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-muted-foreground">{"TXT Records"}</span>
                        <div className="text-right max-w-xs">
                          {result.txt.map((txt, i) => (
                            <div key={i} className="font-mono text-xs break-all">{txt}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("osint.hiddenNetworks")}</CardTitle>
          </div>
          <CardDescription>{t("osint.hiddenNetworksDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{"Detection Techniques"}</h3>
              <div className="grid gap-2">
                {[
                  { title: "Probe Request Analysis", desc: "Monitor for probe requests from devices seeking hidden networks — reveals SSID names in client traffic." },
                  { title: "Beacon Frame Capture", desc: "Hidden APs still transmit beacon frames with empty SSID field — detectable via passive monitoring." },
                  { title: "MAC OUI Lookup", desc: "Identify device manufacturers from MAC address prefixes — reveals camera and IoT vendor fingerprints." },
                  { title: "Deauthentication Monitoring", desc: "Detect deauth floods that force reconnections — commonly used in WiFi attacks and surveillance." },
                  { title: "Channel Scanning", desc: "Sweep all 2.4 GHz and 5 GHz channels to find access points operating on non-standard channels." },
                ].map((technique) => (
                  <div key={technique.title} className="p-3 border rounded-md">
                    <div className="text-sm font-medium">{technique.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{technique.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium">{"Recommended Tools"}</h3>
              <div className="flex gap-2 flex-wrap">
                {["Kismet", "Aircrack-ng", "nmap --script broadcast-wifi", "Wireshark", "Bettercap"].map((tool) => (
                  <Badge key={tool} variant="secondary" className="font-mono text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("osint.surveillanceIndicators")}</CardTitle>
          </div>
          <CardDescription>{t("osint.surveillanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("osint.cameraOuis")}</h3>
            <div className="grid gap-2">
              {cameraOuis.map((vendor) => (
                <div key={vendor.vendor} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium">{vendor.vendor}</span>
                    <Badge variant="secondary" className="text-xs">{vendor.origin}</Badge>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {vendor.ouis.map((oui) => (
                      <span key={oui} className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted">
                        {oui}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("osint.corpSignatures")}</h3>
            <div className="grid gap-2">
              {corpSignatures.map((corp) => (
                <div key={corp.name} className="p-3 border rounded-md">
                  <div className="text-sm font-medium">{corp.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{corp.note}</div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {corp.indicators.map((indicator) => (
                      <Badge key={indicator} variant="secondary" className="text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("osint.portSignatures")}</h3>
            <div className="grid gap-2">
              {portSignatures.map((port) => (
                <div key={port.port} className="p-3 border rounded-md flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-mono text-sm font-medium">{port.port}</span>
                    <span className="text-xs text-muted-foreground ml-2">({port.protocol})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{port.description}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("osint.osintTools")}</CardTitle>
          </div>
          <CardDescription>{t("osint.osintToolsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {osintTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border rounded-md flex items-center justify-between gap-2 hover-elevate flex-wrap"
                data-testid={`link-osint-tool-${tool.name.toLowerCase()}`}
              >
                <div>
                  <span className="text-sm font-medium">{tool.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{tool.description}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
