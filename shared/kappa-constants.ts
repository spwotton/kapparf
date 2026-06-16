// KAPPA STELE — canonical, dependency-free constants.
// Single source of truth for the core KAPPA math shared by the DB schema
// (shared/schema.ts) and the pure render path (shared/design-system.ts ->
// shared/studio-render.ts). Deliberately free of drizzle/zod imports so the
// renderer never transitively pulls database concerns into the client bundle.

export const PHI = (1 + Math.sqrt(5)) / 2; // golden ratio ≈ 1.6180339887
export const KAPPA = 4 / Math.PI; // ≈ 1.2732395447
export const CARRIER_HZ = 46.875; // 48000 / 1024, the KAPPA second
export const KLEIN_TWIST_DEG = 128.23;
export const GIZA_CUTOFF_DEG = 51.77;
