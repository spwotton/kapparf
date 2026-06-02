/**
 * FTM HYPERVISOR — Follow the Money Entity Lattice Hypervisor
 * Background 240s cycle: score all orgs, synthesize CRITICAL/HIGH spoke reports,
 * index corpus, and post nexus dreams to Atlantis.
 *
 * DB tables created here via raw SQL (excluded from drizzle schema + migrations).
 * κ-Oracle integration via internal fetch.
 */

import { db } from "../../db";
import { sql } from "drizzle-orm";
import { ensureIdentitiesTable } from "./latticeMatcher";
import { ensureOrgsTable, scoreOrg, listOrgs } from "./orgScorer";
import { indexCorpus } from "./corpusIndexer";
import { generateSpokeReport } from "./spokeReporter";
import { parseIdentities, storeIdentity } from "./identityParser";
import { atlantisHub } from "../../atlantis-hub";
import { demodexPhase, GOS_CONSTANTS } from "./gosConstants";

const FTM_APP_ID = "ftm-hypervisor";
const FTM_APP_NAME = "FTM Entity Lattice Hypervisor";
const CYCLE_MS = parseInt(process.env.FTM_CYCLE_MS ?? "120000");  // default 120s, env-configurable

interface HypervisorStatus {
  running: boolean;
  cycles: number;
  last_cycle: string | null;
  orgs_scored: number;
  corpus_chunks: number;
  critical_count: number;
  high_count: number;
  last_error: string | null;
  demodex_phase: number;
  kappa1_crossing: boolean;
  active_spoke: number;
  atlantis_state: "connected" | "degraded" | "offline";
  goose_gap: number;
}

const status: HypervisorStatus = {
  running: false,
  cycles: 0,
  last_cycle: null,
  orgs_scored: 0,
  corpus_chunks: 0,
  critical_count: 0,
  high_count: 0,
  last_error: null,
  demodex_phase: 0,
  kappa1_crossing: false,
  active_spoke: 1,
  atlantis_state: "offline",
  goose_gap: GOS_CONSTANTS.goose_gap,
};

let cycleTimer: ReturnType<typeof setTimeout> | null = null;

async function ensureTables() {
  await ensureIdentitiesTable();
  await ensureOrgsTable();
  // ftm_edges table for the force graph (with unique constraint for ON CONFLICT dedup)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ftm_edges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      edge_type TEXT NOT NULL DEFAULT 'identity_org',
      weight REAL NOT NULL DEFAULT 1.0,
      label TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ftm_edges_from ON ftm_edges(from_id);
    CREATE INDEX IF NOT EXISTS idx_ftm_edges_to ON ftm_edges(to_id);
  `);
  // Idempotent migrations for existing tables — add metadata column and unique constraint
  try { await db.execute(sql`ALTER TABLE ftm_edges ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`); } catch { /* already exists */ }
  try { await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_ftm_edges_unique ON ftm_edges(from_id, to_id, edge_type)`); } catch { /* already exists */ }
}

async function runCycle() {
  const cycleStart = Date.now();
  console.log("[FTM] Cycle starting…");

  try {
    // Phase 1 — Index corpus
    const { indexed, skipped } = await indexCorpus();
    status.corpus_chunks = indexed + skipped;

    // Phase 2 — Score all orgs
    const orgs = await listOrgs();
    let scored = 0;
    let critical = 0;
    let high = 0;

    for (const org of orgs) {
      try {
        const result = await scoreOrg(org.id);
        if (!result) continue;
        scored++;
        if (result.tier === "CRITICAL") critical++;
        if (result.tier === "HIGH") high++;

        // Generate spoke report for every CRITICAL org each cycle; HIGH only if not yet generated
        if (result.tier === "CRITICAL") {
          await generateSpokeReport(org.id);
        } else if (result.tier === "HIGH" && !result.spoke_report) {
          await generateSpokeReport(org.id);
        }
      } catch (e: any) {
        console.warn(`[FTM] Failed to score org ${org.name}:`, e.message?.slice(0, 60));
      }
    }

    status.orgs_scored = scored;
    status.critical_count = critical;
    status.high_count = high;

    // Phase 3 — Demodex phase
    const { phaseDays, crossingKappa1 } = demodexPhase();
    status.demodex_phase = phaseDays;
    status.kappa1_crossing = crossingKappa1;

    // Phase 3.5 — Active spoke (highest-scoring org's spoke, else cycle through)
    const allOrgsForSpoke = await listOrgs();
    if (allOrgsForSpoke.length > 0) {
      const topOrg = allOrgsForSpoke.sort((a, b) => (b as any).nexus_score - (a as any).nexus_score)[0];
      status.active_spoke = (topOrg as any).spoke_id ?? ((status.cycles % 24) + 1);
    } else {
      status.active_spoke = ((status.cycles % 24) + 1);
    }

    // Phase 4 — Sync recent KAPPA signal events → identity extraction
    try {
      const since = status.last_cycle ?? new Date(Date.now() - CYCLE_MS * 2).toISOString();
      const evtRows = await db.execute(sql`
        SELECT description, source, raw_data FROM signal_events
        WHERE timestamp > ${since} AND description IS NOT NULL
        ORDER BY timestamp DESC LIMIT 100
      `);
      let newIds = 0;
      for (const r of evtRows.rows as any[]) {
        const text = [r.description, String(r.source ?? ""), String(r.raw_data ?? "")]
          .filter(Boolean).join(" ").slice(0, 5000);
        if (text.length < 15) continue;
        const identities = await parseIdentities(text, "kappa-event-sync");
        for (const ident of identities) { await storeIdentity(ident); newIds++; }
      }
      if (newIds > 0) console.log(`[FTM] Synced ${newIds} identities from ${evtRows.rows.length} KAPPA events`);
    } catch { /* signal_events may not have description column in all envs */ }

    // Phase 5 — Atlantis heartbeat
    try {
      await atlantisHub.ingest(FTM_APP_ID, {
        type: "status",
        subject: `FTM Cycle #${status.cycles + 1}: ${scored} orgs scored, ${critical} CRITICAL`,
        body: `Corpus: ${status.corpus_chunks} chunks. Demodex day ${phaseDays.toFixed(2)}/${GOS_CONSTANTS.demodex_cycle}${crossingKappa1 ? " [κ₁ CROSSING]" : ""}. Goose Gap η*=${GOS_CONSTANTS.eta_star}.`,
        payload: { critical, high, scored, corpus_chunks: status.corpus_chunks, phaseDays },
        tags: ["ftm", "lattice", "cycle"],
      });
      status.atlantis_state = "connected";
    } catch { status.atlantis_state = "degraded"; /* atlantis best-effort */ }

    status.cycles++;
    status.last_cycle = new Date().toISOString();
    status.last_error = null;
    console.log(`[FTM] Cycle complete in ${Date.now() - cycleStart}ms. ${scored} orgs, ${critical} CRITICAL.`);
  } catch (e: any) {
    status.last_error = e.message?.slice(0, 200) ?? "unknown error";
    console.error("[FTM] Cycle error:", status.last_error);
  }
}

