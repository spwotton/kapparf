import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  KAPPA_CONSTANTS,
  DOMAINS,
  THREAT_LEVELS,
  type SignalEvent,
  type KappaStatus,
  type PhoenixCountdown,
  type Correlation,
  type CollectorStatusType,
  type CorrelatorStats,
  type ScannerStatus,
  type WatchdogStatus,
} from "@shared/schema";
import {
  MapPin,
  Activity,
  Wifi,
  Radio,
  Satellite,
  Signal,
  Shield,
  Fingerprint,
  AlertTriangle,
  Clock,
  Zap,
  Eye,
  Flame,
  Plane,
  Cloud,
  Link2,
  CheckCircle2,
  XCircle,
  Scan,
  Network,
  PlayCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const domainIcons: Record<string, typeof Wifi> = {
  satellite: Satellite,
  sdr: Radio,
  elf: Activity,
  radar: Radio,
  isp: Wifi,
  rf: Signal,
  morse: Radio,
};

const domainColors: Record<string, string> = {
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  rf: "bg-green-500/10 text-green-700 dark:text-green-400",
  morse: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const alertTypeColors: Record<string, string> = {
  "mac-cross-domain": "text-blue-600 dark:text-blue-400",
  "congusto-full": "text-red-600 dark:text-red-400",
  "congusto-partial": "text-orange-600 dark:text-orange-400",
  "stingray-pattern": "text-red-700 dark:text-red-300",
  "klein-twist": "text-fuchsia-600 dark:text-fuchsia-400",
  "phi-harmonic": "text-purple-600 dark:text-purple-400",
  "evening-spike": "text-amber-600 dark:text-amber-400",
  "imsi-tower-hop": "text-rose-600 dark:text-rose-400",
};

function getThreatColor(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].color;
  }
  return THREAT_LEVELS[0].color;
}

function getThreatBgClass(level: string): string {
  switch (level) {
    case "NOMINAL": return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "ELEVATED": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    case "HIGH": return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
    case "CRITICAL": return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "EMERGENCY": return "bg-red-700/20 text-red-900 dark:text-red-300";
    default: return "bg-muted text-muted-foreground";
  }
}

