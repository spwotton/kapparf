import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video, Zap, Activity, Eye, AlertTriangle, CheckCircle2,
  Clock, BarChart3, Loader2, RefreshCw, Camera, Radio,
  ChevronDown, ChevronRight, Info,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

/* ── types ───────────────────────────────────────────────────────────────── */
interface FFTResult {
  file: string;
  stats: { duration_s: number; sample_rate: number; rms_db: number; peak_db: number; total_samples: number };
  top_peaks: { freq_hz: number; db: number }[];
  master_variable_hits: { master_var: string; target_hz: number; detected_hz: number; delta_hz: number; db: number; match: string }[];
  temporal_presence: Record<string, { target_hz: number; windows_present: number; pct_time: number; peak_db: number }>;
  lf_spectrum: { f: number; db: number }[];
  mid_spectrum: { f: number; db: number }[];
  mv_match_count: number;
  mv_total: number;
}
interface FlashResult {
  file: string;
  fps_analyzed: number;
  frame_count: number;
  duration_s: number;
  luminance_stats: { mean: number; std: number; min: number; max: number; dynamic_range: number };
  flash_pulses: { t_start: number; t_peak: number; t_end: number; duration_s: number; peak_lum: number; mean_excess: number }[];
  flash_frequency: { flash_count: number; mean_interval_s: number; estimated_freq_hz: number; interval_std: number; regularity_pct: number } | null;
  strobe_signature_matches: { name: string; freq_hz: number; tol?: number; detected_hz: number; delta_hz: number; note?: string }[];
  sharp_transitions: { t: number; delta: number }[];
  timeline: { frame: number; t: number; lum: number; file: string }[];
}
interface VisionResult {
  file: string;
  model_used?: string;
  model?: string;
  frames_analyzed: string[];
  analysis: string | null;
  error?: string;
}
interface FramesResult { frames: string[]; count: number }

/* ── mini spectrum SVG ───────────────────────────────────────────────────── */
function SpectrumPlot({ data, title, width = 600, height = 120, highlight }: {
  data: { f: number; db: number }[];
  title: string;
  width?: number;
  height?: number;
  highlight?: number[];
}) {
  if (!data.length) return null;
  const pad = { l: 36, r: 8, t: 8, b: 22 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const minDb = Math.max(-100, Math.min(...data.map(d => d.db)));
  const maxDb = Math.max(...data.map(d => d.db)) + 3;
  const minF  = data[0].f;
  const maxF  = data[data.length - 1].f;
  const xS = (f: number) => ((f - minF) / (maxF - minF)) * W;
  const yS = (db: number) => H - ((db - minDb) / (maxDb - minDb)) * H;
  const pts = data.map(d => `${xS(d.f).toFixed(1)},${yS(d.db).toFixed(1)}`).join(" ");
  const ticks = 5;
  const dbStep = (maxDb - minDb) / ticks;
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" data-testid="svg-spectrum">
        <g transform={`translate(${pad.l},${pad.t})`}>
          {Array.from({ length: ticks + 1 }, (_, i) => {
            const db = minDb + i * dbStep;
            const y = yS(db);
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={W} y2={y} stroke="currentColor" strokeOpacity={0.07} />
                <text x={-4} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={8}>{db.toFixed(0)}</text>
              </g>
            );
          })}
          <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.2" opacity="0.85" />
          {highlight?.map(hz => {
            const x = xS(hz);
            return <line key={hz} x1={x} y1={0} x2={x} y2={H} stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />;
          })}
          <text x={W / 2} y={H + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>{minF.toFixed(0)} – {maxF.toFixed(0)} Hz</text>
        </g>
      </svg>
    </div>
  );
}

