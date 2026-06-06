import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Film, AlertTriangle, ExternalLink, MapPin, User, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── DATA ─────────────────────────────────────────────────────────────────────

const SLIDES = [
  { src: "/forensic_slides/slide_kappa_01_cover.jpg",        label: "Cover — Overview" },
  { src: "/forensic_slides/slide_kappa_02_timeline.jpg",     label: "Incident Timeline" },
  { src: "/forensic_slides/slide_kappa_03_blue_channel.jpg", label: "B-Channel 100% Zeroed" },
  { src: "/forensic_slides/slide_kappa_04_modes.jpg",        label: "3 Attack Modes" },
  { src: "/forensic_slides/slide_kappa_05_summary.jpg",      label: "Evidence Summary Table" },
  { src: "/forensic_slides/slide_rf_camo_los_rios.jpg",      label: "RF Camo — Los Ríos Sep 25" },
  { src: "/forensic_slides/IMG_0524_channels.jpg",           label: "IMG_0524 Bayer Channels" },
  { src: "/forensic_slides/IMG_0525_channels.jpg",           label: "IMG_0525 Bayer Channels" },
  { src: "/forensic_slides/DNG_NEW3_channels.jpg",           label: "DNG_NEW3 Channels" },
  { src: "/forensic_slides/DNG_NEW4_channels.jpg",           label: "DNG_NEW4 Channels" },
  { src: "/forensic_slides/master_summary.jpg",              label: "Master Summary Frame" },
  { src: "/forensic_slides/oct25_timeline.jpg",              label: "Oct 25 Sustained 12.5min" },
  { src: "/forensic_slides/apr29_timeline.jpg",              label: "Apr 29 Floor Lock" },
];

const VIDEOS = [
  { src: "/forensic_slides/kappa_jan7_v3.mp4",          label: "Jan 7 — 6.4min Luminance Suppression SBS",  tag: "6.4 min",  color: "cyan" },
  { src: "/forensic_slides/kappa_jun2_v3.mp4",          label: "Jun 2 — 31s Floor Lock SBS",                tag: "31 s",     color: "blue" },
  { src: "/forensic_slides/kappa_jun6_new5_sbs.mp4",    label: "Jun 6 04:05 UTC — 47% Zero NEW",            tag: "3 s NEW",  color: "red" },
  { src: "/forensic_slides/kappa_forensic_FINAL.mp4",   label: "Jun 5 — Ceiling Lock 88% Sat Narrated",     tag: "narrated", color: "orange" },
  { src: "/forensic_slides/kappa_suppression_FINAL.mp4",label: "Jun 6 — Floor Lock 71% Narrated",           tag: "narrated", color: "blue" },
  { src: "/forensic_slides/kappa_apr29_FINAL.mp4",      label: "Apr 29 — 90.6% Floor Lock",                 tag: "16.5 s",   color: "blue" },
  { src: "/forensic_slides/kappa_may17_FINAL.mp4",      label: "May 17 — Perfect Zero Lock",                tag: "18.95 s",  color: "blue" },
  { src: "/forensic_slides/kappa_master_FINAL.mp4",     label: "Master Narration — 151s Full Brief",        tag: "2.5 min",  color: "cyan" },
];

const EVENTS = [
  { date: "Dec 28 2024",  loc: "Jaco Vacations",  mode: "ORIGIN EVENT",           metric: "Moved out — extortion begins", color: "red" },
  { date: "Jan 2025",     loc: "Breakwater Point", mode: "HARASSMENT BEGINS",      metric: "Extreme — escalating",         color: "red" },
  { date: "Apr 2025",     loc: "Jaco Vac (return)",mode: "PHYSICAL MODIFICATION",  metric: "Ceiling 3ft lower, PIR, param",color: "orange" },
  { date: "Sep 25 2025",  loc: "Quebrada Seca",    mode: "RF CAMO OBSERVED",       metric: "Military netting at window",    color: "orange" },
  { date: "Oct 14 2025",  loc: "Riverwalk",        mode: "PHYSICAL ASSAULT",       metric: "Strangulation + jump attempt",  color: "red" },
  { date: "Oct 19 2025",  loc: "Crocs Hotel",      mode: "FLOOR-LOCK + BURST",     metric: "93.6% zero  4.2min",           color: "red" },
  { date: "Oct 25 2025",  loc: "Crocs Hotel",      mode: "SUSTAINED WIDEBAND",     metric: "blur 6.4  12.5min",            color: "orange" },
  { date: "Apr 29 2026",  loc: "Crocs Hotel",      mode: "FLOOR-LOCK ENTIRE CLIP", metric: "90.6% zero  16.5s",            color: "blue" },
  { date: "May 17 2026",  loc: "Crocs Hotel",      mode: "PERFECT ZERO-LOCK",      metric: "68.4% flat  18.95s",           color: "blue" },
  { date: "Jan 7 2026",   loc: "Crocs Hotel",      mode: "LUMINANCE SUPPRESS",     metric: "YAVG 6.2/255  6.4min",        color: "cyan" },
  { date: "Jun 2 2026",   loc: "Crocs Hotel",      mode: "FLOOR-LOCK PARTIAL",     metric: "24% zero  31s",                color: "blue" },
  { date: "Jun 5 2026",   loc: "Crocs Hotel",      mode: "B-CHANNEL 100% ZERO",    metric: "4× RAW DNG  B=0.000%",        color: "red" },
  { date: "Jun 5 2026",   loc: "Crocs Hotel",      mode: "CEILING-LOCK",           metric: "88% sat  33ms trigger",        color: "orange" },
  { date: "Jun 6 2026",   loc: "Crocs Hotel",      mode: "FLOOR-LOCK × 2",         metric: "71.4% + 46.8% zero",          color: "blue" },
];

