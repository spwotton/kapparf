// KAPPA STELE — Pure renderer. Scene (JSON) -> SVG string.
// No DOM, no external deps: runs identically on server and client.

import {
  FORMATS,
  PALETTES,
  SANS,
  SERIF,
  MONO,
  PHI,
  CARRIER_HZ,
  DEFAULT_PALETTE,
  type Palette,
} from "./design-system";
import type { Scene, Layer, Fill } from "./studio-schema";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function num(n: number, d = 2): string {
  return Number.isFinite(n) ? +n.toFixed(d) + "" : "0";
}

function fontFamily(f: "sans" | "serif" | "mono"): string {
  return f === "serif" ? SERIF : f === "mono" ? MONO : SANS;
}

// Resolve a semantic token ("$accent") or literal color, then escape: color
// fields are free-form strings (z.string()) and the output flows into SVG
// attributes that are rendered via dangerouslySetInnerHTML, so unescaped
// quotes/brackets would allow attribute/handler injection (stored XSS).
function color(c: string | undefined, pal: Palette): string {
  if (!c) return esc(pal.fg);
  if (c.startsWith("$")) {
    const key = c.slice(1) as keyof Palette;
    const v = pal[key];
    return esc(typeof v === "string" ? v : pal.fg);
  }
  return esc(c);
}

interface Ctx {
  pal: Palette;
  defs: string[];
  uid: () => string;
}

