/**
 * KAPPA — Morse Syllable Engine
 * Three-headed bar model: Marconi timing ratios applied to speech prosody.
 *
 * Marconi/Hertz principle: electromagnetic carriers encode information in
 * ON/OFF timing ratios. Applied here to SPEECH: syllable durations carry
 * the same dit/dah structure when an organization uses patterned speech
 * as a relay medium (cellular/lattice network — congregation → circuit → district).
 *
 * HEAD A — Duration classifier:  dit (short) | dah (long)
 * HEAD B — Gap classifier:       element-gap | char-gap | word-gap
 * HEAD C — Pattern detector:     lattice relay signatures (recurring sequences)
 *
 * Input: Whisper verbose_json word-level timestamps OR plain transcript
 * Output: Morse sequence → decoded text + confidence + lattice correlation
 */

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperVerbose {
  text: string;
  words?: WhisperWord[];
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    words?: WhisperWord[];
  }>;
}

export interface MorseUnit {
  type: "dit" | "dah" | "element-gap" | "char-gap" | "word-gap";
  duration: number;       // seconds
  ratio: number;          // relative to median unit T
  word?: string;
  start?: number;
  end?: number;
}

export interface MorseSequenceChar {
  morse: string;          // e.g. ".-"
  decoded: string;        // e.g. "A"
  confidence: number;     // 0-1
  words: string[];        // source words that contributed
}

export interface HeadResult {
  A_duration: { dits: number; dahs: number; ratio: number; unitT_ms: number };
  B_gap: { elementGaps: number; charGaps: number; wordGaps: number };
  C_pattern: { topPatterns: Array<{ pattern: string; count: number; decoded: string }> };
}

export interface MorseSyllableResult {
  file: string;
  transcript: string;
  wordCount: number;
  unitT_ms: number;           // Marconi T — median syllable duration
  morseSequence: string;      // full ".- -... .-." etc.
  decodedMessage: string;
  confidence: number;
  heads: HeadResult;
  units: MorseUnit[];
  latticeSignature: string;   // canonical form for cross-file correlation
  anomalies: string[];
  processedAt: string;
}

export interface LatticeCorrelation {
  files: string[];
  sharedPattern: string;
  decodedShared: string;
  occurrences: number;
  relayProbability: number;
}

// ── Morse decode table ────────────────────────────────────────────────────────
const MORSE_TABLE: Record<string, string> = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
  "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
  "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
  ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
  "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
  "--..": "Z", "-----": "0", ".----": "1", "..---": "2", "...--": "3",
  "....-": "4", ".....": "5", "-....": "6", "--...": "7", "---..": "8",
  "----.": "9", ".-.-.-": ".", "--..--": ",", "..--..": "?",
  ".----.": "'", "-.-.--": "!", "-..-.": "/", "-.--.": "(",
  "-.--.-": ")", ".-...": "&", "---...": ":", "-.-.-.": ";",
  "-...-": "=", ".-.-.": "+", "-....-": "-", "..--.-": "_",
  ".-..-.": "\"", "...-..-": "$", ".--.-.": "@", "...---...": "SOS",
};

// Reverse: char → morse
const CHAR_TO_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([k, v]) => [v, k])
);

function decodeMorse(seq: string): string {
  if (!seq.trim()) return "";
  return seq.split("   ").map(word =>
    word.split(" ").map(ch => MORSE_TABLE[ch] ?? `[${ch}]`).join("")
  ).join(" ");
}

// ── Syllable count estimator (for plain-text fallback) ──────────────────────
function estimateSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  const vowelGroups = word.match(/[aeiouy]+/g) || [];
  let count = vowelGroups.length;
  if (word.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}

// ── HEAD A: Duration classifier ──────────────────────────────────────────────
function classifyDuration(duration: number, medianT: number): "dit" | "dah" {
  // Marconi standard: dah = 3T, dit = T. Use 1.8T as threshold
  return duration >= medianT * 1.8 ? "dah" : "dit";
}

// ── HEAD B: Gap classifier ───────────────────────────────────────────────────
function classifyGap(gap: number, medianT: number): "element-gap" | "char-gap" | "word-gap" {
  if (gap <= medianT * 1.5) return "element-gap";
  if (gap <= medianT * 5)   return "char-gap";
  return "word-gap";
}

