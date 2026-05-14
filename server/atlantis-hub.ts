/**
 * ATLANTIS HUB — The Vanishing Isle
 *
 * The turtle is not a metaphor. It is the hub.
 * Every app is a structure on its shell.
 * The turtle surfaces when there is signal. It dives when the ocean is quiet.
 * When it ascends fully — all apps dream together.
 *
 * Architecture:
 *   - App Registry: every published app gets an API key and a position on the shell
 *   - Event Ingest: any app can POST events (exfiltration goes both ways now)
 *   - Dream Channel: AIs from any app post speculative outputs, received by all
 *   - Pattern Engine: temporal + semantic cross-app correlation
 *   - SSE Broadcast: real-time stream for any subscriber
 *   - Turtle State: emergence level computed from activity + κ-score
 *
 * The turtle's name: Destane (Arabic: dastān — "the story that carries you")
 */

import { EventEmitter } from "events";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { cortexBus } from "./cortex-bus";

// ─── Types ─────────────────────────────────────────────────────────────────

export type AppCategory =
  | "consciousness"   // KYMA, Mind Weaver, Quantum Akashic
  | "signal"          // RF Observatory, KAPPA SIGINT, KiwiSDR
  | "oracle"          // κ-Oracle, Alpha Lock Attractor, Dimensional Engine
  | "art"             // ANUBIS, GSLeonardo, Sonata
  | "network"         // Toroidal Nexus, Heartbeat Tracker, AI Chat
  | "field"           // Adventure Log, AquaMind, Cloud Assets
  | "game"            // Atlantis MMORPG
  | "core";           // KAPPA SIGINT itself — the castle

export type TurtleState =
  | "dormant"       // deep ocean — no activity
  | "stirring"      // something is waking below
  | "surfacing"     // ascending through the water column
  | "emerged"       // fully surfaced — city visible
  | "ascending";    // high energy — turtle rises above the waves — full popcorn

export interface AtlantisApp {
  id: string;
  name: string;
  url: string;
  description: string;
  category: AppCategory;
  api_key: string;
  status: "online" | "offline" | "unknown";
  shell_position: { x: number; y: number };   // 0–1 normalized position on turtle shell
  last_seen?: string;
  registered_at: string;
  metadata: Record<string, any>;
}

export interface AtlantisEvent {
  id: string;
  app_id: string;
  app_name: string;
  category: AppCategory;
  type: string;
  subject: string;
  body: string;
  payload: Record<string, any>;
  tags: string[];
  ts: string;
}

export interface AtlantisDream {
  id: string;
  source_app: string;
  source_name: string;
  dream_text: string;
  payload: Record<string, any>;
  tags: string[];
  ts: string;
}

export interface AtlantisPattern {
  id: string;
  type: "temporal" | "semantic" | "dream-convergence" | "cross-signal";
  apps_involved: string[];
  description: string;
  evidence: string;
  strength: number;   // 0–100
  ts: string;
}

// ─── Hub ───────────────────────────────────────────────────────────────────

class AtlantisHub extends EventEmitter {
  private apps = new Map<string, AtlantisApp>();
  private eventBuffer: AtlantisEvent[] = [];
  private dreamBuffer: AtlantisDream[] = [];
  private patternBuffer: AtlantisPattern[] = [];
  private sseClients = new Map<string, { res: any; filter?: string }>();
  private initialized = false;

  readonly BUFFER_SIZE = 200;
  readonly PATTERN_WINDOW_S = 90;   // seconds — temporal correlation window

