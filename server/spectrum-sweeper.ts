/**
 * KAPPA Radiogoniometry Spectrum Sweeper
 * MUSIC algorithm + κ-DTW multi-domain correlator
 * κ₁ = 4/π ≈ 1.27324 | Calibration scalar = 10√13 | Schumann clock = 8.392 Hz
 *
 * KiwiSDR WebSocket connections are unreachable from Replit containers (NXDOMAIN).
 * Sweeper accepts POSTed IQ data from external tools, uploaded CSV scans,
 * or manual amplitude entries. Zero synthetic/mock data ever generated.
 */

import { db } from "./db";
import { spectrumSweeps, spectrumBins, directionBearings, omegaCorrelatorReadings, omegaCorrelatorEvents } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

// ── GOS Constants ─────────────────────────────────────────────────────────────
export const KAPPA_1 = 4 / Math.PI;          // 1.27324 — Helicity Lock
export const KAPPA_2 = Math.pow((1 + Math.sqrt(5)) / 2, 3 / 4); // 1.43460 — Europa Resonance
export const CALIBRATION_SCALAR = 10 * Math.sqrt(13); // Klein twist correction
export const SCHUMANN_CARRIER = 8.392;        // Hz — AK7 planetary carrier
export const KLEIN_TWIST_ANGLE = 128.23;      // degrees — empirical Rigetti measurement
export const SPEED_OF_LIGHT = 299792458;      // m/s

// ── 24-Spoke AK7 Domain Map ───────────────────────────────────────────────────
export const AK7_DOMAINS = [
  { spoke: 1,  key: "drone_acoustic",    label: "Drone Acoustic",       unit: "x-baseline", rune: "ᚠ" },
  { spoke: 2,  key: "rf_bearing",        label: "RF Bearing (TDOA)",    unit: "°",           rune: "ᚢ" },
  { spoke: 3,  key: "elf_24hz",          label: "ELF 24.2 Hz",          unit: "power",       rune: "ᚦ" },
  { spoke: 4,  key: "schumann",          label: "Schumann 7.83 Hz",     unit: "power",       rune: "ᚨ" },
  { spoke: 5,  key: "seismic_usgs",      label: "Seismic (USGS)",       unit: "M",           rune: "ᚱ" },
  { spoke: 6,  key: "seismic_iris",      label: "Seismic (IRIS/FDSN)",  unit: "mB",          rune: "ᚲ" },
  { spoke: 7,  key: "solar_xray",        label: "Solar X-Ray Flux",     unit: "W/m²",        rune: "ᚷ" },
  { spoke: 8,  key: "solar_wind_bz",     label: "Solar Wind Bz",        unit: "nT",          rune: "ᚹ" },
  { spoke: 9,  key: "kp_index",          label: "Kp Geomagnetic",       unit: "0–9",         rune: "ᚺ" },
  { spoke: 10, key: "tle_overhead",      label: "TLE Satellite Pass",   unit: "elevation°",  rune: "ᚾ" },
  { spoke: 11, key: "lightning_wwlln",   label: "Lightning (WWLLN)",    unit: "strikes/hr",  rune: "ᚻ" },
  { spoke: 12, key: "network_anomaly",   label: "Network Anomaly",      unit: "score",       rune: "ᛇ" },
  { spoke: 13, key: "ble_rssi",          label: "BLE/RF Local Scan",    unit: "dBm",         rune: "ᛈ" },
  { spoke: 14, key: "drone_bearing",     label: "Drone Bearing Est.",   unit: "°",           rune: "ᛉ" },
  { spoke: 15, key: "geodetic_jitter",   label: "Geodetic GPS Jitter",  unit: "mm",          rune: "ᛊ" },
  { spoke: 16, key: "ionospheric_tec",   label: "Ionospheric TEC",      unit: "TECU",        rune: "ᛏ" },
  { spoke: 17, key: "weather_pressure",  label: "Atmo Pressure",        unit: "hPa",         rune: "ᛒ" },
  { spoke: 18, key: "blackjack_hf",      label: "BLACKJACK MANDRAKE HF",unit: "dB",          rune: "ᛖ" },
  { spoke: 19, key: "kiwisdr_priority",  label: "KiwiSDR Priority Scan",unit: "peak_amp",    rune: "ᛗ" },
  { spoke: 20, key: "elf_breaker_delta", label: "ELF Breaker Test Δ",   unit: "%",           rune: "ᛚ" },
  { spoke: 21, key: "ultrasonic",        label: "Ultrasonic 18–22 kHz", unit: "x-baseline",  rune: "ᛝ" },
  { spoke: 22, key: "kappa_score",       label: "KAPPA Score",          unit: "0–100",       rune: "ᛟ" },
  { spoke: 23, key: "seismic_geonet",    label: "Seismic (GeoNet NZ)",  unit: "M",           rune: "ᛞ" },
  { spoke: 24, key: "geomag_dst",        label: "Dst Storm Index",      unit: "nT",          rune: "ᛥ" },
] as const;

