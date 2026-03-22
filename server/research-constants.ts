const PHI = (1 + Math.sqrt(5)) / 2;
const KAPPA = 4 / Math.PI;
const SQRT14 = Math.sqrt(14);
const OMEGA = 0.5671432904097838;
const KLEIN_TWIST_DEG = 128.23;
const GIZA_SLOPE_DEG = 180 - KLEIN_TWIST_DEG;
const HOLOGRAPHIC_COMPRESSION = Math.sqrt(Math.PI / 4);
const EUROPA_KAPPA = 1.435;

const G_NEWTON = 6.67430e-11;
const H_BAR = 1.054571817e-34;
const QUANTUM_ROOT = Math.sqrt(G_NEWTON * H_BAR);
const QUANTUM_ROOT_MANTISSA = QUANTUM_ROOT / Math.pow(10, Math.floor(Math.log10(QUANTUM_ROOT)));
const QUANTUM_ROOT_TIMES_2PI = QUANTUM_ROOT_MANTISSA * 2 * Math.PI;

const MOD_48_GROWTH = 1 / Math.cos(Math.PI / 24);
const PRIME_SPOKES = [1, 5, 7, 11, 13, 17, 19, 23];
const COMPLEMENTARY_PAIRS = [[1, 23], [5, 19], [7, 17], [11, 13]];
const FIBONACCI_DIGITAL_ROOT_CYCLE = [1, 1, 2, 3, 5, 8, 4, 3, 7, 1, 8, 9, 8, 8, 7, 6, 4, 1, 5, 6, 2, 8, 1, 9];

