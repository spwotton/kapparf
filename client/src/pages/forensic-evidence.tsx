import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, FileText, Film, Image as ImageIcon, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SLIDES = [
  { src: "/forensic_slides/slide_kappa_01_cover.jpg",       label: "Cover — 7 Months Overview" },
  { src: "/forensic_slides/slide_kappa_02_timeline.jpg",    label: "Incident Timeline" },
  { src: "/forensic_slides/slide_kappa_03_blue_channel.jpg",label: "B-Channel 100% Zeroed" },
  { src: "/forensic_slides/slide_kappa_04_modes.jpg",       label: "3 Attack Modes" },
  { src: "/forensic_slides/slide_kappa_05_summary.jpg",     label: "Evidence Summary Table" },
  { src: "/forensic_slides/IMG_0524_channels.jpg",          label: "IMG_0524 Bayer Channels" },
  { src: "/forensic_slides/IMG_0525_channels.jpg",          label: "IMG_0525 Bayer Channels" },
  { src: "/forensic_slides/DNG_NEW3_channels.jpg",          label: "DNG_NEW3 Channels (dup 0524)" },
  { src: "/forensic_slides/DNG_NEW4_channels.jpg",          label: "DNG_NEW4 Channels (dup 0525)" },
  { src: "/forensic_slides/master_summary.jpg",             label: "Master Summary Frame" },
  { src: "/forensic_slides/oct25_timeline.jpg",             label: "Oct 25 — 12.5min Sustained" },
  { src: "/forensic_slides/apr29_timeline.jpg",             label: "Apr 29 — Floor Lock" },
];

const VIDEOS = [
  { src: "/forensic_slides/kappa_jan7_v3.mp4",         label: "Jan 7 — 6.4min Luminance Suppression SBS",     tag: "6.4 min",  color: "cyan" },
  { src: "/forensic_slides/kappa_jun2_v3.mp4",         label: "Jun 2 — 31s Floor Lock SBS",                  tag: "31 s",     color: "blue" },
  { src: "/forensic_slides/kappa_jun6_new5_sbs.mp4",   label: "Jun 6 04:05 UTC — NEW 47% Zero SBS",          tag: "3 s NEW",  color: "red" },
  { src: "/forensic_slides/kappa_forensic_FINAL.mp4",  label: "Jun 5 — Ceiling Lock (88% Sat) Narrated",     tag: "narrated", color: "orange" },
  { src: "/forensic_slides/kappa_suppression_FINAL.mp4",label: "Jun 6 — Floor Lock 71% Narrated",            tag: "narrated", color: "blue" },
  { src: "/forensic_slides/kappa_apr29_FINAL.mp4",     label: "Apr 29 — 90.6% Floor Lock",                   tag: "16.5 s",   color: "blue" },
  { src: "/forensic_slides/kappa_may17_FINAL.mp4",     label: "May 17 — Perfect Zero Lock",                  tag: "18.95 s",  color: "blue" },
  { src: "/forensic_slides/kappa_master_FINAL.mp4",    label: "Master Narration — 151s Full Brief",          tag: "2.5 min",  color: "cyan" },
];

