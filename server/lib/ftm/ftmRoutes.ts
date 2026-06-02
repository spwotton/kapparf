/**
 * FTM ROUTES — Follow the Money Entity Lattice Hypervisor
 * Registered via registerFtmRoutes(app) called from registerRoutes().
 * Uses static imports to avoid top-level await issues.
 */

import type { Express } from "express";
import { getFtmStatus } from "./ftmHypervisor";
import { listOrgs, createOrg, scoreOrg } from "./orgScorer";
import { parseIdentities, storeIdentity, sanitizeIngestText } from "./identityParser";
import { matchIdentities, getPuaHeatmap } from "./latticeMatcher";
import { generateSpokeReport } from "./spokeReporter";
import { getCorpusCount } from "./corpusIndexer";
import { generateCandidates } from "./lfsr53";
import { embed } from "./ftmAi";
import {
  SPOKE_TABLE, GOS_CONSTANTS as FTM_GOS, demodexPhase,
  PHOENIX_TIMELINE, currentPhoenixRecursion, RIEMANN_ZEROS_FIRST_20, RF_CLOCK_HIERARCHY,
} from "./gosConstants";
import { db } from "../../db";
import { sql } from "drizzle-orm";

const ingestHits = new Map<string, { count: number; resetAt: number }>();

function ftmRateLimit(req: any, res: any, next: any) {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  let rec = ingestHits.get(ip);
  if (!rec || rec.resetAt < now) { rec = { count: 0, resetAt: now + 60_000 }; ingestHits.set(ip, rec); }
  rec.count++;
  if (rec.count > 10) return res.status(429).json({ error: "FTM rate limit: 10 req/min" });
  next();
}

