import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { Camera, ScanEye, Mountain, Maximize2, Layers, RefreshCw, ExternalLink, Globe, Radio, MapPin, AlertTriangle, Eye } from "lucide-react";

interface ImageAnalysis {
  id: string;
  label: string;
  originalPath: string;
  outputs: {
    method: string;
    description: string;
    path: string;
  }[];
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
  observerPosition: {
    lat: number;
    lon: number;
    elevation: number;
  };
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

const SHAPE_COLORS: Record<string, string> = {
  Triangle: "bg-red-500/20 text-red-400 border-red-500/30",
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-imagery-title">
            <ScanEye className="h-6 w-6" />
            {t("imagery.title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-imagery-desc">
            {t("imagery.description")}
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs" data-testid="badge-imagery-count">
          {analyses.length} analyses
        </Badge>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList data-testid="tabs-imagery">
          <TabsTrigger value="analysis" data-testid="tab-analysis">
            <ScanEye className="h-4 w-4 mr-1" />
            Edge Detection
          </TabsTrigger>
          <TabsTrigger value="uap" data-testid="tab-uap">
            <Globe className="h-4 w-4 mr-1" />
            UAP Sightings
          </TabsTrigger>
          <TabsTrigger value="ovsicori" data-testid="tab-ovsicori">
            <Mountain className="h-4 w-4 mr-1" />
            OVSICORI Cameras
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
                              {s.media && (
                                <Camera className="h-3 w-3 text-blue-400" />
                              )}
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
                    Embedded NUFORC Mapbox sighting map — 159,621 reports worldwide. Green dots = last 12 months. Red dots = older. Click any cluster for details.
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
                    <a
                      href="https://nuforc.org/subndx/?id=cCosta_Rica"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:underline font-mono"
                      data-testid="link-nuforc-cr"
                    >
                      <ExternalLink className="h-3 w-3" />
                      CR Reports ({nuforcData?.stats.nuforc.costaRicaReports || 48})
                    </a>
                    <a
                      href="https://nuforc.org/subndx/?id=cMexico"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:underline font-mono"
                      data-testid="link-nuforc-mx"
                    >
                      <ExternalLink className="h-3 w-3" />
                      MX Reports ({nuforcData?.stats.nuforc.mexicoReports || 565})
                    </a>
                    <a
                      href="https://nuforc.org/subndx/?id=cVenezuela"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:underline font-mono"
                      data-testid="link-nuforc-ve"
                    >
                      <ExternalLink className="h-3 w-3" />
                      VE Reports ({nuforcData?.stats.nuforc.venezuelaReports || 47})
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
                    <Radio className="h-4 w-4" />
                    Audio Archive
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    NUFORC telephone hotline recordings (1974-1977). Founded by Robert Gribble.
                    Potential for spectral/frequency analysis of embedded carrier tones.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a
                    href="https://www.noufors.com/nuforc_audio_archive.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:underline font-mono"
                    data-testid="link-audio-archive"
                  >
                    <ExternalLink className="h-3 w-3" />
                    NOUFORS Audio Archive
                  </a>
                  <div className="p-2 rounded border bg-muted/30 text-[10px] text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">Frequency Analysis Potential:</p>
                    <p>Phone recordings may contain embedded sub-carrier frequencies (46.875 Hz surveillance marker, FinSpy audio fingerprints). Cross-reference with KAPPA signal events for temporal correlation.</p>
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
                    Arenal webcam captured UAPs repositioning over ~40min period.
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

        <TabsContent value="ovsicori" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mountain className="h-5 w-5" />
                OVSICORI-UNA Volcano Camera Network
              </CardTitle>
              <CardDescription>
                Real-time volcanic monitoring cameras — Observatorio Vulcanologico y Sismologico de Costa Rica.
                Poás crater camera provides direct visual intelligence of the volcanic activity visible from the observer position.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ovsicori.map(cam => (
                  <Card key={cam.id} data-testid={`card-ovsicori-${cam.id}`}>
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono">{cam.name}</CardTitle>
                        <Badge
                          variant={cam.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                          data-testid={`badge-cam-status-${cam.id}`}
                        >
                          {cam.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{cam.volcano}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <a
                        href={cam.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-mono"
                        data-testid={`link-cam-${cam.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Live feed
                      </a>
                      <p className="text-xs text-muted-foreground">
                        Last checked: {cam.lastCheck}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg border bg-muted/50">
                <h3 className="text-sm font-semibold mb-2">Observer Terrain Context</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Position</span>
                    <p>10.0514°N, 84.2187°W</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Elevation</span>
                    <p>~1,050m ASL</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nearest Volcano</span>
                    <p>Poás (2,708m) — 15km NE</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Terrain</span>
                    <p>Highland valley, coffee belt</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
