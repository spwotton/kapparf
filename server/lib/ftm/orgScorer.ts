/**
 * ORGANIZATION SCORER — Score orgs against matched identities
 * lattice_score = board*0.5 + phone*0.2 + address*0.2 + rf*0.1
 * nexus_score = logistic(lattice_score) * (1 + kappaBoost*0.1)
 * Tier thresholds: >0.7 CRITICAL, >0.5 HIGH, >0.3 MODERATE, else LOW
 * Wilson CI — if lower bound <0.5, flags INCONCLUSIVE
 * Spoke assignment: primary frequency OR embedding-based fallback
 */

import { db } from "../../db";
import { sql } from "drizzle-orm";
import { embed, cosineSim } from "./ftmAi";
import { matchQuasar } from "./quasarMatcher";
import { assignSpoke, SPOKE_TABLE, SPOKE_ANCHORS, GOS_CONSTANTS } from "./gosConstants";

export type OrgTier = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export interface ScoredOrg {
  id: string;
  name: string;
  jurisdiction: string;
  board_members: string[];
  phones: string[];
  addresses: string[];
  coords: { lat?: number; lon?: number };
  nexus_score: number;
  nexus_lower: number;
  nexus_upper: number;
  inconclusive: boolean;
  tier: OrgTier;
  spoke_id: number;
  spoke_cantor: string;
  spoke_report: string;
  rf_correlated: boolean;
  quasar_profile: object;
  kappa_boost_applied: number;
  last_scored: string;
}

/** Logistic function */
function logistic(x: number): number {
  return 1 / (1 + Math.exp(-10 * (x - 0.5)));
}

/** Wilson confidence interval */
function wilson(p: number, n: number): { lower: number; upper: number } {
  if (n <= 0) return { lower: 0, upper: 1 };
  const z = 1.96;
  const d = 1 + z * z / n;
  const c = p + z * z / (2 * n);
  const s = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n);
  return { lower: Math.max(0, (c - s) / d), upper: Math.min(1, (c + s) / d) };
}

/** Get κ-boost from oracle endpoint */
async function getKappaBoost(): Promise<number> {
  try {
    const resp = await fetch("http://localhost:" + (process.env.PORT ?? "5000") + "/api/oracle/conjunction");
    if (resp.ok) {
      const data = await resp.json() as any;
      return typeof data.kappaBoost === "number" ? data.kappaBoost : 0;
    }
  } catch { /* oracle not available */ }
  return 0;
}

/** Find spoke via embedding-based fallback (nearest spoke anchor) */
async function findSpokeByEmbedding(orgEmbedding: number[]): Promise<number> {
  let bestSpoke = 0;
  let bestSim = -Infinity;
  // Use static anchor texts already embedded conceptually
  for (const anchor of SPOKE_ANCHORS) {
    // Simple text similarity via shared keywords
    const anchorEmb = await embed(anchor.text);
    const sim = cosineSim(orgEmbedding, anchorEmb);
    if (sim > bestSim) { bestSim = sim; bestSpoke = anchor.spoke_id; }
  }
  return bestSpoke;
}

