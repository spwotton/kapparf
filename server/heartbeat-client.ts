/**
 * Fleet Tracker — native KAPPA implementation
 * Replaces the external heartbeat-tracker-monitor.replit.app proxy.
 * All data stored in KAPPA's PostgreSQL database.
 */
import { db } from "./db";
import {
  fleetDevices, fleetHeartbeats, fleetAlerts,
  fleetSensorReadings, fleetCommandLog,
} from "@shared/schema";
import { eq, desc, gte, and, isNull, not, sql } from "drizzle-orm";

const SERVER_START = Date.now();
const TIMEOUT_MS = 45_000;
const MONITOR_INTERVAL_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

// ─── In-memory sensor thresholds (ephemeral config) ──────────────────────────
const sensorThresholds = new Map<string, Record<string, { min?: number; max?: number }>>();

// ─── Exported interfaces (unchanged from proxy version) ──────────────────────

export interface TrackerDevice {
  id: string; deviceId: string; name: string; type: string; os: string;
  ip: string | null; capabilities: string[]; metadata: Record<string, unknown>;
  online: boolean; registeredAt: string; lastHeartbeat: string | null;
  lastDisconnect: string | null; latitude: number | null; longitude: number | null;
  healthScore: number | null; jitterMs: number | null; uptimePct24h: number | null;
}
export interface TrackerDeviceDetail extends TrackerDevice {
  recentHeartbeats: TrackerHeartbeat[]; activeAlerts: TrackerAlert[];
}
export interface TrackerHeartbeat {
  id: string; deviceId: string; timestamp: string;
  latencyMs: number | null; metadata: Record<string, unknown>;
}
export interface TrackerAlert {
  id: string; deviceId: string; type: string; message: string;
  severity: number; metadata: Record<string, unknown>;
  createdAt: string; acknowledged: boolean;
}
export interface TrackerStats {
  total: number; online: number; offline: number;
  byType: { pc: number; phone: number; sensor: number; iot: number };
  uptimePercent24h: number;
}
export interface TrackerKappaStatus {
  devices: TrackerDevice[]; onlineCount: number; alerts: TrackerAlert[];
  recentHeartbeats: Record<string, { lastSeen: string; latencyMs: number | null; metadata: any }>;
  serverUptime: number;
}
export interface TrackerSensorReading {
  id: string; deviceId: string; sensorType: string; timestamp: string;
  values: Record<string, unknown>;
}
export interface BulkDeviceStatus {
  deviceId: string; online: boolean; lastHeartbeat: string | null;
  healthScore: number | null; latencyMs: number | null; jitterMs: number | null;
  latitude: number | null; longitude: number | null;
}
export interface CommandLogEntry {
  id: string; deviceId: string; command: string;
  args: Record<string, unknown>; sentAt: string;
  result: string | null; respondedAt: string | null;
}
export interface UptimeHistoryEntry {
  hour: string; onlineMinutes: number; totalMinutes: number; uptimePct: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToDevice(r: any): TrackerDevice {
  return {
    id: r.id, deviceId: r.deviceId, name: r.name, type: r.type, os: r.os,
    ip: r.ip ?? null, capabilities: r.capabilities ?? [],
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    online: r.online ?? false,
    registeredAt: (r.registeredAt as Date).toISOString(),
    lastHeartbeat: r.lastHeartbeat ? (r.lastHeartbeat as Date).toISOString() : null,
    lastDisconnect: r.lastDisconnect ? (r.lastDisconnect as Date).toISOString() : null,
    latitude: r.latitude ?? null, longitude: r.longitude ?? null,
    healthScore: null, jitterMs: r.jitterMs ?? null, uptimePct24h: null,
  };
}

function rowToHeartbeat(r: any): TrackerHeartbeat {
  return {
    id: r.id, deviceId: r.deviceId,
    timestamp: (r.timestamp as Date).toISOString(),
    latencyMs: r.latencyMs ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
  };
}

function rowToAlert(r: any): TrackerAlert {
  return {
    id: r.id, deviceId: r.deviceId, type: r.type, message: r.message,
    severity: r.severity,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: (r.createdAt as Date).toISOString(),
    acknowledged: r.acknowledged ?? false,
  };
}

// ─── Background monitor (marks devices offline after 45s silence) ─────────────

let monitorTimer: ReturnType<typeof setInterval> | null = null;

async function runMonitor() {
  try {
    const cutoff = new Date(Date.now() - TIMEOUT_MS);
    // Find online devices whose last heartbeat is older than cutoff
    const stale = await db.select({ deviceId: fleetDevices.deviceId, id: fleetDevices.id })
      .from(fleetDevices)
      .where(and(
        eq(fleetDevices.online, true),
        sql`${fleetDevices.lastHeartbeat} < ${cutoff}`,
      ));

    for (const dev of stale) {
      await db.update(fleetDevices)
        .set({ online: false, lastDisconnect: new Date() })
        .where(eq(fleetDevices.deviceId, dev.deviceId));
      // Create timeout alert
      await db.insert(fleetAlerts).values({
        deviceId: dev.deviceId, type: "timeout",
        message: `Device timed out (no heartbeat for ${TIMEOUT_MS / 1000}s)`,
        severity: 2, metadata: {},
      });
    }

    // Cleanup: remove heartbeats older than 24h, sensor readings older than 6h
    const h24 = new Date(Date.now() - 86_400_000);
    const h6 = new Date(Date.now() - 21_600_000);
    const d7 = new Date(Date.now() - 7 * 86_400_000);
    await db.delete(fleetHeartbeats).where(sql`${fleetHeartbeats.timestamp} < ${h24}`);
    await db.delete(fleetSensorReadings).where(sql`${fleetSensorReadings.timestamp} < ${h6}`);
    await db.delete(fleetAlerts).where(
      and(eq(fleetAlerts.acknowledged, true), sql`${fleetAlerts.createdAt} < ${d7}`)
    );
  } catch { /* non-fatal */ }
}

export function startHeartbeatClient() {
  if (monitorTimer) return;
  runMonitor();
  monitorTimer = setInterval(runMonitor, MONITOR_INTERVAL_MS);
  console.log(`[FleetTracker] Native tracker started — monitoring every ${MONITOR_INTERVAL_MS / 1000}s, timeout at ${TIMEOUT_MS / 1000}s`);
}

export function stopHeartbeatClient() {
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
}

// ─── Inbound: register / heartbeat / sensors (device → KAPPA) ────────────────

export async function nativeRegisterDevice(data: {
  deviceId: string; name: string; type: string; os: string;
  capabilities?: string[]; metadata?: Record<string, unknown>; ip?: string;
}): Promise<TrackerDevice> {
  const now = new Date();
  const rows = await db.insert(fleetDevices).values({
    deviceId: data.deviceId, name: data.name, type: data.type, os: data.os,
    ip: data.ip ?? null, capabilities: data.capabilities ?? [],
    metadata: data.metadata ?? {}, online: true,
    registeredAt: now, lastHeartbeat: now,
  }).onConflictDoUpdate({
    target: fleetDevices.deviceId,
    set: {
      name: data.name, type: data.type, os: data.os,
      ip: data.ip ?? null, capabilities: data.capabilities ?? [],
      metadata: data.metadata ?? {}, online: true, lastHeartbeat: now,
    },
  }).returning();
  return rowToDevice(rows[0]);
}

export async function nativeReceiveHeartbeat(
  deviceId: string, metadata: Record<string, unknown> = {}, ip?: string
): Promise<{ ack: boolean; serverTime: number; nextExpectedMs: number }> {
  const serverTime = Date.now();
  let latencyMs: number | null = null;
  if (typeof metadata.clientTimestamp === "number") {
    latencyMs = serverTime - metadata.clientTimestamp;
  }

  // Get last heartbeat time for interval tracking
  const [dev] = await db.select({ lastHeartbeat: fleetDevices.lastHeartbeat })
    .from(fleetDevices).where(eq(fleetDevices.deviceId, deviceId));

  const enriched = { ...metadata, _serverTime: serverTime, latencyMs };
  if (dev?.lastHeartbeat) {
    enriched._intervalMs = serverTime - (dev.lastHeartbeat as Date).getTime();
  }

  // Upsert online + last heartbeat
  await db.update(fleetDevices)
    .set({ online: true, lastHeartbeat: new Date(serverTime), ip: ip ?? null })
    .where(eq(fleetDevices.deviceId, deviceId));

  // Record heartbeat
  await db.insert(fleetHeartbeats).values({
    deviceId, timestamp: new Date(serverTime), latencyMs, metadata: enriched,
  });

  return { ack: true, serverTime, nextExpectedMs: HEARTBEAT_INTERVAL_MS };
}

export async function nativeIngestSensors(
  deviceId: string,
  readings: { sensorType: string; timestamp: number; values: Record<string, unknown> }[]
): Promise<number> {
  if (!readings.length) return 0;
  await db.insert(fleetSensorReadings).values(
    readings.map(r => ({
      deviceId, sensorType: r.sensorType,
      timestamp: new Date(r.timestamp), values: r.values,
    }))
  );
  return readings.length;
}

export async function nativeDeleteDevice(deviceId: string): Promise<boolean> {
  await db.delete(fleetHeartbeats).where(eq(fleetHeartbeats.deviceId, deviceId));
  await db.delete(fleetAlerts).where(eq(fleetAlerts.deviceId, deviceId));
  await db.delete(fleetSensorReadings).where(eq(fleetSensorReadings.deviceId, deviceId));
  await db.delete(fleetCommandLog).where(eq(fleetCommandLog.deviceId, deviceId));
  const result = await db.delete(fleetDevices).where(eq(fleetDevices.deviceId, deviceId)).returning();
  return result.length > 0;
}

// ─── Getter functions (KAPPA UI → native DB) ─────────────────────────────────

export function getTrackerStatus(): TrackerKappaStatus & { lastFetch: number; trackerUrl: string; polling: boolean; connected: boolean } {
  // Return a lightweight sync response — UI will call individual endpoints for detail
  return {
    devices: [], onlineCount: 0, alerts: [], recentHeartbeats: {},
    serverUptime: Math.floor((Date.now() - SERVER_START) / 1000),
    lastFetch: Date.now(),
    trackerUrl: "native",
    polling: !!monitorTimer,
    connected: true,
  };
}

export function getTrackerStats(): TrackerStats & { lastFetch: number } {
  return {
    total: 0, online: 0, offline: 0,
    byType: { pc: 0, phone: 0, sensor: 0, iot: 0 },
    uptimePercent24h: 0, lastFetch: Date.now(),
  };
}

export async function getTrackerDevices(filters?: { type?: string; online?: boolean }): Promise<TrackerDevice[]> {
  const conditions = [];
  if (filters?.type) conditions.push(eq(fleetDevices.type, filters.type));
  if (filters?.online !== undefined) conditions.push(eq(fleetDevices.online, filters.online));
  const rows = conditions.length
    ? await db.select().from(fleetDevices).where(and(...conditions)).orderBy(desc(fleetDevices.lastHeartbeat))
    : await db.select().from(fleetDevices).orderBy(desc(fleetDevices.lastHeartbeat));
  return rows.map(rowToDevice);
}

export async function getTrackerDevice(deviceId: string): Promise<TrackerDeviceDetail | null> {
  const [dev] = await db.select().from(fleetDevices).where(eq(fleetDevices.deviceId, deviceId));
  if (!dev) return null;
  const cutoff24h = new Date(Date.now() - 86_400_000);
  const [heartbeats, alerts] = await Promise.all([
    db.select().from(fleetHeartbeats)
      .where(and(eq(fleetHeartbeats.deviceId, deviceId), gte(fleetHeartbeats.timestamp, cutoff24h)))
      .orderBy(desc(fleetHeartbeats.timestamp)).limit(20),
    db.select().from(fleetAlerts)
      .where(and(eq(fleetAlerts.deviceId, deviceId), eq(fleetAlerts.acknowledged, false)))
      .orderBy(desc(fleetAlerts.createdAt)).limit(10),
  ]);
  return {
    ...rowToDevice(dev),
    recentHeartbeats: heartbeats.map(rowToHeartbeat),
    activeAlerts: alerts.map(rowToAlert),
  };
}

export async function getTrackerAlerts(filters?: {
  deviceId?: string; severity?: number; acknowledged?: boolean; limit?: number;
}): Promise<TrackerAlert[]> {
  const conditions = [];
  if (filters?.deviceId) conditions.push(eq(fleetAlerts.deviceId, filters.deviceId));
  if (filters?.severity !== undefined) conditions.push(eq(fleetAlerts.severity, filters.severity));
  if (filters?.acknowledged !== undefined) conditions.push(eq(fleetAlerts.acknowledged, filters.acknowledged));
  const limit = filters?.limit ?? 50;
  const rows = conditions.length
    ? await db.select().from(fleetAlerts).where(and(...conditions)).orderBy(desc(fleetAlerts.createdAt)).limit(limit)
    : await db.select().from(fleetAlerts).orderBy(desc(fleetAlerts.createdAt)).limit(limit);
  return rows.map(rowToAlert);
}

export async function getActiveAlerts(): Promise<TrackerAlert[]> {
  const rows = await db.select().from(fleetAlerts)
    .where(eq(fleetAlerts.acknowledged, false))
    .orderBy(desc(fleetAlerts.createdAt)).limit(50);
  return rows.map(rowToAlert);
}

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const result = await db.update(fleetAlerts)
    .set({ acknowledged: true })
    .where(eq(fleetAlerts.id, alertId)).returning();
  return result.length > 0;
}

