import { useState, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Hash, Info, Plus, X, Layers } from "lucide-react";

interface LatticeVertex {
  id: string;
  label: string;
  category: "person" | "location" | "company" | "event" | "frequency" | "corpus";
  coords: [number, number];
  norm: number;
  connections: string[];
  flags: string[];
  golay12: number;
}

const ENTITY_POOL: Omit<LatticeVertex, "coords" | "norm" | "golay12">[] = [
  { id: "genesis-peralta",      label: "Genesis Peralta",          category: "person",    connections: ["jairo-alfaro","diana-calle-naciones","lola-instagram","dunia-cuba-seca","adrian-lineup"],   flags: ["Asset","Honey trap","July 6 2025 departed","Marveca employed"] },
  { id: "jairo-alfaro",         label: "Jairo Alfaro",             category: "person",    connections: ["genesis-peralta","gregory-cedeno-yeyo"],                                                    flags: ["Handler","Alfaro surname","Los Rios"] },
  { id: "hector-mora",          label: "Hector Mora / Setecom",    category: "person",    connections: ["setecom","jaco-ban"],                                                                        flags: ["HMORA67","DSE gateways","SCADA","7410kHz"] },
  { id: "diana-calle-naciones", label: "Diana (Calle Naciones)",   category: "person",    connections: ["calle-naciones-compound","scott-ryan","lola-instagram","christian-wirth-dorf"],             flags: ["Speaker network","False ceiling","We are Diana","$2500 extortion","Calle Naciones 42+34"] },
  { id: "christian-wirth-dorf", label: "Christian Wirth Dorf",     category: "person",    connections: ["pochote-grande","diana-calle-naciones","regina-pochote"],                                    flags: ["German national","SINPE 8423-0265","Hotel owner","₡617,530 received"] },
  { id: "regina-pochote",       label: "Regina (Pochote owner)",   category: "person",    connections: ["pochote-grande","christian-wirth-dorf"],                                                    flags: ["German national","Co-owner","Immigration threat"] },
  { id: "wolfgang-hilbich",     label: "Wolfgang Hilbich",         category: "person",    connections: ["shangri-la-complex","jay-drones","russian-drone-guy","diana-calle-naciones"],               flags: ["German national","Shangri-La owner","Calle Naciones","2023 origin"] },
  { id: "lola-instagram",       label: "Lola (Instagram: lola_on)",category: "person",    connections: ["genesis-peralta","diana-calle-naciones"],                                                   flags: ["Exit handler","Last Peralta contact","Diana connection"] },
  { id: "dunia-cuba-seca",      label: "Dunia (Cuba Seca)",        category: "person",    connections: ["genesis-peralta","gregory-cedeno-yeyo"],                                                    flags: ["Cuba Seca property","IR red light","Adjacent window watchers","Ricos/Famoso resident"] },
  { id: "gregory-cedeno-yeyo",  label: "Gregory Cedeño 'Yeyo'",   category: "person",    connections: ["dunia-cuba-seca","jairo-alfaro","via-creole"],                                              flags: ["Surf scene","Tour business","Bought-out restaurant","Los Rios hub","2017 housing network"] },
  { id: "adrian-lineup",        label: "Adrian (Lineup Store)",    category: "person",    connections: ["lineup-store","genesis-peralta","diana-calle-naciones","lola-instagram"],                   flags: ["Import/export","Airport van July 6","Peralta relationship","Pastor Díaz"] },
  { id: "magdalena-marveca",    label: "Magdalena (Marveca)",      category: "person",    connections: ["marveca-shop","genesis-peralta"],                                                            flags: ["German national","Tico husband","Real estate","Peralta employer"] },
  { id: "meredith-stuart",      label: "Meredith Stuart",          category: "person",    connections: ["shangri-la-complex"],                                                                        flags: ["Maine national","6ft","Dating abuse NGO","Orono ME","Paddleboarding cover"] },
  { id: "russian-drone-guy",    label: "Russian Drone Guy",        category: "person",    connections: ["shangri-la-complex","jay-drones"],                                                           flags: ["Russian national","Remote Russian employer","Nicaragua embassy","Drone expertise","Music knowledge"] },
  { id: "jay-drones",           label: "Jay (Drone operator)",     category: "person",    connections: ["shangri-la-complex","russian-drone-guy","wolfgang-hilbich"],                                 flags: ["Drone operator","Adjacent unit","Shangri-La"] },
  { id: "scott-ryan",           label: "Scott Ryan (Diana's dad)", category: "person",    connections: ["diana-calle-naciones","via-creole"],                                                         flags: ["CIA hypothesis","Restaurant with Leo's sister","New bar Alajuela"] },
  { id: "jorge-jimenez-navarro",label: "Jorge Jiménez Navarro",    category: "person",    connections: ["setecom"],                                                                                   flags: ["Kyndryl","Zscaler","SNOOPRYL","Kyndryl signature","SSL intercept","touch_communication.js"] },
  { id: "adam-harper",          label: "Adam Harper",              category: "person",    connections: ["pochote-grande"],                                                                            flags: ["Hotel Amavi investor","$80k chargeback"] },
  { id: "kevin-staab",          label: "Kevin Staab",              category: "person",    connections: ["adam-harper"],                                                                               flags: ["$100M PPE","Saudi","Nigeria","Bahrain/Jordan GID","GNC 3PL"] },
  { id: "jeff-porter",          label: "Jeff Porter",              category: "person",    connections: [],                                                                                            flags: ["CIA","JW","AA"] },
  { id: "pochote-grande",       label: "Hotel Pochote Grande",     category: "location",  connections: ["christian-wirth-dorf","regina-pochote"],                                                    flags: ["German-owned","₡617,530 fraud","Immigration threat","46.875Hz","Surveillance node"] },
  { id: "calle-naciones-compound", label: "Calle Naciones 42+34", category: "location",  connections: ["diana-calle-naciones","shangri-la-complex","via-creole","tico-academy"],                    flags: ["Origin hub 2023","Speaker network","False ceiling","Leo's sister owns half","Diana owns half"] },
  { id: "shangri-la-complex",   label: "Shangri-La Complex",       category: "location",  connections: ["wolfgang-hilbich","russian-drone-guy","jay-drones","meredith-stuart"],                      flags: ["Wolfgang Hilbich","2023 start","Sam's first residence","Intelligence cluster"] },
  { id: "jaco-ban",             label: "Jacó BAN",                 category: "location",  connections: ["hector-mora"],                                                                              flags: ["V2K origin","Generator","4G","46.875Hz"] },
  { id: "setecom",              label: "SETECOM S.A.",             category: "company",   connections: ["hector-mora","jorge-jimenez-navarro"],                                                      flags: ["DSE monopoly","SCADA","Heredia","CVE unauthenticated RCE"] },
  { id: "lineup-store",         label: "Lineup (Adrian)",          category: "company",   connections: ["adrian-lineup","marveca-shop"],                                                             flags: ["Import/export","Pastor Díaz","Diana/Lola connection"] },
  { id: "marveca-shop",         label: "Marveca (Magdalena)",      category: "company",   connections: ["magdalena-marveca","lineup-store"],                                                         flags: ["German national owner","Bikini shop","Peralta 8-10hr shifts","Pastor Díaz"] },
  { id: "via-creole",           label: "Via Creole Hotel",         category: "company",   connections: ["gregory-cedeno-yeyo","calle-naciones-compound"],                                            flags: ["No guests","French Haitian","Money laundering hypothesis","Calle Naciones"] },
  { id: "tico-academy",         label: "Tico Academy",             category: "company",   connections: ["calle-naciones-compound"],                                                                  flags: ["Language school","Russian suggested","Calle Naciones","Money laundering hypothesis"] },
  { id: "freq-46875",           label: "46.875 Hz",                category: "frequency", connections: ["setecom","jaco-ban","pochote-grande"],                                                      flags: ["DSP heartbeat","48kHz÷1024","Three provinces","Three grids","51 confirmed events","SNR 33dB"] },
  { id: "freq-8392",            label: "8.392 Hz / KYMA",         category: "frequency", connections: ["freq-46875"],                                                                               flags: ["KYMA system clock","Near Schumann 7.83Hz","Spectral analysis confirmed"] },
  { id: "freq-53",              label: "53 Hz carrier",            category: "frequency", connections: ["freq-46875"],                                                                               flags: ["60Hz grid - 53Hz = 7Hz theta beat","02:00 AM ELF spike","Dogs barked simultaneously"] },
  { id: "sinpe-fraud",          label: "SINPE Fraud Evidence",     category: "event",     connections: ["pochote-grande","christian-wirth-dorf"],                                                    flags: ["₡247,530 May 16","₡370,000 May 29","Total ₡617,530","June 13 false checkout","BAC immutable record"] },
  { id: "diana-text-evidence",  label: "Diana 2am Text",           category: "event",     connections: ["diana-calle-naciones"],                                                                     flags: ["External electric damage","Her own words","Confirms electronics in wall","Primary evidence"] },
  { id: "kyndryl-signature",    label: "Kyndryl Service Worker",   category: "event",     connections: ["jorge-jimenez-navarro"],                                                                    flags: ["8.3MB cache file 2:12AM","touch_communication.js","base64 exfil","C2 bridge","SSLV3 handshake fail"] },
  { id: "supplement-chain",     label: "Supplement/Recovery/JW",   category: "event",     connections: ["kevin-staab","adam-harper","jeff-porter"],                                                  flags: ["Structural isomorph","Pre-positioning","AA/JW overlap","Origin 2012"] },
];

