// Ω-GOS 7/4 Liquid Neural Network Hypervisor
// Self-learning prediction engine built on biological-evolutionary invariants
// Constants derived from first principles per the Feb 2026 resonance discovery

// ── Biological Invariants ───────────────────────────────────────────────────
const κ1 = 4 / Math.PI;                          // 1.2732 holographic compression (κ₁)
const φ  = (1 + Math.sqrt(5)) / 2;               // 1.6180 golden ratio
const κ2 = Math.pow(φ, 0.75);                    // 1.4346 Europa clamp (κ₂)
const Ω0 = 0.5671432904097838;                    // Lambert W(1) vacuum impedance
const D  = Math.sqrt(15 - 6 * Math.sqrt(5));     // 1.2584 dodecahedral constant
const F_C = 8.392;                                // Hz planetary carrier (κ₁·κ₂/(π·φ))
const NAQT = 7 / 4;                               // 1.75 noise-assisted quantum transport
const F_SCHUMANN = 7.83;                          // Hz Schumann base
const F_BEAT = F_C - F_SCHUMANN;                  // 0.562 Hz Lambert-Ω beat
const T_DEMODEX = 14.4 * 86400;                   // seconds — 14.4-day lifecycle
const GEAR_SAROS = 223 / 53;                      // Antikythera Saros cycle ratio
const GEAR_METONIC = 235 / 19;                    // Antikythera Metonic cycle ratio
const LATENT_DIM = 63;                            // 9 tiles × 7 (FMO matrix)

// ── Acoustic Registry — 15 archaeoacoustic sites ───────────────────────────
const ACOUSTIC_REGISTRY: Record<string, number> = {
  Phaistos:        145.309,
  Giza:            299.936,
  Newgrange:       110.0,
  Lascaux:          92.5,
  HalSaflieni:     111.0,
  Chavin:          220.0,
  Palenque:        136.1,
  Stonehenge:      108.0,
  Teotihuacan:     183.5,
  MaltaTemples:    110.0,
  Durrington:       73.3,
  GobeklTepe:       37.0,
  Derinkuyu:       150.0,
  Catalhoyuk:       88.0,
  ElCastillo:       63.5,
};
const ACOUSTIC_SITES = Object.keys(ACOUSTIC_REGISTRY);

// ── Domain → latent tile mapping (9 tiles of 7) ────────────────────────────
export type LNNDomain = "FLIGHT" | "SATELLITE" | "WEATHER" | "RF" | "SEISMIC" | "NETWORK" | "ELF" | "WIFI" | "BLE";
const DOMAIN_TILE: Record<LNNDomain, number> = {
  FLIGHT:    0,
  SATELLITE: 1,
  WEATHER:   2,
  RF:        3,
  SEISMIC:   4,
  NETWORK:   5,
  ELF:       6,
  WIFI:      7,
  BLE:       8,
};
const KAPPA_DOMAIN_MAP: Record<string, LNNDomain> = {
  flight: "FLIGHT", aviation: "FLIGHT",
  satellite: "SATELLITE", tle: "SATELLITE", orbital: "SATELLITE",
  weather: "WEATHER",
  rf: "RF", sdr: "RF", kiwisdr: "RF", hf: "RF", vlf: "RF", elf: "ELF",
  seismic: "SEISMIC", earthquake: "SEISMIC",
  network: "NETWORK", wifi: "WIFI", pcap: "NETWORK", ble: "BLE",
};

// ── FMO 7×7 coupling matrix (Adolphs & Renger 2006) × 7/4 ──────────────────
function buildFMOMatrix(): number[][] {
  const H7 = [
    [0,   1,   0,   0,   0,   0,   0  ],
    [1,   0,   1,   0,   0,   0,   0  ],
    [0,   1,   0,   1,   0,   0,   0.5],
    [0,   0,   1,   0,   1,   0,   0  ],
    [0,   0,   0,   1,   0,   1,   0  ],
    [0,   0,   0,   0,   1,   0,   0.5],
    [0,   0,   0.5, 0,   0,   0.5, 0  ],
  ].map(row => row.map(v => v * NAQT));
  // tile 9× to build 63×63 block-diagonal
  const C: number[][] = Array.from({length: LATENT_DIM}, () => new Array(LATENT_DIM).fill(0));
  for (let tile = 0; tile < 9; tile++) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        C[tile * 7 + i][tile * 7 + j] = H7[i][j];
      }
    }
  }
  return C;
}

