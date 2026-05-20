import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import {
  KAPPA_CONSTANTS,
  type VetElement,
  type CongustoModule,
  type PhoenixCountdown,
} from "@shared/schema";
import {
  FlaskConical,
  Timer,
  Cpu,
  ArrowRight,
  Database,
  BarChart3,
  Radio,
  Satellite,
  Shield,
  Search,
  Server,
  Gauge,
} from "lucide-react";

const elementColors: Record<string, { bg: string; border: string; badge: string }> = {
  cathode: {
    bg: "bg-blue-500/5 dark:bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  grid: {
    bg: "bg-yellow-500/5 dark:bg-yellow-500/10",
    border: "border-yellow-500/20",
    badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
  anode: {
    bg: "bg-green-500/5 dark:bg-green-500/10",
    border: "border-green-500/20",
    badge: "bg-green-500/10 text-green-700 dark:text-green-400",
  },
};

const elementIcons: Record<string, typeof Radio> = {
  cathode: Radio,
  grid: Gauge,
  anode: Database,
};

const confidenceLevels = [
  { key: "high", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { key: "medium", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  { key: "low", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
];

const mathConstants = [
  { symbol: "κ", name: "Kappa", value: (4 / Math.PI).toFixed(6), unit: "" },
  { symbol: "θ_K", name: "Theta-K", value: (180 - (Math.atan(4 / Math.PI) * 180 / Math.PI)).toFixed(4), unit: "°" },
  { symbol: "f₁", name: "Congusto Frequency", value: "46.875", unit: "Hz" },
  { symbol: "f₂", name: "Hall Sideband", value: "74.9", unit: "Hz" },
  { symbol: "H", name: "Hall Multiplier", value: "1.598", unit: "" },
  { symbol: "f_m", name: "Mains Frequency", value: "60", unit: "Hz" },
  { symbol: "f_S", name: "Schumann Resonance", value: "7.83", unit: "Hz" },
];

const dataSources = [
  { name: "KiwiSDR TI0RC", endpoint: KAPPA_CONSTANTS.TDOA_SDR_PRIMARY, type: "WebSocket" },
  { name: "KiwiSDR Puntarenas", endpoint: KAPPA_CONSTANTS.TDOA_SDR_SECONDARY, type: "WebSocket" },
  { name: "KiwiSDR Caribbean (PJ4G)", endpoint: KAPPA_CONSTANTS.TDOA_SDR_CARIBBEAN, type: "WebSocket" },
  { name: "CelesTrak GP TLE", endpoint: "https://celestrak.org/NORAD/elements/gp.php", type: "REST API" },
  { name: "Shodan", endpoint: "https://api.shodan.io", type: "REST API" },
  { name: "OpenCellID", endpoint: "https://opencellid.org/ajax/searchCell.php", type: "REST API" },
  { name: "SNMP v2", endpoint: "UDP :161/:162", type: "Protocol" },
  { name: "TR-069 CWMP", endpoint: "TCP :7547", type: "Protocol" },
];

export default function CongustoPage() {
  const { t } = useI18n();

  const { data: architecture, isLoading: archLoading } = useQuery<VetElement[]>({
    queryKey: ["/api/congusto/architecture"],
  });

  const { data: modules, isLoading: modulesLoading } = useQuery<CongustoModule[]>({
    queryKey: ["/api/congusto/modules"],
  });

  const { data: phoenix, isLoading: phoenixLoading } = useQuery<PhoenixCountdown>({
    queryKey: ["/api/phoenix/countdown"],
    refetchInterval: 60000,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {t("congusto.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
          {t("congusto.subtitle")}
        </p>
      </div>

      <Card data-testid="card-phoenix-countdown">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("congusto.phoenixCountdown")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {phoenixLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : phoenix ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-3xl font-mono font-semibold" data-testid="text-phoenix-percent">
                    {phoenix.percentComplete.toFixed(2)}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">{t("congusto.percentComplete")}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-semibold" data-testid="text-phoenix-days">
                    {phoenix.daysRemaining.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">{t("congusto.daysRemaining")}</span>
                </div>
              </div>
              <Progress value={phoenix.percentComplete} className="h-2" data-testid="progress-phoenix" />
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                <span data-testid="text-phoenix-start">
                  {t("congusto.startDate")}: {phoenix.startDate}
                </span>
                <span className="font-mono">{phoenix.totalDays.toLocaleString()} days total</span>
                <span data-testid="text-phoenix-end">
                  {t("congusto.endDate")}: {phoenix.endDate}
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          {t("congusto.vetArchitecture")}
        </h2>
        <p className="text-xs text-muted-foreground mb-3">{t("congusto.vetDesc")}</p>
        {archLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : architecture ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {architecture.map((el, idx) => {
              const colors = elementColors[el.element];
              const Icon = elementIcons[el.element] || Cpu;
              const roleKey = el.element === "cathode" ? "congusto.signalSource"
                : el.element === "grid" ? "congusto.controlModulation"
                : "congusto.outputCollection";
              return (
                <div key={el.id} className="flex items-stretch gap-2">
                  <Card
                    className={`flex-1 border ${colors.border} ${colors.bg}`}
                    data-testid={`card-vet-${el.element}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm font-medium">
                            {t(`congusto.${el.element}` as any)}
                          </CardTitle>
                        </div>
                        <Badge className={colors.badge}>{t(roleKey as any)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">{el.description}</p>
                      <div className="text-[11px] font-mono text-muted-foreground border-t pt-2 mt-2">
                        {el.implementation}
                      </div>
                    </CardContent>
                  </Card>
                  {idx < architecture.length - 1 && (
                    <div className="hidden md:flex items-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          {t("congusto.coreModules")}
        </h2>
        {modulesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}
          </div>
        ) : modules ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <Card key={mod.id} data-testid={`card-module-${mod.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{mod.name}</CardTitle>
                  <CardDescription className="text-xs">{mod.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium">Tech:</span>
                    <span className="font-mono">{mod.technology}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{mod.implementation}</div>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {mod.features.map((feat) => (
                      <Badge key={feat} variant="secondary" className="text-[10px]">
                        {feat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      <Card data-testid="card-math-constants">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("congusto.mathConstants")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {mathConstants.map((c) => (
              <div
                key={c.symbol}
                className="flex items-center justify-between gap-2 py-1.5 border-b last:border-b-0"
                data-testid={`row-constant-${c.symbol}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold w-8">{c.symbol}</span>
                  <span className="text-sm text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-mono text-sm">
                  {c.value}{c.unit}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-data-sources">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("congusto.dataSources")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dataSources.map((src) => (
              <div
                key={src.name}
                className="flex items-center justify-between gap-2 p-2.5 border rounded-md flex-wrap"
                data-testid={`row-source-${src.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-2">
                  {src.type === "WebSocket" ? (
                    <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : src.type === "REST API" ? (
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Satellite className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{src.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{src.endpoint}</span>
                  <Badge variant="secondary" className="text-[10px]">{src.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-confidence-levels">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("congusto.confidenceLevels")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {confidenceLevels.map((level) => (
              <div
                key={level.key}
                className="flex items-start gap-3 p-3 border rounded-md"
                data-testid={`row-confidence-${level.key}`}
              >
                <Badge className={`${level.color} shrink-0 mt-0.5`}>
                  {t(`congusto.${level.key}` as any)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t(`congusto.${level.key}Desc` as any)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}