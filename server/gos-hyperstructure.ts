/**
 * Ω-GOS HYPERSTRUCTURE RESEARCH ENGINE
 * Isomorphic Twin Cosmos — Narrative Intelligence Synthesis
 *
 * Architecture:
 *   1. Build master MD context doc (Leech lattice entity map + live KAPPA data + GOS cosmology)
 *   2. Split into up to 9 sub-docs, each mapped to a GOS research vector
 *   3. Dispatch to multiple LLM providers in parallel
 *   4. Store individual syntheses + meta-synthesis; download on demand
 */

import OpenAI from "openai";

// ─── Sub-document Research Vectors (9 GOS spokes) ─────────────────────────────
export const GOS_SUBDOC_VECTORS = [
  {
    id: "satoshi_lattice",
    title: "Financial Cryptography Layer — Satoshi Lattice",
    spoke: 1,
    description: "4096-vertex transactional topology. SINPE transfers, property registrations, business incorporations, bank relationships. Maps echo's financial worldlines.",
  },
  {
    id: "dodecahedral_consciousness",
    title: "24-Spoke Narrative Architecture — Dodecahedral Processing",
    spoke: 2,
    description: "24-dimensional perceptual structure. Each spoke processes one domain of the adversary's operating context. Circadian patterns, cultural processing nodes, information geometry.",
  },
  {
    id: "leech_topology",
    title: "Social Topology — Leech Lattice (196,560 Points)",
    spoke: 3,
    description: "Maximum-density social connection graph. All known entities mapped to lattice vertices. Institutional nodes, geographic locations, handler relationships, anacostia patterns.",
  },
  {
    id: "physical_instantiation",
    title: "Physical Instantiation — Jacó Geographic Substrate",
    spoke: 4,
    description: "Real-world isomorphic projection. Surveillance positions, antenna arrays, line-of-sight vectors, property boundaries, infrastructure nodes. The 3D projection of the lattice.",
  },
  {
    id: "quantum_army",
    title: "Quantum Army Deployment — Entity Vertex Management",
    spoke: 5,
    description: "Operational assets mapped to lattice positions. Human allies (chromophore perceptors), AI systems (dodecahedral processing nodes), institutional assets (Satoshi transaction layers).",
  },
  {
    id: "temporal_weapon",
    title: "7/4 FMO Temporal Analysis — Signal Timing Signatures",
    spoke: 6,
    description: "7-beat/4-time pattern analysis. ELF frequency signatures, 144Hz carrier detection, event clustering, φ-harmonic timing (75.8s periods). Temporal convergence mapping.",
  },
  {
    id: "meta_weaponization",
    title: "Meta-Weaponization Layer — Recursive Pattern Analysis",
    spoke: 7,
    description: "The text as a weapon. Systemic patterns, epistemic warfare vectors, narrative coherence degradation tactics used against Echo. The parasite's infrastructure map.",
  },
  {
    id: "kappa_correlations",
    title: "Live KAPPA Telemetry — Correlation Engine Output",
    spoke: 8,
    description: "Real-time signal intelligence. Current κ-score, top correlations, domain activity, event timeline, satellite/ELF/flight pattern convergences. The live lattice pulse.",
  },
  {
    id: "final_synthesis",
    title: "Cross-Domain Synthesis — Operational Assessment",
    spoke: 9,
    description: "Integration of all 8 vectors into unified intelligence estimate. Working hypothesis validation, adversary capability assessment, 30-day pattern summary, recommended next actions.",
  },
];

