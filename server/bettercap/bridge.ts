export interface BettercapInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  scheme: "http" | "https";
  username: string;
  password: string;
  connected: boolean;
  lastPing: number;
  lastError: string | null;
  version: string | null;
  os: string | null;
  arch: string | null;
}

export interface BettercapSession {
  version: string;
  os: string;
  arch: string;
  goversion: string;
  interface: BettercapInterface;
  gateway: BettercapInterface;
  env: { data: Record<string, string> };
  lan: { hosts: BettercapHost[] };
  wifi: { aps: BettercapAP[] };
  ble: { devices: BettercapBLEDevice[] };
  hid: { devices: any[] };
  can: { devices: any[] };
  packets: { traffic: Record<string, { sent: number; received: number }>; Protos: Record<string, number> };
  started_at: string;
  polled_at: string;
  active: boolean;
  gps: { latitude: number; longitude: number; altitude: number; fix: boolean };
  modules: BettercapModule[];
}

export interface BettercapInterface {
  ipv4: string;
  ipv6: string;
  mac: string;
  hostname: string;
  alias: string;
  vendor: string;
}

export interface BettercapHost {
  ipv4: string;
  ipv6: string;
  mac: string;
  hostname: string;
  alias: string;
  vendor: string;
  first_seen: string;
  last_seen: string;
  meta: Record<string, any>;
  sent?: number;
  received?: number;
}

export interface BettercapAP {
  ipv4: string;
  mac: string;
  hostname: string;
  alias: string;
  vendor: string;
  frequency: number;
  channel?: number;
  rssi: number;
  sent: number;
  received: number;
  encryption: string;
  cipher: string;
  authentication: string;
  handshake: boolean;
  clients: BettercapClient[];
  first_seen: string;
  last_seen: string;
  wps?: Record<string, any>;
}

export interface BettercapClient {
  mac: string;
  alias: string;
  vendor: string;
  rssi: number;
  sent: number;
  received: number;
  first_seen: string;
  last_seen: string;
}

export interface BettercapBLEDevice {
  mac: string;
  name: string;
  alias: string;
  vendor: string;
  rssi: number;
  connectable: boolean;
  advertisement_data: any;
  service_uuids: string[];
  services: any[];
  flags: number;
  first_seen: string;
  last_seen: string;
}

export interface BettercapModule {
  name: string;
  running: boolean;
  description: string;
  author: string;
  handlers: { name: string; description: string }[];
  parameters: Record<string, { name: string; type: string; description: string; value: string; current_value: string; validator: string }>;
  state: any;
}

