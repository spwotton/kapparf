import { useCallback, useEffect, useRef, useState } from "react";
import {
  saveReel,
  loadReels,
  deleteReel,
  type ReelSession,
  type ReelClip,
  type ReelBeat,
  type ReelCoherence,
  type ReelAudio,
  type ReelNarration,
  type ReelMusic,
} from "../lib/reel-store";
import {
  setBridgeStatus,
  drainBridgeHandoffs,
  consumeBridgeCancelRequest,
  isBridgeCancelRequested,
} from "../lib/bridge-pipeline-status";
import { buildReelCover, extractFrameCover } from "../lib/reel-cover";

export type AspectRatio = "9:16" | "16:9";

const baseUrl = () => import.meta.env.BASE_URL || "/";

function uid() {
  return `reel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export type RepairIteration = {
  pass: number;
  kappa: number;
  kappaHall: number;
  bridgesBefore: Array<{ from: number; to: number; kappa: number }>;
  inserted: Array<{ atIndex: number; spoke: number; visualPrompt: string; durationSeconds: number; betweenSpokes: [number, number] }>;
};

export type RepairStopReason = "converged" | "no-bridges" | "no-progress" | "iteration-cap";

export type RepairReport = {
  initialKappaHall: number;
  finalKappaHall: number;
  iterations: RepairIteration[];
  converged: boolean;
  insertedCount: number;
  stopReason: RepairStopReason;
  iterationCount: number;
  maxIterations: number;
};

// Auto-compute beat offsets along the stitched timeline. Prefers the
// authoritative per-beat onsets persisted by /reel/stitch (which account for
// xfade + bridge overlap) and falls back to a cumulative-sum estimate when
// the reel has not been stitched yet.
export function defaultAudio(sess: ReelSession): ReelAudio {
  let cumulative = 0;
  const narration: ReelNarration[] = sess.beats.map((b, i) => {
    const clip = sess.clips[i];
    const dur = clip?.durationSeconds ?? sess.durationSeconds;
    const snapped = clip?.onsetSeconds;
    const offset = typeof snapped === "number" && Number.isFinite(snapped)
      ? snapped
      : cumulative;
    cumulative += dur;
    return {
      beatIndex: b.spoke,
      text: "",
      voice: "alloy",
      offsetSeconds: Math.max(0, offset),
    };
  });
  return {
    enabled: false,
    narration,
    music: null,
    narrationVolume: 1,
  };
}

// Dependencies the bridge auto-pipeline needs in order to run. Lifted to
// the module top level so the orchestration logic can be unit-tested
// without rendering the full hook (the React closures inside useReel
// supply these bindings at call time).
export type BridgePipelineDeps = {
  repair: (s: ReelSession) => Promise<{ session: ReelSession; report: RepairReport }>;
  generateClips: (s: ReelSession, shouldCancel?: () => boolean) => Promise<ReelSession>;
  stitch: (s: ReelSession) => Promise<ReelSession>;
  persist: (s: ReelSession) => Promise<void>;
  // Mirrors the hook's sessionRef.current — returns the freshest persisted
  // snapshot for the given reel id, or null if the ref has moved on.
  getLatest: (id: string) => ReelSession | null;
  // Hook-side mutex reset (useReel sets cancelRef.current = false).
  resetCancelMutex: () => void;
};

export async function runBridgePipeline(
  initial: ReelSession,
  deps: BridgePipelineDeps,
  opts?: { startStage?: "repair" | "clips" | "stitch"; resumedFrom?: "repair" | "clips" | "stitch" },
): Promise<void> {
  // Cancellation gate: the running pipeline closure persists in JS
  // even if the Reel view (and useReel listener) unmount, so we read
  // the canonical state from the module-level `cancelRequested` flag
  // rather than from a React ref. This means cancel buttons in any
  // view can stop the pipeline regardless of mount status.
  //
  // Drain any *prior* cancel request first, so a stale flag from a
  // previous run does not auto-cancel this one at startup. (The
  // listener above also drains it during normal operation, but a
  // cancel fired before useReel ever mounted would otherwise survive.)
  consumeBridgeCancelRequest();
  deps.resetCancelMutex();
  const startStage: "repair" | "clips" | "stitch" = opts?.startStage ?? "repair";
  let lastStage: "repair" | "clips" | "stitch" = startStage;
  // `resumedFrom` is plumbed through every status emission so any mounted
  // CathedralView can show a "resumed from <stage>" badge alongside the
  // live stage indicator. We also snapshot the count of clips that were
  // already `done` at resume time so the badge can read e.g.
  // "resumed from clips · 3 already done".
  const resumedFrom = opts?.resumedFrom;
  const clipsSkipped = resumedFrom
    ? initial.clips.filter((c) => c.status === "done").length
    : undefined;
  setBridgeStatus({ kind: "running", reelId: initial.id, stage: lastStage, resumedFrom, clipsSkipped });
  // Checkpoint the pipeline state on the persisted session so the gallery
  // can offer a "resume" affordance after a cancel/error. We always read
  // the freshest persisted snapshot (getLatest) because repair/stitch
  // already overwrite the session in IDB during their own work.
  const checkpoint = async (
    kind: "running" | "cancelled" | "complete" | "error",
    stage: "repair" | "clips" | "stitch",
  ) => {
    const latest = deps.getLatest(initial.id) ?? initial;
    await deps.persist({ ...latest, pipelineState: { kind, stage, updatedAt: Date.now() } });
  };
  let working = initial;
  const cancelHit = () => isBridgeCancelRequested();
  const emitCancelled = async () => {
    // Consume the flag here so the *next* pipeline run starts clean.
    consumeBridgeCancelRequest();
    deps.resetCancelMutex();
    // Snapshot clip progress at cancel time so the inspector can show
    // "cancelled at clips · 3/8 done" instead of just naming the stage.
    // Repair-stage cancels report 0/total since no clips have been
    // attempted yet; stitch-stage cancels report total/total since the
    // clip loop has fully drained by then.
    const clipsTotal = working.clips.length;
    const clipsDone = working.clips.filter((c) => c.status === "done").length;
    setBridgeStatus({
      kind: "cancelled",
      reelId: working.id,
      stage: lastStage,
      clipsDone,
      clipsTotal,
      resumedFrom,
      clipsSkipped,
    });
    await checkpoint("cancelled", lastStage);
  };
  try {
    await checkpoint("running", lastStage);
    if (cancelHit()) { await emitCancelled(); return; }
    // Stage 1: repair. Failures here are first-class errors — a bridge
    // reel that can't have its κ-faults patched isn't publish-ready.
    // Skipped on resume when the prior run had already passed this stage.
    if (startStage === "repair") {
      const repaired = await deps.repair(working);
      working = repaired.session;
      if (cancelHit()) { await emitCancelled(); return; }
    }

    // Stage 2: per-beat clip generation. Pass cancelHit so the loop
    // also bails on the module flag, not just on cancelRef (which
    // depends on the in-hook listener still being mounted).
    // Skipped entirely when resuming from "stitch" — every clip is
    // already done by definition, so re-entering generateClips would
    // be a no-op that still flips the status pill back to "clips".
    if (startStage === "repair" || startStage === "clips") {
      lastStage = "clips";
      setBridgeStatus({ kind: "running", reelId: working.id, stage: lastStage, resumedFrom, clipsSkipped });
      await checkpoint("running", lastStage);
      const generated = await deps.generateClips(working, cancelHit);
      working = generated;
      if (cancelHit()) { await emitCancelled(); return; }
      const failed = generated.clips.filter((c) => c.status === "error");
      const done = generated.clips.filter((c) => c.status === "done");
      if (done.length === 0) {
        const firstErr = failed[0]?.error;
        throw new Error(
          `bridge reel pipeline halted: all ${failed.length} clip${failed.length === 1 ? "" : "s"} failed${
            firstErr ? ` (first error: ${firstErr.slice(0, 160)})` : ""
          }`,
        );
      }
      if (failed.length > 0) {
        console.warn(`[reel] ${failed.length} clip(s) failed, proceeding to stitch with ${done.length} completed`);
      }
    } else {
      // startStage === "stitch": pull the freshest persisted snapshot so
      // stitch sees the same clips/onsets the prior run had finished.
      working = deps.getLatest(initial.id) ?? working;
    }

    // Stage 3: stitch.
    lastStage = "stitch";
    setBridgeStatus({ kind: "running", reelId: working.id, stage: lastStage, resumedFrom, clipsSkipped });
    await checkpoint("running", lastStage);
    await deps.stitch(working);
    if (cancelHit()) { await emitCancelled(); return; }
    setBridgeStatus({ kind: "complete", reelId: working.id, resumedFrom, clipsSkipped });
    await checkpoint("complete", lastStage);
  } catch (e) {
    // A cancel that races with an in-flight stage failure should still
    // present as a clean cancellation, not as the secondary error.
    if (cancelHit()) {
      await emitCancelled();
      return;
    }
    setBridgeStatus({
      kind: "error",
      reelId: working.id,
      message: (e as Error).message || "bridge reel pipeline failed",
      resumedFrom,
      clipsSkipped,
    });
    await checkpoint("error", lastStage);
    throw e;
  }
}

export function useReel() {
  const [session, setSession] = useState<ReelSession | null>(null);
  const [gallery, setGallery] = useState<ReelSession[]>([]);
  const [phase, setPhase] = useState<"outline" | "generation" | "playback">("outline");
  const [busy, setBusy] = useState<"idle" | "outline" | "generating" | "stitching" | "repairing" | "scoring" | "narrating">("idle");
  const [lastRepair, setLastRepair] = useState<RepairReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);
  const sessionRef = useRef<ReelSession | null>(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => { loadReels().then(setGallery); }, []);

  // Pipeline runner used by the bridge auto-run path. Held in a ref so the
  // event handler (registered once) always invokes the latest closure with
  // current useCallback bindings for repair/generateClips/stitch.
  const pipelineRef = useRef<((s: ReelSession, opts?: { startStage?: "repair" | "clips" | "stitch"; resumedFrom?: "repair" | "clips" | "stitch" }) => Promise<void>) | null>(null);

  // Shared hand-off entrypoint used both by the live `omega:bridge-reel`
  // event (when the Reel panel happens to already be mounted) and by the
  // pending-queue drain on first mount (the more common case, since the
  // Cathedral dispatches the event right before navigating to the Reel
  // view, when this listener may not yet exist).
  const acceptBridgeHandoff = useCallback((session: ReelSession, autoRun: boolean) => {
    sessionRef.current = session;
    setSession(session);
    setPhase("generation");
    setLastRepair(null);
    if (autoRun && pipelineRef.current) {
      pipelineRef.current(session).catch(() => { /* surfaced via status channel */ });
    }
  }, []);

  // The Ω-CATHEDRAL view persists a freshly-built bridge reel via saveReel
  // and then dispatches this event so the Reel hook can refresh its gallery
  // and surface the new session immediately. When `autoRun` is set on the
  // detail, we also chain repair → clips → stitch automatically so the
  // bridge feels like one-click magic instead of a queued placeholder.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ session?: ReelSession; autoRun?: boolean }>).detail;
      loadReels().then(setGallery);
      if (detail?.session) {
        // Drop the queued copy of this hand-off so a later remount does not
        // reprocess the same bridge twice (Cathedral always queues + dispatches
        // in tandem).
        drainBridgeHandoffs();
        acceptBridgeHandoff(detail.session, !!detail.autoRun);
      }
    };
    window.addEventListener("omega:bridge-reel", handler);
    // Drain any hand-offs that fired before this listener existed (e.g. the
    // user clicked Generate Bridge Reel in the Cathedral, which navigates
    // to the Reel view; the dispatch races our mount and would otherwise
    // be lost). The queue is small and one-shot per mount.
    const queued = drainBridgeHandoffs();
    if (queued.length > 0) {
      loadReels().then(setGallery);
      // Most recent hand-off wins; older ones are still saved to IDB and
      // visible in the gallery, they just don't auto-open.
      const last = queued[queued.length - 1];
      acceptBridgeHandoff(last.session, last.autoRun);
    }
    return () => window.removeEventListener("omega:bridge-reel", handler);
  }, [acceptBridgeHandoff]);

  // Cathedral / Reel cancel controls also flip cancelRef so the per-clip
  // loop breaks at its next iteration without waiting for the module
  // poll. The pipeline itself reads `isBridgeCancelRequested()` directly
  // at every stage boundary and inside the clip loop, so cancellation
  // remains effective even if this listener has been torn down by an
  // intermediate view switch.
  useEffect(() => {
    const onCancel = () => {
      cancelRef.current = true;
    };
    window.addEventListener("omega:bridge-reel-cancel", onCancel);
    return () => window.removeEventListener("omega:bridge-reel-cancel", onCancel);
  }, []);

  const persist = useCallback(async (s: ReelSession) => {
    sessionRef.current = s;
    setSession(s);
    await saveReel(s);
    const list = await loadReels();
    setGallery(list);
  }, []);

  const generateOutline = useCallback(async (theme: string, beatCount: number, aspectRatio: AspectRatio, durationSeconds: number, referencePrompts?: string[], sonataMode?: boolean, seedGlyphs?: string[]) => {
    setBusy("outline");
    setError(null);
    try {
      const r = await fetch(`${baseUrl()}api/reel/outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, beatCount, sonataMode: sonataMode === true, ...(referencePrompts?.length ? { referencePrompts } : {}), ...(seedGlyphs?.length ? { seedGlyphs } : {}) }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail ?? j?.error ?? `outline ${r.status}`);
      }
      const data = await r.json() as {
        title: string; theme: string; beats: ReelBeat[]; coherence: ReelCoherence;
      };
      const sess: ReelSession = {
        id: uid(),
        title: data.title,
        theme: data.theme,
        beats: data.beats,
        coherence: data.coherence,
        clips: data.beats.map((b) => ({ beatIndex: b.spoke, status: "pending" })),
        aspectRatio,
        durationSeconds,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await persist(sess);
      setLastRepair(null);
      setPhase("generation");
      return sess;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy("idle");
    }
  }, [persist]);

  const generateClips = useCallback(async (sess: ReelSession, shouldCancel?: () => boolean) => {
    setBusy("generating");
    setError(null);
    cancelRef.current = false;
    let working: ReelSession = { ...sess, clips: sess.clips.map((c) => ({ ...c })) };

    // Async job polling constants. Veo takes 3–5 min per clip; the proxy
    // kills synchronous connections well before that. We POST to start a
    // background job (returns { jobId } immediately) then poll
    // GET /reel/clip-status/:jobId every 4 s until done or error.
    const POLL_INTERVAL_MS = 4000;
    const MAX_POLL_MS = 10 * 60 * 1000; // 10 min hard timeout per clip
    const MAX_ATTEMPTS = 3; // retries on start-job failure

    try {
      let prevFrame = "";
      for (let i = 0; i < working.beats.length; i++) {
        // shouldCancel is the bridge auto-pipeline's module-level flag
        // (works even after the Reel view unmounts and the in-hook
        // listener is gone); cancelRef is the manual per-loop flag.
        if (cancelRef.current || shouldCancel?.()) break;
        if (working.clips[i].status === "done" && working.clips[i].video) {
          prevFrame = working.clips[i].terminalFrame ?? prevFrame;
          continue;
        }
        working.clips[i] = { ...working.clips[i], status: "running" };
        await persist({ ...working });

        let clipDone = false;
        for (let attempt = 0; attempt < MAX_ATTEMPTS && !clipDone; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 5000));
          if (cancelRef.current || shouldCancel?.()) break;
          try {
            // 1. Start the async clip job — returns immediately with { jobId }
            const startRes = await fetch(`${baseUrl()}api/reel/clip`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                beat: working.beats[i],
                prevFrame,
                aspectRatio: working.aspectRatio,
                // Beat-level override (set on transitional bridge beats from
                // /reel/repair) takes precedence over the session-wide default.
                durationSeconds: working.beats[i].durationSeconds ?? working.durationSeconds,
              }),
            });
            if (!startRes.ok) {
              const j = await startRes.json().catch(() => ({})) as Record<string, unknown>;
              throw new Error(String(j?.detail ?? j?.error ?? `clip ${startRes.status}`));
            }
            const { jobId } = await startRes.json() as { jobId: string };

            // 2. Poll for the result until done, error, or 10-min timeout
            const pollStart = Date.now();
            let data: Record<string, unknown> | null = null;

            while (Date.now() - pollStart < MAX_POLL_MS) {
              if (cancelRef.current || shouldCancel?.()) break;
              await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
              if (cancelRef.current || shouldCancel?.()) break;

              const poll = await fetch(`${baseUrl()}api/reel/clip-status/${jobId}`);
              if (!poll.ok) throw new Error(`poll ${poll.status}`);
              const status = await poll.json() as { status: string; error?: string } & Record<string, unknown>;

              if (status.status === "done") { data = status; break; }
              if (status.status === "error") throw new Error(status.error ?? "clip failed");
            }

            if (cancelRef.current || shouldCancel?.()) break;
            if (!data) throw new Error("clip generation timed out after 10 minutes");

            working.clips[i] = {
              beatIndex: working.beats[i].spoke,
              status: "done",
              video: data.video as string,
              videoMimeType: data.videoMimeType as string,
              // Store the server-assigned clip ID so stitch can read the clip
              // directly from disk instead of re-sending the base64 payload.
              clipId: typeof data.clipId === "string" ? data.clipId : undefined,
              terminalFrame: data.terminalFrame as string,
              psiScore: data.psiScore as { A: number; N: number; psi: number },
              continuity: data.continuity as ReelClip["continuity"],
              promptUsed: data.promptUsed as string,
              durationSeconds: data.appliedDurationSeconds as number,
            };
            prevFrame = (data.terminalFrame as string) || prevFrame;
            clipDone = true;
          } catch (clipErr) {
            if (attempt === MAX_ATTEMPTS - 1) {
              working.clips[i] = {
                ...working.clips[i],
                status: "error",
                error: (clipErr as Error).message,
              };
            }
          }
        }
        await persist({ ...working });
      }
      return working;
    } finally {
      setBusy("idle");
    }
  }, [persist]);

  const stitch = useCallback(async (sess: ReelSession) => {
    setBusy("stitching");
    setError(null);
    try {
      const ready = sess.clips.filter((c) => c.status === "done" && c.video);
      if (ready.length === 0) throw new Error("no completed clips to stitch");
      const beatsForStitch = ready.map((c) => {
        const beat = sess.beats.find((b) => b.spoke === c.beatIndex);
        // Aesthetic gradient B(t): use Ψ deviation from 1.0 as a proxy.
        const psi = c.psiScore?.psi ?? 1;
        const B = Math.max(0, Math.min(1, 1 - Math.abs(psi - 1)));
        return {
          B,
          durationSeconds: c.durationSeconds ?? beat?.durationSeconds ?? sess.durationSeconds,
          visualPrompt: beat?.visualPrompt ?? "",
        };
      });
      // Use clip IDs when all ready clips have a server-side cache ID so
      // the stitch request body contains only IDs (not raw base64 video).
      // Fall back to sending base64 directly for any clip without a clipId
      // (e.g. clips loaded from an older saved session or on cache miss).
      const allHaveClipId = ready.every((c) => !!c.clipId);
      const stitchBody = allHaveClipId
        ? {
            clipIds: ready.map((c) => c.clipId),
            beats: beatsForStitch,
            aspectRatio: sess.aspectRatio,
          }
        : {
            clips: ready.map((c) => c.video),
            beats: beatsForStitch,
            aspectRatio: sess.aspectRatio,
          };
      const r = await fetch(`${baseUrl()}api/reel/stitch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stitchBody),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail ?? j?.error ?? `stitch ${r.status}`);
      }
      const data = await r.json() as {
        video: string;
        videoMimeType: string;
        beatOnsets?: number[];
        resolution?: { width: number; height: number };
      };
      // Map authoritative per-beat onsets (one per ready clip, in `ready`
      // order) back onto the full clip array, then re-snap any existing
      // narration offsets so they line up with the actual stitched video.
      const onsets = Array.isArray(data.beatOnsets) ? data.beatOnsets : [];
      const onsetBySpoke = new Map<number, number>();
      let readyCursor = 0;
      const newClips = sess.clips.map((c) => {
        if (c.status === "done" && c.video) {
          const onset = onsets[readyCursor];
          readyCursor++;
          if (typeof onset === "number" && Number.isFinite(onset)) {
            onsetBySpoke.set(c.beatIndex, onset);
            return { ...c, onsetSeconds: onset };
          }
        }
        return c;
      });
      const snappedAudio = sess.audio
        ? {
            ...sess.audio,
            narration: sess.audio.narration.map((n) => {
              const snapped = onsetBySpoke.get(n.beatIndex);
              return typeof snapped === "number" && Number.isFinite(snapped)
                ? { ...n, offsetSeconds: Math.max(0, snapped) }
                : n;
            }),
          }
        : sess.audio;
      const updated: ReelSession = {
        ...sess,
        clips: newClips,
        audio: snappedAudio,
        finalVideo: data.video,
        finalMime: data.videoMimeType,
        // /reel/stitch is the authoritative source of truth for the
        // stitched output's pixel size, so we always overwrite from the
        // current response — even with `undefined` if the server omitted
        // or returned an invalid value — rather than carrying forward a
        // stale `finalResolution` from a previous stitch.
        finalResolution:
          data.resolution &&
          Number.isFinite(data.resolution.width) &&
          Number.isFinite(data.resolution.height) &&
          data.resolution.width > 0 &&
          data.resolution.height > 0
            ? { width: data.resolution.width, height: data.resolution.height }
            : undefined,
      };
      // Stamp a first-frame snapshot of the stitched video as the gallery
      // cover so each reel is instantly recognisable. Bridge reels get a
      // geodesic cover from the Cathedral hand-off (coverKind === 'bridge')
      // and we preserve that so users keep the path preview. For everything
      // else — including older reels that previously got a Ψ-curve cover —
      // we overwrite with the frame snapshot, falling back to the Ψ-curve
      // when frame extraction fails (decode error, headless env, timeout).
      if (updated.coverKind !== "bridge") {
        const frame = await extractFrameCover(data.video, data.videoMimeType, 0);
        if (frame) {
          updated.coverThumbnail = frame;
          updated.coverKind = "frame";
          updated.coverFrameSeconds = 0;
        } else if (!updated.coverThumbnail) {
          const cover = buildReelCover(updated);
          if (cover) {
            updated.coverThumbnail = cover;
            updated.coverKind = "curve";
            updated.coverFrameSeconds = undefined;
          }
        }
      }
      await persist(updated);
      setPhase("playback");
      return updated;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy("idle");
    }
  }, [persist]);

  const repair = useCallback(async (sess: ReelSession, maxIterations = 6) => {
    setBusy("repairing");
    setError(null);
    try {
      const r = await fetch(`${baseUrl()}api/reel/repair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beats: sess.beats, theme: sess.theme, maxIterations }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail ?? j?.error ?? `repair ${r.status}`);
      }
      const data = await r.json() as {
        beats: ReelBeat[];
        coherence: ReelCoherence;
        initialCoherence: { kappaHall: number };
        iterations: RepairIteration[];
        converged: boolean;
        stopReason?: RepairStopReason;
        iterationCount?: number;
        maxIterations?: number;
      };
      // After repair, the beat list may have grown — rebuild clip placeholders
      // for new beats while preserving any clips already generated for
      // surviving beats (matched by visualPrompt + spoke). Newly-inserted
      // beats are absent from oldByKey; we mark them as `bridge: pending` so
      // the outline UI can offer accept/reject/regenerate controls. Their
      // left/right neighbor info comes from the iterations payload (which
      // carries the original betweenSpokes for the κ-faulted pair).
      const beatKey = (b: { spoke: number; visualPrompt: string }) => `${b.spoke}|${b.visualPrompt}`;
      const oldByKey = new Map(sess.beats.map((b, i) => [beatKey(b), sess.clips[i]]));
      const insertedAll = data.iterations.flatMap((it) =>
        it.inserted.map((ins) => ({ ...ins, kappa: it.bridgesBefore.find((br) => br.from + 1 === ins.atIndex || br.to === ins.atIndex)?.kappa })),
      );
      // Greedy match: for each new beat that isn't in oldByKey, attach
      // bridge metadata from the inserted log. We dedupe by spoke + prompt.
      const insLookup = new Map<string, typeof insertedAll[number]>();
      for (const ins of insertedAll) insLookup.set(`${ins.spoke}|${ins.visualPrompt}`, ins);
      const annotatedBeats: ReelBeat[] = data.beats.map((b, i) => {
        if (oldByKey.has(beatKey(b))) return b;
        const ins = insLookup.get(`${b.spoke}|${b.visualPrompt}`);
        // Neighbors in the post-insertion list — use them to anchor the
        // bridge for later regenerate calls. If a neighbor is itself a
        // bridge, that's fine: regenerate uses the prompts as they stand.
        const leftNeighbor = data.beats[i - 1];
        const rightNeighbor = data.beats[i + 1];
        if (!leftNeighbor || !rightNeighbor) return b;
        return {
          ...b,
          bridge: {
            status: "pending",
            leftSpoke: ins?.betweenSpokes[0] ?? leftNeighbor.spoke,
            rightSpoke: ins?.betweenSpokes[1] ?? rightNeighbor.spoke,
            leftPrompt: leftNeighbor.visualPrompt,
            rightPrompt: rightNeighbor.visualPrompt,
            pairKappa: ins?.kappa,
          },
        };
      });
      const newClips = annotatedBeats.map((b) => {
        const prior = oldByKey.get(beatKey(b));
        return prior ? { ...prior, beatIndex: b.spoke } : { beatIndex: b.spoke, status: "pending" as const };
      });
      const updated: ReelSession = {
        ...sess,
        beats: annotatedBeats,
        clips: newClips,
        coherence: data.coherence,
      };
      const insertedCount = data.iterations.reduce((s, it) => s + it.inserted.length, 0);
      // Older API server builds may not yet emit stopReason; fall back to a
      // best-effort inference so the UI never shows an empty badge.
      const inferredStopReason: RepairStopReason = data.converged
        ? "converged"
        : insertedCount === 0
          ? "no-bridges"
          : "iteration-cap";
      const report: RepairReport = {
        initialKappaHall: data.initialCoherence.kappaHall,
        finalKappaHall: data.coherence.kappaHall,
        iterations: data.iterations,
        converged: data.converged,
        insertedCount,
        stopReason: data.stopReason ?? inferredStopReason,
        iterationCount: data.iterationCount ?? data.iterations.length,
        maxIterations,
      };
      setLastRepair(report);
      await persist(updated);
      return { session: updated, report };
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy("idle");
    }
  }, [persist]);

  const updateAudio = useCallback(async (sess: ReelSession, patch: Partial<ReelAudio>) => {
    // Always derive from the latest session (sessionRef) when it matches the
    // session id, so rapid successive edits don't overwrite each other with
    // stale snapshots from the caller's props.
    const latest = sessionRef.current && sessionRef.current.id === sess.id ? sessionRef.current : sess;
    const current = latest.audio ?? defaultAudio(latest);
    const next: ReelAudio = { ...current, ...patch };
    const updated: ReelSession = { ...latest, audio: next };
    await persist(updated);
    return updated;
  }, [persist]);

  const score = useCallback(async (sess: ReelSession) => {
    if (!sess.finalVideo) throw new Error("stitch the reel before adding audio");
    const audio = sess.audio ?? defaultAudio(sess);
    const enabledNarration = audio.narration.filter((n) => n.text.trim().length > 0);
    if (enabledNarration.length === 0 && !audio.music) {
      throw new Error("add at least one narration line or upload a music bed");
    }
    setBusy("scoring");
    setError(null);
    try {
      const r = await fetch(`${baseUrl()}api/reel/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video: sess.finalVideo,
          videoMimeType: sess.finalMime ?? "video/mp4",
          narration: enabledNarration.map((n) => ({
            text: n.text,
            voice: n.voice,
            offsetSeconds: n.offsetSeconds,
            beatIndex: n.beatIndex,
          })),
          narrationVolume: audio.narrationVolume,
          music: audio.music
            ? {
                audio: audio.music.audio,
                mimeType: audio.music.mimeType,
                volume: audio.music.volume,
              }
            : undefined,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail ?? j?.error ?? `score ${r.status}`);
      }
      const data = await r.json();
      const updated = await updateAudio(sess, {
        enabled: true,
        scoredVideo: data.video,
        scoredMime: data.videoMimeType,
        lastScoredAt: Date.now(),
      });
      return updated;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy("idle");
    }
  }, [updateAudio]);

  const draftNarration = useCallback(async (sess: ReelSession, overwrite = false) => {
    setBusy("narrating");
    setError(null);
    try {
      const r = await fetch(`${baseUrl()}api/reel/narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beats: sess.beats.map((b) => ({ spoke: b.spoke, visualPrompt: b.visualPrompt })),
          theme: sess.theme,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail ?? j?.error ?? `narrate ${r.status}`);
      }
      const data = await r.json() as { lines: string[] };
      const latest = sessionRef.current && sessionRef.current.id === sess.id ? sessionRef.current : sess;
      const current = latest.audio ?? defaultAudio(latest);
      const nextNarration: ReelNarration[] = current.narration.map((n, i) => {
        const draft = data.lines[i] ?? "";
        if (!draft) return n;
        // Preserve user edits unless they explicitly asked to overwrite.
        if (!overwrite && n.text.trim().length > 0) return n;
        return { ...n, text: draft };
      });
      const updated: ReelSession = { ...latest, audio: { ...current, narration: nextNarration } };
      await persist(updated);
      return updated;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy("idle");
    }
  }, [persist]);

  // Recompute Hall κ + bridges on the current beat list. Called after the
  // user accepts/rejects/regenerates a bridge so the coherence panel and
  // arc visualisation reflect the edited timeline.
  const recomputeCoherence = useCallback(async (beats: ReelBeat[]): Promise<ReelCoherence> => {
    const r = await fetch(`${baseUrl()}api/reel/coherence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beats }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.detail ?? j?.error ?? `coherence ${r.status}`);
    }
    const data = await r.json() as { coherence: ReelCoherence };
    return data.coherence;
  }, []);

  // Accept a single inserted bridge beat — clears its `pending` flag (we
  // keep `status: "accepted"` for telemetry) without touching the rest of
  // the timeline. No coherence recompute needed since the beat list is
  // unchanged.
  const acceptBridge = useCallback(async (beatIdx: number) => {
    if (!session) return;
    const beats = session.beats.slice();
    const b = beats[beatIdx];
    if (!b?.bridge) return;
    beats[beatIdx] = { ...b, bridge: { ...b.bridge, status: "accepted" } };
    await persist({ ...session, beats });
  }, [session, persist]);

  // Reject a single inserted bridge beat — drop the beat (and its clip
  // placeholder) and refresh κ. Other accepted bridges are untouched.
  const rejectBridge = useCallback(async (beatIdx: number) => {
    if (!session) return;
    const target = session.beats[beatIdx];
    if (!target?.bridge) return;
    const beats = session.beats.filter((_, i) => i !== beatIdx);
    const clips = session.clips.filter((_, i) => i !== beatIdx);
    setError(null);
    let coherence = session.coherence;
    try {
      coherence = await recomputeCoherence(beats);
    } catch (e) {
      setError((e as Error).message);
    }
    await persist({ ...session, beats, clips, coherence });
  }, [session, persist, recomputeCoherence]);

  // Re-ask the Hypervisor for a different transitional sentence at the same
  // midpoint spoke. Replaces only the targeted bridge beat; its clip is
  // reset to pending because the visual prompt changed.
  const regenerateBridge = useCallback(async (beatIdx: number) => {
    if (!session) return;
    const target = session.beats[beatIdx];
    if (!target?.bridge) return;
    setBusy("repairing");
    setError(null);
    try {
      const left = { spoke: target.bridge.leftSpoke, visualPrompt: target.bridge.leftPrompt };
      const right = { spoke: target.bridge.rightSpoke, visualPrompt: target.bridge.rightPrompt };
      const r = await fetch(`${baseUrl()}api/reel/repair-pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ left, right, theme: session.theme, pairKappa: target.bridge.pairKappa }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.detail ?? j?.error ?? `repair-pair ${r.status}`);
      }
      const data = await r.json() as { beat: ReelBeat };
      const beats = session.beats.slice();
      beats[beatIdx] = { ...data.beat, bridge: { ...target.bridge, status: "pending" } };
      const clips = session.clips.slice();
      clips[beatIdx] = { beatIndex: data.beat.spoke, status: "pending" };
      let coherence = session.coherence;
      try {
        coherence = await recomputeCoherence(beats);
      } catch (e) {
        setError((e as Error).message);
      }
      await persist({ ...session, beats, clips, coherence });
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy("idle");
    }
  }, [session, persist, recomputeCoherence]);

  // Snapshot a frame from the stitched video at the given timestamp and
  // promote it to the gallery cover. Pass `null` (or 0) to reset to the
  // first frame. Falls back to the Ψ-curve when frame decoding fails so
  // the gallery never ends up empty.
  const updateCover = useCallback(async (sess: ReelSession, atSeconds: number | null) => {
    if (!sess.finalVideo) throw new Error("stitch the reel before changing its cover");
    const target = atSeconds === null ? 0 : Math.max(0, atSeconds);
    const frame = await extractFrameCover(sess.finalVideo, sess.finalMime ?? "video/mp4", target);
    let updated: ReelSession;
    if (frame) {
      updated = {
        ...sess,
        coverThumbnail: frame,
        coverKind: "frame",
        coverFrameSeconds: target,
      };
    } else {
      const fallback = buildReelCover(sess);
      updated = fallback
        ? { ...sess, coverThumbnail: fallback, coverKind: "curve", coverFrameSeconds: undefined }
        : sess;
      setError("could not capture that frame — kept previous cover");
    }
    await persist(updated);
    return updated;
  }, [persist]);

  // Bridge auto-pipeline: repair (auto-insert any needed κ-bridges) → clips
  // → stitch. Mirrors the manual generation flow's success criteria — all
  // clips must finish cleanly before we stitch, and any stage failure is
  // surfaced via the bridge-pipeline-status channel so the Cathedral
  // inspector can show it even if the user has navigated away from the
  // Reel view.
  pipelineRef.current = (initial, opts) => runBridgePipeline(initial, {
    repair,
    generateClips,
    stitch,
    persist,
    getLatest: (id) =>
      sessionRef.current && sessionRef.current.id === id ? sessionRef.current : null,
    resetCancelMutex: () => { cancelRef.current = false; },
  }, opts);

  const cancel = useCallback(() => { cancelRef.current = true; }, []);

  // Resume a previously cancelled (or errored) bridge auto-pipeline run.
  // Re-runs repair → clips → stitch from the last checkpoint: if the prior
  // run got past repair, we skip it (beats already have bridge metadata)
  // and rely on generateClips' built-in skip-if-done loop to avoid
  // re-rendering finished clips. Anything else is a no-op.
  const resumePipeline = useCallback(async (sess: ReelSession) => {
    if (!pipelineRef.current) return;
    const state = sess.pipelineState;
    if (!state || (state.kind !== "cancelled" && state.kind !== "error")) return;
    sessionRef.current = sess;
    setSession(sess);
    setPhase("generation");
    setLastRepair(null);
    try {
      await pipelineRef.current(sess, { startStage: state.stage, resumedFrom: state.stage });
    } catch {
      /* surfaced via status channel + reel.error */
    }
  }, []);

  const reset = useCallback(() => {
    setSession(null);
    setPhase("outline");
    setError(null);
    setLastRepair(null);
  }, []);

  const openSession = useCallback((s: ReelSession) => {
    // Backfill a Ψ-curve cover for older reels persisted before covers
    // were stamped at stitch time, so the gallery looks uniform without
    // any extra user action.
    let opened = s;
    if (!opened.coverThumbnail) {
      const cover = buildReelCover(opened);
      if (cover) {
        opened = { ...opened, coverThumbnail: cover, coverKind: "curve" };
        persist(opened).catch(() => { /* IDB best-effort */ });
      }
    } else if (!opened.coverKind) {
      // Migration for reels persisted before `coverKind` existed: the
      // Ψ-curve cover always includes a dashed Ψ=1 guideline, while the
      // bridge geodesic cover does not — use that as a robust marker so a
      // future stitch knows whether it can overwrite.
      const decoded = decodeURIComponent(opened.coverThumbnail);
      const inferred: "curve" | "bridge" = decoded.includes("stroke-dasharray") ? "curve" : "bridge";
      opened = { ...opened, coverKind: inferred };
      persist(opened).catch(() => { /* IDB best-effort */ });
    }
    setSession(opened);
    setPhase(opened.finalVideo ? "playback" : "generation");
    // Repair telemetry is per-session — drop it when switching sessions so
    // we don't show stale κ trajectories from a different reel.
    setLastRepair(null);
  }, [persist]);

  const removeFromGallery = useCallback(async (id: string) => {
    await deleteReel(id);
    setGallery(await loadReels());
  }, []);

  return {
    session,
    setSession,
    gallery,
    phase,
    setPhase,
    busy,
    error,
    lastRepair,
    generateOutline,
    generateClips,
    stitch,
    repair,
    score,
    draftNarration,
    updateAudio,
    acceptBridge,
    rejectBridge,
    regenerateBridge,
    updateCover,
    cancel,
    resumePipeline,
    reset,
    openSession,
    removeFromGallery,
  };
}

export type { ReelSession, ReelClip, ReelBeat, ReelCoherence, ReelAudio, ReelNarration, ReelMusic };
