import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { type AnomalyReport } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function NewAnomalyDialog() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("TAS2R38");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState([3]);

  const mutation = useMutation({
    mutationFn: (data: { type: string; description: string; severity: number }) =>
      apiRequest("POST", "/api/anomalies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anomalies"] });
      setOpen(false);
      setDescription("");
      setSeverity([3]);
      toast({ title: "Anomaly logged" });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-anomaly">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("anomalies.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("anomalies.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t("anomalies.type")}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-anomaly-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TAS2R38">{t("anomalies.typeTAS2R38")}</SelectItem>
                <SelectItem value="visual">{t("anomalies.typeVisual")}</SelectItem>
                <SelectItem value="auditory">{t("anomalies.typeAuditory")}</SelectItem>
                <SelectItem value="other">{t("anomalies.typeOther")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("anomalies.descriptionField")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-anomaly-description"
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <Label>{t("anomalies.severity")}</Label>
              <span className="text-sm font-mono text-muted-foreground">{severity[0]}/5</span>
            </div>
            <Slider
              value={severity}
              onValueChange={setSeverity}
              min={1}
              max={5}
              step={1}
              data-testid="slider-severity"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => mutation.mutate({ type, description, severity: severity[0] })}
            disabled={!description.trim() || mutation.isPending}
            data-testid="button-submit-anomaly"
          >
            {t("anomalies.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const typeLabels: Record<string, string> = {
  TAS2R38: "TAS2R38",
  visual: "Visual",
  auditory: "Auditory",
  other: "Other",
};

export default function AnomaliesPage() {
  const { t } = useI18n();
  const { data: anomalies, isLoading } = useQuery<AnomalyReport[]>({
    queryKey: ["/api/anomalies"],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("anomalies.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("anomalies.description")}</p>
        </div>
        <NewAnomalyDialog />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !anomalies || anomalies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("anomalies.noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {anomalies.map((a) => (
            <Card key={a.id} data-testid={`card-anomaly-${a.id}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{typeLabels[a.type] || a.type}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {t("anomalies.severity")} {a.severity}/5
                      </span>
                      {a.correlatedDetectionId ? (
                        <Badge variant="default" className="text-[10px]">{t("anomalies.correlated")}</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{t("anomalies.uncorrelated")}</span>
                      )}
                    </div>
                    <p className="text-sm">{a.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {new Date(a.timestamp).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
