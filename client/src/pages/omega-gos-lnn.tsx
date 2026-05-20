import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Activity, CheckCircle2, XCircle, Clock, Zap,
  RefreshCw, Radio, Waves, Atom, FlaskConical, Eye,
  TrendingUp, AlertTriangle, Cpu,
} from "lucide-react";

// ── Biological constants (display only, real values in engine) ───────────────
const BIO_INVARIANTS = [
  { id: 1, symbol: "7/4",  label: "NAQT ratio",             value: "1.7500",  origin: "FMO complex — 7 chromophores, 4 primary couplings",   color: "text-cyan-500" },
  { id: 2, symbol: "κ₁",   label: "Holographic compression", value: "1.2732",  origin: "4/π — circle-square projection (eye lens, membrane)",  color: "text-purple-500" },
  { id: 3, symbol: "κ₂",   label: "Europa clamp",            value: "1.4346",  origin: "φ^(3/4) — golden-ratio expansion (phyllotaxis)",       color: "text-blue-500" },
  { id: 4, symbol: "Ω",    label: "Vacuum impedance",        value: "0.5671",  origin: "Lambert W(1) — spinor closure / mitochondrial proton",  color: "text-amber-500" },
  { id: 5, symbol: "φ",    label: "Golden ratio",            value: "1.6180",  origin: "Phyllotaxis, microtubule packing",                     color: "text-green-500" },
  { id: 6, symbol: "D",    label: "Dodecahedral constant",   value: "1.2584",  origin: "√(15-6√5) — 24-cell projection / microtubule geom",    color: "text-rose-500" },
  { id: 7, symbol: "f_c",  label: "Planetary carrier",       value: "8.392 Hz",origin: "κ₁·κ₂/(π·φ) — Earth-ionosphere cavity ref",           color: "text-orange-500" },
];

const DOMAIN_COLORS: Record<string, string> = {
  FLIGHT:    "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  SATELLITE: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  WEATHER:   "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  RF:        "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  SEISMIC:   "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  NETWORK:   "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  ELF:       "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  WIFI:      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  BLE:       "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const ACOUSTIC_SITES = [
  "Phaistos","Giza","Newgrange","Lascaux","HalSaflieni","Chavin","Palenque",
  "Stonehenge","Teotihuacan","MaltaTemples","Durrington","GobeklTepe",
  "Derinkuyu","Catalhoyuk","ElCastillo"
];
const ACOUSTIC_HZ: Record<string, number> = {
  Phaistos:145.309, Giza:299.936, Newgrange:110.0, Lascaux:92.5,
  HalSaflieni:111.0, Chavin:220.0, Palenque:136.1, Stonehenge:108.0,
  Teotihuacan:183.5, MaltaTemples:110.0, Durrington:73.3, GobeklTepe:37.0,
  Derinkuyu:150.0, Catalhoyuk:88.0, ElCastillo:63.5
};

function statusColor(s: string) {
  if (s === "confirmed") return "text-green-600 dark:text-green-400";
  if (s === "expired" || s === "failed") return "text-amber-500 dark:text-amber-400";
  return "text-amber-500 dark:text-amber-400";
}
function statusIcon(s: string) {
  if (s === "confirmed") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (s === "expired" || s === "failed") return <XCircle className="w-3.5 h-3.5 text-amber-500" />;
  return <Clock className="w-3.5 h-3.5 text-amber-500" />;
}

// ── Latent heatmap (9×7 grid of 63 neurons) ────────────────────────────────
function LatentHeatmap({ z }: { z: number[] }) {
  if (!z || z.length < 63) return null;
  const max = Math.max(...z.map(Math.abs), 0.001);
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(9, 1fr)" }}>
      {Array.from({ length: 9 }, (_, tile) =>
        Array.from({ length: 7 }, (_, i) => {
          const val = z[tile * 7 + i] / max;
          const r = val > 0 ? Math.round(val * 255) : 0;
          const b = val < 0 ? Math.round(-val * 255) : 0;
          const g = Math.round(Math.abs(val) * 120);
          return (
            <div
              key={`${tile}-${i}`}
              className="rounded-sm"
              style={{ width: "100%", aspectRatio: "1", backgroundColor: `rgb(${r},${g},${b})`, opacity: 0.8 + Math.abs(val) * 0.2 }}
              title={`Tile ${tile} dim ${i}: ${z[tile*7+i].toFixed(4)}`}
            />
          );
        })
      )}
    </div>
  );
}

