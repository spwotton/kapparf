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
  type: string;
  biometricValue: number;
  rfValue: number;
  correlation: number;
  description: string;
  lag_ms: number;
}

interface SensorWindow {
  readings: PhoneSensorReading[];
  anomalies: number;
  lastReading: number;
}

interface KymaWindow {
  readings: KymaReading[];
  baselineHRV: number | null;
  baselineHR: number | null;
  hrvDeviations: number;
  stressSpikes: number;
}

const MAX_SENSOR_WINDOW = 300;
const MAX_KYMA_WINDOW = 200;
const MAX_CORRELATIONS = 100;
const CORRELATION_WINDOW_MS = 120_000;
const MAG_ANOMALY_THRESHOLD = 15;
const HRV_DEVIATION_THRESHOLD = 0.25;

class BiometricCorrelator {
  private sensors: Record<string, SensorWindow> = {};
  private kyma: KymaWindow = {
    readings: [],
    baselineHRV: null,
    baselineHR: null,
    hrvDeviations: 0,
    stressSpikes: 0,
  };
  private correlations: BiometricRFCorrelation[] = [];
  private phonesConnected = new Map<string, { lastSeen: number; os: string; capabilities: string[] }>();

  ingestSensor(reading: PhoneSensorReading) {
    const key = reading.sensorType;
    if (!this.sensors[key]) {
      this.sensors[key] = { readings: [], anomalies: 0, lastReading: 0 };
    }
    const win = this.sensors[key];
    win.readings.push(reading);
    win.lastReading = reading.timestamp;
    if (win.readings.length > MAX_SENSOR_WINDOW) win.readings.shift();

    if (key === "magnetometer") {
      this.checkMagneticAnomaly(reading);
    }

    if (key === "accelerometer") {
      this.checkVibrationPattern(reading);
    }
  }

  ingestKyma(reading: KymaReading) {
    this.kyma.readings.push(reading);
    if (this.kyma.readings.length > MAX_KYMA_WINDOW) this.kyma.readings.shift();

    if (reading.hrv !== undefined) {
      if (this.kyma.baselineHRV === null) {
        this.kyma.baselineHRV = reading.hrv;
      } else {
        this.kyma.baselineHRV = this.kyma.baselineHRV * 0.95 + reading.hrv * 0.05;
        const deviation = Math.abs(reading.hrv - this.kyma.baselineHRV) / this.kyma.baselineHRV;
        if (deviation > HRV_DEVIATION_THRESHOLD) {
          this.kyma.hrvDeviations++;
          this.checkHRVRFCorrelation(reading);
        }
      }
    }

    if (reading.heartRate !== undefined) {
      if (this.kyma.baselineHR === null) {
        this.kyma.baselineHR = reading.heartRate;
      } else {
        this.kyma.baselineHR = this.kyma.baselineHR * 0.95 + reading.heartRate * 0.05;
      }
    }

    if (reading.stress !== undefined && reading.stress > 70) {
      this.kyma.stressSpikes++;
      this.checkStressRFCorrelation(reading);
    }
  }

  registerPhone(phoneId: string, os: string, capabilities: string[]) {
    this.phonesConnected.set(phoneId, {
      lastSeen: Date.now(),
      os,
      capabilities,
    });
  }

  private checkMagneticAnomaly(reading: PhoneSensorReading) {
    const mag = Math.sqrt((reading.x || 0) ** 2 + (reading.y || 0) ** 2 + (reading.z || 0) ** 2);
    const win = this.sensors["magnetometer"];
    if (win.readings.length < 10) return;

    const recent = win.readings.slice(-20);
    const avgMag = recent.reduce((s, r) => s + Math.sqrt((r.x || 0) ** 2 + (r.y || 0) ** 2 + (r.z || 0) ** 2), 0) / recent.length;
    const deviation = Math.abs(mag - avgMag);

    if (deviation > MAG_ANOMALY_THRESHOLD) {
      win.anomalies++;

      const kappaStatus = kappaEngine.getStatus();
      const recentAlerts = kappaStatus.recentAlerts.filter(
        (a) => Date.now() - a.timestamp < CORRELATION_WINDOW_MS
      );

      if (recentAlerts.length > 0) {
        const bestAlert = recentAlerts[0];
        const lagMs = Math.abs(reading.timestamp - bestAlert.timestamp);
        this.addCorrelation({
          timestamp: Date.now(),
          type: "magnetic-rf",
          biometricValue: deviation,
          rfValue: bestAlert.score,
          correlation: Math.min(1, deviation / MAG_ANOMALY_THRESHOLD) * Math.min(1, bestAlert.score / 50),
          description: `Magnetic anomaly (Δ${deviation.toFixed(1)} µT) coincides with ${bestAlert.type} (lag: ${lagMs}ms)`,
          lag_ms: lagMs,
        });
      }
    }
  }

