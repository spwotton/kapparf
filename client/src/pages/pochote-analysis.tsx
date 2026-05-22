import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MediaIndex {
  photos: string[];
  frames: string[];
  audio: string[];
}

interface AnalysisResult {
  id: string;
  type: "photos" | "frames" | "audio";
  files: string[];
  analysis: string;
  transcript?: string;
  timestamp: number;
}

// ─── SEVERITY BADGE ───────────────────────────────────────────────────────────
function SeverityBadge({ text }: { text: string }) {
  const m = text.match(/\[SEVERITY:\s*(LOW|MEDIUM|HIGH|CRITICAL)\]/i);
  if (!m) return null;
  const level = m[1].toUpperCase();
  const colors: Record<string, string> = {
    LOW:      "bg-blue-900/40 text-blue-400 border-blue-800",
    MEDIUM:   "bg-yellow-900/40 text-yellow-400 border-yellow-800",
    HIGH:     "bg-orange-900/40 text-orange-400 border-orange-800",
    CRITICAL: "bg-red-900/40 text-red-400 border-red-700",
  };
  return (
    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 border rounded ${colors[level] ?? colors.LOW}`}>
      {level}
    </span>
  );
}

// ─── RENDER ANALYSIS TEXT ─────────────────────────────────────────────────────
function AnalysisText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const cleaned = line.replace(/\[SEVERITY:\s*(LOW|MEDIUM|HIGH|CRITICAL)\]/gi, "").trim();
        if (!cleaned) return <div key={i} className="h-2"/>;
        const isBullet = /^[\d]+\.|^[•\-\*]/.test(cleaned);
        const isHeader = /^(SUMMARY|FINDING|INFRASTRUCTURE|NETWORK|STRUCTURAL|PERSONNEL|SURVEILLANCE|ENVIRONMENTAL|ACOUSTIC)/i.test(cleaned);
        return (
          <div key={i} className={`flex items-start gap-2 ${isBullet ? "pl-2" : ""}`}>
            <SeverityBadge text={line}/>
            <span className={`text-[11px] font-mono leading-relaxed ${
              isHeader ? "text-gray-200 font-bold tracking-wide" :
              cleaned.startsWith("[") ? "text-gray-400" :
              "text-gray-300"
            }`}>{cleaned}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CLIP LABEL ───────────────────────────────────────────────────────────────
function clipLabel(name: string) {
  // Friendly label for a clip name
  if (name.startsWith("IMG_")) return name.replace(/_\d+$/, "");
  if (name.length > 20) return name.slice(0, 8) + "…" + name.slice(-6);
  return name;
}

// ─── FRAME GRID ───────────────────────────────────────────────────────────────
function FrameGroup({ clip, frames, onAnalyze, result, running }: {
  clip: string;
  frames: string[];
  onAnalyze: (files: string[], type: "frames") => void;
  result?: AnalysisResult;
  running: boolean;
}) {
  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden"
      data-testid={`clip-group-${clip}`}>
      <div className="bg-gray-900/80 px-4 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono font-bold text-gray-200">{clipLabel(clip)}</div>
          <div className="text-[8px] font-mono text-gray-600">{frames.length} frames extracted</div>
        </div>
        <button
          onClick={() => onAnalyze(frames, "frames")}
          disabled={running}
          data-testid={`button-analyze-${clip}`}
          className={`text-[9px] font-mono px-3 py-1.5 border transition-colors ${
            running ? "border-gray-700 text-gray-600 cursor-not-allowed" :
            result ? "border-green-800 text-green-400 hover:bg-green-900/20" :
            "border-gray-500 text-gray-300 hover:border-gray-300"
          }`}>
          {running ? "analyzing…" : result ? "✓ re-analyze" : "▶ analyze"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-0.5 bg-gray-950">
        {frames.map(f => (
          <div key={f} className="relative aspect-video overflow-hidden bg-gray-900">
            <img src={`/pochote/frames/${f}`} alt={f}
              className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"/>
            <div className="absolute bottom-1 left-1 text-[7px] font-mono text-gray-500 bg-black/60 px-1">
              {f.replace(/_f(1|mid|end)\.jpg$/, "") === clip ? f.match(/_f(\w+)\.jpg$/)?.[1] : ""}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/40">
          <AnalysisText text={result.analysis}/>
        </div>
      )}
    </div>
  );
}

// ─── AUDIO ROW ────────────────────────────────────────────────────────────────
function AudioRow({ file, onTranscribe, result, running }: {
  file: string;
  onTranscribe: (file: string) => void;
  result?: AnalysisResult;
  running: boolean;
}) {
  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40"
      data-testid={`audio-row-${file}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] font-mono font-bold text-gray-200">{clipLabel(file.replace(".mp3",""))}</div>
          <div className="text-[8px] font-mono text-gray-600">audio track · whisper-1</div>
        </div>
        <button onClick={() => onTranscribe(file)} disabled={running}
          data-testid={`button-transcribe-${file}`}
          className={`text-[9px] font-mono px-3 py-1.5 border transition-colors ${
            running ? "border-gray-700 text-gray-600 cursor-not-allowed" :
            result ? "border-amber-800 text-amber-400 hover:bg-amber-900/20" :
            "border-gray-500 text-gray-300 hover:border-gray-300"
          }`}>
          {running ? "transcribing…" : result ? "✓ re-transcribe" : "▶ transcribe"}
        </button>
      </div>
      {result?.transcript && (
        <div className="mt-2 p-3 bg-gray-950 rounded border border-gray-800">
          <div className="text-[9px] font-mono text-amber-500 mb-1.5">TRANSCRIPT</div>
          <p className="text-[11px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
            {result.transcript}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PochoteAnalysisPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"photos" | "frames" | "audio">("photos");
  const [photoPage, setPhotoPage] = useState(0);

  const { data: media, isLoading: mediaLoading } = useQuery<MediaIndex>({
    queryKey: ["/api/pochote/media"],
  });

  const startRunning = (id: string) => setRunningIds(s => new Set([...s, id]));
  const stopRunning  = (id: string) => setRunningIds(s => { const n = new Set(s); n.delete(id); return n; });

  const analyzeImages = async (files: string[], type: "photos" | "frames") => {
    const id = files.join(",");
    startRunning(id);
    try {
      const r = await apiRequest("POST", "/api/pochote/analyze-images", { files, type });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setResults(prev => [...prev.filter(x => x.id !== id), {
        id, type, files, analysis: data.analysis, timestamp: Date.now()
      }]);
    } catch(e: any) {
      toast({ title: "Analysis error", description: e.message, variant: "destructive" });
    } finally { stopRunning(id); }
  };

  const transcribeAudio = async (file: string) => {
    startRunning(file);
    try {
      const r = await apiRequest("POST", "/api/pochote/transcribe", { file });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setResults(prev => [...prev.filter(x => x.id !== file), {
        id: file, type: "audio", files: [file],
        analysis: "", transcript: data.transcript || "[no speech detected]",
        timestamp: Date.now()
      }]);
    } catch(e: any) {
      toast({ title: "Transcription error", description: e.message, variant: "destructive" });
    } finally { stopRunning(file); }
  };

  // Group frames by clip
  const framesByClip: Record<string, string[]> = {};
  for (const f of (media?.frames ?? [])) {
    const clip = f.replace(/_f(1|mid|end)\.jpg$/, "");
    if (!framesByClip[clip]) framesByClip[clip] = [];
    framesByClip[clip].push(f);
  }

  const photoFiles = media?.photos ?? [];
  const PHOTOS_PER_PAGE = 6;
  const photoPageFiles = photoFiles.slice(photoPage * PHOTOS_PER_PAGE, (photoPage + 1) * PHOTOS_PER_PAGE);
  const photoPageCount = Math.ceil(photoFiles.length / PHOTOS_PER_PAGE);

  const runAllPhotos = () => {
    for (let i = 0; i < photoPageCount; i++) {
      const batch = photoFiles.slice(i * PHOTOS_PER_PAGE, (i+1) * PHOTOS_PER_PAGE).filter((_,j)=>j<4);
      if (batch.length) setTimeout(() => analyzeImages(batch, "photos"), i * 500);
    }
  };

  const runAllClips = () => {
    Object.entries(framesByClip).forEach(([, frames], i) => {
      setTimeout(() => analyzeImages(frames, "frames"), i * 600);
    });
  };

  const runAllAudio = () => {
    (media?.audio ?? []).forEach((f, i) => {
      setTimeout(() => transcribeAudio(f), i * 400);
    });
  };

  const criticalFindings = results
    .flatMap(r => r.analysis.split("\n"))
    .filter(l => /CRITICAL|HIGH/.test(l) && l.trim().length > 10);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col"
      style={{ fontFamily: "'SF Mono','Fira Code',monospace" }}>

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[13px] font-bold text-gray-100 tracking-tight">
              Pochote Forensic Analysis
            </h1>
            <span className="text-[9px] font-mono px-2 py-0.5 border border-red-800 text-red-400 rounded">
              SENSITIVE
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mt-0.5">
            Hotel Pochote Grande, La Flor, Jacó, Costa Rica · AI Vision + Whisper · gpt-4o
            {media && ` · ${media.photos.length} photos · ${Object.keys(framesByClip).length} clips · ${media.audio.length} audio tracks`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <a href="/network-analysis" className="text-gray-500 hover:text-gray-300 transition-colors">← HUMINT</a>
          <a href="/forensics" className="text-gray-500 hover:text-gray-300 transition-colors">← forensics</a>
        </div>
      </header>

      {/* Critical findings ticker */}
      {criticalFindings.length > 0 && (
        <div className="bg-red-950/40 border-b border-red-900/50 px-6 py-2 flex items-center gap-3">
          <span className="text-[9px] font-mono font-black text-red-400 shrink-0">⚠ TOP FINDINGS</span>
          <div className="text-[9px] font-mono text-red-300/80 truncate">
            {criticalFindings.slice(0,3).map(l => l.replace(/\[SEVERITY:[^\]]+\]/gi,"").trim()).join(" · ")}
          </div>
        </div>
      )}

      {mediaLoading && (
        <div className="flex-1 flex items-center justify-center text-[11px] font-mono text-gray-600">
          Loading media index…
        </div>
      )}

      {!mediaLoading && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs + run-all */}
          <div className="flex items-center gap-0 border-b border-gray-800 px-6">
            {(["photos","frames","audio"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                data-testid={`tab-${t}`}
                className={`px-5 py-3 text-[10px] font-mono uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === t
                    ? "border-gray-300 text-gray-200"
                    : "border-transparent text-gray-600 hover:text-gray-400"
                }`}>
                {t}
                <span className="ml-1.5 text-gray-700">
                  {t === "photos" ? `(${photoFiles.length})` :
                   t === "frames" ? `(${Object.keys(framesByClip).length} clips)` :
                   `(${media?.audio?.length ?? 0})`}
                </span>
              </button>
            ))}
            <div className="ml-auto flex gap-3 py-2">
              {activeTab === "photos" && (
                <button onClick={runAllPhotos}
                  data-testid="button-run-all-photos"
                  className="text-[9px] font-mono px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 transition-colors">
                  ▶ analyze all photos
                </button>
              )}
              {activeTab === "frames" && (
                <button onClick={runAllClips}
                  data-testid="button-run-all-frames"
                  className="text-[9px] font-mono px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 transition-colors">
                  ▶ analyze all clips
                </button>
              )}
              {activeTab === "audio" && (
                <button onClick={runAllAudio}
                  data-testid="button-run-all-audio"
                  className="text-[9px] font-mono px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 transition-colors">
                  ▶ transcribe all
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">

            {/* ── PHOTOS TAB ─────────────────────────────────────────────────── */}
            {activeTab === "photos" && (
              <div className="space-y-6">
                {/* Photo grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {photoPageFiles.map(photo => {
                    const batchId = photoPageFiles.slice(
                      Math.floor(photoPageFiles.indexOf(photo) / 4) * 4,
                      Math.floor(photoPageFiles.indexOf(photo) / 4) * 4 + 4
                    ).join(",");
                    return (
                      <div key={photo} className="group relative border border-gray-800 rounded overflow-hidden bg-gray-900"
                        data-testid={`photo-${photo}`}>
                        <img src={`/pochote/photos/${photo}`} alt={photo}
                          className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                          <div className="text-[8px] font-mono text-gray-400">{photo}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {photoPageCount > 1 && (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPhotoPage(p => Math.max(0, p-1))}
                      disabled={photoPage === 0}
                      className="text-[9px] font-mono px-3 py-1.5 border border-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-30">
                      ← prev
                    </button>
                    <span className="text-[9px] font-mono text-gray-600">
                      {photoPage+1} / {photoPageCount}
                    </span>
                    <button onClick={() => setPhotoPage(p => Math.min(photoPageCount-1, p+1))}
                      disabled={photoPage === photoPageCount-1}
                      className="text-[9px] font-mono px-3 py-1.5 border border-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-30">
                      next →
                    </button>
                    <button onClick={() => analyzeImages(photoPageFiles.slice(0,4), "photos")}
                      disabled={runningIds.has(photoPageFiles.slice(0,4).join(","))}
                      data-testid="button-analyze-page"
                      className="ml-4 text-[9px] font-mono px-3 py-1.5 border border-gray-500 text-gray-300 hover:border-gray-300">
                      ▶ analyze this page
                    </button>
                  </div>
                )}

                {/* Photo analysis results */}
                {results.filter(r => r.type === "photos").map(r => (
                  <div key={r.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/40">
                    <div className="text-[9px] font-mono text-gray-500 mb-3">
                      FILES: {r.files.join(", ")} · {new Date(r.timestamp).toLocaleTimeString()}
                    </div>
                    <AnalysisText text={r.analysis}/>
                  </div>
                ))}

                {photoFiles.length === 0 && (
                  <div className="text-[11px] font-mono text-gray-600 text-center py-12">
                    No photos found in /public/pochote/photos/
                  </div>
                )}
              </div>
            )}

            {/* ── FRAMES TAB ─────────────────────────────────────────────────── */}
            {activeTab === "frames" && (
              <div className="space-y-4">
                {Object.entries(framesByClip).map(([clip, frames]) => (
                  <FrameGroup key={clip} clip={clip} frames={frames}
                    onAnalyze={analyzeImages}
                    result={results.find(r => r.id === frames.join(","))}
                    running={runningIds.has(frames.join(","))}
                  />
                ))}
                {Object.keys(framesByClip).length === 0 && (
                  <div className="text-[11px] font-mono text-gray-600 text-center py-12">
                    No video frames found. Processing may still be running.
                  </div>
                )}
              </div>
            )}

            {/* ── AUDIO TAB ──────────────────────────────────────────────────── */}
            {activeTab === "audio" && (
              <div className="space-y-3">
                <div className="text-[9px] font-mono text-gray-600 pb-1">
                  Transcription uses Whisper-1 · primary language: Spanish (Costa Rican) · also captures English/German
                </div>
                {(media?.audio ?? []).map(f => (
                  <AudioRow key={f} file={f}
                    onTranscribe={transcribeAudio}
                    result={results.find(r => r.id === f)}
                    running={runningIds.has(f)}
                  />
                ))}
                {(media?.audio?.length ?? 0) === 0 && (
                  <div className="text-[11px] font-mono text-gray-600 text-center py-12">
                    No audio tracks found.
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-800 px-6 py-2 flex items-center justify-between">
        <div className="text-[8px] font-mono text-gray-700 tracking-widest">
          KAPPA · FORENSICS · POCHOTE ARRAY · {results.length} ANALYSES COMPLETE · gpt-4o · whisper-1
        </div>
        <div className="flex gap-4 text-[8px] font-mono">
          <span className="text-blue-700">{results.filter(r=>r.analysis.includes("LOW")).length} LOW</span>
          <span className="text-yellow-700">{results.filter(r=>r.analysis.includes("MEDIUM")).length} MEDIUM</span>
          <span className="text-orange-700">{results.filter(r=>r.analysis.includes("HIGH")).length} HIGH</span>
          <span className="text-red-700">{results.filter(r=>r.analysis.includes("CRITICAL")).length} CRITICAL</span>
        </div>
      </div>
    </div>
  );
}
