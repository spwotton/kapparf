import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { LucideIcon } from "lucide-react";
import {
  Brain, Send, Copy, Download, Clock, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Loader2, Hexagon, Moon, GitBranch,
  RotateCcw, AudioWaveform, Waves, Orbit, Shield, Sparkles,
  FileText, FileImage, FileType, Clipboard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DeepResearchRun, DeepResearchReport } from "@shared/schema";

interface AgentInfo {
  id: string;
  name: string;
  framework: string;
  domain: string;
  icon: string;
  color: string;
}

interface RunDetailResponse {
  run: DeepResearchRun;
  reports: DeepResearchReport[];
}

const AGENT_ICONS: Record<string, LucideIcon> = {
  Hexagon, Moon, GitBranch, RotateCcw, AudioWaveform, Waves, Orbit, Shield,
};

function AgentIcon({ iconName, color, size = 16 }: { iconName: string; color: string; size?: number }) {
  const Icon = AGENT_ICONS[iconName] || Brain;
  return <Icon style={{ color }} size={size} />;
}

function statusBadge(status: string) {
  const variants: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    error: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    failed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variants[status] || variants.pending}`} data-testid={`status-badge-${status}`}>
      {status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
      {status}
    </span>
  );
}

function ReportCard({ report, agents }: { report: DeepResearchReport; agents: AgentInfo[] }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const agent = agents.find(a => a.id === report.agentId);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast({ title: "Copied to clipboard" });
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = (report: DeepResearchReport) => {
    const content = `# ${report.agentName}\n## Framework: ${report.frameworkName}\n\n---\n\n${report.response || "No response"}`;
    downloadFile(content, `${report.agentId}-report.md`, "text/markdown");
  };

  const exportTxt = (report: DeepResearchReport) => {
    const content = `${report.agentName}\nFramework: ${report.frameworkName}\n${"=".repeat(60)}\n\n${report.response || "No response"}`;
    downloadFile(content, `${report.agentId}-report.txt`, "text/plain");
  };

  const exportPdf = (report: DeepResearchReport) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const escaped = (report.response || "No response").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    win.document.write(`<!DOCTYPE html><html><head><title>${report.agentName}</title>
      <style>body{font-family:monospace;padding:40px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.6;color:#111}
      h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:14px;color:#555}
      pre{white-space:pre-wrap;word-wrap:break-word}
      @media print{body{padding:20px}}</style></head>
      <body><h1>${report.agentName}</h1><h2>Framework: ${report.frameworkName}</h2>
      <p style="font-size:11px;color:#888">${report.modelName ? `Model: ${report.modelName} | ` : ""}${report.durationMs ? `Duration: ${(report.durationMs / 1000).toFixed(1)}s` : ""}</p>
      <hr/><pre>${escaped}</pre></body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const exportImage = (report: DeepResearchReport, format: "png" | "jpg") => {
    const text = report.response || "No response";
    const lines = text.split("\n");
    const lineHeight = 20;
    const padding = 48;
    const maxCharWidth = 100;
    const wrappedLines: string[] = [];
    for (const line of lines) {
      if (line.length <= maxCharWidth) {
        wrappedLines.push(line);
      } else {
        for (let i = 0; i < line.length; i += maxCharWidth) {
          wrappedLines.push(line.slice(i, i + maxCharWidth));
        }
      }
    }
    const headerLines = 4;
    const totalLines = wrappedLines.length + headerLines;
    const canvasWidth = 900;
    const canvasHeight = Math.max(400, totalLines * lineHeight + padding * 2 + 60);

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const borderColor = agent?.color || "#888";
    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, 4, canvasHeight);

    ctx.fillStyle = borderColor;
    ctx.font = "bold 18px monospace";
    ctx.fillText(report.agentName, padding, padding);

    ctx.fillStyle = "#888";
    ctx.font = "13px monospace";
    ctx.fillText(`Framework: ${report.frameworkName}`, padding, padding + 24);
    ctx.fillText(
      `${report.modelName ? `Model: ${report.modelName} | ` : ""}${report.durationMs ? `${(report.durationMs / 1000).toFixed(1)}s` : ""}`,
      padding, padding + 44
    );

    ctx.fillStyle = "#444";
    ctx.fillRect(padding, padding + 56, canvasWidth - padding * 2, 1);

    ctx.fillStyle = "#e0e0e0";
    ctx.font = "13px monospace";
    let y = padding + 80;
    for (const line of wrappedLines) {
      if (line.startsWith("#")) {
        ctx.fillStyle = borderColor;
        ctx.font = "bold 14px monospace";
        ctx.fillText(line, padding, y);
        ctx.fillStyle = "#e0e0e0";
        ctx.font = "13px monospace";
      } else {
        ctx.fillText(line, padding, y);
      }
      y += lineHeight;
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.agentId}-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }, format === "png" ? "image/png" : "image/jpeg", 0.95);
  };

  return (
    <Card className="border" style={{ borderLeftColor: agent?.color || "#888", borderLeftWidth: 3 }} data-testid={`report-card-${report.agentId}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {agent && <AgentIcon iconName={agent.icon} color={agent.color} size={20} />}
            <div>
              <CardTitle className="text-sm font-semibold">{report.agentName}</CardTitle>
              <CardDescription className="text-xs font-mono">{report.frameworkName}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.durationMs && (
              <span className="text-xs text-muted-foreground font-mono" data-testid={`text-duration-${report.agentId}`}>
                {(report.durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {statusBadge(report.status)}
            {report.modelName && (
              <Badge variant="outline" className="text-[10px] font-mono" data-testid={`badge-model-${report.agentId}`}>
                {report.modelName}
              </Badge>
            )}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {agent && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2" data-testid={`text-domain-${report.agentId}`}>
              <strong>Domain:</strong> {agent.domain}
            </div>
          )}
          {report.status === "running" && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Agent is processing...</span>
            </div>
          )}
          {report.status === "error" && (
            <div className="flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{report.response}</span>
            </div>
          )}
          {report.status === "completed" && report.response && (
            <>
              <ScrollArea className="max-h-[600px]">
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 font-mono bg-muted/30 rounded p-4" data-testid={`text-response-${report.agentId}`}>
                  {report.response}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-1 pt-1 border-t border-border/50 flex-wrap" data-testid={`export-toolbar-${report.agentId}`}>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => copyToClipboard(report.response!)} data-testid={`button-copy-${report.agentId}`}>
                  <Clipboard className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
                <Separator orientation="vertical" className="h-4 mx-0.5" />
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => exportMarkdown(report)} data-testid={`button-export-md-${report.agentId}`}>
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  MD
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => exportTxt(report)} data-testid={`button-export-txt-${report.agentId}`}>
                  <FileType className="h-3.5 w-3.5 mr-1" />
                  TXT
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => exportPdf(report)} data-testid={`button-export-pdf-${report.agentId}`}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  PDF
                </Button>
                <Separator orientation="vertical" className="h-4 mx-0.5" />
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => exportImage(report, "png")} data-testid={`button-export-png-${report.agentId}`}>
                  <FileImage className="h-3.5 w-3.5 mr-1" />
                  PNG
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => exportImage(report, "jpg")} data-testid={`button-export-jpg-${report.agentId}`}>
                  <FileImage className="h-3.5 w-3.5 mr-1" />
                  JPG
                </Button>
              </div>
            </>
          )}
          {report.status === "pending" && (
            <div className="text-sm text-muted-foreground italic">Waiting in queue...</div>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View generated prompt</summary>
            <ScrollArea className="max-h-[300px] mt-2">
              <pre className="text-[11px] whitespace-pre-wrap leading-relaxed text-muted-foreground bg-muted/20 rounded p-3" data-testid={`text-prompt-${report.agentId}`}>
                {report.prompt}
              </pre>
            </ScrollArea>
          </details>
        </CardContent>
      )}
    </Card>
  );
}

