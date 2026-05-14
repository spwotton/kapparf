import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Network, Zap, Radio, Brain, Database, Eye, Layers,
  Send, Rss, AlertTriangle, Cpu, Activity, Globe, Sparkles
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MonadLayer = 0 | 1 | 2 | 3;
type MessageType = "signal" | "correlation" | "proposal" | "spawn" | "harvest" | "heartbeat" | "prune" | "broadcast" | "dream" | "alert";

interface Monad {
  id: string; name: string; description: string; layer: MonadLayer;
  capabilities: string[]; kappa_score: number;
  status: "alive" | "dormant" | "spawning" | "harvesting" | "pruned";
  spawn_threshold: number; metadata: Record<string, any>;
  last_heartbeat: string; registered_at: string;
}

interface CortexMessage {
  id: string; channel: string; type: MessageType;
  source: string; target?: string; layer?: MonadLayer;
  subject: string; body: string; payload: Record<string, any>;
  kappa_score: number; tags: string[]; ts: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LAYER_META: Record<number, { name: string; color: string; bg: string; border: string; icon: typeof Network }> = {
  0: { name: "EXECUTIVE",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: Brain },
  1: { name: "PRIMARY",    color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: Cpu },
  2: { name: "SECONDARY",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: Database },
  3: { name: "SENSOR",     color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  icon: Radio },
};

const MSG_COLOR: Record<string, string> = {
  alert:       "text-red-400 border-red-400/30 bg-red-400/10",
  spawn:       "text-orange-400 border-orange-400/30 bg-orange-400/10",
  harvest:     "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  dream:       "text-purple-400 border-purple-400/30 bg-purple-400/10",
  correlation: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  proposal:    "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  signal:      "text-blue-400 border-blue-400/30 bg-blue-400/10",
  heartbeat:   "text-muted-foreground border-border/40 bg-muted/30",
  broadcast:   "text-foreground/70 border-border/40 bg-muted/20",
};

// ─── Toroidal Ring Diagram ─────────────────────────────────────────────────────

function ToroidalMap({ monads, activeIds }: { monads: Monad[]; activeIds: Set<string> }) {
  const cx = 160, cy = 160;
  const radii = [28, 60, 100, 140];
  const colors = ["#ef4444", "#f97316", "#3b82f6", "#22c55e"];

  const layers = [0, 1, 2, 3].map(l => monads.filter(m => m.layer === l));

  return (
    <svg width="320" height="320" className="w-full max-w-xs mx-auto shrink-0">
      {/* Toroidal ring lines */}
      {radii.map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={colors[i]} strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="4,3" />
      ))}
      {/* Center pulsing dot — executive */}
      <circle cx={cx} cy={cy} r={10} fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeOpacity="0.6" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={5} fill="#ef4444" fillOpacity="0.8" />

      {/* Layer labels */}
      {[0,1,2,3].map(l => {
        const r = radii[l];
        const label = ["EXEC", "PRIMARY", "SECONDARY", "SENSOR"][l];
        return (
          <text key={l} x={cx + r + 4} y={cy + 4} fontSize="7" fill={colors[l]} fillOpacity="0.6" fontFamily="monospace">{label}</text>
        );
      })}

