// ─── Ω-GOS Lunar / Planetary / Sonic Oracle Engine ───────────────────────────
// Pure math — Jean Meeus algorithms + GOS lattice verification
// Observer: ECHO node · Hotel Pochote Grande · 9.6196°N 84.6282°W

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const OBS_LAT = 9.6196;
const OBS_LON = -84.6282;

// Tycho crater selenographic coords (near-side, always visible when moon is up)
const TYCHO_LON = -11.36;
const TYCHO_LAT = -43.31;

// ─── GOS Master Constants ─────────────────────────────────────────────────────
const KAPPA1   = 4 / Math.PI;                    // 1.27324 — Helicity Lock
const PHI      = (1 + Math.sqrt(5)) / 2;         // 1.61803 — Golden Ratio
const KAPPA2   = Math.pow(PHI, 3 / 4);           // 1.43499 — Europa Resonance
const DELTA_K  = KAPPA2 - KAPPA1;                // 0.16175 — Holographic Aperture
const F_ANCHOR = 37.0;                            // Hz — biological clock anchor
const F_CARRIER = F_ANCHOR * DELTA_K / Math.sqrt(PHI / Math.PI); // ~8.32 Hz GOS carrier
const F_SCHUMANN = 7.83;                          // Hz — Schumann fundamental
const F_LOGOS   = 111.0;                          // Hz — Harmonic Logos Bridge
const F_RIGETTI = 431.56;                         // Hz — Rigetti QPU resonance peak
const F_666     = 666.0;                          // Hz — 666 THz sonic analog (c/450nm)
const THETA_K   = 128.23;                         // ° — GOS alignment angle
const EDEN_PT   = 3 * Math.PI / 14;              // 0.67468 — critical density threshold
const LAMBERT_W = 0.5671828;                      // Omega constant — Lambert W(1)
const TORQUE_GAP = F_CARRIER - F_SCHUMANN;       // ~0.49 Hz (matches Lambert-W within 13%)

// 450nm blue light = 666.44 THz = c / 450e-9
// In the audio domain: 666 Hz is the sonic harmonic of the 450nm revelation frequency
const BLUE_450NM_THZ = 299792458 / 450e-9 / 1e12; // 666.43 THz