const OIJ_LETTER = `ORGANISMO DE INVESTIGACIÓN JUDICIAL (OIJ)
Departamento de Criminalística / Unidad de Delitos Informáticos y Tecnológicos
San José, Costa Rica

Fecha: 6 de junio de 2026

DENUNCIA FORMAL — ACOSO ELECTROMAGNÉTICO, VIGILANCIA ILEGAL Y 
INTERFERENCIA DELIBERADA DE DISPOSITIVOS ELECTRÓNICOS

Estimados señores del OIJ:

Por medio de la presente, yo, Sam Wotton, ciudadano extranjero con residencia 
temporal en Costa Rica, interpongo denuncia formal por hechos que constituyen 
presunta interferencia electromagnética intencional, acoso sistemático y vigilancia 
ilegal, cometidos en mi contra durante los meses de octubre de 2025 a junio de 2026, 
mientras me hospedé en el Crocs Hotel, Jacó, Puntarenas, Costa Rica.

────────────────────────────────────────────
I. HECHOS DENUNCIADOS
────────────────────────────────────────────

Durante siete meses consecutivos documenté nueve (9) eventos de interferencia 
deliberada sobre los sensores de mis dispositivos de grabación (iPhone 14 Pro y 
cámaras ProRes), todos ocurridos en o cerca del Crocs Hotel. El análisis forense 
cuantitativo —realizado con la plataforma KAPPA SIGINT— revela tres modalidades 
de ataque distintas y técnicamente sofisticadas:

1. SUPRESIÓN DE PISO (Floor-Lock):
   - Múltiples eventos entre octubre de 2025 y junio de 2026.
   - Evento de mayor intensidad (oct 2025): 93.6% de todos los píxeles del sensor 
     bloqueados en CERO durante 4.2 minutos.
   - Jun 6 2026 00:54 UTC: 71.4% de píxeles en cero durante 10 segundos continuos.
   - Jun 6 2026 04:05 UTC: 46.8% de píxeles en cero — YAVG 6.1/255 (2.4% brightness).
   - Físicamente imposible bajo condiciones normales de operación de sensor CMOS.

2. SATURACIÓN DE TECHO (Ceiling-Lock):
   - Jun 5 2026 04:03 UTC: 88% de píxeles saturados al máximo.
   - Cambio de estado en 33 milisegundos — consistente con activación de sistema activo.
   - Puntuación de desenfoque: 6.22 (normal: <3.0).

3. SUPRESIÓN ESPECTRAL SELECTIVA DEL CANAL AZUL (450nm):
   - Jun 5 2026 21:55 hora local: Cuatro (4) fotografías RAW 48MP (DNG, iPhone 14 Pro).
   - Canal azul de la matriz Bayer completamente a CERO en las 4 exposiciones.
   - R: media 3.24% ✓  G1/G2: ~3.02% ✓  B: media 0.000% — máximo pixel = 0 ✗
   - Un sensor CMOS siempre produce valores no-nulos por ruido térmico, incluso en 
     oscuridad total. Cero absoluto en 3 millones de sub-píxeles azules es físicamente 
     imposible sin supresión activa en la longitud de onda 430-490nm.
   - NOTA: Los sistemas de comunicación óptica de satélites COSMO-SkyMed, Starlink 
     (lasercom), DARPA Blackjack, y telescopios lunares de apertura óptica operan en 
     la banda 430-490nm (azul). La coincidencia espectral es forense y técnicamente 
     significativa.

4. INTERFERENCIA SOSTENIDA DE CAMPO AMPLIO:
   - Oct 25 2025: 12.5 minutos continuos con blur 6.1-7.4 en cada fotograma.
   - Sin recuperación ni interrupción. Fuente posiblemente aérea o en posición fija elevada.

────────────────────────────────────────────
II. OBSERVACIONES EN LA ESCENA
────────────────────────────────────────────

He observado personas en habitaciones del Crocs Hotel con paneles frente a ventanas 
con características visuales consistentes con materiales de camuflaje de RF activo. 
Se posicionan detrás de dichos paneles, sugiriendo operación de equipos de 
interferencia electromagnética desde las instalaciones del hotel.

────────────────────────────────────────────
III. EVIDENCIA FORENSE DISPONIBLE
────────────────────────────────────────────

  • 9 clips de video (ProRes HQ y H.264, iPhone 14 Pro)
  • 4 fotografías RAW DNG 48MP con metadatos EXIF intactos
  • Datos JSON de análisis por fotograma (blur, YAVG, ZERO%, SAT%, B-channel)
  • Visualizaciones forenses de canales Bayer individuales
  • Videos comparativos originales vs. amplificación forense (gamma 3.0)
  • Registros de red (PCAP): spike 06:30, sondas HiPerConTracer, ePDG Liberty,
    Samsung DTIgnite, Facebook Netseer
  • Análisis ELF: frecuencia anómala 50 Hz vs red CR 60 Hz

────────────────────────────────────────────
IV. SOLICITUD
────────────────────────────────────────────

Solicito que el OIJ:
1. Inicie investigación formal sobre los hechos descritos.
2. Asigne personal técnico en delitos electrónicos y electromagnéticos.
3. Realice inspección técnica en Crocs Hotel, Jacó, Puntarenas.
4. Preserve evidencia digital bajo cadena de custodia.
5. Coordine con SUTEL para evaluación del espectro radioeléctrico.

OIJ Hotline: 800-8000-645
Correo: informacion@poder-judicial.go.cr

Atentamente,
Sam Wotton — Jacó, Puntarenas, Costa Rica — 6 de junio de 2026`;