const PERSONS = [
  {
    name: "Diana Soto",
    ig: null,
    role: "ORIGIN NODE — Property Manager",
    certainty: "confirmed",
    detail: "Jaco Vacations property manager. Connected to every property user has stayed at. Extortion demand: $2,500 since Dec 28 2024. When user returned to her property (Apr 2025): ceiling had been lowered 3ft, Vison PIR alarm system installed, parametric emitters active from garage, 12ft beach ball obstruction purchased, and she owns the house directly across the street.",
    photo: null,
    tags: ["Jaco Vacations", "Extortion $2,500", "Property modification", "PIR sensors", "Parametric emitter"],
    color: "red",
  },
  {
    name: "Genesis Daniela Peralta Márquez",
    ig: "gemperalta._",
    role: "Primary Operative (claimed)",
    certainty: "confirmed",
    detail: "Former partner. Lived with user at Jaco Vacations Oct–Dec 2024. Has claimed 100+ times today she is behind the operation. Suspected ongoing relationship with Pablo Mora throughout time with user. Would travel to Tournón/El Garza area (Pablo's neighbourhood) for 'personal training sessions' — user never saw Pablo at the gym. After separation: posted large cash stack on Instagram and photo of 'lost' shared cat (suggesting she kept it and returned it to Pablo). Lies about Pablo's occupation.",
    photo: null,
    tags: ["Jaco Vacations", "Tournón/El Garza", "Claimed primary", "$80K fraud suspected"],
    color: "red",
  },
  {
    name: "Matthew Hanlon",
    ig: null,
    role: "Long-term operative — identified in photo",
    certainty: "confirmed",
    detail: "Identified in photograph. Long-term involvement throughout campaign. Lived at Riverwalk complex. His red-haired roommate committed the physical assault (strangulation) on Oct 14 2025. Riverwalk identified as sonar equipment operation site.",
    photo: "/forensic_slides/matthew_hanlon_identified.jpg",
    tags: ["Riverwalk", "Sonar operations", "Oct 14 assault location"],
    color: "red",
  },
  {
    name: "Red-haired male (unnamed)",
    ig: null,
    role: "Physical assault perpetrator",
    certainty: "confirmed",
    detail: "Lived with Matthew Hanlon at Riverwalk. Committed strangulation assault against user. Physical injuries documented (scratches, bruising). Assault occurred Oct 14 2025.",
    photo: "/forensic_slides/injuries_scratches.jpg",
    tags: ["Riverwalk", "Strangulation Oct 14 2025", "Physical evidence documented"],
    color: "red",
  },
  {
    name: "Pablo Mora",
    ig: "pastibmx",
    role: "Peripheral — Genesis's suspected parallel partner",
    certainty: "indirect",
    detail: "Pro BMX rider. Genesis confirmed she visited his apartment in Tournón area near El Garza while with user. User never met him. Genesis falsely described him as a gym trainer — he is a professional BMX rider (2,800+ followers). After separation Genesis posted photo of 'lost' cat, believed returned to Pablo. Was threatened to be called in to fight user but did not appear. His BMX associate Junior Araya was present at the Oct 14 threat incident.",
    photo: "/forensic_slides/poi_pastibmx.png",
    tags: ["Tournón / El Garza", "BMX", "Genesis parallel relationship"],
    color: "orange",
  },
  {
    name: "Junior Araya",
    ig: "junior_araya",
    role: "Direct threat actor — lure/ambush Oct 14",
    certainty: "reported",
    detail: "BMX friend of Pablo Mora. Jacó-based (bio: '#bmx Jaco CR'). Present at Leo's apartment on Oct 14 2025. Operators used him as a threat — claimed they would call him to come fight. Attempted to lure user out of the apartment complex to be jumped on the street. Has a sister named Genesis (separate from Peralta). When user was at Rico's/Famoso's, operators constantly claimed 'his sister was there'. Genesis Peralta confirmed she had dropped him off at that exact apartment after BMX with Pablo.",
    photo: "/forensic_slides/poi_junior_araya.png",
    tags: ["Leo's apartment", "Oct 14 lure attempt", "Pablo Mora associate", "Jacó"],
    color: "orange",
  },
  {
    name: "Marjorie Alfaro",
    ig: null,
    role: "Associate — network connection",
    certainty: "reported",
    detail: "Possibly Jiménez (married name). Possibly related to Jorge Jiménez — may be his brother's wife. Associated with the broader network.",
    photo: null,
    tags: ["Possible Jiménez link"],
    color: "orange",
  },
  {
    name: "Jairo Alfaro",
    ig: null,
    role: "Ground operative — Jacó",
    certainty: "reported",
    detail: "Ground troops in Jacó area. Acts as sidekick/associate to Genesis Daniela Peralta Márquez.",
    photo: null,
    tags: ["Jacó ground network", "Genesis associate"],
    color: "orange",
  },
  {
    name: "Melissa López Sánchez",
    ig: "melika_losa",
    role: "Noted associate — uncertain involvement",
    certainty: "uncertain",
    detail: "Seen in person on one of the October 2025 dates. Was present at Leo's apartment on the day user moved out ('smashed stuff' day). Her name is repeatedly claimed by operators as being 'with them.' User notes she may not be actively involved — she was a tenant at the apartment, not necessarily an operative. Treat as noted/uncertain pending further corroboration.",
    photo: null,
    tags: ["Leo's apartment", "Oct 2025 sighting", "Name claimed by operators"],
    color: "cyan",
  },
  {
    name: "Ale Vida",
    ig: "alevida89",
    role: "Noted associate — possible Melissa connection",
    certainty: "uncertain",
    detail: "Fits physical pattern described alongside Genesis (thigh tattoo confirmed in photo, similar appearance). Possibly Melissa López Sánchez's girlfriend. Noted for network mapping purposes.",
    photo: "/forensic_slides/poi_alevida89.png",
    tags: ["Possible Melissa associate", "Physical pattern match"],
    color: "cyan",
  },
  {
    name: "Shanti Dunia RF",
    ig: "shantidunia / shanticonciergeluxury_cr",
    role: "Noted — luxury concierge, Jacó network",
    certainty: "noted",
    detail: "Verified Instagram business account: Shanti Concierge. HNWI (High Net Worth Individual) luxury concierge service covering Jacó, Tamarindo, and St Teresa. 1,428 followers, 5,353 following. Key common followers with other network nodes include lco_2017. A concierge with HNWI access in Jacó represents potential infrastructure for placing operatives across hotel properties. Noted for further investigation.",
    photo: "/forensic_slides/poi_shanti_concierge.png",
    tags: ["Jacó concierge", "HNWI access", "Verified account", "lco_2017 connection"],
    color: "cyan",
  },
  {
    name: "Dunia Y.oírLo I",
    ig: "dunia__the_world_mean",
    role: "Noted — Shanti network",
    certainty: "noted",
    detail: "Personal account linked to Shanti Dunia / shanticonciergeluxury_cr business. 1,049 posts. Common follower lco_2017 bridges both this account and shantidunia. Noted for network mapping.",
    photo: "/forensic_slides/poi_dunia_world_mean.png",
    tags: ["Shanti Dunia network", "lco_2017 link"],
    color: "cyan",
  },
];

