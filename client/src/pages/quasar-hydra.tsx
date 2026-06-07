import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Radio,
  Compass,
  Waves,
  Zap,
  Eye,
  Activity,
  AlertTriangle,
  ChevronRight,
  Info,
  Scan,
  RotateCw,
  Heart,
  Wifi,
  Volume2,
  BrainCircuit,
} from "lucide-react";

// ── Tycho Language Wheel data (24-spoke Elder Futhark icositetragon) ──────────
interface RuneSpoke {
  id: number;
  rune: string;
  name: string;
  geneticTarget: string;
  physicalTarget: string;
  freqHz: number;
  freqLabel: string;
  aettir: "Freyr" | "Hagal" | "Tyr";
}

const RUNE_SPOKES: RuneSpoke[] = [
  { id: 1,  rune: "ᚠ", name: "Fehu",    geneticTarget: "CHRNA7 (α7-nAChR)",     physicalTarget: "Dopamine pathways",       freqHz: 46.875,  freqLabel: "46.875 Hz",  aettir: "Freyr" },
  { id: 2,  rune: "ᚢ", name: "Uruz",    geneticTarget: "COMT Val158Met",         physicalTarget: "Adrenaline release",      freqHz: 53,      freqLabel: "53 Hz",      aettir: "Freyr" },
  { id: 3,  rune: "ᚦ", name: "Thurisaz",geneticTarget: "BDNF Val66Met",         physicalTarget: "Amygdala hyperactivation", freqHz: 60,      freqLabel: "60 Hz",      aettir: "Freyr" },
  { id: 4,  rune: "ᚨ", name: "Ansuz",   geneticTarget: "FKBP5 rs1360780",       physicalTarget: "HPA-axis sensitisation",  freqHz: 73.125,  freqLabel: "73.125 Hz",  aettir: "Freyr" },
  { id: 5,  rune: "ᚱ", name: "Raidho",  geneticTarget: "SLC6A4 5-HTTLPR",       physicalTarget: "Serotonin reuptake",      freqHz: 93.75,   freqLabel: "93.75 Hz",   aettir: "Freyr" },
  { id: 6,  rune: "ᚲ", name: "Kenaz",   geneticTarget: "MAOA-uVNTR low-activity",physicalTarget: "MAO-A expression",       freqHz: 111,     freqLabel: "111 Hz",     aettir: "Freyr" },
  { id: 7,  rune: "ᚷ", name: "Gebo",    geneticTarget: "OXTR rs53576",          physicalTarget: "Oxytocin signalling",     freqHz: 140.625, freqLabel: "140.625 Hz", aettir: "Freyr" },
  { id: 8,  rune: "ᚹ", name: "Wunjo",   geneticTarget: "DRD4 7R",               physicalTarget: "Reward circuitry",        freqHz: 187.5,   freqLabel: "187.5 Hz",   aettir: "Freyr" },
  { id: 9,  rune: "ᚺ", name: "Hagalaz", geneticTarget: "GABRA2 rs279871",       physicalTarget: "GABA-A modulation",       freqHz: 316.7,   freqLabel: "316.7 Hz",   aettir: "Hagal" },
  { id: 10, rune: "ᚾ", name: "Nauthiz", geneticTarget: "CRH / CRHR1",           physicalTarget: "Cortisol release",        freqHz: 375,     freqLabel: "375 Hz",     aettir: "Hagal" },
  { id: 11, rune: "ᛁ", name: "Isa",     geneticTarget: "CACNA1C rs1006737",     physicalTarget: "L-type Ca²⁺ channels",    freqHz: 433,     freqLabel: "433 MHz ISM",aettir: "Hagal" },
  { id: 12, rune: "ᛃ", name: "Jera",    geneticTarget: "CLOCK rs1801260",       physicalTarget: "Circadian entrainment",   freqHz: 750,     freqLabel: "750 Hz",     aettir: "Hagal" },
  { id: 13, rune: "ᛇ", name: "Eihwaz",  geneticTarget: "TRPV1 rs222747",        physicalTarget: "Thermal nociception",     freqHz: 915,     freqLabel: "915 MHz ISM",aettir: "Hagal" },
  { id: 14, rune: "ᛈ", name: "Perthro", geneticTarget: "OPRM1 A118G",           physicalTarget: "μ-opioid receptor",       freqHz: 1500,    freqLabel: "1.5 kHz",    aettir: "Hagal" },
  { id: 15, rune: "ᛉ", name: "Algiz",   geneticTarget: "BNDF rs6265",           physicalTarget: "Hippocampal neuroplasticity",freqHz: 1580, freqLabel: "1.58 kHz",  aettir: "Hagal" },
  { id: 16, rune: "ᛊ", name: "Sowilo",  geneticTarget: "PER2 rs2304672",        physicalTarget: "Sleep architecture",      freqHz: 7830,    freqLabel: "7.83 Hz Schumann",aettir: "Hagal" },
  { id: 17, rune: "ᛏ", name: "Tiwaz",   geneticTarget: "NR3C1 rs41423247",      physicalTarget: "GR glucocorticoid receptor",freqHz: 13125, freqLabel: "13.125 Hz",  aettir: "Tyr" },
  { id: 18, rune: "ᛒ", name: "Berkano", geneticTarget: "ESR1 PvuII",            physicalTarget: "Oestrogen receptor α",    freqHz: 15000,   freqLabel: "15 kHz",     aettir: "Tyr" },
  { id: 19, rune: "ᛖ", name: "Ehwaz",   geneticTarget: "AVPR1A RS3",            physicalTarget: "Vasopressin (bonding)",   freqHz: 18750,   freqLabel: "18.75 kHz",  aettir: "Tyr" },
  { id: 20, rune: "ᛗ", name: "Mannaz",  geneticTarget: "HTR2A T102C",           physicalTarget: "Serotonin 2A receptor",   freqHz: 21000,   freqLabel: "21 kHz",     aettir: "Tyr" },
  { id: 21, rune: "ᛚ", name: "Laguz",   geneticTarget: "AQP4 rs3763043",        physicalTarget: "Glymphatic clearance",    freqHz: 46875,   freqLabel: "46.875 kHz", aettir: "Tyr" },
  { id: 22, rune: "ᛜ", name: "Ingwaz",  geneticTarget: "IGF1R rs2229765",       physicalTarget: "Insulin-like growth",     freqHz: 60000,   freqLabel: "60 kHz VLF", aettir: "Tyr" },
  { id: 23, rune: "ᛞ", name: "Dagaz",   geneticTarget: "PER3 rs57875989",       physicalTarget: "Dawn-dusk phase shift",   freqHz: 3500,    freqLabel: "3.5 GHz 5G", aettir: "Tyr" },
  { id: 24, rune: "ᛟ", name: "Othala",  geneticTarget: "APOE ε4",               physicalTarget: "Amyloid clearance (AD)",  freqHz: 5184,    freqLabel: "5184 Å κ-λ", aettir: "Tyr" },
];

