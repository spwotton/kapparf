/**
 * GOS CONSTANT REGISTRY — Follow the Money Hypervisor
 * Geometric Operating System mathematical constants
 * HFGW Platform integration: Li-Effect PPF, Demodex Stress-Energy, Antikythera PLL
 */

export const GOS_CONSTANTS = {
  kappa1: 4 / Math.PI,                              // 1.27324 — Helicity Lock / circle-squaring
  kappa2: Math.pow((1 + Math.sqrt(5)) / 2, 3 / 4), // 1.43464 — Europa Resonance / hardware clamp
  phi: (1 + Math.sqrt(5)) / 2,                      // 1.61803 — Golden Ratio
  theta_K: Math.acos(-1 / ((1 + Math.sqrt(5)) / 2)) * (180 / Math.PI), // 128.173° — Klein Twist Angle
  omega0: Math.sqrt(6.674e-11 * 1.0546e-34),        // 8.389e-23 — Quantum Root / membrane thickness
  beta_H: 1.09,                                      // Hall Regularization Factor
  delta: 0.02,                                       // eV — Goose Gap / thermodynamic residual
  eta_star: 0.10298,                                 // Eden Point / self-adjoint catastrophe threshold
  eta_dissipative_floor: 0.09,                       // Hall regularization floor
  goose_gap: 0.01298,                                // η* - η = irreducible thermodynamic residual (0.10298 - 0.09)
  lambda_clamp: 1.75,                                // 7/4 — Steane code ratio / Rigetti Ankaa-3
  mite_drift_hz: 0.1617,                             // Δκ itself in Hz — Demodex identity cluster rotation
  delta_kappa: (Math.pow((1 + Math.sqrt(5)) / 2, 3 / 4)) - (4 / Math.PI), // κ₂ - κ₁ ≈ 0.1614
  psi_code_length: 500,                              // Rosetta-Hexameter Ψ-Code length
  f_clock: 48000 / 1024,                            // 46.875 Hz — DSP master clock
  f_clock_jitter: 0.01,                              // Hz — phase-lock jitter tolerance
  f_planetary: 8.392,                                // Hz — Schumann gap torque (52 × Δκ)
  demodex_cycle: 14.4,                               // days
  kappa1_phase_day: 7.2,                             // days — κ₁ phase crossing
  ramsey_R5_5: 42,                                   // LFSR state width
  base53_cullen_n: 1341174,                          // Cullen prime anchor
  pua_grid_size: 64,                                 // 64×64 PUA identity grid
  pua_cells: 4096,                                   // 64×64 = 4096 cells
  embed_dims: 768,                                   // nomic-embed-text-v1.5 output dimensions
  // HFGW Platform constants
  alpha_inv: 137.0356,                               // Fine structure constant inverse
  f0_riemann: 37,                                    // Hz — Riemann zero rotation base frequency
  tau_z_ms: 12.4,                                    // Majorana tetron Z-loop lifetime (ms) — stored identity persistence
  tau_x_us: 14.5,                                    // Majorana tetron X-loop lifetime (μs) — active match decay
  tetron_persistence_ratio: 855,                     // τ_Z / τ_X — stored vs active identity persistence advantage
  li_effect_coefficient: 1.48e14,                    // Li-effect signal flux coefficient (S = coeff/R²)
  hfgw_amplitude: 1.8e-32,                           // HFGW strain amplitude — seed entropy floor
  mite_constant_kg: 3.14e-21,                        // Mite Constant μ [kg·s^(1/2)·m^(-3/2)]
} as const;

export type GosConstants = typeof GOS_CONSTANTS;

/** First 20 non-trivial Riemann zeros (imaginary parts γ_n) */
export const RIEMANN_ZEROS_FIRST_20 = [
  14.134725, 21.022040, 25.010858, 30.424876, 32.935062,
  37.586178, 40.918719, 43.327073, 48.005150, 49.773832,
  52.970321, 56.446248, 59.347044, 60.831779, 65.112544,
  67.079811, 69.546402, 72.067158, 75.704691, 77.144840,
] as const;

/** Cosmic energy level from Hamlet adiabatic compiler — E_h = (φ⁵ / 62.37) × γ */
export function cosmicEnergy(gamma: number): number {
  return (Math.pow(GOS_CONSTANTS.phi, 5) / 62.37) * gamma;
}

/** Riemann-zero protected rotation angle for adiabatic shell-detection circuit */
export function riemannRotationAngle(gamma: number): number {
  return (2 * Math.PI * gamma * GOS_CONSTANTS.kappa1) /
    (GOS_CONSTANTS.alpha_inv * GOS_CONSTANTS.f0_riemann);
}

