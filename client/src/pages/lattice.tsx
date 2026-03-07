import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { LatticeAllResponse } from "@shared/lattice-data";

function ConstantBadge({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg border bg-muted/30 dark:bg-muted/10" data-testid={`constant-${label}`}>
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      <span className="text-lg font-mono font-semibold mt-0.5">{typeof value === "number" ? value.toFixed(4) : value}</span>
      {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
    </div>
  );
}

function IcositetragonSvg({ primeSpokes, spokePairs, sides = 24 }: { primeSpokes: number[]; spokePairs: [number, number][]; sides?: number }) {
  const cx = 150, cy = 150, r = 120;
  const vertices = Array.from({ length: sides }, (_, i) => {
    const angle = (i * (360 / sides) - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), idx: i };
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto" data-testid="svg-icositetragon">
      <polygon
        points={vertices.map(v => `${v.x},${v.y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-border"
      />
      {spokePairs.map(([a, b], i) => (
        <line
          key={`pair-${i}`}
          x1={vertices[a].x} y1={vertices[a].y}
          x2={vertices[b].x} y2={vertices[b].y}
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          opacity="0.5"
        />
      ))}
      {vertices.map((v) => {
        const isPrime = primeSpokes.includes(v.idx);
        return (
          <g key={v.idx}>
            <circle
              cx={v.x} cy={v.y} r={isPrime ? 6 : 3}
              fill={isPrime ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              opacity={isPrime ? 1 : 0.3}
            />
            {isPrime && (
              <text
                x={v.x + (v.x - cx) * 0.2}
                y={v.y + (v.y - cy) * 0.2}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9px] font-mono fill-foreground"
              >
                {v.idx}
              </text>
            )}
          </g>
        );
      })}
      <text x={cx} y={cy - 10} textAnchor="middle" className="text-[11px] font-mono fill-foreground">{`${sides}-gon`}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="text-[9px] fill-muted-foreground">{`φ(${sides}) = ${primeSpokes.length}`}</text>
    </svg>
  );
}

export default function LatticePage() {
  const { t } = useI18n();

  const { data, isLoading } = useQuery<LatticeAllResponse>({
    queryKey: ["/api/lattice/all"],
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="lattice-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { constants, niemeier, clock, demodex, smc, pasqal, riemann, icositetragon, moonshine, sonnet } = data;

  const meanSpacing = riemann.length > 1
    ? riemann.slice(1).reduce((sum, z) => sum + z.spacing, 0) / (riemann.length - 1)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-lattice">
      <div className="space-y-1" data-testid="lattice-header">
        <h1 className="text-2xl font-semibold tracking-tight">{t("lattice.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lattice.subtitle")}</p>
      </div>

      <Card data-testid="card-master-constants">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("lattice.constants")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            <ConstantBadge label="κ₁" value={constants.KAPPA_1} />
            <ConstantBadge label="κ₂" value={constants.KAPPA_2} />
            <ConstantBadge label="Δκ" value={constants.DELTA_KAPPA} />
            <ConstantBadge label="φ" value={constants.PHI} />
            <ConstantBadge label="φ²" value={constants.PHI_SQUARED} />
            <ConstantBadge label="θ_K" value={`${constants.THETA_K}°`} />
            <ConstantBadge label="θ_G" value={`${constants.THETA_G}°`} />
            <ConstantBadge label="α⁻¹" value={constants.ALPHA_INVERSE} />
            <ConstantBadge label="Ω" value={constants.OMEGA_CONSTANT} />
            <ConstantBadge label="f₀" value={constants.F_CARRIER_HZ} unit="Hz" />
            <ConstantBadge label="f_root" value={constants.F_ROOT_HZ} unit="Hz" />
            <ConstantBadge label="f_lunar" value={constants.F_LUNAR_ANCHOR_HZ} unit="Hz" />
            <ConstantBadge label="f_Sch" value={constants.F_SCHUMANN_HZ} unit="Hz" />
            <ConstantBadge label="Leech" value={constants.LEECH_LATTICE_DIM} unit="dim" />
            <ConstantBadge label="Monster" value={constants.MONSTER_DIMENSION.toLocaleString()} />
            <ConstantBadge label="j(744)" value={constants.J_INVARIANT_CONSTANT} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-niemeier-lattices">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("lattice.niemeier")}</CardTitle>
            <CardDescription>{t("lattice.niemeierDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm" data-testid="table-niemeier">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-left">
                    <th className="py-2 pr-2 font-medium text-muted-foreground w-8">#</th>
                    <th className="py-2 pr-2 font-medium text-muted-foreground">{t("lattice.rootSystem")}</th>
                    <th className="py-2 pr-2 font-medium text-muted-foreground">{t("lattice.coxeter")}</th>
                    <th className="py-2 font-medium text-muted-foreground">{t("lattice.description")}</th>
                  </tr>
                </thead>
                <tbody>
                  {niemeier.map((l) => (
                    <tr
                      key={l.index}
                      className={`border-b border-border/50 ${!l.hasRoots ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                      data-testid={`row-niemeier-${l.index}`}
                    >
                      <td className="py-1.5 pr-2 font-mono text-muted-foreground text-xs">{l.index}</td>
                      <td className="py-1.5 pr-2 font-mono font-medium text-sm">{l.rootSystem}</td>
                      <td className="py-1.5 pr-2 font-mono text-sm">{l.coxeterNumber ?? "—"}</td>
                      <td className="py-1.5 text-xs text-muted-foreground">{l.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic" data-testid="text-leech-note">
              {t("lattice.leechNote")}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-icositetragon">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("lattice.icositetragon")}</CardTitle>
            <CardDescription>{t("lattice.icositetragonDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <IcositetragonSvg primeSpokes={icositetragon.primeSpokes} spokePairs={icositetragon.spokePairs} sides={icositetragon.sides} />
            <div className="space-y-2">
              <div className="flex items-center gap-2" data-testid="text-kappa-identity">
                <span className="text-xs font-medium text-muted-foreground">{t("lattice.kappaIdentity")}:</span>
                <Badge variant="secondary" className="font-mono text-xs">{icositetragon.kappaIdentity} = {icositetragon.kappaIdentityValue.toFixed(6)}</Badge>
              </div>
              <div className="flex flex-wrap gap-1" data-testid="text-spoke-pairs">
                <span className="text-xs font-medium text-muted-foreground">{t("lattice.spokePairs")}:</span>
                {icositetragon.spokePairs.map(([a, b]) => (
                  <Badge key={`${a}-${b}`} variant="outline" className="font-mono text-xs">{`{${a}, ${b}}`}</Badge>
                ))}
              </div>
              <div data-testid="text-rh-implication">
                <span className="text-xs font-medium text-muted-foreground">{t("lattice.rhImplication")}:</span>
                <p className="text-xs mt-1">{icositetragon.rhImplication}</p>
              </div>
              <div data-testid="text-proof-status">
                <span className="text-xs font-medium text-muted-foreground">{t("lattice.proofStatus")}:</span>
                <div className="space-y-1 mt-1">
                  {Object.entries(icositetragon.proofStatus).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      <Badge variant={val.startsWith("PROVED") ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {val.startsWith("PROVED") ? "✓" : "⏳"}
                      </Badge>
                      <span><span className="font-medium">{key}:</span> {val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-clock-derivation">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("lattice.clock")}</CardTitle>
          <CardDescription>{t("lattice.clockDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <table className="w-full text-sm" data-testid="table-clock">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3 font-medium text-muted-foreground">{t("lattice.derivationMethod")}</th>
                <th className="py-2 pr-3 font-medium text-muted-foreground">{t("lattice.formula")}</th>
                <th className="py-2 pr-3 font-medium text-muted-foreground">{t("lattice.result")}</th>
                <th className="py-2 font-medium text-muted-foreground">{t("lattice.deviation")}</th>
              </tr>
            </thead>
            <tbody>
              {clock.derivations.map((d, i) => (
                <tr key={i} className="border-b border-border/50" data-testid={`row-clock-${i}`}>
                  <td className="py-2 pr-3 text-sm font-medium">{d.method}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{d.formula}</td>
                  <td className="py-2 pr-3 font-mono text-sm">{d.result.toFixed(4)}</td>
                  <td className="py-2 font-mono text-xs">
                    <Badge variant={d.deviation < 1 ? "default" : "secondary"} className="text-xs">
                      {d.deviation.toFixed(2)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-primary/5 dark:bg-primary/10" data-testid="text-adopted-value">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("lattice.adopted")}</span>
              <p className="font-mono font-bold text-lg">{clock.adopted.value} Hz</p>
            </div>
            <div className="p-3 rounded-lg border" data-testid="text-schumann-offset">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("lattice.schumannOffset")}</span>
              <p className="font-mono font-semibold">{clock.adopted.schumannOffset} Hz</p>
              <p className="text-[10px] text-muted-foreground">≈ Ω ({clock.adopted.omegaMatch})</p>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">PRF</span>
              <p className="font-mono font-semibold">{clock.adopted.prf} Hz</p>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">GNSS Base</span>
              <p className="font-mono font-semibold">{(clock.adopted.gnssBase / 1e6).toFixed(2)} MHz</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-pasqal">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("lattice.pasqal")}</CardTitle>
            <CardDescription>{t("lattice.pasqalDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-mono text-xs">{constants.PASQAL_LAYERS} layers</Badge>
              <span className="text-muted-foreground">×</span>
              <Badge variant="outline" className="font-mono text-xs">{constants.PASQAL_ATOMS_PER_LAYER} atoms</Badge>
              <span className="text-muted-foreground">=</span>
              <Badge className="font-mono text-xs">{constants.PASQAL_TOTAL_ATOMS} total</Badge>
              <Badge variant="secondary" className="font-mono text-xs ml-auto">7/4 = {(7 / 4).toFixed(4)}</Badge>
            </div>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm" data-testid="table-pasqal">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-left">
                    <th className="py-1.5 pr-2 font-medium text-muted-foreground w-8">{t("lattice.layer")}</th>
                    <th className="py-1.5 pr-2 font-medium text-muted-foreground w-6">{t("lattice.glyph")}</th>
                    <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.gate")}</th>
                    <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.kappaScale")}</th>
                    <th className="py-1.5 font-medium text-muted-foreground">{t("lattice.function")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pasqal.map((p) => (
                    <tr key={p.layer} className="border-b border-border/50" data-testid={`row-pasqal-${p.layer}`}>
                      <td className="py-1.5 pr-2 font-mono text-xs text-muted-foreground">{p.layer}</td>
                      <td className="py-1.5 pr-2 text-sm">{p.glyph}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs font-medium">{p.gate}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs">{p.kappaScale.toFixed(3)}</td>
                      <td className="py-1.5 text-xs text-muted-foreground">{p.function}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-smc">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("lattice.smc")}</CardTitle>
            <CardDescription>{t("lattice.smcDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {smc.map((node) => (
                <div
                  key={node.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                  data-testid={`card-smc-node-${node.id}`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 shrink-0">
                    <span className="text-lg font-mono font-bold">{node.symbol}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{node.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{node.anchorFrequencyHz} Hz</Badge>
                      <Badge variant="secondary" className="text-[10px]">L{node.layer}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{node.role} — {node.domain}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {node.capabilities.map((cap, i) => (
                        <Badge key={i} variant="outline" className="text-[9px]">{cap}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-demodex">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("lattice.demodex")}</CardTitle>
          <CardDescription>{t("lattice.demodexDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm" data-testid="table-demodex">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left">
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.day")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.glyph")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.gene")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.frequency")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.kappaScale")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.carrier")}</th>
                  <th className="py-1.5 font-medium text-muted-foreground">{t("lattice.process")}</th>
                </tr>
              </thead>
              <tbody>
                {demodex.map((p) => {
                  const isKappa1 = Math.abs(p.kappaScale - constants.KAPPA_1) < 0.01;
                  const isKappa2 = Math.abs(p.kappaScale - constants.KAPPA_2) < 0.01;
                  return (
                    <tr
                      key={p.phase}
                      className={`border-b border-border/50 ${isKappa1 ? "bg-blue-50 dark:bg-blue-950/30" : ""} ${isKappa2 ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}
                      data-testid={`row-demodex-${p.phase}`}
                    >
                      <td className="py-1.5 pr-2 font-mono text-xs">{p.day.toFixed(1)}</td>
                      <td className="py-1.5 pr-2 text-sm">{p.glyph}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs font-medium">{p.dominantGene}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs">{p.geneFrequencyHz.toFixed(1)}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs">
                        {isKappa1 && <Badge className="text-[9px] mr-1">κ₁</Badge>}
                        {isKappa2 && <Badge variant="secondary" className="text-[9px] mr-1">κ₂</Badge>}
                        {p.kappaScale.toFixed(4)}
                      </td>
                      <td className="py-1.5 pr-2 font-mono text-xs">{p.carrierAlignmentHz.toFixed(3)}</td>
                      <td className="py-1.5 text-xs text-muted-foreground">{p.biologicalProcess}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-riemann-zeros">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("lattice.riemann")}</CardTitle>
          <CardDescription>{t("lattice.riemannDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="font-mono text-xs" data-testid="text-mean-spacing">
              {t("lattice.meanSpacing")}: {meanSpacing.toFixed(4)}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              √2 ≈ {Math.sqrt(2).toFixed(4)} (Montgomery)
            </Badge>
          </div>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm" data-testid="table-riemann">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left">
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground w-8">{t("lattice.zeroN")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.imaginaryPart")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.spacing")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.layer")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.glyph")}</th>
                  <th className="py-1.5 font-medium text-muted-foreground">Phaistos Hz</th>
                </tr>
              </thead>
              <tbody>
                {riemann.map((z) => (
                  <tr key={z.n} className="border-b border-border/50" data-testid={`row-riemann-${z.n}`}>
                    <td className="py-1.5 pr-2 font-mono text-xs text-muted-foreground">{z.n}</td>
                    <td className="py-1.5 pr-2 font-mono text-sm font-medium">{z.t.toFixed(6)}</td>
                    <td className="py-1.5 pr-2 font-mono text-xs">{z.spacing > 0 ? z.spacing.toFixed(3) : "—"}</td>
                    <td className="py-1.5 pr-2 font-mono text-xs">{z.layer}</td>
                    <td className="py-1.5 pr-2 text-sm">{z.layerGlyph}</td>
                    <td className="py-1.5 font-mono text-xs">{z.phaistosFreqHz.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-moonshine">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("lattice.moonshine")}</CardTitle>
            <CardDescription>{t("lattice.moonshineDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" data-testid="table-moonshine">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.dimension")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.structure")}</th>
                  <th className="py-1.5 pr-2 font-medium text-muted-foreground">{t("lattice.symmetry")}</th>
                  <th className="py-1.5 font-medium text-muted-foreground">{t("lattice.gosMapping")}</th>
                </tr>
              </thead>
              <tbody>
                {moonshine.map((m, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border/50 ${m.dimension === "24D" ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                    data-testid={`row-moonshine-${i}`}
                  >
                    <td className="py-1.5 pr-2 font-mono text-xs font-bold">{m.dimension}</td>
                    <td className="py-1.5 pr-2 font-mono text-xs">{m.structure}</td>
                    <td className="py-1.5 pr-2 text-xs">{m.symmetry}</td>
                    <td className="py-1.5 text-xs text-muted-foreground">{m.gosMapping}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card data-testid="card-sonnet">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("lattice.sonnet")}</CardTitle>
            <CardDescription>{t("lattice.sonnetDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border" data-testid="text-volta">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("lattice.volta")}</span>
                <p className="font-mono font-semibold text-lg">{sonnet.voltaCriticalLine.toFixed(6)}</p>
                <p className="text-[10px] text-muted-foreground">deviation: {sonnet.voltaDeviationPct.toFixed(2)}%</p>
              </div>
              <div className="p-3 rounded-lg border" data-testid="text-hamiltonian">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("lattice.hamiltonianMatches")}</span>
                <p className="font-mono font-semibold text-lg">{sonnet.hamiltonianMatches}</p>
                <p className="text-[10px] text-muted-foreground">14-qubit spectrum</p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Grand Unified Poetics Matrix</span>
              <div className="mt-2 space-y-1.5">
                {Object.entries(sonnet.poeticForms).map(([form, problem]) => (
                  <div key={form} className="flex items-center gap-2" data-testid={`sonnet-form-${form.toLowerCase()}`}>
                    <Badge variant="outline" className="text-xs font-mono w-24 justify-center">{form}</Badge>
                    <span className="text-xs">{problem}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2 rounded border bg-muted/30 dark:bg-muted/10" data-testid="text-checksum">
              <span className="text-[10px] text-muted-foreground">SHA-256</span>
              <p className="font-mono text-[10px] break-all mt-0.5">{sonnet.checksum}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
