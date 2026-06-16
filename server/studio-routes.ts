// KAPPA STELE — Studio backend.
// Parametric vector graphics engine exposed as AI/MCP tools, grounded in LIVE
// KAPPA data only (zero mock). Raster via gpt-image-1 (default) or Anubis
// (behind ANUBIS_GENERATE_URL; 501 if unconfigured — never fabricated).

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import { kappaEngine } from "./kappa-engine";
import { openai, generateImageBuffer } from "./replit_integrations/image/client";
import { sceneSchema, type Scene } from "@shared/studio-schema";
import { insertStudioPostSchema } from "@shared/schema";
import { renderScene } from "@shared/studio-render";
import { FORMATS, PALETTES, typeScale, gridFor, type FormatKey } from "@shared/design-system";
import { request as httpsRequest } from "node:https";
import { lookup as dnsLookupAll, type LookupAddress } from "node:dns";
import { isIPv4, isIP, type LookupFunction } from "node:net";

export const studioRouter = Router();

const CHAT_MODEL = "gpt-4o-mini";
const MAX_PROMPT = 1200;
const MAX_RASTER_BYTES = 16 * 1024 * 1024;

let _idc = 0;
const lid = (p = "l") => `${p}${(Date.now() % 1e6).toString(36)}${(_idc++).toString(36)}`;

// SSRF guard for provider-returned image URLs (Anubis): only https, and only
// hosts that resolve to a public address — blocks loopback/private/link-local/
// CGNAT/cloud-metadata ranges so a compromised or misconfigured provider cannot
// pivot the server-side fetch into internal services.
function ipv4IsDisallowed(ip: string): boolean {
  const o = ip.split(".").map(Number);
  if (o.length !== 4 || o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true; // malformed → fail closed
  const [a, b, c] = o;
  if (a === 0) return true;                            // 0.0.0.0/8 "this host"
  if (a === 10) return true;                           // 10/8 private
  if (a === 127) return true;                          // loopback
  if (a === 100 && b >= 64 && b <= 127) return true;   // 100.64/10 CGNAT
  if (a === 169 && b === 254) return true;             // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;    // 172.16/12 private
  if (a === 192 && b === 0 && c === 0) return true;    // 192.0.0/24 IETF protocol
  if (a === 192 && b === 0 && c === 2) return true;    // 192.0.2/24 TEST-NET-1
  if (a === 192 && b === 88 && c === 99) return true;  // 6to4 relay anycast
  if (a === 192 && b === 168) return true;             // 192.168/16 private
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15 benchmark
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100/24 TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true;  // 203.0.113/24 TEST-NET-3
  if (a >= 224) return true;                           // 224/4 multicast + 240/4 reserved + broadcast
  return false;
}

function mappedV4FromHex(hi: number, lo: number): string {
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

// SSRF address classifier: true for any address that is NOT globally-routable
// unicast — loopback, private, link-local (incl. cloud metadata), CGNAT, ULA,
// multicast, reserved/test ranges, documentation, and IPv4-mapped/NAT64 in
// dotted OR hex form (Node normalizes literals like [::ffff:127.0.0.1] to the
// hex form [::ffff:7f00:1]). Fails closed on malformed input.
function isPrivateAddr(rawIp: string): boolean {
  let ip = rawIp.trim().toLowerCase().replace(/^\[|\]$/g, "");
  const pct = ip.indexOf("%");
  if (pct !== -1) ip = ip.slice(0, pct); // strip zone id
  if (isIPv4(ip)) return ipv4IsDisallowed(ip);
  if (ip === "::" || ip === "::1") return true;
  // IPv4-mapped/compatible/NAT64 carrying an embedded IPv4 in dotted form
  const dotted = ip.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted && (ip.startsWith("::ffff:") || ip.startsWith("::") || ip.startsWith("64:ff9b::"))) {
    return ipv4IsDisallowed(dotted[1]);
  }
  // IPv4-mapped/NAT64 in hex form, e.g. ::ffff:7f00:1 or 64:ff9b::7f00:1
  const mapped = ip.match(/^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) return ipv4IsDisallowed(mappedV4FromHex(parseInt(mapped[1], 16), parseInt(mapped[2], 16)));
  const first = parseInt(ip.split(":")[0] || "", 16);
  if (Number.isNaN(first)) return true;                // malformed → fail closed
  if (first >= 0xfc00 && first <= 0xfdff) return true; // fc00::/7 ULA
  if (first >= 0xfe80 && first <= 0xfebf) return true; // fe80::/10 link-local
  if (first >= 0xff00) return true;                    // ff00::/8 multicast
  if (ip.startsWith("2001:db8")) return true;          // 2001:db8::/32 documentation
  return false;
}

// Resolve ALL of a hostname's addresses, reject if any is non-public, and pin
// the socket to a vetted address via the `lookup` hook. This closes the DNS
// rebinding / multi-record TOCTOU: the address validated here is the exact one
// connected to (no second resolution). TLS SNI + cert checks still use the
// original hostname, so https verification is preserved.
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookupAll(hostname, { all: true, family: 0 }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = (Array.isArray(addresses) ? addresses : [addresses]) as LookupAddress[];
    if (list.length === 0) return callback(new Error("host did not resolve"), "", 0);
    for (const a of list) {
      if (isPrivateAddr(a.address)) return callback(new Error(`blocked non-public address ${a.address}`), "", 0);
    }
    // Happy Eyeballs (autoSelectFamily, default on) calls lookup with all:true
    // and expects the full array back; otherwise a single address is expected.
    if (options && (options as { all?: boolean }).all) callback(null, list);
    else callback(null, list[0].address, list[0].family);
  });
};

