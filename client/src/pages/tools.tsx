import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { TOOL_CATALOG, DOMAINS, type ToolEntry, type ToolGitHubMeta } from "@shared/schema";
import { ExternalLink, Star, GitFork, Wrench, Zap } from "lucide-react";
import { IntegratedTools } from "@/components/integrated-tools";

const domainColors: Record<string, string> = {
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  hardware: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  rf: "bg-green-500/10 text-green-700 dark:text-green-400",
  morse: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default function ToolsPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");

  const { data: ghMeta, isLoading: metaLoading, isError: metaError } = useQuery<ToolGitHubMeta[]>({
    queryKey: ["/api/tools/meta"],
    staleTime: 30 * 60 * 1000,
  });

  const metaMap = new Map<string, ToolGitHubMeta>();
  ghMeta?.forEach(m => metaMap.set(m.name, m));

  const allDomains = [...DOMAINS, "hardware"] as const;

  const filtered: ToolEntry[] = filter === "all"
    ? TOOL_CATALOG
    : TOOL_CATALOG.filter((tool) => tool.domain === filter);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("tools.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("tools.description")}</p>
      </div>

      <Tabs defaultValue="interactive" className="w-full">
        <TabsList data-testid="tabs-tools">
          <TabsTrigger value="interactive" data-testid="tab-interactive">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            {t("tools.interactive")}
          </TabsTrigger>
          <TabsTrigger value="catalog" data-testid="tab-catalog">
            <Wrench className="h-3.5 w-3.5 mr-1.5" />
            {t("tools.catalog")} ({TOOL_CATALOG.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="mt-4">
          <IntegratedTools />
        </TabsContent>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              data-testid="button-tools-filter-all"
            >
              {t("tools.all")} ({TOOL_CATALOG.length})
            </Button>
            {allDomains.map((d) => {
              const count = TOOL_CATALOG.filter((tool) => tool.domain === d).length;
              if (count === 0) return null;
              return (
                <Button
                  key={d}
                  variant={filter === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(d)}
                  data-testid={`button-tools-filter-${d}`}
                >
                  {d.toUpperCase()} ({count})
                </Button>
              );
            })}
          </div>

          <div className="border rounded-md">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_2fr] gap-3 p-3 text-xs font-medium text-muted-foreground border-b">
              <span>{t("tools.name")}</span>
              <span>{t("tools.domain")}</span>
              <span>{t("tools.stars")}</span>
              <span>{t("tools.language")}</span>
              <span>{t("tools.license")}</span>
              <span>{t("tools.toolDescription")}</span>
            </div>
            {filtered.map((tool) => {
              const meta = metaMap.get(tool.name);
              return (
                <div
                  key={tool.name}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto_2fr] gap-3 p-3 text-sm border-b last:border-b-0 items-center"
                  data-testid={`row-tool-${tool.name}`}
                >
                  <a
                    href={tool.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium flex items-center gap-1.5 hover:underline"
                  >
                    {tool.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  <Badge variant="secondary" className={`${domainColors[tool.domain] || ""} text-[10px]`}>
                    {tool.domain.toUpperCase()}
                  </Badge>
                  <span className="font-mono text-xs flex items-center gap-1 min-w-[60px]">
                    {metaLoading ? (
                      <Skeleton className="h-4 w-12" />
                    ) : meta ? (
                      <>
                        <Star className="h-3 w-3 text-yellow-500" />
                        {meta.stars.toLocaleString()}
                        {meta.forks > 0 && (
                          <span className="text-muted-foreground ml-1 flex items-center gap-0.5">
                            <GitFork className="h-3 w-3" />
                            {meta.forks}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </span>
                  <span className="text-xs font-mono min-w-[50px]">
                    {meta?.language || <span className="text-muted-foreground">&mdash;</span>}
                  </span>
                  <span className="text-xs font-mono min-w-[60px]">
                    {meta?.license || <span className="text-muted-foreground">&mdash;</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {meta?.description || tool.description}
                    {meta?.archived && <Badge variant="destructive" className="ml-2 text-[9px]">ARCHIVED</Badge>}
                  </span>
                </div>
              );
            })}
          </div>

          <Card>
            <CardContent className="py-4 text-xs text-muted-foreground" data-testid="text-tools-summary">
              {TOOL_CATALOG.length} tools cataloged across {allDomains.filter(d => TOOL_CATALOG.some(t => t.domain === d)).length} domains.
              {ghMeta && ghMeta.length > 0 && ` GitHub metadata loaded for ${ghMeta.length} repositories.`}
              {metaLoading && ` ${t("tools.loadingMeta")}`}
              {metaError && " GitHub metadata unavailable."}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
