import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Radio, Wifi, Bluetooth, Monitor, Terminal, Plus, Trash2, RefreshCw,
  Signal, Shield, ShieldAlert, Lock, Unlock, Eye, Send, Activity,
  Zap, CircleDot, Server, Clock, ChevronDown, ChevronRight, Copy
} from "lucide-react";

interface BettercapInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  scheme: string;
  connected: boolean;
  lastPing: number;
  lastError: string | null;
  version: string | null;
}

interface BettercapEvent {
  tag: string;
  time: string;
  data: any;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 1000) return "now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function SignalBar({ rssi }: { rssi: number }) {
  const strength = Math.min(4, Math.max(0, Math.floor((rssi + 100) / 20)));
  return (
    <div className="flex items-end gap-0.5 h-4" data-testid="signal-bar">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-colors ${
            i <= strength
              ? rssi > -50 ? "bg-green-500" : rssi > -70 ? "bg-yellow-500" : "bg-amber-500"
              : "bg-muted"
          }`}
          style={{ height: `${25 + i * 25}%` }}
        />
      ))}
    </div>
  );
}

function eventTagColor(tag: string): string {
  if (tag.includes("handshake")) return "destructive";
  const prefix = tag.split(".")[0];
  switch (prefix) {
    case "wifi": return "default";
    case "ble": return "secondary";
    case "endpoint": return "outline";
    case "hid": return "destructive";
    default: return "secondary";
  }
}

function AddInstanceDialog({ onAdd }: { onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("8081");
  const [scheme, setScheme] = useState("http");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/bettercap/instances", {
        name, host, port: parseInt(port), scheme, username, password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bettercap/instances"] });
      setOpen(false);
      setName(""); setHost("127.0.0.1"); setPort("8081"); setUsername(""); setPassword("");
      onAdd();
      toast({ title: "Instance added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-add-instance">
          <Plus className="w-4 h-4 mr-1" /> Add Instance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Bettercap Instance</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Name (e.g. Router, Cloud)" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-instance-name" />
          <div className="flex gap-2">
            <Select value={scheme} onValueChange={setScheme}>
              <SelectTrigger className="w-24" data-testid="select-scheme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="https">HTTPS</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} className="flex-1" data-testid="input-host" />
            <Input placeholder="Port" value={port} onChange={(e) => setPort(e.target.value)} className="w-20" data-testid="input-port" />
          </div>
          <div className="flex gap-2">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} data-testid="input-username" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-password" />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!name || !host || !username || !password || addMutation.isPending} className="w-full" data-testid="button-connect">
            {addMutation.isPending ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InstanceSelector({
  instances, selected, onSelect,
}: {
  instances: BettercapInstance[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {instances.map((inst) => (
        <Button
          key={inst.id}
          variant={selected === inst.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(inst.id)}
          data-testid={`button-instance-${inst.id}`}
        >
          <CircleDot className={`w-3 h-3 mr-1 ${inst.connected ? "text-green-500" : "text-amber-500"}`} />
          {inst.name}
          {inst.connected && inst.lastPing > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">{inst.lastPing}ms</span>
          )}
        </Button>
      ))}
    </div>
  );
}

function WiFiTab({ instanceId }: { instanceId: string }) {
  const [expandedAP, setExpandedAP] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["/api/bettercap/instances", instanceId, "session"],
    refetchInterval: 3000,
    enabled: !!instanceId,
  });

  const cmdMutation = useMutation({
    mutationFn: (cmd: string) =>
      apiRequest("POST", `/api/bettercap/instances/${instanceId}/command`, { cmd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bettercap/instances", instanceId, "session"] });
    },
  });

  const aps = (session as any)?.wifi?.aps || [];
  const sorted = [...aps].sort((a: any, b: any) => b.rssi - a.rssi);

  const copyMac = useCallback((mac: string) => {
    navigator.clipboard.writeText(mac.toUpperCase());
    toast({ title: "Copied", description: mac.toUpperCase() });
  }, [toast]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">{sorted.length} Access Points</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => cmdMutation.mutate("wifi.recon on")} data-testid="button-wifi-recon-on">
            <Eye className="w-3 h-3 mr-1" /> Recon On
          </Button>
          <Button size="sm" variant="ghost" onClick={() => cmdMutation.mutate("wifi.recon.channel clear")} data-testid="button-wifi-channel-clear">
            <RefreshCw className="w-3 h-3 mr-1" /> Clear Channel
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs">
              <th className="px-2 py-1.5 text-left w-10">RSSI</th>
              <th className="px-2 py-1.5 text-left">BSSID</th>
              <th className="px-2 py-1.5 text-left">ESSID</th>
              <th className="px-2 py-1.5 text-left">Vendor</th>
              <th className="px-2 py-1.5 text-center">Enc</th>
              <th className="px-2 py-1.5 text-center w-10">Ch</th>
              <th className="px-2 py-1.5 text-center w-16">Clients</th>
              <th className="px-2 py-1.5 text-right">Traffic</th>
              <th className="px-2 py-1.5 text-right w-16">Seen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground italic">No access points detected — start recon</td></tr>
            )}
            {sorted.map((ap: any) => (
              <tr key={ap.mac} className="border-t border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-ap-${ap.mac}`}>
                <td className="px-2 py-1.5"><SignalBar rssi={ap.rssi} /></td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyMac(ap.mac)} className="hover:text-primary" data-testid={`button-copy-${ap.mac}`}>
                      {ap.mac?.toUpperCase()}
                    </button>
                    {ap.handshake && <Shield className="w-3 h-3 text-amber-500" />}
                  </div>
                </td>
                <td className={`px-2 py-1.5 ${ap.hostname === "<hidden>" ? "text-muted-foreground italic" : ""}`}>
                  {ap.hostname}
                  {ap.alias && <Badge variant="secondary" className="ml-1 text-xs">{ap.alias}</Badge>}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground text-xs">{ap.vendor || "unknown"}</td>
                <td className="px-2 py-1.5 text-center">
                  {ap.encryption === "OPEN" ? (
                    <Unlock className="w-3 h-3 text-yellow-500 inline" />
                  ) : (
                    <span className="text-xs flex items-center justify-center gap-0.5">
                      <Lock className="w-3 h-3 text-green-500" />
                      {ap.encryption}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Button size="sm" variant="ghost" className="h-5 px-1 text-xs"
                    onClick={() => cmdMutation.mutate(`wifi.recon.channel ${ap.channel}`)}
                    data-testid={`button-channel-${ap.channel}`}>
                    {ap.channel}
                  </Button>
                </td>
                <td className="px-2 py-1.5 text-center">
                  {ap.clients?.length > 0 ? (
                    <button
                      className="inline-flex items-center gap-0.5 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded"
                      onClick={() => setExpandedAP(expandedAP === ap.mac ? null : ap.mac)}
                      data-testid={`button-expand-clients-${ap.mac}`}
                    >
                      {ap.clients.length}
                      {expandedAP === ap.mac ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-xs">0</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right text-xs text-muted-foreground">
                  {formatBytes(ap.sent || 0)} / {formatBytes(ap.received || 0)}
                </td>
                <td className="px-2 py-1.5 text-right text-xs text-muted-foreground">
                  {ap.last_seen ? timeAgo(ap.last_seen) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expandedAP && (() => {
        const ap = sorted.find((a: any) => a.mac === expandedAP);
        if (!ap || !ap.clients?.length) return null;
        return (
          <Card className="border-amber-500/30">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">Clients of {ap.hostname || ap.mac?.toUpperCase()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-2 py-1 text-left">RSSI</th>
                    <th className="px-2 py-1 text-left">MAC</th>
                    <th className="px-2 py-1 text-left">Vendor</th>
                    <th className="px-2 py-1 text-right">Traffic</th>
                    <th className="px-2 py-1 text-right">Seen</th>
                    <th className="px-2 py-1 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ap.clients.map((client: any) => (
                    <tr key={client.mac} className="border-t border-border/30" data-testid={`row-client-${client.mac}`}>
                      <td className="px-2 py-1"><SignalBar rssi={client.rssi} /></td>
                      <td className="px-2 py-1 font-mono text-xs">{client.mac?.toUpperCase()}</td>
                      <td className="px-2 py-1 text-xs text-muted-foreground">{client.vendor || "unknown"}</td>
                      <td className="px-2 py-1 text-right text-xs">{formatBytes(client.sent)} / {formatBytes(client.received)}</td>
                      <td className="px-2 py-1 text-right text-xs">{client.last_seen ? timeAgo(client.last_seen) : "—"}</td>
                      <td className="px-2 py-1 text-center">
                        <Button size="sm" variant="ghost" className="h-5 text-xs text-amber-400"
                          onClick={() => cmdMutation.mutate(`wifi.deauth ${client.mac}`)}
                          data-testid={`button-deauth-${client.mac}`}>
                          <Zap className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}

function LANTab({ instanceId }: { instanceId: string }) {
  const { toast } = useToast();
  const { data: session } = useQuery({
    queryKey: ["/api/bettercap/instances", instanceId, "session"],
    refetchInterval: 3000,
    enabled: !!instanceId,
  });

  const cmdMutation = useMutation({
    mutationFn: (cmd: string) =>
      apiRequest("POST", `/api/bettercap/instances/${instanceId}/command`, { cmd }),
  });

  const hosts = (session as any)?.lan?.hosts || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">{hosts.length} Hosts</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => cmdMutation.mutate("net.recon on")} data-testid="button-net-recon">
            <Eye className="w-3 h-3 mr-1" /> Net Recon
          </Button>
          <Button size="sm" variant="ghost" onClick={() => cmdMutation.mutate("net.probe on")} data-testid="button-net-probe">
            <Activity className="w-3 h-3 mr-1" /> Probe
          </Button>
          <Button size="sm" variant="ghost" className="text-amber-400" onClick={() => cmdMutation.mutate("arp.spoof on")} data-testid="button-arp-spoof">
            <ShieldAlert className="w-3 h-3 mr-1" /> ARP Spoof
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {hosts.map((host: any) => (
          <Card key={host.mac} className="hover:border-primary/30 transition-colors" data-testid={`card-host-${host.mac}`}>
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{host.ipv4}</span>
                <button onClick={() => {
                  navigator.clipboard.writeText(host.mac.toUpperCase());
                  toast({ title: "Copied" });
                }}>
                  <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                </button>
              </div>
              <div className="font-mono text-xs text-muted-foreground">{host.mac?.toUpperCase()}</div>
              {host.hostname && <div className="text-sm font-medium truncate">{host.hostname}</div>}
              <div className="text-xs text-muted-foreground">{host.vendor || "Unknown vendor"}</div>
              {host.alias && <Badge variant="secondary" className="text-xs">{host.alias}</Badge>}
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>{host.last_seen ? timeAgo(host.last_seen) : "—"}</span>
                {(host.sent || host.received) && (
                  <span>{formatBytes(host.sent || 0)} / {formatBytes(host.received || 0)}</span>
                )}
              </div>
              {host.meta && Object.keys(host.meta).length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {Object.entries(host.meta).map(([k, v]: any) => (
                    <Badge key={k} variant="outline" className="text-xs">{k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {hosts.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground italic">No hosts discovered — start net.recon</div>
        )}
      </div>
    </div>
  );
}

function BLETab({ instanceId }: { instanceId: string }) {
  const { data: session } = useQuery({
    queryKey: ["/api/bettercap/instances", instanceId, "session"],
    refetchInterval: 3000,
    enabled: !!instanceId,
  });

  const cmdMutation = useMutation({
    mutationFn: (cmd: string) =>
      apiRequest("POST", `/api/bettercap/instances/${instanceId}/command`, { cmd }),
  });

  const devices = (session as any)?.ble?.devices || [];
  const sorted = [...devices].sort((a: any, b: any) => b.rssi - a.rssi);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bluetooth className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">{sorted.length} BLE Devices</span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => cmdMutation.mutate("ble.recon on")} data-testid="button-ble-recon">
          <Eye className="w-3 h-3 mr-1" /> BLE Recon
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs">
              <th className="px-2 py-1.5 text-left w-10">RSSI</th>
              <th className="px-2 py-1.5 text-left">MAC</th>
              <th className="px-2 py-1.5 text-left">Name</th>
              <th className="px-2 py-1.5 text-left">Vendor</th>
              <th className="px-2 py-1.5 text-center">Connectable</th>
              <th className="px-2 py-1.5 text-right">Seen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">No BLE devices — start ble.recon</td></tr>
            )}
            {sorted.map((dev: any) => (
              <tr key={dev.mac} className="border-t border-border/50 hover:bg-muted/30" data-testid={`row-ble-${dev.mac}`}>
                <td className="px-2 py-1.5"><SignalBar rssi={dev.rssi} /></td>
                <td className="px-2 py-1.5 font-mono text-xs">{dev.mac?.toUpperCase()}</td>
                <td className="px-2 py-1.5">{dev.name || <span className="text-muted-foreground italic">unnamed</span>}</td>
                <td className="px-2 py-1.5 text-xs text-muted-foreground">{dev.vendor || "unknown"}</td>
                <td className="px-2 py-1.5 text-center">
                  {dev.connectable ? <Zap className="w-3 h-3 text-green-400 inline" /> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-2 py-1.5 text-right text-xs text-muted-foreground">{dev.last_seen ? timeAgo(dev.last_seen) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventsTab({ instanceId }: { instanceId: string }) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const { data: events } = useQuery({
    queryKey: ["/api/bettercap/instances", instanceId, "events"],
    refetchInterval: 3000,
    enabled: !!instanceId,
  });

  const eventList = (events as BettercapEvent[]) || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium">{eventList.length} Events</span>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-1">
          {eventList.length === 0 && (
            <div className="text-center py-8 text-muted-foreground italic">No events yet</div>
          )}
          {eventList.map((evt, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer"
              onClick={() => setExpandedEvent(expandedEvent === i ? null : i)}
              data-testid={`event-${i}`}>
              <Badge variant={eventTagColor(evt.tag) as any} className="text-xs shrink-0 mt-0.5">{evt.tag}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{evt.time ? new Date(evt.time).toLocaleTimeString() : "—"}</div>
                {expandedEvent === i && evt.data && (
                  <pre className="mt-1 text-xs bg-muted/50 p-2 rounded overflow-auto max-h-48 font-mono">
                    {JSON.stringify(evt.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ModulesTab({ instanceId }: { instanceId: string }) {
  const { data: session } = useQuery({
    queryKey: ["/api/bettercap/instances", instanceId, "session"],
    refetchInterval: 5000,
    enabled: !!instanceId,
  });

  const cmdMutation = useMutation({
    mutationFn: (cmd: string) =>
      apiRequest("POST", `/api/bettercap/instances/${instanceId}/command`, { cmd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bettercap/instances", instanceId, "session"] });
    },
  });

  const modules = (session as any)?.modules || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium">{modules.length} Modules ({modules.filter((m: any) => m.running).length} running)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {modules.map((mod: any) => (
          <Card key={mod.name} className={`${mod.running ? "border-green-500/30" : ""}`} data-testid={`card-module-${mod.name}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleDot className={`w-3 h-3 ${mod.running ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className="font-mono text-sm">{mod.name}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 text-xs"
                  onClick={() => cmdMutation.mutate(`${mod.name} ${mod.running ? "off" : "on"}`)}
                  data-testid={`button-toggle-${mod.name}`}>
                  {mod.running ? "Stop" : "Start"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{mod.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CommandConsole({ instanceId }: { instanceId: string }) {
  const [cmd, setCmd] = useState("");
  const [output, setOutput] = useState<{ cmd: string; result: string; ok: boolean }[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery({
    queryKey: ["/api/bettercap/instances", instanceId, "history"],
    enabled: !!instanceId,
  });

  const cmdMutation = useMutation({
    mutationFn: (command: string) =>
      apiRequest("POST", `/api/bettercap/instances/${instanceId}/command`, { cmd: command }),
    onSuccess: async (res: any) => {
      const data = await res.json().catch(() => ({}));
      setOutput((prev) => [...prev, { cmd: cmd, result: data.output || data.error || "OK", ok: data.success !== false }]);
      setCmd("");
      setHistIdx(-1);
      queryClient.invalidateQueries({ queryKey: ["/api/bettercap/instances", instanceId, "history"] });
    },
    onError: (err: any) => {
      setOutput((prev) => [...prev, { cmd, result: err.message, ok: false }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [output]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const hist = (history as string[]) || [];
    if (e.key === "ArrowUp" && hist.length > 0) {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, hist.length - 1);
      setHistIdx(newIdx);
      setCmd(hist[hist.length - 1 - newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx <= 0) { setHistIdx(-1); setCmd(""); }
      else { const newIdx = histIdx - 1; setHistIdx(newIdx); setCmd(((history as string[]) || [])[((history as string[]) || []).length - 1 - newIdx] || ""); }
    }
  };

  return (
    <div className="space-y-2">
      <div ref={scrollRef} className="bg-black/80 rounded-md p-3 font-mono text-xs h-[300px] overflow-auto">
        <div className="text-green-400 mb-2">KAPPA Bettercap Console — Type commands below</div>
        {output.map((entry, i) => (
          <div key={i} className="mb-1">
            <div className="text-blue-400">» {entry.cmd}</div>
            <div className={entry.ok ? "text-gray-300" : "text-amber-400"}>{entry.result}</div>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); if (cmd.trim()) cmdMutation.mutate(cmd.trim()); }}
      >
        <div className="flex-1 flex items-center bg-muted rounded-md px-2">
          <Terminal className="w-4 h-4 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="wifi.recon on, arp.spoof on, help ..."
            className="border-0 bg-transparent focus-visible:ring-0 font-mono text-sm"
            data-testid="input-command"
          />
        </div>
        <Button type="submit" disabled={!cmd.trim() || cmdMutation.isPending} data-testid="button-send-command">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

function SessionOverview({ instanceId }: { instanceId: string }) {
  const { data: session } = useQuery({
    queryKey: ["/api/bettercap/instances", instanceId, "session"],
    refetchInterval: 3000,
    enabled: !!instanceId,
  });

  if (!session) return <div className="text-center py-8 text-muted-foreground">Connecting...</div>;

  const s = session as any;
  const totalTraffic = Object.values(s.packets?.traffic || {}).reduce(
    (acc: any, t: any) => ({ sent: acc.sent + (t.sent || 0), received: acc.received + (t.received || 0) }),
    { sent: 0, received: 0 }
  ) as any;

  const stats = [
    { label: "LAN Hosts", value: s.lan?.hosts?.length || 0, icon: Monitor, color: "text-blue-400" },
    { label: "WiFi APs", value: s.wifi?.aps?.length || 0, icon: Wifi, color: "text-green-400" },
    { label: "BLE Devices", value: s.ble?.devices?.length || 0, icon: Bluetooth, color: "text-indigo-400" },
    { label: "Modules Running", value: s.modules?.filter((m: any) => m.running).length || 0, icon: Server, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="py-2 px-3"><CardTitle className="text-sm">Interface</CardTitle></CardHeader>
          <CardContent className="px-3 pb-3 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="font-mono">{s.interface?.ipv4}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">MAC</span><span className="font-mono">{s.interface?.mac?.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Host</span><span>{s.interface?.hostname}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-2 px-3"><CardTitle className="text-sm">Gateway</CardTitle></CardHeader>
          <CardContent className="px-3 pb-3 space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="font-mono">{s.gateway?.ipv4}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">MAC</span><span className="font-mono">{s.gateway?.mac?.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vendor</span><span>{s.gateway?.vendor || "unknown"}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-2 px-3"><CardTitle className="text-sm">System</CardTitle></CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span className="text-muted-foreground">Version: </span>{s.version}</div>
            <div><span className="text-muted-foreground">OS: </span>{s.os}</div>
            <div><span className="text-muted-foreground">Arch: </span>{s.arch}</div>
            <div><span className="text-muted-foreground">Traffic: </span>{formatBytes(totalTraffic.sent)} / {formatBytes(totalTraffic.received)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BettercapPage() {
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: instances, isLoading } = useQuery({
    queryKey: ["/api/bettercap/instances"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bettercap/instances/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bettercap/instances"] });
      setSelectedInstance(null);
      toast({ title: "Instance removed" });
    },
  });

  const instanceList = (instances as BettercapInstance[]) || [];

  useEffect(() => {
    if (instanceList.length > 0 && !selectedInstance) {
      setSelectedInstance(instanceList[0].id);
    }
  }, [instanceList, selectedInstance]);

  return (
    <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-green-400" />
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">Bettercap Bridge</h1>
            <p className="text-xs text-muted-foreground">Multi-instance network attack & recon — integrated with KAPPA correlation engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedInstance && (
            <Button variant="ghost" size="sm" className="text-amber-400"
              onClick={() => deleteMutation.mutate(selectedInstance)}
              data-testid="button-remove-instance">
              <Trash2 className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
          <AddInstanceDialog onAdd={() => queryClient.invalidateQueries({ queryKey: ["/api/bettercap/instances"] })} />
        </div>
      </div>

      {instanceList.length > 0 && (
        <InstanceSelector instances={instanceList} selected={selectedInstance} onSelect={setSelectedInstance} />
      )}

      {!selectedInstance && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Radio className="w-12 h-12 text-muted-foreground mx-auto" />
            <div className="text-lg font-medium">No Bettercap Instances Connected</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect to a local or remote bettercap instance to start network reconnaissance.
              Supports SSH tunnels, cloud deployments, and direct connections.
            </p>
            <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded max-w-md mx-auto">
              bettercap -api-rest-address 0.0.0.0 -api-rest-port 8081 -api-rest-username user -api-rest-password pass
            </div>
          </CardContent>
        </Card>
      )}

      {selectedInstance && (
        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="flex-wrap" data-testid="tabs-bettercap">
            <TabsTrigger value="overview"><Clock className="w-3 h-3 mr-1" /> Overview</TabsTrigger>
            <TabsTrigger value="wifi"><Wifi className="w-3 h-3 mr-1" /> WiFi</TabsTrigger>
            <TabsTrigger value="lan"><Monitor className="w-3 h-3 mr-1" /> LAN</TabsTrigger>
            <TabsTrigger value="ble"><Bluetooth className="w-3 h-3 mr-1" /> BLE</TabsTrigger>
            <TabsTrigger value="events"><Activity className="w-3 h-3 mr-1" /> Events</TabsTrigger>
            <TabsTrigger value="modules"><Server className="w-3 h-3 mr-1" /> Modules</TabsTrigger>
            <TabsTrigger value="console"><Terminal className="w-3 h-3 mr-1" /> Console</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><SessionOverview instanceId={selectedInstance} /></TabsContent>
          <TabsContent value="wifi"><WiFiTab instanceId={selectedInstance} /></TabsContent>
          <TabsContent value="lan"><LANTab instanceId={selectedInstance} /></TabsContent>
          <TabsContent value="ble"><BLETab instanceId={selectedInstance} /></TabsContent>
          <TabsContent value="events"><EventsTab instanceId={selectedInstance} /></TabsContent>
          <TabsContent value="modules"><ModulesTab instanceId={selectedInstance} /></TabsContent>
          <TabsContent value="console"><CommandConsole instanceId={selectedInstance} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
