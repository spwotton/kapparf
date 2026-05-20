import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import {
  Cpu, Send, Download, Eye, EyeOff, ChevronDown, ChevronRight,
  Layers, Zap, AlertTriangle, ExternalLink, RefreshCw, X,
  Play, Square, Settings, Activity, Brain, History, Search, FileText, FileJson, Database, Archive,
  Plus, GripVertical, Pencil, Check, Trash2, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import {
  LLM_MODELS, DEFAULT_MODEL_ID, AGENT_ROLES, makeDefaultLayers, getRoleInfo, getEffectiveSystemPrompt,
  type HypervisorLayer, type HypervisorAgent, type BlendMode,
} from "@/lib/llm-models";
import { WorkerPool, type WorkerOutMsg, type AgentSubscription } from "@/lib/worker-pool";
import { Link } from "wouter";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BLEND_MODES: BlendMode[] = ["normal", "add", "multiply", "screen", "difference"];
const LS_KEY = "kappa-hypervisor-layers-v2";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface BackgroundEntry {
  ts: number;
  summary: string;
  eventCount: number;
}

interface SessionLayerOutput {
  layerName: string;
  layerId: string;
  blendMode: BlendMode;
  opacity: number;
  agents: Array<{ roleLabel: string; output: string; tokenCount: number }>;
}

interface RoundtableSession {
  id: string;
  ts: number;
  prompt: string;
  layerOutputs: SessionLayerOutput[];
  hypervisorSynthesis: string;
}

const SESSIONS_KEY = "kappa_roundtable_sessions";
const MAX_SESSIONS = 50;

function loadSessions(): RoundtableSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: RoundtableSession[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {}
}

function buildMarkdown(session: RoundtableSession): string {
  const date = new Date(session.ts).toISOString();
  const lines: string[] = [
    `# Roundtable Session — ${date}`,
    ``,
    `## Prompt`,
    ``,
    session.prompt,
    ``,
    `## Layer Outputs`,
    ``,
  ];

  for (const layer of session.layerOutputs) {
    lines.push(`### ${layer.layerName} (blend: ${layer.blendMode}, opacity: ${Math.round(layer.opacity * 100)}%)`);
    lines.push(``);
    for (const agent of layer.agents) {
      if (!agent.output) continue;
      lines.push(`#### ${agent.roleLabel}`);
      lines.push(``);
      lines.push(agent.output);
      lines.push(``);
    }
  }

  lines.push(`## Hypervisor ∑ Synthesis`);
  lines.push(``);
  lines.push(session.hypervisorSynthesis);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*Exported from KAPPA Monadic Hypervisor*`);

  return lines.join("\n");
}

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function newLayerId() {
  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
function newAgentId() {
  return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function BlendModeChip({ mode }: { mode: BlendMode }) {
  const colors: Record<BlendMode, string> = {
    normal: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    add: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    multiply: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    screen: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    difference: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${colors[mode]}`}>
      {mode}
    </span>
  );
}