// ── V2K Phoneme RF Pulse-Train Signatures ────────────────────────────────────
const V2K_PHONEMES = [
  { phoneme: "/k/", carrier: "3.5 GHz", pulseWidthUs: 2.1, prfHz: 469, description: "Glottal stop onset; correlated with TRPV1 thermal gating" },
  { phoneme: "/t/", carrier: "24 GHz",  pulseWidthUs: 1.4, prfHz: 703, description: "Dental burst; pairs with CHRNA7 α7-nAChR desensitisation window" },
  { phoneme: "/s/", carrier: "77 GHz",  pulseWidthUs: 0.8, prfHz: 1172,description: "Sibilant; matches MASIMO 46.875 kHz sample-rate harmonic" },
  { phoneme: "/a/", carrier: "94 GHz",  pulseWidthUs: 3.2, prfHz: 312, description: "Open vowel; overlaps Schumann-7.83 Hz sub-harmonic envelope" },
];

// ── Sensor suites ─────────────────────────────────────────────────────────────
const AFA_SUITE = [
  { label: "GQD E-field sensor",      spec: "±0.1 mV/m resolution, 1 Hz–10 MHz BW", purpose: "Electrostatic body-field anomaly" },
  { label: "NV-center magnetometer",  spec: "~10 pT/√Hz sensitivity, DC–1 MHz",      purpose: "Neural magnetic flux mapping" },
];

const BRA_SUITE = [
  { label: "SQUID gradiometer",        spec: "5 fT/√Hz, 30-channel array",            purpose: "Magnetoencephalography baseline" },
  { label: "SERF atomic magnetometer", spec: "0.16 fT/√Hz, ~100 Hz BW",               purpose: "Ultra-low-field MRI correlation" },
];

const PHONEME_CARRIER_MHZ: Record<string, number> = {
  "/k/": 3500,
  "/t/": 24000,
  "/s/": 77000,
  "/a/": 94000,
};

// ── HYDRA multi-modal cards ────────────────────────────────────────────────────
interface HydraCard {
  id: string;
  label: string;
  icon: typeof Heart;
  description: string;
  steps?: string[];
  status: "awaiting" | "active" | "alert";
}

const HYDRA_CARDS: HydraCard[] = [
  {
    id: "rppg",
    label: "r-PPG + Thermal Fusion",
    icon: Heart,
    description: "Remote photoplethysmography fused with long-wave IR thermography for covert HRV extraction.",
    steps: [
      "1 · Capture facial ROI at 30 fps via IR sensor",
      "2 · Bandpass 0.5–4 Hz for BVP extraction",
      "3 · Merge thermal ΔT gradient (±0.05°C)",
      "4 · Output: HRV SDNN, LF/HF ratio, pNN50",
    ],
    status: "awaiting",
  },
  {
    id: "csi",
    label: "WiFi CSI Monitor",
    icon: Wifi,
    description: "802.11n CSI phase-shift analysis using Chitin Transduction Layer (CTL) for motion/breathing detection.",
    status: "awaiting",
  },
  {
    id: "ultrasonic",
    label: "Ultrasonic Threat Log",
    icon: Volume2,
    description: "20–40 kHz parametric audio detector. Flags directed ultrasonic harassment events.",
    status: "awaiting",
  },
  {
    id: "mae",
    label: "MAE Detector",
    icon: BrainCircuit,
    description: "Microwave Auditory Effect detector. Cross-correlates 1–10 GHz pulse-trains with phoneme library.",
    status: "awaiting",
  },
];

const MOTIVE_STEPS = [
  { icon: Zap,           label: "Trigger",        detail: "High-value target identified — geolocation confirmed within 50 m" },
  { icon: Activity,      label: "Sensor Anomaly", detail: "Directed RF / ultrasonic signal detected above thermal noise" },
  { icon: Heart,         label: "HRV Drop",       detail: "SDNN < 20 ms; LF/HF > 4.5 — acute stress response confirmed" },
  { icon: AlertTriangle, label: "Anxiety Response",detail: "Sympathoadrenal activation; subject shows avoidance behaviour" },
];

