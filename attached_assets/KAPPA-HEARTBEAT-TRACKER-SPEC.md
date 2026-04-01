# KAPPA Heartbeat Tracker — Standalone Device Monitor

## What This Is

A lightweight, always-on device heartbeat and status tracking service. Devices (PCs, phones, sensors, IoT) register themselves and send periodic heartbeats. The service tracks online/offline status, stores device metadata, and exposes a clean REST + WebSocket API that the main KAPPA SIGINT platform (or any client) can query.

This is a **standalone app** — it runs independently from the main KAPPA platform. KAPPA connects to it as a data source.

## Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (use Replit's built-in PostgreSQL)
- **ORM:** Drizzle ORM with drizzle-zod for validation
- **WebSocket:** `ws` library attached to the HTTP server at path `/ws`
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui (single-page dashboard)
- **No authentication** on v1 — devices self-register with an API key passed as query param or header

## Database Schema

### Table: `devices`

| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| device_id | text | NOT NULL, UNIQUE — human-readable slug like `echo-pc`, `samsung-a52` |
| name | text | NOT NULL — display name |
| type | text | NOT NULL — `pc`, `phone`, `sensor`, `iot` |
| os | text | NOT NULL — `windows`, `linux`, `macos`, `android`, `ios`, `termux`, `unknown` |
| ip | text | nullable — last known IP |
| capabilities | text[] | NOT NULL, default `{}` — what the device can report |
| metadata | jsonb | default `{}` — arbitrary device info (CPU, RAM, hostname, etc.) |
| online | boolean | NOT NULL, default false |
| registered_at | timestamp | NOT NULL, default `now()` |
| last_heartbeat | timestamp | nullable |
| last_disconnect | timestamp | nullable |

### Table: `heartbeats`

| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| device_id | text | NOT NULL, FK → devices.device_id |
| timestamp | timestamp | NOT NULL, default `now()` |
| latency_ms | real | nullable — round-trip time if measurable |
| metadata | jsonb | default `{}` — CPU load, memory, disk, network stats, battery, etc. |

Keep only last 24 hours of heartbeats (cleanup job runs every hour).

### Table: `alerts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| device_id | text | NOT NULL, FK → devices.device_id |
| type | text | NOT NULL — `timeout`, `reconnect`, `anomaly`, `manual` |
| message | text | NOT NULL |
| severity | integer | NOT NULL, default 1 (1=info, 2=warning, 3=critical) |
| metadata | jsonb | default `{}` |
| created_at | timestamp | NOT NULL, default `now()` |
| acknowledged | boolean | NOT NULL, default false |

### Table: `sensor_readings`

| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar | PK, default `gen_random_uuid()` |
| device_id | text | NOT NULL, FK → devices.device_id |
| sensor_type | text | NOT NULL — `magnetometer`, `accelerometer`, `gyroscope`, `light`, `proximity`, `barometer`, `wifi_scan`, `cell_info`, `gps`, `cpu`, `memory`, `disk`, `network_io`, `process_list`, `usb_devices`, `battery` |
| timestamp | timestamp | NOT NULL, default `now()` |
| values | jsonb | NOT NULL — sensor-specific values |

Keep only last 6 hours of sensor readings (cleanup job).

## REST API

All endpoints return JSON. All accept `application/json`.

### Device Management

```
POST   /api/devices/register
       Body: { deviceId: string, name: string, type: string, os: string, capabilities?: string[], metadata?: object }
       Response: { id, deviceId, name, type, os, online, registeredAt }
       Creates or updates device registration. Returns device record.

GET    /api/devices
       Response: DeviceInfo[] — all registered devices with online status
       Query params: ?type=pc&online=true (optional filters)

GET    /api/devices/:deviceId
       Response: DeviceInfo with full metadata and last heartbeat details

DELETE /api/devices/:deviceId
       Response: { deleted: true }

GET    /api/devices/stats
       Response: { total, online, offline, byType: { pc, phone, sensor, iot }, uptimePercent24h }
```

### Heartbeat

