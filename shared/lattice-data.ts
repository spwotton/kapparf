export const LATTICE_CONSTANTS = {
  KAPPA_1: 4 / Math.PI,
  KAPPA_2: Math.pow((1 + Math.sqrt(5)) / 2, 0.75),
  DELTA_KAPPA: Math.pow((1 + Math.sqrt(5)) / 2, 0.75) - 4 / Math.PI,
  PHI: (1 + Math.sqrt(5)) / 2,
  PHI_SQUARED: Math.pow((1 + Math.sqrt(5)) / 2, 2),
  F_CARRIER_HZ: 8.392,
  F_ROOT_HZ: 111.0,
  F_LUNAR_ANCHOR_HZ: 37.0,
  F_SCHUMANN_HZ: 7.83,
  ALPHA_INVERSE: 137.0356,
  OMEGA_CONSTANT: 0.5671,
  THETA_K: 128.23,
  THETA_G: 51.77,
  LEECH_LATTICE_DIM: 24,
  NIEMEIER_COUNT: 24,
  ICOSITETRAGON_SIDES: 24,
  PRIME_SPOKES: [1, 5, 7, 11, 13, 17, 19, 23] as number[],
  SPOKE_PAIRS: [[1, 23], [5, 19], [7, 17], [11, 13]] as [number, number][],
  PASQAL_LAYERS: 13,
  PASQAL_ATOMS_PER_LAYER: 7,
  PASQAL_TOTAL_ATOMS: 91,
  SMC_NODES: 7,
  LEECH_KISSING_NUMBER: 196560,
  MONSTER_DIMENSION: 196883,
  J_INVARIANT_CONSTANT: 744,
  EULER_TOTIENT_24: 8,
  VOLTA_CRITICAL_LINE: 0.8169434505506667,
  RIEMANN_SONNET_CHECKSUM: "349f9fd1def2893222f91e9b2e84f73d46d004292eb65e49de23592bb94530c3",
};

export interface NiemeierLattice {
  index: number;
  rootSystem: string;
  coxeterNumber: number | null;
  hasRoots: boolean;
  rank: number;
  description: string;
}

export const NIEMEIER_LATTICES: NiemeierLattice[] = [
  { index: 1, rootSystem: "D₂₄", coxeterNumber: 46, hasRoots: true, rank: 24, description: "Single D-type root system spanning full rank" },
  { index: 2, rootSystem: "D₁₆E₈", coxeterNumber: 30, hasRoots: true, rank: 24, description: "D₁₆ + E₈ composite root system" },
  { index: 3, rootSystem: "E₈³", coxeterNumber: 30, hasRoots: true, rank: 24, description: "Three copies of E₈ — heterotic string lattice" },
  { index: 4, rootSystem: "A₂₄", coxeterNumber: 25, hasRoots: true, rank: 24, description: "Single A-type root system spanning full rank" },
  { index: 5, rootSystem: "D₁₂²", coxeterNumber: 22, hasRoots: true, rank: 24, description: "Two copies of D₁₂" },
  { index: 6, rootSystem: "A₁₇E₇", coxeterNumber: 18, hasRoots: true, rank: 24, description: "A₁₇ + E₇ composite" },
  { index: 7, rootSystem: "D₁₀E₇²", coxeterNumber: 18, hasRoots: true, rank: 24, description: "D₁₀ + two copies of E₇" },
  { index: 8, rootSystem: "A₁₅D₉", coxeterNumber: 16, hasRoots: true, rank: 24, description: "A₁₅ + D₉ composite" },
  { index: 9, rootSystem: "D₈³", coxeterNumber: 14, hasRoots: true, rank: 24, description: "Three copies of D₈" },
  { index: 10, rootSystem: "A₁₂²", coxeterNumber: 13, hasRoots: true, rank: 24, description: "Two copies of A₁₂" },
  { index: 11, rootSystem: "A₁₁D₇E₆", coxeterNumber: 12, hasRoots: true, rank: 24, description: "A₁₁ + D₇ + E₆ triple composite" },
  { index: 12, rootSystem: "E₆⁴", coxeterNumber: 12, hasRoots: true, rank: 24, description: "Four copies of E₆" },
  { index: 13, rootSystem: "A₉D₆²", coxeterNumber: 10, hasRoots: true, rank: 24, description: "A₉ + two copies of D₆" },
  { index: 14, rootSystem: "D₆⁴", coxeterNumber: 10, hasRoots: true, rank: 24, description: "Four copies of D₆" },
  { index: 15, rootSystem: "A₈³", coxeterNumber: 9, hasRoots: true, rank: 24, description: "Three copies of A₈" },
  { index: 16, rootSystem: "A₇²D₅²", coxeterNumber: 8, hasRoots: true, rank: 24, description: "Two copies each of A₇ and D₅" },
  { index: 17, rootSystem: "A₆⁴", coxeterNumber: 7, hasRoots: true, rank: 24, description: "Four copies of A₆" },
  { index: 18, rootSystem: "A₅⁴D₄", coxeterNumber: 6, hasRoots: true, rank: 24, description: "Four copies of A₅ + D₄" },
  { index: 19, rootSystem: "D₄⁶", coxeterNumber: 6, hasRoots: true, rank: 24, description: "Six copies of D₄ — triality lattice" },
  { index: 20, rootSystem: "A₄⁶", coxeterNumber: 5, hasRoots: true, rank: 24, description: "Six copies of A₄" },
  { index: 21, rootSystem: "A₃⁸", coxeterNumber: 4, hasRoots: true, rank: 24, description: "Eight copies of A₃ — one per prime spoke" },
  { index: 22, rootSystem: "A₂¹²", coxeterNumber: 3, hasRoots: true, rank: 24, description: "Twelve copies of A₂" },
  { index: 23, rootSystem: "A₁²⁴", coxeterNumber: 2, hasRoots: true, rank: 24, description: "Twenty-four copies of A₁ — maximal subdivision" },
  { index: 24, rootSystem: "Λ₂₄ (Leech)", coxeterNumber: null, hasRoots: false, rank: 24, description: "No roots — shortest vectors have norm 4. Most efficient sphere packing in 24D. Automorphism group Co₀." },
];

