import {
  KAPPA_CONSTANTS,
  THREAT_LEVELS,
  type ThreatLevel,
  type DeviceFingerprint,
  type EveningWindow,
  type KappaStatus,
  type SignalEvent,
} from "@shared/schema";

interface WindowEvent {
  id: string;
  domain: string;
  source: string;
  eventType: string;
  frequency: number | null;
  confidence: number;
  metadata: Record<string, unknown> | null;
  timestamp: number;
  mac?: string;
  imsi?: string;
  towerId?: string;
}

interface Alert {
  type: string;
  timestamp: number;
  score: number;
  description: string;
}

const K = KAPPA_CONSTANTS;
const WINDOW_MAX_AGE_MS = 300_000;
const MAX_ALERTS = 50;

function extractMac(event: SignalEvent): string | null {
  const meta = event.metadata as Record<string, unknown> | null;
  if (meta?.mac && typeof meta.mac === "string") return meta.mac.toLowerCase();
  if (meta?.bssid && typeof meta.bssid === "string") return meta.bssid.toLowerCase();
  if (meta?.device_mac && typeof meta.device_mac === "string") return meta.device_mac.toLowerCase();
  return null;
}

function extractImsi(event: SignalEvent): string | null {
  const meta = event.metadata as Record<string, unknown> | null;
  if (meta?.imsi && typeof meta.imsi === "string") return meta.imsi;
  if (meta?.tmsi && typeof meta.tmsi === "string") return meta.tmsi;
  return null;
}

function extractTowerId(event: SignalEvent): string | null {
  const meta = event.metadata as Record<string, unknown> | null;
  if (meta?.tower_id && typeof meta.tower_id === "string") return meta.tower_id;
  if (meta?.cell_id && typeof meta.cell_id === "string") return meta.cell_id;
  return null;
}

function extractEntityId(event: SignalEvent): string | null {
  const meta = event.metadata as Record<string, unknown> | null;
  if (!meta) return null;

  if (meta.noradId) return `SAT-${meta.noradId}`;
  if (meta.nodeId && typeof meta.nodeId === "string") return `SDR-${meta.nodeId}`;
  if (meta.node && typeof meta.node === "string") return `SDR-${meta.node}`;
  if (meta.sdrNode && typeof meta.sdrNode === "string") return `SDR-${meta.sdrNode}`;
  if (meta.ip && typeof meta.ip === "string") return `NET-${meta.ip}`;
  if (meta.targetIp && typeof meta.targetIp === "string") return `NET-${meta.targetIp}`;
  if (meta.callsign && typeof meta.callsign === "string") return `ADS-${meta.callsign}`;
  if (meta.icao24 && typeof meta.icao24 === "string") return `ADS-${meta.icao24}`;
  if (meta.target && typeof meta.target === "string") return `TGT-${meta.target}`;
  if (meta.host && typeof meta.host === "string") return `NET-${meta.host}`;

  if (event.source && event.frequency) return `SIG-${event.source}-${Math.round(event.frequency)}`;
  if (event.source) return `SRC-${event.source}`;

  return null;
}

export class KappaEngine {
  private score = 0;
  private startTime = Date.now();
  private eventsProcessed = 0;
  private devices = new Map<string, DeviceFingerprint>();
  private domainWindows: Record<string, WindowEvent[]> = {};
  private correlationCounts: Record<string, number> = {};
  private cooldowns: Record<string, number> = {};
  private kleinPasses = 0;
  private congustoPartial = 0;
  private congustoFull = 0;
  private stingrayAlerts = 0;
  private phiHarmonics = 0;
  private satOverhead = 0;
  private satKlein = 0;
  private domainPairMatrix: Record<string, number> = {};
  private alerts: Alert[] = [];
  private decayTimer: ReturnType<typeof setInterval>;
  private lastEventTimestamps: Record<string, number> = {};

  constructor() {
    this.decayTimer = setInterval(() => this.decay(), K.SCORE_DECAY_INTERVAL_S * 1000);
  }

  private decay() {
    if (this.score > 0.01) {
      this.score *= K.SCORE_DECAY;
      if (this.score < 0.01) this.score = 0;
    }
    this.pruneWindows();
  }

