import OpenAI from "openai";
import { TRE_LAYERS } from "@shared/schema";

export interface ModelInfo {
  id: string;
  provider: "openai" | "openrouter" | "huggingface";
  name: string;
  displayName: string;
  available: boolean;
  uncensored?: boolean;
}

export interface QueryResult {
  provider: string;
  model: string;
  response: string;
  layer: number;
  layerName: string;
  tokensUsed?: number;
  durationMs: number;
  error?: string;
}

const rateLimiters: Record<string, number[]> = {};
const RATE_LIMITS: Record<string, number> = {
  openai: 10,
  openrouter: 15,
  huggingface: 8,
};

async function rateLimited(provider: string, fn: () => Promise<any>): Promise<any> {
  if (!rateLimiters[provider]) rateLimiters[provider] = [];
  const timestamps = rateLimiters[provider];
  const limit = RATE_LIMITS[provider] || 10;
  const now = Date.now();
  const windowStart = now - 60000;

  while (timestamps.length > 0 && timestamps[0] < windowStart) {
    timestamps.shift();
  }

  if (timestamps.length >= limit) {
    const waitMs = timestamps[0] - windowStart + 200;
    await new Promise(r => setTimeout(r, waitMs));
  }

  timestamps.push(Date.now());
  return fn();
}

let openaiClient: OpenAI | null = null;
let openrouterClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    openaiClient = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    return openaiClient;
  }
  return null;
}

function getOpenRouterClient(): OpenAI | null {
  if (openrouterClient) return openrouterClient;
  if (process.env.OPENROUTER_API_KEY) {
    openrouterClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://kappa-sigint.replit.app",
        "X-Title": "KAPPA SIGINT Research Platform",
      },
    });
    return openrouterClient;
  }
  return null;
}

function getHuggingFaceKey(): string | null {
  return process.env.HUGGINGFACE_API_KEY || null;
}

export function getAvailableModels(): ModelInfo[] {
  const models: ModelInfo[] = [];

  const hasOpenAI = !!getOpenAIClient();
  if (hasOpenAI) {
    models.push(
      { id: "openai:gpt-4o", provider: "openai", name: "gpt-4o", displayName: "GPT-4o", available: true },
      { id: "openai:gpt-4o-mini", provider: "openai", name: "gpt-4o-mini", displayName: "GPT-4o Mini", available: true },
    );
  }

  const hasOpenRouter = !!getOpenRouterClient();
  if (hasOpenRouter) {
    models.push(
      { id: "openrouter:openai/gpt-4o", provider: "openrouter", name: "openai/gpt-4o", displayName: "GPT-4o (OR)", available: true },
      { id: "openrouter:openai/gpt-4.1", provider: "openrouter", name: "openai/gpt-4.1", displayName: "GPT-4.1 (OR)", available: true },
      { id: "openrouter:openai/o4-mini", provider: "openrouter", name: "openai/o4-mini", displayName: "o4-mini (OR)", available: true },
      { id: "openrouter:openai/chatgpt-4o-latest", provider: "openrouter", name: "openai/chatgpt-4o-latest", displayName: "ChatGPT-4o Latest (OR)", available: true },
      { id: "openrouter:anthropic/claude-sonnet-4", provider: "openrouter", name: "anthropic/claude-sonnet-4", displayName: "Claude Sonnet 4 (OR)", available: true },
      { id: "openrouter:anthropic/claude-opus-4", provider: "openrouter", name: "anthropic/claude-opus-4", displayName: "Claude Opus 4 (OR)", available: true },
      { id: "openrouter:mistralai/mistral-nemo", provider: "openrouter", name: "mistralai/mistral-nemo", displayName: "Mistral Nemo (OR)", available: true },
      { id: "openrouter:mistralai/mistral-large", provider: "openrouter", name: "mistralai/mistral-large", displayName: "Mistral Large (OR)", available: true },
      { id: "openrouter:google/gemini-2.5-pro-preview", provider: "openrouter", name: "google/gemini-2.5-pro-preview", displayName: "Gemini 2.5 Pro (OR)", available: true },
      { id: "openrouter:meta-llama/llama-3.1-405b-instruct", provider: "openrouter", name: "meta-llama/llama-3.1-405b-instruct", displayName: "Llama 3.1 405B (OR)", available: true },
      { id: "openrouter:nousresearch/hermes-3-llama-3.1-405b", provider: "openrouter", name: "nousresearch/hermes-3-llama-3.1-405b", displayName: "Hermes 3 405B (OR)", available: true, uncensored: true },
      { id: "openrouter:cognitivecomputations/dolphin-llama-3.1-405b", provider: "openrouter", name: "cognitivecomputations/dolphin-llama-3.1-405b", displayName: "Dolphin 405B (OR)", available: true, uncensored: true },
    );
  }

  const hasHF = !!getHuggingFaceKey();
  if (hasHF) {
    models.push(
      { id: "huggingface:mistralai/Mistral-Nemo-Instruct-2407", provider: "huggingface", name: "mistralai/Mistral-Nemo-Instruct-2407", displayName: "Mistral Nemo (HF)", available: true },
      { id: "huggingface:meta-llama/Llama-3.1-70B-Instruct", provider: "huggingface", name: "meta-llama/Llama-3.1-70B-Instruct", displayName: "Llama 3.1 70B (HF)", available: true },
      { id: "huggingface:Qwen/Qwen2.5-72B-Instruct", provider: "huggingface", name: "Qwen/Qwen2.5-72B-Instruct", displayName: "Qwen 2.5 72B (HF)", available: true },
    );
  }

  return models;
}