// ── κ-Normalization ───────────────────────────────────────────────────────────
/**
 * Normalize a raw value to [0,1] using κ₁-scaling.
 * x_norm = clamp((x - min) / (range * κ₁), 0, 1)
 */
export function kappaNormalize(value: number, min: number, max: number): number {
  const range = (max - min) * KAPPA_1;
  if (range === 0) return 0;
  return Math.max(0, Math.min(1, (value - min) / range));
}

// ── Complex number helpers ────────────────────────────────────────────────────
interface Complex { re: number; im: number }

function complexMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function complexConjMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re + a.im * b.im, im: a.im * b.re - a.re * b.im };
}
function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}
function complexMag(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

// ── Spatial covariance matrix ─────────────────────────────────────────────────
function computeCovariance(snapshots: Complex[][]): Complex[][] {
  const K = snapshots.length;
  const L = snapshots[0]?.length ?? 1;
  const Rxx: Complex[][] = Array.from({ length: K }, () =>
    Array.from({ length: K }, () => ({ re: 0, im: 0 }))
  );
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < K; j++) {
      let sum: Complex = { re: 0, im: 0 };
      for (let l = 0; l < L; l++) {
        sum = complexAdd(sum, complexConjMul(snapshots[i][l], snapshots[j][l]));
      }
      Rxx[i][j] = { re: sum.re / L, im: sum.im / L };
    }
  }
  return Rxx;
}

// ── Steering vector for Uniform Circular Array ────────────────────────────────
function steeringVector(thetaDeg: number, K: number, radiusM: number, freqHz: number): Complex[] {
  const lambda = SPEED_OF_LIGHT / freqHz;
  const zeta = (2 * Math.PI * radiusM) / lambda;
  return Array.from({ length: K }, (_, k) => {
    const gamma_k = (2 * Math.PI * k) / K;
    const phase = zeta * Math.cos((thetaDeg * Math.PI) / 180 - gamma_k);
    return { re: Math.cos(phase), im: Math.sin(phase) };
  });
}

// ── Power-iteration dominant eigenvector ─────────────────────────────────────
function dominantEigenvector(Rxx: Complex[][], K: number, iterations = 100): Complex[] {
  let b: Complex[] = Array.from({ length: K }, (_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }));
  for (let iter = 0; iter < iterations; iter++) {
    const nb: Complex[] = Array.from({ length: K }, () => ({ re: 0, im: 0 }));
    let norm = 0;
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        nb[i] = complexAdd(nb[i], complexMul(Rxx[i][j], b[j]));
      }
      norm += nb[i].re * nb[i].re + nb[i].im * nb[i].im;
    }
    norm = Math.sqrt(norm) || 1;
    b = nb.map(v => ({ re: v.re / norm, im: v.im / norm }));
  }
  return b;
}

// ── MUSIC pseudospectrum ───────────────────────────────────────────────────────
export function computeMUSIC(
  iqSnapshots: Complex[][], // [antenna][sample]
  freqHz: number,
  arrayRadiusM: number,
  resolutionDeg = 1
): { pseudoSpectrum: number[]; peakBearing: number; confidence: number } {
  const K = iqSnapshots.length;
  if (K < 2) return { pseudoSpectrum: [], peakBearing: 0, confidence: 0 };

  const Rxx = computeCovariance(iqSnapshots);
  const signalSubspace = dominantEigenvector(Rxx, K);

  // Noise projection: P_n = I - e * e^H
  const P_n: Complex[][] = Array.from({ length: K }, (_, i) =>
    Array.from({ length: K }, (_, j) => {
      const outer = complexConjMul(signalSubspace[i], signalSubspace[j]);
      return { re: (i === j ? 1 : 0) - outer.re, im: -outer.im };
    })
  );

  const steps = Math.round(360 / resolutionDeg);
  const pseudoSpectrum: number[] = [];
  let maxPeak = -Infinity;
  let peakBearing = 0;

  for (let deg = 0; deg < steps; deg++) {
    const theta = deg * resolutionDeg;
    const sv = steeringVector(theta, K, arrayRadiusM, freqHz);

    let denom = 0;
    for (let i = 0; i < K; i++) {
      let tempRe = 0, tempIm = 0;
      for (let j = 0; j < K; j++) {
        tempRe += P_n[i][j].re * sv[j].re - P_n[i][j].im * sv[j].im;
        tempIm += P_n[i][j].re * sv[j].im + P_n[i][j].im * sv[j].re;
      }
      denom += sv[i].re * tempRe + sv[i].im * tempIm;
    }
    const peak = 1.0 / Math.max(Math.abs(denom), 1e-12);
    pseudoSpectrum.push(peak);
    if (peak > maxPeak) { maxPeak = peak; peakBearing = theta; }
  }

  // Apply κ-calibration scalar (Klein twist correction)
  const correctedBearing = (peakBearing * CALIBRATION_SCALAR) % 360;

  // Confidence: ratio of peak to mean of spectrum
  const mean = pseudoSpectrum.reduce((a, b) => a + b, 0) / pseudoSpectrum.length;
  const confidence = Math.min(1, maxPeak / (mean * 10));

  return { pseudoSpectrum, peakBearing: correctedBearing, confidence };
}