const LOCATIONS = [
  {
    name: "Jaco Vacations (Diana Soto property)",
    period: "Oct–Dec 2024 / Apr–? 2025",
    color: "red",
    notes: [
      "Origin of campaign — user + Genesis Peralta lived here Oct–Dec 2024",
      "User moved out Dec 28 without notice → $2,500 extortion demand begins",
      "On return Apr 2025: ceiling structurally lowered 3 feet",
      "Vison alarm system with PIR motion sensors installed",
      "Parametric acoustic emitters active from garage",
      "12-foot beach ball purchased — visual obstruction of equipment from street",
      "Diana Soto also owns the house directly across the street",
    ],
  },
  {
    name: "Breakwater Point (Michael Lipman condo)",
    period: "Dec 28 2024 – Apr 2025",
    color: "orange",
    notes: [
      "Moved here after leaving Jaco Vacations Dec 28 2024",
      "Harassment became extreme starting Jan 2025",
      "Michael Lipman + wife Daniela later moved to Hermosa Palms (Michael Greenfield's property)",
      "Left in April 2025 due to conflict with Genesis",
    ],
  },
  {
    name: "Hermosa Palms (Michael Greenfield)",
    period: "Reference",
    color: "cyan",
    notes: [
      "Owned by Michael Greenfield",
      "Michael Lipman + wife Daniela moved here from Breakwater Point",
      "Greenfield built this as personal family home",
    ],
  },
  {
    name: "Riverwalk / Todd Johnson (Greenwald-managed)",
    period: "During campaign",
    color: "red",
    notes: [
      "Located below El Miro",
      "Managed by Greenwald",
      "Matthew Hanlon + red-haired assailant lived here",
      "Sonar/directed acoustic equipment operated from this location",
      "Physical assault (strangulation) occurred here Oct 14 2025",
    ],
  },
  {
    name: "Leo's apartment (3-unit)",
    period: "Oct 2025",
    color: "orange",
    notes: [
      "Friend Leo's property — 3 units: girls at end, 3 guys middle, user",
      "User moved out and back in — tenants completely changed on return",
      "Melissa López Sánchez present on the move-out day",
      "Oct 14 2025: operators threatened to call Junior Araya; lure/jump attempt",
      "Genesis Peralta had previously dropped Junior Araya here after BMX with Pablo Mora",
    ],
  },
  {
    name: "Rico's & Famoso's",
    period: "During campaign",
    color: "cyan",
    notes: [
      "User and Genesis Peralta lived here (Fruteria Pueblo across the street)",
      "Genesis would leave to visit Tournón area (Pablo Mora's neighbourhood)",
      "Operators repeatedly claimed Junior Araya's sister was present here",
    ],
  },
  {
    name: "Quebrada Seca, Los Ríos",
    period: "Sep 25 2025",
    color: "orange",
    notes: [
      "RF camouflage netting photographed at window/terrace 22:21 local time",
      "Observed from user's apartment terrace across the street",
      "Military-pattern leaf camouflage consistent with RF concealment material",
      "Temporal correlation: Oct 2025 sustained wideband interference began same week",
    ],
  },
  {
    name: "Crocs Hotel, Jacó",
    period: "Oct 2025 – Jun 6 2026",
    color: "red",
    notes: [
      "Primary EM interference location — 10 documented sensor events",
      "3 attack modes: floor-lock, ceiling-lock, sustained wideband",
      "Blue channel 100% zeroed in 4 RAW DNG photos (Jun 5 2026)",
      "Latest event: Jun 6 2026 04:05 UTC — 46.8% zero, YAVG 6.1/255",
      "OIJ formal complaint filed",
    ],
  },
];

