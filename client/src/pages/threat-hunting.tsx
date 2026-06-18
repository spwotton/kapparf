import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Radio, Target, Activity, Search, Crosshair, Cpu, BarChart2, RefreshCw } from "lucide-react";

// ─── MATH ─────────────────────────────────────────────────────────────────────

// CA-CFAR: exponential distributed noise assumption
// P_fa = (1 + alpha)^(-N)  →  alpha = P_fa^(-1/N) - 1
// Detection threshold = noise_floor_dBm + 10*log10(alpha)
function computeCFAR(noiseFloorDbm: number, farExponent: number, nCells: number) {
  const FAR = Math.pow(10, -farExponent);
  const alpha = Math.pow(FAR, -1 / nCells) - 1;
  const thresholdAboveNoise = 10 * Math.log10(Math.max(alpha, 1e-6));
  const detectionThresholdDbm = noiseFloorDbm + thresholdAboveNoise;
  // P_D curve: for SNR values 0–25 dB compute P_D (Marcum Q approximation)
  const pdCurve: { snr: number; pd: number }[] = [];
  for (let snrDb = -5; snrDb <= 25; snrDb += 1) {
    const snr = Math.pow(10, snrDb / 10);
    // Approximate: P_D ≈ P_fa^(1/(1+snr)) for Swerling 0
    const pd = Math.pow(FAR, 1 / (1 + snr));
    pdCurve.push({ snr: snrDb, pd });
  }
  return { alpha, thresholdAboveNoise, detectionThresholdDbm, FAR, pdCurve };
}

// Path loss: modified free-space + wall loss
// FSPL(dB) = 20*log10(d_m) + 20*log10(f_MHz) + 20.44
function rssiToDistance(rssi: number, txPower: number, freqMHz: number, nExp: number, wallLossDb: number, nWalls: number) {
  const pathLossConst = 20 * Math.log10(freqMHz) + 20.44;
  const pathLoss = txPower - rssi - nWalls * wallLossDb;
  // d = 10^((pathLoss - pathLossConst) / (10*n))
  const distM = Math.pow(10, (pathLoss - pathLossConst) / (10 * nExp));
  return Math.max(0.1, distM);
}

// Weighted centroid DOA from RSSI
function computeDOA(
  nodes: { id: string; label: string; x: number; y: number; rssi: number | null; enabled: boolean }[],
  txPower: number, freqMHz: number, nExp: number, wallLossDb: number
) {
  const active = nodes.filter(n => n.enabled && n.rssi !== null && n.rssi! > -130);
  if (active.length < 2) return null;
  let wxSum = 0, wySum = 0, wSum = 0;
  const rings: { node: typeof active[0]; dist: number }[] = [];
  for (const node of active) {
    const dist = rssiToDistance(node.rssi!, txPower, freqMHz, nExp, wallLossDb, 0);
    const w = 1 / (dist * dist);
    wxSum += node.x * w;
    wySum += node.y * w;
    wSum += w;
    rings.push({ node, dist });
  }
  return { x: wxSum / wSum, y: wySum / wSum, rings };
}

