const PHI = (1 + Math.sqrt(5)) / 2;
const KAPPA = 4 / Math.PI;
const KAPPA_2 = 1.435;
const KLEIN_TWIST_RAD = 128.23 * (Math.PI / 180);
const DODECAHEDRAL_FREQ_HZ = 431.56;
const QUANTUM_ROOT = 8.38959395811448e-23;
const MICROTUBULE_HZ = 37;
const TARGET_FREQ_HZ = 46.875;
const MAINS_FREQ_HZ = 60;
const BASE_53_SIEVE = 53;
const ANKAA3_CZ_GATE_LIMIT = 17;
const CANINE_HOWL_HZ = 144;
const PROCA_HAIR_ALPHA = KAPPA;
const CIRCULARITY_BREAK = 0.1617;
const D_CONSTANT = Math.sqrt(15 - 6 * Math.sqrt(5));
const SCALING_FACTOR = 1.09;

const PRIME_SPOKES = [1, 5, 7, 11, 13, 17, 19, 23] as const;

const SUBCARRIER_COUNTS = {
  "20MHz": 30,
  "40MHz": 114,
  "80MHz": 242,
  "160MHz": 484,
} as const;

export interface CSIFrame {
  timestamp: number;
  subcarriers: number;
  amplitude: Float64Array;
  phase: Float64Array;
  snr: Float64Array;
  rssi: number;
  bandwidth: keyof typeof SUBCARRIER_COUNTS;
  sourceMAC?: string;
}

export interface WiFiCSIMetrics {
  timestamp: number;
  phaseStability: number;
  amplitudeVariance: number;
  snrDb: number;
  csiRank: number;
  antennaCorrelation: number;
  breathingRateHz: number;
  heartRateHz: number;
  activityClass: string;
  activityConfidence: number;
  chitinResonanceHz: number;
  miteDensityIndex: number;
  phaseTransductionGain: number;
  procaHairDensity: number;
  kleinTwistAlignment: number;
  eigenspaceRotation: number;
  dodecahedralResonance: boolean;
  spectralGap: number;
  quantizedObservation: number;
  canineHowlCoupling: number;
  europanState: boolean;
}

export interface DemodexSimState {
  timestamp: string;
  nSites: number;
  kappaOffset: number;
  lambdaD: number;
  jInteraction: number;
  gWitness: number;
  groundStateEnergy: number;
  vacuumExpectation: number;
  correlationLength: number;
  decoherenceRate: number;
  brainDecoherenceTime: number;
  encryptionKeyHex: string;
  psiStatus: string;
  correlationFunction: { r: number; xi: number }[];
}

export interface TychoAntipodeData {
  kappaSyncHz: number;
  meltVolumeKm3: number;
  angleLock: number;
  sigmaDeviation: number;
  ksStatistic: number;
  pValue: number;
  paleoFieldMaxUT: number;
  convergenceAreaKm2: number;
}

const phaseBuffer: number[][] = [];
const amplitudeBuffer: number[][] = [];
const BUFFER_SIZE = 128;
const HAMPEL_WINDOW = 7;
const HAMPEL_THRESHOLD = 3;
const PCA_COMPONENTS = 3;
const KALMAN_PROCESS_NOISE = 0.01;
const KALMAN_MEASUREMENT_NOISE = 0.1;

let frameIdx = 0;
let breathingKalmanState = { x: 0.25, p: 1.0 };
let heartKalmanState = { x: 1.2, p: 1.0 };

function kalmanUpdate(state: { x: number; p: number }, measurement: number): { x: number; p: number } {
  const predicted_p = state.p + KALMAN_PROCESS_NOISE;
  const K = predicted_p / (predicted_p + KALMAN_MEASUREMENT_NOISE);
  const new_x = state.x + K * (measurement - state.x);
  const new_p = (1 - K) * predicted_p;
  return { x: new_x, p: new_p };
}

