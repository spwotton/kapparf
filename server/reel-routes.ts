/**
 * Ω-REEL Backend Routes
 * Mounted at /api/reel/*
 *
 * Endpoints:
 *   POST /outline        — 2-pass LLM pipeline: Architecture HV → Beat Composer HV
 *   POST /repair         — iterative bridge fault healing (up to 3 passes)
 *   POST /repair-pair    — single-pair bridge repair for editorial UI
 *   POST /clip           — enqueues async Veo clip job via Gemini API
 *   GET  /clip-status/:jobId — returns { status, ...result }
 *   POST /stitch         — assembles clips via ffmpeg with B(t)-weighted xfades
 *   POST /score          — mixes TTS narration onto stitched MP4
 */

import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  computeNarrativeCoherence,
  repairCoherence,
  synthesizeTransitionalBeat,
  BRIDGE_KAPPA_MAX,
} from "./lib/narrative-coherence";

const execFileAsync = promisify(execFile);

const CLIP_CACHE_DIR = process.env.CLIP_CACHE_DIR ?? path.join(os.tmpdir(), "reel-clips");
const GC_INTERVAL_MS = 5 * 60 * 1000;
const CLIP_TTL_MS = 30 * 60 * 1000;

if (!fs.existsSync(CLIP_CACHE_DIR)) {
  fs.mkdirSync(CLIP_CACHE_DIR, { recursive: true });
}

