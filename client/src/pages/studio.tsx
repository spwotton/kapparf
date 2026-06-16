import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { renderScene } from "@shared/studio-render";
import { EMPTY_SCENE, type Scene, type Layer } from "@shared/studio-schema";
import { FORMATS, PALETTES, type FormatKey } from "@shared/design-system";
import {
  Sparkles,
  Download,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Square,
  Circle,
  Minus,
  Grid3x3,
  AudioWaveform,
  Ruler,
  Loader2,
  Wand2,
} from "lucide-react";

// ── Local view types ─────────────────────────────────────────────────────────
interface PresetMeta {
  kind: string;
  label: string;
  description: string;
}
interface SavedPost {
  id: string;
  title: string;
  format: FormatKey;
  palette: string;
  scene: Scene;
  caption?: string | null;
  status?: string | null;
  createdAt?: string;
}

const PALETTE_KEYS = Object.keys(PALETTES);
const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];
const COLOR_TOKENS = ["$bg", "$surface", "$fg", "$muted", "$line", "$accent", "$accentSoft"];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

// ── Layer factory (sensible, centered defaults per format) ───────────────────
function makeLayer(type: string, scene: Scene): Layer {
  const { w, h } = FORMATS[scene.format];
  const base = { id: uid(), x: Math.round(w * 0.12), y: Math.round(h * 0.4) };
  switch (type) {
    case "text":
      return {
        ...base, type: "text", text: "New text", w: Math.round(w * 0.76),
        fontSize: Math.round(w / 14), fontFamily: "sans", fontWeight: 600,
        lineHeight: 1.15, letterSpacing: 0, align: "left", color: "$fg",
        uppercase: false, italic: false, rotation: 0, opacity: 1, blendMode: "normal",
      } as Layer;
    case "rect":
      return {
        ...base, type: "rect", w: Math.round(w * 0.5), h: Math.round(h * 0.18),
        fill: { type: "solid", color: "$surface" }, cornerRadius: 16,
        rotation: 0, opacity: 1, blendMode: "normal",
      } as Layer;
    case "ellipse":
      return {
        ...base, type: "ellipse", w: Math.round(w * 0.3), h: Math.round(w * 0.3),
        fill: { type: "solid", color: "$accent" },
        rotation: 0, opacity: 1, blendMode: "normal",
      } as Layer;
    case "line":
      return {
        ...base, type: "line", dx: Math.round(w * 0.5), dy: 0,
        stroke: { color: "$accent", width: 3 },
        rotation: 0, opacity: 1, blendMode: "normal",
      } as Layer;
    default:
      // preset kinds: golden-grid | waveform | kappa-mark | ticks | phi-spiral
      return {
        ...base, type: "preset", kind: type as any,
        x: type === "golden-grid" ? 0 : base.x,
        y: type === "golden-grid" ? 0 : base.y,
        w: Math.round(w * 0.76), h: Math.round(h * 0.2), color: "$accent",
        rotation: 0, opacity: 1, blendMode: "normal",
      } as Layer;
  }
}

function layerLabel(l: Layer): string {
  if (l.type === "text") return `Text · "${l.text.slice(0, 18)}"`;
  if (l.type === "preset") return `Preset · ${l.kind}`;
  return l.type.charAt(0).toUpperCase() + l.type.slice(1);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Small styled controls ────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
const inputCls =
  "w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

function NumberInput({ value, onChange, testid }: { value: number; onChange: (n: number) => void; testid?: string }) {
  return (
    <input type="number" className={inputCls} value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)} data-testid={testid} />
  );
}
function TextInput({ value, onChange, testid }: { value: string; onChange: (s: string) => void; testid?: string }) {
  return <input type="text" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} />;
}
function NativeSelect({ value, onChange, options, testid }: { value: string; onChange: (s: string) => void; options: [string, string][]; testid?: string }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
function ColorInput({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <div className="space-y-1.5">
      <input type="text" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} data-testid="input-color" />
      <div className="flex flex-wrap gap-1">
        {COLOR_TOKENS.map((t) => (
          <button key={t} type="button" onClick={() => onChange(t)}
            className="px-1.5 py-0.5 text-[10px] rounded border border-border hover:bg-accent text-muted-foreground"
            data-testid={`token-${t.slice(1)}`}>{t}</button>
        ))}
      </div>
    </div>
  );
}

