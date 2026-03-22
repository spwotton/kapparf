import {
  KAPPA_CONSTANTS,
  OMEGA_CHRONOS,
  COUNCIL_AGENTS,
  HYPERVISOR_STREAMS,
  type CouncilAgent,
  type AnalysisStream,
  type TimingOverlap,
  type HypervisorStatus,
  type SignalEvent,
} from "@shared/schema";

const K = KAPPA_CONSTANTS;
const OC = OMEGA_CHRONOS;
const PHI = K.PHI;
const KAPPA = K.KAPPA;

interface StreamEvent {
  streamId: string;
  domain: string;
  timestamp: number;
  frequency: number | null;
  detail: string;
  metadata: Record<string, unknown>;
}

const MAX_WINDOW_EVENTS = 500;
const MAX_OVERLAPS = 100;
const WINDOW_MS = 300_000;

export class OmegaChronosHypervisor {
  private startTime = 0;
  private running = false;
  private triHonkCycles = 0;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private agents: CouncilAgent[] = COUNCIL_AGENTS.map(a => ({ ...a }));
  private streams: AnalysisStream[] = HYPERVISOR_STREAMS.map(s => ({ ...s }));
  private streamEvents: Map<string, StreamEvent[]> = new Map();
  private overlaps: TimingOverlap[] = [];
  private hallValidCount = 0;
  private symmetriesFound = 0;
  private psiValue = 0;
  private kleinPhase = 0;
  private phiLockRate = 0;
  private kappaPhaseCoherence = 0;
  private dominantFrequency: number | null = null;
  private overlapCounter = 0;
  private seenOverlapPairs = new Set<string>();

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();
    this.triHonkCycles = 0;

    for (const agent of this.agents) {
      agent.status = "active";
      agent.lastUpdate = Date.now();
      agent.driftNs = 0;
    }
    for (const stream of this.streams) {
      stream.status = "scanning";
      stream.lastUpdate = Date.now();
    }