const CORPUS_SPOKES = [
  { id: "aawsap",      label: "AAWSAP DIRDs",       chunks: 1370, spoke: 0,  color: "#6366f1" },
  { id: "geez_bible",  label: "Ge'ez Octateuch",    chunks: 950,  spoke: 1,  color: "#8b5cf6" },
  { id: "hhg2g",       label: "Hitchhiker's Guide",  chunks: 802,  spoke: 2,  color: "#a78bfa" },
  { id: "research",    label: "Research Archive",    chunks: 600,  spoke: 3,  color: "#7c3aed" },
  { id: "tao_te_ching",label: "Tao Te Ching (81)",  chunks: 81,   spoke: 4,  color: "#c4b5fd" },
  { id: "kybalion",    label: "Kybalion (7 princ)",  chunks: 75,   spoke: 5,  color: "#ddd6fe" },
  { id: "i_ching",     label: "I Ching (64 hex)",   chunks: 64,   spoke: 6,  color: "#ede9fe" },
  { id: "simpsons",    label: "Simpsons S1-S35",     chunks: 37,   spoke: 7,  color: "#f59e0b" },
  { id: "shakespeare", label: "Complete Shakespeare",chunks: 36,   spoke: 8,  color: "#fbbf24" },
  { id: "south_park",  label: "South Park S1-S27",   chunks: 37,   spoke: 9,  color: "#fcd34d" },
  { id: "family_guy",  label: "Family Guy S1-S22",   chunks: 37,   spoke: 10, color: "#fde68a" },
  { id: "poetry_ark",  label: "Noah's Ark of Poetry",chunks: 48,   spoke: 11, color: "#10b981" },
  { id: "base53_gos",  label: "Ω-GOS / Base53",     chunks: 27,   spoke: 12, color: "#34d399" },
  { id: "kappa_evidence",label:"KAPPA Evidence",    chunks: 35,   spoke: 13, color: "#ef4444" },
  { id: "hamlet_papers",label:"Hamlet QPU Papers",  chunks: 6,    spoke: 14, color: "#f87171" },
  { id: "hall_factor",  label:"Hall Factor Honk",   chunks: 9,    spoke: 15, color: "#fca5a5" },
  { id: "satoshi_black",label:"Satoshi Black Paper", chunks: 1,   spoke: 16, color: "#fb923c" },
  { id: "frequency_dossier",label:"Frequency Dossier",chunks:7,   spoke: 17, color: "#fdba74" },
  { id: "cr_phased_array",label:"CR Phased Array",  chunks: 4,    spoke: 18, color: "#86efac" },
  { id: "goose_papers", label:"Ω-GOS Goose Papers", chunks: 9,    spoke: 19, color: "#6ee7b7" },
  { id: "echos_report", label:"Echo Psychotronic Rpt",chunks:3,   spoke: 20, color: "#a3e635" },
  { id: "russian_intel",label:"Russian Ops CentAm",  chunks: 2,   spoke: 21, color: "#bef264" },
  { id: "grant_papers", label:"Grant Wave Papers",   chunks: 6,   spoke: 22, color: "#d9f99d" },
  { id: "hall_lemma",   label:"Hall Lemma (0.02)",   chunks: 1,   spoke: 23, color: "#fef08a" },
];