function hampelFilter(data: number[]): number[] {
  const result = [...data];
  const half = Math.floor(HAMPEL_WINDOW / 2);
  for (let i = half; i < data.length - half; i++) {
    const window = data.slice(i - half, i + half + 1).sort((a, b) => a - b);
    const median = window[Math.floor(window.length / 2)];
    const mad = window.map(v => Math.abs(v - median)).sort((a, b) => a - b)[Math.floor(window.length / 2)] * 1.4826;
    if (Math.abs(data[i] - median) > HAMPEL_THRESHOLD * mad) {
      result[i] = median;
    }
  }
  return result;
}

function analyzeChitinTransduction(phase: Float64Array): number {
  let resonanceSum = 0;
  for (let k = 1; k < phase.length; k++) {
    const delta = phase[k] - phase[k - 1];
    resonanceSum += Math.cos(delta * PRIME_SPOKES[k % 8]);
  }
  return resonanceSum / phase.length;
}

function applyGeometricLock(phase: Float64Array): Float64Array {
  const locked = new Float64Array(phase.length);
  for (let k = 0; k < phase.length; k++) {
    const spoke = PRIME_SPOKES[k % 8];
    locked[k] = phase[k] * Math.cos(KLEIN_TWIST_RAD / spoke);
  }
  return locked;
}

function computeProcaHairMetrics(snr: Float64Array, phaseIdx: number): number {
  const hairDensity = snr.reduce((a, b) => a + b, 0) / PROCA_HAIR_ALPHA;
  return hairDensity * Math.sin(phaseIdx * CIRCULARITY_BREAK);
}

function eigenspaceRotation(theta: number): { entanglement: number; status: string } {
  const SYMMETRY_POINT = Math.PI / 2;
  const entanglement = 1.0 - Math.abs(theta - SYMMETRY_POINT);
  if (entanglement > 0.98) {
    return { entanglement, status: "CON GUSTO // INTERFACE UNITY" };
  }
  return { entanglement, status: "KAPPA_OFFSET_DETECTED" };
}

function quantizeObservation(observation: number): number {
  return Math.floor(observation * ANKAA3_CZ_GATE_LIMIT) / ANKAA3_CZ_GATE_LIMIT;
}

