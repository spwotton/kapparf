import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Wand2, Download, ZoomIn, X, AlertTriangle, Radio, Satellite, Plane,
  Activity, Clock, MapPin, Signal, Shield, ChevronRight, ExternalLink,
  FileText, Mic, Eye, Wifi, Database
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface KappaStatus { score: number; level: string; correlations: number; events: number; }
interface KappaEvent { id: number; type: string; source: string; description: string; severity: string; timestamp: string; }
interface Correlation { id: number; type: string; description: string; confidence: number; severity: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────
function ZoomImg({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src} alt={alt} onClick={() => setOpen(true)}
        className={`cursor-zoom-in object-cover w-full ${className}`}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setOpen(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setOpen(false)}><X className="h-6 w-6" /></button>
          <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}

function EvidenceCard({ src, title, date, download, desc }: { src: string; title: string; date?: string; download?: string; desc?: string }) {
  return (
    <div className="bg-card/50 border border-border rounded-sm overflow-hidden flex flex-col group">
      <div className="relative overflow-hidden aspect-[4/3] bg-muted/20">
        <ZoomImg src={src} alt={title} className="group-hover:scale-105 transition-transform duration-300 h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <ZoomIn className="h-4 w-4 text-white ml-auto" />
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="text-xs font-semibold text-foreground leading-tight">{title}</div>
        {date && <div className="text-[10px] text-muted-foreground/60 font-mono">{date}</div>}
        {desc && <div className="text-[10px] text-muted-foreground/70 leading-relaxed mt-1">{desc}</div>}
        {download && (
          <a href={download} download className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors">
            <Download className="h-3 w-3" /> Download
          </a>
        )}
      </div>
    </div>
  );
}

function DocCard({ href, title, size, desc, icon: Icon = FileText }: { href: string; title: string; size?: string; desc?: string; icon?: any }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 bg-card/40 border border-border rounded-sm hover:border-primary/40 hover:bg-card/60 transition-colors group">
      <Icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-xs font-semibold text-foreground truncate">{title}</div>
        {size && <div className="text-[10px] text-muted-foreground/50 font-mono">{size}</div>}
        {desc && <div className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{desc}</div>}
      </div>
      <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary ml-auto mt-0.5 flex-shrink-0" />
    </a>
  );
}

