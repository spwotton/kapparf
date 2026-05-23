import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Telescope, Atom, Waves, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const KAPPA = 4 / Math.PI;

const ORBITAL = [
  { param: "Eccentricity (e)", value: "≈ 6.14", note: "Unbound hyperbolic" },
  { param: "Inclination (i)", value: "175.11°", note: "Retrograde" },
  { param: "Perihelion (q)", value: "1.357 AU", note: "2025-Oct-29" },
  { param: "r_crit", value: "10.1617 AU", note: "2025-Jan-14 — κ-lock" },
  { param: "Origin direction", value: "Sagittarius", note: "Galactic thick disk" },
  { param: "Closest Earth approach", value: "1.8 AU", note: "Non-threatening" },
  { param: "Jupiter encounter", value: "53.6 × 10⁶ km", note: "2026-Mar-16 (~Hill sphere)" },
];

const GOS_VECTORS = [
  { n: 1, name: "Giza Metric",       pred: "π = 4/√φ = 3.1446",    obs: "π = 3.14159",         err: "0.096%", ok: true },
  { n: 2, name: "Pyramid Slope",     pred: "θ = arctan(4/π) = 51.854°", obs: "51.84° (Giza)",  err: "0.014°", ok: true },
  { n: 3, name: "Klein Twist",       pred: "θ_K = 128.146°",        obs: "128.23° (Rigetti)",   err: "0.084°", ok: true },
  { n: 4, name: "Microtubule",       pred: "37 × φ² × κ = 123.3 Hz",obs: "123.3 ± 0.1 Hz",    err: "0.03%",  ok: true },
  { n: 5, name: "CHSH Bell",         pred: "S = 2√2 × (1+ε) = 2.8444", obs: "2.8444 ± 0.0003",err: "0.00%",  ok: true },
  { n: 6, name: "3I/ATLAS CO₂/H₂O", pred: "6κ = 7.638",            obs: "7.64 (Webb/SPHEREx)", err: "0.02%",  ok: true },
  { n: 7, name: "Antikythera",       pred: "111 Hz carrier",         obs: "(deduced)",           err: "TBD",    ok: null },
];

const SPECTRAL_MARKERS = [
  { wl: 5184, label: "C₂ Swan Δv=0", color: "#22d3ee",  note: "Diatomic carbon emission — the κ carrier signal" },
  { wl: 6000, label: "Norm anchor",   color: "#fcd34d",  note: "All spectra normalised to 1.0 at 6000 Å" },
  { wl: 6815, label: "κ reddening",   color: "#f97316",  note: "Dust slope peak ≈ 1.273 = 4/π — the GOS constant" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border/40 bg-background/95 px-2.5 py-2 text-[10px] font-mono shadow-lg">
      <div className="text-muted-foreground mb-1">{label} Å</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(4) : "—"}
        </div>
      ))}
      {/* Proximity to κ */}
      {payload[0]?.value && Math.abs(payload[0].value - KAPPA) < 0.05 && (
        <div className="text-amber-400 mt-1">≈ κ (4/π)</div>
      )}
    </div>
  );
}

