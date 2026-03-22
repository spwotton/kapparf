import { CORTICAL_LAYERS, type CorticalLayer, SUPERPOSITION_CONSTANTS } from "@shared/schema";
import { nodeRegistry } from "./cortical-nodes";
import { latentSpace } from "./latent-space";
import { PHI, KAPPA } from "./constants";

export interface StackProcessingResult {
  layer: CorticalLayer;
  nodesProcessed: number;
  outputSummary: string;
  durationMs: number;
  recursionDepth: number;
}

export interface CorticalStackStatus {
  currentLayer: CorticalLayer | "idle";
  processing: boolean;
  lastCycleResults: StackProcessingResult[];
  cycleCount: number;
  lastProcessingAt: number | null;
}

export class CorticalStack {
  private processing = false;
  private currentLayer: CorticalLayer | "idle" = "idle";
  private lastCycleResults: StackProcessingResult[] = [];
  private cycleCount = 0;
  private lastProcessingAt: number | null = null;

  async processFullCycle(input?: string): Promise<StackProcessingResult[]> {
    if (this.processing) return this.lastCycleResults;

    this.processing = true;
    const results: StackProcessingResult[] = [];
    let accumulatedContext = input || "";

    try {
      for (let i = 0; i < CORTICAL_LAYERS.length; i++) {
        const layer = CORTICAL_LAYERS[i];
        this.currentLayer = layer;

        const recursionDepth = Math.floor(SUPERPOSITION_CONSTANTS.MONADAL_RECURSION_DEPTH / Math.pow(PHI, i));
        const layerResult = await this.processLayer(layer, accumulatedContext, Math.max(1, recursionDepth));
        results.push(layerResult);

        accumulatedContext = this.foldOutput(accumulatedContext, layerResult.outputSummary, i);
      }

      this.lastCycleResults = results;
      this.cycleCount++;
      this.lastProcessingAt = Date.now();
    } finally {
      this.processing = false;
      this.currentLayer = "idle";
    }

    return results;
  }

  private async processLayer(layer: CorticalLayer, input: string, recursionDepth: number): Promise<StackProcessingResult> {
    const start = Date.now();
    const nodes = nodeRegistry.getNodesByLayer(layer);
    const outputs: string[] = [];

    for (const node of nodes) {
      node.activate();
      try {
        let currentInput = input;
        for (let r = 0; r < recursionDepth; r++) {
          const output = await node.process(currentInput);
          currentInput = output;
        }
        outputs.push(currentInput);
      } catch (err) {
        outputs.push(`[ERROR] Node ${node.getConfig().id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const outputSummary = outputs.join("\n---\n");
    return {
      layer,
      nodesProcessed: nodes.length,
      outputSummary,
      durationMs: Date.now() - start,
      recursionDepth,
    };
  }

  private foldOutput(previousContext: string, newOutput: string, layerIndex: number): string {
    const totalLines = 20;
    const newOutputWeight = Math.min(0.9, (layerIndex + 1) / (CORTICAL_LAYERS.length + 1));
    const prevOutputWeight = 1 - newOutputWeight;

    const prevLines = previousContext.split("\n").slice(-Math.max(2, Math.floor(totalLines * prevOutputWeight)));
    const newLines = newOutput.split("\n").slice(-Math.max(4, Math.floor(totalLines * newOutputWeight)));

    return `[FOLD-${layerIndex}|φ=${Math.pow(PHI, layerIndex).toFixed(3)}]\n${prevLines.join("\n")}\n---TRANSITION---\n${newLines.join("\n")}`;
  }

  async processSingleLayer(layer: CorticalLayer, input: string): Promise<StackProcessingResult> {
    const recursionDepth = SUPERPOSITION_CONSTANTS.MONADAL_RECURSION_DEPTH;
    return this.processLayer(layer, input, Math.max(1, Math.floor(recursionDepth / PHI)));
  }

  getStatus(): CorticalStackStatus {
    return {
      currentLayer: this.currentLayer,
      processing: this.processing,
      lastCycleResults: this.lastCycleResults,
      cycleCount: this.cycleCount,
      lastProcessingAt: this.lastProcessingAt,
    };
  }

  getPosition(): CorticalLayer | "idle" {
    return this.currentLayer;
  }

  restorePosition(position: CorticalLayer | "idle") {
    this.currentLayer = position;
  }

  getCycleCount(): number {
    return this.cycleCount;
  }

  getLastProcessingAt(): number | null {
    return this.lastProcessingAt;
  }
}

export const corticalStack = new CorticalStack();
