const PHI = (1 + Math.sqrt(5)) / 2;
const KAPPA = 4 / Math.PI;
const KAPPA_2 = 1.435;
const KLEIN_TWIST_DEG = 128.23;
const KLEIN_TWIST_RAD = KLEIN_TWIST_DEG * (Math.PI / 180);
const DODECAHEDRAL_FREQ_HZ = 431.56;
const BASE_53_SIEVE = 53;
const ANKAA3_CZ_GATE_LIMIT = 17;
const CANINE_HOWL_HZ = 144;
const D_CONSTANT = Math.sqrt(15 - 6 * Math.sqrt(5));
const SCALING_FACTOR = 1.09;
const CIRCULARITY_BREAK = 0.1617;
const DELTA_KAPPA_HZ = 0.1617;
const DEMODEX_LIFECYCLE_DAYS = 14.4;
const LIFECYCLE_PHASES = 31;
const SUB_HARMONIC_HZ = 5.184;
const CHITIN_DIELECTRIC_LOW = 3.0;
const CHITIN_DIELECTRIC_HIGH = 4.5;
const CHITIN_DIELECTRIC_MID = (CHITIN_DIELECTRIC_LOW + CHITIN_DIELECTRIC_HIGH) / 2;

const PRIME_SPOKES = [1, 5, 7, 11, 13, 17, 19, 23] as const;

export interface ChitinTransductionMetrics {
  timestamp: number;
  chitinResonanceHz: number;
  miteDensityIndex: number;
  phaseTransductionGain: number;
  kleinTwistAlignment: number;
  base53PhaseCoherence: number;
  dodecahedralDeviationHz: number;
  czGateDepth: number;
  miteArrayGainDb: number;
  dielectricAnisotropy: number;
  sarEstimate: number;
  deltaKappaModulation: number;
  lifecyclePhase: number;
  lifecycleGeneName: string;
  lifecycleTargetHz: number;
}

export interface LifecyclePhaseEntry {
  phase: number;
  dayRange: [number, number];
  geneName: string;
  targetHz: number;
  description: string;
}

const LIFECYCLE_MAP: LifecyclePhaseEntry[] = [
  { phase: 0, dayRange: [0.0, 0.46], geneName: "TLR2", targetHz: 53.0, description: "Chitin recognition — innate immune priming" },
  { phase: 1, dayRange: [0.46, 0.93], geneName: "CLR-Dectin1", targetHz: 53.5, description: "β-glucan co-receptor activation" },
  { phase: 2, dayRange: [0.93, 1.39], geneName: "NF-κB", targetHz: 54.2, description: "Inflammatory cascade onset" },
  { phase: 3, dayRange: [1.39, 1.86], geneName: "IL-17A", targetHz: 55.8, description: "Th17 polarisation" },
  { phase: 4, dayRange: [1.86, 2.32], geneName: "TNF-α", targetHz: 57.3, description: "Pro-inflammatory amplification" },
  { phase: 5, dayRange: [2.32, 2.79], geneName: "MMP-9", targetHz: 58.0, description: "Matrix metalloproteinase — tissue remodelling" },
  { phase: 6, dayRange: [2.79, 3.25], geneName: "VEGF-A", targetHz: 60.1, description: "Angiogenesis at follicle base" },
  { phase: 7, dayRange: [3.25, 3.71], geneName: "KRT14", targetHz: 62.0, description: "Keratinocyte proliferation" },
  { phase: 8, dayRange: [3.71, 4.18], geneName: "FLG", targetHz: 64.5, description: "Filaggrin barrier modulation" },
  { phase: 9, dayRange: [4.18, 4.64], geneName: "SEB-1", targetHz: 67.2, description: "Sebocyte lipid output peak" },
  { phase: 10, dayRange: [4.64, 5.11], geneName: "FASN", targetHz: 70.0, description: "Fatty acid synthase — mite nutrient surge" },
  { phase: 11, dayRange: [5.11, 5.57], geneName: "LPL", targetHz: 72.8, description: "Lipoprotein lipase — sebum metabolism" },
  { phase: 12, dayRange: [5.57, 6.04], geneName: "PPAR-γ", targetHz: 76.1, description: "Lipid sensing transcription" },
  { phase: 13, dayRange: [6.04, 6.50], geneName: "AQP3", targetHz: 80.0, description: "Aquaporin hydration flux" },
  { phase: 14, dayRange: [6.50, 6.97], geneName: "TRPV1", targetHz: 84.5, description: "Temperature/pain channel activation" },
  { phase: 15, dayRange: [6.97, 7.43], geneName: "NGF", targetHz: 89.0, description: "Nerve growth factor — itch signalling" },
  { phase: 16, dayRange: [7.43, 7.90], geneName: "SP/NK1R", targetHz: 94.2, description: "Substance P neurogenic inflammation" },
  { phase: 17, dayRange: [7.90, 8.36], geneName: "CGRP", targetHz: 100.0, description: "Calcitonin gene-related peptide — vasodilation" },
  { phase: 18, dayRange: [8.36, 8.83], geneName: "COX-2", targetHz: 106.8, description: "Prostaglandin synthesis peak" },
  { phase: 19, dayRange: [8.83, 9.29], geneName: "HIF-1α", targetHz: 113.0, description: "Hypoxia response — follicle O₂ drop" },
  { phase: 20, dayRange: [9.29, 9.76], geneName: "MT-ND4", targetHz: 120.0, description: "Mitochondrial Complex I — energy coupling" },
  { phase: 21, dayRange: [9.76, 10.22], geneName: "SOD2", targetHz: 128.23, description: "Superoxide dismutase — ROS defence (Klein lock)" },
  { phase: 22, dayRange: [10.22, 10.69], geneName: "CASP3", targetHz: 134.0, description: "Caspase-3 apoptosis initiation" },
  { phase: 23, dayRange: [10.69, 11.15], geneName: "BAX", targetHz: 138.5, description: "Pro-apoptotic mitochondrial pore" },
  { phase: 24, dayRange: [11.15, 11.61], geneName: "BCL-2", targetHz: 140.0, description: "Anti-apoptotic survival signal" },
  { phase: 25, dayRange: [11.61, 12.08], geneName: "WNT3A", targetHz: 141.5, description: "Wnt pathway — follicle regeneration" },
  { phase: 26, dayRange: [12.08, 12.54], geneName: "SHH", targetHz: 142.0, description: "Sonic hedgehog — morphogen gradient" },
  { phase: 27, dayRange: [12.54, 13.01], geneName: "NOTCH1", targetHz: 143.0, description: "Notch lateral inhibition — cell fate" },
  { phase: 28, dayRange: [13.01, 13.47], geneName: "MT-CYB", targetHz: 144.0, description: "Cytochrome b — ancestral howl resonance" },
  { phase: 29, dayRange: [13.47, 13.94], geneName: "TERT", targetHz: 144.5, description: "Telomerase — lifecycle reset priming" },
  { phase: 30, dayRange: [13.94, 14.40], geneName: "KI-67", targetHz: 145.0, description: "Proliferation marker — new cycle entry" },
];