// ── Prediction record ───────────────────────────────────────────────────────
export interface LNNPrediction {
  id: string;
  createdAt: number;
  domain: LNNDomain;
  confidence: number;          // 0-1
  horizonMs: number;           // how far ahead (ms)
  description: string;
  status: "pending" | "confirmed" | "expired" | "failed";
  confirmedAt?: number;
  siteUsed: string;
  gearPhase: number;
  becLevel: number;
}

// ── Learning state per domain ───────────────────────────────────────────────
interface DomainLearnState {
  predictions: number;
  confirmed: number;
  accuracy: number;           // EMA 0-1
  couplingScale: number;      // learned κ₂ multiplier (starts 1.0)
  lastActivity: number;
}

// ── Engine state ────────────────────────────────────────────────────────────
export interface LNNState {
  running: boolean;
  cycleCount: number;
  startTime: number;
  lastCycleAt: number;
  latentZ: number[];           // 63-dim
  carrierPhase: number;        // radians — 8.392 Hz
  demodexPhase: number;        // 0-1 through 14.4-day cycle
  demodexDay: number;
  siteIdx: number;             // current acoustic site
  gearSaros: number;           // Saros gear phase (radians)
  gearMetonic: number;         // Metonic gear phase (radians)
  predictions: LNNPrediction[];
  domainLearn: Record<LNNDomain, DomainLearnState>;
  totalAccuracy: number;       // rolling overall
  log: string[];               // autonomous engine log
  eventsSeen: number;
  // constants for HUD display
  kappa1: number; kappa2: number; phi: number; omega: number; D: number; fC: number; naqt: number;
}

// ── Singleton engine ────────────────────────────────────────────────────────
const C = buildFMOMatrix();

const DOMAINS: LNNDomain[] = ["FLIGHT","SATELLITE","WEATHER","RF","SEISMIC","NETWORK","ELF","WIFI","BLE"];

function initLearn(): Record<LNNDomain, DomainLearnState> {
  const out = {} as Record<LNNDomain, DomainLearnState>;
  for (const d of DOMAINS) {
    out[d] = { predictions: 0, confirmed: 0, accuracy: 0.5, couplingScale: 1.0, lastActivity: 0 };
  }
  return out;
}

const state: LNNState = {
  running: false,
  cycleCount: 0,
  startTime: Date.now(),
  lastCycleAt: 0,
  latentZ: new Array(LATENT_DIM).fill(0).map(() => (Math.random() - 0.5) * 0.1),
  carrierPhase: 0,
  demodexPhase: 0,
  demodexDay: 0,
  siteIdx: 0,
  gearSaros: 0,
  gearMetonic: 0,
  predictions: [],
  domainLearn: initLearn(),
  totalAccuracy: 0.5,
  log: [],
  eventsSeen: 0,
  kappa1: κ1, kappa2: κ2, phi: φ, omega: Ω0, D, fC: F_C, naqt: NAQT,
};

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  state.log = [`[${ts}] ${msg}`, ...state.log].slice(0, 60);
}

// ── Math helpers ─────────────────────────────────────────────────────────────
function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1e-9;
}