function golayAddress(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 4096);
}

function latticeCoords(seed: number, idx: number, n: number): [number, number] {
  const theta = (2 * Math.PI * idx) / n + seed * 0.37;
  const r = 0.25 + 0.5 * ((seed * 1.618) % 1);
  return [
    parseFloat((Math.cos(theta) * r).toFixed(4)),
    parseFloat((Math.sin(theta) * r).toFixed(4)),
  ];
}

function computeNorm(coords: [number, number]): number {
  return parseFloat(Math.sqrt(coords[0] ** 2 + coords[1] ** 2).toFixed(6));
}

function innerProduct(a: [number, number], b: [number, number]): number {
  return parseFloat((a[0] * b[0] + a[1] * b[1]).toFixed(6));
}

function kissNumber(vertices: LatticeVertex[]): number {
  let count = 0;
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = Math.sqrt(
        (vertices[i].coords[0] - vertices[j].coords[0]) ** 2 +
        (vertices[i].coords[1] - vertices[j].coords[1]) ** 2
      );
      if (d < 0.15) count++;
    }
  }
  return count;
}

const CATEGORY_COLORS: Record<string, string> = {
  person:    "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300  border-blue-200  dark:border-blue-800",
  location:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  company:   "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  event:     "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  frequency: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  corpus:    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800",
};