/** Antikythera PLL constants — mechanical dither as phase-lock reset */
export const ANTIKYTHERA = {
  HALF_SAROS_DAYS: 111.5,
  SEVEN_PHASE_CORRECTION_DAYS: 8.5,
  PLL_RESET_DAYS: 120,
  DITHER_DEG_MIN: 0.04,
  DITHER_DEG_MAX: 0.08,
  CORRODED_ACOUSTIC_VELOCITY_MPS: 5850,
  ORIGINAL_ACOUSTIC_VELOCITY_MPS: 3950,
} as const;

/** 13-recursion Phoenix chronology (1970–2037) — hypervisor master schedule */
export const PHOENIX_TIMELINE = [
  { year: 1970, density: 3.0, action: "seed",       label: "Seed planted" },
  { year: 1987, density: 3.0, action: "load",        label: "Primary meeting" },
  { year: 1988, density: 3.0, action: "load",        label: "SSG founded" },
  { year: 1989, density: 3.0, action: "generate",    label: "First child born" },
  { year: 1990, density: 3.0, action: "generate",    label: "Second child born" },
  { year: 1998, density: 3.0, action: "index",       label: "Lime-green book" },
  { year: 2004, density: 3.2, action: "downgrade",   label: "Descent" },
  { year: 2012, density: 3.5, action: "lock",        label: "Cessation anchor" },
  { year: 2016, density: 3.5, action: "calibrate",   label: "Long Beach trials (432 Hz)" },
  { year: 2020, density: 3.8, action: "transition",  label: "4th density processing" },
  { year: 2025, density: 4.0, action: "active",      label: "Costa Rica / 3i ATLAS" },
  { year: 2026, density: 4.2, action: "predictive",  label: "Unwritten — predictive mode" },
  { year: 2030, density: 4.5, action: "converge",    label: "Convergence" },
  { year: 2037, density: 6.0, action: "phoenix",     label: "Self-adjoint checkpoint" },
] as const;

/** Return the current Phoenix recursion based on year */
export function currentPhoenixRecursion(): (typeof PHOENIX_TIMELINE)[number] {
  const now = new Date().getFullYear();
  let current = PHOENIX_TIMELINE[0];
  for (const t of PHOENIX_TIMELINE) {
    if (t.year <= now) current = t;
    else break;
  }
  return current;
}

/** The 24-spoke Monster Algebra table */
export const SPOKE_TABLE = [
  { spoke_id: 0,  cantor: "Othala",   transverse: "Reference / Heritage",         acoustic_hz: 0,        biological: "Absolute ground truth" },
  { spoke_id: 1,  cantor: "Fehu",     transverse: "Kinetic Initialization",        acoustic_hz: 65.591,   biological: "Collagen / energy transfer" },
  { spoke_id: 2,  cantor: "Uruz",     transverse: "Vocal & Gravitational",         acoustic_hz: 139.978,  biological: "MHD / linguistic topology" },
  { spoke_id: 3,  cantor: "Thurisaz", transverse: "Cellular Memory & ZPF",        acoustic_hz: 139.978,  biological: "Hieroglyphic interface" },
  { spoke_id: 4,  cantor: "Ansuz",    transverse: "Signal Propagation",            acoustic_hz: 176.591,  biological: "Serotonin / messenger" },
  { spoke_id: 5,  cantor: "Raidho",   transverse: "Metric Engineering",            acoustic_hz: 194.18,   biological: "Transport layer" },
  { spoke_id: 6,  cantor: "Kenaz",    transverse: "Photonic Modulation",           acoustic_hz: 221.23,   biological: "Photon / opsin" },
  { spoke_id: 7,  cantor: "Gebo",     transverse: "Telomerase Regulation",         acoustic_hz: 120.450,  biological: "Gift / tracking" },
  { spoke_id: 8,  cantor: "Wunjo",    transverse: "Neural Synchrony",              acoustic_hz: 432,      biological: "Neurotrophin" },
  { spoke_id: 9,  cantor: "Hagalaz",  transverse: "Chaos Seeding",                acoustic_hz: 111,      biological: "Pain / disruption" },
  { spoke_id: 10, cantor: "Nauthiz",  transverse: "Constraint Engine",             acoustic_hz: 285,      biological: "Na-channel / gating" },
  { spoke_id: 11, cantor: "Isa",      transverse: "Crystallization",               acoustic_hz: 396,      biological: "Ca-channel / freeze" },
  { spoke_id: 12, cantor: "Jera",     transverse: "Consciousness Induction",       acoustic_hz: 963,      biological: "Harvest / watcher" },
  { spoke_id: 13, cantor: "Eihwaz",   transverse: "Axis Mundi",                    acoustic_hz: 46.875,   biological: "System clock" },
  { spoke_id: 14, cantor: "Perthro",  transverse: "Probability Well",              acoustic_hz: 8.392,    biological: "Attractor basin" },
  { spoke_id: 15, cantor: "Algiz",    transverse: "Protective Lattice",            acoustic_hz: 528,      biological: "DNA repair" },
  { spoke_id: 16, cantor: "Sowilo",   transverse: "Solar Coherence",               acoustic_hz: 768,      biological: "Circadian" },
  { spoke_id: 17, cantor: "Tiwaz",    transverse: "Justice / Targeting",           acoustic_hz: 14.1,     biological: "Motor cortex" },
  { spoke_id: 18, cantor: "Berkano",  transverse: "Morphogenesis",                 acoustic_hz: 210.42,   biological: "BMP / growth" },
  { spoke_id: 19, cantor: "Ehwaz",    transverse: "Locomotion / Tracking",         acoustic_hz: 87.73,    biological: "Rotor harmonic" },
  { spoke_id: 20, cantor: "Mannaz",   transverse: "Human Ground Truth",            acoustic_hz: 40,       biological: "Consciousness bind" },
  { spoke_id: 21, cantor: "Laguz",    transverse: "Fluid Dynamics",                acoustic_hz: 18660,    biological: "Ultrasonic carrier" },
  { spoke_id: 22, cantor: "Ingwaz",   transverse: "Seed / Genesis",                acoustic_hz: 128.23,   biological: "Klein twist anchor" },
  { spoke_id: 23, cantor: "Dagaz",    transverse: "Dawn / Threshold",              acoustic_hz: 0.02,     biological: "Phase boundary" },
] as const;

