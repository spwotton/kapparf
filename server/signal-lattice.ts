/**
 * SIGNAL LATTICE HYPERVISOR — κ-Constrained Pattern Engine
 *
 * "Pegs in a hole" — every scan fragment is a peg. Every lattice slot is a hole.
 * The engine continuously tries arrangements until the right pieces fit.
 *
 * A correct fit reveals itself through κ-resonance: the ratio of coherent
 * signal elements approaches 4/π ≈ 1.2732 in true pattern clusters.
 * φ-density (filled_cells / total) gravitates toward 1/φ ≈ 0.618 in real signals.
 *
 * Architecture:
 *   Fragment   — discrete signal observation from KiwiSDR scan/vision/Morse engine
 *   Peg        — normalized fragment ready for lattice placement
 *   Lattice    — 2D grid [freq_bin × time_bin], 64 freq bins × 144 time slots
 *   Hole       — lattice cell that accepts a peg when properties match
 *   Cluster    — group of mutually-fitting pegs in adjacent cells
 *   Arrangement — scored snapshot of a cluster with κ/φ metrics
 *   Finding    — LLM synthesis of a high-scoring arrangement
 *
 * Sources:
 *   KiwiSDR Scanner  → ScanResult[] (snr, deltaSlip, envelopeEnergy, morseDetections)
 *   Morse Syllable   → MorseSyllableResult[] (latticeSignature, decodedMessage)
 *   KiwiSDR Vision   → spectrogram analysis text (injected via ingestVisionFragment)
 */

import OpenAI from "openai";
import { Pool } from "@neondatabase/serverless";
import { storeMemory, searchMemory } from "./memory-cortex";
import { atlantisHub } from "./atlantis-hub";
import { getScannerStatus } from "./kiwisdr-scanner";
import { getAllCachedResults, correlateLattice } from "./morse-syllable-engine";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://kappa-sigint.replit.app",
    "X-Title": "Signal Lattice Hypervisor",
  },
});

// ── Constants ─────────────────────────────────────────────────────────────────
const KAPPA = 4 / Math.PI;           // 1.27324 — coherence threshold
const PHI   = (1 + Math.sqrt(5)) / 2; // 1.61803 — optimal density target
const DELTA = 0.02;                   // Goose Gap — irreducible residual
const KAPPA_FIT_THRESHOLD = 0.55;     // κ-score above which we call it a pattern
const PHI_DENSITY_TARGET  = 1 / PHI; // ≈ 0.618 — ideal lattice fill
const FREQ_BINS   = 64;              // frequency axis resolution
const TIME_BINS   = 144;             // 10-min slots across 24h
const CYCLE_MS    = 5 * 60 * 1000;  // 5-minute lattice cycle
const MAX_FRAGS   = 2000;           // rolling corpus window

// Frequency range covered: 1 kHz → 30 MHz (log2 space)
const FREQ_MIN_HZ = 1_000;
const FREQ_MAX_HZ = 30_000_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SignalFragment {
  id: string;           // UUID
  nodeId: string;
  freqHz: number;
  freqBin: number;      // quantized [0..FREQ_BINS-1]
  timeBin: number;      // quantized [0..TIME_BINS-1]
  snrDb: number;
  detected: boolean;
  patternType: "CW" | "morse" | "syllable" | "tone" | "noise" | "vision";
  morseSeq?: string;    // e.g. ".- -... .-."
  decodedText?: string; // decoded Morse/syllable text
  latticeSignature?: string; // canonical form from morse-syllable-engine
  simhash: string;      // 64-bit FNV-1a simhash of timing signature
  envelopeEnergy?: number;
  deltaSlip?: number;
  harmonicDepth: number;
  source: "kiwi-scan" | "kiwi-vision" | "morse-engine";
  createdAt: number;    // unix ms
}

export interface LatticeArrangement {
  id: string;
  fragmentIds: string[];
  kappaScore: number;   // κ-fit: coherent elements / total × κ constant
  phiDensity: number;   // filled bins / total bins (target: 1/φ)
  sharedPatterns: string[];
  clusterType: "morse" | "cw" | "harmonic" | "tdoa" | "syllable";
  arrangementHash: string;
  hypothesis: string;   // brief description of what the arrangement suggests
  sentToLlm: boolean;
  createdAt: number;
}

