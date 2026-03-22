import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { Camera, ScanEye, Mountain, Maximize2, Layers, RefreshCw, ExternalLink } from "lucide-react";

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

export default function ImageryPage() {
  const { t } = useI18n();
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("sobel");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ImageryData>({
    queryKey: ["/api/imagery"],
    refetchInterval: 30000,
  });

  const analyses = data?.analyses ?? [];
  const ovsicori = data?.ovsicori ?? [];
  const activeAnalysis = analyses.find(a => a.id === selectedAnalysis) ?? analyses[0];

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
