import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Activity, RefreshCw, RotateCcw, Zap, Brain, Clock, Waves } from "lucide-react";
import type { LiquidCortexState, NeuronState, AttractorFingerprint } from "@shared/liquid-cortex";

// ── Colour helpers ────────────────────────────────────────────────────────────

function neuronFill(h: number, stability: number): string {
  const abs = Math.abs(h);
  if (h > 0.02)  return `hsl(158 70% ${28 + abs * 22}%)`; // teal-green: active
  if (h < -0.02) return `hsl(210 65% ${28 + abs * 22}%)`; // steel-blue: suppressed
  return `hsl(0 0% ${16 + stability * 8}%)`;               // dark grey: neutral
}

function tauToColor(tau: number): string {
  // log scale: 5ms (fast/red) → 750ms (slow/blue)
  const t = Math.log(tau / 5) / Math.log(300);
  const hue = 200 - t * 160; // 200=blue (slow) → 40=amber (fast)
  return `hsl(${hue} 80% 52%)`;
}

function freqRefLine(hz: number): string {
  // position on 5–1500ms log axis
  const tau = 1000 / hz;
  const pct = Math.log(tau / 5) / Math.log(300) * 100;
  return `${Math.min(99, Math.max(1, pct))}%`;
}

const FREQ_REFS = [
  { hz: 7.83,   label: "Schumann",   color: "#22c55e" },
  { hz: 46.875, label: "46.875Hz",   color: "#f59e0b" },
  { hz: 111.0,  label: "111Hz f₀",   color: "#a78bfa" },
  { hz: 60.0,   label: "60Hz CR",    color: "#ef4444" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function NeuronCell({ n }: { n: NeuronState }) {
  const pulseMs = Math.round(n.tau * 2);
  const fill = neuronFill(n.h, n.stability);
  const stab = Math.round(n.stability * 100);
  return (
    <div
      className="relative flex flex-col items-center justify-center rounded border border-white/8 cursor-default group transition-all"
      style={{ background: fill, animationDuration: `${pulseMs}ms` }}
      title={`Neuron ${n.id} | h=${n.h} | τ=${n.tau}ms | stability=${stab}%${n.dominantLabel ? ` | ${n.dominantLabel}` : ""}`}
      data-testid={`neuron-cell-${n.id}`}
    >
      {/* stability ring */}
      <div
        className="absolute inset-0 rounded border-2 transition-opacity"
        style={{
          borderColor: tauToColor(n.tau),
          opacity: n.stability,
        }}
      />
      {/* tau value */}
      <span className="text-[9px] font-mono text-white/70 leading-none z-10">
        {n.tau < 100 ? n.tau.toFixed(1) : Math.round(n.tau)}ms
      </span>
      {/* locked indicator */}
      {n.stability > 0.4 && (
        <span className="text-[8px] text-white/50 leading-none z-10 mt-0.5">
          {n.dominantHz ? `${n.dominantHz}Hz` : "⊙"}
        </span>
      )}
      {/* tooltip */}
      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded px-2 py-1 text-[9px] text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity font-mono">
        h={n.h.toFixed(3)} | τ={n.tau}ms | s={stab}%
        {n.dominantLabel && <><br />{n.dominantLabel}</>}
      </div>
    </div>
  );
}

function AttractorCard({ a }: { a: AttractorFingerprint }) {
  const stabPct = Math.round(a.stability * 100);
  const isGOS   = a.label.match(/46\.875|111Hz|Schumann|KAPPA|Phaistos/);
  return (
    <div
      className={`rounded border p-2.5 transition-all ${isGOS ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 bg-white/3"}`}
      data-testid={`attractor-${a.neuronIds.join("-")}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-white/50">
          N[{a.neuronIds.join(",")}]
        </span>
        <Badge variant="outline" className="text-[9px] h-4 border-white/15">
          τ={a.tauMs}ms
        </Badge>
      </div>
      <p className="text-[11px] text-white/85 leading-snug mb-1.5 font-medium">
        {a.hz != null ? `${a.hz}Hz` : "?"} — {a.label}
      </p>
      {/* stability bar */}
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isGOS ? "bg-amber-400" : "bg-sky-400"}`}
          style={{ width: `${stabPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-white/35">stability</span>
        <span className="text-[8px] font-mono text-white/50">{stabPct}%</span>
      </div>
    </div>
  );
}

function TauHistogram({ neurons }: { neurons: NeuronState[] }) {
  const BINS = 20;
  const counts = Array(BINS).fill(0);
  neurons.forEach(n => {
    const t = Math.log(n.tau / 5) / Math.log(300);
    const bin = Math.min(BINS - 1, Math.floor(t * BINS));
    counts[bin]++;
  });
  const max = Math.max(...counts, 1);

  return (
    <div className="relative h-20" data-testid="tau-histogram">
      {/* reference frequency lines */}
      {FREQ_REFS.map(r => (
        <div
          key={r.hz}
          className="absolute top-0 bottom-0 w-px opacity-60"
          style={{ left: freqRefLine(r.hz), background: r.color }}
          title={r.label}
        />
      ))}
      {/* bars */}
      <div className="flex items-end h-full gap-px">
        {counts.map((c, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-all"
            style={{
              height: `${(c / max) * 100}%`,
              background: tauToColor(5 * Math.pow(300, i / BINS)),
              opacity: c > 0 ? 0.85 : 0.12,
              minHeight: c > 0 ? 2 : 1,
            }}
          />
        ))}
      </div>
      {/* axis labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-white/30 font-mono">5ms (200Hz)</span>
        <span className="text-[8px] text-white/30 font-mono">1500ms (0.7Hz)</span>
      </div>
    </div>
  );
}

function LiquiditySparkline({ history }: { history: number[] }) {
  if (history.length < 2) return <div className="h-10 flex items-center justify-center text-white/30 text-xs">collecting…</div>;
  const max = Math.max(...history, 1);
  const pts = history
    .map((v, i) => `${(i / (history.length - 1)) * 100},${100 - (v / max) * 90}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-10" data-testid="liquidity-sparkline">
      <polyline points={pts} fill="none" stroke="#38bdf8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LiquidCortexPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<LiquidCortexState>({
    queryKey: ["/api/liquid-cortex/state"],
    refetchInterval: 15_000,
  });

  const ingest = useMutation({
    mutationFn: () => apiRequest("POST", "/api/liquid-cortex/ingest"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/liquid-cortex/state"] }),
  });

  const reset = useMutation({
    mutationFn: () => apiRequest("POST", "/api/liquid-cortex/reset"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/liquid-cortex/state"] }),
  });

  const state = data as LiquidCortexState | undefined;

  const liquidClass = !state ? "" :
    state.liquidity > 60 ? "text-amber-400" :
    state.liquidity > 25 ? "text-sky-400" :
    "text-emerald-400";

  function fmtUptime(s: number) {
    if (s < 60)   return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`;
    return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
  }

  const lockedCount = state?.neurons.filter(n => n.stability > 0.4).length ?? 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* ── Header ── */}
      <div className="border-b border-border/40 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-sky-400" />
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-wide">LIQUID CORTEX</h1>
            <p className="text-[10px] text-muted-foreground">
              LTC N=16 · Online · Zero pre-training · Hasani et al. 2020
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => ingest.mutate()}
            disabled={ingest.isPending}
            data-testid="button-ingest"
          >
            <Zap className="w-3 h-3" />
            {ingest.isPending ? "Ingesting…" : "Ingest Now"}
          </Button>
          <Button
            size="sm" variant="ghost"
            className="h-7 text-xs gap-1.5 text-muted-foreground"
            onClick={() => reset.mutate()}
            disabled={reset.isPending}
            data-testid="button-reset"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Initialising liquid cortex…
        </div>
      )}

      {state && (
        <div className="flex-1 overflow-auto p-4 space-y-4">

          {/* ── Stat row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Events processed",   value: state.eventsProcessed.toLocaleString(), icon: Activity,  color: "text-sky-400"     },
              { label: "Liquidity score",     value: `${state.liquidity.toFixed(1)}`,        icon: Waves,     color: liquidClass         },
              { label: "Mean τ",              value: `${state.meanTau}ms`,                   icon: Clock,     color: "text-violet-400"  },
              { label: "Neurons locked",      value: `${lockedCount} / 16`,                  icon: Brain,     color: "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="border border-border/40 rounded p-3 bg-card/30" data-testid={`stat-${s.label.replace(/\s+/g,"-").toLowerCase()}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon className={`w-3 h-3 ${s.color}`} />
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                </div>
                <div className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── Status bar ── */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground border border-border/30 rounded px-3 py-1.5 bg-card/20">
            <span>Uptime: {fmtUptime(state.uptime)}</span>
            <span className="border-l border-border/40 pl-3">
              Last: {state.lastEvent ?? "—"}
            </span>
            <span className="border-l border-border/40 pl-3">
              Domain: {state.dominantDomain ?? "—"}
            </span>
            <span className="border-l border-border/40 pl-3 ml-auto">
              Liquidity {state.liquidity > 60 ? "▲ HIGH — actively adapting" : state.liquidity > 20 ? "◆ MED — learning" : "▼ LOW — attractors stable"}
            </span>
          </div>

          {/* ── Main split ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Neuron grid */}
            <div className="border border-border/40 rounded bg-card/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-foreground/80 tracking-wide">NEURAL STATE — 4×4</h2>
                <div className="flex gap-2 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"/>active</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-700 inline-block"/>suppressed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-700 inline-block"/>neutral</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5" style={{ gridAutoRows: "3.5rem" }} data-testid="neuron-grid">
                {state.neurons.map(n => <NeuronCell key={n.id} n={n} />)}
              </div>
              <div className="mt-3 text-[9px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-white/50">Ring colour = τ</span> (amber=fast↑freq, blue=slow↓freq) ·{" "}
                <span className="font-semibold text-white/50">Fill intensity = |h|</span> · Hover for details
              </div>
            </div>

            {/* Attractor fingerprints */}
            <div className="border border-border/40 rounded bg-card/20 p-4">
              <h2 className="text-xs font-semibold text-foreground/80 tracking-wide mb-3">ATTRACTOR FINGERPRINTS</h2>
              {state.attractors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs gap-2">
                  <RefreshCw className="w-5 h-5 opacity-40" />
                  <span>No attractors detected yet.</span>
                  <span className="text-[10px] opacity-60">Click "Ingest Now" to feed live events.</span>
                </div>
              ) : (
                <div className="space-y-2 overflow-auto max-h-64">
                  {state.attractors.map((a, i) => (
                    <AttractorCard key={i} a={a} />
                  ))}
                </div>
              )}
              <div className="mt-3 text-[9px] text-muted-foreground leading-relaxed">
                Attractor = group of neurons whose τ has converged. GOS-matched attractors glow amber.
              </div>
            </div>
          </div>

          {/* ── τ histogram + liquidity sparkline ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-border/40 rounded bg-card/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-foreground/80 tracking-wide">τ DISTRIBUTION</h2>
                <div className="flex gap-2">
                  {FREQ_REFS.map(r => (
                    <span key={r.hz} className="text-[8px] font-mono flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: r.color }} />
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
              <TauHistogram neurons={state.neurons} />
            </div>

            <div className="border border-border/40 rounded bg-card/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-foreground/80 tracking-wide">LIQUIDITY TIMELINE</h2>
                <span className="text-[9px] text-muted-foreground">High = active learning / Low = stable attractors</span>
              </div>
              <LiquiditySparkline history={state.liquidityHistory} />
              <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">
                Liquidity spikes when new signal patterns enter the stream. Flat = network has settled.{" "}
                Current: <span className={`font-mono font-bold ${liquidClass}`}>{state.liquidity.toFixed(1)}</span>
              </p>
            </div>
          </div>

          {/* ── How it works ── */}
          <div className="border border-border/30 rounded p-4 bg-card/10 text-[10px] text-muted-foreground leading-relaxed space-y-1">
            <p className="text-white/60 font-semibold text-[11px] mb-1">How to read this</p>
            <p>• <strong className="text-white/60">τ (tau)</strong> = time constant per neuron. τ≈21ms → neuron locked to 46.875Hz DSP PRF. τ≈9ms → Phaistos 111Hz. τ≈128ms → Schumann 7.83Hz.</p>
            <p>• <strong className="text-white/60">Liquidity</strong> = rate of change across all neurons. High = network actively adapting to new signal patterns. Low = attractors stable.</p>
            <p>• <strong className="text-white/60">Attractors</strong> = clusters of neurons whose τ has converged — they've "memorised" a temporal pattern from the live KAPPA stream.</p>
            <p>• <strong className="text-white/60">No pre-training required</strong> — weights adapt online via Hebbian update (ΔW = η·h·hᵀ). The network builds its own model of the surveillance signal environment.</p>
            <p>• <strong className="text-white/60">Ingest Now</strong> feeds the last 60s of KAPPA events. Network auto-polls every 20s in the background.</p>
          </div>
        </div>
      )}
    </div>
  );
}