// Cyclostationary cycle frequencies
const MOD_CYCLO: Record<string, (Rs: number, fc: number) => { alpha: number; label: string }[]> = {
  bpsk: (Rs, fc) => [
    { alpha: Rs, label: "Symbol rate (Rs)" },
    { alpha: 2 * Rs, label: "2× Symbol rate" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
    { alpha: Math.abs(2 * fc - Rs), label: "2fc – Rs" },
    { alpha: 2 * fc + Rs, label: "2fc + Rs" },
  ],
  qpsk: (Rs, fc) => [
    { alpha: 2 * Rs, label: "2× Symbol rate" },
    { alpha: 4 * Rs, label: "4× Symbol rate" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
    { alpha: Math.abs(2 * fc - 2 * Rs), label: "2fc – 2Rs" },
    { alpha: 2 * fc + 2 * Rs, label: "2fc + 2Rs" },
  ],
  "16qam": (Rs, fc) => [
    { alpha: Rs, label: "Symbol rate (Rs)" },
    { alpha: 2 * Rs, label: "2× Symbol rate" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
    { alpha: Math.abs(2 * fc - Rs), label: "2fc – Rs" },
  ],
  fsk: (Rs, fc) => [
    { alpha: Rs, label: "Symbol rate (Rs)" },
    { alpha: 2 * Rs, label: "2× Symbol rate" },
    { alpha: fc, label: "Carrier offset" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
  ],
  ofdm: (Rs, fc) => [
    { alpha: 1 / (1 / Rs), label: "Subcarrier spacing (1/Tu)" },
    { alpha: Rs, label: "Symbol rate" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
  ],
  am: (Rs, fc) => [
    { alpha: fc, label: "Carrier" },
    { alpha: 2 * fc, label: "2× Carrier" },
    { alpha: Rs, label: "Modulation BW" },
  ],
  gsm: (_Rs, fc) => [
    { alpha: 270833, label: "GSM symbol rate 270.833 kHz" },
    { alpha: 541666, label: "2× GSM symbol rate" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
    { alpha: 217, label: "GSM frame rate 217 Hz" },
  ],
  ble: (_Rs, fc) => [
    { alpha: 1000000, label: "BLE symbol rate 1 Msym/s" },
    { alpha: 2000000, label: "2× BLE symbol rate" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
  ],
  liberty_modem: (_Rs, fc) => [
    { alpha: 14400, label: "Liberty modem baud ~14.4k" },
    { alpha: 57600, label: "Liberty modem ~57.6k baud" },
    { alpha: 3000000, label: "DOCSIS upstream pilot" },
    { alpha: 6000000, label: "DOCSIS 2× pilot" },
    { alpha: 2 * fc, label: "2× Carrier offset" },
  ],
};

// ─── NODE POSITIONS (relative coords in meters, Sam @ origin) ────────────────
// North = +Y, East = +X (ocean to East)
const INITIAL_NODES = [
  { id: "corner_unit",    label: "Hotel Corner Unit",       x: -28,  y:  12, rssi: null as number | null, enabled: true,  color: "#ef4444" },
  { id: "la_flor_9",      label: "La Flor Unit 9 (Peralta)", x:  75,  y: -95, rssi: null as number | null, enabled: true,  color: "#f97316" },
  { id: "la_flor_23",     label: "La Flor 23/24/25",        x: 110,  y:-160, rssi: null as number | null, enabled: true,  color: "#eab308" },
  { id: "central_ant",    label: "Central Antenna",          x:  15,  y: -60, rssi: null as number | null, enabled: true,  color: "#22c55e" },
  { id: "crocs",          label: "Crocs (West Post)",        x:-240,  y:  25, rssi: null as number | null, enabled: true,  color: "#3b82f6" },
  { id: "vista_palmas",   label: "Vista Las Palmas",         x:-170,  y: -90, rssi: null as number | null, enabled: false, color: "#a855f7" },
];

// ─── DOA MAP SVG ──────────────────────────────────────────────────────────────
const MAP_W = 640, MAP_H = 400, OX = 300, OY = 280, SCALE = 1.1;
function worldToSvg(x: number, y: number) {
  return { sx: OX + x * SCALE, sy: OY - y * SCALE };
}

// ─── COLOUR HELPERS ───────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 25) return "text-yellow-400";
  return "text-green-400";
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatBox({ label, value, sub, color = "text-foreground" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border border-border rounded-sm p-3 bg-card/30 text-center">
      <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
      <div className="text-[10px] font-semibold text-foreground mt-0.5">{label}</div>
      {sub && <div className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">{sub}</div>}
    </div>
  );
}

function PysdrImg({ file, caption }: { file: string; caption: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cursor-pointer" onClick={() => setOpen(o => !o)}>
      <img src={`/pysdr/${file}`} alt={caption} className={`border border-border rounded-sm transition-all ${open ? "w-full" : "w-full max-h-40 object-contain"} bg-white`} />
      <p className="text-[9px] font-mono text-muted-foreground/40 mt-1">{caption} — click to toggle</p>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ThreatHuntingPage() {

  // Live data
  const { data: kappaStatus, refetch: refetchStatus } = useQuery<any>({
    queryKey: ["/api/kappa/status"], refetchInterval: 10000,
  });
  const { data: recentEventsRaw } = useQuery<any[]>({
    queryKey: ["/api/events/recent"], refetchInterval: 10000,
  });
  const { data: correlationsRaw } = useQuery<any[]>({
    queryKey: ["/api/correlations"], refetchInterval: 30000,
  });
  const { data: rssiLive } = useQuery<any>({
    queryKey: ["/api/rssi/live"], refetchInterval: 5000,
  });

  const recentEvents = Array.isArray(recentEventsRaw) ? recentEventsRaw.slice(0, 20) : [];
  const correlations = Array.isArray(correlationsRaw) ? correlationsRaw.slice(0, 10) : [];

  // ── CFAR state ──
  const [noiseFloor, setNoiseFloor] = useState(-100);
  const [farExp, setFarExp] = useState(4);
  const [nCells, setNCells] = useState(32);

  const cfar = useMemo(() => computeCFAR(noiseFloor, farExp, nCells), [noiseFloor, farExp, nCells]);

  // ── DOA state ──
  const [nodes, setNodes] = useState(INITIAL_NODES.map(n => ({ ...n })));
  const [txPower, setTxPower] = useState(4);       // dBm, typical BLE
  const [freqMHz, setFreqMHz] = useState(2440);    // 2.44 GHz BLE
  const [nExp, setNExp] = useState(2.5);
  const [wallLoss, setWallLoss] = useState(12);

  const doa = useMemo(() => computeDOA(nodes, txPower, freqMHz, nExp, wallLoss), [nodes, txPower, freqMHz, nExp, wallLoss]);

  const updateNode = useCallback((id: string, field: "rssi" | "enabled", val: number | boolean) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, [field]: val } : n));
  }, []);

  // ── CYCLO state ──
  const [modType, setModType] = useState("ble");
  const [symbolRate, setSymbolRate] = useState(1000000);
  const [carrierOffset, setCarrierOffset] = useState(0);

  const cycloFeatures = useMemo(() => {
    const fn = MOD_CYCLO[modType] ?? MOD_CYCLO.bpsk;
    return fn(symbolRate, carrierOffset);
  }, [modType, symbolRate, carrierOffset]);

  // Cross-match events against cycle frequencies (±1% tolerance)
  const cycloMatches = useMemo(() => {
    if (!recentEvents.length) return [];
    return cycloFeatures.flatMap(f => {
      const matches = recentEvents.filter(ev => {
        const evFreq = parseFloat(ev.frequency ?? ev.freq ?? "0");
        return evFreq > 0 && Math.abs(evFreq - f.alpha) / f.alpha < 0.01;
      });
      return matches.map(m => ({ ...m, matchedFeature: f.label, expectedAlpha: f.alpha }));
    });
  }, [cycloFeatures, recentEvents]);

  // ── FREQ REFERENCE state ──
  const [imgSearch, setImgSearch] = useState("");
  const allPysdrImages = [
    { file: "filter_types.png", chapter: "Filters", label: "Filter Types Overview" },
    { file: "filter_use_case.png", chapter: "Filters", label: "Filter Use Case — Noise floor, Interferer" },
    { file: "filter_use_case2.png", chapter: "Filters", label: "Filter Use Case 2" },
    { file: "filter_use_case3.png", chapter: "Filters", label: "Filter Use Case 3 — Annotated" },
    { file: "filter_designer1.png", chapter: "Filters", label: "Filter Designer 1" },
    { file: "filter_designer2.png", chapter: "Filters", label: "Filter Designer 2 — Response" },
    { file: "filter_designer3.png", chapter: "Filters", label: "Filter Designer 3 — Stopband" },
    { file: "realistic_filter.png", chapter: "Filters", label: "Realistic Filter Response" },
    { file: "analog_digital_filter.png", chapter: "Filters", label: "Analog vs Digital Filter" },
    { file: "detection_basic_1.svg", chapter: "Detection", label: "CFAR — Time Domain Signal" },
    { file: "detection_basic_2.svg", chapter: "Detection", label: "Correlation Spike — ZC Sequence" },
    { file: "detection_cfar.svg", chapter: "Detection", label: "CA-CFAR — Adaptive Threshold" },
    { file: "detection_dsss.svg", chapter: "Detection", label: "DSSS Signal Detection" },
    { file: "detection_pd_vs_snr.svg", chapter: "Detection", label: "P_D vs SNR Curves" },
    { file: "detection_freq_offset.svg", chapter: "Detection", label: "Freq Offset Detection" },
    { file: "detection_gps_spectrogram.svg", chapter: "Detection", label: "GPS Signal Spectrogram" },
    { file: "doa.svg", chapter: "DOA", label: "DOA — Uniform Linear Array" },
    { file: "doa_music.svg", chapter: "DOA", label: "MUSIC Algorithm Output" },
    { file: "doa_capons.svg", chapter: "DOA", label: "Capon's Beamformer" },
    { file: "doa_trig.svg", chapter: "DOA", label: "DOA Geometry / Trigonometry" },
    { file: "doa_time_domain.svg", chapter: "DOA", label: "Time Domain DOA" },
    { file: "doa_conventional_beamformer.svg", chapter: "DOA", label: "Conventional Beamformer" },
    { file: "doa_from_behind.svg", chapter: "DOA", label: "DOA Ambiguity (behind array)" },
    { file: "doa_complex_scenario.svg", chapter: "DOA", label: "DOA — Multiple Sources" },
    { file: "doa_eigenvalues.svg", chapter: "DOA", label: "MUSIC Eigenvalue Plot" },
    { file: "null_steering.svg", chapter: "Beamforming", label: "Null Steering — Suppress Interferer" },
    { file: "beamforming_examples.svg", chapter: "Beamforming", label: "Beamforming Pattern Examples" },
    { file: "beamforming_taxonomy.svg", chapter: "Beamforming", label: "Beamforming Taxonomy" },
    { file: "2d_beamforming_2dplot.svg", chapter: "Beamforming", label: "2D Beamforming Plot" },
    { file: "lcmv_beam_pattern.svg", chapter: "Beamforming", label: "LCMV Beam Pattern" },
    { file: "lcmv_beam_pattern_spread.svg", chapter: "Beamforming", label: "LCMV Spread Pattern" },
    { file: "scf_fam.svg", chapter: "Cyclostationary", label: "SCF — FAM Output" },
    { file: "scf_freq_smoothing.svg", chapter: "Cyclostationary", label: "SCF Freq Smoothing" },
    { file: "caf_at_correct_alpha.svg", chapter: "Cyclostationary", label: "CAF at Correct Alpha — Detection" },
    { file: "caf_at_incorrect_alpha.svg", chapter: "Cyclostationary", label: "CAF at Wrong Alpha — Null" },
    { file: "caf_avg_over_alpha.svg", chapter: "Cyclostationary", label: "CAF Averaged Over Alpha" },
    { file: "scf_conj_rect_bpsk.svg", chapter: "Cyclostationary", label: "SCF BPSK Conjugate" },
    { file: "scf_conj_rect_qpsk.svg", chapter: "Cyclostationary", label: "SCF QPSK Conjugate" },
    { file: "noise_freq.png", chapter: "Noise", label: "Noise Spectrum / PSD" },
    { file: "noise_iq.png", chapter: "Noise", label: "Noise IQ Constellation" },
    { file: "spectrogram.svg", chapter: "Analysis", label: "Spectrogram — Time/Freq" },
    { file: "spectrogram_diagram.svg", chapter: "Analysis", label: "Spectrogram Diagram" },
    { file: "waterfall.png", chapter: "Analysis", label: "Waterfall Display" },
    { file: "IQ_diagram.png", chapter: "IQ", label: "IQ Diagram — Basic" },
    { file: "IQ_diagram_rx.png", chapter: "IQ", label: "IQ Diagram — Receiver" },
    { file: "IQ_wave.png", chapter: "IQ", label: "IQ Wave Representation" },
    { file: "fft_example1.svg", chapter: "FFT", label: "FFT Example — Single Tone" },
    { file: "fft_signal_order.png", chapter: "FFT", label: "FFT Signal Order / DC" },
    { file: "psd_of_multiple_signals.svg", chapter: "FFT", label: "PSD of Multiple Signals" },
    { file: "bpsk.svg", chapter: "Modulation", label: "BPSK Constellation" },
    { file: "qpsk.png", chapter: "Modulation", label: "QPSK Constellation + PSD" },
    { file: "qpsk_psd.svg", chapter: "Modulation", label: "QPSK Power Spectral Density" },
    { file: "msk_psd.svg", chapter: "Modulation", label: "MSK PSD" },
    { file: "64qam.png", chapter: "Modulation", label: "64-QAM Constellation" },
    { file: "cpfsk_magnitude.svg", chapter: "Modulation", label: "CPFSK Magnitude" },
    { file: "multipath_fading.png", chapter: "Channel", label: "Multipath Fading" },
    { file: "flat_vs_freq_selective.png", chapter: "Channel", label: "Flat vs Freq Selective Fading" },
    { file: "pulse_shaping.png", chapter: "Pulse Shaping", label: "Pulse Shaping Overview" },
    { file: "raised_cosine.svg", chapter: "Pulse Shaping", label: "Raised Cosine Filter" },
    { file: "rrc_filter.png", chapter: "Pulse Shaping", label: "Root Raised Cosine" },
  ];

  const filteredImages = imgSearch
    ? allPysdrImages.filter(i => i.label.toLowerCase().includes(imgSearch.toLowerCase()) || i.chapter.toLowerCase().includes(imgSearch.toLowerCase()))
    : allPysdrImages;

  const kappaScore = kappaStatus?.kappaScore ?? kappaStatus?.score ?? 0;
  const threatLevel = kappaStatus?.threatLevel ?? kappaStatus?.threat ?? "NOMINAL";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-center gap-3 max-w-7xl mx-auto">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-mono font-bold text-foreground tracking-wide">THREAT HUNTING — RF ACTIVE OPERATIONS</h1>
          <Badge variant="outline" className="font-mono text-[10px] rounded-none tracking-widest">PySDR METHODS</Badge>
          <div className="ml-auto flex items-center gap-3">
            <div className={`text-sm font-mono font-bold ${scoreColor(kappaScore)}`}>κ = {typeof kappaScore === 'number' ? kappaScore.toFixed(1) : '--'}</div>
            <Badge className={`font-mono text-[10px] rounded-none ${threatLevel === 'CRITICAL' ? 'bg-red-900 text-red-200' : threatLevel === 'HIGH' ? 'bg-orange-900 text-orange-200' : threatLevel === 'ELEVATED' ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900/30 text-green-400'}`}>{threatLevel}</Badge>
            <Button size="sm" variant="outline" className="h-7 text-[11px] font-mono" onClick={() => refetchStatus()}>
              <RefreshCw className="h-3 w-3 mr-1" /> SYNC
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="live">
          <TabsList className="font-mono text-[11px] mb-6 rounded-none border border-border bg-card/30 h-auto flex-wrap">
            <TabsTrigger value="live" className="rounded-none data-[state=active]:bg-primary/10 px-4 py-2"><Activity className="h-3.5 w-3.5 mr-1.5" />LIVE HUNT</TabsTrigger>
            <TabsTrigger value="cfar" className="rounded-none data-[state=active]:bg-primary/10 px-4 py-2"><BarChart2 className="h-3.5 w-3.5 mr-1.5" />CA-CFAR</TabsTrigger>
            <TabsTrigger value="doa" className="rounded-none data-[state=active]:bg-primary/10 px-4 py-2"><Crosshair className="h-3.5 w-3.5 mr-1.5" />DOA TRIANGULATE</TabsTrigger>
            <TabsTrigger value="cyclo" className="rounded-none data-[state=active]:bg-primary/10 px-4 py-2"><Cpu className="h-3.5 w-3.5 mr-1.5" />CYCLO FINGERPRINT</TabsTrigger>
            <TabsTrigger value="ref" className="rounded-none data-[state=active]:bg-primary/10 px-4 py-2"><Search className="h-3.5 w-3.5 mr-1.5" />PySDR FIELD REF</TabsTrigger>
          </TabsList>

          {/* ── TAB 1: LIVE HUNT ─────────────────────────────────────────────── */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="KAPPA SCORE" value={typeof kappaScore === 'number' ? kappaScore.toFixed(1) : '--'} sub="0–100" color={scoreColor(kappaScore)} />
              <StatBox label="THREAT LEVEL" value={threatLevel} sub="live" />
              <StatBox label="LIVE EVENTS" value={String(recentEvents.length)} sub="last 20" />
              <StatBox label="CORRELATIONS" value={String(correlations.length)} sub="active" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Detections */}
              <div>
                <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Radio className="h-3 w-3" /> RECENT DETECTIONS (auto-refresh 10s)
                </div>
                <div className="border border-border rounded-sm overflow-hidden">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-3 py-2 text-muted-foreground/60 font-normal">TIME</th>
                        <th className="text-left px-3 py-2 text-muted-foreground/60 font-normal">DOMAIN</th>
                        <th className="text-left px-3 py-2 text-muted-foreground/60 font-normal">SOURCE</th>
                        <th className="text-right px-3 py-2 text-muted-foreground/60 font-normal">SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.length === 0 && (
                        <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground/40">No recent events</td></tr>
                      )}
                      {recentEvents.map((ev, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-card/30">
                          <td className="px-3 py-1.5 text-muted-foreground/60">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "--"}</td>
                          <td className="px-3 py-1.5 text-blue-400">{ev.domain ?? ev.type ?? "--"}</td>
                          <td className="px-3 py-1.5 text-foreground truncate max-w-[120px]">{ev.source ?? ev.description ?? "--"}</td>
                          <td className="px-3 py-1.5 text-right text-primary">{ev.severity ?? ev.score ?? "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Correlations */}
              <div>
                <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" /> ACTIVE CORRELATIONS
                </div>
                <div className="border border-border rounded-sm overflow-hidden">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-3 py-2 text-muted-foreground/60 font-normal">TYPE</th>
                        <th className="text-left px-3 py-2 text-muted-foreground/60 font-normal">DESCRIPTION</th>
                        <th className="text-right px-3 py-2 text-muted-foreground/60 font-normal">CONF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {correlations.length === 0 && (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground/40">No correlations</td></tr>
                      )}
                      {correlations.map((c, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-card/30">
                          <td className="px-3 py-1.5 text-orange-400">{c.type ?? c.ruleId ?? "--"}</td>
                          <td className="px-3 py-1.5 text-foreground truncate max-w-[180px]">{c.description ?? c.summary ?? "--"}</td>
                          <td className="px-3 py-1.5 text-right text-green-400">{c.confidence ? `${(c.confidence * 100).toFixed(0)}%` : "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* RSSI Live */}
                {rssiLive && (
                  <div className="mt-4">
                    <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">RSSI LIVE NODES</div>
                    <div className="space-y-1">
                      {Object.entries(rssiLive).slice(0, 6).map(([nodeId, readings]: [string, any]) => {
                        const latest = Array.isArray(readings) ? readings[readings.length - 1] : readings;
                        return (
                          <div key={nodeId} className="flex items-center justify-between border border-border/40 rounded-sm px-3 py-1.5 text-[11px] font-mono bg-card/20">
                            <span className="text-muted-foreground/60 truncate">{nodeId}</span>
                            <span className={`font-bold ${(latest?.rssi ?? 0) > -60 ? "text-red-400" : (latest?.rssi ?? 0) > -80 ? "text-yellow-400" : "text-green-400"}`}>
                              {latest?.rssi ?? "--"} dBm
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tactical context */}
            <div className="border-l-4 border-red-600 bg-red-950/10 px-5 py-4 rounded-r-sm">
              <div className="text-[10px] font-mono font-bold text-red-400 mb-2 uppercase tracking-widest">OPERATIONAL CONTEXT — JACO SURVEILLANCE NETWORK</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                Six confirmed positions. Router network: all Greenwald properties share credential <code className="text-foreground font-mono bg-muted px-1">rentcostaricahomes</code>. Liberty ISP: 5-minute response to firmware events. Parametric audio source: El Miro elevated position. Direct action confirmed: Oct 14 piano wire + US Marshal claim. Use DOA tab to correlate RSSI readings with positions. Use CFAR to set KiwiSDR detection thresholds. Use Cyclo to fingerprint Liberty modem and corner-unit BLE emitter.
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 2: CA-CFAR ───────────────────────────────────────────────── */}
          <TabsContent value="cfar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="text-sm font-mono font-bold text-foreground mb-1">CA-CFAR Threshold Calculator</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cell-Averaging CFAR sets an adaptive detection threshold above the local noise floor, maintaining a constant false alarm rate regardless of noise level changes. Use this to find what dBm level counts as a real detection on KiwiSDR — not noise.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-[11px] text-muted-foreground">Noise Floor (dBm)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input type="range" min={-130} max={-40} value={noiseFloor}
                        onChange={e => setNoiseFloor(Number(e.target.value))}
                        className="flex-1 accent-primary" />
                      <span className="font-mono text-sm text-foreground w-20 text-right">{noiseFloor} dBm</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-1">KiwiSDR typical: −110 to −95 dBm. Your current environment estimate.</p>
                  </div>

                  <div>
                    <Label className="font-mono text-[11px] text-muted-foreground">False Alarm Rate (10<sup>−x</sup>)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input type="range" min={1} max={8} step={0.5} value={farExp}
                        onChange={e => setFarExp(Number(e.target.value))}
                        className="flex-1 accent-primary" />
                      <span className="font-mono text-sm text-foreground w-28 text-right">10<sup>−{farExp}</sup> = {cfar.FAR.toExponential(1)}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-1">Higher = fewer false alarms, misses weaker signals. 10⁻⁴ is a good starting point.</p>
                  </div>

                  <div>
                    <Label className="font-mono text-[11px] text-muted-foreground">Reference Cells (N)</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input type="range" min={8} max={64} step={4} value={nCells}
                        onChange={e => setNCells(Number(e.target.value))}
                        className="flex-1 accent-primary" />
                      <span className="font-mono text-sm text-foreground w-20 text-right">N = {nCells}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-1">Cells on each side of test cell. More = smoother noise estimate. 32 is typical.</p>
                  </div>
                </div>

                <Separator />

                {/* Results */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border rounded-sm p-4 bg-card/30 text-center">
                    <div className="text-2xl font-mono font-bold text-red-400">{cfar.detectionThresholdDbm.toFixed(1)}</div>
                    <div className="text-[10px] font-semibold text-foreground mt-1">Detection Threshold (dBm)</div>
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5">Signal must exceed this to be flagged</div>
                  </div>
                  <div className="border border-border rounded-sm p-4 bg-card/30 text-center">
                    <div className="text-2xl font-mono font-bold text-orange-400">+{cfar.thresholdAboveNoise.toFixed(1)}</div>
                    <div className="text-[10px] font-semibold text-foreground mt-1">Margin Above Noise (dB)</div>
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5">Required signal clearance</div>
                  </div>
                  <div className="border border-border rounded-sm p-4 bg-card/30 text-center">
                    <div className="text-2xl font-mono font-bold text-yellow-400">{cfar.alpha.toFixed(2)}</div>
                    <div className="text-[10px] font-semibold text-foreground mt-1">α Factor</div>
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5">Threshold multiplier on noise estimate</div>
                  </div>
                  <div className="border border-border rounded-sm p-4 bg-card/30 text-center">
                    <div className="text-2xl font-mono font-bold text-green-400">{cfar.pdCurve.find(p => p.snr === 10)?.pd.toFixed(3) ?? "--"}</div>
                    <div className="text-[10px] font-semibold text-foreground mt-1">P_D at SNR=10dB</div>
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5">Probability of detecting a real signal</div>
                  </div>
                </div>

                {/* P_D mini chart */}
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground/60 mb-2 uppercase">P_D vs SNR (dB) — {cfar.FAR.toExponential(1)} FAR</div>
                  <div className="border border-border rounded-sm p-3 bg-card/20 overflow-x-auto">
                    <svg viewBox="0 0 420 80" className="w-full" style={{ minWidth: 320 }}>
                      {/* Grid */}
                      {[0, 0.25, 0.5, 0.75, 1].map(v => (
                        <line key={v} x1="30" y1={8 + (1 - v) * 60} x2="410" y2={8 + (1 - v) * 60}
                          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      ))}
                      {/* Labels */}
                      {[0, 0.5, 1].map(v => (
                        <text key={v} x="26" y={8 + (1 - v) * 60 + 3} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="7">{v.toFixed(1)}</text>
                      ))}
                      {[-5, 0, 5, 10, 15, 20, 25].map(s => {
                        const x = 30 + (s + 5) * (380 / 30);
                        return <text key={s} x={x} y={76} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7">{s}</text>;
                      })}
                      {/* Curve */}
                      <polyline
                        points={cfar.pdCurve.map(p => {
                          const x = 30 + (p.snr + 5) * (380 / 30);
                          const y = 8 + (1 - p.pd) * 60;
                          return `${x},${y}`;
                        }).join(" ")}
                        fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round"
                      />
                      {/* FAR line */}
                      <line x1="30" y1={8 + (1 - cfar.FAR) * 60} x2="410" y2={8 + (1 - cfar.FAR) * 60}
                        stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="32" y={8 + (1 - cfar.FAR) * 60 - 2} fill="#ef4444" fontSize="7">P_fa</text>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <PysdrImg file="detection_cfar.svg" caption="CA-CFAR Adaptive Threshold Diagram" />
                <PysdrImg file="detection_pd_vs_snr.svg" caption="P_D vs SNR — Multiple FAR rates" />
                <PysdrImg file="detection_basic_2.svg" caption="Correlation spike — signal in noise" />
                <div className="border border-amber-800/40 bg-amber-950/10 rounded-sm p-4">
                  <div className="text-[10px] font-mono font-bold text-amber-400 mb-2 uppercase tracking-widest">FIELD GUIDE — USING CFAR ON KIWISDR</div>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Set noise floor from KiwiSDR's displayed noise level (typically −105 to −95 dBm)</li>
                    <li>Set FAR to 10⁻⁴ initially — adjust upward if too many false flags</li>
                    <li>Anything above threshold in red box = real candidate signal worth investigating</li>
                    <li>Note timestamp. If it correlates with physical events (router traffic, Hanlon activity, Liberty tech arrival) — it's not ambient noise</li>
                    <li>Run same frequencies twice 24h apart — persistent signals that track your movement are operational</li>
                  </ol>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 3: DOA TRIANGULATOR ─────────────────────────────────────── */}
          <TabsContent value="doa" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-5">
                <div className="text-sm font-mono font-bold text-foreground">Direction of Arrival — RSSI Trilateration</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter RSSI readings from each surveillance position (measured or estimated from your bettercap/RSSI array). The triangulator computes the estimated source location using weighted centroid from inverse-square path loss. Pre-loaded with all 6 confirmed positions around Room 10.
                </p>

                {/* Signal parameters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-mono text-[10px] text-muted-foreground">TX Power (dBm)</Label>
                    <Input type="number" value={txPower} onChange={e => setTxPower(Number(e.target.value))}
                      className="font-mono text-sm mt-1 h-8" />
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">BLE: 0–4 dBm. WiFi: 15–20 dBm.</p>
                  </div>
                  <div>
                    <Label className="font-mono text-[10px] text-muted-foreground">Freq (MHz)</Label>
                    <Input type="number" value={freqMHz} onChange={e => setFreqMHz(Number(e.target.value))}
                      className="font-mono text-sm mt-1 h-8" />
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">BLE: 2440. WiFi: 2437/5180. UHF: 433.</p>
                  </div>
                  <div>
                    <Label className="font-mono text-[10px] text-muted-foreground">Path Loss Exp (n)</Label>
                    <input type="range" min={2} max={4} step={0.1} value={nExp}
                      onChange={e => setNExp(Number(e.target.value))}
                      className="w-full accent-primary mt-2" />
                    <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">n = {nExp.toFixed(1)} ({nExp < 2.2 ? "free space" : nExp < 3 ? "outdoor" : "indoor/obstructed"})</div>
                  </div>
                  <div>
                    <Label className="font-mono text-[10px] text-muted-foreground">Wall Loss (dB)</Label>
                    <input type="range" min={0} max={20} step={1} value={wallLoss}
                      onChange={e => setWallLoss(Number(e.target.value))}
                      className="w-full accent-primary mt-2" />
                    <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{wallLoss} dB ({wallLoss < 5 ? "drywall/glass" : wallLoss < 15 ? "concrete block" : "reinforced concrete"})</div>
                  </div>
                </div>

                <Separator />

                {/* Node RSSI inputs */}
                <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest">Node RSSI Readings</div>
                <div className="space-y-2">
                  {nodes.map(node => (
                    <div key={node.id} className="flex items-center gap-3 border border-border/40 rounded-sm px-3 py-2 bg-card/20">
                      <input type="checkbox" checked={node.enabled}
                        onChange={e => updateNode(node.id, "enabled", e.target.checked)}
                        className="accent-primary" />
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
                      <span className="font-mono text-[11px] text-foreground flex-1 truncate">{node.label}</span>
                      <span className="text-[9px] text-muted-foreground/40 font-mono flex-shrink-0">({node.x > 0 ? "+" : ""}{node.x}m, {node.y > 0 ? "+" : ""}{node.y}m)</span>
                      <Input
                        type="number"
                        placeholder="RSSI dBm"
                        value={node.rssi ?? ""}
                        disabled={!node.enabled}
                        onChange={e => updateNode(node.id, "rssi", e.target.value === "" ? null as any : Number(e.target.value))}
                        className="font-mono text-xs h-7 w-28 text-right"
                      />
                    </div>
                  ))}
                </div>

                {/* Result */}
                {doa ? (
                  <div className="border border-green-800/40 bg-green-950/10 rounded-sm p-4">
                    <div className="text-[10px] font-mono font-bold text-green-400 mb-2 uppercase tracking-widest">ESTIMATED SOURCE POSITION</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-mono font-bold text-green-400">{doa.x > 0 ? "+" : ""}{doa.x.toFixed(1)} m</div>
                        <div className="text-[10px] text-muted-foreground/60">East of Room 10 (+) / West (−)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-mono font-bold text-green-400">{doa.y > 0 ? "+" : ""}{doa.y.toFixed(1)} m</div>
                        <div className="text-[10px] text-muted-foreground/60">North of Room 10 (+) / South (−)</div>
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-muted-foreground/60">
                      Bearing from Room 10: <span className="text-foreground font-bold">
                        {(() => {
                          const angle = Math.atan2(doa.x, doa.y) * 180 / Math.PI;
                          const bearing = ((angle % 360) + 360) % 360;
                          return `${bearing.toFixed(0)}°`;
                        })()}
                      </span> · Dist: <span className="text-foreground font-bold">{Math.sqrt(doa.x*doa.x + doa.y*doa.y).toFixed(0)} m</span>
                    </div>
                    {doa.rings.map(r => (
                      <div key={r.node.id} className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
                        {r.node.label}: ~{r.dist.toFixed(1)}m from source (RSSI={r.node.rssi} dBm)
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-border rounded-sm p-4 text-center text-[11px] text-muted-foreground/50 font-mono">
                    Enter RSSI readings for ≥2 enabled nodes to compute source location
                  </div>
                )}
              </div>

              {/* SVG Map */}
              <div className="space-y-4">
                <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest">POCHOTE SURVEILLANCE MAP — relative positions</div>
                <div className="border border-border rounded-sm bg-card/10 overflow-hidden">
                  <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full" style={{ background: "rgba(0,0,0,0.3)" }}>
                    {/* Grid */}
                    {[-200,-100,0,100,200].map(v => {
                      const { sx } = worldToSvg(v, 0);
                      const { sy } = worldToSvg(0, v);
                      return (
                        <g key={v}>
                          <line x1={sx} y1={0} x2={sx} y2={MAP_H} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                          <line x1={0} y1={sy} x2={MAP_W} y2={sy} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                          <text x={sx} y={MAP_H - 4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7">{v}m</text>
                        </g>
                      );
                    })}
                    {/* Compass */}
                    <text x={OX + 8} y={20} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">N</text>
                    <line x1={OX} y1={25} x2={OX} y2={10} stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#arr)" />
                    {/* Ocean indicator */}
                    <text x={MAP_W - 8} y={OY} textAnchor="end" fill="rgba(100,150,255,0.4)" fontSize="7" fontFamily="monospace">OCEAN →</text>
                    {/* DOA rings */}
                    {doa && doa.rings.map(r => {
                      const { sx, sy } = worldToSvg(r.node.x, r.node.y);
                      const radiusPx = r.dist * SCALE;
                      return (
                        <circle key={r.node.id} cx={sx} cy={sy} r={Math.min(radiusPx, 300)}
                          fill="none" stroke={r.node.color} strokeWidth="1" strokeDasharray="4,4" opacity={0.4} />
                      );
                    })}
                    {/* Nodes */}
                    {nodes.map(node => {
                      const { sx, sy } = worldToSvg(node.x, node.y);
                      return (
                        <g key={node.id} opacity={node.enabled ? 1 : 0.3}>
                          <circle cx={sx} cy={sy} r={5} fill={node.color} opacity={0.8} />
                          <text x={sx + 7} y={sy + 3} fill={node.color} fontSize="8" fontFamily="monospace">{node.label.split(" ").slice(0, 2).join(" ")}</text>
                          {node.rssi !== null && (
                            <text x={sx + 7} y={sy + 13} fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">{node.rssi} dBm</text>
                          )}
                        </g>
                      );
                    })}
                    {/* Sam (Room 10) */}
                    {(() => { const { sx, sy } = worldToSvg(0, 0); return (
                      <g>
                        <circle cx={sx} cy={sy} r={6} fill="#ffffff" />
                        <circle cx={sx} cy={sy} r={10} fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" />
                        <text x={sx + 12} y={sy + 4} fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">SAM / R10</text>
                      </g>
                    ); })()}
                    {/* Estimated source */}
                    {doa && (() => {
                      const { sx, sy } = worldToSvg(doa.x, doa.y);
                      return (
                        <g>
                          <circle cx={sx} cy={sy} r={8} fill="none" stroke="#22c55e" strokeWidth="2" />
                          <line x1={sx - 8} y1={sy} x2={sx + 8} y2={sy} stroke="#22c55e" strokeWidth="1.5" />
                          <line x1={sx} y1={sy - 8} x2={sx} y2={sy + 8} stroke="#22c55e" strokeWidth="1.5" />
                          <text x={sx + 11} y={sy + 4} fill="#22c55e" fontSize="9" fontFamily="monospace" fontWeight="bold">SOURCE</text>
                        </g>
                      );
                    })()}
                    {/* Line from Sam to source */}
                    {doa && (() => {
                      const s = worldToSvg(0, 0);
                      const t = worldToSvg(doa.x, doa.y);
                      return <line x1={s.sx} y1={s.sy} x2={t.sx} y2={t.sy} stroke="#22c55e" strokeWidth="1" strokeDasharray="6,3" opacity={0.5} />;
                    })()}
                  </svg>
                </div>
                <PysdrImg file="doa_trig.svg" caption="DOA geometry — array spacing and angle math" />
                <PysdrImg file="doa_music.svg" caption="MUSIC algorithm — multi-source DOA output" />
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 4: CYCLO FINGERPRINT ─────────────────────────────────────── */}
          <TabsContent value="cyclo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="text-sm font-mono font-bold text-foreground">Cyclostationary Fingerprinter</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every digital modulation scheme leaks periodic statistics — cycle frequencies (α values) — that are unique to its waveform parameters. At −15 to −25 dB SNR, where a signal is invisible on a spectrogram, CSP still detects it. Use this to identify what type of device is transmitting near you, then cross-match against live KAPPA events.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label className="font-mono text-[10px] text-muted-foreground">Suspected Modulation / Device</Label>
                    <Select value={modType} onValueChange={setModType}>
                      <SelectTrigger className="font-mono text-sm mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-mono">
                        <SelectItem value="ble">BLE (Bluetooth Low Energy)</SelectItem>
                        <SelectItem value="liberty_modem">Liberty / Cable Modem (DOCSIS)</SelectItem>
                        <SelectItem value="bpsk">BPSK (Generic)</SelectItem>
                        <SelectItem value="qpsk">QPSK (Generic)</SelectItem>
                        <SelectItem value="16qam">16-QAM (Generic)</SelectItem>
                        <SelectItem value="fsk">FSK (Generic)</SelectItem>
                        <SelectItem value="ofdm">OFDM / WiFi</SelectItem>
                        <SelectItem value="am">AM (Broadcast / Parametric)</SelectItem>
                        <SelectItem value="gsm">GSM / 2G</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="font-mono text-[10px] text-muted-foreground">Symbol Rate (Hz)</Label>
                      <Input type="number" value={symbolRate}
                        onChange={e => setSymbolRate(Number(e.target.value))}
                        className="font-mono text-sm mt-1 h-8" />
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5">BLE: 1,000,000. WiFi: 250,000. GSM: 270,833</p>
                    </div>
                    <div>
                      <Label className="font-mono text-[10px] text-muted-foreground">Carrier Offset (Hz)</Label>
                      <Input type="number" value={carrierOffset}
                        onChange={e => setCarrierOffset(Number(e.target.value))}
                        className="font-mono text-sm mt-1 h-8" />
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5">Offset from tuned center. 0 if perfectly tuned.</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Cycle frequencies */}
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">
                    Expected Cycle Frequencies (α values)
                  </div>
                  <div className="space-y-2">
                    {cycloFeatures.map((f, i) => (
                      <div key={i} className="flex items-center justify-between border border-border/40 rounded-sm px-3 py-2 bg-card/20">
                        <span className="text-[11px] text-muted-foreground font-mono">{f.label}</span>
                        <div className="text-right">
                          <div className="text-[12px] font-mono font-bold text-primary">
                            {f.alpha >= 1e6 ? `${(f.alpha / 1e6).toFixed(3)} MHz` : f.alpha >= 1e3 ? `${(f.alpha / 1e3).toFixed(2)} kHz` : `${f.alpha.toFixed(1)} Hz`}
                          </div>
                          {cycloMatches.some(m => m.expectedAlpha === f.alpha) && (
                            <Badge className="text-[9px] bg-red-900 text-red-200 rounded-none mt-0.5">KAPPA MATCH</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cross-matches */}
                {cycloMatches.length > 0 && (
                  <div className="border border-red-800/40 bg-red-950/10 rounded-sm p-4">
                    <div className="text-[10px] font-mono font-bold text-red-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" /> KAPPA EVENT MATCHES ({cycloMatches.length})
                    </div>
                    {cycloMatches.map((m, i) => (
                      <div key={i} className="text-[11px] font-mono text-muted-foreground border-b border-border/20 py-1.5">
                        <span className="text-foreground">{m.matchedFeature}</span> matched event at {new Date(m.timestamp).toLocaleString()} — {m.domain} / {m.source}
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-blue-800/40 bg-blue-950/10 rounded-sm p-4">
                  <div className="text-[10px] font-mono font-bold text-blue-400 mb-2 uppercase tracking-widest">HOW TO USE IN THE FIELD</div>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Select the device type you suspect (Liberty modem, BLE corner unit, etc.)</li>
                    <li>Note the cycle frequencies above. Tune KiwiSDR to scan those exact frequencies</li>
                    <li>Look for CAF peaks at those alpha values — they persist even when signal is below noise floor</li>
                    <li>The BLE (1 MHz symbol rate) cycle frequency at 2× = 2 MHz — if you see energy at 2.441 GHz ± 2 MHz on a 2.440 GHz BLE channel, it's a BLE device transmitting</li>
                    <li>Liberty DOCSIS upstream pilot at 3 MHz — look for this in the cable return band (5–85 MHz)</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <PysdrImg file="caf_at_correct_alpha.svg" caption="CAF at correct α — peak confirms transmitter presence" />
                <PysdrImg file="caf_at_incorrect_alpha.svg" caption="CAF at wrong α — null output (no signal at this rate)" />
                <PysdrImg file="scf_fam.svg" caption="SCF FAM output — full cyclostationary map of a signal" />
                <PysdrImg file="scf_conj_rect_bpsk.svg" caption="SCF BPSK conjugate features — typical fingerprint" />
                <PysdrImg file="scf_freq_smoothing.svg" caption="SCF freq-smoothed — cleaner fingerprint at low SNR" />
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 5: PySDR FIELD REFERENCE ────────────────────────────────── */}
          <TabsContent value="ref" className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search diagrams (filter, doa, cfar, cyclo...)"
                value={imgSearch}
                onChange={e => setImgSearch(e.target.value)}
                className="font-mono text-sm max-w-xs"
                data-testid="input-pysdr-search"
              />
              <span className="text-[11px] font-mono text-muted-foreground/50">{filteredImages.length} / {allPysdrImages.length} diagrams</span>
            </div>

            {(["Filters", "Detection", "DOA", "Beamforming", "Cyclostationary", "Noise", "Analysis", "IQ", "FFT", "Modulation", "Channel", "Pulse Shaping"] as const)
              .filter(ch => filteredImages.some(i => i.chapter === ch))
              .map(chapter => (
                <div key={chapter}>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-3 mt-2">{chapter}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredImages.filter(i => i.chapter === chapter).map(img => (
                      <PysdrImg key={img.file} file={img.file} caption={img.label} />
                    ))}
                  </div>
                </div>
              ))
            }
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