export async function getDeviceSensors(deviceId: string, opts?: { type?: string; hours?: number; limit?: number }): Promise<TrackerSensorReading[]> {
  const hours = opts?.hours ?? 1;
  const limit = opts?.limit ?? 500;
  const cutoff = new Date(Date.now() - hours * 3_600_000);
  const conditions = [eq(fleetSensorReadings.deviceId, deviceId), gte(fleetSensorReadings.timestamp, cutoff)];
  if (opts?.type) conditions.push(eq(fleetSensorReadings.sensorType, opts.type));
  const rows = await db.select().from(fleetSensorReadings)
    .where(and(...conditions)).orderBy(desc(fleetSensorReadings.timestamp)).limit(limit);
  return rows.map(r => ({
    id: r.id, deviceId: r.deviceId, sensorType: r.sensorType,
    timestamp: (r.timestamp as Date).toISOString(),
    values: r.values as Record<string, unknown>,
  }));
}

export async function getDeviceLatestSensors(deviceId: string): Promise<Record<string, TrackerSensorReading>> {
  // Get distinct sensor types then fetch latest of each
  const types = await db.selectDistinct({ sensorType: fleetSensorReadings.sensorType })
    .from(fleetSensorReadings).where(eq(fleetSensorReadings.deviceId, deviceId));
  const result: Record<string, TrackerSensorReading> = {};
  await Promise.all(types.map(async ({ sensorType }) => {
    const [row] = await db.select().from(fleetSensorReadings)
      .where(and(eq(fleetSensorReadings.deviceId, deviceId), eq(fleetSensorReadings.sensorType, sensorType)))
      .orderBy(desc(fleetSensorReadings.timestamp)).limit(1);
    if (row) result[sensorType] = {
      id: row.id, deviceId: row.deviceId, sensorType: row.sensorType,
      timestamp: (row.timestamp as Date).toISOString(),
      values: row.values as Record<string, unknown>,
    };
  }));
  return result;
}

