import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { GOS_CONSTANTS, type DetectionEvent } from "@shared/schema";
import { MapPin, Clock, Activity, Target } from "lucide-react";

function PhoenixCountdown() {
  const { t } = useI18n();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const phoenix = GOS_CONSTANTS.PHOENIX_DATE;
  const diff = phoenix.getTime() - now.getTime();
  const totalDays = diff / (1000 * 60 * 60 * 24);
  const years = Math.floor(totalDays / 365.25);
  const months = Math.floor((totalDays % 365.25) / 30.44);
  const days = Math.floor(totalDays % 30.44);
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const startDate = new Date("2012-07-04T00:00:00Z");
  const totalSpan = phoenix.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progress = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{t("overview.countdown")}</CardTitle>
        </div>
        <CardDescription className="text-xs">{t("overview.countdownDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { value: years, label: t("overview.years") },
            { value: months, label: t("overview.months") },
            { value: days, label: t("overview.days") },
            { value: hours, label: t("overview.hours") },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-mono font-semibold tabular-nums" data-testid={`text-countdown-${item.label}`}>
                {item.value}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
            <span>{t("overview.progress")}</span>
            <span className="font-mono">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" data-testid="progress-phoenix" />
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineStatus() {
  const { t } = useI18n();
  const { data: pipeline } = useQuery<{
    running: boolean;
    cycleCount: number;
    lastCycle: string | null;
    nextCycle: string | null;
  }>({
    queryKey: ["/api/pipeline/status"],
    refetchInterval: 5000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{t("overview.pipeline")}</CardTitle>
        </div>
        <CardDescription className="text-xs">{t("overview.pipelineDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!pipeline ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm text-muted-foreground">{t("overview.status")}</span>
              <Badge variant={pipeline.running ? "default" : "secondary"} data-testid="badge-pipeline-status">
                {pipeline.running ? t("overview.running") : t("overview.stopped")}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm text-muted-foreground">{t("overview.cycleCount")}</span>
              <span className="text-sm font-mono" data-testid="text-cycle-count">{pipeline.cycleCount}</span>
            </div>
            {pipeline.lastCycle && (
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm text-muted-foreground">{t("overview.lastCycle")}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {new Date(pipeline.lastCycle).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ObserverCard() {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{t("overview.observer")}</CardTitle>
        </div>
        <CardDescription className="text-xs">{t("overview.observerDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[
            { label: t("overview.lat"), value: `${GOS_CONSTANTS.OBSERVER_LAT}\u00B0 N` },
            { label: t("overview.lon"), value: `${Math.abs(GOS_CONSTANTS.OBSERVER_LON)}\u00B0 W` },
            { label: t("overview.alt"), value: `${GOS_CONSTANTS.OBSERVER_ALT} km` },
            { label: t("overview.minElev"), value: `${GOS_CONSTANTS.MIN_ELEVATION}\u00B0` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-1">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-mono">{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { t } = useI18n();
  const { data: detections, isLoading } = useQuery<DetectionEvent[]>({
    queryKey: ["/api/detections", "recent"],
    refetchInterval: 10000,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("overview.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("overview.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PipelineStatus />
        <PhoenixCountdown />
        <ObserverCard />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{t("overview.recentDetections")}</h2>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !detections || detections.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("overview.noDetections")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {detections.slice(0, 5).map((d) => (
              <Card key={d.id}>
                <CardContent className="py-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{d.frequency.toFixed(3)} Hz</span>
                    <Badge variant="secondary">{d.source}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>SNR {d.snr.toFixed(1)} dB</span>
                    <span>{d.confidence.toFixed(0)}%</span>
                    <span className="font-mono">{new Date(d.timestamp).toLocaleTimeString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
