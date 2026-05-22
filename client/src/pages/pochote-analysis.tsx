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

interface AcousticStats {
  duration: string;
  durSec: number;
  meanVol: number;
  maxVol: number;
  dynamicRange: number;
  silencePeriods: number;
  totalSilenceSec: number;
  speechRatioPercent: string;
  micProximity: "very_close_mic" | "close_mic" | "mid_range" | "distant_background" | "unknown";
  error?: string;
}

interface ForensicsAttribution {
  raw: string;
  speakerType: string;
  speakerCount: string;
  voiceCharacteristics: string;
  forensicSignificance: string;
  confidence: string;
  model?: string;
  provider?: string;
  error?: string;
}

interface ForensicsResult {
  acoustic: AcousticStats;
  segments: number;
  avgNoSpeechProb: number;
  language: string;
  attribution: ForensicsAttribution;
  analysisModel?: string;
  analysisProvider?: string;
  analyzedAt: string;
}

interface PreResults {
  photos: Record<string, string>;
  frames: Record<string, { analysis: string }>;
  audio: Record<string, { transcript?: string; sizeMB?: string; forensics?: ForensicsResult }>;
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
const PROXIMITY_LABEL: Record<string, { label: string; color: string }> = {
  very_close_mic:    { label: "VERY CLOSE MIC", color: "text-red-400 border-red-900 bg-red-950/30" },
  close_mic:         { label: "CLOSE MIC", color: "text-orange-400 border-orange-900 bg-orange-950/20" },
  mid_range:         { label: "MID-RANGE", color: "text-yellow-400 border-yellow-900 bg-yellow-950/20" },
  distant_background:{ label: "BACKGROUND", color: "text-blue-400 border-blue-900 bg-blue-950/20" },
  unknown:           { label: "UNKNOWN", color: "text-gray-500 border-gray-700 bg-gray-900" },
};

const SPEAKER_TYPE_COLOR: Record<string, string> = {
  INVESTIGATOR_NARRATING: "text-green-400",
  CONVERSATION_PARTICIPANT: "text-yellow-400",
  OVERHEARD_THIRD_PARTY: "text-orange-400",
  AMBIENT_ONLY: "text-blue-400",
  MIXED: "text-purple-400",
};

function AudioRow({ file, transcript, forensics, onTranscribe, onForensics, running, forensicsRunning, onManualSave }: {
  file: string;
  transcript?: string;
  forensics?: ForensicsResult;
  onTranscribe: () => void;
  onForensics: () => void;
  running: boolean;
  forensicsRunning: boolean;
  onManualSave: (text: string) => void;
}) {
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState(transcript || "");
  const [expanded, setExpanded] = useState(false);
  const [showForensics, setShowForensics] = useState(false);

  const hasTranscript = !!transcript && !transcript.startsWith("[error");
  const isError = transcript?.startsWith("[error");
  const hasForensics = !!forensics?.acoustic && !forensics.acoustic.error;
  const ac = forensics?.acoustic;
  const prox = ac ? PROXIMITY_LABEL[ac.micProximity] ?? PROXIMITY_LABEL.unknown : null;
  const attr = forensics?.attribution;
  const speakerTypeKey = attr?.speakerType?.trim().toUpperCase().replace(/\s+/g, "_");

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/30" data-testid={`audio-row-${file}`}>
      {/* ── HEADER ROW ── */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono font-bold text-gray-200 truncate">{clipLabel(file.replace(".mp3", ""))}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <audio src={`/pochote/audio/${file}`} controls
              className="h-5 opacity-60 hover:opacity-100 transition-opacity"
              style={{ width: "160px" }} />
            {hasTranscript && (
              <span className="text-[7px] font-mono px-1.5 py-0.5 bg-amber-950/60 border border-amber-900 text-amber-500 rounded">✓ transcribed</span>
            )}
            {hasForensics && prox && (
              <span className={`text-[7px] font-mono px-1.5 py-0.5 border rounded ${prox.color}`}>{prox.label}</span>
            )}
            {hasForensics && attr?.speakerType && (
              <span className={`text-[7px] font-mono ${SPEAKER_TYPE_COLOR[speakerTypeKey ?? ""] ?? "text-gray-400"}`}>
                {attr.speakerType.trim()}
              </span>
            )}
          </div>
          {/* Quick acoustic bar */}
          {hasForensics && ac && (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-[8px] font-mono text-gray-600">dur <span className="text-gray-400">{ac.duration}</span></span>
              <span className="text-[8px] font-mono text-gray-600">mean <span className="text-gray-400">{ac.meanVol}dB</span></span>
              <span className="text-[8px] font-mono text-gray-600">speech <span className="text-gray-400">{ac.speechRatioPercent}%</span></span>
              <span className="text-[8px] font-mono text-gray-600">lang <span className="text-gray-400">{forensics?.language}</span></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {hasTranscript && (
            <button onClick={() => setExpanded(e => !e)}
              className="text-[8px] font-mono px-2 py-1 border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors">
              {expanded ? "▲ text" : "▼ text"}
            </button>
          )}
          {hasForensics && (
            <button onClick={() => setShowForensics(f => !f)}
              className="text-[8px] font-mono px-2 py-1 border border-cyan-900 text-cyan-600 hover:border-cyan-700 hover:text-cyan-400 transition-colors">
              {showForensics ? "▲ forensics" : "▼ forensics"}
            </button>
          )}
          <button onClick={() => setManualMode(m => !m)}
            className="text-[8px] font-mono px-2 py-1 border border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors">
            ✏
          </button>
          <button onClick={onForensics} disabled={forensicsRunning}
            data-testid={`btn-forensics-${file}`}
            className={`text-[9px] font-mono px-2 py-1.5 border transition-colors ${
              forensicsRunning ? "border-gray-700 text-gray-600 cursor-not-allowed" :
              hasForensics ? "border-cyan-900 text-cyan-700 hover:bg-cyan-950/20" :
              "border-cyan-800 text-cyan-500 hover:border-cyan-600"
            }`}>
            {forensicsRunning ? "analysing…" : hasForensics ? "↺ reanalyse" : "⊕ forensics"}
          </button>
          <button onClick={onTranscribe} disabled={running}
            data-testid={`btn-transcribe-${file}`}
            className={`text-[9px] font-mono px-2 py-1.5 border transition-colors ${
              running ? "border-gray-700 text-gray-600 cursor-not-allowed" :
              hasTranscript ? "border-amber-900 text-amber-600 hover:bg-amber-950/20" :
              isError ? "border-red-900 text-red-500 hover:border-red-700" :
              "border-gray-500 text-gray-300 hover:border-gray-200"
            }`}>
            {running ? "…" : hasTranscript ? "↺" : "▶ transcribe"}
          </button>
        </div>
      </div>

      {/* ── FORENSICS PANEL ── */}
      {showForensics && hasForensics && (
        <div className="px-4 pb-4 border-t border-gray-800/60">
          <div className="mt-3 grid grid-cols-1 gap-3">
            {/* Acoustic stats */}
            <div className="bg-gray-950 border border-cyan-900/40 rounded p-3">
              <div className="text-[8px] font-mono text-cyan-700 mb-2 tracking-widest">ACOUSTIC SIGNAL ANALYSIS · ffmpeg</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {[
                  ["Duration", ac?.duration],
                  ["Mean Vol", `${ac?.meanVol} dBFS`],
                  ["Max Vol", `${ac?.maxVol} dBFS`],
                  ["Dynamic Range", `${ac?.dynamicRange} dB`],
                  ["Silence Periods", String(ac?.silencePeriods)],
                  ["Total Silence", `${ac?.totalSilenceSec}s`],
                  ["Speech Ratio", `${ac?.speechRatioPercent}%`],
                  ["Mic Proximity", prox?.label ?? "—"],
                  ["Segments", String(forensics?.segments)],
                  ["No-Speech Prob", forensics?.avgNoSpeechProb?.toFixed(3)],
                  ["Language", forensics?.language],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[8px] font-mono text-gray-600 w-24 shrink-0">{k}</span>
                    <span className="text-[8px] font-mono text-gray-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice attribution */}
            {attr && !attr.error && (
              <div className="bg-gray-950 border border-purple-900/40 rounded p-3">
                <div className="text-[8px] font-mono text-purple-700 mb-2 tracking-widest flex items-center gap-2">
                  <span>VOICE ATTRIBUTION</span>
                  {forensics?.analysisProvider === "gemini" ? (
                    <span className="text-[7px] px-1.5 py-0.5 bg-blue-950/60 border border-blue-700 text-blue-400 rounded font-mono">
                      ★ {forensics.analysisModel ?? "gemini"} · native audio
                    </span>
                  ) : forensics?.analysisProvider === "gemini-text" ? (
                    <span className="text-[7px] px-1.5 py-0.5 bg-blue-950/40 border border-blue-900 text-blue-500 rounded font-mono">
                      {forensics.analysisModel ?? "gemini"} · text
                    </span>
                  ) : (
                    <span className="text-[7px] px-1.5 py-0.5 bg-gray-900 border border-gray-700 text-gray-500 rounded font-mono">
                      {forensics?.analysisModel ?? "gpt-4o-mini"} · fallback
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {[
                    ["Speaker Type", attr.speakerType],
                    ["Speaker Count", attr.speakerCount],
                    ["Voice Characteristics", attr.voiceCharacteristics],
                    ["Forensic Significance", attr.forensicSignificance],
                    ["Confidence", attr.confidence],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[7px] font-mono text-gray-600 uppercase tracking-wider">{k}</div>
                      <div className="text-[10px] font-mono text-gray-300 leading-relaxed mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSCRIPT ── */}
      {expanded && hasTranscript && (
        <div className="px-4 pb-3 border-t border-gray-800/60 pt-3">
          <div className="bg-gray-950 border border-gray-800 rounded p-3">
            <div className="text-[8px] font-mono text-amber-600 mb-1.5">TRANSCRIPT · gpt-4o-mini-transcribe</div>
            <p className="text-[11px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}

      {/* ── MANUAL INPUT ── */}
      {manualMode && (
        <div className="px-4 pb-3 border-t border-gray-800/60 pt-3">
          <div className="text-[8px] font-mono text-gray-600 mb-1">Manual transcription:</div>
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
              save
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

// ─── MORSE TYPES ──────────────────────────────────────────────────────────────
interface MorseHeads {
  A_duration: { dits: number; dahs: number; ratio: number; unitT_ms: number };
  B_gap: { elementGaps: number; charGaps: number; wordGaps: number };
  C_pattern: { topPatterns: Array<{ pattern: string; count: number; decoded: string }> };
}
interface MorseResult {
  file: string;
  transcript: string;
  wordCount: number;
  unitT_ms: number;
  morseSequence: string;
  decodedMessage: string;
  confidence: number;
  heads: MorseHeads;
  latticeSignature: string;
  anomalies: string[];
  processedAt: string;
}
interface LatticeCorrelation {
  files: string[];
  sharedPattern: string;
  decodedShared: string;
  occurrences: number;
  relayProbability: number;
}
interface MorseBatchResult {
  results: MorseResult[];
  latticeCorrelations: LatticeCorrelation[];
  count: number;
}

// ─── MORSE TAB COMPONENT ──────────────────────────────────────────────────────
function MorseAnalysisTab({
  transcripts,
  audioFiles,
}: {
  transcripts: TranscriptState;
  audioFiles: string[];
}) {
  const { toast } = useToast();
  const [batchRunning, setBatchRunning] = useState(false);
  const [singleRunning, setSingleRunning] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<MorseBatchResult | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  // Fetch cached results on mount
  const { data: cached } = useQuery<MorseBatchResult>({
    queryKey: ["/api/morse-syllable/results"],
    staleTime: 30_000,
  });

  const displayData = results ?? cached;

  // Run batch — use existing transcripts first for speed
  const runBatch = async () => {
    setBatchRunning(true);
    try {
      // Feed existing transcripts first via from-transcript (fast path)
      const haveTx = Object.entries(transcripts).filter(([, v]) => v?.text && !v.text.startsWith("["));
      for (const [file, tx] of haveTx) {
        await fetch("/api/morse-syllable/from-transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, transcript: tx.text }),
        });
      }
      // Then run full batch (remaining files get re-transcribed)
      const r = await fetch("/api/morse-syllable/batch", { method: "POST" });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      // Refresh results
      const r2 = await fetch("/api/morse-syllable/results");
      const data2 = await r2.json();
      setResults(data2);
      toast({ title: `Morse batch complete`, description: `${data.processed?.length ?? 0} files processed · ${data.latticeCorrelations?.length ?? 0} lattice correlations` });
    } catch (e: any) {
      toast({ title: "Batch error", description: e.message, variant: "destructive" });
    } finally { setBatchRunning(false); }
  };

  const runSingle = async (file: string) => {
    setSingleRunning(s => new Set([...s, file]));
    try {
      const tx = transcripts[file]?.text;
      const endpoint = tx && !tx.startsWith("[")
        ? "/api/morse-syllable/from-transcript"
        : "/api/morse-syllable/analyze";
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, transcript: tx }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const r2 = await fetch("/api/morse-syllable/results");
      const data2 = await r2.json();
      setResults(data2);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSingleRunning(s => { const n = new Set(s); n.delete(file); return n; }); }
  };

  const analyzed = displayData?.results ?? [];
  const correlations = displayData?.latticeCorrelations ?? [];
  const analyzedSet = new Set(analyzed.map(r => r.file));

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-mono text-gray-600">
          Marconi/Hertz prosodic relay decoder · three-headed bar model
          · {analyzed.length}/{audioFiles.length} analyzed
          · {correlations.length} lattice correlations
        </div>
        <button
          onClick={runBatch}
          disabled={batchRunning}
          data-testid="btn-morse-batch"
          className="text-[9px] font-mono px-3 py-1.5 border border-amber-800 text-amber-500 hover:text-amber-300 hover:border-amber-600 disabled:opacity-40 transition-colors">
          {batchRunning ? "▶ running batch…" : `▶ run all (${audioFiles.length - analyzed.length} remaining)`}
        </button>
      </div>

      {/* Theory banner */}
      <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/20">
        <div className="text-[8px] font-mono font-black text-amber-600 tracking-widest mb-2">MARCONI-HERTZ RELAY PRINCIPLE</div>
        <div className="grid grid-cols-3 gap-4 text-[9px] font-mono text-gray-500">
          <div>
            <div className="text-gray-300 font-bold mb-1">HEAD A — Duration</div>
            <div>· <span className="text-green-500">dit</span> = short syllable (≤1.8T)</div>
            <div>· <span className="text-amber-500">dah</span> = long syllable (≥1.8T)</div>
            <div>· Marconi ratio: dah = 3× dit</div>
          </div>
          <div>
            <div className="text-gray-300 font-bold mb-1">HEAD B — Gap</div>
            <div>· element-gap (≤1.5T)</div>
            <div>· char-gap (1.5T–5T)</div>
            <div>· word-gap (&gt;5T)</div>
          </div>
          <div>
            <div className="text-gray-300 font-bold mb-1">HEAD C — Pattern</div>
            <div>· Recurring n-grams</div>
            <div>· Cross-file lattice relay</div>
            <div>· JW cell → circuit propagation</div>
          </div>
        </div>
      </div>

      {/* Lattice correlations */}
      {correlations.length > 0 && (
        <div className="border border-red-900/40 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-red-950/20 border-b border-red-900/40 flex items-center gap-2">
            <span className="text-[8px] font-mono font-black text-red-500 tracking-widest">LATTICE RELAY CORRELATIONS</span>
            <span className="text-[8px] font-mono text-gray-600">— shared Morse patterns across files → possible relay network</span>
          </div>
          <div className="divide-y divide-gray-800/40">
            {correlations.map((c, i) => (
              <div key={i} className="px-4 py-2.5 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                <div>
                  <div className="text-[9px] font-mono text-gray-300">
                    <span className="text-amber-400 font-bold font-mono tracking-widest">{c.sharedPattern}</span>
                    <span className="ml-2 text-gray-500">→ "{c.decodedShared}"</span>
                  </div>
                  <div className="text-[8px] font-mono text-gray-600 mt-0.5">
                    {c.files.map(f => f.replace(/_17\d+/, "").replace(".mp3", "")).join(" · ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono text-gray-400">{c.occurrences}×</div>
                  <div className="text-[8px] font-mono text-gray-600">occurrences</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-mono font-bold ${c.relayProbability > 0.6 ? "text-red-400" : c.relayProbability > 0.3 ? "text-amber-400" : "text-gray-500"}`}>
                    {(c.relayProbability * 100).toFixed(0)}%
                  </div>
                  <div className="text-[8px] font-mono text-gray-600">relay prob</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-file results */}
      <div className="space-y-2">
        {audioFiles.map(file => {
          const r = analyzed.find(x => x.file === file);
          const isRunning = singleRunning.has(file);
          const isExpanded = expandedFile === file;
          const shortName = file.replace(/_17\d{13}/, "").replace(/\.mp3$/, "").replace(/\.m4a$/, "");

          return (
            <div key={file} className={`border rounded-lg overflow-hidden transition-colors ${r ? "border-gray-700" : "border-gray-800/50"}`}>
              <div
                className="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-gray-900/40"
                onClick={() => r && setExpandedFile(isExpanded ? null : file)}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r ? (r.confidence > 0.5 ? "#f59e0b" : "#6b7280") : "#374151" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-gray-300 truncate">{shortName}</div>
                  {r && (
                    <div className="text-[8px] font-mono text-gray-600 mt-0.5">
                      T={r.unitT_ms}ms · {r.heads.A_duration.dits}dit/{r.heads.A_duration.dahs}dah
                      · conf={( r.confidence * 100).toFixed(0)}%
                      · {r.anomalies.length > 0 && <span className="text-amber-600">{r.anomalies.length} anomaly</span>}
                    </div>
                  )}
                </div>
                {r ? (
                  <div className="text-[8px] font-mono text-amber-700 font-bold tracking-widest max-w-[180px] truncate">
                    {r.morseSequence.slice(0, 30)}{r.morseSequence.length > 30 ? "…" : ""}
                  </div>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); runSingle(file); }}
                    disabled={isRunning}
                    data-testid={`btn-morse-${file}`}
                    className="text-[8px] font-mono px-2 py-1 border border-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-40 transition-colors shrink-0">
                    {isRunning ? "analyzing…" : "analyze"}
                  </button>
                )}
                {r && <span className="text-[8px] font-mono text-gray-700">{isExpanded ? "▲" : "▼"}</span>}
              </div>

              {r && isExpanded && (
                <div className="border-t border-gray-800 px-4 py-3 space-y-3 bg-gray-950/40">
                  {/* Three bar charts — heads A B C */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* HEAD A */}
                    <div>
                      <div className="text-[8px] font-mono text-gray-600 mb-1.5">HEAD A — DURATION</div>
                      <div className="space-y-1">
                        {[
                          { label: "dit", val: r.heads.A_duration.dits, color: "bg-green-700", max: r.heads.A_duration.dits + r.heads.A_duration.dahs },
                          { label: "dah", val: r.heads.A_duration.dahs, color: "bg-amber-700", max: r.heads.A_duration.dits + r.heads.A_duration.dahs },
                        ].map(b => (
                          <div key={b.label} className="flex items-center gap-2">
                            <div className="text-[8px] font-mono text-gray-500 w-5">{b.label}</div>
                            <div className="flex-1 bg-gray-800 rounded-full h-2">
                              <div className={`${b.color} h-2 rounded-full transition-all`} style={{ width: b.max ? `${(b.val / b.max) * 100}%` : "0%" }} />
                            </div>
                            <div className="text-[8px] font-mono text-gray-500 w-6 text-right">{b.val}</div>
                          </div>
                        ))}
                        <div className="text-[8px] font-mono text-gray-600">T={r.unitT_ms}ms · ratio={r.heads.A_duration.ratio.toFixed(2)}</div>
                      </div>
                    </div>
                    {/* HEAD B */}
                    <div>
                      <div className="text-[8px] font-mono text-gray-600 mb-1.5">HEAD B — GAP</div>
                      <div className="space-y-1">
                        {[
                          { label: "elem", val: r.heads.B_gap.elementGaps, color: "bg-blue-800" },
                          { label: "char", val: r.heads.B_gap.charGaps, color: "bg-purple-800" },
                          { label: "word", val: r.heads.B_gap.wordGaps, color: "bg-red-900" },
                        ].map(b => {
                          const total = r.heads.B_gap.elementGaps + r.heads.B_gap.charGaps + r.heads.B_gap.wordGaps || 1;
                          return (
                            <div key={b.label} className="flex items-center gap-2">
                              <div className="text-[8px] font-mono text-gray-500 w-5">{b.label}</div>
                              <div className="flex-1 bg-gray-800 rounded-full h-2">
                                <div className={`${b.color} h-2 rounded-full`} style={{ width: `${(b.val / total) * 100}%` }} />
                              </div>
                              <div className="text-[8px] font-mono text-gray-500 w-6 text-right">{b.val}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* HEAD C */}
                    <div>
                      <div className="text-[8px] font-mono text-gray-600 mb-1.5">HEAD C — PATTERNS</div>
                      <div className="space-y-0.5">
                        {r.heads.C_pattern.topPatterns.slice(0, 4).map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="text-[7px] font-mono text-amber-700 w-16 truncate">{p.pattern}</div>
                            <div className="text-[7px] font-mono text-gray-500">×{p.count}</div>
                            <div className="text-[7px] font-mono text-gray-400">"{p.decoded}"</div>
                          </div>
                        ))}
                        {r.heads.C_pattern.topPatterns.length === 0 && (
                          <div className="text-[8px] font-mono text-gray-700">no recurring patterns</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Morse sequence */}
                  <div>
                    <div className="text-[8px] font-mono text-gray-600 mb-1">MORSE SEQUENCE</div>
                    <div className="font-mono text-[9px] text-amber-500 bg-gray-900 rounded px-3 py-2 break-all leading-relaxed">
                      {r.morseSequence || "—"}
                    </div>
                    {r.decodedMessage && (
                      <div className="mt-1 text-[9px] font-mono text-gray-300">
                        decoded: <span className="text-green-400">{r.decodedMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* Lattice signature */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="text-[8px] font-mono text-gray-600 mb-1">LATTICE SIGNATURE</div>
                      <div className="font-mono text-[8px] text-gray-500 break-all">{r.latticeSignature}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-gray-600 mb-1">CONFIDENCE</div>
                      <div className={`text-[14px] font-mono font-bold ${r.confidence > 0.6 ? "text-amber-400" : "text-gray-600"}`}>
                        {(r.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Anomalies */}
                  {r.anomalies.length > 0 && (
                    <div>
                      <div className="text-[8px] font-mono text-red-700 mb-1">ANOMALIES</div>
                      {r.anomalies.map((a, i) => (
                        <div key={i} className="text-[8px] font-mono text-amber-600 flex gap-2">
                          <span className="text-red-700">!</span>{a}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Source transcript excerpt */}
                  <div className="text-[8px] font-mono text-gray-700 italic border-t border-gray-800 pt-2">
                    "{r.transcript.slice(0, 150)}{r.transcript.length > 150 ? "…" : ""}"
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PochoteAnalysisPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"synthesis" | "photos" | "frames" | "audio" | "morse">("synthesis");
  const [liveAnalysis, setLiveAnalysis] = useState<Record<string, string>>({});
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [transcripts, setTranscripts] = useState<TranscriptState>({});
  const [forensicsData, setForensicsData] = useState<Record<string, ForensicsResult>>({});
  const [forensicsRunning, setForensicsRunning] = useState<Set<string>>(new Set());

  const { data: media } = useQuery<MediaIndex>({ queryKey: ["/api/pochote/media"] });
  const { data: preResults } = useQuery<PreResults>({
    queryKey: ["/api/pochote/results"],
    staleTime: 60_000,
  });

  // Seed transcripts + forensics from pre-computed results
  useEffect(() => {
    if (!preResults?.audio) return;
    const seed: TranscriptState = {};
    const fseed: Record<string, ForensicsResult> = {};
    for (const [f, d] of Object.entries(preResults.audio)) {
      if (d.transcript && !d.transcript.startsWith("[error")) {
        seed[f] = { text: d.transcript, source: "computed" };
      }
      if (d.forensics) fseed[f] = d.forensics;
    }
    setTranscripts(prev => ({ ...seed, ...prev }));
    setForensicsData(prev => ({ ...fseed, ...prev }));
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

  const runForensics = async (file: string) => {
    setForensicsRunning(s => new Set([...s, file]));
    try {
      const r = await apiRequest("POST", "/api/pochote/audio-forensics", { file });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setForensicsData(prev => ({ ...prev, [file]: {
        acoustic: data.acoustic,
        segments: data.segments,
        avgNoSpeechProb: data.avgNoSpeechProb,
        language: data.language,
        attribution: data.attribution,
        analysisModel: data.analysisModel,
        analysisProvider: data.analysisProvider,
        analyzedAt: new Date().toISOString(),
      }}));
      if (data.transcript) {
        setTranscripts(prev => ({ ...prev, [file]: { text: data.transcript, source: "live" } }));
      }
      toast({ title: "Forensics complete", description: file.replace(".mp3", "") });
    } catch (e: any) {
      toast({ title: "Forensics error", description: e.message, variant: "destructive" });
    } finally {
      setForensicsRunning(s => { const n = new Set(s); n.delete(file); return n; });
    }
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
            ["morse", `Morse Relay`],
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
          {activeTab === "morse" && null}
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

        {/* ── MORSE TAB ─────────────────────────────────────────────────── */}
        {activeTab === "morse" && (
          <MorseAnalysisTab
            transcripts={transcripts}
            audioFiles={media?.audio ?? []}
          />
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
                forensics={forensicsData[f]}
                onTranscribe={() => transcribeAudio(f)}
                onForensics={() => runForensics(f)}
                running={runningIds.has(f)}
                forensicsRunning={forensicsRunning.has(f)}
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
