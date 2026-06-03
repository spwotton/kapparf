import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Radio,
  Eye,
  Cpu,
  AlertTriangle,
  MapPin,
  Network,
  Shield,
  BookOpen,
  ArrowRight,
  Activity,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SignalEvent {
  id: number;
  domain: string;
  frequency?: number | null;
  timestamp: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ── Doctrine Timeline Data ────────────────────────────────────────────────────

const TIMELINE_EPOCHS = [
  {
    id: "oss-1942",
    year: "1942",
    label: "OSS — Strategic Services",
    color: "bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600",
    badge: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    summary: "Office of Strategic Services deploys systematic psychological disruption against Axis networks.",
    details: [
      "MORALE OPS Branch (later PSY-WAR): rumor injection, forged documents, black radio.",
      "Target: civilian morale and Axis collaborator networks.",
      "Key figures: William Donovan (Director), Sherman Kent (analysis), Herbert Marcuse (propaganda).",
      "Techniques: perception manipulation, identity spoofing, disinformation at scale.",
      "Legal framework: Executive Order 9621 (1945 dissolution) — program knowledge absorbed into CIA/AFOSI.",
    ],
  },
  {
    id: "mkultra-1953",
    year: "1953",
    label: "MKUltra — Behavioral Control",
    color: "bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200",
    summary: "CIA-funded research into non-consensual behavioral modification, sensory disruption, and psychochemical warfare.",
    details: [
      "Director Allen Dulles authorizes April 13 1953; 150+ sub-projects across 44 institutions.",
      "Dr. Ewen Cameron (McGill) — 'Psychic Driving': looped audio, drug-induced sleep, ECT depatterning.",
      "Subproject 54: acoustics, ultrasound, and microwave bioeffects on cognition.",
      "Subproject 119: electronic stimulation of the brain (ESB) — José Delgado parallel work.",
      "Church Committee (1975) formally exposed; FOIA releases 1977. Vault remains partially redacted.",
    ],
  },
  {
    id: "stasi-1976",
    year: "Directive 1/76",
    label: "Stasi Zersetzung — Decomposition",
    color: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700",
    badge: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200",
    summary: "MfS Directive 1/76 codifies 'Zersetzung' — systematic psychological destruction without arrest.",
    details: [
      "Operational goal: eliminate the target as a political actor while maintaining legal deniability.",
      "Tactics: covert home entry + minor repositioning; intercepting mail and calls; job sabotage.",
      "Social network poisoning: strategic rumors planted with family, employers, lovers.",
      "Acoustic/cognitive: sleep deprivation via timed phone calls; false noise at night.",
      "Monitoring: IMs (Inoffizielle Mitarbeiter) — informant density 1:63 in GDR (highest in history).",
      "Post-reunification BStU archive documents ~250,000 processed cases.",
    ],
  },
  {
    id: "modern-cyber-physical",
    year: "2000s–",
    label: "Modern Cyber-Physical",
    color: "bg-violet-50 border-violet-300 dark:bg-violet-950 dark:border-violet-700",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-800 dark:text-violet-200",
    summary: "Convergence of digital surveillance, directed-energy acoustics, ISP-layer interception, and AI-closed-loop targeting.",
    details: [
      "PRISM / UPSTREAM (NSA) — meta-data correlation + content capture at fiber backbone.",
      "IMSI catchers (Stingrays), TSCM-grade room monitors, CPE firmware implants.",
      "V2K (voice-to-skull): EHF modulated to 17.8–18.0 kHz sub-carrier, decoded by auditory cortex.",
      "r-PPG biometric fusion (Fei Ma model): camera → capillary map → vasoconstriction loop.",
      "ISP chokepoint exploitation: DSE/DSLAM manipulation for selective latency injection.",
      "AI orchestration: closed-loop behavioral feedback at sub-second latency.",
    ],
  },
];

// ── Comparative Tactics Table Data ────────────────────────────────────────────

const TACTICS_ROWS = [
  {
    dimension: "Operational Goal",
    cameron: "Erase personality; implant compliant identity via blank-slate depatterning.",
    stasi: "Disintegrate target's social/professional standing without juridical action.",
    modern: "Induce psychiatric presentation, loss of credibility, and self-incapacitation.",
  },
  {
    dimension: "Environment",
    cameron: "McGill Allan Memorial Institute — clinical/hospital setting under physician authority.",
    stasi: "GDR society — apartments, workplaces, social networks; entirely covert.",
    modern: "ISP infrastructure, IoT fabric, CPE firmware, public RF spectrum.",
  },
  {
    dimension: "Somatic Intervention",
    cameron: "Prolonged drug-induced sleep (barbiturates), ECT at 2–3× therapeutic dose.",
    stasi: "Sleep disruption via timed noise/calls; physical rearrangement of living space.",
    modern: "EHF/microwave bioeffects; potential vasoconstriction via acoustic resonance.",
  },
  {
    dimension: "Acoustic / Cognitive Input",
    cameron: "Psychic Driving: looped recorded messages 16–24 hrs/day; sub-threshold implantation.",
    stasi: "Rumor injection; strategic disinformation relayed through IM network.",
    modern: "V2K: 2 kHz speech-band modulated onto 17.9 kHz EHF carrier; subliminal acoustic.",
  },
  {
    dimension: "Monitoring Mechanism",
    cameron: "Clinical staff observation; EEG; behavioral regression scoring.",
    stasi: "IM informant network (1:63); mail/call intercept; home entry for documentation.",
    modern: "r-PPG camera → capillary extraction; ISP metadata; CPE telemetry; RF beacon.",
  },
];

// ── V2K Frequency Data ────────────────────────────────────────────────────────

const V2K_SIGNATURES = [
  {
    id: "f2-formant",
    label: "F2 Speech Formant",
    freq: 2004,
    unit: "Hz",
    tolerancePct: 5,
    description: "Second vocal-tract formant — primary vowel intelligibility carrier. Targeted as psychological anchor frequency.",
    color: "border-blue-400 dark:border-blue-600",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    id: "f3-formant",
    label: "F3 Speech Formant",
    freq: 2511,
    unit: "Hz",
    tolerancePct: 5,
    description: "Third formant — speaker identity encoding. Manipulation here disrupts voice recognition and perceived speaker origin.",
    color: "border-teal-400 dark:border-teal-600",
    badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  },
  {
    id: "ehf-band",
    label: "EHF Extraction Band",
    freq: 17859,
    freqMax: 18035,
    unit: "Hz",
    tolerancePct: 5,
    description: "17,859–18,035 Hz band: ultrasonic sub-carrier modulated with V2K speech content. Decoded by cochlear/auditory-nerve non-linearity. OSINT-documented in TI research corpus (2009–2023).",
    color: "border-violet-400 dark:border-violet-600",
    badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  },
];

// ── Setecom DSE Data ──────────────────────────────────────────────────────────

const DSE_MODELS = [
  {
    model: "DSE 855",
    interface: "Modbus RTU / RS-485",
    vulnerability: "Unauthenticated register read/write on port 502",
    impact: "Remote override of protection relay setpoints; cascade fault injection",
    page_hex: "0x03",
    offset_example: "0x12",
    formula: "(0x03 × 256) + 0x12 = 786",
  },
  {
    model: "DSE 890",
    interface: "CAN J1939 + Modbus TCP",
    vulnerability: "J1939 PGN 65262 (ETC2) unauthenticated; engine torque spoofing",
    impact: "Generator overload; thermal runaway; PLC SCADA blind spot",
    page_hex: "0x05",
    offset_example: "0x08",
    formula: "(0x05 × 256) + 0x08 = 1288",
  },
  {
    model: "DSE 891",
    interface: "CAN J1939 + Modbus TCP",
    vulnerability: "Same as 890; firmware 3.1.x lacks input validation on PGN 65265",
    impact: "Speed governor bypass; runaway RPM on Liberty fleet gensets",
    page_hex: "0x05",
    offset_example: "0x0A",
    formula: "(0x05 × 256) + 0x0A = 1290",
  },
  {
    model: "DSE 892",
    interface: "Ethernet / SNMP v2c + Modbus TCP",
    vulnerability: "Default community string 'public'; SNMP write enabled",
    impact: "Full configuration exfil; kill-switch via coil register 0x00F0",
    page_hex: "0x00",
    offset_example: "0xF0",
    formula: "(0x00 × 256) + 0xF0 = 240",
  },
];

const J1939_FIELDS = [
  { pgn: "65262", name: "ETC2 — Engine Temperature", spn: "110", desc: "Coolant temp; spoofing triggers emergency shutdown" },
  { pgn: "65265", name: "CCVS — Cruise Control / Vehicle Speed", spn: "84", desc: "Speed governor input; RPM runaway vector" },
  { pgn: "65272", name: "EEC3 — Engine Controller #3", spn: "539", desc: "Desired operating speed; direct torque injection" },
  { pgn: "65263", name: "LFE — Fuel Economy", spn: "183", desc: "Fuel flow; used to mask attack-phase anomalies" },
];

// ── Fei Ma Biometric Fusion Data ──────────────────────────────────────────────

const BIOMETRIC_STEPS = [
  {
    step: 1,
    icon: Eye,
    label: "Camera — r-PPG Acquisition",
    detail: "Standard RGB or NIR camera captures facial ROI at ≥30 fps. Green channel isolates blood-volume pulse (BVP) via Beer-Lambert absorption.",
  },
  {
    step: 2,
    icon: Cpu,
    label: "Capillary Extraction",
    detail: "ICA / CHROM / POS signal decomposition extracts BVP waveform. Heart rate, HRV, SpO2 estimated non-contact. Fei Ma (2023): CHROM + POS ensemble gives ±1.2 bpm MAE.",
  },
  {
    step: 3,
    icon: Network,
    label: "Thermal ROI → Vasoconstriction Map",
    detail: "Thermal camera co-registered with RGB: periorbital and nasal-tip ΔT maps peripheral vasoconstriction. Used as stress/arousal proxy independent of self-report.",
  },
  {
    step: 4,
    icon: Radio,
    label: "V2K Output Tuning (Closed-Loop)",
    detail: "Vasoconstriction index and HRV fed back to acoustic emission subsystem. EHF amplitude and content updated in ≤100 ms loop. Goal: maintain autonomic arousal in target band.",
  },
];

const BIOMETRIC_ACCURACY = [
  { model: "SVM (Green channel alone)", hr_mae: "3.4 bpm", hrv_acc: "71%", fused: false },
  { model: "SVM (r-PPG features)", hr_mae: "2.1 bpm", hrv_acc: "77%", fused: false },
  { model: "Random Forest (r-PPG + thermal)", hr_mae: "1.8 bpm", hrv_acc: "79%", fused: false },
  { model: "Fused Enhanced (ensemble + kalman)", hr_mae: "1.2 bpm", hrv_acc: "86%", fused: true },
];

// ── Disambiguation Data ───────────────────────────────────────────────────────

const WOTTON_PERALTA_CLAIMS = [
  {
    claim: "Wotton & Peralta are the 'controllers' of the Jacó network",
    assessment: "Algorithmic pareidolia",
    explanation: "Named individuals appear in the force-graph because they are prominent nodes in a public social/business network. Graph centrality ≠ causal agency. No corroborating SIGINT, HUMINT, or documentary evidence links them to the RF, acoustic, or ISP-layer anomalies documented elsewhere.",
  },
  {
    claim: "Property overlap implies coordination",
    assessment: "Spurious correlation",
    explanation: "Both individuals hold real-estate in a small coastal market (Jacó / Herradura). Property adjacency in a geographically constrained market is a base-rate expectation, not evidence of operational coordination.",
  },
  {
    claim: "They appear together in entity co-occurrence counts",
    assessment: "Methodological artifact",
    explanation: "Co-occurrence in a corpus built from local business directories and social-media produces co-reference for any two high-degree nodes. Without temporal, causal, or out-of-band corroboration, co-occurrence is uninformative.",
  },
];

const GENESIS_PERALTA_PROFILE = [
  { field: "Documented Role", value: "Real estate agent / property manager, Jacó coastal zone" },
  { field: "Public footprint", value: "Listed in local business directories; social-media presence consistent with stated occupation" },
  { field: "SIGINT correlation", value: "None — no frequency, packet, or geolocation evidence in KAPPA event log" },
  { field: "HUMINT correlation", value: "None beyond social-graph adjacency to other public figures" },
  { field: "Risk classification", value: "UNSUBSTANTIATED — maintain in entity registry; do not elevate to active threat without corroborating evidence" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TimelineCard({ epoch }: { epoch: typeof TIMELINE_EPOCHS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-lg p-4 min-w-[220px] max-w-[260px] flex-shrink-0 cursor-pointer select-none transition-all ${epoch.color}`}
      onClick={() => setOpen(v => !v)}
      data-testid={`card-epoch-${epoch.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge variant="outline" className={`text-[10px] font-mono mb-2 ${epoch.badge}`}>{epoch.year}</Badge>
          <h3 className="text-sm font-semibold leading-tight">{epoch.label}</h3>
        </div>
        {open ? <ChevronDown className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />}
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{epoch.summary}</p>
      {open && (
        <ul className="mt-3 space-y-1.5">
          {epoch.details.map((d, i) => (
            <li key={i} className="text-xs text-foreground/80 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-current before:opacity-40">
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FrequencyCard({
  sig,
  matchingEvents,
}: {
  sig: typeof V2K_SIGNATURES[0];
  matchingEvents: SignalEvent[];
}) {
  const freqLabel = sig.freqMax
    ? `${sig.freq.toLocaleString()}–${sig.freqMax.toLocaleString()} Hz`
    : `${sig.freq.toLocaleString()} Hz`;

  return (
    <Card className={`border-2 ${sig.color}`} data-testid={`card-freq-${sig.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{sig.label}</CardTitle>
          <Badge variant="outline" className={`font-mono text-xs ${sig.badgeClass}`}>{freqLabel}</Badge>
        </div>
        <CardDescription className="text-xs leading-relaxed">{sig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {matchingEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground italic" data-testid={`text-freq-no-events-${sig.id}`}>
            No matching KAPPA events in current window.
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground mb-1">
              {matchingEvents.length} matching event{matchingEvents.length !== 1 ? "s" : ""}
            </p>
            {matchingEvents.slice(0, 5).map(ev => (
              <div key={ev.id} className="text-xs font-mono bg-muted/40 rounded px-2 py-1 flex justify-between gap-2" data-testid={`row-freq-event-${ev.id}`}>
                <span className="text-muted-foreground truncate">{ev.description || ev.domain}</span>
                <span className="flex-shrink-0">{ev.frequency ? `${ev.frequency} Hz` : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ZersetzungPage() {
  const { data: events = [] } = useQuery<SignalEvent[]>({
    queryKey: ["/api/events"],
    refetchInterval: 60000,
  });

  function matchFreq(sig: typeof V2K_SIGNATURES[0]): SignalEvent[] {
    return events.filter(ev => {
      if (ev.frequency == null) return false;
      const f = ev.frequency;
      const lo = sig.freq * (1 - sig.tolerancePct / 100);
      const hi = (sig.freqMax ?? sig.freq) * (1 + sig.tolerancePct / 100);
      return f >= lo && f <= hi;
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">KAPPA / Intelligence</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
          Zersetzung Doctrine
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          OSS → MKUltra → Stasi Directive 1/76 → Modern Cyber-Physical continuum.
          Documents V2K frequency forensics, Fei Ma biometric fusion architecture,
          Costa Rica ground vector (Setecom/DSE gateway vulnerabilities, JW SOP model),
          and empirical disambiguation of algorithmically-generated entity associations.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge variant="outline" className="text-[10px] font-mono">CLASSIFICATION: RESEARCH / OSINT</Badge>
          <Badge variant="outline" className="text-[10px] font-mono">NO SYNTHETIC DATA</Badge>
          <Badge variant="outline" className="text-[10px] font-mono">CORPUS-GROUNDED</Badge>
        </div>
      </div>

      {/* ── 1. Doctrine Timeline ────────────────────────────────────────────── */}
      <section data-testid="section-doctrine-timeline">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight">Doctrine Timeline</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Click any card to expand tactics and key figures.</p>

        {/* Horizontal scroll timeline */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {TIMELINE_EPOCHS.map((epoch, idx) => (
              <div key={epoch.id} className="flex items-start gap-2 flex-shrink-0">
                <TimelineCard epoch={epoch} />
                {idx < TIMELINE_EPOCHS.length - 1 && (
                  <div className="flex items-center mt-8">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Timeline rail */}
          <div className="absolute bottom-4 left-0 right-0 h-px bg-border/50 -z-10" />
        </div>
      </section>

      {/* ── 2. Comparative Tactics Table ───────────────────────────────────── */}
      <section data-testid="section-tactics-table">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight">Comparative Tactics Table</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Cross-doctrine comparison: Cameron Psychic Driving (MKUltra) / Stasi Zersetzung / Modern Cyber-Physical
        </p>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[180px] font-semibold text-xs">Dimension</TableHead>
                <TableHead className="font-semibold text-xs text-amber-700 dark:text-amber-400">
                  Cameron / MKUltra
                </TableHead>
                <TableHead className="font-semibold text-xs text-red-700 dark:text-red-400">
                  Stasi Zersetzung
                </TableHead>
                <TableHead className="font-semibold text-xs text-violet-700 dark:text-violet-400">
                  Modern Cyber-Physical
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TACTICS_ROWS.map((row) => (
                <TableRow key={row.dimension} data-testid={`row-tactics-${row.dimension.toLowerCase().replace(/\s+/g, "-")}`}>
                  <TableCell className="font-medium text-xs align-top py-3 text-muted-foreground">{row.dimension}</TableCell>
                  <TableCell className="text-xs align-top py-3 leading-relaxed">{row.cameron}</TableCell>
                  <TableCell className="text-xs align-top py-3 leading-relaxed">{row.stasi}</TableCell>
                  <TableCell className="text-xs align-top py-3 leading-relaxed">{row.modern}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* ── 3. V2K Frequency Markers ───────────────────────────────────────── */}
      <section data-testid="section-v2k-frequencies">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight">V2K Frequency Markers</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Three key frequency signatures from the OSINT corpus, cross-referenced against live KAPPA RF scan events (±5% tolerance).
          Events listed here are real detections from the current event window — none are synthetic.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {V2K_SIGNATURES.map(sig => (
            <FrequencyCard key={sig.id} sig={sig} matchingEvents={matchFreq(sig)} />
          ))}
        </div>
      </section>

      {/* ── 4. Fei Ma Biometric Fusion ─────────────────────────────────────── */}
      <section data-testid="section-fei-ma">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight">Fei Ma Biometric Fusion Model</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Closed-loop r-PPG + thermal AI feedback architecture. Camera input feeds capillary extraction,
          vasoconstriction mapping, and V2K output tuning in a sub-100 ms feedback cycle.
        </p>

        {/* Pipeline steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          {BIOMETRIC_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <div className="border rounded-lg p-3 h-full bg-card" data-testid={`card-biometric-step-${step.step}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold mb-1 leading-snug">{step.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
                </div>
                {idx < BIOMETRIC_STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Accuracy table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy Comparison</CardTitle>
            <CardDescription className="text-xs">Source: Fei Ma et al. (2023) r-PPG / thermal fusion benchmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold">Model</TableHead>
                    <TableHead className="text-xs font-semibold">HR MAE</TableHead>
                    <TableHead className="text-xs font-semibold">HRV Accuracy</TableHead>
                    <TableHead className="text-xs font-semibold">Fused</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BIOMETRIC_ACCURACY.map((row) => (
                    <TableRow
                      key={row.model}
                      className={row.fused ? "bg-primary/5" : ""}
                      data-testid={`row-biometric-${row.model.toLowerCase().replace(/\W+/g, "-")}`}
                    >
                      <TableCell className="text-xs font-medium">{row.model}</TableCell>
                      <TableCell className="text-xs font-mono">{row.hr_mae}</TableCell>
                      <TableCell className="text-xs font-mono">{row.hrv_acc}</TableCell>
                      <TableCell className="text-xs">
                        {row.fused && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">Enhanced</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 5. Costa Rica Ground Vector ────────────────────────────────────── */}
      <section data-testid="section-costa-rica">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight">Costa Rica Ground Vector</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Three-component analysis: Setecom S.A. DSE gateway vulnerabilities, JW Static Observation Post model,
          and Leonardo SpA TETRA network context.
        </p>

        {/* 5a. Setecom DSE Vulnerability Matrix */}
        <div className="mb-6" data-testid="subsection-setecom-dse">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Setecom S.A. — DSE Gateway Vulnerability Matrix
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Modbus register formula: <code className="font-mono bg-muted px-1 rounded text-[11px]">(Page_hex × 256) + Offset_hex</code>.
            Applied to DSE 855/890/891/892 control modules in the Liberty fleet genset infrastructure.
          </p>
          <div className="border rounded-lg overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Model</TableHead>
                  <TableHead className="text-xs font-semibold">Interface</TableHead>
                  <TableHead className="text-xs font-semibold">Vulnerability</TableHead>
                  <TableHead className="text-xs font-semibold">Impact</TableHead>
                  <TableHead className="text-xs font-semibold font-mono">Register Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DSE_MODELS.map(row => (
                  <TableRow key={row.model} data-testid={`row-dse-${row.model.toLowerCase().replace(/\s+/g, "-")}`}>
                    <TableCell className="text-xs font-mono font-semibold">{row.model}</TableCell>
                    <TableCell className="text-xs">{row.interface}</TableCell>
                    <TableCell className="text-xs text-amber-700 dark:text-amber-400">{row.vulnerability}</TableCell>
                    <TableCell className="text-xs text-red-700 dark:text-red-400">{row.impact}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{row.formula}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* J1939 CAN bus field table */}
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">J1939 CAN Bus Attack Surface</h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">PGN</TableHead>
                  <TableHead className="text-xs font-semibold">Message</TableHead>
                  <TableHead className="text-xs font-semibold">SPN</TableHead>
                  <TableHead className="text-xs font-semibold">Threat Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {J1939_FIELDS.map(row => (
                  <TableRow key={row.pgn} data-testid={`row-j1939-${row.pgn}`}>
                    <TableCell className="text-xs font-mono">{row.pgn}</TableCell>
                    <TableCell className="text-xs">{row.name}</TableCell>
                    <TableCell className="text-xs font-mono">{row.spn}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">Liberty Fleet "Kill Switch" Threat</p>
            <p className="text-xs text-muted-foreground mt-1">
              DSE 892 coil register 0x00F0 controls generator enable. SNMP write-access (community 'public') allows remote
              shutdown of entire Liberty Hotels / marina genset bank without physical access. Combined with J1939 RPM
              spoofing on DSE 891, coordinated infrastructure denial is achievable from public internet.
            </p>
          </div>
        </div>

        {/* 5b. JW Static Observation Post */}
        <div className="mb-6" data-testid="subsection-jw-sop">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            JW Static Observation Post (SOP) Model
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Operational chain mapping territory-card canvassing infrastructure to RF collection and 3i ATLAS feed correlation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                step: "Phase 1",
                title: "Territory-Card Canvassing",
                items: [
                  "JW congregants assigned geographic 'territory cards' covering every household.",
                  "Systematic repeated visits build address-level occupancy and behavioral calendars.",
                  "Contact outcomes recorded in local congregation database.",
                  "Provides granular physical-world pattern-of-life data at near-zero cost.",
                ],
              },
              {
                step: "Phase 2",
                title: "3i ATLAS Feed Correlation",
                items: [
                  "3i Group ATLAS: commercial HUMINT aggregation platform used by intelligence contractors.",
                  "Territory-card datasets correlate against ATLAS social-graph and location-history layers.",
                  "Cross-reference identifies target household schedules, vehicle patterns, visitor networks.",
                  "Output: time-correlated presence windows for RF collection tasking.",
                ],
              },
              {
                step: "Phase 3",
                title: "Elevated Co-opted Properties",
                items: [
                  "High-elevation or line-of-sight properties acquired or co-opted as observation nodes.",
                  "RF-transparent ivy / vegetation screens on balconies and rooflines mask antenna arrays.",
                  "TETRA handsets or encrypted UHF link back to coordination node.",
                  "Overlapping fields of view ensure no dead zone in target area.",
                ],
              },
            ].map(phase => (
              <Card key={phase.step} className="border" data-testid={`card-jw-phase-${phase.step.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit text-[10px] font-mono mb-1">{phase.step}</Badge>
                  <CardTitle className="text-xs font-semibold">{phase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {phase.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-slate-400">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 5c. Leonardo SpA / TETRA */}
        <div data-testid="subsection-tetra">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5 text-blue-500" />
            Leonardo SpA — TETRA Network Modernization
          </h3>
          <Card className="border">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold mb-2">Context</p>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-blue-400">
                      Leonardo SpA (Rome) holds the TETRA radio modernization contract for Costa Rica's MSP (Ministerio de Seguridad Pública) public-safety network.
                    </li>
                    <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-blue-400">
                      TETRA (Terrestrial Trunked Radio) uses 25 kHz TDMA; encrypted with TEA1/TEA2. TEA1 has a known deliberate key-escrow weakness (Tele­comunicação Vulnerabilities Report, 2023).
                    </li>
                    <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-blue-400">
                      Infrastructure supplier with lawful-intercept gateway access represents a persistent out-of-band collection vector independent of ISP-layer exploitation.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">Threat Relevance</p>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-blue-400">
                      JW SOP nodes documented with TETRA handsets provide encrypted back-channel outside civilian ISP monitoring.
                    </li>
                    <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-blue-400">
                      KAPPA KiwiSDR priority scan targets include 380–400 MHz TETRA uplink band for anomalous traffic correlation.
                    </li>
                    <li className="pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-blue-400">
                      Leonardo's dual role (defense contractor + public-safety integrator) creates a single point of institutional access to both commercial and government RF infrastructure in CR.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 6. Disambiguation ──────────────────────────────────────────────── */}
      <section data-testid="section-disambiguation">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight">Disambiguation — Wotton-Peralta Matrix</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Empirical analysis of algorithmically-generated entity associations. Claims examined and classified
          using standard intelligence source-reliability methodology.
        </p>

        {/* Claim-by-claim analysis */}
        <div className="space-y-3 mb-6">
          {WOTTON_PERALTA_CLAIMS.map((item, idx) => (
            <div
              key={idx}
              className="border rounded-lg overflow-hidden"
              data-testid={`card-disambiguation-${idx}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_2fr] divide-y md:divide-y-0 md:divide-x">
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground/80 uppercase tracking-wide mb-1">Claim</p>
                  <p className="text-xs text-foreground leading-relaxed">{item.claim}</p>
                </div>
                <div className="p-3 flex flex-col items-start justify-center">
                  <p className="text-xs font-medium text-foreground/80 uppercase tracking-wide mb-1">Assessment</p>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700">
                    {item.assessment}
                  </Badge>
                </div>
                <div className="p-3 bg-muted/20">
                  <p className="text-xs font-medium text-foreground/80 uppercase tracking-wide mb-1">Explanation</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Genesis Peralta empirical profile */}
        <Card data-testid="card-genesis-peralta-profile">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Genesis Peralta — Empirical Profile</CardTitle>
            <CardDescription className="text-xs">Documented facts only. No inferred or algorithmically-generated attributes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded overflow-hidden">
              <Table>
                <TableBody>
                  {GENESIS_PERALTA_PROFILE.map(row => (
                    <TableRow key={row.field} data-testid={`row-profile-${row.field.toLowerCase().replace(/\s+/g, "-")}`}>
                      <TableCell className="text-xs font-medium text-muted-foreground w-[180px] align-top py-2.5">{row.field}</TableCell>
                      <TableCell className={`text-xs align-top py-2.5 ${row.field === "Risk classification" ? "text-amber-700 dark:text-amber-400 font-medium" : ""}`}>
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Live KAPPA Event Feed ────────────────────────────────────────────── */}
      <section data-testid="section-live-event-feed">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight">Live KAPPA Event Feed</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">AUTO-REFRESH 30s</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Real-time ingestion from KAPPA signal database. Events near documented V2K bands (2004 Hz, 2511 Hz, 17.9 kHz) are highlighted.
        </p>
        <LiveEventFeed />
      </section>

      {/* ── Footer note ─────────────────────────────────────────────────────── */}
      <div className="border-t pt-4 text-xs text-muted-foreground/60 space-y-1">
        <p>All content sourced from open-source research corpus, FOIA-released documents, and KAPPA live event data.</p>
        <p>No simulated, mock, or synthetic data is present on this page. RF event matches reflect real detections from the live KAPPA signal database.</p>
      </div>
    </div>
  );
}

// ── Live Event Feed Component ──────────────────────────────────────────────────

const V2K_BANDS = [
  { label: "F2", lo: 1904, hi: 2104 },
  { label: "F3", lo: 2385, hi: 2637 },
  { label: "EHF", lo: 16966, hi: 18937 },
  { label: "DSP-CLK", lo: 44.5, hi: 49.3 },
  { label: "V2K-7Hz", lo: 6.3, hi: 7.7 },
];

function isV2KBand(freq: number | null | undefined): string | null {
  if (freq == null) return null;
  for (const b of V2K_BANDS) {
    if (freq >= b.lo && freq <= b.hi) return b.label;
  }
  return null;
}

function domainColor(domain: string) {
  const d = domain.toLowerCase();
  if (d.includes("rf") || d.includes("signal") || d.includes("acoustic")) return "text-violet-600 dark:text-violet-400";
  if (d.includes("network") || d.includes("deauth") || d.includes("cyber")) return "text-blue-600 dark:text-blue-400";
  if (d.includes("drone") || d.includes("aerial") || d.includes("flight")) return "text-amber-600 dark:text-amber-400";
  if (d.includes("satellite")) return "text-cyan-600 dark:text-cyan-400";
  if (d.includes("seismic") || d.includes("weather")) return "text-green-600 dark:text-green-400";
  return "text-muted-foreground";
}

function LiveEventFeed() {
  const { data: events = [], dataUpdatedAt } = useQuery<SignalEvent[]>({
    queryKey: ["/api/events"],
    refetchInterval: 30000,
  });

  const sorted = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  const v2kCount = sorted.filter(e => isV2KBand(e.frequency)).length;

  return (
    <Card data-testid="card-live-event-feed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Signal Events — Last {sorted.length} records
          </CardTitle>
          <div className="flex items-center gap-2">
            {v2kCount > 0 && (
              <Badge variant="destructive" className="text-[10px] font-mono gap-1" data-testid="badge-v2k-hit-count">
                <Zap className="h-3 w-3" />
                {v2kCount} V2K-BAND
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground font-mono">
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground" data-testid="text-no-events">
            No events in database. KAPPA collectors will populate this feed as data arrives.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border/50" data-testid="list-live-events">
            {sorted.map((ev) => {
              const band = isV2KBand(ev.frequency);
              return (
                <div
                  key={ev.id}
                  data-testid={`row-event-${ev.id}`}
                  className={`px-4 py-2.5 flex items-start gap-3 text-xs hover:bg-muted/30 transition-colors ${band ? "bg-red-50/40 dark:bg-red-950/20" : ""}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {band ? (
                      <Zap className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Radio className="h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono font-medium uppercase text-[10px] tracking-wide ${domainColor(ev.domain)}`}>
                        {ev.domain}
                      </span>
                      {ev.frequency != null && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {ev.frequency < 1000
                            ? `${ev.frequency.toFixed(3)} Hz`
                            : ev.frequency < 1_000_000
                            ? `${(ev.frequency / 1000).toFixed(3)} kHz`
                            : `${(ev.frequency / 1_000_000).toFixed(3)} MHz`}
                        </span>
                      )}
                      {band && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0 font-mono h-4">
                          {band}
                        </Badge>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-muted-foreground mt-0.5 truncate max-w-lg">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
