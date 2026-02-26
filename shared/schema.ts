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
  latitude: real("latitude"),
  longitude: real("longitude"),
  altitude: real("altitude"),
  category: text("category").notNull().default("active"),
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

export const DOMAINS = ["wifi", "ble", "lte", "5g", "satellite", "sdr", "elf", "radar", "plc", "isp", "drone"] as const;

export interface TleCatalogGroup {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const TLE_CATALOG_GROUPS: TleCatalogGroup[] = [
  { id: "stations", name: "Space Stations", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle", category: "stations" },
  { id: "visual", name: "100 Brightest", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle", category: "visual" },
  { id: "active", name: "Active Satellites", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle", category: "active" },
  { id: "weather", name: "Weather", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle", category: "weather" },
  { id: "noaa", name: "NOAA", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle", category: "noaa" },
  { id: "goes", name: "GOES", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=goes&FORMAT=tle", category: "goes" },
  { id: "resource", name: "Earth Resources", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=resource&FORMAT=tle", category: "resource" },
  { id: "sarsat", name: "Search & Rescue (SARSAT)", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=sarsat&FORMAT=tle", category: "sarsat" },
  { id: "dmc", name: "Disaster Monitoring", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=dmc&FORMAT=tle", category: "dmc" },
  { id: "tdrss", name: "Tracking & Data Relay", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=tdrss&FORMAT=tle", category: "tdrss" },
  { id: "argos", name: "ARGOS Data Collection", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=argos&FORMAT=tle", category: "argos" },
  { id: "planet", name: "Planet", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=planet&FORMAT=tle", category: "planet" },
  { id: "spire", name: "Spire", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=spire&FORMAT=tle", category: "spire" },
  { id: "geo", name: "Geostationary", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle", category: "geo" },
  { id: "gpz", name: "GPS Operational", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle", category: "gnss" },
  { id: "glonass", name: "GLONASS Operational", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=tle", category: "gnss" },
  { id: "galileo", name: "Galileo", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle", category: "gnss" },
  { id: "beidou", name: "Beidou", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=tle", category: "gnss" },
  { id: "sbas", name: "SBAS", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=sbas&FORMAT=tle", category: "gnss" },
  { id: "iridium", name: "Iridium", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium&FORMAT=tle", category: "comms" },
  { id: "iridium-next", name: "Iridium NEXT", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-NEXT&FORMAT=tle", category: "comms" },
  { id: "starlink", name: "Starlink", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle", category: "comms" },
  { id: "oneweb", name: "OneWeb", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=tle", category: "comms" },
  { id: "orbcomm", name: "Orbcomm", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=orbcomm&FORMAT=tle", category: "comms" },
  { id: "globalstar", name: "Globalstar", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=globalstar&FORMAT=tle", category: "comms" },
  { id: "swarm", name: "Swarm", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=swarm&FORMAT=tle", category: "comms" },
  { id: "amateur", name: "Amateur Radio", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=amateur&FORMAT=tle", category: "amateur" },
  { id: "x-comm", name: "Experimental Comm", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=x-comm&FORMAT=tle", category: "amateur" },
  { id: "science", name: "Space & Earth Science", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle", category: "science" },
  { id: "geodetic", name: "Geodetic", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=geodetic&FORMAT=tle", category: "science" },
  { id: "engineering", name: "Engineering", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=engineering&FORMAT=tle", category: "engineering" },
  { id: "education", name: "Education", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=education&FORMAT=tle", category: "education" },
  { id: "military", name: "Miscellaneous Military", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=military&FORMAT=tle", category: "military" },
  { id: "radar", name: "Radar Calibration", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=radar&FORMAT=tle", category: "military" },
  { id: "cubesat", name: "CubeSats", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=cubesat&FORMAT=tle", category: "cubesat" },
  { id: "other", name: "Other Comm", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=other-comm&FORMAT=tle", category: "comms" },
  { id: "satnogs", name: "SatNOGS", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=satnogs&FORMAT=tle", category: "amateur" },
  { id: "ses", name: "SES", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=tle", category: "comms" },
  { id: "telesat", name: "Telesat", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=telesat&FORMAT=tle", category: "comms" },
  { id: "intelsat", name: "Intelsat", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=tle", category: "comms" },
  { id: "last-30-days", name: "Last 30 Days Launches", url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=tle", category: "recent" },
];

export const TLE_CATEGORIES: Record<string, string> = {
  stations: "Space Stations",
  visual: "Brightest",
  active: "Active",
  weather: "Weather",
  noaa: "NOAA",
  goes: "GOES",
  resource: "Earth Resources",
  sarsat: "Search & Rescue",
  dmc: "Disaster Monitoring",
  tdrss: "Relay Satellites",
  argos: "ARGOS",
  planet: "Planet Labs",
  spire: "Spire",
  geo: "Geostationary",
  gnss: "Navigation (GNSS)",
  comms: "Communications",
  amateur: "Amateur/Experimental",
  science: "Science",
  engineering: "Engineering",
  education: "Education",
  military: "Military",
  cubesat: "CubeSats",
  recent: "Recent Launches",
};

export interface ToolGitHubMeta {
  name: string;
  stars: number;
  language: string | null;
  license: string | null;
  updatedAt: string;
  description: string | null;
  archived: boolean;
  forks: number;
  openIssues: number;
}
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
  OBSERVER_LAT: 9.953592,
  OBSERVER_LON: -84.290668,
  OBSERVER_ALT: 0.9,
  MIN_ELEVATION: 30,
  OVERHEAD_ELEVATION: 75,
  MAC_CORRELATION_WINDOW_S: 10,
  SURVEILLANCE_HANDOFF_WINDOW_S: 30,
  JACO_LAT: 9.6142,
  JACO_LON: -84.6278,
  SJO_LAT: 9.9939,
  SJO_LON: -84.2088,
  SJO_ICAO: "MROC",
};

export interface AnalysisPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
}

export const ANALYSIS_POINTS: AnalysisPoint[] = [
  { id: "observer", name: "Observer — Guácima Abajo", lat: 9.953592, lon: -84.290668, description: "Calle Caballo Real, Provincia de Alajuela" },
  { id: "jaco", name: "Jacó", lat: 9.6142, lon: -84.6278, description: "Pacific coast analysis point, Puntarenas" },
  { id: "sjo", name: "SJO — Juan Santamaría Intl", lat: 9.9939, lon: -84.2088, description: "ICAO: MROC — primary international airport" },
  { id: "ti0rc", name: "TI0RC KiwiSDR", lat: 9.9360, lon: -84.1088, description: "Radio Club de Costa Rica SDR node" },
];

export interface FlightData {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  longitude: number | null;
  latitude: number | null;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  verticalRate: number | null;
  onGround: boolean;
  squawk: string | null;
}

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
  { name: "dump1090", repo: "https://github.com/antirez/dump1090", description: "ADS-B Mode S decoder for RTL-SDR — aircraft radar tracking", domain: "radar" },
  { name: "tar1090", repo: "https://github.com/wiedehopf/tar1090", description: "ADS-B radar web interface with aircraft history and heatmaps", domain: "radar" },
  { name: "readsb", repo: "https://github.com/wiedehopf/readsb", description: "ADS-B decoder daemon — successor to dump1090-fa", domain: "radar" },
  { name: "opensky-api", repo: "https://github.com/openskynetwork/opensky-api", description: "OpenSky Network API client for live flight tracking", domain: "radar" },
  { name: "ADS-B Exchange", repo: "https://github.com/adsbexchange/adsb-exchange", description: "Community-driven ADS-B flight tracking network", domain: "radar" },
  { name: "pyModeS", repo: "https://github.com/junzis/pyModeS", description: "Python Mode S and ADS-B message decoder library", domain: "radar" },
  { name: "ModbusPal", repo: "https://github.com/zerokol/ModbusPal", description: "Modbus/PLC protocol simulator and analyzer", domain: "plc" },
  { name: "pymodbus", repo: "https://github.com/pymodbus-dev/pymodbus", description: "Full Modbus protocol implementation — SCADA/PLC analysis", domain: "plc" },
  { name: "OpenPLC", repo: "https://github.com/thiagoralves/OpenPLC_v3", description: "Open-source PLC runtime for industrial control analysis", domain: "plc" },
  { name: "RouterSploit", repo: "https://github.com/threat9/routersploit", description: "ISP router/CPE exploitation framework — TR-069 ACS analysis", domain: "isp" },
  { name: "tr069-honeypot", repo: "https://github.com/aatlasis/tr069-honeypot", description: "TR-069 ACS honeypot for detecting ISP management abuse", domain: "isp" },
  { name: "SNMPwn", repo: "https://github.com/hatlord/snmpwn", description: "SNMP credential brute-force and ISP device enumeration", domain: "isp" },
  { name: "Shodan", repo: "https://github.com/achillean/shodan-python", description: "Internet-connected device search — ISP infrastructure mapping", domain: "isp" },
  { name: "RF-Drone-Detection", repo: "https://github.com/tesorrells/RF-Drone-Detection", description: "RF-based drone detection using SDR and machine learning classifiers", domain: "drone" },
  { name: "ssm-drone", repo: "https://github.com/adaspera/ssm-drone", description: "State-space model for drone RF signature detection and tracking", domain: "drone" },
  { name: "Drone-detection-dataset", repo: "https://github.com/DroneDetectionThesis/Drone-detection-dataset", description: "Labeled drone RF signal dataset for training detection models", domain: "drone" },
  { name: "VisDrone-Dataset", repo: "https://github.com/VisDrone/VisDrone-Dataset", description: "Large-scale visual drone detection benchmark — object detection and tracking", domain: "drone" },
  { name: "PhastFT", repo: "https://github.com/QuState/PhastFT", description: "High-performance FFT library — quantum-state-inspired fast Fourier transform", domain: "sdr" },
  { name: "quantum-inspired-dsp", repo: "https://github.com/fgonzalezdelamaza/quantum-inspired-dsp", description: "Quantum-inspired digital signal processing algorithms for RF analysis", domain: "sdr" },
  { name: "Quantum-Sparse-Coding", repo: "https://github.com/Adi03codes/Quantum-Inspired-Sparse-Speech-Coding-for-Ultra-Low-Power-Assistive-Hearing-Devices", description: "Quantum-inspired sparse coding for ultra-low-power signal processing", domain: "sdr" },
  { name: "Morserino-32", repo: "https://github.com/oe1wkl/Morserino-32", description: "ESP32-based Morse code trainer/decoder — Marconi-principle RF keying", domain: "sdr" },
  { name: "MorseCodeWithRF", repo: "https://github.com/Buuhis/MorseCodeWithRF", description: "Morse code communication via RF modules — covert low-rate data channel", domain: "sdr" },
  { name: "saatja-rpi", repo: "https://github.com/estintax/saatja-rpi", description: "Raspberry Pi RF transmitter — programmable Morse/CW beacon", domain: "sdr" },
  { name: "urh", repo: "https://github.com/jopohl/urh", description: "Universal Radio Hacker — investigate unknown wireless protocols via SDR", domain: "sdr" },
  { name: "system-bus-radio", repo: "https://github.com/fulldecent/system-bus-radio", description: "Transmit radio from system bus EM emissions — countermeasure/TEMPEST tool", domain: "sdr" },
  { name: "qspectrumanalyzer", repo: "https://github.com/xmikos/qspectrumanalyzer", description: "Qt-based spectrum analyzer for RTL-SDR and hackrf_sweep", domain: "sdr" },
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
  {
    id: "starlink-blackjack-handoff",
    name: "Starlink ↔ BLACKJACK/SDA Handoff",
    description: "Starlink satellite pass ends while BLACKJACK/SDA constellation satellite begins pass at similar azimuth — indicates coordinated handoff pattern. Peak 6-10pm local window.",
    domains: ["satellite", "lte"],
    windowSeconds: 300,
    condition: "starlink.pass_end THEN blackjack.pass_start WITHIN 300s AND azimuth_delta < 30°",
  },
  {
    id: "evening-window-intensity",
    name: "Evening Window Intensity Spike",
    description: "Aggregate cross-domain event rate exceeds 2σ baseline during 6-8pm or 8-10pm local windows — correlates with satellite density peaks.",
    domains: ["wifi", "ble", "lte", "satellite", "radar"],
    windowSeconds: 7200,
    condition: "event_rate > 2σ_baseline DURING 18:00-22:00 CST",
  },
  {
    id: "tr069-satellite-timing",
    name: "TR-069 ACS ↔ Satellite Pass Timing",
    description: "ISP TR-069 management session initiated during satellite overhead window — Liberty/Claro CPE remote access coinciding with reconnaissance pass.",
    domains: ["isp", "satellite"],
    windowSeconds: 120,
    condition: "isp.tr069_session AND satellite.elevation > 30° WITHIN 120s",
  },
  {
    id: "tower-radar-sat-triangulation",
    name: "Tower–Radar–Satellite Triangulation",
    description: "LTE tower handoff + ADS-B aircraft pass + satellite overhead — three-domain spatial correlation around observer location.",
    domains: ["lte", "radar", "satellite"],
    windowSeconds: 60,
    condition: "lte.handoff AND radar.aircraft_in_range AND satellite.pass WITHIN 60s",
  },
  {
    id: "plc-lifi-exfil",
    name: "PLC/Li-Fi Data Exfiltration",
    description: "Powerline communication burst or modulated light emission coincides with BLE beacon and outbound WiFi connection — possible covert exfiltration channel.",
    domains: ["plc", "ble", "wifi"],
    windowSeconds: 10,
    condition: "plc.burst OR lifi.modulation THEN ble.beacon AND wifi.outbound WITHIN 10s",
  },
  {
    id: "isp-backdoor-correlation",
    name: "ISP Backdoor Activation",
    description: "Liberty/Claro CPE opens TR-069 ACS connection to management server while SNMP community string probing detected — ISP-side remote access pattern.",
    domains: ["isp", "wifi"],
    windowSeconds: 30,
    condition: "isp.tr069_connect AND wifi.snmp_probe WITHIN 30s",
  },
  {
    id: "italian-sat-lte-sync",
    name: "Italian Satellite ↔ LTE Sync",
    description: "Italian constellation satellite (COSMO-SkyMed, PRISMA) pass coincides with unusual LTE PDCCH allocation pattern — SAR imaging correlation.",
    domains: ["satellite", "lte"],
    windowSeconds: 180,
    condition: "satellite.name CONTAINS 'COSMO|PRISMA' AND lte.pdcch_anomaly WITHIN 180s",
  },
  {
    id: "chinese-sat-5g-correlation",
    name: "Chinese Satellite ↔ 5G Burst",
    description: "Chinese constellation satellite (Yaogan, Jilin, Gaofen) overhead during 5G NR SSB burst density increase — possible C2 or ELINT correlation.",
    domains: ["satellite", "5g"],
    windowSeconds: 120,
    condition: "satellite.name CONTAINS 'YAOGAN|JILIN|GAOFEN' AND 5g.ssb_burst_spike WITHIN 120s",
  },
  {
    id: "sjo-flight-rf-correlation",
    name: "SJO Flight ↔ RF Anomaly",
    description: "ADS-B aircraft within 10km of SJO runway coincides with WiFi deauth burst or BLE MAC flood — possible jamming or surveillance near airport.",
    domains: ["radar", "wifi", "ble"],
    windowSeconds: 30,
    condition: "radar.aircraft(distance_sjo < 10km) AND (wifi.deauth OR ble.mac_flood) WITHIN 30s",
  },
  {
    id: "jaco-coastal-surveillance",
    name: "Jacó Coastal Surveillance Pattern",
    description: "Multiple domain activity spike at Jacó analysis point — BLE device tracking + satellite pass + ADS-B patrol aircraft over Pacific coast.",
    domains: ["ble", "satellite", "radar"],
    windowSeconds: 300,
    condition: "ble.density_jaco > threshold AND satellite.pass(jaco) AND radar.aircraft(jaco_coast) WITHIN 300s",
  },
  {
    id: "drone-rf-detection",
    name: "Drone RF Signature Detection",
    description: "RF energy spike in 2.4/5.8 GHz drone control bands with modulation pattern matching DJI/FPV protocols — SDR + BLE correlation for proximity tracking.",
    domains: ["drone", "sdr", "ble"],
    windowSeconds: 30,
    condition: "sdr.freq IN [2400-2483, 5725-5875] AND sdr.modulation_match(drone_profile) AND ble.scan_density_spike WITHIN 30s",
  },
  {
    id: "drone-satellite-overhead",
    name: "Drone ↔ Satellite Overhead Correlation",
    description: "Drone RF signature detected while reconnaissance satellite is overhead (>75° elevation) — possible coordinated ISR operation or relay pattern.",
    domains: ["drone", "satellite", "sdr"],
    windowSeconds: 120,
    condition: "drone.rf_detected AND satellite.elevation > 75° WITHIN 120s",
  },
  {
    id: "drone-airport-intrusion",
    name: "Drone ↔ SJO Airspace Intrusion",
    description: "Drone RF control signal detected within SJO/MROC TMA while ADS-B shows commercial traffic — potential UAS airspace violation near Juan Santamaria.",
    domains: ["drone", "radar", "sdr"],
    windowSeconds: 60,
    condition: "drone.rf_detected AND radar.aircraft(distance_sjo < 15km) WITHIN 60s",
  },
];
