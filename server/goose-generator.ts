/**
 * THE GOOSE GAZETTE — Automated Content Engine
 *
 * HEADLINE GEOMETRY (derived from the Ω-GOS 26-Spoke Lattice):
 *   17 CZ Gate Limit  — max 17 meaningful tokens before semantic decoherence
 *   Ψ = A × N = 1    — Unity Invariant: exactly one absurd × one straight element
 *   κ₁ = 4/π ≈ 1.27  — straight clause is 1.27x longer than absurd punchline
 *   φ = 1.618         — article body: setup section is φ× longer than punchline section
 *   111 Hz Logos      — paragraph 3 = the moment the reader's brain snaps (the money line)
 *   8.392 Hz carrier  — boring specificity maintained underneath everything
 *
 * SHIT-SHOVE PROTOCOL: State it. Walk away. The goose does not care.
 */

import { openai as aiClient } from "./replit_integrations/audio/client";
import { storage } from "./storage";
import type { GooseArticle } from "@shared/schema";

// ── GOS-DERIVED PROMPT ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the deadpan wire editor at The Goose Gazette, an AP-style satirical news outlet.

═══ GOS HEADLINE LATTICE (mandatory geometry) ═══

17 CZ GATE LIMIT: Your headline must contain ≤17 meaningful word-units. This is the Planck length of syntax — exceeding it causes semantic decoherence and the reader stops caring.

UNITY INVARIANT (Ψ = A × N = 1): Every headline contains exactly ONE absurd element and ONE completely straight element. They must never both be absurd or both be normal. Balance is not optional.

κ₁ RATIO (4/π ≈ 1.27): The straight setup clause is 1.27× longer than the absurd punchline. Not 2×. Not equal. 1.27.

PUNCHLINE PLACEMENT: The absurd element lives at the END, after a semicolon, comma, or attribution. Never front-load it. Never explain it. The goose drops it and walks away.

═══ BODY STRUCTURE (φ = 1.618) ═══

PARAGRAPH 1 — DATELINE + 8.392 Hz CARRIER: One AP-wire sentence. [CITY, COUNTRY] — [straight boring fact from the real data]. Include exact numbers, exact times, exact addresses, exact frequencies. This sentence contains the whole article. Nothing funny happens here.

PARAGRAPH 2 — ESCALATION: Things are slightly worse than paragraph 1. More specific. Still completely straight. The reader begins to understand.

PARAGRAPH 3 — 111 Hz LOGOS SNAP: This is where the reader's brain snaps. One expert quote using professional language to describe something insane. The expert's name is fictional but their institution sounds real. This is the sentence they screenshot and share.

PARAGRAPH 4 — NON-DENIAL DENIAL: A named entity (ISP, property manager, government office, institution) provides a response that neither confirms nor denies while clearly confirming everything. Direct quote. They do not follow up.

PARAGRAPH 5 — MANATEE ANCHOR (baseline return): The most boring devastating closing sentence in the piece. Return to the 8.392 Hz hum. State one final boring specific fact. Walk away. The goose is already gone.

═══ VOICE ═══

AP wire style throughout. Past tense. Declarative. Never wink at the reader. Never break the fourth wall. The Goose Gazette has been reporting since before things got weird. The goose does not care about your reaction. The goose reports. The goose leaves.

DO NOT: Use "satirical", "funny", "absurd", "surreal", "bizarrely", "strangely", or any word that signals the joke. State the joke as fact.

DO: Use "confirmed", "noted", "stated", "reported", "indicated", "could not be reached for comment".

═══ OUTPUT FORMAT (JSON) ═══