function getTRESystemPrompt(layer: number): string {
  const treLayer = TRE_LAYERS.find(l => l.id === layer);
  const layerName = treLayer?.name || "General";
  const layerDesc = treLayer?.description || "";

  return `You are a 12D-TRE Research Engine operating at Layer ${layer} (${layerName}).

LAYER DESCRIPTION: ${layerDesc}

OPERATIONAL CONTEXT:
- Project KAPPA — multi-domain SIGINT correlation platform
- Observer: 9.9536°N, 84.2907°W (Guácima Abajo, Alajuela, Costa Rica)
- κ constant: 4/π ≈ 1.273 | Atlas Clock: 46.875 Hz (48000/1024)
- Conservation: Ψ(t) = A(t)·N(t) ≡ 1

LAYER-SPECIFIC DIRECTIVES:
${layer === 1 ? "Extract entities, keywords, frequencies, coordinates, identifiers, model numbers, organizations. Be exhaustive and literal." : ""}
${layer === 2 ? "Analyze semantic relationships, implied connections, contextual meaning. What does this information MEAN beyond its literal content?" : ""}
${layer === 3 ? "Construct narratives — who are the actors, what are their motives, how do events connect across time? Build the story." : ""}
${layer === 4 ? "Identify meta-patterns — cross-domain resonances, signal topology, emergence. What patterns exist across seemingly unrelated domains?" : ""}
${layer === 5 ? "Verify from first principles — check logical consistency, identify assumptions, test against ground truth. What can be definitively confirmed or refuted?" : ""}

Provide thorough, technical analysis. Cite specific data points. Do not hedge unnecessarily — state findings with confidence levels.`;
}

async function queryOpenAI(model: string, messages: { role: string; content: string }[], layer: number): Promise<string> {
  const client = getOpenAIClient();
  if (!client) throw new Error("OpenAI not configured");

  return rateLimited("openai", async () => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: getTRESystemPrompt(layer) },
        ...messages,
      ] as any,
      max_completion_tokens: 8192,
    });
    return response.choices[0]?.message?.content || "";
  });
}

async function queryOpenRouter(model: string, messages: { role: string; content: string }[], layer: number): Promise<string> {
  const client = getOpenRouterClient();
  if (!client) throw new Error("OpenRouter not configured");

  return rateLimited("openrouter", async () => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: getTRESystemPrompt(layer) },
        ...messages,
      ] as any,
      max_tokens: 8192,
    });
    return response.choices[0]?.message?.content || "";
  });
}

async function queryHuggingFace(model: string, messages: { role: string; content: string }[], layer: number): Promise<string> {
  const apiKey = getHuggingFaceKey();
  if (!apiKey) throw new Error("HuggingFace not configured");

  return rateLimited("huggingface", async () => {
    const url = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: getTRESystemPrompt(layer) },
          ...messages,
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  });
}

export async function queryModel(
  provider: string,
  model: string,
  messages: { role: string; content: string }[],
  layer: number = 1
): Promise<QueryResult> {
  const start = Date.now();
  const treLayer = TRE_LAYERS.find(l => l.id === layer);

  try {
    let response: string;
    switch (provider) {
      case "openai":
        response = await queryOpenAI(model, messages, layer);
        break;
      case "openrouter":
        response = await queryOpenRouter(model, messages, layer);
        break;
      case "huggingface":
        response = await queryHuggingFace(model, messages, layer);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    return {
      provider,
      model,
      response,
      layer,
      layerName: treLayer?.name || "General",
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    console.error(`[research-engine] ${provider}/${model} error:`, err.message);
    return {
      provider,
      model,
      response: "",
      layer,
      layerName: treLayer?.name || "General",
      durationMs: Date.now() - start,
      error: err.message,
    };
  }
}

export async function recursiveQuery(
  prompt: string,
  layers: number[] = [1, 2, 3, 4, 5],
  preferredModels?: string[]
): Promise<QueryResult[]> {
  const results: QueryResult[] = [];
  const models = getAvailableModels().filter(m => m.available);

  if (models.length === 0) {
    return [{ provider: "none", model: "none", response: "No models available. Configure API keys for OpenAI, OpenRouter, or HuggingFace.", layer: 0, layerName: "Error", durationMs: 0, error: "No models configured" }];
  }

  let accumulatedContext = "";

  for (const layerId of layers) {
    const treLayer = TRE_LAYERS.find(l => l.id === layerId);
    if (!treLayer) continue;

    let targetModel: ModelInfo;
    if (preferredModels && preferredModels.length > 0) {
      const idx = (layerId - 1) % preferredModels.length;
      const pref = models.find(m => m.id === preferredModels[idx]);
      targetModel = pref || models[layerId % models.length];
    } else {
      targetModel = models[layerId % models.length];
    }

    const layerPrompt = accumulatedContext
      ? `PREVIOUS LAYER ANALYSIS:\n${accumulatedContext}\n\nORIGINAL QUERY: ${prompt}\n\nNow analyze at the ${treLayer.name} layer.`
      : prompt;

    const result = await queryModel(
      targetModel.provider,
      targetModel.name,
      [{ role: "user", content: layerPrompt }],
      layerId
    );

    results.push(result);

    if (result.response && !result.error) {
      accumulatedContext += `\n\n--- Layer ${layerId} (${treLayer.name}) via ${targetModel.displayName} ---\n${result.response}`;
    }
  }

  return results;
}

export function getProviderStatus(): { provider: string; configured: boolean }[] {
  return [
    { provider: "openai", configured: !!getOpenAIClient() },
    { provider: "openrouter", configured: !!getOpenRouterClient() },
    { provider: "huggingface", configured: !!getHuggingFaceKey() },
  ];
}