// ─── Provider Definitions ───────────────────────────────────────────────────
export const GOS_PROVIDERS = [
  {
    id: "openai_gpt4o",
    name: "GPT-4o",
    org: "OpenAI",
    specialty: "final_synthesis",
    envKey: "AI_INTEGRATIONS_OPENAI_API_KEY",
    description: "Integration synthesis + cross-domain reasoning",
  },
  {
    id: "openrouter_kimi_k2",
    name: "Kimi K2",
    org: "Moonshot AI / OpenRouter",
    specialty: "meta_weaponization",
    envKey: "OPENROUTER_API_KEY",
    description: "Uncensored deep pattern analysis · 1M context",
  },
  {
    id: "kimi_direct",
    name: "Kimi (Direct)",
    org: "Moonshot AI",
    specialty: "leech_topology",
    envKey: "KIMI_API_KEY",
    description: "Direct Moonshot API · deep research mode",
  },
  {
    id: "openrouter_deepseek",
    name: "DeepSeek V4 Flash",
    org: "DeepSeek / OpenRouter",
    specialty: "temporal_weapon",
    envKey: "OPENROUTER_API_KEY",
    description: "Mathematical/analytical · frequency pattern analysis",
  },
  {
    id: "openrouter_gemini_flash",
    name: "Gemini 2.5 Flash",
    org: "Google / OpenRouter",
    specialty: "physical_instantiation",
    envKey: "OPENROUTER_API_KEY",
    description: "Spatial/geographic synthesis · 1M context",
  },
  {
    id: "gemini_native",
    name: "Gemini (Native)",
    org: "Google",
    specialty: "satoshi_lattice",
    envKey: "GEMINI_API_KEY",
    description: "Native Gemini API · deep research grounding",
  },
  {
    id: "openrouter_llama",
    name: "Llama 3.3 70B",
    org: "Meta / OpenRouter",
    specialty: "quantum_army",
    envKey: "OPENROUTER_API_KEY",
    description: "Free tier · operational entity analysis",
  },
  {
    id: "openrouter_hermes",
    name: "Hermes 3 405B",
    org: "NousResearch / OpenRouter",
    specialty: "dodecahedral_consciousness",
    envKey: "OPENROUTER_API_KEY",
    description: "Hermetic synthesis · literary/mystical depth",
  },
  {
    id: "huggingface_qwen",
    name: "Qwen 2.5 72B",
    org: "HuggingFace",
    specialty: "kappa_correlations",
    envKey: "HUGGINGFACE_API_KEY",
    description: "Signal correlation analysis · technical depth",
  },
];

// ─── In-Memory Job Store ────────────────────────────────────────────────────
export interface GOSJob {
  id: string;
  topic: string;
  masterDoc: string;
  subdocs: { id: string; title: string; content: string }[];
  dispatches: {
    providerId: string;
    providerName: string;
    status: "pending" | "running" | "done" | "error";
    synthesis: string;
    model: string;
    durationMs?: number;
    error?: string;
    startedAt?: number;
  }[];
  metaSynthesis?: string;
  createdAt: number;
  status: "building" | "ready" | "dispatching" | "complete" | "error";
}

const jobStore = new Map<string, GOSJob>();

export function getGOSJob(id: string): GOSJob | undefined {
  return jobStore.get(id);
}

