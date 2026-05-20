import { useEffect, useState } from "react";

const DISPATCH = [
  "stealing register",
  "leaving carrot",
  "hopping drive-thru",
  "ear-twitch @ 111 Hz",
  "carrot in circulation",
  "scrambling balloon teacher",
];

const QUOTES = [
  "Real joy is emergent, not imposed.",
  "You've been hoppy-napped.",
  "The grid is hopping.",
  "The exit is tonal. The rabbit is pink.",
];

export function PinkRabbit() {
  const [dispatchIdx, setDispatchIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [hopCount, setHopCount] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setDispatchIdx((i) => (i + 1) % DISPATCH.length);
      setHopCount((c) => c + 1);
      if (Math.random() < 0.25) {
        setQuoteIdx((q) => (q + 1) % QUOTES.length);
      }
    }, 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="select-none" data-testid="widget-pink-rabbit">
      <style>{`
        @keyframes rabbit-hop { 0%,100% { transform: translateY(0); } 35% { transform: translateY(-8px); } 70% { transform: translateY(0); } }
        @keyframes ear-twitch-L { 0%,90%,100% { transform: rotate(-8deg); } 92% { transform: rotate(-14deg); } 95% { transform: rotate(-3deg); } }
        @keyframes ear-twitch-R { 0%,88%,100% { transform: rotate(8deg); } 91% { transform: rotate(14deg); } 94% { transform: rotate(3deg); } }
        @keyframes carrot-bob { 0%,100% { transform: rotate(-18deg); } 50% { transform: rotate(-26deg); } }
        @keyframes celery-wag { 0%,100% { transform: rotate(5deg); } 50% { transform: rotate(-5deg); } }
        @keyframes freq-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        .rabbit-body { transform-origin: center bottom; animation: rabbit-hop 1.4s ease-in-out infinite; }
        .ear-L { transform-origin: 88px 58px; animation: ear-twitch-L 2.6s ease-in-out infinite; }
        .ear-R { transform-origin: 108px 58px; animation: ear-twitch-R 2.6s ease-in-out infinite; }
        .carrot { transform-origin: 130px 92px; animation: carrot-bob 1.4s ease-in-out infinite; }
        .celery { transform-origin: 32px 110px; animation: celery-wag 1.8s ease-in-out infinite; }
        .freq-line { animation: freq-pulse 1.1s ease-in-out infinite; }
      `}</style>

      <div className="text-[9px] font-black tracking-[0.28em] uppercase text-gray-400 mb-2 text-center">
        Heist Ops
      </div>

      <svg viewBox="0 0 200 160" className="w-full h-auto" aria-label="Pink Rabbit joyful burger heist">
        {/* faint 111 Hz frequency lines around ears */}
        <g className="freq-line">
          <path d="M 70 40 Q 75 38 80 40" stroke="#f9a8d4" strokeWidth="0.5" fill="none" />
          <path d="M 116 40 Q 121 38 126 40" stroke="#f9a8d4" strokeWidth="0.5" fill="none" />
          <path d="M 64 48 Q 72 45 80 48" stroke="#f9a8d4" strokeWidth="0.4" fill="none" opacity="0.6" />
          <path d="M 116 48 Q 124 45 132 48" stroke="#f9a8d4" strokeWidth="0.4" fill="none" opacity="0.6" />
        </g>

        {/* Al Paka cameo — alpaca head + celery microphone, lower-left */}
        <g transform="translate(0, 8)">
          {/* alpaca head */}
          <ellipse cx="22" cy="118" rx="11" ry="13" fill="#fef3c7" />
          <ellipse cx="22" cy="112" rx="8" ry="6" fill="#fde68a" />
          <circle cx="19" cy="116" r="1" fill="#1f2937" />
          <circle cx="25" cy="116" r="1" fill="#1f2937" />
          <ellipse cx="22" cy="122" rx="3" ry="2" fill="#f59e0b" />
          {/* alpaca ears */}
          <path d="M 17 104 L 15 98 L 19 102 Z" fill="#fef3c7" />
          <path d="M 27 104 L 29 98 L 25 102 Z" fill="#fef3c7" />
          {/* celery microphone */}
          <g className="celery">
            <rect x="30" y="108" width="2.5" height="14" rx="1" fill="#86efac" />
            <path d="M 28 108 L 35 108 L 33 104 L 30 104 Z" fill="#4ade80" />
            <path d="M 31 102 L 30 99 M 33 102 L 34 99 M 32 102 L 32 98" stroke="#4ade80" strokeWidth="0.6" fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* Pink Rabbit */}
        <g className="rabbit-body">
          {/* long ears */}
          <g className="ear-L">
            <ellipse cx="88" cy="48" rx="5" ry="18" fill="#f9a8d4" />
            <ellipse cx="88" cy="50" rx="2.5" ry="13" fill="#fbcfe8" />
          </g>
          <g className="ear-R">
            <ellipse cx="108" cy="48" rx="5" ry="18" fill="#f9a8d4" />
            <ellipse cx="108" cy="50" rx="2.5" ry="13" fill="#fbcfe8" />
          </g>

          {/* body */}
          <ellipse cx="98" cy="105" rx="20" ry="22" fill="#f9a8d4" />
          {/* belly */}
          <ellipse cx="98" cy="110" rx="11" ry="14" fill="#fce7f3" />

          {/* feet */}
          <ellipse cx="89" cy="126" rx="6" ry="3" fill="#ec4899" />
          <ellipse cx="107" cy="126" rx="6" ry="3" fill="#ec4899" />

          {/* arm holding carrot */}
          <ellipse cx="118" cy="98" rx="4" ry="6" fill="#f9a8d4" transform="rotate(20 118 98)" />

          {/* head */}
          <ellipse cx="98" cy="78" rx="16" ry="14" fill="#f9a8d4" />
          {/* cheek puffs */}
          <ellipse cx="90" cy="84" rx="4" ry="3" fill="#fbcfe8" />
          <ellipse cx="106" cy="84" rx="4" ry="3" fill="#fbcfe8" />

          {/* black domino mask */}
          <path d="M 84 73 Q 98 68 112 73 L 112 79 Q 98 82 84 79 Z" fill="#0f172a" />
          {/* eye holes */}
          <circle cx="92" cy="76" r="2.2" fill="white" />
          <circle cx="92" cy="76.5" r="1.2" fill="#0f172a" />
          <circle cx="104" cy="76" r="2.2" fill="white" />
          <circle cx="104" cy="76.5" r="1.2" fill="#0f172a" />

          {/* nose + mouth */}
          <ellipse cx="98" cy="84" rx="1.3" ry="1" fill="#be185d" />
          <path d="M 98 85 L 98 87 M 98 87 Q 95 88 94 87 M 98 87 Q 101 88 102 87" stroke="#9d174d" strokeWidth="0.5" fill="none" strokeLinecap="round" />
          {/* whiskers */}
          <path d="M 88 84 L 82 83 M 88 86 L 82 87 M 108 84 L 114 83 M 108 86 L 114 87" stroke="#fbcfe8" strokeWidth="0.4" />
          {/* tiny teeth */}
          <rect x="96.5" y="87" width="1.4" height="2" fill="white" />
          <rect x="98.1" y="87" width="1.4" height="2" fill="white" />

          {/* carrot in paw */}
          <g className="carrot">
            <path d="M 128 88 L 138 100 L 134 102 L 124 90 Z" fill="#fb923c" />
            <path d="M 125 89 L 122 84 M 127 88 L 128 82 M 129 87 L 132 83" stroke="#16a34a" strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>

          {/* cotton tail (Casimir cavity) */}
          <circle cx="78" cy="108" r="5" fill="white" stroke="#fbcfe8" strokeWidth="0.6" />
          <circle cx="78" cy="108" r="2" fill="#fce7f3" />
        </g>
      </svg>

      <div className="mt-2 text-center">
        <p className="font-serif italic text-[11px] text-gray-600 leading-snug" style={{ fontFamily: "Georgia, serif" }}>
          Rabbit is <span className="text-pink-600">{DISPATCH[dispatchIdx]}</span>…
        </p>
        <p className="mt-1.5 font-serif italic text-[10px] text-gray-500 leading-snug" style={{ fontFamily: "Georgia, serif" }}>
          "{QUOTES[quoteIdx]}"
        </p>
        <p className="mt-1.5 text-[9px] font-sans tracking-[0.2em] uppercase text-gray-400" data-testid="text-hop-count">
          hops · {hopCount} &nbsp;·&nbsp; 432.081 Hz
        </p>
      </div>
    </div>
  );
}