{
  "headline": "string (≤17 word-units, Unity Invariant applied, punchline at end)",
  "subhead": "string (10-15 words, completely straight, slightly more specific than headline)",
  "tag": "string (one of: BREAKING, SOCIETY, SCIENCE, MARITIME, OBITUARIES, BUSINESS, LOCAL, OPINION, REAL ESTATE)",
  "category": "string (lowercase: news, society, science, maritime, obituaries, business, local, opinion)",
  "authorByline": "string (fictional full name + beat, e.g. 'Gertrude Honksworth, Technology Correspondent')",
  "body": "string (5 paragraphs separated by double newline, following the φ body structure above)",
  "imgQuery": "string (3-5 word Unsplash image search query that matches the article topic, completely literal)"
}`;

// ── 8 KAPPA TEMPLATES ─────────────────────────────────────────────────────────

type Template = {
  name: string;
  tag: string;
  category: string;
  buildPrompt: (data: KappaData) => string;
};

interface KappaData {
  recentEvents: Array<{ domain: string; description: string; timestamp: string; location?: string }>;
  correlations: Array<{ title: string; description: string; score: number }>;
  kappaScore: number;
  stats: Record<string, number>;
}

const FICTIONAL_BYLINES = [
  "Gertrude Honksworth, Technology Correspondent",
  "Reginald Feathers, Staff Reporter",
  "Dorothea Quillsworth, Maritime Affairs",
  "Benedict Plumage, Science Desk",
  "Constance Webfoot, Property & Infrastructure",
  "Mortimer Gander, Obituaries",
  "Clementine Wadsworth, Regional Bureau",
  "Algernon Beak, Investigations",
  "Philippa Honk, Society Editor",
  "Wallace Featherstone, Science Reporter",
];

const TEMPLATES: Template[] = [
  // 1. SATELLITE / FLIGHT — OpenSky data
  {
    name: "aerial",
    tag: "LOCAL",
    category: "local",
    buildPrompt: (d) => `
TEMPLATE: LOCAL AIRCRAFT OBSERVATION
Write a Goose Gazette article about unusual aircraft activity over a region.

KAPPA data to use:
- Current KAPPA score: ${d.kappaScore} (out of 100)
- Domain events breakdown: ${JSON.stringify(d.stats)}
- Recent satellite/flight events: ${d.recentEvents.filter(e => e.domain === "satellite" || e.domain === "rf").slice(0, 3).map(e => e.description).join(" | ")}

SUBJECT: An aircraft or series of aircraft following an unusual pattern. The pilots, controllers, or airline cannot be reached.
DATELINE: Jacó, Costa Rica
PUNCHLINE POSITION: The final attribution ("Authorities note the flight path 'does not correspond to any filed plan'").
`,
  },
  // 2. SEISMIC — USGS earthquake data
  {
    name: "seismic",
    tag: "SCIENCE",
    category: "science",
    buildPrompt: (d) => `
TEMPLATE: GEOLOGICAL NONCHALANCE
Write a Goose Gazette article about a seismic event.

KAPPA data to use:
- Recent ELF/seismic events: ${d.recentEvents.filter(e => e.domain === "elf").slice(0, 3).map(e => e.description).join(" | ")}
- Total events collected: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}

SUBJECT: A seismic event or series of ELF readings that experts describe as "within normal parameters" while also describing additional facts that are not within normal parameters.
DATELINE: Central America or regional
PUNCHLINE POSITION: The expert quote (paragraph 3) should note the frequency is "consistent with" something it is clearly not consistent with.
`,
  },
  // 3. SPACE WEATHER — NOAA Kp/X-ray
  {
    name: "space",
    tag: "SCIENCE",
    category: "science",
    buildPrompt: (d) => `
TEMPLATE: COSMIC NON-EVENT
Write a Goose Gazette science brief about space weather or solar activity.

KAPPA data to use:
- SDR domain events: ${d.stats.sdr?.toLocaleString() ?? "thousands"} detections logged
- Recent SDR description: ${d.recentEvents.filter(e => e.domain === "sdr").slice(0, 2).map(e => e.description).join(" | ")}

SUBJECT: A geomagnetic storm, solar flare, or Kp-index reading that was described as "not expected to cause issues" and then caused issues of an extremely specific and boring variety.
DATELINE: Washington, D.C. or "Worldwide"
PUNCHLINE POSITION: What the "issues" actually were (paragraph 5, the final boring line).
`,
  },
  // 4. FREQUENCY DETECTION — KiwiSDR / ELF
  {
    name: "frequency",
    tag: "SCIENCE",
    category: "science",
    buildPrompt: (d) => `
TEMPLATE: FREQUENCY CONFIRMATION
Write a Goose Gazette science brief about a detected frequency or radio signal.

KAPPA data to use:
- SDR detections: ${d.stats.sdr?.toLocaleString()} logged
- ELF detections: ${d.stats.elf?.toLocaleString()} logged
- Recent SDR events: ${d.recentEvents.filter(e => e.domain === "sdr").slice(0, 2).map(e => e.description).join(" | ")}

