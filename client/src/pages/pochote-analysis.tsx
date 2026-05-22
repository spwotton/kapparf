import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MediaIndex {
  photos: string[];
  frames: string[];
  audio: string[];
}

interface PreResults {
  photos: Record<string, string>;
  frames: Record<string, { analysis: string }>;
  audio: Record<string, { transcript?: string; sizeMB?: string }>;
  synthesis?: string;
  generatedAt?: string;
}

interface TranscriptState {
  [file: string]: { text: string; source: "computed" | "live" | "manual" };
}

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
function MarkdownText({ text, compact = false }: { text: string; compact?: boolean }) {
  const lines = text.split("\n");
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className={compact ? "h-1" : "h-2"} />;
        const isH3 = trimmed.startsWith("### ");
        const isH4 = trimmed.startsWith("#### ");
        const isBold = /^\*\*(.+)\*\*$/.test(trimmed);
        const isBullet = /^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
        const cleaned = trimmed
          .replace(/^#{1,4}\s*/, "")
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\[SEVERITY:[^\]]+\]/gi, "")
          .trim();
        if (!cleaned) return null;
        return (
          <div key={i} className={`flex items-start gap-1.5 ${isBullet ? "pl-3" : ""}`}>
            {isBullet && <span className="text-gray-600 mt-0.5 shrink-0">·</span>}
            <span className={`font-mono leading-relaxed ${compact ? "text-[10px]" : "text-[11px]"} ${
              isH3 ? "text-gray-100 font-bold text-[12px] tracking-wide mt-1" :
              isH4 ? "text-gray-200 font-semibold" :
              isBold ? "text-gray-200 font-semibold" :
              "text-gray-400"
            }`}>{cleaned}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SEVERITY BADGE ───────────────────────────────────────────────────────────
function SeverityChip({ text }: { text: string }) {
  const m = text.match(/\[SEVERITY:\s*(LOW|MEDIUM|HIGH|CRITICAL)\]/i)
    || text.match(/\b(LOW|MEDIUM|HIGH|CRITICAL)\b/i);
  if (!m) return null;
  const level = m[1].toUpperCase();
  const styles: Record<string, string> = {
    LOW:      "bg-blue-950 text-blue-400 border-blue-900",
    MEDIUM:   "bg-yellow-950 text-yellow-400 border-yellow-900",
    HIGH:     "bg-orange-950 text-orange-400 border-orange-900",
    CRITICAL: "bg-red-950 text-red-400 border-red-900",
  };
  return (
    <span className={`inline-flex items-center text-[8px] font-mono font-black px-1.5 py-0.5 border rounded shrink-0 ${styles[level] ?? styles.LOW}`}>
      {level}
    </span>
  );
}

// ─── CLIP KEY → FRIENDLY NAME ─────────────────────────────────────────────────
function clipLabel(name: string) {
  if (name.startsWith("IMG_")) return name.replace(/_\d{13}$/, "");
  if (name.length > 24) return name.slice(0, 8) + "…" + name.slice(-8);
  return name;
}

// ─── PHOTO CARD ───────────────────────────────────────────────────────────────
function PhotoCard({ photo, analysis, onAnalyze, running }: {
  photo: string;
  analysis?: string;
  onAnalyze: () => void;
  running: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasAnalysis = !!analysis;
  // Extract first key finding
  const firstFinding = analysis
    ? analysis.split("\n").find(l => l.trim() && !l.startsWith("#") && l.length > 20)?.replace(/^[-•*\d.]\s*/, "").slice(0, 120)
    : null;

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/30"
      data-testid={`photo-card-${photo}`}>
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        <img src={`/pochote/photos/${photo}`} alt={photo}
          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-zoom-in"
          onClick={() => window.open(`/pochote/photos/${photo}`, "_blank")} />
        {hasAnalysis && (
          <div className="absolute top-1.5 right-1.5">
            <span className="text-[7px] font-mono px-1.5 py-0.5 bg-green-950/90 border border-green-800 text-green-400 rounded">✓ analyzed</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono text-gray-500">{photo}</span>
          <button
            onClick={hasAnalysis ? () => setExpanded(e => !e) : onAnalyze}
            disabled={running}
            data-testid={`btn-photo-${photo}`}
            className={`text-[8px] font-mono px-2 py-1 border transition-colors ${
              running ? "border-gray-700 text-gray-600 cursor-not-allowed" :
              hasAnalysis ? "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300" :
              "border-gray-500 text-gray-300 hover:border-gray-200"
            }`}>
            {running ? "analyzing…" : hasAnalysis ? (expanded ? "collapse" : "expand") : "▶ analyze"}
          </button>
        </div>
        {firstFinding && !expanded && (
          <p className="text-[9px] font-mono text-gray-500 truncate">{firstFinding}</p>
        )}
        {expanded && analysis && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <MarkdownText text={analysis} compact />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FRAME CLIP CARD ──────────────────────────────────────────────────────────
function ClipCard({ clip, frames, analysis, onAnalyze, running }: {
  clip: string;
  frames: string[];
  analysis?: string;
  onAnalyze: () => void;
  running: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasAnalysis = !!analysis;

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden" data-testid={`clip-card-${clip}`}>
      <div className="bg-gray-900/60 px-4 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono font-bold text-gray-200">{clipLabel(clip)}</div>
          <div className="text-[8px] font-mono text-gray-600">{frames.length} frames</div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnalysis && (
            <button onClick={() => setExpanded(e => !e)}
              className="text-[8px] font-mono text-gray-500 hover:text-gray-300 px-2 py-1 border border-gray-700 hover:border-gray-500 transition-colors">
              {expanded ? "collapse" : "expand"}
            </button>
          )}
          <button onClick={hasAnalysis ? undefined : onAnalyze} disabled={running || hasAnalysis}
            data-testid={`btn-clip-${clip}`}
            className={`text-[9px] font-mono px-3 py-1.5 border transition-colors ${
              running ? "border-gray-700 text-gray-600 cursor-not-allowed" :
              hasAnalysis ? "border-green-900 text-green-600 cursor-default" :
              "border-gray-500 text-gray-300 hover:border-gray-200"
            }`}>
            {running ? "analyzing…" : hasAnalysis ? "✓ done" : "▶ analyze"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-px bg-gray-900">
        {frames.map(f => (
          <div key={f} className="aspect-video overflow-hidden bg-gray-950">
            <img src={`/pochote/frames/${f}`} alt={f}
              className="w-full h-full object-cover opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => window.open(`/pochote/frames/${f}`, "_blank")} />
          </div>
        ))}
      </div>
      {expanded && analysis && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/30">
          <MarkdownText text={analysis} />
        </div>
      )}
    </div>
  );
}

// ─── AUDIO ROW ────────────────────────────────────────────────────────────────
function AudioRow({ file, transcript, onTranscribe, running, onManualSave }: {
  file: string;
  transcript?: string;
  onTranscribe: () => void;
  running: boolean;
  onManualSave: (text: string) => void;
}) {
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState(transcript || "");
  const [expanded, setExpanded] = useState(false);

  const hasTranscript = !!transcript && !transcript.startsWith("[error");
  const isError = transcript?.startsWith("[error");

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/30" data-testid={`audio-row-${file}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-mono font-bold text-gray-200 truncate">{clipLabel(file.replace(".mp3", ""))}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <audio src={`/pochote/audio/${file}`} controls
              className="h-5 opacity-60 hover:opacity-100 transition-opacity"
              style={{ width: "160px" }} />
            {hasTranscript && (
              <span className="text-[7px] font-mono px-1.5 py-0.5 bg-amber-950/60 border border-amber-900 text-amber-500 rounded">✓ transcribed</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {hasTranscript && (
            <button onClick={() => setExpanded(e => !e)}
              className="text-[8px] font-mono px-2 py-1 border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors">
              {expanded ? "collapse" : "show"}
            </button>
          )}
          <button onClick={() => setManualMode(m => !m)}
            className="text-[8px] font-mono px-2 py-1 border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors">
            ✏ manual
          </button>
          <button onClick={onTranscribe} disabled={running}
            data-testid={`btn-transcribe-${file}`}
            className={`text-[9px] font-mono px-3 py-1.5 border transition-colors ${
              running ? "border-gray-700 text-gray-600 cursor-not-allowed" :
              hasTranscript ? "border-amber-900 text-amber-600 hover:bg-amber-950/20" :
              isError ? "border-red-900 text-red-500 hover:border-red-700" :
              "border-gray-500 text-gray-300 hover:border-gray-200"
            }`}>
            {running ? "transcribing…" : hasTranscript ? "↺ redo" : "▶ transcribe"}
          </button>
        </div>
      </div>

      {expanded && hasTranscript && (
        <div className="px-4 pb-3">
          <div className="bg-gray-950 border border-gray-800 rounded p-3">
            <div className="text-[8px] font-mono text-amber-600 mb-1.5">TRANSCRIPT · gpt-4o-mini-transcribe</div>
            <p className="text-[11px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}

      {manualMode && (
        <div className="px-4 pb-3">
          <div className="text-[8px] font-mono text-gray-600 mb-1">Manual transcription (enter what you hear):</div>
          <textarea
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            rows={3}
            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-[11px] font-mono text-gray-300 focus:outline-none focus:border-gray-500"
            placeholder="Type transcript here…"
            data-testid={`textarea-manual-${file}`}
          />
          <div className="flex justify-end mt-1">
            <button onClick={() => { onManualSave(manualText); setManualMode(false); setExpanded(true); }}
              className="text-[9px] font-mono px-3 py-1.5 border border-gray-500 text-gray-300 hover:border-gray-200 transition-colors"
              data-testid={`btn-save-manual-${file}`}>
              save transcript
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SYNTHESIS PANEL ──────────────────────────────────────────────────────────
function SynthesisPanel({ synthesis, generatedAt }: { synthesis: string; generatedAt?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-yellow-900/40 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-yellow-950/20 hover:bg-yellow-950/30 transition-colors"
        data-testid="btn-synthesis-toggle">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono font-black text-yellow-500 tracking-widest">INTELLIGENCE SYNTHESIS</span>
          <span className="text-[8px] font-mono text-yellow-900">GPT-4o · 12 photos · 14 clips</span>
          {generatedAt && (
            <span className="text-[8px] font-mono text-gray-700">{new Date(generatedAt).toLocaleString()}</span>
          )}
        </div>
        <span className="text-[10px] font-mono text-gray-600">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-950/40">
          <MarkdownText text={synthesis} />
        </div>
      )}
    </div>
  );
}

// ─── KEY FINDINGS BANNER ──────────────────────────────────────────────────────
const KEY_FINDINGS = [
  { label: "GPON ONT", detail: "Huawei OptiXstar EG8147X6 — IMG_0468, IMG_0548", level: "HIGH" },
  { label: "Coax Device", detail: "Black device + QC PASS sticker + coaxial cable — IMG_0466, IMG_0467", level: "HIGH" },
  { label: "Roof Object", detail: "Small metallic cube on neighboring roof — IMG_0549, IMG_0550", level: "MEDIUM" },
  { label: "Emergency Exit", detail: "Evacuation sign confirms Hotel Pochote Grande location — IMG_0462", level: "LOW" },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PochoteAnalysisPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"synthesis" | "photos" | "frames" | "audio">("synthesis");
  const [liveAnalysis, setLiveAnalysis] = useState<Record<string, string>>({});
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [transcripts, setTranscripts] = useState<TranscriptState>({});

  const { data: media } = useQuery<MediaIndex>({ queryKey: ["/api/pochote/media"] });
  const { data: preResults } = useQuery<PreResults>({
    queryKey: ["/api/pochote/results"],
    staleTime: 60_000,
  });

  // Seed transcripts from pre-computed results
  useEffect(() => {
    if (!preResults?.audio) return;
    const seed: TranscriptState = {};
    for (const [f, d] of Object.entries(preResults.audio)) {
      if (d.transcript && !d.transcript.startsWith("[error")) {
        seed[f] = { text: d.transcript, source: "computed" };
      }
    }
    setTranscripts(prev => ({ ...seed, ...prev }));
  }, [preResults]);

  const startRunning = (id: string) => setRunningIds(s => new Set([...s, id]));
  const stopRunning  = (id: string) => setRunningIds(s => { const n = new Set(s); n.delete(id); return n; });

  const analyzeImages = async (files: string[], type: "photos" | "frames") => {
    const id = files.join(",");
    startRunning(id);
    try {
      const r = await apiRequest("POST", "/api/pochote/analyze-images", { files, type });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setLiveAnalysis(prev => ({ ...prev, [id]: data.analysis }));
    } catch (e: any) {
      toast({ title: "Analysis error", description: e.message, variant: "destructive" });
    } finally { stopRunning(id); }
  };

  const transcribeAudio = async (file: string) => {
    startRunning(file);
    try {
      const r = await apiRequest("POST", "/api/pochote/transcribe", { file });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setTranscripts(prev => ({ ...prev, [file]: { text: data.transcript, source: "live" } }));
    } catch (e: any) {
      toast({ title: "Transcription error", description: e.message, variant: "destructive" });
    } finally { stopRunning(file); }
  };

  const saveManual = (file: string, text: string) => {
    setTranscripts(prev => ({ ...prev, [file]: { text, source: "manual" } }));
    toast({ title: "Saved", description: `Manual transcript saved for ${file.replace(".mp3", "")}` });
  };

  // Group frames by clip
  const framesByClip: Record<string, string[]> = {};
  for (const f of (media?.frames ?? [])) {
    const clip = f.replace(/_f(1|mid|end)\.jpg$/, "");
    if (!framesByClip[clip]) framesByClip[clip] = [];
    framesByClip[clip].push(f);
  }

  const photoCount = media?.photos.length ?? 0;
  const clipCount = Object.keys(framesByClip).length;
  const audioCount = media?.audio.length ?? 0;
  const transcribedCount = Object.values(transcripts).filter(t => t.text && !t.text.startsWith("[")).length;
  const analyzedPhotos = Object.keys(preResults?.photos ?? {}).length + Object.keys(liveAnalysis).filter(k => k.includes(".jpg")).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col"
      style={{ fontFamily: "'SF Mono','Fira Code',monospace" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[13px] font-bold text-gray-100 tracking-tight">
              Pochote Forensic Analysis
            </h1>
            <span className="text-[8px] font-mono px-2 py-0.5 border border-red-900 text-red-500 rounded tracking-widest">SENSITIVE</span>
          </div>
          <p className="text-[9px] text-gray-600 mt-0.5">
            Hotel Pochote Grande · La Flor, Jacó, Costa Rica
            {media && ` · ${photoCount} photos · ${clipCount} clips · ${audioCount} audio tracks`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <a href="/network-analysis" className="text-gray-600 hover:text-gray-400 transition-colors">← HUMINT</a>
          <a href="/forensics" className="text-gray-600 hover:text-gray-400 transition-colors">← Forensics</a>
        </div>
      </header>

      {/* ── KEY FINDINGS BANNER ─────────────────────────────────────────── */}
      <div className="border-b border-gray-800 px-6 py-2 flex items-center gap-6 bg-gray-950 overflow-x-auto">
        <span className="text-[8px] font-mono font-black text-gray-600 tracking-widest shrink-0">KEY FINDINGS</span>
        {KEY_FINDINGS.map((f, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <SeverityChip text={f.level} />
            <span className="text-[9px] font-mono text-gray-400">
              <span className="text-gray-200 font-semibold">{f.label}</span>
              <span className="text-gray-600 ml-1.5 hidden lg:inline">{f.detail}</span>
            </span>
          </div>
        ))}
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-800 px-6 flex items-center justify-between">
        <div className="flex">
          {([
            ["synthesis", `Synthesis`],
            ["photos", `Photos (${photoCount})`],
            ["frames", `Clips (${clipCount})`],
            ["audio", `Audio (${audioCount})`],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              data-testid={`tab-${t}`}
              className={`px-5 py-3 text-[10px] font-mono uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === t
                  ? "border-gray-300 text-gray-200"
                  : "border-transparent text-gray-600 hover:text-gray-400"
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 py-2">
          {activeTab === "photos" && (
            <button onClick={() => (media?.photos ?? []).forEach((p, i) => setTimeout(() => analyzeImages([p], "photos"), i * 800))}
              data-testid="btn-analyze-all-photos"
              className="text-[9px] font-mono px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 transition-colors">
              ▶ analyze all
            </button>
          )}
          {activeTab === "frames" && (
            <button onClick={() => Object.entries(framesByClip).forEach(([, frames], i) => setTimeout(() => analyzeImages(frames, "frames"), i * 800))}
              data-testid="btn-analyze-all-clips"
              className="text-[9px] font-mono px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 transition-colors">
              ▶ analyze all
            </button>
          )}
          {activeTab === "audio" && (
            <button onClick={() => (media?.audio ?? []).filter(f => !transcripts[f]).forEach((f, i) => setTimeout(() => transcribeAudio(f), i * 1200))}
              data-testid="btn-transcribe-all"
              className="text-[9px] font-mono px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 transition-colors">
              ▶ transcribe remaining ({audioCount - transcribedCount})
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* ── SYNTHESIS TAB ─────────────────────────────────────────────── */}
        {activeTab === "synthesis" && (
          <div className="space-y-5 max-w-4xl">
            {preResults?.synthesis ? (
              <SynthesisPanel synthesis={preResults.synthesis} generatedAt={preResults.generatedAt} />
            ) : (
              <div className="text-[11px] font-mono text-gray-600 text-center py-12">Loading synthesis…</div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Photos analyzed", value: `${Object.keys(preResults?.photos ?? {}).length} / ${photoCount}`, color: "text-blue-400" },
                { label: "Clips analyzed", value: `${Object.keys(preResults?.frames ?? {}).length} / ${clipCount}`, color: "text-purple-400" },
                { label: "Audio tracks", value: `${transcribedCount} / ${audioCount} transcribed`, color: "text-amber-400" },
                { label: "Devices identified", value: "3 confirmed", color: "text-red-400" },
              ].map(s => (
                <div key={s.label} className="border border-gray-800 rounded-lg p-3 bg-gray-900/30">
                  <div className={`text-[18px] font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] font-mono text-gray-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Hardware found */}
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-900/60 border-b border-gray-800">
                <span className="text-[9px] font-mono font-black text-gray-300 tracking-widest">HARDWARE IDENTIFIED</span>
              </div>
              <div className="divide-y divide-gray-800/60">
                {[
                  { name: "Huawei OptiXstar EG8147X6", type: "GPON ONT", files: "IMG_0468, IMG_0548", severity: "HIGH", note: "Fiber optic terminal with WiFi — found inside premises" },
                  { name: "Unknown black device", type: "Coax modem", files: "IMG_0466, IMG_0467", severity: "HIGH", note: "QC PASS sticker, coaxial input, no visible indicators" },
                  { name: "Metallic cube object", type: "Unknown RF?", files: "IMG_0549, IMG_0550", severity: "MEDIUM", note: "Placed on neighboring rooftop tile, purpose unclear" },
                ].map(d => (
                  <div key={d.name} className="px-4 py-3 flex items-start gap-3">
                    <SeverityChip text={d.severity} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-bold text-gray-200">{d.name}</div>
                      <div className="text-[9px] font-mono text-gray-500">{d.type} · files: {d.files}</div>
                      <div className="text-[9px] font-mono text-gray-600 mt-0.5">{d.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PHOTOS TAB ────────────────────────────────────────────────── */}
        {activeTab === "photos" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(media?.photos ?? []).map(photo => {
                const preAnalysis = preResults?.photos?.[photo];
                const liveId = photo; // single-photo analyze id
                const batchId = (media?.photos ?? []).slice(
                  Math.floor((media?.photos ?? []).indexOf(photo) / 4) * 4,
                  Math.floor((media?.photos ?? []).indexOf(photo) / 4) * 4 + 4
                ).join(",");
                const analysis = preAnalysis || liveAnalysis[liveId] || liveAnalysis[batchId];
                return (
                  <PhotoCard
                    key={photo}
                    photo={photo}
                    analysis={analysis}
                    onAnalyze={() => analyzeImages([photo], "photos")}
                    running={runningIds.has(liveId) || runningIds.has(batchId)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── FRAMES TAB ────────────────────────────────────────────────── */}
        {activeTab === "frames" && (
          <div className="space-y-4 max-w-5xl">
            {Object.entries(framesByClip).map(([clip, frames]) => {
              const preAnalysis = preResults?.frames?.[clip]?.analysis;
              const liveId = frames.join(",");
              const analysis = preAnalysis || liveAnalysis[liveId];
              return (
                <ClipCard
                  key={clip}
                  clip={clip}
                  frames={frames}
                  analysis={analysis}
                  onAnalyze={() => analyzeImages(frames, "frames")}
                  running={runningIds.has(liveId)}
                />
              );
            })}
          </div>
        )}

        {/* ── AUDIO TAB ─────────────────────────────────────────────────── */}
        {activeTab === "audio" && (
          <div className="space-y-3 max-w-3xl">
            <div className="text-[9px] font-mono text-gray-700 pb-1 flex items-center gap-2">
              <span>Transcription: gpt-4o-mini-transcribe · {transcribedCount}/{audioCount} complete</span>
              <span>·</span>
              <span>Large files (&gt;19MB) not supported via inline API</span>
            </div>
            {(media?.audio ?? []).map(f => (
              <AudioRow
                key={f}
                file={f}
                transcript={transcripts[f]?.text}
                onTranscribe={() => transcribeAudio(f)}
                running={runningIds.has(f)}
                onManualSave={(text) => saveManual(f, text)}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-800 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="text-[8px] font-mono text-gray-700 tracking-widest">
          KAPPA · FORENSICS · POCHOTE ARRAY · GPT-4O VISION · {new Date().toLocaleString()}
        </div>
        <div className="flex gap-4 text-[8px] font-mono">
          <span className="text-orange-700">{KEY_FINDINGS.filter(f => f.level === "HIGH").length} HIGH</span>
          <span className="text-yellow-700">{KEY_FINDINGS.filter(f => f.level === "MEDIUM").length} MEDIUM</span>
          <span className="text-blue-700">{KEY_FINDINGS.filter(f => f.level === "LOW").length} LOW</span>
        </div>
      </div>
    </div>
  );
}
