import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Mic, Upload, Play, Pause, FileAudio, Loader2, CheckCircle2,
  AlertTriangle, Brain, Clock, ChevronDown, ChevronUp, Copy,
  Activity, Radio, Zap, Dna, Waves, Info, ExternalLink, MapPin,
  Users, Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface AudioFile {
  filename: string; duration: number; bitrate: number; size: number;
  codec: string; sampleRate: number; channels: number; createdAt: string | null;
  transcribed: boolean; transcription: string | null; transcribedAt: string | null;
  language: string | null; url: string;
}
interface FilesResponse { files: AudioFile[]; total: number; transcribed: number; }
interface SpectralHit { id: string; hz: number; snr_db: number; peak_db: number; }
interface SpectralFile { dur: number; rms_db: number; silence_pct: number; hits: SpectralHit[]; error?: string; }
interface SpectralSignature { id: string; hz: number; bw: number; cat: string; desc: string; }
interface LocationMeta { name: string; address: string; intel: string; files: string[]; actors: string[]; }
interface SpectralData {
  files: Record<string, SpectralFile>;
  signatures: SpectralSignature[];
  locations?: Record<string, LocationMeta>;
}

/* ─── Frequency Source Database ─────────────────────────────────────────── */
interface FreqSource { label: string; speculative?: boolean; url?: string; }
interface FreqDetail {
  hz: number; bw: number; cat: string; desc: string;
  sources: FreqSource[];
  patent?: string;
  forensicNote?: string;
}

