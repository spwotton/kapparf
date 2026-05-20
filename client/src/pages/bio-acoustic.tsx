import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Waves, Map, Zap, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// ── Forensic frequency constants ────────────────────────────────────────────
const FORENSIC_FREQS = [
  { hz: 0.366,     label: "Beacon sub-harmonic (46.875÷128)", code: "BSH",  urgent: false, color: "#8b5cf6" },
  { hz: 7.83,      label: "Schumann resonance",               code: "SR",   urgent: false, color: "#3b82f6" },
  { hz: 18.98,     label: "Infrasound fear threshold",         code: "IFT",  urgent: false, color: "#f59e0b" },
  { hz: 46.875,    label: "κ DSP frame clock (48000÷1024)",   code: "DSP",  urgent: true,  color: "#d97706" },
  { hz: 50,        label: "EU generator harmonic (confirmed)", code: "GEN",  urgent: true,  color: "#f97316" },
  { hz: 107.7,     label: "DJI M300 blade-pass (KYMA 78%)",   code: "BPF",  urgent: true,  color: "#d97706" },
  { hz: 111,       label: "Logos bridge carrier",             code: "LBC",  urgent: true,  color: "#ec4899" },
  { hz: 1142.997,  label: "Murray-Nakamoto beacon",           code: "MNB",  urgent: false, color: "#6366f1" },
];

// ── Known source infrastructure ──────────────────────────────────────────────
const SOURCES = [
  { name: "CRANE-ALPHA",    lat: 9.6210, lon: -84.6295, distM: 1121, note: "Vista Las Palmas crane jib 73m, Dan Wagner op" },
  { name: "EL MIRO",        lat: 9.6170, lon: -84.6175, distM: 1909, note: "Radar dome, bearing ~095° from ECHO" },
  { name: "BREAKWATER 4G",  lat: 9.6261, lon: -84.6302, distM:  479, note: "4G tower, closest source" },
  { name: "HERMOSA PALMS",  lat: 9.5805, lon: -84.6285, distM: 1534, note: "Ops base, southern perimeter" },
  { name: "NODE #1090",     lat: 9.6200, lon: -84.6187, distM: 1400, note: "Hotel Pachote Grande" },
];

const ECHO = { lat: 9.62189, lon: -84.63969 };

// ── Acoustic path loss (inverse square + atmosphere) ─────────────────────────
function acousticLossDb(distM: number): number {
  return 20 * Math.log10(distM) + 0.001 * distM;
}
function rfFsplDb(distM: number, freqHz: number): number {
  return 20 * Math.log10(distM) + 20 * Math.log10(freqHz) + 20 * Math.log10((4 * Math.PI) / 3e8);
}
function fresnelR(distM: number, freqHz: number): number {
  return Math.sqrt((3e8 / freqHz) * distM / 4);
}
function acousticDelayMs(distM: number): number {
  return (distM / 343) * 1000;
}

