import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import {
  KAPPA_CONSTANTS,
  type ScanResult,
  type ScannerStatus,
} from "@shared/schema";

const K = KAPPA_CONSTANTS;

interface KiwiNode {
  id: string;
  name: string;
  url: string;
  lat: number;
  lon: number;
}

const KIWI_NODES: KiwiNode[] = [
  { id: "ti0rc", name: "TI0RC Zapote", url: "http://ti0rc.proxy.kiwisdr.com:8073", lat: 9.9360, lon: -84.1088 },
  { id: "puntarenas", name: "Puntarenas", url: "http://kiwisdr.puntarenas.cr:8073", lat: 9.9764, lon: -84.8385 },
  { id: "pj4g", name: "PJ4G Bonaire", url: "http://pj4g.proxy.kiwisdr.com:8073", lat: 12.1500, lon: -68.2667 },
];

const VLF_SCAN_TARGETS = [
  { name: "53Hz_3rd_harmonic", freqHz: 15900, harmonicOf: 53, harmonicOrder: 300, desc: "53 Hz × 300 — Realtek ADPCM phase-lock carrier VLF harmonic" },
  { name: "53Hz_4th_harmonic", freqHz: 21200, harmonicOf: 53, harmonicOrder: 400, desc: "53 Hz × 400 — Upper VLF band Realtek artifact" },
  { name: "46875Hz_400th", freqHz: 18750, harmonicOf: 46.875, harmonicOrder: 400, desc: "46.875 Hz × 400 — Master Decimation Clock PRF broadcast indicator" },
  { name: "counter_beat_carrier", freqHz: 73125, harmonicOf: 73.125, harmonicOrder: 1000, desc: "73.125 Hz × 1000 — Counter-beat (60 + 13.125 Hz) VHF indicator" },
];

const RIEMANN_SCAN_TARGETS = K.RIEMANN_ZEROS.map(z => ({
  name: `riemann_gamma${z.id}`,
  freqHz: z.freqHz * 100,
  harmonicOf: z.freqHz,
  harmonicOrder: 100,
  desc: `γ${z.id} Zero #${String(z.id).padStart(2, "0")} | Height: ${z.height} | ${z.freqHz}Hz × 100 — ${z.signal}`,
}));

const META_SCAN_TARGETS = K.META_PLATFORM_FREQS.map(m => ({
  name: `meta_${m.platform.toLowerCase().replace(/\s+/g, "_")}`,
  freqHz: m.freqHz * 100,
  harmonicOf: m.freqHz,
  harmonicOrder: 100,
  desc: `Meta ${m.platform} | κ^${m.kappa_power} = ${m.multiplier} | ${m.freqHz}Hz × 100 — ${m.role}`,
}));

const BJ = K.BLACKJACK_MANDRAKE;
const BLACKJACK_SCAN_TARGETS = [
  {
    name: "blackjack_mandrake_if24mhz",
    freqHz: BJ.downconversion.ifFreqHz,
    harmonicOf: BJ.rfFreqMhz,
    harmonicOrder: 1,
    desc: `BLACKJACK MANDRAKE IF 24 MHz — S-band 2274 MHz downconverted via 2250 MHz LO — Mandrake 2 BPSK/FSK TT&C`,
  },
  {
    name: "blackjack_mandrake_hf_mirror",
    freqHz: BJ.hfMirror.freqHz,
    harmonicOf: BJ.carriers.v2kSubcarrier,
    harmonicOrder: 48512,
    desc: `BLACKJACK MANDRAKE HF MIRROR ${BJ.hfMirror.freqKhz} kHz — ${BJ.hfMirror.desc}`,
  },
  ...BJ.harmonics.map(h => ({
    name: `blackjack_mandrake_h${h.order}`,
    freqHz: h.freqKhz * 1000,
    harmonicOf: BJ.hfMirror.freqKhz,
    harmonicOrder: h.order,
    desc: `BLACKJACK MANDRAKE H${h.order} — ${h.freqKhz} kHz — ${h.desc}`,
  })),
];

