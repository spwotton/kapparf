import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ZoomableImage } from "@/components/zoomable-image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Camera, ScanEye, Mountain, Maximize2, RefreshCw, ExternalLink,
  Globe, Radio, MapPin, AlertTriangle, Eye, Satellite, Upload,
  Activity, Waves, Search, ChevronRight, Zap, Shield, FileText,
  Hexagon, Volume2, Play, Square, Microscope
} from "lucide-react";
import { DemodexCameraView } from "@/components/demodex-camera";

interface ImageAnalysis {
  id: string;
  label: string;
  originalPath: string;
  outputs: { method: string; description: string; path: string; }[];
  timestamp: string;
  dimensions: string;
  findings: string[];
}

interface OvsicoriCamera {
  id: string;
  name: string;
  volcano: string;
  url: string;
  status: string;
  lastCheck: string;
}

interface ImageryData {
  analyses: ImageAnalysis[];
  ovsicori: OvsicoriCamera[];
  observerPosition: { lat: number; lon: number; elevation: number; };
}

interface NuforcSighting {
  id: string;
  date: string;
  city: string | null;
  state: string | null;
  country: string;
  shape: string | null;
  summary: string;
  reported: string;
  media: boolean;
  explanation: string | null;
  lat: number;
  lon: number;
  tier?: number;
  source?: string;
}

interface NuforcData {
  sightings: NuforcSighting[];
  stats: {
    totalSightings: number;
    byCountry: Record<string, number>;
    byShape: Record<string, number>;
    dateRange: { earliest: string; latest: string };
    nuforc: {
      totalReports: number;
      costaRicaReports: number;
      mexicoReports: number;
      venezuelaReports: number;
      mapboxToken: string;
      mapboxStyle: string;
      tilesetUrl: string;
      reportBaseUrl: string;
      audioArchive: string;
      audioArchiveYears: string;
    };
    observerProximity: {
      id: string;
      city: string | null;
      distanceKm: number;
      date: string;
      shape: string | null;
    }[];
  };
}

interface InvestigationPreset {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  zoom: number;
  layer?: string;
  investigationNote?: string;
}

interface CrossDomainMatch {
  a: string;
  value: number;
  match: string;
  matchValue: number;
  deviationPct: number;
}

interface ResearchData {
  constants: {
    CROSS_DOMAIN_MATCHES: CrossDomainMatch[];
    ARCHAEOACOUSTIC_SITES: { name: string; location: string; resonanceHz: number; material: string; note: string }[];
    BIOGEOMETRY: { BG3_COMPONENTS: string[]; PRINCIPLE: string };
    GOS_MASTER_CONSTANTS: Record<string, string>;
    GOS_GENE_FREQUENCIES: Record<string, number>;
  };
  crossDomainAnalysis: {
    summary: string;
    keyFindings: string[];
    sources: string[];
  };
}

interface ScanResult {
  id: string;
  anomalyScore: number;
  spokeEdgeCount: number;
  gapEdgeCount: number;
  base53Entropy: number;
  cloakedCandidates: number;
  findings: string[];
  overlayPng?: string | null;
  sectorBreakdown?: Record<string, any>;
  filters: { method: string; description: string; stats?: Record<string, any>; imagePng?: string | null; }[];
}

interface AnomalyFeedItem {
  type: string;
  id: string;
  timestamp: string;
  score: number;
  summary: string;
  details: Record<string, any>;
  findings?: string[];
  location: { lat: number; lon: number; } | null;
}

const SHAPE_COLORS: Record<string, string> = {
  Triangle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Disk: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Circle: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Sphere: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Orb: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Light: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Oval: "bg-green-500/20 text-green-400 border-green-500/30",
  Formation: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  Fireball: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Changing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Chevron: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="relative border border-amber-500/30 bg-amber-500/5 rounded-lg p-3 flex items-start gap-3" data-testid="disclaimer-banner">
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-amber-200 font-semibold">Speculative Research Platform</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          This tool combines real satellite imagery, seismic data, and NUFORC reports with experimental 24-gon (icositetragon)
          anomaly detection and base-53 frequency analysis. Results are exploratory and should not be treated as conclusive evidence.
          AAWSAP/DIRD references are from publicly released FOIA documents. All external data sources are credited.
        </p>
      </div>
      <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => setDismissed(true)} data-testid="btn-dismiss-disclaimer">
        Dismiss
      </Button>
    </div>
  );
}