export async function ensureOrgsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ftm_organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      jurisdiction TEXT NOT NULL DEFAULT '',
      board_members JSONB DEFAULT '[]',
      phones JSONB DEFAULT '[]',
      addresses JSONB DEFAULT '[]',
      coords JSONB DEFAULT '{}',
      nexus_score REAL NOT NULL DEFAULT 0,
      nexus_lower REAL NOT NULL DEFAULT 0,
      nexus_upper REAL NOT NULL DEFAULT 1,
      inconclusive BOOLEAN NOT NULL DEFAULT true,
      tier TEXT NOT NULL DEFAULT 'LOW',
      spoke_id INTEGER NOT NULL DEFAULT 0,
      spoke_cantor TEXT NOT NULL DEFAULT 'Othala',
      spoke_report TEXT NOT NULL DEFAULT '',
      rf_correlated BOOLEAN NOT NULL DEFAULT false,
      quasar_profile JSONB DEFAULT '{}',
      kappa_boost_applied REAL NOT NULL DEFAULT 0,
      embedding JSONB,
      last_scored TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ftm_orgs_tier ON ftm_organizations(tier);
    CREATE INDEX IF NOT EXISTS idx_ftm_orgs_spoke ON ftm_organizations(spoke_id);
    CREATE INDEX IF NOT EXISTS idx_ftm_orgs_last_scored ON ftm_organizations(last_scored DESC);
  `);
}

export async function scoreOrg(orgId: string): Promise<ScoredOrg | null> {
  const rows = await db.execute(sql`
    SELECT * FROM ftm_organizations WHERE id = ${orgId}
  `);
  const org = (rows.rows as any[])[0];
  if (!org) return null;

  const boardMembers: string[] = typeof org.board_members === "string" ? JSON.parse(org.board_members) : (org.board_members ?? []);
  const phones: string[] = typeof org.phones === "string" ? JSON.parse(org.phones) : (org.phones ?? []);
  const addresses: string[] = typeof org.addresses === "string" ? JSON.parse(org.addresses) : (org.addresses ?? []);
  const coords: { lat?: number; lon?: number } = typeof org.coords === "string" ? JSON.parse(org.coords) : (org.coords ?? {});

  // Check identity overlap — include confidence + source for frequency-anchor spoke derivation
  let boardOverlap = 0, phoneOverlap = 0, addrOverlap = 0;
  const matchedIdentityIds: string[] = [];
  const identRows = await db.execute(sql`
    SELECT id, name, phones, addresses, confidence, source FROM ftm_identities LIMIT 500
  `);
  const identities = identRows.rows as any[];

  for (const ident of identities) {
    const iName = (ident.name as string).toLowerCase();
    const iPhone: string[] = typeof ident.phones === "string" ? JSON.parse(ident.phones) : (ident.phones ?? []);
    const iAddr: string[] = typeof ident.addresses === "string" ? JSON.parse(ident.addresses) : (ident.addresses ?? []);
    let matched = false;

    if (boardMembers.some(b => b.toLowerCase().includes(iName) || iName.includes(b.toLowerCase()))) { boardOverlap++; matched = true; }
    if (phones.some(p => iPhone.some(ip => ip.replace(/\D/g, "").includes(p.replace(/\D/g, "")) && p.length > 6))) { phoneOverlap++; matched = true; }
    if (addresses.some(a => iAddr.some(ia => ia.toLowerCase().includes(a.toLowerCase().slice(0, 15))))) { addrOverlap++; matched = true; }
    if (matched && ident.id) matchedIdentityIds.push(ident.id);
  }

  const totalIdents = Math.max(1, identities.length);
  const boardNorm = Math.min(1, boardOverlap / totalIdents);
  const phoneNorm = Math.min(1, phoneOverlap / totalIdents);
  const addrNorm = Math.min(1, addrOverlap / totalIdents);

  // QUASAR RF fusion
  const quasar = await matchQuasar(coords.lat ?? null, coords.lon ?? null);
  const rfHit = quasar.matched_profiles.length > 0;
  const rfBump = rfHit ? 0.1 : 0;

  // Lattice score
  const lattice = boardNorm * 0.5 + phoneNorm * 0.2 + addrNorm * 0.2 + rfBump;

  // κ-Oracle boost
  const kappaBoost = await getKappaBoost();

  // Nexus score
  const rawNexus = Math.min(0.99, logistic(lattice) * (1 + kappaBoost * 0.1));

  // Wilson CI — n = total board + phone + address matches
  const n = Math.max(1, boardOverlap + phoneOverlap + addrOverlap);
  const { lower, upper } = wilson(rawNexus, n);
  const inconclusive = lower < 0.5;

  // Tier
  let tier: OrgTier = "LOW";
  if (rawNexus > 0.7) tier = "CRITICAL";
  else if (rawNexus > 0.5) tier = "HIGH";
  else if (rawNexus > 0.3) tier = "MODERATE";

  // Spoke assignment — dominant matched identity frequency-anchor proximity via 24-spoke table
  const orgText = `${org.name} ${boardMembers.join(" ")}`;
  const orgEmb = await embed(orgText);

  // Derive primary frequency from dominant QUASAR profile hit
  let primaryFreqHz = 0;
  if (rfHit) {
    if (quasar.dsp_clock) primaryFreqHz = GOS_CONSTANTS.f_clock;          // 46.875 Hz
    else if (quasar.v2k_aps) primaryFreqHz = 18660;                        // ultrasonic carrier
    else if (quasar.matched_profiles.includes("OPTICAL_PULSE_315MS")) primaryFreqHz = 1 / 0.315; // ~3.17 Hz
  }
  // Dominant matched identity frequency anchor — use only identities matched to THIS org
  if (primaryFreqHz === 0 && matchedIdentityIds.length > 0) {
    const matchedIdents = identities.filter(i => matchedIdentityIds.includes(i.id));
    const domId = [...matchedIdents].sort((a, b) =>
      parseFloat(String(b.confidence ?? "0")) - parseFloat(String(a.confidence ?? "0"))
    )[0];
    const domSrc = String(domId?.source ?? "");
    // Extract Hz annotations from source text (e.g. "46.875Hz", "14.1Hz")
    const hzMatch = domSrc.match(/(\d+(?:\.\d+)?)\s*[Hh]z/);
    if (hzMatch) primaryFreqHz = parseFloat(hzMatch[1]);
  }

  let spokeId = 0;
  if (primaryFreqHz > 0) {
    // Log-scale proximity search through the 24-spoke acoustic_hz table
    spokeId = assignSpoke(primaryFreqHz).spoke_id;
  } else if (tier === "CRITICAL" || tier === "HIGH") {
    // Fallback: embedding-based spoke assignment
    spokeId = await findSpokeByEmbedding(orgEmb);
  }

  const spoke = SPOKE_TABLE.find(s => s.spoke_id === spokeId) ?? SPOKE_TABLE[0];

  // Persist
  await db.execute(sql`
    UPDATE ftm_organizations SET
      nexus_score = ${rawNexus},
      nexus_lower = ${lower},
      nexus_upper = ${upper},
      inconclusive = ${inconclusive},
      tier = ${tier},
      spoke_id = ${spoke.spoke_id},
      spoke_cantor = ${spoke.cantor},
      rf_correlated = ${rfHit},
      quasar_profile = ${JSON.stringify(quasar)},
      kappa_boost_applied = ${kappaBoost},
      embedding = ${JSON.stringify(orgEmb)},
      last_scored = NOW()
    WHERE id = ${orgId}
  `);

  // Persist identity↔org edges into ftm_edges (deduped by ON CONFLICT DO NOTHING)
  for (const identId of matchedIdentityIds) {
    try {
      await db.execute(sql`
        INSERT INTO ftm_edges (from_id, to_id, edge_type, weight, metadata, created_at)
        VALUES (${identId}, ${orgId}, 'identity_org_overlap', 1.0,
                ${JSON.stringify({ scored_at: new Date().toISOString(), tier, spoke_id: spoke.spoke_id })}::jsonb,
                NOW())
        ON CONFLICT (from_id, to_id, edge_type) DO UPDATE
          SET weight = ftm_edges.weight + 0.1,
              metadata = ${JSON.stringify({ scored_at: new Date().toISOString(), tier, spoke_id: spoke.spoke_id })}::jsonb
      `);
    } catch { /* edge table constraint may vary */ }
  }

  // Also persist RF correlation edge if QUASAR matched
  if (rfHit) {
    try {
      await db.execute(sql`
        INSERT INTO ftm_edges (from_id, to_id, edge_type, weight, metadata, created_at)
        VALUES (${orgId}, ${orgId}, 'rf_self_correlation', ${rawNexus},
                ${JSON.stringify({ profiles: quasar.matched_profiles, spoke_id: spoke.spoke_id })}::jsonb,
                NOW())
        ON CONFLICT (from_id, to_id, edge_type) DO UPDATE
          SET weight = ${rawNexus},
              metadata = ${JSON.stringify({ profiles: quasar.matched_profiles, spoke_id: spoke.spoke_id })}::jsonb
      `);
    } catch { /* best-effort */ }
  }

  return {
    id: orgId,
    name: org.name,
    jurisdiction: org.jurisdiction ?? "",
    board_members: boardMembers,
    phones,
    addresses,
    coords,
    nexus_score: rawNexus,
    nexus_lower: lower,
    nexus_upper: upper,
    inconclusive,
    tier,
    spoke_id: spoke.spoke_id,
    spoke_cantor: spoke.cantor,
    spoke_report: org.spoke_report ?? "",
    rf_correlated: rfHit,
    quasar_profile: quasar,
    kappa_boost_applied: kappaBoost,
    last_scored: new Date().toISOString(),
  };
}

export async function createOrg(data: {
  name: string; jurisdiction?: string;
  board_members?: string[]; phones?: string[];
  addresses?: string[]; coords?: { lat?: number; lon?: number };
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(sql`
    INSERT INTO ftm_organizations (id, name, jurisdiction, board_members, phones, addresses, coords)
    VALUES (${id}, ${data.name}, ${data.jurisdiction ?? ""}, ${JSON.stringify(data.board_members ?? [])},
      ${JSON.stringify(data.phones ?? [])}, ${JSON.stringify(data.addresses ?? [])},
      ${JSON.stringify(data.coords ?? {})})
    ON CONFLICT (name) DO NOTHING
  `);
  // Try to find id if conflict
  const rows = await db.execute(sql`SELECT id FROM ftm_organizations WHERE name = ${data.name}`);
  return (rows.rows as any[])[0]?.id ?? id;
}

export async function listOrgs(tier?: string, spoke?: number): Promise<ScoredOrg[]> {
  let q = sql`SELECT * FROM ftm_organizations`;
  if (tier) {
    q = sql`SELECT * FROM ftm_organizations WHERE tier = ${tier} ORDER BY nexus_score DESC LIMIT 200`;
  } else if (spoke !== undefined) {
    q = sql`SELECT * FROM ftm_organizations WHERE spoke_id = ${spoke} ORDER BY nexus_score DESC LIMIT 200`;
  } else {
    q = sql`SELECT * FROM ftm_organizations ORDER BY nexus_score DESC LIMIT 200`;
  }

  const rows = await db.execute(q);
  return (rows.rows as any[]).map(r => ({
    id: r.id,
    name: r.name,
    jurisdiction: r.jurisdiction ?? "",
    board_members: typeof r.board_members === "string" ? JSON.parse(r.board_members) : (r.board_members ?? []),
    phones: typeof r.phones === "string" ? JSON.parse(r.phones) : (r.phones ?? []),
    addresses: typeof r.addresses === "string" ? JSON.parse(r.addresses) : (r.addresses ?? []),
    coords: typeof r.coords === "string" ? JSON.parse(r.coords) : (r.coords ?? {}),
    nexus_score: r.nexus_score ?? 0,
    nexus_lower: r.nexus_lower ?? 0,
    nexus_upper: r.nexus_upper ?? 1,
    inconclusive: r.inconclusive ?? true,
    tier: r.tier ?? "LOW",
    spoke_id: r.spoke_id ?? 0,
    spoke_cantor: r.spoke_cantor ?? "Othala",
    spoke_report: r.spoke_report ?? "",
    rf_correlated: r.rf_correlated ?? false,
    quasar_profile: typeof r.quasar_profile === "string" ? JSON.parse(r.quasar_profile) : (r.quasar_profile ?? {}),
    kappa_boost_applied: r.kappa_boost_applied ?? 0,
    last_scored: r.last_scored ? new Date(r.last_scored).toISOString() : new Date().toISOString(),
  }));
}