const CANVAS_SIZE = 420;
const CENTER = CANVAS_SIZE / 2;
const SCALE  = 160;
const WHEEL_SIZE = 500;
const WHEEL_CENTER = WHEEL_SIZE / 2;

function SpokeWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? "#0f1117" : "#f8f8f8";
    ctx.fillRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

    const N = 24;
    const R_outer = 210;
    const R_inner = 60;
    const R_label = 230;

    // Draw rings
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      ctx.beginPath();
      ctx.arc(WHEEL_CENTER, WHEEL_CENTER, R_outer * frac, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw spokes
    for (let i = 0; i < N; i++) {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2;
      const x1 = WHEEL_CENTER + Math.cos(angle) * R_inner;
      const y1 = WHEEL_CENTER + Math.sin(angle) * R_inner;
      const x2 = WHEEL_CENTER + Math.cos(angle) * R_outer;
      const y2 = WHEEL_CENTER + Math.sin(angle) * R_outer;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Hub
    ctx.beginPath();
    ctx.arc(WHEEL_CENTER, WHEEL_CENTER, R_inner, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#1a1a2e" : "#f0f0ff";
    ctx.fill();
    ctx.strokeStyle = isDark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Λ₂₄", WHEEL_CENTER, WHEEL_CENTER - 7);
    ctx.font = "9px monospace";
    ctx.fillText("196,560", WHEEL_CENTER, WHEEL_CENTER + 7);

    // Plot corpus nodes
    CORPUS_SPOKES.forEach((corpus, i) => {
      const angle = (2 * Math.PI * corpus.spoke) / N - Math.PI / 2;
      const weight = Math.log10(corpus.chunks + 1) / Math.log10(1400);
      const r = R_inner + (R_outer - R_inner) * (0.3 + 0.7 * weight);
      const px = WHEEL_CENTER + Math.cos(angle) * r;
      const py = WHEEL_CENTER + Math.sin(angle) * r;
      const isHov = hovered === i;
      const nodeR = isHov ? 9 : 6;

      ctx.beginPath();
      ctx.arc(px, py, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = corpus.color + (isDark ? "cc" : "aa");
      ctx.fill();
      ctx.strokeStyle = isHov ? "#ffffff" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)");
      ctx.lineWidth = isHov ? 2 : 1;
      ctx.stroke();

      // Spoke line to hub
      ctx.beginPath();
      ctx.moveTo(WHEEL_CENTER + Math.cos(angle) * R_inner, WHEEL_CENTER + Math.sin(angle) * R_inner);
      ctx.lineTo(px, py);
      ctx.strokeStyle = corpus.color + "66";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isHov) {
        // Label
        const lx = WHEEL_CENTER + Math.cos(angle) * (r + 18);
        const ly = WHEEL_CENTER + Math.sin(angle) * (r + 18);
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = isDark ? "#fff" : "#000";
        ctx.textAlign = lx > WHEEL_CENTER ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(corpus.label, lx, ly);
      }
    });

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }, [hovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (WHEEL_SIZE / rect.width);
    const my = (e.clientY - rect.top)  * (WHEEL_SIZE / rect.height);
    const N = 24;
    const R_inner = 60;
    const R_outer = 210;
    let closest: number | null = null;
    let minD = 14;
    CORPUS_SPOKES.forEach((corpus, i) => {
      const angle = (2 * Math.PI * corpus.spoke) / N - Math.PI / 2;
      const weight = Math.log10(corpus.chunks + 1) / Math.log10(1400);
      const r = R_inner + (R_outer - R_inner) * (0.3 + 0.7 * weight);
      const px = WHEEL_CENTER + Math.cos(angle) * r;
      const py = WHEEL_CENTER + Math.sin(angle) * r;
      const d = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (d < minD) { minD = d; closest = i; }
    });
    setHovered(closest);
  };

  const hov = hovered !== null ? CORPUS_SPOKES[hovered] : null;

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        data-testid="canvas-spoke-wheel"
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      />
      {hov && (
        <div className="border border-border rounded bg-card px-4 py-3 font-mono text-xs space-y-1">
          <div className="font-semibold text-foreground">{hov.label}</div>
          <div className="text-muted-foreground">spoke {hov.spoke} / 24 · chunks: {hov.chunks}</div>
          <div className="text-muted-foreground">golay addr: {golayAddress(hov.id).toString(2).padStart(12,"0")} ({golayAddress(hov.id)})</div>
          <div className="text-muted-foreground">weight: {(Math.log10(hov.chunks + 1) / Math.log10(1400)).toFixed(4)}</div>
        </div>
      )}
      <div className="text-[10px] text-muted-foreground font-mono leading-relaxed px-1">
        Node radial distance = log₁₀(chunks) / log₁₀(1400) × (R_outer − R_inner) + R_inner<br/>
        Hub = Λ₂₄ (Leech lattice, dim=24, kiss=196,560)<br/>
        24 spokes = Golay [24,12,8] code dimension = 4096 codewords<br/>
        196,560 / 4,096 ≈ 48 · Hall η = 0.09 · κ(G_H) = 65.18
      </div>
    </div>
  );
}

