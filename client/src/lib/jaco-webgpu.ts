// ─── KAPPA WebGPU Tactical Renderer ──────────────────────────────────────────
// First-principles WebGPU engine for Jacó Valley 3D tactical scene.
// Architecture:  Float32Array GPU memory → immutable pipeline states → WGSL shaders
// Fallback: returns null if WebGPU unavailable → caller uses Three.js

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WGPULiveAircraft {
  icao24: string; callsign: string | null;
  latitude: number; longitude: number;
  baroAltitude: number | null; geoAltitude: number | null;
  velocity: number | null; trueTrack: number | null;
}

export interface WGPUSceneTarget {
  id: string; label: string; lat: number; lon: number; elevM: number;
  type: string; color: number;
}

export interface WGPUSceneHandle {
  destroy: () => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getCanvas: () => HTMLCanvasElement;
  focusTarget: (idx: number) => void;
  updateAircraft: (aircraft: WGPULiveAircraft[]) => void;
}

// ── Scene coordinate constants (match jaco-map.tsx) ──────────────────────────

const CENTER_LAT = 9.621887;
const CENTER_LON = -84.63969;
const METERS_PER_DEG_LAT = 111320;
const METERS_PER_DEG_LON = 111320 * Math.cos(CENTER_LAT * Math.PI / 180);
const SCENE_SCALE = 80;
const TERRAIN_GRID = 48;

function lls([lat, lon, elevM = 0]: [number, number, number?]): [number, number, number] {
  return [
    ((lon - CENTER_LON) * METERS_PER_DEG_LON) / SCENE_SCALE,
    elevM / SCENE_SCALE,
    -((lat - CENTER_LAT) * METERS_PER_DEG_LAT) / SCENE_SCALE,
  ];
}

function acY(altM: number | null): number {
  return Math.min(45, Math.max(8, 8 + ((altM ?? 1000) / 12000) * 37));
}

// ── Column-major mat4 math (WGSL-compatible) ──────────────────────────────────
// Index convention: m[col * 4 + row]

type M4 = Float32Array;

function m4id(): M4 {
  return new Float32Array([1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1]);
}

// WebGPU NDC: z ∈ [0, 1], right-handed, -z forward
function m4persp(fovY: number, aspect: number, near: number, far: number): M4 {
  const f = 1 / Math.tan(fovY * 0.5);
  const ri = 1 / (near - far);
  const m = new Float32Array(16);
  m[0]  = f / aspect;
  m[5]  = f;
  m[10] = far * ri;
  m[11] = -1;
  m[14] = near * far * ri;
  return m;
}

function m4lookAt(
  eye: [number, number, number],
  ctr: [number, number, number],
  up: [number, number, number],
): M4 {
  let [fx, fy, fz] = [ctr[0] - eye[0], ctr[1] - eye[1], ctr[2] - eye[2]];
  const fl = Math.sqrt(fx*fx + fy*fy + fz*fz);
  fx /= fl; fy /= fl; fz /= fl;

  let rx = fy * up[2] - fz * up[1];
  let ry = fz * up[0] - fx * up[2];
  let rz = fx * up[1] - fy * up[0];
  const rl = Math.sqrt(rx*rx + ry*ry + rz*rz);
  rx /= rl; ry /= rl; rz /= rl;

  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  const m = new Float32Array(16);
  m[0]  = rx;  m[1]  = ux;  m[2]  = -fx; m[3]  = 0;
  m[4]  = ry;  m[5]  = uy;  m[6]  = -fy; m[7]  = 0;
  m[8]  = rz;  m[9]  = uz;  m[10] = -fz; m[11] = 0;
  m[12] = -(rx*eye[0] + ry*eye[1] + rz*eye[2]);
  m[13] = -(ux*eye[0] + uy*eye[1] + uz*eye[2]);
  m[14] =   fx*eye[0] + fy*eye[1] + fz*eye[2];
  m[15] = 1;
  return m;
}

function m4mul(a: M4, b: M4): M4 {
  const m = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + row] * b[col * 4 + k];
      m[col * 4 + row] = s;
    }
  }
  return m;
}

// ── WGSL Shaders ─────────────────────────────────────────────────────────────

