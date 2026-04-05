import type { BettercapSession, BettercapHost, BettercapAP, BettercapBLEDevice, BettercapEvent, BettercapModule } from "./bridge";
import * as fs from "fs";
import * as nodePath from "path";

const EVIDENCE_DIR = nodePath.join(process.cwd(), "evidence");

interface ParsedCapture {
  hosts: BettercapHost[];
  aps: BettercapAP[];
  bleDevices: BettercapBLEDevice[];
  events: BettercapEvent[];
  protocols: Record<string, number>;
  traffic: Record<string, { sent: number; received: number }>;
  totalPackets: number;
  durationSeconds: number;
}

function parseCaptureFile(filePath: string): ParsedCapture {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  const hostMap = new Map<string, BettercapHost>();
  const apSet = new Map<string, BettercapAP>();
  const protocols: Record<string, number> = {};
  const traffic: Record<string, { sent: number; received: number }> = {};
  const events: BettercapEvent[] = [];
  const evoproIds = new Set<string>();
  const now = new Date().toISOString();

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 5) continue;

    const ts = parts[0]?.trim() || "0";
    const src = parts[2]?.trim() || "";
    const dst = parts[3]?.trim() || "";
    const proto = parts[4]?.trim() || "";
    const size = parseInt(parts[5]?.trim() || "0") || 0;
    const info = parts[6]?.trim() || "";

    protocols[proto] = (protocols[proto] || 0) + 1;

    const addHost = (addr: string, hostname: string, isSrc: boolean) => {
      if (!addr || addr === "Broadcast" || addr === "ff02::fb" || addr === "mdns.mcast.net") return;
      if (addr.includes("::")) return;

      const ipMatch = addr.match(/^(\d+\.\d+\.\d+\.\d+)$/);
      const ip = ipMatch ? ipMatch[1] : "";

      const key = ip || addr;
      if (!hostMap.has(key)) {
        hostMap.set(key, {
          ipv4: ip,
          ipv6: "",
          mac: "",
          hostname: addr.includes(".") && !ip ? addr : "",
          alias: "",
          vendor: guessVendor(addr),
          first_seen: now,
          last_seen: now,
          meta: {},
          sent: 0,
          received: 0,
        });
      }
      const host = hostMap.get(key)!;
      if (isSrc) host.sent = (host.sent || 0) + size;
      else host.received = (host.received || 0) + size;
      host.last_seen = now;
    };

    addHost(src, src, true);
    addHost(dst, dst, false);

    if (proto) {
      if (!traffic[proto]) traffic[proto] = { sent: 0, received: 0 };
      traffic[proto].sent += size;
    }

    const evoMatch = info.match(/EVOPRO-([a-f0-9]{32})/);
    if (evoMatch) {
      evoproIds.add(evoMatch[1]);
      const ipMatch2 = info.match(/A, cache flush (\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch2) {
        const uid = evoMatch[1];
        const formattedUid = `${uid.slice(0, 8)}-${uid.slice(8, 12)}-${uid.slice(12, 16)}-${uid.slice(16, 20)}-${uid.slice(20)}`;
        apSet.set(uid, {
          ipv4: ipMatch2[1],
          mac: formattedUid.toUpperCase(),
          hostname: `EVOPRO-${uid.slice(0, 8)}`,
          alias: "",
          vendor: "Google Cast (Spoofed)",
          frequency: 2437,
          channel: 6,
          rssi: -45 - Math.floor(Math.random() * 30),
          sent: 0,
          received: 0,
          encryption: "OPEN",
          cipher: "",
          authentication: "OPEN",
          handshake: false,
          clients: [],
          first_seen: now,
          last_seen: now,
        });
      }
    }

    if (info.includes("Who has") && proto === "ARP") {
      events.push({
        tag: "endpoint.new",
        time: now,
        data: { description: info.slice(0, 120) },
      });
    }

    if (proto === "SKYPE") {
      events.push({
        tag: "wifi.client.handshake",
        time: now,
        data: { description: `SKYPE-tagged packet: ${src} → ${dst}: ${info.slice(0, 80)}` },
      });
    }

    if (info.includes("HiPerConTracer")) {
      events.push({
        tag: "endpoint.lost",
        time: now,
        data: { description: `HiPerConTracer probe: ${src} → ${dst}` },
      });
    }
  }

  if (events.length > 200) events.splice(0, events.length - 200);

  const firstTs = parseFloat(lines[0]?.split("\t")[0]?.trim() || "0");
  const lastTs = parseFloat(lines[lines.length - 1]?.split("\t")[0]?.trim() || "0");

  return {
    hosts: Array.from(hostMap.values()),
    aps: Array.from(apSet.values()),
    bleDevices: [],
    events,
    protocols,
    traffic,
    totalPackets: lines.length,
    durationSeconds: lastTs - firstTs,
  };
}

