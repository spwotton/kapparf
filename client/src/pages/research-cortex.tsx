import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Database, Search, AlertTriangle, Zap, Download, FileText, Brain,
  RefreshCw, Play, Eye, Edit3, Copy, ChevronDown, ChevronRight, Loader2,
  Target, Layers, GitBranch, Clock, CheckCircle2, XCircle, ArrowRight,
} from "lucide-react";

interface CortexDocument {
  id: string;
  filename: string;
  title: string;
  sizeBytes: number;
  wordCount: number;
  lastModified: number;
  indexed: boolean;
  indexedAt?: number;
  claimCount: number;
  summary?: string;
  keyEntities: string[];
  keyConstants: string[];
  domains: string[];
}

interface CortexClaim {
  id: string;
  docId: string;
  docTitle: string;
  text: string;
  category: string;
  confidence: number;
  tags: string[];
  lineRef?: string;
}

interface Contradiction {
  id: string;
  claimA: string;
  claimB: string;
  docA: string;
  docB: string;
  description: string;
  severity: "low" | "medium" | "high";
  resolved: boolean;
}

interface Gap {
  id: string;
  domain: string;
  description: string;
  suggestedResearch: string;
  relatedDocs: string[];
  priority: "low" | "medium" | "high" | "critical";
}

interface Facet {
  id: string;
  name: string;
  angle: string;
  description: string;
  assignedModel?: string;
  status: string;
  result?: string;
  durationMs?: number;
}

interface SynthesisRun {
  id: string;
  topic: string;
  facets: Facet[];
  dialogueMessages: any[];
  status: string;
  startedAt: number;
  completedAt?: number;
  synthesis?: string;
  contradictions: Contradiction[];
  gaps: Gap[];
}

interface CortexStatus {
  documents: CortexDocument[];
  claimCount: number;
  contradictions: Contradiction[];
  gaps: Gap[];
  lastIndexed: number;
  indexing: boolean;
  synthesisRuns: { id: string; topic: string; status: string; facetCount: number; messageCount: number; startedAt: number; completedAt?: number }[];
  domainMap: Record<string, string[]>;
}

const categoryColors: Record<string, string> = {
  constant: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  entity: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  mechanism: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  evidence: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  prediction: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  connection: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
  definition: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30",
};

const severityColors: Record<string, string> = {
  low: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  medium: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  high: "bg-red-500/10 text-red-700 dark:text-red-400",
  critical: "bg-red-600/20 text-red-600 dark:text-red-300",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  error: XCircle,
};

