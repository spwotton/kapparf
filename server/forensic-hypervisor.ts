import { db } from "./db";
import { signalEvents, correlations, incidents, forensicReports, pcapUploads } from "@shared/schema";
import { sql, desc, gte, lte, and, eq } from "drizzle-orm";
import * as crypto from "crypto";

interface Finding {
  id: string;
  category: string;
  severity: number;
  title: string;
  detail: string;
  evidence: any;
  timestamp?: string;
}

interface AnalysisResult {
  title: string;
  summary: string;
  findings: Finding[];
  stats: Record<string, any>;
  severity: number;
  dataRange: { from: string; to: string };
}

interface PcapPacket {
  timestamp: Date;
  capturedLength: number;
  originalLength: number;
  srcIP?: string;
  dstIP?: string;
  srcPort?: number;
  dstPort?: number;
  protocol?: number;
  protocolName?: string;
  flags?: string[];
  payload?: Buffer;
}

const EVENING_WINDOW_UTC = { start: 0, end: 4 };
const OBSERVER_LAT = 10.0513892;
const OBSERVER_LON = -84.2186578;

const SUSPICIOUS_PORTS = new Set([
  7547, 4443, 8443, 8080, 3128, 1080, 9050, 9150,
  5555, 5037, 6667, 6697, 4444, 31337, 12345,
  443, 993, 995, 8883,
]);

const SUSPICIOUS_IPS = [
  { range: "185.244.", label: "Gamma Group infrastructure block" },
  { range: "91.218.", label: "Known surveillance proxy range" },
  { range: "194.126.", label: "Eastern European C2 block" },
  { range: "103.224.", label: "Asian proxy infrastructure" },
  { range: "162.158.", label: "Cloudflare (potential fronting)" },
];

const KNOWN_C2_PORTS = new Set([4444, 5555, 8443, 31337, 12345, 9999, 1337]);
const DNS_PORT = 53;
const TR069_PORT = 7547;

let hypervisorState = {
  running: false,
  lastRun: 0,
  runCount: 0,
  intervalId: null as any,
  lastReport: null as AnalysisResult | null,
};

export function getHypervisorStatus() {
  return {
    running: hypervisorState.running,
    lastRun: hypervisorState.lastRun,
    runCount: hypervisorState.runCount,
    hasLastReport: !!hypervisorState.lastReport,
  };
}

