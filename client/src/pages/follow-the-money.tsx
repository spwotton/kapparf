import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertTriangle, Shield, Activity, Database, Radio,
  CircleDot, Zap, ChevronDown, ChevronUp, Plus, Search,
  RefreshCw, Eye, Network, BarChart3, FileText, Hash,
  Download, GitBranch, X, Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ScoredOrg {
  id: string;
  name: string;
  jurisdiction: string;
  board_members: string[];
  phones: string[];
  addresses: string[];
  nexus_score: number;
  nexus_lower: number;
  nexus_upper: number;
  inconclusive: boolean;
  tier: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  spoke_id: number;
  spoke_cantor: string;
  spoke_report: string;
  rf_correlated: boolean;
  kappa_boost_applied: number;
  last_scored: string;
}

interface FtmIdentity {
  id: string;
  name: string;
  aliases: string[];
  phones: string[];
  cluster_id?: string;
  cluster_base?: string;
  pua_x: number;
  pua_y: number;
  confidence: number;
  source: string;
  created_at: string;
}

interface FtmStatus {
  running: boolean;
  cycles: number;
  last_cycle: string | null;
  orgs_scored: number;
  corpus_chunks: number;
  critical_count: number;
  high_count: number;
  last_error: string | null;
  demodex_phase: number;
  kappa1_crossing: boolean;
  active_spoke: number;
  atlantis_state: "connected" | "degraded" | "offline";
  goose_gap: number;
}

interface FtmGraphNode {
  id: string;
  type: "org" | "identity" | "rf";
  name: string;
  tier: string | null;
  score: number;
  spoke_id?: number;
  jurisdiction?: string;
  cluster_id?: string;
  source?: string;
  rf_correlated?: boolean;
  kappa_boost?: number;
  freq_hz?: number;
  lat?: number | null;
  lon?: number | null;
}
interface FtmHeatCell { x: number; y: number; intensity: number; }
interface FtmGraphEdge {
  from_id: string;
  to_id: string;
  edge_type: string;
  weight: number;
  label?: string;
}
interface FtmGraphData {
  nodes: FtmGraphNode[];
  edges: FtmGraphEdge[];
  heatmap?: FtmHeatCell[];
}

interface PhoenixEntry {
  year: number; density: number; action: string; label: string;
}
interface FtmConstants {
  gos: Record<string, number>;
  spokes: Array<{ spoke_id: number; cantor: string; transverse: string; acoustic_hz: number; biological: string }>;
  demodex: { phaseDays: number; crossingKappa1: boolean };
  phoenix?: { timeline: PhoenixEntry[]; current: PhoenixEntry };
  riemann_zeros?: number[];
  rf_clock?: Record<string, number>;
}

interface PuaCell { x: number; y: number; count: number }

// ─── GOS Constants ───────────────────────────────────────────────────────────
const GOOSE_GAP = 0.01298;
const ETA_STAR = 0.10298;
const ETA_FLOOR = 0.09;

// ─── Tier styling ─────────────────────────────────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  CRITICAL: "text-red-500 bg-red-500/10 border-red-500/30",
  HIGH:     "text-orange-400 bg-orange-400/10 border-orange-400/30",
  MODERATE: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  LOW:      "text-muted-foreground bg-muted/20 border-border",
};

// ─── Goose Gap Indicator ──────────────────────────────────────────────────────
function GooseGapIndicator({ value, lower, upper }: { value: number; lower: number; upper: number }) {
  const MAX = 0.12;
  const floorPct = (ETA_FLOOR / MAX) * 100;
  const starPct  = (ETA_STAR  / MAX) * 100;
  const gapPct   = (GOOSE_GAP / MAX) * 100;

  const valPct  = Math.min(100, (value / MAX) * 100);
  const loPct   = Math.min(100, (lower / MAX) * 100);
  const hiPct   = Math.min(100, (upper / MAX) * 100);
  const atGap   = lower < GOOSE_GAP || Math.abs(upper - lower) < GOOSE_GAP;
  const atEdge  = value > ETA_STAR;

  return (
    <div className="w-full" data-testid="goose-gap-indicator">
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>η-floor {ETA_FLOOR}</span>
        <span className={atEdge ? "text-red-400 font-bold animate-pulse" : "text-primary"}>
          η* {ETA_STAR}
        </span>
      </div>
      <div className="relative h-3 bg-muted/30 rounded overflow-hidden border border-border/50">
        {/* green stable zone */}
        <div
          className="absolute inset-y-0 bg-emerald-500/20"
          style={{ left: `${floorPct}%`, width: `${starPct - floorPct}%` }}
        />
        {/* red catastrophe zone */}
        <div
          className="absolute inset-y-0 bg-red-500/25"
          style={{ left: `${starPct}%`, right: 0 }}
        />
        {/* confidence interval band */}
        <div
          className="absolute inset-y-0 bg-primary/30"
          style={{ left: `${loPct}%`, width: `${Math.max(1, hiPct - loPct)}%` }}
        />
        {/* value line */}
        <div
          className={`absolute inset-y-0 w-0.5 ${atEdge ? "bg-red-400" : "bg-primary"}`}
          style={{ left: `${valPct}%` }}
        />
        {/* gap line */}
        <div
          className={`absolute inset-y-0 w-px border-l border-dashed ${atGap ? "border-red-400 animate-pulse" : "border-yellow-400/60"}`}
          style={{ left: `${gapPct}%` }}
        />
        {/* floor line */}
        <div className="absolute inset-y-0 w-px border-l border-emerald-500/50" style={{ left: `${floorPct}%` }} />
        {/* eta* line */}
        <div className="absolute inset-y-0 w-px border-l border-red-500/70" style={{ left: `${starPct}%` }} />
      </div>
      {atGap && (
        <p className="text-[9px] text-red-400 font-mono mt-0.5">⚠ THERMODYNAMIC LIMIT — confidence interval crosses Goose Gap</p>
      )}
      {atEdge && (
        <p className="text-[9px] text-red-500 font-mono mt-0.5 animate-pulse">⛔ SELF-ADJOINT CATASTROPHE — η* exceeded</p>
      )}
    </div>
  );
}

