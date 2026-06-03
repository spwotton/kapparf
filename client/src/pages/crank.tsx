import { useState, useEffect, useRef, type ChangeEvent } from "react";

const TICK_RATE = 100;
const DECAY_RATE = 0.5;
const ENTROPY_GAIN_MULTIPLIER = 15;
const MAX_ENERGY = 100;

export default function CrankEditorPage() {
  const [content, setContent] = useState("");
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [isDead, setIsDead] = useState(false);
  const [stats, setStats] = useState({ entropy: 0, cpm: 0 });

  const lastStrokeTime = useRef(Date.now());

  const calculateEntropy = (text: string) => {
    if (!text) return 0;
    const window = text.slice(-100);
    const frequencies: Record<string, number> = {};

    for (const char of window) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    return Object.values(frequencies).reduce((sum, count) => {
      const p = count / window.length;
      return sum - p * Math.log2(p);
    }, 0);
  };

  useEffect(() => {
    if (isDead) return;

    const timer = setInterval(() => {
      setEnergy((prev) => {
        const next = prev - DECAY_RATE;
        if (next <= 0) {
          setIsDead(true);
          setContent("");
          return 0;
        }
        return next;
      });
    }, TICK_RATE);

    return () => clearInterval(timer);
  }, [isDead]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (isDead) return;

    const newText = e.target.value;
    const now = Date.now();

    const currentEntropy = calculateEntropy(newText);
    const entropyDelta = currentEntropy * ENTROPY_GAIN_MULTIPLIER;

    setContent(newText);
    setStats({
      entropy: currentEntropy,
      cpm: 60000 / Math.max(1, now - lastStrokeTime.current),
    });
    setEnergy((prev) => Math.min(MAX_ENERGY, prev + entropyDelta));

    lastStrokeTime.current = now;
  };

  const reset = () => {
    setIsDead(false);
    setEnergy(MAX_ENERGY);
    setContent("");
    lastStrokeTime.current = Date.now();
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto p-4 bg-black text-green-500 font-mono border-2 border-green-900 rounded shadow-[0_0_20px_rgba(0,255,0,0.2)]">
        <div className="flex justify-between items-end mb-4 border-b border-green-900 pb-2">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest" data-testid="text-crank-title">
              Ouroboros Terminal
            </h1>
            <span className="text-xs text-green-700" data-testid="status-crank">
              STATUS: {isDead ? "TERMINATED" : "CONNECTED (37Hz)"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" data-testid="text-entropy">
              {stats.entropy.toFixed(2)} bits
            </div>
            <div className="text-xs text-green-700">SHANNON COMPLEXITY</div>
          </div>
        </div>

        <div className="relative w-full h-4 bg-green-900/30 mb-6 rounded overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-100 ease-linear ${
              energy < 20 ? "bg-red-500 animate-pulse" : "bg-green-500"
            }`}
            style={{ width: `${energy}%` }}
            data-testid="bar-energy"
          />
        </div>

        {isDead ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <h2 className="text-red-500 text-4xl font-bold" data-testid="text-signal-lost">
              SIGNAL LOST
            </h2>
            <p className="text-green-700">The 31.25 Hz Grid caught you.</p>
            <button
              onClick={reset}
              className="px-6 py-2 border border-green-500 hover:bg-green-500 hover:text-black transition-colors"
              data-testid="button-reset"
            >
              INJECT ADRENALINE (RESET)
            </button>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="Type fast. Don't be boring. The timeline depends on it..."
            className="w-full h-96 bg-black text-lg focus:outline-none focus:ring-0 resize-none placeholder-green-900"
            spellCheck={false}
            autoFocus
            data-testid="input-crank"
          />
        )}
      </div>
    </div>
  );
}
