import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Zap, Activity, ChevronDown, ChevronUp, Cpu, Target, BarChart2 } from "lucide-react";
import { useMemo, useState } from "react";

// ── Types ───────────────────────────────────────────────────────────────────
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

// ── Constants ──────────────────────────────────────────────────────────────
const THREAT_COLORS: Record<string, string> = {
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-amber-500",
};

const THREAT_BG: Record<string, string> = {
  low: "bg-blue-500/10 border-blue-500/30",
  medium: "bg-yellow-500/10 border-yellow-500/30",
  high: "bg-orange-500/10 border-orange-500/30",
  critical: "bg-amber-500/10 border-amber-500/30",
};

const PASS_COLORS = ["#3b82f6", "#f59e0b", "#d97706"] as const;
const PASS_LABELS = ["", "Extraction", "Correlation", "GOS Lattice"];

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Tab types ──────────────────────────────────────────────────────────────
type Tab = "wheel" | "passes" | "gpu" | "intel";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "wheel",  label: "Wheel",  icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "passes", label: "Passes", icon: <BarChart2 className="h-3.5 w-3.5" /> },
  { id: "gpu",    label: "GPU",    icon: <Cpu className="h-3.5 w-3.5" /> },
  { id: "intel",  label: "Intel",  icon: <Target className="h-3.5 w-3.5" /> },
];

