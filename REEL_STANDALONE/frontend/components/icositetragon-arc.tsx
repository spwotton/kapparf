import { useEffect, useMemo, useRef } from "react";
import type { ReelBeat, ReelClip } from "../hooks/use-reel";

const SPOKE_COUNT = 24;
const TILT_RAD = (51.854 * Math.PI) / 180; // golden migration / goose descent angle
const PRIME_SPOKES = new Set([1, 5, 7, 11, 13, 17, 19, 23]);

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 aPos;
in vec3 aColor;
in float aGlow;
uniform vec2 uResolution;
uniform float uTime;
out vec3 vColor;
out float vGlow;
void main() {
  vec2 pos = aPos / uResolution * 2.0 - 1.0;
  pos.y = -pos.y;
  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = 6.0 + aGlow * 8.0;
  vColor = aColor;
  vGlow = aGlow;
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec3 vColor;
in float vGlow;
out vec4 fragColor;
void main() {
  // For points: build a soft circular glow. For lines: gl_PointCoord is
  // undefined but we just emit the line color.
  vec2 d = gl_PointCoord - vec2(0.5);
  float r2 = dot(d, d);
  if (gl_PointCoord.x == 0.0 && gl_PointCoord.y == 0.0) {
    fragColor = vec4(vColor, 1.0);
    return;
  }
  if (r2 > 0.25) discard;
  float core = smoothstep(0.25, 0.0, r2);
  vec3 c = vColor * (0.6 + core * 0.6) + vColor * vGlow * core * 0.8;
  fragColor = vec4(c, core);
}`;

type Props = {
  beats: ReelBeat[];
  clips?: ReelClip[];
  activeIndex?: number | null;
  onSelect?: (spoke: number) => void;
  size?: number;
};

type SpokeColor = { r: number; g: number; b: number; glow: number };

function hsl(h: number, s: number, l: number, glow = 0): SpokeColor {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return { r: r + m, g: g + m, b: b + m, glow };
}

export function IcositetragonArc({ beats, clips, activeIndex, onSelect, size = 360 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    aPos: number;
    aColor: number;
    aGlow: number;
    uRes: WebGLUniformLocation | null;
    uTime: WebGLUniformLocation | null;
    vbo: WebGLBuffer;
    pointVbo: WebGLBuffer;
    raf: number;
  } | null>(null);

  const beatBySpoke = useMemo(() => {
    const m = new Map<number, { beat: ReelBeat; clip?: ReelClip }>();
    beats.forEach((b) => m.set(b.spoke, { beat: b, clip: clips?.find((c) => c.beatIndex === b.spoke) }));
    return m;
  }, [beats, clips]);

  // Init GL once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, antialias: true });
    if (!gl) return;
    const compile = (src: string, type: number) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("[icositetragon-arc] shader error:", gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(VERT_SRC, gl.VERTEX_SHADER));
    gl.attachShader(program, compile(FRAG_SRC, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[icositetragon-arc] link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const aPos = gl.getAttribLocation(program, "aPos");
    const aColor = gl.getAttribLocation(program, "aColor");
    const aGlow = gl.getAttribLocation(program, "aGlow");
    const uRes = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");

    const vbo = gl.createBuffer()!;
    const pointVbo = gl.createBuffer()!;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    stateRef.current = { gl, program, aPos, aColor, aGlow, uRes, uTime, vbo, pointVbo, raf: 0 };

    return () => {
      cancelAnimationFrame(stateRef.current?.raf ?? 0);
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(pointVbo);
      gl.deleteProgram(program);
    };
  }, []);

  // Render loop — re-uses the same state, picks up beat/clip changes via ref.
  useEffect(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const { gl } = s;
    gl.viewport(0, 0, canvas.width, canvas.height);

    let start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rOuter = canvas.width * 0.42;
      const rHub = canvas.width * 0.06;

      const lineVerts: number[] = [];
      const pointVerts: number[] = [];

      const baseRot = TILT_RAD + t * 0.06;
      // Polygon ring
      for (let i = 0; i < SPOKE_COUNT; i++) {
        const a1 = baseRot + (i / SPOKE_COUNT) * 2 * Math.PI - Math.PI / 2;
        const a2 = baseRot + ((i + 1) / SPOKE_COUNT) * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + Math.cos(a1) * rOuter;
        const y1 = cy + Math.sin(a1) * rOuter;
        const x2 = cx + Math.cos(a2) * rOuter;
        const y2 = cy + Math.sin(a2) * rOuter;
        const ringCol = hsl(38, 0.55, 0.35, 0);
        lineVerts.push(x1, y1, ringCol.r, ringCol.g, ringCol.b, 0);
        lineVerts.push(x2, y2, ringCol.r, ringCol.g, ringCol.b, 0);
      }

      // Spokes
      for (let i = 0; i < SPOKE_COUNT; i++) {
        const a = baseRot + (i / SPOKE_COUNT) * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + Math.cos(a) * rHub;
        const y1 = cy + Math.sin(a) * rHub;
        const x2 = cx + Math.cos(a) * rOuter;
        const y2 = cy + Math.sin(a) * rOuter;
        const slot = beatBySpoke.get(i);
        const beat = slot?.beat;
        const clip = slot?.clip;
        const isActive = activeIndex === i;
        const isPrime = PRIME_SPOKES.has(i + 1);

        let col: SpokeColor = hsl(220, 0.08, 0.22, 0);
        if (beat) {
          const psi = clip?.psiScore?.psi ?? beat.psiTarget;
          const balance = 1 - Math.min(1, Math.abs(psi - 1));
          const hue = balance > 0.6 ? 38 : balance > 0.3 ? 28 : 0;
          col = hsl(hue, 0.7 + balance * 0.2, 0.4 + balance * 0.25, balance * 0.6);
        }
        // Sonata section base tint (applied when a beat has a section but no
        // clip status yet overrides it). Exposition=blue, Development=orange,
        // Recapitulation=teal — these are dim background hints, not loud.
        if (beat && !clip && beat.sonataSection) {
          if (beat.sonataSection === "exposition")     col = hsl(220, 0.55, 0.32, 0.35);
          if (beat.sonataSection === "development")    col = hsl(28,  0.65, 0.38, 0.40);
          if (beat.sonataSection === "recapitulation") col = hsl(180, 0.50, 0.32, 0.35);
        }
        if (clip?.status === "running") col = hsl(180, 0.7, 0.55, 0.5 + 0.5 * Math.sin(t * 4));
        if (clip?.status === "error") col = hsl(0, 0.7, 0.55, 0.6);
        if (clip?.status === "done") col = hsl(140, 0.6, 0.5, 0.7);
        if (isActive) col = { ...col, glow: 1 };
        const widthBoost = isActive ? 1 : isPrime ? 0.7 : beat ? 0.5 : 0.3;

        // Encode "thickness" as glow for the point endpoint and as alpha-on-line for the segment
        lineVerts.push(x1, y1, col.r, col.g, col.b, widthBoost);
        lineVerts.push(x2, y2, col.r, col.g, col.b, widthBoost);

        if (beat || isActive) {
          pointVerts.push(x2, y2, col.r, col.g, col.b, widthBoost + (isActive ? 0.6 : 0));
        }
      }

      // Hub ring
      for (let i = 0; i < 48; i++) {
        const a1 = baseRot + (i / 48) * 2 * Math.PI;
        const a2 = baseRot + ((i + 1) / 48) * 2 * Math.PI;
        const hubCol = hsl(38, 0.6, 0.45, 0.2);
        lineVerts.push(cx + Math.cos(a1) * rHub, cy + Math.sin(a1) * rHub, hubCol.r, hubCol.g, hubCol.b, 0.3);
        lineVerts.push(cx + Math.cos(a2) * rHub, cy + Math.sin(a2) * rHub, hubCol.r, hubCol.g, hubCol.b, 0.3);
      }

      gl.clearColor(0.04, 0.04, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(s.program);
      gl.uniform2f(s.uRes, canvas.width, canvas.height);
      gl.uniform1f(s.uTime, t);

      const stride = 6 * 4;
      const bind = (data: Float32Array, buf: WebGLBuffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(s.aPos);
        gl.vertexAttribPointer(s.aPos, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(s.aColor);
        gl.vertexAttribPointer(s.aColor, 3, gl.FLOAT, false, stride, 8);
        gl.enableVertexAttribArray(s.aGlow);
        gl.vertexAttribPointer(s.aGlow, 1, gl.FLOAT, false, stride, 20);
      };

      bind(new Float32Array(lineVerts), s.vbo);
      gl.lineWidth(1);
      gl.drawArrays(gl.LINES, 0, lineVerts.length / 6);

      if (pointVerts.length > 0) {
        bind(new Float32Array(pointVerts), s.pointVbo);
        gl.drawArrays(gl.POINTS, 0, pointVerts.length / 6);
      }

      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
  }, [size, beatBySpoke, activeIndex]);

  // Hit-testing: figure out which spoke was clicked from canvas-relative coords.
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelect) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2;
    const r = Math.sqrt(x * x + y * y);
    if (r < canvas.width * 0.05 || r > canvas.width * 0.5) return;
    // Reverse the rotation: we don't have a reliable phase here without the
    // current uTime, so instead we compute the angle and round to spoke 0..23
    // using the static tilt only (animation is slow enough to remain usable).
    const angle = Math.atan2(y, x) + Math.PI / 2 - TILT_RAD;
    const norm = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const spoke = Math.round(norm / (2 * Math.PI) * SPOKE_COUNT) % SPOKE_COUNT;
    if (beatBySpoke.has(spoke)) onSelect(spoke);
  };

  return (
    <div style={{ position: "relative", width: size, height: size }} role="img" aria-label="Icositetragon narrative arc, 24 spokes">
      <canvas
        ref={canvasRef}
        onClick={onClick}
        style={{ width: size, height: size, display: "block", cursor: "crosshair" }}
      />
      {/* Spoke index labels (DOM overlay so we don't have to rasterise glyphs in WebGL) */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: SPOKE_COUNT }, (_, i) => {
          if (!beatBySpoke.has(i)) return null;
          const a = TILT_RAD + (i / SPOKE_COUNT) * 2 * Math.PI - Math.PI / 2;
          const r = size * 0.46;
          return (
            <text
              key={i}
              x={size / 2 + Math.cos(a) * r}
              y={size / 2 + Math.sin(a) * r + 3}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize={9}
              fill="hsl(38 50% 70%)"
              opacity={0.85}
            >
              {i + 1}
            </text>
          );
        })}
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize={10} fill="hsl(38 60% 60%)">24</text>
      </svg>
    </div>
  );
}
