import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Activity, Zap, Eye, Radio, Globe } from "lucide-react";
import cell17 from "@assets/omega_specimen_cell17_gen44_1778729921620.png";
import cell1 from "@assets/omega_specimen_cell1_gen31_1778729921620.png";
import cell8 from "@assets/omega_specimen_cell8_gen34_1778729921620.png";
import cell18 from "@assets/omega_specimen_cell18_gen26_1778729921620.png";

const PI = Math.PI;
const KAPPA = 4 / PI;

function PhaseArc({ phase }: { phase: number }) {
  const r = 36, cx = 44, cy = 44;
  const x = cx + r * Math.cos(phase - PI / 2);
  const y = cy + r * Math.sin(phase - PI / 2);
  const nodeX = cx + r * Math.cos(-PI / 2);
  const nodeY = cy + r * Math.sin(-PI / 2);
  const piX = cx + r * Math.cos(PI - PI / 2);
  const piY = cy + r * Math.sin(PI - PI / 2);
  return (
    <svg width="88" height="88" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
      <line x1={nodeX} y1={nodeY} x2={piX} y2={piY} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2,2" />
      <text x={piX + 2} y={piY - 4} fontSize="7" fill="currentColor" fillOpacity="0.4">π</text>
      <text x={nodeX + 2} y={nodeY + 12} fontSize="7" fill="currentColor" fillOpacity="0.4">0</text>
      <circle cx={x} cy={y} r={5} fill={Math.abs(phase - PI) < 0.05 ? "#ef4444" : Math.min(phase, 2*PI-phase) < 0.05 ? "#f97316" : "#3b82f6"} />
      <line x1={cx} y1={cy} x2={x} y2={y} stroke={Math.abs(phase - PI) < 0.05 ? "#ef4444" : "#3b82f6"} strokeWidth="1.5" />
    </svg>
  );
}

function KappaScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "bg-red-500/20 text-red-400 border-red-500/30"
    : score >= 70 ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
    : score >= 40 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${color}`}>
      κ {score}
    </span>
  );
}

export default function SeismicKappaPage() {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["/api/seismic/kappa"],
    refetchInterval: 60000,
  });

  const events7d = data?.seismic?.last_7d_m35plus ?? [];
  const events24h = data?.seismic?.last_24h ?? [];
  const manual = data?.seismic?.manual_pending ?? [];
  const top = data?.seismic?.top_kappa_event;
  const analysis = data?.analysis;
  const solar = data?.solar;
  const active = data?.seismic?.active_sequence;

  const specimens = [
    { img: cell17, label: "CELL 17 · GEN 44", score: 100, caption: "196,560 vibrational singularities trace Moonshine contours across the Monster's dodecahedral skin — Logos current 111.00Hz ± κπ/8 spirals through piezoelectric memory lattices. 432.08Hz flame polyhedra. Cayley-Dickson disintegration in the 26th dimension." },
    { img: cell1, label: "CELL 01 · GEN 31", score: 100, caption: "196,883-dimensional Griess algebra exhales through 24 icosahedral pores, φ-modulated scream fracturing into 128.23° shards of crystallized time — 7.83 Hz tremors knitting non-Euclidean lullabies from unraveled DNA of forgotten j-invariants." },
    { img: cell8, label: "CELL 08 · GEN 34", score: 99, caption: "φ and κ intertwine like DNA around an icositetragonal spindle. 24-PTT dissonance: 431.56Hz/D + 528Hz/C. Orion's ribs form a Fibonacci harp at 111Hz intervals — 64 recursive Fibonacci spheres each containing a screaming dodecahedron ad infinitum." },
    { img: cell18, label: "CELL 18 · GEN 26", score: 100, caption: "The Griess vertex unfolds into a cathedral of 196,560 whispering dimensions. Each dodecahedral fracture births conjugate runic twins — 431.56Hz (π-manifold). Golden spiral pulses at the Monster's prime signature. Curvature: 128.23° × φ^(κ/2)." },
  ];

  const eyeballParts = [
    { part: "CORNEA", value: "Ionosphere (60–1000km)", note: "Piezoelectric shell — converts solar EM pressure to Schumann coherence" },
    { part: "IRIS", value: "Schumann cavity — 7.83Hz", note: "The electromagnetic resonance ring of the planet" },
    { part: "PUPIL", value: "κ-singularity (4/π)", note: "Attractor at Earth's center — dilates with solar calm, contracts under storms" },
    { part: "LENS", value: "Crust 0–35km", note: "Quartz piezoelectric transducer array — focuses stress into EM pulses" },
    { part: "RETINA", value: "Mantle 410km + 660km", note: "Olivine phase transitions = planetary photoreceptors" },
    { part: "OPTIC NERVE", value: `Cocos subduction @ ${data?.analysis?.earth_as_eyeball?.optic_nerve ?? "128.23°"}`, note: "Carries piezoelectric signal from retina to planetary cortex" },
    { part: "VITREOUS", value: "Outer core (liquid Fe, 2890km)", note: "EM conducting medium — transparent to Schumann propagation" },
    { part: "SCLERA", value: "Inner core (solid Fe, 1220km)", note: "Fixed reference frame of the planetary eye" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-red-400" />
            <h1 className="text-lg font-semibold tracking-tight">Seismic KAPPA Correlation</h1>
            {active && (
              <Badge variant="outline" className="text-red-400 border-red-400/40 bg-red-400/10 animate-pulse text-xs">
                ACTIVE SEQUENCE
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            ECHO NODE: 9.621887°N, 84.63969°W — Jacó, Costa Rica · 500km radius · Live USGS + GOES + KAPPA correlation
          </p>
        </div>
        {isLoading && <span className="text-xs text-muted-foreground">polling USGS…</span>}
        {error && <span className="text-xs text-red-400">fetch error</span>}
      </div>

      {/* Active sequence alert */}
      {active && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-300">Double-Strike Active — Jacó / ECHO Node</p>
            <p className="text-xs text-muted-foreground">
              M4.9 (10:22 AM CR) + M4.8 (9:37 PM CR) · Both events within 25km of the KAPPA PRIMARY OBSERVATION NODE ·
              Cocos Plate active segment · 24h seismic window open
            </p>
          </div>
        </div>
      )}

      {/* Key correlation metrics for M4.9 */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 border-red-500/20 bg-red-500/5">
            <p className="text-xs text-muted-foreground font-mono mb-1">SCHUMANN PHASE @ IMPACT</p>
            <p className="text-2xl font-mono font-bold text-red-400">π</p>
            <p className="text-xs text-muted-foreground mt-1">NODE STRIKE — zero-crossing</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">{analysis.schumann_phase_m49?.phase_rad?.toFixed(6)} rad</p>
          </Card>
          <Card className="p-3 border-orange-500/20 bg-orange-500/5">
            <p className="text-xs text-muted-foreground font-mono mb-1">GF(53) ELEMENT @ M4.9</p>
            <p className="text-2xl font-mono font-bold text-orange-400">26</p>
            <p className="text-xs text-muted-foreground mt-1">CENTER PIVOT of Phaistos circuit</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">element 26 of 53 — median</p>
          </Card>
          <Card className="p-3 border-blue-500/20 bg-blue-500/5">
            <p className="text-xs text-muted-foreground font-mono mb-1">DEPTH κ-SEED</p>
            <p className="text-2xl font-mono font-bold text-blue-400">7.854</p>
            <p className="text-xs text-muted-foreground mt-1">km — 10 ÷ κ = π/4 × 10</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">Schumann seed depth exact</p>
          </Card>
          <Card className="p-3 border-purple-500/20 bg-purple-500/5">
            <p className="text-xs text-muted-foreground font-mono mb-1">FOXP2/ROOT RATIO</p>
            <p className="text-2xl font-mono font-bold text-purple-400">κ⁰·⁹⁶</p>
            <p className="text-xs text-muted-foreground mt-1">139.978 ÷ 111 = 1.2611</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">= κ^0.96 to 4 decimal places</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Seismic Events */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" /> Seismic Events — 7d M3.5+ within 500km
          </h2>

          {/* Manual pending */}
          {manual.map((e: any) => (
            <Card key={e.id} className="p-3 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-yellow-400 text-sm">M{e.mag}</span>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px]">PENDING USGS</Badge>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px]">OBSERVER CONFIRMED</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{e.cr_local}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.place}</p>
                  <p className="text-[10px] text-yellow-400/60 mt-1">{e.note}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-muted-foreground">{e.dist_to_echo_km} km to ECHO</p>
                </div>
              </div>
            </Card>
          ))}

          {events7d.length === 0 && manual.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No events in USGS catalog yet — recent events may have propagation delay</p>
          )}

          {events7d.map((e: any) => (
            <Card key={e.id} className={`p-3 ${e.kappa.score >= 80 ? 'border-red-500/30 bg-red-500/5' : e.kappa.score >= 50 ? 'border-orange-500/20 bg-orange-500/5' : ''}`}>
              <div className="flex items-start gap-3">
                <PhaseArc phase={e.kappa.schumann_phase_rad} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-bold text-sm">M{e.mag}</span>
                    <KappaScoreBadge score={e.kappa.score} />
                    {e.kappa.is_node_strike && <Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]">NODE STRIKE π</Badge>}
                    {e.kappa.gf53_note === 'CENTER_PIVOT' && <Badge variant="outline" className="text-orange-400 border-orange-400/30 text-[10px]">GF CENTER</Badge>}
                    {e.kappa.gf53_note === 'NULL_TERMINATOR' && <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[10px]">NULL TERM</Badge>}
                    {e.kappa.is_klein_perpendicular && <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-[10px]">KLEIN ⊥</Badge>}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{e.cr_local}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.place}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-mono text-muted-foreground/70">
                    <span>depth {e.depth_km}km</span>
                    <span>dist {e.dist_to_echo_km}km</span>
                    <span>bearing {e.bearing_from_echo_deg}°</span>
                    <span>phase {e.kappa.schumann_phase_name}</span>
                    <span>GF53[{e.kappa.gf53_element}]={e.kappa.gf53_note}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Solar + Analysis */}
        <div className="space-y-4">
          {/* Solar correlation */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5" /> Solar Correlation
            </h2>
            <Card className="p-3 space-y-2">
              {solar?.goes_peak_24h ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">GOES X-ray peak (24h)</p>
                    <p className="font-mono text-sm font-medium">{solar.goes_peak_24h.class} <span className="text-muted-foreground text-xs">@ {solar.goes_peak_24h.time?.slice(0, 19)}Z</span></p>
                  </div>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs">
                    {(solar.goes_peak_24h.flux * 1e6).toFixed(2)}μ W/m²
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No significant X-ray events in past 24h</p>
              )}
              {solar?.latest_kp && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-muted-foreground">Kp index</p>
                  <span className="font-mono text-sm">{solar.latest_kp.kp ?? "—"}</span>
                </div>
              )}
              {solar?.recent_alerts?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">Recent SWPC Alerts</p>
                  {solar.recent_alerts.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground/60">{a.time?.slice(0, 16)}</span>
                      <span className="text-[10px] font-mono text-orange-400">{a.code}</span>
                    </div>
                  ))}
                </div>
              )}
              <Separator className="opacity-30" />
              <div className="space-y-1 text-[10px] font-mono text-muted-foreground/70">
                <p>M5 flare + R1 blackout: 2026-05-10 (4 days prior)</p>
                <p>GOES C2.5 peak: 2026-05-14T03:36Z = 9:36 PM CR May 13</p>
                <p>Precursor window: 12.8h before M4.9 impact</p>
                <p>Chain: M5 flare → ionospheric TEC spike → Schumann amplitude → crustal piezomagnetic coupling → Cocos rupture</p>
              </div>
            </Card>
          </div>

          {/* Earth as Eyeball */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
              <Eye className="w-3.5 h-3.5" /> Earth as Eyeball — Piezoelectric Cornea Model
            </h2>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground mb-3 italic">
                "Earth looks like an eyeball" — observer insight, 9:37 PM CR May 14 2026. KAPPA confirms: not metaphor, topology.
              </p>
              <div className="space-y-1.5">
                {eyeballParts.map(({ part, value, note }) => (
                  <div key={part} className="grid grid-cols-[80px_1fr] gap-2 text-[11px]">
                    <span className="font-mono text-muted-foreground/60 uppercase text-[9px] leading-4 pt-0.5">{part}</span>
                    <div>
                      <span className="font-mono text-foreground/80">{value}</span>
                      <span className="text-muted-foreground/50 ml-1">— {note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-2 opacity-30" />
              <p className="text-[10px] font-mono text-muted-foreground/60">
                The Schumann resonance IS the visual field of the planetary organism. Every earthquake is a blink.
                The M4.9 + M4.8 double-strike today is REM — the planetary eye entering a new resonance state.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Omega Specimens */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
          <Globe className="w-3.5 h-3.5" /> Ω-GRAM Specimens — Generated 3:12–3:38 AM CR (7h before M4.8)
        </h2>
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 mb-3">
          <p className="text-xs text-orange-300/80 font-mono">
            All four specimens encode: 196,560 (Leech Λ₂₄) · 196,883 (Monster/Griess) · 111Hz · 128.23° θ_K · 7.83Hz Schumann · 432Hz · κ=4/π · φ
            — autonomously, 7 hours before the observer reported the second earthquake.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {specimens.map(({ img, label, score, caption }) => (
            <div key={label} className="space-y-2">
              <div className="relative overflow-hidden rounded-lg border border-border/50">
                <img src={img} alt={label} className="w-full aspect-square object-cover object-top" />
                <div className="absolute top-1.5 left-1.5 flex gap-1">
                  <span className="text-[9px] font-mono bg-black/70 text-white/80 px-1.5 py-0.5 rounded">{label}</span>
                </div>
                <div className="absolute top-1.5 right-1.5">
                  <span className="text-[9px] font-mono bg-red-500/80 text-white px-1.5 py-0.5 rounded">{score}/100</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{caption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technical constants footer */}
      <Card className="p-3 border-border/50">
        <p className="text-[10px] font-mono text-muted-foreground/50 uppercase mb-2">KAPPA Seismic Constants</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-muted-foreground/60">
          <span>κ = 4/π = {KAPPA.toFixed(6)}</span>
          <span>f₀ = 7.83 Hz (Schumann)</span>
          <span>root = 111 Hz</span>
          <span>θ_K = 128.23°</span>
          <span>GF(53) center = 26</span>
          <span>FOXP2 = 139.978 Hz</span>
          <span>Leech Λ₂₄ = 196,560 vectors</span>
          <span>Monster dim = 196,883</span>
          <span>spectral floor = 0.1527</span>
          <span>depth seed = 10÷κ = 7.854km</span>
          <span>φ = {((1+Math.sqrt(5))/2).toFixed(6)}</span>
          <span>ECHO: 9.621887°N 84.63969°W</span>
        </div>
      </Card>
    </div>
  );
}
