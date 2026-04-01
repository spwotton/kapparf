import { WebSocketServer, WebSocket } from "ws";
import type { Server as HTTPServer } from "http";
import * as crypto from "crypto";

export interface DeviceInfo {
  id: string;
  name: string;
  type: "phone" | "pc" | "sensor";
  os: string;
  capabilities: string[];
  ip: string;
  registeredAt: number;
  lastHeartbeat: number;
  online: boolean;
  metadata: Record<string, unknown>;
  ws?: WebSocket;
}

interface SensorReading {
  deviceId: string;
  sensorType: string;
  timestamp: number;
  values: Record<string, number>;
  source?: string;
}

interface DeviceMessage {
  type: string;
  deviceId?: string;
  payload?: any;
}

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 45_000;
const MAX_READINGS_BUFFER = 2000;

class DeviceHub {
  private wss: WebSocketServer | null = null;
  private devices: Map<string, DeviceInfo> = new Map();
  private sensorBuffer: SensorReading[] = [];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  attach(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: "/ws/devices" });

    this.wss.on("connection", (ws, req) => {
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      let deviceId: string | null = null;

      ws.on("message", (raw) => {
        try {
          const msg: DeviceMessage = JSON.parse(raw.toString());
          switch (msg.type) {
            case "register": {
              deviceId = msg.payload?.deviceId || `dev-${crypto.randomBytes(4).toString("hex")}`;
              const existing = this.devices.get(deviceId);
              const info: DeviceInfo = {
                id: deviceId,
                name: msg.payload?.name || deviceId,
                type: msg.payload?.deviceType || "pc",
                os: msg.payload?.os || "unknown",
                capabilities: msg.payload?.capabilities || [],
                ip,
                registeredAt: existing?.registeredAt || Date.now(),
                lastHeartbeat: Date.now(),
                online: true,
                metadata: msg.payload?.metadata || {},
                ws,
              };
              this.devices.set(deviceId, info);
              ws.send(JSON.stringify({
                type: "registered",
                deviceId,
                serverTime: Date.now(),
                heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
              }));
              this.emit("device:connected", { deviceId, info: this.sanitize(info) });
              console.log(`[DeviceHub] Registered: ${deviceId} (${info.type}/${info.os}) from ${ip}`);
              break;
            }

            case "heartbeat": {
              if (deviceId && this.devices.has(deviceId)) {
                const dev = this.devices.get(deviceId)!;
                dev.lastHeartbeat = Date.now();
                dev.online = true;
                if (msg.payload) {
                  dev.metadata = { ...dev.metadata, ...msg.payload };
                }
                ws.send(JSON.stringify({ type: "heartbeat_ack", serverTime: Date.now() }));
              }
              break;
            }

            case "sensors": {
              if (!deviceId) break;
              const readings: SensorReading[] = (msg.payload?.readings || []).map((r: any) => ({
                deviceId,
                sensorType: r.sensorType || r.type,
                timestamp: r.timestamp || Date.now(),
                values: r.values || { x: r.x, y: r.y, z: r.z, value: r.value },
                source: r.source,
              }));
              for (const r of readings) {
                this.sensorBuffer.push(r);
                if (this.sensorBuffer.length > MAX_READINGS_BUFFER) {
                  this.sensorBuffer.shift();
                }
              }
              this.emit("sensors", { deviceId, readings });
              ws.send(JSON.stringify({ type: "sensors_ack", count: readings.length }));
              break;
            }

            case "network": {
              if (!deviceId) break;
              this.emit("network", { deviceId, data: msg.payload });
              break;
            }

            case "processes": {
              if (!deviceId) break;
              this.emit("processes", { deviceId, data: msg.payload });
              break;
            }

            case "alert": {
              if (!deviceId) break;
              this.emit("alert", { deviceId, data: msg.payload });
              console.log(`[DeviceHub] Alert from ${deviceId}: ${msg.payload?.message || "unknown"}`);
              break;
            }

            default:
              this.emit(msg.type, { deviceId, payload: msg.payload });
          }
        } catch (err) {
          console.error("[DeviceHub] Bad message:", err);
        }
      });

      ws.on("close", () => {
        if (deviceId && this.devices.has(deviceId)) {
          const dev = this.devices.get(deviceId)!;
          dev.online = false;
          dev.ws = undefined;
          this.emit("device:disconnected", { deviceId });
          console.log(`[DeviceHub] Disconnected: ${deviceId}`);
        }
      });

      ws.on("error", (err) => {
        console.error(`[DeviceHub] WS error for ${deviceId || "unknown"}:`, err.message);
      });
    });

    this.heartbeatTimer = setInterval(() => this.checkHeartbeats(), HEARTBEAT_INTERVAL_MS);
    console.log("[DeviceHub] WebSocket server attached on /ws/devices");
  }

  private checkHeartbeats() {
    const now = Date.now();
    for (const [id, dev] of this.devices) {
      if (dev.online && (now - dev.lastHeartbeat) > HEARTBEAT_TIMEOUT_MS) {
        dev.online = false;
        if (dev.ws) {
          try { dev.ws.close(); } catch {}
          dev.ws = undefined;
        }
        this.emit("device:timeout", { deviceId: id });
        console.log(`[DeviceHub] Timeout: ${id} (no heartbeat for ${Math.round((now - dev.lastHeartbeat) / 1000)}s)`);
      }
    }
  }

  registerREST(deviceId: string, info: Partial<DeviceInfo>): DeviceInfo {
    const existing = this.devices.get(deviceId);
    const dev: DeviceInfo = {
      id: deviceId,
      name: info.name || deviceId,
      type: info.type || "phone",
      os: info.os || "unknown",
      capabilities: info.capabilities || [],
      ip: info.ip || "rest",
      registeredAt: existing?.registeredAt || Date.now(),
      lastHeartbeat: Date.now(),
      online: true,
      metadata: info.metadata || {},
    };
    this.devices.set(deviceId, dev);
    this.emit("device:connected", { deviceId, info: this.sanitize(dev) });
    return dev;
  }

  restHeartbeat(deviceId: string, meta?: Record<string, unknown>) {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.lastHeartbeat = Date.now();
      dev.online = true;
      if (meta) dev.metadata = { ...dev.metadata, ...meta };
    }
  }

  sendToDevice(deviceId: string, message: any): boolean {
    const dev = this.devices.get(deviceId);
    if (dev?.ws && dev.ws.readyState === WebSocket.OPEN) {
      dev.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcast(message: any, type?: "phone" | "pc" | "sensor") {
    const msg = JSON.stringify(message);
    for (const dev of this.devices.values()) {
      if (dev.ws && dev.ws.readyState === WebSocket.OPEN) {
        if (!type || dev.type === type) {
          dev.ws.send(msg);
        }
      }
    }
  }

  getDevices(): Omit<DeviceInfo, "ws">[] {
    return Array.from(this.devices.values()).map(d => this.sanitize(d));
  }

  getDevice(id: string): Omit<DeviceInfo, "ws"> | null {
    const d = this.devices.get(id);
    return d ? this.sanitize(d) : null;
  }

  getOnlineDevices(): Omit<DeviceInfo, "ws">[] {
    return this.getDevices().filter(d => d.online);
  }

  getRecentSensors(limit = 100): SensorReading[] {
    return this.sensorBuffer.slice(-limit);
  }

  getStats() {
    const all = this.getDevices();
    return {
      total: all.length,
      online: all.filter(d => d.online).length,
      offline: all.filter(d => !d.online).length,
      byType: {
        phone: all.filter(d => d.type === "phone").length,
        pc: all.filter(d => d.type === "pc").length,
        sensor: all.filter(d => d.type === "sensor").length,
      },
      sensorBufferSize: this.sensorBuffer.length,
      wsConnections: this.wss?.clients.size || 0,
    };
  }

  removeDevice(id: string): boolean {
    const dev = this.devices.get(id);
    if (dev) {
      if (dev.ws) try { dev.ws.close(); } catch {}
      this.devices.delete(id);
      return true;
    }
    return false;
  }

  on(event: string, cb: (data: any) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(cb);
  }

  private emit(event: string, data: any) {
    for (const cb of this.listeners.get(event) || []) {
      try { cb(data); } catch (e) { console.error(`[DeviceHub] Listener error on ${event}:`, e); }
    }
  }

  private sanitize(d: DeviceInfo): Omit<DeviceInfo, "ws"> {
    const { ws, ...rest } = d;
    return rest;
  }
}

export const deviceHub = new DeviceHub();