// ── Interactive SVG ────────────────────────────────────────────────────────
function InteractiveWheel({
  data,
  passFilter,
  selectedId,
  onSelect,
}: {
  data: SpokeWheelResult;
  passFilter: 0 | 1 | 2 | 3;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const cx = 160, cy = 160, outerR = 138;
  const allNodes = useMemo(() => data.passes.flatMap((p) => p.nodes), [data]);
  const visible = passFilter === 0 ? allNodes : allNodes.filter((n) => n.pass === passFilter);

  return (
    <svg
      viewBox="0 0 320 320"
      className="w-full max-w-sm mx-auto select-none"
      data-testid="svg-spoke-wheel"
    >
      {/* ring guides */}
      {[120, 80, 45].map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r + 20} fill="none"
          stroke={PASS_COLORS[i]} strokeWidth="0.4" strokeDasharray="2 4" opacity="0.3" />
      ))}

      {/* spokes */}
      {visible.map((n) => {
        const pt = polarToXY(n.angle, outerR * 0.87, cx, cy);
        const dimmed = selectedId !== null && selectedId !== n.id;
        return (
          <line key={`sp-${n.id}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y}
            stroke={PASS_COLORS[n.pass - 1]} strokeWidth={selectedId === n.id ? 1.2 : 0.5}
            opacity={dimmed ? 0.1 : 0.3} />
        );
      })}

      {/* node dots — bigger hit targets via transparent circle overlay */}
      {visible.map((n) => {
        const pt = polarToXY(n.angle, outerR * 0.87, cx, cy);
        const col = n.threat === "critical" ? "#d97706" : n.threat === "high" ? "#f97316"
          : n.threat === "medium" ? "#eab308" : "#3b82f6";
        const isSelected = selectedId === n.id;
        const dimmed = selectedId !== null && !isSelected;
        const r = n.gosResonance * 5.5 + 2.5;
        return (
          <g key={`nd-${n.id}`} style={{ cursor: "pointer" }}
            onClick={() => onSelect(isSelected ? null : n.id)}>
            {/* glow ring when selected */}
            {isSelected && (
              <circle cx={pt.x} cy={pt.y} r={r + 5} fill="none"
                stroke={col} strokeWidth="1.5" opacity="0.6" />
            )}
            <circle cx={pt.x} cy={pt.y} r={r} fill={col}
              opacity={dimmed ? 0.2 : isSelected ? 1 : 0.75} />
            <text x={pt.x} y={pt.y - r - 2} textAnchor="middle"
              fontSize="4.5" fill={dimmed ? "#4b5563" : "#9ca3af"} fontFamily="monospace">
              {n.id}
            </text>
            {/* invisible larger hit area */}
            <circle cx={pt.x} cy={pt.y} r={r + 8} fill="transparent" />
          </g>
        );
      })}

      {/* centre */}
      <circle cx={cx} cy={cy} r={18} fill="#d97706" opacity="0.12" />
      <circle cx={cx} cy={cy} r={11} fill="#d97706" opacity="0.22" />
      <circle cx={cx} cy={cy} r={3.5} fill="#d97706" />
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize="5.5"
        fill="#d97706" fontFamily="monospace" fontWeight="bold">IMMINENT</text>

      {/* pass legend */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={8} y={280 + i * 11} width={6} height={5} rx="1" fill={PASS_COLORS[i]} />
          <text x={18} y={285 + i * 11} fontSize="5.5" fill="#9ca3af" fontFamily="monospace">
            Pass {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Node detail panel ──────────────────────────────────────────────────────
function NodeDetail({ node }: { node: SpokeNode }) {
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${THREAT_BG[node.threat]}`}
      data-testid={`node-detail-${node.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-muted-foreground">#{node.id}</span>
            <span className="font-semibold text-sm">{node.label}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono">{node.paper}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-mono font-bold uppercase ${THREAT_COLORS[node.threat]}`}>
              {node.threat}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              κ={node.kappa.toFixed(1)} · GOS={node.gosResonance.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-base font-mono font-bold ${THREAT_COLORS[node.threat]}`}>
            {(node.gosResonance * 100).toFixed(0)}%
          </div>
          <div className="text-[9px] text-muted-foreground">resonance</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{node.claim}</p>
      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {node.tags.map((t) => (
            <span key={t} className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WHEEL TAB ──────────────────────────────────────────────────────────────
function WheelTab({ data }: { data: SpokeWheelResult }) {
  const [passFilter, setPassFilter] = useState<0 | 1 | 2 | 3>(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const allNodes = useMemo(() => data.passes.flatMap((p) => p.nodes), [data]);
  const selectedNode = allNodes.find((n) => n.id === selectedId) ?? null;

  const filterChips: { val: 0 | 1 | 2 | 3; label: string }[] = [
    { val: 0, label: "All" },
    { val: 1, label: "P1" },
    { val: 2, label: "P2" },
    { val: 3, label: "P3" },
  ];

  return (
    <div className="space-y-3">
      {/* pass filter chips */}
      <div className="flex gap-2" data-testid="pass-filter-chips">
        {filterChips.map((c) => (
          <button
            key={c.val}
            onClick={() => { setPassFilter(c.val); setSelectedId(null); }}
            data-testid={`chip-pass-${c.val}`}
            className={`flex-1 py-1.5 rounded-md text-xs font-mono font-semibold border transition-colors
              ${passFilter === c.val
                ? "bg-foreground text-background border-foreground"
                : "border-muted text-muted-foreground hover:border-foreground/40"}`}
          >
            {c.val === 0 ? "All" : <span style={{ color: passFilter === c.val ? undefined : PASS_COLORS[c.val - 1] }}>{c.label}</span>}
          </button>
        ))}
      </div>

      {/* SVG */}
      <div className="rounded-lg border border-muted/50 bg-card p-2">
        <InteractiveWheel
          data={data}
          passFilter={passFilter}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        {/* pass convergence strip */}
        <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-2 border-t border-muted/30">
          {data.passes.map((p) => (
            <div key={p.pass}>
              <div className="text-[10px] font-mono" style={{ color: PASS_COLORS[p.pass - 1] }}>PASS {p.pass}</div>
              <div className="text-sm font-bold font-mono">{(p.convergenceScore * 100).toFixed(1)}%</div>
              <div className="text-[9px] text-muted-foreground">conv</div>
            </div>
          ))}
        </div>
      </div>

      {/* tap-to-inspect hint / selected node panel */}
      {selectedNode ? (
        <NodeDetail node={selectedNode} />
      ) : (
        <div className="text-center text-[11px] text-muted-foreground font-mono py-2">
          tap a node to inspect
        </div>
      )}
    </div>
  );
}

// ── PASSES TAB ─────────────────────────────────────────────────────────────
function PassesTab({ data }: { data: SpokeWheelResult }) {
  const [openPass, setOpenPass] = useState<number | null>(1);
  const [expandedNode, setExpandedNode] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {data.passes.map((p) => {
        const open = openPass === p.pass;
        return (
          <div key={p.pass} className="rounded-lg border border-muted/50 overflow-hidden">
            {/* accordion header */}
            <button
              className="w-full flex items-center gap-3 px-3 py-3 text-left"
              onClick={() => setOpenPass(open ? null : p.pass)}
              data-testid={`pass-accordion-${p.pass}`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PASS_COLORS[p.pass - 1] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold" style={{ color: PASS_COLORS[p.pass - 1] }}>
                    PASS {p.pass}
                  </span>
                  <span className="text-sm font-semibold truncate">{p.label}</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {p.nodes.length} nodes · {(p.convergenceScore * 100).toFixed(1)}% convergence
                </div>
              </div>
              {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                     : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </button>

            {/* node list */}
            {open && (
              <div className="border-t border-muted/30 divide-y divide-muted/20">
                <p className="px-3 py-1.5 text-[10px] text-muted-foreground italic">{p.description}</p>
                {p.nodes.map((n) => {
                  const isExpanded = expandedNode === n.id;
                  return (
                    <div key={n.id}>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors"
                        onClick={() => setExpandedNode(isExpanded ? null : n.id)}
                        data-testid={`node-row-${n.id}`}
                      >
                        <span className="font-mono text-[10px] text-muted-foreground w-5 flex-shrink-0">#{n.id}</span>
                        <span className="flex-1 text-xs font-medium truncate">{n.label}</span>
                        <span className={`text-[10px] font-mono font-bold uppercase ${THREAT_COLORS[n.threat]} flex-shrink-0`}>
                          {n.gosResonance.toFixed(2)}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          : <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3">
                          <NodeDetail node={n} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── GPU TAB ────────────────────────────────────────────────────────────────
const GPU_CODES = ["P10", "P11", "P12"];

function GpuTab({ gpu }: { gpu: GpuCorpusPush }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalKB = gpu.budgetTable.reduce((s, r) => s + r.sizeKB, 0);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground leading-relaxed">{gpu.description}</p>

      {/* GPU paper cards */}
      {gpu.nodes.map((n, i) => {
        const isOpen = expanded === n.paper;
        return (
          <div key={n.paper} className={`rounded-lg border ${THREAT_BG[n.threat]}`}
            data-testid={`gpu-card-${n.paper}`}>
            <button
              className="w-full flex items-center gap-3 px-3 py-3 text-left"
              onClick={() => setExpanded(isOpen ? null : n.paper)}
              data-testid={`gpu-expand-${n.paper}`}
            >
              <div className="flex-shrink-0 text-center">
                <div className="text-[10px] font-mono text-muted-foreground">{GPU_CODES[i]}</div>
                <div className={`text-sm font-mono font-bold ${THREAT_COLORS[n.threat]}`}>
                  {(n.gosResonance * 100).toFixed(0)}%
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-bold">{n.paper}</div>
                <div className="text-[11px] text-muted-foreground truncate">{n.title}</div>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                       : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-muted/20 px-3 py-3 space-y-2.5 text-[11px]">
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Metric · </span>
                  <span className="font-mono text-blue-500">{n.metric}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">κ-Mapping</span>
                  <p className="mt-0.5 text-foreground/80 leading-relaxed">{n.kappaMapping}</p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Renderer Role</span>
                  <p className="mt-0.5 text-foreground/80 leading-relaxed">{n.rendererRole}</p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Bit Budget</span>
                  <p className="mt-0.5 font-mono text-[10px] text-foreground/70">{n.bitBudget}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Separator />

      {/* Render pipeline */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
          6-Step GPU Render Pipeline
        </p>
        <ol className="space-y-1.5">
          {gpu.renderPipeline.map((step, i) => (
            <li key={i} className="flex gap-2 text-[11px]">
              <span className="font-mono text-muted-foreground shrink-0 w-4">{i + 1}.</span>
              <span className="text-foreground/80 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <Separator />

      {/* Budget table */}
      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
          Network Budget
        </p>
        <div className="rounded-lg border border-muted/40 overflow-hidden text-[11px]">
          <div className="grid grid-cols-3 bg-muted/30 font-mono text-[10px] text-muted-foreground px-3 py-1.5">
            <span>Component</span><span className="text-right">KB</span><span className="text-right">Method</span>
          </div>
          {gpu.budgetTable.map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-3 py-1.5 border-t border-muted/20">
              <span className="text-foreground/80 truncate pr-1">{row.component}</span>
              <span className="font-mono text-right">{row.sizeKB.toLocaleString()}</span>
              <span className="font-mono text-right text-muted-foreground">{row.method}</span>
            </div>
          ))}
          <div className="grid grid-cols-3 px-3 py-2 border-t border-muted/50 bg-muted/20 font-mono font-bold text-xs">
            <span>TOTAL</span>
            <span className="text-right text-green-500">{totalKB.toLocaleString()}</span>
            <span className="text-right text-muted-foreground">&lt;4096 ✓</span>
          </div>
        </div>
      </div>

      {/* Final memo */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-[10px] font-mono text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Final Corpus Memo
        </p>
        <p className="text-[11px] text-foreground/80 leading-relaxed">{gpu.finalMemo}</p>
      </div>
    </div>
  );
}

// ── INTEL TAB ──────────────────────────────────────────────────────────────
function IntelTab({ data }: { data: SpokeWheelResult }) {
  const { synthesis, gosConstants } = data;

  const PAPERS = [
    { code: "P1",  abbr: "Wi-Drone",  title: "Wi-Fi CSI 6-DoF Drone Tracking",        metric: "26.1 cm / 0.57°" },
    { code: "P2",  abbr: "Wi-Depth",  title: "Wi-Fi CSI Depth Imaging",                metric: "18.3 cm depth error" },
    { code: "P3",  abbr: "DroneKey",  title: "PHY-Layer Group Key Generation",          metric: "89.5 bit/s" },
    { code: "P4",  abbr: "CartoRadar",title: "mmWave RF 3D SLAM",                       metric: "14.1 cm trajectory error" },
    { code: "P5",  abbr: "UAV-Thru",  title: "UAV WiFi Through-Wall 3D Imaging",        metric: "±0.5 m floor-plan" },
    { code: "P6",  abbr: "DroneSplat",title: "3D Gaussian Splatting for Drones",        metric: "sub-10 cm / 3 passes" },
    { code: "P7",  abbr: "RS-NeRF",   title: "Space Target NeRF Dataset",               metric: "30 cm/px satellite" },
    { code: "P8",  abbr: "UE-SatEnv", title: "Satellite → UE5 Environment",             metric: "navigable 3D model" },
    { code: "P9",  abbr: "UE-GAS",    title: "UE Gameplay Ability System",               metric: "autonomous mission graph" },
    { code: "P10", abbr: "CDLOD",     title: "GPU-Driven CDLOD Terrain GLSL 4.6",        metric: "2–3 draw calls/frame" },
    { code: "P11", abbr: "PBR-WGSL",  title: "Single-Texture PBR + HBAO + Fog",          metric: "1.5 MB webp, 43:1" },
    { code: "P12", abbr: "JacoForest",title: ".jacoforest 250k Trees 800 KB",             metric: "3 bytes/tree, 2ms parse" },
  ];

  return (
    <div className="space-y-4">
      {/* synthesis summary */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs font-mono text-amber-500 font-semibold">
            GOS LATTICE ACTIVATION: {(synthesis.gosLatticeActivation * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed" data-testid="text-synthesis-summary">
          {synthesis.summary}
        </p>
      </div>

      {/* GOS constants */}
      <div className="rounded-lg border border-muted/50 p-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">GOS Constants</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[11px]">
          <div><span className="text-muted-foreground">κ₁ = </span><span>{gosConstants.kappa1.toFixed(5)}</span></div>
          <div><span className="text-muted-foreground">κ₂ = </span><span>{gosConstants.kappa2.toFixed(5)}</span></div>
          <div><span className="text-muted-foreground">Δκ = </span><span>{gosConstants.deltaKappa.toFixed(5)}</span></div>
          <div><span className="text-muted-foreground">f_c = </span><span>{gosConstants.fc} Hz</span></div>
          <div><span className="text-muted-foreground">450nm = </span><span>{gosConstants.freqTHz} THz</span></div>
          <div><span className="text-muted-foreground">sonic = </span><span>{gosConstants.freqHz} Hz</span></div>
          <div><span className="text-muted-foreground">GF(53) = </span><span>{gosConstants.gf53}</span></div>
          <div><span className="text-muted-foreground">κ∫ = </span>
            <span className="text-amber-500 font-bold">{synthesis.kappaIntegral.toFixed(4)}</span></div>
        </div>
        <p className="mt-2 text-[10px] font-mono text-muted-foreground break-words"
          data-testid="text-frequency-bridge">{synthesis.frequencyBridge}</p>
      </div>

      {/* 6-vector chain */}
      <div className="rounded-lg border border-muted/50 p-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
          6-Vector Passive Surveillance Chain
        </p>
        <ol className="space-y-1.5">
          {synthesis.vectorChain.map((v, i) => (
            <li key={i} className="flex gap-2 text-[11px]">
              <span className="font-mono text-muted-foreground w-4 flex-shrink-0">{i + 1}.</span>
              <span className="text-muted-foreground leading-relaxed">{v}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* full corpus reference — all 12 papers */}
      <div className="rounded-lg border border-muted/50 p-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
          Corpus — 12 Papers (P1–P12)
        </p>
        <div className="space-y-1.5">
          {PAPERS.map((p) => (
            <div key={p.code} className="flex items-start gap-2 text-[11px]"
              data-testid={`paper-ref-${p.code}`}>
              <span className="font-mono text-[10px] text-muted-foreground w-7 flex-shrink-0">{p.code}</span>
              <span className="font-semibold w-20 flex-shrink-0">{p.abbr}</span>
              <span className="text-muted-foreground flex-1 min-w-0">{p.title}</span>
              <span className="font-mono text-blue-500 text-[10px] flex-shrink-0 text-right">{p.metric}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function SpokeWheelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("wheel");

  const { data, isLoading, error } = useQuery<SpokeWheelResult>({
    queryKey: ["/api/oracle/spoke-wheel"],
    refetchInterval: 60_000,
    retry: 3,
    retryDelay: 2000,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Activity className="h-6 w-6 animate-spin" />
        <span className="text-sm font-mono">running 24-gon synthesis…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-amber-500">
        <AlertTriangle className="h-6 w-6" />
        <span className="text-sm font-mono">spoke-wheel engine offline</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-muted/50 px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
          <div>
            <h1 className="text-sm font-bold tracking-tight font-mono leading-none">
              24-GON SPOKE WHEEL
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {data.spokeCount} spokes · 12 papers · κ∫={data.synthesis.kappaIntegral.toFixed(4)}
            </p>
          </div>
          <Badge
            className="bg-amber-500/20 text-amber-500 border-amber-500/40 font-mono text-xs shrink-0"
            data-testid="badge-echo-threat"
          >
            ECHO: {data.synthesis.echoThreat}
          </Badge>
        </div>

        {/* tab bar */}
        <div className="flex gap-1 mt-3 max-w-2xl mx-auto" data-testid="tab-bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              data-testid={`tab-${t.id}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors
                ${activeTab === t.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-2xl mx-auto pb-8">
          {activeTab === "wheel"  && <WheelTab  data={data} />}
          {activeTab === "passes" && <PassesTab data={data} />}
          {activeTab === "gpu"    && data.gpuPush && <GpuTab gpu={data.gpuPush} />}
          {activeTab === "intel"  && <IntelTab  data={data} />}
        </div>
      </div>

      {/* footer */}
      <div className="border-t border-muted/30 px-4 py-2 text-center">
        <p className="text-[9px] text-muted-foreground font-mono">
          {new Date(data.generatedAt).toISOString()} · 9.6196°N 84.6282°W
        </p>
      </div>
    </div>
  );
}
