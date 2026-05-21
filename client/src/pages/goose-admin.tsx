import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HypervisorPanel } from "@/components/hypervisor-panel";
import { BarneyTRex } from "@/components/barney-trex";
import { PinkRabbit } from "@/components/pink-rabbit";

// ─── HUMOR BADGE + REJUDGE ────────────────────────────────────────────────────
interface HumorStats {
  rollingAvg: { apRigidity:number; premiseAbsurdity:number; jokeDiscipline:number;
    specificityCarrier:number; resolutionUnresolved:number; overall:number; sampleSize:number };
}
function HumorPanel() {
  const { data } = useQuery<HumorStats>({ queryKey:["/api/goose/humor-stats"], refetchInterval: 3*60*1000 });
  const [flash, setFlash] = useState<string|null>(null);
  const rejudge = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST","/api/humor/rejudge-all"); return r.json(); },
    onSuccess: (r:any) => {
      setFlash(r.alreadyRunning ? "already running" : `done · ${r.scored} scored in ${(r.durationMs/1000).toFixed(1)}s`);
      queryClient.invalidateQueries({ queryKey:["/api/goose/humor-stats"] });
      setTimeout(() => setFlash(null), 6000);
    },
  });
  const avg = data?.rollingAvg;
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">κ-Humor Hypervisor</div>
      {avg && avg.sampleSize > 0 ? (
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          {[["Overall",avg.overall],["AP",avg.apRigidity],["Absurdity",avg.premiseAbsurdity],
            ["Discipline",avg.jokeDiscipline],["Specificity",avg.specificityCarrier],["Resolution",avg.resolutionUnresolved]
          ].map(([k,v]) => (
            <div key={k as string} className="bg-gray-900 rounded p-2 text-center">
              <div className={`text-[15px] font-bold ${(v as number)>=75?"text-green-400":(v as number)>=55?"text-yellow-400":"text-gray-400"}`}>
                {(v as number).toFixed(1)}
              </div>
              <div className="text-[9px] text-gray-500 mt-0.5">{k}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-gray-500 font-mono">warming up — {avg?.sampleSize ?? 0} samples</div>
      )}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => rejudge.mutate()} disabled={rejudge.isPending}
          data-testid="button-rejudge-all"
          className="text-[10px] font-sans px-2 py-1 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors disabled:opacity-40">
          {rejudge.isPending ? "judging…" : "↻ re-judge all"}
        </button>
        {flash && <span className="text-[10px] text-gray-400 font-mono">{flash}</span>}
      </div>
    </div>
  );
}

// ─── GENERATION STATUS ────────────────────────────────────────────────────────
function GenerationPanel() {
  const { data, refetch } = useQuery<any>({ queryKey:["/api/goose/status"], refetchInterval: 30000 });
  const [generating, setGenerating] = useState(false);
  const generate = async () => {
    setGenerating(true);
    try { await fetch("/api/goose/generate",{method:"POST"}); setTimeout(()=>refetch(),2000); } catch{}
    setGenerating(false);
  };
  const nextMin = data?.nextIn ? Math.round(data.nextIn/60000) : null;
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Generation Engine</div>
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-gray-900 rounded p-2">
          <div className="text-[18px] font-bold text-white">{data?.articleCount ?? "—"}</div>
          <div className="text-[9px] text-gray-500">articles total</div>
        </div>
        <div className="bg-gray-900 rounded p-2">
          <div className={`text-[14px] font-bold ${data?.active?"text-green-400":"text-gray-500"}`}>
            {data?.active ? "ACTIVE" : "IDLE"}
          </div>
          <div className="text-[9px] text-gray-500">scheduler</div>
        </div>
      </div>
      {nextMin !== null && (
        <div className="text-[10px] text-gray-500 font-mono">
          next article in ~{nextMin}m &nbsp;·&nbsp; interval: 30 min
        </div>
      )}
      {data?.latest && (
        <div className="bg-gray-900 rounded p-2 text-[10px] font-mono text-gray-400">
          <div className="text-gray-300 line-clamp-2">{data.latest.headline}</div>
          <div className="text-gray-600 mt-1">{new Date(data.latest.publishedAt).toLocaleString()}</div>
        </div>
      )}
      <button onClick={generate} disabled={generating} data-testid="button-admin-generate"
        className="w-full text-[11px] font-sans py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors disabled:opacity-40">
        {generating ? "⏳ generating…" : "↻ generate article now"}
      </button>
    </div>
  );
}