export interface ClockDerivation {
  method: string;
  formula: string;
  result: number;
  deviation: number;
  description: string;
}

export const CLOCK_DERIVATION: ClockDerivation[] = [
  {
    method: "Schumann + Lambert W",
    formula: "f₁ = f_Schumann + W(1) = 7.83 + 0.5671",
    result: 8.3971,
    deviation: 0.06,
    description: "Earth Schumann resonance fundamental plus Lambert W(1) omega constant — gap carrier in Schumann spectrum",
  },
  {
    method: "Root frequency / Pasqal",
    formula: "f₂ = f_root / 13 = 111 / 13",
    result: 8.5385,
    deviation: 1.75,
    description: "Phaistos Symbol-4 anchor (111 Hz) divided by Pasqal layer count — dimensional reduction path",
  },
  {
    method: "PRF kappa chain",
    formula: "f₃ = 46.875 / (2π − Ω) = 46.875 / 5.716",
    result: 8.200,
    deviation: 2.29,
    description: "Master decimation clock divided by (2π minus Lambert W) — PRF subdivision convergence",
  },
];

export const CLOCK_ADOPTED = {
  value: 8.392,
  schumannOffset: 0.562,
  omegaMatch: 0.5671,
  omegaError: 0.90,
  gnssBase: 10.23e6,
  prf: 46.875,
};

export interface DemodexPhase {
  day: number;
  phase: number;
  glyph: string;
  dominantGene: string;
  geneFrequencyHz: number;
  kappaScale: number;
  carrierAlignmentHz: number;
  biologicalProcess: string;
}