      {/* Monad nodes per layer */}
      {layers.map((layerMonads, l) =>
        layerMonads.map((m, i) => {
          if (l === 0) return null;
          const r = radii[l];
          const angle = (i / layerMonads.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const isActive = activeIds.has(m.id);
          const isFruiting = m.id.startsWith("spawn-");
          return (
            <g key={m.id}>
              {isActive && <circle cx={x} cy={y} r={7} fill={colors[l]} fillOpacity="0.15" />}
              <circle cx={x} cy={y} r={isFruiting ? 5 : 3.5}
                fill={isFruiting ? "#a855f7" : colors[l]}
                fillOpacity={isActive ? 1 : 0.5}
                stroke={isActive ? colors[l] : "none"} strokeWidth="1" />
            </g>
          );
        })
      )}

      {/* Hyphae — lines from active nodes to center */}
      {layers.map((layerMonads, l) =>
        l === 0 ? null : layerMonads.filter(m => activeIds.has(m.id)).map((m, i) => {
          const r = radii[l];
          const angle = (i / layerMonads.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          return (
            <line key={m.id} x1={cx} y1={cy} x2={x} y2={y}
              stroke={colors[l]} strokeOpacity="0.25" strokeWidth="0.75" strokeDasharray="2,3" />
          );
        })
      )}

      {/* κ label */}
      <text x={cx - 5} y={cy + 3} fontSize="9" fill="#ef4444" fillOpacity="0.9" fontFamily="monospace" fontWeight="bold">κ</text>
    </svg>
  );
}

// ─── Message row ──────────────────────────────────────────────────────────────

function MessageRow({ msg }: { msg: CortexMessage }) {
  const [open, setOpen] = useState(false);
  const cls = MSG_COLOR[msg.type] ?? MSG_COLOR.broadcast;
  const ago = (() => {
    const s = Math.round((Date.now() - new Date(msg.ts).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  })();

  return (
    <div className={`rounded border px-3 py-2 cursor-pointer transition-colors hover:opacity-90 ${cls}`}
      onClick={() => setOpen(o => !o)}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>{msg.type}</span>
        <span className="text-xs font-medium truncate flex-1 min-w-0">{msg.subject}</span>
        <span className="text-[10px] font-mono opacity-50 shrink-0">{ago}</span>
        {msg.kappa_score > 0 && <span className="text-[9px] font-mono opacity-70">κ{msg.kappa_score.toFixed(0)}</span>}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] font-mono opacity-50">{msg.source}</span>
        {msg.target && <><span className="text-[10px] opacity-30">→</span><span className="text-[10px] font-mono opacity-50">{msg.target}</span></>}
        <span className="text-[10px] opacity-40">#{msg.channel}</span>
      </div>
      {open && (
        <div className="mt-2 text-xs opacity-80 leading-relaxed border-t border-current/20 pt-2 whitespace-pre-wrap">
          {msg.body}
        </div>
      )}
    </div>
  );
}

// ─── Monad card ───────────────────────────────────────────────────────────────

function MonadCard({ monad, isActive }: { monad: Monad; isActive: boolean }) {
  const L = LAYER_META[monad.layer];
  const Icon = L.icon;
  const isFruiting = monad.id.startsWith("spawn-");
  return (
    <div className={`rounded-lg border p-2.5 text-[11px] transition-all ${isActive ? L.border + " " + L.bg : "border-border/40 bg-muted/10"} ${isFruiting ? "border-purple-500/40 bg-purple-500/10" : ""}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${isActive ? L.color : "text-muted-foreground/40"} ${isFruiting ? "text-purple-400" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-mono font-medium truncate ${isFruiting ? "text-purple-400" : isActive ? L.color : "text-muted-foreground/60"}`}>
              {monad.name}
            </span>
            <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
              monad.status === "alive" ? "border-green-500/30 text-green-400" :
              monad.status === "spawning" ? "border-orange-500/30 text-orange-400" :
              monad.status === "harvesting" ? "border-emerald-500/30 text-emerald-400" :
              "border-muted text-muted-foreground/40"
            }`}>{monad.status}</span>
            {isFruiting && <span className="text-[8px] font-mono px-1 py-0.5 rounded border border-purple-500/30 text-purple-400">🍄 FRUITING</span>}
          </div>
          <p className="text-muted-foreground/50 mt-0.5 leading-relaxed line-clamp-2">{monad.description}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {monad.capabilities.slice(0, 4).map(c => (
              <span key={c} className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/40 text-muted-foreground/50">{c}</span>
            ))}
            {monad.capabilities.length > 4 && <span className="text-[8px] text-muted-foreground/30">+{monad.capabilities.length - 4}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-[8px] font-mono ${L.color} opacity-70`}>L{monad.layer}</span>
          <p className="text-[8px] font-mono text-muted-foreground/40 mt-0.5">κ⊕{monad.spawn_threshold}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CortexBusPage() {
  const [messages, setMessages] = useState<CortexMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [activeMonads, setActiveMonads] = useState<Set<string>>(new Set());
  const [dreamText, setDreamText] = useState("");
  const [broadcastSource, setBroadcastSource] = useState("external-app");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastChannel, setBroadcastChannel] = useState("general");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const { data: topology } = useQuery<any>({ queryKey: ["/api/cortex/topology"], refetchInterval: 30000 });
  const { data: agentsData } = useQuery<any>({ queryKey: ["/api/cortex/agents"], refetchInterval: 15000 });

  const monads: Monad[] = agentsData?.agents ?? [];
  const counts = agentsData?.counts ?? {};

  // Connect SSE
  useEffect(() => {
    const connect = () => {
      const url = filter ? `/api/cortex/feed?channel=${encodeURIComponent(filter)}` : "/api/cortex/feed";
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => setConnected(true);
      es.onerror = () => { setConnected(false); setTimeout(connect, 3000); };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "connected") {
            // Initial buffer
            const buf: CortexMessage[] = data.buffer ?? [];
            setMessages(buf);
            return;
          }
          // Live message
          const msg = data as CortexMessage;
          setMessages(prev => [msg, ...prev].slice(0, 150));
          setActiveMonads(prev => {
            const next = new Set(prev);
            next.add(msg.source);
            setTimeout(() => setActiveMonads(p => { const n = new Set(p); n.delete(msg.source); return n; }), 4000);
            return next;
          });
          // Scroll feed to top if near top
          if (feedRef.current && feedRef.current.scrollTop < 100) {
            feedRef.current.scrollTop = 0;
          }
        } catch {}
      };
    };
    connect();
    return () => { esRef.current?.close(); };
  }, [filter]);

  const sendDream = useCallback(async () => {
    if (!dreamText.trim()) return;
    setSending(true);
    try {
      await fetch("/api/cortex/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: dreamText, kappa_score: 88, tags: ["dream", "human"] }),
      });
      setDreamText("");
    } finally { setSending(false); }
  }, [dreamText]);

  const sendBroadcast = useCallback(async () => {
    if (!broadcastSource || !broadcastSubject || !broadcastBody) return;
    setSending(true);
    try {
      await fetch("/api/cortex/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: broadcastSource, subject: broadcastSubject,
          body: broadcastBody, channel: broadcastChannel, kappa_score: 60,
        }),
      });
      setBroadcastSubject(""); setBroadcastBody("");
    } finally { setSending(false); }
  }, [broadcastSource, broadcastSubject, broadcastBody, broadcastChannel]);

  const visibleMessages = filter
    ? messages.filter(m => m.channel === filter || m.source.includes(filter) || (m.tags ?? []).includes(filter))
    : messages;

  const fruitingBodies = monads.filter(m => m.id.startsWith("spawn-"));
  const layerMonads = (l: number) => monads.filter(m => m.layer === l);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-400" />
            <h1 className="text-base font-semibold tracking-tight">Cortex Bus</h1>
            <span className="text-xs text-muted-foreground font-mono">Mycelium Hypervisor Network</span>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className={`flex items-center gap-1.5 text-xs font-mono ${connected ? "text-green-400" : "text-red-400"}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {connected ? "LIVE" : "reconnecting…"}
            </div>
            <Badge variant="outline" className="text-purple-400 border-purple-400/30 text-[10px]">
              {counts.total ?? 0} monads
            </Badge>
            {fruitingBodies.length > 0 && (
              <Badge variant="outline" className="text-orange-400 border-orange-400/30 text-[10px] animate-pulse">
                🍄 {fruitingBodies.length} fruiting
              </Badge>
            )}
            <a href="/api/cortex/feed.rss" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-400 transition-colors">
              <Rss className="w-3 h-3" /> RSS
            </a>
          </div>
        </div>

        {/* Protocol legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-[9px] font-mono text-muted-foreground/50">
          <span>SPORE=signal enters</span>
          <span>HYPHA=travels between monads</span>
          <span>MYCELIUM=this bus</span>
          <span>🍄FRUITING BODY=spawned sub-hypervisor</span>
          <span>HARVEST=findings→Memory Cortex</span>
          <span>SUBSTRATE=signal data</span>
          <span>POPCORN=κ≥threshold, explosive spawn</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: Toroidal map + monad registry */}
        <div className="w-72 shrink-0 border-r border-border/40 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border/30 shrink-0">
            <ToroidalMap monads={monads} activeIds={activeMonads} />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
            {[0, 1, 2, 3].map(l => {
              const L = LAYER_META[l];
              const lMonads = layerMonads(l);
              if (!lMonads.length) return null;
              return (
                <div key={l}>
                  <div className={`flex items-center gap-1.5 px-1 py-0.5 mb-1`}>
                    <L.icon className={`w-2.5 h-2.5 ${L.color}`} />
                    <span className={`text-[9px] font-mono uppercase ${L.color}`}>{L.name}</span>
                    <span className="text-[8px] text-muted-foreground/40">{lMonads.length}</span>
                  </div>
                  {lMonads.map(m => (
                    <MonadCard key={m.id} monad={m} isActive={activeMonads.has(m.id)} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Live message feed */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Feed filter */}
          <div className="px-3 py-2 border-b border-border/30 shrink-0 flex gap-2">
            <Input
              placeholder="filter by channel / source / tag…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="h-7 text-xs font-mono bg-transparent"
            />
            <span className="text-[10px] text-muted-foreground/50 self-center shrink-0">{visibleMessages.length} msgs</span>
          </div>

          <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
            {visibleMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Activity className="w-8 h-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/40">Waiting for mycelium signals…</p>
              </div>
            )}
            {visibleMessages.map(m => <MessageRow key={m.id} msg={m} />)}
          </div>
        </div>

        {/* Right: Composer + topology info */}
        <div className="w-72 shrink-0 border-l border-border/40 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">

            {/* Dream composer — human → mycelium */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-mono uppercase text-purple-400">Dream</span>
                <span className="text-[9px] text-muted-foreground/50">human → mycelium</span>
              </div>
              <Textarea
                placeholder="Send a vision into the network… a thought, a direction, a hypothesis. The mycelium carries it."
                value={dreamText}
                onChange={e => setDreamText(e.target.value)}
                className="text-xs min-h-[80px] resize-none bg-purple-500/5 border-purple-500/20 focus:border-purple-500/50"
              />
              <Button size="sm" className="w-full mt-2 h-7 text-xs bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30"
                onClick={sendDream} disabled={sending || !dreamText.trim()}>
                <Send className="w-3 h-3 mr-1.5" /> Transmit Dream
              </Button>
            </div>

            <Separator className="opacity-20" />

            {/* Broadcast composer — any agent can publish */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Radio className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-mono uppercase text-blue-400">Broadcast</span>
                <span className="text-[9px] text-muted-foreground/50">agent → mycelium</span>
              </div>
              <div className="space-y-1.5">
                <Input placeholder="source agent id" value={broadcastSource} onChange={e => setBroadcastSource(e.target.value)}
                  className="h-7 text-xs font-mono bg-transparent" />
                <Input placeholder="channel (seismic, rf, dream…)" value={broadcastChannel} onChange={e => setBroadcastChannel(e.target.value)}
                  className="h-7 text-xs font-mono bg-transparent" />
                <Input placeholder="subject" value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)}
                  className="h-7 text-xs bg-transparent" />
                <Textarea placeholder="message body" value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)}
                  className="text-xs min-h-[60px] resize-none bg-transparent" />
                <Button size="sm" className="w-full h-7 text-xs" onClick={sendBroadcast}
                  disabled={sending || !broadcastSubject || !broadcastBody}>
                  <Send className="w-3 h-3 mr-1.5" /> Broadcast
                </Button>
              </div>
            </div>

            <Separator className="opacity-20" />

            {/* API integration guide */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Globe className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-mono uppercase text-green-400">Connect Your App</span>
              </div>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="rounded border border-green-500/20 bg-green-500/5 p-2 space-y-1">
                  <p className="text-green-400/70">// Subscribe (SSE)</p>
                  <p className="text-muted-foreground/70 break-all">GET /api/cortex/feed</p>
                  <p className="text-muted-foreground/50">?channel=seismic (optional)</p>
                </div>
                <div className="rounded border border-blue-500/20 bg-blue-500/5 p-2 space-y-1">
                  <p className="text-blue-400/70">// Register monad</p>
                  <p className="text-muted-foreground/70">POST /api/cortex/register</p>
                  <p className="text-muted-foreground/50">{'{ id, name, layer, capabilities }'}</p>
                </div>
                <div className="rounded border border-orange-500/20 bg-orange-500/5 p-2 space-y-1">
                  <p className="text-orange-400/70">// Publish message</p>
                  <p className="text-muted-foreground/70">POST /api/cortex/broadcast</p>
                  <p className="text-muted-foreground/50">{'{ source, subject, body, channel, kappa_score }'}</p>
                </div>
                <div className="rounded border border-purple-500/20 bg-purple-500/5 p-2 space-y-1">
                  <p className="text-purple-400/70">// RSS feed</p>
                  <p className="text-muted-foreground/70 break-all">GET /api/cortex/feed.rss</p>
                </div>
                <div className="rounded border border-red-500/20 bg-red-500/5 p-2 space-y-1">
                  <p className="text-red-400/70">// Request spawn</p>
                  <p className="text-muted-foreground/70">POST /api/cortex/spawn</p>
                  <p className="text-muted-foreground/50">{'{ source, task, kappa_score }'}</p>
                </div>
              </div>
            </div>

            {/* Topology snapshot */}
            {topology && (
              <>
                <Separator className="opacity-20" />
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Layers className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-[10px] font-mono uppercase text-muted-foreground/60">Lifecycle</span>
                  </div>
                  <div className="space-y-1 text-[9px] font-mono text-muted-foreground/50">
                    {Object.entries(topology.protocol ?? {}).map(([k, v]) => (
                      <div key={k} className="flex gap-1.5">
                        <span className="text-muted-foreground/30 uppercase w-24 shrink-0">{k}</span>
                        <span>{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