```
POST   /api/heartbeat
       Body: { deviceId: string, metadata?: object }
       Response: { ack: true, serverTime: number, nextExpectedMs: number }
       Updates device online status and stores heartbeat record.
       metadata can include: { cpu: 23.5, memory: 67.2, disk: 45.0, battery: 82, networkUp: 1024, networkDown: 4096, processCount: 142, uptime: 86400 }

GET    /api/heartbeat/:deviceId/history
       Query: ?hours=24&limit=1000
       Response: HeartbeatRecord[] — timestamped heartbeat history with metadata
```

### Sensor Data

```
POST   /api/sensors
       Body: { deviceId: string, readings: [{ sensorType: string, timestamp: number, values: object }] }
       Response: { ingested: number }

GET    /api/sensors/:deviceId
       Query: ?type=magnetometer&hours=1&limit=500
       Response: SensorReading[]

GET    /api/sensors/:deviceId/latest
       Response: { [sensorType]: latestReading } — most recent reading per sensor type
```

### Alerts

```
GET    /api/alerts
       Query: ?deviceId=echo-pc&severity=3&acknowledged=false&limit=50
       Response: Alert[]

POST   /api/alerts/:id/acknowledge
       Response: { acknowledged: true }

GET    /api/alerts/active
       Response: Alert[] — unacknowledged alerts only
```

### KAPPA Integration

```
GET    /api/kappa/status
       Response: Full system summary for KAPPA to poll:
       {
         devices: DeviceInfo[],
         onlineCount: number,
         alerts: Alert[] (active only),
         recentHeartbeats: { [deviceId]: { lastSeen, latencyMs, metadata } },
         serverUptime: number
       }

POST   /api/kappa/command
       Body: { deviceId: string, command: string, args?: object }
       Forwards command to device via WebSocket. Returns { sent: boolean }.
       Commands: "collect_sensors", "run_scan", "screenshot", "process_list", "network_dump"
```

## WebSocket Protocol

Endpoint: `wss://hostname/ws?deviceId=echo-pc`

### Client → Server Messages

```json
{ "type": "register", "deviceId": "echo-pc", "name": "Echo Desktop", "deviceType": "pc", "os": "windows", "capabilities": ["cpu","memory","disk","network_io","process_list","usb_devices","wifi_scan"] }

{ "type": "heartbeat", "cpu": 23.5, "memory": 67.2, "disk": 45.0, "processCount": 142, "uptime": 86400 }

{ "type": "sensors", "readings": [{ "sensorType": "cpu", "timestamp": 1774911535000, "values": { "percent": 23.5, "temp": 62.0, "cores": [15, 30, 22, 27] } }] }

{ "type": "network", "connections": [{ "srcIp": "10.0.1.254", "dstIp": "104.18.20.246", "dstPort": 443, "protocol": "TCP", "process": "chrome.exe", "bytes": 4096 }] }

{ "type": "processes", "list": [{ "pid": 1234, "name": "chrome.exe", "cpu": 5.2, "memory": 230000000, "ports": [443, 8080] }] }

{ "type": "alert", "severity": 3, "message": "New USB device connected", "metadata": { "vendor": "Unknown", "product": "USB Device" } }
```

### Server → Client Messages

```json
{ "type": "registered", "deviceId": "echo-pc", "serverTime": 1774911535000, "heartbeatIntervalMs": 15000 }

{ "type": "heartbeat_ack", "serverTime": 1774911535000 }

{ "type": "command", "command": "collect_sensors", "args": { "types": ["cpu", "memory", "disk"] } }

{ "type": "command", "command": "process_list" }
```

### Heartbeat Protocol

- Device sends `heartbeat` every 15 seconds
- Server responds with `heartbeat_ack`
- If no heartbeat received for 45 seconds, device marked offline and `timeout` alert created
- If device reconnects after timeout, `reconnect` alert created with offline duration

## Frontend Dashboard

Single page at `/` showing:

### Header Bar
- App title: "KAPPA Device Monitor"
- Online count badge (green pulse if all online, red if any offline)
- Server uptime

