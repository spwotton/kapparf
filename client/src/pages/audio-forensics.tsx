import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mic, Upload, Play, Pause, FileAudio, Loader2, CheckCircle2,
  AlertTriangle, Brain, Clock, ChevronDown, ChevronUp, Copy, Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioFile {
  filename: string;
  duration: number;
  bitrate: number;
  size: number;
  codec: string;
  sampleRate: number;
  channels: number;
  createdAt: string | null;
  transcribed: boolean;
  transcription: string | null;
  transcribedAt: string | null;
  language: string | null;
  url: string;
}

interface FilesResponse {
  files: AudioFile[];
  total: number;
  transcribed: number;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractLabel(filename: string) {
  const match = filename.match(/Break_Water_Point_(\d+)_/i) || filename.match(/Break_Water_Point_(\d+)\./i);
  if (match) return `BWP-${match[1]}`;
  const m2 = filename.match(/_(\d+)\./);
  return m2 ? `REC-${m2[1].slice(-4)}` : filename.replace(/\.(m4a|mp3|wav)$/i, "").slice(0, 16);
}

function AudioPlayer({ url, duration }: { url: string; duration: number }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 mt-2" data-testid="audio-player">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
        preload="metadata"
      />
      <Button size="sm" variant="outline" onClick={toggle} className="h-7 w-7 p-0 shrink-0" data-testid="button-play-pause">
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <div className="flex-1 relative h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
        onClick={(e) => {
          if (!audioRef.current || !duration) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          audioRef.current.currentTime = pct * duration;
        }}>
        <div className="absolute inset-y-0 left-0 bg-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>
    </div>
  );
}