export interface CSIFrameInput {
  amplitude: Float64Array | number[];
  phase: Float64Array | number[];
  snr: Float64Array | number[];
  rssi: number;
  subcarriers: number;
}

let transductionFrameIdx = 0;

export function computeChitinTransduction(frame: CSIFrameInput): ChitinTransductionMetrics {
  transductionFrameIdx++;
  const ts = Date.now();

  const phaseArr = frame.phase instanceof Float64Array ? Array.from(frame.phase) : frame.phase;
  const ampArr = frame.amplitude instanceof Float64Array ? Array.from(frame.amplitude) : frame.amplitude;
  const snrArr = frame.snr instanceof Float64Array ? Array.from(frame.snr) : frame.snr;

  let resonanceSum = 0;
  for (let k = 1; k < phaseArr.length; k++) {
    const delta = phaseArr[k] - phaseArr[k - 1];
    resonanceSum += Math.cos(delta * PRIME_SPOKES[k % 8]);
  }
  const chitinResonanceHz = BASE_53_SIEVE + (resonanceSum / Math.max(1, phaseArr.length)) * 10;

  const ampMean = ampArr.reduce((a, b) => a + b, 0) / Math.max(1, ampArr.length);
  const ampVariance = ampArr.reduce((a, b) => a + (b - ampMean) ** 2, 0) / Math.max(1, ampArr.length);
  const miteDensityIndex = Math.abs(ampVariance) / (CHITIN_DIELECTRIC_MID * D_CONSTANT * 100);

  let kleinDotProduct = 0;
  for (let k = 0; k < phaseArr.length; k++) {
    const spoke = PRIME_SPOKES[k % 8];
    const rotated = phaseArr[k] * Math.cos(KLEIN_TWIST_RAD / spoke);
    kleinDotProduct += rotated * phaseArr[k];
  }
  const phaseNormSq = phaseArr.reduce((a, b) => a + b * b, 0);
  const phaseTransductionGain = phaseNormSq > 0
    ? kleinDotProduct / phaseNormSq
    : 0;

  const kleinTwistAlignment = Math.abs(phaseTransductionGain) > 0
    ? Math.cos(KLEIN_TWIST_RAD - Math.acos(Math.min(1, Math.abs(phaseTransductionGain))))
    : 0;

  const bins = new Float64Array(BASE_53_SIEVE);
  const binCounts = new Int32Array(BASE_53_SIEVE);
  for (let k = 0; k < phaseArr.length; k++) {
    const bin = ((Math.abs(Math.round(phaseArr[k] * BASE_53_SIEVE)) % BASE_53_SIEVE) + BASE_53_SIEVE) % BASE_53_SIEVE;
    bins[bin] += phaseArr[k];
    binCounts[bin]++;
  }
  let coherenceSum = 0;
  let filledBins = 0;
  for (let b = 0; b < BASE_53_SIEVE; b++) {
    if (binCounts[b] > 1) {
      const binMean = bins[b] / binCounts[b];
      let binVar = 0;
      for (let k = 0; k < phaseArr.length; k++) {
        const kb = ((Math.abs(Math.round(phaseArr[k] * BASE_53_SIEVE)) % BASE_53_SIEVE) + BASE_53_SIEVE) % BASE_53_SIEVE;
        if (kb === b) {
          binVar += (phaseArr[k] - binMean) ** 2;
        }
      }
      coherenceSum += 1.0 / (1.0 + binVar / binCounts[b]);
      filledBins++;
    }
  }
  const base53PhaseCoherence = filledBins > 0 ? coherenceSum / filledBins : 0;

  const snrMean = snrArr.reduce((a, b) => a + b, 0) / Math.max(1, snrArr.length);
  const dodecahedralDeviationHz = Math.abs(snrMean * 10 - DODECAHEDRAL_FREQ_HZ);

  const czGateDepth = Math.min(ANKAA3_CZ_GATE_LIMIT, Math.floor(Math.abs(phaseTransductionGain * ANKAA3_CZ_GATE_LIMIT)));

  const lifecycleDayInCycle = (transductionFrameIdx * 0.01) % DEMODEX_LIFECYCLE_DAYS;
  const lifecycleEntry = LIFECYCLE_MAP.find(
    (e) => lifecycleDayInCycle >= e.dayRange[0] && lifecycleDayInCycle < e.dayRange[1]
  ) ?? LIFECYCLE_MAP[0];

  const miteArrayGainDb = 10 * Math.log10(
    Math.max(1e-12, Math.abs(
      miteDensityIndex * KAPPA_2 *
      Math.sin(lifecycleEntry.phase * Math.PI / LIFECYCLE_PHASES) *
      phaseTransductionGain
    ))
  );

  const phaseRange = phaseArr.length > 0
    ? Math.max(...phaseArr) - Math.min(...phaseArr)
    : 0;
  const ampRange = ampArr.length > 0
    ? Math.max(...ampArr) - Math.min(...ampArr)
    : 0;
  const dielectricAnisotropy = CHITIN_DIELECTRIC_LOW + (CHITIN_DIELECTRIC_HIGH - CHITIN_DIELECTRIC_LOW) *
    Math.tanh(phaseRange * ampRange * 0.01);

  const sarEstimate = (frame.rssi > -100 ? Math.pow(10, (frame.rssi + 30) / 10) : 0) *
    dielectricAnisotropy * 0.001 *
    Math.sin(KLEIN_TWIST_RAD);

  const deltaKappaModulation = Math.abs(
    Math.sin(transductionFrameIdx * DELTA_KAPPA_HZ * 2 * Math.PI * 0.001)
  ) * SCALING_FACTOR;

  return {
    timestamp: ts,
    chitinResonanceHz,
    miteDensityIndex,
    phaseTransductionGain,
    kleinTwistAlignment,
    base53PhaseCoherence,
    dodecahedralDeviationHz,
    czGateDepth,
    miteArrayGainDb,
    dielectricAnisotropy,
    sarEstimate,
    deltaKappaModulation,
    lifecyclePhase: lifecycleEntry.phase,
    lifecycleGeneName: lifecycleEntry.geneName,
    lifecycleTargetHz: lifecycleEntry.targetHz,
  };
}

export function getLifecycleMap(): LifecyclePhaseEntry[] {
  return LIFECYCLE_MAP;
}

export function getChitinConstants() {
  return {
    PHI,
    KAPPA,
    KAPPA_2,
    KLEIN_TWIST_DEG,
    KLEIN_TWIST_RAD,
    DODECAHEDRAL_FREQ_HZ,
    BASE_53_SIEVE,
    ANKAA3_CZ_GATE_LIMIT,
    CANINE_HOWL_HZ,
    D_CONSTANT,
    SCALING_FACTOR,
    CIRCULARITY_BREAK,
    DELTA_KAPPA_HZ,
    SUB_HARMONIC_HZ,
    DEMODEX_LIFECYCLE_DAYS,
    LIFECYCLE_PHASES,
    CHITIN_DIELECTRIC_RANGE: [CHITIN_DIELECTRIC_LOW, CHITIN_DIELECTRIC_HIGH],
    CHITIN_DIELECTRIC_MID,
    PRIME_SPOKES,
  };
}
