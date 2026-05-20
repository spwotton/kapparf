import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CollectorStatusType, CorrelatorStats, CollectionLog, SuperpositionStatus } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  FileText,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  Plane,
  Satellite,
  Cloud,
  Activity,
  Link2,
  ScrollText,
  Atom,
  BrainCircuit,
} from "lucide-react";

interface IntelReport {
  summary: string;
  trends: string[];
  anomalies: string[];
  recommendations: string[];
  fallback?: boolean;
}

const collectorIcons: Record<string, typeof Plane> = {
  flights: Plane,
  satellites: Satellite,
  weather: Cloud,
};

export default function IntelligencePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [report, setReport] = useState<IntelReport | null>(null);

  const { data: collectorStatus, isError: collectorsError } = useQuery<Record<string, CollectorStatusType>>({
    queryKey: ["/api/collectors/status"],
    refetchInterval: 5000,
  });

  const { data: correlatorStats, isError: correlatorError } = useQuery<CorrelatorStats>({
    queryKey: ["/api/correlations/stats"],
    refetchInterval: 5000,
  });

  const { data: collectionLogs, isLoading: logsLoading, isError: logsError } = useQuery<CollectionLog[]>({
    queryKey: ["/api/collection-logs"],
    refetchInterval: 10000,
  });

  const { data: cortexStatus } = useQuery<SuperpositionStatus>({
    queryKey: ["/api/quantum-cortex/status"],
    refetchInterval: 5000,
  });

  const cortexCycleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quantum-cortex/cycle", {
        input: `[INTELLIGENCE-ANALYSIS] Manual cortical analysis triggered from Intelligence dashboard at ${new Date().toISOString()}`
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quantum-cortex/status"] });
      toast({ title: "Cortical analysis cycle completed" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/analysis/report?hours=24");
      return res.json() as Promise<IntelReport>;
    },
    onSuccess: (data) => {
      setReport(data);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("intelligence.reportFailed"),
        variant: "destructive",
      });
    },
  });

  const learnMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/analysis/learn");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("intelligence.learned") });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("intelligence.learnFailed"),
        variant: "destructive",
      });
    },
  });

  const collectors = collectorStatus ? Object.values(collectorStatus) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {t("intelligence.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("intelligence.subtitle")}</p>
      </div>

      {collectorsError && (
        <p className="text-sm text-destructive" data-testid="text-collectors-error">
          {t("common.error")}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collectors.map((c) => {
          const Icon = collectorIcons[c.name] || Activity;
          return (
            <Card key={c.name} data-testid={`card-collector-${c.name}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium capitalize">{c.name}</span>
                  <Badge
                    variant="secondary"
                    className={c.running
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    }
                    data-testid={`badge-collector-status-${c.name}`}
                  >
                    {c.running ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" />{t("dashboard.collectorRunning")}</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" />{t("dashboard.collectorError")}</>
                    )}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t("dashboard.lastRun")}</span>
                    <span className="font-mono">
                      {c.lastRun ? new Date(c.lastRun).toLocaleTimeString() : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dashboard.eventsCreated")}</span>
                    <span className="font-mono">{c.eventsCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dashboard.errors")}</span>
                    <span className={`font-mono ${c.errors > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                      {c.errors}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("dashboard.interval")}</span>
                    <span className="font-mono">{(c.intervalMs / 1000).toFixed(0)}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cortexStatus && (
        <Card data-testid="card-cortex-status">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Atom className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-medium">Quantum Cortex</CardTitle>
              </div>
              <Badge
                variant="outline"
                className={cortexStatus.running
                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30"
                }
                data-testid="badge-cortex-status"
              >
                {cortexStatus.running ? "Active" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <CardDescription>Bio-quantum neural architecture — {cortexStatus.coherenceMetrics.activeNodes}/{cortexStatus.constants.NODE_COUNT} cortical nodes</CardDescription>
              {cortexStatus.running && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => cortexCycleMutation.mutate()}
                  disabled={cortexCycleMutation.isPending}
                  data-testid="button-cortex-analysis"
                >
                  <Atom className="h-3 w-3 mr-1" />
                  {cortexCycleMutation.isPending ? "Analyzing..." : "Run Cortical Analysis"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Ψ Convergence</div>
                <div className="text-lg font-mono font-semibold" data-testid="text-cortex-psi">
                  {(cortexStatus.coherenceMetrics.psiConvergence * 100).toFixed(1)}%
                </div>
                <Progress value={cortexStatus.coherenceMetrics.psiConvergence * 100} className="h-1 mt-1" />
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">κ Alignment</div>
                <div className="text-lg font-mono font-semibold" data-testid="text-cortex-kappa">
                  {cortexStatus.coherenceMetrics.kappaAlignment.toFixed(3)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Latent Space</div>
                <div className="text-lg font-mono font-semibold" data-testid="text-cortex-latent">
                  {cortexStatus.latentSpaceSize}/{cortexStatus.latentSpaceCapacity}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Cycles</div>
                <div className="text-lg font-mono font-semibold" data-testid="text-cortex-cycles">
                  {cortexStatus.processingCycleCount}
                </div>
              </div>
            </div>
            {cortexStatus.running && cortexStatus.nodeStates.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cortexStatus.nodeStates.map(node => (
                  <Badge
                    key={node.id}
                    variant="outline"
                    className={node.status === "active"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 text-[10px]"
                      : node.status === "processing"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] animate-pulse"
                        : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30 text-[10px]"
                    }
                    data-testid={`badge-node-${node.id}`}
                  >
                    <BrainCircuit className="h-2.5 w-2.5 mr-0.5" />
                    {node.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {correlatorError && (
        <p className="text-sm text-destructive" data-testid="text-correlator-error">
          {t("common.error")}
        </p>
      )}

      {correlatorStats && (
        <Card data-testid="card-correlator-stats">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("dashboard.autoCorrelator")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-mono font-semibold" data-testid="text-correlator-cycles">
                  {correlatorStats.cycleCount}
                </div>
                <div className="text-xs text-muted-foreground">{t("dashboard.correlatorCycles")}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono font-semibold" data-testid="text-correlator-found">
                  {correlatorStats.totalCorrelations}
                </div>
                <div className="text-xs text-muted-foreground">{t("dashboard.correlationsFound")}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono font-semibold" data-testid="text-correlator-rules">
                  {correlatorStats.rulesChecked}
                </div>
                <div className="text-xs text-muted-foreground">{t("dashboard.rulesChecked")}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {correlatorStats.running ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                  )}
                  <span className="text-xs font-medium">
                    {correlatorStats.running ? t("correlations.autoStatus") : t("intelligence.stopped")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {correlatorStats.lastRun
                    ? new Date(correlatorStats.lastRun).toLocaleTimeString()
                    : "--"
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("intelligence.report")}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => learnMutation.mutate()}
                disabled={learnMutation.isPending}
                data-testid="button-learn"
              >
                <GraduationCap className="h-3.5 w-3.5 mr-1" />
                {learnMutation.isPending ? t("intelligence.learning") : t("intelligence.learn")}
              </Button>
              <Button
                size="sm"
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                data-testid="button-generate-report"
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                {reportMutation.isPending ? t("intelligence.generating") : t("intelligence.generateReport")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!report ? (
            <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-report">
              {t("intelligence.noReport")}
            </p>
          ) : (
            <div className="space-y-4">
              {report.fallback && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  {t("intelligence.heuristicFallback")}
                </Badge>
              )}
              <div>
                <p className="text-sm" data-testid="text-report-summary">{report.summary}</p>
              </div>

              {report.trends.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("intelligence.trends")}
                  </h3>
                  <ul className="space-y-1">
                    {report.trends.map((trend, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-blue-500/40" data-testid={`text-trend-${i}`}>
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.anomalies.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("intelligence.anomalies")}
                  </h3>
                  <ul className="space-y-1">
                    {report.anomalies.map((anomaly, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-500/40" data-testid={`text-anomaly-${i}`}>
                        {anomaly}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.recommendations.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                    {t("intelligence.recommendations")}
                  </h3>
                  <ul className="space-y-1">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-green-500/40" data-testid={`text-rec-${i}`}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("intelligence.collectionLogs")}</CardTitle>
          </div>
          <CardDescription className="text-xs">
            {collectionLogs ? `${collectionLogs.length} recent entries` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : logsError ? (
            <p className="text-sm text-destructive text-center py-4" data-testid="text-logs-error">
              {t("common.error")}
            </p>
          ) : !collectionLogs || collectionLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-logs">
              {t("intelligence.noLogs")}
            </p>
          ) : (
            <div className="border rounded-md">
              <div className="grid grid-cols-5 gap-2 p-2 text-xs font-medium text-muted-foreground border-b">
                <span>{t("intelligence.logCollector")}</span>
                <span>{t("intelligence.logEvents")}</span>
                <span>{t("intelligence.logDuration")}</span>
                <span>{t("intelligence.logStatus")}</span>
                <span>{t("intelligence.logTime")}</span>
              </div>
              {collectionLogs.slice(0, 20).map((log) => {
                const Icon = collectorIcons[log.collector] || Activity;
                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-5 gap-2 p-2 text-xs border-b last:border-b-0 items-center"
                    data-testid={`row-log-${log.id}`}
                  >
                    <span className="flex items-center gap-1.5 capitalize">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      {log.collector}
                    </span>
                    <span className="font-mono">{log.eventsCreated}</span>
                    <span className="font-mono">{log.durationMs}ms</span>
                    <span>
                      <Badge
                        variant="secondary"
                        className={log.status === "success"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 text-[10px]"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]"
                        }
                      >
                        {log.status}
                      </Badge>
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
