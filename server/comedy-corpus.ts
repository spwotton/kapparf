/**
 * COMEDY CORPUS ENGINE
 *
 * Queries the 12D Research Engine / Atlantis Oracle to retrieve real material from
 * George Carlin, Mitch Hedberg, and Theo Von, then stores chunks in Memory Cortex
 * (category = "comedy_training") for injection into the Goose Gazette humor preamble.
 *
 * Architecture:
 *   - Uses queryModel() from research-engine.ts (same pipeline as 12D TRE)
 *   - Stores chunks with embeddings in pgvector via storeMemory()
 *   - getComedyPreamble() does semantic search against comedy_training corpus
 *     and formats a ≤600-token preamble for the humor preamble builder
 *
 * Three comedians map to three κ-disc vectors (matching Tico Satire sectors):
 *   CARLIN_VEC   (0°)   — systemic absurdity, institutions, language games
 *   HEDBERG_VEC  (120°) — one-liner non-sequitur, anti-climax, flat delivery
 *   THEO_VEC     (240°) — Southern Gothic surreal, personal confessional, riff spiral
 */

import { storeMemory, searchMemory } from "./memory-cortex";
import { queryModel } from "./research-engine";

// κ-Lab Oracle URL (Node #1090 · Hotel Pochote Grande, Jacó)
// Set KAPPA_LAB_URL in env; falls back to internal research engine if unreachable
const KAPPA_LAB_URL = process.env.KAPPA_LAB_URL ?? "";

// ── κ-LAB ORACLE QUERY ────────────────────────────────────────────────────────
async function queryKappaLabOracle(question: string, voices: string[]): Promise<string | null> {
  if (!KAPPA_LAB_URL) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const resp = await fetch(`${KAPPA_LAB_URL}/api/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question,
        voices: voices.map(v => ({ corpus: v, weight: 1.0 })),
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`κ-Lab HTTP ${resp.status}`);
    // Response is SSE — collect master_token events
    const text = await resp.text();
    const masterTokens: string[] = [];
    for (const line of text.split("\n")) {
      if (line.startsWith("data:")) {
        try {
          const d = JSON.parse(line.slice(5).trim());
          if (d.type === "master_token" && d.token) masterTokens.push(d.token);
          if (d.type === "done" && d.master) masterTokens.push(d.master);
        } catch {}
      }
    }
    const result = masterTokens.join("").trim();
    if (result.length > 50) {
      console.log(`[COMEDY-CORPUS] κ-Lab Oracle: ${result.length} chars from vernacular corpus`);
      return result;
    }
    return null;
  } catch (e: any) {
    console.warn(`[COMEDY-CORPUS] κ-Lab Oracle unreachable: ${e.message} — falling back to internal engine`);
    return null;
  }
}

// ── COMEDIAN PROFILES ─────────────────────────────────────────────────────────
const COMEDIANS = [
  {
    id: "carlin",
    name: "George Carlin",
    theta: 0,
    vector: "CARLIN_VEC",
    query: `George Carlin standup comedy transcript bits about institutions, language, news media, bureaucracy, absurdity of everyday life. Famous routines: "Modern Man", "Stuff", "Seven Dirty Words", "The American Dream", "Rats and Squealers". Provide verbatim or near-verbatim famous lines and structural comedy techniques.`,
    style: "Systemic rage disguised as wordplay. The AP wire voice gone wrong. Institutions described from inside.",
  },
  {
    id: "hedberg",
    name: "Mitch Hedberg",
    theta: (2 * Math.PI) / 3,
    vector: "HEDBERG_VEC",
    query: `Mitch Hedberg standup comedy transcript. Famous one-liners: "I used to do drugs. I still do, but I used to, too.", "An escalator can never break", "I'm against picketing but I don't know how to show it", rice cake jokes, food puns, lazy logic anti-climax jokes. Provide verbatim famous lines.`,
    style: "Anti-climax. Setup that implies escalation, punchline that declines. Hedberg never finishes.",
  },
  {
    id: "theo_von",
    name: "Theo Von",
    theta: (4 * Math.PI) / 3,
    vector: "THEO_VEC",
    query: `Theo Von standup comedy transcript. Southern Gothic riff style. Famous bits about raccoons, being from Louisiana, strange wildlife encounters, growing up poor, bizarre rural observations, "This Past Weekend" podcast stories. Riff spiral technique — one observation spawning progressively stranger sub-observations.`,
    style: "Riff spiral. One observation fractures into seven stranger ones. Never returns to the premise.",
  },
];

// ── CORPUS STATUS ─────────────────────────────────────────────────────────────
let corpusLoaded = false;
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 3;

// ── LOAD CORPUS (κ-Lab Oracle primary → internal 12D engine fallback) ─────────
async function loadComedianCorpus(comedian: typeof COMEDIANS[0]): Promise<number> {
  try {
    console.log(`[COMEDY-CORPUS] Loading ${comedian.name} (${comedian.vector}) — trying κ-Lab Oracle first...`);

    // PRIMARY: κ-Lab Oracle `/api/synthesize` with vernacular corpora
    // The κ-Lab has simpsons/south_park/family_guy in its vernacular group —
    // we query it for comedy structure insights alongside the comedian profile
    let raw = await queryKappaLabOracle(
      `Comedy structure analysis: ${comedian.name}. ${comedian.query}`,
      ["simpsons", "south_park", "family_guy"]
    );

    // FALLBACK: internal 12D research engine (queryModel via OpenAI)
    if (!raw) {
      console.log(`[COMEDY-CORPUS] ${comedian.name}: κ-Lab unreachable — using internal 12D engine`);
      const result = await queryModel(
        "openai",
        "gpt-4o-mini",
        [
          {
            role: "system",
            content: `You are a comedy corpus archivist. Provide real, accurate transcribed material from ${comedian.name}'s standup routines. Include verbatim famous lines, structural patterns, and technique descriptions. Format as numbered chunks, each 2-4 sentences, focusing on the COMEDY TECHNIQUE visible in each bit. Be accurate — these are real routines.`,
          },
          { role: "user", content: comedian.query },
        ],
        1
      );
      raw = result.response;
    }

    if (!raw || raw.length < 100) {
      console.warn(`[COMEDY-CORPUS] ${comedian.name}: empty response from 12D engine`);
      return 0;
    }

    // Split into chunks (paragraph or double-newline boundaries)
    const chunks = raw.split(/\n{2,}|\n(?=\d+\.)/g)
      .map(c => c.replace(/^\d+\.\s*/, "").trim())
      .filter(c => c.length > 40);

    let stored = 0;
    for (const chunk of chunks.slice(0, 12)) {
      await storeMemory(
        "comedy_training",
        `${comedian.name} — ${comedian.vector}`,
        `[${comedian.name}] ${chunk}`,
        {
          comedian: comedian.id,
          vector: comedian.vector,
          thetaDeg: Math.round((comedian.theta * 180) / Math.PI),
          style: comedian.style,
        },
        `comedy-corpus:${comedian.id}`,
        0.8
      );
      stored++;
    }

    console.log(`[COMEDY-CORPUS] ${comedian.name}: stored ${stored} chunks`);
    return stored;
  } catch (e: any) {
    console.warn(`[COMEDY-CORPUS] Failed to load ${comedian.name}: ${e.message}`);
    return 0;
  }
}

