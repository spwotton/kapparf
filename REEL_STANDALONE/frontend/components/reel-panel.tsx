import { useEffect, useMemo, useRef, useState, useCallback, type ChangeEvent } from "react";
import { useReel, defaultAudio, type AspectRatio, type ReelSession, type RepairReport, type RepairStopReason } from "../hooks/use-reel";
import { useOmega, type FeedPost } from "../hooks/use-omega";
import type { ReelAudio, ReelNarration, ReelMusic } from "../lib/reel-store";
import { toDataUrl } from "../lib/image-utils";
import { bindCorpus } from "../lib/corpus-bind";
import {
  requestBridgeCancel,
  getLastBridgeStatus,
  type BridgePipelineStatus,
} from "../lib/bridge-pipeline-status";
import { IcositetragonArc } from "./icositetragon-arc";

const TTS_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"] as const;

export function ReelPanel() {
  const reel = useReel();
  const [theme, setTheme] = useState("");
  const [beatCount, setBeatCount] = useState(8);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [duration, setDuration] = useState(5);
  const [activeSpoke, setActiveSpoke] = useState<number | null>(null);

  const sess = reel.session;

  // Subscribe to bridge auto-pipeline status so the gallery card for the
  // most recently cancelled bridge reel can show how far the run got
  // (e.g. "cancelled at clips · 3/8 done"). Status lives in module state
  // and persists across view switches but is lost on full page reload —
  // that's intentional, the cancel is an in-session signal.
  const [bridgeStatus, setBridgeStatus] = useState<BridgePipelineStatus>(() => getLastBridgeStatus());
  useEffect(() => {
    const onStatus = (e: Event) => {
      setBridgeStatus((e as CustomEvent<BridgePipelineStatus>).detail);
    };
    window.addEventListener("omega:bridge-reel-status", onStatus);
    return () => window.removeEventListener("omega:bridge-reel-status", onStatus);
  }, []);

  const startOutline = async (feedPrompts: string[], sonataMode: boolean, seedGlyphs?: string[]) => {
    if (!theme.trim()) return;
    try {
      await reel.generateOutline(theme.trim(), beatCount, aspectRatio, duration, feedPrompts, sonataMode, seedGlyphs);
    } catch {
      /* error surfaced via reel.error */
    }
  };

  const startGeneration = async () => {
    if (!sess) return;
    const updated = await reel.generateClips(sess);
    // Only auto-stitch when every selected beat finished cleanly.
    // Partial/canceled runs require an explicit "stitch reel" press in the
    // generation phase so the user opts in to a partial timeline.
    const allDone = updated.clips.length > 0 && updated.clips.every((c) => c.status === "done");
    if (allDone) {
      try {
        await reel.stitch(updated);
      } catch {
        /* error surfaced */
      }
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <section className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-[0.3em] uppercase" style={{ color: "hsl(38 70% 60%)" }}>
              Ω-REEL
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              hall-regularized narrative video
            </span>
          </div>
          <div className="flex gap-1.5">
            {(["outline", "generation", "playback"] as const).map((p) => (
              <button
                key={p}
                onClick={() => reel.setPhase(p)}
                disabled={p !== "outline" && !sess}
                className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border"
                style={{
                  borderColor: reel.phase === p ? "hsl(38 70% 50%)" : "hsl(220 8% 22%)",
                  color: reel.phase === p ? "hsl(38 70% 65%)" : "hsl(220 8% 60%)",
                  background: reel.phase === p ? "hsl(38 30% 12%)" : "transparent",
                  opacity: p !== "outline" && !sess ? 0.4 : 1,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </header>

        {reel.error && (
          <div className="px-3 py-2 text-[10px] font-mono border" style={{ borderColor: "hsl(0 60% 40%)", color: "hsl(0 70% 75%)", background: "hsl(0 30% 8%)" }}>
            {reel.error}
          </div>
        )}

        {reel.phase === "outline" && (
          <OutlinePhase
            theme={theme}
            setTheme={setTheme}
            beatCount={beatCount}
            setBeatCount={setBeatCount}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            duration={duration}
            setDuration={setDuration}
            sess={sess}
            busy={reel.busy}
            activeSpoke={activeSpoke}
            setActiveSpoke={setActiveSpoke}
            onGenerate={startOutline}
            onAdvance={() => reel.setPhase("generation")}
            onRepair={() => sess && reel.repair(sess).catch(() => {})}
            lastRepair={reel.lastRepair}
            onAcceptBridge={(i) => reel.acceptBridge(i).catch(() => {})}
            onRejectBridge={(i) => reel.rejectBridge(i).catch(() => {})}
            onRegenerateBridge={(i) => reel.regenerateBridge(i).catch(() => {})}
          />
        )}

        {reel.phase === "generation" && sess && (
          <GenerationPhase
            sess={sess}
            busy={reel.busy}
            activeSpoke={activeSpoke}
            setActiveSpoke={setActiveSpoke}
            onStart={startGeneration}
            onCancel={() => { requestBridgeCancel(); reel.cancel(); }}
            onStitch={() => reel.stitch(sess).catch(() => {})}
            onResume={() => reel.resumePipeline(sess).catch(() => {})}
          />
        )}

        {reel.phase === "playback" && sess && (
          <PlaybackPhase
            sess={sess}
            busy={reel.busy}
            onUpdateAudio={(patch) => reel.updateAudio(sess, patch)}
            onScore={() => reel.score(sess).catch(() => {})}
            onDraftNarration={(overwrite) => reel.draftNarration(sess, overwrite).catch(() => {})}
            onUpdateCover={(atSeconds) => reel.updateCover(sess, atSeconds)}
          />
        )}
      </section>

      <aside className="hidden lg:flex w-[300px] flex-shrink-0 flex-col gap-3 p-4 border-l border-border overflow-y-auto"
        style={{ background: "hsl(220 10% 4.5%)" }}
      >
        <h3 className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">Reel gallery</h3>
        {reel.gallery.length === 0 && (
          <span className="text-[9px] font-mono text-muted-foreground/60">no reels yet</span>
        )}
        {reel.gallery.map((g) => (
          <div
            key={g.id}
            role="button"
            tabIndex={0}
            onClick={() => reel.openSession(g)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reel.openSession(g); } }}
            className="text-left px-2 py-2 border text-[9px] font-mono cursor-pointer"
            style={{
              borderColor: sess?.id === g.id ? "hsl(38 70% 50%)" : "hsl(220 8% 18%)",
              background: sess?.id === g.id ? "hsl(38 25% 10%)" : "transparent",
            }}
            data-testid={`reel-gallery-${g.id}`}
          >
            {g.coverThumbnail && (
              <img
                src={g.coverThumbnail}
                alt="cover"
                className="w-full h-16 object-cover mb-1 border"
                style={{ borderColor: "hsl(220 8% 18%)" }}
                data-testid={`reel-gallery-cover-${g.id}`}
              />
            )}
            <div className="flex items-center justify-between">
              <span style={{ color: "hsl(38 60% 65%)" }}>{g.title}</span>
              <span className="text-muted-foreground">{g.beats.length}b</span>
            </div>
            <div className="text-[8px] text-muted-foreground/70 truncate">{g.theme}</div>
            <div className="flex gap-1 mt-1">
              {g.finalVideo && <span style={{ color: "hsl(140 60% 55%)" }}>● stitched</span>}
              {g.finalVideo && (
                <FrameSizeBadge
                  resolution={g.finalResolution}
                  aspectRatio={g.aspectRatio}
                  testId={`reel-gallery-frame-size-${g.id}`}
                />
              )}
              {g.pipelineState?.kind === "cancelled" && (
                <span style={{ color: "hsl(38 70% 60%)" }}>● cancelled@{g.pipelineState.stage}</span>
              )}
              {g.pipelineState?.kind === "error" && (
                <span style={{ color: "hsl(0 70% 65%)" }}>● error@{g.pipelineState.stage}</span>
              )}
              <span className="text-muted-foreground/60">κ_H={g.coherence.kappaHall.toFixed(1)}</span>
            </div>
            {bridgeStatus.kind === "cancelled" && bridgeStatus.reelId === g.id && (
              <div
                className="text-[8px] mt-1"
                style={{ color: "hsl(36 60% 60%)" }}
                data-testid={`reel-gallery-cancelled-${g.id}`}
              >
                cancelled at {bridgeStatus.stage}
                {bridgeStatus.clipsTotal > 0 && (
                  <> · {bridgeStatus.clipsDone}/{bridgeStatus.clipsTotal} done</>
                )}
              </div>
            )}
            {g.pipelineState && (g.pipelineState.kind === "cancelled" || g.pipelineState.kind === "error") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reel.resumePipeline(g).catch(() => { /* surfaced via reel.error */ });
                }}
                className="mt-1 w-full px-1.5 py-1 text-[9px] font-mono uppercase tracking-wider border"
                style={{ borderColor: "hsl(38 70% 45%)", color: "hsl(38 80% 75%)", background: "hsl(38 25% 12%)" }}
                data-testid={`reel-gallery-resume-${g.id}`}
                title={`resume bridge pipeline from ${g.pipelineState.stage}`}
              >
                ↻ resume from {g.pipelineState.stage}
              </button>
            )}
          </div>
        ))}
        {reel.gallery.length > 0 && sess && (
          <button
            onClick={() => reel.removeFromGallery(sess.id).then(() => reel.reset())}
            className="text-[9px] font-mono px-2 py-1 border text-muted-foreground"
            style={{ borderColor: "hsl(0 30% 30%)" }}
          >
            delete current
          </button>
        )}
        <button
          onClick={reel.reset}
          className="text-[9px] font-mono px-2 py-1 border text-muted-foreground"
          style={{ borderColor: "hsl(220 8% 22%)" }}
        >
          new reel
        </button>
      </aside>
    </div>
  );
}

function FeedContextPicker({ selected, onToggle, posts }: {
  selected: Set<string>;
  onToggle: (id: string, prompt: string) => void;
  posts: FeedPost[];
}) {
  const withImages = posts.filter((p) => p.image).slice(0, 12);
  if (withImages.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Feed anchors</label>
        {selected.size > 0 && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 border"
            style={{ borderColor: "hsl(38 60% 40%)", color: "hsl(38 70% 65%)", background: "hsl(38 25% 8%)" }}>
            {selected.size} selected
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
        {withImages.map((p) => {
          const active = selected.has(p.id);
          const anchor = bindCorpus(p.cellId, p.generation);
          const seedLabel = `Ω·${anchor.bh53Id}`;
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id, p.imagePrompt)}
              className="relative aspect-square overflow-hidden border transition-all"
              style={{
                borderColor: active ? "hsl(38 70% 55%)" : "hsl(220 8% 22%)",
                boxShadow: active ? "0 0 0 1px hsl(38 60% 45%)" : "none",
              }}
              title={`${seedLabel} · ${anchor.gene.emoji} ${anchor.gene.name} ${anchor.gene.frequency_hz.toFixed(0)}Hz\n${p.imagePrompt.slice(0, 80)}`}
            >
              <img src={p.image?.startsWith("data:") ? p.image : toDataUrl(p.image)} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 px-0.5 py-0.5" style={{ background: "rgba(0,0,0,0.72)", pointerEvents: "none" }}>
                <span className="text-[6px] font-mono block truncate" style={{ color: "hsl(38 70% 65%)" }}>{seedLabel}</span>
              </div>
              {active && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.45)" }}>
                  <span className="text-[14px]" style={{ color: "hsl(38 80% 70%)" }}>✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── ConceptImaginator ─────────────────────────────────────────────────────────
// AI creative director that imagines 4 distinct reel concept directions from
// the current feed anchors. Each card is selectable and auto-populates the
// theme field. Individual cards can be iteratively refined with a second LLM
// pass. This eliminates the "human stupidity factor" in concept generation.

interface ConceptDirection {
  id: string;
  title: string;
  direction: string;
  visualTone: string;
  emotionalArc: string;
  refinedPrompt: string;
  hue: number;
}

const BASE_URL_REEL = (import.meta.env.BASE_URL as string) || "/";
function reelApiUrl(path: string) {
  const base = BASE_URL_REEL.endsWith("/") ? BASE_URL_REEL : BASE_URL_REEL + "/";
  return `${base}api/${path}`;
}

function ConceptImaginator({
  anchors,
  beatCount,
  onSelect,
  selectedPrompt,
}: {
  anchors: Array<{ text: string; imagePrompt: string }>;
  beatCount: number;
  onSelect: (prompt: string) => void;
  selectedPrompt: string;
}) {
  const [concepts,   setConcepts]   = useState<ConceptDirection[]>([]);
  const [busy,       setBusy]       = useState(false);
  const [refining,   setRefining]   = useState<Set<string>>(new Set());
  const [error,      setError]      = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const imagine = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(reelApiUrl("reel/imagine"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anchors, beatCount }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { concepts: ConceptDirection[] };
      setConcepts(data.concepts ?? []);
      // Auto-select the first concept so the theme box is immediately populated.
      // User can still click any other card to swap, or edit the text manually.
      const first = data.concepts?.[0];
      if (first) {
        setSelectedId(first.id);
        onSelect(first.refinedPrompt);
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      setError((e as Error).message.slice(0, 120));
    } finally {
      setBusy(false);
    }
  }, [anchors, beatCount]);

  const refineOne = useCallback(async (concept: ConceptDirection) => {
    setRefining((prev) => new Set(prev).add(concept.id));
    try {
      const res = await fetch(reelApiUrl("reel/imagine/refine"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, anchors, beatCount }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { concept: ConceptDirection };
      setConcepts((prev) => prev.map((c) => (c.id === concept.id ? data.concept : c)));
      // If this card is already selected, update the theme too
      if (selectedId === concept.id) {
        onSelect(data.concept.refinedPrompt);
      }
    } catch { /* silent — card stays unchanged */ }
    finally {
      setRefining((prev) => { const next = new Set(prev); next.delete(concept.id); return next; });
    }
  }, [anchors, beatCount, selectedId, onSelect]);

  const selectConcept = useCallback((c: ConceptDirection) => {
    setSelectedId(c.id);
    onSelect(c.refinedPrompt);
  }, [onSelect]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          AI concept imagination
        </span>
        <button
          onClick={imagine}
          disabled={busy}
          className="px-2.5 py-1 text-[9px] font-mono border transition-opacity disabled:opacity-40"
          style={{ borderColor: "hsl(280 55% 45%)", color: "hsl(280 65% 75%)", background: busy ? "hsl(280 25% 10%)" : "transparent" }}
        >
          {busy ? "imagining…" : concepts.length === 0 ? "✦ imagine directions" : "↺ reimagine all"}
        </button>
        {error && (
          <span className="text-[8px] font-mono" style={{ color: "hsl(0 70% 65%)" }}>⚠ {error}</span>
        )}
      </div>

      {concepts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {concepts.map((c) => {
            const isSelected = selectedId === c.id;
            const isUsed = isSelected && selectedPrompt === c.refinedPrompt;
            const isRefining = refining.has(c.id);
            return (
              <div
                key={c.id}
                className="flex flex-col p-2.5 border transition-all"
                style={{
                  borderColor: isUsed ? `hsl(${c.hue} 65% 45%)` : `hsl(${c.hue} 30% 22%)`,
                  background: isUsed ? `hsl(${c.hue} 20% 7%)` : "hsl(220 8% 4%)",
                  boxShadow: isUsed ? `0 0 0 1px hsl(${c.hue} 55% 35%)` : "none",
                }}
              >
                {/* Accent bar */}
                <div className="h-0.5 mb-2 -mx-2.5 -mt-2.5 rounded-t"
                  style={{ background: `hsl(${c.hue} 65% 45%)` }} />

                {/* Title */}
                <div className="text-[10px] font-mono font-semibold mb-1"
                  style={{ color: `hsl(${c.hue} 70% 70%)` }}>
                  {c.title}
                </div>

                {/* Direction prose */}
                <p className="text-[9px] font-mono leading-relaxed mb-2 flex-1"
                  style={{ color: "hsl(220 8% 60%)" }}>
                  {c.direction}
                </p>

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <div className="text-[7px] font-mono px-1.5 py-0.5 border"
                    style={{ borderColor: `hsl(${c.hue} 30% 28%)`, color: `hsl(${c.hue} 50% 60%)` }}>
                    {c.emotionalArc}
                  </div>
                  <div className="text-[7px] font-mono px-1.5 py-0.5 border flex-1"
                    style={{ borderColor: "hsl(220 8% 18%)", color: "hsl(220 8% 45%)" }}>
                    {c.visualTone.slice(0, 60)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => selectConcept(c)}
                    className="text-[9px] font-mono px-2 py-1 border flex-1 transition-colors"
                    style={{
                      borderColor: isUsed ? `hsl(${c.hue} 65% 45%)` : `hsl(${c.hue} 40% 32%)`,
                      color: isUsed ? `hsl(${c.hue} 80% 75%)` : `hsl(${c.hue} 60% 60%)`,
                      background: isUsed ? `hsl(${c.hue} 30% 12%)` : "transparent",
                    }}
                  >
                    {isUsed ? "✓ selected" : "use this →"}
                  </button>
                  <button
                    onClick={() => refineOne(c)}
                    disabled={isRefining}
                    title="AI refines this concept into a sharper, more specific version"
                    className="text-[8px] font-mono px-1.5 py-1 border transition-colors disabled:opacity-40"
                    style={{ borderColor: "hsl(220 8% 22%)", color: "hsl(220 8% 50%)" }}
                  >
                    {isRefining ? "…" : "↺ refine"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {concepts.length === 0 && !busy && (
        <div className="text-[8px] font-mono px-3 py-2 border" style={{ borderColor: "hsl(220 8% 14%)", color: "hsl(220 8% 38%)" }}>
          {anchors.length > 0
            ? `${anchors.length} feed anchor${anchors.length > 1 ? "s" : ""} selected — hit ✦ imagine to generate 4 directions`
            : "select feed anchors or hit ✦ imagine for free-form directions"}
        </div>
      )}
    </div>
  );
}

function OutlinePhase({
  theme, setTheme, beatCount, setBeatCount, aspectRatio, setAspectRatio,
  duration, setDuration, sess, busy, activeSpoke, setActiveSpoke, onGenerate, onAdvance,
  onRepair, lastRepair,
  onAcceptBridge, onRejectBridge, onRegenerateBridge,
}: {
  theme: string; setTheme: (s: string) => void;
  beatCount: number; setBeatCount: (n: number) => void;
  aspectRatio: AspectRatio; setAspectRatio: (a: AspectRatio) => void;
  duration: number; setDuration: (d: number) => void;
  sess: ReelSession | null; busy: string;
  activeSpoke: number | null; setActiveSpoke: (s: number | null) => void;
  onGenerate: (feedPrompts: string[], sonataMode: boolean, seedGlyphs?: string[]) => void; onAdvance: () => void;
  onRepair: () => void; lastRepair: RepairReport | null;
  onAcceptBridge: (beatIdx: number) => void;
  onRejectBridge: (beatIdx: number) => void;
  onRegenerateBridge: (beatIdx: number) => void;
}) {
  const omega = useOmega();
  const [selectedFeed, setSelectedFeed] = useState<Map<string, string>>(new Map()); // id → prompt
  const [sonataMode, setSonataMode] = useState(false);
  const selectedIds = new Set(selectedFeed.keys());

  const toggleFeedPost = (id: string, prompt: string) => {
    setSelectedFeed((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, prompt);
      return next;
    });
  };

  // Build the anchor list that ConceptImaginator and the outline call both use.
  // When feed posts are selected, use their text + imagePrompt. Otherwise pass
  // the most-recent 4 posts so the AI still has organism context.
  const feedAnchors = useMemo(() => {
    const posts = omega.feed;
    if (selectedFeed.size > 0) {
      return [...selectedFeed.keys()]
        .map((id) => posts.find((p) => p.id === id))
        .filter(Boolean)
        .map((p) => ({ text: p!.text, imagePrompt: p!.imagePrompt }));
    }
    return posts.slice(-4).map((p) => ({ text: p.text, imagePrompt: p.imagePrompt }));
  }, [selectedFeed, omega.feed]);

  const feedSeedGlyphs = useMemo(() => {
    const posts = omega.feed;
    const src: FeedPost[] = selectedFeed.size > 0
      ? [...selectedFeed.keys()].map((id) => posts.find((p) => p.id === id)).filter(Boolean) as FeedPost[]
      : posts.slice(-4);
    return src.map((p) => {
      const a = bindCorpus(p.cellId, p.generation);
      return `Ω·${a.bh53Id} (${a.gene.emoji} ${a.gene.name} ${a.gene.frequency_hz.toFixed(0)}Hz) — ${a.corpus.t.slice(0, 60)}`;
    });
  }, [selectedFeed, omega.feed]);

  const activeBeat = sess && activeSpoke !== null ? sess.beats.find((b) => b.spoke === activeSpoke) : null;
  return (
    <div className="grid lg:grid-cols-[1fr_auto] gap-4">
      <div className="flex flex-col gap-3">

        {/* ── Feed anchor picker ───────────────────────────────────── */}
        <FeedContextPicker
          selected={selectedIds}
          onToggle={toggleFeedPost}
          posts={omega.feed}
        />

        {/* ── AI concept imagination layer ─────────────────────────── */}
        <ConceptImaginator
          anchors={feedAnchors}
          beatCount={beatCount}
          onSelect={setTheme}
          selectedPrompt={theme}
        />

        {/* ── Manual theme override ─────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Theme / concept {theme.trim() ? <span style={{ color: "hsl(142 55% 55%)" }}>✓</span> : null}
          </label>
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            rows={2}
            placeholder="A river that remembers being a glacier…"
            className="px-3 py-2 bg-transparent border border-border text-foreground text-sm font-mono"
            data-testid="reel-theme"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={`Beats: ${beatCount}/24`}>
            <input type="range" min={3} max={24} value={beatCount}
              onChange={(e) => setBeatCount(Number(e.target.value))} className="w-full"
              data-testid="reel-beat-count" />
          </Field>
          <Field label="Aspect">
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full bg-transparent border border-border px-2 py-2 text-[11px] font-mono min-h-[36px]">
              <option value="9:16">9:16 vertical</option>
              <option value="16:9">16:9 landscape</option>
            </select>
          </Field>
          <Field label={`Per-clip: ${duration}s`}>
            <input type="range" min={4} max={8} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
          </Field>
        </div>

        {/* ── Sonata arc structure toggle ────────────────────────── */}
        <button
          onClick={() => setSonataMode((v) => !v)}
          className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider border self-start"
          style={{
            borderColor: sonataMode ? "hsl(265 55% 55%)" : "hsl(220 8% 22%)",
            background: sonataMode ? "hsl(265 30% 14%)" : "transparent",
            color: sonataMode ? "hsl(265 70% 80%)" : "hsl(220 8% 48%)",
          }}
          title="Sonata form: Exposition → Development → Recapitulation arc structure"
        >
          {sonataMode ? "♩ sonata arc: on" : "♩ sonata arc: off"}
        </button>

        <button
          onClick={() => onGenerate([...selectedFeed.values()], sonataMode, feedSeedGlyphs)}
          disabled={busy !== "idle" || !theme.trim()}
          className="px-4 py-3 sm:py-2 text-[11px] font-mono uppercase tracking-[0.2em] border self-start min-h-[44px] sm:min-h-0"
          style={{
            background: busy === "outline" ? "hsl(38 25% 12%)" : "hsl(38 50% 18%)",
            borderColor: "hsl(38 70% 45%)",
            color: "hsl(38 80% 75%)",
            opacity: busy !== "idle" || !theme.trim() ? 0.5 : 1,
          }}
          data-testid="reel-generate-arc"
        >
          {busy === "outline" ? "generating arc..." : selectedFeed.size > 0 ? `generate arc · ${selectedFeed.size} feed anchors` : "generate arc"}
        </button>
        {!theme.trim() && busy === "idle" && (
          <span className="text-[8px] font-mono" style={{ color: "hsl(38 50% 45%)" }}>
            ↑ use ✦ imagine or type a theme to enable
          </span>
        )}

        {sess && (
          <>
            <CoherencePanel sess={sess} />
            <RepairControls sess={sess} busy={busy} onRepair={onRepair} lastRepair={lastRepair} />
            <BridgeReviewList
              sess={sess}
              busy={busy}
              onAccept={onAcceptBridge}
              onReject={onRejectBridge}
              onRegenerate={onRegenerateBridge}
            />
          </>
        )}

        {activeBeat && (
          <div className="px-3 py-2 border border-border text-[10px] font-mono">
            <div className="flex justify-between mb-1">
              <span style={{ color: "hsl(38 70% 60%)" }}>spoke {activeBeat.index}/24</span>
              <div className="flex items-center gap-2">
                {activeBeat.sonataSection && (
                  <span className="px-1 text-[8px] uppercase tracking-wider" style={{
                    background: activeBeat.sonataSection === "exposition" ? "hsl(220 40% 18%)"
                      : activeBeat.sonataSection === "development" ? "hsl(28 40% 18%)"
                      : "hsl(180 35% 16%)",
                    color: activeBeat.sonataSection === "exposition" ? "hsl(220 70% 70%)"
                      : activeBeat.sonataSection === "development" ? "hsl(28 70% 70%)"
                      : "hsl(180 60% 65%)",
                  }}>
                    {activeBeat.sonataSection === "exposition" ? "E" : activeBeat.sonataSection === "development" ? "D" : "R"}
                    {" "}{activeBeat.sonataSection}
                  </span>
                )}
                <span className="text-muted-foreground">Ψ={activeBeat.psiTarget.toFixed(2)} (A={activeBeat.A.toFixed(2)}, N={activeBeat.N.toFixed(2)})</span>
              </div>
            </div>
            <div className="text-foreground/80 mb-1">{activeBeat.visualPrompt}</div>
            <div className="text-[8px] text-muted-foreground/70">σ={activeBeat.sigma} γ={activeBeat.gamma.toFixed(2)} φ={activeBeat.phi.toFixed(2)}</div>
          </div>
        )}

        {sess && (
          <button
            onClick={onAdvance}
            className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider border self-start"
            style={{ borderColor: "hsl(168 50% 35%)", color: "hsl(168 50% 70%)" }}
          >
            → continue to generation
          </button>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <IcositetragonArc beats={sess?.beats ?? []} clips={sess?.clips} activeIndex={activeSpoke} onSelect={setActiveSpoke} size={340} />
        <span className="text-[8px] font-mono text-muted-foreground/60">spokes glow gold near Ψ=1, red when imbalanced · click to inspect</span>
      </div>
    </div>
  );
}

function CoherencePanel({ sess }: { sess: ReelSession }) {
  const psiAvg = sess.beats.reduce((s, b) => s + b.psiTarget, 0) / Math.max(1, sess.beats.length);
  const { kappaMax, eta } = sess.coherence;
  const okHall = sess.coherence.kappaHall <= kappaMax;
  return (
    <div className="px-3 py-2 border border-border text-[10px] font-mono space-y-1">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Narrative κ(G)</span>
        <span>{sess.coherence.kappa.toFixed(2)}</span>
      </div>
      <div className="flex justify-between" style={{ color: okHall ? "hsl(140 60% 65%)" : "hsl(0 70% 65%)" }}>
        <span>Hall κ(G + {eta}·I)</span>
        <span>{sess.coherence.kappaHall.toFixed(2)} {okHall ? "≤" : ">"} {kappaMax}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Ψ avg target</span>
        <span>{psiAvg.toFixed(3)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Bridges needed</span>
        <span>{sess.coherence.bridges.length}</span>
      </div>
      <div className="flex justify-between" style={{ color: "hsl(38 60% 65%)" }}>
        <span>Observer presence (V₀.₀₂)</span>
        <span>{sess.coherence.observerPresence.toFixed(2)}</span>
      </div>
    </div>
  );
}

function GenerationPhase({
  sess, busy, activeSpoke, setActiveSpoke, onStart, onCancel, onStitch, onResume,
}: {
  sess: ReelSession; busy: string;
  activeSpoke: number | null; setActiveSpoke: (s: number | null) => void;
  onStart: () => void; onCancel: () => void; onStitch: () => void;
  onResume: () => void;
}) {
  const done = sess.clips.filter((c) => c.status === "done").length;
  const errored = sess.clips.filter((c) => c.status === "error").length;
  const running = sess.clips.filter((c) => c.status === "running").length;
  const pending = sess.clips.filter((c) => c.status === "pending").length;
  const psiCurve = useMemo(
    () => sess.clips.map((c, i) => c.psiScore?.psi ?? sess.beats[i]?.psiTarget ?? 1),
    [sess.clips, sess.beats],
  );
  const continuityPairs = useMemo(() => {
    const out: Array<{ from: number; score: number }> = [];
    for (let i = 1; i < sess.clips.length; i++) {
      const score = sess.clips[i].continuity?.continuityScore;
      if (typeof score === "number") out.push({ from: i - 1, score });
    }
    return out;
  }, [sess.clips]);
  const bridgeCount = sess.coherence.bridges.length;

  return (
    <div className="grid lg:grid-cols-[1fr_auto] gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <button
            onClick={onStart}
            disabled={busy === "generating"}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border"
            style={{ borderColor: "hsl(38 70% 45%)", color: "hsl(38 80% 75%)", background: "hsl(38 30% 14%)" }}
            data-testid="reel-start-generation"
          >
            {busy === "generating" ? `generating ${done + 1}/${sess.beats.length}...` : pending === 0 && done > 0 ? "regenerate" : "start beat-by-beat"}
          </button>
          {busy === "generating" && (
            <button onClick={onCancel} className="px-3 py-1.5 text-[10px] font-mono uppercase border"
              style={{ borderColor: "hsl(0 50% 40%)", color: "hsl(0 70% 70%)" }}>
              cancel
            </button>
          )}
          {done > 0 && busy !== "generating" && (
            <button onClick={onStitch} disabled={busy === "stitching"}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border"
              style={{ borderColor: "hsl(168 50% 35%)", color: "hsl(168 50% 75%)" }}
              data-testid="reel-stitch">
              {busy === "stitching" ? "stitching..." : "stitch reel"}
            </button>
          )}
          {sess.pipelineState && (sess.pipelineState.kind === "cancelled" || sess.pipelineState.kind === "error") && busy === "idle" && (
            <button
              onClick={onResume}
              className="px-3 py-1.5 text-[10px] font-mono uppercase border"
              style={{ borderColor: "hsl(38 70% 45%)", color: "hsl(38 80% 75%)", background: "hsl(38 30% 14%)" }}
              data-testid="reel-resume-pipeline"
              title={`resume bridge pipeline from ${sess.pipelineState.stage}`}
            >
              ↻ resume bridge ({sess.pipelineState.stage})
            </button>
          )}
          <span className="text-[9px] font-mono text-muted-foreground ml-auto">
            ✓{done} ↻{running} …{pending} ✗{errored}
          </span>
        </div>

        <PsiChart values={psiCurve} />

        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto">
          {sess.beats.map((b, i) => {
            const c = sess.clips[i];
            const isActive = activeSpoke === b.spoke;
            const psi = c.psiScore?.psi ?? b.psiTarget;
            const tone = c.status === "done" ? "hsl(140 50% 50%)"
              : c.status === "running" ? "hsl(180 70% 55%)"
              : c.status === "error" ? "hsl(0 70% 55%)"
              : "hsl(220 8% 30%)";
            const cont = c.continuity?.continuityScore;
            return (
              <div
                key={i}
                onClick={() => setActiveSpoke(b.spoke)}
                className="px-2 py-1.5 border text-[10px] font-mono cursor-pointer"
                style={{ borderColor: isActive ? "hsl(38 70% 50%)" : tone, opacity: c.status === "pending" ? 0.7 : 1 }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: tone, width: 18 }}>{b.index}</span>
                  <span className="flex-1 truncate text-foreground/80">{b.visualPrompt}</span>
                  <span className="text-muted-foreground">Ψ={psi.toFixed(2)}</span>
                  {cont !== undefined && (
                    <span style={{ color: cont < 0.7 ? "hsl(0 70% 65%)" : "hsl(140 50% 60%)" }}>
                      κ-cont {cont.toFixed(2)}
                    </span>
                  )}
                </div>
                {c.video && (
                  <video
                    src={`data:${c.videoMimeType ?? "video/mp4"};base64,${c.video}`}
                    className="w-32 h-auto mt-1 border border-border"
                    muted
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                  />
                )}
                {c.error && <div className="text-[8px] mt-0.5" style={{ color: "hsl(0 70% 70%)" }}>{c.error.slice(0, 120)}</div>}
              </div>
            );
          })}
        </div>

        {continuityPairs.length > 0 && (
          <div className="text-[9px] font-mono text-muted-foreground">
            continuity pairs: {continuityPairs.map((p, i) => (
              <span key={i} style={{ color: p.score < 0.7 ? "hsl(0 70% 65%)" : "hsl(140 50% 60%)" }}>
                {p.from + 1}→{p.from + 2}:{p.score.toFixed(2)}{i < continuityPairs.length - 1 ? "  " : ""}
              </span>
            ))}
            {bridgeCount > 0 && <span className="ml-2" style={{ color: "hsl(38 70% 60%)" }}>· {bridgeCount} bridge frame{bridgeCount === 1 ? "" : "s"} flagged</span>}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <IcositetragonArc beats={sess.beats} clips={sess.clips} activeIndex={activeSpoke} onSelect={setActiveSpoke} size={340} />
        <CoherencePanel sess={sess} />
      </div>
    </div>
  );
}

function PsiChart({ values }: { values: number[] }) {
  const w = 320, h = 50, pad = 4;
  const max = Math.max(1.5, ...values);
  const min = Math.min(0.5, ...values);
  const range = Math.max(0.01, max - min);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
      <line x1={0} x2={w} y1={(h - pad) - ((1 - min) / range) * (h - 2 * pad)} y2={(h - pad) - ((1 - min) / range) * (h - 2 * pad)} stroke="hsl(38 30% 35%)" strokeWidth={0.5} strokeDasharray="2 2" />
      <polyline
        fill="none"
        stroke="hsl(38 70% 60%)"
        strokeWidth={1.5}
        points={values.map((v, i) => {
          const x = pad + (i / Math.max(1, values.length - 1)) * (w - 2 * pad);
          const y = (h - pad) - ((v - min) / range) * (h - 2 * pad);
          return `${x},${y}`;
        }).join(" ")}
      />
      {values.map((v, i) => {
        const x = pad + (i / Math.max(1, values.length - 1)) * (w - 2 * pad);
        const y = (h - pad) - ((v - min) / range) * (h - 2 * pad);
        return <circle key={i} cx={x} cy={y} r={2} fill="hsl(38 80% 70%)" />;
      })}
    </svg>
  );
}

function PlaybackPhase({
  sess, busy, onUpdateAudio, onScore, onDraftNarration, onUpdateCover,
}: {
  sess: ReelSession;
  busy: string;
  onUpdateAudio: (patch: Partial<ReelAudio>) => Promise<ReelSession>;
  onScore: () => void;
  onDraftNarration: (overwrite: boolean) => void;
  onUpdateCover: (atSeconds: number | null) => Promise<ReelSession>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [coverBusy, setCoverBusy] = useState<"idle" | "set" | "reset">("idle");
  if (!sess.finalVideo) {
    return <div className="text-[10px] font-mono text-muted-foreground">stitch the reel from the generation phase to play it back.</div>;
  }
  // Use the scored (mixed-audio) variant only when both available AND the
  // user has the audio toggle enabled. Toggling off reverts playback to the
  // silent stitched video.
  const hasScored = Boolean(sess.audio?.scoredVideo);
  const useScored = hasScored && (sess.audio?.enabled ?? true);
  const playableMime = useScored ? (sess.audio?.scoredMime ?? "video/mp4") : (sess.finalMime ?? "video/mp4");
  const playableData = useScored ? sess.audio!.scoredVideo! : sess.finalVideo;
  const src = `data:${playableMime};base64,${playableData}`;
  const aspectClass = sess.aspectRatio === "9:16"
    ? "aspect-[9/16] max-w-[320px]"
    : "aspect-video max-w-[640px]";
  const psiAvg = sess.clips.reduce((s, c) => s + (c.psiScore?.psi ?? 0), 0) / Math.max(1, sess.clips.filter((c) => c.psiScore).length);
  const fileExt = playableMime.includes("webm") ? "webm" : "mp4";
  return (
    <div className="grid lg:grid-cols-[auto_1fr] gap-4 items-start">
      <div className="flex flex-col gap-2">
        <div className={`mx-auto w-full ${aspectClass} bg-black border border-border`}>
          <video
            ref={videoRef}
            key={useScored ? "scored" : "silent"}
            src={src}
            controls
            autoPlay
            loop
            className="w-full h-full"
            data-testid="reel-final-video"
          />
        </div>
        <div className="flex items-center justify-center">
          <FrameSizeBadge
            resolution={sess.finalResolution}
            aspectRatio={sess.aspectRatio}
            testId="reel-playback-frame-size"
          />
        </div>
        <CoverPicker
          sess={sess}
          coverBusy={coverBusy}
          disabled={busy !== "idle"}
          onUseCurrentFrame={async () => {
            const v = videoRef.current;
            if (!v) return;
            const t = Number.isFinite(v.currentTime) ? v.currentTime : 0;
            setCoverBusy("set");
            try { await onUpdateCover(t); } finally { setCoverBusy("idle"); }
          }}
          onResetToFirstFrame={async () => {
            setCoverBusy("reset");
            try { await onUpdateCover(0); } finally { setCoverBusy("idle"); }
          }}
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="px-3 py-2 border border-border text-[10px] font-mono space-y-1">
          <div className="text-[11px]" style={{ color: "hsl(38 70% 65%)" }}>{sess.title}</div>
          <div className="text-muted-foreground">{sess.theme}</div>
          <div className="flex justify-between"><span>κ(G_H)</span><span>{sess.coherence.kappaHall.toFixed(2)} / {sess.coherence.kappaMax}</span></div>
          <div className="flex justify-between"><span>Ψ realised avg</span><span>{psiAvg.toFixed(3)}</span></div>
          <div className="flex justify-between" style={{ color: "hsl(38 60% 65%)" }}>
            <span>Observer presence (0.02)</span>
            <span>{sess.coherence.observerPresence.toFixed(2)} held</span>
          </div>
          <ObserverGauge value={sess.coherence.observerPresence} />
          {hasScored && (
            <div className="flex justify-between pt-1" style={{ color: "hsl(168 60% 65%)" }}>
              <span>Audio mix</span>
              <span>{useScored ? `narration + ${sess.audio?.music ? "music" : "no music"}` : "muted (silent stitch)"}</span>
            </div>
          )}
        </div>
        {hasScored && (
          <button
            type="button"
            onClick={() => onUpdateAudio({ enabled: !(sess.audio?.enabled ?? true) })}
            className="self-start px-3 py-2 text-[10px] font-mono uppercase tracking-wider border"
            style={{
              borderColor: useScored ? "hsl(168 50% 35%)" : "hsl(0 0% 35%)",
              color: useScored ? "hsl(168 50% 75%)" : "hsl(0 0% 75%)",
            }}
            data-testid="reel-audio-toggle"
            aria-pressed={useScored}
          >
            {useScored ? "♪ audio on" : "♪ audio off"}
          </button>
        )}
        <a
          href={src}
          download={`${sess.title.replace(/[^a-z0-9]/gi, "_")}${useScored ? "_scored" : ""}.${fileExt}`}
          className="self-start px-3 py-2 text-[10px] font-mono uppercase tracking-wider border"
          style={{ borderColor: "hsl(168 50% 35%)", color: "hsl(168 50% 75%)" }}
          data-testid="reel-download"
        >
          ↓ download .{fileExt}{useScored ? " (with audio)" : ""}
        </a>

        <AudioPanel sess={sess} busy={busy} onUpdateAudio={onUpdateAudio} onScore={onScore} onDraftNarration={onDraftNarration} />
      </div>
    </div>
  );
}

function CoverPicker({
  sess, coverBusy, disabled, onUseCurrentFrame, onResetToFirstFrame,
}: {
  sess: ReelSession;
  coverBusy: "idle" | "set" | "reset";
  disabled: boolean;
  onUseCurrentFrame: () => void;
  onResetToFirstFrame: () => void;
}) {
  const isFrameCover = sess.coverKind === "frame";
  const at = sess.coverFrameSeconds ?? 0;
  const atLabel = isFrameCover ? `${at.toFixed(1)}s` : sess.coverKind === "bridge" ? "geodesic" : "Ψ-curve";
  const isCustomFrame = isFrameCover && at > 0.05;
  const setBusy = coverBusy === "set";
  const resetBusy = coverBusy === "reset";
  const anyBusy = coverBusy !== "idle" || disabled;
  return (
    <div
      className="border border-border px-3 py-2 text-[10px] font-mono space-y-2"
      data-testid="reel-cover-picker"
    >
      <div className="flex items-center justify-between gap-2">
        <span style={{ color: "hsl(38 70% 65%)" }}>gallery cover</span>
        <span className="text-muted-foreground" data-testid="reel-cover-current">
          @ {atLabel}
        </span>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onUseCurrentFrame}
          disabled={anyBusy}
          className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border"
          style={{
            borderColor: "hsl(38 70% 45%)",
            color: "hsl(38 80% 75%)",
            background: setBusy ? "hsl(38 25% 12%)" : "transparent",
            opacity: anyBusy ? 0.5 : 1,
          }}
          title="scrub the video and snapshot the visible frame as the gallery cover"
          data-testid="reel-cover-use-current"
        >
          {setBusy ? "capturing..." : "use this frame as cover"}
        </button>
        <button
          type="button"
          onClick={onResetToFirstFrame}
          disabled={anyBusy || !isCustomFrame}
          className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border"
          style={{
            borderColor: "hsl(220 8% 30%)",
            color: "hsl(220 10% 75%)",
            background: resetBusy ? "hsl(220 8% 12%)" : "transparent",
            opacity: anyBusy || !isCustomFrame ? 0.4 : 1,
          }}
          title={isCustomFrame ? "revert the cover to the very first stitched frame" : "already showing the first frame"}
          data-testid="reel-cover-reset"
        >
          {resetBusy ? "resetting..." : "reset to first frame"}
        </button>
      </div>
    </div>
  );
}

function AudioPanel({
  sess, busy, onUpdateAudio, onScore, onDraftNarration,
}: {
  sess: ReelSession;
  busy: string;
  onUpdateAudio: (patch: Partial<ReelAudio>) => Promise<ReelSession>;
  onScore: () => void;
  onDraftNarration: (overwrite: boolean) => void;
}) {
  const audio = sess.audio ?? defaultAudio(sess);
  const updateNarration = async (i: number, patch: Partial<ReelNarration>) => {
    const next = audio.narration.map((n, idx) => (idx === i ? { ...n, ...patch } : n));
    await onUpdateAudio({ narration: next });
  };
  const onMusicFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("Music file too large (max 20MB)");
      return;
    }
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const audioB64 = btoa(bin);
    const music: ReelMusic = {
      audio: audioB64,
      mimeType: file.type || "audio/mpeg",
      name: file.name,
      volume: audio.music?.volume ?? 0.25,
    };
    await onUpdateAudio({ music });
  };
  const removeMusic = () => onUpdateAudio({ music: null });
  const beatLookup = new Map(sess.beats.map((b) => [b.spoke, b]));
  const sharedVoice = audio.narration.length > 0 && audio.narration.every((n) => n.voice === audio.narration[0].voice)
    ? audio.narration[0].voice
    : "";
  const applyVoiceToAll = async (voice: string) => {
    if (!voice) return;
    const next = audio.narration.map((n) => ({ ...n, voice }));
    await onUpdateAudio({ narration: next });
  };
  const filledCount = audio.narration.filter((n) => n.text.trim().length > 0).length;
  const canScore = (filledCount > 0 || Boolean(audio.music)) && busy === "idle";
  const drafting = busy === "narrating";
  const allFilled = filledCount === audio.narration.length && audio.narration.length > 0;
  const draftLabel = drafting
    ? "drafting..."
    : allFilled
      ? "redraft narration"
      : filledCount > 0
        ? "draft empty beats"
        : "draft narration";

  return (
    <div className="border border-border" data-testid="reel-audio-panel">
      <header className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "hsl(168 60% 70%)" }}>
            Ω-SCORE
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">narration & music bed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDraftNarration(allFilled)}
            disabled={drafting || busy !== "idle"}
            className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider border"
            style={{
              borderColor: "hsl(38 60% 40%)",
              color: "hsl(38 70% 70%)",
              background: drafting ? "hsl(38 25% 12%)" : "transparent",
              opacity: drafting || busy !== "idle" ? 0.5 : 1,
            }}
            data-testid="reel-draft-narration"
            title={allFilled ? "overwrite all narration with fresh drafts" : "fill empty narration fields with one-line drafts"}
          >
            ✎ {draftLabel}
          </button>
          <button
            onClick={onScore}
            disabled={!canScore}
            className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider border"
            style={{
              borderColor: "hsl(168 50% 35%)",
              color: "hsl(168 60% 75%)",
              background: busy === "scoring" ? "hsl(168 30% 12%)" : "transparent",
              opacity: canScore ? 1 : 0.4,
            }}
            data-testid="reel-score"
          >
            {busy === "scoring" ? "mixing audio..." : audio.scoredVideo ? "re-score reel" : "score reel"}
          </button>
        </div>
      </header>

      <div className="px-3 py-2 flex flex-col gap-2 border-b border-border text-[10px] font-mono">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground uppercase tracking-wider text-[9px]">Voice (all beats)</span>
          <select
            value={sharedVoice}
            onChange={(e) => applyVoiceToAll(e.target.value)}
            disabled={audio.narration.length === 0 || busy !== "idle"}
            className="bg-transparent border border-border text-[10px] px-1 py-0.5"
            data-testid="reel-voice-all"
            title="Apply this voice to every beat (per-beat selectors below remain for fine-tuning)"
          >
            {sharedVoice === "" && <option value="">(mixed)</option>}
            {TTS_VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <span className="text-muted-foreground/60 text-[9px]">applies to all {audio.narration.length} beat{audio.narration.length === 1 ? "" : "s"}</span>
        </label>
      </div>

      <div className="px-3 py-2 grid grid-cols-2 gap-3 border-b border-border text-[10px] font-mono">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[9px]">Narration vol ({audio.narrationVolume.toFixed(2)})</span>
          <input
            type="range" min={0} max={2} step={0.05}
            value={audio.narrationVolume}
            onChange={(e) => onUpdateAudio({ narrationVolume: Number(e.target.value) })}
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground uppercase tracking-wider text-[9px]">Music bed</span>
          {audio.music ? (
            <div className="flex items-center gap-2">
              <span className="truncate flex-1" style={{ color: "hsl(168 60% 70%)" }}>{audio.music.name}</span>
              <button
                onClick={removeMusic}
                className="text-[9px] px-1 border"
                style={{ borderColor: "hsl(0 30% 30%)", color: "hsl(0 60% 70%)" }}
              >
                remove
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="audio/*"
              onChange={onMusicFile}
              className="text-[9px] text-muted-foreground"
              data-testid="reel-music-upload"
            />
          )}
          {audio.music && (
            <label className="flex flex-col gap-1 mt-1">
              <span className="text-muted-foreground text-[9px]">music vol ({audio.music.volume.toFixed(2)})</span>
              <input
                type="range" min={0} max={2} step={0.05}
                value={audio.music.volume}
                onChange={(e) => onUpdateAudio({
                  music: audio.music ? { ...audio.music, volume: Number(e.target.value) } : null,
                })}
              />
            </label>
          )}
        </div>
      </div>

      <div className="max-h-[40vh] overflow-y-auto" data-testid="reel-narration-list">
        {audio.narration.map((n, i) => {
          const beat = beatLookup.get(n.beatIndex);
          return (
            <div key={i} className="px-3 py-2 border-b border-border/50 text-[10px] font-mono">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: "hsl(38 70% 60%)", width: 26 }}>
                  {beat?.index ?? i + 1}
                </span>
                <span className="text-muted-foreground/70 truncate flex-1">
                  {beat?.visualPrompt ?? `beat ${i + 1}`}
                </span>
                <span className="text-muted-foreground text-[9px]">@{n.offsetSeconds.toFixed(1)}s</span>
              </div>
              <textarea
                value={n.text}
                rows={2}
                placeholder="narration line for this beat..."
                onChange={(e) => updateNarration(i, { text: e.target.value })}
                className="w-full px-2 py-1 bg-transparent border border-border text-foreground text-[10px] font-mono"
                data-testid={`reel-narration-${i}`}
              />
              <div className="flex items-center gap-2 mt-1">
                <NarrationPreviewButton index={i} text={n.text} voice={n.voice} />
                <label className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">voice</span>
                  <select
                    value={n.voice}
                    onChange={(e) => updateNarration(i, { voice: e.target.value })}
                    className="bg-transparent border border-border text-[9px] px-1 py-0.5"
                    data-testid={`reel-voice-${i}`}
                  >
                    {TTS_VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1 flex-1">
                  <span className="text-[9px] text-muted-foreground">offset (s)</span>
                  <input
                    type="number" min={0} step={0.1}
                    value={n.offsetSeconds}
                    onChange={(e) => updateNarration(i, { offsetSeconds: Math.max(0, Number(e.target.value)) })}
                    className="bg-transparent border border-border text-[9px] px-1 py-0.5 w-16"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground border-t border-border">
        {filledCount} of {audio.narration.length} beats narrated
        {audio.music ? " · music bed loaded" : ""}
        {audio.lastScoredAt ? ` · last mixed ${new Date(audio.lastScoredAt).toLocaleTimeString()}` : ""}
      </div>
    </div>
  );
}

function NarrationPreviewButton({ index, text, voice }: { index: number; text: string; voice: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState("idle");
  };

  const play = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (state === "playing") {
      stop();
      return;
    }
    setState("loading");
    setErrMsg(null);
    try {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const r = await fetch(`${baseUrl}api/reel/narrate/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, voice }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as { detail?: string; error?: string }));
        throw new Error(j.detail ?? j.error ?? `preview ${r.status}`);
      }
      const data = await r.json() as { audio: string; mimeType: string };
      const bin = atob(data.audio);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.mimeType || "audio/mpeg" });
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => setState("idle");
      a.onerror = () => { setState("error"); setErrMsg("playback failed"); };
      await a.play();
      setState("playing");
    } catch (e) {
      setState("error");
      setErrMsg((e as Error).message || "preview failed");
    }
  };

  const disabled = !text.trim() || state === "loading";
  const label = state === "loading" ? "..." : state === "playing" ? "■" : "▶";
  const title = state === "playing"
    ? "stop preview"
    : state === "error" && errMsg
      ? `preview failed: ${errMsg}`
      : "preview this line in the chosen voice";
  return (
    <button
      type="button"
      onClick={play}
      disabled={disabled}
      title={title}
      className="px-1.5 py-0.5 text-[10px] font-mono border"
      style={{
        borderColor: state === "error" ? "hsl(0 50% 40%)" : "hsl(168 50% 35%)",
        color: state === "error" ? "hsl(0 60% 70%)" : "hsl(168 60% 75%)",
        background: state === "playing" ? "hsl(168 30% 12%)" : "transparent",
        opacity: disabled ? 0.4 : 1,
        minWidth: 22,
      }}
      data-testid={`reel-narration-preview-${index}`}
    >
      {label}
    </button>
  );
}

function ObserverGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value / 0.1));
  return (
    <div className="mt-1">
      <div className="h-1.5 w-full bg-border/40">
        <div className="h-full" style={{ width: `${pct * 100}%`, background: "hsl(38 70% 55%)" }} />
      </div>
    </div>
  );
}

function RepairControls({ sess, busy, onRepair, lastRepair }: {
  sess: ReelSession; busy: string; onRepair: () => void; lastRepair: RepairReport | null;
}) {
  const bridgeCount = sess.coherence.bridges.length;
  const okHall = sess.coherence.kappaHall <= sess.coherence.kappaMax;
  const canRepair = bridgeCount > 0 || !okHall;
  const repairing = busy === "repairing";
  return (
    <div className="px-3 py-2 border text-[10px] font-mono space-y-1.5"
      style={{ borderColor: canRepair ? "hsl(38 60% 40%)" : "hsl(220 8% 22%)", background: canRepair ? "hsl(38 25% 8%)" : "transparent" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span style={{ color: "hsl(38 70% 65%)" }}>narrative auto-repair</span>
        <button
          onClick={onRepair}
          disabled={!canRepair || repairing}
          className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border"
          style={{
            borderColor: canRepair ? "hsl(38 70% 50%)" : "hsl(220 8% 25%)",
            color: canRepair ? "hsl(38 80% 75%)" : "hsl(220 8% 50%)",
            background: canRepair && !repairing ? "hsl(38 40% 14%)" : "transparent",
            opacity: !canRepair || repairing ? 0.5 : 1,
          }}
          data-testid="reel-repair"
          title={canRepair ? `${bridgeCount} bridge pair${bridgeCount === 1 ? "" : "s"} flagged` : "narrative coherence within bounds"}
        >
          {repairing ? "synthesising bridges..." : canRepair ? `repair ${bridgeCount} bridge${bridgeCount === 1 ? "" : "s"}` : "no repair needed"}
        </button>
      </div>
      <div className="text-[9px] text-muted-foreground/80">
        Bridges {bridgeCount} · κ_H {sess.coherence.kappaHall.toFixed(2)} {okHall ? "≤" : ">"} {sess.coherence.kappaMax}
        {!okHall && <span style={{ color: "hsl(0 70% 65%)" }}> — coherence breached</span>}
      </div>
      {lastRepair && (
        <div className="space-y-1 pt-1 border-t border-border/40">
          <div className="flex justify-between text-muted-foreground">
            <span>last pass</span>
            <span style={{ color: lastRepair.converged ? "hsl(140 60% 65%)" : "hsl(38 70% 65%)" }}>
              {lastRepair.converged ? "converged" : "partial"} · +{lastRepair.insertedCount} beat{lastRepair.insertedCount === 1 ? "" : "s"}
            </span>
          </div>
          <RepairStopReasonBadge report={lastRepair} />
          <div className="flex justify-between text-muted-foreground">
            <span>κ_H trajectory</span>
            <span>
              {lastRepair.initialKappaHall.toFixed(2)}
              {lastRepair.iterations.map((it) => ` → ${it.kappaHall.toFixed(2)}`).join("")}
            </span>
          </div>
          {lastRepair.iterations.flatMap((it) => it.inserted).slice(0, 4).map((ins, i) => (
            <div key={i} className="text-[9px] text-foreground/70 border-l-2 pl-1.5"
              style={{ borderColor: "hsl(38 60% 40%)" }}>
              <span style={{ color: "hsl(38 70% 60%)" }}>spoke {ins.spoke + 1}</span>
              <span className="text-muted-foreground"> ({ins.durationSeconds.toFixed(1)}s, between {ins.betweenSpokes[0] + 1}↔{ins.betweenSpokes[1] + 1})</span>
              <div className="text-foreground/70 truncate">{ins.visualPrompt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Editorial review list for auto-generated bridge beats. After /reel/repair
// runs, every inserted transitional beat shows up here with accept / reject /
// regenerate controls. Accepting just commits the beat (it stops appearing
// pending). Rejecting drops it and refreshes κ. Regenerating re-asks the
// Hypervisor at the same midpoint spoke for a different bridge sentence.
function BridgeReviewList({
  sess, busy, onAccept, onReject, onRegenerate,
}: {
  sess: ReelSession; busy: string;
  onAccept: (beatIdx: number) => void;
  onReject: (beatIdx: number) => void;
  onRegenerate: (beatIdx: number) => void;
}) {
  const pending = sess.beats
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.bridge?.status === "pending");
  if (pending.length === 0) return null;
  const disabled = busy !== "idle";
  return (
    <div className="px-3 py-2 border text-[10px] font-mono space-y-2"
      style={{ borderColor: "hsl(38 60% 40%)", background: "hsl(38 25% 8%)" }}
      data-testid="bridge-review-list"
    >
      <div className="flex items-center justify-between">
        <span style={{ color: "hsl(38 70% 65%)" }}>review auto-bridges</span>
        <span className="text-muted-foreground">{pending.length} pending</span>
      </div>
      {pending.map(({ b, i }) => (
        <div key={`${i}-${b.spoke}-${b.visualPrompt.slice(0, 12)}`}
          className="border-l-2 pl-2 space-y-1"
          style={{ borderColor: "hsl(38 60% 40%)" }}
          data-testid={`bridge-review-${i}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span style={{ color: "hsl(38 70% 60%)" }}>spoke {b.spoke + 1}/24</span>
            <span className="text-muted-foreground">
              between {b.bridge!.leftSpoke + 1}↔{b.bridge!.rightSpoke + 1}
              {b.durationSeconds ? ` · ${b.durationSeconds.toFixed(1)}s` : ""}
            </span>
          </div>
          <div className="text-foreground/80">{b.visualPrompt}</div>
          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={() => onAccept(i)}
              disabled={disabled}
              className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border"
              style={{
                borderColor: "hsl(140 50% 35%)",
                color: "hsl(140 60% 75%)",
                background: "hsl(140 25% 10%)",
                opacity: disabled ? 0.5 : 1,
              }}
              data-testid={`bridge-accept-${i}`}
            >
              accept
            </button>
            <button
              onClick={() => onReject(i)}
              disabled={disabled}
              className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border"
              style={{
                borderColor: "hsl(0 50% 40%)",
                color: "hsl(0 70% 75%)",
                background: "hsl(0 25% 10%)",
                opacity: disabled ? 0.5 : 1,
              }}
              data-testid={`bridge-reject-${i}`}
            >
              reject
            </button>
            <button
              onClick={() => onRegenerate(i)}
              disabled={disabled}
              className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider border"
              style={{
                borderColor: "hsl(38 70% 45%)",
                color: "hsl(38 80% 75%)",
                background: "hsl(38 30% 12%)",
                opacity: disabled ? 0.5 : 1,
              }}
              data-testid={`bridge-regenerate-${i}`}
            >
              {busy === "repairing" ? "..." : "regenerate"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact pill that shows the actual stitched frame size next to a finished
// reel so users can confirm at a glance that the rendered output matches the
// aspect ratio they asked for (e.g. "1280x720 · 16:9"). When a session was
// stitched before /reel/stitch started returning `resolution` we don't know
// the real pixel dimensions, so we degrade gracefully to just the aspect
// label rather than show a misleading guess.
function FrameSizeBadge({
  resolution,
  aspectRatio,
  testId,
}: {
  resolution?: { width: number; height: number };
  aspectRatio: "9:16" | "16:9" | "1:1";
  testId?: string;
}) {
  const hasPixels =
    resolution &&
    Number.isFinite(resolution.width) &&
    Number.isFinite(resolution.height) &&
    resolution.width > 0 &&
    resolution.height > 0;
  const label = hasPixels
    ? `${Math.round(resolution!.width)}×${Math.round(resolution!.height)} · ${aspectRatio}`
    : aspectRatio;
  const title = hasPixels
    ? `stitched at ${Math.round(resolution!.width)}×${Math.round(resolution!.height)} pixels (${aspectRatio})`
    : `stitched at ${aspectRatio} (pixel size not recorded)`;
  return (
    <span
      className="px-1.5 py-0.5 text-[9px] font-mono border tabular-nums whitespace-nowrap"
      style={{
        borderColor: "hsl(220 8% 25%)",
        color: "hsl(220 10% 75%)",
        background: "hsl(220 10% 8%)",
      }}
      title={title}
      data-testid={testId}
    >
      {label}
    </span>
  );
}

// Plain-language explanation of why /reel/repair stopped iterating. The API
// returns one of four `stopReason` values; we render each as a colour-coded
// badge plus a short caption so users know whether the result is finished
// ("converged"), partially helped, or hit a guard rail.
function RepairStopReasonBadge({ report }: { report: RepairReport }) {
  const palette = stopReasonPalette(report.stopReason);
  const caption = stopReasonCaption(report);
  return (
    <div className="space-y-0.5" data-testid="repair-stop-reason">
      <div className="flex justify-between items-center gap-2">
        <span className="text-muted-foreground">why it stopped</span>
        <span
          className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border"
          style={{
            borderColor: palette.border,
            color: palette.text,
            background: palette.bg,
          }}
          data-testid={`repair-stop-reason-${report.stopReason}`}
        >
          {stopReasonLabel(report.stopReason)}
        </span>
      </div>
      <div className="text-[9px] text-foreground/70 leading-snug">{caption}</div>
    </div>
  );
}

function stopReasonLabel(reason: RepairStopReason): string {
  switch (reason) {
    case "converged": return "converged";
    case "no-bridges": return "no bridges left";
    case "no-progress": return "no further progress";
    case "iteration-cap": return "hit iteration cap";
  }
}

function stopReasonCaption(report: RepairReport): string {
  switch (report.stopReason) {
    case "converged":
      return "κ_H is now within bounds and no bridge pairs remain — the timeline is repaired.";
    case "no-bridges":
      return "Repair found no more bridge pairs to patch, but κ_H is still above the limit. Try editing or regenerating the remaining beats by hand.";
    case "no-progress":
      return "κ_H stopped improving between passes — usually because two beats have nearly identical char-bags. Try manually editing the duplicate beats so they read differently.";
    case "iteration-cap":
      return `Stopped after ${report.iterationCount} of ${report.maxIterations} passes without converging. Run repair again or edit beats by hand to keep going.`;
  }
}

function stopReasonPalette(reason: RepairStopReason): { border: string; text: string; bg: string } {
  switch (reason) {
    case "converged":
      return { border: "hsl(140 50% 35%)", text: "hsl(140 60% 75%)", bg: "hsl(140 25% 10%)" };
    case "no-bridges":
      return { border: "hsl(38 60% 40%)", text: "hsl(38 80% 75%)", bg: "hsl(38 25% 10%)" };
    case "no-progress":
      return { border: "hsl(0 50% 40%)", text: "hsl(0 70% 75%)", bg: "hsl(0 25% 10%)" };
    case "iteration-cap":
      return { border: "hsl(220 30% 35%)", text: "hsl(220 30% 75%)", bg: "hsl(220 15% 10%)" };
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
