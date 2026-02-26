import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { CORRELATION_RULES, type Correlation } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Shield, Clock, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const severityColors = [
  "",
  "bg-green-500/10 text-green-700 dark:text-green-400",
  "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "bg-red-500/10 text-red-700 dark:text-red-400",
  "bg-red-700/10 text-red-900 dark:text-red-300",
];

export default function CorrelationsPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: correlationsData, isLoading } = useQuery<Correlation[]>({
    queryKey: ["/api/correlations"],
  });

  const runMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/correlations/run"),
    onSuccess: async (res) => {
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/correlations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: `Correlation complete: ${result.correlationsFound} found` });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("correlations.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("correlations.description")}</p>
        </div>
        <Button
          size="sm"
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          data-testid="button-run-correlation"
        >
          <Play className={`h-4 w-4 mr-1.5 ${runMutation.isPending ? "animate-spin" : ""}`} />
          {runMutation.isPending ? t("correlations.running") : t("correlations.run")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("correlations.rules")}</CardTitle>
          </div>
          <CardDescription className="text-xs">{t("correlations.rulesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CORRELATION_RULES.map((rule) => (
              <div key={rule.id} className="border rounded-md p-3 space-y-2" data-testid={`card-rule-${rule.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium">{rule.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {rule.windowSeconds}s
                    </div>
                    {rule.domains.map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px]">{d.toUpperCase()}</Badge>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
                <code className="text-[11px] font-mono text-muted-foreground block bg-muted/50 rounded px-2 py-1">
                  {rule.condition}
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          {t("correlations.title")}
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !correlationsData || correlationsData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("correlations.noData")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {correlationsData.map((c) => (
              <Card key={c.id} data-testid={`card-correlation-${c.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{c.ruleName}</span>
                        <Badge variant="secondary" className={severityColors[c.severity] || ""}>
                          {t("correlations.severity")} {c.severity}/5
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {c.eventIds.length} {t("correlations.linkedEvents").toLowerCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(c.timestamp).toLocaleString()}
                    </span>
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