function StatBadge({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`text-center px-4 py-3 rounded-sm border ${accent ? "border-amber-800/40 bg-amber-950/20" : "border-border bg-card/30"}`}>
      <div className={`text-xl font-black font-mono ${accent ? "text-amber-400" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function LiveKappa() {
  const { data: kappa } = useQuery<KappaStatus>({ queryKey: ["/api/kappa/status"], refetchInterval: 30000 });
  const { data: events } = useQuery<KappaEvent[]>({ queryKey: ["/api/events"], select: (d: any) => Array.isArray(d) ? d.slice(0, 5) : [] });
  const { data: corrs } = useQuery<Correlation[]>({ queryKey: ["/api/correlations"], select: (d: any) => Array.isArray(d) ? d.slice(0, 4) : [] });
  const score = kappa?.score ?? 0;
  const color = score >= 70 ? "text-red-400" : score >= 40 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="bg-card/40 border border-border rounded-sm p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">KAPPA Engine — Live</span>
        </div>
        <div className={`ml-auto text-2xl font-black font-mono ${color}`}>{score}<span className="text-xs text-muted-foreground/40 font-normal ml-0.5">/100</span></div>
        <Badge variant={score >= 70 ? "destructive" : "outline"} className="text-[10px] rounded-none font-mono">{kappa?.level ?? "—"}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-muted-foreground/60">
        <div>{(kappa?.events ?? 0).toLocaleString()} <span className="block text-[9px] opacity-60">events</span></div>
        <div>{(kappa?.correlations ?? 0).toLocaleString()} <span className="block text-[9px] opacity-60">correlations</span></div>
        <div>{corrs?.length ?? 0} <span className="block text-[9px] opacity-60">active rules</span></div>
      </div>
      {events && events.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-border/50 pt-3">
          {events.map((ev, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <span className={`px-1 rounded font-bold flex-shrink-0 ${ev.severity === "critical" ? "bg-red-900/60 text-red-300" : ev.severity === "high" ? "bg-amber-900/60 text-amber-300" : "bg-muted text-muted-foreground"}`}>{ev.severity?.slice(0,3).toUpperCase()}</span>
              <span className="text-muted-foreground/70 truncate">{ev.description}</span>
              <span className="text-muted-foreground/40 font-mono flex-shrink-0">{ev.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiWand({ chapter, context }: { chapter: string; context: string }) {
  const [result, setResult] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useMutation({
    mutationFn: () => apiRequest("POST", "/api/intel/wand", { chapter, context }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      setResult(data.synthesis ?? data.error ?? "No synthesis returned.");
      setOpen(true);
    },
  });
  return (
    <div className="my-6">
      <Button
        onClick={() => mutate()}
        disabled={isPending}
        variant="outline"
        className="gap-2 border-amber-800/50 text-amber-400 hover:bg-amber-950/30 hover:border-amber-600 text-xs"
        data-testid={`button-wand-${chapter.toLowerCase().replace(/\s/g, "-")}`}
      >
        <Wand2 className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Synthesizing…" : "AI Synthesis — Link all evidence"}
      </Button>
      {open && result && (
        <div className="mt-4 bg-amber-950/10 border border-amber-800/30 rounded-sm p-5 relative">
          <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-muted-foreground/40 hover:text-muted-foreground"><X className="h-4 w-4" /></button>
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest">GPT-4o-mini SIGINT Synthesis — {chapter}</span>
          </div>
          <div className="text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-wrap font-serif">{result}</div>
        </div>
      )}
    </div>
  );
}

// ── Language popup ─────────────────────────────────────────────────────────────
function LangPopup({ onSelect }: { onSelect: (l: "en" | "es") => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-sm p-8 max-w-sm w-full mx-4 text-center">
        <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4">CIA JW / CIAJW.COM</div>
        <h2 className="text-xl font-serif font-bold text-foreground mb-1 leading-tight">Intelligence Report</h2>
        <p className="text-sm text-muted-foreground/70 mb-6">Choose a language to continue / Elige un idioma para continuar</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => onSelect("en")} variant="outline" className="flex-1" data-testid="button-lang-en">English</Button>
          <Button onClick={() => onSelect("es")} variant="outline" className="flex-1" data-testid="button-lang-es">Español</Button>
        </div>
      </div>
    </div>
  );
}

// ── Chapter definitions ────────────────────────────────────────────────────────
const CHAPTERS = [
  { id: "breaking", label: "BREAKING", sub: "June 18 2026 — Last Night", icon: AlertTriangle, accent: "text-red-400 border-red-800/40" },
  { id: "pochote", label: "POCHOTE GRANDE", sub: "May–June 2026", icon: Radio, accent: "text-amber-400 border-amber-800/40" },
  { id: "flamboyant", label: "FLAMBOYANT ERA", sub: "Early 2026", icon: Eye, accent: "text-orange-400 border-orange-800/40" },
  { id: "jaco-nexus", label: "JACO NEXUS", sub: "2025–2026 Origin", icon: MapPin, accent: "text-violet-400 border-violet-800/40" },
  { id: "signals", label: "SIGNALS", sub: "All Dates", icon: Signal, accent: "text-cyan-400 border-cyan-800/40" },
  { id: "network", label: "THE NETWORK", sub: "Actors & Orgs", icon: Database, accent: "text-emerald-400 border-emerald-800/40" },
  { id: "archive", label: "ARCHIVE", sub: "All Evidence", icon: Download, accent: "text-blue-400 border-blue-800/40" },
] as const;

// ── Chapter content components ─────────────────────────────────────────────────

function ChapterBreaking({ lang }: { lang: "en" | "es" }) {
  const context = `Recording 49 — Hotel Pochote Grande, June 18 2026, 00:04 UTC (final night).
FFT Analysis: Dominant peak at 57.28 Hz (-50 dBFS) — neither 50 Hz (EU) nor 60 Hz (CR). Full 8-harmonic series confirmed: 57→113→169→230→285→341→399→455 Hz.
120 Hz (2x60Hz mains) is the strongest electrical peak at -49.56 dBFS — stronger than the 60Hz fundamental, indicating nonlinear active RF equipment (powered antenna system).
50 Hz (European standard — German-owned hotel) also present at -72.43 dBFS throughout recording.
Dog impact band 20-200 Hz: -54.49 dBFS continuous for all 24.55 seconds — never drops to noise floor.
Jorge the hotel dog: exhibiting constant distress (barking). Tail tumor removed — chronic ELF exposure biomarker.
Hotel staff: unable to sleep/eat — textbook chronic LF exposure syndrome.
Adversary profile: German-connected ownership, parabolic antenna on hotel building, 57 Hz is deliberately offset from standard mains to avoid detection by standard EMF meters.`;

  return (
    <div>
      <div className="bg-red-950/20 border border-red-800/40 rounded-sm p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
        <div>
          <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-1">Recorded 2026-06-18 00:04:22 UTC — Final Night</div>
          <p className="text-sm text-muted-foreground/80 leading-relaxed">
            {lang === "es"
              ? "Análisis FFT de la Grabación 49 capturada el último momento en el Hotel Pochote Grande. Señal anómala de 57.28 Hz identificada — no corresponde a 50 Hz europeo ni 60 Hz costarricense. Serie de 8 armónicos confirmada."
              : "FFT analysis of Recording 49, captured at 00:04 UTC on Sam's final night at Hotel Pochote Grande. A 57.28 Hz anomalous signal — matching neither Costa Rican (60 Hz) nor European (50 Hz) mains standard — was identified with a confirmed 8-harmonic series."}
          </p>
        </div>
      </div>

      <LiveKappa />

      <Accordion type="multiple" defaultValue={["fft", "dog", "staff"]} className="space-y-1">
        <AccordionItem value="fft" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-red-400" />57.28 Hz Anomalous Signal — Full 8-Harmonic Series</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <StatBadge label="Dominant peak" value="57.28 Hz" accent />
              <StatBadge label="Signal level" value="−50 dBFS" accent />
              <StatBadge label="Harmonics" value="8 confirmed" accent />
              <StatBadge label="Country standard" value="60 Hz CR" />
            </div>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground/60 font-mono">Harmonic</th>
                    <th className="text-right p-2 text-muted-foreground/60 font-mono">Expected (Hz)</th>
                    <th className="text-right p-2 text-muted-foreground/60 font-mono">Measured (Hz)</th>
                    <th className="text-right p-2 text-muted-foreground/60 font-mono">Level (dBFS)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [1, 57.28, 57.28, -50.00, "★ FUNDAMENTAL"],
                    [2, 114.56, 112.93, -56.75, ""],
                    [3, 171.84, 169.03, -58.68, ""],
                    [4, 229.12, 229.90, -60.13, ""],
                    [5, 286.40, 285.02, -61.42, ""],
                    [6, 343.68, 340.83, -65.13, ""],
                    [7, 400.96, 399.09, -63.34, ""],
                    [8, 458.24, 454.99, -66.62, ""],
                  ].map(([n, exp, meas, db, tag]) => (
                    <tr key={String(n)} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="p-2 font-mono text-muted-foreground/80">{n}×</td>
                      <td className="p-2 text-right font-mono text-muted-foreground/60">{String(exp)}</td>
                      <td className="p-2 text-right font-mono text-foreground">{String(meas)}</td>
                      <td className="p-2 text-right font-mono text-amber-400">{String(db)} {tag && <span className="text-red-400 text-[9px] ml-1">{String(tag)}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <EvidenceCard
                src="/evidence/spectrogram_rec49.png"
                title="Recording 49 Spectrogram — 0–500 Hz"
                date="2026-06-18 00:04:22 UTC"
                download="/evidence/spectrogram_rec49.png"
                desc="Full spectral map showing 57 Hz fundamental + harmonic family. 120 Hz mains anomaly visible."
              />
              <div className="bg-card/40 border border-border rounded-sm p-4">
                <div className="text-xs font-bold text-foreground mb-3">Why 57 Hz is Anomalous</div>
                <ul className="text-xs text-muted-foreground/80 space-y-2">
                  <li className="flex gap-2"><span className="text-red-400 flex-shrink-0">▸</span>CR standard is 60 Hz — 57 Hz requires an active oscillator</li>
                  <li className="flex gap-2"><span className="text-red-400 flex-shrink-0">▸</span>8-harmonic series = coherent driven source, not passive EMI</li>
                  <li className="flex gap-2"><span className="text-red-400 flex-shrink-0">▸</span>~5% offset from 60 Hz avoids standard EMF meters (50/60 Hz only)</li>
                  <li className="flex gap-2"><span className="text-red-400 flex-shrink-0">▸</span>120 Hz stronger than 60 Hz fundamental = active RF device nonlinear load</li>
                  <li className="flex gap-2"><span className="text-red-400 flex-shrink-0">▸</span>50 Hz European also present — consistent with German-standard equipment</li>
                </ul>
                <a href="/evidence/recording49_fft_report.md" download className="mt-3 flex items-center gap-1 text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors">
                  <Download className="h-3 w-3" /> Download Full FFT Report (MD)
                </a>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dog" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-orange-400" />Jorge — Canine Biomarker & Continuous ELF Exposure</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <StatBadge label="Dog impact band avg" value="−54.49 dBFS" accent />
              <StatBadge label="Recording segments with signal" value="25/25" accent />
              <StatBadge label="Tail tumor removed" value="Confirmed" />
            </div>
            <div className="text-sm text-muted-foreground/80 leading-relaxed space-y-3 mb-4">
              <p>The 20–200 Hz energy band — the primary canine physiological impact zone — maintained an average of −54.49 dBFS across all 25 temporal segments of the 24.55-second recording. It never dropped to noise floor.</p>
              <p>The 57.28 Hz dominant signal falls in the range known to cause involuntary vestibular activation in dogs: disorientation, elevated cortisol, and persistent unexplained barking. The dog cannot locate or adapt to the source because it is below the directional hearing threshold and conducted through bone structure.</p>
              <p>Jorge's tail tumor (surgically removed) is consistent with chronic ELF-band exposure. ELF-EMF fields are classified IARC Group 2B (possibly carcinogenic). The hotel dog sleeping near the antenna installation, in a continuous −54 dBFS 20–200 Hz field, represents a longitudinal biological exposure marker.</p>
              <p className="text-amber-400/80 font-semibold">The barking being blamed on Sam is the plausible deniability mechanism. The causal chain is measurable: 57 Hz oscillator → continuous sub-bass field → involuntary canine distress → apparent misbehavior → blame displacement.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="staff" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-yellow-400" />Staff Health — Chronic LF Exposure Syndrome</span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">The hotel staff member sleeping adjacent to the antenna installation has reported inability to sleep and eat. These are textbook symptoms of Chronic Low-Frequency Noise Exposure (CLFNE), documented in occupational health literature for workers near industrial LF sources at ≥40 dB SPL in-room — equivalent to the field levels measured in this recording.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ["Sleep disruption", "LF noise below 200 Hz at ≥40 dB SPL measurably reduces Stage 3 deep sleep"],
                ["Appetite change", "Chronic cortisol elevation from LF stress reduces appetite and metabolic regulation"],
                ["Fatigue", "Documented in occupational health for workers near industrial LF sources"],
                ["Cannot locate source", "Below ~80 Hz, human hearing cannot directionally locate sound — creates 'nothing there' perception"],
              ].map(([t, d]) => (
                <div key={t} className="bg-card/40 border border-border rounded-sm p-3">
                  <div className="text-xs font-bold text-foreground mb-1">{t}</div>
                  <div className="text-[10px] text-muted-foreground/70 leading-relaxed">{d}</div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AiWand chapter="Breaking — Recording 49 / June 18 2026" context={context} />
      <DocCard href="/evidence/recording49_fft_report.md" title="Recording 49 — Full FFT Forensic Report" size="15 KB • MD" desc="Complete spectral analysis: band RMS, 30-peak table, 8-harmonic verification, temporal map, canine/staff bioeffect analysis" icon={FileText} />
    </div>
  );
}

function ChapterPochote({ lang }: { lang: "en" | "es" }) {
  const context = `Hotel Pochote Grande — 30-day surveillance operation May 17–June 17 2026.
Six confirmed surveillance positions: La Flor units 23/24/25, La Flor unit 9 (Genesis Peralta former residence, only unit with 3rd-floor roof deck + direct LOS to Room 10), Central antenna position, Crocs western observation post, Vista Las Palmas (Dan Wagner, red lights on roof = possible antenna array), Hotel corner unit (masked individual photographed on porch = confirmed operative).
Parabolic antenna: rotating dish mounted on hotel building, 39 high-resolution photos documented.
BLE RSSI forensics: truck CL273123 at ~45m + 2 walls → expected RSSI ~-116 dBm (below noise floor). Hotel corner unit primary suspect for -20 dBm peak in Room 10.
SINPE fraud: SINPE transfers May 16 (247k CRC) and May 29 (370k CRC) extracted from Sam. Handwritten note June 13 demands additional payment.
German connection: Wolfgang Hilbich (former German military) and hotel owners connected. Magdalena employed Genesis Peralta for cash.
Drone transits: 9 confirmed nights with aerial presence. Approach vector SW = consistent with Esterillos Oeste location of Russian national "S."
KAPPA correlation rules firing: KiwiSDR TI0RC anomalies, ELF/VLF time-domain correlation, satellite pass overlaps.`;

  const antennaPhotos = Array.from({ length: 12 }, (_, i) =>
    ({ src: `/evidence/boom/antenna/a${String(i + 1).padStart(3, "0")}.jpg`, title: `Antenna Photo ${i + 1}`, date: "May–June 2026" })
  );

  return (
    <div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 font-serif">
        {lang === "es"
          ? "Treinta días documentados de operación de vigilancia multi-dominio en el Hotel Pochote Grande, Jacó. Antena parabólica rotatoria, seis posiciones de vigilancia confirmadas, fraude SINPE, y correlaciones de señales en tiempo real."
          : "Thirty days of documented multi-domain surveillance at Hotel Pochote Grande, Jacó Beach. A rotating parabolic dish antenna, six confirmed surveillance positions ringing Room 10, SINPE financial fraud, and continuous real-time signal correlations across the KAPPA engine."}
      </p>

      <LiveKappa />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        <StatBadge label="Days monitored" value="30" accent />
        <StatBadge label="Surveillance positions" value="6" accent />
        <StatBadge label="Antenna photos" value="39" />
        <StatBadge label="Drone nights" value="9" />
        <StatBadge label="SINPE extractions" value="617K CRC" accent />
        <StatBadge label="BLE exclusions" value="CL273123" />
      </div>

      <Accordion type="multiple" defaultValue={["antenna", "positions"]} className="space-y-1">
        <AccordionItem value="antenna" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-amber-400" />Parabolic Antenna System — 39 Photos</span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground/70 leading-relaxed mb-4">Unlicensed rotating parabolic dish antenna documented on the hotel property structure. 39 sequential frames across multiple observation sessions showing rotation events and antenna positioning relative to Room 10.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
              {antennaPhotos.map((p, i) => (
                <EvidenceCard key={i} src={p.src} title={p.title} date={p.date} download={p.src} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 font-mono">Showing 12 of 39 frames. Full sequence: /evidence/boom/antenna/a001.jpg – a039.jpg</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="positions" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-amber-400" />Six Surveillance Positions — Aerial Map</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <EvidenceCard
                src="/evidence/pochote_surveillance_network_aerial.jpeg"
                title="Surveillance Network Aerial — All 6 Positions"
                date="June 2026" download="/evidence/pochote_surveillance_network_aerial.jpeg"
                desc="Wider aerial showing La Flor units, central antenna, Crocs western OP, and Vista Las Palmas."
              />
              <EvidenceCard
                src="/evidence/room10_aerial_geometry.jpeg"
                title="Room 10 Aerial Geometry"
                date="June 2026" download="/evidence/room10_aerial_geometry.jpeg"
                desc="Apple Maps aerial showing Room 10 (blue dot) and truck parking lot. LOS analysis to each surveillance position."
              />
            </div>
            <div className="space-y-2">
              {[
                { n: 1, label: "La Flor units 23/24/25", detail: "Large private houses (~2400 sq ft, 3 floors), NE of hotel. Primary elevated collection point.", color: "bg-red-500" },
                { n: 2, label: "La Flor unit 9", detail: "Genesis Peralta's former residence. Only unit with 3rd-floor roof deck — direct LOS to Sam's balcony.", color: "bg-orange-500" },
                { n: 3, label: "Central antenna position", detail: "Middle X in aerial. Closest elevated RF emitter. Parabolic dish mounted here.", color: "bg-amber-500" },
                { n: 4, label: "Crocs — western OP", detail: "Western observation post. Documented night photography.", color: "bg-yellow-500" },
                { n: 5, label: "Vista Las Palmas", detail: "One of tallest buildings in Jacó. Dan Wagner. Top-floor panel suite. Red lights on roof = antenna array.", color: "bg-purple-500" },
                { n: 6, label: "Hotel corner unit", detail: "Across courtyard. Masked individual photographed on porch — confirmed operative. Primary BLE source suspect.", color: "bg-red-700" },
              ].map(pos => (
                <div key={pos.n} className="flex items-start gap-3 bg-card/30 border border-border rounded-sm p-3">
                  <span className={`h-5 w-5 rounded-full ${pos.color} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5`}>{pos.n}</span>
                  <div>
                    <div className="text-xs font-bold text-foreground">{pos.label}</div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">{pos.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ble" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Wifi className="h-3.5 w-3.5 text-cyan-400" />BLE/RSSI Forensics — Truck CL273123 Excluded</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatBadge label="Measured RSSI peak" value="−20 dBm" accent />
              <StatBadge label="Expected at 45m + walls" value="−116 dBm" />
              <StatBadge label="Difference" value="96 dB" accent />
              <StatBadge label="Primary suspect" value="Corner unit" />
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">Path loss forensics: truck CL273123 at ~45m + 2 walls produces an expected RSSI of ~−116 dBm (below noise floor). The −20 dBm peak recorded in Room 10 requires a source within ~1.4m (standard BLE TX) or ~11cm (+20 dBm TX). The hotel corner unit directly across the courtyard is the primary suspect.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["rssi_spike_10h50_20260607_072008.png", "rssi_baseline_10h50_20260607_072008.png", "ble_IMG_0630_20260607.png", "rssi_1050_master_spike.png", "rssi_1050_baseline.png", "vehicle_CL273123_20260607_072008.jpeg"].map((f, i) => (
                <EvidenceCard key={i} src={`/evidence/${f}`} title={f.split("_").slice(0, 3).join(" ")} date="June 7, 2026" download={`/evidence/${f}`} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sinpe" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-red-400" />SINPE Financial Fraud — 617K CRC Extracted</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <EvidenceCard src="/evidence/pochote-sinpe-may16-247k.jpeg" title="SINPE — May 16 Transfer" date="May 16, 2026" download="/evidence/pochote-sinpe-may16-247k.jpeg" desc="247,000 CRC extracted" />
              <EvidenceCard src="/evidence/pochote-sinpe-may29-370k.jpeg" title="SINPE — May 29 Transfer" date="May 29, 2026" download="/evidence/pochote-sinpe-may29-370k.jpeg" desc="370,000 CRC extracted" />
              <EvidenceCard src="/evidence/pochote-handwritten-note-june13.jpeg" title="Handwritten Demand — June 13" date="June 13, 2026" download="/evidence/pochote-handwritten-note-june13.jpeg" desc="Additional payment demand. German owners." />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="night-ops" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-purple-400" />Night Operations — Crocs / Vista Las Palmas</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {["IMG_0783_crocs_night.jpg", "IMG_0783_crocs_night_rotated.jpg", "IMG_0783_vista_laspalmas.jpg", "IMG_0783_upper_windows_crop.jpg", "IMG_0783_crocs_night_crop.jpg", "photo_0640_20260607_104234.jpg"].map((f, i) => (
                <EvidenceCard key={i} src={`/evidence/${f}`} title={f.replace("IMG_0783_", "").replace("_20260607_104234", "").replace(".jpg", "").replace(/_/g, " ")} date="June 2026" download={`/evidence/${f}`} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="drones" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Plane className="h-3.5 w-3.5 text-amber-400" />Drone Transits — 9 Confirmed Nights</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <StatBadge label="Nights with aerial presence" value="9" accent />
              <StatBadge label="Approach vector" value="SW" accent />
              <StatBadge label="Primary suspect location" value="Esterillos Oeste" />
              <StatBadge label="Spectral energy in drone band" value="81.5%" accent />
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">81.5–81.6% of all spectral energy in the 20–200 Hz drone band eliminates HVAC, traffic, and ambient noise as sources. Approach vectors from southwest are consistent with Esterillos Oeste — the documented location of Russian national "S.", who maintains a fleet of 6 commercial/military-grade drones.</p>
            <div className="bg-card/40 border border-amber-800/30 rounded-sm p-4">
              <div className="text-xs font-bold text-amber-400 mb-2">Crane/Arch — Drone Staging Platform</div>
              <p className="text-xs text-muted-foreground/70">The arch/crane at the rear of Hotel Pochote Grande is documented as a drone staging platform between surveillance windows. Video 0316 RPM pattern (165→96→87.7 Hz) = drone spinning up from resting position on the structure.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AiWand chapter="Pochote Grande — 30-Day Operation" context={context} />
    </div>
  );
}

function ChapterFlamboyant({ lang }: { lang: "en" | "es" }) {
  const context = `Aparthotel Flamboyant — Earlier 2026 location before Pochote Grande.
The crane: arch/crane structure at rear of Hotel Pochote Grande used as drone staging platform. 5 drone bursts in the crane video alone.
Vista Las Palmas: tallest building in Jacó. Dan Wagner. Top-floor panel suite visible from Flamboyant position.
Drone approach vectors: SOUTHWEST consistent with Esterillos Oeste — Russian national "S." location.
Sonar evidence: 46.875 Hz PRF detected at 54 dB SNR — eliminates HVAC/traffic as source.
COSMO-SkyMed X-band correlation firing: 46.875 Hz decimation pulses repeating every 150-165 seconds correlated with KiwiSDR TI0RC.
Field photos: March 22, 2026 — documenting surveillance infrastructure.
KiwiSDR signal anomalies during Flamboyant period.
Genesis Peralta: La Flor unit 9, 3rd-floor roof deck with direct LOS to Flamboyant window position.`;

  return (
    <div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 font-serif">
        {lang === "es"
          ? "El período del Apartotel Flamboyant — posición anterior antes del Hotel Pochote Grande. El análisis de la grúa y las correlaciones con el satélite COSMO-SkyMed marcaron la primera documentación técnica de la operación."
          : "The Aparthotel Flamboyant era — the position immediately preceding Hotel Pochote Grande. The crane analysis and COSMO-SkyMed satellite correlations established the first technical documentation of the operation's aerial component."}
      </p>

      <Accordion type="multiple" defaultValue={["crane", "sonar"]} className="space-y-1">
        <AccordionItem value="crane" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-orange-400" />The Crane — Drone Staging & RPM Analysis</span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">The arch/crane at the rear of Hotel Pochote Grande was documented as a primary drone staging platform. 5 drone bursts in the crane video alone. RPM pattern analysis: 165→96→87.7 Hz = drone spinning up from resting position on the structure.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-card/40 border border-border rounded-sm p-4">
                <div className="text-xs font-bold text-foreground mb-2">RPM Signature Analysis</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Resting frequency</span><span className="text-amber-400">87.7 Hz</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Spin-up mid</span><span className="text-amber-400">96 Hz</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Operational RPM</span><span className="text-red-400">165 Hz</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground/60">Drone bursts in video</span><span className="text-red-400">5</span></div>
                </div>
              </div>
              <div className="bg-card/40 border border-border rounded-sm p-4">
                <div className="text-xs font-bold text-foreground mb-2">Approach Vector Analysis</div>
                <div className="space-y-2 text-xs text-muted-foreground/80">
                  <p>Primary approach: <strong className="text-amber-400">SOUTHWEST</strong></p>
                  <p>Consistent with Esterillos Oeste — documented location of Russian national "S." with fleet of 6 military-grade drones.</p>
                  <p>Evening window: 18:00–22:00 CST. <strong className="text-amber-400">1.81× enrichment</strong> vs random distribution.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["/evidence/boom/0656.jpg", "/evidence/boom/0657.jpg", "/evidence/boom/0658.jpg", "/evidence/boom/0660.jpg"].map((src, i) => (
                <EvidenceCard key={i} src={src} title={`Boom Frame ${i + 1}`} date="May–June 2026" download={src} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sonar" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-cyan-400" />Sonar Evidence — 46.875 Hz PRF Confirmed</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <StatBadge label="Signal frequency" value="46.875 Hz" accent />
              <StatBadge label="SNR" value="54 dB" accent />
              <StatBadge label="COSMO-SkyMed correlation" value="Active" accent />
              <StatBadge label="Repeat interval" value="150–165s" />
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">46.875 Hz pulse repetition frequency detected at 54.45 dB SNR — a value that eliminates HVAC, traffic, or ambient noise as sources (these produce broadband noise at ≤20 dB SNR). The COSMO-SkyMed X-band correlation rule is firing: 46.875 Hz decimation pulses repeating every 150–165 seconds correlated with KiwiSDR TI0RC detections.</p>
            <div className="bg-card/40 border border-amber-800/30 rounded-sm p-4 mb-4">
              <div className="text-xs font-bold text-amber-400 mb-2">Why 46.875 Hz?</div>
              <p className="text-xs text-muted-foreground/70">46.875 = 3000 ÷ 64. This is a standard decimation factor in digital signal processing — specifically used in X-band radar PRF calculations. This frequency does not appear in any natural or domestic electrical system. Its presence at 54 dB SNR requires an active radar/sonar transmitter.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="field-photos" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-orange-400" />Field Documentation — March 2026</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { src: "/assets/20260321_100629_(2)_1774201049911.jpg", date: "Mar 21, 2026" },
                { src: "/assets/20260322_095645_1774201049912.jpg", date: "Mar 22, 2026" },
                { src: "/assets/20260322_095708_1774215130710.jpg", date: "Mar 22, 2026" },
                { src: "/assets/20260322_151136_1774215130713.jpg", date: "Mar 22, 2026" },
              ].map((p, i) => (
                <EvidenceCard key={i} src={p.src} title={`Field Documentation ${i + 1}`} date={p.date} download={p.src} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="satellite" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Satellite className="h-3.5 w-3.5 text-blue-400" />Satellite Correlation — COSMO-SkyMed / Blackjack</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {[
                { sat: "COSMO-SkyMed (Italy)", detail: "X-band SAR constellation. Leonardo S.p.A./Telespazio ground networks across Latin America. Costa Rica (~10°N) inside equatorial footprint. 46.875 Hz PRF correlation ACTIVE." },
                { sat: "Blackjack (DARPA)", detail: "Low-orbit proliferated constellation. SSC-CASINO track correlation. KAPPA Blackjack MANDRAKE rule active during observation windows." },
                { sat: "Starlink/LEO", detail: "Ka/Ku-band user terminal correlation. KiwiSDR TI0RC anomalies during Starlink pass windows." },
              ].map(s => (
                <div key={s.sat} className="bg-card/40 border border-border rounded-sm p-4">
                  <div className="text-xs font-bold text-foreground mb-1 flex items-center gap-2"><Satellite className="h-3 w-3 text-blue-400" />{s.sat}</div>
                  <div className="text-xs text-muted-foreground/70">{s.detail}</div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AiWand chapter="Flamboyant Era — Crane / Sonar / Satellite" context={context} />
    </div>
  );
}

function ChapterJacoNexus({ lang }: { lang: "en" | "es" }) {
  const context = `The Jaco Nexus — origin point of the surveillance operation, 2025-2026.
Los Ríos compound: former mayor of Jacó (JW) property. RF camouflage installation documented October 2021. Same pattern later found at La Flor.
La Flor: RF camouflage installation matching Los Ríos pattern. Adjacent to Hotel Pochote Grande. La Flor unit 9 = Genesis Peralta's former residence.
Key actors: Wolfgang Hilbich (~80, former German military) — landlord to Russian drone operator "S." and connected to hotel ownership network.
Scott Ryan: Jaco Vacations, assessed as CIA NOC.
Genesis Peralta: weaponized honeypot. Bernini/maria fake Instagram. April 2026 raccoon videos from La Flor signal awareness of current subject location.
Mike Greenwald: ~300 properties across Costa Rica.
RF camouflage operator: assessed as same individual who installed at Los Ríos Oct 2025 then La Flor current. Moved into hotel room IMMEDIATELY adjacent to Room 10.
Zersetzung methodology: Stasi-derived psychological warfare. Systematic discrediting, engineering social failures, gaslighting, restricting movement.
FinSpy, TR-069 router exploitation, Setecom/DSE national infrastructure backdoors, 8.3MB service worker injection documented.`;

  return (
    <div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 font-serif">
        {lang === "es"
          ? "El Nexo de Jacó — el punto de origen de la operación. Los Ríos, La Flor, y el patrón de camuflaje RF que conecta todos los sitios. Los actores clave y la metodología Zersetzung aplicada contra el sujeto."
          : "The Jaco Nexus — the origin point. The Los Ríos compound, La Flor RF camouflage, and the actor network that pre-positioned infrastructure across multiple sites before Sam's arrival. The pattern spans from 2021 to present."}
      </p>

      <Accordion type="multiple" defaultValue={["rf-camo", "actors"]} className="space-y-1">
        <AccordionItem value="rf-camo" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-violet-400" />RF Camouflage Pattern — Los Ríos → La Flor</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <EvidenceCard src="/evidence/los_rios_compound_20251021.jpg" title="Los Ríos Compound" date="Oct 21, 2025" download="/evidence/los_rios_compound_20251021.jpg" desc="Former Mayor of Jacó property. Initial RF camouflage installation." />
              <EvidenceCard src="/evidence/los_rios_rf_camouflage_0282.jpg" title="Los Ríos RF Camouflage" date="Oct 21, 2025" download="/evidence/los_rios_rf_camouflage_0282.jpg" desc="RF camouflage pattern. Same installation methodology later found at La Flor." />
            </div>
            <div className="bg-card/40 border border-violet-800/30 rounded-sm p-4">
              <div className="text-xs font-bold text-violet-400 mb-2">The Pattern</div>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">The same RF camouflage installation methodology — material, mounting approach, and positioning — appeared first at the Los Ríos compound (October 2025), then at La Flor (adjacent to Hotel Pochote Grande, current date). The operator assessed as responsible for both installations physically moved into the hotel room <strong>immediately adjacent</strong> to Room 10.</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="actors" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Database className="h-3.5 w-3.5 text-violet-400" />Key Actors — HUMINT Map</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { name: "Wolfgang Hilbich", role: "~80, former German military", detail: "Landlord to Russian drone operator 'S.' Connected to hotel ownership network. Magdalena (wife) employed Genesis Peralta for cash.", color: "border-yellow-700/50" },
                { name: "Scott Ryan", role: "Jaco Vacations — CIA NOC assessment", detail: "~300+ property connections via Mike Greenwald network. Jaco vacation rental empire as operational cover.", color: "border-indigo-700/50" },
                { name: "Genesis Peralta", role: "Weaponized honeypot — La Flor unit 9", detail: "Former residence: only unit with 3rd-floor roof deck + direct LOS to Room 10. April 2026 raccoon posts from La Flor = active signaling of subject location awareness. Berninnimaria fake IG profile proven.", color: "border-pink-700/50" },
                { name: "Mike Greenwald", role: "~300 properties across Costa Rica", detail: "Property network as pre-positioned surveillance infrastructure. Geographic overlap with all documented incident locations.", color: "border-blue-700/50" },
                { name: "Russian 'S.'", role: "6-drone fleet — Esterillos Oeste", detail: "6-month co-residency with Hilbich at Shangri-La/Calle Europa 2023. No verifiable income. Fleet of 6 commercial/military-grade drones. Approach vectors match current location.", color: "border-red-700/50" },
                { name: "Dan Wagner", role: "Vista Las Palmas — top floor", detail: "Top-floor panel suite. Red lights on roof = antenna array. One of tallest buildings in Jacó. Direct LOS to Room 10.", color: "border-purple-700/50" },
              ].map(actor => (
                <div key={actor.name} className={`bg-card/40 border ${actor.color} rounded-sm p-4`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-xs font-bold text-foreground">{actor.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/50 flex-shrink-0">{actor.role}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 leading-relaxed">{actor.detail}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              <EvidenceCard src="/evidence/melissa_lopezsanchez_selfie.png" title="Melissa Lopez Sanchez" date="2026" download="/evidence/melissa_lopezsanchez_selfie.png" />
              <EvidenceCard src="/evidence/genesis_peralta_dad_caracas.jpg" title="Genesis Peralta — Family Network" date="2026" download="/evidence/genesis_peralta_dad_caracas.jpg" />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="zersetzung" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-red-400" />Zersetzung Methodology — Digital Stasi Playbook</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-card/40 border border-border rounded-sm p-4">
                <div className="text-xs font-bold text-muted-foreground/60 mb-2 uppercase tracking-wider">Classic Stasi Zersetzung</div>
                <ul className="text-xs text-muted-foreground/70 space-y-1">
                  {["Systematic discrediting of public reputation", "Engineering social and professional failures", "Undermining self-confidence through gaslighting", "Creating fear through covert operations", "Restricting communications and movement", "Medical/pharmaceutical sabotage"].map(i => <li key={i} className="flex gap-2"><span className="text-muted-foreground/30">—</span>{i}</li>)}
                </ul>
              </div>
              <div className="bg-card/40 border border-red-800/30 rounded-sm p-4">
                <div className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">Digital Variant — Documented</div>
                <ul className="text-xs text-muted-foreground/70 space-y-1">
                  {["Network isolation via TR-069 router exploitation", "Acoustic harassment via 57 Hz / 46.875 Hz signals", "Power cycling and device thermal events", "Behavioral modification through persistent RF fields", "Social isolation through coordinated actor network", "Financial extraction via SINPE manipulation"].map(i => <li key={i} className="flex gap-2"><span className="text-red-400/40">▸</span>{i}</li>)}
                </ul>
              </div>
            </div>
            <EvidenceCard src="/evidence/kill_chain.png" title="Kill Chain Analysis" date="2026" download="/evidence/kill_chain.png" desc="Full operational kill chain from initial targeting to current execution phase." />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="diagrams" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-violet-400" />Analysis Diagrams — Network Architecture</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { src: "/assets/jaco_nexus_confirmed_evidence_1774025171697.png", title: "Jaco Nexus — Confirmed Evidence", desc: "Sonar readings, Setecom/DSE backdoors, and complete human network." },
                { src: "/assets/complete_nexus_all_threads_1774025171694.png", title: "All Threads Converge", desc: "Complete mapping from historical CIA logistics to modern corporate surveillance proxies." },
                { src: "/assets/apocalypse_architecture_1774025171693.png", title: "Architecture Analysis", desc: "Data flow between corporate, government, and religious organizational layers." },
                { src: "/assets/january_14_2025_activation_complete_1774025171697.png", title: "January 14 Activation", desc: "Coordinated multi-domain surveillance activation event." },
              ].map((item, i) => (
                <EvidenceCard key={i} src={item.src} title={item.title} desc={item.desc} download={item.src} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AiWand chapter="Jaco Nexus — Origin & Actor Network" context={context} />
    </div>
  );
}

function ChapterSignals({ lang }: { lang: "en" | "es" }) {
  const { data: events } = useQuery<KappaEvent[]>({ queryKey: ["/api/events"], select: (d: any) => Array.isArray(d) ? d.slice(0, 10) : [] });
  const { data: corrs } = useQuery<Correlation[]>({ queryKey: ["/api/correlations"], select: (d: any) => Array.isArray(d) ? d.slice(0, 8) : [] });
  const { data: stats } = useQuery<any>({ queryKey: ["/api/stats"] });

  const context = `Multi-domain signal intelligence — KAPPA engine, KiwiSDR, satellite, ELF, PCAP.
KiwiSDR: 71 targets across 33 nodes. 8 priority Central America/Caribbean nodes. Auto-discovers new nodes within 2000km of San José.
Sonar: 46.875 Hz PRF at 54 dB SNR. COSMO-SkyMed X-band correlation active.
ELF/VLF: 57.28 Hz anomalous fundamental in Recording 49. 50 Hz present (EU standard, anomalous in 60Hz CR).
PCAP: 06:30 traffic spike. HiPerConTracer probes. ePDG Liberty routing. Facebook Netseer tracking. Samsung DTIgnite telemetry.
Network: TR-069 router reset. 8.3MB service worker injection. Ghost mesh node detection. FinSpy process indicators.
Satellite: Blackjack MANDRAKE correlation active. N2YO pass timing correlation.
Evening window anomaly: 30.1% of events in 18:00-22:00 window vs 16.7% expected (random). 1.81x enrichment factor.
KAPPA engine: 22 correlation rules. Autonomous deduplication, hypervisor overlap detection, TLE consistency checks.`;

  return (
    <div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 font-serif">
        {lang === "es"
          ? "Inteligencia de señales multi-dominio: KiwiSDR, satélite, ELF, análisis PCAP y el motor de correlación KAPPA operando sobre 22 reglas automáticas."
          : "Multi-domain signal intelligence running continuously across KiwiSDR, satellite tracking, ELF/VLF monitoring, and packet capture analysis. The KAPPA engine applies 22 correlation rules in real time."}
      </p>

      <LiveKappa />

      <Accordion type="multiple" defaultValue={["live-events", "pcap"]} className="space-y-1">
        <AccordionItem value="live-events" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-cyan-400" />Live KAPPA Events & Correlations</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <StatBadge label="Total events" value={(stats?.totalEvents ?? 0).toLocaleString()} accent />
              <StatBadge label="Correlations" value={(stats?.correlationCount ?? 0).toLocaleString()} accent />
              <StatBadge label="EW enrichment" value="1.81×" accent />
              <StatBadge label="EW concentration" value="30.1%" />
            </div>
            {events && events.length > 0 ? (
              <div className="space-y-2">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 bg-card/30 border border-border rounded-sm p-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${ev.severity === "critical" ? "bg-red-900/60 text-red-300" : ev.severity === "high" ? "bg-amber-900/60 text-amber-300" : "bg-muted text-muted-foreground"}`}>{ev.severity?.toUpperCase()}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{ev.type} — {ev.source}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-0.5">{ev.description}</div>
                      <div className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">{ev.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground/50">No events loaded — KAPPA engine may be initializing.</p>}
            {corrs && corrs.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold text-foreground mb-2">Active Correlation Rules</div>
                {corrs.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-card/30 border border-border rounded-sm p-3">
                    <div className="text-[10px] font-mono text-amber-400 flex-shrink-0 w-8 text-right">{(c.confidence * 100).toFixed(0)}%</div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{c.type}</div>
                      <div className="text-[10px] text-muted-foreground/70">{c.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pcap" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Wifi className="h-3.5 w-3.5 text-cyan-400" />PCAP Analysis — 6 Forensic Indicators</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[
                { title: "06:30 Traffic Spike", detail: "Anomalous coordinated egress at 06:30 CST daily. Consistent with scheduled collection cycle sync." },
                { title: "HiPerConTracer Probes", detail: "Network measurement tool probes originating from unexpected source IPs — infrastructure mapping activity." },
                { title: "ePDG Liberty Routing", detail: "Emergency PDN Gateway traffic routing through Liberty network — atypical for consumer mobile." },
                { title: "Burst Pattern Correlation", detail: "Packet burst patterns correlated with antenna rotation events and drone transit windows." },
                { title: "Facebook Netseer Tracking", detail: "Netseer ad-tracking requests correlated with physical location changes — behavioral profiling." },
                { title: "Samsung DTIgnite Telemetry", detail: "Device-level telemetry exfiltration via DTIgnite framework — background data collection confirmed." },
              ].map(item => (
                <div key={item.title} className="bg-card/40 border border-border rounded-sm p-3">
                  <div className="text-xs font-bold text-foreground mb-1">{item.title}</div>
                  <div className="text-[10px] text-muted-foreground/70">{item.detail}</div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="kiwisdr" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-cyan-400" />KiwiSDR — 71 Targets / 33 Nodes</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <StatBadge label="Total targets" value="71" accent />
              <StatBadge label="KiwiSDR nodes" value="33" />
              <StatBadge label="Priority CA/Caribbean" value="8" accent />
              <StatBadge label="Global TDOA" value="25" />
              <StatBadge label="Auto-discovery radius" value="2000 km" />
              <StatBadge label="Key correlation node" value="TI0RC" accent />
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">8 priority Central America/Caribbean nodes receive full 71-target scans. Global nodes scan VLF stations + Blackjack for TDOA correlation. Auto-discovers new nodes within 2000km of San José. TI0RC correlation with COSMO-SkyMed 46.875 Hz PRF is the strongest active KiwiSDR signal link.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="elf" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Signal className="h-3.5 w-3.5 text-cyan-400" />ELF/VLF Cross-Domain Correlation</span>
          </AccordionTrigger>
          <AccordionContent>
            <EvidenceCard src="/evidence/frequency_architecture.png" title="Frequency Architecture Diagram" date="2026" download="/evidence/frequency_architecture.png" desc="7.8 Hz–107 MHz frequency chain visualization from Schumann through KiwiSDR target frequencies." />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground/60">Domain</th>
                    <th className="text-right p-2 text-muted-foreground/60">Frequency</th>
                    <th className="text-right p-2 text-muted-foreground/60">Status</th>
                    <th className="text-right p-2 text-muted-foreground/60">Cross-correlation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Recording 49 FFT", "57.28 Hz", "CONFIRMED", "8-harmonic series"],
                    ["Sonar PRF", "46.875 Hz", "CONFIRMED", "COSMO-SkyMed X-band"],
                    ["European mains", "50 Hz", "DETECTED", "Anomalous in 60Hz CR"],
                    ["CR mains", "60 Hz", "BASELINE", "Expected"],
                    ["Sonar 2nd harm.", "93.75 Hz", "DETECTED", "2× PRF"],
                    ["Drone band", "20–200 Hz", "CONTINUOUS", "Recording 49"],
                    ["Schumann", "7.83 Hz", "BACKGROUND", "ELF baseline"],
                  ].map(([d, f, s, c]) => (
                    <tr key={String(d)} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="p-2 text-muted-foreground/80">{d}</td>
                      <td className="p-2 text-right font-mono text-amber-400">{f}</td>
                      <td className="p-2 text-right"><span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s === "CONFIRMED" ? "bg-red-900/60 text-red-300" : s === "DETECTED" ? "bg-amber-900/60 text-amber-300" : "bg-muted text-muted-foreground/60"}`}>{s}</span></td>
                      <td className="p-2 text-right text-[10px] text-muted-foreground/60">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AiWand chapter="Signal Intelligence — KiwiSDR / Satellite / ELF / PCAP" context={context} />
    </div>
  );
}

function ChapterNetwork({ lang }: { lang: "en" | "es" }) {
  const context = `Human network analysis — 25+ persons, 14+ locations, 14+ companies, 31+ evidence items, 6 clusters.
Clusters: Honey Trap (Genesis Peralta, Melissa Lopez), Property Placement (Greenwald, 300 properties), ISP/Infrastructure (Setecom, DSE, Kyndryl, TR-069), La Guácima Attack Infrastructure (former mayor JW, Los Ríos compound), Vendetta/Motive Chain (Italian connection, Leonardo/Telespazio, COSMO-SkyMed), Hardware/CPE Compromise (router resets, service worker injection, FinSpy).
Italian thread: Leonardo S.p.A./Telespazio geodetic satellite networks across Latin America. Italian Law 124/2007 authorizes AISE to operate via commercial cover. Berninnimaria fake IG profile (Italian PM content + babysitting cover) proven.
CDMX nexus: Mexico City convergence of actors, GitHub l3monrat (follows geerlingguy, Raspberry Pi + ESP32 + offline GPS — drone/SIGINT hardware), Pakistan hardware expertise.
3I/ATLAS thread: cross-correlation with 3I/ATLAS object observations, SOAR spectroscopy, VLT/CFHT imaging, quantum computing correlations (Rigetti, Azure Ankaa-3).
Kyndryl/TR-069: ISP-level injection via CWMP, ghost mesh insertion, corporate infrastructure overlap.
Working adversary hypothesis: cartel, NSA/CIA, or state-adjacent intelligence — possibly hazing/recruitment operation.`;

  return (
    <div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 font-serif">
        {lang === "es"
          ? "Análisis de red humana — 25+ personas, 14+ ubicaciones, 6 clústeres de correlación. Del fraude de miel al compromiso de infraestructura ISP a nivel nacional."
          : "The human intelligence network: 25+ documented persons, 14+ locations, 6 correlation clusters connecting a honey trap operation through property placement, ISP compromise, and state-adjacent signals infrastructure."}
      </p>

      <Accordion type="multiple" defaultValue={["clusters"]} className="space-y-1">
        <AccordionItem value="clusters" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Database className="h-3.5 w-3.5 text-emerald-400" />6 Evidence Clusters</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "Honey Trap", color: "border-pink-800/40 text-pink-400", items: ["Genesis Peralta (La Flor unit 9 — direct LOS)", "Berninnimaria fake IG (Italian PM content)", "~12 simultaneous fake profiles proven", "Melissa Lopez Sanchez (dog photo connection)"] },
                { name: "Property Placement", color: "border-blue-800/40 text-blue-400", items: ["Mike Greenwald — ~300 Costa Rica properties", "Valeska photographed future surveillance field 8mo early", "Pre-positioned infrastructure before subject arrival", "Jaco Vacations / Scott Ryan NOC"] },
                { name: "ISP / Infrastructure", color: "border-cyan-800/40 text-cyan-400", items: ["Setecom/DSE national backdoors", "Kyndryl CWMP/TR-069 mesh insertion", "8.3MB service worker injection", "Ghost mesh node detected"] },
                { name: "La Guácima Attack Infrastructure", color: "border-orange-800/40 text-orange-400", items: ["Former Mayor of Jacó (JW) — Los Ríos compound", "RF camouflage installation Oct 2025", "Same pattern replicated at La Flor", "Adjacent room operator (RF installer)"] },
                { name: "Vendetta / Motive Chain", color: "border-red-800/40 text-red-400", items: ["Leonardo S.p.A. / Telespazio CR network", "COSMO-SkyMed X-band PRF correlation", "Italian Law 124/2007 commercial cover ops", "Berninnimaria Italian content = AISE signal"] },
                { name: "Hardware / CPE Compromise", color: "border-yellow-800/40 text-yellow-400", items: ["FinSpy process indicators", "TR-069 forced router resets", "DTIgnite telemetry exfiltration", "UPnP monitoring — 5min response"] },
              ].map(cluster => (
                <div key={cluster.name} className={`bg-card/40 border ${cluster.color.split(" ")[0]} rounded-sm p-4`}>
                  <div className={`text-xs font-bold mb-2 ${cluster.color.split(" ")[1]}`}>{cluster.name}</div>
                  <ul className="text-[10px] text-muted-foreground/70 space-y-1">
                    {cluster.items.map(item => <li key={item} className="flex gap-1.5"><span className="text-muted-foreground/30 flex-shrink-0">▸</span>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="arch-diagrams" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-emerald-400" />Architecture Diagrams</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EvidenceCard src="/evidence/multi_domain_architecture.png" title="Multi-Domain Architecture" download="/evidence/multi_domain_architecture.png" desc="Cross-domain signal flow between all collection vectors." />
              <EvidenceCard src="/assets/the_nexus_analysis_1774025171698.png" title="The Nexus Analysis" download="/assets/the_nexus_analysis_1774025171698.png" desc="Network topology — all actors through Connector Pepe's 400+ name hub." />
              <EvidenceCard src="/assets/dewave_architecture_1774025171694.png" title="DeWave Architecture" download="/assets/dewave_architecture_1774025171694.png" desc="EEG-to-text neural interface architecture — 300ms delay, three voices." />
              <EvidenceCard src="/assets/three_voices_analysis_1774025171698.png" title="Three Voices Analysis" download="/assets/three_voices_analysis_1774025171698.png" desc="Multiple simultaneous acoustic sources identified." />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="adversary" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-red-400" />Adversary Assessment — Working Hypothesis</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="bg-red-950/10 border border-red-800/30 rounded-sm p-5">
              <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-3">KAPPA Platform — Operative Working Hypothesis</div>
              <p className="text-sm text-muted-foreground/80 leading-relaxed mb-3">The operation exhibits characteristics consistent with a sustained, multi-actor signals intelligence collection effort against a single target. The operational sophistication — RF collection, BLE proximity sensing, aerial reconnaissance, and physical access — exceeds the capability profile of opportunistic criminal actors.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {[
                  { h: "Cartel-connected logistics", d: "Physical infrastructure, property network, local actor coordination" },
                  { h: "NSA/CIA state-adjacent", d: "Technical sophistication, ISP backdoors, satellite correlation, FinSpy" },
                  { h: "Hazing/recruitment operation", d: "Pattern consistent with intelligence community vetting methodology" },
                ].map(h => (
                  <div key={h.h} className="bg-card/40 border border-red-800/20 rounded-sm p-3">
                    <div className="text-[10px] font-bold text-red-400 mb-1">{h.h}</div>
                    <div className="text-[10px] text-muted-foreground/60">{h.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AiWand chapter="The Network — HUMINT / Actors / Adversary Assessment" context={context} />
    </div>
  );
}

function ChapterArchive({ lang }: { lang: "en" | "es" }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 font-serif">
        {lang === "es"
          ? "Archivo completo de evidencias descargables — reportes, grabaciones, análisis forenses y documentos primarios."
          : "Complete downloadable evidence archive — forensic reports, recordings, analysis documents, and primary source materials. All files served from the KAPPA evidence vault."}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <StatBadge label="Total Drive files" value="2,000+" />
        <StatBadge label="Videos" value="303" />
        <StatBadge label="PCAPs" value="33" />
        <StatBadge label="PDFs" value="46+" />
      </div>

      <Accordion type="multiple" defaultValue={["reports", "photos"]} className="space-y-1">
        <AccordionItem value="reports" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-blue-400" />Forensic Reports</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <DocCard href="/evidence/recording49_fft_report.md" title="Recording 49 — FFT Forensic Report" size="15 KB • MD" desc="57.28 Hz anomalous signal, 8-harmonic series, canine/staff bioeffect analysis. June 18, 2026." icon={FileText} />
              <DocCard href="/evidence/KAPPA_INTEL_BRIEF_20260601.md" title="KAPPA Intelligence Brief — June 1, 2026" size="MD" desc="11 active operational vectors, actor profiles, immediate requests." icon={FileText} />
              <DocCard href="/evidence/POCHOTE_LAFLOR_EVIDENCE_REPORT.md" title="Pochote / La Flor Evidence Report" size="MD" desc="Combined evidence package for Hotel Pochote Grande and La Flor surveillance positions." icon={FileText} />
              <DocCard href="/evidence/DENUNCIA_SAM_WOTTON_20260530.html" title="Denuncia — Sam Wotton (May 30, 2026)" size="HTML" desc="Formal complaint documentation." icon={FileText} />
              <DocCard href="/evidence/JACO_SITUATION_REPORT_20260601.html" title="Jaco Situation Report — June 1, 2026" size="HTML" desc="Complete operational situation report." icon={FileText} />
              <DocCard href="/evidence/boom/IMG_0663_antenna_forensic_report.txt" title="Antenna Forensic Report" size="TXT" desc="Vision analysis of parabolic antenna structure and positioning." icon={FileText} />
              <DocCard href="/evidence/boom/people_vision_report.txt" title="People Vision Analysis Report" size="TXT" desc="AI vision analysis of persons in surveillance footage." icon={Eye} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="photos" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-blue-400" />Full Photo Evidence Gallery</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[
                { src: "/evidence/pochote_surveillance_network_aerial.jpeg", title: "Surveillance Network Aerial" },
                { src: "/evidence/room10_aerial_geometry.jpeg", title: "Room 10 Geometry" },
                { src: "/evidence/IMG_0783_crocs_night.jpg", title: "Crocs Night Operations" },
                { src: "/evidence/IMG_0783_vista_laspalmas.jpg", title: "Vista Las Palmas" },
                { src: "/evidence/IMG_0783_upper_windows_crop.jpg", title: "Upper Windows Crop" },
                { src: "/evidence/vehicle_CL273123_20260607_072008.jpeg", title: "Truck CL273123" },
                { src: "/evidence/pochote-handwritten-note-june13.jpeg", title: "Handwritten Note June 13" },
                { src: "/evidence/los_rios_compound_20251021.jpg", title: "Los Ríos Compound" },
                { src: "/evidence/los_rios_rf_camouflage_0282.jpg", title: "RF Camouflage Los Ríos" },
                { src: "/evidence/genesis_peralta_dad_caracas.jpg", title: "Genesis Peralta Network" },
                { src: "/evidence/melissa_lopezsanchez_selfie.png", title: "Melissa Lopez Sanchez" },
                { src: "/evidence/spectrogram_rec49.png", title: "Recording 49 Spectrogram" },
                { src: "/evidence/kill_chain.png", title: "Kill Chain" },
                { src: "/evidence/frequency_architecture.png", title: "Frequency Architecture" },
                { src: "/evidence/multi_domain_architecture.png", title: "Multi-Domain Architecture" },
                { src: "/evidence/evidence_timeline.png", title: "Evidence Timeline" },
              ].map((p, i) => (
                <EvidenceCard key={i} src={p.src} title={p.title} download={p.src} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="docs" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-blue-400" />Primary Documents</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <DocCard href="/evidence/Double_Dip_Explanation_Macek_Holdings_2025.pdf" title="Macek Holdings Double-Dip — 2025" size="PDF" icon={FileText} />
              <DocCard href="/evidence/Forensic_Audit_numbedink_Macek_Holdings_Jan_Oct_2025.pdf" title="Forensic Audit — numbedink / Macek Holdings" size="PDF" icon={FileText} />
              <DocCard href="/evidence/Invoice_415_Supplements_Brazil_LLC_Haron_Campos_20170626.pdf" title="Invoice 415 — Brazil LLC / Haron Campos (2017)" size="PDF" icon={FileText} />
              <DocCard href="/evidence/MPP_Promo_Reel_2022-09-29.pdf" title="MPP Promo Reel — Sept 2022" size="PDF" icon={FileText} />
              <DocCard href="/evidence/CONTACT_BRIEF_CL273123_BLE.html" title="BLE Contact Brief — Truck CL273123" size="HTML" icon={FileText} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="audio" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Mic className="h-3.5 w-3.5 text-blue-400" />Audio — Field Recordings</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="bg-card/40 border border-border rounded-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-bold text-foreground">Recording 49</div>
                    <div className="text-[10px] text-muted-foreground/60 font-mono">2026-06-18 00:04:22 UTC • 24.55s • M4A • iPhone</div>
                  </div>
                  <Badge variant="destructive" className="text-[10px] rounded-none font-mono">57 Hz ANOMALY</Badge>
                </div>
                <audio controls className="w-full h-8" preload="metadata">
                  <source src="/attached_assets/New_Recording_49_1781741160727.m4a" type="audio/mp4" />
                </audio>
                <a href="/evidence/recording49_fft_report.md" download className="mt-2 flex items-center gap-1 text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors">
                  <Download className="h-3 w-3" /> Download FFT Report
                </a>
              </div>
              <div className="bg-card/40 border border-border rounded-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-bold text-foreground">Recording 37 — 09:30 Rain</div>
                    <div className="text-[10px] text-muted-foreground/60 font-mono">Hotel Pochote Grande • M4A</div>
                  </div>
                </div>
                <audio controls className="w-full h-8" preload="metadata">
                  <source src="/evidence/Recording_37_0930_rain.m4a" type="audio/mp4" />
                </audio>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="video" className="border-border">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
            <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-blue-400" />Video — Field Documentation</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="bg-card/40 border border-border rounded-sm overflow-hidden">
                <video controls preload="metadata" className="w-full max-h-80 bg-black" playsInline>
                  <source src="/evidence/surveillance_20260328.mp4" type="video/mp4" />
                </video>
                <div className="p-3">
                  <div className="text-xs font-bold text-foreground">Surveillance Documentation — March 28, 2026</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">Unedited field capture. 35.3 MB • MP4</div>
                </div>
              </div>
              <div className="bg-card/40 border border-border rounded-sm overflow-hidden">
                <video controls preload="metadata" className="w-full max-h-80 bg-black" playsInline>
                  <source src="/evidence/kappa_20260607_010901_DE517A43.mp4" type="video/mp4" />
                </video>
                <div className="p-3">
                  <div className="text-xs font-bold text-foreground">KAPPA Capture — June 7, 2026 01:09</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">MP4 • DE517A43</div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WhistleblowerPage() {
  const [lang, setLang] = useState<"en" | "es" | null>(() => {
    try {
      const s = localStorage.getItem("ciajw_lang");
      if (s === "en" || s === "es") return s;
    } catch {}
    return null;
  });
  const [activeChapter, setActiveChapter] = useState<string>("breaking");
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleLang = (l: "en" | "es") => {
    setLang(l);
    try { localStorage.setItem("ciajw_lang", l); } catch {}
  };

  const l = lang ?? "en";

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="whistleblower-page">
      {lang === null && <LangPopup onSelect={handleLang} />}

      {/* Hero ---------------------------------------------------------------- */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-950/40 via-background to-background" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-0">
          {/* Mobile-only full-bleed hero image — above the fold */}
          <div className="md:hidden -mx-4 -mt-10 mb-6 relative overflow-hidden" style={{ height: "240px" }}>
            <img
              src="/evidence/pochote_surveillance_network_aerial.jpeg"
              alt="Hotel Pochote Grande — aerial surveillance network view"
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent" />
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
              <span className="bg-red-900/80 text-red-300 text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest animate-pulse">LIVE OPERATION</span>
              <span className="bg-black/60 text-white/70 text-[9px] font-mono px-2 py-0.5 uppercase tracking-widest">CIAJW.COM</span>
            </div>
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-[9px] font-mono text-white/60 uppercase tracking-widest leading-tight">
                Six confirmed surveillance positions · Hotel Pochote Grande · Jacó Beach, Costa Rica
              </p>
            </div>
          </div>

          {/* Top bar */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="destructive" className="text-[10px] font-mono rounded-none tracking-widest animate-pulse hidden md:flex">LIVE OPERATION</Badge>
            <Badge variant="outline" className="text-[10px] font-mono rounded-none tracking-widest">SIGINT PLATFORM</Badge>
            <Badge variant="outline" className="text-[10px] font-mono rounded-none tracking-widest hidden sm:flex">CIAJW.COM</Badge>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => handleLang(l === "en" ? "es" : "en")}
                className="text-[10px] font-mono text-muted-foreground/50 hover:text-foreground border border-border/50 px-2 py-1 rounded-sm transition-colors"
                data-testid="button-lang-toggle">
                {l === "en" ? "🇨🇷 ES" : "🇬🇧 EN"}
              </button>
            </div>
          </div>

          {/* Two-column on md+, stacked on mobile */}
          <div className="flex flex-col md:flex-row md:gap-10 md:items-start pb-8">
            {/* Text column */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-amber-800/30" />
                {l === "es" ? "Informe de Inteligencia Exclusivo" : "Exclusive Intelligence Report"}
                <span className="h-px flex-1 bg-amber-800/30" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-foreground leading-tight mb-4" data-testid="hero-title">
                {l === "es" ? "30 Noches Bajo Vigilancia" : "30 Nights Under Surveillance"}
                <span className="block text-xl sm:text-2xl md:text-3xl text-amber-400 font-normal mt-1">
                  {l === "es" ? "Jacó, Costa Rica — 2025–2026" : "Jacó, Costa Rica — 2025–2026"}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-5 font-serif">
                {l === "es"
                  ? "Una antena parabólica rotatoria. Seis posiciones confirmadas de vigilancia rodeando una habitación. Tránsitos nocturnos de drones. Propietarios alemanes. Una señal anómala de 57 Hz documentada en la última noche. El motor KAPPA registrando correlaciones activas en seis dominios de señales independientes."
                  : "A rotating parabolic dish antenna. Six confirmed surveillance positions surrounding one room. Nightly drone transits. German-connected ownership. A 57.28 Hz anomalous signal documented on the final night. The KAPPA engine recording active correlations across six independent signal domains."}
              </p>

              {/* Pull quote */}
              <blockquote className="border-l-4 border-amber-600 pl-4 mb-5 text-sm text-muted-foreground/80 italic font-serif">
                {l === "es"
                  ? '"La frecuencia de 57.28 Hz no existe en ningún sistema eléctrico natural o doméstico. Requiere un transmisor activo."'
                  : '"57.28 Hz does not appear in any natural or domestic electrical system. Its presence at 54 dB SNR requires an active transmitter."'}
              </blockquote>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground/60 font-mono mb-6">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />May 17 – June 18, 2026</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Hotel Pochote Grande, Jacó</span>
                <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />~35 min read</span>
              </div>

              {/* Key figures bar */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-0">
                {[
                  { v: "6", l_en: "Surveillance\nPositions", l_es: "Posiciones\nVigilancia" },
                  { v: "57 Hz", l_en: "Anomalous\nSignal", l_es: "Señal\nAnómala" },
                  { v: "5×", l_en: "AC Units\nDetected", l_es: "Unidades\nAC" },
                  { v: "54dB", l_en: "Signal\nSNR", l_es: "SNR\nSeñal" },
                  { v: "303", l_en: "Videos\nArchived", l_es: "Videos\nArchivados" },
                  { v: "33", l_en: "PCAP\nCaptures", l_es: "Capturas\nPCAP" },
                ].map(f => (
                  <div key={f.v} className="border border-border/50 bg-card/30 rounded-sm px-2 py-2 text-center">
                    <div className="text-lg font-black font-mono text-amber-400 leading-none">{f.v}</div>
                    <div className="text-[8px] font-mono text-muted-foreground/50 mt-1 leading-tight whitespace-pre-line">{l === "es" ? f.l_es : f.l_en}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aerial image column — hidden on mobile, shown md+ */}
            <div className="hidden md:block flex-shrink-0 w-72 lg:w-80 space-y-3">
              <div className="relative overflow-hidden rounded-sm border border-border/60">
                <img
                  src="/evidence/pochote_surveillance_network_aerial.jpeg"
                  alt="Pochote Grande surveillance network — aerial view"
                  className="w-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-3">
                  <p className="text-[9px] font-mono text-white/70 leading-tight">
                    {l === "es" ? "Red de vigilancia — Hotel Pochote Grande, Jacó Beach" : "Surveillance network — Hotel Pochote Grande, Jacó Beach"}
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-sm border border-border/60">
                <img
                  src="/evidence/room10_aerial_geometry.jpeg"
                  alt="Room 10 geometry — Apple Maps aerial"
                  className="w-full object-cover max-h-40"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                  <p className="text-[9px] font-mono text-white/70">
                    {l === "es" ? "Geometría Habitación 10 — posición marcada en azul" : "Room 10 geometry — position marked in blue"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only image strip */}
          <div className="md:hidden flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {[
              { src: "/evidence/pochote_surveillance_network_aerial.jpeg", cap: l === "es" ? "Red de vigilancia" : "Surveillance network" },
              { src: "/evidence/room10_aerial_geometry.jpeg", cap: l === "es" ? "Geometría R10" : "Room 10 geometry" },
              { src: "/evidence/riverwalk_panel_1.jpg", cap: l === "es" ? "Panel eléctrico" : "Electrical panel" },
            ].map((img, i) => (
              <div key={i} className="flex-shrink-0 w-44 relative rounded-sm overflow-hidden border border-border/60">
                <img src={img.src} alt={img.cap} className="w-full h-28 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                  <p className="text-[8px] font-mono text-white/70">{img.cap}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chapter tab bar ----------------------------------------------------- */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div ref={tabsRef} className="overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-4 sm:px-6">
            {CHAPTERS.map(ch => {
              const Icon = ch.icon;
              const active = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  data-testid={`tab-chapter-${ch.id}`}
                  className={`flex flex-col items-start px-4 py-3 border-b-2 transition-colors flex-shrink-0 ${active ? "border-amber-500 text-foreground" : "border-transparent text-muted-foreground/60 hover:text-muted-foreground hover:border-border"}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className={`h-3 w-3 ${active ? "text-amber-400" : ""}`} />
                    <span className="text-[10px] font-mono font-bold tracking-wider">{ch.label}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/40">{ch.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chapter body -------------------------------------------------------- */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Chapter header */}
        {(() => {
          const ch = CHAPTERS.find(c => c.id === activeChapter);
          return ch ? (
            <div className="mb-8">
              <div className={`flex items-center gap-2 mb-1`}>
                <ch.icon className={`h-4 w-4 ${ch.accent.split(" ")[1]}`} />
                <span className={`text-[10px] font-mono uppercase tracking-widest ${ch.accent.split(" ")[1]}`}>{ch.label}</span>
                <span className="text-[10px] text-muted-foreground/40 font-mono">— {ch.sub}</span>
              </div>
              <Separator className="mb-6" />
            </div>
          ) : null;
        })()}

        {activeChapter === "breaking" && <ChapterBreaking lang={l} />}
        {activeChapter === "pochote" && <ChapterPochote lang={l} />}
        {activeChapter === "flamboyant" && <ChapterFlamboyant lang={l} />}
        {activeChapter === "jaco-nexus" && <ChapterJacoNexus lang={l} />}
        {activeChapter === "signals" && <ChapterSignals lang={l} />}
        {activeChapter === "network" && <ChapterNetwork lang={l} />}
        {activeChapter === "archive" && <ChapterArchive lang={l} />}

        {/* Chapter nav footer */}
        <Separator className="mt-12 mb-6" />
        <div className="flex items-center justify-between gap-4">
          {(() => {
            const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
            const prev = idx > 0 ? CHAPTERS[idx - 1] : null;
            const next = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;
            return (
              <>
                {prev ? (
                  <button onClick={() => setActiveChapter(prev.id)} className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-foreground transition-colors group">
                    <ChevronRight className="h-3.5 w-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-mono">{prev.label}</span>
                  </button>
                ) : <div />}
                {next ? (
                  <button onClick={() => setActiveChapter(next.id)} className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-foreground transition-colors group">
                    <span className="font-mono">{next.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : <div />}
              </>
            );
          })()}
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-[10px] text-muted-foreground/40 font-mono">
          <a href="/sensor-array" className="hover:text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />RSSI Sensor Array</a>
          <a href="/forensics" className="hover:text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />Network Forensics</a>
          <a href="/network-analysis" className="hover:text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />HUMINT Network</a>
          <a href="/board" className="hover:text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />Conspiracy Board</a>
          <a href="/pochote-headliner" className="hover:text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />30 Days at Pochote (article)</a>
          <a href="/evidence" className="hover:text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />Evidence Chain</a>
        </div>
      </div>
    </div>
  );
}
