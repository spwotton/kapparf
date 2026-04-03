import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  THREAT_LEVELS,
  type KappaStatus,
  type SignalEvent,
  type Correlation,
} from "@shared/schema";
import {
  Send,
  Shield,
  Activity,
  Radio,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Zap,
  Eye,
  Wifi,
  Satellite,
  Signal,
  Clock,
} from "lucide-react";

function getThreatColor(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].color;
  }
  return THREAT_LEVELS[0].color;
}

function getThreatBg(level: string): string {
  switch (level) {
    case "NOMINAL": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "ELEVATED": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    case "HIGH": return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    case "CRITICAL": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "EMERGENCY": return "bg-red-700/20 text-red-900 dark:text-red-300 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
}

const domainIcons: Record<string, typeof Wifi> = {
  satellite: Satellite,
  sdr: Radio,
  elf: Activity,
  radar: Radio,
  isp: Wifi,
  rf: Signal,
  morse: Radio,
};

interface ChatMessage {
  id: string;
  role: "user" | "system" | "alert";
  content: string;
  timestamp: Date;
  meta?: {
    type?: string;
    score?: number;
    domain?: string;
  };
}

function LiveStatusBar({ kappaStatus }: { kappaStatus?: KappaStatus }) {
  const score = kappaStatus?.score ?? 0;
  const threat = kappaStatus?.threatLevel ?? "NOMINAL";
  const color = getThreatColor(score);
  const ewActive = kappaStatus?.eveningWindow?.active ?? false;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-b ${getThreatBg(threat)} flex-wrap`} data-testid="status-bar">
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono text-sm font-bold" data-testid="text-kappa-score">
          κ {score.toFixed(1)}
        </span>
        <Badge variant="outline" className="text-[10px] font-mono" data-testid="badge-threat">
          {threat}
        </Badge>
      </div>
      {ewActive && (
        <Badge variant="secondary" className="text-[10px]" data-testid="badge-ew-active">
          <Eye className="h-3 w-3 mr-0.5" />
          EW ACTIVE
        </Badge>
      )}
      <span className="text-[10px] font-mono text-muted-foreground ml-auto hidden sm:inline" data-testid="text-coords">
        10.0514°N 84.2187°W
      </span>
      <span className="text-[10px] font-mono text-muted-foreground" data-testid="text-time">
        {kappaStatus?.eveningWindow?.localTime ?? "--:--"} CST
      </span>
    </div>
  );
}

function LiveFeed({ events, correlations, expanded, onToggle }: {
  events?: SignalEvent[];
  correlations?: Correlation[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const recent = (events ?? []).slice(0, 20);

  return (
    <div className={`border-t bg-card ${expanded ? "flex-1 min-h-0" : ""}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-toggle-feed"
      >
        <span className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          LIVE FEED
          {recent.length > 0 && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1" data-testid="badge-feed-count">
              {recent.length}
            </Badge>
          )}
        </span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </button>
      {expanded && (
        <ScrollArea className="h-[200px] sm:h-[250px]">
          <div className="px-3 pb-2 space-y-1">
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Waiting for events...</p>
            ) : (
              recent.map((evt) => {
                const Icon = domainIcons[evt.domain] ?? Activity;
                return (
                  <div
                    key={evt.id}
                    className="flex items-start gap-2 text-xs py-1 border-b border-border/50 last:border-0"
                    data-testid={`feed-event-${evt.id}`}
                  >
                    <Icon className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="outline" className="text-[8px] px-1 h-3.5">{String(evt.domain)}</Badge>
                        <span className="font-mono truncate">{String(evt.source)}</span>
                      </div>
                      {evt.metadata != null && (
                        <p className="text-muted-foreground truncate mt-0.5">
                          {typeof evt.metadata === "object" 
                            ? String((evt.metadata as Record<string, unknown>).description ?? (evt.metadata as Record<string, unknown>).type ?? JSON.stringify(evt.metadata)).slice(0, 80)
                            : String(evt.metadata).slice(0, 80)}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
            {(correlations ?? []).length > 0 && (
              <>
                <div className="text-[10px] font-medium text-muted-foreground pt-2 uppercase tracking-wider">
                  Recent Correlations
                </div>
                {(correlations ?? []).slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 text-xs py-1"
                    data-testid={`feed-correlation-${c.id}`}
                  >
                    <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <span className="font-mono text-[10px]">{(c.metadata as Record<string, unknown>)?.type as string ?? c.ruleName}</span>
                    <span className="text-muted-foreground">conf: {(((c.metadata as Record<string, unknown>)?.confidence as number ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default function CommandCenterPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content: "KAPPA Command Center online. Type a command or ask about the system status. Try: status, events, scan, correlations, threats",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [feedExpanded, setFeedExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: kappaStatus } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 5000,
  });

  const { data: recentEvents } = useQuery<SignalEvent[]>({
    queryKey: ["/api/events", "recent"],
    refetchInterval: 10000,
  });

  const { data: correlations } = useQuery<Correlation[]>({
    queryKey: ["/api/correlations"],
    refetchInterval: 15000,
  });

  const { data: stats } = useQuery<{
    totalEvents: number;
    correlationCount: number;
    domainCounts: Record<string, number>;
  }>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  const pipelineRunMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pipeline/run");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kappa/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/correlations"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function addMessage(role: ChatMessage["role"], content: string, meta?: ChatMessage["meta"]) {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role,
        content,
        timestamp: new Date(),
        meta,
      },
    ]);
  }

  function handleCommand(cmd: string) {
    const lower = cmd.trim().toLowerCase();
    addMessage("user", cmd);

    if (lower === "status" || lower === "s") {
      const score = kappaStatus?.score ?? 0;
      const threat = kappaStatus?.threatLevel ?? "NOMINAL";
      const totalEvents = stats?.totalEvents ?? 0;
      const corrCount = stats?.correlationCount ?? 0;
      const domains = stats?.domainCounts ?? {};
      const domainStr = Object.entries(domains).map(([d, c]) => `${d}: ${c}`).join(", ");
      addMessage("system",
        `KAPPA Score: ${score.toFixed(1)} [${threat}]\n` +
        `Total Events: ${totalEvents.toLocaleString()}\n` +
        `Correlations: ${corrCount}\n` +
        `Domains: ${domainStr}\n` +
        `Evening Window: ${kappaStatus?.eveningWindow?.active ? "ACTIVE" : "inactive"}\n` +
        `Local Time: ${kappaStatus?.eveningWindow?.localTime ?? "--:--"} CST\n` +
        `Uptime: ${kappaStatus ? `${Math.floor(kappaStatus.uptime / 3600)}h ${Math.floor((kappaStatus.uptime % 3600) / 60)}m` : "--"}`,
        { type: "status", score }
      );
    } else if (lower === "scan" || lower === "sweep") {
      addMessage("system", "Initiating pipeline sweep...");
      pipelineRunMutation.mutate(undefined, {
        onSuccess: (data: Record<string, unknown>) => {
          addMessage("system",
            `Sweep complete.\nKAPPA: ${(data as { kappaScore?: number }).kappaScore ?? "?"}\n` +
            `Threat: ${(data as { threatLevel?: string }).threatLevel ?? "?"}\n` +
            `Correlations: ${(data as { correlationsTotal?: number }).correlationsTotal ?? 0}\n` +
            `Detections: ${(data as { scannerDetections?: number }).scannerDetections ?? 0}`,
            { type: "scan" }
          );
        },
        onError: () => {
          addMessage("alert", "Sweep failed. Check system health.");
        },
      });
    } else if (lower === "events" || lower === "e") {
      const recent = (recentEvents ?? []).slice(0, 5);
      if (recent.length === 0) {
        addMessage("system", "No recent events.");
      } else {
        const lines = recent.map((e) =>
          `[${e.domain}] ${e.source} — ${new Date(e.timestamp).toLocaleTimeString()}`
        );
        addMessage("system", `Last ${recent.length} events:\n${lines.join("\n")}`);
      }
    } else if (lower === "correlations" || lower === "c") {
      const corrs = (correlations ?? []).slice(0, 5);
      if (corrs.length === 0) {
        addMessage("system", "No active correlations.");
      } else {
        const lines = corrs.map((c) =>
          `${(c.metadata as Record<string, unknown>)?.type ?? c.ruleName} — conf: ${(((c.metadata as Record<string, unknown>)?.confidence as number ?? 0) * 100).toFixed(0)}% — ${((c.metadata as Record<string, unknown>)?.domains as string[] ?? []).join(",")}`
        );
        addMessage("system", `Active correlations:\n${lines.join("\n")}`);
      }
    } else if (lower === "threats" || lower === "t") {
      const score = kappaStatus?.score ?? 0;
      const threat = kappaStatus?.threatLevel ?? "NOMINAL";
      const alerts = kappaStatus?.recentAlerts ?? [];
      if (alerts.length === 0) {
        addMessage("system", `Threat level: ${threat} (κ=${score.toFixed(1)})\nNo active alerts.`);
      } else {
        const lines = alerts.map((a) => `⚠ [${a.type}] ${a.description}`);
        addMessage("alert", `Threat level: ${threat} (κ=${score.toFixed(1)})\n${lines.join("\n")}`, { type: "threat", score });
      }
    } else if (lower === "feed") {
      setFeedExpanded((p) => !p);
      addMessage("system", feedExpanded ? "Live feed collapsed." : "Live feed expanded.");
    } else if (lower === "help" || lower === "h" || lower === "?") {
      addMessage("system",
        "Commands:\n" +
        "  status (s)  — System overview\n" +
        "  events (e)  — Recent events\n" +
        "  correlations (c) — Active correlations\n" +
        "  threats (t) — Threat assessment\n" +
        "  scan/sweep  — Run pipeline sweep\n" +
        "  feed        — Toggle live feed\n" +
        "  help (h/?)  — This message"
      );
    } else {
      addMessage("system", `Unknown command: "${cmd}". Type 'help' for available commands.`);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    handleCommand(input);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full" data-testid="command-center">
      <LiveStatusBar kappaStatus={kappaStatus} />

      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-3 sm:p-4 space-y-2 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`chat-msg-${msg.id}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : msg.role === "alert"
                      ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.role !== "user" && (
                    <div className="flex items-center gap-1 mb-1">
                      {msg.role === "alert" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Shield className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">
                        {msg.role === "alert" ? "ALERT" : "KAPPA"}
                      </span>
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed break-words">
                    {msg.content}
                  </pre>
                  <span className="text-[9px] text-muted-foreground font-mono block mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <LiveFeed
          events={recentEvents}
          correlations={correlations}
          expanded={feedExpanded}
          onToggle={() => setFeedExpanded((p) => !p)}
        />

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-2 border-t bg-background"
          data-testid="form-command"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type command... (help for list)"
            className="flex-1 font-mono text-sm h-10"
            autoComplete="off"
            autoFocus
            data-testid="input-command"
          />
          <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0" data-testid="button-send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
