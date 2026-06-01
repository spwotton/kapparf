import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Radio, Target, Upload, Play, Square, Zap, Activity, RotateCcw } from "lucide-react";

// ── GOS constants (mirrored from server) ────────────────────────────────────
const KAPPA_1 = 4 / Math.PI;
const AK7_DOMAINS = [
  { spoke: 1,  key: "drone_acoustic",    label: "Drone Acoustic",        rune: "ᚠ", color: "#ef4444" },
  { spoke: 2,  key: "rf_bearing",        label: "RF Bearing",            rune: "ᚢ", color: "#f97316" },
  { spoke: 3,  key: "elf_24hz",          label: "ELF 24.2 Hz",           rune: "ᚦ", color: "#eab308" },
  { spoke: 4,  key: "schumann",          label: "Schumann 7.83 Hz",      rune: "ᚨ", color: "#22c55e" },
  { spoke: 5,  key: "seismic_usgs",      label: "Seismic (USGS)",        rune: "ᚱ", color: "#14b8a6" },
  { spoke: 6,  key: "seismic_iris",      label: "Seismic (IRIS)",        rune: "ᚲ", color: "#06b6d4" },
  { spoke: 7,  key: "solar_xray",        label: "Solar X-Ray",           rune: "ᚷ", color: "#3b82f6" },
  { spoke: 8,  key: "solar_wind_bz",     label: "Solar Wind Bz",         rune: "ᚹ", color: "#6366f1" },
  { spoke: 9,  key: "kp_index",          label: "Kp Index",              rune: "ᚺ", color: "#8b5cf6" },
  { spoke: 10, key: "tle_overhead",      label: "Satellite Pass",        rune: "ᚾ", color: "#a855f7" },
  { spoke: 11, key: "lightning_wwlln",   label: "Lightning",             rune: "ᚻ", color: "#ec4899" },
  { spoke: 12, key: "network_anomaly",   label: "Network Anomaly",       rune: "ᛇ", color: "#f43f5e" },
  { spoke: 13, key: "ble_rssi",          label: "BLE/RF Local",          rune: "ᛈ", color: "#fb923c" },
  { spoke: 14, key: "drone_bearing",     label: "Drone Bearing Est.",    rune: "ᛉ", color: "#fbbf24" },
  { spoke: 15, key: "geodetic_jitter",   label: "GPS Jitter",            rune: "ᛊ", color: "#a3e635" },
  { spoke: 16, key: "ionospheric_tec",   label: "Ionospheric TEC",       rune: "ᛏ", color: "#34d399" },
  { spoke: 17, key: "weather_pressure",  label: "Atmo Pressure",         rune: "ᛒ", color: "#2dd4bf" },
  { spoke: 18, key: "blackjack_hf",      label: "BLACKJACK HF",          rune: "ᛖ", color: "#38bdf8" },
  { spoke: 19, key: "kiwisdr_priority",  label: "KiwiSDR Priority",      rune: "ᛗ", color: "#818cf8" },
  { spoke: 20, key: "elf_breaker_delta", label: "ELF Breaker Δ",         rune: "ᛚ", color: "#c084fc" },
  { spoke: 21, key: "ultrasonic",        label: "Ultrasonic 18–22 kHz",  rune: "ᛝ", color: "#f472b6" },
  { spoke: 22, key: "kappa_score",       label: "KAPPA Score",           rune: "ᛟ", color: "#fb7185" },
  { spoke: 23, key: "seismic_geonet",    label: "Seismic GeoNet",        rune: "ᛞ", color: "#4ade80" },
  { spoke: 24, key: "geomag_dst",        label: "Dst Storm Index",       rune: "ᛥ", color: "#60a5fa" },
];