export async function runForensicAnalysis(): Promise<AnalysisResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  const stats: Record<string, any> = {};

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalEvents,
    totalCorrelations,
    totalIncidents,
    domainBreakdown,
    hourlyDistribution,
    highSevCorrelations,
    correlationRuleHits,
    eventBursts,
    ewEvents,
    recentSdrDetections,
    satelliteCoincidences,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(signalEvents),
    db.select({ count: sql<number>`count(*)` }).from(correlations),
    db.select({ count: sql<number>`count(*)` }).from(incidents),
    db.select({
      domain: signalEvents.domain,
      count: sql<number>`count(*)::int`,
      avgConfidence: sql<number>`round(avg(confidence)::numeric, 3)`,
      maxConfidence: sql<number>`max(confidence)`,
    }).from(signalEvents).groupBy(signalEvents.domain).orderBy(sql`count(*) DESC`),
    db.select({
      hour: sql<number>`extract(hour from timestamp)::int`,
      count: sql<number>`count(*)::int`,
      avgConf: sql<number>`round(avg(confidence)::numeric, 3)`,
    }).from(signalEvents).groupBy(sql`extract(hour from timestamp)`).orderBy(sql`extract(hour from timestamp)`),
    db.select({
      ruleName: correlations.ruleName,
      severity: correlations.severity,
      description: correlations.description,
      timestamp: correlations.timestamp,
    }).from(correlations).where(gte(correlations.severity, 3)).orderBy(desc(correlations.timestamp)).limit(50),
    db.select({
      ruleName: correlations.ruleName,
      count: sql<number>`count(*)::int`,
      avgSev: sql<number>`round(avg(severity)::numeric, 2)`,
      maxSev: sql<number>`max(severity)`,
      firstSeen: sql<string>`min(timestamp)`,
      lastSeen: sql<string>`max(timestamp)`,
    }).from(correlations).groupBy(correlations.ruleName).orderBy(sql`count(*) DESC`),
    db.select({
      day: sql<string>`date_trunc('hour', timestamp)`,
      count: sql<number>`count(*)::int`,
    }).from(signalEvents)
      .where(gte(signalEvents.timestamp, thirtyDaysAgo))
      .groupBy(sql`date_trunc('hour', timestamp)`)
      .having(sql`count(*) > 500`)
      .orderBy(sql`count(*) DESC`)
      .limit(20),
    db.select({
      count: sql<number>`count(*)::int`,
      avgConf: sql<number>`round(avg(confidence)::numeric, 3)`,
    }).from(signalEvents)
      .where(sql`extract(hour from timestamp) >= ${EVENING_WINDOW_UTC.start} AND extract(hour from timestamp) < ${EVENING_WINDOW_UTC.end}`),
    db.select({
      eventType: signalEvents.eventType,
      source: signalEvents.source,
      frequency: signalEvents.frequency,
      confidence: signalEvents.confidence,
      timestamp: signalEvents.timestamp,
    }).from(signalEvents)
      .where(eq(signalEvents.domain, "sdr"))
      .orderBy(desc(signalEvents.confidence))
      .limit(30),
    db.select({
      ruleName: correlations.ruleName,
      count: sql<number>`count(*)::int`,
    }).from(correlations)
      .where(sql`rule_name ILIKE '%satellite%' OR rule_name ILIKE '%pass%' OR rule_name ILIKE '%MUOS%' OR rule_name ILIKE '%COSMO%'`)
      .groupBy(correlations.ruleName)
      .orderBy(sql`count(*) DESC`),
  ]);

  stats.totalEvents = Number(totalEvents[0]?.count ?? 0);
  stats.totalCorrelations = Number(totalCorrelations[0]?.count ?? 0);
  stats.totalIncidents = Number(totalIncidents[0]?.count ?? 0);
  stats.domains = domainBreakdown;
  stats.analysisTime = Date.now() - startTime;

  const ewCount = Number(ewEvents[0]?.count ?? 0);
  const ewConf = Number(ewEvents[0]?.avgConf ?? 0);
  const totalCount = stats.totalEvents;
  const ewHours = 4;
  const totalHours = 24;
  const expectedRatio = ewHours / totalHours;
  const actualRatio = totalCount > 0 ? ewCount / totalCount : 0;
  const ewEnrichment = expectedRatio > 0 ? actualRatio / expectedRatio : 0;

  if (ewEnrichment > 1.2) {
    findings.push({
      id: crypto.randomUUID(),
      category: "temporal-pattern",
      severity: ewEnrichment > 2.0 ? 4 : 3,
      title: "Evening Window Signal Enrichment",
      detail: `Events during 18:00-22:00 CST (00:00-04:00 UTC) show ${ewEnrichment.toFixed(2)}x enrichment over baseline. ${ewCount.toLocaleString()} events in EW vs ${totalCount.toLocaleString()} total. Expected ${(expectedRatio * 100).toFixed(1)}%, actual ${(actualRatio * 100).toFixed(1)}%. Average confidence in EW: ${ewConf}`,
      evidence: { ewCount, totalCount, ewEnrichment, expectedRatio, actualRatio, avgConfidence: ewConf },
    });
  }

  const hourlyData = hourlyDistribution.map(h => ({
    hour: Number(h.hour),
    count: Number(h.count),
    avgConf: Number(h.avgConf),
  }));
  const avgHourly = hourlyData.reduce((s, h) => s + h.count, 0) / 24;
  const peakHours = hourlyData.filter(h => h.count > avgHourly * 2).sort((a, b) => b.count - a.count);

  if (peakHours.length > 0) {
    findings.push({
      id: crypto.randomUUID(),
      category: "temporal-pattern",
      severity: 2,
      title: "Peak Activity Hours Identified",
      detail: `${peakHours.length} hours show >2x average activity. Peak: ${peakHours[0].hour}:00 UTC (${((peakHours[0].hour - 6 + 24) % 24)}:00 CST) with ${peakHours[0].count.toLocaleString()} events (avg: ${Math.round(avgHourly).toLocaleString()}). Confidence at peak: ${peakHours[0].avgConf}`,
      evidence: { peakHours: peakHours.slice(0, 5), averageHourly: Math.round(avgHourly) },
    });
  }

  const highConfHours = hourlyData.filter(h => h.avgConf > 0.78).sort((a, b) => b.avgConf - a.avgConf);
  if (highConfHours.length > 0 && highConfHours.length < 8) {
    findings.push({
      id: crypto.randomUUID(),
      category: "confidence-anomaly",
      severity: 3,
      title: "High-Confidence Signal Clustering",
      detail: `${highConfHours.length} hours show elevated avg confidence (>0.78). Highest: ${highConfHours[0].hour}:00 UTC = ${((highConfHours[0].hour - 6 + 24) % 24)}:00 CST (conf: ${highConfHours[0].avgConf}). This suggests non-random signal injection during specific windows.`,
      evidence: { highConfHours },
    });
  }

  if (eventBursts.length > 0) {
    const topBurst = eventBursts[0];
    findings.push({
      id: crypto.randomUUID(),
      category: "burst-detection",
      severity: 3,
      title: "Signal Burst Events Detected",
      detail: `${eventBursts.length} hourly windows with >500 events detected. Largest burst: ${Number(topBurst.count).toLocaleString()} events at ${topBurst.day}. Bursts indicate coordinated multi-source activity or systematic scanning.`,
      evidence: { bursts: eventBursts.slice(0, 10) },
    });
  }

  for (const rule of correlationRuleHits) {
    const count = Number(rule.count);
    const maxSev = Number(rule.maxSev);
    if (count > 1000 || maxSev >= 3) {
      findings.push({
        id: crypto.randomUUID(),
        category: "correlation-cluster",
        severity: maxSev >= 3 ? maxSev : 2,
        title: `Correlation Rule: ${rule.ruleName}`,
        detail: `${count.toLocaleString()} hits, avg severity ${rule.avgSev}, max severity ${maxSev}. Active from ${rule.firstSeen} to ${rule.lastSeen}.`,
        evidence: { ruleName: rule.ruleName, count, avgSeverity: rule.avgSev, maxSeverity: maxSev, firstSeen: rule.firstSeen, lastSeen: rule.lastSeen },
      });
    }
  }

  if (highSevCorrelations.length > 0) {
    const grouped: Record<string, any[]> = {};
    for (const c of highSevCorrelations) {
      if (!grouped[c.ruleName]) grouped[c.ruleName] = [];
      grouped[c.ruleName].push(c);
    }
    for (const [rule, items] of Object.entries(grouped)) {
      if (items.length >= 3) {
        findings.push({
          id: crypto.randomUUID(),
          category: "high-severity-cluster",
          severity: 4,
          title: `High-Severity Cluster: ${rule}`,
          detail: `${items.length} severity 3+ hits for "${rule}". Most recent: ${items[0].timestamp}. This rule consistently triggers at elevated severity — investigate the underlying signal pattern.`,
          evidence: { rule, count: items.length, samples: items.slice(0, 5) },
        });
      }
    }
  }

  if (satelliteCoincidences.length > 0) {
    const totalSatCorr = satelliteCoincidences.reduce((s, c) => s + Number(c.count), 0);
    findings.push({
      id: crypto.randomUUID(),
      category: "satellite-correlation",
      severity: 3,
      title: "Satellite Pass Signal Coincidences",
      detail: `${totalSatCorr.toLocaleString()} correlations link satellite passes with ground-level signal activity across ${satelliteCoincidences.length} rule types. Top: ${satelliteCoincidences[0].ruleName} (${Number(satelliteCoincidences[0].count).toLocaleString()} hits). This indicates potential satellite-mediated signal relay or coordinated timing.`,
      evidence: { rules: satelliteCoincidences, total: totalSatCorr },
    });
  }

  const sdrByConfidence = recentSdrDetections
    .filter(d => Number(d.confidence) > 0.8)
    .sort((a, b) => Number(b.confidence) - Number(a.confidence));
  if (sdrByConfidence.length > 0) {
    findings.push({
      id: crypto.randomUUID(),
      category: "sdr-high-confidence",
      severity: 3,
      title: "High-Confidence SDR Detections",
      detail: `${sdrByConfidence.length} SDR detections with confidence >0.80. Top: ${sdrByConfidence[0].eventType} from ${sdrByConfidence[0].source} @ ${sdrByConfidence[0].frequency} Hz (conf: ${sdrByConfidence[0].confidence}). These represent the most reliable signal detections.`,
      evidence: { detections: sdrByConfidence.slice(0, 10) },
    });
  }

  const domainConcentration = domainBreakdown.map(d => ({
    domain: d.domain,
    count: Number(d.count),
    pct: totalCount > 0 ? (Number(d.count) / totalCount * 100) : 0,
    avgConf: Number(d.avgConfidence),
  }));
  const nonSatDomains = domainConcentration.filter(d => d.domain !== "satellite");
  if (nonSatDomains.length > 0) {
    const topNonSat = nonSatDomains[0];
    findings.push({
      id: crypto.randomUUID(),
      category: "domain-analysis",
      severity: 2,
      title: "Domain Activity Distribution",
      detail: `${domainConcentration.length} active domains. Satellite dominates at ${domainConcentration.find(d => d.domain === "satellite")?.pct.toFixed(1)}%. Top non-satellite: ${topNonSat.domain} with ${topNonSat.count.toLocaleString()} events (${topNonSat.pct.toFixed(1)}%, avg conf: ${topNonSat.avgConf}).`,
      evidence: { domains: domainConcentration },
    });
  }

  findings.sort((a, b) => b.severity - a.severity);
  const maxSeverity = findings.length > 0 ? Math.max(...findings.map(f => f.severity)) : 1;

  const result: AnalysisResult = {
    title: `KAPPA Forensic Analysis — ${new Date().toISOString().slice(0, 10)}`,
    summary: `Analyzed ${stats.totalEvents.toLocaleString()} signal events, ${stats.totalCorrelations.toLocaleString()} correlations, and ${stats.totalIncidents} incidents across ${domainBreakdown.length} domains. Found ${findings.length} findings (${findings.filter(f => f.severity >= 4).length} critical, ${findings.filter(f => f.severity === 3).length} high). Analysis completed in ${Date.now() - startTime}ms.`,
    findings,
    stats,
    severity: maxSeverity,
    dataRange: { from: thirtyDaysAgo.toISOString(), to: now.toISOString() },
  };

  const hash = crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex");
  await db.insert(forensicReports).values({
    reportType: "autonomous",
    title: result.title,
    summary: result.summary,
    findings: result.findings,
    stats: result.stats,
    severity: result.severity,
    dataRange: result.dataRange,
    hash,
  });

  hypervisorState.lastReport = result;
  hypervisorState.lastRun = Date.now();
  hypervisorState.runCount++;

  console.log(`[HYPERVISOR] Analysis complete: ${findings.length} findings, max severity ${maxSeverity}, ${Date.now() - startTime}ms`);
  return result;
}

