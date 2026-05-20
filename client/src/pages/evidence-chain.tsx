import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Download, Clock, AlertTriangle, Shield, Wifi, Eye, Radio, Church, Plane,
  Smartphone, Volume2, Building, Scale, Trash2, FileText, Hash, Filter
} from "lucide-react";
import type { Incident } from "@shared/schema";
import { INCIDENT_CATEGORIES } from "@shared/schema";

const SEVERITY_CONFIG = [
  { level: 1, label: "LOW", color: "bg-gray-600" },
  { level: 2, label: "MEDIUM", color: "bg-yellow-600" },
  { level: 3, label: "HIGH", color: "bg-orange-600" },
  { level: 4, label: "CRITICAL", color: "bg-amber-600" },
  { level: 5, label: "EMERGENCY", color: "bg-amber-800" },
];

const CATEGORY_ICONS: Record<string, any> = {
  network: Wifi, surveillance: Eye, electronic: Radio, religious: Church,
  drone: Plane, device: Smartphone, acoustic: Volume2, infrastructure: Building,
  legal: Scale, other: AlertTriangle,
};

function getSeverityConfig(level: number) {
  return SEVERITY_CONFIG.find(s => s.level === level) || SEVERITY_CONFIG[2];
}

function formatTimestamp(ts: string | Date) {
  return new Date(ts).toLocaleString("en-US", {
    timeZone: "America/Costa_Rica",
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }) + " CST";
}

function IncidentForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("network");
  const [severity, setSeverity] = useState("3");
  const [location, setLocation] = useState("Tacacorí, Alajuela, CR");
  const [tags, setTags] = useState("");
  const [evidence, setEvidence] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/incidents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-chain/timeline"] });
      toast({ title: "Incident documented", description: "SHA-256 hash generated for chain of custody" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: "Title and description required", variant: "destructive" });
      return;
    }
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      severity: parseInt(severity),
      location: location.trim() || null,
      latitude: 10.0514,
      longitude: -84.2187,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      evidence: evidence ? evidence.split("\n").map(e => e.trim()).filter(Boolean) : [],
      status: "documented",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger data-testid="select-incident-category"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INCIDENT_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Severity</label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger data-testid="select-incident-severity"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEVERITY_CONFIG.map(s => (
                <SelectItem key={s.level} value={String(s.level)}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Title</label>
        <Input
          data-testid="input-incident-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Brief incident title..."
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Description</label>
        <Textarea
          data-testid="input-incident-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Detailed description of what happened..."
          rows={4}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Location</label>
        <Input
          data-testid="input-incident-location"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Evidence (one per line)</label>
        <Textarea
          data-testid="input-incident-evidence"
          value={evidence}
          onChange={e => setEvidence(e.target.value)}
          placeholder="Screenshot: filename.png&#10;Log entry: ...&#10;Witness: ..."
          rows={3}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
        <Input
          data-testid="input-incident-tags"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="finspy, tr-069, kyndryl..."
        />
      </div>
      <Button
        data-testid="button-submit-incident"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="w-full bg-amber-600 hover:bg-amber-700"
      >
        {mutation.isPending ? "Documenting..." : "Document Incident"}
      </Button>
    </div>
  );
}

