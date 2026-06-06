export interface NeuronState {
  id: number;
  h: number;
  tau: number;
  stability: number;
  dominantHz: number | null;
  dominantLabel: string | null;
  hHistory: number[];
}

export interface AttractorFingerprint {
  neuronIds: number[];
  tauMs: number;
  hz: number | null;
  label: string;
  stability: number;
  lockedEvents: number;
}

export interface LiquidCortexState {
  neurons: NeuronState[];
  liquidity: number;
  eventsProcessed: number;
  lastEvent: string | null;
  attractors: AttractorFingerprint[];
  meanTau: number;
  dominantDomain: string | null;
  uptime: number;
  liquidityHistory: number[];
}
