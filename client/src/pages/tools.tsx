import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { TOOL_CATALOG, DOMAINS, type ToolEntry } from "@shared/schema";
import { ExternalLink } from "lucide-react";

const domainColors: Record<string, string> = {
  wifi: "bg-green-500/10 text-green-700 dark:text-green-400",
  ble: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  lte: "bg-red-500/10 text-red-700 dark:text-red-400",
  "5g": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  hardware: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export default function ToolsPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");

  const allDomains = [...DOMAINS, "hardware"] as const;

  const filtered: ToolEntry[] = filter === "all"
    ? TOOL_CATALOG
    : TOOL_CATALOG.filter((tool) => tool.domain === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("tools.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("tools.description")}</p>
      </div>

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
        <div className="grid grid-cols-[1fr_auto_2fr] gap-3 p-3 text-xs font-medium text-muted-foreground border-b">
          <span>{t("tools.name")}</span>
          <span>{t("tools.domain")}</span>
          <span>{t("tools.toolDescription")}</span>
        </div>
        {filtered.map((tool) => (
          <div
            key={tool.name}
            className="grid grid-cols-[1fr_auto_2fr] gap-3 p-3 text-sm border-b last:border-b-0 items-center"
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
            <span className="text-xs text-muted-foreground">{tool.description}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="py-4 text-xs text-muted-foreground">
          {TOOL_CATALOG.length} tools cataloged across {allDomains.filter(d => TOOL_CATALOG.some(t => t.domain === d)).length} domains.
          All links point to real open-source repositories.
        </CardContent>
      </Card>
    </div>
  );
}