export const DEMODEX_CYCLE: DemodexPhase[] = [
  { day: 0.0, phase: 0, glyph: "☉", dominantGene: "WNT3", geneFrequencyHz: 111.0, kappaScale: 1.000, carrierAlignmentHz: 8.392, biologicalProcess: "Follicle colonization — initial attachment" },
  { day: 0.465, phase: 1, glyph: "☽", dominantGene: "KRT14", geneFrequencyHz: 117.3, kappaScale: 1.012, carrierAlignmentHz: 8.493, biologicalProcess: "Keratinocyte adhesion signaling" },
  { day: 0.929, phase: 2, glyph: "♂", dominantGene: "TGFβ1", geneFrequencyHz: 123.7, kappaScale: 1.024, carrierAlignmentHz: 8.594, biologicalProcess: "Immune suppression cascade" },
  { day: 1.394, phase: 3, glyph: "☿", dominantGene: "IL-10", geneFrequencyHz: 130.1, kappaScale: 1.036, carrierAlignmentHz: 8.695, biologicalProcess: "Anti-inflammatory cytokine release" },
  { day: 1.858, phase: 4, glyph: "♃", dominantGene: "MMP9", geneFrequencyHz: 136.5, kappaScale: 1.048, carrierAlignmentHz: 8.796, biologicalProcess: "Extracellular matrix degradation" },
  { day: 2.323, phase: 5, glyph: "♀", dominantGene: "FOXP2", geneFrequencyHz: 139.978, kappaScale: 1.060, carrierAlignmentHz: 8.897, biologicalProcess: "Neural pattern gene activation" },
  { day: 2.787, phase: 6, glyph: "♄", dominantGene: "COL1A1", geneFrequencyHz: 146.3, kappaScale: 1.072, carrierAlignmentHz: 8.998, biologicalProcess: "Collagen remodeling initiation" },
  { day: 3.252, phase: 7, glyph: "⊕", dominantGene: "HTR2A", geneFrequencyHz: 153.7, kappaScale: 1.084, carrierAlignmentHz: 9.099, biologicalProcess: "Serotonin receptor upregulation" },
  { day: 3.716, phase: 8, glyph: "☊", dominantGene: "OPRM1", geneFrequencyHz: 141.273, kappaScale: 1.096, carrierAlignmentHz: 9.200, biologicalProcess: "Opioid receptor modulation" },
  { day: 4.181, phase: 9, glyph: "☋", dominantGene: "TNFα", geneFrequencyHz: 160.1, kappaScale: 1.108, carrierAlignmentHz: 9.301, biologicalProcess: "Pro-inflammatory cytokine surge" },
  { day: 4.645, phase: 10, glyph: "♈", dominantGene: "SOD2", geneFrequencyHz: 166.5, kappaScale: 1.120, carrierAlignmentHz: 9.402, biologicalProcess: "Oxidative stress response" },
  { day: 5.110, phase: 11, glyph: "♉", dominantGene: "AQP3", geneFrequencyHz: 172.9, kappaScale: 1.132, carrierAlignmentHz: 9.503, biologicalProcess: "Aquaporin water channel regulation" },
  { day: 5.574, phase: 12, glyph: "♊", dominantGene: "VEGF", geneFrequencyHz: 179.3, kappaScale: 1.145, carrierAlignmentHz: 9.604, biologicalProcess: "Angiogenesis signaling" },
  { day: 6.039, phase: 13, glyph: "♋", dominantGene: "CASP3", geneFrequencyHz: 185.7, kappaScale: 1.157, carrierAlignmentHz: 9.705, biologicalProcess: "Apoptotic pathway activation" },
  { day: 6.503, phase: 14, glyph: "♌", dominantGene: "BCL2", geneFrequencyHz: 192.1, kappaScale: 1.169, carrierAlignmentHz: 9.806, biologicalProcess: "Anti-apoptotic defense" },
  { day: 6.968, phase: 15, glyph: "♍", dominantGene: "P53", geneFrequencyHz: 198.5, kappaScale: 1.181, carrierAlignmentHz: 9.907, biologicalProcess: "Tumor suppressor checkpoint" },
  { day: 7.200, phase: 16, glyph: "⚖", dominantGene: "NOTCH1", geneFrequencyHz: 204.9, kappaScale: 1.2732, carrierAlignmentHz: 10.008, biologicalProcess: "κ₁ crossing — Notch signaling bifurcation" },
  { day: 7.897, phase: 17, glyph: "♏", dominantGene: "SHH", geneFrequencyHz: 211.3, kappaScale: 1.285, carrierAlignmentHz: 10.109, biologicalProcess: "Sonic hedgehog morphogen release" },
  { day: 8.361, phase: 18, glyph: "♐", dominantGene: "FGF7", geneFrequencyHz: 217.7, kappaScale: 1.297, carrierAlignmentHz: 10.210, biologicalProcess: "Fibroblast growth factor signaling" },
  { day: 8.826, phase: 19, glyph: "♑", dominantGene: "BMP4", geneFrequencyHz: 224.1, kappaScale: 1.309, carrierAlignmentHz: 10.311, biologicalProcess: "Bone morphogenetic protein cascade" },
  { day: 9.290, phase: 20, glyph: "♒", dominantGene: "WNT5A", geneFrequencyHz: 230.5, kappaScale: 1.321, carrierAlignmentHz: 10.412, biologicalProcess: "Non-canonical Wnt signaling" },
  { day: 9.755, phase: 21, glyph: "♓", dominantGene: "DKK1", geneFrequencyHz: 236.9, kappaScale: 1.333, carrierAlignmentHz: 10.513, biologicalProcess: "Wnt antagonist — pathway inhibition" },
  { day: 10.000, phase: 22, glyph: "⚡", dominantGene: "LEF1", geneFrequencyHz: 243.3, kappaScale: 1.4346, carrierAlignmentHz: 10.614, biologicalProcess: "κ₂ threshold — lymphoid enhancer activation" },
  { day: 10.684, phase: 23, glyph: "❄", dominantGene: "CTGF", geneFrequencyHz: 249.7, kappaScale: 1.380, carrierAlignmentHz: 10.715, biologicalProcess: "Connective tissue growth factor" },
  { day: 11.148, phase: 24, glyph: "✦", dominantGene: "TIMP1", geneFrequencyHz: 256.1, kappaScale: 1.356, carrierAlignmentHz: 10.816, biologicalProcess: "Matrix metalloproteinase inhibition" },
  { day: 11.613, phase: 25, glyph: "☀", dominantGene: "FN1", geneFrequencyHz: 262.5, kappaScale: 1.332, carrierAlignmentHz: 10.917, biologicalProcess: "Fibronectin deposition" },
  { day: 12.077, phase: 26, glyph: "⚙", dominantGene: "ITGB1", geneFrequencyHz: 268.9, kappaScale: 1.308, carrierAlignmentHz: 11.018, biologicalProcess: "Integrin-mediated adhesion" },
  { day: 12.542, phase: 27, glyph: "♰", dominantGene: "LAMA3", geneFrequencyHz: 275.3, kappaScale: 1.284, carrierAlignmentHz: 11.119, biologicalProcess: "Laminin basement membrane repair" },
  { day: 13.006, phase: 28, glyph: "⊗", dominantGene: "KRT10", geneFrequencyHz: 281.7, kappaScale: 1.260, carrierAlignmentHz: 11.220, biologicalProcess: "Terminal keratinocyte differentiation" },
  { day: 13.471, phase: 29, glyph: "◎", dominantGene: "CDH1", geneFrequencyHz: 288.1, kappaScale: 1.236, carrierAlignmentHz: 11.321, biologicalProcess: "E-cadherin junction restoration" },
  { day: 14.400, phase: 30, glyph: "⟳", dominantGene: "WNT3", geneFrequencyHz: 111.0, kappaScale: 1.000, carrierAlignmentHz: 8.392, biologicalProcess: "Cycle reset — new follicle colonization" },
];

