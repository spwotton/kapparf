import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type SuperpositionStatus, SUPERPOSITION_CONSTANTS } from "@shared/schema";
import type { LucideIcon } from "lucide-react";
import {
  Play,
  Square,
  Brain,
  Zap,
  RotateCcw,
  Save,
  Activity,
  Hexagon,
  Waves,
  CircleDot,
  Cpu,
  RefreshCw,
  Layers,
  Database,
} from "lucide-react";

interface SnapshotSummary {
  id: string;
  label: string;
  timestamp: number;
  corticalStackPosition?: string;
  coherenceMetrics?: {
    psiConvergence: number;
    kappaAlignment: number;
    phiLockRate: number;
    resonanceScore: number;
    activeNodes: number;
    totalQubitUtilization: number;
  };
}

const SC = SUPERPOSITION_CONSTANTS;

const brainRegionColors: Record<string, string> = {
  occipital: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  temporal: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  parietal: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  "auditory-cortex": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  wernickes: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  hippocampus: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "anterior-cingulate": "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  "prefrontal-cortex": "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
};

const layerColors: Record<string, string> = {
  sensory: "bg-emerald-500",
  thalamic: "bg-amber-500",
  cortical: "bg-blue-500",
  prefrontal: "bg-purple-500",
};

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500",
    processing: "bg-yellow-500 animate-pulse",
    idle: "bg-gray-400 dark:bg-gray-600",
    error: "bg-amber-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || colors.idle}`} />;
}