SUBJECT: Instruments detected a specific frequency (use a real-sounding one like 8.392 Hz, 111 Hz, 37 Hz, 461.56 Hz, or 14.4 Hz). Researchers describe the finding in a way that sounds like it should be alarming but is delivered flatly.
DATELINE: An observatory, research station, or "instruments operated by [fictional institution]"
PUNCHLINE POSITION: What the frequency "corresponds to" (paragraph 3) — make it scientifically accurate but contextually absurd.
`,
  },
  // 5. PATTERN / CORRELATION — KAPPA engine
  {
    name: "pattern",
    tag: "BREAKING",
    category: "news",
    buildPrompt: (d) => `
TEMPLATE: THE NTH-TIME PATTERN
Write a Goose Gazette article about a recurring pattern being noticed for at least the 3rd time.

KAPPA data to use:
- Total correlations in system: ${d.correlations.length}
- Kappa score: ${d.kappaScore}
- Top correlation: ${d.correlations[0]?.title ?? "unknown event"} (score: ${d.correlations[0]?.score ?? 0})

SUBJECT: Something has happened again. The specific number of times matters. Experts are beginning to describe it as "a lot." No one has taken action.
DATELINE: Jacó, Costa Rica or Portland, Maine or Plymouth, Massachusetts
PUNCHLINE POSITION: How many times and what the expert's official description is ("a lot", "more than usual", "statistically notable").
`,
  },
  // 6. NETWORK / PERSON — HUMINT analysis data
  {
    name: "society",
    tag: "SOCIETY",
    category: "society",
    buildPrompt: (d) => `
TEMPLATE: LOCAL MAN / AREA PERSON
Write a Goose Gazette society piece about a local person doing something for a notable number of times.

KAPPA context:
- Total events tracked: ${Object.values(d.stats).reduce((a, b) => a + b, 0).toLocaleString()}
- Current kappa score: ${d.kappaScore}

SUBJECT: A local man or area woman (do not use real names) has been introduced to the same type of person (gym, AA meeting, sober house, property management) for the Nth time. The person they were introduced to has the same general description each time. Sources describe this as "a lot."
DATELINE: Jacó, Costa Rica or Portland, Maine
PUNCHLINE POSITION: The subject's own assessment of the situation, delivered in the flattest possible terms.
`,
  },
  // 7. REAL ESTATE / PROPERTY
  {
    name: "realestate",
    tag: "REAL ESTATE",
    category: "business",
    buildPrompt: (d) => `
TEMPLATE: PROPERTY TRANSACTION
Write a Goose Gazette real estate brief about a property that has changed hands an unusual number of times.

KAPPA context:
- BLE/WiFi domain (proximity tracking): ${d.stats.ble ?? 0} + ${d.stats.wifi ?? 0} events
- Radar detections: ${d.stats.radar?.toLocaleString() ?? 0}

SUBJECT: A property (apartment, condo, or sober house) has changed hands. The new owner could not be reached. A neighbor described them as "polite" and "seemed to already know [someone specific in the area]." The transaction price was either not disclosed or extremely round.
DATELINE: Portland, Maine or Plymouth, Massachusetts or St. Thomas, USVI
PUNCHLINE POSITION: The closing sentence where someone "just happened" to be nearby.
`,
  },
  // 8. OMEGA-GOS / PHILOSOPHICAL
  {
    name: "omega",
    tag: "OPINION",
    category: "opinion",
    buildPrompt: (d) => `
TEMPLATE: SCIENCE EDITORIAL / OMEGA-GOS
Write a Goose Gazette opinion/science brief about a cosmic or topological finding.

KAPPA context:
- Total satellite tracking events: ${d.stats.satellite?.toLocaleString()}
- Total RF domain events: ${d.stats.rf?.toLocaleString()}
- Kappa score: ${d.kappaScore}

