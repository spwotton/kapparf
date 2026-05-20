import { useEffect, useRef, useState } from "react";

const VERTICES = [
  { x: 100, y: 18 },
  { x: 168, y: 38 },
  { x: 188, y: 90 },
  { x: 150, y: 132 },
  { x: 70,  y: 138 },
  { x: 22,  y: 102 },
  { x: 14,  y: 50  },
  { x: 60,  y: 14  },
];

const EDGES = (() => {
  const e: Array<[number, number]> = [];
  for (let i = 0; i < VERTICES.length; i++) {
    for (let j = i + 1; j < VERTICES.length; j++) {
      e.push([i, j]);
    }
  }
  return e;
})();

const QUIPS = [
  "stitching vertex",
  "tying knot",
  "folding edge",
  "snapping polygon",
  "tasting graph",
  "honking topology",
];

export function BarneyTRex() {
  const [edgeIdx, setEdgeIdx] = useState(0);
  const [polyCount, setPolyCount] = useState(0);
  const [quipIdx, setQuipIdx] = useState(0);
  const [chomp, setChomp] = useState(false);
  const drawnRef = useRef<number[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setEdgeIdx((i) => {
        const next = (i + 1) % EDGES.length;
        drawnRef.current.push(i);
        if (drawnRef.current.length > 7) {
          drawnRef.current.shift();
        }
        if (next === 0) {
          setPolyCount((c) => c + 1);
          setQuipIdx((q) => (q + 1) % QUIPS.length);
          setChomp(true);
          setTimeout(() => setChomp(false), 250);
          drawnRef.current = [];
        }
        force((x) => x + 1);
        return next;
      });
    }, 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="select-none" data-testid="widget-barney-trex">
      <style>{`
        @keyframes barney-breath { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.03); } }
        @keyframes barney-armwave { 0%,100% { transform: rotate(-12deg); } 50% { transform: rotate(8deg); } }
        @keyframes vertex-pulse { 0%,100% { r: 2.5; opacity: 0.55; } 50% { r: 3.4; opacity: 1; } }
        @keyframes edge-draw { from { stroke-dashoffset: 240; } to { stroke-dashoffset: 0; } }
        .barney-body { transform-origin: center bottom; animation: barney-breath 2.4s ease-in-out infinite; }
        .barney-arm { transform-origin: 92px 78px; animation: barney-armwave 1.3s ease-in-out infinite; }
        .barney-arm-r { transform-origin: 108px 78px; animation: barney-armwave 1.3s ease-in-out infinite reverse; }
        .vertex-dot { animation: vertex-pulse 2s ease-in-out infinite; }
        .edge-active { stroke-dasharray: 240; animation: edge-draw 0.9s linear forwards; }
        .chomp { transform: scaleY(0.85); }
      `}</style>

      <div className="text-[9px] font-black tracking-[0.28em] uppercase text-gray-400 mb-2 text-center">
        Vertex Forge
      </div>

      <svg viewBox="0 0 200 160" className="w-full h-auto" aria-label="Barney T-Rex piecing vertices">
        {/* drawn edges (recent history, faint) */}
        {drawnRef.current.map((idx, n) => {
          const [a, b] = EDGES[idx];
          const va = VERTICES[a];
          const vb = VERTICES[b];
          return (
            <line
              key={`drawn-${n}-${idx}`}
              x1={va.x} y1={va.y} x2={vb.x} y2={vb.y}
              stroke="#9ca3af"
              strokeWidth="0.6"
              opacity={0.15 + n * 0.08}
            />
          );
        })}

        {/* active edge being drawn */}
        {(() => {
          const [a, b] = EDGES[edgeIdx];
          const va = VERTICES[a];
          const vb = VERTICES[b];
          return (
            <line
              key={`active-${edgeIdx}`}
              x1={va.x} y1={va.y} x2={vb.x} y2={vb.y}
              stroke="#7c3aed"
              strokeWidth="1.1"
              className="edge-active"
            />
          );
        })()}

        {/* vertices */}
        {VERTICES.map((v, i) => (
          <circle
            key={i}
            cx={v.x}
            cy={v.y}
            r="2.8"
            fill="#7c3aed"
            className="vertex-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}

        {/* Barney */}
        <g className={`barney-body ${chomp ? "chomp" : ""}`}>
          {/* tail */}
          <path d="M 80 105 Q 60 105 50 118 Q 56 112 78 110 Z" fill="#7c3aed" />
          {/* body */}
          <ellipse cx="100" cy="95" rx="20" ry="22" fill="#7c3aed" />
          {/* belly */}
          <ellipse cx="100" cy="100" rx="11" ry="14" fill="#c4b5fd" />
          {/* legs */}
          <rect x="92" y="112" width="5" height="10" rx="1.5" fill="#7c3aed" />
          <rect x="103" y="112" width="5" height="10" rx="1.5" fill="#7c3aed" />
          <ellipse cx="94.5" cy="122" rx="4" ry="1.5" fill="#5b21b6" />
          <ellipse cx="105.5" cy="122" rx="4" ry="1.5" fill="#5b21b6" />
          {/* tiny arms */}
          <g className="barney-arm">
            <rect x="89" y="78" width="2.5" height="7" rx="1.2" fill="#7c3aed" />
            <circle cx="90" cy="86" r="1.4" fill="#7c3aed" />
          </g>
          <g className="barney-arm-r">
            <rect x="108.5" y="78" width="2.5" height="7" rx="1.2" fill="#7c3aed" />
            <circle cx="110" cy="86" r="1.4" fill="#7c3aed" />
          </g>
          {/* head */}
          <ellipse cx="100" cy="74" rx="17" ry="14" fill="#7c3aed" />
          {/* snout */}
          <path d="M 100 75 Q 122 74 122 82 Q 122 88 104 88 Q 98 88 96 84 Z" fill="#7c3aed" />
          {/* mouth line */}
          <path d="M 100 84 Q 112 86 122 83" stroke="#3b0764" strokeWidth="0.6" fill="none" strokeLinecap="round" />
          {/* tiny teeth */}
          <path d="M 106 84 L 107 86 L 108 84 M 112 84 L 113 86 L 114 84 M 117 84 L 118 86 L 119 84" stroke="white" strokeWidth="0.5" fill="none" />
          {/* eye */}
          <circle cx="106" cy="69" r="3.2" fill="white" />
          <circle cx="107" cy="69.5" r="1.8" fill="#1f2937" />
          <circle cx="107.5" cy="69" r="0.7" fill="white" />
          {/* back spikes */}
          <path d="M 86 76 L 84 72 L 88 75 Z M 92 70 L 90 65 L 95 69 Z M 100 67 L 99 61 L 103 66 Z" fill="#5b21b6" />
        </g>
      </svg>

      <div className="mt-2 text-center">
        <p className="font-serif italic text-[11px] text-gray-600 leading-snug" style={{ fontFamily: "Georgia, serif" }}>
          Barney is <span className="text-purple-700">{QUIPS[quipIdx]}</span>…
        </p>
        <p className="mt-1 text-[9px] font-sans tracking-[0.2em] uppercase text-gray-400" data-testid="text-poly-count">
          polygons forged · {polyCount}
        </p>
      </div>
    </div>
  );
}