function FileCard({ file, onTranscribe, transcribing }: {
  file: AudioFile;
  onTranscribe: (filename: string) => void;
  transcribing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const label = extractLabel(file.filename);

  const copyTranscription = () => {
    if (file.transcription) {
      navigator.clipboard.writeText(file.transcription);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <Card className="border border-border" data-testid={`card-audio-${label}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${file.transcribed ? "bg-emerald-500/10" : "bg-muted"}`}>
              <FileAudio className={`h-4 w-4 ${file.transcribed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-foreground" data-testid={`text-label-${label}`}>{label}</span>
                {file.transcribed && (
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />TRANSCRIBED
                  </Badge>
                )}
                {file.language && (
                  <Badge variant="secondary" className="text-[9px]">{file.language.toUpperCase()}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{formatDuration(file.duration)}</span>
                <span>{formatSize(file.size)}</span>
                <span>{file.bitrate} kbps · {file.codec.toUpperCase()}</span>
                {file.createdAt && <span>{new Date(file.createdAt).toLocaleString("sv")}</span>}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={file.transcribed ? "outline" : "default"}
            className="shrink-0 h-7 text-xs"
            onClick={() => onTranscribe(file.filename)}
            disabled={transcribing}
            data-testid={`button-transcribe-${label}`}
          >
            {transcribing ? <Loader2 className="h-3 w-3 animate-spin" /> : file.transcribed ? "Re-run" : "Transcribe"}
          </Button>
        </div>

        <AudioPlayer url={file.url} duration={file.duration} />

        {file.transcribed && file.transcription && (
          <div className="mt-3">
            <button
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-expand-${label}`}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="font-mono uppercase tracking-wide">Transcription</span>
              <span className="ml-auto text-[9px]">{file.transcription.length} chars</span>
            </button>
            {expanded && (
              <div className="mt-2 relative">
                <div className="bg-muted/60 rounded-md p-3 text-sm text-foreground leading-relaxed border border-border/50 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans" data-testid={`text-transcription-${label}`}>
                  {file.transcription || <span className="text-muted-foreground italic">[No speech detected]</span>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={copyTranscription}
                  data-testid={`button-copy-${label}`}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AudioForensicsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [transcribingFile, setTranscribingFile] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<FilesResponse>({
    queryKey: ["/api/audio-forensics/files"],
    refetchInterval: 5000,
  });

  const transcribeMutation = useMutation({
    mutationFn: (filename: string) => apiRequest("POST", "/api/audio-forensics/transcribe", { filename }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/audio-forensics/files"] }); },
  });

  const handleTranscribe = async (filename: string) => {
    setTranscribingFile(filename);
    try {
      await transcribeMutation.mutateAsync(filename);
      toast({ title: "Transcription complete", description: filename });
    } catch (e: any) {
      toast({ title: "Transcription failed", description: e.message, variant: "destructive" });
    } finally {
      setTranscribingFile(null);
    }
  };

  const handleTranscribeAll = async () => {
    const files = data?.files.filter(f => !f.transcribed) ?? [];
    if (files.length === 0) { toast({ title: "All files already transcribed" }); return; }
    for (const file of files) {
      await handleTranscribe(file.filename);
    }
    toast({ title: `Transcribed ${files.length} files` });
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/audio-forensics/analyze", {});
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAnalysis(json.analysis);
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const uploadFiles = useCallback(async (fileList: FileList) => {
    const formData = new FormData();
    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (/\.(m4a|mp3|wav|ogg|webm|aac)$/i.test(file.name)) accepted.push(file);
    }
    if (accepted.length === 0) { toast({ title: "No supported audio files found" }); return; }
    accepted.forEach(f => formData.append("files", f));
    setUploadProgress(`Uploading ${accepted.length} file${accepted.length > 1 ? "s" : ""}…`);
    try {
      const res = await fetch("/api/audio-forensics/upload", { method: "POST", body: formData });
      const json = await res.json();
      setUploadProgress(null);
      toast({ title: `Uploaded ${json.uploaded} file${json.uploaded !== 1 ? "s" : ""}` });
      refetch();
    } catch (e: any) {
      setUploadProgress(null);
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  }, [refetch, toast]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  };

  const files = data?.files ?? [];
  const totalDuration = files.reduce((s, f) => s + f.duration, 0);
  const transcribedCount = files.filter(f => f.transcribed).length;

  const seenNums = new Set(files.map(f => {
    const m = f.filename.match(/Break_Water_Point_(\d+)[_\.]/);
    return m ? parseInt(m[1]) : null;
  }).filter(Boolean));
  const maxNum = seenNums.size > 0 ? Math.max(...[...seenNums].filter(Boolean) as number[]) : 0;
  const gaps: number[] = [];
  for (let i = 1; i <= maxNum; i++) { if (!seenNums.has(i)) gaps.push(i); }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="audio-forensics-page">
      <div className="border-b border-border pb-4">
        <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tracking-widest mb-1">EVIDENCE · AUDIO FORENSICS</div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Break Water Point</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Breakwater Point Hermosa, Jacó, Costa Rica — field recordings. Your voice may appear. Upload all recordings below.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "RECORDINGS", value: files.length, sub: "files indexed", color: "text-foreground" },
          { label: "TOTAL DURATION", value: formatDuration(totalDuration), sub: "across all files", color: "text-foreground" },
          { label: "TRANSCRIBED", value: transcribedCount, sub: `of ${files.length} files`, color: transcribedCount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground" },
          { label: "SEQUENCE GAPS", value: gaps.length, sub: gaps.length > 0 ? `#${gaps.slice(0, 5).join(", ")}` : "none detected", color: gaps.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-3">
              <div className="text-[9px] font-mono tracking-widest text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-2xl font-mono font-bold ${s.color}`} data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gap warning */}
      {gaps.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-md text-sm" data-testid="gap-warning">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-700 dark:text-amber-400">Sequence gaps detected: </span>
            <span className="text-foreground">Recordings #{gaps.join(", ")} are missing from the sequence. This may indicate deleted or withheld files.</span>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${dragging ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-emerald-500/50 hover:bg-muted/30"}`}
        data-testid="upload-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".m4a,.mp3,.wav,.ogg,.webm,.aac"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          data-testid="input-file-upload"
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        {uploadProgress ? (
          <div className="flex items-center justify-center gap-2 text-sm text-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {uploadProgress}
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">Drop recordings here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports M4A, MP3, WAV, OGG, WebM — up to 100 files at once, 200 MB each</p>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          className="bg-emerald-700 hover:bg-emerald-800 text-white"
          onClick={handleTranscribeAll}
          disabled={!!transcribingFile || files.length === 0}
          data-testid="button-transcribe-all"
        >
          {transcribingFile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
          Transcribe All ({files.filter(f => !f.transcribed).length} pending)
        </Button>
        <Button
          variant="outline"
          onClick={handleAnalyze}
          disabled={analyzing || transcribedCount === 0}
          data-testid="button-analyze"
        >
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
          AI Forensic Analysis ({transcribedCount} transcriptions)
        </Button>
      </div>

      {/* AI Analysis output */}
      {analysis && (
        <Card className="border border-emerald-500/20 bg-emerald-500/5" data-testid="analysis-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Forensic Analysis — {transcribedCount} recordings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans" data-testid="text-analysis">{analysis}</pre>
            <Button
              size="sm" variant="outline" className="mt-3"
              onClick={() => { navigator.clipboard.writeText(analysis); toast({ title: "Analysis copied" }); }}
              data-testid="button-copy-analysis"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* File list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading recordings…
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileAudio className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No recordings found. Upload your M4A files above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground tracking-widest">{files.length} RECORDINGS INDEXED</div>
          {files.map(f => (
            <FileCard
              key={f.filename}
              file={f}
              onTranscribe={handleTranscribe}
              transcribing={transcribingFile === f.filename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
