import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  computeNarrativeCoherence,
  transitionSpecFromB,
  KAPPA_MAX,
  ETA,
  VIEWER_PRESENCE_GAP,
} from "../src/lib/narrative-coherence.js";
import { repairProgressStalled } from "../src/routes/reel.js";

test("transitionSpecFromB: high B(t) → tighter cut, low B(t) → longer crossfade", () => {
  const tight = transitionSpecFromB(1, false);
  const soft = transitionSpecFromB(0, false);
  assert.equal(tight.transition, "fade");
  assert.equal(soft.transition, "fade");
  assert.ok(tight.duration < soft.duration, "high B should give shorter xfade");
  assert.ok(tight.duration >= 0.2 && tight.duration <= 0.9);
  assert.ok(soft.duration >= 0.2 && soft.duration <= 0.9);
  assert.equal(tight.isBridge, false);
});

test("transitionSpecFromB: bridge pairs always render fadeblack at 0.5s", () => {
  const bridge = transitionSpecFromB(0.7, true);
  assert.equal(bridge.transition, "fadeblack");
  assert.equal(bridge.duration, 0.5);
  assert.equal(bridge.isBridge, true);
});

test("transitionSpecFromB: B is clamped to [0,1]", () => {
  const lo = transitionSpecFromB(-2, false);
  const hi = transitionSpecFromB(5, false);
  assert.equal(lo.duration, transitionSpecFromB(0, false).duration);
  assert.equal(hi.duration, transitionSpecFromB(1, false).duration);
});

test("computeNarrativeCoherence: produces full Hall matrices and κ ≤ κ_max for similar prompts", async () => {
  const beats = Array.from({ length: 6 }, (_, i) => ({
    visualPrompt: `Bioluminescent forest at twilight, beat ${i}, slow camera dolly`,
  }));
  const c = await computeNarrativeCoherence(beats);
  assert.equal(c.matrix.length, 6);
  assert.equal(c.matrixHall.length, 6);
  assert.equal(c.matrixHall[0].length, 6);
  // Hall regularization shifts the diagonal up by ETA.
  assert.ok(Math.abs(c.matrixHall[0][0] - (c.matrix[0][0] + ETA)) < 1e-9);
  assert.equal(c.observerPresence, VIEWER_PRESENCE_GAP);
  assert.ok(c.conditionNumberHall > 0);
});

test("computeNarrativeCoherence: stalled (near-identical) adjacent prompts trigger bridge flag", async () => {
  // Adjacent beats with the same vocabulary collapse the 2x2 Gram block
  // toward rank-1, pushing per-pair κ above the calibrated KAPPA_MAX=12.
  const beats = [
    { visualPrompt: "lone monolith pulses on a mirrored desert at dawn" },
    { visualPrompt: "lone monolith pulses on a mirrored desert at dawn" },
    { visualPrompt: "alpine waterfall thunders down moss cliff, telephoto" },
  ];
  const c = await computeNarrativeCoherence(beats);
  assert.ok(c.bridges.length >= 1, "expected bridge flag on duplicate adjacent beats");
  for (const br of c.bridges) {
    assert.ok(br.kappa > KAPPA_MAX);
    assert.ok(br.from >= 0 && br.to === br.from + 1);
  }
});