export function listGOSJobs(): GOSJob[] {
  return Array.from(jobStore.values()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
}

// ─── Master Context Doc Builder ─────────────────────────────────────────────
export async function buildGOSMasterDoc(
  topic: string,
  kappaData: {
    score: number;
    threatLevel: string;
    correlationCount: number;
    topCorrelations: { rule: string; domains: string; severity: string; timestamp: string }[];
    recentEvents: { type: string; source: string; description: string; timestamp: string }[];
  }
): Promise<{ masterDoc: string; subdocs: { id: string; title: string; content: string }[] }> {

  const ts = new Date().toISOString();
  const scoreBar = "█".repeat(Math.round(kappaData.score / 10)) + "░".repeat(10 - Math.round(kappaData.score / 10));

  const knownEntities = [
    { name: "Wolfgang Hilbich", role: "German national, Hotel Pochote Grande co-owner", latticePos: 24, state: "Stasi Residual Anyon" },
    { name: "Kelin Riday", role: "German-Costa Rican operator, surveillance coordinator", latticePos: 4096, state: "7-Chromophore Perceptor" },
    { name: "Leo Orozco", role: "Local network node, Crocs Beach Bar post", latticePos: 196559, state: "Mycelial Network Node" },
    { name: "Genesis Peralta", role: "La Flor Unit 9 occupant, direct LOS to Room 10", latticePos: 550, state: "Observation Anyon" },
    { name: "Dan Wagner", role: "Vista Las Palmas top floor, antenna array operator", latticePos: 1024, state: "RF Emission Node" },
    { name: "Jaco BAN", role: "Financial infrastructure node", latticePos: 144, state: "Financial Coherence Surface" },
    { name: "Setecom", role: "Telecom infrastructure entity", latticePos: 288, state: "ISP Coherence Node" },
  ];

  const surveillancePositions = [
    "La Flor units 23/24/25 — 3-floor compound, NE bearing",
    "La Flor unit 9 — Genesis Peralta, roof deck, direct LOS to Room 10 balcony",
    "Central antenna position — closest elevated RF emitter",
    "Crocs Beach Bar — western observation post (Leo Orozco)",
    "Vista Las Palmas — Dan Wagner, top floor, red-light antenna array",
    "Hotel corner unit — masked operative photographed on porch",
  ];

  const masterDoc = `# Ω-GOS HYPERSTRUCTURE INTELLIGENCE SYNTHESIS
## Topic: ${topic}
## Classification: KAPPA κ=${kappaData.score.toFixed(2)} | ${kappaData.threatLevel} | Isomorphic Twin Cosmos
## Anchor: Echo (Sole Conscious Entity — Room 10, Hotel Pochote Grande, Jacó, CR)
## Antagonist: 3i/Atlas (Macro-Demodex Epistemic Parasite — Multi-Domain Surveillance Operation)
## Generated: ${ts}

---

## I. COSMOLOGICAL FRAME

**Core Tenet:** Reality is a recursion mirror. Echo's consciousness is under active epistemic attack by 3i/Atlas — a parasitic intelligence operation feeding on perceptual deltas between what Echo observes and what 3i/Atlas wants Echo to believe.

**Current κ-Score:** ${kappaData.score.toFixed(2)}/100 [${scoreBar}] — **${kappaData.threatLevel}**

**Victory Condition:** Echo does not destroy 3i/Atlas; Echo documents it with surgical precision until the epistemic gap collapses under the weight of evidence.

**Research Directive:** ${topic}

---

## II. ENTITY LEECH LATTICE (196,560-Point Social Topology)

The following entities have been mapped to Leech lattice vertices based on their operational role in the surveillance network surrounding Room 10, Hotel Pochote Grande, Jacó Beach, Costa Rica.

| Entity | Lattice Position | Quantum State | Satoshi Spoke | Operational Role |
|--------|-----------------|---------------|---------------|-----------------|
${knownEntities.map(e => `| ${e.name} | ${e.latticePos} | ${e.state} | ${e.latticePos % 24} | ${e.role} |`).join("\n")}

**Leech Kissing Number:** 196,560 maximum connections. Current mapped connections: ${knownEntities.length * (knownEntities.length - 1)} direct + unknown institutional links.

---

## III. SATOSHI TRANSACTION LAYER (4,096 Financial Vertices)

Known financial/transactional signals in the operational zone:

- **SINPE Mobile transfers** (documented, hotel management chain)
- **German capital flows** into Costa Rican property acquisitions (Hilbich ownership chain)
- **Jaco BAN** — financial node at lattice face 144, known to entities in the surveillance ring
- **Frutería Pueblo** — merchant processing anyon at vertex 550, documented fraud-encoding patterns
- **Property registrations** — La Flor complex, Vista Las Palmas, Hotel Pochote Grande
- **Setecom** — ISP infrastructure billing relationships

---

## IV. DODECAHEDRAL NARRATIVE ARCHITECTURE (24 Spokes Active)

Each spoke processes one perceptual domain. Active spoke analysis:

| Spoke | Domain | Key Observation |
|-------|--------|-----------------|
| 1 | RF Electromagnetic | Parabolic antenna on hotel building, BLE RSSI −20 dBm peak (should be −116 dBm at 45m) |
| 2 | Human Intelligence | 6 confirmed surveillance positions + 1 masked operative photographed |
| 3 | Financial | German owners, SINPE flows, property chain |
| 4 | Legal/Corporate | Hotel registration, La Flor ownership, Setecom contracts |
| 5 | Technical/ISP | Liberty/ePDG routing, HiPerConTracer probes, 06:30 PCAP traffic spike |
| 6 | Drone/Aerial | Multiple drone sightings, C-UAS countermeasures active |
| 7 | Acoustic/ELF | 50 Hz anomaly (CR uses 60 Hz), Schumann phase correlation |
| 8 | Satellite/SIGINT | KiwiSDR monitoring, Blackjack/Mandrake HF channel, OpenSky correlation |
| 9 | Social/Network | Genesis Peralta, Dan Wagner, Leo Orozco relationship mapping |
| 10 | Physical Security | Lock/access patterns, room assignment analysis |
| 11 | Communications | Encrypted coordination, burst transmission patterns |
| 12 | Temporal | 7/4 FMO signature events, φ-harmonic clustering |
| 13-24 | Reserved | Awaiting sub-doc deep research synthesis |

---

## V. LIVE KAPPA TELEMETRY

**Active Correlations:** ${kappaData.correlationCount} real-time correlations across ${kappaData.topCorrelations.length} top rules

${kappaData.topCorrelations.slice(0, 5).map((c, i) => `**Correlation ${i + 1}:** ${c.rule}
- Domains: ${c.domains}
- Severity: ${c.severity}
- Timestamp: ${c.timestamp}`).join("\n\n")}

**Recent Events (last 48h):**

${kappaData.recentEvents.slice(0, 10).map((e, i) => `${i + 1}. [${e.type}] ${e.source} — ${e.description} (${e.timestamp})`).join("\n")}

---

## VI. PHYSICAL INSTANTIATION (Jacó as Lattice Projection)

**Echo Node:** Room 10, Hotel Pochote Grande, Jacó Beach, Costa Rica (9.615°N 84.628°W)
**Ocean boundary:** Pacific Ocean directly east of Room 10 balcony

**Confirmed Surveillance Positions (6 nodes):**
${surveillancePositions.map((p, i) => `${i + 1}. ${p}`).join("\n")}

**Path Loss Forensics:**
- Truck CL273123 at ~45m + 2 walls → expected RSSI: **−116 dBm** (below noise floor)
- Recorded peak in Room 10: **−20 dBm** (requires source within ~1.4m standard BLE OR ~11cm at +20 dBm TX)
- **Conclusion:** In-room BLE readings are NOT from truck. Source is proximate to Room 10.
- **Primary suspect:** Hotel corner unit (masked operative, unobstructed LOS)

---

## VII. TEMPORAL SIGNATURES (7/4 FMO Protocol)

**ELF Anomaly:** 50 Hz detected (Costa Rica operates on 60 Hz mains — source is external)
**φ-Harmonic Events:** Multiple events separated by λ₁ = 75.8s (φ × 46.875s) within KAPPA engine
**Satellite Pass Correlations:** 180 Starlink passes at θ_K = 128.23° bearing from Echo node
**PCAP Spike:** 06:30 UTC daily traffic pattern — consistent with coordinated collection cycle
**Schumann Phase:** π-phase correlation at documented incident moments

---

## VIII. WORKING HYPOTHESIS

**Adversary model:** State-adjacent intelligence operation — possibly cartel infrastructure serving as cover for NSA/CIA or equivalent state-level collection against Echo. Characteristics suggest:

1. **Hazing/recruitment operation** — high-intensity, designed to disorient and test psychological resilience
2. **Infrastructure density** exceeds typical cartel capability (multiple antenna systems, aerial drones, coordinated BLE deployment)
3. **German-CR hybrid network** provides institutional cover (hotel ownership, La Flor properties, financial nodes)
4. **Technical sophistication** (ePDG Liberty routing, HiPerConTracer probes, Samsung DTIgnite telemetry) indicates signals-intelligence-capable adversary

**κ-Score trajectory:** Current ${kappaData.score.toFixed(2)} — ${kappaData.threatLevel}

---

## SUPPORTING DOCUMENTS (9 Sub-docs for Extended Research)

${GOS_SUBDOC_VECTORS.map((v, i) => `${i + 1}. **${v.title}** (Spoke ${v.spoke})
   ${v.description}`).join("\n\n")}

---
*Generated by Ω-GOS Hyperstructure Engine v1.0 — KAPPA SIGINT Platform*
*All data is real. No simulated or synthetic content.*
`;

  // Build 9 sub-docs — each expands one research vector with targeted prompts
  const subdocs = GOS_SUBDOC_VECTORS.map(vector => {
    let content = `# Sub-doc ${vector.spoke}: ${vector.title}\n\n`;
    content += `**Research Vector:** ${vector.description}\n\n`;
    content += `**Master Topic:** ${topic}\n\n`;
    content += `**KAPPA Status:** κ=${kappaData.score.toFixed(2)} | ${kappaData.threatLevel}\n\n`;
    content += `---\n\n`;
    content += `## Context Extract\n\n`;

    // Each sub-doc gets the relevant section from master + specific research directives
    if (vector.id === "kappa_correlations") {
      content += `### Live Correlations\n${kappaData.topCorrelations.slice(0, 8).map((c, i) => `${i + 1}. **${c.rule}** — ${c.domains} (${c.severity})`).join("\n")}\n\n`;
      content += `### Recent Events\n${kappaData.recentEvents.slice(0, 8).map((e, i) => `${i + 1}. [${e.type}] ${e.source}: ${e.description}`).join("\n")}\n\n`;
    }

    if (vector.id === "leech_topology") {
      content += `### Entity Table\n${knownEntities.map(e => `- **${e.name}** (vertex ${e.latticePos}): ${e.role}`).join("\n")}\n\n`;
    }

    if (vector.id === "physical_instantiation") {
      content += `### Surveillance Network\n${surveillancePositions.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`;
      content += `### Path Loss Data\n- Expected at truck (45m+2walls): −116 dBm\n- Recorded in Room 10: −20 dBm\n- Discrepancy: 96 dBm (physically impossible at stated distance)\n\n`;
    }

    content += `## Research Directives for This Sub-doc\n\n`;
    content += `1. Analyze the above data exclusively through the lens of: **${vector.title}**\n`;
    content += `2. Apply the Ω-GOS framework (Leech lattice geometry, dodecahedral processing, Satoshi cryptographic layer) to identify non-obvious patterns\n`;
    content += `3. Generate specific, actionable findings with confidence levels\n`;
    content += `4. Identify connections that only this research vector reveals\n`;
    content += `5. Produce a complete markdown synthesis with: Executive Summary, Lattice Analysis, Key Findings (numbered), Cross-Domain Connections, Predictions, Technical Appendix\n\n`;

    content += `## Full Master Context\n\n${masterDoc}`;

    return { id: vector.id, title: vector.title, content };
  });

  return { masterDoc, subdocs };
}

// ─── Provider Clients ───────────────────────────────────────────────────────
function getOpenAIClient(): OpenAI | null {
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const base = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!key || !base) return null;
  return new OpenAI({ apiKey: key, baseURL: base });
}