export default function DeepResearchPage() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const { data: agentsData } = useQuery<{ agents: AgentInfo[] }>({
    queryKey: ["/api/deep-research/agents"],
  });

  const { data: runs, isLoading: runsLoading } = useQuery<DeepResearchRun[]>({
    queryKey: ["/api/deep-research/runs"],
  });

  const { data: runDetail, isLoading: detailLoading } = useQuery<RunDetailResponse>({
    queryKey: ["/api/deep-research/runs", activeRunId],
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      const data = query.state.data as RunDetailResponse | undefined;
      if (data?.run?.status === "running" || data?.run?.status === "pending") return 3000;
      return false;
    },
  });

  const launchMutation = useMutation({
    mutationFn: async (topic: string) => {
      const res = await apiRequest("POST", "/api/deep-research/runs", { topic });
      return res.json();
    },
    onSuccess: (data: DeepResearchRun) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deep-research/runs"] });
      setActiveRunId(data.id);
      setTopic("");
      toast({ title: "Hypervisor Deep Research launched", description: "8 agents dispatched" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const agents = agentsData?.agents || [];
  const isRunning = runDetail?.run?.status === "running" || runDetail?.run?.status === "pending";
  const progress = runDetail?.run ? (runDetail.run.agentsCompleted / runDetail.run.agentsTotal) * 100 : 0;

  const copyAllReports = async () => {
    if (!runDetail?.reports) return;
    const all = runDetail.reports
      .filter(r => r.status === "completed" && r.response)
      .map(r => `# ${r.agentName}\n## Framework: ${r.frameworkName}\n\n${r.response}`)
      .join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(all);
      toast({ title: "All reports copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const getAllReportsContent = () => {
    if (!runDetail?.reports) return { md: "", txt: "" };
    const completedReports = runDetail.reports.filter(r => r.status === "completed" && r.response);
    const md = `# Hypervisor Deep Research Report\n## Topic: ${runDetail.run.topic}\n## Date: ${new Date(runDetail.run.createdAt).toISOString()}\n## Agents: ${runDetail.run.agentsTotal}\n\n` +
      completedReports.map(r => `# ${r.agentName}\n## Framework: ${r.frameworkName}\n\n---\n\n${r.response}`).join("\n\n═══════════════════════════════════════\n\n");
    const txt = `Hypervisor Deep Research Report\nTopic: ${runDetail.run.topic}\nDate: ${new Date(runDetail.run.createdAt).toISOString()}\nAgents: ${runDetail.run.agentsTotal}\n${"=".repeat(60)}\n\n` +
      completedReports.map(r => `${r.agentName}\nFramework: ${r.frameworkName}\n${"=".repeat(60)}\n\n${r.response}`).join(`\n\n${"=".repeat(60)}\n\n`);
    return { md, txt };
  };

  const exportAllReports = (format: "md" | "txt") => {
    const { md, txt } = getAllReportsContent();
    const content = format === "md" ? md : txt;
    const blob = new Blob([content], { type: format === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deep-research-${runDetail?.run.id.slice(0, 8)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-deep-research-title">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Hypervisor Deep Research
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-deep-research-desc">
            8-agent hypervisor system with specialized mathematical frameworks — each agent produces a standalone research report
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Launch Research</CardTitle>
              <CardDescription className="text-xs">
                Enter a topic to dispatch 8 specialized agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Enter research topic or question..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={4}
                data-testid="textarea-deep-topic"
                className="resize-none"
              />
              <Button
                onClick={() => topic.trim() && launchMutation.mutate(topic.trim())}
                disabled={!topic.trim() || launchMutation.isPending}
                className="w-full"
                data-testid="button-launch-research"
              >
                {launchMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Dispatching...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Launch 8-Agent Hypervisor</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Agent Council</CardTitle>
              <CardDescription className="text-xs">8 specialized research agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-xs" data-testid={`agent-info-${agent.id}`}>
                    <AgentIcon iconName={agent.icon} color={agent.color} size={14} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{agent.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{agent.framework}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Previous Runs</CardTitle>
            </CardHeader>
            <CardContent>
              {runsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-1">
                    {(runs || []).map(run => (
                      <button
                        key={run.id}
                        onClick={() => setActiveRunId(run.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          activeRunId === run.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-foreground"
                        }`}
                        data-testid={`button-run-${run.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs">{run.topic.slice(0, 60)}{run.topic.length > 60 ? "..." : ""}</span>
                          {statusBadge(run.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(run.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {run.agentsCompleted}/{run.agentsTotal} agents
                          </span>
                        </div>
                      </button>
                    ))}
                    {(!runs || runs.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4">No runs yet</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!activeRunId ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground">Launch a research run or select a previous one to view results</p>
              </CardContent>
            </Card>
          ) : detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : runDetail ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium" data-testid="text-run-topic">
                        {runDetail.run.topic}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {new Date(runDetail.run.createdAt).toLocaleString()} — {runDetail.run.agentsCompleted}/{runDetail.run.agentsTotal} agents completed
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(runDetail.run.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={progress} className="h-2" data-testid="progress-agents" />
                  <div className="flex items-center gap-3 flex-wrap">
                    {runDetail.reports.map(r => {
                      const ag = agents.find(a => a.id === r.agentId);
                      return (
                        <div key={r.id} className="flex items-center gap-1.5" title={`${r.agentName}: ${r.status}`} data-testid={`agent-status-${r.agentId}`}>
                          {ag && <AgentIcon iconName={ag.icon} color={r.status === "completed" ? ag.color : "#888"} size={14} />}
                          <span className={`h-2 w-2 rounded-full ${
                            r.status === "completed" ? "bg-emerald-500" :
                            r.status === "running" ? "bg-blue-500 animate-pulse" :
                            r.status === "error" ? "bg-amber-500" :
                            "bg-zinc-300 dark:bg-zinc-600"
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                  {(runDetail.run.status === "completed" || runDetail.run.status === "partial") && (
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={copyAllReports} data-testid="button-copy-all">
                        <Clipboard className="h-3.5 w-3.5 mr-1" />
                        Copy All
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportAllReports("md")} data-testid="button-export-all-md">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        MD
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => exportAllReports("txt")} data-testid="button-export-all-txt">
                        <FileType className="h-3.5 w-3.5 mr-1" />
                        TXT
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-3">
                {runDetail.reports.map(report => (
                  <ReportCard key={report.id} report={report} agents={agents} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