test("POST /api/reel/repair: reduces κ_H and clears bridges on a stalled-beat fixture", async () => {
  // Mock the Hypervisor's bridge synthesis so the test stays offline; the
  // synthesised prompt deliberately uses fresh vocabulary so the inserted
  // beat is near-orthogonal to both neighbors → its 2x2 blocks drop κ
  // below the calibrated KAPPA_MAX.
  const mod = await import("../src/model-tiers.js");
  const originalOR = mod.openrouter.chat.completions.create;
  // Each mocked bridge synthesis returns a *distinct* fresh-vocabulary prompt
  // so the inserted bridges contribute new dimensions to the Gram matrix
  // (otherwise N identical bridges + N identical originals stay rank-2 and
  // κ_H is mathematically pinned to (n+η)/η regardless of pair-level repair).
  const bridgeVariants = [
    "soft chromatic ribbons sweep across an empty stage, drifting overhead light",
    "warm amber dust motes drift through a quiet library window at noon",
    "translucent jellyfish glide above a coral lagoon under turquoise haze",
    "wide aurora curtains ripple over a frozen lake, telephoto crawl",
  ];
  let bridgeCallIdx = 0;
  const mockImpl = async () => ({
    choices: [{
      message: {
        content: JSON.stringify({
          visualPrompt: bridgeVariants[bridgeCallIdx++ % bridgeVariants.length],
          durationSeconds: 1.5,
        }),
      },
    }],
  });
  (mod.openrouter.chat.completions as unknown as { create: unknown }).create = mockImpl;
  try {
    const beats = [
      { visualPrompt: "lone monolith pulses on a mirrored desert at dawn, slow orbit" },
      { visualPrompt: "lone monolith pulses on a mirrored desert at dawn, slow orbit" },
      { visualPrompt: "lone monolith pulses on a mirrored desert at dawn, slow orbit" },
    ];
    const before = await computeNarrativeCoherence(beats);
    assert.ok(before.bridges.length >= 1, "fixture must produce bridges before repair");

    const res = await request(app)
      .post("/api/reel/repair")
      .send({ beats, theme: "stalled monolith", maxIterations: 3 });
    assert.equal(res.status, 200, `body=${JSON.stringify(res.body)}`);
    assert.ok(res.body.iterations.length >= 1);
    // κ_H must strictly drop after repair, and the final bridge list must
    // be empty (or at least shorter than the initial flag set).
    assert.ok(
      res.body.coherence.kappaHall < res.body.initialCoherence.kappaHall,
      `κ_H after=${res.body.coherence.kappaHall} did not drop below before=${res.body.initialCoherence.kappaHall}`,
    );
    assert.ok(
      res.body.coherence.bridges.length < res.body.initialCoherence.bridges.length ||
        res.body.coherence.bridges.length === 0,
      "repair must clear at least one bridge",
    );
    // At least one bridge beat was inserted.
    assert.ok(res.body.beats.length > beats.length);
  } finally {
    (mod.openrouter.chat.completions as unknown as { create: typeof originalOR }).create = originalOR;
  }
});

test("POST /api/reel/repair: never regenerates the same flagged beat twice across passes with overlapping near-duplicates", async () => {
  // Five near-identical adjacent beats produce 4 overlapping bridge flags
  // ((0,1),(1,2),(2,3),(3,4)). The duplicate-breaking synth path must run at
  // most once per beat per /reel/repair call — even when residual κ ≥ 20
  // flags re-appear in a later pass on a beat that was already regenerated.
  const mod = await import("../src/model-tiers.js");
  const originalOR = mod.openrouter.chat.completions.create;
  // Every beat in the system — original, bridge, or regenerated — needs a
  // globally unique visualPrompt so the mock can identify the underlying
  // object across in-place insertions, AND the offline char-bag cosine
  // must stay ≈ 1 so bridges keep getting flagged across passes (the exact
  // stalled-coherence condition that caused the redundant-regen bug).
  // The char-bag tokenizer strips `[^a-z0-9 ]` to spaces and drops empty
  // tokens, so trailing exclamation marks distinguish the strings without
  // perturbing the token bag (cosine remains exactly 1.0).
  // A regen call is identified by left.visualPrompt == the immediately
  // preceding synth output: /reel/repair builds the regen call with the
  // just-created bridge beat as the left argument, while a normal bridge
  // call's left is some pre-existing beat in the array.
  // We additionally track every prompt that was produced by a prior regen
  // call ("replacement prompts"). The bug manifests when a later regen
  // call's right beat carries one of those prompts — i.e. the duplicate-
  // breaking synth is firing on a beat that was itself just regenerated.
  const replacementPrompts = new Set<string>();
  const reRegenOfReplacement: string[] = [];
  const regenRightPrompts: string[] = [];
  let lastSynthOutput = "";
  let synthIdx = 0;
  const regenMockImpl = async (params: {
    messages: Array<{ role: string; content: string }>;
  }) => {
    const userMsg = String(params.messages.find((m) => m.role === "user")?.content ?? "");
    const prevMatch = userMsg.match(/Previous beat \(spoke \d+\/24, [^)]*\): """([^"]+)"""/);
    const nextMatch = userMsg.match(/Next beat \(spoke \d+\/24, [^)]*\): """([^"]+)"""/);
    let isRegen = false;
    if (prevMatch && nextMatch) {
      const leftPrompt = prevMatch[1];
      const rightPrompt = nextMatch[1];
      if (lastSynthOutput && leftPrompt === lastSynthOutput) {
        isRegen = true;
        regenRightPrompts.push(rightPrompt);
        if (replacementPrompts.has(rightPrompt)) reRegenOfReplacement.push(rightPrompt);
      }
    }
    const id = synthIdx++;
    const out = `lone monolith pulses on a mirrored desert at dawn, slow orbit${"!".repeat(50 + id)}`;
    if (isRegen) replacementPrompts.add(out);
    lastSynthOutput = out;
    return {
      choices: [{
        message: { content: JSON.stringify({ visualPrompt: out, durationSeconds: 1.5 }) },
      }],
    };
  };
  (mod.openrouter.chat.completions as unknown as { create: unknown }).create = regenMockImpl;
  try {
    const beats = Array.from({ length: 5 }, (_, i) => ({
      visualPrompt: `lone monolith pulses on a mirrored desert at dawn, slow orbit${".".repeat(i + 1)}`,
    }));
    const res = await request(app)
      .post("/api/reel/repair")
      .send({ beats, theme: "stalled monolith", maxIterations: 3 });
    assert.equal(res.status, 200, `body=${JSON.stringify(res.body)}`);

    // Invariant: no duplicate-breaking regen call ever targets a beat that
    // was itself produced by a prior regen call. Without the fix, R1..R4
    // from pass 1 are re-regenerated as the right of pass-2 bridges, so
    // their replacement prompts re-appear as `right.visualPrompt` here.
    assert.deepEqual(
      reRegenOfReplacement,
      [],
      `repair re-regenerated already-regenerated beats: ${JSON.stringify(reRegenOfReplacement)}`,
    );
    // Sanity: the repair did exercise the duplicate-breaking path at least
    // once on this fixture (otherwise the test would pass vacuously).
    assert.ok(regenRightPrompts.length >= 1, "expected at least one duplicate-breaking regen call");
  } finally {
    (mod.openrouter.chat.completions as unknown as { create: typeof originalOR }).create = originalOR;
  }
});