function parseIPPacket(packetData: Buffer, ipOffset: number, capturedLen: number, pkt: PcapPacket): void {
  if (ipOffset > 0 && ipOffset + 20 <= capturedLen) {
    const versionIHL = packetData[ipOffset];
    const version = (versionIHL >> 4) & 0xf;
    if (version === 4) {
      const ihl = (versionIHL & 0xf) * 4;
      pkt.protocol = packetData[ipOffset + 9];
      pkt.srcIP = `${packetData[ipOffset + 12]}.${packetData[ipOffset + 13]}.${packetData[ipOffset + 14]}.${packetData[ipOffset + 15]}`;
      pkt.dstIP = `${packetData[ipOffset + 16]}.${packetData[ipOffset + 17]}.${packetData[ipOffset + 18]}.${packetData[ipOffset + 19]}`;
      const protoNames: Record<number, string> = { 1: "ICMP", 6: "TCP", 17: "UDP", 47: "GRE", 50: "ESP", 51: "AH" };
      pkt.protocolName = protoNames[pkt.protocol] || `proto-${pkt.protocol}`;
      const transportOffset = ipOffset + ihl;
      if ((pkt.protocol === 6 || pkt.protocol === 17) && transportOffset + 4 <= capturedLen) {
        pkt.srcPort = packetData.readUInt16BE(transportOffset);
        pkt.dstPort = packetData.readUInt16BE(transportOffset + 2);
        if (pkt.protocol === 6 && transportOffset + 14 <= capturedLen) {
          const tcpFlags = packetData[transportOffset + 13];
          const flagNames: string[] = [];
          if (tcpFlags & 0x01) flagNames.push("FIN");
          if (tcpFlags & 0x02) flagNames.push("SYN");
          if (tcpFlags & 0x04) flagNames.push("RST");
          if (tcpFlags & 0x08) flagNames.push("PSH");
          if (tcpFlags & 0x10) flagNames.push("ACK");
          if (tcpFlags & 0x20) flagNames.push("URG");
          pkt.flags = flagNames;
        }
      }
    }
  }
}