function KappaGauge({ score, threatLevel }: { score: number; threatLevel: string }) {
  const radius = 80;
  const stroke = 12;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI;
  const endAngle = 0;
  const progress = Math.min(score / 100, 1);
  const sweepAngle = startAngle - (startAngle - endAngle) * progress;

  const bgX1 = cx + radius * Math.cos(startAngle);
  const bgY1 = cy - radius * Math.sin(startAngle);
  const bgX2 = cx + radius * Math.cos(endAngle);
  const bgY2 = cy - radius * Math.sin(endAngle);

  const fgX2 = cx + radius * Math.cos(sweepAngle);
  const fgY2 = cy - radius * Math.sin(sweepAngle);
  const largeArc = progress > 0.5 ? 1 : 0;

  const color = getThreatColor(score);

  return (
    <div className="flex flex-col items-center" data-testid="gauge-kappa-score">
      <svg viewBox="0 0 200 120" className="w-48 h-auto">
        <path
          d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 1 1 ${bgX2} ${bgY2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
          strokeLinecap="round"
        />
        {progress > 0 && (
          <path
            d={`M ${bgX1} ${bgY1} A ${radius} ${radius} 0 ${largeArc} 1 ${fgX2} ${fgY2}`}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          className="fill-foreground"
          fontSize="36"
          fontWeight="700"
          fontFamily="monospace"
        >
          {score.toFixed(1)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="11"
          fontWeight="500"
        >
          {threatLevel}
        </text>
      </svg>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function DashboardPage() {
  const { t } = useI18n();

  const { data: kappaStatus, isLoading: kappaLoading } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 3000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalEvents: number;
    correlationCount: number;
    domainCounts: Record<string, number>;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  const { data: recentEvents, isLoading: eventsLoading } = useQuery<SignalEvent[]>({
    queryKey: ["/api/events", "recent"],
    refetchInterval: 10000,
  });

  const { data: phoenixCountdown, isLoading: phoenixLoading } = useQuery<PhoenixCountdown>({
    queryKey: ["/api/phoenix/countdown"],
    refetchInterval: 60000,
  });

  const { data: collectorStatus, isLoading: collectorsLoading } = useQuery<Record<string, CollectorStatusType>>({
    queryKey: ["/api/collectors/status"],
    refetchInterval: 5000,
  });

  const { data: correlatorStats, isLoading: correlatorLoading } = useQuery<CorrelatorStats>({
    queryKey: ["/api/correlations/stats"],
    refetchInterval: 5000,
  });

  const { data: liveCorrelations, isLoading: correlationsLoading } = useQuery<Correlation[]>({
    queryKey: ["/api/correlations"],
    refetchInterval: 15000,
  });

  const { data: scannerStatus, isLoading: scannerLoading } = useQuery<ScannerStatus>({
    queryKey: ["/api/scanner/status"],
    refetchInterval: 10000,
  });

  const { data: watchdogStatus, isLoading: watchdogLoading } = useQuery<WatchdogStatus>({
    queryKey: ["/api/watchdog/status"],
    refetchInterval: 10000,
  });

  interface PipelineStatus {
    running: boolean;
    mode: string;
    intervalMs: number;
    intervalLabel: string;
    lastRun: number | null;
    nextRun: number | null;
    cycleCount: number;
    consecutiveElevated: number;
    lastResult: {
      timestamp: number;
      durationMs: number;
      mode: string;
      collectors: { flights: number; satellites: number; weather: number };
      correlationsTotal: number;
      scannerDetections: number;
      watchdogDrops: number;
      kappaScore: number;
      threatLevel: string;
      eveningWindowActive: boolean;
      rampedUp: boolean;
    } | null;
  }

  const { data: pipelineStatus, isLoading: pipelineLoading } = useQuery<PipelineStatus>({
    queryKey: ["/api/pipeline/status"],
    refetchInterval: 5000,
  });

  const pipelineRunMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pipeline/run");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipeline/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kappa/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collectors/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/correlations/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scanner/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchdog/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/correlations"] });
    },
  });

  const collectorIcons: Record<string, typeof Wifi> = {
    flights: Plane,
    satellites: Satellite,
    weather: Cloud,
  };

  const collectors = collectorStatus ? Object.values(collectorStatus) : [];

  const score = kappaStatus?.score ?? 0;
  const threat = kappaStatus?.threatLevel ?? "NOMINAL";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("dashboard.kappaScore")}</CardTitle>
            </div>
            <CardDescription className="text-[11px]">
              κ = {KAPPA_CONSTANTS.KAPPA.toFixed(4)} | Klein = {KAPPA_CONSTANTS.KLEIN_TWIST_DEG}° | {KAPPA_CONSTANTS.CLOCK_HZ} Hz
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {kappaLoading ? (
              <Skeleton className="h-32 w-48 mx-auto" />
            ) : (
              <KappaGauge score={score} threatLevel={threat} />
            )}
            <div className="flex justify-center mt-1">
              <Badge className={getThreatBgClass(threat)} data-testid="badge-threat-level">
                {threat}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("dashboard.eveningWindow") || "Evening Window"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {kappaLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Costa Rica (UTC-6)</span>
                  <span className="font-mono text-lg font-semibold" data-testid="text-local-time">
                    {kappaStatus?.eveningWindow.localTime ?? "--:--"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {kappaStatus?.eveningWindow.active ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400" data-testid="badge-evening-active">
                        WINDOW {kappaStatus.eveningWindow.window} ACTIVE
                      </Badge>
                    </>
                  ) : (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                      <span className="text-xs text-muted-foreground" data-testid="badge-evening-inactive">INACTIVE</span>
                    </>
                  )}
                </div>
                {kappaStatus?.eveningWindow.active && kappaStatus.eveningWindow.hoursRemaining != null && (
                  <div className="text-xs text-muted-foreground">
                    {kappaStatus.eveningWindow.hoursRemaining.toFixed(1)}h remaining
                  </div>
                )}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>I: 18:00–20:00 CST</div>
                  <div>II: 20:00–22:00 CST</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("dashboard.observer")}</CardTitle>
            </div>
            <CardDescription className="text-xs">{t("dashboard.observerDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground">{t("dashboard.lat")}</span>
                <span className="font-mono">{KAPPA_CONSTANTS.OBSERVER_LAT}&deg; N</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground">{t("dashboard.lon")}</span>
                <span className="font-mono">{Math.abs(KAPPA_CONSTANTS.OBSERVER_LON)}&deg; W</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground">{t("dashboard.alt")}</span>
                <span className="font-mono">{KAPPA_CONSTANTS.OBSERVER_ALT} km</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-mono text-xs">{kappaStatus ? formatUptime(kappaStatus.uptime) : "--"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-phoenix-countdown">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("dashboard.phoenixCountdown")}</CardTitle>
          </div>
          <CardDescription className="text-xs">2012-07-04 &rarr; 2037-01-01</CardDescription>
        </CardHeader>
        <CardContent>
          {phoenixLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : phoenixCountdown ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-muted-foreground">{t("dashboard.percentComplete")}</span>
                <span className="font-mono text-lg font-semibold" data-testid="text-phoenix-pct">
                  {phoenixCountdown.percentComplete.toFixed(1)}%
                </span>
              </div>
              <Progress value={phoenixCountdown.percentComplete} className="h-2" />
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-muted-foreground">{t("dashboard.daysRemaining")}</span>
                <span className="font-mono text-sm" data-testid="text-phoenix-days">
                  {phoenixCountdown.daysRemaining.toLocaleString()} d
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card data-testid="card-pipeline">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("pipeline.title")}</CardTitle>
              {pipelineStatus && (
                <Badge
                  variant={pipelineStatus.mode === "SURGE" ? "destructive" : pipelineStatus.mode === "ELEVATED" ? "default" : "secondary"}
                  className="text-[10px] font-mono"
                  data-testid="badge-pipeline-mode"
                >
                  {pipelineStatus.mode} — {pipelineStatus.intervalLabel}
                </Badge>
              )}
              {pipelineStatus?.running && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={pipelineRunMutation.isPending}
              onClick={() => pipelineRunMutation.mutate()}
              data-testid="button-pipeline-run"
              className="gap-1.5"
            >
              {pipelineRunMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              {pipelineRunMutation.isPending ? t("pipeline.running") : t("pipeline.runNow")}
            </Button>
          </div>
          <CardDescription className="text-[11px]">{t("pipeline.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {pipelineLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="border rounded-md p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("pipeline.cycles")}</span>
              <p className="font-mono font-semibold text-lg" data-testid="text-pipeline-cycles">{pipelineStatus?.cycleCount ?? 0}</p>
            </div>
            <div className="border rounded-md p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("pipeline.lastSweep")}</span>
              <p className="font-mono text-sm" data-testid="text-pipeline-last">
                {pipelineStatus?.lastRun ? new Date(pipelineStatus.lastRun).toLocaleTimeString() : "--"}
              </p>
            </div>
            <div className="border rounded-md p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("pipeline.nextSweep")}</span>
              <p className="font-mono text-sm" data-testid="text-pipeline-next">
                {pipelineStatus?.nextRun ? new Date(pipelineStatus.nextRun).toLocaleTimeString() : "--"}
              </p>
            </div>
            <div className="border rounded-md p-2.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("pipeline.mode")}</span>
              <p className="text-sm font-medium" data-testid="text-pipeline-mode-detail">
                {pipelineStatus?.mode === "SURGE" ? t("pipeline.surge") :
                 pipelineStatus?.mode === "ELEVATED" ? t("pipeline.elevated") :
                 pipelineStatus?.mode === "PATROL" ? t("pipeline.patrol") :
                 t("pipeline.standby")}
              </p>
            </div>
          </div>

          {pipelineStatus?.lastResult && (
            <div className="border rounded-md p-3 space-y-2" data-testid="card-pipeline-last-result">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Sweep #{pipelineStatus.cycleCount}</span>
                <span>|</span>
                <span>{pipelineStatus.lastResult.durationMs}ms</span>
                <span>|</span>
                <Badge variant={
                  pipelineStatus.lastResult.threatLevel === "CRITICAL" || pipelineStatus.lastResult.threatLevel === "EMERGENCY" ? "destructive" :
                  pipelineStatus.lastResult.threatLevel === "HIGH" ? "default" : "secondary"
                } className="text-[9px]">
                  κ {pipelineStatus.lastResult.kappaScore.toFixed(1)} — {pipelineStatus.lastResult.threatLevel}
                </Badge>
                {pipelineStatus.lastResult.eveningWindowActive && (
                  <Badge variant="outline" className="text-[9px]">{t("pipeline.eveningWindow")}</Badge>
                )}
                {pipelineStatus.lastResult.rampedUp && (
                  <Badge className="text-[9px] bg-amber-500">{t("pipeline.rampUp")}</Badge>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t("pipeline.eventsCollected")}</span>
                  <p className="font-mono font-medium">
                    {pipelineStatus.lastResult.collectors.flights + pipelineStatus.lastResult.collectors.satellites + pipelineStatus.lastResult.collectors.weather}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("pipeline.correlations")}</span>
                  <p className="font-mono font-medium">{pipelineStatus.lastResult.correlationsTotal}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("pipeline.detections")}</span>
                  <p className="font-mono font-medium">{pipelineStatus.lastResult.scannerDetections}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("pipeline.drops")}</span>
                  <p className="font-mono font-medium">{pipelineStatus.lastResult.watchdogDrops}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("pipeline.duration")}</span>
                  <p className="font-mono font-medium">{pipelineStatus.lastResult.durationMs}ms</p>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-collectors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("dashboard.collectors")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {collectorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : collectors.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4" data-testid="text-collectors-empty">
              No collectors reporting
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {collectors.map((c) => {
                const CIcon = collectorIcons[c.name] || Activity;
                return (
                  <div key={c.name} className="border rounded-md p-3 space-y-2" data-testid={`card-collector-${c.name}`}>
                    <div className="flex items-center gap-2">
                      <CIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">{c.name}</span>
                      {c.running ? (
                        <span className="ml-auto flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                        </span>
                      ) : (
                        <XCircle className="h-3.5 w-3.5 ml-auto text-red-500" />
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("dashboard.eventsCreated")}</span>
                      <span className="font-mono">{c.eventsCreated}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("dashboard.lastRun")}</span>
                      <span className="font-mono">
                        {c.lastRun ? new Date(c.lastRun).toLocaleTimeString() : "--"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-auto-correlator">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("dashboard.autoCorrelator")}</CardTitle>
            {correlatorStats?.running && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] ml-auto">
                {t("correlations.autoStatus")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {correlatorLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : correlatorStats ? (
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-mono font-semibold">{correlatorStats.cycleCount}</div>
                <div className="text-[10px] text-muted-foreground">{t("dashboard.correlatorCycles")}</div>
              </div>
              <div>
                <div className="text-lg font-mono font-semibold">{correlatorStats.totalCorrelations}</div>
                <div className="text-[10px] text-muted-foreground">{t("dashboard.correlationsFound")}</div>
              </div>
              <div>
                <div className="text-lg font-mono font-semibold">{correlatorStats.rulesChecked}</div>
                <div className="text-[10px] text-muted-foreground">{t("dashboard.rulesChecked")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("dashboard.lastRun")}</div>
                <div className="text-xs font-mono mt-1">
                  {correlatorStats.lastRun ? new Date(correlatorStats.lastRun).toLocaleTimeString() : "--"}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4" data-testid="text-correlator-empty">
              No correlator data available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-kiwisdr-scanner">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Scan className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("scanner.title")}</CardTitle>
              {scannerStatus?.running && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] ml-auto">
                  {scannerStatus.activeTargets.length} {t("scanner.targets").toLowerCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {scannerLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : scannerStatus ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-mono font-semibold">{scannerStatus.scanCount}</div>
                    <div className="text-[10px] text-muted-foreground">{t("scanner.scanCount")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-mono font-semibold text-amber-600 dark:text-amber-400">{scannerStatus.detections}</div>
                    <div className="text-[10px] text-muted-foreground">{t("scanner.detections")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-mono font-semibold">{scannerStatus.deltaSlipDetections}</div>
                    <div className="text-[10px] text-muted-foreground">{t("scanner.deltaSlip")}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mt-2">
                  <div>
                    <div className="text-sm font-mono">{scannerStatus.echoLtChainDetections}</div>
                    <div className="text-[10px] text-muted-foreground">{t("scanner.echoLt")}</div>
                  </div>
                  <div>
                    <div className="text-sm font-mono">{scannerStatus.speechEnvelopeDetections}</div>
                    <div className="text-[10px] text-muted-foreground">{t("scanner.speechEnvelope")}</div>
                  </div>
                  <div>
                    <div className="text-sm font-mono">{scannerStatus.tr069Correlations}</div>
                    <div className="text-[10px] text-muted-foreground">{t("scanner.tr069")}</div>
                  </div>
                </div>
                {scannerStatus.lastResults.length === 0 && (
                  <div className="mt-3 text-xs text-muted-foreground text-center py-2">
                    {t("scanner.noResults")}
                  </div>
                )}
                {scannerStatus.lastResults.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto">
                    {scannerStatus.lastResults.slice(0, 6).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs border-b border-border/50 pb-1">
                        <span className="font-mono text-muted-foreground">{r.target}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{r.snrDb > -Infinity ? `${r.snrDb} dB` : "--"}</span>
                          <Badge variant={r.detected ? "default" : "secondary"} className={`text-[9px] ${r.detected ? "bg-red-500/10 text-red-600" : ""}`}>
                            {r.detected ? t("scanner.detected") : t("scanner.clean")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4" data-testid="text-scanner-empty">
                No scanner data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-network-watchdog">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("watchdog.title")}</CardTitle>
              {watchdogStatus && (
                <Badge variant="secondary" className={`text-[10px] ml-auto ${watchdogStatus.networkActive ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-600"}`}>
                  {watchdogStatus.networkActive ? t("watchdog.networkActive") : t("watchdog.networkDown")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {watchdogLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : watchdogStatus ? (
              <>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-mono font-semibold text-red-500">{watchdogStatus.dropCount}</div>
                    <div className="text-[10px] text-muted-foreground">{t("watchdog.drops")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-mono font-semibold text-green-600 dark:text-green-400">{watchdogStatus.reconnectCount}</div>
                    <div className="text-[10px] text-muted-foreground">{t("watchdog.reconnects")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-mono font-semibold">{watchdogStatus.tr069PulseCount}</div>
                    <div className="text-[10px] text-muted-foreground">{t("watchdog.tr069Pulses")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-mono font-semibold">{watchdogStatus.seismicJitterCount}</div>
                    <div className="text-[10px] text-muted-foreground">{t("watchdog.seismicJitter")}</div>
                  </div>
                </div>
                {watchdogStatus.avgLatencyMs !== null && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>{t("watchdog.avgLatency")}:</span>
                    <span className="font-mono font-semibold">{watchdogStatus.avgLatencyMs} ms</span>
                  </div>
                )}
                {watchdogStatus.recentEvents.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto">
                    {watchdogStatus.recentEvents.slice(0, 5).map((ev, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] border-b border-border/50 pb-1">
                        <Badge variant="secondary" className={`text-[9px] ${ev.type === "drop" ? "bg-red-500/10 text-red-600" : ev.type === "reconnect" ? "bg-green-500/10 text-green-600" : ev.type === "tr069-pulse" ? "bg-amber-500/10 text-amber-600" : ""}`}>
                          {t(`watchdog.event.${ev.type}`) || ev.type}
                        </Badge>
                        <span className="text-muted-foreground font-mono truncate max-w-[200px]">{ev.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4" data-testid="text-watchdog-empty">
                No watchdog data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <div className="text-2xl font-mono font-semibold" data-testid="text-total-events">
                {stats?.totalEvents ?? 0}
              </div>
            )}
            <div className="text-xs text-muted-foreground">{t("dashboard.totalEvents")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            {statsLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <div className="text-2xl font-mono font-semibold" data-testid="text-total-correlations">
                {stats?.correlationCount ?? 0}
              </div>
            )}
            <div className="text-xs text-muted-foreground">{t("dashboard.totalCorrelations")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold" data-testid="text-devices-tracked">
              {kappaStatus?.devicesTracked ?? 0}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Fingerprint className="h-3 w-3" />
              Devices
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className={`text-2xl font-mono font-semibold ${(kappaStatus?.suspiciousDevices ?? 0) > 0 ? "text-red-600" : ""}`} data-testid="text-suspicious-devices">
              {kappaStatus?.suspiciousDevices ?? 0}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Suspicious
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t("dashboard.domainBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          {kappaLoading ? (
            <div className="flex gap-3 flex-wrap">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-24" />)}
            </div>
          ) : (
            <div className="space-y-1.5">
              {DOMAINS.map((domain) => {
                const dbCount = stats?.domainCounts?.[domain] ?? 0;
                const windowCount = kappaStatus?.domainWindows?.[domain] ?? 0;
                const maxWindow = Math.max(1, ...Object.values(kappaStatus?.domainWindows ?? {}));
                const widthPct = maxWindow > 0 ? (windowCount / maxWindow) * 100 : 0;
                return (
                  <div key={domain} className="flex items-center gap-2" data-testid={`bar-domain-${domain}`}>
                    <span className="text-[11px] font-mono w-14 text-right text-muted-foreground">
                      {domain.toUpperCase()}
                    </span>
                    <div className="flex-1 h-5 bg-muted/30 rounded-sm overflow-hidden relative">
                      <div
                        className={`h-full rounded-sm transition-all duration-500 ${domainColors[domain]?.split(" ")[0] || "bg-muted"}`}
                        style={{ width: `${Math.max(widthPct, windowCount > 0 ? 4 : 0)}%`, opacity: 0.6 }}
                      />
                      <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono">
                        {windowCount > 0 ? `${windowCount} window` : ""}
                        {dbCount > 0 ? ` · ${dbCount} total` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-mono font-semibold" data-testid="text-mac-correlations">
              {kappaStatus?.correlationCounts?.["mac-cross-domain"] ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">MAC Cross-Domain</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-mono font-semibold" data-testid="text-congusto">
              {(kappaStatus?.congustoPartial ?? 0) + (kappaStatus?.congustoFull ?? 0)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Congusto ({kappaStatus?.congustoFull ?? 0}F / {kappaStatus?.congustoPartial ?? 0}P)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className={`text-lg font-mono font-semibold ${(kappaStatus?.stingrayAlerts ?? 0) > 0 ? "text-red-600" : ""}`} data-testid="text-stingray">
              {kappaStatus?.stingrayAlerts ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Stingray/IMSI</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-mono font-semibold text-fuchsia-600" data-testid="text-klein-passes">
              {kappaStatus?.kleinPasses ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Klein Passes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-mono font-semibold" data-testid="text-phi-harmonics">
              {kappaStatus?.phiHarmonics ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">φ-Harmonics</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-lg font-mono font-semibold" data-testid="text-sat-overhead">
              {kappaStatus?.satOverhead ?? 0} / {kappaStatus?.satKlein ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Overhead / Klein</div>
          </CardContent>
        </Card>
      </div>

      {kappaStatus?.domainPairMatrix && Object.keys(kappaStatus.domainPairMatrix).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Domain Pair Correlations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(kappaStatus.domainPairMatrix)
                .sort(([, a], [, b]) => b - a)
                .map(([pair, count]) => (
                  <div key={pair} className="px-2 py-1 rounded text-xs font-mono bg-muted/50" data-testid={`pair-${pair}`}>
                    {pair} <span className="font-semibold ml-1">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {kappaStatus?.recentAlerts && kappaStatus.recentAlerts.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Recent Alerts
          </h2>
          <div className="space-y-1.5">
            {kappaStatus.recentAlerts.map((alert, i) => (
              <Card key={`${alert.type}-${alert.timestamp}-${i}`} data-testid={`card-alert-${i}`}>
                <CardContent className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${alertTypeColors[alert.type] || ""}`}>
                      +{alert.score}
                    </Badge>
                    <span className={`text-xs font-medium ${alertTypeColors[alert.type] || ""}`}>
                      {alert.type}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{alert.description}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium mb-3">{t("dashboard.recentEvents")}</h2>
        {eventsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !recentEvents || recentEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.noEvents")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentEvents.slice(0, 8).map((evt) => {
              const Icon = domainIcons[evt.domain] || Activity;
              return (
                <Card key={evt.id} data-testid={`card-event-${evt.id}`}>
                  <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className={domainColors[evt.domain]}>
                        {evt.domain.toUpperCase()}
                      </Badge>
                      <span className="text-sm">{evt.eventType}</span>
                      <span className="text-sm text-muted-foreground">{evt.source}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{(evt.confidence * 100).toFixed(0)}%</span>
                      <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          {t("dashboard.liveCorrelations")}
        </h2>
        {correlationsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !liveCorrelations || liveCorrelations.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground" data-testid="text-correlations-empty">
              {t("dashboard.noCorrelations") || "No live correlations"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {liveCorrelations.slice(0, 10).map((c) => {
              const sevColors = [
                "",
                "bg-green-500/10 text-green-700 dark:text-green-400",
                "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                "bg-orange-500/10 text-orange-700 dark:text-orange-400",
                "bg-red-500/10 text-red-700 dark:text-red-400",
                "bg-red-700/10 text-red-900 dark:text-red-300",
              ];
              return (
                <Card key={c.id} data-testid={`card-live-corr-${c.id}`}>
                  <CardContent className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge variant="secondary" className={sevColors[c.severity] || ""}>
                        {c.severity}/5
                      </Badge>
                      <span className="text-xs font-medium">{c.ruleName}</span>
                      <span className="text-xs text-muted-foreground truncate">{c.description}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