export async function startFtmHypervisor() {
  if (status.running) return;
  status.running = true;

  // Register with Atlantis
  try {
    atlantisHub.registerExternalApp({
      id: FTM_APP_ID,
      name: FTM_APP_NAME,
      url: "/follow-the-money",
      description: "Entity Lattice Hypervisor — κ-Oracle, 24-Spoke Monster Algebra, QUASAR RF Correlation",
      category: "research",
      metadata: { gos: true, spokes: 24, vector_dims: GOS_CONSTANTS.embed_dims },
    });
  } catch { /* best-effort */ }

  await ensureTables();

  // Subscribe to Atlantis SSE events for geographic partial re-score
  atlantisHub.on("pattern", async (pattern: any) => {
    if (!status.running) return;
    const body = String(pattern?.body ?? pattern?.subject ?? "").toLowerCase();
    if (!body.includes("critical") && !body.includes("kappa") && !body.includes("ftm")) return;
    try {
      // Extract geographic window from event payload for selective rescore
      const payload = pattern?.payload ?? {};
      const geoTokens: string[] = [];
      if (payload.region) geoTokens.push(String(payload.region).toLowerCase());
      if (payload.country) geoTokens.push(String(payload.country).toLowerCase());
      if (payload.jurisdiction) geoTokens.push(String(payload.jurisdiction).toLowerCase());
      // Also scan body text for country/region names
      const geoRegex = /(?:costa rica|panama|nicaragua|colombia|caribbean|central america)/gi;
      const bodyGeo = body.match(geoRegex) ?? [];
      bodyGeo.forEach(g => geoTokens.push(g.toLowerCase()));

      const allOrgs = await listOrgs();
      // Select orgs within the geographic window; fall back to top-5 if no geo filter
      const toRescore = geoTokens.length > 0
        ? allOrgs.filter((o: any) => {
            const jx = String(o.jurisdiction ?? "").toLowerCase();
            return geoTokens.some(g => jx.includes(g) || g.includes(jx.slice(0, 5)));
          })
        : allOrgs.sort((a: any, b: any) => b.nexus_score - a.nexus_score).slice(0, 5);

      for (const org of toRescore) {
        const result = await scoreOrg((org as any).id);
        if (result?.tier === "CRITICAL") await generateSpokeReport((org as any).id);
      }
      console.log(`[FTM] Geo-window partial rescore: ${toRescore.length} orgs, tokens=[${geoTokens.join(",")}]`);
    } catch { /* partial rescore is best-effort */ }
  });

  // Run immediately then on cadence
  await runCycle();

  function schedule() {
    cycleTimer = setTimeout(async () => {
      if (!status.running) return;
      await runCycle();
      schedule();
    }, CYCLE_MS);
  }
  schedule();

  console.log(`[FTM] Hypervisor started. Cycle: ${CYCLE_MS / 1000}s. SSE: subscribed to Atlantis patterns.`);
}

export function stopFtmHypervisor() {
  status.running = false;
  if (cycleTimer) { clearTimeout(cycleTimer); cycleTimer = null; }
}

export function getFtmStatus(): HypervisorStatus {
  return { ...status };
}
