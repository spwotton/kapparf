/**
 * GOOSE GAZETTE — Field Discovery Seeds
 *
 * Manually authored articles that document real field discoveries made
 * as byproducts of KAPPA signal-intelligence operations. Each entry is
 * inserted once (idempotent by headline) and marked approved immediately.
 */

import { storage } from "./storage";

const FIELD_DISCOVERY_ARTICLES = [
  {
    headline:
      "Yigüirro Acoustic Signature Captured on Calle Naciones Unidas During SIGINT Sweep",
    subhead:
      "Two independent recording channels confirm Costa Rica's national bird with precision metrics — an incidental discovery in active intelligence collection",
    body: `CALLE NACIONES UNIDAS, SAN JOSÉ — A SIGINT sweep of Calle Naciones Unidas has produced an unexpected datum: two separate channel recordings bear the unmistakable acoustic fingerprint of the Yigüirro (Turdus grayi), Costa Rica's national bird. The discovery was not sought. It arrived embedded in ambient audio collected for electromagnetic anomaly monitoring, and the numbers behind it are precise enough to warrant independent reporting.

CHANNEL CNU_7: THE PROMINENCE FINDING

The cleaner of the two detections comes from CNU_7. At 2,175 Hz — the species' characteristic lower harmonic — spectral analysis returned a prominence ratio of 8.21. In practical terms, this measures how much the target frequency rises above its surrounding spectral neighborhood. A ratio above 4.0 is generally considered diagnostic for biological vocalizations against urban noise floors. At 8.21, the CNU_7 reading sits more than twice that threshold. The burst duration logged was 0.22 seconds, consistent with the Yigüirro's short, deliberate note structure. This is not a sustained tonal artifact from machinery or electromagnetic interference, both of which tend to produce longer, flatter profiles.

CHANNEL CNU_18: CADENCE CONFIRMATION

CNU_18 provides the temporal corroboration. Nineteen discrete bursts were logged with a mean inter-burst cadence of 1.70 seconds. The Yigüirro is a rhythmically consistent caller; its song sequences follow recognizable phrase intervals rather than the irregular timing typical of mechanical noise or radio-frequency artifact. A 19-burst run at 1.70-second spacing represents roughly 32 seconds of active vocalization — not a transient event, but a sustained behavioral display. In the field, this cadence pattern typically indicates territorial song or dawn chorus participation.

WHAT THE DATA SAYS — AND DOESN'T

The two channels together address independent dimensions of identification: CNU_7 confirms spectral character (what the sound is), while CNU_18 confirms behavioral pattern (how the sound behaves). Neither channel alone would be sufficient for a confident identification. Together, they satisfy the standard dual-criterion framework used in bioacoustic species confirmation.

What the data cannot determine: precise location within the corridor, whether this was a single individual across both recordings, or the behavioral context (territorial defense versus pair bonding versus predator alarm). These require follow-up collection with directional microphones or synchronized multi-point capture.

THE KAPPA ANGLE

The recordings were made during routine signal-intelligence sweeps of the Calle Naciones Unidas corridor — a monitoring zone selected for its electromagnetic signature, not its ornithological interest. The Yigüirro was not a target. It was found because signal collection does not discriminate by frequency domain: anything in the ambient acoustic environment enters the pipeline.

This is, in effect, passive biological monitoring as a byproduct of SIGINT operations. The platform's detection chain did not know it was looking for a bird. The signal presented itself and was recognized.

The Yigüirro is classified as Least Concern by the IUCN and is ubiquitous across Costa Rica's Central Valley urban corridors. Its presence on Calle Naciones Unidas is not surprising. Its precision capture in an intelligence collection pipeline is a different matter.

Field note filed May 23, 2026. Source channels: CNU_7, CNU_18. Acoustic parameters logged by KAPPA automated collection pipeline.`,
    tag: "WILDLIFE",
    category: "wildlife",
    authorByline: "KAPPA Field Intelligence Desk",
    sourceDescription:
      "Acoustic identification of Turdus grayi (Yigüirro) from CNU_7 and CNU_18 channel recordings captured during SIGINT sweep of Calle Naciones Unidas.",
    imgQuery: "clay-colored thrush Turdus grayi Costa Rica bird",
    templateUsed: "FIELD_DISCOVERY",
    wordCount: 542,
  },
];

export async function seedFieldDiscoveryArticles(): Promise<void> {
  try {
    const existing = await storage.getGooseArticles(500);
    const existingHeadlines = new Set(existing.map((a) => a.headline));

    for (const seed of FIELD_DISCOVERY_ARTICLES) {
      if (existingHeadlines.has(seed.headline)) {
        continue;
      }
      await storage.createGooseArticle({
        ...seed,
        publishedAt: new Date("2026-05-23T08:00:00Z"),
        sourceEventIds: [],
        approved: true,
      });
      console.log(`[GOOSE:SEED] Published field discovery: "${seed.headline.substring(0, 60)}..."`);
    }
  } catch (err) {
    console.error("[GOOSE:SEED] Failed to seed field discovery articles:", err);
  }
}