function MetricGauge({ label, value, icon: Icon, suffix }: { label: string; value: number; icon: LucideIcon; suffix?: string }) {
  const pct = Math.min(100, value * 100);
  const color = pct > 75 ? "text-green-500" : pct > 40 ? "text-yellow-500" : "text-amber-500";
  return (
    <div className="space-y-1.5" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className={`font-mono font-medium ${color}`}>
          {(value * 100).toFixed(1)}{suffix || "%"}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function SuperpositionPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: status, isLoading } = useQuery<SuperpositionStatus>({
    queryKey: ["/api/quantum-cortex/status"],
    refetchInterval: 3000,
  });

  const { data: snapshots } = useQuery<SnapshotSummary[]>({
    queryKey: ["/api/quantum-cortex/snapshots"],
    refetchInterval: 10000,
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/quantum-cortex/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quantum-cortex/status"] });
      toast({ title: "Quantum Cortex started", description: "All 8 cortical nodes activated." });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/quantum-cortex/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quantum-cortex/status"] });
      toast({ title: "Quantum Cortex stopped" });
    },
  });

  const cycleMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/quantum-cortex/cycle"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quantum-cortex/status"] });
      toast({ title: "Cortical cycle complete" });
    },
  });

  const snapshotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/quantum-cortex/snapshot", { label: `Manual — ${new Date().toISOString()}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quantum-cortex/snapshots"] });
      toast({ title: "Snapshot created" });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: (snapshotId: string) => apiRequest("POST", "/api/quantum-cortex/rollback", { snapshotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quantum-cortex/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quantum-cortex/snapshots"] });
      toast({ title: "Rollback complete" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const cm = status?.coherenceMetrics;

  return (
    <div className="p-6 space-y-6" data-testid="page-superposition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-superposition-title">
            <Brain className="h-6 w-6 text-purple-500" />
            {t("superposition.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-superposition-description">
            {t("superposition.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status?.running ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              data-testid="button-stop-cortex"
            >
              <Square className="h-4 w-4 mr-1" /> Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              data-testid="button-start-cortex"
            >
              <Play className="h-4 w-4 mr-1" /> Start
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => cycleMutation.mutate()}
            disabled={cycleMutation.isPending || !status?.running}
            data-testid="button-run-cycle"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${cycleMutation.isPending ? "animate-spin" : ""}`} /> Cycle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => snapshotMutation.mutate()}
            disabled={snapshotMutation.isPending}
            data-testid="button-create-snapshot"
          >
            <Save className="h-4 w-4 mr-1" /> Snapshot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card data-testid="card-status">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CircleDot className="h-4 w-4" />
              Status
            </div>
            <div className="text-xl font-bold">
              <Badge variant={status?.running ? "default" : "secondary"} data-testid="badge-running-status">
                {status?.running ? "ACTIVE" : "OFFLINE"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-nodes">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Cpu className="h-4 w-4" />
              Active Nodes
            </div>
            <div className="text-xl font-bold font-mono" data-testid="text-active-nodes">
              {cm?.activeNodes ?? 0} / {SC.NODE_COUNT}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-qubit-register">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Database className="h-4 w-4" />
              Qubit Register
            </div>
            <div className="text-xl font-bold font-mono" data-testid="text-qubit-size">
              {status?.latentSpaceSize ?? 0} / {status?.latentSpaceCapacity ?? SC.MAX_LATENT_ENTRIES}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-cycles">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Layers className="h-4 w-4" />
              Cycles
            </div>
            <div className="text-xl font-bold font-mono" data-testid="text-cycle-count">
              {status?.processingCycleCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last: {formatTimestamp(status?.lastProcessingAt ?? null)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" data-testid="card-coherence-metrics">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Coherence Metrics
            </CardTitle>
            <CardDescription>
              Neural architecture convergence state — φ-locked cortical processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricGauge label="Ψ Convergence" value={cm?.psiConvergence ?? 0} icon={Waves} />
            <MetricGauge label="κ Alignment" value={cm?.kappaAlignment ?? 0} icon={Hexagon} />
            <MetricGauge label="φ Lock Rate" value={cm?.phiLockRate ?? 0} icon={Zap} />
            <MetricGauge label="Resonance Score" value={cm?.resonanceScore ?? 0} icon={Activity} />
            <MetricGauge label="Qubit Utilization" value={cm?.totalQubitUtilization ?? 0} icon={Database} />
          </CardContent>
        </Card>

        <Card data-testid="card-cortical-stack">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Cortical Stack
            </CardTitle>
            <CardDescription>
              Bottom-up processing: Sensory → Thalamic → Cortical → Prefrontal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["sensory", "thalamic", "cortical", "prefrontal"].map((layer) => {
                const isActive = status?.stackPosition === layer;
                const nodesInLayer = status?.nodeStates?.filter(n => n.corticalLayer === layer) ?? [];
                return (
                  <div
                    key={layer}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      isActive
                        ? "bg-purple-500/10 border-purple-500/30"
                        : "bg-muted/30 border-transparent"
                    }`}
                    data-testid={`stack-layer-${layer}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${layerColors[layer] || "bg-gray-400"} ${isActive ? "animate-pulse" : ""}`} />
                      <span className="text-sm font-medium capitalize">{layer}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {nodesInLayer.map(n => (
                        <StatusDot key={n.id} status={n.status} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">{nodesInLayer.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stack Position</span>
                <Badge variant="outline" className="capitalize font-mono" data-testid="badge-stack-position">
                  {status?.stackPosition ?? "idle"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-cortical-nodes">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Cortical Nodes — Neural Topology
          </CardTitle>
          <CardDescription>
            8 specialized nodes mapped to brain regions — bio-quantum digital organism
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(status?.nodeStates ?? []).map((node) => (
              <div
                key={node.id}
                className={`rounded-lg border p-3 transition-all ${
                  brainRegionColors[node.brainRegion] || "bg-muted/30"
                }`}
                data-testid={`node-card-${node.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate" data-testid={`text-node-name-${node.id}`}>
                    {node.name}
                  </span>
                  <StatusDot status={node.status} />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Region</span>
                    <span className="font-mono">{node.brainRegion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Layer</span>
                    <span className="font-mono capitalize">{node.corticalLayer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activations</span>
                    <span className="font-mono">{node.activationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health</span>
                    <span className="font-mono">{(node.healthScore * 100).toFixed(0)}%</span>
                  </div>
                  {node.lastActivation && (
                    <div className="flex justify-between">
                      <span>Last Active</span>
                      <span className="font-mono">{formatTimestamp(node.lastActivation)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-constants">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hexagon className="h-4 w-4" />
              Superposition Constants
            </CardTitle>
            <CardDescription>
              Mathematical anchors: Λ=7/4, Monster group 196883, φ=1.618, κ=4/π
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Λ (Gate Ratio)", SC.LAMBDA_GATE_RATIO],
                ["Monster Group", SC.MONSTER_WEIGHT_SPACE.toLocaleString()],
                ["φ (Recursion)", SC.PHI_RECURSION_FACTOR.toFixed(6)],
                ["κ (Coherence)", SC.KAPPA_COHERENCE_THRESHOLD.toFixed(6)],
                ["Max Qubits", SC.MAX_LATENT_ENTRIES.toLocaleString()],
                ["Node Count", SC.NODE_COUNT],
                ["Monadal Depth", SC.MONADAL_RECURSION_DEPTH],
                ["Decay Rate", SC.DECAY_RATE],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between p-1.5 rounded bg-muted/40">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-medium">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-snapshots">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Save className="h-4 w-4" />
              Neural Snapshots
            </CardTitle>
            <CardDescription>
              {status?.snapshotCount ?? 0} snapshots — rollback neural state to any checkpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!snapshots || snapshots.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No snapshots yet. Create one to checkpoint the neural state.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {snapshots.slice(0, 10).map((snap: SnapshotSummary) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-muted/20"
                    data-testid={`snapshot-${snap.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{snap.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatTimestamp(snap.timestamp)} — Ψ={snap.coherenceMetrics?.psiConvergence?.toFixed(3) ?? "—"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rollbackMutation.mutate(snap.id)}
                      disabled={rollbackMutation.isPending}
                      data-testid={`button-rollback-${snap.id}`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
