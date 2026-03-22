import { SC, KAPPA, PHI } from "./constants";
import type { CorticalLayer } from "@shared/schema";
import { storage } from "../storage";

export interface LatentEntry {
  id: string;
  sourceNodeId: string;
  content: string;
  relevanceScore: number;
  layerTag: CorticalLayer;
  resonanceCount: number;
  decayFactor: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

let entryCounter = 0;

export class LatentSpaceMesh {
  private entries: Map<string, LatentEntry> = new Map();
  private resonanceIndex: Map<string, string[]> = new Map();

  publish(sourceNodeId: string, content: string, layerTag: CorticalLayer, relevanceScore: number = 0.5, metadata?: Record<string, unknown>): LatentEntry {
    entryCounter++;
    const id = `ls-${Date.now()}-${entryCounter}`;
    const entry: LatentEntry = {
      id,
      sourceNodeId,
      content,
      relevanceScore: Math.min(1, Math.max(0, relevanceScore)),
      layerTag,
      resonanceCount: 0,
      decayFactor: 1.0,
      timestamp: Date.now(),
      metadata,
    };

    this.entries.set(id, entry);
    this.detectResonance(entry);
    this.enforceCapacity();

    storage.createLatentSpaceEntry({
      sourceNodeId: entry.sourceNodeId,
      content: entry.content,
      relevanceScore: entry.relevanceScore,
      layerTag: entry.layerTag,
      resonanceCount: entry.resonanceCount,
      decayFactor: entry.decayFactor,
      metadata: entry.metadata || {},
    }).catch(() => {});

    return entry;
  }

  private detectResonance(newEntry: LatentEntry) {
    const contentWords = new Set(newEntry.content.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    if (contentWords.size === 0) return;

    for (const [id, existing] of this.entries) {
      if (id === newEntry.id) continue;
      if (existing.sourceNodeId === newEntry.sourceNodeId) continue;

      const existingWords = new Set(existing.content.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      let overlap = 0;
      for (const w of contentWords) {
        if (existingWords.has(w)) overlap++;
      }

      const similarity = overlap / Math.max(contentWords.size, existingWords.size);
      if (similarity > (1 / KAPPA)) {
        existing.resonanceCount++;
        newEntry.resonanceCount++;
        existing.relevanceScore = Math.min(1, existing.relevanceScore * SC.RESONANCE_AMPLIFICATION);
        newEntry.relevanceScore = Math.min(1, newEntry.relevanceScore * SC.RESONANCE_AMPLIFICATION);

        const key = [existing.sourceNodeId, newEntry.sourceNodeId].sort().join("↔");
        if (!this.resonanceIndex.has(key)) this.resonanceIndex.set(key, []);
        this.resonanceIndex.get(key)!.push(`${existing.id}⇌${newEntry.id}`);
      }
    }
  }

  private enforceCapacity() {
    if (this.entries.size <= SC.MAX_LATENT_ENTRIES) return;

    const sorted = Array.from(this.entries.values()).sort((a, b) => {
      const scoreA = a.relevanceScore * a.decayFactor;
      const scoreB = b.relevanceScore * b.decayFactor;
      return scoreA - scoreB;
    });

    const toRemove = sorted.slice(0, this.entries.size - SC.MAX_LATENT_ENTRIES);
    for (const entry of toRemove) {
      this.entries.delete(entry.id);
    }
  }

  decay() {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      const ageMs = now - entry.timestamp;
      const ageMinutes = ageMs / 60000;
      entry.decayFactor = Math.pow(SC.DECAY_RATE, ageMinutes / KAPPA);

      if (entry.decayFactor * entry.relevanceScore < 0.01) {
        this.entries.delete(id);
      }
    }
  }

  getEntriesForLayer(layer: CorticalLayer): LatentEntry[] {
    const layerOrder: CorticalLayer[] = ["sensory", "thalamic", "cortical", "prefrontal"];
    const layerIdx = layerOrder.indexOf(layer);
    return Array.from(this.entries.values())
      .filter(e => {
        const entryIdx = layerOrder.indexOf(e.layerTag as CorticalLayer);
        return entryIdx <= layerIdx;
      })
      .sort((a, b) => (b.relevanceScore * b.decayFactor) - (a.relevanceScore * a.decayFactor));
  }

  getEntriesByNode(nodeId: string): LatentEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.sourceNodeId === nodeId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getTopEntries(limit: number = 50): LatentEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => (b.relevanceScore * b.decayFactor) - (a.relevanceScore * a.decayFactor))
      .slice(0, limit);
  }

  getResonancePairs(): { pair: string; count: number }[] {
    return Array.from(this.resonanceIndex.entries())
      .map(([pair, links]) => ({ pair, count: links.length }))
      .sort((a, b) => b.count - a.count);
  }

  getSize(): number {
    return this.entries.size;
  }

  getCapacity(): number {
    return SC.MAX_LATENT_ENTRIES;
  }

  getAllEntries(): LatentEntry[] {
    return Array.from(this.entries.values());
  }

  clear() {
    this.entries.clear();
    this.resonanceIndex.clear();
  }

  getSnapshot(): LatentEntry[] {
    return Array.from(this.entries.values());
  }

  restoreSnapshot(entries: LatentEntry[]) {
    this.entries.clear();
    this.resonanceIndex.clear();
    for (const entry of entries) {
      this.entries.set(entry.id, { ...entry });
    }
  }

  getResonanceScore(): number {
    if (this.entries.size === 0) return 0;
    const totalResonance = Array.from(this.entries.values()).reduce((sum, e) => sum + e.resonanceCount, 0);
    return Math.min(1, totalResonance / (this.entries.size * PHI));
  }
}

export const latentSpace = new LatentSpaceMesh();