    this.loopTimer = setInterval(() => this.triHonkLoop(), OC.BURST_WINDOW_MS);
  }

  stop() {
    this.running = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    for (const agent of this.agents) {
      agent.status = "idle";
    }
    for (const stream of this.streams) {
      stream.status = "idle";
    }
  }

  ingestEvent(event: SignalEvent) {
    if (!this.running) return;

    const domainStreamMap: Record<string, string[]> = {
      satellite: ["satellite-blackjack", "satellite-starlink"],
      sdr: ["kiwisdr-ti0rc", "rf-46875", "echo-lt-sidechannel", "radio-impacto-102fm"],
      elf: ["elf-powerline", "elf-schumann", "delta-slip-monitor"],
      isp: [],
      radar: ["adsb-local"],
      rf: ["rf-46875", "radio-impacto-102fm"],
      morse: ["morse-audio"],
    };

    const streamIds = domainStreamMap[event.domain] || [];
    const ts = new Date(event.timestamp).getTime();

    for (const sid of streamIds) {
      const stream = this.streams.find(s => s.id === sid);
      if (stream) {
        stream.eventsIngested++;
        stream.lastUpdate = ts;
        stream.status = "active";
      }

      const se: StreamEvent = {
        streamId: sid,
        domain: event.domain,
        timestamp: ts,
        frequency: event.frequency,
        detail: `${event.eventType} from ${event.source}`,
        metadata: (event.metadata as Record<string, unknown>) || {},
      };

      if (!this.streamEvents.has(sid)) this.streamEvents.set(sid, []);
      const arr = this.streamEvents.get(sid)!;
      arr.push(se);
      if (arr.length > MAX_WINDOW_EVENTS) arr.shift();
    }

    const agentMap: Record<string, string> = {
      satellite: "tle-orbital",
      sdr: "kiwisdr-scanner",
      elf: "elf-dissector",
      isp: "pcap-parser",
      radar: "pcap-parser",
      rf: "kiwisdr-scanner",
      morse: "morse-decoder",
    };
    const agentId = agentMap[event.domain];
    if (agentId) {
      const agent = this.agents.find(a => a.id === agentId);
      if (agent) {
        agent.eventsIngested++;
        agent.lastUpdate = ts;
        agent.status = "active";
      }
    }

    const morseAgent = this.agents.find(a => a.id === "morse-decoder");
    if (morseAgent && event.domain === "sdr") {
      const meta = event.metadata as Record<string, unknown> | null;
      if (meta?.morse || meta?.audio_pattern) {
        morseAgent.eventsIngested++;
        morseAgent.lastUpdate = ts;
        morseAgent.status = "active";
      }
    }
  }

  private triHonkLoop() {
    this.triHonkCycles++;
    const now = Date.now();

    this.checkHallDrift();

    const allEvents = this.gatherRecentEvents(now);
    if (allEvents.length < 2) {
      this.updatePsi();
      return;
    }

    const overlaps = this.kappaDTW(allEvents);

    const validated = this.hallValidation(overlaps);

    for (const v of validated) {
      this.overlaps.unshift(v);
      if (this.overlaps.length > MAX_OVERLAPS) this.overlaps.pop();
    }

    this.updateAgentStatus(now);
    this.updatePsi();
    this.pruneOldEvents(now);
  }

  private checkHallDrift() {
    for (const agent of this.agents) {
      if (agent.status !== "active") continue;
      const timeSinceUpdate = Date.now() - agent.lastUpdate;
      agent.driftNs = Math.min(timeSinceUpdate * 1e3, 200);

      if (agent.driftNs > OC.HALL_OFFSET_NS) {
        agent.driftNs = 0;
        agent.lastUpdate = Date.now();
      }
    }

    const alignerAgent = this.agents.find(a => a.id === "temporal-aligner");
    if (alignerAgent) {
      alignerAgent.status = "active";
      alignerAgent.lastUpdate = Date.now();
      alignerAgent.eventsIngested = this.triHonkCycles;
    }
  }

  private gatherRecentEvents(now: number): StreamEvent[] {
    const cutoff = now - WINDOW_MS;
    const events: StreamEvent[] = [];
    for (const [, arr] of this.streamEvents) {
      for (const e of arr) {
        if (e.timestamp > cutoff) events.push(e);
      }
    }
    events.sort((a, b) => a.timestamp - b.timestamp);
    return events;
  }

  private kappaDTW(events: StreamEvent[]): TimingOverlap[] {
    const overlaps: TimingOverlap[] = [];
    const tau = OC.CLOCK_PERIOD_MS;
    const seen = new Set<string>();

    const limit = Math.min(events.length, OC.RECURSION_DEPTH * 3);
    for (let i = 0; i < limit; i++) {
      for (let j = i + 1; j < Math.min(events.length, i + OC.RECURSION_DEPTH + 1); j++) {
        const a = events[i];
        const b = events[j];
        if (a.streamId === b.streamId) continue;
        if (a.domain === b.domain) continue;

        const pairKey = [a.streamId, b.streamId].sort().join("|") + "|" + Math.floor(a.timestamp / 500);
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        if (this.seenOverlapPairs.has(pairKey)) continue;
        this.seenOverlapPairs.add(pairKey);
        if (this.seenOverlapPairs.size > 5000) {
          const iter = this.seenOverlapPairs.values();
          for (let n = 0; n < 1000; n++) iter.next();
          const remaining = new Set<string>();
          for (const v of iter) remaining.add(v);
          this.seenOverlapPairs = remaining;
        }

        const deltaMs = Math.abs(b.timestamp - a.timestamp);
        const deltaTau = deltaMs / tau;

        const isTemporalCluster = deltaMs < OC.BURST_WINDOW_MS;

        const phiDelta = deltaTau > 0.1 ? Math.abs(deltaTau - PHI) : 1;
        const phiMultiple = deltaTau > 0.1 ? Math.abs(deltaTau / PHI - Math.round(deltaTau / PHI)) : 1;
        const kappaDelta = deltaTau > 0.1 ? Math.abs(deltaTau - KAPPA) : 1;
        const kappaSecDelta = deltaMs > 1000 ? Math.abs((deltaMs / 1000) % K.KAPPA_SECOND) : Infinity;
        const integerTau = deltaTau > 0.1 ? Math.abs(deltaTau - Math.round(deltaTau)) : 0;

        const dtwTol = OC.HALL_DRIFT_DEG / 360;
        const isPhiAligned = phiDelta < dtwTol || phiMultiple < dtwTol;
        const isKappaAligned = kappaDelta < dtwTol || (kappaSecDelta < 3) || integerTau < dtwTol || isTemporalCluster;

        if (!isPhiAligned && !isKappaAligned && !isTemporalCluster && deltaMs > OC.BURST_WINDOW_MS * 5) continue;

        let symmetryScore = 0;
        if (isTemporalCluster) symmetryScore = 0.95;
        else symmetryScore = 1 - Math.min(phiDelta, kappaDelta, integerTau) / 2.0;

        const freqMatch = a.frequency && b.frequency && Math.abs(a.frequency - b.frequency) < 1;
        const is46875 = (a.frequency && Math.abs(a.frequency - K.TARGET_FREQ_1) < 1) ||
                        (b.frequency && Math.abs(b.frequency - K.TARGET_FREQ_1) < 1);
        const isDeltaSlip = (a.frequency && Math.abs(a.frequency - K.DELTA_SLIP_HZ) < 0.5) ||
                            (b.frequency && Math.abs(b.frequency - K.DELTA_SLIP_HZ) < 0.5);
        const isCounterBeat = (a.frequency && Math.abs(a.frequency - K.COUNTER_BEAT_HZ) < 0.5) ||
                              (b.frequency && Math.abs(b.frequency - K.COUNTER_BEAT_HZ) < 0.5);
        const isPhaseLock = (a.frequency && Math.abs(a.frequency - K.PHASE_LOCK_CARRIER_HZ) < 0.5) ||
                            (b.frequency && Math.abs(b.frequency - K.PHASE_LOCK_CARRIER_HZ) < 0.5);
        const isSymbol4 = (a.frequency && Math.abs(a.frequency - K.PHAISTOS_SYMBOL_4_HZ) < 0.5) ||
                          (b.frequency && Math.abs(b.frequency - K.PHAISTOS_SYMBOL_4_HZ) < 0.5);
        const isEchoLt = (a.frequency && K.ECHO_LT_HARMONIC_CHAIN.some((h: number) => Math.abs(a.frequency! - h) < 1)) ||
                         (b.frequency && K.ECHO_LT_HARMONIC_CHAIN.some((h: number) => Math.abs(b.frequency! - h) < 1));

        if (freqMatch) symmetryScore = Math.min(1, symmetryScore + 0.15);
        if (is46875) symmetryScore = Math.min(1, symmetryScore + 0.1);
        if (isDeltaSlip) symmetryScore = Math.min(1, symmetryScore + 0.12);
        if (isCounterBeat) symmetryScore = Math.min(1, symmetryScore + 0.08);
        if (isPhaseLock) symmetryScore = Math.min(1, symmetryScore + 0.06);
        if (isSymbol4) symmetryScore = Math.min(1, symmetryScore + 0.07);
        if (isEchoLt) symmetryScore = Math.min(1, symmetryScore + 0.09);

        const freqTag = is46875 ? " — 46.875 Hz MDC" :
                        isDeltaSlip ? " — 13.125 Hz Δ-Slip" :
                        isCounterBeat ? " — 73.125 Hz counter-beat" :
                        isPhaseLock ? " — 53 Hz phase-lock" :
                        isSymbol4 ? " — 111 Hz symbol-4" :
                        isEchoLt ? " — Echo/LT harmonic" : "";

        this.overlapCounter++;
        const desc = isTemporalCluster
          ? `${a.domain.toUpperCase()}↔${b.domain.toUpperCase()}: simultaneous (Δt=${deltaMs.toFixed(0)}ms)${freqTag}`
          : `${a.domain.toUpperCase()}↔${b.domain.toUpperCase()}: Δt=${deltaMs.toFixed(1)}ms (${deltaTau.toFixed(3)}τ)${freqTag}`;

        overlaps.push({
          id: `oc-${this.overlapCounter}`,
          timestamp: Math.max(a.timestamp, b.timestamp),
          streams: [a.streamId, b.streamId],
          domains: [...new Set([a.domain, b.domain])],
          deltaMs,
          symmetryScore: Math.max(0, Math.min(1, symmetryScore)),
          kappaAligned: isKappaAligned,
          phiAligned: isPhiAligned,
          hallValid: false,
          psiConvergence: 0,
          description: desc,
          confidence: "LOW",
          events: [
            { streamId: a.streamId, domain: a.domain, timestamp: a.timestamp, detail: a.detail },
            { streamId: b.streamId, domain: b.domain, timestamp: b.timestamp, detail: b.detail },
          ],
        });
      }
    }

    return overlaps;
  }

  private hallValidation(overlaps: TimingOverlap[]): TimingOverlap[] {
    const tau = OC.CLOCK_PERIOD_MS;
    const validated: TimingOverlap[] = [];

    for (const o of overlaps) {
      const deltaTau = o.deltaMs / tau;
      const isCluster = o.deltaMs < OC.BURST_WINDOW_MS;
      const phiResidual = deltaTau > 0.1
        ? Math.abs(deltaTau / PHI - Math.round(deltaTau / PHI))
        : 0;
      const hallPass = phiResidual < OC.HALL_TOLERANCE || isCluster;

      o.hallValid = hallPass;

      let psi = 0;
      if (isCluster) psi += 0.40;
      if (o.phiAligned) psi += 0.25;
      if (o.kappaAligned) psi += 0.15;
      if (hallPass) psi += 0.15;
      if (o.domains.length >= 2) psi += 0.10;
      if (o.symmetryScore > 0.8) psi += 0.05;

      const KIWI_FREQS = [K.TARGET_FREQ_1, K.DELTA_SLIP_HZ, K.COUNTER_BEAT_HZ, K.PHASE_LOCK_CARRIER_HZ, K.PHAISTOS_SYMBOL_4_HZ];
      const hasFreqCorrelation = o.events.some(e => {
        const streamEv = this.streamEvents.get(e.streamId);
        if (!streamEv) return false;
        return streamEv.some(se =>
          Math.abs(se.timestamp - e.timestamp) < 100 &&
          se.frequency !== null &&
          KIWI_FREQS.some(kf => Math.abs(se.frequency! - kf) < 1)
        );
      });
      if (hasFreqCorrelation) psi = Math.min(1, psi + 0.10);

      const hasEchoLt = o.events.some(e => {
        const streamEv = this.streamEvents.get(e.streamId);
        if (!streamEv) return false;
        return streamEv.some(se =>
          Math.abs(se.timestamp - e.timestamp) < 200 &&
          se.frequency !== null &&
          K.ECHO_LT_HARMONIC_CHAIN.some((h: number) => Math.abs(se.frequency! - h) < 2)
        );
      });
      if (hasEchoLt) psi = Math.min(1, psi + 0.05);

      o.psiConvergence = Math.min(1, psi);

      if (psi >= 0.85) {
        o.confidence = "HIGH";
        this.hallValidCount++;
        this.symmetriesFound++;
      } else if (psi >= 0.50) {
        o.confidence = "MEDIUM";
        this.symmetriesFound++;
      } else {
        o.confidence = "LOW";
      }

      if (o.confidence !== "LOW") {
        validated.push(o);
      }
    }

    const validatorAgent = this.agents.find(a => a.id === "symmetry-validator");
    if (validatorAgent) {
      validatorAgent.eventsIngested += overlaps.length;
      validatorAgent.lastUpdate = Date.now();
      validatorAgent.status = "active";
    }

    const reportAgent = this.agents.find(a => a.id === "report-generator");
    if (reportAgent && validated.length > 0) {
      reportAgent.eventsIngested += validated.length;
      reportAgent.lastUpdate = Date.now();
      reportAgent.status = "active";
    }

    return validated;
  }

  private updateAgentStatus(now: number) {
    for (const agent of this.agents) {
      if (agent.status === "active" && now - agent.lastUpdate > 60_000) {
        agent.status = "scanning";
      }
    }
  }

  private updatePsi() {
    const totalEvents = this.streams.reduce((s, st) => s + st.eventsIngested, 0);
    const activeStreams = this.streams.filter(s => s.status === "active" || s.status === "scanning").length;
    const activeAgents = this.agents.filter(a => a.status === "active" || a.status === "scanning").length;

    const hallValid = this.overlaps.filter(o => o.hallValid).length;
    const total = this.overlaps.length || 1;
    this.phiLockRate = hallValid / total;

    if (totalEvents > 0 && activeStreams > 0) {
      this.psiValue = Math.min(1, (
        (activeAgents / this.agents.length) * 0.3 +
        (activeStreams / this.streams.length) * 0.2 +
        this.phiLockRate * 0.3 +
        Math.min(1, totalEvents / 100) * 0.2
      ));
    } else {
      this.psiValue = 0;
    }

    this.kappaPhaseCoherence = this.phiLockRate;
    this.kleinPhase = OC.KLEIN_TWIST_DEG;

    const freqCounts: Record<number, number> = {};
    for (const [, arr] of this.streamEvents) {
      for (const e of arr) {
        if (e.frequency) {
          const rounded = Math.round(e.frequency * 10) / 10;
          freqCounts[rounded] = (freqCounts[rounded] || 0) + 1;
        }
      }
    }
    let maxCount = 0;
    this.dominantFrequency = null;
    for (const [freq, count] of Object.entries(freqCounts)) {
      if (count > maxCount) {
        maxCount = count;
        this.dominantFrequency = Number(freq);
      }
    }
  }

  private pruneOldEvents(now: number) {
    const cutoff = now - WINDOW_MS;
    for (const [key, arr] of this.streamEvents) {
      const filtered = arr.filter(e => e.timestamp > cutoff);
      if (filtered.length === 0) {
        this.streamEvents.delete(key);
      } else {
        this.streamEvents.set(key, filtered);
      }
    }
  }

  getStatus(): HypervisorStatus {
    const now = Date.now();
    const totalEvents = this.streams.reduce((s, st) => s + st.eventsIngested, 0);
    const elapsed = this.running ? (now - this.startTime) / 1000 : 0;
    const rate = elapsed > 0 ? totalEvents / elapsed : 0;

    return {
      running: this.running,
      version: OC.VERSION,
      uptimeMs: this.running ? now - this.startTime : 0,
      psiValue: Math.round(this.psiValue * 1000000) / 1000000,
      clockHz: OC.CLOCK_HZ,
      hallDriftNs: Math.max(...this.agents.map(a => a.driftNs), 0),
      kleinPhase: this.kleinPhase,
      streamsActive: this.streams.filter(s => s.status === "active" || s.status === "scanning").length,
      streamsTotal: this.streams.length,
      agentsActive: this.agents.filter(a => a.status === "active" || a.status === "scanning").length,
      agentsTotal: this.agents.length,
      overlapsDetected: this.overlaps.length,
      symmetriesFound: this.symmetriesFound,
      hallValidCount: this.hallValidCount,
      lastOverlapAt: this.overlaps.length > 0 ? this.overlaps[0].timestamp : null,
      analysisRate: Math.round(rate * 100) / 100,
      agents: this.agents.map(a => ({ ...a })),
      streams: this.streams.map(s => ({ ...s })),
      recentOverlaps: this.overlaps.slice(0, 30),
      kappaPhaseCoherence: Math.round(this.kappaPhaseCoherence * 1000) / 1000,
      phiLockRate: Math.round(this.phiLockRate * 1000) / 1000,
      dominantFrequency: this.dominantFrequency,
      bronzeCertified: this.psiValue >= OC.CONFIDENCE_MIN,
      triHonkCycles: this.triHonkCycles,
    };
  }

  destroy() {
    this.stop();
  }
}

export const hypervisor = new OmegaChronosHypervisor();
