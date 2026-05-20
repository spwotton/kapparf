import { useState, useCallback, useRef } from "react";
import { KAPPA, MITE_CONSTANT_TAU_D } from "../lib/constants";
import type { ScheduleState } from "../lib/demodex-scheduler";
import { toDataUrl } from "../lib/image-utils";

const BASE = import.meta.env.BASE_URL ?? "/";
const API = (p: string) => `${BASE}api/${p}`.replace(/\/+/g, "/").replace(/^\/\//, "/");

interface GeneratedImage {
  id: string;
  prompt: string;
  image: string;
  model: string;
  styleChip: string;
  ts: number;
}

interface Props {
  tier: string;
  schedule: ScheduleState;
  isLight: boolean;
}

const STYLE_CHIPS = [
  { id: "raw",         label: "Raw",            suffix: "" },
  { id: "tattoo",      label: "Tattoo Flash",   suffix: "traditional tattoo flash art, bold black outlines, minimal color, on aged paper" },
  { id: "sacred",      label: "Sacred Geometry",suffix: "sacred geometry, golden ratio, intricate mandala, symmetrical, glowing lines on black" },
  { id: "biological",  label: "Biological",     suffix: "biological illustration, cross-section, microscopy, organic detail, scientific diagram" },
  { id: "psychedelic", label: "Psychedelic",    suffix: "psychedelic visionary art, fractals, vivid color, Alex Grey style, cosmic" },
  { id: "molecular",   label: "Molecular",      suffix: "molecular structure, atomic bonds, neon on black, crystalline, sci-fi diagram" },
  { id: "glitch",      label: "Glitch",         suffix: "glitch art, digital corruption, RGB split, pixel error, CRT artifacts, surreal" },
  { id: "celestial",   label: "Celestial",      suffix: "celestial map, star chart, antique astronomical etching, constellations, deep space" },
  { id: "glyph",       label: "Ancient Glyph",  suffix: "ancient glyph, proto-writing, carved stone, cuneiform, symbolic, mythic" },
  { id: "ink",         label: "Fine Ink",       suffix: "fine ink illustration, intricate cross-hatching, etching, black and white, detailed" },
];

const COUNT_OPTIONS = [1, 2, 4];

const SIZE_OPTIONS = [
  { id: "square",    label: "1:1" },
  { id: "portrait",  label: "2:3" },
  { id: "landscape", label: "3:2" },
];

function downloadImage(b64: string, filename: string) {
  const a = document.createElement("a");
  a.href = toDataUrl(b64);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function ImageCard({
  item,
  isLight,
}: {
  item: GeneratedImage;
  isLight: boolean;
}) {
  const [zoomed, setZoomed] = useState(false);
  const border = isLight ? "hsl(34 14% 82%)" : "hsl(220 8% 16%)";
  const bg = isLight ? "hsl(36 18% 97%)" : "hsl(220 10% 5%)";

  return (
    <>
      <div
        className="flex flex-col gap-1.5 border rounded overflow-hidden group"
        style={{ borderColor: border, background: bg }}
      >
        <div
          className="relative cursor-zoom-in overflow-hidden"
          style={{ aspectRatio: "1/1" }}
          onClick={() => setZoomed(true)}
        >
          <img
            src={toDataUrl(item.image)}
            alt={item.prompt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5 gap-1"
            style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); downloadImage(item.image, `studio_${item.id}.png`); }}
              className="px-2 py-0.5 text-[8px] font-mono tracking-wider border rounded transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "white", background: "rgba(0,0,0,0.4)" }}
            >
              ↓ PNG
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setZoomed(true); }}
              className="px-2 py-0.5 text-[8px] font-mono tracking-wider border rounded transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "white", background: "rgba(0,0,0,0.4)" }}
            >
              ⤢ ZOOM
            </button>
          </div>
        </div>
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          <p
            className="text-[8px] font-mono leading-relaxed line-clamp-2"
            style={{ color: isLight ? "hsl(220 8% 40%)" : "hsl(220 8% 60%)" }}
          >
            {item.prompt}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-mono text-muted-foreground/50">
              {item.styleChip} · {item.model.split("/").pop()?.split("-")[0] ?? item.model}
            </span>
            <span className="text-[7px] font-mono text-muted-foreground/40">
              {new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={toDataUrl(item.image)}
              alt={item.prompt}
              className="w-full h-auto rounded"
            />
            <div className="flex items-center gap-2 mt-3">
              <p className="flex-1 text-[9px] font-mono text-white/60 leading-relaxed">
                {item.prompt}
              </p>
              <button
                onClick={() => downloadImage(item.image, `studio_${item.id}.png`)}
                className="px-3 py-1.5 text-[9px] font-mono tracking-wider border rounded"
                style={{ borderColor: "rgba(255,255,255,0.3)", color: "white", background: "rgba(255,255,255,0.1)" }}
              >
                ↓ PNG
              </button>
              <button
                onClick={() => setZoomed(false)}
                className="px-3 py-1.5 text-[9px] font-mono tracking-wider border rounded"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "white/60" }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StudioPanel({ tier, schedule, isLight }: Props) {
  const [prompt, setPrompt] = useState("");
  const [selectedChip, setSelectedChip] = useState("raw");
  const [count, setCount] = useState(2);
  const [size, setSize] = useState("square");
  const [gosMode, setGosMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [queue, setQueue] = useState<GeneratedImage[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const border = isLight ? "hsl(34 14% 82%)" : "hsl(220 8% 18%)";
  const surface = isLight ? "hsl(36 18% 97%)" : "hsl(220 10% 5%)";
  const accentColor = isLight ? "hsl(34 55% 38%)" : "hsl(38 72% 55%)";

  const buildFullPrompt = useCallback((base: string) => {
    const chip = STYLE_CHIPS.find((c) => c.id === selectedChip);
    const parts: string[] = [base.trim()];
    if (chip && chip.suffix) parts.push(chip.suffix);
    if (gosMode) {
      parts.push(
        `κ=${KAPPA.toFixed(4)}, θ_K=51.84°, τ_D=${MITE_CONSTANT_TAU_D}d, gene=${schedule.phase.gene} @ ${schedule.phase.hz.toFixed(2)} Hz`,
      );
    }
    return parts.filter(Boolean).join(". ");
  }, [selectedChip, gosMode, schedule]);

  const generate = useCallback(async () => {
    if (!prompt.trim() || generating) return;

    abortRef.current = new AbortController();
    setGenerating(true);
    setPendingCount(count);

    const fullPrompt = buildFullPrompt(prompt);
    const chip = STYLE_CHIPS.find((c) => c.id === selectedChip);

    const tasks = Array.from({ length: count }, async () => {
      try {
        const res = await fetch(API("imagine"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPrompt, tier, size }),
          signal: abortRef.current?.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.image) {
          const item: GeneratedImage = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            prompt: fullPrompt,
            image: data.image,
            model: data.model ?? "unknown",
            styleChip: chip?.label ?? "Raw",
            ts: Date.now(),
          };
          setQueue((q) => [item, ...q]);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("[studio] generate error:", e);
        }
      } finally {
        setPendingCount((n) => Math.max(0, n - 1));
      }
    });

    await Promise.allSettled(tasks);
    setGenerating(false);
    setPendingCount(0);
  }, [prompt, generating, count, tier, size, selectedChip, buildFullPrompt]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setGenerating(false);
    setPendingCount(0);
  }, []);

  const clearGallery = () => setQueue([]);

  return (
    <div className="flex-1 flex flex-col gap-0 overflow-hidden">
      <div
        className="flex flex-col gap-3 p-4 border-b border-border"
        style={{ background: isLight ? "hsl(36 22% 96%)" : "hsl(220 10% 4%)" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] tracking-[0.2em] uppercase font-medium"
            style={{ color: accentColor }}
          >
            ✧ STUDIO — Freeform Ideas
          </span>
          {queue.length > 0 && (
            <button
              onClick={clearGallery}
              className="text-[8px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              clear gallery ({queue.length})
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
            }}
            placeholder="type an idea, concept, feeling, keyword... anything"
            rows={3}
            className="w-full resize-none rounded border px-3 py-2 text-sm font-mono focus:outline-none transition-colors"
            style={{
              borderColor: border,
              background: isLight ? "white" : "hsl(220 10% 7%)",
              color: "hsl(var(--foreground))",
            }}
          />
          <span className="absolute bottom-2 right-2 text-[7px] font-mono text-muted-foreground/40">
            ⌘↵ to run
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {STYLE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSelectedChip(chip.id)}
              className="px-2 py-0.5 text-[8px] font-mono tracking-wider rounded border transition-colors"
              style={{
                borderColor: selectedChip === chip.id
                  ? accentColor
                  : border,
                color: selectedChip === chip.id
                  ? accentColor
                  : "hsl(var(--muted-foreground))",
                background: selectedChip === chip.id
                  ? isLight ? "hsl(38 40% 94%)" : "hsl(38 25% 10%)"
                  : "transparent",
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mr-1">
              count
            </span>
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className="w-7 h-6 text-[9px] font-mono rounded border transition-colors"
                style={{
                  borderColor: count === n ? accentColor : border,
                  color: count === n ? accentColor : "hsl(var(--muted-foreground))",
                  background: count === n
                    ? isLight ? "hsl(38 40% 94%)" : "hsl(38 25% 10%)"
                    : "transparent",
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mr-1">
              size
            </span>
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                className="px-2 h-6 text-[8px] font-mono rounded border transition-colors"
                style={{
                  borderColor: size === s.id ? accentColor : border,
                  color: size === s.id ? accentColor : "hsl(var(--muted-foreground))",
                  background: size === s.id
                    ? isLight ? "hsl(38 40% 94%)" : "hsl(38 25% 10%)"
                    : "transparent",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setGosMode((v) => !v)}
            className="flex items-center gap-1.5 px-2 h-6 text-[8px] font-mono rounded border transition-colors"
            style={{
              borderColor: gosMode
                ? "hsl(168 50% 35%)"
                : border,
              color: gosMode ? "hsl(168 50% 55%)" : "hsl(var(--muted-foreground))",
              background: gosMode
                ? isLight ? "hsl(168 25% 92%)" : "hsl(168 25% 10%)"
                : "transparent",
            }}
            title={`GOS mode: inject κ, θ_K, Demodex phase (${schedule.phase.gene} @ ${schedule.phase.hz.toFixed(1)} Hz) into prompt`}
          >
            <span>{gosMode ? "◈" : "○"}</span>
            <span>GOS: {schedule.phase.gene} {schedule.phase.hz.toFixed(0)} Hz</span>
          </button>

          <div className="flex-1" />

          {generating ? (
            <button
              onClick={stop}
              className="h-8 px-4 text-[9px] font-mono tracking-[0.15em] uppercase rounded border transition-colors"
              style={{
                borderColor: "hsl(0 50% 40%)",
                color: "hsl(0 50% 60%)",
                background: "hsl(0 30% 10%)",
              }}
            >
              ■ STOP {pendingCount > 0 ? `(${pendingCount} left)` : ""}
            </button>
          ) : (
            <button
              onClick={generate}
              disabled={!prompt.trim()}
              className="h-8 px-5 text-[9px] font-mono tracking-[0.15em] uppercase rounded border transition-colors"
              style={{
                borderColor: prompt.trim() ? accentColor : border,
                color: prompt.trim() ? accentColor : "hsl(var(--muted-foreground))",
                background: prompt.trim()
                  ? isLight ? "hsl(38 40% 94%)" : "hsl(38 25% 10%)"
                  : "transparent",
                opacity: prompt.trim() ? 1 : 0.5,
              }}
            >
              ▶ GENERATE {count > 1 ? `×${count}` : ""}
            </button>
          )}
        </div>

        {generating && pendingCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: surface }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((count - pendingCount) / count) * 100}%`,
                  background: accentColor,
                }}
              />
            </div>
            <span className="text-[8px] font-mono text-muted-foreground tabular-nums">
              {count - pendingCount}/{count}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {queue.length === 0 && !generating ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-4xl opacity-20">✧</span>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Type anything — a word, a feeling, a concept — and generate visual ideas freely.
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/50">
              Use style chips to shape the output. Enable GOS mode to inject the organism's current frequency into the prompt.
            </p>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {generating && pendingCount > 0 &&
              Array.from({ length: pendingCount }).map((_, i) => (
                <div
                  key={`pending-${i}`}
                  className="rounded border overflow-hidden"
                  style={{ borderColor: border, aspectRatio: "1/1", background: surface }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ animation: "pulse-slow 1.5s infinite" }}
                  >
                    <span className="text-2xl opacity-20">✧</span>
                  </div>
                </div>
              ))}
            {queue.map((item) => (
              <ImageCard key={item.id} item={item} isLight={isLight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
