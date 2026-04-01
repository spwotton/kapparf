const HEARTBEAT_URL = "https://heartbeat-tracker-monitor.replit.app";
const POLL_INTERVAL_MS = 30_000;

export interface TrackerDevice {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  os: string;
  ip: string | null;
  capabilities: string[];
  metadata: Record<string, unknown>;
  online: boolean;
  registeredAt: string;
  lastHeartbeat: string | null;
  lastDisconnect: string | null;
  latitude: number | null;
  longitude: number | null;
  healthScore: number | null;
  jitterMs: number | null;
  uptimePct24h: number | null;
}

export interface TrackerDeviceDetail extends TrackerDevice {
  recentHeartbeats: TrackerHeartbeat[];
  activeAlerts: TrackerAlert[];
}

export interface TrackerHeartbeat {
  id: string;
  deviceId: string;
  timestamp: string;
  latencyMs: number | null;
  metadata: Record<string, unknown>;
}

export interface TrackerAlert {
  id: string;
  deviceId: string;
  type: string;
  message: string;
  severity: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  acknowledged: boolean;
}

export interface TrackerStats {
  total: number;
  online: number;
  offline: number;
  byType: { pc: number; phone: number; sensor: number; iot: number };
  uptimePercent24h: number;
}

export interface TrackerKappaStatus {
  devices: TrackerDevice[];
  onlineCount: number;
  alerts: TrackerAlert[];
  recentHeartbeats: Record<string, { lastSeen: string; latencyMs: number | null; metadata: any }>;
  serverUptime: number;
}

export interface TrackerSensorReading {
  id: string;
  deviceId: string;
  sensorType: string;
  timestamp: string;
  values: Record<string, unknown>;
}

let cachedStatus: TrackerKappaStatus | null = null;
let cachedStats: TrackerStats | null = null;
let lastFetch = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${HEARTBEAT_URL}/api${path}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch (err) {
    return null;
  }
}