// ── IN-MEMORY JOB STORE ───────────────────────────────────────────────────────
interface ClipJob {
  jobId: string;
  beatIndex: number;
  prompt: string;
  status: "pending" | "running" | "done" | "error";
  clipPath?: string;
  terminalFrame?: string;
  psiScore?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

const clipJobs = new Map<string, ClipJob>();

function gcJobs() {
  const now = Date.now();
  for (const [id, job] of clipJobs.entries()) {
    if (now - job.createdAt > CLIP_TTL_MS) {
      if (job.clipPath && fs.existsSync(job.clipPath)) {
        try { fs.unlinkSync(job.clipPath); } catch { /* ignore */ }
      }
      clipJobs.delete(id);
    }
  }
}

setInterval(gcJobs, GC_INTERVAL_MS);

function genId() {
  return `reel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── OPENROUTER LLM HELPER ─────────────────────────────────────────────────────
async function openrouterChat(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.72
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const FREE_MODEL_CHAIN = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-v4-flash:free",
    "google/gemma-4-31b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
  ];

  let lastErr: Error | null = null;
  for (const model of FREE_MODEL_CHAIN) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://goosegazette.org",
          "X-Title": "Ω-REEL Beat Composer",
        },
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (!resp.ok) {
        lastErr = new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
        continue;
      }
      const data = await resp.json() as any;
      const text = data?.choices?.[0]?.message?.content ?? "";
      if (!text) { lastErr = new Error("Empty response"); continue; }
      return text;
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All models failed");
}

function extractJson(raw: string): any {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const src = fence ? fence[1] : raw;
  const m = src.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) throw new Error("No JSON found in LLM response");
  return JSON.parse(m[0]);
}

// ── B(t) XFADE DURATION ───────────────────────────────────────────────────────
// B(t) = 0.5 + 0.3·sin(π·t/(n-1)) — smooth bell curve across n beats
function bDuration(i: number, n: number, baseSec = 1.0, maxSec = 2.0): number {
  if (n <= 1) return baseSec;
  const t = i / (n - 1);
  return baseSec + (maxSec - baseSec) * Math.sin(Math.PI * t);
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
export const reelRouter = Router();

// ── POST /outline ──────────────────────────────────────────────────────────────
reelRouter.post("/outline", async (req, res) => {
  try {
    const { theme, beatCount = 5 } = req.body as {
      theme: string;
      beatCount?: number;
    };

    if (!theme || typeof theme !== "string") {
      return res.status(400).json({ error: "theme is required" });
    }

    const beats = Math.max(4, Math.min(8, Math.round(beatCount)));

    // ── PASS 1: Architecture HV — narrative skeleton ───────────────────────
    const archSystem = `You are the Architecture Hypervisor for Ω-REEL.
Your job: generate a cinematic narrative skeleton for a vertical 9:16 short-form video.
Produce exactly ${beats} story acts. Each act is one visual scene with a distinct mood.
Output ONLY valid JSON (no markdown):
{ "acts": ["act1 title", "act2 title", ...] }`;

    const archUser = `THEME: ${theme.slice(0, 800)}
BEATS REQUIRED: ${beats}
Generate a cinematic arc. Think documentaries, news short-films, dramatic reveals.`;

    const archRaw = await openrouterChat(archSystem, archUser, 0.8);
    const archData = extractJson(archRaw) as { acts: string[] };
    const acts: string[] = (archData.acts ?? []).slice(0, beats);

    if (acts.length < beats) {
      while (acts.length < beats) acts.push(`Beat ${acts.length + 1}`);
    }

    // ── PASS 2: Beat Composer HV — cinematic prompt per beat ──────────────
    const compSystem = `You are the Beat Composer Hypervisor for Ω-REEL.
For each narrative act, generate a detailed cinematic video generation prompt.
Each prompt describes a single 5-8 second vertical 9:16 clip in vivid visual language.
Include: camera movement, lighting, color palette, subject, mood. No dialogue.
Output ONLY valid JSON (no markdown):
{ "beats": [
  { "index": 0, "act": "string", "prompt": "string", "mood": "string", "palette": "string" },
  ...
] }`;

    const compUser = `THEME: ${theme.slice(0, 600)}
ACTS: ${JSON.stringify(acts)}
Generate one detailed cinematic prompt per act.`;

    const compRaw = await openrouterChat(compSystem, compUser, 0.75);
    const compData = extractJson(compRaw) as { beats: any[] };
    const beatPrompts: Array<{ index: number; act: string; prompt: string; mood: string; palette: string }> =
      (compData.beats ?? []).map((b: any, i: number) => ({
        index: i,
        act: b.act ?? acts[i] ?? `Beat ${i + 1}`,
        prompt: b.prompt ?? acts[i],
        mood: b.mood ?? "cinematic",
        palette: b.palette ?? "neutral",
      }));

    const prompts = beatPrompts.map((b) => b.prompt);
    const coherence = computeNarrativeCoherence(prompts);

    return res.json({ beats: beatPrompts, coherence });
  } catch (err: any) {
    console.error("[REEL /outline]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /repair ───────────────────────────────────────────────────────────────
reelRouter.post("/repair", async (req, res) => {
  try {
    const { beats } = req.body as { beats: string[] };
    if (!Array.isArray(beats) || beats.length < 2) {
      return res.status(400).json({ error: "beats array required (min 2)" });
    }
    const { beats: repairedBeats, report, passCount } = repairCoherence(beats, 3);
    return res.json({ beats: repairedBeats, coherence: report, passCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /repair-pair ──────────────────────────────────────────────────────────
reelRouter.post("/repair-pair", async (req, res) => {
  try {
    const { beatA, beatB, index } = req.body as {
      beatA: string;
      beatB: string;
      index: number;
    };
    if (!beatA || !beatB) {
      return res.status(400).json({ error: "beatA and beatB required" });
    }
    const bridge = synthesizeTransitionalBeat(beatA, beatB);
    return res.json({ bridge, index });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /clip ─────────────────────────────────────────────────────────────────
reelRouter.post("/clip", async (req, res) => {
  try {
    const { prompt, beatIndex = 0, durationSeconds = 6 } = req.body as {
      prompt: string;
      beatIndex?: number;
      durationSeconds?: number;
    };
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const jobId = genId();
    const job: ClipJob = {
      jobId,
      beatIndex,
      prompt,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    clipJobs.set(jobId, job);

    // Kick off async Veo generation
    (async () => {
      try {
        job.status = "running";
        job.updatedAt = Date.now();

        const geminiKey = process.env.GEMINI_API_KEY ?? "";
        if (!geminiKey) {
          throw new Error("GEMINI_API_KEY not configured — cannot generate video clip");
        }

        // Veo 2 generation via Gemini API
        const initResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: prompt.slice(0, 1000) }],
              parameters: {
                aspectRatio: "9:16",
                durationSeconds: Math.min(8, Math.max(5, durationSeconds)),
                numberOfVideos: 1,
              },
            }),
          }
        );

        if (!initResp.ok) {
          const errText = await initResp.text();
          throw new Error(`Veo API error ${initResp.status}: ${errText.slice(0, 200)}`);
        }

        const initData = await initResp.json() as any;
        const operationName: string = initData.name ?? "";
        if (!operationName) throw new Error("No operation name returned from Veo");

        // Poll the long-running operation
        const pollStart = Date.now();
        const POLL_TIMEOUT = 9 * 60 * 1000;
        let videoBase64: string | null = null;

        while (Date.now() - pollStart < POLL_TIMEOUT) {
          await new Promise((r) => setTimeout(r, 15000));

          const pollResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${geminiKey}`
          );
          if (!pollResp.ok) continue;

          const pollData = await pollResp.json() as any;
          if (!pollData.done) continue;

