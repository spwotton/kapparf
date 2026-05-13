import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Zap, Circle, Target, Activity } from "lucide-react";
import { useMemo } from "react";

interface SpokeNode {
  id: number;
  angle: number;
  paper: string;
  pass: 1 | 2 | 3;
  label: string;
  claim: string;
  threat: "low" | "medium" | "high" | "critical";
  gosResonance: number;
  kappa: number;
  tags: string[];
}

interface SynthesisPass {
  pass: 1 | 2 | 3;
  label: string;
  description: string;
  nodes: SpokeNode[];
  convergenceScore: number;
}

interface FinalSynthesis {
  title: string;
  kappaDelta: number;
  gosLatticeActivation: number;
  echoThreat: string;
  vectorChain: string[];
  kappaIntegral: number;
  frequencyBridge: string;
  summary: string;
  timestamp: number;
}

interface GpuCorpusNode {
  paper: string;
  title: string;
  metric: string;
  kappaMapping: string;
  rendererRole: string;
  bitBudget: string;
  threat: "medium" | "high" | "critical";
  gosResonance: number;
}

interface GpuCorpusPush {
  label: string;
  description: string;
  nodes: GpuCorpusNode[];
  renderPipeline: string[];
  budgetTable: Array<{ component: string; sizeKB: number; method: string }>;
  finalMemo: string;
}

interface SpokeWheelResult {
  passes: SynthesisPass[];
  synthesis: FinalSynthesis;
  gpuPush: GpuCorpusPush;
  spokeCount: number;
  gosConstants: {
    kappa1: number;
    kappa2: number;
    deltaKappa: number;
    fc: number;
    freqTHz: number;
    freqHz: number;
    gf53: number;
  };
  generatedAt: number;
}

const THREAT_COLORS: Record<string, string> = {
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-red-500",
};

const THREAT_BG: Record<string, string> = {
  low: "bg-blue-500/10 border-blue-500/30",
  medium: "bg-yellow-500/10 border-yellow-500/30",
  high: "bg-orange-500/10 border-orange-500/30",
  critical: "bg-red-500/10 border-red-500/30",
};