  private pruneWindows() {
    const cutoff = Date.now() - WINDOW_MAX_AGE_MS;
    for (const domain of Object.keys(this.domainWindows)) {
      this.domainWindows[domain] = this.domainWindows[domain].filter(e => e.timestamp > cutoff);
    }
  }

  private canAlert(type: string): boolean {
    const last = this.cooldowns[type] ?? 0;
    return Date.now() - last > K.ALERT_COOLDOWN_S * 1000;
  }

  private addAlert(type: string, scoreAdd: number, description: string) {
    if (!this.canAlert(type)) return;
    this.cooldowns[type] = Date.now();
    this.score = Math.min(100, this.score + scoreAdd);
    this.correlationCounts[type] = (this.correlationCounts[type] ?? 0) + 1;
    const alert: Alert = { type, timestamp: Date.now(), score: scoreAdd, description };
    this.alerts.unshift(alert);
    if (this.alerts.length > MAX_ALERTS) this.alerts.pop();
  }

  private addDomainPair(d1: string, d2: string) {
    const key = [d1, d2].sort().join("↔");
    this.domainPairMatrix[key] = (this.domainPairMatrix[key] ?? 0) + 1;
  }

  ingest(event: SignalEvent) {
    this.eventsProcessed++;
    const now = Date.now();
    const ts = new Date(event.timestamp).getTime();
    const mac = extractMac(event);
    const imsi = extractImsi(event);
    const towerId = extractTowerId(event);

    const windowEvent: WindowEvent = {
      id: event.id,
      domain: event.domain,
      source: event.source,
      eventType: event.eventType,
      frequency: event.frequency,
      confidence: event.confidence,
      metadata: event.metadata as Record<string, unknown> | null,
      timestamp: ts,
      mac: mac ?? undefined,
      imsi: imsi ?? undefined,
      towerId: towerId ?? undefined,
    };

    if (!this.domainWindows[event.domain]) this.domainWindows[event.domain] = [];
    this.domainWindows[event.domain].push(windowEvent);

    if (mac) {
      this.trackDevice(mac, event.domain, event.eventType, ts);
    }

    const entityId = extractEntityId(event);
    if (entityId && !mac) {
      this.trackDevice(entityId, event.domain, event.eventType, ts);
    }

    this.checkMacCrossDomain(windowEvent);
    this.checkCongustoProtocol(windowEvent);
    this.checkStingrayPattern(windowEvent);
    this.checkPhiHarmonic(windowEvent);
    this.checkEveningSpike(windowEvent);
    this.checkImsiTowerHop(windowEvent);
    this.checkDeltaSlipCorrelation(windowEvent);
    this.checkEchoLtChain(windowEvent);
    this.checkVLFCarrierDetection(windowEvent);
    this.checkNetworkRFCorrelation(windowEvent);

    this.lastEventTimestamps[event.domain] = ts;
  }

  private trackDevice(mac: string, domain: string, eventType: string, ts: number) {
    const existing = this.devices.get(mac);
    if (existing) {
      existing.eventCount++;
      existing.lastSeen = ts;
      existing.lastEventType = eventType;
      existing.lastDomain = domain;
      if (!existing.domainsSeen.includes(domain)) {
        existing.domainsSeen.push(domain);
        existing.crossDomainCount = existing.domainsSeen.length;
        if (existing.crossDomainCount >= 2) {
          existing.suspicious = true;
        }
      }
    } else {
      this.devices.set(mac, {
        mac,
        domainsSeen: [domain],
        eventCount: 1,
        firstSeen: ts,
        lastSeen: ts,
        suspicious: false,
        crossDomainCount: 1,
        lastEventType: eventType,
        lastDomain: domain,
      });
    }
  }

  private checkMacCrossDomain(event: WindowEvent) {
    if (!event.mac) return;
    const windowS = K.MAC_CORRELATION_WINDOW_S;
    const cutoff = event.timestamp - windowS * 1000;

    for (const [domain, events] of Object.entries(this.domainWindows)) {
      if (domain === event.domain) continue;
      for (const prev of events) {
        if (prev.mac === event.mac && prev.timestamp > cutoff) {
          this.addDomainPair(event.domain, domain);
          this.addAlert(
            "mac-cross-domain",
            30,
            `MAC ${event.mac.substring(0, 8)}... seen in ${event.domain.toUpperCase()} + ${domain.toUpperCase()} within ${windowS}s`
          );
          return;
        }
      }
    }
  }