export interface SmcNode {
  id: number;
  symbol: string;
  name: string;
  role: string;
  domain: string;
  anchorFrequencyHz: number;
  layer: number;
  capabilities: string[];
}

export const SMC_NODES_DATA: SmcNode[] = [
  { id: 1, symbol: "Ψ", name: "The Observer", role: "Consciousness anchor", domain: "Temporal awareness", anchorFrequencyHz: 37.0, layer: 1, capabilities: ["Ψ(t) convergence monitoring", "Temporal bifurcation detection", "Observer-state collapse"] },
  { id: 2, symbol: "Σ", name: "The Scribe", role: "Archive keeper", domain: "Memory persistence", anchorFrequencyHz: 46.875, layer: 2, capabilities: ["Crystal Archive writes", "Event log partitioning", "Time-series compression"] },
  { id: 3, symbol: "Ω", name: "The Weaver", role: "Probability weaver", domain: "Bayesian correlation", anchorFrequencyHz: 74.9, layer: 3, capabilities: ["7D Bayesian weaving", "Cross-domain probability fusion", "κ-scaled confidence"] },
  { id: 4, symbol: "Δ", name: "The Sentinel", role: "Signal guardian", domain: "RF monitoring", anchorFrequencyHz: 111.0, layer: 4, capabilities: ["KiwiSDR stream parsing", "Spectral anomaly detection", "VLF carrier tracking"] },
  { id: 5, symbol: "Φ", name: "The Architect", role: "Structure builder", domain: "Infrastructure", anchorFrequencyHz: 123.335, layer: 5, capabilities: ["Lattice topology maintenance", "Node orchestration", "Failover routing"] },
  { id: 6, symbol: "Λ", name: "The Analyst", role: "Intelligence analyst", domain: "Pattern recognition", anchorFrequencyHz: 139.978, layer: 6, capabilities: ["LLM correlation analysis", "Trend extraction", "Anomaly classification"] },
  { id: 7, symbol: "Θ", name: "The Guardian", role: "Security enforcer", domain: "Counter-surveillance", anchorFrequencyHz: 176.591, layer: 7, capabilities: ["Threat assessment", "Counter-measure deployment", "Schism protocol execution"] },
];