function getIPOffset(linkType: number, packetData: Buffer, capturedLen: number): number {
  if (linkType === 1 && capturedLen >= 14) {
    const etherType = packetData.readUInt16BE(12);
    if (etherType === 0x0800) return 14;
    if (etherType === 0x8100 && capturedLen >= 18) {
      const innerType = packetData.readUInt16BE(16);
      if (innerType === 0x0800) return 18;
    }
  } else if (linkType === 113 && capturedLen >= 16) {
    const proto = packetData.readUInt16BE(14);
    if (proto === 0x0800) return 16;
  } else if (linkType === 0) {
    if (capturedLen >= 4) {
      const family = packetData.readUInt32LE(0);
      if (family === 2) return 4;
    }
  }
  return 0;
}

function parsePcapng(buffer: Buffer): PcapPacket[] {
  const packets: PcapPacket[] = [];
  const maxPackets = 100000;
  let offset = 0;
  let currentLinkType = 1;

  while (offset + 12 <= buffer.length && packets.length < maxPackets) {
    const blockType = buffer.readUInt32LE(offset);
    const blockLen = buffer.readUInt32LE(offset + 4);
    if (blockLen < 12 || offset + blockLen > buffer.length) break;

    if (blockType === 0x00000001 && blockLen >= 20) {
      currentLinkType = buffer.readUInt16LE(offset + 8);
    }

    if (blockType === 0x00000006 && blockLen >= 28 + 4) {
      const capturedLen = buffer.readUInt32LE(offset + 20);
      const originalLen = buffer.readUInt32LE(offset + 24);
      const tsHigh = buffer.readUInt32LE(offset + 12);
      const tsLow = buffer.readUInt32LE(offset + 16);
      const tsMicros = (tsHigh * 0x100000000 + tsLow);
      const timestamp = new Date(tsMicros / 1000);

      if (capturedLen > 0 && offset + 28 + capturedLen <= buffer.length) {
        const packetData = buffer.subarray(offset + 28, offset + 28 + capturedLen);
        const pkt: PcapPacket = { timestamp, capturedLength: capturedLen, originalLength: originalLen };
        const ipOff = getIPOffset(currentLinkType, packetData, capturedLen);
        parseIPPacket(packetData, ipOff, capturedLen, pkt);
        packets.push(pkt);
      }
    }

    if (blockType === 0x00000003 && blockLen >= 20 + 4) {
      const capturedLen = buffer.readUInt32LE(offset + 16);
      const originalLen = buffer.readUInt32LE(offset + 20);
      const tsHigh = buffer.readUInt32LE(offset + 8);
      const tsLow = buffer.readUInt32LE(offset + 12);
      const tsMicros = (tsHigh * 0x100000000 + tsLow);
      const timestamp = new Date(tsMicros / 1000);

      if (capturedLen > 0 && offset + 24 + capturedLen <= buffer.length) {
        const packetData = buffer.subarray(offset + 24, offset + 24 + capturedLen);
        const pkt: PcapPacket = { timestamp, capturedLength: capturedLen, originalLength: originalLen };
        const ipOff = getIPOffset(currentLinkType, packetData, capturedLen);
        parseIPPacket(packetData, ipOff, capturedLen, pkt);
        packets.push(pkt);
      }
    }

    const paddedLen = Math.ceil(blockLen / 4) * 4;
    offset += paddedLen;
  }

  return packets;
}