export async function getHeartbeatHistory(deviceId: string, hours = 24, limit = 1000): Promise<TrackerHeartbeat[]> {
  const cutoff = new Date(Date.now() - hours * 3_600_000);
  const rows = await db.select().from(fleetHeartbeats)
    .where(and(eq(fleetHeartbeats.deviceId, deviceId), gte(fleetHeartbeats.timestamp, cutoff)))
    .orderBy(desc(fleetHeartbeats.timestamp)).limit(limit);
  return rows.map(rowToHeartbeat);
}

export async function sendDeviceCommand(deviceId: string, command: string, args?: object): Promise<{ sent: boolean }> {
  try {
    await db.insert(fleetCommandLog).values({
      deviceId, command, args: (args ?? {}) as any, sentAt: new Date(),
    });
    return { sent: true };
  } catch { return { sent: false }; }
}

export async function getBulkStatus(): Promise<BulkDeviceStatus[]> {
  const rows = await db.select().from(fleetDevices).orderBy(desc(fleetDevices.lastHeartbeat));
  return rows.map(r => ({
    deviceId: r.deviceId, online: r.online ?? false,
    lastHeartbeat: r.lastHeartbeat ? (r.lastHeartbeat as Date).toISOString() : null,
    healthScore: null, latencyMs: null, jitterMs: null,
    latitude: r.latitude ?? null, longitude: r.longitude ?? null,
  }));
}

