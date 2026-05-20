import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Cpu, Radio,
  RefreshCw, Send, Wifi, WifiOff, ChevronDown, ChevronRight,
  Server, Zap, TrendingUp, Eye
} from "lucide-react";

function ms(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v.toFixed(1)}ms`;
}
function pct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}
function ago(ts: string | number | null | undefined) {
  if (!ts) return "—";
  const d = new Date(ts as string).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-emerald-400" : "bg-amber-500"}`} />
  );
}

function LatencyBar({ latency, max = 200 }: { latency: number | null; max?: number }) {
  if (latency == null) return <div className="h-1 w-full bg-muted rounded" />;
  const w = Math.min(100, (latency / max) * 100);
  const color = latency < 50 ? "bg-emerald-500" : latency < 120 ? "bg-yellow-500" : "bg-amber-500";
  return (
    <div className="h-1 w-full bg-muted rounded overflow-hidden">
      <div className={`h-full ${color} rounded transition-all`} style={{ width: `${w}%` }} />
    </div>
  );
}

export default function FleetTrackerPage() {
  const qc = useQueryClient();
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [cmdDevice, setCmdDevice] = useState("");
  const [cmdType, setCmdType] = useState("ping");
  const [cmdPayload, setCmdPayload] = useState("");
  const [cmdResult, setCmdResult] = useState<string | null>(null);

  const { data: status, isLoading: stLoad } = useQuery<any>({
    queryKey: ["/api/tracker/status"],
    refetchInterval: 10_000,
  });
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/tracker/stats"],
    refetchInterval: 15_000,
  });
  const { data: devices, isLoading: devLoad } = useQuery<any[]>({
    queryKey: ["/api/tracker/devices"],
    refetchInterval: 8_000,
  });
  const { data: activeAlerts } = useQuery<any[]>({
    queryKey: ["/api/tracker/alerts/active"],
    refetchInterval: 12_000,
  });
  const { data: bulkStatus } = useQuery<any>({
    queryKey: ["/api/tracker/bulk-status"],
    refetchInterval: 10_000,
  });
  const { data: agentUrls } = useQuery<any>({
    queryKey: ["/api/tracker/agent-urls"],
    staleTime: Infinity,
  });

  const cmdMut = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/tracker/command", body),
    onSuccess: async (res: any) => {
      const d = await res.json().catch(() => ({}));
      setCmdResult(JSON.stringify(d, null, 2));
      qc.invalidateQueries({ queryKey: ["/api/tracker/devices"] });
    },
    onError: (e: any) => setCmdResult(`Error: ${e.message}`),
  });

  const sendCommand = () => {
    if (!cmdDevice) return;
    cmdMut.mutate({ deviceId: cmdDevice, command: cmdType, payload: cmdPayload || undefined });
  };

  const devList: any[] = devices ?? [];
  const alerts: any[] = activeAlerts ?? [];
  const bulk: Record<string, any> = bulkStatus?.devices ?? {};

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-semibold tracking-tight">Fleet Tracker</h1>
            <p className="text-xs text-muted-foreground">Device heartbeat monitoring — KAPPA native</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stLoad ? (
            <Badge variant="outline" className="text-xs gap-1"><RefreshCw className="h-3 w-3 animate-spin" />Connecting</Badge>
          ) : status?.connected ? (
            <Badge className="text-xs gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><Wifi className="h-3 w-3" />Online</Badge>
          ) : (
            <Badge className="text-xs gap-1 bg-amber-500/15 text-amber-400 border-amber-500/30"><WifiOff className="h-3 w-3" />Offline</Badge>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => qc.invalidateQueries({ queryKey: ["/api/tracker/devices"] })}
            data-testid="button-refresh-devices">
            <RefreshCw className="h-3 w-3" />Refresh
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 border-b shrink-0">
        {[
          { label: "Devices", value: stats?.totalDevices ?? devList.length, icon: Server, color: "text-blue-400" },
          { label: "Online", value: stats?.onlineDevices ?? devList.filter(d => bulk[d.id]?.online ?? d.online).length, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Alerts", value: alerts.length, icon: AlertTriangle, color: alerts.length > 0 ? "text-amber-400" : "text-muted-foreground" },
          { label: "Avg Latency", value: stats?.avgLatency ? ms(stats.avgLatency) : "—", icon: Zap, color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-sm font-semibold tabular-nums" data-testid={`stat-${s.label.toLowerCase().replace(" ", "-")}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Device list */}
          <div className="lg:col-span-2 space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Device Fleet</h2>
            {devLoad && (
              <div className="text-xs text-muted-foreground py-8 text-center">Loading devices…</div>
            )}
            {!devLoad && devList.length === 0 && (
              <div className="text-xs text-muted-foreground py-8 text-center">No devices registered yet.<br />Deploy the heartbeat agent to a device to begin tracking.</div>
            )}
            {devList.map(dev => {
              const bk = bulk[dev.id] ?? {};
              const online = bk.online ?? dev.online ?? false;
              const lat = bk.latency ?? dev.latency ?? null;
              const jitter = bk.jitter ?? dev.jitter ?? null;
              const uptime = bk.uptime ?? dev.uptime ?? null;
              const expanded = expandedDevice === dev.id;

              return (
                <div key={dev.id} className="rounded-lg border bg-card" data-testid={`card-device-${dev.id}`}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => setExpandedDevice(expanded ? null : dev.id)}
                    data-testid={`button-expand-device-${dev.id}`}
                  >
                    <StatusDot online={online} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{dev.name || dev.id}</span>
                        {dev.type && <Badge variant="outline" className="text-[10px] h-4 px-1">{dev.type}</Badge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">{dev.id}</div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-xs tabular-nums">{ms(lat)}</div>
                      <div className="text-[10px] text-muted-foreground">latency</div>
                    </div>
                    <div className="text-right shrink-0 hidden md:block">
                      <div className="text-xs tabular-nums">{pct(uptime)}</div>
                      <div className="text-[10px] text-muted-foreground">uptime</div>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-muted-foreground hidden sm:block">
                      {ago(bk.lastSeen ?? dev.lastSeen)}
                    </div>
                    {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </button>

                  {expanded && (
                    <DeviceDetail deviceId={dev.id} dev={dev} lat={lat} jitter={jitter} uptime={uptime} online={online} />
                  )}

                  <div className="px-4 pb-2">
                    <LatencyBar latency={lat} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Active alerts */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />Active Alerts
                  {alerts.length > 0 && <Badge className="ml-auto text-[10px] h-4 px-1.5 bg-amber-500/15 text-amber-400 border-amber-500/30">{alerts.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {alerts.length === 0 && <p className="text-xs text-muted-foreground">No active alerts</p>}
                {alerts.map((a: any) => (
                  <div key={a.id} className="rounded border px-3 py-2 bg-amber-500/5 border-amber-500/20" data-testid={`alert-${a.id}`}>
                    <div className="text-xs font-medium text-amber-400">{a.type || "Alert"}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.message || a.description}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{ago(a.createdAt)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Command console */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" />Remote Command
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Device ID</label>
                  <Input
                    className="h-7 text-xs font-mono mt-0.5"
                    placeholder="device-id"
                    value={cmdDevice}
                    onChange={e => setCmdDevice(e.target.value)}
                    data-testid="input-command-device"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Command</label>
                  <Select value={cmdType} onValueChange={setCmdType}>
                    <SelectTrigger className="h-7 text-xs mt-0.5" data-testid="select-command-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ping">ping</SelectItem>
                      <SelectItem value="reboot">reboot</SelectItem>
                      <SelectItem value="status">status</SelectItem>
                      <SelectItem value="update">update</SelectItem>
                      <SelectItem value="custom">custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {cmdType === "custom" && (
                  <div>
                    <label className="text-[10px] text-muted-foreground">Payload (JSON)</label>
                    <Input
                      className="h-7 text-xs font-mono mt-0.5"
                      placeholder='{"key":"value"}'
                      value={cmdPayload}
                      onChange={e => setCmdPayload(e.target.value)}
                      data-testid="input-command-payload"
                    />
                  </div>
                )}
                <Button
                  size="sm" className="w-full h-7 text-xs gap-1"
                  onClick={sendCommand}
                  disabled={!cmdDevice || cmdMut.isPending}
                  data-testid="button-send-command"
                >
                  {cmdMut.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Send
                </Button>
                {cmdResult && (
                  <pre className="text-[10px] font-mono bg-muted rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap" data-testid="text-command-result">
                    {cmdResult}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Agent download URLs */}
            {agentUrls && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5" />Agent Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1.5">
                  {Object.entries(agentUrls).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[10px] text-muted-foreground">{k}</div>
                      <div className="text-[11px] font-mono break-all text-foreground/80">{v as string}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceDetail({ deviceId, dev, lat, jitter, uptime, online }: any) {
  const { data: health } = useQuery<any>({
    queryKey: ["/api/tracker/devices", deviceId, "health"],
    refetchInterval: 15_000,
  });
  const { data: sensors } = useQuery<any>({
    queryKey: ["/api/tracker/sensors", deviceId, "latest"],
    refetchInterval: 20_000,
  });

  return (
    <div className="px-4 pb-3 border-t pt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
      <div className="text-muted-foreground">Status</div>
      <div className={online ? "text-emerald-400" : "text-amber-400"}>{online ? "Online" : "Offline"}</div>
      {dev.ip && <><div className="text-muted-foreground">IP</div><div className="font-mono">{dev.ip}</div></>}
      {dev.os && <><div className="text-muted-foreground">OS</div><div>{dev.os}</div></>}
      {dev.version && <><div className="text-muted-foreground">Agent</div><div className="font-mono">{dev.version}</div></>}
      <div className="text-muted-foreground">Latency</div><div className="tabular-nums">{lat != null ? `${lat.toFixed(1)}ms` : "—"}</div>
      <div className="text-muted-foreground">Jitter</div><div className="tabular-nums">{jitter != null ? `${jitter.toFixed(1)}ms` : "—"}</div>
      <div className="text-muted-foreground">Uptime</div><div className="tabular-nums">{uptime != null ? `${(uptime * 100).toFixed(1)}%` : "—"}</div>
      {health?.cpu != null && <><div className="text-muted-foreground">CPU</div><div className="tabular-nums">{(health.cpu * 100).toFixed(0)}%</div></>}
      {health?.memory != null && <><div className="text-muted-foreground">Memory</div><div className="tabular-nums">{(health.memory * 100).toFixed(0)}%</div></>}
      {sensors && Object.entries(sensors).slice(0, 4).map(([k, v]) => (
        <><div key={k + "l"} className="text-muted-foreground capitalize">{k}</div><div key={k + "v"} className="tabular-nums">{String(v)}</div></>
      ))}
    </div>
  );
}