export interface LatticeFinding {
  id: string;
  arrangementId: string;
  model: string;
  decodedMessage?: string;
  patternType?: string;
  confidence: number;
  hypothesis: string;
  connections: string[];
  morseFragments: string[];
  syllableFragments: string[];
  published: boolean;
  createdAt: number;
}

// ── In-memory state ──────────────────────────────────────────────────────────

const corpus: Map<string, SignalFragment> = new Map();
const arrangements: LatticeArrangement[] = [];
const findings: LatticeFinding[] = [];
let cycleCount = 0;
let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

// ── FNV-1a 64-bit (split into two 32-bit halves) ─────────────────────────────

function fnv64(s: string): string {
  let lo = 0x811c9dc5, hi = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    lo ^= c;
    const loNew = Math.imul(lo, 0x01000193) >>> 0;
    hi ^= (c >>> 8);
    const hiNew = Math.imul(hi, 0x01000193) >>> 0;
    lo = loNew;
    hi = hiNew;
  }
  return `${hi.toString(16).padStart(8,"0")}${lo.toString(16).padStart(8,"0")}`;
}

// Simhash of a timing token sequence (dit/dah/gap)
function simhashTimingSeq(tokens: string[]): string {
  const bits = new Int32Array(64);
  for (const tok of tokens) {
    const h = BigInt("0x" + fnv64(tok));
    for (let i = 0; i < 64; i++) {
      bits[i] += (h >> BigInt(i)) & 1n ? 1 : -1;
    }
  }
  let hi = 0n, lo = 0n;
  for (let i = 0; i < 32; i++) if (bits[i] > 0) lo |= (1n << BigInt(i));
  for (let i = 32; i < 64; i++) if (bits[i] > 0) hi |= (1n << BigInt(i - 32));
  return `${hi.toString(16).padStart(8,"0")}${lo.toString(16).padStart(8,"0")}`;
}

function simhashSimilarity(a: string, b: string): number {
  // Hamming distance on 64-bit hex strings → similarity
  let diff = 0;
  for (let i = 0; i < 16; i++) {
    const ab = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    diff += ab.toString(2).split("1").length - 1;
  }
  return 1 - diff / 64;
}

// ── Frequency → bin mapping (log2) ────────────────────────────────────────────

function freqToBin(freqHz: number): number {
  const logMin = Math.log2(FREQ_MIN_HZ);
  const logMax = Math.log2(FREQ_MAX_HZ);
  const clamped = Math.max(FREQ_MIN_HZ, Math.min(FREQ_MAX_HZ, freqHz));
  return Math.floor(((Math.log2(clamped) - logMin) / (logMax - logMin)) * (FREQ_BINS - 1));
}

