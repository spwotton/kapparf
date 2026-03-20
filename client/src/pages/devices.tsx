import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import type { DeviceFingerprint } from "@shared/schema";
import { Fingerprint, AlertTriangle, Layers } from "lucide-react";

const domainColors: Record<string, string> = {
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  rf: "bg-green-500/10 text-green-700 dark:text-green-400",
  morse: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default function DevicesPage() {
  const { t } = useI18n();

  const { data: devices, isLoading, isError } = useQuery<DeviceFingerprint[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 5000,
  });

  const sortedDevices = devices
    ? [...devices].sort((a, b) => {
        if (a.suspicious !== b.suspicious) return a.suspicious ? -1 : 1;
        return b.crossDomainCount - a.crossDomainCount;
      })
    : [];

  const totalDevices = devices?.length ?? 0;
  const suspiciousCount = devices?.filter((d) => d.suspicious).length ?? 0;
  const multiDomainCount = devices?.filter((d) => d.domainsSeen.length >= 3).length ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {t("devices.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("devices.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("devices.totalDevices")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-mono font-semibold tabular-nums" data-testid="text-total-devices">
                {totalDevices}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("devices.suspiciousCount")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-mono font-semibold tabular-nums" data-testid="text-suspicious-count">
                {suspiciousCount}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("devices.multiDomain")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-mono font-semibold tabular-nums" data-testid="text-multi-domain-count">
                {multiDomainCount}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive" data-testid="text-devices-error">
            {t("common.error")}
          </CardContent>
        </Card>
      ) : sortedDevices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("devices.noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 p-3 text-xs font-medium text-muted-foreground border-b min-w-[700px]">
            <span>{t("devices.mac")}</span>
            <span>{t("devices.domainsSeen")}</span>
            <span>{t("devices.eventCount")}</span>
            <span>{t("devices.crossDomain")}</span>
            <span>{t("devices.firstSeen")}</span>
            <span>{t("devices.lastSeen")}</span>
            <span>{t("devices.status")}</span>
          </div>
          {sortedDevices.map((device, index) => (
            <div
              key={device.mac}
              className="grid grid-cols-7 gap-2 p-3 text-sm border-b last:border-b-0 items-center min-w-[700px]"
              data-testid={`row-device-${index}`}
            >
              <span className="font-mono text-xs truncate" title={device.mac}>
                {device.mac.substring(0, 11)}
              </span>
              <div className="flex gap-1 flex-wrap">
                {device.domainsSeen.map((d) => (
                  <Badge
                    key={d}
                    variant="secondary"
                    className={`text-xs ${domainColors[d] || ""}`}
                  >
                    {d.toUpperCase()}
                  </Badge>
                ))}
              </div>
              <span className="font-mono text-xs">{device.eventCount}</span>
              <span className="font-mono text-xs">{device.crossDomainCount}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(device.firstSeen).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(device.lastSeen).toLocaleString()}
              </span>
              <div>
                {device.suspicious ? (
                  <Badge variant="destructive" className="text-xs" data-testid={`badge-status-suspicious-${index}`}>
                    {t("devices.suspicious")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs" data-testid={`badge-status-normal-${index}`}>
                    {t("devices.normal")}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