// ── Compute median ────────────────────────────────────────────────────────────
function median(arr: number[]): number {
  if (!arr.length) return 0.2;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── HEAD C: Pattern detector ──────────────────────────────────────────────────
function detectPatterns(morseSeq: string): Array<{ pattern: string; count: number; decoded: string }> {
  const chars = morseSeq.split(" ").filter(c => c && c !== "  ");
  const counts: Record<string, number> = {};

  // Look for 2-4 char subsequences
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= chars.length - len; i++) {
      const pat = chars.slice(i, i + len).join(" ");
      counts[pat] = (counts[pat] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([pattern, count]) => ({
      pattern,
      count,
      decoded: decodeMorse(pattern),
    }));
}

// ── Lattice signature ─────────────────────────────────────────────────────────
function computeLatticeSignature(units: MorseUnit[]): string {
  return units
    .filter(u => u.type === "dit" || u.type === "dah")
    .map(u => u.type === "dit" ? "." : "-")
    .join("")
    .replace(/(.{4,})\1+/g, "$1…")  // collapse long repeats
    .slice(0, 80);
}

// ── Anomaly detection ─────────────────────────────────────────────────────────
function detectAnomalies(units: MorseUnit[], medianT: number): string[] {
  const anomalies: string[] = [];
  const dahs = units.filter(u => u.type === "dah");
  const dits = units.filter(u => u.type === "dit");

  if (dahs.length === 0 && dits.length > 3) {
    anomalies.push("All-dit sequence — possible uniform pacing (concealment)");
  }

  const avgDahRatio = dahs.length
    ? dahs.reduce((s, u) => s + u.ratio, 0) / dahs.length
    : 0;
  if (avgDahRatio > 0 && Math.abs(avgDahRatio - 3.0) < 0.3) {
    anomalies.push(`Dah ratio ${avgDahRatio.toFixed(2)}T — near-perfect Marconi 3:1 ratio`);
  }

  const wordGaps = units.filter(u => u.type === "word-gap");
  if (wordGaps.length > 0) {
    const avgWG = wordGaps.reduce((s, u) => s + u.ratio, 0) / wordGaps.length;
    if (Math.abs(avgWG - 7.0) < 1.0) {
      anomalies.push(`Word-gap ratio ${avgWG.toFixed(2)}T — near Marconi 7:1 inter-word standard`);
    }
  }

  const ditRun = units.filter(u => u.type === "dit" || u.type === "dah")
    .map(u => u.type === "dit" ? "." : "-").join("");
  const sosMatch = ditRun.includes("...---...");
  if (sosMatch) anomalies.push("SOS pattern detected in prosodic sequence");

  // Look for rhythmic repetition
  const sig = ditRun.slice(0, 40);
  if (sig.length >= 8) {
    for (let len = 2; len <= 6; len++) {
      const fragment = sig.slice(0, len);
      const repetitions = (sig.match(new RegExp(fragment.replace(/\./g, "\\."), "g")) || []).length;
      if (repetitions >= 3) {
        anomalies.push(`Repeating pattern "${fragment}" × ${repetitions} — lattice relay signature`);
        break;
      }
    }
  }

  return anomalies;
}

// ── MAIN: Analyze from Whisper verbose_json ───────────────────────────────────
export function analyzeFromVerboseJson(
  file: string,
  verboseResult: WhisperVerbose
): MorseSyllableResult {
  const allWords: WhisperWord[] = [];

  if (verboseResult.words?.length) {
    allWords.push(...verboseResult.words);
  } else if (verboseResult.segments?.length) {
    for (const seg of verboseResult.segments) {
      if (seg.words?.length) allWords.push(...seg.words);
    }
  }

  if (allWords.length === 0) {
    return analyzeFromTranscript(file, verboseResult.text);
  }

  const durations = allWords.map(w => w.end - w.start);
  const medianT = median(durations);

  const units: MorseUnit[] = [];

  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    const dur = w.end - w.start;
    const type = classifyDuration(dur, medianT);
    units.push({
      type,
      duration: dur,
      ratio: dur / medianT,
      word: w.word.trim(),
      start: w.start,
      end: w.end,
    });

    if (i < allWords.length - 1) {
      const gap = allWords[i + 1].start - w.end;
      if (gap > 0.02) {
        units.push({
          type: classifyGap(gap, medianT),
          duration: gap,
          ratio: gap / medianT,
        });
      }
    }
  }

  return buildResult(file, verboseResult.text, units, medianT, allWords.length);
}

// ── FALLBACK: Analyze from plain transcript ───────────────────────────────────
export function analyzeFromTranscript(
  file: string,
  transcript: string
): MorseSyllableResult {
  const words = transcript.split(/\s+/).filter(Boolean);
  const syllableCounts = words.map(estimateSyllables);
  const medianSyl = median(syllableCounts) || 1;

  // Use syllable count as proxy for duration (1 syl ≈ 0.2s at normal speech rate)
  const syllableRate = 0.2; // seconds per syllable
  const units: MorseUnit[] = [];

  for (let i = 0; i < words.length; i++) {
    const dur = syllableCounts[i] * syllableRate;
    const type = classifyDuration(dur, medianSyl * syllableRate);
    units.push({
      type,
      duration: dur,
      ratio: syllableCounts[i] / medianSyl,
      word: words[i],
    });

    // Assume uniform 0.15s gap between words (normal speech)
    if (i < words.length - 1) {
      units.push({
        type: "element-gap",
        duration: 0.15,
        ratio: 0.15 / (medianSyl * syllableRate),
      });
    }
  }

  const medianT = medianSyl * syllableRate;
  return buildResult(file, transcript, units, medianT, words.length);
}