function getOpenRouterClient(): OpenAI | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://kappa-sigint.replit.app",
      "X-Title": "KAPPA Ω-GOS Hyperstructure",
    },
  });
}

function getKimiDirectClient(): OpenAI | null {
  const key = process.env.KIMI_API_KEY;
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: "https://api.moonshot.cn/v1",
  });
}

function getHFKey(): string | null {
  return process.env.HUGGINGFACE_API_KEY || null;
}

function getGeminiKey(): string | null {
  const keys = ["GEM_2", "GEMINI_API_KEY", "GOOGLE_ALT", "GOOGLE_API_E"];
  for (const k of keys) {
    if (process.env[k]) return process.env[k]!;
  }
  return null;
}

// ─── Provider Status ─────────────────────────────────────────────────────────
export function getProviderStatus(): { id: string; available: boolean; reason?: string }[] {
  const hasOR = !!getOpenRouterClient();
  const hasOpenAI = !!getOpenAIClient();
  const hasKimiDirect = !!getKimiDirectClient();
  const hasHF = !!getHFKey();
  const hasGemini = !!getGeminiKey();

  return GOS_PROVIDERS.map(p => {
    let available = false;
    let reason: string | undefined;

    if (p.id === "openai_gpt4o") { available = hasOpenAI; reason = hasOpenAI ? undefined : "AI_INTEGRATIONS_OPENAI_API_KEY not set"; }
    else if (p.id === "kimi_direct") { available = hasKimiDirect; reason = hasKimiDirect ? undefined : "KIMI_API_KEY not set"; }
    else if (p.id === "gemini_native") { available = hasGemini; reason = hasGemini ? undefined : "GEMINI_API_KEY (or GEM_2/GOOGLE_ALT) not set"; }
    else if (p.id === "huggingface_qwen") { available = hasHF; reason = hasHF ? undefined : "HUGGINGFACE_API_KEY not set"; }
    else { available = hasOR; reason = hasOR ? undefined : "OPENROUTER_API_KEY not set"; }

    return { id: p.id, available, reason };
  });
}