export function registerFtmRoutes(app: Express): void {

  // GET /api/ftm/status
  app.get("/api/ftm/status", (_req, res) => {
    res.json(getFtmStatus());
  });

  // GET /api/ftm/constants
  app.get("/api/ftm/constants", (_req, res) => {
    res.json({
      gos: FTM_GOS,
      spokes: SPOKE_TABLE,
      demodex: demodexPhase(),
      phoenix: { timeline: PHOENIX_TIMELINE, current: currentPhoenixRecursion() },
      riemann_zeros: RIEMANN_ZEROS_FIRST_20,
      rf_clock: RF_CLOCK_HIERARCHY,
    });
  });

  // GET /api/ftm/orgs
  app.get("/api/ftm/orgs", async (req, res) => {
    try {
      const tier = req.query.tier as string | undefined;
      const spoke = req.query.spoke !== undefined ? parseInt(req.query.spoke as string) : undefined;
      const orgs = await listOrgs(tier, spoke);
      res.json(orgs);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/ftm/orgs
  app.post("/api/ftm/orgs", async (req, res) => {
    try {
      const { name, jurisdiction, board_members, phones, addresses, coords } = req.body;
      if (!name || typeof name !== "string") return res.status(400).json({ error: "name required" });
      const id = await createOrg({
        name: name.slice(0, 200),
        jurisdiction: jurisdiction?.slice(0, 100),
        board_members: Array.isArray(board_members) ? board_members.slice(0, 50).map(String) : [],
        phones: Array.isArray(phones) ? phones.slice(0, 20).map(String) : [],
        addresses: Array.isArray(addresses) ? addresses.slice(0, 10).map(String) : [],
        coords: typeof coords === "object" ? coords : undefined,
      });
      const scored = await scoreOrg(id);
      res.json({ id, org: scored });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/ftm/orgs/:id/score
  app.post("/api/ftm/orgs/:id/score", async (req, res) => {
    try {
      const result = await scoreOrg(req.params.id);
      if (!result) return res.status(404).json({ error: "org not found" });
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/ftm/orgs/:id/spoke-report
  app.post("/api/ftm/orgs/:id/spoke-report", async (req, res) => {
    try {
      const report = await generateSpokeReport(req.params.id);
      res.json({ report });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/ftm/ingest  (rate limited)
  app.post("/api/ftm/ingest", ftmRateLimit, async (req, res) => {
    try {
      const { text, source } = req.body;
      if (!text || typeof text !== "string") return res.status(400).json({ error: "text required" });
      const clean = sanitizeIngestText(text);
      const identities = await parseIdentities(clean, source ?? "api-ingest");
      const stored: string[] = [];
      for (const ident of identities) {
        const id = await storeIdentity(ident);
        stored.push(id);
      }
      res.json({ parsed: identities.length, stored: stored.length, ids: stored });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/ftm/identities
  app.get("/api/ftm/identities", async (_req, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT id, name, aliases, phones, addresses, jobs, confidence, source,
               cluster_id, cluster_base, pua_x, pua_y, created_at
        FROM ftm_identities ORDER BY created_at DESC LIMIT 200
      `);
      const result = (rows.rows as any[]).map(r => ({
        id: r.id, name: r.name,
        aliases: typeof r.aliases === "string" ? JSON.parse(r.aliases) : (r.aliases ?? []),
        phones: typeof r.phones === "string" ? JSON.parse(r.phones) : (r.phones ?? []),
        addresses: typeof r.addresses === "string" ? JSON.parse(r.addresses) : (r.addresses ?? []),
        jobs: typeof r.jobs === "string" ? JSON.parse(r.jobs) : (r.jobs ?? []),
        confidence: r.confidence, source: r.source,
        cluster_id: r.cluster_id, cluster_base: r.cluster_base,
        pua_x: r.pua_x, pua_y: r.pua_y,
        created_at: r.created_at,
      }));
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/ftm/pua-heatmap
  app.get("/api/ftm/pua-heatmap", async (_req, res) => {
    try {
      const heatmap = await getPuaHeatmap();
      res.json(heatmap);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/ftm/match
  app.post("/api/ftm/match", ftmRateLimit, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      const emb = await embed(String(name).slice(0, 500));
      const matches = await matchIdentities(String(name), emb, 10);
      res.json(matches);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/ftm/corpus/count
  app.get("/api/ftm/corpus/count", async (_req, res) => {
    try {
      const n = await getCorpusCount();
      res.json({ count: n });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/ftm/lfsr/seed — alias for lfsr/generate (task-spec contract alias)
  app.post("/api/ftm/lfsr/seed", ftmRateLimit, async (req, res) => {
    const { seed, count = 12, g = 7, h = 11 } = req.body;
    if (!seed) return res.status(400).json({ error: "seed required" });
    const n = Math.min(50, Math.max(1, parseInt(String(count))));
    const candidates = generateCandidates(String(seed).slice(0, 200), n,
      parseInt(String(g)), parseInt(String(h)));
    return res.json({ candidates, seed, count: n, note: "alias of /api/ftm/lfsr/generate" });
  });

  // POST /api/ftm/lfsr/generate
  app.post("/api/ftm/lfsr/generate", ftmRateLimit, async (req, res) => {
    try {
      const { seed, count = 12, g = 7, h = 11 } = req.body;
      if (!seed) return res.status(400).json({ error: "seed required" });
      const n = Math.min(50, Math.max(1, parseInt(String(count))));
      const candidates = generateCandidates(
        String(seed).slice(0, 200), n,
        parseInt(String(g)), parseInt(String(h))
      );
      res.json(candidates);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/ftm/edges
  app.get("/api/ftm/edges", async (_req, res) => {
    try {
      const rows = await db.execute(sql`
        SELECT id, from_id, to_id, edge_type, weight, label FROM ftm_edges LIMIT 500
      `);
      res.json(rows.rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/ftm/graph — combined node+edge graph for force-directed visualization
  app.get("/api/ftm/graph", async (_req, res) => {
    try {
      const orgRows = await db.execute(sql`
        SELECT id, name, tier, nexus_score, spoke_id, jurisdiction, rf_correlated, kappa_boost_applied
        FROM ftm_organizations ORDER BY nexus_score DESC LIMIT 100
      `);
      const nodes: any[] = (orgRows.rows as any[]).map(r => ({
        id: r.id, type: "org", name: r.name,
        tier: r.tier, score: parseFloat(r.nexus_score ?? "0"),
        spoke_id: r.spoke_id, jurisdiction: r.jurisdiction,
        rf_correlated: r.rf_correlated === true || r.rf_correlated === "true",
        kappa_boost: parseFloat(r.kappa_boost_applied ?? "0"),
      }));

      const idRows = await db.execute(sql`
        SELECT id, name, cluster_id, confidence, source FROM ftm_identities LIMIT 200
      `);
      for (const r of idRows.rows as any[]) {
        nodes.push({
          id: r.id, type: "identity", name: r.name,
          tier: null, score: parseFloat(r.confidence ?? "0"),
          cluster_id: r.cluster_id, source: r.source,
        });
      }

      const edgeRows = await db.execute(sql`
        SELECT from_id, to_id, edge_type, weight, label FROM ftm_edges LIMIT 500
      `);
      const edges = (edgeRows.rows as any[]).map(r => ({
        from_id: r.from_id, to_id: r.to_id,
        edge_type: r.edge_type, weight: parseFloat(r.weight ?? "1"),
        label: r.label,
      }));

      // Same-spoke resonance arcs — edges between orgs sharing spoke_id
      const orgNodes = nodes.filter(n => n.type === "org");
      const spokeGroups = new Map<number, string[]>();
      for (const org of orgNodes) {
        if (!org.spoke_id) continue;
        if (!spokeGroups.has(org.spoke_id)) spokeGroups.set(org.spoke_id, []);
        spokeGroups.get(org.spoke_id)!.push(org.id);
      }
      for (const [spokeId, orgIds] of spokeGroups) {
        if (orgIds.length < 2) continue;
        for (let i = 0; i < orgIds.length - 1; i++) {
          edges.push({
            from_id: orgIds[i], to_id: orgIds[i + 1],
            edge_type: "same_spoke_resonance", weight: 0.5,
            label: `Spoke ${spokeId}`,
          });
        }
      }

      // RF event nodes — recent signal events near DSP/V2K frequency bands
      try {
        const rfRows = await db.execute(sql`
          SELECT id, frequency, latitude, longitude, source, timestamp
          FROM signal_events
          WHERE timestamp > NOW() - INTERVAL '24 hours'
            AND frequency IS NOT NULL
            AND (
              ABS(frequency - 46.875) < 0.5
              OR (frequency >= 17859 AND frequency <= 18035)
            )
          ORDER BY timestamp DESC LIMIT 20
        `);
        for (const r of rfRows.rows as any[]) {
          nodes.push({
            id: String(r.id),
            type: "rf",
            name: `RF ${parseFloat(r.frequency ?? "0").toFixed(2)} Hz`,
            tier: null,
            score: 0,
            source: r.source,
            freq_hz: parseFloat(r.frequency ?? "0"),
            lat: r.latitude ? parseFloat(r.latitude) : null,
            lon: r.longitude ? parseFloat(r.longitude) : null,
          });
        }
      } catch { /* signal_events may be unavailable */ }

      // PUA heatmap payload — org score density grid (5×5 cells, normalized)
      const heatmap: { x: number; y: number; intensity: number }[] = [];
      const gridN = 5;
      for (let gx = 0; gx < gridN; gx++) {
        for (let gy = 0; gy < gridN; gy++) {
          const orgsInCell = orgNodes.filter(o => {
            const normX = (o.spoke_id ?? 0) / 24;
            const normY = o.score;
            return normX >= gx / gridN && normX < (gx + 1) / gridN &&
                   normY >= gy / gridN && normY < (gy + 1) / gridN;
          });
          const intensity = Math.min(1, orgsInCell.reduce((s: number, o: any) => s + o.score, 0));
          if (intensity > 0) heatmap.push({ x: gx, y: gy, intensity });
        }
      }

      res.json({ nodes, edges, heatmap });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/ftm/seed — seed the lattice with known HUMINT entities
  app.post("/api/ftm/seed", async (_req, res) => {
    try {
      const seedOrgs = [
        {
          name: "Telecomunicaciones SA — SETECOM",
          jurisdiction: "CR",
          board_members: ["Alberto Fonseca Arce"],
          phones: [], addresses: ["La Guácima, Alajuela, CR"],
        },
        {
          name: "Inversiones La Guácima SRL",
          jurisdiction: "CR",
          board_members: ["Magaly Trejos Cascante"],
          phones: [], addresses: ["La Guácima, Alajuela, CR"],
        },
        {
          name: "Liberty Costa Rica S.A.",
          jurisdiction: "CR",
          board_members: [],
          phones: ["(506) 2519-8000"], addresses: ["San José, CR"],
        },
        {
          name: "CableTica S.A.",
          jurisdiction: "CR",
          board_members: [],
          phones: [], addresses: ["San José, CR"],
        },
        {
          name: "Instituto Costarricense de Electricidad — ICE",
          jurisdiction: "CR",
          board_members: [],
          phones: [], addresses: ["San José, CR"],
        },
      ];
      const results: Array<{ id: string; name: string; tier: string }> = [];
      for (const s of seedOrgs) {
        try {
          const id = await createOrg(s);
          const scored = await scoreOrg(id);
          if (scored) results.push({ id, name: s.name, tier: scored.tier });
        } catch { /* skip on duplicate key */ }
      }
      res.json({ seeded: results.length, orgs: results });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
