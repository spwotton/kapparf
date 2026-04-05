import { kappaEngine } from "./kappa-engine";
import { KAPPA_CONSTANTS } from "@shared/schema";

const K = KAPPA_CONSTANTS;

export interface PhoneSensorReading {
  timestamp: number;
  sensorType: "magnetometer" | "accelerometer" | "gyroscope" | "barometer" | "light" | "proximity";
  x?: number;
  y?: number;
  z?: number;
  value?: number;
  accuracy?: number;
  source: string;
}

export interface KymaReading {
  timestamp: number;
  hrv?: number;
  heartRate?: number;
  stress?: number;
  mood?: number;
  coherence?: number;
  breathRate?: number;
  skinTemp?: number;
  source: string;
  sessionId?: string;
}

export interface BiometricRFCorrelation {
  timestamp: number;
  type: "magnetic-rf" | "vibration-harmonic" | "hrv-rf" | "stress-rf";
  biometricValue: number;
  rfValue: number;
  correlation: number;
  description: string;
  lag_ms: number;
}

const CONFIG = {
  MAX_SENSOR_WINDOW: 300,
  MAX_KYMA_WINDOW: 200,
  MAX_CORRELATIONS: 100,
  CORRELATION_WINDOW_MS: 120_000,
  MAG_ANOMALY_THRESHOLD: 15,
  HRV_DEVIATION_THRESHOLD: 0.25,
  BASELINE_EMA_ALPHA: 0.05,
  VIBRATION_FREQ_TOLERANCE: 5,
  MAG_AVG_WINDOW_SIZE: 20,
  PHONE_CLEANUP_AGE_MS: 300_000,
};

function magnitude(x = 0, y = 0, z = 0): number {
  return Math.hypot(x, y, z);
}

class SensorWindowManager {
  private readings: PhoneSensorReading[] = [];
  private capacity: number;
  public anomalies: number = 0;
  public lastReading: number = 0;

  constructor(capacity: number = CONFIG.MAX_SENSOR_WINDOW) {
    this.capacity = capacity;
  }

  push(reading: PhoneSensorReading): void {
    if (this.readings.length >= this.capacity) {
      this.readings.shift();
    }
    this.readings.push(reading);
    this.lastReading = reading.timestamp;
  }

  getReadings(): readonly PhoneSensorReading[] {
    return this.readings;
  }

  getRecent(n: number): PhoneSensorReading[] {
    return this.readings.slice(-n);
  }

  get size(): number {
    return this.readings.length;
  }
}

class KymaWindowManager {
  private readings: KymaReading[] = [];
  private capacity: number;
  public baselineHRV: number | null = null;
  public baselineHR: number | null = null;
  public hrvDeviations: number = 0;
  public stressSpikes: number = 0;

  constructor(capacity: number = CONFIG.MAX_KYMA_WINDOW) {
    this.capacity = capacity;
  }

  push(reading: KymaReading): void {
    if (this.readings.length >= this.capacity) {
      this.readings.shift();
    }
    this.readings.push(reading);
  }

  getReadings(): readonly KymaReading[] {
    return this.readings;
  }

  getLatest(): KymaReading | null {
    return this.readings.length > 0 ? this.readings[this.readings.length - 1] : null;
  }

  getTimeline(limit: number): KymaReading[] {
    return this.readings.slice(-limit);
  }

  get size(): number {
    return this.readings.length;
  }

  updateBaselineHRV(newHRV: number): number {
    if (this.baselineHRV === null) {
      this.baselineHRV = newHRV;
    } else {
      this.baselineHRV = this.baselineHRV * (1 - CONFIG.BASELINE_EMA_ALPHA) + newHRV * CONFIG.BASELINE_EMA_ALPHA;
    }
    return this.baselineHRV;
  }

  updateBaselineHR(newHR: number): number {
    if (this.baselineHR === null) {
      this.baselineHR = newHR;
    } else {
      this.baselineHR = this.baselineHR * (1 - CONFIG.BASELINE_EMA_ALPHA) + newHR * CONFIG.BASELINE_EMA_ALPHA;
    }
    return this.baselineHR;
  }

  computeHRVDeviation(hrv: number): number {
    if (this.baselineHRV === null) return 0;
    return Math.abs(hrv - this.baselineHRV) / this.baselineHRV;
  }
}

class BiometricCorrelator {
  private sensors: Map<string, SensorWindowManager> = new Map();
  private kymaWindow: KymaWindowManager = new KymaWindowManager();
  private correlations: BiometricRFCorrelation[] = [];
  private phonesConnected: Map<string, { lastSeen: number; os: string; capabilities: string[] }> = new Map();