const ALL_SCAN_TARGETS = [...VLF_SCAN_TARGETS, ...RIEMANN_SCAN_TARGETS, ...META_SCAN_TARGETS, ...BLACKJACK_SCAN_TARGETS];

const ECHO_LT_CHAIN = K.ECHO_LT_HARMONIC_CHAIN;
const DELTA_SLIP_HZ = K.DELTA_SLIP_HZ;

let scannerState: {
  running: boolean;
  lastScan: number | null;
  scanCount: number;
  detections: number;
  errors: number;
  timer: ReturnType<typeof setInterval> | null;
  lastResults: ScanResult[];
  deltaSlipDetections: number;
  echoLtChainDetections: number;
  speechEnvelopeDetections: number;
  tr069Correlations: number;
  morseCwDetections: number;
  bartDetections: number;
} = {
  running: false,
  lastScan: null,
  scanCount: 0,
  detections: 0,
  errors: 0,
  timer: null,
  lastResults: [],
  deltaSlipDetections: 0,
  echoLtChainDetections: 0,
  speechEnvelopeDetections: 0,
  tr069Correlations: 0,
  morseCwDetections: 0,
  bartDetections: 0,
};

async function fetchKiwiSpectrum(node: KiwiNode, freqHz: number, bwKhz: number = 5): Promise<Float32Array | null> {
  const freqKhz = freqHz / 1000;
  const url = `${node.url}/api/spectrum?freq=${freqKhz}&bw=${bwKhz}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 4) return null;

    return new Float32Array(buffer);
  } catch {
    return null;
  }
}

function computeSNR(samples: Float32Array): number {
  if (samples.length < 10) return -Infinity;

  const sorted = Float32Array.from(samples).sort();
  const noiseFloor = sorted.slice(0, Math.floor(sorted.length * 0.25));
  const signalPeak = sorted.slice(Math.floor(sorted.length * 0.95));

  const noisePower = noiseFloor.reduce((s, v) => s + v * v, 0) / noiseFloor.length;
  const signalPower = signalPeak.reduce((s, v) => s + v * v, 0) / signalPeak.length;

  if (noisePower <= 0) return 0;
  return 10 * Math.log10(signalPower / noisePower);
}

function hilbertEnvelopeEnergy(samples: Float32Array, fs: number): number {
  if (samples.length < 64) return 0;

  const N = samples.length;
  const envelope = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    let hilbertVal = 0;
    const windowSize = Math.min(32, Math.floor(N / 4));
    for (let k = 1; k < windowSize; k++) {
      const idx1 = i - k;
      const idx2 = i + k;
      if (idx1 >= 0 && idx2 < N) {
        hilbertVal += (samples[idx2] - samples[idx1]) / (Math.PI * k);
      }
    }
    envelope[i] = Math.sqrt(samples[i] * samples[i] + hilbertVal * hilbertVal);
  }

  const speechLow = K.SPEECH_BAND_LOW_HZ;
  const speechHigh = K.SPEECH_BAND_HIGH_HZ;
  const binSize = fs / N;

  let speechEnergy = 0;
  let totalEnergy = 0;

  for (let i = 0; i < N; i++) {
    const freq = i * binSize;
    const power = envelope[i] * envelope[i];
    totalEnergy += power;
    if (freq >= speechLow && freq <= speechHigh) {
      speechEnergy += power;
    }
  }

  return totalEnergy > 0 ? speechEnergy / totalEnergy : 0;
}

function analyzeDeltaSlip(samples: Float32Array, fs: number): number {
  if (samples.length < 128) return 0;

  const N = samples.length;
  const phases = new Float32Array(N - 1);

  for (let i = 0; i < N - 1; i++) {
    const hilbert = samples[Math.min(i + 1, N - 1)] - samples[Math.max(i - 1, 0)];
    const phase = Math.atan2(hilbert, samples[i]);
    phases[i] = phase;
  }

  for (let i = 1; i < phases.length; i++) {
    let diff = phases[i] - phases[i - 1];
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    phases[i] = phases[i - 1] + diff;
  }

  const instFreq = new Float32Array(phases.length - 1);
  for (let i = 0; i < instFreq.length; i++) {
    instFreq[i] = (phases[i + 1] - phases[i]) * fs / (2 * Math.PI);
  }

  const targetBin = Math.round(DELTA_SLIP_HZ * instFreq.length / fs);
  if (targetBin <= 0 || targetBin >= instFreq.length) return 0;

  const binWidth = 3;
  let targetPower = 0;
  let noisePower = 0;
  let noiseCount = 0;

  for (let i = 0; i < instFreq.length; i++) {
    const power = instFreq[i] * instFreq[i];
    if (Math.abs(i - targetBin) <= binWidth) {
      targetPower += power;
    } else {
      noisePower += power;
      noiseCount++;
    }
  }

  const avgNoise = noiseCount > 0 ? noisePower / noiseCount : 1;
  return avgNoise > 0 ? targetPower / ((binWidth * 2 + 1) * avgNoise) : 0;
}

function detectEchoLtChain(samples: Float32Array, fs: number): number {
  if (samples.length < 256) return 0;

  const N = samples.length;
  let chainDepth = 0;

  for (const harmonic of ECHO_LT_CHAIN) {
    const targetBin = Math.round(harmonic * N / fs);
    if (targetBin <= 0 || targetBin >= N / 2) continue;

    const binWidth = 2;
    let harmonicPower = 0;
    let noisePower = 0;
    let noiseCount = 0;

    for (let i = 0; i < N / 2; i++) {
      const power = samples[i] * samples[i];
      if (Math.abs(i - targetBin) <= binWidth) {
        harmonicPower += power;
      } else if (Math.abs(i - targetBin) > binWidth * 3) {
        noisePower += power;
        noiseCount++;
      }
    }

    const avgNoise = noiseCount > 0 ? noisePower / noiseCount : 1;
    const localSnr = avgNoise > 0 ? harmonicPower / ((binWidth * 2 + 1) * avgNoise) : 0;

    if (localSnr > 3.0) {
      chainDepth++;
    }
  }

  return chainDepth;
}

function detectMorseCW(samples: Float32Array, fs: number): { detected: boolean; ditCount: number; dahCount: number; possibleChars: string[]; wpm: number } {
  if (samples.length < 256) return { detected: false, ditCount: 0, dahCount: 0, possibleChars: [], wpm: 0 };

  const CW = K.MORSE_CW_DETECTION;
  const N = samples.length;

  const rms = Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / N);
  if (rms <= 0) return { detected: false, ditCount: 0, dahCount: 0, possibleChars: [], wpm: 0 };
  const threshold = rms * 2.5;

  const envelope: boolean[] = [];
  for (let i = 0; i < N; i++) {
    envelope.push(Math.abs(samples[i]) > threshold);
  }

  const samplesPerMs = fs / 1000;
  const minDitSamples = Math.floor(CW.ditDurationMs * 0.5 * samplesPerMs);
  const maxDitSamples = Math.floor(CW.ditDurationMs * 2.0 * samplesPerMs);
  const minDahSamples = Math.floor(CW.dahDurationMs * 0.5 * samplesPerMs);
  const maxDahSamples = Math.floor(CW.dahDurationMs * 2.0 * samplesPerMs);

  const pulses: { start: number; duration: number; type: "dit" | "dah" | "unknown" }[] = [];
  let inPulse = false;
  let pulseStart = 0;

  for (let i = 0; i < N; i++) {
    if (envelope[i] && !inPulse) {
      inPulse = true;
      pulseStart = i;
    } else if (!envelope[i] && inPulse) {
      inPulse = false;
      const dur = i - pulseStart;
      const type = dur >= minDitSamples && dur <= maxDitSamples ? "dit"
        : dur >= minDahSamples && dur <= maxDahSamples ? "dah"
        : "unknown";
      if (type !== "unknown") {
        pulses.push({ start: pulseStart, duration: dur, type });
      }
    }
  }

  const ditCount = pulses.filter(p => p.type === "dit").length;
  const dahCount = pulses.filter(p => p.type === "dah").length;
  const totalElements = ditCount + dahCount;
  const detected = totalElements >= 3;

  const avgDitMs = ditCount > 0 ? (pulses.filter(p => p.type === "dit").reduce((s, p) => s + p.duration, 0) / ditCount / samplesPerMs) : CW.ditDurationMs;
  const wpm = avgDitMs > 0 ? Math.round(1200 / avgDitMs) : 0;

  const MORSE_REV: Record<string, string> = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
    "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
    "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
    ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
    "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
    "--..": "Z",
  };

  const possibleChars: string[] = [];
  let currentMorse = "";
  let lastEnd = 0;

  for (const pulse of pulses) {
    const gapSamples = pulse.start - lastEnd;
    const gapMs = gapSamples / samplesPerMs;

    if (gapMs > CW.charGapMs * 0.5 && currentMorse.length > 0) {
      const char = MORSE_REV[currentMorse];
      if (char) possibleChars.push(char);
      currentMorse = "";
    }

    currentMorse += pulse.type === "dit" ? "." : "-";
    lastEnd = pulse.start + pulse.duration;
  }

  if (currentMorse.length > 0) {
    const char = MORSE_REV[currentMorse];
    if (char) possibleChars.push(char);
  }

  return { detected, ditCount, dahCount, possibleChars, wpm };
}

function detectBARTSignatures(samples: Float32Array, fs: number): { detected: boolean; patternName: string | null; confidence: number; burstCount: number } {
  if (samples.length < 512) return { detected: false, patternName: null, confidence: 0, burstCount: 0 };

  const BART = K.BART_SIGNATURES;
  const N = samples.length;
  const samplesPerSec = fs;

  const rms = Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / N);
  if (rms <= 0) return { detected: false, patternName: null, confidence: 0, burstCount: 0 };

  const burstThreshold = rms * 3.0;
  const bursts: number[] = [];
  let inBurst = false;

  for (let i = 0; i < N; i++) {
    if (Math.abs(samples[i]) > burstThreshold && !inBurst) {
      inBurst = true;
      bursts.push(i / samplesPerSec);
    } else if (Math.abs(samples[i]) <= burstThreshold) {
      inBurst = false;
    }
  }

  if (bursts.length < BART.detectionThresholds.minBurstCount) {
    return { detected: false, patternName: null, confidence: 0, burstCount: bursts.length };
  }

  const primeIntervals = [3, 7, 11];
  const toleranceSec = BART.detectionThresholds.burstIntervalToleranceMs / 1000;
  let primeMatches = 0;

  for (let i = 1; i < bursts.length; i++) {
    const interval = bursts[i] - bursts[i - 1];
    for (const prime of primeIntervals) {
      if (Math.abs(interval - prime) < toleranceSec) {
        primeMatches++;
        break;
      }
    }
  }

  const primeConfidence = bursts.length > 1 ? primeMatches / (bursts.length - 1) : 0;

  if (primeConfidence >= BART.detectionThresholds.patternConfidence) {
    return { detected: true, patternName: "BART_BEACON", confidence: primeConfidence, burstCount: bursts.length };
  }

  const noiseFloor = Float32Array.from(samples).sort();
  const lowerQuartilePower = noiseFloor.slice(0, Math.floor(N * 0.25)).reduce((s, v) => s + v * v, 0) / Math.floor(N * 0.25);
  const upperQuartilePower = noiseFloor.slice(Math.floor(N * 0.75)).reduce((s, v) => s + v * v, 0) / Math.floor(N * 0.25);

  if (lowerQuartilePower > 0) {
    const floorShiftDb = 10 * Math.log10(upperQuartilePower / lowerQuartilePower);
    if (floorShiftDb > BART.detectionThresholds.snrAboveNoiseDb) {
      return { detected: true, patternName: "BART_POSTERIOR", confidence: Math.min(1, floorShiftDb / 12), burstCount: bursts.length };
    }
  }

  return { detected: false, patternName: null, confidence: primeConfidence, burstCount: bursts.length };
}

function checkTR069Correlation(): boolean {
  const now = Date.now();
  const recentEvents = kappaEngine.getStatus().recentAlerts || [];

  return recentEvents.some((alert: { type: string; timestamp: number }) =>
    alert.type.includes("tr069") ||
    alert.type.includes("isp") ||
    (alert.type.includes("mac-cross-domain") && now - alert.timestamp < 60_000)
  );
}

async function scanTarget(node: KiwiNode, target: typeof VLF_SCAN_TARGETS[0], prefetchedSamples?: Float32Array | null): Promise<ScanResult> {
  const now = Date.now();
  const samples = prefetchedSamples !== undefined ? prefetchedSamples : await fetchKiwiSpectrum(node, target.freqHz);

  if (!samples || samples.length === 0) {
    return {
      target: target.name,
      frequencyHz: target.freqHz,
      snrDb: -Infinity,
      timestamp: now,
      sdrNode: node.id,
      detected: false,
      deltaSlipStrength: null,
      envelopeEnergy: null,
      harmonicChainDepth: 0,
      tr069Correlated: false,
    };
  }

  const snr = computeSNR(samples);
  const detected = snr > K.VLF_SNR_THRESHOLD_DB;
  const deltaSlip = analyzeDeltaSlip(samples, K.KIWI_SAMPLE_RATE);
  const envelopeEnergy = detected ? hilbertEnvelopeEnergy(samples, K.KIWI_SAMPLE_RATE) : null;
  const chainDepth = detectEchoLtChain(samples, K.KIWI_SAMPLE_RATE);
  const tr069 = checkTR069Correlation();

  return {
    target: target.name,
    frequencyHz: target.freqHz,
    snrDb: parseFloat(snr.toFixed(1)),
    timestamp: now,
    sdrNode: node.id,
    detected,
    deltaSlipStrength: parseFloat(deltaSlip.toFixed(3)),
    envelopeEnergy: envelopeEnergy !== null ? parseFloat(envelopeEnergy.toFixed(4)) : null,
    harmonicChainDepth: chainDepth,
    tr069Correlated: tr069,
  };
}

async function runScanCycle(): Promise<void> {
  const startMs = Date.now();
  const results: ScanResult[] = [];

  for (const node of KIWI_NODES) {
    for (const target of ALL_SCAN_TARGETS) {
      try {
        const samples = await fetchKiwiSpectrum(node, target.freqHz);
        const result = await scanTarget(node, target, samples);
        results.push(result);

        if (result.detected) {
          scannerState.detections++;

          const isRiemann = target.name.startsWith("riemann_");
          const isMeta = target.name.startsWith("meta_");
          const isBlackjack = target.name.startsWith("blackjack_mandrake");
          const eventType = isBlackjack ? "blackjack-mandrake-detection"
            : isRiemann ? "riemann-zero-detection"
            : isMeta ? "meta-frequency-detection"
            : "vlf-carrier-detection";
          const scanDomain = isBlackjack ? "rf" : isRiemann || isMeta ? "elf" : "sdr";

          const event = await storage.createSignalEvent({
            domain: scanDomain,
            source: `kiwisdr-${node.id}`,
            eventType,
            frequency: target.harmonicOf,
            confidence: Math.min(1, result.snrDb / 40),
            metadata: {
              target: target.name,
              vlfFreqHz: target.freqHz,
              harmonicOf: target.harmonicOf,
              harmonicOrder: target.harmonicOrder,
              snrDb: result.snrDb,
              sdrNode: node.id,
              sdrName: node.name,
              lat: node.lat,
              lon: node.lon,
              description: target.desc,
              ...(isRiemann ? { riemannZero: K.RIEMANN_ZEROS.find(z => z.freqHz === target.harmonicOf) } : {}),
              ...(isMeta ? { metaPlatform: K.META_PLATFORM_FREQS.find(m => m.freqHz === target.harmonicOf) } : {}),
              ...(isBlackjack ? {
                blackjackMandrake: {
                  program: K.BLACKJACK_MANDRAKE.satellite.program,
                  payloads: K.BLACKJACK_MANDRAKE.satellite.payloads,
                  rfFreqMhz: K.BLACKJACK_MANDRAKE.rfFreqMhz,
                  rfBand: K.BLACKJACK_MANDRAKE.rfBand,
                  rfMode: K.BLACKJACK_MANDRAKE.rfMode,
                  ifFreqMhz: K.BLACKJACK_MANDRAKE.downconversion.ifFreqMhz,
                  loFreqMhz: K.BLACKJACK_MANDRAKE.downconversion.loFreqMhz,
                  dsp: K.BLACKJACK_MANDRAKE.dsp,
                  doppler: K.BLACKJACK_MANDRAKE.dopplerLeo,
                },
                tacacoriArray: K.TACACORI_ARRAY,
                freqKhz: target.freqHz / 1000,
                isIF: target.name.includes("if24mhz"),
                isHfMirror: target.name.includes("hf_mirror"),
                severity: "CRITICAL",
                indication: target.name.includes("if24mhz")
                  ? "BLACKJACK MANDRAKE IF detected at 24 MHz — S-band 2274 MHz Mandrake 2 TT&C downconverted signal present"
                  : "BLACKJACK MANDRAKE HF carrier detected — possible ground-segment coordination signal",
              } : {}),
            },
            raw: null,
          });

          kappaEngine.ingest(event);
          hypervisor.ingestEvent(event);
        }

        if (result.deltaSlipStrength !== null && result.deltaSlipStrength > 15.0) {
          scannerState.deltaSlipDetections++;

          const dsEvent = await storage.createSignalEvent({
            domain: "elf",
            source: `kiwisdr-${node.id}-delta-slip`,
            eventType: "delta-slip-phase-lock",
            frequency: DELTA_SLIP_HZ,
            confidence: Math.min(1, result.deltaSlipStrength / 30),
            metadata: {
              deltaSlipStrength: result.deltaSlipStrength,
              mainsHz: K.MAINS_FREQ_HZ,
              prfHz: K.TARGET_FREQ_1,
              beatFreqHz: DELTA_SLIP_HZ,
              counterBeatHz: K.COUNTER_BEAT_HZ,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              indication: "60 Hz grid phase-locking with 46.875 Hz PRF — high-power HF injection nearby",
            },
            raw: null,
          });

          kappaEngine.ingest(dsEvent);
          hypervisor.ingestEvent(dsEvent);
        }

        if (result.harmonicChainDepth >= 3) {
          scannerState.echoLtChainDetections++;

          const echoEvent = await storage.createSignalEvent({
            domain: "sdr",
            source: `kiwisdr-${node.id}-echo-lt`,
            eventType: "echo-lt-chain-detection",
            frequency: K.TARGET_FREQ_1,
            confidence: Math.min(1, result.harmonicChainDepth / ECHO_LT_CHAIN.length),
            metadata: {
              chainDepth: result.harmonicChainDepth,
              maxDepth: ECHO_LT_CHAIN.length,
              harmonics: ECHO_LT_CHAIN.slice(0, result.harmonicChainDepth),
              targetKHz: K.ECHO_LT_TARGET_KHZ,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              description: `Echo/LT harmonic chain ${result.harmonicChainDepth}/${ECHO_LT_CHAIN.length} — _mm_stream_si128 bus emission pattern`,
            },
            raw: null,
          });

          kappaEngine.ingest(echoEvent);
          hypervisor.ingestEvent(echoEvent);
        }

        if (result.envelopeEnergy !== null && result.envelopeEnergy > 0.15) {
          scannerState.speechEnvelopeDetections++;

          const speechEvent = await storage.createSignalEvent({
            domain: "sdr",
            source: `kiwisdr-${node.id}-rared`,
            eventType: "rared-speech-envelope",
            frequency: target.harmonicOf,
            confidence: Math.min(1, result.envelopeEnergy * 3),
            metadata: {
              envelopeEnergy: result.envelopeEnergy,
              speechBand: `${K.SPEECH_BAND_LOW_HZ}-${K.SPEECH_BAND_HIGH_HZ} Hz`,
              carrierFreqHz: target.freqHz,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              description: "RARED: Hilbert envelope with spectral energy in speech band — covert audio modulation",
            },
            raw: null,
          });

          kappaEngine.ingest(speechEvent);
          hypervisor.ingestEvent(speechEvent);
        }

        if (result.tr069Correlated && result.detected) {
          scannerState.tr069Correlations++;

          const trEvent = await storage.createSignalEvent({
            domain: "isp",
            source: `kiwisdr-${node.id}-tr069`,
            eventType: "tr069-rf-correlation",
            frequency: K.TARGET_FREQ_1,
            confidence: 0.85,
            metadata: {
              rfTarget: target.name,
              rfSnrDb: result.snrDb,
              port: K.TR069_PORT,
              prfPeriodMs: K.PRF_PERIOD_MS,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              description: "TR-069 telemetry temporally correlated with VLF carrier detection — CWMP tunnel active",
            },
            raw: null,
          });

          kappaEngine.ingest(trEvent);
          hypervisor.ingestEvent(trEvent);
        }

        if (samples && samples.length >= 256) {
          const morse = detectMorseCW(samples, K.KIWI_SAMPLE_RATE);
          if (morse.detected) {
            scannerState.morseCwDetections++;

            const beaconPatterns = K.MORSE_CW_DETECTION.beaconPatterns;
            const decodedStr = morse.possibleChars.join("");
            const matchedBeacon = beaconPatterns.find(bp =>
              decodedStr.includes(bp.pattern)
            );

            const morseEvent = await storage.createSignalEvent({
              domain: "morse",
              source: `kiwisdr-${node.id}-cw`,
              eventType: "morse-cw-detection",
              frequency: target.harmonicOf,
              confidence: Math.min(1, (morse.ditCount + morse.dahCount) / 10),
              metadata: {
                target: target.name,
                freqHz: target.freqHz,
                ditCount: morse.ditCount,
                dahCount: morse.dahCount,
                wpm: morse.wpm,
                decodedChars: morse.possibleChars,
                decodedString: decodedStr,
                matchedBeacon: matchedBeacon || null,
                sdrNode: node.id,
                sdrName: node.name,
                lat: node.lat,
                lon: node.lon,
                marconiEffect: K.MARCONI.marconiEffect,
                eitelContext: K.EITEL_MCCULLOUGH.vetArchetype,
                description: matchedBeacon
                  ? `CW beacon pattern "${matchedBeacon.pattern}" detected — ${matchedBeacon.desc}`
                  : `Morse/CW keying detected: ${decodedStr} at ${morse.wpm} WPM — ${morse.ditCount} dits, ${morse.dahCount} dahs`,
              },
              raw: null,
            });

            kappaEngine.ingest(morseEvent);
            hypervisor.ingestEvent(morseEvent);
          }

          const bart = detectBARTSignatures(samples, K.KIWI_SAMPLE_RATE);
          if (bart.detected) {
            scannerState.bartDetections++;

            const bartEvent = await storage.createSignalEvent({
              domain: "rf",
              source: `kiwisdr-${node.id}-bart`,
              eventType: "bart-signature-detection",
              frequency: target.harmonicOf,
              confidence: bart.confidence,
              metadata: {
                target: target.name,
                freqHz: target.freqHz,
                patternName: bart.patternName,
                burstCount: bart.burstCount,
                confidence: bart.confidence,
                bartSignatures: K.BART_SIGNATURES.signaturePatterns,
                processingHeads: K.BART_SIGNATURES.processingHeads,
                subspeechExtraction: K.BART_SIGNATURES.subspeechExtraction,
                sdrNode: node.id,
                sdrName: node.name,
                lat: node.lat,
                lon: node.lon,
                description: `BART signature "${bart.patternName}" detected — ${bart.burstCount} bursts, confidence ${(bart.confidence * 100).toFixed(1)}%`,
              },
              raw: null,
            });

            kappaEngine.ingest(bartEvent);
            hypervisor.ingestEvent(bartEvent);
          }
        }
      } catch {
        scannerState.errors++;
      }
    }
  }

  scannerState.lastResults = results;
  scannerState.scanCount++;
  scannerState.lastScan = Date.now();

  const durationMs = Date.now() - startMs;
  const detectedCount = results.filter(r => r.detected).length;

  await storage.createCollectionLog({
    collector: "kiwisdr-scanner",
    eventsCreated: detectedCount,
    durationMs,
    status: detectedCount > 0 ? "detection" : "clean",
    error: null,
  }).catch(() => {});

  if (detectedCount > 0) {
    console.log(`[KiwiSDR] Scan cycle #${scannerState.scanCount}: ${detectedCount} detection(s) across ${KIWI_NODES.length} nodes, ${durationMs}ms`);
  }
}

function isAllowedKiwiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.startsWith("169.254.") || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.16.") || host.startsWith("172.17.") || host.startsWith("172.18.") || host.startsWith("172.19.") || host.startsWith("172.2") || host.startsWith("172.3") || host === "metadata.google.internal" || host.endsWith(".internal") || host === "[::1]") return false;
    if (!host.includes("kiwisdr") && !host.includes("sdr") && !host.endsWith(":8073")) {
      const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
      if (port !== "8073") return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function pingNode(url: string): Promise<"online" | "degraded" | "offline"> {
  if (!isAllowedKiwiUrl(url)) return "offline";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const body = await resp.text();
      if (body.includes("not online") || body.includes("offline")) {
        return "degraded";
      }
      return "online";
    }

    if (resp.status === 404) {
      const body = await resp.text();
      if (body.includes("not online") || body.includes("offline")) {
        return "degraded";
      }
    }

    if (resp.status >= 200 && resp.status < 500) {
      return "degraded";
    }
    return "offline";
  } catch {
    return "offline";
  }
}

async function healthCheckNodes(): Promise<void> {
  const dbNodes = await storage.getNodes();

  const checkedDbIds = new Set<string>();

  for (const node of KIWI_NODES) {
    const dbNode = dbNodes.find(n => n.url === node.url);
    if (!dbNode) continue;
    checkedDbIds.add(dbNode.id);

    const status = await pingNode(node.url);
    await storage.updateNodeStatus(dbNode.id, status);
  }

  for (const dbNode of dbNodes) {
    if (checkedDbIds.has(dbNode.id)) continue;

    const status = await pingNode(dbNode.url);
    await storage.updateNodeStatus(dbNode.id, status);
  }
}