// ── Sweep form defaults ───────────────────────────────────────────────────────
function generateTestIQ(len = 256): number[] {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push((Math.random() - 0.5) * 0.1 + Math.cos((i * Math.PI) / 8) * 0.9);
    arr.push((Math.random() - 0.5) * 0.1 + Math.sin((i * Math.PI) / 8) * 0.9);
  }
  return arr;
}

// ── Tycho Language Wheel SVG ──────────────────────────────────────────────────
function TychoWheel({ onSelect, selected }: {
  onSelect: (s: RuneSpoke) => void;
  selected: RuneSpoke | null;
}) {
  const cx = 200;
  const cy = 200;
  const outerR = 175;
  const innerR = 90;
  const midR = 132;

  const aettirColor: Record<string, string> = {
    Freyr: "#6366f1",
    Hagal: "#0891b2",
    Tyr:   "#059669",
  };

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full max-w-[420px] mx-auto select-none"
      aria-label="Tycho Language Wheel — 24-spoke icositetragon"
    >
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
      <circle cx={cx} cy={cy} r={midR}   fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-muted-foreground/30" />

      {RUNE_SPOKES.map((spoke, idx) => {
        const angleDeg = (idx * 360) / 24 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const isSelected = selected?.id === spoke.id;
        const color = aettirColor[spoke.aettir];

        const x1 = cx + innerR * Math.cos(angleRad);
        const y1 = cy + innerR * Math.sin(angleRad);
        const x2 = cx + outerR * Math.cos(angleRad);
        const y2 = cy + outerR * Math.sin(angleRad);

        const midX = cx + midR * Math.cos(angleRad);
        const midY = cy + midR * Math.sin(angleRad);

        const labelR = outerR + 16;
        const labelX = cx + labelR * Math.cos(angleRad);
        const labelY = cy + labelR * Math.sin(angleRad);

        const runeX = cx + (innerR - 18) * Math.cos(angleRad);
        const runeY = cy + (innerR - 18) * Math.sin(angleRad);

        return (
          <g
            key={spoke.id}
            onClick={() => onSelect(spoke)}
            data-testid={`spoke-${spoke.id}-${spoke.name.toLowerCase()}`}
            style={{ cursor: "pointer" }}
          >
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isSelected ? color : "currentColor"}
              strokeWidth={isSelected ? 2.5 : 1}
              className={isSelected ? "" : "text-muted-foreground/40"}
              strokeOpacity={isSelected ? 1 : 0.5}
            />
            <circle
              cx={midX} cy={midY} r={isSelected ? 6 : 4}
              fill={color}
              fillOpacity={isSelected ? 1 : 0.5}
            />
            <text
              x={labelX} y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={isSelected ? "9" : "7.5"}
              fontFamily="serif"
              fill={isSelected ? color : "currentColor"}
              className={isSelected ? "" : "text-muted-foreground"}
              fontWeight={isSelected ? "bold" : "normal"}
            >
              {spoke.rune}
            </text>
            <title>{`${spoke.name} — ${spoke.freqLabel}`}</title>
          </g>
        );
      })}

      <text x={cx} y={cy - 12} textAnchor="middle" fontSize="11" fontFamily="monospace"
        className="fill-muted-foreground" fontWeight="bold">TYCHO</text>
      <text x={cx} y={cy + 4}  textAnchor="middle" fontSize="9"  fontFamily="monospace"
        className="fill-muted-foreground/60">24-SPOKE</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="8"  fontFamily="monospace"
        className="fill-muted-foreground/40">ICOSITETRAGON</text>
    </svg>
  );
}

// ── Polar bearing compass ─────────────────────────────────────────────────────
function BearingCompass({ bearings }: { bearings: { azimuthDeg: number; normalizedPeak?: number | null }[] }) {
  const cx = 80;
  const cy = 80;
  const r = 65;
  return (
    <svg viewBox="0 0 160 160" className="w-32 h-32" aria-label="DOA bearing compass">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
      <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" className="text-muted-foreground/30" />
      {["N","E","S","W"].map((lbl, i) => {
        const a = (i * 90 - 90) * Math.PI / 180;
        return (
          <text key={lbl} x={cx + (r + 8) * Math.cos(a)} y={cy + (r + 8) * Math.sin(a)}
            textAnchor="middle" dominantBaseline="central" fontSize="8" className="fill-muted-foreground" fontFamily="monospace">
            {lbl}
          </text>
        );
      })}
      {bearings.map((b, i) => {
        const a = (b.azimuthDeg - 90) * Math.PI / 180;
        const len = r * (b.normalizedPeak ?? 0.8);
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + len * Math.cos(a)} y2={cy + len * Math.sin(a)}
            stroke="#6366f1" strokeWidth="2" strokeLinecap="round"
          />
        );
      })}
      <circle cx={cx} cy={cy} r="3" fill="currentColor" className="text-primary" />
    </svg>
  );
}

