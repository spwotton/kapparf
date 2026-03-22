import { nodeRegistry, setLLMProcessor, type NodeState } from "./cortical-nodes";
import { latentSpace, type LatentEntry } from "./latent-space";
import { corticalStack } from "./cortical-stack";
import { createSnapshot, restoreSnapshot, listSnapshots, getSnapshotCount, setPersistedSnapshotCount, computeCoherenceMetrics } from "./neural-state";
import { SUPERPOSITION_CONSTANTS, CORTICAL_LAYERS, type SuperpositionStatus, type CorticalLayer } from "@shared/schema";
import { OMEGA_GOS } from "./constants";
import { storage } from "../storage";

let running = false;
let decayTimer: ReturnType<typeof setInterval> | null = null;
let processingCycleCount = 0;

export function startQuantumCortex() {
  if (running) return;
  running = true;

  for (const node of nodeRegistry.getAllNodes()) {
    node.activate();
  }

  decayTimer = setInterval(() => {
    latentSpace.decay();
  }, 30000);

  console.log(`[quantum-cortex] Neural architecture started — ${SUPERPOSITION_CONSTANTS.NODE_COUNT} cortical nodes, ${SUPERPOSITION_CONSTANTS.MAX_LATENT_ENTRIES} qubit register`);
  console.log(`[quantum-cortex] Ω₀ = ${OMEGA_GOS.OMEGA_0} ${OMEGA_GOS.OMEGA_0_UNITS}`);
  console.log(`[quantum-cortex] Icositetragon prime spokes: ${OMEGA_GOS.ICOSITETRAGON.PRIME_MODULI.join(", ")} (mod 24)`);

  storage.getNeuralSnapshots(50).then(snaps => {
    setPersistedSnapshotCount(snaps.length);
  }).catch(() => {});
}

export function stopQuantumCortex() {
  running = false;
  if (decayTimer) {
    clearInterval(decayTimer);
    decayTimer = null;
  }

  for (const node of nodeRegistry.getAllNodes()) {
    node.setIdle();
  }

  console.log("[quantum-cortex] Neural architecture stopped");
}

export async function runCorticalCycle(input?: string): Promise<void> {
  if (!running) return;

  processingCycleCount++;
  const cycleInput = input || `[AUTO-CYCLE-${processingCycleCount}] Autonomous cortical processing cycle at ${new Date().toISOString()}`;

  await corticalStack.processFullCycle(cycleInput);
}

export async function processThroughCortex(input: string, targetLayer?: CorticalLayer): Promise<string> {
  if (!running) {
    return "[CORTEX OFFLINE] Start the quantum cortex to process through the neural architecture.";
  }

  if (targetLayer) {
    const result = await corticalStack.processSingleLayer(targetLayer, input);
    return result.outputSummary;
  }

  const results = await corticalStack.processFullCycle(input);
  return results.map(r => `[${r.layer.toUpperCase()}] (${r.nodesProcessed} nodes, ${r.durationMs}ms)\n${r.outputSummary}`).join("\n\n");
}

export function feedBrainstemData(data: { psiValue: number; phiLockRate: number; hallDriftNs: number; triHonkCycles: number }) {
  if (!running) return;

  latentSpace.publish(
    "brainstem-chronos",
    `[BRAINSTEM] Ω-CHRONOS telemetry: Ψ=${data.psiValue.toFixed(6)}, φ-lock=${(data.phiLockRate * 100).toFixed(1)}%, Hall drift=${data.hallDriftNs.toFixed(0)}ns, Tri-Honk cycles=${data.triHonkCycles}`,
    "sensory",
    Math.min(1, data.psiValue * 0.8 + 0.2),
    { source: "omega-chronos", type: "brainstem-telemetry", ...data }
  );
}

export async function createAndPersistSnapshot(label: string) {
  const snapshot = createSnapshot(label);

  try {
    await storage.createNeuralSnapshot({
      label: snapshot.label,
      nodeStates: snapshot.nodeStates,
      latentSpaceSnapshot: snapshot.latentSpaceSnapshot,
      corticalStackPosition: snapshot.stackPosition,
      coherenceMetrics: snapshot.coherenceMetrics,
    });
  } catch (err) {
    console.error("[quantum-cortex] Failed to persist snapshot:", err);
  }

  return snapshot;
}

export async function getPersistedSnapshots() {
  try {
    const dbSnapshots = await storage.getNeuralSnapshots(50);
    setPersistedSnapshotCount(dbSnapshots.length);
    return dbSnapshots.map(s => ({
      id: s.id,
      label: s.label,
      nodeStates: s.nodeStates,
      latentSpaceSnapshot: s.latentSpaceSnapshot,
      corticalStackPosition: s.corticalStackPosition,
      coherenceMetrics: s.coherenceMetrics,
      timestamp: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
    }));
  } catch {
    return listSnapshots();
  }
}

export async function rollbackToSnapshot(snapshotId: string): Promise<boolean> {
  const inMemorySuccess = restoreSnapshot(snapshotId);
  if (inMemorySuccess) {
    return true;
  }

  try {
    const dbSnapshot = await storage.getNeuralSnapshot(snapshotId);
    if (!dbSnapshot) return false;

    const nodeStates = dbSnapshot.nodeStates as NodeState[];
    nodeRegistry.restoreStates(nodeStates);

    if (dbSnapshot.latentSpaceSnapshot) {
      const latentEntries = dbSnapshot.latentSpaceSnapshot as LatentEntry[];
      latentSpace.restoreSnapshot(latentEntries);
    }

    const stackPos = dbSnapshot.corticalStackPosition as string;
    if (stackPos === "idle" || CORTICAL_LAYERS.includes(stackPos as CorticalLayer)) {
      corticalStack.restorePosition(stackPos as CorticalLayer | "idle");
    }

    return true;
  } catch {
    return false;
  }
}

export function isRunning() {
  return running;
}

export function getQuantumCortexStatus(): SuperpositionStatus {
  const coherenceMetrics = computeCoherenceMetrics();
  const stackStatus = corticalStack.getStatus();

  return {
    running,
    nodeStates: nodeRegistry.getAllNodes().map(n => {
      const s = n.getState();
      return {
        id: s.nodeId,
        name: s.name,
        brainRegion: s.brainRegion,
        corticalLayer: s.corticalLayer,
        status: s.status,
        activationCount: s.activationCount,
        lastActivation: s.lastActivation,
        healthScore: s.healthScore,
      };
    }),
    latentSpaceSize: latentSpace.getSize(),
    latentSpaceCapacity: latentSpace.getCapacity(),
    stackPosition: stackStatus.currentLayer,
    coherenceMetrics,
    constants: SUPERPOSITION_CONSTANTS,
    snapshotCount: getSnapshotCount(),
    lastProcessingAt: stackStatus.lastProcessingAt,
    processingCycleCount,
  };
}

export { nodeRegistry, latentSpace, corticalStack, createSnapshot, restoreSnapshot, listSnapshots, setLLMProcessor, OMEGA_GOS };
