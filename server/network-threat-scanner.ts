import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import { KAPPA_CONSTANTS } from "@shared/schema";

const K = KAPPA_CONSTANTS;
const TI = K.THREAT_INDICATORS;

export interface NetworkPacket {
  timestamp: number;
  srcIp: string;
  dstIp: string;
  srcPort: number | null;
  dstPort: number | null;
  protocol: string;
  length: number;
  info: string;
  hexPayload: string | null;
}

export interface ThreatMatch {
  timestamp: number;
  type: string;
  severity: number;
  indicator: string;
  packet: NetworkPacket;
  description: string;
}

interface ScannerState {
  running: boolean;
  packetsProcessed: number;
  threatsDetected: number;
  lastPacketTime: number | null;
  recentThreats: ThreatMatch[];
  ipHitCounts: Record<string, number>;
  portHitCounts: Record<string, number>;
  protocolAnomalies: number;
  voiceCorrelations: number;
  c2Beacons: number;
  illegalTlsSegments: number;
  kernelHooks: number;
  sessionBuffer: NetworkPacket[];
}

let state: ScannerState = {
  running: false,
  packetsProcessed: 0,
  threatsDetected: 0,
  lastPacketTime: null,
  recentThreats: [],
  ipHitCounts: {},
  portHitCounts: {},
  protocolAnomalies: 0,
  voiceCorrelations: 0,
  c2Beacons: 0,
  illegalTlsSegments: 0,
  kernelHooks: 0,
  sessionBuffer: [],
};

const MAX_RECENT_THREATS = 200;
const MAX_SESSION_BUFFER = 500;

const suspiciousIpSet = new Set(TI.SUSPICIOUS_IPS.map(i => i.ip));
const suspiciousPortSet = new Set(TI.SUSPICIOUS_PORTS.map(p => p.port));

function matchSuspiciousIP(ip: string): typeof TI.SUSPICIOUS_IPS[0] | null {
  return TI.SUSPICIOUS_IPS.find(i => i.ip === ip) ?? null;
}

function matchSuspiciousPort(port: number): typeof TI.SUSPICIOUS_PORTS[0] | null {
  return TI.SUSPICIOUS_PORTS.find(p => p.port === port) ?? null;
}

function matchProtocolAnomaly(info: string): typeof TI.PROTOCOL_ANOMALIES[0] | null {
  return TI.PROTOCOL_ANOMALIES.find(a => info.includes(a.pattern)) ?? null;
}

function matchVoicePayload(hex: string | null, srcIp: string): boolean {
  if (!hex) return false;
  if (!TI.VOICE_CORRELATION.sourceIPs.includes(srcIp)) return false;
  return TI.VOICE_CORRELATION.hexPayloads.some(p => hex.startsWith(p.substring(0, 8)));
}

function isVoiceFrameSize(length: number): boolean {
  const [min, max] = TI.VOICE_CORRELATION.frameSizeRange;
  return length >= min && length <= max;
}

