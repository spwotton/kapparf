/**
 * LIQUID CORTEX — Liquid Time-Constant (LTC) Neural Network
 *
 * Online learning — zero pre-training data required.
 * Adapts exclusively from the live KAPPA signal event stream.
 *
 * Math: Hasani et al. 2020 "Liquid Time-constant Networks"
 *   τ(x,h) = τ_min + σ(Wτ·h + Uτ·x + bτ) · (τ_max − τ_min)
 *   dh/dt  = (−h + σ(W·h + U·x + b)) / τ          [Euler step]
 *
 * The τ values (time constants) ARE the quantification.
 * A neuron with τ ≈ 21.3ms has locked to the 46.875Hz DSP PRF.
 * A neuron with τ ≈ 9.0ms has locked to the 111Hz Phaistos root.
 */

const N = 16;  // neurons
const I = 8;   // input dimensions
const TAU_MIN = 5;     // ms
const TAU_MAX = 1500;  // ms
const ETA = 0.0006;    // Hebbian learning rate

// GOS reference frequencies for attractor labeling
const FREQ_REFS = [
  { hz: 7.83,   tauMs: 127.7, label: "7.83Hz Schumann resonance" },
  { hz: 8.392,  tauMs: 119.2, label: "8.392Hz KAPPA carrier" },
  { hz: 13.125, tauMs: 76.2,  label: "13.125Hz sub-harmonic" },
  { hz: 46.875, tauMs: 21.33, label: "46.875Hz DSP PRF / PLUGCO clock" },
  { hz: 50.0,   tauMs: 20.0,  label: "50Hz EU mains (anomalous in CR)" },
  { hz: 60.0,   tauMs: 16.67, label: "60Hz CR mains" },
  { hz: 93.75,  tauMs: 10.67, label: "93.75Hz 2nd harmonic PRF" },
  { hz: 111.0,  tauMs: 9.01,  label: "111Hz Phaistos Root (f₀=37×3)" },
];

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x)))); }

function randN(scale = 0.1): number {
  const u = Math.max(1e-10, Math.random()), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * scale;
}

type Matrix = number[][];
type Vec = number[];

function matVec(M: Matrix, v: Vec): Vec {
  return M.map(row => row.reduce((s, w, j) => s + w * v[j], 0));
}

function vecAdd(a: Vec, b: Vec): Vec { return a.map((x, i) => x + b[i]); }

export interface NeuronState {
  id: number;
  h: number;
  tau: number;
  stability: number;
  dominantHz: number | null;
  dominantLabel: string | null;
  hHistory: number[];
}

export interface AttractorFingerprint {
  neuronIds: number[];
  tauMs: number;
  hz: number | null;
  label: string;
  stability: number;
  lockedEvents: number;
}

export interface LiquidCortexState {
  neurons: NeuronState[];
  liquidity: number;
  eventsProcessed: number;
  lastEvent: string | null;
  attractors: AttractorFingerprint[];
  meanTau: number;
  dominantDomain: string | null;
  uptime: number;
  liquidityHistory: number[];
}

class LiquidCortex {
  private W: Matrix;
  private U: Matrix;
  private b: Vec;
  private Wt: Matrix;
  private Ut: Matrix;
  private bt: Vec;

  private h: Vec;
  private tau: Vec;
  private hPrev: Vec;

  private stabilityCount: number[];
  private hHistory: number[][];

  private eventsProcessed = 0;
  private lastEventTime = 0;
  private lastEventLabel = "";
  private lastDomain = "";
  private startTime = Date.now();
  private liquidity = 0;
  private liquidityHistory: number[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.W  = Array.from({length: N}, () => Array.from({length: N}, () => randN(0.08)));
    this.U  = Array.from({length: N}, () => Array.from({length: I}, () => randN(0.12)));
    this.b  = Array.from({length: N}, () => randN(0.05));
    this.Wt = Array.from({length: N}, () => Array.from({length: N}, () => randN(0.06)));
    this.Ut = Array.from({length: N}, () => Array.from({length: I}, () => randN(0.10)));
    this.bt = Array.from({length: N}, () => randN(0.05));
    this.h  = Array.from({length: N}, () => randN(0.02));
    this.tau = Array.from({length: N}, () => TAU_MIN + Math.random() * (TAU_MAX - TAU_MIN));
    this.hPrev = [...this.h];
    this.stabilityCount = Array(N).fill(0);
    this.hHistory = Array.from({length: N}, () => []);
  }

