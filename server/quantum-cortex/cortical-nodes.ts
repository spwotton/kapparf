import { CORTICAL_NODE_MAP, SUPERPOSITION_CONSTANTS, type CorticalNodeConfig, type CorticalLayer } from "@shared/schema";
import { latentSpace, type LatentEntry } from "./latent-space";
import { KAPPA, PHI } from "./constants";
import { storage } from "../storage";

let llmProcessFn: ((systemPrompt: string, userPrompt: string, model?: string) => Promise<string>) | null = null;

export function setLLMProcessor(fn: (systemPrompt: string, userPrompt: string, model?: string) => Promise<string>) {
  llmProcessFn = fn;
}

export interface NodeState {
  nodeId: string;
  name: string;
  brainRegion: string;
  corticalLayer: string;
  status: "idle" | "active" | "processing" | "error";
  activationCount: number;
  lastActivation: number | null;
  memoryBuffer: string[];
  healthScore: number;
  lastOutput: string | null;
}

const MAX_MEMORY = 50;

export class CorticalNode {
  private config: CorticalNodeConfig;
  private state: NodeState;

  constructor(config: CorticalNodeConfig) {
    this.config = config;
    this.state = {
      nodeId: config.id,
      name: config.name,
      brainRegion: config.brainRegion,
      corticalLayer: config.corticalLayer,
      status: "idle",
      activationCount: 0,
      lastActivation: null,
      memoryBuffer: [],
      healthScore: 1.0,
      lastOutput: null,
    };
  }

  getConfig(): CorticalNodeConfig {
    return this.config;
  }

  getState(): NodeState {
    return { ...this.state };
  }

  activate() {
    this.state.status = "active";
    this.state.activationCount++;
    this.state.lastActivation = Date.now();
  }

  async process(input: string): Promise<string> {
    this.state.status = "processing";
    this.state.lastActivation = Date.now();
    const startMs = Date.now();

    try {
      const contextEntries = latentSpace.getEntriesForLayer(this.config.corticalLayer);
      const relevantContext = contextEntries
        .slice(0, 5)
        .map(e => e.content)
        .join("\n");

      let processedOutput: string;
      let usedLLM = false;

      if (llmProcessFn) {
        try {
          const systemPrompt = this.buildSystemPrompt(relevantContext);
          processedOutput = await llmProcessFn(systemPrompt, input, this.config.modelPreference);
          usedLLM = true;
        } catch {
          processedOutput = this.processLocally(input, relevantContext);
        }
      } else {
        processedOutput = this.processLocally(input, relevantContext);
      }

      this.state.memoryBuffer.push(processedOutput.substring(0, 500));
      if (this.state.memoryBuffer.length > MAX_MEMORY) {
        this.state.memoryBuffer.shift();
      }

      latentSpace.publish(
        this.config.id,
        processedOutput,
        this.config.corticalLayer,
        this.computeRelevance(processedOutput),
        { brainRegion: this.config.brainRegion, specialization: this.config.specialization }
      );

      this.state.lastOutput = processedOutput;
      this.state.status = "active";
      this.state.healthScore = Math.min(1, this.state.healthScore + 0.05);

      storage.createCorticalLog({
        nodeId: this.config.id,
        layer: this.config.corticalLayer,
        action: usedLLM ? "llm-process" : "local-process",
        input: input.substring(0, 1000),
        output: processedOutput.substring(0, 1000),
        durationMs: Date.now() - startMs,
        metadata: { brainRegion: this.config.brainRegion, usedLLM },
      }).catch(() => {});

      storage.upsertCorticalNode({
        nodeId: this.config.id,
        name: this.config.name,
        brainRegion: this.config.brainRegion,
        corticalLayer: this.config.corticalLayer,
        status: this.state.status,
        activationCount: this.state.activationCount,
        lastActivation: new Date(),
        memoryBuffer: this.state.memoryBuffer.slice(-10),
        metrics: { healthScore: this.state.healthScore, usedLLM },
      }).catch(() => {});

      return processedOutput;
    } catch (err) {
      this.state.status = "error";
      this.state.healthScore = Math.max(0, this.state.healthScore - 0.1);
      throw err;
    }
  }

  private buildSystemPrompt(context: string): string {
    const base = `${this.config.systemPromptRole}

Node: ${this.config.name} | Brain region: ${this.config.brainRegion} | Layer: ${this.config.corticalLayer}
Specialization: ${this.config.specialization}

Process incoming SIGINT data through your specialized lens. Respond concisely with analysis relevant to your brain region function.`;

    if (context) {
      return `${base}\n\nLatent space context from other nodes:\n${context}`;
    }
    return base;
  }