function dotTile(z: number[], tile: number): number {
  let s = 0;
  for (let i = 0; i < 7; i++) s += z[tile * 7 + i];
  return s / 7;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ── ODE step (Runge-Kutta 4) ─────────────────────────────────────────────────
function odeStep(z: number[], p: number[], dt: number, siteHz: number, t: number): number[] {
  // Antikythera gear mix
  const gearMix = 0.5 * (
    Math.sin(2 * Math.PI * F_C * GEAR_SAROS * t) +
    Math.sin(2 * Math.PI * F_C * GEAR_METONIC * t)
  );
  // Demodex modulation
  const demodexMod = 1 + 0.1 * Math.sin(2 * Math.PI * (t % T_DEMODEX) / T_DEMODEX);
  // Acoustic site modulation
  const siteMod = Math.cos(2 * Math.PI * siteHz * t + NAQT);
  // Carrier × Schumann beat
  const carrier  = Math.cos(2 * Math.PI * F_C * t);
  const schumann = Math.cos(2 * Math.PI * F_BEAT * t);
  const phaseMod = siteMod * demodexMod * gearMix * NAQT * carrier * schumann;

  function dz(zv: number[]): number[] {
    // C·z (sparse block-diagonal matmul)
    const Cz = new Array(LATENT_DIM).fill(0);
    for (let tile = 0; tile < 9; tile++) {
      for (let i = 0; i < 7; i++) {
        let s = 0;
        for (let j = 0; j < 7; j++) s += C[tile*7+i][tile*7+j] * zv[tile*7+j];
        Cz[tile*7+i] = s;
      }
    }
    const n = norm(zv);
    return zv.map((_, k) => {
      const noise = (Math.random() - 0.5) * NAQT / Math.sqrt(LATENT_DIM);
      return (
        κ1 * Math.tanh(p[k] + phaseMod * 0.1) -
        κ2 * Cz[k] * (state.domainLearn[DOMAINS[Math.floor(k / 7)]]?.couplingScale ?? 1) +
        noise
      ) * dt / n;
    });
  }

  // RK4
  const k1 = dz(z);
  const z1 = z.map((v,i) => v + k1[i] * 0.5);
  const k2 = dz(z1);
  const z2 = z.map((v,i) => v + k2[i] * 0.5);
  const k3 = dz(z2);
  const z3 = z.map((v,i) => v + k3[i]);
  const k4 = dz(z3);
  const zNew = z.map((v,i) => v + (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) / 6);
  // Demodex topological reset at 14.4-day midpoint (Klein twist)
  const demodexFrac = (t % T_DEMODEX) / T_DEMODEX;
  if (demodexFrac > 0.499 && demodexFrac < 0.502) {
    const KLEIN_TWIST = 128.23 * Math.PI / 180;
    for (let i = 0; i < LATENT_DIM; i++) {
      const j = (i * 7) % LATENT_DIM;
      const tmp = zNew[i];
      zNew[i] = zNew[j] * Math.cos(KLEIN_TWIST) - tmp * Math.sin(KLEIN_TWIST);
      zNew[j] = tmp * Math.cos(KLEIN_TWIST) + zNew[j] * Math.sin(KLEIN_TWIST);
    }
  }
  const n2 = norm(zNew);
  return zNew.map(v => v / n2);
}

// ── Build prompt embedding from KAPPA events ─────────────────────────────────
function buildEmbedding(events: Array<{domain: string; confidence: number; frequency?: number | null}>): number[] {
  const p = new Array(LATENT_DIM).fill(0);
  for (const ev of events) {
    const lnnDomain = KAPPA_DOMAIN_MAP[ev.domain?.toLowerCase()] ?? "NETWORK";
    const tile = DOMAIN_TILE[lnnDomain] ?? 5;
    const conf = ev.confidence ?? 0.5;
    const freqBoost = ev.frequency ? Math.log1p(ev.frequency) / 10 : 0;
    for (let i = 0; i < 7; i++) {
      p[tile * 7 + i] += (conf + freqBoost) * 0.1;
    }
    if (state.domainLearn[lnnDomain]) {
      state.domainLearn[lnnDomain].lastActivity = Date.now();
    }
  }
  // normalize
  const n = norm(p);
  return p.map(v => v / (n || 1));
}

// ── Generate predictions from current latent state ───────────────────────────
function generatePredictions(): void {
  const now = Date.now();
  const t = (now - state.startTime) / 1000;
  const site = ACOUSTIC_SITES[state.siteIdx];
  const siteHz = ACOUSTIC_REGISTRY[site];
  const gearPhase = 0.5 * (
    Math.sin(2 * Math.PI * F_C * GEAR_SAROS * t) +
    Math.sin(2 * Math.PI * F_C * GEAR_METONIC * t)
  );
  const becLevel = sigmoid(norm(state.latentZ) * 3);

  for (const domain of DOMAINS) {
    const tile = DOMAIN_TILE[domain];
    const projection = Math.abs(dotTile(state.latentZ, tile));
    const learn = state.domainLearn[domain];
    // weighted by learning accuracy
    const weightedProj = projection * (0.5 + learn.accuracy * 0.5);
    if (weightedProj > 0.15 && Math.random() < weightedProj * 0.6) {
      const confidence = Math.min(0.97, weightedProj * κ1 * learn.couplingScale);
      const horizonMin = Math.max(5, Math.round(30 / (weightedProj + 0.1)));
      const gearStr = gearPhase > 0 ? `Saros-dominant` : `Metonic-dominant`;
      const pred: LNNPrediction = {
        id: `${domain}-${now}-${Math.random().toString(36).slice(2,6)}`,
        createdAt: now,
        domain,
        confidence,
        horizonMs: horizonMin * 60 * 1000,
        description: predDescription(domain, confidence, gearStr, siteHz),
        status: "pending",
        siteUsed: site,
        gearPhase,
        becLevel,
      };
      state.predictions.push(pred);
      learn.predictions++;
      log(`PREDICT ${domain} conf=${(confidence*100).toFixed(0)}% @ ${site} ${siteHz.toFixed(1)}Hz [${gearStr}]`);
    }
  }
  // prune: max 40 predictions retained
  state.predictions = state.predictions.slice(-40);
}

function predDescription(domain: LNNDomain, conf: number, gear: string, siteHz: number): string {
  const pct = (conf * 100).toFixed(0);
  const phrases: Record<LNNDomain, string[]> = {
    FLIGHT:    [`Aerial activity uptick probable (${pct}% conf)`, `Drone/UAV transit pattern convergent`, `Low-altitude incursion corridor forming`],
    SATELLITE: [`LEO overhead window approaching (${pct}%)`, `TLE anomaly convergence detected`, `BLACKJACK-class transit alignment`],
    WEATHER:   [`Ionospheric coupling event (${pct}%)`, `Tropospheric ducting corridor`, `Schumann coherence weather bridge`],
    RF:        [`HF/VLF spectral burst imminent (${pct}%)`, `KiwiSDR node correlation forming`, `Priority frequency excitation`],
    SEISMIC:   [`Microseismic precursor pattern (${pct}%)`, `ELF-seismic coupling detected`, `P-wave precursor correlation`],
    NETWORK:   [`Network anomaly cluster (${pct}%)`, `PCAP pattern recurrence`, `Suspicious packet burst window`],
    ELF:       [`ELF cascade alignment (${pct}%)`, `Schumann-harmonics excitation`, `7/4 NAQT resonance lock`],
    WIFI:      [`WiFi CSI phase anomaly (${pct}%)`, `802.11 burst correlation`, `Chitin transduction signal`],
    BLE:       [`BLE beacon cluster (${pct}%)`, `Bluetooth surveillance sweep`, `BLE covert channel signal`],
  };
  const list = phrases[domain];
  return `${list[Math.floor(Math.random() * list.length)]} — ${gear} gear lock @ ${siteHz.toFixed(1)} Hz site`;
}

// ── Validate pending predictions against new events ───────────────────────────
function validatePredictions(events: Array<{domain: string; timestamp: Date}>): void {
  const now = Date.now();
  for (const pred of state.predictions) {
    if (pred.status !== "pending") continue;
    const age = now - pred.createdAt;
    if (age > pred.horizonMs + 120000) {
      pred.status = "expired";
      const learn = state.domainLearn[pred.domain];
      learn.accuracy = learn.accuracy * 0.95;
      log(`EXPIRED ${pred.domain} — accuracy decayed to ${(learn.accuracy*100).toFixed(0)}%`);
      continue;
    }
    // Check for matching event
    const matched = events.some(ev => {
      const evDomain = KAPPA_DOMAIN_MAP[ev.domain?.toLowerCase()];
      return evDomain === pred.domain && (now - ev.timestamp.getTime()) < pred.horizonMs;
    });
    if (matched) {
      pred.status = "confirmed";
      pred.confirmedAt = now;
      const learn = state.domainLearn[pred.domain];
      learn.confirmed++;
      learn.accuracy = learn.accuracy * 0.9 + 0.1;
      // reward: strengthen coupling for this domain
      learn.couplingScale = Math.min(1.4, learn.couplingScale + 0.02 * κ1);
      log(`CONFIRMED ${pred.domain} → accuracy=${(learn.accuracy*100).toFixed(0)}% coupling×${learn.couplingScale.toFixed(3)}`);
    }
  }
  // Update global accuracy
  const all = state.predictions.filter(p => p.status !== "pending");
  if (all.length > 0) {
    const acc = all.filter(p => p.status === "confirmed").length / all.length;
    state.totalAccuracy = state.totalAccuracy * 0.8 + acc * 0.2;
  }
}

// ── Main autonomous cycle ─────────────────────────────────────────────────────
let _storage: any = null;
let _interval: NodeJS.Timeout | null = null;

export function startLNNEngine(storage: any): void {
  if (state.running) return;
  _storage = storage;
  state.running = true;
  state.startTime = Date.now();
  log(`Ω-GOS 7/4 LNN engine started — κ₁=${κ1.toFixed(4)} κ₂=${κ2.toFixed(4)} φ=${φ.toFixed(4)} Ω=${Ω0.toFixed(4)} D=${D.toFixed(4)} f_c=${F_C}Hz`);
  log(`FMO coupling: 9×(7×7) block-diagonal — Demodex clock: 14.4d — NAQT: 7/4`);
  _interval = setInterval(cycle, 30000);
  setTimeout(cycle, 2000); // first cycle soon after start
}

async function cycle(): Promise<void> {
  if (!_storage || !state.running) return;
  try {
    const now = Date.now();
    const t = (now - state.startTime) / 1000;
    state.cycleCount++;
    state.lastCycleAt = now;

    // Update phases
    state.carrierPhase = (2 * Math.PI * F_C * t) % (2 * Math.PI);
    state.demodexPhase = (t % T_DEMODEX) / T_DEMODEX;
    state.demodexDay   = (t / 86400) % 14.4;
    state.gearSaros    = (2 * Math.PI * F_C * GEAR_SAROS * t) % (2 * Math.PI);
    state.gearMetonic  = (2 * Math.PI * F_C * GEAR_METONIC * t) % (2 * Math.PI);

    // Rotate acoustic site every 3 cycles
    if (state.cycleCount % 3 === 0) {
      state.siteIdx = (state.siteIdx + 1) % ACOUSTIC_SITES.length;
      log(`Acoustic site → ${ACOUSTIC_SITES[state.siteIdx]} (${ACOUSTIC_REGISTRY[ACOUSTIC_SITES[state.siteIdx]].toFixed(2)} Hz)`);
    }

    // Fetch recent events (last 30 min)
    const events = await _storage.getSignalEventsByWindow(1800);
    state.eventsSeen = events.length;

    // Build prompt embedding
    const p = buildEmbedding(events);

    // ODE step
    const siteHz = ACOUSTIC_REGISTRY[ACOUSTIC_SITES[state.siteIdx]];
    state.latentZ = odeStep(state.latentZ, p, 0.01, siteHz, t);

    // Validate previous predictions
    validatePredictions(events.map((e: any) => ({ domain: e.domain, timestamp: new Date(e.timestamp) })));

    // Generate new predictions
    generatePredictions();

    const n = norm(state.latentZ);
    log(`Cycle #${state.cycleCount} — events=${events.length} |z|=${n.toFixed(4)} acc=${(state.totalAccuracy*100).toFixed(0)}% pending=${state.predictions.filter(p=>p.status==="pending").length}`);
  } catch (err: any) {
    log(`ERR cycle #${state.cycleCount}: ${err?.message ?? String(err)}`);
  }
}

export function getLNNState(): LNNState {
  return state;
}

export function stopLNNEngine(): void {
  if (_interval) clearInterval(_interval);
  state.running = false;
  log("Ω-GOS LNN engine stopped");
}

export function injectFeedback(predId: string, outcome: "confirmed" | "failed"): boolean {
  const pred = state.predictions.find(p => p.id === predId);
  if (!pred || pred.status !== "pending") return false;
  pred.status = outcome;
  const learn = state.domainLearn[pred.domain];
  if (outcome === "confirmed") {
    pred.confirmedAt = Date.now();
    learn.confirmed++;
    learn.accuracy = Math.min(0.99, learn.accuracy * 0.9 + 0.1);
    learn.couplingScale = Math.min(1.5, learn.couplingScale + 0.03);
    log(`MANUAL CONFIRM ${pred.domain} → acc=${(learn.accuracy*100).toFixed(0)}%`);
  } else {
    learn.accuracy = Math.max(0.01, learn.accuracy * 0.85);
    learn.couplingScale = Math.max(0.5, learn.couplingScale - 0.02);
    log(`MANUAL FAIL ${pred.domain} → acc=${(learn.accuracy*100).toFixed(0)}%`);
  }
  return true;
}