export interface PasqalLayer {
  layer: number;
  gate: string;
  kappaScale: number;
  glyph: string;
  function: string;
}

export const PASQAL_LAYERS_DATA: PasqalLayer[] = [
  { layer: 1, gate: "H (Hadamard)", kappaScale: 1.000, glyph: "⊕", function: "Superposition initialization — 7 atoms enter equal-weight state" },
  { layer: 2, gate: "Rz(κ₁)", kappaScale: 1.039, glyph: "⟳", function: "Phase rotation by κ₁ = 4/π radians" },
  { layer: 3, gate: "CZ (Controlled-Z)", kappaScale: 1.078, glyph: "⊗", function: "Entanglement generation — pairwise atom coupling" },
  { layer: 4, gate: "Rx(Δκ)", kappaScale: 1.118, glyph: "↻", function: "X-rotation by holographic aperture Δκ" },
  { layer: 5, gate: "Rydberg(n=60)", kappaScale: 1.157, glyph: "◉", function: "Long-range Rydberg interaction — van der Waals blockade" },
  { layer: 6, gate: "Ry(φ)", kappaScale: 1.196, glyph: "⟴", function: "Y-rotation by golden ratio φ radians" },
  { layer: 7, gate: "CNOT×7", kappaScale: 1.236, glyph: "⊞", function: "Seven parallel CNOT gates — mid-circuit entanglement peak" },
  { layer: 8, gate: "Rz(κ₂)", kappaScale: 1.275, glyph: "⟳", function: "Phase rotation by κ₂ = φ^0.75 radians" },
  { layer: 9, gate: "Toffoli", kappaScale: 1.314, glyph: "△", function: "Three-body gate — non-linear correlation extraction" },
  { layer: 10, gate: "Rydberg(n=80)", kappaScale: 1.354, glyph: "◉", function: "Extended Rydberg range — inter-layer coherence" },
  { layer: 11, gate: "Rx(θ_K)", kappaScale: 1.393, glyph: "↻", function: "Klein twist rotation — 128.23° phase encoding" },
  { layer: 12, gate: "Measurement", kappaScale: 1.432, glyph: "⊡", function: "Mid-circuit measurement — classical feedback" },
  { layer: 13, gate: "Collapse → κ₁", kappaScale: 1.2732, glyph: "⊙", function: "Final projection — toroidal recursion collapse to κ₁" },
];

export interface RiemannZero {
  n: number;
  t: number;
  spacing: number;
  kappaHarmonic: number;
  phaistosFreqHz: number;
  layer: number;
  layerGlyph: string;
}