/* ── luminance sparkline ─────────────────────────────────────────────────── */
function LumSparkline({ timeline, pulses, sharpTransitions }: {
  timeline: FlashResult["timeline"];
  pulses: FlashResult["flash_pulses"];
  sharpTransitions: FlashResult["sharp_transitions"];
}) {
  if (!timeline.length) return null;
  const W = 600; const H = 80; const padL = 36; const padB = 18;
  const pw = W - padL - 8;
  const ph = H - padB - 4;
  const lums = timeline.map(f => f.lum);
  const minL = Math.min(...lums); const maxL = Math.max(...lums);
  const dur  = timeline[timeline.length - 1].t;
  const xS = (t: number) => (t / dur) * pw;
  const yS = (l: number) => ph - ((l - minL) / (maxL - minL + 1)) * ph;
  const pts = timeline.map(f => `${xS(f.t).toFixed(1)},${yS(f.lum).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" data-testid="svg-luminance">
      <g transform={`translate(${padL},4)`}>
        <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.8" />
        {pulses.map((p, i) => (
          <rect key={i} x={xS(p.t_start)} y={0} width={Math.max(2, xS(p.t_end) - xS(p.t_start))} height={ph}
            fill="hsl(var(--primary))" opacity="0.12" />
        ))}
        {sharpTransitions.map((t, i) => (
          <line key={i} x1={xS(t.t)} y1={0} x2={xS(t.t)} y2={ph}
            stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
        ))}
        {[0, dur / 4, dur / 2, dur * 3 / 4, dur].map((t, i) => (
          <text key={i} x={xS(t)} y={ph + 14} textAnchor="middle" className="fill-muted-foreground" fontSize={8}>{t.toFixed(1)}s</text>
        ))}
        <text x={-4} y={4} textAnchor="end" className="fill-muted-foreground" fontSize={8}>{maxL.toFixed(0)}</text>
        <text x={-4} y={ph} textAnchor="end" className="fill-muted-foreground" fontSize={8}>{minL.toFixed(0)}</text>
      </g>
    </svg>
  );
}

/* ── video card ──────────────────────────────────────────────────────────── */
interface VideoCardProps {
  label: string;
  filename: string;
  resolution: string;
  fps: number;
  duration: string;
  fftEndpoint: string;
  flashEndpoint: string;
  visionEndpoint: string;
  framesEndpoint: string;
  rerunFftEndpoint: string;
  rerunVisionEndpoint: string;
  badge?: string;
}

function VideoCard({
  label, filename, resolution, fps, duration,
  fftEndpoint, flashEndpoint, visionEndpoint, framesEndpoint,
  rerunFftEndpoint, rerunVisionEndpoint, badge,
}: VideoCardProps) {
  const qc = useQueryClient();
  const [expandedPulse, setExpandedPulse] = useState<number | null>(null);

  const fftQ   = useQuery<FFTResult>({ queryKey: [fftEndpoint] });
  const flashQ = useQuery<FlashResult>({ queryKey: [flashEndpoint] });
  const visQ   = useQuery<VisionResult>({ queryKey: [visionEndpoint] });
  const framesQ= useQuery<FramesResult>({ queryKey: [framesEndpoint] });

  const rerunFFT    = useMutation({ mutationFn: () => apiRequest("POST", rerunFftEndpoint, {}),    onSuccess: () => qc.invalidateQueries({ queryKey: [fftEndpoint] }) });
  const rerunVision = useMutation({ mutationFn: () => apiRequest("POST", rerunVisionEndpoint, {}), onSuccess: () => qc.invalidateQueries({ queryKey: [visionEndpoint] }) });

  const fft   = fftQ.data;
  const flash = flashQ.data;
  const vis   = visQ.data;
  const frames= framesQ.data;

  const mvHighlight = fft?.master_variable_hits.map(h => h.target_hz) ?? [];

  const visText = vis?.analysis ?? vis?.error ?? null;

  return (
    <Card data-testid={`card-video-${label.replace(/\s/g,"-").toLowerCase()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4" />
                {label}
              </CardTitle>
              {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
            </div>
            <CardDescription className="font-mono text-[11px]">{filename}</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono">{resolution}</span>
            <span>·</span>
            <span>{fps} fps</span>
            <span>·</span>
            <span>{duration}</span>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {fft && (
            <Badge variant={fft.mv_match_count > 0 ? "destructive" : "secondary"} className="text-[11px] gap-1">
              <Zap className="h-3 w-3" />
              {fft.mv_match_count}/{fft.mv_total} Master Vars
            </Badge>
          )}
          {flash?.flash_frequency && (
            <Badge variant={flash.strobe_signature_matches.length > 0 ? "destructive" : "outline"} className="text-[11px] gap-1">
              <Activity className="h-3 w-3" />
              {flash.flash_frequency.flash_count} pulses @ {flash.flash_frequency.estimated_freq_hz?.toFixed(4)} Hz
            </Badge>
          )}
          {flash?.strobe_signature_matches.map(m => (
            <Badge key={m.name} variant="destructive" className="text-[11px] gap-1">
              <AlertTriangle className="h-3 w-3" />
              {m.name}
            </Badge>
          ))}
          {vis?.analysis && (
            <Badge variant="outline" className="text-[11px] gap-1">
              <Eye className="h-3 w-3" />
              AI: {vis.model_used ?? vis.model ?? "Gemini"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="fft">
          <TabsList className="h-8 text-xs mb-4">
            <TabsTrigger value="fft" className="text-xs px-3 h-7">FFT Analysis</TabsTrigger>
            <TabsTrigger value="flash" className="text-xs px-3 h-7">Flash Pattern</TabsTrigger>
            <TabsTrigger value="vision" className="text-xs px-3 h-7">Vision AI</TabsTrigger>
            <TabsTrigger value="frames" className="text-xs px-3 h-7">Frames</TabsTrigger>
          </TabsList>

          {/* ── FFT Tab ── */}
          <TabsContent value="fft" className="space-y-4 mt-0">
            {fftQ.isLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading FFT data…
              </div>
            ) : fft ? (
              <>
                {/* Audio stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Duration",    val: `${fft.stats.duration_s.toFixed(2)}s` },
                    { label: "Sample Rate", val: `${(fft.stats.sample_rate/1000).toFixed(0)} kHz` },
                    { label: "RMS",         val: `${fft.stats.rms_db.toFixed(1)} dB` },
                    { label: "Peak",        val: `${fft.stats.peak_db.toFixed(1)} dB` },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col p-2 rounded border bg-muted/20 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                      <span className="font-mono text-sm font-semibold mt-0.5">{s.val}</span>
                    </div>
                  ))}
                </div>

                {/* Spectrum plots */}
                {fft.lf_spectrum.length > 0 && (
                  <SpectrumPlot
                    data={fft.lf_spectrum}
                    title="Low-Frequency Spectrum (0–120 Hz) — Master Variable Zone"
                    highlight={mvHighlight.filter(f => f <= 120)}
                  />
                )}
                {fft.mid_spectrum && fft.mid_spectrum.length > 0 && (
                  <SpectrumPlot
                    data={fft.mid_spectrum}
                    title="Mid-Band Spectrum (1–500 Hz)"
                    highlight={mvHighlight.filter(f => f <= 500)}
                  />
                )}

                {/* Master variable hits */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Master Variable Cross-Reference ({fft.mv_match_count} matches)
                  </p>
                  {fft.master_variable_hits.length > 0 ? (
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-xs" data-testid="table-mv-hits">
                        <thead className="bg-muted/30">
                          <tr className="border-b">
                            <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">Variable</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Target Hz</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Detected Hz</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Δ Hz</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">dB</th>
                            <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fft.master_variable_hits.map((h, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-muted/10">
                              <td className="py-1.5 px-2 font-mono text-[11px]">{h.master_var}</td>
                              <td className="py-1.5 px-2 text-right font-mono">{h.target_hz.toFixed(3)}</td>
                              <td className="py-1.5 px-2 text-right font-mono font-semibold">{h.detected_hz.toFixed(3)}</td>
                              <td className={`py-1.5 px-2 text-right font-mono ${Math.abs(h.delta_hz) < 1 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                                {h.delta_hz > 0 ? "+" : ""}{h.delta_hz.toFixed(3)}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{h.db.toFixed(1)}</td>
                              <td className="py-1.5 px-2 text-center">
                                <Badge variant={h.match === "CONFIRMED" ? "destructive" : "secondary"} className="text-[10px] py-0">
                                  {h.match}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border rounded p-3 text-sm text-muted-foreground text-center bg-muted/10">
                      No Master Variable hits in top 40 peaks (tolerance ±2.5 Hz)
                    </div>
                  )}
                </div>

                {/* Top peaks */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Top Spectral Peaks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {fft.top_peaks.slice(0, 20).map((p, i) => (
                      <div key={i} className="flex flex-col items-center px-2 py-1 border rounded bg-muted/20 text-center min-w-[60px]" data-testid={`badge-peak-${i}`}>
                        <span className="font-mono text-xs font-semibold">{p.freq_hz.toFixed(1)} Hz</span>
                        <span className="text-[10px] text-muted-foreground">{p.db.toFixed(1)} dB</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => rerunFFT.mutate()} disabled={rerunFFT.isPending} data-testid="button-rerun-fft">
                    {rerunFFT.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Re-run FFT
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">FFT data unavailable</p>
            )}
          </TabsContent>

          {/* ── Flash Pattern Tab ── */}
          <TabsContent value="flash" className="space-y-4 mt-0">
            {flashQ.isLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading flash data…
              </div>
            ) : flash ? (
              <>
                {/* Luminance stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Mean Lum",    val: flash.luminance_stats.mean.toFixed(1) },
                    { label: "Std Dev",     val: flash.luminance_stats.std.toFixed(1) },
                    { label: "Dyn Range",   val: flash.luminance_stats.dynamic_range.toFixed(1) },
                    { label: "Pulses Det.", val: String(flash.flash_pulses.length) },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col p-2 rounded border bg-muted/20 text-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                      <span className="font-mono text-sm font-semibold mt-0.5">{s.val}</span>
                    </div>
                  ))}
                </div>

                {/* Strobe signature matches */}
                {flash.strobe_signature_matches.length > 0 && (
                  <div className="border border-destructive/30 rounded p-3 bg-destructive/5">
                    <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Strobe Signature Match{flash.strobe_signature_matches.length > 1 ? "es" : ""}
                    </p>
                    {flash.strobe_signature_matches.map((m, i) => (
                      <div key={i} className="text-xs space-y-0.5">
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-muted-foreground font-mono">
                          Target {m.freq_hz} Hz → Detected {m.detected_hz?.toFixed(4)} Hz (Δ {m.delta_hz > 0 ? "+" : ""}{m.delta_hz?.toFixed(4)})
                        </p>
                        {m.note && <p className="text-muted-foreground">{m.note}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Flash frequency summary */}
                {flash.flash_frequency && (
                  <div className="border rounded p-3 bg-muted/10 text-xs space-y-1">
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <Radio className="h-4 w-4" />
                      Flash Frequency Analysis
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {[
                        { label: "Count",      val: String(flash.flash_frequency.flash_count) },
                        { label: "Est. Freq",  val: `${flash.flash_frequency.estimated_freq_hz?.toFixed(4)} Hz` },
                        { label: "Mean Intv.", val: `${flash.flash_frequency.mean_interval_s.toFixed(3)} s` },
                        { label: "Regularity", val: `${flash.flash_frequency.regularity_pct.toFixed(1)}%` },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col p-2 rounded border bg-background text-center">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                          <span className="font-mono text-sm font-semibold mt-0.5">{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Luminance sparkline */}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Luminance Timeline — <span className="text-primary">pulses highlighted</span> · <span className="text-destructive">red = sharp transition</span>
                  </p>
                  <LumSparkline
                    timeline={flash.timeline}
                    pulses={flash.flash_pulses}
                    sharpTransitions={flash.sharp_transitions}
                  />
                </div>

                {/* Sharp transitions */}
                {flash.sharp_transitions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Sharp Luminance Transitions (abrupt on/off events)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {flash.sharp_transitions.map((t, i) => (
                        <div key={i} className="border border-destructive/30 rounded px-2 py-1 bg-destructive/5 text-xs font-mono" data-testid={`badge-transition-${i}`}>
                          t={t.t.toFixed(2)}s · Δ={t.delta.toFixed(1)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flash pulses */}
                {flash.flash_pulses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Detected Flash Pulses ({flash.flash_pulses.length})
                    </p>
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-xs" data-testid="table-flash-pulses">
                        <thead className="bg-muted/30">
                          <tr className="border-b">
                            <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">#</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">t_start</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">t_peak</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">t_end</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Duration</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Peak Lum</th>
                            <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">+Mean</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flash.flash_pulses.map((p, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-muted/10">
                              <td className="py-1.5 px-2 text-muted-foreground">{i + 1}</td>
                              <td className="py-1.5 px-2 text-right font-mono">{p.t_start.toFixed(3)}s</td>
                              <td className="py-1.5 px-2 text-right font-mono font-semibold">{p.t_peak.toFixed(3)}s</td>
                              <td className="py-1.5 px-2 text-right font-mono">{p.t_end.toFixed(3)}s</td>
                              <td className="py-1.5 px-2 text-right font-mono">{p.duration_s.toFixed(3)}s</td>
                              <td className="py-1.5 px-2 text-right font-mono">{p.peak_lum.toFixed(1)}</td>
                              <td className="py-1.5 px-2 text-right font-mono text-primary">+{p.mean_excess.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Flash analysis data unavailable</p>
            )}
          </TabsContent>

          {/* ── Vision AI Tab ── */}
          <TabsContent value="vision" className="space-y-4 mt-0">
            {visQ.isLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading vision analysis…
              </div>
            ) : vis ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Model: <span className="font-mono font-medium">{vis.model_used ?? vis.model ?? "unknown"}</span></span>
                    <span>·</span>
                    <span>{vis.frames_analyzed?.length ?? 0} key frames analyzed</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => rerunVision.mutate()} disabled={rerunVision.isPending} data-testid="button-rerun-vision">
                    {rerunVision.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Re-analyze
                  </Button>
                </div>

                {vis.frames_analyzed && (
                  <div className="flex flex-wrap gap-1.5">
                    {vis.frames_analyzed.map(f => (
                      <Badge key={f} variant="outline" className="text-[10px] font-mono">{f}</Badge>
                    ))}
                  </div>
                )}

                {visText ? (
                  <ScrollArea className="h-[500px] border rounded">
                    <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono text-xs" data-testid="text-vision-analysis">
                      {visText}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="border rounded p-6 text-center text-muted-foreground text-sm">
                    Vision analysis not available. Click Re-analyze to run.
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-sm text-muted-foreground">Vision analysis not yet run.</p>
                <Button variant="outline" size="sm" onClick={() => rerunVision.mutate()} disabled={rerunVision.isPending} data-testid="button-run-vision">
                  {rerunVision.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Run Vision Analysis
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Frames Tab ── */}
          <TabsContent value="frames" className="mt-0">
            {framesQ.isLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading frames…
              </div>
            ) : frames && frames.frames.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{frames.count} frames extracted</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5" data-testid="grid-frames">
                  {frames.frames.map((src, i) => {
                    const tSec = (i * (flash?.duration_s ?? 30)) / (frames.frames.length - 1 || 1);
                    const isSharp = flash?.sharp_transitions.some(t => Math.abs(t.t - tSec) < (1 / (flash?.fps_analyzed ?? 2) + 0.1));
                    const isPulse = flash?.flash_pulses.some(p => tSec >= p.t_start && tSec <= p.t_end);
                    return (
                      <div key={i} className={`relative rounded overflow-hidden border ${isPulse ? "border-primary" : isSharp ? "border-destructive" : "border-border/40"}`} data-testid={`img-frame-${i}`}>
                        <img src={src} alt={`Frame ${i + 1}`} className="w-full object-cover" loading="lazy" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-mono">
                          {tSec.toFixed(1)}s
                        </div>
                        {isSharp && (
                          <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-destructive" title="Sharp transition" />
                        )}
                        {isPulse && !isSharp && (
                          <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary" title="Flash pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />flash pulse ·
                  <span className="inline-block w-2 h-2 rounded-full bg-destructive mx-1" />sharp transition
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No extracted frames available</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ── cross-video comparison ──────────────────────────────────────────────── */
function CrossVideoComparison() {
  const fft1 = useQuery<FFTResult>({ queryKey: ["/api/video-forensics/fft"] });
  const fft2 = useQuery<FFTResult>({ queryKey: ["/api/video-forensics/vid2-fft"] });
  const f1 = fft1.data; const f2 = fft2.data;
  if (!f1 && !f2) return null;

  const allMV = Array.from(new Set([
    ...(f1?.master_variable_hits.map(h => h.master_var) ?? []),
    ...(f2?.master_variable_hits.map(h => h.master_var) ?? []),
  ]));

  if (!allMV.length) return null;

  return (
    <Card data-testid="card-cross-comparison">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Cross-Video Master Variable Correlation
        </CardTitle>
        <CardDescription>Signatures present in both recordings strengthen evidentiary weight</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-xs" data-testid="table-cross-mv">
            <thead className="bg-muted/30">
              <tr className="border-b">
                <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">Master Variable</th>
                <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Target Hz</th>
                <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">VID-1 (1080p 24fps)</th>
                <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">VID-2 (4K 60fps)</th>
                <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Cross-Confirm</th>
              </tr>
            </thead>
            <tbody>
              {allMV.map(mv => {
                const h1 = f1?.master_variable_hits.find(h => h.master_var === mv);
                const h2 = f2?.master_variable_hits.find(h => h.master_var === mv);
                const both = !!(h1 && h2);
                const tgt = (h1 ?? h2)!.target_hz;
                return (
                  <tr key={mv} className={`border-b border-border/40 ${both ? "bg-destructive/5" : ""}`}>
                    <td className="py-1.5 px-2 font-mono text-[11px]">{mv}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{tgt.toFixed(3)}</td>
                    <td className="py-1.5 px-2 text-center">
                      {h1 ? (
                        <span className="text-green-600 dark:text-green-400 font-mono text-[11px]">
                          {h1.detected_hz.toFixed(3)} Hz ({h1.match})
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {h2 ? (
                        <span className="text-green-600 dark:text-green-400 font-mono text-[11px]">
                          {h2.detected_hz.toFixed(3)} Hz ({h2.match})
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {both ? (
                        <Badge variant="destructive" className="text-[10px]">DUAL CONFIRM</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Single</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── main page ───────────────────────────────────────────────────────────── */
export default function VideoForensicsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-video-forensics">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
          <span>EVIDENCE</span>
          <ChevronRight className="h-3 w-3" />
          <span>VIDEO FORENSICS VAULT</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Video Forensics Vault</h1>
        <p className="text-sm text-muted-foreground">
          Live field recordings from Jacó, Costa Rica balcony. Aerial platform observed — FFT audio analysis, flash pattern detection,
          and AI visual assessment cross-referenced against 21 Master Variable signatures.
        </p>
      </div>

      {/* summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Video,     label: "Recordings",       val: "2",         sub: "30s + 16.5s" },
          { icon: Zap,       label: "MV Detections",    val: "4",         sub: "across both files" },
          { icon: Activity,  label: "Flash Pulses",     val: "11",        sub: "0.5714 Hz est." },
          { icon: AlertTriangle, label: "Sig Matches",  val: "FAA 107",   sub: "0.5 Hz strobe" },
        ].map(s => (
          <Card key={s.label} className="p-3" data-testid={`stat-${s.label.replace(/\s/g,"-").toLowerCase()}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-lg font-semibold font-mono">{s.val}</p>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* forensic note */}
      <div className="border border-amber-500/30 rounded-lg p-3 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Field observation context: </span>
          Balcony, Jacó Costa Rica. Aerial platform with blinking light observed. AC grid coupling confirmed at 59.971–60.417 Hz
          (CR standard 60 Hz). Theta carrier probable at 54 Hz. Flash strobe at 0.5714 Hz matches FAA Part 107 anti-collision requirement
          with +0.07 Hz positive offset — consistent with modified/commercial drone. Gemini 2.0 Flash vision assessment: white/yellowish point source,
          intermittent illumination, deliberate obscuration events at t≈7s and t≈23s. Palm-tree scale reference indicates several hundred meters altitude.
        </div>
      </div>

      {/* Video 1 */}
      <VideoCard
        label="VID-1 — Balcony Observation"
        filename="IMG_0084_1779253304057.mov"
        resolution="1080p"
        fps={24}
        duration="30.55s"
        fftEndpoint="/api/video-forensics/fft"
        flashEndpoint="/api/video-forensics/flash"
        visionEndpoint="/api/video-forensics/vision"
        framesEndpoint="/api/video-forensics/frames"
        rerunFftEndpoint="/api/video-forensics/rerun-fft"
        rerunVisionEndpoint="/api/video-forensics/rerun-vision"
      />

      {/* Video 2 */}
      <VideoCard
        label="VID-2 — 4K Follow-up Recording"
        filename="IMG_0085_1779253681665.mov"
        resolution="4K (3840×2160)"
        fps={60}
        duration="16.48s"
        badge="HIGH RES"
        fftEndpoint="/api/video-forensics/vid2-fft"
        flashEndpoint="/api/video-forensics/vid2-flash"
        visionEndpoint="/api/video-forensics/vid2-vision"
        framesEndpoint="/api/video-forensics/frames2"
        rerunFftEndpoint="/api/video-forensics/rerun-fft2"
        rerunVisionEndpoint="/api/video-forensics/rerun-vision2"
      />

      {/* Cross-comparison */}
      <CrossVideoComparison />
    </div>
  );
}