test("repairProgressStalled: returns false when κ_H drops past threshold AND bridge count shrinks (loop should continue)", () => {
  // The healthy path: pass made meaningful progress on both axes, so the
  // outer loop must keep iterating until convergence or the iteration cap.
  assert.equal(
    repairProgressStalled({
      prevKappaHall: 100,
      currKappaHall: 50, // delta = 50 ≥ threshold
      prevBridgeCount: 4,
      currBridgeCount: 2, // shrunk
      threshold: 0.5,
    }),
    false,
  );
});

test("repairProgressStalled: returns true when κ_H is stalled even if bridge count shrunk (κ-stall branch)", () => {
  // κ_H barely budged. The bridge count shrinking on its own is not enough
  // to justify another expensive synth pass — pair-level fixes that don't
  // move the global condition number burn calls without improving coherence.
  assert.equal(
    repairProgressStalled({
      prevKappaHall: 100,
      currKappaHall: 99.8, // delta = 0.2 < 0.5 threshold
      prevBridgeCount: 4,
      currBridgeCount: 3, // shrunk
      threshold: 0.5,
    }),
    true,
  );
});

test("repairProgressStalled: returns true when bridge count fails to shrink even if κ_H dropped (bridge-stall branch)", () => {
  // κ_H moved a lot but the flagged-bridge list did not shrink (or grew).
  // That means the pass is still trapped in the same κ-fault topology and
  // every additional pass will keep generating bridges without resolving
  // the underlying duplicates.
  assert.equal(
    repairProgressStalled({
      prevKappaHall: 100,
      currKappaHall: 40, // delta = 60 ≥ threshold
      prevBridgeCount: 3,
      currBridgeCount: 3, // not shrunk
      threshold: 0.5,
    }),
    true,
  );
  assert.equal(
    repairProgressStalled({
      prevKappaHall: 100,
      currKappaHall: 40, // delta = 60 ≥ threshold
      prevBridgeCount: 3,
      currBridgeCount: 5, // grew
      threshold: 0.5,
    }),
    true,
  );
});

test("repairProgressStalled: returns true when both branches fire (joint stall)", () => {
  // Both axes stalled — clearly no-progress; this is the most common stall
  // pattern (e.g. duplicated beats whose char-bag stays ≈1 across passes).
  assert.equal(
    repairProgressStalled({
      prevKappaHall: 100,
      currKappaHall: 100, // delta = 0 < threshold
      prevBridgeCount: 2,
      currBridgeCount: 4, // grew
      threshold: 0.5,
    }),
    true,
  );
});

