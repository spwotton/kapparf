import { useState, useMemo, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Cpu, Plus, X, Info, GitBranch, Hash, Layers } from "lucide-react";

interface LatticeVertex {
  id: string;
  label: string;
  category: "person" | "location" | "company" | "event";
  coords: [number, number];
  norm: number;
  connections: string[];
  flags: string[];
  klabel?: string;
}

const ENTITY_POOL: Omit<LatticeVertex, "coords" | "norm">[] = [
  { id: "genesis-peralta",  label: "Genesis Peralta",         category: "person",   connections: ["jairo-alfaro","hector-mora","dave-mira","caliches-wishbone"], flags: ["Asset","Honey trap","Rapid attachment"] },
  { id: "jairo-alfaro",     label: "Jairo Alfaro",            category: "person",   connections: ["genesis-peralta","los-papos","caliches-wishbone"],            flags: ["Handler","Alfaro surname"] },
  { id: "hector-mora",      label: "Hector Mora",             category: "person",   connections: ["setecom","jaco-ban","breakwater","dave-mira"],                flags: ["V2K","7410kHz","4G tower","SCADA"] },
  { id: "dave-mira",        label: "Pablo Mora",              category: "person",   connections: ["hector-mora","genesis-peralta","kenneth-tencio"],             flags: ["BMX","Red Bull","Motive"] },
  { id: "kenneth-tencio",   label: "Kenneth Tencio",          category: "person",   connections: ["dave-mira","bac-park"],                                       flags: ["Olympic BMX","Red Bull","BAC Park"] },
  { id: "jonathan-harris",  label: "Jonathan Harris",         category: "person",   connections: ["genesis-peralta","la-nacion"],                               flags: ["Controller","Margarita Island","Uber"] },
  { id: "adam-harper",      label: "Adam Harper",             category: "person",   connections: ["hotel-amavi","israel-brooks","mike-greenwald"],              flags: ["Amavi investor","Hermosa Palms","HGTV"] },
  { id: "leo-controller",   label: "Leo (Controller)",        category: "person",   connections: ["genesis-peralta","jairo-alfaro"],                            flags: ["Controller","Dealer"] },
  { id: "todd-johnson",     label: "Todd Johnson",            category: "person",   connections: ["riverwalk","dewaves"],                                       flags: ["DeWave","WiFi CSI","Sensing array"] },
  { id: "jeff-porter",      label: "Jeff Porter",             category: "person",   connections: [],                                                           flags: ["CIA","JW","AA"] },
  { id: "jaco-ban",         label: "Jaco BAN",                category: "location", connections: ["hector-mora","breakwater"],                                  flags: ["V2K origin","Generator","4G"] },
  { id: "breakwater",       label: "Breakwater",              category: "location", connections: ["hector-mora","jaco-ban"],                                    flags: ["4G tower","First V2K"] },
  { id: "la-nacion",        label: "La Nacion",               category: "location", connections: ["jonathan-harris"],                                           flags: ["Texas military","Managed placement"] },
  { id: "quebrada-seca",    label: "Quebrada Seca",           category: "location", connections: ["john-amavi","dave-mira"],                                    flags: ["Surveillance cluster","Dunia","Leo RF"] },
  { id: "cnu-42",           label: "CNU #42 Casa Rexha",      category: "location", connections: ["genesis-peralta"],                                           flags: ["CIA property","28 cameras","Structural mod"] },
  { id: "aurora-yoga",      label: "Aurora Yoga",             category: "company",  connections: ["genesis-peralta"],                                           flags: ["Laundering","Venezuelan cluster","Kino"] },
  { id: "setecom",          label: "SETECOM S.A.",            category: "company",  connections: ["hector-mora"],                                               flags: ["DSE gateways","SCADA","Telecom"] },
  { id: "hotel-amavi",      label: "Hotel Amavi",             category: "company",  connections: ["adam-harper","john-amavi"],                                  flags: ["Italian connection","Hermosa Palms","HGTV"] },
  { id: "gaia-natural-foods",label:"Gaia Natural Foods",      category: "company",  connections: ["genesis-peralta"],                                           flags: ["Colombian-Israeli","Visonic thread","Placement"] },
  { id: "caliches-wishbone",label: "Caliches Wishbone",       category: "company",  connections: ["jairo-alfaro","genesis-peralta"],                            flags: ["CLOSED","8yr handler base","Italian"] },
  { id: "bac-park",         label: "BAC Park / 10cio",        category: "company",  connections: ["kenneth-tencio","dave-mira"],                               flags: ["Olympic hub","Hector BAC logins"] },
];

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
  const threshold = 0.15;
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = Math.sqrt(
        (vertices[i].coords[0] - vertices[j].coords[0]) ** 2 +
        (vertices[i].coords[1] - vertices[j].coords[1]) ** 2
      );
      if (d < threshold) count++;
    }
  }
  return count;
}

