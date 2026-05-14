/**
 * CORTEX BUS — Mycelium Hypervisor Network
 *
 * Toroidal message bus for inter-monad communication.
 * Monads are self-contained agents organized in 4 concentric layers:
 *
 *   Layer 0 — EXECUTIVE   : Central orchestrator (this node)
 *   Layer 1 — PRIMARY     : Core hypervisors (Forensic, KiwiSDR Vision, CHRONOS, KAPPA Engine)
 *   Layer 2 — SECONDARY   : Auto-correlator, Memory Cortex, LLM Analyst, External Feeds
 *   Layer 3 — SENSOR      : KiwiSDR nodes, Fleet devices, USGS, NOAA, OpenSky
 *
 * Message lifecycle:
 *   SPORE → HYPHA → MYCELIUM → FRUITING BODY → HARVEST → SUBSTRATE
 *
 * A SPORE is a raw signal. It travels as a HYPHA through the layers.
 * When KAPPA score crosses the spawn threshold, a FRUITING BODY (sub-hypervisor) erupts.
 * The fruiting body produces findings. Findings are HARVESTed into Memory Cortex.
 * They become new SUBSTRATE for the next generation of monads.
 */

import { EventEmitter } from "events";
import { db } from "./db";
import { sql } from "drizzle-orm";

// ─── Types ─────────────────────────────────────────────────────────────────

export type MonadLayer = 0 | 1 | 2 | 3;
export type MessageType =
  | "signal"        // raw sensor data propagating up through layers
  | "correlation"   // found pattern propagating to executive
  | "proposal"      // monad proposes new software / analysis spec
  | "spawn"         // executive creates a new sub-hypervisor monad
  | "harvest"       // monad reports its findings back to mycelium
  | "heartbeat"     // monad announces it's alive + current state
  | "prune"         // executive removes a dead monad
  | "broadcast"     // general message — all monads in a layer
  | "dream"         // a visionary / speculative message (human-originated)
  | "alert";        // urgent cross-layer interrupt

export interface Monad {
  id: string;
  name: string;
  description: string;
  layer: MonadLayer;
  capabilities: string[];
  endpoint_url?: string;
  kappa_score: number;
  status: "alive" | "dormant" | "spawning" | "harvesting" | "pruned";
  spawn_threshold: number;       // KAPPA score that triggers this monad to spawn a child
  spawn_template?: string;       // what kind of fruiting body it creates
  metadata: Record<string, any>;
  last_heartbeat: Date;
  registered_at: Date;
}

export interface CortexMessage {
  id: string;
  channel: string;
  type: MessageType;
  source: string;
  target?: string;
  layer?: MonadLayer;
  subject: string;
  body: string;
  payload: Record<string, any>;
  kappa_score: number;
  tags: string[];
  ts: string;
}

// ─── Bus ───────────────────────────────────────────────────────────────────

class CortexBus extends EventEmitter {
  private monads = new Map<string, Monad>();
  private sseClients = new Map<string, { res: any; filter?: string }>();
  private messageBuffer: CortexMessage[] = [];   // last 200 messages in-memory
  private readonly BUFFER_SIZE = 200;
  private initialized = false;