function TimelineEntry({ entry }: { entry: any }) {
  const { type, data } = entry;

  if (type === "incident") {
    const sev = getSeverityConfig(data.severity);
    const Icon = CATEGORY_ICONS[data.category] || AlertTriangle;
    return (
      <div className="flex gap-3 border-l-4 border-amber-600 pl-4 py-3" data-testid={`timeline-incident-${data.id}`}>
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={`${sev.color} text-white text-[10px]`} data-testid={`badge-severity-${data.id}`}>{sev.label}</Badge>
            <Badge variant="outline" className="text-[10px]">{data.category}</Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">{formatTimestamp(data.timestamp)}</span>
          </div>
          <h4 className="text-sm font-semibold">{data.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
          {data.location && <p className="text-[10px] text-muted-foreground mt-1">📍 {data.location}</p>}
          {data.hash && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono truncate" title={data.hash}>
              <Hash className="w-3 h-3 inline mr-1" />SHA-256: {data.hash.slice(0, 32)}...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (type === "event") {
    return (
      <div className="flex gap-3 border-l-4 border-blue-600/50 pl-4 py-2" data-testid={`timeline-event-${data.id}`}>
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
            <Radio className="w-3 h-3 text-blue-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">{data.domain}</Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">{formatTimestamp(data.timestamp)}</span>
          </div>
          <p className="text-xs"><span className="font-medium">{data.eventType}</span> — {data.source}{data.frequency ? ` @ ${data.frequency} Hz` : ""}</p>
        </div>
      </div>
    );
  }

  if (type === "correlation") {
    const sev = getSeverityConfig(data.severity);
    return (
      <div className="flex gap-3 border-l-4 border-yellow-600/50 pl-4 py-2" data-testid={`timeline-correlation-${data.id}`}>
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 rounded-full bg-yellow-600/20 flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`${sev.color} text-white text-[10px]`}>CORRELATION</Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">{formatTimestamp(data.timestamp)}</span>
          </div>
          <p className="text-xs font-medium">{data.ruleName}</p>
          <p className="text-xs text-muted-foreground">{data.description}</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function EvidenceChainPage() {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
    refetchInterval: 10000,
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/incidents/count"],
    refetchInterval: 10000,
  });

  const { data: timelineData } = useQuery<{ timeline: any[]; total: number }>({
    queryKey: ["/api/evidence-chain/timeline"],
    refetchInterval: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/incidents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-chain/timeline"] });
      toast({ title: "Incident deleted" });
    },
  });

  const handleExport = () => {
    window.open("/api/evidence-chain/export", "_blank");
    toast({ title: "Evidence package downloading", description: "Self-contained HTML file with all documented evidence" });
  };

  const timeline = timelineData?.timeline || [];
  const filteredTimeline = timeline.filter(entry => {
    if (filterType !== "all" && entry.type !== filterType) return false;
    if (filterCategory !== "all" && entry.type === "incident" && entry.data.category !== filterCategory) return false;
    return true;
  });

  const categoryCounts: Record<string, number> = {};
  for (const inc of incidents) {
    categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1;
  }

  const severityCounts = [0, 0, 0, 0, 0, 0];
  for (const inc of incidents) {
    severityCounts[inc.severity] = (severityCounts[inc.severity] || 0) + 1;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Shield className="w-6 h-6 text-amber-500" />
            Evidence Chain
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Legal-grade incident documentation with SHA-256 integrity hashing
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-incident" className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" /> Log Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Document Incident
                </DialogTitle>
              </DialogHeader>
              <IncidentForm onClose={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button data-testid="button-export-evidence" variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export Package
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500" data-testid="text-incident-count">{countData?.count ?? 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Incidents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500" data-testid="text-event-count">{timeline.filter(t => t.type === "event").length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Signal Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500" data-testid="text-correlation-count">{timeline.filter(t => t.type === "correlation").length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Correlations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-500">{severityCounts[4] + severityCounts[5]}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Critical+</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{Object.keys(categoryCounts).length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Categories</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            <Clock className="w-4 h-4 mr-1" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-incidents">
            <FileText className="w-4 h-4 mr-1" /> Incidents ({incidents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4 space-y-3">
          <div className="flex gap-2 items-center flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-filter-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incident">Incidents</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="correlation">Correlations</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="select-filter-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {INCIDENT_CATEGORIES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredTimeline.length} / {timeline.length} entries
            </span>
          </div>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {filteredTimeline.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No timeline entries yet. Log an incident or wait for signal events.</p>
                </div>
              ) : (
                filteredTimeline.map((entry, i) => (
                  <TimelineEntry key={`${entry.type}-${entry.data.id}-${i}`} entry={entry} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-3">
          {incidents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No incidents documented yet.</p>
                <Button
                  data-testid="button-first-incident"
                  className="mt-4 bg-amber-600 hover:bg-amber-700"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Document First Incident
                </Button>
              </CardContent>
            </Card>
          ) : (
            incidents.map(inc => {
              const sev = getSeverityConfig(inc.severity);
              const Icon = CATEGORY_ICONS[inc.category] || AlertTriangle;
              return (
                <Card key={inc.id} className="border-l-4 border-l-amber-600" data-testid={`card-incident-${inc.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={`${sev.color} text-white text-[10px]`}>{sev.label}</Badge>
                            <Badge variant="outline" className="text-[10px]">{inc.category}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{inc.status}</Badge>
                          </div>
                          <h3 className="text-sm font-semibold">{inc.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{inc.description}</p>
                          {inc.location && <p className="text-[10px] text-muted-foreground mt-1">📍 {inc.location}</p>}
                          {inc.tags && inc.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {inc.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">{tag}</Badge>
                              ))}
                            </div>
                          )}
                          {inc.evidence && inc.evidence.length > 0 && (
                            <div className="mt-2 text-[10px] text-muted-foreground">
                              Evidence: {inc.evidence.join(" | ")}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span><Clock className="w-3 h-3 inline mr-1" />{formatTimestamp(inc.timestamp)}</span>
                            {inc.hash && (
                              <span className="font-mono truncate max-w-[200px]" title={inc.hash}>
                                <Hash className="w-3 h-3 inline mr-1" />{inc.hash.slice(0, 16)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        data-testid={`button-delete-incident-${inc.id}`}
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                        onClick={() => deleteMutation.mutate(inc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <Card className="border-yellow-600/30 bg-yellow-600/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-yellow-500">
            <Scale className="w-4 h-4" /> Legal Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>All incidents are SHA-256 hashed at creation time for chain-of-custody integrity. Export generates a self-contained HTML evidence package for submission to:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-2 text-[11px]">
            <span>🇺🇸 US Embassy San José: 506-2220-3127</span>
            <span>🇨🇷 Defensoría de los Habitantes: 4000-8500</span>
            <span>⚖️ Sala Constitucional IV: 2295-3696</span>
            <span>🚔 OIJ: 800-800-0645</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Constitutional protections: Arts. 36, 37, 39, 40, 41, 48 CR Constitution • Vienna Convention Art. 36
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
