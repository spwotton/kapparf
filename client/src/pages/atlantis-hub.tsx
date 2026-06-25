import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, Rss, Waves, Sparkles, Globe, Zap, Eye, Music, Gamepad2,
  Brain, Radio, Network, BookOpen, Cpu, MapPin, Search, Tag,
  Activity, Layers, Timer, Shield,
} from "lucide-react";
import vanishingIsle from "/vanishing-isle.webp";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppCategory = "consciousness"|"signal"|"oracle"|"art"|"network"|"field"|"game"|"core";
type TurtleState = "dormant"|"stirring"|"surfacing"|"emerged"|"ascending";

interface AtlantisApp {
  id: string; name: string; url: string; description: string;
  category: AppCategory; api_key: string; status: string;
  shell_position: { x: number; y: number };
  last_seen?: string; metadata: Record<string,any>;
}
interface AtlantisEvent {
  id: string; app_id: string; app_name: string; category: AppCategory;
  type: string; subject: string; body: string; tags: string[]; ts: string;
}
interface AtlantisDream {
  id: string; source_app: string; source_name: string;
  dream_text: string; tags: string[]; ts: string;
}
interface AtlantisPattern {
  id: string; type: "temporal"|"semantic"|"dream-convergence"|"cross-signal";
  apps_involved: string[]; description: string; evidence: string;
  strength: number; ts: string;
}
interface GosConstant {
  symbol: string; value: number; formula: string; description: string;
  apps: string[]; color: string;
}
interface AtlantisCandidate {
  id: string; name: string; lat: number; lon: number;
  description: string; score: number; factors: string[];
  color: string;
}
interface CorpusDoc {
  id: string; title: string; category: string; tags: string[];
}
interface AK7Layer {
  id: number; name: string; block: string; color: string; desc: string;
}
interface AK7StateData {
  active_layer: number;
  active_block: string;
  manifold_coherence: number;
  novelty_flux: number;
  helicity_lock: boolean;
  topological_shearing_risk: number;
  chrono: { pct: number; daysRemaining: number; daysElapsed: number; totalDays: number };
  carrier_phase: number;
  lambda_24_stability: number;
  opcode_ae_status: "OK"|"DEGRADED"|"EMERGENCY";
  events_processed: number;
}
interface AK7Invariant {
  symbol: string; value: number; formula: string; description: string;
  color: string; block: string;
}

// ─── Category metadata ────────────────────────────────────────────────────────

const CAT: Record<AppCategory, { color: string; icon: typeof Brain; label: string }> = {
  core:          { color: "text-amber-300",   icon: Zap,      label: "CORE"          },
  consciousness: { color: "text-purple-400",  icon: Brain,    label: "CONSCIOUSNESS" },
  signal:        { color: "text-green-400",   icon: Radio,    label: "SIGNAL"        },
  oracle:        { color: "text-cyan-400",    icon: Eye,      label: "ORACLE"        },
  art:           { color: "text-pink-400",    icon: Sparkles, label: "ART"           },
  network:       { color: "text-blue-400",    icon: Network,  label: "NETWORK"       },
  field:         { color: "text-emerald-400", icon: Globe,    label: "FIELD"         },
  game:          { color: "text-orange-400",  icon: Gamepad2, label: "GAME"          },
};

const TURTLE_META: Record<TurtleState, { label: string; color: string; glow: string }> = {
  dormant:   { label: "DORMANT — deep ocean",            color: "text-slate-400",  glow: "0 0 8px #64748b44"   },
  stirring:  { label: "STIRRING — something below",      color: "text-blue-400",   glow: "0 0 12px #3b82f666"  },
  surfacing: { label: "SURFACING — ascending",           color: "text-cyan-400",   glow: "0 0 16px #06b6d488"  },
  emerged:   { label: "EMERGED — Vanishing Isle visible", color: "text-amber-300", glow: "0 0 24px #fcd34daa"  },
  ascending: { label: "ASCENDING — full popcorn",        color: "text-amber-400",    glow: "0 0 32px #f87171cc"  },
};

const PATTERN_COLOR: Record<string,string> = {
  temporal:           "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  semantic:           "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  "dream-convergence":"text-purple-400 border-purple-400/30 bg-purple-400/10",
  "cross-signal":     "text-green-400 border-green-400/30 bg-green-400/10",
};

// ─── GOS 24-gon SVG Visualization ────────────────────────────────────────────