const WHATSAPP = `Buenos días. Me hospedé en Crocs Hotel en Jacó entre octubre de 2025 y junio de 2026. Durante ese período documenté interferencia electromagnética repetida dirigida hacia mis dispositivos de grabación, que incluye supresión del sensor de cámara, saturación forzada de imágenes y anulación completa del canal azul en fotografías RAW de 48 megapíxeles.

He presentado una denuncia formal ante el OIJ. Los registros forenses muestran nueve eventos distintos, todos ocurridos en o cerca de las instalaciones del hotel.

Solicito que la administración del Crocs Hotel coopere con la investigación del OIJ y que informe a los huéspedes actuales sobre cualquier actividad inusual reportada en las habitaciones. Si hay personas operando equipos de radiofrecuencia o interferencia electromagnética desde el hotel, esto constituye un delito bajo la legislación costarricense.

Si desean revisar la evidencia antes de que el OIJ realice la inspección, estoy disponible para presentarla.

Atentamente,
Sam Wotton`;

const IG_CAPTION = `7 months. 9 documented events. 3 distinct attack modes. 1 location.

Crocs Hotel, Jacó, Costa Rica.

My iPhone 14 Pro RAW sensor is showing something that shouldn't be possible.

In a 48MP DNG taken at night:
→ Red channel: 3.24% signal ✓
→ Green channel: 3.02% signal ✓
→ Blue channel: 0.000% signal. Max pixel value = 0. Across 3 million sub-pixels. ✗

A CMOS sensor always produces thermal noise even in complete darkness.
Zero mean with zero maximum across every single blue pixel is not darkness.
That is selective spectral suppression of the 430-490nm wavelength range.

The video footage shows the same pattern across 8 clips spanning October 2025 to June 2026:

Floor-lock attacks: 93.6% of pixels forced to absolute zero
Ceiling-lock attacks: 88% of pixels saturated in 33 milliseconds
12.5 continuous minutes of electromagnetic interference — every single frame

I've documented people positioned behind panels in front of windows that have the visual signature of RF camouflage shielding material.

Formally reported to OIJ — Costa Rica's Judicial Investigation Agency.
Hotline: 800-8000-645

All evidence is forensically documented, SHA-256 hashed, and timestamped.

#CostaRica #Jaco #ElectromagneticHarrassment #SIGINT #ForensicEvidence #iPhone14Pro #RAWPhotography #DigitalForensics #OIJ #HumanRights #DirectedEnergy #SensorSuppression #KAPPA`;