  ingestSensor(reading: PhoneSensorReading): void {
    const key = reading.sensorType;
    let win = this.sensors.get(key);
    if (!win) {
      win = new SensorWindowManager();
      this.sensors.set(key, win);
    }
    win.push(reading);

    switch (key) {
      case "magnetometer":
        this.checkMagneticAnomaly(reading, win);
        break;
      case "accelerometer":
        this.checkVibrationPattern(reading, win);
        break;
      default:
        break;
    }
  }

  ingestKyma(reading: KymaReading): void {
    this.kymaWindow.push(reading);

    if (reading.hrv !== undefined) {
      this.kymaWindow.updateBaselineHRV(reading.hrv);
      const deviation = this.kymaWindow.computeHRVDeviation(reading.hrv);
      if (deviation > CONFIG.HRV_DEVIATION_THRESHOLD) {
        this.kymaWindow.hrvDeviations++;
        this.checkHRVRFCorrelation(reading, deviation);
      }
    }

    if (reading.heartRate !== undefined) {
      this.kymaWindow.updateBaselineHR(reading.heartRate);
    }

    if (reading.stress !== undefined && reading.stress > 70) {
      this.kymaWindow.stressSpikes++;
      this.checkStressRFCorrelation(reading);
    }
  }

  registerPhone(phoneId: string, os: string, capabilities: string[]): void {
    this.phonesConnected.set(phoneId, {
      lastSeen: Date.now(),
      os,
      capabilities,
    });
    this.cleanupStalePhones();
  }

  private cleanupStalePhones(): void {
    const now = Date.now();
    for (const [id, info] of this.phonesConnected.entries()) {
      if (now - info.lastSeen > CONFIG.PHONE_CLEANUP_AGE_MS) {
        this.phonesConnected.delete(id);
      }
    }
  }

  private getRecentAlerts(): Array<{ timestamp: number; score: number; type: string }> {
    try {
      const kappaStatus = kappaEngine.getStatus();
      return kappaStatus.recentAlerts.filter(
        (a: any) => Date.now() - a.timestamp < CONFIG.CORRELATION_WINDOW_MS
      );
    } catch (err) {
      console.error("[BiometricCorrelator] Failed to get kappaEngine status:", err);
      return [];
    }
  }

  private checkMagneticAnomaly(reading: PhoneSensorReading, win: SensorWindowManager): void {
    const currentMag = magnitude(reading.x, reading.y, reading.z);
    if (win.size < CONFIG.MAG_AVG_WINDOW_SIZE) return;

    const recent = win.getRecent(CONFIG.MAG_AVG_WINDOW_SIZE);
    let sumMag = 0;
    for (const r of recent) {
      sumMag += magnitude(r.x, r.y, r.z);
    }
    const avgMag = sumMag / recent.length;
    const deviation = Math.abs(currentMag - avgMag);

    if (deviation > CONFIG.MAG_ANOMALY_THRESHOLD) {
      win.anomalies++;

      const recentAlerts = this.getRecentAlerts();
      if (recentAlerts.length > 0) {
        const bestAlert = recentAlerts[0];
        const lagMs = Math.abs(reading.timestamp - bestAlert.timestamp);
        const correlation =
          Math.min(1, deviation / CONFIG.MAG_ANOMALY_THRESHOLD) *
          Math.min(1, bestAlert.score / 50);

        this.addCorrelation({
          timestamp: Date.now(),
          type: "magnetic-rf",
          biometricValue: deviation,
          rfValue: bestAlert.score,
          correlation,
          description: `Magnetic anomaly (Δ${deviation.toFixed(1)} µT) coincides with ${bestAlert.type} (lag: ${lagMs}ms)`,
          lag_ms: lagMs,
        });
      }
    }
  }

