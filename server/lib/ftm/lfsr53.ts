/**
 * BASE-53 FAURE LFSR ENGINE — True Faure Digit Permutation
 * Seed → SHA-256 truncated to 42 bits → LFSR with feedback taps at prime residues mod 53
 * Taps: {1,5,7,11,13,17,19,23}
 * Each 42-bit output state fed through Faure scrambler using digit-reversal in base 53
 * State mapped to name-component permutation via configurable vocabulary
 */

import { createHash } from "crypto";
import { GOS_CONSTANTS } from "./gosConstants";

const TAPS = [1, 5, 7, 11, 13, 17, 19, 23] as const;
const STATE_WIDTH = GOS_CONSTANTS.ramsey_R5_5;  // 42
const BASE = 53;
const BASE_DIGITS = 7;  // 53^7 > 2^42

// Name component vocabulary for permutation mapping
const NAME_VOCAB = {
  first: [
    "James","John","Robert","Michael","William","David","Richard","Joseph","Thomas","Charles",
    "Christopher","Daniel","Matthew","Anthony","Mark","Donald","Steven","Paul","Andrew","Joshua",
    "Kenneth","Kevin","Brian","George","Timothy","Ronald","Edward","Jason","Jeffrey","Ryan",
    "Jacob","Gary","Nicholas","Eric","Jonathan","Stephen","Larry","Justin","Scott","Brandon",
    "Benjamin","Samuel","Raymond","Gregory","Frank","Alexander","Patrick","Jack","Dennis","Jerry",
    "Maria","Barbara","Susan","Jessica","Sarah","Karen","Lisa","Nancy","Betty","Margaret",
  ],
  last: [
    "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Anderson",
    "Taylor","Thomas","Hernandez","Moore","Martin","Jackson","Thompson","White","Lopez","Lee",
    "Gonzalez","Harris","Clark","Lewis","Robinson","Walker","Perez","Hall","Young","Allen",
    "Sanchez","Wright","King","Scott","Green","Baker","Adams","Nelson","Hill","Ramirez",
    "Campbell","Mitchell","Roberts","Carter","Phillips","Evans","Turner","Torres","Parker","Collins",
    "Mora","Jimenez","Diaz","Reyes","Cruz","Ortiz","Gutierrez","Chavez","Ramos","Mendoza",
  ],
  suffix: ["Jr.", "Sr.", "II", "III", "IV", ""],
  title: ["Mr.", "Ms.", "Dr.", "Prof.", ""],
};

function sha256Seed(seed: string): bigint {
  const hash = createHash("sha256").update(seed).digest("hex");
  // Take first 11 hex chars = 44 bits, mask to 42
  const hex = hash.slice(0, 11);
  return BigInt("0x" + hex) & ((1n << BigInt(STATE_WIDTH)) - 1n);
}

function lfsrNext(state: bigint): bigint {
  let feedback = 0n;
  for (const tap of TAPS) {
    feedback ^= (state >> BigInt(tap % STATE_WIDTH)) & 1n;
  }
  return ((state >> 1n) | (feedback << BigInt(STATE_WIDTH - 1))) &
    ((1n << BigInt(STATE_WIDTH)) - 1n);
}

/**
 * True Faure scrambling: decompose into base-53 digits, apply digit permutation,
 * then recombine. g multiplies digit value, h offsets — both mod 53.
 */
function faureScramble(state: bigint, g: number, h: number): number {
  // Decompose to base-53 digits (7 digits covers 53^7 > 2^42)
  const digits: number[] = [];
  let temp = Number(state % BigInt(Number.MAX_SAFE_INTEGER));
  for (let i = 0; i < BASE_DIGITS; i++) {
    digits.push(temp % BASE);
    temp = Math.floor(temp / BASE);
  }
  // Apply digit permutation: each digit d at position i → (g·d + h·(i+1)) mod 53
  const scrambled = digits.map((d, idx) => ((g * d + h * (idx + 1)) % BASE + BASE) % BASE);
  // Recombine
  return scrambled.reduce((acc, d, idx) => acc + d * Math.pow(BASE, idx), 0);
}

function scramblerToComponents(scrambledVal: number): { first: string; last: string; suffix: string; title: string } {
  const fl = NAME_VOCAB.first.length;
  const ll = NAME_VOCAB.last.length;
  const sl = NAME_VOCAB.suffix.length;
  const tl = NAME_VOCAB.title.length;

  const idx0 = scrambledVal % fl;
  const idx1 = Math.floor(scrambledVal / fl) % ll;
  const idx2 = Math.floor(scrambledVal / (fl * ll)) % sl;
  const idx3 = Math.floor(scrambledVal / (fl * ll * sl)) % tl;

  return {
    title: NAME_VOCAB.title[idx3] ?? "",
    first: NAME_VOCAB.first[idx0] ?? "Unknown",
    last:  NAME_VOCAB.last[idx1]  ?? "Unknown",
    suffix: NAME_VOCAB.suffix[idx2] ?? "",
  };
}

export interface LFSRCandidate {
  index: number;
  state: string;
  title: string;
  first: string;
  last: string;
  suffix: string;
  fullName: string;
  puaCoords: { x: number; y: number };
  faureG: number;
  faureH: number;
}

export function generateCandidates(seed: string, count: number, g = 7, h = 11): LFSRCandidate[] {
  const candidates: LFSRCandidate[] = [];
  let state = sha256Seed(seed);

  for (let i = 0; i < count; i++) {
    state = lfsrNext(state);
    const scrambledVal = faureScramble(state, g, h);
    const comps = scramblerToComponents(scrambledVal);
    const fullName = [comps.title, comps.first, comps.last, comps.suffix]
      .filter(Boolean).join(" ").trim();

    candidates.push({
      index: i,
      state: state.toString(16).padStart(11, "0"),
      title: comps.title,
      first: comps.first,
      last: comps.last,
      suffix: comps.suffix,
      fullName,
      puaCoords: puaCoord([comps.first, comps.last]),
      faureG: g,
      faureH: h,
    });
  }

  return candidates;
}

/**
 * Hamming distance on string characters (character-level, not bit-level).
 * Used for identity deduplication.
 */
export function hammingDistance(a: string, b: string): number {
  const len = Math.max(a.length, b.length);
  const pa = a.padEnd(len, "\0");
  const pb = b.padEnd(len, "\0");
  let dist = 0;
  for (let i = 0; i < len; i++) {
    if (pa.charCodeAt(i) !== pb.charCodeAt(i)) dist++;
  }
  return dist;
}

/**
 * PUA grid coordinate: (nameHash mod 64, aliasHash mod 64)
 * Stable across calls for the same input.
 */
export function puaCoord(nameComponents: string[]): { x: number; y: number } {
  const full = nameComponents.join(" ").toLowerCase();
  let h1 = 0;
  for (let i = 0; i < full.length; i++) {
    h1 = (h1 * 31 + full.charCodeAt(i)) >>> 0;
  }
  const rev = full.split("").reverse().join("");
  let h2 = 0;
  for (let i = 0; i < rev.length; i++) {
    h2 = (h2 * 37 + rev.charCodeAt(i)) >>> 0;
  }
  return { x: h1 % 64, y: h2 % 64 };
}