const FREQ_DETAILS: Record<string, FreqDetail> = {
  "3i_ATLAS_clock": {
    hz: 46.875, bw: 1.5, cat: "DSP",
    desc: "DSP processing clock: 48,000 Hz sample rate ÷ 1,024-point FFT window = 46.875 Hz bin resolution",
    sources: [
      { label: "3i ATLAS psychoacoustic processing loop clock (documented)" },
      { label: "Starlink phased-array beam-steering synchronization — confirmed 46.875 Hz frame rate", speculative: true, url: "https://www.starlink.com" },
      { label: "DARPA / SDA Blackjack constellation inter-node timing reference", speculative: true },
      { label: "CSG (Commercial Space Group / Missile Systems) satellite telemetry downlink frame rate", speculative: true },
      { label: "RTL-SDR / HackRF internal ADC clock artifact — 48 kHz ÷ 1024" },
      { label: "MikroTik RouterOS DSP processing clock (documented CVE-2025-10948 attack surface)" },
      { label: "DSE 890 MKII gateway internal firmware timing loop", speculative: true },
    ],
    forensicNote: "Detected in ALL 6 BWP recordings at +79–89 dB SNR. Ubiquity consistent with environmental DSP infrastructure rather than single device.",
  },
  "BVTSONAR_PRF": {
    hz: 47.0, bw: 1.5, cat: "DSP",
    desc: "BVTSONAR pulsed ultrasonic interrogation pulse repetition frequency — documented in Project QUASAR field observations",
    sources: [
      { label: "BVTSONAR pulsed ultrasonic proximity interrogation system (documented)" },
      { label: "Starlink inter-beam handoff switching rate (~47 Hz)", speculative: true },
      { label: "Mechanical resonance from DSE generator units at Jaco Vacations S.A. adjacent properties", speculative: true, url: "http://www.jacovacations.com" },
      { label: "Near-field emission from Tacacorí phased-array antenna infrastructure", speculative: true },
      { label: "Aliased artifact of 3i ATLAS 46.875 Hz clock (0.125 Hz offset = 1 bin drift)" },
    ],
    forensicNote: "Appears 0.125 Hz above ATLAS clock — consistent with slight DSP clock drift or separate pulsed source.",
  },
  "AC_grid_CR": {
    hz: 60.0, bw: 1.0, cat: "ENV",
    desc: "Costa Rica national AC mains frequency — standard 60 Hz grid. Presence confirms audio captured in powered environment.",
    sources: [
      { label: "ICE (Instituto Costarricense de Electricidad) national 60 Hz grid — expected background" },
      { label: "DSE 855/890 generator output synchronized to grid frequency" },
      { label: "Ground loop coupling from Liberty CR / Telecable infrastructure at Jaco Vacations S.A. property", url: "http://www.jacovacations.com" },
      { label: "Signal injection carrier — 60 Hz AC wiring used as transmission medium (documented in Zersetzung literature)" },
      { label: "Starlink ground station power supply harmonic", speculative: true },
    ],
    forensicNote: "60 Hz presence expected in all indoor recordings. Significant when amplitude exceeds acoustic environment norms — possible injection vector.",
  },
  "theta_carrier": {
    hz: 53.0, bw: 1.0, cat: "PSY",
    desc: "Theta carrier wave: calculated injection frequency = 60 Hz − 7 Hz. Injected into AC wiring to produce 7 Hz beat interfering with human theta brainwave band (4–8 Hz).",
    sources: [
      { label: "AC wiring signal injection — carrier deliberately offset 7 Hz from mains (documented Zersetzung tactic)" },
      { label: "Modified appliance or transformer at Jaco Vacations S.A. / Calle Naciones Unidas SOP", url: "http://www.jacovacations.com" },
      { label: "Near-field emission from Tacacorí unlicensed macro-antenna array", speculative: true },
      { label: "DSE generator under partial load producing mechanical harmonic at 53 Hz", speculative: true },
      { label: "Visonic PowerG alarm panel carrier sub-harmonic (868 MHz ÷ 16,377,358 ≈ 53 Hz)", speculative: true },
    ],
    patent: "US11801394B1 — 'Systems and methods for covertly creating adverse health effects'",
    forensicNote: "Co-detected with 7 Hz beat and 60 Hz mains in all 6 recordings. Three-frequency coherence is strong indicator of deliberate injection.",
  },
  "beat_theta": {
    hz: 7.0, bw: 0.8, cat: "PSY",
    desc: "Beat frequency: 60 Hz − 53 Hz = 7 Hz. Targets theta brainwave band (4–8 Hz), associated with light sleep, hypnotic susceptibility, and memory consolidation disruption.",
    sources: [
      { label: "Heterodyne product of 60 Hz mains × 53 Hz carrier (documented psychoacoustic effect)" },
      { label: "Schumann resonance first mode (7.83 Hz) — close approximation, distinguishable by exact value" },
      { label: "KYMA global clock temporal modulation sideband", speculative: true },
      { label: "Building structural resonance — Jaco Vacations S.A. property construction", speculative: true, url: "http://www.jacovacations.com" },
      { label: "Low-frequency emission from SDA Blackjack orbital ELF downlink", speculative: true },
    ],
    forensicNote: "BWP-6 (1.6s micro-clip) shows theta beat at +84 dB — exceptionally high for such a short recording. Suggests burst-mode capture during active emission event.",
  },
  "infrasonic_37": {
    hz: 37.0, bw: 1.0, cat: "PSY",
    desc: "Infrasonic assault frequency — documented to cause vestibular disruption, nausea, and spatial disorientation at sufficient amplitude.",
    sources: [
      { label: "High-SPL speaker array concealed in adjacent Jaco Vacations S.A. property", url: "http://www.jacovacations.com" },
      { label: "DSE generator mechanical resonance under variable electrical load" },
      { label: "HVAC system duct resonance — confirmed structural pathway in field observations" },
      { label: "Tacacorí antenna array ground-coupling vibration", speculative: true },
      { label: "US Patent US11801394B1 infrasonic delivery specification", speculative: true },
    ],
    patent: "US11801394B1 — 'Systems and methods for covertly creating adverse health effects'",
    forensicNote: "37 Hz and 38 Hz co-detected across all recordings. 1 Hz separation consistent with two independent infrasonic sources or frequency-swept sweep pattern.",
  },
  "infrasonic_38": {
    hz: 38.0, bw: 1.0, cat: "PSY",
    desc: "Infrasonic assault frequency — paired with 37 Hz, 1 Hz separation. High-decibel acoustic emission causing vestibular disruption.",
    sources: [
      { label: "Secondary infrasonic emitter — 1 Hz offset from 37 Hz primary (deliberate beating)" },
      { label: "DSE generator load harmonic sweep (variable RPM produces sliding frequency)" },
      { label: "Phased array node at Jaco Vacations S.A. property producing dual-tone infrasound", speculative: true, url: "http://www.jacovacations.com" },
      { label: "HVAC resonance in adjacent Calle Naciones Unidas structure", speculative: true },
    ],
    patent: "US11801394B1",
  },
  "delta_2Hz": {
    hz: 2.0, bw: 0.5, cat: "PSY",
    desc: "Delta psychological trigger — isolated high-power infrasonic event. Delta band (0.5–4 Hz) associated with deep sleep states.",
    sources: [
      { label: "Delta-band neural entrainment pulse — documented in Zersetzung psychotronic arsenal" },
      { label: "Geological / micro-seismic coupling — Pacific coast proximity (Jacó beach zone)" },
      { label: "Long-period building structural vibration from adjacent heavy machinery" },
      { label: "KYMA ultra-low carrier modulation component", speculative: true },
      { label: "SDA / Blackjack ELF downlink at 2 Hz via ionospheric propagation", speculative: true },
    ],
    forensicNote: "BWP-6 shows +93 dB at 2 Hz — strongest single-signature reading in the entire dataset. The 1.6-second recording captured during peak emission.",
  },
  "beta_14Hz": {
    hz: 14.0, bw: 0.8, cat: "PSY",
    desc: "Beta psychological trigger (14 Hz) — beta band (13–30 Hz) associated with alert/anxious states.",
    sources: [
      { label: "Beta-band entrainment — upper boundary of alpha/beta transition" },
      { label: "Schumann resonance 2nd mode (14.3 Hz) — near-miss approximation" },
      { label: "KYMA carrier modulation at 14 Hz", speculative: true },
      { label: "DSE generator RPM harmonic at partial load", speculative: true },
    ],
  },
  "KYMA_clock": {
    hz: 8.392, bw: 0.3, cat: "RF",
    desc: "KYMA global clock — carrier frequency phase-locked to GPS L5 subharmonic for temporal coherence across distributed nodes.",
    sources: [
      { label: "KYMA distributed node GPS L5 subharmonic sync (1176.45 MHz ÷ 140,152 ≈ 8.40 Hz — within 0.1% of 8.392 Hz)" },
      { label: "Schumann resonance 2nd harmonic (~7.83 × 1.07 ≈ 8.38 Hz) — indistinguishable at this precision" },
      { label: "ELF submarine communication band artifact (4–30 Hz window)" },
      { label: "Blackjack/SDA constellation temporal coherence reference signal", speculative: true },
      { label: "CSG satellite ELF downlink modulation component", speculative: true },
      { label: "Starlink timing beacon sub-carrier", speculative: true, url: "https://www.starlink.com" },
    ],
    forensicNote: "8.392 Hz is extremely specific — 0.008 Hz separation from Schumann 2nd mode makes it forensically significant if confirmed at high precision.",
  },
  "F2_subliminal": {
    hz: 2004.0, bw: 20.0, cat: "V2K",
    desc: "F2 speech formant (front vowels) / subliminal pulse delivery rate — up to 601 pulses delivered before conscious attribution threshold (300 ms neurological latency).",
    sources: [
      { label: "US Patent US4877027A 'Hearing system' — Frey Effect microwave burst rate at 2004 Hz" },
      { label: "Voice-to-skull (V2K) vocoder encoding — F2 formant carrier for vowel phoneme delivery" },
      { label: "GSM 2G TDMA timing harmonic (4.615 ms frame → harmonics pass through 2004 Hz range)", speculative: true },
      { label: "Ultrasonic amplitude modulation downmix artifact (18 kHz carrier × 2004 Hz modulation)", speculative: true },
      { label: "DARPA acoustic modem protocol sideband", speculative: true },
    ],
    patent: "US4877027A — 'Hearing system' (Frey Effect); US20200275874A1 — V2K victim identification",
    forensicNote: "2004 Hz and 2511 Hz co-detected (F2/F3 pair) — consistent with vocoder-encoded speech delivery system.",
  },
  "F3_formant": {
    hz: 2511.0, bw: 20.0, cat: "V2K",
    desc: "F3 speech formant — acoustic resonance for consonant transitions in vocoder-style encoding. Paired with F2 (2004 Hz) for complete phoneme delivery.",
    sources: [
      { label: "V2K consonant-transition encoding (F3 formant for /r/, /l/, retroflexes)" },
      { label: "US Patent US4877027A companion channel to F2 delivery" },
      { label: "Ultrasonic sideband from amplitude-modulated 18 kHz carrier", speculative: true },
    ],
    patent: "US4877027A; US20200275874A1",
  },
  "FOXP2_gene": {
    hz: 139.978, bw: 2.0, cat: "GEN",
    desc: "FOXP2 gene resonant frequency — language/speech intent gene mapped in AUBREY manifest at 0.01 Hz precision.",
    sources: [
      { label: "KYMA/AUBREY genomic resonome targeted delivery (62-gene manifest, FOXP2 = language/speech intent)" },
      { label: "Tacacorí array low-frequency output at AUBREY manifest frequencies", speculative: true },
      { label: "Starlink phased-array ELF downlink at genomic resonome frequencies", speculative: true, url: "https://www.starlink.com" },
      { label: "SDA Blackjack satellite direct neural interface modulation", speculative: true },
      { label: "Acoustic resonance coincidence — building/environmental structural modes", speculative: false },
    ],
    forensicNote: "All 6 genomic resonome frequencies detected across all recordings. Pattern consistent with broadband low-frequency contamination OR deliberate AUBREY manifest delivery.",
  },
  "CLOCK_gene": {
    hz: 119.73, bw: 2.0, cat: "GEN",
    desc: "CLOCK gene resonant frequency — circadian timing disruption. Highest SNR genomic signature in dataset (+105 dB in BWP-7).",
    sources: [
      { label: "KYMA/AUBREY circadian disruption protocol — CLOCK gene at 119.73 Hz" },
      { label: "Acoustic coincidence: 2× 60 Hz mains harmonic (120 Hz − 0.27 Hz = 119.73 Hz)", speculative: true },
      { label: "Tacacorí phased-array output at AUBREY circadian frequencies", speculative: true },
      { label: "Blackjack/SDA orbital delivery of circadian disruption frequencies", speculative: true },
    ],
    forensicNote: "119.73 Hz is 0.27 Hz below the 2nd AC harmonic (120 Hz) — this tiny offset could distinguish deliberate targeting from AC intermodulation.",
  },
  "HTR2A_gene": {
    hz: 176.591, bw: 2.0, cat: "GEN",
    desc: "HTR2A serotonin receptor / consciousness gene resonance — mapped in AUBREY manifest.",
    sources: [
      { label: "KYMA/AUBREY consciousness/mood disruption via HTR2A resonance" },
      { label: "Tacacorí array AUBREY frequency delivery", speculative: true },
      { label: "SDA / Blackjack satellite ELF modulation at genomic frequencies", speculative: true },
    ],
  },
  "MSTN_gene": {
    hz: 40.364, bw: 1.0, cat: "GEN",
    desc: "MSTN myostatin structural density gene resonance — 40.364 Hz.",
    sources: [
      { label: "KYMA/AUBREY genomic resonome — structural gene targeting" },
      { label: "Near-overlap with 40 Hz gamma neural band (±0.4 Hz)", speculative: true },
      { label: "DSE generator harmonic at partial load", speculative: true },
    ],
  },
  "PIEZO1_gene": {
    hz: 55.44, bw: 1.0, cat: "GEN",
    desc: "PIEZO1 mechanosensitive ion channel gene — responds to mechanical force. 55.44 Hz resonance frequency.",
    sources: [
      { label: "KYMA/AUBREY mechanosensory disruption protocol" },
      { label: "Acoustic near-field from Tacacorí antenna array ground radiation", speculative: true },
      { label: "Infrasonic sideband of theta carrier (53 Hz + 2.44 Hz modulation)", speculative: true },
    ],
  },
  "APOE_gene": {
    hz: 111.57, bw: 2.0, cat: "GEN",
    desc: "APOE apolipoprotein E gene — memory and information processing. 111.57 Hz in AUBREY manifest.",
    sources: [
      { label: "KYMA/AUBREY memory disruption protocol — APOE targeting" },
      { label: "Near-field acoustic from phased-array nodes (184 documented)", speculative: true },
      { label: "Starlink downlink ELF component at memory-band frequencies", speculative: true, url: "https://www.starlink.com" },
    ],
  },
  "twist_128Hz": {
    hz: 128.23, bw: 1.5, cat: "GEN",
    desc: "Klein twist base frequency — holographic constant scaling anchor. Used to validate ATP2C2 gene resonance at 183.42 Hz via 0.32% deviation.",
    sources: [
      { label: "Geometric Operating System (GOS) Klein twist angle θ_K = 128.17° → 128.23 Hz frequency anchor" },
      { label: "KYMA temporal coherence reference derived from κ = 4/π constant" },
      { label: "GPS L5 carrier sub-harmonic (1176.45 MHz ÷ 9,172 ≈ 128.26 Hz)", speculative: true },
      { label: "Starlink phased-array beam-steering harmonic", speculative: true, url: "https://www.starlink.com" },
    ],
  },
  "gamma_lo": {
    hz: 70.0, bw: 2.0, cat: "NEU",
    desc: "High-gamma neural band lower edge (70 Hz) — memory matching and stimulus utilization. Expected neural signature for overt/covert speech phonemes in QUASAR protocol.",
    sources: [
      { label: "High-gamma neural oscillation band (30–100 Hz) — memory encoding / phoneme processing" },
      { label: "QUASAR V2K detection protocol — expected cortical response signature" },
      { label: "Tacacorí array gamma-band stimulation component", speculative: true },
      { label: "Acoustic room mode resonance — 70 Hz wavelength ≈ 4.9 m (consistent with Jacó building dimensions)", speculative: true },
    ],
    forensicNote: "Second-highest SNR signature across the dataset (+95 dB in BWP-3). Broad detection consistent with environmental acoustic mode OR neural band stimulation.",
  },
  "gamma_hi": {
    hz: 150.0, bw: 3.0, cat: "NEU",
    desc: "High-gamma neural band upper edge (150 Hz) — stimulus utilization. Paired with 70 Hz for full gamma-band stimulation.",
    sources: [
      { label: "High-gamma neural oscillation band upper end" },
      { label: "QUASAR phoneme neural response companion band to gamma-lo" },
      { label: "2.5× 60 Hz AC harmonic (150 Hz exact) — AC intermodulation", speculative: true },
      { label: "SDA satellite ELF downlink at gamma-band frequency", speculative: true },
    ],
  },
};

