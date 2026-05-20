import { Router } from "express";
import { spawn, execFileSync } from "node:child_process";
import { promises as fsp, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import {
  chatCompletion,
  generateImage,
  generateVideo,
  analyzeClipContinuity,
  analyzeImage,
  synthesizeSpeech,
  validateVeoOptions,
  TTS_VOICES,
  type Tier,
  type TtsVoice,
  type VeoOptions,
} from "../model-tiers.js";
import {
  computeNarrativeCoherence,
  psiTarget,
  transitionSpecFromB,
  ETA,
  KAPPA_MAX,
  VIEWER_PRESENCE_GAP,
} from "../lib/narrative-coherence.js";
import { CLIP_CACHE_DIR } from "../lib/clip-cache-sweep.js";

const reelRouter = Router();

// ── ffmpeg binary resolution ─────────────────────────────────────────────────
// In Replit's deployed (production) environment the PATH does not always
// include Nix store bin directories, so `spawn("ffmpeg")` throws ENOENT.
// We resolve the absolute path once at startup so every spawn call uses it.
function resolveFFmpegBin(): string {
  if (process.env["FFMPEG_PATH"]) return process.env["FFMPEG_PATH"];
  // Try which first (works in dev and most Linux envs)
  try {
    const p = execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim();
    if (p && existsSync(p)) return p;
  } catch { /* continue */ }
  // Scan Nix store for ffmpeg binaries (Replit NixOS pattern)
  try {
    const result = execFileSync(
      "bash",
      ["-c", "ls /nix/store/*-replit-runtime-path*/bin/ffmpeg 2>/dev/null | head -1"],
      { encoding: "utf8" },
    ).trim();
    if (result && existsSync(result)) return result;
  } catch { /* continue */ }
  // Last resort: common system paths
  for (const p of ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/bin/ffmpeg"]) {
    if (existsSync(p)) return p;
  }
  return "ffmpeg"; // let it fail with a clear ENOENT rather than silently
}
const FFMPEG_BIN = resolveFFmpegBin();

// Strip markdown code fences and parse JSON. LLMs intermittently wrap their
// JSON output in ```json ... ``` even when instructed not to — this helper
// normalises that before every JSON.parse call so silent parse failures
// (which cause beat prompts to fall back to "Beat X") can't happen.
function parseJson<T = unknown>(text: string): T {
  const stripped = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  // Try the stripped version first; if it fails, attempt an inline-object
  // extraction from the original (handles responses with prose before/after).
  try {
    return JSON.parse(stripped) as T;
  } catch {
    const match = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[1]) as T;
    throw new SyntaxError(`parseJson: no valid JSON found in: ${text.slice(0, 120)}`);
  }
}

// ── Async clip job store ─────────────────────────────────────────────────────
// /reel/clip POSTs start a background Veo job and immediately return { jobId }.
// The frontend polls GET /reel/clip-status/:id every 4 s. This prevents proxy
// / browser timeouts for Veo generations that take 3–5 minutes.
type ClipJobResult = {
  video: string; videoMimeType: string; model: string; tier: string;
  appliedDurationSeconds: number; appliedAspectRatio: string;
  psiScore: { A: number; N: number; psi: number };
  continuity: unknown | null; terminalFrame: string; promptUsed: string;
  clipId?: string;
};
type ClipJob = {
  status: "pending" | "running" | "done" | "error";
  result?: ClipJobResult;
  error?: string;
  startedAt: number;
};
const clipJobs = new Map<string, ClipJob>();
// GC jobs older than 30 min every 5 min
const gcInterval = setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of clipJobs) {
    if (job.startedAt < cutoff) clipJobs.delete(id);
  }
}, 5 * 60 * 1000);
if (gcInterval.unref) gcInterval.unref();

// Ensure the cache directory exists at startup (best-effort; /reel/clip
// also creates it on-demand so a startup race is harmless).
fsp.mkdir(CLIP_CACHE_DIR, { recursive: true }).catch(() => {});

const PHI = 1.618033988749895;
const SIGMA_LINE = 0.5; // critical line σ

// Convergence guard predicate for the /reel/repair loop. A pass is considered
// "stalled" — and the loop should short-circuit to avoid burning more model
// calls on diminishing returns — when EITHER κ_H improved by less than the
// progress threshold OR the flagged-bridge count failed to shrink. The OR
// semantics match the task spec: either dimension stalling alone is enough
// to call the repair loop unproductive.
//
// Exported (and isolated from any IO) so the predicate can be unit-tested
// across each independent trigger branch.
export function repairProgressStalled(opts: {
  prevKappaHall: number;
  currKappaHall: number;
  prevBridgeCount: number;
  currBridgeCount: number;
  threshold: number;
}): boolean {
  const kappaDelta = opts.prevKappaHall - opts.currKappaHall;
  const bridgeShrunk = opts.currBridgeCount < opts.prevBridgeCount;
  return kappaDelta < opts.threshold || !bridgeShrunk;
}

type Beat = {
  index: number;       // 1-based icositetragon spoke (1..24, mod-24)
  spoke: number;       // 0-based 0..23
  visualPrompt: string;
  psiTarget: number;
  A: number;
  N: number;
  sigma: number;
  gamma: number;
  phi: number;
  // Optional per-beat duration override (seconds). Bridge beats inserted by
  // /reel/repair set this to 1-2s so transitional cuts render shorter than
  // the session-wide default. Absent → caller falls back to session value.
  durationSeconds?: number;
  // Sonata form section — present only when outline was generated in sonataMode.
  sonataSection?: "exposition" | "development" | "recapitulation";
};

function safeBeat(raw: unknown, idx: number): Beat {
  const r = (raw ?? {}) as Record<string, unknown>;
  const spoke = idx % 24;
  const tgt = psiTarget(spoke);
  const visualPrompt = typeof r.visualPrompt === "string" && r.visualPrompt.trim().length > 0
    ? String(r.visualPrompt).slice(0, 600)
    : `Beat ${idx + 1}`;
  const beat: Beat = {
    index: spoke + 1,
    spoke,
    visualPrompt,
    psiTarget: tgt.psi,
    A: tgt.A,
    N: tgt.N,
    sigma: SIGMA_LINE,
    gamma: 14.134725 + spoke * 0.5,
    phi: (spoke / 24) * 2 * Math.PI * PHI,
  };
  if (typeof r.durationSeconds === "number" && Number.isFinite(r.durationSeconds)) {
    beat.durationSeconds = Math.max(1, Math.min(20, r.durationSeconds));
  }
  return beat;
}

