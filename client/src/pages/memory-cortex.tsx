import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Brain, Search, Upload, Database, Zap, Star, Clock, Tag, Trash2, ChevronDown, ChevronUp, Radio, Activity } from "lucide-react";

interface MemoryRecord {
  id: string;
  created_at: string;
  updated_at: string;
  category: string;
  title: string;
  content: string;
  metadata: any;
  source: string | null;
  importance: number;
  access_count: number;
  last_accessed: string | null;
  similarity?: number;
}

interface MemoryStats {
  total_memories: number;
  categories: { category: string; count: number }[];
  avg_importance: number;
  most_accessed: MemoryRecord[];
  recent: MemoryRecord[];
  embedding_model: string;
  status: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  quantum_circuit: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  mathematical_proof: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  signal_intelligence: "bg-green-500/20 text-green-300 border-green-500/30",
  surveillance_evidence: "bg-red-500/20 text-red-300 border-red-500/30",
  kappa_constant: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  frequency_analysis: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  network_forensics: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  gos_framework: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  research_finding: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  decision: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  code_change: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  correlation: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  whistleblower: "bg-red-600/20 text-red-200 border-red-600/30",
  session_context: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

function CategoryBadge({ category }: { category: string }) {
  const colors = CATEGORY_COLORS[category] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  return <Badge variant="outline" className={`${colors} text-xs`} data-testid={`badge-category-${category}`}>{category.replace(/_/g, " ")}</Badge>;
}

function ImportanceStars({ value }: { value: number }) {
  const stars = Math.round(value * 5);
  return (
    <div className="flex gap-0.5" data-testid="importance-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= stars ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
      ))}
    </div>
  );
}