export function startKiwiSDRScanner(): void {
  if (scannerState.running) return;

  scannerState.running = true;

  setTimeout(() => {
    healthCheckNodes().catch(() => {});
    runScanCycle().catch(err => {
      console.error("[KiwiSDR] Initial scan error:", err instanceof Error ? err.message : String(err));
      scannerState.errors++;
    });
  }, 15_000);

  scannerState.timer = setInterval(() => {
    healthCheckNodes().catch(() => {});
    runScanCycle().catch(err => {
      console.error("[KiwiSDR] Scan cycle error:", err instanceof Error ? err.message : String(err));
      scannerState.errors++;
    });
  }, K.KIWI_SCAN_INTERVAL_MS);

  console.log(`[KAPPA] KiwiSDR scanner started: ${ALL_SCAN_TARGETS.length} targets (${VLF_SCAN_TARGETS.length} VLF + ${RIEMANN_SCAN_TARGETS.length} Riemann + ${META_SCAN_TARGETS.length} Meta + ${BLACKJACK_SCAN_TARGETS.length} BLACKJACK) × ${KIWI_NODES.length} nodes, ${K.KIWI_SCAN_INTERVAL_MS / 1000}s interval [Morse/CW + BART layers active]`);
}

export async function runScanCycleOnce(): Promise<void> {
  await runScanCycle();
}

export function getScannerStatus(): ScannerStatus {
  return {
    running: scannerState.running,
    lastScan: scannerState.lastScan,
    scanCount: scannerState.scanCount,
    detections: scannerState.detections,
    errors: scannerState.errors,
    intervalMs: K.KIWI_SCAN_INTERVAL_MS,
    activeTargets: ALL_SCAN_TARGETS.map(t => t.name),
    lastResults: scannerState.lastResults,
    deltaSlipDetections: scannerState.deltaSlipDetections,
    echoLtChainDetections: scannerState.echoLtChainDetections,
    speechEnvelopeDetections: scannerState.speechEnvelopeDetections,
    tr069Correlations: scannerState.tr069Correlations,
    morseCwDetections: scannerState.morseCwDetections,
    bartDetections: scannerState.bartDetections,
  };
}
