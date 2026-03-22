import { nodeRegistry, type NodeState } from "./cortical-nodes";
import { latentSpace, type LatentEntry } from "./latent-space";
import { corticalStack } from "./cortical-stack";
import type { NeuralState, CorticalLayer } from "@shared/schema";
import { SUPERPOSITION_CONSTANTS } from "@shared/schema";

export interface NeuralSnapshotData {
  id: string;
  label: string;
  nodeStates: NodeState[];
  latentSpaceSnapshot: LatentEntry[];
  stackPosition: CorticalLayer | "idle";
  coherenceMetrics: NeuralState["coherenceMetrics"];
  timestamp: number;
}

let snapshotCounter = 0;
const snapshots: NeuralSnapshotData[] = [];
const MAX_SNAPSHOTS = 50;

export function createSnapshot(label: string): NeuralSnapshotData {
  snapshotCounter++;
  const snapshot: NeuralSnapshotData = {
    id: `snap-${Date.now()}-${snapshotCounter}`,
    label,
    nodeStates: nodeRegistry.getSnapshotStates(),
    latentSpaceSnapshot: latentSpace.getSnapshot(),
    stackPosition: corticalStack.getPosition(),
    coherenceMetrics: computeCoherenceMetrics(),
    timestamp: Date.now(),
  };

  snapshots.unshift(snapshot);
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.pop();
  }

  return snapshot;
}

export function restoreSnapshot(snapshotId: string): boolean {
  const snapshot = snapshots.find(s => s.id === snapshotId);
  if (!snapshot) return false;

  nodeRegistry.restoreStates(snapshot.nodeStates);
  latentSpace.restoreSnapshot(snapshot.latentSpaceSnapshot);
  corticalStack.restorePosition(snapshot.stackPosition);

  return true;
}

export function listSnapshots(): Omit<NeuralSnapshotData, "nodeStates" | "latentSpaceSnapshot">[] {
  return snapshots.map(s => ({
    id: s.id,
    label: s.label,
    stackPosition: s.stackPosition,
    coherenceMetrics: s.coherenceMetrics,
    timestamp: s.timestamp,
  }));
}

export function getSnapshot(id: string): NeuralSnapshotData | undefined {
  return snapshots.find(s => s.id === id);
}

let persistedSnapshotCount = 0;

export function setPersistedSnapshotCount(count: number): void {
  persistedSnapshotCount = count;
}

export function getSnapshotCount(): number {
  const inMemoryIds = new Set(snapshots.map(s => s.id));
  return snapshots.length + Math.max(0, persistedSnapshotCount - inMemoryIds.size);
}

export function computeCoherenceMetrics(): NeuralState["coherenceMetrics"] {
  const nodes = nodeRegistry.getAllNodes();
  const activeNodes = nodes.filter(n => {
    const s = n.getState();
    return s.status === "active" || s.status === "processing";
  }).length;

  const totalActivations = nodes.reduce((sum, n) => sum + n.getState().activationCount, 0);
  const avgHealth = nodes.reduce((sum, n) => sum + n.getState().healthScore, 0) / nodes.length;

  const latentSize = latentSpace.getSize();
  const qubitUtilization = latentSize / SUPERPOSITION_CONSTANTS.MAX_LATENT_ENTRIES;

  const resonanceScore = latentSpace.getResonanceScore();

  const kappaAlignment = avgHealth * (4 / Math.PI);
  const phiLockRate = totalActivations > 0
    ? Math.min(1, (activeNodes / nodes.length) * 1.618033988749895)
    : 0;

  const psiConvergence = Math.min(1, (
    (activeNodes / nodes.length) * 0.3 +
    resonanceScore * 0.25 +
    Math.min(1, kappaAlignment) * 0.25 +
    qubitUtilization * 0.2
  ));

  return {
    psiConvergence,
    kappaAlignment: Math.min(1, kappaAlignment),
    phiLockRate: Math.min(1, phiLockRate),
    resonanceScore,
    activeNodes,
    totalQubitUtilization: qubitUtilization,
  };
}

export function getCurrentNeuralState(): NeuralState {
  return {
    nodes: nodeRegistry.getAllStates().map(s => ({
      nodeId: s.nodeId,
      name: s.name,
      brainRegion: s.brainRegion,
      corticalLayer: s.corticalLayer,
      status: s.status,
      activationCount: s.activationCount,
      lastActivation: s.lastActivation,
      healthScore: s.healthScore,
    })) as NeuralState["nodes"],
    latentEntries: latentSpace.getTopEntries(100).map(e => ({
      id: e.id,
      sourceNodeId: e.sourceNodeId,
      content: e.content,
      relevanceScore: e.relevanceScore,
      layerTag: e.layerTag,
      resonanceCount: e.resonanceCount,
      decayFactor: e.decayFactor,
      timestamp: e.timestamp,
    })) as NeuralState["latentEntries"],
    stackPosition: corticalStack.getPosition(),
    coherenceMetrics: computeCoherenceMetrics(),
  };
}