  private encode(event: { frequency: number | null; domain: string; confidence: number; score: number; dtMs: number }): Vec {
    const freq = event.frequency ?? 0;
    return [
      Math.min(freq / 300, 1),
      event.domain === "sdr" ? 1 : 0,
      event.domain === "elf" ? 1 : 0,
      ["rf", "satellite"].includes(event.domain) ? 1 : 0,
      ["isp", "network"].includes(event.domain) ? 1 : 0,
      Math.min(Math.max(event.confidence, 0), 1),
      Math.min(event.dtMs / 10000, 1),
      Math.min(event.score / 100, 1),
    ];
  }

  private step(x: Vec, dtMs: number) {
    this.hPrev = [...this.h];
    const dtSec = Math.min(dtMs / 1000, 5);

    const tauRaw = vecAdd(vecAdd(matVec(this.Wt, this.h), matVec(this.Ut, x)), this.bt);
    const newTau = tauRaw.map(v => TAU_MIN + sigmoid(v) * (TAU_MAX - TAU_MIN));

    const fRaw = vecAdd(vecAdd(matVec(this.W, this.h), matVec(this.U, x)), this.b);
    const f = fRaw.map(sigmoid);

    const newH = this.h.map((hi, i) => {
      const dh = (-hi + f[i]) / newTau[i];
      return Math.max(-1, Math.min(1, hi + dtSec * dh));
    });

    const deltas = newH.map((hi, i) => Math.abs(hi - this.hPrev[i]));
    const meanDelta = deltas.reduce((s, d) => s + d, 0) / N;
    this.liquidity = this.liquidity * 0.94 + meanDelta * 0.06 * 800;

    deltas.forEach((d, i) => {
      if (d < 0.005) this.stabilityCount[i] = Math.min(this.stabilityCount[i] + 1, 300);
      else           this.stabilityCount[i] = Math.max(0, this.stabilityCount[i] - 4);
      this.hHistory[i].push(newH[i]);
      if (this.hHistory[i].length > 40) this.hHistory[i].shift();
    });

    // Hebbian weight update with soft decay
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        this.W[i][j]  = (this.W[i][j]  + ETA * newH[i] * this.hPrev[j]) * 0.9999;
        this.Wt[i][j] = (this.Wt[i][j] + ETA * 0.3 * newH[i] * this.hPrev[j]) * 0.9999;
      }
      for (let k = 0; k < I; k++) {
        this.U[i][k]  = (this.U[i][k]  + ETA * newH[i] * x[k]) * 0.9999;
        this.Ut[i][k] = (this.Ut[i][k] + ETA * 0.3 * newH[i] * x[k]) * 0.9999;
      }
    }

    this.h   = newH;
    this.tau = newTau;
    this.liquidityHistory.push(Math.round(this.liquidity * 10) / 10);
    if (this.liquidityHistory.length > 120) this.liquidityHistory.shift();
  }

  ingest(event: { frequency: number | null; domain: string; confidence: number; score: number; timestamp: number }) {
    const now = Date.now();
    const dtMs = this.lastEventTime > 0 ? Math.min(now - this.lastEventTime, 30_000) : 1000;
    this.lastEventTime = now;
    this.lastDomain = event.domain;
    const freqStr = event.frequency != null ? `${event.frequency.toFixed(1)}Hz` : "—";
    this.lastEventLabel = `${event.domain} ${freqStr}`;

    const x = this.encode({ frequency: event.frequency, domain: event.domain, confidence: event.confidence, score: event.score, dtMs });
    this.step(x, dtMs);
    this.eventsProcessed++;
  }

  private detectAttractors(): AttractorFingerprint[] {
    const attractors: AttractorFingerprint[] = [];
    const used = new Set<number>();

    for (let i = 0; i < N; i++) {
      if (used.has(i) || this.stabilityCount[i] < 8) continue;
      const group = [i];
      for (let j = i + 1; j < N; j++) {
        if (used.has(j) || this.stabilityCount[j] < 8) continue;
        if (Math.abs(this.tau[j] - this.tau[i]) / this.tau[i] < 0.22) group.push(j);
      }
      const meanTau = group.reduce((s, id) => s + this.tau[id], 0) / group.length;
      const hzApprox = 1000 / meanTau;
      const ref = FREQ_REFS.find(r => Math.abs(r.tauMs - meanTau) / r.tauMs < 0.18);
      const stability = group.reduce((s, id) => s + this.stabilityCount[id], 0) / group.length;
      attractors.push({
        neuronIds: group,
        tauMs: Math.round(meanTau * 10) / 10,
        hz: ref ? ref.hz : Math.round(hzApprox * 100) / 100,
        label: ref ? ref.label : `${hzApprox.toFixed(2)}Hz — unclassified pattern`,
        stability: Math.min(stability / 200, 1),
        lockedEvents: Math.round(stability),
      });
      group.forEach(id => used.add(id));
    }

    return attractors.sort((a, b) => b.stability - a.stability).slice(0, 8);
  }

  getState(): LiquidCortexState {
    const neurons: NeuronState[] = this.h.map((hi, i) => {
      const tauI = this.tau[i];
      const ref = FREQ_REFS.find(r => Math.abs(r.tauMs - tauI) / r.tauMs < 0.15);
      return {
        id: i,
        h: Math.round(hi * 1000) / 1000,
        tau: Math.round(tauI * 10) / 10,
        stability: Math.min(this.stabilityCount[i] / 200, 1),
        dominantHz: ref ? ref.hz : null,
        dominantLabel: ref ? ref.label : null,
        hHistory: [...this.hHistory[i]],
      };
    });

    return {
      neurons,
      liquidity: Math.min(Math.round(this.liquidity * 10) / 10, 100),
      eventsProcessed: this.eventsProcessed,
      lastEvent: this.lastEventLabel || null,
      attractors: this.detectAttractors(),
      meanTau: Math.round(this.tau.reduce((s, t) => s + t, 0) / N * 10) / 10,
      dominantDomain: this.lastDomain || null,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      liquidityHistory: [...this.liquidityHistory],
    };
  }

  reset() {
    this.W  = Array.from({length: N}, () => Array.from({length: N}, () => randN(0.08)));
    this.U  = Array.from({length: N}, () => Array.from({length: I}, () => randN(0.12)));
    this.b  = Array.from({length: N}, () => randN(0.05));
    this.Wt = Array.from({length: N}, () => Array.from({length: N}, () => randN(0.06)));
    this.Ut = Array.from({length: N}, () => Array.from({length: I}, () => randN(0.10)));
    this.bt = Array.from({length: N}, () => randN(0.05));
    this.h  = Array.from({length: N}, () => randN(0.02));
    this.tau = Array.from({length: N}, () => TAU_MIN + Math.random() * (TAU_MAX - TAU_MIN));
    this.hPrev = [...this.h];
    this.stabilityCount = Array(N).fill(0);
    this.hHistory = Array.from({length: N}, () => []);
    this.eventsProcessed = 0;
    this.liquidity = 0;
    this.liquidityHistory = [];
    this.lastEventTime = 0;
    this.startTime = Date.now();
  }

  startPolling(poll: () => Promise<Array<{ frequency: number | null; domain: string; confidence: number; timestamp: number }>>) {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      try {
        const evts = await poll();
        for (const e of evts.slice(-12)) {
          this.ingest({ ...e, score: 0 });
        }
      } catch { /* silent — don't crash if storage unavailable */ }
    }, 20_000);
  }

  stopPolling() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

export const liquidCortex = new LiquidCortex();