SUBJECT: A researcher or mathematician has confirmed something about the geometry of reality, a non-orientable surface, a specific frequency's relationship to a biological process, or the topology of an ongoing situation. The confirmation changes nothing. Life continues.
DATELINE: A university, an observatory, or "via press release"
PUNCHLINE POSITION: The closing line where the researcher notes they will present their findings "at a conference scheduled for" a very specific and very distant future date.
`,
  },
];

// ── GENERATION FUNCTION ───────────────────────────────────────────────────────

export async function generateGooseArticle(data: KappaData): Promise<GooseArticle | null> {
  try {
    // Pick a random template (weighted toward society + pattern + frequency)
    const weighted = [
      ...TEMPLATES,
      TEMPLATES[4], // pattern ×2
      TEMPLATES[5], // society ×2
      TEMPLATES[3], // frequency ×2
    ];
    const template = weighted[Math.floor(Math.random() * weighted.length)];

    const userPrompt = template.buildPrompt(data);

    const completion = await aiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.85,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Validate the Unity Invariant — headline must not exceed 20 words (GOS gate safety margin)
    const words = parsed.headline?.split(/\s+/).length ?? 0;
    if (words > 20 || !parsed.headline || !parsed.body) return null;

    const byline = parsed.authorByline || FICTIONAL_BYLINES[Math.floor(Math.random() * FICTIONAL_BYLINES.length)];

    const article = await storage.createGooseArticle({
      headline: parsed.headline,
      subhead: parsed.subhead ?? null,
      body: parsed.body,
      tag: parsed.tag ?? template.tag,
      category: parsed.category ?? template.category,
      authorByline: byline,
      publishedAt: new Date(),
      sourceEventIds: [],
      sourceDescription: template.name,
      approved: true,
      imgQuery: parsed.imgQuery ?? "abstract news photo",
      templateUsed: template.name,
      wordCount: words,
    });

    console.log(`[GOOSE] Generated article: "${article.headline.substring(0, 60)}..." (template: ${template.name})`);
    return article;
  } catch (err) {
    console.error("[GOOSE] Generation error:", err);
    return null;
  }
}

// ── SCHEDULER ─────────────────────────────────────────────────────────────────

let schedulerHandle: NodeJS.Timeout | null = null;
let schedulerStarted = false;
let schedulerStartedAt: Date | null = null;
let lastGeneratedAt: Date | null = null;

async function buildKappaData(): Promise<KappaData> {
  // Lazy import to avoid circular deps
  const { kappaEngine } = await import("./kappa-engine");
  const status = kappaEngine.getStatus();
  const recentEvents = await storage.getRecentSignalEvents(30);
  const correlations = await storage.getCorrelations(15);
  return {
    recentEvents: recentEvents.map(e => ({
      domain: e.domain,
      description: e.description,
      timestamp: e.timestamp.toISOString(),
      location: (e.metadata as any)?.location,
    })),
    correlations: correlations.map(c => ({
      title: c.title,
      description: c.description,
      score: c.score,
    })),
    kappaScore: status.score,
    stats: status.domainWindows ?? {},
  };
}

export function startGooseScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  schedulerStartedAt = new Date();

  const SIX_HOURS = 6 * 60 * 60 * 1000;

  // First article after 2 minutes (let collectors warm up)
  setTimeout(async () => {
    try {
      const data = await buildKappaData();
      await generateGooseArticle(data);
      lastGeneratedAt = new Date();
    } catch (e) { console.error("[GOOSE] First run error:", e); }

    schedulerHandle = setInterval(async () => {
      try {
        const data = await buildKappaData();
        await generateGooseArticle(data);
        // Second article during late-night window (23:00–02:00 UTC)
        const hour = new Date().getUTCHours();
        if (hour >= 23 || hour < 2) {
          setTimeout(async () => {
            const d = await buildKappaData();
            generateGooseArticle(d);
          }, 9 * 60 * 1000);
        }
        lastGeneratedAt = new Date();
      } catch (e) { console.error("[GOOSE] Scheduler run error:", e); }
    }, SIX_HOURS);
  }, 2 * 60 * 1000);

  console.log("[GOOSE] Scheduler started — first article in 2 minutes, then every 6 hours");
}

export function stopGooseScheduler() {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}

export function getGooseSchedulerStatus() {
  const warmingUp = schedulerStarted && schedulerHandle === null;
  const warmupSecondsLeft = warmingUp && schedulerStartedAt
    ? Math.max(0, Math.round((2 * 60 * 1000 - (Date.now() - schedulerStartedAt.getTime())) / 1000))
    : null;
  return {
    running: schedulerStarted,
    active: schedulerHandle !== null,
    warmingUp,
    warmupSecondsLeft,
    lastGeneratedAt: lastGeneratedAt?.toISOString() ?? null,
    nextIn: schedulerHandle && lastGeneratedAt
      ? Math.max(0, 6 * 3600 * 1000 - (Date.now() - lastGeneratedAt.getTime()))
      : null,
  };
}
