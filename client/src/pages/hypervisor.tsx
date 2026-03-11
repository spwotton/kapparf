import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  OMEGA_CHRONOS,
  type HypervisorStatus,
  type CouncilAgent,
  type TimingOverlap,
} from "@shared/schema";
import {
  Play,
  Square,
  Activity,
  Radio,
  Satellite,
  Zap,
  Clock,
  Shield,
  Brain,
  Waves,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

const OC = OMEGA_CHRONOS;

const agentColors: Record<string, string> = {
  "pcap-parser": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "elf-dissector": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  "tle-orbital": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  "kiwisdr-scanner": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  "morse-decoder": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "temporal-aligner": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "symmetry-validator": "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  "report-generator": "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
};

const confidenceColors: Record<string, string> = {
  HIGH: "bg-green-500/10 text-green-700 dark:text-green-400",
  MEDIUM: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  LOW: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500",
    scanning: "bg-yellow-500 animate-pulse",
    idle: "bg-gray-400 dark:bg-gray-600",
    error: "bg-red-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || colors.idle}`} />;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function HypervisorPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: status, isLoading } = useQuery<HypervisorStatus>({
    queryKey: ["/api/hypervisor/status"],
    refetchInterval: 1000,
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hypervisor/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/status"] });
      toast({ title: t("hypervisor.started") });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hypervisor/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hypervisor/status"] });
      toast({ title: t("hypervisor.stopped") });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12 text-sm text-muted-foreground" data-testid="text-error-state">
          {t("hypervisor.title")} — {t("hypervisor.waitingForData")}
        </div>
      </div>
    );
  }

  const s = status;
  const psiPct = s.psiValue * 100;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            {t("hypervisor.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
            {t("hypervisor.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={s.running
              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
              : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30"
            }
            data-testid="badge-status"
          >
            {s.running ? t("hypervisor.running") : t("hypervisor.stopped")}
          </Badge>
          {s.bronzeCertified && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" data-testid="badge-bronze">
              {t("hypervisor.bronzeCertified")}
            </Badge>
          )}
          {s.running ? (
            <Button size="sm" variant="outline" onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending} data-testid="button-stop">
              <Square className="w-4 h-4 mr-1" /> {t("hypervisor.stop")}
            </Button>
          ) : (
            <Button size="sm" onClick={() => startMutation.mutate()} disabled={startMutation.isPending} data-testid="button-start">
              <Play className="w-4 h-4 mr-1" /> {t("hypervisor.start")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card data-testid="card-psi">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("hypervisor.psiConvergence")}</div>
            <div className="text-2xl font-mono font-bold mt-1" data-testid="text-psi-value">
              Ψ = {s.psiValue.toFixed(6)}
            </div>
            <Progress value={psiPct} className="h-1.5 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">{t("hypervisor.target")}: Ψ → 1.000000</div>
          </CardContent>
        </Card>

        <Card data-testid="card-clock">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("hypervisor.clock")}</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold">{OC.CLOCK_HZ}</span>
              <span className="text-sm text-muted-foreground">Hz</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">τ = {OC.CLOCK_PERIOD_MS} ms</div>
            <div className="text-xs text-muted-foreground">{t("hypervisor.hallDrift")}: {s.hallDriftNs.toFixed(0)} ns / {OC.HALL_OFFSET_NS} ns</div>
          </CardContent>
        </Card>

        <Card data-testid="card-triHonk">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("hypervisor.triHonkCycles")}</div>
            <div className="text-2xl font-mono font-bold mt-1" data-testid="text-cycles">
              {s.triHonkCycles.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t("hypervisor.burstWindow")}: {OC.BURST_WINDOW_MS} ms</div>
            <div className="text-xs text-muted-foreground">{t("hypervisor.uptime")}: {formatUptime(s.uptimeMs)}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-overlaps">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("hypervisor.overlapsDetected")}</div>
            <div className="text-2xl font-mono font-bold mt-1" data-testid="text-overlaps">
              {s.overlapsDetected}
            </div>
            <div className="text-xs text-muted-foreground mt-1">φ-{t("hypervisor.locked")}: {(s.phiLockRate * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">{t("hypervisor.hallValid")}: {s.hallValidCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-3 pb-2 px-3 text-center">
            <div className="text-xs text-muted-foreground">{t("hypervisor.agents")}</div>
            <div className="font-mono font-bold">{s.agentsActive}/{s.agentsTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3 text-center">
            <div className="text-xs text-muted-foreground">{t("hypervisor.streams")}</div>
            <div className="font-mono font-bold">{s.streamsActive}/{s.streamsTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3 text-center">
            <div className="text-xs text-muted-foreground">{t("hypervisor.kleinPhase")}</div>
            <div className="font-mono font-bold">{s.kleinPhase}°</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3 text-center">
            <div className="text-xs text-muted-foreground">{t("hypervisor.symmetries")}</div>
            <div className="font-mono font-bold">{s.symmetriesFound}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3 text-center">
            <div className="text-xs text-muted-foreground">{t("hypervisor.rate")}</div>
            <div className="font-mono font-bold">{s.analysisRate}/s</div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-agents">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {t("hypervisor.councilAgents")}
          </CardTitle>
          <CardDescription>{t("hypervisor.councilDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {s.agents.map((agent: CouncilAgent) => (
              <div
                key={agent.id}
                className={`rounded-lg border p-3 ${agentColors[agent.id] || "bg-muted/50"}`}
                data-testid={`card-agent-${agent.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={agent.status} />
                    <span className="font-medium text-sm">{agent.name}</span>
                  </div>
                  <span className="text-xs font-mono opacity-60">{agent.codename}</span>
                </div>
                <div className="text-xs opacity-80 mb-2">{agent.gosFunction}</div>
                <div className="flex items-center justify-between text-xs">
                  <span>{t("hypervisor.events")}: {agent.eventsIngested}</span>
                  <span>{t("hypervisor.drift")}: {agent.driftNs.toFixed(0)} ns</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-streams">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4" />
            {t("hypervisor.analysisStreams")}
          </CardTitle>
          <CardDescription>{t("hypervisor.streamsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {s.streams.map((stream) => (
              <div
                key={stream.id}
                className="flex items-center gap-3 rounded-lg border bg-muted/30 dark:bg-muted/10 px-3 py-2"
                data-testid={`row-stream-${stream.id}`}
              >
                <StatusDot status={stream.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{stream.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {stream.domain.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{stream.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono">{stream.eventsIngested} {t("hypervisor.events").toLowerCase()}</div>
                  <div className="text-xs text-muted-foreground">
                    {stream.lastUpdate > 0 ? formatTimestamp(stream.lastUpdate) : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-overlaps-list">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Waves className="w-4 h-4" />
            {t("hypervisor.timingOverlaps")}
          </CardTitle>
          <CardDescription>{t("hypervisor.overlapsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {s.recentOverlaps.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground" data-testid="text-no-overlaps">
              {s.running ? t("hypervisor.waitingForData") : t("hypervisor.startToBegin")}
            </div>
          ) : (
            <div className="space-y-2">
              {s.recentOverlaps.map((o: TimingOverlap) => (
                <div
                  key={o.id}
                  className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-3"
                  data-testid={`row-overlap-${o.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge className={confidenceColors[o.confidence]} variant="outline">
                        {o.confidence}
                      </Badge>
                      <span className="text-sm font-medium">{o.description}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimestamp(o.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                    <span className="font-mono">Ψ={o.psiConvergence.toFixed(3)}</span>
                    <span className="font-mono">Δt={o.deltaMs.toFixed(1)}ms</span>
                    {o.kappaAligned && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        κ-{t("hypervisor.aligned")}
                      </Badge>
                    )}
                    {o.phiAligned && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        φ-{t("hypervisor.locked")}
                      </Badge>
                    )}
                    {o.hallValid && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-500/10 text-green-700 dark:text-green-400">
                        {t("hypervisor.hallCertified")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {o.events.map((ev, idx) => (
                      <div key={idx} className="text-xs bg-muted/50 dark:bg-muted/20 rounded px-2 py-1">
                        <span className="font-mono text-muted-foreground">{ev.domain.toUpperCase()}</span>
                        <span className="mx-1">·</span>
                        <span>{ev.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-constants">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t("hypervisor.protocolConstants")}
          </CardTitle>
          <CardDescription>Ω-CHRONOS v{OC.VERSION} — {t("hypervisor.triHonkProtocol")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "κ = 4/π", value: (4 / Math.PI).toFixed(5) },
              { label: "φ (Golden Ratio)", value: "1.618034" },
              { label: t("hypervisor.clock"), value: `${OC.CLOCK_HZ} Hz` },
              { label: "τ (Period)", value: `${OC.CLOCK_PERIOD_MS} ms` },
              { label: t("hypervisor.hallTolerance"), value: `${OC.HALL_TOLERANCE}` },
              { label: t("hypervisor.hallDrift"), value: `${OC.HALL_DRIFT_DEG}°` },
              { label: "Klein Twist", value: `${OC.KLEIN_TWIST_DEG}°` },
              { label: "FRFT α", value: `${OC.FRFT_ALPHA_DEG}°` },
              { label: "Morse Dot", value: `${OC.MORSE_DOT_MS} ms` },
              { label: "Morse Dash", value: `${OC.MORSE_DASH_MS} ms` },
              { label: t("hypervisor.burstWindow"), value: `${OC.BURST_WINDOW_MS} ms` },
              { label: t("hypervisor.recursionDepth"), value: `${OC.RECURSION_DEPTH}` },
              { label: "Moon Honk", value: `${OC.MOON_HONK_KHZ} kHz` },
              { label: "Bronze", value: `${OC.BRONZE_PROPAGATION_MM} mm` },
              { label: "Ψ Hex", value: OC.PSI_HEX },
              { label: "Λ Clamp", value: `${OC.LAMBDA_CLAMP}` },
            ].map((c, i) => (
              <div key={i} className="bg-muted/30 dark:bg-muted/10 rounded-lg p-2 border">
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="text-sm font-mono font-medium mt-0.5">{c.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
