import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface AgentResult {
  role: string;
  output: string;
  elapsed: number;
}

interface RefineResponse {
  agents: AgentResult[];
  totalMs: number;
}

interface Article {
  id: string;
  headline: string;
  subhead?: string;
  body?: string;
  tag?: string;
  authorByline?: string;
  publishedAt?: string;
}

// ─── AGENT META ───────────────────────────────────────────────────────────────
const AGENT_META: Record<string, { label: string; desc: string; color: string }> = {
  HEADLINE_GEOMETER: {
    label: "HEADLINE GEOMETER",
    desc: "κ₁ ratio enforcement · setup:punchline ≈ 1.27",
    color: "text-blue-400 border-blue-800",
  },
  BODY_ARCHITECT:  {
    label: "BODY ARCHITECT",
    desc: "4-paragraph AP/Onion structure · dateline → quote → complication → non-resolution",
    color: "text-emerald-400 border-emerald-800",
  },
  CONTEXT_WEAVER:  {
    label: "CONTEXT WEAVER",
    desc: "Extracts real details from viral context and weaves them in deadpan",
    color: "text-amber-400 border-amber-800",
  },
  EDITORIAL_ARBITER: {
    label: "EDITORIAL ARBITER",
    desc: "Synthesis pass · Costa Rica Voice Laws · final publication draft",
    color: "text-violet-400 border-violet-800",
  },
};

