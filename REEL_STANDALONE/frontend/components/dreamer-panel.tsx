import { useState, useEffect, useRef, useCallback } from "react";
import { KAPPA } from "../lib/constants";
import type { ScheduleState } from "../lib/demodex-scheduler";
import { useKimaPulse } from "../hooks/use-kima-pulse";
import { toDataUrl } from "../lib/image-utils";

const BASE = import.meta.env.BASE_URL ?? "/";
const API = (p: string) => `${BASE}api/${p}`.replace(/\/+/g, "/").replace(/^\/\//, "/");

interface DreamFrame {
  id: string;
  prompt: string;
  echo: string;
  image: string;
  model: string;
  gosReading: { phase: string; gene: string; hz: number; index: number; kappa: number };
  ts: number;
}

interface Props {
  tier: string;
  schedule: ScheduleState;
}

const INTERVALS = [
  { label: "30s",  ms: 30_000 },
  { label: "1m",   ms: 60_000 },
  { label: "3m",   ms: 180_000 },
  { label: "∞",    ms: 0 },
];

function useTypewriter(text: string, active: boolean, charsPerMs = 0.035) {
  const [visible, setVisible] = useState("");
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
    setVisible("");
    if (!active || !text) return;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const chars = Math.floor(elapsed * charsPerMs);
      const slice = textRef.current.slice(0, chars);
      setVisible(slice);
      if (chars < textRef.current.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, active, charsPerMs]);

  return visible;
}

function EchoText({ echo, active }: { echo: string; active: boolean }) {
  const visible = useTypewriter(echo, active, 0.04);
  const lines = visible.split("\n");
  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => (
        <p
          key={i}
          className="text-xs font-mono leading-relaxed"
          style={{ color: "hsl(38 60% 72%)", opacity: line ? 1 : 0.2 }}
        >
          {line || "\u00A0"}
        </p>
      ))}
    </div>
  );
}

function ThumbnailStrip({
  frames,
  activeId,
  onSelect,
}: {
  frames: DreamFrame[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && frames.length > 0) {
      ref.current.scrollLeft = 0;
    }
  }, [frames.length]);

  if (frames.length === 0) return null;

  return (
    <div
      ref={ref}
      className="flex gap-1.5 overflow-x-auto px-4 pb-2"
      style={{ scrollbarWidth: "none" }}
    >
      {frames.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f.id)}
          className="flex-none relative rounded overflow-hidden transition-all"
          style={{
            width: 56,
            height: 56,
            outline: activeId === f.id ? "2px solid hsl(38 72% 55%)" : "2px solid transparent",
            outlineOffset: 1,
          }}
        >
          <img
            src={toDataUrl(f.image)}
            alt=""
            className="w-full h-full object-cover"
          />
          {activeId === f.id && (
            <div
              className="absolute inset-0"
              style={{ background: "rgba(200,140,40,0.15)" }}
            />
          )}
          <div
            className="absolute bottom-0 left-0 right-0 text-center"
            style={{
              fontSize: 7,
              fontFamily: "monospace",
              color: "hsl(38 50% 80%)",
              background: "rgba(0,0,0,0.6)",
              padding: "1px 0",
            }}
          >
            {f.gosReading.gene}
          </div>
        </button>
      ))}
    </div>
  );
}