export function parsePcap(buffer: Buffer): PcapPacket[] {
  const packets: PcapPacket[] = [];
  if (buffer.length < 24) return packets;

  const magic = buffer.readUInt32LE(0);
  let littleEndian = true;
  if (magic === 0xa1b2c3d4) {
    littleEndian = true;
  } else if (magic === 0xd4c3b2a1) {
    littleEndian = false;
  } else if (magic === 0x0a0d0d0a) {
    return parsePcapng(buffer);
  } else {
    return packets;
  }

  const linkType = littleEndian ? buffer.readUInt32LE(20) : buffer.readUInt32BE(20);
  let offset = 24;
  const maxPackets = 100000;

  while (offset + 16 <= buffer.length && packets.length < maxPackets) {
    const tsSec = littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
    const tsUsec = littleEndian ? buffer.readUInt32LE(offset + 4) : buffer.readUInt32BE(offset + 4);
    const capturedLen = littleEndian ? buffer.readUInt32LE(offset + 8) : buffer.readUInt32BE(offset + 8);
    const originalLen = littleEndian ? buffer.readUInt32LE(offset + 12) : buffer.readUInt32BE(offset + 12);

    if (capturedLen > 65535 || capturedLen > buffer.length - offset - 16) break;

    const packetData = buffer.subarray(offset + 16, offset + 16 + capturedLen);
    const timestamp = new Date(tsSec * 1000 + Math.floor(tsUsec / 1000));

    const pkt: PcapPacket = { timestamp, capturedLength: capturedLen, originalLength: originalLen };
    const ipOff = getIPOffset(linkType, packetData, capturedLen);
    parseIPPacket(packetData, ipOff, capturedLen, pkt);
    packets.push(pkt);
    offset += 16 + capturedLen;
  }

  return packets;
}

