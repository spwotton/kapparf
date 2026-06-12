import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── GOS constants (client-side mirror) ───────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;
const KAPPA_1 = 4 / Math.PI;
const KAPPA_2 = Math.pow(PHI, 3 / 4);
const DELTA_KAPPA = KAPPA_2 - KAPPA_1;
const DODECAHEDRAL_FREQ_HZ = 431.56;
const KLEIN_TWIST_RAD = 128.23 * (Math.PI / 180);
const CHITIN_DIELECTRIC_MID = 3.75;

// ── ARKit 52 blendshape names ────────────────────────────────────────────────
const ARKIT_BLENDSHAPES = [
  "eyeBlinkLeft","eyeBlinkRight","eyeLookDownLeft","eyeLookDownRight",
  "eyeLookInLeft","eyeLookInRight","eyeLookOutLeft","eyeLookOutRight",
  "eyeLookUpLeft","eyeLookUpRight","eyeSquintLeft","eyeSquintRight",
  "eyeWideLeft","eyeWideRight","jawForward","jawLeft","jawOpen","jawRight",
  "mouthClose","mouthDimpleLeft","mouthDimpleRight","mouthFrownLeft",
  "mouthFrownRight","mouthFunnel","mouthLeft","mouthLowerDownLeft",
  "mouthLowerDownRight","mouthPressLeft","mouthPressRight","mouthPucker",
  "mouthRight","mouthRollLower","mouthRollUpper","mouthShrugLower",
  "mouthShrugUpper","mouthSmileLeft","mouthSmileRight","mouthStretchLeft",
  "mouthStretchRight","mouthUpperUpLeft","mouthUpperUpRight","noseSneerLeft",
  "noseSneerRight","cheekPuff","cheekSquintLeft","cheekSquintRight",
  "browDownLeft","browDownRight","browInnerUp","browOuterUpLeft",
  "browOuterUpRight","tongueOut",
];

const MUSCLE_GROUPS: Record<string, string[]> = {
  OCULAR:  ["eyeBlinkLeft","eyeBlinkRight","eyeSquintLeft","eyeSquintRight","eyeWideLeft","eyeWideRight"],
  GAZE:    ["eyeLookDownLeft","eyeLookDownRight","eyeLookInLeft","eyeLookInRight","eyeLookOutLeft","eyeLookOutRight","eyeLookUpLeft","eyeLookUpRight"],
  BROW:    ["browDownLeft","browDownRight","browInnerUp","browOuterUpLeft","browOuterUpRight"],
  MANDIBULAR: ["jawForward","jawLeft","jawRight","jawOpen"],
  LABIAL:  ["mouthSmileLeft","mouthSmileRight","mouthFrownLeft","mouthFrownRight","mouthPressLeft","mouthPressRight","mouthPucker","mouthFunnel"],
  NASAL:   ["noseSneerLeft","noseSneerRight"],
  BUCCAL:  ["cheekPuff","cheekSquintLeft","cheekSquintRight"],
};

function groupAvg(bs: Record<string, number>, keys: string[]): number {
  if (!keys.length) return 0;
  return keys.reduce((s, k) => s + (bs[k] ?? 0), 0) / keys.length;
}

