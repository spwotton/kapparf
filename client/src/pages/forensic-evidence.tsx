import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Film, AlertTriangle, ExternalLink, MapPin, Users, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── EM EVENT DATA ─────────────────────────────────────────────────────────────

const EM_EVENTS = [
  { phase: "1", mode: "FLOOR-LOCK + BURST",      zero: "93.6%", duration: "4.2 min",   metric: "93.6% pixels @ absolute zero", color: "red" },
  { phase: "2", mode: "SUSTAINED WIDEBAND",       zero: "—",     duration: "12.5 min",  metric: "blur coeff 6.4 · sustained",   color: "orange" },
  { phase: "3", mode: "LUMINANCE SUPPRESSION",    zero: "—",     duration: "6.4 min",   metric: "YAVG 6.2 / 255",              color: "cyan" },
  { phase: "4", mode: "FLOOR-LOCK PARTIAL",       zero: "24%",   duration: "31 s",      metric: "24% zero · partial clip",     color: "blue" },
  { phase: "5", mode: "FLOOR-LOCK ENTIRE CLIP",   zero: "90.6%", duration: "16.5 s",    metric: "90.6% zero · full duration",  color: "blue" },
  { phase: "6", mode: "PERFECT ZERO-LOCK",        zero: "68.4%", duration: "18.95 s",   metric: "68.4% flat · near-constant",  color: "blue" },
  { phase: "7", mode: "B-CHANNEL 100% ZEROED",    zero: "100%",  duration: "static",    metric: "4× RAW DNG · B=0.000% · max=0", color: "red" },
  { phase: "8", mode: "CEILING-LOCK",             zero: "88%",   duration: "33 ms trig",metric: "88% sat · 33ms onset",        color: "orange" },
  { phase: "9", mode: "FLOOR-LOCK × 2",           zero: "71.4%", duration: "sequential",metric: "71.4% + 46.8% zero",         color: "blue" },
  { phase: "10",mode: "FLOOR-LOCK × 2 (cont.)",  zero: "46.8%", duration: "3 s",       metric: "YAVG 6.1 / 255",             color: "blue" },
];

const SLIDES = [
  { src: "/forensic_slides/slide_kappa_01_cover.jpg",        label: "Cover — Overview" },
  { src: "/forensic_slides/slide_kappa_02_timeline.jpg",     label: "Event Timeline" },
  { src: "/forensic_slides/slide_kappa_03_blue_channel.jpg", label: "B-Channel 100% Zeroed" },
  { src: "/forensic_slides/slide_kappa_04_modes.jpg",        label: "3 Attack Modes" },
  { src: "/forensic_slides/slide_kappa_05_summary.jpg",      label: "Evidence Summary Table" },
  { src: "/forensic_slides/slide_rf_camo_los_rios.jpg",      label: "RF Camo — Los Ríos" },
  { src: "/forensic_slides/IMG_0524_channels.jpg",           label: "IMG_0524 Bayer Channels" },
  { src: "/forensic_slides/IMG_0525_channels.jpg",           label: "IMG_0525 Bayer Channels" },
  { src: "/forensic_slides/master_summary.jpg",              label: "Master Summary Frame" },
  { src: "/forensic_slides/oct25_timeline.jpg",              label: "12.5 min Sustained Event" },
  { src: "/forensic_slides/apr29_timeline.jpg",              label: "Floor Lock — Full Clip" },
];

const VIDEOS = [
  { src: "/forensic_slides/kappa_jan7_v3.mp4",           label: "Luminance Suppression — YAVG 6.2/255 · 6.4 min SBS",  tag: "6.4 min",  color: "cyan" },
  { src: "/forensic_slides/kappa_jun2_v3.mp4",           label: "Floor Lock — 24% zero · 31s SBS",                     tag: "31 s",     color: "blue" },
  { src: "/forensic_slides/kappa_jun6_new5_sbs.mp4",     label: "Floor Lock — 46.8% zero · YAVG 6.1 · 3s",            tag: "3 s",      color: "blue" },
  { src: "/forensic_slides/kappa_forensic_FINAL.mp4",    label: "Ceiling Lock — 88% sat · 33ms onset · narrated",      tag: "narrated", color: "orange" },
  { src: "/forensic_slides/kappa_suppression_FINAL.mp4", label: "Floor Lock — 71.4% zero · narrated",                  tag: "narrated", color: "blue" },
  { src: "/forensic_slides/kappa_apr29_FINAL.mp4",       label: "Floor Lock — 90.6% zero · full clip",                 tag: "16.5 s",   color: "blue" },
  { src: "/forensic_slides/kappa_may17_FINAL.mp4",       label: "Perfect Zero-Lock — 68.4% flat",                      tag: "18.95 s",  color: "blue" },
  { src: "/forensic_slides/kappa_master_FINAL.mp4",      label: "Master Briefing — all modes · full narration",        tag: "2.5 min",  color: "cyan" },
];