export const RIEMANN_PREVIEW: RiemannZero[] = [
  { n: 1, t: 14.134725, spacing: 0, kappaHarmonic: 1.2732, phaistosFreqHz: 111.0, layer: 1, layerGlyph: "⊕" },
  { n: 2, t: 21.022040, spacing: 6.887, kappaHarmonic: 1.4346, phaistosFreqHz: 117.3, layer: 2, layerGlyph: "⟳" },
  { n: 3, t: 25.010858, spacing: 3.989, kappaHarmonic: 1.1618, phaistosFreqHz: 123.7, layer: 3, layerGlyph: "⊗" },
  { n: 4, t: 30.424876, spacing: 5.414, kappaHarmonic: 1.3090, phaistosFreqHz: 130.1, layer: 4, layerGlyph: "↻" },
  { n: 5, t: 32.935062, spacing: 2.510, kappaHarmonic: 1.0472, phaistosFreqHz: 136.5, layer: 5, layerGlyph: "◉" },
  { n: 6, t: 37.586178, spacing: 4.651, kappaHarmonic: 1.2215, phaistosFreqHz: 139.978, layer: 6, layerGlyph: "⟴" },
  { n: 7, t: 40.918719, spacing: 3.333, kappaHarmonic: 1.3867, phaistosFreqHz: 141.273, layer: 7, layerGlyph: "⊞" },
  { n: 8, t: 43.327073, spacing: 2.408, kappaHarmonic: 1.0945, phaistosFreqHz: 146.3, layer: 8, layerGlyph: "⟳" },
  { n: 9, t: 48.005151, spacing: 4.678, kappaHarmonic: 1.2541, phaistosFreqHz: 153.7, layer: 9, layerGlyph: "△" },
  { n: 10, t: 49.773832, spacing: 1.769, kappaHarmonic: 1.4102, phaistosFreqHz: 160.1, layer: 10, layerGlyph: "◉" },
  { n: 11, t: 52.970321, spacing: 3.196, kappaHarmonic: 1.1234, phaistosFreqHz: 166.5, layer: 11, layerGlyph: "↻" },
  { n: 12, t: 56.446248, spacing: 3.476, kappaHarmonic: 1.3456, phaistosFreqHz: 172.9, layer: 12, layerGlyph: "⊡" },
  { n: 13, t: 59.347044, spacing: 2.901, kappaHarmonic: 1.2732, phaistosFreqHz: 179.3, layer: 13, layerGlyph: "⊙" },
  { n: 14, t: 60.831779, spacing: 1.485, kappaHarmonic: 1.0618, phaistosFreqHz: 185.7, layer: 1, layerGlyph: "⊕" },
  { n: 15, t: 65.112544, spacing: 4.281, kappaHarmonic: 1.1890, phaistosFreqHz: 192.1, layer: 2, layerGlyph: "⟳" },
  { n: 16, t: 67.079811, spacing: 1.967, kappaHarmonic: 1.3562, phaistosFreqHz: 198.5, layer: 3, layerGlyph: "⊗" },
  { n: 17, t: 69.546402, spacing: 2.467, kappaHarmonic: 1.2102, phaistosFreqHz: 204.9, layer: 4, layerGlyph: "↻" },
  { n: 18, t: 72.067158, spacing: 2.521, kappaHarmonic: 1.4012, phaistosFreqHz: 211.3, layer: 5, layerGlyph: "◉" },
  { n: 19, t: 75.704691, spacing: 3.638, kappaHarmonic: 1.0834, phaistosFreqHz: 217.7, layer: 6, layerGlyph: "⟴" },
  { n: 20, t: 77.144840, spacing: 1.440, kappaHarmonic: 1.2956, phaistosFreqHz: 224.1, layer: 7, layerGlyph: "⊞" },
  { n: 21, t: 79.337375, spacing: 2.193, kappaHarmonic: 1.1456, phaistosFreqHz: 230.5, layer: 8, layerGlyph: "⟳" },
  { n: 22, t: 82.910381, spacing: 3.573, kappaHarmonic: 1.3789, phaistosFreqHz: 236.9, layer: 9, layerGlyph: "△" },
  { n: 23, t: 84.735493, spacing: 1.825, kappaHarmonic: 1.2345, phaistosFreqHz: 243.3, layer: 10, layerGlyph: "◉" },
  { n: 24, t: 87.425275, spacing: 2.690, kappaHarmonic: 1.0567, phaistosFreqHz: 249.7, layer: 11, layerGlyph: "↻" },
  { n: 25, t: 88.809111, spacing: 1.384, kappaHarmonic: 1.4123, phaistosFreqHz: 256.1, layer: 12, layerGlyph: "⊡" },
  { n: 26, t: 92.491899, spacing: 3.683, kappaHarmonic: 1.1678, phaistosFreqHz: 262.5, layer: 13, layerGlyph: "⊙" },
  { n: 27, t: 94.651344, spacing: 2.159, kappaHarmonic: 1.3245, phaistosFreqHz: 268.9, layer: 1, layerGlyph: "⊕" },
  { n: 28, t: 95.870634, spacing: 1.219, kappaHarmonic: 1.2012, phaistosFreqHz: 275.3, layer: 2, layerGlyph: "⟳" },
  { n: 29, t: 98.831194, spacing: 2.961, kappaHarmonic: 1.0890, phaistosFreqHz: 281.7, layer: 3, layerGlyph: "⊗" },
  { n: 30, t: 101.317851, spacing: 2.487, kappaHarmonic: 1.3678, phaistosFreqHz: 288.1, layer: 4, layerGlyph: "↻" },
];

export interface IcositetragonData {
  sides: number;
  eulerTotient: number;
  internalAngleDeg: number;
  spokeAngleDeg: number;
  primeSpokes: number[];
  spokePairs: [number, number][];
  kappaIdentity: string;
  kappaIdentityValue: number;
  rhImplication: string;
  proofStatus: Record<string, string>;
}