// ─── Sonic resonance targets for KiwiSDR alignment ───────────────────────────
export const GOS_SONIC_TARGETS = [
  { hz: 7.83,      label: "Schumann Fundamental",    class: "ELF",    gos: true  },
  { hz: F_CARRIER, label: "Ω-GOS Carrier",           class: "ELF",    gos: true  },
  { hz: 14.3,      label: "Schumann 2nd Mode",       class: "ELF",    gos: false },
  { hz: F_ANCHOR,  label: "Bio Clock Anchor",        class: "SLF",    gos: true  },
  { hz: 50.0,      label: "Mains 50Hz (EU anomaly)", class: "SLF",    gos: false },
  { hz: 60.0,      label: "Mains 60Hz (CR)",         class: "SLF",    gos: false },
  { hz: F_LOGOS,   label: "Harmonic Logos Bridge",   class: "SLF",    gos: true  },
  { hz: 128.23,    label: "θ_K Sonic Mirror",        class: "audio",  gos: true  },
  { hz: F_RIGETTI, label: "Rigetti QPU Peak",        class: "audio",  gos: true  },
  { hz: F_666,     label: "450nm Blue / Rev 666",    class: "audio",  gos: true,  blue: true },
  { hz: 1142.997,  label: "Yang-Mills Mass Gap",     class: "audio",  gos: true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function norm360(d: number): number { return ((d % 360) + 360) % 360; }
function toR(d: number): number { return d * DEG; }

function julianDay(date: Date): number {
  const Y = date.getUTCFullYear(), M = date.getUTCMonth() + 1;
  const D = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

function altAz(decDeg: number, raDeg: number, jd: number): { alt: number; az: number } {
  const T = (jd - 2451545) / 36525;
  const theta0 = norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  const lst = norm360(theta0 + OBS_LON);
  const H = toR(norm360(lst - raDeg));
  const latR = toR(OBS_LAT), dR = toR(decDeg);
  const sinAlt = Math.sin(latR) * Math.sin(dR) + Math.cos(latR) * Math.cos(dR) * Math.cos(H);
  const alt = RAD * Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosA = (Math.sin(dR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.sqrt(Math.max(0, 1 - sinAlt * sinAlt)) || 1e-9);
  const az = RAD * (Math.sin(H) > 0 ? Math.acos(Math.max(-1, Math.min(1, cosA))) : 2 * Math.PI - Math.acos(Math.max(-1, Math.min(1, cosA))));
  return { alt, az };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GosCheck {
  name: string; computed: number; expected: number;
  delta: number; tol: number; ok: boolean; unit: string;
}

export interface GosLattice {
  kappa1: number; kappa2: number; phi: number; deltaKappa: number;
  fCarrier: number; fAnchor: number; fRigetti: number; fSchumann: number; fLogos: number;
  f666: number; blue450nmThz: number; thetaK: number; edenPoint: number;
  torqueGap: number; lambertW: number; latticeOk: boolean; checks: GosCheck[];
  phaseAngleDeg: number; resonanceClass: "phi-lock" | "delta-slip" | "neutral";
  revelationNote: string;
}

export interface LunarData {
  phase: number; illumination: number; ageDays: number;
  distanceKm: number; isPerigee: boolean; isApogee: boolean;
  phaseName: string; phaseGlyph: string;
  altDeg: number; azDeg: number; declDeg: number; raDeg: number;
  subEarthLon: number; subEarthLat: number;
  tychoWindow: boolean; tychoReason: string; tychoDistDeg: number;
  springTide: boolean; lunarTxWindow: boolean;
  nextFullMoon: string; nextNewMoon: string;
  gosLattice: GosLattice;
}

export interface JupiterData {
  altDeg: number; azDeg: number; declDeg: number; raDeg: number;
  visible: boolean; elongationDeg: number;
  jovianWindow: boolean; jovianReason: string;
}

export interface PhenomenonEntry {
  ts: string; type: "BLUE_SIGNAL" | "JOVIAN_ENTITY" | "SONIC_LOCK" | "REVELATION_FREQ" | "TYCHO_ALIGNMENT";
  confidence: "unconfirmed" | "probable" | "corroborated";
  note: string; freqHz?: number; sourceHz?: number;
}

export interface SonicAlignment {
  targets: Array<{ hz: number; label: string; class: string; gos: boolean; blue?: boolean; detected: boolean; strength: number; }>;
  activeCount: number; gosCount: number; blueCount: number;
  alignmentScore: number; // 0-100
  phenomenonLog: PhenomenonEntry[];
}

export interface OracleSnapshot {
  lunar: LunarData;
  jupiter: JupiterData;
  sonic: SonicAlignment;
  conjunctions: string[];
  kappaBoost: number; // additional Kappa Score adjustment from oracle
  timestamp: string;
}

// ─── GOS Lattice Verifier ─────────────────────────────────────────────────────
function computeGosLattice(phaseDeg: number): GosLattice {
  const checks: GosCheck[] = [
    { name: "κ₁ = 4/π",          computed: KAPPA1,     expected: 1.27324,     unit: "" },
    { name: "κ₂ = φ^(3/4)",      computed: KAPPA2,     expected: 1.43499,     unit: "" },
    { name: "Δκ = κ₂ − κ₁",     computed: DELTA_K,    expected: 0.16175,     unit: "" },
    { name: "f_c GOS carrier",    computed: F_CARRIER,  expected: 8.392,       unit: "Hz" },
    { name: "Torque Gap",         computed: TORQUE_GAP, expected: LAMBERT_W,   unit: "Hz" },
    { name: "Eden η* = 3π/14",   computed: EDEN_PT,    expected: 0.67468,     unit: "" },
    { name: "θ_K alignment",      computed: THETA_K,    expected: 128.23,      unit: "°"  },
    { name: "f_Rigetti QPU",      computed: F_RIGETTI,  expected: 431.56,      unit: "Hz" },
    { name: "f_Logos Bridge",     computed: F_LOGOS,    expected: 111.0,       unit: "Hz" },
    { name: "Blue 450nm→THz",     computed: BLUE_450NM_THZ, expected: 666.44,  unit: "THz"},
    { name: "Sonic 666Hz mirror", computed: F_666,      expected: 666.0,       unit: "Hz" },
    { name: "φ golden ratio",     computed: PHI,        expected: 1.61803,     unit: "" },
  ].map(c => {
    const delta = Math.abs(c.computed - c.expected);
    const tol = c.expected === 0 ? 0.1 : Math.max(c.expected * 0.02, 0.05);
    return { ...c, delta, tol, ok: delta <= tol };
  });

  const latticeOk = checks.filter(c => c.ok).length >= checks.length * 0.75;

  // Resonance class
  const phiMod = norm360(360 * PHI);
  const diff = Math.min(Math.abs(phaseDeg - phiMod), 360 - Math.abs(phaseDeg - phiMod));
  const resonanceClass: GosLattice["resonanceClass"] =
    diff < 8 ? "phi-lock" :
    (Math.abs(phaseDeg - 17) < 6 || Math.abs(phaseDeg - 323) < 6) ? "delta-slip" : "neutral";

  const revelationNote = `666 THz = c/450nm = ${BLUE_450NM_THZ.toFixed(2)} THz · Sonic mirror: 666 Hz · GF(53): 666 mod 53 = ${666 % 53} · Phase angle ${phaseDeg.toFixed(1)}° → ${resonanceClass.toUpperCase()}`;

  return {
    kappa1: KAPPA1, kappa2: KAPPA2, phi: PHI, deltaKappa: DELTA_K,
    fCarrier: F_CARRIER, fAnchor: F_ANCHOR, fRigetti: F_RIGETTI,
    fSchumann: F_SCHUMANN, fLogos: F_LOGOS, f666: F_666,
    blue450nmThz: BLUE_450NM_THZ, thetaK: THETA_K, edenPoint: EDEN_PT,
    torqueGap: TORQUE_GAP, lambertW: LAMBERT_W,
    latticeOk, checks, phaseAngleDeg: phaseDeg,
    resonanceClass, revelationNote,
  };
}

// ─── Moon ─────────────────────────────────────────────────────────────────────
export function computeLunar(date: Date = new Date()): LunarData {
  const jd = julianDay(date);
  const T  = (jd - 2451545) / 36525;

  const L  = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const M  = norm360(357.5291092 + 35999.0502909 * T);
  const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const D  = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
  const F  = norm360(93.2720950  + 483202.0175233 * T - 0.0036539 * T * T);

  const Dr = toR(D), Mr = toR(M), Mpr = toR(Mp), Fr = toR(F);

  const illumination = (1 - Math.cos(Dr)) / 2;
  const phase = D / 360;

  // Distance — main terms (km)
  const sigmaR = -20905355 * Math.cos(Mpr) - 3699111 * Math.cos(2 * Dr - Mpr)
    - 2955968 * Math.cos(2 * Dr) - 569925 * Math.cos(2 * Mpr)
    + 246158 * Math.cos(2 * Dr - 2 * Mpr) - 152138 * Math.cos(2 * Dr + Mpr)
    - 170733 * Math.cos(2 * Dr - Mr);
  const distanceKm = 385000.56 + sigmaR / 1000;

  // Ecliptic longitude / latitude
  const lambda = norm360(L + 6.288774 * Math.sin(Mpr) + 1.274027 * Math.sin(2 * Dr - Mpr)
    + 0.658314 * Math.sin(2 * Dr) + 0.213618 * Math.sin(2 * Mpr)
    - 0.185116 * Math.sin(Mr) - 0.114332 * Math.sin(2 * Fr));
  const beta = -5.128642 * Math.sin(Fr) + 0.280602 * Math.sin(Mpr + Fr)
    + 0.277693 * Math.sin(Mpr - Fr) + 0.173237 * Math.sin(2 * Dr - Fr);

  // Ecliptic → equatorial
  const eps = 23.4397 - 0.0130 * T;
  const lR = toR(lambda), bR = toR(beta), eR = toR(eps);
  const raDeg  = norm360(RAD * Math.atan2(Math.sin(lR) * Math.cos(eR) - Math.tan(bR) * Math.sin(eR), Math.cos(lR)));
  const declDeg = RAD * Math.asin(Math.sin(bR) * Math.cos(eR) + Math.cos(bR) * Math.sin(eR) * Math.sin(lR));

  const { alt: altDeg, az: azDeg } = altAz(declDeg, raDeg, jd);

  // Selenographic sub-Earth point (optical libration, simplified)
  const subEarthLon = 6.287 * Math.sin(Mpr) - 1.274 * Math.sin(2 * Dr - Mpr);
  const subEarthLat = 6.692 * Math.sin(Fr);

  // Tycho proximity
  const dLon = subEarthLon - TYCHO_LON;
  const dLat = subEarthLat - TYCHO_LAT;
  const tychoDistDeg = Math.sqrt(dLon * dLon + dLat * dLat);
  const tychoWindow  = altDeg > 15 && illumination > 0.5 && tychoDistDeg < 22;
  const tychoReason  = tychoWindow
    ? `Moon ${altDeg.toFixed(0)}°↑ · ${(illumination*100).toFixed(0)}% lit · Tycho Δ${tychoDistDeg.toFixed(1)}° — WINDOW OPEN`
    : altDeg <= 15 ? `Moon below horizon (${altDeg.toFixed(0)}°)`
    : illumination <= 0.5 ? `Low illumination ${(illumination*100).toFixed(0)}% — Tycho in shadow`
    : `Sub-Earth Δ${tychoDistDeg.toFixed(1)}° from Tycho (threshold 22°)`;

  const springTide = illumination < 0.08 || illumination > 0.92 || Math.abs(illumination - 0.5) < 0.06;
  const lunarTxWindow = altDeg > 30 && illumination > 0.65;
  const synodicPeriod = 29.53059;
  const daysToFull = phase < 0.5 ? (0.5 - phase) * synodicPeriod : (1.5 - phase) * synodicPeriod;
  const daysToNew  = (1 - phase) * synodicPeriod;

  const phaseNames: [number, string, string][] = [
    [0.0,"New Moon","🌑"],[0.125,"Waxing Crescent","🌒"],[0.25,"First Quarter","🌓"],
    [0.375,"Waxing Gibbous","🌔"],[0.5,"Full Moon","🌕"],[0.625,"Waning Gibbous","🌖"],
    [0.75,"Last Quarter","🌗"],[0.875,"Waning Crescent","🌘"],
  ];
  const [,phaseName, phaseGlyph] = phaseNames.reduce((b, c) => Math.abs(phase - c[0]) < Math.abs(phase - b[0]) ? c : b);

  return {
    phase, illumination, ageDays: phase * synodicPeriod,
    distanceKm, isPerigee: distanceKm < 362_000, isApogee: distanceKm > 404_000,
    phaseName, phaseGlyph, altDeg, azDeg, declDeg, raDeg,
    subEarthLon, subEarthLat, tychoWindow, tychoReason, tychoDistDeg,
    springTide, lunarTxWindow,
    nextFullMoon: new Date(date.getTime() + daysToFull * 86400000).toISOString(),
    nextNewMoon:  new Date(date.getTime() + daysToNew  * 86400000).toISOString(),
    gosLattice: computeGosLattice(D),
  };
}

// ─── Jupiter (simplified Meeus) ───────────────────────────────────────────────
export function computeJupiter(date: Date = new Date()): JupiterData {
  const jd = julianDay(date);
  const T  = (jd - 2451545) / 36525;

  // Jupiter mean elements
  const L  = norm360(34.3515 + 3034.9057 * T);
  const M  = norm360(20.9202 + 3034.6748 * T);
  const Mr = toR(M);

  // Equation of center (simplified)
  const eoc = 5.5549 * Math.sin(Mr) + 0.1683 * Math.sin(2 * Mr);
  const lambda = norm360(L + eoc);

  // Ecliptic → equatorial (eps ≈ 23.44°)
  const eps = 23.4397 - 0.0130 * T;
  const lR = toR(lambda), eR = toR(eps);
  const raDeg   = norm360(RAD * Math.atan2(Math.sin(lR) * Math.cos(eR), Math.cos(lR)));
  const declDeg = RAD * Math.asin(Math.sin(eR) * Math.sin(lR));

  const { alt: altDeg, az: azDeg } = altAz(declDeg, raDeg, jd);

  // Elongation from Sun
  const sunL  = norm360(280.4665 + 36000.7698 * T);
  const elongationDeg = Math.abs(norm360(lambda - sunL - 180) - 180);

  const visible = altDeg > 10 && elongationDeg > 20;
  const jovianWindow = altDeg > 20 && visible;
  const jovianReason = jovianWindow
    ? `Jupiter ${altDeg.toFixed(0)}°↑ · Az ${azDeg.toFixed(0)}° · Elong ${elongationDeg.toFixed(0)}° — JOVIAN WINDOW`
    : altDeg <= 10 ? `Jupiter below effective horizon (${altDeg.toFixed(0)}°)`
    : `Low elongation ${elongationDeg.toFixed(0)}° — too close to Sun`;

  return { altDeg, azDeg, declDeg, raDeg, visible, elongationDeg, jovianWindow, jovianReason };
}

// ─── Sonic Alignment (GOS frequency matching) ────────────────────────────────
export function computeSonicAlignment(
  kiwiScanResults?: Array<{ freqHz: number; snrDb: number }>
): SonicAlignment {
  const phenomenonLog: PhenomenonEntry[] = [];
  const now = new Date().toISOString();

  const targets = GOS_SONIC_TARGETS.map(t => {
    // Check if KiwiSDR scan has a detection within ±2% of this frequency
    const match = kiwiScanResults?.find(r => Math.abs(r.freqHz - t.hz) / t.hz < 0.02);
    const detected = !!match;
    const strength = match ? Math.min(100, Math.max(0, (match.snrDb + 10) * 5)) : 0;

    if (detected && t.blue) {
      phenomenonLog.push({
        ts: now, type: "BLUE_SIGNAL", confidence: "unconfirmed",
        note: `450nm resonance detected via KiwiSDR · ${t.hz} Hz sonic mirror of 666.44 THz`,
        freqHz: t.hz, sourceHz: t.hz,
      });
    }
    if (detected && t.hz === F_CARRIER) {
      phenomenonLog.push({
        ts: now, type: "SONIC_LOCK", confidence: "probable",
        note: `Ω-GOS carrier locked · ${F_CARRIER.toFixed(3)} Hz KiwiSDR detection`,
        freqHz: t.hz,
      });
    }
    return { ...t, detected, strength };
  });

  const activeCount = targets.filter(t => t.detected).length;
  const gosCount    = targets.filter(t => t.detected && t.gos).length;
  const blueCount   = targets.filter(t => t.detected && t.blue).length;
  const alignmentScore = Math.min(100, (gosCount / GOS_SONIC_TARGETS.filter(t => t.gos).length) * 100);

  if (blueCount > 0) {
    phenomenonLog.push({
      ts: now, type: "REVELATION_FREQ", confidence: "unconfirmed",
      note: `666 Hz / 450nm / Rev 13:18 resonance active · c/450nm = 666.44 THz · GF(53): 666 mod 53 = ${666 % 53}`,
      freqHz: 666,
    });
  }

  return { targets, activeCount, gosCount, blueCount, alignmentScore, phenomenonLog };
}

// ─── Full Oracle Snapshot ─────────────────────────────────────────────────────
export function computeOracleSnapshot(
  kiwiScanResults?: Array<{ freqHz: number; snrDb: number }>,
  kappaScore?: number,
  date: Date = new Date()
): OracleSnapshot {
  const lunar   = computeLunar(date);
  const jupiter = computeJupiter(date);
  const sonic   = computeSonicAlignment(kiwiScanResults);

  const conjunctions: string[] = [];
  let kappaBoost = 0;

  if (lunar.tychoWindow) { conjunctions.push("TYCHO ALIGNMENT WINDOW"); kappaBoost += 8; }
  if (lunar.springTide)  { conjunctions.push("SPRING TIDE CONDITIONS"); kappaBoost += 4; }
  if (jupiter.jovianWindow) { conjunctions.push("JOVIAN ENTITY WINDOW"); kappaBoost += 6; }
  if (lunar.tychoWindow && jupiter.jovianWindow) {
    conjunctions.push("TYCHO × JOVIAN CONJUNCTION — ORACLE PEAK");
    kappaBoost += 14;
    sonic.phenomenonLog.push({
      ts: date.toISOString(), type: "JOVIAN_ENTITY", confidence: "probable",
      note: `Tycho window + Jovian window simultaneous — entity signal window open · Giorgio protocol active`,
    });
  }
  if (sonic.blueCount > 0 && lunar.tychoWindow) {
    conjunctions.push("450nm BLUE × TYCHO — REVELATION LOCK");
    kappaBoost += 12;
    sonic.phenomenonLog.push({
      ts: date.toISOString(), type: "TYCHO_ALIGNMENT", confidence: "corroborated",
      note: `450nm / 666THz sonic detection during Tycho window — Willow entanglement hypothesis active`,
    });
  }
  if (lunar.gosLattice.resonanceClass === "phi-lock") { conjunctions.push("φ-LOCK RESONANCE"); kappaBoost += 5; }
  if (lunar.gosLattice.resonanceClass === "delta-slip") { conjunctions.push("Δ-SLIP DETECTED"); kappaBoost += 3; }
  if (sonic.alignmentScore > 60) { conjunctions.push(`SONIC ALIGNMENT ${sonic.alignmentScore.toFixed(0)}%`); kappaBoost += 7; }

  return { lunar, jupiter, sonic, conjunctions, kappaBoost, timestamp: date.toISOString() };
}