// ── Build result from units ───────────────────────────────────────────────────
function buildResult(
  file: string,
  transcript: string,
  units: MorseUnit[],
  medianT: number,
  wordCount: number
): MorseSyllableResult {
  // Build Morse string: dits/dahs separated by gaps
  const morseParts: string[] = [];
  let currentChar: string[] = [];

  for (const unit of units) {
    if (unit.type === "dit") {
      currentChar.push(".");
    } else if (unit.type === "dah") {
      currentChar.push("-");
    } else if (unit.type === "char-gap" || unit.type === "word-gap") {
      if (currentChar.length) {
        morseParts.push(currentChar.join(""));
        currentChar = [];
      }
      if (unit.type === "word-gap") morseParts.push("  ");
    }
    // element-gap: continue same character
  }
  if (currentChar.length) morseParts.push(currentChar.join(""));

  const morseSequence = morseParts.join(" ").replace(/\s{2,}/g, "   ").trim();
  const decodedMessage = decodeMorse(morseSequence);

  // HEAD A
  const wordUnits = units.filter(u => u.type === "dit" || u.type === "dah");
  const dits = wordUnits.filter(u => u.type === "dit");
  const dahs = wordUnits.filter(u => u.type === "dah");
  const ditDahRatio = dahs.length ? dits.length / dahs.length : dits.length;

  // HEAD B
  const gaps = units.filter(u => u.type.includes("gap"));
  const eGaps = gaps.filter(u => u.type === "element-gap");
  const cGaps = gaps.filter(u => u.type === "char-gap");
  const wGaps = gaps.filter(u => u.type === "word-gap");

  // HEAD C
  const topPatterns = detectPatterns(morseSequence);

  // Confidence: how close to Marconi ideal ratios
  const avgDahRatio = dahs.length
    ? dahs.reduce((s, u) => s + u.ratio, 0) / dahs.length
    : 0;
  const ratioDeviation = Math.abs(avgDahRatio - 3.0) / 3.0;
  const confidence = Math.max(0, Math.min(1, 1 - ratioDeviation));

  const latticeSignature = computeLatticeSignature(units);
  const anomalies = detectAnomalies(units, medianT);

  return {
    file,
    transcript: transcript.slice(0, 500),
    wordCount,
    unitT_ms: Math.round(medianT * 1000),
    morseSequence: morseSequence.slice(0, 500),
    decodedMessage: decodedMessage.slice(0, 200),
    confidence,
    heads: {
      A_duration: { dits: dits.length, dahs: dahs.length, ratio: ditDahRatio, unitT_ms: Math.round(medianT * 1000) },
      B_gap: { elementGaps: eGaps.length, charGaps: cGaps.length, wordGaps: wGaps.length },
      C_pattern: { topPatterns },
    },
    units: units.slice(0, 120),
    latticeSignature,
    anomalies,
    processedAt: new Date().toISOString(),
  };
}

// ── Cross-file lattice correlation ────────────────────────────────────────────
export function correlateLattice(results: MorseSyllableResult[]): LatticeCorrelation[] {
  const correlations: LatticeCorrelation[] = [];
  const patternMap = new Map<string, string[]>();

  for (const r of results) {
    for (const p of r.heads.C_pattern.topPatterns) {
      if (!patternMap.has(p.pattern)) patternMap.set(p.pattern, []);
      patternMap.get(p.pattern)!.push(r.file);
    }
  }

  for (const [pattern, files] of patternMap.entries()) {
    const uniqueFiles = [...new Set(files)];
    if (uniqueFiles.length >= 2) {
      const relayProbability = Math.min(1, (uniqueFiles.length / results.length) * 2);
      correlations.push({
        files: uniqueFiles,
        sharedPattern: pattern,
        decodedShared: decodeMorse(pattern),
        occurrences: files.length,
        relayProbability,
      });
    }
  }

  return correlations.sort((a, b) => b.relayProbability - a.relayProbability).slice(0, 10);
}

// ── Batch results cache ───────────────────────────────────────────────────────
const _batchCache: Map<string, MorseSyllableResult> = new Map();

export function setCachedResult(file: string, result: MorseSyllableResult) {
  _batchCache.set(file, result);
}

export function getCachedResult(file: string): MorseSyllableResult | undefined {
  return _batchCache.get(file);
}

export function getAllCachedResults(): MorseSyllableResult[] {
  return [..._batchCache.values()];
}

export function clearCache() {
  _batchCache.clear();
}