// Approximate text wrapping by average glyph advance (no DOM measurement).
function wrapText(text: string, fontSize: number, boxW: number): string[] {
  const avg = fontSize * 0.54; // Inter-ish average advance
  const maxChars = Math.max(1, Math.floor(boxW / avg));
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (para.length === 0) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const candidate = line ? line + " " + word : word;
      if (candidate.length <= maxChars) {
        line = candidate;
      } else {
        if (line) out.push(line);
        // hard-break very long words
        if (word.length > maxChars) {
          let rest = word;
          while (rest.length > maxChars) {
            out.push(rest.slice(0, maxChars));
            rest = rest.slice(maxChars);
          }
          line = rest;
        } else {
          line = word;
        }
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function resolveFill(fill: Fill | undefined, ctx: Ctx): string {
  if (!fill || fill.type === "none") return "none";
  if (fill.type === "solid") return color(fill.color, ctx.pal);
  if (fill.type === "linear") {
    const id = ctx.uid();
    const a = ((fill.angle ?? 90) * Math.PI) / 180;
    const x2 = +(0.5 + Math.cos(a) / 2).toFixed(4);
    const y2 = +(0.5 + Math.sin(a) / 2).toFixed(4);
    const x1 = +(0.5 - Math.cos(a) / 2).toFixed(4);
    const y1 = +(0.5 - Math.sin(a) / 2).toFixed(4);
    const stops = fill.stops
      .map(
        (s) =>
          `<stop offset="${num(s.offset * 100)}%" stop-color="${color(s.color, ctx.pal)}"/>`,
      )
      .join("");
    ctx.defs.push(
      `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`,
    );
    return `url(#${id})`;
  }
  if (fill.type === "radial") {
    const id = ctx.uid();
    const stops = fill.stops
      .map(
        (s) =>
          `<stop offset="${num(s.offset * 100)}%" stop-color="${color(s.color, ctx.pal)}"/>`,
      )
      .join("");
    ctx.defs.push(
      `<radialGradient id="${id}" cx="${num(fill.cx)}" cy="${num(fill.cy)}" r="${num(fill.r)}">${stops}</radialGradient>`,
    );
    return `url(#${id})`;
  }
  return "none";
}

function strokeAttrs(stroke: { color: string; width?: number; dash?: string } | undefined, ctx: Ctx): string {
  if (!stroke) return "";
  let a = ` stroke="${color(stroke.color, ctx.pal)}" stroke-width="${num(stroke.width ?? 2)}"`;
  if (stroke.dash) a += ` stroke-dasharray="${esc(stroke.dash)}"`;
  return a;
}

function effectFilter(layer: Layer, ctx: Ctx): string {
  const parts: string[] = [];
  const anyL = layer as { shadow?: { dx: number; dy: number; blur: number; color: string }; blur?: number };
  if (anyL.shadow) {
    const s = anyL.shadow;
    parts.push(
      `<feDropShadow dx="${num(s.dx)}" dy="${num(s.dy)}" stdDeviation="${num(s.blur / 2)}" flood-color="${color(s.color, ctx.pal)}"/>`,
    );
  }
  if (anyL.blur && anyL.blur > 0) {
    parts.push(`<feGaussianBlur stdDeviation="${num(anyL.blur)}"/>`);
  }
  if (parts.length === 0) return "";
  const id = ctx.uid();
  ctx.defs.push(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%">${parts.join("")}</filter>`);
  return ` filter="url(#${id})"`;
}

// ── Presets (signature KAPPA marks) ────────────────────────────────────────
function renderPreset(layer: Extract<Layer, { type: "preset" }>, ctx: Ctx, W: number, H: number): string {
  const stroke = color(layer.color, ctx.pal);
  const p = layer.params ?? {};
  if (layer.kind === "golden-grid") {
    const margin = Math.round(W / Math.pow(PHI, 4));
    const gxA = Math.round(W / PHI);
    const gyA = Math.round(H / PHI);
    const lines = [
      `<rect x="${margin}" y="${margin}" width="${W - 2 * margin}" height="${H - 2 * margin}" fill="none" stroke="${stroke}" stroke-width="1" opacity="0.5"/>`,
      `<line x1="${gxA}" y1="0" x2="${gxA}" y2="${H}" stroke="${stroke}" stroke-width="1" opacity="0.35"/>`,
      `<line x1="${W - gxA}" y1="0" x2="${W - gxA}" y2="${H}" stroke="${stroke}" stroke-width="1" opacity="0.35"/>`,
      `<line x1="0" y1="${gyA}" x2="${W}" y2="${gyA}" stroke="${stroke}" stroke-width="1" opacity="0.35"/>`,
      `<line x1="0" y1="${H - gyA}" x2="${W}" y2="${H - gyA}" stroke="${stroke}" stroke-width="1" opacity="0.35"/>`,
    ];
    return lines.join("");
  }
  if (layer.kind === "waveform") {
    const w = layer.w ?? W;
    const amp = (p.amp ?? (layer.h ?? 120) / 2);
    const cycles = p.cycles ?? Math.round(CARRIER_HZ / 6); // ≈ 8 cycles
    const steps = Math.max(40, Math.round(w / 4));
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = t * w;
      const py = -Math.sin(t * cycles * 2 * Math.PI) * amp;
      d += (i === 0 ? "M" : "L") + num(px) + " " + num(py) + " ";
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${num(p.weight ?? 2)}" stroke-linecap="round"/>`;
  }
  if (layer.kind === "ticks") {
    const w = layer.w ?? W;
    const count = Math.round(p.count ?? 24);
    const len = p.len ?? 18;
    let out = "";
    for (let i = 0; i <= count; i++) {
      const px = (i / count) * w;
      const long = i % 4 === 0;
      out += `<line x1="${num(px)}" y1="0" x2="${num(px)}" y2="${num(long ? len : len / 2)}" stroke="${stroke}" stroke-width="${long ? 2 : 1}" opacity="${long ? 0.8 : 0.4}"/>`;
    }
    return out;
  }
  if (layer.kind === "phi-spiral") {
    // Golden spiral from quarter-circle arcs (Fibonacci squares).
    const scale = p.scale ?? 8;
    const turns = Math.round(p.turns ?? 7);
    let a = scale;
    let b = scale;
    let cx = 0;
    let cy = 0;
    let d = `M 0 0`;
    let dir = 0;
    for (let i = 0; i < turns; i++) {
      const r = a;
      let ex = cx;
      let ey = cy;
      switch (dir) {
        case 0: ex = cx + r; ey = cy - r; d += ` A ${num(r)} ${num(r)} 0 0 1 ${num(ex)} ${num(ey)}`; cx = ex; cy = ey; break;
        case 1: ex = cx - r; ey = cy - r; d += ` A ${num(r)} ${num(r)} 0 0 1 ${num(ex)} ${num(ey)}`; cx = ex; cy = ey; break;
        case 2: ex = cx - r; ey = cy + r; d += ` A ${num(r)} ${num(r)} 0 0 1 ${num(ex)} ${num(ey)}`; cx = ex; cy = ey; break;
        case 3: ex = cx + r; ey = cy + r; d += ` A ${num(r)} ${num(r)} 0 0 1 ${num(ex)} ${num(ey)}`; cx = ex; cy = ey; break;
      }
      const next = a + b;
      a = b;
      b = next;
      dir = (dir + 1) % 4;
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${num(p.weight ?? 2)}" opacity="0.8"/>`;
  }
  if (layer.kind === "kappa-mark") {
    const size = layer.w ?? 96;
    return (
      `<text x="0" y="${num(size * 0.8)}" font-family="${SERIF}" font-size="${num(size)}" fill="${stroke}">κ</text>` +
      `<text x="${num(size * 0.62)}" y="${num(size * 0.86)}" font-family="${MONO}" font-size="${num(size * 0.18)}" fill="${color("$muted", ctx.pal)}">${num(CARRIER_HZ)}Hz</text>`
    );
  }
  return "";
}

function renderLayer(layer: Layer, ctx: Ctx, W: number, H: number): string {
  const t = (layer as { x?: number; y?: number; rotation?: number }) ;
  const x = t.x ?? 0;
  const y = t.y ?? 0;
  const rot = t.rotation ?? 0;
  const opacity = (layer as { opacity?: number }).opacity ?? 1;
  const blend = (layer as { blendMode?: string }).blendMode ?? "normal";

  let inner = "";
  switch (layer.type) {
    case "group":
      inner = layer.children.map((c) => renderLayer(c, ctx, W, H)).join("");
      break;
    case "text": {
      const lines = wrapText(layer.uppercase ? layer.text.toUpperCase() : layer.text, layer.fontSize, layer.w);
      const anchor = layer.align === "center" ? "middle" : layer.align === "right" ? "end" : "start";
      const ax = layer.align === "center" ? layer.w / 2 : layer.align === "right" ? layer.w : 0;
      const lh = layer.fontSize * layer.lineHeight;
      const tspans = lines
        .map(
          (ln, i) =>
            `<tspan x="${num(ax)}" dy="${i === 0 ? num(layer.fontSize) : num(lh)}">${esc(ln) || " "}</tspan>`,
        )
        .join("");
      inner = `<text font-family="${fontFamily(layer.fontFamily)}" font-size="${num(layer.fontSize)}" font-weight="${layer.fontWeight}" letter-spacing="${num(layer.letterSpacing)}" ${layer.italic ? 'font-style="italic" ' : ""}text-anchor="${anchor}" fill="${color(layer.color, ctx.pal)}">${tspans}</text>`;
      break;
    }
    case "rect":
      inner = `<rect x="0" y="0" width="${num(layer.w)}" height="${num(layer.h)}" rx="${num(layer.cornerRadius)}" fill="${resolveFill(layer.fill, ctx)}"${strokeAttrs(layer.stroke, ctx)}/>`;
      break;
    case "ellipse":
      inner = `<ellipse cx="${num(layer.w / 2)}" cy="${num(layer.h / 2)}" rx="${num(layer.w / 2)}" ry="${num(layer.h / 2)}" fill="${resolveFill(layer.fill, ctx)}"${strokeAttrs(layer.stroke, ctx)}/>`;
      break;
    case "line":
      inner = `<line x1="0" y1="0" x2="${num(layer.dx)}" y2="${num(layer.dy)}"${strokeAttrs(layer.stroke, ctx)} stroke-linecap="round"/>`;
      break;
    case "polygon": {
      const pts = layer.points.map((p) => `${num(p[0])},${num(p[1])}`).join(" ");
      inner = `<polygon points="${pts}" fill="${resolveFill(layer.fill, ctx)}"${strokeAttrs(layer.stroke, ctx)}/>`;
      break;
    }
    case "path":
      inner = `<path d="${esc(layer.d)}" fill="${resolveFill(layer.fill, ctx)}"${strokeAttrs(layer.stroke, ctx)}/>`;
      break;
    case "image": {
      const par = layer.fit === "fill" ? "none" : layer.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice";
      let img = `<image href="${esc(layer.src)}" x="0" y="0" width="${num(layer.w)}" height="${num(layer.h)}" preserveAspectRatio="${par}"`;
      if (layer.cornerRadius > 0) {
        const cid = ctx.uid();
        ctx.defs.push(
          `<clipPath id="${cid}"><rect x="0" y="0" width="${num(layer.w)}" height="${num(layer.h)}" rx="${num(layer.cornerRadius)}"/></clipPath>`,
        );
        img += ` clip-path="url(#${cid})"`;
      }
      img += `/>`;
      inner = img;
      break;
    }
    case "preset":
      inner = renderPreset(layer, ctx, W, H);
      break;
  }

  const filter = effectFilter(layer, ctx);
  const transform = `translate(${num(x)} ${num(y)})${rot ? ` rotate(${num(rot)})` : ""}`;
  const style = blend !== "normal" ? ` style="mix-blend-mode:${esc(blend)}"` : "";
  return `<g transform="${transform}" opacity="${num(opacity)}"${style}${filter}>${inner}</g>`;
}

export function renderScene(scene: Scene): string {
  const fmt = FORMATS[scene.format] ?? FORMATS.square;
  const W = fmt.w;
  const H = fmt.h;
  const pal = PALETTES[scene.palette] ?? PALETTES[DEFAULT_PALETTE];
  let counter = 0;
  const ctx: Ctx = { pal, defs: [], uid: () => `s${(counter++).toString(36)}` };

  // Background
  let bg = "";
  if (scene.background && scene.background.type === "image") {
    bg = `<image href="${esc(scene.background.src)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="${scene.background.fit === "contain" ? "xMidYMid meet" : scene.background.fit === "fill" ? "none" : "xMidYMid slice"}"/>`;
  } else {
    bg = `<rect x="0" y="0" width="${W}" height="${H}" fill="${resolveFill(scene.background, ctx)}"/>`;
  }

  const body = scene.layers.map((l) => renderLayer(l, ctx, W, H)).join("");
  const defs = ctx.defs.length ? `<defs>${ctx.defs.join("")}</defs>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">${defs}${bg}${body}</svg>`;
}

export function renderSceneToDataUri(scene: Scene): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(renderScene(scene));
}