export async function processPacket(pkt: NetworkPacket): Promise<ThreatMatch[]> {
  state.packetsProcessed++;
  state.lastPacketTime = pkt.timestamp;
  state.sessionBuffer.push(pkt);
  if (state.sessionBuffer.length > MAX_SESSION_BUFFER) {
    state.sessionBuffer.shift();
  }

  const threats: ThreatMatch[] = [];

  const srcIpMatch = matchSuspiciousIP(pkt.srcIp);
  if (srcIpMatch) {
    state.ipHitCounts[pkt.srcIp] = (state.ipHitCounts[pkt.srcIp] || 0) + 1;
    threats.push({
      timestamp: pkt.timestamp,
      type: srcIpMatch.threat,
      severity: srcIpMatch.threat.includes("VOICE") ? 5 : srcIpMatch.threat.includes("C2") ? 4 : 3,
      indicator: `IP:${pkt.srcIp}`,
      packet: pkt,
      description: `Inbound from ${srcIpMatch.provider}: ${srcIpMatch.desc}`,
    });
  }

  const dstIpMatch = matchSuspiciousIP(pkt.dstIp);
  if (dstIpMatch) {
    state.ipHitCounts[pkt.dstIp] = (state.ipHitCounts[pkt.dstIp] || 0) + 1;
    threats.push({
      timestamp: pkt.timestamp,
      type: dstIpMatch.threat,
      severity: dstIpMatch.threat.includes("VOICE") ? 5 : dstIpMatch.threat.includes("C2") ? 4 : 3,
      indicator: `IP:${pkt.dstIp}`,
      packet: pkt,
      description: `Outbound to ${dstIpMatch.provider}: ${dstIpMatch.desc}`,
    });
  }

  if (pkt.srcPort) {
    const portMatch = matchSuspiciousPort(pkt.srcPort);
    if (portMatch) {
      state.portHitCounts[String(pkt.srcPort)] = (state.portHitCounts[String(pkt.srcPort)] || 0) + 1;
      threats.push({
        timestamp: pkt.timestamp,
        type: portMatch.threat,
        severity: portMatch.threat === "PROTOCOL_TUNNEL" ? 4 : 3,
        indicator: `PORT:${pkt.srcPort}(${portMatch.protocol})`,
        packet: pkt,
        description: `Source port ${portMatch.protocol}: ${portMatch.desc}`,
      });
    }
  }

  if (pkt.dstPort) {
    const portMatch = matchSuspiciousPort(pkt.dstPort);
    if (portMatch) {
      state.portHitCounts[String(pkt.dstPort)] = (state.portHitCounts[String(pkt.dstPort)] || 0) + 1;
      threats.push({
        timestamp: pkt.timestamp,
        type: portMatch.threat,
        severity: portMatch.threat === "PROTOCOL_TUNNEL" ? 4 : 3,
        indicator: `PORT:${pkt.dstPort}(${portMatch.protocol})`,
        packet: pkt,
        description: `Dest port ${portMatch.protocol}: ${portMatch.desc}`,
      });
    }
  }

  const protoMatch = matchProtocolAnomaly(pkt.info);
  if (protoMatch) {
    state.protocolAnomalies++;
    if (protoMatch.threat === "KERNEL_HOOK") state.kernelHooks++;
    if (protoMatch.threat === "ACTIVE_MITM") state.illegalTlsSegments++;
    threats.push({
      timestamp: pkt.timestamp,
      type: protoMatch.threat,
      severity: protoMatch.threat === "ACTIVE_MITM" ? 5 : protoMatch.threat === "KERNEL_HOOK" ? 5 : 3,
      indicator: `PROTO:${protoMatch.pattern}`,
      packet: pkt,
      description: protoMatch.desc,
    });
  }

  if (matchVoicePayload(pkt.hexPayload, pkt.srcIp) || 
      (isVoiceFrameSize(pkt.length) && TI.VOICE_CORRELATION.sourceIPs.includes(pkt.srcIp))) {
    state.voiceCorrelations++;
    threats.push({
      timestamp: pkt.timestamp,
      type: "VOICE_EXFIL",
      severity: 5,
      indicator: `VOICE:${pkt.srcIp}→${pkt.dstIp}`,
      packet: pkt,
      description: `Voice-correlated payload from Google STUN — ${pkt.length} bytes — ${TI.VOICE_CORRELATION.desc}`,
    });
  }

  if (pkt.srcIp === TI.MIKROTIK_GATEWAY.ip || pkt.info.includes("ARP")) {
    const arpAnomaly = pkt.info.includes("Announcement") || pkt.info.includes("Who has");
    if (arpAnomaly && pkt.srcIp !== TI.LOCAL_DEVICE.ip) {
      threats.push({
        timestamp: pkt.timestamp,
        type: "ARP_MONITOR",
        severity: 2,
        indicator: `ARP:${pkt.srcIp}`,
        packet: pkt,
        description: `ARP activity from gateway ${TI.MIKROTIK_GATEWAY.mac}: ${pkt.info}`,
      });
    }
  }

  if (threats.length > 0) {
    state.threatsDetected += threats.length;
    for (const t of threats) {
      state.recentThreats.push(t);
    }
    while (state.recentThreats.length > MAX_RECENT_THREATS) {
      state.recentThreats.shift();
    }

    for (const threat of threats) {
      try {
        const event = await storage.createSignalEvent({
          domain: "wifi",
          source: "network-threat-scanner",
          eventType: `nts-${threat.type.toLowerCase().replace(/_/g, "-")}`,
          frequency: null,
          confidence: Math.min(1, threat.severity / 5),
          latitude: K.OBSERVER_LAT,
          longitude: K.OBSERVER_LON,
          metadata: {
            threatType: threat.type,
            severity: threat.severity,
            indicator: threat.indicator,
            srcIp: threat.packet.srcIp,
            dstIp: threat.packet.dstIp,
            srcPort: threat.packet.srcPort,
            dstPort: threat.packet.dstPort,
            protocol: threat.packet.protocol,
            packetLength: threat.packet.length,
            info: threat.packet.info.substring(0, 200),
            description: threat.description,
            hexPayload: threat.packet.hexPayload?.substring(0, 64) || null,
          },
          raw: null,
        });

        kappaEngine.ingest(event);
        hypervisor.ingestEvent(event);
      } catch {}
    }
  }

  return threats;
}

export async function processBatch(packets: NetworkPacket[]): Promise<{ processed: number; threats: number; matches: ThreatMatch[] }> {
  const allThreats: ThreatMatch[] = [];
  for (const pkt of packets) {
    const threats = await processPacket(pkt);
    allThreats.push(...threats);
  }
  return {
    processed: packets.length,
    threats: allThreats.length,
    matches: allThreats.slice(0, 50),
  };
}