// ── Compass / bearing display ────────────────────────────────────────────────
function CompassRose({ bearings }: { bearings: Array<{ bearing: number; confidence: number; frequency: number }> }) {
  const cx = 120, cy = 120, r = 95;
  const cardinals = [
    { label: "N", angle: -90 }, { label: "E", angle: 0 },
    { label: "S", angle: 90 }, { label: "W", angle: 180 },
  ];
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full" data-testid="compass-rose">
      {[r, r * 0.67, r * 0.33].map((ring, i) => (
        <circle key={i} cx={cx} cy={cy} r={ring} fill="none"
          stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
      ))}
      {cardinals.map(({ label, angle }) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <g key={label}>
            <line x1={cx} y1={cy}
              x2={cx + (r + 10) * Math.cos(rad)} y2={cy + (r + 10) * Math.sin(rad)}
              stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
            <text x={cx + (r + 18) * Math.cos(rad)} y={cy + (r + 18) * Math.sin(rad)}
              textAnchor="middle" dominantBaseline="middle"
              className="fill-muted-foreground text-[9px] font-mono">{label}</text>
          </g>
        );
      })}
      {bearings.map((b, i) => {
        const rad = ((b.bearing - 90) * Math.PI) / 180;
        const len = r * 0.85 * b.confidence;
        const x2 = cx + len * Math.cos(rad);
        const y2 = cy + len * Math.sin(rad);
        const opacity = 0.4 + 0.6 * b.confidence;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x2} y2={y2}
              stroke="#ef4444" strokeWidth={2} strokeOpacity={opacity} />
            <circle cx={x2} cy={y2} r={3} fill="#ef4444" fillOpacity={opacity} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={4} fill="currentColor" fillOpacity={0.6} />
    </svg>
  );
}