export async function loadComedyCorpus(): Promise<{ loaded: number; comedian: string }[]> {
  loadAttempts++;
  const results = await Promise.all(COMEDIANS.map(async c => ({
    comedian: c.name,
    loaded: await loadComedianCorpus(c),
  })));
  corpusLoaded = results.some(r => r.loaded > 0);
  return results;
}

// ── PREAMBLE BUILDER ──────────────────────────────────────────────────────────
const PREAMBLE_HEADER = `COMEDY CORPUS SIGNAL (for humor calibration — do NOT reproduce these verbatim, use them as structural reference):`;

export async function getComedyPreamble(topic?: string): Promise<string | null> {
  try {
    const query = topic
      ? `${topic} standup comedy structure absurdity`
      : "standup comedy structure absurdity bureaucracy institutions anti-climax";

    const mems = await searchMemory(query, {
      limit: 6,
      category: "comedy_training",
      threshold: 0.15,
    });

    if (mems.length === 0) return null;

    // Pick 2 from each comedian if possible
    const byComedian: Record<string, typeof mems> = {};
    for (const m of mems) {
      const id = (m.metadata as any)?.comedian ?? "unknown";
      if (!byComedian[id]) byComedian[id] = [];
      if (byComedian[id].length < 2) byComedian[id].push(m);
    }

    const lines: string[] = [PREAMBLE_HEADER];
    for (const [id, items] of Object.entries(byComedian)) {
      const comedian = COMEDIANS.find(c => c.id === id);
      if (!comedian) continue;
      lines.push(`\n${comedian.name.toUpperCase()} (${comedian.vector} — style: ${comedian.style}):`);
      for (const item of items) {
        lines.push(`  • ${item.content.replace(/^\[.*?\]\s*/, "").slice(0, 200)}`);
      }
    }

    return lines.join("\n").slice(0, 2000);
  } catch (e: any) {
    console.warn("[COMEDY-CORPUS] getComedyPreamble error:", e.message);
    return null;
  }
}

export function getCorpusStatus() {
  return {
    loaded: corpusLoaded,
    loadAttempts,
    comedians: COMEDIANS.map(c => ({
      id: c.id,
      name: c.name,
      vector: c.vector,
      thetaDeg: Math.round((c.theta * 180) / Math.PI),
    })),
  };
}

// ── AUTO-LOAD ON STARTUP ──────────────────────────────────────────────────────
export function startComedyCorpusLoader() {
  console.log("[COMEDY-CORPUS] Scheduling corpus load — Carlin/Hedberg/Theo Von via 12D engine");
  setTimeout(async () => {
    if (loadAttempts >= MAX_LOAD_ATTEMPTS) return;
    try {
      const results = await loadComedyCorpus();
      const total = results.reduce((s, r) => s + r.loaded, 0);
      console.log(`[COMEDY-CORPUS] Loaded ${total} chunks total:`, results.map(r => `${r.comedian}=${r.loaded}`).join(", "));
    } catch (e: any) {
      console.warn("[COMEDY-CORPUS] Auto-load error:", e.message);
    }
  }, 4 * 60 * 1000); // 4 min after startup (after Tico Hyper initial delay)
}