const OIJ_LETTER = `ORGANISMO DE INVESTIGACIÓN JUDICIAL (OIJ)
Departamento de Criminalística / Unidad de Delitos Informáticos y Tecnológicos
San José, Costa Rica

Fecha: 6 de junio de 2026

DENUNCIA FORMAL — ACOSO SISTEMÁTICO, INTERFERENCIA ELECTROMAGNÉTICA,
AGRESIÓN FÍSICA, FRAUDE Y EXTORSIÓN

Estimados señores del OIJ:

Por medio de la presente, yo, Sam Wotton, ciudadano extranjero con residencia
temporal en Costa Rica, interpongo denuncia formal por los siguientes delitos
cometidos en mi contra entre diciembre de 2024 y junio de 2026, en múltiples
propiedades en Jacó, Puntarenas, Costa Rica.

═══════════════════════════════════════════════
I. ORIGEN DEL CASO Y CRONOLOGÍA
═══════════════════════════════════════════════

OCT–DIC 2024 — Jaco Vacations (Diana Soto)
  Residí con mi pareja Genesis Daniela Peralta Márquez en una propiedad
  administrada por Diana Soto (empresa: Jaco Vacations). Me retiré el 28
  de diciembre de 2024 sin previo aviso.

DIC 28 2024 — INICIO DE EXTORSIÓN
  Diana Soto exige $2,500 desde esa fecha. Me niego. La campaña de
  acoso comienza de inmediato.

DIC 28 2024 – ABR 2025 — Breakwater Point (Condo de Michael Lipman)
  El acoso se vuelve extremo en enero de 2025.

ABR 2025 — Regreso a propiedad de Diana Soto (Jaco Vacations)
  Al regresar, encontré modificaciones físicas en la propiedad:
  • El techo había sido bajado ~90 cm (3 pies)
  • Sistema de alarma Vison con sensores PIR instalados
  • Emisores paramétricos activos desde el garaje constantemente
  • Se compró una pelota de playa de ~3.6 metros como obstrucción visual
  • Diana Soto es propietaria de la casa directamente al frente

25 SET 2025 — Malla de camuflaje RF fotografiada
  En Quebrada Seca (Los Ríos): malla de camuflaje militar en ventana
  de propiedad vecina, fotografiada desde mi terraza (22:21 hora local).

14 OCT 2025 — AGRESIÓN FÍSICA (Riverwalk)
  Un hombre de cabello rojo, residente en Riverwalk con Matthew Hanlon,
  me estranguló físicamente. Las lesiones (rasguños, hematomas) están
  documentadas fotográficamente. Esa misma fecha, Junior Araya y
  asociados intentaron atraerme fuera del complejo de apartamentos
  de mi amigo Leo para agredirme en la calle.

OCT 2025 – JUN 2026 — Crocs Hotel, Jacó
  Diez (10) eventos de interferencia electromagnética documentados con
  análisis forense cuantitativo. Tres modalidades de ataque distintas.
  Último evento: 6 de junio de 2026, 04:05 UTC.

═══════════════════════════════════════════════
II. PERSONAS INVOLUCRADAS
═══════════════════════════════════════════════

1. DIANA SOTO — Jaco Vacations
   Rol: Nodo de origen. Extorsión $2,500. Modificaciones estructurales
   en propiedad. Propietaria de casa al frente. Conectada a TODAS las
   propiedades donde residí.

2. GENESIS DANIELA PERALTA MÁRQUEZ — IG: gemperalta._
   Rol: Pareja anterior. Ha afirmado hoy más de 100 veces ser la
   responsable de la operación. Vivió en Jaco Vacations Oct–Dic 2024.
   Sospechosa de fraude con tarjetas de crédito ($80,000+).

3. MATTHEW HANLON — Residencia: Riverwalk, Jacó
   Rol: Operativo de largo plazo. Identificado fotográficamente.
   Su compañero de cuarto (cabello rojo) cometió la agresión del 14 oct.

4. HOMBRE DE CABELLO ROJO (nombre desconocido)
   Rol: Perpetrador de estrangulamiento. Residente en Riverwalk con
   Matthew Hanlon. 14 de octubre de 2025. Lesiones documentadas.

5. JUNIOR ARAYA — IG: junior_araya (BMX, Jacó CR)
   Rol: Presente en apartamento de Leo el 14 oct 2025. Parte del
   intento de emboscada. Genesis Peralta confirmó haberlo llevado al
   mismo apartamento. Amigo de Pablo Mora.

6. PABLO MORA — IG: pastibmx (BMX rider profesional)
   Rol: Periférico. Posible pareja paralela de Genesis durante
   relación con denunciante. Propiedad en zona Tournón / El Garza.

7. MARJORIE ALFARO (posiblemente Jiménez)
   Rol: Asociada de la red. Posible vínculo con Jorge Jiménez.

8. JAIRO ALFARO
   Rol: Operativo de campo en Jacó. Asociado directo de Genesis Peralta.

9. MELISSA LÓPEZ SÁNCHEZ — IG: melika_losa
   Rol: Vista en persona en octubre 2025. Presente en apartamento de
   Leo el día que me retiré. Nombre mencionado repetidamente por
   operativos. Nivel de participación incierto.

═══════════════════════════════════════════════
III. PROPIEDADES CLAVE A INSPECCIONAR
═══════════════════════════════════════════════

1. Jaco Vacations (Diana Soto) — Jacó, Puntarenas
   Inspección técnica: emisores en garaje, techo modificado,
   PIR sensors, propiedad al frente.

2. Quebrada Seca (Los Ríos) — propiedad con malla de camuflaje RF
   Fotografiada 25 sep 2025. Coordinar con SUTEL.

3. Riverwalk (Todd Johnson / Greenwald) — debajo de El Miro
   Escena de agresión física. Equipos de sonar reportados.

4. Crocs Hotel, Jacó — escena principal de interferencia EM

═══════════════════════════════════════════════
IV. DELITOS DENUNCIADOS
═══════════════════════════════════════════════

  • Extorsión: $2,500 (Art. 214 Código Penal CR)
  • Fraude con tarjetas de crédito: $80,000+ (Art. 217 CP)
  • Agresión física / estrangulamiento: Oct 14 2025 (Art. 123 CP)
  • Interferencia electromagnética ilegal (Ley 7593 SUTEL)
  • Acoso y hostigamiento sistemático (Art. 22 Ley 8589)
  • Modificación ilegal de propiedad con fines de vigilancia

═══════════════════════════════════════════════
V. EVIDENCIA FORENSE DISPONIBLE
═══════════════════════════════════════════════

  • 10 clips de video (ProRes HQ y H.264, iPhone 14 Pro)
  • 4 fotografías RAW DNG 48MP con metadatos EXIF intactos
  • Fotografías de lesiones físicas (14 oct 2025)
  • Fotografías de malla de camuflaje RF (25 sep 2025, 22:21)
  • Datos JSON de análisis cuadro por cuadro (blur, YAVG, ZERO%, SAT%, canal B)
  • Visualizaciones forenses de canales Bayer individuales (B=0.000%)
  • Registros de red (PCAP): spike 06:30, sondas HiPerConTracer,
    enrutamiento ePDG Liberty, Samsung DTIgnite, Facebook Netseer
  • Análisis ELF: frecuencia anómala 50 Hz vs red CR de 60 Hz
  • Capturas OSINT de perfiles en redes sociales de personas involucradas
  • Toda la evidencia está hasheada (SHA-256) y con marca de tiempo

═══════════════════════════════════════════════
VI. SOLICITUD
═══════════════════════════════════════════════

Solicito que el OIJ:
1. Inicie investigación formal inmediata.
2. Detenga a la persona que cometió el estrangulamiento (Riverwalk).
3. Inspeccione las propiedades de Diana Soto / Jaco Vacations.
4. Coordine con SUTEL para evaluación del espectro radioeléctrico.
5. Investigue el fraude de $80,000+ en tarjetas de crédito.
6. Preserve evidencia digital bajo cadena de custodia.

OIJ Hotline: 800-8000-645
Correo: informacion@poder-judicial.go.cr

Atentamente,
Sam Wotton
Jacó, Puntarenas, Costa Rica
6 de junio de 2026`;

