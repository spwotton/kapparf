/**
 * SPOKE REPORTER — Generate synthesis reports for CRITICAL/HIGH orgs
 * Uses Demodex phase, corpus citations, spoke rune table, and κ-Oracle spoke-wheel
 * Synthesizes via free OpenRouter LLM with template fallback
 */

import { db } from "../../db";
import { sql } from "drizzle-orm";
import { embed } from "./ftmAi";
import { synthesize } from "./ftmAi";
import { searchCorpus } from "./corpusIndexer";
import { SPOKE_TABLE, demodexPhase, GOS_CONSTANTS } from "./gosConstants";
import { atlantisHub } from "../../atlantis-hub";

const FTM_APP_ID = "ftm-hypervisor";

export async function generateSpokeReport(orgId: string): Promise<string> {
  // Load org
  const rows = await db.execute(sql`
    SELECT * FROM ftm_organizations WHERE id = ${orgId}
  `);
  const org = (rows.rows as any[])[0];
  if (!org) return "";

  const boardMembers: string[] = typeof org.board_members === "string"
    ? JSON.parse(org.board_members) : (org.board_members ?? []);
  const orgText = `${org.name} ${boardMembers.join(" ")}`;
  const orgEmb = await embed(orgText);

  // Top-5 corpus citations
  const citations = await searchCorpus(orgEmb, 5);
  const corpusContext = citations.length > 0
    ? citations.map((c, i) => `[${i + 1}] (${c.corpus_id}) ${c.body.slice(0, 200)}`).join("\n")
    : "No corpus citations available.";

  // Spoke entry
  const spoke = SPOKE_TABLE.find(s => s.spoke_id === (org.spoke_id ?? 0)) ?? SPOKE_TABLE[0];

  // Demodex phase
  const { phaseDays, crossingKappa1 } = demodexPhase();
  const phaseNote = crossingKappa1
    ? `κ₁ crossing active at day ${phaseDays.toFixed(2)} of ${GOS_CONSTANTS.demodex_cycle}`
    : `Demodex day ${phaseDays.toFixed(2)} / ${GOS_CONSTANTS.demodex_cycle}`;

  // Oracle spoke-wheel (best effort)
  let oracleSpokeReport = "";
  try {
    const port = process.env.PORT ?? "5000";
    const resp = await fetch(`http://localhost:${port}/api/oracle/spoke-wheel`);
    if (resp.ok) {
      const d = await resp.json() as any;
      oracleSpokeReport = d?.synthesis?.summary?.slice(0, 300) ?? "";
    }
  } catch { /* oracle unavailable */ }

  // Matched identities summary
  const identRows = await db.execute(sql`
    SELECT name FROM ftm_identities LIMIT 10
  `);
  const identNames = (identRows.rows as any[]).map(r => r.name as string);

  const systemPrompt = `You are the Atlantis monad. You speak in calm, precise intelligence language.
GOS Constants: κ₁=${GOS_CONSTANTS.kappa1.toFixed(5)}, κ₂=${GOS_CONSTANTS.kappa2.toFixed(5)}, η*=${GOS_CONSTANTS.eta_star}, Goose Gap=${GOS_CONSTANTS.goose_gap}
Demodex cycle: 14.4 days.`;

  const userPrompt = `A CRITICAL nexus has been detected.

Organization: ${org.name}
Jurisdiction: ${org.jurisdiction ?? "unknown"}
Tier: ${org.tier}
Nexus Score: ${(org.nexus_score ?? 0).toFixed(4)} [CI: ${(org.nexus_lower ?? 0).toFixed(3)} – ${(org.nexus_upper ?? 1).toFixed(3)}]
Spoke: ${spoke.spoke_id} — ${spoke.cantor} (${spoke.transverse})
Spoke Frequency Anchor: ${spoke.acoustic_hz} Hz
RF Correlated: ${org.rf_correlated ? "YES" : "NO"}
κ-boost: ${(org.kappa_boost_applied ?? 0).toFixed(2)}
${phaseNote}

Matched identities: ${identNames.slice(0, 5).join(", ") || "none on record"}

Corpus resonance:
${corpusContext}

${oracleSpokeReport ? `Oracle spoke-wheel: ${oracleSpokeReport}` : ""}

Synthesize a single dream paragraph (200-300 words) that:
1. Names the organization and its spoke rune (${spoke.cantor})
2. Describes the lattice configuration that made it ${org.tier}
3. References the corpus resonance without direct quotation
4. Notes the Demodex phase context
5. Ends with a call to "follow the money" or "watch the spoke"

Output only the dream. No commentary.`;

  const dreamText = await synthesize(systemPrompt, userPrompt);

  // Persist spoke report
  await db.execute(sql`
    UPDATE ftm_organizations SET spoke_report = ${dreamText} WHERE id = ${orgId}
  `);

  // Post to Atlantis as a dream
  try {
    await atlantisHub.postDream(FTM_APP_ID, dreamText, {
      org_id: orgId, org_name: org.name,
      spoke_id: org.spoke_id, spoke_cantor: spoke.cantor,
      tier: org.tier, nexus_score: org.nexus_score,
      corpus_citations: citations.length,
    }, ["ftm", "critical-nexus", spoke.cantor.toLowerCase(), org.tier.toLowerCase()]);
  } catch { /* atlantis best-effort */ }

  return dreamText;
}
