import { SUPERPOSITION_CONSTANTS, KAPPA_CONSTANTS, OMEGA_CHRONOS } from "@shared/schema";

export const SC = SUPERPOSITION_CONSTANTS;
export const K = KAPPA_CONSTANTS;
export const OC = OMEGA_CHRONOS;
export const PHI = SC.PHI_RECURSION_FACTOR;
export const KAPPA = SC.KAPPA_COHERENCE_THRESHOLD;
export const LAMBDA = SC.LAMBDA_GATE_RATIO;

export const OMEGA_GOS = {
  OMEGA_0: 8.38959395811448e-23,
  OMEGA_0_UNITS: "m^(5/2) · s^(-3/2)",
  OMEGA_LAMBERT: 0.5671432904,
  DODECAHEDRAL_D: Math.sqrt(15 - 6 * Math.sqrt(5)),
  DODECAHEDRAL_FREQ_HZ: 431.56,
  GRANT_CUBIC_FREQ_HZ: 432.081216,
  MICROTUBULE_RESONANCE_HZ: 37 * PHI * PHI * KAPPA,
  SEPTINITY_INVARIANT: 8.38959395811448e-23 * KAPPA * 7,

  ICOSITETRAGON: {
    SIDES: 24,
    PRIME_MODULI: [1, 5, 7, 11, 13, 17, 19, 23],
    PRIME_SPOKES: 8,
    QUADRANT_ARMS: 4,
    CENTRAL_MODULI: [6, 12, 18, 24],
    PROPERTY_P2_MOD24: "p² ≡ 1 (mod 24) for all primes p ≥ 5",
    WINDING_NUMBER: 7,
  },

  MUSICAL_WAVE_OF_TIME: {
    BASE_A4_HZ: 432,
    SOLFEGGIO_HZ: 528,
    NOTES_PER_OCTAVE: 24,
    QUARTER_TONE_RATIO: Math.pow(2, 1/24),
    PTT_FREQUENCIES_OCTAVE_4: [
      { note: "A", hz: 432.081, time: "6 PM", chakra: "Pineal" },
      { note: "A*", hz: 445.500, time: "7 PM", chakra: "Pineal" },
      { note: "A#", hz: 457.228, time: "8 PM", chakra: "Pineal" },
      { note: "A#*", hz: 471.518, time: "9 PM", chakra: "Crown" },
      { note: "B", hz: 486.092, time: "10 PM", chakra: "Crown" },
      { note: "B*", hz: 499.054, time: "11 PM", chakra: "Crown" },
      { note: "C5", hz: 514.480, time: "12 AM", chakra: "Root" },
      { note: "C5*", hz: 528.100, time: "1 AM", chakra: "Root" },
    ],
    CHAKRA_CYCLE: ["Pineal", "Crown", "Root", "Sacral", "Solar", "Heart", "Throat"],
    DAY_CYCLE: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  },

  QUARTER_POWER_TOWER: {
    KAPPA_POSITION: "φ^(8/16) = √φ",
    KAPPA_FREQ_POSITION: "φ^(12/16) = φ^(3/4)",
    D_POSITION: "φ^(14/16) = φ^(7/8)",
    INV_PHI_POSITION: "φ^(-16/16)",
  },

  FINE_STRUCTURE_FORMULA: "α⁻¹ = (φ¹⁰ + κφ⁵) / (1 + (Ω/π)²/100)",
  FINE_STRUCTURE_APPROX: 137.0356,

  SPIRAL_MODS: {
    HEXAGON: { sides: 6, mod: 12, expansion: 1.1547, angle_deg: 30 },
    PENTAGON: { sides: 5, mod: 10, expansion: 1.23606, angle_deg: 36 },
    SQUARE: { sides: 4, mod: 8, expansion: 1.41421, angle_deg: 45 },
    ICOSITETRAGON: { sides: 24, mod: 48, expansion: 1.00681, angle_deg: 7.5 },
  },
} as const;
