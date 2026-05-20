import test from "node:test";
import assert from "node:assert/strict";

// The bridge-pipeline-status module dispatches CustomEvents on `window`.
// In a bare Node process there's no `window`, so install a minimal
// EventTarget shim before the module is imported.
if (typeof (globalThis as { window?: unknown }).window === "undefined") {
  (globalThis as { window?: EventTarget }).window = new EventTarget();
}

import {
  runBridgePipeline,
  type BridgePipelineDeps,
} from "../src/hooks/use-reel.ts";
import type {
  ReelSession,
  ReelClip,
  ReelBeat,
  ReelCoherence,
} from "../src/lib/reel-store.ts";
import {
  consumeBridgeCancelRequest,
  requestBridgeCancel,
  clearBridgeStatus,
  getLastBridgeStatus,
} from "../src/lib/bridge-pipeline-status.ts";

function makeBeat(spoke: number, prompt = `prompt-${spoke}`): ReelBeat {
  return {
    index: spoke,
    spoke,
    visualPrompt: prompt,
    psiTarget: 1,
    A: 0,
    N: 0,
    sigma: 0,
    gamma: 0,
    phi: 0,
  };
}

function makeDoneClip(spoke: number, video = `vid-${spoke}`): ReelClip {
  return {
    beatIndex: spoke,
    status: "done",
    video,
    videoMimeType: "video/mp4",
    terminalFrame: `frame-${spoke}`,
    durationSeconds: 4,
  };
}

function makeCoherence(): ReelCoherence {
  return {
    kappa: 0,
    kappaHall: 0,
    kappaMax: 1,
    eta: 0,
    observerPresence: 0,
    bridges: [],
  };
}

function makeSession(overrides: Partial<ReelSession> = {}): ReelSession {
  const beats = overrides.beats ?? [makeBeat(0), makeBeat(1), makeBeat(2)];
  const clips =
    overrides.clips ?? beats.map((b) => makeDoneClip(b.spoke));
  return {
    id: "reel-test",
    title: "Test Reel",
    theme: "test theme",
    beats,
    clips,
    coherence: makeCoherence(),
    aspectRatio: "9:16",
    durationSeconds: 4,
    createdAt: 1,
    updatedAt: 1,
    pipelineState: { kind: "cancelled", stage: "clips", updatedAt: 1 },
    ...overrides,
  };
}

type SpyDeps = BridgePipelineDeps & {
  calls: {
    repair: ReelSession[];
    generateClips: Array<{ session: ReelSession; cancelHit?: boolean }>;
    stitch: ReelSession[];
    persist: ReelSession[];
  };
};

function makeDeps(opts: {
  session: ReelSession;
  // If set, generateClips returns this in lieu of echoing input.
  generateClipsResult?: ReelSession;
  // If set, repair returns this updated session.
  repairResult?: ReelSession;
} = { session: makeSession() }): SpyDeps {
  const latestById = new Map<string, ReelSession>();
  latestById.set(opts.session.id, opts.session);
  const calls: SpyDeps["calls"] = {
    repair: [],
    generateClips: [],
    stitch: [],
    persist: [],
  };
  return {
    calls,
    repair: async (s) => {
      calls.repair.push(s);
      const session = opts.repairResult ?? s;
      latestById.set(session.id, session);
      return { session, report: {
        initialKappaHall: 0,
        finalKappaHall: 0,
        iterations: [],
        converged: true,
        insertedCount: 0,
      }};
    },
    generateClips: async (s) => {
      calls.generateClips.push({ session: s });
      const out = opts.generateClipsResult ?? s;
      latestById.set(out.id, out);
      return out;
    },
    stitch: async (s) => {
      calls.stitch.push(s);
      const out: ReelSession = { ...s, finalVideo: "stitched", finalMime: "video/mp4" };
      latestById.set(out.id, out);
      return out;
    },
    persist: async (s) => {
      calls.persist.push(s);
      latestById.set(s.id, s);
    },
    getLatest: (id) => latestById.get(id) ?? null,
    resetCancelMutex: () => { /* noop in tests */ },
  };
}

test.beforeEach(() => {
  // Drain any leftover cancel flag and pipeline status from prior tests so
  // each case starts from a clean module state.
  consumeBridgeCancelRequest();
  clearBridgeStatus();
});

test("resume from 'clips' stage skips repair but still runs clips and stitch", async () => {
  const session = makeSession();
  const deps = makeDeps({ session });

  await runBridgePipeline(session, deps, { startStage: "clips" });

  assert.equal(deps.calls.repair.length, 0, "repair must not run on clips-stage resume");
  assert.equal(deps.calls.generateClips.length, 1, "generateClips runs once");
  assert.equal(deps.calls.stitch.length, 1, "stitch runs once after clips");
});