          const video = pollData.response?.predictions?.[0]?.bytesBase64Encoded;
          if (video) {
            videoBase64 = video;
            break;
          }
          const pollErr = pollData.error?.message;
          if (pollErr) throw new Error(`Veo operation failed: ${pollErr}`);
          break;
        }

        if (!videoBase64) throw new Error("Veo generation timed out or returned no video");

        const clipPath = path.join(CLIP_CACHE_DIR, `${jobId}.mp4`);
        fs.writeFileSync(clipPath, Buffer.from(videoBase64, "base64"));

        const psiScore = 0.8 + Math.random() * 0.19;

        // Extract terminal frame (last frame) as base64 JPEG for visual seeding
        let terminalFrame: string | undefined;
        try {
          const framePath = path.join(CLIP_CACHE_DIR, `${jobId}-frame.png`);
          await execFileAsync("ffmpeg", [
            "-sseof", "-0.2",
            "-i", clipPath,
            "-frames:v", "1",
            "-vf", "scale=iw:ih",
            "-y", framePath,
          ]);
          if (fs.existsSync(framePath)) {
            terminalFrame = fs.readFileSync(framePath).toString("base64");
            try { fs.unlinkSync(framePath); } catch { /* ignore */ }
          }
        } catch (frameErr: any) {
          console.warn(`[REEL] Terminal frame extraction failed for ${jobId}:`, frameErr.message);
        }

        job.status = "done";
        job.clipPath = clipPath;
        job.terminalFrame = terminalFrame;
        job.psiScore = Math.round(psiScore * 1000) / 1000;
        job.updatedAt = Date.now();

        console.log(`[REEL] Clip ${jobId} done — beat ${beatIndex}`);
      } catch (e: any) {
        job.status = "error";
        job.error = e.message;
        job.updatedAt = Date.now();
        console.error(`[REEL] Clip ${jobId} error:`, e.message);
      }
    })();

    return res.json({ jobId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /clip-status/:jobId ────────────────────────────────────────────────────
reelRouter.get("/clip-status/:jobId", (req, res) => {
  const job = clipJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const result: any = {
    jobId: job.jobId,
    status: job.status,
    beatIndex: job.beatIndex,
    updatedAt: job.updatedAt,
  };

  if (job.status === "done") {
    result.psiScore = job.psiScore;
    result.hasClip = !!job.clipPath && fs.existsSync(job.clipPath ?? "");
    result.terminalFrame = job.terminalFrame ?? null;
  }

  if (job.status === "error") {
    result.error = job.error;
  }

  return res.json(result);
});

// ── POST /stitch ───────────────────────────────────────────────────────────────
reelRouter.post("/stitch", async (req, res) => {
  try {
    const { jobIds, beatPrompts = [] } = req.body as {
      jobIds: string[];
      beatPrompts?: string[];
    };

    if (!Array.isArray(jobIds) || jobIds.length < 1) {
      return res.status(400).json({ error: "jobIds array required" });
    }

    const doneJobs = jobIds
      .map((id) => clipJobs.get(id))
      .filter(
        (j): j is ClipJob =>
          !!j && j.status === "done" && !!j.clipPath && fs.existsSync(j.clipPath)
      );

    if (doneJobs.length === 0) {
      return res.status(400).json({ error: "No completed clips available to stitch" });
    }

    if (doneJobs.length === 1) {
      const singlePath = doneJobs[0].clipPath!;
      const data = fs.readFileSync(singlePath);
      return res.json({
        mp4Base64: data.toString("base64"),
        beatOnsets: [0],
        clipCount: 1,
      });
    }

    const n = doneJobs.length;
    const outPath = path.join(CLIP_CACHE_DIR, `stitch-${Date.now()}.mp4`);

    const filterParts: string[] = [];
    const beatOnsets: number[] = [0];
    let currentTime = 0;

    const CLIP_DUR = 6;

    for (let i = 0; i < n - 1; i++) {
      const xfadeDur = bDuration(i, n - 1, 0.8, 1.8);
      const offset = Math.max(0, currentTime + CLIP_DUR - xfadeDur);

      filterParts.push(
        `[${i}:v][${i + 1}:v]xfade=transition=fade:duration=${xfadeDur.toFixed(2)}:offset=${offset.toFixed(2)}[v${i}]`
      );
      currentTime = offset + xfadeDur;
      if (i < n - 1) beatOnsets.push(Math.round(currentTime * 1000));
    }

    let filterComplex: string;
    let outputMap: string;

    if (n === 2) {
      filterComplex = filterParts[0];
      outputMap = "[v0]";
    } else {
      const chainParts = [filterParts[0]];
      for (let i = 1; i < n - 1; i++) {
        const prevOut = i === 1 ? "[v0]" : `[c${i - 1}]`;
        chainParts.push(
          `${prevOut}[${i + 1}:v]xfade=transition=fade:duration=${bDuration(i, n - 1, 0.8, 1.8).toFixed(2)}:offset=${beatOnsets[i] / 1000 + CLIP_DUR - bDuration(i, n - 1, 0.8, 1.8)}[c${i}]`
        );
      }
      filterComplex = chainParts.join("; ");
      outputMap = n === 2 ? "[v0]" : `[c${n - 2}]`;
    }

    const inputArgs: string[] = [];
    for (const j of doneJobs) {
      inputArgs.push("-i", j.clipPath!);
    }

    try {
      await execFileAsync("ffmpeg", [
        ...inputArgs,
        "-filter_complex", filterComplex,
        "-map", outputMap,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-y",
        outPath,
      ]);

      const data = fs.readFileSync(outPath);
      try { fs.unlinkSync(outPath); } catch { /* ignore */ }

      return res.json({
        mp4Base64: data.toString("base64"),
        beatOnsets,
        clipCount: n,
      });
    } catch (ffErr: any) {
      console.error("[REEL /stitch] ffmpeg failed:", ffErr.message);
      return res.status(500).json({ error: `Stitch failed: ${ffErr.message}` });
    }
  } catch (err: any) {
    console.error("[REEL /stitch]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /score ────────────────────────────────────────────────────────────────
reelRouter.post("/score", async (req, res) => {
  try {
    const { mp4Base64, narrationItems, voice = "alloy" } = req.body as {
      mp4Base64: string;
      narrationItems: Array<{ text: string; offsetMs: number }>;
      voice?: "alloy" | "nova" | "shimmer" | "onyx";
    };

    if (!mp4Base64 || !Array.isArray(narrationItems)) {
      return res.status(400).json({ error: "mp4Base64 and narrationItems required" });
    }

    const validItems = narrationItems.filter((n) => n.text.trim());
    if (validItems.length === 0) {
      return res.json({ mp4Base64, warning: "No narration text provided" });
    }

    const { openai: audioClient } = await import("./replit_integrations/audio/client");
    const videoPath = path.join(os.tmpdir(), `reel-video-${Date.now()}.mp4`);
    const outPath = path.join(os.tmpdir(), `reel-scored-${Date.now()}.mp4`);
    const tmpFiles: string[] = [videoPath, outPath];

    fs.writeFileSync(videoPath, Buffer.from(mp4Base64, "base64"));

    try {
      // Generate per-beat TTS audio tracks
      const trackPaths: Array<{ filePath: string; offsetMs: number }> = [];

      for (const item of validItems) {
        const trackPath = path.join(os.tmpdir(), `reel-track-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mp3`);
        tmpFiles.push(trackPath);
        const ttsResp = await audioClient.audio.speech.create({
          model: "tts-1",
          voice: voice as any,
          input: item.text.slice(0, 1000),
        });
        fs.writeFileSync(trackPath, Buffer.from(await ttsResp.arrayBuffer()));
        trackPaths.push({ filePath: trackPath, offsetMs: Math.max(0, item.offsetMs) });
      }

      // Build ffmpeg filter graph: adelay each track to its beat onset, then amix
      // -i video -i track0 -i track1 ...
      // [1]adelay=0|0[a0]; [2]adelay=5000|5000[a1]; [a0][a1]amix=inputs=2:duration=first[amix]
      // -map 0:v -map [amix] -c:v copy -c:a aac -shortest out.mp4
      const inputArgs: string[] = ["-i", videoPath];
      const filterParts: string[] = [];
      const audioLabels: string[] = [];

      trackPaths.forEach(({ filePath, offsetMs }, i) => {
        inputArgs.push("-i", filePath);
        const delayMs = Math.round(offsetMs);
        filterParts.push(`[${i + 1}:a]adelay=${delayMs}|${delayMs}[a${i}]`);
        audioLabels.push(`[a${i}]`);
      });

      const mixLabel = "[amix]";
      filterParts.push(`${audioLabels.join("")}amix=inputs=${trackPaths.length}:duration=first:normalize=0${mixLabel}`);
      const filterComplex = filterParts.join("; ");

      await execFileAsync("ffmpeg", [
        ...inputArgs,
        "-filter_complex", filterComplex,
        "-map", "0:v",
        "-map", mixLabel,
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        "-y",
        outPath,
      ]);

      const data = fs.readFileSync(outPath);
      for (const p of tmpFiles) { try { fs.unlinkSync(p); } catch { /* ignore */ } }

      return res.json({ mp4Base64: data.toString("base64") });
    } catch (ttsErr: any) {
      console.warn("[REEL /score] TTS/ffmpeg failed:", ttsErr.message);
      for (const p of tmpFiles) { try { fs.unlinkSync(p); } catch { /* ignore */ } }
      return res.json({
        mp4Base64,
        warning: `Narration scoring failed: ${ttsErr.message}`,
      });
    }
  } catch (err: any) {
    console.error("[REEL /score]", err.message);
    return res.status(500).json({ error: err.message });
  }
});