  private checkCongustoProtocol(event: WindowEvent) {
    if (event.domain !== "wifi") return;
    const freq = event.frequency;
    const meta = event.metadata as Record<string, unknown> | null;
    const iatPeak = meta?.iat_fft_peak as number | undefined;
    const isCongusto = (iatPeak && Math.abs(iatPeak - K.CONGUSTO_FREQ_HZ) < 1) ||
                       (freq && Math.abs(freq - K.CONGUSTO_FREQ_HZ) < 1);
    if (!isCongusto) return;

    const hasSatOverhead = this.satOverhead > 0;
    const bleWindow = this.domainWindows["ble"] ?? [];
    const cutoff = event.timestamp - 60_000;
    const hasBle = bleWindow.some(e => e.timestamp > cutoff);

    if (hasSatOverhead && hasBle) {
      this.congustoFull++;
      this.addAlert("congusto-full", 90, `Full Congusto: 46.875 Hz WiFi IAT + satellite overhead + BLE pairing burst`);
    } else if (hasSatOverhead || hasBle) {
      this.congustoPartial++;
      const partial = hasSatOverhead ? "satellite overhead" : "BLE activity";
      this.addAlert("congusto-partial", 40, `Partial Congusto: 46.875 Hz WiFi IAT + ${partial} (missing ${hasSatOverhead ? "BLE" : "satellite"})`);
    }
  }

  private checkStingrayPattern(event: WindowEvent) {
    if (event.domain !== "lte") return;
    const isPaging = event.eventType.toLowerCase().includes("paging") ||
                     event.eventType.toLowerCase().includes("attach");
    if (!isPaging) return;

    const windowMs = K.STINGRAY_CHAIN_WINDOW_S * 1000;
    const cutoff = event.timestamp - windowMs;

    const bleWindow = this.domainWindows["ble"] ?? [];
    const wifiWindow = this.domainWindows["wifi"] ?? [];

    const bleRecon = bleWindow.find(e =>
      e.timestamp > cutoff &&
      (e.eventType.toLowerCase().includes("scan") || e.eventType.toLowerCase().includes("recon"))
    );

    const wifiDeauth = wifiWindow.find(e =>
      e.timestamp > cutoff &&
      (e.eventType.toLowerCase().includes("deauth") || e.eventType.toLowerCase().includes("disassoc"))
    );

    if (bleRecon && wifiDeauth) {
      const t1 = bleRecon.timestamp;
      const t2 = wifiDeauth.timestamp;
      const t3 = event.timestamp;
      if (t1 <= t2 && t2 <= t3) {
        this.stingrayAlerts++;
        this.addDomainPair("ble", "wifi");
        this.addDomainPair("wifi", "lte");
        this.addDomainPair("ble", "lte");
        this.addAlert(
          "stingray-pattern",
          85,
          `Stingray/IMSI-catcher: BLE recon → WiFi deauth → LTE paging chain within ${K.STINGRAY_CHAIN_WINDOW_S}s`
        );
      }
    }
  }

  private checkPhiHarmonic(event: WindowEvent) {
    const lastTs = this.lastEventTimestamps[event.domain];
    if (!lastTs) return;

    const deltaS = (event.timestamp - lastTs) / 1000;
    const h1 = K.PHI_HARMONIC_1;
    const h2 = K.PHI_HARMONIC_2;
    const kappaS = K.KAPPA_SECOND;

    const isHarmonic =
      Math.abs(deltaS - kappaS) < 2 ||
      Math.abs(deltaS - h1) < 3 ||
      Math.abs(deltaS - h2) < 5 ||
      (deltaS > 10 && Math.abs(deltaS % kappaS) < 2);

    if (isHarmonic) {
      this.phiHarmonics++;
      this.addAlert(
        "phi-harmonic",
        25,
        `φ-harmonic: ${event.domain.toUpperCase()} events separated by ${deltaS.toFixed(1)}s (κ=${kappaS}s, φ₁=${h1.toFixed(1)}s)`
      );
    }
  }