export async function getDeviceHealthScore(deviceId: string): Promise<{ healthScore: number; factors: Record<string, number> } | null> {
  const [dev] = await db.select().from(fleetDevices).where(eq(fleetDevices.deviceId, deviceId));
  if (!dev) return null;
  const onlineFactor = dev.online ? 1 : 0;
  const recentCutoff = new Date(Date.now() - 300_000);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(fleetHeartbeats)
    .where(and(eq(fleetHeartbeats.deviceId, deviceId), gte(fleetHeartbeats.timestamp, recentCutoff)));
  const recentFactor = Math.min(Number(count) / 20, 1);
  const healthScore = Math.round((onlineFactor * 0.6 + recentFactor * 0.4) * 100);
  return { healthScore, factors: { online: onlineFactor, recentActivity: recentFactor } };
}

export async function getCommandLog(deviceId?: string, limit = 50): Promise<CommandLogEntry[]> {
  const rows = deviceId
    ? await db.select().from(fleetCommandLog).where(eq(fleetCommandLog.deviceId, deviceId)).orderBy(desc(fleetCommandLog.sentAt)).limit(limit)
    : await db.select().from(fleetCommandLog).orderBy(desc(fleetCommandLog.sentAt)).limit(limit);
  return rows.map(r => ({
    id: r.id, deviceId: r.deviceId, command: r.command,
    args: (r.args as Record<string, unknown>) ?? {},
    sentAt: (r.sentAt as Date).toISOString(),
    result: r.result ?? null,
    respondedAt: r.respondedAt ? (r.respondedAt as Date).toISOString() : null,
  }));
}

