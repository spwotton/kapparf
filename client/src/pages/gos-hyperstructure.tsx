import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Provider {
  id: string;
  name: string;
  org: string;
  specialty: string;
  description: string;
  available: boolean;
  reason?: string;
}

interface SubdocVector {
  id: string;
  title: string;
  spoke: number;
  description: string;
}

interface DispatchRecord {
  providerId: string;
  providerName: string;
  status: "pending" | "running" | "done" | "error";
  synthesis: string;
  model: string;
  durationMs?: number;
  error?: string;
}

interface GOSJob {
  id: string;
  topic: string;
  masterDoc: string;
  subdocs: { id: string; title: string; content: string }[];
  dispatches: DispatchRecord[];
  metaSynthesis?: string;
  createdAt: number;
  status: "building" | "ready" | "dispatching" | "complete" | "error";
}

// ─── Simple markdown renderer ────────────────────────────────────────────────
function MdBlock({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={`font-mono text-xs leading-relaxed whitespace-pre-wrap ${className}`}>
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <div key={i} className="text-lg font-bold text-foreground mt-4 mb-2 font-sans">{line.slice(2)}</div>;
        if (line.startsWith("## ")) return <div key={i} className="text-base font-bold text-foreground mt-3 mb-1 font-sans">{line.slice(3)}</div>;
        if (line.startsWith("### ")) return <div key={i} className="text-sm font-semibold text-foreground mt-2 mb-1 font-sans">{line.slice(4)}</div>;
        if (line.startsWith("**")) return <div key={i} className="font-semibold text-foreground">{line.replace(/\*\*/g, "")}</div>;
        if (line.startsWith("---")) return <hr key={i} className="border-border my-2" />;
        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} className="text-muted-foreground pl-3">• {line.slice(2)}</div>;
        if (/^\d+\. /.test(line)) return <div key={i} className="text-muted-foreground pl-3">{line}</div>;
        if (line.startsWith("|")) return <div key={i} className="text-muted-foreground/80 text-[10px] overflow-x-auto">{line}</div>;
        return <div key={i} className={line.trim() === "" ? "h-1" : "text-muted-foreground"}>{line}</div>;
      })}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    running: "bg-blue-500/10 text-blue-500 animate-pulse",
    done: "bg-green-500/10 text-green-500",
    error: "bg-red-500/10 text-red-500",
    building: "bg-amber-500/10 text-amber-500 animate-pulse",
    ready: "bg-green-500/10 text-green-600",
    dispatching: "bg-blue-500/10 text-blue-500 animate-pulse",
    complete: "bg-green-500/10 text-green-600",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-wider font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export default function GOSHyperstructurePage() {
  const [topic, setTopic] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [expandedSynthesis, setExpandedSynthesis] = useState<string | null>(null);
  const [masterExpanded, setMasterExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"master" | "subdocs" | "dispatches" | "meta">("master");
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: providerData } = useQuery<{ providers: Provider[]; subdocVectors: SubdocVector[] }>({
    queryKey: ["/api/gos-hyperstructure/providers"],
    refetchInterval: 60000,
  });

  const [job, setJob] = useState<GOSJob | null>(null);
  const [polling, setPolling] = useState(false);

  const buildCtx = useMutation({
    mutationFn: (t: string) => apiRequest("POST", "/api/gos-hyperstructure/context", { topic: t }),
    onSuccess: async (res) => {
      const data = await res.json();
      setJobId(data.jobId);
      setPolling(true);
    },
  });

  const dispatchMut = useMutation({
    mutationFn: (body: { jobId: string; providerIds: string[] }) =>
      apiRequest("POST", "/api/gos-hyperstructure/dispatch", body),
    onSuccess: () => setPolling(true),
  });

  // Poll job status
  useEffect(() => {
    if (!jobId || !polling) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/gos-hyperstructure/jobs/${jobId}`);
        if (!r.ok) return;
        const j: GOSJob = await r.json();
        setJob(j);
        if (j.status === "complete" || j.status === "error" || j.status === "ready") {
          setPolling(false);
          if (j.status === "complete") setActiveTab("dispatches");
          if (j.status === "ready") setActiveTab("master");
        }
      } catch {}
    };
    poll();
    pollTimer.current = setInterval(poll, 2000);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [jobId, polling]);

  const providers = providerData?.providers ?? [];
  const subdocVectors = providerData?.subdocVectors ?? [];
  const availableProviders = providers.filter(p => p.available);
  const unavailableProviders = providers.filter(p => !p.available);

  const toggleProvider = (id: string) => {
    setSelectedProviders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedProviders(new Set(availableProviders.map(p => p.id)));
  const clearAll = () => setSelectedProviders(new Set());

  const handleDispatch = () => {
    if (!jobId || selectedProviders.size === 0) return;
    setActiveTab("dispatches");
    dispatchMut.mutate({ jobId, providerIds: Array.from(selectedProviders) });
    setPolling(true);
  };

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const completedDispatches = job?.dispatches.filter(d => d.status === "done") ?? [];
  const runningDispatches = job?.dispatches.filter(d => d.status === "running") ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="gos-hyperstructure-page">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1">
                Ω-GOS / Isomorphic Twin Cosmos / Leech Lattice Intelligence Synthesis
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Hyperstructure Research Engine</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Narrative architecture → Master context doc → 9 sub-docs → Multi-provider deep research → Synthesis downloads
              </p>
            </div>
            {job && (
              <div className="shrink-0 text-right">
                <StatusBadge status={job.status} />
                {job.status === "complete" && (
                  <div className="text-xs text-muted-foreground mt-1">{completedDispatches.length} syntheses complete</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Topic Input */}
        <div className="border border-border rounded-sm p-5 space-y-4">
          <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Step 1 — Define Research Topic</div>
          <div className="flex gap-3">
            <textarea
              className="flex-1 bg-muted/30 border border-border rounded-sm px-3 py-2 text-sm font-mono resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter research topic (e.g. 'Surveillance operation at Hotel Pochote Grande — adversary capability and intent assessment')"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              data-testid="input-gos-topic"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (topic.trim()) buildCtx.mutate(topic.trim()); }}
              disabled={!topic.trim() || buildCtx.isPending}
              className="px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-sm hover:opacity-80 disabled:opacity-40 transition-opacity"
              data-testid="button-gos-build"
            >
              {buildCtx.isPending ? "Building Context…" : "Build Ω-GOS Context"}
            </button>
            {job?.status === "building" && <span className="text-xs text-muted-foreground animate-pulse">Fetching live KAPPA data + building master doc…</span>}
            {job?.status === "ready" && <span className="text-xs text-green-600">✓ Context ready — {(job.masterDoc.length / 1000).toFixed(1)}k chars</span>}
          </div>
        </div>

        {/* Provider Selection */}
        {job?.status && ["ready", "dispatching", "complete"].includes(job.status) && (
          <div className="border border-border rounded-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Step 2 — Select Research Providers</div>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="button-gos-select-all">Select all ({availableProviders.length})</button>
                <span className="text-muted-foreground/30">·</span>
                <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors" data-testid="button-gos-clear-all">Clear</button>
              </div>
            </div>

            {/* Available providers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {providers.map(p => {
                const vector = subdocVectors.find(v => v.id === p.specialty);
                const selected = selectedProviders.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => p.available && toggleProvider(p.id)}
                    disabled={!p.available}
                    data-testid={`button-provider-${p.id}`}
                    className={`text-left p-3 border rounded-sm transition-all ${
                      !p.available ? "opacity-30 cursor-not-allowed border-border" :
                      selected ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground/60 font-mono">{p.org}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.available ? (
                          <div className={`w-3 h-3 rounded-sm border ${selected ? "bg-foreground border-foreground" : "border-border"}`} />
                        ) : (
                          <span className="text-[9px] font-mono text-red-400/60">NO KEY</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{p.description}</div>
                    {vector && (
                      <div className="text-[9px] font-mono text-muted-foreground/40 mt-1">Spoke {vector.spoke}: {vector.title.split("—")[0].trim()}</div>
                    )}
                    {!p.available && p.reason && (
                      <div className="text-[9px] text-red-400/60 mt-1">{p.reason}</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDispatch}
                disabled={selectedProviders.size === 0 || job.status === "dispatching" || dispatchMut.isPending}
                className="px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-sm hover:opacity-80 disabled:opacity-40 transition-opacity"
                data-testid="button-gos-dispatch"
              >
                {job.status === "dispatching" ? `Dispatching to ${runningDispatches.length} providers…` : `Dispatch to ${selectedProviders.size} Provider${selectedProviders.size !== 1 ? "s" : ""}`}
              </button>
              {selectedProviders.size > 0 && job.status !== "dispatching" && (
                <span className="text-xs text-muted-foreground">{selectedProviders.size} providers · {(job.masterDoc.length / 1000).toFixed(1)}k context each</span>
              )}
            </div>
          </div>
        )}

        {/* Main Output Tabs */}
        {job && (job.masterDoc.length > 0 || job.dispatches.length > 0) && (
          <div className="border border-border rounded-sm overflow-hidden">
            {/* Tab nav */}
            <div className="flex border-b border-border">
              {(["master", "subdocs", "dispatches", "meta"] as const).map(tab => {
                const labels: Record<string, string> = {
                  master: "Master Context Doc",
                  subdocs: `9 Sub-docs`,
                  dispatches: `Syntheses (${completedDispatches.length}/${job.dispatches.length})`,
                  meta: "Meta-Synthesis",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    data-testid={`tab-${tab}`}
                    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border-r border-border last:border-r-0 transition-colors ${
                      activeTab === tab ? "bg-foreground/5 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Master Context Doc */}
            {activeTab === "master" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Ω-GOS Master Intelligence Context</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{(job.masterDoc.length / 1000).toFixed(1)}k characters · {job.subdocs.length} sub-docs · Live KAPPA data embedded</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMasterExpanded(!masterExpanded)}
                      className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1 rounded-sm"
                    >
                      {masterExpanded ? "Collapse" : "Expand"}
                    </button>
                    <button
                      onClick={() => downloadFile(`/api/gos-hyperstructure/download/${job.id}/master`, `gos-master-${job.id}.md`)}
                      className="text-xs text-foreground hover:opacity-80 border border-foreground px-3 py-1 rounded-sm"
                      data-testid="button-download-master"
                    >
                      ↓ Download MD
                    </button>
                  </div>
                </div>
                <div className={`overflow-hidden transition-all ${masterExpanded ? "" : "max-h-[500px]"} overflow-y-auto`}>
                  <MdBlock text={job.masterDoc} className="text-[11px]" />
                </div>
                {!masterExpanded && job.masterDoc.length > 2000 && (
                  <button onClick={() => setMasterExpanded(true)} className="text-xs text-muted-foreground mt-2 hover:text-foreground">
                    Show full document ({(job.masterDoc.length / 1000).toFixed(1)}k chars) ↓
                  </button>
                )}
              </div>
            )}

            {/* Sub-docs */}
            {activeTab === "subdocs" && (
              <div className="p-5">
                <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4">
                  9 Research Vectors — Optimized for LLM Context Windows
                </div>
                <div className="space-y-3">
                  {job.subdocs.map((sd, i) => {
                    const vector = subdocVectors.find(v => v.id === sd.id);
                    return (
                      <div key={sd.id} className="border border-border rounded-sm overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20"
                          onClick={() => setExpandedSynthesis(expandedSynthesis === `subdoc-${i}` ? null : `subdoc-${i}`)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-muted-foreground/40 w-6">S{i + 1}</span>
                            <div>
                              <div className="text-sm font-semibold text-foreground">{sd.title}</div>
                              {vector && <div className="text-xs text-muted-foreground">{vector.description}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">{(sd.content.length / 1000).toFixed(1)}k</span>
                            <span className="text-muted-foreground">{expandedSynthesis === `subdoc-${i}` ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        {expandedSynthesis === `subdoc-${i}` && (
                          <div className="border-t border-border p-4 max-h-96 overflow-y-auto">
                            <MdBlock text={sd.content.slice(0, 3000)} className="text-[10px]" />
                            {sd.content.length > 3000 && (
                              <div className="text-[10px] text-muted-foreground/40 mt-2">… {((sd.content.length - 3000) / 1000).toFixed(1)}k chars truncated in preview</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dispatches / Syntheses */}
            {activeTab === "dispatches" && (
              <div className="p-5">
                <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4">
                  Provider Syntheses — {completedDispatches.length} complete · {runningDispatches.length} running
                </div>
                {job.dispatches.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    Select providers above and click Dispatch to begin multi-provider synthesis.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {job.dispatches.map(d => (
                      <div key={d.providerId} className="border border-border rounded-sm overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20"
                          onClick={() => d.status === "done" && setExpandedSynthesis(expandedSynthesis === d.providerId ? null : d.providerId)}
                        >
                          <div className="flex items-center gap-3">
                            <StatusBadge status={d.status} />
                            <div>
                              <div className="text-sm font-semibold text-foreground">{d.providerName}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {d.model !== "pending" ? d.model : "awaiting…"}
                                {d.durationMs && ` · ${(d.durationMs / 1000).toFixed(1)}s`}
                                {d.synthesis.length > 0 && ` · ${(d.synthesis.length / 1000).toFixed(1)}k chars`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {d.status === "done" && (
                              <button
                                onClick={e => { e.stopPropagation(); downloadFile(`/api/gos-hyperstructure/download/${job.id}/${d.providerId}`, `gos-${d.providerName.toLowerCase().replace(/\W+/g, "-")}-synthesis.md`); }}
                                className="text-xs border border-border px-2 py-1 rounded-sm hover:border-foreground/50 text-muted-foreground hover:text-foreground"
                                data-testid={`button-download-${d.providerId}`}
                              >
                                ↓ MD
                              </button>
                            )}
                            {d.status === "done" && (
                              <span className="text-muted-foreground">{expandedSynthesis === d.providerId ? "▲" : "▼"}</span>
                            )}
                            {d.status === "running" && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            {d.status === "error" && (
                              <span className="text-xs text-red-400 font-mono">✗</span>
                            )}
                          </div>
                        </div>
                        {expandedSynthesis === d.providerId && d.status === "done" && (
                          <div className="border-t border-border p-4 max-h-[600px] overflow-y-auto">
                            <MdBlock text={d.synthesis} className="text-[11px]" />
                          </div>
                        )}
                        {d.status === "error" && d.error && (
                          <div className="border-t border-border px-4 py-2 text-xs text-red-400 font-mono">{d.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meta-Synthesis */}
            {activeTab === "meta" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Ω-GOS Meta-Synthesis</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Cross-provider integration · Convergent + divergent findings · Unified operational picture</div>
                  </div>
                  {job.metaSynthesis && (
                    <button
                      onClick={() => downloadFile(`/api/gos-hyperstructure/download/${job.id}/meta`, `gos-meta-synthesis-${job.id}.md`)}
                      className="text-xs text-foreground hover:opacity-80 border border-foreground px-3 py-1 rounded-sm"
                      data-testid="button-download-meta"
                    >
                      ↓ Download Meta-Synthesis
                    </button>
                  )}
                </div>
                {!job.metaSynthesis ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    {job.status === "complete" ? "No meta-synthesis generated (no successful provider runs)." :
                     job.status === "dispatching" ? "Meta-synthesis will appear here after all providers complete…" :
                     "Dispatch to providers first to generate meta-synthesis."}
                  </div>
                ) : (
                  <div className="max-h-[800px] overflow-y-auto">
                    <MdBlock text={job.metaSynthesis} className="text-[11px]" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Jobs */}
        <RecentJobs onSelect={(id) => { setJobId(id); setPolling(true); }} />

        {/* Framework reference */}
        <div className="border border-border rounded-sm p-5">
          <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-4">Ω-GOS Framework — 9 Research Vectors</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(providerData?.subdocVectors ?? []).map(v => (
              <div key={v.id} className="border border-border/50 rounded-sm p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground/40">S{v.spoke}</span>
                  <span className="text-xs font-semibold text-foreground">{v.title.split("—")[0].trim()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function RecentJobs({ onSelect }: { onSelect: (id: string) => void }) {
  const { data } = useQuery<{ jobs: { id: string; topic: string; status: string; createdAt: number; dispatchCount: number }[] }>({
    queryKey: ["/api/gos-hyperstructure/jobs"],
    refetchInterval: 5000,
  });

  const jobs = data?.jobs ?? [];
  if (jobs.length === 0) return null;

  return (
    <div className="border border-border rounded-sm p-4">
      <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-3">Recent Research Jobs</div>
      <div className="space-y-1">
        {jobs.slice(0, 8).map(j => (
          <button
            key={j.id}
            onClick={() => onSelect(j.id)}
            data-testid={`button-job-${j.id}`}
            className="w-full text-left flex items-center justify-between px-3 py-2 hover:bg-muted/20 rounded-sm transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <StatusBadge status={j.status} />
              <span className="text-sm text-foreground truncate">{j.topic}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="text-xs text-muted-foreground font-mono">{j.dispatchCount} providers</span>
              <span className="text-xs text-muted-foreground font-mono">{new Date(j.createdAt).toLocaleTimeString()}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