// Fetch a provider-returned image URL into a data URI so image layers never
// depend on a cross-origin host (keeps client-side PNG export from tainting the
// canvas). SSRF-hardened: https-only, IP-pinned to vetted public addresses, no
// redirects, image content-type required, streamed size cap.
function fetchImageAsDataUri(rawUrl: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let u: URL;
    try { u = new URL(rawUrl); } catch { return reject(new RasterConfigError("Anubis returned an invalid image URL", 502)); }
    if (u.protocol !== "https:") return reject(new RasterConfigError("Anubis image URL must be https", 502));
    // IP-literal hosts never invoke the `lookup` hook (Node connects directly),
    // so validate them here to close that bypass.
    const litHost = u.hostname.replace(/^\[|\]$/g, "");
    if (isIP(litHost) !== 0 && isPrivateAddr(litHost)) {
      return reject(new RasterConfigError("Anubis image URL resolves to a disallowed address", 502));
    }
    const req = httpsRequest(u, { method: "GET", lookup: safeLookup, timeout: 90_000 }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) { res.destroy(); return reject(new RasterConfigError("Anubis image URL attempted a redirect (blocked)", 502)); }
      if (status !== 200) { res.destroy(); return reject(new RasterConfigError(`Anubis image URL returned HTTP ${status}`, 502)); }
      const ct = String(res.headers["content-type"] ?? "");
      if (!ct.startsWith("image/")) { res.destroy(); return reject(new RasterConfigError("Anubis image URL did not return an image", 502)); }
      if (Number(res.headers["content-length"] ?? 0) > MAX_RASTER_BYTES) { res.destroy(); return reject(new RasterConfigError("Anubis image exceeds size limit", 502)); }
      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (c: Buffer) => {
        total += c.length;
        if (total > MAX_RASTER_BYTES) { res.destroy(); reject(new RasterConfigError("Anubis image exceeds size limit", 502)); return; }
        chunks.push(c);
      });
      res.on("end", () => resolve(`data:${ct};base64,${Buffer.concat(chunks).toString("base64")}`));
      res.on("error", (e) => reject(new RasterConfigError(`Anubis image fetch error: ${e.message}`, 502)));
    });
    req.on("timeout", () => req.destroy(new Error("Anubis image fetch timed out")));
    req.on("error", (e) => reject(e instanceof RasterConfigError ? e : new RasterConfigError(`Anubis image fetch failed: ${e.message}`, 502)));
    req.end();
  });
}