const CATEGORY_COLORS: Record<string, string> = {
  person:   "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300  border-blue-200  dark:border-blue-800",
  location: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  company:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  event:    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

const CANVAS_SIZE = 420;
const CENTER = CANVAS_SIZE / 2;
const SCALE  = 160;

export default function SatoshiLatticePage() {
  const [vertices, setVertices] = useState<LatticeVertex[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addVertex = (entity: Omit<LatticeVertex, "coords" | "norm">) => {
    if (vertices.find(v => v.id === entity.id)) return;
    const idx = vertices.length;
    const seed = entity.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const coords = latticeCoords(seed, idx, Math.max(ENTITY_POOL.length, 8));
    const norm = computeNorm(coords);
    setVertices(prev => [...prev, { ...entity, coords, norm }]);
  };

  const removeVertex = (id: string) => {
    setVertices(prev => prev.filter(v => v.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = useMemo(() => vertices.find(v => v.id === selectedId) ?? null, [vertices, selectedId]);

  const gramMatrix = useMemo(() => {
    if (!selected || vertices.length < 2) return null;
    const others = vertices.filter(v => v.id !== selected.id).slice(0, 4);
    return others.map(v => ({
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
    avgNorm: vertices.length
      ? parseFloat((vertices.reduce((s, v) => s + v.norm, 0) / vertices.length).toFixed(6))
      : 0,
    det: vertices.length >= 2
      ? parseFloat(Math.abs(
          vertices[0].coords[0] * (vertices[1]?.coords[1] ?? 0) -
          vertices[0].coords[1] * (vertices[1]?.coords[0] ?? 0)
        ).toFixed(6))
      : 0,
  }), [vertices]);

  useEffect(() => {
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
    const nodeSel = "#f59e0b";
    const textCol = isDark ? "rgba(255,255,255,0.7)"  : "rgba(0,0,0,0.7)";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.strokeStyle = gridCol;
      ctx.lineWidth = 0.5;
      ctx.moveTo(CENTER + i * SCALE / 4, 0);
      ctx.lineTo(CENTER + i * SCALE / 4, CANVAS_SIZE);
      ctx.stroke();
      ctx.moveTo(0, CENTER + i * SCALE / 4);
      ctx.lineTo(CANVAS_SIZE, CENTER + i * SCALE / 4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.strokeStyle = axisCol;
    ctx.lineWidth = 1;
    ctx.moveTo(CENTER, 0); ctx.lineTo(CENTER, CANVAS_SIZE);
    ctx.moveTo(0, CENTER); ctx.lineTo(CANVAS_SIZE, CENTER);
    ctx.stroke();

    const pts: Record<string, [number, number]> = {};
    vertices.forEach(v => {
      pts[v.id] = [CENTER + v.coords[0] * SCALE, CENTER - v.coords[1] * SCALE];
    });

    vertices.forEach(v => {
      v.connections.forEach(cid => {
        if (pts[cid]) {
          ctx.beginPath();
          ctx.strokeStyle = edgeCol;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.moveTo(pts[v.id][0], pts[v.id][1]);
          ctx.lineTo(pts[cid][0],  pts[cid][1]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    });

    vertices.forEach(v => {
      const [px, py] = pts[v.id];
      const isSel = v.id === selectedId;
      const r = isSel ? 7 : 5;

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? nodeSel : nodeDef;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = isSel ? "#f59e0b" : (isDark ? "#818cf8" : "#6366f1");
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = textCol;
      ctx.font = `${isSel ? "600 " : ""}10px sans-serif`;
      ctx.fillText(v.label.split(" ")[0], px + r + 3, py + 4);
    });

  }, [vertices, selectedId]);

  const notAdded = ENTITY_POOL.filter(e => !vertices.find(v => v.id === e.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Mathematical Forensics</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-1">Satoshi Lattice</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Assign network entities as vertices in a 2D projection of a dense lattice. Inner products, norms,
            Gram matrices, and kissing numbers expose structural relationships not visible in a standard graph.
            Each vertex position is derived deterministically from the entity's identifier hash.
          </p>
          <button
            onClick={() => setShowInfo(!showInfo)}
            data-testid="button-toggle-info"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Info className="w-3 h-3" /> {showInfo ? "Hide" : "What is this?"}
          </button>
          {showInfo && (
            <div className="mt-3 p-4 border border-border rounded bg-sidebar-accent/20 text-xs text-muted-foreground leading-relaxed max-w-2xl space-y-2">
              <p><strong className="text-foreground">Satoshi lattice</strong> refers to lattice-based analysis applied to the secp256k1 elliptic curve used in Bitcoin — originally used to extract private keys from weak ECDSA signatures. Adapted here as a forensic framework: entities are embedded as lattice vectors, and their geometric relationships (inner products, distances, norms) encode structural intelligence not visible in a conventional social graph.</p>
              <p><strong className="text-foreground">Leech lattice</strong> (24-dimensional, kissing number 196,560) is the mathematical ideal — maximum sphere packing in 24D. Our projection to 2D preserves relative relationships while enabling visual analysis.</p>
              <p><strong className="text-foreground">Kissing number</strong>: how many vertex pairs are within the threshold distance — a measure of cluster density. High kissing number in a subgraph = operational cluster.</p>
              <p><strong className="text-foreground">Gram matrix</strong>: pairwise inner products between selected vertex and its neighbors — measures angular alignment (directional similarity) of entities in the lattice space.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-4">
            <div className="border border-border rounded bg-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">Lattice projection — 2D / ℝ²</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>n={stats.n}</span>
                  <span>kiss={stats.kiss}</span>
                  <span>ā‖v‖={stats.avgNorm}</span>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                data-testid="canvas-lattice"
                className="w-full"
                onClick={e => {
                  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                  const scaleX = CANVAS_SIZE / rect.width;
                  const mx = (e.clientX - rect.left) * scaleX;
                  const my = (e.clientY - rect.top)  * scaleX;
                  let closest: string | null = null;
                  let minD = 14;
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
                  <div>v·v = {parseFloat((selected.norm ** 2).toFixed(6))}</div>
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
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Active vertices ({vertices.length})</span>
              </div>
              <div className="p-2 max-h-48 overflow-y-auto">
                {vertices.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No vertices. Add entities below.</p>
                )}
                {vertices.map(v => (
                  <div
                    key={v.id}
                    data-testid={`vertex-row-${v.id}`}
                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                      selectedId === v.id ? "bg-primary/10" : "hover:bg-sidebar-accent/30"
                    }`}
                    onClick={() => setSelectedId(v.id === selectedId ? null : v.id)}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{v.label}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">‖v‖={v.norm}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeVertex(v.id); }}
                      data-testid={`button-remove-${v.id}`}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border rounded bg-card">
              <div className="px-4 py-2 border-b border-border">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Add entity</span>
              </div>
              <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
                {notAdded.map(e => (
                  <button
                    key={e.id}
                    data-testid={`button-add-${e.id}`}
                    onClick={() => addVertex(e)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-sidebar-accent/30 transition-colors group"
                  >
                    <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-foreground truncate">{e.label}</div>
                      <div className="text-[10px] text-muted-foreground">{e.category}</div>
                    </div>
                  </button>
                ))}
                {notAdded.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">All entities added</p>
                )}
              </div>
            </div>

            <div className="border border-border rounded bg-card p-4 space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Lattice statistics</div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vertices (n)</span>
                  <span className="text-foreground">{stats.n}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kissing pairs</span>
                  <span className="text-foreground">{stats.kiss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mean ‖v‖</span>
                  <span className="text-foreground">{stats.avgNorm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">det(v₀,v₁)</span>
                  <span className="text-foreground">{stats.det}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimension</span>
                  <span className="text-foreground">2 (ℝ² projection)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target lattice</span>
                  <span className="text-foreground">Λ₂₄ (Leech)</span>
                </div>
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
              <div className="mt-3 text-[10px] text-muted-foreground space-y-0.5">
                <div>— dashed edges: documented connection</div>
                <div>● gold: selected vertex</div>
                <div>● indigo: unselected vertex</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