function timeBinFromMs(tsMs: number): number {
  const slotMs = 10 * 60 * 1000; // 10 minutes per slot
  const dayStart = Math.floor(tsMs / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000;
  return Math.floor((tsMs - dayStart) / slotMs) % TIME_BINS;
}

// ── DB init ───────────────────────────────────────────────────────────────────

export async function initSignalLattice(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signal_lattice_fragments (
      id          TEXT PRIMARY KEY,
      node_id     TEXT NOT NULL,
      freq_hz     BIGINT NOT NULL,
      freq_bin    INTEGER NOT NULL,
      time_bin    INTEGER NOT NULL,
      snr_db      REAL,
      detected    BOOLEAN NOT NULL DEFAULT false,
      pattern_type TEXT,
      morse_seq   TEXT,
      decoded_text TEXT,
      lattice_sig TEXT,
      simhash     TEXT,
      envelope_energy REAL,
      delta_slip  REAL,
      harmonic_depth INTEGER DEFAULT 0,
      source      TEXT,
      created_at  BIGINT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lattice_arrangements (
      id                TEXT PRIMARY KEY,
      fragment_ids      TEXT[],
      kappa_score       REAL NOT NULL,
      phi_density       REAL NOT NULL,
      shared_patterns   TEXT[],
      cluster_type      TEXT,
      arrangement_hash  TEXT UNIQUE,
      hypothesis        TEXT,
      sent_to_llm       BOOLEAN DEFAULT false,
      created_at        BIGINT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lattice_findings (
      id               TEXT PRIMARY KEY,
      arrangement_id   TEXT,
      model            TEXT NOT NULL,
      decoded_message  TEXT,
      pattern_type     TEXT,
      confidence       REAL,
      hypothesis       TEXT NOT NULL,
      connections      TEXT[],
      morse_fragments  TEXT[],
      syllable_fragments TEXT[],
      published        BOOLEAN DEFAULT false,
      created_at       BIGINT NOT NULL
    )
  `);

  // Load existing fragments into memory corpus
  const rows = await pool.query<{ id: string; node_id: string; freq_hz: string; freq_bin: number; time_bin: number; snr_db: number; detected: boolean; pattern_type: string; morse_seq: string; decoded_text: string; lattice_sig: string; simhash: string; envelope_energy: number; delta_slip: number; harmonic_depth: number; source: string; created_at: string }>(
    `SELECT * FROM signal_lattice_fragments ORDER BY created_at DESC LIMIT $1`, [MAX_FRAGS]
  );
  for (const r of rows.rows) {
    corpus.set(r.id, {
      id: r.id, nodeId: r.node_id, freqHz: Number(r.freq_hz),
      freqBin: r.freq_bin, timeBin: r.time_bin, snrDb: r.snr_db,
      detected: r.detected, patternType: r.pattern_type as SignalFragment["patternType"],
      morseSeq: r.morse_seq ?? undefined, decodedText: r.decoded_text ?? undefined,
      latticeSignature: r.lattice_sig ?? undefined, simhash: r.simhash,
      envelopeEnergy: r.envelope_energy ?? undefined, deltaSlip: r.delta_slip ?? undefined,
      harmonicDepth: r.harmonic_depth, source: r.source as SignalFragment["source"],
      createdAt: Number(r.created_at),
    });
  }

  console.log(`[Lattice] Initialized — ${corpus.size} fragments loaded from DB`);
}

// ── Fragment ingestion ────────────────────────────────────────────────────────

function uuidLite(): string {
  return fnv64(Math.random().toString(36) + Date.now().toString(36));
}

async function storeFragment(frag: SignalFragment): Promise<void> {
  corpus.set(frag.id, frag);
  // Trim corpus to MAX_FRAGS (evict oldest)
  if (corpus.size > MAX_FRAGS) {
    const oldest = [...corpus.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    corpus.delete(oldest.id);
  }

  await pool.query(
    `INSERT INTO signal_lattice_fragments
      (id, node_id, freq_hz, freq_bin, time_bin, snr_db, detected, pattern_type,
       morse_seq, decoded_text, lattice_sig, simhash, envelope_energy, delta_slip,
       harmonic_depth, source, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (id) DO NOTHING`,
    [frag.id, frag.nodeId, frag.freqHz, frag.freqBin, frag.timeBin, frag.snrDb,
     frag.detected, frag.patternType, frag.morseSeq ?? null, frag.decodedText ?? null,
     frag.latticeSignature ?? null, frag.simhash, frag.envelopeEnergy ?? null,
     frag.deltaSlip ?? null, frag.harmonicDepth, frag.source, frag.createdAt]
  );
}

// Harvest fragments from KiwiSDR scanner's lastResults
async function harvestScannerFragments(): Promise<number> {
  const status = getScannerStatus();
  const results = status.lastResults ?? [];
  let newCount = 0;
  const existingSimhashes = new Set([...corpus.values()].map(f => f.simhash));

  for (const r of results) {
    // Build timing token sequence from scan result properties
    const tokens: string[] = [
      r.sdrNode,
      `f${Math.round(r.frequencyHz / 1000)}k`,
      r.detected ? "HIT" : "MISS",
      r.snrDb > 0 ? (r.snrDb > 10 ? "DAH" : "DIT") : "GAP",
      r.deltaSlipStrength ? `DS${Math.round(r.deltaSlipStrength * 100)}` : "DS0",
      r.harmonicChainDepth > 0 ? `HC${r.harmonicChainDepth}` : "HC0",
    ];
    const sh = simhashTimingSeq(tokens);
    if (existingSimhashes.has(sh)) continue; // dedup

    const now = r.timestamp ?? Date.now();
    const frag: SignalFragment = {
      id: uuidLite() + cycleCount,
      nodeId: r.sdrNode,
      freqHz: r.frequencyHz,
      freqBin: freqToBin(r.frequencyHz),
      timeBin: timeBinFromMs(now),
      snrDb: r.snrDb ?? 0,
      detected: r.detected,
      patternType: r.snrDb > 5 && r.detected ? "CW" : "noise",
      simhash: sh,
      envelopeEnergy: r.envelopeEnergy ?? undefined,
      deltaSlip: r.deltaSlipStrength ?? undefined,
      harmonicDepth: r.harmonicChainDepth ?? 0,
      source: "kiwi-scan",
      createdAt: now,
    };
    await storeFragment(frag);
    existingSimhashes.add(sh);
    newCount++;
  }

  return newCount;
}

// Harvest from Morse Syllable engine's cached results
async function harvestMorseFragments(): Promise<number> {
  const results = getAllCachedResults();
  let newCount = 0;
  const existingSimhashes = new Set([...corpus.values()].map(f => f.simhash));

  for (const r of results) {
    const tokens = [r.latticeSignature ?? "", r.morseSequence.slice(0, 40), r.file];
    const sh = simhashTimingSeq(tokens);
    if (existingSimhashes.has(sh)) continue;

    const frag: SignalFragment = {
      id: uuidLite() + "m",
      nodeId: "morse-engine",
      freqHz: 0, // speech/prosody, not RF
      freqBin: 0,
      timeBin: timeBinFromMs(Date.now()),
      snrDb: r.confidence * 20, // confidence → pseudo-SNR
      detected: r.confidence > 0.3,
      patternType: "morse",
      morseSeq: r.morseSequence.slice(0, 200),
      decodedText: r.decodedMessage.slice(0, 100),
      latticeSignature: r.latticeSignature,
      simhash: sh,
      harmonicDepth: r.heads.C_pattern.topPatterns.length,
      source: "morse-engine",
      createdAt: Date.now(),
    };
    await storeFragment(frag);
    existingSimhashes.add(sh);
    newCount++;
  }

  return newCount;
}

// Allow KiwiSDR vision to inject a fragment
export async function ingestVisionFragment(
  nodeId: string, freqHz: number, analysisText: string
): Promise<void> {
  const tokens = analysisText.split(/\s+/).slice(0, 20);
  const sh = simhashTimingSeq([nodeId, `f${freqHz}`, ...tokens]);
  const existing = [...corpus.values()].find(f => f.simhash === sh);
  if (existing) return;

  const hasMorse = /morse|cw|dit|dah|[\.\-]{3,}/i.test(analysisText);
  const frag: SignalFragment = {
    id: uuidLite() + "v",
    nodeId,
    freqHz,
    freqBin: freqToBin(freqHz),
    timeBin: timeBinFromMs(Date.now()),
    snrDb: hasMorse ? 12 : 3,
    detected: hasMorse,
    patternType: hasMorse ? "morse" : "vision",
    decodedText: analysisText.slice(0, 200),
    simhash: sh,
    harmonicDepth: 0,
    source: "kiwi-vision",
    createdAt: Date.now(),
  };
  await storeFragment(frag);
}

// ── Lattice builder ───────────────────────────────────────────────────────────

interface LatticeCell {
  freqBin: number;
  timeBin: number;
  fragments: SignalFragment[];
}

function buildLattice(): LatticeCell[][] {
  const grid: LatticeCell[][] = Array.from({ length: FREQ_BINS }, (_, fb) =>
    Array.from({ length: TIME_BINS }, (_, tb) => ({ freqBin: fb, timeBin: tb, fragments: [] }))
  );

  for (const frag of corpus.values()) {
    if (frag.freqBin >= 0 && frag.freqBin < FREQ_BINS &&
        frag.timeBin >= 0 && frag.timeBin < TIME_BINS) {
      grid[frag.freqBin][frag.timeBin].fragments.push(frag);
    }
  }

  return grid;
}

// Find dense clusters — cells with ≥2 fragments, merge adjacent
function findClusters(grid: LatticeCell[][]): SignalFragment[][] {
  const visited = new Set<string>();
  const clusters: SignalFragment[][] = [];

  for (let fb = 0; fb < FREQ_BINS; fb++) {
    for (let tb = 0; tb < TIME_BINS; tb++) {
      const cell = grid[fb][tb];
      if (cell.fragments.length < 2) continue;
      const key = `${fb}:${tb}`;
      if (visited.has(key)) continue;

      // BFS to collect adjacent dense cells
      const cluster: SignalFragment[] = [];
      const queue: [number, number][] = [[fb, tb]];
      while (queue.length) {
        const [f, t] = queue.shift()!;
        const k = `${f}:${t}`;
        if (visited.has(k)) continue;
        visited.add(k);
        const c = grid[f]?.[t];
        if (!c || c.fragments.length === 0) continue;
        cluster.push(...c.fragments);

        // Adjacent: ±1 freq bin, ±1 time bin (8-connectivity)
        for (const [df, dt] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
          const nf = f + df, nt = t + dt;
          if (nf >= 0 && nf < FREQ_BINS && nt >= 0 && nt < TIME_BINS) {
            const nk = `${nf}:${nt}`;
            if (!visited.has(nk) && grid[nf][nt].fragments.length >= 1) {
              queue.push([nf, nt]);
            }
          }
        }
      }

      if (cluster.length >= 3) clusters.push(cluster);
    }
  }

  return clusters.sort((a, b) => b.length - a.length).slice(0, 12);
}

// ── κ-fit scorer ──────────────────────────────────────────────────────────────

function scoreCluster(frags: SignalFragment[]): {
  kappaScore: number;
  phiDensity: number;
  sharedPatterns: string[];
  clusterType: LatticeArrangement["clusterType"];
} {
  // Pattern coherence: how many fragments share a simhash neighborhood
  let coherentPairs = 0;
  let totalPairs = 0;
  const patternCounts = new Map<string, number>();

  for (let i = 0; i < frags.length; i++) {
    for (let j = i + 1; j < frags.length; j++) {
      totalPairs++;
      const sim = simhashSimilarity(frags[i].simhash, frags[j].simhash);
      if (sim >= 0.6) coherentPairs++;
    }
    // Count patterns
    if (frags[i].latticeSignature) {
      const sig = frags[i].latticeSignature!.slice(0, 8);
      patternCounts.set(sig, (patternCounts.get(sig) ?? 0) + 1);
    }
    if (frags[i].morseSeq) {
      const seq = frags[i].morseSeq!.split(" ").slice(0, 4).join(" ");
      patternCounts.set(seq, (patternCounts.get(seq) ?? 0) + 1);
    }
  }

  const coherenceRatio = totalPairs > 0 ? coherentPairs / totalPairs : 0;
  // κ-score: coherence × κ, normalized to [0,1]
  const kappaScore = Math.min(1, coherenceRatio * KAPPA);

  // φ-density: unique bins occupied / expected bins at φ-optimal fill
  const uniqueBins = new Set(frags.map(f => `${f.freqBin}:${f.timeBin}`)).size;
  const expectedBins = frags.length / PHI_DENSITY_TARGET; // target: 1 frag per φ bins
  const phiDensity = Math.min(1, uniqueBins / Math.max(1, expectedBins));

  // Shared patterns (appear in ≥2 fragments)
  const sharedPatterns = [...patternCounts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p]) => p);

  // Cluster type
  const morseCount = frags.filter(f => f.patternType === "morse" || f.morseSeq).length;
  const cwCount = frags.filter(f => f.patternType === "CW").length;
  const visionCount = frags.filter(f => f.source === "kiwi-vision").length;
  const uniqueNodes = new Set(frags.map(f => f.nodeId)).size;

  let clusterType: LatticeArrangement["clusterType"] = "cw";
  if (morseCount >= 2) clusterType = "morse";
  else if (uniqueNodes >= 3) clusterType = "tdoa";
  else if (visionCount >= 2) clusterType = "syllable";
  else if (frags.some(f => f.harmonicDepth > 2)) clusterType = "harmonic";

  return { kappaScore, phiDensity, sharedPatterns, clusterType };
}

// ── Arrangement snapshot ──────────────────────────────────────────────────────

function buildArrangement(frags: SignalFragment[]): LatticeArrangement {
  const { kappaScore, phiDensity, sharedPatterns, clusterType } = scoreCluster(frags);

  // Arrangement hash: simhash of all fragment simhashes
  const sh = simhashTimingSeq(frags.map(f => f.simhash));

  const nodeList = [...new Set(frags.map(f => f.nodeId))].slice(0, 3).join("+");
  const freqRange = frags.reduce((a, f) => {
    a.min = Math.min(a.min, f.freqHz); a.max = Math.max(a.max, f.freqHz); return a;
  }, { min: Infinity, max: 0 });
  const freqDesc = freqRange.max > 0
    ? `${(freqRange.min / 1000).toFixed(1)}–${(freqRange.max / 1000).toFixed(1)} kHz`
    : "speech-domain";

  const hypothesis = `${clusterType.toUpperCase()} cluster · ${frags.length} frags · `
    + `nodes: ${nodeList} · freq: ${freqDesc} · `
    + `κ=${kappaScore.toFixed(3)} φρ=${phiDensity.toFixed(3)}`
    + (sharedPatterns.length ? ` · patterns: ${sharedPatterns.slice(0,2).join("|")}` : "");

  return {
    id: uuidLite() + "a",
    fragmentIds: frags.map(f => f.id),
    kappaScore,
    phiDensity,
    sharedPatterns,
    clusterType,
    arrangementHash: sh,
    hypothesis,
    sentToLlm: false,
    createdAt: Date.now(),
  };
}

async function saveArrangement(arr: LatticeArrangement): Promise<void> {
  arrangements.unshift(arr);
  if (arrangements.length > 50) arrangements.length = 50;

  await pool.query(
    `INSERT INTO lattice_arrangements
      (id, fragment_ids, kappa_score, phi_density, shared_patterns, cluster_type,
       arrangement_hash, hypothesis, sent_to_llm, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (arrangement_hash) DO NOTHING`,
    [arr.id, arr.fragmentIds, arr.kappaScore, arr.phiDensity, arr.sharedPatterns,
     arr.clusterType, arr.arrangementHash, arr.hypothesis, arr.sentToLlm, arr.createdAt]
  );
}

// ── LLM synthesis ─────────────────────────────────────────────────────────────

async function synthesizeArrangement(arr: LatticeArrangement): Promise<LatticeFinding | null> {
  const frags = arr.fragmentIds
    .map(id => corpus.get(id))
    .filter((f): f is SignalFragment => !!f);

  if (frags.length === 0) return null;

  // Skeleton-compress the fragment corpus for the LLM
  const skeleton = frags.slice(0, 24).map(f => {
    const parts: string[] = [`[${f.source}:${f.nodeId}@${(f.freqHz/1000).toFixed(1)}kHz]`];
    if (f.detected) parts.push(`SNR=${f.snrDb.toFixed(1)}dB`);
    if (f.deltaSlip) parts.push(`δSlip=${f.deltaSlip.toFixed(3)}`);
    if (f.harmonicDepth > 0) parts.push(`HC${f.harmonicDepth}`);
    if (f.morseSeq) parts.push(`MORSE: ${f.morseSeq.slice(0, 60)}`);
    if (f.decodedText) parts.push(`TEXT: "${f.decodedText.slice(0, 60)}"`);
    if (f.latticeSignature) parts.push(`SIG: ${f.latticeSignature.slice(0, 20)}`);
    return parts.join(" ");
  }).join("\n");

  // Morse correlations from the engine
  const morseResults = getAllCachedResults();
  const correlations = correlateLattice(morseResults);
  const corrText = correlations.slice(0, 3).map(c =>
    `SHARED_PATTERN: ${c.sharedPattern} → "${c.decodedShared}" (${c.occurrences}× across ${c.files.length} files, relay_prob=${c.relayProbability.toFixed(2)})`
  ).join("\n");

  const prompt = `You are a SIGINT lattice analyst. Fragments from a signal intelligence lattice are arranged below.
κ-fit score: ${arr.kappaScore.toFixed(3)} (threshold: ${KAPPA_FIT_THRESHOLD})
φ-density: ${arr.phiDensity.toFixed(3)} (target: ${PHI_DENSITY_TARGET.toFixed(3)})
Cluster type: ${arr.clusterType}
Shared patterns: ${arr.sharedPatterns.join(" | ") || "none yet"}

SIGNAL FRAGMENTS (${frags.length} total, showing ${Math.min(24, frags.length)}):
${skeleton}

MORSE CROSS-CORRELATIONS FROM SYLLABLE ENGINE:
${corrText || "None yet — corpus still building"}

TASK: Analyze this lattice arrangement. What pattern emerges when these fragments are arranged together?
Look for: Morse code sequences, timing relay signatures, frequency coordination, TDOA signatures, repeated syllable patterns.
The κ-score measures coherence — above 0.55 suggests a real signal, not noise.

Return JSON only:
{
  "decoded_message": "any Morse/text decoded, or null",
  "pattern_type": "morse|cw|harmonic|tdoa|syllable|noise",
  "confidence": 0.0-1.0,
  "hypothesis": "1-2 sentence intelligence assessment",
  "connections": ["list", "of", "entity", "connections"],
  "morse_fragments": ["raw morse sequences found"],
  "syllable_fragments": ["syllable patterns found"]
}`;

  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1:free",
  ];

  for (const model of models) {
    try {
      const resp = await openrouter.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const raw = resp.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw);

      const finding: LatticeFinding = {
        id: uuidLite() + "f",
        arrangementId: arr.id,
        model,
        decodedMessage: parsed.decoded_message ?? undefined,
        patternType: parsed.pattern_type ?? "unknown",
        confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0)),
        hypothesis: String(parsed.hypothesis ?? "Pattern analysis in progress"),
        connections: Array.isArray(parsed.connections) ? parsed.connections.slice(0, 5) : [],
        morseFragments: Array.isArray(parsed.morse_fragments) ? parsed.morse_fragments.slice(0, 5) : [],
        syllableFragments: Array.isArray(parsed.syllable_fragments) ? parsed.syllable_fragments.slice(0, 5) : [],
        published: false,
        createdAt: Date.now(),
      };

      findings.unshift(finding);
      if (findings.length > 30) findings.length = 30;

      await pool.query(
        `INSERT INTO lattice_findings
          (id, arrangement_id, model, decoded_message, pattern_type, confidence,
           hypothesis, connections, morse_fragments, syllable_fragments, published, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [finding.id, finding.arrangementId, finding.model, finding.decodedMessage ?? null,
         finding.patternType, finding.confidence, finding.hypothesis, finding.connections,
         finding.morseFragments, finding.syllableFragments, finding.published, finding.createdAt]
      );

      // Store in Memory Cortex
      await storeMemory(
        "signal_intelligence",
        `Lattice Finding: ${finding.hypothesis.slice(0, 80)}`,
        `Pattern: ${finding.patternType} · Confidence: ${finding.confidence.toFixed(2)}\n` +
        `Hypothesis: ${finding.hypothesis}\n` +
        (finding.decodedMessage ? `Decoded: ${finding.decodedMessage}\n` : "") +
        `Morse: ${finding.morseFragments.join(" | ")}\n` +
        `Connections: ${finding.connections.join(", ")}`,
        { arrangementId: arr.id, kappaScore: arr.kappaScore, clusterType: arr.clusterType },
        "signal-lattice",
        finding.confidence
      );

      // Post dream to Atlantis Hub
      await atlantisHub.postDream(
        "signal-lattice",
        `Lattice ${arr.clusterType.toUpperCase()} pattern: ${finding.hypothesis}`,
        {
          kappaScore: arr.kappaScore, phiDensity: arr.phiDensity,
          fragmentCount: frags.length, decoded: finding.decodedMessage,
          confidence: finding.confidence,
        },
        ["lattice", arr.clusterType, "signal-intelligence"]
      );

      console.log(`[Lattice] Finding: ${finding.patternType} conf=${finding.confidence.toFixed(2)} | ${finding.hypothesis.slice(0, 80)}`);
      return finding;

    } catch (err) {
      console.warn(`[Lattice] LLM ${model} error:`, err instanceof Error ? err.message : String(err));
    }
  }

  return null;
}

// ── Main cycle ────────────────────────────────────────────────────────────────

async function runLatticeCycle(): Promise<void> {
  cycleCount++;
  const t0 = Date.now();

  // 1. Harvest new fragments
  const scanNew = await harvestScannerFragments().catch(() => 0);
  const morseNew = await harvestMorseFragments().catch(() => 0);

  // 2. Build lattice
  const grid = buildLattice();
  const clusters = findClusters(grid);

  // 3. Score and arrange
  const newArrangements: LatticeArrangement[] = [];
  for (const cluster of clusters) {
    const arr = buildArrangement(cluster);
    // Dedup by arrangement hash
    const exists = arrangements.find(a => a.arrangementHash === arr.arrangementHash);
    if (!exists) {
      await saveArrangement(arr);
      newArrangements.push(arr);
    }
  }

  // 4. Synthesize top-scoring arrangements that haven't been sent to LLM
  const toSynth = newArrangements
    .filter(a => a.kappaScore >= KAPPA_FIT_THRESHOLD && !a.sentToLlm)
    .sort((a, b) => b.kappaScore - a.kappaScore)
    .slice(0, 2); // max 2 LLM calls per cycle

  for (const arr of toSynth) {
    await synthesizeArrangement(arr);
    arr.sentToLlm = true;
    await pool.query(
      `UPDATE lattice_arrangements SET sent_to_llm = true WHERE id = $1`, [arr.id]
    );
  }

  const elapsed = Date.now() - t0;
  console.log(
    `[Lattice] Cycle #${cycleCount}: +${scanNew} scan +${morseNew} morse frags · ` +
    `${corpus.size} total · ${clusters.length} clusters · ` +
    `${newArrangements.length} arrangements · ${toSynth.length} synthesized · ${elapsed}ms`
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startLatticeHypervisor(): void {
  if (running) return;
  running = true;

  // First cycle after 90s (let scanner collect some data first)
  setTimeout(() => {
    runLatticeCycle().catch(err =>
      console.error("[Lattice] Cycle error:", err instanceof Error ? err.message : String(err))
    );
  }, 90_000);

  timer = setInterval(() => {
    runLatticeCycle().catch(err =>
      console.error("[Lattice] Cycle error:", err instanceof Error ? err.message : String(err))
    );
  }, CYCLE_MS);

  console.log(`[Lattice] Hypervisor online — κ=${KAPPA.toFixed(4)} φ=${PHI.toFixed(4)} Δ=${DELTA} · 5-min cycles`);
}

export function getLatticeStatus() {
  const frags = [...corpus.values()];
  const detected = frags.filter(f => f.detected).length;
  const morseFrags = frags.filter(f => f.patternType === "morse").length;
  const cwFrags = frags.filter(f => f.patternType === "CW").length;
  const nodeSet = new Set(frags.map(f => f.nodeId));

  return {
    running,
    cycleCount,
    corpusSize: corpus.size,
    detectedFragments: detected,
    morseFragments: morseFrags,
    cwFragments: cwFrags,
    activeNodes: nodeSet.size,
    arrangementCount: arrangements.length,
    findingCount: findings.length,
    constants: { kappa: KAPPA, phi: PHI, delta: DELTA, kappaThr: KAPPA_FIT_THRESHOLD },
    recentArrangements: arrangements.slice(0, 8).map(a => ({
      id: a.id, kappaScore: a.kappaScore, phiDensity: a.phiDensity,
      clusterType: a.clusterType, fragmentCount: a.fragmentIds.length,
      hypothesis: a.hypothesis.slice(0, 100), sentToLlm: a.sentToLlm,
      createdAt: a.createdAt,
    })),
    recentFindings: findings.slice(0, 6).map(f => ({
      id: f.id, patternType: f.patternType, confidence: f.confidence,
      hypothesis: f.hypothesis, decodedMessage: f.decodedMessage,
      morseFragments: f.morseFragments, createdAt: f.createdAt,
    })),
  };
}

export function getLatticeFragments() {
  return [...corpus.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 200)
    .map(f => ({
      id: f.id, nodeId: f.nodeId, freqHz: f.freqHz, freqBin: f.freqBin, timeBin: f.timeBin,
      snrDb: f.snrDb, detected: f.detected, patternType: f.patternType,
      morseSeq: f.morseSeq, decodedText: f.decodedText, latticeSignature: f.latticeSignature,
      simhash: f.simhash.slice(0, 8), harmonicDepth: f.harmonicDepth,
      source: f.source, createdAt: f.createdAt,
    }));
}

export function getLatticeFindings() {
  return findings.slice(0, 20);
}