  private checkVibrationPattern(reading: PhoneSensorReading, win: SensorWindowManager): void {
    const accelMag = magnitude(reading.x, reading.y, reading.z);
    if (Math.abs(accelMag - 9.81) < 0.3) return;

    if (win.size < 5) return;

    const recent5 = win.getRecent(5);
    const intervals: number[] = [];
    for (let i = 1; i < recent5.length; i++) {
      intervals.push(recent5[i].timestamp - recent5[i - 1].timestamp);
    }

    if (intervals.length >= 3) {
      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      if (avgInterval <= 0) return;
      const freqHz = 1000 / avgInterval;

      const targetFreq = K?.TARGET_FREQ_1;
      const deltaSlip = K?.DELTA_SLIP_HZ;

      if (targetFreq !== undefined && Math.abs(freqHz - targetFreq) < CONFIG.VIBRATION_FREQ_TOLERANCE) {
        win.anomalies++;
        const correlation = Math.max(0, Math.min(1, 1 - Math.abs(freqHz - targetFreq) / 10));
        this.addCorrelation({
          timestamp: Date.now(),
          type: "vibration-harmonic",
          biometricValue: freqHz,
          rfValue: targetFreq,
          correlation,
          description: `Vibration frequency ${freqHz.toFixed(1)} Hz near PRF ${targetFreq} Hz harmonic`,
          lag_ms: 0,
        });
      } else if (deltaSlip !== undefined && Math.abs(freqHz - deltaSlip) < CONFIG.VIBRATION_FREQ_TOLERANCE) {
        win.anomalies++;
        const correlation = Math.max(0, Math.min(1, 1 - Math.abs(freqHz - deltaSlip) / 10));
        this.addCorrelation({
          timestamp: Date.now(),
          type: "vibration-harmonic",
          biometricValue: freqHz,
          rfValue: deltaSlip,
          correlation,
          description: `Vibration frequency ${freqHz.toFixed(1)} Hz near delta-slip ${deltaSlip} Hz`,
          lag_ms: 0,
        });
      }
    }
  }

  private checkHRVRFCorrelation(reading: KymaReading, deviation: number): void {
    const recentAlerts = this.getRecentAlerts();
    if (recentAlerts.length > 0) {
      const bestAlert = recentAlerts[0];
      const lagMs = Math.abs(reading.timestamp - bestAlert.timestamp);

      this.addCorrelation({
        timestamp: Date.now(),
        type: "hrv-rf",
        biometricValue: reading.hrv!,
        rfValue: bestAlert.score,
        correlation: Math.min(1, deviation * 2) * Math.min(1, bestAlert.score / 40),
        description: `HRV deviation (${(deviation * 100).toFixed(0)}% from baseline ${this.kymaWindow.baselineHRV?.toFixed(0)}ms) during ${bestAlert.type} event`,
        lag_ms: lagMs,
      });
    }
  }

  private checkStressRFCorrelation(reading: KymaReading): void {
    let kappaStatus: any;
    try {
      kappaStatus = kappaEngine.getStatus();
    } catch {
      return;
    }
    if (kappaStatus.score < 20) return;

    this.addCorrelation({
      timestamp: Date.now(),
      type: "stress-rf",
      biometricValue: reading.stress!,
      rfValue: kappaStatus.score,
      correlation: (reading.stress! / 100) * (kappaStatus.score / 100),
      description: `Stress spike (${reading.stress}) during elevated κ-score (${kappaStatus.score.toFixed(1)}) — threat level: ${kappaStatus.threatLevel}`,
      lag_ms: 0,
    });
  }

  private addCorrelation(corr: BiometricRFCorrelation): void {
    this.correlations.unshift(corr);
    if (this.correlations.length > CONFIG.MAX_CORRELATIONS) this.correlations.pop();

    if (corr.correlation > 0.5) {
      try {
        kappaEngine.ingestBiometricAlert(corr);
      } catch (err) {
        console.error("[BiometricCorrelator] Failed to forward alert to kappaEngine:", err);
      }
    }
  }

  getStatus() {
    const sensorStatus: Record<string, { count: number; anomalies: number; lastReading: number }> = {};
    for (const [key, win] of this.sensors.entries()) {
      sensorStatus[key] = {
        count: win.size,
        anomalies: win.anomalies,
        lastReading: win.lastReading,
      };
    }

    return {
      sensors: sensorStatus,
      kyma: {
        readingCount: this.kymaWindow.size,
        baselineHRV: this.kymaWindow.baselineHRV,
        baselineHR: this.kymaWindow.baselineHR,
        hrvDeviations: this.kymaWindow.hrvDeviations,
        stressSpikes: this.kymaWindow.stressSpikes,
        lastReading: this.kymaWindow.getLatest(),
      },
      correlations: this.correlations.slice(0, 20),
      correlationCount: this.correlations.length,
      phonesConnected: Array.from(this.phonesConnected.entries()).map(([id, info]) => ({
        id,
        ...info,
      })),
    };
  }

  getCorrelations(): BiometricRFCorrelation[] {
    return [...this.correlations];
  }

  getLatestKyma(): KymaReading | null {
    return this.kymaWindow.getLatest();
  }

  getKymaTimeline(limit = 50): KymaReading[] {
    return this.kymaWindow.getTimeline(limit);
  }
}

export const biometricCorrelator = new BiometricCorrelator();