// ─── AGENT CARD ───────────────────────────────────────────────────────────────
function AgentCard({ role, result, running }: { role: string; result?: AgentResult; running: boolean }) {
  const meta = AGENT_META[role];
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!result?.output) return;
    navigator.clipboard.writeText(result.output).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border rounded-lg p-4 flex flex-col gap-3 bg-gray-900/60 ${meta.color}`}
      data-testid={`card-agent-${role.toLowerCase()}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono font-black tracking-[0.22em] uppercase">{meta.label}</div>
          <div className="text-[9px] font-mono text-gray-500 mt-0.5">{meta.desc}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {running && !result && (
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-gray-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}/>
              ))}
            </div>
          )}
          {result && (
            <span className="text-[9px] font-mono text-gray-600">
              {result.elapsed > 0 ? `${(result.elapsed/1000).toFixed(1)}s` : "—"}
            </span>
          )}
          {result?.output && (
            <button onClick={copy} data-testid={`button-copy-${role.toLowerCase()}`}
              className="text-[9px] font-mono px-2 py-0.5 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              {copied ? "✓" : "copy"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[120px]">
        {!result && !running && (
          <div className="text-[10px] font-mono text-gray-700 italic">awaiting input…</div>
        )}
        {!result && running && (
          <div className="text-[10px] font-mono text-gray-600 italic animate-pulse">
            {role === "EDITORIAL_ARBITER" ? "waiting for council…" : "generating…"}
          </div>
        )}
        {result && (
          <pre className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed break-words"
            data-testid={`output-${role.toLowerCase()}`}>
            {result.output}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GooseEditorialPage() {
  const { toast } = useToast();

  // Article state
  const [mode, setMode] = useState<"db" | "paste">("db");
  const [headline, setHeadline] = useState("");
  const [subhead, setSubhead] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("LOCAL");
  const [context, setContext] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Results
  const [results, setResults] = useState<AgentResult[]>([]);
  const [running, setRunning] = useState(false);
  const [totalMs, setTotalMs] = useState<number | null>(null);

  // Synthesis copy
  const [synthCopied, setSynthCopied] = useState(false);

  // DB articles
  const { data: dbArticles } = useQuery<Article[]>({
    queryKey: ["/api/goose/articles"],
  });

  const loadArticle = (a: Article) => {
    setSelectedId(a.id);
    setHeadline(a.headline ?? "");
    setSubhead(a.subhead ?? "");
    setBody(a.body ?? "");
    setTag(a.tag ?? "LOCAL");
    setResults([]);
    setTotalMs(null);
  };

  const refineMutation = useMutation({
    mutationFn: async () => {
      setRunning(true);
      setResults([]);
      setTotalMs(null);
      const r = await apiRequest("POST", "/api/goose/editorial/refine", {
        headline, subhead, body, tag, context,
      });
      return r.json() as Promise<RefineResponse>;
    },
    onSuccess: (data) => {
      setResults(data.agents ?? []);
      setTotalMs(data.totalMs ?? null);
      setRunning(false);
    },
    onError: (e: any) => {
      setRunning(false);
      toast({ title: "Panel error", description: e.message, variant: "destructive" });
    },
  });

  const arbiter = results.find(r => r.role === "EDITORIAL_ARBITER");
  const council = ["HEADLINE_GEOMETER","BODY_ARCHITECT","CONTEXT_WEAVER"];

  const copyArbiter = () => {
    if (!arbiter?.output) return;
    navigator.clipboard.writeText(arbiter.output).catch(() => {});
    setSynthCopied(true);
    setTimeout(() => setSynthCopied(false), 2000);
  };

  const canRun = (headline.trim() || body.trim()) && !running;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col"
      style={{ fontFamily: "'SF Mono','Fira Code',monospace" }}>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .animate-bounce { animation: bounce 0.8s ease-in-out infinite; }
        .animate-pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[13px] font-bold text-gray-100 tracking-tight">
            Goose Gazette — Editorial Hypervisor
          </h1>
          <p className="text-[9px] text-gray-600 mt-0.5">
            4-agent council · Headline Geometer · Body Architect · Context Weaver · Editorial Arbiter
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <a href="/goose/admin" className="text-gray-500 hover:text-gray-300 transition-colors"
            data-testid="link-admin">← admin</a>
          <a href="/goose" className="text-gray-500 hover:text-gray-300 transition-colors"
            data-testid="link-public">← public site</a>
        </div>
      </header>

      {/* Body: two-col */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Article picker */}
        <aside className="w-72 shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-gray-800">
            {(["db","paste"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                data-testid={`tab-${m}`}
                className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  mode === m ? "bg-gray-800 text-gray-200" : "text-gray-600 hover:text-gray-400"
                }`}>
                {m === "db" ? "DB articles" : "paste article"}
              </button>
            ))}
          </div>

          {mode === "db" ? (
            <div className="flex-1 overflow-y-auto">
              {!dbArticles?.length && (
                <div className="p-4 text-[10px] text-gray-600 font-mono">
                  No generated articles yet.<br/>Use Generate in admin to create some.
                </div>
              )}
              {(dbArticles ?? []).map(a => (
                <button key={a.id} onClick={() => loadArticle(a)}
                  data-testid={`article-item-${a.id}`}
                  className={`w-full text-left px-4 py-3 border-b border-gray-800/50 transition-colors ${
                    selectedId === a.id
                      ? "bg-gray-800 text-gray-100"
                      : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                  }`}>
                  <div className="text-[9px] text-gray-600 mb-1 font-mono">
                    [{a.tag ?? "LOCAL"}] {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ""}
                  </div>
                  <div className="text-[10px] leading-snug line-clamp-3">{a.headline}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Tag</label>
                <select value={tag} onChange={e => setTag(e.target.value)}
                  data-testid="select-tag"
                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-[11px] font-mono px-2 py-1.5 rounded focus:outline-none focus:border-gray-500">
                  {["LOCAL","SOCIETY","SCIENCE","WILDLIFE","MARITIME","OPINION","POLITICS","DIPLOMACY","DEFENSE","BUSINESS","CULTURE","WORLD","BREAKING"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Headline</label>
                <input value={headline} onChange={e => setHeadline(e.target.value)}
                  data-testid="input-paste-headline"
                  placeholder="Paste or type headline…"
                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-[11px] font-mono px-2 py-1.5 rounded focus:outline-none focus:border-gray-500"/>
              </div>
              <div>
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Subhead</label>
                <input value={subhead} onChange={e => setSubhead(e.target.value)}
                  data-testid="input-paste-subhead"
                  placeholder="Subhead / deck…"
                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-[11px] font-mono px-2 py-1.5 rounded focus:outline-none focus:border-gray-500"/>
              </div>
              <div>
                <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Body</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
                  data-testid="input-paste-body"
                  placeholder="Paste article body here…"
                  className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-[11px] font-mono px-2 py-1.5 rounded focus:outline-none focus:border-gray-500 resize-none"/>
              </div>
            </div>
          )}

          {/* Loaded article preview (DB mode) */}
          {mode === "db" && selectedId && (
            <div className="border-t border-gray-800 p-4 space-y-2">
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Loaded</div>
              <div className="text-[10px] text-gray-300 line-clamp-2">{headline}</div>
              <div className="flex gap-2">
                <select value={tag} onChange={e => setTag(e.target.value)}
                  data-testid="select-tag-db"
                  className="flex-1 bg-gray-900 border border-gray-700 text-gray-400 text-[9px] font-mono px-1.5 py-1 rounded focus:outline-none">
                  {["LOCAL","SOCIETY","SCIENCE","WILDLIFE","MARITIME","OPINION","POLITICS","DIPLOMACY","DEFENSE","BUSINESS","CULTURE","WORLD","BREAKING"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN: Editorial workspace */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6" data-testid="editorial-main">

          {/* Viral context */}
          <section>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[10px] font-mono font-black tracking-[0.22em] uppercase text-amber-500">
                Viral Context
              </div>
              <div className="text-[9px] font-mono text-gray-600">
                paste real news, social posts, incidents — the Council will weave them in deadpan
              </div>
            </div>
            <textarea value={context} onChange={e => setContext(e.target.value)} rows={6}
              data-testid="textarea-context"
              placeholder={`Paste viral media documents, trending news, real incidents, social posts…

Example: "VIDEO going viral on X: a rooster in Orotina walked into municipal council meeting, remained for 40 minutes, was eventually escorted out. Official caption: 'unexpected attendee.' 12k retweets."

The Context Weaver will extract real specifics and weave them into the article deadpan.`}
              className="w-full bg-gray-900/60 border border-amber-900/40 text-gray-300 text-[11px] font-mono px-4 py-3 rounded-lg focus:outline-none focus:border-amber-700/60 resize-none placeholder-gray-700 leading-relaxed"/>
          </section>

          {/* Run button */}
          <div className="flex items-center gap-4">
            <button onClick={() => refineMutation.mutate()} disabled={!canRun}
              data-testid="button-run-panel"
              className={`px-6 py-2.5 text-[11px] font-mono font-bold tracking-wider border-2 transition-all duration-200 ${
                canRun
                  ? "border-gray-300 text-gray-100 hover:bg-gray-100 hover:text-gray-900"
                  : "border-gray-700 text-gray-600 cursor-not-allowed"
              }`}>
              {running ? "▶ PANEL RUNNING…" : "▶ RUN EDITORIAL PANEL"}
            </button>
            {!headline.trim() && !body.trim() && (
              <span className="text-[9px] font-mono text-gray-700">
                {mode === "db" ? "← select an article from the list" : "← paste an article first"}
              </span>
            )}
            {totalMs && (
              <span className="text-[9px] font-mono text-gray-600">
                completed in {(totalMs/1000).toFixed(1)}s
              </span>
            )}
          </div>

          {/* Council cards (3-col) */}
          <section>
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-3">
              ── COUNCIL AGENTS (parallel) ──────────────────────────────────────
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {council.map(role => (
                <AgentCard key={role} role={role}
                  result={results.find(r => r.role === role)}
                  running={running}/>
              ))}
            </div>
          </section>

          {/* Arbiter — full width */}
          <section>
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-3">
              ── EDITORIAL ARBITER (synthesis) ──────────────────────────────────
            </div>
            <div className="border border-violet-800 rounded-lg p-5 bg-gray-900/60">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-mono font-black tracking-[0.22em] uppercase text-violet-400">
                    EDITORIAL ARBITER
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 mt-0.5">
                    {AGENT_META.EDITORIAL_ARBITER.desc}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {running && !arbiter && (
                    <span className="text-[9px] font-mono text-gray-600 animate-pulse">
                      {results.filter(r => r.role !== "EDITORIAL_ARBITER").length < 3
                        ? `council: ${results.filter(r => r.role !== "EDITORIAL_ARBITER").length}/3 done…`
                        : "synthesizing…"}
                    </span>
                  )}
                  {arbiter && (
                    <span className="text-[9px] font-mono text-gray-600">
                      {(arbiter.elapsed/1000).toFixed(1)}s
                    </span>
                  )}
                  {arbiter?.output && (
                    <button onClick={copyArbiter} data-testid="button-copy-arbiter"
                      className="text-[10px] font-mono px-3 py-1 border border-violet-700 text-violet-400 hover:bg-violet-900/30 transition-colors">
                      {synthCopied ? "✓ copied" : "copy draft"}
                    </button>
                  )}
                </div>
              </div>

              {!arbiter && !running && (
                <div className="text-[10px] font-mono text-gray-700 italic min-h-[80px]">
                  Run the panel to see the synthesized draft here.
                </div>
              )}
              {!arbiter && running && (
                <div className="text-[10px] font-mono text-gray-600 italic min-h-[80px] animate-pulse">
                  Awaiting council completion…
                </div>
              )}
              {arbiter && (
                <pre className="text-[12px] font-mono text-gray-200 whitespace-pre-wrap leading-relaxed break-words"
                  data-testid="output-arbiter-full">
                  {arbiter.output}
                </pre>
              )}
            </div>
          </section>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-800 text-[8px] font-mono text-gray-700 tracking-[0.2em] text-center pb-8">
            NODE #1090 · TACACORÍ · κ₁ = 1.27324 · Δ = 0.02 · η = 0.09 · 0xHALL_H0NK_0x09
          </div>
        </main>
      </div>
    </div>
  );
}