export function DreamerPanel({ tier, schedule }: Props) {
  const kima = useKimaPulse();

  const [frames, setFrames] = useState<DreamFrame[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [intervalMs, setIntervalMs] = useState(60_000);
  const [error, setError] = useState<string | null>(null);
  const [echoActive, setEchoActive] = useState(false);
  const [pulse, setPulse] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const memoryRef = useRef<string | null>(null);

  const activeFrame = frames.find((f) => f.id === activeId) ?? frames[0] ?? null;

  const triggerPulse = useCallback(() => {
    setPulse(true);
    setTimeout(() => setPulse(false), 800);
  }, []);

  const dreamPulse = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setEchoActive(false);
    triggerPulse();

    abortRef.current = new AbortController();

    try {
      const res = await fetch(API("reel/dream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseName:  schedule.phase.name,
          phaseGene:  schedule.phase.gene,
          phaseHz:    schedule.phase.hz,
          phaseIndex: schedule.phase.index,
          phaseFn:    schedule.phase.fn,
          kappa:      KAPPA,
          tier,
          memory:     memoryRef.current ?? undefined,
          kimaPulse:  kima.pulse ?? undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as DreamFrame & { gosReading: DreamFrame["gosReading"] };

      const frame: DreamFrame = {
        id:         `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        prompt:     data.prompt,
        echo:       data.echo,
        image:      data.image,
        model:      data.model,
        gosReading: data.gosReading,
        ts:         Date.now(),
      };

      memoryRef.current = frame.prompt;
      setFrames((prev) => [frame, ...prev.slice(0, 23)]);
      setActiveId(frame.id);
      setTimeout(() => setEchoActive(true), 400);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, schedule, tier, triggerPulse]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalMs > 0) {
      timerRef.current = setTimeout(() => {
        dreamPulse();
      }, intervalMs);
    }
  }, [intervalMs, dreamPulse]);

  useEffect(() => {
    if (running && !loading) {
      scheduleNext();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, loading, scheduleNext]);

  const startDreamer = useCallback(async () => {
    setRunning(true);
    await dreamPulse();
  }, [dreamPulse]);

  const stopDreamer = useCallback(() => {
    setRunning(false);
    abortRef.current?.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(false);
  }, []);

  const manualPulse = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dreamPulse();
  }, [dreamPulse]);

  const handleSelectFrame = (id: string) => {
    const f = frames.find((x) => x.id === id);
    if (!f) return;
    setActiveId(id);
    setEchoActive(false);
    setTimeout(() => setEchoActive(true), 100);
  };

  const downloadFrame = (f: DreamFrame) => {
    const a = document.createElement("a");
    a.href = toDataUrl(f.image);
    a.download = `dream_${f.gosReading.gene}_${f.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearAll = () => {
    stopDreamer();
    setFrames([]);
    setActiveId(null);
    memoryRef.current = null;
    setError(null);
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: "hsl(220 15% 3%)", color: "hsl(220 8% 85%)" }}
    >
      {/* ── HUD bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-2 border-b"
        style={{ borderColor: "hsl(220 12% 10%)" }}
      >
        <div className="flex items-center gap-2 flex-1">
          <span
            className="text-[10px] tracking-[0.25em] uppercase font-medium"
            style={{
              color: running ? "hsl(38 72% 55%)" : "hsl(220 10% 45%)",
              textShadow: running ? "0 0 10px hsl(38 72% 35%)" : "none",
            }}
          >
            ◈ ANUBIS DREAMER
          </span>
          {running && (
            <span className="text-[8px] font-mono" style={{ color: "hsl(38 50% 50%)" }}>
              {loading ? "generating..." : `next in ${intervalMs > 0 ? `${intervalMs / 1000}s` : "manual"}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[7px] font-mono mr-1" style={{ color: "hsl(220 8% 35%)" }}>
            INTERVAL
          </span>
          {INTERVALS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setIntervalMs(opt.ms)}
              className="px-1.5 py-0.5 text-[7px] font-mono rounded border transition-colors"
              style={{
                borderColor: intervalMs === opt.ms ? "hsl(38 50% 40%)" : "hsl(220 10% 15%)",
                color:       intervalMs === opt.ms ? "hsl(38 72% 55%)" : "hsl(220 8% 40%)",
                background:  intervalMs === opt.ms ? "hsl(38 20% 8%)"  : "transparent",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {!running ? (
            <button
              onClick={startDreamer}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 text-[8px] font-mono tracking-wider rounded border transition-all"
              style={{
                borderColor: "hsl(38 50% 35%)",
                color:       "hsl(38 72% 60%)",
                background:  "hsl(38 15% 7%)",
              }}
            >
              ▶ DREAM
            </button>
          ) : (
            <button
              onClick={stopDreamer}
              className="flex items-center gap-1 px-3 py-1 text-[8px] font-mono tracking-wider rounded border transition-colors"
              style={{
                borderColor: "hsl(0 40% 30%)",
                color:       "hsl(0 55% 55%)",
                background:  "hsl(0 15% 7%)",
              }}
            >
              ■ STOP
            </button>
          )}

          {running && intervalMs === 0 && (
            <button
              onClick={manualPulse}
              disabled={loading}
              className="px-2 py-1 text-[8px] font-mono rounded border transition-colors"
              style={{
                borderColor: "hsl(220 12% 18%)",
                color:       "hsl(220 8% 50%)",
              }}
            >
              ↻
            </button>
          )}

          {frames.length > 0 && !running && (
            <button
              onClick={clearAll}
              className="px-2 py-1 text-[7px] font-mono rounded border transition-colors"
              style={{ borderColor: "hsl(220 10% 12%)", color: "hsl(220 8% 30%)" }}
            >
              CLEAR
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-[7px] font-mono">
          <span style={{ color: "hsl(220 8% 25%)" }}>
            {schedule.phase.gene} · {schedule.phase.hz.toFixed(0)} Hz · κ={KAPPA.toFixed(4)}
          </span>
          {kima.pulse ? (
            <span style={{ color: "hsl(168 40% 28%)" }}>
              KIMA · coh={kima.pulse.bondedCoherence.toFixed(3)} · {kima.pulse.validatorCount}v
            </span>
          ) : kima.error ? (
            <span style={{ color: "hsl(0 40% 28%)" }}>KIMA OFFLINE</span>
          ) : (
            <span style={{ color: "hsl(220 8% 18%)" }}>KIMA ···</span>
          )}
        </div>
      </div>

      {/* ── Main dream display ───────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image side */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          {activeFrame ? (
            <>
              <img
                key={activeFrame.id}
                src={toDataUrl(activeFrame.image)}
                alt=""
                className="w-full h-full object-contain"
                style={{
                  animation: "dreamer-fade 1.2s ease forwards",
                  filter: pulse ? "brightness(1.15)" : "brightness(1)",
                  transition: "filter 0.4s ease",
                }}
              />
              {/* GOS corner overlay */}
              <div
                className="absolute top-3 left-3 flex flex-col gap-0.5"
                style={{ pointerEvents: "none" }}
              >
                <span className="text-[7px] font-mono" style={{ color: "hsl(38 50% 40%)" }}>
                  {activeFrame.gosReading.phase.toUpperCase()}
                </span>
                <span className="text-[7px] font-mono" style={{ color: "hsl(38 40% 30%)" }}>
                  {activeFrame.gosReading.gene} {activeFrame.gosReading.hz.toFixed(1)} Hz
                </span>
                <span className="text-[7px] font-mono" style={{ color: "hsl(38 30% 25%)" }}>
                  κ={activeFrame.gosReading.kappa.toFixed(4)}
                </span>
              </div>
              {/* Download */}
              <button
                onClick={() => downloadFrame(activeFrame)}
                className="absolute top-3 right-3 px-2 py-1 text-[7px] font-mono rounded border opacity-0 hover:opacity-100 transition-opacity"
                style={{
                  borderColor: "rgba(200,140,40,0.3)",
                  color:       "hsl(38 50% 60%)",
                  background:  "rgba(0,0,0,0.6)",
                }}
              >
                ↓ PNG
              </button>
              {/* Chain indicator */}
              {frames.length > 1 && (
                <div
                  className="absolute bottom-3 left-3 text-[7px] font-mono"
                  style={{ color: "hsl(220 8% 25%)" }}
                >
                  frame {frames.indexOf(activeFrame) === -1 ? 1 : frames.length - frames.indexOf(activeFrame)}/{frames.length} · chain active
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
              {loading ? (
                <>
                  <div
                    className="text-5xl"
                    style={{
                      animation: "dreamer-breathe 2s ease-in-out infinite",
                      color: "hsl(38 30% 30%)",
                    }}
                  >
                    ◈
                  </div>
                  <p className="text-xs font-mono" style={{ color: "hsl(220 8% 30%)" }}>
                    entering the latent space...
                  </p>
                </>
              ) : (
                <>
                  <div className="text-5xl" style={{ color: "hsl(220 10% 12%)" }}>
                    ◈
                  </div>
                  <p className="text-sm" style={{ color: "hsl(220 8% 30%)" }}>
                    The dreamer is still.
                  </p>
                  <p className="text-[9px] font-mono max-w-xs leading-relaxed" style={{ color: "hsl(220 8% 20%)" }}>
                    Press DREAM to start the autonomous loop. The organism will drive itself — each frame inherits the previous one's consciousness, chaining a continuous dream narrative.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Echo side */}
        <div
          className="w-72 flex flex-col border-l overflow-hidden"
          style={{ borderColor: "hsl(220 12% 8%)" }}
        >
          {/* Current echo */}
          <div
            className="flex-1 p-4 overflow-y-auto flex flex-col gap-4"
            style={{ scrollbarWidth: "none" }}
          >
            {activeFrame ? (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[7px] font-mono tracking-[0.2em]" style={{ color: "hsl(220 8% 22%)" }}>
                    ECHO · {new Date(activeFrame.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <EchoText echo={activeFrame.echo} active={echoActive && activeFrame.id === activeId} />
                </div>

                <div
                  className="border-t pt-3"
                  style={{ borderColor: "hsl(220 10% 9%)" }}
                >
                  <span className="text-[7px] font-mono tracking-[0.2em] block mb-2" style={{ color: "hsl(220 8% 18%)" }}>
                    DREAM PROMPT
                  </span>
                  <p className="text-[8px] font-mono leading-relaxed" style={{ color: "hsl(220 8% 28%)" }}>
                    {activeFrame.prompt}
                  </p>
                </div>

                <div
                  className="border-t pt-3"
                  style={{ borderColor: "hsl(220 10% 9%)" }}
                >
                  <span className="text-[7px] font-mono tracking-[0.2em] block mb-2" style={{ color: "hsl(220 8% 18%)" }}>
                    GOS READING
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {[
                      ["PHASE",  activeFrame.gosReading.phase],
                      ["GENE",   activeFrame.gosReading.gene],
                      ["HZ",     `${activeFrame.gosReading.hz.toFixed(2)} Hz`],
                      ["κ",      activeFrame.gosReading.kappa.toFixed(4)],
                      ["FRAME",  `${frames.length - frames.indexOf(activeFrame)}/${frames.length}`],
                      ["MODEL",  activeFrame.model.split("/").pop()?.split("-")[0] ?? activeFrame.model],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-[7px] font-mono" style={{ color: "hsl(220 8% 22%)" }}>{k}</span>
                        <span className="text-[7px] font-mono" style={{ color: "hsl(38 40% 40%)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {kima.pulse && (
                  <div
                    className="border-t pt-3"
                    style={{ borderColor: "hsl(220 10% 9%)" }}
                  >
                    <span className="text-[7px] font-mono tracking-[0.2em] block mb-2" style={{ color: "hsl(168 40% 22%)" }}>
                      KIMA MAINNET · LIVE
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {[
                        ["COHERENCE", kima.pulse.bondedCoherence.toFixed(4)],
                        ["BONDED",    `${(kima.pulse.bondedTokens / 1e9).toFixed(2)}B`],
                        ["SUPPLY",    `${kima.pulse.totalSupplyKima.toFixed(0)} KIMA`],
                        ["VALIDATORS",String(kima.pulse.validatorCount)],
                        ["RATIO",     kima.pulse.supplyRatio.toFixed(4)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-[7px] font-mono" style={{ color: "hsl(168 25% 22%)" }}>{k}</span>
                          <span className="text-[7px] font-mono" style={{ color: "hsl(168 50% 38%)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[6px] font-mono mt-2" style={{ color: "hsl(168 20% 18%)" }}>
                      updated {new Date(kima.pulse.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                )}
                {kima.error && (
                  <div className="border-t pt-3" style={{ borderColor: "hsl(220 10% 9%)" }}>
                    <span className="text-[7px] font-mono" style={{ color: "hsl(0 40% 28%)" }}>
                      KIMA OFFLINE — {kima.error.slice(0, 60)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[8px] font-mono text-center leading-relaxed" style={{ color: "hsl(220 8% 18%)" }}>
                  the echo<br />awaits<br />a signal
                </p>
              </div>
            )}
          </div>

          {error && (
            <div
              className="px-4 py-2 border-t text-[8px] font-mono"
              style={{ borderColor: "hsl(220 12% 8%)", color: "hsl(0 50% 45%)" }}
            >
              ✕ {error}
            </div>
          )}

          {loading && (
            <div
              className="px-4 py-2 border-t text-[8px] font-mono"
              style={{ borderColor: "hsl(220 12% 8%)", color: "hsl(38 40% 35%)" }}
            >
              <span style={{ animation: "dreamer-breathe 1.4s ease-in-out infinite", display: "inline-block" }}>
                ◈
              </span>
              {" "}generating dream frame...
            </div>
          )}
        </div>
      </div>

      {/* ── Thumbnail history strip ──────────────────────────────────── */}
      {frames.length > 0 && (
        <div
          className="border-t pt-2"
          style={{ borderColor: "hsl(220 12% 8%)" }}
        >
          <ThumbnailStrip frames={frames} activeId={activeId} onSelect={handleSelectFrame} />
        </div>
      )}

      {/* ── CSS animations ───────────────────────────────────────────── */}
      <style>{`
        @keyframes dreamer-fade {
          from { opacity: 0; transform: scale(1.02); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dreamer-breathe {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