const NETWORK_NODES = [
  {
    id: "POI-001",
    role: "Origin Node — Property Manager",
    certainty: "confirmed",
    color: "red",
    detail: "Manages the initial rental property. Extortion demand issued immediately upon user's departure ($2,500). On user's return months later: ceiling structurally lowered ~90 cm, passive infrared motion sensors installed (Vison alarm system), parametric acoustic emitters operating continuously from garage, large visual obstruction (beach ball ~3.6m) purchased. Also owns the property directly across the street. Connected to every location in the chain.",
    tags: ["Origin", "Extortion $2,500", "Structural modification", "PIR sensors", "Parametric emitter", "Adjacent property owned"],
  },
  {
    id: "POI-002",
    role: "Primary Operative — Former Partner",
    certainty: "confirmed",
    color: "red",
    detail: "Lived at origin property with user for approximately 3 months. Has stated directly and repeatedly (100+ times on single day) that she is responsible for the operation. Suspected concurrent relationship with POI-005 throughout — described him falsely as a gym trainer. After departure: posted large cash sum on social media; shared pet (acquired together) believed returned to POI-005. Suspected involvement in $80,000+ credit card fraud.",
    tags: ["Self-claimed primary", "$80K fraud suspected", "Origin property Oct–Dec"],
  },
  {
    id: "POI-003",
    role: "Long-term Operative — Riverwalk (photographically identified)",
    certainty: "confirmed",
    color: "red",
    detail: "Identified in photograph. Resident at Riverwalk complex throughout campaign. POI-004 (roommate) committed physical assault at this location. Riverwalk is identified as a directed-acoustic / sonar equipment operation site.",
    photo: "/forensic_slides/matthew_hanlon_identified.jpg",
    tags: ["Riverwalk", "Photographically confirmed", "Sonar site"],
  },
  {
    id: "POI-004",
    role: "Physical Assault Perpetrator — Red-haired male",
    certainty: "confirmed",
    color: "red",
    detail: "Roommate of POI-003 at Riverwalk. Committed strangulation assault resulting in documented injuries (scratches, bruising — photographed). Identity unknown to user; OIJ can identify via Riverwalk resident records.",
    photo: "/forensic_slides/injuries_scratches.jpg",
    tags: ["Strangulation — Oct 2025", "Injuries documented", "Identity: OIJ to confirm"],
  },
  {
    id: "POI-005",
    role: "Peripheral — Indirect via POI-002",
    certainty: "indirect",
    color: "orange",
    detail: "Professional BMX rider. POI-002 visited his residence while with user, describing him falsely as a gym trainer. Never interacted with user directly. Was cited as a potential threat by operators but did not appear. His BMX associate (POI-006) was present at the ambush attempt.",
    photo: "/forensic_slides/poi_pastibmx.png",
    tags: ["BMX", "Indirect via POI-002", "Tournón / El Garza"],
  },
  {
    id: "POI-006",
    role: "Direct Threat Actor — Ambush attempt",
    certainty: "reported",
    color: "orange",
    detail: "BMX associate of POI-005. Present at friend's apartment on the date of the assault at Riverwalk. Operators used him as a threat to lure user out of the building complex onto the street. POI-002 independently confirmed she had transported him to that exact building after BMX training with POI-005.",
    photo: "/forensic_slides/poi_junior_araya.png",
    tags: ["Ambush attempt — Oct 2025", "POI-005 associate", "Jacó"],
  },
  {
    id: "POI-007",
    role: "Ground Associate — Jacó area",
    certainty: "reported",
    color: "orange",
    detail: "Ground-level operative in Jacó. Direct associate of POI-002. Possible link to a broader network family connection (under investigation).",
    tags: ["Jacó ground network", "POI-002 associate"],
  },
  {
    id: "POI-008",
    role: "Ground Associate — Jacó area (secondary)",
    certainty: "reported",
    color: "orange",
    detail: "Second ground-level associate. Acts alongside POI-007. Possible Jiménez family network connection — further corroboration required.",
    tags: ["Jacó ground network", "Possible family link"],
  },
  {
    id: "POI-009",
    role: "Noted — HNWI Concierge, Jacó (network mapping only)",
    certainty: "noted",
    color: "cyan",
    detail: "Verified luxury concierge business operating across Jacó, Tamarindo, and St Teresa. HNWI clientele. A common follower (lco_2017) bridges this account with other network nodes. Concierge access to hotel properties in Jacó is relevant infrastructure context. Included for network mapping — no direct operational role confirmed.",
    photo: "/forensic_slides/poi_shanti_concierge.png",
    tags: ["Jacó concierge", "HNWI access", "lco_2017 bridge", "Network mapping only"],
  },
];