// ── Live KAPPA data (mirrors /api/social/data; engine-only, zero mock) ──────
function getLiveData() {
  const k = kappaEngine.getStatus() as Record<string, any>;
  const domainCounts: Record<string, number> = {};
  for (const [domain, count] of Object.entries(k.domainWindows ?? {})) {
    domainCounts[domain] = count as number;
  }
  const totalEvents = k.eventsProcessed ?? 0;
  const totalCorrelations = Object.values(k.correlationCounts ?? {}).reduce(
    (a: number, b: unknown) => a + (b as number),
    0,
  );
  const score = Math.round(k.kappaScore ?? k.score ?? 0);
  return {
    score,
    threatLevel: k.threatLevel ?? "—",
    totalEvents,
    totalCorrelations,
    satellitesOverhead: k.satOverhead ?? 0,
    satellitesVisible: k.satOverhead ?? 0,
    satellitesKlein: k.satKlein ?? 0,
    domainCounts,
    activeDomains: Object.keys(domainCounts).filter((d) => domainCounts[d] > 0),
    eveningWindowActive: !!k.eveningWindow,
    generatedAt: new Date().toISOString(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// AI / MCP tool layer — the "Photoshop variables" as callable tools.
// ════════════════════════════════════════════════════════════════════════════
interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const SEMANTIC_COLORS = ["$bg", "$surface", "$fg", "$muted", "$line", "$accent", "$accentSoft"];

export const STUDIO_TOOLS: ToolDef[] = [
  {
    name: "set_palette",
    description: "Set the scene's semantic palette. Colors used elsewhere should be tokens ($bg,$surface,$fg,$muted,$line,$accent,$accentSoft) so the design stays consistent.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", enum: ["ink", "paper", "signal", "crimson"] } },
      required: ["name"],
    },
  },
  {
    name: "set_background",
    description: "Set the canvas background fill.",
    inputSchema: {
      type: "object",
      properties: {
        fillType: { type: "string", enum: ["solid", "linear", "radial"] },
        color: { type: "string", description: "primary color (semantic token preferred, e.g. $bg)" },
        colorB: { type: "string", description: "second color for gradients" },
        angle: { type: "number", description: "gradient angle in degrees (linear)" },
      },
      required: ["fillType", "color"],
    },
  },
  {
    name: "add_text",
    description: "Add a text layer. Use the provided type-scale sizes and golden-grid coordinates. NEVER invent metrics — only use values from LIVE DATA or the user's brief.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        w: { type: "number", description: "wrap-box width in px" },
        fontSize: { type: "number" },
        fontFamily: { type: "string", enum: ["sans", "serif", "mono"] },
        fontWeight: { type: "number", enum: [300, 400, 500, 600, 700, 800] },
        color: { type: "string" },
        align: { type: "string", enum: ["left", "center", "right"] },
        uppercase: { type: "boolean" },
        letterSpacing: { type: "number" },
      },
      required: ["text", "x", "y", "w", "fontSize"],
    },
  },
  {
    name: "add_rect",
    description: "Add a rectangle (panel/divider/accent block).",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number" }, y: { type: "number" },
        w: { type: "number" }, h: { type: "number" },
        color: { type: "string" }, cornerRadius: { type: "number" },
        strokeColor: { type: "string" }, strokeWidth: { type: "number" },
      },
      required: ["x", "y", "w", "h"],
    },
  },
  {
    name: "add_ellipse",
    description: "Add an ellipse/dot.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number" }, y: { type: "number" },
        w: { type: "number" }, h: { type: "number" }, color: { type: "string" },
      },
      required: ["x", "y", "w", "h"],
    },
  },
  {
    name: "add_line",
    description: "Add a line/rule. (dx,dy) is the end point relative to (x,y).",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number" }, y: { type: "number" },
        dx: { type: "number" }, dy: { type: "number" },
        color: { type: "string" }, width: { type: "number" },
      },
      required: ["x", "y", "dx", "dy"],
    },
  },
  {
    name: "add_preset",
    description: "Add a signature KAPPA vector mark. golden-grid=composition guides, waveform=46.875Hz sine, ticks=baseline scale, phi-spiral=golden spiral, kappa-mark=κ glyph.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["golden-grid", "waveform", "ticks", "phi-spiral", "kappa-mark"] },
        x: { type: "number" }, y: { type: "number" },
        w: { type: "number" }, h: { type: "number" }, color: { type: "string" },
      },
      required: ["kind", "x", "y"],
    },
  },
  {
    name: "add_image",
    description: "Generate a raster illustration via the art engine and place it as an image layer. Use sparingly for hero imagery; describe the desired image in 'prompt'.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        x: { type: "number" }, y: { type: "number" },
        w: { type: "number" }, h: { type: "number" },
        cornerRadius: { type: "number" },
      },
      required: ["prompt", "x", "y", "w", "h"],
    },
  },
  {
    name: "finish",
    description: "Call when the composition is complete.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

function colorOr(c: unknown, fallback: string): string {
  return typeof c === "string" && c.length ? c : fallback;
}

// Apply a single tool to a scene (mutates a copy). Async because add_image
// generates a real raster. Returns the updated scene.
async function applyTool(
  scene: Scene,
  name: string,
  args: Record<string, any>,
  rasterProvider: "local" | "anubis",
): Promise<Scene> {
  const s: Scene = { ...scene, layers: [...scene.layers] };
  switch (name) {
    case "set_palette":
      if (PALETTES[args.name]) s.palette = args.name;
      break;
    case "set_background": {
      if (args.fillType === "solid") {
        s.background = { type: "solid", color: colorOr(args.color, "$bg") };
      } else if (args.fillType === "linear") {
        s.background = {
          type: "linear",
          angle: typeof args.angle === "number" ? args.angle : 135,
          stops: [
            { offset: 0, color: colorOr(args.color, "$bg") },
            { offset: 1, color: colorOr(args.colorB, "$surface") },
          ],
        };
      } else if (args.fillType === "radial") {
        s.background = {
          type: "radial", cx: 0.5, cy: 0.4, r: 0.8,
          stops: [
            { offset: 0, color: colorOr(args.color, "$surface") },
            { offset: 1, color: colorOr(args.colorB, "$bg") },
          ],
        };
      }
      break;
    }
    case "add_text":
      s.layers.push({
        type: "text", id: lid("t"),
        text: String(args.text ?? ""),
        x: +args.x || 0, y: +args.y || 0, w: +args.w || 800,
        fontSize: +args.fontSize || 48,
        fontFamily: ["sans", "serif", "mono"].includes(args.fontFamily) ? args.fontFamily : "sans",
        fontWeight: +args.fontWeight || 500,
        lineHeight: 1.2,
        letterSpacing: +args.letterSpacing || 0,
        align: ["left", "center", "right"].includes(args.align) ? args.align : "left",
        color: colorOr(args.color, "$fg"),
        uppercase: !!args.uppercase, italic: false,
        rotation: 0, opacity: 1, blendMode: "normal",
      });
      break;
    case "add_rect":
      s.layers.push({
        type: "rect", id: lid("r"),
        x: +args.x || 0, y: +args.y || 0, w: +args.w || 100, h: +args.h || 100,
        fill: { type: "solid", color: colorOr(args.color, "$surface") },
        cornerRadius: +args.cornerRadius || 0,
        stroke: args.strokeColor ? { color: args.strokeColor, width: +args.strokeWidth || 2 } : undefined,
        rotation: 0, opacity: 1, blendMode: "normal",
      });
      break;
    case "add_ellipse":
      s.layers.push({
        type: "ellipse", id: lid("e"),
        x: +args.x || 0, y: +args.y || 0, w: +args.w || 100, h: +args.h || 100,
        fill: { type: "solid", color: colorOr(args.color, "$accent") },
        rotation: 0, opacity: 1, blendMode: "normal",
      });
      break;
    case "add_line":
      s.layers.push({
        type: "line", id: lid("ln"),
        x: +args.x || 0, y: +args.y || 0, dx: +args.dx || 0, dy: +args.dy || 0,
        stroke: { color: colorOr(args.color, "$line"), width: +args.width || 2 },
        rotation: 0, opacity: 1, blendMode: "normal",
      });
      break;
    case "add_preset":
      s.layers.push({
        type: "preset", id: lid("p"),
        kind: ["golden-grid", "waveform", "ticks", "phi-spiral", "kappa-mark"].includes(args.kind) ? args.kind : "waveform",
        x: +args.x || 0, y: +args.y || 0,
        w: args.w != null ? +args.w : undefined, h: args.h != null ? +args.h : undefined,
        color: colorOr(args.color, "$accent"),
        rotation: 0, opacity: 1, blendMode: "normal",
      });
      break;
    case "add_image": {
      const dataUri = await generateRaster(String(args.prompt ?? "").slice(0, MAX_PROMPT), rasterProvider);
      s.layers.push({
        type: "image", id: lid("img"),
        x: +args.x || 0, y: +args.y || 0, w: +args.w || 400, h: +args.h || 400,
        src: dataUri, fit: "cover", cornerRadius: +args.cornerRadius || 0,
        rotation: 0, opacity: 1, blendMode: "normal",
        sourceRefs: [{ kind: "raster", ref: `${rasterProvider}:${String(args.prompt ?? "").slice(0, 60)}` }],
      });
      break;
    }
    case "finish":
      break;
    default:
      break;
  }
  return s;
}

// ── Raster adapter ──────────────────────────────────────────────────────────
class RasterConfigError extends Error {
  status: number;
  constructor(message: string, status = 501) {
    super(message);
    this.status = status;
  }
}

async function generateRaster(prompt: string, provider: "local" | "anubis"): Promise<string> {
  if (!prompt.trim()) throw new RasterConfigError("Empty raster prompt", 400);
  if (provider === "anubis") {
    const url = process.env.ANUBIS_GENERATE_URL;
    if (!url) {
      throw new RasterConfigError(
        "Anubis raster provider is not configured. Set ANUBIS_GENERATE_URL (and optionally ANUBIS_API_KEY) to the confirmed Anubis generate endpoint.",
        501,
      );
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.ANUBIS_API_KEY) headers["Authorization"] = `Bearer ${process.env.ANUBIS_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!r.ok) throw new RasterConfigError(`Anubis returned HTTP ${r.status}`, 502);
    const ct = r.headers.get("content-type") ?? "";
    if (ct.startsWith("image/")) {
      const buf = Buffer.from(await r.arrayBuffer());
      return `data:${ct};base64,${buf.toString("base64")}`;
    }
    const j = (await r.json()) as Record<string, any>;
    const b64 = j.b64_json ?? j.image_base64 ?? j.image ?? j.b64 ?? null;
    if (typeof b64 === "string" && b64.length > 100) return `data:image/png;base64,${b64}`;
    if (typeof j.url === "string") {
      return await fetchImageAsDataUri(j.url);
    }
    throw new RasterConfigError("Anubis response shape not recognized (no image/b64/url field). Update the adapter once the contract is confirmed.", 502);
  }
  // default: real first-party gpt-image-1
  const buf = await generateImageBuffer(prompt, "1024x1024");
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// ════════════════════════════════════════════════════════════════════════════
// Presets — built from LIVE data only (zero mock).
// ════════════════════════════════════════════════════════════════════════════
type PresetKind = "kappa_score" | "satellite_window" | "correlation_summary";

export const PRESET_LIST: { kind: PresetKind; label: string; description: string }[] = [
  { kind: "kappa_score", label: "Kappa Score", description: "Headline κ-score with threat level and live counts." },
  { kind: "satellite_window", label: "Satellite Window", description: "Overhead/visible satellite intelligence card." },
  { kind: "correlation_summary", label: "Correlation Summary", description: "Cross-domain correlation totals and active domains." },
];

function buildPreset(kind: PresetKind, format: FormatKey, palette: string): Scene {
  const d = getLiveData();
  const { w, h } = FORMATS[format];
  const ts = typeScale(w);
  const g = gridFor(format);
  const m = g.margin;
  const dataSources = [{ kind: "live" as const, ref: "/api/social/data", note: `captured ${d.generatedAt}` }];

  const base: Scene = {
    format, palette: palette as Scene["palette"],
    background: { type: "linear", angle: 135, stops: [{ offset: 0, color: "$bg" }, { offset: 1, color: "$surface" }] },
    layers: [
      { type: "preset", id: lid("p"), kind: "golden-grid", x: 0, y: 0, color: "$line", rotation: 0, opacity: 0.5, blendMode: "normal" },
    ],
    dataSources,
  };

  const header = (label: string): Scene["layers"][number] => ({
    type: "text", id: lid("t"), text: "KAPPA · " + label, x: m, y: m, w: w - 2 * m,
    fontSize: ts.caption, fontFamily: "mono", fontWeight: 500, lineHeight: 1.2,
    letterSpacing: 3, align: "left", color: "$muted", uppercase: true, italic: false,
    rotation: 0, opacity: 1, blendMode: "normal",
  });
  const footer = (): Scene["layers"][number] => ({
    type: "text", id: lid("t"), text: new Date(d.generatedAt).toUTCString(), x: m, y: h - m - ts.caption,
    w: w - 2 * m, fontSize: ts.micro, fontFamily: "mono", fontWeight: 400, lineHeight: 1.2,
    letterSpacing: 1, align: "left", color: "$muted", uppercase: false, italic: false,
    rotation: 0, opacity: 1, blendMode: "normal",
  });

  if (kind === "kappa_score") {
    base.title = `KAPPA Score ${d.score}`;
    base.layers.push(
      header("Surveillance Intensity"),
      { type: "text", id: lid("t"), text: String(d.score), x: m, y: g.cy - ts.display, w: w - 2 * m,
        fontSize: ts.display, fontFamily: "sans", fontWeight: 800, lineHeight: 1, letterSpacing: -4,
        align: "left", color: "$accent", uppercase: false, italic: false, rotation: 0, opacity: 1, blendMode: "normal",
        sourceRefs: [{ kind: "live", ref: "/api/social/data#score" }] },
      { type: "text", id: lid("t"), text: d.threatLevel, x: m, y: g.cy + ts.h3, w: w - 2 * m,
        fontSize: ts.h2, fontFamily: "sans", fontWeight: 600, lineHeight: 1.1, letterSpacing: 0,
        align: "left", color: "$fg", uppercase: true, italic: false, rotation: 0, opacity: 1, blendMode: "normal",
        sourceRefs: [{ kind: "live", ref: "/api/social/data#threatLevel" }] },
      { type: "preset", id: lid("p"), kind: "waveform", x: m, y: g.cy + ts.h2 * 1.6, w: w - 2 * m, h: 80,
        color: "$accent", rotation: 0, opacity: 0.9, blendMode: "normal", params: { amp: 28 } },
      { type: "text", id: lid("t"),
        text: `${d.totalEvents} events   ·   ${d.totalCorrelations} correlations   ·   ${d.satellitesOverhead} sats overhead`,
        x: m, y: h - m - ts.body - ts.caption, w: w - 2 * m, fontSize: ts.body, fontFamily: "mono",
        fontWeight: 400, lineHeight: 1.4, letterSpacing: 0, align: "left", color: "$muted", uppercase: false,
        italic: false, rotation: 0, opacity: 1, blendMode: "normal",
        sourceRefs: [{ kind: "live", ref: "/api/social/data#totals" }] },
      footer(),
    );
  } else if (kind === "satellite_window") {
    base.title = "Satellite Window";
    base.layers.push(
      header("Orbital Intelligence"),
      { type: "preset", id: lid("p"), kind: "phi-spiral", x: w - m - 40, y: m + 60, color: "$accentSoft",
        rotation: 0, opacity: 0.7, blendMode: "normal", params: { scale: 10, turns: 8 } },
      { type: "text", id: lid("t"), text: String(d.satellitesOverhead), x: m, y: g.gy[0] - ts.display, w: w - 2 * m,
        fontSize: ts.display, fontFamily: "sans", fontWeight: 800, lineHeight: 1, letterSpacing: -4, align: "left",
        color: "$accent", uppercase: false, italic: false, rotation: 0, opacity: 1, blendMode: "normal",
        sourceRefs: [{ kind: "live", ref: "/api/social/data#satellitesOverhead" }] },
      { type: "text", id: lid("t"), text: "satellites overhead", x: m, y: g.gy[0] + 8, w: w - 2 * m,
        fontSize: ts.h3, fontFamily: "sans", fontWeight: 500, lineHeight: 1.1, letterSpacing: 0, align: "left",
        color: "$fg", uppercase: false, italic: false, rotation: 0, opacity: 1, blendMode: "normal" },
      { type: "text", id: lid("t"), text: `${d.satellitesKlein} in Klein-twist geometry`, x: m, y: g.gy[0] + 8 + ts.h3 * 1.6,
        w: w - 2 * m, fontSize: ts.body, fontFamily: "mono", fontWeight: 400, lineHeight: 1.3, letterSpacing: 0,
        align: "left", color: "$muted", uppercase: false, italic: false, rotation: 0, opacity: 1, blendMode: "normal",
        sourceRefs: [{ kind: "live", ref: "/api/social/data#satellitesKlein" }] },
      footer(),
    );
  } else {
    base.title = "Correlation Summary";
    const domains = d.activeDomains.slice(0, 6);
    const maxCount = Math.max(1, ...domains.map((dm) => d.domainCounts[dm] ?? 0));
    const barTop = g.cy - 40;
    const barW = w - 2 * m;
    const rowH = 56;
    base.layers.push(
      header("Cross-Domain Correlation"),
      { type: "text", id: lid("t"), text: String(d.totalCorrelations), x: m, y: m + ts.caption * 2, w: w - 2 * m,
        fontSize: ts.h1, fontFamily: "sans", fontWeight: 800, lineHeight: 1, letterSpacing: -2, align: "left",
        color: "$accent", uppercase: false, italic: false, rotation: 0, opacity: 1, blendMode: "normal",
        sourceRefs: [{ kind: "live", ref: "/api/social/data#totalCorrelations" }] },
      { type: "text", id: lid("t"), text: "active correlations", x: m, y: m + ts.caption * 2 + ts.h1, w: w - 2 * m,
        fontSize: ts.body, fontFamily: "mono", fontWeight: 400, lineHeight: 1.2, letterSpacing: 1, align: "left",
        color: "$muted", uppercase: true, italic: false, rotation: 0, opacity: 1, blendMode: "normal" },
    );
    domains.forEach((dm, i) => {
      const y = barTop + i * rowH;
      const frac = (d.domainCounts[dm] ?? 0) / maxCount;
      base.layers.push(
        { type: "text", id: lid("t"), text: dm, x: m, y, w: 240, fontSize: ts.caption, fontFamily: "mono",
          fontWeight: 500, lineHeight: 1, letterSpacing: 1, align: "left", color: "$fg", uppercase: true, italic: false,
          rotation: 0, opacity: 1, blendMode: "normal" },
        { type: "rect", id: lid("r"), x: m + 260, y: y - 4, w: (barW - 360) , h: 18, fill: { type: "solid", color: "$line" },
          cornerRadius: 9, rotation: 0, opacity: 1, blendMode: "normal" },
        { type: "rect", id: lid("r"), x: m + 260, y: y - 4, w: Math.max(8, (barW - 360) * frac), h: 18,
          fill: { type: "solid", color: "$accent" }, cornerRadius: 9, rotation: 0, opacity: 1, blendMode: "normal",
          sourceRefs: [{ kind: "live", ref: `/api/social/data#domainCounts.${dm}` }] },
        { type: "text", id: lid("t"), text: String(d.domainCounts[dm] ?? 0), x: w - m - 80, y, w: 80, fontSize: ts.caption,
          fontFamily: "mono", fontWeight: 600, lineHeight: 1, letterSpacing: 0, align: "right", color: "$muted",
          uppercase: false, italic: false, rotation: 0, opacity: 1, blendMode: "normal" },
      );
    });
    base.layers.push(footer());
  }
  return base;
}