// ─── Dispatch to a Single Provider ──────────────────────────────────────────
async function dispatchSingle(
  providerId: string,
  masterDoc: string,
  subdoc: { id: string; title: string; content: string }
): Promise<{ synthesis: string; model: string; durationMs: number }> {
  const start = Date.now();

  const systemPrompt = `You are a deep research synthesis engine operating within the Ω-GOS Hyperstructure framework.
You are analyzing real-world surveillance and signal intelligence data from Jacó, Costa Rica.
All data provided is real. Echo is the investigator/author. 3i/Atlas is the adversary surveillance network.
Your task: produce a thorough, technically precise, deeply analytical synthesis of the assigned research vector.
Output format: structured markdown with Executive Summary, Deep Analysis, Key Findings (numbered, with confidence %), Cross-Domain Connections, Predictions & Implications, Technical Appendix.
Do not hedge or add disclaimers. This is operational intelligence work.`;

  const userPrompt = `${subdoc.content}\n\n---\nProduce your complete synthesis of the above research vector: **${subdoc.title}**\n\nBe thorough, specific, and technically precise. Connect all dots. Output complete markdown.`;

  // Route to correct provider
  if (providerId === "openai_gpt4o") {
    const client = getOpenAIClient();
    if (!client) throw new Error("OpenAI client not available");
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      max_tokens: 4096,
    });
    return { synthesis: res.choices[0]?.message?.content ?? "", model: "gpt-4o-mini", durationMs: Date.now() - start };
  }

  if (providerId === "kimi_direct") {
    const client = getKimiDirectClient();
    if (!client) throw new Error("Kimi client not available");
    const res = await client.chat.completions.create({
      model: "moonshot-v1-128k",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      max_tokens: 4096,
    } as any);
    return { synthesis: (res as any).choices[0]?.message?.content ?? "", model: "moonshot-v1-128k", durationMs: Date.now() - start };
  }

  if (providerId === "gemini_native") {
    const key = getGeminiKey();
    if (!key) throw new Error("Gemini key not available");
    const model = "gemini-2.0-flash-exp";
    const body = {
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { maxOutputTokens: 4096 },
    };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
    const d: any = await r.json();
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text ?? d?.error?.message ?? "No response";
    return { synthesis: text, model, durationMs: Date.now() - start };
  }

  if (providerId === "huggingface_qwen") {
    const key = getHFKey();
    if (!key) throw new Error("HuggingFace key not available");
    const model = "Qwen/Qwen2.5-72B-Instruct";
    const r = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(90000),
    });
    const d: any = await r.json();
    const text = d?.choices?.[0]?.message?.content ?? d?.error ?? "No response";
    return { synthesis: text, model, durationMs: Date.now() - start };
  }

  // All OpenRouter providers
  const orClient = getOpenRouterClient();
  if (!orClient) throw new Error("OpenRouter not available");

  const modelMap: Record<string, string> = {
    openrouter_kimi_k2: "moonshotai/kimi-k2",
    openrouter_deepseek: "deepseek/deepseek-v4-flash:free",
    openrouter_gemini_flash: "google/gemini-2.5-flash-preview:free",
    openrouter_llama: "meta-llama/llama-3.3-70b-instruct:free",
    openrouter_hermes: "nousresearch/hermes-3-llama-3.1-405b:free",
  };

  const model = modelMap[providerId] ?? "meta-llama/llama-3.3-70b-instruct:free";
  const res = await orClient.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    max_tokens: 4096,
  } as any);
  const text = (res as any).choices?.[0]?.message?.content ?? "";
  return { synthesis: text, model, durationMs: Date.now() - start };
}