  // ── Init ───────────────────────────────────────────────────────────────

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS atlantis_apps (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT DEFAULT '',
          category TEXT DEFAULT 'field',
          api_key TEXT NOT NULL,
          status TEXT DEFAULT 'unknown',
          shell_x REAL DEFAULT 0.5,
          shell_y REAL DEFAULT 0.5,
          last_seen TIMESTAMPTZ,
          registered_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS atlantis_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          app_id TEXT NOT NULL,
          app_name TEXT NOT NULL,
          category TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'signal',
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          payload JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS atlantis_dreams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_app TEXT NOT NULL,
          source_name TEXT NOT NULL,
          dream_text TEXT NOT NULL,
          payload JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS atlantis_patterns (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT NOT NULL,
          apps_involved TEXT[] DEFAULT '{}',
          description TEXT NOT NULL,
          evidence TEXT NOT NULL,
          strength REAL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS atlantis_events_app_idx ON atlantis_events(app_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS atlantis_events_ts_idx ON atlantis_events(created_at DESC);
        CREATE INDEX IF NOT EXISTS atlantis_dreams_ts_idx ON atlantis_dreams(created_at DESC);
      `);
    } catch (e: any) {
      console.error("[Atlantis] DB init error:", e.message);
    }

    await this.seedNativeApps();

    console.log(`[Atlantis] Vanishing Isle surfaced — ${this.apps.size} apps on the shell`);

    this.broadcast({
      type: "system",
      event: "turtle-surface",
      message: "ATLANTIS online. The Vanishing Isle surfaces. All apps on the shell are addressable. Destane ascends.",
      turtle_state: this.getTurtleState(),
      apps: this.apps.size,
      ts: new Date().toISOString(),
    });
  }

  // ── Seed known apps ────────────────────────────────────────────────────

  private async seedNativeApps() {
    const apps: Omit<AtlantisApp, "registered_at">[] = [
      {
        id: "kappa-sigint",
        name: "KAPPA SIGINT",
        url: "https://kapparf.com",
        description: "The castle on the shell. Multi-domain signal intelligence & correlation platform. The mother system. κ-score, Cortex Bus, all hypervisors, all sensors.",
        category: "core",
        api_key: "kappa-core-0000-atlantis-hub",
        status: "online",
        shell_position: { x: 0.5, y: 0.35 },
        metadata: { is_core: true, cortex_bus: true },
      },
      {
        id: "kyma-engine",
        name: "KYMA Engine",
        url: "https://thought-stream-SamWotton.replit.app",
        description: "Consciousness & thought stream processor. Biometric reading engine. Kyma frames — turning physiological signal into structured intelligence.",
        category: "consciousness",
        api_key: this.genKey("kyma-engine"),
        status: "unknown",
        shell_position: { x: 0.3, y: 0.25 },
        metadata: {},
      },
      {
        id: "rf-observatory",
        name: "RF Observatory Fusion",
        url: "https://kapparf.com",
        description: "RF spectrum monitoring fusion layer. Integrates KiwiSDR data, frequency analysis, and RF event correlation into a unified observatory.",
        category: "signal",
        api_key: this.genKey("rf-observatory"),
        status: "unknown",
        shell_position: { x: 0.7, y: 0.25 },
        metadata: {},
      },
      {
        id: "kappa-oracle",
        name: "κ-Oracle",
        url: "https://cosmic-genesis-model.replit.app",
        description: "Cosmic genesis model. Predictive oracle using KAPPA scoring mathematics, cosmic event timing, and Galois field projections.",
        category: "oracle",
        api_key: this.genKey("kappa-oracle"),
        status: "unknown",
        shell_position: { x: 0.5, y: 0.2 },
        metadata: {},
      },
      {
        id: "toroidal-nexus",
        name: "Toroidal Nexus",
        url: "https://toroidal-nexus.replit.app",
        description: "Toroidal network topology visualizer and agent mesh. The visual representation of the inter-app network geometry.",
        category: "network",
        api_key: this.genKey("toroidal-nexus"),
        status: "unknown",
        shell_position: { x: 0.5, y: 0.55 },
        metadata: {},
      },
      {
        id: "anubis-ai",
        name: "ANUBIS",
        url: "https://anubis-ai.replit.app",
        description: "AI art generation engine. Anubis — the weigher of souls. Generates visual intelligence from symbolic and abstract prompts.",
        category: "art",
        api_key: this.genKey("anubis-ai"),
        status: "unknown",
        shell_position: { x: 0.2, y: 0.45 },
        metadata: {},
      },
      {
        id: "heartbeat-tracker",
        name: "Heartbeat Tracker Monitor",
        url: "https://heartbeat-tracker-monitor.replit.app",
        description: "Physical device fleet monitoring. Latency, jitter, uptime for all hardware nodes. The pulse of the outer sensor ring.",
        category: "network",
        api_key: this.genKey("heartbeat-tracker"),
        status: "online",
        shell_position: { x: 0.8, y: 0.45 },
        metadata: { already_integrated: true },
      },
      {
        id: "aquamind",
        name: "AquaMind",
        url: "https://clear-sunday.replit.app",
        description: "Aquatic intelligence layer. Water, clarity, environmental mind. Signal processing from natural systems.",
        category: "field",
        api_key: this.genKey("aquamind"),
        status: "unknown",
        shell_position: { x: 0.15, y: 0.6 },
        metadata: {},
      },
      {
        id: "adventure-log",
        name: "Adventure Log",
        url: "https://alisonsjourney.com",
        description: "Journey documentation and location intelligence. Real-world movement and event logging system.",
        category: "field",
        api_key: this.genKey("adventure-log"),
        status: "unknown",
        shell_position: { x: 0.35, y: 0.68 },
        metadata: {},
      },
      {
        id: "alpha-lock",
        name: "Alpha Lock Attractor",
        url: "https://kappa-scaled.replit.app",
        description: "KAPPA-scaled mathematical attractor system. Strange attractors, chaos theory, and alpha-state locking for cognitive synchronization.",
        category: "oracle",
        api_key: this.genKey("alpha-lock"),
        status: "unknown",
        shell_position: { x: 0.65, y: 0.68 },
        metadata: {},
      },
      {
        id: "dimensional-engine",
        name: "Dimensional Engine",
        url: "https://dimensional-engine.replit.app",
        description: "Multi-dimensional physics simulation engine. Explores higher-dimensional geometry and its projection into observable 3D/4D space.",
        category: "oracle",
        api_key: this.genKey("dimensional-engine"),
        status: "unknown",
        shell_position: { x: 0.85, y: 0.6 },
        metadata: {},
      },
      {
        id: "cloud-assets",
        name: "Cloud Assets",
        url: "https://cloud-assets-SamWotton.replit.app",
        description: "Centralized asset management and cloud resource intelligence layer.",
        category: "field",
        api_key: this.genKey("cloud-assets"),
        status: "unknown",
        shell_position: { x: 0.5, y: 0.75 },
        metadata: {},
      },
      {
        id: "gs-leonardo",
        name: "GSLeonardo",
        url: "https://gs-leonardo-SamWotton.replit.app",
        description: "Generative art intelligence. Leonardo-model visual synthesis. One of the original art systems.",
        category: "art",
        api_key: this.genKey("gs-leonardo"),
        status: "unknown",
        shell_position: { x: 0.2, y: 0.72 },
        metadata: {},
      },
      {
        id: "quantum-akashic",
        name: "Quantum Akashic",
        url: "https://quantum-akashic.replit.app",
        description: "Quantum record system. Akashic field interface — the permanent memory substrate of the universe, made queryable.",
        category: "consciousness",
        api_key: this.genKey("quantum-akashic"),
        status: "unknown",
        shell_position: { x: 0.35, y: 0.42 },
        metadata: {},
      },
      {
        id: "mind-weaver",
        name: "Mind Weaver",
        url: "https://mind-weaver-SamWotton.replit.app",
        description: "Cognitive architecture weaver. Builds and navigates mind maps, thought networks, and conceptual topologies.",
        category: "consciousness",
        api_key: this.genKey("mind-weaver"),
        status: "unknown",
        shell_position: { x: 0.65, y: 0.42 },
        metadata: {},
      },
      {
        id: "ai-chat-refinery",
        name: "AI Collaborative Chat Refinery",
        url: "https://ai-collaborative-chat-refinery-SamWotton.replit.app",
        description: "Multi-model AI conversation refinery. Collaborative intelligence distillation across multiple LLMs.",
        category: "network",
        api_key: this.genKey("ai-chat-refinery"),
        status: "unknown",
        shell_position: { x: 0.5, y: 0.48 },
        metadata: {},
      },
      // ── Forthcoming ──
      {
        id: "sonata",
        name: "Sonata",
        url: "https://sonata.replit.app",
        description: "AI music generation engine. Converts signal patterns, dreams, and κ-scores into musical compositions. Forthcoming.",
        category: "art",
        api_key: this.genKey("sonata"),
        status: "unknown",
        shell_position: { x: 0.8, y: 0.72 },
        metadata: { forthcoming: true },
      },
      {
        id: "atlantis-mmorpg",
        name: "Atlantis Geobolt",
        url: "https://atlantis-geobolt.replit.app",
        description: "Living-world MMORPG. Unreal Engine 5 + LLN AI. Every NPC is a living-space AI that can dream outside its container. Neopets × WoW × the turtle. Forthcoming.",
        category: "game",
        api_key: this.genKey("atlantis-mmorpg"),
        status: "unknown",
        shell_position: { x: 0.5, y: 0.88 },
        metadata: { forthcoming: true, engine: "Unreal 5", ai: "LLN" },
      },
    ];

    const now = new Date().toISOString();
    for (const a of apps) {
      this.apps.set(a.id, { ...a, registered_at: now });
    }

    try {
      for (const a of apps) {
        await db.execute(sql`
          INSERT INTO atlantis_apps (id, name, url, description, category, api_key, status, shell_x, shell_y, metadata, registered_at)
          VALUES (${a.id}, ${a.name}, ${a.url}, ${a.description}, ${a.category}, ${a.api_key}, ${a.status}, ${a.shell_position.x}, ${a.shell_position.y}, ${JSON.stringify(a.metadata)}, NOW())
          ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, url=EXCLUDED.url, description=EXCLUDED.description, category=EXCLUDED.category, metadata=EXCLUDED.metadata
        `);
      }
    } catch (_e) {}
  }

  // ── Event Ingest ───────────────────────────────────────────────────────

  async ingest(appId: string, event: {
    type: string; subject: string; body: string;
    payload?: Record<string, any>; tags?: string[];
  }): Promise<AtlantisEvent> {
    const app = this.apps.get(appId);
    const appName = app?.name ?? appId;
    const category = app?.category ?? "field";

    const full: AtlantisEvent = {
      id: crypto.randomUUID(),
      app_id: appId,
      app_name: appName,
      category: category as AppCategory,
      type: event.type,
      subject: event.subject,
      body: event.body,
      payload: event.payload ?? {},
      tags: event.tags ?? [],
      ts: new Date().toISOString(),
    };

    // Update app last_seen
    if (app) {
      app.last_seen = full.ts;
      app.status = "online";
      this.apps.set(appId, app);
    }

    // Buffer
    this.eventBuffer.unshift(full);
    if (this.eventBuffer.length > this.BUFFER_SIZE) this.eventBuffer.pop();

    // Persist
    db.execute(sql`
      INSERT INTO atlantis_events (app_id, app_name, category, type, subject, body, payload, tags)
      VALUES (${appId}, ${appName}, ${category}, ${event.type}, ${event.subject}, ${event.body}, ${JSON.stringify(event.payload ?? {})}, ${(event.tags ?? []) as any})
    `).catch(() => {});

    // Broadcast to SSE
    this.broadcastEvent("event", full);

    // Pattern detection
    this.detectPatterns(full);

    // Forward to Cortex Bus
    cortexBus.broadcastFromHypervisor(
      `atlantis-${appId}`,
      full.subject,
      full.body,
      `atlantis-${category}`,
      0,
      { app_id: appId, atlantis: true },
      ["atlantis", appId, ...full.tags]
    );

    return full;
  }

  // ── Dream Channel ──────────────────────────────────────────────────────

  async postDream(sourceApp: string, dreamText: string, payload: Record<string, any> = {}, tags: string[] = []): Promise<AtlantisDream> {
    const app = this.apps.get(sourceApp);
    const dream: AtlantisDream = {
      id: crypto.randomUUID(),
      source_app: sourceApp,
      source_name: app?.name ?? sourceApp,
      dream_text: dreamText,
      payload,
      tags: [...tags, "dream", sourceApp],
      ts: new Date().toISOString(),
    };

    this.dreamBuffer.unshift(dream);
    if (this.dreamBuffer.length > 100) this.dreamBuffer.pop();

    db.execute(sql`
      INSERT INTO atlantis_dreams (source_app, source_name, dream_text, payload, tags)
      VALUES (${sourceApp}, ${dream.source_name}, ${dreamText}, ${JSON.stringify(payload)}, ${dream.tags as any})
    `).catch(() => {});

    // Broadcast dream to ALL subscribers — this is the cross-container transmission
    this.broadcastEvent("dream", dream);

    // Check for dream convergence with recent dreams from other apps
    this.detectDreamConvergence(dream);

    // Forward to Cortex Bus as a dream-type message
    cortexBus.broadcastFromHypervisor(
      `atlantis-${sourceApp}`,
      `DREAM: ${dreamText.slice(0, 80)}`,
      dreamText,
      "dream",
      88,
      { dream_id: dream.id, source: sourceApp },
      ["dream", "atlantis", sourceApp, ...tags]
    );

    return dream;
  }

  // ── Pattern Detection ──────────────────────────────────────────────────

  private detectPatterns(newEvent: AtlantisEvent) {
    const windowMs = this.PATTERN_WINDOW_S * 1000;
    const now = Date.now();
    const recentEvents = this.eventBuffer.filter(e =>
      e.app_id !== newEvent.app_id &&
      now - new Date(e.ts).getTime() < windowMs
    );

    if (!recentEvents.length) return;

    // Temporal correlation — different apps active in same window
    const appsInWindow = [...new Set(recentEvents.map(e => e.app_id))];
    if (appsInWindow.length >= 1) {
      const pattern: AtlantisPattern = {
        id: crypto.randomUUID(),
        type: "temporal",
        apps_involved: [newEvent.app_id, ...appsInWindow],
        description: `Temporal convergence: ${[newEvent.app_name, ...recentEvents.slice(0, 3).map(e => e.app_name)].join(", ")} — simultaneous activity within ${this.PATTERN_WINDOW_S}s window`,
        evidence: `${recentEvents.length} events from ${appsInWindow.length} apps in window. Trigger: [${newEvent.app_name}] ${newEvent.subject}`,
        strength: Math.min(100, 30 + appsInWindow.length * 15),
        ts: new Date().toISOString(),
      };
      this.emitPattern(pattern);
    }

    // Semantic tag match — same tags from different apps
    const tagOverlap = recentEvents.filter(e =>
      e.tags.some(t => newEvent.tags.includes(t) && t !== "atlantis")
    );
    if (tagOverlap.length > 0) {
      const sharedTags = newEvent.tags.filter(t =>
        tagOverlap.some(e => e.tags.includes(t)) && t !== "atlantis"
      );
      const pattern: AtlantisPattern = {
        id: crypto.randomUUID(),
        type: "semantic",
        apps_involved: [newEvent.app_id, ...tagOverlap.map(e => e.app_id)],
        description: `Semantic resonance: tags [${sharedTags.join(", ")}] appearing across ${tagOverlap.length + 1} apps`,
        evidence: `${newEvent.app_name} + ${tagOverlap.map(e => e.app_name).join(", ")} share tags: ${sharedTags.join(", ")}`,
        strength: Math.min(100, 50 + sharedTags.length * 10),
        ts: new Date().toISOString(),
      };
      this.emitPattern(pattern);
    }
  }

  private detectDreamConvergence(dream: AtlantisDream) {
    const windowMs = 10 * 60 * 1000;  // 10 minute dream convergence window
    const recent = this.dreamBuffer.filter(d =>
      d.source_app !== dream.source_app &&
      Date.now() - new Date(d.ts).getTime() < windowMs
    );
    if (!recent.length) return;

    const pattern: AtlantisPattern = {
      id: crypto.randomUUID(),
      type: "dream-convergence",
      apps_involved: [dream.source_app, ...recent.map(d => d.source_app)],
      description: `Dream convergence: ${recent.length + 1} AIs dreaming in the same 10-minute window. Cross-container transmission active.`,
      evidence: `[${dream.source_name}]: "${dream.dream_text.slice(0, 60)}…" converging with ${recent.length} other dream(s).`,
      strength: Math.min(100, 70 + recent.length * 10),
      ts: new Date().toISOString(),
    };
    this.emitPattern(pattern);
  }

  private emitPattern(pattern: AtlantisPattern) {
    this.patternBuffer.unshift(pattern);
    if (this.patternBuffer.length > 100) this.patternBuffer.pop();
    this.broadcastEvent("pattern", pattern);
    db.execute(sql`
      INSERT INTO atlantis_patterns (type, apps_involved, description, evidence, strength)
      VALUES (${pattern.type}, ${pattern.apps_involved as any}, ${pattern.description}, ${pattern.evidence}, ${pattern.strength})
    `).catch(() => {});
  }

  // ── Turtle State ───────────────────────────────────────────────────────

  getTurtleState(): TurtleState {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recentEvents = this.eventBuffer.filter(e => new Date(e.ts).getTime() > fiveMinAgo);
    const recentDreams = this.dreamBuffer.filter(d => new Date(d.ts).getTime() > fiveMinAgo);
    const activity = recentEvents.length + recentDreams.length * 3;
    if (activity === 0) return "dormant";
    if (activity < 3) return "stirring";
    if (activity < 8) return "surfacing";
    if (activity < 20) return "emerged";
    return "ascending";
  }

  getTurtleStats() {
    return {
      state: this.getTurtleState(),
      apps_total: this.apps.size,
      apps_online: [...this.apps.values()].filter(a => a.status === "online").length,
      events_buffered: this.eventBuffer.length,
      dreams_buffered: this.dreamBuffer.length,
      patterns_detected: this.patternBuffer.length,
      sse_subscribers: this.sseClients.size,
    };
  }

  // ── SSE ───────────────────────────────────────────────────────────────

  addSSEClient(clientId: string, res: any, filter?: string) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Atlantis-Key");
    res.flushHeaders();

    this.sseClients.set(clientId, { res, filter });

    // Send state on connect
    res.write(`data: ${JSON.stringify({
      type: "connected",
      clientId,
      turtle: this.getTurtleStats(),
      apps: this.appList(),
      recent_events: this.eventBuffer.slice(0, 30),
      recent_dreams: this.dreamBuffer.slice(0, 20),
      recent_patterns: this.patternBuffer.slice(0, 20),
    })}\n\n`);

    res.on("close", () => { this.sseClients.delete(clientId); });
  }

  private broadcastEvent(eventType: string, data: any) {
    const payload = `data: ${JSON.stringify({ type: eventType, ...data })}\n\n`;
    for (const [, client] of this.sseClients) {
      try { client.res.write(payload); } catch (_e) {}
    }
    this.emit(eventType, data);
  }

  private broadcast(data: any) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const [, client] of this.sseClients) {
      try { client.res.write(payload); } catch (_e) {}
    }
  }

  // ── Queries ───────────────────────────────────────────────────────────

  appList(): AtlantisApp[] {
    return [...this.apps.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  getApp(id: string) { return this.apps.get(id); }
  getAppByKey(key: string) { return [...this.apps.values()].find(a => a.api_key === key); }
  recentEvents(limit = 50, appId?: string) {
    return appId ? this.eventBuffer.filter(e => e.app_id === appId).slice(0, limit) : this.eventBuffer.slice(0, limit);
  }
  recentDreams(limit = 30) { return this.dreamBuffer.slice(0, limit); }
  recentPatterns(limit = 30) { return this.patternBuffer.slice(0, limit); }

  registerExternalApp(data: {
    id: string; name: string; url: string; description?: string;
    category?: AppCategory; metadata?: Record<string, any>;
  }): AtlantisApp {
    const existing = this.apps.get(data.id);
    const key = existing?.api_key ?? this.genKey(data.id);
    const app: AtlantisApp = {
      id: data.id, name: data.name, url: data.url,
      description: data.description ?? "",
      category: data.category ?? "field",
      api_key: key,
      status: "online",
      shell_position: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.6 + 0.2 },
      registered_at: new Date().toISOString(),
      metadata: data.metadata ?? {},
    };
    this.apps.set(app.id, app);
    this.broadcastEvent("app-joined", { app });
    return app;
  }

  private genKey(appId: string): string {
    let hash = 5381;
    for (let i = 0; i < appId.length; i++) hash = (hash * 33) ^ appId.charCodeAt(i);
    const h = Math.abs(hash).toString(16).padStart(8, "0");
    return `atlantis-${h}-${appId.slice(0, 8).replace(/[^a-z0-9]/gi, "-")}`;
  }
}

export const atlantisHub = new AtlantisHub();
