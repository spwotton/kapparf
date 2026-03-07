import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { THREAT_LEVELS, type KappaStatus, type SignalEvent, type Correlation } from "@shared/schema";
import {
  Download,
  Image,
  Square,
  RectangleVertical,
  Smartphone,
  Satellite,
  Activity,
  Shield,
  Clock,
  Eye,
  Radio,
  Zap,
  Grid3x3,
  LayoutGrid,
  Loader2,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { toPng } from "html-to-image";

type CardFormat = "square" | "portrait" | "story";
type CardTemplate = "kappa" | "satellite" | "correlation" | "domains" | "evening";

interface SocialCardData {
  kappa: KappaStatus | null;
  totalEvents: number;
  totalCorrelations: number;
  domainCounts: Record<string, number>;
  recentCorrelations: Correlation[];
  recentEvents: SignalEvent[];
  satelliteCount: number;
  visibleSatellites: number;
  overheadSatellites: number;
  generatedAt: string;
}

const FORMAT_DIMENSIONS: Record<CardFormat, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "1080 × 1080" },
  portrait: { w: 1080, h: 1350, label: "1080 × 1350" },
  story: { w: 1080, h: 1920, label: "1080 × 1920" },
};

const PREVIEW_SCALE = 0.3;

function getThreatLabel(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].level;
  }
  return THREAT_LEVELS[0].level;
}

function getThreatColor(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].color;
  }
  return THREAT_LEVELS[0].color;
}

function formatTimestamp(ts: string | number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });
}

function KappaScoreCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const score = data.kappa?.score ?? 0;
  const threat = getThreatLabel(score);
  const color = getThreatColor(score);
  const isEvening = data.kappa?.eveningWindow?.active ?? false;

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-kappa"
    >
      <div className="absolute inset-0 bg-[#141210]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">KAPPA</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">SIGINT PLATFORM</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[48px]">
            <div className="text-[180px] font-mono font-bold leading-none" style={{ color }}>{score.toFixed(0)}</div>
            <div className="text-[32px] font-mono tracking-[0.3em] mt-[16px]" style={{ color }}>{threat}</div>
          </div>

          <div className="w-full max-w-[700px] grid grid-cols-3 gap-[32px] text-center">
            <div>
              <div className="text-[48px] font-mono font-semibold text-[#e8e4de]">{data.totalEvents}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[4px]">EVENTS</div>
            </div>
            <div>
              <div className="text-[48px] font-mono font-semibold text-[#e8e4de]">{data.totalCorrelations}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[4px]">CORRELATIONS</div>
            </div>
            <div>
              <div className="text-[48px] font-mono font-semibold text-[#e8e4de]">{data.satelliteCount}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[4px]">SATELLITES</div>
            </div>
          </div>
        </div>

        {isEvening && (
          <div className="flex items-center gap-[12px] mb-[24px]">
            <Eye className="text-amber-500" style={{ width: 24, height: 24 }} />
            <span className="text-amber-500 font-mono text-[20px] tracking-wider">EVENING WINDOW ACTIVE</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">9.9536°N 84.2907°W</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function SatelliteCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-satellite"
    >
      <div className="absolute inset-0 bg-[#141210]" />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "conic-gradient(from 0deg at 50% 50%, rgba(168,130,255,0.1) 0deg, transparent 60deg, rgba(168,130,255,0.05) 120deg, transparent 180deg, rgba(168,130,255,0.1) 240deg, transparent 300deg, rgba(168,130,255,0.05) 360deg)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Satellite style={{ width: 28, height: 28, color: "#a882ff" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">ORBITAL INTEL</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-[48px] mb-[56px]">
            <div className="text-center">
              <div className="text-[120px] font-mono font-bold text-[#a882ff] leading-none">{data.satelliteCount}</div>
              <div className="text-[22px] text-[#7a746a] font-mono tracking-wider mt-[12px]">TRACKED</div>
            </div>
            <div className="text-center">
              <div className="text-[120px] font-mono font-bold text-[#e8e4de] leading-none">{data.visibleSatellites}</div>
              <div className="text-[22px] text-[#7a746a] font-mono tracking-wider mt-[12px]">VISIBLE (&gt;30°)</div>
            </div>
          </div>

          <div className="bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622]">
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className="w-[8px] h-[8px] rounded-full bg-purple-500" />
              <span className="text-[#e8e4de] font-mono text-[20px]">OVERHEAD (&gt;75° elevation)</span>
            </div>
            <div className="text-[72px] font-mono font-bold text-purple-400 leading-none">{data.overheadSatellites}</div>
          </div>

          {format !== "square" && (
            <div className="mt-[48px] bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622]">
              <div className="flex items-center gap-[12px] mb-[16px]">
                <span className="text-[#e8e4de] font-mono text-[20px]">SIGINT CATEGORIES</span>
              </div>
              <div className="text-[#7a746a] font-mono text-[18px] leading-relaxed">
                CelesTrak TLE-based tracking from Guacima Abajo observer point. All satellite positions computed from real orbital elements.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">9.9536°N 84.2907°W</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function CorrelationCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const score = data.kappa?.score ?? 0;
  const color = getThreatColor(score);

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-correlation"
    >
      <div className="absolute inset-0 bg-[#141210]" />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Zap style={{ width: 28, height: 28, color: "#f59e0b" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">CORRELATION ALERT</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-[32px] mb-[48px]">
            <div>
              <div className="text-[96px] font-mono font-bold leading-none" style={{ color }}>{score.toFixed(0)}</div>
              <div className="text-[18px] font-mono tracking-wider mt-[8px]" style={{ color }}>KAPPA SCORE</div>
            </div>
            <div className="h-[120px] w-[1px] bg-[#2a2622]" />
            <div>
              <div className="text-[96px] font-mono font-bold text-amber-500 leading-none">{data.totalCorrelations}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[8px]">TOTAL MATCHES</div>
            </div>
          </div>

          <div className="space-y-[16px]">
            {data.recentCorrelations.slice(0, format === "square" ? 3 : 5).map((c, i) => (
              <div key={c.id || i} className="bg-[#1c1a17] rounded-[12px] p-[24px] border border-[#2a2622] flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: c.severity >= 3 ? "#ef4444" : c.severity >= 2 ? "#f59e0b" : "#22c55e" }} />
                  <span className="text-[#e8e4de] font-mono text-[20px]">{c.ruleName}</span>
                </div>
                <span className="text-[#7a746a] font-mono text-[18px]">SEV {c.severity}</span>
              </div>
            ))}
            {data.recentCorrelations.length === 0 && (
              <div className="bg-[#1c1a17] rounded-[12px] p-[24px] border border-[#2a2622] text-center">
                <span className="text-[#5a5550] font-mono text-[20px]">No active correlations</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">Cross-domain pattern matching</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function DomainCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const domains = Object.entries(data.domainCounts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...domains.map(([, v]) => v), 1);

  const domainColors: Record<string, string> = {
    wifi: "#22c55e", ble: "#3b82f6", lte: "#ef4444", "5g": "#f97316",
    satellite: "#a882ff", sdr: "#eab308", elf: "#06b6d4", radar: "#f43f5e",
    plc: "#d97706", isp: "#64748b", drone: "#8b5cf6",
  };

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-domains"
    >
      <div className="absolute inset-0 bg-[#141210]" />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Radio style={{ width: 28, height: 28, color: "#22c55e" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">DOMAIN BREAKDOWN</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="text-center mb-[40px]">
          <div className="text-[72px] font-mono font-bold text-[#e8e4de] leading-none">{data.totalEvents}</div>
          <div className="text-[20px] text-[#7a746a] font-mono tracking-wider mt-[8px]">TOTAL SIGNAL EVENTS</div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-[20px]">
          {domains.slice(0, format === "square" ? 6 : 9).map(([domain, count]) => (
            <div key={domain} className="flex items-center gap-[20px]">
              <span className="text-[20px] font-mono text-[#7a746a] w-[120px] text-right uppercase">{domain}</span>
              <div className="flex-1 h-[32px] bg-[#1c1a17] rounded-[6px] overflow-hidden">
                <div
                  className="h-full rounded-[6px] transition-all"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: domainColors[domain] || "#7a746a",
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-[20px] font-mono text-[#e8e4de] w-[80px]">{count}</span>
            </div>
          ))}
          {domains.length === 0 && (
            <div className="text-center py-[40px]">
              <span className="text-[#5a5550] font-mono text-[24px]">No signal events collected yet</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">11 signal domains monitored</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function EveningWindowCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const isActive = data.kappa?.eveningWindow?.active ?? false;
  const window = data.kappa?.eveningWindow?.window;
  const score = data.kappa?.score ?? 0;
  const color = getThreatColor(score);

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-evening"
    >
      <div className="absolute inset-0 bg-[#141210]" />
      {isActive && (
        <div className="absolute inset-0 opacity-[0.06]" style={{ background: "radial-gradient(ellipse at 50% 30%, #f59e0b 0%, transparent 60%)" }} />
      )}

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Eye style={{ width: 28, height: 28, color: isActive ? "#f59e0b" : "#5a5550" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">EVENING WINDOW</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-[48px] text-center">
            {isActive ? (
              <>
                <div className="text-[64px] font-mono font-bold text-amber-500 leading-none tracking-wider">ACTIVE</div>
                {window && (
                  <div className="text-[32px] font-mono text-amber-400/70 mt-[16px]">WINDOW {window}</div>
                )}
              </>
            ) : (
              <div className="text-[64px] font-mono font-bold text-[#3a3530] leading-none tracking-wider">INACTIVE</div>
            )}
          </div>

          <div className="w-full max-w-[700px] bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622] mb-[32px]">
            <div className="text-[20px] text-[#7a746a] font-mono mb-[16px]">SURVEILLANCE INDEX</div>
            <div className="flex items-end gap-[16px]">
              <div className="text-[96px] font-mono font-bold leading-none" style={{ color }}>{score.toFixed(0)}</div>
              <div className="text-[24px] font-mono text-[#7a746a] pb-[12px]">/ 100</div>
            </div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[700px] bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622]">
              <div className="text-[20px] text-[#7a746a] font-mono mb-[16px]">18:00 — 22:00 CST (UTC-6)</div>
              <div className="text-[18px] text-[#5a5550] font-mono leading-relaxed">
                Historically elevated signal activity observed during this window. Pipeline ramps to ELEVATED mode automatically. Guacima Abajo, Costa Rica.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">6-10 PM daily pattern</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

const TEMPLATE_LIST: { id: CardTemplate; icon: typeof Shield; labelKey: string }[] = [
  { id: "kappa", icon: Shield, labelKey: "social.templateKappa" },
  { id: "satellite", icon: Satellite, labelKey: "social.templateSatellite" },
  { id: "correlation", icon: Zap, labelKey: "social.templateCorrelation" },
  { id: "domains", icon: Activity, labelKey: "social.templateDomains" },
  { id: "evening", icon: Eye, labelKey: "social.templateEvening" },
];

const FORMAT_LIST: { id: CardFormat; icon: typeof Square; labelKey: string }[] = [
  { id: "square", icon: Square, labelKey: "social.formatSquare" },
  { id: "portrait", icon: RectangleVertical, labelKey: "social.formatPortrait" },
  { id: "story", icon: Smartphone, labelKey: "social.formatStory" },
];

export default function SocialPage() {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>("kappa");
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>("square");
  const [isExporting, setIsExporting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [captionData, setCaptionData] = useState<{ caption: string; hashtags: string[]; altText: string; fallback?: boolean } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: socialData, isLoading } = useQuery<SocialCardData>({
    queryKey: ["/api/social/data"],
    refetchInterval: 30000,
  });

  const captionMutation = useMutation({
    mutationFn: async (template: string) => {
      const res = await apiRequest("POST", "/api/social/caption", { template });
      return res.json();
    },
    onSuccess: (data) => setCaptionData(data),
  });

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const cardElement = cardRef.current.firstElementChild as HTMLElement;
      if (!cardElement) return;

      const dataUrl = await toPng(cardElement, {
        width: FORMAT_DIMENSIONS[selectedFormat].w,
        height: FORMAT_DIMENSIONS[selectedFormat].h,
        pixelRatio: 1,
        style: { transform: "none", width: `${FORMAT_DIMENSIONS[selectedFormat].w}px`, height: `${FORMAT_DIMENSIONS[selectedFormat].h}px` },
      });
      const link = document.createElement("a");
      link.download = `kappa-${selectedTemplate}-${selectedFormat}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [selectedTemplate, selectedFormat]);

  const dim = FORMAT_DIMENSIONS[selectedFormat];
  const previewW = dim.w * PREVIEW_SCALE;
  const previewH = dim.h * PREVIEW_SCALE;

  const renderCard = useCallback((template: CardTemplate, data: SocialCardData, fmt: CardFormat) => {
    switch (template) {
      case "kappa": return <KappaScoreCard data={data} format={fmt} />;
      case "satellite": return <SatelliteCard data={data} format={fmt} />;
      case "correlation": return <CorrelationCard data={data} format={fmt} />;
      case "domains": return <DomainCard data={data} format={fmt} />;
      case "evening": return <EveningWindowCard data={data} format={fmt} />;
    }
  }, []);

  const gridTemplates: CardTemplate[] = ["kappa", "satellite", "correlation", "domains", "evening", "kappa", "satellite", "domains", "correlation"];
  const gridItems = useMemo(() => {
    if (!socialData) return [];
    return gridTemplates.slice(0, 9).map((tmpl, i) => ({
      template: tmpl,
      key: `grid-${i}`,
    }));
  }, [socialData]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const cardData: SocialCardData = socialData ?? {
    kappa: null,
    totalEvents: 0,
    totalCorrelations: 0,
    domainCounts: {},
    recentCorrelations: [],
    recentEvents: [],
    satelliteCount: 0,
    visibleSatellites: 0,
    overheadSatellites: 0,
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-social-title">{t("social.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-social-description">{t("social.description")}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{t("social.preview")}</CardTitle>
                  <CardDescription className="text-xs font-mono">{dim.label}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showGrid ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    data-testid="button-toggle-grid"
                  >
                    <Grid3x3 className="h-4 w-4 mr-1" />
                    {t("social.gridView")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting}
                    data-testid="button-export-png"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                    {t("social.export")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!showGrid ? (
                <div className="flex justify-center">
                  <div
                    ref={cardRef}
                    style={{
                      width: previewW,
                      height: previewH,
                      overflow: "hidden",
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left", width: dim.w, height: dim.h }}>
                      {renderCard(selectedTemplate, cardData, selectedFormat)}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-mono">{t("social.igGrid")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 max-w-[500px] mx-auto">
                    {gridItems.map((item) => (
                      <div
                        key={item.key}
                        className="aspect-square overflow-hidden rounded-[2px]"
                        style={{ border: "1px solid hsl(var(--border))" }}
                      >
                        <div style={{ transform: `scale(${160 / 1080})`, transformOrigin: "top left", width: 1080, height: 1080 }}>
                          {renderCard(item.template, cardData, "square")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("social.template")}</CardTitle>
              <CardDescription className="text-xs">{t("social.templateDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEMPLATE_LIST.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    selectedTemplate === tmpl.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={`button-template-${tmpl.id}`}
                >
                  <tmpl.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{t(tmpl.labelKey as any)}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("social.format")}</CardTitle>
              <CardDescription className="text-xs">{t("social.formatDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {FORMAT_LIST.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    selectedFormat === fmt.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={`button-format-${fmt.id}`}
                >
                  <fmt.icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span>{t(fmt.labelKey as any)}</span>
                    <span className="text-xs opacity-70 font-mono">{FORMAT_DIMENSIONS[fmt.id].label}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("social.liveData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataEvents")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-events">{cardData.totalEvents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataCorrelations")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-correlations">{cardData.totalCorrelations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataSatellites")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-satellites">{cardData.satelliteCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataKappa")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-kappa">{(cardData.kappa?.score ?? 0).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataDomains")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-domains">{Object.keys(cardData.domainCounts).filter(k => cardData.domainCounts[k] > 0).length}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">{t("social.refreshNote")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t("social.aiCaption")}
              </CardTitle>
              <CardDescription className="text-xs">{t("social.aiCaptionDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                size="sm"
                className="w-full"
                onClick={() => captionMutation.mutate(selectedTemplate)}
                disabled={captionMutation.isPending}
                data-testid="button-generate-caption"
              >
                {captionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {captionMutation.isPending ? t("social.generating") : t("social.generateCaption")}
              </Button>

              {captionMutation.isError && (
                <p className="text-xs text-destructive font-mono pt-2 border-t" data-testid="text-caption-error">
                  {t("social.aiFallback")}
                </p>
              )}

              {captionData && !captionMutation.isError && (
                <div className="space-y-3 pt-2 border-t">
                  {captionData.fallback && (
                    <p className="text-xs text-amber-500 font-mono" data-testid="text-caption-fallback">{t("social.aiFallback")}</p>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{t("social.captionResult")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(captionData.caption, "caption")}
                        data-testid="button-copy-caption"
                      >
                        {copiedField === "caption" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-xs whitespace-pre-line leading-relaxed bg-muted/50 rounded-md p-2 max-h-48 overflow-y-auto" data-testid="text-caption-content">
                      {captionData.caption}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{t("social.hashtags")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(captionData.hashtags.join(" "), "hashtags")}
                        data-testid="button-copy-hashtags"
                      >
                        {copiedField === "hashtags" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1" data-testid="text-hashtags-list">
                      {captionData.hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-mono">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{t("social.altText")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(captionData.altText, "alt")}
                        data-testid="button-copy-alt"
                      >
                        {copiedField === "alt" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2" data-testid="text-alt-content">
                      {captionData.altText}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCopy(
                      `${captionData.caption}\n\n${captionData.hashtags.join(" ")}`,
                      "all"
                    )}
                    data-testid="button-copy-all"
                  >
                    {copiedField === "all" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copiedField === "all" ? t("social.copied") : t("social.copyAll")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
