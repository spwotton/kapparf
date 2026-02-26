import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n";
import {
  type SatellitePass,
  TLE_CATALOG_GROUPS,
  TLE_CATEGORIES,
  KAPPA_CONSTANTS,
  type TleCatalogGroup,
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  stations: "bg-red-500/10 text-red-700 dark:text-red-400",
  visual: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  weather: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  noaa: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  goes: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  resource: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  sarsat: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  gnss: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  comms: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  amateur: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  science: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  military: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  cubesat: "bg-lime-500/10 text-lime-700 dark:text-lime-400",
  recent: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  dmc: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  tdrss: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  argos: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  planet: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  spire: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  geo: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400",
  engineering: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
  education: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

const priorityGroups = ["stations", "starlink", "military", "noaa", "goes", "iridium-next", "gpz", "glonass", "galileo", "beidou"];

export default function SatellitesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["stations", "noaa", "goes", "weather"]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: satellites, isLoading } = useQuery<SatellitePass[]>({
    queryKey: ["/api/satellites"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/satellites/refresh", { groups: selectedGroups }),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/satellites"] });
      toast({ title: `${t("satellites.refreshed")} — ${data.refreshed} satellites from ${Object.keys(data.groups).length} groups` });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const selectAllInCategory = (category: string) => {
    const ids = TLE_CATALOG_GROUPS.filter((g) => g.category === category).map((g) => g.id);
    const allSelected = ids.every((id) => selectedGroups.includes(id));
    if (allSelected) {
      setSelectedGroups((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedGroups((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const categories = Object.keys(TLE_CATEGORIES);
  const filteredSatellites = categoryFilter === "all"
    ? satellites
    : satellites?.filter((s) => s.category === categoryFilter);

  const visibleCount = satellites?.filter((s) => s.elevation != null && s.elevation >= KAPPA_CONSTANTS.MIN_ELEVATION).length ?? 0;
  const overheadCount = satellites?.filter((s) => s.elevation != null && s.elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION).length ?? 0;

  const groupedByCategory: Record<string, TleCatalogGroup[]> = {};
  for (const g of TLE_CATALOG_GROUPS) {
    if (!groupedByCategory[g.category]) groupedByCategory[g.category] = [];
    groupedByCategory[g.category].push(g);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("satellites.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("satellites.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCatalog(!showCatalog)}
            data-testid="button-toggle-catalog"
          >
            {showCatalog ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {t("satellites.catalogGroups")} ({selectedGroups.length})
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || selectedGroups.length === 0}
            data-testid="button-refresh-tle"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            {refreshMutation.isPending ? t("satellites.refreshing") : t("satellites.refresh")}
          </Button>
        </div>
      </div>

      {showCatalog && (
        <Card>
          <CardContent className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{t("satellites.selectGroups")}</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedGroups(priorityGroups)} data-testid="button-select-priority">
                  {t("satellites.priority")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedGroups(TLE_CATALOG_GROUPS.map(g => g.id))} data-testid="button-select-all">
                  {t("satellites.selectAll")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedGroups([])} data-testid="button-select-none">
                  {t("satellites.clear")}
                </Button>
              </div>
            </div>
            {Object.entries(groupedByCategory).map(([cat, groups]) => (
              <div key={cat}>
                <button
                  onClick={() => selectAllInCategory(cat)}
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors cursor-pointer"
                >
                  {TLE_CATEGORIES[cat] || cat} ({groups.length})
                </button>
                <div className="flex gap-2 flex-wrap">
                  {groups.map((g) => (
                    <label key={g.id} className="flex items-center gap-1.5 text-sm cursor-pointer" data-testid={`checkbox-group-${g.id}`}>
                      <Checkbox
                        checked={selectedGroups.includes(g.id)}
                        onCheckedChange={() => toggleGroup(g.id)}
                      />
                      <span className={selectedGroups.includes(g.id) ? "font-medium" : "text-muted-foreground"}>{g.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold" data-testid="text-sat-total">{satellites?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">{t("satellites.totalTracked")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold text-green-600" data-testid="text-sat-visible">{visibleCount}</div>
            <div className="text-xs text-muted-foreground">{t("satellites.visibleAbove")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold text-red-600" data-testid="text-sat-overhead">{overheadCount}</div>
            <div className="text-xs text-muted-foreground">{t("satellites.overhead")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold">{new Set(satellites?.map(s => s.category)).size}</div>
            <div className="text-xs text-muted-foreground">{t("satellites.categories")}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={categoryFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setCategoryFilter("all")}
          data-testid="button-cat-filter-all"
        >
          {t("satellites.allCategories")} ({satellites?.length ?? 0})
        </Button>
        {categories.map((cat) => {
          const count = satellites?.filter(s => s.category === cat).length ?? 0;
          if (count === 0) return null;
          return (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              data-testid={`button-cat-filter-${cat}`}
            >
              {TLE_CATEGORIES[cat]} ({count})
            </Button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !filteredSatellites || filteredSatellites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("satellites.noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-8 gap-2 p-3 text-xs font-medium text-muted-foreground border-b">
            <span>{t("satellites.name")}</span>
            <span>{t("satellites.norad")}</span>
            <span>{t("satellites.category")}</span>
            <span>{t("satellites.elevation")}</span>
            <span>{t("satellites.azimuth")}</span>
            <span>{t("satellites.range")}</span>
            <span>{t("satellites.subpoint")}</span>
            <span>{t("satellites.lastUpdate")}</span>
          </div>
          {filteredSatellites.map((s) => (
            <div key={s.id} className="grid grid-cols-8 gap-2 p-3 text-sm border-b last:border-b-0 items-center" data-testid={`row-satellite-${s.id}`}>
              <span className="font-medium truncate" title={s.satelliteName}>{s.satelliteName}</span>
              <span className="font-mono text-muted-foreground">{s.noradId}</span>
              <span>
                <Badge variant="secondary" className={`text-[10px] ${categoryColors[s.category] || ""}`}>
                  {TLE_CATEGORIES[s.category] || s.category}
                </Badge>
              </span>
              <span className="font-mono">
                {s.elevation != null ? (
                  <span>
                    {s.elevation.toFixed(1)}&deg;
                    {s.elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION ? (
                      <Badge variant="destructive" className="ml-1.5 text-[10px]" data-testid={`badge-overhead-${s.id}`}>{t("satellites.overhead")}</Badge>
                    ) : s.elevation >= KAPPA_CONSTANTS.MIN_ELEVATION ? (
                      <Badge variant="default" className="ml-1.5 text-[10px]">{t("satellites.visible")}</Badge>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground">--</span>
                )}
              </span>
              <span className="font-mono">{s.azimuth != null ? `${s.azimuth.toFixed(1)}\u00B0` : "--"}</span>
              <span className="font-mono">{s.range != null ? `${s.range.toFixed(0)} km` : "--"}</span>
              <span className="font-mono text-xs">
                {s.latitude != null && s.longitude != null
                  ? `${s.latitude.toFixed(1)}°, ${s.longitude.toFixed(1)}°`
                  : "--"}
              </span>
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