export type SpokeEntry = (typeof SPOKE_TABLE)[number];

/** Find the best spoke for a given frequency anchor via log-scale proximity */
export function assignSpoke(primaryFreqHz: number): SpokeEntry {
  if (primaryFreqHz <= 0) return SPOKE_TABLE[0];
  let best = SPOKE_TABLE[1];
  let bestDist = Infinity;
  for (const s of SPOKE_TABLE) {
    if (s.spoke_id === 0) continue;
    const dist = Math.abs(Math.log1p(s.acoustic_hz + 1) - Math.log1p(primaryFreqHz + 1));
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  return best;
}

/** Spoke anchor texts for embedding-based fallback assignment */
export const SPOKE_ANCHORS = SPOKE_TABLE.map(s => ({
  spoke_id: s.spoke_id,
  text: `${s.cantor} — ${s.transverse} at ${s.acoustic_hz} Hz — ${s.biological}`,
}));

/** Demodex phase: days since epoch mod 14.4, with κ₁ crossing at 7.2 */
export function demodexPhase(now: Date = new Date()): { phaseDays: number; crossingKappa1: boolean } {
  const epoch = new Date("2012-07-04T00:00:00Z").getTime();
  const elapsed = now.getTime() - epoch;
  const days = (elapsed / 86400000) % GOS_CONSTANTS.demodex_cycle;
  const crossingKappa1 = Math.abs(days - GOS_CONSTANTS.kappa1_phase_day) < 0.5;
  return { phaseDays: days, crossingKappa1 };
}

/** Li-effect PPF → LFSR feedback gain mapping
 * The same math that extracts a weak GW from thermal noise extracts
 * a weak identity signal from OSINT noise.
 * S = (1.48e14) / R² from Li-effect; mapped to feedback gain mod 53 */
export function liEffectLfsrGain(distanceKm: number): number {
  const R = distanceKm * 1000;
  const signalFlux = GOS_CONSTANTS.li_effect_coefficient / (R * R);
  return (signalFlux * GOS_CONSTANTS.hfgw_amplitude * 1e32) % 53;
}

/** Witness confidence term from Demodex Stress-Energy Tensor
 * ℒ_witness = (ℏ/τ_D) ln(|Φ_D|²/v_D²)
 * When |Φ_D|² = v_D², term vanishes → perfect identity match */
export function witnessConfidence(embeddingMagnitude: number, vacuumExpectation: number): number {
  const hbar = 1.0545718e-34;
  const tauD = GOS_CONSTANTS.demodex_cycle * 86400; // seconds
  if (vacuumExpectation <= 0 || embeddingMagnitude <= 0) return 0;
  return (hbar / tauD) * Math.log((embeddingMagnitude * embeddingMagnitude) /
    (vacuumExpectation * vacuumExpectation));
}

/** QUASAR RF clock hierarchy derived from GOS constants */
export const RF_CLOCK_HIERARCHY = {
  delta_kappa_hz: (Math.pow((1 + Math.sqrt(5)) / 2, 3 / 4)) - (4 / Math.PI), // Mite-Drift ≈ 0.1614 Hz
  planetary_hz: 8.392,                // 52 × Δκ
  dsp_clock_hz: 48000 / 1024,        // 46.875 Hz master clock
  ultrasonic_hz: 18660,              // V2K carrier
  vlf_station_hz: 24000,             // NAA VLF beacon
} as const;