### Device Grid
- Card per device showing:
  - Device name + type icon (laptop, phone, cpu chip, wifi)
  - Online/offline badge with last seen timestamp
  - OS badge
  - Sparkline of CPU/memory over last hour (if available)
  - Latency indicator (last heartbeat round-trip)
  - Capabilities tags
- Click card → expanded view with:
  - Full metadata
  - Heartbeat history chart (24h)
  - Recent sensor readings
  - Active alerts
  - Send command buttons

### Alert Feed
- Right sidebar or bottom panel
- Chronological list of alerts
- Color-coded by severity
- Click to acknowledge
- Filter by device, severity, type

### Status Bar
- Total devices / online / offline
- Sensor readings ingested (count)
- WebSocket connections active
- Database size

## Agent Scripts

The app serves downloadable agent scripts at:

### `GET /api/agents/pc` — Python script for Windows/Linux/Mac

Collects: CPU%, memory%, disk%, network I/O, process list, USB devices, active connections, hostname, OS info.
Connects via WebSocket, sends heartbeat every 15s, sensor readings every 30s.
Dependencies: `psutil`, `websocket-client` (pip install).
Runs as background service or terminal process.
Should auto-reconnect on disconnect with exponential backoff (1s, 2s, 4s, 8s, max 60s).

### `GET /api/agents/phone` — Python script for Termux (Android)

Collects: magnetometer, accelerometer, gyroscope, light, proximity, barometer (via `termux-sensor`), WiFi scan (via `termux-wifi-scaninfo`), cell info (via `termux-telephony-cellinfo`), battery (via `termux-battery-status`), GPS (via `termux-location`).
Same WebSocket heartbeat protocol.
Dependencies: `termux-api` package, `websocket-client` (pip install).
Should handle Termux wake locks to keep running in background.

### `GET /api/agents/bash` — Minimal bash heartbeat-only script

Just curl-based heartbeat every 15s for systems where Python isn't available.
```bash
while true; do curl -s -X POST https://hostname/api/heartbeat -H "Content-Type: application/json" -d "{\"deviceId\":\"$DEVICE_ID\",\"metadata\":{\"uptime\":$(cat /proc/uptime | cut -d' ' -f1)}}"; sleep 15; done
```

## Background Jobs

### Heartbeat Monitor (runs every 15s)
- Check all devices with `online = true`
- If `last_heartbeat` older than 45s → mark offline, create timeout alert
- Log state transitions

### Cleanup (runs every hour)
- Delete heartbeats older than 24 hours
- Delete sensor_readings older than 6 hours  
- Delete acknowledged alerts older than 7 days

## Configuration

Environment variables:
- `DATABASE_URL` — PostgreSQL connection string (Replit provides this)
- `PORT` — Server port (Replit provides this, default 5000)
- `HEARTBEAT_INTERVAL_MS` — Default 15000
- `HEARTBEAT_TIMEOUT_MS` — Default 45000
- `SENSOR_RETENTION_HOURS` — Default 6
- `HEARTBEAT_RETENTION_HOURS` — Default 24
- `KAPPA_URL` — Optional: URL of main KAPPA platform to push alerts to

## Design Guidelines

- Dark mode by default with light mode toggle
- Use shadcn/ui Card, Badge, Button, Table components
- Green pulse animation for online devices
- Red static badge for offline
- Monospace font for device IDs and technical data
- Responsive — works on mobile so you can check device status from phone browser
- No sci-fi aesthetics — clean, professional, Notion-style
- Use lucide-react icons: Monitor (PC), Smartphone (phone), Cpu (sensor), Wifi (IoT), Heart (heartbeat), AlertTriangle (alerts)

## Deployment

- Replit Autoscale deployment
- Single port serves both API and frontend
- WebSocket upgrade handled on same port
- PostgreSQL via Replit's built-in database
- Should survive restarts — devices auto-reconnect, state rebuilds from DB

## What This Does NOT Do

- No signal processing — that's KAPPA's job
- No correlation engine — that's KAPPA's job  
- No satellite tracking — that's KAPPA's job
- No authentication in v1 — add API key auth in v2 if needed
- No data visualization beyond basic sparklines — KAPPA has the full dashboard

This is purely: **are my devices alive, what are they reporting, and can I send them commands.**
