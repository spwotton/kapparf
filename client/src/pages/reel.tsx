import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useReel } from "@/hooks/use-reel";
import { listReels, deleteReel } from "@/lib/reel-store";
import type { ReelSession } from "@/lib/reel-store";
import { BRIDGE_KAPPA_MAX, NEAR_DUP_KAPPA } from "@/lib/narrative-coherence";

// ─── ICOSITETRAGON (24-spoke wheel) ──────────────────────────────────────────
function IcositetragonWheel({ beats, activeIndex }: { beats: number; activeIndex: number }) {
  const spokes = 24;
  const cx = 80;
  const cy = 80;
  const outerR = 68;
  const innerR = 44;
  const beatSpread = Math.floor(spokes / beats);

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
      {Array.from({ length: spokes }).map((_, i) => {
        const ang = (i / spokes) * 2 * Math.PI - Math.PI / 2;
        const beatIdx = Math.round((i / spokes) * beats);
        const isActive = beatIdx === activeIndex;
        const isBeat = i % beatSpread === 0;
        return (
          <line
            key={i}
            x1={cx + innerR * Math.cos(ang)}
            y1={cy + innerR * Math.sin(ang)}
            x2={cx + outerR * Math.cos(ang)}
            y2={cy + outerR * Math.sin(ang)}
            stroke={isActive ? "#1d4ed8" : isBeat ? "#374151" : "#d1d5db"}
            strokeWidth={isActive ? 2.5 : isBeat ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">
        {beats}b
      </text>
    </svg>
  );
}

// ─── κ_H GAUGE ────────────────────────────────────────────────────────────────
function KappaGauge({ kH }: { kH: number }) {
  const pct = Math.min(100, (kH / BRIDGE_KAPPA_MAX) * 100);
  const color = kH >= BRIDGE_KAPPA_MAX ? "bg-red-500" : kH > NEAR_DUP_KAPPA ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
        <span>κ_H coherence</span>
        <span className={kH >= BRIDGE_KAPPA_MAX ? "text-red-600 font-bold" : kH > 30 ? "text-amber-600" : "text-emerald-700"}>
          {kH.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 w-full rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-gray-400">
        <span>0</span>
        <span className="text-amber-500">{NEAR_DUP_KAPPA}</span>
        <span className="text-red-500">{BRIDGE_KAPPA_MAX}</span>
      </div>
    </div>
  );
}

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "PENDING", cls: "bg-gray-100 text-gray-500" },
    running: { label: "RUNNING", cls: "bg-blue-50 text-blue-700 animate-pulse" },
    done:    { label: "DONE",    cls: "bg-emerald-50 text-emerald-700" },
    error:   { label: "ERROR",   cls: "bg-red-50 text-red-700" },
  };
  const s = map[status ?? "pending"] ?? map.pending;
  return (
    <span className={`text-[9px] font-black font-sans tracking-[0.15em] px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── GALLERY CARD ─────────────────────────────────────────────────────────────
function GalleryCard({ session, onSelect, onDelete }: {
  session: ReelSession;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const phaseColors: Record<string, string> = {
    outline: "bg-gray-100 text-gray-600",
    generation: "bg-blue-50 text-blue-700",
    playback: "bg-emerald-50 text-emerald-800",
  };
  return (
    <div
      className="border border-gray-100 hover:border-gray-300 transition-all p-3 flex gap-3 cursor-pointer group"
      onClick={() => onSelect(session.id)}
      data-testid={`card-reel-${session.id}`}
    >
      <div className="w-16 h-28 bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
        {session.thumbnail ? (
          <img src={session.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg width="32" height="48" viewBox="0 0 32 48" className="text-gray-300">
            <rect width="32" height="48" fill="currentColor" rx="2" />
            <text x="16" y="27" textAnchor="middle" fontSize="8" fill="white" fontFamily="monospace">REEL</text>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-[13px] font-bold text-gray-900 line-clamp-2 leading-snug">
          {session.title}
        </p>
        {session.articleSource && (
          <p className="text-[9px] font-mono text-gray-400 mt-0.5 truncate">← {session.articleSource}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-black font-sans tracking-widest px-1.5 py-0.5 rounded-full uppercase ${phaseColors[session.phase] ?? phaseColors.outline}`}>
            {session.phase}
          </span>
          <span className="text-[9px] font-mono text-gray-400">{session.beatCount}b</span>
        </div>
        <p className="text-[9px] font-sans text-gray-400 mt-1.5">
          {new Date(session.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors self-start mt-0.5"
        data-testid={`button-delete-reel-${session.id}`}
        title="Delete session"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── OUTLINE PANEL ────────────────────────────────────────────────────────────
function OutlinePanel({
  theme, setTheme, beatCount, setBeatCount,
  reel, activeWheel, setActiveWheel,
}: {
  theme: string; setTheme: (t: string) => void;
  beatCount: number; setBeatCount: (n: number) => void;
  reel: ReturnType<typeof useReel>;
  activeWheel: number; setActiveWheel: (n: number) => void;
}) {
  const { beats, coherence, isGeneratingOutline, isRepairing, generateOutline, repairCoherence, repairPair, updateBeat, error } = reel;
  const [dismissedFaults, setDismissedFaults] = useState<Set<string>>(new Set());
  const [regeneratingFault, setRegeneratingFault] = useState<string | null>(null);

  const faultKey = (f: { i: number; j: number }) => `${f.i}-${f.j}`;
  const acceptFault = (f: { i: number; j: number }) => {
    setDismissedFaults((prev) => new Set([...prev, faultKey(f)]));
  };
  const rejectFault = (f: { i: number; j: number }) => {
    // Reset beat at j to pending with empty prompt for re-generation
    updateBeat(f.j, { prompt: "", status: "pending" });
    setDismissedFaults((prev) => new Set([...prev, faultKey(f)]));
  };
  const regenerateFault = async (f: { i: number; j: number }) => {
    const key = faultKey(f);
    setRegeneratingFault(key);
    try {
      await repairPair(f.i, f.j);
    } finally {
      setRegeneratingFault(null);
      setDismissedFaults((prev) => new Set([...prev, key]));
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme input */}
      <div>
        <label className="block text-[10px] font-black font-sans tracking-[0.2em] uppercase text-gray-500 mb-1.5">
          Theme / Article Content
        </label>
        <textarea
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          rows={4}
          placeholder="Paste article headline, subhead, and body — or describe your reel theme..."
          className="w-full border border-gray-200 text-[13px] font-serif px-3 py-2 resize-none focus:outline-none focus:border-gray-400 text-gray-800"
          data-testid="input-reel-theme"
        />
      </div>

      {/* Beat count slider */}
      <div>
        <label className="block text-[10px] font-black font-sans tracking-[0.2em] uppercase text-gray-500 mb-1.5">
          Beat Count — {beatCount}
        </label>
        <input
          type="range" min={4} max={8} value={beatCount}
          onChange={(e) => setBeatCount(Number(e.target.value))}
          className="w-full accent-gray-800"
          data-testid="slider-beat-count"
        />
        <div className="flex justify-between text-[9px] font-mono text-gray-400 mt-0.5">
          <span>4</span><span>8</span>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={() => generateOutline(beatCount)}
        disabled={isGeneratingOutline || !theme.trim()}
        className="w-full border-2 border-gray-900 text-gray-900 font-sans font-black text-[11px] tracking-[0.2em] uppercase py-2.5 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="button-generate-outline"
      >
        {isGeneratingOutline ? "Generating Outline…" : "Generate Outline"}
      </button>

      {error && (
        <div className="border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 font-mono">
          {error}
        </div>
      )}

      {/* Beats + Wheel */}
      {beats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <IcositetragonWheel beats={beats.length} activeIndex={activeWheel} />
            <div className="flex-1 min-w-0">
              {coherence && <KappaGauge kH={coherence.kH} />}
              {coherence && coherence.bridgeFaults.filter((f) => !dismissedFaults.has(faultKey(f))).length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[9px] font-black font-sans tracking-[0.2em] text-amber-700 uppercase">Bridge Faults</p>
                  {coherence.bridgeFaults.filter((f) => !dismissedFaults.has(faultKey(f))).map((f, i) => {
                    const key = faultKey(f);
                    const isRegen = regeneratingFault === key;
                    return (
                      <div key={key} className="border border-amber-200 bg-amber-50 px-2.5 py-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] text-gray-700">
                          <span className="font-mono font-bold">B{f.i}→B{f.j}</span>
                          <span className={`text-[9px] px-1 py-0.5 font-sans font-bold rounded-sm ${f.type === "bridge" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {f.type === "bridge" ? "weak bridge" : "near-duplicate"}
                          </span>
                          {f.similarity !== undefined && (
                            <span className="ml-auto text-[9px] font-mono text-gray-400">ρ={f.similarity.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => acceptFault(f)}
                            className="flex-1 text-[9px] font-sans font-bold tracking-wider uppercase border border-gray-300 py-0.5 hover:bg-gray-100 text-gray-600 transition-colors"
                            data-testid={`button-fault-accept-${i}`}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectFault(f)}
                            className="flex-1 text-[9px] font-sans font-bold tracking-wider uppercase border border-red-200 py-0.5 hover:bg-red-50 text-red-600 transition-colors"
                            data-testid={`button-fault-reject-${i}`}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => regenerateFault(f)}
                            disabled={isRegen}
                            className="flex-1 text-[9px] font-sans font-bold tracking-wider uppercase border border-amber-400 py-0.5 hover:bg-amber-100 text-amber-700 transition-colors disabled:opacity-40"
                            data-testid={`button-fault-regen-${i}`}
                          >
                            {isRegen ? "…" : "Regenerate"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {coherence && !coherence.isCoherent && (
            <button
              onClick={repairCoherence}
              disabled={isRepairing}
              className="w-full border border-amber-400 text-amber-700 font-sans font-black text-[10px] tracking-widest uppercase py-2 hover:bg-amber-50 transition-colors disabled:opacity-40"
              data-testid="button-auto-repair"
            >
              {isRepairing ? "Repairing…" : "Auto-Repair Coherence"}
            </button>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-black font-sans tracking-[0.2em] uppercase text-gray-500">
              Beat Prompts
            </p>
            {beats.map((beat, i) => (
              <div
                key={beat.index}
                className={`border p-2.5 transition-colors cursor-pointer ${activeWheel === i ? "border-blue-200 bg-blue-50" : "border-gray-100 hover:border-gray-300"}`}
                onClick={() => setActiveWheel(i)}
                data-testid={`beat-${i}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black font-mono text-gray-400">B{i + 1}</span>
                  <span className="text-[9px] font-sans tracking-wide text-gray-500 uppercase">{beat.act}</span>
                  <span className="ml-auto text-[9px] font-mono text-gray-400 italic">{beat.mood}</span>
                </div>
                <textarea
                  value={beat.prompt}
                  onChange={(e) => updateBeat(i, { prompt: e.target.value })}
                  rows={2}
                  className="w-full text-[11px] font-serif text-gray-700 resize-none focus:outline-none bg-transparent"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`input-beat-prompt-${i}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GENERATION PANEL ─────────────────────────────────────────────────────────
function GenerationPanel({ reel }: { reel: ReturnType<typeof useReel> }) {
  const { beats, progress, isStitching, startGeneration, cancelGeneration, stitch, stitchPartial, error } = reel;
  const doneCount = beats.filter((b) => b.status === "done").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={startGeneration}
          disabled={beats.length === 0}
          className="flex-1 border-2 border-gray-900 font-sans font-black text-[11px] tracking-[0.2em] uppercase py-2.5 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40"
          data-testid="button-start-generation"
        >
          Generate All Clips
        </button>
        <button
          onClick={cancelGeneration}
          className="border border-gray-300 font-sans font-black text-[11px] tracking-[0.15em] uppercase py-2.5 px-3 text-gray-500 hover:bg-gray-50"
          data-testid="button-cancel-generation"
        >
          Cancel
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
          <span>{doneCount}/{beats.length} clips</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 w-full">
          <div className="h-full bg-gray-800 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Per-beat status pills */}
      <div className="space-y-1.5">
        {beats.map((beat, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50">
            <span className="text-[9px] font-mono text-gray-400 w-6 shrink-0">B{i + 1}</span>
            <span className="text-[11px] font-serif text-gray-700 flex-1 truncate">{beat.act}</span>
            <StatusPill status={beat.status} />
            {beat.psiScore !== undefined && (
              <span className="text-[9px] font-mono text-gray-400">Ψ={beat.psiScore.toFixed(3)}</span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 font-mono">{error}</div>
      )}

      {/* Stitch actions */}
      <div className="flex gap-2">
        <button
          onClick={stitch}
          disabled={isStitching || doneCount === 0}
          className="flex-1 border-2 border-gray-900 font-sans font-black text-[11px] tracking-[0.15em] uppercase py-2.5 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40"
          data-testid="button-stitch"
        >
          {isStitching ? "Stitching…" : "Stitch & Render"}
        </button>
        {doneCount >= 2 && doneCount < beats.length && (
          <button
            onClick={stitchPartial}
            disabled={isStitching}
            className="border border-gray-300 font-sans text-[10px] tracking-wide uppercase py-2.5 px-3 text-gray-500 hover:bg-gray-50"
            data-testid="button-stitch-partial"
          >
            Stitch Partial ({doneCount})
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PLAYBACK PANEL ───────────────────────────────────────────────────────────
function PlaybackPanel({ reel }: { reel: ReturnType<typeof useReel> }) {
  const { mp4Base64, beatOnsets, beats, addNarration, isScoring, error } = reel;
  const [voice, setVoice] = useState<"alloy" | "nova" | "shimmer" | "onyx">("alloy");
  const [narrations, setNarrations] = useState<string[]>(beats.map((b) => b.narration ?? ""));
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mp4Base64 && videoRef.current) {
      const blob = new Blob([Uint8Array.from(atob(mp4Base64), (c) => c.charCodeAt(0))], { type: "video/mp4" });
      videoRef.current.src = URL.createObjectURL(blob);
    }
  }, [mp4Base64]);

  const handleAddNarration = async () => {
    const items = narrations
      .map((text, i) => ({ text, offsetMs: beatOnsets[i] ?? 0 }))
      .filter((n) => n.text.trim());
    if (items.length === 0) return;
    await addNarration(items, voice);
  };

  const handleDownload = () => {
    if (!mp4Base64) return;
    const a = document.createElement("a");
    const blob = new Blob([Uint8Array.from(atob(mp4Base64), (c) => c.charCodeAt(0))], { type: "video/mp4" });
    a.href = URL.createObjectURL(blob);
    a.download = "omega-reel.mp4";
    a.click();
  };

  return (
    <div className="space-y-5">
      {mp4Base64 ? (
        <>
          <div className="flex justify-center">
            <video
              ref={videoRef}
              controls
              className="max-w-[220px] w-full"
              style={{ aspectRatio: "9/16" }}
              data-testid="video-reel-player"
            />
          </div>

          <button
            onClick={handleDownload}
            className="w-full border-2 border-gray-900 font-sans font-black text-[11px] tracking-[0.2em] uppercase py-2.5 hover:bg-gray-900 hover:text-white transition-colors"
            data-testid="button-download-reel"
          >
            ↓ Download MP4
          </button>

          <div>
            <p className="text-[10px] font-black font-sans tracking-[0.2em] uppercase text-gray-500 mb-3">
              Narration (Optional)
            </p>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[10px] font-sans text-gray-500">Voice:</label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value as any)}
                className="text-[11px] border border-gray-200 px-2 py-1 font-sans focus:outline-none"
                data-testid="select-voice"
              >
                {["alloy", "nova", "shimmer", "onyx"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {beats.map((beat, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono text-gray-400 w-6">B{i + 1}</span>
                    <span className="text-[9px] font-sans text-gray-500 truncate flex-1">{beat.act}</span>
                    {beatOnsets[i] !== undefined && (
                      <span className="text-[9px] font-mono text-gray-400">{(beatOnsets[i] / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={narrations[i] ?? ""}
                    onChange={(e) => {
                      const next = [...narrations];
                      next[i] = e.target.value;
                      setNarrations(next);
                    }}
                    placeholder={`Narration for beat ${i + 1}…`}
                    className="w-full border border-gray-200 text-[11px] font-serif px-2 py-1.5 focus:outline-none focus:border-gray-400"
                    data-testid={`input-narration-${i}`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleAddNarration}
              disabled={isScoring}
              className="w-full mt-3 border border-gray-300 font-sans text-[10px] tracking-wide uppercase py-2 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
              data-testid="button-add-narration"
            >
              {isScoring ? "Adding Narration…" : "Add Narration"}
            </button>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 font-mono">{error}</div>
          )}
        </>
      ) : (
        <p className="text-center text-[12px] text-gray-400 font-sans py-8">
          Stitch your clips to see the final reel here.
        </p>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReelPage() {
  const [location] = useLocation();
  const reel = useReel();
  const [sessions, setSessions] = useState<ReelSession[]>([]);
  const [loadedGallery, setLoadedGallery] = useState(false);
  const [activeWheel, setActiveWheel] = useState(0);
  const [theme, setTheme] = useState("");
  const [beatCount, setBeatCount] = useState(5);
  const [view, setView] = useState<"gallery" | "composer">("gallery");

  // Read article data from URL params + sessionStorage (passed from Goose Gazette)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get("articleId");
    const articleTitle = params.get("title");
    const articleSubhead = params.get("subhead");

    if (articleId || articleTitle) {
      // Try to read full article body from sessionStorage
      let bodyText = "";
      try {
        const raw = sessionStorage.getItem("reel_article");
        if (raw) {
          const stored = JSON.parse(raw);
          if (!articleId || stored.id === articleId) {
            bodyText = stored.body ?? "";
            sessionStorage.removeItem("reel_article");
          }
        }
      } catch { /* ignore */ }

      // Build theme: headline — subhead. Body (truncated to 1500 chars for LLM context)
      const parts = [articleTitle, articleSubhead].filter(Boolean);
      const bodySnippet = bodyText ? `\n\n${bodyText.slice(0, 1500)}` : "";
      const prefilledTheme = parts.join(" — ") + bodySnippet;

      if (prefilledTheme.trim()) {
        setTheme(prefilledTheme);
        setView("composer");
        reel.initSession(prefilledTheme, {
          articleId: articleId ?? undefined,
          articleSource: articleTitle ?? undefined,
        });
      }
    }
  }, []); // eslint-disable-line

  // Load gallery + auto-resume last in-progress session on page load
  useEffect(() => {
    listReels().then((s) => {
      setSessions(s);
      setLoadedGallery(true);

      // Auto-resume: if a session is mid-generation, switch to composer immediately
      const resumable = s.find(
        (sess) =>
          sess.phase === "generation" &&
          sess.beats.some((b) => b.jobId && b.status !== "done" && b.status !== "error")
      );
      if (resumable) {
        reel.loadSession(resumable.id).then(() => {
          setTheme(resumable.theme);
          setView("composer");
        });
      }
    });
  }, []); // eslint-disable-line

  const handleSelectSession = async (id: string) => {
    await reel.loadSession(id);
    const s = sessions.find((s) => s.id === id);
    if (s) setTheme(s.theme);
    setView("composer");
  };

  const handleDeleteSession = async (id: string) => {
    await deleteReel(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (reel.session?.id === id) reel.reset();
  };

  const handleNewReel = () => {
    reel.reset();
    setTheme("");
    setBeatCount(5);
    setView("composer");
    reel.initSession("New Reel");
  };

  // Initialize a blank session when opening composer without one
  useEffect(() => {
    if (view === "composer" && !reel.session) {
      reel.initSession(theme || "New Reel");
    }
  }, [view]); // eslint-disable-line

  const tabs: Array<{ key: typeof reel.phase; label: string }> = [
    { key: "outline", label: "Outline" },
    { key: "generation", label: "Generation" },
    { key: "playback", label: "Playback" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
      {/* Header */}
      <div className="border-b-4 border-black px-6 py-5 flex items-center justify-between">
        <div>
          <div className="text-[9px] font-black font-sans tracking-[0.3em] text-gray-400 uppercase mb-1">KAPPA Intelligence</div>
          <h1 className="font-serif font-black text-2xl leading-none">Ω-REEL</h1>
          <p className="text-[11px] font-sans italic text-gray-500 mt-0.5">
            Turn Goose Gazette articles into shareable 9:16 short-form videos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("gallery")}
            className={`text-[10px] font-sans font-black tracking-[0.18em] uppercase px-3 py-1.5 border transition-colors ${view === "gallery" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
            data-testid="button-view-gallery"
          >
            Gallery
          </button>
          <button
            onClick={handleNewReel}
            className={`text-[10px] font-sans font-black tracking-[0.18em] uppercase px-3 py-1.5 border transition-colors ${view === "composer" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
            data-testid="button-view-composer"
          >
            + New Reel
          </button>
          <Link
            href="/goose"
            className="text-[10px] font-sans text-gray-400 hover:text-gray-700 transition-colors"
            data-testid="link-back-gazette"
          >
            ← Goose Gazette
          </Link>
        </div>
      </div>

      {/* GALLERY VIEW */}
      {view === "gallery" && (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg">Saved Reels</h2>
            <button
              onClick={handleNewReel}
              className="text-[10px] font-sans font-black tracking-[0.18em] uppercase border-2 border-gray-900 px-3 py-1.5 hover:bg-gray-900 hover:text-white transition-colors"
              data-testid="button-new-reel-gallery"
            >
              + Start New Reel
            </button>
          </div>

          {!loadedGallery && (
            <p className="text-[12px] text-gray-400 font-sans text-center py-10">Loading…</p>
          )}

          {loadedGallery && sessions.length === 0 && (
            <div className="text-center py-14">
              <p className="text-[13px] text-gray-500 font-sans mb-4">No reels yet.</p>
              <p className="text-[11px] text-gray-400 font-sans mb-6">
                Go to{" "}
                <Link href="/goose" className="underline text-gray-700">
                  Goose Gazette
                </Link>{" "}
                and click "Make Reel" on any article to get started.
              </p>
              <button
                onClick={handleNewReel}
                className="border-2 border-gray-900 font-sans font-black text-[11px] tracking-[0.2em] uppercase px-6 py-2.5 hover:bg-gray-900 hover:text-white transition-colors"
                data-testid="button-start-from-gallery-empty"
              >
                Start New Reel
              </button>
            </div>
          )}

          {loadedGallery && sessions.length > 0 && (
            <div className="space-y-2" data-testid="list-reel-sessions">
              {sessions.map((s) => (
                <GalleryCard
                  key={s.id}
                  session={s}
                  onSelect={handleSelectSession}
                  onDelete={handleDeleteSession}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPOSER VIEW */}
      {view === "composer" && (
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Session title */}
          {reel.session && (
            <div className="mb-5 pb-4 border-b border-gray-100">
              <p className="text-[9px] font-black font-sans tracking-[0.2em] text-gray-400 uppercase mb-0.5">Session</p>
              <p className="font-serif text-[15px] font-bold text-gray-800 line-clamp-1">{reel.session.title}</p>
            </div>
          )}

          {/* Phase tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => reel.setPhase(tab.key)}
                className={`flex-1 font-sans font-black text-[10px] tracking-[0.18em] uppercase py-2.5 border-b-2 transition-colors ${
                  reel.phase === tab.key
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
                data-testid={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {reel.phase === "outline" && (
            <OutlinePanel
              theme={theme}
              setTheme={(t) => {
                setTheme(t);
                if (reel.session) reel.session.theme = t;
              }}
              beatCount={beatCount}
              setBeatCount={setBeatCount}
              reel={reel}
              activeWheel={activeWheel}
              setActiveWheel={setActiveWheel}
            />
          )}

          {reel.phase === "generation" && <GenerationPanel reel={reel} />}

          {reel.phase === "playback" && <PlaybackPanel reel={reel} />}
        </div>
      )}
    </div>
  );
}
