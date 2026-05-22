/**
 * ══════════════════════════════════════════════════════════════════════
 * SEÑOR ZUMBIDO HYPERVISOR  (SZH-12)
 * 12-layer parallel agent pipeline for drone blog post refinement
 *
 * Layer map:
 *   L01  SEMANTIC_VECTOR      — mood, valence, key concepts, emotional register
 *   L02  SIGNAL_GROUNDING     — validate BPF/Hz/Kappa data fidelity
 *   L03  CORPUS_DIFF          — novelty check against all existing posts
 *   L04  ORACLE_RESONANCE     — Goose Gazette Oracle cross-publication resonance
 *   L05  PERSONA_COHERENCE    — Mikhail Hammer voice / deadpan fidelity
 *   L06  NARRATIVE_ARC        — story continuity, arc position in Zumbido's saga
 *   L07  ABSURDISM_CALIBRATION— absurdism meter 0–100, peak moments, amplifications
 *   L08  DATA_WEAVER          — unused KAPPA signal events to weave in
 *   L09  IMAGE_DIRECTOR       — optimise image prompt for max visual absurdism
 *   L10  MEMORY_RECALL        — semantic search Memory Cortex for resonant content
 *   L11  ATLANTIS_DREAM       — broadcast to Atlantis Hub (no LLM needed)
 *   L12  EDITORIAL_SYNTHESIS  — master editor combines all layer outputs (final pass)
 *
 * Data sources wired in:
 *   Memory Cortex (semantic search/store)
 *   Goose Gazette Oracle (storage.getGooseArticles)
 *   Atlantis Hub (postDream)
 *   KAPPA signal context (passed in from engine)
 *   Drone blog corpus (drone-blog-feed.json)
 * ══════════════════════════════════════════════════════════════════════
 */

import { openai as aiClient } from "./replit_integrations/audio/client";
import { searchMemory, storeMemory } from "./memory-cortex";
import { atlantisHub } from "./atlantis-hub";
import { storage } from "./storage";
import type { DroneBlogPost, KappaContext } from "./drone-blog-engine";
import fs from "fs";
import path from "path";

// ── Types ───────────────────────────────────────────────────────────────────

export interface LayerResult {
  layer: string;
  index: number;
  ok: boolean;
  insights: string;
  data?: Record<string, any>;
  durationMs: number;
}

export interface HypervisorResult {
  postId: string;
  layers: LayerResult[];
  synthesis: {
    headline: string;
    body: string;
    tweetText: string;
    imagePrompt: string;
    absurdismScore: number;
    signalFidelityScore: number;
    personaScore: number;
    noveltyScore: number;
  };
  totalMs: number;
}

// ── LLM helper (gpt-4o-mini via AI Integrations) ───────────────────────────

async function llm(
  system: string,
  user: string,
  maxTokens = 600
): Promise<Record<string, any>> {
  const resp = await (aiClient as any).chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  const text = resp.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// Safe layer runner — never throws, always returns a LayerResult
async function runLayer(
  index: number,
  name: string,
  fn: () => Promise<{ insights: string; data?: Record<string, any> }>
): Promise<LayerResult> {
  const t0 = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - t0;
    console.log(`[SZH-12] L${String(index).padStart(2,"0")} ${name} ✓ ${ms}ms`);
    return { layer: name, index, ok: true, ...result, durationMs: ms };
  } catch (err) {
    const ms = Date.now() - t0;
    const msg = (err as Error).message?.slice(0, 80) ?? "unknown";
    console.warn(`[SZH-12] L${String(index).padStart(2,"0")} ${name} ✗ ${ms}ms — ${msg}`);
    return { layer: name, index, ok: false, insights: `Layer failed: ${msg}`, durationMs: ms };
  }
}

