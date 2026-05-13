/**
 * GOS Math Library — The mathematical backbone of Quantum Quake
 * All geometry flows through these constants.
 *
 * κ₁ = 4/π ≈ 1.2732   (Helicity Lock)
 * κ₂ = φ^(3/4) ≈ 1.435 (Temporal Expansion — PRIMARY)
 * φ  = (1+√5)/2         (Golden Ratio)
 * θ  = 128.23°          (Klein Bottle Twist)
 * Δκ = 0.161393 Hz      (Bridge Constant)
 * f₀ = 111 Hz           (Phaistos Root)
 * fc = 8.392 Hz         (Global Carrier)
 */

const PI = Math.PI;
const TAU = 2 * PI;

// ─── GOS Constants ──────────────────────────────────────────
export const GOS = Object.freeze({
    KAPPA_1: 4 / PI,                    // 1.2732…
    KAPPA: Math.pow((1 + Math.sqrt(5)) / 2, 3 / 4),  // 1.4349… ≈ 1.435
    PHI: (1 + Math.sqrt(5)) / 2,    // 1.61803…
    THETA_DEG: 128.23,
    THETA: 128.23 * PI / 180,         // radians
    DELTA_KAPPA: 0.161393,                  // Hz
    F0: 111.0,                     // Hz  (Phaistos root)
    CARRIER: 8.392,                     // Hz  (Global carrier)
    OMEGA: 0.567143,                  // Omega constant
    HEARTBEAT: 46.875,                    // Hz  (48000/1024)
});

// ─── Matrix helpers (column-major Float32 for WebGL) ────────
export function mat3Identity() {
    return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
}

/** Rotation about Y axis by `angle` radians → 3×3 column-major */
export function mat3RotY(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return new Float32Array([
        c, 0, -s,
        0, 1, 0,
        s, 0, c
    ]);
}

/** Rotation about X axis */
export function mat3RotX(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return new Float32Array([
        1, 0, 0,
        0, c, s,
        0, -s, c
    ]);
}

/** Rotation about Z axis */
export function mat3RotZ(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return new Float32Array([
        c, s, 0,
        -s, c, 0,
        0, 0, 1
    ]);
}

/**
 * The GOS Twist — time-varying 128.23° rotation modulated by Δκ.
 * Returns angle in radians at time `t`.
 */
export function gosTwistAngle(t) {
    return GOS.THETA * Math.sin(TAU * GOS.DELTA_KAPPA * t);
}

/**
 * κ-scaled position modulation: gently breathes geometry.
 * Returns a scale factor ∈ [1-amp, 1+amp].
 */
export function gosBreathScale(t, amp = 0.05) {
    return 1.0 + amp * Math.sin(TAU * GOS.CARRIER * t);
}

/**
 * Compute Ψ coherence from player state.
 * Ψ → 1 when resonance is high, → 0 under decoherence.
 */
export function psiCoherence(resonance, maxResonance = 100) {
    const r = Math.min(resonance / maxResonance, 1.0);
    return 0.5 + 0.5 * Math.tanh(3 * (r - 0.5));
}

/**
 * Golden-ratio timestamps within a duration.
 * Returns `count` timestamps at φ-distributed intervals.
 */
export function goldenTimestamps(duration, count = 5) {
    const ratio = 1 / GOS.PHI;
    const out = [];
    let t = duration * ratio;
    for (let i = 0; i < count; i++) { out.push(t); t *= ratio; }
    return out.sort((a, b) => a - b);
}

/**
 * Map a gene frequency to a color in HSL space.
 * Low frequencies → warm, high → cool.
 */
export function geneFreqToColor(freq, minF = 20, maxF = 400) {
    const t = Math.max(0, Math.min(1, (freq - minF) / (maxF - minF)));
    const h = (1 - t) * 0;      // red end
    const hue = 240 * t + 0;    // 0 = red, 240 = blue
    return { h: hue, s: 80, l: 55 };
}

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function degToRad(d) { return d * PI / 180; }
export function radToDeg(r) { return r * 180 / PI; }
