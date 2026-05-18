export type WorkerOutMsg =
  | { type: "progress"; file: string; progress: number; loaded: number; total: number }
  | { type: "loaded"; modelId: string }
  | { type: "token"; layerId: string; agentId: string; text: string }
  | { type: "done"; layerId: string; agentId: string; totalTokens: number }
  | { type: "error"; message: string; agentId?: string; layerId?: string };

export interface AgentSubscription {
  onToken?: (text: string) => void;
  onDone?: (totalTokens: number) => void;
  onError?: (message: string) => void;
}

interface QueueEntry {
  agentId: string;
  layerId: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
}

interface ModelConfig {
  modelId: string;
  hfToken?: string;
  dtype?: string;
}

type SlotState = "unloaded" | "loading" | "idle" | "busy";

interface WorkerSlot {
  worker: Worker;
  state: SlotState;
}

/**
 * WorkerPool — fixed N-slot pool where N = maxConcurrent.
 *
 * Memory is bounded to N × model_size because exactly N workers are kept
 * resident. Workers are generic (not tied to a specific agentId) and are
 * reused across generations. This prevents unbounded GPU-memory growth when
 * the same pool processes many different agents over time.
 */
export class WorkerPool {
  private slots: WorkerSlot[] = [];
  private queue: QueueEntry[] = [];
  private maxConcurrent: number;
  private modelConfig: ModelConfig | null = null;
  private onMessage: (msg: WorkerOutMsg) => void;
  private subscriptions = new Map<string, AgentSubscription>();

  constructor(maxConcurrent: number, onMessage: (msg: WorkerOutMsg) => void) {
    this.maxConcurrent = maxConcurrent;
    this.onMessage = onMessage;
  }

  setMaxConcurrent(n: number) {
    const next = Math.max(1, n);
    if (next === this.maxConcurrent) return;

    if (next > this.maxConcurrent && this.modelConfig) {
      // Create additional slots up to the new limit.
      const gap = next - this.slots.length;
      for (let i = 0; i < gap; i++) this.addSlot();
    }
    // If reducing, we just lower the cap; active slots drain naturally.
    this.maxConcurrent = next;
    this.drainQueue();
  }

  loadModel(config: ModelConfig) {
    this.modelConfig = config;

    if (this.slots.length === 0) {
      // Cold start — create the initial set of slots.
      for (let i = 0; i < this.maxConcurrent; i++) this.addSlot();
      // addSlot already sends "load" to each new slot via this.modelConfig.
    } else {
      // Reload model in all existing slots.
      this.slots.forEach((slot) => {
        slot.state = "loading";
        slot.worker.postMessage({ type: "load", ...config });
      });
    }
  }

  dispatch(
    agentId: string,
    layerId: string,
    messages: { role: string; content: string }[],
    maxTokens?: number
  ) {
    const busyCount = this.slots.filter((s) => s.state === "busy").length;
    const idleSlot =
      busyCount < this.maxConcurrent
        ? this.slots.find((s) => s.state === "idle")
        : null;

    if (idleSlot) {
      idleSlot.state = "busy";
      idleSlot.worker.postMessage({ type: "generate", agentId, layerId, messages, maxTokens });
    } else {
      this.queue.push({ agentId, layerId, messages, maxTokens });
      // Signal the UI that this agent is queued, not yet running.
      this.onMessage({ type: "token", layerId, agentId, text: "\u0000queued" });
    }
  }

  /**
   * Subscribe to per-agent events for one dispatch cycle.
   * Returns an unsubscribe function.
   */
  subscribeAgent(agentId: string, callbacks: AgentSubscription): () => void {
    this.subscriptions.set(agentId, callbacks);
    return () => this.subscriptions.delete(agentId);
  }

  abort(agentId: string) {
    // Send abort to all busy slots — the worker discards tokens for the
    // current generation. Slots ignore abort if they are idle.
    this.slots.forEach((s) => {
      if (s.state === "busy") s.worker.postMessage({ type: "abort" });
    });
    // Remove from queue if not yet started.
    this.queue = this.queue.filter((e) => e.agentId !== agentId);
  }

  abortAll() {
    this.queue = [];
    this.slots.forEach((s) => s.worker.postMessage({ type: "abort" }));
  }

  terminate() {
    this.queue = [];
    this.slots.forEach((s) => s.worker.terminate());
    this.slots = [];
    this.subscriptions.clear();
  }

  get concurrentCount(): number {
    return this.slots.filter((s) => s.state === "busy").length;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  private addSlot(): WorkerSlot {
    const worker = new Worker(
      new URL("../workers/llm-worker.ts", import.meta.url),
      { type: "module" }
    );

    const slot: WorkerSlot = { worker, state: "unloaded" };

    worker.onmessage = (e: MessageEvent<WorkerOutMsg>) => {
      const msg = e.data;

      // Route subscription callbacks (type-safe, no any casts).
      if (msg.type === "token" && msg.agentId) {
        this.subscriptions.get(msg.agentId)?.onToken?.(msg.text);
      } else if (msg.type === "done" && msg.agentId) {
        const sub = this.subscriptions.get(msg.agentId);
        if (sub?.onDone) {
          sub.onDone(msg.totalTokens);
          this.subscriptions.delete(msg.agentId);
        }
      } else if (msg.type === "error" && msg.agentId) {
        const sub = this.subscriptions.get(msg.agentId);
        if (sub?.onError) {
          sub.onError(msg.message);
          this.subscriptions.delete(msg.agentId);
        }
      }

      // Pool slot lifecycle.
      if (msg.type === "loaded") {
        slot.state = "idle";
        this.drainQueue();
      } else if (msg.type === "done" || msg.type === "error") {
        slot.state = "idle";
        this.drainQueue();
      }

      // Broadcast to the page-level message handler.
      this.onMessage(msg);
    };

    worker.onerror = (err) => {
      slot.state = "idle";
      this.drainQueue();
      this.onMessage({ type: "error", message: err.message ?? "Worker error" });
    };

    // Auto-load model if config is already set (handles cold-start and
    // dynamic slot creation when maxConcurrent is increased).
    if (this.modelConfig) {
      slot.state = "loading";
      worker.postMessage({ type: "load", ...this.modelConfig });
    }

    this.slots.push(slot);
    return slot;
  }

  private drainQueue() {
    while (this.queue.length > 0) {
      const busyCount = this.slots.filter((s) => s.state === "busy").length;
      if (busyCount >= this.maxConcurrent) break;
      const idleSlot = this.slots.find((s) => s.state === "idle");
      if (!idleSlot) break;
      const next = this.queue.shift()!;
      idleSlot.state = "busy";
      idleSlot.worker.postMessage({ type: "generate", ...next });
    }
  }
}
