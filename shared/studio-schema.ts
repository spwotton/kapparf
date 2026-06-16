// KAPPA STELE — Scene graph contract.
// A Scene is a parametric, declarative document that renders to vector (SVG).
// Every "Photoshop variable" (position, size, rotation, opacity, blend, fill,
// stroke, shadow, blur, typography) lives here, validated by Zod so AI/MCP
// tool output is always type-safe. Provenance (sourceRefs) enforces zero-mock:
// every datum must cite a real live source, a user input, or a raster job.

import { z } from "zod";

// ── Provenance ─────────────────────────────────────────────────────────────
export const sourceRefSchema = z.object({
  kind: z.enum(["live", "user", "raster", "derived"]),
  ref: z.string().min(1), // e.g. "/api/social/data#kappa.score", "user:title", "gpt-image-1:<hash>"
  note: z.string().optional(),
});
export type SourceRef = z.infer<typeof sourceRefSchema>;

// ── Fills ──────────────────────────────────────────────────────────────────
const gradientStop = z.object({
  offset: z.number().min(0).max(1),
  color: z.string(), // hex / rgb / hsl / "$accent" semantic token
});

export const fillSchema = z.union([
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("solid"), color: z.string() }),
  z.object({
    type: z.literal("linear"),
    stops: z.array(gradientStop).min(2),
    angle: z.number().default(90), // degrees, 0 = →, 90 = ↓
  }),
  z.object({
    type: z.literal("radial"),
    stops: z.array(gradientStop).min(2),
    cx: z.number().min(0).max(1).default(0.5),
    cy: z.number().min(0).max(1).default(0.5),
    r: z.number().min(0).max(1.5).default(0.5),
  }),
  z.object({
    type: z.literal("image"),
    src: z.string(), // data URI or absolute URL (raster from Anubis/gpt-image-1)
    fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  }),
]);
export type Fill = z.infer<typeof fillSchema>;

const strokeSchema = z.object({
  color: z.string(),
  width: z.number().min(0).default(2),
  dash: z.string().optional(), // e.g. "6 6"
});

const shadowSchema = z.object({
  dx: z.number().default(0),
  dy: z.number().default(8),
  blur: z.number().default(24),
  color: z.string().default("rgba(0,0,0,0.45)"),
});

// ── Layer base (transform + effects shared by all layers) ──────────────────
const baseLayer = {
  id: z.string().min(1),
  name: z.string().optional(),
  x: z.number().default(0),
  y: z.number().default(0),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  blendMode: z
    .enum([
      "normal",
      "multiply",
      "screen",
      "overlay",
      "darken",
      "lighten",
      "color-dodge",
      "difference",
      "exclusion",
    ])
    .default("normal"),
  shadow: shadowSchema.optional(),
  blur: z.number().min(0).optional(),
  sourceRefs: z.array(sourceRefSchema).optional(),
};

const textLayer = z.object({
  ...baseLayer,
  type: z.literal("text"),
  text: z.string(),
  w: z.number().default(800), // wrap box width
  fontSize: z.number().default(48),
  fontFamily: z.enum(["sans", "serif", "mono"]).default("sans"),
  fontWeight: z.number().default(500),
  lineHeight: z.number().default(1.2),
  letterSpacing: z.number().default(0),
  align: z.enum(["left", "center", "right"]).default("left"),
  color: z.string().default("$fg"),
  uppercase: z.boolean().default(false),
  italic: z.boolean().default(false),
});

const rectLayer = z.object({
  ...baseLayer,
  type: z.literal("rect"),
  w: z.number(),
  h: z.number(),
  fill: fillSchema.default({ type: "solid", color: "$surface" }),
  stroke: strokeSchema.optional(),
  cornerRadius: z.number().default(0),
});

const ellipseLayer = z.object({
  ...baseLayer,
  type: z.literal("ellipse"),
  w: z.number(),
  h: z.number(),
  fill: fillSchema.default({ type: "solid", color: "$accent" }),
  stroke: strokeSchema.optional(),
});

const lineLayer = z.object({
  ...baseLayer,
  type: z.literal("line"),
  dx: z.number(), // end point relative to (x,y)
  dy: z.number(),
  stroke: strokeSchema,
});

const polygonLayer = z.object({
  ...baseLayer,
  type: z.literal("polygon"),
  points: z.array(z.tuple([z.number(), z.number()])).min(2), // relative to (x,y)
  fill: fillSchema.default({ type: "none" }),
  stroke: strokeSchema.optional(),
});

const pathLayer = z.object({
  ...baseLayer,
  type: z.literal("path"),
  d: z.string(), // SVG path data in local space
  fill: fillSchema.default({ type: "none" }),
  stroke: strokeSchema.optional(),
});

const imageLayer = z.object({
  ...baseLayer,
  type: z.literal("image"),
  w: z.number(),
  h: z.number(),
  src: z.string(), // data URI or URL
  fit: z.enum(["cover", "contain", "fill"]).default("cover"),
  cornerRadius: z.number().default(0),
});

const presetLayer = z.object({
  ...baseLayer,
  type: z.literal("preset"),
  kind: z.enum(["golden-grid", "waveform", "kappa-mark", "ticks", "phi-spiral"]),
  w: z.number().optional(),
  h: z.number().optional(),
  color: z.string().default("$accent"),
  params: z.record(z.number()).optional(),
});

// Group is recursive → declared via z.lazy with explicit type.
export type Layer =
  | z.infer<typeof textLayer>
  | z.infer<typeof rectLayer>
  | z.infer<typeof ellipseLayer>
  | z.infer<typeof lineLayer>
  | z.infer<typeof polygonLayer>
  | z.infer<typeof pathLayer>
  | z.infer<typeof imageLayer>
  | z.infer<typeof presetLayer>
  | ({
      type: "group";
      id: string;
      name?: string;
      x: number;
      y: number;
      rotation: number;
      opacity: number;
      blendMode: z.infer<typeof textLayer>["blendMode"];
      children: Layer[];
      sourceRefs?: SourceRef[];
    });

// Group must be a real ZodObject (not z.lazy) so it can be a discriminatedUnion
// member — the union reads `member.shape.type` at construction time, which a
// ZodLazy lacks. Recursion is deferred on the `children` element instead.
const groupLayer = z.object({
  ...baseLayer,
  type: z.literal("group"),
  children: z.array(z.lazy((): z.ZodType<Layer> => layerSchema)),
});

export const layerSchema: z.ZodType<Layer> = z.discriminatedUnion("type", [
  textLayer,
  rectLayer,
  ellipseLayer,
  lineLayer,
  polygonLayer,
  pathLayer,
  imageLayer,
  presetLayer,
  groupLayer as unknown as typeof textLayer,
]) as unknown as z.ZodType<Layer>;

// ── Scene ──────────────────────────────────────────────────────────────────
export const sceneSchema = z.object({
  format: z.enum(["square", "portrait", "story"]).default("square"),
  palette: z.enum(["ink", "paper", "signal", "crimson"]).default("ink"),
  background: fillSchema.default({ type: "solid", color: "$bg" }),
  layers: z.array(layerSchema).default([]),
  title: z.string().optional(),
  caption: z.string().optional(),
  dataSources: z.array(sourceRefSchema).optional(),
});
export type Scene = z.infer<typeof sceneSchema>;

export const EMPTY_SCENE: Scene = {
  format: "square",
  palette: "ink",
  background: { type: "solid", color: "$bg" },
  layers: [],
};
