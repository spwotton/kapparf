/**
 * KAPPA ACOA ROUTER — Adaptive Cognitive Orchestration Architecture
 *
 * Routes LLM calls through tiered model cascades based on KAPPA score
 * and query complexity. Implements green/purple pipe architecture with
 * cascading fallback, response validation, and semantic caching via
 * Memory Cortex.
 *
 * Tiers:
 *   GREEN  (kappaScore 0–39)  : free deliberative models, fast
 *   AMBER  (kappaScore 40–69) : cheap reasoning models, medium cost
 *   PURPLE (kappaScore 70–100): full deliberative chain, high fidelity
 *
 * Cascade per tier tries each model in order, validates the response,
 * and escalates to the next tier if all models in the current tier fail.
 */

import OpenAI from "openai";
import { searchMemory, storeMemory } from "./memory-cortex";

// ── Types ────────────────────────────────────────────────────────────────────

export type ComplexityTier = "green" | "amber" | "purple";
export type QueryClass = "correlation" | "report" | "caption" | "research" | "vision" | "code";

export interface RouterCallOptions {
  tier?: ComplexityTier;
  kappaScore?: number;
  queryClass?: QueryClass;
  jsonMode?: boolean;
  maxTokens?: number;
  systemPrompt: string;
  userPrompt: string;
  cacheKey?: string;          // if set, check/store semantic cache
  cacheThreshold?: number;    // cosine similarity threshold (default 0.88)
}

export interface RouterResult {
  content: string;
  model: string;
  provider: string;
  tier: ComplexityTier;
  fromCache: boolean;
  latencyMs: number;
}

// ── Model pipeline definitions ────────────────────────────────────────────────

interface ModelSpec {
  id: string;
  provider: "openrouter" | "replit-ai";
  deliberative: boolean;  // true = reasoning model (slower, better for complex tasks)
}

const GREEN_PIPE: ModelSpec[] = [
  { id: "meta-llama/llama-3.3-8b-instruct:free",      provider: "openrouter", deliberative: false },
  { id: "google/gemma-3-12b-it:free",                 provider: "openrouter", deliberative: false },
  { id: "deepseek/deepseek-r1-0528-qwen3-8b:free",    provider: "openrouter", deliberative: true  },
  { id: "gpt-4o-mini",                                provider: "replit-ai",  deliberative: false },
];

const AMBER_PIPE: ModelSpec[] = [
  { id: "deepseek/deepseek-r1-0528-qwen3-8b:free",    provider: "openrouter", deliberative: true  },
  { id: "qwen/qwen2.5-coder-7b-instruct",             provider: "openrouter", deliberative: false },
  { id: "meta-llama/llama-4-scout",                   provider: "openrouter", deliberative: false },
  { id: "gpt-4o-mini",                                provider: "replit-ai",  deliberative: false },
];

const PURPLE_PIPE: ModelSpec[] = [
  { id: "deepseek/deepseek-r1-0528",                  provider: "openrouter", deliberative: true  },
  { id: "anthropic/claude-sonnet-4",                  provider: "openrouter", deliberative: false },
  { id: "openai/gpt-4.1",                             provider: "openrouter", deliberative: false },
  { id: "gpt-4o",                                     provider: "replit-ai",  deliberative: false },
];

const PIPE_MAP: Record<ComplexityTier, ModelSpec[]> = {
  green: GREEN_PIPE,
  amber: AMBER_PIPE,
  purple: PURPLE_PIPE,
};

const TIER_ORDER: ComplexityTier[] = ["green", "amber", "purple"];

// ── Client cache ─────────────────────────────────────────────────────────────

let _openrouterClient: OpenAI | null = null;
let _replitAiClient: OpenAI | null = null;

function getOpenRouterClient(): OpenAI | null {
  if (_openrouterClient) return _openrouterClient;
  if (process.env.OPENROUTER_API_KEY) {
    _openrouterClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://kappa.replit.app",
        "X-Title": "KAPPA SIGINT",
      },
    });
    return _openrouterClient;
  }
  return null;
}

function getReplitAiClient(): OpenAI | null {
  if (_replitAiClient) return _replitAiClient;
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    _replitAiClient = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    return _replitAiClient;
  }
  return null;
}

// ── Tier classifier ──────────────────────────────────────────────────────────

export function classifyTier(
  kappaScore: number = 0,
  queryClass: QueryClass = "correlation"
): ComplexityTier {
  // Force purple for research/vision regardless of score
  if (queryClass === "research" || queryClass === "vision") return "purple";
  // Code synthesis on amber regardless
  if (queryClass === "code") return "amber";

  if (kappaScore >= 70) return "purple";
  if (kappaScore >= 40) return "amber";
  return "green";
}

// ── Adaptive τ (cycle time) ──────────────────────────────────────────────────

const BASE_TAU_MS = 90_000;   // 90s at KAPPA = 0
const MIN_TAU_MS  = 15_000;   // 15s at KAPPA = 100