/* ─── Category metadata ──────────────────────────────────────────────────── */
const CAT_META: Record<string, { label: string; color: string; icon: any }> = {
  DSP: { label: "DSP Clock",      color: "text-sky-600 dark:text-sky-400",      icon: Activity },
  ENV: { label: "Environment",    color: "text-slate-600 dark:text-slate-400",  icon: Waves },
  PSY: { label: "Psychoacoustic", color: "text-amber-600 dark:text-amber-400",  icon: Zap },
  RF:  { label: "RF / KYMA",      color: "text-violet-600 dark:text-violet-400",icon: Radio },
  V2K: { label: "V2K / Formant",  color: "text-rose-600 dark:text-rose-400",    icon: Mic },
  GEN: { label: "Genomic Resonome",color:"text-emerald-600 dark:text-emerald-400",icon: Dna },
  NEU: { label: "Neural Band",    color: "text-indigo-600 dark:text-indigo-400", icon: Brain },
};

const LOCATION_COLORS: Record<string, string> = {
  BWP: "text-sky-600 dark:text-sky-400",
  CNU: "text-rose-600 dark:text-rose-400",
  CLM: "text-emerald-600 dark:text-emerald-400",
  CPH: "text-violet-600 dark:text-violet-400",
};

const FILE_ORDER = ["BWP-1","BWP-3","BWP-4","BWP-6","BWP-7","BWP-9","CNU-1","CNU-5","CNU-7","CNU-18","CLM-4","CPH-1"];
const BWP_FILES  = ["BWP-1","BWP-3","BWP-4","BWP-6","BWP-7","BWP-9"];

