/**
 * KAPPA Gemini Router
 * Priority: GEM_2 first (confirmed billing account), then other keys.
 * Probes models in order — caches winner. Instant switchover when credits activate.
 */

// Priority order — newest/best first, then reliable fallbacks
export const GEMINI_MODELS = [
  "gemini-2.5-flash-preview-05-20",  // latest 2.5 flash preview
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  // Experimental / named variants
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "nano-banana-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Key priority — GEM_2 first (confirmed billing), then others.
// GOOGLE_API_KEY is excluded: API_KEY_SERVICE_BLOCKED on project 527218426604 (different project, API not enabled)
const GEMINI_KEYS = ["GEM_2", "GEMINI_API_KEY", "GOOGLE_ALT", "GOOGLE_API_E"];

let _cachedKey: string | null = null;
let _cachedModel: string | null = null;
let _lastProbe = 0;
// Short TTL — re-probe every 2 min so we catch the moment credits top up
const PROBE_TTL = 2 * 60 * 1000;

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string }; // base64 audio/image
}

export interface GeminiResult {
  text: string;
  model: string;
  provider: "gemini" | "openai-fallback";
}

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
        if (!r.ok && r.status === 404) continue; // model not found for this key, try next model
        const d: any = await r.json();
        const ok = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (ok) {
          console.log(`[GeminiRouter] ✓ Active: ${keyName} / ${model}`);
          return { key, model };
        }
        const errMsg: string = d?.error?.message ?? "";
        // If blocked entirely (API not enabled), skip all models for this key
        if (errMsg.includes("API_KEY_SERVICE_BLOCKED") || errMsg.includes("blocked")) break;
        // Depleted = try next model (maybe a lite/legacy model has free quota)
        // Not found = try next model
      } catch { /* network error, try next */ }
    }
  }
  return null;
}

export async function getGeminiClient(): Promise<{ key: string; model: string } | null> {
  const now = Date.now();
  if (_cachedKey && _cachedModel && now - _lastProbe < PROBE_TTL) {
    return { key: _cachedKey, model: _cachedModel };
  }
  const result = await probeGemini();
  if (result) {
    _cachedKey = result.key;
    _cachedModel = result.model;
    _lastProbe = now;
  } else {
    _cachedKey = null;
    _cachedModel = null;
    // Don't update _lastProbe on failure — re-probe next call
  }
  return result;
}

/** Force-invalidate cache (e.g. after a credits-depleted response) */
export function invalidateGeminiCache() {
  _cachedKey = null;
  _cachedModel = null;
  _lastProbe = 0;
}

/**
 * Generate content via Gemini. Parts can include text and/or inline_data (audio/image).
 * Returns null if Gemini unavailable (caller should fall back to OpenAI).
 */
export async function geminiGenerate(
  parts: GeminiPart[],
  opts: {
    maxTokens?: number;
    temperature?: number;
    systemInstruction?: string;
    forceModel?: string;
  } = {}
): Promise<GeminiResult | null> {
  const client = await getGeminiClient();
  if (!client) return null;

  const model = opts.forceModel || client.model;
  const body: any = {
    contents: [{ parts }],
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 800,
      temperature: opts.temperature ?? 0,
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  try {
    const r = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${client.key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    const d: any = await r.json();
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return { text, model, provider: "gemini" };
    // Credits just ran out mid-session — invalidate so next call re-probes
    const errMsg: string = d?.error?.message ?? "";
    if (errMsg.includes("depleted") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      invalidateGeminiCache();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Analyze audio via Gemini native audio understanding.
 * Sends the raw audio bytes as base64 inline_data — Gemini actually listens.
 */
export async function geminiAnalyzeAudio(
  audioBuf: Buffer,
  mimeType: string,
  prompt: string,
  opts: { maxTokens?: number; systemInstruction?: string } = {}
): Promise<GeminiResult | null> {
  return geminiGenerate(
    [
      { inline_data: { mime_type: mimeType, data: audioBuf.toString("base64") } },
      { text: prompt },
    ],
    { maxTokens: opts.maxTokens ?? 1000, systemInstruction: opts.systemInstruction }
  );
}

/** Status check — shows active model and all candidates */
export async function geminiStatus(): Promise<{
  available: boolean;
  model: string | null;
  keySlot: string | null;
  allModels: string[];
  keyPriority: string[];
}> {
  const client = await getGeminiClient();
  // Find which key slot matched
  const keySlot = client
    ? GEMINI_KEYS.find(k => process.env[k] === client.key) ?? null
    : null;
  return {
    available: !!client,
    model: client?.model ?? null,
    keySlot,
    allModels: GEMINI_MODELS,
    keyPriority: GEMINI_KEYS.filter(k => !!process.env[k]),
  };
}
