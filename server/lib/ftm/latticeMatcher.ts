/**
 * LATTICE MATCHER — Hybrid Hamming + cosine identity matching
 * confidence = 0.6*(1 - hamming/8) + 0.4*cosine_sim
 * Persists matched identities with PUA coords and embeddings.
 */

import { db } from "../../db";
import { sql } from "drizzle-orm";
import { embed, cosineSim } from "./ftmAi";
import { hammingDistance, puaCoord } from "./lfsr53";
import { GOS_CONSTANTS } from "./gosConstants";

const GOOSE_GAP = GOS_CONSTANTS.goose_gap;        // 0.01298 — below this, indistinguishable

export interface MatchResult {
  identity_id: string;
  name: string;
  confidence: number;
  hamming_dist: number;
  cosine_sim: number;
  at_goose_gap: boolean;    // confidence interval crosses the thermodynamic limit
  pua_x: number;
  pua_y: number;
  aliases: string[];
  cluster_id?: string;
}

/** Wilson 95% confidence interval for a proportion */
function wilsonInterval(p: number, n: number): { lower: number; upper: number } {
  if (n <= 0) return { lower: 0, upper: 1 };
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return {
    lower: Math.max(0, (center - spread) / denom),
    upper: Math.min(1, (center + spread) / denom),
  };
}

export async function ensureIdentitiesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ftm_identities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      aliases JSONB DEFAULT '[]',
      phones JSONB DEFAULT '[]',
      addresses JSONB DEFAULT '[]',
      jobs JSONB DEFAULT '[]',
      confidence REAL NOT NULL DEFAULT 0.5,
      source TEXT NOT NULL DEFAULT 'manual',
      spoke_id INTEGER,
      cluster_id TEXT,
      cluster_base TEXT,
      pua_x INTEGER NOT NULL DEFAULT 0,
      pua_y INTEGER NOT NULL DEFAULT 0,
      embedding JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ftm_identities_pua ON ftm_identities(pua_x, pua_y);
    CREATE INDEX IF NOT EXISTS idx_ftm_identities_cluster ON ftm_identities(cluster_id) WHERE cluster_id IS NOT NULL;
  `);
}

export async function matchIdentities(
  searchName: string,
  searchEmbedding: number[],
  limit = 10
): Promise<MatchResult[]> {
  const rows = await db.execute(sql`
    SELECT id, name, aliases, pua_x, pua_y, confidence, cluster_id, embedding
    FROM ftm_identities
    LIMIT 1000
  `);

  const results: MatchResult[] = [];

  for (const row of rows.rows as any[]) {
    const name = row.name as string;
    const embedding: number[] | null = typeof row.embedding === "string"
      ? JSON.parse(row.embedding) : row.embedding;

    const hamming = hammingDistance(name.toLowerCase(), searchName.toLowerCase());
    const cosine = embedding ? cosineSim(searchEmbedding, embedding) : 0;

    const normalizedHamming = Math.min(hamming, 8) / 8;
    const confidence = 0.6 * (1 - normalizedHamming) + 0.4 * cosine;

    // Wilson interval — use number of name components as n
    const n = Math.max(1, searchName.split(/\s+/).length);
    const interval = wilsonInterval(confidence, n);
    const atGooseGap = interval.lower < GOOSE_GAP || Math.abs(interval.upper - interval.lower) < GOOSE_GAP;

    if (confidence > 0.2 || hamming <= 8) {
      results.push({
        identity_id: row.id,
        name,
        confidence,
        hamming_dist: hamming,
        cosine_sim: cosine,
        at_goose_gap: atGooseGap,
        pua_x: row.pua_x,
        pua_y: row.pua_y,
        aliases: typeof row.aliases === "string" ? JSON.parse(row.aliases) : (row.aliases ?? []),
        cluster_id: row.cluster_id ?? undefined,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
}

/** Get all PUA grid occupancy for heatmap */
export async function getPuaHeatmap(): Promise<{ x: number; y: number; count: number }[]> {
  try {
    const rows = await db.execute(sql`
      SELECT pua_x as x, pua_y as y, COUNT(*)::int as count
      FROM ftm_identities
      GROUP BY pua_x, pua_y
    `);
    return (rows.rows as any[]).map(r => ({ x: r.x, y: r.y, count: r.count }));
  } catch { return []; }
}