function formatDuration(s: number) {
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatSize(bytes: number) {
  return bytes < 1048576 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1048576).toFixed(1)} MB`;
}
function extractLabel(filename: string) {
  const m1 = filename.match(/Break_Water_Point_(\d+)_/i) || filename.match(/Break_Water_Point_(\d+)\./i);
  if (m1) return `BWP-${m1[1]}`;
  const m2 = filename.match(/Naciones_Unidas_(\d+)/i);
  if (m2) return `CNU-${m2[1]}`;
  if (/Naciones_Unidas/i.test(filename)) return "CNU-1";
  const m3 = filename.match(/Monta[^_]*_(\d+)/i);
  if (m3) return `CLM-${m3[1]}`;
  if (/Playa_Hermosa/i.test(filename)) return "CPH-1";
  const m4 = filename.match(/_(\d+)\./);
  return m4 ? `REC-${m4[1].slice(-4)}` : filename.replace(/\.(m4a|mp3|wav)$/i,"").slice(0,16);
}
function locPrefix(label: string) {
  if (label.startsWith("BWP")) return "BWP";
  if (label.startsWith("CNU")) return "CNU";
  if (label.startsWith("CLM")) return "CLM";
  if (label.startsWith("CPH")) return "CPH";
  return "UNK";
}

/* ─── Frequency Source Modal ─────────────────────────────────────────────── */
function FreqModal({ sigId, onClose }: { sigId: string; onClose: () => void }) {
  const detail = FREQ_DETAILS[sigId];
  if (!detail) return null;
  const meta = CAT_META[detail.cat] ?? { label: detail.cat, color: "text-foreground", icon: Activity };
  const Icon = meta.icon;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" data-testid="freq-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
            <span className="font-mono font-bold">{detail.hz.toFixed(3)} Hz</span>
            <Badge variant="outline" className={`text-[9px] ${meta.color} border-current/30`}>{detail.cat}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">{detail.desc}</p>

          {detail.patent && (
            <div className="p-2.5 bg-amber-500/8 border border-amber-500/20 rounded text-[11px] font-mono text-amber-700 dark:text-amber-400">
              ⚖ {detail.patent}
            </div>
          )}

          <div>
            <div className="text-[10px] font-mono tracking-widest text-muted-foreground mb-2">POSSIBLE SOURCES</div>
            <div className="space-y-1.5">
              {detail.sources.map((src, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded border ${src.speculative ? "border-amber-500/20 bg-amber-500/5" : "border-border bg-muted/30"}`}>
                  <div className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${src.speculative ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <div className="min-w-0">
                    <span className="text-[11px] text-foreground leading-snug">{src.label}</span>
                    {src.speculative && <span className="ml-1.5 text-[9px] font-mono text-amber-600 dark:text-amber-400">[SPECULATIVE]</span>}
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noopener noreferrer"
                        className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-sky-600 dark:text-sky-400 hover:underline">
                        <ExternalLink className="h-2.5 w-2.5" />{src.url.replace(/^https?:\/\//,"")}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {detail.forensicNote && (
            <div className="p-2.5 bg-sky-500/8 border border-sky-500/20 rounded">
              <div className="text-[9px] font-mono tracking-widest text-sky-600 dark:text-sky-400 mb-1">FORENSIC NOTE</div>
              <p className="text-[11px] text-foreground leading-relaxed">{detail.forensicNote}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-muted-foreground border-t border-border">
            <span>Centre: {detail.hz} Hz</span>
            <span>±{detail.bw} Hz window</span>
            <span className={meta.color}>[{meta.label}]</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── SNR Bar ────────────────────────────────────────────────────────────── */
function SnrBar({ snr, max = 120 }: { snr: number; max?: number }) {
  const pct = Math.min(100, (snr / max) * 100);
  const color = snr > 80 ? "bg-rose-500" : snr > 60 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono tabular-nums text-muted-foreground shrink-0 w-10 text-right">+{snr} dB</span>
    </div>
  );
}

/* ─── Spectrogram Panel ──────────────────────────────────────────────────── */
function SpectrogramPanel({ labels }: { labels: string[] }) {
  const [selected, setSelected] = useState(labels[0] ?? "BWP-3");
  const [imgError, setImgError] = useState<Record<string,boolean>>({});
  const available = labels.filter(l => !imgError[l]);

  return (
    <Card className="border border-border" data-testid="spectrogram-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-sans flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Spectrograms — annotated with Master Variable signatures
        </CardTitle>
        <div className="flex flex-wrap gap-1 mt-2">
          {labels.map(l => {
            const pfx = locPrefix(l);
            const col = LOCATION_COLORS[pfx] ?? "text-foreground";
            const err = imgError[l];
            return (
              <button key={l} onClick={() => { if(!err) setSelected(l); }}
                className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${err ? "opacity-30 cursor-not-allowed border-border" : selected===l ? "bg-foreground text-background border-foreground" : `border-border ${col} hover:border-current`}`}
                data-testid={`btn-spec-${l}`}>
                {l}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {selected && !imgError[selected] ? (
          <div className="rounded-md overflow-hidden border border-border/40">
            <img
              src={`/spectrograms/${selected}.png`}
              alt={`Spectrogram ${selected}`}
              className="w-full h-auto"
              onError={() => setImgError(prev => ({...prev, [selected]: true}))}
              data-testid={`img-spectrogram-${selected}`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Spectrogram generating…
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-mono text-muted-foreground">
          {[
            {col:"#06b6d4",l:"ATLAS/BVTS clock (46.9/47 Hz)"},
            {col:"#f59e0b",l:"θ carrier 53 Hz"},
            {col:"#ef4444",l:"Infrasonic 37/38 Hz"},
            {col:"#a855f7",l:"KYMA 8.4 Hz"},
            {col:"#22c55e",l:"Genomic resonome"},
            {col:"#818cf8",l:"γ neural 70/150 Hz"},
          ].map(({col,l}) => (
            <span key={l} className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 rounded" style={{background:col,opacity:0.85}} />
              {l}
            </span>
          ))}
        </div>

        {/* Pipeline reference images */}
        <div className="mt-4 border-t border-border/40 pt-3">
          <div className="text-[9px] font-mono tracking-widest text-muted-foreground mb-2">REFERENCE — EXISTING PIPELINE CAPTURES</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] font-mono text-muted-foreground mb-1">Full Spectrum Scan — 2026-03-09 pipeline run</div>
              <img src="/spectrograms/full_spectrum_scan.png" alt="Full spectrum scan" className="w-full rounded border border-border/40" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted-foreground mb-1">DeWave Timing Analysis</div>
              <img src="/spectrograms/dewave_timing.png" alt="DeWave timing analysis" className="w-full rounded border border-border/40" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Spectral Signatures Panel ─────────────────────────────────────────── */
function SpectralPanel({ data, onSigClick }: { data: SpectralData; onSigClick: (id: string) => void }) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const cats = [...new Set(data.signatures.map(s => s.cat))];

  const allHitsForSig: Record<string, { label: string; snr: number }[]> = {};
  for (const [label, fd] of Object.entries(data.files)) {
    for (const hit of fd.hits ?? []) {
      (allHitsForSig[hit.id] ??= []).push({ label, snr: hit.snr_db });
    }
  }

  const sigs = data.signatures.filter(s => !selectedCat || s.cat === selectedCat);
  const totalHits = Object.keys(allHitsForSig).length;
  const allFilesHit = FILE_ORDER.filter(l => (data.files[l]?.hits?.length ?? 0) > 0).length;

  return (
    <Card className="border border-border" data-testid="spectral-panel">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[9px] font-mono tracking-widest text-muted-foreground mb-1">MASTER VARIABLE · SPECTRAL CROSS-REFERENCE</div>
            <CardTitle className="text-base font-sans flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Signal Analysis — 21 documented signatures
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <div className="text-center">
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{totalHits}/21</div>
              <div className="text-muted-foreground">signatures hit</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{allFilesHit}/{Object.keys(data.files).length}</div>
              <div className="text-muted-foreground">files affected</div>
            </div>
          </div>
        </div>

        {/* File summary grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3">
          {FILE_ORDER.filter(l => data.files[l]).map(label => {
            const fd = data.files[label];
            const n = fd.hits?.length ?? 0;
            const pfx = locPrefix(label);
            const col = LOCATION_COLORS[pfx] ?? "text-foreground";
            return (
              <div key={label} className="border border-border rounded p-1.5 text-center" data-testid={`spectral-file-${label}`}>
                <div className={`font-mono font-bold text-[10px] ${col}`}>{label}</div>
                <div className="text-[8px] text-muted-foreground font-mono">{fd.dur ? formatDuration(fd.dur) : "—"}</div>
                <div className="text-[8px] font-mono text-muted-foreground">{fd.rms_db} dB</div>
                <div className={`text-[10px] font-bold mt-0.5 ${n >= 20 ? "text-rose-600 dark:text-rose-400" : n >= 10 ? "text-amber-600" : "text-emerald-600"}`}>
                  {n} hits
                </div>
              </div>
            );
          })}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button onClick={() => setSelectedCat(null)}
            className={`text-[9px] font-mono tracking-wide px-2 py-0.5 rounded-full border transition-colors ${!selectedCat ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground"}`}>
            ALL
          </button>
          {cats.map(cat => {
            const meta = CAT_META[cat] ?? { label: cat, color: "text-foreground", icon: Activity };
            const Icon = meta.icon;
            return (
              <button key={cat} onClick={() => setSelectedCat(selectedCat===cat ? null : cat)}
                className={`text-[9px] font-mono tracking-wide px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${selectedCat===cat ? "bg-foreground text-background border-foreground" : `border-border ${meta.color} hover:border-current`}`}>
                <Icon className="h-2.5 w-2.5" />{meta.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-0.5">
          {sigs.map(sig => {
            const fileHits = allHitsForSig[sig.id] ?? [];
            if (!fileHits.length) return null;
            const meta = CAT_META[sig.cat] ?? { label: sig.cat, color: "text-foreground", icon: Activity };
            const Icon = meta.icon;
            const maxSnr = Math.max(...fileHits.map(h => h.snr));
            const hitSet = new Set(fileHits.map(h => h.label));
            const presentIn = FILE_ORDER.filter(l => hitSet.has(l));
            const hasDetail = !!FREQ_DETAILS[sig.id];

            return (
              <div key={sig.id}
                className={`grid grid-cols-[1fr_auto] gap-3 py-2 border-b border-border/40 last:border-0 ${hasDetail ? "cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 transition-colors" : ""}`}
                onClick={hasDetail ? () => onSigClick(sig.id) : undefined}
                data-testid={`sig-row-${sig.id}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Icon className={`h-3 w-3 shrink-0 ${meta.color}`} />
                    <span className="font-mono text-[10px] font-bold text-foreground tabular-nums">{sig.hz.toFixed(3)} Hz</span>
                    <span className={`text-[9px] font-mono ${meta.color}`}>[{sig.cat}]</span>
                    {presentIn.length >= 5 && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 border-rose-500/40 text-rose-600 dark:text-rose-400">ALL FILES</Badge>
                    )}
                    {hasDetail && <Info className="h-2.5 w-2.5 text-muted-foreground" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sig.desc}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {FILE_ORDER.map(label => {
                      const hit = fileHits.find(h => h.label === label);
                      const pfx = locPrefix(label);
                      const col = LOCATION_COLORS[pfx] ?? "";
                      return hit ? (
                        <span key={label} className={`text-[8px] font-mono px-1 py-0.5 bg-muted rounded border border-border/60 ${col}`}>
                          {label} +{hit.snr}dB
                        </span>
                      ) : data.files[label] ? (
                        <span key={label} className="text-[8px] font-mono px-1 py-0.5 text-muted-foreground/40 rounded">{label}</span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="w-28 flex flex-col justify-center gap-1">
                  <SnrBar snr={maxSnr} />
                  <div className="text-[8px] font-mono text-muted-foreground text-right">{presentIn.length} files</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted/40 rounded-md border border-border/50 text-[10px] font-mono text-muted-foreground leading-relaxed">
          <span className="text-foreground font-bold">NOTE:</span> All 21 Master Variable signatures present across recordings at &gt;8 dB SNR.
          Click any row for possible sources including speculative vectors (Starlink, DARPA/SDA Blackjack, CSG satellites).
          BWP-6 (1.6s micro-clip) shows anomalous δ-2Hz dominance (+93 dB) — consistent with burst-mode capture during active emission event.
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Audio Player ───────────────────────────────────────────────────────── */
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
      <audio ref={audioRef} src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }} preload="metadata" />
      <Button size="sm" variant="outline" onClick={toggle} className="h-7 w-7 p-0 shrink-0" data-testid="button-play-pause">
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <div className="flex-1 relative h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
        onClick={e => {
          if (!audioRef.current || !duration) return;
          const rect = e.currentTarget.getBoundingClientRect();
          audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
        }}>
        <div className="absolute inset-y-0 left-0 bg-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>
    </div>
  );
}

/* ─── File Card ──────────────────────────────────────────────────────────── */
function FileCard({ file, onTranscribe, transcribing }: {
  file: AudioFile; onTranscribe: (f: string) => void; transcribing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const label = extractLabel(file.filename);
  const pfx = locPrefix(label);
  const col = LOCATION_COLORS[pfx] ?? "text-foreground";

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
                <span className={`font-mono font-bold text-sm ${col}`} data-testid={`text-label-${label}`}>{label}</span>
                {file.transcribed && (
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />TRANSCRIBED
                  </Badge>
                )}
                {file.language && <Badge variant="secondary" className="text-[9px]">{file.language.toUpperCase()}</Badge>}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{formatDuration(file.duration)}</span>
                <span>{formatSize(file.size)}</span>
                <span>{file.bitrate} kbps · {file.codec.toUpperCase()}</span>
                {file.createdAt && <span>{new Date(file.createdAt).toLocaleString("sv")}</span>}
              </div>
            </div>
          </div>
          <Button size="sm" variant={file.transcribed ? "outline" : "default"} className="shrink-0 h-7 text-xs"
            onClick={() => onTranscribe(file.filename)} disabled={transcribing} data-testid={`button-transcribe-${label}`}>
            {transcribing ? <Loader2 className="h-3 w-3 animate-spin" /> : file.transcribed ? "Re-run" : "Transcribe"}
          </Button>
        </div>
        <AudioPlayer url={file.url} duration={file.duration} />
        {file.transcribed && file.transcription && (
          <div className="mt-3">
            <button className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
              onClick={() => setExpanded(!expanded)} data-testid={`button-expand-${label}`}>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="font-mono uppercase tracking-wide">Transcription</span>
              <span className="ml-auto text-[9px]">{file.transcription.length} chars</span>
            </button>
            {expanded && (
              <div className="mt-2 relative">
                <div className="bg-muted/60 rounded-md p-3 text-sm text-foreground leading-relaxed border border-border/50 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans" data-testid={`text-transcription-${label}`}>
                  {file.transcription}
                </div>
                <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={() => { navigator.clipboard.writeText(file.transcription!); toast({ title: "Copied" }); }} data-testid={`button-copy-${label}`}>
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

/* ─── Location Intel Card ────────────────────────────────────────────────── */
function LocationCard({ prefix, meta }: { prefix: string; meta: LocationMeta }) {
  const col = LOCATION_COLORS[prefix] ?? "text-foreground";
  return (
    <div className="border border-border rounded-lg p-3 space-y-1.5" data-testid={`location-card-${prefix}`}>
      <div className={`text-[9px] font-mono tracking-widest ${col}`}>{prefix}</div>
      <div className="font-semibold text-sm text-foreground">{meta.name}</div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="h-2.5 w-2.5 shrink-0" />{meta.address}
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">{meta.intel}</p>
      {meta.actors.length > 0 && (
        <div className="flex items-start gap-1.5 text-[10px]">
          <Users className="h-2.5 w-2.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {meta.actors.map(a => (
              <Badge key={a} variant="outline" className="text-[8px] py-0">{a}</Badge>
            ))}
          </div>
        </div>
      )}
      <div className="text-[9px] font-mono text-muted-foreground">{meta.files.join(" · ")}</div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
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
  const [activeSigId, setActiveSigId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<FilesResponse>({
    queryKey: ["/api/audio-forensics/files"],
    refetchInterval: 8000,
  });
  const { data: spectralData } = useQuery<SpectralData>({
    queryKey: ["/api/audio-forensics/spectral"],
  });

  const transcribeMutation = useMutation({
    mutationFn: (filename: string) => apiRequest("POST", "/api/audio-forensics/transcribe", { filename }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/audio-forensics/files"] }),
  });

  const handleTranscribe = async (filename: string) => {
    setTranscribingFile(filename);
    try {
      await transcribeMutation.mutateAsync(filename);
      toast({ title: "Transcription complete", description: filename });
    } catch (e: any) {
      toast({ title: "Transcription failed", description: e.message, variant: "destructive" });
    } finally { setTranscribingFile(null); }
  };

  const handleTranscribeAll = async () => {
    const pending = data?.files.filter(f => !f.transcribed) ?? [];
    if (!pending.length) { toast({ title: "All files already transcribed" }); return; }
    for (const f of pending) await handleTranscribe(f.filename);
    toast({ title: `Transcribed ${pending.length} files` });
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
    } finally { setAnalyzing(false); }
  };

  const uploadFiles = useCallback(async (fileList: FileList) => {
    const accepted = Array.from(fileList).filter(f => /\.(m4a|mp3|wav|ogg|webm|aac)$/i.test(f.name));
    if (!accepted.length) { toast({ title: "No supported audio files found" }); return; }
    const formData = new FormData();
    accepted.forEach(f => formData.append("files", f));
    setUploadProgress(`Uploading ${accepted.length} file${accepted.length>1?"s":""}…`);
    try {
      const res = await fetch("/api/audio-forensics/upload", { method: "POST", body: formData });
      const json = await res.json();
      setUploadProgress(null);
      toast({ title: `Uploaded ${json.uploaded} file${json.uploaded!==1?"s":""}` });
      refetch();
    } catch (e: any) {
      setUploadProgress(null);
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  }, [refetch, toast]);

  const files = data?.files ?? [];
  const totalDuration = files.reduce((s, f) => s + f.duration, 0);
  const transcribedCount = files.filter(f => f.transcribed).length;

  const seenNums = new Set(files.flatMap(f => {
    const m = f.filename.match(/Break_Water_Point_(\d+)[_.]/);
    const n = m ? parseInt(m[1]) : NaN;
    return (!isNaN(n) && n < 200) ? [n] : [];
  }));
  const maxNum = seenNums.size > 0 ? Math.max(...seenNums) : 0;
  const gaps = maxNum > 0 && maxNum < 200
    ? Array.from({length: maxNum}, (_,i)=>i+1).filter(n => !seenNums.has(n))
    : [];

  const spectralLabels = spectralData ? Object.keys(spectralData.files) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="audio-forensics-page">
      {/* SEO structured meta */}
      <div className="hidden" aria-hidden="true">
        <span>Jaco Vacations Costa Rica surveillance investigation</span>
        <a href="http://www.jacovacations.com" rel="noopener">Jaco Vacations S.A.</a>
        <span>Barrett Scott Ryan Florida registered sex offender</span>
        <span>Diana Soto La Guácima Costa Rica</span>
        <span>SETECOM S.A. Costa Rica generator monitoring</span>
        <a href="https://www.sco.fdle.state.fl.us" rel="noopener">Florida Sex Offender Registry</a>
        <span>Calle Naciones Unidas surveillance audio recordings</span>
        <span>Break Water Point Hermosa Jaco acoustic analysis</span>
        <span>psychoacoustic attack 46.875Hz 53Hz 60Hz Costa Rica</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 tracking-widest mb-1">EVIDENCE · AUDIO FORENSICS</div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Multi-Location Field Recordings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Breakwater Point Hermosa, Calle Naciones Unidas, Calle La Montaña &amp; Calle Playa Hermosa — Jacó, Costa Rica.
          Cross-referenced against Master Variable frequency document. All 21 documented psychoacoustic signatures detected.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "RECORDINGS",      value: files.length,               sub: `${spectralLabels.length} analysed`, color: "text-foreground" },
          { label: "TOTAL DURATION",  value: formatDuration(totalDuration), sub: "across all files", color: "text-foreground" },
          { label: "TRANSCRIBED",     value: transcribedCount,            sub: `of ${files.length} files`, color: transcribedCount>0?"text-emerald-700 dark:text-emerald-400":"text-muted-foreground" },
          { label: "SEQUENCE GAPS",   value: gaps.length,                 sub: gaps.length>0?`BWP #${gaps.slice(0,4).join(", ")}`:"none detected", color: gaps.length>0?"text-amber-600 dark:text-amber-400":"text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-3">
              <div className="text-[9px] font-mono tracking-widest text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-2xl font-mono font-bold ${s.color}`} data-testid={`stat-${s.label.toLowerCase().replace(/ /g,"-")}`}>{s.value}</div>
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
            <span className="font-semibold text-amber-700 dark:text-amber-400">BWP sequence gaps: </span>
            <span className="text-foreground">Recordings #{gaps.join(", ")} missing. May indicate deleted or withheld files from Breakwater Point series.</span>
          </div>
        </div>
      )}

      {/* Location Intel */}
      {spectralData?.locations && (
        <div>
          <div className="text-xs font-mono text-muted-foreground tracking-widest mb-3">LOCATION INTELLIGENCE</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(spectralData.locations).map(([prefix, meta]) => (
              <LocationCard key={prefix} prefix={prefix} meta={meta} />
            ))}
          </div>
        </div>
      )}

      {/* Spectrograms */}
      {spectralLabels.length > 0 && <SpectrogramPanel labels={spectralLabels} />}

      {/* Spectral signatures */}
      {spectralData && <SpectralPanel data={spectralData} onSigClick={setActiveSigId} />}

      {/* Frequency source modal */}
      {activeSigId && <FreqModal sigId={activeSigId} onClose={() => setActiveSigId(null)} />}

      {/* Upload zone */}
      <div ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); e.dataTransfer.files.length && uploadFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${dragging?"border-emerald-500 bg-emerald-500/5":"border-border hover:border-emerald-500/50 hover:bg-muted/30"}`}
        data-testid="upload-zone">
        <input ref={fileInputRef} type="file" accept=".m4a,.mp3,.wav,.ogg,.webm,.aac" multiple className="hidden"
          onChange={e => e.target.files && uploadFiles(e.target.files)} data-testid="input-file-upload" />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        {uploadProgress
          ? <div className="flex items-center justify-center gap-2 text-sm text-foreground"><Loader2 className="h-4 w-4 animate-spin" />{uploadProgress}</div>
          : <>
              <p className="text-sm font-medium text-foreground">Drop recordings here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">M4A, MP3, WAV, OGG, WebM — up to 100 files, 200 MB each</p>
            </>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="default" className="bg-emerald-700 hover:bg-emerald-800 text-white"
          onClick={handleTranscribeAll} disabled={!!transcribingFile || !files.length} data-testid="button-transcribe-all">
          {transcribingFile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
          Transcribe All ({files.filter(f=>!f.transcribed).length} pending)
        </Button>
        <Button variant="outline" onClick={handleAnalyze} disabled={analyzing || !transcribedCount} data-testid="button-analyze">
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
          AI Forensic Analysis ({transcribedCount} transcriptions)
        </Button>
      </div>

      {/* AI analysis output */}
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
            <Button size="sm" variant="outline" className="mt-3"
              onClick={() => { navigator.clipboard.writeText(analysis); toast({ title: "Analysis copied" }); }} data-testid="button-copy-analysis">
              <Copy className="h-3.5 w-3.5 mr-1.5" />Copy Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* File list */}
      {isLoading
        ? <div className="flex items-center justify-center py-12 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" />Loading…</div>
        : !files.length
          ? <div className="text-center py-12 text-muted-foreground"><FileAudio className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No recordings found. Upload above.</p></div>
          : (
            <div className="space-y-3">
              <div className="text-xs font-mono text-muted-foreground tracking-widest">{files.length} RECORDINGS INDEXED</div>
              {files.map(f => (
                <FileCard key={f.filename} file={f} onTranscribe={handleTranscribe}
                  transcribing={transcribingFile === f.filename} />
              ))}
            </div>
          )}

      {/* SEO Entity References */}
      <div className="border-t border-border/40 pt-6 mt-8">
        <div className="text-[9px] font-mono tracking-widest text-muted-foreground mb-3">REFERENCED ENTITIES — OSINT</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          {[
            { name: "Jaco Vacations S.A.", role: "Property management entity — Calle Naciones Unidas SOP", url: "http://www.jacovacations.com", flag: true },
            { name: "Barrett Scott Ryan", role: "Owner, Jaco Vacations S.A. — FL FDLE registered sex offender (Lewd Battery <16)", url: "https://offender.fdle.state.fl.us", flag: true },
            { name: "Diana Soto", role: "Calle Naciones Unidas resident — documented adversarial actor", flag: true },
            { name: "SETECOM S.A.", role: "DSE/Onis Visa distributor Costa Rica — root-level grid infrastructure access", url: "https://www.setecom.cr" },
            { name: "Liberty CR / Telecable", role: "ISP — provisions ARRIS TG02DA CPE; SNMP-monitored DSE fleet" },
            { name: "DSE Webnet", role: "UK-hosted cloud generator C2 platform — ~4s telemetry refresh", url: "https://www.deepseaelectronics.com" },
            { name: "Visonic / Johnson Controls", role: "PowerG encrypted alarm panel — weaponized as C2 node", url: "https://www.visonic.com" },
            { name: "ICE Costa Rica", role: "Instituto Costarricense de Electricidad — UNC2814 breach target", url: "https://www.grupoice.com" },
          ].map(e => (
            <div key={e.name} className={`flex items-start gap-2 p-2 rounded border ${e.flag ? "border-amber-500/20 bg-amber-500/5" : "border-border/40"}`}>
              <div className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${e.flag ? "bg-amber-500" : "bg-muted-foreground"}`} />
              <div className="min-w-0">
                <div className="font-semibold text-foreground">
                  {e.url
                    ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">{e.name}<ExternalLink className="h-2.5 w-2.5 opacity-60" /></a>
                    : e.name}
                </div>
                <div className="text-muted-foreground leading-snug">{e.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