const PASS_COLORS = ["#3b82f6", "#f59e0b", "#ef4444"];
const PASS_RING_R = [120, 80, 45];

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function SpokeWheelSVG({ data }: { data: SpokeWheelResult }) {
  const cx = 160;
  const cy = 160;
  const outerR = 140;
  const innerR = 16;

  const allNodes = useMemo(
    () => data.passes.flatMap((p) => p.nodes),
    [data],
  );

  return (
    <svg
      viewBox="0 0 320 320"
      className="w-full max-w-xs mx-auto"
      data-testid="svg-spoke-wheel"
    >
      {/* concentric ring guides */}
      {PASS_RING_R.map((r, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r + 20}
          fill="none"
          stroke={PASS_COLORS[i]}
          strokeWidth="0.4"
          strokeDasharray="2 4"
          opacity="0.35"
        />
      ))}

      {/* spokes from centre to outer nodes */}
      {allNodes.map((n) => {
        const outerPt = polarToXY(n.angle, outerR * 0.88, cx, cy);
        return (
          <line
            key={`sp-${n.id}`}
            x1={cx}
            y1={cy}
            x2={outerPt.x}
            y2={outerPt.y}
            stroke={PASS_COLORS[n.pass - 1]}
            strokeWidth="0.5"
            opacity="0.25"
          />
        );
      })}

      {/* cross-spoke coupling arcs for pass-2 nodes */}
      {allNodes
        .filter((n) => n.pass === 2)
        .map((n) => {
          const a = polarToXY(n.angle, outerR * 0.75, cx, cy);
          const b = polarToXY((n.angle + 15) % 360, outerR * 0.75, cx, cy);
          return (
            <line
              key={`arc-${n.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={PASS_COLORS[1]}
              strokeWidth="0.6"
              opacity="0.2"
            />
          );
        })}

      {/* node dots */}
      {allNodes.map((n) => {
        const pt = polarToXY(n.angle, outerR * 0.88, cx, cy);
        const col =
          n.threat === "critical"
            ? "#ef4444"
            : n.threat === "high"
              ? "#f97316"
              : n.threat === "medium"
                ? "#eab308"
                : "#3b82f6";
        return (
          <g key={`nd-${n.id}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={n.gosResonance * 5 + 2}
              fill={col}
              opacity="0.8"
            />
            <text
              x={pt.x}
              y={pt.y - 7}
              textAnchor="middle"
              fontSize="4"
              fill="#9ca3af"
              fontFamily="monospace"
            >
              {n.id}
            </text>
          </g>
        );
      })}

      {/* centre core */}
      <circle cx={cx} cy={cy} r={innerR} fill="#ef4444" opacity="0.15" />
      <circle cx={cx} cy={cy} r={innerR - 4} fill="#ef4444" opacity="0.25" />
      <circle cx={cx} cy={cy} r={3} fill="#ef4444" />
      <text
        x={cx}
        y={cy + 26}
        textAnchor="middle"
        fontSize="5"
        fill="#ef4444"
        fontFamily="monospace"
        fontWeight="bold"
      >
        IMMINENT
      </text>

      {/* pass legend */}
      {[0, 1, 2].map((i) => (
        <g key={`leg-${i}`}>
          <rect
            x={8}
            y={280 + i * 10}
            width={6}
            height={4}
            fill={PASS_COLORS[i]}
            rx="1"
          />
          <text
            x={18}
            y={284 + i * 10}
            fontSize="5"
            fill="#9ca3af"
            fontFamily="monospace"
          >
            Pass {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PassPanel({ pass }: { pass: SynthesisPass }) {
  return (
    <div className="space-y-3" data-testid={`pass-panel-${pass.pass}`}>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="font-mono text-xs"
          style={{ borderColor: PASS_COLORS[pass.pass - 1], color: PASS_COLORS[pass.pass - 1] }}
        >
          PASS {pass.pass}
        </Badge>
        <span className="text-sm font-semibold">{pass.label}</span>
        <span className="ml-auto text-xs font-mono text-muted-foreground">
          conv={pass.convergenceScore.toFixed(4)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{pass.description}</p>
      <div className="grid grid-cols-1 gap-2">
        {pass.nodes.map((n) => (
          <div
            key={n.id}
            className={`rounded border p-2.5 text-xs ${THREAT_BG[n.threat]}`}
            data-testid={`spoke-node-${n.id}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground w-5">
                  #{n.id}
                </span>
                <span className="font-semibold">{n.label}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                  {n.paper}
                </Badge>
              </div>
              <span className={`text-[10px] font-mono uppercase font-bold ${THREAT_COLORS[n.threat]}`}>
                {n.threat}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{n.claim}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-mono text-muted-foreground">
                κ={n.kappa.toFixed(1)} GOS={n.gosResonance.toFixed(2)}
              </span>
              <div className="flex gap-1 flex-wrap">
                {n.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] bg-muted px-1 rounded font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpokeWheelPage() {
  const { data, isLoading, error } = useQuery<SpokeWheelResult>({
    queryKey: ["/api/oracle/spoke-wheel"],
    refetchInterval: 30_000,
    retry: 3,
    retryDelay: 2000,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm font-mono">
        <Activity className="h-4 w-4 animate-spin mr-2" />
        running 24-gon recursive synthesis…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm font-mono">
        <AlertTriangle className="h-4 w-4 mr-2" />
        spoke-wheel engine offline
      </div>
    );
  }

  const { passes, synthesis, gosConstants, spokeCount } = data;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight font-mono">
            24-GON SPOKE WHEEL
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Icositetragon Recursive Oracle Corpus · 3 Passes · {spokeCount} Spokes
          </p>
        </div>
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 font-mono text-xs" data-testid="badge-echo-threat">
          ECHO: {synthesis.echoThreat}
        </Badge>
      </div>

      {/* GOS constants bar */}
      <Card className="border-muted/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px]">
            <span className="text-muted-foreground">κ₁=<span className="text-foreground">{gosConstants.kappa1.toFixed(5)}</span></span>
            <span className="text-muted-foreground">κ₂=<span className="text-foreground">{gosConstants.kappa2.toFixed(5)}</span></span>
            <span className="text-muted-foreground">Δκ=<span className="text-foreground">{gosConstants.deltaKappa.toFixed(5)}</span></span>
            <span className="text-muted-foreground">f_c=<span className="text-foreground">{gosConstants.fc} Hz</span></span>
            <span className="text-muted-foreground">f=<span className="text-foreground">{gosConstants.freqTHz} THz</span></span>
            <span className="text-muted-foreground">sonic=<span className="text-foreground">{gosConstants.freqHz} Hz</span></span>
            <span className="text-muted-foreground">GF(53)=<span className="text-foreground">{gosConstants.gf53}</span></span>
            <span className="text-muted-foreground">κ-integral=<span className="text-red-500 font-bold">{synthesis.kappaIntegral.toFixed(4)}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Wheel SVG + synthesis side by side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG wheel */}
        <Card className="border-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Circle className="h-4 w-4 text-muted-foreground" />
              ICOSITETRAGON LATTICE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpokeWheelSVG data={data} />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {passes.map((p) => (
                <div key={p.pass} className="space-y-0.5">
                  <div className="text-[10px] font-mono" style={{ color: PASS_COLORS[p.pass - 1] }}>
                    PASS {p.pass}
                  </div>
                  <div className="text-xs font-bold">{(p.convergenceScore * 100).toFixed(1)}%</div>
                  <div className="text-[9px] text-muted-foreground">convergence</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Final synthesis */}
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Target className="h-4 w-4 text-red-500" />
              FINAL SYNTHESIS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              <span className="text-xs font-mono text-red-500 font-semibold">
                GOS LATTICE ACTIVATION: {(synthesis.gosLatticeActivation * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed" data-testid="text-synthesis-summary">
              {synthesis.summary}
            </p>
            <Separator />
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                6-Vector Passive Surveillance Chain
              </p>
              <ol className="space-y-1">
                {synthesis.vectorChain.map((v, i) => (
                  <li key={i} className="text-[11px] flex gap-2">
                    <span className="font-mono text-muted-foreground w-4 flex-shrink-0">{i + 1}.</span>
                    <span className="text-muted-foreground">{v}</span>
                  </li>
                ))}
              </ol>
            </div>
            <Separator />
            <div className="font-mono text-[10px] text-muted-foreground break-all" data-testid="text-frequency-bridge">
              {synthesis.frequencyBridge}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Papers reference */}
      <Card className="border-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            CORPUS PAPERS — 9 SOURCES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { code: "P1", abbr: "Wi-Drone", title: "Wi-Fi CSI 6-DoF Drone Tracking", metric: "26.1 cm / 0.57°" },
              { code: "P2", abbr: "Wi-Depth", title: "Wi-Fi CSI Depth Imaging", metric: "18.3 cm depth error" },
              { code: "P3", abbr: "DroneKey", title: "PHY-Layer Group Key Generation", metric: "89.5 bit/s" },
              { code: "P4", abbr: "CartoRadar", title: "mmWave RF 3D SLAM", metric: "14.1 cm trajectory error" },
              { code: "P5", abbr: "UAV-Through", title: "UAV WiFi Through-Wall 3D Imaging", metric: "±0.5 m floor-plan" },
              { code: "P6", abbr: "DroneSplat", title: "3D Gaussian Splatting for Drones", metric: "sub-10 cm / 3 passes" },
              { code: "P7", abbr: "RS-NeRF", title: "Space Target NeRF Dataset", metric: "30 cm/px satellite" },
              { code: "P8", abbr: "UE-SatEnv", title: "Satellite → UE5 Environment", metric: "navigable 3D model" },
              { code: "P9", abbr: "UE-GAS", title: "UE Gameplay Ability System", metric: "autonomous mission graph" },
            ].map((p) => (
              <div key={p.code} className="rounded border border-muted/50 p-2 text-xs" data-testid={`paper-ref-${p.code}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{p.code}</span>
                  <span className="font-semibold">{p.abbr}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">{p.title}</p>
                <p className="text-[10px] font-mono text-blue-500 mt-0.5">{p.metric}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Corpus references — GPU papers P10–P12 */}
      {data.gpuPush?.nodes && data.gpuPush.nodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {data.gpuPush.nodes.map((n, i) => (
            <div
              key={n.paper}
              className={`rounded border p-2 text-xs ${THREAT_BG[n.threat]}`}
              data-testid={`gpu-paper-${n.paper}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-mono text-[10px] text-muted-foreground">P{10 + i}</span>
                <span className="font-semibold font-mono">{n.paper}</span>
                <span className={`ml-auto text-[10px] font-mono font-bold ${THREAT_COLORS[n.threat]}`}>
                  {(n.gosResonance * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] mb-1">{n.title}</p>
              <p className="text-[10px] font-mono text-blue-500">{n.metric}</p>
            </div>
          ))}
        </div>
      )}

      {/* Three recursive pass panels */}
      {passes.map((p) => (
        <Card key={p.pass} className="border-muted/50">
          <CardContent className="pt-4">
            <PassPanel pass={p} />
          </CardContent>
        </Card>
      ))}

      {/* GPU Corpus Push — Final Synthesis */}
      {data.gpuPush && <Card className="border-orange-500/30 bg-orange-500/5" data-testid="gpu-corpus-push">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-mono tracking-widest flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            {data.gpuPush.label}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{data.gpuPush.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Individual GPU node deep-dives */}
          {data.gpuPush.nodes.map((n) => (
            <div key={n.paper} className={`rounded border p-3 space-y-2 ${THREAT_BG[n.threat]}`} data-testid={`gpu-node-${n.paper}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold">{n.paper}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{n.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-mono font-bold ${THREAT_COLORS[n.threat]}`}>
                    {(n.gosResonance * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">GOS</div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Metric · </span>
                  <span className="font-mono text-blue-500">{n.metric}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">κ-Mapping · </span>
                  <span className="text-foreground/80">{n.kappaMapping}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Renderer Role · </span>
                  <span className="text-foreground/80">{n.rendererRole}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Bit Budget · </span>
                  <span className="font-mono text-[10px] text-foreground/70">{n.bitBudget}</span>
                </div>
              </div>
            </div>
          ))}

          <Separator />

          {/* Render pipeline chain */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">6-Step GPU Render Pipeline</p>
            <ol className="space-y-1">
              {data.gpuPush.renderPipeline.map((step, i) => (
                <li key={i} className="flex gap-2 text-[11px]">
                  <span className="font-mono text-muted-foreground shrink-0">{i + 1}.</span>
                  <span className="text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <Separator />

          {/* Network budget table */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Network Budget</p>
            <div className="rounded border border-muted/40 overflow-hidden text-[11px]">
              <div className="grid grid-cols-3 bg-muted/30 font-mono text-[10px] text-muted-foreground px-2 py-1">
                <span>Component</span><span className="text-right">KB</span><span className="text-right">Method</span>
              </div>
              {data.gpuPush.budgetTable.map((row, i) => (
                <div key={i} className="grid grid-cols-3 px-2 py-0.5 border-t border-muted/30">
                  <span className="text-foreground/80">{row.component}</span>
                  <span className="font-mono text-right">{row.sizeKB.toLocaleString()}</span>
                  <span className="font-mono text-right text-muted-foreground">{row.method}</span>
                </div>
              ))}
              <div className="grid grid-cols-3 px-2 py-1 border-t border-muted/50 bg-muted/20 font-mono font-bold">
                <span>TOTAL</span>
                <span className="text-right text-green-500">
                  {data.gpuPush.budgetTable.reduce((s, r) => s + r.sizeKB, 0).toLocaleString()} KB
                </span>
                <span className="text-right text-muted-foreground">&lt; 4096 ✓</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Final memo */}
          <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-[10px] font-mono text-red-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> FINAL CORPUS MEMO
            </p>
            <p className="text-[11px] text-foreground/80 leading-relaxed">{data.gpuPush.finalMemo}</p>
          </div>
        </CardContent>
      </Card>}

      <p className="text-[10px] text-muted-foreground font-mono text-center">
        Generated {new Date(data.generatedAt).toISOString()} · KAPPA 24-GON SPOKE WHEEL v1.0 · 12 papers (P1–P12) ·{" "}
        9.6196°N 84.6282°W — Hotel Pochote Grande
      </p>
    </div>
  );
}
