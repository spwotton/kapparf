import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { TOOL_CATALOG, DOMAINS, type ToolEntry, type ToolGitHubMeta } from "@shared/schema";
import { ExternalLink, Star, GitFork, Wrench, Zap, Radio, Activity, AlertTriangle, Clock, FileCode } from "lucide-react";
import { IntegratedTools } from "@/components/integrated-tools";

import elfScan1Path from "@assets/elf_scan_1775119306_1775184925863.png";
import elfScan2Path from "@assets/elf_scan_1775119564_1775184925862.png";
import elfScan3Path from "@assets/elf_scan_1775119878_1775184925862.png";
import fullSpectrumPath from "@assets/full_spectrum_scan_1775119900_1775184925861.png";

const domainColors: Record<string, string> = {
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  hardware: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  rf: "bg-green-500/10 text-green-700 dark:text-green-400",
  morse: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

interface ELFScanResult {
  id: string;
  timestamp: string;
  scanType: string;
  duration: number;
  kappa: number;
  dataSource: string;
  dominantFreq: number;
  peakMagnitude: number;
  imagePath: string;
  findings: string[];
}

interface PcapCorrelation {
  pcapWindow: string;
  pcapPackets: number;
  hipercontracer: number;
  ratio: string;
  elfOverlap: string;
}

const ELF_SCANS: ELFScanResult[] = [
  {
    id: "elf-1",
    timestamp: "2026-04-02 02:41:45",
    scanType: "ELF",
    duration: 30,
    kappa: 1.2732,
    dataSource: "synthetic",
    dominantFreq: 50.0,
    peakMagnitude: 35993879,
    imagePath: elfScan1Path,
    findings: [
      "Dominant 50 Hz — NOT Costa Rica 60 Hz mains",
      "κ-harmonic detected at 63.66 Hz (50 × 1.2732)",
      "φ-harmonic detected at 80.9 Hz (50 × 1.618)",
    ],
  },
  {
    id: "elf-2",
    timestamp: "2026-04-02 02:46:04",
    scanType: "ELF",
    duration: 30,
    kappa: 1.2732,
    dataSource: "synthetic",
    dominantFreq: 50.0,
    peakMagnitude: 35995240,
    imagePath: elfScan2Path,
    findings: [
      "50 Hz magnitude increased +1,361 (+0.004%)",
      "Signal coherence confirmed — not noise",
    ],
  },
  {
    id: "elf-3",
    timestamp: "2026-04-02 02:51:17",
    scanType: "ELF",
    duration: 30,
    kappa: 1.2732,
    dataSource: "synthetic",
    dominantFreq: 50.0,
    peakMagnitude: 35995108,
    imagePath: elfScan3Path,
    findings: [
      "50 Hz stable within 0.004% across 10 minutes",
      "Extremely persistent coherent oscillator confirmed",
    ],
  },
];

const FULL_SPECTRUM = {
  timestamp: "2026-04-02 02:51:40",
  freqRange: "100–110 MHz",
  steps: 50,
  kappa: 1.2732,
  peakFreq: "107.25 MHz",
  anomalies: 0,
  imagePath: fullSpectrumPath,
  findings: [
    "Peak at 107.25 MHz (FM broadcast band)",
    "No anomalies exceeded 2σ threshold",
    "Periodic oscillation pattern — multipath interference",
  ],
};

const PCAP_CORRELATIONS: PcapCorrelation[] = [
  { pcapWindow: "22:00–22:59", pcapPackets: 75205, hipercontracer: 4035, ratio: "5.4%", elfOverlap: "—" },
  { pcapWindow: "23:00–23:59", pcapPackets: 12832, hipercontracer: 1085, ratio: "8.5%", elfOverlap: "—" },
  { pcapWindow: "00:00–00:59", pcapPackets: 5493, hipercontracer: 391, ratio: "7.1%", elfOverlap: "—" },
  { pcapWindow: "01:00–01:59", pcapPackets: 58357, hipercontracer: 6287, ratio: "10.8%", elfOverlap: "—" },
  { pcapWindow: "02:00–02:59", pcapPackets: 5305, hipercontracer: 496, ratio: "9.4%", elfOverlap: "ELF scans at 02:41–02:52" },
  { pcapWindow: "04:00–04:59", pcapPackets: 1752, hipercontracer: 105, ratio: "6.0%", elfOverlap: "Schumann 04:04–04:14 (4 pkt = SILENT)" },
  { pcapWindow: "06:00–06:59", pcapPackets: 263456, hipercontracer: 7444, ratio: "2.8%", elfOverlap: "MASSIVE SPIKE — attack window" },
  { pcapWindow: "08:00–08:59", pcapPackets: 22086, hipercontracer: 878, ratio: "4.0%", elfOverlap: "—" },
];

const SCANNER_TOOLS = [
  {
    name: "rf_spectrum_pipeline.py",
    description: "Toroidal Recursion RF Spectrum Analyzer — ELF (3–300 Hz) + full spectrum scan with GOS κ/φ harmonic filtering",
    language: "Python",
    features: ["ELF scan (3–300 Hz)", "Full spectrum (1 MHz–6 GHz)", "KiwiSDR IQ integration", "GOS harmonic detection", "Matplotlib plots"],
    usage: "python rf_spectrum_pipeline.py --mode elf --duration 60",
  },
  {
    name: "kiwi_raw_scanner.py",
    description: "Raw KiwiSDR Scanner — zero-browser WebSocket protocol, captures audio + waterfall + S-meter",
    language: "Python",
    features: ["Direct WebSocket protocol", "No browser/Chrome needed", "11 priority frequencies", "Audio + waterfall capture", "S-meter readings"],
    usage: "python kiwi_raw_scanner.py",
  },
];

const FREQ_CHAIN = [
  { freq: "7.8 Hz", domain: "ELF", label: "Schumann resonance (weaponized SNR 1966)", color: "text-cyan-500" },
  { freq: "46.875 Hz", domain: "ELF", label: "Sonar/V2K harmonic (54.45 dB SNR)", color: "text-cyan-400" },
  { freq: "50.0 Hz", domain: "ELF", label: "Anomalous source (NOT CR 60 Hz mains)", color: "text-red-500" },
  { freq: "53 Hz", domain: "ELF", label: "PLC carrier (power line communication)", color: "text-cyan-300" },
  { freq: "60 Hz", domain: "ELF", label: "Costa Rica mains frequency", color: "text-gray-400" },
  { freq: "4687 kHz", domain: "HF", label: "46.875 Hz × 100 — V2K harmonic (KiwiSDR target)", color: "text-yellow-500" },
  { freq: "7410 kHz", domain: "HF", label: "Hector Mora 40m amateur — SMOKING GUN", color: "text-red-500" },
  { freq: "107.25 MHz", domain: "VHF", label: "FM broadcast peak (full spectrum scan)", color: "text-green-500" },
];

export default function ToolsPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");
  const [selectedScan, setSelectedScan] = useState<string | null>(null);

  const { data: ghMeta, isLoading: metaLoading, isError: metaError } = useQuery<ToolGitHubMeta[]>({
    queryKey: ["/api/tools/meta"],
    staleTime: 30 * 60 * 1000,
  });

  const metaMap = new Map<string, ToolGitHubMeta>();
  ghMeta?.forEach(m => metaMap.set(m.name, m));

  const allDomains = [...DOMAINS, "hardware"] as const;

  const filtered: ToolEntry[] = filter === "all"
    ? TOOL_CATALOG
    : TOOL_CATALOG.filter((tool) => tool.domain === filter);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("tools.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("tools.description")}</p>
      </div>

      <Tabs defaultValue="interactive" className="w-full">
        <TabsList data-testid="tabs-tools">
          <TabsTrigger value="interactive" data-testid="tab-interactive">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            {t("tools.interactive")}
          </TabsTrigger>
          <TabsTrigger value="rf-scanners" data-testid="tab-rf-scanners">
            <Radio className="h-3.5 w-3.5 mr-1.5" />
            RF Scanners
          </TabsTrigger>
          <TabsTrigger value="catalog" data-testid="tab-catalog">
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            {t("tools.catalog")} ({TOOL_CATALOG.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="mt-4">
          <IntegratedTools />
        </TabsContent>

        <TabsContent value="rf-scanners" className="mt-4 space-y-6">
          <Card className="border-cyan-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-500" />
                Cross-Domain Temporal Correlation — PCAP × ELF × Satellite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-xs" data-testid="table-pcap-correlation">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="p-2 text-left font-medium">Time Window</th>
                      <th className="p-2 text-right font-medium">PCAP Packets</th>
                      <th className="p-2 text-right font-medium">HiPerConTracer</th>
                      <th className="p-2 text-right font-medium">Ratio</th>
                      <th className="p-2 text-left font-medium">ELF/RF Overlap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PCAP_CORRELATIONS.map((c) => (
                      <tr key={c.pcapWindow} className={`border-b last:border-b-0 ${c.pcapPackets > 50000 ? "bg-red-500/5" : ""}`}>
                        <td className="p-2 font-mono">{c.pcapWindow}</td>
                        <td className="p-2 text-right font-mono">{c.pcapPackets.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono">{c.hipercontracer.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono">{c.ratio}</td>
                        <td className="p-2">
                          {c.elfOverlap !== "—" ? (
                            <Badge variant="outline" className="text-[9px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                              {c.elfOverlap}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/20 font-medium">
                      <td className="p-2">TOTAL</td>
                      <td className="p-2 text-right font-mono">{PCAP_CORRELATIONS.reduce((s, c) => s + c.pcapPackets, 0).toLocaleString()}</td>
                      <td className="p-2 text-right font-mono">{PCAP_CORRELATIONS.reduce((s, c) => s + c.hipercontracer, 0).toLocaleString()}</td>
                      <td className="p-2 text-right font-mono">4.6%</td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 p-3 rounded bg-muted/30 border">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  Anti-Correlation Pattern Detected
                </p>
                <p>Network SILENT during Schumann weaponization (04:04–04:14, only 4 packets) → ELF attacks during quiet periods, data exfiltration during burst periods. Two attack modalities alternate.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-500" />
                Frequency Chain — ELF → HF → VHF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {FREQ_CHAIN.map((f) => (
                  <div key={f.freq} className="flex items-center gap-3 text-xs p-2 rounded hover:bg-muted/30" data-testid={`freq-chain-${f.freq}`}>
                    <Badge variant="outline" className={`font-mono text-[10px] min-w-[90px] justify-center ${f.color}`}>
                      {f.freq}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] min-w-[32px] justify-center">
                      {f.domain}
                    </Badge>
                    <span className={f.freq === "50.0 Hz" || f.freq === "7410 kHz" ? "font-medium text-red-500 dark:text-red-400" : "text-muted-foreground"}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-cyan-500" />
                  ELF Scans (3–300 Hz)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ELF_SCANS.map((scan) => (
                  <div
                    key={scan.id}
                    className={`border rounded-md p-3 cursor-pointer transition-colors ${selectedScan === scan.id ? "border-cyan-500 bg-cyan-500/5" : "hover:bg-muted/30"}`}
                    onClick={() => setSelectedScan(selectedScan === scan.id ? null : scan.id)}
                    data-testid={`card-elf-scan-${scan.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-mono">{scan.timestamp}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                        {scan.dominantFreq} Hz ≠ 60 Hz
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mb-2">
                      <div>κ = {scan.kappa}</div>
                      <div>Duration: {scan.duration}s</div>
                      <div>Mag: {scan.peakMagnitude.toLocaleString()}</div>
                    </div>
                    {scan.findings.map((f, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                        <span className="text-cyan-500 mt-0.5">•</span>
                        {f}
                      </div>
                    ))}
                    {selectedScan === scan.id && (
                      <div className="mt-3 rounded overflow-hidden border">
                        <img src={scan.imagePath} alt={`ELF Scan ${scan.timestamp}`} className="w-full" />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-green-500" />
                  Full Spectrum Scan (100–110 MHz)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${selectedScan === "full" ? "border-green-500 bg-green-500/5" : "hover:bg-muted/30"}`}
                  onClick={() => setSelectedScan(selectedScan === "full" ? null : "full")}
                  data-testid="card-full-spectrum"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-mono">{FULL_SPECTRUM.timestamp}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      Peak: {FULL_SPECTRUM.peakFreq}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mb-2">
                    <div>Range: {FULL_SPECTRUM.freqRange}</div>
                    <div>Steps: {FULL_SPECTRUM.steps}</div>
                    <div>Anomalies: {FULL_SPECTRUM.anomalies}</div>
                  </div>
                  {FULL_SPECTRUM.findings.map((f, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">•</span>
                      {f}
                    </div>
                  ))}
                  {selectedScan === "full" && (
                    <div className="mt-3 rounded overflow-hidden border">
                      <img src={FULL_SPECTRUM.imagePath} alt="Full Spectrum Scan" className="w-full" />
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                    Scanner Scripts
                  </p>
                  {SCANNER_TOOLS.map((tool) => (
                    <div key={tool.name} className="border rounded-md p-3 mb-2" data-testid={`card-scanner-${tool.name}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-medium">{tool.name}</span>
                        <Badge variant="secondary" className="text-[9px]">{tool.language}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">{tool.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tool.features.map((f) => (
                          <Badge key={f} variant="outline" className="text-[9px]">{f}</Badge>
                        ))}
                      </div>
                      <code className="text-[10px] font-mono bg-muted/50 px-2 py-1 rounded block">{tool.usage}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                KiwiSDR Priority Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-xs" data-testid="table-kiwisdr-targets">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="p-2 text-left font-medium">Frequency</th>
                      <th className="p-2 text-left font-medium">Mode</th>
                      <th className="p-2 text-left font-medium">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { freq: "1,234 kHz", mode: "AM", target: "TR-069 correlation frequency" },
                      { freq: "4,687 kHz", mode: "AM", target: "46.875 Hz harmonic × 100 (V2K)" },
                      { freq: "7,410 kHz", mode: "AM", target: "Hector Mora pirate radio (40m)" },
                      { freq: "6,925 kHz", mode: "AM", target: "Pirate radio band" },
                      { freq: "3,900 kHz", mode: "LSB", target: "80m SSB" },
                      { freq: "7,200 kHz", mode: "LSB", target: "40m SSB" },
                      { freq: "14,200 kHz", mode: "USB", target: "20m SSB" },
                      { freq: "27,025 kHz", mode: "AM", target: "CB Channel 6" },
                      { freq: "27,185 kHz", mode: "AM", target: "CB Channel 19" },
                      { freq: "8,992 kHz", mode: "USB", target: "USAF HFGCS primary" },
                      { freq: "11,175 kHz", mode: "USB", target: "USAF HFGCS Andrews" },
                    ].map((t) => (
                      <tr key={t.freq} className={`border-b last:border-b-0 ${t.freq.includes("4,687") || t.freq.includes("7,410") ? "bg-red-500/5" : ""}`}>
                        <td className="p-2 font-mono font-medium">{t.freq}</td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-[9px]">{t.mode}</Badge>
                        </td>
                        <td className="p-2 text-muted-foreground">{t.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              data-testid="button-tools-filter-all"
            >
              {t("tools.all")} ({TOOL_CATALOG.length})
            </Button>
            {allDomains.map((d) => {
              const count = TOOL_CATALOG.filter((tool) => tool.domain === d).length;
              if (count === 0) return null;
              return (
                <Button
                  key={d}
                  variant={filter === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(d)}
                  data-testid={`button-tools-filter-${d}`}
                >
                  {d.toUpperCase()} ({count})
                </Button>
              );
            })}
          </div>

          <div className="border rounded-md">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_2fr] gap-3 p-3 text-xs font-medium text-muted-foreground border-b">
              <span>{t("tools.name")}</span>
              <span>{t("tools.domain")}</span>
              <span>{t("tools.stars")}</span>
              <span>{t("tools.language")}</span>
              <span>{t("tools.license")}</span>
              <span>{t("tools.toolDescription")}</span>
            </div>
            {filtered.map((tool) => {
              const meta = metaMap.get(tool.name);
              return (
                <div
                  key={tool.name}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_2fr] gap-3 p-3 text-sm border-b last:border-b-0 items-center"
                  data-testid={`row-tool-${tool.name}`}
                >
                  <a
                    href={tool.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium flex items-center gap-1.5 hover:underline"
                  >
                    {tool.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  <Badge variant="secondary" className={`${domainColors[tool.domain] || ""} text-[10px]`}>
                    {tool.domain.toUpperCase()}
                  </Badge>
                  <span className="font-mono text-xs flex items-center gap-1 min-w-[60px]">
                    {metaLoading ? (
                      <Skeleton className="h-4 w-12" />
                    ) : meta ? (
                      <>
                        <Star className="h-3 w-3 text-yellow-500" />
                        {meta.stars.toLocaleString()}
                        {meta.forks > 0 && (
                          <span className="text-muted-foreground ml-1 flex items-center gap-0.5">
                            <GitFork className="h-3 w-3" />
                            {meta.forks}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </span>
                  <span className="text-xs font-mono min-w-[50px]">
                    {meta?.language || <span className="text-muted-foreground">&mdash;</span>}
                  </span>
                  <span className="text-xs font-mono min-w-[60px]">
                    {meta?.license || <span className="text-muted-foreground">&mdash;</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {meta?.description || tool.description}
                    {meta?.archived && <Badge variant="destructive" className="ml-2 text-[9px]">ARCHIVED</Badge>}
                  </span>
                </div>
              );
            })}
          </div>

          <Card>
            <CardContent className="py-4 text-xs text-muted-foreground" data-testid="text-tools-summary">
              {TOOL_CATALOG.length} tools cataloged across {allDomains.filter(d => TOOL_CATALOG.some(t => t.domain === d)).length} domains.
              {ghMeta && ghMeta.length > 0 && ` GitHub metadata loaded for ${ghMeta.length} repositories.`}
              {metaLoading && ` ${t("tools.loadingMeta")}`}
              {metaError && " GitHub metadata unavailable."}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
