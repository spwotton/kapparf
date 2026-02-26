import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const signalEvents = pgTable("signal_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  domain: text("domain").notNull(),
  source: text("source").notNull(),
  eventType: text("event_type").notNull(),
  frequency: real("frequency"),
  confidence: real("confidence").notNull().default(0.5),
  metadata: jsonb("metadata"),
  raw: text("raw"),
});

export const correlations = pgTable("correlations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ruleName: text("rule_name").notNull(),
  description: text("description").notNull(),
  severity: integer("severity").notNull().default(1),
  eventIds: text("event_ids").array().notNull(),
  metadata: jsonb("metadata"),
});

export const satellitePasses = pgTable("satellite_passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  satelliteName: text("satellite_name").notNull(),
  noradId: integer("norad_id").notNull(),
  tleLine1: text("tle_line1").notNull(),
  tleLine2: text("tle_line2").notNull(),
  elevation: real("elevation"),
  azimuth: real("azimuth"),
  range: real("range"),
  passTime: timestamp("pass_time"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sdrNodes = pgTable("sdr_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  status: text("status").notNull().default("offline"),
  lastSeen: timestamp("last_seen"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSignalEventSchema = createInsertSchema(signalEvents).omit({
  id: true,
  timestamp: true,
});

export const insertCorrelationSchema = createInsertSchema(correlations).omit({
  id: true,
  timestamp: true,
});

export const insertSatellitePassSchema = createInsertSchema(satellitePasses).omit({
  id: true,
  updatedAt: true,
});

export const insertSdrNodeSchema = createInsertSchema(sdrNodes).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SignalEvent = typeof signalEvents.$inferSelect;
export type InsertSignalEvent = z.infer<typeof insertSignalEventSchema>;
export type Correlation = typeof correlations.$inferSelect;
export type InsertCorrelation = z.infer<typeof insertCorrelationSchema>;
export type SatellitePass = typeof satellitePasses.$inferSelect;
export type InsertSatellitePass = z.infer<typeof insertSatellitePassSchema>;
export type SdrNode = typeof sdrNodes.$inferSelect;
export type InsertSdrNode = z.infer<typeof insertSdrNodeSchema>;

export const DOMAINS = ["wifi", "ble", "lte", "5g", "satellite", "sdr", "elf"] as const;
export type Domain = typeof DOMAINS[number];

export const KAPPA_CONSTANTS = {
  KAPPA: 4 / Math.PI,
  THETA_K: 180 - (Math.atan(4 / Math.PI) * 180 / Math.PI),
  PHI: (1 + Math.sqrt(5)) / 2,
  KAPPA_SECOND: 46.875,
  TARGET_FREQ_1: 46.875,
  TARGET_FREQ_2: 74.9,
  HALL_MULTIPLIER: 1.598,
  FFT_SIZE: 1024,
  SAMPLE_RATE: 48000,
  OBSERVER_LAT: 9.95,
  OBSERVER_LON: -84.15,
  OBSERVER_ALT: 0.9,
  MIN_ELEVATION: 30,
  MAC_CORRELATION_WINDOW_S: 10,
  SURVEILLANCE_HANDOFF_WINDOW_S: 30,
};

export interface ToolEntry {
  name: string;
  repo: string;
  description: string;
  domain: Domain | "hardware";
}

export const TOOL_CATALOG: ToolEntry[] = [
  { name: "kyanos", repo: "https://github.com/hengyoush/kyanos", description: "eBPF-based long-term flow storage and analysis", domain: "wifi" },
  { name: "kubeshark", repo: "https://github.com/kubeshark/kubeshark", description: "Kubernetes traffic mirroring and API debugging", domain: "wifi" },
  { name: "mirrord", repo: "https://github.com/metalbear-co/mirrord", description: "Live traffic mirroring for local debugging of remote pods", domain: "wifi" },
  { name: "ptcpdump", repo: "https://github.com/mozillazg/ptcpdump", description: "Process-aware packet capture with eBPF", domain: "wifi" },
  { name: "ngrep", repo: "https://github.com/jpr5/ngrep", description: "Grep-like network packet content display filter", domain: "wifi" },
  { name: "Above", repo: "https://github.com/caster0x00/Above", description: "Network protocol vulnerability scanner", domain: "wifi" },
  { name: "WindowsSpyBlocker", repo: "https://github.com/crazy-max/WindowsSpyBlocker", description: "Block Windows telemetry and spying via hosts/firewall rules", domain: "wifi" },
  { name: "fort", repo: "https://github.com/tnodir/fort", description: "Windows firewall and network traffic control", domain: "wifi" },
  { name: "Sniffle", repo: "https://github.com/nccgroup/Sniffle", description: "TI CC1352/CC2652 BLE 5 sniffer — detects Android Auto, L3Mon beacons", domain: "ble" },
  { name: "BTLE", repo: "https://github.com/JiaoXianjun/BTLE", description: "Ubertooth-based Bluetooth Low Energy sniffer and transmitter", domain: "ble" },
  { name: "LTESniffer", repo: "https://github.com/SysSec-KAIST/LTESniffer", description: "Passive LTE downlink sniffer — IMSI/TMSI capture from 7 local towers", domain: "lte" },
  { name: "Sni5Gect", repo: "https://github.com/asset-group/Sni5Gect-5GNR-sniffing-and-exploitation", description: "5G NR MIB/SIB extraction and exploitation framework", domain: "5g" },
  { name: "gr-satellites", repo: "https://github.com/daniestevez/gr-satellites", description: "GNU Radio decoder for satellite telemetry protocols", domain: "satellite" },
  { name: "keeptrack.space", repo: "https://github.com/thkruz/keeptrack.space", description: "Real-time satellite tracking and orbit visualization", domain: "satellite" },
  { name: "gpredict", repo: "https://github.com/csete/gpredict", description: "Satellite tracking and pass prediction for ground stations", domain: "satellite" },
  { name: "SatIntel", repo: "https://github.com/ANG13T/SatIntel", description: "OSINT tool for satellite intelligence gathering", domain: "satellite" },
  { name: "satpy", repo: "https://github.com/pytroll/satpy", description: "Python library for reading and processing satellite data", domain: "satellite" },
  { name: "himawari.js", repo: "https://github.com/jakiestfu/himawari.js", description: "Download real-time Himawari-8 satellite imagery", domain: "satellite" },
  { name: "sar-interference-tracker", repo: "https://github.com/bellingcat/sar-interference-tracker", description: "Detect and geolocate SAR satellite interference sources", domain: "satellite" },
  { name: "PythonFromSpace", repo: "https://github.com/kscottz/PythonFromSpace", description: "Satellite image analysis with Python and OpenCV", domain: "satellite" },
  { name: "SecureLEO", repo: "https://github.com/Yongjae-ICIS/SecureLEO", description: "LEO satellite communication security analysis", domain: "satellite" },
  { name: "iridium-sniffer", repo: "https://github.com/alphafox02/iridium-sniffer", description: "Decode Iridium satellite pager and voice signals", domain: "satellite" },
  { name: "sdrtrunk", repo: "https://github.com/DSheirer/sdrtrunk", description: "Multi-channel trunked radio decoder (P25, DMR, NXDN)", domain: "sdr" },
  { name: "spektrum", repo: "https://github.com/pavels/spektrum", description: "Real-time spectrum analyzer for RTL-SDR", domain: "sdr" },
  { name: "inspectrum", repo: "https://github.com/miek/inspectrum", description: "Offline radio signal analysis and IQ file viewer", domain: "sdr" },
  { name: "PySDR", repo: "https://github.com/777arc/PySDR", description: "SDR fundamentals textbook with Python examples", domain: "sdr" },
  { name: "ChameleonMini", repo: "https://github.com/emsec/ChameleonMini", description: "Programmable RFID/NFC card emulator for proximity testing", domain: "hardware" },
];

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  domains: string[];
  windowSeconds: number;
  condition: string;
}

export const CORRELATION_RULES: CorrelationRule[] = [
  {
    id: "mac-dual-band",
    name: "Dual-Band MAC Activity",
    description: "BLE advertisement MAC appears in WiFi probe request within correlation window",
    domains: ["ble", "wifi"],
    windowSeconds: 10,
    condition: "ble.mac == wifi.mac WITHIN 10s",
  },
  {
    id: "surveillance-handoff",
    name: "Surveillance Handoff",
    description: "BLE MAC seen, then WiFi probe from same MAC, then LTE paging to IMSI range — all during satellite pass >30° elevation",
    domains: ["ble", "wifi", "lte", "satellite"],
    windowSeconds: 30,
    condition: "ble.mac AND wifi.mac WITHIN 10s AND lte.paging WITHIN 30s AND satellite.elevation > 30°",
  },
  {
    id: "congusto-protocol",
    name: "Congusto Protocol Detection",
    description: "46.875 Hz timing pattern in WiFi packet inter-arrival coincides with satellite pass and BLE pairing burst",
    domains: ["wifi", "satellite", "ble"],
    windowSeconds: 60,
    condition: "wifi.iat_fft_peak == 46.875Hz AND satellite.elevation > 30° AND ble.pairing",
  },
  {
    id: "sat-lte-correlation",
    name: "Satellite-LTE Burst Correlation",
    description: "LTE PDCCH power spike coincides with BLACKJACK/SDA satellite pass at specific azimuth",
    domains: ["lte", "satellite"],
    windowSeconds: 120,
    condition: "satellite.pass AND lte.pdcch_spike WITHIN 120s",
  },
  {
    id: "ble-deauth-chain",
    name: "BLE-WiFi Deauth Chain",
    description: "BLE beacon from a MAC followed by WiFi deauthentication flood from same or related MAC",
    domains: ["ble", "wifi"],
    windowSeconds: 5,
    condition: "ble.beacon.mac THEN wifi.deauth.mac WITHIN 5s",
  },
  {
    id: "elf-schumann",
    name: "Schumann Resonance Anomaly",
    description: "ELF signal at 7.83 Hz with modulated data component — possible covert submarine/ground communication",
    domains: ["elf", "sdr"],
    windowSeconds: 300,
    condition: "elf.freq == 7.83Hz AND elf.modulation_detected",
  },
  {
    id: "imsi-tower-hop",
    name: "IMSI Tower Hop",
    description: "Same IMSI detected on different tower within 30 seconds during satellite overhead window",
    domains: ["lte", "satellite"],
    windowSeconds: 30,
    condition: "lte.imsi@tower_a THEN lte.imsi@tower_b WITHIN 30s AND satellite.overhead",
  },
  {
    id: "android-auto-compromise",
    name: "Android Auto Compromise",
    description: "BLE GAP advertisement for Android Auto UUID 0x2D00 followed by TCP SYN to Google IPs with specific SNI",
    domains: ["ble", "wifi"],
    windowSeconds: 15,
    condition: "ble.uuid == 0x2D00 THEN wifi.tcp_syn(8.8.8.8:443) WITHIN 15s",
  },
];