// ─── HERV-K VIRUS STATE ───────────────────────────────────────────────────────
function HervKPanel() {
  const { data } = useQuery<any>({ queryKey:["/api/goose/herv-k/state"], refetchInterval: 30000 });
  if (!data) return <div className="text-[10px] text-gray-600 font-mono">HERV-K loading…</div>;
  const phases = data.phases ?? {};
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">HERV-K Sharing Virus</div>
      <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
        {(["DORMANT","ACTIVE","SPREADING","FOSSILIZED"] as const).map(p => (
          <div key={p} className="bg-gray-900 rounded p-1.5">
            <div className="text-white font-bold">{phases[p] ?? 0}</div>
            <div className="text-gray-600 text-[8px]">{p}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] font-mono text-gray-500">
        global R₀: {data.globalR0?.toFixed(3) ?? "—"} &nbsp;·&nbsp; θ_K = 128.23°
      </div>
      {data.topR0 && (
        <div className="bg-gray-900 rounded p-2 text-[10px] font-mono text-gray-400">
          <span className="text-yellow-400">top:</span> {data.topR0.headline?.slice(0,60)}…
          <span className="text-gray-600"> R₀={data.topR0.r0}</span>
        </div>
      )}
    </div>
  );
}

// ─── TICO SATIRE STATE ────────────────────────────────────────────────────────
function TicoSatirePanel() {
  const { data } = useQuery<any>({ queryKey:["/api/goose/tico-satire/state"], refetchInterval: 60000 });
  const run = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST","/api/goose/tico-satire/run"); return r.json(); },
  });
  if (!data) return <div className="text-[10px] text-gray-600 font-mono">Tico Satire loading…</div>;
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Tico Satire Hypervisor</div>
      <div className="text-[10px] font-mono text-gray-500">
        {["NACION_VECTOR 0°","CRHOY_VECTOR 120°","OBSERVADOR_VEC 240°"].map(s => (
          <div key={s} className="flex items-center gap-2">
            <span className="text-green-500">●</span> {s}
          </div>
        ))}
      </div>
      {data.lastBriefing && (
        <div className="bg-gray-900 rounded p-2 text-[10px] font-mono text-gray-400 line-clamp-3">
          {data.lastBriefing.slice(0,200)}…
        </div>
      )}
      <button onClick={() => run.mutate()} disabled={run.isPending}
        className="text-[10px] font-sans px-2 py-1 border border-gray-600 text-gray-400 hover:text-white transition-colors disabled:opacity-40">
        {run.isPending ? "running…" : "↻ run cycle"}
      </button>
    </div>
  );
}

// ─── LORE SEED INJECTOR ───────────────────────────────────────────────────────
function LoreSeedPanel() {
  const [story, setStory] = useState("");
  const [sent, setSent] = useState(false);
  const inject = async () => {
    if (!story.trim()) return;
    await fetch("/api/goose/lore-seed", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ story: story.trim() }),
    }).catch(()=>{});
    setSent(true);
    setStory("");
    setTimeout(() => setSent(false), 3000);
  };
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Lore Seed Injector</div>
      <div className="text-[9px] text-gray-600 font-mono">Feed a real story — gets woven subtly into future articles.</div>
      <textarea value={story} onChange={e => setStory(e.target.value)} rows={3}
        placeholder="Paste a news story, anecdote, or lore fragment…"
        className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-[11px] font-mono p-2 rounded resize-none focus:outline-none focus:border-gray-500"
        data-testid="input-lore-seed"/>
      <button onClick={inject} disabled={!story.trim()}
        data-testid="button-inject-lore"
        className="text-[10px] font-sans px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors disabled:opacity-30">
        {sent ? "✓ injected" : "inject into corpus"}
      </button>
    </div>
  );
}