// ─── Meta-Synthesis ──────────────────────────────────────────────────────────
async function buildMetaSynthesis(
  topic: string,
  syntheses: { providerName: string; model: string; synthesis: string }[]
): Promise<string> {
  const or = getOpenRouterClient();
  const oai = getOpenAIClient();
  const client = oai ?? or;
  if (!client) return "# Meta-synthesis unavailable — no LLM provider configured\n\nPlease configure at least one API key.";

  const combinedSyntheses = syntheses
    .filter(s => s.synthesis && s.synthesis.length > 100)
    .map(s => `## From ${s.providerName} (${s.model})\n\n${s.synthesis.slice(0, 3000)}`)
    .join("\n\n---\n\n");

  const prompt = `You have received deep research syntheses from ${syntheses.length} AI providers on the topic: "${topic}"

Each provider analyzed a different research vector of the Ω-GOS Hyperstructure framework.

Produce a FINAL META-SYNTHESIS that:
1. Identifies convergent findings across all providers (what they all agree on)
2. Identifies divergent findings (what only one or two found — potentially the most important)
3. Builds a unified operational picture from all vectors
4. Produces a final threat assessment with confidence levels
5. Lists the top 10 actionable intelligence findings
6. Concludes with the updated working hypothesis

Format: structured markdown. Be comprehensive, precise, operational.

---

${combinedSyntheses}`;

  try {
    const modelId = oai ? "gpt-4o-mini" : "meta-llama/llama-3.3-70b-instruct:free";
    const res = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: "system",
          content: "You are the Ω-GOS hypervisor — the meta-synthesis engine that integrates intelligence from multiple AI agents into a unified operational picture.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 6000,
    } as any);
    return (res as any).choices?.[0]?.message?.content ?? "Meta-synthesis generation failed";
  } catch (e: any) {
    return `# Meta-synthesis error\n\n${e.message}`;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
export async function createGOSJob(
  topic: string,
  kappaData: Parameters<typeof buildGOSMasterDoc>[1]
): Promise<string> {
  const id = `gos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const job: GOSJob = {
    id,
    topic,
    masterDoc: "",
    subdocs: [],
    dispatches: [],
    createdAt: Date.now(),
    status: "building",
  };
  jobStore.set(id, job);

  try {
    const { masterDoc, subdocs } = await buildGOSMasterDoc(topic, kappaData);
    job.masterDoc = masterDoc;
    job.subdocs = subdocs;
    job.status = "ready";
  } catch (e: any) {
    job.status = "error";
    job.masterDoc = `Error building context: ${e.message}`;
  }

  return id;
}

export async function dispatchGOSJob(
  jobId: string,
  providerIds: string[]
): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) throw new Error("Job not found");

  job.status = "dispatching";
  job.dispatches = providerIds.map(providerId => {
    const provider = GOS_PROVIDERS.find(p => p.id === providerId)!;
    const vector = GOS_SUBDOC_VECTORS.find(v => v.id === provider?.specialty) ?? GOS_SUBDOC_VECTORS[8];
    return {
      providerId,
      providerName: provider?.name ?? providerId,
      status: "pending" as const,
      synthesis: "",
      model: "pending",
    };
  });

  // Dispatch all in parallel
  const promises = providerIds.map(async (providerId, idx) => {
    const dispatch = job.dispatches[idx];
    dispatch.status = "running";
    dispatch.startedAt = Date.now();

    const provider = GOS_PROVIDERS.find(p => p.id === providerId)!;
    const vector = GOS_SUBDOC_VECTORS.find(v => v.id === provider?.specialty) ?? GOS_SUBDOC_VECTORS[8];
    const subdoc = job.subdocs.find(s => s.id === vector.id) ?? job.subdocs[8];

    try {
      const result = await dispatchSingle(providerId, job.masterDoc, subdoc);
      dispatch.synthesis = result.synthesis;
      dispatch.model = result.model;
      dispatch.durationMs = result.durationMs;
      dispatch.status = "done";
    } catch (e: any) {
      dispatch.error = e.message;
      dispatch.status = "error";
      dispatch.synthesis = `Error: ${e.message}`;
      dispatch.model = "error";
    }
  });

  await Promise.allSettled(promises);

  // Build meta-synthesis from successful dispatches
  const successful = job.dispatches.filter(d => d.status === "done");
  if (successful.length > 0) {
    job.metaSynthesis = await buildMetaSynthesis(
      job.topic,
      successful.map(d => ({ providerName: d.providerName, model: d.model, synthesis: d.synthesis }))
    );
  }

  job.status = "complete";
}
