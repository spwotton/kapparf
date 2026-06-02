/**
 * FTM AI CLIENT — OpenRouter-compatible embeddings and synthesis
 * Embeddings: nomic-ai/nomic-embed-text-v1.5 (768 dims, free)
 * Synthesis: free model cascade via tryFreeModels
 */

import OpenAI from "openai";
import { GOS_CONSTANTS } from "./gosConstants";
import { tryFreeModels, FREE_MODELS } from "../../free-models";

const EMBED_DIMS = GOS_CONSTANTS.embed_dims;  // 768

const routerClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://kappa-sigint.replit.app",
    "X-Title": "FTM Hypervisor",
  },
});

/**
 * Simple deterministic embedding fallback — returns a 768-dim float array
 * derived from the text hash. Used when OpenRouter embedding call fails.
 * NOT semantically meaningful, but preserves system stability.
 */
function deterministicEmbedding(text: string): number[] {
  const vec = new Array(EMBED_DIMS).fill(0);
  let h1 = 0x9e3779b9, h2 = 0x6c62272e;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x9e3779b9) >>> 0;
    h2 = ((h2 ^ (c << 13)) * 0x6c62272e) >>> 0;
    const idx1 = (h1 ^ i) % EMBED_DIMS;
    const idx2 = (h2 ^ (i * 7)) % EMBED_DIMS;
    vec[idx1] = (vec[idx1] + Math.sin(h1 * 0.0001)) / 2;
    vec[idx2] = (vec[idx2] + Math.cos(h2 * 0.0001)) / 2;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

/**
 * Embed a single text string via nomic-embed-text-v1.5 (768 dims).
 * Falls back to deterministic hash embedding if the API call fails.
 */
export async function embed(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) return deterministicEmbedding("empty");
  const truncated = text.slice(0, 8192);  // nomic context limit

  try {
    const resp = await routerClient.embeddings.create({
      model: "nomic-ai/nomic-embed-text-v1.5",
      input: truncated,
    } as any);
    const vec = (resp as any).data?.[0]?.embedding as number[] | undefined;
    if (vec && vec.length > 0) return vec;
  } catch (_err) {
    // fall through to deterministic fallback
  }

  return deterministicEmbedding(truncated);
}

/**
 * Batch embed multiple texts. Processes in chunks of 20.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const CHUNK = 20;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK);
    const embeddings = await Promise.all(chunk.map(t => embed(t)));
    results.push(...embeddings);
  }
  return results;
}

/**
 * Synthesize text using free OpenRouter models with exponential backoff + circuit breaker.
 */
export async function synthesize(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    return await tryFreeModels(
      routerClient,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { max_tokens: 600, temperature: 0.72 },
      FREE_MODELS.slice(0, 4)  // try top 4 free models
    );
  } catch (_err) {
    // Graceful fallback — template response preserving system integrity
    return `The lattice speaks: nexus detected. The Goose Gap holds at η*=${GOS_CONSTANTS.eta_star}. Follow the money.`;
  }
}

/**
 * Cosine similarity between two float vectors.
 */
export function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}