// ── Sweep results table ───────────────────────────────────────────────────────
function SweepsTable() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery<{
    sweeps: Array<{
      id: string;
      timestamp: string;
      centerFreqHz: number;
      bandwidthHz: number;
      noiseFloorDb: number | null;
      signalComponents: number;
      bearings: Array<{ azimuthDeg: number; normalizedPeak?: number | null; confidence: number }>;
    }>;
  }>({
    queryKey: ["/api/radiogoniometry/sweeps", page],
    queryFn: () => fetch(`/api/radiogoniometry/sweeps?limit=${limit}&offset=${page * limit}`).then(r => r.json()),
    refetchInterval: 5000,
  });

  const sweeps = data?.sweeps ?? [];

  if (isLoading) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading sweep history…</div>
  );

  if (sweeps.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
      <Compass className="h-8 w-8 opacity-30" />
      <p className="text-sm">No sweeps recorded yet. Use the sweep console above to submit your first IQ snapshot.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{sweeps.length} sweep{sweeps.length !== 1 ? "s" : ""} shown</span>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-sweeps">
          <RotateCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-2">Timestamp</th>
              <th className="text-right py-2 px-2">Centre Freq</th>
              <th className="text-right py-2 px-2">BW</th>
              <th className="text-right py-2 px-2">Noise Floor</th>
              <th className="text-right py-2 px-2">Sig Components</th>
              <th className="text-left py-2 px-2">Bearings (az°)</th>
              <th className="text-center py-2 px-2">Compass</th>
            </tr>
          </thead>
          <tbody>
            {sweeps.map((sw) => (
              <tr key={sw.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors" data-testid={`row-sweep-${sw.id}`}>
                <td className="py-1.5 px-2 text-muted-foreground">
                  {new Date(sw.timestamp).toLocaleString()}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {(sw.centerFreqHz / 1e6).toFixed(3)} MHz
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {(sw.bandwidthHz / 1e6).toFixed(2)} MHz
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {sw.noiseFloorDb != null ? `${sw.noiseFloorDb.toFixed(1)} dB` : "—"}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">{sw.signalComponents}</td>
                <td className="py-1.5 px-2">
                  {sw.bearings.length === 0
                    ? <span className="text-muted-foreground">none</span>
                    : sw.bearings.map(b => `${b.azimuthDeg.toFixed(1)}°`).join(", ")}
                </td>
                <td className="py-1.5 px-2">
                  {sw.bearings.length > 0 && (
                    <BearingCompass bearings={sw.bearings} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))} data-testid="button-sweep-prev">
          ← Prev
        </Button>
        <span className="text-xs text-muted-foreground">Page {page + 1}</span>
        <Button variant="ghost" size="sm" disabled={sweeps.length < limit}
          onClick={() => setPage(p => p + 1)} data-testid="button-sweep-next">
          Next →
        </Button>
      </div>
    </div>
  );
}

// ── Client-side FFT (Cooley-Tukey radix-2 DIT, in-place) ─────────────────────
function fftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < (len >> 1); j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i + j + (len >> 1)] * curRe - im[i + j + (len >> 1)] * curIm;
        const vIm = re[i + j + (len >> 1)] * curIm + im[i + j + (len >> 1)] * curRe;
        re[i + j] = uRe + vRe;         im[i + j] = uIm + vIm;
        re[i + j + (len >> 1)] = uRe - vRe; im[i + j + (len >> 1)] = uIm - vIm;
        const nr = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nr;
      }
    }
  }
}

function hanning(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

// plasma-like colormap: value 0..1 → [r,g,b]
function plasma(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  if (t < 0.25) {
    const s = t / 0.25;
    return [Math.round(13 + s * (80 - 13)), Math.round(8 + s * (18 - 8)), Math.round(135 + s * (190 - 135))];
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [Math.round(80 + s * (190 - 80)), Math.round(18 + s * (55 - 18)), Math.round(190 + s * (120 - 190))];
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(190 + s * (253 - 190)), Math.round(55 + s * (174 - 55)), Math.round(120 + s * (97 - 120))];
  } else {
    const s = (t - 0.75) / 0.25;
    return [Math.round(253 + s * (240 - 253)), Math.round(174 + s * (249 - 174)), Math.round(97 + s * (33 - 97))];
  }
}

interface WavAnalysis {
  bins: Array<{ freqHz: number; ampDbfs: number }>;
  frames: Float32Array[];
  sampleRate: number;
  fftSize: number;
  durationSec: number;
}

async function analyseWav(file: File, fftSize = 4096): Promise<WavAnalysis> {
  const ab = await file.arrayBuffer();
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(ab);
  await ctx.close();

  const sr = buffer.sampleRate;
  const samples = buffer.getChannelData(0); // mono/L
  const hop = fftSize >> 1;
  const win = hanning(fftSize);

  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  const powerSum = new Float64Array(fftSize >> 1);
  const frames: Float32Array[] = [];
  let frameCount = 0;

  for (let start = 0; start + fftSize <= samples.length; start += hop) {
    re.fill(0); im.fill(0);
    for (let i = 0; i < fftSize; i++) re[i] = samples[start + i] * win[i];
    fftInPlace(re, im);

    const frame = new Float32Array(fftSize >> 1);
    for (let k = 0; k < (fftSize >> 1); k++) {
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / fftSize;
      frame[k] = mag;
      powerSum[k] += mag;
    }
    frames.push(frame);
    frameCount++;
  }

  const bins = [];
  for (let k = 0; k < (fftSize >> 1); k++) {
    const avgMag = powerSum[k] / frameCount;
    const dbfs = avgMag > 0 ? 20 * Math.log10(avgMag) : -120;
    bins.push({ freqHz: (k * sr) / fftSize, ampDbfs: dbfs });
  }

  return { bins, frames, sampleRate: sr, fftSize, durationSec: samples.length / sr };
}