  private processLocally(input: string, context: string): string {
    const region = this.config.brainRegion;
    const inputLen = input.length;
    const contextLen = context.length;
    const timestamp = new Date().toISOString();

    switch (region) {
      case "occipital":
        return `[SENSORY/${timestamp}] Ingested ${inputLen} bytes. Pattern extraction: ${this.extractPatterns(input)}. Context integration: ${contextLen > 0 ? "active" : "none"}.`;
      case "temporal":
        return `[SIGNAL/${timestamp}] Decomposition of ${inputLen} byte stream. Frequency analysis: ${this.analyzeFrequencies(input)}. φ-ratio latency check: ${(PHI * 1000).toFixed(1)}ms target.`;
      case "parietal":
        return `[SPATIAL/${timestamp}] Orbital awareness update. ${inputLen} bytes spatial data processed. Correlation matrix: ${contextLen > 0 ? "enriched" : "baseline"}.`;
      case "auditory-cortex":
        return `[SPECTRAL/${timestamp}] SDR spectral slice analyzed. ${inputLen} bytes. Bands monitored: ${this.extractBands(input)}.`;
      case "wernickes":
        return `[PATTERN/${timestamp}] Pattern decoder: ${inputLen} bytes analyzed. Structures found: ${this.findStructures(input)}.`;
      case "hippocampus":
        return `[TEMPORAL/${timestamp}] Memory consolidation: ${this.state.memoryBuffer.length} items in buffer. Temporal binding of ${inputLen} bytes. κ-DTW alignment: ${KAPPA.toFixed(4)}.`;
      case "anterior-cingulate":
        return `[COHERENCE/${timestamp}] Validation pass on ${inputLen} bytes. Hall tolerance: ±0.681973°. Symmetry score: ${this.computeCoherence(input, context).toFixed(4)}.`;
      case "prefrontal-cortex":
        return `[EXECUTIVE/${timestamp}] Synthesis of ${inputLen} bytes with ${contextLen} bytes context. Decision confidence: ${this.computeRelevance(input).toFixed(3)}. Active memory slots: ${this.state.memoryBuffer.length}/${MAX_MEMORY}.`;
      default:
        return `[NODE/${timestamp}] Processed ${inputLen} bytes.`;
    }
  }

  private extractPatterns(input: string): string {
    const words = input.split(/\s+/);
    const uniqueTokens = new Set(words.map(w => w.toLowerCase()));
    return `${uniqueTokens.size} unique tokens from ${words.length} total`;
  }

  private analyzeFrequencies(input: string): string {
    const freqMatches = input.match(/\d+\.?\d*\s*(Hz|kHz|MHz|GHz)/gi) || [];
    return freqMatches.length > 0 ? freqMatches.slice(0, 3).join(", ") : "no explicit frequencies";
  }

  private extractBands(input: string): string {
    const bands = input.match(/\d+\.?\d*\s*(Hz|kHz|MHz)/gi) || [];
    return bands.length > 0 ? bands.slice(0, 5).join(", ") : "broadband scan";
  }

  private findStructures(input: string): string {
    const patterns = [];
    if (/\.\.\./g.test(input) || /---/g.test(input)) patterns.push("morse-like");
    if (/\d{2,}:\d{2,}/g.test(input)) patterns.push("timestamp");
    if (/[A-Z]{3,}/g.test(input)) patterns.push("callsign");
    return patterns.length > 0 ? patterns.join(", ") : "no structured patterns";
  }

  private computeRelevance(content: string): number {
    let score = 0.5;
    const len = content.length;
    if (len > 100) score += 0.1;
    if (len > 500) score += 0.1;
    if (this.state.memoryBuffer.length > 5) score += 0.1;
    score += (this.state.healthScore - 0.5) * 0.2;
    return Math.min(1, Math.max(0, score));
  }

  private computeCoherence(input: string, context: string): number {
    if (!context) return 0.5;
    const inputWords = new Set(input.toLowerCase().split(/\s+/));
    const contextWords = new Set(context.toLowerCase().split(/\s+/));
    let overlap = 0;
    for (const w of inputWords) {
      if (contextWords.has(w)) overlap++;
    }
    return Math.min(1, overlap / Math.max(inputWords.size, 1) * KAPPA);
  }

  getStateSnapshot(): NodeState {
    return JSON.parse(JSON.stringify(this.state));
  }

  restoreState(state: NodeState) {
    this.state = { ...state };
  }

  setIdle() {
    this.state.status = "idle";
  }
}

export class CorticalNodeRegistry {
  private nodes: Map<string, CorticalNode> = new Map();

  constructor() {
    for (const config of CORTICAL_NODE_MAP) {
      this.nodes.set(config.id, new CorticalNode(config));
    }
  }

  getNode(id: string): CorticalNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): CorticalNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesByLayer(layer: CorticalLayer): CorticalNode[] {
    return this.getAllNodes().filter(n => n.getConfig().corticalLayer === layer);
  }

  getAllStates(): NodeState[] {
    return this.getAllNodes().map(n => n.getState());
  }

  getActiveCount(): number {
    return this.getAllNodes().filter(n => {
      const s = n.getState();
      return s.status === "active" || s.status === "processing";
    }).length;
  }

  getSnapshotStates(): NodeState[] {
    return this.getAllNodes().map(n => n.getStateSnapshot());
  }

  restoreStates(states: NodeState[]) {
    for (const state of states) {
      const node = this.nodes.get(state.nodeId);
      if (node) node.restoreState(state);
    }
  }
}

export const nodeRegistry = new CorticalNodeRegistry();