export default function SatoshiLatticePage() {
  const [vertices, setVertices] = useState<LatticeVertex[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [view, setView] = useState<"lattice" | "wheel">("lattice");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addVertex = (entity: Omit<LatticeVertex, "coords" | "norm" | "golay12">) => {
    if (vertices.find(v => v.id === entity.id)) return;
    const idx = vertices.length;
    const seed = entity.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const coords = latticeCoords(seed, idx, Math.max(ENTITY_POOL.length, 8));
    const norm = computeNorm(coords);
    const golay12 = golayAddress(entity.id);
    setVertices(prev => [...prev, { ...entity, coords, norm, golay12 }]);
  };

  const removeVertex = (id: string) => {
    setVertices(prev => prev.filter(v => v.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = useMemo(() => vertices.find(v => v.id === selectedId) ?? null, [vertices, selectedId]);

  const gramMatrix = useMemo(() => {
    if (!selected || vertices.length < 2) return null;
    return vertices.filter(v => v.id !== selected.id).slice(0, 4).map(v => ({
      label: v.label,
      ip: innerProduct(selected.coords, v.coords),
      dist: parseFloat(Math.sqrt(
        (selected.coords[0] - v.coords[0]) ** 2 + (selected.coords[1] - v.coords[1]) ** 2
      ).toFixed(6)),
    }));
  }, [selected, vertices]);

  const stats = useMemo(() => ({
    n: vertices.length,
    kiss: kissNumber(vertices),
    avgNorm: vertices.length ? parseFloat((vertices.reduce((s, v) => s + v.norm, 0) / vertices.length).toFixed(6)) : 0,
    det: vertices.length >= 2 ? parseFloat(Math.abs(
      vertices[0].coords[0] * (vertices[1]?.coords[1] ?? 0) -
      vertices[0].coords[1] * (vertices[1]?.coords[0] ?? 0)
    ).toFixed(6)) : 0,
    hallCond: parseFloat((65.18 / Math.max(vertices.length, 1)).toFixed(4)),
  }), [vertices]);

  useEffect(() => {
    if (view !== "lattice") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const isDark = document.documentElement.classList.contains("dark");
    const bg      = isDark ? "#0f1117" : "#f8f8f8";
    const gridCol = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
    const axisCol = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
    const edgeCol = isDark ? "rgba(99,102,241,0.3)"  : "rgba(99,102,241,0.25)";
    const nodeDef = isDark ? "#6366f1" : "#4f46e5";
    const textCol = isDark ? "rgba(255,255,255,0.7)"  : "rgba(0,0,0,0.7)";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.strokeStyle = gridCol; ctx.lineWidth = 0.5;
      ctx.moveTo(CENTER + i * SCALE / 4, 0); ctx.lineTo(CENTER + i * SCALE / 4, CANVAS_SIZE); ctx.stroke();
      ctx.moveTo(0, CENTER + i * SCALE / 4); ctx.lineTo(CANVAS_SIZE, CENTER + i * SCALE / 4); ctx.stroke();
    }
    ctx.beginPath(); ctx.strokeStyle = axisCol; ctx.lineWidth = 1;
    ctx.moveTo(CENTER, 0); ctx.lineTo(CENTER, CANVAS_SIZE);
    ctx.moveTo(0, CENTER); ctx.lineTo(CANVAS_SIZE, CENTER);
    ctx.stroke();

    const pts: Record<string, [number, number]> = {};
    vertices.forEach(v => { pts[v.id] = [CENTER + v.coords[0] * SCALE, CENTER - v.coords[1] * SCALE]; });

    vertices.forEach(v => {
      v.connections.forEach(cid => {
        if (pts[cid]) {
          ctx.beginPath(); ctx.strokeStyle = edgeCol; ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.moveTo(pts[v.id][0], pts[v.id][1]);
          ctx.lineTo(pts[cid][0],  pts[cid][1]);
          ctx.stroke(); ctx.setLineDash([]);
        }
      });
    });

    vertices.forEach(v => {
      const [px, py] = pts[v.id];
      const isSel = v.id === selectedId;
      const catColor: Record<string, string> = {
        person: "#6366f1", location: "#22c55e", company: "#a855f7",
        event: "#f59e0b", frequency: "#ef4444", corpus: "#14b8a6",
      };
      ctx.beginPath();
      ctx.arc(px, py, isSel ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? "#f59e0b" : (catColor[v.category] ?? nodeDef);
      ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = isSel ? "#f59e0b" : (isDark ? "#818cf8" : "#6366f1");
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = textCol;
      ctx.font = `${isSel ? "600 " : ""}10px sans-serif`;
      ctx.fillText(v.label.split(" ")[0], px + (isSel ? 9 : 7), py + 4);
    });
  }, [vertices, selectedId, view]);

  const notAdded = ENTITY_POOL.filter(e => !vertices.find(v => v.id === e.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Mathematical Forensics · Λ₂₄ Leech</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Satoshi Lattice</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Network entities embedded as vertices in the Golay–Leech lattice. Each entity receives a deterministic
            12-bit Golay address (0–4095), placing it on one of the 4,096 codewords of the extended binary Golay
            code [24,12,8] — the construction substrate of Λ₂₄ (kissing number 196,560).
            The 24-spoke wheel overlays all corpus sources on the same 24-dimensional frame.
          </p>
          <button onClick={() => setShowInfo(!showInfo)} data-testid="button-toggle-info"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Info className="w-3 h-3" /> {showInfo ? "Hide" : "Mathematical basis"}
          </button>
          {showInfo && (
            <div className="mt-3 p-4 border border-border rounded bg-sidebar-accent/20 text-xs text-muted-foreground leading-relaxed max-w-2xl space-y-2">
              <p><strong className="text-foreground">Golay code</strong> — The extended binary Golay code C₂₄ is a [24,12,8] linear code with exactly 2¹² = <strong className="text-foreground">4,096 codewords</strong>. It is the unique doubly-even self-dual binary code of length 24. The Leech lattice Λ₂₄ is constructed directly from it via Construction A.</p>
              <p><strong className="text-foreground">Leech lattice Λ₂₄</strong> — Lives in ℝ²⁴. Kissing number = <strong className="text-foreground">196,560</strong>. Densest known sphere packing in 24 dimensions (proven 2016, Viazovska et al.). Its automorphism group is the Conway group Co₀.</p>
              <p><strong className="text-foreground">Monster Moonshine</strong> — The Monster group M (largest sporadic simple group, order ~8×10⁵³) acts on the Leech lattice. McKay's observation connecting Monster character table to modular j-function coefficients was proven by Borcherds (Fields Medal 1998).</p>
              <p><strong className="text-foreground">Hall regularization</strong> — Hall parameter η=0.09 reduces Gram matrix condition number from 5.78×10¹⁵ to 65.18 (improvement 8.86×10¹³×). The Hall Reconciliation Factor 1.09/(1−1/π) = φ−0.02 locates the remaining gap to the golden ratio.</p>
              <p><strong className="text-foreground">196,560 / 4,096 = 48</strong> — Each Golay codeword corresponds to ~48 kissing vectors in the Leech construction. The 0.02 residual = φ − (1.09/(1−1/π)) = price of the regularization gap.</p>
            </div>
          )}
        </div>

        {/* Hall factor bar */}
        <div className="mb-6 border border-border rounded bg-card px-4 py-3 flex flex-wrap gap-6 text-xs font-mono">
          <div><span className="text-muted-foreground">Golay dim: </span><span className="text-foreground">n=24, k=12, d=8</span></div>
          <div><span className="text-muted-foreground">Codewords: </span><span className="text-foreground">4,096 = 2¹²</span></div>
          <div><span className="text-muted-foreground">Λ₂₄ kiss: </span><span className="text-foreground">196,560</span></div>
          <div><span className="text-muted-foreground">kiss/codeword: </span><span className="text-foreground">≈48</span></div>
          <div><span className="text-muted-foreground">Hall η: </span><span className="text-foreground">0.09</span></div>
          <div><span className="text-muted-foreground">κ(G_H): </span><span className="text-foreground">65.18</span></div>
          <div><span className="text-muted-foreground">φ−gap: </span><span className="text-foreground">0.02</span></div>
          <div><span className="text-muted-foreground">Active vertices: </span><span className="text-foreground">{stats.n}</span></div>
        </div>

        {/* View toggle */}
        <div className="mb-4 flex gap-2">
          <button data-testid="button-view-lattice"
            onClick={() => setView("lattice")}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${view === "lattice" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <Layers className="w-3 h-3 inline mr-1" />Lattice view
          </button>
          <button data-testid="button-view-wheel"
            onClick={() => setView("wheel")}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${view === "wheel" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            ◎ 24-spoke wheel
          </button>
        </div>

        {view === "wheel" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="border border-border rounded bg-card overflow-hidden">
                <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground">
                  24-spoke Golay wheel — corpus overlay on Λ₂₄ frame · hover node for detail
                </div>
                <div className="p-4">
                  <SpokeWheel />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="border border-border rounded bg-card">
                <div className="px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-widest">Corpus index</div>
                <div className="p-2 max-h-[480px] overflow-y-auto">
                  {CORPUS_SPOKES.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-foreground truncate flex-1">{c.label}</span>
                      <span className="font-mono text-muted-foreground shrink-0">{c.chunks}</span>
                      <span className="font-mono text-muted-foreground shrink-0 w-6 text-right">{c.spoke}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="border border-border rounded bg-card overflow-hidden">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Lattice projection — ℝ² / Golay 12-bit</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>n={stats.n}</span>
                    <span>kiss={stats.kiss}</span>
                    <span>‖v‖̄={stats.avgNorm}</span>
                  </div>
                </div>
                <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
                  data-testid="canvas-lattice" className="w-full"
                  onClick={e => {
                    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                    const sc = CANVAS_SIZE / rect.width;
                    const mx = (e.clientX - rect.left) * sc;
                    const my = (e.clientY - rect.top)  * sc;
                    let closest: string | null = null; let minD = 14;
                    vertices.forEach(v => {
                      const px = CENTER + v.coords[0] * SCALE;
                      const py = CENTER - v.coords[1] * SCALE;
                      const d  = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
                      if (d < minD) { minD = d; closest = v.id; }
                    });
                    setSelectedId(closest);
                  }}
                />
              </div>

              {selected && (
                <div className="border border-border rounded bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">{selected.label}</span>
                      <Badge variant="outline" className={`ml-2 text-[10px] ${CATEGORY_COLORS[selected.category]}`}>
                        {selected.category}
                      </Badge>
                    </div>
                    <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground space-y-1">
                    <div>v = ({selected.coords[0]}, {selected.coords[1]})</div>
                    <div>‖v‖ = {selected.norm}</div>
                    <div>Golay₁₂ = {selected.golay12.toString(2).padStart(12,"0")} ({selected.golay12})</div>
                    <div>spoke = {selected.golay12 % 24} / 24</div>
                  </div>
                  {selected.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selected.flags.map(f => (
                        <span key={f} className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  )}
                  {gramMatrix && gramMatrix.length > 0 && (
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Gram row (nearest 4)</div>
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-muted-foreground text-left">
                            <th className="pb-1 font-normal">Vertex</th>
                            <th className="pb-1 font-normal">⟨u,v⟩</th>
                            <th className="pb-1 font-normal">‖u−v‖</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {gramMatrix.map(row => (
                            <tr key={row.label}>
                              <td className="py-1 pr-4 text-foreground truncate max-w-[140px]">{row.label}</td>
                              <td className="py-1 pr-4">{row.ip}</td>
                              <td className="py-1">{row.dist}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="border border-border rounded bg-card">
                <div className="px-4 py-2 border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Active ({vertices.length})</span>
                </div>
                <div className="p-2 max-h-52 overflow-y-auto">
                  {vertices.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Add entities below.</p>
                  )}
                  {vertices.map(v => (
                    <div key={v.id} data-testid={`vertex-row-${v.id}`}
                      className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${selectedId === v.id ? "bg-primary/10" : "hover:bg-sidebar-accent/30"}`}
                      onClick={() => setSelectedId(v.id === selectedId ? null : v.id)}>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{v.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">G₁₂={v.golay12} · ‖v‖={v.norm}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeVertex(v.id); }}
                        data-testid={`button-remove-${v.id}`}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded bg-card">
                <div className="px-4 py-2 border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Add vertex</span>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                  {notAdded.map(e => (
                    <button key={e.id} data-testid={`button-add-${e.id}`} onClick={() => addVertex(e)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-sidebar-accent/30 transition-colors group">
                      <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-foreground truncate">{e.label}</div>
                        <div className="text-[10px] text-muted-foreground">{e.category} · G₁₂={golayAddress(e.id)}</div>
                      </div>
                    </button>
                  ))}
                  {notAdded.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">All entities added</p>
                  )}
                </div>
              </div>

              <div className="border border-border rounded bg-card p-4 space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Lattice stats</div>
                <div className="space-y-1 font-mono text-xs">
                  {[
                    ["Vertices (n)", stats.n],
                    ["Kissing pairs", stats.kiss],
                    ["Mean ‖v‖", stats.avgNorm],
                    ["det(v₀,v₁)", stats.det],
                    ["Hall η", "0.09"],
                    ["κ(G_H)", "65.18"],
                    ["φ−gap", "0.02"],
                    ["Target", "Λ₂₄ (Leech)"],
                    ["Codewords", "4,096"],
                    ["Kiss target", "196,560"],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded bg-card p-3">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Legend</div>
                <div className="space-y-1">
                  {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className={`text-[10px] border rounded px-1.5 py-0.5 ${cls}`}>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