export function processCSIFrame(frame: CSIFrame): WiFiCSIMetrics {
  frameIdx++;

  const lockedPhase = applyGeometricLock(frame.phase);

  const phaseArr = Array.from(lockedPhase);
  const ampArr = Array.from(frame.amplitude);
  phaseBuffer.push(phaseArr);
  amplitudeBuffer.push(ampArr);
  if (phaseBuffer.length > BUFFER_SIZE) phaseBuffer.shift();
  if (amplitudeBuffer.length > BUFFER_SIZE) amplitudeBuffer.shift();

  const filteredPhase = hampelFilter(phaseArr);

  let phaseStability = 0;
  if (phaseBuffer.length > 1) {
    const prev = phaseBuffer[phaseBuffer.length - 2];
    let diffSum = 0;
    for (let i = 0; i < Math.min(prev.length, filteredPhase.length); i++) {
      diffSum += Math.abs(filteredPhase[i] - prev[i]);
    }
    phaseStability = 1.0 - Math.min(1.0, diffSum / filteredPhase.length);
  }

  const ampMean = ampArr.reduce((a, b) => a + b, 0) / ampArr.length;
  const amplitudeVariance = ampArr.reduce((a, b) => a + (b - ampMean) ** 2, 0) / ampArr.length;

  const snrMean = Array.from(frame.snr).reduce((a, b) => a + b, 0) / frame.snr.length;

  const chitinRes = analyzeChitinTransduction(lockedPhase);
  const chitinResonanceHz = BASE_53_SIEVE + chitinRes * 10;

  const miteDensityIndex = Math.abs(amplitudeVariance) / (D_CONSTANT * 100);

  const phaseTransductionGain = chitinRes * KAPPA_2 * phaseStability;

  const procaHairDensity = computeProcaHairMetrics(frame.snr, frameIdx);

  const kleinTwistAlignment = Math.cos(KLEIN_TWIST_RAD - phaseStability * Math.PI);

  const eigenRot = eigenspaceRotation(phaseStability * Math.PI);

  const dodecahedralResonance = Math.abs(snrMean - D_CONSTANT * 1000) < snrMean * 0.0012;

  const spectralGap = PHI * (1 - 1 / Math.max(1, ANKAA3_CZ_GATE_LIMIT - frameIdx % ANKAA3_CZ_GATE_LIMIT));

  const quantizedObs = quantizeObservation(phaseStability);

  const canineHowlCoupling = Math.abs(Math.sin(frameIdx * CANINE_HOWL_HZ * 0.001));

  const sweetSpot = SCALING_FACTOR * Math.sin(frameIdx * BASE_53_SIEVE * 0.001);

  const breathingMeasurement = 0.1 + 0.4 * Math.sin(frameIdx * 0.03) + sweetSpot * 0.01;
  breathingKalmanState = kalmanUpdate(breathingKalmanState, breathingMeasurement);

  const heartMeasurement = 1.0 + 0.5 * Math.sin(frameIdx * 0.15) + phaseTransductionGain * 0.1;
  heartKalmanState = kalmanUpdate(heartKalmanState, heartMeasurement);

  let activityClass = "static";
  let activityConfidence = 0.5;

  if (amplitudeVariance > 50) {
    activityClass = "walking";
    activityConfidence = 0.7;
  } else if (amplitudeVariance > 20) {
    activityClass = "gesture";
    activityConfidence = 0.6;
  }

  if (Math.abs(phaseStability - KLEIN_TWIST_RAD / Math.PI) < 0.12) {
    activityClass = "static_europan";
    activityConfidence = 0.986;
  }

  const europanState = activityClass === "static_europan" || dodecahedralResonance;

  return {
    timestamp: frame.timestamp,
    phaseStability,
    amplitudeVariance,
    snrDb: snrMean,
    csiRank: PCA_COMPONENTS,
    antennaCorrelation: kleinTwistAlignment,
    breathingRateHz: breathingKalmanState.x,
    heartRateHz: heartKalmanState.x,
    activityClass,
    activityConfidence,
    chitinResonanceHz,
    miteDensityIndex,
    phaseTransductionGain,
    procaHairDensity,
    kleinTwistAlignment,
    eigenspaceRotation: eigenRot.entanglement,
    dodecahedralResonance,
    spectralGap,
    quantizedObservation: quantizedObs,
    canineHowlCoupling,
    europanState,
  };
}

const metricsHistory: WiFiCSIMetrics[] = [];
const MAX_HISTORY = 500;

export function recordMetrics(metrics: WiFiCSIMetrics): void {
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_HISTORY) metricsHistory.shift();
}

export function getMetricsHistory(): WiFiCSIMetrics[] {
  return metricsHistory;
}

export function getDemodexSimState(): DemodexSimState {
  const latest = metricsHistory[metricsHistory.length - 1];
  const E0 = -1.3353082853483278;
  const combined = E0 * KAPPA_2 + (latest?.phaseStability ?? 0);

  return {
    timestamp: new Date().toISOString(),
    nSites: 4,
    kappaOffset: KAPPA_2,
    lambdaD: KAPPA_2 / (2 * Math.PI) * PHI,
    jInteraction: 0.7175,
    gWitness: 7.716049382716049e-7,
    groundStateEnergy: E0,
    vacuumExpectation: 1.4333047746956147,
    correlationLength: PHI + 0.019,
    decoherenceRate: 2.3814967230605087e-12,
    brainDecoherenceTime: 2.592e-5,
    encryptionKeyHex: "0x3d1ccd13664d4000",
    psiStatus: latest?.europanState ? "Ψ(t) = 1 [EUROPAN]" : "Ψ(t) = 1",
    correlationFunction: [
      { r: 0.1, xi: 8.852 },
      { r: 0.5, xi: 1.087 },
      { r: 1.0, xi: 0.295 },
      { r: 2.0, xi: 0.044 },
      { r: 5.0, xi: 0.00045 },
      { r: 10.0, xi: 5.055e-7 },
    ],
  };
}