// ── FFT (Cooley-Tukey) ────────────────────────────────────────────────────────
export function fft(signal: Complex[]): Complex[] {
  const N = signal.length;
  if (N <= 1) return signal;
  if (N & (N - 1)) {
    // DFT fallback for non-power-of-2
    return Array.from({ length: N }, (_, k) => {
      let sum: Complex = { re: 0, im: 0 };
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        sum = complexAdd(sum, complexMul(signal[n], { re: Math.cos(angle), im: Math.sin(angle) }));
      }
      return sum;
    });
  }
  const even = fft(signal.filter((_, i) => i % 2 === 0));
  const odd = fft(signal.filter((_, i) => i % 2 !== 0));
  return Array.from({ length: N }, (_, k) => {
    const angle = -2 * Math.PI * k / N;
    const twiddle: Complex = { re: Math.cos(angle), im: Math.sin(angle) };
    const t = complexMul(twiddle, odd[k % (N / 2)]);
    return k < N / 2
      ? complexAdd(even[k], t)
      : { re: even[k - N / 2].re - t.re, im: even[k - N / 2].im - t.im };
  });
}

// ── Amplitude → dBm ──────────────────────────────────────────────────────────
export function amplitudeToDbm(amplitude: number, impedance = 50): number {
  const powerW = (amplitude * amplitude) / impedance;
  return 10 * Math.log10(powerW / 0.001);
}

// ── Process uploaded CSV spectrum data ────────────────────────────────────────
export function parseSpectrumCsv(csv: string): Array<{ frequency: number; amplitude: number }> {
  const lines = csv.trim().split("\n").slice(1); // skip header
  const bins: Array<{ frequency: number; amplitude: number }> = [];
  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const frequency = parseFloat(parts[0]);
    const amplitude = parseFloat(parts[1]);
    if (!isNaN(frequency) && !isNaN(amplitude)) {
      bins.push({ frequency, amplitude });
    }
  }
  return bins;
}

// ── Database operations ───────────────────────────────────────────────────────
export const sweeper = {
  async createSweep(config: Record<string, unknown>, label?: string): Promise<string> {
    const [sweep] = await db.insert(spectrumSweeps).values({
      config, label: label ?? null, status: "active",
    }).returning({ id: spectrumSweeps.id });
    return sweep.id;
  },

  async stopSweep(sweepId: string): Promise<void> {
    await db.update(spectrumSweeps)
      .set({ endTime: new Date(), status: "stopped" })
      .where(eq(spectrumSweeps.id, sweepId));
  },

  async insertBins(sweepId: string, bins: Array<{ frequency: number; amplitude: number; nodeId?: string }>): Promise<void> {
    if (!bins.length) return;
    await db.insert(spectrumBins).values(
      bins.map(b => ({ sweepId, frequency: b.frequency, amplitude: b.amplitude, nodeId: b.nodeId ?? null }))
    );
  },

  async insertBearing(sweepId: string, bearing: {
    frequency: number; bearing: number; confidence: number;
    method: string; pseudoSpectrum?: number[];
  }): Promise<void> {
    await db.insert(directionBearings).values({
      sweepId,
      frequency: bearing.frequency,
      bearing: bearing.bearing,
      confidence: bearing.confidence,
      method: bearing.method,
      pseudoSpectrum: bearing.pseudoSpectrum ?? null,
    });
  },

  async getLatestBins(limit = 500): Promise<typeof spectrumBins.$inferSelect[]> {
    return db.select().from(spectrumBins)
      .orderBy(desc(spectrumBins.timestamp))
      .limit(limit);
  },

  async getLatestBearings(limit = 50): Promise<typeof directionBearings.$inferSelect[]> {
    return db.select().from(directionBearings)
      .orderBy(desc(directionBearings.timestamp))
      .limit(limit);
  },

  async getSweeps(limit = 20): Promise<typeof spectrumSweeps.$inferSelect[]> {
    return db.select().from(spectrumSweeps)
      .orderBy(desc(spectrumSweeps.startTime))
      .limit(limit);
  },

  async getBinsForSweep(sweepId: string): Promise<typeof spectrumBins.$inferSelect[]> {
    return db.select().from(spectrumBins)
      .where(eq(spectrumBins.sweepId, sweepId))
      .orderBy(spectrumBins.frequency);
  },

  async getBearingsForSweep(sweepId: string): Promise<typeof directionBearings.$inferSelect[]> {
    return db.select().from(directionBearings)
      .where(eq(directionBearings.sweepId, sweepId))
      .orderBy(desc(directionBearings.timestamp));
  },
};