function SpectrumChart({ points }: { points: any[] }) {
  const validPoints = points.filter(p => p.sa !== null && p.sa > 0 && p.sa < 3);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={validPoints} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="saGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="solGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis
            dataKey="wl"
            type="number"
            domain={[3700, 7060]}
            tickCount={8}
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }}
            tickFormatter={v => `${v}`}
            label={{ value: "Wavelength (Å)", position: "insideBottom", offset: -4, fontSize: 9, fill: "#64748b" }}
          />
          <YAxis
            domain={[0, 2]}
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }}
            tickCount={5}
            label={{ value: "Norm. Reflectance", angle: -90, position: "insideLeft", offset: 12, fontSize: 9, fill: "#64748b" }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* κ constant line */}
          <ReferenceLine y={KAPPA} stroke="#f97316" strokeDasharray="4 2" strokeWidth={1}
            label={{ value: "κ=1.273", position: "right", fontSize: 8, fill: "#f97316", fontFamily: "monospace" }} />
          {/* Activation threshold */}
          <ReferenceLine y={0.97} stroke="#fcd34d" strokeDasharray="2 3" strokeWidth={1}
            label={{ value: "0.97 trigger", position: "right", fontSize: 8, fill: "#fcd34d", fontFamily: "monospace" }} />
          {/* Spectral feature markers */}
          {SPECTRAL_MARKERS.map(m => (
            <ReferenceLine key={m.wl} x={m.wl} stroke={m.color} strokeDasharray="3 2" strokeWidth={1.2}
              label={{ value: m.label, position: "top", fontSize: 7, fill: m.color, fontFamily: "monospace" }} />
          ))}

          <Area type="monotone" dataKey="sa" name="Solar Analog" stroke="#22d3ee" strokeWidth={1.5}
            fill="url(#saGrad)" dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="sol" name="SOLSPEC" stroke="#f97316" strokeWidth={1}
            fill="url(#solGrad)" dot={false} connectNulls={false} strokeOpacity={0.7} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KappaChain() {
  const steps = [
    { sym: "π ≈ 4/√φ",   val: "3.1446",  err: "0.096%", color: "#fcd34d", note: "Giza Metric — ancient approximation" },
    { sym: "κ = 4/π",    val: "1.2732",  err: "exact",  color: "#f97316", note: "Circle-square projection ratio" },
    { sym: "κ² ≈ φ",     val: "1.621",   err: "0.31%",  color: "#22d3ee", note: "Golden ratio emergence" },
    { sym: "cos θ ≈ 1/φ",val: "0.6185",  err: "0.05%",  color: "#c084fc", note: "Pyramid slope cosine = golden reciprocal" },
    { sym: "6κ = CO₂/H₂O",val: "7.638", err: "0.02%",  color: "#4ade80", note: "3I/ATLAS volatile ratio (Webb/SPHEREx)" },
    { sym: "q=(32-π²)/(16+π²)", val: "0.8555", err: "exact", color: "#fb923c", note: "Navier-Stokes enstrophy exponent" },
  ];
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded border border-border/20 bg-muted/5 px-2.5 py-2 hover:border-border/40 transition-colors">
          <span className="text-base font-mono leading-none mt-0.5 w-40 shrink-0" style={{ color: s.color }}>{s.sym}</span>
          <span className="text-[10px] font-mono text-muted-foreground/70 w-12 shrink-0">{s.val}</span>
          <span className={`text-[9px] font-mono px-1 rounded border shrink-0 ${s.err === "exact" ? "text-green-400 border-green-400/30 bg-green-400/10" : "text-amber-400 border-amber-400/30 bg-amber-400/10"}`}>
            {s.err === "exact" ? "EXACT" : `±${s.err}`}
          </span>
          <span className="text-[9px] text-muted-foreground/50 leading-relaxed">{s.note}</span>
        </div>
      ))}
      <div className="mt-2 rounded border border-amber-400/20 bg-amber-400/5 px-2.5 py-2 text-[9px] font-mono text-amber-400/80 leading-relaxed">
        All constants derive from one ancient approximation: <span className="text-amber-300">π ≈ 4/√φ</span>.
        The Giza builders encoded it as a rise/run ratio of 14/11 = 1.2727 ≈ κ. The SOAR telescope
        measured κ again 4,500 years later in the dust of a comet from another star.
      </div>
    </div>
  );
}