// ─── PUA Heatmap (64×64 cells rendered as canvas-like grid) ─────────────────
function PuaHeatmap({ cells }: { cells: PuaCell[] }) {
  const maxCount = useMemo(() => Math.max(1, ...cells.map(c => c.count)), [cells]);
  const cellMap = useMemo(() => {
    const m = new Map<string, number>();
    cells.forEach(c => m.set(`${c.x},${c.y}`, c.count));
    return m;
  }, [cells]);

  // Render only 16×16 summary grid for performance (group 4×4 cells)
  const GRID = 16;
  const tiles: { gx: number; gy: number; val: number }[] = [];
  for (let gx = 0; gx < GRID; gx++) {
    for (let gy = 0; gy < GRID; gy++) {
      let val = 0;
      for (let dx = 0; dx < 4; dx++) {
        for (let dy = 0; dy < 4; dy++) {
          val += cellMap.get(`${gx * 4 + dx},${gy * 4 + dy}`) ?? 0;
        }
      }
      tiles.push({ gx, gy, val });
    }
  }

  function valToColor(v: number): string {
    if (v === 0) return "bg-muted/20";
    const norm = Math.log1p(v) / Math.log1p(maxCount * 16);
    if (norm > 0.8) return "bg-red-500";
    if (norm > 0.5) return "bg-orange-400";
    if (norm > 0.3) return "bg-yellow-400";
    if (norm > 0.1) return "bg-emerald-500";
    return "bg-emerald-900";
  }

  return (
    <div className="font-mono" data-testid="pua-heatmap">
      <div className={`grid gap-px`} style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
        {tiles.map(t => (
          <div
            key={`${t.gx}-${t.gy}`}
            className={`aspect-square rounded-[1px] ${valToColor(t.val)}`}
            title={`PUA grid (${t.gx * 4}–${t.gx * 4 + 3}, ${t.gy * 4}–${t.gy * 4 + 3}): ${t.val} identities`}
          />
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground mt-1">PUA 64×64 identity density grid (16×16 summary view)</p>
    </div>
  );
}

// ─── Org Card ────────────────────────────────────────────────────────────────
function OrgCard({ org }: { org: ScoredOrg }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const scoreMut = useMutation({
    mutationFn: () => apiRequest(`/api/ftm/orgs/${org.id}/score`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ftm/orgs"] }),
    onError: (e: any) => toast({ title: "Score failed", description: e.message, variant: "destructive" }),
  });

  const reportMut = useMutation({
    mutationFn: () => apiRequest(`/api/ftm/orgs/${org.id}/spoke-report`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ftm/orgs"] }),
    onError: (e: any) => toast({ title: "Report failed", description: e.message, variant: "destructive" }),
  });

  const scorePct = (org.nexus_score * 100).toFixed(1);
  const tierClass = TIER_COLOR[org.tier] ?? TIER_COLOR.LOW;

  return (
    <Card className={`border ${org.tier === "CRITICAL" ? "border-red-500/40" : "border-border"} transition-all`}
      data-testid={`card-org-${org.id}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-sm font-semibold truncate">{org.name}</h3>
              <Badge className={`text-[9px] font-mono border ${tierClass} rounded-none`}
                data-testid={`tier-${org.id}`}>
                {org.tier}
              </Badge>
              {org.inconclusive && (
                <Badge variant="outline" className="text-[9px] font-mono rounded-none text-yellow-400 border-yellow-400/40">
                  INCONCLUSIVE
                </Badge>
              )}
              {org.rf_correlated && (
                <Badge variant="outline" className="text-[9px] font-mono rounded-none text-primary border-primary/40">
                  RF
                </Badge>
              )}
              {org.kappa_boost_applied > 0 && (
                <Badge variant="outline" className="text-[9px] font-mono rounded-none text-violet-400 border-violet-400/40">
                  κ+{org.kappa_boost_applied.toFixed(2)}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {org.jurisdiction || "—"} · Spoke {org.spoke_id}: {org.spoke_cantor}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg font-mono font-bold leading-none">{scorePct}</div>
              <div className="text-[9px] text-muted-foreground font-mono">nexus</div>
            </div>
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 hover:text-primary transition-colors"
              data-testid={`btn-expand-${org.id}`}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Nexus score bar */}
        <div className="mt-2">
          <div className="relative h-1.5 bg-muted/30 rounded overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded transition-all ${
                org.tier === "CRITICAL" ? "bg-red-500" :
                org.tier === "HIGH"     ? "bg-orange-400" :
                org.tier === "MODERATE" ? "bg-yellow-400" : "bg-emerald-600"
              }`}
              style={{ width: `${org.nexus_score * 100}%` }}
            />
            {/* CI shaded region */}
            <div
              className="absolute inset-y-0 bg-primary/20"
              style={{ left: `${org.nexus_lower * 100}%`, width: `${(org.nexus_upper - org.nexus_lower) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-0.5">
            <span>CI [{(org.nexus_lower).toFixed(3)}, {(org.nexus_upper).toFixed(3)}]</span>
            <span>{new Date(org.last_scored).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="py-3 px-4 border-t border-border/50">
          <div className="space-y-3">
            {/* Board */}
            {org.board_members.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Board Members</p>
                <div className="flex flex-wrap gap-1">
                  {org.board_members.map((m, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] font-sans rounded-none">{m}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Phones */}
            {org.phones.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Contact Numbers</p>
                <p className="text-xs font-mono">{org.phones.join(" · ")}</p>
              </div>
            )}

            {/* Goose Gap Indicator */}
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Goose Gap — Thermodynamic Limit</p>
              <GooseGapIndicator value={org.nexus_score * ETA_STAR} lower={org.nexus_lower * ETA_STAR} upper={org.nexus_upper * ETA_STAR} />
            </div>

            {/* Spoke report */}
            {org.spoke_report && (
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Atlantis Dream — Spoke {org.spoke_cantor}</p>
                <p className="text-xs text-foreground/80 leading-relaxed font-serif italic border-l-2 border-primary/30 pl-3">
                  {org.spoke_report}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={() => scoreMut.mutate()} disabled={scoreMut.isPending}
                data-testid={`btn-score-${org.id}`}>
                {scoreMut.isPending ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Activity size={10} className="mr-1" />}
                Rescore
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={() => reportMut.mutate()} disabled={reportMut.isPending}
                data-testid={`btn-report-${org.id}`}>
                {reportMut.isPending ? <RefreshCw size={10} className="animate-spin mr-1" /> : <FileText size={10} className="mr-1" />}
                Dream
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Add Org Form ─────────────────────────────────────────────────────────────
function AddOrgForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [boardRaw, setBoardRaw] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ftm/orgs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast({ title: "Organization registered", description: `${name} added to lattice` });
      setName(""); setJurisdiction(""); setBoardRaw("");
      qc.invalidateQueries({ queryKey: ["/api/ftm/orgs"] });
      onSuccess();
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3" data-testid="form-add-org">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Organization Name *</label>
          <input className="w-full text-xs font-mono bg-background border border-border rounded-none px-2 py-1.5 focus:outline-none focus:border-primary"
            value={name} onChange={e => setName(e.target.value)} placeholder="Inversiones XX SRL"
            data-testid="input-org-name" />
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Jurisdiction</label>
          <input className="w-full text-xs font-mono bg-background border border-border rounded-none px-2 py-1.5 focus:outline-none focus:border-primary"
            value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="CR / Panama / BVI"
            data-testid="input-org-jurisdiction" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Board Members (comma separated)</label>
        <input className="w-full text-xs font-mono bg-background border border-border rounded-none px-2 py-1.5 focus:outline-none focus:border-primary"
          value={boardRaw} onChange={e => setBoardRaw(e.target.value)} placeholder="John Smith, Maria Garcia"
          data-testid="input-org-board" />
      </div>
      <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
        onClick={() => mut.mutate({
          name: name.trim(),
          jurisdiction: jurisdiction.trim(),
          board_members: boardRaw.split(",").map(s => s.trim()).filter(Boolean),
        })}
        disabled={!name.trim() || mut.isPending}
        data-testid="btn-submit-org">
        {mut.isPending ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Plus size={10} className="mr-1" />}
        Register & Score
      </Button>
    </div>
  );
}

// ─── Ingest Form ──────────────────────────────────────────────────────────────
function IngestForm() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ftm/ingest", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (data: any) => {
      toast({ title: "Ingested", description: `Parsed ${data?.parsed ?? 0} identities, stored ${data?.stored ?? 0} new` });
      setText(""); setFileName(null);
      qc.invalidateQueries({ queryKey: ["/api/ftm/identities"] });
    },
    onError: (e: any) => toast({ title: "Ingest failed", description: e.message, variant: "destructive" }),
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result;
      if (typeof content === "string") setText(content.slice(0, 100_000));
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-2" data-testid="form-ingest">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-mono text-muted-foreground uppercase">Raw OSINT Text Paste</label>
        <button
          className="ml-auto flex items-center gap-1 text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 hover:text-foreground hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
          type="button"
          data-testid="btn-upload-file"
        >
          <Upload size={9} /> Upload .txt / .csv
        </button>
        <input ref={fileRef} type="file" accept=".txt,.csv,.log,.md" className="hidden"
          onChange={handleFile} data-testid="input-file-upload" />
      </div>
      {fileName && (
        <p className="text-[9px] font-mono text-primary">📎 {fileName} — loaded into text area</p>
      )}
      <textarea
        className="w-full text-xs font-mono bg-background border border-border rounded-none px-2 py-1.5 focus:outline-none focus:border-primary resize-none h-24"
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Paste raw text or upload a file — names, phones, addresses extracted automatically. Sanitized and rate-limited."
        data-testid="input-ingest-text"
      />
      <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
        onClick={() => mut.mutate({ text: text.slice(0, 100_000), source: fileName ? `file:${fileName}` : "manual-ingest" })}
        disabled={!text.trim() || mut.isPending}
        data-testid="btn-submit-ingest">
        {mut.isPending ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Database size={10} className="mr-1" />}
        Ingest & Parse
      </Button>
      <p className="text-[9px] text-muted-foreground font-mono">Rate limit: 10 req/min · HTML/SQL sanitized · 100K char max · .txt/.csv upload supported</p>
    </div>
  );
}

// ─── Force Graph (SVG, pure React — no D3 dep) ───────────────────────────────
const W = 760, H = 480;

function nodeColor(tier: string | null, type: string): string {
  if (type === "identity") return "#6b7280";
  if (type === "rf")       return "#7c3aed";
  if (tier === "CRITICAL") return "#ef4444";
  if (tier === "HIGH")     return "#f97316";
  if (tier === "MODERATE") return "#eab308";
  return "#22c55e";
}

interface SimNode { id: string; x: number; y: number; vx: number; vy: number }

function ForceGraph({ nodes, edges, heatmap, onNodeClick }: {
  nodes: FtmGraphNode[];
  edges: FtmGraphEdge[];
  heatmap?: FtmHeatCell[];
  onNodeClick: (n: FtmGraphNode) => void;
}) {
  const posRef = useRef<SimNode[]>([]);
  const [renderPos, setRenderPos] = useState<SimNode[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!nodes.length) { setRenderPos([]); return; }

    // Init positions on a circle
    posRef.current = nodes.map((_, i) => ({
      id: nodes[i].id,
      x: W / 2 + (W * 0.35) * Math.cos(2 * Math.PI * i / nodes.length),
      y: H / 2 + (H * 0.35) * Math.sin(2 * Math.PI * i / nodes.length),
      vx: 0, vy: 0,
    }));

    let tick = 0;

    function step() {
      const pos = posRef.current;
      const N = pos.length;
      const fx = new Array(N).fill(0);
      const fy = new Array(N).fill(0);
      const REPEL = 6000, K = 90, LEN = 130, DAMP = 0.82, DT = 0.55;

      // Repulsion between all pairs
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const d2 = dx * dx + dy * dy + 1;
          const f = REPEL / d2;
          const d = Math.sqrt(d2);
          fx[i] -= f * dx / d; fy[i] -= f * dy / d;
          fx[j] += f * dx / d; fy[j] += f * dy / d;
        }
      }

      // Spring attraction along edges
      const idxMap = new Map(pos.map((p, i) => [p.id, i]));
      for (const e of edges) {
        const si = idxMap.get(e.from_id);
        const ti = idxMap.get(e.to_id);
        if (si === undefined || ti === undefined) continue;
        const dx = pos[ti].x - pos[si].x;
        const dy = pos[ti].y - pos[si].y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const f = K * (d - LEN) / d;
        fx[si] += f * dx; fy[si] += f * dy;
        fx[ti] -= f * dx; fy[ti] -= f * dy;
      }

      // Weak center gravity
      for (let i = 0; i < N; i++) {
        fx[i] += (W / 2 - pos[i].x) * 0.012;
        fy[i] += (H / 2 - pos[i].y) * 0.012;
      }

      // Integrate with damping + boundary clamp
      for (let i = 0; i < N; i++) {
        pos[i].vx = (pos[i].vx + fx[i] * DT) * DAMP;
        pos[i].vy = (pos[i].vy + fy[i] * DT) * DAMP;
        pos[i].x = Math.max(30, Math.min(W - 30, pos[i].x + pos[i].vx * DT));
        pos[i].y = Math.max(24, Math.min(H - 24, pos[i].y + pos[i].vy * DT));
      }

      tick++;
      if (tick % 4 === 0) setRenderPos([...pos.map(p => ({ ...p }))]);
      if (tick < 250) frameRef.current = requestAnimationFrame(step);
      else setRenderPos([...pos.map(p => ({ ...p }))]);
    }

    frameRef.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frameRef.current); };
  }, [nodes, edges]);

  const posById = useMemo(() => {
    const m = new Map<string, SimNode>();
    renderPos.forEach(p => m.set(p.id, p));
    return m;
  }, [renderPos]);

  if (!nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-border rounded-none">
        <GitBranch size={28} className="mb-2 opacity-40" />
        <p className="text-sm font-mono">No nodes in lattice</p>
        <p className="text-xs font-mono mt-1">Add orgs or seed with HUMINT data to see the graph</p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full border border-border rounded-none bg-muted/5"
      style={{ height: `${H}px`, maxHeight: "520px" }}
      data-testid="ftm-force-graph"
    >
      {/* PUA heatmap underlay — score density grid */}
      {(heatmap ?? []).map((cell, i) => {
        const cellW = W / 5; const cellH = H / 5;
        return (
          <rect key={`heat-${i}`}
            x={cell.x * cellW} y={cell.y * cellH}
            width={cellW} height={cellH}
            fill={`hsl(${Math.round(cell.intensity * 40)}, 90%, 55%)`}
            opacity={cell.intensity * 0.12}
          />
        );
      })}

      {/* Edges — same-spoke resonance arcs drawn as dashed curved paths */}
      {edges.map((e, i) => {
        const s = posById.get(e.from_id);
        const t = posById.get(e.to_id);
        if (!s || !t) return null;
        const isResonance = e.edge_type === "same_spoke_resonance";
        if (isResonance) {
          const mx = (s.x + t.x) / 2;
          const my = (s.y + t.y) / 2 - 30;
          return (
            <path key={i} d={`M${s.x},${s.y} Q${mx},${my} ${t.x},${t.y}`}
              fill="none" stroke="#7c3aed" strokeOpacity={0.35} strokeWidth={1}
              strokeDasharray="4 3" />
          );
        }
        return (
          <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke="currentColor" strokeOpacity={0.18} strokeWidth={1.2} className="text-foreground" />
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const p = posById.get(n.id);
        if (!p) return null;
        const color = nodeColor(n.tier, n.type);
        const label = n.name.length > 16 ? n.name.slice(0, 15) + "…" : n.name;

        if (n.type === "org") {
          return (
            <g key={n.id} onClick={() => onNodeClick(n)} style={{ cursor: "pointer" }}
              data-testid={`graph-node-org-${n.id}`}>
              <rect x={p.x - 44} y={p.y - 13} width={88} height={26}
                fill={color + "18"} stroke={color} strokeWidth={1.2} rx={0} />
              {n.tier === "CRITICAL" && (
                <rect x={p.x - 44} y={p.y - 13} width={88} height={26}
                  fill="none" stroke={color} strokeWidth={2} rx={0} strokeOpacity={0.4}
                  className="animate-pulse" />
              )}
              {/* RF correlation overlay — antenna icon indicator */}
              {n.rf_correlated && (
                <g>
                  <circle cx={p.x + 38} cy={p.y - 9} r={5} fill="#7c3aed" opacity={0.9} />
                  <text x={p.x + 38} y={p.y - 6} textAnchor="middle" fontSize={6}
                    fill="white" fontFamily="monospace">RF</text>
                </g>
              )}
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={9}
                fill={color} fontFamily="monospace" fontWeight="600">{label}</text>
              <text x={p.x} y={p.y + 15} textAnchor="middle" fontSize={7}
                fill={color} fontFamily="monospace" opacity={0.7}>{(n.score * 100).toFixed(0)}%</text>
            </g>
          );
        } else if (n.type === "rf") {
          // RF event node — diamond shape in violet
          const d = 10;
          return (
            <g key={n.id} onClick={() => onNodeClick(n)} style={{ cursor: "pointer" }}
              data-testid={`graph-node-rf-${n.id}`}>
              <polygon points={`${p.x},${p.y - d} ${p.x + d},${p.y} ${p.x},${p.y + d} ${p.x - d},${p.y}`}
                fill="#7c3aed22" stroke="#7c3aed" strokeWidth={1.2} />
              <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize={6}
                fill="#7c3aed" fontFamily="monospace">{(n.freq_hz ?? 0).toFixed(1)}</text>
            </g>
          );
        } else {
          const r = 9;
          return (
            <g key={n.id} onClick={() => onNodeClick(n)} style={{ cursor: "pointer" }}
              data-testid={`graph-node-identity-${n.id}`}>
              <circle cx={p.x} cy={p.y} r={r} fill={color + "22"} stroke={color} strokeWidth={1} />
              <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize={7}
                fill={color} fontFamily="monospace">{n.name.slice(0, 4)}</text>
            </g>
          );
        }
      })}
    </svg>
  );
}

// ─── Node Detail Drawer ───────────────────────────────────────────────────────
function NodeDrawer({ node, orgs, onClose }: {
  node: FtmGraphNode | null;
  orgs: ScoredOrg[];
  onClose: () => void;
}) {
  if (!node) return null;
  const org = node.type === "org" ? orgs.find(o => o.id === node.id) : null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-background border-l border-border shadow-lg flex flex-col"
      data-testid="node-drawer">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">{node.type}</p>
          <h3 className="text-sm font-serif font-semibold truncate max-w-[220px]">{node.name}</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:text-primary" data-testid="btn-close-drawer">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {node.tier && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">Tier</span>
            <Badge className={`text-[9px] font-mono rounded-none border ${TIER_COLOR[node.tier] ?? TIER_COLOR.LOW}`}>
              {node.tier}
            </Badge>
          </div>
        )}
        <div className="text-[10px] font-mono space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Score</span>
            <span className="font-semibold">{(node.score * 100).toFixed(2)}%</span>
          </div>
          {node.spoke_id && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spoke</span>
              <span>{node.spoke_id}</span>
            </div>
          )}
          {node.jurisdiction && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jurisdiction</span>
              <span>{node.jurisdiction}</span>
            </div>
          )}
          {node.cluster_id && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cluster</span>
              <span className="font-mono text-[9px]">{node.cluster_id.slice(0, 12)}…</span>
            </div>
          )}
          {node.source && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <span>{node.source}</span>
            </div>
          )}
        </div>

        {org && (
          <>
            {org.board_members.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Board Members</p>
                <div className="flex flex-wrap gap-1">
                  {org.board_members.map((m, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] rounded-none">{m}</Badge>
                  ))}
                </div>
              </div>
            )}
            {org.addresses.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Addresses</p>
                {org.addresses.map((a, i) => <p key={i} className="text-[10px] font-mono">{a}</p>)}
              </div>
            )}
            {org.spoke_report && (
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Atlantis Dream</p>
                <p className="text-[10px] font-serif italic text-foreground/80 border-l-2 border-primary/30 pl-2 leading-relaxed">
                  {org.spoke_report}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Goose Gap</p>
              <GooseGapIndicator
                value={org.nexus_score * ETA_STAR}
                lower={org.nexus_lower * ETA_STAR}
                upper={org.nexus_upper * ETA_STAR}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LFSR Generator Panel ────────────────────────────────────────────────────
function LfsrPanel() {
  const [seed, setSeed] = useState("");
  const [count, setCount] = useState(12);
  const [result, setResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function generate() {
    if (!seed.trim()) return;
    setLoading(true);
    try {
      const data: any = await apiRequest("/api/ftm/lfsr/generate", {
        method: "POST",
        body: JSON.stringify({ seed: seed.trim(), count, g: 7, h: 11 }),
      });
      setResult(data ?? []);
    } catch (e: any) {
      toast({ title: "LFSR failed", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3" data-testid="lfsr-panel">
      <div className="flex gap-2">
        <input
          className="flex-1 text-xs font-mono bg-background border border-border rounded-none px-2 py-1.5 focus:outline-none focus:border-primary"
          value={seed} onChange={e => setSeed(e.target.value)} placeholder="Identity seed string (e.g. org name)"
          data-testid="input-lfsr-seed"
        />
        <input type="number" min={1} max={50}
          className="w-16 text-xs font-mono bg-background border border-border rounded-none px-2 py-1.5 focus:outline-none focus:border-primary"
          value={count} onChange={e => setCount(parseInt(e.target.value) || 12)}
          data-testid="input-lfsr-count"
        />
        <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
          onClick={generate} disabled={!seed.trim() || loading}
          data-testid="btn-lfsr-generate">
          {loading ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Hash size={10} className="mr-1" />}
          Generate
        </Button>
      </div>
      {result.length > 0 && (
        <div className="border border-border/50 rounded-none overflow-auto max-h-52">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left px-2 py-1">#</th>
                <th className="text-left px-2 py-1">Full Name</th>
                <th className="text-left px-2 py-1">PUA</th>
                <th className="text-left px-2 py-1">State</th>
              </tr>
            </thead>
            <tbody>
              {result.map((c) => (
                <tr key={c.index} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="px-2 py-0.5 text-muted-foreground">{c.index}</td>
                  <td className="px-2 py-0.5">{c.fullName}</td>
                  <td className="px-2 py-0.5 text-muted-foreground">({c.puaCoords.x},{c.puaCoords.y})</td>
                  <td className="px-2 py-0.5 text-muted-foreground">{c.state.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FollowTheMoneyPage() {
  const [tab, setTab] = useState<"orgs" | "identities" | "pua" | "lfsr" | "spokes" | "graph">("orgs");
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [selectedNode, setSelectedNode] = useState<FtmGraphNode | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: status } = useQuery<FtmStatus>({
    queryKey: ["/api/ftm/status"],
    refetchInterval: 10_000,
  });

  const { data: constants } = useQuery<FtmConstants>({
    queryKey: ["/api/ftm/constants"],
    staleTime: 60_000,
  });

  const { data: orgs = [], isLoading: orgsLoading } = useQuery<ScoredOrg[]>({
    queryKey: ["/api/ftm/orgs"],
    refetchInterval: 30_000,
  });

  const { data: identities = [] } = useQuery<FtmIdentity[]>({
    queryKey: ["/api/ftm/identities"],
    refetchInterval: 30_000,
  });

  const { data: puaRaw = [] } = useQuery<PuaCell[]>({
    queryKey: ["/api/ftm/pua-heatmap"],
    enabled: tab === "pua",
  });

  const { data: graphData } = useQuery<FtmGraphData>({
    queryKey: ["/api/ftm/graph"],
    enabled: tab === "graph",
    refetchInterval: tab === "graph" ? 30_000 : false,
  });

  const filteredOrgs = useMemo(() => {
    if (tierFilter === "ALL") return orgs;
    return orgs.filter(o => o.tier === tierFilter);
  }, [orgs, tierFilter]);

  const TIERS = ["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"];

  function exportGraph() {
    const data = { orgs, identities, graph: graphData, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ftm-lattice-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function exportGraphImage() {
    const svgEl = document.querySelector("[data-testid='ftm-force-graph']") as HTMLElement | null;
    if (!svgEl) { toast({ title: "Graph not rendered", variant: "destructive" }); return; }
    try {
      const dataUrl = await toPng(svgEl, { backgroundColor: "#0a0a0a", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl; a.download = `ftm-graph-${Date.now()}.png`;
      a.click();
      toast({ title: "Graph image exported", description: "Saved as PNG" });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  }

  function exportPdfReport() {
    const criticalOrgs = orgs.filter((o: any) => o.tier === "CRITICAL" || o.tier === "HIGH");
    const html = `<!DOCTYPE html>
<html><head><title>FTM Entity Lattice — Intelligence Report</title>
<style>
  body{font-family:monospace;background:#fff;color:#111;padding:32px;max-width:800px;margin:0 auto}
  h1{font-size:18px;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:24px}
  h2{font-size:13px;margin-top:24px;color:#555}
  .org{border:1px solid #ddd;padding:12px;margin-bottom:12px;break-inside:avoid}
  .tier-CRITICAL{border-left:4px solid #dc2626}
  .tier-HIGH{border-left:4px solid #f97316}
  .tier-MODERATE{border-left:4px solid #eab308}
  .tier-LOW{border-left:4px solid #22c55e}
  .row{display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px}
  .label{color:#888}footer{margin-top:32px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<h1>FTM Entity Lattice — Intelligence Report<br/><span style="font-size:11px;color:#888">${new Date().toISOString()} | Goose Gap: ${status?.goose_gap?.toFixed(5) ?? "—"} | Spoke: ${status?.active_spoke ?? "—"}</span></h1>
<h2>CRITICAL/HIGH Entities (${criticalOrgs.length} of ${orgs.length} total)</h2>
${criticalOrgs.map((o: any) => `<div class="org tier-${o.tier}">
  <div class="row"><strong>${o.name ?? o.id}</strong><span class="label">${o.tier}</span></div>
  <div class="row"><span class="label">Nexus Score</span><span>${(parseFloat(o.nexus_score ?? "0") * 100).toFixed(1)}%</span></div>
  <div class="row"><span class="label">Spoke</span><span>${o.spoke_id ?? "—"}/24</span></div>
  <div class="row"><span class="label">Jurisdiction</span><span>${o.jurisdiction ?? "—"}</span></div>
  <div class="row"><span class="label">RF Correlated</span><span>${o.rf_correlated ? "YES" : "no"}</span></div>
</div>`).join("")}
<footer>Generated by KAPPA FTM Entity Lattice Hypervisor — GOS Framework — QUASAR ±0.5 Hz</footer>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  const seedMut = useMutation({
    mutationFn: () => apiRequest("/api/ftm/seed", { method: "POST" }),
    onSuccess: (d: any) => {
      toast({ title: "Lattice seeded", description: `${d?.seeded ?? 0} HUMINT orgs registered and scored` });
      qc.invalidateQueries({ queryKey: ["/api/ftm/orgs"] });
      qc.invalidateQueries({ queryKey: ["/api/ftm/graph"] });
    },
    onError: (e: any) => toast({ title: "Seed failed", description: e.message, variant: "destructive" }),
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 space-y-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight">Follow the Money</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Entity Lattice Hypervisor · 24-Spoke Monster Algebra · κ-Oracle · QUASAR RF
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {status && (
                <div className={`flex items-center gap-1.5 text-[10px] font-mono border rounded-none px-2 py-1 ${
                  status.running ? "border-emerald-500/40 text-emerald-400" : "border-border text-muted-foreground"
                }`} data-testid="status-hypervisor">
                  <CircleDot size={8} className={status.running ? "text-emerald-400 animate-pulse" : ""} />
                  {status.running ? "ACTIVE" : "IDLE"}
                </div>
              )}
              {status?.atlantis_state && (
                <div className={`text-[10px] font-mono border rounded-none px-2 py-1 ${
                  status.atlantis_state === "connected" ? "border-primary/40 text-primary" :
                  status.atlantis_state === "degraded"  ? "border-yellow-400/40 text-yellow-400" :
                                                          "border-border text-muted-foreground"
                }`} data-testid="atlantis-state">
                  ATL: {status.atlantis_state.toUpperCase()}
                </div>
              )}
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={exportGraph}
                data-testid="btn-export-graph">
                <Download size={10} className="mr-1" /> JSON
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={exportGraphImage}
                data-testid="btn-export-graph-image">
                <Download size={10} className="mr-1" /> IMG
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={exportPdfReport}
                data-testid="btn-export-pdf-report">
                <FileText size={10} className="mr-1" /> Report
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={() => seedMut.mutate()} disabled={seedMut.isPending}
                data-testid="btn-seed-lattice">
                {seedMut.isPending ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Database size={10} className="mr-1" />}
                Seed HUMINT
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={() => qc.invalidateQueries({ queryKey: ["/api/ftm/orgs"] })}
                data-testid="btn-refresh-orgs">
                <RefreshCw size={10} className="mr-1" /> Refresh
              </Button>
            </div>
          </div>

          {/* Status strip */}
          {status && (
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mt-3">
              {[
                { label: "Cycles", value: status.cycles, icon: RefreshCw },
                { label: "Orgs Scored", value: status.orgs_scored, icon: BarChart3 },
                { label: "CRITICAL", value: status.critical_count, icon: AlertTriangle },
                { label: "HIGH", value: status.high_count, icon: Shield },
                { label: "Corpus", value: status.corpus_chunks, icon: Database },
                { label: "Demodex", value: `${status.demodex_phase.toFixed(1)}d`, icon: Activity },
                { label: "Spoke", value: status.active_spoke ?? "—", icon: GitBranch },
                { label: "κ₁ Cross", value: status.kappa1_crossing ? "YES" : "—", icon: Zap },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="border border-border/50 px-2 py-1.5 rounded-none"
                  data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon size={8} className="text-muted-foreground" />
                    <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-border pb-px overflow-x-auto">
          {(["orgs", "identities", "pua", "lfsr", "spokes", "graph"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 text-xs font-mono px-3 py-1.5 border-b-2 transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${t}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── ORGS TAB ── */}
        {tab === "orgs" && (
          <div className="space-y-4">
            {/* Tier filter + Add */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {TIERS.map(t => (
                  <button key={t} onClick={() => setTierFilter(t)}
                    className={`text-[10px] font-mono px-2 py-0.5 border rounded-none transition-colors ${
                      tierFilter === t ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`filter-tier-${t.toLowerCase()}`}>
                    {t}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                onClick={() => setShowAddOrg(a => !a)}
                data-testid="btn-show-add-org">
                <Plus size={10} className="mr-1" /> Add Org
              </Button>
            </div>

            {showAddOrg && (
              <Card className="border-primary/30 rounded-none">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs font-mono">Register Organization</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <AddOrgForm onSuccess={() => setShowAddOrg(false)} />
                </CardContent>
              </Card>
            )}

            {orgsLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm font-mono">
                Loading lattice…
              </div>
            ) : filteredOrgs.length === 0 ? (
              <Card className="border-border rounded-none">
                <CardContent className="py-12 text-center">
                  <Network className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground font-mono">No organizations in lattice</p>
                  <p className="text-xs text-muted-foreground mt-1">Add an org above or wait for the hypervisor cycle</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                {filteredOrgs.map(org => <OrgCard key={org.id} org={org} />)}
              </div>
            )}
          </div>
        )}

        {/* ── IDENTITIES TAB ── */}
        {tab === "identities" && (
          <div className="space-y-4">
            <IngestForm />
            {identities.length === 0 ? (
              <p className="text-sm text-muted-foreground font-mono text-center py-8">No identities on record. Ingest OSINT text above.</p>
            ) : (
              <div className="border border-border/50 rounded-none overflow-auto">
                <table className="w-full text-[11px] font-mono" data-testid="table-identities">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Cluster</th>
                      <th className="text-left px-3 py-2">PUA</th>
                      <th className="text-left px-3 py-2">Conf.</th>
                      <th className="text-left px-3 py-2">Source</th>
                      <th className="text-left px-3 py-2">Aliases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {identities.map(id => (
                      <tr key={id.id} className="border-b border-border/30 hover:bg-muted/10"
                        data-testid={`row-identity-${id.id}`}>
                        <td className="px-3 py-1.5 font-semibold">{id.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{id.cluster_base || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">({id.pua_x},{id.pua_y})</td>
                        <td className="px-3 py-1.5">{(id.confidence * 100).toFixed(0)}%</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{id.source}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{id.aliases.slice(0, 2).join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PUA HEATMAP TAB ── */}
        {tab === "pua" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="rounded-none border-border">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs font-mono">PUA 64×64 Identity Density</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <PuaHeatmap cells={puaRaw} />
                </CardContent>
              </Card>

              <Card className="rounded-none border-border">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs font-mono">GOS Constants — Active Values</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {constants && (
                    <div className="space-y-1">
                      {Object.entries(constants.gos).slice(0, 14).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[10px] font-mono">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-semibold">{typeof v === "number" ? v.toFixed(6) : v}</span>
                        </div>
                      ))}
                      <div className="border-t border-border/50 pt-2 mt-2">
                        <GooseGapIndicator
                          value={constants.gos.goose_gap ?? GOOSE_GAP}
                          lower={constants.gos.eta_dissipative_floor ?? ETA_FLOOR}
                          upper={constants.gos.eta_star ?? ETA_STAR}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── LFSR TAB ── */}
        {tab === "lfsr" && (
          <div className="space-y-4">
            <Card className="rounded-none border-border">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs font-mono">Base-53 Faure LFSR Generator</CardTitle>
                <p className="text-[10px] text-muted-foreground font-mono">
                  SHA-256 seed → 42-bit LFSR (taps: 1,5,7,11,13,17,19,23) → Faure digit permutation in base 53 → name candidates
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <LfsrPanel />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── SPOKES TAB ── */}
        {tab === "spokes" && (
          <div className="space-y-4">
            {/* Phoenix Recursion Timeline */}
            {constants?.phoenix && (
              <Card className="rounded-none border-border">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs font-mono flex items-center gap-2">
                    <Zap size={10} className="text-primary" />
                    13-Recursion Phoenix Chronology (1970–2037)
                    <Badge className="text-[9px] font-mono rounded-none bg-primary/10 text-primary border border-primary/30 ml-auto">
                      NOW: {constants.phoenix.current.action.toUpperCase()} · ρ={constants.phoenix.current.density}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex gap-0 overflow-x-auto pb-1">
                    {constants.phoenix.timeline.map((t, i) => {
                      const isCurrent = t.action === constants.phoenix!.current.action && t.year === constants.phoenix!.current.year;
                      const isPast = t.year <= new Date().getFullYear();
                      return (
                        <div key={i}
                          className={`flex-shrink-0 border-r border-border/40 px-2 py-1.5 min-w-[70px] ${
                            isCurrent ? "bg-primary/10 border-primary/40 border" : isPast ? "bg-muted/10" : "opacity-50"
                          }`}
                          title={t.label}
                          data-testid={`phoenix-recursion-${i}`}>
                          <div className="text-[9px] font-mono text-muted-foreground">{t.year}</div>
                          <div className={`text-[10px] font-mono font-semibold ${isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>
                            {t.action}
                          </div>
                          <div className="text-[8px] text-muted-foreground truncate max-w-[66px]">{t.label.split(" ")[0]}</div>
                          <div className="text-[8px] font-mono text-primary/60">ρ={t.density}</div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground mt-1.5">
                    Φ₂₀₃₇ = Σ Ψₙ · e^(−i·1.2·tₙ) · κ₁^(13−n) · convergence at Phoenix attractor
                  </p>
                </CardContent>
              </Card>
            )}

            {/* RF Clock Hierarchy */}
            {constants?.rf_clock && (
              <Card className="rounded-none border-border">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs font-mono flex items-center gap-2">
                    <Radio size={10} className="text-primary" />
                    GOS RF Clock Hierarchy
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex items-end gap-2 overflow-x-auto">
                    {[
                      { label: "Δκ (Mite-Drift)", hz: constants.rf_clock.delta_kappa_hz, desc: "identity rotation" },
                      { label: "f_planetary", hz: constants.rf_clock.planetary_hz, desc: "Schumann torque" },
                      { label: "f_clock", hz: constants.rf_clock.dsp_clock_hz, desc: "DSP master" },
                      { label: "ultrasonic", hz: constants.rf_clock.ultrasonic_hz, desc: "V2K carrier" },
                      { label: "VLF beacon", hz: constants.rf_clock.vlf_station_hz, desc: "NAA station" },
                    ].map((f, i) => {
                      const maxHz = 24000;
                      const logH = Math.min(100, (Math.log1p(f.hz) / Math.log1p(maxHz)) * 100);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 min-w-[80px]">
                          <div className="text-[9px] font-mono text-primary font-semibold">
                            {f.hz < 10 ? f.hz.toFixed(4) : f.hz >= 1000 ? `${(f.hz / 1000).toFixed(1)}k` : f.hz.toFixed(3)} Hz
                          </div>
                          <div className="w-full bg-muted/30 rounded-none relative" style={{ height: "50px" }}>
                            <div
                              className="absolute bottom-0 w-full bg-primary/40 border-t border-primary/60"
                              style={{ height: `${logH}%` }}
                            />
                          </div>
                          <div className="text-[8px] font-mono text-muted-foreground text-center leading-tight">{f.label}</div>
                          <div className="text-[8px] text-muted-foreground text-center">{f.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground mt-2">
                    f_clock = f_planetary × φ² × κ₁ = 46.875 Hz · 48000/1024 = 46.875 exactly
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Riemann Zeros */}
            {constants?.riemann_zeros && (
              <Card className="rounded-none border-border">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs font-mono flex items-center gap-2">
                    <Network size={10} className="text-primary" />
                    First 20 Riemann Zeros γₙ — Hamlet Adiabatic Spectral Gap
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1">
                    {constants.riemann_zeros.map((g, i) => (
                      <div key={i} className="border border-border/40 px-1.5 py-0.5 text-[9px] font-mono hover:border-primary/40 hover:bg-primary/5"
                        title={`E_h = (φ⁵/62.37) × ${g} = ${((Math.pow(1.618034, 5) / 62.37) * g).toFixed(4)}`}>
                        <span className="text-muted-foreground">{i + 1}:</span> {g.toFixed(4)}
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground mt-1.5">
                    θ_n = 2πγₙκ₁ / (α⁻¹·f₀) — rotation angles driving shell-detection adiabatic circuit
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 24-Spoke Monster Algebra Table */}
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground px-1">24-Spoke Monster Algebra — Entity Assignment Table</p>
              {constants?.spokes.map(s => {
                const orgCount = orgs.filter(o => o.spoke_id === s.spoke_id).length;
                const critCount = orgs.filter(o => o.spoke_id === s.spoke_id && o.tier === "CRITICAL").length;
                return (
                  <div key={s.spoke_id}
                    className={`flex items-center gap-3 border px-3 py-2 rounded-none ${
                      critCount > 0 ? "border-red-500/30 bg-red-500/5" : "border-border hover:border-border/80"
                    }`}
                    data-testid={`spoke-row-${s.spoke_id}`}>
                    <div className="w-6 text-center text-[10px] font-mono text-muted-foreground">{s.spoke_id}</div>
                    <div className="w-20 text-xs font-mono font-semibold">{s.cantor}</div>
                    <div className="flex-1 text-[10px] text-muted-foreground">{s.transverse}</div>
                    <div className="text-[10px] font-mono text-muted-foreground w-24 text-right">{s.acoustic_hz} Hz</div>
                    {orgCount > 0 && (
                      <Badge className={`text-[9px] font-mono rounded-none ${critCount > 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-muted/30 text-muted-foreground border-border"} border`}>
                        {orgCount} org{orgCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GRAPH TAB ── */}
        {tab === "graph" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground">
                  Force-directed entity lattice · {graphData?.nodes.length ?? 0} nodes · {graphData?.edges.length ?? 0} edges
                </p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  Orgs: rectangles (color = tier) · Identities: circles (gray) · Click any node for detail
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                  onClick={() => qc.invalidateQueries({ queryKey: ["/api/ftm/graph"] })}
                  data-testid="btn-refresh-graph">
                  <RefreshCw size={10} className="mr-1" /> Refresh
                </Button>
                {orgs.length === 0 && (
                  <Button size="sm" variant="outline" className="text-xs h-7 rounded-none font-mono"
                    onClick={() => seedMut.mutate()} disabled={seedMut.isPending}
                    data-testid="btn-graph-seed">
                    {seedMut.isPending ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Database size={10} className="mr-1" />}
                    Seed HUMINT
                  </Button>
                )}
              </div>
            </div>

            <Card className="rounded-none border-border">
              <CardContent className="p-0">
                <ForceGraph
                  nodes={graphData?.nodes ?? []}
                  edges={graphData?.edges ?? []}
                  heatmap={graphData?.heatmap}
                  onNodeClick={setSelectedNode}
                />
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground border border-border/40 px-3 py-2">
              <span className="font-semibold text-foreground">Legend:</span>
              {[
                { color: "#ef4444", label: "CRITICAL org" },
                { color: "#f97316", label: "HIGH org" },
                { color: "#eab308", label: "MODERATE org" },
                { color: "#22c55e", label: "LOW org" },
                { color: "#6b7280", label: "Identity" },
                { color: "#7c3aed", label: "RF event ◆" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-[1px] border" style={{ borderColor: color, backgroundColor: color + "20" }} />
                  <span>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-8 h-[1px] border-dashed border-t border-violet-500" />
                <span>Spoke resonance</span>
              </div>
              <span className="ml-auto text-muted-foreground">Verlet · FR repulsion · PUA underlay</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border/50 pt-3 text-[9px] font-mono text-muted-foreground flex justify-between">
          <span>κ₁={(constants?.gos.kappa1 ?? 1.27324).toFixed(5)} · κ₂={
            (constants?.gos.kappa2 ?? 1.43464).toFixed(5)} · φ={
            (constants?.gos.phi ?? 1.61803).toFixed(5)} · η*={ETA_STAR} · Δ={GOOSE_GAP}</span>
          <span data-testid="demodex-phase">
            Demodex phase: {constants?.demodex.phaseDays.toFixed(2) ?? "—"}d
            {constants?.demodex.crossingKappa1 ? " [κ₁ CROSSING]" : ""}
          </span>
        </div>
      </div>

      {/* Node detail drawer */}
      {selectedNode && (
        <NodeDrawer node={selectedNode} orgs={orgs} onClose={() => setSelectedNode(null)} />
      )}
    </TooltipProvider>
  );
}