// ── Ω-Correlator domain ingestion ─────────────────────────────────────────────
const DOMAIN_RANGES: Record<string, { min: number; max: number }> = {
  drone_acoustic:    { min: 0,    max: 7000 },
  rf_bearing:        { min: 0,    max: 360  },
  elf_24hz:          { min: 0,    max: 3000 },
  schumann:          { min: 0,    max: 100  },
  seismic_usgs:      { min: 0,    max: 9    },
  seismic_iris:      { min: 0,    max: 8    },
  solar_xray:        { min: 1e-9, max: 1e-3 },
  solar_wind_bz:     { min: -50,  max: 50   },
  kp_index:          { min: 0,    max: 9    },
  tle_overhead:      { min: 0,    max: 90   },
  lightning_wwlln:   { min: 0,    max: 1000 },
  network_anomaly:   { min: 0,    max: 100  },
  ble_rssi:          { min: -120, max: -30  },
  drone_bearing:     { min: 0,    max: 360  },
  geodetic_jitter:   { min: 0,    max: 50   },
  ionospheric_tec:   { min: 0,    max: 100  },
  weather_pressure:  { min: 950,  max: 1050 },
  blackjack_hf:      { min: -120, max: 0    },
  kiwisdr_priority:  { min: 0,    max: 100  },
  elf_breaker_delta: { min: 0,    max: 100  },
  ultrasonic:        { min: 0,    max: 500  },
  kappa_score:       { min: 0,    max: 100  },
  seismic_geonet:    { min: 0,    max: 8    },
  geomag_dst:        { min: -500, max: 50   },
};

export const omegaCorrelator = {
  async ingestReading(domain: string, rawValue: number, unit?: string, source?: string, metadata?: Record<string, unknown>): Promise<void> {
    const spoke = AK7_DOMAINS.find(d => d.key === domain)?.spoke ?? 0;
    if (!spoke) return;
    const range = DOMAIN_RANGES[domain] ?? { min: 0, max: 1 };
    const normalizedValue = kappaNormalize(rawValue, range.min, range.max);
    await db.insert(omegaCorrelatorReadings).values({
      domain, spoke, rawValue, normalizedValue,
      unit: unit ?? null, source: source ?? null, metadata: metadata ?? null,
    });
  },

  async getRecentReadings(sinceMs = 300_000): Promise<typeof omegaCorrelatorReadings.$inferSelect[]> {
    const since = new Date(Date.now() - sinceMs);
    return db.select().from(omegaCorrelatorReadings)
      .where(gte(omegaCorrelatorReadings.timestamp, since))
      .orderBy(desc(omegaCorrelatorReadings.timestamp))
      .limit(500);
  },

  async getLatestPerDomain(): Promise<Record<string, { value: number; normalized: number; ts: string }>> {
    const rows = await db.select().from(omegaCorrelatorReadings)
      .orderBy(desc(omegaCorrelatorReadings.timestamp))
      .limit(200);
    const latest: Record<string, { value: number; normalized: number; ts: string }> = {};
    for (const r of rows) {
      if (!latest[r.domain]) {
        latest[r.domain] = { value: r.rawValue, normalized: r.normalizedValue, ts: r.timestamp.toISOString() };
      }
    }
    return latest;
  },

  async checkCorrelationEvent(threshold = 3): Promise<void> {
    const recent = await this.getLatestPerDomain();
    const spiking = Object.entries(recent)
      .filter(([, v]) => v.normalized > 0.65)
      .map(([domain]) => AK7_DOMAINS.find(d => d.key === domain)?.spoke ?? 0)
      .filter(Boolean);

    if (spiking.length >= threshold) {
      await db.insert(omegaCorrelatorEvents).values({
        spokesActive: spiking,
        domainCount: spiking.length,
        kappaScore: null,
        description: `${spiking.length} domains above 65% activation simultaneously`,
        severity: spiking.length >= 5 ? "critical" : spiking.length >= 3 ? "warning" : "info",
      });
    }
  },

  async getRecentEvents(limit = 20): Promise<typeof omegaCorrelatorEvents.$inferSelect[]> {
    return db.select().from(omegaCorrelatorEvents)
      .orderBy(desc(omegaCorrelatorEvents.timestamp))
      .limit(limit);
  },
};