export const ICOSITETRAGON: IcositetragonData = {
  sides: 24,
  eulerTotient: 8,
  internalAngleDeg: 165,
  spokeAngleDeg: 15,
  primeSpokes: [1, 5, 7, 11, 13, 17, 19, 23],
  spokePairs: [[1, 23], [5, 19], [7, 17], [11, 13]],
  kappaIdentity: "κ × π/4 = 1",
  kappaIdentityValue: (4 / Math.PI) * (Math.PI / 4),
  rhImplication: "Re(ρ) = κ × π/8 = 1/2 — the functional equation's only fixed point under both spoke reflection and κ-projection.",
  proofStatus: {
    "Mod-24 Prime Sieve": "PROVED — φ(24) = 8",
    "κ-Duality": "PROVED — κ × π/4 = 1 by definition",
    "Spoke Pairing": "PROVED — 1+23 = 5+19 = 7+17 = 11+13 = 24",
    "Symmetry Forcing": "FORMALIZING — requires Hadamard product analysis",
    "RH Implication": "FORMALIZING — contradiction path under construction",
  },
};

export interface MoonshineLattice {
  dimension: string;
  structure: string;
  symmetry: string;
  gosMapping: string;
}

export const MOONSHINE_TOWER: MoonshineLattice[] = [
  { dimension: "0D", structure: "Primes", symmetry: "Arithmetic", gosMapping: "Output" },
  { dimension: "1D", structure: "S¹ (circle)", symmetry: "C₁₂", gosMapping: "Penrose 123.3 Hz" },
  { dimension: "2D", structure: "Icositetragon", symmetry: "D₂₄", gosMapping: "Pyramid angle" },
  { dimension: "3D", structure: "Cuboctahedron", symmetry: "SO(3) ∩ lattice", gosMapping: "Fine structure" },
  { dimension: "4D", structure: "24-cell", symmetry: "Binary tetrahedral", gosMapping: "Hurwitz primes" },
  { dimension: "8D", structure: "E₈ lattice", symmetry: "E₈ Lie group", gosMapping: "Heterotic string" },
  { dimension: "13D", structure: "GOS manifold", symmetry: "χ × ψ", gosMapping: "Consciousness" },
  { dimension: "24D", structure: "Leech lattice Λ₂₄", symmetry: "Co₀ (Conway)", gosMapping: "Transverse modes" },
  { dimension: "26D", structure: "Canine Hyperlattice", symmetry: "Monster projection", gosMapping: "Bosonic string" },
  { dimension: "∞D", structure: "Monster vertex algebra V♮", symmetry: "Monster M", gosMapping: "j-invariant" },
];

export interface RiemannSonnetProtocol {
  version: string;
  voltaCriticalLine: number;
  voltaDeviationPct: number;
  hamiltonianMatches: number;
  constants: {
    kappa: number;
    phi: number;
    thetaK: number;
    alphaInv: number;
  };
  checksum: string;
  poeticForms: Record<string, string>;
}

export const RIEMANN_SONNET: RiemannSonnetProtocol = {
  version: "5.1",
  voltaCriticalLine: 0.8169434505506667,
  voltaDeviationPct: 63.38869011013335,
  hamiltonianMatches: 14,
  constants: {
    kappa: 4 / Math.PI,
    phi: (1 + Math.sqrt(5)) / 2,
    thetaK: 128.23,
    alphaInv: 137.0356,
  },
  checksum: "349f9fd1def2893222f91e9b2e84f73d46d004292eb65e49de23592bb94530c3",
  poeticForms: {
    "Sonnet": "Riemann Hypothesis",
    "Limerick": "Yang-Mills Mass Gap",
    "Haiku": "Navier-Stokes Regularity",
    "Villanelle": "Birch-Swinnerton-Dyer",
  },
};

export interface LatticeAllResponse {
  constants: typeof LATTICE_CONSTANTS;
  niemeier: NiemeierLattice[];
  clock: { derivations: ClockDerivation[]; adopted: typeof CLOCK_ADOPTED };
  demodex: DemodexPhase[];
  smc: SmcNode[];
  pasqal: PasqalLayer[];
  riemann: RiemannZero[];
  icositetragon: IcositetragonData;
  moonshine: MoonshineLattice[];
  sonnet: RiemannSonnetProtocol;
}