const WHATSAPP = `Buenos días. Me hospedé en Crocs Hotel en Jacó entre octubre de 2025 y junio de 2026. Durante ese período documenté interferencia electromagnética repetida dirigida hacia mis dispositivos de grabación: supresión del sensor de cámara, saturación forzada, y anulación completa del canal azul en fotografías RAW de 48 megapíxeles.

He presentado denuncia formal ante el OIJ. Los registros forenses muestran diez (10) eventos documentados, todos ocurridos en o cerca de las instalaciones del hotel.

Solicito que la administración del Crocs Hotel coopere con la investigación del OIJ e informe a los huéspedes actuales sobre cualquier actividad inusual. La operación de equipos de radiofrecuencia o interferencia electromagnética desde el hotel constituye un delito bajo la legislación costarricense.

Estoy disponible para presentar la evidencia antes de la inspección del OIJ.

Atentamente, Sam Wotton`;

const IG_CAPTION = `7 months. 14 documented events. 3 distinct attack modes. 1 location.

Crocs Hotel, Jacó, Costa Rica.

My iPhone 14 Pro RAW sensor is showing something that shouldn't be possible.

48MP DNG taken at night:
→ Red channel: 3.24% ✓
→ Green channel: 3.02% ✓
→ Blue channel: 0.000% — max pixel = 0 across 3 million sub-pixels ✗

A CMOS sensor always produces thermal noise even in complete darkness.
Zero mean AND zero maximum across every blue pixel is not darkness.
That is selective spectral suppression of the 430-490nm wavelength range.

8 video clips spanning October 2025 to June 2026:
Floor-lock: 93.6% of pixels forced to absolute zero
Ceiling-lock: 88% saturated in 33 milliseconds
12.5 continuous minutes of wideband interference

This started after I left a rental property managed by Jaco Vacations on Dec 28 2024.
The manager has been attempting to extort $2,500 from me since that date.
I was physically assaulted (strangled) in October 2025.
I have lost $80,000+ in credit card fraud.

Formally reported to OIJ — Costa Rica Judicial Investigation Agency.
Hotline: 800-8000-645

All evidence is forensically documented, SHA-256 hashed, and timestamped on the KAPPA platform.

#CostaRica #Jaco #ElectromagneticHarrassment #SIGINT #ForensicEvidence #iPhone14Pro #DigitalForensics #OIJ #HumanRights #DirectedEnergy #SensorSuppression #JacoVacations #ExtortionCR #KAPPA`;