test("POST /api/reel/repair: stops early with stopReason='no-progress' when κ_H is not improving", async () => {
  // Mock the Hypervisor to always return a prompt with the SAME char-bag
  // as the originals. Every inserted bridge / regenerated beat collapses
  // back into the rank-1 cluster, so κ_H does not drop (it actually rises
  // as more beats are added) and bridge flags multiply rather than shrink.
  // The convergence guard must short-circuit instead of burning the full
  // maxIterations passes on diminishing returns.
  const mod = await import("../src/model-tiers.js");
  const originalOR = mod.openrouter.chat.completions.create;
  let synthCalls = 0;
  const noProgressMock = async () => {
    synthCalls++;
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            // Identical char-bag to the input prompts → cosine stays ≈ 1.
            visualPrompt: "lone monolith pulses on a mirrored desert at dawn slow orbit",
            durationSeconds: 1.5,
          }),
        },
      }],
    };
  };
  (mod.openrouter.chat.completions as unknown as { create: unknown }).create = noProgressMock;
  try {
    const beats = [
      { visualPrompt: "lone monolith pulses on a mirrored desert at dawn, slow orbit" },
      { visualPrompt: "lone monolith pulses on a mirrored desert at dawn, slow orbit" },
      { visualPrompt: "lone monolith pulses on a mirrored desert at dawn, slow orbit" },
    ];
    const res = await request(app)
      .post("/api/reel/repair")
      .send({ beats, theme: "stalled monolith", maxIterations: 5 });
    assert.equal(res.status, 200, `body=${JSON.stringify(res.body)}`);
    assert.equal(res.body.stopReason, "no-progress",
      `expected no-progress short-circuit, got stopReason=${res.body.stopReason} after ${res.body.iterationCount} iterations`);
    // We must have stopped strictly before exhausting maxIterations.
    assert.ok(res.body.iterationCount < res.body.maxIterations,
      `repair burned all ${res.body.maxIterations} iterations instead of short-circuiting (count=${res.body.iterationCount})`);
    // converged must be false on a no-progress exit.
    assert.equal(res.body.converged, false);
    // Sanity: κ_H did not meaningfully drop (≤ threshold of 0.5).
    assert.ok(
      res.body.coherence.kappaHall - res.body.initialCoherence.kappaHall >= -0.5,
      `κ_H dropped meaningfully (before=${res.body.initialCoherence.kappaHall}, after=${res.body.coherence.kappaHall}); fixture should stall`,
    );
    // Sanity: the synth was actually exercised at least once.
    assert.ok(synthCalls >= 1, "expected at least one synth call");
  } finally {
    (mod.openrouter.chat.completions as unknown as { create: typeof originalOR }).create = originalOR;
  }
});

test("POST /api/reel/outline: rejects missing theme with 400", async () => {
  const res = await request(app).post("/api/reel/outline").send({});
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "theme is required");
});

test("POST /api/reel/outline: returns 24-beat skeleton with Hall coherence on success", async () => {
  const res = await request(app)
    .post("/api/reel/outline")
    .send({ theme: "a lone monolith pulsing in a mirrored desert", beatCount: 24, aspectRatio: "9:16" });
  // Outline calls an LLM; in test env without provider keys it may 5xx.
  // When it succeeds, the schema must include the full Hall coherence
  // payload (gram, gramHall, kappaMax) and the 0.02 observer-presence gap
  // nested under `coherence.observerPresence`.
  if (res.status !== 200) {
    assert.ok(res.status >= 400, "non-200 must be a real error");
    return;
  }
  const body = res.body;
  assert.ok(Array.isArray(body.beats));
  assert.equal(body.beats.length, 24);
  assert.ok(body.coherence);
  assert.ok(Array.isArray(body.coherence.gram));
  assert.equal(body.coherence.gram.length, 24);
  assert.ok(Array.isArray(body.coherence.gramHall));
  assert.equal(body.coherence.kappaMax, KAPPA_MAX);
  assert.equal(body.coherence.observerPresence, VIEWER_PRESENCE_GAP);
});

test("POST /api/reel/stitch: rejects empty clip array with 400", async () => {
  const res = await request(app)
    .post("/api/reel/stitch")
    .send({ clips: [], beats: [], aspectRatio: "9:16" });
  assert.equal(res.status, 400);
  assert.ok(typeof res.body.error === "string");
});