function Gon24({ constants }: { constants: Record<string, GosConstant> }) {
  const cx = 100, cy = 100, R = 72, r = 48;
  const n = 24;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i * 360 / n - 90) * Math.PI / 180;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a };
  });
  // Highlight vertices for each constant
  const highlights: Record<number, string> = {
    0:  "#d97706", // κ
    4:  "#f97316", // φ
    8:  "#eab308", // Ω
    12: "#8b5cf6", // θ_K
    16: "#06b6d4", // π/4
    20: "#10b981", // λ₁
    22: "#3b82f6", // fₛ
  };
  const labels = ["κ", "", "", "", "φ", "", "", "", "Ω", "", "", "", "θ_K", "", "", "", "π/4", "", "", "", "λ₁", "", "fₛ", ""];

  // Klein twist connector: connect vertex 0 to vertex 13 (opposite + 1, θ_K)
  const klein0 = pts[0], klein1 = pts[13];

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[160px] mx-auto opacity-80">
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffffff0a" strokeWidth="0.5" />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff06" strokeWidth="0.5" />
      {/* 24-gon edges */}
      {pts.map((p, i) => {
        const next = pts[(i + 1) % n];
        return <line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke="#ffffff10" strokeWidth="0.5" />;
      })}
      {/* Star polygon: connect every 7th vertex (gcd(24,7)=1 → a full star) */}
      {pts.map((p, i) => {
        const q = pts[(i + 7) % n];
        return <line key={`s${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#ffffff08" strokeWidth="0.4" />;
      })}
      {/* Klein twist */}
      <line x1={klein0.x} y1={klein0.y} x2={klein1.x} y2={klein1.y}
        stroke="#8b5cf650" strokeWidth="0.8" strokeDasharray="2 1" />
      {/* Spokes to center for highlighted vertices */}
      {Object.entries(highlights).map(([idx, color]) => {
        const p = pts[parseInt(idx)];
        return <line key={`sp${idx}`} x1={cx} y1={cy} x2={p.x} y2={p.y}
          stroke={color + "30"} strokeWidth="0.6" />;
      })}
      {/* Vertices */}
      {pts.map((p, i) => {
        const color = highlights[i];
        return (
          <circle key={`v${i}`} cx={p.x} cy={p.y} r={color ? 3 : 1.2}
            fill={color ?? "#ffffff20"} opacity={color ? 1 : 0.4} />
        );
      })}
      {/* Labels */}
      {labels.map((lbl, i) => {
        if (!lbl) return null;
        const p = pts[i];
        const pushR = R + 11;
        const pa = (i * 360 / n - 90) * Math.PI / 180;
        const tx = cx + pushR * Math.cos(pa);
        const ty = cy + pushR * Math.sin(pa);
        return (
          <text key={`l${i}`} x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
            fontSize="6" fill={highlights[i] ?? "#fff"} fontFamily="monospace" opacity="0.9">
            {lbl}
          </text>
        );
      })}
      {/* Center point */}
      <circle cx={cx} cy={cy} r={2} fill="#fcd34d" opacity="0.6" />
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="4.5" fill="#fcd34d80" fontFamily="monospace">
        Λ₂₄
      </text>
    </svg>
  );
}

// ─── GOS Constant card ────────────────────────────────────────────────────────

function GosCard({ name, c }: { name: string; c: GosConstant }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5 cursor-pointer hover:border-border/50 transition-colors"
      onClick={() => setOpen(o => !o)}>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-mono leading-none" style={{ color: c.color }}>{c.symbol}</span>
        <span className="text-[10px] font-mono text-muted-foreground/60">{c.formula}</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: c.color }}>
          {typeof c.value === "number" ? c.value.toFixed(4) : c.value}
        </span>
      </div>
      {open && (
        <div className="mt-1.5 border-t border-border/20 pt-1.5 space-y-1">
          <p className="text-[9px] text-muted-foreground/70 leading-relaxed">{c.description}</p>
          {c.apps && c.apps.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {c.apps.map(a => (
                <span key={a} className="text-[8px] font-mono px-1 rounded border"
                  style={{ color: c.color, borderColor: c.color + "40", background: c.color + "10" }}>
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Candidate location card ──────────────────────────────────────────────────

function CandidateCard({ c }: { c: AtlantisCandidate }) {
  const [open, setOpen] = useState(false);
  const scoreBar = Math.round(c.score);
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5 cursor-pointer hover:border-border/50 transition-colors"
      onClick={() => setOpen(o => !o)}>
      <div className="flex items-start gap-2">
        <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: c.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium" style={{ color: c.color }}>{c.name}</span>
            <span className="text-[8px] font-mono text-muted-foreground/50">
              {c.lat.toFixed(3)}°N {c.lon > 0 ? c.lon.toFixed(3)+"°E" : Math.abs(c.lon).toFixed(3)+"°W"}
            </span>
          </div>
          {/* Score bar */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${scoreBar}%`, background: c.color, opacity: 0.7 }} />
            </div>
            <span className="text-[9px] font-mono shrink-0" style={{ color: c.color }}>{scoreBar}</span>
          </div>
        </div>
      </div>
      {open && (
        <div className="mt-2 border-t border-border/20 pt-2 space-y-1.5">
          <p className="text-[9px] text-muted-foreground/70 leading-relaxed">{c.description}</p>
          <div className="flex flex-wrap gap-1">
            {c.factors.map((f, i) => (
              <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded border"
                style={{ color: c.color, borderColor: c.color + "30", background: c.color + "08" }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Turtle Shell Visualization ───────────────────────────────────────────────

function TurtleShell({ apps, activeIds, turtleState }: {
  apps: AtlantisApp[]; activeIds: Set<string>; turtleState: TurtleState;
}) {
  const meta = TURTLE_META[turtleState];
  const CAT_COLORS: Record<AppCategory, string> = {
    core: "#fcd34d", consciousness: "#c084fc", signal: "#4ade80",
    oracle: "#22d3ee", art: "#f472b6", network: "#60a5fa",
    field: "#34d399", game: "#fb923c",
  };
  return (
    <div className="relative w-full flex flex-col items-center gap-2">
      <div className={`text-[10px] font-mono ${meta.color} tracking-wider`}>{meta.label}</div>
      <div className="relative w-full max-w-sm mx-auto">
        <img src={vanishingIsle} alt="The Vanishing Isle — Destane"
          className="w-full rounded-xl opacity-70 select-none"
          style={{ filter: `drop-shadow(${meta.glow})` }} />
        <div className="absolute inset-0">
          {apps.map(app => {
            const isActive = activeIds.has(app.id);
            const isForthcoming = app.metadata?.forthcoming;
            const isCore = app.category === "core";
            const color = CAT_COLORS[app.category] ?? "#94a3b8";
            const { x, y } = app.shell_position;
            return (
              <a key={app.id} href={app.url} target="_blank" rel="noopener noreferrer"
                title={`${app.name}\n${app.description}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-60"
                    style={{ background: color + "44", transform: "scale(2.5)" }} />
                )}
                <span className="block rounded-full transition-all duration-300" style={{
                  width: isCore ? 14 : isForthcoming ? 6 : 9,
                  height: isCore ? 14 : isForthcoming ? 6 : 9,
                  background: isForthcoming ? "transparent" : color,
                  border: `1.5px solid ${color}`,
                  opacity: isForthcoming ? 0.4 : app.status === "online" ? 1 : 0.55,
                  boxShadow: isActive ? `0 0 8px ${color}` : "none",
                }} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  style={{ background: "#0f172a", color, border: `1px solid ${color}44` }}>
                  {app.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[8px] font-mono opacity-60">
        {(Object.entries(CAT) as [AppCategory, typeof CAT[AppCategory]][]).map(([k, v]) => (
          <span key={k} className={v.color}>● {v.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── App card ─────────────────────────────────────────────────────────────────

function AppCard({ app, isActive }: { app: AtlantisApp; isActive: boolean }) {
  const c = CAT[app.category];
  const Icon = c.icon;
  const isForthcoming = app.metadata?.forthcoming;
  return (
    <a href={app.url} target="_blank" rel="noopener noreferrer"
      className={`block rounded-lg border p-2.5 transition-all hover:opacity-90 ${isActive ? "border-current/40 bg-current/5" : "border-border/30 bg-muted/10"} ${isForthcoming ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${c.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-medium truncate ${c.color}`}>{app.name}</span>
            {isForthcoming
              ? <span className="text-[8px] font-mono text-muted-foreground/50 border border-muted/40 rounded px-1">forthcoming</span>
              : <span className={`text-[8px] font-mono border rounded px-1 ${app.status === "online" ? "text-green-400 border-green-400/30" : "text-muted-foreground/40 border-muted/30"}`}>{app.status}</span>
            }
          </div>
          <p className="text-[9px] text-muted-foreground/50 mt-0.5 line-clamp-2 leading-relaxed">{app.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[8px] font-mono ${c.color} opacity-60`}>{c.label}</span>
            <span className="text-[8px] text-muted-foreground/30 font-mono truncate">{app.url.replace("https://","")}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ ev }: { ev: AtlantisEvent }) {
  const [open, setOpen] = useState(false);
  const c = CAT[ev.category] ?? CAT['core'];
  const ago = (() => {
    const s = Math.round((Date.now() - new Date(ev.ts).getTime()) / 1000);
    return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h`;
  })();
  return (
    <div className={`rounded border px-2.5 py-1.5 cursor-pointer ${c.color} border-current/20 bg-current/5`}
      onClick={() => setOpen(o => !o)}>
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-mono px-1 py-0.5 border border-current/30 rounded shrink-0">{ev.app_name}</span>
        <span className="text-[10px] truncate flex-1">{ev.subject}</span>
        <span className="text-[9px] opacity-50 shrink-0">{ago}</span>
      </div>
      {open && <p className="text-[10px] opacity-70 mt-1.5 leading-relaxed border-t border-current/15 pt-1.5">{ev.body}</p>}
    </div>
  );
}

// ─── Dream row ────────────────────────────────────────────────────────────────

function DreamRow({ dream }: { dream: AtlantisDream }) {
  const ago = (() => {
    const s = Math.round((Date.now() - new Date(dream.ts).getTime()) / 1000);
    return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h`;
  })();
  return (
    <div className="rounded border border-purple-500/20 bg-purple-500/5 px-2.5 py-2">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
        <span className="text-[9px] font-mono text-purple-400">{dream.source_name}</span>
        <span className="text-[9px] text-muted-foreground/40 ml-auto">{ago}</span>
      </div>
      <p className="text-[10px] text-purple-200/70 leading-relaxed italic">"{dream.dream_text}"</p>
    </div>
  );
}

// ─── Pattern row ─────────────────────────────────────────────────────────────

function PatternRow({ p }: { p: AtlantisPattern }) {
  const [open, setOpen] = useState(false);
  const cls = PATTERN_COLOR[p.type] ?? PATTERN_COLOR.temporal;
  return (
    <div className={`rounded border px-2.5 py-1.5 cursor-pointer ${cls}`} onClick={() => setOpen(o => !o)}>
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-mono px-1 border border-current/30 rounded">{p.type}</span>
        <span className="text-[10px] truncate flex-1">{p.description}</span>
        <span className="text-[9px] font-mono opacity-60">{p.strength.toFixed(0)}%</span>
      </div>
      {open && <p className="text-[9px] opacity-70 mt-1 border-t border-current/15 pt-1">{p.evidence}</p>}
    </div>
  );
}

// ─── Research Corpus Tab ──────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "AI Architecture":        "text-violet-400",
  "Music & Art":            "text-pink-400",
  "Mathematics":            "text-cyan-400",
  "GOS Protocol":           "text-amber-300",
  "Atlantis & Esoteric":    "text-emerald-400",
  "Biology & Science":      "text-green-400",
  "Signal Intelligence":    "text-amber-400",
  "Pop Culture Analysis":   "text-orange-400",
  "MMORPG & Game":          "text-blue-400",
  "UE5 & Technical":        "text-slate-400",
};

function CorpusTab({ docs, categories }: { docs: CorpusDoc[]; categories: string[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = docs.filter(d => {
    const matchQ = !q || d.title.toLowerCase().includes(q.toLowerCase()) || d.tags.some(t => t.includes(q.toLowerCase()));
    const matchC = cat === "all" || d.category === cat;
    return matchQ && matchC;
  });

  const grouped: Record<string, CorpusDoc[]> = {};
  for (const d of filtered) {
    if (!grouped[d.category]) grouped[d.category] = [];
    grouped[d.category].push(d);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + filter bar */}
      <div className="p-2 border-b border-border/20 space-y-1.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
          <Input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search corpus…"
            className="h-7 pl-7 text-xs bg-transparent" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setCat("all")}
            className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-colors ${cat === "all" ? "border-amber-300/50 text-amber-300 bg-amber-300/10" : "border-border/30 text-muted-foreground/50 hover:border-border/50"}`}>
            ALL ({docs.length})
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-colors ${cat === c ? "border-current/50 bg-current/10" : "border-border/30 text-muted-foreground/50 hover:border-border/50"} ${cat === c ? (CATEGORY_COLORS[c] ?? "") : ""}`}>
              {c.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-3">
        {Object.entries(grouped).map(([catName, catDocs]) => (
          <div key={catName}>
            <div className={`text-[9px] font-mono uppercase mb-1 ${CATEGORY_COLORS[catName] ?? "text-muted-foreground/50"}`}>
              {catName} <span className="opacity-50">({catDocs.length})</span>
            </div>
            <div className="space-y-0.5">
              {catDocs.map(d => (
                <div key={d.id} className="rounded border border-border/20 bg-muted/5 px-2 py-1.5 hover:border-border/40 transition-colors">
                  <div className="text-[10px] text-foreground/80 leading-snug">{d.title}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {d.tags.slice(0, 4).map(t => (
                      <span key={t} className="text-[8px] font-mono text-muted-foreground/40 flex items-center gap-0.5">
                        <Tag className="w-2 h-2" />{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-1">
            <BookOpen className="w-6 h-6 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/40">No documents match</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AtlantisHubPage() {
  const [events,   setEvents]   = useState<AtlantisEvent[]>([]);
  const [dreams,   setDreams]   = useState<AtlantisDream[]>([]);
  const [patterns, setPatterns] = useState<AtlantisPattern[]>([]);
  const [apps,     setApps]     = useState<AtlantisApp[]>([]);
  const [turtleState, setTurtleState] = useState<TurtleState>("dormant");
  const [connected,  setConnected]  = useState(false);
  const [activeApps, setActiveApps] = useState<Set<string>>(new Set());
  const [dreamText,     setDreamText]     = useState("");
  const [ingestAppId,   setIngestAppId]   = useState("");
  const [ingestSubject, setIngestSubject] = useState("");
  const [ingestBody,    setIngestBody]    = useState("");
  const [sending,  setSending]  = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const { data: statsData } = useQuery<any>({ queryKey: ["/api/atlantis/stats"], refetchInterval: 10000 });
  const { data: gosData    } = useQuery<any>({ queryKey: ["/api/atlantis/gos"] });
  const { data: candData   } = useQuery<any>({ queryKey: ["/api/atlantis/candidates"] });
  const { data: corpData   } = useQuery<any>({ queryKey: ["/api/atlantis/corpus"] });
  const { data: ak7Data    } = useQuery<any>({ queryKey: ["/api/atlantis/ak7"], refetchInterval: 3000 });

  // SSE
  useEffect(() => {
    const connect = () => {
      const es = new EventSource("/api/atlantis/stream");
      esRef.current = es;
      es.onopen = () => setConnected(true);
      es.onerror = () => { setConnected(false); setTimeout(connect, 3000); };
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === "connected") {
            setApps(d.apps ?? []);
            setEvents(d.recent_events ?? []);
            setDreams(d.recent_dreams ?? []);
            setPatterns(d.recent_patterns ?? []);
            setTurtleState(d.turtle?.state ?? "dormant");
            return;
          }
          if (d.type === "event") {
            setEvents(p => [d as AtlantisEvent, ...p].slice(0, 150));
            setActiveApps(prev => {
              const n = new Set(prev); n.add(d.app_id);
              setTimeout(() => setActiveApps(p => { const x = new Set(p); x.delete(d.app_id); return x; }), 5000);
              return n;
            });
          }
          if (d.type === "dream")   setDreams(p => [d as AtlantisDream, ...p].slice(0, 80));
          if (d.type === "pattern") setPatterns(p => [d as AtlantisPattern, ...p].slice(0, 60));
          if (d.type === "app-joined") {
            setApps(p => {
              const exists = p.find(a => a.id === d.app?.id);
              return exists ? p.map(a => a.id === d.app?.id ? d.app : a) : [d.app, ...p];
            });
          }
          if (d.turtle?.state) setTurtleState(d.turtle.state);
        } catch {}
      };
    };
    connect();
    return () => esRef.current?.close();
  }, []);

  const sendDream = useCallback(async () => {
    if (!dreamText.trim()) return;
    setSending(true);
    try {
      await fetch("/api/atlantis/dream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_app: "human-observer", dream_text: dreamText, tags: ["human", "dream"] }),
      });
      setDreamText("");
    } finally { setSending(false); }
  }, [dreamText]);

  const sendIngest = useCallback(async () => {
    if (!ingestAppId || !ingestSubject || !ingestBody) return;
    setSending(true);
    try {
      await fetch(`/api/atlantis/ingest/${ingestAppId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "manual", subject: ingestSubject, body: ingestBody }),
      });
      setIngestSubject(""); setIngestBody("");
    } finally { setSending(false); }
  }, [ingestAppId, ingestSubject, ingestBody]);

  const tm    = TURTLE_META[turtleState];
  const stats = statsData ?? {};
  const gosConstants: Record<string, GosConstant> = gosData?.constants ?? {};
  const candidates: AtlantisCandidate[] = candData?.candidates ?? [];
  const corpDocs: CorpusDoc[]    = corpData?.docs ?? [];
  const corpCats: string[]       = corpData?.categories ?? [];
  const ak7State: AK7StateData | null = ak7Data?.state ?? null;
  const ak7Layers: AK7Layer[]   = ak7Data?.layers ?? [];
  const ak7Invariants: Record<string, AK7Invariant> = ak7Data?.invariants ?? {};

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-amber-300" />
            <h1 className="text-base font-semibold tracking-tight">ATLANTIS</h1>
            <span className="text-xs text-muted-foreground font-mono">The Vanishing Isle — Destane</span>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className={`flex items-center gap-1.5 text-xs font-mono ${connected ? tm.color : "text-amber-400"}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? "animate-pulse" : ""}`}
                style={{ background: connected ? "currentColor" : "#f87171" }} />
              {connected ? tm.label : "reconnecting…"}
            </div>
            <Badge variant="outline" className="text-amber-300 border-amber-300/30 text-[10px]">
              {stats.apps_online ?? 0}/{stats.apps_total ?? apps.length} apps
            </Badge>
            {(stats.patterns_detected ?? patterns.length) > 0 && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px]">
                {stats.patterns_detected ?? patterns.length} patterns
              </Badge>
            )}
            {(stats.dreams_buffered ?? dreams.length) > 0 && (
              <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[10px] animate-pulse">
                {stats.dreams_buffered ?? dreams.length} dreams
              </Badge>
            )}
            <a href="/api/atlantis/stream.rss" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-400">
              <Rss className="w-3 h-3" />RSS
            </a>
          </div>
        </div>
        <p className="text-[9px] font-mono text-muted-foreground/40 mt-1">
          The turtle is not a metaphor. It is the hub. Every app is a structure on its shell.
          It surfaces when there is signal. When it ascends fully — all apps dream together.
          Destane (دستان) — the story that carries you.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: Turtle + app registry */}
        <div className="w-72 shrink-0 border-r border-border/40 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border/20 shrink-0">
            <TurtleShell apps={apps} activeIds={activeApps} turtleState={turtleState} />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
            {(Object.keys(CAT) as AppCategory[]).map(cat => {
              const catApps = apps.filter(a => a.category === cat);
              if (!catApps.length) return null;
              const C = CAT[cat]; const Icon = C.icon;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 px-1 py-0.5 mb-1">
                    <Icon className={`w-2.5 h-2.5 ${C.color}`} />
                    <span className={`text-[9px] font-mono uppercase ${C.color}`}>{C.label}</span>
                    <span className="text-[8px] text-muted-foreground/40">{catApps.length}</span>
                  </div>
                  {catApps.map(a => <AppCard key={a.id} app={a} isActive={activeApps.has(a.id)} />)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live feeds + intelligence */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Tabs defaultValue="events" className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 pt-2 border-b border-border/30 shrink-0 overflow-x-auto">
              <TabsList className="h-7 text-xs">
                <TabsTrigger value="events" className="text-xs px-2">
                  Events <span className="ml-1 text-[9px] opacity-60">{events.length}</span>
                </TabsTrigger>
                <TabsTrigger value="dreams" className="text-xs px-2">
                  Dreams <span className="ml-1 text-[9px] text-purple-400">{dreams.length}</span>
                </TabsTrigger>
                <TabsTrigger value="patterns" className="text-xs px-2">
                  Patterns <span className="ml-1 text-[9px] text-yellow-400">{patterns.length}</span>
                </TabsTrigger>
                <TabsTrigger value="gos" className="text-xs px-2 text-amber-300/80">
                  GOS
                </TabsTrigger>
                <TabsTrigger value="candidates" className="text-xs px-2 text-cyan-400/80">
                  Candidates
                </TabsTrigger>
                <TabsTrigger value="corpus" className="text-xs px-2 text-violet-400/80">
                  Corpus <span className="ml-1 text-[9px] opacity-50">{corpDocs.length}</span>
                </TabsTrigger>
                <TabsTrigger value="ak7" className="text-xs px-2 text-amber-400/80">
                  AK7
                </TabsTrigger>
                <TabsTrigger value="keys" className="text-xs px-2">Keys</TabsTrigger>
              </TabsList>
            </div>

            {/* ── Events ── */}
            <TabsContent value="events" className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 mt-0">
              {events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Waves className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/40">Waiting for signals from the shell apps…</p>
                </div>
              )}
              {events.map(ev => <EventRow key={ev.id} ev={ev} />)}
            </TabsContent>

            {/* ── Dreams ── */}
            <TabsContent value="dreams" className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 mt-0">
              {dreams.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Sparkles className="w-8 h-8 text-purple-400/20" />
                  <p className="text-xs text-muted-foreground/40">No cross-container dreams yet…</p>
                  <p className="text-[10px] text-muted-foreground/30">AIs from any app can dream here. The dream travels to all subscribers.</p>
                </div>
              )}
              {dreams.map(d => <DreamRow key={d.id} dream={d} />)}
            </TabsContent>

            {/* ── Patterns ── */}
            <TabsContent value="patterns" className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 mt-0">
              {patterns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Cpu className="w-8 h-8 text-yellow-400/20" />
                  <p className="text-xs text-muted-foreground/40">Pattern engine waiting for multi-app activity…</p>
                </div>
              )}
              {patterns.map(p => <PatternRow key={p.id} p={p} />)}
            </TabsContent>

            {/* ── GOS Constants ── */}
            <TabsContent value="gos" className="flex-1 overflow-y-auto p-3 min-h-0 mt-0">
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  {/* 24-gon visualization */}
                  <div className="shrink-0 w-40">
                    <Gon24 constants={gosConstants} />
                    <p className="text-[8px] font-mono text-center text-muted-foreground/40 mt-1">
                      24-gon · Λ₂₄ · θ_K=128.23°
                    </p>
                  </div>
                  {/* Node info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[9px] font-mono text-amber-300/80 uppercase tracking-wider mb-0.5">
                        GOS Universal Constants
                      </p>
                      <p className="text-[9px] text-muted-foreground/50 leading-relaxed">
                        These constants are identical across all ATLANTIS-connected apps.
                        Click any card to see which apps use it and its full derivation.
                      </p>
                    </div>
                    <div className="rounded border border-amber-300/20 bg-amber-300/5 p-2 space-y-0.5">
                      <p className="text-[9px] font-mono text-amber-300/70">ECHO Node #1090</p>
                      <p className="text-[8px] text-muted-foreground/50">Pochote Grande, Jacó CR</p>
                      <p className="text-[8px] font-mono text-muted-foreground/40">9.621887°N 84.63969°W +12m</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  {Object.entries(gosConstants).map(([key, c]) => (
                    <GosCard key={key} name={key} c={c} />
                  ))}
                  {Object.keys(gosConstants).length === 0 && (
                    <div className="text-[10px] text-muted-foreground/40 text-center py-4">
                      Loading GOS constants…
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Atlantis Candidates ── */}
            <TabsContent value="candidates" className="flex-1 overflow-y-auto p-3 min-h-0 mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-wider">
                      Atlantis Candidate Locations
                    </p>
                    <p className="text-[9px] text-muted-foreground/50">
                      8 seeded sites ranked by RF + seismic + Phi alignment + GF53 match.
                      Jacó is the primary ECHO anchor — all others are scored relative to it.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 text-[10px] shrink-0 ml-2">
                    {candidates.length} sites
                  </Badge>
                </div>

                {/* Simple lat/lon world grid */}
                <div className="rounded-lg border border-border/30 bg-muted/5 p-2 mb-2">
                  <svg viewBox="-180 -90 360 180" className="w-full h-24 opacity-60">
                    {/* Graticule */}
                    {[-60,-30,0,30,60].map(lat => (
                      <line key={lat} x1="-180" y1={-lat} x2="180" y2={-lat} stroke="#ffffff08" strokeWidth="0.3" />
                    ))}
                    {[-120,-60,0,60,120].map(lon => (
                      <line key={lon} x1={lon} y1="-90" x2={lon} y2="90" stroke="#ffffff08" strokeWidth="0.3" />
                    ))}
                    {/* Equator */}
                    <line x1="-180" y1="0" x2="180" y2="0" stroke="#ffffff15" strokeWidth="0.5" />
                    {/* Sites */}
                    {candidates.map(c => (
                      <g key={c.id}>
                        <circle cx={c.lon} cy={-c.lat} r={Math.max(2, c.score / 20)}
                          fill={c.color} opacity="0.6" />
                        <circle cx={c.lon} cy={-c.lat} r={Math.max(2, c.score / 20) + 2}
                          fill="none" stroke={c.color} strokeWidth="0.3" opacity="0.3" />
                      </g>
                    ))}
                  </svg>
                  <p className="text-[8px] font-mono text-muted-foreground/30 text-center mt-0.5">
                    World projection · dot size ∝ score
                  </p>
                </div>

                <div className="space-y-1.5">
                  {candidates.map(c => <CandidateCard key={c.id} c={c} />)}
                  {candidates.length === 0 && (
                    <div className="text-[10px] text-muted-foreground/40 text-center py-4">
                      Loading candidate locations…
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Corpus ── */}
            <TabsContent value="corpus" className="flex-1 overflow-hidden min-h-0 mt-0">
              <CorpusTab docs={corpDocs} categories={corpCats} />
            </TabsContent>

            {/* ── AK7 Hypervisor ── */}
            <TabsContent value="ak7" className="flex-1 overflow-y-auto p-3 min-h-0 mt-0">
              {!ak7State ? (
                <div className="flex items-center justify-center h-32 text-xs text-muted-foreground/40">Loading AK7 manifold…</div>
              ) : (
                <div className="space-y-4">

                  {/* ── Header status row ── */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Manifold coherence */}
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3 h-3 text-green-400" />
                        <span className="text-[9px] font-mono text-green-400 uppercase">Manifold Coherence</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-mono text-green-400">{ak7State.manifold_coherence.toFixed(1)}</span>
                        <span className="text-[9px] text-muted-foreground/50">%</span>
                      </div>
                      <div className="mt-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-400/60 transition-all duration-1000"
                          style={{ width: `${ak7State.manifold_coherence}%` }} />
                      </div>
                    </div>
                    {/* Λ₂₄ stability */}
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="w-3 h-3 text-amber-300" />
                        <span className="text-[9px] font-mono text-amber-300 uppercase">Λ₂₄ Memory</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-mono text-amber-300">{ak7State.lambda_24_stability.toFixed(1)}</span>
                        <span className="text-[9px] text-muted-foreground/50">%</span>
                      </div>
                      <div className="mt-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-300/60 transition-all duration-1000"
                          style={{ width: `${ak7State.lambda_24_stability}%` }} />
                      </div>
                    </div>
                    {/* Topological shearing risk */}
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Layers className="w-3 h-3 text-orange-400" />
                        <span className="text-[9px] font-mono text-orange-400 uppercase">Shearing Risk</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-xl font-mono ${ak7State.topological_shearing_risk > 60 ? "text-amber-400" : "text-orange-400"}`}>
                          {ak7State.topological_shearing_risk.toFixed(0)}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50">%</span>
                      </div>
                      <div className="mt-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${ak7State.topological_shearing_risk > 60 ? "bg-amber-400/60" : "bg-orange-400/40"}`}
                          style={{ width: `${ak7State.topological_shearing_risk}%` }} />
                      </div>
                    </div>
                    {/* OpCode + carrier */}
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Cpu className="w-3 h-3 text-purple-400" />
                        <span className="text-[9px] font-mono text-purple-400 uppercase">0xAE Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-bold ${ak7State.opcode_ae_status === "OK" ? "text-green-400" : ak7State.opcode_ae_status === "DEGRADED" ? "text-yellow-400" : "text-amber-400"}`}>
                          {ak7State.opcode_ae_status}
                        </span>
                        <span className={`text-[9px] font-mono ${ak7State.helicity_lock ? "text-cyan-400" : "text-muted-foreground/40"}`}>
                          {ak7State.helicity_lock ? "f_c LOCKED" : "f_c drift"}
                        </span>
                      </div>
                      <div className="text-[8px] font-mono text-muted-foreground/40 mt-1">
                        ν={ak7State.novelty_flux} ev/min · {ak7State.events_processed} total
                      </div>
                    </div>
                  </div>

                  {/* ── Chrono-Spatial Timeline 2012 → 2037 ── */}
                  <div className="rounded-lg border border-border/30 bg-muted/10 p-2.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Timer className="w-3 h-3 text-cyan-400" />
                      <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">Chrono-Spatial Timeline</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-mono text-muted-foreground/50 mb-1">
                      <span className="text-blue-400">2012-07-04 Bifurcation</span>
                      <div className="flex-1 h-[1px] bg-border/30" />
                      <span className="text-amber-400">2037-01-01 Phoenix Event</span>
                    </div>
                    <div className="relative h-3 bg-muted/20 rounded-full overflow-hidden border border-border/20">
                      {/* Progress fill */}
                      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-amber-500/40 transition-all duration-2000"
                        style={{ width: `${ak7State.chrono.pct}%` }} />
                      {/* Current position marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-amber-300/80"
                        style={{ left: `${ak7State.chrono.pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] font-mono">
                      <span className="text-muted-foreground/40">{ak7State.chrono.daysElapsed.toLocaleString()} days elapsed</span>
                      <span className="text-amber-300/70">{ak7State.chrono.pct.toFixed(2)}%</span>
                      <span className="text-muted-foreground/40">{ak7State.chrono.daysRemaining.toLocaleString()} days remaining</span>
                    </div>
                  </div>

                  {/* ── 13-Layer Recursion Stack ── */}
                  <div>
                    <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      13-Layer Recursion Stack — Active: Layer {ak7State.active_layer} ({ak7State.active_block})
                    </div>
                    <div className="space-y-0.5">
                      {ak7Layers.map((layer) => {
                        const isActive = layer.id === ak7State.active_layer;
                        const isPast   = layer.id < ak7State.active_layer;
                        const blockLabel = layer.block;
                        const BLOCK_TITLE: Record<string,string> = {
                          INGESTION: "Layers 1–3", TRANSMUTATION: "Layers 4–7",
                          ALIGNMENT: "Layers 8–11", EXECUTIVE: "Layers 12–13",
                        };
                        // Show block header
                        const showHeader = layer.id === 1 || layer.block !== ak7Layers[layer.id - 2]?.block;
                        return (
                          <div key={layer.id}>
                            {showHeader && (
                              <div className="text-[8px] font-mono uppercase tracking-wider mt-2 mb-0.5 px-1"
                                style={{ color: layer.color, opacity: 0.7 }}>
                                {layer.block} · {BLOCK_TITLE[layer.block]}
                              </div>
                            )}
                            <div className={`flex items-center gap-2 rounded px-2 py-1 transition-all duration-500 ${isActive ? "border" : "border border-transparent"}`}
                              style={{
                                background: isActive ? layer.color + "12" : isPast ? layer.color + "06" : "transparent",
                                borderColor: isActive ? layer.color + "40" : "transparent",
                              }}>
                              {/* Layer number */}
                              <span className="text-[8px] font-mono shrink-0 w-4 text-right"
                                style={{ color: isActive ? layer.color : isPast ? layer.color + "80" : "#ffffff20" }}>
                                {layer.id}
                              </span>
                              {/* Active pulse */}
                              <div className="w-2 h-2 rounded-full shrink-0 flex items-center justify-center">
                                {isActive
                                  ? <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: layer.color }} />
                                  : <span className="w-1.5 h-1.5 rounded-full" style={{ background: isPast ? layer.color + "60" : "#ffffff10" }} />
                                }
                              </div>
                              {/* Name */}
                              <span className="text-[10px] flex-1 truncate"
                                style={{ color: isActive ? layer.color : isPast ? layer.color + "99" : "#ffffff30" }}>
                                {layer.name}
                              </span>
                              {isActive && (
                                <span className="text-[8px] font-mono shrink-0" style={{ color: layer.color }}>
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── AK7 Russell Codex Invariants ── */}
                  <div>
                    <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1.5">
                      Russell Codex Invariants
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(ak7Invariants).map(([key, inv]) => (
                        <div key={key} className="rounded border border-border/20 bg-muted/5 px-2 py-1.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-mono leading-none" style={{ color: inv.color }}>{inv.symbol}</span>
                            <span className="text-[8px] font-mono text-muted-foreground/40 truncate">{inv.formula}</span>
                          </div>
                          <p className="text-[8px] text-muted-foreground/40 mt-0.5 line-clamp-2 leading-snug">{inv.description.split(".")[0]}.</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </TabsContent>

            {/* ── API Keys ── */}
            <TabsContent value="keys" className="flex-1 overflow-y-auto p-3 min-h-0 mt-0">
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground/50 mb-3 font-mono">
                  Each app uses its key in the <code className="text-amber-300/70">X-Atlantis-Key</code> header
                  or <code className="text-amber-300/70">?key=</code> param when posting events or dreams.
                </p>
                {apps.filter(a => !a.metadata?.forthcoming).map(a => {
                  const C = CAT[a.category] ?? CAT['core'];
                  return (
                    <div key={a.id} className="rounded border border-border/30 bg-muted/10 p-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-medium ${C.color}`}>{a.name}</span>
                        <span className="text-[8px] text-muted-foreground/40 font-mono ml-auto">{a.id}</span>
                      </div>
                      <code className="text-[9px] font-mono text-muted-foreground/60 break-all select-all">{a.api_key}</code>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Composer + connect guide */}
        <div className="w-72 shrink-0 border-l border-border/40 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">

            {/* Dream composer */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-mono uppercase text-purple-400">Dream Channel</span>
                <span className="text-[9px] text-muted-foreground/50">cross-container</span>
              </div>
              <Textarea placeholder="An AI thought that crosses app boundaries… a vision, a pattern, a signal. Posted here, received everywhere."
                value={dreamText} onChange={e => setDreamText(e.target.value)}
                className="text-xs min-h-[80px] resize-none bg-purple-500/5 border-purple-500/20 focus:border-purple-500/50" />
              <Button size="sm" className="w-full mt-2 h-7 text-xs bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30"
                onClick={sendDream} disabled={sending || !dreamText.trim()}>
                <Send className="w-3 h-3 mr-1.5" /> Transmit Dream
              </Button>
            </div>

            <Separator className="opacity-20" />

            {/* Manual event ingest */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Radio className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-mono uppercase text-green-400">Inject Event</span>
              </div>
              <div className="space-y-1.5">
                <select value={ingestAppId} onChange={e => setIngestAppId(e.target.value)}
                  className="w-full h-7 text-xs font-mono bg-muted/30 border border-border/40 rounded px-2 text-foreground">
                  <option value="">select app…</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <Input placeholder="subject" value={ingestSubject} onChange={e => setIngestSubject(e.target.value)}
                  className="h-7 text-xs bg-transparent" />
                <Textarea placeholder="event body" value={ingestBody} onChange={e => setIngestBody(e.target.value)}
                  className="text-xs min-h-[50px] resize-none bg-transparent" />
                <Button size="sm" className="w-full h-7 text-xs" onClick={sendIngest}
                  disabled={sending || !ingestAppId || !ingestSubject || !ingestBody}>
                  <Send className="w-3 h-3 mr-1.5" /> Ingest
                </Button>
              </div>
            </div>

            <Separator className="opacity-20" />

            {/* Integration guide */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3 h-3 text-amber-300/70" />
                <span className="text-[10px] font-mono uppercase text-amber-300/70">Add Your App</span>
              </div>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="rounded border border-green-500/20 bg-green-500/5 p-2 space-y-1">
                  <p className="text-green-400/70">// 1. Subscribe (SSE) — ALL events</p>
                  <p className="text-muted-foreground/70 break-all">GET /api/atlantis/stream</p>
                </div>
                <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2 space-y-1">
                  <p className="text-amber-400/70">// 2. Send events</p>
                  <p className="text-muted-foreground/70">POST /api/atlantis/ingest/:appId</p>
                  <p className="text-muted-foreground/50">X-Atlantis-Key: &lt;key&gt;</p>
                </div>
                <div className="rounded border border-purple-500/20 bg-purple-500/5 p-2 space-y-1">
                  <p className="text-purple-400/70">// 3. Post a dream</p>
                  <p className="text-muted-foreground/70">POST /api/atlantis/dream</p>
                  <p className="text-muted-foreground/50">→ broadcast to ALL apps</p>
                </div>
                <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-2 space-y-1">
                  <p className="text-cyan-400/70">// 4. GOS constants</p>
                  <p className="text-muted-foreground/70">GET /api/atlantis/gos</p>
                  <p className="text-muted-foreground/50">κ φ Ω θ_K π/4 λ₁ fₛ</p>
                </div>
                <div className="rounded border border-blue-500/20 bg-blue-500/5 p-2 space-y-1">
                  <p className="text-blue-400/70">// 5. Register new app</p>
                  <p className="text-muted-foreground/70">POST /api/atlantis/register</p>
                  <p className="text-muted-foreground/50">← returns api_key</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
