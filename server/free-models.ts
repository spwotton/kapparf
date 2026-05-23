/**
 * FREE_MODELS — current live free model rotation on OpenRouter
 * Updated: 2026-05-23. No :free model requires balance.
 * Order matters: best capability first, smaller fallbacks after.
 */
export const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",       // 131k ctx — primary workhorse
  "deepseek/deepseek-v4-flash:free",               // 1M ctx  — replaces dead deepseek-r1
  "qwen/qwen3-next-80b-a3b-instruct:free",         // 262k ctx — strong reasoning
  "openai/gpt-oss-120b:free",                      // 131k ctx — reliable
  "google/gemma-4-31b-it:free",                    // 262k ctx — Google backbone
  "nvidia/nemotron-3-super-120b-a12b:free",        // 1M ctx  — large context backup
  "nousresearch/hermes-3-llama-3.1-405b:free",     // 131k ctx — large model
  "meta-llama/llama-3.2-3b-instruct:free",         // 131k ctx — fast small fallback
];

export const PRIMARY_FREE   = FREE_MODELS[0];
export const FALLBACK_FREE  = FREE_MODELS[1];
export const FAST_FREE      = FREE_MODELS[7];

/**
 * Try each model in the chain until one succeeds.
 * Pass an openrouter OpenAI client and your messages/options.
 */
export async function tryFreeModels(
  client: import("openai").default,
  messages: import("openai").OpenAI.ChatCompletionMessageParam[],
  opts: { max_tokens?: number; temperature?: number } = {},
  models: string[] = FREE_MODELS
): Promise<string> {
  const errs: string[] = [];
  for (const model of models) {
    try {
      const resp = await client.chat.completions.create({
        model,
        messages,
        max_tokens: opts.max_tokens ?? 1200,
        temperature: opts.temperature ?? 0.7,
      });
      const text = resp.choices[0]?.message?.content ?? "";
      if (text.trim().length > 0) return text;
      errs.push(`${model}: empty response`);
    } catch (e: any) {
      errs.push(`${model}: ${e.message?.slice(0, 60)}`);
    }
  }
  throw new Error(`All free models failed: ${errs.join(" | ")}`);
}