// Uniform layout (shared, binding 0):
//   mvp[0..15]       64 bytes  (mat4x4<f32>)
//   time[16]          4 bytes
//   fogDensity[17]    4 bytes
//   _pad[18..19]      8 bytes  → total 80 bytes

const TERRAIN_WGSL = /* wgsl */`
struct Uni { mvp: mat4x4<f32>, time: f32, fogDensity: f32, _pad: vec2<f32> }
@group(0) @binding(0) var<uniform> uni: Uni;

struct VOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) worldY: f32,
  @location(1) worldDist: f32,
}

@vertex fn vs(@location(0) pos: vec3<f32>) -> VOut {
  var o: VOut;
  o.clip      = uni.mvp * vec4<f32>(pos, 1.0);
  o.worldY    = pos.y;
  o.worldDist = length(pos.xz);
  return o;
}

@fragment fn fs(in: VOut) -> @location(0) vec4<f32> {
  let h = clamp(in.worldY / 1.8, 0.0, 1.0);
  let beach   = vec3<f32>(0.15, 0.13, 0.10);
  let jungle  = vec3<f32>(0.04, 0.11, 0.04);
  let midland = vec3<f32>(0.05, 0.09, 0.05);
  let ridge   = vec3<f32>(0.07, 0.08, 0.06);
  let rock    = vec3<f32>(0.12, 0.10, 0.09);
  var col = mix(beach, jungle,  smoothstep(0.00, 0.12, h));
  col     = mix(col,   midland, smoothstep(0.12, 0.40, h));
  col     = mix(col,   ridge,   smoothstep(0.40, 0.70, h));
  col     = mix(col,   rock,    smoothstep(0.80, 1.00, h));
  // κ-scan pulse — subtle teal shimmer
  let scanY = fract(uni.time * 0.11) * 2.1;
  let sd    = abs(h - clamp(scanY, 0.0, 1.0));
  if (sd < 0.004) { col += vec3<f32>(0.0, 0.08, 0.07) * (1.0 - sd / 0.004); }
  // exponential fog
  let fog = 1.0 - exp(-uni.fogDensity * in.worldDist);
  col = mix(col, vec3<f32>(0.008, 0.025, 0.045), fog);
  return vec4<f32>(col, 1.0);
}
`;

// Marker struct: 48 bytes (3 × vec4<f32>)
// worldPos.w = height, size.x = half-width
const MARKER_WGSL = /* wgsl */`
struct Uni { mvp: mat4x4<f32>, time: f32, _pad: vec3<f32> }
struct Mk  { worldPos: vec4<f32>, color: vec4<f32>, size: vec4<f32> }
@group(0) @binding(0) var<uniform>         uni: Uni;
@group(0) @binding(1) var<storage, read>   markers: array<Mk>;

struct VOut { @builtin(position) clip: vec4<f32>, @location(0) col: vec4<f32>, @location(1) ly: f32 }

@vertex fn vs(@location(0) lp: vec3<f32>, @builtin(instance_index) ii: u32) -> VOut {
  let mk = markers[ii];
  let world = vec3<f32>(
    mk.worldPos.x + lp.x * mk.size.x,
    lp.y * mk.worldPos.w,
    mk.worldPos.z + lp.z * mk.size.x,
  );
  var o: VOut;
  o.clip = uni.mvp * vec4<f32>(world, 1.0);
  o.col  = mk.color;
  o.ly   = lp.y;
  return o;
}

@fragment fn fs(in: VOut) -> @location(0) vec4<f32> {
  var c = in.col.rgb;
  if (in.ly > 0.88) { c = c * 1.7 + 0.15; }                   // bright cap
  c *= 0.82 + sin(uni.time * 2.4) * 0.18;                      // pulse
  return vec4<f32>(c, in.col.a);
}
`;

