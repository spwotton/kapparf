import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { type SatellitePass } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SatellitesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { data: satellites, isLoading } = useQuery<SatellitePass[]>({
    queryKey: ["/api/satellites"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/satellites/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/satellites"] });
      toast({ title: "TLE data refreshed" });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("satellites.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("satellites.description")}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          data-testid="button-refresh-tle"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          {t("satellites.refresh")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !satellites || satellites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("satellites.noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-6 gap-2 p-3 text-xs font-medium text-muted-foreground border-b">
            <span>{t("satellites.name")}</span>
            <span>{t("satellites.norad")}</span>
            <span>{t("satellites.elevation")}</span>
            <span>{t("satellites.azimuth")}</span>
            <span>{t("satellites.range")}</span>
            <span>{t("satellites.lastUpdate")}</span>
          </div>
          {satellites.map((s) => (
            <div key={s.id} className="grid grid-cols-6 gap-2 p-3 text-sm border-b last:border-b-0 items-center" data-testid={`row-satellite-${s.id}`}>
              <span className="font-medium">{s.satelliteName}</span>
              <span className="font-mono text-muted-foreground">{s.noradId}</span>
              <span className="font-mono">
                {s.elevation != null ? (
                  <span>
                    {s.elevation.toFixed(1)}&deg;
                    {s.elevation >= 30 && <Badge variant="default" className="ml-1.5 text-[10px]">VISIBLE</Badge>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">--</span>
                )}
              </span>
              <span className="font-mono">{s.azimuth != null ? `${s.azimuth.toFixed(1)}\u00B0` : "--"}</span>
              <span className="font-mono">{s.range != null ? `${s.range.toFixed(0)} km` : "--"}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(s.updatedAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
