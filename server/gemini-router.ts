/**
 * KAPPA Gemini Router
 * Tries Gemini models in priority order, falls back to Replit OpenAI proxy.
 * Caches the working model for the session to avoid re-probing every call.
 */

// Priority order — best to cheapest
export const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "nano-banana-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_KEYS = ["GEMINI_API_KEY", "GOOGLE_ALT", "GOOGLE_API_E"];

let _cachedKey: string | null = null;
let _cachedModel: string | null = null;
let _lastProbe = 0;
const PROBE_TTL = 5 * 60 * 1000; // re-probe every 5 min

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string }; // base64 audio/image
}

export interface GeminiResult {
  text: string;
  model: string;
  provider: "gemini" | "openai-fallback";
  key?: string;
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
        const d: any = await r.json();
        const ok = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (ok) {
          console.log(`[GeminiRouter] Active: ${keyName} / ${model}`);
          return { key, model };
        }
      } catch { /* try next */ }
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
  }
  return result;
}

/**
 * Generate content via Gemini. Parts can include text and/or inline_data (audio/image).
 * Falls back to openai-fallback signal if Gemini unavailable.
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
    // If this model failed, invalidate cache and try next
    const errMsg = d?.error?.message ?? "";
    if (errMsg.includes("depleted") || errMsg.includes("quota") || errMsg.includes("billing")) {
      _cachedKey = null; _cachedModel = null; _lastProbe = 0;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Analyze audio via Gemini native audio understanding.
 * Sends the raw audio bytes as base64 inline_data.
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

/** Quick status check — useful for health endpoints */
export async function geminiStatus(): Promise<{
  available: boolean;
  model: string | null;
  allModels: string[];
}> {
  const client = await getGeminiClient();
  return { available: !!client, model: client?.model ?? null, allModels: GEMINI_MODELS };
}