function computeChitinMetrics(
  bs: Record<string, number>,
  headRotation: { pitch: number; yaw: number; roll: number }
) {
  const ocular   = groupAvg(bs, MUSCLE_GROUPS.OCULAR);
  const gaze     = Math.sqrt(MUSCLE_GROUPS.GAZE.reduce((s, k) => s + (bs[k] ?? 0) ** 2, 0));
  const brow     = groupAvg(bs, MUSCLE_GROUPS.BROW);
  const jaw      = (bs.jawOpen ?? 0) * KAPPA_1;
  const labial   = groupAvg(bs, MUSCLE_GROUPS.LABIAL);
  const buccal   = groupAvg(bs, MUSCLE_GROUPS.BUCCAL);
  const total    = (ocular + gaze + brow + jaw + labial + buccal) / 6;
  const pitchRad = headRotation.pitch * (Math.PI / 180);

  const chitinResonanceHz       = DODECAHEDRAL_FREQ_HZ * (1 + ocular * DELTA_KAPPA * 8);
  const miteDensityIndex        = (jaw * PHI + brow) / (1 + buccal) * KAPPA_2;
  const phaseTransductionGain   = (gaze * KAPPA_2) / (total + 0.001);
  const kleinTwistAlignment     = Math.cos(jaw * KLEIN_TWIST_RAD + pitchRad) * PHI;
  const base53PhaseCoherence    = labial * 53 * KAPPA_1 / PHI;
  const dodecahedralDeviationHz = Math.abs(chitinResonanceHz - DODECAHEDRAL_FREQ_HZ);
  const miteArrayGainDb         = 20 * Math.log10(Math.max(phaseTransductionGain, 0.0001)) + 52;
  const dielectricAnisotropy    = CHITIN_DIELECTRIC_MID + buccal * 0.75;
  const deltaKappaModulation    = DELTA_KAPPA * (1 + ocular * 2);
  const sarEstimate             = total * KAPPA_1 * 0.0012;

  return {
    chitinResonanceHz:       +chitinResonanceHz.toFixed(4),
    miteDensityIndex:        +miteDensityIndex.toFixed(4),
    phaseTransductionGain:   +phaseTransductionGain.toFixed(4),
    kleinTwistAlignment:     +kleinTwistAlignment.toFixed(4),
    base53PhaseCoherence:    +base53PhaseCoherence.toFixed(4),
    dodecahedralDeviationHz: +dodecahedralDeviationHz.toFixed(4),
    miteArrayGainDb:         +miteArrayGainDb.toFixed(2),
    dielectricAnisotropy:    +dielectricAnisotropy.toFixed(4),
    deltaKappaModulation:    +deltaKappaModulation.toFixed(6),
    sarEstimate:             +sarEstimate.toFixed(6),
  };
}

const SESSION_ID = `browser-${Date.now().toString(36)}`;