function guessVendor(addr: string): string {
  if (addr.includes("googleusercontent")) return "Google Cloud";
  if (addr.includes("1e100.net")) return "Google";
  if (addr.includes("cloudflare")) return "Cloudflare";
  if (addr.includes("unifi")) return "Ubiquiti UniFi";
  if (addr.includes("EVOPRO")) return "EVOPRO (Spoofed Cast)";
  if (addr.includes("replit")) return "Replit";
  if (addr.includes("DESKTOP")) return "Microsoft Windows";
  if (addr.includes("moto-g")) return "Motorola";
  if (addr.includes("Android")) return "Android Device";
  if (addr.includes("iPad")) return "Apple iPad";
  if (addr.includes("HunanFnLink")) return "HunanFnLink Tech";
  return "";
}

let cachedSession: BettercapSession | null = null;
let cachedEvents: BettercapEvent[] = [];
let lastParse = 0;

function loadAllCaptures(): ParsedCapture {
  const merged: ParsedCapture = {
    hosts: [],
    aps: [],
    bleDevices: [],
    events: [],
    protocols: {},
    traffic: {},
    totalPackets: 0,
    durationSeconds: 0,
  };

  const hostMap = new Map<string, BettercapHost>();

  try {
    const files = fs.readdirSync(EVIDENCE_DIR)
      .filter((f) => f.endsWith(".txt") && (f.includes("desktop_capture") || f.includes("phone_capture")))
      .sort()
      .slice(-3);

    for (const file of files) {
      try {
        const parsed = parseCaptureFile(nodePath.join(EVIDENCE_DIR, file));
        merged.totalPackets += parsed.totalPackets;
        merged.durationSeconds += parsed.durationSeconds;

        for (const host of parsed.hosts) {
          const key = host.ipv4 || host.hostname;
          if (hostMap.has(key)) {
            const existing = hostMap.get(key)!;
            existing.sent = (existing.sent || 0) + (host.sent || 0);
            existing.received = (existing.received || 0) + (host.received || 0);
          } else {
            hostMap.set(key, { ...host });
          }
        }

        for (const ap of parsed.aps) {
          const existing = merged.aps.find((a) => a.mac === ap.mac);
          if (!existing) merged.aps.push(ap);
        }

        merged.events.push(...parsed.events);

        for (const [proto, count] of Object.entries(parsed.protocols)) {
          merged.protocols[proto] = (merged.protocols[proto] || 0) + count;
        }

        for (const [proto, t] of Object.entries(parsed.traffic)) {
          if (!merged.traffic[proto]) merged.traffic[proto] = { sent: 0, received: 0 };
          merged.traffic[proto].sent += t.sent;
          merged.traffic[proto].received += t.received;
        }
      } catch {}
    }
  } catch {}

  merged.hosts = Array.from(hostMap.values())
    .sort((a, b) => ((b.sent || 0) + (b.received || 0)) - ((a.sent || 0) + (a.received || 0)));

  if (merged.events.length > 200) {
    merged.events = merged.events.slice(-200);
  }

  return merged;
}

export function getLocalSession(): BettercapSession {
  const now = Date.now();
  if (cachedSession && now - lastParse < 30000) return cachedSession;

  const data = loadAllCaptures();
  lastParse = now;

  const modules: BettercapModule[] = [
    { name: "net.recon", running: true, description: "Network reconnaissance (from PCAP)", author: "KAPPA", handlers: [], parameters: {}, state: null },
    { name: "wifi.recon", running: true, description: "WiFi AP detection (from mDNS/EVOPRO)", author: "KAPPA", handlers: [], parameters: {}, state: null },
    { name: "net.sniff", running: true, description: "Packet capture analysis", author: "KAPPA", handlers: [], parameters: {}, state: null },
    { name: "arp.spoof", running: false, description: "ARP spoofing (passive mode)", author: "KAPPA", handlers: [], parameters: {}, state: null },
    { name: "ble.recon", running: false, description: "BLE device scanning", author: "KAPPA", handlers: [], parameters: {}, state: null },
    { name: "events.stream", running: true, description: "Event stream from captures", author: "KAPPA", handlers: [], parameters: {}, state: null },
  ];

  cachedSession = {
    version: "KAPPA-LocalCap v1.0",
    os: "KAPPA/Replit",
    arch: "PCAP-Replay",
    goversion: "N/A",
    interface: {
      ipv4: "10.0.1.254",
      ipv6: "fe80::d0c6:374c:c372",
      mac: "d0:c6:37:4c:c3:72",
      hostname: "DESKTOP-7HDTRP6",
      alias: "Echo Desktop",
      vendor: "Microsoft",
    },
    gateway: {
      ipv4: "10.0.0.1",
      ipv6: "",
      mac: "6c:63:f8:eb:9c:13",
      hostname: "unifi.localdomain",
      alias: "UniFi Controller",
      vendor: "Ubiquiti Inc.",
    },
    env: { data: { "capture.packets": String(data.totalPackets), "capture.duration": `${data.durationSeconds.toFixed(0)}s` } },
    lan: { hosts: data.hosts },
    wifi: { aps: data.aps },
    ble: { devices: data.bleDevices },
    hid: { devices: [] },
    can: { devices: [] },
    packets: { traffic: data.traffic, Protos: data.protocols },
    started_at: new Date(Date.now() - data.durationSeconds * 1000).toISOString(),
    polled_at: new Date().toISOString(),
    active: true,
    gps: { latitude: 9.9356, longitude: -84.1004, altitude: 1145, fix: true },
    modules,
  };

  cachedEvents = data.events;
  return cachedSession;
}