function AgentChip({
  agent,
  layerId,
  onDelete,
  onPromptChange,
  onAbort,
}: {
  agent: HypervisorAgent;
  layerId: string;
  onDelete: (layerId: string, agentId: string) => void;
  onPromptChange: (layerId: string, agentId: string, prompt: string) => void;
  onAbort?: (layerId: string, agentId: string) => void;
}) {
  const role = getRoleInfo(agent.roleId);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState(agent.customSystemPrompt ?? "");

  const effectivePrompt = agent.customSystemPrompt?.trim() ? agent.customSystemPrompt : role.systemPrompt;
  const statusColor = {
    idle: "bg-zinc-300 dark:bg-zinc-600",
    queued: "bg-amber-400 animate-pulse",
    running: "bg-blue-500 animate-pulse",
    done: "bg-emerald-500",
    error: "bg-amber-500",
    aborted: "bg-zinc-400 dark:bg-zinc-500",
  }[agent.status];

  const savePrompt = () => {
    onPromptChange(layerId, agent.id, promptDraft);
    setShowPrompt(false);
  };

  const isActive = agent.status === "running" || agent.status === "queued";

  const statusLabel = {
    idle: null,
    queued: <span className="text-[10px] text-amber-600 dark:text-amber-400 animate-pulse">queued…</span>,
    running: !agent.output ? <span className="text-[10px] text-muted-foreground animate-pulse">generating…</span> : null,
    done: null,
    error: <span className="text-[10px] text-amber-500">error</span>,
    aborted: <span className="text-[10px] text-zinc-400">aborted</span>,
  }[agent.status];

  return (
    <div className="rounded border border-border/50 bg-muted/20" data-testid={`agent-chip-${agent.id}`}>
      <div className="flex items-start gap-2 p-2">
        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
          <div className={`h-2 w-2 rounded-full ${statusColor}`} />
          <span className="text-[10px] font-mono font-semibold" style={{ color: role.color }}>
            {role.label}
          </span>
          {agent.customSystemPrompt?.trim() && (
            <span className="text-[9px] text-amber-500 font-mono">custom</span>
          )}
        </div>
        {agent.output && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {agent.output}
          </p>
        )}
        {agent.status === "running" && !agent.output && (
          <span className="text-[10px] text-muted-foreground animate-pulse flex-1">generating…</span>
        )}
        {agent.status === "running" && agent.tokensPerSec > 0 && (
          <span
            className="text-[10px] font-mono text-blue-500 dark:text-blue-400 shrink-0 tabular-nums"
            data-testid={`badge-tps-${agent.id}`}
          >
            {agent.tokensPerSec} t/s
          </span>
        )}
        {agent.tokenCount > 0 && (
          <span className="text-[10px] text-muted-foreground shrink-0">{agent.tokenCount}t</span>
        )}
        <button
          onClick={() => { setShowPrompt((v) => !v); setPromptDraft(agent.customSystemPrompt ?? ""); }}
          className="shrink-0 text-muted-foreground hover:text-foreground ml-auto"
          title="Edit system prompt"
          data-testid={`button-edit-prompt-${agent.id}`}
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
        {isActive && onAbort ? (
          <button
            onClick={() => onAbort(layerId, agent.id)}
            className="shrink-0 text-amber-500 hover:text-red-500"
            title="Abort this agent"
            data-testid={`button-abort-agent-${agent.id}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        ) : (
          <button
            onClick={() => onDelete(layerId, agent.id)}
            className="shrink-0 text-muted-foreground hover:text-amber-500"
            title="Remove agent"
            data-testid={`button-delete-agent-${agent.id}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {showPrompt && (
        <div className="px-2 pb-2 space-y-1 border-t border-border/30 pt-1.5">
          <div className="text-[9px] text-muted-foreground font-mono mb-1">
            System prompt {agent.customSystemPrompt?.trim() ? "(custom)" : "(default — editing overrides)"}
          </div>
          <Textarea
            value={promptDraft || effectivePrompt}
            onChange={(e) => setPromptDraft(e.target.value)}
            rows={4}
            className="text-[10px] resize-none font-mono leading-relaxed"
            data-testid={`textarea-agent-prompt-${agent.id}`}
          />
          <div className="flex gap-1 justify-end">
            {agent.customSystemPrompt?.trim() && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 text-[9px] text-muted-foreground"
                onClick={() => { onPromptChange(layerId, agent.id, ""); setShowPrompt(false); }}
                data-testid={`button-reset-prompt-${agent.id}`}
              >
                Reset to default
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-5 text-[9px]"
              onClick={() => setShowPrompt(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-5 text-[9px]"
              onClick={savePrompt}
              data-testid={`button-save-prompt-${agent.id}`}
            >
              <Check className="h-2.5 w-2.5 mr-0.5" />Save
            </Button>
          </div>
        </div>
      )}
      {!agent.output && statusLabel && (
        <div className="px-2 pb-1">
          <span className="flex-1">{statusLabel}</span>
        </div>
      )}
    </div>
  );
}

interface LayerRowCallbacks {
  onToggleHidden: (id: string) => void;
  onOpacityChange: (id: string, v: number) => void;
  onBlendChange: (id: string, v: BlendMode) => void;
  onToggleExpand: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddAgent: (layerId: string, roleId: string) => void;
  onDeleteAgent: (layerId: string, agentId: string) => void;
  onAgentPromptChange: (layerId: string, agentId: string, prompt: string) => void;
  onAbortAgent: (layerId: string, agentId: string) => void;
}

function LayerRow({
  layer,
  dragHandleAttributes,
  dragHandleListeners,
  autoRename,
  callbacks,
}: {
  layer: HypervisorLayer;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: Record<string, React.EventHandler<React.SyntheticEvent>>;
  autoRename?: boolean;
  callbacks: LayerRowCallbacks;
}) {
  const [renaming, setRenaming] = useState(() => autoRename ?? false);
  const [nameDraft, setNameDraft] = useState(layer.name);
  const [addingAgent, setAddingAgent] = useState(false);
  const [newAgentRole, setNewAgentRole] = useState(AGENT_ROLES[0].id);

  const commitRename = () => {
    if (nameDraft.trim()) callbacks.onRename(layer.id, nameDraft.trim());
    setRenaming(false);
  };

  const commitAddAgent = () => {
    callbacks.onAddAgent(layer.id, newAgentRole);
    setAddingAgent(false);
    setNewAgentRole(AGENT_ROLES[0].id);
  };

  return (
    <div data-testid={`layer-row-${layer.id}`}>
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors ${layer.isHidden ? "opacity-50" : ""}`}
      >
        <button
          {...(dragHandleAttributes ?? {})}
          {...(dragHandleListeners ?? {})}
          className="shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
          data-testid={`drag-handle-${layer.id}`}
        >
          <GripVertical className="h-3 w-3" />
        </button>

        <button
          onClick={() => callbacks.onToggleExpand(layer.id)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {layer.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        {renaming ? (
          <form
            className="flex-1 flex gap-1"
            onSubmit={(e) => { e.preventDefault(); commitRename(); }}
          >
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="h-5 text-[11px] flex-1 px-1"
              autoFocus
              onBlur={commitRename}
              data-testid={`input-rename-layer-${layer.id}`}
            />
          </form>
        ) : (
          <span
            className="text-xs font-medium flex-1 truncate cursor-pointer"
            onDoubleClick={() => { setNameDraft(layer.name); setRenaming(true); }}
            title="Double-click to rename"
          >
            {layer.name}
          </span>
        )}

        <BlendModeChip mode={layer.blendMode} />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
          {Math.round(layer.opacity * 100)}%
        </span>
        <button
          onClick={() => { setNameDraft(layer.name); setRenaming(true); }}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          title="Rename layer"
          data-testid={`button-rename-layer-${layer.id}`}
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => callbacks.onToggleHidden(layer.id)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          data-testid={`toggle-hidden-${layer.id}`}
        >
          {layer.isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
        <button
          onClick={() => callbacks.onDelete(layer.id)}
          className="shrink-0 text-muted-foreground hover:text-amber-500"
          title="Delete layer"
          data-testid={`button-delete-layer-${layer.id}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {layer.isExpanded && (
        <div className="ml-6 mb-2 space-y-1.5">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] text-muted-foreground w-12">Opacity</span>
            <div className="flex-1">
              <Slider
                value={[layer.opacity * 100]}
                onValueChange={([v]) => callbacks.onOpacityChange(layer.id, v / 100)}
                min={0} max={100} step={1}
                className="h-1"
                data-testid={`slider-opacity-${layer.id}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] text-muted-foreground w-12">Blend</span>
            <Select value={layer.blendMode} onValueChange={(v) => callbacks.onBlendChange(layer.id, v as BlendMode)}>
              <SelectTrigger className="h-6 text-[11px] flex-1" data-testid={`select-blend-${layer.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLEND_MODES.map((m) => (
                  <SelectItem key={m} value={m} className="text-[11px]">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {layer.mask && (
            <div className="px-2 text-[10px] text-muted-foreground italic">
              mask: {layer.mask}
            </div>
          )}

          <div className="px-2 space-y-1">
            {layer.agents.map((a) => (
              <AgentChip
                key={a.id}
                agent={a}
                layerId={layer.id}
                onDelete={callbacks.onDeleteAgent}
                onPromptChange={callbacks.onAgentPromptChange}
                onAbort={callbacks.onAbortAgent}
              />
            ))}
          </div>

          {addingAgent ? (
            <div className="px-2 flex gap-1 items-center" data-testid={`add-agent-form-${layer.id}`}>
              <Select value={newAgentRole} onValueChange={setNewAgentRole}>
                <SelectTrigger className="h-6 text-[10px] flex-1" data-testid={`select-new-agent-role-${layer.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_ROLES.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-[11px]">
                      <span style={{ color: r.color }}>{r.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-6 text-[10px] px-2" onClick={commitAddAgent} data-testid={`button-confirm-add-agent-${layer.id}`}>
                <Check className="h-2.5 w-2.5 mr-0.5" />Add
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setAddingAgent(false)}>
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          ) : (
            <div className="px-2">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] w-full"
                onClick={() => setAddingAgent(true)}
                data-testid={`button-add-agent-${layer.id}`}
              >
                <Plus className="h-2.5 w-2.5 mr-1" />Add Agent
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableLayerRow({
  layer,
  autoRename,
  callbacks,
}: {
  layer: HypervisorLayer;
  autoRename?: boolean;
  callbacks: LayerRowCallbacks;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: layer.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LayerRow
        layer={layer}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners as Record<string, React.EventHandler<React.SyntheticEvent>>}
        autoRename={autoRename}
        callbacks={callbacks}
      />
    </div>
  );
}

function loadLayersFromStorage(): HypervisorLayer[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as HypervisorLayer[];
  } catch {
    return null;
  }
}

function saveLayersToStorage(layers: HypervisorLayer[]) {
  try {
    const clean = layers.map((l) => ({
      ...l,
      agents: l.agents.map((a) => ({ ...a, output: "", status: "idle", tokenCount: 0, tokensPerSec: 0, tokenTimestamps: [] })),
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(clean));
  } catch {}
}

const DEFAULT_MAX_CONCURRENT = 3;

export default function LocalLLMHypervisorPage() {
  const { toast } = useToast();

  const [webGPUAvail, setWebGPUAvail] = useState<boolean | null>(null);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [hfToken, setHfToken] = useState(() =>
    localStorage.getItem("hf_token") ?? (import.meta.env.VITE_HF_TOKEN as string | undefined) ?? ""
  );
  const [modelStatus, setModelStatus] = useState<"unloaded" | "loading" | "loaded" | "error">("unloaded");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadFile, setLoadFile] = useState("");
  const [loadLoaded, setLoadLoaded] = useState(0);
  const [loadTotal, setLoadTotal] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");

  const [layers, setLayers] = useState<HypervisorLayer[]>(() => loadLayersFromStorage() ?? makeDefaultLayers());
  const [justAddedLayerId, setJustAddedLayerId] = useState<string | null>(null);
  const [activeLayerMode, setActiveLayerMode] = useState<"chat" | "roundtable">("chat");
  const [maxConcurrent, setMaxConcurrent] = useState(DEFAULT_MAX_CONCURRENT);

  const [bgEnabled, setBgEnabled] = useState(false);
  const [bgLog, setBgLog] = useState<BackgroundEntry[]>([]);
  const [lastSeenEventIds, setLastSeenEventIds] = useState<Set<number>>(new Set());

  const [sessions, setSessions] = useState<RoundtableSession[]>(loadSessions);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<RoundtableSession | null>(null);
  const [checkedSessionIds, setCheckedSessionIds] = useState<Set<string>>(new Set());

  // Track agent IDs that were manually aborted so we can ignore their
  // subsequent "done" messages from the worker (the worker still runs to
  // completion but tokens are discarded client-side).
  const abortedAgentsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!historyOpen) {
      setCheckedSessionIds(new Set());
    }
  }, [historyOpen]);

  const poolRef = useRef<WorkerPool | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const bgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingPromptRef = useRef<string>("");
  const pendingRunIdRef = useRef<string>("");
  const justAddedLayerIdRef = useRef<string | null>(null);

  const roundtableTrackerRef = useRef<{ total: number; done: number } | null>(null);
  const layersRef = useRef<HypervisorLayer[]>(layers);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    (async () => {
      try {
        if (!("gpu" in navigator)) { setWebGPUAvail(false); return; }
        const adapter = await (navigator as any).gpu.requestAdapter();
        setWebGPUAvail(!!adapter);
      } catch {
        setWebGPUAvail(false);
      }
    })();
  }, []);

  useEffect(() => {
    saveLayersToStorage(layers);
  }, [layers]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLayers((prev) => {
      const oldIndex = prev.findIndex((l) => l.id === active.id);
      const newIndex = prev.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const handlePoolMessage = useCallback((msg: WorkerOutMsg) => {
    if (msg.type === "progress") {
      setLoadProgress(msg.progress);
      setLoadFile(msg.file);
      setLoadLoaded(msg.loaded);
      setLoadTotal(msg.total);
    } else if (msg.type === "loaded") {
      setModelStatus("loaded");
      setLoadProgress(100);
      toast({ title: `Model loaded: ${msg.modelId}` });
    } else if (msg.type === "token") {
      if (msg.text === "\u0000queued") {
        setLayers((prev) => prev.map((l) => {
          if (l.id !== msg.layerId) return l;
          return {
            ...l,
            agents: l.agents.map((a) =>
              a.id === msg.agentId ? { ...a, status: "queued" as const } : a
            ),
          };
        }));
        return;
      }
      if (msg.layerId === "chat") {
        setStreamBuffer((b) => b + msg.text);
      } else {
        const now = Date.now();
        setLayers((prev) => prev.map((l) => {
          if (l.id !== msg.layerId) return l;
          return {
            ...l,
            agents: l.agents.map((a) => {
              if (a.id !== msg.agentId) return a;
              const window = [...(a.tokenTimestamps ?? []).filter((t) => now - t <= 2000), now];
              return {
                ...a,
                output: a.output + msg.text,
                status: "running" as const,
                tokenTimestamps: window,
                tokensPerSec: Math.round(window.length / 2),
              };
            }),
          };
        }));
      }
      setTotalTokens((t) => t + 1);
    } else if (msg.type === "done") {
      if (msg.layerId === "chat") {
        setChatStreaming(false);
        setStreamBuffer((buf) => {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: buf, timestamp: Date.now() },
          ]);
          return "";
        });
      } else {
        // If this done belongs to an aborted agent, leave the status as "aborted".
        const isAborted = abortedAgentsRef.current.has(msg.agentId);

        setLayers((prev) => {
          const next = prev.map((l) => {
            if (l.id !== msg.layerId) return l;
            return {
              ...l,
              agents: l.agents.map((a) =>
                a.id === msg.agentId
                  ? { ...a, status: (isAborted ? "aborted" : "done") as const, tokenCount: a.tokenCount + msg.totalTokens, tokensPerSec: 0, tokenTimestamps: [] }
                  : a
              ),
            };
          });

          // Save session when Hypervisor synthesis completes.
          if (msg.layerId === "layer-hypervisor") {
            const runId = pendingRunIdRef.current;
            const prompt = pendingPromptRef.current;

            if (runId && prompt) {
              pendingRunIdRef.current = "";

              const hypLayer = next.find((l) => l.id === "layer-hypervisor");
              const hypAgent = hypLayer?.agents[0];
              const synthesis = hypAgent?.output ?? "";

              const layerOutputs: SessionLayerOutput[] = next
                .filter((l) => l.id !== "layer-hypervisor" && !l.isHidden)
                .map((l) => ({
                  layerName: l.name,
                  layerId: l.id,
                  blendMode: l.blendMode,
                  opacity: l.opacity,
                  agents: l.agents.map((a) => ({
                    roleLabel: getRoleInfo(a.roleId).label,
                    output: a.output,
                    tokenCount: a.tokenCount,
                  })),
                }));

              const session: RoundtableSession = {
                id: runId,
                ts: Date.now(),
                prompt,
                layerOutputs,
                hypervisorSynthesis: synthesis,
              };

              setSessions((prev) => {
                const updated = [session, ...prev];
                saveSessions(updated);
                return updated;
              });

              toast({ title: "Session saved", description: "Roundtable session stored in history" });
            }
          }

          return next;
        });

        // Advance roundtable tracker for non-hypervisor layers (triggers auto-Hypervisor).
        // Skip if this agent was aborted — the tracker was already advanced at abort time.
        if (msg.layerId !== "layer-hypervisor" && roundtableTrackerRef.current) {
          if (!abortedAgentsRef.current.has(msg.agentId)) {
            roundtableTrackerRef.current.done += 1;
            if (roundtableTrackerRef.current.done >= roundtableTrackerRef.current.total) {
              roundtableTrackerRef.current = null;
              setTimeout(() => { triggerHypervisorFromRef(); }, 100);
            }
          } else {
            // Clean up the aborted set once the worker's final message arrives.
            abortedAgentsRef.current.delete(msg.agentId);
          }
        }
      }
    } else if (msg.type === "error") {
      const isAgentError = msg.agentId && msg.agentId !== "chat";

      if (!isAgentError) {
        setModelStatus("error");
        setChatStreaming(false);
      }

      // If this error is for an aborted agent, swallow the toast and skip
      // the UI update — the agent is already shown as "aborted".
      if (isAgentError && msg.agentId && abortedAgentsRef.current.has(msg.agentId)) {
        abortedAgentsRef.current.delete(msg.agentId);
        return;
      }

      toast({ title: "Worker error", description: msg.message, variant: "destructive" });

      if (isAgentError && msg.agentId && msg.layerId) {
        // Mark the specific agent as errored in the UI.
        const aidSnap = msg.agentId;
        const lidSnap = msg.layerId;
        setLayers((prev) =>
          prev.map((l) => {
            if (l.id !== lidSnap) return l;
            return {
              ...l,
              agents: l.agents.map((a) =>
                a.id === aidSnap ? { ...a, status: "error" as const } : a
              ),
            };
          })
        );

        // Advance the roundtable completion tracker so the Hypervisor can
        // still be triggered even if some agents fail.
        if (roundtableTrackerRef.current && lidSnap !== "layer-hypervisor") {
          roundtableTrackerRef.current.done += 1;
          if (roundtableTrackerRef.current.done >= roundtableTrackerRef.current.total) {
            roundtableTrackerRef.current = null;
            setTimeout(() => { triggerHypervisorFromRef(); }, 100);
          }
        }
      }
    }
  }, [toast]);

  function triggerHypervisorFromRef() {
    const currentLayers = layersRef.current;
    const hyperLayer = currentLayers.find((l) => l.id === "layer-hypervisor");
    if (!hyperLayer) return;

    const agentOutputs = currentLayers
      .filter((l) => l.id !== "layer-hypervisor")
      .flatMap((l) =>
        l.agents
          .filter((a) => a.output)
          .map((a) => `[${getRoleInfo(a.roleId).label} — Layer "${l.name}" opacity:${l.opacity} blend:${l.blendMode}]\n${a.output}`)
      )
      .join("\n\n---\n\n");

    if (!agentOutputs.trim()) return;

    const hypAgent = hyperLayer.agents[0];
    const role = getRoleInfo(hypAgent.roleId);

    setLayers((prev) =>
      prev.map((l) => l.id !== "layer-hypervisor" ? l : {
        ...l,
        agents: l.agents.map((a) => ({ ...a, output: "", status: "running" as const, tokenCount: 0, tokensPerSec: 0, tokenTimestamps: [] })),
      })
    );

    poolRef.current?.dispatch(
      hypAgent.id,
      hyperLayer.id,
      [
        { role: "system", content: role.systemPrompt },
        { role: "user", content: `Layer outputs for synthesis:\n\n${agentOutputs}` },
      ],
      512
    );
  }

  const initPool = useCallback(() => {
    if (poolRef.current) poolRef.current.terminate();
    const pool = new WorkerPool(maxConcurrent, handlePoolMessage);
    poolRef.current = pool;
    return pool;
  }, [maxConcurrent, handlePoolMessage]);

  const autoLoadedRef = useRef(false);

  useEffect(() => {
    const pool = initPool();
    if (!autoLoadedRef.current) {
      autoLoadedRef.current = true;
      const model = LLM_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!;
      const savedToken =
        localStorage.getItem("hf_token") ??
        (import.meta.env.VITE_HF_TOKEN as string | undefined) ??
        "";
      setModelStatus("loading");
      setLoadProgress(0);
      pool.loadModel({ modelId: model.hfRepo, hfToken: savedToken || undefined, dtype: model.dtype });
    }
    return () => poolRef.current?.terminate();
  }, []);

  useEffect(() => {
    poolRef.current?.setMaxConcurrent(maxConcurrent);
  }, [maxConcurrent]);

  const loadModel = () => {
    const pool = poolRef.current ?? initPool();
    const model = LLM_MODELS.find((m) => m.id === modelId)!;
    setModelStatus("loading");
    setLoadProgress(0);
    pool.loadModel({ modelId: model.hfRepo, hfToken: hfToken || undefined, dtype: model.dtype });
    if (hfToken) localStorage.setItem("hf_token", hfToken);
  };

  const sendChat = () => {
    if (!chatInput.trim() || chatStreaming || modelStatus !== "loaded") return;
    const userMsg: ChatMessage = { role: "user", content: chatInput, timestamp: Date.now() };
    const history = [...chatMessages, userMsg];
    setChatMessages(history);
    setChatInput("");
    setChatStreaming(true);
    setStreamBuffer("");

    const messages = history.map((m) => ({ role: m.role, content: m.content }));
    poolRef.current?.dispatch("chat", "chat", messages, 512);
  };

  const injectKappaContext = async () => {
    try {
      const res = await fetch("/api/events?limit=20");
      const events = await res.json();
      const summary = JSON.stringify(events.slice(0, 20), null, 0);
      const sysMsg: ChatMessage = {
        role: "system",
        content: `[KAPPA CONTEXT — ${new Date().toISOString()}]\n${summary}`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, sysMsg]);
      toast({ title: "KAPPA context injected", description: `${Math.min(events.length, 20)} events prepended` });
    } catch {
      toast({ title: "Failed to fetch KAPPA events", variant: "destructive" });
    }
  };

  const runRoundtable = () => {
    if (modelStatus !== "loaded" || !chatInput.trim()) return;
    const prompt = chatInput.trim();
    pendingPromptRef.current = prompt;
    pendingRunIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setChatInput("");
    // Clear any stale aborted-agent tracking from the previous run.
    abortedAgentsRef.current.clear();

    setLayers((prev) =>
      prev.map((l) => ({
        ...l,
        agents: l.agents.map((a) => ({ ...a, output: "", status: "idle" as const, tokenCount: 0, tokensPerSec: 0, tokenTimestamps: [] })),
      }))
    );

    const synthLayerId = findSynthLayerId();
    const agentLayers = layers.filter((l) => !l.isHidden && l.id !== synthLayerId);
    const allAgents = agentLayers.flatMap((l) => l.agents.map((a) => ({ layer: l, agent: a })));

    if (allAgents.length === 0) {
      toast({ title: "No visible agent layers", description: "Unhide a layer to run the roundtable" });
      return;
    }

    roundtableTrackerRef.current = { total: allAgents.length, done: 0 };

    for (const { layer, agent } of allAgents) {
      const systemPrompt = getEffectiveSystemPrompt(agent);
      poolRef.current?.dispatch(
        agent.id,
        layer.id,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        256
      );
    }
  };

  const findSynthLayerId = () => {
    const explicit = layers.find((l) => l.id === "layer-hypervisor");
    if (explicit) return explicit.id;
    return layers[layers.length - 1]?.id ?? "";
  };

  const runHypervisor = () => {
    if (modelStatus !== "loaded") return;
    triggerHypervisorFromRef();
  };

  useEffect(() => {
    if (bgIntervalRef.current) clearInterval(bgIntervalRef.current);
    if (!bgEnabled) return;

    const run = async () => {
      if (modelStatus !== "loaded") return;
      try {
        const res = await fetch("/api/events?limit=50");
        const events: any[] = await res.json();
        const newEvents = events.filter((ev) => !lastSeenEventIds.has(ev.id));
        if (newEvents.length === 0) return;

        setLastSeenEventIds((prev) => {
          const next = new Set(prev);
          newEvents.forEach((ev) => next.add(ev.id));
          return next;
        });

        const analystLayer = layers.find((l) => l.id === "layer-kappa");
        const agent = analystLayer?.agents[0];
        if (!agent || !poolRef.current) return;

        const systemPrompt = getEffectiveSystemPrompt(agent);
        const summary = JSON.stringify(newEvents.slice(0, 20));

        let collected = "";
        let unsubscribe: (() => void) | null = null;

        const callbacks: AgentSubscription = {
          onToken: (text) => { collected += text; },
          onDone: () => {
            setBgLog((prev) => [
              { ts: Date.now(), summary: collected, eventCount: newEvents.length },
              ...prev.slice(0, 19),
            ]);
            unsubscribe?.();
          },
          onError: () => { unsubscribe?.(); },
        };

        unsubscribe = poolRef.current.subscribeAgent(agent.id, callbacks);

        poolRef.current.dispatch(
          agent.id,
          analystLayer!.id,
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: `New KAPPA events:\n${summary}` },
          ],
          256
        );
      } catch (err) {
        setBgLog((prev) => [
          { ts: Date.now(), summary: `Analysis error: ${err instanceof Error ? err.message : String(err)}`, eventCount: 0 },
          ...prev.slice(0, 19),
        ]);
      }
    };

    run();
    bgIntervalRef.current = setInterval(run, 30000);
    return () => { if (bgIntervalRef.current) clearInterval(bgIntervalRef.current); };
  }, [bgEnabled, modelStatus, layers, lastSeenEventIds]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamBuffer]);

  const updateLayer = (id: string, fn: (l: HypervisorLayer) => HypervisorLayer) => {
    setLayers((prev) => prev.map((l) => l.id === id ? fn(l) : l));
  };

  const exportSession = (session: RoundtableSession) => {
    const md = buildMarkdown(session);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roundtable-${new Date(session.ts).toISOString().replace(/[:.]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Session exported", description: "Markdown file downloaded" });
  };

  const exportSessionAsJson = (session: RoundtableSession) => {
    const json = JSON.stringify(session, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roundtable-${new Date(session.ts).toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Session exported", description: "JSON file downloaded" });
  };

  const exportAllSessions = async () => {
    if (sessions.length === 0) {
      toast({ title: "No sessions to export", description: "Run a roundtable first", variant: "destructive" });
      return;
    }
    const zip = new JSZip();
    for (const session of sessions) {
      const md = buildMarkdown(session);
      const filename = `roundtable-${new Date(session.ts).toISOString().replace(/[:.]/g, "-")}.md`;
      zip.file(filename, md);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kappa-roundtable-sessions-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ title: "All sessions exported", description: `${sessions.length} session${sessions.length !== 1 ? "s" : ""} packaged as ZIP` });
  };

  const exportAllSessionsJson = () => {
    if (sessions.length === 0) {
      toast({ title: "No sessions to export", description: "Run a roundtable first", variant: "destructive" });
      return;
    }
    const json = JSON.stringify(sessions, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kappa-sessions-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ title: "Sessions exported as JSON", description: `${sessions.length} session${sessions.length !== 1 ? "s" : ""} downloaded as JSON` });
  };

  const importSessionsFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("Expected an array");

        const isValidAgent = (a: unknown) =>
          a && typeof a === "object" &&
          typeof (a as Record<string, unknown>).roleLabel === "string" &&
          typeof (a as Record<string, unknown>).output === "string" &&
          typeof (a as Record<string, unknown>).tokenCount === "number";

        const isValidLayerOutput = (l: unknown) =>
          l && typeof l === "object" &&
          typeof (l as Record<string, unknown>).layerName === "string" &&
          typeof (l as Record<string, unknown>).layerId === "string" &&
          typeof (l as Record<string, unknown>).blendMode === "string" &&
          typeof (l as Record<string, unknown>).opacity === "number" &&
          Array.isArray((l as Record<string, unknown>).agents) &&
          ((l as Record<string, unknown>).agents as unknown[]).every(isValidAgent);

        const isValidSession = (s: unknown): s is RoundtableSession =>
          s !== null && typeof s === "object" &&
          typeof (s as Record<string, unknown>).id === "string" &&
          (s as Record<string, unknown>).id !== "" &&
          typeof (s as Record<string, unknown>).ts === "number" &&
          typeof (s as Record<string, unknown>).prompt === "string" &&
          typeof (s as Record<string, unknown>).hypervisorSynthesis === "string" &&
          Array.isArray((s as Record<string, unknown>).layerOutputs) &&
          ((s as Record<string, unknown>).layerOutputs as unknown[]).every(isValidLayerOutput);

        const valid = parsed.filter(isValidSession);

        if (valid.length === 0) {
          toast({ title: "No valid sessions found", description: "The file did not contain any recognisable sessions", variant: "destructive" });
          return;
        }

        setSessions((prev) => {
          const sessionMap = new Map<string, RoundtableSession>(prev.map((s) => [s.id, s]));
          let added = 0;
          let skipped = 0;
          for (const s of valid) {
            if (sessionMap.has(s.id)) {
              skipped++;
            } else {
              sessionMap.set(s.id, s);
              added++;
            }
          }
          const merged = Array.from(sessionMap.values()).sort((a, b) => b.ts - a.ts);
          saveSessions(merged);
          toast({ title: "Sessions imported", description: `${added} new session${added !== 1 ? "s" : ""} added (${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped)` });
          return merged;
        });
      } catch {
        toast({ title: "Import failed", description: "Could not parse the file. Make sure it is a valid kappa-sessions JSON.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const exportSelectedSessions = async () => {
    const toExport = sessions.filter((s) => checkedSessionIds.has(s.id));
    if (toExport.length === 0) {
      toast({ title: "No sessions selected", description: "Check at least one session before exporting", variant: "destructive" });
      return;
    }
    const zip = new JSZip();
    for (const session of toExport) {
      const md = buildMarkdown(session);
      const filename = `roundtable-${new Date(session.ts).toISOString().replace(/[:.]/g, "-")}.md`;
      zip.file(filename, md);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kappa-roundtable-selected-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ title: "Selected sessions exported", description: `${toExport.length} session${toExport.length !== 1 ? "s" : ""} packaged as ZIP` });
    setCheckedSessionIds(new Set());
  };

  const toggleSessionCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveToMemory = async (session: RoundtableSession) => {
    try {
      const content = buildMarkdown(session);
      const res = await fetch("/api/memory/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "local-llm",
          title: `Roundtable: ${session.prompt.slice(0, 80)}`,
          content,
          metadata: { sessionId: session.id, ts: session.ts, prompt: session.prompt },
          source: "monadic-hypervisor",
          importance: 0.7,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Saved to Memory Cortex", description: "Session persisted as local-llm memory" });
    } catch (err) {
      toast({ title: "Memory save failed", description: String(err), variant: "destructive" });
    }
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSessions(next);
      return next;
    });
    setCheckedSessionIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedSession?.id === id) setSelectedSession(null);
    setCheckedSessionIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const callbacks: LayerRowCallbacks = {
    onToggleHidden: (id) => updateLayer(id, (l) => ({ ...l, isHidden: !l.isHidden })),
    onOpacityChange: (id, v) => updateLayer(id, (l) => ({ ...l, opacity: v })),
    onBlendChange: (id, v) => updateLayer(id, (l) => ({ ...l, blendMode: v })),
    onToggleExpand: (id) => updateLayer(id, (l) => ({ ...l, isExpanded: !l.isExpanded })),
    onRename: (id, name) => {
      if (id === justAddedLayerIdRef.current) justAddedLayerIdRef.current = null;
      updateLayer(id, (l) => ({ ...l, name }));
    },
    onDelete: (id) => {
      setLayers((prev) => {
        if (prev.length <= 1) {
          toast({ title: "Cannot delete the last layer", variant: "destructive" });
          return prev;
        }
        return prev.filter((l) => l.id !== id);
      });
    },
    onAddAgent: (layerId, roleId) => {
      updateLayer(layerId, (l) => ({
        ...l,
        agents: [
          ...l.agents,
          { id: newAgentId(), roleId, output: "", status: "idle" as const, tokenCount: 0, tokensPerSec: 0, tokenTimestamps: [] },
        ],
      }));
    },
    onDeleteAgent: (layerId, agentId) => {
      updateLayer(layerId, (l) => ({
        ...l,
        agents: l.agents.filter((a) => a.id !== agentId),
      }));
    },
    onAgentPromptChange: (layerId, agentId, prompt) => {
      updateLayer(layerId, (l) => ({
        ...l,
        agents: l.agents.map((a) =>
          a.id === agentId ? { ...a, customSystemPrompt: prompt || undefined } : a
        ),
      }));
    },
    onAbortAgent: (layerId, agentId) => {
      if (!poolRef.current) return;

      const result = poolRef.current.abort(agentId);
      if (result === null) return;

      // Immediately mark the agent as aborted in the UI.
      updateLayer(layerId, (l) => ({
        ...l,
        agents: l.agents.map((a) =>
          a.id === agentId ? { ...a, status: "aborted" as const } : a
        ),
      }));

      if (result === "queued") {
        // Queued agents never reach a worker, so no "done"/"error" will fire.
        // Advance the tracker immediately so the Hypervisor can still trigger.
        if (roundtableTrackerRef.current && layerId !== "layer-hypervisor") {
          roundtableTrackerRef.current.done += 1;
          if (roundtableTrackerRef.current.done >= roundtableTrackerRef.current.total) {
            roundtableTrackerRef.current = null;
            setTimeout(() => { triggerHypervisorFromRef(); }, 100);
          }
        }
      } else {
        // Running agents: track this ID so the incoming "done" message from
        // the worker doesn't advance the tracker or reset the status.
        abortedAgentsRef.current.add(agentId);
        // Advance tracker now — the worker's "done" will be ignored.
        if (roundtableTrackerRef.current && layerId !== "layer-hypervisor") {
          roundtableTrackerRef.current.done += 1;
          if (roundtableTrackerRef.current.done >= roundtableTrackerRef.current.total) {
            roundtableTrackerRef.current = null;
            setTimeout(() => { triggerHypervisorFromRef(); }, 100);
          }
        }
      }
    },
  };

  const addNewLayer = () => {
    const id = newLayerId();
    const newLayer: HypervisorLayer = {
      id,
      name: `Layer ${layers.length + 1}`,
      opacity: 1.0,
      blendMode: "normal",
      isHidden: false,
      mask: "",
      agents: [],
      subLayers: [],
      isExpanded: true,
    };
    setLayers((prev) => [...prev, newLayer]);
    justAddedLayerIdRef.current = id;
  };

  const resetToDefaults = () => {
    setLayers(makeDefaultLayers());
    localStorage.removeItem(LS_KEY);
    toast({ title: "Layer stack reset to defaults" });
  };

  const selectedModel = LLM_MODELS.find((m) => m.id === modelId)!;
  const synthId = findSynthLayerId();
  const reversedLayers = [...layers].reverse();

  const roundtableRunning = layers.some((l) =>
    l.id !== "layer-hypervisor" && l.agents.some((a) => a.status === "running" || a.status === "queued")
  );

  return (
    <div className="h-full flex flex-col min-h-0 p-4 gap-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-local-llm-title">
            <Layers className="h-5 w-5 text-primary" />
            Monadic Hypervisor
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Photoshop-style agent layers · WebGPU local inference · parallel workers
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5" data-testid="status-webgpu">
            <div className={`h-2 w-2 rounded-full ${webGPUAvail === null ? "bg-zinc-400" : webGPUAvail ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-muted-foreground">{webGPUAvail === null ? "checking…" : webGPUAvail ? "WebGPU" : "WASM fallback"}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5" data-testid="status-model">
            <div className={`h-2 w-2 rounded-full ${
              modelStatus === "loaded" ? "bg-emerald-500" :
              modelStatus === "loading" ? "bg-blue-500 animate-pulse" :
              modelStatus === "error" ? "bg-amber-500" : "bg-zinc-400"
            }`} />
            <span className="text-muted-foreground">
              {modelStatus === "loaded" ? selectedModel.label : modelStatus === "loading" ? "loading…" : "unloaded"}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground" data-testid="status-tokens">{totalTokens.toLocaleString()} tokens</span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 font-sans"
            onClick={() => setHistoryOpen(true)}
            data-testid="button-open-history"
          >
            <History className="h-3.5 w-3.5" />
            History
            {sessions.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-0.5">{sessions.length}</Badge>
            )}
          </Button>
        </div>
      </div>

      {webGPUAvail === false && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm shrink-0" data-testid="banner-webgpu-unavailable">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400">
            WebGPU not available in this browser. Inference will fall back to WASM (slower). For best performance use Chrome 113+ or Edge 113+.
          </span>
          <Link href="/deep-research">
            <Button variant="outline" size="sm" className="shrink-0 ml-auto text-xs" data-testid="link-deep-research-fallback">
              <ExternalLink className="h-3 w-3 mr-1" />
              Cloud Research
            </Button>
          </Link>
        </div>
      )}

      <div className="flex-1 grid grid-cols-[240px_1fr_280px] gap-4 min-h-0">

        {/* LEFT — Layer Stack */}
        <div className="flex flex-col gap-3 min-h-0">
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Layer Stack
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={resetToDefaults}
                    title="Reset to defaults"
                    data-testid="button-reset-defaults"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={addNewLayer}
                    title="Add new layer"
                    data-testid="button-add-layer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={reversedLayers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                  {reversedLayers.map((layer) => (
                    <SortableLayerRow
                      key={layer.id}
                      layer={layer}
                      autoRename={layer.id === justAddedLayerIdRef.current}
                      callbacks={callbacks}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          {/* Roundtable controls */}
          <Card className="shrink-0">
            <CardContent className="p-3 space-y-2">
              <div className="flex gap-1">
                <Button
                  variant={activeLayerMode === "chat" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => setActiveLayerMode("chat")}
                  data-testid="button-mode-chat"
                >Chat</Button>
                <Button
                  variant={activeLayerMode === "roundtable" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => setActiveLayerMode("roundtable")}
                  data-testid="button-mode-roundtable"
                >Roundtable</Button>
              </div>
              {activeLayerMode === "roundtable" && (
                <>
                  <Button
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={runHypervisor}
                    disabled={modelStatus !== "loaded" || roundtableRunning}
                    data-testid="button-run-hypervisor"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Synthesise ∑
                  </Button>

                  {/* Concurrency control */}
                  <div className="space-y-1 pt-1 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Parallel workers</span>
                      <span className="text-[10px] font-mono text-foreground" data-testid="text-max-concurrent">{maxConcurrent}</span>
                    </div>
                    <Slider
                      value={[maxConcurrent]}
                      onValueChange={([v]) => setMaxConcurrent(v)}
                      min={1}
                      max={6}
                      step={1}
                      className="h-1"
                      data-testid="slider-max-concurrent"
                    />
                    <div className="text-[9px] text-muted-foreground">
                      Lower = less GPU contention
                    </div>
                  </div>
                </>
              )}
              <div className="text-[10px] text-muted-foreground text-center">
                {layers.length} layer{layers.length !== 1 ? "s" : ""} · {layers.reduce((n, l) => n + l.agents.length, 0)} agents
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CENTER — Chat / Roundtable */}
        <div className="flex flex-col gap-3 min-h-0">
          <Card className="shrink-0">
            <CardContent className="p-3">
              <div className="grid grid-cols-[1fr_auto_200px] gap-2 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Model</label>
                  <Select value={modelId} onValueChange={setModelId}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LLM_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          {m.label} — {m.sizeLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">HF Token</label>
                  <Input
                    type="password"
                    placeholder="hf_…"
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    className="h-8 text-xs w-40 font-mono"
                    data-testid="input-hf-token"
                  />
                </div>
                <Button
                  onClick={loadModel}
                  disabled={modelStatus === "loading"}
                  className="h-8 text-xs"
                  data-testid="button-load-model"
                >
                  {modelStatus === "loading" ? (
                    <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Loading…</>
                  ) : modelStatus === "loaded" ? (
                    <><RefreshCw className="h-3 w-3 mr-1" />Reload</>
                  ) : (
                    <><Download className="h-3 w-3 mr-1" />Load Model</>
                  )}
                </Button>
              </div>

              {modelStatus === "loading" && (
                <div className="mt-2 space-y-1" data-testid="download-progress">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="truncate">{loadFile || "Initialising…"}</span>
                    <span>{loadLoaded > 0 ? `${formatBytes(loadLoaded)} / ${formatBytes(loadTotal)}` : `${loadProgress.toFixed(0)}%`}</span>
                  </div>
                  <Progress value={loadProgress} className="h-1.5" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  {activeLayerMode === "chat" ? (
                    <><Activity className="h-3.5 w-3.5" /> Chat — Access Layer</>
                  ) : (
                    <><Zap className="h-3.5 w-3.5 text-amber-500" /> Roundtable
                      {roundtableRunning && (
                        <Badge variant="outline" className="text-[9px] h-4 border-blue-500 text-blue-600 ml-1 animate-pulse">
                          running
                        </Badge>
                      )}
                    </>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={injectKappaContext}
                  data-testid="button-inject-kappa"
                >
                  <Cpu className="h-3 w-3 mr-1" />
                  Inject KAPPA
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 min-h-0 px-3">
              <div className="space-y-3 pb-2">
                {chatMessages.length === 0 && activeLayerMode === "chat" && (
                  <div className="text-center text-sm text-muted-foreground py-8" data-testid="text-chat-empty">
                    {modelStatus === "loaded"
                      ? "Model ready. Send a message or switch to Roundtable mode."
                      : "Load a model to begin."}
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`chat-msg-${i}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.role === "system"
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-[11px]"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatStreaming && streamBuffer && (
                  <div className="flex justify-start" data-testid="chat-streaming">
                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted leading-relaxed">
                      {streamBuffer}
                      <span className="inline-block w-1.5 h-3.5 bg-foreground/60 ml-0.5 animate-pulse align-text-bottom" />
                    </div>
                  </div>
                )}

                {activeLayerMode === "roundtable" && layers.map((layer) =>
                  !layer.isHidden && layer.id !== synthId ? (
                    <div key={layer.id} className="space-y-1" data-testid={`roundtable-layer-${layer.id}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {layer.name}
                        </span>
                        <BlendModeChip mode={layer.blendMode} />
                        <span className="text-[10px] text-muted-foreground">{Math.round(layer.opacity * 100)}%</span>
                      </div>
                      {layer.agents.map((a) => (
                        <AgentChip
                          key={a.id}
                          agent={a}
                          layerId={layer.id}
                          onDelete={callbacks.onDeleteAgent}
                          onPromptChange={callbacks.onAgentPromptChange}
                          onAbort={callbacks.onAbortAgent}
                        />
                      ))}
                    </div>
                  ) : null
                )}

                {activeLayerMode === "roundtable" && (() => {
                  const hyp = layers.find((l) => l.id === synthId);
                  const agent = hyp?.agents[0];
                  if (!agent?.output && agent?.status !== "running") return null;
                  return (
                    <div className="border border-primary/30 rounded-lg p-3 bg-primary/5" data-testid="hypervisor-output">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                          {hyp?.name ?? "Synthesis"} ∑
                        </span>
                        {agent.status === "running" && agent.tokensPerSec > 0 && (
                          <span
                            className="text-[10px] font-mono text-primary/70 tabular-nums"
                            data-testid="badge-tps-synthesis"
                          >
                            {agent.tokensPerSec} t/s
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">
                        {agent.output}
                        {agent.status === "running" && (
                          <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse align-text-bottom" />
                        )}
                      </p>
                    </div>
                  );
                })()}

                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2">
                <Textarea
                  placeholder={
                    modelStatus !== "loaded"
                      ? "Load a model first…"
                      : activeLayerMode === "chat"
                      ? "Send a message…"
                      : "Enter prompt for all agents…"
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                  disabled={modelStatus !== "loaded"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      activeLayerMode === "chat" ? sendChat() : runRoundtable();
                    }
                  }}
                  data-testid="textarea-chat-input"
                />
                <Button
                  onClick={activeLayerMode === "chat" ? sendChat : runRoundtable}
                  disabled={modelStatus !== "loaded" || !chatInput.trim() || chatStreaming}
                  size="icon"
                  className="shrink-0 self-end"
                  data-testid="button-send"
                >
                  {chatStreaming ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT — Background Analysis */}
        <div className="flex flex-col gap-3 min-h-0">
          <Card className="shrink-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold">Background Analysis</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    SIGINT analyst layer · polls every 30s
                  </div>
                </div>
                <Switch
                  checked={bgEnabled}
                  onCheckedChange={setBgEnabled}
                  disabled={modelStatus !== "loaded"}
                  data-testid="toggle-background-analysis"
                />
              </div>
              {bgEnabled && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active — watching KAPPA feed
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Analysis Log
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-3 pb-3 space-y-2">
                {bgLog.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-6" data-testid="text-bg-empty">
                    {bgEnabled ? "Waiting for new KAPPA events…" : "Enable background analysis to start"}
                  </p>
                ) : bgLog.map((entry, i) => (
                  <div key={i} className="border border-border/50 rounded p-2 space-y-1" data-testid={`bg-entry-${i}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(entry.ts).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4">
                        {entry.eventCount} events
                      </Badge>
                    </div>
                    <p className="text-[11px] leading-relaxed text-foreground/80">{entry.summary}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="shrink-0">
            <CardContent className="p-3 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Selected Model</div>
              <div className="text-xs font-medium">{selectedModel.label}</div>
              <div className="text-[10px] text-muted-foreground">{selectedModel.description}</div>
              <div className="flex items-center gap-2 text-[10px]">
                <Badge variant="outline" className="text-[9px]">{selectedModel.sizeLabel}</Badge>
                <Badge variant="outline" className="text-[9px]">{selectedModel.dtype}</Badge>
                {selectedModel.requiresToken && (
                  <Badge variant="outline" className="text-[9px] border-amber-500 text-amber-600">token required</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full max-w-[900px] flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Session History
                <Badge variant="secondary" className="text-xs">{sessions.length}</Badge>
              </SheetTitle>
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  id="import-sessions-json-input"
                  onChange={importSessionsFromJson}
                  data-testid="input-import-sessions-json"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => document.getElementById("import-sessions-json-input")?.click()}
                  data-testid="button-import-sessions-json"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Import JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={exportSelectedSessions}
                  disabled={checkedSessionIds.size === 0}
                  data-testid="button-export-selected-sessions"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Export Selected{checkedSessionIds.size > 0 ? ` (${checkedSessionIds.size})` : ""}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={exportAllSessions}
                  disabled={sessions.length === 0}
                  data-testid="button-export-all-sessions"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  Export ZIP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={exportAllSessionsJson}
                  disabled={sessions.length === 0}
                  data-testid="button-export-all-sessions-json"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Export JSON
                </Button>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-close-history">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search sessions by prompt…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 h-8 text-sm"
                data-testid="input-history-search"
              />
            </div>
          </SheetHeader>

          <div className="flex flex-1 min-h-0">
            {/* Session list */}
            <div className="w-72 border-r border-border flex flex-col min-h-0 shrink-0">
              {sessions.length > 0 && (() => {
                const filtered = sessions.filter((s) =>
                  !historySearch.trim() ||
                  s.prompt.toLowerCase().includes(historySearch.toLowerCase())
                );
                const allChecked = filtered.length > 0 && filtered.every((s) => checkedSessionIds.has(s.id));
                const someChecked = !allChecked && filtered.some((s) => checkedSessionIds.has(s.id));
                const checkedCount = filtered.filter((s) => checkedSessionIds.has(s.id)).length;
                return (
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (allChecked) {
                          setCheckedSessionIds((prev) => {
                            const next = new Set(prev);
                            filtered.forEach((s) => next.delete(s.id));
                            return next;
                          });
                        } else {
                          setCheckedSessionIds((prev) => {
                            const next = new Set(prev);
                            filtered.forEach((s) => next.add(s.id));
                            return next;
                          });
                        }
                      }}
                      className="shrink-0 flex items-center justify-center w-4 h-4 rounded border border-muted-foreground/40 bg-background transition-colors hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label={allChecked ? "Deselect all sessions" : "Select all sessions"}
                      data-testid="checkbox-select-all-sessions"
                    >
                      {allChecked && <Check className="h-2.5 w-2.5 text-primary" />}
                      {someChecked && <div className="w-2 h-0.5 bg-primary rounded-full" />}
                    </button>
                    <span className="text-[10px] text-muted-foreground select-none">
                      {allChecked ? "Deselect all" : "Select all"}{filtered.length !== sessions.length ? ` (${filtered.length} visible)` : ""}
                    </span>
                    {checkedCount > 0 && (
                      <div className="ml-auto flex items-center gap-1">
                        <span
                          className={`text-[10px] select-none transition-colors ${
                            checkedCount === filtered.length
                              ? "bg-primary text-primary-foreground font-semibold px-1.5 py-0.5 rounded-full"
                              : "text-primary font-medium"
                          }`}
                          data-testid="text-sessions-checked-count"
                        >
                          {checkedCount} of {filtered.length} selected
                        </span>
                        {checkedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setCheckedSessionIds(new Set())}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
                            aria-label="Clear selection"
                            data-testid="button-clear-selection"
                          >
                            ×&nbsp;Clear
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8" data-testid="text-history-empty">
                      No sessions yet. Run a roundtable and synthesise to save one.
                    </p>
                  ) : sessions
                    .filter((s) =>
                      !historySearch.trim() ||
                      s.prompt.toLowerCase().includes(historySearch.toLowerCase())
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-start gap-2 rounded border transition-colors ${
                          selectedSession?.id === s.id
                            ? "bg-primary/10 border-primary/20"
                            : "hover:bg-muted/50 border-transparent"
                        }`}
                        data-testid={`session-item-${s.id}`}
                      >
                        <button
                          type="button"
                          onClick={(e) => toggleSessionCheck(s.id, e)}
                          className="shrink-0 mt-2.5 ml-2 flex items-center justify-center w-4 h-4 rounded border border-muted-foreground/40 bg-background transition-colors hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          aria-label={checkedSessionIds.has(s.id) ? "Deselect session" : "Select session"}
                          data-testid={`checkbox-session-${s.id}`}
                        >
                          {checkedSessionIds.has(s.id) && (
                            <Check className="h-2.5 w-2.5 text-primary" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSession(s)}
                          className="flex-1 text-left px-2 py-2.5 space-y-1 min-w-0"
                        >
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {new Date(s.ts).toLocaleString()}
                          </div>
                          <div className="text-xs font-medium line-clamp-2 leading-snug">
                            {s.prompt}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{s.layerOutputs.length} layers</span>
                            <span>·</span>
                            <span>{s.hypervisorSynthesis ? "synthesised" : "no synthesis"}</span>
                          </div>
                        </button>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            </div>

            {/* Session detail */}
            <div className="flex-1 flex flex-col min-h-0">
              {selectedSession ? (
                <>
                  <div className="px-5 py-3 border-b border-border shrink-0 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {new Date(selectedSession.ts).toISOString()}
                      </div>
                      <div className="text-sm font-medium truncate">{selectedSession.prompt}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 shrink-0"
                      onClick={() => exportSession(selectedSession)}
                      data-testid="button-export-session"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Export .md
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 shrink-0"
                      onClick={() => exportSessionAsJson(selectedSession)}
                      data-testid="button-export-session-json"
                    >
                      <FileJson className="h-3 w-3 mr-1" />
                      Export .json
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 shrink-0"
                      onClick={() => saveToMemory(selectedSession)}
                      data-testid="button-save-memory"
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Memory Cortex
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => deleteSession(selectedSession.id)}
                      data-testid="button-delete-session"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="px-5 py-4 space-y-5">
                      {/* Layer outputs */}
                      {selectedSession.layerOutputs.map((layer) => (
                        <div key={layer.layerId} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {layer.layerName}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              blend:{layer.blendMode} · {Math.round(layer.opacity * 100)}%
                            </span>
                          </div>
                          {layer.agents.map((agent, ai) => agent.output ? (
                            <div key={ai} className="border border-border/60 rounded p-3 bg-muted/10 space-y-1">
                              <div className="text-[10px] font-semibold text-primary">{agent.roleLabel}</div>
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">{agent.output}</p>
                              <div className="text-[9px] text-muted-foreground font-mono">{agent.tokenCount}t</div>
                            </div>
                          ) : null)}
                        </div>
                      ))}

                      {/* Hypervisor synthesis */}
                      {selectedSession.hypervisorSynthesis && (
                        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
                          <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">
                            Hypervisor ∑ Synthesis
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedSession.hypervisorSynthesis}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground" data-testid="text-no-session-selected">
                  Select a session from the list to view details
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