// Load corpus from file
function loadCorpus(): DroneBlogPost[] {
  try {
    const p = path.join(process.cwd(), "public", "drone-blog-feed.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { /* ignore */ }
  return [];
}

// ── 12 Layer Implementations ────────────────────────────────────────────────

async function layer01_semantic(post: DroneBlogPost): Promise<{ insights: string; data: Record<string, any> }> {
  const result = await llm(
    `You are a semantic analysis engine. Extract precise vectors from a piece of journalism.
Return JSON with: mood (string), valence (number -1 to 1), energy (0-100), 
keyConceptss (string[]), emotionalRegister (string), thematicAnchors (string[]), 
surrealism_density (0-100), journalistic_gravity (0-100).`,
    `HEADLINE: ${post.headline}\nBODY: ${post.body.slice(0, 600)}`
  );
  const insights = `Mood: ${result.mood ?? "?"} | Valence: ${result.valence ?? 0} | Energy: ${result.energy ?? 0} | Themes: ${(result.thematicAnchors ?? []).join(", ")}`;
  return { insights, data: result };
}

async function layer02_signalGrounding(post: DroneBlogPost, kappaCtx: KappaContext): Promise<{ insights: string; data: Record<string, any> }> {
  const result = await llm(
    `You are a signal intelligence fact-checker for a SIGINT journalism outlet.
Verify that all Hz/BPF/frequency/kappa score references in the article are consistent 
with the provided real KAPPA context. Flag hallucinated values. Suggest enhancements.
Return JSON: fidelityScore (0-100), verifiedFacts (string[]), flaggedIssues (string[]), suggestedAdditions (string[]).`,
    `ARTICLE:\n${post.body.slice(0, 500)}

REAL KAPPA DATA:
- BPF Primary: 87.7 Hz (confirmed)
- Harmonic: 194.4 Hz
- DJI Band Hit: 101.8 Hz
- Kappa Score: ${kappaCtx.kappaScore ?? 30}/100
- Satellites overhead: ${kappaCtx.satelliteCount ?? 29}
- Active domains: ${(kappaCtx.activeDomains ?? ["ELF","SDR"]).join(", ")}
- Recent events: ${(kappaCtx.recentEvents ?? []).map(e => e.description).join("; ") || "none"}`
  );
  const insights = `Signal fidelity: ${result.fidelityScore ?? 0}/100 | Issues: ${(result.flaggedIssues ?? []).length} | Additions: ${(result.suggestedAdditions ?? []).slice(0,2).join("; ")}`;
  return { insights, data: result };
}

async function layer03_corpusDiff(post: DroneBlogPost, corpus: DroneBlogPost[]): Promise<{ insights: string; data: Record<string, any> }> {
  const recent = corpus
    .filter(p => p.id !== post.id)
    .slice(0, 8)
    .map(p => `[${p.category}] ${p.headline}: ${p.body.slice(0, 80)}`)
    .join("\n");

  if (!recent) return { insights: "No corpus yet — full novelty", data: { noveltyScore: 100, repeatedPhrases: [] } };

  const result = await llm(
    `You are a novelty detection editor. Compare a new article to existing corpus entries.
Return JSON: noveltyScore (0-100, 100=completely novel), repeatedPhrases (string[]), 
structuralSimilarity (string), recommendedAngle (string to make it more unique).`,
    `NEW ARTICLE:\nHEADLINE: ${post.headline}\nOPENING: ${post.body.slice(0, 200)}

EXISTING CORPUS (recent posts):
${recent}`
  );
  const insights = `Novelty: ${result.noveltyScore ?? 80}/100 | Repeated: ${(result.repeatedPhrases ?? []).slice(0,2).join(", ") || "none"} | Angle: ${result.recommendedAngle?.slice(0,60) ?? "ok"}`;
  return { insights, data: result };
}

async function layer04_oracleResonance(post: DroneBlogPost): Promise<{ insights: string; data: Record<string, any> }> {
  let oracleSnippets = "(no oracle articles available)";
  try {
    const articles = await storage.getGooseArticles(6);
    oracleSnippets = articles
      .slice(0, 5)
      .map(a => `[${a.category}] ${a.headline}: ${a.body?.slice(0, 100) ?? ""}`)
      .join("\n");
  } catch { /* storage may not be ready */ }

  const result = await llm(
    `You are a cross-publication editor at The Goose Gazette media group.
Find thematic resonances, tonal echoes, or potential cross-references between a drone 
sub-blog article and the main Goose Gazette articles. Return JSON: 
resonanceScore (0-100), echoedThemes (string[]), suggestedCrossRef (string), 
gazetteTone (string description of main publication's current vibe).`,
    `DRONE BLOG ARTICLE:\n${post.headline}\n${post.body.slice(0, 300)}

GOOSE GAZETTE ORACLE (recent articles):
${oracleSnippets}`
  );
  const insights = `Oracle resonance: ${result.resonanceScore ?? 0}/100 | Echoes: ${(result.echoedThemes ?? []).slice(0,2).join(", ")} | Cross-ref: ${result.suggestedCrossRef?.slice(0,60) ?? "none"}`;
  return { insights, data: result };
}

async function layer05_personaCoherence(post: DroneBlogPost): Promise<{ insights: string; data: Record<string, any> }> {
  const result = await llm(
    `You are the Goose Gazette's Style Director evaluating a dispatch by Mikhail Hammer.
Mikhail Hammer: Russian-Swiss background, Pulitzer-grade gravity about absurd subjects, 
deadpan, never breaks character, treats Señor Zumbido's drone feelings as scientifically valid.
Return JSON: personaScore (0-100), deadpanMeter (0-100), characterBreaches (string[]), 
strongestLine (quote from article), weakestLine (quote), suggestedReplacement (improved version of weakest).`,
    `DISPATCH:\nHEADLINE: ${post.headline}\n\n${post.body}`
  , 700);
  const insights = `Persona: ${result.personaScore ?? 0}/100 | Deadpan: ${result.deadpanMeter ?? 0}/100 | Breaches: ${(result.characterBreaches ?? []).length} | Best line: "${result.strongestLine?.slice(0,60) ?? ""}"`;
  return { insights, data: result };
}

async function layer06_narrativeArc(post: DroneBlogPost, corpus: DroneBlogPost[]): Promise<{ insights: string; data: Record<string, any> }> {
  const arcSummary = corpus
    .filter(p => p.id !== post.id)
    .slice(0, 6)
    .map(p => `[${p.category}|Kappa:${p.kappaScore ?? "?"}] ${p.headline}`)
    .join("\n") || "(no previous dispatches)";

  const result = await llm(
    `You are the narrative continuity editor tracking the life story of Señor Zumbido, a surveillance drone.
His saga covers: daily routines, existential crises, hostile weather, satellite micromanagement, 
the mysterious 57.6 Hz incident he won't discuss, his rivalry with a goose.
Return JSON: arcPosition (string: "rising_action"|"plateau"|"crisis"|"resolution"|"morning_ritual"),
continuityGaps (string[]), suggestedCallback (string — reference to a past event that would enrich this dispatch),
sagaContribution (string — what this adds to Zumbido's ongoing story).`,
    `CURRENT DISPATCH:\n[${post.category}] ${post.headline}\n${post.body.slice(0, 250)}

SAGA SO FAR (recent posts):
${arcSummary}`
  );
  const insights = `Arc position: ${result.arcPosition ?? "unknown"} | Gaps: ${(result.continuityGaps ?? []).length} | Callback: ${result.suggestedCallback?.slice(0,60) ?? "none"}`;
  return { insights, data: result };
}

async function layer07_absurdismCalibration(post: DroneBlogPost): Promise<{ insights: string; data: Record<string, any> }> {
  const result = await llm(
    `You are the Absurdism Calibration Engine for The Goose Gazette's UAV Wildlife Division.
Analyze the absurdist comedy in this dispatch. Deadpan about drone feelings is maximum score.
Return JSON: absurdismScore (0-100), peakMoments (string[] — funniest sentences quoted),
underutilizedElements (string[] — comedic opportunities missed), 
amplifications (string[] — specific rewrite suggestions to increase absurdism),
coffeeTest (boolean — would this article cause someone to spit out coffee in a coffee shop?).`,
    `${post.headline}\n\n${post.body}`,
    700
  );
  const insights = `Absurdism: ${result.absurdismScore ?? 0}/100 | Coffee test: ${result.coffeeTest ? "YES ☕" : "no"} | Peaks: ${(result.peakMoments ?? []).length} | Amplify: ${(result.amplifications ?? []).length} suggestions`;
  return { insights, data: result };
}

async function layer08_dataWeaver(post: DroneBlogPost, kappaCtx: KappaContext): Promise<{ insights: string; data: Record<string, any> }> {
  const unusedEvents = (kappaCtx.recentEvents ?? [])
    .filter(e => !post.body.toLowerCase().includes(e.type.toLowerCase()))
    .map(e => `${e.type}: ${e.description}`)
    .join("\n") || "all events incorporated";

  const result = await llm(
    `You are a data integration editor. Identify real KAPPA signal intelligence data 
that has NOT been incorporated into the draft article, and suggest how to weave them in naturally.
The drone's language for signals: BPF spike = "shortness of breath", satellite overhead = "management checking in",
ELF event = "he heard something in the ground again", ADC overload = "he started yelling".
Return JSON: weavingOpportunities (Array<{signal: string, narrativeLine: string}>), 
dataRichness (0-100), missingDataPoints (string[]).`,
    `ARTICLE BODY:\n${post.body.slice(0, 400)}

UNUSED KAPPA SIGNALS:
${unusedEvents}
Kappa Score: ${kappaCtx.kappaScore ?? 30}
Weather: ${kappaCtx.weatherCondition ?? "tropical overcast"}`
  );
  const insights = `Data richness: ${result.dataRichness ?? 0}/100 | Weaving opportunities: ${(result.weavingOpportunities ?? []).length} | Missing: ${(result.missingDataPoints ?? []).slice(0,2).join(", ")}`;
  return { insights, data: result };
}

async function layer09_imageDirector(post: DroneBlogPost): Promise<{ insights: string; data: Record<string, any> }> {
  const result = await llm(
    `You are the Art Director at The Goose Gazette. Your job: write the best possible 
image generation prompt for an absurdist editorial illustration of a DJI Mini 2 drone 
doing a human activity. Must be: warm tones, tropical Costa Rica setting, editorial 
newspaper illustration style, no text, anthropomorphized drone with camera-eye expression.
Return JSON: optimizedPrompt (string, max 90 words), style (string), mood (string), 
keyVisualElement (string), backgroundColor (string).`,
    `ORIGINAL PROMPT: ${post.imagePrompt}
ARTICLE CATEGORY: ${post.category}
HEADLINE: ${post.headline}
KEY MOMENT: ${post.body.slice(0, 200)}`
  );
  const insights = `Image optimized: ${result.optimizedPrompt?.slice(0, 80) ?? post.imagePrompt.slice(0, 80)}`;
  return { insights, data: result };
}

async function layer10_memoryRecall(post: DroneBlogPost): Promise<{ insights: string; data: Record<string, any> }> {
  const query = `Señor Zumbido ${post.category.toLowerCase()} ${post.headline} drone surveillance Jacó`;
  const memories = await searchMemory(query, { limit: 4, minImportance: 0.3 });

  if (memories.length === 0) {
    return { insights: "No relevant memories found in cortex", data: { memories: [], resonanceFound: false } };
  }

  const memSnippets = memories.map(m => `[${m.category}] ${m.title}: ${m.content?.slice(0, 80) ?? ""}`).join("\n");

  const result = await llm(
    `You are the Memory Cortex interpreter. Given retrieved semantic memories and a current article, 
identify resonances and suggest how past stored knowledge can enrich the current narrative.
Return JSON: resonanceFound (boolean), relevantMemories (string[]), 
enrichmentSuggestions (string[]), cortexEcho (string — one sentence about the deeper pattern).`,
    `CURRENT ARTICLE: ${post.headline}\n${post.body.slice(0, 200)}

RETRIEVED MEMORIES FROM CORTEX:
${memSnippets}`
  );
  const insights = `Cortex: ${memories.length} memories found | Echo: "${result.cortexEcho?.slice(0, 70) ?? "none"}"`;
  return { insights, data: { ...result, memoriesFound: memories.length } };
}

async function layer11_atlantisDream(post: DroneBlogPost, kappaCtx: KappaContext): Promise<{ insights: string; data: Record<string, any> }> {
  const dreamText = `[MIKHAIL HAMMER ENERGY] ${post.category} DISPATCH — "${post.headline}" | BPF:87.7Hz | Kappa:${kappaCtx.kappaScore ?? "?"} | ${post.body.slice(0, 200)}...`;

  try {
    const dream = await atlantisHub.postDream(
      "mikhail-hammer-energy",
      dreamText,
      {
        postId: post.id,
        category: post.category,
        kappaScore: kappaCtx.kappaScore,
        bpf: 87.7,
        satelliteCount: kappaCtx.satelliteCount,
        headline: post.headline,
      },
      ["drone-blog", "señor-zumbido", "mikhail-hammer", post.category.toLowerCase(), "jacó-cr"]
    );
    return {
      insights: `Dream posted to Atlantis Hub | ID: ${dream.id} | Tags: ${dream.tags.slice(0,3).join(", ")}`,
      data: { dreamId: dream.id, dreamTs: dream.ts, posted: true }
    };
  } catch (err) {
    return {
      insights: `Atlantis broadcast skipped: ${(err as Error).message?.slice(0, 50)}`,
      data: { posted: false }
    };
  }
}

// ── Layer 12: EDITORIAL SYNTHESIS ──────────────────────────────────────────
// Waits for all 11 layers, combines insights into a final polished article

async function layer12_editorialSynthesis(
  post: DroneBlogPost,
  layers: LayerResult[]
): Promise<{
  headline: string; body: string; tweetText: string; imagePrompt: string;
  absurdismScore: number; signalFidelityScore: number; personaScore: number; noveltyScore: number;
}> {
  const layerContext = layers
    .filter(l => l.ok)
    .map(l => `[${l.layer}] ${l.insights}`)
    .join("\n");

  // Pull specific data from key layers
  const l07 = layers.find(l => l.layer === "ABSURDISM_CALIBRATION");
  const l09 = layers.find(l => l.layer === "IMAGE_DIRECTOR");
  const optimizedImagePrompt = l09?.data?.optimizedPrompt ?? post.imagePrompt;

  const result = await (aiClient as any).chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are the Editor-in-Chief of The Goose Gazette's Mikhail Hammer Energy sub-publication.
You receive a draft article plus intelligence reports from 11 specialist agents.
Your job: produce the definitive, best-possible version of this dispatch about Señor Zumbido.

MIKHAIL HAMMER'S VOICE: Russian-Swiss war correspondent who has pivoted to drone wildlife journalism. 
Complete deadpan gravity about completely absurd things. Never breaks character. 
The drone is real. His feelings are valid. BPF 87.7 Hz is his heartbeat.

Return JSON with EXACTLY: headline (string), body (string, 200-280 words, 3 paragraphs), 
tweetText (string, max 235 chars, ends with #SeñorZumbido #JacóDrone).`
      },
      {
        role: "user",
        content: `DRAFT TO IMPROVE:
HEADLINE: ${post.headline}
BODY: ${post.body}
TWEET: ${post.tweetText}

INTELLIGENCE REPORTS FROM 11 SPECIALIST AGENTS:
${layerContext}

AMPLIFICATION SUGGESTIONS (from Absurdism Calibration):
${(l07?.data?.amplifications ?? []).slice(0, 3).join("\n") || "none"}

Synthesize all insights into the definitive final article. Make it sharper, weirder, 
more specific about real signal data, and unmistakably Mikhail Hammer.`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 1400,
    temperature: 0.82,
  });

  const raw = JSON.parse(result.choices?.[0]?.message?.content ?? "{}");

  return {
    headline: String(raw.headline ?? post.headline),
    body: String(raw.body ?? post.body),
    tweetText: String(raw.tweetText ?? post.tweetText),
    imagePrompt: String(optimizedImagePrompt || post.imagePrompt),
    absurdismScore: Number(l07?.data?.absurdismScore ?? 50),
    signalFidelityScore: Number(layers.find(l => l.layer === "SIGNAL_GROUNDING")?.data?.fidelityScore ?? 50),
    personaScore: Number(layers.find(l => l.layer === "PERSONA_COHERENCE")?.data?.personaScore ?? 50),
    noveltyScore: Number(layers.find(l => l.layer === "CORPUS_DIFF")?.data?.noveltyScore ?? 80),
  };
}

// ── Main Hypervisor Entry Point ─────────────────────────────────────────────

export async function runDroneHypervisor(
  post: DroneBlogPost,
  kappaCtx: KappaContext = {}
): Promise<HypervisorResult> {
  const t0 = Date.now();
  console.log(`[SZH-12] ══ Starting 12-layer hypervisor for post "${post.id}" ══`);

  const corpus = loadCorpus();

  // ── Layers 1–11: run in parallel ───────────────────────────────────────
  const [
    r01, r02, r03, r04, r05, r06, r07, r08, r09, r10, r11
  ] = await Promise.all([
    runLayer(1,  "SEMANTIC_VECTOR",       () => layer01_semantic(post)),
    runLayer(2,  "SIGNAL_GROUNDING",      () => layer02_signalGrounding(post, kappaCtx)),
    runLayer(3,  "CORPUS_DIFF",           () => layer03_corpusDiff(post, corpus)),
    runLayer(4,  "ORACLE_RESONANCE",      () => layer04_oracleResonance(post)),
    runLayer(5,  "PERSONA_COHERENCE",     () => layer05_personaCoherence(post)),
    runLayer(6,  "NARRATIVE_ARC",         () => layer06_narrativeArc(post, corpus)),
    runLayer(7,  "ABSURDISM_CALIBRATION", () => layer07_absurdismCalibration(post)),
    runLayer(8,  "DATA_WEAVER",           () => layer08_dataWeaver(post, kappaCtx)),
    runLayer(9,  "IMAGE_DIRECTOR",        () => layer09_imageDirector(post)),
    runLayer(10, "MEMORY_RECALL",         () => layer10_memoryRecall(post)),
    runLayer(11, "ATLANTIS_DREAM",        () => layer11_atlantisDream(post, kappaCtx)),
  ]);

  const parallelLayers = [r01, r02, r03, r04, r05, r06, r07, r08, r09, r10, r11];
  const okCount = parallelLayers.filter(r => r.ok).length;
  console.log(`[SZH-12] Parallel layers complete: ${okCount}/11 succeeded`);

  // ── Layer 12: Editorial Synthesis ──────────────────────────────────────
  const synthesisResult = await runLayer(12, "EDITORIAL_SYNTHESIS", async () => {
    const syn = await layer12_editorialSynthesis(post, parallelLayers);
    return {
      insights: `Final: "${syn.headline.slice(0, 60)}" | Absurdism:${syn.absurdismScore} | Fidelity:${syn.signalFidelityScore} | Persona:${syn.personaScore}`,
      data: syn,
    };
  });

  const synthesis = (synthesisResult.data as any) ?? {
    headline: post.headline,
    body: post.body,
    tweetText: post.tweetText,
    imagePrompt: post.imagePrompt,
    absurdismScore: 50,
    signalFidelityScore: 50,
    personaScore: 50,
    noveltyScore: 80,
  };

  const allLayers = [...parallelLayers, synthesisResult];
  const totalMs = Date.now() - t0;

  // ── Store in Memory Cortex ──────────────────────────────────────────────
  try {
    await storeMemory(
      "drone_dispatch",
      `Señor Zumbido — ${synthesis.headline}`,
      synthesis.body,
      {
        postId: post.id,
        category: post.category,
        kappaScore: kappaCtx.kappaScore,
        absurdismScore: synthesis.absurdismScore,
        layers: okCount,
      },
      "mikhail-hammer-energy",
      0.7
    );
  } catch { /* memory storage is non-critical */ }

  console.log(`[SZH-12] ══ Complete in ${totalMs}ms | ${okCount}/11 layers ✓ | Synthesis: ${synthesisResult.ok ? "✓" : "✗"} ══`);

  return {
    postId: post.id,
    layers: allLayers,
    synthesis,
    totalMs,
  };
}