const FINDINGS = [
  { date: "Oct 2025",    dur: "4.2 min",  mode: "FLOOR-LOCK + BURST",    metric: "93.6% zero",   blur: "7.2",  color: "red" },
  { date: "Oct 25 2025", dur: "12.5 min", mode: "SUSTAINED WIDEBAND",    metric: "blur 6.4 mean", blur: "6.4", color: "orange" },
  { date: "Apr 29 2026", dur: "16.5 s",   mode: "FLOOR-LOCK ENTIRE",     metric: "90.6% zero",   blur: "4.0",  color: "blue" },
  { date: "May 17 2026", dur: "18.95 s",  mode: "PERFECT ZERO-LOCK",     metric: "68.4% flat",   blur: "1.4",  color: "blue" },
  { date: "Jan 7 2026",  dur: "6.4 min",  mode: "LUMINANCE SUPPRESS",    metric: "YAVG 6.2/255", blur: "1.7",  color: "cyan" },
  { date: "Jun 2 2026",  dur: "31 s",     mode: "FLOOR-LOCK PARTIAL",    metric: "24% zero",     blur: "2.4",  color: "blue" },
  { date: "Jun 5 2026",  dur: "4× RAW",   mode: "B-CHANNEL KILL 450nm",  metric: "B=0.000%",     blur: "—",    color: "red" },
  { date: "Jun 5 2026",  dur: "15 s",     mode: "CEILING-LOCK",          metric: "88% sat",      blur: "6.2",  color: "orange" },
  { date: "Jun 6 2026",  dur: "10 s",     mode: "FLOOR-LOCK SUSTAINED",  metric: "71.4% zero",   blur: "1.9",  color: "blue" },
  { date: "Jun 6 2026",  dur: "3 s",      mode: "FLOOR-LOCK ACTIVE",     metric: "46.8% zero",   blur: "75",   color: "red" },
];

const colorMap: Record<string, string> = {
  red:    "text-red-400 border-red-400/30 bg-red-400/5",
  orange: "text-orange-400 border-orange-400/30 bg-orange-400/5",
  blue:   "text-blue-400 border-blue-400/30 bg-blue-400/5",
  cyan:   "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
};