// ── MUSIC pseudospectrum polar plot ──────────────────────────────────────────
function MUSICPolar({ spectrum }: { spectrum: number[] }) {
  if (!spectrum?.length) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-mono">
      No pseudospectrum data
    </div>
  );
  const cx = 120, cy = 120, r = 95;
  const max = Math.max(...spectrum);
  const points = spectrum.map((val, i) => {
    const angle = ((i * 360 / spectrum.length) - 90) * Math.PI / 180;
    const len = r * (val / max);
    return `${cx + len * Math.cos(angle)},${cy + len * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full" data-testid="music-polar">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} />
      <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="currentColor" strokeOpacity={0.07} />
      <polygon points={points} fill="#3b82f6" fillOpacity={0.2} stroke="#3b82f6" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={3} fill="currentColor" fillOpacity={0.5} />
    </svg>
  );
}

// ── 24-spoke AK7 Ω-Correlator radar ──────────────────────────────────────────
function OmegaSpoke({ domain, normalized, rune, color, label }: {
  domain: string; normalized: number; rune: string; color: string; label: string;
}) {
  const pct = Math.round(normalized * 100);
  const isHot = normalized > 0.65;
  return (
    <div data-testid={`spoke-${domain}`}
      className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border transition-all
        ${isHot ? "border-red-500/50 bg-red-500/5" : "border-border/30 bg-transparent"}`}>
      <span className="text-base w-5 text-center" title={`Rune: ${rune}`}>{rune}</span>
      <div className="flex-1 min-w-0">
        <div className="truncate font-mono text-[10px] text-muted-foreground">{label}</div>
        <div className="h-1 bg-border/30 rounded mt-1">
          <div className="h-full rounded transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
      <span className={`font-mono text-[10px] w-8 text-right ${isHot ? "text-red-400 font-bold" : "text-muted-foreground"}`}>
        {pct}%
      </span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SpectrumPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeSweepId, setActiveSweepId] = useState<string | null>(null);
  const [freqStart, setFreqStart] = useState("100000");
  const [freqStop, setFreqStop] = useState("30000000");
  const [csvText, setCsvText] = useState("");
  const [csvLabel, setCsvLabel] = useState("");
  const [manualDomain, setManualDomain] = useState("elf_24hz");
  const [manualValue, setManualValue] = useState("");
  const [manualUnit, setManualUnit] = useState("");
  const [activeTab, setActiveTab] = useState<"spectrum" | "correlator" | "bearings">("spectrum");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: currentData } = useQuery({
    queryKey: ["/api/spectrum/current"],
    refetchInterval: activeSweepId ? 3000 : 10000,
  });
  const { data: sweepsData } = useQuery({ queryKey: ["/api/spectrum/sweeps"] });
  const { data: correlatorData } = useQuery({
    queryKey: ["/api/omega-correlator/latest"],
    refetchInterval: 15000,
  });
  const { data: correlatorEvents } = useQuery({
    queryKey: ["/api/omega-correlator/events"],
    refetchInterval: 15000,
  });

  const bins: Array<{ frequency: number; amplitude: number }> = currentData?.bins ?? [];
  const bearings: Array<{ bearing: number; confidence: number; frequency: number }> = currentData?.bearings ?? [];
  const latestPseudo: number[] = bearings[0]?.pseudoSpectrum ?? [];
  const domainLatest: Record<string, { value: number; normalized: number; ts: string }> = correlatorData?.domains ?? {};
  const events: any[] = correlatorEvents?.events ?? [];

  // ── CSV upload sweep ───────────────────────────────────────────────────────
  const csvMutation = useMutation({
    mutationFn: (body: { csv: string; label: string; freqStart: number; freqStop: number }) =>
      apiRequest("POST", "/api/spectrum/upload-csv", body),
    onSuccess: async (res) => {
      const data = await res.json();
      setActiveSweepId(data.sweepId);
      qc.invalidateQueries({ queryKey: ["/api/spectrum/current"] });
      qc.invalidateQueries({ queryKey: ["/api/spectrum/sweeps"] });
      toast({ title: `Sweep created — ${data.binCount} bins ingested` });
    },
    onError: () => toast({ title: "CSV upload failed", variant: "destructive" }),
  });

  // ── Manual domain reading ──────────────────────────────────────────────────
  const domainMutation = useMutation({
    mutationFn: (body: { domain: string; value: number; unit: string; source: string }) =>
      apiRequest("POST", "/api/omega-correlator/ingest", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/omega-correlator/latest"] });
      setManualValue("");
      toast({ title: "Reading ingested into Ω-Correlator" });
    },
  });

  const handleCsvUpload = () => {
    if (!csvText.trim()) return;
    csvMutation.mutate({
      csv: csvText,
      label: csvLabel || "Manual scan",
      freqStart: parseFloat(freqStart),
      freqStop: parseFloat(freqStop),
    });
  };

  const handleManualIngest = () => {
    const v = parseFloat(manualValue);
    if (isNaN(v)) return;
    domainMutation.mutate({ domain: manualDomain, value: v, unit: manualUnit, source: "manual" });
  };

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartBins = bins.map(b => ({
    freq: (b.frequency / 1e6).toFixed(4),
    amp: b.amplitude,
  })).sort((a, b) => parseFloat(a.freq) - parseFloat(b.freq));

  const knownFreqs = [
    { freq: 0.0000078392, label: "8.392Hz Schumann", mhz: 0.000008392 },
    { freq: 0.0000000242, label: "24.2Hz ELF", mhz: 0.0000000242 },
    { freq: 0.04687, label: "46.875Hz PRF", mhz: 0.00004687 },
  ];

  return (
    <div className="p-4 space-y-4 max-w-screen-2xl mx-auto" data-testid="spectrum-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            Radiogoniometry Spectrum Sweeper
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            κ₁ = {KAPPA_1.toFixed(5)} | cal. scalar = 10√13 | Schumann clock = 8.392 Hz | MUSIC algorithm
          </p>
        </div>
        <div className="flex gap-2">
          {activeSweepId && (
            <Badge variant="destructive" className="font-mono text-xs animate-pulse">
              SWEEP ACTIVE
            </Badge>
          )}
          <Badge variant="outline" className="font-mono text-xs">
            {bins.length} bins | {bearings.length} bearings
          </Badge>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {(["spectrum", "correlator", "bearings"] as const).map(tab => (
          <button key={tab} data-testid={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-mono capitalize border-b-2 transition-colors
              ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab === "correlator" ? "Ω-Correlator" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── SPECTRUM TAB ── */}
      {activeTab === "spectrum" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Spectrum chart */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Frequency Spectrum
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartBins.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-xs font-mono">
                    No spectrum data — upload a CSV scan below
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartBins}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                      <XAxis dataKey="freq" type="number" domain={["dataMin", "dataMax"]}
                        tickFormatter={(v) => `${v}M`} tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis domain={["auto", "auto"]} unit="dBm" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)} dBm`]} labelFormatter={(v) => `${v} MHz`} />
                      <Line type="monotone" dataKey="amp" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* CSV Upload */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Spectrum CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Paste CSV data exported from any SDR tool (rtl_power, GQRX, SDR#, rf_spectrum_pipeline.py).
                  Format: <code className="font-mono bg-muted px-1 rounded">frequency_hz,amplitude_dbm</code> per row.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input data-testid="input-csv-label" value={csvLabel} onChange={e => setCsvLabel(e.target.value)}
                      placeholder="e.g. Jacó rooftop 2026-06-01" className="text-xs font-mono h-8 mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <Label className="text-xs">Freq start (Hz)</Label>
                      <Input data-testid="input-freq-start" value={freqStart} onChange={e => setFreqStart(e.target.value)}
                        className="text-xs font-mono h-8 mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Freq stop (Hz)</Label>
                      <Input data-testid="input-freq-stop" value={freqStop} onChange={e => setFreqStop(e.target.value)}
                        className="text-xs font-mono h-8 mt-1" />
                    </div>
                  </div>
                </div>
                <Textarea data-testid="textarea-csv"
                  value={csvText} onChange={e => setCsvText(e.target.value)}
                  placeholder={"frequency_hz,amplitude_dbm\n1000000,-87.3\n2000000,-91.1\n..."}
                  rows={6} className="font-mono text-xs" />
                <Button data-testid="button-upload-csv" onClick={handleCsvUpload}
                  disabled={!csvText.trim() || csvMutation.isPending} size="sm">
                  {csvMutation.isPending ? "Processing…" : "Ingest Spectrum"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Compass + Sweep list */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Target className="w-4 h-4" /> Bearing Compass
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-square max-w-[240px] mx-auto">
                  <CompassRose bearings={bearings} />
                </div>
                {bearings.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {bearings.slice(0, 5).map((b, i) => (
                      <div key={i} className="flex justify-between text-xs font-mono">
                        <span className="text-muted-foreground">{(b.frequency / 1e6).toFixed(3)} MHz</span>
                        <span className="font-bold">{b.bearing.toFixed(1)}°</span>
                        <span className="text-muted-foreground">{(b.confidence * 100).toFixed(0)}% conf</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">MUSIC Pseudospectrum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-square max-w-[240px] mx-auto">
                  <MUSICPolar spectrum={latestPseudo} />
                </div>
              </CardContent>
            </Card>

            {/* Sweep history */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">Sweep History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {(sweepsData?.sweeps ?? []).slice(0, 8).map((s: any) => (
                  <div key={s.id} data-testid={`sweep-${s.id}`}
                    className="flex justify-between items-center text-xs font-mono py-1 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground truncate flex-1">
                      {s.label ?? "Unlabeled"}
                    </span>
                    <Badge variant={s.status === "active" ? "destructive" : "outline"} className="text-[9px] ml-2">
                      {s.status}
                    </Badge>
                  </div>
                ))}
                {!(sweepsData?.sweeps?.length) && (
                  <p className="text-xs text-muted-foreground">No sweeps yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── CORRELATOR TAB ── */}
      {activeTab === "correlator" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* 24-spoke lattice */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  AK7 24-Spoke Ω-Correlator Lattice
                  <span className="text-muted-foreground text-[10px] ml-auto">
                    κ₁-normalized · Schumann 8.392 Hz master clock
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {AK7_DOMAINS.map(d => {
                    const latest = domainLatest[d.key];
                    return (
                      <OmegaSpoke key={d.key} domain={d.key}
                        normalized={latest?.normalized ?? 0}
                        rune={d.rune} color={d.color} label={d.label} />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual ingest + events */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono">Manual Reading Ingest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Enter a real measured value for any domain spoke. It will be κ₁-normalized and stored.
                </p>
                <div>
                  <Label className="text-xs">Domain Spoke</Label>
                  <select data-testid="select-domain"
                    value={manualDomain} onChange={e => setManualDomain(e.target.value)}
                    className="w-full mt-1 text-xs font-mono border border-border rounded px-2 py-1.5 bg-background">
                    {AK7_DOMAINS.map(d => (
                      <option key={d.key} value={d.key}>{d.rune} {d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input data-testid="input-manual-value" value={manualValue}
                      onChange={e => setManualValue(e.target.value)}
                      placeholder="e.g. 738.5" className="text-xs font-mono h-8 mt-1" type="number" />
                  </div>
                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Input data-testid="input-manual-unit" value={manualUnit}
                      onChange={e => setManualUnit(e.target.value)}
                      placeholder="e.g. power" className="text-xs font-mono h-8 mt-1" />
                  </div>
                </div>
                <Button data-testid="button-ingest-manual" onClick={handleManualIngest} size="sm"
                  disabled={!manualValue || domainMutation.isPending} className="w-full">
                  {domainMutation.isPending ? "Ingesting…" : "Ingest Reading"}
                </Button>
              </CardContent>
            </Card>

            {/* Correlation events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Correlation Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {events.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No multi-domain events yet. Events fire when 3+ spokes exceed 65% activation simultaneously.
                  </p>
                )}
                {events.slice(0, 8).map((ev: any) => (
                  <div key={ev.id} data-testid={`event-${ev.id}`}
                    className={`p-2 rounded border text-xs font-mono
                      ${ev.severity === "critical" ? "border-red-500/40 bg-red-500/5" :
                        ev.severity === "warning" ? "border-yellow-500/40 bg-yellow-500/5" :
                          "border-border/30"}`}>
                    <div className="flex justify-between">
                      <span className="font-bold">{ev.domainCount} spokes</span>
                      <Badge variant={ev.severity === "critical" ? "destructive" : "outline"}
                        className="text-[9px]">{ev.severity}</Badge>
                    </div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-[10px] mt-0.5">{ev.description}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── BEARINGS TAB ── */}
      {activeTab === "bearings" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">MUSIC Pseudospectrum (full)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full aspect-square max-w-sm mx-auto">
                <MUSICPolar spectrum={latestPseudo} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">Bearing Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {bearings.length === 0 && (
                  <p className="text-xs text-muted-foreground">No bearings yet. Upload spectrum data with multi-antenna IQ.</p>
                )}
                {bearings.map((b: any, i) => (
                  <div key={i} data-testid={`bearing-row-${i}`}
                    className="flex gap-4 text-xs font-mono py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground w-28 shrink-0">
                      {(b.frequency / 1e6).toFixed(3)} MHz
                    </span>
                    <span className="font-bold w-16">{parseFloat(b.bearing).toFixed(1)}°</span>
                    <span className="text-muted-foreground w-20">
                      {(b.confidence * 100).toFixed(0)}% conf
                    </span>
                    <span className="text-muted-foreground text-[10px]">{b.method}</span>
                    <span className="text-muted-foreground text-[10px] ml-auto">
                      {b.timestamp ? new Date(b.timestamp).toLocaleTimeString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
