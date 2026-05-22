/**
 * GAZETTE PRESS ROOM — Vision Hypervisor UI
 * Screenshot → score → surgical CSS proposal → tagged rollback log
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera, Cpu, CheckCircle, RotateCcw, Tag, Trash2,
  Eye, EyeOff, ChevronDown, ChevronRight, Play, Pause,
  AlertTriangle, BookOpen, Maximize2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreBlock {
  readability: number;
  satireSharpness: number;
  visualHierarchy: number;
  hookStrength: number;
  composite: number;
  lowestDimension?: string;
}

interface PatchRule {
  selector: string;
  property: string;
  from: string;
  to: string;
  rationale: string;
}

interface GazetteSnapshot {
  id: string;
  createdAt: string;
  version: number;
  status: "snapshot" | "proposed" | "live" | "archived" | "rolled_back";
  tag?: string | null;
  screenshotDesktop?: string | null;
  screenshotMobile?: string | null;
  scores?: ScoreBlock | null;
  visionNotes?: string | null;
  cssPatch?: string | null;
  cssPatchRules?: PatchRule[] | null;
  lowestDimension?: string | null;
  rationale?: string | null;
  generatedBy?: string | null;
  parentId?: string | null;
  appliedAt?: string | null;
  revertedAt?: string | null;
}

interface RefinerStatus {
  autoRunEnabled: boolean;
  isRunning: boolean;
  lastRunAt: string | null;
  cycleCount: number;
  activeVersionId: string | null;
  activeCssLength: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  snapshot:    { label: "snapshot",    color: "bg-gray-100 text-gray-600 border-gray-200" },
  proposed:    { label: "proposed",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  live:        { label: "● live",      color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived:    { label: "archived",    color: "bg-slate-50 text-slate-500 border-slate-200" },
  rolled_back: { label: "rolled back", color: "bg-red-50 text-red-600 border-red-200" },
};

function scoreColor(val: number): string {
  if (val >= 75) return "text-emerald-600";
  if (val >= 55) return "text-amber-600";
  return "text-red-500";
}

function scoreBg(val: number): string {
  if (val >= 75) return "bg-emerald-500";
  if (val >= 55) return "bg-amber-400";
  return "bg-red-400";
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreBg(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${scoreColor(value)}`}>{value}</span>
      <span className="text-[9px] text-gray-300 font-mono w-6">{weight}</span>
    </div>
  );
}

// ─── Screenshot Pane ──────────────────────────────────────────────────────────

function ScreenshotPane({ snap, view }: { snap: GazetteSnapshot; view: "desktop" | "mobile" }) {
  const src = view === "desktop" ? snap.screenshotDesktop : snap.screenshotMobile;
  if (!src) return (
    <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 text-[11px] text-gray-400">
      No screenshot
    </div>
  );
  return (
    <img
      src={src}
      alt={`v${snap.version} ${view}`}
      className="w-full border border-gray-200 dark:border-gray-700 object-top object-cover"
      style={{ maxHeight: view === "desktop" ? 320 : 480 }}
    />
  );
}

// ─── CSS Diff Viewer ──────────────────────────────────────────────────────────

function CssDiff({ rules, rawCss }: { rules?: PatchRule[] | null; rawCss?: string | null }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!rules?.length && !rawCss) return null;

  return (
    <div className="border border-gray-100 dark:border-gray-800 text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">CSS Patch</span>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-[9px] text-gray-400 hover:text-gray-600"
          data-testid="toggle-raw-css"
        >
          {showRaw ? "Show rules" : "Show raw CSS"}
        </button>
      </div>

      {showRaw ? (
        <pre className="p-3 text-[10px] text-emerald-700 dark:text-emerald-400 bg-gray-950 overflow-x-auto whitespace-pre-wrap max-h-40">
          {rawCss}
        </pre>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {rules?.map((r, i) => (
            <div key={i} className="px-3 py-2">
              <div className="text-[10px] text-blue-600 dark:text-blue-400 mb-0.5">{r.selector}</div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{r.property}:</span>
                <span className="line-through text-red-400">{r.from}</span>
                <span className="text-gray-400">→</span>
                <span className="text-emerald-600 dark:text-emerald-400">{r.to}</span>
              </div>
              {r.rationale && (
                <div className="text-[9px] text-gray-400 mt-0.5 italic">{r.rationale}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Version Row ──────────────────────────────────────────────────────────────

function VersionRow({
  snap,
  isActive,
  onApply,
  onRollback,
  onPropose,
  onTag,
  applyLoading,
  proposeLoading,
}: {
  snap: GazetteSnapshot;
  isActive: boolean;
  onApply: (id: string) => void;
  onRollback: (id: string) => void;
  onPropose: (id: string) => void;
  onTag: (id: string, tag: string) => void;
  applyLoading: string | null;
  proposeLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const meta = STATUS_META[snap.status] ?? STATUS_META.snapshot;
  const s = snap.scores as ScoreBlock | null;

  return (
    <div
      data-testid={`version-row-${snap.id}`}
      className={`border-b border-gray-100 dark:border-gray-800 ${isActive ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={12} className="text-gray-400 shrink-0" /> : <ChevronRight size={12} className="text-gray-400 shrink-0" />}
        <span className="text-[10px] font-mono text-gray-400 w-8">v{snap.version}</span>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${meta.color}`}>{meta.label}</span>
        {snap.tag && (
          <span className="text-[9px] font-mono bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5">
            #{snap.tag}
          </span>
        )}
        {s && (
          <span className={`ml-1 text-xs font-mono font-bold ${scoreColor(s.composite)}`}>
            {s.composite}
          </span>
        )}
        {snap.rationale && (
          <span className="text-[10px] text-gray-500 truncate flex-1">{snap.rationale}</span>
        )}
        <span className="ml-auto text-[9px] text-gray-400 font-mono shrink-0">
          {relTime(snap.createdAt)}
        </span>
      </div>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {s && (
            <div className="space-y-1.5 pt-1">
              <ScoreBar label="Readability" value={s.readability} weight="25%" />
              <ScoreBar label="Satire Sharpness" value={s.satireSharpness} weight="30%" />
              <ScoreBar label="Visual Hierarchy" value={s.visualHierarchy} weight="20%" />
              <ScoreBar label="Hook Strength" value={s.hookStrength} weight="25%" />
            </div>
          )}
          {snap.visionNotes && (
            <p className="text-[11px] text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-200 dark:border-gray-700 pl-2">
              {snap.visionNotes}
            </p>
          )}
          <CssDiff rules={snap.cssPatchRules} rawCss={snap.cssPatch} />

          <div className="flex items-center gap-2 flex-wrap">
            {snap.status === "proposed" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                disabled={applyLoading === snap.id}
                onClick={() => onApply(snap.id)}
                data-testid={`apply-btn-${snap.id}`}
              >
                <CheckCircle size={10} />
                {applyLoading === snap.id ? "Applying…" : "Apply"}
              </Button>
            )}
            {(snap.status === "snapshot" || snap.status === "proposed") && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                disabled={proposeLoading === snap.id}
                onClick={() => onPropose(snap.id)}
                data-testid={`propose-btn-${snap.id}`}
              >
                <Cpu size={10} className={proposeLoading === snap.id ? "animate-spin" : ""} />
                {proposeLoading === snap.id ? "Generating…" : "Propose change"}
              </Button>
            )}
            {snap.status === "archived" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] gap-1 text-slate-600 border-slate-200"
                onClick={() => onRollback(snap.id)}
                data-testid={`rollback-btn-${snap.id}`}
              >
                <RotateCcw size={10} />
                Rollback to this
              </Button>
            )}
            {!tagging ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] gap-1 text-gray-400"
                onClick={() => setTagging(true)}
                data-testid={`tag-btn-${snap.id}`}
              >
                <Tag size={9} />
                {snap.tag ? "Retag" : "Tag"}
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      onTag(snap.id, tagInput.trim());
                      setTagging(false);
                      setTagInput("");
                    } else if (e.key === "Escape") {
                      setTagging(false);
                      setTagInput("");
                    }
                  }}
                  placeholder="tag name"
                  className="h-5 text-[10px] font-mono border border-gray-300 dark:border-gray-700 px-1.5 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 outline-none w-24"
                  data-testid={`tag-input-${snap.id}`}
                />
                <span className="text-[9px] text-gray-400">↵ save</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Constitution Panel ───────────────────────────────────────────────────────

function ConstitutionPanel() {
  const [open, setOpen] = useState(false);
  const { data: constitution } = useQuery<any>({ queryKey: ["/api/gazette-refiner/constitution"] });

  return (
    <div className="border border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
        data-testid="toggle-constitution"
      >
        <BookOpen size={11} className="text-gray-400" />
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Constitution v{constitution?.version ?? "…"}</span>
        {open ? <ChevronDown size={10} className="ml-auto text-gray-400" /> : <ChevronRight size={10} className="ml-auto text-gray-400" />}
      </button>
      {open && constitution && (
        <div className="px-3 py-2 space-y-2 text-[10px] font-mono">
          <div>
            <div className="text-gray-400 mb-1">Score Weights</div>
            {Object.entries(constitution.scoreWeights).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{k}</span>
                <span className="text-gray-800 dark:text-gray-200">{(v as number * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-gray-400 mb-1">Max Change Rules</div>
            {Object.entries(constitution.maxChanges).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{k}</span>
                <span className="text-gray-800 dark:text-gray-200">{String(v)}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-gray-400 mb-1">Protected Selectors</div>
            {constitution.protectedKeywords?.map((k: string) => (
              <div key={k} className="text-red-500">— {k}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GazetteRefinerPage() {
  const qc = useQueryClient();
  const [selectedView, setSelectedView] = useState<"desktop" | "mobile">("desktop");
  const [selectedSnap, setSelectedSnap] = useState<GazetteSnapshot | null>(null);
  const [applyLoading, setApplyLoading] = useState<string | null>(null);
  const [proposeLoading, setProposeLoading] = useState<string | null>(null);

  const { data: status } = useQuery<RefinerStatus>({
    queryKey: ["/api/gazette-refiner/status"],
    refetchInterval: 10000,
  });

  const { data: log = [], isLoading: logLoading } = useQuery<GazetteSnapshot[]>({
    queryKey: ["/api/gazette-refiner/log"],
    refetchInterval: 15000,
  });

  const snapshotMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/gazette-refiner/snapshot"),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/log"] });
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/status"] });
      if (data?.id) setSelectedSnap(data);
    },
  });

  const proposeMutation = useMutation({
    mutationFn: (snapshotId: string) =>
      apiRequest("POST", `/api/gazette-refiner/propose/${snapshotId}`),
    onSuccess: (data: any) => {
      setProposeLoading(null);
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/log"] });
      if (data?.id) setSelectedSnap(data);
    },
    onError: () => setProposeLoading(null),
  });

  const applyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/gazette-refiner/apply/${id}`),
    onSuccess: () => {
      setApplyLoading(null);
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/log"] });
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/status"] });
    },
    onError: () => setApplyLoading(null),
  });

  const rollbackMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/gazette-refiner/rollback/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/log"] });
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/status"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/gazette-refiner/clear"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/log"] });
      qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/status"] });
    },
  });

  const tagMutation = useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) =>
      apiRequest("POST", `/api/gazette-refiner/tag/${id}`, { tag }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/log"] }),
  });

  const autoRunMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest("POST", "/api/gazette-refiner/auto-run", { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/gazette-refiner/status"] }),
  });

  const liveVersion = log.find(s => s.status === "live");
  const latestSnap = log.find(s => s.status === "snapshot" || s.status === "proposed");
  const displaySnap = selectedSnap ?? liveVersion ?? log[0] ?? null;
  const displayScores = displaySnap?.scores as ScoreBlock | null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera size={14} className="text-gray-500" />
            <span className="font-black text-xs tracking-widest uppercase text-gray-800 dark:text-gray-200">
              PRESS ROOM
            </span>
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-[10px] text-gray-400">Vision Hypervisor</span>
          </div>
          <div className="text-[9px] text-gray-400 mt-0.5">
            {status?.cycleCount ?? 0} cycles · {log.length} versions · CSS override: {status?.activeCssLength ?? 0} chars
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Auto-run toggle */}
          <button
            onClick={() => autoRunMutation.mutate(!status?.autoRunEnabled)}
            className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 border ${
              status?.autoRunEnabled
                ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30"
                : "border-gray-200 text-gray-500 bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:bg-gray-900"
            }`}
            data-testid="auto-run-toggle"
          >
            {status?.autoRunEnabled ? <Play size={9} /> : <Pause size={9} />}
            AUTO {status?.autoRunEnabled ? "ON" : "OFF"}
          </button>

          {/* Snapshot Now */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1.5"
            disabled={snapshotMutation.isPending || status?.isRunning}
            onClick={() => snapshotMutation.mutate()}
            data-testid="snapshot-now-btn"
          >
            <Camera size={10} className={snapshotMutation.isPending || status?.isRunning ? "animate-pulse" : ""} />
            {snapshotMutation.isPending || status?.isRunning ? "Capturing…" : "Snapshot Now"}
          </Button>

          {/* Clear overrides */}
          {(status?.activeCssLength ?? 0) > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] gap-1 text-gray-400 hover:text-red-500"
              onClick={() => clearMutation.mutate()}
              data-testid="clear-overrides-btn"
            >
              <Trash2 size={9} />
              Clear CSS
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left: Version Log */}
        <div className="w-[420px] shrink-0 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Version Log</span>
            <span className="text-[9px] text-gray-300 font-mono ml-auto">{log.length} entries</span>
          </div>

          {logLoading && (
            <div className="p-4 text-[11px] text-gray-400 text-center">Loading…</div>
          )}

          {log.map(snap => (
            <div key={snap.id} onClick={() => setSelectedSnap(snap)}>
              <VersionRow
                snap={snap}
                isActive={snap.id === liveVersion?.id}
                onApply={id => { setApplyLoading(id); applyMutation.mutate(id); }}
                onRollback={id => rollbackMutation.mutate(id)}
                onPropose={id => { setProposeLoading(id); proposeMutation.mutate(id); }}
                onTag={(id, tag) => tagMutation.mutate({ id, tag })}
                applyLoading={applyLoading}
                proposeLoading={proposeLoading}
              />
            </div>
          ))}

          {!logLoading && log.length === 0 && (
            <div className="p-6 text-center space-y-2">
              <div className="text-[11px] text-gray-400">No snapshots yet.</div>
              <div className="text-[10px] text-gray-300">Hit "Snapshot Now" to begin.</div>
            </div>
          )}

          {/* Constitution panel at bottom */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 mt-2">
            <ConstitutionPanel />
          </div>
        </div>

        {/* Right: Screenshot + Scores */}
        <div className="flex-1 overflow-y-auto">
          {displaySnap ? (
            <div className="p-5 space-y-4">
              {/* Version header */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-gray-500">v{displaySnap.version}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${STATUS_META[displaySnap.status]?.color ?? STATUS_META.snapshot.color}`}>
                  {STATUS_META[displaySnap.status]?.label ?? displaySnap.status}
                </span>
                {displaySnap.tag && (
                  <span className="text-[9px] font-mono bg-violet-50 dark:bg-violet-950/30 text-violet-600 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5">
                    #{displaySnap.tag}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 ml-auto">{relTime(displaySnap.createdAt)}</span>
              </div>

              {/* Score composite */}
              {displayScores && (
                <div className="flex items-start gap-6 p-4 border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="text-center">
                    <div className={`text-4xl font-black ${scoreColor(displayScores.composite)}`}>
                      {displayScores.composite}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">composite</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <ScoreBar label="Readability" value={displayScores.readability} weight="25%" />
                    <ScoreBar label="Satire Sharpness" value={displayScores.satireSharpness} weight="30%" />
                    <ScoreBar label="Visual Hierarchy" value={displayScores.visualHierarchy} weight="20%" />
                    <ScoreBar label="Hook Strength" value={displayScores.hookStrength} weight="25%" />
                  </div>
                </div>
              )}

              {/* Vision notes */}
              {displaySnap.visionNotes && (
                <div className="flex gap-2 text-[11px] text-gray-600 dark:text-gray-400 italic border-l-2 border-amber-200 dark:border-amber-800 pl-3">
                  <Eye size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  {displaySnap.visionNotes}
                </div>
              )}

              {/* CSS patch */}
              {(displaySnap.cssPatchRules?.length || displaySnap.cssPatch) && (
                <>
                  <CssDiff rules={displaySnap.cssPatchRules} rawCss={displaySnap.cssPatch} />
                  {displaySnap.status === "proposed" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        disabled={applyLoading === displaySnap.id}
                        onClick={() => { setApplyLoading(displaySnap.id); applyMutation.mutate(displaySnap.id); }}
                        data-testid="apply-main-btn"
                      >
                        <CheckCircle size={10} />
                        {applyLoading === displaySnap.id ? "Applying…" : "Apply to live"}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Screenshot */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedView("desktop")}
                    className={`text-[10px] px-2 py-0.5 border ${selectedView === "desktop" ? "border-gray-400 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800" : "border-gray-200 text-gray-400"}`}
                    data-testid="view-desktop"
                  >Desktop</button>
                  <button
                    onClick={() => setSelectedView("mobile")}
                    className={`text-[10px] px-2 py-0.5 border ${selectedView === "mobile" ? "border-gray-400 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800" : "border-gray-200 text-gray-400"}`}
                    data-testid="view-mobile"
                  >Mobile</button>
                  <span className="ml-auto text-[9px] text-gray-400">
                    {selectedView === "desktop" ? "1440×900" : "390×844"}
                  </span>
                </div>
                <ScreenshotPane snap={displaySnap} view={selectedView} />
              </div>

              {/* Propose button if snapshot */}
              {(displaySnap.status === "snapshot") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                  disabled={proposeLoading === displaySnap.id}
                  onClick={() => { setProposeLoading(displaySnap.id); proposeMutation.mutate(displaySnap.id); }}
                  data-testid="propose-main-btn"
                >
                  <Cpu size={10} className={proposeLoading === displaySnap.id ? "animate-spin" : ""} />
                  {proposeLoading === displaySnap.id ? "Generating surgical change…" : "Propose CSS change"}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
              <Camera size={32} className="text-gray-200 dark:text-gray-800" />
              <div className="text-sm text-gray-400">No snapshots yet</div>
              <div className="text-[11px] text-gray-300">
                Capture the first screenshot to begin vision analysis and surgical CSS improvement.
              </div>
              <Button
                size="sm"
                onClick={() => snapshotMutation.mutate()}
                disabled={snapshotMutation.isPending}
                data-testid="empty-snapshot-btn"
              >
                <Camera size={12} className="mr-1.5" />
                Take First Snapshot
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