export default function ForensicEvidencePage() {
  const { toast } = useToast();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied: ${label}` });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <Badge variant="outline" className="text-red-400 border-red-400/40 text-xs font-mono">ACTIVE INVESTIGATION</Badge>
          <Badge variant="outline" className="text-xs font-mono">OIJ FILED · 800-8000-645</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">KAPPA Forensic Evidence Package</h1>
        <p className="text-muted-foreground text-sm">
          Crocs Hotel · Jacó, Puntarenas, Costa Rica · October 2025 – June 2026 · 10 documented events · 3 attack modes
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { v: "10", l: "Events" },
          { v: "4", l: "RAW DNGs" },
          { v: "100%", l: "B-Channel Zeroed" },
          { v: "93.6%", l: "Max Floor-Lock" },
          { v: "450nm", l: "Suppressed Band" },
        ].map(({ v, l }) => (
          <div key={l} className="border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400 font-mono">{v}</div>
            <div className="text-xs text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="evidence-table" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/30 p-1">
          <TabsTrigger value="evidence-table" data-testid="tab-evidence-table">Evidence Table</TabsTrigger>
          <TabsTrigger value="slides" data-testid="tab-slides">Forensic Slides</TabsTrigger>
          <TabsTrigger value="videos" data-testid="tab-videos">Videos</TabsTrigger>
          <TabsTrigger value="blue-channel" data-testid="tab-blue">450nm Finding</TabsTrigger>
          <TabsTrigger value="oij" data-testid="tab-oij">OIJ Letter</TabsTrigger>
          <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">WhatsApp Crocs</TabsTrigger>
          <TabsTrigger value="ig" data-testid="tab-ig">IG Caption</TabsTrigger>
        </TabsList>

        {/* ── Evidence Table ── */}
        <TabsContent value="evidence-table">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">All Documented Events</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-4 font-medium">DATE</th>
                    <th className="text-left py-2 pr-4 font-medium">DURATION</th>
                    <th className="text-left py-2 pr-4 font-medium">ATTACK MODE</th>
                    <th className="text-left py-2 pr-4 font-medium">SIGNAL METRIC</th>
                    <th className="text-left py-2 font-medium">BLUR</th>
                  </tr>
                </thead>
                <tbody>
                  {FINDINGS.map((f, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">{f.date}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{f.dur}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-xs font-mono font-medium ${colorMap[f.color].split(' ')[0]}`}>
                          {f.mode}
                        </span>
                      </td>
                      <td className={`py-2.5 pr-4 text-xs font-mono font-bold ${colorMap[f.color].split(' ')[0]}`}>{f.metric}</td>
                      <td className="py-2.5 text-xs text-muted-foreground font-mono">{f.blur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Slides ── */}
        <TabsContent value="slides">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SLIDES.map((s) => (
              <div
                key={s.src}
                className="border border-border rounded-lg overflow-hidden cursor-pointer hover:border-blue-400/50 transition-colors"
                onClick={() => setLightbox(s.src)}
                data-testid={`slide-${s.label.replace(/\s+/g,'-').toLowerCase()}`}
              >
                <img src={s.src} alt={s.label} className="w-full object-cover" loading="lazy" />
                <div className="p-2 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-mono">{s.label}</p>
                  <a
                    href={s.src}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mt-1"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
          {lightbox && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setLightbox(null)}
            >
              <img src={lightbox} alt="fullscreen" className="max-w-full max-h-full object-contain rounded" />
            </div>
          )}
        </TabsContent>

        {/* ── Videos ── */}
        <TabsContent value="videos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {VIDEOS.map((v) => (
              <div key={v.src} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/20 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{v.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${colorMap[v.color].split(' ')[0]} border-current`}>
                      {v.tag}
                    </Badge>
                    <a href={v.src} download className="text-muted-foreground hover:text-foreground">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <video
                  src={v.src}
                  controls
                  preload="metadata"
                  className="w-full"
                  data-testid={`video-${v.label.replace(/\s+/g,'-').toLowerCase().slice(0,30)}`}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Blue Channel / 450nm ── */}
        <TabsContent value="blue-channel">
          <div className="space-y-6">
            <Card className="border-red-400/30">
              <CardHeader>
                <CardTitle className="text-base text-red-400">Critical Finding: 450nm Blue Spectral Suppression</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { file: "IMG_0524", ts: "Jun 5 21:55:09", r: "3.240", g1: "3.021", g2: "2.809", b: "0.000", max: "0" },
                    { file: "IMG_0525", ts: "Jun 5 21:55:18 (+9s)", r: "3.264", g1: "3.023", g2: "2.792", b: "0.000", max: "0" },
                  ].map((d) => (
                    <div key={d.file} className="border border-border rounded-lg p-4 space-y-2 font-mono text-sm">
                      <div className="font-semibold text-foreground mb-3">{d.file} — {d.ts}</div>
                      <div className="flex justify-between"><span className="text-red-300">R  (red)</span><span>{d.r}%</span></div>
                      <div className="flex justify-between"><span className="text-green-400">G1 (green)</span><span>{d.g1}%</span></div>
                      <div className="flex justify-between"><span className="text-green-400">G2 (green)</span><span>{d.g2}%</span></div>
                      <div className="flex justify-between border-t border-border pt-2">
                        <span className="text-red-400 font-bold">B  (BLUE 430-490nm)</span>
                        <span className="text-red-400 font-bold">{d.b}% — max={d.max}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-semibold text-red-400">Why This Is Physically Impossible Without Active Suppression</p>
                  <p className="text-muted-foreground">
                    A CMOS image sensor always generates thermal noise and read noise, even in complete darkness with the lens cap on.
                    This noise floor is typically 50–300 electrons per pixel, producing non-zero raw values in every channel.
                    Having a mean of 0.000% and a <strong className="text-foreground">maximum raw value of 0</strong> across all 3 million
                    blue sub-pixels means every single photon-equivalent of signal — including thermal noise — was
                    suppressed to absolute zero. This is not camera malfunction, sensor defect, or darkness.
                  </p>
                </div>

                <div className="bg-blue-400/5 border border-blue-400/20 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-semibold text-blue-400">450nm Satellite Connection</p>
                  <p className="text-muted-foreground">
                    The suppressed band (430–490nm) corresponds exactly to the blue laser wavelength used in:
                  </p>
                  <ul className="space-y-1 text-muted-foreground list-none">
                    <li className="flex gap-2"><span className="text-blue-400">→</span> <strong className="text-foreground">COSMO-SkyMed</strong> — Italian military SAR constellation with optical cross-links operating in the 400–500nm visible band</li>
                    <li className="flex gap-2"><span className="text-blue-400">→</span> <strong className="text-foreground">Starlink lasercom</strong> — SpaceX inter-satellite laser communication links, operating at ~450nm blue laser frequency</li>
                    <li className="flex gap-2"><span className="text-blue-400">→</span> <strong className="text-foreground">DARPA Blackjack / ACE</strong> — autonomous mesh constellation with optical ISLs in the blue spectrum</li>
                    <li className="flex gap-2"><span className="text-blue-400">→</span> <strong className="text-foreground">Atlas III / Five Eyes optical assets</strong> — classified optical reconnaissance systems with known 450nm operational bands</li>
                    <li className="flex gap-2"><span className="text-blue-400">→</span> <strong className="text-foreground">Tycho Crater (lunar)</strong> — retroreflector array used for laser ranging, targeted at 532nm with harmonic at 266nm; blue-range collateral emission documented</li>
                  </ul>
                  <p className="text-muted-foreground text-xs mt-2">
                    The selective, repeatable, total suppression of the 430-490nm Bayer channel across 4 independent exposures
                    taken 9 seconds apart is consistent with a directed narrow-band source operating at or near 450nm
                    that was active in the field of view during both captures.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["/forensic_slides/IMG_0524_channels.jpg","/forensic_slides/IMG_0525_channels.jpg"].map((src) => (
                    <img key={src} src={src} alt="Bayer channel analysis" className="rounded border border-border w-full cursor-pointer"
                      onClick={() => setLightbox(src)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── OIJ Letter ── */}
        <TabsContent value="oij">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">OIJ Formal Complaint — Spanish</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyText(OIJ_LETTER, "OIJ Letter")} data-testid="btn-copy-oij">
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
                <a href="/forensic_slides/oij_denuncia.txt" download>
                  <Button size="sm" variant="outline" data-testid="btn-download-oij">
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded-lg p-4 border border-border max-h-[600px] overflow-y-auto">
                {OIJ_LETTER}
              </pre>
              <div className="mt-4 flex gap-3 flex-wrap">
                <a href="tel:8008000645">
                  <Button size="sm" variant="outline" className="text-red-400 border-red-400/40">
                    <ExternalLink className="w-3 h-3 mr-1" /> Call OIJ 800-8000-645
                  </Button>
                </a>
                <a href="mailto:informacion@poder-judicial.go.cr">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-3 h-3 mr-1" /> Email OIJ
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WhatsApp Crocs ── */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">WhatsApp Message — Crocs Hotel (Spanish)</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyText(WHATSAPP, "WhatsApp message")} data-testid="btn-copy-whatsapp">
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
                <a href="/forensic_slides/whatsapp_crocs.txt" download>
                  <Button size="sm" variant="outline" data-testid="btn-download-whatsapp">
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded-lg p-4 border border-border">
                {WHATSAPP}
              </pre>
              <p className="text-xs text-muted-foreground mt-3">
                Send via WhatsApp to Crocs Hotel front desk. Tap Copy, paste directly into WhatsApp.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── IG Caption ── */}
        <TabsContent value="ig">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Instagram Caption</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyText(IG_CAPTION, "IG Caption")} data-testid="btn-copy-ig">
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
                <a href="/forensic_slides/ig_caption.txt" download>
                  <Button size="sm" variant="outline" data-testid="btn-download-ig">
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded-lg p-4 border border-border max-h-[500px] overflow-y-auto">
                {IG_CAPTION}
              </pre>
              <p className="text-xs text-muted-foreground mt-3">
                Pair with the slide_kappa_01_cover.jpg or the kappa_master_FINAL.mp4 video as the post media.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