const LOCATIONS = [
  {
    id: "LOC-A",
    label: "Origin Rental Property (Jaco Vacations)",
    color: "red",
    notes: [
      "Extortion demand ($2,500) issued immediately upon user's departure",
      "On return: ceiling structurally lowered ~90 cm",
      "Vison alarm system with PIR motion sensors installed throughout",
      "Parametric acoustic emitters operating from garage — continuous",
      "3.6m beach ball purchased — visual obstruction of equipment from street",
      "POI-001 owns the house directly across the street",
      "POI-001 connected to all subsequent properties in the chain",
    ],
  },
  {
    id: "LOC-B",
    label: "Breakwater Point Condo",
    color: "orange",
    notes: [
      "Second residence — moved here after leaving origin property",
      "EM interference campaign escalated significantly during this period",
      "Owners (Lipman family) subsequently relocated to LOC-C",
    ],
  },
  {
    id: "LOC-C",
    label: "Hermosa Palms",
    color: "cyan",
    notes: [
      "LOC-B owners relocated here — owned by a third-party developer",
      "Property built as personal family home",
      "Referenced for property-chain mapping",
    ],
  },
  {
    id: "LOC-D",
    label: "Riverwalk Complex",
    color: "red",
    notes: [
      "POI-003 and POI-004 (assault perpetrator) resident here",
      "Directed-acoustic / sonar equipment operated from this location",
      "Physical assault (strangulation) committed here",
      "Injuries photographically documented",
    ],
  },
  {
    id: "LOC-E",
    label: "Transitional Apartment (friend's property)",
    color: "orange",
    notes: [
      "3-unit building — tenants changed completely between user's stays",
      "Ambush attempt staged here: POI-006 used to lure user into street",
      "POI-002 independently confirmed she transported POI-006 to this building",
    ],
  },
  {
    id: "LOC-F",
    label: "Quebrada Seca, Los Ríos",
    color: "orange",
    notes: [
      "RF camouflage netting photographed at adjacent window from user's terrace",
      "Military-pattern leaf camouflage material — consistent with RF equipment concealment",
      "Photo timestamp: 22:21 local time",
      "Temporally correlated with onset of sustained wideband interference events",
    ],
  },
  {
    id: "LOC-G",
    label: "Crocs Hotel, Jacó — Primary EM Site",
    color: "red",
    notes: [
      "10 documented EM interference events across 3 distinct attack modes",
      "B-channel 100% zeroed in 4 independent RAW DNG captures",
      "Floor-lock, ceiling-lock, and sustained wideband all recorded",
      "Most recent event: floor-lock, YAVG 6.1/255, 46.8% zero",
      "OIJ formal complaint filed. All evidence SHA-256 hashed",
    ],
  },
];