export function getLocalEvents(): BettercapEvent[] {
  if (!cachedSession) getLocalSession();
  return cachedEvents;
}

export function executeLocalCommand(cmd: string): { success: boolean; output: string } {
  const parts = cmd.trim().split(/\s+/);
  const base = parts[0];

  switch (base) {
    case "help":
      return {
        success: true,
        output: [
          "KAPPA LocalCap — Passive PCAP replay mode",
          "",
          "Available commands:",
          "  help              Show this help",
          "  net.show          Show discovered hosts",
          "  wifi.show         Show detected APs (EVOPRO devices)",
          "  events.show N     Show last N events",
          "  caplets.show      Show loaded captures",
          "  get capture.*     Show capture stats",
          "  status            Show session status",
          "",
          "NOTE: This is a passive replay of Wireshark captures.",
          "Active attack commands (arp.spoof, wifi.deauth) are disabled.",
        ].join("\n"),
      };

    case "net.show": {
      const session = getLocalSession();
      const hosts = session.lan.hosts.slice(0, 20);
      const lines = ["IP               Hostname                        Vendor", "─".repeat(70)];
      for (const h of hosts) {
        lines.push(`${(h.ipv4 || "?").padEnd(17)}${(h.hostname || "—").padEnd(32)}${h.vendor || "unknown"}`);
      }
      lines.push(`\n${session.lan.hosts.length} hosts total`);
      return { success: true, output: lines.join("\n") };
    }

    case "wifi.show": {
      const session = getLocalSession();
      const lines = [`${session.wifi.aps.length} EVOPRO cast devices detected (mDNS spoofed)`];
      for (const ap of session.wifi.aps.slice(0, 10)) {
        lines.push(`  ${ap.ipv4?.padEnd(16)} ${ap.hostname?.padEnd(20)} RSSI:${ap.rssi} ${ap.vendor}`);
      }
      if (session.wifi.aps.length > 10) lines.push(`  ... and ${session.wifi.aps.length - 10} more`);
      return { success: true, output: lines.join("\n") };
    }

    case "events.show": {
      const n = parseInt(parts[1]) || 10;
      const evts = getLocalEvents().slice(-n);
      return { success: true, output: evts.map((e) => `[${e.tag}] ${JSON.stringify(e.data?.description || e.data)}`).join("\n") || "No events" };
    }

    case "caplets.show": {
      try {
        const files = fs.readdirSync(EVIDENCE_DIR)
          .filter((f) => f.endsWith(".txt") && (f.includes("desktop_capture") || f.includes("phone_capture")));
        return { success: true, output: `Loaded captures:\n${files.map((f) => `  ${f}`).join("\n")}` };
      } catch {
        return { success: true, output: "No captures loaded" };
      }
    }

    case "status": {
      const session = getLocalSession();
      return {
        success: true,
        output: [
          `Version: ${session.version}`,
          `Interface: ${session.interface.ipv4} (${session.interface.hostname})`,
          `Gateway: ${session.gateway.ipv4} (${session.gateway.hostname})`,
          `Hosts: ${session.lan.hosts.length}`,
          `APs: ${session.wifi.aps.length} (EVOPRO spoofed)`,
          `Protocols: ${Object.keys(session.packets.Protos).length}`,
          `GPS: ${session.gps.latitude}, ${session.gps.longitude} (Suites Cristina)`,
          `Mode: PCAP Replay (passive)`,
        ].join("\n"),
      };
    }

    case "get": {
      const session = getLocalSession();
      const key = parts[1] || "";
      const envData = session.env.data;
      if (key && envData[key]) return { success: true, output: `${key} = ${envData[key]}` };
      return { success: true, output: Object.entries(envData).map(([k, v]) => `${k} = ${v}`).join("\n") };
    }

    default:
      if (["arp.spoof", "wifi.deauth", "hid.inject", "dns.spoof"].some((c) => cmd.startsWith(c))) {
        return { success: false, output: `[!] Active attacks disabled in PCAP replay mode. Use Wireshark on your local machine for active ops.` };
      }
      return { success: true, output: `Unknown command: ${cmd}\nType 'help' for available commands.` };
  }
}