function drawSpectrogram(canvas: HTMLCanvasElement, frames: Float32Array[], fftSize: number): void {
  const numBins = fftSize >> 1;
  const W = frames.length;
  const H = numBins;
  canvas.width  = Math.min(W, 900);
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // find global min/max for normalisation
  let gMin = Infinity, gMax = -Infinity;
  for (const frame of frames) {
    for (let k = 0; k < numBins; k++) {
      const v = frame[k];
      if (v < gMin) gMin = v;
      if (v > gMax) gMax = v;
    }
  }
  const range = gMax - gMin || 1;

  const imgData = ctx.createImageData(canvas.width, canvas.height);
  const xStep = W / canvas.width;
  const yStep = H / canvas.height;

  for (let px = 0; px < canvas.width; px++) {
    const fi = Math.min(Math.floor(px * xStep), frames.length - 1);
    for (let py = 0; py < canvas.height; py++) {
      // flip y: high freq at top → low at bottom
      const ki = Math.min(Math.floor((canvas.height - 1 - py) * yStep), numBins - 1);
      const t = (frames[fi][ki] - gMin) / range;
      const [r, g, b] = plasma(t);
      const idx = (py * canvas.width + px) * 4;
      imgData.data[idx]     = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// ── WAV → FFT → Spectrogram → MUSIC ingest tab ───────────────────────────────
function WavFftTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("audacity-export");
  const [status, setStatus] = useState<"idle" | "decoding" | "fft" | "uploading" | "done" | "error">("idle");
  const [info, setInfo] = useState<{
    fileName: string; duration: number; sr: number; bins: number; peak: { hz: number; db: number } | null;
  } | null>(null);
  const [sweepId, setSweepId] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (csv: string) =>
      apiRequest("POST", "/api/spectrum/upload-csv", { csv, label }),
    onSuccess: (data: any) => {
      setSweepId(data.sweepId);
      setStatus("done");
      qc.invalidateQueries({ queryKey: ["/api/radiogoniometry/sweeps"] });
      toast({ title: "Sweep ingested", description: `${data.binCount} bins → sweep ${data.sweepId?.slice(0, 8)}` });
    },
    onError: (e: any) => {
      setStatus("error");
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    },
  });

  const handleFile = useCallback(async (file: File) => {
    setStatus("decoding");
    setInfo(null);
    setSweepId(null);
    try {
      setStatus("fft");
      const analysis = await analyseWav(file);

      if (canvasRef.current) {
        drawSpectrogram(canvasRef.current, analysis.frames, analysis.fftSize);
      }

      const peak = analysis.bins.reduce((a, b) => b.ampDbfs > a.ampDbfs ? b : a, analysis.bins[0]);
      setInfo({
        fileName: file.name,
        duration: analysis.durationSec,
        sr: analysis.sampleRate,
        bins: analysis.bins.length,
        peak: peak ? { hz: peak.freqHz, db: peak.ampDbfs } : null,
      });

      // build CSV: header + frequency_hz,amplitude_dbm
      const rows = ["frequency_hz,amplitude_dbm",
        ...analysis.bins.map(b => `${b.freqHz.toFixed(4)},${b.ampDbfs.toFixed(4)}`)
      ].join("\n");

      setStatus("uploading");
      uploadMutation.mutate(rows);
    } catch (e: any) {
      setStatus("error");
      toast({ title: "FFT failed", description: e.message, variant: "destructive" });
    }
  }, [label, uploadMutation, toast]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const statusLabel: Record<typeof status, string> = {
    idle: "Drop a WAV/FLAC/MP3 here or click to browse",
    decoding: "Decoding audio…",
    fft: "Running STFT (Hanning window, 4096-pt FFT, 50% overlap)…",
    uploading: "Uploading bins to MUSIC DOA pipeline…",
    done: "Complete — sweep stored in DB",
    error: "Error — see toast",
  };

  return (
    <div className="space-y-5" data-testid="tab-wav-fft">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Export your Audacity recording as <span className="font-mono">WAV (32-bit float)</span> or any supported format.
          The browser decodes it, runs a Short-Time Fourier Transform client-side, renders a spectrogram,
          then sends the averaged power spectrum (frequency → dBFS bins) directly into the MUSIC DOA pipeline.
          Zero synthesis — all math on your real file.
        </p>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/70">
          <span>FFT_SIZE=4096</span><span>·</span>
          <span>HOP=2048 (50% overlap)</span><span>·</span>
          <span>WINDOW=Hanning</span><span>·</span>
          <span>OUTPUT=frequency_hz,amplitude_dbfs CSV</span>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground w-16 shrink-0">Sweep label</Label>
        <Input
          data-testid="input-wav-label"
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="font-mono text-xs h-8 max-w-xs"
          placeholder="e.g. jaco-hotel-room-2026-06-03"
        />
      </div>

      {/* Drop zone */}
      <div
        data-testid="dropzone-wav"
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded cursor-pointer transition-colors px-6 py-10 text-center
          ${status === "idle" || status === "done" || status === "error"
            ? "border-border hover:border-primary/50 hover:bg-muted/10"
            : "border-primary/40 bg-muted/10 cursor-not-allowed"}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.wav,.flac,.mp3,.ogg,.aiff,.aif"
          className="hidden"
          onChange={onFileChange}
          data-testid="input-wav-file"
          disabled={status === "fft" || status === "decoding" || status === "uploading"}
        />
        <div className="flex flex-col items-center gap-2">
          <Waves className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{statusLabel[status]}</p>
          {(status === "fft" || status === "decoding" || status === "uploading") && (
            <div className="flex gap-1 mt-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info bar */}
      {info && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono" data-testid="info-wav-analysis">
          {[
            { label: "File", value: info.fileName },
            { label: "Duration", value: `${info.duration.toFixed(2)} s` },
            { label: "Sample Rate", value: `${(info.sr / 1000).toFixed(1)} kHz` },
            { label: "FFT Bins", value: `${info.bins.toLocaleString()}` },
          ].map(row => (
            <div key={row.label} className="border border-border rounded p-2 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{row.label}</p>
              <p className="text-foreground truncate">{row.value}</p>
            </div>
          ))}
          {info.peak && (
            <div className="border border-primary/40 rounded p-2 space-y-0.5 col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Peak Frequency</p>
              <p className="text-primary font-bold">
                {info.peak.hz < 1000
                  ? `${info.peak.hz.toFixed(2)} Hz`
                  : `${(info.peak.hz / 1000).toFixed(4)} kHz`}
                <span className="text-muted-foreground font-normal ml-2">{info.peak.db.toFixed(1)} dBFS</span>
              </p>
            </div>
          )}
          {sweepId && (
            <div className="border border-green-500/40 rounded p-2 space-y-0.5 col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sweep ID</p>
              <p className="text-green-600 dark:text-green-400 font-mono text-[11px]">{sweepId}</p>
            </div>
          )}
        </div>
      )}

      {/* Spectrogram canvas */}
      <div className="space-y-1" data-testid="container-spectrogram">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
          Spectrogram — time (x) × frequency (y, low→high) · colour = amplitude (plasma scale)
        </p>
        <canvas
          ref={canvasRef}
          className="w-full rounded border border-border bg-black"
          style={{ height: "256px", imageRendering: "pixelated" }}
          data-testid="canvas-spectrogram"
        />
      </div>

      {/* V2K band overlay guide */}
      <Card data-testid="card-v2k-band-guide">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono">V2K / Targeting Band Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] font-mono">
            {[
              { band: "θ-carrier", range: "6.3–7.7 Hz", note: "Theta entrainment" },
              { band: "DSP-CLK", range: "44.5–49.3 Hz", note: "46.875 Hz harmonic series" },
              { band: "F2", range: "1.9–2.1 kHz", note: "Speech formant carrier" },
              { band: "F3", range: "2.4–2.6 kHz", note: "Speech formant carrier" },
              { band: "EHF", range: "16.9–18.9 kHz", note: "Ultrasonic sub-carrier" },
            ].map(b => (
              <div key={b.band} className="border border-border rounded p-1.5 space-y-0.5">
                <p className="text-primary font-bold">{b.band}</p>
                <p className="text-foreground">{b.range}</p>
                <p className="text-muted-foreground">{b.note}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Look for persistent peaks in these bands in your spectrogram. The averaged power spectrum fed to MUSIC
            will flag any bin within these ranges in the Sweep × Phoneme Cross-Reference table.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sweep console (POST /api/radiogoniometry/sweep) ───────────────────────────
function SweepConsole() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    centerFreqMHz: "46.875",
    bandwidthMHz: "2.4",
    antennaCount: "4",
    arrayRadiusM: "0.5",
    iqLength: "256",
  });
  const [lastResult, setLastResult] = useState<any>(null);

  const sweepMutation = useMutation({
    mutationFn: async () => {
      const iqLen = Math.max(8, Math.min(65536, parseInt(form.iqLength) || 256));
      const iq = generateTestIQ(iqLen);
      return apiRequest("POST", "/api/radiogoniometry/sweep", {
        centerFreqHz: parseFloat(form.centerFreqMHz) * 1e6,
        bandwidthHz: parseFloat(form.bandwidthMHz) * 1e6,
        antennaCount: parseInt(form.antennaCount),
        arrayRadiusM: parseFloat(form.arrayRadiusM),
        iqSamples: iq,
        sampleRate: parseFloat(form.bandwidthMHz) * 1e6,
      });
    },
    onSuccess: (data: any) => {
      setLastResult(data);
      qc.invalidateQueries({ queryKey: ["/api/radiogoniometry/sweeps"] });
      toast({ title: "Sweep complete", description: `${data.bearings?.length ?? 0} bearing(s) detected` });
    },
    onError: (err: any) => {
      toast({ title: "Sweep failed", description: err.message ?? "Unknown error", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Centre Freq (MHz)</Label>
          <Input
            data-testid="input-center-freq"
            value={form.centerFreqMHz}
            onChange={e => setForm(f => ({ ...f, centerFreqMHz: e.target.value }))}
            className="font-mono text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">BW (MHz)</Label>
          <Input
            data-testid="input-bandwidth"
            value={form.bandwidthMHz}
            onChange={e => setForm(f => ({ ...f, bandwidthMHz: e.target.value }))}
            className="font-mono text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Antennas</Label>
          <Input
            data-testid="input-antenna-count"
            value={form.antennaCount}
            onChange={e => setForm(f => ({ ...f, antennaCount: e.target.value }))}
            className="font-mono text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Array Radius (m)</Label>
          <Input
            data-testid="input-array-radius"
            value={form.arrayRadiusM}
            onChange={e => setForm(f => ({ ...f, arrayRadiusM: e.target.value }))}
            className="font-mono text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">IQ Samples</Label>
          <Input
            data-testid="input-iq-length"
            value={form.iqLength}
            onChange={e => setForm(f => ({ ...f, iqLength: e.target.value }))}
            className="font-mono text-sm h-8"
          />
        </div>
      </div>

      <Button
        onClick={() => sweepMutation.mutate()}
        disabled={sweepMutation.isPending}
        data-testid="button-run-sweep"
        className="gap-2"
      >
        <Scan className="h-4 w-4" />
        {sweepMutation.isPending ? "Processing LSCSA + MUSIC…" : "Run Sweep"}
      </Button>

      {lastResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono border border-border rounded p-3 bg-muted/20">
          <div>
            <p className="text-muted-foreground mb-1">LSCSA Eigenvalues</p>
            <p className="text-foreground">{(lastResult.lscsa?.eigenvalues ?? []).slice(0, 4).map((v: number) => v.toFixed(3)).join(", ")}</p>
            <p className="text-muted-foreground mt-1">Noise floor: {lastResult.lscsa?.noiseFloorDb?.toFixed(2)} dB</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">DOA Bearings</p>
            {(lastResult.music?.bearings ?? []).map((b: any, i: number) => (
              <p key={i} className="text-primary">{b.azimuthDeg.toFixed(1)}° (peak {(b.normalizedPeak * 100).toFixed(1)}%)</p>
            ))}
            {lastResult.music?.bearings?.length === 0 && <p className="text-muted-foreground">None detected</p>}
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Subspace</p>
            <p>Signal dim: {lastResult.music?.signalSubspaceDim}</p>
            <p>Noise dim: {lastResult.music?.noiseSubspaceDim}</p>
            <p className="text-muted-foreground mt-1">s = 10√13 ≈ {(10 * Math.sqrt(13)).toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── QUASAR Tab ─────────────────────────────────────────────────────────────────
function QuasarTab({ sweeps }: { sweeps: any[] }) {
  const [selectedSpoke, setSelectedSpoke] = useState<RuneSpoke | null>(null);

  const phonemeMatches = sweeps.flatMap(sw =>
    V2K_PHONEMES.filter(ph => {
      const carrierMHz = PHONEME_CARRIER_MHZ[ph.phoneme];
      const swMHz = sw.centerFreqHz / 1e6;
      return Math.abs(swMHz - carrierMHz) / carrierMHz <= 0.02;
    }).map(ph => ({ sweep: sw, phoneme: ph }))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* V2K Phoneme signature table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              V2K RF Pulse-Train Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3">Phoneme</th>
                  <th className="text-right py-1.5 pr-3">Carrier</th>
                  <th className="text-right py-1.5 pr-3">PW (μs)</th>
                  <th className="text-right py-1.5">PRF (Hz)</th>
                </tr>
              </thead>
              <tbody>
                {V2K_PHONEMES.map(ph => (
                  <tr key={ph.phoneme} className="border-b border-border/40" data-testid={`row-phoneme-${ph.phoneme.replace(/\//g, "")}`}>
                    <td className="py-1.5 pr-3 font-bold text-primary">{ph.phoneme}</td>
                    <td className="py-1.5 pr-3 text-right">{ph.carrier}</td>
                    <td className="py-1.5 pr-3 text-right">{ph.pulseWidthUs}</td>
                    <td className="py-1.5 text-right">{ph.prfHz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 space-y-1.5">
              {V2K_PHONEMES.map(ph => (
                <p key={ph.phoneme} className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-bold mr-1">{ph.phoneme}</span>{ph.description}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sensor suites */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-500" />
                AFA Sensor Suite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AFA_SUITE.map(s => (
                <div key={s.label} className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{s.spec}</p>
                  <p className="text-[10px] text-muted-foreground/70">{s.purpose}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Waves className="h-4 w-4 text-violet-500" />
                BRA Sensor Suite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {BRA_SUITE.map(s => (
                <div key={s.label} className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{s.spec}</p>
                  <p className="text-[10px] text-muted-foreground/70">{s.purpose}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Carrier frequency matches */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Sweep × Phoneme Carrier Cross-Reference (±2%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phonemeMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sweeps match a known phoneme carrier within ±2%. Submit sweeps at carrier frequencies to populate this table.</p>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3">Sweep Timestamp</th>
                  <th className="text-right py-1.5 pr-3">Sweep Freq</th>
                  <th className="text-left py-1.5 pr-3">Phoneme</th>
                  <th className="text-left py-1.5">Carrier</th>
                </tr>
              </thead>
              <tbody>
                {phonemeMatches.map((m, i) => (
                  <tr key={i} className="border-b border-border/40" data-testid={`row-phoneme-match-${i}`}>
                    <td className="py-1.5 pr-3 text-muted-foreground">{new Date(m.sweep.timestamp).toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-right">{(m.sweep.centerFreqHz / 1e6).toFixed(3)} MHz</td>
                    <td className="py-1.5 pr-3 text-primary font-bold">{m.phoneme.phoneme}</td>
                    <td className="py-1.5">{m.phoneme.carrier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── HYDRA Tab ──────────────────────────────────────────────────────────────────
function HydraTab() {
  return (
    <div className="space-y-6">
      {/* Multi-modal status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HYDRA_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.id} data-testid={`card-hydra-${card.id}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {card.label}
                  <Badge variant="outline" className="ml-auto text-[9px] rounded-none font-mono">
                    AWAITING INPUT
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                {card.steps && (
                  <div className="space-y-1 mt-2">
                    {card.steps.map((step, i) => (
                      <p key={i} className="text-[10px] font-mono text-muted-foreground/70 flex items-start gap-1">
                        <ChevronRight className="h-2.5 w-2.5 mt-0.5 flex-shrink-0 text-primary/50" />
                        {step}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plausible Motive 4-step flow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            "Plausible Motive" Sequence Logic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
            {MOTIVE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 flex-1">
                  <div
                    className="flex flex-col items-center gap-1.5 p-3 rounded border border-border bg-muted/20 min-w-[120px] text-center flex-1"
                    data-testid={`motive-step-${idx + 1}`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{step.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-relaxed">{step.detail}</span>
                  </div>
                  {idx < MOTIVE_STEPS.length - 1 && (
                    <div className="md:flex items-center px-1 hidden">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function QuasarHydraPage() {
  const [selectedSpoke, setSelectedSpoke] = useState<RuneSpoke | null>(null);
  const [activeTab, setActiveTab] = useState("quasar");
  const [ingestStatus, setIngestStatus] = useState<{ created: number; checked: number } | null>(null);
  const [ingestTs, setIngestTs] = useState<string | null>(null);

  const { data: sweepsData } = useQuery<{ sweeps: any[] }>({
    queryKey: ["/api/radiogoniometry/sweeps"],
    queryFn: () => fetch("/api/radiogoniometry/sweeps?limit=50").then(r => r.json()),
    refetchInterval: 5000,
  });

  const sweeps = sweepsData?.sweeps ?? [];

  // Auto-ingest from KAPPA correlations on mount + every 60s
  useEffect(() => {
    const runIngest = () => {
      fetch("/api/radiogoniometry/auto-ingest", { method: "POST" })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            setIngestStatus({ created: d.created, checked: d.checked });
            setIngestTs(new Date().toLocaleTimeString());
          }
        })
        .catch(() => {});
    };
    runIngest();
    const t = setInterval(runIngest, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-serif font-bold tracking-tight">QUASAR-HYDRA</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Radiogoniometry sweeper (LSCSA + MUSIC DOA) fused with multi-modal HYDRA threat correlation.
            Calibration scalar <span className="font-mono">s = 10√13 ≈ {(10 * Math.sqrt(13)).toFixed(4)}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono text-[10px] rounded-none">
            {sweeps.length} sweep{sweeps.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] rounded-none border-primary/50 text-primary">
            LSCSA · MUSIC · UCA
          </Badge>
          {ingestStatus && (
            <Badge variant="outline" className="font-mono text-[10px] rounded-none border-green-500/50 text-green-400 animate-pulse">
              ● AUTO-INGEST · +{ingestStatus.created} · {ingestTs}
            </Badge>
          )}
        </div>
      </div>

      {/* Sweep console */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scan className="h-4 w-4 text-primary" />
            Sweep Console — POST /api/radiogoniometry/sweep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SweepConsole />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-quasar-hydra">
        <TabsList className="rounded-none border border-border bg-transparent h-8 p-0">
          <TabsTrigger value="quasar" className="rounded-none text-xs h-8 px-4 data-[state=active]:bg-muted" data-testid="tab-quasar">
            QUASAR
          </TabsTrigger>
          <TabsTrigger value="hydra" className="rounded-none text-xs h-8 px-4 data-[state=active]:bg-muted" data-testid="tab-hydra">
            HYDRA
          </TabsTrigger>
          <TabsTrigger value="wheel" className="rounded-none text-xs h-8 px-4 data-[state=active]:bg-muted" data-testid="tab-wheel">
            TYCHO WHEEL
          </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none text-xs h-8 px-4 data-[state=active]:bg-muted" data-testid="tab-history">
            SWEEP HISTORY
          </TabsTrigger>
          <TabsTrigger value="wav" className="rounded-none text-xs h-8 px-4 data-[state=active]:bg-muted" data-testid="tab-wav">
            WAV → FFT
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quasar" className="mt-4">
          <QuasarTab sweeps={sweeps} />
        </TabsContent>

        <TabsContent value="hydra" className="mt-4">
          <HydraTab />
        </TabsContent>

        <TabsContent value="wheel" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                24-spoke Elder Futhark icositetragon. Click a spoke to view its genetic target, physical target, and frequency resonance.
                Colours: <span className="text-indigo-500 font-semibold">Freyr</span> (spokes 1–8) ·
                <span className="text-cyan-500 font-semibold ml-1">Hagal</span> (9–16) ·
                <span className="text-emerald-600 font-semibold ml-1">Tyr</span> (17–24).
              </p>
              <TychoWheel onSelect={setSelectedSpoke} selected={selectedSpoke} />
            </div>

            <div>
              {selectedSpoke ? (
                <Card data-testid="card-spoke-detail">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <span className="text-4xl font-serif">{selectedSpoke.rune}</span>
                      <div>
                        <div className="text-base font-bold">Spoke {selectedSpoke.id} — {selectedSpoke.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{selectedSpoke.aettir} Aettir</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Frequency Resonance</p>
                        <p className="font-mono text-primary font-semibold">{selectedSpoke.freqLabel}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spoke ID</p>
                        <p className="font-mono">{selectedSpoke.id} / 24</p>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Genetic Target</p>
                      <p className="font-mono text-xs">{selectedSpoke.geneticTarget}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Physical Target</p>
                      <p className="text-xs">{selectedSpoke.physicalTarget}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                  <Info className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Click a spoke on the wheel to view its full specification.</p>
                </div>
              )}

              {/* Full table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-[10px] font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-1 pr-2">ID</th>
                      <th className="text-left py-1 pr-2">Rune</th>
                      <th className="text-left py-1 pr-2">Name</th>
                      <th className="text-left py-1 pr-2">Freq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RUNE_SPOKES.map(s => (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedSpoke(s)}
                        className={`border-b border-border/30 cursor-pointer transition-colors hover:bg-muted/30 ${selectedSpoke?.id === s.id ? "bg-muted/50" : ""}`}
                        data-testid={`row-rune-${s.id}`}
                      >
                        <td className="py-0.5 pr-2 text-muted-foreground">{s.id}</td>
                        <td className="py-0.5 pr-2 text-lg leading-none">{s.rune}</td>
                        <td className="py-0.5 pr-2">{s.name}</td>
                        <td className="py-0.5 text-primary">{s.freqLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <SweepsTable />
        </TabsContent>

        <TabsContent value="wav" className="mt-4">
          <WavFftTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