  private checkEveningSpike(event: WindowEvent) {
    const ew = this.getEveningWindow();
    if (!ew.active) return;

    const domainEvents = this.domainWindows[event.domain] ?? [];
    const recentCount = domainEvents.filter(e => e.timestamp > Date.now() - 60_000).length;

    if (recentCount > 5) {
      this.addAlert(
        "evening-spike",
        15,
        `Evening window ${ew.window}: elevated ${event.domain.toUpperCase()} rate (${recentCount} events/min)`
      );
    }
  }

  private checkImsiTowerHop(event: WindowEvent) {
    if (event.domain !== "lte" || !event.imsi || !event.towerId) return;

    const windowMs = K.SURVEILLANCE_HANDOFF_WINDOW_S * 1000;
    const cutoff = event.timestamp - windowMs;
    const lteWindow = this.domainWindows["lte"] ?? [];

    for (const prev of lteWindow) {
      if (
        prev.imsi === event.imsi &&
        prev.towerId &&
        prev.towerId !== event.towerId &&
        prev.timestamp > cutoff
      ) {
        this.addDomainPair("lte", "satellite");
        this.addAlert(
          "imsi-tower-hop",
          45,
          `IMSI tower hop: ${event.imsi.substring(0, 6)}... moved ${prev.towerId} → ${event.towerId} within ${K.SURVEILLANCE_HANDOFF_WINDOW_S}s`
        );
        return;
      }
    }
  }

  private checkDeltaSlipCorrelation(event: WindowEvent) {
    if (event.domain !== "elf" && event.domain !== "sdr") return;
    if (!event.frequency) return;

    const isDeltaSlip = Math.abs(event.frequency - K.DELTA_SLIP_HZ) < 0.5;
    const isCounterBeat = Math.abs(event.frequency - K.COUNTER_BEAT_HZ) < 0.5;

    if (!isDeltaSlip && !isCounterBeat) return;

    const elfWindow = this.domainWindows["elf"] ?? [];
    const cutoff = event.timestamp - 60_000;
    const hasGrid = elfWindow.some(e =>
      e.timestamp > cutoff && e.frequency !== null && Math.abs(e.frequency - K.MAINS_FREQ_HZ) < 1
    );

    if (isDeltaSlip) {
      this.addDomainPair("sdr", "elf");
      this.addAlert(
        "delta-slip-detection",
        55,
        `Delta-Slip 13.125 Hz: ${K.MAINS_FREQ_HZ} Hz grid − ${K.TARGET_FREQ_1} Hz PRF phase-lock${hasGrid ? " (grid confirmed)" : ""}`
      );
    }

    if (isCounterBeat) {
      this.addAlert(
        "counter-beat-detection",
        35,
        `Counter-beat 73.125 Hz: ${K.MAINS_FREQ_HZ} Hz + ${K.DELTA_SLIP_HZ} Hz — bidirectional grid-PRF coupling`
      );
    }
  }

  private checkEchoLtChain(event: WindowEvent) {
    if (event.domain !== "sdr") return;
    const meta = event.metadata as Record<string, unknown> | null;
    const chainDepth = (meta?.chainDepth as number) ?? 0;

    if (chainDepth >= 3) {
      this.addDomainPair("sdr", "elf");
      this.addAlert(
        "echo-lt-chain",
        70,
        `Echo/LT chain: ${chainDepth}/${K.ECHO_LT_HARMONIC_CHAIN.length} harmonics (46.875→1500 Hz) — bus emission pattern`
      );
    }
  }

  private checkVLFCarrierDetection(event: WindowEvent) {
    if (event.eventType !== "vlf-carrier-detection") return;
    const meta = event.metadata as Record<string, unknown> | null;
    const snrDb = (meta?.snrDb as number) ?? 0;
    const target = (meta?.target as string) ?? "";

    if (snrDb > K.VLF_SNR_THRESHOLD_DB) {
      this.addAlert(
        "vlf-carrier",
        45,
        `VLF carrier: ${target} at ${snrDb.toFixed(1)} dB SNR via KiwiSDR ${meta?.sdrName || ""}`
      );
    }
  }

