import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const detectionEvents = pgTable("detection_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  frequency: real("frequency").notNull(),
  amplitude: real("amplitude").notNull(),
  snr: real("snr").notNull(),
  source: text("source").notNull(),
  fftBin: integer("fft_bin"),
  confidence: real("confidence").notNull(),
  metadata: jsonb("metadata"),
});

export const anomalyReports = pgTable("anomaly_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  severity: integer("severity").notNull().default(1),
  correlatedDetectionId: varchar("correlated_detection_id"),
  location: text("location").default("Guacima"),
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

export const insertDetectionEventSchema = createInsertSchema(detectionEvents).omit({
  id: true,
  timestamp: true,
});

export const insertAnomalyReportSchema = createInsertSchema(anomalyReports).omit({
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
export type DetectionEvent = typeof detectionEvents.$inferSelect;
export type InsertDetectionEvent = z.infer<typeof insertDetectionEventSchema>;
export type AnomalyReport = typeof anomalyReports.$inferSelect;
export type InsertAnomalyReport = z.infer<typeof insertAnomalyReportSchema>;
export type SatellitePass = typeof satellitePasses.$inferSelect;
export type InsertSatellitePass = z.infer<typeof insertSatellitePassSchema>;
export type SdrNode = typeof sdrNodes.$inferSelect;
export type InsertSdrNode = z.infer<typeof insertSdrNodeSchema>;

export const GOS_CONSTANTS = {
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
  PHOENIX_DATE: new Date("2037-01-01T00:00:00Z"),
  MIN_ELEVATION: 30,
};