function SatelliteHunterTab() {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customLat, setCustomLat] = useState("10.0514");
  const [customLon, setCustomLon] = useState("-84.2187");

  const { data: presetsData } = useQuery<{ presets: InvestigationPreset[] }>({
    queryKey: ["/api/artifact-hunter/presets"],
  });

  const lat = selectedPreset && selectedPreset !== "custom"
    ? presetsData?.presets.find(p => p.id === selectedPreset)?.lat ?? 10.0514
    : parseFloat(customLat) || 10.0514;
  const lon = selectedPreset && selectedPreset !== "custom"
    ? presetsData?.presets.find(p => p.id === selectedPreset)?.lon ?? -84.2187
    : parseFloat(customLon) || -84.2187;

  const { data: satData, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/artifact-hunter/satellite", lat, lon],
    queryFn: () => fetch(`/api/artifact-hunter/satellite?lat=${lat}&lon=${lon}&zoom=6`).then(r => r.json()),
    enabled: false,
  });

  const activePreset = presetsData?.presets.find(p => p.id === selectedPreset);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Satellite className="h-5 w-5" />
            NASA GIBS Satellite Tile Viewer
          </CardTitle>
          <CardDescription className="text-xs">
            Free NASA Global Imagery Browse Services — MODIS Terra/Aqua, VIIRS SNPP. Select a preset investigation target or enter custom coordinates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Investigation Preset</label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-sat-preset">
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Coordinates</SelectItem>
                  {(presetsData?.presets || []).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Latitude</label>
              <Input
                value={selectedPreset && selectedPreset !== "custom" ? String(lat) : customLat}
                onChange={e => { setCustomLat(e.target.value); setSelectedPreset("custom"); }}
                className="h-8 text-xs font-mono"
                data-testid="input-sat-lat"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Longitude</label>
              <Input
                value={selectedPreset && selectedPreset !== "custom" ? String(lon) : customLon}
                onChange={e => { setCustomLon(e.target.value); setSelectedPreset("custom"); }}
                className="h-8 text-xs font-mono"
                data-testid="input-sat-lon"
              />
            </div>
          </div>

          <Button size="sm" onClick={() => refetch()} disabled={isLoading} data-testid="btn-fetch-satellite">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
            Fetch Tile
          </Button>

          {activePreset && (
            <div className="p-3 rounded border bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Hexagon className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold">{activePreset.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{activePreset.description}</p>
              <p className="text-[10px] text-amber-400 mt-1 font-mono">{activePreset.investigationNote}</p>
            </div>
          )}

          {satData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded border bg-muted/30">
                  <span className="text-muted-foreground block">Coordinates</span>
                  {satData.lat?.toFixed(4)}°, {satData.lon?.toFixed(4)}°
                </div>
                <div className="p-2 rounded border bg-muted/30">
                  <span className="text-muted-foreground block">Tile Available</span>
                  <Badge variant={satData.tileAvailable ? "default" : "secondary"} className="text-[10px]">
                    {satData.tileAvailable ? "YES" : "NO"}
                  </Badge>
                </div>
                <div className="p-2 rounded border bg-muted/30">
                  <span className="text-muted-foreground block">Layer</span>
                  {satData.layer?.split("_").slice(-2).join(" ")}
                </div>
                <div className="p-2 rounded border bg-muted/30">
                  <span className="text-muted-foreground block">Service</span>
                  NASA GIBS
                </div>
              </div>
              {satData.tileAvailable && satData.tileUrl && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg overflow-hidden border bg-black">
                      <span className="text-[10px] text-muted-foreground block p-1 bg-background/80">Original Tile</span>
                      <ZoomableImage src={satData.tileUrl} alt="Satellite tile" className="w-full max-h-[400px] object-contain" />
                    </div>
                    {satData.analysis?.overlayPng && (
                      <div className="rounded-lg overflow-hidden border bg-black border-yellow-500/30">
                        <span className="text-[10px] text-amber-400 block p-1 bg-background/80">24-gon Anomaly Overlay</span>
                        <ZoomableImage src={`data:image/png;base64,${satData.analysis.overlayPng}`} alt="24-gon overlay" className="w-full max-h-[400px] object-contain" />
                      </div>
                    )}
                  </div>
                  {satData.analysis && !satData.analysis.error && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
                      <div className="p-2 rounded border bg-muted/30 text-center">
                        <span className="text-muted-foreground block">Anomaly Score</span>
                        <span className={`text-lg font-bold font-mono ${(satData.analysis.anomalyScore || 0) > 60 ? "text-amber-400" : (satData.analysis.anomalyScore || 0) > 40 ? "text-amber-400" : "text-green-400"}`}>
                          {satData.analysis.anomalyScore || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded border bg-muted/30 text-center">
                        <span className="text-muted-foreground block">Spoke Edges</span>
                        <span className="text-lg font-bold font-mono text-green-400">{satData.analysis.spokeEdgeCount || 0}</span>
                      </div>
                      <div className="p-2 rounded border bg-muted/30 text-center">
                        <span className="text-muted-foreground block">Gap Edges</span>
                        <span className="text-lg font-bold font-mono text-amber-400">{satData.analysis.gapEdgeCount || 0}</span>
                      </div>
                      <div className="p-2 rounded border bg-muted/30 text-center">
                        <span className="text-muted-foreground block">Base-53 Entropy</span>
                        <span className="text-lg font-bold font-mono">{(satData.analysis.base53Entropy || 0).toFixed(2)}</span>
                      </div>
                      <div className="p-2 rounded border bg-muted/30 text-center">
                        <span className="text-muted-foreground block">Cloaked</span>
                        <span className={`text-lg font-bold font-mono ${(satData.analysis.cloakedCandidates || 0) > 0 ? "text-amber-400" : "text-green-400"}`}>
                          {satData.analysis.cloakedCandidates || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Investigation Presets</CardTitle>
          <CardDescription className="text-xs">8 pre-configured investigation targets from 3I Atlas research</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(presetsData?.presets || []).map(p => (
              <div
                key={p.id}
                className={`p-2.5 rounded border cursor-pointer transition-colors ${selectedPreset === p.id ? "border-primary bg-muted/30" : "hover:bg-muted/20"}`}
                onClick={() => setSelectedPreset(p.id)}
                data-testid={`preset-${p.id}`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-semibold">{p.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{p.description}</p>
                <span className="text-[10px] font-mono text-muted-foreground">{p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArtifactScannerTab() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [filename, setFilename] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: scansData, isLoading: scansLoading } = useQuery<{ scans: any[] }>({
    queryKey: ["/api/artifact-hunter/scans"],
  });

  const scanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/artifact-hunter/scan", payload);
      return res.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/artifact-hunter/scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artifact-hunter/anomaly-feed"] });
      toast({ title: "Scan Complete", description: `Anomaly score: ${data.anomalyScore}/100` });
    },
    onError: () => toast({ title: "Scan Failed", variant: "destructive" }),
  });

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.min(img.width, 512);
        canvas.height = Math.min(img.height, 512);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bytes = new Uint8Array(imageData.data.buffer);
        const CHUNK = 8192;
        let binary = "";
        for (let i = 0; i < bytes.length; i += CHUNK) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
        }
        const base64 = btoa(binary);
        scanMutation.mutate({
          imageData: base64,
          width: canvas.width,
          height: canvas.height,
          channels: 4,
          filename: file.name,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, [scanMutation, toast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-amber-400";
    if (score >= 40) return "text-amber-400";
    return "text-green-400";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Hexagon className="h-5 w-5" />
            24-gon Artifact Scanner
          </CardTitle>
          <CardDescription className="text-xs">
            Upload any image for icositetragon (24-gon) rotational edge detection. Analyzes 8 prime-spoke angles (15°, 75°, 105°, 165°, 195°, 255°, 285°, 345°),
            gap sector anomalies, base-53 histogram entropy, and cloaking candidates via histogram equalization + contrast stretch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
              isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/20"
            }`}
            data-testid="dropzone-scanner"
          >
            <Upload className={`h-8 w-8 ${isDragOver ? "text-primary" : "text-muted-foreground/50"}`} />
            <div className="text-center">
              <p className="text-sm font-medium">{isDragOver ? "Drop image to analyze" : "Drag & drop an image here"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">or click to browse files</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded border text-xs hover:bg-muted/30 transition-colors" data-testid="label-upload-image">
              <Search className="h-3.5 w-3.5" />
              Browse Files
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} data-testid="input-upload-image" />
            </label>
            {filename && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{filename}</span>
                {scanMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {scanResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="p-2.5 rounded border bg-muted/30 text-center">
                  <span className="text-[10px] text-muted-foreground block">Anomaly Score</span>
                  <span className={`text-lg font-bold font-mono ${getScoreColor(scanResult.anomalyScore)}`}>
                    {scanResult.anomalyScore}
                  </span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
                <div className="p-2.5 rounded border bg-muted/30 text-center">
                  <span className="text-[10px] text-muted-foreground block">Spoke Edges</span>
                  <span className="text-lg font-bold font-mono">{scanResult.spokeEdgeCount}</span>
                </div>
                <div className="p-2.5 rounded border bg-muted/30 text-center">
                  <span className="text-[10px] text-muted-foreground block">Gap Edges</span>
                  <span className="text-lg font-bold font-mono">{scanResult.gapEdgeCount}</span>
                </div>
                <div className="p-2.5 rounded border bg-muted/30 text-center">
                  <span className="text-[10px] text-muted-foreground block">Base-53 Entropy</span>
                  <span className="text-lg font-bold font-mono">{scanResult.base53Entropy.toFixed(3)}</span>
                </div>
                <div className="p-2.5 rounded border bg-muted/30 text-center">
                  <span className="text-[10px] text-muted-foreground block">Cloaked</span>
                  <span className={`text-lg font-bold font-mono ${scanResult.cloakedCandidates > 0 ? "text-amber-400" : "text-green-400"}`}>
                    {scanResult.cloakedCandidates}
                  </span>
                </div>
              </div>

              {scanResult.findings.length > 0 && (
                <div className="p-3 rounded border bg-muted/30">
                  <span className="text-xs font-semibold block mb-1.5">Findings</span>
                  {scanResult.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <ChevronRight className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {scanResult.overlayPng && (
                <div className="p-3 rounded border bg-muted/30">
                  <span className="text-xs font-semibold block mb-1.5">24-gon Annotated Overlay</span>
                  <img
                    src={`data:image/png;base64,${scanResult.overlayPng}`}
                    alt="24-gon anomaly overlay"
                    className="w-full max-w-md rounded border border-yellow-500/30"
                    data-testid="img-overlay"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">Spoke edges (green), gap edges (red), cloaked candidates (yellow)</span>
                </div>
              )}

              {scanResult.filters.length > 0 && (
                <div className="p-3 rounded border bg-muted/30">
                  <span className="text-xs font-semibold block mb-1.5">Applied Filters ({scanResult.filters.length})</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {scanResult.filters.map((f, i) => (
                      <div key={i} className="text-center" data-testid={`filter-output-${i}`}>
                        {f.imagePng && (
                          <img
                            src={`data:image/png;base64,${f.imagePng}`}
                            alt={f.method}
                            className="w-full rounded border border-border/50 mb-1"
                          />
                        )}
                        <span className="text-[10px] font-mono text-foreground block">{f.method}</span>
                        <span className="text-[9px] text-muted-foreground">{f.description}</span>
                        {f.stats && (
                          <span className="text-[9px] text-muted-foreground block">
                            hotspot: {f.stats.hotspotPct}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scan History</CardTitle>
          <CardDescription className="text-xs">{scansData?.scans?.length || 0} scans on record</CardDescription>
        </CardHeader>
        <CardContent>
          {scansLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {(scansData?.scans || []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/30 text-xs font-mono" data-testid={`scan-${s.id}`}>
                  <div className="flex items-center gap-2">
                    <Hexagon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{s.filename}</span>
                    <Badge variant="outline" className="text-[10px]">{s.scanType}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={getScoreColor(s.anomalyScore)}>{s.anomalyScore}/100</span>
                    <span className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(scansData?.scans || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No scans yet — upload an image above</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AudioIntelTab() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [flagLabel, setFlagLabel] = useState("");
  const [flagDuration, setFlagDuration] = useState("5");
  const [flagLat, setFlagLat] = useState("");
  const [flagLon, setFlagLon] = useState("");

  const { data: archiveData } = useQuery<any>({
    queryKey: ["/api/artifact-hunter/audio-archive"],
  });

  const { data: flagsData } = useQuery<{ flags: any[] }>({
    queryKey: ["/api/artifact-hunter/audio-flags"],
  });

  const flagMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/artifact-hunter/audio-flags", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifact-hunter/audio-flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artifact-hunter/anomaly-feed"] });
      toast({ title: "Audio flag created" });
      setFlagLabel("");
    },
  });

  const drawSpectrogram = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    const waveH = Math.floor(h * 0.35);
    const freqH = h - waveH;

    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, w, h);

    const timeDomain = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeDomain);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sliceWidth = w / timeDomain.length;
    for (let i = 0; i < timeDomain.length; i++) {
      const y = (timeDomain[i] / 255) * waveH;
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * sliceWidth, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, waveH);
    ctx.lineTo(w, waveH);
    ctx.stroke();

    const bufferLength = analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqData);

    const barWidth = w / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (freqData[i] / 255) * freqH;
      const hue = (i / bufferLength) * 240;
      ctx.fillStyle = `hsl(${hue}, 100%, ${30 + (freqData[i] / 255) * 50}%)`;
      ctx.fillRect(i * barWidth, h - barHeight, barWidth, barHeight);
    }

    const sampleRate = analyser.context?.sampleRate || 48000;
    const base53Freqs = [53, 106, 159, 212];
    const colors = ["#ff4444", "#ff8844", "#ffcc44", "#44ff44"];
    base53Freqs.forEach((freq, idx) => {
      const binIndex = Math.round((freq / (sampleRate / 2)) * bufferLength);
      if (binIndex < bufferLength) {
        const x = binIndex * barWidth;
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, waveH);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors[idx];
        ctx.font = "9px monospace";
        ctx.fillText(`${freq}Hz`, x + 3, waveH + 12);
      }
    });

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "9px monospace";
    ctx.fillText("WAVEFORM", 4, 10);
    ctx.fillText("FREQUENCY", 4, waveH + 12);

    animFrameRef.current = requestAnimationFrame(drawSpectrogram);
  }, []);

  const handlePlayAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    if (!sourceRef.current) {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audio);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      sourceRef.current = source;
      analyserRef.current = analyser;
    }

    audio.play();
    setIsPlaying(true);
    drawSpectrogram();
  }, [isPlaying, drawSpectrogram]);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const frequencyBands = archiveData?.frequencyBands || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Waves className="h-5 w-5" />
            Audio Spectral Analysis — Base-53 Sieve
          </CardTitle>
          <CardDescription className="text-xs">
            Web Audio API spectrogram with 53 Hz infrasonic overlay bands at [53, 106, 159, 212] Hz.
            Load any audio file or URL. Overlay marks base-53 frequency positions from 3I Atlas research.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              value={audioUrl}
              onChange={e => setAudioUrl(e.target.value)}
              placeholder="Paste audio URL or use file input..."
              className="flex-1 h-8 text-xs font-mono"
              data-testid="input-audio-url"
            />
            <label className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded border text-xs hover:bg-muted/30">
              <Upload className="h-3.5 w-3.5" />
              Local File
              <input type="file" accept="audio/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) setAudioUrl(URL.createObjectURL(file));
              }} data-testid="input-audio-file" />
            </label>
            <Button size="sm" onClick={handlePlayAudio} disabled={!audioUrl} data-testid="btn-play-audio">
              {isPlaying ? <Square className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
              {isPlaying ? "Stop" : "Play"}
            </Button>
          </div>

          <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" />

          <div className="rounded-lg overflow-hidden border bg-black">
            <canvas ref={canvasRef} width={800} height={200} className="w-full" data-testid="canvas-spectrogram" />
          </div>

          <div className="flex flex-wrap gap-2">
            {frequencyBands.map((band: any) => (
              <Badge key={band.label} variant="outline" className="text-[10px] font-mono" style={{ borderColor: band.color, color: band.color }}>
                {band.label}: {band.hz} Hz
              </Badge>
            ))}
          </div>

          <div className="space-y-2 p-3 rounded border bg-muted/20">
            <span className="text-[10px] text-muted-foreground font-semibold block">Flag Segment</span>
            <div className="flex items-center gap-2">
              <Input
                value={flagLabel}
                onChange={e => setFlagLabel(e.target.value)}
                placeholder="Flag label (e.g. 'carrier tone at 53Hz')"
                className="flex-1 h-8 text-xs"
                data-testid="input-flag-label"
              />
              <Input
                value={flagDuration}
                onChange={e => setFlagDuration(e.target.value)}
                placeholder="Duration (s)"
                className="w-24 h-8 text-xs font-mono"
                type="number"
                min="1"
                data-testid="input-flag-duration"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={flagLat}
                onChange={e => setFlagLat(e.target.value)}
                placeholder="Lat (optional)"
                className="w-28 h-8 text-xs font-mono"
                type="number"
                step="0.001"
                data-testid="input-flag-lat"
              />
              <Input
                value={flagLon}
                onChange={e => setFlagLon(e.target.value)}
                placeholder="Lon (optional)"
                className="w-28 h-8 text-xs font-mono"
                type="number"
                step="0.001"
                data-testid="input-flag-lon"
              />
              <span className="text-[9px] text-muted-foreground">Optional coordinates for spatial correlation</span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                disabled={!flagLabel || flagMutation.isPending}
                onClick={() => flagMutation.mutate({
                  audioUrl: audioUrl || "manual-entry",
                  startTime: audioRef.current?.currentTime || 0,
                  duration: parseFloat(flagDuration) || 5,
                  label: flagLabel,
                  base53Score: 50,
                  ...(flagLat && flagLon ? { latitude: parseFloat(flagLat), longitude: parseFloat(flagLon) } : {}),
                })}
                data-testid="btn-create-flag"
              >
                <Zap className="h-3.5 w-3.5 mr-1" />
                Flag Segment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Radio className="h-4 w-4" />
              NUFORC Audio Archive
            </CardTitle>
            <CardDescription className="text-[10px]">
              Robert Gribble's original UFO hotline recordings (1974-1977)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
              {(archiveData?.sampleEntries || []).map((entry: any) => (
                <div key={entry.id} className="p-2 rounded border hover:bg-muted/30 text-[10px]" data-testid={`audio-entry-${entry.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{entry.title}</span>
                    <Badge variant="secondary" className="text-[9px]">{entry.year}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5">{entry.analysisNote}</p>
                </div>
              ))}
            </div>
            <a
              href="https://www.noufors.com/nuforc_audio_archive.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:underline font-mono mt-3"
              data-testid="link-audio-archive"
            >
              <ExternalLink className="h-3 w-3" />
              Full Archive at NOUFORS
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              Audio Flags ({flagsData?.flags?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
              {(flagsData?.flags || []).map((flag: any) => (
                <div key={flag.id} className="p-2 rounded border text-[10px] font-mono" data-testid={`flag-${flag.id}`}>
                  <div className="flex items-center justify-between">
                    <span>{flag.label}</span>
                    <span className="text-muted-foreground">{flag.startTime?.toFixed(1)}s</span>
                  </div>
                  {flag.base53Score && (
                    <Badge variant="outline" className="text-[9px] mt-1">B53: {flag.base53Score}</Badge>
                  )}
                </div>
              ))}
              {(flagsData?.flags || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No flags yet — analyze audio above</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SeismicCorrelatorTab() {
  const [corrLat, setCorrLat] = useState("10.0514");
  const [corrLon, setCorrLon] = useState("-84.2187");
  const [corrRadius, setCorrRadius] = useState("200");

  const { data: seismicData, isLoading } = useQuery<any>({
    queryKey: ["/api/artifact-hunter/seismic"],
    refetchInterval: 300000,
  });

  const correlateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/artifact-hunter/correlate", payload);
      return res.json();
    },
  });

  const earthquakes = seismicData?.earthquakes?.features || [];
  const cameras = seismicData?.ovsicoriCameras || [];
  const presets = seismicData?.correlationPresets || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            USGS Earthquake Feed + Volcanic Correlation
          </CardTitle>
          <CardDescription className="text-xs">
            M2.5+ earthquakes from the past 7 days (USGS real-time feed, updates every 5 min).
            Cross-correlates seismic events with artifact scans, audio flags, and OVSICORI volcanic monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2.5 rounded border bg-muted/30 text-center">
              <span className="text-[10px] text-muted-foreground block">Total Quakes (7d)</span>
              <span className="text-lg font-bold font-mono">{earthquakes.length}</span>
            </div>
            <div className="p-2.5 rounded border bg-muted/30 text-center">
              <span className="text-[10px] text-muted-foreground block">Max Magnitude</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {earthquakes.length > 0 ? Math.max(...earthquakes.map((e: any) => e.properties.mag)).toFixed(1) : "—"}
              </span>
            </div>
            <div className="p-2.5 rounded border bg-muted/30 text-center">
              <span className="text-[10px] text-muted-foreground block">OVSICORI Cams</span>
              <span className="text-lg font-bold font-mono">{cameras.length}</span>
            </div>
            <div className="p-2.5 rounded border bg-muted/30 text-center">
              <span className="text-[10px] text-muted-foreground block">Feed</span>
              <Badge variant="default" className="text-[10px]">LIVE</Badge>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center h-24">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {earthquakes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground">7-Day Seismic Timeline</span>
                <span className="text-[9px] text-muted-foreground font-mono">Click event for correlation</span>
              </div>
              <div className="relative h-24 rounded border bg-black/40 overflow-hidden" data-testid="seismic-timeline">
                {(() => {
                  const now = Date.now();
                  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
                  const maxMag = Math.max(...earthquakes.map((e: any) => e.properties.mag));
                  return earthquakes.slice(0, 100).map((eq: any) => {
                    const t = eq.properties.time;
                    const xPct = Math.max(0, Math.min(100, ((t - weekAgo) / (now - weekAgo)) * 100));
                    const yPct = Math.max(5, Math.min(90, 90 - ((eq.properties.mag / maxMag) * 80)));
                    const size = Math.max(4, Math.min(16, eq.properties.mag * 2.5));
                    const color = eq.properties.mag >= 5 ? "#d97706" : eq.properties.mag >= 4 ? "#f59e0b" : "#22c55e";
                    return (
                      <div
                        key={eq.id}
                        className="absolute rounded-full cursor-pointer hover:ring-2 hover:ring-white/50 transition-all"
                        style={{
                          left: `${xPct}%`,
                          top: `${yPct}%`,
                          width: size,
                          height: size,
                          backgroundColor: color,
                          opacity: 0.8,
                          transform: "translate(-50%, -50%)",
                        }}
                        title={`M${eq.properties.mag.toFixed(1)} — ${eq.properties.place}`}
                        onClick={() => {
                          const [eLon, eLat] = eq.geometry.coordinates;
                          setCorrLat(String(eLat.toFixed(4)));
                          setCorrLon(String(eLon.toFixed(4)));
                          correlateMutation.mutate({
                            lat: eLat, lon: eLon, radiusKm: 500, windowHours: 72,
                            time: new Date(eq.properties.time).toISOString(),
                          });
                        }}
                        data-testid={`timeline-dot-${eq.id}`}
                      />
                    );
                  });
                })()}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-0.5 text-[8px] text-muted-foreground/60 font-mono">
                  <span>7d ago</span>
                  <span>5d</span>
                  <span>3d</span>
                  <span>1d</span>
                  <span>now</span>
                </div>
                <div className="absolute top-1 right-2 flex items-center gap-2 text-[8px] text-muted-foreground/60">
                  <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> &lt;4</span>
                  <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 4-5</span>
                  <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 5+</span>
                </div>
              </div>

              <div className="relative h-32 rounded border bg-black/40 overflow-hidden" data-testid="seismic-map">
                {(() => {
                  const eqs = earthquakes.slice(0, 100);
                  return eqs.map((eq: any) => {
                    const [lon, lat] = eq.geometry.coordinates;
                    const xPct = ((lon + 180) / 360) * 100;
                    const yPct = ((90 - lat) / 180) * 100;
                    const size = Math.max(4, Math.min(14, eq.properties.mag * 2));
                    const color = eq.properties.mag >= 5 ? "#d97706" : eq.properties.mag >= 4 ? "#f59e0b" : "#22c55e";
                    return (
                      <div
                        key={`map-${eq.id}`}
                        className="absolute rounded-full cursor-pointer hover:ring-2 hover:ring-white/50"
                        style={{
                          left: `${xPct}%`,
                          top: `${yPct}%`,
                          width: size,
                          height: size,
                          backgroundColor: color,
                          opacity: 0.7,
                          transform: "translate(-50%, -50%)",
                        }}
                        title={`M${eq.properties.mag.toFixed(1)} — ${eq.properties.place}`}
                        onClick={() => {
                          setCorrLat(String(lat.toFixed(4)));
                          setCorrLon(String(lon.toFixed(4)));
                          correlateMutation.mutate({
                            lat, lon, radiusKm: 500, windowHours: 72,
                            time: new Date(eq.properties.time).toISOString(),
                          });
                        }}
                        data-testid={`map-dot-${eq.id}`}
                      />
                    );
                  });
                })()}
                <div className="absolute inset-0 pointer-events-none border-b border-dashed border-muted-foreground/20" style={{ top: "50%" }} />
                <div className="absolute bottom-1 left-2 text-[8px] text-muted-foreground/50 font-mono">Global Distribution (Mercator projection)</div>
              </div>
            </div>
          )}

          <div className="max-h-[350px] overflow-y-auto space-y-1">
            {earthquakes.slice(0, 30).map((eq: any) => (
              <div
                key={eq.id}
                className="flex items-center justify-between p-2 rounded border hover:bg-muted/30 text-xs font-mono cursor-pointer transition-colors"
                data-testid={`quake-${eq.id}`}
                onClick={() => {
                  const [eLon, eLat] = eq.geometry.coordinates;
                  const eqTime = new Date(eq.properties.time).toISOString();
                  setCorrLat(String(eLat.toFixed(4)));
                  setCorrLon(String(eLon.toFixed(4)));
                  correlateMutation.mutate({
                    lat: eLat,
                    lon: eLon,
                    radiusKm: 500,
                    windowHours: 72,
                    time: eqTime,
                  });
                }}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${eq.properties.mag >= 5 ? "border-amber-500 text-amber-400" : eq.properties.mag >= 4 ? "border-amber-500 text-amber-400" : "border-green-500 text-green-400"}`}
                  >
                    M{eq.properties.mag.toFixed(1)}
                  </Badge>
                  <span className="text-muted-foreground truncate max-w-[300px]">{eq.properties.place}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground">
                    {new Date(eq.properties.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Activity className="h-3 w-3 text-muted-foreground/50" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              Cross-Domain Correlator
            </CardTitle>
            <CardDescription className="text-[10px]">
              Query earthquakes + artifact scans + audio flags within a radius/time window
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Lat</label>
                <Input value={corrLat} onChange={e => setCorrLat(e.target.value)} className="h-7 text-xs font-mono" data-testid="input-corr-lat" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Lon</label>
                <Input value={corrLon} onChange={e => setCorrLon(e.target.value)} className="h-7 text-xs font-mono" data-testid="input-corr-lon" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Radius (km)</label>
                <Input value={corrRadius} onChange={e => setCorrRadius(e.target.value)} className="h-7 text-xs font-mono" data-testid="input-corr-radius" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {presets.map((p: any) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-6"
                  onClick={() => { setCorrLat(String(p.lat)); setCorrLon(String(p.lon)); setCorrRadius(String(p.radiusKm)); }}
                  data-testid={`btn-corr-preset-${p.id}`}
                >
                  {p.name}
                </Button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => correlateMutation.mutate({
                lat: parseFloat(corrLat),
                lon: parseFloat(corrLon),
                radiusKm: parseInt(corrRadius),
                windowHours: 72,
              })}
              disabled={correlateMutation.isPending}
              data-testid="btn-correlate"
            >
              {correlateMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : <Activity className="h-3.5 w-3.5 mr-1" />}
              Run Correlation
            </Button>

            {correlateMutation.data && (
              <div className="p-3 rounded border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Results</span>
                  <Badge variant="outline" className="text-[10px]">
                    {correlateMutation.data.results?.totalCorrelations || 0} correlations
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
                  <div>
                    <span className="text-muted-foreground block">Earthquakes</span>
                    {correlateMutation.data.results?.earthquakes?.length || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">NUFORC</span>
                    {correlateMutation.data.results?.nuforcSightings?.length || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Audio Flags</span>
                    {correlateMutation.data.results?.audioFlags?.length || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Scans</span>
                    {correlateMutation.data.results?.artifactScans?.length || 0}
                  </div>
                </div>
                {(correlateMutation.data.results?.earthquakes || []).slice(0, 5).map((eq: any) => (
                  <div key={eq.id} className="text-[10px] font-mono text-muted-foreground" data-testid={`corr-eq-${eq.id}`}>
                    M{eq.magnitude} — {eq.place} ({eq.distanceKm}km away)
                  </div>
                ))}
                {(correlateMutation.data.results?.nuforcSightings || []).slice(0, 5).map((s: any) => (
                  <div key={s.id} className="text-[10px] font-mono text-amber-400/80" data-testid={`corr-nuforc-${s.id}`}>
                    {s.shape || "Unknown"} — {s.city || s.country} ({s.distanceKm}km away, {new Date(s.date).toLocaleDateString()})
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Mountain className="h-4 w-4" />
              OVSICORI Volcano Cameras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cameras.map((cam: any) => (
                <div key={cam.id} className="p-2.5 rounded border hover:bg-muted/30" data-testid={`ovsicori-cam-${cam.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{cam.name}</span>
                    <a href={cam.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{cam.volcano}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">{cam.lat.toFixed(3)}°, {cam.lon.toFixed(3)}°</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResearchCrossAnalysis() {
  const { data: researchData, isLoading, error } = useQuery<ResearchData>({
    queryKey: ["/api/artifact-hunter/research-constants"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-amber-400" />
          <p className="text-sm text-muted-foreground">Loading cross-domain research data...</p>
        </div>
      </div>
    );
  }

  if (error || !researchData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-400 mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load research constants</p>
        </CardContent>
      </Card>
    );
  }

  const matches = researchData.constants?.CROSS_DOMAIN_MATCHES || [];
  const sites = researchData.constants?.ARCHAEOACOUSTIC_SITES || [];
  const findings = researchData.crossDomainAnalysis?.keyFindings || [];
  const sources = researchData.crossDomainAnalysis?.sources || [];
  const bg = researchData.constants?.BIOGEOMETRY;
  const gos = researchData.constants?.GOS_MASTER_CONSTANTS || {};
  const genes = researchData.constants?.GOS_GENE_FREQUENCIES || {};

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-amber-400" />
            Cross-Domain Pattern Analysis
          </CardTitle>
          <CardDescription className="text-xs">
            {researchData.crossDomainAnalysis?.summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            {findings.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <ChevronRight className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-[10px] font-mono text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Frequency Cross-Matches ({matches.length})
            </CardTitle>
            <CardDescription className="text-[10px]">Computed deviations between platform constants and research frequencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className="p-2 rounded border hover:bg-muted/30 text-[10px] font-mono" data-testid={`crossmatch-${i}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">{m.a}</span>
                    <Badge variant="outline" className={`text-[9px] ${m.deviationPct < 1 ? "border-green-500 text-green-400" : m.deviationPct < 5 ? "border-amber-500 text-amber-400" : "border-amber-500 text-amber-400"}`}>
                      {m.deviationPct.toFixed(2)}% dev
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    = {m.value.toFixed(3)} → {m.match} ({m.matchValue})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Waves className="h-4 w-4" />
              Archaeoacoustic Resonance Sites ({sites.length})
            </CardTitle>
            <CardDescription className="text-[10px]">Neolithic/megalithic chambers with intentional acoustic engineering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {sites.map((s, i) => (
                <div key={i} className="p-2 rounded border hover:bg-muted/30 text-[10px]" data-testid={`archsite-${i}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{s.name}</span>
                    <Badge variant="outline" className="text-[9px] border-purple-500 text-purple-400">
                      {s.resonanceHz} Hz
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">{s.location} — {s.material}</span>
                  <p className="text-muted-foreground mt-0.5 italic">{s.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">GOS Master Constants</CardTitle>
            <CardDescription className="text-[10px]">Geometric Operating System — transcendental invariants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {Object.entries(gos).map(([key, value]) => (
                <div key={key} className="text-[10px] font-mono">
                  <span className="text-amber-400">{key}</span>
                  <p className="text-muted-foreground">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">GOS Gene Frequencies</CardTitle>
            <CardDescription className="text-[10px]">Genomic Resonome — AUBREY manifest target frequencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {Object.entries(genes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-foreground">{key.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className="text-[9px]">{value} Hz</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">BioGeometry BG3</CardTitle>
            <CardDescription className="text-[10px]">Ibrahim Karim — sacred power spot centering quality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bg?.BG3_COMPONENTS?.map((c, i) => (
                <Badge key={i} variant="outline" className="text-[10px] mr-1">{c}</Badge>
              ))}
              <p className="text-[10px] text-muted-foreground mt-2">{bg?.PRINCIPLE}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Research Sources ({sources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {sources.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <span className="text-amber-400 shrink-0">[{i + 1}]</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnomalyFeedPanel() {
  const { data } = useQuery<{ feed: AnomalyFeedItem[]; totalItems: number }>({
    queryKey: ["/api/artifact-hunter/anomaly-feed"],
    refetchInterval: 30000,
  });

  const feed = data?.feed || [];

  if (feed.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-amber-400" />
          Cross-Domain Anomaly Feed
        </CardTitle>
        <CardDescription className="text-[10px]">
          Cross-domain anomalies: scans, audio, seismic, NUFORC — ranked by score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
          {feed.map(item => (
            <div key={`${item.type}-${item.id}`} className="flex items-start gap-2 p-2 rounded border hover:bg-muted/30" data-testid={`feed-${item.type}-${item.id}`}>
              <Badge
                variant="outline"
                className={`text-[9px] shrink-0 mt-0.5 ${
                  item.type === "artifact_scan" ? "border-purple-500 text-purple-400" :
                  item.type === "nuforc_sighting" ? "border-amber-500 text-amber-400" :
                  item.type === "usgs_earthquake" ? "border-amber-500 text-amber-400" :
                  item.type === "audio_flag" ? "border-cyan-500 text-cyan-400" :
                  "border-gray-500 text-gray-400"
                }`}
              >
                {item.type === "artifact_scan" ? "SCAN" :
                 item.type === "nuforc_sighting" ? "NUFORC" :
                 item.type === "usgs_earthquake" ? "SEISMIC" :
                 item.type === "audio_flag" ? "AUDIO" :
                 item.type.toUpperCase()}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] truncate">{item.summary}</p>
                {item.location && (
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {item.location.lat.toFixed(2)}°, {item.location.lon.toFixed(2)}°
                  </span>
                )}
              </div>
              <span className={`text-xs font-mono font-bold shrink-0 ${(item.score || 0) >= 70 ? "text-amber-400" : (item.score || 0) >= 40 ? "text-amber-400" : "text-green-400"}`}>
                {item.score}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImageryPage() {
  const { t } = useI18n();
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("sobel");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [shapeFilter, setShapeFilter] = useState<string>("all");
  const [expandedSighting, setExpandedSighting] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ImageryData>({
    queryKey: ["/api/imagery"],
    refetchInterval: 30000,
  });

  const { data: nuforcData } = useQuery<NuforcData>({
    queryKey: ["/api/nuforc/sightings"],
  });

  const analyses = data?.analyses ?? [];
  const ovsicori = data?.ovsicori ?? [];
  const activeAnalysis = analyses.find(a => a.id === selectedAnalysis) ?? analyses[0];

  const filteredSightings = useMemo(() => {
    if (!nuforcData) return [];
    return nuforcData.sightings.filter(s => {
      if (countryFilter !== "all" && s.country !== countryFilter) return false;
      if (shapeFilter !== "all" && (s.shape || "Unknown") !== shapeFilter) return false;
      return true;
    });
  }, [nuforcData, countryFilter, shapeFilter]);

  const methodDescriptions: Record<string, string> = {
    edges: "Standard edge detection — Laplacian-based kernel highlights all intensity transitions",
    enhanced_edges: "4x contrast + 3x sharpness enhancement before edge extraction — reveals structures hidden in low-contrast regions",
    sobel: "Sobel gradient magnitude — combines horizontal and vertical directional derivatives to show gradient strength",
    binary_edges: "Thresholded binary edge map (85th percentile) — isolates strongest structural edges from vegetation noise",
    emboss: "Embossed relief with 2x contrast — reveals 3D surface topology and hidden structures through shadow simulation",
    crop_edges: "Cropped region-of-interest with 4x contrast + 3x sharpness edge detection",
    crop_sobel: "Cropped ROI Sobel gradient at 3x amplification — maximum sensitivity for hidden structures",
    crop_equalized_edges: "Histogram-equalized crop with edge detection — normalizes brightness distribution to reveal cloaked features",
  };

  return (
    <div className="p-6 space-y-6">
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxImage(null)}
          data-testid="lightbox-overlay"
        >
          <img
            src={lightboxImage}
            alt="Full resolution analysis"
            className="max-w-[95vw] max-h-[95vh] object-contain"
            data-testid="lightbox-image"
          />
          <div className="absolute top-4 right-4 text-white text-sm font-mono opacity-70">
            Click anywhere to close
          </div>
        </div>
      )}

      <DisclaimerBanner />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-imagery-title">
            <ScanEye className="h-6 w-6" />
            Artifact Hunter
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-imagery-desc">
            24-gon anomaly detection • satellite imagery • audio spectral analysis • seismic correlation
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs" data-testid="badge-imagery-count">
          {analyses.length} analyses
        </Badge>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1" data-testid="tabs-imagery">
          <TabsTrigger value="analysis" data-testid="tab-analysis">
            <ScanEye className="h-4 w-4 mr-1" />
            Edge Detection
          </TabsTrigger>
          <TabsTrigger value="uap" data-testid="tab-uap">
            <Globe className="h-4 w-4 mr-1" />
            UAP Sightings
          </TabsTrigger>
          <TabsTrigger value="satellite" data-testid="tab-satellite">
            <Satellite className="h-4 w-4 mr-1" />
            Satellite Hunter
          </TabsTrigger>
          <TabsTrigger value="scanner" data-testid="tab-scanner">
            <Hexagon className="h-4 w-4 mr-1" />
            Artifact Scanner
          </TabsTrigger>
          <TabsTrigger value="audio" data-testid="tab-audio">
            <Waves className="h-4 w-4 mr-1" />
            Audio Intel
          </TabsTrigger>
          <TabsTrigger value="seismic" data-testid="tab-seismic">
            <Activity className="h-4 w-4 mr-1" />
            Seismic Correlator
          </TabsTrigger>
          <TabsTrigger value="research" data-testid="tab-research">
            <FileText className="h-4 w-4 mr-1" />
            Research Analysis
          </TabsTrigger>
          <TabsTrigger value="demodex" data-testid="tab-demodex">
            <Microscope className="h-4 w-4 mr-1" />
            Demodex Camera
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analyses.map(analysis => (
                  <Card
                    key={analysis.id}
                    className={`cursor-pointer transition-colors ${activeAnalysis?.id === analysis.id ? "border-primary" : "hover:border-muted-foreground/50"}`}
                    onClick={() => setSelectedAnalysis(analysis.id)}
                    data-testid={`card-analysis-${analysis.id}`}
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-mono">{analysis.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {analysis.dimensions} — {analysis.timestamp}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-1">
                        {analysis.findings.map((finding, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500 text-xs mt-0.5">▸</span>
                            <span className="text-xs text-muted-foreground">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {activeAnalysis && (
                <Card data-testid="card-active-analysis">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-mono text-base">{activeAnalysis.label}</CardTitle>
                      <Badge variant="secondary" className="text-xs">{activeAnalysis.outputs.length} methods</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {activeAnalysis.outputs.map(output => (
                        <Button
                          key={output.method}
                          size="sm"
                          variant={selectedMethod === output.method ? "default" : "outline"}
                          onClick={() => setSelectedMethod(output.method)}
                          className="text-xs font-mono"
                          data-testid={`btn-method-${output.method}`}
                        >
                          {output.method.replace(/_/g, " ")}
                        </Button>
                      ))}
                    </div>

                    {activeAnalysis.outputs.filter(o => o.method === selectedMethod).map(output => (
                      <div key={output.method} className="space-y-2">
                        <p className="text-xs text-muted-foreground font-mono">
                          {methodDescriptions[output.method] || output.description}
                        </p>
                        <div
                          className="relative group cursor-pointer rounded-lg overflow-hidden border bg-black"
                          onClick={() => setLightboxImage(output.path)}
                          data-testid={`img-container-${output.method}`}
                        >
                          <img
                            src={output.path}
                            alt={`${activeAnalysis.label} — ${output.method}`}
                            className="w-full max-h-[600px] object-contain"
                            data-testid={`img-${output.method}`}
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="h-5 w-5 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {activeAnalysis.outputs.filter(o => o.method !== selectedMethod).map(output => (
                        <div
                          key={output.method}
                          className="cursor-pointer rounded border overflow-hidden bg-black hover:border-primary transition-colors"
                          onClick={() => setSelectedMethod(output.method)}
                          data-testid={`thumb-${output.method}`}
                        >
                          <img
                            src={output.path}
                            alt={output.method}
                            className="w-full h-24 object-cover opacity-70 hover:opacity-100 transition-opacity"
                          />
                          <div className="p-1 text-center">
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {output.method.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="uap" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="h-5 w-5" />
                      NUFORC Sighting Reports — Latin America
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={countryFilter} onValueChange={setCountryFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-country-filter">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Countries</SelectItem>
                          <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                          <SelectItem value="Mexico">Mexico</SelectItem>
                          <SelectItem value="Venezuela">Venezuela</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={shapeFilter} onValueChange={setShapeFilter}>
                        <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="select-shape-filter">
                          <SelectValue placeholder="Shape" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Shapes</SelectItem>
                          {Object.keys(nuforcData?.stats.byShape || {}).sort().map(shape => (
                            <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {filteredSightings.length} sightings indexed from NUFORC database (159,621 total worldwide) — Costa Rica: {nuforcData?.stats.byCountry["Costa Rica"] || 0}, Mexico: {nuforcData?.stats.byCountry["Mexico"] || 0}, Venezuela: {nuforcData?.stats.byCountry["Venezuela"] || 0}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
                    {filteredSightings.map(s => (
                      <div
                        key={s.id}
                        className={`p-2.5 rounded border cursor-pointer transition-colors ${expandedSighting === s.id ? "bg-muted border-primary" : "hover:bg-muted/50 border-transparent"}`}
                        onClick={() => setExpandedSighting(expandedSighting === s.id ? null : s.id)}
                        data-testid={`sighting-${s.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-muted-foreground">
                                {new Date(s.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </span>
                              {s.shape && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SHAPE_COLORS[s.shape] || SHAPE_COLORS.Other}`}>
                                  {s.shape}
                                </Badge>
                              )}
                              {s.tier === 1 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30">
                                  TIER 1
                                </Badge>
                              )}
                              {s.media && <Camera className="h-3 w-3 text-blue-400" />}
                              {s.source && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400">
                                  {s.source.split("/")[0].trim()}
                                </Badge>
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${expandedSighting === s.id ? "" : "line-clamp-1"}`}>
                              {s.summary}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant="secondary" className="text-[10px]">
                              {s.country === "Costa Rica" ? "CR" : s.country === "Mexico" ? "MX" : "VE"}
                            </Badge>
                          </div>
                        </div>
                        {expandedSighting === s.id && (
                          <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
                            <div>
                              <span className="text-muted-foreground block">Location</span>
                              {s.city || "Unknown"}{s.state ? `, ${s.state}` : ""}
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Coordinates</span>
                              {s.lat.toFixed(4)}°N, {Math.abs(s.lon).toFixed(4)}°W
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Reported</span>
                              {s.reported}
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Explanation</span>
                              {s.explanation || "None — unexplained"}
                            </div>
                            {s.source && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground block">Source</span>
                                {s.source}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5" />
                    NUFORC Interactive Map
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Embedded NUFORC Mapbox sighting map — 159,621 reports worldwide. Green dots = last 12 months. Red dots = older.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border bg-black">
                    <iframe
                      src="https://nuforc.org/map/"
                      className="w-full h-[500px] border-0"
                      title="NUFORC UFO Sightings Map"
                      data-testid="iframe-nuforc-map"
                      allow="geolocation"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <a href="https://nuforc.org/subndx/?id=cCosta_Rica" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline font-mono" data-testid="link-nuforc-cr">
                      <ExternalLink className="h-3 w-3" /> CR Reports ({nuforcData?.stats.nuforc.costaRicaReports || 48})
                    </a>
                    <a href="https://nuforc.org/subndx/?id=cMexico" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline font-mono" data-testid="link-nuforc-mx">
                      <ExternalLink className="h-3 w-3" /> MX Reports ({nuforcData?.stats.nuforc.mexicoReports || 565})
                    </a>
                    <a href="https://nuforc.org/subndx/?id=cVenezuela" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline font-mono" data-testid="link-nuforc-ve">
                      <ExternalLink className="h-3 w-3" /> VE Reports ({nuforcData?.stats.nuforc.venezuelaReports || 47})
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Shape Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {Object.entries(nuforcData?.stats.byShape || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([shape, count]) => (
                        <div key={shape} className="flex items-center justify-between">
                          <button
                            className={`text-xs px-1.5 py-0.5 rounded border ${SHAPE_COLORS[shape] || SHAPE_COLORS.Other} cursor-pointer`}
                            onClick={() => setShapeFilter(shapeFilter === shape ? "all" : shape)}
                            data-testid={`btn-shape-${shape}`}
                          >
                            {shape}
                          </button>
                          <span className="text-xs font-mono text-muted-foreground">{count}</span>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Nearest to Observer
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    CR sightings by distance from Tacacorí (10.0514°N, 84.2187°W)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {(nuforcData?.stats.observerProximity || []).map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-[10px] font-mono cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded"
                        onClick={() => setExpandedSighting(p.id)}
                        data-testid={`proximity-${p.id}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${SHAPE_COLORS[p.shape || "Other"] || SHAPE_COLORS.Other}`}>
                            {p.shape || "?"}
                          </Badge>
                          <span className="text-muted-foreground">{p.city || "Unknown"}</span>
                        </div>
                        <span className="text-amber-400">{p.distanceKm}km</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    OVSICORI UAP Captures
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Volcano webcam UAP screenshots documented in Emily Shell Gamage article.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-[10px]">
                    <div className="p-2 rounded border bg-muted/30">
                      <span className="text-amber-400 font-semibold">Arenal Webcam</span>
                      <p className="text-muted-foreground mt-0.5">Two screenshots show UAP in different positions ~40min apart. Camera no longer active (volcano dormant since 2010).</p>
                    </div>
                    <div className="p-2 rounded border bg-muted/30">
                      <span className="text-amber-400 font-semibold">Turrialba Volcano</span>
                      <p className="text-muted-foreground mt-0.5">Triangle captured by fixed OVSICORI observation camera (2013-02-21). Report filed with NUFORC.</p>
                    </div>
                    <div className="p-2 rounded border bg-muted/30">
                      <span className="text-amber-400 font-semibold">Correlation Note</span>
                      <p className="text-muted-foreground mt-0.5">Active volcanoes (Turrialba, formerly Arenal) show higher UAP sighting density. Sightings surge when volcanic activity increases.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="satellite" className="space-y-4">
          <SatelliteHunterTab />
        </TabsContent>

        <TabsContent value="scanner" className="space-y-4">
          <ArtifactScannerTab />
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <AudioIntelTab />
        </TabsContent>

        <TabsContent value="seismic" className="space-y-4">
          <SeismicCorrelatorTab />
        </TabsContent>

        <TabsContent value="research" className="space-y-4">
          <ResearchCrossAnalysis />
        </TabsContent>

        <TabsContent value="demodex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-purple-500" />
                Demodex Colony — Orch-OR Observation Camera
              </CardTitle>
              <CardDescription>
                25,000-particle colony simulation. Carrier: 1.435 Hz. Microtubule resonance: 37 Hz.
                Sampling glitch at 46.875 Hz (2012 fork). Move cursor to observe, click to collapse wavefunction.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <DemodexCameraView />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AnomalyFeedPanel />
    </div>
  );
}