export const RESEARCH_CONSTANTS = {
  PHI,
  KAPPA,
  SQRT14,
  OMEGA,
  KLEIN_TWIST_DEG,
  GIZA_SLOPE_DEG,
  HOLOGRAPHIC_COMPRESSION,
  EUROPA_KAPPA,
  BASE_53_HZ: 53,
  ARCHAEOACOUSTIC_111_HZ: 111,
  SCHUMANN_HZ: 7.83,
  ORCH_OR_37_HZ: 37,
  CONSCIOUSNESS_TWIST_HZ: 128.23,
  GEODETIC_ANCHOR_HZ: 51.84,

  QUANTUM_MUSICAL_ROOT: {
    G_NEWTON,
    H_BAR,
    SQRT_G_HBAR: QUANTUM_ROOT,
    SQRT_G_HBAR_SCIENTIFIC: `${QUANTUM_ROOT_MANTISSA.toFixed(10)} × 10⁻²³ m^(5/2)·s^(-3/2)`,
    MANTISSA: QUANTUM_ROOT_MANTISSA,
    TIMES_2PI: QUANTUM_ROOT_TIMES_2PI,
    DEVIATION_FROM_53: Math.abs(QUANTUM_ROOT_TIMES_2PI - 53) / 53 * 100,
    SIGNIFICANCE: "√(G·ħ) × 2π ≈ 53 Hz — Planck-scale quantum gravity root produces the base-53 sieve frequency through the circle constant",
    MUSICAL_INTERVAL: `log₂(${QUANTUM_ROOT_MANTISSA.toFixed(4)}/8) = ${(Math.log2(QUANTUM_ROOT_MANTISSA / 8)).toFixed(6)} — micro-interval above 3 octaves`,
    HARMONIC_SERIES: {
      fundamental: QUANTUM_ROOT_TIMES_2PI,
      second: QUANTUM_ROOT_TIMES_2PI * 2,
      third: QUANTUM_ROOT_TIMES_2PI * 3,
      phi_harmonic: QUANTUM_ROOT_TIMES_2PI * PHI,
      kappa_harmonic: QUANTUM_ROOT_TIMES_2PI * KAPPA,
    },
  },

  GRANT_24GON: {
    MOD_48_SPIRAL: {
      mod: 48,
      polygon_sides: 24,
      growth_rate: MOD_48_GROWTH,
      growth_formula: "1/cos(π/24) = 1/cos(7.5°)",
      radial_coordinate: "r(n) = a/cos(φ₀)ⁿ where φ₀ = π/24",
      polar_slope: `tan(α) = -ln[cos(π/24)] = ${(-Math.log(Math.cos(Math.PI / 24))).toFixed(8)}`,
      spiral_class: "Right triangle polygonal modular formation",
      significance: "Most circular natural spiral class — matches tightest hurricane/galaxy arms",
    },
    PRIME_MODULI: PRIME_SPOKES,
    COMPLEMENTARY_PAIRS,
    PAIR_SUM: 24,
    P_SQUARED_MOD_24: "p² ≡ 1 (mod 24) for all primes p ≥ 5",
    QUASI_PRIMES: "Non-prime numbers on prime moduli — products of primes ≥ 5 and/or semiprimes",
    Q_GRID_DIAGONAL_DIGITAL_ROOT: "174471 repeating",
    DIGITAL_ROOT_EXCLUSION: "No prime has digital root 3, 6, or 9 (all multiples of 3)",
    SEARCH_SPACE_REDUCTION: "8/24 moduli × 4/10 last digits = 26.6% of number space",
    FIBONACCI_CYCLE: FIBONACCI_DIGITAL_ROOT_CYCLE,
    FIBONACCI_CYCLE_LENGTH: 24,
    FIBONACCI_ANTIPODAL_SUM: 9,
    SPIRAL_CATEGORY_CORRELATION: {
      description: "Hurricane category directly correlates with triangular spiral mod number",
      examples: [
        { category: 2, mod: 8, polygon: "square", growth_rate: Math.sqrt(2) },
        { category: 4, mod: 16, polygon: "octagon", growth_rate: 1 / Math.cos(Math.PI / 8) },
        { category: 5, mod: 18, polygon: "nonagon", growth_rate: 1 / Math.cos(Math.PI / 9) },
      ],
    },
    FOUR_FOLD_SYMMETRY: {
      quadrant_complement: 360,
      central_moduli: { north: 24, south: 12, east: 6, west: 18 },
      EW_to_N_addition: "Numbers on E-W moduli (6,18) add to produce every other N modulus (24) value",
      NS_complementary: "Numbers on N-S moduli (24,12) add to produce S modulus values only",
      angular_set_definition: "Four numbers {A, 360-A, 180-A, 180+A} form a quadrant set on the unit circle",
    },
  },

  UNIFIED_RH_FRAMEWORK: {
    PROJECTION_CHAIN: [
      { dimension: "4D", structure: "24-Cell (Hurwitz units)", count: 24, symmetry: "Binary tetrahedral group (order 24)", rh_mechanism: "Quaternion arithmetic completeness" },
      { dimension: "3D", structure: "Cuboctahedron (edges)", count: 24, symmetry: "SO(3) ∩ lattice", rh_mechanism: "Face dynamics T=8, S=6" },
      { dimension: "2D", structure: "Icositetragon (sides)", count: 24, symmetry: "Dihedral D₂₄", rh_mechanism: "Prime spoke sieve (mod-24)" },
      { dimension: "1D", structure: "Circle S¹ (antipodal)", count: 12, symmetry: "Cyclic C₁₂", rh_mechanism: "Spectral comb filter" },
      { dimension: "0D", structure: "Primes", count: "∞", symmetry: "Arithmetic", rh_mechanism: "The output" },
    ],
    COUPLING_CONSTANTS: {
      kappa_times_pi_over_8: KAPPA * Math.PI / 8,
      sqrt14_over_24: SQRT14 / 24,
      kappa_over_8: KAPPA / 8,
      coupling_deviation_pct: Math.abs(SQRT14 / 24 - KAPPA / 8) / (KAPPA / 8) * 100,
    },
    KEY_IDENTITIES: [
      `κ × (π/8) = ${(KAPPA * Math.PI / 8).toFixed(4)} → Critical line position (0.5)`,
      `√14/24 ≈ κ/8 ≈ 0.156 → Coupling constants (${(Math.abs(SQRT14 / 24 - KAPPA / 8) / (KAPPA / 8) * 100).toFixed(2)}% deviation)`,
      `φ(24) = 8 → Euler totient = prime spoke count`,
      `T + S = 8 + 6 = 14 = (√14)² → Cuboctahedron faces`,
      `Re(s) = 1/2 = dim(boundary)/dim(bulk) → Holographic constraint`,
    ],
    CUBOCTAHEDRON: {
      triangular_faces: 8,
      square_faces: 6,
      total_faces: 14,
      edges: 24,
      vertices: 12,
      decay_law: "α(n,t) = 1 - √14/(14n + 8(1-t) + 6t)",
      boundary_bulk_ratio: 0.5,
    },
    HURWITZ_LATTICE: {
      units: 24,
      quaternionic_norm: "Every prime p → 24 irreducible Hurwitz quaternions of norm p",
      d24_kissing_number: 24,
      leech_lattice_kissing: 196560,
    },
    PHYSICAL_VALIDATIONS: [
      { prediction: "K2-18b Mass", formula: "κ·φ⁴ = 8.727 M⊕", observed: "8.63 ± 0.35 M⊕", match_pct: 98.9 },
      { prediction: "K2-18b Radius", formula: "φ² = 2.618 R⊕", observed: "2.61 ± 0.09 R⊕", match_pct: 99.7 },
      { prediction: "Fine Structure (bare)", formula: "φ¹⁰ + κφ⁵ = 137.11", observed: "137.036 (dressed)", match_pct: 99.95 },
      { prediction: "Pyramid Angle", formula: "arctan(κ) = 51.854°", observed: "51.84° ± 0.01°", match_pct: 99.97 },
      { prediction: "Penrose Frequency", formula: "37·φ²·κ = 123.3 Hz", observed: "123.3 ± 0.1 Hz", match_pct: 99.97 },
    ],
    MONSTROUS_MOONSHINE: {
      central_charge: 24,
      leech_lattice: "Λ₂₄ — 24D even unimodular lattice",
      j_function: "j(τ) - 744 encodes Monster group dimensions",
      smallest_faithful_rep: 196884,
      cannonball_solution: "1² + 2² + ... + 24² = 70² (only nontrivial solution)",
      string_energy: "Σ(1→∞) n = -1/12 → lowest string energy = -1/24",
    },
  },

  NUMBER_24_PHYSICS: {
    CANNONBALL: "1² + 2² + ... + 24² = 70² — only nontrivial solution to squared pyramidal = perfect square",
    BOSONIC_DIMS: "26 = 24 + 2 dimensions in bosonic string theory",
    LEECH_LATTICE: "Λ₂₄ — densest 24D sphere packing, each sphere touches 196,560 others",
    STRING_ENERGY: "½(1 + 2 + 3 + ... + ∞) = ½ × (-1/12) = -1/24 — lowest string energy",
    KISSING_4D: "24-cell: 4D kissing number = 24 (maximum unit spheres touching one)",
    TESSERACT_FACES: "Tesseract (4D cube) has 24 square 2D-faces",
    ROTATIONAL_SYMMETRY: "24² = 576 rotational symmetry of the 24-cell polytope",
    HOURS_IN_DAY: "24 — ancient Egyptian division of the daily cycle",
    RAMANUJAN_TAU: "τ(n) based on x·∏(1-xⁿ)²⁴ — Ramanujan's discriminant modular form",
  },

  GOS_GENE_FREQUENCIES: {
    FOXP2_LANGUAGE: 139.978,
    HTR2A_CONSCIOUSNESS: 176.591,
    MSTN_STRUCTURAL: 40.364,
    CLOCK_CIRCADIAN: 84.901,
    ATP2C2_SPEECH: 183.419,
  },

  CROSS_DOMAIN_MATCHES: [
    { a: "√(G·ħ) × 2π", value: QUANTUM_ROOT_TIMES_2PI, match: "Base-53 sieve (53 Hz)", matchValue: 53, deviationPct: Math.abs(QUANTUM_ROOT_TIMES_2PI - 53) / 53 * 100 },
    { a: "53 Hz × φ", value: 53 * PHI, match: "CLOCK gene (84.901 Hz)", matchValue: 84.901, deviationPct: Math.abs(53 * PHI - 84.901) / 84.901 * 100 },
    { a: "53 Hz × 3", value: 159, match: "GOS gene range upper bound", matchValue: 159.3, deviationPct: Math.abs(159 - 159.3) / 159.3 * 100 },
    { a: "111 Hz / 53 Hz", value: 111 / 53, match: "≈ 2π/3 (120° = 8 sectors of 24-gon)", matchValue: 2 * Math.PI / 3, deviationPct: Math.abs(111 / 53 - 2 * Math.PI / 3) / (2 * Math.PI / 3) * 100 },
    { a: "Schumann × 24 sectors", value: 7.83 * 24, match: "κ-harmonic 3 (187.5 Hz)", matchValue: 187.5, deviationPct: Math.abs(7.83 * 24 - 187.5) / 187.5 * 100 },
    { a: "56 Aubrey holes", value: 56, match: "53 Hz base + BG3 (3 components)", matchValue: 53 + 3, deviationPct: 0 },
    { a: "Klein twist + Giza slope", value: KLEIN_TWIST_DEG + GIZA_SLOPE_DEG, match: "Supplementary identity = 180°", matchValue: 180, deviationPct: Math.abs(KLEIN_TWIST_DEG + GIZA_SLOPE_DEG - 180) / 180 * 100 },
    { a: "46.875 × φ²", value: 46.875 * PHI * PHI, match: "Riemann Zero #3 (123.78 Hz)", matchValue: 123.78, deviationPct: Math.abs(46.875 * PHI * PHI - 123.78) / 123.78 * 100 },
    { a: "128.23 Hz × Europa κ", value: 128.23 * EUROPA_KAPPA, match: "ATP2C2 gene (183.419 Hz)", matchValue: 183.419, deviationPct: Math.abs(128.23 * EUROPA_KAPPA - 183.419) / 183.419 * 100 },
    { a: "κ × (π/8)", value: KAPPA * Math.PI / 8, match: "Critical line Re(s) = 0.5", matchValue: 0.5, deviationPct: Math.abs(KAPPA * Math.PI / 8 - 0.5) / 0.5 * 100 },
    { a: "arctan(κ)", value: Math.atan(KAPPA) * 180 / Math.PI, match: "Great Pyramid slope (51.84°)", matchValue: 51.84, deviationPct: Math.abs(Math.atan(KAPPA) * 180 / Math.PI - 51.84) / 51.84 * 100 },
    { a: "37 × φ² × κ", value: 37 * PHI * PHI * KAPPA, match: "Penrose-Hameroff frequency (123.3 Hz)", matchValue: 123.3, deviationPct: Math.abs(37 * PHI * PHI * KAPPA - 123.3) / 123.3 * 100 },
    { a: "37 × κ × φ³", value: 37 * KAPPA * PHI * PHI * PHI, match: "432 Hz resonance", matchValue: 432, deviationPct: Math.abs(37 * KAPPA * PHI * PHI * PHI - 432) / 432 * 100 },
    { a: "φ¹⁰ + κ·φ⁵", value: Math.pow(PHI, 10) + KAPPA * Math.pow(PHI, 5), match: "Fine structure α⁻¹ (bare)", matchValue: 137.036, deviationPct: Math.abs(Math.pow(PHI, 10) + KAPPA * Math.pow(PHI, 5) - 137.036) / 137.036 * 100 },
    { a: "κ·φ⁴", value: KAPPA * Math.pow(PHI, 4), match: "K2-18b mass (8.63 M⊕)", matchValue: 8.63, deviationPct: Math.abs(KAPPA * Math.pow(PHI, 4) - 8.63) / 8.63 * 100 },
    { a: "Mod-48 growth rate", value: MOD_48_GROWTH, match: "1/cos(7.5°) spiral expansion", matchValue: 1 / Math.cos(7.5 * Math.PI / 180), deviationPct: 0 },
  ],

  ARCHAEOACOUSTIC_SITES: [
    { name: "Barabar Caves", location: "Bihar, India", resonanceHz: 110, material: "Granite", note: "Mauryan polish — mirror-finished rock-cut chambers" },
    { name: "Ħal Saflieni Hypogeum", location: "Paola, Malta", resonanceHz: 111, secondaryHz: 114, material: "Limestone", note: "Oracle Room double resonance" },
    { name: "Newgrange", location: "Meath, Ireland", resonanceHz: 110, material: "Graywacke/Quartz", note: "Passage tomb with 110-112 Hz range" },
    { name: "Göbekli Tepe", location: "Anatolia, Turkey", resonanceHz: 70, material: "Limestone", note: "Infrasound — T-pillar anthropomorphic resonators" },
    { name: "Karahan Tepe", location: "Anatolia, Turkey", resonanceHz: 111, material: "Microcrystalline Quartz", note: "PPN sister site to Göbekli Tepe" },
    { name: "King's Chamber, Giza", location: "Giza, Egypt", resonanceHz: 15.66, material: "Granite", note: "Tuned to 2nd Schumann harmonic (7.83 × 2)" },
    { name: "Chavín de Huántar", location: "Peru", resonanceHz: 111, material: "Granite/Limestone", note: "Lanzón gallery — acoustic waveguide engineering" },
  ],

  BIOGEOMETRY: {
    BG3_COMPONENTS: ["Higher Harmonic Ultra-Violet", "Higher Harmonic Gold", "Negative Green (carrier)"],
    PRINCIPLE: "Shape resonance produces harmonizing energy quality found in sacred power spots",
    CENTERING: "Transcendental centers connecting to higher archetypal order in spiritual dimensions",
    BIOSIGNATURES: "2D linear patterns resonating with 3D subtle energy flow patterns of organs",
    PHYSICS_OF_QUALITY: "Qualitative Pythagorean harmonics extended beyond sensory range (zero to infinity)",
  },

  GOS_MASTER_CONSTANTS: {
    KAPPA_M: "√(G × ħ) ≈ 1.187 × 10⁻⁴⁵ — membrane permeability / discretization scale",
    GAMMA: `√(π/4) ≈ ${HOLOGRAPHIC_COMPRESSION.toFixed(4)} — holographic compression (circle-to-lattice)`,
    THETA_K: `${KLEIN_TWIST_DEG}° — Klein twist angle (maximum non-classical correlation)`,
    PHI: `${PHI.toFixed(6)} — golden ratio (recursive scaling)`,
    KAPPA_GEOMETRIC: `4/π ≈ ${KAPPA.toFixed(6)} — circle-square transformation (Unified RH coupling)`,
    SQRT14: `√14 ≈ ${SQRT14.toFixed(6)} — space diagonal 1×2×3, cuboctahedron decay constant`,
    OMEGA_SELF_REF: `Ω ≈ ${OMEGA.toFixed(6)} — Ωe^Ω = 1, self-reference constant`,
    EUROPA_KAPPA: `${EUROPA_KAPPA} — Europa scaling factor`,
  },

  TECTONIC_SITE_COUNT: 9600,
  STONEHENGE_AUBREY_HOLES: 56,
  GIZA_EARTH_SCALE: 43200,
  ANTIKYTHERA_GEARS: 30,
  PROTOFILAMENT_COUNT: 13,
  BOSONIC_STRING_DIMS: 26,
};