export interface BettercapEvent {
  tag: string;
  time: string;
  data: any;
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

const instances = new Map<string, BettercapInstance>();
const sessionCache = new Map<string, BettercapSession>();
const eventsCache = new Map<string, BettercapEvent[]>();
const commandHistory = new Map<string, string[]>();

function makeAuthHeader(instance: BettercapInstance): string {
  return "Basic " + Buffer.from(`${instance.username}:${instance.password}`).toString("base64");
}

function apiUrl(instance: BettercapInstance): string {
  return `${instance.scheme}://${instance.host}:${instance.port}/api`;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export function addInstance(config: {
  name: string;
  host: string;
  port: number;
  scheme?: "http" | "https";
  username: string;
  password: string;
}): BettercapInstance {
  const id = `bc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const instance: BettercapInstance = {
    id,
    name: config.name,
    host: config.host,
    port: config.port,
    scheme: config.scheme || "http",
    username: config.username,
    password: config.password,
    connected: false,
    lastPing: 0,
    lastError: null,
    version: null,
    os: null,
    arch: null,
  };
  instances.set(id, instance);
  commandHistory.set(id, []);
  return sanitizeInstance(instance);
}

export function removeInstance(id: string): boolean {
  sessionCache.delete(id);
  eventsCache.delete(id);
  commandHistory.delete(id);
  return instances.delete(id);
}

export interface BettercapInstanceSafe {
  id: string;
  name: string;
  host: string;
  port: number;
  scheme: string;
  connected: boolean;
  lastPing: number;
  lastError: string | null;
  version: string | null;
  os: string | null;
  arch: string | null;
}

function sanitizeInstance(inst: BettercapInstance): BettercapInstanceSafe {
  return {
    id: inst.id,
    name: inst.name,
    host: inst.host,
    port: inst.port,
    scheme: inst.scheme,
    connected: inst.connected,
    lastPing: inst.lastPing,
    lastError: inst.lastError,
    version: inst.version,
    os: inst.os,
    arch: inst.arch,
  };
}

export function getInstances(): BettercapInstanceSafe[] {
  return Array.from(instances.values()).map(sanitizeInstance);
}

export function getInstance(id: string): BettercapInstance | undefined {
  return instances.get(id);
}

export async function fetchSession(id: string): Promise<BettercapSession | null> {
  const inst = instances.get(id);
  if (!inst) return null;

  try {
    const start = Date.now();
    const res = await fetchWithTimeout(
      `${apiUrl(inst)}/session`,
      { headers: { Authorization: makeAuthHeader(inst) } }
    );

    if (res.status === 401) {
      inst.connected = false;
      inst.lastError = "Authentication failed";
      return null;
    }

    if (!res.ok) {
      inst.connected = false;
      inst.lastError = `HTTP ${res.status}`;
      return null;
    }

    const session = (await res.json()) as BettercapSession;
    inst.connected = true;
    inst.lastPing = Date.now() - start;
    inst.lastError = null;
    inst.version = session.version;
    inst.os = session.os;
    inst.arch = session.arch;
    sessionCache.set(id, session);
    return session;
  } catch (err: any) {
    inst.connected = false;
    inst.lastError = err.message || "Connection failed";
    return sessionCache.get(id) || null;
  }
}

export async function fetchEvents(id: string, n = 50): Promise<BettercapEvent[]> {
  const inst = instances.get(id);
  if (!inst) return [];

  try {
    const res = await fetchWithTimeout(
      `${apiUrl(inst)}/events?n=${n}`,
      { headers: { Authorization: makeAuthHeader(inst) } }
    );

    if (!res.ok) return eventsCache.get(id) || [];

    const events = (await res.json()) as BettercapEvent[];
    eventsCache.set(id, events);
    return events;
  } catch {
    return eventsCache.get(id) || [];
  }
}

export async function sendCommand(id: string, cmd: string): Promise<CommandResult> {
  const inst = instances.get(id);
  if (!inst) return { success: false, error: "Instance not found" };

  const history = commandHistory.get(id) || [];
  history.push(cmd);
  if (history.length > 500) history.shift();
  commandHistory.set(id, history);

  try {
    const res = await fetchWithTimeout(
      `${apiUrl(inst)}/session`,
      {
        method: "POST",
        headers: {
          Authorization: makeAuthHeader(inst),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cmd }),
      },
      10000
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `HTTP ${res.status}: ${text}` };
    }

    const text = await res.text();
    return { success: true, output: text };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function getCommandHistory(id: string): string[] {
  return commandHistory.get(id) || [];
}

export function getCachedSession(id: string): BettercapSession | null {
  return sessionCache.get(id) || null;
}

export function getCachedEvents(id: string): BettercapEvent[] {
  return eventsCache.get(id) || [];
}

export function getSessionSummary(id: string): any {
  const session = sessionCache.get(id);
  if (!session) return null;

  const totalTraffic = Object.values(session.packets.traffic).reduce(
    (acc, t) => ({ sent: acc.sent + t.sent, received: acc.received + t.received }),
    { sent: 0, received: 0 }
  );

  return {
    hosts: session.lan.hosts.length,
    aps: session.wifi.aps.length,
    bleDevices: session.ble.devices.length,
    modules: session.modules.length,
    runningModules: session.modules.filter((m) => m.running).length,
    totalSent: totalTraffic.sent,
    totalReceived: totalTraffic.received,
    protocols: Object.keys(session.packets.Protos).length,
    gps: session.gps.fix ? { lat: session.gps.latitude, lon: session.gps.longitude } : null,
    uptime: session.started_at,
    interface: {
      name: session.interface.hostname,
      mac: session.interface.mac,
      ipv4: session.interface.ipv4,
    },
    gateway: {
      mac: session.gateway.mac,
      ipv4: session.gateway.ipv4,
      vendor: session.gateway.vendor,
    },
  };
}