  private checkNetworkRFCorrelation(event: WindowEvent) {
    if (event.domain !== "isp") return;
    if (event.eventType !== "network-drop") return;

    const sdrWindow = this.domainWindows["sdr"] ?? [];
    const cutoff = event.timestamp - 30_000;
    const recentSDR = sdrWindow.filter(e => e.timestamp > cutoff);

    if (recentSDR.length > 0) {
      this.addDomainPair("isp", "sdr");
      this.addAlert(
        "network-rf-correlation",
        65,
        `Network drop coincides with ${recentSDR.length} SDR event(s) — possible TR-069 forced reset during RF activity`
      );
    }
  }

  updateSatelliteState(overhead: number, kleinCount: number) {
    this.satOverhead = overhead;
    const prevKlein = this.satKlein;
    this.satKlein = kleinCount;

    if (kleinCount > prevKlein) {
      this.kleinPasses += (kleinCount - prevKlein);
      this.addAlert(
        "klein-twist",
        60,
        `Klein twist azimuth: ${kleinCount} satellite(s) at ${K.KLEIN_TWIST_DEG}° ±${K.KLEIN_TOLERANCE_DEG}°`
      );
    }
  }

  getEveningWindow(): EveningWindow {
    const now = new Date();
    const utcH = now.getUTCHours();
    const utcM = now.getUTCMinutes();
    const localH = ((utcH + K.CR_UTC_OFFSET) % 24 + 24) % 24;
    const localTime = `${localH.toString().padStart(2, "0")}:${utcM.toString().padStart(2, "0")}`;

    if (localH >= K.EVENING_WINDOW_1_START && localH < K.EVENING_WINDOW_1_END) {
      return {
        active: true,
        window: "I",
        localTime,
        hoursRemaining: K.EVENING_WINDOW_1_END - localH - utcM / 60,
      };
    }
    if (localH >= K.EVENING_WINDOW_2_START && localH < K.EVENING_WINDOW_2_END) {
      return {
        active: true,
        window: "II",
        localTime,
        hoursRemaining: K.EVENING_WINDOW_2_END - localH - utcM / 60,
      };
    }

    return { active: false, window: null, localTime, hoursRemaining: null };
  }

  getThreatLevel(): ThreatLevel {
    for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
      if (this.score >= THREAT_LEVELS[i].minScore) {
        return THREAT_LEVELS[i].level;
      }
    }
    return "NOMINAL";
  }

  getStatus(): KappaStatus {
    const windowCounts: Record<string, number> = {};
    for (const [domain, events] of Object.entries(this.domainWindows)) {
      windowCounts[domain] = events.length;
    }

    let suspiciousCount = 0;
    for (const dev of this.devices.values()) {
      if (dev.suspicious) suspiciousCount++;
    }

    return {
      score: Math.round(this.score * 100) / 100,
      threatLevel: this.getThreatLevel(),
      eventsProcessed: this.eventsProcessed,
      devicesTracked: this.devices.size,
      suspiciousDevices: suspiciousCount,
      domainWindows: windowCounts,
      correlationCounts: { ...this.correlationCounts },
      eveningWindow: this.getEveningWindow(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      satOverhead: this.satOverhead,
      satKlein: this.satKlein,
      kleinPasses: this.kleinPasses,
      congustoPartial: this.congustoPartial,
      congustoFull: this.congustoFull,
      stingrayAlerts: this.stingrayAlerts,
      phiHarmonics: this.phiHarmonics,
      domainPairMatrix: { ...this.domainPairMatrix },
      recentAlerts: this.alerts.slice(0, 20),
    };
  }

  getDevices(): DeviceFingerprint[] {
    return Array.from(this.devices.values())
      .sort((a, b) => {
        if (a.suspicious !== b.suspicious) return a.suspicious ? -1 : 1;
        return b.crossDomainCount - a.crossDomainCount || b.eventCount - a.eventCount;
      });
  }

  destroy() {
    clearInterval(this.decayTimer);
  }
}

export const kappaEngine = new KappaEngine();