export default function StudioPage() {
  const { toast } = useToast();
  const [scene, setScene] = useState<Scene>({ ...EMPTY_SCENE });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [rasterProvider, setRasterProvider] = useState("local");
  const [title, setTitle] = useState("Untitled");
  const [caption, setCaption] = useState("");

  const svg = useMemo(() => renderScene(scene), [scene]);
  const selected = scene.layers.find((l) => l.id === selectedId) ?? null;

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: presetData } = useQuery<{ presets: PresetMeta[] }>({ queryKey: ["/api/studio/presets"] });
  const presets = presetData?.presets ?? [];

  const { data: savedPosts } = useQuery<SavedPost[] | null>({
    queryKey: ["/api/studio/posts"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const presetMutation = useMutation({
    mutationFn: async (kind: string) => {
      const res = await apiRequest("POST", `/api/studio/preset/${kind}`, { format: scene.format, palette: scene.palette });
      return (await res.json()) as { scene: Scene };
    },
    onSuccess: (data) => { setScene(data.scene); setSelectedId(null); },
    onError: (e: Error) => toast({ title: "Preset failed", description: e.message, variant: "destructive" }),
  });

  const composeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/studio/compose", {
        brief, format: scene.format, palette: scene.palette, rasterProvider,
      });
      return (await res.json()) as { scene: Scene; caption: string };
    },
    onSuccess: (data) => { setScene(data.scene); setCaption(data.caption ?? ""); setSelectedId(null); },
    onError: (e: Error) =>
      toast({
        title: e.message.startsWith("401") ? "Sign in required" : "Compose failed",
        description: e.message.startsWith("401") ? "AI compose needs an authenticated session." : e.message,
        variant: "destructive",
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/studio/posts", {
        title, format: scene.format, palette: scene.palette, scene, caption, status: "draft",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studio/posts"] });
      toast({ title: "Saved", description: `"${title}" stored as draft.` });
    },
    onError: (e: Error) =>
      toast({
        title: e.message.startsWith("401") ? "Sign in required" : "Save failed",
        description: e.message.startsWith("401") ? "Saving needs an authenticated session." : e.message,
        variant: "destructive",
      }),
  });

  // ── Scene mutation helpers ───────────────────────────────────────────────────
  const patchScene = (patch: Partial<Scene>) => setScene((s) => ({ ...s, ...patch }));
  const patchLayer = (id: string, patch: Record<string, any>) =>
    setScene((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) }));
  const addLayer = (type: string) => {
    const l = makeLayer(type, scene);
    setScene((s) => ({ ...s, layers: [...s.layers, l] }));
    setSelectedId(l.id);
  };
  const removeLayer = (id: string) =>
    setScene((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) }));
  const moveLayer = (id: string, dir: -1 | 1) =>
    setScene((s) => {
      const i = s.layers.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.layers.length) return s;
      const layers = [...s.layers];
      [layers[i], layers[j]] = [layers[j], layers[i]];
      return { ...s, layers };
    });

  // ── Export ───────────────────────────────────────────────────────────────────
  const exportSvg = () => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${title || "stele"}.svg`);
  const exportPng = async () => {
    const { w, h } = FORMATS[scene.format];
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("render failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas context");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((b) => { if (b) downloadBlob(b, `${title || "stele"}.png`); }, "image/png");
    } catch (e) {
      toast({ title: "PNG export failed", description: String(e), variant: "destructive" });
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const loadPost = (p: SavedPost) => {
    setScene(p.scene);
    setTitle(p.title);
    setCaption(p.caption ?? "");
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mr-2">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold tracking-tight">STELE Studio</span>
        </div>
        <input
          className="px-2 py-1 text-sm border border-border rounded-md bg-background w-44"
          value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" data-testid="input-title"
        />
        <NativeSelect value={scene.format} onChange={(v) => patchScene({ format: v as FormatKey })}
          options={FORMAT_KEYS.map((f) => [f, FORMATS[f].label])} testid="select-format" />
        <NativeSelect value={scene.palette} onChange={(v) => patchScene({ palette: v as Scene["palette"] })}
          options={PALETTE_KEYS.map((p) => [p, PALETTES[p].name])} testid="select-palette" />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportSvg} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" data-testid="button-export-svg">
            <Download className="h-3.5 w-3.5" /> SVG
          </button>
          <button onClick={exportPng} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" data-testid="button-export-png">
            <Download className="h-3.5 w-3.5" /> PNG
          </button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" data-testid="button-save">
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left pane */}
        <aside className="w-72 border-r border-border overflow-y-auto p-3 space-y-5 shrink-0">
          {/* Compose */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Compose with AI
            </h3>
            <textarea
              className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background min-h-[72px] resize-y"
              placeholder="Brief — e.g. 'Headline κ-score card with golden grid and waveform'"
              value={brief} onChange={(e) => setBrief(e.target.value)} data-testid="input-brief"
            />
            <NativeSelect value={rasterProvider} onChange={setRasterProvider}
              options={[["local", "Raster: gpt-image-1 (default)"], ["anubis", "Raster: Anubis"]]} testid="select-raster" />
            <button onClick={() => composeMutation.mutate()} disabled={composeMutation.isPending || !brief.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" data-testid="button-compose">
              {composeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {composeMutation.isPending ? "Composing…" : "Generate"}
            </button>
          </section>

          {/* Presets */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live-data Presets</h3>
            <div className="space-y-1.5">
              {presets.map((p) => (
                <button key={p.kind} onClick={() => presetMutation.mutate(p.kind)} disabled={presetMutation.isPending}
                  className="w-full text-left px-2.5 py-2 text-sm border border-border rounded-md hover:bg-accent disabled:opacity-50" data-testid={`preset-${p.kind}`}>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.description}</div>
                </button>
              ))}
              {presets.length === 0 && <p className="text-xs text-muted-foreground">Loading presets…</p>}
            </div>
          </section>

          {/* Add layer */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add Layer</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                ["text", "Text", Type],
                ["rect", "Rect", Square],
                ["ellipse", "Ellipse", Circle],
                ["line", "Line", Minus],
                ["golden-grid", "Golden grid", Grid3x3],
                ["waveform", "Waveform", AudioWaveform],
                ["ticks", "Ticks", Ruler],
                ["kappa-mark", "κ-mark", Sparkles],
                ["phi-spiral", "φ-spiral", Circle],
              ] as [string, string, typeof Type][]).map(([t, label, Icon]) => (
                <button key={t} onClick={() => addLayer(t)}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs border border-border rounded-md hover:bg-accent" data-testid={`add-${t}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </section>

          {/* Layers */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Layers ({scene.layers.length})</h3>
            <div className="space-y-1">
              {[...scene.layers].reverse().map((l) => (
                <div key={l.id}
                  className={`flex items-center gap-1 px-2 py-1.5 text-sm border rounded-md cursor-pointer ${selectedId === l.id ? "border-primary bg-accent" : "border-border hover:bg-accent"}`}
                  onClick={() => setSelectedId(l.id)} data-testid={`layer-${l.id}`}>
                  <span className="flex-1 truncate">{layerLabel(l)}</span>
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 1); }} className="p-0.5 hover:text-primary" data-testid={`layer-up-${l.id}`}><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, -1); }} className="p-0.5 hover:text-primary" data-testid={`layer-down-${l.id}`}><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); removeLayer(l.id); if (selectedId === l.id) setSelectedId(null); }} className="p-0.5 hover:text-destructive" data-testid={`layer-delete-${l.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {scene.layers.length === 0 && <p className="text-xs text-muted-foreground">Empty — add a layer or load a preset.</p>}
            </div>
          </section>
        </aside>

        {/* Center — preview */}
        <main className="flex-1 min-w-0 overflow-auto bg-muted/30 flex items-center justify-center p-6">
          <div
            className="shadow-lg [&>svg]:max-w-full [&>svg]:max-h-[calc(100vh-7rem)] [&>svg]:w-auto [&>svg]:h-auto [&>svg]:rounded-md"
            dangerouslySetInnerHTML={{ __html: svg }}
            data-testid="studio-preview"
          />
        </main>

        {/* Right — inspector */}
        <aside className="w-80 border-l border-border overflow-y-auto p-3 space-y-4 shrink-0">
          {selected ? (
            <Inspector key={selected.id} layer={selected} onChange={(patch) => patchLayer(selected.id, patch)} />
          ) : (
            <div className="text-sm text-muted-foreground">
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2">Inspector</h3>
              <p>Select a layer to edit its properties, or compose / pick a preset to start.</p>
            </div>
          )}

          {caption && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Caption</h3>
              <textarea className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background min-h-[80px] resize-y"
                value={caption} onChange={(e) => setCaption(e.target.value)} data-testid="input-caption" />
            </section>
          )}

          {savedPosts && savedPosts.length > 0 && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved ({savedPosts.length})</h3>
              <div className="space-y-1">
                {savedPosts.map((p) => (
                  <button key={p.id} onClick={() => loadPost(p)}
                    className="w-full text-left px-2 py-1.5 text-sm border border-border rounded-md hover:bg-accent" data-testid={`saved-${p.id}`}>
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.format} · {p.palette}</div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Inspector (per-layer property editing) ────────────────────────────────────
function Inspector({ layer, onChange }: { layer: Layer; onChange: (patch: Record<string, any>) => void }) {
  const a = layer as any;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Inspector · {layer.type}
      </h3>

      {/* Common transform */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="X"><NumberInput value={a.x ?? 0} onChange={(n) => onChange({ x: n })} testid="prop-x" /></Field>
        <Field label="Y"><NumberInput value={a.y ?? 0} onChange={(n) => onChange({ y: n })} testid="prop-y" /></Field>
        <Field label="Rotation"><NumberInput value={a.rotation ?? 0} onChange={(n) => onChange({ rotation: n })} testid="prop-rotation" /></Field>
        <Field label="Opacity"><NumberInput value={a.opacity ?? 1} onChange={(n) => onChange({ opacity: Math.max(0, Math.min(1, n)) })} testid="prop-opacity" /></Field>
      </div>

      {layer.type === "text" && (
        <div className="space-y-2">
          <Field label="Text">
            <textarea className={inputCls + " min-h-[60px] resize-y"} value={a.text} onChange={(e) => onChange({ text: e.target.value })} data-testid="prop-text" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Box width"><NumberInput value={a.w} onChange={(n) => onChange({ w: n })} testid="prop-w" /></Field>
            <Field label="Font size"><NumberInput value={a.fontSize} onChange={(n) => onChange({ fontSize: n })} testid="prop-fontsize" /></Field>
            <Field label="Weight"><NumberInput value={a.fontWeight} onChange={(n) => onChange({ fontWeight: n })} testid="prop-weight" /></Field>
            <Field label="Line height"><NumberInput value={a.lineHeight} onChange={(n) => onChange({ lineHeight: n })} testid="prop-lineheight" /></Field>
          </div>
          <Field label="Font">
            <NativeSelect value={a.fontFamily} onChange={(v) => onChange({ fontFamily: v })}
              options={[["sans", "Sans (Inter)"], ["serif", "Serif"], ["mono", "Mono"]]} testid="prop-font" />
          </Field>
          <Field label="Align">
            <NativeSelect value={a.align} onChange={(v) => onChange({ align: v })}
              options={[["left", "Left"], ["center", "Center"], ["right", "Right"]]} testid="prop-align" />
          </Field>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={a.uppercase} onChange={(e) => onChange({ uppercase: e.target.checked })} data-testid="prop-uppercase" /> Uppercase</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={a.italic} onChange={(e) => onChange({ italic: e.target.checked })} data-testid="prop-italic" /> Italic</label>
          </div>
          <Field label="Color"><ColorInput value={a.color} onChange={(v) => onChange({ color: v })} /></Field>
        </div>
      )}

      {(layer.type === "rect" || layer.type === "ellipse" || layer.type === "image") && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width"><NumberInput value={a.w} onChange={(n) => onChange({ w: n })} testid="prop-w" /></Field>
          <Field label="Height"><NumberInput value={a.h} onChange={(n) => onChange({ h: n })} testid="prop-h" /></Field>
        </div>
      )}

      {layer.type === "rect" && (
        <Field label="Corner radius"><NumberInput value={a.cornerRadius ?? 0} onChange={(n) => onChange({ cornerRadius: n })} testid="prop-radius" /></Field>
      )}

      {(layer.type === "rect" || layer.type === "ellipse" || layer.type === "polygon" || layer.type === "path") && a.fill && (
        <Field label="Fill color">
          <ColorInput
            value={a.fill?.type === "solid" ? a.fill.color : "$surface"}
            onChange={(v) => onChange({ fill: { type: "solid", color: v } })}
          />
        </Field>
      )}

      {layer.type === "line" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="dx"><NumberInput value={a.dx} onChange={(n) => onChange({ dx: n })} testid="prop-dx" /></Field>
            <Field label="dy"><NumberInput value={a.dy} onChange={(n) => onChange({ dy: n })} testid="prop-dy" /></Field>
          </div>
          <Field label="Stroke width"><NumberInput value={a.stroke?.width ?? 2} onChange={(n) => onChange({ stroke: { ...a.stroke, width: n } })} testid="prop-stroke-width" /></Field>
          <Field label="Stroke color"><ColorInput value={a.stroke?.color ?? "$accent"} onChange={(v) => onChange({ stroke: { ...a.stroke, color: v } })} /></Field>
        </div>
      )}

      {layer.type === "preset" && (
        <div className="space-y-2">
          <Field label="Kind">
            <NativeSelect value={a.kind} onChange={(v) => onChange({ kind: v })}
              options={[["golden-grid", "Golden grid"], ["waveform", "Waveform"], ["ticks", "Ticks"], ["kappa-mark", "κ-mark"], ["phi-spiral", "φ-spiral"]]} testid="prop-kind" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Width"><NumberInput value={a.w ?? 0} onChange={(n) => onChange({ w: n })} testid="prop-w" /></Field>
            <Field label="Height"><NumberInput value={a.h ?? 0} onChange={(n) => onChange({ h: n })} testid="prop-h" /></Field>
          </div>
          <Field label="Color"><ColorInput value={a.color ?? "$accent"} onChange={(v) => onChange({ color: v })} /></Field>
        </div>
      )}
    </div>
  );
}