/**
 * Returns the adaptive pipeline cycle interval in milliseconds.
 * As KAPPA score rises, the cycle time compresses toward MIN_TAU_MS.
 * This implements the LNN time-constant principle: when the signal
 * field is hot, the observer must sample faster.
 */
export function adaptiveTau(kappaScore: number): number {
  const alpha = Math.max(0, Math.min(1, kappaScore / 100));
  return Math.round(BASE_TAU_MS - alpha * (BASE_TAU_MS - MIN_TAU_MS));
}

// ── Response validation ──────────────────────────────────────────────────────

function validateResponse(content: string, jsonMode: boolean): boolean {
  if (!content || content.trim().length < 10) return false;
  if (jsonMode) {
    try {
      const parsed = JSON.parse(content);
      return typeof parsed === "object" && parsed !== null;
    } catch {
      // Some models wrap JSON in markdown code fences
      const match = content.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) {
        try {
          JSON.parse(match[1]);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }
  return true;
}

function extractContent(raw: string, jsonMode: boolean): string {
  if (!jsonMode) return raw;
  // Strip markdown code fences if present
  const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
  return match ? match[1].trim() : raw;
}

// ── Semantic cache ───────────────────────────────────────────────────────────

const CACHE_CATEGORY = "llm_response_cache" as const;
const _inMemCache = new Map<string, { content: string; ts: number }>();
const INMEM_TTL_MS = 5 * 60 * 1000; // 5 min in-memory TTL

async function cacheGet(
  cacheKey: string,
  threshold: number
): Promise<string | null> {
  // In-memory first
  const mem = _inMemCache.get(cacheKey);
  if (mem && Date.now() - mem.ts < INMEM_TTL_MS) return mem.content;

  // Vector search in Memory Cortex
  try {
    const results = await searchMemory(cacheKey, { limit: 1, threshold });
    if (results.length > 0 && results[0].content) {
      return results[0].content;
    }
  } catch {
    // Memory Cortex unavailable — proceed without cache
  }
  return null;
}

async function cacheSet(cacheKey: string, content: string): Promise<void> {
  _inMemCache.set(cacheKey, { content, ts: Date.now() });
  try {
    await storeMemory(
      CACHE_CATEGORY as any,
      cacheKey.slice(0, 120),
      content.slice(0, 4000),
      { cached_at: new Date().toISOString() },
      "kappa-router-cache",
      0.5
    );
  } catch {
    // Store failure is non-fatal
  }
}

// ── Core router ──────────────────────────────────────────────────────────────

export async function routeCall(opts: RouterCallOptions): Promise<RouterResult> {
  const startMs = Date.now();
  const tier = opts.tier ?? classifyTier(opts.kappaScore ?? 0, opts.queryClass ?? "correlation");
  const cacheThreshold = opts.cacheThreshold ?? 0.88;

  // Semantic cache check
  if (opts.cacheKey) {
    const cached = await cacheGet(opts.cacheKey, cacheThreshold);
    if (cached) {
      return {
        content: cached,
        model: "cache",
        provider: "memory-cortex",
        tier,
        fromCache: true,
        latencyMs: Date.now() - startMs,
      };
    }
  }

  const messages = [
    { role: "system" as const, content: opts.systemPrompt },
    { role: "user" as const, content: opts.userPrompt },
  ];

  // Try from the classified tier upward
  const tierIndex = TIER_ORDER.indexOf(tier);
  for (let t = tierIndex; t < TIER_ORDER.length; t++) {
    const currentTier = TIER_ORDER[t];
    const pipe = PIPE_MAP[currentTier];

    for (const modelSpec of pipe) {
      const client = modelSpec.provider === "openrouter"
        ? getOpenRouterClient()
        : getReplitAiClient();

      if (!client) continue;

      try {
        const payload: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
          model: modelSpec.id,
          messages,
          max_tokens: opts.maxTokens ?? 2048,
          ...(opts.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
        };

        const resp = await client.chat.completions.create(payload);
        const raw = resp.choices[0]?.message?.content ?? "";

        if (!validateResponse(raw, opts.jsonMode ?? false)) {
          console.warn(`[kappa-router] ${modelSpec.id} returned invalid response, escalating`);
          continue;
        }

        const content = extractContent(raw, opts.jsonMode ?? false);

        if (opts.cacheKey) {
          cacheSet(opts.cacheKey, content).catch(() => {});
        }

        return {
          content,
          model: modelSpec.id,
          provider: modelSpec.provider,
          tier: currentTier,
          fromCache: false,
          latencyMs: Date.now() - startMs,
        };
      } catch (err: any) {
        const code = err?.status ?? err?.statusCode ?? 0;
        const isRateOrQuota = code === 429 || code === 402 || code === 404;
        console.warn(`[kappa-router] ${modelSpec.id} failed (${code}): ${err?.message?.slice(0, 80)}`);
        if (!isRateOrQuota) {
          // Non-rate-limit error — try next model in same tier
        }
        continue;
      }
    }
  }

  // Total exhaustion — return deterministic fallback
  return {
    content: '{"error":"all providers exhausted","fallback":true}',
    model: "heuristic",
    provider: "none",
    tier,
    fromCache: false,
    latencyMs: Date.now() - startMs,
  };
}

// ── Triadic Observer/Critic/Synthesizer ──────────────────────────────────────

export interface TriadicResult {
  observation: string;    // what the Observer detected (patterns)
  critique: string;       // what the Critic challenged (alternatives)
  synthesis: string;      // final reconciled output
  model_obs: string;
  model_crit: string;
  model_synth: string;
}

/**
 * Three-pass triadic analysis inspired by the Observer/Critic/Synthesizer
 * triad from the Ω-Aesthetic Codex. Three cheap green-pipe calls produce
 * higher-fidelity intelligence than one expensive single-pass call.
 *
 * Observer  (ψ = +0.5): detects patterns, confirms signal
 * Critic    (ψ = −0.5): attacks the explanation with alternates
 * Synthesizer (ψ = 0): reconciles both into final assessment
 */
export async function triadicAnalysis(
  subject: string,
  subjectData: string,
  kappaScore: number = 0
): Promise<TriadicResult> {
  const greenTier = classifyTier(kappaScore, "correlation");
  // Synthesizer always gets at least amber — it has to reconcile
  const synthTier: ComplexityTier = kappaScore >= 70 ? "purple" : "amber";

  const [obsResult, critResult] = await Promise.all([
    routeCall({
      tier: greenTier,
      systemPrompt: `You are the Observer in a triadic SIGINT analysis.
Your role (ψ = +0.5): detect patterns, confirm correlations, identify what the signal IS.
Be precise, affirmative, enumerate what you observe. Return 3-5 concise analytical sentences.`,
      userPrompt: `Subject: ${subject}\n\nData:\n${subjectData}`,
      maxTokens: 400,
    }),
    routeCall({
      tier: greenTier,
      systemPrompt: `You are the Critic in a triadic SIGINT analysis.
Your role (ψ = −0.5): challenge the obvious interpretation. What alternative explanations exist?
What could falsify the correlation? What benign explanations are being overlooked?
Return 3-5 concise adversarial sentences.`,
      userPrompt: `Subject: ${subject}\n\nData:\n${subjectData}`,
      maxTokens: 400,
    }),
  ]);

  const synthResult = await routeCall({
    tier: synthTier,
    systemPrompt: `You are the Synthesizer in a triadic SIGINT analysis.
Your role (ψ = 0): reconcile the Observer and Critic into a final, calibrated intelligence assessment.
Weigh evidence, assign confidence, produce actionable conclusions.
Return a JSON object: {"significance":"string","explanation":"string","confidence":0-1,"recommendedActions":["string"],"patternType":"string"}`,
    userPrompt: `Subject: ${subject}

OBSERVER said:
${obsResult.content}

CRITIC said:
${critResult.content}

Synthesize into a final calibrated assessment.`,
    jsonMode: true,
    maxTokens: 600,
  });

  return {
    observation: obsResult.content,
    critique: critResult.content,
    synthesis: synthResult.content,
    model_obs: obsResult.model,
    model_crit: critResult.model,
    model_synth: synthResult.model,
  };
}

// ── Router telemetry (ring buffer, no DB) ────────────────────────────────────

interface RouterEvent {
  ts: number;
  model: string;
  tier: ComplexityTier;
  fromCache: boolean;
  latencyMs: number;
  success: boolean;
}

const _telemetry: RouterEvent[] = [];
const MAX_TEL = 200;

export function logRouterEvent(e: RouterEvent): void {
  _telemetry.push(e);
  if (_telemetry.length > MAX_TEL) _telemetry.shift();
}

export function getRouterStats(): {
  total: number;
  cacheHits: number;
  byTier: Record<ComplexityTier, number>;
  avgLatencyMs: number;
  topModels: { model: string; count: number }[];
} {
  const total = _telemetry.length;
  const cacheHits = _telemetry.filter(e => e.fromCache).length;
  const byTier: Record<ComplexityTier, number> = { green: 0, amber: 0, purple: 0 };
  const modelCounts: Record<string, number> = {};
  let totalLatency = 0;

  for (const e of _telemetry) {
    byTier[e.tier]++;
    modelCounts[e.model] = (modelCounts[e.model] ?? 0) + 1;
    totalLatency += e.latencyMs;
  }

  const topModels = Object.entries(modelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([model, count]) => ({ model, count }));

  return {
    total,
    cacheHits,
    byTier,
    avgLatencyMs: total > 0 ? Math.round(totalLatency / total) : 0,
    topModels,
  };
}