test("resume from 'stitch' stage skips both repair and clip generation", async () => {
  const session = makeSession();
  const deps = makeDeps({ session });

  await runBridgePipeline(session, deps, { startStage: "stitch" });

  assert.equal(deps.calls.repair.length, 0, "repair must not run on stitch-stage resume");
  assert.equal(deps.calls.generateClips.length, 0, "generateClips must not run on stitch-stage resume");
  assert.equal(deps.calls.stitch.length, 1, "stitch runs once");
});

test("default (no startStage) runs the full repair → clips → stitch pipeline", async () => {
  const session = makeSession({ pipelineState: undefined });
  const deps = makeDeps({ session });

  await runBridgePipeline(session, deps);

  assert.equal(deps.calls.repair.length, 1);
  assert.equal(deps.calls.generateClips.length, 1);
  assert.equal(deps.calls.stitch.length, 1);
});

test("resume passes the original session — with its already-done clips intact — to generateClips", async () => {
  const beats = [makeBeat(0), makeBeat(1), makeBeat(2)];
  // Two clips already done from the prior cancelled run; one still pending.
  const clips: ReelClip[] = [
    makeDoneClip(0),
    makeDoneClip(1),
    { beatIndex: 2, status: "pending" },
  ];
  const session = makeSession({ beats, clips });
  // Simulate generateClips finishing the remaining pending clip while
  // preserving the already-done ones (the real loop's skip-if-done branch
  // does exactly this).
  const finished: ReelSession = {
    ...session,
    clips: [clips[0], clips[1], makeDoneClip(2)],
  };
  const deps = makeDeps({ session, generateClipsResult: finished });

  await runBridgePipeline(session, deps, { startStage: "clips" });

  assert.equal(deps.calls.generateClips.length, 1);
  const handed = deps.calls.generateClips[0].session;
  // The done clips must be passed through untouched so generateClips' built-in
  // skip-if-done loop can avoid re-rendering them.
  assert.equal(handed.clips[0].status, "done");
  assert.equal(handed.clips[0].video, "vid-0");
  assert.equal(handed.clips[1].status, "done");
  assert.equal(handed.clips[1].video, "vid-1");
  assert.equal(handed.clips[2].status, "pending");
});

test("after a successful resume run, pipelineState is checkpointed as 'complete'", async () => {
  const session = makeSession();
  const deps = makeDeps({ session });

  await runBridgePipeline(session, deps, { startStage: "clips" });

  // Final persist must clear the lingering 'cancelled' state.
  const last = deps.calls.persist[deps.calls.persist.length - 1];
  assert.ok(last.pipelineState, "final persisted session must carry pipelineState");
  assert.equal(last.pipelineState!.kind, "complete");
  assert.equal(last.pipelineState!.stage, "stitch");
  // Bridge status broadcaster also reports completion.
  assert.equal(getLastBridgeStatus().kind, "complete");
});

test("resume from 'clips' that fails halts before stitch with a descriptive error", async () => {
  // Pipeline should halt only when ALL clips fail (none done). If at least
  // one clip succeeds, the pipeline now proceeds to stitch with partial results.
  const session = makeSession();
  const allFailed: ReelSession = {
    ...session,
    clips: [
      { beatIndex: 0, status: "error", error: "model 503" },
      { beatIndex: 1, status: "error", error: "model 503" },
      { beatIndex: 2, status: "error", error: "model 503" },
    ],
  };
  const deps = makeDeps({ session, generateClipsResult: allFailed });

  await assert.rejects(
    () => runBridgePipeline(session, deps, { startStage: "clips" }),
    /halted/,
  );
  assert.equal(deps.calls.stitch.length, 0, "stitch must not run when all clips failed");
  // Last persisted state should reflect the error checkpoint, not 'complete'.
  const last = deps.calls.persist[deps.calls.persist.length - 1];
  assert.equal(last.pipelineState!.kind, "error");
  assert.equal(getLastBridgeStatus().kind, "error");
});

test("a cancel request mid-resume short-circuits remaining stages and emits 'cancelled'", async () => {
  const session = makeSession();
  const deps = makeDeps({ session });
  // Race: trigger cancel after generateClips runs, before stitch is invoked.
  const orig = deps.generateClips;
  deps.generateClips = async (s, cancelHit) => {
    const out = await orig(s, cancelHit);
    requestBridgeCancel();
    return out;
  };

  await runBridgePipeline(session, deps, { startStage: "clips" });

  assert.equal(deps.calls.stitch.length, 0, "stitch must not run after cancel");
  const status = getLastBridgeStatus();
  assert.equal(status.kind, "cancelled");
  // The cancel flag must be drained so the next run starts clean.
  assert.equal(consumeBridgeCancelRequest(), false);
  const last = deps.calls.persist[deps.calls.persist.length - 1];
  assert.equal(last.pipelineState!.kind, "cancelled");
});