export interface PcapAnalysis {
  filename: string;
  packetCount: number;
  timeRange: { start: string; end: string; durationSec: number };
  protocols: Record<string, number>;
  topTalkers: { ip: string; packets: number; bytes: number }[];
  suspiciousPorts: { port: number; count: number; label: string }[];
  suspiciousIPs: { ip: string; count: number; label: string }[];
  dnsQueries: number;
  tr069Packets: number;
  c2Candidates: { ip: string; port: number; count: number }[];
  ewPackets: number;
  ewRatio: number;
  temporalAlignment: TemporalMatch[];
  anomalies: string[];
}

export interface TemporalMatch {
  packetTime: string;
  eventType: string;
  eventDomain: string;
  eventSource: string;
  deltaMs: number;
  significance: string;
}

export async function analyzePcap(buffer: Buffer, filename: string): Promise<PcapAnalysis> {
  const packets = parsePcap(buffer);
  if (packets.length === 0) {
    return {
      filename, packetCount: 0,
      timeRange: { start: "", end: "", durationSec: 0 },
      protocols: {}, topTalkers: [], suspiciousPorts: [], suspiciousIPs: [],
      dnsQueries: 0, tr069Packets: 0, c2Candidates: [], ewPackets: 0, ewRatio: 0,
      temporalAlignment: [], anomalies: ["Failed to parse PCAP or empty file"],
    };
  }

  const sorted = packets.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const start = sorted[0].timestamp;
  const end = sorted[sorted.length - 1].timestamp;
  const durationSec = (end.getTime() - start.getTime()) / 1000;

  const protocols: Record<string, number> = {};
  const ipCounts: Record<string, { packets: number; bytes: number }> = {};
  const portCounts: Record<number, number> = {};
  let dnsQueries = 0;
  let tr069Packets = 0;
  let ewPackets = 0;
  const c2Map: Record<string, number> = {};

  for (const pkt of packets) {
    const proto = pkt.protocolName || "unknown";
    protocols[proto] = (protocols[proto] || 0) + 1;

    if (pkt.srcIP) {
      if (!ipCounts[pkt.srcIP]) ipCounts[pkt.srcIP] = { packets: 0, bytes: 0 };
      ipCounts[pkt.srcIP].packets++;
      ipCounts[pkt.srcIP].bytes += pkt.capturedLength;
    }
    if (pkt.dstIP) {
      if (!ipCounts[pkt.dstIP]) ipCounts[pkt.dstIP] = { packets: 0, bytes: 0 };
      ipCounts[pkt.dstIP].packets++;
      ipCounts[pkt.dstIP].bytes += pkt.capturedLength;
    }

    if (pkt.srcPort) portCounts[pkt.srcPort] = (portCounts[pkt.srcPort] || 0) + 1;
    if (pkt.dstPort) portCounts[pkt.dstPort] = (portCounts[pkt.dstPort] || 0) + 1;

    if (pkt.srcPort === DNS_PORT || pkt.dstPort === DNS_PORT) dnsQueries++;
    if (pkt.srcPort === TR069_PORT || pkt.dstPort === TR069_PORT) tr069Packets++;

    const hour = pkt.timestamp.getUTCHours();
    if (hour >= EVENING_WINDOW_UTC.start && hour < EVENING_WINDOW_UTC.end) ewPackets++;

    if (pkt.dstPort && KNOWN_C2_PORTS.has(pkt.dstPort) && pkt.dstIP) {
      const key = `${pkt.dstIP}:${pkt.dstPort}`;
      c2Map[key] = (c2Map[key] || 0) + 1;
    }
  }

  const topTalkers = Object.entries(ipCounts)
    .map(([ip, data]) => ({ ip, ...data }))
    .sort((a, b) => b.packets - a.packets)
    .slice(0, 20);

  const suspiciousPorts = Object.entries(portCounts)
    .filter(([port]) => SUSPICIOUS_PORTS.has(Number(port)))
    .map(([port, count]) => ({
      port: Number(port),
      count,
      label: Number(port) === 7547 ? "TR-069 CWMP" :
             Number(port) === 4444 ? "Known C2/Meterpreter" :
             Number(port) === 5555 ? "Android ADB" :
             Number(port) === 9050 ? "Tor SOCKS" :
             `Suspicious port ${port}`,
    }))
    .sort((a, b) => b.count - a.count);

  const suspiciousIPs: { ip: string; count: number; label: string }[] = [];
  for (const [ip, data] of Object.entries(ipCounts)) {
    for (const known of SUSPICIOUS_IPS) {
      if (ip.startsWith(known.range)) {
        suspiciousIPs.push({ ip, count: data.packets, label: known.label });
      }
    }
  }

  const c2Candidates = Object.entries(c2Map)
    .map(([key, count]) => {
      const [ip, port] = key.split(":");
      return { ip, port: Number(port), count };
    })
    .filter(c => c.count >= 2)
    .sort((a, b) => b.count - a.count);

  const ewRatio = packets.length > 0 ? ewPackets / packets.length : 0;

  const anomalies: string[] = [];
  if (tr069Packets > 0) anomalies.push(`TR-069 CWMP traffic detected: ${tr069Packets} packets — ISP remote management/potential injection vector`);
  if (c2Candidates.length > 0) anomalies.push(`${c2Candidates.length} potential C2 endpoints found on known backdoor ports`);
  if (suspiciousIPs.length > 0) anomalies.push(`${suspiciousIPs.length} IPs match known surveillance infrastructure ranges`);
  if (ewRatio > 0.25 && durationSec > 3600) anomalies.push(`${(ewRatio * 100).toFixed(1)}% of traffic in evening window (18:00-22:00 CST) — enriched vs 16.7% expected`);
  if (dnsQueries > packets.length * 0.3) anomalies.push(`DNS query ratio ${(dnsQueries / packets.length * 100).toFixed(1)}% — possible DNS tunneling or poisoning`);

  const flagAnomalies = packets.filter(p => p.flags && p.flags.includes("RST") && p.flags.includes("SYN"));
  if (flagAnomalies.length > 10) anomalies.push(`${flagAnomalies.length} RST+SYN packets — TCP reset injection pattern`);

  let temporalAlignment: TemporalMatch[] = [];
  try {
    if (packets.length > 0 && start.getFullYear() >= 2024) {
      const windowStart = new Date(start.getTime() - 60000);
      const windowEnd = new Date(end.getTime() + 60000);
      const overlappingEvents = await db.select({
        eventType: signalEvents.eventType,
        domain: signalEvents.domain,
        source: signalEvents.source,
        timestamp: signalEvents.timestamp,
      }).from(signalEvents)
        .where(and(
          gte(signalEvents.timestamp, windowStart),
          lte(signalEvents.timestamp, windowEnd),
        ))
        .orderBy(signalEvents.timestamp)
        .limit(100);

      if (overlappingEvents.length > 0) {
        for (const evt of overlappingEvents.slice(0, 20)) {
          const evtTime = new Date(evt.timestamp).getTime();
          let closestPkt = packets[0];
          let closestDelta = Math.abs(evtTime - packets[0].timestamp.getTime());
          for (const pkt of packets.slice(0, 1000)) {
            const d = Math.abs(evtTime - pkt.timestamp.getTime());
            if (d < closestDelta) { closestDelta = d; closestPkt = pkt; }
          }
          temporalAlignment.push({
            packetTime: closestPkt.timestamp.toISOString(),
            eventType: evt.eventType,
            eventDomain: evt.domain,
            eventSource: evt.source,
            deltaMs: closestDelta,
            significance: closestDelta < 1000 ? "STRONG" : closestDelta < 5000 ? "MODERATE" : "WEAK",
          });
        }
        temporalAlignment.sort((a, b) => a.deltaMs - b.deltaMs);
      }
    }
  } catch (err) {
    anomalies.push(`Temporal alignment skipped: ${(err as Error).message}`);
  }

  return {
    filename, packetCount: packets.length,
    timeRange: { start: start.toISOString(), end: end.toISOString(), durationSec },
    protocols, topTalkers, suspiciousPorts, suspiciousIPs,
    dnsQueries, tr069Packets, c2Candidates, ewPackets, ewRatio,
    temporalAlignment, anomalies,
  };
}

