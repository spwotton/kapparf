import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PRIORITY_COLOR: Record<string, string> = {
  HIGH:   "bg-red-900/80 text-red-200 border-red-800",
  MEDIUM: "bg-amber-900/60 text-amber-200 border-amber-700",
  LOW:    "bg-zinc-800 text-zinc-400 border-zinc-700",
};

const CLASS_COLOR: Record<string, string> = {
  HUMINT:    "text-sky-400",
  SIGINT:    "text-emerald-400",
  FINANCIAL: "text-yellow-400",
  GEOGRAPHIC:"text-purple-400",
  LOGISTICS: "text-orange-400",
};

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs tracking-wider">{children}</span>;
}

function ConfidenceBar({ v }: { v: number }) {
  const pct = Math.round(v * 100);
  const col = v >= 0.75 ? "bg-red-500" : v >= 0.5 ? "bg-amber-500" : "bg-zinc-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${col} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-zinc-500 text-xs">{pct}%</span>
    </div>
  );
}

export default function GooseSignalsPage() {
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [cycleRunning, setCycleRunning] = useState(false);

  const { data: status } = useQuery<any>({
    queryKey: ["/api/goose/intel/status"],
    refetchInterval: 30_000,
  });

  const { data: threads } = useQuery<any[]>({
    queryKey: ["/api/goose/intel/threads"],
    refetchInterval: 60_000,
  });

  const { data: log } = useQuery<any[]>({
    queryKey: ["/api/goose/intel/findings", activeThread],
    queryFn: () => {
      const url = activeThread
        ? `/api/goose/intel/findings?thread=${activeThread}`
        : "/api/goose/intel/findings";
      return fetch(url).then(r => r.json());
    },
    refetchInterval: 30_000,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/goose/intel/publish/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goose/intel/findings"] });
    },
  });

  const runCycle = async () => {
    setCycleRunning(true);
    try {
      await apiRequest("POST", "/api/goose/intel/cycle");
      queryClient.invalidateQueries({ queryKey: ["/api/goose/intel/findings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goose/intel/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goose/intel/status"] });
    } finally {
      setCycleRunning(false);
    }
  };

  const drafts = (log ?? []).filter((r: any) => r.draft_headline && !r.published);
  const findings = (log ?? []).filter((r: any) => !r.draft_headline || r.published);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-600 text-xs font-mono tracking-widest uppercase">Gazette</span>
              <span className="text-zinc-700">›</span>
              <span className="text-zinc-400 text-xs font-mono tracking-widest uppercase">Intel</span>
            </div>
            <h1 className="text-white text-xl font-semibold mt-0.5">Thread Correlation Hypervisor</h1>
            <p className="text-zinc-600 text-xs mt-0.5 italic">
              "Every article is a signpost. Every tag is a signal. Every thread is a truth the editors are too polite to name."
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${status?.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
            <span className="text-zinc-500 text-xs">{status?.active ? "HYPERVISOR ONLINE" : "OFFLINE"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">

        {/* System Status */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <div className="text-zinc-500 text-xs mb-1">Research Cycles</div>
              <div className="text-white text-xl font-mono">{status?.cycleCount ?? 0}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <div className="text-zinc-500 text-xs mb-1">Active Threads</div>
              <div className="text-white text-xl font-mono">{threads?.length ?? 0}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <div className="text-zinc-500 text-xs mb-1">Cycle Interval</div>
              <div className="text-white text-xl font-mono">{status?.intervalMins ?? 10}m</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <div className="text-zinc-500 text-xs mb-1">Draft Queue</div>
              <div className={`text-xl font-mono ${drafts.length > 0 ? "text-amber-400" : "text-white"}`}>{drafts.length}</div>
            </div>
          </div>

          {status?.lastCycle && (
            <div className="mt-3 bg-zinc-900/50 border border-zinc-800 rounded p-3 text-xs">
              <span className="text-zinc-500">Last cycle: </span>
              <Mono>{status.lastCycle.thread}</Mono>
              <span className="text-zinc-600"> [{status.lastCycle.bh53}]</span>
              <span className="text-zinc-500"> — </span>
              <span className="text-zinc-300">{status.lastCycle.finding?.slice(0, 120)}…</span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
              onClick={runCycle}
              disabled={cycleRunning}
              data-testid="button-run-cycle"
            >
              {cycleRunning ? "Running…" : "Run Research Cycle Now"}
            </Button>
            {status?.models && (
              <span className="text-zinc-600 text-xs">
                <Mono>{status.models.primary.split("/").pop()}</Mono>
                <span className="mx-1">→</span>
                <Mono>{status.models.fallback.split("/").pop()}</Mono>
              </span>
            )}
          </div>
        </section>

        {/* Thread Registry */}
        <section>
          <h2 className="text-zinc-400 text-xs font-mono tracking-widest uppercase mb-3">Active Threads</h2>
          <div className="space-y-2">
            {(threads ?? []).map((t: any) => (
              <button
                key={t.slug}
                data-testid={`thread-row-${t.slug}`}
                onClick={() => setActiveThread(activeThread === t.slug ? null : t.slug)}
                className={`w-full text-left bg-zinc-900 border rounded p-3 transition-colors ${
                  activeThread === t.slug ? "border-zinc-500" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLOR[t.priority] ?? PRIORITY_COLOR.LOW}`}>
                    {t.priority}
                  </span>
                  <span className="font-mono text-zinc-400 text-xs tracking-wider">{t.bh53_id}</span>
                  <span className="text-white text-sm font-medium">{t.label}</span>
                  <span className={`text-xs ml-auto ${CLASS_COLOR[t.classif] ?? "text-zinc-400"}`}>{t.classif}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-xs text-zinc-600">
                  <span>{(t.article_ids?.length ?? 0)} articles indexed</span>
                  <span>cycle #{t.cycle_count ?? 0}</span>
                  {t.last_cycle && (
                    <span>last: {new Date(t.last_cycle).toLocaleString()}</span>
                  )}
                  {t.geo_label && <span>📍 {t.geo_label}</span>}
                </div>
                {activeThread === t.slug && t.themes?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.themes.map((th: string) => (
                      <span key={th} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
                        {th}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Draft Queue */}
        {drafts.length > 0 && (
          <section>
            <h2 className="text-amber-600 text-xs font-mono tracking-widest uppercase mb-3">
              Draft Queue — {drafts.length} pending
            </h2>
            <div className="space-y-3">
              {drafts.map((d: any) => (
                <div key={d.id} className="bg-zinc-900 border border-amber-900/40 rounded p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-amber-600">{d.thread_slug}</span>
                        <ConfidenceBar v={d.confidence ?? 0} />
                      </div>
                      <div className="text-white text-sm font-medium leading-snug">{d.draft_headline}</div>
                      {d.draft_body && (
                        <p className="text-zinc-400 text-xs mt-2 leading-relaxed line-clamp-3">{d.draft_body}</p>
                      )}
                      <div className="mt-2 text-zinc-600 text-xs">
                        Model: <Mono>{d.model?.split("/").pop()}</Mono>
                        {" · "}{new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-800 text-amber-300 hover:bg-amber-900/30 text-xs shrink-0"
                      onClick={() => publishMutation.mutate(d.id)}
                      data-testid={`button-publish-draft-${d.id}`}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Research Log */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-zinc-400 text-xs font-mono tracking-widest uppercase">
              Research Log{activeThread ? ` — ${activeThread}` : ""}
            </h2>
            {activeThread && (
              <button
                onClick={() => setActiveThread(null)}
                className="text-zinc-600 text-xs hover:text-zinc-400"
              >
                ← all threads
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(log ?? []).filter((r: any) => !r.draft_headline || r.published).length === 0 && (
              <div className="text-zinc-700 text-sm text-center py-8">
                No findings yet. Run a research cycle to begin.
              </div>
            )}
            {(log ?? []).filter((r: any) => !r.draft_headline || r.published).map((r: any) => (
              <div key={r.id} className="bg-zinc-900/60 border border-zinc-800 rounded p-3">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <span className="text-zinc-600 font-mono text-xs">{r.thread_slug}</span>
                  <span className="text-zinc-700 text-xs">cycle #{r.cycle_num}</span>
                  <ConfidenceBar v={r.confidence ?? 0} />
                  {r.published && (
                    <span className="text-emerald-600 text-xs font-mono">PUBLISHED</span>
                  )}
                  <span className="ml-auto text-zinc-700 text-xs">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{r.finding}</p>
                {r.connections?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.connections.map((c: string, i: number) => (
                      <span key={i} className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1.5 text-zinc-700 text-xs">
                  <Mono>{r.model?.split("/").pop()}</Mono>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BH53 Reference */}
        <section className="border-t border-zinc-900 pt-6">
          <h2 className="text-zinc-700 text-xs font-mono tracking-widest uppercase mb-3">BH53-ID Register</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(status?.threads ?? []).map((t: any) => (
              <div key={t.slug} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-zinc-500 w-14 shrink-0">{t.bh53}</span>
                <span className="text-zinc-700 truncate">{t.slug}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-zinc-800 text-xs">
            BH53-ID encoding: GF(53) skew-Hermitian manifold — alphabet Σ₅₃ = 53-char restricted set.
            Thread IDs are FNV-1a hashed, Base53 encoded, checksum appended per §IV specification.
            SimHash64 fingerprints use FNV-1a 64-bit for deduplication (port: base53_corpus_hypercompressor.py).
          </p>
        </section>

      </div>
    </div>
  );
}