  private checkVibrationPattern(reading: PhoneSensorReading) {
    const accel = Math.sqrt((reading.x || 0) ** 2 + (reading.y || 0) ** 2 + (reading.z || 0) ** 2);
    if (Math.abs(accel - 9.81) < 0.3) return;

    const win = this.sensors["accelerometer"];
    if (win.readings.length < 5) return;

    const recent5 = win.readings.slice(-5);
    const intervals = [];
    for (let i = 1; i < recent5.length; i++) {
      intervals.push(recent5[i].timestamp - recent5[i - 1].timestamp);
    }

    if (intervals.length >= 3) {
      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      const freqHz = 1000 / avgInterval;

      if (Math.abs(freqHz - K.TARGET_FREQ_1) < 5 || Math.abs(freqHz - K.DELTA_SLIP_HZ) < 2) {
        win.anomalies++;
        this.addCorrelation({
          timestamp: Date.now(),
          type: "vibration-harmonic",
          biometricValue: freqHz,
          rfValue: K.TARGET_FREQ_1,
          correlation: 1 - Math.abs(freqHz - K.TARGET_FREQ_1) / 10,
          description: `Vibration frequency ${freqHz.toFixed(1)} Hz near PRF ${K.TARGET_FREQ_1} Hz harmonic`,
          lag_ms: 0,
        });
      }
    }
  }

  private checkHRVRFCorrelation(reading: KymaReading) {
    const kappaStatus = kappaEngine.getStatus();
    const recentAlerts = kappaStatus.recentAlerts.filter(
      (a) => Date.now() - a.timestamp < CORRELATION_WINDOW_MS
    );

    if (recentAlerts.length > 0) {
      const bestAlert = recentAlerts[0];
      const deviation = this.kyma.baselineHRV
        ? Math.abs(reading.hrv! - this.kyma.baselineHRV) / this.kyma.baselineHRV
        : 0;
      const lagMs = Math.abs(reading.timestamp - bestAlert.timestamp);

      this.addCorrelation({
        timestamp: Date.now(),
        type: "hrv-rf",
        biometricValue: reading.hrv!,
        rfValue: bestAlert.score,
        correlation: Math.min(1, deviation * 2) * Math.min(1, bestAlert.score / 40),
        description: `HRV deviation (${(deviation * 100).toFixed(0)}% from baseline ${this.kyma.baselineHRV?.toFixed(0)}ms) during ${bestAlert.type} event`,
        lag_ms: lagMs,
      });
    }
  }

  private checkStressRFCorrelation(reading: KymaReading) {
    const kappaStatus = kappaEngine.getStatus();
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

  private addCorrelation(corr: BiometricRFCorrelation) {
    this.correlations.unshift(corr);
    if (this.correlations.length > MAX_CORRELATIONS) this.correlations.pop();

    if (corr.correlation > 0.5) {
      kappaEngine.ingestBiometricAlert(corr);
    }
  }

  getStatus() {
    const sensorStatus: Record<string, { count: number; anomalies: number; lastReading: number }> = {};
    for (const [key, win] of Object.entries(this.sensors)) {
      sensorStatus[key] = {
        count: win.readings.length,
        anomalies: win.anomalies,
        lastReading: win.lastReading,
      };
    }

    return {
      sensors: sensorStatus,
      kyma: {
        readingCount: this.kyma.readings.length,
        baselineHRV: this.kyma.baselineHRV,
        baselineHR: this.kyma.baselineHR,
        hrvDeviations: this.kyma.hrvDeviations,
        stressSpikes: this.kyma.stressSpikes,
        lastReading: this.kyma.readings.length > 0 ? this.kyma.readings[this.kyma.readings.length - 1] : null,
      },
      correlations: this.correlations.slice(0, 20),
      correlationCount: this.correlations.length,
      phonesConnected: Array.from(this.phonesConnected.entries()).map(([id, info]) => ({
        id,
        ...info,
      })),
    };
  }

  getCorrelations() {
    return this.correlations;
  }

  getLatestKyma() {
    return this.kyma.readings.length > 0 ? this.kyma.readings[this.kyma.readings.length - 1] : null;
  }

  getKymaTimeline(limit = 50) {
    return this.kyma.readings.slice(-limit);
  }
}

export const biometricCorrelator = new BiometricCorrelator();