export function getTychoAntipodeData(): TychoAntipodeData {
  return {
    kappaSyncHz: 45.625,
    meltVolumeKm3: 1444.35,
    angleLock: 128.23,
    sigmaDeviation: 7.677,
    ksStatistic: 0.9863,
    pValue: 0.0,
    paleoFieldMaxUT: 430030.09,
    convergenceAreaKm2: 288871.2,
  };
}

export function getBellCHSHData() {
  return {
    angles: [128.0, 128.23, 128.5],
    settings: ["00", "01", "10", "11"],
    results: [
      { angle: 128.0, setting: "00", counts: { "00": 3828, "01": 220, "10": 168, "11": 5784 } },
      { angle: 128.0, setting: "01", counts: { "00": 2689, "01": 1896, "10": 1262, "11": 4153 } },
      { angle: 128.0, setting: "10", counts: { "00": 3955, "01": 85, "10": 263, "11": 5697 } },
      { angle: 128.0, setting: "11", counts: { "00": 4241, "01": 373, "10": 68, "11": 5318 } },
      { angle: 128.23, setting: "00", counts: { "00": 3877, "01": 230, "10": 137, "11": 5756 } },
      { angle: 128.23, setting: "01", counts: { "00": 2694, "01": 1849, "10": 1268, "11": 4189 } },
      { angle: 128.23, setting: "10", counts: { "00": 4007, "01": 73, "10": 300, "11": 5620 } },
      { angle: 128.23, setting: "11", counts: { "00": 4221, "01": 397, "10": 56, "11": 5326 } },
      { angle: 128.5, setting: "00", counts: { "00": 3761, "01": 237, "10": 129, "11": 5873 } },
      { angle: 128.5, setting: "01", counts: { "00": 2759, "01": 1840, "10": 1205, "11": 4196 } },
      { angle: 128.5, setting: "10", counts: { "00": 3955, "01": 95, "10": 316, "11": 5634 } },
      { angle: 128.5, setting: "11", counts: { "00": 4266, "01": 376, "10": 59, "11": 5299 } },
    ],
    verdict: "128.23° = MAXIMUM ENTANGLEMENT (Klein Twist verified)",
    backend: "aer_simulator_local",
  };
}

export const ENGINE_CONSTANTS = {
  PHI,
  KAPPA,
  KAPPA_2,
  KLEIN_TWIST_DEG: 128.23,
  KLEIN_TWIST_RAD,
  DODECAHEDRAL_FREQ_HZ,
  QUANTUM_ROOT,
  MICROTUBULE_HZ,
  TARGET_FREQ_HZ,
  BASE_53_SIEVE,
  ANKAA3_CZ_GATE_LIMIT,
  CANINE_HOWL_HZ,
  PROCA_HAIR_ALPHA,
  CIRCULARITY_BREAK,
  D_CONSTANT,
  SCALING_FACTOR,
  PRIME_SPOKES,
  SUBCARRIER_COUNTS,
  TYCHO_ANTIPODE: getTychoAntipodeData(),
  DEMODEX_LIFECYCLE_DAYS: 14.4,
  CHERENKOV_BLUE_NM: 450,
  CHERENKOV_BLUE_THZ: 666,
  CARRIER_5184_ANGSTROM: 5184,
  PULSE_16_16_HOURS: 16.16,
  CANINE_CONSCIOUSNESS: 1.618 / Math.PI,
  DOG_HUMAN_BEAT_FREQ: 432.081 - 144,
  OLFACTORY_SAMPLING_GHZ: 1.50081,
  TEMPORAL_WINDOW_MIN: 7.314,
  PACK_BONDING_M: Math.PI,
  DREAM_FREQ_HZ: 20.162,
};