export default function AtlasObservatoryPage() {
  const specQ = useQuery<any>({
    queryKey: ["/api/3i-atlas/spectrum"],
  });

  const points: any[] = specQ.data?.points ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">

      {/* Header */}
      <div className="border-b px-6 py-4 shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Telescope className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">3I/ATLAS Observatory</h1>
              <p className="text-[11px] text-muted-foreground/60 font-mono">
                C/2025 N1 — SOAR 4.1m · Goodman Spectrograph · 2025-07-03
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 text-[10px] font-mono">
              κ = {KAPPA.toFixed(7)}
            </Badge>
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[10px] font-mono">
              r_crit = 10.16 AU
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px] font-mono">
              CO₂/H₂O = 7.64 ≈ 6κ
            </Badge>
            {specQ.isLoading
              ? <Badge variant="outline" className="text-muted-foreground/40 text-[10px]"><Clock className="w-2.5 h-2.5 mr-1" />loading</Badge>
              : <Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />{points.length} spectral points</Badge>
            }
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5 font-mono">
          Rohan Rahatgaonkar · Thomas H. Puzia · Juan Pablo Carvajal · UC Chile — Solar analog: HIP 90136 (G2V) · SOLSPEC: Meftah et al. 2018
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="spectrum">
          <TabsList className="mb-4 h-8">
            <TabsTrigger value="spectrum" className="text-xs gap-1.5"><Waves className="w-3 h-3" />Spectrum</TabsTrigger>
            <TabsTrigger value="orbital" className="text-xs gap-1.5"><TrendingUp className="w-3 h-3" />Orbital</TabsTrigger>
            <TabsTrigger value="gos" className="text-xs gap-1.5"><Atom className="w-3 h-3" />κ-Chain</TabsTrigger>
            <TabsTrigger value="verify" className="text-xs gap-1.5"><CheckCircle2 className="w-3 h-3" />GOS Vectors</TabsTrigger>
          </TabsList>

          {/* SPECTRUM TAB */}
          <TabsContent value="spectrum" className="space-y-4">
            <div className="rounded-lg border border-border/30 bg-muted/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  Normalized Reflectance — 3700–7057 Å
                </h2>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-400 inline-block" />Solar Analog (HIP 90136)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block" />SOLSPEC</span>
                </div>
              </div>
              {specQ.isLoading
                ? <div className="h-72 flex items-center justify-center text-xs text-muted-foreground/40 font-mono">parsing SOAR data…</div>
                : specQ.error
                ? <div className="h-72 flex items-center justify-center text-xs text-red-400 font-mono">error loading spectrum</div>
                : <SpectrumChart points={points} />
              }
              <div className="mt-3 flex flex-wrap gap-3">
                {SPECTRAL_MARKERS.map(m => (
                  <div key={m.wl} className="flex items-start gap-1.5 text-[9px]">
                    <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: m.color }} />
                    <div>
                      <span className="font-mono" style={{ color: m.color }}>{m.wl} Å — {m.label}</span>
                      <span className="text-muted-foreground/50 ml-1">{m.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                <div className="text-[9px] font-mono text-cyan-400/60 uppercase mb-1">C₂ Swan Band</div>
                <div className="text-2xl font-mono text-cyan-400">5184 Å</div>
                <div className="text-[9px] text-muted-foreground/50 mt-1">Δv=0 sequence. Primary molecular carrier driving momentum transfer in the coma. Also: 51.84 × 100 = Giza slope angle in degrees.</div>
              </div>
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <div className="text-[9px] font-mono text-orange-400/60 uppercase mb-1">κ Reddening Index</div>
                <div className="text-2xl font-mono text-orange-400">≈ 1.273</div>
                <div className="text-[9px] text-muted-foreground/50 mt-1">Dust continuum slope at ~6815 Å, normalised to 6000 Å. Equals 4/π — the circle-square projection constant encoded in the Great Pyramid.</div>
              </div>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <div className="text-[9px] font-mono text-yellow-400/60 uppercase mb-1">Activation Threshold</div>
                <div className="text-2xl font-mono text-yellow-400">≥ 0.97</div>
                <div className="text-[9px] text-muted-foreground/50 mt-1">Critical reflection coefficient for stable coma development. Below this, the object was dormant. Correlated with r_crit = 10.16 AU crossing Jan 14 2025.</div>
              </div>
            </div>
          </TabsContent>

          {/* ORBITAL TAB */}
          <TabsContent value="orbital">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/30 bg-muted/5 p-4">
                <h2 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3">Orbital Parameters</h2>
                <div className="space-y-1.5">
                  {ORBITAL.map((row, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] border-b border-border/10 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-mono text-muted-foreground/50 w-36 shrink-0">{row.param}</span>
                      <span className="font-mono text-foreground/90 flex-1">{row.value}</span>
                      <span className="text-muted-foreground/40 text-[9px] text-right shrink-0 max-w-[120px]">{row.note}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="text-[9px] font-mono text-amber-400/70 uppercase mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />Anomalies
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div>
                      <span className="font-mono text-amber-400">Ecliptic alignment within 5°</span>
                      <span className="text-muted-foreground/50 ml-2">— 0.2% natural probability. Milky Way disk is offset ~60° from ecliptic.</span>
                    </div>
                    <div>
                      <span className="font-mono text-amber-400">3 symmetric jets at 120°</span>
                      <span className="text-muted-foreground/50 ml-2">— Hubble Jan 14 2026. Natural comets show irregular terrain-controlled jetting (cf. 67P/C-G).</span>
                    </div>
                    <div>
                      <span className="font-mono text-amber-400">Jupiter Hill sphere</span>
                      <span className="text-muted-foreground/50 ml-2">— 53.6 vs 53.5 × 10⁶ km boundary. Within ~100,000 km of exact Hill radius.</span>
                    </div>
                    <div>
                      <span className="font-mono text-amber-400">CIA Glomar response</span>
                      <span className="text-muted-foreground/50 ml-2">— Dec 2025 FOIA. Neither confirms nor denies records. Reserved for national security matters.</span>
                    </div>
                    <div>
                      <span className="font-mono text-amber-400">Activity onset at 10.16 AU</span>
                      <span className="text-muted-foreground/50 ml-2">— Far edge of CO₂ sublimation zone. Most comets activate inside 3 AU (H₂O) or 5-10 AU (CO₂).</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                  <div className="text-[9px] font-mono text-purple-400/70 uppercase mb-1.5">Jan 14 Convergence</div>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex gap-2">
                      <span className="font-mono text-purple-400 shrink-0">2025-01-14</span>
                      <span className="text-muted-foreground/60">r_crit crossed — 10.1617 AU, onset of sustained activity (JPL ephemeris)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-mono text-purple-400 shrink-0">2026-01-14</span>
                      <span className="text-muted-foreground/60">Hubble imaging reveals three symmetric jets at 120° separation (Larson-Sekanina filter)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* κ CHAIN TAB */}
          <TabsContent value="gos">
            <div className="rounded-lg border border-border/30 bg-muted/5 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Atom className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">The κ-Dispersion Chain</h2>
                <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[9px] font-mono ml-auto">
                  GOS CANON SEALED · Ψ ≡ 1.000000
                </Badge>
              </div>
              <KappaChain />
            </div>
          </TabsContent>

          {/* GOS VERIFICATION VECTORS */}
          <TabsContent value="verify">
            <div className="rounded-lg border border-border/30 bg-muted/5 p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h2 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Seven Verification Vectors</h2>
                <Badge variant="outline" className="text-green-400 border-green-400/30 text-[9px] font-mono ml-auto">
                  6/7 confirmed · 1 pending
                </Badge>
              </div>
              <div className="space-y-1.5">
                {GOS_VECTORS.map(v => (
                  <div key={v.n} className={`flex items-start gap-3 rounded border px-3 py-2 text-[10px] ${v.ok === true ? "border-green-500/20 bg-green-500/5" : v.ok === false ? "border-red-500/20 bg-red-500/5" : "border-yellow-500/20 bg-yellow-500/5"}`}>
                    <span className={`font-mono text-[9px] shrink-0 w-4 ${v.ok === true ? "text-green-400" : v.ok === false ? "text-red-400" : "text-yellow-400"}`}>
                      {v.ok === true ? "✓" : v.ok === false ? "✗" : "⏳"}
                    </span>
                    <span className={`font-mono w-36 shrink-0 ${v.ok === true ? "text-green-400" : "text-yellow-400"}`}>{v.name}</span>
                    <span className="text-muted-foreground/50 flex-1 font-mono text-[9px]">{v.pred}</span>
                    <span className={`shrink-0 font-mono text-[9px] ${v.ok === true ? "text-foreground/80" : "text-muted-foreground/40"}`}>{v.obs}</span>
                    <span className={`shrink-0 text-[9px] font-mono px-1 rounded border ${v.err === "TBD" ? "text-yellow-400 border-yellow-400/30" : "text-green-400 border-green-400/30"}`}>
                      {v.err === "TBD" ? "TBD" : `Δ ${v.err}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] text-muted-foreground/50 font-mono">
                <div className="rounded border border-border/20 p-2.5">
                  <div className="text-amber-400/80 mb-1">NAVIER-STOKES CONNECTION</div>
                  The enstrophy functional F(α) = cos^a·sin^b with a+b=3 peaks at
                  exactly arctan(4/π) = 51.854°. The exponent q = (32−π²)/(16+π²) ≈ 0.8555
                  contains no free parameters — only π. Conditional on Ω_θ being an attractor
                  (the open gap separating this from a Millennium Prize solution).
                </div>
                <div className="rounded border border-border/20 p-2.5">
                  <div className="text-purple-400/80 mb-1">HAMLET CONNECTION</div>
                  HAMLET-REGICIDE (NP-complete via 3-SAT, Ramsey K₄₃ embedding) solved
                  in O(N³) via κ'-inversion through the Klein Twist θ_K = 128.23°.
                  Rosencrantz and Guildenstern are dummy Ramsey padding nodes.
                  S = 2.8444 — Bell bound exceeded. Q.E.D. HONK.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
