/**
 * TICO SATIRE HYPERVISOR — 3-Sector Geometric Agent Team
 *
 * Partitions the κ-disc into 3 equal sectors at 0°, 120°, 240° (2π/3 radians each).
 * Each sector is an autonomous agent that:
 *   1. Fetches REAL RSS headlines from its assigned Costa Rica news sources
 *   2. Blends each headline with Onion-style satire DNA via OpenRouter
 *   3. Emits a "blended intelligence brief" stored in Memory Cortex (category=tico_satire)
 *   4. Provides getTicoSatireBriefing() for injection into goose-generator humor preamble
 *
 * SECTOR GEOMETRY (κ-disc partition at θ_K = 128.23°):
 *   SECTOR_A  θ = 0°      NACION_VECTOR   — La Nación + Teletica  (política/economía)
 *   SECTOR_B  θ = 120°    CRHOY_VECTOR    — CRHoy + Diario Extra  (sucesos/sociedad)
 *   SECTOR_C  θ = 240°    OBSERVADOR_VEC  — El Observador + Tico Times (naturaleza/raro)
 *
 * Phase offsets: sectors fire 5 min apart to avoid simultaneous OpenRouter bursts.
 * Full cycle: 15 min. State persisted to .local/tico-satire-hypervisor.json
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { storeMemory, searchMemory } from "./memory-cortex";

// ── GEOMETRIC CONSTANTS ───────────────────────────────────────────────────────
const THETA_A = 0;                           // 0°   NACION_VECTOR
const THETA_B = (2 * Math.PI) / 3;          // 120° CRHOY_VECTOR
const THETA_C = (4 * Math.PI) / 3;          // 240° OBSERVADOR_VEC
const CYCLE_MS = 15 * 60 * 1000;            // 15 min full cycle
const PHASE_OFFSET_MS = 5 * 60 * 1000;      // 5 min phase offset between sectors
const STATE_FILE = path.join(".local", "tico-satire-hypervisor.json");

// ── RSS SOURCES PER SECTOR ────────────────────────────────────────────────────
const SECTOR_A_SOURCES = [
  { name: "La Nación",  url: "https://www.nacion.com/arc/outboundfeeds/rss/?outputType=xml" },
  { name: "Teletica",   url: "https://teletica.com/rss.xml" },
];
const SECTOR_B_SOURCES = [
  { name: "CRHoy",      url: "https://crhoy.com/feed/" },
  { name: "Diario Extra", url: "https://www.diarioextra.com/rss" },
];
const SECTOR_C_SOURCES = [
  { name: "El Observador", url: "https://observador.cr/feed/" },
  { name: "Tico Times",    url: "https://ticotimes.net/feed" },
];

// ── OPENROUTER CLIENT ─────────────────────────────────────────────────────────
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://goosegazette.org",
    "X-Title": "Tico Satire Hypervisor",
  },
});
const BLEND_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

// ── STATE ─────────────────────────────────────────────────────────────────────
interface SectorState {
  theta: number;
  name: string;
  lastRun: number;
  lastHeadlines: string[];
  lastBlend: string | null;
  cycleCount: number;
  errors: number;
}

interface HypervisorState {
  sectors: { A: SectorState; B: SectorState; C: SectorState };
  totalCycles: number;
  started: number;
  lastBriefing: string | null;
  lastBriefingTs: number;
}

function defaultState(): HypervisorState {
  return {
    sectors: {
      A: { theta: THETA_A, name: "NACION_VECTOR", lastRun: 0, lastHeadlines: [], lastBlend: null, cycleCount: 0, errors: 0 },
      B: { theta: THETA_B, name: "CRHOY_VECTOR",  lastRun: 0, lastHeadlines: [], lastBlend: null, cycleCount: 0, errors: 0 },
      C: { theta: THETA_C, name: "OBSERVADOR_VEC", lastRun: 0, lastHeadlines: [], lastBlend: null, cycleCount: 0, errors: 0 },
    },
    totalCycles: 0,
    started: Date.now(),
    lastBriefing: null,
    lastBriefingTs: 0,
  };
}

function loadState(): HypervisorState {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {}
  return defaultState();
}

function saveState(s: HypervisorState) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch {}
}

let state = loadState();

// ── RSS FETCHER ───────────────────────────────────────────────────────────────
async function fetchRSSHeadlines(url: string, sourceName: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "GooseGazette/1.0 RSS-Reader" },
    });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const xml = await resp.text();

    // Extract <title> tags from items (skip first one — usually the feed title)
    const titles: string[] = [];
    const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
    const titleRe = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
    let match: RegExpExecArray | null;
    while ((match = itemRe.exec(xml)) !== null && titles.length < 6) {
      const t = titleRe.exec(match[0]);
      if (t?.[1]) {
        const clean = t[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
        if (clean.length > 10) titles.push(clean);
      }
    }
    console.log(`[TICO-HYPER] ${sourceName}: ${titles.length} headlines fetched`);
    return titles;
  } catch (e: any) {
    console.warn(`[TICO-HYPER] RSS failed for ${sourceName} (${url}): ${e.message}`);
    return [];
  }
}

// ── ONION BLEND PROMPT ────────────────────────────────────────────────────────
const BLEND_SYSTEM = `You are the TICO ONION BLENDER — a satirical intelligence module.

You receive real headlines from Costa Rican news sites. Your job: transform each into
an Onion-style satirical headline that:
  1. Keeps the REAL geographical location (Jacó, Escazú, Desamparados, Liberia, etc.)
  2. Uses AP-wire rigidity — past tense, declarative, no winking
  3. Applies the Onion formula: ONE straight element + ONE absurd element
  4. Preserves the bureaucratic Costa Rican flavor — ministries, MOPT, ICE, CCSS, AyA
  5. May include ONE tico colloquialism from a local witness in flat English translation
     (e.g., "a resident described the situation as 'tuanis, actually'")

NEVER:
  - Signal the joke ("bizarrely", "strangely", "oddly")
  - Use "pura vida" as a punchline
  - Invent a location — only use the real one from the source headline

Output JSON only:
{
  "blends": [
    {
      "original": "...",
      "satirized": "...",
      "dateline": "real CR place name",
      "sector": "A|B|C",
      "onion_layer": 1-7
    }
  ],
  "briefing": "2-3 sentence editorial summary of what's happening in CR today, written in flat AP style"
}`;

async function blendSector(
  sectorId: "A" | "B" | "C",
  headlines: string[],
  sectorName: string
): Promise<{ blends: any[]; briefing: string } | null> {
  if (headlines.length === 0) return null;
  try {
    const resp = await openrouter.chat.completions.create({
      model: BLEND_MODEL,
      temperature: 0.85,
      max_tokens: 1200,
      messages: [
        { role: "system", content: BLEND_SYSTEM },
        {
          role: "user",
          content: `SECTOR ${sectorId} (${sectorName}) — Real CR headlines to blend:\n\n${
            headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")
          }\n\nBlend these into Onion-style satirical versions. Output JSON only.`,
        },
      ],
    });
    const raw = resp.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    return {
      blends: parsed.blends ?? [],
      briefing: parsed.briefing ?? "",
    };
  } catch (e: any) {
    console.warn(`[TICO-HYPER] Blend failed for sector ${sectorId}: ${e.message}`);
    return null;
  }
}

// ── SECTOR RUNNER ─────────────────────────────────────────────────────────────
async function runSector(
  sectorId: "A" | "B" | "C",
  sources: { name: string; url: string }[]
): Promise<void> {
  const sec = state.sectors[sectorId];
  const thetaDeg = Math.round((sec.theta * 180) / Math.PI);
  console.log(`[TICO-HYPER] Sector ${sectorId} (${sec.name} θ=${thetaDeg}°) firing...`);

  // 1. Fetch all sources in parallel
  const headlineSets = await Promise.all(sources.map(s => fetchRSSHeadlines(s.url, s.name)));
  const allHeadlines = headlineSets.flat().slice(0, 8);
  sec.lastHeadlines = allHeadlines;

  if (allHeadlines.length === 0) {
    sec.errors++;
    console.warn(`[TICO-HYPER] Sector ${sectorId}: no headlines from any source`);
    saveState(state);
    return;
  }

  // 2. Blend with Onion DNA
  const result = await blendSector(sectorId, allHeadlines, sec.name);
  if (!result) {
    sec.errors++;
    saveState(state);
    return;
  }

  // 3. Store in Memory Cortex
  const blendText = result.blends.map(b =>
    `[${b.dateline ?? "CR"}] ${b.satirized} (from: ${b.original})`
  ).join("\n");

  await storeMemory(
    "tico_satire",
    `Sector ${sectorId} ${sec.name} — ${new Date().toISOString().slice(0, 10)}`,
    blendText + "\n\nBRIEFING: " + result.briefing,
    { sector: sectorId, theta: thetaDeg, sources: sources.map(s => s.name), blends: result.blends },
    `tico-satire-hypervisor:sector-${sectorId}`,
    0.7
  );

  // 4. Update state
  sec.lastBlend = blendText;
  sec.lastRun = Date.now();
  sec.cycleCount++;
  state.totalCycles++;

  // Compose combined briefing from all sectors
  const allBlends = [state.sectors.A.lastBlend, state.sectors.B.lastBlend, state.sectors.C.lastBlend]
    .filter(Boolean).join("\n---\n");
  state.lastBriefing = allBlends || null;
  state.lastBriefingTs = Date.now();

  saveState(state);
  console.log(`[TICO-HYPER] Sector ${sectorId} done — ${result.blends.length} blends, briefing: "${result.briefing.slice(0, 80)}..."`);
}

// ── FULL CYCLE ────────────────────────────────────────────────────────────────
async function runCycle(): Promise<void> {
  // Sector A fires first, B after 5min phase, C after 10min phase (staggered)
  await runSector("A", SECTOR_A_SOURCES);
  await new Promise(r => setTimeout(r, PHASE_OFFSET_MS));
  await runSector("B", SECTOR_B_SOURCES);
  await new Promise(r => setTimeout(r, PHASE_OFFSET_MS));
  await runSector("C", SECTOR_C_SOURCES);
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export function getTicoSatireState(): HypervisorState {
  return state;
}

export async function getTicoSatireBriefing(): Promise<string | null> {
  // Return cached briefing if < 20 min old
  if (state.lastBriefing && Date.now() - state.lastBriefingTs < 20 * 60 * 1000) {
    return state.lastBriefing;
  }
  // Try vector search in memory cortex
  try {
    const mems = await searchMemory("tico satire CR news", { limit: 3, category: "tico_satire", threshold: 0.2 });
    if (mems.length > 0) {
      return mems.map(m => m.content).join("\n---\n");
    }
  } catch {}
  return state.lastBriefing;
}

export async function runTicoSatireNow(): Promise<{ triggered: boolean; message: string }> {
  try {
    runCycle().catch(e => console.error("[TICO-HYPER] Manual cycle error:", e.message));
    return { triggered: true, message: "Cycle triggered — all 3 sectors queued" };
  } catch (e: any) {
    return { triggered: false, message: e.message };
  }
}

let _timer: ReturnType<typeof setInterval> | null = null;
let _running = false;

export function startTicoSatireHypervisor() {
  if (_running) return;
  _running = true;
  console.log("[TICO-HYPER] Tico Satire Hypervisor started — 3 sectors at 0°/120°/240°, 15min cycle");

  // Initial run after 2 min startup delay
  setTimeout(() => {
    runCycle().catch(e => console.error("[TICO-HYPER] Initial cycle error:", e.message));
  }, 2 * 60 * 1000);

  _timer = setInterval(() => {
    runCycle().catch(e => console.error("[TICO-HYPER] Cycle error:", e.message));
  }, CYCLE_MS);
}

export function stopTicoSatireHypervisor() {
  if (_timer) { clearInterval(_timer); _timer = null; }
  _running = false;
}