export async function getUptimeHistory(deviceId: string, hours = 48): Promise<UptimeHistoryEntry[]> {
  const cutoff = new Date(Date.now() - hours * 3_600_000);
  const rows = await db.select().from(fleetHeartbeats)
    .where(and(eq(fleetHeartbeats.deviceId, deviceId), gte(fleetHeartbeats.timestamp, cutoff)))
    .orderBy(fleetHeartbeats.timestamp);
  // Bucket into hourly bins
  const bins = new Map<string, number>();
  for (const r of rows) {
    const d = r.timestamp as Date;
    const h = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).toISOString();
    bins.set(h, (bins.get(h) ?? 0) + 1);
  }
  return Array.from(bins.entries()).map(([hour, count]) => ({
    hour, onlineMinutes: Math.min(count * 0.25, 60),
    totalMinutes: 60, uptimePct: Math.min((count * 0.25 / 60) * 100, 100),
  }));
}

export async function getSensorThresholds(deviceId: string): Promise<Record<string, { min?: number; max?: number }>> {
  return sensorThresholds.get(deviceId) ?? {};
}

export async function setSensorThreshold(deviceId: string, sensorType: string, min?: number, max?: number): Promise<boolean> {
  const existing = sensorThresholds.get(deviceId) ?? {};
  sensorThresholds.set(deviceId, { ...existing, [sensorType]: { min, max } });
  return true;
}

export async function updateDeviceLocation(deviceId: string, lat: number, lon: number): Promise<boolean> {
  const result = await db.update(fleetDevices)
    .set({ latitude: lat, longitude: lon })
    .where(eq(fleetDevices.deviceId, deviceId)).returning();
  return result.length > 0;
}

// ─── Agent script URL helpers (now point to KAPPA itself) ────────────────────

export function getAgentScriptUrl(type: "pc" | "phone" | "bash"): string {
  return `/api/agents/${type}`;
}

export function getTrackerDashboardUrl(): string {
  return "/fleet";
}

export function getWebSocketUrl(deviceId: string): string {
  return `/ws?deviceId=${deviceId}`;
}
