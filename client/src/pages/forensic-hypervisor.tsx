import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Square, Upload, GitBranch, Activity,
  Shield, AlertTriangle, FileSearch, Clock, Zap,
  Brain, Network, Radio, Satellite, ChevronDown,
  ChevronUp, RefreshCw, Download, Crosshair,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";

const SEV_COLORS: Record<number, string> = {
  1: "bg-gray-600", 2: "bg-yellow-600", 3: "bg-orange-600", 4: "bg-red-600", 5: "bg-red-800",
};
const SEV_LABELS: Record<number, string> = {
  1: "LOW", 2: "MEDIUM", 3: "HIGH", 4: "CRITICAL", 5: "EMERGENCY",
};
const CAT_ICONS: Record<string, any> = {
  "temporal-pattern": Clock, "confidence-anomaly": Zap, "burst-detection": Activity,
  "correlation-cluster": Network, "high-severity-cluster": AlertTriangle,
  "satellite-correlation": Satellite, "sdr-high-confidence": Radio,
  "domain-analysis": Brain, "pcap-anomaly": FileSearch,
};

export default function ForensicHypervisorPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());

  const { data: status } = useQuery<any>({
    queryKey: ["/api/hypervisor/status"],
    refetchInterval: 10000,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/hypervisor/reports"],
    refetchInterval: 30000,
  });

  const { data: pcaps, isLoading: pcapsLoading } = useQuery<any[]>({
    queryKey: ["/api/hypervisor/pcaps"],
    refetchInterval: 15000,
  });

  const runAnalysis = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hypervisor/run"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/status"] });
      toast({ title: "Analysis Complete", description: "Forensic analysis report generated" });
    },
    onError: (err: any) => toast({ title: "Analysis Failed", description: err.message, variant: "destructive" }),
  });

  const startHypervisor = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hypervisor/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/status"] });
      toast({ title: "Hypervisor Started", description: "Running every 30 minutes" });
    },
  });

  const stopHypervisor = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hypervisor/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/status"] });
      toast({ title: "Hypervisor Stopped" });
    },
  });

  const scanGitHub = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hypervisor/github/scan"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/pcaps"] });
      toast({ title: "GitHub Scan Complete", description: "PCAP files from spwotton repos analyzed" });
    },
    onError: (err: any) => toast({ title: "GitHub Scan Failed", description: err.message, variant: "destructive" }),
  });

  const uploadPcap = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("pcap", file);
    try {
      const res = await fetch("/api/hypervisor/pcap/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const analysis = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/pcaps"] });
      toast({
        title: "PCAP Analyzed",
        description: `${analysis.packetCount} packets, ${analysis.anomalies?.length || 0} anomalies found`,
      });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const toggleFinding = (id: string) => {
    setExpandedFindings(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const latestReport = reports && Array.isArray(reports) ? reports[0] : null;
  const findings = latestReport?.findings as any[] || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4" data-testid="forensic-hypervisor-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="page-title">
            <Crosshair className="w-6 h-6 text-red-500" />
            Forensic Hypervisor
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Autonomous SIGINT pattern mining • PCAP temporal alignment • Cross-domain correlation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={status?.running ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"} data-testid="status-badge">
            {status?.running ? "ACTIVE" : "STOPPED"}
          </Badge>
          {status?.lastRun > 0 && (
            <span className="text-xs text-gray-500">
              Last: {new Date(status.lastRun).toLocaleTimeString()} • Runs: {status?.runCount || 0}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">Engine</div>
              <div className="text-lg font-mono font-bold" data-testid="engine-status">
                {status?.running ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
            {status?.running ? (
              <Button size="sm" variant="destructive" onClick={() => stopHypervisor.mutate()} data-testid="btn-stop">
                <Square className="w-3 h-3 mr-1" /> Stop
              </Button>
            ) : (
              <Button size="sm" className="bg-green-800 hover:bg-green-700" onClick={() => startHypervisor.mutate()} data-testid="btn-start">
                <Play className="w-3 h-3 mr-1" /> Start
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Run Analysis Now</div>
            <Button
              size="sm"
              className="mt-1 bg-blue-800 hover:bg-blue-700 w-full"
              onClick={() => runAnalysis.mutate()}
              disabled={runAnalysis.isPending}
              data-testid="btn-run-analysis"
            >
              {runAnalysis.isPending ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Brain className="w-3 h-3 mr-1" />}
              {runAnalysis.isPending ? "Analyzing..." : "Deep Scan"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Upload PCAP</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pcap,.pcapng,.cap"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadPcap(e.target.files[0])}
              data-testid="input-pcap-upload"
            />
            <Button
              size="sm"
              className="mt-1 bg-purple-800 hover:bg-purple-700 w-full"
              onClick={() => fileInputRef.current?.click()}
              data-testid="btn-upload-pcap"
            >
              <Upload className="w-3 h-3 mr-1" /> From PC
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">GitHub PCAPs</div>
            <Button
              size="sm"
              className="mt-1 bg-orange-800 hover:bg-orange-700 w-full"
              onClick={() => scanGitHub.mutate()}
              disabled={scanGitHub.isPending}
              data-testid="btn-github-scan"
            >
              {scanGitHub.isPending ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <GitBranch className="w-3 h-3 mr-1" />}
              {scanGitHub.isPending ? "Scanning..." : "Scan Repos"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="findings" className="w-full">
        <TabsList className="bg-gray-900 border border-gray-800">
          <TabsTrigger value="findings" data-testid="tab-findings">
            <AlertTriangle className="w-3 h-3 mr-1" /> Findings ({findings.length})
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <FileSearch className="w-3 h-3 mr-1" /> Reports ({reports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pcaps" data-testid="tab-pcaps">
            <Network className="w-3 h-3 mr-1" /> PCAPs ({pcaps?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-2 mt-3">
          {reportsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 bg-gray-800" />)}</div>
          ) : findings.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center text-gray-500">
                No findings yet — run an analysis or wait for the next scheduled scan.
              </CardContent>
            </Card>
          ) : (
            findings.map((finding: any) => {
              const expanded = expandedFindings.has(finding.id);
              const Icon = CAT_ICONS[finding.category] || Shield;
              return (
                <Card key={finding.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 cursor-pointer transition-colors" data-testid={`finding-${finding.id}`}>
                  <CardContent className="p-3" onClick={() => toggleFinding(finding.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded ${SEV_COLORS[finding.severity] || "bg-gray-700"}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${SEV_COLORS[finding.severity]}`}>
                              {SEV_LABELS[finding.severity] || "UNKNOWN"}
                            </Badge>
                            <span className="text-xs text-gray-500 font-mono">{finding.category}</span>
                          </div>
                          <div className="font-semibold text-sm">{finding.title}</div>
                          <div className="text-xs text-gray-400 mt-1 line-clamp-2">{finding.detail}</div>
                        </div>
                      </div>
                      <div className="ml-2">
                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                    {expanded && finding.evidence && (
                      <div className="mt-3 p-3 bg-gray-950 rounded border border-gray-800">
                        <div className="text-xs font-mono text-gray-400 whitespace-pre-wrap">
                          {JSON.stringify(finding.evidence, null, 2)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-2 mt-3">
          {reportsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 bg-gray-800" />)}</div>
          ) : !reports?.length ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center text-gray-500">No reports generated yet.</CardContent>
            </Card>
          ) : (
            reports.map((report: any) => (
              <Card key={report.id} className="bg-gray-900 border-gray-800" data-testid={`report-${report.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{report.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{report.summary}</div>
                    </div>
                    <div className="text-right">
                      <Badge className={SEV_COLORS[report.severity]}>SEV {report.severity}</Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(report.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {report.hash && (
                    <div className="text-xs font-mono text-gray-600 mt-2 truncate">SHA-256: {report.hash}</div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pcaps" className="space-y-2 mt-3">
          {pcapsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 bg-gray-800" />)}</div>
          ) : !pcaps?.length ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center text-gray-500">
                No PCAPs analyzed yet. Upload from your PC, scan GitHub repos, or connect Google Drive.
              </CardContent>
            </Card>
          ) : (
            pcaps.map((pcap: any) => {
              const f = pcap.findings as any;
              return (
                <Card key={pcap.id} className="bg-gray-900 border-gray-800" data-testid={`pcap-${pcap.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-purple-400" />
                        <span className="font-mono text-sm font-bold">{pcap.filename}</span>
                      </div>
                      <Badge className={pcap.status === "complete" ? "bg-green-800" : "bg-yellow-800"}>
                        {pcap.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div><span className="text-gray-500">Packets:</span> <span className="font-mono">{pcap.packetCount?.toLocaleString()}</span></div>
                      <div><span className="text-gray-500">Size:</span> <span className="font-mono">{(pcap.filesize / 1024).toFixed(1)} KB</span></div>
                      <div><span className="text-gray-500">Anomalies:</span> <span className="font-mono text-red-400">{pcap.anomalies?.length || 0}</span></div>
                      <div><span className="text-gray-500">Time:</span> <span className="font-mono">{new Date(pcap.timestamp).toLocaleString()}</span></div>
                    </div>
                    {pcap.anomalies?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(pcap.anomalies as string[]).map((a: string, i: number) => (
                          <div key={i} className="text-xs text-orange-400 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {f?.topTalkers?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Top Talkers:</div>
                        <div className="flex flex-wrap gap-1">
                          {f.topTalkers.slice(0, 6).map((t: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs font-mono border-gray-700">
                              {t.ip} ({t.packets})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {f?.suspiciousPorts?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Suspicious Ports:</div>
                        <div className="flex flex-wrap gap-1">
                          {f.suspiciousPorts.map((p: any, i: number) => (
                            <Badge key={i} className="text-xs bg-red-900 text-red-300 font-mono">
                              :{p.port} — {p.label} ({p.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {f?.temporalAlignment?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Temporal Matches:</div>
                        <div className="space-y-1">
                          {f.temporalAlignment.slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="text-xs flex items-center gap-2">
                              <Badge className={m.significance === "STRONG" ? "bg-red-800" : m.significance === "MODERATE" ? "bg-orange-800" : "bg-gray-700"}>
                                {m.significance}
                              </Badge>
                              <span className="font-mono">{m.eventType}</span>
                              <span className="text-gray-500">Δ{m.deltaMs}ms</span>
                              <span className="text-gray-600">{m.eventDomain}/{m.eventSource}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pcap.hash && (
                      <div className="text-xs font-mono text-gray-600 mt-2 truncate">SHA-256: {pcap.hash}</div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