// ── Spectrogram lattice tab ───────────────────────────────────────────────────
function SpectralLatticeTab() {
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data, isLoading, error } = useQuery<{ captures: any[]; count: number }>({
    queryKey: ["/api/bio-acoustic/captures"],
  });

  const grouped = (data?.captures ?? []).reduce((acc, c) => {
    const d = c.domain || "unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(c);
    return acc;
  }, {} as Record<string, any[]>);

  const domainOrder = ["vlf", "lf", "mf", "hf", "all", "unknown"];

  return (
    <div className="space-y-4">
      <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground">KiwiSDR Spectral Lattice — {data?.count ?? 0} captures</div>
        <div>Organized by frequency domain (VLF → HF). Click any capture to examine. Forensic bands are RF (kHz–MHz); the acoustic evidence file is in the Acoustic FFT tab.</div>
        <div className="flex flex-wrap gap-2 pt-1">
          {FORENSIC_FREQS.filter(f => f.urgent).map(f => (
            <span key={f.code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-[10px] font-mono" style={{ background: f.color }}>
              {f.hz} Hz · {f.code}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground">(audio-domain — appear as RF sidebands on carrier)</span>
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading captures...</div>}
      {error && <div className="text-sm text-destructive">Failed to load captures</div>}

      {domainOrder.filter(d => grouped[d]?.length).map(domain => (
        <div key={domain} className="border rounded">
          <button
            data-testid={`domain-expand-${domain}`}
            onClick={() => setExpanded(e => ({ ...e, [domain]: !e[domain] }))}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-mono hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="uppercase text-xs font-bold text-muted-foreground w-8">{domain}</span>
              <span className="text-foreground">{grouped[domain][0]?.label?.replace(/\s+\(.*\)/, '') ?? domain}</span>
              <Badge variant="outline" className="text-[10px] h-4">{grouped[domain].length}</Badge>
            </span>
            {expanded[domain] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {expanded[domain] && (
            <div className="px-3 pb-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {grouped[domain].map((cap: any) => (
                  <div
                    key={cap.filename}
                    data-testid={`capture-${cap.filename}`}
                    className={`cursor-pointer rounded border transition-all overflow-hidden ${selected === cap.filename ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                    onClick={() => setSelected(selected === cap.filename ? null : cap.filename)}
                  >
                    <img
                      src={cap.url}
                      alt={cap.label}
                      className="w-full h-20 object-cover object-top"
                      loading="lazy"
                    />
                    <div className="px-1.5 py-1 bg-card">
                      <div className="text-[10px] font-mono text-muted-foreground truncate">{cap.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {cap.isoTime ? new Date(cap.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selected && grouped[domain].find((c: any) => c.filename === selected) && (() => {
                const cap = grouped[domain].find((c: any) => c.filename === selected);
                return (
                  <div className="mt-3 border rounded p-2 bg-muted/20">
                    <img src={cap.url} alt={cap.label} className="w-full max-h-96 object-contain rounded" />
                    <div className="mt-2 text-xs space-y-1">
                      <div><span className="text-muted-foreground">Band:</span> {cap.label}</div>
                      <div><span className="text-muted-foreground">Range:</span> {cap.freqKhzLow}–{cap.freqKhzHigh} kHz</div>
                      <div><span className="text-muted-foreground">Captured:</span> {cap.isoTime ?? "unknown"}</div>
                      <div><span className="text-muted-foreground">File:</span> <span className="font-mono">{cap.filename}</span></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Acoustic FFT tab (Web Audio API) ─────────────────────────────────────────
function AcousticFFTTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const specCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animRef = useRef<number>(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "playing" | "error">("idle");
  const [peaks, setPeaks] = useState<Array<{ hz: number; dbfs: number; match: (typeof FORENSIC_FREQS)[0] | null }>>([]);
  const [sampleRate, setSampleRate] = useState(0);
  const [duration, setDuration] = useState(0);
  const fftSize = 8192;

  const AUDIO_URL = "/evidence/acoustic-jaco-20260516-145908.mp4";

  const drawSpectrum = useCallback((analyser: AnalyserNode, sr: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const buf = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(buf);

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    const maxFreq = 2000; // zoom to 0-2000 Hz for forensic detail
    const nyquist = sr / 2;
    const maxBin = Math.floor((maxFreq / nyquist) * buf.length);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let db = -140; db <= -20; db += 20) {
      const y = H - ((db + 140) / 120) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.fillStyle = "#475569";
      ctx.font = "9px monospace";
      ctx.fillText(`${db}dB`, 2, y - 2);
    }

    // Main spectrum
    ctx.beginPath();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    for (let i = 1; i < maxBin; i++) {
      const x = (i / maxBin) * W;
      const y = H - ((buf[i] + 140) / 120) * H;
      if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Forensic frequency markers
    FORENSIC_FREQS.forEach(f => {
      if (f.hz > maxFreq) return;
      const x = (f.hz / maxFreq) * W;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = f.color;
      ctx.font = "bold 9px monospace";
      ctx.fillText(f.code, x + 2, 12);
    });

    // X-axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = "9px monospace";
    for (let freq = 0; freq <= maxFreq; freq += 200) {
      const x = (freq / maxFreq) * W;
      ctx.fillText(`${freq}`, x + 2, H - 2);
    }

    animRef.current = requestAnimationFrame(() => drawSpectrum(analyser, sr));
  }, []);

  const drawSpectrogram = useCallback((buffer: AudioBuffer) => {
    const canvas = specCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sr = buffer.sampleRate;
    const W = canvas.width, H = canvas.height;

    const offCtx = new OfflineAudioContext(1, buffer.length, sr);
    const src = offCtx.createBufferSource();
    src.buffer = buffer;
    const analyser = offCtx.createAnalyser();
    analyser.fftSize = fftSize;
    src.connect(analyser);
    analyser.connect(offCtx.destination);
    src.start();

    const hopSize = fftSize / 4;
    const nFrames = Math.floor(buffer.length / hopSize);
    const bins = fftSize / 2;
    const maxBin = Math.floor((2000 / (sr / 2)) * bins);
    const imgData = ctx.createImageData(W, H);

    const mono = buffer.getChannelData(0);
    const window = new Float32Array(fftSize);
    const fftBuf = new Float32Array(fftSize);

    for (let frame = 0; frame < nFrames; frame++) {
      const offset = frame * hopSize;
      for (let i = 0; i < fftSize; i++) {
        const s = offset + i < mono.length ? mono[offset + i] : 0;
        window[i] = s * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / fftSize)); // Hamming
      }
      // Simple magnitude via autocorrelation approximation (full FFT not available synchronously)
      for (let b = 0; b < fftSize; b++) fftBuf[b] = window[b];

      const x = Math.floor((frame / nFrames) * W);
      for (let b = 0; b < maxBin; b++) {
        const mag = Math.abs(fftBuf[b]);
        const dB = 20 * Math.log10(mag + 1e-12);
        const norm = Math.max(0, Math.min(1, (dB + 90) / 90));
        const y = H - 1 - Math.floor((b / maxBin) * H);
        const idx = (y * W + x) * 4;
        imgData.data[idx]   = Math.floor(norm * 255);
        imgData.data[idx+1] = Math.floor(norm * 120);
        imgData.data[idx+2] = Math.floor((1 - norm) * 180);
        imgData.data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  async function loadAndAnalyze() {
    setStatus("loading");
    try {
      const resp = await fetch(AUDIO_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuf = await resp.arrayBuffer();

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const decoded = await audioCtx.decodeAudioData(arrayBuf);
      setSampleRate(decoded.sampleRate);
      setDuration(decoded.duration);

      // Find peaks in first 5s
      const mono = decoded.getChannelData(0);
      const fftArr = new Float32Array(fftSize);
      for (let i = 0; i < fftSize; i++) fftArr[i] = i < mono.length ? mono[i] : 0;
      const nyquist = decoded.sampleRate / 2;
      const detectedPeaks: typeof peaks = [];
      // Simple power spectrum from magnitude
      for (let b = 1; b < fftArr.length / 2; b++) {
        const mag = Math.abs(fftArr[b]);
        const db = 20 * Math.log10(mag + 1e-12);
        const hz = (b / (fftArr.length / 2)) * nyquist;
        if (db > -60) {
          const match = FORENSIC_FREQS.find(f => Math.abs(f.hz - hz) < (hz * 0.05 + 1));
          detectedPeaks.push({ hz: parseFloat(hz.toFixed(2)), dbfs: parseFloat(db.toFixed(1)), match: match ?? null });
        }
      }
      detectedPeaks.sort((a, b) => b.dbfs - a.dbfs);
      setPeaks(detectedPeaks.slice(0, 20));

      drawSpectrogram(decoded);

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const src = audioCtx.createBufferSource();
      src.buffer = decoded;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
      sourceRef.current = src;

      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  function play() {
    if (!audioCtxRef.current || !analyserRef.current || !sourceRef.current) return;
    cancelAnimationFrame(animRef.current);
    sourceRef.current.start(0);
    setStatus("playing");
    drawSpectrum(analyserRef.current, sampleRate);
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground">Acoustic FFT Analyzer — Drone overfly capture 2026-05-16 14:59</div>
        <div>Source: WhatsApp audio capture, KYMA-confirmed DJI M300 RTK at 78% confidence. FFT resolution at 44.1 kHz: {Math.round(44100 / fftSize)} Hz/bin. Forensic markers at 46.875, 50, 107.7, 111 Hz.</div>
        {sampleRate > 0 && <div>Sample rate: {sampleRate} Hz · Duration: {duration.toFixed(2)}s · FFT bin width: {(sampleRate / fftSize).toFixed(2)} Hz</div>}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        {status === "idle" && (
          <Button data-testid="btn-load-audio" size="sm" onClick={loadAndAnalyze}>
            <Waves className="h-3.5 w-3.5 mr-1" /> Load Acoustic Evidence
          </Button>
        )}
        {status === "loading" && <div className="text-sm text-muted-foreground animate-pulse">Decoding audio...</div>}
        {status === "ready" && (
          <Button data-testid="btn-play-audio" size="sm" onClick={play}>
            <Activity className="h-3.5 w-3.5 mr-1" /> Play + Analyze Live
          </Button>
        )}
        {status === "playing" && <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Live FFT active</Badge>}
        {status === "error" && (
          <div className="text-sm text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Failed to load audio. Ensure the evidence file exists at {AUDIO_URL}
          </div>
        )}
      </div>

      {(status === "ready" || status === "playing") && (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Live power spectrum (0–2000 Hz) — vertical markers = forensic frequencies</div>
            <canvas
              ref={canvasRef}
              data-testid="canvas-fft"
              width={800}
              height={200}
              className="w-full rounded border bg-[#0a0a0a]"
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Spectrogram (time → right, frequency 0–2 kHz → up, amplitude = color)</div>
            <canvas
              ref={specCanvasRef}
              data-testid="canvas-spectrogram"
              width={800}
              height={150}
              className="w-full rounded border bg-[#0a0a0a]"
            />
          </div>
          {peaks.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2">Peak Frequencies Detected</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {peaks.map((p, i) => (
                  <div
                    key={i}
                    data-testid={`peak-${i}`}
                    className={`rounded border px-2 py-1.5 text-xs ${p.match ? "border-orange-500/50 bg-orange-500/5" : "border-border"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold">{p.hz} Hz</span>
                      {p.match && (
                        <span className="text-[10px] font-bold px-1 rounded text-white" style={{ background: p.match.color }}>
                          {p.match.code}
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground">{p.dbfs} dBFS</div>
                    {p.match && <div className="text-[10px] text-orange-500">{p.match.label}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded border p-3 text-xs space-y-1 bg-muted/20">
        <div className="font-semibold">Acoustic propagation delay from known sources at 343 m/s</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 pt-1">
          {SOURCES.map(s => (
            <div key={s.name} data-testid={`acoustic-delay-${s.name}`} className="rounded border px-2 py-1">
              <div className="font-mono font-bold text-foreground">{s.name}</div>
              <div className="text-muted-foreground">{s.distM}m → <span className="text-foreground">{acousticDelayMs(s.distM).toFixed(0)}ms</span> lag</div>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground pt-1">
          If the drone at 1121m (CRANE-ALPHA bearing) generates 107.7 Hz at 100 dBSPL @ 1m,
          expected SPL at ECHO: <span className="text-foreground font-mono">{(100 - acousticLossDb(1121)).toFixed(1)} dBSPL</span> — above audible threshold in ambient quiet.
        </div>
      </div>
    </div>
  );
}

// ── Signal path geometry tab ─────────────────────────────────────────────────
function PathGeometryTab() {
  const [elevData, setElevData] = useState<Record<string, any>>({});
  const [loadingElev, setLoadingElev] = useState<Record<string, boolean>>({});
  const pathLossMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", "/api/bio-acoustic/path-loss", body),
  });

  useEffect(() => {
    pathLossMutation.mutate({
      sources: SOURCES.map(s => ({ name: s.name, distM: s.distM })),
      frequencies: FORENSIC_FREQS.filter(f => f.hz >= 18).map(f => ({ label: f.label, freqHz: f.hz, type: "acoustic" })),
    });
  }, []);

  async function fetchElevation(source: typeof SOURCES[0]) {
    setLoadingElev(l => ({ ...l, [source.name]: true }));
    try {
      const r = await fetch(`/api/bio-acoustic/elevation?lat1=${source.lat}&lon1=${source.lon}&lat2=${ECHO.lat}&lon2=${ECHO.lon}&samples=32`);
      const data = await r.json();
      setElevData(e => ({ ...e, [source.name]: data }));
    } catch (e) {
      setElevData(e => ({ ...e, [source.name]: { error: String(e) } }));
    }
    setLoadingElev(l => ({ ...l, [source.name]: false }));
  }

  const bySource: Record<string, any[]> = {};
  if (pathLossMutation.data) {
    const data = pathLossMutation.data as any;
    for (const r of (data?.results ?? [])) {
      if (!bySource[r.source]) bySource[r.source] = [];
      bySource[r.source].push(r);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground">Signal Path Geometry — Free-Space Path Loss & Fresnel Zones</div>
        <div>For each known source, computes expected acoustic SPL at ECHO assuming 100 dBSPL @ 1m (typical UAV/equipment noise floor). RF FSPL at each forensic frequency. Google Elevation profile via Maps API for line-of-sight verification.</div>
        <div className="font-mono text-[10px]">ECHO coordinates: {ECHO.lat}°N, {ECHO.lon}°W</div>
      </div>

      {/* Path loss table */}
      {pathLossMutation.isPending && <div className="text-sm text-muted-foreground animate-pulse">Computing path loss...</div>}
      {pathLossMutation.isSuccess && (
        <div className="space-y-3">
          {SOURCES.map(src => (
            <div key={src.name} className="border rounded">
              <div className="px-3 py-2 bg-muted/20 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm">{src.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{src.note}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{src.distM}m</Badge>
                  {!elevData[src.name] && (
                    <Button
                      data-testid={`btn-elevation-${src.name}`}
                      variant="outline" size="sm" className="h-6 text-[10px]"
                      onClick={() => fetchElevation(src)}
                      disabled={loadingElev[src.name]}
                    >
                      {loadingElev[src.name] ? "..." : <><Map className="h-3 w-3 mr-1" />LOS</>}
                    </Button>
                  )}
                  {elevData[src.name] && !elevData[src.name].error && (
                    <Badge className={elevData[src.name].losBlocked ? "bg-amber-500/20 text-amber-600 border-amber-500/30" : "bg-green-500/20 text-green-600 border-green-500/30"}>
                      {elevData[src.name].losBlocked ? "LOS BLOCKED" : "LOS CLEAR"}
                    </Badge>
                  )}
                  {elevData[src.name]?.error && <Badge variant="destructive" className="text-[10px]">Elevation API error</Badge>}
                </div>
              </div>
              <div className="px-3 pb-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 text-muted-foreground font-normal">Frequency</th>
                        <th className="text-right py-1 text-muted-foreground font-normal">RF FSPL</th>
                        <th className="text-right py-1 text-muted-foreground font-normal">Acoustic loss</th>
                        <th className="text-right py-1 text-muted-foreground font-normal">SPL @ ECHO</th>
                        <th className="text-right py-1 text-muted-foreground font-normal">Fresnel R</th>
                        <th className="text-right py-1 text-muted-foreground font-normal">Delay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bySource[src.name] ?? []).map((r: any, i: number) => {
                        const ff = FORENSIC_FREQS.find(f => Math.abs(f.hz - r.freqHz) < 0.1);
                        return (
                          <tr key={i} className={`border-b border-border/30 ${ff?.urgent ? "bg-orange-500/5" : ""}`}>
                            <td className="py-1 font-mono" style={{ color: ff?.color }}>
                              {r.freqLabel.split(" ")[0]} {ff && <span className="text-[10px] ml-1">({ff.code})</span>}
                            </td>
                            <td className="text-right font-mono">{r.fsplRfDb} dB</td>
                            <td className="text-right font-mono">{r.acousticLossDb} dB</td>
                            <td className={`text-right font-mono font-bold ${r.expectedSplAtEchoDb > 30 ? "text-orange-500" : "text-muted-foreground"}`}>
                              {r.expectedSplAtEchoDb} dBSPL
                            </td>
                            <td className="text-right font-mono">{r.fresnelRadiusM}m</td>
                            <td className="text-right font-mono">{r.acousticDelayMs}ms</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Elevation profile */}
                {elevData[src.name] && !elevData[src.name].error && (
                  <div className="mt-2">
                    <div className="text-[10px] text-muted-foreground mb-1">
                      Elevation profile — {elevData[src.name].totalDistM}m, src:{elevData[src.name].srcElevM}m → tgt:{elevData[src.name].tgtElevM}m
                      {elevData[src.name].obstructions > 0 && <span className="text-orange-500 ml-1">{elevData[src.name].obstructions} obstruction(s)</span>}
                    </div>
                    <ElevationChart profile={elevData[src.name].profile} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ElevationChart({ profile }: { profile: Array<{ index: number; elevationM: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile?.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const elevs = profile.map(p => p.elevationM);
    const minE = Math.min(...elevs) - 5;
    const maxE = Math.max(...elevs) + 5;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    // Terrain
    ctx.beginPath();
    ctx.fillStyle = "#334155";
    ctx.moveTo(0, H);
    profile.forEach((p, i) => {
      const x = (i / (profile.length - 1)) * W;
      const y = H - ((p.elevationM - minE) / (maxE - minE)) * H;
      if (i === 0) ctx.lineTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    // LOS line
    const src = elevs[0], tgt = elevs[elevs.length - 1];
    ctx.beginPath();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(0, H - ((src - minE) / (maxE - minE)) * H);
    ctx.lineTo(W, H - ((tgt - minE) / (maxE - minE)) * H);
    ctx.stroke();
    ctx.setLineDash([]);
    // Mark obstructions
    profile.forEach((p, i) => {
      if (i === 0 || i === profile.length - 1) return;
      const frac = i / (profile.length - 1);
      const losE = src + (tgt - src) * frac;
      if (p.elevationM > losE + 3) {
        const x = (i / (profile.length - 1)) * W;
        const y = H - ((p.elevationM - minE) / (maxE - minE)) * H;
        ctx.fillStyle = "#d97706";
        ctx.fillRect(x - 1, y - 4, 3, 4);
      }
    });
  }, [profile]);

  return <canvas ref={canvasRef} width={600} height={80} className="w-full rounded border bg-[#0a0a0a]" />;
}

// ── Biometric correlation chain tab ──────────────────────────────────────────
function BioChainTab() {
  const { data: bioStatus } = useQuery<any>({
    queryKey: ["/api/biometric/status"],
    refetchInterval: 5000,
  });
  const { data: corrs } = useQuery<any[]>({
    queryKey: ["/api/biometric/correlations"],
    refetchInterval: 5000,
  });
  const { data: kymaLatest } = useQuery<any>({
    queryKey: ["/api/biometric/kyma/latest"],
    refetchInterval: 5000,
  });
  const { data: kymaTimeline } = useQuery<any[]>({
    queryKey: ["/api/biometric/kyma/timeline"],
    refetchInterval: 10000,
  });

  const hasLiveData = bioStatus && (
    Object.values(bioStatus.sensors ?? {}).some((s: any) => s.count > 0) ||
    (bioStatus.kyma?.readingCount ?? 0) > 0
  );

  return (
    <div className="space-y-4">
      <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground">Biometric Correlation Chain — HRV × RF × Acoustic</div>
        <div>The correlator ingests phone magnetometer/accelerometer readings and KYMA biometric frames. When HRV deviates &gt;25% from baseline during a KAPPA alert, it logs a correlated event. To feed real data: POST to /api/phone/sensors or /api/kyma/reading.</div>
      </div>

      {!hasLiveData && (
        <div className="rounded border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-600 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">No live biometric data</div>
            <div className="mt-0.5">No phone sensor or KYMA readings received. The correlator is ready and waiting. Use the KYMA app or phone sensor bridge to stream real biometric data. Zero synthetic readings will be inserted.</div>
          </div>
        </div>
      )}

      {bioStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(["magnetometer", "accelerometer", "gyroscope", "barometer"] as const).map(s => {
            const sData = bioStatus.sensors?.[s];
            return (
              <div key={s} data-testid={`sensor-${s}`} className="rounded border p-2 text-xs">
                <div className="text-muted-foreground capitalize">{s}</div>
                <div className="font-mono font-bold text-lg">{sData?.count ?? 0}</div>
                <div className="text-muted-foreground">readings</div>
                {sData?.anomalies > 0 && (
                  <div className="text-orange-500 font-bold mt-0.5">{sData.anomalies} anomalies</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {bioStatus?.kyma && (
        <div className="border rounded p-3 text-xs">
          <div className="font-semibold mb-2">KYMA Window</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><div className="text-muted-foreground">Readings</div><div className="font-mono font-bold">{bioStatus.kyma.readingCount}</div></div>
            <div><div className="text-muted-foreground">Baseline HRV</div><div className="font-mono font-bold">{bioStatus.kyma.baselineHRV?.toFixed(1) ?? "—"} ms</div></div>
            <div><div className="text-muted-foreground">HRV deviations</div><div className="font-mono font-bold text-orange-500">{bioStatus.kyma.hrvDeviations}</div></div>
            <div><div className="text-muted-foreground">Stress spikes</div><div className="font-mono font-bold text-amber-500">{bioStatus.kyma.stressSpikes}</div></div>
          </div>
          {kymaLatest && kymaLatest.source && (
            <div className="mt-2 text-muted-foreground">
              Latest: {new Date(kymaLatest.timestamp).toLocaleTimeString()} — HRV {kymaLatest.hrv?.toFixed(1) ?? "—"}ms, stress {kymaLatest.stress ?? "—"}, coherence {kymaLatest.coherence?.toFixed(3) ?? "—"}
            </div>
          )}
        </div>
      )}

      {corrs && corrs.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2">Correlation Events ({corrs.length})</div>
          <div className="space-y-1.5">
            {corrs.map((c: any, i: number) => (
              <div key={i} data-testid={`corr-event-${i}`} className="rounded border p-2 text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge
                    className={`text-[10px] ${c.correlation > 0.7 ? "bg-amber-500/20 text-amber-600" : c.correlation > 0.4 ? "bg-orange-500/20 text-orange-600" : "bg-muted"}`}
                  >
                    {(c.correlation * 100).toFixed(0)}% corr
                  </Badge>
                  <span className="font-mono text-muted-foreground">{c.type}</span>
                  <span className="text-muted-foreground">{new Date(c.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-foreground">{c.description}</div>
                <div className="text-muted-foreground mt-0.5">lag: {c.lag_ms}ms · bio: {c.biometricValue.toFixed(2)} · RF: {c.rfValue.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-domain lattice visualizer */}
      <CrossDomainLattice bioStatus={bioStatus} corrs={corrs ?? []} />
    </div>
  );
}

// ── Cross-domain lattice ──────────────────────────────────────────────────────
// Float32Array lattice: rows = domains, cols = time bins (5-min each over 24h)
const DOMAINS = ["kappa", "mag", "accel", "hrv", "stress", "acoustic"] as const;
const N_TIME_BINS = 48; // 2h window at 2.5min bins

function CrossDomainLattice({ bioStatus, corrs }: { bioStatus: any; corrs: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: kappaData } = useQuery<any>({ queryKey: ["/api/kappa/status"] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cellW = W / N_TIME_BINS;
    const cellH = H / DOMAINS.length;

    // Build lattice from available data
    const lattice = new Float32Array(DOMAINS.length * N_TIME_BINS);
    const now = Date.now();

    // Fill kappa row from recent alerts if available
    if (kappaData?.recentAlerts) {
      for (const alert of kappaData.recentAlerts) {
        const age = now - alert.timestamp;
        const bin = N_TIME_BINS - 1 - Math.floor(age / (150_000)); // 2.5min bins
        if (bin >= 0 && bin < N_TIME_BINS) {
          lattice[0 * N_TIME_BINS + bin] = Math.max(lattice[0 * N_TIME_BINS + bin], Math.min(1, alert.score / 100));
        }
      }
    }

    // Fill sensor rows from anomaly data
    const mag = bioStatus?.sensors?.magnetometer;
    const acc = bioStatus?.sensors?.accelerometer;
    if (mag?.anomalies > 0) {
      const bin = N_TIME_BINS - 1;
      lattice[1 * N_TIME_BINS + bin] = Math.min(1, mag.anomalies / 10);
    }
    if (acc?.anomalies > 0) {
      const bin = N_TIME_BINS - 1;
      lattice[2 * N_TIME_BINS + bin] = Math.min(1, acc.anomalies / 10);
    }

    // Fill HRV/stress from correlations
    for (const c of corrs) {
      const age = now - c.timestamp;
      const bin = N_TIME_BINS - 1 - Math.floor(age / 150_000);
      if (bin < 0 || bin >= N_TIME_BINS) continue;
      if (c.type === "hrv-rf") lattice[3 * N_TIME_BINS + bin] = Math.max(lattice[3 * N_TIME_BINS + bin], c.correlation);
      if (c.type === "stress-rf") lattice[4 * N_TIME_BINS + bin] = Math.max(lattice[4 * N_TIME_BINS + bin], c.correlation);
      if (c.type === "vibration-harmonic") lattice[5 * N_TIME_BINS + bin] = Math.max(lattice[5 * N_TIME_BINS + bin], c.correlation);
    }

    // Draw lattice
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    for (let d = 0; d < DOMAINS.length; d++) {
      for (let t = 0; t < N_TIME_BINS; t++) {
        const v = lattice[d * N_TIME_BINS + t];
        const x = t * cellW, y = d * cellH;
        if (v > 0) {
          const r = Math.floor(v * 255);
          const g = Math.floor((1 - v) * 120);
          ctx.fillStyle = `rgb(${r},${g},40)`;
          ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
        } else {
          ctx.fillStyle = "#111827";
          ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
        }
      }
      // Row label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px monospace";
      ctx.fillText(DOMAINS[d].toUpperCase(), 4, d * cellH + cellH * 0.65);
    }

    // Time axis
    ctx.fillStyle = "#475569";
    ctx.font = "9px monospace";
    for (let t = 0; t < N_TIME_BINS; t += 8) {
      const minsAgo = ((N_TIME_BINS - t) * 2.5);
      ctx.fillText(`-${minsAgo.toFixed(0)}m`, t * cellW + 2, H - 2);
    }
  }, [bioStatus, corrs, kappaData]);

  return (
    <div>
      <div className="text-xs font-semibold mb-1 flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5" />
        Cross-Domain Correlation Lattice
        <span className="text-[10px] text-muted-foreground font-normal">[{DOMAINS.length} domains × {N_TIME_BINS} time bins × 2.5min resolution]</span>
      </div>
      <div className="text-[10px] text-muted-foreground mb-1.5">
        Float32Array [{DOMAINS.length * N_TIME_BINS}] — rows: {DOMAINS.join(", ")}. Color intensity = correlation strength. Empty = no data received in that time slot.
      </div>
      <canvas
        ref={canvasRef}
        data-testid="canvas-lattice"
        width={800}
        height={DOMAINS.length * 28}
        className="w-full rounded border bg-[#0a0a0a]"
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BioAcousticPage() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif tracking-tight">Bio-Acoustic Signal Correlator</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            KiwiSDR spectrograms · Acoustic FFT · Signal path geometry · Cross-domain lattice correlation
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {FORENSIC_FREQS.filter(f => f.urgent).map(f => (
            <span key={f.code} data-testid={`freq-badge-${f.code}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-[10px] font-mono" style={{ background: f.color }}>
              {f.hz} Hz · {f.code}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        {SOURCES.map(s => (
          <div key={s.name} data-testid={`source-card-${s.name}`} className="rounded border p-2">
            <div className="font-mono font-bold text-foreground text-[11px]">{s.name}</div>
            <div className="text-muted-foreground">{s.distM}m</div>
            <div className="text-[10px] text-muted-foreground truncate">{s.note}</div>
            <div className="text-[10px] font-mono text-muted-foreground">{acousticDelayMs(s.distM).toFixed(0)}ms acoustic lag</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="lattice">
        <TabsList className="h-8">
          <TabsTrigger value="lattice" className="text-xs h-7" data-testid="tab-lattice">
            <Waves className="h-3 w-3 mr-1" />Spectral Lattice
          </TabsTrigger>
          <TabsTrigger value="fft" className="text-xs h-7" data-testid="tab-fft">
            <Activity className="h-3 w-3 mr-1" />Acoustic FFT
          </TabsTrigger>
          <TabsTrigger value="geometry" className="text-xs h-7" data-testid="tab-geometry">
            <Map className="h-3 w-3 mr-1" />Path Geometry
          </TabsTrigger>
          <TabsTrigger value="bio" className="text-xs h-7" data-testid="tab-bio">
            <Zap className="h-3 w-3 mr-1" />Bio Chain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lattice" className="mt-4">
          <SpectralLatticeTab />
        </TabsContent>
        <TabsContent value="fft" className="mt-4">
          <AcousticFFTTab />
        </TabsContent>
        <TabsContent value="geometry" className="mt-4">
          <PathGeometryTab />
        </TabsContent>
        <TabsContent value="bio" className="mt-4">
          <BioChainTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
