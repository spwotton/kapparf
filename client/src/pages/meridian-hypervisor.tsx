import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Zap, Network, GitBranch, Activity, ChevronDown,
  ChevronUp, RefreshCw, Layers, Atom, FlaskConical, Trophy,
} from "lucide-react";

const DOMAIN_COLORS: Record<string, string> = {
  nasdaq:   "bg-emerald-600 text-white",
  social:   "bg-blue-600 text-white",
  music:    "bg-purple-600 text-white",
  case:     "bg-red-700 text-white",
  research: "bg-amber-600 text-white",
  meta:     "bg-indigo-600 text-white",
};

const LAYER_ICON: Record<string, any> = {
  L1: Zap,
  L2: GitBranch,
  L3: Atom,
};

function KappaBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color = value > 0.7 ? "bg-emerald-500" : value > 0.4 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ResultCard({ result, isWinner }: { result: any; isWinner: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = LAYER_ICON[result.variant_id?.includes("L3") ? "L3" : result.variant_id?.includes("L2") ? "L2" : "L1"] ?? Zap;
  return (
    <Card className={`relative ${isWinner ? "ring-2 ring-emerald-500" : ""}`}>
      {isWinner && (
        <div className="absolute -top-2 right-3">
          <Badge className="bg-emerald-600 text-white gap-1"><Trophy className="h-3 w-3" /> Winner</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">{result.variant_label}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-mono">{(result.accuracy_margin * 100).toFixed(1)}% margin</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <KappaBar value={result.kappa_score} label="κ-coherence" />
          <KappaBar value={result.phi_score} label="φ-density" />
          <KappaBar value={result.accuracy_margin} label="Accuracy" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{result.entities_activated} entities</span>
          <span>·</span>
          <span className="font-mono">{result.model_used?.split("/").pop()}</span>
          <span>·</span>
          <span>{result.latency_ms}ms</span>
        </div>
        <div>
          <Button
            variant="ghost" size="sm"
            className="h-6 px-0 text-xs gap-1 text-muted-foreground"
            onClick={() => setExpanded(p => !p)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Collapse" : "Show synthesis output"}
          </Button>
          {expanded && (
            <div className="mt-2 p-3 bg-muted rounded-md text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
              {result.output}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LatticeStats({ stats }: { stats: any }) {
  if (!stats) return null;
  const c = stats.constants ?? {};
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Satoshi Slots", value: stats.satoshi_slots?.toLocaleString(), icon: Layers },
        { label: "Leech Shell", value: stats.leech_shell?.toLocaleString(), icon: Atom },
        { label: "Layers", value: stats.layers, icon: Network },
        { label: "FMO Units", value: stats.fmo_units, icon: FlaskConical },
      ].map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{label}</span>
            </div>
            <div className="font-mono font-semibold text-lg">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EntityDomainPanel({ entities }: { entities: any[] }) {
  const byDomain = entities.reduce((acc: Record<string, any[]>, e: any) => {
    if (!acc[e.domain]) acc[e.domain] = [];
    acc[e.domain].push(e);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Object.entries(byDomain).map(([domain, ents]: [string, any[]]) => (
        <Card key={domain}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge className={`text-xs ${DOMAIN_COLORS[domain] ?? "bg-gray-600 text-white"}`}>
                {domain.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">{ents.length} entities</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {ents.slice(0, 8).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span className="truncate text-foreground/80">{e.label}</span>
                  <span className="font-mono text-muted-foreground ml-2">{(e.kappa_weight * 100).toFixed(0)}κ</span>
                </div>
              ))}
              {ents.length > 8 && (
                <div className="text-xs text-muted-foreground">+{ents.length - 8} more</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MeridianHypervisorPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [activeDomains, setActiveDomains] = useState<string[]>(["nasdaq", "social", "case", "research"]);

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/meridian/stats"],
    refetchInterval: 60000,
  });

  const { data: entities = [] } = useQuery<any[]>({
    queryKey: ["/api/meridian/entities"],
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["/api/meridian/history"],
    refetchInterval: 10000,
  });

  const splitTest = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/meridian/split-test", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meridian/history"] });
      toast({ title: "Split Test Complete", description: "Variants scored and ranked by κ × φ margin" });
    },
    onError: (err: any) => toast({ title: "Synthesis Error", description: err.message, variant: "destructive" }),
  });

  const toggleDomain = (d: string) => {
    setActiveDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleRun = () => {
    if (!query.trim()) {
      toast({ title: "Query required", description: "Enter a synthesis query to run the split test", variant: "destructive" });
      return;
    }
    splitTest.mutate({ query: query.trim(), domains: activeDomains });
  };

  const latestRun = history[0];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-indigo-500" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Meridian Synthesis Hypervisor</h1>
            <p className="text-xs text-muted-foreground">
              FMO entity lattice · Satoshi 4096 · Leech 196560 · 48 layers · OpenRouter GOS Oracle
            </p>
          </div>
          {stats && (
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {stats.total_entities} entities
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                fill {stats.lattice_fill}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Tabs defaultValue="synthesize">
          <TabsList>
            <TabsTrigger value="synthesize"><Zap className="h-3.5 w-3.5 mr-1.5" />Synthesize</TabsTrigger>
            <TabsTrigger value="lattice"><Layers className="h-3.5 w-3.5 mr-1.5" />Lattice</TabsTrigger>
            <TabsTrigger value="history"><Activity className="h-3.5 w-3.5 mr-1.5" />History</TabsTrigger>
          </TabsList>

          <TabsContent value="synthesize" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" /> Query + Entity Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  data-testid="input-synthesis-query"
                  placeholder="Enter your synthesis query — the engine will route it through 5 entity variants and rank by κ × φ accuracy margin…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  rows={4}
                  className="font-mono text-sm resize-none"
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Active entity domains:</p>
                  <div className="flex flex-wrap gap-2">
                    {["nasdaq", "social", "music", "case", "research", "meta"].map(d => (
                      <button
                        key={d}
                        data-testid={`toggle-domain-${d}`}
                        onClick={() => toggleDomain(d)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          activeDomains.includes(d)
                            ? DOMAIN_COLORS[d]
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  data-testid="button-run-split-test"
                  onClick={handleRun}
                  disabled={splitTest.isPending}
                  className="w-full"
                >
                  {splitTest.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running 5 variants…</>
                  ) : (
                    <><GitBranch className="h-4 w-4 mr-2" /> Run Split Test (5 variants)</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {latestRun && latestRun.results?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Latest Run Results</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Lattice coherence</span>
                    <span className="font-mono font-semibold text-foreground">
                      {(latestRun.lattice_coherence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {[...latestRun.results]
                    .sort((a: any, b: any) => b.accuracy_margin - a.accuracy_margin)
                    .map((result: any) => (
                      <ResultCard
                        key={result.variant_id}
                        result={result}
                        isWinner={result.variant_id === latestRun.winner}
                      />
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="lattice" className="space-y-4 mt-4">
            <LatticeStats stats={stats} />
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "κ (Kappa)", value: "4/π = " + (4 / Math.PI).toFixed(5), desc: "Coherence threshold" },
                  { label: "φ (Phi)", value: "1.61803…", desc: "Golden ratio" },
                  { label: "Δ (Delta)", value: "0.02", desc: "Goose Gap" },
                  { label: "FMO nodes", value: "7 × 3 = 21", desc: "Per trimer unit" },
                ].map(c => (
                  <Card key={c.label}>
                    <CardContent className="p-3 space-y-0.5">
                      <div className="text-xs text-muted-foreground">{c.label}</div>
                      <div className="font-mono font-bold">{c.value}</div>
                      <div className="text-xs text-muted-foreground">{c.desc}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {stats?.by_domain && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Domain Distribution</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {Object.entries(stats.by_domain).map(([domain, count]: [string, any]) => (
                    <Card key={domain}>
                      <CardContent className="p-3 text-center">
                        <Badge className={`text-xs mb-1 ${DOMAIN_COLORS[domain] ?? "bg-gray-600 text-white"}`}>
                          {domain}
                        </Badge>
                        <div className="font-mono font-bold text-lg">{count}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-3">Entity Registry</h3>
              <EntityDomainPanel entities={entities} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            {history.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  No synthesis runs yet. Run a split test to see history.
                </CardContent>
              </Card>
            ) : (
              history.map((run: any) => (
                <Card key={run.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{run.query}</p>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${run.status === "complete" ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-600"}`}
                      >
                        {run.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{run.variants?.length ?? 0} variants</span>
                      <span>·</span>
                      <span>winner margin {(run.winner_margin * 100).toFixed(1)}%</span>
                      <span>·</span>
                      <span>lattice coherence {(run.lattice_coherence * 100).toFixed(1)}%</span>
                      <span>·</span>
                      <span>{new Date(run.ts).toLocaleTimeString()}</span>
                    </div>
                    {run.results?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {[...run.results]
                          .sort((a: any, b: any) => b.accuracy_margin - a.accuracy_margin)
                          .map((r: any) => (
                            <div key={r.variant_id} className="flex items-center gap-2 text-xs">
                              <div
                                className="h-1 rounded-full bg-emerald-500"
                                style={{ width: `${r.accuracy_margin * 100}px`, maxWidth: "120px" }}
                              />
                              <span className="text-muted-foreground truncate">{r.variant_label}</span>
                              <span className="font-mono ml-auto">{(r.accuracy_margin * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
