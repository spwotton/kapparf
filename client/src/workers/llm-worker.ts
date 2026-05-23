import {
  pipeline,
  env,
  TextStreamer,
  type TextGenerationPipeline,
  type ProgressCallback,
} from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/";

type WorkerInMsg =
  | { type: "load"; modelId: string; hfToken?: string; dtype?: string }
  | { type: "generate"; layerId: string; agentId: string; messages: { role: string; content: string }[]; maxTokens?: number }
  | { type: "abort" };

type WorkerOutMsg =
  | { type: "progress"; file: string; progress: number; loaded: number; total: number }
  | { type: "loaded"; modelId: string }
  | { type: "token"; layerId: string; agentId: string; text: string }
  | { type: "done"; layerId: string; agentId: string; totalTokens: number }
  | { type: "error"; message: string; agentId?: string; layerId?: string };

let generator: TextGenerationPipeline | null = null;
let currentModelId: string | null = null;
let aborted = false;

interface NavigatorWithGPU extends Navigator {
  readonly gpu?: { requestAdapter(): Promise<unknown> };
}

async function checkWebGPU(): Promise<boolean> {
  try {
    const gpu = (self.navigator as NavigatorWithGPU).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

const HF_TRUSTED_HOSTS = ["huggingface.co", "cdn-lfs.huggingface.co", "cdn-lfs-us-1.huggingface.co"];

function isTrustedHFHost(url: string | URL): boolean {
  try {
    const { hostname } = new URL(url instanceof URL ? url.href : url);
    return HF_TRUSTED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function applyHFToken(token: string) {
  const originalFetch = globalThis.fetch.bind(globalThis);
  env.fetch = (url: string | URL, opts?: RequestInit) => {
    if (isTrustedHFHost(url)) {
      const headers = new Headers(opts?.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return originalFetch(url, { ...(opts ?? {}), headers });
    }
    return originalFetch(url, opts);
  };
}

self.onmessage = async (e: MessageEvent<WorkerInMsg>) => {
  const msg = e.data;

  if (msg.type === "abort") {
    aborted = true;
    return;
  }

  if (msg.type === "load") {
    aborted = false;
    const { modelId, hfToken, dtype } = msg;

    if (currentModelId === modelId && generator) {
      self.postMessage({ type: "loaded", modelId } satisfies WorkerOutMsg);
      return;
    }

    const hasWebGPU = await checkWebGPU();
    const device: "webgpu" | "wasm" = hasWebGPU ? "webgpu" : "wasm";

    if (hfToken) {
      applyHFToken(hfToken);
    }

    const progressCb: ProgressCallback = (p) => {
      if (p.status === "progress") {
        self.postMessage({
          type: "progress",
          file: (p as { file?: string }).file ?? "",
          progress: (p as { progress?: number }).progress ?? 0,
          loaded: (p as { loaded?: number }).loaded ?? 0,
          total: (p as { total?: number }).total ?? 0,
        } satisfies WorkerOutMsg);
      }
    };

    try {
      generator = await pipeline("text-generation", modelId, {
        device,
        dtype: (dtype ?? "q4") as Parameters<typeof pipeline>[2] extends { dtype?: infer D } ? D : string,
        progress_callback: progressCb,
      }) as TextGenerationPipeline;

      currentModelId = modelId;
      self.postMessage({ type: "loaded", modelId } satisfies WorkerOutMsg);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: "error", message } satisfies WorkerOutMsg);
    }
    return;
  }

  if (msg.type === "generate") {
    const { layerId, agentId, messages, maxTokens } = msg;

    if (!generator) {
      self.postMessage({ type: "error", message: "No model loaded", agentId, layerId } satisfies WorkerOutMsg);
      return;
    }
    aborted = false;
    let tokenCount = 0;

    const tokenizer = (generator as unknown as { tokenizer: ConstructorParameters<typeof TextStreamer>[0] }).tokenizer;

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      callback_function: (token: string) => {
        if (aborted) return;
        tokenCount++;
        self.postMessage({ type: "token", layerId, agentId, text: token } satisfies WorkerOutMsg);
      },
    });

    try {
      await generator(messages as Parameters<TextGenerationPipeline>[0], {
        max_new_tokens: maxTokens ?? 512,
        do_sample: true,
        temperature: 0.7,
        streamer,
      } as Parameters<TextGenerationPipeline>[1]);

      self.postMessage({ type: "done", layerId, agentId, totalTokens: tokenCount } satisfies WorkerOutMsg);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: "error", message, agentId, layerId } satisfies WorkerOutMsg);
    }
  }
};