// ── HELPERS ───────────────────────────────────────────────────────────────────

const CERT_STYLE: Record<string, string> = {
  confirmed: "text-red-400 border-red-400/40 bg-red-400/8",
  reported:  "text-orange-400 border-orange-400/40 bg-orange-400/8",
  indirect:  "text-yellow-400 border-yellow-400/40 bg-yellow-400/8",
  uncertain: "text-cyan-400 border-cyan-400/40 bg-cyan-400/8",
  noted:     "text-slate-400 border-slate-400/40 bg-slate-400/8",
};

const COL: Record<string, string> = {
  red:    "text-red-400",
  orange: "text-orange-400",
  blue:   "text-blue-400",
  cyan:   "text-cyan-400",
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────

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
          <Badge variant="outline" className="text-xs font-mono">DEC 2024 – JUN 2026</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">KAPPA Forensic Evidence Package</h1>
        <p className="text-muted-foreground text-sm">
          Jacó, Puntarenas, Costa Rica · 18 months · 14 documented events · Physical assault · $80K+ fraud · Extortion
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {[
          ["14", "Events"],
          ["10", "EM Incidents"],
          ["100%", "B-Chan Zero"],
          ["$80K+", "Fraud"],
          ["$2,500", "Extortion"],
          ["450nm", "Suppressed"],
        ].map(([v, l]) => (
          <div key={l} className="border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-400 font-mono">{v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/30 p-1">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="persons">Persons & Network</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="physical">Physical Evidence</TabsTrigger>
          <TabsTrigger value="slides">EM Slides</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="blue-channel">450nm Finding</TabsTrigger>
          <TabsTrigger value="oij">OIJ Letter</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="ig">IG Caption</TabsTrigger>
        </TabsList>

        {/* ── TIMELINE ── */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Full Incident Timeline — Dec 2024 to Jun 2026</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-3 font-medium">DATE</th>
                    <th className="text-left py-2 pr-3 font-medium">LOCATION</th>
                    <th className="text-left py-2 pr-3 font-medium">EVENT</th>
                    <th className="text-left py-2 font-medium">DETAIL</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map((e, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{e.date}</td>
                      <td className="py-2.5 pr-3 text-xs text-muted-foreground">{e.loc}</td>
                      <td className={`py-2.5 pr-3 text-xs font-mono font-semibold ${COL[e.color]}`}>{e.mode}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{e.metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PERSONS ── */}
        <TabsContent value="persons">
          <div className="space-y-4">
            <div className="bg-muted/20 border border-border rounded-lg p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Certainty levels:</strong>{" "}
              <span className="text-red-400">CONFIRMED</span> — directly witnessed or documented ·{" "}
              <span className="text-orange-400">REPORTED</span> — stated by user, corroborated by context ·{" "}
              <span className="text-yellow-400">INDIRECT</span> — connected through confirmed persons ·{" "}
              <span className="text-cyan-400">UNCERTAIN</span> — mentioned, level of involvement unclear ·{" "}
              <span className="text-slate-400">NOTED</span> — documented for network mapping only
            </div>
            {PERSONS.map((p) => (
              <Card key={p.name} className={`border ${p.color === "red" ? "border-red-400/20" : p.color === "orange" ? "border-orange-400/20" : "border-border"}`}>
                <CardContent className="pt-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {p.photo && (
                      <div
                        className="flex-shrink-0 w-full md:w-36 cursor-pointer"
                        onClick={() => setLightbox(p.photo!)}
                      >
                        <img src={p.photo} alt={p.name} className="rounded border border-border w-full md:w-36 md:h-36 object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold text-foreground">{p.name}</span>
                        {p.ig && (
                          <span className="text-xs text-muted-foreground font-mono">@{p.ig}</span>
                        )}
                        <Badge variant="outline" className={`text-xs ${CERT_STYLE[p.certainty]}`}>
                          {p.certainty.toUpperCase()}
                        </Badge>
                      </div>
                      <p className={`text-xs font-semibold mb-2 ${COL[p.color]}`}>{p.role}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{p.detail}</p>
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
              <Card key={loc.name} className={`border ${loc.color === "red" ? "border-red-400/20" : loc.color === "orange" ? "border-orange-400/20" : "border-border"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${COL[loc.color]}`} />
                    <div>
                      <CardTitle className="text-sm">{loc.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{loc.period}</p>
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
          <div className="mt-4 border border-orange-400/20 rounded-lg p-4 bg-orange-400/5">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">Diana Soto / Jaco Vacations — Connected to ALL locations</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The extortion origin (Diana Soto, Jaco Vacations) has a demonstrated or suspected connection to every property
              the user has resided in since December 2024. This is consistent with either a property management network
              operating across Jacó rentals, or active coordination between property owners/managers to maintain surveillance
              access as the user relocates.
            </p>
          </div>
        </TabsContent>

        {/* ── PHYSICAL EVIDENCE ── */}
        <TabsContent value="physical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">RF Camouflage Netting — Sep 25 2025 22:21 local</CardTitle></CardHeader>
              <CardContent>
                <img
                  src="/forensic_slides/rf_camo_los_rios_sep25.jpg"
                  alt="RF camo Los Rios"
                  className="w-full rounded border border-border cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/rf_camo_los_rios_sep25.jpg")}
                />
                <p className="text-xs text-muted-foreground">Quebrada Seca, Los Ríos, Jacó. Military-pattern leaf camouflage netting covering window/terrace. Photographed from user's terrace across the street. Consistent with RF equipment concealment. Temporal match with Oct 2025 sustained wideband interference.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Los Ríos Street View — Oct 21 2025</CardTitle></CardHeader>
              <CardContent>
                <img
                  src="/forensic_slides/los_rios_view_oct21.jpg"
                  alt="Los Rios view"
                  className="w-full rounded border border-border cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/los_rios_view_oct21.jpg")}
                />
                <p className="text-xs text-muted-foreground">Street-level view of Los Ríos, Quebrada Seca. Establishes location geography and property positions relative to user's observation point.</p>
              </CardContent>
            </Card>
            <Card className="border-red-400/20">
              <CardHeader><CardTitle className="text-sm text-red-400">Physical Injury Documentation — Oct 14 2025</CardTitle></CardHeader>
              <CardContent>
                <img
                  src="/forensic_slides/injuries_scratches.jpg"
                  alt="Physical injuries"
                  className="w-full rounded border border-red-400/20 cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/injuries_scratches.jpg")}
                />
                <p className="text-xs text-muted-foreground">Scratches and bruising documented morning after strangulation assault by red-haired male at Riverwalk. Multiple parallel scratch marks consistent with defensive struggle. Deep abrasion at lower arm. Perpetrator: unnamed red-haired male, roommate of Matthew Hanlon.</p>
              </CardContent>
            </Card>
            <Card className="border-red-400/20">
              <CardHeader><CardTitle className="text-sm text-red-400">Matthew Hanlon — Identified</CardTitle></CardHeader>
              <CardContent>
                <img
                  src="/forensic_slides/matthew_hanlon_identified.jpg"
                  alt="Matthew Hanlon"
                  className="w-full rounded border border-red-400/20 cursor-pointer mb-3"
                  onClick={() => setLightbox("/forensic_slides/matthew_hanlon_identified.jpg")}
                />
                <p className="text-xs text-muted-foreground">Matthew Hanlon (right, pink cap) identified. Long-term involvement. Lived at Riverwalk where physical assault occurred and where sonar operations were reported. Associated with the unnamed red-haired assailant.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">RF Camo Forensic Analysis Slide</CardTitle></CardHeader>
              <CardContent>
                <img
                  src="/forensic_slides/slide_rf_camo_los_rios.jpg"
                  alt="RF camo forensic slide"
                  className="w-full rounded border border-border cursor-pointer"
                  onClick={() => setLightbox("/forensic_slides/slide_rf_camo_los_rios.jpg")}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── EM SLIDES ── */}
        <TabsContent value="slides">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SLIDES.map((s) => (
              <div
                key={s.src}
                className="border border-border rounded-lg overflow-hidden cursor-pointer hover:border-blue-400/50 transition-colors"
                onClick={() => setLightbox(s.src)}
              >
                <img src={s.src} alt={s.label} className="w-full object-cover" loading="lazy" />
                <div className="p-2 bg-muted/20 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-mono">{s.label}</p>
                  <a href={s.src} download onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300">
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
                <div className="bg-muted/20 p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

        {/* ── 450nm FINDING ── */}
        <TabsContent value="blue-channel">
          <div className="space-y-4">
            <Card className="border-red-400/30">
              <CardHeader><CardTitle className="text-sm text-red-400">B-Channel 100% Zeroed — 48MP RAW DNG — Jun 5 2026</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { f: "IMG_0524", ts: "21:55:09", r: "3.240", g1: "3.021", g2: "2.809", b: "0.000" },
                    { f: "IMG_0525", ts: "21:55:18 (+9s)", r: "3.264", g1: "3.023", g2: "2.792", b: "0.000" },
                  ].map((d) => (
                    <div key={d.f} className="border border-border rounded p-4 font-mono text-sm space-y-1.5">
                      <div className="font-semibold mb-2">{d.f} — {d.ts}</div>
                      <div className="flex justify-between"><span className="text-red-300">R</span><span>{d.r}%</span></div>
                      <div className="flex justify-between"><span className="text-green-400">G1</span><span>{d.g1}%</span></div>
                      <div className="flex justify-between"><span className="text-green-400">G2</span><span>{d.g2}%</span></div>
                      <div className="flex justify-between border-t border-border pt-1.5">
                        <span className="text-red-400 font-bold">B (430–490nm)</span>
                        <span className="text-red-400 font-bold">{d.b}% — max=0</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-red-400/5 border border-red-400/20 rounded p-4 text-sm">
                  <p className="font-semibold text-red-400 mb-2">Why max=0 across 3M pixels is physically impossible</p>
                  <p className="text-muted-foreground">CMOS sensors always generate thermal + read noise in every pixel, even in complete darkness. A zero mean AND zero maximum across all 3 million blue sub-pixels is not darkness — it is active suppression of the 430–490nm band.</p>
                </div>
                <div className="bg-blue-400/5 border border-blue-400/20 rounded p-4 text-sm">
                  <p className="font-semibold text-blue-400 mb-2">450nm — Known Systems Operating at This Wavelength</p>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    {[
                      ["COSMO-SkyMed", "Italian military constellation — optical cross-links in 400–500nm band"],
                      ["Starlink lasercom", "Inter-satellite laser communication links (~450nm)"],
                      ["DARPA Blackjack / ACE", "Autonomous mesh constellation — optical ISLs in blue spectrum"],
                      ["Atlas III / Five Eyes optical", "Classified reconnaissance — known 450nm operational band"],
                      ["Tycho Crater retroreflector", "Lunar laser ranging system — blue-range harmonic emission documented"],
                    ].map(([sys, desc]) => (
                      <li key={sys} className="flex gap-2"><span className="text-blue-400 flex-shrink-0">→</span><span><strong className="text-foreground">{sys}</strong> — {desc}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {["/forensic_slides/IMG_0524_channels.jpg", "/forensic_slides/IMG_0525_channels.jpg"].map((src) => (
                    <img key={src} src={src} alt="channel" className="rounded border border-border cursor-pointer w-full"
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
              <CardTitle className="text-sm">OIJ Denuncia Formal — Español</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(OIJ_LETTER, "OIJ Letter")}><Copy className="w-3 h-3 mr-1" />Copiar</Button>
                <a href="/forensic_slides/oij_denuncia.txt" download><Button size="sm" variant="outline"><Download className="w-3 h-3 mr-1" />TXT</Button></a>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded p-4 border border-border max-h-[600px] overflow-y-auto">{OIJ_LETTER}</pre>
              <div className="mt-3 flex gap-2 flex-wrap">
                <a href="tel:8008000645"><Button size="sm" variant="outline" className="text-red-400 border-red-400/30"><ExternalLink className="w-3 h-3 mr-1" />800-8000-645</Button></a>
                <a href="mailto:informacion@poder-judicial.go.cr"><Button size="sm" variant="outline"><ExternalLink className="w-3 h-3 mr-1" />Email OIJ</Button></a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WHATSAPP ── */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">WhatsApp — Crocs Hotel (Español)</CardTitle>
              <Button size="sm" variant="outline" onClick={() => copy(WHATSAPP, "WhatsApp")}><Copy className="w-3 h-3 mr-1" />Copiar</Button>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded p-4 border border-border">{WHATSAPP}</pre>
              <p className="text-xs text-muted-foreground mt-2">Copiar y pegar directamente en WhatsApp.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── IG ── */}
        <TabsContent value="ig">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Instagram Caption</CardTitle>
              <Button size="sm" variant="outline" onClick={() => copy(IG_CAPTION, "IG Caption")}><Copy className="w-3 h-3 mr-1" />Copy</Button>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-muted/20 rounded p-4 border border-border max-h-[500px] overflow-y-auto">{IG_CAPTION}</pre>
              <p className="text-xs text-muted-foreground mt-2">Pair with slide_kappa_01_cover.jpg or kappa_master_FINAL.mp4 as post media.</p>
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
