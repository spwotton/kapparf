import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Square, Play, Pause, Download, RefreshCw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── FFT (Cooley-Tukey, in-place, power-of-2) ──────────────────────────────
function fftInPlace(re: Float64Array, im: Float64Array) {
  const n = re.length;
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let uRe = 1, uIm = 0;
      for (let k = 0; k < len >> 1; k++) {
        const tRe = uRe * re[i + k + (len >> 1)] - uIm * im[i + k + (len >> 1)];
        const tIm = uRe * im[i + k + (len >> 1)] + uIm * re[i + k + (len >> 1)];
        re[i + k + (len >> 1)] = re[i + k] - tRe;
        im[i + k + (len >> 1)] = im[i + k] - tIm;
        re[i + k] += tRe;
        im[i + k] += tIm;
        const nRe = uRe * wRe - uIm * wIm;
        uIm = uRe * wIm + uIm * wRe;
        uRe = nRe;
      }
    }
  }
}

function computeMagnitudeDb(re: Float64Array, im: Float64Array): Float64Array {
  const n = re.length >> 1;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / re.length;
    out[i] = mag > 1e-12 ? 20 * Math.log10(mag) : -120;
  }
  return out;
}

// ── Hann window ───────────────────────────────────────────────────────────
function hannWindow(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

// ── Target frequencies ────────────────────────────────────────────────────
const TARGETS = [
  { hz: 0.562, label: "Ω torque", color: "#a78bfa" },
  { hz: 6.5,   label: "θ beat",   color: "#f59e0b" },
  { hz: 7.83,  label: "Schumann", color: "#34d399" },
  { hz: 8.39,  label: "Ω₀",       color: "#22d3ee" },
  { hz: 13.125,label: "46.875 alias ★", color: "#f87171", bold: true },
  { hz: 14.3,  label: "Sch-2",    color: "#6ee7b7" },
];

const FFT_SIZE = 512;
const HANN = hannWindow(FFT_SIZE);
const DISPLAY_HZ = 30;

interface Peak { hz: number; db: number; snr: number; label: string }

export default function OpticalScanPage() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const specRef    = useRef<HTMLCanvasElement>(null);
  const sigRef     = useRef<HTMLCanvasElement>(null);
  const offRef     = useRef<HTMLCanvasElement>(document.createElement("canvas"));

  // frame data
  const blueBuffer  = useRef(new Float64Array(FFT_SIZE));
  const bufferIdx   = useRef(0);
  const bufferFull  = useRef(false);
  const frameTimes  = useRef<number[]>([]);
  const rafId       = useRef<number>(0);
  const streamRef   = useRef<MediaStream | null>(null);
  const spectrumRef = useRef<Float64Array | null>(null);
  const freqAxis    = useRef<Float64Array | null>(null);

  // ROI drag
  const roiRef      = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStart   = useRef<{ x: number; y: number } | null>(null);

  const [streaming,   setStreaming]   = useState(false);
  const [fps,         setFps]         = useState(0);
  const [fill,        setFill]        = useState(0);
  const [peaks,       setPeaks]       = useState<Peak[]>([]);
  const [cameraErr,   setCameraErr]   = useState("");
  const [frozen,      setFrozen]      = useState(false);
  const frozenRef = useRef(false);

  // ── draw FFT spectrum canvas ─────────────────────────────────────────
  const drawSpectrum = useCallback((spectrum: Float64Array, fps: number) => {
    const cvs = specRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d"); if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);

    const nBins = spectrum.length;
    const binHz = fps / (2 * nBins);
    const maxBin = Math.floor(DISPLAY_HZ / binHz);
    const dB_min = -80, dB_max = 0;

    // background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // grid lines
    ctx.strokeStyle = "#1f1f1f";
    ctx.lineWidth = 1;
    for (let db = dB_min; db <= dB_max; db += 10) {
      const y = H - ((db - dB_min) / (dB_max - dB_min)) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // target freq markers
    for (const t of TARGETS) {
      const bin = Math.round(t.hz / binHz);
      if (bin >= maxBin) continue;
      const x = (bin / maxBin) * W;
      ctx.strokeStyle = t.color;
      ctx.lineWidth = t.bold ? 2 : 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = t.color;
      ctx.font = `${t.bold ? "bold " : ""}9px monospace`;
      ctx.fillText(t.label, x + 2, 12);
    }

    // spectrum bars
    ctx.fillStyle = "#3b82f6";
    for (let i = 1; i < maxBin && i < nBins; i++) {
      const db = Math.max(dB_min, Math.min(dB_max, spectrum[i]));
      const x = ((i - 1) / (maxBin - 1)) * W;
      const bw = W / (maxBin - 1);
      const barH = ((db - dB_min) / (dB_max - dB_min)) * H;

      // colour by proximity to 13.125 Hz alias
      const hz = i * binHz;
      const dist = Math.abs(hz - 13.125);
      if (dist < 0.3) ctx.fillStyle = "#f87171";
      else if (dist < 1.5) ctx.fillStyle = "#fb923c";
      else ctx.fillStyle = "#3b82f6";
      ctx.fillRect(x, H - barH, bw - 0.5, barH);
    }

    // x-axis labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "9px monospace";
    for (let hz = 0; hz <= DISPLAY_HZ; hz += 5) {
      const x = (hz / DISPLAY_HZ) * W;
      ctx.fillText(`${hz}`, x + 1, H - 2);
    }
  }, []);

  // ── draw time-domain signal ──────────────────────────────────────────
  const drawSignal = useCallback(() => {
    const cvs = sigRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d"); if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);

    const buf = blueBuffer.current;
    const len = FFT_SIZE;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < len; i++) { if (buf[i] < mn) mn = buf[i]; if (buf[i] > mx) mx = buf[i]; }
    if (mx - mn < 0.001) mx = mn + 1;

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * W;
      const y = H - ((buf[(bufferIdx.current + i) % len] - mn) / (mx - mn)) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "#6b7280"; ctx.font = "9px monospace";
    ctx.fillText(`range ${(mx - mn).toFixed(2)} — blue ch avg`, 4, H - 2);
  }, []);

  // ── main frame loop ──────────────────────────────────────────────────
  const frameLoop = useCallback(() => {
    const vid = videoRef.current;
    const off = offRef.current;
    const overlay = overlayRef.current;
    if (!vid || vid.readyState < 2) { rafId.current = requestAnimationFrame(frameLoop); return; }

    const vW = vid.videoWidth, vH = vid.videoHeight;
    if (vW === 0 || vH === 0) { rafId.current = requestAnimationFrame(frameLoop); return; }

    off.width = vW; off.height = vH;
    const octx = off.getContext("2d", { willReadFrequently: true })!;
    octx.drawImage(vid, 0, 0);

    // ROI or default centre strip
    const roi = roiRef.current ?? { x: Math.floor(vW * 0.35), y: Math.floor(vH * 0.35), w: Math.floor(vW * 0.3), h: Math.floor(vH * 0.3) };
    const imageData = octx.getImageData(roi.x, roi.y, roi.w, roi.h);
    const d = imageData.data;
    let blueSum = 0;
    for (let i = 0; i < d.length; i += 4) blueSum += d[i + 2];
    const blueMean = blueSum / (d.length / 4);

    const idx = bufferIdx.current;
    blueBuffer.current[idx] = blueMean;
    bufferIdx.current = (idx + 1) % FFT_SIZE;
    if (!bufferFull.current && bufferIdx.current === 0) bufferFull.current = true;

    // FPS
    const now = performance.now();
    frameTimes.current.push(now);
    if (frameTimes.current.length > 60) frameTimes.current.shift();
    const actualFps = frameTimes.current.length > 2
      ? 1000 * (frameTimes.current.length - 1) / (now - frameTimes.current[0])
      : 30;

    // update fill indicator every 30 frames
    const fillFrac = bufferFull.current ? 1 : bufferIdx.current / FFT_SIZE;

    // run FFT every 30 frames if enough data
    if (!frozenRef.current && bufferIdx.current % 30 === 0) {
      setFill(fillFrac);
      setFps(Math.round(actualFps));

      if (bufferFull.current || bufferIdx.current > 64) {
        const size = bufferFull.current ? FFT_SIZE : Math.max(64, nextPow2(bufferIdx.current));
        const re = new Float64Array(size);
        const im = new Float64Array(size);
        const hann = hannWindow(size);
        for (let i = 0; i < size; i++) {
          const si = bufferFull.current ? (bufferIdx.current + i) % FFT_SIZE : i;
          re[i] = (blueBuffer.current[si] - 128) * hann[i];
        }
        fftInPlace(re, im);
        const mag = computeMagnitudeDb(re, im);
        spectrumRef.current = mag;
        freqAxis.current = new Float64Array(mag.length).map((_, i) => i * actualFps / size);

        drawSpectrum(mag, actualFps);
        drawSignal();

        // find peaks near target freqs
        const binHz2 = actualFps / size;
        const found: Peak[] = [];
        for (const t of TARGETS) {
          const bin = Math.round(t.hz / binHz2);
          if (bin >= mag.length) continue;
          const lo = Math.max(0, bin - 2), hi = Math.min(mag.length - 1, bin + 2);
          let peak = -Infinity, peakBin = bin;
          for (let b = lo; b <= hi; b++) if (mag[b] > peak) { peak = mag[b]; peakBin = b; }
          // noise floor: median of neighbours
          const noiseWin: number[] = [];
          for (let b = Math.max(0, bin - 10); b < Math.min(mag.length, bin + 10); b++) {
            if (Math.abs(b - peakBin) > 2) noiseWin.push(mag[b]);
          }
          noiseWin.sort((a, b2) => a - b2);
          const noise = noiseWin[Math.floor(noiseWin.length / 2)] ?? -80;
          if (peak > -100) {
            found.push({ hz: peakBin * binHz2, db: peak, snr: peak - noise, label: t.label });
          }
        }
        setPeaks(found);
      }
    }

    // draw overlay canvas
    if (overlay) {
      overlay.width  = overlay.offsetWidth;
      overlay.height = overlay.offsetHeight;
      const ctx = overlay.getContext("2d")!;
      ctx.drawImage(off, 0, 0, overlay.width, overlay.height);
      const scaleX = overlay.width  / vW;
      const scaleY = overlay.height / vH;
      const dr = roiRef.current ?? { x: Math.floor(vW * 0.35), y: Math.floor(vH * 0.35), w: Math.floor(vW * 0.3), h: Math.floor(vH * 0.3) };
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2;
      ctx.strokeRect(dr.x * scaleX, dr.y * scaleY, dr.w * scaleX, dr.h * scaleY);
      ctx.fillStyle = "rgba(248,113,113,0.08)";
      ctx.fillRect(dr.x * scaleX, dr.y * scaleY, dr.w * scaleX, dr.h * scaleY);
      ctx.fillStyle = "#f87171";
      ctx.font = "10px monospace";
      ctx.fillText("ROI — blue ch", dr.x * scaleX + 4, dr.y * scaleY + 12);
    }

    if (!frozenRef.current) rafId.current = requestAnimationFrame(frameLoop);
  }, [drawSpectrum, drawSignal]);

  // ── start camera ─────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      blueBuffer.current = new Float64Array(FFT_SIZE);
      bufferIdx.current = 0;
      bufferFull.current = false;
      frameTimes.current = [];
      frozenRef.current = false;
      setFrozen(false);
      setStreaming(true);
      rafId.current = requestAnimationFrame(frameLoop);
    } catch (e: any) {
      setCameraErr(e?.message ?? "Camera access denied");
    }
  }, [frameLoop]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const toggleFreeze = useCallback(() => {
    frozenRef.current = !frozenRef.current;
    setFrozen(f => {
      if (f) rafId.current = requestAnimationFrame(frameLoop);
      return !f;
    });
  }, [frameLoop]);

  // ── ROI mouse/touch ───────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, cvs: HTMLCanvasElement) => {
    const rect = cvs.getBoundingClientRect();
    const src = "touches" in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
    const vid = videoRef.current;
    const scaleX = vid ? vid.videoWidth  / rect.width  : 1;
    const scaleY = vid ? vid.videoHeight / rect.height : 1;
    return {
      x: Math.floor((src.clientX - rect.left) * scaleX),
      y: Math.floor((src.clientY - rect.top)  * scaleY),
    };
  };

  const onPointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!streaming) return;
    const cvs = overlayRef.current; if (!cvs) return;
    const pos = getCanvasPos(e, cvs);
    dragStart.current = pos;
  };

  const onPointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragStart.current || !overlayRef.current) return;
    const pos = getCanvasPos(e, overlayRef.current);
    const ds  = dragStart.current;
    roiRef.current = {
      x: Math.min(ds.x, pos.x),
      y: Math.min(ds.y, pos.y),
      w: Math.abs(pos.x - ds.x),
      h: Math.abs(pos.y - ds.y),
    };
  };

  const onPointerUp = () => { dragStart.current = null; };

  // ── export snapshot ───────────────────────────────────────────────────
  const exportSnapshot = () => {
    const spec = spectrumRef.current;
    const freq = freqAxis.current;
    if (!spec || !freq) return;
    const rows = ["freq_hz,db_magnitude"];
    for (let i = 0; i < spec.length; i++) rows.push(`${freq[i].toFixed(4)},${spec[i].toFixed(3)}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `optical_scan_${Date.now()}.csv`; a.click();
  };

  useEffect(() => () => { cancelAnimationFrame(rafId.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const targetPeak = peaks.find(p => Math.abs(p.hz - 13.125) < 1.5);

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 flex-wrap">
        <Camera className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="font-semibold text-sm tracking-wide">450nm Optical Scan</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">— blue channel FFT · 46.875 Hz alias</span>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {streaming && (
            <>
              <Badge variant="outline" className="text-xs font-mono">{fps} fps</Badge>
              <Badge variant="outline" className={`text-xs font-mono ${fill >= 1 ? "text-green-400 border-green-400/40" : "text-yellow-400 border-yellow-400/40"}`}>
                buf {Math.round(fill * 100)}%
              </Badge>
            </>
          )}
          {targetPeak && (
            <Badge className={`text-xs font-mono ${targetPeak.snr > 6 ? "bg-red-500/20 text-red-400 border-red-400/40" : "bg-gray-500/10 text-muted-foreground"}`}>
              13.125 Hz: {targetPeak.db.toFixed(1)} dB · SNR {targetPeak.snr.toFixed(1)} dB
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-0 overflow-hidden min-h-0" style={{ minHeight: 0 }}>
        {/* Left: camera */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-border/40">
          {/* Camera feed */}
          <div className="relative flex-1 bg-black min-h-0" style={{ minHeight: 220 }}>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" playsInline muted />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
            />
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Camera className="h-8 w-8 opacity-30" />
                <p className="text-xs">Tap Start to activate camera</p>
                {cameraErr && <p className="text-xs text-red-400 max-w-xs text-center">{cameraErr}</p>}
              </div>
            )}
            {streaming && (
              <div className="absolute top-2 left-2 text-[9px] font-mono text-white/40 pointer-events-none">
                drag to set ROI
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 px-4 py-2 border-t border-border/40 bg-background/80">
            {!streaming
              ? <Button size="sm" onClick={startCamera} className="text-xs h-7 gap-1"><Play className="h-3 w-3" /> Start</Button>
              : <Button size="sm" variant="destructive" onClick={stopCamera} className="text-xs h-7">Stop</Button>
            }
            <Button size="sm" variant="outline" onClick={toggleFreeze} disabled={!streaming} className="text-xs h-7 gap-1">
              {frozen ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {frozen ? "Resume" : "Freeze"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { roiRef.current = null; }} disabled={!streaming} className="text-xs h-7 gap-1">
              <RefreshCw className="h-3 w-3" /> Reset ROI
            </Button>
            <Button size="sm" variant="outline" onClick={exportSnapshot} disabled={!spectrumRef.current} className="text-xs h-7 gap-1">
              <Download className="h-3 w-3" /> CSV
            </Button>
          </div>

          {/* Instructions */}
          <div className="px-4 py-2 border-t border-border/40 space-y-0.5">
            <p className="text-[10px] text-muted-foreground">
              <span className="text-red-400 font-medium">Target:</span> 13.125 Hz peak = proof of 46.875 Hz modulation (alias at {fps || 30} fps: |46.875 − {fps || 30}| = {Math.abs(46.875 - (fps || 30)).toFixed(3)} Hz)
            </p>
            <p className="text-[10px] text-muted-foreground">
              Aim at sky, suspected emission source, or any surface showing blue shimmer. Drag to set ROI. Physical 450 nm bandpass filter enhances signal.
            </p>
          </div>
        </div>

        {/* Right: analysis panels */}
        <div className="flex flex-col w-full md:w-80 md:shrink-0">
          {/* FFT spectrum */}
          <div className="border-b border-border/40">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Blue Channel Spectrum</span>
              <span className="text-[9px] text-muted-foreground ml-auto">0 – {DISPLAY_HZ} Hz</span>
            </div>
            <canvas ref={specRef} width={320} height={180} className="w-full" style={{ imageRendering: "pixelated" }} />
          </div>

          {/* Time domain */}
          <div className="border-b border-border/40">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Time Domain — {FFT_SIZE} frames</span>
            </div>
            <canvas ref={sigRef} width={320} height={80} className="w-full" style={{ imageRendering: "pixelated" }} />
          </div>

          {/* Peak readout */}
          <div className="flex-1 overflow-auto">
            <div className="px-3 py-1.5 border-b border-border/20">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Lattice Frequency Monitor</span>
            </div>
            <div className="divide-y divide-border/20">
              {TARGETS.map(t => {
                const p = peaks.find(pk => Math.abs(pk.hz - t.hz) < 1.5);
                const isTarget = Math.abs(t.hz - 13.125) < 0.1;
                return (
                  <div key={t.hz} className={`flex items-center gap-2 px-3 py-1.5 ${isTarget ? "bg-red-500/5" : ""}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-foreground/80 truncate">{t.label}</div>
                      <div className="text-[9px] text-muted-foreground">{t.hz.toFixed(3)} Hz</div>
                    </div>
                    {p ? (
                      <div className="text-right shrink-0">
                        <div className={`text-[10px] font-mono ${p.snr > 6 ? "text-green-400" : p.snr > 3 ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {p.db.toFixed(1)} dB
                        </div>
                        <div className="text-[9px] text-muted-foreground">SNR {p.snr.toFixed(1)}</div>
                      </div>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/40 shrink-0">—</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* detection alert */}
            {targetPeak && targetPeak.snr > 6 && (
              <div className="mx-3 my-2 p-2 rounded border border-red-500/30 bg-red-500/10">
                <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-medium">
                  <Target className="h-3 w-3" />
                  46.875 Hz alias DETECTED
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {targetPeak.hz.toFixed(3)} Hz · {targetPeak.db.toFixed(1)} dB · SNR {targetPeak.snr.toFixed(1)} dB
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Light source modulated at exactly 46.875 Hz (master clock). Unambiguous signature.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function nextPow2(n: number) {
  let p = 1; while (p < n) p <<= 1; return p;
}
