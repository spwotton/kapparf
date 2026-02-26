import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { DOMAINS, type SignalEvent } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const domainColors: Record<string, string> = {
  wifi: "bg-green-500/10 text-green-700 dark:text-green-400",
  ble: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  lte: "bg-red-500/10 text-red-700 dark:text-red-400",
  "5g": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  satellite: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  sdr: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  elf: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  radar: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  plc: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  isp: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  drone: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function IngestDialog() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("wifi");
  const [source, setSource] = useState("");
  const [eventType, setEventType] = useState("");
  const [frequency, setFrequency] = useState("");
  const [confidence, setConfidence] = useState([0.5]);
  const [metadata, setMetadata] = useState("");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setOpen(false);
      setSource("");
      setEventType("");
      setFrequency("");
      setMetadata("");
      setConfidence([0.5]);
      toast({ title: "Event ingested" });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const data: Record<string, unknown> = {
      domain,
      source,
      eventType,
      confidence: confidence[0],
    };
    if (frequency) data.frequency = parseFloat(frequency);
    if (metadata.trim()) {
      try {
        data.metadata = JSON.parse(metadata);
      } catch {
        data.metadata = { raw: metadata };
      }
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-ingest-event">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("events.ingest")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("events.ingest")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t("events.domain")}</Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger data-testid="select-event-domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("events.source")}</Label>
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. wlan0, tower-1, NORAD 25544"
              data-testid="input-event-source"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("events.eventType")}</Label>
            <Input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="e.g. beacon, deauth, paging, telemetry"
              data-testid="input-event-type"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("events.frequency")}</Label>
            <Input
              type="number"
              step="any"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Hz (optional)"
              data-testid="input-event-frequency"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <Label>{t("events.confidence")}</Label>
              <span className="text-sm font-mono text-muted-foreground">{(confidence[0] * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={confidence}
              onValueChange={setConfidence}
              min={0}
              max={1}
              step={0.05}
              data-testid="slider-confidence"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("events.metadata")}</Label>
            <Textarea
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"mac": "AA:BB:CC:DD:EE:FF", "ssid": "..."}'
              rows={3}
              className="resize-none font-mono text-xs"
              data-testid="input-event-metadata"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!source.trim() || !eventType.trim() || mutation.isPending}
            data-testid="button-submit-event"
          >
            {t("events.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EventsPage() {
  const { t } = useI18n();
  const [domainFilter, setDomainFilter] = useState("all");

  const queryKey = domainFilter === "all"
    ? ["/api/events"]
    : ["/api/events", `?domain=${domainFilter}`];

  const url = domainFilter === "all" ? "/api/events" : `/api/events?domain=${domainFilter}`;

  const { data: events, isLoading } = useQuery<SignalEvent[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("events.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("events.description")}</p>
        </div>
        <IngestDialog />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={domainFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setDomainFilter("all")}
          data-testid="button-filter-all"
        >
          {t("events.all")}
        </Button>
        {DOMAINS.map((d) => (
          <Button
            key={d}
            variant={domainFilter === d ? "default" : "outline"}
            size="sm"
            onClick={() => setDomainFilter(d)}
            data-testid={`button-filter-${d}`}
          >
            {d.toUpperCase()}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : !events || events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("events.noData")}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-6 gap-2 p-3 text-xs font-medium text-muted-foreground border-b">
            <span>{t("events.domain")}</span>
            <span>{t("events.eventType")}</span>
            <span>{t("events.source")}</span>
            <span>{t("events.frequency")}</span>
            <span>{t("events.confidence")}</span>
            <span>{t("events.time")}</span>
          </div>
          {events.map((evt) => (
            <div key={evt.id} className="grid grid-cols-6 gap-2 p-3 text-sm border-b last:border-b-0 items-center" data-testid={`row-event-${evt.id}`}>
              <Badge variant="secondary" className={`w-fit ${domainColors[evt.domain] || ""}`}>
                {evt.domain.toUpperCase()}
              </Badge>
              <span>{evt.eventType}</span>
              <span className="text-muted-foreground truncate">{evt.source}</span>
              <span className="font-mono text-xs">
                {evt.frequency != null ? `${evt.frequency} Hz` : "--"}
              </span>
              <span className="font-mono text-xs">{(evt.confidence * 100).toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(evt.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
