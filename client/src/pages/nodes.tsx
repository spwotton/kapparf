import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { type SdrNode } from "@shared/schema";

export default function NodesPage() {
  const { t } = useI18n();
  const { data: nodes, isLoading } = useQuery<SdrNode[]>({
    queryKey: ["/api/nodes"],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("nodes.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("nodes.description")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !nodes || nodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("nodes.noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nodes.map((node) => (
            <Card key={node.id} data-testid={`card-node-${node.id}`}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{node.name}</span>
                  <Badge variant={node.status === "online" ? "default" : "secondary"}>
                    {node.status === "online" ? t("nodes.online") : t("nodes.offline")}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-muted-foreground">{t("nodes.url")}</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">{node.url}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-muted-foreground">{t("nodes.location")}</span>
                    <span>{node.location}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-muted-foreground">Coords</span>
                    <span className="font-mono text-xs">{node.latitude.toFixed(2)}, {node.longitude.toFixed(2)}</span>
                  </div>
                  {node.lastSeen && (
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-muted-foreground">{t("nodes.lastSeen")}</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {new Date(node.lastSeen).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
