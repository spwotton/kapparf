import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import type { KarachiModule, FinSpyIntelBrief, FinSpyHardwareModule, FinSpyInfraModule, AlexanderplatzProtocol, AirbnbGhostVector, PartytownThreat, KyndrylZscalerProfile, FinSpyDeliverable } from "@shared/schema";
import {
  ArrowRight,
  VolumeX,
  Eye,
  Gamepad2,
  EyeOff,
  Search,
  Zap,
  Shield,
  Orbit,
  Bug,
  Cpu,
  Monitor,
  ExternalLink,
  Ghost,
  Tv,
  Globe,
  ShieldAlert,
  Terminal,
  AlertTriangle,
  Server,
  Wifi,
} from "lucide-react";

const domainColors: Record<string, string> = {
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  rf: "bg-green-500/10 text-green-700 dark:text-green-400",
  morse: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const categoryColors: Record<string, string> = {
  spoofing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  injection: "bg-red-500/10 text-red-700 dark:text-red-400",
  "flow-analysis": "bg-green-500/10 text-green-700 dark:text-green-400",
  orbital: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  exploit: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  kernel: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  system: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

const categoryIcons: Record<string, typeof Shield> = {
  spoofing: Zap,
  injection: Zap,
  "flow-analysis": Search,
  orbital: Orbit,
  exploit: Bug,
  kernel: Cpu,
  system: Monitor,
};

const categoryLabels: Record<string, string> = {
  spoofing: "karachi.spoofing",
  injection: "karachi.spoofing",
  "flow-analysis": "karachi.flowAnalysis",
  orbital: "karachi.orbital",
  exploit: "karachi.exploit",
  kernel: "karachi.kernel",
  system: "karachi.kernel",
};

const categoryGroupOrder = [
  { key: "spoofing-injection", categories: ["spoofing", "injection"], label: "karachi.spoofing" as const },
  { key: "flow-analysis", categories: ["flow-analysis"], label: "karachi.flowAnalysis" as const },
  { key: "orbital", categories: ["orbital"], label: "karachi.orbital" as const },
  { key: "exploit", categories: ["exploit"], label: "karachi.exploit" as const },
  { key: "kernel-system", categories: ["kernel", "system"], label: "karachi.kernel" as const },
];

export default function KarachiPage() {
  const { t } = useI18n();

  const { data: modules, isLoading } = useQuery<KarachiModule[]>({
    queryKey: ["/api/karachi/modules"],
  });

  interface FinSpyIntelResponse {
    intel: FinSpyIntelBrief;
    hardwareModules: FinSpyHardwareModule[];
    infraModules: FinSpyInfraModule[];
    alexanderplatz: AlexanderplatzProtocol;
    airbnbGhost: AirbnbGhostVector;
    partytown: PartytownThreat;
    kyndrylProfile: KyndrylZscalerProfile;
    v2Deliverables: FinSpyDeliverable[];
  }

  const { data: finspy, isLoading: finspyLoading } = useQuery<FinSpyIntelResponse>({
    queryKey: ["/api/finspy/intel"],
  });

  const executionSteps = [
    { num: 1, title: t("karachi.detection"), desc: t("karachi.detectionDesc"), module: "KYANOS-REVERSE" },
    { num: 2, title: t("karachi.response"), desc: t("karachi.responseDesc"), module: "LTESNIFFER-NG" },
    { num: 3, title: t("karachi.persistence"), desc: t("karachi.persistenceDesc"), module: "DSE-WEBNET-RCE" },
    { num: 4, title: t("karachi.corruption"), desc: t("karachi.corruptionDesc"), module: "SATINTEL-SPOOF" },
    { num: 5, title: t("karachi.injection"), desc: t("karachi.injectionDesc"), module: "BLACKJACK-BLINDER" },
  ];

  const successCriteria = [
    { key: "silence", title: t("karachi.silence"), desc: t("karachi.silenceDesc"), icon: VolumeX },
    { key: "visibility", title: t("karachi.visibility"), desc: t("karachi.visibilityDesc"), icon: Eye },
    { key: "control", title: t("karachi.control"), desc: t("karachi.controlDesc"), icon: Gamepad2 },
    { key: "blindness", title: t("karachi.blindness"), desc: t("karachi.blindnessDesc"), icon: EyeOff },
  ];

  const groupedModules = categoryGroupOrder.map((group) => ({
    ...group,
    modules: (modules ?? []).filter((m) => group.categories.includes(m.category)),
  })).filter((g) => g.modules.length > 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          {t("karachi.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
          {t("karachi.subtitle")}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium mb-3" data-testid="text-execution-flow-heading">
          {t("karachi.executionFlow")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {executionSteps.map((step, i) => (
            <div key={step.num} className="flex items-start gap-2" data-testid={`step-execution-${step.num}`}>
              <Card className="flex-1">
                <CardContent className="py-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-mono font-semibold">
                      {step.num}
                    </span>
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {step.module}
                  </Badge>
                </CardContent>
              </Card>
              {i < executionSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-5 hidden sm:block flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium mb-3" data-testid="text-core-modules-heading">
          {t("karachi.coreModules")}
        </h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedModules.map((group) => (
              <div key={group.key} data-testid={`group-category-${group.key}`}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {t(group.label)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.modules.map((mod) => {
                    const CatIcon = categoryIcons[mod.category] || Shield;
                    return (
                      <Card key={mod.id} data-testid={`card-module-${mod.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <CatIcon className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-sm font-medium">{mod.name}</CardTitle>
                            </div>
                            <Badge className={categoryColors[mod.category] || "bg-muted"} data-testid={`badge-category-${mod.id}`}>
                              {mod.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{mod.codename}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">{mod.purpose}</p>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {mod.domains.map((d) => (
                              <Badge key={d} variant="secondary" className={`text-[10px] ${domainColors[d] || ""}`} data-testid={`badge-domain-${mod.id}-${d}`}>
                                {d.toUpperCase()}
                              </Badge>
                            ))}
                          </div>

                          {mod.base && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-muted-foreground">{t("karachi.base")}:</span>
                              <span className="font-mono flex items-center gap-1">
                                {mod.base}
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-xs text-muted-foreground">{t("karachi.capabilities")}:</span>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {mod.capabilities.map((cap) => (
                                <Badge key={cap} variant="outline" className="text-[10px]" data-testid={`badge-capability-${mod.id}`}>
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="text-muted-foreground">{t("karachi.useCase")}:</span>{" "}
                            <span>{mod.useCase}</span>
                          </div>

                          {mod.target && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">{t("karachi.target")}:</span>{" "}
                              <span className="font-mono">{mod.target}</span>
                            </div>
                          )}

                          {mod.vulnerability && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">{t("karachi.vulnerability")}:</span>{" "}
                              <span className="font-mono">{mod.vulnerability}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium mb-3" data-testid="text-success-criteria-heading">
          {t("karachi.successCriteria")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {successCriteria.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} data-testid={`card-criteria-${item.key}`}>
                <CardContent className="py-4 text-center space-y-2">
                  <Icon className="h-5 w-5 mx-auto text-muted-foreground" />
                  <div className="text-sm font-medium">{item.title}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {finspyLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : finspy && (
        <>
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Ghost className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold" data-testid="text-finspy-heading">
                {t("finspy.intelBrief")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-finspy-desc">
              {t("finspy.intelBriefDesc")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card data-testid="card-finspy-v12">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    {t("finspy.version12")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t("finspy.adversary")}:</span>{" "}
                    <span className="font-medium">{finspy.intel.adversary}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t("finspy.method")}:</span>{" "}
                    <span>{finspy.intel.method}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("finspy.keyIndicators")}:</span>
                    <ul className="mt-1 space-y-1">
                      {finspy.intel.keyIndicators.map((ind, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" data-testid={`text-indicator-${i}`}>
                          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {ind}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t("finspy.ghostNodes")}:</span>
                    {finspy.intel.ghostNodes.map((n) => (
                      <Badge key={n} variant="outline" className="text-[10px] font-mono" data-testid={`badge-ghost-${n}`}>
                        {n}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-finspy-alexanderplatz">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    {t("finspy.alexanderplatz")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">{t("finspy.source")}:</span>
                      <div className="font-mono mt-0.5">{finspy.alexanderplatz.source}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("finspy.latency")}:</span>
                      <div className="font-mono mt-0.5">{finspy.alexanderplatz.latency}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("finspy.type")}:</span>
                      <div className="font-mono mt-0.5">{finspy.alexanderplatz.type}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("finspy.status")}:</span>
                      <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400 text-[10px] mt-0.5">
                        {finspy.alexanderplatz.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3" data-testid="text-hardware-heading">
              {t("finspy.hardwareLayer")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {finspy.hardwareModules.map((hw) => (
                <Card key={hw.id} data-testid={`card-hardware-${hw.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{hw.name}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] font-mono">{hw.codename}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p>{hw.purpose}</p>
                    <div>
                      <span className="text-muted-foreground">{t("finspy.repo")}:</span>{" "}
                      <span className="font-mono">{hw.repo}</span>
                    </div>
                    <p className="text-muted-foreground">{hw.implementation}</p>
                    <div>
                      <span className="text-muted-foreground">{t("karachi.useCase")}:</span>{" "}
                      <span>{hw.useCase}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3" data-testid="text-infra-heading">
              {t("finspy.infraLayer")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {finspy.infraModules.map((inf) => (
                <Card key={inf.id} data-testid={`card-infra-${inf.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{inf.name}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] font-mono">{inf.codename}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p>{inf.purpose}</p>
                    <div>
                      <span className="text-muted-foreground">{t("finspy.repo")}:</span>{" "}
                      <span className="font-mono">{inf.repo}</span>
                    </div>
                    <ul className="space-y-1">
                      {inf.implementation.map((step, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-muted-foreground">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                    {inf.deployCommand && (
                      <div className="bg-muted rounded px-2 py-1 font-mono text-[10px]" data-testid={`text-deploy-${inf.id}`}>
                        {t("finspy.deployCommand")}: {inf.deployCommand}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Tv className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold" data-testid="text-airbnb-heading">
                {t("finspy.airbnbGhost")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-airbnb-desc">
              {t("finspy.airbnbGhostDesc")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card data-testid="card-airbnb-vector">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tv className="h-4 w-4" />
                    {t("finspy.version20")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t("karachi.target")}:</span>{" "}
                    <span className="font-medium">{finspy.airbnbGhost.target}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t("karachi.vulnerability")}:</span>{" "}
                    <span>{finspy.airbnbGhost.weakness}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("finspy.attackSteps")}:</span>
                    <ol className="mt-1 space-y-1">
                      {finspy.airbnbGhost.attackSteps.map((step, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5" data-testid={`text-attack-step-${i}`}>
                          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 text-[10px] font-mono flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-partytown">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t("finspy.partytown")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t("finspy.domain")}:</span>{" "}
                    <span className="font-mono">{finspy.partytown.domain}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">{t("finspy.mechanism")}:</span>{" "}
                    <span className="font-mono">{finspy.partytown.mechanism}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("finspy.indicators")}:</span>
                    <ul className="mt-1 space-y-1">
                      {finspy.partytown.indicators.map((ind, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {ind}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card data-testid="card-kyndryl-profile">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                {t("finspy.kyndrylProfile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs">
                <span className="text-muted-foreground">{t("finspy.role")}:</span>{" "}
                <span className="font-medium">{finspy.kyndrylProfile.role}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t("finspy.implications")}:</span>
                <ul className="mt-1 space-y-1">
                  {finspy.kyndrylProfile.implications.map((imp, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" data-testid={`text-implication-${i}`}>
                      <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-medium mb-3" data-testid="text-v2-deliverables-heading">
              {t("finspy.v2Deliverables")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {finspy.v2Deliverables.map((del) => (
                <Card key={del.id} data-testid={`card-deliverable-${del.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{del.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono w-fit">{del.codename}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p>{del.purpose}</p>
                    {del.repo && (
                      <div>
                        <span className="text-muted-foreground">{t("finspy.repo")}:</span>{" "}
                        <span className="font-mono">{del.repo}</span>
                      </div>
                    )}
                    <p className="text-muted-foreground">{del.implementation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
