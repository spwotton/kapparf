/**
 * KAPPA Multi-Model Router
 * Per MODEL_SELECTION_GUIDE (Atlantis Hub · vertex 1 · May 2026)
 *
 * Priority for text synthesis/attribution:
 *   1. OpenRouter free models  — confirmed working, zero cost
 *   2. Gemini native audio     — when credits activate (native audio understanding)
 *   3. gpt-4o-mini proxy       — guaranteed fallback
 */

// ─── OPENROUTER FREE TIER ────────────────────────────────────────────────────
// Oracle-safe free models per guide. Reject list excluded (coding agents,
// perception models, audio generation, video pipelines).
const OR_FREE_MODELS = [
  "deepseek/deepseek-v4-flash:free",          // oracle-safe · mathematical/analytical · 1M ctx
  "meta-llama/llama-3.3-70b-instruct:free",   // confirmed working · general synthesis
  "nousresearch/hermes-3-llama-3.1-405b:free",// literary/hermetic synthesis (try — may activate)
];

const OR_BASE = "https://openrouter.ai/api/v1/chat/completions";
const OR_HEADERS = {
  "Content-Type": "application/json",
  "HTTP-Referer": "https://replit.com",
  "X-Title": "KAPPA Forensics",
};

let _orModel: string | null = null;
let _orLastProbe = 0;
const OR_PROBE_TTL = 3 * 60 * 1000;

async function probeOpenRouter(): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const body = JSON.stringify({
    messages: [{ role: "user", content: "Reply: OK" }],
    max_tokens: 5,
  });
  for (const model of OR_FREE_MODELS) {
    try {
      const r = await fetch(OR_BASE, {
        method: "POST",
        headers: { ...OR_HEADERS, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ ...JSON.parse(body), model }),
        signal: AbortSignal.timeout(15000),
      });
      const d: any = await r.json();
      const text = d?.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[ModelRouter] OpenRouter active: ${model}`);
        return model;
      }
    } catch { /* try next */ }
  }
  return null;
}

export async function getOpenRouterModel(): Promise<string | null> {
  const now = Date.now();
  if (_orModel && now - _orLastProbe < OR_PROBE_TTL) return _orModel;
  const m = await probeOpenRouter();
  _orModel = m;
  if (m) _orLastProbe = now;
  return m;
}

/**
 * Call OpenRouter with a text prompt. Uses the first working free model.
 */
export async function openRouterGenerate(
  prompt: string,
  opts: { maxTokens?: number; temperature?: number; system?: string } = {}
): Promise<{ text: string; model: string; provider: "openrouter-free" } | null> {
  const model = await getOpenRouterModel();
  if (!model) return null;
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const messages: any[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: prompt });

  try {
    const r = await fetch(OR_BASE, {
      method: "POST",
      headers: { ...OR_HEADERS, Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model, messages,
        max_tokens: opts.maxTokens ?? 600,
        temperature: opts.temperature ?? 0,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const d: any = await r.json();
    const text = d?.choices?.[0]?.message?.content;
    if (text) return { text, model, provider: "openrouter-free" };
    // If this model stopped working, clear cache
    const err: string = d?.error?.message ?? "";
    if (err.includes("No endpoints") || err.includes("Provider returned")) {
      _orModel = null; _orLastProbe = 0;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── GEMINI (native audio when credits active) ────────────────────────────────
export const GEMINI_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "nano-banana-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// GEM_2 first — confirmed billing account. GOOGLE_API_KEY excluded (API_KEY_SERVICE_BLOCKED).
const GEMINI_KEYS = ["GEM_2", "GEMINI_API_KEY", "GOOGLE_ALT", "GOOGLE_API_E"];

let _gemKey: string | null = null;
let _gemModel: string | null = null;
let _gemLastProbe = 0;
const GEM_PROBE_TTL = 2 * 60 * 1000;

async function probeGemini(): Promise<{ key: string; model: string } | null> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: "Reply: OK" }] }],
    generationConfig: { maxOutputTokens: 5 },
  });
  for (const keyName of GEMINI_KEYS) {
    const key = process.env[keyName];
    if (!key) continue;
    for (const model of GEMINI_MODELS) {
      try {
        const r = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok && r.status === 404) continue;
        const d: any = await r.json();
        const ok = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (ok) {
          console.log(`[ModelRouter] Gemini active: ${keyName} / ${model}`);
          return { key, model };
        }
        const err: string = d?.error?.message ?? "";
        if (err.includes("API_KEY_SERVICE_BLOCKED") || err.includes("blocked")) break;
      } catch { /* try next */ }
    }
  }
  return null;
}

export async function getGeminiClient(): Promise<{ key: string; model: string } | null> {
  const now = Date.now();
  if (_gemKey && _gemModel && now - _gemLastProbe < GEM_PROBE_TTL) {
    return { key: _gemKey, model: _gemModel };
  }
  const r = await probeGemini();
  if (r) { _gemKey = r.key; _gemModel = r.model; _gemLastProbe = now; }
  else { _gemKey = null; _gemModel = null; }
  return r;
}

export function invalidateGeminiCache() {
  _gemKey = null; _gemModel = null; _gemLastProbe = 0;
}

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export interface GeminiResult {
  text: string;
  model: string;
  provider: "gemini" | "openrouter-free" | "openai-fallback";
}

export async function geminiGenerate(
  parts: GeminiPart[],
  opts: { maxTokens?: number; temperature?: number; systemInstruction?: string } = {}
): Promise<GeminiResult | null> {
  const client = await getGeminiClient();
  if (!client) return null;
  const body: any = {
    contents: [{ parts }],
    generationConfig: { maxOutputTokens: opts.maxTokens ?? 800, temperature: opts.temperature ?? 0 },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }
  try {
    const r = await fetch(`${GEMINI_BASE}/${client.model}:generateContent?key=${client.key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    const d: any = await r.json();
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return { text, model: client.model, provider: "gemini" };
    const err: string = d?.error?.message ?? "";
    if (err.includes("depleted") || err.includes("RESOURCE_EXHAUSTED")) invalidateGeminiCache();
    return null;
  } catch { return null; }
}

/** Send actual audio bytes to Gemini — it listens to the recording directly */
export async function geminiAnalyzeAudio(
  audioBuf: Buffer, mimeType: string, prompt: string,
  opts: { maxTokens?: number; systemInstruction?: string } = {}
): Promise<GeminiResult | null> {
  return geminiGenerate(
    [{ inline_data: { mime_type: mimeType, data: audioBuf.toString("base64") } }, { text: prompt }],
    { maxTokens: opts.maxTokens ?? 1000, systemInstruction: opts.systemInstruction }
  );
}

// ─── UNIFIED STATUS ───────────────────────────────────────────────────────────
export async function geminiStatus() {
  const [orModel, gemClient] = await Promise.all([getOpenRouterModel(), getGeminiClient()]);
  return {
    openrouter: { available: !!orModel, model: orModel },
    gemini: {
      available: !!gemClient,
      model: gemClient?.model ?? null,
      keySlot: gemClient ? (GEMINI_KEYS.find(k => process.env[k] === gemClient.key) ?? null) : null,
    },
    activeProvider: orModel ? "openrouter-free" : gemClient ? "gemini" : "openai-fallback",
    allOrFreeModels: OR_FREE_MODELS,
    allGeminiModels: GEMINI_MODELS,
    keyPriority: GEMINI_KEYS.filter(k => !!process.env[k]),
  };
}