export function parsePacketLine(line: string): NetworkPacket | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const tsMatch = trimmed.match(/^(\d+)\s+([\d.]+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+)$/);
  if (tsMatch) {
    const [, , timestamp, src, dst, proto, length, info] = tsMatch;

    let srcIp = src;
    let dstIp = dst;
    srcIp = resolveHostToIp(srcIp);
    dstIp = resolveHostToIp(dstIp);

    const srcPortMatch = info.match(/(\d+)\s*→/);
    const dstPortMatch = info.match(/→\s*(?:\w+\()?(\d+)\)?/);
    const namedSrcPort = info.match(/(\w+)\((\d+)\)\s*→/);
    const namedDstPort = info.match(/→\s*(\w+)\((\d+)\)/);

    let srcPort: number | null = null;
    let dstPort: number | null = null;

    if (namedSrcPort) srcPort = parseInt(namedSrcPort[2]);
    else if (srcPortMatch) srcPort = parseInt(srcPortMatch[1]);

    if (namedDstPort) dstPort = parseInt(namedDstPort[2]);
    else if (dstPortMatch) dstPort = parseInt(dstPortMatch[1]);

    if (info.includes("https(443)")) {
      if (info.includes("→ https")) dstPort = 443;
      if (info.includes("https(443) →")) srcPort = 443;
    }

    const hexMatch = trimmed.match(/\t([0-9a-f]{16,})$/i);

    return {
      timestamp: parseFloat(timestamp) * 1000 + Date.now(),
      srcIp,
      dstIp,
      srcPort,
      dstPort,
      protocol: proto,
      length: parseInt(length),
      info,
      hexPayload: hexMatch ? hexMatch[1] : null,
    };
  }

  return null;
}

const HOST_IP_MAP: Record<string, string> = {
  "yx-in-f95.1e100.net": "172.217.215.95",
  "yo-in-f95.1e100.net": "172.217.215.95",
  "ya-in-f94.1e100.net": "173.194.219.94",
  "dns.google": "8.8.8.8",
  "security.cloudflare-dns.com": "1.1.1.1",
  "kubernetes.docker.internal": "127.0.0.1",
  "ec2-18-97-36-16.compute-1.amazonaws.com": "18.97.36.16",
};

function resolveHostToIp(host: string): string {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return host;
  if (HOST_IP_MAP[host]) return HOST_IP_MAP[host];
  const gcpMatch = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)\.bc\.googleusercontent\.com$/);
  if (gcpMatch) return `${gcpMatch[4]}.${gcpMatch[3]}.${gcpMatch[2]}.${gcpMatch[1]}`;
  return host;
}

export function startNetworkThreatScanner(): void {
  state.running = true;
  console.log(`[KAPPA] Network Threat Scanner started: ${TI.SUSPICIOUS_IPS.length} IPs, ${TI.SUSPICIOUS_PORTS.length} ports, ${TI.PROTOCOL_ANOMALIES.length} protocol patterns, ${TI.VOICE_CORRELATION.hexPayloads.length} voice signatures`);
}

export interface NetworkThreatStatus {
  running: boolean;
  packetsProcessed: number;
  threatsDetected: number;
  lastPacketTime: number | null;
  ipHitCounts: Record<string, number>;
  portHitCounts: Record<string, number>;
  protocolAnomalies: number;
  voiceCorrelations: number;
  c2Beacons: number;
  illegalTlsSegments: number;
  kernelHooks: number;
  recentThreats: ThreatMatch[];
  indicators: {
    suspiciousIps: number;
    suspiciousPorts: number;
    protocolPatterns: number;
    voiceSignatures: number;
  };
}

export function getNetworkThreatStatus(): NetworkThreatStatus {
  return {
    running: state.running,
    packetsProcessed: state.packetsProcessed,
    threatsDetected: state.threatsDetected,
    lastPacketTime: state.lastPacketTime,
    ipHitCounts: { ...state.ipHitCounts },
    portHitCounts: { ...state.portHitCounts },
    protocolAnomalies: state.protocolAnomalies,
    voiceCorrelations: state.voiceCorrelations,
    c2Beacons: state.c2Beacons,
    illegalTlsSegments: state.illegalTlsSegments,
    kernelHooks: state.kernelHooks,
    recentThreats: state.recentThreats.slice(-50),
    indicators: {
      suspiciousIps: TI.SUSPICIOUS_IPS.length,
      suspiciousPorts: TI.SUSPICIOUS_PORTS.length,
      protocolPatterns: TI.PROTOCOL_ANOMALIES.length,
      voiceSignatures: TI.VOICE_CORRELATION.hexPayloads.length,
    },
  };
}