export async function fetchGitHubPcaps(repo: string): Promise<{ name: string; downloadUrl: string; size: number }[]> {
  const pcaps: { name: string; downloadUrl: string; size: number }[] = [];
  try {
    const apiUrl = `https://api.github.com/repos/${repo}/contents/`;
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "KAPPA-Forensic-Hypervisor/1.0", Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) return pcaps;
    const items = await res.json() as any[];

    const scanItems = async (entries: any[], path: string) => {
      for (const item of entries) {
        if (item.type === "file" && /\.(pcap|pcapng|cap)$/i.test(item.name)) {
          pcaps.push({ name: `${path}${item.name}`, downloadUrl: item.download_url, size: item.size });
        } else if (item.type === "dir" && pcaps.length < 50) {
          try {
            const subRes = await fetch(item.url, {
              headers: { "User-Agent": "KAPPA-Forensic-Hypervisor/1.0", Accept: "application/vnd.github.v3+json" },
            });
            if (subRes.ok) {
              const subItems = await subRes.json() as any[];
              await scanItems(subItems, `${path}${item.name}/`);
            }
          } catch { /* skip subdirectory errors */ }
        }
      }
    };

    await scanItems(items, "");
  } catch (err) {
    console.error(`[HYPERVISOR] GitHub scan failed for ${repo}:`, (err as Error).message);
  }
  return pcaps;
}