// ─── ANALYTICS SUMMARY ───────────────────────────────────────────────────────
function AnalyticsPanel() {
  const { data } = useQuery<any>({ queryKey:["/api/goose/analytics/summary"], refetchInterval: 60000 });
  const events = data?.events ?? [];
  const shareTotal = events.filter((e:any)=>e.event==="share_click").length;
  const pageViews = events.filter((e:any)=>e.event==="page_view").length;
  const articleOpens = events.filter((e:any)=>e.event==="article_open").length;
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Analytics (last 24h)</div>
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
        {[["Views",pageViews,"text-blue-400"],["Opens",articleOpens,"text-green-400"],["Shares",shareTotal,"text-yellow-400"]].map(([k,v,c])=>(
          <div key={k as string} className="bg-gray-900 rounded p-2 text-center">
            <div className={`text-[18px] font-bold ${c}`}>{v}</div>
            <div className="text-[9px] text-gray-500">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
export default function GooseAdminPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 pb-12"
      style={{ fontFamily:"'SF Mono','Fira Code',monospace" }}>
      <style>{`@keyframes waddle{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg) translateY(-2px)}} .waddle{animation:waddle 1.8s ease-in-out infinite}`}</style>

      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="waddle opacity-60">
            <svg viewBox="0 0 120 100" width="36" height="30">
              <ellipse cx="60" cy="68" rx="32" ry="22" fill="#374151" stroke="#6b7280" strokeWidth="1.5"/>
              <ellipse cx="79" cy="22" rx="9" ry="8" fill="#374151" stroke="#6b7280" strokeWidth="1.5"/>
              <path d="M72 55 Q80 38 75 22" stroke="#6b7280" strokeWidth="1.5" fill="none"/>
              <path d="M87 21 L101 19 L101 23Z" fill="#d97706"/>
              <circle cx="82" cy="19" r="2" fill="#111"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-gray-200 tracking-tight">Goose Gazette — Admin</h1>
            <p className="text-[10px] text-gray-600 mt-0.5">
              Ψ(t) ≡ 1 &nbsp;·&nbsp; η = 0.09 &nbsp;·&nbsp; Δ = 0.02 &nbsp;·&nbsp;
              <a href="/goose" className="text-gray-500 hover:text-gray-300 underline">view public site →</a>
              &nbsp;·&nbsp;
              <a href="/goose/editorial" className="text-gray-500 hover:text-gray-300 underline">editorial hypervisor →</a>
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Generation + status */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <GenerationPanel/>
        </div>

        {/* Analytics */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <AnalyticsPanel/>
        </div>

        {/* Humor Hypervisor */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <HumorPanel/>
        </div>

        {/* HERV-K Virus */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <HervKPanel/>
        </div>

        {/* Tico Satire Hypervisor */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <TicoSatirePanel/>
        </div>

        {/* Lore Seed Injector */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <LoreSeedPanel/>
        </div>

        {/* Correlation engine widget */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-3">KAPPA Correlation Feed</div>
          <HypervisorPanel/>
        </div>

        {/* Barney TRex */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-3">Vertex Forge</div>
          <BarneyTRex/>
        </div>

        {/* Pink Rabbit */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-3">Pink Rabbit</div>
          <PinkRabbit/>
        </div>

      </div>

      <footer className="mt-12 text-center text-[9px] font-mono text-gray-700 tracking-[0.2em]">
        NODE #1090 · TACACORÍ · 10.0514°N 84.2187°W · 0xHALL_H0NK_0x09
      </footer>
    </div>
  );
}
