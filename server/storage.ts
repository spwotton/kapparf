import {
  type User, type InsertUser,
  type SignalEvent, type InsertSignalEvent,
  type Correlation, type InsertCorrelation,
  type SatellitePass, type InsertSatellitePass,
  type SdrNode, type InsertSdrNode,
  type CorrelationFeedback, type InsertCorrelationFeedback,
  type CollectionLog, type InsertCollectionLog,
  type ResearchSession, type InsertResearchSession,
  type ResearchQuery, type InsertResearchQuery,
  type ResearchFinding, type InsertResearchFinding,
  type ArtifactScan, type InsertArtifactScan,
  type AudioFlag, type InsertAudioFlag,
  type DeepResearchRun, type InsertDeepResearchRun,
  type DeepResearchReport, type InsertDeepResearchReport,
  users, signalEvents, correlations, satellitePasses, sdrNodes,
  correlationFeedback, collectionLogs,
  researchSessions, researchQueries, researchFindings,
  artifactScans, audioFlags,
  deepResearchRuns, deepResearchReports,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSignalEvents(domain?: string, limit?: number): Promise<SignalEvent[]>;
  getSignalEventsByIds(ids: string[]): Promise<SignalEvent[]>;
  getRecentSignalEvents(limit: number): Promise<SignalEvent[]>;
  createSignalEvent(event: InsertSignalEvent): Promise<SignalEvent>;
  getSignalEventsByWindow(windowSeconds: number): Promise<SignalEvent[]>;
  getEventCountsByDomain(): Promise<Record<string, number>>;
  getCorrelations(limit?: number): Promise<Correlation[]>;
  createCorrelation(correlation: InsertCorrelation): Promise<Correlation>;
  getCorrelationCount(): Promise<number>;
  getSatellites(): Promise<SatellitePass[]>;
  upsertSatellite(pass: InsertSatellitePass): Promise<SatellitePass>;
  getNodes(): Promise<SdrNode[]>;
  createNode(node: InsertSdrNode): Promise<SdrNode>;
  updateNodeStatus(id: string, status: string): Promise<void>;
  createFeedback(feedback: InsertCorrelationFeedback): Promise<CorrelationFeedback>;
  getFeedbackForCorrelation(correlationId: string): Promise<CorrelationFeedback[]>;
  createCollectionLog(log: InsertCollectionLog): Promise<CollectionLog>;
  getRecentCollectionLogs(limit: number): Promise<CollectionLog[]>;
  searchEvents(query: string, domains?: string[], limit?: number): Promise<SignalEvent[]>;
  getEventsByTimeRange(from: Date, to: Date, domain?: string): Promise<SignalEvent[]>;
  createResearchSession(session: InsertResearchSession): Promise<ResearchSession>;
  getResearchSessions(): Promise<ResearchSession[]>;
  getResearchSession(id: string): Promise<ResearchSession | undefined>;
  updateResearchSession(id: string, updates: Partial<InsertResearchSession>): Promise<ResearchSession>;
  createResearchQuery(query: InsertResearchQuery): Promise<ResearchQuery>;
  getResearchQueries(sessionId: string): Promise<ResearchQuery[]>;
  createResearchFinding(finding: InsertResearchFinding): Promise<ResearchFinding>;
  getResearchFindings(sessionId: string): Promise<ResearchFinding[]>;
  createArtifactScan(scan: InsertArtifactScan): Promise<ArtifactScan>;
  getArtifactScans(limit?: number): Promise<ArtifactScan[]>;
  getArtifactScan(id: string): Promise<ArtifactScan | undefined>;
  createAudioFlag(flag: InsertAudioFlag): Promise<AudioFlag>;
  getAudioFlags(limit?: number): Promise<AudioFlag[]>;
  getAudioFlagsByTimeRange(from: Date, to: Date): Promise<AudioFlag[]>;
  getAudioFlagsByLocation(lat: number, lon: number, radiusKm: number): Promise<AudioFlag[]>;
  createDeepResearchRun(run: InsertDeepResearchRun): Promise<DeepResearchRun>;
  getDeepResearchRuns(): Promise<DeepResearchRun[]>;
  getDeepResearchRun(id: string): Promise<DeepResearchRun | undefined>;
  updateDeepResearchRun(id: string, updates: Partial<DeepResearchRun>): Promise<DeepResearchRun>;
  createDeepResearchReport(report: InsertDeepResearchReport): Promise<DeepResearchReport>;
  getDeepResearchReports(runId: string): Promise<DeepResearchReport[]>;
  updateDeepResearchReport(id: string, updates: Partial<DeepResearchReport>): Promise<DeepResearchReport>;
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

  async getSignalEvents(domain?: string, limit?: number): Promise<SignalEvent[]> {
    const query = domain
      ? db.select().from(signalEvents).where(eq(signalEvents.domain, domain)).orderBy(desc(signalEvents.timestamp))
      : db.select().from(signalEvents).orderBy(desc(signalEvents.timestamp));
    return limit ? query.limit(limit) : query;
  }

  async getSignalEventsByIds(ids: string[]): Promise<SignalEvent[]> {
    if (ids.length === 0) return [];
    return db.select().from(signalEvents).where(inArray(signalEvents.id, ids));
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

  async getCorrelations(limit?: number): Promise<Correlation[]> {
    const query = db.select().from(correlations).orderBy(desc(correlations.timestamp));
    return limit ? query.limit(limit) : query;
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

  async createFeedback(feedback: InsertCorrelationFeedback): Promise<CorrelationFeedback> {
    const [created] = await db.insert(correlationFeedback).values(feedback).returning();
    return created;
  }

  async getFeedbackForCorrelation(correlationId: string): Promise<CorrelationFeedback[]> {
    return db.select().from(correlationFeedback)
      .where(eq(correlationFeedback.correlationId, correlationId))
      .orderBy(desc(correlationFeedback.createdAt));
  }

  async createCollectionLog(log: InsertCollectionLog): Promise<CollectionLog> {
    const [created] = await db.insert(collectionLogs).values(log).returning();
    return created;
  }

  async getRecentCollectionLogs(limit: number): Promise<CollectionLog[]> {
    return db.select().from(collectionLogs)
      .orderBy(desc(collectionLogs.timestamp))
      .limit(limit);
  }

  async searchEvents(query: string, domains?: string[], limit: number = 50): Promise<SignalEvent[]> {
    const conditions = [];
    const searchPattern = `%${query}%`;
    conditions.push(
      or(
        ilike(signalEvents.source, searchPattern),
        ilike(signalEvents.eventType, searchPattern),
        ilike(signalEvents.domain, searchPattern),
        sql`${signalEvents.metadata}::text ILIKE ${searchPattern}`
      )
    );
    if (domains && domains.length > 0) {
      conditions.push(
        or(...domains.map(d => eq(signalEvents.domain, d)))
      );
    }
    return db.select().from(signalEvents)
      .where(and(...conditions))
      .orderBy(desc(signalEvents.timestamp))
      .limit(limit);
  }

  async getEventsByTimeRange(from: Date, to: Date, domain?: string): Promise<SignalEvent[]> {
    const conditions = [
      gte(signalEvents.timestamp, from),
      lte(signalEvents.timestamp, to),
    ];
    if (domain) {
      conditions.push(eq(signalEvents.domain, domain));
    }
    return db.select().from(signalEvents)
      .where(and(...conditions))
      .orderBy(desc(signalEvents.timestamp));
  }

  async createResearchSession(session: InsertResearchSession): Promise<ResearchSession> {
    const [created] = await db.insert(researchSessions).values(session).returning();
    return created;
  }

  async getResearchSessions(): Promise<ResearchSession[]> {
    return db.select().from(researchSessions).orderBy(desc(researchSessions.createdAt));
  }

  async getResearchSession(id: string): Promise<ResearchSession | undefined> {
    const [session] = await db.select().from(researchSessions).where(eq(researchSessions.id, id));
    return session;
  }

  async updateResearchSession(id: string, updates: Partial<InsertResearchSession>): Promise<ResearchSession> {
    const [updated] = await db.update(researchSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(researchSessions.id, id))
      .returning();
    return updated;
  }

  async createResearchQuery(query: InsertResearchQuery): Promise<ResearchQuery> {
    const [created] = await db.insert(researchQueries).values(query).returning();
    return created;
  }

  async getResearchQueries(sessionId: string): Promise<ResearchQuery[]> {
    return db.select().from(researchQueries)
      .where(eq(researchQueries.sessionId, sessionId))
      .orderBy(desc(researchQueries.createdAt));
  }

  async createResearchFinding(finding: InsertResearchFinding): Promise<ResearchFinding> {
    const [created] = await db.insert(researchFindings).values(finding).returning();
    return created;
  }

  async getResearchFindings(sessionId: string): Promise<ResearchFinding[]> {
    return db.select().from(researchFindings)
      .where(eq(researchFindings.sessionId, sessionId))
      .orderBy(desc(researchFindings.createdAt));
  }

  async createArtifactScan(scan: InsertArtifactScan): Promise<ArtifactScan> {
    const [created] = await db.insert(artifactScans).values(scan).returning();
    return created;
  }

  async getArtifactScans(limit: number = 50): Promise<ArtifactScan[]> {
    return db.select().from(artifactScans)
      .orderBy(desc(artifactScans.createdAt))
      .limit(limit);
  }

  async getArtifactScan(id: string): Promise<ArtifactScan | undefined> {
    const [scan] = await db.select().from(artifactScans).where(eq(artifactScans.id, id));
    return scan;
  }

  async createAudioFlag(flag: InsertAudioFlag): Promise<AudioFlag> {
    const [created] = await db.insert(audioFlags).values(flag).returning();
    return created;
  }

  async getAudioFlags(limit: number = 100): Promise<AudioFlag[]> {
    return db.select().from(audioFlags)
      .orderBy(desc(audioFlags.createdAt))
      .limit(limit);
  }

  async getAudioFlagsByTimeRange(from: Date, to: Date): Promise<AudioFlag[]> {
    return db.select().from(audioFlags)
      .where(and(gte(audioFlags.createdAt, from), lte(audioFlags.createdAt, to)))
      .orderBy(desc(audioFlags.createdAt));
  }

  async getAudioFlagsByLocation(lat: number, lon: number, radiusKm: number): Promise<AudioFlag[]> {
    const degRadius = radiusKm / 111.32;
    return db.select().from(audioFlags)
      .where(and(
        gte(audioFlags.latitude, lat - degRadius),
        lte(audioFlags.latitude, lat + degRadius),
        gte(audioFlags.longitude, lon - degRadius),
        lte(audioFlags.longitude, lon + degRadius),
      ))
      .orderBy(desc(audioFlags.createdAt));
  }

  async createDeepResearchRun(run: InsertDeepResearchRun): Promise<DeepResearchRun> {
    const [created] = await db.insert(deepResearchRuns).values(run).returning();
    return created;
  }

  async getDeepResearchRuns(): Promise<DeepResearchRun[]> {
    return db.select().from(deepResearchRuns).orderBy(desc(deepResearchRuns.createdAt));
  }

  async getDeepResearchRun(id: string): Promise<DeepResearchRun | undefined> {
    const [run] = await db.select().from(deepResearchRuns).where(eq(deepResearchRuns.id, id));
    return run;
  }

  async updateDeepResearchRun(id: string, updates: Partial<DeepResearchRun>): Promise<DeepResearchRun> {
    const [updated] = await db.update(deepResearchRuns)
      .set(updates)
      .where(eq(deepResearchRuns.id, id))
      .returning();
    return updated;
  }

  async createDeepResearchReport(report: InsertDeepResearchReport): Promise<DeepResearchReport> {
    const [created] = await db.insert(deepResearchReports).values(report).returning();
    return created;
  }

  async getDeepResearchReports(runId: string): Promise<DeepResearchReport[]> {
    return db.select().from(deepResearchReports)
      .where(eq(deepResearchReports.runId, runId))
      .orderBy(deepResearchReports.createdAt);
  }

  async updateDeepResearchReport(id: string, updates: Partial<DeepResearchReport>): Promise<DeepResearchReport> {
    const [updated] = await db.update(deepResearchReports)
      .set(updates)
      .where(eq(deepResearchReports.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