export default function ResearchCortexPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [synthTopic, setSynthTopic] = useState("");
  const [facetCount, setFacetCount] = useState(12);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [expandedFacets, setExpandedFacets] = useState<Set<string>>(new Set());
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editing, setEditing] = useState(false);

  const { data: status, isLoading } = useQuery<CortexStatus>({
    queryKey: ["/api/research-cortex/status"],
    refetchInterval: 5000,
  });

  const { data: claims } = useQuery<CortexClaim[]>({
    queryKey: ["/api/research-cortex/claims", selectedDoc, categoryFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDoc) params.set("docId", selectedDoc);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/research-cortex/claims?${params}`);
      return res.json();
    },
    enabled: !!status && status.claimCount > 0,
  });

  const { data: docContent } = useQuery<{ content: string; filename: string }>({
    queryKey: ["/api/research-cortex/documents", viewingDoc],
    enabled: !!viewingDoc,
  });

  const { data: activeSynthesis } = useQuery<SynthesisRun>({
    queryKey: ["/api/research-cortex/synthesis", activeRunId],
    enabled: !!activeRunId,
    refetchInterval: activeRunId ? 3000 : false,
  });

  const indexMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/research-cortex/index"),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/research-cortex/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/research-cortex/claims"] });
      toast({ title: "Indexing Complete", description: `${data.indexed} docs indexed, ${data.totalClaims} claims extracted` });
    },
    onError: (err: any) => toast({ title: "Index Failed", description: err.message, variant: "destructive" }),
  });

  const synthMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/research-cortex/synthesize", { topic: synthTopic, facetCount, includeDialogue: true });
      return res.json();
    },
    onSuccess: (data) => {
      setActiveRunId(data.runId);
      toast({ title: "Synthesis Started", description: `${data.facetCount} facets dispatched across models` });
    },
    onError: (err: any) => toast({ title: "Synthesis Failed", description: err.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/research-cortex/documents/${viewingDoc}`, { content: editContent });
    },
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/research-cortex/documents", viewingDoc] });
      toast({ title: "Document Saved" });
    },
  });

  const toggleFacet = (id: string) => {
    const next = new Set(expandedFacets);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedFacets(next);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const downloadExport = (format: string) => {
    window.open(`/api/research-cortex/export/${format}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-cortex">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = status!;

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between" data-testid="cortex-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Research Cortex
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Living knowledge engine — {s.documents.length} documents, {s.claimCount} claims, {s.contradictions.length} contradictions, {s.gaps.length} gaps
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => indexMutation.mutate()}
            disabled={indexMutation.isPending || s.indexing}
            variant="outline"
            size="sm"
            data-testid="button-index"
          >
            {indexMutation.isPending || s.indexing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            {s.indexing ? "Indexing..." : "Index Corpus"}
          </Button>
          <Select onValueChange={downloadExport}>
            <SelectTrigger className="w-[140px]" data-testid="select-export">
              <Download className="w-4 h-4 mr-1" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="latex">LaTeX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="corpus" className="w-full">
        <TabsList className="grid w-full grid-cols-5" data-testid="cortex-tabs">
          <TabsTrigger value="corpus" data-testid="tab-corpus">
            <BookOpen className="w-4 h-4 mr-1" /> Corpus
          </TabsTrigger>
          <TabsTrigger value="claims" data-testid="tab-claims">
            <Database className="w-4 h-4 mr-1" /> Claims
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">
            <AlertTriangle className="w-4 h-4 mr-1" /> Analysis
          </TabsTrigger>
          <TabsTrigger value="synthesis" data-testid="tab-synthesis">
            <Zap className="w-4 h-4 mr-1" /> Synthesis
          </TabsTrigger>
          <TabsTrigger value="reader" data-testid="tab-reader">
            <FileText className="w-4 h-4 mr-1" /> Reader
          </TabsTrigger>
        </TabsList>

        <TabsContent value="corpus" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {s.documents.map(doc => (
              <Card
                key={doc.id}
                className={`cursor-pointer transition-all hover:border-purple-500/50 ${selectedDoc === doc.id ? "border-purple-500 ring-1 ring-purple-500/30" : ""}`}
                onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
                data-testid={`card-doc-${doc.id}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm leading-tight">{doc.title}</CardTitle>
                  <CardDescription className="text-xs">{doc.filename}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {doc.domains.slice(0, 4).map(d => (
                      <Badge key={d} variant="outline" className="text-[10px] px-1.5 py-0">{d}</Badge>
                    ))}
                    {doc.domains.length > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{doc.domains.length - 4}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Words</div>
                      <div className="text-sm font-mono font-medium">{doc.wordCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Claims</div>
                      <div className="text-sm font-mono font-medium">{doc.claimCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Size</div>
                      <div className="text-sm font-mono font-medium">{(doc.sizeBytes / 1024).toFixed(0)}K</div>
                    </div>
                  </div>
                  {doc.keyEntities.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate">
                      {doc.keyEntities.slice(0, 5).join(", ")}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2"
                      onClick={(e) => { e.stopPropagation(); setViewingDoc(doc.id); }}
                      data-testid={`button-view-${doc.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2"
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(doc.keyEntities.join(", ")); }}
                      data-testid={`button-copy-entities-${doc.id}`}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Entities
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {Object.keys(s.domainMap).length > 0 && (
            <Card data-testid="card-domain-map">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Domain Map
                </CardTitle>
                <CardDescription>Cross-domain coverage across the corpus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(s.domainMap).map(([domain, docIds]) => (
                    <div key={domain} className="bg-muted/30 dark:bg-muted/10 rounded-lg p-2 border">
                      <div className="text-xs font-medium">{domain}</div>
                      <div className="text-sm font-mono text-muted-foreground">{(docIds as string[]).length} docs</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-search-claims"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="constant">Constants</SelectItem>
                <SelectItem value="entity">Entities</SelectItem>
                <SelectItem value="mechanism">Mechanisms</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="prediction">Predictions</SelectItem>
                <SelectItem value="connection">Connections</SelectItem>
                <SelectItem value="definition">Definitions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2" data-testid="claims-list">
            {claims && claims.length > 0 ? (
              claims.slice(0, 100).map(claim => (
                <div
                  key={claim.id}
                  className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-3 hover:border-purple-500/30 transition-colors"
                  data-testid={`claim-${claim.id}`}
                >
                  <div className="flex items-start gap-2">
                    <Badge className={`${categoryColors[claim.category] || ""} text-[10px] shrink-0`} variant="outline">
                      {claim.category}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{claim.text}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground font-mono">{claim.docTitle}</span>
                        {claim.lineRef && <span className="text-xs text-muted-foreground font-mono">{claim.lineRef}</span>}
                        <span className="text-xs text-muted-foreground">conf: {claim.confidence.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 px-2 shrink-0" onClick={() => copyToClipboard(claim.text)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  {claim.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {claim.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0 bg-muted/50 dark:bg-muted/20 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="text-no-claims">
                {s.claimCount === 0 ? "No claims indexed yet. Click 'Index Corpus' to begin." : "No claims match your filters."}
              </div>
            )}
            {claims && claims.length > 100 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                Showing 100 of {claims.length} claims. Use search to narrow results.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-contradictions">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-red-500" />
                  Contradictions ({s.contradictions.length})
                </CardTitle>
                <CardDescription>Cross-document inconsistencies detected by the indexer</CardDescription>
              </CardHeader>
              <CardContent>
                {s.contradictions.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {s.claimCount > 0 ? "No contradictions detected." : "Index the corpus first to detect contradictions."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {s.contradictions.map(c => (
                      <div key={c.id} className="rounded-lg border p-3 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={severityColors[c.severity]} variant="outline">{c.severity}</Badge>
                          <span className="text-sm font-medium">{c.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div>{c.docA}: "{c.claimA.slice(0, 80)}..."</div>
                          <div className="flex items-center gap-1 my-0.5"><ArrowRight className="w-3 h-3" /> vs</div>
                          <div>{c.docB}: "{c.claimB.slice(0, 80)}..."</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-gaps">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  Knowledge Gaps ({s.gaps.length})
                </CardTitle>
                <CardDescription>Domains and cross-references needing deeper investigation</CardDescription>
              </CardHeader>
              <CardContent>
                {s.gaps.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {s.claimCount > 0 ? "No gaps identified." : "Index the corpus first to detect gaps."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {s.gaps.map(g => (
                      <div key={g.id} className="rounded-lg border p-3 bg-amber-500/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={severityColors[g.priority]} variant="outline">{g.priority}</Badge>
                          <span className="text-sm font-medium">{g.domain}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{g.description}</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{g.suggestedResearch}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="synthesis" className="space-y-4">
          <Card data-testid="card-synth-launch">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Dodecahedral Synthesis Engine
              </CardTitle>
              <CardDescription>
                Slice your research topic into {facetCount} angular facets, dispatch each to a different model optimized for that perspective, then synthesize into unified findings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Enter research topic for multi-model synthesis... e.g. 'Cross-reference DARPA Blackjack ground infrastructure with observed surveillance patterns in Costa Rica — identify any non-public linkages'"
                value={synthTopic}
                onChange={(e) => setSynthTopic(e.target.value)}
                rows={3}
                data-testid="input-synth-topic"
              />
              <div className="flex gap-2 items-center">
                <Select value={String(facetCount)} onValueChange={(v) => setFacetCount(Number(v))}>
                  <SelectTrigger className="w-[160px]" data-testid="select-facet-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Facets</SelectItem>
                    <SelectItem value="6">6 Facets</SelectItem>
                    <SelectItem value="8">8 Facets</SelectItem>
                    <SelectItem value="12">12 Facets (Full)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => synthMutation.mutate()}
                  disabled={!synthTopic.trim() || synthMutation.isPending}
                  data-testid="button-launch-synthesis"
                >
                  {synthMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                  Launch Synthesis
                </Button>
              </div>
            </CardContent>
          </Card>

          {s.synthesisRuns.length > 0 && (
            <Card data-testid="card-synth-history">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Previous Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {s.synthesisRuns.map(r => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-muted/30 ${activeRunId === r.id ? "border-purple-500 bg-purple-500/5" : ""}`}
                      onClick={() => setActiveRunId(r.id)}
                      data-testid={`synth-run-${r.id}`}
                    >
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                      <span className="text-sm flex-1 truncate">{r.topic}</span>
                      <span className="text-xs text-muted-foreground">{r.facetCount} facets</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSynthesis && (
            <Card data-testid="card-active-synthesis">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  {activeSynthesis.topic}
                </CardTitle>
                <CardDescription>
                  Status: {activeSynthesis.status} | {activeSynthesis.facets.filter(f => f.status === "completed").length}/{activeSynthesis.facets.length} facets complete
                  {activeSynthesis.completedAt && ` | ${((activeSynthesis.completedAt - activeSynthesis.startedAt) / 1000).toFixed(1)}s total`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  {activeSynthesis.facets.map(facet => {
                    const StatusIcon = statusIcons[facet.status] || Clock;
                    const isExpanded = expandedFacets.has(facet.id);
                    return (
                      <div key={facet.id} className="border rounded-lg" data-testid={`facet-${facet.id}`}>
                        <div
                          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/30"
                          onClick={() => toggleFacet(facet.id)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                          <StatusIcon className={`w-4 h-4 shrink-0 ${facet.status === "running" ? "animate-spin" : ""} ${facet.status === "completed" ? "text-green-500" : facet.status === "error" ? "text-red-500" : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium flex-1">{facet.name}</span>
                          <Badge variant="outline" className="text-[10px]">{facet.angle}</Badge>
                          {facet.assignedModel && (
                            <span className="text-[10px] text-muted-foreground">{facet.assignedModel}</span>
                          )}
                          {facet.durationMs && (
                            <span className="text-[10px] text-muted-foreground font-mono">{(facet.durationMs / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                        {isExpanded && facet.result && (
                          <div className="p-3 border-t bg-muted/10">
                            <div className="flex justify-end mb-1">
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => copyToClipboard(facet.result!)}>
                                <Copy className="w-3 h-3 mr-1" /> Copy
                              </Button>
                            </div>
                            <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto">
                              {facet.result}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {activeSynthesis.synthesis && (
                  <Card className="border-purple-500/30 bg-purple-500/5" data-testid="card-unified-synthesis">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Unified Synthesis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-end mb-1">
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => copyToClipboard(activeSynthesis.synthesis!)}>
                          <Copy className="w-3 h-3 mr-1" /> Copy All
                        </Button>
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                        {activeSynthesis.synthesis}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSynthesis.dialogueMessages.length > 0 && (
                  <Card data-testid="card-dialogue">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Model Dialogue ({activeSynthesis.dialogueMessages.length} messages)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {activeSynthesis.dialogueMessages.map((msg: any) => (
                          <div key={msg.id} className="text-xs border rounded p-2 bg-muted/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[9px]">{msg.role}</Badge>
                              <span className="font-medium">{msg.fromModel}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{msg.toModel}</span>
                              {msg.durationMs && <span className="text-muted-foreground ml-auto">{(msg.durationMs / 1000).toFixed(1)}s</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reader" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-1">
              <div className="text-sm font-medium mb-2">Documents</div>
              {s.documents.map(doc => (
                <div
                  key={doc.id}
                  className={`rounded-lg border p-2 cursor-pointer text-sm hover:bg-muted/30 ${viewingDoc === doc.id ? "border-purple-500 bg-purple-500/5" : ""}`}
                  onClick={() => { setViewingDoc(doc.id); setEditing(false); }}
                  data-testid={`reader-doc-${doc.id}`}
                >
                  <div className="font-medium truncate text-xs">{doc.title}</div>
                  <div className="text-[10px] text-muted-foreground">{doc.wordCount.toLocaleString()} words</div>
                </div>
              ))}
            </div>
            <div className="md:col-span-3">
              {viewingDoc && docContent ? (
                <Card data-testid="card-doc-viewer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{docContent.filename}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => copyToClipboard(docContent.content)}
                          data-testid="button-copy-doc"
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy All
                        </Button>
                        <Button
                          size="sm"
                          variant={editing ? "default" : "ghost"}
                          className="h-7 text-xs"
                          onClick={() => {
                            if (!editing) {
                              setEditContent(docContent.content);
                              setEditing(true);
                            } else {
                              saveMutation.mutate();
                            }
                          }}
                          data-testid="button-edit-doc"
                        >
                          <Edit3 className="w-3 h-3 mr-1" /> {editing ? "Save" : "Edit"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editing ? (
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="font-mono text-sm min-h-[500px]"
                        data-testid="textarea-doc-edit"
                      />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto bg-muted/10 dark:bg-muted/5 rounded-lg p-3 border">
                        {docContent.content}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-20 text-muted-foreground" data-testid="text-select-doc">
                  Select a document from the sidebar to view, edit, or copy its contents.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