// ════════════════════════════════════════════════════════════════════════════
// Routes
// ════════════════════════════════════════════════════════════════════════════

// MCP-shaped tool discovery (public, read-only).
studioRouter.get("/tools", (_req: Request, res: Response) => {
  res.json({
    tools: STUDIO_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
  });
});

// MCP-shaped single tool call (privileged: can trigger raster generation).
studioRouter.post("/tools/call", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, arguments: args, scene } = req.body ?? {};
    if (typeof name !== "string") return res.status(400).json({ error: "name required" });
    const parsed = sceneSchema.safeParse(scene ?? { format: "square", palette: "ink", background: { type: "solid", color: "$bg" }, layers: [] });
    if (!parsed.success) return res.status(400).json({ error: "invalid scene", details: parsed.error.flatten() });
    const provider = req.body?.rasterProvider === "anubis" ? "anubis" : "local";
    const next = await applyTool(parsed.data, name, args ?? {}, provider);
    res.json({ scene: next, svg: renderScene(next) });
  } catch (err) {
    const status = err instanceof RasterConfigError ? err.status : 500;
    res.status(status).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// Render a scene to SVG (validation only; no external cost).
studioRouter.post("/render", (req: Request, res: Response) => {
  const parsed = sceneSchema.safeParse(req.body?.scene);
  if (!parsed.success) return res.status(400).json({ error: "invalid scene", details: parsed.error.flatten() });
  res.json({ svg: renderScene(parsed.data) });
});

// List presets.
studioRouter.get("/presets", (_req: Request, res: Response) => {
  res.json({ presets: PRESET_LIST });
});

// Build a preset scene from LIVE data.
studioRouter.post("/preset/:kind", (req: Request, res: Response) => {
  const kind = req.params.kind as PresetKind;
  if (!PRESET_LIST.some((p) => p.kind === kind)) return res.status(404).json({ error: "unknown preset" });
  const format = (["square", "portrait", "story"].includes(req.body?.format) ? req.body.format : "square") as FormatKey;
  const palette = ["ink", "paper", "signal", "crimson"].includes(req.body?.palette) ? req.body.palette : "ink";
  const scene = buildPreset(kind, format, palette);
  res.json({ scene, svg: renderScene(scene) });
});

// AI compose — tool-calling loop grounded in LIVE data (privileged: LLM + raster).
studioRouter.post("/compose", requireAuth, async (req: Request, res: Response) => {
  try {
    const brief = String(req.body?.brief ?? "").slice(0, MAX_PROMPT);
    if (!brief.trim()) return res.status(400).json({ error: "brief required" });
    const format = (["square", "portrait", "story"].includes(req.body?.format) ? req.body.format : "square") as FormatKey;
    const palette = ["ink", "paper", "signal", "crimson"].includes(req.body?.palette) ? req.body.palette : "ink";
    const rasterProvider = req.body?.rasterProvider === "anubis" ? "anubis" : "local";

    const { w, h } = FORMATS[format];
    const ts = typeScale(w);
    const g = gridFor(format);
    const live = getLiveData();

    let scene: Scene = {
      format, palette: palette as Scene["palette"],
      background: { type: "solid", color: "$bg" },
      layers: [],
      dataSources: [{ kind: "live", ref: "/api/social/data", note: `captured ${live.generatedAt}` }],
    };

    const system = [
      "You are STELE, the art director for KAPPA — a SIGINT intelligence platform.",
      "You compose Instagram graphics by calling design tools. Aesthetic: Notion-minimal, editorial, restrained — lots of negative space, ONE accent color, golden-section composition. NOT sci-fi, NOT cluttered.",
      `Canvas: ${w}×${h}px. Origin top-left. Golden-section guides at x=${g.gx.join(",")} y=${g.gy.join(",")}, margin=${g.margin}, center=(${g.cx},${g.cy}).`,
      `Type scale (px): micro ${ts.micro}, caption ${ts.caption}, body ${ts.body}, h3 ${ts.h3}, h2 ${ts.h2}, h1 ${ts.h1}, display ${ts.display}.`,
      `Use ONLY semantic color tokens for consistency: ${SEMANTIC_COLORS.join(" ")}.`,
      "CRITICAL ANTI-FABRICATION RULE: every number, metric, label or statistic MUST come from the LIVE DATA below or the user's brief. NEVER invent, estimate or placeholder a metric. If a value is not in LIVE DATA and not given by the user, do not display it.",
      "Signature elements: use add_preset with waveform (46.875Hz), phi-spiral or golden-grid sparingly for character.",
      "LIVE DATA (the only metrics you may cite):",
      JSON.stringify(live),
      "Build the composition with multiple tool calls, then call finish.",
    ].join("\n");

    const messages: any[] = [
      { role: "system", content: system },
      { role: "user", content: `Brief: ${brief}\nFormat: ${format}. Compose now.` },
    ];
    const tools = STUDIO_TOOLS.map((t) => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.inputSchema },
    }));

    let finished = false;
    for (let step = 0; step < 16 && !finished; step++) {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.6,
      });
      const msg = completion.choices[0]?.message;
      if (!msg) break;
      messages.push(msg);
      const calls = msg.tool_calls ?? [];
      if (calls.length === 0) break;
      for (const call of calls) {
        if (call.type !== "function") {
          messages.push({ role: "tool", tool_call_id: call.id, content: "unsupported tool type" });
          continue;
        }
        let args: Record<string, any> = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }
        if (call.function.name === "finish") {
          finished = true;
          messages.push({ role: "tool", tool_call_id: call.id, content: "ok" });
          continue;
        }
        try {
          scene = await applyTool(scene, call.function.name, args, rasterProvider);
          messages.push({ role: "tool", tool_call_id: call.id, content: "ok" });
        } catch (e) {
          messages.push({ role: "tool", tool_call_id: call.id, content: `error: ${e instanceof Error ? e.message : e}` });
        }
      }
    }

    // Caption — grounded in the same live data, no fabricated metrics.
    let caption = "";
    try {
      const capRes = await openai.chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0.8,
        messages: [
          { role: "system", content: "Write a concise, striking Instagram caption (max 2 sentences + up to 5 hashtags) for a KAPPA SIGINT graphic. Use ONLY the metrics in the provided LIVE DATA; never invent numbers. No legal framing." },
          { role: "user", content: `Brief: ${brief}\nLIVE DATA: ${JSON.stringify(live)}` },
        ],
      });
      caption = capRes.choices[0]?.message?.content?.trim() ?? "";
    } catch { /* caption optional */ }

    scene.caption = caption;
    res.json({ scene, svg: renderScene(scene), caption });
  } catch (err) {
    const status = err instanceof RasterConfigError ? err.status : 500;
    console.error("[studio] compose error:", err);
    res.status(status).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// Raster generation (privileged).
studioRouter.post("/raster", requireAuth, async (req: Request, res: Response) => {
  try {
    const prompt = String(req.body?.prompt ?? "").slice(0, MAX_PROMPT);
    const provider = req.body?.provider === "anubis" ? "anubis" : "local";
    const dataUri = await generateRaster(prompt, provider);
    res.json({ dataUri, provider });
  } catch (err) {
    const status = err instanceof RasterConfigError ? err.status : 500;
    res.status(status).json({ error: String(err instanceof Error ? err.message : err) });
  }
});

// ── Saved posts CRUD (privileged — investigative content) ───────────────────
studioRouter.get("/posts", requireAuth, async (_req: Request, res: Response) => {
  res.json(await storage.getStudioPosts());
});

studioRouter.get("/posts/:id", requireAuth, async (req: Request, res: Response) => {
  const post = await storage.getStudioPost(String(req.params.id));
  if (!post) return res.status(404).json({ error: "not found" });
  res.json(post);
});

studioRouter.post("/posts", requireAuth, async (req: Request, res: Response) => {
  const parsed = insertStudioPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid post", details: parsed.error.flatten() });
  const sceneCheck = sceneSchema.safeParse(parsed.data.scene);
  if (!sceneCheck.success) return res.status(400).json({ error: "invalid scene", details: sceneCheck.error.flatten() });
  res.status(201).json(await storage.createStudioPost(parsed.data));
});

studioRouter.patch("/posts/:id", requireAuth, async (req: Request, res: Response) => {
  const parsed = insertStudioPostSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid patch", details: parsed.error.flatten() });
  if (parsed.data.scene !== undefined) {
    const sceneCheck = sceneSchema.safeParse(parsed.data.scene);
    if (!sceneCheck.success) return res.status(400).json({ error: "invalid scene", details: sceneCheck.error.flatten() });
  }
  const updated = await storage.updateStudioPost(String(req.params.id), parsed.data);
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

studioRouter.delete("/posts/:id", requireAuth, async (req: Request, res: Response) => {
  await storage.deleteStudioPost(String(req.params.id));
  res.status(204).end();
});