// Ring struct: 48 bytes — center.w = inner radius, params.x = outer radius, params.y = phase
const RING_WGSL = /* wgsl */`
struct Uni  { mvp: mat4x4<f32>, time: f32, _pad: vec3<f32> }
struct Ring { center: vec4<f32>, color: vec4<f32>, params: vec4<f32> }
@group(0) @binding(0) var<uniform>         uni: Uni;
@group(0) @binding(1) var<storage, read>   rings: array<Ring>;

struct VOut { @builtin(position) clip: vec4<f32>, @location(0) col: vec4<f32> }

@vertex fn vs(
  @location(0) dir: vec3<f32>,
  @builtin(vertex_index) vi: u32,
  @builtin(instance_index) ii: u32,
) -> VOut {
  let rg     = rings[ii];
  let inner  = rg.center.w;
  let outer  = rg.params.x;
  let phase  = rg.params.y;
  let radius = select(inner, outer, (vi & 1u) == 1u);
  let world  = vec3<f32>(rg.center.x + dir.x * radius, rg.center.y, rg.center.z + dir.z * radius);
  var o: VOut;
  o.clip = uni.mvp * vec4<f32>(world, 1.0);
  let pulse  = 0.45 + sin(uni.time * 1.8 + phase) * 0.35;
  o.col  = vec4<f32>(rg.color.rgb, rg.color.a * pulse);
  return o;
}

@fragment fn fs(in: VOut) -> @location(0) vec4<f32> { return in.color; }
`;

// Aircraft struct: 48 bytes — heading.x = track radians
const AIRCRAFT_WGSL = /* wgsl */`
struct Uni { mvp: mat4x4<f32>, time: f32, _pad: vec3<f32> }
struct AC  { worldPos: vec4<f32>, color: vec4<f32>, heading: vec4<f32> }
@group(0) @binding(0) var<uniform>         uni: Uni;
@group(0) @binding(1) var<storage, read>   aircraft: array<AC>;

struct VOut { @builtin(position) clip: vec4<f32>, @location(0) col: vec4<f32> }

@vertex fn vs(@location(0) lp: vec3<f32>, @builtin(instance_index) ii: u32) -> VOut {
  let ac   = aircraft[ii];
  let cosH = cos(ac.heading.x);
  let sinH = sin(ac.heading.x);
  let rx   = lp.x * cosH + lp.z * sinH;
  let rz   = -lp.x * sinH + lp.z * cosH;
  let world = vec3<f32>(ac.worldPos.x + rx * 1.4, ac.worldPos.y + lp.y * 1.4, ac.worldPos.z + rz * 1.4);
  var o: VOut;
  o.clip = uni.mvp * vec4<f32>(world, 1.0);
  o.col  = ac.color;
  return o;
}

@fragment fn fs(in: VOut) -> @location(0) vec4<f32> { return in.color; }
`;

// ── Geometry builders ─────────────────────────────────────────────────────────