const IG_CAPTION = `18 months. 10 documented electromagnetic events. 3 distinct attack modes. One location.

Jacó, Costa Rica.

iPhone 14 Pro RAW sensor — 48 megapixel DNG captured at night:

→ Red channel: 3.24%
→ Green channel: 3.02%
→ Blue channel: 0.000%
   Maximum pixel value = 0 across all 3 million blue sub-pixels

This is not darkness.

A CMOS sensor generates thermal noise in every pixel even in a completely sealed black box. Zero mean AND zero maximum across an entire Bayer channel is not an exposure issue — it is active suppression of the 430–490 nm spectral band.

8 video clips. Three interference signatures:

FLOOR-LOCK — 93.6% of all pixels forced to absolute zero
CEILING-LOCK — 88% saturation triggered in under 33 milliseconds
SUSTAINED WIDEBAND — 12.5 continuous minutes, blur coefficient 6.4

The campaign began immediately after leaving a rental property following an extortion demand. Physical assault documented and photographed. $80,000+ in credit card fraud. Formal complaint filed with the OIJ — Costa Rica Judicial Investigation Agency.

All 10 events are SHA-256 hashed, frame-analysed, and timestamped. 240,000+ source files on record.

OIJ tip line: 800-8000-645

#CostaRica #Jaco #DigitalForensics #iPhone14Pro #SIGINT #ForensicEvidence #OIJ #HumanRights #DirectedEnergy #SensorSuppression #ElectromagneticHarassment #KAPPA`;

const OIJ_LETTER = `ORGANISMO DE INVESTIGACIÓN JUDICIAL (OIJ)
Departamento de Criminalística / Unidad de Delitos Informáticos y Tecnológicos
San José, Costa Rica

DENUNCIA FORMAL — ACOSO SISTEMÁTICO, INTERFERENCIA ELECTROMAGNÉTICA,
AGRESIÓN FÍSICA, FRAUDE Y EXTORSIÓN

Estimados señores del OIJ:

Por medio de la presente, yo, Sam Wotton, ciudadano extranjero con residencia
temporal en Costa Rica, interpongo denuncia formal por los siguientes delitos.

═══════════════════════════════════════════
I. HECHOS
═══════════════════════════════════════════

1. EXTORSIÓN ($2,500): La administradora de la propiedad inicial (Jaco
   Vacations) exige $2,500 desde el día de mi retiro. Al regresar meses
   después encontré: techo bajado ~90 cm, sistema Vison con sensores PIR,
   emisores paramétricos activos desde el garaje, pelota obstructora de
   3.6 metros. La misma persona es propietaria de la casa al frente.

2. FRAUDE CON TARJETAS DE CRÉDITO ($80,000+): Mi expareja (Genesis
   Daniela Peralta Márquez, IG: gemperalta._) ha afirmado
   repetidamente ser la responsable de la operación. Se sospecha su
   participación en fraudes con tarjetas de crédito por más de $80,000.

3. AGRESIÓN FÍSICA: Un residente del complejo Riverwalk (compañero de
   cuarto de Matthew Hanlon, cabello rojo, identidad desconocida para
   el denunciante) me estranguló físicamente. Las lesiones están
   documentadas fotográficamente. Esa misma fecha, asociados intentaron
   atraerme a la calle para agredirme.

4. INTERFERENCIA ELECTROMAGNÉTICA ILEGAL: Diez (10) eventos documentados
   con análisis forense cuantitativo en Crocs Hotel, Jacó:
   • Supresión de canal azul (430-490 nm): 0.000% en 4 fotografías RAW
   • Floor-lock: 93.6% de píxeles en cero absoluto durante 4.2 minutos
   • Ceiling-lock: 88% de saturación en 33 milisegundos
   • Banda ancha sostenida: 12.5 minutos continuos
   • YAVG mínimo registrado: 6.1 de 255 posibles

5. MALLA DE CAMUFLAJE RF: Fotografiada en propiedad vecina (Quebrada
   Seca, Los Ríos) — malla de camuflaje militar cubriendo ventana,
   correlación temporal con inicio de interferencia sostenida.

═══════════════════════════════════════════
II. PERSONAS A INVESTIGAR
═══════════════════════════════════════════

• Jaco Vacations (administradora): inspección de garaje y propiedad
  al frente — emisores paramétricos, sensores PIR, estructura modificada

• Genesis Daniela Peralta Márquez (IG: gemperalta._): fraude de
  tarjetas, responsabilidad declarada en la operación

• Matthew Hanlon (Riverwalk): operativo de largo plazo, identificado
  fotográficamente, escena de la agresión

• Compañero de cuarto de Hanlon (cabello rojo): perpetrador del
  estrangulamiento — identificar vía registros de Riverwalk

═══════════════════════════════════════════
III. DELITOS (ARTÍCULOS APLICABLES)
═══════════════════════════════════════════

  Art. 214 CP — Extorsión
  Art. 217 CP — Fraude
  Art. 123 CP — Lesiones
  Ley 7593 SUTEL — Interferencia radioeléctrica ilegal
  Art. 22 Ley 8589 — Hostigamiento sistemático

═══════════════════════════════════════════
IV. EVIDENCIA DISPONIBLE
═══════════════════════════════════════════

  • 10 clips de video iPhone 14 Pro (ProRes HQ + H.264)
  • 4 fotografías RAW DNG 48MP con canal B = 0.000%
  • Fotografías de lesiones físicas
  • Fotografías de malla de camuflaje RF
  • Análisis forense por fotograma (KAPPA SIGINT platform)
  • Registros de red (PCAP): 240,000+ archivos
  • Análisis ELF: 50 Hz anómalo vs red CR 60 Hz
  • Todo hasheado SHA-256 con marca de tiempo

OIJ Hotline: 800-8000-645
informacion@poder-judicial.go.cr

Sam Wotton — Jacó, Puntarenas — Junio 2026`;