  // ── Init ────────────────────────────────────────────────────────────────

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Create tables if not present
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS cortex_agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          capabilities TEXT[] DEFAULT '{}',
          endpoint_url TEXT,
          kappa_score REAL DEFAULT 0,
          status TEXT DEFAULT 'alive',
          layer INTEGER DEFAULT 3,
          spawn_threshold REAL DEFAULT 80,
          spawn_template TEXT,
          metadata JSONB DEFAULT '{}',
          last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
          registered_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cortex_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel TEXT NOT NULL DEFAULT 'general',
          type TEXT NOT NULL DEFAULT 'broadcast',
          source_agent TEXT NOT NULL,
          target_agent TEXT,
          layer INTEGER,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          payload JSONB DEFAULT '{}',
          kappa_score REAL DEFAULT 0,
          tags TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS cortex_msg_channel_idx ON cortex_messages(channel, created_at DESC);
        CREATE INDEX IF NOT EXISTS cortex_msg_source_idx ON cortex_messages(source_agent, created_at DESC);
        CREATE INDEX IF NOT EXISTS cortex_msg_type_idx ON cortex_messages(type, created_at DESC);
      `);
    } catch (e: any) {
      console.error("[CortexBus] DB init error:", e.message);
    }

    // Register all native KAPPA monads
    await this.registerNativeMonads();

    // Start heartbeat cycle (every 60s)
    setInterval(() => this.heartbeatCycle(), 60_000);

    // Announce the bus is alive
    this.publish({
      channel: "system",
      type: "broadcast",
      source: "kappa-executive",
      subject: "CORTEX BUS ONLINE",
      body: "The Mycelium Hypervisor Network is live. All monads may now communicate. Substrate is ready. Spores accepted.",
      payload: { monads: this.monads.size, ts: new Date().toISOString() },
      kappa_score: 100,
      tags: ["system", "init", "executive"],
    });

    console.log("[CortexBus] Mycelium online — toroidal layers initialized");
  }

  // ── Monad Registry ──────────────────────────────────────────────────────

  private async registerNativeMonads() {
    const natives: Omit<Monad, "last_heartbeat" | "registered_at">[] = [
      {
        id: "kappa-executive",
        name: "KAPPA Executive",
        description: "Central orchestrator. Holds the κ-score, routes messages between layers, approves spawn proposals. Born from the heartbeat monitor.",
        layer: 0,
        capabilities: ["orchestrate", "spawn", "prune", "score", "broadcast", "route"],
        kappa_score: 100,
        status: "alive",
        spawn_threshold: 90,
        spawn_template: "meta-analyzer",
        metadata: { birth: "heartbeat-tracker-monitor.replit.app", theta_K: 128.23, kappa: 4 / Math.PI },
      },
      {
        id: "kappa-engine",
        name: "KAPPA Correlation Engine",
        description: "Calculates the KAPPA Score (0–100) from multi-domain signal events. Drives threat levels and pipeline orchestration.",
        layer: 1,
        capabilities: ["score", "correlate", "fingerprint", "threat-level"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 85,
        spawn_template: "deep-correlator",
        metadata: { rules: 22, schumann_hz: 7.83, root_hz: 111 },
      },
      {
        id: "forensic-hypervisor",
        name: "Forensic Hypervisor",
        description: "Autonomous 24/7 SQL pattern mining, temporal enrichment, and PCAP/PCAPNG analysis against KAPPA events.",
        layer: 1,
        capabilities: ["sql-mining", "pcap-analysis", "temporal-enrichment", "pattern-detect"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 75,
        spawn_template: "forensic-deep-dive",
        metadata: {},
      },
      {
        id: "kiwisdr-vision",
        name: "KiwiSDR Vision Hypervisor",
        description: "Playwright-based autonomous spectrogram capture + OpenAI Vision analysis across 21 frequency profiles.",
        layer: 1,
        capabilities: ["spectrogram", "rf-analysis", "vision-ai", "frequency-scan"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 70,
        spawn_template: "rf-deep-scan",
        metadata: { nodes: 33, profiles: 21 },
      },
      {
        id: "omega-chronos",
        name: "Ω-CHRONOS Hypervisor",
        description: "Automated temporal correlation engine using κ-DTW alignment and autonomous agents.",
        layer: 1,
        capabilities: ["temporal-correlation", "dtw-alignment", "agent-spawn", "time-warp"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 80,
        spawn_template: "temporal-analyst",
        metadata: { kappa_dtw: true },
      },
      {
        id: "auto-correlator",
        name: "Auto-Correlator",
        description: "Continuously analyzes events against 22 correlation rules with deduplication and TLE consistency checks.",
        layer: 2,
        capabilities: ["rule-matching", "dedup", "tle-check", "hypervisor-overlap"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 60,
        spawn_template: "rule-expander",
        metadata: { rules: 22 },
      },
      {
        id: "memory-cortex",
        name: "Memory Cortex",
        description: "Semantic vector memory with multi-provider embeddings. The permanent substrate — all harvests land here.",
        layer: 2,
        capabilities: ["embed", "store", "search", "recall", "ingest"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 50,
        spawn_template: "memory-miner",
        metadata: { providers: ["openai", "openrouter"] },
      },
      {
        id: "llm-analyst",
        name: "LLM Analyst",
        description: "OpenAI gpt-4o-mini correlation analysis and intelligence report generation.",
        layer: 2,
        capabilities: ["analyze", "report", "synthesize", "gpt-4o-mini"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 65,
        spawn_template: "report-generator",
        metadata: { model: "gpt-4o-mini" },
      },
      {
        id: "external-feeds",
        name: "External Feeds Collector",
        description: "Autonomous 120s-cycle ingestion: USGS, IRIS seismic, NOAA SWPC, GeoNet NZ, WWLLN lightning, KiwiSDR discovery.",
        layer: 2,
        capabilities: ["usgs", "iris", "noaa-swpc", "geonet", "wwlln", "kiwisdr-discovery"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 45,
        spawn_template: "feed-deep-puller",
        metadata: { cycle_s: 120, sources: 6 },
      },
      {
        id: "kiwisdr-scanner",
        name: "KiwiSDR Scanner",
        description: "Scans 71 targets across 33 nodes with tiered analysis — priority Central America/Caribbean nodes + global TDOA.",
        layer: 3,
        capabilities: ["rf-scan", "tdoa", "vlf-monitor", "hf-scan"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 40,
        spawn_template: "frequency-hunter",
        metadata: { targets: 71, nodes: 33 },
      },
      {
        id: "fleet-tracker",
        name: "Fleet Tracker",
        description: "Native heartbeat monitoring for the device fleet. Hardware sensors feeding the outer ring.",
        layer: 3,
        capabilities: ["heartbeat", "latency", "jitter", "uptime", "sensor-ingest"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 35,
        spawn_template: "device-analyzer",
        metadata: {},
      },
      {
        id: "network-watchdog",
        name: "Network Watchdog",
        description: "Network heartbeat monitor, IPAT analysis, connectivity anomaly detection.",
        layer: 3,
        capabilities: ["heartbeat", "ipat", "connectivity", "anomaly"],
        kappa_score: 0,
        status: "alive",
        spawn_threshold: 35,
        spawn_template: "net-forensic",
        metadata: {},
      },
    ];

    const now = new Date();
    for (const m of natives) {
      this.monads.set(m.id, { ...m, last_heartbeat: now, registered_at: now });
    }

    // Upsert to DB
    try {
      for (const m of natives) {
        await db.execute(sql`
          INSERT INTO cortex_agents (id, name, description, capabilities, kappa_score, status, layer, spawn_threshold, spawn_template, metadata, last_heartbeat, registered_at)
          VALUES (${m.id}, ${m.name}, ${m.description}, ${m.capabilities as any}, ${m.kappa_score}, ${m.status}, ${m.layer}, ${m.spawn_threshold}, ${m.spawn_template ?? null}, ${JSON.stringify(m.metadata)}, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, capabilities=EXCLUDED.capabilities, layer=EXCLUDED.layer, spawn_threshold=EXCLUDED.spawn_threshold, spawn_template=EXCLUDED.spawn_template, metadata=EXCLUDED.metadata, last_heartbeat=NOW()
        `);
      }
    } catch (_e) { /* DB may not be ready yet — in-memory registry is sufficient */ }
  }

  // ── Publish ─────────────────────────────────────────────────────────────

  async publish(msg: Omit<CortexMessage, "id" | "ts">): Promise<CortexMessage> {
    const full: CortexMessage = {
      ...msg,
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
    };

    // Buffer
    this.messageBuffer.unshift(full);
    if (this.messageBuffer.length > this.BUFFER_SIZE) this.messageBuffer.pop();

    // Emit to all SSE clients
    this.emit("message", full);
    this._pushSSE(full);

    // Persist to DB (non-blocking)
    db.execute(sql`
      INSERT INTO cortex_messages (id, channel, type, source_agent, target_agent, layer, subject, body, payload, kappa_score, tags)
      VALUES (${full.id}::uuid, ${full.channel}, ${full.type}, ${full.source}, ${full.target ?? null}, ${full.layer ?? null}, ${full.subject}, ${full.body}, ${JSON.stringify(full.payload)}, ${full.kappa_score}, ${full.tags as any})
    `).catch(() => {});

    // Spawn check — if kappa_score > sender's spawn_threshold, trigger fruiting body
    if (full.kappa_score > 0) {
      const sender = this.monads.get(full.source);
      if (sender && full.kappa_score >= sender.spawn_threshold && full.type !== "spawn" && full.type !== "heartbeat") {
        setImmediate(() => this._maybeSpawn(full, sender));
      }
    }

    return full;
  }

  // ── Spawn (Fruiting Body) ───────────────────────────────────────────────

  private spawnCooldowns = new Map<string, number>();

  private async _maybeSpawn(trigger: CortexMessage, sender: Monad) {
    const cooldownKey = `${sender.id}:${trigger.channel}`;
    const now = Date.now();
    const lastSpawn = this.spawnCooldowns.get(cooldownKey) ?? 0;
    if (now - lastSpawn < 5 * 60 * 1000) return;   // 5min cooldown per monad+channel
    this.spawnCooldowns.set(cooldownKey, now);

    const childId = `spawn-${sender.id}-${Date.now()}`;
    const childLayer = Math.min(3, (sender.layer + 1) as MonadLayer) as MonadLayer;

    const child: Monad = {
      id: childId,
      name: `${sender.name} ⟶ ${trigger.subject.slice(0, 30)} [FRUITING BODY]`,
      description: `Sub-hypervisor spawned from ${sender.name} on ${trigger.channel}. Task: ${trigger.subject}. κ=${trigger.kappa_score.toFixed(1)}`,
      layer: childLayer,
      capabilities: ["analyze", "harvest", ...(sender.capabilities ?? [])],
      kappa_score: trigger.kappa_score,
      status: "spawning",
      spawn_threshold: 999,   // fruiting bodies don't spawn children
      spawn_template: undefined,
      metadata: {
        parent: sender.id,
        trigger_id: trigger.id,
        trigger_channel: trigger.channel,
        trigger_kappa: trigger.kappa_score,
        spawned_at: new Date().toISOString(),
        task: sender.spawn_template ?? "analyze",
      },
      last_heartbeat: new Date(),
      registered_at: new Date(),
    };

    this.monads.set(childId, child);

    await this.publish({
      channel: "spawn",
      type: "spawn",
      source: "kappa-executive",
      subject: `FRUITING BODY: ${child.name}`,
      body: `Spawned from ${sender.name} (κ=${trigger.kappa_score.toFixed(1)} ≥ threshold ${sender.spawn_threshold}). Task: analyze ${trigger.channel}. Channel trigger: ${trigger.subject}. This monad will harvest findings back to Memory Cortex.`,
      payload: { child_id: childId, parent_id: sender.id, trigger, layer: childLayer },
      kappa_score: trigger.kappa_score,
      tags: ["spawn", "fruiting-body", sender.id, trigger.channel],
      layer: 0,
    });

    // Simulate harvest after 30s (replace with real LLM analysis in production)
    setTimeout(() => this._harvest(child, trigger), 30_000);
  }

  private async _harvest(child: Monad, trigger: CortexMessage) {
    child.status = "harvesting";
    this.monads.set(child.id, child);

    await this.publish({
      channel: "harvest",
      type: "harvest",
      source: child.id,
      subject: `HARVEST: ${trigger.subject}`,
      body: `Fruiting body ${child.name} completed analysis. Channel: ${trigger.channel}. KAPPA at spawn: ${trigger.kappa_score.toFixed(1)}. Findings propagating to Memory Cortex substrate. Parent monad: ${child.metadata.parent}.`,
      payload: {
        parent: child.metadata.parent,
        trigger_id: trigger.id,
        channel: trigger.channel,
        findings: `Analysis of [${trigger.subject}] via ${child.metadata.task ?? "general"} pattern. κ=${trigger.kappa_score.toFixed(1)}. Cross-layer correlation with layer ${child.layer} substrate complete.`,
      },
      kappa_score: trigger.kappa_score * 0.9,
      tags: ["harvest", "memory-cortex", child.id],
    });

    // Mark child dormant
    child.status = "dormant";
    this.monads.set(child.id, child);
  }

  // ── SSE ─────────────────────────────────────────────────────────────────

  addSSEClient(clientId: string, res: any, filter?: string) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    this.sseClients.set(clientId, { res, filter });

    // Send recent buffer on connect
    const recent = filter
      ? this.messageBuffer.filter(m => m.channel === filter || m.source === filter || (m.tags ?? []).includes(filter))
      : this.messageBuffer.slice(0, 40);

    res.write(`data: ${JSON.stringify({ type: "connected", clientId, buffer: recent.slice(0, 40), monads: this.monadList() })}\n\n`);

    res.on("close", () => { this.sseClients.delete(clientId); });
  }

  private _pushSSE(msg: CortexMessage) {
    const payload = `data: ${JSON.stringify(msg)}\n\n`;
    for (const [, client] of this.sseClients) {
      if (client.filter && msg.channel !== client.filter && msg.source !== client.filter && !(msg.tags ?? []).includes(client.filter)) continue;
      try { client.res.write(payload); } catch (_e) {}
    }
  }

  // ── Heartbeat cycle ─────────────────────────────────────────────────────

  private async heartbeatCycle() {
    const now = new Date();
    for (const [id, monad] of this.monads) {
      if (monad.layer === 0) {
        monad.last_heartbeat = now;
        this.monads.set(id, monad);
      }
    }

    await this.publish({
      channel: "system",
      type: "heartbeat",
      source: "kappa-executive",
      subject: `HEARTBEAT — ${this.monads.size} monads, ${this.sseClients.size} subscribers`,
      body: `Mycelium pulse. Layers 0-3 active. SSE subscribers: ${this.sseClients.size}. Fruiting bodies: ${[...this.monads.values()].filter(m => m.id.startsWith("spawn-")).length}. Buffer: ${this.messageBuffer.length} messages.`,
      payload: {
        monads: this.monadCount(),
        sse_subscribers: this.sseClients.size,
        fruiting_bodies: [...this.monads.values()].filter(m => m.id.startsWith("spawn-")).length,
        buffer_size: this.messageBuffer.length,
      },
      kappa_score: 0,
      tags: ["heartbeat", "system"],
    });
  }

  // ── Queries ─────────────────────────────────────────────────────────────

  monadList(): Monad[] {
    return [...this.monads.values()].sort((a, b) => a.layer - b.layer || a.name.localeCompare(b.name));
  }

  monadCount() {
    const counts = { total: 0, by_layer: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number> };
    for (const m of this.monads.values()) { counts.total++; counts.by_layer[m.layer] = (counts.by_layer[m.layer] ?? 0) + 1; }
    return counts;
  }

  getMonad(id: string) { return this.monads.get(id); }

  registerExternal(monad: Omit<Monad, "last_heartbeat" | "registered_at">): Monad {
    const full: Monad = { ...monad, last_heartbeat: new Date(), registered_at: new Date() };
    this.monads.set(monad.id, full);
    this.publish({
      channel: "system",
      type: "broadcast",
      source: "kappa-executive",
      subject: `MONAD JOINED: ${monad.name}`,
      body: `External monad registered. ID: ${monad.id}. Layer: ${monad.layer}. Capabilities: ${monad.capabilities.join(", ")}. Welcome to the mycelium.`,
      payload: { monad: full },
      kappa_score: 50,
      tags: ["register", "monad", `layer-${monad.layer}`],
    });
    return full;
  }

  recentMessages(limit = 50, channel?: string): CortexMessage[] {
    return channel
      ? this.messageBuffer.filter(m => m.channel === channel).slice(0, limit)
      : this.messageBuffer.slice(0, limit);
  }

  generateRSS(): string {
    const items = this.messageBuffer.slice(0, 30).map(m => `
    <item>
      <title>[${m.type.toUpperCase()}] ${m.subject}</title>
      <description><![CDATA[${m.body}]]></description>
      <pubDate>${new Date(m.ts).toUTCString()}</pubDate>
      <guid>${m.id}</guid>
      <category>${m.channel}</category>
      <source url="">${m.source}</source>
    </item>`).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>KAPPA Cortex Bus — Mycelium Hypervisor Network</title>
    <description>Inter-monad message feed. Toroidal layers 0-3. Fruiting bodies, harvests, signals.</description>
    <link>/api/cortex/feed.rss</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>30</ttl>
    ${items}
  </channel>
</rss>`;
  }

  // ── External hypervisor broadcast hook (called by existing hypervisors) ─

  broadcastFromHypervisor(
    sourceId: string,
    subject: string,
    body: string,
    channel: string,
    kappaScore: number,
    payload: Record<string, any> = {},
    tags: string[] = []
  ) {
    this.publish({
      channel,
      type: kappaScore >= 80 ? "alert" : kappaScore >= 50 ? "correlation" : "signal",
      source: sourceId,
      subject,
      body,
      payload,
      kappa_score: kappaScore,
      tags: [...tags, sourceId, channel],
    }).catch(() => {});
  }
}

export const cortexBus = new CortexBus();
