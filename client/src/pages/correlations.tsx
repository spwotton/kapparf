import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { CORRELATION_RULES, type Correlation, type CorrelatorStats } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Shield, Clock, Link2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const severityColors = [
  "",
  "bg-green-500/10 text-green-700 dark:text-green-400",
  "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "bg-red-500/10 text-red-700 dark:text-red-400",
  "bg-red-700/10 text-red-900 dark:text-red-300",
];

function StarRating({ correlationId }: { correlationId: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const feedbackMutation = useMutation({
    mutationFn: async (rating: number) => {
      await apiRequest("POST", `/api/correlations/${correlationId}/feedback`, { rating });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: t("correlations.feedbackSubmitted") });
    },
  });

  if (submitted) {
    return <span className="text-xs text-muted-foreground">{t("correlations.feedbackSubmitted")}</span>;
  }

  return (
    <div className="flex items-center gap-0.5" data-testid={`rating-${correlationId}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className="p-0.5 hover:scale-110 transition-transform"
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          onClick={() => feedbackMutation.mutate(star)}
          disabled={feedbackMutation.isPending}
          data-testid={`button-star-${correlationId}-${star}`}
        >
          <Star
            className={`h-3.5 w-3.5 ${
              star <= hoveredStar
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function CorrelationsPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: correlationsData, isLoading } = useQuery<Correlation[]>({
    queryKey: ["/api/correlations"],
    refetchInterval: 15000,
  });

  const { data: correlatorStats } = useQuery<CorrelatorStats>({
    queryKey: ["/api/correlations/stats"],
    refetchInterval: 5000,
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
        <div className="flex items-center gap-2">
          {correlatorStats?.running && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400" data-testid="badge-auto-correlator">
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              {t("correlations.autoStatus")}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            data-testid="button-run-correlation"
          >
            <Play className={`h-4 w-4 mr-1.5 ${runMutation.isPending ? "animate-spin" : ""}`} />
            {runMutation.isPending ? t("correlations.running") : t("correlations.manual")}
          </Button>
        </div>
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
          {correlationsData && (
            <span className="text-xs text-muted-foreground font-normal">({correlationsData.length})</span>
          )}
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
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(c.timestamp).toLocaleString()}
                      </span>
                      <StarRating correlationId={c.id} />
                    </div>
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
