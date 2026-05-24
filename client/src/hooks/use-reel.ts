/**
 * Ω-REEL State Machine Hook
 * Manages outline → generation → playback phases with IDB persistence.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { ReelSession, BeatDraft } from "@/lib/reel-store";
import { saveReel, loadReel, makeSession } from "@/lib/reel-store";
import { computeNarrativeCoherence } from "@/lib/narrative-coherence";
import type { CoherenceReport } from "@/lib/narrative-coherence";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

async function apiFetch(path: string, body?: unknown) {
  const resp = await fetch(path, {
    method: body !== undefined ? "POST" : "GET",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error ?? `HTTP ${resp.status}`);
  }
  return resp.json();
}

export type ReelPhase = "outline" | "generation" | "playback";

export interface UseReelState {
  session: ReelSession | null;
  phase: ReelPhase;
  beats: BeatDraft[];
  coherence: CoherenceReport | null;
  mp4Base64: string | null;
  beatOnsets: number[];
  isGeneratingOutline: boolean;
  isRepairing: boolean;
  isStitching: boolean;
  isScoring: boolean;
  error: string | null;
  progress: number;
}

export interface UseReelActions {
  initSession: (theme: string, options?: { articleId?: string; articleSource?: string }) => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  generateOutline: (beatCount: number) => Promise<void>;
  repairCoherence: () => Promise<void>;
  repairPair: (i: number, j: number) => Promise<void>;
  startGeneration: () => void;
  cancelGeneration: () => void;
  stitch: () => Promise<void>;
  stitchPartial: () => Promise<void>;
  addNarration: (items: Array<{ text: string; offsetMs: number }>, voice: string) => Promise<void>;
  updateBeat: (index: number, updates: Partial<BeatDraft>) => void;
  setPhase: (phase: ReelPhase) => void;
  reset: () => void;
}

export function useReel(): UseReelState & UseReelActions {
  const [session, setSession] = useState<ReelSession | null>(null);
  const [phase, setPhaseState] = useState<ReelPhase>("outline");
  const [beats, setBeats] = useState<BeatDraft[]>([]);
  const [coherence, setCoherence] = useState<CoherenceReport | null>(null);
  const [mp4Base64, setMp4Base64] = useState<string | null>(null);
  const [beatOnsets, setBeatOnsets] = useState<number[]>([]);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isStitching, setIsStitching] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const cancelFlagRef = useRef(false);
  const sessionRef = useRef<ReelSession | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persist = useCallback(async (updates: Partial<ReelSession>) => {
    const base = sessionRef.current;
    if (!base) return;
    const next: ReelSession = { ...base, ...updates, updatedAt: Date.now() };
    sessionRef.current = next;
    setSession(next);
    await saveReel(next).catch((e) => console.warn("[use-reel] persist failed:", e.message));
  }, []);

  const initSession = useCallback(
    async (theme: string, options: { articleId?: string; articleSource?: string } = {}) => {
      const s = makeSession(theme, {
        articleId: options.articleId,
        articleSource: options.articleSource,
      });
      sessionRef.current = s;
      setSession(s);
      setBeats([]);
      setCoherence(null);
      setMp4Base64(null);
      setBeatOnsets([]);
      setPhaseState("outline");
      setError(null);
      await saveReel(s);
    },
    []
  );

  // Inline beat status update used by resumePolling (avoids forward-ref to updateBeat)
  const applyBeatUpdate = useCallback((index: number, updates: Partial<BeatDraft>) => {
    setBeats((prev) => {
      const next = prev.map((b) => (b.index === index ? { ...b, ...updates } : b));
      persist({ beats: next });
      return next;
    });
  }, [persist]);

  const resumePolling = useCallback((loadedBeats: BeatDraft[]) => {
    const pendingBeats = loadedBeats.filter((b) => b.jobId && b.status !== "done" && b.status !== "error");
    if (pendingBeats.length === 0) return;

    cancelFlagRef.current = false;
    const pollStart = Date.now();

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      if (cancelFlagRef.current) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        return;
      }

      let done = 0;
      const currentBeats = sessionRef.current?.beats ?? [];
      const total = currentBeats.filter((b) => b.jobId).length;

      for (const beat of currentBeats) {
        if (!beat.jobId) continue;
        if (beat.status === "done") { done++; continue; }
        if (beat.status === "error") continue;

        if (Date.now() - pollStart > POLL_TIMEOUT_MS) {
          applyBeatUpdate(beat.index, { status: "error" });
          continue;
        }
        try {
          const status = await apiFetch(`/api/reel/clip-status/${beat.jobId}`);
          if (status.status === "done") {
            applyBeatUpdate(beat.index, { status: "done", psiScore: status.psiScore });
            done++;
          } else if (status.status === "error") {
            applyBeatUpdate(beat.index, { status: "error" });
          }
        } catch { /* ignore */ }
      }

      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      setProgress(pct);
      if (done === total && total > 0) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      }
    }, POLL_INTERVAL_MS);
  }, [applyBeatUpdate]);

  const loadSession = useCallback(async (id: string) => {
    const s = await loadReel(id);
    if (!s) { setError("Session not found"); return; }
    sessionRef.current = s;
    setSession(s);
    setBeats(s.beats ?? []);
    setPhaseState(s.phase ?? "outline");
    setMp4Base64(s.mp4Base64 ?? null);
    setBeatOnsets(s.beatOnsets ?? []);
    if (s.beats.length > 0) {
      const prompts = s.beats.map((b) => b.prompt);
      setCoherence(computeNarrativeCoherence(prompts));
    }
    // Auto-resume polling if session was mid-generation
    if (s.phase === "generation") {
      const pendingBeats = s.beats.filter((b) => b.jobId && b.status !== "done" && b.status !== "error");
      if (pendingBeats.length > 0) {
        resumePolling(s.beats);
      }
    }
  }, [resumePolling]);

  const generateOutline = useCallback(
    async (beatCount: number) => {
      const s = sessionRef.current;
      if (!s) { setError("No active session"); return; }
      setIsGeneratingOutline(true);
      setError(null);
      try {
        const data = await apiFetch("/api/reel/outline", {
          theme: s.theme,
          beatCount,
        });
        const newBeats: BeatDraft[] = (data.beats ?? []).map((b: any) => ({
          index: b.index,
          act: b.act,
          prompt: b.prompt,
          mood: b.mood ?? "cinematic",
          palette: b.palette ?? "neutral",
          status: "pending" as const,
        }));
        setBeats(newBeats);
        setCoherence(data.coherence ?? computeNarrativeCoherence(newBeats.map((b) => b.prompt)));
        await persist({ beats: newBeats, beatCount: newBeats.length });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsGeneratingOutline(false);
      }
    },
    [persist]
  );

  const repairCoherence = useCallback(async () => {
    const prompts = beats.map((b) => b.prompt);
    if (prompts.length < 2) return;
    setIsRepairing(true);
    setError(null);
    try {
      const data = await apiFetch("/api/reel/repair", { beats: prompts });
      const repairedBeats = data.beats as string[];
      const next: BeatDraft[] = repairedBeats.map((p: string, i: number) => ({
        index: i,
        act: beats[i]?.act ?? `Beat ${i + 1}`,
        prompt: p,
        mood: beats[i]?.mood ?? "cinematic",
        palette: beats[i]?.palette ?? "neutral",
        status: "pending" as const,
      }));
      setBeats(next);
      setCoherence(data.coherence);
      await persist({ beats: next });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsRepairing(false);
    }
  }, [beats, persist]);

  const repairPair = useCallback(
    async (i: number, j: number) => {
      if (i < 0 || j >= beats.length) return;
      try {
        const data = await apiFetch("/api/reel/repair-pair", {
          beatA: beats[i].prompt,
          beatB: beats[j].prompt,
          index: i,
        });
        const bridge: BeatDraft = {
          index: i + 1,
          act: "Transition",
          prompt: data.bridge,
          mood: "transitional",
          palette: "neutral",
          status: "pending",
        };
        const next = [
          ...beats.slice(0, i + 1),
          bridge,
          ...beats.slice(j).map((b, k) => ({ ...b, index: i + 2 + k })),
        ];
        setBeats(next);
        setCoherence(computeNarrativeCoherence(next.map((b) => b.prompt)));
        await persist({ beats: next });
      } catch (e: any) {
        setError(e.message);
      }
    },
    [beats, persist]
  );

  const updateBeat = useCallback(
    (index: number, updates: Partial<BeatDraft>) => {
      setBeats((prev) => {
        const next = prev.map((b) => (b.index === index ? { ...b, ...updates } : b));
        const prompts = next.map((b) => b.prompt);
        setCoherence(computeNarrativeCoherence(prompts));
        persist({ beats: next });
        return next;
      });
    },
    [persist]
  );

  const setPhase = useCallback(
    (p: ReelPhase) => {
      setPhaseState(p);
      persist({ phase: p });
    },
    [persist]
  );

  const startGeneration = useCallback(() => {
    if (beats.length === 0) { setError("Generate outline first"); return; }
    cancelFlagRef.current = false;
    setPhase("generation");
    setProgress(0);

    const doGenerate = async () => {
      const startTime = Date.now();
      const pollStart: Record<number, number> = {};

      // Enqueue all clip jobs
      const jobIds: string[] = [];
      for (let i = 0; i < beats.length; i++) {
        if (cancelFlagRef.current) break;
        try {
          const data = await apiFetch("/api/reel/clip", {
            prompt: beats[i].prompt,
            beatIndex: i,
            durationSeconds: 6,
          });
          jobIds[i] = data.jobId;
          pollStart[i] = Date.now();
          updateBeat(i, { jobId: data.jobId, status: "running" });
        } catch (e: any) {
          updateBeat(i, { status: "error" });
        }
      }

      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      pollTimerRef.current = setInterval(async () => {
        if (cancelFlagRef.current) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          return;
        }

        let done = 0;
        let total = jobIds.filter(Boolean).length;

        for (let i = 0; i < beats.length; i++) {
          const jobId = jobIds[i];
          if (!jobId) continue;

          const beat = beats.find((b) => b.index === i);
          if (!beat || beat.status === "done" || beat.status === "error") {
            if (beat?.status === "done") done++;
            continue;
          }

          const elapsed = Date.now() - (pollStart[i] ?? startTime);
          if (elapsed > POLL_TIMEOUT_MS) {
            updateBeat(i, { status: "error" });
            continue;
          }

          try {
            const status = await apiFetch(`/api/reel/clip-status/${jobId}`);
            if (status.status === "done") {
              updateBeat(i, { status: "done", psiScore: status.psiScore });
              done++;
            } else if (status.status === "error") {
              updateBeat(i, { status: "error" });
            }
          } catch { /* ignore poll errors */ }
        }

        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        setProgress(pct);

        if (done === total && total > 0) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      }, POLL_INTERVAL_MS);
    };

    doGenerate().catch((e) => setError(e.message));
  }, [beats, updateBeat, setPhase]);

  const cancelGeneration = useCallback(() => {
    cancelFlagRef.current = true;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    persist({ phase: "outline" });
    setPhaseState("outline");
  }, [persist]);

  const stitchInternal = useCallback(
    async (partial: boolean) => {
      const doneBeats = beats.filter((b) => b.status === "done" && b.jobId);
      if (doneBeats.length === 0) { setError("No completed clips to stitch"); return; }
      if (!partial && doneBeats.length < beats.length) {
        setError(`All ${beats.length} clips must finish before full stitch (${doneBeats.length} done). Use "Stitch Partial" to proceed early.`);
        return;
      }
      setIsStitching(true);
      setError(null);
      try {
        const data = await apiFetch("/api/reel/stitch", {
          jobIds: doneBeats.map((b) => b.jobId),
          beatPrompts: doneBeats.map((b) => b.prompt),
        });
        setMp4Base64(data.mp4Base64);
        setBeatOnsets(data.beatOnsets ?? [0]);
        await persist({
          mp4Base64: data.mp4Base64,
          beatOnsets: data.beatOnsets ?? [0],
          phase: "playback",
        });
        setPhaseState("playback");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsStitching(false);
      }
    },
    [beats, persist]
  );

  const stitch = useCallback(() => stitchInternal(false), [stitchInternal]);
  const stitchPartial = useCallback(() => stitchInternal(true), [stitchInternal]);

  const addNarration = useCallback(
    async (items: Array<{ text: string; offsetMs: number }>, voice: string) => {
      if (!mp4Base64) { setError("No video to score"); return; }
      setIsScoring(true);
      setError(null);
      try {
        const data = await apiFetch("/api/reel/score", {
          mp4Base64,
          narrationItems: items,
          voice,
        });
        setMp4Base64(data.mp4Base64);
        await persist({ mp4Base64: data.mp4Base64 });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsScoring(false);
      }
    },
    [mp4Base64, persist]
  );

  const reset = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    cancelFlagRef.current = true;
    sessionRef.current = null;
    setSession(null);
    setBeats([]);
    setCoherence(null);
    setMp4Base64(null);
    setBeatOnsets([]);
    setPhaseState("outline");
    setError(null);
    setProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  return {
    session,
    phase,
    beats,
    coherence,
    mp4Base64,
    beatOnsets,
    isGeneratingOutline,
    isRepairing,
    isStitching,
    isScoring,
    error,
    progress,
    initSession,
    loadSession,
    generateOutline,
    repairCoherence,
    repairPair,
    startGeneration,
    cancelGeneration,
    stitch,
    stitchPartial,
    addNarration,
    updateBeat,
    setPhase,
    reset,
  };
}