const WHATSAPP_MSG = `Buenos días. Me hospedé en Crocs Hotel en Jacó durante aproximadamente 8 meses. Durante ese período documenté diez (10) eventos de interferencia electromagnética dirigida a mis dispositivos de grabación:

• Canal azul del sensor (430–490 nm): completamente anulado en 4 fotografías RAW de 48 megapíxeles — valor máximo = 0 en 3 millones de sub-píxeles
• Floor-lock: 93.6% de píxeles en cero absoluto durante 4.2 minutos continuos
• Ceiling-lock: 88% de saturación en 33 milisegundos
• Interferencia de banda ancha sostenida: 12.5 minutos continuos

He presentado denuncia formal ante el OIJ. Solicito que la administración coopere con la investigación y notifique cualquier actividad técnica inusual en las instalaciones. La operación de equipos de radiofrecuencia o interferencia electromagnética desde el hotel constituye un delito bajo la Ley 7593 (SUTEL).

Toda la evidencia está hasheada (SHA-256) y disponible para presentar antes de la inspección del OIJ.

Atentamente, Sam Wotton
OIJ: 800-8000-645`;

// ── HELPERS ───────────────────────────────────────────────────────────────────

const COL: Record<string, string> = {
  red:    "text-red-400",
  orange: "text-orange-400",
  blue:   "text-blue-400",
  cyan:   "text-cyan-400",
};

