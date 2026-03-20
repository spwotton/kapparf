import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain, Plus, Send, Layers, Globe, BookmarkPlus, CheckCircle2,
  AlertCircle, Clock, Zap, Search, ExternalLink, Copy, Archive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ResearchSession, ResearchQuery, ResearchFinding } from "@shared/schema";

interface ModelInfo {
  id: string;
  provider: string;
  name: string;
  displayName: string;
  available: boolean;
  uncensored?: boolean;
}

interface ProviderStatus {
  provider: string;
  configured: boolean;
}

interface TRELayer {
  id: number;
  name: string;
  description: string;
}

interface ModelsResponse {
  models: ModelInfo[];
  providers: ProviderStatus[];
  layers: TRELayer[];
}

interface SessionDetailResponse {
  session: ResearchSession;
  queries: ResearchQuery[];
  findings: ResearchFinding[];
}

interface QueryResultItem {
  provider: string;
  model: string;
  response: string;
  layer: number;
  layerName: string;
  durationMs: number;
  error?: string;
}

function ProviderIndicators({ providers }: { providers: ProviderStatus[] }) {
  return (
    <div className="flex items-center gap-2" data-testid="provider-indicators">
      {providers.map(p => (
        <div key={p.provider} className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${p.configured ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
          />
          <span className="text-xs font-mono text-muted-foreground capitalize">{p.provider}</span>
        </div>
      ))}
    </div>
  );
}

function confidenceBadge(confidence: string) {
  const variants: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    plausible: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    unverified: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    contradicted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variants[confidence] || variants.unverified}`}>
      {confidence}
    </span>
  );
}

function categoryBadge(category: string) {
  const colors: Record<string, string> = {
    entity: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    event: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    claim: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    evidence: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    signal: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    pattern: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colors[category] || colors.claim}`}>
      {category}
    </span>
  );
}

