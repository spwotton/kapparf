import {
  type User, type InsertUser,
  type DetectionEvent, type InsertDetectionEvent,
  type AnomalyReport, type InsertAnomalyReport,
  type SatellitePass, type InsertSatellitePass,
  type SdrNode, type InsertSdrNode,
  users, detectionEvents, anomalyReports, satellitePasses, sdrNodes,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDetections(): Promise<DetectionEvent[]>;
  getRecentDetections(limit: number): Promise<DetectionEvent[]>;
  createDetection(event: InsertDetectionEvent): Promise<DetectionEvent>;
  getAnomalies(): Promise<AnomalyReport[]>;
  createAnomaly(report: InsertAnomalyReport): Promise<AnomalyReport>;
  getSatellites(): Promise<SatellitePass[]>;
  upsertSatellite(pass: InsertSatellitePass): Promise<SatellitePass>;
  getNodes(): Promise<SdrNode[]>;
  createNode(node: InsertSdrNode): Promise<SdrNode>;
  updateNodeStatus(id: string, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getDetections(): Promise<DetectionEvent[]> {
    return db.select().from(detectionEvents).orderBy(desc(detectionEvents.timestamp));
  }

  async getRecentDetections(limit: number): Promise<DetectionEvent[]> {
    return db.select().from(detectionEvents).orderBy(desc(detectionEvents.timestamp)).limit(limit);
  }

  async createDetection(event: InsertDetectionEvent): Promise<DetectionEvent> {
    const [detection] = await db.insert(detectionEvents).values(event).returning();
    return detection;
  }

  async getAnomalies(): Promise<AnomalyReport[]> {
    return db.select().from(anomalyReports).orderBy(desc(anomalyReports.timestamp));
  }

  async createAnomaly(report: InsertAnomalyReport): Promise<AnomalyReport> {
    const [anomaly] = await db.insert(anomalyReports).values(report).returning();
    return anomaly;
  }

  async getSatellites(): Promise<SatellitePass[]> {
    return db.select().from(satellitePasses).orderBy(desc(satellitePasses.updatedAt));
  }

  async upsertSatellite(pass: InsertSatellitePass): Promise<SatellitePass> {
    const existing = await db.select().from(satellitePasses).where(eq(satellitePasses.noradId, pass.noradId));
    if (existing.length > 0) {
      const [updated] = await db
        .update(satellitePasses)
        .set({ ...pass, updatedAt: new Date() })
        .where(eq(satellitePasses.noradId, pass.noradId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(satellitePasses).values(pass).returning();
    return created;
  }

  async getNodes(): Promise<SdrNode[]> {
    return db.select().from(sdrNodes);
  }

  async createNode(node: InsertSdrNode): Promise<SdrNode> {
    const [created] = await db.insert(sdrNodes).values(node).returning();
    return created;
  }

  async updateNodeStatus(id: string, status: string): Promise<void> {
    await db.update(sdrNodes).set({ status, lastSeen: new Date() }).where(eq(sdrNodes.id, id));
  }
}

export const storage = new DatabaseStorage();