export async function downloadAndAnalyzeGitHubPcap(url: string, filename: string): Promise<PcapAnalysis | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "KAPPA-Forensic-Hypervisor/1.0" } });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    const existing = await db.select().from(pcapUploads).where(eq(pcapUploads.hash, hash)).limit(1);
    if (existing.length > 0) {
      console.log(`[HYPERVISOR] PCAP ${filename} already analyzed (hash match)`);
      return null;
    }

    const analysis = await analyzePcap(buffer, filename);

    await db.insert(pcapUploads).values({
      filename,
      filesize: buffer.length,
      packetCount: analysis.packetCount,
      findings: analysis as any,
      anomalies: analysis.anomalies,
      status: "complete",
      hash,
    });

    console.log(`[HYPERVISOR] GitHub PCAP analyzed: ${filename} — ${analysis.packetCount} packets, ${analysis.anomalies.length} anomalies`);
    return analysis;
  } catch (err) {
    console.error(`[HYPERVISOR] Failed to analyze ${filename}:`, (err as Error).message);
    return null;
  }
}

export async function scanGitHubRepos(): Promise<{ repo: string; files: number; analyzed: number; anomalies: number }[]> {
  const repos = ["spwotton/skypescanner", "spwotton/wifi"];
  const results = [];

  for (const repo of repos) {
    console.log(`[HYPERVISOR] Scanning GitHub repo: ${repo}`);
    const pcaps = await fetchGitHubPcaps(repo);
    let analyzed = 0;
    let totalAnomalies = 0;

    for (const pcap of pcaps.slice(0, 10)) {
      if (pcap.size > 50 * 1024 * 1024) continue;
      const analysis = await downloadAndAnalyzeGitHubPcap(pcap.downloadUrl, `${repo}/${pcap.name}`);
      if (analysis) {
        analyzed++;
        totalAnomalies += analysis.anomalies.length;
      }
    }

    results.push({ repo, files: pcaps.length, analyzed, anomalies: totalAnomalies });
    console.log(`[HYPERVISOR] ${repo}: ${pcaps.length} PCAPs found, ${analyzed} analyzed, ${totalAnomalies} anomalies`);
  }

  return results;
}

export async function getForensicReports(limit: number = 20) {
  return db.select().from(forensicReports).orderBy(desc(forensicReports.timestamp)).limit(limit);
}

export async function getPcapUploads(limit: number = 50) {
  return db.select().from(pcapUploads).orderBy(desc(pcapUploads.timestamp)).limit(limit);
}

export function startHypervisor(intervalMinutes: number = 30) {
  if (hypervisorState.running) return;
  hypervisorState.running = true;

  setTimeout(async () => {
    try {
      await runForensicAnalysis();
    } catch (err) {
      console.error("[HYPERVISOR] Initial analysis failed:", (err as Error).message);
    }
  }, 30000);

  hypervisorState.intervalId = setInterval(async () => {
    try {
      await runForensicAnalysis();
    } catch (err) {
      console.error("[HYPERVISOR] Scheduled analysis failed:", (err as Error).message);
    }
  }, intervalMinutes * 60 * 1000);

  console.log(`[HYPERVISOR] Forensic hypervisor started — runs every ${intervalMinutes}min, first analysis in 30s`);
}

export function stopHypervisor() {
  if (hypervisorState.intervalId) clearInterval(hypervisorState.intervalId);
  hypervisorState.running = false;
  console.log("[HYPERVISOR] Forensic hypervisor stopped");
}
