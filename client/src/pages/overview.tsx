import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { KAPPA_CONSTANTS, DOMAINS, type SignalEvent } from "@shared/schema";
import { MapPin, Activity, Wifi, Radio, Satellite, Signal } from "lucide-react";

const domainIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  ble: Signal,
  lte: Radio,
  "5g": Radio,
  satellite: Satellite,
  sdr: Radio,
  elf: Activity,
  drone: Activity,
};

const domainColors: Record<string, string> = {
  wifi: "bg-green-500/10 text-green-700 dark:text-green-400",
  ble: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  lte: "bg-red-500/10 text-red-700 dark:text-red-400",
  "5g": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  plc: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  drone: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function DashboardPage() {
  const { t } = useI18n();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalEvents: number;
    correlationCount: number;
    domainCounts: Record<string, number>;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  const { data: recentEvents, isLoading: eventsLoading } = useQuery<SignalEvent[]>({
    queryKey: ["/api/events", "recent"],
    refetchInterval: 10000,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalEvents")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-mono font-semibold tabular-nums" data-testid="text-total-events">
                {stats?.totalEvents ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalCorrelations")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-mono font-semibold tabular-nums" data-testid="text-total-correlations">
                {stats?.correlationCount ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("dashboard.observer")}</CardTitle>
            </div>
            <CardDescription className="text-xs">{t("dashboard.observerDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground">{t("dashboard.lat")}</span>
                <span className="font-mono">{KAPPA_CONSTANTS.OBSERVER_LAT}&deg; N</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground">{t("dashboard.lon")}</span>
                <span className="font-mono">{Math.abs(KAPPA_CONSTANTS.OBSERVER_LON)}&deg; W</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground">{t("dashboard.alt")}</span>
                <span className="font-mono">{KAPPA_CONSTANTS.OBSERVER_ALT} km</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{t("dashboard.domainBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex gap-3 flex-wrap">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-24" />)}
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {DOMAINS.map((domain) => {
                const count = stats?.domainCounts?.[domain] ?? 0;
                return (
                  <div
                    key={domain}
                    className={`px-3 py-1.5 rounded-md text-sm font-mono ${domainColors[domain] || "bg-muted text-muted-foreground"}`}
                    data-testid={`badge-domain-${domain}`}
                  >
                    {domain.toUpperCase()} <span className="font-semibold ml-1">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium mb-3">{t("dashboard.recentEvents")}</h2>
        {eventsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !recentEvents || recentEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.noEvents")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentEvents.slice(0, 8).map((evt) => {
              const Icon = domainIcons[evt.domain] || Activity;
              return (
                <Card key={evt.id} data-testid={`card-event-${evt.id}`}>
                  <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className={domainColors[evt.domain]}>
                        {evt.domain.toUpperCase()}
                      </Badge>
                      <span className="text-sm">{evt.eventType}</span>
                      <span className="text-sm text-muted-foreground">{evt.source}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{(evt.confidence * 100).toFixed(0)}%</span>
                      <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