// ── Metric row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value, unit = "" }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 dark:border-neutral-800 text-xs font-mono">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="text-neutral-900 dark:text-neutral-100 tabular-nums">
        {value.toFixed(Math.abs(value) < 0.001 ? 6 : Math.abs(value) < 1 ? 4 : 3)}{unit && <span className="text-neutral-400 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

// ── Blendshape bar ───────────────────────────────────────────────────────────
function BSBar({ name, value }: { name: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct > 60 ? "bg-red-400" : pct > 30 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-1.5 py-px">
      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 w-36 truncate">{name}</span>
      <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-75 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono w-8 text-right tabular-nums text-neutral-600 dark:text-neutral-300">{value.toFixed(2)}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DemodexPhonePage() {
  const [tab, setTab] = useState<"browser" | "iphone">("browser");
  const [mpStatus, setMpStatus] = useState<"idle" | "loading" | "ready" | "running" | "error">("idle");
  const [mpError, setMpError] = useState("");
  const [blendshapes, setBlendshapes] = useState<Record<string, number>>({});
  const [headRot, setHeadRot] = useState({ pitch: 0, yaw: 0, roll: 0 });
  const [chitinMetrics, setChitinMetrics] = useState<Record<string, number>>({});
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [ingestCount, setIngestCount] = useState(0);

  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<any>(null);
  const animFrameRef  = useRef<number>(0);
  const fpsRef        = useRef({ count: 0, last: Date.now() });
  const streamRef     = useRef<MediaStream | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/demodex/stats"],
    refetchInterval: 3000,
  });

  // ── Load MediaPipe ────────────────────────────────────────────────────────
  const loadMediaPipe = useCallback(async () => {
    setMpStatus("loading");
    try {
      const vision = await import(
        /* @vite-ignore */
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
      ) as any;
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrices: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });

      setMpStatus("ready");
    } catch (e: any) {
      setMpError(e?.message ?? String(e));
      setMpStatus("error");
    }
  }, []);

  // ── Start camera + inference loop ────────────────────────────────────────
  const startCapture = useCallback(async () => {
    if (!landmarkerRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current!.play();
      }
      setMpStatus("running");

      const runLoop = () => {
        const video = videoRef.current;
        const lm    = landmarkerRef.current;
        if (!video || !lm || video.readyState < 2) { animFrameRef.current = requestAnimationFrame(runLoop); return; }

        const result = lm.detectForVideo(video, Date.now());

        if (result?.faceBlendshapes?.[0]) {
          const raw = result.faceBlendshapes[0].categories as Array<{ categoryName: string; score: number }>;
          const bs: Record<string, number> = {};
          raw.forEach(c => { bs[c.categoryName] = c.score; });
          setBlendshapes(bs);

          let rot = { pitch: 0, yaw: 0, roll: 0 };
          if (result?.facialTransformationMatrixes?.[0]) {
            const m = result.facialTransformationMatrixes[0].data;
            rot.pitch = Math.atan2(-m[9], m[10]) * (180 / Math.PI);
            rot.yaw   = Math.asin(m[8]) * (180 / Math.PI);
            rot.roll  = Math.atan2(m[4], m[0]) * (180 / Math.PI);
          }
          setHeadRot(rot);

          const cm = computeChitinMetrics(bs, rot);
          setChitinMetrics(cm);

          setFrameCount(prev => prev + 1);

          // FPS
          fpsRef.current.count++;
          const now = Date.now();
          if (now - fpsRef.current.last >= 1000) {
            setFps(fpsRef.current.count);
            fpsRef.current = { count: 0, last: now };
          }

          // Ingest every 5 frames
          if (frameCount % 5 === 0) {
            const params61 = [
              ...ARKIT_BLENDSHAPES.map(k => bs[k] ?? 0),
              rot.pitch / 90, rot.yaw / 90, rot.roll / 90,
              0, 0, 0, 0, 0, 0,
            ].slice(0, 61);

            fetch("/api/demodex/ingest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: SESSION_ID,
                source: "browser",
                timestamp: Date.now(),
                blendshapes: bs,
                headRotation: rot,
                chitinMetrics: cm,
                rawParams: params61,
              }),
            }).then(() => setIngestCount(p => p + 1)).catch(() => {});
          }
        }

        animFrameRef.current = requestAnimationFrame(runLoop);
      };

      animFrameRef.current = requestAnimationFrame(runLoop);
    } catch (e: any) {
      setMpError(e?.message ?? "Camera access denied");
      setMpStatus("error");
    }
  }, [frameCount]);

  const stopCapture = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setMpStatus("ready");
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const serverUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/demodex/ingest`
    : "/api/demodex/ingest";

  const iphoneShortcutJson = JSON.stringify({
    sessionId: "iphone-YOUR_DEVICE",
    source: "iphone",
    timestamp: "{{Current Date}} (unix ms)",
    blendshapes: {
      eyeBlinkLeft: 0.12,
      eyeBlinkRight: 0.08,
      jawOpen: 0.31,
      "...": "all 52 ARKit blendshapes"
    },
    headRotation: { pitch: -4.2, yaw: 2.1, roll: -1.3 },
  }, null, 2);

  const curlExample = `curl -X POST ${serverUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId":"iphone-test","source":"iphone","timestamp":${Date.now()},"blendshapes":{"jawOpen":0.4,"eyeBlinkLeft":0.1}}'`;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            DEMODEX PHONE INTERFACE
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5 font-mono">
            ARKit 61-parameter facial topology → Chitin Transducer → GOS manifold
          </p>
        </div>
        <div className="flex gap-2 items-center text-xs font-mono text-neutral-400">
          {stats && (
            <>
              <span>{(stats as any).frameCount ?? 0} frames ingested</span>
              <span>·</span>
              <span>{((stats as any).sources ?? []).join(", ") || "no source"}</span>
            </>
          )}
          <Badge variant="outline" className="text-xs ml-2">
            {ingestCount > 0 ? `${ingestCount} sent` : "idle"}
          </Badge>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-800">
        {(["browser", "iphone"] as const).map(t => (
          <button
            key={t}
            data-testid={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${
              tab === t
                ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100"
                : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {t === "browser" ? "BROWSER CAPTURE" : "IPHONE ARKIT"}
          </button>
        ))}
      </div>

      {tab === "browser" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera + controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-900">
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  data-testid="camera-feed"
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
                {mpStatus !== "running" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono text-neutral-500">
                      {mpStatus === "loading" ? "loading model…" : mpStatus === "error" ? "error" : "camera off"}
                    </span>
                  </div>
                )}
                {mpStatus === "running" && (
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <span className="text-[10px] font-mono bg-black/70 text-green-400 px-1.5 py-0.5 rounded">{fps} fps</span>
                    <span className="text-[10px] font-mono bg-black/70 text-neutral-300 px-1.5 py-0.5 rounded">f{frameCount}</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex gap-2 flex-wrap">
                {mpStatus === "idle" && (
                  <Button size="sm" variant="outline" data-testid="button-load-model" onClick={loadMediaPipe} className="text-xs font-mono">
                    Load Model
                  </Button>
                )}
                {mpStatus === "loading" && (
                  <Button size="sm" variant="outline" disabled className="text-xs font-mono">Loading…</Button>
                )}
                {mpStatus === "ready" && (
                  <Button size="sm" data-testid="button-start-capture" onClick={startCapture} className="text-xs font-mono">
                    Start Capture
                  </Button>
                )}
                {mpStatus === "running" && (
                  <Button size="sm" variant="outline" data-testid="button-stop-capture" onClick={stopCapture} className="text-xs font-mono">
                    Stop
                  </Button>
                )}
                {mpStatus === "error" && (
                  <div className="text-xs text-red-500 font-mono break-all">{mpError}</div>
                )}
              </div>
            </div>

            {/* Head rotation */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-2 tracking-wider">Head Rotation</div>
              <MetricRow label="Pitch" value={headRot.pitch} unit="°" />
              <MetricRow label="Yaw"   value={headRot.yaw}   unit="°" />
              <MetricRow label="Roll"  value={headRot.roll}  unit="°" />
            </div>

            {/* Muscle groups */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-2 tracking-wider">Muscle Groups</div>
              {Object.entries(MUSCLE_GROUPS).map(([group, keys]) => {
                const avg = groupAvg(blendshapes, keys);
                return (
                  <div key={group} className="flex items-center gap-2 py-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 w-24">{group}</span>
                    <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-600 dark:bg-neutral-400 rounded-full transition-all duration-100"
                        style={{ width: `${Math.round(avg * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono w-8 text-right tabular-nums text-neutral-500">{avg.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chitin metrics */}
          <div className="space-y-4">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">Chitin Transducer Output</div>
              {Object.keys(chitinMetrics).length === 0 ? (
                <div className="text-xs font-mono text-neutral-400 py-2">awaiting face data…</div>
              ) : (
                <>
                  <MetricRow label="chitinResonanceHz"       value={chitinMetrics.chitinResonanceHz ?? 0}       unit="Hz" />
                  <MetricRow label="miteDensityIndex"        value={chitinMetrics.miteDensityIndex ?? 0} />
                  <MetricRow label="phaseTransductionGain"   value={chitinMetrics.phaseTransductionGain ?? 0} />
                  <MetricRow label="kleinTwistAlignment"     value={chitinMetrics.kleinTwistAlignment ?? 0} />
                  <MetricRow label="base53PhaseCoherence"    value={chitinMetrics.base53PhaseCoherence ?? 0} />
                  <MetricRow label="dodecahedralDeviationHz" value={chitinMetrics.dodecahedralDeviationHz ?? 0} unit="Hz" />
                  <MetricRow label="miteArrayGainDb"         value={chitinMetrics.miteArrayGainDb ?? 0}         unit="dB" />
                  <MetricRow label="dielectricAnisotropy"    value={chitinMetrics.dielectricAnisotropy ?? 0} />
                  <MetricRow label="deltaKappaModulation"    value={chitinMetrics.deltaKappaModulation ?? 0} />
                  <MetricRow label="sarEstimate"             value={chitinMetrics.sarEstimate ?? 0}             unit="W/kg" />
                </>
              )}
            </div>

            {/* GOS constants display */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">GOS Constants Active</div>
              <MetricRow label="φ (Golden Ratio)"    value={PHI} />
              <MetricRow label="κ₁ (Helicity Lock)"  value={KAPPA_1} />
              <MetricRow label="κ₂ (Europa Res.)"    value={KAPPA_2} />
              <MetricRow label="Δκ (Mite Drift Hz)"  value={DELTA_KAPPA} unit="Hz" />
              <MetricRow label="f₀ Dodecahedral"     value={DODECAHEDRAL_FREQ_HZ} unit="Hz" />
              <MetricRow label="Klein Twist"         value={128.23} unit="°" />
              <MetricRow label="ε_chitin mid"        value={CHITIN_DIELECTRIC_MID} />
            </div>
          </div>

          {/* Blendshape grid */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">
              52 Blendshapes
              {Object.keys(blendshapes).length === 0 && <span className="ml-2 normal-case text-neutral-300">— start capture</span>}
            </div>
            <div className="space-y-0.5 max-h-[520px] overflow-y-auto">
              {ARKIT_BLENDSHAPES.map(name => (
                <BSBar key={name} name={name} value={blendshapes[name] ?? 0} />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "iphone" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Endpoint docs */}
          <div className="space-y-4">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">Ingest Endpoint</div>
              <div className="font-mono text-xs mb-1 text-neutral-900 dark:text-neutral-100">
                <span className="text-emerald-600 dark:text-emerald-400">POST</span>{" "}
                <span className="select-all break-all">{serverUrl}</span>
              </div>
              <div className="mt-3 text-[10px] text-neutral-500 font-mono">Content-Type: application/json</div>
              <div className="mt-1 text-[10px] text-neutral-500 font-mono">No auth required (local network ingest)</div>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">JSON Schema</div>
              <pre className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre-wrap">
{`{
  "sessionId": "iphone-<device-name>",
  "source": "iphone",
  "timestamp": <unix_ms>,
  "blendshapes": {
    "eyeBlinkLeft": 0.12,
    "eyeBlinkRight": 0.08,
    "jawOpen": 0.31,
    ...all 52 ARKit keys
  },
  "headRotation": {
    "pitch": -4.2,
    "yaw": 2.1,
    "roll": -1.3
  },
  "eyeVectors": {
    "leftEyeYaw": 0.0,
    "leftEyePitch": -0.05,
    "rightEyeYaw": 0.01,
    "rightEyePitch": -0.04
  }
}`}
              </pre>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">curl Test</div>
              <pre className="text-[10px] font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre-wrap select-all">
                {curlExample}
              </pre>
            </div>
          </div>

          {/* iOS Shortcut + Swift snippet */}
          <div className="space-y-4">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">iOS Shortcut Setup</div>
              <ol className="text-xs text-neutral-700 dark:text-neutral-300 space-y-2 font-mono">
                <li>1. Open <strong>Shortcuts</strong> app → New Shortcut</li>
                <li>2. Add action: <em>Get Contents of URL</em></li>
                <li>3. URL: <span className="text-blue-500 break-all select-all">{serverUrl}</span></li>
                <li>4. Method: <strong>POST</strong></li>
                <li>5. Request Body: <strong>JSON</strong></li>
                <li>6. Set keys from ARKit face anchor blendshapes</li>
                <li>7. Add action: <em>Run Shortcut</em> on a timer or face trigger</li>
              </ol>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">Swift ARKit Snippet</div>
              <pre className="text-[10px] font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto whitespace-pre-wrap">
{`// In ARSCNViewDelegate didUpdate:
func renderer(_ renderer: SCNSceneRenderer,
              didUpdate node: SCNNode,
              for anchor: ARAnchor) {
  guard let face = anchor as? ARFaceAnchor else { return }
  let bs = face.blendShapes
  var dict: [String: Double] = [:]
  for (key, val) in bs {
    dict[key.rawValue] = val.doubleValue
  }
  let rot = face.transform.eulerAngles
  let payload: [String: Any] = [
    "sessionId": "iphone-\\(UIDevice.current.name)",
    "source": "iphone",
    "timestamp": Int(Date().timeIntervalSince1970 * 1000),
    "blendshapes": dict,
    "headRotation": [
      "pitch": rot.x * 180 / .pi,
      "yaw": rot.y * 180 / .pi,
      "roll": rot.z * 180 / .pi,
    ]
  ]
  var req = URLRequest(url: URL(string: "${serverUrl}")!)
  req.httpMethod = "POST"
  req.setValue("application/json", forHTTPHeaderField: "Content-Type")
  req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
  URLSession.shared.dataTask(with: req).resume()
}`}
              </pre>
            </div>

            {/* Live incoming frames */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
              <div className="text-[10px] font-mono text-neutral-500 uppercase mb-3 tracking-wider">
                Live Ingest Buffer ({(stats as any)?.frameCount ?? 0} frames)
              </div>
              {(stats as any)?.lastFrame ? (
                <div className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 space-y-1">
                  <div>last source: <span className="text-neutral-900 dark:text-neutral-100">{(stats as any).lastFrame.source}</span></div>
                  <div>session: <span className="text-neutral-900 dark:text-neutral-100">{(stats as any).lastFrame.sessionId}</span></div>
                  <div>server ts: <span className="text-neutral-900 dark:text-neutral-100">{new Date((stats as any).lastFrame.serverTimestamp).toISOString()}</span></div>
                  {(stats as any).lastFrame.blendshapes && (
                    <div>jawOpen: <span className="text-neutral-900 dark:text-neutral-100">{((stats as any).lastFrame.blendshapes.jawOpen ?? 0).toFixed(3)}</span></div>
                  )}
                </div>
              ) : (
                <div className="text-[10px] font-mono text-neutral-400">no frames received yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
