// KAPPA STELE — Design system derived from first principles + KAPPA math.
// Single source of truth for proportion, rhythm, type scale and palette.
// Everything here is deterministic and derived from KAPPA_CONSTANTS so that
// generated graphics are consistent and on-brand by construction.

import { PHI, KAPPA, KLEIN_TWIST_DEG, GIZA_CUTOFF_DEG, CARRIER_HZ } from "./kappa-constants";

export { PHI, KAPPA, KLEIN_TWIST_DEG, GIZA_CUTOFF_DEG, CARRIER_HZ };
export const GOLDEN_ANGLE = 360 / (PHI * PHI); // ≈ 137.5077°

// ── Typefaces ──────────────────────────────────────────────────────────────
export const SANS = "Inter, system-ui, -apple-system, Segoe UI, sans-serif";
export const SERIF = "'Iowan Old Style', Georgia, 'Times New Roman', serif";
export const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// ── Output formats ─────────────────────────────────────────────────────────
export const FORMATS = {
  square: { w: 1080, h: 1080, label: "Square · 1080×1080" },
  portrait: { w: 1080, h: 1350, label: "Portrait · 1080×1350" },
  story: { w: 1080, h: 1920, label: "Story · 1080×1920" },
} as const;
export type FormatKey = keyof typeof FORMATS;

// ── Palettes (Notion-minimal, semantic tokens) ─────────────────────────────
export interface Palette {
  name: string;
  dark: boolean;
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  line: string;
  accent: string;
  accentSoft: string;
}

export const PALETTES: Record<string, Palette> = {
  ink: {
    name: "Ink (dark · gold)",
    dark: true,
    bg: "#0A0A0B",
    surface: "#141417",
    fg: "#EDEDED",
    muted: "#8A8A90",
    line: "#242429",
    accent: "#D4A24C",
    accentSoft: "#5E4D26",
  },
  paper: {
    name: "Paper (light · ink)",
    dark: false,
    bg: "#FAFAF7",
    surface: "#FFFFFF",
    fg: "#18181B",
    muted: "#6B6B70",
    line: "#E7E7E2",
    accent: "#9A6B1F",
    accentSoft: "#E8D8B0",
  },
  signal: {
    name: "Signal (dark · cyan)",
    dark: true,
    bg: "#0A0C0F",
    surface: "#12161B",
    fg: "#E9EEF2",
    muted: "#7E8893",
    line: "#1F252C",
    accent: "#4FB0E0",
    accentSoft: "#234657",
  },
  crimson: {
    name: "Crimson (dark · red)",
    dark: true,
    bg: "#0B0A0A",
    surface: "#161213",
    fg: "#ECE8E8",
    muted: "#8E8587",
    line: "#261F20",
    accent: "#C84C4C",
    accentSoft: "#4A2727",
  },
};

export type PaletteName = keyof typeof PALETTES;
export const DEFAULT_PALETTE: PaletteName = "ink";

// ── Modular type scale (φ ratio, canvas-relative) ──────────────────────────
export interface TypeScale {
  micro: number;
  caption: number;
  body: number;
  h3: number;
  h2: number;
  h1: number;
  display: number;
}

export function typeScale(canvasW: number): TypeScale {
  const base = canvasW / 34; // body ≈ 32 @ 1080
  const r = Math.round;
  return {
    micro: r(base / (PHI * PHI)),
    caption: r(base / PHI),
    body: r(base),
    h3: r(base * PHI),
    h2: r(base * PHI * PHI),
    h1: r(base * PHI * PHI * PHI),
    display: r(base * PHI * PHI * PHI * PHI),
  };
}

// ── Spacing rhythm (φ-stepped) ─────────────────────────────────────────────
export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export function spacingScale(canvasW: number): SpacingScale {
  const unit = canvasW / 90; // ≈ 12 @ 1080
  const r = Math.round;
  return {
    xs: r(unit / PHI),
    sm: r(unit),
    md: r(unit * PHI),
    lg: r(unit * PHI * PHI),
    xl: r(unit * PHI * PHI * PHI),
    xxl: r(unit * PHI * PHI * PHI * PHI),
  };
}

// ── Golden grid (margins + golden-section guide lines) ──────────────────────
export interface GridGuide {
  w: number;
  h: number;
  margin: number;
  gx: [number, number]; // vertical golden-section lines
  gy: [number, number]; // horizontal golden-section lines
  cx: number;
  cy: number;
}

export function gridFor(format: FormatKey): GridGuide {
  const { w, h } = FORMATS[format];
  const r = Math.round;
  const margin = r(w / Math.pow(PHI, 4));
  const gxA = r(w / PHI);
  const gyA = r(h / PHI);
  return {
    w,
    h,
    margin,
    gx: [r(w - gxA), gxA],
    gy: [r(h - gyA), gyA],
    cx: r(w / 2),
    cy: r(h / 2),
  };
}

// ── Golden-angle palette generator (harmonious accent families) ─────────────
export function goldenAnglePalette(
  baseHue = 42,
  count = 5,
  sat = 55,
  light = 58,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = ((baseHue + i * GOLDEN_ANGLE) % 360 + 360) % 360;
    out.push(`hsl(${hue.toFixed(1)} ${sat}% ${light}%)`);
  }
  return out;
}
