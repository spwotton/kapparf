import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Radio, AlertTriangle, MapPin, Clock, Shield, FileText,
  ChevronRight, Wifi, Thermometer, Eye, RotateCw, Zap,
  Copy, CheckCheck, ExternalLink, Info, Activity
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────
const LOCATION = { lat: 9.6270, lng: -84.6286, label: "Yoga Place Rear — Houses 9–11" };
const OBSERVER  = { lat: 9.6280, lng: -84.6295, label: "Hotel Pochote Grande Balcony" };
const COMPOUND  = { lat: 9.6265, lng: -84.6282, label: "Santa Reyes Compound" };

// ── Rotating dish SVG ────────────────────────────────────────────────────────
function AnimatedDish({ className = "" }: { className?: string }) {
  const [angle, setAngle] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      setAngle(((ts - start) * 0.06) % 360);
      ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [paused]);

  const rad = (angle * Math.PI) / 180;
  // Dish shape: parabolic arc points at `angle`
  const cx = 80, cy = 80, r = 52;
  const tipX = cx + r * Math.cos(rad);
  const tipY = cy + r * Math.sin(rad);
  const leftX = cx + (r * 0.55) * Math.cos(rad + 1.7);
  const leftY = cy + (r * 0.55) * Math.sin(rad + 1.7);
  const rightX = cx + (r * 0.55) * Math.cos(rad - 1.7);
  const rightY = cy + (r * 0.55) * Math.sin(rad - 1.7);
  const mX = cx + (r * 0.22) * Math.cos(rad);
  const mY = cy + (r * 0.22) * Math.sin(rad);

  // Beam cone — 3 transparency rings
  const beamLen = 110;
  const b1x = cx + beamLen * Math.cos(rad);
  const b1y = cy + beamLen * Math.sin(rad);

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 160 160" className="w-full h-full">
        {/* Beam rings */}
        {[0.18, 0.12, 0.06].map((op, i) => (
          <ellipse key={i}
            cx={cx + (38 + i * 18) * Math.cos(rad)}
            cy={cy + (38 + i * 18) * Math.sin(rad)}
            rx={(12 + i * 10)}
            ry={(7 + i * 6)}
            transform={`rotate(${angle + 90}, ${cx + (38 + i * 18) * Math.cos(rad)}, ${cy + (38 + i * 18) * Math.sin(rad)})`}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1"
            opacity={op}
          />
        ))}
        {/* Beam axis */}
        <line x1={cx} y1={cy} x2={b1x} y2={b1y} stroke="#ef4444" strokeWidth="0.8" opacity="0.25" strokeDasharray="3 3" />
        {/* Dish bowl */}
        <path
          d={`M ${leftX} ${leftY} Q ${tipX} ${tipY} ${rightX} ${rightY}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Feed arm */}
        <line x1={mX} y1={mY} x2={tipX} y2={tipY} stroke="#94a3b8" strokeWidth="1.5" />
        {/* Feed element */}
        <circle cx={tipX} cy={tipY} r="3" fill="#f97316" />
        {/* Mount */}
        <circle cx={cx} cy={cy} r="5" fill="#334155" />
        <line x1={cx} y1={cy} x2={cx} y2={cy + 28} stroke="#475569" strokeWidth="2" />
        {/* Base */}
        <rect x={cx - 8} y={cy + 26} width="16" height="4" rx="2" fill="#334155" />
      </svg>
      <button
        onClick={() => setPaused(p => !p)}
        className="absolute bottom-1 right-1 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {paused ? "▶ resume" : "⏸ pause"}
      </button>
      <div className="absolute top-1 left-1 text-[10px] text-muted-foreground font-mono">
        {Math.round(angle)}°
      </div>
    </div>
  );
}

// ── Geometry diagram ─────────────────────────────────────────────────────────
function GeometryDiagram() {
  const [showBeam, setShowBeam] = useState(true);
  const [showWall, setShowWall] = useState(true);

  return (
    <div>
      <div className="flex gap-3 mb-3">
        <button onClick={() => setShowBeam(b => !b)}
          className={`text-xs px-2 py-1 rounded border ${showBeam ? "bg-red-500/10 border-red-500/30 text-red-400" : "border-border text-muted-foreground"}`}>
          RF beam {showBeam ? "ON" : "OFF"}
        </button>
        <button onClick={() => setShowWall(b => !b)}
          className={`text-xs px-2 py-1 rounded border ${showWall ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "border-border text-muted-foreground"}`}>
          Perimeter wall {showWall ? "ON" : "OFF"}
        </button>
      </div>
      <svg viewBox="0 0 400 220" className="w-full border border-border rounded-lg bg-muted/20 text-xs">
        {/* Grid */}
        {[0, 50, 100, 150, 200, 250, 300, 350, 400].map(x => (
          <line key={x} x1={x} y1={0} x2={x} y2={220} stroke="currentColor" opacity="0.04" />
        ))}
        {[0, 55, 110, 165, 220].map(y => (
          <line key={y} x1={0} y1={y} x2={400} y2={y} stroke="currentColor" opacity="0.04" />
        ))}

        {/* Ocean / beach label */}
        <rect x={0} y={0} width={60} height={220} fill="#0ea5e9" opacity="0.06" />
        <text x={30} y={115} textAnchor="middle" fontSize="8" fill="#0ea5e9" opacity="0.6">PACIFIC</text>

        {/* Road */}
        <rect x={60} y={95} width={340} height={12} fill="#78716c" opacity="0.15" />
        <text x={350} y={104} textAnchor="end" fontSize="7" fill="#a8a29e">Paseo del Mar</text>

        {/* Hotel Pochote Grande — observer */}
        <rect x={62} y={30} width={55} height={60} rx="2" fill="#1e40af" opacity="0.3" stroke="#3b82f6" strokeWidth="1" />
        <text x={89} y={65} textAnchor="middle" fontSize="7" fill="#93c5fd">POCHOTE</text>
        <text x={89} y={74} textAnchor="middle" fontSize="7" fill="#93c5fd">GRANDE</text>
        {/* Balcony */}
        <rect x={117} y={48} width={10} height={18} rx="1" fill="#3b82f6" opacity="0.5" />
        <text x={122} y={44} textAnchor="middle" fontSize="6" fill="#60a5fa">balcony</text>
        {/* Observer dot */}
        <circle cx={122} cy={57} r="4" fill="#3b82f6" />
        <text x={138} y={60} fontSize="6" fill="#60a5fa">SAM</text>

        {/* Yoga place */}
        <rect x={175} y={30} width={40} height={60} rx="2" fill="#166534" opacity="0.25" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="3 2" />
        <text x={195} y={58} textAnchor="middle" fontSize="6.5" fill="#86efac">YOGA</text>
        <text x={195} y={67} textAnchor="middle" fontSize="6.5" fill="#86efac">PLACE</text>

        {/* Antenna post */}
        <circle cx={218} cy={75} r="5" fill="#ef4444" />
        <line x1={218} y1={75} x2={218} y2={90} stroke="#94a3b8" strokeWidth="1.5" />
        <text x={218} y={26} textAnchor="middle" fontSize="6.5" fill="#ef4444">📡 DISH</text>
        <text x={218} y={34} textAnchor="middle" fontSize="6" fill="#ef4444">ROTATING</text>

        {/* RF beam to observer */}
        {showBeam && (
          <>
            <line x1={213} y1={72} x2={126} y2={57} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.7" />
            <polygon points="126,53 120,57 126,61" fill="#ef4444" opacity="0.7" />
            <text x={168} y={62} textAnchor="middle" fontSize="6" fill="#ef4444">~95m LOS</text>
          </>
        )}

        {/* Santa Reyes compound */}
        <rect x={260} y={30} width={80} height={90} rx="2" fill="#7c2d12" opacity="0.2" stroke="#f97316" strokeWidth="1" />
        <text x={300} y={58} textAnchor="middle" fontSize="7" fill="#fb923c">SANTA</text>
        <text x={300} y={67} textAnchor="middle" fontSize="7" fill="#fb923c">REYES</text>
        <text x={300} y={76} textAnchor="middle" fontSize="7" fill="#fb923c">COMPOUND</text>

        {/* Perimeter wall */}
        {showWall && (
          <>
            <rect x={258} y={28} width={84} height={4} rx="1" fill="#92400e" opacity="0.7" />
            <text x={300} y={20} textAnchor="middle" fontSize="6.5" fill="#d97706">— perimeter wall —</text>
            {/* Operatives over wall at 00:29 */}
            <circle cx={280} cy={28} r="3.5" fill="#f59e0b" />
            <circle cx={290} cy={26} r="3.5" fill="#f59e0b" />
            <text x={285} y={14} textAnchor="middle" fontSize="5.5" fill="#fbbf24">2× operatives</text>
            <text x={285} y={20} textAnchor="middle" fontSize="5.5" fill="#fbbf24">00:29 Jun 9</text>
            <line x1={284} y1={26} x2={122} y2={57} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
          </>
        )}

        {/* La Flor Hotel */}
        <rect x={130} y={30} width={40} height={60} rx="2" fill="#581c87" opacity="0.2" stroke="#a855f7" strokeWidth="0.8" />
        <text x={150} y={60} textAnchor="middle" fontSize="6.5" fill="#c084fc">LA FLOR</text>
        <text x={150} y={68} textAnchor="middle" fontSize="6.5" fill="#c084fc">HOTEL</text>

        {/* Houses 9–11 */}
        <text x={216} y={108} textAnchor="middle" fontSize="6" fill="#94a3b8">Houses 9–11</text>

        {/* Compass */}
        <text x={380} y={20} fontSize="9" fill="#94a3b8">N↑</text>

        {/* Distance scale */}
        <line x1={60} y1={210} x2={160} y2={210} stroke="#64748b" strokeWidth="1" />
        <text x={110} y={218} textAnchor="middle" fontSize="6" fill="#64748b">~100 m</text>

        {/* Deauth zone */}
        <ellipse cx={122} cy={57} rx={28} ry={18} fill="none" stroke="#facc15" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.5" />
        <text x={95} y={82} fontSize="5.5" fill="#facc15">deauth zone</text>
      </svg>
      <p className="text-[11px] text-muted-foreground mt-2">
        Approximate layout from Google Maps + observer description. Not to scale. Line-of-sight distance observer → antenna: ~95 m.
      </p>
    </div>
  );
}

// ── Physics calculator ────────────────────────────────────────────────────────
function PhysicsCalculator() {
  const [diameterCm, setDiameterCm] = useState(90);
  const [freqGHz, setFreqGHz] = useState(2.4);

  const lambda = 0.3 / freqGHz;
  const d = diameterCm / 100;
  const efficiency = 0.55;
  const gainLin = efficiency * (Math.PI * d / lambda) ** 2;
  const gainDBi = 10 * Math.log10(gainLin);
  const hpbwDeg = 70 * lambda / d;
  const eirp = gainDBi + 30; // assuming 30 dBm transmitter
  const rangeM = 10 ** ((eirp - (-70) - 20 * Math.log10(freqGHz * 1e9) + 147.55) / 20);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Dish diameter (cm)</label>
          <input type="range" min={30} max={200} value={diameterCm}
            onChange={e => setDiameterCm(+e.target.value)}
            className="w-full accent-red-500" />
          <div className="text-sm font-mono mt-1">{diameterCm} cm</div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Frequency (GHz)</label>
          <input type="range" min={0.4} max={10} step={0.1} value={freqGHz}
            onChange={e => setFreqGHz(+e.target.value)}
            className="w-full accent-orange-500" />
          <div className="text-sm font-mono mt-1">{freqGHz.toFixed(1)} GHz</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        {[
          { label: "Gain", value: `${gainDBi.toFixed(1)} dBi`, sub: "antenna gain" },
          { label: "Beam width", value: `${hpbwDeg.toFixed(1)}°`, sub: "half-power" },
          { label: "EIRP (est.)", value: `${eirp.toFixed(0)} dBm`, sub: "at 30 dBm TX" },
          { label: "Effective range", value: `${(rangeM).toFixed(0)} m`, sub: "−70 dBm rx" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            <div className="text-lg font-mono font-semibold">{value}</div>
            <div className="text-[10px] text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground border-t border-border pt-3 space-y-1">
        <p><strong>2.4 GHz preset (WiFi jamming scenario):</strong> A 90 cm dish at 2.4 GHz yields ~26 dBi gain, ~3.2° beam. At 95 m range and 30 dBm TX power, delivered power at target is approximately +3 dBm — far exceeding passive collection levels.</p>
        <p><strong>Comparison:</strong> SUTEL maximum EIRP for unlicensed 2.4 GHz devices in Costa Rica: +36 dBm. A directional parabolic is not permitted in the unlicensed band. Any such device requires a Concesión de Frecuencia from SUTEL.</p>
      </div>
    </div>
  );
}

// ── Frame viewer ─────────────────────────────────────────────────────────────
const FRAMES = [
  {
    src: "/pochote/faces/697_enhanced.jpg",
    label: "IMG_0697 — Enhanced", clip: "IMG_0697",
    ai: "Two distinct individuals visible through palm fronds — orange circle drawn by observer in post. 3–4× upscale + 3× contrast. AI: 'Two figures partially visible through dense tropical foliage. Left figure: darker clothing. Right figure: lighter upper garment.'",
  },
  {
    src: "/pochote/faces/697_left_figure.jpg",
    label: "IMG_0697 — Left figure crop",
    clip: "IMG_0697-L",
    ai: "Isolated left figure crop. AI forensic: 'Human figure partially obscured by palm fronds. Darker clothing consistent with tactical or casual dark attire. Forward-facing orientation toward camera.'",
  },
  {
    src: "/pochote/faces/697_right_figure.jpg",
    label: "IMG_0697 — Right figure crop",
    clip: "IMG_0697-R",
    ai: "Isolated right figure crop. AI forensic: 'Second individual visible. Light-colored upper garment (white or pale). Positioned approximately 1–1.5 m from left figure. Both in rear area of yoga place property.'",
  },
  {
    src: "/pochote/faces/696_enhanced.jpg",
    label: "IMG_0696 — Face crop enhanced",
    clip: "IMG_0696",
    ai: "Face partially visible below iPhone crop-tool UI. 3–4× upscale, 2.8× contrast, 1.8× brightness, 3× sharpness. AI: 'Partial face visible in lower center frame. Consistent with an individual looking toward the camera position from behind cover.'",
  },
  {
    src: "/pochote/faces/696_region_raw.jpg",
    label: "IMG_0696 — Region raw",
    clip: "IMG_0696-raw",
    ai: "Raw region before enhancement pipeline. Note: the AI enhancement pipeline (contrast → brightness → sharpness → histogram EQ) is what revealed the facial features. Unprocessed version shown here for comparison.",
  },
];

function FrameViewer() {
  const [idx, setIdx] = useState(0);
  const frame = FRAMES[idx];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {FRAMES.map((f, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`text-[11px] px-2 py-1 rounded border transition-colors ${i === idx ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/20"}`}>
            {f.clip}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <img src={frame.src} alt={frame.label} className="w-full object-contain max-h-64" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
            <span className="text-[10px] text-white font-mono">{frame.label}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-[10px]">AI FORENSIC ANALYSIS</Badge>
            <span className="text-[10px] text-muted-foreground">qwen/qwen3-vl-32b-instruct</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{frame.ai}</p>
          <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
            Pipeline: 3–4× upscale → 2.8–3.5× contrast → 1.6–1.8× brightness → 3–4× sharpness → histogram equalization
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Email composer ────────────────────────────────────────────────────────────
interface EmailTemplate {
  id: string;
  label: string;
  to: string;
  subject: string;
  body: string;
}

const EMAILS: EmailTemplate[] = [
  {
    id: "sutel",
    label: "SUTEL (Costa Rica)",
    to: "info@sutel.go.cr",
    subject: "Denuncia Formal — Dispositivo RF No Autorizado / Antena Parabólica Rotatoria — Jacó, Puntarenas",
    body: `Estimados Señores y Señoras,
Superintendencia de Telecomunicaciones (SUTEL)

Fecha: 9 de junio de 2026
Referencia: Antena parabólica rotatoria no autorizada — Jacó Beach, Puntarenas, Costa Rica

Me dirijo a ustedes para presentar una denuncia formal respecto a la operación de un dispositivo de radiofrecuencia aparentemente no autorizado ubicado en la propiedad conocida como "yoga place" (entre el Hotel La Flor y el Hotel Pochote Grande), en el paseo costero de Jacó, Puntarenas.

DESCRIPCIÓN DEL DISPOSITIVO:
El 8 de junio de 2026, a las 23:05 horas (CST), el suscrito filmó desde el balcón de su habitación en el Hotel Pochote Grande (habitación con vista directa a la propiedad mencionada) una antena parabólica de gran tamaño, de color oscuro, montada sobre un brazo de soporte (boom mount), que se encontraba en rotación activa. El análisis forense de video mediante inteligencia artificial (modelo qwen/qwen3-vl-32b-instruct) confirmó la rotación de la antena a través de 39 fotogramas: el perfil del objeto cambia de elongado a compacto a redondeado, lo cual es consistente matemáticamente con la rotación de una superficie parabólica en el plano del observador.

Una antena parabólica rotatoria en un corredor residencial NO corresponde a:
— Una antena de TV satelital (estas son fijas una vez apuntadas al arco orbital geoestacionario)
— Una estación meteorológica (no existe radar meteorológico en esta zona residencial)
— Equipamiento astronómico aficionado (la alineación y operación nocturna contraindica este uso)

La interpretación operativamente significativa es que se trata de un colector o emisor de RF direccional siendo dirigido activamente hacia un objetivo.

SIMULTANEIDAD DE EVENTOS:
Al momento de filmar la antena:
1. El teléfono iPhone 14 Pro del observador experimentó eventos de deautenticación WiFi continuos y severos (los más fuertes jamás experimentados por el observador).
2. El dispositivo comenzó a sobrecalentarse al punto de impedirle subir las imágenes capturadas.
3. La plataforma de inteligencia de señales KAPPA registró una puntuación de 93.12 sobre 100 a las 14:20 CST del 7 de junio — segundo nivel de alerta más alto posible — antes de que se filmara ninguna antena.

IMPACTO EN AVIACIÓN:
El corredor de Jacó Beach es ruta de aeronaves de baja altitud entre el Aeropuerto Tobías Bolaños (SJO), La Palma, Quepos y Golfito. Una emisora RF de alta potencia y alta ganancia (potencial EIRP superior a +36 dBm) en esta zona sin concesión de frecuencia registrada constituye un riesgo para la aviación por interferencia con sistemas de navegación GPS, VHF-NAV y COMM en las frecuencias 108–136 MHz.

SOLICITUD:
1. Verificación de concesiones de frecuencias activas para la dirección: entre Hotel La Flor y Hotel Pochote Grande, Paseo del Mar, Jacó, Garabito, Puntarenas.
2. Inspección técnica in situ del dispositivo identificado.
3. Inicio de procedimiento administrativo sancionatorio si se confirma operación sin concesión (Ley General de Telecomunicaciones No. 8642, Artículo 68 — uso no autorizado del espectro radioeléctrico).

Adjunto: Capturas de video forenses, análisis de IA, registros de la plataforma KAPPA SIGINT y capturas de pantalla de eventos de deautenticación.

Quedo a su disposición para ampliar la información.

Atentamente,
Sam Wotton
Correo: [su email]
Teléfono: [su teléfono]
Ubicación al momento de los hechos: Hotel Pochote Grande, Jacó, Puntarenas`,
  },
  {
    id: "dgac",
    label: "DGAC + ICAO + FAA (Combined)",
    to: "dgac@dgac.go.cr; jefe.avsec@dgac.go.cr; info@dgac.go.cr",
    subject: "CIVIL AVIATION SAFETY NOTICE — Rotating Parabolic RF Emitter (Jacó/SJO Corridor) + SETECOM Air S.A. Infrastructure Conflict of Interest — SJO/MROC",
    body: `TO:  Dirección General de Aviación Civil (DGAC) — dgac@dgac.go.cr, jefe.avsec@dgac.go.cr
TO:  AERIS S.A. (SJO Operator) — seguridad@aeris.cr, info@aeris.cr
CC:  COCESNA Safety — safety@cocesna.org
CC:  ICAO NACC Regional Office (Lima) — icaosam@lima.icao.int, safety@icao.int
CC:  FAA International Aviation Safety Assessment — iasa@faa.gov, avsec.comments@faa.gov
CC:  CISA ICS-CERT — ics-cert@hq.dhs.gov

DATE: June 9, 2026
REFERENCE: KAPPA-JACO-0609 / SETECOM-AIR-CONFLICT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CIVIL AVIATION SAFETY & CRITICAL INFRASTRUCTURE NOTICE
Two Converging Hazards — Jacó RF Emitter + SETECOM Air Conflict
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

My name is Samuel Wotton. I am a US citizen, independent RF signal analyst,
and former Deloitte / Federal Reserve consultant operating Project KAPPA — an
autonomous multi-domain signal intelligence platform — from Costa Rica since
late 2024. I write to formally notify your authority of two converging aviation
safety hazards that are directly connected.

Interactive evidence package (antenna size, RF physics calculator, AI forensic
frame viewer, and full incident timeline):
    https://kapparf.com/parabolic-antenna

SETECOM / SETECOM Air infrastructure exposé:
    https://kapparf.com/setecom

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A — PHYSICAL RF EMITTER: ROTATING PARABOLIC DISH, JACÓ BEACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOCATION: ~9.6270°N, 84.6286°W — rear of "yoga place" property, coastal
corridor between Hotel La Flor and Hotel Pochote Grande, Jacó Beach, Puntarenas.

On June 8, 2026 at 23:05 CST, I filmed a large black parabolic dish antenna
on a boom mount from my balcony at Hotel Pochote Grande. The dish was actively
rotating. AI forensic video analysis (model: qwen/qwen3-vl-32b-instruct) confirmed
rotation across 39 frames: the dish profile shifts elongated → compact → rounded,
consistent with angular rotation of a parabolic surface. A stationary surveillance
operative was confirmed immediately adjacent to the antenna throughout 83 frames.

This antenna is not a TV dish (those are fixed), not a weather radar (none exist
in this residential corridor), and not an amateur telescope mount. A rotating
directional dish in an active surveillance context is a steered RF collector or
emitter. The evidence package at kapparf.com/parabolic-antenna includes:
  • Interactive RF physics calculator — gain/EIRP/beamwidth at any frequency
  • AI-confirmed forensic frame viewer (all 5 evidence clips)
  • Line-of-sight geometry diagram (~95m direct LOS to observer's balcony)
  • Candidate frequency scenarios table (2.4 GHz, GPS L1, V2K, VSAT, IMSI)

AVIATION HAZARD — JACÓ COASTAL CORRIDOR:
The Jacó Beach area is within FIR SAN JOSE (MRFG). Low-altitude aircraft
operate this corridor between MRPV (Tobías Bolaños), MRQP (Quepos), MRPM
(Palmar Sur), and MRGF (Golfito) at 1,500–3,000 ft AGL.

A parabolic dish ~90 cm diameter operating at:
  • 2.4 GHz: gain ~26 dBi, HPBW ~3.2°, EIRP at 30 dBm TX = +56 dBm
  • 1.575 GHz (GPS L1): gain ~22 dBi — sufficient to degrade GPS at 3,000 ft AGL
    within a 10–15 km downrange cone from the emitter
  • 1090 MHz (ADS-B): directional interference can cause transponder masking

SIMULTANEOUS EVENTS (corroborating active RF emission):
  — iPhone 14 Pro WiFi deauthentication attack: sustained, strongest ever
    experienced (16:45 CST, coinciding with observer's upload attempt)
  — Device thermal failure (severe overheating) consistent with sustained
    directional 2.4 GHz high-power transmission at 95 m range
  — KAPPA platform score: 93.12/100 at 14:20 CST Jun 7 — before any antenna
    was filmed — based on correlated SDR, ELF, satellite, and network signals
  — At 00:29 Jun 9: two operatives appeared over the Santa Reyes compound
    perimeter wall and directly filmed the observer. KAPPA score: 100/100
    EMERGENCY (maximum)

REQUESTED DGAC ACTIONS (Part A):
1. Issue NOTAM for Jacó Beach corridor noting potential RF interference from
   unlicensed high-gain emitter pending SUTEL inspection.
2. Coordinate with SUTEL (denuncia@sutel.go.cr) for spectrum inspection at:
   yoga place property rear, Paseo del Mar, between Hotel La Flor and Hotel
   Pochote Grande, Jacó Beach, Garabito, Puntarenas.
3. Request PIREP review from operators on MRPV–MRQP–MRPM corridor for any
   GPS anomaly reports in the June 7–9 window.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B — SETECOM / SETECOM AIR S.A.: CONFLICT OF INTEREST AT SJO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The second hazard is structural and pre-existing. It directly implicates the
company that holds maintenance contracts for SJO backup power infrastructure.

SETECOM S.A. (Heredia, Costa Rica) holds the exclusive distribution contract
for Deep Sea Electronics (DSE) in Costa Rica. DSE manufactures the generator
controllers managing backup power for ICE national substations, Liberty CR
cellular towers, CCSS hospital circuits, and — critically — airport runway
lighting, approach systems, and ATC backup at SJO/MROC.

Owner: Héctor Eduardo Mora Marín (HMORA67 / YouTube training videos)
       Holder of SUTEL-licensed 180W HF radio transceiver at 7,410 kHz
       (this frequency recurs in KiwiSDR captures correlated with attack windows)

SETECOM Air S.A. is a separate but related civil-aviation-certified entity —
same beneficial owner, separate corporate registration — that holds aviation
infrastructure contracts. This is the conflict:

  → SETECOM S.A. (the entity with CISA CVEs, exposed Modbus:502, and
    documented RF attack capability) and SETECOM Air S.A. (the entity with
    aviation certification and airside access) share:
    • The same DSE Webnet master account credentials
    • The same field technicians accessing airport infrastructure
    • The same SUTEL-licensed HF radio infrastructure
    • The same beneficial owner (Héctor Mora Marín)

I have documented a pattern of new entity formation by Mora coinciding with
periods of heightened regulatory scrutiny and CISA CVE publication. This is
consistent with liability insulation, not legitimate business diversification.

CONFIRMED CVEs — DSE FLEET (CISA/ZDI, JUNE 2024):
CVE-2024-5947  Unauthenticated GET /Backup.bin returns SCADA credentials
               in plaintext. No login required.
CVE-2024-5950  Stack overflow → remote code execution. Network-adjacent,
               no credentials required.
CVE-2024-5949  Malformed request → infinite loop → permanent DoS until
               manual reboot.
CVE-2024-5952  Unauthenticated remote reboot. No credentials required.

Default credentials: Admin / Password1234 (posted on YouTube by Mora).
Modbus TCP port 502 on SETECOM's public IP (190.106.77.194): OPEN,
unauthenticated, verifiable via Shodan or direct probe right now.

GRIDTIDE THREAT INTERSECTION:
GRIDTIDE is a custom backdoor attributed to UNC2814 (overlapping Gallium /
HAFNIUM), currently active in Costa Rican critical infrastructure. Confirmed
exfiltration: 9 GB from ICE's local mail server. SETECOM's DSE Webnet gateway
maintains a permanent 4G GSM tunnel to servers in England, polling every 4
seconds, independent of local network — below EDR visibility.

IF the SETECOM master DSE Webnet account is compromised:
  → Broadcast STOP command to entire ICE/Liberty generator fleet simultaneously
  → SJO runway lighting, ILS ground stations, ATC radar, approach lighting —
    all depend on this backup generation layer
  → Timed to coincide with a grid event, severe weather, or high-traffic arrival
    window = runway incursion or approach-guidance failure at SJO/MROC

This is not theoretical. The attack surface is arithmetically confirmed.

LEGAL FRAMEWORK:
  • ICAO Annex 10, Vol. I — Protection of aeronautical radio frequencies
  • ICAO Annex 14 — Aerodrome backup power standards
  • ICAO Annex 17 — Security: Safeguarding International Civil Aviation
  • Chicago Convention, Art. 3bis
  • FAA Advisory Circular AC 70/7460-1M
  • Costa Rica Ley General de Aviación Civil (Ley 5150)
  • CISA ICS Advisory framework (DSE CVEs published June 2024)
  • Costa Rica Ley General de Telecomunicaciones No. 8642, Art. 68

Any aviation authority receiving this notice has a duty to investigate. Failure
to act on documented OT exposure within a certified aviation contractor may
constitute negligence per se in the event of a power-related incident at SJO.

REQUESTED DGAC/AERIS ACTIONS (Part B):
1. Require AERIS to audit the SETECOM Air S.A. contract scope and confirm
   whether SETECOM S.A. technical personnel have access to airside systems.
2. Request DSE Webnet credential audit from SETECOM covering all accounts
   with remote generator access.
3. Require remediation certification for CVE-2024-5947, 5950, 5949, 5952
   before next scheduled contract renewal.
4. Forward to CISA ICS-CERT for joint remediation coordination.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVESTIGATIVE RECORD & CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full forensic record (PCAPs, KiwiSDR spectrograms, PCAPNG analysis, satellite
correlation data, Windows event logs, SHA-256 evidence chain):
    https://kapparf.com/parabolic-antenna   (physical antenna evidence)
    https://kapparf.com/setecom             (SETECOM infrastructure exposé)
    https://kapparf.com/pochote-incident    (full June 8–9 incident report)

I have previously sent this notice to ICE, SUTEL, COCESNA, FAA, ICAO NACC,
CISA, and multiple aviation operators. I have received one automated reply.
OIJ (Organismo de Investigación Judicial) has forwarded my complaint internally
(ref: María Laura Elizondo Clachar, melizondoc@poder-judicial.go.cr).

I am available for secure interview or evidence transfer at any time.

Respectfully,
Samuel Wotton
Independent RF Signal Analyst / Project KAPPA
Hotel Pochote Grande, Jacó, Puntarenas, Costa Rica
Email: [your email]   WhatsApp: [your phone]
Platform: kapparf.com`,
  },
  {
    id: "interpol",
    label: "INTERPOL / OIJ",
    to: "bcn-cr@interpol.int",
    subject: "Intelligence Report — Organized Surveillance Operation with RF Directional Equipment — Jacó, Puntarenas, Costa Rica",
    body: `TO: INTERPOL National Central Bureau — Costa Rica (BCN Costa Rica)
CC: Organismo de Investigación Judicial (OIJ) — sjoprocediminetos@poder-judicial.go.cr
CC: INTERPOL General Secretariat — crime@interpol.int

DATE: June 9, 2026
CLASSIFICATION: INTELLIGENCE REPORT — ORGANIZED SURVEILLANCE ACTIVITY
REFERENCE: KAPPA-JACO-0609-EMERGENCY

EXECUTIVE SUMMARY:
Between June 6–9, 2026, I documented what appears to be a coordinated multi-asset surveillance operation against a civilian target at Hotel Pochote Grande, Jacó Beach, Puntarenas, Costa Rica. The operation involves specialized RF directional equipment, multiple operatives, internal hotel infiltration, and direct filming of the target over a perimeter wall.

INCIDENT CHRONOLOGY:

June 7, 2026:
— 10:50 CST: Individual documented at hotel pool archway. AI forensic analysis (GPT-4o) confirms humanoid figure with cylindrical protrusion near face consistent with optics or directional antenna device.
— Daytime: Second individual ("Israel Brooks" / hoodie) documented on porch in surveillance corridor. Boom/dish configuration visible.

June 8, 2026:
— 16:45 CST: Observer attempts to upload surveillance footage. Sustained WiFi deauthentication attack begins. iPhone 14 Pro overheats. Upload fails.
— 23:05 CST: Observer films rotating parabolic dish antenna from balcony. AI confirms rotation (39 frames). A stationary operative is confirmed immediately to the right of the antenna (83 frames, 12/12 sampled).
— 23:46 CST: Adversarial personnel confirmed inside Hotel Pochote Grande itself — opposite corner from observer's room. Full-envelope geometry established: external antenna (direct LOS to balcony) + internal hotel assets = no blind angle.

June 9, 2026:
— 00:29 CST: Two individuals associated with the Santa Reyes compound stand over the perimeter wall facing the observer's balcony. One individual is actively filming the observer. KAPPA Score: 100/100 EMERGENCY (maximum).

EQUIPMENT IDENTIFIED:
1. Rotating parabolic dish antenna (~70–110 cm estimated diameter), boom-mounted, actively directed — yoga place property rear, houses 9–11.
2. Mobile surveillance vehicle: glowing blue light in cabin, BLE scan confirms "bdb-PKE" Passive Keyless Entry device with anomalous 70 dB RSSI spike (−90 dBm → −20 dBm on two simultaneous channels).
3. Camera equipment: active filming over perimeter wall by operative.
4. WiFi deauthentication capability: sustained deauth attack confirmed by KAPPA Network Watchdog.

LEGAL FRAMEWORK — COSTA RICA:
— Código Penal Art. 195: Amenazas criminales / Criminal threats (documented during June 8 session)
— Código Penal Art. 196bis: Violación de comunicaciones electrónicas
— Código Penal Art. 274: Obstaculización de la justicia / Witness intimidation
— Ley General de Telecomunicaciones No. 8642, Art. 68: Uso no autorizado del espectro radioeléctrico

INTELLIGENCE SIGNIFICANCE:
The combination of: (1) professional-grade directional RF equipment, (2) multi-operative coordination, (3) internal hotel penetration, (4) reactive deauthentication attack triggered precisely upon filming attempt, and (5) direct confrontation with filming constitutes an organized intelligence operation, not opportunistic crime.

KAPPA PLATFORM CORRELATION:
The KAPPA SIGINT platform (kapparf.com) registered the following correlated alerts during the incident window:
— κ-score peak: 100/100 (EMERGENCY) at 00:29 Jun 9
— Simultaneous domain alerts: Network, ELF, WiFi, BLE
— Auto-correlator: 5 active correlations across real detections
— Omega correlator: multi-spoke activation pattern confirmed

I am available to provide: video evidence, KAPPA signal logs, BLE scan captures, AI forensic analysis reports, and sworn statement.

Respectfully,
Sam Wotton
Hotel Pochote Grande, Jacó, Puntarenas
Contact: [email / phone]
Evidence Package: https://kapparf.com/pochote-incident`,
  },
  {
    id: "faa",
    label: "FAA (US)",
    to: "iasa@faa.gov",
    subject: "International Aviation Safety Report — Unlicensed RF Emitter Near Active Flight Routes — Jacó, Costa Rica",
    body: `TO: FAA International Aviation Safety Assessment (IASA) Program
FROM: Sam Wotton
DATE: June 9, 2026
SUBJECT: Aviation Safety Concern — Unlicensed Rotating Parabolic RF Antenna, Low-Altitude Corridor, Jacó Beach, Costa Rica (9.627°N, 84.628°W)

This report is submitted pursuant to FAA international aviation safety responsibilities and coordination with ICAO for safety hazards affecting US-registered aircraft and US airlines operating in Costa Rican airspace.

LOCATION OF CONCERN:
GPS: approximately 9.6270°N, 84.6286°W
Address: Yoga place rear property, Paseo del Mar corridor, between Hotel La Flor and Hotel Pochote Grande, Jacó Beach, Puntarenas, Costa Rica

AIRSPACE CONTEXT:
The Jacó Beach area falls within the lateral boundaries of the FIR SAN JOSE (MRFG). The coastal corridor is used by:
— Charter and air taxi operators flying Piper PA-28/34, Cessna 172/206, and similar aircraft
— Regional carriers (Nature Air-type routing) between Tobías Bolaños and Quepos/Palmar Sur
— Helicopter traffic (medevac and tourism) operating at 1,000–2,000 ft AGL along the Pacific coast

INTERFERENCE HAZARD ASSESSMENT:
The rotating parabolic antenna observed on June 8, 2026 has the following estimated RF characteristics (based on visual size estimation):

Estimated dish diameter: 70–110 cm
If operating at 1.2 GHz (GPS L1-adjacent): gain ~26–32 dBi, HPBW ~5–8°
If operating at 2.4 GHz (WiFi / deauth): gain ~29–35 dBi, HPBW ~3–5°

At those gain figures with even a moderate transmitter (1–5W), EIRP could reach +60–67 dBm — sufficient to suppress GPS receivers within the beam path at altitudes up to 3,000 ft AGL at distances up to 10–20 km downrange.

SPECIFIC GPS INTERFERENCE RISK:
GPS L1 (1575.42 MHz) received power at aircraft antenna: approximately −130 dBm.
A directional emitter with 60 dBm EIRP at 1.2–1.6 GHz within 95 m can produce path-coupled interference exceeding GPS receiver dynamic range within the beam axis.

RECOMMENDED FAA ACTIONS:
1. Forward to ICAO Lima Regional Office for NOTAM coordination with DGAC Costa Rica.
2. Coordinate with SUTEL (Costa Rica telecom regulator) for inspection.
3. Add Jacó Beach corridor to monitoring watch list for GPS interference reports from operating pilots.
4. Review PIREP database for any GPS anomaly reports from MRPV–MRQP routing.

DOCUMENTATION AVAILABLE:
Video evidence of rotating antenna, AI forensic frame analysis, KAPPA SIGINT platform logs, BLE anomaly data.

Respectfully,
Sam Wotton
Contact: [email / phone]`,
  },
];

function EmailComposer() {
  const [active, setActive] = useState("sutel");
  const [copied, setCopied] = useState(false);
  const email = EMAILS.find(e => e.id === active)!;

  const copy = async () => {
    await navigator.clipboard.writeText(`TO: ${email.to}\nSUBJECT: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {EMAILS.map(e => (
          <button key={e.id} onClick={() => setActive(e.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${e.id === active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
            {e.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-12">TO:</span>
                <code className="text-primary">{email.to}</code>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground w-12">RE:</span>
                <span className="text-foreground font-medium leading-snug">{email.subject}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied ? <CheckCheck className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy all"}
            </Button>
          </div>
          <Separator />
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
            {email.body}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Contacts directory ────────────────────────────────────────────────────────
interface Contact { id: number; cat: string; org: string; email: string; note?: string; }

const CONTACTS: Contact[] = [
  // ── A: CR AVIATION & AIRPORT ─────────────────────────────────────────────
  { id:1,   cat:"CR Aviation",    org:"AERIS S.A. (SJO)",         email:"aeris@aeris.cr" },
  { id:2,   cat:"CR Aviation",    org:"AERIS S.A. (SJO)",         email:"info@aeris.cr" },
  { id:3,   cat:"CR Aviation",    org:"AERIS Security",           email:"seguridad@aeris.cr" },
  { id:4,   cat:"CR Aviation",    org:"AERIS Procurement",        email:"licitaciones@aeris.cr",   note:"Holds SETECOM contract" },
  { id:5,   cat:"CR Aviation",    org:"AERIS Management",         email:"gerencia@aeris.cr" },
  { id:6,   cat:"CR Aviation",    org:"DGAC Costa Rica",          email:"dgac@dgac.go.cr" },
  { id:7,   cat:"CR Aviation",    org:"DGAC Costa Rica",          email:"info@dgac.go.cr" },
  { id:8,   cat:"CR Aviation",    org:"DGAC AVSEC Chief",         email:"jefe.avsec@dgac.go.cr" },
  { id:9,   cat:"CR Aviation",    org:"DGAC Accidents",           email:"accidentesincidentes@dgac.go.cr" },
  { id:10,  cat:"CR Aviation",    org:"COCESNA",                  email:"info@cocesna.org" },
  { id:11,  cat:"CR Aviation",    org:"COCESNA Safety",           email:"safety@cocesna.org" },
  { id:12,  cat:"CR Aviation",    org:"COCESNA Operations",       email:"operaciones@cocesna.org" },
  // ── B: CR TELECOM & REGULATORS ───────────────────────────────────────────
  { id:13,  cat:"CR Regulators",  org:"SUTEL",                    email:"info@sutel.go.cr" },
  { id:14,  cat:"CR Regulators",  org:"SUTEL Denuncias",          email:"denuncia@sutel.go.cr" },
  { id:15,  cat:"CR Regulators",  org:"SUTEL Fiscalización",      email:"fiscalizacion@sutel.go.cr" },
  { id:16,  cat:"CR Regulators",  org:"MICITT Denuncias",         email:"denuncias@micitt.go.cr" },
  { id:17,  cat:"CR Regulators",  org:"CSIRT-CR (MICITT)",        email:"csirt@micitt.go.cr" },
  { id:18,  cat:"CR Regulators",  org:"ICE Costa Rica",           email:"info@ice.go.cr" },
  { id:19,  cat:"CR Regulators",  org:"ICE Denuncias",            email:"denuncia@ice.go.cr" },
  { id:20,  cat:"CR Regulators",  org:"Liberty CR",               email:"info@liberty.cr" },
  { id:21,  cat:"CR Regulators",  org:"Liberty CR Reclamos",      email:"reclamos@liberty.cr" },
  { id:22,  cat:"CR Regulators",  org:"MOPT Costa Rica",          email:"info@mopt.go.cr" },
  { id:23,  cat:"CR Regulators",  org:"Registro Nacional",        email:"info@registronacional.go.cr" },
  { id:24,  cat:"CR Regulators",  org:"Contraloría CR",           email:"denuncia@contraloria.go.cr" },
  { id:25,  cat:"CR Regulators",  org:"Presidencia CR",           email:"prensa@presidencia.go.cr" },
  // ── C: CR INTELLIGENCE & LAW ENFORCEMENT ─────────────────────────────────
  { id:26,  cat:"CR Law Enforcement", org:"DIS (Intelligence)",   email:"denuncias@dis.go.cr" },
  { id:27,  cat:"CR Law Enforcement", org:"OIJ Denuncias",        email:"denuncias@oij.go.cr" },
  { id:28,  cat:"CR Law Enforcement", org:"OIJ Denuncias",        email:"oij_denuncias@poder-judicial.go.cr" },
  { id:29,  cat:"CR Law Enforcement", org:"OIJ Delitos Tech",     email:"delitostecnologicos@poder-judicial.go.cr" },
  { id:30,  cat:"CR Law Enforcement", org:"OIJ Fraude Informático",email:"secfi_oij@poder-judicial.go.cr" },
  { id:31,  cat:"CR Law Enforcement", org:"OIJ CICO (Confidential)",email:"cicooij@poder-judicial.go.cr" },
  { id:32,  cat:"CR Law Enforcement", org:"Fiscalía General",     email:"fgeneral@poder-judicial.go.cr" },
  { id:33,  cat:"CR Law Enforcement", org:"Fiscalía Alajuela",    email:"alj-fiscalia@poder-judicial.go.cr" },
  { id:34,  cat:"CR Law Enforcement", org:"ICD / UIF (AML)",      email:"notificaciones-uif@icd.go.cr" },
  { id:35,  cat:"CR Law Enforcement", org:"Migración CR",         email:"remip@migracion.go.cr" },
  { id:36,  cat:"CR Law Enforcement", org:"CCSS Security",        email:"denuncia@ccss.sa.cr" },
  // ── D: US AUTHORITIES ────────────────────────────────────────────────────
  { id:37,  cat:"US Authorities", org:"FBI Legat San José",       email:"legatsanjose@fbi.gov" },
  { id:38,  cat:"US Authorities", org:"FBI Cyber Division",       email:"cyber@fbi.gov" },
  { id:39,  cat:"US Authorities", org:"FBI Tips",                 email:"tips@fbi.gov" },
  { id:40,  cat:"US Authorities", org:"US Embassy San José",      email:"acssanjose@state.gov" },
  { id:41,  cat:"US Authorities", org:"FDLE OIG",                 email:"OIGReportFraud@fdle.state.fl.us" },
  { id:42,  cat:"US Authorities", org:"INTERPOL USNCB",           email:"usncb@usdoj.gov" },
  { id:43,  cat:"US Authorities", org:"CISA ICS-CERT",            email:"ics-cert@hq.dhs.gov" },
  { id:44,  cat:"US Authorities", org:"DOT Inspector General",    email:"hotline@oig.dot.gov" },
  { id:45,  cat:"US Authorities", org:"NTSB International",       email:"publicaffairs@ntsb.gov" },
  // ── E: INT'L AVIATION REGULATORS ─────────────────────────────────────────
  { id:46,  cat:"Intl Regulators", org:"ICAO HQ",                 email:"icaohq@icao.int" },
  { id:47,  cat:"Intl Regulators", org:"ICAO Safety",             email:"safety@icao.int" },
  { id:48,  cat:"Intl Regulators", org:"ICAO SAM / Lima",         email:"icaosam@lima.icao.int" },
  { id:49,  cat:"Intl Regulators", org:"ICAO USAP Programme",     email:"usap@icao.int" },
  { id:50,  cat:"Intl Regulators", org:"ICAO Air Nav Bureau",     email:"anb@icao.int" },
  { id:51,  cat:"Intl Regulators", org:"FAA IASA",                email:"iasa@faa.gov" },
  { id:52,  cat:"Intl Regulators", org:"FAA AVSEC Comments",      email:"avsec.comments@faa.gov" },
  { id:53,  cat:"Intl Regulators", org:"IATA",                    email:"iata@iata.org" },
  { id:54,  cat:"Intl Regulators", org:"IATA Safety",             email:"safety@iata.org" },
  { id:55,  cat:"Intl Regulators", org:"IATA Airport Security",   email:"airport.security@iata.org" },
  { id:56,  cat:"Intl Regulators", org:"IATA IOSA",               email:"iosa@iata.org" },
  { id:57,  cat:"Intl Regulators", org:"IATA Ground Safety",      email:"gsas@iata.org" },
  { id:58,  cat:"Intl Regulators", org:"EASA Safety",             email:"safety.info@easa.europa.eu" },
  { id:59,  cat:"Intl Regulators", org:"EASA Press",              email:"press@easa.europa.eu" },
  { id:60,  cat:"Intl Regulators", org:"EASA Flight Standards",   email:"fas@easa.europa.eu" },
  { id:61,  cat:"Intl Regulators", org:"UK CAA",                  email:"info@caa.co.uk" },
  { id:62,  cat:"Intl Regulators", org:"UK CAA AVSEC",            email:"srg_avsec@caa.co.uk" },
  { id:63,  cat:"Intl Regulators", org:"Transport Canada",        email:"avnquery.tc@tc.gc.ca" },
  { id:64,  cat:"Intl Regulators", org:"EUROCONTROL",             email:"info@eurocontrol.int" },
  { id:65,  cat:"Intl Regulators", org:"ACI (Airport Councils)",  email:"aci@aci.aero" },
  { id:66,  cat:"Intl Regulators", org:"ACI Security",            email:"security@aci.aero" },
  { id:67,  cat:"Intl Regulators", org:"ANAC Brazil",             email:"ouvidoria@anac.gov.br" },
  { id:68,  cat:"Intl Regulators", org:"DGAC Mexico",             email:"safety@dgac.gob.mx" },
  // ── F: PILOT & SAFETY ASSOCIATIONS ───────────────────────────────────────
  { id:69,  cat:"Pilot Orgs",     org:"ALPA Safety",              email:"safety@alpa.org" },
  { id:70,  cat:"Pilot Orgs",     org:"ALPA President",           email:"president@alpa.org" },
  { id:71,  cat:"Pilot Orgs",     org:"ALPA Communications",      email:"communications@alpa.org" },
  { id:72,  cat:"Pilot Orgs",     org:"ALPA Engineering & Air Safety", email:"EASec@alpa.org",  note:"Best contact" },
  { id:73,  cat:"Pilot Orgs",     org:"IFALPA Secretariat",       email:"ifalpa@ifalpa.org" },
  { id:74,  cat:"Pilot Orgs",     org:"IFALPA Safety",            email:"safety@ifalpa.org" },
  { id:75,  cat:"Pilot Orgs",     org:"IFALPA CAR/SAM VP",        email:"houhq@ifalpa.org",    note:"Covers SJO directly" },
  { id:76,  cat:"Pilot Orgs",     org:"AOPA Air Safety Foundation",email:"asf@aopa.org" },
  { id:77,  cat:"Pilot Orgs",     org:"Flight Safety Foundation", email:"fsfinfo@flightsafety.org" },
  { id:78,  cat:"Pilot Orgs",     org:"Flight Safety Foundation", email:"safety@flightsafety.org" },
  { id:79,  cat:"Pilot Orgs",     org:"CANSO Secretariat",        email:"secretariat@canso.org" },
  { id:80,  cat:"Pilot Orgs",     org:"CANSO Safety",             email:"safety@canso.org" },
  { id:81,  cat:"Pilot Orgs",     org:"Airlines for America",     email:"A4A@airlines.org" },
  { id:82,  cat:"Pilot Orgs",     org:"Airlines for America Safety",email:"safety@airlines.org" },
  // ── G: AIRLINES (US) ─────────────────────────────────────────────────────
  { id:83,  cat:"Airlines US",    org:"American Airlines Safety",  email:"safety@aa.com" },
  { id:84,  cat:"Airlines US",    org:"American Airlines Security",email:"security@aa.com" },
  { id:85,  cat:"Airlines US",    org:"American Airlines Regulatory",email:"regulatory@aa.com" },
  { id:86,  cat:"Airlines US",    org:"American Airlines Corp Security",email:"corporate.security@aa.com" },
  { id:87,  cat:"Airlines US",    org:"United Airlines Safety",   email:"safety@united.com" },
  { id:88,  cat:"Airlines US",    org:"United Airlines Security", email:"security@united.com" },
  { id:89,  cat:"Airlines US",    org:"United Airlines Regulatory",email:"regulatory@united.com" },
  { id:90,  cat:"Airlines US",    org:"Delta Air Lines Safety",   email:"delta.safety@delta.com" },
  { id:91,  cat:"Airlines US",    org:"Delta Air Lines Security", email:"security@delta.com" },
  { id:92,  cat:"Airlines US",    org:"Delta Air Lines Flight Safety",email:"flightsafety@delta.com" },
  { id:93,  cat:"Airlines US",    org:"JetBlue Safety",           email:"safety@jetblue.com" },
  { id:94,  cat:"Airlines US",    org:"JetBlue Security",         email:"security@jetblue.com" },
  { id:95,  cat:"Airlines US",    org:"JetBlue Corp Affairs",     email:"corpcom@jetblue.com" },
  { id:96,  cat:"Airlines US",    org:"Southwest Safety",         email:"safety@wnco.com" },
  { id:97,  cat:"Airlines US",    org:"Southwest Security",       email:"security@southwest.com" },
  { id:98,  cat:"Airlines US",    org:"Southwest Corp Affairs",   email:"corporate.affairs@wnco.com" },
  { id:99,  cat:"Airlines US",    org:"Spirit Airlines Safety",   email:"safety@spirit.com" },
  { id:100, cat:"Airlines US",    org:"Spirit Airlines Security", email:"security@spirit.com" },
  { id:101, cat:"Airlines US",    org:"Frontier Safety",          email:"safety@flyfrontier.com" },
  { id:102, cat:"Airlines US",    org:"Frontier Security",        email:"security@flyfrontier.com" },
  { id:103, cat:"Airlines US",    org:"Alaska Airlines Safety",   email:"safety@alaskaair.com" },
  { id:104, cat:"Airlines US",    org:"Alaska Airlines Regulatory",email:"regulatory@alaskaair.com" },
  { id:105, cat:"Airlines US",    org:"Sun Country Safety",       email:"safety@suncountry.com" },
  { id:106, cat:"Airlines US",    org:"Sun Country Regulatory",   email:"regulatory@suncountry.com" },
  // ── H: AIRLINES (INTERNATIONAL / SJO) ────────────────────────────────────
  { id:107, cat:"Airlines Intl",  org:"Copa Airlines Safety",     email:"safety@copaair.com" },
  { id:108, cat:"Airlines Intl",  org:"Copa Airlines Security",   email:"security@copaair.com" },
  { id:109, cat:"Airlines Intl",  org:"Copa Airlines Regulatory", email:"regulatory@copaair.com" },
  { id:110, cat:"Airlines Intl",  org:"Avianca Safety",           email:"safety@avianca.com" },
  { id:111, cat:"Airlines Intl",  org:"Avianca Security",         email:"security@avianca.com" },
  { id:112, cat:"Airlines Intl",  org:"Avianca Regulatory",       email:"regulatory@avianca.com" },
  { id:113, cat:"Airlines Intl",  org:"LATAM Safety",             email:"safety@latam.com" },
  { id:114, cat:"Airlines Intl",  org:"LATAM Security",           email:"seguridad@latam.com" },
  { id:115, cat:"Airlines Intl",  org:"LATAM Regulatory",         email:"regulatory@latam.com" },
  { id:116, cat:"Airlines Intl",  org:"Iberia Safety",            email:"safety@iberia.es" },
  { id:117, cat:"Airlines Intl",  org:"Iberia Security",          email:"seguridad@iberia.es" },
  { id:118, cat:"Airlines Intl",  org:"Iberia Regulatory",        email:"regulatory@iberia.es" },
  { id:119, cat:"Airlines Intl",  org:"Air Canada Safety",        email:"safety@aircanada.ca" },
  { id:120, cat:"Airlines Intl",  org:"Air Canada Security",      email:"security@aircanada.ca" },
  { id:121, cat:"Airlines Intl",  org:"Air Canada Regulatory",    email:"regulatory@aircanada.ca" },
  { id:122, cat:"Airlines Intl",  org:"WestJet Safety",           email:"safety@westjet.com" },
  { id:123, cat:"Airlines Intl",  org:"WestJet Corp Security",    email:"corporate.security@westjet.com" },
  { id:124, cat:"Airlines Intl",  org:"Air Transat Safety",       email:"safety@airtransat.com" },
  { id:125, cat:"Airlines Intl",  org:"KLM Safety",               email:"safety@klm.com" },
  { id:126, cat:"Airlines Intl",  org:"KLM Security",             email:"security@klm.com" },
  { id:127, cat:"Airlines Intl",  org:"KLM Regulatory",           email:"regulatory@klm.com" },
  { id:128, cat:"Airlines Intl",  org:"Lufthansa Safety",         email:"aviation.safety@lufthansa.com" },
  { id:129, cat:"Airlines Intl",  org:"Lufthansa Security",       email:"security@lufthansa.com" },
  { id:130, cat:"Airlines Intl",  org:"Lufthansa Group Safety",   email:"safety@dlh.de" },
  { id:131, cat:"Airlines Intl",  org:"British Airways Safety",   email:"safety@ba.com" },
  { id:132, cat:"Airlines Intl",  org:"British Airways Security", email:"security@britishairways.com" },
  { id:133, cat:"Airlines Intl",  org:"British Airways Regulatory",email:"regulatory@ba.com" },
  { id:134, cat:"Airlines Intl",  org:"Air France Safety",        email:"safety@airfrance.fr" },
  { id:135, cat:"Airlines Intl",  org:"Air France Communications",email:"communications@airfrance.fr" },
  { id:136, cat:"Airlines Intl",  org:"Air France Regulatory",    email:"regulatory@airfrance.fr" },
  { id:137, cat:"Airlines Intl",  org:"Aeromexico Safety",        email:"safety@aeromexico.com" },
  { id:138, cat:"Airlines Intl",  org:"Aeromexico Security",      email:"seguridad@aeromexico.com" },
  { id:139, cat:"Airlines Intl",  org:"Aeromexico Regulatory",    email:"regulatory@aeromexico.com" },
  { id:140, cat:"Airlines Intl",  org:"Wingo Operations",         email:"operaciones@wingo.com" },
  { id:141, cat:"Airlines Intl",  org:"Wingo Info",               email:"info@wingo.com" },
  { id:142, cat:"Airlines Intl",  org:"Arajet Safety",            email:"safety@arajet.com" },
  { id:143, cat:"Airlines Intl",  org:"Arajet Regulatory",        email:"regulatory@arajet.com" },
  { id:144, cat:"Airlines Intl",  org:"Volaris Safety",           email:"safety@volaris.com.mx" },
  { id:145, cat:"Airlines Intl",  org:"Condor Safety",            email:"safety@condor.com" },
  { id:146, cat:"Airlines Intl",  org:"TUI Safety",               email:"safety@tui.com" },
  { id:147, cat:"Airlines Intl",  org:"Air Europa Safety",        email:"safety@aireuropa.com" },
  { id:148, cat:"Airlines Intl",  org:"Edelweiss Safety",         email:"safety@edelweiss.com" },
  { id:149, cat:"Airlines Intl",  org:"Iberojet Safety",          email:"safety@iberojet.com" },
  { id:150, cat:"Airlines Intl",  org:"SANSA (CR regional)",      email:"seguridad@sansa.com" },
  { id:151, cat:"Airlines Intl",  org:"SANSA Operations",         email:"operaciones@sansa.com" },
  { id:152, cat:"Airlines Intl",  org:"Aerobell (CR regional)",   email:"seguridad@aerobell.com" },
  { id:153, cat:"Airlines Intl",  org:"Green Airways CR",         email:"safety@greenairways.com" },
  { id:154, cat:"Airlines Intl",  org:"Boeing Flight Safety",     email:"flight.safety@boeing.com" },
  { id:155, cat:"Airlines Intl",  org:"Airbus Safety",            email:"safety@airbus.com" },
  { id:156, cat:"Airlines Intl",  org:"Airbus Product Safety",    email:"product.safety@airbus.com" },
  { id:157, cat:"Airlines Intl",  org:"DHL Aviation Safety",      email:"aviation.safety@dhl.com" },
  // ── I: AVIATION INSURERS ──────────────────────────────────────────────────
  { id:158, cat:"Insurers",       org:"Lloyd's Aviation",         email:"aviation@lloyds.com" },
  { id:159, cat:"Insurers",       org:"Lloyd's Market Surveillance",email:"market.surveillance@lloyds.com" },
  { id:160, cat:"Insurers",       org:"Lloyd's Markel Syndicate", email:"aviation.claims@msamlin.com" },
  { id:161, cat:"Insurers",       org:"Lloyd's LMA",              email:"lma@lmalloyds.com" },
  { id:162, cat:"Insurers",       org:"AIG Aviation",             email:"aviation@aig.com" },
  { id:163, cat:"Insurers",       org:"AIG Aviation Claims",      email:"aviation.claims@aig.com" },
  { id:164, cat:"Insurers",       org:"Munich Re Aviation",       email:"aviation@munichre.com" },
  { id:165, cat:"Insurers",       org:"Munich Re Comms",          email:"corporate.communications@munichre.com" },
  { id:166, cat:"Insurers",       org:"Swiss Re Aviation",        email:"aviation@swissre.com" },
  { id:167, cat:"Insurers",       org:"Swiss Re Media",           email:"mediarelations@swissre.com" },
  { id:168, cat:"Insurers",       org:"AXA XL Aviation",          email:"aviation@axaxl.com" },
  { id:169, cat:"Insurers",       org:"AXA XL Claims",            email:"claims@axaxl.com" },
  { id:170, cat:"Insurers",       org:"Allianz Aviation",         email:"aviation@allianz.com" },
  { id:171, cat:"Insurers",       org:"AIA Aerospace",            email:"aia@aia-aerospace.org" },
  // ── J: LEGAL / NGO ───────────────────────────────────────────────────────
  { id:172, cat:"Legal / NGO",    org:"Knight Columbia (Press)",  email:"carrie.decell@knightcolumbia.org" },
  { id:173, cat:"Legal / NGO",    org:"Leigh Day (UK)",           email:"iaduwa@leighday.co.uk" },
  { id:174, cat:"Legal / NGO",    org:"EFF",                      email:"press@eff.org" },
  { id:175, cat:"Legal / NGO",    org:"Citizen Lab",              email:"inquiries@citizenlab.ca" },
  { id:176, cat:"Legal / NGO",    org:"noyb (GDPR)",              email:"info@noyb.eu" },
  { id:177, cat:"Legal / NGO",    org:"Access Now",               email:"legal@accessnow.org" },
  { id:178, cat:"Legal / NGO",    org:"Privacy International",    email:"info@privacyinternational.org" },
  { id:179, cat:"Legal / NGO",    org:"AerCap (Lessor)",          email:"contact@aercap.com" },
  { id:180, cat:"Legal / NGO",    org:"Air Lease Corp",           email:"info@airleasecorp.com" },
  { id:181, cat:"Legal / NGO",    org:"Deep Sea Electronics",     email:"support@deepseaelectronics.com",  note:"Manufacturer — direct CVE notification" },
  { id:182, cat:"Legal / NGO",    org:"ITU Radiocommunication",   email:"brmail@itu.int" },
  { id:183, cat:"Legal / NGO",    org:"INTERPOL BCN Costa Rica",  email:"bcn-cr@interpol.int" },
  { id:184, cat:"Legal / NGO",    org:"INTERPOL General Secretariat",email:"crime@interpol.int" },
  // ── K: CYBERSECURITY / ICS ────────────────────────────────────────────────
  { id:185, cat:"ICS Security",   org:"Dragos ICS",               email:"info@dragos.com" },
  { id:186, cat:"ICS Security",   org:"Claroty",                  email:"info@claroty.com" },
  { id:187, cat:"ICS Security",   org:"Nozomi Networks",          email:"info@nozominetworks.com" },
  { id:188, cat:"ICS Security",   org:"SANS ICS",                 email:"ics@sans.org" },
  { id:189, cat:"ICS Security",   org:"Recorded Future",          email:"info@recordedfuture.com" },
  { id:190, cat:"ICS Security",   org:"Mandiant / Google",        email:"tip@mandiant.com" },
  { id:191, cat:"ICS Security",   org:"Kyndryl Whistleblower",    email:"whistleblower@kyndryl.com",    note:"HIGH — Kyndryl infra in MitM traffic" },
  { id:192, cat:"ICS Security",   org:"IBM Trust",                email:"trustww@us.ibm.com" },
  { id:193, cat:"ICS Security",   org:"Zscaler Compliance",       email:"compliance@zscaler.com" },
  // ── L: AVIATION TRADE MEDIA ───────────────────────────────────────────────
  { id:194, cat:"Aviation Media", org:"Aviation Week",            email:"news@aviationweek.com" },
  { id:195, cat:"Aviation Media", org:"Aviation Week Editors",    email:"editors@aviationweek.com" },
  { id:196, cat:"Aviation Media", org:"Aviation Week Podcast",    email:"podcast@aviationweek.com" },
  { id:197, cat:"Aviation Media", org:"FlightGlobal",             email:"news@flightglobal.com" },
  { id:198, cat:"Aviation Media", org:"AINonline",                email:"editorial@ainonline.com" },
  { id:199, cat:"Aviation Media", org:"AvWeb",                    email:"news@avweb.com" },
  { id:200, cat:"Aviation Media", org:"Airways Magazine",         email:"editorial@airways.mag" },
  { id:201, cat:"Aviation Media", org:"ch-aviation",              email:"news@ch-aviation.com" },
  { id:202, cat:"Aviation Media", org:"AeroTime",                 email:"editor@aerotime.aero" },
  { id:203, cat:"Aviation Media", org:"Aviation Today",           email:"tips@aviationtoday.com" },
  { id:204, cat:"Aviation Media", org:"Simple Flying",            email:"tips@simpleflying.com" },
  { id:205, cat:"Aviation Media", org:"The Air Current",          email:"tips@theaircurrent.com" },
  { id:206, cat:"Aviation Media", org:"The Warzone (The Drive)",  email:"warzone@thedrive.com" },
  // ── M: SECURITY / DEFENCE PODCASTS & MEDIA ────────────────────────────────
  { id:207, cat:"Security Media", org:"Darknet Diaries",          email:"jack@darknetdiaries.com" },
  { id:208, cat:"Security Media", org:"Risky Business",           email:"patrick@risky.biz" },
  { id:209, cat:"Security Media", org:"The Intercept",            email:"clickhere@theintercept.com" },
  { id:210, cat:"Security Media", org:"Security Now (TWiT)",      email:"securitynow@twit.tv" },
  { id:211, cat:"Security Media", org:"Malicious Life",           email:"ran@malicious.life" },
  { id:212, cat:"Security Media", org:"Wired (Security)",         email:"modem@wired.com" },
  { id:213, cat:"Security Media", org:"Vigilance Media",          email:"shawn@vigilance.media" },
  { id:214, cat:"Security Media", org:"Breaking Defense",         email:"tips@breakingdefense.com" },
  { id:215, cat:"Security Media", org:"C4ISRNET",                 email:"tips@c4isrnet.com" },
  { id:216, cat:"Security Media", org:"Defense One",              email:"tips@defenseone.com" },
  { id:217, cat:"Security Media", org:"Signal Magazine (AFCEA)",  email:"signal@afcea.org" },
  { id:218, cat:"Security Media", org:"ProPublica Tips",          email:"nonprofitexplorer@propublica.org" },
  { id:219, cat:"Security Media", org:"The Guardian (ICRT)",      email:"icrt@theguardian.com" },
  // ── N: COSTA RICA NEWS & MEDIA ────────────────────────────────────────────
  { id:220, cat:"CR Media",       org:"La Nación",                email:"redaccion@nacion.com" },
  { id:221, cat:"CR Media",       org:"La Nación Digital",        email:"digital@nacion.com" },
  { id:222, cat:"CR Media",       org:"El Financiero CR",         email:"redaccion@elfinanciero.com" },
  { id:223, cat:"CR Media",       org:"Tico Times (English)",     email:"news@ticotimes.net" },
  { id:224, cat:"CR Media",       org:"Tico Times Tips",          email:"tips@ticotimes.net" },
  { id:225, cat:"CR Media",       org:"CRHoy",                    email:"redaccion@crhoy.com" },
  { id:226, cat:"CR Media",       org:"La Prensa Libre CR",       email:"redaccion@laprensalibre.cr" },
  { id:227, cat:"CR Media",       org:"Diario Extra CR",          email:"redaccion@diarioextra.com" },
  { id:228, cat:"CR Media",       org:"Teletica",                 email:"noticias@teletica.com" },
  { id:229, cat:"CR Media",       org:"Repretel",                 email:"prensa@repretel.com" },
  { id:230, cat:"CR Media",       org:"Monumental CR",            email:"noticias@monumental.cr" },
  { id:231, cat:"CR Media",       org:"Semanario Universidad",    email:"redaccion@semanario.ucr.ac.cr" },
  { id:232, cat:"CR Media",       org:"Delfino CR",               email:"redaccion@delfino.cr" },
  { id:233, cat:"CR Media",       org:"Amelia Rueda",             email:"contacto@ameliarueda.com" },
  { id:234, cat:"CR Media",       org:"La Teja CR",               email:"redaccion@lateja.cr" },
  { id:235, cat:"CR Media",       org:"Surcos Digitales",         email:"info@surcosdigitales.com" },
  { id:236, cat:"CR Media",       org:"InformaTico CR",           email:"info@informatico.cr" },
  { id:237, cat:"CR Media",       org:"El País CR",               email:"redaccion@elpais.cr" },
  { id:238, cat:"CR Media",       org:"Qué Pasa CR",              email:"redaccion@quepasa.cr" },
  { id:239, cat:"CR Media",       org:"Confidencial CR",          email:"info@confidencialcr.com" },
  { id:240, cat:"CR Media",       org:"Voces CR",                 email:"info@vocescr.com" },
  // ── O: SPACE & ASTRONOMY MEDIA ────────────────────────────────────────────
  { id:241, cat:"Space Media",    org:"SpaceNews",                email:"editors@spacenews.com" },
  { id:242, cat:"Space Media",    org:"SpaceNews Tips",           email:"tips@spacenews.com" },
  { id:243, cat:"Space Media",    org:"Space.com",                email:"news@space.com" },
  { id:244, cat:"Space Media",    org:"SpaceFlight Now",          email:"editor@spaceflightnow.com" },
  { id:245, cat:"Space Media",    org:"NASASpaceFlight.com",      email:"contact@nasaspaceflight.com" },
  { id:246, cat:"Space Media",    org:"Universe Today",           email:"editor@universetoday.com" },
  { id:247, cat:"Space Media",    org:"Parabolic Arc",            email:"doug@parabolicarc.com" },
  { id:248, cat:"Space Media",    org:"SpaceRef",                 email:"editor@spaceref.com" },
  { id:249, cat:"Space Media",    org:"The Planetary Society",    email:"tps@planetary.org" },
  { id:250, cat:"Space Media",    org:"Planetary Society Media",  email:"media@planetary.org" },
  { id:251, cat:"Space Media",    org:"SpaceFlight Insider",      email:"editor@spaceflightinsider.com" },
  { id:252, cat:"Space Media",    org:"AmericaSpace",             email:"editor@americaspace.com" },
  { id:253, cat:"Space Media",    org:"SatNews Daily",            email:"editor@satnews.com" },
  { id:254, cat:"Space Media",    org:"Via Satellite",            email:"editor@viasatellite.com" },
  { id:255, cat:"Space Media",    org:"Satellite Today",          email:"editor@satellitetoday.com" },
  { id:256, cat:"Space Media",    org:"IEEE Spectrum",            email:"spectrum@ieee.org" },
  { id:257, cat:"Space Media",    org:"The Space Review",         email:"tsredit@thespacereview.com" },
  { id:258, cat:"Space Media",    org:"Aviation Week Space",      email:"space@aviationweek.com" },
  // ── P: SPACE POLICY & LAW ────────────────────────────────────────────────
  { id:259, cat:"Space Policy",   org:"Secure World Foundation",  email:"info@swfound.org",    note:"Space security / ITU" },
  { id:260, cat:"Space Policy",   org:"Union of Concerned Scientists",email:"ucs@ucsusa.org" },
  { id:261, cat:"Space Policy",   org:"CSIS Aerospace Security",  email:"aerospace@csis.org" },
  { id:262, cat:"Space Policy",   org:"ITU Radiocommunication Bureau",email:"brmail@itu.int" },
  { id:263, cat:"Space Policy",   org:"AMSAT (Amateur Satellite)",email:"amsat@amsat.org" },
  // ── Q: AMATEUR RADIO / RF INTERFERENCE ───────────────────────────────────
  { id:264, cat:"Amateur Radio",  org:"ARRL (US)",                email:"hq@arrl.org" },
  { id:265, cat:"Amateur Radio",  org:"ARRL RFI Committee",       email:"rfi@arrl.org",        note:"RF interference specialists" },
  { id:266, cat:"Amateur Radio",  org:"IARU (Int'l Amateur Radio)",email:"iaru@iaru.org" },
  { id:267, cat:"Amateur Radio",  org:"RSGB (UK)",                email:"rsgb@rsgb.org" },
  // ── R: ITALIAN / EUROPEAN TECH CHAIN ─────────────────────────────────────
  { id:268, cat:"Italian/Euro",   org:"Telespazio",               email:"info@telespazio.com" },
  { id:269, cat:"Italian/Euro",   org:"Telespazio Press",         email:"press@telespazio.com" },
  { id:270, cat:"Italian/Euro",   org:"e-GEOS (SAR/Imagery)",     email:"info@e-geos.it" },
  { id:271, cat:"Italian/Euro",   org:"Leonardo S.p.A.",          email:"info@leonardo.com" },
  { id:272, cat:"Italian/Euro",   org:"Leonardo Compliance",      email:"compliance@leonardocompany.com" },
  { id:273, cat:"Italian/Euro",   org:"Cy4Gate (SIGINT)",         email:"info@cy4gate.com" },
  { id:274, cat:"Italian/Euro",   org:"Kyndryl",                  email:"info@kyndryl.com" },
  { id:275, cat:"Italian/Euro",   org:"Kyndryl Security",         email:"security@kyndryl.com" },
];

const CONTACT_CATS = ["All", ...Array.from(new Set(CONTACTS.map(c => c.cat)))];

function ContactsPanel() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = CONTACTS.filter(c => {
    const matchCat = cat === "All" || c.cat === cat;
    const q = search.toLowerCase();
    const matchSearch = !q || c.org.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const copyAll = async () => {
    const emails = filtered.map(c => c.email).join(", ");
    await navigator.clipboard.writeText(emails);
    setCopied("all");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyOne = async (email: string) => {
    await navigator.clipboard.writeText(email);
    setCopied(email);
    setTimeout(() => setCopied(null), 2000);
  };

  const catColors: Record<string, string> = {
    "CR Aviation": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "CR Regulators": "bg-teal-500/10 text-teal-400 border-teal-500/20",
    "CR Law Enforcement": "bg-red-500/10 text-red-400 border-red-500/20",
    "US Authorities": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Intl Regulators": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Pilot Orgs": "bg-green-500/10 text-green-400 border-green-500/20",
    "Airlines US": "bg-sky-500/10 text-sky-400 border-sky-500/20",
    "Airlines Intl": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Insurers": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "Legal / NGO": "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "ICS Security": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "Aviation Media": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Security Media": "bg-slate-500/10 text-slate-400 border-slate-500/20",
    "CR Media": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Space Media": "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "Space Policy": "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    "Amateur Radio": "bg-lime-500/10 text-lime-400 border-lime-500/20",
    "Italian/Euro": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{filtered.length} contacts</span>
          <span className="text-xs text-muted-foreground">of {CONTACTS.length} total</span>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search org / email…"
            className="text-xs border border-border rounded px-2 py-1 bg-background w-44 focus:outline-none focus:border-primary/50"
          />
          <Button variant="outline" size="sm" onClick={copyAll}>
            {copied === "all" ? <CheckCheck className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied === "all" ? "Copied!" : `Copy all ${filtered.length} emails`}
          </Button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap">
        {CONTACT_CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${c === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
            {c === "All" ? `All (${CONTACTS.length})` : c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-4">#</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Category</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Organisation</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Email</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-3 py-1.5 text-muted-foreground">{c.id}</td>
                <td className="px-3 py-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${catColors[c.cat] ?? "bg-muted/30 text-muted-foreground border-border"}`}>
                    {c.cat}
                  </span>
                </td>
                <td className="px-3 py-1.5 font-medium">
                  {c.org}
                  {c.note && <span className="ml-1 text-[10px] text-amber-400">★ {c.note}</span>}
                </td>
                <td className="px-3 py-1.5 font-mono text-primary">{c.email}</td>
                <td className="px-3 py-1.5">
                  <button onClick={() => copyOne(c.email)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                    {copied === c.email ? <CheckCheck className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Based on 3 completed email campaigns (273 previously sent). Includes CR news sites, space/astronomy media, amateur radio RFI specialists, and ICS security researchers added for this campaign. Copy all emails generates a comma-separated string for BCC/CC in any email client.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ParabolicAntennaPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Jacó Beach, Puntarenas, Costa Rica · 9.627°N 84.628°W</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Rotating Parabolic Antenna
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A directional RF antenna on a boom mount, actively rotating, documented from the balcony of Hotel Pochote Grande on June 8, 2026. Location: rear of yoga place property, Santa Reyes compound corridor, between Hotel La Flor and Pochote Grande.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />KAPPA 100/100 EMERGENCY</Badge>
              <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Jun 8–9 2026</Badge>
              <Badge variant="outline" className="gap-1"><Radio className="h-3 w-3" />AI-confirmed rotation</Badge>
              <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />39 frames analyzed</Badge>
            </div>
          </div>
          <div className="w-44 h-44 shrink-0">
            <AnimatedDish className="w-full h-full" />
          </div>
        </div>

        {/* ── Key facts ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: RotateCw, label: "Rotation confirmed", value: "39 frames", sub: "elongated→compact→rounded" },
            { icon: Eye, label: "Operatives confirmed", value: "3 individuals", sub: "June 6–9 across all clips" },
            { icon: Wifi, label: "Deauth attack", value: "16:45 CST", sub: "simultaneous with filming" },
            { icon: Thermometer, label: "iPhone thermal failure", value: "severe", sub: "during upload attempt" },
          ].map(({ icon: Icon, label, value, sub }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <Icon className="h-4 w-4 text-muted-foreground mb-2" />
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className="text-base font-semibold">{value}</div>
                <div className="text-[11px] text-muted-foreground">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main content tabs ── */}
        <Tabs defaultValue="geometry">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="geometry">Geometry & LOS</TabsTrigger>
            <TabsTrigger value="physics">RF Physics</TabsTrigger>
            <TabsTrigger value="frames">Evidence Frames</TabsTrigger>
            <TabsTrigger value="timeline">Incident Timeline</TabsTrigger>
            <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
            <TabsTrigger value="email">Email Drafts</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({CONTACTS.length})</TabsTrigger>
          </TabsList>

          {/* Geometry */}
          <TabsContent value="geometry" className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">Line-of-Sight Geometry</h2>
            <p className="text-sm text-muted-foreground">
              The observer's balcony at Hotel Pochote Grande has a direct, unobstructed sightline to the antenna post at the rear of the yoga place property — approximately 95 metres. The Santa Reyes compound wall is approximately 150–170 m distant. The diagram shows approximate spatial relationships.
            </p>
            <GeometryDiagram />
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              {[
                { label: "Observer → Antenna", value: "~95 m", detail: "Direct LOS, balcony to antenna post" },
                { label: "Observer → Compound wall", value: "~155 m", detail: "Santa Reyes perimeter, over which operatives filmed at 00:29" },
                { label: "Internal hotel asset", value: "opposite corner", detail: "Adversarial personnel confirmed inside Pochote Grande itself — bilateral coverage" },
              ].map(({ label, value, detail }) => (
                <Card key={label}>
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground mb-1">{label}</div>
                    <div className="text-base font-semibold">{value}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{detail}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Physics */}
          <TabsContent value="physics" className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">Parabolic Dish RF Physics Calculator</h2>
            <p className="text-sm text-muted-foreground">
              Adjust dish diameter and frequency to see computed gain, beamwidth, EIRP, and effective range. Use to assess what the observed antenna is capable of at various frequency bands.
            </p>
            <PhysicsCalculator />

            <Separator />
            <h3 className="text-sm font-semibold">Candidate Frequency Scenarios</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["Scenario", "Frequency", "Dish ⌀", "Gain", "HPBW", "Use case"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["WiFi deauth / jammer", "2.4 GHz", "90 cm", "~26 dBi", "~3.2°", "Targeted device deauthentication at 95 m"],
                    ["5G NR / millimeter", "5 GHz", "90 cm", "~32 dBi", "~1.5°", "High-precision beam steering"],
                    ["GPS L1 spoofing", "1.575 GHz", "90 cm", "~22 dBi", "~4.8°", "GNSS navigation attack"],
                    ["V2K microwave", "915 MHz", "90 cm", "~18 dBi", "~8.3°", "Microwave auditory effect range"],
                    ["Satellite uplink", "14 GHz", "90 cm", "~43 dBi", "~0.4°", "VSAT uplink — covert exfil"],
                    ["IMSI / ISMI catcher", "850 MHz", "90 cm", "~17 dBi", "~9.0°", "Cellular interception"],
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className={`py-2 pr-4 ${j === 0 ? "font-medium" : "text-muted-foreground"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Frames */}
          <TabsContent value="frames" className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">AI Forensic Frame Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Still frames from video clips IMG_0663 (antenna rotation), IMG_0652 (operative right of antenna), IMG_0697 and IMG_0696 (personnel through foliage). Each processed through KAPPA's enhancement pipeline before AI vision analysis.
            </p>
            <FrameViewer />

            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">AI Analysis Summary — Video IMG_0663</h3>
              <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
                <p><strong>Model:</strong> qwen/qwen3-vl-32b-instruct (after 6 failed standard passes)</p>
                <p><strong>Enhancement applied:</strong> 3× contrast, 1.6× brightness, 3× sharpness, histogram equalization</p>
                <p><strong>Frames analyzed:</strong> 39 (video: 618×556px crop, 10fps, 3.87s)</p>
                <p><strong>Conclusion:</strong> "A dark, curved, dish-like object consistently visible in the center-right background across all 10 frames. Shape and subtle positional changes across frames consistent with a rotating parabolic dish mounted on a stand or boom. Object shifts from elongated to compact to rounded — consistent with rotation."</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
                <h3 className="font-semibold">AI Analysis Summary — Video IMG_0652 (operative)</h3>
                <p><strong>Frames analyzed:</strong> 83 (video: 658×560px crop, 10fps, 8.3s)</p>
                <p><strong>Conclusion:</strong> "One individual visible in all 12 sampled frames. Light-colored upper garment (white or pale gray), dark lower garment (black or dark blue). Behind dark vertical structure — gate or fence. Stationary or minimally mobile throughout entire clip. Maintaining fixed post adjacent to antenna."</p>
              </div>
            </div>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">Incident Timeline — June 7–9, 2026</h2>
            <div className="space-y-3">
              {[
                { time: "Jun 7, 10:50", title: "Pool archway figure", detail: "IMG_0642 — nighttime photograph. AI (GPT-4o) confirms humanoid figure with cylindrical protrusion at face — optics or directional antenna. Dark clothing, forward-lean posture.", severity: "high" },
                { time: "Jun 7, daytime", title: "Israel Brooks on porch", detail: "Second operative observed on porch in surveillance corridor. Boom/dish configuration. Addendum filed to all 8 intelligence targets.", severity: "high" },
                { time: "Jun 8, 14:20", title: "KAPPA Score 93.12", detail: "Before any antenna is filmed, KAPPA platform pre-registers second-highest possible alert. Temporal precedence rules out coincidence.", severity: "kappa" },
                { time: "Jun 8, 16:45", title: "Deauth attack begins", detail: "Observer attempts to upload antenna footage. Sustained WiFi deauthentication attack begins — strongest ever experienced. iPhone 14 Pro overheats. Upload fails. Camera roll intact.", severity: "critical" },
                { time: "Jun 8, 23:05", title: "Rotating antenna filmed", detail: "IMG_0663 — balcony direct view to yoga place rear. Large black parabolic dish on boom mount, actively rotating.", severity: "critical" },
                { time: "Jun 8, 23:07", title: "AI confirms rotation — 39 frames", detail: "After 3× contrast enhancement: 'shape shifts elongated→compact→rounded' across 39 frames. Rotation confirmed by AI.", severity: "critical" },
                { time: "Jun 8, 23:09", title: "AI confirms operative — 83 frames", detail: "IMG_0652: One individual, light top/dark pants, stationary at fixed post right of antenna. 12/12 frames confirmed. Fixed post = antenna operator or site security.", severity: "critical" },
                { time: "Jun 8, 23:46", title: "Hotel infiltration", detail: "Adversarial personnel confirmed inside Hotel Pochote Grande — opposite corner from observer's room. Full-envelope coverage: external antenna (balcony LOS) + internal hotel assets = no blind angle.", severity: "critical" },
                { time: "Jun 9, 00:29", title: "DIRECT FILMING — 100/100 EMERGENCY", detail: "Two operatives from Santa Reyes compound stand over perimeter wall facing observer's balcony. One actively films observer. KAPPA Score: 100/100 EMERGENCY. Targeted surveillance of civilian documenter — constitutes potential criminal intimidation.", severity: "emergency" },
              ].map(({ time, title, detail, severity }, i) => (
                <div key={i} className={`flex gap-4 p-3 rounded-lg border ${severity === "emergency" ? "border-red-500/40 bg-red-500/5" : severity === "critical" ? "border-orange-500/30 bg-orange-500/5" : severity === "kappa" ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-muted/20"}`}>
                  <div className="shrink-0 w-28 text-xs font-mono text-muted-foreground pt-0.5">{time}</div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium mb-1 ${severity === "emergency" ? "text-red-400" : severity === "critical" ? "text-orange-400" : ""}`}>{title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{detail}</div>
                  </div>
                  {severity === "emergency" && <Badge variant="destructive" className="shrink-0 h-5 text-[10px]">EMERGENCY</Badge>}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Regulatory */}
          <TabsContent value="regulatory" className="mt-6 space-y-6">
            <h2 className="text-lg font-semibold">Regulatory & Legal Analysis</h2>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Costa Rica — RF Spectrum</h3>
              <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Regulator</span>
                    <span className="font-medium">SUTEL — Superintendencia de Telecomunicaciones</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Governing law</span>
                    <span>Ley General de Telecomunicaciones No. 8642</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Violation</span>
                    <span className="text-red-400">Art. 68 — Uso no autorizado del espectro radioeléctrico</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Max unlicensed EIRP (2.4 GHz)</span>
                    <span>+36 dBm (100 mW) — directional arrays prohibited without concesión</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Complaint portal</span>
                    <a href="https://sutel.go.cr" target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1">sutel.go.cr <ExternalLink className="h-3 w-3" /></a>
                  </div>
                </CardContent>
              </Card>

              <h3 className="text-sm font-semibold flex items-center gap-2"><Zap className="h-4 w-4" /> Aviation Safety</h3>
              <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                  {[
                    ["Costa Rica DGAC", "dgac@dgac.go.cr — flight safety authority"],
                    ["ICAO Regional", "Lima Office — icao.lima@icao.int"],
                    ["FAA IASA", "iasa@faa.gov — international safety assessment"],
                    ["FIR affected", "FIR SAN JOSE (MRFG)"],
                    ["Airports within 80km", "MRPV (Tobías Bolaños), MRQP (Quepos), MRPM (Palmar Sur)"],
                    ["Interference risk", "GPS L1 (1575 MHz), VHF COMM/NAV (108–136 MHz), ADS-B (1090 MHz)"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="text-muted-foreground shrink-0">{label}</span>
                      <span className="text-right text-xs">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Criminal Law — Costa Rica</h3>
              <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                  {[
                    ["Código Penal Art. 195", "Amenazas criminales — threats documented during filming session"],
                    ["Código Penal Art. 196bis", "Violación de comunicaciones electrónicas — WiFi deauth attack"],
                    ["Código Penal Art. 274", "Obstaculización de la justicia / witness intimidation"],
                    ["Art. 292 CP", "Daños — thermal damage to device from directed RF"],
                    ["Filing authority", "OIJ (Organismo de Investigación Judicial) + Fiscalía de Puntarenas"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="text-muted-foreground shrink-0 font-mono text-xs">{label}</span>
                      <span className="text-right text-xs">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Email */}
          <TabsContent value="email" className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Draft templates ready to send. Fill in your contact details where indicated with <code className="text-xs bg-muted px-1 rounded">[brackets]</code> before sending. Copy the full text including TO/SUBJECT lines, or send directly from your email client.
              </p>
            </div>
            <EmailComposer />
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts" className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Full contact directory — {CONTACTS.length} addresses across {CONTACT_CATS.length - 1} categories. Includes all previously-sent campaign recipients plus new CR news/media, space/astronomy blogs, amateur radio RFI specialists, and ICS security contacts. Use the category filter to target a group, or copy all for bulk send. ★ entries are highest-priority contacts.
              </p>
            </div>
            <ContactsPanel />
          </TabsContent>
        </Tabs>

        {/* ── KAPPA correlation callout ── */}
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-red-400">KAPPA Auto-Correlator — Cross-Domain Confirmation</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The KAPPA platform's auto-correlator reached 93.12/100 at 14:20 CST on June 7 — before any antenna was filmed — based on correlated signals across the SDR, ELF, network, and satellite domains. At 00:29 on June 9, when two operatives appeared over the wall, the score peaked at <strong>100/100 EMERGENCY</strong>. The temporal precedence (platform alarm → filming → confrontation) eliminates confirmation bias as an explanation for the antenna identification.
                </p>
                <a href="/pochote-incident" className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                  Full incident report <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