async function postJSON<T>(path: string, body: any): Promise<T | null> {
  try {
    const res = await fetch(`${HEARTBEAT_URL}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

async function pollTracker() {
  const [status, stats] = await Promise.all([
    fetchJSON<TrackerKappaStatus>("/kappa/status"),
    fetchJSON<TrackerStats>("/devices/stats"),
  ]);
  if (status) cachedStatus = status;
  if (stats) cachedStats = stats;
  lastFetch = Date.now();
}

export function startHeartbeatClient() {
  if (pollTimer) return;
  pollTracker();
  pollTimer = setInterval(pollTracker, POLL_INTERVAL_MS);
  console.log(`[HeartbeatClient] Polling ${HEARTBEAT_URL} every ${POLL_INTERVAL_MS / 1000}s`);
}

export function stopHeartbeatClient() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function getTrackerStatus(): TrackerKappaStatus & { lastFetch: number; trackerUrl: string; polling: boolean } {
  return {
    devices: cachedStatus?.devices || [],
    onlineCount: cachedStatus?.onlineCount || 0,
    alerts: cachedStatus?.alerts || [],
    recentHeartbeats: cachedStatus?.recentHeartbeats || {},
    serverUptime: cachedStatus?.serverUptime || 0,
    lastFetch,
    trackerUrl: HEARTBEAT_URL,
    polling: !!pollTimer,
  };
}

export function getTrackerStats(): TrackerStats & { lastFetch: number } {
  return {
    total: cachedStats?.total || 0,
    online: cachedStats?.online || 0,
    offline: cachedStats?.offline || 0,
    byType: cachedStats?.byType || { pc: 0, phone: 0, sensor: 0, iot: 0 },
    uptimePercent24h: cachedStats?.uptimePercent24h || 0,
    lastFetch,
  };
}

export async function getTrackerDevices(filters?: { type?: string; online?: boolean }): Promise<TrackerDevice[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.online !== undefined) params.set("online", String(filters.online));
  const qs = params.toString();
  const devices = await fetchJSON<TrackerDevice[]>(`/devices${qs ? "?" + qs : ""}`);
  return devices || cachedStatus?.devices || [];
}

export async function getTrackerDevice(deviceId: string): Promise<TrackerDeviceDetail | null> {
  return fetchJSON<TrackerDeviceDetail>(`/devices/${deviceId}`);
}

export async function getTrackerAlerts(filters?: { deviceId?: string; severity?: number; acknowledged?: boolean; limit?: number }): Promise<TrackerAlert[]> {
  const params = new URLSearchParams();
  if (filters?.deviceId) params.set("deviceId", filters.deviceId);
  if (filters?.severity !== undefined) params.set("severity", String(filters.severity));
  if (filters?.acknowledged !== undefined) params.set("acknowledged", String(filters.acknowledged));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return await fetchJSON<TrackerAlert[]>(`/alerts${qs ? "?" + qs : ""}`) || [];
}

export async function getActiveAlerts(): Promise<TrackerAlert[]> {
  return await fetchJSON<TrackerAlert[]>("/alerts/active") || [];
}

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const result = await postJSON<{ acknowledged: boolean }>(`/alerts/${alertId}/acknowledge`, {});
  return result?.acknowledged || false;
}

export async function getDeviceSensors(deviceId: string, opts?: { type?: string; hours?: number; limit?: number }): Promise<TrackerSensorReading[]> {
  const params = new URLSearchParams();
  if (opts?.type) params.set("type", opts.type);
  if (opts?.hours) params.set("hours", String(opts.hours));
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return await fetchJSON<TrackerSensorReading[]>(`/sensors/${deviceId}${qs ? "?" + qs : ""}`) || [];
}

export async function getDeviceLatestSensors(deviceId: string): Promise<Record<string, TrackerSensorReading>> {
  return await fetchJSON<Record<string, TrackerSensorReading>>(`/sensors/${deviceId}/latest`) || {};
}

export async function getHeartbeatHistory(deviceId: string, hours = 24, limit = 1000): Promise<TrackerHeartbeat[]> {
  return await fetchJSON<TrackerHeartbeat[]>(`/heartbeat/${deviceId}/history?hours=${hours}&limit=${limit}`) || [];
}

export async function sendDeviceCommand(deviceId: string, command: string, args?: object): Promise<{ sent: boolean }> {
  const result = await postJSON<{ sent: boolean }>("/kappa/command", { deviceId, command, args });
  return result || { sent: false };
}

export function getAgentScriptUrl(type: "pc" | "phone" | "bash"): string {
  return `${HEARTBEAT_URL}/api/agents/${type}`;
}

export function getTrackerDashboardUrl(): string {
  return HEARTBEAT_URL;
}

export function getWebSocketUrl(deviceId: string): string {
  return `wss://heartbeat-tracker-monitor.replit.app/ws?deviceId=${deviceId}`;
}

export interface BulkDeviceStatus {
  deviceId: string;
  online: boolean;
  lastHeartbeat: string | null;
  healthScore: number | null;
  latencyMs: number | null;
  jitterMs: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CommandLogEntry {
  id: string;
  deviceId: string;
  command: string;
  args: Record<string, unknown>;
  sentAt: string;
  result: string | null;
  respondedAt: string | null;
}

export interface UptimeHistoryEntry {
  hour: string;
  onlineMinutes: number;
  totalMinutes: number;
  uptimePct: number;
}

export async function getBulkStatus(): Promise<BulkDeviceStatus[]> {
  return await fetchJSON<BulkDeviceStatus[]>("/devices/bulk-status") || [];
}

export async function getDeviceHealthScore(deviceId: string): Promise<{ healthScore: number; factors: Record<string, number> } | null> {
  return fetchJSON(`/devices/${deviceId}/health`);
}

export async function getCommandLog(deviceId?: string, limit = 50): Promise<CommandLogEntry[]> {
  const params = new URLSearchParams();
  if (deviceId) params.set("deviceId", deviceId);
  params.set("limit", String(limit));
  return await fetchJSON<CommandLogEntry[]>(`/commands/log?${params}`) || [];
}

export async function getUptimeHistory(deviceId: string, hours = 48): Promise<UptimeHistoryEntry[]> {
  return await fetchJSON<UptimeHistoryEntry[]>(`/uptime/${deviceId}/history?hours=${hours}`) || [];
}

export async function getSensorThresholds(deviceId: string): Promise<Record<string, { min?: number; max?: number }>> {
  return await fetchJSON<Record<string, { min?: number; max?: number }>>(`/sensors/${deviceId}/thresholds`) || {};
}

export async function setSensorThreshold(deviceId: string, sensorType: string, min?: number, max?: number): Promise<boolean> {
  const result = await postJSON<{ ok: boolean }>(`/sensors/${deviceId}/thresholds`, { sensorType, min, max });
  return result?.ok || false;
}

export async function registerWebhook(url: string, events: string[]): Promise<boolean> {
  const result = await postJSON<{ id: string }>("/webhooks", { url, events });
  return !!result?.id;
}

export async function updateDeviceLocation(deviceId: string, lat: number, lon: number): Promise<boolean> {
  const result = await postJSON<{ updated: boolean }>(`/devices/${deviceId}/location`, { latitude: lat, longitude: lon });
  return result?.updated || false;
}
