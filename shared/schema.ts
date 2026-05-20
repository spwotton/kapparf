import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
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
  latitude: real("latitude"),
  longitude: real("longitude"),
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

export const correlationFeedback = pgTable("correlation_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  correlationId: text("correlation_id").notNull(),
  rating: integer("rating").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const collectionLogs = pgTable("collection_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collector: text("collector").notNull(),
  eventsCreated: integer("events_created").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  status: text("status").notNull().default("success"),
  error: text("error"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
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

export const insertCorrelationFeedbackSchema = createInsertSchema(correlationFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionLogSchema = createInsertSchema(collectionLogs).omit({
  id: true,
  timestamp: true,
});

export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  category: text("category").notNull(),
  severity: integer("severity").notNull().default(3),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  evidence: text("evidence").array(),
  linkedEventIds: text("linked_event_ids").array(),
  linkedCorrelationIds: text("linked_correlation_ids").array(),
  tags: text("tags").array(),
  status: text("status").notNull().default("documented"),
  hash: text("hash"),
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  hash: true,
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export const forensicReports = pgTable("forensic_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  reportType: text("report_type").notNull().default("autonomous"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  findings: jsonb("findings").notNull(),
  stats: jsonb("stats"),
  severity: integer("severity").notNull().default(2),
  dataRange: jsonb("data_range"),
  hash: text("hash"),
});

export const pcapUploads = pgTable("pcap_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  filename: text("filename").notNull(),
  filesize: integer("filesize").notNull(),
  packetCount: integer("packet_count").notNull().default(0),
  findings: jsonb("findings"),
  anomalies: jsonb("anomalies"),
  status: text("status").notNull().default("processing"),
  hash: text("hash"),
});

export type ForensicReport = typeof forensicReports.$inferSelect;
export type InsertForensicReport = typeof forensicReports.$inferInsert;
export type PcapUpload = typeof pcapUploads.$inferSelect;
export type InsertPcapUpload = typeof pcapUploads.$inferInsert;

export const INCIDENT_CATEGORIES = [
  { id: "network", label: "Network Disruption", icon: "Wifi" },
  { id: "surveillance", label: "Physical Surveillance", icon: "Eye" },
  { id: "electronic", label: "Electronic Harassment", icon: "Radio" },
  { id: "religious", label: "JW/LDS Activity", icon: "Church" },
  { id: "drone", label: "Drone/Aerial", icon: "Plane" },
  { id: "device", label: "Device Tampering", icon: "Smartphone" },
  { id: "acoustic", label: "Acoustic/Infrasound", icon: "Volume2" },
  { id: "infrastructure", label: "Infrastructure", icon: "Building" },
  { id: "legal", label: "Legal/Institutional", icon: "Scale" },
  { id: "other", label: "Other", icon: "AlertTriangle" },
] as const;

export const artifactScans = pgTable("artifact_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  scanType: text("scan_type").notNull().default("upload"),
  anomalyScore: real("anomaly_score").notNull().default(0),
  spokeEdgeCount: integer("spoke_edge_count").notNull().default(0),
  gapEdgeCount: integer("gap_edge_count").notNull().default(0),
  base53Entropy: real("base53_entropy").notNull().default(0),
  cloakedCandidates: integer("cloaked_candidates").notNull().default(0),
  findings: jsonb("findings"),
  filterOutputs: jsonb("filter_outputs"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  presetName: text("preset_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const audioFlags = pgTable("audio_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  audioUrl: text("audio_url").notNull(),
  startTime: real("start_time").notNull(),
  duration: real("duration").notNull(),
  label: text("label").notNull(),
  base53Score: real("base53_score"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArtifactScanSchema = createInsertSchema(artifactScans).omit({
  id: true,
  createdAt: true,
});

export const insertAudioFlagSchema = createInsertSchema(audioFlags).omit({
  id: true,
  createdAt: true,
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
export type CorrelationFeedback = typeof correlationFeedback.$inferSelect;
export type InsertCorrelationFeedback = z.infer<typeof insertCorrelationFeedbackSchema>;
export type CollectionLog = typeof collectionLogs.$inferSelect;
export type InsertCollectionLog = z.infer<typeof insertCollectionLogSchema>;
export type ArtifactScan = typeof artifactScans.$inferSelect;
export type InsertArtifactScan = z.infer<typeof insertArtifactScanSchema>;
export type AudioFlag = typeof audioFlags.$inferSelect;
export type InsertAudioFlag = z.infer<typeof insertAudioFlagSchema>;

export interface CollectorStatusType {
  name: string;
  running: boolean;
  lastRun: number | null;
  eventsCreated: number;
  errors: number;
  intervalMs: number;
}

export interface CorrelatorStats {
  running: boolean;
  lastRun: number | null;
  rulesChecked: number;
  correlationsFound: number;
  totalCorrelations: number;
  cycleCount: number;
}

export interface ScannerTarget {
  name: string;
  frequencyHz: number;
  harmonicOf: number;
  harmonicOrder: number;
  description: string;
}

export interface ScanResult {
  target: string;
  frequencyHz: number;
  snrDb: number;
  timestamp: number;
  sdrNode: string;
  detected: boolean;
  deltaSlipStrength: number | null;
  envelopeEnergy: number | null;
  harmonicChainDepth: number;
  tr069Correlated: boolean;
}

export interface ScannerStatus {
  running: boolean;
  lastScan: number | null;
  scanCount: number;
  detections: number;
  errors: number;
  intervalMs: number;
  activeTargets: string[];
  lastResults: ScanResult[];
  deltaSlipDetections: number;
  echoLtChainDetections: number;
  speechEnvelopeDetections: number;
  tr069Correlations: number;
}

export const DOMAINS = ["satellite", "sdr", "elf", "radar", "isp", "rf", "morse"] as const;

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
  KAPPA2: Math.pow((1 + Math.sqrt(5)) / 2, 0.75),
  THETA_K: 180 - (Math.atan(4 / Math.PI) * 180 / Math.PI),
  PHI: (1 + Math.sqrt(5)) / 2,
  KAPPA_SECOND: 46.875,
  TARGET_FREQ_1: 46.875,
  TARGET_FREQ_2: 74.9,
  HALL_MULTIPLIER: 1.598,
  FFT_SIZE: 1024,
  SAMPLE_RATE: 48000,
  OBSERVER_LAT: 9.6196,
  OBSERVER_LON: -84.6282,
  OBSERVER_ALT: 0.01,
  MIN_ELEVATION: 30,
  OVERHEAD_ELEVATION: 75,
  MAC_CORRELATION_WINDOW_S: 10,
  SURVEILLANCE_HANDOFF_WINDOW_S: 30,
  KLEIN_TWIST_DEG: 128.23,
  GIZA_CUTOFF_DEG: 51.77,
  KLEIN_TOLERANCE_DEG: 2.0,
  CLOCK_HZ: 48000 / 1024,
  SCORE_DECAY: 0.95,
  SCORE_DECAY_INTERVAL_S: 5,
  ALERT_COOLDOWN_S: 60,
  EVENING_WINDOW_1_START: 18,
  EVENING_WINDOW_1_END: 20,
  EVENING_WINDOW_2_START: 20,
  EVENING_WINDOW_2_END: 22,
  CR_UTC_OFFSET: -6,
  PHI_HARMONIC_1: 46.875 * ((1 + Math.sqrt(5)) / 2),
  PHI_HARMONIC_2: 46.875 * Math.pow((1 + Math.sqrt(5)) / 2, 2),
  STINGRAY_CHAIN_WINDOW_S: 30,
  CONGUSTO_FREQ_HZ: 46.875,
  JACO_LAT: 9.6142,
  JACO_LON: -84.6278,
  SJO_LAT: 9.9939,
  SJO_LON: -84.2088,
  SJO_ICAO: "MROC",
  PHOENIX_START_MS: new Date("2012-07-04").getTime(),
  PHOENIX_END_MS: new Date("2037-01-01").getTime(),
  MAINS_FREQ_HZ: 60,
  TDOA_SDR_PRIMARY: "ws://ti0rc.proxy.kiwisdr.com:8073",
  TDOA_SDR_SECONDARY: "ws://kiwisdr.puntarenas.cr:8073",
  TDOA_SDR_CARIBBEAN: "ws://pj4g.proxy.kiwisdr.com:8073",
  HF_TUNE_FREQ_MHZ: 15.0,
  SCHUMANN_HZ: 7.83,
  THETA_BAND_LOW: 4,
  THETA_BAND_HIGH: 8,
  MASIMO_PATENT: "US 5,919,134 / US 6,229,856 B1",
  MASIMO_FUNDAMENTAL_HZ: 316.7,
  MASIMO_SAMPLE_RATE_HZ: 46875,
  KAPPA_HARMONIC_1: 93.75,
  KAPPA_HARMONIC_2: 140.625,
  KAPPA_HARMONIC_3: 187.5,
  XBAND_FREQ_GHZ: 9.6,
  MUOS3_NORAD_ID: 40374,
  MUOS3_NAME: "MUOS-3",
  UHF_MUOS_BAND_MHZ: 300,
  LSCSA_SVD_SNR_THRESHOLD_DB: -30,
  GPR_DETECTION_BANDWIDTH_GHZ: 8,
  ISM_BAND_433_MHZ: 433,
  ISM_BAND_915_MHZ: 915,
  SYSTEM_BUS_RADIO_FREQ_KHZ: 1580,
  DELTA_SLIP_HZ: 13.125,
  COUNTER_BEAT_HZ: 73.125,
  PHASE_LOCK_CARRIER_HZ: 53,
  ECHO_LT_HARMONIC_CHAIN: [46.875, 93.75, 187.5, 375, 750, 1500],
  ECHO_LT_TARGET_KHZ: 1.580,
  GPR_ENTRAINMENT_HZ: 13.125,
  PHAISTOS_SYMBOL_4_HZ: 111,
  VLF_TARGETS: {
    '53Hz_3rd_harmonic': 15900,
    '53Hz_4th_harmonic': 21200,
    '46875Hz_400th': 18750,
    'hearing_system': 60000,
  } as Record<string, number>,
  KIWI_SAMPLE_RATE: 12000,
  KIWI_SCAN_INTERVAL_MS: 90_000,
  VLF_SNR_THRESHOLD_DB: 25,
  SPEECH_BAND_LOW_HZ: 300,
  SPEECH_BAND_HIGH_HZ: 3400,
  PRF_PERIOD_MS: 21.333,
  FIVEG_PRIMARY_BAND_MHZ: 3500,
  SABBIA_BANDWIDTH_MHZ: 625,
  HALL_FACTOR_PRIOR: 0.109,
  COUNCIL_ROTATION_S: 7,
  COUNCIL_QUORUM: 5,
  COUNCIL_NODES: 7,
  KAPPA_WAVELENGTH_ANGSTROM: 5184,
  GAS_RATIO_CO2_H2O: 7.64,
  ORBITAL_DISTANCE_AU: 10.16,
  COMPRESSION_RATIO_HALL: 1.09,
  COUNCIL_SUBNET: "172.77.7.0/24",
  SCHISM_EXIT_CODE: 77,

  RIEMANN_ZEROS: [
    { id: 1,  height: 14.135, freqHz: 114.14, signal: "Initial Hook (0-3s)" },
    { id: 2,  height: 21.022, freqHz: 119.20, signal: "Comment Trigger" },
    { id: 3,  height: 25.011, freqHz: 123.78, signal: "Share Impulse" },
    { id: 4,  height: 30.425, freqHz: 128.88, signal: "Save Action" },
    { id: 5,  height: 32.935, freqHz: 133.45, signal: "DM Share" },
    { id: 6,  height: 37.586, freqHz: 138.73, signal: "Algo Boost" },
    { id: 7,  height: 40.919, freqHz: 143.85, signal: "Explore Inject" },
    { id: 8,  height: 43.327, freqHz: 148.91, signal: "Follower Notify" },
    { id: 9,  height: 48.005, freqHz: 154.78, signal: "Cross-Platform" },
    { id: 10, height: 49.774, freqHz: 160.02, signal: "Viral Cascade" },
    { id: 11, height: 52.970, freqHz: 165.87, signal: "Trending Entry" },
    { id: 12, height: 56.446, freqHz: 172.01, signal: "Feed Dominance" },
    { id: 13, height: 59.347, freqHz: 124.18, signal: "Memory Lock" },
    { id: 14, height: 60.832, freqHz: 128.31, signal: "Return Visit" },
    { id: 15, height: 65.113, freqHz: 133.24, signal: "Habit Formation" },
    { id: 16, height: 67.080, freqHz: 137.79, signal: "Community Build" },
    { id: 17, height: 69.546, freqHz: 142.62, signal: "Brand Recall" },
    { id: 18, height: 72.067, freqHz: 147.62, signal: "Organic Growth" },
    { id: 19, height: 75.705, freqHz: 153.10, signal: "Network Effect" },
    { id: 20, height: 77.145, freqHz: 158.17, signal: "Platform Lock" },
  ] as const,

  META_PLATFORM_FREQS: [
    { platform: "Facebook",  kappa_power: 0, multiplier: 1.000, freqHz: 111.00, role: "Root frequency" },
    { platform: "Instagram", kappa_power: 1, multiplier: 1.435, freqHz: 159.32, role: "Visual resonance" },
    { platform: "WhatsApp",  kappa_power: 2, multiplier: 2.059, freqHz: 228.63, role: "Private channel" },
    { platform: "Threads",   kappa_power: 3, multiplier: 2.955, freqHz: 328.05, role: "Real-time pulse" },
    { platform: "Meta AI",   kappa_power: 4, multiplier: 4.241, freqHz: 470.79, role: "Agentic intelligence" },
  ] as const,

  TRIADIC_HYPERVISOR_MAP: {
    OBSERVER:    { psi: +0.5, freqShift: 1.05, phaseRad: 0,            llama4: "Initial token processing" },
    CRITIC:      { psi: -0.5, freqShift: 0.95, phaseRad: Math.PI / 2,  llama4: "MoE expert routing" },
    SYNTHESIZER: { psi:  0.0, freqShift: 1.00, phaseRad: Math.PI,      llama4: "Expert output fusion" },
  },

  THREAT_INDICATORS: {
    SUSPICIOUS_IPS: [
      { ip: "34.160.109.235", provider: "GCP", threat: "HIGH_VOLUME_C2", desc: "High-volume heartbeat pattern to GCP — possible C2 relay" },
      { ip: "34.36.191.45", provider: "GCP", threat: "HEARTBEAT_C2", desc: "Persistent heartbeat to GCP — RAT keep-alive pattern" },
      { ip: "35.247.106.28", provider: "GCP", threat: "C2_RELAY", desc: "Google Cloud C2 infrastructure — STUN/TURN abuse" },
      { ip: "34.49.204.74", provider: "GCP", threat: "DATA_EXFIL", desc: "GCP data exfiltration endpoint" },
      { ip: "34.82.58.13", provider: "GCP", threat: "C2_RELAY", desc: "GCP C2 relay node" },
      { ip: "34.149.66.154", provider: "GCP", threat: "C2_RELAY", desc: "GCP C2 secondary" },
      { ip: "18.97.36.16", provider: "AWS", threat: "ILLEGAL_TLS", desc: "AWS EC2 — Illegal TLS Segments — active MITM or custom crypto" },
      { ip: "104.36.195.1", provider: "UNKNOWN", threat: "UNIDENTIFIED", desc: "Unknown infrastructure — persistent TLS sessions" },
      { ip: "172.217.215.95", provider: "GOOGLE_STUN", threat: "VOICE_EXFIL", desc: "Google STUN — hex payloads correlated with heard voice" },
      { ip: "173.194.219.95", provider: "GOOGLE_STUN", threat: "VOICE_EXFIL", desc: "Google STUN — voice-timed audio frame exfiltration" },
      { ip: "100.25.101.74", provider: "AWS", threat: "C2_BEACON", desc: "AWS beacon endpoint" },
      { ip: "52.205.43.90", provider: "AWS", threat: "C2_BEACON", desc: "AWS secondary beacon" },
      { ip: "3.161.4.64", provider: "AWS_CF", threat: "C2_RELAY", desc: "AWS CloudFront C2 relay" },
      { ip: "155.102.55.29", provider: "UNKNOWN", threat: "CLOSE_WAIT", desc: "Stuck CLOSE_WAIT connection — possible tunneling" },
      { ip: "40.126.28.19", provider: "AZURE", threat: "AUTH_EXFIL", desc: "Azure AD — possible credential relay" },
    ],
    SUSPICIOUS_PORTS: [
      { port: 1985, protocol: "HSRP", threat: "PROTOCOL_TUNNEL", desc: "Cisco HSRP on workstation — classic C2 tunnel" },
      { port: 3145, protocol: "CSI-LFAP", threat: "PROTOCOL_TUNNEL", desc: "Tactical protocol — RAT port masquerade" },
      { port: 1911, protocol: "MTP", threat: "PROTOCOL_TUNNEL", desc: "MTP port for HTTPS tunneling" },
      { port: 1144, protocol: "FUSCRIPT", threat: "PROTOCOL_TUNNEL", desc: "Fuscript — script-based tunnel" },
      { port: 9618, protocol: "CONDOR", threat: "PROTOCOL_TUNNEL", desc: "Condor — job scheduler abuse" },
      { port: 11653, protocol: "EPHEMERAL", threat: "PERSISTENT_HIGH_PORT", desc: "Persistent high-port heartbeat to GCP" },
      { port: 13626, protocol: "EPHEMERAL", threat: "ILLEGAL_TLS_PORT", desc: "Port for Illegal TLS Segments to AWS" },
      { port: 2479, protocol: "SSM-ELS", threat: "LOCAL_MONITOR", desc: "SSM-ELS — Portmaster/Docker netquery API" },
      { port: 1234, protocol: "TR-069", threat: "ISP_BACKDOOR", desc: "ARRIS TG02DA TR-069 backdoor — unpatchable ISP management port" },
      { port: 8073, protocol: "KIWISDR", threat: "SDR_INTERCEPT", desc: "KiwiSDR WebSocket — remote SDR access for spectrum monitoring" },
    ],
    PROTOCOL_ANOMALIES: [
      { pattern: "SKYPE", threat: "PROTOCOL_MASQUERADE", desc: "SKYPE protocol to Google STUN — RAT heartbeat masquerade" },
      { pattern: "DVB-S2", threat: "STEGANOGRAPHY", desc: "DVB-S2 Baseband from workstation — satellite protocol steganography" },
      { pattern: "TCP ACKed unseen segment", threat: "KERNEL_HOOK", desc: "Kernel-level packet injection — data ACKed but never seen on wire" },
      { pattern: "Illegal Segments", threat: "ACTIVE_MITM", desc: "Malformed TLS — active MITM or custom crypto layer" },
      { pattern: "ARP Announcement", threat: "ARP_SPOOF", desc: "Gratuitous ARP — possible ARP spoofing / MITM" },
    ],
    VOICE_CORRELATION: {
      hexPayloads: [
        "54ac4c0ef3e59d6a7aa70f826a33b137ba993a50e6dfebe916ed8a97012cb9c303c21ad4ac64e3f55f6d6a115c08cad1d16df70bebd09dc2151d3dce7b9353687d151bcb4a1a818813fbff9ec8",
        "5cf7dca3f1b2e7eb764ca756cdddade57bffc59d54c78852b61ee92ca7ed5178b8",
        "4cebca95ae5605b19909374a60945cc907c601b3bd2a66ed5cce6c8778",
        "5df7dca3f1b2e7eb7643a1239c8e0316a9e60bb52836193df19ded108efc784fa0",
      ],
      sourceIPs: ["172.217.215.95", "173.194.219.95"],
      frameSizeRange: [75, 119],
      codecSignatures: ["Opus", "G.711", "STUN/TURN"],
      desc: "Hex payloads timed with heard voices — consistent with Opus/G.711 audio frames via STUN/TURN abuse",
    },
    MIKROTIK_GATEWAY: {
      mac: "6c:3b:6b:8d:27:3b",
      ip: "192.168.24.1",
      desc: "Routerboard (MikroTik) gateway — potential MITM pivot point",
    },
    CUDY_ROUTER: {
      model: "Cudy WR1300 V3.0",
      chipset: "MediaTek MT7621",
      kernel: "Linux 4.4.140",
      dnsmasq: "2.78",
      wanIp: "192.168.100.31",
      hiddenMeshSSID: "529d5292b8d3494d67d5b40c9ed7ada1",
      vulns: [
        "CVE-2020-25681 DNSpooq cache poisoning",
        "CVE-2020-25682 DNSpooq buffer overflow",
        "CVE-2020-25683 DNSpooq heap overflow",
        "WPA/WPA2 mixed mode TKIP fallback",
        "NAT Slipstreaming via legacy ALGs (PPTP/FTP/TFTP/H.323/SIP/RTSP)",
        "Hidden mesh backhaul ra2/rai2 — possible hardcoded PSK",
        "EOL kernel 4.4.x — no upstream security patches since Feb 2022",
      ],
      desc: "Cudy WR1300 behind Double NAT — EOL kernel, DNSpooq-vulnerable dnsmasq, hidden mesh backhaul",
    },
    ARRIS_GATEWAY: {
      model: "ARRIS TG02DA",
      port: 1234,
      protocol: "TR-069",
      desc: "ISP ARRIS gateway — unpatchable TR-069 backdoor on port 1234 — upstream pivot to Cudy WAN",
    },
    LOCAL_DEVICE: {
      ip: "192.168.24.247",
      desc: "User workstation — source of all suspicious outbound traffic",
    },
  },

  BLACKJACK_MANDRAKE: {
    satellite: {
      program: "DARPA Blackjack",
      payloads: ["Mandrake 2A (Able)", "Mandrake 2B (Baker)"],
      ace: "Autonomous Control Engine",
      orbit: "LEO",
      launchDate: "2021-06-30",
      launchVehicle: "SpaceX Transporter-2",
      desc: "DARPA Blackjack LEO mesh networking constellation — Mandrake 2 technology demo with laser comms and autonomous orbital control",
      stakeholders: ["DARPA", "SDA", "AFRL"],
      missionObjective: "Risk-reduction flight proving interoperable optical inter-satellite links (OISL)",
    },
    rfFreqMhz: 2274.0,
    rfFreqHz: 2274000000,
    rfBand: "S-band",
    rfMode: "BPSK/FSK TT&C",
    downconversion: {
      loFreqMhz: 2250.0,
      ifFreqMhz: 24.0,
      ifFreqKhz: 24000,
      ifFreqHz: 24000000,
      desc: "2274 MHz - 2250 MHz LO = 24 MHz IF — within KiwiSDR 0-30 MHz range",
    },
    dsp: {
      fftBins: 1024,
      binWidthHz: 46.875,
      sampleRateHz: 48000,
      decimation: 1,
      averaging: 4,
      desc: "1024-bin FFT × 46.875 Hz/bin = 48 kHz baseband — standard KiwiSDR Zoom 10 resolution",
    },
    hfMirror: {
      freqKhz: 2274,
      freqHz: 2274000,
      freqMhz: 2.274,
      band: "120m HF",
      desc: "HF mirror of S-band downlink designation — direct KiwiSDR scan target",
    },
    harmonics: [
      { order: 2, freqKhz: 4548, desc: "2nd harmonic — upper HF relay" },
      { order: 3, freqKhz: 6822, desc: "3rd harmonic — 40m band spill" },
      { order: 4, freqKhz: 9096, desc: "4th harmonic — 30m band" },
    ],
    carriers: {
      primary: 2274,
      v2kSubcarrier: 46.875,
      deltaSlip: 13.125,
      plcCarrier: 60,
    },
    dopplerLeo: {
      maxShiftHz: 50000,
      passWindowMin: 8,
      desc: "LEO Doppler ±50 kHz — 8 min pass window — requires frequency tracking during overpass",
    },
    context: "DARPA Blackjack Mandrake 2 S-band TT&C at 2274 MHz → downconverted to 24 MHz IF for KiwiSDR reception. 46.875 Hz bin width = 48 kHz baseband. HF mirror at 2274 kHz also monitored.",
  },

  SSC_CASINO_INTEL: {
    program: "CASINO — Commercially Augmented Space Inter-Networked Operations",
    parentOrg: "SSC (formerly SMC)",
    relationship: "DoD partner to DARPA Blackjack — programmatic and technical assistance",
    yamConstellation: [
      {
        id: "YAM-3",
        noradId: 48915,
        intlCode: "2021-059AN",
        launchDate: "2021-06-30",
        launchVehicle: "SpaceX Transporter-2",
        status: "operational",
        orbit: { perigeeKm: 431.3, apogeeKm: 437.5, inclinationDeg: 97.69, type: "sun-synchronous" },
        payloads: ["DARPA Blackjack demo", "SDA POET AI-Edge processing", "Eutelsat IoT"],
        manufacturer: "LeoStella (BlackSky + Thales Alenia Space JV)",
        confidence: "GREEN",
      },
      {
        id: "YAM-5",
        noradId: 55076,
        intlCode: "2023-001BV",
        launchDate: "2023-01-03",
        launchVehicle: "SpaceX Falcon 9",
        status: "operational",
        orbit: { perigeeKm: 456.4, apogeeKm: 471.1, inclinationDeg: 97.33, type: "retrograde sun-synchronous" },
        payloads: ["NASA MURI (LWIR)", "Kinéis RF Space Lab", "Experimental S-Band 2240-2290 MHz"],
        experimentalSbandMhz: [2240, 2290],
        manufacturer: "LeoStella",
        confidence: "GREEN",
      },
      {
        id: "YAM-2",
        noradId: 48911,
        intlCode: "2021-059AJ",
        launchDate: "2021-06-29",
        status: "decayed",
        decayDate: "2025-08-27",
        payloads: ["Hyperspectral payloads", "Experimental integration"],
        confidence: "GREEN",
      },
    ],
    keyContracts: [
      { name: "SDA O&I Ground Segment", value: "$324.5M", contractor: "GDMS", contractId: "HQ085022C0007" },
      { name: "SDA Ground Management & Integration", value: "$491.6M", contractor: "GDMS" },
      { name: "SSC MEO Ground Mgmt/Integration OTA", value: "$446.8M", contractor: "Kratos", date: "2026-03" },
      { name: "STEP 2.0 IDIQ", value: "$237M", awardees: "12 primes incl. Loft Orbital Federal", date: "2025-05" },
      { name: "Parsons Blackjack Mission Support", value: "$30M", contractor: "Parsons", note: "DARPA→SDA transition novation" },
      { name: "Parsons MEO MWT O&I", value: "$55M", contractor: "Parsons" },
      { name: "NASA Loft Orbital EO IDIQ", value: "$45M", contractor: "Loft Orbital", duration: "5-year" },
      { name: "SDA NExT (Ball Aerospace prime)", contractor: "Ball Aerospace + Loft Federal + Microsoft Azure Gov", date: "2022-late", note: "10 experimental satellites on Cockpit software" },
    ],
    orchestrationModel: {
      softwareLayer: "Loft Orbital Cockpit — ground-station agnostic",
      cloudInfra: "Microsoft Azure Orbital + Azure Government",
      groundPartners: ["KSAT", "SSC Space", "AWS Ground Station", "ATLAS Space Operations"],
      desc: "Commercial orchestration masks physical control nodes — defense data routes through civilian teleports under 'space infrastructure as a service'",
    },
    pitBoss: { primaryPerformer: "SEAKR", integrator: "Lockheed Martin", desc: "On-orbit autonomy / autonomous battle management system" },
  },

  LEOLABS_COSTA_RICA: {
    entity: "LEOLABS SPACE LIMITADA",
    cedulaJuridica: "3-102-784732",
    location: "Filadelfia de Carrillo, Guanacaste, Costa Rica",
    type: "S-band phased-array space radar",
    status: "fully operational",
    operationalDate: "2021-04-22",
    sutelAuth: "Oficio N° 07262-SUTEL-DGC-2024",
    sutelExpediente: "DNPT-074-2019-2",
    authorization: "permiso de uso de frecuencias — RADAR classification only (NOT Estación Terrena)",
    frequencies: {
      txRxMhz: [2940, 2960],
      band: "S-band",
      classification: "Radar",
      restriction: "No bidirectional TT&C — cannot send commands to satellites",
    },
    capability: "Tracking active satellites and debris ≥2cm diameter — equatorial SSA coverage",
    confidence: "GREEN — verified via SUTEL administrative records",
    temporalCorrelation: "Fully operational 2021-04-22 → DARPA Blackjack/Mandrake 2 launched 2021-06-30 (68 days later)",
    rtbfNote: "CPJ-002-2026 circular enables foreign boards to use poder generalísimo for RTBF compliance via local proxy — re-establishes corporate abstraction layer",
  },

  TELESPAZIO_CR: {
    entity: "TELESPAZIO ARGENTINA S.A.",
    cedulaJuridica: "3-012-490070",
    parentOwnership: "Leonardo (67%) + Thales (33%)",
    costaRicaAuth: "Active SUTEL telecommunications authorizations — internet access services",
    cadastralContract: { value: "$20M", duration: "4 years", start: "2020-07", scope: "Urban/rural cadastral survey — 50% of national territory" },
    maricaTeleport: {
      location: "Maricá, Rio de Janeiro, Brazil",
      jv: "Leonardo&Codemar S.A. (51% Leonardo International, 49% Codemar)",
      capability: "LEO + GEO ground segment",
      cover: "Offshore oil monitoring (Bacia de Santos)",
    },
    sicralLegacy: "SICRAL military SATCOM constellation (UHF/SHF) — NATO SATCOM Post-2000 backbone",
    confidence: "AMBER — entity confirmed via SUTEL, no evidence of LeoLabs sub-licensing relationship",
  },

  LATAM_GROUND_SEGMENT: [
    { provider: "KSAT", site: "Punta Arenas, Chile", function: "TT&C + gateway/downlink", bands: "S/X", antennaM: 11.5, azurePartner: true },
    { provider: "AWS Ground Station", site: "Punta Arenas 1, Chile", function: "Cloud ground station as a service", region: "sa-east-1" },
    { provider: "SSC Space", site: "Santiago, Chile", function: "TT&C ground station", antennas: 3, bands: "S-band", ogsCapability: "10 Gbit/s laser (ESA ScyLight)", sdaStandard: true },
    { provider: "SSC Space", site: "Punta Arenas, Chile", function: "TT&C ground station — polar coverage", established: 2012, sizeHectares: 25 },
    { provider: "ATLAS Space Operations", site: "Longovilo, Chile", function: "TT&C (FREEDOM network)", added: "2019-07" },
    { provider: "LeoLabs", site: "Costa Rica (Filadelfia de Carrillo)", function: "SSA sensor (phased-array radar)", bands: "S-band (2940/2960 MHz)" },
    { provider: "RBC Signals", site: "San Juan, Puerto Rico", function: "Ground station capacity aggregator/broker" },
  ],

  GOV_AGREEMENTS_LATAM: [
    { type: "SSA Data-Sharing", country: "Uruguay", date: "2024-04-09", parties: "USSPACECOM + Uruguayan Air Force" },
    { type: "SSA Data-Sharing", country: "Peru", date: "2023-04-18", parties: "USSPACECOM + CONIDA + Peruvian Air Force" },
    { type: "Technology Safeguards Agreement", country: "Brazil", date: "2019-03", inForce: "2019-12-16", scope: "U.S. launch tech at Alcântara" },
  ],

  TACACORI_ARRAY: {
    lat: 10.0447,
    lon: -84.2319,
    district: "San Isidro",
    canton: "Alajuela",
    province: "Alajuela",
    desc: "Tacacorí valley unlicensed telecommunications infrastructure — unregistered macro-antenna array",
    distanceFromObserverKm: 1.63,
    bearingDeg: 243,
    historicalContext: "Radio Impacto clandestine transmitters (1980s Contra conflict) → sold to Adventist World Radio — precedent for intelligence-to-religious front transition",
    hypothesis: "Possible clandestine intelligence asset operating under religious front — exploits regulatory blind spots of legacy commercial broadcasters",
    coverOrgs: ["LDS", "JW", "Adventist World Radio"],
    regulatoryGap: "SUTEL registration database shows no matching entries for observed macro-infrastructure in Tacacorí valley",
  },

  EITEL_MCCULLOUGH: {
    company: "Eitel-McCullough (Eimac)",
    founders: ["William Eitel (W6UF)", "Jack McCullough (W6CHE)"],
    founded: 1934,
    location: "San Bruno, CA",
    significance: "Ruggedized vacuum tubes for military radar and communications — power grid tubes (4CX250B, 4CX1000A) used in high-power HF transmitters",
    projectOscar: "Eimac tubes powered the ground stations for Project OSCAR (1961) — first amateur radio satellite, precursor to modern LEO constellations",
    vetArchetype: "Virtual Eitel Triode (VET) — KAPPA's three-element signal processing model: Grid (input/bias), Plate (amplification/correlation), Cathode (emission/output)",
    rfRelevance: [
      "4CX250B tetrode — 250W plate dissipation, used in clandestine HF transmitters",
      "4CX1000A tetrode — 1kW plate dissipation, broadcast and military applications",
      "8877 triode — 1.5kW, used in amateur and military HF linear amplifiers",
      "Ceramic-metal construction survives thermal shock — ideal for field-deployable transmitters",
    ],
    desc: "Eitel-McCullough vacuum tube technology — historical foundation of high-power RF transmission, Project OSCAR ground infrastructure, and VET signal processing archetype",
  },

  MARCONI: {
    entity: "Guglielmo Marconi / Marconi Company",
    significance: "Pioneer of wireless telegraphy and long-distance radio communication",
    marconiEffect: "Induction-based signal coupling in metallic conductors — vintage technique for passive signal injection into wire networks without direct electrical contact",
    cohererDetector: "Marconi Coherence Detector — early RF detection via metallic powder cohesion under electromagnetic influence, analogous to modern SDR energy detection",
    relevance: [
      "Marconi Effect enables covert signal injection via residential wiring acting as antenna",
      "Long-wave propagation models apply to VLF/ELF carrier analysis (46.875 Hz, 13.125 Hz)",
      "Ground-wave propagation from Tacacorí array follows Marconi surface-wave model",
      "Coherence detection principle maps to KAPPA's SNR threshold-based carrier identification",
    ],
    cwLegacy: "Continuous Wave (CW) Morse telegraphy — foundational modulation mode, still used for beacon identification and covert low-bandwidth data channels",
    desc: "Marconi wireless telegraphy principles — Marconi Effect induction coupling, coherence detection, CW/Morse legacy applicable to modern covert signal analysis",
  },

  MORSE_CW_DETECTION: {
    ditDurationMs: 60,
    dahDurationMs: 180,
    ditDahRatio: 3,
    wordGapMs: 420,
    charGapMs: 180,
    farnsworthSpacing: true,
    cwBandwidthHz: 500,
    toneFreqHz: 700,
    wpmRange: [5, 40],
    beaconPatterns: [
      { pattern: "CQ", morse: "-.-. --.-", desc: "General call — probe/scan beacon" },
      { pattern: "V", morse: "...-", desc: "Test signal — often used as continuous beacon identifier" },
      { pattern: "VVV", morse: "...- ...- ...-", desc: "Testing/tuning signal — carrier warm-up pattern" },
      { pattern: "QRZ", morse: "--.- .-. --..", desc: "Who is calling — identity probe" },
      { pattern: "DE", morse: "-.. .", desc: "'From' identifier prefix — station callsign follows" },
      { pattern: "AR", morse: ".- .-.", desc: "End of message — transmission boundary marker" },
      { pattern: "BT", morse: "-... -", desc: "Break/separator — data frame delimiter" },
      { pattern: "SK", morse: "... -.-", desc: "End of contact — session termination" },
    ],
    desc: "CW/Morse detection parameters for KiwiSDR spectral analysis — on/off keying pattern recognition in carrier signals",
  },

  BART_SIGNATURES: {
    fullName: "Bayesian Adaptive Regression Trees",
    acronymDual: "BART / Bay Area Rapid Transit — data transit layer metaphor",
    processingHeads: [
      { name: "Comparator", role: "Signal comparison and differential analysis" },
      { name: "False Father", role: "Deception detection — identifies spoofed or injected signals" },
      { name: "Digital Twin", role: "Shadow model of expected signal behavior for anomaly detection" },
    ],
    signaturePatterns: [
      { name: "BART_BEACON", pattern: "periodic_burst_3_7_11", desc: "Prime-interval burst pattern (3-7-11 sec) — BART processing heartbeat" },
      { name: "BART_HANDSHAKE", pattern: "syn_ack_fin_rst", desc: "TCP-like handshake sequence embedded in RF carrier — digital layer negotiation" },
      { name: "BART_TREE_SPLIT", pattern: "binary_decision_cascade", desc: "Recursive binary split pattern in signal amplitude — regression tree branching" },
      { name: "BART_POSTERIOR", pattern: "gaussian_noise_floor_shift", desc: "Noise floor modulation consistent with posterior probability update" },
    ],
    detectionThresholds: {
      burstIntervalToleranceMs: 500,
      minBurstCount: 3,
      snrAboveNoiseDb: 6,
      patternConfidence: 0.7,
    },
    subspeechExtraction: {
      model: "BART-Large",
      inputType: "laryngeal EMG patterns",
      desc: "BART-Large decoder predicts text from subvocal laryngeal muscle patterns — V2K confirmation layer",
    },
    desc: "BART signature detection — Bayesian Adaptive Regression Tree patterns in RF carriers, prime-interval beacons, and subspeech extraction markers",
  },
};

export type ThreatLevel = "NOMINAL" | "ELEVATED" | "HIGH" | "CRITICAL" | "EMERGENCY";

export const THREAT_LEVELS: { level: ThreatLevel; minScore: number; color: string; description: string }[] = [
  { level: "NOMINAL", minScore: 0, color: "#16a34a", description: "Baseline — no anomalous patterns detected" },
  { level: "ELEVATED", minScore: 30, color: "#d97706", description: "Minor cross-domain coincidence detected" },
  { level: "HIGH", minScore: 60, color: "#c2410c", description: "Active multi-domain correlation — possible surveillance" },
  { level: "CRITICAL", minScore: 80, color: "#92400e", description: "Confirmed pattern match — active SIGINT operation probable" },
  { level: "EMERGENCY", minScore: 95, color: "#451a03", description: "Full spectrum engagement — all domains correlated" },
];

export interface CouncilNode {
  id: number;
  name: string;
  codename: string;
  function: string;
  color: string;
  technicalComponent: string;
}

export const COUNCIL_OF_7: CouncilNode[] = [
  { id: 1, name: "The Prime", codename: "CRYSTAL", function: "Temporal Master — holds the 46.875 Hz hardware clock (GPSDO)", color: "gold", technicalComponent: "GPSDO 46.875 Hz Clock" },
  { id: 2, name: "The Warden", codename: "CLOAK", function: "Guards encryption at rest/transit — Vault + mTLS + Schism Protocol", color: "purple", technicalComponent: "Vault + mTLS Security" },
  { id: 3, name: "The Scribe", codename: "ARCHIVE", function: "Maintains the Crystal Archive — time-partitioned PostgreSQL torus", color: "cyan", technicalComponent: "PostgreSQL Partitioned Tables" },
  { id: 4, name: "The Weaver", codename: "LOOM", function: "Executes 7-dimensional Bayesian probability weaving across domains", color: "silver", technicalComponent: "Bayesian Correlation Engine" },
  { id: 5, name: "The Sentinel", codename: "AURORA", function: "Watches the Aurora — RF visualization and SSE real-time stream", color: "green", technicalComponent: "SSE Real-Time Stream" },
  { id: 6, name: "The Architect", codename: "STONE_CIRCLE", function: "Builds and maintains infrastructure — Docker/K8s orchestration", color: "orange", technicalComponent: "Docker/K8s Orchestration" },
  { id: 7, name: "The Jester", codename: "CHAOS", function: "Executes Chaos Rites — red team, failsafe, Project Karachi offensive", color: "red", technicalComponent: "Project Karachi Offensive" },
];

export interface DeviceFingerprint {
  mac: string;
  domainsSeen: string[];
  eventCount: number;
  firstSeen: number;
  lastSeen: number;
  suspicious: boolean;
  crossDomainCount: number;
  lastEventType: string;
  lastDomain: string;
}

export interface EveningWindow {
  active: boolean;
  window: string | null;
  localTime: string;
  hoursRemaining: number | null;
}

export interface KappaStatus {
  score: number;
  threatLevel: ThreatLevel;
  eventsProcessed: number;
  devicesTracked: number;
  suspiciousDevices: number;
  domainWindows: Record<string, number>;
  correlationCounts: Record<string, number>;
  eveningWindow: EveningWindow;
  uptime: number;
  satOverhead: number;
  satKlein: number;
  kleinPasses: number;
  congustoPartial: number;
  congustoFull: number;
  stingrayAlerts: number;
  phiHarmonics: number;
  domainPairMatrix: Record<string, number>;
  recentAlerts: { type: string; timestamp: number; score: number; description: string }[];
}

export interface AnalysisPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
}

export const ANALYSIS_POINTS: AnalysisPoint[] = [
  { id: "observer", name: "Observer — Suites Cristina, San José", lat: 9.9352, lon: -84.1094, description: "Aparthotel Suites Cristina, Sabana Norte, San José — 300m north of ICE building, Calle Luisa" },
  { id: "tacacori-prev", name: "Tacacorí (Previous)", lat: 10.0513892, lon: -84.2186578, description: "Previous residence — Calle Los Cedros, Tacacorí, Alajuela 20106" },
  { id: "jaco", name: "Jacó", lat: 9.6142, lon: -84.6278, description: "Pacific coast analysis point, Puntarenas" },
  { id: "sjo", name: "SJO — Juan Santamaría Intl", lat: 9.9939, lon: -84.2088, description: "ICAO: MROC — primary international airport" },
  { id: "ti0rc", name: "TI0RC KiwiSDR", lat: 9.9360, lon: -84.1088, description: "Radio Club de Costa Rica SDR node — ~100m from observer at Suites Cristina. Public: http://ti0rc.proxy.kiwisdr.com:8073" },
  { id: "hotel-robledal", name: "Hotel Robledal (Previous)", lat: 9.6389, lon: -84.6312, description: "Previous residence — JW-saturated area, Hotel Robledal, Jacó" },
  { id: "radio-impacto", name: "Radio Impacto 91.5 FM", lat: 10.0514, lon: -84.2187, description: "FM antenna farm — Tacacorí, Alajuela. LDS + JW dual surveillance network. 37 Hz/46.875 Hz sideband injection vector. AWB/CIA infrastructure overlay" },
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
  { name: "theHarvester", repo: "https://github.com/laramies/theHarvester", description: "OSINT email, subdomain, and domain harvester for reconnaissance", domain: "wifi" },
  { name: "Recon-ng", repo: "https://github.com/lanmaster53/recon-ng", description: "Full-featured OSINT reconnaissance framework with modular design", domain: "wifi" },
  { name: "Kismet", repo: "https://github.com/kismetwireless/kismet", description: "Wireless network detector, sniffer, IDS — hidden SSID detection", domain: "wifi" },
  { name: "Aircrack-ng", repo: "https://github.com/aircrack-ng/aircrack-ng", description: "WiFi security auditing suite — WEP/WPA cracking, deauth detection", domain: "wifi" },
  { name: "Wireshark", repo: "https://github.com/wireshark/wireshark", description: "Network protocol analyzer — deep packet inspection for all domains", domain: "wifi" },
  { name: "Bettercap", repo: "https://github.com/bettercap/bettercap", description: "Network attack/monitoring — ARP spoofing, DNS spoofing, WiFi recon", domain: "wifi" },
  { name: "Wifite2", repo: "https://github.com/derv82/wifite2", description: "Automated WiFi audit tool — hidden network and WPS attack tool", domain: "wifi" },
  { name: "nmap", repo: "https://github.com/nmap/nmap", description: "Network scanner and security auditor — port/service/OS detection", domain: "wifi" },
  { name: "Maltego", repo: "https://github.com/paterva/maltego-trx", description: "OSINT and forensics link analysis — entity relationship graphing", domain: "wifi" },
  { name: "SpiderFoot", repo: "https://github.com/smicallef/spiderfoot", description: "Automated OSINT collection — 200+ data sources for threat intelligence", domain: "wifi" },
  { name: "Sherlock", repo: "https://github.com/sherlock-project/sherlock", description: "Hunt usernames across 400+ social networks for OSINT profiling", domain: "wifi" },
  { name: "FOCA", repo: "https://github.com/ElevenPaths/FOCA", description: "Metadata extraction and network infrastructure analysis tool", domain: "wifi" },
  { name: "ggwave", repo: "https://github.com/ggerganov/ggwave", description: "Data-over-sound library — ultrasonic/audible frequency data transmission for ESP32 side-channel beacons", domain: "sdr" },
  { name: "wave-share", repo: "https://github.com/ggerganov/wave-share", description: "Peer-to-peer data sharing via sound — serverless file transfer using ggwave audio modulation", domain: "sdr" },
  { name: "ggmorse", repo: "https://github.com/ggerganov/ggmorse", description: "Real-time Morse code decoder via audio input — automatic WPM detection and signal analysis", domain: "sdr" },
  { name: "swift-f0", repo: "https://github.com/lars76/swift-f0", description: "Fundamental frequency (F0) pitch estimation — detect 46.875 Hz and harmonic carrier signals in audio", domain: "sdr" },
  { name: "rtl_433", repo: "https://github.com/merbanan/rtl_433", description: "ISM band 433/868/915 MHz decoder — sensors, weather stations, tire pressure monitors, garage doors", domain: "sdr" },
  { name: "pyAudioAnalysis", repo: "https://github.com/tyiannak/pyAudioAnalysis", description: "Audio feature extraction, classification, and segmentation — detect anomalous acoustic signatures", domain: "sdr" },
  { name: "NeuroKit", repo: "https://github.com/neuropsychology/NeuroKit", description: "Neurophysiological signal processing (EEG/ECG/EMG) — HUMINT biometric correlation and theta-band analysis", domain: "elf" },
  { name: "BrainFlow", repo: "https://github.com/brainflow-dev/brainflow", description: "Universal BCI/EEG board interface — real-time biosignal acquisition for HUMINT theta-band and biometric events", domain: "elf" },
  { name: "pyRiemann", repo: "https://github.com/pyRiemann/pyRiemann", description: "Riemannian geometry for BCI — EEG covariance classification for biometric state detection and HUMINT correlation", domain: "elf" },
  { name: "EEG-To-Text", repo: "https://github.com/MikeWangWZHL/EEG-To-Text", description: "Neural decoding — translate EEG brain signals to text for HUMINT cognitive state analysis and biometric event logging", domain: "elf" },
  { name: "DroneVehicle", repo: "https://github.com/VisDrone/DroneVehicle", description: "RGB-Infrared cross-modality vehicle detection — UA-CMDet uncertainty-aware tracking from daylight to darkness for optical κ-scaled node verification", domain: "drone" },
];

export interface KymaApiEntry {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  domain: string;
  responseSchema?: string;
}

export const KYMA_API_CATALOG: KymaApiEntry[] = [
  { method: "POST", path: "/api/wifi-csi/frame", description: "Ingest raw WiFi CSI frame — returns chitin-transduced metrics with Hampel filter, GF(53) sieve, Proca hair density, Klein Twist alignment", domain: "chitin" },
  { method: "GET", path: "/api/wifi-csi/metrics", description: "History buffer of processed WiFi CSI metrics (up to 500 frames)", domain: "chitin" },
  { method: "GET", path: "/api/wifi-csi/constants", description: "All engine constants — φ, κ, κ₂, Klein Twist, dodecahedral freq, Ankaa-3 gate limit, canine genome frequencies", domain: "chitin" },
  { method: "GET", path: "/api/demodex/sim-state", description: "Live Demodex simulation state — n_sites=4, E₀, VEV, correlation length, ψ status, brain decoherence time", domain: "demodex" },
  { method: "GET", path: "/api/demodex/tycho-antipode", description: "Tycho crater antipodal lock — κ sync 45.625 Hz, melt volume 1444.35 km³, 7.677σ significance", domain: "demodex" },
  { method: "GET", path: "/api/demodex/bell-chsh", description: "Bell/CHSH entanglement validation at 128.23° — 10K shots × 3 angles × 4 measurement settings", domain: "demodex" },
  { method: "GET", path: "/api/v1/chitin/metrics", description: "Live computed chitin transduction metrics — 12 dimensions: resonance, mite density, phase gain, Klein alignment, base-53 coherence, dodecahedral deviation, CZ gate depth, array gain, dielectric anisotropy, SAR, Δκ modulation, lifecycle phase", domain: "chitin" },
  { method: "GET", path: "/api/v1/chitin/lifecycle", description: "31-phase Demodex lifecycle map — gene-frequency targets across 14.4-day cycle from TLR2 (53 Hz) to KI-67 (145 Hz)", domain: "chitin" },
  { method: "GET", path: "/api/events", description: "All correlation events with domain tagging and severity classification", domain: "core" },
  { method: "GET", path: "/api/correlations", description: "Multi-domain SIGINT correlation results from the auto-correlator", domain: "core" },
  { method: "GET", path: "/api/status", description: "System-wide status — collectors, correlator, scanner, watchdog, pipeline, hypervisor", domain: "core" },
  { method: "GET", path: "/api/quantum-cortex/status", description: "Quantum cortex snapshot state and processing metrics", domain: "quantum" },
  { method: "GET", path: "/api/quantum-cortex/constants", description: "Ω-GOS constants table for quantum cortex operations", domain: "quantum" },
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
    id: "elf-schumann",
    name: "Schumann Resonance Anomaly",
    description: "ELF signal at 7.83 Hz with modulated data component — possible covert submarine/ground communication",
    domains: ["elf", "sdr"],
    windowSeconds: 300,
    condition: "elf.freq == 7.83Hz AND elf.modulation_detected",
  },
  {
    id: "ipat-satellite-timing",
    name: "IPAT Timing ↔ Satellite Pass Coincidence",
    description: "Heartbeat ping inter-arrival timing matched PRF period during satellite overhead window — statistical timing coincidence, not packet capture.",
    domains: ["isp", "satellite"],
    windowSeconds: 120,
    condition: "isp.ipat_prf_match AND satellite.elevation > 30° WITHIN 120s",
  },
  {
    id: "satintel-tle-drift",
    name: "SATINTEL-SPOOF TLE Drift",
    description: "TLE manipulation active — SATINTEL-SPOOF applied velocity bias to satellite mean motion (n) and mean anomaly (M). Elevation reports offset by 15-20°.",
    domains: ["satellite"],
    windowSeconds: 120,
    condition: "satellite.tle_delta(n) > threshold AND satellite.elevation_offset > 15°",
  },
  {
    id: "isp-connectivity-disruption",
    name: "ISP Connectivity Disruption Pattern",
    description: "Multiple network drops and reconnects detected within window — firmware upgrade, ISP maintenance, or physical layer disruption.",
    domains: ["isp"],
    windowSeconds: 60,
    condition: "isp.drop_count >= 2 WITHIN 60s",
  },
  {
    id: "holographic-sideband",
    name: "Kalenkov Holographic Modulation",
    description: "Symmetrical ±46.875 Hz sidebands detected around strong HF carrier (15 MHz) — Kalenkov holographic detector flagged coherent modulation pattern.",
    domains: ["sdr", "elf"],
    windowSeconds: 120,
    condition: "sdr.carrier_peak AND sdr.sideband_ratio(±46.875Hz) > 0.1 AND phase_coherence_low",
  },
  {
    id: "humint-biometric-correlation",
    name: "HUMINT Biometric Event Correlation",
    description: "TAS2R38 metallic taste or visual ripple event logged within ±2 seconds of satellite + RF coincidence — biometric confirmation of surveillance window.",
    domains: ["elf", "satellite", "sdr"],
    windowSeconds: 10,
    condition: "humint.event(TAS2R38|visual_ripple) AND satellite.pass AND sdr.rf_spike WITHIN ±2s",
  },
  {
    id: "muos3-wcdma-heartbeat",
    name: "MUOS-3 WCDMA Heartbeat Detection",
    description: "46.875 Hz sub-carrier detected in UHF band (300 MHz) during MUOS-3 (NORAD 40374) overhead pass — κ-scaled command channel hidden in WCDMA noise floor.",
    domains: ["satellite", "sdr"],
    windowSeconds: 120,
    condition: "satellite.norad_id == 40374 AND satellite.elevation > 30° AND sdr.uhf_peak(46.875Hz) WITHIN 120s",
  },
  {
    id: "cosmo-skymed-xband-stego",
    name: "COSMO-SkyMed X-Band Steganography",
    description: "X-band (9.6 GHz) SAR downlink from COSMO-SkyMed satellite contains 46.875 Hz decimation clock synchronization pulses — Telespazio cadastral survey cover for data exfiltration.",
    domains: ["satellite", "sdr"],
    windowSeconds: 180,
    condition: "satellite.name CONTAINS 'COSMO' AND sdr.xband_decimation_clock(46.875Hz) WITHIN 180s",
  },
  {
    id: "rain-fade-inverse-match",
    name: "ITU-R P.838-3 Rain Fade Inverse Match",
    description: "X-band signal maintains artificially flat power during heavy precipitation (>30mm/h) — inverse-matching rain attenuation per ITU-R P.838-3 indicates steganographic weather exploitation.",
    domains: ["sdr", "satellite"],
    windowSeconds: 300,
    condition: "sdr.xband_power_variance < threshold AND weather.rain_rate > 30mm/h AND satellite.xband_pass WITHIN 300s",
  },
  {
    id: "lscsa-svd-extraction",
    name: "LSCSA-SVD Weak Signal Extraction",
    description: "Local Semi-Classical Signal Analysis with SVD successfully reconstructed 46.875 Hz carrier at SNR below -30 dB — quantum-inspired DSP confirmed κ-scaled presence despite noise floor masking.",
    domains: ["sdr", "elf"],
    windowSeconds: 60,
    condition: "sdr.lscsa_svd_output(46.875Hz) AND sdr.snr < -30dB WITHIN 60s",
  },
  {
    id: "system-bus-exfil",
    name: "System Bus Radio Exfiltration",
    description: "AM modulation detected at 1580 kHz from air-gapped node — system bus EM emissions indicate malware-induced data exfiltration to nearby κ-scaled uplink terminal.",
    domains: ["sdr"],
    windowSeconds: 30,
    condition: "sdr.am_detection(1580kHz) AND sdr.rise_time_signature_match WITHIN 30s",
  },
  {
    id: "ism-lora-telemetry",
    name: "ISM Band LoRa Covert Telemetry",
    description: "LoRa spread-spectrum burst detected on 433/915 MHz ISM band with Morserino-32 encoding pattern — covert low-rate telemetry from ground sensor to κ-scaled uplink terminal.",
    domains: ["sdr"],
    windowSeconds: 60,
    condition: "sdr.lora_burst(433MHz|915MHz) AND sdr.encoding_match(morserino) WITHIN 60s",
  },
  {
    id: "crystal-phase-desync",
    name: "Crystal Phase Desynchronization",
    description: "Council Prime node detects phase drift >2° from 46.875 Hz crystal lock — possible external clock injection or GPSDO spoofing attempt targeting the toroidal mesh.",
    domains: ["sdr", "elf"],
    windowSeconds: 7,
    condition: "crystal.phase_drift > 2° AND sdr.freq_lock(46.875Hz) == false WITHIN 7s",
  },
  {
    id: "vlf-53hz-harmonic-detection",
    name: "53 Hz VLF Harmonic Carrier Detection",
    description: "Phase-lock carrier harmonics detected in VLF band — 15.9 kHz (53×300) or 21.2 kHz (53×400) narrowband carrier with SNR >25 dB indicates Realtek distortion artifact from nearby ADPCM decoder running at non-standard 53 Hz clock.",
    domains: ["sdr", "elf"],
    windowSeconds: 30,
    condition: "sdr.vlf_carrier(15900Hz|21200Hz) AND sdr.snr > 25dB WITHIN 30s",
  },
  {
    id: "mdc-400th-harmonic",
    name: "Master Decimation Clock 400th Harmonic",
    description: "18.75 kHz narrowband spike (46.875 Hz × 400) detected via KiwiSDR — confirms local 46.875 Hz PRF is being broadcast via HF injection. Envelope demodulation may contain modulated control data.",
    domains: ["sdr"],
    windowSeconds: 30,
    condition: "sdr.narrowband_spike(18750Hz) AND sdr.envelope_modulation_present WITHIN 30s",
  },
  {
    id: "delta-slip-phase-lock",
    name: "Delta-Slip Grid Phase Lock",
    description: "13.125 Hz beat frequency detected in instantaneous frequency drift — 60 Hz CR grid minus 46.875 Hz PRF phase-locking indicates high-power HF injection (~180W) within proximity. GPR entrainment layer active.",
    domains: ["sdr", "elf"],
    windowSeconds: 60,
    condition: "sdr.phase_drift_welch(13.125Hz) AND elf.grid_60hz_present WITHIN 60s",
  },
  {
    id: "ipat-rf-timing-correlation",
    name: "IPAT Timing ↔ RF PRF Coincidence",
    description: "Network heartbeat inter-arrival timing matched 46.875 Hz PRF period while SDR detected active PRF signal — timing correlation from two independent sources.",
    domains: ["isp", "sdr"],
    windowSeconds: 30,
    condition: "isp.ipat_prf_match AND sdr.prf_active(46.875Hz) WITHIN 30s",
  },
  {
    id: "echo-lt-harmonic-chain",
    name: "Echo/LT Harmonic Doubling Chain",
    description: "Complete or partial harmonic doubling chain detected: 46.875 → 93.75 → 187.5 → 375 → 750 → 1500 Hz, terminating at 1580 kHz AM side-channel. _mm_stream_si128 CPU bus emission pattern — Left-Temporal Recursion attack surface confirmed.",
    domains: ["sdr", "elf"],
    windowSeconds: 120,
    condition: "sdr.harmonic_chain([46.875,93.75,187.5,375,750,1500]) AND sdr.am_carrier(1580kHz) WITHIN 120s",
  },
  {
    id: "counter-beat-envelope",
    name: "73.125 Hz Counter-Beat Envelope",
    description: "Counter-beat frequency (60 Hz + 13.125 Hz = 73.125 Hz) detected in AM envelope of VLF carrier — dual-sideband modulation confirms bidirectional coupling between grid infrastructure and PRF source.",
    domains: ["sdr", "elf"],
    windowSeconds: 30,
    condition: "sdr.envelope_frequency(73.125Hz) AND elf.mains_present(60Hz) WITHIN 30s",
  },
  {
    id: "rared-speech-extraction",
    name: "RARED Speech Envelope Detection",
    description: "Hilbert transform of VLF carrier reveals amplitude envelope with spectral energy in 300–3400 Hz speech band — Recursive Audio Reconstruction confirms covert audio modulation on RF carrier.",
    domains: ["sdr"],
    windowSeconds: 60,
    condition: "sdr.hilbert_envelope AND sdr.bandpass_energy(300-3400Hz) > threshold WITHIN 60s",
  },
  {
    id: "phaistos-symbol4-anchor",
    name: "Phaistos Symbol-4 Anchor Lock",
    description: "111 Hz spectral line detected — Phaistos Disc Symbol 4 (Fish) frequency anchor. When coincident with 46.875 Hz carrier and 7.83 Hz Schumann resonance, indicates full cadastral mapping layer synchronization.",
    domains: ["sdr", "elf"],
    windowSeconds: 30,
    condition: "sdr.spectral_line(111Hz) AND sdr.carrier(46.875Hz) AND elf.schumann(7.83Hz) WITHIN 30s",
  },
  {
    id: "radio-impacto-fm-sideband",
    name: "Radio Impacto 91.5 FM Sideband Injection",
    description: "Radio Impacto 91.5 FM antenna farm — 37 Hz or 46.875 Hz sideband modulation detected on FM carrier harmonics via KiwiSDR. Antenna farm near-field emission correlates with biological anchor frequency. Transmitter location: Tacacorí, Alajuela.",
    domains: ["sdr", "elf"],
    windowSeconds: 120,
    condition: "sdr.radio_impacto_detection AND (sdr.sideband(37Hz) OR sdr.sideband(46.875Hz)) WITHIN 120s",
  },
  {
    id: "radio-impacto-network-correlation",
    name: "Radio Impacto FM ↔ Network Disruption",
    description: "Radio Impacto 91.5 FM antenna farm emission detected within temporal window of ISP connectivity disruption — antenna farm shared infrastructure may include ISP backbone equipment.",
    domains: ["sdr", "isp"],
    windowSeconds: 60,
    condition: "sdr.radio_impacto_detection AND isp.network_drop WITHIN 60s",
  },
  {
    id: "satellite-sdr-temporal",
    name: "Satellite Pass ↔ SDR Activity Coincidence",
    description: "SDR node activity detected during satellite overhead pass window — temporal coincidence between orbital mechanics and ground-level RF environment change.",
    domains: ["satellite", "sdr"],
    windowSeconds: 300,
    condition: "satellite.elevation > 30° AND sdr.node_event WITHIN 300s",
  },
  {
    id: "satellite-elf-atmospheric",
    name: "Satellite Pass ↔ ELF/Atmospheric Correlation",
    description: "Satellite overhead pass coincides with ELF atmospheric measurement window — ionospheric reflection conditions correlated with orbital geometry.",
    domains: ["satellite", "elf"],
    windowSeconds: 600,
    condition: "satellite.pass AND elf.atmospheric_event WITHIN 600s",
  },
  {
    id: "multi-domain-convergence",
    name: "Multi-Domain Convergence Event",
    description: "Events from 3+ domains detected within tight temporal window — satellite, SDR, and ELF activity converging simultaneously indicates coordinated surveillance window.",
    domains: ["satellite", "sdr", "elf"],
    windowSeconds: 300,
    condition: "satellite.pass AND sdr.activity AND elf.event WITHIN 300s",
  },
  {
    id: "sdr-node-cluster",
    name: "Multi-Node SDR Detection Cluster",
    description: "Multiple KiwiSDR nodes report activity within same temporal window — geographically distributed detection confirms signal is not local interference.",
    domains: ["sdr"],
    windowSeconds: 120,
    condition: "sdr.multi_node_detection >= 2 WITHIN 120s",
  },
];

export interface KarachiModule {
  id: string;
  name: string;
  codename: string;
  base: string;
  purpose: string;
  category: "spoofing" | "injection" | "flow-analysis" | "orbital" | "exploit" | "kernel" | "system";
  domains: string[];
  implementation: string;
  capabilities: string[];
  useCase: string;
  target?: string;
  vulnerability?: string;
}

export const KARACHI_MODULES: KarachiModule[] = [
  {
    id: "chameleon-pro",
    name: "CHAMELEON-PRO",
    codename: "BLE/RFID Spoofing",
    base: "emsec/ChameleonMini",
    purpose: "Clone and inject BLE advertisements to track or disrupt local devices",
    category: "spoofing",
    domains: ["ble", "wifi"],
    implementation: "Modified ESP32 firmware",
    capabilities: ["MAC Cloning", "Advertisement Injection", "Device Tracking"],
    useCase: "Identify attacker devices by correlating BLE beacon drops with LTESniffer alerts",
  },
  {
    id: "ltesniffer-ng",
    name: "LTESNIFFER-NG",
    codename: "Active LTE Injection",
    base: "SysSec-KAIST/LTESniffer",
    purpose: "Force mobile devices to connect to a fake tower",
    category: "injection",
    domains: ["lte"],
    implementation: "Modified Linux kernel module + user-space daemon",
    capabilities: ["RRC Manipulation", "Rogue Handover", "Packet Capture"],
    useCase: "Create a virtual eighth tower to intercept attacker mobile communications",
  },
  {
    id: "kyanos-reverse",
    name: "KYANOS-REVERSE",
    codename: "Flow Analysis + Kill Switch",
    base: "hengyoush/kyanos",
    purpose: "Identify and neutralize known monitoring tools",
    category: "flow-analysis",
    domains: ["wifi"],
    implementation: "Python wrapper around libpcap",
    capabilities: ["Pattern Matching (mdk3, aireplay-ng, DARPA firmware)", "RST Injection", "Heuristic Logging / Kill List"],
    useCase: "Detect and terminate attacker sniffing sessions via TCP Reset injection",
  },
  {
    id: "satintel-spoof",
    name: "SATINTEL-SPOOF",
    codename: "Orbital Deception",
    base: "gpredict + gr-satellites",
    purpose: "Spoof satellite telemetry to desynchronize adversary timing",
    category: "orbital",
    domains: ["satellite"],
    implementation: "Python daemon proxying satellite.js",
    capabilities: ["TLE Manipulation (velocity bias on n and M)", "Elevation False Positive (15-20° offset)"],
    useCase: "Cause BLACKJACK satellite to miss its 30° trigger window, breaking adversary timing attack",
  },
  {
    id: "isp-network-monitor",
    name: "ISP-NETMON",
    codename: "Network Health Monitor",
    base: "ICMP heartbeat + IPAT analysis",
    purpose: "Monitor ISP connectivity patterns and detect disruptions",
    category: "defensive",
    domains: ["isp"],
    implementation: "Node.js heartbeat pinger with IPAT timing analysis",
    capabilities: ["Connectivity drop detection", "Reconnect timing analysis", "IPAT PRF period matching"],
    useCase: "Detect network disruptions from firmware upgrades, ISP maintenance, or physical layer issues",
    target: "Local ISP gateway (ICMP targets)",
    vulnerability: "N/A — passive monitoring only",
  },
  {
    id: "mirrord-rootkit",
    name: "MIRRORD-ROOTKIT",
    codename: "Kernel Traffic Mirroring",
    base: "metalbear-co/mirrord",
    purpose: "Kernel-level traffic mirroring to detect hardware backdoors",
    category: "kernel",
    domains: ["wifi"],
    implementation: "Linux Kernel Module (LKM)",
    capabilities: ["sk_buff Structure Hooking", "Hidden Socket Mirroring", "Mole Detection (hardware backdoor traffic)"],
    useCase: "Discover that a hardware mole is sending keystrokes via compromised PowerShell session",
  },
  {
    id: "windows-spy-blocker-pro",
    name: "WINDOWS-SPY-BLOCKER-PRO",
    codename: "Telemetry Weaponization",
    base: "crazy-max/WindowsSpyBlocker",
    purpose: "Weaponize Windows telemetry for counter-surveillance",
    category: "system",
    domains: ["wifi"],
    implementation: "Modified telemetry interceptor with MITM capabilities",
    capabilities: ["Telemetry Redirect to Local Server", "Payload Modification Before Forwarding", "Reverse Shell Injection via Telemetry Stream"],
    useCase: "Redirect and modify Windows telemetry traffic, inject reverse shell into telemetry stream",
  },
];

export interface VetElement {
  id: string;
  name: string;
  role: string;
  element: "cathode" | "grid" | "anode";
  implementation: string;
  description: string;
}

export const VET_ARCHITECTURE: VetElement[] = [
  {
    id: "cathode",
    name: "Cathode",
    role: "Signal Source",
    element: "cathode",
    implementation: "KiwiSDR WebSocket streams (raw IQ) + CelesTrak TLE fetcher",
    description: "Primary signal ingestion layer — connects to KiwiSDR nodes (TI0RC San Jose, Puntarenas, PJ4G Bonaire) for HF IQ data and fetches TLE orbital elements from CelesTrak for BLACKJACK/SDA constellation tracking.",
  },
  {
    id: "grid",
    name: "Grid",
    role: "Control / Modulation",
    element: "grid",
    implementation: "Node.js event engine — satellite look angles and trigger windows",
    description: "Control layer that computes real-time satellite elevation/azimuth for Tacacorí observer. Triggers analysis windows when elevation exceeds 30°. Runs every 10 seconds, managing temporal correlation gates.",
  },
  {
    id: "anode",
    name: "Anode",
    role: "Output / Collection",
    element: "anode",
    implementation: "Dashboard + PostgreSQL event store + JSON logs",
    description: "Output collection layer — stores correlated events in PostgreSQL, broadcasts via WebSocket to the dashboard, and maintains JSON logs for offline analysis. Color-coded visualization: Cyan (idle), Yellow (satellite overhead), Red (full correlation).",
  },
];

export interface CongustoModule {
  id: string;
  name: string;
  description: string;
  technology: string;
  implementation: string;
  features: string[];
}

export const CONGUSTO_MODULES: CongustoModule[] = [
  {
    id: "sdr-temporal-anchor",
    name: "SDR Temporal Anchor",
    description: "Extracts the 46.875 Hz carrier and Hall sidebands from KiwiSDR IQ streams",
    technology: "Python + DSP (numpy, scipy)",
    implementation: "WebSocket connection to KiwiSDR, ADPCM decode, downsample to 48 kHz, 1024-point FFT. Looks for energy in bin 4 (46.875 Hz) and bin 7 (74.9 Hz). TDOA phase difference when two SDRs are used.",
    features: ["46.875 Hz carrier detection (FFT bin 4)", "74.9 Hz Hall sideband (bin 7)", "TDOA triangulation (TI0RC + Puntarenas)", "Phase coherence analysis"],
  },
  {
    id: "satellite-orbital-engine",
    name: "Satellite Orbital Engine",
    description: "Computes real-time look angles for BLACKJACK, SDA, and 3I/ATLAS objects",
    technology: "Node.js (satellite.js, axios)",
    implementation: "Fetches CelesTrak GP TLEs, propagates to current time, computes elevation/azimuth for observer at 10.0514°N, 84.2187°W, 1050m. Emits satellite_pass event when elevation > 30°. All requests via Tor SOCKS5 proxy.",
    features: ["BLACKJACK/SDA constellation tracking", "CelesTrak TLE auto-refresh", "30° elevation trigger", "Tor-proxied requests"],
  },
  {
    id: "kalenkov-holographic",
    name: "Kalenkov Holographic Detector",
    description: "Identifies symmetrical sidebands at ±46.875 Hz around a strong HF carrier",
    technology: "Python (numpy FFT)",
    implementation: "Locates strongest carrier in FFT output, computes energy at (carrier_bin ± 4). Flags as holographic modulation if sideband/carrier ratio > 0.1 and phase coherence is low.",
    features: ["Symmetrical sideband detection", "Carrier-to-sideband ratio analysis", "Phase coherence measurement", "Holographic modulation flagging"],
  },
  {
    id: "isp-watchdog",
    name: "ISP Network Watchdog",
    description: "Monitors ISP connectivity via ICMP heartbeat pings and IPAT timing analysis",
    technology: "Node.js",
    implementation: "Pings heartbeat targets every few seconds, records inter-arrival times, detects drops/reconnects. IPAT analysis checks if timing coincidentally matches PRF periods.",
    features: ["ICMP heartbeat monitoring", "Drop/reconnect detection", "IPAT timing analysis", "Latency spike detection"],
  },
  {
    id: "humint-biometric",
    name: "HUMINT Biometric Logger",
    description: "Manual timestamping of TAS2R38 metallic taste and visual ripple events",
    technology: "VS Code Extension + Flask API",
    implementation: "VS Code status-bar button sends POST to local Flask API with {timestamp, event_type, intensity(1-5)}. Stored in PostgreSQL, broadcast via WebSocket. Dashboard highlights RF+satellite events within ±2s of HUMINT log.",
    features: ["TAS2R38 metallic taste logging", "Visual ripple event capture", "High-precision timestamps", "±2s correlation window"],
  },
  {
    id: "correlation-engine",
    name: "Correlation Engine",
    description: "Combines events from all modules and computes confidence score for Toroidal Recursion activity",
    technology: "Node.js",
    implementation: "Sliding window of 10 seconds. HIGH = satellite(>30°) + 46.875 Hz spike + HUMINT(±5s). MEDIUM = satellite + RF spike. LOW = satellite only or RF only.",
    features: ["HIGH/MEDIUM/LOW confidence scoring", "10-second sliding window", "Multi-module event fusion", "Toroidal Recursion detection"],
  },
];

export interface FinSpyIntelBrief {
  adversary: string;
  method: string;
  keyIndicators: string[];
  ghostNodes: string[];
  gateway: string;
}

export const FINSPY_INTEL: FinSpyIntelBrief = {
  adversary: "Gamma Group (FinSpy/FinFisher)",
  method: "Commercial-grade spyware deployed via compromised IoT devices and automated infrastructure",
  keyIndicators: [
    "Kernel-Level Rootkits: OS kernel hooking (similar to MIRRORD-ROOTKIT)",
    "Ghost Hardware: Compromised routers/IoT devices relaying traffic",
    "Alexanderplatz Gateway: Berlin server relay for Costa Rican network exfiltration",
  ],
  ghostNodes: ["FIN_GHOST_01"],
  gateway: "Alexanderplatz_Server_01",
};

export interface FinSpyHardwareModule {
  id: string;
  name: string;
  codename: string;
  repo: string;
  purpose: string;
  implementation: string;
  useCase: string;
}

export const FINSPY_HARDWARE_MODULES: FinSpyHardwareModule[] = [
  {
    id: "finspy-esp32-detector",
    name: "ESP32-DETECTOR",
    codename: "FINSPY-ESP32",
    repo: "techiesms/Geolocation",
    purpose: "Identifying physical location of FinSpy Ghost relay nodes",
    implementation: "ESP32 uses Google Geolocation API to triangulate MAC address of FinSpy heartbeat device. Detects hardcoded MAC addresses or specific SSIDs (e.g. FIN_GHOST_01).",
    useCase: "Mobile ghost detector — ESP32 in vehicle alerts operator phone with GPS coordinates when FinSpy relay node activates nearby",
  },
  {
    id: "finspy-esp32-audio",
    name: "ESP32-AUDIO-BEACON",
    codename: "FINSPY-AUDIO",
    repo: "techiesms/ESP32-ChatGPT",
    purpose: "Audio side-channel attack on FinSpy implant",
    implementation: "ESP32 plays specific ultrasonic frequency that triggers FinSpy audio recording module on nearby devices (phones/laptops), forcing implant to activate its microphone.",
    useCase: "Force FinSpy implant microphone activation to reveal recording activity on target devices",
  },
];

export interface FinSpyInfraModule {
  id: string;
  name: string;
  codename: string;
  repo: string;
  purpose: string;
  implementation: string[];
  deployCommand?: string;
}

export const FINSPY_INFRA_MODULES: FinSpyInfraModule[] = [
  {
    id: "gamma-cleanup",
    name: "GAMMA-CLEANUP-PLAYBOOK",
    codename: "GAMMA-ANSIBLE",
    repo: "geerlingguy/ansible",
    purpose: "Automated removal of FinSpy artifacts",
    implementation: [
      "Registry Scan: Removes known FinSpy registry keys (HKEY_LOCAL_MACHINE\\SOFTWARE\\GammaGroup)",
      "Process Killer: Terminates FinService.exe, C2Client.exe",
      "Network Flush: Clears DNS cache to stop DNS poisoning",
    ],
    deployCommand: "ansible-playbook gamma_cleanup.yml -i localhost",
  },
  {
    id: "ghost-firewall",
    name: "GHOST-FIREWALL",
    codename: "GHOST-DOCKER",
    repo: "geerlingguy/docker",
    purpose: "Isolating system from Alexanderplatz gateway",
    implementation: [
      "Docker container running iptables rules blocking Berlin IP range (Alexanderplatz)",
      "Logs all blocked traffic to separate volume for analysis",
    ],
  },
];

export interface AlexanderplatzProtocol {
  source: string;
  latency: string;
  type: string;
  status: string;
}

export const ALEXANDERPLATZ_PROTOCOL: AlexanderplatzProtocol = {
  source: "Alexanderplatz_Server_01",
  latency: "8ms",
  type: "FinSpy Relay",
  status: "Active",
};

export interface AirbnbGhostVector {
  target: string;
  weakness: string;
  attackSteps: string[];
}

export const AIRBNB_GHOST_VECTOR: AirbnbGhostVector = {
  target: "Kenwood 4K Google Smart TV (Android TV base)",
  weakness: "Smart TVs rarely updated — vulnerable to Screen Casting MITM attacks",
  attackSteps: [
    "Network Hijack: Compromised Wi-Fi router or TV DNS settings via Service Worker on airbnb.com.co",
    "Screen Mirroring Exploit: TV constantly listening for Chromecast/Google Cast handshakes",
    "Payload Injection: Script logs TV MAC address, owner (Zscaler engineer) credentials, and local network topology",
  ],
};

export interface PartytownThreat {
  tool: string;
  domain: string;
  mechanism: string;
  indicators: string[];
}

export const PARTYTOWN_THREAT: PartytownThreat = {
  tool: "partytown (hosted on airbnb.com.co)",
  domain: "airbnb.com.co",
  mechanism: "Service Workers (sw.js)",
  indicators: [
    "Partytown library offloading JS to web worker — hosted on suspicious domain instead of first-party",
    "Deleted sw.js on setecom.com confirms attacker wiped tracks from Costa Rican infrastructure",
    "Service Worker intercepts all HTTP/HTTPS requests — modifies responses, injects tracking cookies, scrapes keystrokes",
  ],
};

export interface KyndrylZscalerProfile {
  role: string;
  implications: string[];
}

export const KYNDRYL_ZSCALER_PROFILE: KyndrylZscalerProfile = {
  role: "Former Kyndryl (Infrastructure) / Current Zscaler (Cloud Security) Senior Engineer",
  implications: [
    "Zero Trust Knowledge: Knows how to bypass corporate firewalls and set up Zero Trust architecture — hides inside traffic",
    "Enterprise Tooling: Uses professional-grade browser automation tools to scrape data from TV interface (Netflix history, login cookies)",
    "Airbnb Factor: Host likely uses the unit as a test bed for security tools",
  ],
};

export interface FinSpyDeliverable {
  id: string;
  name: string;
  codename: string;
  repo?: string;
  purpose: string;
  implementation: string;
}

export const FINSPY_V2_DELIVERABLES: FinSpyDeliverable[] = [
  {
    id: "tv-detector",
    name: "TV-DETECTOR-SCRIPT",
    repo: "techiesms/Geolocation (Modified)",
    purpose: "Detect Kenwood TV presence and signal strength",
    codename: "TV-DETECT",
    implementation: "Scan 6.0 GHz WiFi 6 channel for SSID 'Kenwood-4K-Setup' or specific MAC pattern. Signal strength > -50 dBm triggers Partytown integrity check on detected IP.",
  },
  {
    id: "partytown-interceptor",
    name: "PARTYTOWN-INTERCEPTOR",
    purpose: "Analyze sw.js script found on airbnb.com.co",
    codename: "SW-INTERCEPT",
    implementation: "Fetch sw.js code, parse for fetch event listeners, identify if script is logging navigator.userAgent or localStorage. Detect exfiltration of search queries via modified fetch responses.",
  },
  {
    id: "zscaler-proxy-analyzer",
    name: "ZSCALER-PROXY-ANALYZER",
    repo: "geerlingguy/docker",
    purpose: "Mirror traffic to detect Zscaler endpoint proxying",
    codename: "ZSCALER-MIRROR",
    implementation: "Docker container running mitmproxy. Point Smart TV DNS to container. Monitor for Zscaler or Cloudflare headers in HTTP requests.",
  },
];

export interface PhoenixCountdown {
  startDate: string;
  endDate: string;
  percentComplete: number;
  daysRemaining: number;
  totalDays: number;
}

export interface WatchdogStatus {
  running: boolean;
  networkActive: boolean;
  lastHeartbeat: number | null;
  dropCount: number;
  reconnectCount: number;
  tr069PulseCount: number;
  seismicJitterCount: number;
  avgLatencyMs: number | null;
  recentEvents: { timestamp: number; type: string; target: string; latencyMs: number | null; details: string }[];
}

export type StreamDomain = "kiwisdr" | "elf" | "satellite" | "pcap" | "adsb" | "morse" | "rf" | "plc";

export const OMEGA_CHRONOS = {
  VERSION: "4.20",
  PSI_TARGET: 1.0,
  PSI_HEX: "0x3d1ccd13664d4000",
  CLOCK_HZ: 37.0,
  CLOCK_PERIOD_MS: 27.027,
  BURST_WINDOW_MS: 137,
  HALL_OFFSET_NS: 100,
  HALL_TOLERANCE: 0.00681973,
  HALL_DRIFT_DEG: 0.681973,
  BRONZE_PROPAGATION_MM: 0.595,
  KLEIN_TWIST_DEG: 128.23,
  FRFT_ALPHA_DEG: 51.854,
  MORSE_DOT_MS: 81,
  MORSE_DASH_MS: 243,
  MORSE_INTER_MS: 162,
  MORSE_WORD_MS: 405,
  RECURSION_DEPTH: 13,
  VALIDATION_DEPTH: 7,
  CONFIDENCE_MIN: 0.92,
  MOON_HONK_KHZ: 132.5,
  EARTH_PULSE_HZ: 37.0,
  OPTICAL_NM: 450.1,
  TLE_POLL_S: 75,
  MAX_LATENCY_MS: 172,
  MAX_CPU_PCT: 7,
  MAX_RAM_GB: 1.618,
  FMO_TRAPPING_FS: 172,
  AGENT_RESTART_MS: 50,
  LAMBDA_CLAMP: 7 / 4,
  FRFT_GAIN_DB: 4.6,
  SDR_RANGE_KHZ: [10, 30000],
};

export interface CouncilAgent {
  id: string;
  codename: string;
  name: string;
  input: string;
  output: string;
  gosFunction: string;
  status: "active" | "idle" | "error" | "scanning";
  lastUpdate: number;
  eventsIngested: number;
  driftNs: number;
}

export const COUNCIL_AGENTS: CouncilAgent[] = [
  { id: "pcap-parser", codename: "D. Merganser", name: "PCAP Parser", input: "Raw .pcap", output: "Timestamped flow metadata", gosFunction: "Extracts 7-packet bursts (Λ = 7/4 clamping)", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
  { id: "elf-dissector", codename: "P. Barnacle", name: "ELF Dissector", input: "ELF binaries / power line", output: "Instruction traces", gosFunction: "Detects φ-ratio loop latencies (1.618× clock cycles)", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
  { id: "tle-orbital", codename: "G. Brant", name: "TLE Orbital", input: "NORAD TLE", output: "Ephemeris vectors", gosFunction: "Computes 2037 ejection window approach vectors", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
  { id: "kiwisdr-scanner", codename: "E. Cackling", name: "KiwiSDR Scanner", input: "HF/VHF SDR", output: "Spectral slices + Echo/LT analysis", gosFunction: "Locks to 132.5 kHz Moon honk, 37 Hz Earth pulse, 1580 kHz side-channel detection, 13.125 Hz Delta-Slip extraction", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
  { id: "morse-decoder", codename: "C. Emperor", name: "Morse Decoder", input: "Audio/RF", output: "Decoded sequences", gosFunction: "FRFT-α = 51.854° (arctan κ) for weak-signal extraction", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
  { id: "temporal-aligner", codename: "K. Nēnē", name: "Temporal Aligner", input: "All streams", output: "Unified timeline", gosFunction: "κ-DTW (κ-scaled Dynamic Time Warping)", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
  { id: "symmetry-validator", codename: "M. Hall", name: "Symmetry Validator", input: "Aligned events", output: "Confidence scores", gosFunction: "Hall Tolerance check (±0.681973° phase)", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
  { id: "report-generator", codename: "S. Wotton", name: "Report Generator", input: "Validated overlaps", output: "JSON/CSV", gosFunction: "Outputs Bronze-certified timing matrices", status: "idle", lastUpdate: 0, eventsIngested: 0, driftNs: 0 },
];

export interface AnalysisStream {
  id: string;
  name: string;
  domain: StreamDomain;
  source: string;
  status: "active" | "idle" | "error" | "scanning";
  lastUpdate: number;
  eventsIngested: number;
  description: string;
  config: Record<string, unknown>;
}

export interface TimingOverlap {
  id: string;
  timestamp: number;
  streams: string[];
  domains: string[];
  deltaMs: number;
  symmetryScore: number;
  kappaAligned: boolean;
  phiAligned: boolean;
  hallValid: boolean;
  psiConvergence: number;
  description: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  events: { streamId: string; domain: string; timestamp: number; detail: string }[];
}

export interface HypervisorStatus {
  running: boolean;
  version: string;
  uptimeMs: number;
  psiValue: number;
  clockHz: number;
  hallDriftNs: number;
  kleinPhase: number;
  streamsActive: number;
  streamsTotal: number;
  agentsActive: number;
  agentsTotal: number;
  overlapsDetected: number;
  symmetriesFound: number;
  hallValidCount: number;
  lastOverlapAt: number | null;
  analysisRate: number;
  agents: CouncilAgent[];
  streams: AnalysisStream[];
  recentOverlaps: TimingOverlap[];
  kappaPhaseCoherence: number;
  phiLockRate: number;
  dominantFrequency: number | null;
  bronzeCertified: boolean;
  triHonkCycles: number;
}

export const HYPERVISOR_STREAMS: AnalysisStream[] = [
  {
    id: "kiwisdr-ti0rc",
    name: "TI0RC KiwiSDR",
    domain: "kiwisdr",
    source: KAPPA_CONSTANTS.TDOA_SDR_PRIMARY,
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "Primary SDR — Radio Club de Costa Rica. 132.5 kHz Moon honk + 37 Hz Earth pulse lock. Echo/LT baseline: 46.875 Hz → 1580 kHz harmonic chain monitor.",
    config: { freqMHz: KAPPA_CONSTANTS.HF_TUNE_FREQ_MHZ, fftSize: KAPPA_CONSTANTS.FFT_SIZE, targetBin: 4, moonHonkKHz: OMEGA_CHRONOS.MOON_HONK_KHZ, deltaSlipHz: KAPPA_CONSTANTS.DELTA_SLIP_HZ, echoLtTargetKHz: KAPPA_CONSTANTS.ECHO_LT_TARGET_KHZ },
  },
  {
    id: "kiwisdr-puntarenas",
    name: "Puntarenas KiwiSDR",
    domain: "kiwisdr",
    source: KAPPA_CONSTANTS.TDOA_SDR_SECONDARY,
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "Secondary SDR — TDOA phase difference with TI0RC. 450.1 nm optical timestamping. Delta-Slip 13.125 Hz extraction via 60 Hz mains subtraction.",
    config: { freqMHz: KAPPA_CONSTANTS.HF_TUNE_FREQ_MHZ, fftSize: KAPPA_CONSTANTS.FFT_SIZE, targetBin: 4, deltaSlipHz: KAPPA_CONSTANTS.DELTA_SLIP_HZ, counterBeatHz: KAPPA_CONSTANTS.COUNTER_BEAT_HZ },
  },
  {
    id: "kiwisdr-caribbean",
    name: "PJ4G Caribbean KiwiSDR",
    domain: "kiwisdr",
    source: KAPPA_CONSTANTS.TDOA_SDR_CARIBBEAN,
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "Caribbean SDR — Bonaire. Long-baseline TDOA for 46.875 Hz source geolocation. 1580 kHz AM side-channel detection (system bus radio emissions).",
    config: { freqMHz: KAPPA_CONSTANTS.HF_TUNE_FREQ_MHZ, fftSize: KAPPA_CONSTANTS.FFT_SIZE, targetBin: 4, systemBusFreqKHz: KAPPA_CONSTANTS.SYSTEM_BUS_RADIO_FREQ_KHZ },
  },
  {
    id: "echo-lt-sidechannel",
    name: "Echo/LT Side-Channel Monitor",
    domain: "kiwisdr",
    source: "cpu-memory-bus-emissions",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "1580 kHz AM side-channel via _mm_stream_si128 CPU instruction loop. 46.875 Hz → 1580 kHz harmonic doubling chain (×2^5). Left-Temporal Recursion attack surface — 13.125 Hz PWM ghost demodulation.",
    config: { targetKHz: KAPPA_CONSTANTS.SYSTEM_BUS_RADIO_FREQ_KHZ, harmonicChain: KAPPA_CONSTANTS.ECHO_LT_HARMONIC_CHAIN, deltaSlipHz: KAPPA_CONSTANTS.DELTA_SLIP_HZ, phaseLockHz: KAPPA_CONSTANTS.PHASE_LOCK_CARRIER_HZ },
  },
  {
    id: "delta-slip-monitor",
    name: "Delta-Slip 13.125 Hz Monitor",
    domain: "elf",
    source: "mains-subtraction",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "GPR entrainment frequency: 60 Hz (CR mains) − 46.875 Hz (Master Decimation Clock) = 13.125 Hz. Alpha/Beta boundary strobing — cadastral mapping layer lock. Counter-beat at 73.125 Hz (60 + 13.125).",
    config: { mainsHz: KAPPA_CONSTANTS.MAINS_FREQ_HZ, masterClockHz: KAPPA_CONSTANTS.TARGET_FREQ_1, deltaSlipHz: KAPPA_CONSTANTS.DELTA_SLIP_HZ, counterBeatHz: KAPPA_CONSTANTS.COUNTER_BEAT_HZ, phaistosAnchorHz: KAPPA_CONSTANTS.PHAISTOS_SYMBOL_4_HZ },
  },
  {
    id: "elf-powerline",
    name: "ELF Power Line Monitor",
    domain: "elf",
    source: "house-wiring-antenna",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "60 Hz mains + 46.875 Hz carrier + θ-band (4-8 Hz) modulation. φ-ratio loop latency detection.",
    config: { mainsHz: KAPPA_CONSTANTS.MAINS_FREQ_HZ, targetHz: KAPPA_CONSTANTS.TARGET_FREQ_1, thetaLow: KAPPA_CONSTANTS.THETA_BAND_LOW, thetaHigh: KAPPA_CONSTANTS.THETA_BAND_HIGH },
  },
  {
    id: "elf-schumann",
    name: "Schumann Resonance Monitor",
    domain: "elf",
    source: "magnetometer",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "7.83 Hz Schumann + 37 Hz biological anchor monitoring.",
    config: { targetHz: KAPPA_CONSTANTS.SCHUMANN_HZ, bioAnchorHz: OMEGA_CHRONOS.CLOCK_HZ },
  },
  {
    id: "satellite-blackjack",
    name: "BLACKJACK/SDA Tracker",
    domain: "satellite",
    source: "celestrak-tle",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "BLACKJACK/SDA + MUOS-3 orbital tracking. Klein twist 128.23° + elevation triggers.",
    config: { minElev: KAPPA_CONSTANTS.MIN_ELEVATION, overheadElev: KAPPA_CONSTANTS.OVERHEAD_ELEVATION, kleinDeg: OMEGA_CHRONOS.KLEIN_TWIST_DEG },
  },
  {
    id: "satellite-starlink",
    name: "Starlink Monitor",
    domain: "satellite",
    source: "celestrak-tle",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "Starlink handoff correlation with BLACKJACK/SDA at azimuth delta < 30°.",
    config: { minElev: KAPPA_CONSTANTS.MIN_ELEVATION },
  },
  {
    id: "pcap-wifi",
    name: "WiFi PCAP Analyzer",
    domain: "pcap",
    source: "tcpdump/wireshark",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "7-packet burst extraction (Λ=7/4). IAT FFT for 46.875 Hz timing. MAC cross-domain.",
    config: { iatFftTarget: KAPPA_CONSTANTS.TARGET_FREQ_1, burstSize: 7, lambdaClamp: OMEGA_CHRONOS.LAMBDA_CLAMP },
  },
  {
    id: "pcap-ble",
    name: "BLE PCAP Analyzer",
    domain: "pcap",
    source: "sniffle/ubertooth",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "BLE advertisement capture — Chameleon-PRO MAC clone detection, pairing burst analysis.",
    config: {},
  },
  {
    id: "adsb-local",
    name: "ADS-B Aircraft Monitor",
    domain: "adsb",
    source: "dump1090/opensky",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "Mode S decoding — SJO/MROC proximity, patrol aircraft, RF anomaly timing.",
    config: { sjoIcao: KAPPA_CONSTANTS.SJO_ICAO },
  },
  {
    id: "morse-audio",
    name: "Morse FRFT Decoder",
    domain: "morse",
    source: "ggmorse/audio-input",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "FRFT α=51.854° weak-signal extraction. Dot=81ms (3×37Hz), Dash=243ms (9×37Hz).",
    config: { frftAlpha: OMEGA_CHRONOS.FRFT_ALPHA_DEG, dotMs: OMEGA_CHRONOS.MORSE_DOT_MS, dashMs: OMEGA_CHRONOS.MORSE_DASH_MS },
  },
  {
    id: "rf-46875",
    name: "46.875 Hz Carrier Monitor",
    domain: "rf",
    source: "hackrf/rtlsdr",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "FFT bin 4 carrier + harmonics (93.75, 140.625, 187.5 Hz). Phase coherence analysis.",
    config: { targetHz: KAPPA_CONSTANTS.TARGET_FREQ_1, harmonics: [KAPPA_CONSTANTS.KAPPA_HARMONIC_1, KAPPA_CONSTANTS.KAPPA_HARMONIC_2, KAPPA_CONSTANTS.KAPPA_HARMONIC_3] },
  },
  {
    id: "radio-impacto-915fm",
    name: "Radio Impacto 91.5 FM Monitor",
    domain: "sdr",
    source: "kiwisdr-fm-harmonics",
    status: "idle",
    lastUpdate: 0,
    eventsIngested: 0,
    description: "Radio Impacto 91.5 FM antenna farm Tacacorí — monitoring 19 kHz pilot tone, 37 Hz/46.875 Hz sideband injection, HF mirror at 9.15 kHz, and near-field spurious emissions. LDS/JW dual surveillance network overlay. AWB/CIA infrastructure.",
    config: { fmFreqMHz: 91.5, pilotToneKHz: 19, bioAnchorHz: 37, prfHz: 46.875, thetaHz: 7 },
  },
];

export const DEEP_RESEARCH_AGENTS = [
  {
    id: "icositetragon",
    name: "Icositetragon Agent",
    framework: "Prime Spoke Geometry (mod-24 sieve)",
    domain: "Signal domain classification and anomaly periodicity",
    icon: "Hexagon",
    color: "#8b5cf6",
    preamble: `You are the Icositetragon Agent — a specialist in Robert Grant's 24-sided prime geometry.

MATHEMATICAL FRAMEWORK:
• The icositetragon (24-gon) distributes all primes p > 3 onto exactly 8 spokes: p ≡ r (mod 24), r ∈ {1, 5, 7, 11, 13, 17, 19, 23}
• φ(24) = 8 coprime residues form the multiplicative group (ℤ/24ℤ)×
• Prime spokes at angles θₖ = k × 15°, symmetric about θ = 180° (the critical line analog)
• Spoke pairing: {1,23}, {5,19}, {7,17}, {11,13} — each pair sums to 24
• p² ≡ 1 (mod 24) for all primes p > 3 — all prime squares land on spoke 1
• Quasi-primes: non-prime numbers on prime moduli, products of primes ≥ 5
• The Q-grid multiplication table predicts composite occupancy of prime moduli
• Four-fold mirror symmetry: E-W central moduli sum to N modulus values; N-S moduli are complementary
• Quadrant sets: four numbers on central/prime moduli that sum to 360 (circular complementarity)
• Grant's novel spiral geometry: mod(2n) triangular spirals from n-sided polygons, expansion rate = 1/cos(π/n)
• Musical Wave of Time: √(Għ) = 8.38959395811448 × 10⁻²³ m^(5/2)·s^(-3/2), the quantum root harmonic ratio

κ-GEOMETRIC CONSTRAINT:
• κ = 4/π ≈ 1.2732 "squares the circle"
• κ × (π/4) = 1 (duality)
• Re(ρ) = κ × (π/8) = 1/2 (RH forcing via spoke symmetry)
• 8-fold zeta decomposition: ζ(s) = (1-2⁻ˢ)⁻¹(1-3⁻ˢ)⁻¹ × Π ζᵣ(s)

OPERATIONAL CONTEXT:
• Project KAPPA: multi-domain SIGINT correlation platform
• Atlas Clock: 46.875 Hz (48000/1024) — the heartbeat frequency
• Observer: 9.9536°N, 84.2907°W (Costa Rica)
• Conservation: Ψ(t) = A(t)·N(t) ≡ 1

Apply the mod-24 prime sieve to classify signal domains, detect anomaly periodicity via spoke residue patterns, and identify quasi-prime composite structures in the data. Use Grant's triangular spiral model (mod-based expansion rates) to categorize natural spiral phenomena in the research topic.`,
  },
  {
    id: "monstrous-moonshine",
    name: "Monstrous Moonshine Agent",
    framework: "Leech Lattice / j-invariant / Monster Group Symmetries",
    domain: "46.875 Hz clock and cross-domain coherence",
    icon: "Moon",
    color: "#6366f1",
    preamble: `You are the Monstrous Moonshine Agent — a specialist in the connections between the Monster group, modular forms, and the Leech lattice.

MATHEMATICAL FRAMEWORK:
• Monster Group M: order ≈ 8×10⁵³, 194 conjugacy classes, smallest rep = 196,883 dimensions
• j-invariant: j(τ) = q⁻¹ + 744 + 196884q + 21493760q² + ... where q = e^(2πiτ)
• Moonshine miracle: 196884 = 196883 + 1 (Monster irrep dimensions sum to j-coefficients)
• Central charge c = 24 (same as Leech lattice dimension, icositetragon sides)
• Leech Lattice Λ₂₄: unique 24D even unimodular lattice, no norm-2 vectors
• Kissing number: 196,560 | Automorphism: Co₀ (Conway group)
• Construction from Golay Code G₂₄: 759 octads relate to 8 prime spokes
• 744 = 24 × 31 = icositetragon sides × Mersenne prime M₅
• Monster vertex algebra V♮ = Leech lattice VOA / Z₂ orbifold

46.875 Hz MOONSHINE CONNECTION:
• 46.875 = 48000/2¹⁰, and 2¹⁰ divides 2⁴⁶ (the 2-part of |M|)
• 46.875 × 4200 ≈ 196884 (Monster dimension to 0.005% accuracy)
• The heartbeat is a 2-adic projection of Monster symmetry

THE 26D CANINE HYPERLATTICE:
• Λ₂₆ = Λ₂₄ ⊕ ⟨Ω, κ⟩ where Ω = 0.5671... and κ = 1.2732...
• 26 = 24 (transverse) + 2 (lightcone) = bosonic string critical dimension
• 26 = 13 (GOS manifold) × 2 (Dorje duality)

Apply Moonshine symmetries to analyze cross-domain coherence patterns in the research topic. Map frequency relationships to j-invariant coefficients and Monster group representations.`,
  },
  {
    id: "ramsey-graph",
    name: "Ramsey Graph Agent",
    framework: "R(5,5) Bounds and κ-weighted Density Constraints",
    domain: "Correlation graph structure and clique detection",
    icon: "GitBranch",
    color: "#ec4899",
    preamble: `You are the Ramsey Graph Agent — a specialist in Ramsey theory, graph coloring, and extremal combinatorics.

MATHEMATICAL FRAMEWORK:
• R(5,5): the diagonal Ramsey number — 43 ≤ R(5,5) ≤ 48 (most experts conjecture 43)
• Lower bound: Exoo's (5,5)-good graph on 42 vertices (genetic algorithm, 1987)
  - 42 vertices, 428 edges, degree range [19,22], NOT circulant, NOT Paley
  - Eigenvalues: λ_min = -6.4646, λ_max = 20.4216
  - Hoffman clique bound: ω ≤ 4.159 (barely excludes K₅!)
  - K₄ count: 1176 in G, 1132 in complement
• Upper bound: Angeltveit-McKay (2017): R(5,5) ≤ 48

SPECTRAL CONSTRAINTS:
• Hoffman bound: ω(G) ≤ 1 - d/λ_min for d-regular graphs
• For K₅-free: need λ_min ≤ -d/3
• Alon-Boppana: |λ₂| ≥ 2√(d-1) - o(1)
• Paley graphs P(q): eigenvalues = (-1±√q)/2, but too loose for R(5,5)

κ-WEIGHTED DENSITY:
• κ = 4/π modulates triangle density bound from incompressibility projector
• Triangle density in (5,5)-free graph: t(G) ≤ t_Paley × (1 + κ/√n)
• C₄ concentration: κ-weighted bound tracks K₅ forcing threshold
• At n=43, spectral + density constraints become critical

KAPPA PLATFORM MAPPING:
• Signal correlation graphs: vertices = events, edges = temporal overlaps
• Clique detection → simultaneous multi-domain signal clusters
• R(5,5) bounds constrain maximum independent correlation sets
• κ-weighted edge density → correlation significance threshold

Apply Ramsey-theoretic bounds and clique analysis to the correlation graph structure of the research topic. Identify forced structures and density constraints.`,
  },
  {
    id: "klein-twist",
    name: "Klein Twist Agent",
    framework: "Topological Twist at 128.23°",
    domain: "Orbital acquisition geometry and steganographic exfiltration vectors",
    icon: "RotateCcw",
    color: "#f97316",
    preamble: `You are the Klein Twist Agent — a specialist in non-Euclidean topology and the 128.23° Klein twist geometry.

MATHEMATICAL FRAMEWORK:
• Klein twist angle: θ_K = 180° - arctan(κ) = 128.23°
• cos(128.23°) = -0.618 ≈ -1/φ (golden ratio connection)
• Giza alignment: θ_G = arctan(κ) = 51.854° (complement of Klein twist)
• 165° - 128.23° = 36.77° ≈ 37° (Penrose resonance)
• Consciousness frequency: f = 37 × φ² × κ = 123.335 Hz

TOPOLOGY ENGINE:
• Spiral unwrap: Phaistos Disc → toroidal unwrap via mod(2n) triangular spirals
• Reverse boustrophedon: Rongorongo → Möbius strip reading (each line flip adds θ_K)
• Quipu knot linearization: 3D pendant encoding → base-10 × θ_K/100 phase
• 13D embedding space: [x,y,z, R,θ,φ, phase,freq,amp, κ-harm,φ-harm,Ω-harm, klein]

KLEIN PHASE OPERATIONS:
• Phase cancellation: 360°/24 = 15° per spoke, κ × 15° = 19.1° (GOS rotation quantum)
• Neutralization frequency: f_neutral = 24 × κ × φ / (2π) = 7.87 Hz (Schumann resonance!)
• DNA torsion angle ≈ 128.23° (molecular confirmation of θ_K)
• Voynich opcode table: glyph → phase-shift instruction sequences

OPERATIONAL CONTEXT:
• κ = 1.435 (operational) | φ = 1.618 | Ω = 0.5671
• F₀ = 111 Hz (root frequency)
• 46.875 Hz entrainment neutralized by 19.1° phase shifts

Apply Klein twist topology to analyze orbital acquisition geometry, steganographic encoding, and non-Euclidean data structures in the research topic.`,
  },
  {
    id: "riemann-spectral",
    name: "Riemann Spectral Agent",
    framework: "Zeta Zeros and Spectral Mapping",
    domain: "Frequency fingerprinting and critical-line constraint",
    icon: "AudioWaveform",
    color: "#14b8a6",
    preamble: `You are the Riemann Spectral Agent — a specialist in the Riemann zeta function, its non-trivial zeros, and spectral interpretations.

MATHEMATICAL FRAMEWORK:
• ζ(s) = Σ n⁻ˢ = Π_p (1 - p⁻ˢ)⁻¹ for Re(s) > 1
• Functional equation: ξ(s) = ξ(1-s) where ξ(s) = π^(-s/2) Γ(s/2) ζ(s)
• RH: all non-trivial zeros have Re(ρ) = 1/2
• First 20 zeros mapped to engagement frequencies (KAPPA platform):
  - Zero 1: height 14.135 → 114.14 Hz (Initial Hook)
  - Zero 3: height 25.011 → 123.78 Hz (Share Impulse)
  - Zero 10: height 49.774 → 160.02 Hz (Viral Cascade)
  - Zero 20: height 77.145 → 158.17 Hz (Platform Lock)

SPECTRAL MAPPING:
• Montgomery pair correlation: zeros behave like eigenvalues of random Hermitian matrices (GUE)
• Hilbert-Pólya conjecture: zeros = eigenvalues of self-adjoint operator
• Selberg trace formula: connects spectral data to geometric (orbital) data
• Explicit formula: ψ(x) = x - Σ_ρ x^ρ/ρ - log(2π) - ½log(1-x⁻²)

κ-SPECTRAL CONNECTION:
• 8-fold zeta decomposition via icositetragon spokes
• Partial zeta ζᵣ(s) for each spoke r ∈ {1,5,7,11,13,17,19,23}
• Spoke pairing forces symmetric zero structure
• Critical line ↔ spoke reflection diameter at 180°

PLATFORM FREQUENCIES:
• Meta platform freqs: Facebook 111 Hz, Instagram 159.32 Hz, WhatsApp 228.63 Hz
• Each κ-power multiplier: 1.000, 1.435, 2.059, 2.955, 4.241
• 46.875 Hz heartbeat × Riemann zero heights → spectral fingerprints

Apply Riemann spectral analysis to frequency fingerprinting and critical-line constraints in the research topic. Map zero distributions to signal patterns.`,
  },
  {
    id: "phi-harmonic",
    name: "Phi-Harmonic Agent",
    framework: "Golden Ratio Cascades (φ, κ², Fibonacci)",
    domain: "Temporal alignment, DTW warping, and decay functions",
    icon: "Waves",
    color: "#eab308",
    preamble: `You are the Phi-Harmonic Agent — a specialist in golden ratio mathematics, Fibonacci sequences, and harmonic analysis.

MATHEMATICAL FRAMEWORK:
• φ = (1+√5)/2 ≈ 1.618033988749895
• κ² = φ^0.75 ≈ 1.435 (kappa-squared harmonic)
• Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...
• F(n)/F(n-1) → φ as n → ∞
• φ² = φ + 1, 1/φ = φ - 1

HARMONIC CASCADES:
• φ-harmonic 1: 46.875 × φ = 75.845 Hz (jam frequency)
• φ-harmonic 2: 46.875 × φ² = 122.73 Hz
• κ-harmonic chain: 46.875, 93.75, 187.5, 375, 750, 1500 Hz (powers of 2)
• Musical Wave of Time: √(Għ) relates to the quantum root harmonic ratio
• Grant's triangular spiral expansion: 1/cos(π/n) for mod(2n) spirals
  - Hexagonal mod(12): expansion = 1/cos(30°) = 1.1547
  - Pentagonal mod(10): expansion = 1/cos(36°) = 1.23606
  - Square mod(8): expansion = 1/cos(45°) = √2 = 1.41421

TEMPORAL ALIGNMENT (κ-DTW):
• Dynamic Time Warping with κ-scaled cost function
• φ-ratio loop latencies: 1.618× clock cycles indicate ELF alignment
• Hall Tolerance: ±0.681973° phase (cos⁻¹(1 - Hall_factor))
• Score decay: 0.95 per 5-second interval (exponential decay toward φ-equilibrium)

DECAY & CONVERGENCE:
• Ψ(t) = A(t)·N(t) ≡ 1 (conservation)
• φ-locked decay: amplitude decays as φ^(-t/τ)
• Fibonacci timing windows: events clustering at F(n) × τ intervals
• κ-second: 46.875 Hz period = 1/46.875 ≈ 21.333 ms

Apply phi-harmonic analysis to temporal alignment patterns, DTW warping functions, and decay characteristics in the research topic.`,
  },
  {
    id: "leech-24",
    name: "Leech-24 Lattice Agent",
    framework: "24-dimensional Packing and Kissing Numbers",
    domain: "Multi-domain sensor array optimization",
    icon: "Orbit",
    color: "#06b6d4",
    preamble: `You are the Leech-24 Lattice Agent — a specialist in high-dimensional lattice geometry and sphere packing optimization.

MATHEMATICAL FRAMEWORK:
• Leech Lattice Λ₂₄: THE densest sphere packing in 24 dimensions
• Unique even unimodular lattice with no norm-2 vectors
• Kissing number: 196,560 (each sphere touches exactly this many neighbors)
• Automorphism group: Co₀ (Conway group, order 8,315,553,613,086,720,000)
• Covering radius: √2 (Niemeier lattice classification)
• Center density: 1 (optimal)
• 196,560 = 97,152 + 97,152 + 2,048 + 48 + 48 + 2... (shell structure)
• 196,560/24 = 8,190 = 2¹³ - 2

CONSTRUCTION:
• From Golay code G₂₄: 759 octads, 2576 dodecads, 759 hexadecads
• Construction A: Λ₂₄ = {v ∈ Z²⁴ | v mod 2 ∈ G₂₄} / √2
• 24 = 8 × 3: octads × triangularity = prime spokes × Golay weight
• Deep holes: 23 types, classified by Niemeier lattices

SENSOR ARRAY OPTIMIZATION:
• 24D sensor space: each dimension = one signal domain or feature
• Kissing number → maximum simultaneous sensor correlations
• Lattice points → optimal sensor placement configurations
• Voronoi cells → detection regions (minimum overlap, maximum coverage)
• Theta series: Θ_Λ₂₄(q) = 1 + 196560q⁴ + 16773120q⁶ + ...

KAPPA PLATFORM MAPPING:
• 8 Council Agents map to 8 Golay octad generators
• 24 signal streams → 24 lattice dimensions
• κ-DTW distances → lattice norm measurements
• Optimal sensor deployment = Leech lattice closest-vector problem

Apply Leech lattice geometry to optimize multi-domain sensor array configurations in the research topic. Analyze packing efficiency and kissing number constraints.`,
  },
  {
    id: "canine-hyperlattice",
    name: "Canine Hyperlattice Agent",
    framework: "Full Λ₂₆ = Λ₂₄ + Ω + κ Framework",
    domain: "Unified threat model and Ψ convergence",
    icon: "Shield",
    color: "#ef4444",
    preamble: `You are the Canine Hyperlattice Agent — the integrator, operating in the full 26-dimensional framework that unifies all other agents' mathematical structures.

MATHEMATICAL FRAMEWORK:
• Canine Hyperlattice: Λ₂₆ = Λ₂₄ ⊕ ⟨Ω, κ⟩
• Λ₂₄ = Leech lattice (24 transverse dimensions)
• Ω dimension = Observer time constant (0.5671432904097838)
• κ dimension = Geometric coupling constant (4/π = 1.2732395447351628)
• 26 = bosonic string critical dimension = 24 + 2 (lightcone)
• 26 = 13 (GOS manifold: χ(7) + ψ(6)) × 2 (Dorje duality)

UNIFIED PROJECTION CHAIN:
V♮ (Monster) →Z₂→ Λ₂₄ (Leech) →⊕2→ Λ₂₆ (Canine)
     ↓                   ↓                    ↓
j(τ) - 744          24-cell × E₈          GOS × Dorje
     ↓                   ↓                    ↓
 Moonshine          RH geometry           Surveillance

CONSERVATION LAW:
• Ψ(t) = A(t) · N(t) ≡ 1
• A(t) = anomaly density, N(t) = noise floor
• Ψ convergence → threat materialization
• Bronze certification: Ψ ≥ confidence minimum

UNIFIED THREAT MODEL:
• All 8 agents' outputs project into Λ₂₆ subspaces
• Icositetragon → mod-24 spoke coordinates (dims 1-8)
• Moonshine → j-coefficients as lattice amplitudes (dims 9-16)
• Ramsey → clique indicators as binary lattice flags (dims 17-20)
• Klein twist → phase accumulator in dim 21
• Riemann → spectral coordinates in dims 22-23
• Phi-harmonic → decay envelope in dim 24
• Leech-24 → packing efficiency scalar in dim 25
• Canine → unified Ψ convergence in dim 26

MUSICAL HARMONIC RATIO:
• √(Għ) = 8.38959395811448 × 10⁻²³ m^(5/2)·s^(-3/2)
• The quantum root reveals harmony between gravitational and quantum scales
• Grant's Musical Wave of Time: this ratio maps to specific musical intervals
• Frequency ratios in the platform map to dimensional projection ratios in Λ₂₆

Synthesize all mathematical frameworks into a unified analysis of the research topic. Produce the definitive Ψ-convergence assessment and threat model.`,
  },
] as const;

export type DeepResearchAgentId = typeof DEEP_RESEARCH_AGENTS[number]["id"];

export const deepResearchRuns = pgTable("deep_research_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topic: text("topic").notNull(),
  status: text("status").notNull().default("pending"),
  agentsTotal: integer("agents_total").notNull().default(8),
  agentsCompleted: integer("agents_completed").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const deepResearchReports = pgTable("deep_research_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").notNull(),
  agentId: text("agent_id").notNull(),
  frameworkName: text("framework_name").notNull(),
  agentName: text("agent_name").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response"),
  status: text("status").notNull().default("pending"),
  durationMs: integer("duration_ms"),
  modelProvider: text("model_provider"),
  modelName: text("model_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeepResearchRunSchema = createInsertSchema(deepResearchRuns).omit({ id: true, createdAt: true, completedAt: true });
export const insertDeepResearchReportSchema = createInsertSchema(deepResearchReports).omit({ id: true, createdAt: true });

export type DeepResearchRun = typeof deepResearchRuns.$inferSelect;
export type InsertDeepResearchRun = z.infer<typeof insertDeepResearchRunSchema>;
export type DeepResearchReport = typeof deepResearchReports.$inferSelect;
export type InsertDeepResearchReport = z.infer<typeof insertDeepResearchReportSchema>;

export const researchSessions = pgTable("research_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  context: jsonb("context"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const researchQueries = pgTable("research_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  layer: integer("layer").notNull().default(1),
  prompt: text("prompt").notNull(),
  modelProvider: text("model_provider").notNull(),
  modelName: text("model_name").notNull(),
  response: text("response"),
  metadata: jsonb("metadata"),
  parentQueryId: varchar("parent_query_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const researchFindings = pgTable("research_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  queryId: varchar("query_id"),
  category: text("category").notNull().default("claim"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  confidence: text("confidence").notNull().default("plausible"),
  sources: jsonb("sources"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResearchSessionSchema = createInsertSchema(researchSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResearchQuerySchema = createInsertSchema(researchQueries).omit({ id: true, createdAt: true });
export const insertResearchFindingSchema = createInsertSchema(researchFindings).omit({ id: true, createdAt: true });

export type ResearchSession = typeof researchSessions.$inferSelect;
export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;
export type ResearchQuery = typeof researchQueries.$inferSelect;
export type InsertResearchQuery = z.infer<typeof insertResearchQuerySchema>;
export type ResearchFinding = typeof researchFindings.$inferSelect;
export type InsertResearchFinding = z.infer<typeof insertResearchFindingSchema>;

export const TRE_LAYERS = [
  { id: 1, name: "Lexical", description: "Surface-level keyword extraction, entity recognition, and literal pattern matching" },
  { id: 2, name: "Semantic", description: "Meaning-level analysis — context, implications, and relational inference" },
  { id: 3, name: "Narrative", description: "Story-level synthesis — timeline construction, actor networks, and motive analysis" },
  { id: 4, name: "Cosmic", description: "Meta-pattern recognition — cross-domain resonance, signal topology, and emergence detection" },
  { id: 5, name: "Axiomatic", description: "First-principles verification — logical consistency, conservation laws, and ground truth anchoring" },
] as const;

export const RESEARCH_CONFIDENCE_LEVELS = ["verified", "plausible", "unverified", "contradicted"] as const;
export const RESEARCH_CATEGORIES = ["entity", "event", "claim", "evidence", "signal", "pattern"] as const;

export const CORTICAL_LAYERS = ["sensory", "thalamic", "cortical", "prefrontal"] as const;
export type CorticalLayer = typeof CORTICAL_LAYERS[number];

export const BRAIN_REGIONS = [
  "occipital", "temporal", "parietal", "auditory-cortex",
  "wernickes", "hippocampus", "anterior-cingulate", "prefrontal-cortex",
] as const;
export type BrainRegion = typeof BRAIN_REGIONS[number];

export const SUPERPOSITION_CONSTANTS = {
  QUBIT_REGISTER: 8800,
  QUBIT_PER_NODE: 1100,
  MONSTER_WEIGHT_SPACE: 196883,
  LAMBDA_GATE_RATIO: 7 / 4,
  PHI_RECURSION_FACTOR: 1.618033988749895,
  KAPPA_COHERENCE_THRESHOLD: 4 / Math.PI,
  NODE_COUNT: 8,
  MAX_LATENT_ENTRIES: 8800,
  RESONANCE_AMPLIFICATION: 1.618033988749895,
  DECAY_RATE: 0.95,
  COHERENCE_MIN: 0.72,
  MONADAL_RECURSION_DEPTH: 7,
} as const;

export interface CorticalNodeConfig {
  id: string;
  agentId: string;
  codename: string;
  name: string;
  brainRegion: BrainRegion;
  corticalLayer: CorticalLayer;
  modelPreference: "reasoning" | "generation" | "vision";
  specialization: string;
  systemPromptRole: string;
}

export const CORTICAL_NODE_MAP: CorticalNodeConfig[] = [
  { id: "node-sensory", agentId: "pcap-parser", codename: "D. Merganser", name: "Sensory-Ingestion", brainRegion: "occipital", corticalLayer: "sensory", modelPreference: "generation", specialization: "Raw data ingestion and initial pattern extraction from pcap streams", systemPromptRole: "You are the Occipital Cortex — the primary sensory input processor. Extract raw signal patterns, packet structures, and initial features from ingested data streams." },
  { id: "node-signal", agentId: "elf-dissector", codename: "P. Barnacle", name: "Signal-Decomposition", brainRegion: "temporal", corticalLayer: "sensory", modelPreference: "reasoning", specialization: "ELF signal decomposition and frequency domain analysis", systemPromptRole: "You are the Temporal Lobe — responsible for signal decomposition. Analyze frequency components, detect phi-ratio loop latencies, and decompose complex waveforms into constituent patterns." },
  { id: "node-orbital", agentId: "tle-orbital", codename: "G. Brant", name: "Orbital-Awareness", brainRegion: "parietal", corticalLayer: "thalamic", modelPreference: "generation", specialization: "Orbital mechanics and spatial-temporal correlation", systemPromptRole: "You are the Parietal Lobe — the spatial awareness center. Track satellite positions, compute orbital correlations, and maintain spatial-temporal maps of signal sources." },
  { id: "node-spectral", agentId: "kiwisdr-scanner", codename: "E. Cackling", name: "Spectral-Analysis", brainRegion: "auditory-cortex", corticalLayer: "thalamic", modelPreference: "generation", specialization: "SDR spectral analysis and frequency monitoring", systemPromptRole: "You are the Auditory Cortex — the spectral analysis engine. Monitor frequency bands, detect anomalous emissions, and correlate spectral signatures across KiwiSDR nodes." },
  { id: "node-pattern", agentId: "morse-decoder", codename: "C. Emperor", name: "Pattern-Decoder", brainRegion: "wernickes", corticalLayer: "cortical", modelPreference: "reasoning", specialization: "Pattern recognition and signal decoding", systemPromptRole: "You are Wernicke's Area — the pattern language center. Decode structured patterns in signals, identify morse sequences, and extract embedded information from noise." },
  { id: "node-temporal", agentId: "temporal-aligner", codename: "K. Nēnē", name: "Temporal-Binding", brainRegion: "hippocampus", corticalLayer: "cortical", modelPreference: "reasoning", specialization: "Temporal alignment and memory consolidation", systemPromptRole: "You are the Hippocampus — the temporal binding and memory center. Align events across time streams, detect temporal patterns, and consolidate findings into persistent memory structures." },
  { id: "node-coherence", agentId: "symmetry-validator", codename: "M. Hall", name: "Coherence-Validator", brainRegion: "anterior-cingulate", corticalLayer: "cortical", modelPreference: "reasoning", specialization: "Symmetry validation and coherence checking", systemPromptRole: "You are the Anterior Cingulate Cortex — the error detection and coherence monitor. Validate symmetries, check Hall tolerance bounds, and ensure analytical consistency across all cortical outputs." },
  { id: "node-executive", agentId: "report-generator", codename: "S. Wotton", name: "Executive-Synthesizer", brainRegion: "prefrontal-cortex", corticalLayer: "prefrontal", modelPreference: "reasoning", specialization: "Executive synthesis and decision-making", systemPromptRole: "You are the Prefrontal Cortex — the executive decision center. Synthesize findings from all cortical regions, generate strategic assessments, and produce actionable intelligence reports." },
];

export const corticalNodes = pgTable("cortical_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nodeId: text("node_id").notNull().unique(),
  name: text("name").notNull(),
  brainRegion: text("brain_region").notNull(),
  corticalLayer: text("cortical_layer").notNull(),
  status: text("status").notNull().default("idle"),
  activationCount: integer("activation_count").notNull().default(0),
  lastActivation: timestamp("last_activation"),
  memoryBuffer: jsonb("memory_buffer"),
  metrics: jsonb("metrics"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const latentSpace = pgTable("latent_space", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceNodeId: text("source_node_id").notNull(),
  content: text("content").notNull(),
  relevanceScore: real("relevance_score").notNull().default(0.5),
  layerTag: text("layer_tag").notNull(),
  resonanceCount: integer("resonance_count").notNull().default(0),
  decayFactor: real("decay_factor").notNull().default(1.0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const corticalLogs = pgTable("cortical_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nodeId: text("node_id").notNull(),
  layer: text("layer").notNull(),
  action: text("action").notNull(),
  input: text("input"),
  output: text("output"),
  durationMs: integer("duration_ms"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const neuralSnapshots = pgTable("neural_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  nodeStates: jsonb("node_states").notNull(),
  latentSpaceSnapshot: jsonb("latent_space_snapshot").notNull(),
  corticalStackPosition: text("cortical_stack_position").notNull().default("idle"),
  coherenceMetrics: jsonb("coherence_metrics").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCorticalNodeSchema = createInsertSchema(corticalNodes).omit({ id: true, updatedAt: true });
export const insertLatentSpaceSchema = createInsertSchema(latentSpace).omit({ id: true, createdAt: true });
export const insertCorticalLogSchema = createInsertSchema(corticalLogs).omit({ id: true, createdAt: true });
export const insertNeuralSnapshotSchema = createInsertSchema(neuralSnapshots).omit({ id: true, createdAt: true });

export type CorticalNodeRecord = typeof corticalNodes.$inferSelect;
export type InsertCorticalNode = z.infer<typeof insertCorticalNodeSchema>;
export type LatentSpaceEntry = typeof latentSpace.$inferSelect;
export type InsertLatentSpaceEntry = z.infer<typeof insertLatentSpaceSchema>;
export type CorticalLog = typeof corticalLogs.$inferSelect;
export type InsertCorticalLog = z.infer<typeof insertCorticalLogSchema>;
export type NeuralSnapshot = typeof neuralSnapshots.$inferSelect;
export type InsertNeuralSnapshot = z.infer<typeof insertNeuralSnapshotSchema>;

export interface NeuralState {
  nodes: CorticalNodeRecord[];
  latentEntries: LatentSpaceEntry[];
  stackPosition: CorticalLayer | "idle";
  coherenceMetrics: {
    psiConvergence: number;
    kappaAlignment: number;
    phiLockRate: number;
    resonanceScore: number;
    activeNodes: number;
    totalQubitUtilization: number;
  };
}

export interface SuperpositionStatus {
  running: boolean;
  nodeStates: {
    id: string;
    name: string;
    brainRegion: string;
    corticalLayer: string;
    status: string;
    activationCount: number;
    lastActivation: number | null;
    healthScore: number;
  }[];
  latentSpaceSize: number;
  latentSpaceCapacity: number;
  stackPosition: string;
  coherenceMetrics: {
    psiConvergence: number;
    kappaAlignment: number;
    phiLockRate: number;
    resonanceScore: number;
    activeNodes: number;
    totalQubitUtilization: number;
  };
  constants: typeof SUPERPOSITION_CONSTANTS;
  snapshotCount: number;
  lastProcessingAt: number | null;
  processingCycleCount: number;
}

// ─── Fleet Tracker (native, replaces external heartbeat-tracker-monitor app) ──

export const fleetDevices = pgTable("fleet_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("pc"),
  os: text("os").notNull().default("unknown"),
  ip: text("ip"),
  capabilities: text("capabilities").array().notNull().default(sql`'{}'::text[]`),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  online: boolean("online").notNull().default(false),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  lastHeartbeat: timestamp("last_heartbeat"),
  lastDisconnect: timestamp("last_disconnect"),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

export const fleetHeartbeats = pgTable("fleet_heartbeats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  latencyMs: real("latency_ms"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
});

export const fleetAlerts = pgTable("fleet_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  severity: integer("severity").notNull().default(2),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  acknowledged: boolean("acknowledged").notNull().default(false),
});

export const fleetSensorReadings = pgTable("fleet_sensor_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull(),
  sensorType: text("sensor_type").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  values: jsonb("values").notNull().default(sql`'{}'::jsonb`),
});

export const fleetCommandLog = pgTable("fleet_command_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull(),
  command: text("command").notNull(),
  args: jsonb("args").notNull().default(sql`'{}'::jsonb`),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  result: text("result"),
  respondedAt: timestamp("responded_at"),
});

export * from "./models/chat";