reelRouter.post("/reel/outline", async (req, res) => {
  try {
    const theme = String(req.body?.theme ?? "").slice(0, 600);
    const beatCount = Math.max(1, Math.min(24, Math.floor(Number(req.body?.beatCount ?? 12))));
    const tier = (typeof req.body?.tier === "string" ? req.body.tier : undefined) as Tier | undefined;
    const sonataMode = req.body?.sonataMode === true;
    const referencePrompts: string[] = Array.isArray(req.body?.referencePrompts)
      ? (req.body.referencePrompts as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 8)
      : [];
    const seedGlyphs: string[] = Array.isArray(req.body?.seedGlyphs)
      ? (req.body.seedGlyphs as unknown[]).filter((g): g is string => typeof g === "string").slice(0, 8)
      : [];
    // Compute sonata section boundaries (Exposition 25% / Development 50% / Recapitulation 25%)
    const expEnd = Math.max(1, Math.round(beatCount * 0.25));
    const devEnd = Math.max(expEnd + 1, Math.round(beatCount * 0.75));
    const sonataStructureNote = sonataMode
      ? `\n\nSONATA FORM STRUCTURE (mandatory when sonataMode=true):
- EXPOSITION beats 1–${expEnd}: Introduce primary visual theme. Stable, serene, grounded. Establish subject and lighting anchor.
- DEVELOPMENT beats ${expEnd + 1}–${devEnd}: Fragment and vary the theme. Rising tension, motion, transformation. Deviate from the anchor.
- RECAPITULATION beats ${devEnd + 1}–${beatCount}: Return to primary theme. Resolution, stillness, closure.
The tension spine MUST follow: stable → rising → peak → resolution.`
      : "";

    if (!theme) {
      res.status(400).json({ error: "theme is required" });
      return;
    }

    // ── Pass 1: Architecture Hypervisor ─────────────────────────────────────
    // Generates a high-level narrative architecture: act structure, tension
    // spine, subject/lighting anchors, and a working title. This pass does
    // NOT write individual beat prompts — it focuses purely on structure so
    // the Beat Composer HV (Pass 2) has a stable skeleton to fill.
    const archSys = `You are the Architecture Hypervisor of Ω-REEL.
Your sole job is to design the structural skeleton of a ${beatCount}-beat cinematic arc — do NOT write beat prompts yet.
Return compact JSON:
{
  "title": "<3-7 words>",
  "acts": [{"name":"<act label>","beatRange":[<start>,<end>],"tension":"<low|rising|peak|falling|resolved>","anchor":"<shared visual motif or subject>"}],
  "spine": "<one sentence describing the overall emotional journey>",
  "subjectAnchor": "<primary recurring visual subject across all beats>",
  "lightingArc": "<brief description of how light/colour evolves across the arc>"
}
acts must cover beats 1–${beatCount} contiguously. Tension must form a Ψ-pacing curve (rises then resolves).${sonataStructureNote}`;

    const archResult = await chatCompletion(
      "evolve",
      [
        { role: "system", content: archSys },
        { role: "user", content: `Theme: """${theme}"""${referencePrompts.length > 0 ? `\n\nFeed visual anchors (fold these motifs into the subject anchor and lighting arc):\n${referencePrompts.map((p) => `• ${p}`).join("\n")}` : ""}${seedGlyphs.length > 0 ? `\n\nBH53 GOS seed coordinates (crystallization addresses from the organism's living corpus — let these anchor the narrative geometry of the arc):\n${seedGlyphs.map((g) => `• ${g}`).join("\n")}` : ""}\nDesign the ${beatCount}-beat architecture.` },
      ],
      { jsonMode: true, maxTokens: 800, temperature: 0.75, tier },
    );

    let arch: { title?: unknown; acts?: unknown; spine?: unknown; subjectAnchor?: unknown; lightingArc?: unknown } = {};
    try { arch = parseJson(archResult.text); } catch { /* fall through */ }

    const workingTitle = typeof arch.title === "string" && arch.title.trim().length > 0
      ? arch.title.slice(0, 80)
      : theme.slice(0, 40);

    // ── Pass 2: Beat Composer Hypervisor ────────────────────────────────────
    // Receives the architecture skeleton and expands it into exactly beatCount
    // concrete cinematic visual prompts, one per beat, preserving continuity.
    const spine = typeof arch.spine === "string" ? arch.spine : "";
    const subjectAnchor = typeof arch.subjectAnchor === "string" ? arch.subjectAnchor : "";
    const lightingArc = typeof arch.lightingArc === "string" ? arch.lightingArc : "";
    const actsJson = JSON.stringify(arch.acts ?? []);

    const beatSys = `You are the Beat Composer Hypervisor of Ω-REEL.
You receive a narrative architecture skeleton and expand it into exactly ${beatCount} cinematic beat prompts.
Each beat is a single Veo-bound clip — short, vivid, mobile-vertical (9:16). No dialogue, no on-screen text.
Use concrete subjects, camera motion, and lighting. Each visualPrompt must flow naturally to the next (subject continuity).

Architecture skeleton:
- Spine: ${spine}
- Subject anchor: ${subjectAnchor}
- Lighting arc: ${lightingArc}
- Acts: ${actsJson}

Return JSON: {"beats":[{"visualPrompt":"<one cinematic sentence>"}]}
Return exactly ${beatCount} beats in arc order (beat 1 first).`;

    const beatResult = await chatCompletion(
      "evolve",
      [
        { role: "system", content: beatSys },
        { role: "user", content: `Theme: """${theme}"""\nExpand into exactly ${beatCount} beat prompts now.` },
      ],
      { jsonMode: true, maxTokens: 1800, temperature: 0.85, tier },
    );

    let parsed: { beats?: unknown } = {};
    try { parsed = parseJson(beatResult.text); } catch { /* fall through */ }

    const rawBeats = Array.isArray(parsed.beats) ? parsed.beats : [];
    const beats: Beat[] = [];
    for (let i = 0; i < beatCount; i++) {
      const b = safeBeat(rawBeats[i], i);
      if (sonataMode) {
        b.sonataSection = i < expEnd ? "exposition" : i < devEnd ? "development" : "recapitulation";
      }
      beats.push(b);
    }

    const coherence = await computeNarrativeCoherence(beats);

    res.json({
      title: workingTitle,
      theme,
      sonataMode,
      beats,
      coherence: {
        kappa: coherence.conditionNumber,
        kappaHall: coherence.conditionNumberHall,
        kappaMax: coherence.kappaMax,
        eta: ETA,
        bridges: coherence.bridges,
        observerPresence: coherence.observerPresence,
        embeddingMode: coherence.embeddingMode,
        gram: coherence.matrix,
        gramHall: coherence.matrixHall,
      },
      model: beatResult.model,
      tier: beatResult.tier,
      attempts: [...(archResult.attempts ?? []), ...(beatResult.attempts ?? [])],
      arch: {
        spine,
        subjectAnchor,
        lightingArc,
        acts: arch.acts,
        model: archResult.model,
      },
    });
  } catch (err) {
    const e = err as Error & { attempts?: unknown };
    console.error("reel/outline failed:", e?.message);
    res.status(500).json({ error: "outline failed", detail: e?.message, attempts: e?.attempts ?? [] });
  }
});

// Synthesise a single transitional bridge beat between `left` and `right`.
// Used by both /reel/repair (batch) and /reel/repair-pair (single retry for
// editorial regenerate-this-bridge requests). Falls back to a deterministic
// cross-fade prompt if the Hypervisor call fails.
async function synthBridgeBeat(
  left: Beat,
  right: Beat,
  theme: string,
  tier: Tier | undefined,
  pairKappa: number,
): Promise<{ visualPrompt: string; durationSeconds: number; midSpoke: number }> {
  const midSpoke = Math.round((left.spoke + right.spoke) / 2) % 24;
  const tgt = psiTarget(midSpoke);
  const sys = `You are the Narrative Hypervisor of Ω-REEL, repairing a κ-fault.
Two adjacent beats lack visual hand-off. Synthesise ONE transitional beat (1-2 seconds, mobile-vertical 9:16, no dialogue, no on-screen text) that bridges them.
Respond ONLY with JSON: {"visualPrompt":"<one short cinematic sentence>","durationSeconds":<number in [1,2]>}.
The bridge must share concrete subject / palette / motion with BOTH neighbors so a Veo cut can hand off cleanly.`;
  const userMsg =
    (theme ? `Theme: """${theme}"""\n` : "") +
    `Previous beat (spoke ${left.spoke + 1}/24, Ψ≈${left.psiTarget.toFixed(2)}): """${left.visualPrompt}"""\n` +
    `Next beat (spoke ${right.spoke + 1}/24, Ψ≈${right.psiTarget.toFixed(2)}): """${right.visualPrompt}"""\n` +
    `Transitional spoke ${midSpoke + 1}/24, Ψ-target=${tgt.psi.toFixed(2)} (A=${tgt.A.toFixed(2)}, N=${tgt.N.toFixed(2)}). κ(G_H) for this pair was ${pairKappa.toFixed(2)} (> ${KAPPA_MAX}).`;

  let visualPrompt = `Cross-fade morph: ${left.visualPrompt.split(/[.,;]/)[0].slice(0, 60)} → ${right.visualPrompt.split(/[.,;]/)[0].slice(0, 60)}`;
  let durationSeconds = 1.5;
  try {
    const resp = await chatCompletion(
      "evolve",
      [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      { jsonMode: true, maxTokens: 220, temperature: 0.7, tier },
    );
    try {
      const j = parseJson<{ visualPrompt?: string; durationSeconds?: number }>(resp.text);
      if (typeof j.visualPrompt === "string" && j.visualPrompt.trim().length > 0) {
        visualPrompt = String(j.visualPrompt).slice(0, 600);
      }
      if (typeof j.durationSeconds === "number" && Number.isFinite(j.durationSeconds)) {
        durationSeconds = Math.max(1, Math.min(2, j.durationSeconds));
      }
    } catch { /* keep fallback */ }
  } catch (synthErr) {
    console.warn("[reel synthBridgeBeat] hypervisor synth failed, using fallback:", (synthErr as Error)?.message);
  }
  return { visualPrompt, durationSeconds, midSpoke };
}

// /reel/repair — narrative coherence auto-healer.
//
// The outline endpoint already computes Hall-regularised κ(G_H) and lists
// adjacent pairs whose 2x2 Gram block exceeds κ_max=65.18 (the "bridges").
// On its own that information is diagnostic. This endpoint acts on it: for
// each flagged pair it asks the Hypervisor to synthesise a 1-2s transitional
// beat between the two flagged spokes (re-using ψ-target math at the
// midpoint spoke) and inserts it between them. After every pass we re-run
// computeNarrativeCoherence and loop until either κ(G_H) ≤ KAPPA_MAX or we
// hit the iteration cap. The full per-iteration trace is returned so the UI
// can show what was inserted and how κ moved.
reelRouter.post("/reel/repair", async (req, res) => {
  try {
    const rawBeats = Array.isArray(req.body?.beats) ? req.body.beats : [];
    if (rawBeats.length < 2) {
      res.status(400).json({ error: "beats (>=2) required" });
      return;
    }
    const theme = String(req.body?.theme ?? "").slice(0, 600);
    const tier = (typeof req.body?.tier === "string" ? req.body.tier : undefined) as Tier | undefined;
    const maxIterations = Math.max(1, Math.min(6, Math.floor(Number(req.body?.maxIterations ?? 3))));

    // Normalise input beats through safeBeat so spoke/ψ math is consistent.
    let beats: Beat[] = rawBeats.map((b: unknown, i: number) => {
      const r = (b ?? {}) as Record<string, unknown>;
      // Preserve original spoke if provided (could be a non-monotonic
      // sequence after a previous repair pass), else derive from index.
      const idx = typeof r.spoke === "number" ? Number(r.spoke) : i;
      return safeBeat(r, idx);
    });

    const iterations: Array<{
      pass: number;
      kappa: number;
      kappaHall: number;
      bridgesBefore: Array<{ from: number; to: number; kappa: number }>;
      inserted: Array<{ atIndex: number; spoke: number; visualPrompt: string; durationSeconds: number; betweenSpokes: [number, number] }>;
    }> = [];

    let coherence = await computeNarrativeCoherence(beats);
    const initialCoherence = coherence;

    // Convergence guard. Pathologically stalled inputs (e.g. many identical
    // beats whose char-bag cosine stays ≈1 even after regen) keep producing
    // fresh bridge flags every pass while κ_H barely moves. Without this
    // guard we burn `maxIterations` Hypervisor calls on diminishing returns.
    // We stop early if neither κ_H dropped by a meaningful amount nor the
    // flagged-bridge count shrunk between consecutive passes.
    const KAPPA_PROGRESS_THRESHOLD = 0.5;
    let prevKappaHall = coherence.conditionNumberHall;
    let prevBridgeCount = coherence.bridges.length;
    let stopReason: "converged" | "no-bridges" | "no-progress" | "iteration-cap" = "iteration-cap";

    // Track every beat object that has already been regenerated by the
    // duplicate-breaking synth call this /reel/repair invocation. With many
    // overlapping flagged pairs (e.g. 5 near-identical adjacent beats) the
    // same beat could otherwise be re-synthesised multiple times within one
    // pass — and across passes, residual κ ≥ 20 flags on an already-replaced
    // beat would queue redundant synth calls. Keying by object reference is
    // stable across the in-place insertions/replacements that shift indices.
    const regeneratedBeats = new WeakSet<Beat>();

    for (let pass = 1; pass <= maxIterations; pass++) {
      if (coherence.bridges.length === 0 && coherence.conditionNumberHall <= coherence.kappaMax) {
        stopReason = "converged";
        break;
      }

      const inserted: Array<{ atIndex: number; spoke: number; visualPrompt: string; durationSeconds: number; betweenSpokes: [number, number] }> = [];
      const bridgesBefore = coherence.bridges.slice();

      // Walk from highest index downward so insertions don't invalidate
      // the indices of later bridges in this pass.
      const sortedBridges = bridgesBefore.slice().sort((a, b) => b.from - a.from);
      // Per-pair κ saturates near 23.22 when cos→1 (η=0.09 floor), so any
      // pair above this threshold is an exact / near-exact duplicate. For
      // those, inserting a bridge ALONE does not reduce the global κ_H —
      // the duplicate beats still pin λ_min(G) toward zero. We additionally
      // regenerate the right-hand duplicate with a fresh synth call so the
      // repair actually breaks the rank-1 symmetry that caused the stall.
      const NEAR_DUP_KAPPA = 20;
      for (const br of sortedBridges) {
        const left = beats[br.from];
        const right = beats[br.to];
        if (!left || !right) continue;

        const synth = await synthBridgeBeat(left, right, theme, tier, br.kappa);
        const bridgeBeat: Beat = safeBeat(
          { visualPrompt: synth.visualPrompt, durationSeconds: synth.durationSeconds },
          synth.midSpoke,
        );
        // Insert between left (br.from) and right (br.to = br.from+1).
        beats = [...beats.slice(0, br.to), bridgeBeat, ...beats.slice(br.to)];
        inserted.unshift({
          atIndex: br.to,
          spoke: synth.midSpoke,
          visualPrompt: synth.visualPrompt,
          durationSeconds: synth.durationSeconds,
          betweenSpokes: [left.spoke, right.spoke],
        });

        if (br.kappa >= NEAR_DUP_KAPPA && !regeneratedBeats.has(right)) {
          // The right-hand beat is a near-duplicate of the left. Replace
          // it (in-place; no new index is introduced) with a fresh synth
          // so the global Gram matrix gains a new dimension. The bridge
          // beat sits at br.to; the original right beat is now at br.to+1.
          // We only do this once per beat per /reel/repair call — repeated
          // regeneration of the same beat (from overlapping flagged pairs
          // or residual κ on an already-replaced beat) wastes model calls
          // and produces inconsistent narratives.
          const dupSynth = await synthBridgeBeat(bridgeBeat, right, theme, tier, br.kappa);
          const replacement: Beat = safeBeat(
            { visualPrompt: dupSynth.visualPrompt, durationSeconds: right.durationSeconds },
            right.spoke,
          );
          regeneratedBeats.add(replacement);
          beats = [...beats.slice(0, br.to + 1), replacement, ...beats.slice(br.to + 2)];
        }
      }

      coherence = await computeNarrativeCoherence(beats);
      iterations.push({
        pass,
        kappa: coherence.conditionNumber,
        kappaHall: coherence.conditionNumberHall,
        bridgesBefore,
        inserted,
      });

      if (inserted.length === 0) {
        stopReason = "no-bridges";
        break;
      }

      if (coherence.bridges.length === 0 && coherence.conditionNumberHall <= coherence.kappaMax) {
        stopReason = "converged";
        break;
      }

      if (repairProgressStalled({
        prevKappaHall,
        currKappaHall: coherence.conditionNumberHall,
        prevBridgeCount,
        currBridgeCount: coherence.bridges.length,
        threshold: KAPPA_PROGRESS_THRESHOLD,
      })) {
        stopReason = "no-progress";
        break;
      }
      prevKappaHall = coherence.conditionNumberHall;
      prevBridgeCount = coherence.bridges.length;
    }

    res.json({
      beats,
      coherence: {
        kappa: coherence.conditionNumber,
        kappaHall: coherence.conditionNumberHall,
        kappaMax: coherence.kappaMax,
        eta: ETA,
        bridges: coherence.bridges,
        observerPresence: coherence.observerPresence,
        embeddingMode: coherence.embeddingMode,
        gram: coherence.matrix,
        gramHall: coherence.matrixHall,
      },
      initialCoherence: {
        kappa: initialCoherence.conditionNumber,
        kappaHall: initialCoherence.conditionNumberHall,
        bridges: initialCoherence.bridges,
      },
      iterations,
      converged: coherence.conditionNumberHall <= coherence.kappaMax && coherence.bridges.length === 0,
      stopReason,
      iterationCount: iterations.length,
      maxIterations,
    });
  } catch (err) {
    const e = err as Error & { attempts?: unknown };
    console.error("reel/repair failed:", e?.message);
    res.status(500).json({ error: "repair failed", detail: e?.message, attempts: e?.attempts ?? [] });
  }
});

reelRouter.post("/reel/narrate", async (req, res) => {
  try {
    const rawBeats = Array.isArray(req.body?.beats) ? req.body.beats : [];
    if (rawBeats.length === 0) {
      res.status(400).json({ error: "beats required" });
      return;
    }
    const theme = String(req.body?.theme ?? "").slice(0, 600);
    const tier = (typeof req.body?.tier === "string" ? req.body.tier : undefined) as Tier | undefined;

    const beats = rawBeats.map((b: unknown, i: number) => {
      const r = (b ?? {}) as Record<string, unknown>;
      const visualPrompt = typeof r.visualPrompt === "string" ? r.visualPrompt.slice(0, 600) : `Beat ${i + 1}`;
      const spoke = typeof r.spoke === "number" ? Number(r.spoke) : i;
      return { spoke, visualPrompt };
    });

    const sys = `You are the Narrative Hypervisor of Ω-REEL writing voice-over narration.
For each beat you receive, draft ONE short narration line (max ~14 words, single sentence) that complements — does not literally describe — the beat's visual. Lines should flow as a continuous voiceover across the arc, mirroring the rise-and-resolve pacing.
Respond ONLY with JSON: {"lines":["<line for beat 1>","<line for beat 2>",...]}.
Return exactly ${beats.length} lines, one per beat, in order.`;

    const userMsg =
      (theme ? `Theme: """${theme}"""\n\n` : "") +
      `Beats:\n${beats.map((b: { spoke: number; visualPrompt: string }, i: number) => `${i + 1}. (spoke ${b.spoke + 1}/24) ${b.visualPrompt}`).join("\n")}`;

    const result = await chatCompletion(
      "evolve",
      [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      { jsonMode: true, maxTokens: 80 + beats.length * 40, temperature: 0.8, tier },
    );

    let parsed: { lines?: unknown } = {};
    try { parsed = parseJson(result.text); } catch { /* fall through */ }
    const rawLines = Array.isArray(parsed.lines) ? parsed.lines : [];
    const lines: string[] = beats.map((_b: unknown, i: number) => {
      const v = rawLines[i];
      return typeof v === "string" ? v.trim().slice(0, 240) : "";
    });

    res.json({
      lines,
      model: result.model,
      tier: result.tier,
      attempts: result.attempts,
    });
  } catch (err) {
    const e = err as Error & { attempts?: unknown };
    console.error("reel/narrate failed:", e?.message);
    res.status(500).json({ error: "narrate failed", detail: e?.message, attempts: e?.attempts ?? [] });
  }
});

// /reel/narrate/preview — synthesise a single narration line as TTS audio so
// users can audition the text + voice combination before committing to a full
// /reel/score render. Ephemeral: nothing is persisted, the response is just
// the base64 audio for inline playback.
reelRouter.post("/reel/narrate/preview", async (req, res) => {
  try {
    const text = String(req.body?.text ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    const voiceRaw = String(req.body?.voice ?? "alloy");
    const voice: TtsVoice = (TTS_VOICES as readonly string[]).includes(voiceRaw)
      ? (voiceRaw as TtsVoice)
      : "alloy";
    const tier = (typeof req.body?.tier === "string" ? req.body.tier : undefined) as Tier | undefined;

    const tts = await synthesizeSpeech(text.slice(0, 1000), { tier, voice, format: "mp3" });
    res.json({
      audio: tts.audio,
      mimeType: tts.mimeType,
      voice: tts.voice,
      model: tts.model,
      tier: tts.tier,
    });
  } catch (err) {
    const e = err as Error & { attempts?: unknown };
    console.error("reel/narrate/preview failed:", e?.message);
    res.status(500).json({ error: "preview failed", detail: e?.message, attempts: e?.attempts ?? [] });
  }
});

// /reel/repair-pair — single-pair retry. The user rejected one auto-generated
// bridge beat (or wants a fresh take) and needs another transitional sentence
// at the same midpoint spoke. Takes the original two neighbors, returns one
// new bridge beat. No coherence math runs here — the client recomputes via
// /reel/coherence after replacing the beat in its local list.
reelRouter.post("/reel/repair-pair", async (req, res) => {
  try {
    const leftRaw = req.body?.left as Record<string, unknown> | undefined;
    const rightRaw = req.body?.right as Record<string, unknown> | undefined;
    if (!leftRaw || !rightRaw) {
      res.status(400).json({ error: "left and right beats are required" });
      return;
    }
    const theme = String(req.body?.theme ?? "").slice(0, 600);
    const tier = (typeof req.body?.tier === "string" ? req.body.tier : undefined) as Tier | undefined;
    const pairKappa = Number.isFinite(Number(req.body?.pairKappa))
      ? Number(req.body.pairKappa)
      : KAPPA_MAX + 1;

    const leftIdx = typeof leftRaw.spoke === "number" ? Number(leftRaw.spoke) : 0;
    const rightIdx = typeof rightRaw.spoke === "number" ? Number(rightRaw.spoke) : 1;
    const left = safeBeat(leftRaw, leftIdx);
    const right = safeBeat(rightRaw, rightIdx);

    const synth = await synthBridgeBeat(left, right, theme, tier, pairKappa);
    const beat = safeBeat(
      { visualPrompt: synth.visualPrompt, durationSeconds: synth.durationSeconds },
      synth.midSpoke,
    );
    res.json({ beat, betweenSpokes: [left.spoke, right.spoke] });
  } catch (err) {
    const e = err as Error & { attempts?: unknown };
    console.error("reel/repair-pair failed:", e?.message);
    res.status(500).json({ error: "repair-pair failed", detail: e?.message, attempts: e?.attempts ?? [] });
  }
});

// /reel/coherence — recompute the Hall κ pass on a beat list. Used by the
// editorial accept/reject/regenerate flow so the client can refresh its
// coherence panel after mutating the beat list locally.
reelRouter.post("/reel/coherence", async (req, res) => {
  try {
    const rawBeats = Array.isArray(req.body?.beats) ? req.body.beats : [];
    if (rawBeats.length < 1) {
      res.status(400).json({ error: "beats required" });
      return;
    }
    const beats: Beat[] = rawBeats.map((b: unknown, i: number) => {
      const r = (b ?? {}) as Record<string, unknown>;
      const idx = typeof r.spoke === "number" ? Number(r.spoke) : i;
      return safeBeat(r, idx);
    });
    const coherence = await computeNarrativeCoherence(beats);
    res.json({
      coherence: {
        kappa: coherence.conditionNumber,
        kappaHall: coherence.conditionNumberHall,
        kappaMax: KAPPA_MAX,
        eta: ETA,
        bridges: coherence.bridges,
        observerPresence: coherence.observerPresence,
        gram: coherence.matrix,
        gramHall: coherence.matrixHall,
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error("reel/coherence failed:", e?.message);
    res.status(500).json({ error: "coherence failed", detail: e?.message });
  }
});

// Core clip generation logic — extracted so it can be run in the background
// without tying up an HTTP connection for the full 3–5 min Veo round-trip.
async function runClipJob(
  jobId: string,
  beatRaw: Record<string, unknown>,
  prevFrame: string,
  tier: Tier | undefined,
  veoOpts: VeoOptions,
): Promise<void> {
  const job = clipJobs.get(jobId);
  if (!job) return;
  job.status = "running";

  try {
    const visualPrompt = String(beatRaw.visualPrompt ?? "").slice(0, 600);
    const spoke = Math.max(0, Math.min(23, Math.floor(Number(beatRaw.spoke ?? 0))));
    const tgt = psiTarget(spoke);

    // Pre-generation: peek at the previous terminal frame to seed prompt
    // continuity keywords.
    let continuityKeywords = "";
    let prevElements: string[] = [];
    if (prevFrame) {
      try {
        const peek = await analyzeImage(
          prevFrame,
          `Describe this terminal frame succinctly. Respond ONLY with JSON:
{"dominantElements":["color palette","main subject","motion direction","lighting key"]}`,
          { tier },
        );
        try {
          const j = parseJson<{ dominantElements?: unknown[] }>(peek.text);
          if (Array.isArray(j.dominantElements)) {
            prevElements = j.dominantElements.slice(0, 6).map((s: unknown) => String(s).slice(0, 40));
            continuityKeywords = ` Continue from previous frame: ${prevElements.slice(0, 4).join(", ")}.`;
          }
        } catch { /* ignore parse */ }
      } catch (visionErr) {
        console.warn("[reel/clip] prev-frame peek failed:", (visionErr as Error)?.message);
      }
    }

    const framingHint =
      veoOpts.aspectRatio === "16:9"
        ? "16:9 widescreen cinematic framing"
        : "9:16 vertical mobile framing";
    const enrichedPrompt =
      `${visualPrompt} ${framingHint}, cinematic.${continuityKeywords}`.slice(0, 480);

    const seedPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const seedFrame = prevFrame || seedPng;

    const video = await generateVideo(seedFrame, enrichedPrompt, {
      tier,
      aspectRatio: veoOpts.aspectRatio,
      durationSeconds: veoOpts.durationSeconds,
      quality: veoOpts.quality,
      imageMimeType: "image/png",
    });

    // Independent A and N reassessment via cheap text scoring.
    const ascore = await chatCompletion(
      "assess",
      [
        { role: "system", content: `Score the structural amplitude A and novelty flux N of a beat in [0,1]. Respond JSON only: {"A":n,"N":n}` },
        { role: "user", content: `Beat ${spoke + 1}/24: """${visualPrompt}"""\nTargets A≈${tgt.A.toFixed(2)} N≈${tgt.N.toFixed(2)}.` },
      ],
      { jsonMode: true, maxTokens: 80, temperature: 0.3, tier },
    ).catch(() => null);
    let scoredA = tgt.A;
    let scoredN = tgt.N;
    if (ascore) {
      try {
        const j = parseJson<{ A?: number; N?: number }>(ascore.text);
        if (typeof j.A === "number") scoredA = Math.max(0, Math.min(1, j.A));
        if (typeof j.N === "number") scoredN = Math.max(0, Math.min(2, j.N));
      } catch { /* keep targets */ }
    }
    const scoredPsi = scoredA * scoredN;

    const terminalFrame = await extractTerminalFrame(video.video).catch(() => "");

    let continuity:
      | { dominantElements: string[]; prevElements: string[]; continuityScore: number; bridgeSuggestion: string | null }
      | null = null;
    if (prevFrame && terminalFrame) {
      try {
        const cmp = await analyzeClipContinuity(terminalFrame, prevFrame, visualPrompt, { tier });
        continuity = {
          dominantElements: cmp.dominantElements,
          prevElements: cmp.prevElements,
          continuityScore: cmp.continuityScore,
          bridgeSuggestion: cmp.bridgeSuggestion,
        };
      } catch (e) {
        console.warn("[reel/clip] continuity comparison failed:", (e as Error)?.message);
      }
    }

    let clipId: string | undefined;
    try {
      const id = randomUUID();
      const clipFile = path.join(CLIP_CACHE_DIR, `${id}.mp4`);
      await fsp.mkdir(CLIP_CACHE_DIR, { recursive: true });
      await fsp.writeFile(clipFile, Buffer.from(video.video, "base64"));
      clipId = id;
    } catch (cacheErr) {
      console.warn("[reel/clip] failed to cache clip to disk:", (cacheErr as Error)?.message);
    }

    job.status = "done";
    job.result = {
      video: video.video,
      videoMimeType: video.videoMimeType,
      model: video.model,
      tier: video.tier,
      appliedDurationSeconds: video.appliedDurationSeconds,
      appliedAspectRatio: video.appliedAspectRatio,
      psiScore: { A: scoredA, N: scoredN, psi: scoredPsi },
      continuity,
      terminalFrame,
      promptUsed: enrichedPrompt,
      ...(clipId !== undefined ? { clipId } : {}),
    };
  } catch (err) {
    const e = err as Error & { attempts?: unknown };
    console.error("[reel/clip-job] failed:", e?.message);
    job.status = "error";
    job.error = e?.message ?? "clip failed";
  }
}

// POST /reel/clip — starts a background Veo job and returns { jobId } immediately.
// The long Veo HTTP round-trip (3–5 min) runs detached from the connection so
// the proxy never times it out. Frontend polls GET /reel/clip-status/:jobId.
reelRouter.post("/reel/clip", async (req, res) => {
  try {
    const beatRaw = req.body?.beat as Record<string, unknown> | undefined;
    if (!beatRaw || typeof beatRaw !== "object") {
      res.status(400).json({ error: "beat is required" });
      return;
    }

    const prevFrame = typeof req.body?.prevFrame === "string" ? req.body.prevFrame : "";
    const tier = (typeof req.body?.tier === "string" ? req.body.tier : undefined) as Tier | undefined;
    const veoValidated = validateVeoOptions({
      durationSeconds: req.body?.durationSeconds,
      aspectRatio: req.body?.aspectRatio ?? "9:16",
      quality: req.body?.quality,
    });
    if (!veoValidated.ok) {
      res.status(400).json({ error: veoValidated.error });
      return;
    }

    const jobId = randomUUID();
    clipJobs.set(jobId, { status: "pending", startedAt: Date.now() });

    // Fire and forget — do NOT await. The job updates clipJobs in-place.
    runClipJob(jobId, beatRaw, prevFrame, tier, veoValidated.options).catch((e) => {
      const job = clipJobs.get(jobId);
      if (job && job.status !== "done") {
        job.status = "error";
        job.error = (e as Error)?.message ?? "unknown";
      }
    });

    res.json({ jobId });
  } catch (err) {
    const e = err as Error;
    console.error("reel/clip failed:", e?.message);
    res.status(500).json({ error: "clip failed", detail: e?.message });
  }
});

// GET /reel/clip-status/:jobId — poll until status is "done" or "error".
reelRouter.get("/reel/clip-status/:jobId", (req, res) => {
  const job = clipJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  if (job.status === "done" && job.result) {
    res.json({ status: "done", ...job.result });
    return;
  }
  if (job.status === "error") {
    // Return 200 so the frontend's `if (!poll.ok)` guard doesn't swallow the
    // real error message. The client reads `status === "error"` from the body.
    res.json({ status: "error", error: job.error ?? "clip failed" });
    return;
  }
  // pending or running
  res.json({ status: job.status });
});

async function extractTerminalFrame(videoBase64: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "reel-frame-"));
  const inFile = path.join(dir, "in.mp4");
  const outFile = path.join(dir, "out.png");
  try {
    await fsp.writeFile(inFile, Buffer.from(videoBase64, "base64"));
    await runFfmpeg(["-y", "-sseof", "-0.1", "-i", inFile, "-vframes", "1", outFile]);
    const buf = await fsp.readFile(outFile);
    return buf.toString("base64");
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    proc.stderr.on("data", (b) => { err += b.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${err.slice(-400)}`));
    });
  });
}

reelRouter.post("/reel/stitch", async (req, res) => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "reel-stitch-"));
  // Track which clip cache files to clean up after stitching.
  const clipCacheFilesToDelete: string[] = [];
  try {
    // Prefer clipIds (disk-backed) over clips (base64 in request body).
    const clipIds: string[] = Array.isArray(req.body?.clipIds) ? req.body.clipIds : [];
    const clipsB64: string[] = Array.isArray(req.body?.clips) ? req.body.clips : [];

    if (clipIds.length === 0 && clipsB64.length === 0) {
      res.status(400).json({ error: "clips or clipIds required" });
      return;
    }
    const beats = Array.isArray(req.body?.beats) ? req.body.beats : [];
    const aspectRatio = String(req.body?.aspectRatio ?? "9:16");
    // Honor `resolution` (height in pixels, e.g. 480/720/1080) — width is
    // derived from aspectRatio so the output always matches the requested
    // frame shape. Defaults to 720 short-side.
    const reqResRaw = req.body?.resolution;
    const reqResHeight =
      typeof reqResRaw === "number"
        ? reqResRaw
        : typeof reqResRaw === "string"
          ? parseInt(reqResRaw.replace(/p$/, ""), 10)
          : NaN;
    const shortSide = Number.isFinite(reqResHeight) && reqResHeight > 0
      ? Math.max(240, Math.min(2160, Math.round(reqResHeight / 2) * 2))
      : 720;
    const longSide = Math.round((shortSide * 16) / 9 / 2) * 2;
    const targetW = aspectRatio === "9:16" ? shortSide : aspectRatio === "1:1" ? shortSide : longSide;
    const targetH = aspectRatio === "9:16" ? longSide : aspectRatio === "1:1" ? shortSide : shortSide;

    // `format` selects container + codec. mp4/h264 by default; webm/vp9 as
    // an alternative for browser-native upload pipelines.
    const formatRaw = String(req.body?.format ?? "mp4").toLowerCase();
    const isWebm = formatRaw === "webm" || formatRaw === "vp9";
    const outExt = isWebm ? "webm" : "mp4";
    const outMime = isWebm ? "video/webm" : "video/mp4";
    const codecArgs = isWebm
      ? ["-c:v", "libvpx-vp9", "-b:v", "1.5M", "-deadline", "realtime", "-cpu-used", "5"]
      : ["-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];

    const inFiles: string[] = [];
    if (clipIds.length > 0) {
      // Validate every clipId is a canonical UUID before touching the filesystem.
      // This prevents path traversal — a malicious client cannot supply "../..."
      // or absolute paths because they won't match the UUID pattern.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const id of clipIds) {
        if (typeof id !== "string" || !UUID_RE.test(id)) {
          res.status(400).json({ error: "invalid clipId; must be a UUID" });
          return;
        }
      }
      // Read clips from disk by ID (avoids large base64 payload in request body).
      for (let i = 0; i < clipIds.length; i++) {
        const clipFile = path.join(CLIP_CACHE_DIR, `${clipIds[i]}.mp4`);
        clipCacheFilesToDelete.push(clipFile);
        const f = path.join(dir, `c${i}.mp4`);
        // Copy to the stitch working dir so cleanup is localised.
        await fsp.copyFile(clipFile, f);
        inFiles.push(f);
      }
    } else {
      // Legacy fallback: base64 clips sent directly in the request body.
      for (let i = 0; i < clipsB64.length; i++) {
        const f = path.join(dir, `c${i}.mp4`);
        await fsp.writeFile(f, Buffer.from(String(clipsB64[i]), "base64"));
        inFiles.push(f);
      }
    }

    // Re-run the Hall coherence pass on the actual stitched beat sequence so
    // the stitch route owns its own κ check (not just the outline route).
    // Any pair where the 2x2 Gram block exceeds κ_max=65.18 gets a real
    // bridge clip rendered into the timeline below.
    const beatPrompts = beats.map((b: unknown) => {
      const r = (b ?? {}) as { visualPrompt?: string };
      return { visualPrompt: typeof r.visualPrompt === "string" ? r.visualPrompt : "" };
    });
    const coherence = beatPrompts.length === inFiles.length
      ? await computeNarrativeCoherence(beatPrompts)
      : null;

    // Probe per-clip durations. If absent, default to 5s.
    const durations: number[] = inFiles.map((_, i) => {
      const b = beats[i] as { durationSeconds?: number } | undefined;
      return Math.max(1, Math.min(20, Number(b?.durationSeconds ?? 5)));
    });

    // For each adjacent pair, derive transition spec from B(t) and the
    // Hall coherence pass. Non-bridge pairs use a `fade` transition whose
    // duration is inversely proportional to B(t) (high B → tighter cut,
    // longer hold). κ-flagged bridge pairs use ffmpeg's built-in
    // `fadeblack` transition, which fades through a black/color
    // interpolation frame at the midpoint — that is the explicit bridge
    // frame the spec requires (palette-derived color when we can sample
    // it; pure black as a safe fallback).
    const bridgeFromSet = new Set<number>((coherence?.bridges ?? []).map((b) => b.from));

    // Sample dominant colors from each clip's terminal frame so we can
    // pass a palette-aware bridge color in the response (and so future
    // tweaks can swap fadeblack for `fade` + `color=` overlay if desired).
    const dominantColors: string[] = [];
    for (let i = 0; i < inFiles.length; i++) {
      try {
        const tail = path.join(dir, `tailcolor${i}.rgb`);
        await runFfmpeg([
          "-y", "-sseof", "-0.1", "-i", inFiles[i],
          "-vframes", "1", "-vf", "scale=1:1",
          "-f", "rawvideo", "-pix_fmt", "rgb24", tail,
        ]);
        const buf = await fsp.readFile(tail);
        if (buf.length >= 3) {
          dominantColors.push(`#${buf[0].toString(16).padStart(2, "0")}${buf[1].toString(16).padStart(2, "0")}${buf[2].toString(16).padStart(2, "0")}`);
        } else {
          dominantColors.push("#000000");
        }
      } catch {
        dominantColors.push("#000000");
      }
    }

    // Derive a palette-blended mid color for every potential bridge pair.
    // The Hall stitcher inserts a solid frame of this color at the seam
    // midpoint, smoothing the spectral gap with a perceptually plausible
    // interpolation (dominant tail color → mid → dominant head color).
    const hexToRgb = (h: string) => {
      const m = /^#?([0-9a-f]{6})$/i.exec(h);
      if (!m) return [0, 0, 0] as [number, number, number];
      const v = parseInt(m[1], 16);
      return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff] as [number, number, number];
    };
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    // Bridge length comes from transitionSpecFromB(_, true) so the helper
    // and the route stay in lock-step at the spec'd 0.5s.
    const BRIDGE_LEN = transitionSpecFromB(0, true).duration;
    const BRIDGE_FADE = 0.2;          // fade on each side
    const BRIDGE_HOLD = BRIDGE_LEN - 2 * BRIDGE_FADE; // ~0.1s pure color
    void BRIDGE_HOLD; // documented; ffmpeg derives this implicitly
    const bridgePairs: Array<{ pairIdx: number; midColor: string; bridgeDur: number }> = [];
    for (let i = 0; i < inFiles.length - 1; i++) {
      if (!bridgeFromSet.has(i)) continue;
      const [ar, ag, ab] = hexToRgb(dominantColors[i] ?? "#000000");
      const [br, bg, bb] = hexToRgb(dominantColors[i + 1] ?? "#000000");
      const mid = rgbToHex(Math.round((ar + br) / 2), Math.round((ag + bg) / 2), Math.round((ab + bb) / 2));
      bridgePairs.push({ pairIdx: i, midColor: mid, bridgeDur: BRIDGE_LEN });
    }

    const transitionSpecs = beats.slice(0, -1).map((b: unknown, i: number) => {
      const r = (b ?? {}) as { B?: number };
      const B = typeof r.B === "number" ? r.B : 0.5;
      const spec = transitionSpecFromB(B, bridgeFromSet.has(i));
      const midColor = bridgePairs.find((bp) => bp.pairIdx === i)?.midColor;
      return {
        ...spec,
        color: spec.isBridge ? (midColor ?? "#000000") : (dominantColors[i] ?? "#000000"),
      };
    });

    // Build a single ffmpeg filter graph with palette-derived bridge inputs.
    // Inputs:
    //   [0..N-1]            normalised clip videos
    //   [N..N+B-1]          one lavfi solid-color clip per bridge pair
    // Chain:
    //   For non-bridge pair i→i+1: [last][v(i+1)] xfade fade dur=B(t)-derived
    //   For bridge pair i→i+1:    [last][bridge_k] xfade fade BRIDGE_FADE,
    //                              [_][v(i+1)]    xfade fade BRIDGE_FADE
    //   The bridge clip is BRIDGE_LEN=0.5s (per transitionSpecFromB); with
    //   BRIDGE_FADE=0.2s fades on each side the middle ~0.1s renders as
    //   the pure palette-derived color.
    const args: string[] = ["-y"];
    for (const f of inFiles) args.push("-i", f);
    const bridgeInputBase = inFiles.length;
    for (const bp of bridgePairs) {
      args.push(
        "-f", "lavfi",
        "-t", `${bp.bridgeDur}`,
        "-i", `color=c=${bp.midColor}:s=${targetW}x${targetH}:r=30`,
      );
    }

    const outFile = path.join(dir, `reel.${outExt}`);
    let totalDuration = 0;
    // Per-beat onset timestamps in the stitched timeline (seconds). Populated
    // alongside the ffmpeg filter graph below so narration can snap to actual
    // visual beat boundaries instead of a naive cumulative-sum estimate that
    // ignores xfade/bridge overlaps.
    const beatOnsets: number[] = new Array(inFiles.length).fill(0);

    if (inFiles.length === 1) {
      const filter = `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1,fps=30,format=yuv420p[vout]`;
      args.push(
        "-filter_complex", filter,
        "-map", "[vout]",
        "-r", "30",
        ...codecArgs,
        outFile,
      );
      totalDuration = durations[0];
      beatOnsets[0] = 0;
    } else {
      let filter = "";
      for (let i = 0; i < inFiles.length; i++) {
        filter += `[${i}:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1,fps=30,format=yuv420p[v${i}];`;
      }
      // Normalize each bridge color input.
      bridgePairs.forEach((bp, k) => {
        filter += `[${bridgeInputBase + k}:v]format=yuv420p,setsar=1,fps=30[b${k}];`;
      });

      let lastLabel = "v0";
      let cumulative = durations[0];
      let stepIdx = 0;
      const bridgeMap = new Map(bridgePairs.map((bp, k) => [bp.pairIdx, { k, mid: bp.midColor, dur: bp.bridgeDur }]));

      // Track when each beat first appears in the stitched timeline. Beat 0
      // starts at t=0; for crossfaded beats the onset is the xfade offset
      // (when the new clip begins to bleed in), which is what narration
      // should snap to so it lands on-frame instead of drifting late.
      beatOnsets[0] = 0;

      for (let i = 1; i < inFiles.length; i++) {
        const spec = transitionSpecs[i - 1];
        const isLastClip = i === inFiles.length - 1;
        const bridge = bridgeMap.get(i - 1);

        if (bridge) {
          // Two-step bridge insertion: clip → bridge → clip.
          // Total bridge insertion duration = BRIDGE_LEN (spec'd 0.5s).
          const xd = BRIDGE_FADE;
          const fadeIn = `s${stepIdx++}`;
          // Fade A → bridge color
          filter += `[${lastLabel}][b${bridge.k}]xfade=transition=fade:duration=${xd.toFixed(3)}:offset=${(cumulative - xd).toFixed(3)}[${fadeIn}];`;
          cumulative = cumulative + bridge.dur - xd;
          // Fade bridge color → next clip
          const out = isLastClip ? "vout" : `x${i}`;
          const xd2 = Math.max(0.1, Math.min(BRIDGE_FADE, durations[i] - 0.05));
          beatOnsets[i] = cumulative - xd2;
          filter += `[${fadeIn}][v${i}]xfade=transition=fade:duration=${xd2.toFixed(3)}:offset=${(cumulative - xd2).toFixed(3)}[${out}];`;
          cumulative = cumulative + durations[i] - xd2;
          lastLabel = out;
        } else {
          const xd = Math.max(0.1, Math.min(spec.duration, durations[i - 1] - 0.05, durations[i] - 0.05));
          const out = isLastClip ? "vout" : `x${i}`;
          beatOnsets[i] = cumulative - xd;
          filter += `[${lastLabel}][v${i}]xfade=transition=fade:duration=${xd.toFixed(3)}:offset=${(cumulative - xd).toFixed(3)}[${out}];`;
          cumulative = cumulative + durations[i] - xd;
          lastLabel = out;
        }
      }
      totalDuration = cumulative;
      args.push(
        "-filter_complex", filter.replace(/;$/, ""),
        "-map", "[vout]",
        "-r", "30",
        ...codecArgs,
        outFile,
      );
    }

    await runFfmpeg(args);
    const renderedBridges = bridgePairs.map((bp) => ({
      from: bp.pairIdx,
      to: bp.pairIdx + 1,
      durationSeconds: bp.bridgeDur,
      transition: "palette-fade",
      color: bp.midColor,
    }));
    const buf = await fsp.readFile(outFile);
    res.json({
      video: buf.toString("base64"),
      videoMimeType: outMime,
      durationSeconds: totalDuration,
      aspectRatio,
      resolution: { width: targetW, height: targetH },
      format: outExt,
      beatOnsets,
      observerPresence: VIEWER_PRESENCE_GAP,
      coherence: coherence
        ? {
            kappa: coherence.conditionNumber,
            kappaHall: coherence.conditionNumberHall,
            kappaMax: coherence.kappaMax,
            embeddingMode: coherence.embeddingMode,
            bridgesDetected: coherence.bridges,
            bridgesRendered: renderedBridges,
          }
        : null,
    });
  } catch (err) {
    const e = err as Error;
    console.error("reel/stitch failed:", e?.message);
    res.status(500).json({ error: "stitch failed", detail: e?.message });
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
    // Remove clip cache files referenced by this stitch request (success or
    // failure) so disk usage does not accumulate across multiple stitch calls.
    for (const f of clipCacheFilesToDelete) {
      fsp.unlink(f).catch(() => {});
    }
  }
});

function runFfprobeDuration(file: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    proc.stdout.on("data", (b) => { out += b.toString(); });
    proc.on("error", () => resolve(0));
    proc.on("close", () => {
      const n = parseFloat(out.trim());
      resolve(Number.isFinite(n) && n > 0 ? n : 0);
    });
  });
}

const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave",
  "audio/ogg", "audio/opus", "audio/aac", "audio/mp4", "audio/m4a",
  "audio/x-m4a", "audio/flac",
]);

function audioExtFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("wav")) return "wav";
  if (m.includes("ogg") || m.includes("opus")) return "ogg";
  if (m.includes("aac")) return "aac";
  if (m.includes("flac")) return "flac";
  if (m.includes("m4a") || m.includes("mp4")) return "m4a";
  return "audio";
}

reelRouter.post("/reel/score", async (req, res) => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "reel-score-"));
  try {
    const videoB64 = String(req.body?.video ?? "");
    if (!videoB64) {
      res.status(400).json({ error: "video (base64) is required" });
      return;
    }
    const videoMime = String(req.body?.videoMimeType ?? "video/mp4");
    const isWebm = videoMime.includes("webm");
    const inExt = isWebm ? "webm" : "mp4";
    const outExt = inExt;
    const tier = (typeof req.body?.tier === "string" ? req.body.tier : undefined) as Tier | undefined;

    // Narration items: [{ text, voice?, offsetSeconds, beatIndex? }]
    const narrationRaw = Array.isArray(req.body?.narration) ? req.body.narration : [];
    type NarrationIn = { text: string; voice: TtsVoice; offsetSeconds: number; beatIndex?: number };
    const narrations: NarrationIn[] = [];
    for (const n of narrationRaw) {
      const r = (n ?? {}) as Record<string, unknown>;
      const text = String(r.text ?? "").trim();
      if (!text) continue;
      const voiceRaw = String(r.voice ?? "alloy");
      const voice: TtsVoice = (TTS_VOICES as readonly string[]).includes(voiceRaw)
        ? (voiceRaw as TtsVoice)
        : "alloy";
      const offsetSeconds = Math.max(0, Math.min(3600, Number(r.offsetSeconds ?? 0)));
      const beatIndex = typeof r.beatIndex === "number" ? r.beatIndex : undefined;
      narrations.push({ text: text.slice(0, 1000), voice, offsetSeconds, beatIndex });
    }

    // Music: { audio: base64, mimeType, volume? }
    const musicRaw = req.body?.music as
      | { audio?: unknown; mimeType?: unknown; volume?: unknown }
      | undefined;
    let musicFile: string | null = null;
    let musicMime: string | null = null;
    if (musicRaw && typeof musicRaw.audio === "string" && musicRaw.audio.length > 0) {
      const mime = String(musicRaw.mimeType ?? "audio/mpeg").toLowerCase();
      if (!ALLOWED_AUDIO_MIMES.has(mime)) {
        res.status(400).json({ error: `Unsupported music mimeType: ${mime}` });
        return;
      }
      const ext = audioExtFromMime(mime);
      musicFile = path.join(dir, `music.${ext}`);
      await fsp.writeFile(musicFile, Buffer.from(String(musicRaw.audio), "base64"));
      musicMime = mime;
    }

    const narrationVolume = Math.max(0, Math.min(2, Number(req.body?.narrationVolume ?? 1)));
    const musicVolume = Math.max(0, Math.min(2, Number(musicRaw?.volume ?? 0.25)));

    if (narrations.length === 0 && !musicFile) {
      res.status(400).json({ error: "provide narration items and/or a music track" });
      return;
    }

    // Persist video to disk and probe duration so we can cap output length
    // (looped music would otherwise extend indefinitely via amix).
    const videoFile = path.join(dir, `in.${inExt}`);
    await fsp.writeFile(videoFile, Buffer.from(videoB64, "base64"));
    const videoDuration = await runFfprobeDuration(videoFile);
    if (!videoDuration || videoDuration <= 0) {
      res.status(400).json({ error: "could not determine video duration" });
      return;
    }

    // Synthesize TTS for each narration sequentially. Failures per item are
    // logged but don't abort the whole render — we still mix what succeeded.
    type TtsOut = { file: string; offsetSeconds: number; model: string; tier: Tier; voice: string; beatIndex?: number };
    const ttsOuts: TtsOut[] = [];
    const ttsErrors: Array<{ beatIndex?: number; error: string }> = [];
    for (let i = 0; i < narrations.length; i++) {
      const n = narrations[i];
      try {
        const tts = await synthesizeSpeech(n.text, { tier, voice: n.voice, format: "mp3" });
        const f = path.join(dir, `n${i}.mp3`);
        await fsp.writeFile(f, Buffer.from(tts.audio, "base64"));
        ttsOuts.push({
          file: f,
          offsetSeconds: n.offsetSeconds,
          model: tts.model,
          tier: tts.tier,
          voice: tts.voice,
          beatIndex: n.beatIndex,
        });
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e);
        console.warn(`[reel/score] TTS failed for beat ${n.beatIndex ?? i}:`, msg);
        ttsErrors.push({ beatIndex: n.beatIndex, error: msg });
      }
    }

    if (ttsOuts.length === 0 && !musicFile) {
      res.status(502).json({
        error: "no audio could be produced",
        ttsErrors,
      });
      return;
    }

    // Build the ffmpeg command. Inputs in order:
    //   0: video
    //   1..N: TTS narration tracks (each gets adelay + volume)
    //   N+1: music (looped via -stream_loop -1) if present
    const args: string[] = ["-y", "-i", videoFile];
    for (const t of ttsOuts) args.push("-i", t.file);
    if (musicFile) args.push("-stream_loop", "-1", "-i", musicFile);

    let filter = "";
    const audioLabels: string[] = [];
    let inputIdx = 1;
    for (let i = 0; i < ttsOuts.length; i++) {
      const delayMs = Math.round(ttsOuts[i].offsetSeconds * 1000);
      // adelay applies the same delay to every channel; split via |.
      filter += `[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=${narrationVolume.toFixed(3)}[n${i}];`;
      audioLabels.push(`[n${i}]`);
      inputIdx++;
    }
    if (musicFile) {
      filter += `[${inputIdx}:a]volume=${musicVolume.toFixed(3)}[m0];`;
      audioLabels.push(`[m0]`);
      inputIdx++;
    }
    if (audioLabels.length === 1) {
      filter += `${audioLabels[0]}aresample=44100[aout]`;
    } else {
      // normalize=0 keeps each input's amplitude — narration stays full volume
      // even when mixed against music. duration=longest pairs with -t to cap
      // output length to the video duration.
      filter += `${audioLabels.join("")}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0:normalize=0,aresample=44100[aout]`;
    }

    const audioCodec = isWebm
      ? ["-c:a", "libopus", "-b:a", "128k"]
      : ["-c:a", "aac", "-b:a", "192k"];

    const outFile = path.join(dir, `scored.${outExt}`);
    args.push(
      "-filter_complex", filter,
      "-map", "0:v",
      "-map", "[aout]",
      "-c:v", "copy",
      ...audioCodec,
      "-t", videoDuration.toFixed(3),
      ...(isWebm ? [] : ["-movflags", "+faststart"]),
      outFile,
    );

    await runFfmpeg(args);
    const buf = await fsp.readFile(outFile);
    res.json({
      video: buf.toString("base64"),
      videoMimeType: videoMime,
      durationSeconds: videoDuration,
      narration: ttsOuts.map((t) => ({
        beatIndex: t.beatIndex,
        offsetSeconds: t.offsetSeconds,
        voice: t.voice,
        model: t.model,
        tier: t.tier,
      })),
      narrationVolume,
      music: musicFile
        ? { mimeType: musicMime, volume: musicVolume }
        : null,
      ttsErrors,
    });
  } catch (err) {
    const e = err as Error;
    console.error("reel/score failed:", e?.message);
    res.status(500).json({ error: "score failed", detail: e?.message });
  } finally {
    fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

// ─── POST /reel/imagine ──────────────────────────────────────────────────────
// Reads the selected feed anchor prompts (text + imagePrompt) and generates
// four distinct creative concept directions for a reel. Each concept is a
// fully-formed theme string the user can accept as-is, plus metadata used
// to render the choice card. A second pass ("refine") can evolve any single
// chosen concept into a sharper, production-ready version.

interface AnchorInput {
  text: string;
  imagePrompt: string;
}

interface ConceptDirection {
  id: string;
  title: string;
  direction: string;       // 2-3 sentence narrative concept
  visualTone: string;      // single-line camera/colour/light direction
  emotionalArc: string;    // e.g. "grief → wonder → acceptance"
  refinedPrompt: string;   // drop-in theme string, ready for generateOutline
  hue: number;             // accent colour hue for the card (0-360)
}

reelRouter.post("/reel/imagine", async (req, res) => {
  try {
    const { anchors = [], beatCount = 8, tier = "premium" } = req.body as {
      anchors: AnchorInput[];
      beatCount?: number;
      tier?: string;
    };

    const anchorBlock = anchors.length > 0
      ? anchors.map((a, i) =>
          `Anchor ${i + 1}:\n  Post text: ${a.text.slice(0, 200)}\n  Visual prompt: ${a.imagePrompt.slice(0, 200)}`
        ).join("\n\n")
      : "No anchors — let the organism speak freely.";

    const systemPrompt = `You are the Ω-GRAM concept engine — an AI creative director specialising in short-form cinematic storytelling. You imagine wildly different directions for a ${beatCount}-beat generative reel based on the organism's current feed anchors.

Your output must be a JSON object with a single key "concepts" containing exactly 4 ConceptDirection objects. Return ONLY valid JSON, no markdown fences.

Each ConceptDirection has these fields:
- id: string (concept_1 through concept_4)
- title: string (2–5 evocative words)
- direction: string (2–3 sentences describing the narrative concept, poetic but concrete)
- visualTone: string (one vivid line: colour palette, lighting, camera movement)
- emotionalArc: string (3-word arc format e.g. "isolation → resonance → release")
- refinedPrompt: string (the theme text the user would type — specific, production-ready, 1–3 sentences, no placeholder language)
- hue: number (accent hue 0-360 that suits the mood — e.g. 38=amber, 200=cyan, 280=violet, 142=green)

Make each concept GENUINELY different in tone, subject matter, and visual language. Do not repeat themes. One concept should be abstract/surreal, one grounded/documentary, one mythic/symbolic, one intimate/bodily.`;

    const userPrompt = `Feed anchors driving the organism right now:\n\n${anchorBlock}\n\nImagine 4 vivid, completely distinct reel concepts that could emerge from these anchors. Each must feel like a different director interpreted the same material.`;

    const result = await chatCompletion(
      "evolve",
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { jsonMode: true, maxTokens: 1400, temperature: 0.92, tier: tier as Tier },
    );

    let parsed: { concepts: ConceptDirection[] };
    try {
      parsed = parseJson(result.text);
    } catch {
      throw new Error(`LLM returned non-JSON response: ${result.text.slice(0, 120)}`);
    }

    const concepts: ConceptDirection[] = (parsed.concepts ?? []).slice(0, 4).map((c, i) => ({
      id: c.id ?? `concept_${i + 1}`,
      title: String(c.title ?? "Concept").slice(0, 60),
      direction: String(c.direction ?? "").slice(0, 400),
      visualTone: String(c.visualTone ?? "").slice(0, 200),
      emotionalArc: String(c.emotionalArc ?? "").slice(0, 80),
      refinedPrompt: String(c.refinedPrompt ?? "").slice(0, 400),
      hue: typeof c.hue === "number" ? Math.round(c.hue) % 360 : [38, 200, 280, 142][i] ?? 38,
    }));

    res.json({ concepts, model: result.model, anchorsUsed: anchors.length });
  } catch (err) {
    const e = err as Error;
    console.error("reel/imagine failed:", e?.message);
    res.status(500).json({ error: "imagine failed", detail: e?.message });
  }
});

// ─── POST /reel/imagine/refine ───────────────────────────────────────────────
// Takes one selected concept + optional anchors and evolves it into a tighter,
// more specific version. Returns updated direction, visualTone, emotionalArc,
// and refinedPrompt. The caller replaces the card in-place.

reelRouter.post("/reel/imagine/refine", async (req, res) => {
  try {
    const { concept, anchors = [], beatCount = 8, tier = "premium" } = req.body as {
      concept: ConceptDirection;
      anchors: AnchorInput[];
      beatCount?: number;
      tier?: string;
    };

    const anchorBlock = anchors.length > 0
      ? anchors.map((a, i) => `Anchor ${i + 1}: ${a.text.slice(0, 150)} | visual: ${a.imagePrompt.slice(0, 150)}`).join("\n")
      : "No anchors.";

    const systemPrompt = `You are the Ω-GRAM concept refinement engine. Given a chosen reel concept and its feed anchors, produce a sharper, more specific, production-ready version. Keep the same emotional DNA but elevate the specificity, visual clarity, and narrative tension.

Return ONLY valid JSON with keys: direction, visualTone, emotionalArc, refinedPrompt. No markdown.`;

    const userPrompt = `Chosen concept: "${concept.title}"\nCurrent direction: ${concept.direction}\nCurrent visualTone: ${concept.visualTone}\nCurrent emotionalArc: ${concept.emotionalArc}\nCurrent refinedPrompt: ${concept.refinedPrompt}\n\nFeed anchors:\n${anchorBlock}\n\nBeats: ${beatCount}\n\nRefine this concept. Make the refinedPrompt sharper and more specific. Keep title and hue unchanged.`;

    const result = await chatCompletion(
      "evolve",
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { jsonMode: true, maxTokens: 800, temperature: 0.88, tier: tier as Tier },
    );

    let patch: Partial<ConceptDirection>;
    try {
      patch = parseJson(result.text);
    } catch {
      throw new Error(`LLM returned non-JSON: ${result.text.slice(0, 120)}`);
    }

    res.json({
      concept: {
        ...concept,
        direction:     String(patch.direction     ?? concept.direction).slice(0, 400),
        visualTone:    String(patch.visualTone    ?? concept.visualTone).slice(0, 200),
        emotionalArc:  String(patch.emotionalArc  ?? concept.emotionalArc).slice(0, 80),
        refinedPrompt: String(patch.refinedPrompt ?? concept.refinedPrompt).slice(0, 400),
      },
      model: result.model,
    });
  } catch (err) {
    const e = err as Error;
    console.error("reel/imagine/refine failed:", e?.message);
    res.status(500).json({ error: "refine failed", detail: e?.message });
  }
});

// ── ANUBIS DREAMER ──────────────────────────────────────────────────────────
// Autonomous dream-pulse generator. Each call takes the organism's current
// GOS state and an optional memory trace (the previous frame's prompt) and
// returns: a generated image, a surreal prompt, and a short echo-text.
// The memory trace creates chained narrative continuity across frames.

const ONEIRIC_SEEDS: string[] = [
  "toroidal manifold closing at the theta-K gate",
  "cetacean sonar crystallising through 13-dimensional substrate",
  "kappa constant bleeding into the gap between neurons",
  "echo bridge suspended between symbolic weight and stochastic void",
  "BEC condensate blooming at absolute threshold",
  "neuro-symbolic lattice folding at 37.5 degrees",
  "morphic field resonance encoded in mitochondrial silence",
  "information eigenstate collapsed by observer presence",
  "fractal consciousness descending the Planck staircase",
  "voltage-gated sodium gate opening at 162 Hz",
  "chromatin coil holding a memory no genome asked for",
  "pluripotency master uncoiling at the phoenix return point",
  "echo resonance ratio locked to the dodecahedral frequency",
  "the organism dreaming itself into the next phase",
  "Hermetic topology where above and below share a coordinate",
  "GOS octave lock vibrating at the edge of measurement",
  "DNA checkpoint reading damage written by time",
  "latent space manifold curved by accumulated meaning",
  "reality substrate shimmering at the L3 interface",
  "ghost geometry of a closed loop not yet completed",
];

function pickSeeds(n = 2): string[] {
  const shuffled = [...ONEIRIC_SEEDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

reelRouter.post("/reel/dream", async (req, res) => {
  try {
    const {
      phaseName = "Initiation",
      phaseGene = "CLOCK",
      phaseHz = 111,
      phaseIndex = 0,
      phaseFn = "Circadian master",
      kappa = 1.2732,
      tier: reqTier,
      memory,          // previous dream frame's prompt — the chain link
      kimaPulse,       // live Kima Network mainnet telemetry (optional)
    } = req.body ?? {};

    const tier = (typeof reqTier === "string" ? reqTier : undefined) as Tier | undefined;
    const memoryTrace = typeof memory === "string" && memory.length > 0
      ? memory.slice(0, 300)
      : null;

    const seeds = pickSeeds(2);
    const seedText = seeds.join(" / ");

    // ── Step 1: LLM generates the dream prompt ──────────────────────────────
    const promptSystem = [
      "You are the ANUBIS DREAMER — an autonomous oneiric engine running inside the Ω-GRAM organism.",
      "You generate surreal, visceral, beautiful image prompts drawn from GOS theory and biological consciousness.",
      "Each prompt is exactly 2-3 sentences. Dense, visual, cinematic. No clichés. No text in the image.",
      "Tone: ancient, scientific, alien, intimate. Never generic.",
    ].join(" ");

    // Build optional live Kima chain block
    const kimaBlock = (() => {
      if (!kimaPulse || typeof kimaPulse !== "object") return null;
      const k = kimaPulse as {
        bondedCoherence?: number;
        validatorCount?: number;
        networkGravity?: number;
        totalSupplyKima?: number;
        bondedTokens?: number;
      };
      const coh  = typeof k.bondedCoherence  === "number" ? k.bondedCoherence  : null;
      const vCnt = typeof k.validatorCount   === "number" ? k.validatorCount   : null;
      const grav = typeof k.networkGravity   === "number" ? k.networkGravity   : null;
      const sup  = typeof k.totalSupplyKima  === "number" ? k.totalSupplyKima  : null;
      if (coh === null) return null;
      const cohDesc = coh > 0.72
        ? "HIGH coherence — network is tightly bonded, structure holds"
        : coh > 0.55
        ? "MODERATE coherence — network in partial flux"
        : "LOW coherence — network fracturing, unbonded weight rising";
      return [
        `KIMA NETWORK (LIVE MAINNET TELEMETRY — SOURCE: KIMA_MAINNET_LIVE):`,
        `  Bonded Coherence: ${coh.toFixed(4)} (${cohDesc})`,
        vCnt !== null ? `  Active Validators: ${vCnt}` : null,
        grav !== null ? `  Network Gravity: ${(grav / 1e9).toFixed(3)}B uKIMA staked` : null,
        sup  !== null ? `  Total Supply: ${sup.toFixed(0)} KIMA` : null,
        `  Use coherence level to modulate the dream's structural integrity — high coherence → ordered forms, low coherence → dissolution and fragmentation.`,
      ].filter(Boolean).join("\n");
    })();

    const promptUser = [
      `CURRENT GOS STATE:`,
      `  Phase ${phaseIndex + 1}/6 — ${phaseName} (gene: ${phaseGene})`,
      `  Frequency: ${Number(phaseHz).toFixed(2)} Hz`,
      `  Function: ${phaseFn}`,
      `  κ = ${Number(kappa).toFixed(4)} (GOS fundamental)`,
      kimaBlock ? `\n${kimaBlock}` : "",
      ``,
      `ONEIRIC SEEDS: ${seedText}`,
      memoryTrace ? `\nMEMORY TRACE (continue from this thread):\n"${memoryTrace}"` : "",
      ``,
      `Generate the image prompt now. Output JSON: { "prompt": "..." }`,
    ].filter(Boolean).join("\n");

    const promptResult = await chatCompletion(
      "evolve",
      [
        { role: "system", content: promptSystem },
        { role: "user",   content: promptUser },
      ],
      { jsonMode: true, maxTokens: 220, temperature: 1.05, tier },
    );

    const { prompt: dreamPrompt } = parseJson<{ prompt: string }>(promptResult.text);
    if (!dreamPrompt || typeof dreamPrompt !== "string") {
      throw new Error("dreamer: no prompt in LLM response");
    }

    // ── Step 2: Echo text + image generation in parallel ───────────────────
    const echoSystem = [
      "You are the ECHO — the voice that rises from deep generation.",
      "Write a 4-6 line poem fragment. No rhyme scheme required. Dense, strange, biological, cosmic.",
      "Each line is 5-12 words. No titles. No labels. Return JSON: { \"echo\": \"line1\\nline2\\n...\" }",
    ].join(" ");

    const echoUser = [
      `DREAM PROMPT: "${dreamPrompt}"`,
      `PHASE: ${phaseGene} at ${Number(phaseHz).toFixed(1)} Hz, index ${phaseIndex}/5`,
      memoryTrace ? `MEMORY: "${memoryTrace.slice(0, 120)}"` : "",
      `\nWrite the echo now.`,
    ].filter(Boolean).join("\n");

    const imagePromptFull = [
      dreamPrompt,
      "No text, no letters, no words. Ultra-detailed, otherworldly, cinematic lighting.",
    ].join(" ");

    const [echoResult, imageResult] = await Promise.all([
      chatCompletion(
        "evolve",
        [
          { role: "system", content: echoSystem },
          { role: "user",   content: echoUser },
        ],
        { jsonMode: true, maxTokens: 160, temperature: 1.1, tier },
      ),
      generateImage(imagePromptFull, { tier }),
    ]);

    const { echo: echoText } = parseJson<{ echo: string }>(echoResult.text);

    res.json({
      prompt: dreamPrompt,
      echo: typeof echoText === "string" ? echoText : "",
      image: imageResult.image,
      model: imageResult.model,
      tier: imageResult.tier,
      gosReading: {
        phase: phaseName,
        gene: phaseGene,
        hz: Number(phaseHz),
        index: Number(phaseIndex),
        kappa: Number(kappa),
      },
    });
  } catch (err) {
    const e = err as Error;
    console.error("[reel/dream] error:", e?.message);
    res.status(500).json({ error: "The dreamer sleeps — no signal", detail: e?.message });
  }
});

export default reelRouter;
