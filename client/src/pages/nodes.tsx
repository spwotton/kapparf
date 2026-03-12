import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { type SdrNode } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function AddNodeDialog() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { name: string; url: string; location: string; latitude: number; longitude: number; status: string }) =>
      apiRequest("POST", "/api/nodes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      setOpen(false);
      setName("");
      setUrl("");
      setLocation("");
      setLatitude("");
      setLongitude("");
      toast({ title: t("nodes.add") });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-node">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("nodes.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("nodes.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t("nodes.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="KiwiSDR Name" data-testid="input-node-name" />
          </div>
          <div className="space-y-2">
            <Label>{t("nodes.url")}</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://host:8073" data-testid="input-node-url" />
          </div>
          <div className="space-y-2">
            <Label>{t("nodes.location")}</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" data-testid="input-node-location" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("dashboard.lat")}</Label>
              <Input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="9.93" data-testid="input-node-lat" />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.lon")}</Label>
              <Input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-84.08" data-testid="input-node-lon" />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              const lat = parseFloat(latitude);
              const lon = parseFloat(longitude);
              if (isNaN(lat) || isNaN(lon)) return;
              mutation.mutate({
                name,
                url,
                location,
                latitude: lat,
                longitude: lon,
                status: "offline",
              });
            }}
            disabled={!name.trim() || !url.trim() || !location.trim() || !latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude)) || mutation.isPending}
            data-testid="button-submit-node"
          >
            {t("nodes.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function NodesPage() {
  const { t } = useI18n();
  const { data: nodes, isLoading, isError } = useQuery<SdrNode[]>({
    queryKey: ["/api/nodes"],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("nodes.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("nodes.description")}</p>
        </div>
        <AddNodeDialog />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive" data-testid="text-nodes-error">
            {t("common.error")}
          </CardContent>
        </Card>
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
                    <a href={node.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs truncate max-w-[200px] underline">{node.url}</a>
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
