import {
  type User, type InsertUser,
  type SignalEvent, type InsertSignalEvent,
  type Correlation, type InsertCorrelation,
  type SatellitePass, type InsertSatellitePass,
  type SdrNode, type InsertSdrNode,
  users, signalEvents, correlations, satellitePasses, sdrNodes,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSignalEvents(domain?: string): Promise<SignalEvent[]>;
  getRecentSignalEvents(limit: number): Promise<SignalEvent[]>;
  createSignalEvent(event: InsertSignalEvent): Promise<SignalEvent>;
  getSignalEventsByWindow(windowSeconds: number): Promise<SignalEvent[]>;
  getEventCountsByDomain(): Promise<Record<string, number>>;
  getCorrelations(): Promise<Correlation[]>;
  createCorrelation(correlation: InsertCorrelation): Promise<Correlation>;
  getCorrelationCount(): Promise<number>;
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

  async getSignalEvents(domain?: string): Promise<SignalEvent[]> {
    if (domain) {
      return db.select().from(signalEvents).where(eq(signalEvents.domain, domain)).orderBy(desc(signalEvents.timestamp));
    }
    return db.select().from(signalEvents).orderBy(desc(signalEvents.timestamp));
  }

  async getRecentSignalEvents(limit: number): Promise<SignalEvent[]> {
    return db.select().from(signalEvents).orderBy(desc(signalEvents.timestamp)).limit(limit);
  }

  async createSignalEvent(event: InsertSignalEvent): Promise<SignalEvent> {
    const [created] = await db.insert(signalEvents).values(event).returning();
    return created;
  }

  async getSignalEventsByWindow(windowSeconds: number): Promise<SignalEvent[]> {
    const cutoff = new Date(Date.now() - windowSeconds * 1000);
    return db.select().from(signalEvents)
      .where(sql`${signalEvents.timestamp} > ${cutoff}`)
      .orderBy(desc(signalEvents.timestamp));
  }

  async getEventCountsByDomain(): Promise<Record<string, number>> {
    const result = await db.select({
      domain: signalEvents.domain,
      count: sql<number>`count(*)::int`,
    }).from(signalEvents).groupBy(signalEvents.domain);

    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.domain] = row.count;
    }
    return counts;
  }

  async getCorrelations(): Promise<Correlation[]> {
    return db.select().from(correlations).orderBy(desc(correlations.timestamp));
  }

  async createCorrelation(correlation: InsertCorrelation): Promise<Correlation> {
    const [created] = await db.insert(correlations).values(correlation).returning();
    return created;
  }

  async getCorrelationCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(correlations);
    return result?.count ?? 0;
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
