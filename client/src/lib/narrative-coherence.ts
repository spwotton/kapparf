/**
 * Ω-REEL Narrative Coherence Engine — Client-side mirror
 * Same math as server/lib/narrative-coherence.ts for instant UI feedback.
 */

export const ETA = 0.09;
export const BRIDGE_KAPPA_MAX = 65.18;
export const NEAR_DUP_KAPPA = 20;

export interface BridgeFault {
  i: number;
  j: number;
  kappa: number;
  similarity: number;
  type: "bridge" | "near_dup";
}

export interface CoherenceReport {
  kH: number;
  gramMatrix: number[][];
  bridgeFaults: BridgeFault[];
  eigenMin: number;
  eigenMax: number;
  isCoherent: boolean;
  beatCount: number;
}

function tokenize(text: string): Record<string, number> {
  const bag: Record<string, number> = {};
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  for (const tok of tokens) {
    bag[tok] = (bag[tok] ?? 0) + 1;
  }
  return bag;
}

function magnitude(v: Record<string, number>): number {
  return Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0));
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  let dot = 0;
  for (const k of Object.keys(a)) {
    if (b[k]) dot += a[k] * b[k];
  }
  return dot / (magA * magB);
}

function powerIterationMax(G: number[][], iterations = 80): number {
  const n = G.length;
  let v = Array.from({ length: n }, () => Math.random());
  let norm = Math.hypot(...v);
  v = v.map((x) => x / norm);
  let lambda = 0;
  for (let iter = 0; iter < iterations; iter++) {
    const w = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) w[i] += G[i][j] * v[j];
    }
    lambda = w.reduce((s, x, i) => s + x * v[i], 0);
    norm = Math.hypot(...w);
    v = w.map((x) => x / norm);
  }
  return lambda;
}

function powerIterationMin(G: number[][], iterations = 80): number {
  const n = G.length;
  const lambdaMax = powerIterationMax(G, 40);
  const shifted: number[][] = G.map((row, i) =>
    row.map((v, j) => (i === j ? lambdaMax - v : -v))
  );
  const largestOfShifted = powerIterationMax(shifted, iterations);
  return lambdaMax - largestOfShifted;
}

export function computeNarrativeCoherence(beats: string[]): CoherenceReport {
  const n = beats.length;
  if (n === 0) return { kH: 0, gramMatrix: [], bridgeFaults: [], eigenMin: 0, eigenMax: 0, isCoherent: true, beatCount: 0 };
  if (n === 1) return { kH: 1, gramMatrix: [[1 + ETA]], bridgeFaults: [], eigenMin: 1 + ETA, eigenMax: 1 + ETA, isCoherent: true, beatCount: 1 };

  const bags = beats.map(tokenize);
  const G: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => {
      const sim = cosine(bags[i], bags[j]);
      return i === j ? sim + ETA : sim;
    })
  );

  const eigenMax = powerIterationMax(G);
  const eigenMin = Math.max(powerIterationMin(G), 1e-9);
  const kH = eigenMax / eigenMin;

  const bridgeFaults: BridgeFault[] = [];
  for (let i = 0; i < n - 1; i++) {
    const sim = G[i][i + 1];
    if (sim < ETA * 0.5) bridgeFaults.push({ i, j: i + 1, kappa: kH, similarity: sim, type: "bridge" });
    if (sim > 1 - ETA && i !== i + 1) bridgeFaults.push({ i, j: i + 1, kappa: kH, similarity: sim, type: "near_dup" });
  }

  return {
    kH: Math.round(kH * 1000) / 1000,
    gramMatrix: G,
    bridgeFaults,
    eigenMin: Math.round(eigenMin * 10000) / 10000,
    eigenMax: Math.round(eigenMax * 10000) / 10000,
    isCoherent: kH < BRIDGE_KAPPA_MAX,
    beatCount: n,
  };
}