function buildTerrainBuffers(
  device: GPUDevice,
  elevData: number[][] | null,
): { vBuf: GPUBuffer; iBuf: GPUBuffer; idxCount: number } {
  const G = TERRAIN_GRID;
  const SIZE = 120;
  const gLat0 = CENTER_LAT - 0.04, gLat1 = CENTER_LAT + 0.04;
  const gLon0 = CENTER_LON - 0.055, gLon1 = CENTER_LON + 0.055;

  // Vertex buffer: G×G × vec3 = G×G × 12 bytes
  const verts = new Float32Array(G * G * 3);
  for (let row = 0; row < G; row++) {
    for (let col = 0; col < G; col++) {
      const idx = row * G + col;
      const x = (col / (G - 1) - 0.5) * SIZE;
      const z = (row / (G - 1) - 0.5) * SIZE;
      const lat = gLat0 + (row / (G - 1)) * (gLat1 - gLat0);
      const lon = gLon0 + (col / (G - 1)) * (gLon1 - gLon0);

      let elev = 0;
      if (elevData) {
        elev = elevData[Math.min(row, elevData.length - 1)]?.[Math.min(col, (elevData[0]?.length ?? 1) - 1)] ?? 0;
      } else {
        // Procedural Jacó valley: beach-to-ridge from west to east
        const d = (lon - gLon0) / (gLon1 - gLon0);
        const hill = Math.max(0, (d - 0.45)) * 2.2;
        const n = Math.sin(lat * 420) * Math.cos(lon * 380) * 8
                + Math.sin(lat * 210 + 1.2) * Math.cos(lon * 190 + 0.7) * 15;
        elev = Math.max(0, hill * 180 + n + 3);
        // El Miro dome (radar hill ~110m)
        const dL = lat - 9.617, dN = lon - (-84.623);
        elev += Math.max(0, 110 * Math.exp(-(dL * dL + dN * dN) * 8000));
      }

      verts[idx * 3 + 0] = x;
      verts[idx * 3 + 1] = elev / SCENE_SCALE;
      verts[idx * 3 + 2] = z;
    }
  }

  // Index buffer: (G-1)² × 2 triangles × 3 indices = (G-1)² × 6
  const quadCount = (G - 1) * (G - 1);
  const idxCount = quadCount * 6;
  const indices = new Uint32Array(idxCount);
  let ii = 0;
  for (let row = 0; row < G - 1; row++) {
    for (let col = 0; col < G - 1; col++) {
      const tl = row * G + col;
      const tr = tl + 1;
      const bl = tl + G;
      const br = bl + 1;
      indices[ii++] = tl; indices[ii++] = bl; indices[ii++] = tr;
      indices[ii++] = tr; indices[ii++] = bl; indices[ii++] = br;
    }
  }

  const vBuf = device.createBuffer({
    size: verts.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vBuf, 0, verts);

  const iBuf = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(iBuf, 0, indices);

  return { vBuf, iBuf, idxCount };
}

// Unit box for markers: 8 vertices, 36 indices (12 triangles)
// y ∈ [0, 1], xz ∈ [-1, 1] — scaled by instance data
function buildBoxGeometry(device: GPUDevice): { vBuf: GPUBuffer; iBuf: GPUBuffer; idxCount: number } {
  const V = new Float32Array([
    // bottom face (y=0)
    -1, 0, -1,   1, 0, -1,   1, 0,  1,  -1, 0,  1,
    // top face (y=1)
    -1, 1, -1,   1, 1, -1,   1, 1,  1,  -1, 1,  1,
  ]);
  const I = new Uint16Array([
    0, 1, 2,  0, 2, 3,   // bottom
    4, 6, 5,  4, 7, 6,   // top
    0, 1, 5,  0, 5, 4,   // front (z = -1)
    2, 3, 7,  2, 7, 6,   // back  (z = +1)
    3, 0, 4,  3, 4, 7,   // left  (x = -1)
    1, 2, 6,  1, 6, 5,   // right (x = +1)
  ]);
  const vBuf = device.createBuffer({ size: V.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(vBuf, 0, V);
  const iBuf = device.createBuffer({ size: I.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(iBuf, 0, I);
  return { vBuf, iBuf, idxCount: I.length };
}

// Ring geometry: N segments × 2 vertices (inner/outer) — alternating
function buildRingGeometry(device: GPUDevice, N = 64): { vBuf: GPUBuffer; iBuf: GPUBuffer; idxCount: number } {
  const verts = new Float32Array(N * 2 * 3);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    verts[(i * 2 + 0) * 3 + 0] = c;  verts[(i * 2 + 0) * 3 + 1] = 0;  verts[(i * 2 + 0) * 3 + 2] = s; // inner
    verts[(i * 2 + 1) * 3 + 0] = c;  verts[(i * 2 + 1) * 3 + 1] = 0;  verts[(i * 2 + 1) * 3 + 2] = s; // outer
  }
  // Triangle strip indices, wrapping at N-1 → 0
  const indices = new Uint16Array(N * 6);
  let ii = 0;
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    const a0 = i * 2,    b0 = i * 2 + 1;
    const a1 = next * 2, b1 = next * 2 + 1;
    indices[ii++] = a0; indices[ii++] = b0; indices[ii++] = a1;
    indices[ii++] = b0; indices[ii++] = b1; indices[ii++] = a1;
  }
  const vBuf = device.createBuffer({ size: verts.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(vBuf, 0, verts);
  const iBuf = device.createBuffer({ size: indices.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(iBuf, 0, indices);
  return { vBuf, iBuf, idxCount: indices.length };
}

// Tetrahedron for aircraft markers: 4 vertices, 12 indices
function buildAircraftGeometry(device: GPUDevice): { vBuf: GPUBuffer; iBuf: GPUBuffer; idxCount: number } {
  const V = new Float32Array([
     0.0,  2.0,  0.0,  // apex
    -1.0,  0.0, -1.0,  // front-left
     1.0,  0.0, -1.0,  // front-right
     0.0,  0.0,  1.8,  // rear
  ]);
  const I = new Uint16Array([0, 2, 1,  0, 3, 2,  0, 1, 3,  1, 2, 3]);
  const vBuf = device.createBuffer({ size: V.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(vBuf, 0, V);
  const iBuf = device.createBuffer({ size: I.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(iBuf, 0, I);
  return { vBuf, iBuf, idxCount: I.length };
}

// ── Helper: hex color to [r,g,b] floats ──────────────────────────────────────
function hexRgb(hex: number): [number, number, number] {
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}

// ── Pipeline builder (DRY) ────────────────────────────────────────────────────

function makeOpaqueDepthState(): GPUDepthStencilState {
  return { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less" };
}
function makeTransparentDepthState(): GPUDepthStencilState {
  return { format: "depth24plus", depthWriteEnabled: false, depthCompare: "less-equal" };
}
function makeAlphaBlend(): GPUBlendState {
  return {
    color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
    alpha: { srcFactor: "one",       dstFactor: "one-minus-src-alpha", operation: "add" },
  };
}

// ── Main WebGPU scene builder ─────────────────────────────────────────────────

export async function buildWebGPUScene(
  container: HTMLDivElement,
  targets: WGPUSceneTarget[],
  elevData: number[][] | null,
  setDroneTarget: (s: string) => void,
  setAircraftCount: (n: number) => void,
): Promise<WGPUSceneHandle | null> {

  // ── 1. Availability probe ───────────────────────────────────────────────────
  if (!navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) return null;

  let device: GPUDevice;
  try {
    device = await adapter.requestDevice();
  } catch { return null; }

  // ── 2. Canvas + context ─────────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
  container.appendChild(canvas);
  canvas.width  = container.clientWidth  || 800;
  canvas.height = container.clientHeight || 600;

  const gpuCtx = canvas.getContext("webgpu");
  if (!gpuCtx) { canvas.remove(); device.destroy(); return null; }

  const FORMAT = navigator.gpu.getPreferredCanvasFormat();
  gpuCtx.configure({ device, format: FORMAT, alphaMode: "opaque" });

  // ── 3. Depth texture ────────────────────────────────────────────────────────
  let depthTex = device.createTexture({
    size: [canvas.width, canvas.height, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // ── 4. Shared uniform buffer (80 bytes: mvp64 + time4 + fog4 + pad8) ────────
  const U_SIZE = 80;
  const uBuf = device.createBuffer({ size: U_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

  // ── 5. Terrain ──────────────────────────────────────────────────────────────
  const { vBuf: tVBuf, iBuf: tIBuf, idxCount: tIdxCount } = buildTerrainBuffers(device, elevData);

  const tShader = device.createShaderModule({ code: TERRAIN_WGSL });
  const tPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: tShader, entryPoint: "vs",
      buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] }],
    },
    fragment: { module: tShader, entryPoint: "fs", targets: [{ format: FORMAT }] },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: makeOpaqueDepthState(),
  });
  const tBindGroup = device.createBindGroup({
    layout: tPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uBuf } }],
  });

  // ── 6. Target markers ───────────────────────────────────────────────────────
  // Struct: worldPos(4) + color(4) + size(4) = 12 floats × 4 bytes = 48 bytes per marker
  const MARKER_STRIDE = 48;
  const markerData = new Float32Array(targets.length * 12);
  targets.forEach((tgt, i) => {
    const [wx, wy, wz] = lls([tgt.lat, tgt.lon, tgt.elevM]);
    const [r, g, b] = hexRgb(tgt.color);
    const h = (tgt.type === "radar" ? 2.0 : tgt.type === "crane" ? 1.5 : 0.8);
    const s = (tgt.id === "pochote" ? 0.25 : 0.18);
    const base = i * 12;
    markerData[base + 0] = wx;  markerData[base + 1] = wy;  markerData[base + 2] = wz;  markerData[base + 3] = h;  // worldPos.w = height
    markerData[base + 4] = r;   markerData[base + 5] = g;   markerData[base + 6] = b;   markerData[base + 7] = 1.0;
    markerData[base + 8] = s;   markerData[base + 9] = 0;   markerData[base + 10] = 0;  markerData[base + 11] = 0;
  });
  const markerInstBuf = device.createBuffer({
    size: Math.max(MARKER_STRIDE, markerData.byteLength),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(markerInstBuf, 0, markerData);

  const { vBuf: boxVBuf, iBuf: boxIBuf, idxCount: boxIdxCount } = buildBoxGeometry(device);

  const mkShader = device.createShaderModule({ code: MARKER_WGSL });
  const mkPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: mkShader, entryPoint: "vs",
      buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] }],
    },
    fragment: { module: mkShader, entryPoint: "fs", targets: [{ format: FORMAT }] },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: makeOpaqueDepthState(),
  });
  const mkBindGroup = device.createBindGroup({
    layout: mkPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uBuf } },
      { binding: 1, resource: { buffer: markerInstBuf } },
    ],
  });

  // ── 7. Scan rings ───────────────────────────────────────────────────────────
  // Ring data: center(4) + color(4) + params(4) = 12 floats = 48 bytes each
  // Three scan rings at ECHO position + one per threat target
  const RING_DEFS = [
    { lat: 9.621887, lon: -84.63969, inner: 1.5,   outer: 2.0,   color: [0, 1, 0.8],  alpha: 0.25, phase: 0.0 }, // ECHO close
    { lat: 9.621887, lon: -84.63969, inner: 5.0,   outer: 6.0,   color: [0, 0.8, 1],  alpha: 0.15, phase: 1.2 }, // 400m perimeter
    { lat: 9.621887, lon: -84.63969, inner: 12.0,  outer: 13.5,  color: [0.3, 0.5, 1],alpha: 0.10, phase: 2.4 }, // 1km
    { lat: 9.617,    lon: -84.623,   inner: 2.0,   outer: 3.0,   color: [1, 0.2, 0.2],alpha: 0.22, phase: 0.8 }, // El Miro
    { lat: 9.621,    lon: -84.6295,  inner: 1.2,   outer: 1.8,   color: [1, 0.67, 0], alpha: 0.20, phase: 1.6 }, // Crane
    { lat: 9.626,    lon: -84.641,   inner: 1.0,   outer: 1.6,   color: [0.67, 0.27, 1],alpha: 0.18, phase: 3.0 }, // Breakwater
  ];
  const ringData = new Float32Array(RING_DEFS.length * 12);
  RING_DEFS.forEach((rd, i) => {
    const [wx,, wz] = lls([rd.lat, rd.lon, 0.3]);
    const base = i * 12;
    ringData[base + 0] = wx;  ringData[base + 1] = 0.3;  ringData[base + 2] = wz;  ringData[base + 3] = rd.inner;
    ringData[base + 4] = rd.color[0]; ringData[base + 5] = rd.color[1]; ringData[base + 6] = rd.color[2]; ringData[base + 7] = rd.alpha;
    ringData[base + 8] = rd.outer; ringData[base + 9] = rd.phase; ringData[base + 10] = 0; ringData[base + 11] = 0;
  });
  const ringInstBuf = device.createBuffer({
    size: ringData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(ringInstBuf, 0, ringData);

  const { vBuf: ringVBuf, iBuf: ringIBuf, idxCount: ringIdxCount } = buildRingGeometry(device, 64);
  const rgShader = device.createShaderModule({ code: RING_WGSL });
  const rgPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: rgShader, entryPoint: "vs",
      buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] }],
    },
    fragment: { module: rgShader, entryPoint: "fs", targets: [{ format: FORMAT, blend: makeAlphaBlend(), writeMask: GPUColorWrite.ALL }] },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: makeTransparentDepthState(),
  });
  const rgBindGroup = device.createBindGroup({
    layout: rgPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uBuf } },
      { binding: 1, resource: { buffer: ringInstBuf } },
    ],
  });

  // ── 8. Aircraft ─────────────────────────────────────────────────────────────
  const MAX_AIRCRAFT = 128;
  const AC_STRIDE = 48; // 12 floats
  const { vBuf: acVBuf, iBuf: acIBuf, idxCount: acIdxCount } = buildAircraftGeometry(device);
  const acInstBuf = device.createBuffer({
    size: MAX_AIRCRAFT * AC_STRIDE,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const acShader = device.createShaderModule({ code: AIRCRAFT_WGSL });
  const acPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: acShader, entryPoint: "vs",
      buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] }],
    },
    fragment: { module: acShader, entryPoint: "fs", targets: [{ format: FORMAT }] },
    primitive: { topology: "triangle-list", cullMode: "none" },
    depthStencil: makeOpaqueDepthState(),
  });
  const acBindGroup = device.createBindGroup({
    layout: acPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uBuf } },
      { binding: 1, resource: { buffer: acInstBuf } },
    ],
  });
  let liveAcCount = 0;

  // ── 9. Orbit camera state ───────────────────────────────────────────────────
  let camAz   = Math.PI * 0.25;
  let camEl   = 0.65;
  let camDist = 110;
  let camTX = 0, camTY = 8, camTZ = 0;

  let drag = false;
  let lastX = 0, lastY = 0;

  function onDown(e: PointerEvent) {
    drag = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent) {
    if (!drag) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    camAz -= dx * 0.008;
    camEl  = Math.max(0.08, Math.min(Math.PI * 0.45, camEl + dy * 0.006));
    lastX = e.clientX; lastY = e.clientY;
  }
  function onUp() { drag = false; }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    camDist = Math.max(20, Math.min(280, camDist + e.deltaY * 0.15));
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // ── 10. Resize observer ─────────────────────────────────────────────────────
  const resizeObs = new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    canvas.width = w; canvas.height = h;
    depthTex.destroy();
    depthTex = device.createTexture({
      size: [w, h, 1], format: "depth24plus", usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  });
  resizeObs.observe(container);

  // ── 11. Render loop ─────────────────────────────────────────────────────────
  let running = true;
  const unifData = new Float32Array(20); // 80 bytes

  function frame(ts: number) {
    if (!running) return;
    const t = ts * 0.001;

    // Camera eye position from spherical coords
    const cosEl = Math.cos(camEl), sinEl = Math.sin(camEl);
    const eye: [number, number, number] = [
      camTX + camDist * Math.sin(camAz) * cosEl,
      camTY + camDist * sinEl,
      camTZ + camDist * Math.cos(camAz) * cosEl,
    ];
    const ctr: [number, number, number] = [camTX, camTY, camTZ];

    const view = m4lookAt(eye, ctr, [0, 1, 0]);
    const proj = m4persp(55 * Math.PI / 180, canvas.width / canvas.height, 0.1, 600);
    const mvp  = m4mul(proj, view);

    // Upload uniforms
    unifData.set(mvp, 0);
    unifData[16] = t;
    unifData[17] = 0.0038;  // fog density
    device.queue.writeBuffer(uBuf, 0, unifData);

    // Record commands
    const cmd = device.createCommandEncoder();
    const rp  = cmd.beginRenderPass({
      colorAttachments: [{
        view: gpuCtx.getCurrentTexture().createView(),
        clearValue: { r: 0.008, g: 0.016, b: 0.035, a: 1.0 },
        loadOp: "clear", storeOp: "store",
      }],
      depthStencilAttachment: {
        view: depthTex.createView(),
        depthClearValue: 1.0, depthLoadOp: "clear", depthStoreOp: "store",
      },
    });

    // Pass 1: Terrain (opaque)
    rp.setPipeline(tPipeline);
    rp.setBindGroup(0, tBindGroup);
    rp.setVertexBuffer(0, tVBuf);
    rp.setIndexBuffer(tIBuf, "uint32");
    rp.drawIndexed(tIdxCount);

    // Pass 2: Target markers (opaque, instanced)
    rp.setPipeline(mkPipeline);
    rp.setBindGroup(0, mkBindGroup);
    rp.setVertexBuffer(0, boxVBuf);
    rp.setIndexBuffer(boxIBuf, "uint16");
    rp.drawIndexed(boxIdxCount, targets.length);

    // Pass 3: Aircraft (opaque, instanced — only if contacts exist)
    if (liveAcCount > 0) {
      rp.setPipeline(acPipeline);
      rp.setBindGroup(0, acBindGroup);
      rp.setVertexBuffer(0, acVBuf);
      rp.setIndexBuffer(acIBuf, "uint16");
      rp.drawIndexed(acIdxCount, liveAcCount);
    }

    // Pass 4: Rings (transparent, instanced — rendered last for correct alpha)
    rp.setPipeline(rgPipeline);
    rp.setBindGroup(0, rgBindGroup);
    rp.setVertexBuffer(0, ringVBuf);
    rp.setIndexBuffer(ringIBuf, "uint16");
    rp.drawIndexed(ringIdxCount, RING_DEFS.length);

    rp.end();
    device.queue.submit([cmd.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // ── 12. Return scene handle ─────────────────────────────────────────────────
  return {
    destroy: () => {
      running = false;
      resizeObs.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      depthTex.destroy();
      device.destroy();
      canvas.remove();
    },

    resetView: () => {
      camAz = Math.PI * 0.25; camEl = 0.65; camDist = 110;
      camTX = 0; camTY = 8; camTZ = 0;
    },

    zoomIn:  () => { camDist = Math.max(20, camDist - 18); },
    zoomOut: () => { camDist = Math.min(280, camDist + 18); },

    getCanvas: () => canvas,

    focusTarget: (idx: number) => {
      const tgt = targets[idx];
      if (!tgt) return;
      const [x,, z] = lls([tgt.lat, tgt.lon, 0]);
      camTX = x; camTY = 8; camTZ = z; camDist = 45; camEl = 0.45;
    },

    updateAircraft: (aircraft: WGPULiveAircraft[]) => {
      const valid = aircraft.filter(a => a.latitude && a.longitude);
      const count = Math.min(valid.length, MAX_AIRCRAFT);
      liveAcCount = count;

      if (count === 0) { setAircraftCount(0); return; }

      const data = new Float32Array(count * 12);
      let closest: WGPULiveAircraft | null = null;
      let closestDist = Infinity;

      valid.slice(0, count).forEach((ac, i) => {
        const altM = ac.baroAltitude ?? ac.geoAltitude ?? 1000;
        const [wx,, wz] = lls([ac.latitude, ac.longitude, 0]);
        const wy = acY(altM);

        // Distance to ECHO for closest-contact detection
        const dLat = (ac.latitude - CENTER_LAT) * METERS_PER_DEG_LAT;
        const dLon = (ac.longitude - CENTER_LON) * METERS_PER_DEG_LON;
        const distM = Math.sqrt(dLat * dLat + dLon * dLon);
        if (distM < closestDist) { closestDist = distM; closest = ac; }

        // Threat color (alt-based)
        const alt = altM;
        let [r, g, b] = alt < 500 ? [1.0, 0.0, 0.2] : alt < 1500 ? [1.0, 0.4, 0.0] : alt < 5000 ? [1.0, 0.8, 0.0] : [0.27, 0.53, 0.8];

        const base = i * 12;
        data[base + 0] = wx;  data[base + 1] = wy;  data[base + 2] = wz;  data[base + 3] = 0;
        data[base + 4] = r;   data[base + 5] = g;   data[base + 6] = b;   data[base + 7] = 1;
        data[base + 8] = (ac.trueTrack ?? 0) * Math.PI / 180;
        data[base + 9] = 0;   data[base + 10] = 0;  data[base + 11] = 0;
      });

      device.queue.writeBuffer(acInstBuf, 0, data);
      setAircraftCount(count);

      if (closest) {
        let nearestLabel = "";
        let nearestDist = Infinity;
        targets.forEach(tgt => {
          const dLat = (closest!.latitude - tgt.lat) * METERS_PER_DEG_LAT;
          const dLon = (closest!.longitude - tgt.lon) * METERS_PER_DEG_LON;
          const d = Math.sqrt(dLat * dLat + dLon * dLon);
          if (d < nearestDist) { nearestDist = d; nearestLabel = tgt.label.split("—")[0].trim(); }
        });
        if (nearestLabel) setDroneTarget(nearestLabel);
      }
    },
  };
}