const CERT_BADGE: Record<string, string> = {
  confirmed: "text-red-400 border-red-400/40",
  reported:  "text-orange-400 border-orange-400/40",
  indirect:  "text-yellow-400 border-yellow-400/40",
  noted:     "text-slate-400 border-slate-400/40",
};

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function ForensicEvidencePage() {
  const { toast } = useToast();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Copied: ${label}` });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <Badge variant="outline" className="text-red-400 border-red-400/40 text-xs font-mono">ACTIVE INVESTIGATION</Badge>
          <Badge variant="outline" className="text-xs font-mono">OIJ FILED · 800-8000-645</Badge>
          <Badge variant="outline" className="text-xs font-mono">18 MONTHS · JACÓ CR</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">KAPPA Forensic Evidence Package</h1>
        <p className="text-muted-foreground text-sm">
          Jacó, Puntarenas, Costa Rica · 10 EM events · 3 attack modes · Physical assault · $80K+ fraud · Extortion · 240,000+ source files
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {[
          ["10",     "EM Events"],
          ["3",      "Attack Modes"],
          ["100%",   "B-Chan Zero"],
          ["$80K+",  "Fraud"],
          ["$2,500", "Extortion"],
          ["450nm",  "Suppressed"],
        ].map(([v, l]) => (
          <div key={l} className="border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-400 font-mono">{v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="em-events" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/30 p-1">
          <TabsTrigger value="em-events">EM Events</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="physical">Physical Evidence</TabsTrigger>
          <TabsTrigger value="slides">Slides</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="blue-channel">450nm Finding</TabsTrigger>
          <TabsTrigger value="oij">OIJ Letter</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="ig">IG Caption</TabsTrigger>
        </TabsList>

        {/* ── EM EVENTS ── */}
        <TabsContent value="em-events">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Electromagnetic Interference Events — iPhone 14 Pro · Crocs Hotel, Jacó</CardTitle>
              <p className="text-xs text-muted-foreground">All events captured in ProRes HQ video and/or 48MP RAW DNG. Frame-by-frame analysis performed. All files SHA-256 hashed.</p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-3 font-medium w-12">#</th>
                    <th className="text-left py-2 pr-3 font-medium">MODE</th>
                    <th className="text-left py-2 pr-3 font-medium">ZERO %</th>
                    <th className="text-left py-2 pr-3 font-medium">DURATION</th>
                    <th className="text-left py-2 font-medium">KEY METRIC</th>
                  </tr>
                </thead>
                <tbody>
                  {EM_EVENTS.map((e) => (
                    <tr key={e.phase} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{e.phase}</td>
                      <td className={`py-2.5 pr-3 text-xs font-mono font-semibold ${COL[e.color]}`}>{e.mode}</td>
                      <td className="py-2.5 pr-3 text-xs font-mono text-foreground">{e.zero}</td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">{e.duration}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{e.metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              { mode: "FLOOR-LOCK", desc: "Pixel luminance forced to absolute zero (0/255). Max recorded: 93.6% of frame for 4.2 continuous minutes. Distinct from normal low-light — noise floor remains non-zero in darkness.", color: "blue" },
              { mode: "CEILING-LOCK", desc: "Pixel luminance forced to saturation (255/255). Onset in 33 milliseconds. Max recorded: 88% of frame. Distinct from overexposure — onset is near-instantaneous and bounded.", color: "orange" },
              { mode: "SUSTAINED WIDEBAND", desc: "Whole-frame blur / coherence disruption sustained across time. 12.5 continuous minutes at blur coefficient 6.4. Uniform spatial distribution rules out optical vibration.", color: "cyan" },
            ].map((m) => (
              <Card key={m.mode} className={`border-${m.color}-400/20`}>
                <CardContent className="pt-4">
                  <p className={`text-xs font-mono font-semibold ${COL[m.color]} mb-2`}>{m.mode}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── NETWORK ── */}
        <TabsContent value="network">
          <div className="mb-3 bg-muted/20 border border-border rounded-lg p-3 text-xs text-muted-foreground">
            Persons of interest identified by role only. No names displayed on this page.{" "}
            <span className="text-red-400">CONFIRMED</span> — directly witnessed or documented ·{" "}
            <span className="text-orange-400">REPORTED</span> — stated by user, contextually corroborated ·{" "}
            <span className="text-yellow-400">INDIRECT</span> — connected via confirmed persons ·{" "}
            <span className="text-slate-400">NOTED</span> — network mapping only, no operational role confirmed
          </div>
          <div className="space-y-3">
            {NETWORK_NODES.map((p) => (
              <Card key={p.id} className={`border ${p.color === "red" ? "border-red-400/20" : p.color === "orange" ? "border-orange-400/20" : "border-border"}`}>
                <CardContent className="pt-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {p.photo && (
                      <div className="flex-shrink-0 cursor-pointer" onClick={() => setLightbox(p.photo!)}>
                        <img src={p.photo} alt={p.id} className="rounded border border-border w-full md:w-32 md:h-32 object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`font-mono text-xs font-bold ${COL[p.color]}`}>{p.id}</span>
                        <Badge variant="outline" className={`text-xs ${CERT_BADGE[p.certainty]}`}>{p.certainty.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1.5">{p.role}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{p.detail}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <span key={t} className="text-xs bg-muted/40 text-muted-foreground px-2 py-0.5 rounded font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── LOCATIONS ── */}
        <TabsContent value="locations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOCATIONS.map((loc) => (
              <Card key={loc.id} className={`border ${loc.color === "red" ? "border-red-400/20" : loc.color === "orange" ? "border-orange-400/20" : "border-border"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${COL[loc.color]}`} />
                    <div>
                      <span className={`text-xs font-mono font-bold ${COL[loc.color]}`}>{loc.id}</span>
                      <CardTitle className="text-sm mt-0.5">{loc.label}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {loc.notes.map((n, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className={`${COL[loc.color]} flex-shrink-0`}>→</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 border border-red-400/20 rounded-lg p-4 bg-red-400/5">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">LOC-A (Origin) → connected to all subsequent locations</span>
            </div>
            <p className="text-xs text-muted-foreground">POI-001 has a demonstrated or suspected connection to every property in the chain. Consistent with either a coordinated property management network across Jacó, or active coordination between owners/managers to maintain access as the user relocates.</p>
          </div>
        </TabsContent>

        {/* ── PHYSICAL EVIDENCE ── */}
        <TabsContent value="physical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">RF Camouflage — Adjacent Property (LOC-F)</CardTitle></CardHeader>
              <CardContent>
                <img src="/forensic_slides/rf_camo_los_rios_sep25.jpg" alt="RF camo" className="w-full rounded border border-border cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/rf_camo_los_rios_sep25.jpg")} />
                <p className="text-xs text-muted-foreground">Military-pattern leaf camouflage netting covering a window / terrace of an adjacent property. Photographed from user's own terrace at 22:21 local time. Material is consistent with RF equipment concealment. Temporal correlation with onset of sustained wideband EM events.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">RF Camo — Street Context</CardTitle></CardHeader>
              <CardContent>
                <img src="/forensic_slides/los_rios_view_oct21.jpg" alt="Los Rios view" className="w-full rounded border border-border cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/los_rios_view_oct21.jpg")} />
                <p className="text-xs text-muted-foreground">Street-level view establishing geographic relationship between user's observation point and LOC-F property.</p>
              </CardContent>
            </Card>
            <Card className="border-red-400/20">
              <CardHeader><CardTitle className="text-sm text-red-400">Physical Injury Documentation — Oct 2025 Assault</CardTitle></CardHeader>
              <CardContent>
                <img src="/forensic_slides/injuries_scratches.jpg" alt="Injuries" className="w-full rounded border border-red-400/20 cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/injuries_scratches.jpg")} />
                <p className="text-xs text-muted-foreground">Scratches and bruising documented following strangulation assault at LOC-D (Riverwalk). Multiple parallel scratch marks consistent with defensive struggle. Deep abrasion on lower arm. Perpetrator: POI-004 (red-haired male, roommate of POI-003 at Riverwalk).</p>
              </CardContent>
            </Card>
            <Card className="border-orange-400/20">
              <CardHeader><CardTitle className="text-sm">POI-003 — Photographically Identified (LOC-D)</CardTitle></CardHeader>
              <CardContent>
                <img src="/forensic_slides/matthew_hanlon_identified.jpg" alt="POI-003" className="w-full rounded border border-orange-400/20 cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/matthew_hanlon_identified.jpg")} />
                <p className="text-xs text-muted-foreground">POI-003 (right, pink cap). Photographically confirmed. Long-term presence throughout campaign. Riverwalk resident alongside POI-004 (assault perpetrator). Directed-acoustic equipment operation attributed to LOC-D.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">RF Camo Forensic Analysis Slide</CardTitle></CardHeader>
              <CardContent>
                <img src="/forensic_slides/slide_rf_camo_los_rios.jpg" alt="RF camo slide" className="w-full rounded border border-border cursor-pointer"
                  onClick={() => setLightbox("/forensic_slides/slide_rf_camo_los_rios.jpg")} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── SLIDES ── */}
        <TabsContent value="slides">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SLIDES.map((s) => (
              <div key={s.src} className="border border-border rounded-lg overflow-hidden cursor-pointer hover:border-blue-400/40 transition-colors"
                onClick={() => setLightbox(s.src)}>
                <img src={s.src} alt={s.label} className="w-full object-cover" loading="lazy" />
                <div className="p-2 bg-muted/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-mono">{s.label}</p>
                  <a href={s.src} download onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300">
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── VIDEOS ── */}
        <TabsContent value="videos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {VIDEOS.map((v) => (
              <div key={v.src} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/20 p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Film className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{v.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`text-xs ${COL[v.color]} border-current`}>{v.tag}</Badge>
                    <a href={v.src} download><Download className="w-4 h-4 text-muted-foreground hover:text-foreground" /></a>
                  </div>
                </div>
                <video src={v.src} controls preload="metadata" className="w-full" />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── 450nm ── */}
        <TabsContent value="blue-channel">
          <div className="space-y-4">
            <Card className="border-red-400/30">
              <CardHeader><CardTitle className="text-sm text-red-400">Blue Channel Zeroed — 48MP RAW DNG · 4 Independent Files</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { f: "IMG_0524", r: "3.240", g1: "3.021", g2: "2.809", b: "0.000", bmax: "0" },
                    { f: "IMG_0525", r: "3.264", g1: "3.023", g2: "2.792", b: "0.000", bmax: "0" },
                  ].map((d) => (
                    <div key={d.f} className="border border-border rounded p-4 font-mono text-sm space-y-1.5">
                      <div className="font-semibold mb-2 text-foreground">{d.f}</div>
                      <div className="flex justify-between text-muted-foreground"><span className="text-red-300">R</span><span>{d.r}%</span></div>
                      <div className="flex justify-between text-muted-foreground"><span className="text-green-400">G1</span><span>{d.g1}%</span></div>
                      <div className="flex justify-between text-muted-foreground"><span className="text-green-400">G2</span><span>{d.g2}%</span></div>
                      <div className="flex justify-between border-t border-border pt-1.5">
                        <span className="text-red-400 font-bold">B (430–490 nm)</span>
                        <span className="text-red-400 font-bold">{d.b}% · max = {d.bmax}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-red-400/5 border border-red-400/20 rounded p-4">
                  <p className="text-sm font-semibold text-red-400 mb-2">Why max = 0 across 3 million pixels is physically impossible</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">A CMOS sensor generates thermal noise and read noise in every photo-site continuously — including in complete darkness with the lens cap on. This noise is random but non-zero. A result of mean = 0 AND maximum = 0 across all 3,000,000 blue-channel sub-pixels in a 48MP DNG is not consistent with any normal photographic condition (darkness, underexposure, or sensor malfunction). It is consistent with active suppression of the 430–490 nm band before the signal reaches the ADC.</p>
                </div>

                <div className="bg-blue-400/5 border border-blue-400/20 rounded p-4">
                  <p className="text-sm font-semibold text-blue-400 mb-2">Known systems operating at 430–490 nm</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {[
                      ["COSMO-SkyMed (Italy)", "Optical inter-satellite links in the 400–500 nm band"],
                      ["Starlink laser comm", "Inter-satellite laser links operating at ~450 nm"],
                      ["DARPA Blackjack / ACE", "Autonomous mesh constellation — blue-range optical ISLs"],
                      ["Atlas III / Five Eyes optical", "Classified reconnaissance — 450 nm operational band documented"],
                    ].map(([sys, desc]) => (
                      <li key={sys} className="flex gap-2">
                        <span className="text-blue-400 flex-shrink-0">→</span>
                        <span><span className="text-foreground font-medium">{sys}</span> — {desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {["/forensic_slides/IMG_0524_channels.jpg", "/forensic_slides/IMG_0525_channels.jpg"].map((src) => (
                    <img key={src} src={src} alt="Bayer channel" className="rounded border border-border cursor-pointer w-full"
                      onClick={() => setLightbox(src)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── OIJ ── */}
        <TabsContent value="oij">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">OIJ Denuncia Formal</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Private legal document — names appear here for OIJ use only</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(OIJ_LETTER, "OIJ Letter")}><Copy className="w-3 h-3 mr-1" />Copiar</Button>
                <a href="/forensic_slides/oij_denuncia.txt" download><Button size="sm" variant="outline"><Download className="w-3 h-3 mr-1" />TXT</Button></a>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded p-4 border border-border max-h-[600px] overflow-y-auto">{OIJ_LETTER}</pre>
              <div className="mt-3 flex gap-2 flex-wrap">
                <a href="tel:8008000645"><Button size="sm" variant="outline" className="text-red-400 border-red-400/30"><ExternalLink className="w-3 h-3 mr-1" />800-8000-645</Button></a>
                <a href="mailto:informacion@poder-judicial.go.cr"><Button size="sm" variant="outline"><ExternalLink className="w-3 h-3 mr-1" />informacion@poder-judicial.go.cr</Button></a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WHATSAPP ── */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">WhatsApp — Crocs Hotel</CardTitle>
              <Button size="sm" variant="outline" onClick={() => copy(WHATSAPP_MSG, "WhatsApp")}><Copy className="w-3 h-3 mr-1" />Copiar</Button>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded p-4 border border-border">{WHATSAPP_MSG}</pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── IG ── */}
        <TabsContent value="ig">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Instagram Caption — no names, empirical only</CardTitle>
              <Button size="sm" variant="outline" onClick={() => copy(IG_CAPTION, "IG Caption")}><Copy className="w-3 h-3 mr-1" />Copy</Button>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded p-4 border border-border max-h-[600px] overflow-y-auto">{IG_CAPTION}</pre>
              <p className="text-xs text-muted-foreground mt-2">Pair with the master briefing video or the blue-channel slide for maximum impact.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/92 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="fullscreen" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
        </div>
      )}
    </div>
  );
}