function MemoryCard({ memory, onDelete }: { memory: MemoryRecord; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors" data-testid={`card-memory-${memory.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CategoryBadge category={memory.category} />
              <ImportanceStars value={memory.importance} />
              {memory.similarity !== undefined && (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                  {(memory.similarity * 100).toFixed(1)}% match
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm text-gray-100 mb-1 truncate" data-testid={`text-memory-title-${memory.id}`}>{memory.title}</h3>
            <div className="text-xs text-gray-500 flex gap-3">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(memory.created_at).toLocaleString()}</span>
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{memory.access_count} reads</span>
              {memory.source && <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{memory.source.replace("file:", "").split("/").pop()}</span>}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-300" onClick={() => setExpanded(!expanded)} data-testid={`button-expand-${memory.id}`}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-400" onClick={() => onDelete(memory.id)} data-testid={`button-delete-${memory.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {expanded && (
          <div className="mt-3 space-y-2">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap bg-gray-950/50 rounded p-3 max-h-64 overflow-auto font-mono" data-testid={`text-memory-content-${memory.id}`}>
              {memory.content}
            </pre>
            {memory.metadata && Object.keys(memory.metadata).length > 0 && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-300">Raw Metadata</summary>
                <pre className="mt-1 whitespace-pre-wrap bg-gray-950/50 rounded p-2 max-h-48 overflow-auto font-mono">
                  {JSON.stringify(memory.metadata, null, 2).slice(0, 2000)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MemoryCortexPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchResults, setSearchResults] = useState<MemoryRecord[] | null>(null);
  const [storeCategory, setStoreCategory] = useState("research_finding");
  const [storeTitle, setStoreTitle] = useState("");
  const [storeContent, setStoreContent] = useState("");
  const [storeImportance, setStoreImportance] = useState("0.5");
  const [listCategory, setListCategory] = useState("all");
  const [listSort, setListSort] = useState("created_at");

  const { data: stats, isLoading: statsLoading } = useQuery<MemoryStats>({
    queryKey: ["/api/memory/stats"],
    refetchInterval: 10000,
  });

  const { data: kymaStatus } = useQuery<any>({
    queryKey: ["/api/kyma/status"],
    refetchInterval: 5000,
  });

  const { data: kymaLatest } = useQuery<any>({
    queryKey: ["/api/kyma/latest"],
    refetchInterval: 5000,
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ["/api/memory/categories"],
  });

  const { data: memoryList, isLoading: listLoading } = useQuery<{ memories: MemoryRecord[]; total: number }>({
    queryKey: ["/api/memory/list", listCategory, listSort],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50", sort: listSort });
      if (listCategory !== "all") params.set("category", listCategory);
      const res = await fetch(`/api/memory/list?${params}`);
      return res.json();
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/memory/search", {
        query,
        limit: 20,
        category: searchCategory !== "all" ? searchCategory : undefined,
        threshold: 0.2,
      });
      return res.json();
    },
    onSuccess: (data) => setSearchResults(data),
    onError: (err: any) => toast({ title: "Search failed", description: err.message, variant: "destructive" }),
  });

  const storeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/memory/store", {
        category: storeCategory,
        title: storeTitle,
        content: storeContent,
        importance: parseFloat(storeImportance),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Memory stored" });
      setStoreTitle("");
      setStoreContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/memory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memory/list"] });
    },
    onError: (err: any) => toast({ title: "Store failed", description: err.message, variant: "destructive" }),
  });

  const ingestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/memory/ingest", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ingestion complete",
        description: `Ingested: ${data.ingested?.length || 0}, Skipped: ${data.skipped?.length || 0}, Failed: ${data.failed?.length || 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memory/list"] });
    },
    onError: (err: any) => toast({ title: "Ingestion failed", description: err.message, variant: "destructive" }),
  });

  const ingestResonomeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/kyma/ingest-resonome", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Resonome ingested",
        description: `${data.ingested || 0} genes embedded, ${data.skipped || 0} skipped`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memory/list"] });
    },
    onError: (err: any) => toast({ title: "Resonome ingest failed", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/memory/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Memory deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/memory/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memory/list"] });
    },
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-violet-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100" data-testid="text-page-title">Memory Cortex</h1>
            <p className="text-sm text-gray-500">pgvector semantic memory — quantum circuits, proofs, SIGINT, evidence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => ingestMutation.mutate()}
            disabled={ingestMutation.isPending}
            variant="outline"
            className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            data-testid="button-ingest"
          >
            <Upload className="h-4 w-4 mr-2" />
            {ingestMutation.isPending ? "Ingesting..." : "Ingest All Files"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Database className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Total Memories</span>
            </div>
            <p className="text-3xl font-bold text-gray-100" data-testid="text-total-memories">{stats?.total_memories ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Tag className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Categories</span>
            </div>
            <p className="text-3xl font-bold text-gray-100" data-testid="text-total-categories">{stats?.categories?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Avg Importance</span>
            </div>
            <p className="text-3xl font-bold text-gray-100" data-testid="text-avg-importance">{(stats?.avg_importance ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Embedding Model</span>
            </div>
            <p className="text-sm font-bold text-gray-100 mt-1" data-testid="text-embedding-model">{stats?.embedding_model ?? "—"}</p>
            <Badge variant="outline" className={stats?.status === "online" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}>
              {stats?.status ?? "unknown"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {stats?.categories && stats.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.categories.map(c => (
            <div key={c.category} className="flex items-center gap-1.5">
              <CategoryBadge category={c.category} />
              <span className="text-xs text-gray-500">{c.count}</span>
            </div>
          ))}
        </div>
      )}

      <Card className="bg-gray-900/50 border-gray-800" data-testid="card-kyma-status">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <Radio className="h-4 w-4 text-emerald-400" />
              Kyma Engine Live Feed
              {kymaStatus?.connected && (
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  LIVE
                </Badge>
              )}
            </CardTitle>
            <Button
              onClick={() => ingestResonomeMutation.mutate()}
              disabled={ingestResonomeMutation.isPending}
              variant="outline"
              size="sm"
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 h-7 text-xs"
              data-testid="button-ingest-resonome"
            >
              {ingestResonomeMutation.isPending ? "Ingesting..." : "Ingest Resonome"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {kymaStatus?.connected ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Frames processed</span>
                  <span className="text-gray-200 font-mono" data-testid="text-kyma-frames">{kymaStatus.frameCount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Uptime</span>
                  <span className="text-gray-200 font-mono">{Math.floor((kymaStatus.uptimeSeconds || 0) / 60)}m</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Last frame</span>
                  <span className="text-gray-200 font-mono">#{kymaStatus.latestFrameNumber}</span>
                </div>
              </div>
              {kymaLatest && !kymaLatest.error && (
                <div className="space-y-2 border-l border-gray-800 pl-4">
                  <div className="text-xs text-gray-400 italic" data-testid="text-kyma-decoded">"{kymaLatest.decodedText}"</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">{kymaLatest.dominantState}</Badge>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">{kymaLatest.behavior}</Badge>
                    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">{kymaLatest.flowRegime}</Badge>
                    {kymaLatest.apertureLocked && (
                      <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">APERTURE LOCKED</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Bell S</span>
                      <span className={`block font-mono ${kymaLatest.bellS > 2.8 ? "text-amber-300" : "text-gray-300"}`}>{kymaLatest.bellS?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ψ(t)</span>
                      <span className="block font-mono text-gray-300">{kymaLatest.psiT?.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tilt</span>
                      <span className={`block font-mono ${kymaLatest.rotationTilt > 127 && kymaLatest.rotationTilt < 129.5 ? "text-amber-300" : "text-gray-300"}`}>{kymaLatest.rotationTilt?.toFixed(2)}°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-600" />
              Kyma engine offline — collector will retry automatically
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <Search className="h-4 w-4" />
              Semantic Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories semantically..."
                className="bg-gray-950/50 border-gray-700"
                onKeyDown={(e) => e.key === "Enter" && searchQuery && searchMutation.mutate(searchQuery)}
                data-testid="input-search"
              />
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-44 bg-gray-950/50 border-gray-700" data-testid="select-search-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(categories || []).map(c => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => searchQuery && searchMutation.mutate(searchQuery)}
                disabled={searchMutation.isPending || !searchQuery}
                data-testid="button-search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {searchMutation.isPending && <p className="text-xs text-gray-500">Searching vector space...</p>}
            {searchResults && (
              <div className="space-y-2 max-h-96 overflow-auto">
                <p className="text-xs text-gray-500">{searchResults.length} results</p>
                {searchResults.map(m => (
                  <MemoryCard key={m.id} memory={m} onDelete={(id) => deleteMutation.mutate(id)} />
                ))}
                {searchResults.length === 0 && <p className="text-xs text-gray-500">No memories matched your query.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <Database className="h-4 w-4" />
              Store New Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={storeCategory} onValueChange={setStoreCategory}>
              <SelectTrigger className="bg-gray-950/50 border-gray-700" data-testid="select-store-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(categories || []).map(c => (
                  <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={storeTitle}
              onChange={(e) => setStoreTitle(e.target.value)}
              placeholder="Title"
              className="bg-gray-950/50 border-gray-700"
              data-testid="input-store-title"
            />
            <Textarea
              value={storeContent}
              onChange={(e) => setStoreContent(e.target.value)}
              placeholder="Content — observations, findings, decisions..."
              className="bg-gray-950/50 border-gray-700 min-h-[100px]"
              data-testid="input-store-content"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Importance:</label>
              <Select value={storeImportance} onValueChange={setStoreImportance}>
                <SelectTrigger className="w-32 bg-gray-950/50 border-gray-700" data-testid="select-importance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1 — Low</SelectItem>
                  <SelectItem value="0.3">0.3 — Minor</SelectItem>
                  <SelectItem value="0.5">0.5 — Normal</SelectItem>
                  <SelectItem value="0.7">0.7 — Important</SelectItem>
                  <SelectItem value="0.9">0.9 — Critical</SelectItem>
                  <SelectItem value="1.0">1.0 — Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => storeMutation.mutate()}
              disabled={storeMutation.isPending || !storeTitle || !storeContent}
              className="w-full"
              data-testid="button-store"
            >
              {storeMutation.isPending ? "Embedding & Storing..." : "Store Memory"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <Brain className="h-4 w-4" />
              Memory Bank
            </CardTitle>
            <div className="flex gap-2">
              <Select value={listCategory} onValueChange={setListCategory}>
                <SelectTrigger className="w-40 bg-gray-950/50 border-gray-700 h-8 text-xs" data-testid="select-list-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(categories || []).map(c => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={listSort} onValueChange={setListSort}>
                <SelectTrigger className="w-36 bg-gray-950/50 border-gray-700 h-8 text-xs" data-testid="select-list-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest</SelectItem>
                  <SelectItem value="importance">Importance</SelectItem>
                  <SelectItem value="access_count">Most accessed</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <p className="text-sm text-gray-500">Loading memories...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">{memoryList?.total ?? 0} total memories</p>
              {memoryList?.memories?.map(m => (
                <MemoryCard key={m.id} memory={m} onDelete={(id) => deleteMutation.mutate(id)} />
              ))}
              {(!memoryList?.memories || memoryList.memories.length === 0) && (
                <div className="text-center py-8 text-gray-600">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No memories stored yet</p>
                  <p className="text-xs">Use "Ingest All Files" to load quantum circuit data, or store manually</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