export default function ResearchPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [queryPrompt, setQueryPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedLayer, setSelectedLayer] = useState("1");
  const [fetchUrlInput, setFetchUrlInput] = useState("");
  const [fetchedContent, setFetchedContent] = useState<{ title: string; content: string; url: string } | null>(null);
  const [queryResults, setQueryResults] = useState<QueryResultItem[]>([]);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingContent, setFindingContent] = useState("");
  const [findingCategory, setFindingCategory] = useState("claim");
  const [findingConfidence, setFindingConfidence] = useState("plausible");

  const { data: modelsData, isLoading: modelsLoading } = useQuery<ModelsResponse>({
    queryKey: ["/api/research/models"],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<ResearchSession[]>({
    queryKey: ["/api/research/sessions"],
  });

  const { data: sessionDetail, isLoading: detailLoading } = useQuery<SessionDetailResponse>({
    queryKey: ["/api/research/sessions", activeSessionId],
    enabled: !!activeSessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/research/sessions", { title, status: "active" });
      return res.json();
    },
    onSuccess: (data: ResearchSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/research/sessions"] });
      setActiveSessionId(data.id);
      setNewSessionTitle("");
      toast({ title: t("research.sessionCreated") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const singleQueryMutation = useMutation({
    mutationFn: async (params: { sessionId: string; prompt: string; provider: string; model: string; layer: number }) => {
      const res = await apiRequest("POST", "/api/research/query", params);
      return res.json();
    },
    onSuccess: (data) => {
      setQueryResults(prev => [data.result, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["/api/research/sessions", activeSessionId] });
      toast({ title: t("research.queryComplete") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const recursiveQueryMutation = useMutation({
    mutationFn: async (params: { sessionId: string; prompt: string }) => {
      const res = await apiRequest("POST", "/api/research/query/recursive", params);
      return res.json();
    },
    onSuccess: (data) => {
      setQueryResults(data.results || []);
      queryClient.invalidateQueries({ queryKey: ["/api/research/sessions", activeSessionId] });
      toast({ title: t("research.deepResearchComplete") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const saveFindingMutation = useMutation({
    mutationFn: async (finding: { sessionId: string; title: string; content: string; category: string; confidence: string }) => {
      const res = await apiRequest("POST", "/api/research/findings", finding);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research/sessions", activeSessionId] });
      setFindingTitle("");
      setFindingContent("");
      toast({ title: t("research.findingSaved") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const webFetchMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/research/web/fetch", { url });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast({ title: t("common.error"), description: data.error, variant: "destructive" });
      } else {
        setFetchedContent({ title: data.title, content: data.content, url: data.url });
      }
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const handleSingleQuery = () => {
    if (!activeSessionId || !queryPrompt || !selectedModel) return;
    const model = modelsData?.models.find(m => m.id === selectedModel);
    if (!model) return;
    singleQueryMutation.mutate({
      sessionId: activeSessionId,
      prompt: queryPrompt,
      provider: model.provider,
      model: model.name,
      layer: parseInt(selectedLayer),
    });
  };

  const handleDeepResearch = () => {
    if (!activeSessionId || !queryPrompt) return;
    recursiveQueryMutation.mutate({
      sessionId: activeSessionId,
      prompt: queryPrompt,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("social.copied") });
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast({ title: t("social.copied") });
    }
  };

  const models = modelsData?.models || [];
  const providers = modelsData?.providers || [];
  const layers = modelsData?.layers || [];
  const isQuerying = singleQueryMutation.isPending || recursiveQueryMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-research-title">
            {t("research.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-research-description">
            {t("research.description")}
          </p>
        </div>
        {!modelsLoading && <ProviderIndicators providers={providers} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t("research.sessions")}</CardTitle>
              <CardDescription className="text-xs">{t("research.sessionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t("research.newSessionPlaceholder")}
                  value={newSessionTitle}
                  onChange={e => setNewSessionTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && newSessionTitle.trim() && createSessionMutation.mutate(newSessionTitle.trim())}
                  data-testid="input-new-session"
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => newSessionTitle.trim() && createSessionMutation.mutate(newSessionTitle.trim())}
                  disabled={!newSessionTitle.trim() || createSessionMutation.isPending}
                  data-testid="button-create-session"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {sessionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-1">
                    {(sessions || []).map(session => (
                      <button
                        key={session.id}
                        onClick={() => setActiveSessionId(session.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          activeSessionId === session.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-foreground"
                        }`}
                        data-testid={`button-session-${session.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{session.title}</span>
                          <Badge variant={session.status === "active" ? "default" : "secondary"} className="text-[10px] shrink-0">
                            {session.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                    {(!sessions || sessions.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4">{t("research.noSessions")}</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t("research.availableModels")}</CardTitle>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-1">
                    {models.map(model => (
                      <div key={model.id} className="flex items-center justify-between py-1 px-2 rounded text-xs" data-testid={`model-${model.id}`}>
                        <span className="truncate font-mono">{model.displayName}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {model.uncensored && (
                            <Badge variant="outline" className="text-[9px] px-1 border-amber-500 text-amber-600">UC</Badge>
                          )}
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${model.available ? "bg-emerald-500" : "bg-zinc-300"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {!activeSessionId ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground">{t("research.selectSession")}</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="query" className="space-y-4">
              <TabsList data-testid="research-tabs">
                <TabsTrigger value="query" data-testid="tab-query">
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {t("research.query")}
                </TabsTrigger>
                <TabsTrigger value="deep" data-testid="tab-deep">
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  {t("research.deepResearch")}
                </TabsTrigger>
                <TabsTrigger value="web" data-testid="tab-web">
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  {t("research.webFetch")}
                </TabsTrigger>
                <TabsTrigger value="findings" data-testid="tab-findings">
                  <BookmarkPlus className="h-3.5 w-3.5 mr-1.5" />
                  {t("research.findings")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="query" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t("research.singleQuery")}</CardTitle>
                    <CardDescription className="text-xs">{t("research.singleQueryDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger data-testid="select-model">
                          <SelectValue placeholder={t("research.selectModel")} />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                        <SelectTrigger data-testid="select-layer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {layers.map(l => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              L{l.id} — {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder={t("research.promptPlaceholder")}
                      value={queryPrompt}
                      onChange={e => setQueryPrompt(e.target.value)}
                      rows={4}
                      data-testid="textarea-query-prompt"
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSingleQuery}
                        disabled={!queryPrompt.trim() || !selectedModel || isQuerying}
                        data-testid="button-send-query"
                        className="flex-1"
                      >
                        {singleQueryMutation.isPending ? (
                          <><Clock className="h-4 w-4 mr-2 animate-spin" />{t("research.querying")}</>
                        ) : (
                          <><Send className="h-4 w-4 mr-2" />{t("research.sendQuery")}</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeepResearch}
                        disabled={!queryPrompt.trim() || isQuerying}
                        data-testid="button-deep-research"
                      >
                        {recursiveQueryMutation.isPending ? (
                          <><Clock className="h-4 w-4 mr-2 animate-spin" />{t("research.running")}</>
                        ) : (
                          <><Zap className="h-4 w-4 mr-2" />{t("research.deepResearch")}</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {queryResults.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("research.results")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[600px]">
                        <div className="space-y-4">
                          {queryResults.map((result, idx) => (
                            <div key={idx} className="border rounded-lg p-4 space-y-2" data-testid={`result-${idx}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    L{result.layer} {result.layerName}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-mono">{result.model}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{(result.durationMs / 1000).toFixed(1)}s</span>
                                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.response)} data-testid={`button-copy-result-${idx}`}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {result.error ? (
                                <div className="flex items-center gap-2 text-destructive text-sm">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>{result.error}</span>
                                </div>
                              ) : (
                                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 font-mono">
                                  {result.response}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="deep" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t("research.deepResearch")}</CardTitle>
                    <CardDescription className="text-xs">{t("research.deepResearchDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder={t("research.deepPromptPlaceholder")}
                      value={queryPrompt}
                      onChange={e => setQueryPrompt(e.target.value)}
                      rows={5}
                      data-testid="textarea-deep-prompt"
                      className="resize-none"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {layers.map(l => (
                        <Badge key={l.id} variant="outline" className="text-[10px]">
                          L{l.id} {l.name}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      onClick={handleDeepResearch}
                      disabled={!queryPrompt.trim() || isQuerying}
                      className="w-full"
                      data-testid="button-run-deep-research"
                    >
                      {recursiveQueryMutation.isPending ? (
                        <><Clock className="h-4 w-4 mr-2 animate-spin" />{t("research.runningDeep")}</>
                      ) : (
                        <><Layers className="h-4 w-4 mr-2" />{t("research.runDeepResearch")}</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {queryResults.length > 0 && (
                  <div className="space-y-3">
                    {queryResults.map((result, idx) => (
                      <Card key={idx} data-testid={`deep-result-${idx}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Badge className="text-xs">L{result.layer}</Badge>
                              {result.layerName}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">{result.model}</span>
                              <span className="text-xs text-muted-foreground">{(result.durationMs / 1000).toFixed(1)}s</span>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.response)} data-testid={`button-copy-deep-${idx}`}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {result.error ? (
                            <div className="text-destructive text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />{result.error}
                            </div>
                          ) : (
                            <div className="text-sm whitespace-pre-wrap leading-relaxed font-mono">{result.response}</div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="web" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t("research.webFetch")}</CardTitle>
                    <CardDescription className="text-xs">{t("research.webFetchDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={fetchUrlInput}
                        onChange={e => setFetchUrlInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && fetchUrlInput.trim() && webFetchMutation.mutate(fetchUrlInput.trim())}
                        data-testid="input-fetch-url"
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => fetchUrlInput.trim() && webFetchMutation.mutate(fetchUrlInput.trim())}
                        disabled={!fetchUrlInput.trim() || webFetchMutation.isPending}
                        data-testid="button-fetch-url"
                      >
                        {webFetchMutation.isPending ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <><Search className="h-4 w-4 mr-1.5" />{t("research.fetch")}</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {fetchedContent && (
                  <Card data-testid="fetched-content">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm truncate">{fetchedContent.title || "Untitled"}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(fetchedContent.content)} data-testid="button-copy-fetched">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <a href={fetchedContent.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" data-testid="button-open-url">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </div>
                      </div>
                      <CardDescription className="text-xs font-mono truncate">{fetchedContent.url}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[500px]">
                        <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">{fetchedContent.content.slice(0, 10000)}</pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="findings" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t("research.saveFinding")}</CardTitle>
                    <CardDescription className="text-xs">{t("research.saveFindingDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder={t("research.findingTitlePlaceholder")}
                      value={findingTitle}
                      onChange={e => setFindingTitle(e.target.value)}
                      data-testid="input-finding-title"
                    />
                    <Textarea
                      placeholder={t("research.findingContentPlaceholder")}
                      value={findingContent}
                      onChange={e => setFindingContent(e.target.value)}
                      rows={4}
                      data-testid="textarea-finding-content"
                      className="resize-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={findingCategory} onValueChange={setFindingCategory}>
                        <SelectTrigger data-testid="select-finding-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entity">{t("research.catEntity")}</SelectItem>
                          <SelectItem value="event">{t("research.catEvent")}</SelectItem>
                          <SelectItem value="claim">{t("research.catClaim")}</SelectItem>
                          <SelectItem value="evidence">{t("research.catEvidence")}</SelectItem>
                          <SelectItem value="signal">{t("research.catSignal")}</SelectItem>
                          <SelectItem value="pattern">{t("research.catPattern")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={findingConfidence} onValueChange={setFindingConfidence}>
                        <SelectTrigger data-testid="select-finding-confidence">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">{t("research.confVerified")}</SelectItem>
                          <SelectItem value="plausible">{t("research.confPlausible")}</SelectItem>
                          <SelectItem value="unverified">{t("research.confUnverified")}</SelectItem>
                          <SelectItem value="contradicted">{t("research.confContradicted")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => activeSessionId && findingTitle.trim() && findingContent.trim() && saveFindingMutation.mutate({
                        sessionId: activeSessionId,
                        title: findingTitle.trim(),
                        content: findingContent.trim(),
                        category: findingCategory,
                        confidence: findingConfidence,
                      })}
                      disabled={!findingTitle.trim() || !findingContent.trim() || saveFindingMutation.isPending}
                      className="w-full"
                      data-testid="button-save-finding"
                    >
                      <BookmarkPlus className="h-4 w-4 mr-2" />
                      {saveFindingMutation.isPending ? t("common.loading") : t("research.saveFinding")}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t("research.savedFindings")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : (sessionDetail?.findings?.length || 0) > 0 ? (
                      <ScrollArea className="max-h-[500px]">
                        <div className="space-y-3">
                          {(sessionDetail?.findings || []).map(finding => (
                            <div key={finding.id} className="border rounded-lg p-3 space-y-2" data-testid={`finding-${finding.id}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{finding.title}</span>
                                <div className="flex items-center gap-1.5">
                                  {categoryBadge(finding.category)}
                                  {confidenceBadge(finding.confidence)}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{finding.content}</p>
                              {finding.tags && (finding.tags as string[]).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {(finding.tags as string[]).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-6">{t("research.noFindings")}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {activeSessionId && sessionDetail && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("research.queryHistory")}</CardTitle>
                <CardDescription className="text-xs">
                  {(sessionDetail.queries?.length || 0)} {t("research.queriesInSession")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {detailLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (sessionDetail.queries?.length || 0) > 0 ? (
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {(sessionDetail.queries || []).slice(0, 20).map(q => (
                        <div key={q.id} className="border rounded p-2 text-xs space-y-1" data-testid={`history-query-${q.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px]">L{q.layer}</Badge>
                              <span className="font-mono text-muted-foreground">{q.modelName}</span>
                            </div>
                            <span className="text-muted-foreground">{new Date(q.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="truncate text-foreground/80">{q.prompt}</p>
                          {q.response && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => setQueryResults([{
                                provider: q.modelProvider,
                                model: q.modelName,
                                response: q.response || "",
                                layer: q.layer,
                                layerName: `Layer ${q.layer}`,
                                durationMs: (q.metadata as any)?.durationMs || 0,
                              }])}
                              data-testid={`button-view-query-${q.id}`}
                            >
                              {t("research.viewResult")}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">{t("research.noQueries")}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