// ── Phase arc ───────────────────────────────────────────────────────────────
function PhaseArc({ phase, label, color }: { phase: number; label: string; color: string }) {
  const angle = phase * 180 / Math.PI;
  const x = 28 + 20 * Math.cos(phase);
  const y = 28 + 20 * Math.sin(phase);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="56" height="56" className="opacity-90">
        <circle cx="28" cy="28" r="20" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
        <circle cx="28" cy="28" r="3" fill={color} />
        <line x1="28" y1="28" x2={x} y2={y} stroke={color} strokeWidth="1.5" />
        <circle cx={x} cy={y} r="2" fill={color} />
      </svg>
      <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
      <span className="text-[9px] font-mono" style={{ color }}>{angle.toFixed(0)}°</span>
    </div>
  );
}

export default function OmegaGOSLNNPage() {
  const stateQ = useQuery<any>({
    queryKey: ["/api/omega-gos/state"],
    refetchInterval: 5000,
  });
  const predsQ = useQuery<any>({
    queryKey: ["/api/omega-gos/predictions"],
    refetchInterval: 5000,
  });

  const feedbackMut = useMutation({
    mutationFn: ({ predId, outcome }: { predId: string; outcome: "confirmed" | "failed" }) =>
      apiRequest("POST", "/api/omega-gos/feedback", { predId, outcome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/omega-gos/predictions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/omega-gos/state"] });
    },
  });

  const s = stateQ.data;
  const predictions = predsQ.data?.predictions ?? [];
  const consts = s?.constants ?? {};
  const site = s?.siteIdx != null ? ACOUSTIC_SITES[s.siteIdx] : "—";
  const siteHz = ACOUSTIC_HZ[site] ?? 0;
  const pending = predictions.filter((p: any) => p.status === "pending");
  const confirmed = predictions.filter((p: any) => p.status === "confirmed");
  const totalAcc = s ? Math.round(s.totalAccuracy * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Atom className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Ω-GOS 7/4 LNN Hypervisor</h1>
            <p className="text-xs text-muted-foreground">Liquid Neural Network · Biologically-Evolved · Self-Learning · Phase-Locked</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {s?.running ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse inline-block" />
              RUNNING — cycle #{s?.cycleCount ?? 0}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">STOPPED</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/omega-gos/state"] });
            queryClient.invalidateQueries({ queryKey: ["/api/omega-gos/predictions"] });
          }}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Biological Invariants */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-500" />
                Biological Invariants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {BIO_INVARIANTS.map(inv => (
                <div key={inv.id} className="flex items-start gap-2 text-xs">
                  <div className={`font-mono font-bold w-8 shrink-0 ${inv.color}`}>{inv.symbol}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{inv.label}</span>
                      <span className={`font-mono font-semibold ${inv.color}`}>{inv.value}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 truncate">{inv.origin}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Acoustic site + Demodex clock */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-500" />
                Phase Lock Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Acoustic site</span>
                <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{site} — {siteHz.toFixed(2)} Hz</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Planetary carrier f_c</span>
                <span className="font-mono text-orange-500">8.392 Hz</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Schumann beat (Ω-Hz)</span>
                <span className="font-mono text-purple-500">0.562 Hz</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Dodecahedral lock</span>
                <span className="font-mono text-rose-500">431.56 Hz</span>
              </div>
              <div className="border-t pt-2 mt-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Demodex 14.4-day clock</span>
                  <span className="font-mono text-amber-500">Day {s?.demodexDay?.toFixed(2) ?? "—"} / 14.4</span>
                </div>
                <Progress value={s ? (s.demodexPhase * 100) : 0} className="h-1.5" />
                <div className="text-[10px] text-muted-foreground/60 mt-1">
                  {s?.demodexPhase > 0.49 && s?.demodexPhase < 0.52
                    ? "⚡ Klein twist active — 128.23° reset"
                    : s?.demodexPhase > 0.98 || s?.demodexPhase < 0.02
                    ? "🔄 Topological permutation — Demodex lifecycle reset"
                    : "Demodex lifecycle cycling normally"}
                </div>
              </div>
              <div className="flex gap-4 justify-center pt-1">
                <PhaseArc phase={s?.carrierPhase ?? 0}  label="8.392 Hz" color="#f97316" />
                <PhaseArc phase={s?.gearSaros ?? 0}     label="Saros"    color="#a855f7" />
                <PhaseArc phase={s?.gearMetonic ?? 0}   label="Metonic"  color="#3b82f6" />
              </div>
            </CardContent>
          </Card>

          {/* Learning metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Self-Learning Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Overall accuracy</span>
                <span className="font-mono font-semibold">{totalAcc}%</span>
              </div>
              <Progress value={totalAcc} className="h-2 mb-3" />
              <div className="text-xs text-muted-foreground mb-2">
                Events ingested: <span className="font-mono text-foreground">{s?.eventsSeen ?? 0}</span>
                &nbsp;·&nbsp; Predictions: <span className="font-mono text-foreground">{predictions.length}</span>
                &nbsp;·&nbsp; Confirmed: <span className="font-mono text-green-500">{confirmed.length}</span>
              </div>
              <div className="space-y-1.5">
                {s && Object.entries(s.domainLearn ?? {}).map(([domain, learn]: [string, any]) => (
                  <div key={domain} className="flex items-center gap-2 text-[11px]">
                    <span className="font-mono w-16 shrink-0 text-muted-foreground">{domain}</span>
                    <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round(learn.accuracy * 100)}%`,
                          background: learn.accuracy > 0.7 ? "#22c55e" : learn.accuracy > 0.4 ? "#f59e0b" : "#d97706"
                        }}
                      />
                    </div>
                    <span className="font-mono w-8 text-right text-muted-foreground">{Math.round(learn.accuracy * 100)}%</span>
                    <span className="font-mono w-10 text-right text-muted-foreground/60" title="coupling scale">×{learn.couplingScale?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Center column ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Latent state heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" />
                Latent State z(t) — 9×7 FMO Tiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground mb-2 flex gap-4">
                <span>Red = +excitation</span><span>Blue = -inhibition</span>
                <span className="ml-auto font-mono">|z| = {s?.latentZ ? Math.sqrt(s.latentZ.reduce((a: number, v: number) => a + v*v, 0)).toFixed(4) : "—"}</span>
              </div>
              <LatentHeatmap z={s?.latentZ ?? []} />
              <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1">
                {["FLIGHT","SATELLITE","WEATHER","RF","SEISMIC","NETWORK","ELF","WIFI","BLE"].map((d, i) => {
                  const slice = s?.latentZ?.slice(i*7, i*7+7) ?? [];
                  const proj = slice.reduce((a: number, v: number) => a + v, 0) / 7;
                  return (
                    <div key={d} className="flex items-center gap-1 text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: proj > 0.1 ? "#22c55e" : proj < -0.1 ? "#d97706" : "#6b7280" }} />
                      <span className="text-muted-foreground">{d}</span>
                      <span className="font-mono ml-auto">{proj.toFixed(3)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ODE description */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                LNN ODE — Continuous Depth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="font-mono text-[10px] bg-muted rounded-md p-3 leading-relaxed">
                <div className="text-foreground font-semibold mb-1">dz/dt = κ₁·tanh(W·p(t)) - κ₂·C·z + 7/4·ξ(t)</div>
                <div>z(t) ∈ ℝ⁶³  — latent state (9 FMO tiles × 7 dims)</div>
                <div>C = block-diag(H₇, …) × NAQT  — FMO Hamiltonian</div>
                <div>p(t) = prompt embedding from KAPPA events</div>
                <div>ξ(t) ~ N(0,1) × 7/4  — noise-assisted transport</div>
                <div className="mt-1 text-muted-foreground/70">Phase mod = cos(f_site·t + 7/4) × Demodex × Antikythera × cos(f_c·t) × cos(0.562·t)</div>
              </div>
              <div className="font-mono text-[10px] bg-muted rounded-md p-3">
                <div className="text-foreground font-semibold mb-1">Self-learning update rule:</div>
                <div>α_domain ← α × 0.9 + 1.0 × 0.1   (on confirm)</div>
                <div>κ₂_domain ← κ₂ × (1 + 0.02·κ₁)  (coupling reward)</div>
                <div>α_domain ← α × 0.85              (on expire)</div>
                <div>κ₂_domain ← κ₂ × 0.98            (coupling decay)</div>
              </div>
              <div className="flex gap-2 text-[10px]">
                {[["κ₁",consts.kappa1,"text-purple-500"],["κ₂",consts.kappa2,"text-blue-500"],["φ",consts.phi,"text-green-500"],["Ω",consts.omega,"text-amber-500"]].map(([sym,val,col]) => (
                  <div key={sym as string} className="flex-1 bg-muted rounded px-2 py-1 text-center">
                    <div className={`font-mono font-bold ${col}`}>{sym}</div>
                    <div className="font-mono text-muted-foreground">{typeof val === "number" ? val.toFixed(4) : "—"}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Live predictions */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-500" />
                Forward Predictions
                <Badge variant="outline" className="ml-auto text-[10px] text-amber-500 border-amber-500/30">{pending.length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-2 pr-1">
              {predictions.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-8">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-40" />
                  Engine warming up — first predictions in ~30 seconds
                </div>
              )}
              {predictions.map((pred: any) => (
                <div key={pred.id} className="border rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {statusIcon(pred.status)}
                    <Badge variant="outline" className={`text-[10px] ${DOMAIN_COLORS[pred.domain] ?? ""}`}>{pred.domain}</Badge>
                    <span className={`text-[10px] font-mono ml-auto ${statusColor(pred.status)}`}>{pred.status.toUpperCase()}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-tight">{pred.description}</div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>conf <span className="font-mono text-foreground">{Math.round(pred.confidence * 100)}%</span></span>
                    <span>±{Math.round(pred.horizonMs / 60000)}min</span>
                    <span className="truncate max-w-[80px]" title={pred.siteUsed}>{pred.siteUsed}</span>
                    <span className="font-mono">{ACOUSTIC_HZ[pred.siteUsed]?.toFixed(0)}Hz</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round(pred.confidence * 100)}%` }} />
                    </div>
                    {pred.becLevel != null && (
                      <span className="text-[10px] font-mono text-purple-400 ml-1">|ψ|²={Math.round(pred.becLevel*100)}%</span>
                    )}
                  </div>
                  {pred.status === "pending" && (
                    <div className="flex gap-1 pt-0.5" data-testid={`pred-actions-${pred.id}`}>
                      <Button
                        size="sm" variant="outline"
                        className="h-5 text-[10px] px-2 border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                        onClick={() => feedbackMut.mutate({ predId: pred.id, outcome: "confirmed" })}
                        data-testid={`btn-confirm-${pred.id}`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Confirm
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-5 text-[10px] px-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => feedbackMut.mutate({ predId: pred.id, outcome: "failed" })}
                        data-testid={`btn-fail-${pred.id}`}
                      >
                        <XCircle className="w-2.5 h-2.5 mr-1" />Fail
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Engine log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Autonomous Engine Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-[10px] space-y-0.5 max-h-56 overflow-y-auto text-muted-foreground">
                {(s?.log ?? []).map((line: string, i: number) => (
                  <div key={i} className={
                    line.includes("CONFIRM") ? "text-green-600 dark:text-green-400" :
                    line.includes("PREDICT") ? "text-amber-500" :
                    line.includes("EXPIRED") || line.includes("ERR") ? "text-amber-500" :
                    line.includes("Acoustic") ? "text-cyan-500" :
                    "text-muted-foreground"
                  }>
                    {line}
                  </div>
                ))}
                {(s?.log ?? []).length === 0 && <div className="text-muted-foreground/50 py-4 text-center">Awaiting first cycle…</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
