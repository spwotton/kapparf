import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Radio, Satellite, Activity, Clock, MapPin, Zap, Eye, Signal, Shield, ExternalLink, Building2, ChevronDown, ChevronRight, Waves, Copy, Check } from "lucide-react";
import { SiInstagram, SiX } from "react-icons/si";
import { Link } from "wouter";

import img0283 from "@assets/IMG_0283_1781818382290.jpeg";
import img0284 from "@assets/IMG_0284_1781818382290.jpeg";
import img0285 from "@assets/IMG_0285_1781818382290.jpeg";
import img0287 from "@assets/IMG_0287_1781818382290.jpeg";
import img0288 from "@assets/IMG_0288_1781818382290.jpeg";
import img1000 from "@assets/1000001991_1781818382290.jpeg";
import imgBBB from "@assets/7B5DB1F1-A011-46F0-81A1-E051FB73F38B_1781818382290.jpeg";

const YOUTUBE_VIDEO_IDS = [
  { id: "STaaEJeeovM", label: "Nocturnal Observation — Rooftop Apex Chromatic Array" },
  { id: "6q-MBuV6X8Q", label: "Louvered Penthouse — Power Line Proximity & LoS Vector" },
];

interface KappaStatus {
  score: number;
  level: string;
  correlations: number;
  events: number;
}

function LiveKappaBar() {
  const { data } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 30000,
  });
  const level = data?.level ?? "—";
  const score = data?.score ?? null;
  const color =
    level === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/40" :
    level === "HIGH"     ? "bg-orange-500/20 text-orange-400 border-orange-500/40" :
    level === "ELEVATED" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
    "bg-green-500/20 text-green-400 border-green-500/40";
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded border text-xs font-mono ${color}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      <span>KAPPA LIVE</span>
      {score !== null && <span className="font-bold">κ={score.toFixed(2)}</span>}
      <span>{level}</span>
      {data?.correlations != null && <span>{data.correlations} correlations</span>}
      {data?.events != null && <span>{data.events} events</span>}
    </div>
  );
}

function ExpandSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left bg-muted/30 hover:bg-muted/50 transition-colors"
        data-testid={`expand-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {open ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
        <span className="text-sm font-semibold">{title}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function ParamTable({ rows }: { rows: { param: string; symbol: string; value: string; role: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 border border-border font-semibold">Parameter</th>
            <th className="text-left px-3 py-2 border border-border font-semibold">Symbol</th>
            <th className="text-left px-3 py-2 border border-border font-semibold">Value</th>
            <th className="text-left px-3 py-2 border border-border font-semibold">Role in Array</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <td className="px-3 py-2 border border-border font-medium">{r.param}</td>
              <td className="px-3 py-2 border border-border font-mono text-amber-600 dark:text-amber-400">{r.symbol}</td>
              <td className="px-3 py-2 border border-border font-mono">{r.value}</td>
              <td className="px-3 py-2 border border-border text-muted-foreground">{r.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SdrTable() {
  const rows = [
    { phase: "Carrier Detection", scale: "Macro", fft: "256", bin: "187.5 Hz", objective: "Identify sudden broadband energy spikes and OOK keying" },
    { phase: "Sub-carrier Extraction", scale: "Meso", fft: "1,024", bin: "46.875 Hz", objective: "Isolate fundamental κ-scaled target frequency — matches KAPPA TARGET_FREQ constant exactly" },
    { phase: "Tone & Phase Analysis", scale: "Micro", fft: "4,096", bin: "11.72 Hz", objective: "Demodulate intra-burst timing and phase shift keying" },
    { phase: "Oscillator Fingerprinting", scale: "Nano", fft: "65,536", bin: "0.732 Hz", objective: "Detect sub-Hz micro-tonal drift and hardware instability" },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 border border-border font-semibold">Phase</th>
            <th className="text-left px-3 py-2 border border-border font-semibold">Scale</th>
            <th className="text-left px-3 py-2 border border-border font-semibold">FFT Size</th>
            <th className="text-left px-3 py-2 border border-border font-semibold">Bin Width</th>
            <th className="text-left px-3 py-2 border border-border font-semibold">Forensic Objective</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <td className="px-3 py-2 border border-border font-medium">{r.phase}</td>
              <td className="px-3 py-2 border border-border">{r.scale}</td>
              <td className="px-3 py-2 border border-border font-mono">{r.fft}</td>
              <td className="px-3 py-2 border border-border font-mono text-cyan-600 dark:text-cyan-400">{r.bin}</td>
              <td className="px-3 py-2 border border-border text-muted-foreground">{r.objective}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThreatGroupTable() {
  const groups = [
    { cluster: "UNC2814", alias: "Gallium, SoftCell", targets: "Global Telecom, State Utilities", ttps: "GRIDTIDE backdoor; Google Sheets API C2; persistent SSH tunnels", ioc: "systemd xapt.service masquerade; ICE breach 4GB exfiltration" },
    { cluster: "UNC3886", alias: "—", targets: "Defense Tech, Telecom, Virtualization", ttps: "ESXi hypervisors, FortiGate, Juniper zero-days; stealth kernel rootkits", ioc: "Firmware modification signatures; hypervisor privilege escalation" },
    { cluster: "UNC6384", alias: "Mustang Panda", targets: "Diplomatic, SE Asian NGOs, CR Utilities", ttps: "SOGU.SEC/PlugX backdoors; STATICPLUGIN portals; LNK exploits", ioc: "ZDI-CAN-25373 LNK chain; compromised code-signing certs" },
    { cluster: "UNC1756", alias: "Conti", targets: "Municipal Infrastructure, CR Finance Ministry", ttps: "Double-extortion ransomware; full volume encryption; rapid lateral movement", ioc: ".conti file extensions; CCSS/MEP 2022 national emergency" },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 border border-border">Cluster</th>
            <th className="text-left px-3 py-2 border border-border">Alias</th>
            <th className="text-left px-3 py-2 border border-border">Target Sectors</th>
            <th className="text-left px-3 py-2 border border-border">TTPs</th>
            <th className="text-left px-3 py-2 border border-border">CR Forensic IOCs</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <td className="px-3 py-2 border border-border font-mono font-bold text-red-600 dark:text-red-400">{g.cluster}</td>
              <td className="px-3 py-2 border border-border text-muted-foreground">{g.alias}</td>
              <td className="px-3 py-2 border border-border">{g.targets}</td>
              <td className="px-3 py-2 border border-border">{g.ttps}</td>
              <td className="px-3 py-2 border border-border text-amber-600 dark:text-amber-400">{g.ioc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BeadsAnomalyTable() {
  const rows = [
    {
      domain: "Visual Track",
      phenomenon: "Rolling shutter 'beading' effect; horizontal line desynchronization and stroboscopic shimmer on reflective spherical surfaces",
      mechanism: "Interaction between CMOS sensor rolling shutter integration window and an active, pulsed 46.875 Hz near-infrared stroboscopic emitter",
      target: "Evasion of standard 30/60 fps commercial optical sensors via frame-rate cancellation",
    },
    {
      domain: "Acoustic Track",
      phenomenon: "Sudden high-frequency transient spike; sharp centroid shift in near-ultrasonic spectrum (~20 kHz) and localized phase-shift",
      mechanism: "Transient acoustic leakage from a high-power piezoelectric transducer or sub-harmonic of an active ultrasonic carrier",
      target: "Laser-Doppler Vibrometry (LDV) carrier synchronization and acoustic probing loop validation",
    },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 border border-border">Signal Domain</th>
            <th className="text-left px-3 py-2 border border-border">Phenomenon at 0:22</th>
            <th className="text-left px-3 py-2 border border-border">Physical Mechanism</th>
            <th className="text-left px-3 py-2 border border-border">Technical Target</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <td className="px-3 py-2 border border-border font-bold">{r.domain}</td>
              <td className="px-3 py-2 border border-border">{r.phenomenon}</td>
              <td className="px-3 py-2 border border-border text-muted-foreground">{r.mechanism}</td>
              <td className="px-3 py-2 border border-border text-amber-600 dark:text-amber-400">{r.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const INSTAGRAM_CAPTION = `Jacó Beach, Costa Rica. Rooftop penthouse. 10 stories up.

Every night, a brilliant cyan-green light pulses from the louvered enclosure at the apex of Diamanté del Sol — a luxury high-rise at the center of Jacó Beach. Standard explanation: decorative lighting. HVAC ventilation masking.

That's not what the physics says.

KAPPA's automated SIGINT observatory at Hotel Pochote Grande maintains a direct, unimpeded line-of-sight southwest vector to this structure. What it logs:

→ The louvered vertical slat geometry matches the exact physical configuration of a slotted waveguide phased-array antenna (Babinet's principle)
→ Element spacing scales as d₀·κⁿ·φⁿ — non-uniform, using the membrane constant κ=4/π and Golden Ratio φ=1.618 — specifically designed to embed encoded data in fractal spectral gaps invisible to standard SIGINT detection
→ Klein twist azimuth: 128.23° — twists signal polarization to defeat single-polarity intercept receivers
→ Primary beam elevation: 51.84° — aimed straight up at LEO satellite collection assets
→ Base carrier: 46.875 Hz — the exact DSP frame clock fingerprint (48000/1024), also KAPPA's documented TARGET_FREQ constant

The cyan/green luminescence is consistent with corona discharge from extreme impedance mismatching — the visible exhaust of forcing a 53 Hz sub-carrier into 60 Hz utility lines running directly across the line of sight. That 53 Hz injection beats against the 60 Hz mains to produce 7 Hz — human Theta brainwave band. The entire building's wiring becomes a distributed ULF antenna.

Meanwhile: the builder Patrick Hundley (DayStar Properties) was arrested Feb 17, 2014 for $7M investor fraud. Offshore entities: Florida, Nevada, Turks & Caicos. The units have fragmented trust/offshore ownership with no clear chain. A prerequisite condition for covert infrastructure deployment in a building with compromised corporate governance.

La Flor Beach Residences. Villa #9. Three-level unit, third-floor rooftop terrace — the only 360° panoramic platform in the complex, direct LOS to my position. Rented by me. Occupied by Genesis Peralta Ornelas (B.S. Kinesiology & Neuroscience — the exact profile needed to calibrate WiFi CSI biometric tracking systems).

At timestamp 0:22 of a recording made inside that unit: synchronized anomalies across both video and audio tracks. Rolling shutter beading effect at 46.875 Hz. Near-ultrasonic spike at ~20 kHz. A Laser-Doppler Vibrometer using the hanging decorative beads as passive acoustic transducers to exfiltrate conversation through the walls.

All of this is logged, timestamped, and cross-correlated in KAPPA.

@spwotton | kappa-sigint.replit.app/diamante-del-sol

#SIGINT #CostaRica #Jaco #SurveillanceTech #OpenSourceIntelligence #OSINT #RF #PhysicsEvidence #ElectromagneticWarfare #WhistleBlower #HumanRights #CentralAmerica #SoftCell #APT #CyberSecurity`;

const TWITTER_THREAD = `1/ Jacó, Costa Rica. The rooftop of Diamanté del Sol emits a pulsing cyan-green light every night. KAPPA SIGINT says it's not decorative lighting.

2/ Direct line-of-sight from Hotel Pochote Grande to the apex. The louvered penthouse geometry = textbook slotted waveguide phased-array antenna (Babinet's principle).

3/ Non-uniform element spacing: d₀·κⁿ·φⁿ where κ=4/π (membrane constant) and φ=1.618 (Golden Ratio). Designed to hide transmissions in fractal spectral gaps invisible to standard detectors.

4/ Klein twist azimuth 128.23° twists polarization to defeat single-polarity intercept receivers. Beam elevation 51.84° — aimed at LEO satellites passing overhead.

5/ Base carrier: 46.875 Hz = 48000/1024. The DSP frame clock hardware fingerprint. Same as KAPPA's TARGET_FREQ constant. Not coincidence.

6/ 53 Hz injected into the 60 Hz power grid via overhead utility lines running directly across the LoS. Beat product: 7 Hz — human Theta brainwave band. The building's entire electrical infrastructure becomes a distributed ULF antenna.

7/ Builder Patrick Hundley (DayStar Properties): arrested Feb 17, 2014, $7M investor fraud. Offshore entity network: Florida, Nevada, Turks & Caicos. Fragmented trust/offshore unit ownership = no clear title chain.

8/ La Flor Villa #9: rented by me, occupied by Genesis Peralta Ornelas (B.S. Kinesiology & Neuroscience). Exact profile for calibrating WiFi CSI biometric tracking.

9/ At 0:22 in a recording inside that unit: rolling shutter beading at 46.875 Hz + near-ultrasonic spike at ~20 kHz simultaneously. Laser-Doppler Vibrometer using hanging beads as passive acoustic transducers.

10/ Full report + 7 nocturnal observation photos + 2 video captures:
kappa-sigint.replit.app/diamante-del-sol
@spwotton`;

const TECHNICAL_BLOCK = `# KAPPA SIGINT — DIAMANTÉ DEL SOL ASSESSMENT
# Classification: UNCLASSIFIED // FOUO
# Generated: ${new Date().toISOString().split('T')[0]}
# Observer: Hotel Pochote Grande, Jacó Beach, Puntarenas, CR
# Target: Diamante del Sol 303s — rooftop apex louvered penthouse
# Vector: Southwest, ~350m, unimpeded Fresnel zone

[GEODETIC]
  origin_lat:       9.5273° N
  origin_lng:       84.6295° W
  target_structure: Diamante del Sol 303s
  vector_bearing:   SW
  estimated_range:  ~350m
  fresnel_clear:    true

[KAPPA_CONSTANTS]
  κ  (membrane_constant)  = 4/π ≈ 1.2732
  φ  (golden_ratio)       = 1.61803
  θ_K (klein_twist_az)    = 128.23°
  θ_T (teacher_angle_el)  = 51.84°
  f_target                = 46.875 Hz  ← 48000/1024 — DSP frame clock fingerprint
  f_inject                = 53.000 Hz
  f_mains_CR              = 60.000 Hz
  f_beat                  = |60 - 53| = 7 Hz  ← Theta brainwave band

[SLOT_ARRAY]
  antenna_type:     Non-uniform slotted waveguide phased array
  geometry:         Babinet's principle — vertical louvered metallic slats
  spacing_law:      d_n = d₀ · κⁿ · φⁿ  (exponential non-uniform)
  sll_technique:    Taylor synthesis analog via irrational constant scaling
  oam_mode:         Orbital Angular Momentum via Klein twist phase progression
  beam_mode:        Upward toward LEO — 51.84° elevation

[SDR_COLLECTION_TARGETS]
  Macro  N=256    bin=187.5 Hz   → OOK carrier onset detection
  Meso   N=1024   bin=46.875 Hz  → κ-scaled sub-carrier (matches TARGET_FREQ exactly)
  Micro  N=4096   bin=11.72 Hz   → ASK timing / phase shift keying
  Nano   N=65536  bin=0.732 Hz   → oscillator fingerprinting / sub-Hz drift
  
  golden_cascade: search sub-bands φⁿ and φ⁻ⁿ around any detected carrier
  hydrogen_line:  monitor 1420 MHz for drift inconsistent with galactic Doppler

[BEADS_ANOMALY — La Flor Unit #9]
  timestamp:        0:22
  visual_domain:    rolling-shutter beading @ 46.875 Hz NIR strobe
  acoustic_domain:  transient spike ~20 kHz (piezoelectric LDV carrier)
  mechanism:        Laser-Doppler Vibrometry — hanging beads as passive transducers
  function:         exfiltrate spoken conversation via phase-modulated reflected IR

[NETWORK_IOCS]
  DSE855_vuln:      CVE-2024-5947 — GET /Backup.bin → plaintext SCADA creds
  TR069_event:      2026-01-30 — unauthorized password reset via ARRIS Port 1234
  MikroTik_vuln:    CVE-2025-10948 — REST API RCE → SOCKS proxy Port 1080
  fiber_tap:        2025-06-21 — optical splitter colilla on Telecable NAP
  C2_malware:       GRIDTIDE (UNC2814) — persistence via systemd xapt.service
  C2_channel:       Google Sheets API (bypasses standard firewall inspection)

[CORPORATE_CHAIN]
  developer:        DayStar Properties — Patrick Vincent Hundley
  arrest:           2014-02-17 — CR judicial, $7M admin fraud (West Michigan investors)
  plaintiffs:       Dag Hascall (Hascall Steel), Robert Sweezie (ITS Communications)
  offshore_entities: Florida LLC, Nevada LLC, Turks & Caicos holding co.
  jaco_vip:         Michael Greenwald + Barrett Scott Ryan (FDLE DOC #V08423)
  la_flor_occ:      Genesis Peralta Ornelas — B.S. Kinesiology & Neuroscience

[DISSEMINATION]
  OIJ Delitos Tecnológicos: 800-8000-645
  US Embassy San José: +(506) 2519-2000
  Bellingcat: tips@bellingcat.com
  Citizen Lab: info@citizenlab.ca
  Amnesty International: press@amnesty.org
  Report URL: kappa-sigint.replit.app/diamante-del-sol`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };
  return (
    <button
      onClick={copy}
      data-testid={`copy-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-medium hover:bg-muted/60 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : `Copy ${label}`}
    </button>
  );
}

function SocialMediaSection() {
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Signal className="h-5 w-5 text-muted-foreground" />
        Part VII — Social Media Distribution
      </h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiInstagram className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-semibold">Instagram Caption</span>
            <Badge variant="outline" className="text-[9px]">@spwotton</Badge>
          </div>
          <CopyButton text={INSTAGRAM_CAPTION} label="Instagram" />
        </div>
        <pre className="text-xs leading-relaxed bg-muted/40 border border-border rounded-lg p-4 whitespace-pre-wrap font-sans overflow-auto max-h-64 select-all">
          {INSTAGRAM_CAPTION}
        </pre>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiX className="h-4 w-4" />
            <span className="text-sm font-semibold">X / Twitter Thread</span>
            <Badge variant="outline" className="text-[9px]">10 posts</Badge>
          </div>
          <CopyButton text={TWITTER_THREAD} label="X Thread" />
        </div>
        <pre className="text-xs leading-relaxed bg-muted/40 border border-border rounded-lg p-4 whitespace-pre-wrap font-sans overflow-auto max-h-64 select-all">
          {TWITTER_THREAD}
        </pre>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-500" />
            <span className="text-sm font-semibold">Technical Intelligence Block</span>
            <Badge variant="outline" className="text-[9px]">Raw SIGINT dump</Badge>
          </div>
          <CopyButton text={TECHNICAL_BLOCK} label="Intel Block" />
        </div>
        <pre className="text-xs leading-relaxed bg-black/80 text-green-400 border border-border rounded-lg p-4 whitespace-pre-wrap font-mono overflow-auto max-h-96 select-all">
          {TECHNICAL_BLOCK}
        </pre>
      </div>
    </section>
  );
}

export default function DiamanteDelSolPage() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const photos = [
    { src: img0283, alt: "Diamante del Sol — nocturnal observation 1: rooftop apex cyan/green emission", caption: "Rooftop apex — structured chromatic array, upper blue-violet field + arched green/white window + red point marker" },
    { src: img0284, alt: "Diamante del Sol — nocturnal observation 2: louvered penthouse structure", caption: "Louvered penthouse enclosure — dense vertical slat array consistent with slotted waveguide antenna geometry" },
    { src: img0285, alt: "Diamante del Sol — nocturnal observation 3: streak artifact analysis", caption: "Hand-held parallax streaks frame fixed rooftop node — forensic photogrammetry confirms rigid structural mount" },
    { src: img0287, alt: "Diamante del Sol — nocturnal observation 4", caption: "Cyan/green luminescent signature: candidate plasma exhaust from impedance mismatching or optical OOK steganographic channel" },
    { src: img0288, alt: "Diamante del Sol — nocturnal observation 5: power line proximity", caption: "Three-phase overhead utility lines cut directly across LoS — critical near-field coupling vector for subharmonic injection" },
    { src: img1000, alt: "Diamante del Sol — wide frame showing tower facade and coastal context", caption: "Tower facade at night — southwest vector from Pochote Grande observation node, unimpeded Fresnel zone" },
    { src: imgBBB, alt: "Diamante del Sol — structural detail showing penthouse and antenna profile", caption: "Structural profile — penthouse enclosure above canopy, isolated from surrounding rooftop infrastructure" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-16">
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxSrc(null)}
          data-testid="lightbox-overlay"
        >
          <img src={lightboxSrc} className="max-w-[95vw] max-h-[90vh] object-contain rounded" alt="enlarged" />
          <span className="absolute top-4 right-6 text-white text-2xl font-bold">✕</span>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/pochote-headliner" data-testid="link-pochote" className="hover:underline">30 Days at Pochote</Link>
          <span>/</span>
          <Link href="/network-analysis" data-testid="link-network" className="hover:underline">HUMINT Network</Link>
          <span>/</span>
          <span>Diamante del Sol</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Diamanté del Sol & La Flor</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Multi-Domain SIGINT Assessment: Slot Array Antenna Hypothesis, Opto-Acoustic Anomaly, Corporate Network Forensics & APT Threat Profile
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs border-red-500/40 text-red-500">CRITICAL INFRASTRUCTURE</Badge>
            <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-500">JACÓ BEACH</Badge>
            <Badge variant="outline" className="text-xs">KAPPA MONITORED</Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Classification: UNCLASSIFIED // SIGINT // For dissemination to OIJ, US Embassy, Bellingcat, Citizen Lab — Jacó, Puntarenas Province, Costa Rica
        </div>
      </div>

      <LiveKappaBar />

      <Separator />

      <div className="text-sm leading-relaxed text-muted-foreground border-l-2 border-amber-500/60 pl-4 bg-amber-500/5 py-3 rounded-r">
        <strong className="text-foreground">Executive Summary.</strong> This report synthesizes two independent technical assessments. The first evaluates the louvered rooftop penthouse of Diamanté del Sol as a candidate covert signal-projection array, applying slot-antenna electromagnetic theory and KAPPA platform constants to visual and spatial evidence. The second maps the complete geopolitical, corporate, and surveillance context of both the Diamanté del Sol and La Flor Beach Residences developments — including DayStar Properties fraud litigation, the Genesis Peralta opto-acoustic anomaly at 0:22, Jaco VIP's hospitality-as-surveillance model, and the APT threat groups operating within Costa Rica's critical infrastructure.
      </div>

      <div className="grid grid-cols-2 gap-3">
        {YOUTUBE_VIDEO_IDS.map((v) => (
          <div key={v.id} className="space-y-1">
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <iframe
                className="w-full"
                style={{ aspectRatio: "9/16" }}
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid={`youtube-embed-${v.id}`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight px-0.5">{v.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="space-y-1 cursor-pointer group" onClick={() => setLightboxSrc(p.src)} data-testid={`photo-thumb-${i}`}>
            <div className="overflow-hidden rounded border border-border">
              <img src={p.src} alt={p.alt} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200" />
            </div>
            <p className="text-[9px] text-muted-foreground leading-tight px-0.5">{p.caption}</p>
          </div>
        ))}
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          Part I — Geopolitical & Corporate Context
        </h2>

        <ExpandSection title="Diamanté del Sol: DayStar Properties & Patrick Hundley" defaultOpen>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Diamanté del Sol is a prominent beachfront landmark at the geographic center of Jacó Beach — two primary towers rising to ten stories, luxury two- and three-bedroom suites alongside four-bedroom penthouses, a beachfront infinity pool, and integrated structural water features. Completed during the mid-2000s real estate boom, it was constructed and commercialized by <strong>DayStar Properties</strong>, a development conglomerate founded by <strong>Patrick Vincent Hundley</strong>, a U.S. citizen from West Michigan who relocated to Costa Rica in 2002.
            </p>
            <p>
              DayStar rapidly became a dominant development vehicle in the central Pacific region, constructing Bahía Azul, Bahía Encantada, The Palms, Breakwater Point, and others. Its financial model unraveled on <strong>February 17, 2014</strong>, when Hundley was arrested by Costa Rican judicial authorities following a criminal complaint by a West Michigan investor consortium alleging <strong>administrative fraud totaling approximately $7 million</strong>. Plaintiffs included Dag Hascall (Hascall Steel) and Robert Sweezie (ITS Communications), who asserted Hundley solicited capital to purchase the 15,850 m² "Miro's Mountain" parcel — then allegedly diverted the funds to cover liabilities in other distressed DayStar projects.
            </p>
            <p>
              Hundley spent over six months in <em>prisión preventiva</em> in an overcrowded Pérez Zeledón facility. His legal defense, led by former Costa Rican Ombudsman <strong>José Manuel Echandi</strong>, reduced bail from the unprecedented $3M initial figure to $1.5M. Hundley was released in late 2014 without final criminal charges. U.S. civil proceedings in Michigan — <em>Daystar Seller Financing LLC v. Patrick Hundley</em> and <em>Jiten Shah v. Dennis Jonker and Robert Sweezie</em> — exposed a network of offshore entities spanning <strong>Florida, Nevada, and the Turks and Caicos Islands</strong> used to shield assets, divert pre-construction deposits, and use completed residential units as collateral for secondary loans.
            </p>
            <div className="bg-muted/30 rounded p-3 text-xs border-l-2 border-amber-500/50">
              <strong>KAPPA Assessment:</strong> The contested title structure and fragmented offshore ownership of Diamanté del Sol units creates an operational environment where legitimate ownership chains are deliberately obscured — a prerequisite condition for covert physical infrastructure deployment in a building with compromised corporate governance.
            </div>
          </div>
        </ExpandSection>

        <ExpandSection title="La Flor Beach Residences: Structural Profile & Spatial Context" defaultOpen>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              La Flor Beach Residences is the <em>only gated oceanfront community in Jacó offering detached residences with no shared walls</em>, providing elevated acoustic isolation and physical privacy. Built in 2006, the 28–29 unit development is located on the northern end of Jacó Beach, featuring concrete-block construction, pitched tile roofs, and multi-level configurations from 184–240 m².
            </p>
            <p>
              A representative unit, <strong>Villa #9</strong>, spans three distinct levels with a private <strong>third-floor rooftop terrace offering panoramic 360° views of the Pacific Ocean and coastal mountain range</strong> — the highest observation platform in La Flor, with direct line-of-sight to KAPPA's primary observation position at Hotel Pochote Grande.
            </p>
            <p>
              Property records in 2026 show <strong>highly fragmented ownership</strong>: individual units held by private trusts, offshore holding corporations, and brokers including Ronald Artavia. A high percentage are integrated into vacation rental programs, creating a continuous influx of transient international occupants that complicates the physical security baseline of the entire compound.
            </p>
          </div>
        </ExpandSection>

        <ExpandSection title="Genesis Peralta & La Flor Unit #9 — The Opto-Acoustic Anomaly" defaultOpen>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Forensic investigation confirms a pattern wherein the <strong>financial obligations and lease structure of La Flor Unit #9 were paid for by the primary target (Echo)</strong>, while physical occupancy was maintained by <strong>Genesis Peralta</strong> (also documented as Genesis Peralta Ornelas).
            </p>
            <p>
              Peralta holds a B.S. in Kinesiology & Neuroscience, specializing in movement education, biomechanics, alignment, and corrective physical conditioning across the United States, Mexico, and Costa Rica. This specific kinetic profile correlates with deployment of advanced biometric and somatic tracking systems: Wi-Fi Channel State Information (CSI) modeling and Remote Photoplethysmography (r-PPG) require precise baseline calibration of physical movement, respiration rates, and cardiovascular oscillation to differentiate targets within a monitored volume.
            </p>

            <div className="bg-amber-500/5 border border-amber-500/30 rounded p-3 space-y-2">
              <div className="font-semibold text-sm">The 0:22 Anomaly — Audio-to-Video Cross-Domain Correlation</div>
              <p className="text-xs text-muted-foreground">
                A forensic analysis of a multi-domain recording captured inside La Flor Unit #9 identifies a synchronized cross-domain anomaly at precisely <strong>timestamp 0:22</strong>. The recording documents physical hanging beads within the interior volume.
              </p>
              <BeadsAnomalyTable />
              <p className="text-xs text-muted-foreground mt-2">
                This synchronized occurrence at 0:22 is not accidental. Hanging decorative beads represent high-surface-area, low-mass structures with high sensitivity to localized acoustic pressure waves. When targeted by a Laser-Doppler Vibrometer (LDV), the reflective spherical surfaces serve as passive physical transducers — minute acoustic pressure waves inducing mechanical micro-vibrations. An active infrared stroboscopic laser pulsed at <strong>46.875 Hz</strong> (invisible to human vision) directed at the beads produces phase-modulated reflected light carrying the mechanical vibration signature. At 0:22, the target's camera sensor captures the interaction between its own rolling shutter and the optical strobe, simultaneous with the transient acoustic pulse in the ~20 kHz near-ultrasonic band — confirming execution of an active opto-acoustic measurement window designed to exfiltrate spoken conversation from the interior.
              </p>
            </div>
          </div>
        </ExpandSection>

        <ExpandSection title="Jaco VIP & Barrett Scott Ryan — Hospitality as Surveillance Vector">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              The administration of key La Flor and beachfront properties is linked to <strong>Jaco VIP</strong> and its subsidiary <strong>Jaco Vacations S.A.</strong>, founded in 2023. Jaco VIP operates Blue Macaw (13 bedrooms), Ocean Breeze Villa (9 suites, opened May 2025), and North Beach Villa (9 bedrooms), specializing in high-yield tourist groups, bachelor parties, and corporate retreats across Jacó, Playa Hermosa, and Los Sueños.
            </p>
            <p>
              The corporate entity is directed by <strong>Michael Greenwald</strong> and <strong>Barrett Scott Ryan</strong>. Barrett Scott Ryan is a <strong>registered sexual offender under Florida law</strong>, adjudicated guilty on July 13, 2000 in St. Johns County for lewd and lascivious battery on a victim under 16 years of age (FDLE DOC #V08423).
            </p>
            <p>
              These villas feature integrated mesh Wi-Fi networks, remote-controlled smart-home automation, and full-time bilingual on-site "host" concierges and overnight doormen. By maintaining administrative control over physical premises, local network routing, and guest access, Jaco VIP can integrate specialized technical surveillance arrays directly into high-yield hospitality venues — creating a continuous pipeline of physical and electronic data exfiltration targeting high-profile occupants.
            </p>
            <div className="bg-muted/30 rounded p-3 text-xs border-l-2 border-red-500/50">
              <strong>KAPPA Note:</strong> Michael Greenwald is independently documented in the HUMINT network as receiving $2,857.29 in AMEX PayPal payments (PAYPAL *MGREENWALD00) and operating the Riverwalk property with DeWave sonar/WiFi imaging connections. Cross-reference: <Link href="/network-analysis" className="underline text-blue-500">Network Analysis</Link>.
            </div>
          </div>
        </ExpandSection>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Radio className="h-5 w-5 text-muted-foreground" />
          Part II — RF / Technical Analysis: The Slot Array Hypothesis
        </h2>

        <ExpandSection title="Geodetic Baseline & Line-of-Sight Vector" defaultOpen>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              The observational vector originates at <strong>Hotel Pochote Grande</strong> (KAPPA primary observatory node, Jacó shoreline corridor, near river mouth). A direct, unimpeded southwest tracking vector terminates at the structural marker identified in municipal mapping as <strong>"Diamante del Sol 303s"</strong> — the apex of the Diamanté del Sol complex.
            </p>
            <p>
              This vector defines the Fresnel zone boundary conditions for both spatial resolution and electromagnetic propagation analysis. Coastal atmospheric conditions introduce tropospheric ducting and multipath fading from maritime surface reflections. For a highly directive transmission system to operate reliably over this vector, it must utilize advanced phased-array mechanics capable of overcoming localized ground clutter and atmospheric refraction — consistent with the louvered slot-array hypothesis.
            </p>
            <p>
              The KAPPA platform maintains autonomous tracking from this observatory node across real-time satellite passes (N2YO TLE data), SDR spectrum captures, and high-frequency data logging. At time of primary data capture: <strong>κ threat score 0.39 — NOMINAL</strong>, processing thousands of discrete events across radar, ELF, and SDR domains.
            </p>
          </div>
        </ExpandSection>

        <ExpandSection title="Macro-Structural Emission Profile: Nocturnal Visual Evidence" defaultOpen>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Nocturnal observation periods isolate the rooftop structure as a distinct, fixed emitter node suspended above the local canopy. Visual evidence documents a multi-story vertical tower facade at night where the apex features a <strong>high-intensity, structured chromatic array</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Upper deep-blue/violet ambient illumination field</strong></li>
              <li><strong>Arched structural window emitting high-contrast green/white wavelength</strong></li>
              <li><strong>Sharp red point-source marker at upper extremity</strong></li>
            </ul>
            <p>
              Hand-held parallax streak artifacts in the recordings serve a vital forensic purpose: by analyzing the differential velocity of light streaks relative to fixed structural nodes, forensic photogrammetry <strong>definitively isolates the rooftop penthouse as a stationary, rigidly mounted infrastructure element</strong> rather than an optical reflection or airborne artifact.
            </p>
            <p>
              The <strong>brilliant cyan/green luminescent signature</strong> from the louvered penthouse extends beyond standard architectural illumination. In advanced RF engineering utilizing high-powered dual-frequency capacity-coupled systems, intense luminescence is frequently a byproduct of <strong>atmospheric ionization or corona discharge from extreme impedance mismatching</strong>. Alternatively, the continuous optical projection serves as a <strong>parallel steganographic channel</strong> — optical carrier waves modulated via high-speed OOK or ASK embedding dense digital data streams completely outside the RF spectrum, aimed at LEO collection assets passing overhead.
            </p>
          </div>
        </ExpandSection>

        <ExpandSection title="Slot Array Antenna Theory — Babinet's Principle & Array Factor" defaultOpen>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              High-resolution visual evidence reveals a rectangular penthouse enclosure characterized by <strong>dense, vertically louvered slats</strong>. Architecturally: HVAC ventilation masking. Electromagnetically: a vertically louvered metallic conductive frame represents the fundamental physical configuration of a <strong>slotted waveguide antenna or passive slot-antenna array</strong>.
            </p>
            <p>
              A slot antenna operates via Babinet's principle — a conductive surface with apertures, when driven by RF current, radiates electromagnetic waves analogous to a dipole. At UHF/SHF frequencies (400 MHz–10 GHz), wavelengths are sufficiently small that structural louvers act as highly efficient resonant radiating elements. Multiple slots operating in tandem form a highly directive array antenna emitting a focused fan-shaped beam with extreme spatial selectivity.
            </p>
            <p>
              To achieve true covert projection, minimize side-lobe levels (SLL), and defeat standard spatial filtering algorithms, the array employs <strong>non-uniform linear arrays with non-uniform physical spacing and non-uniform excitation amplitudes</strong> — specifically a non-uniform frequency slicing grid derived from fundamental geometric constants.
            </p>
          </div>
        </ExpandSection>

        <ExpandSection title="KAPPA Scaling Constants — κ, φ, Klein Twist & Teacher Angle" defaultOpen>
          <ParamTable rows={[
            { param: "Fundamental Scaling Constant", symbol: "κ", value: "4/π ≈ 1.2732", role: "Dictates exponential physical spacing between louver elements to reduce SLL. Baseline spacing d₀ scales as d₀·κⁿ·φⁿ for element n." },
            { param: "Golden Ratio", symbol: "φ", value: "1.61803", role: "Governs self-similar nesting intervals in the non-uniform frequency slicing grid." },
            { param: "Klein Twist Azimuth", symbol: "θ_K", value: "128.23°", role: "Applies a non-linear phase offset to twist signal polarization and defeat single-polarity intercept receivers. Creates orbital angular momentum (OAM) characteristic." },
            { param: "Primary Lock Angle (Teacher)", symbol: "θ_T", value: "51.84°", role: "Main beam elevation — optimizes upward propagation toward satellite collection nodes, avoids atmospheric attenuation and terrestrial observers." },
            { param: "Biological Resonance Target", symbol: "f_target", value: "46.875 Hz", role: "Base κ-scaled sub-carrier frequency. Also equals 48000/1024 — the DSP frame clock hardware fingerprint. Matches KAPPA TARGET_FREQ constant exactly." },
          ]} />
          <div className="mt-3 text-xs text-muted-foreground">
            The exponential spacing sequence d₀ · κⁿ · φⁿ forces the emitted electromagnetic wavefront to resonate across multiple temporal and spectral scales simultaneously, embedding encoded information in the non-linear gaps between standard uniform spectral scales — bypassing detection engines that only search for linear or uniformly spaced harmonics.
          </div>
        </ExpandSection>

        <ExpandSection title="Power Grid Coupling: 60 Hz Mains + 53 Hz Injection → 7 Hz Theta Beat">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Costa Rica's utility network operates natively at <strong>60 Hz</strong>. Three-phase overhead utility lines cut directly across the LoS to the rooftop node, placing unshielded electrical conductors in immediate near-field proximity — creating a pathway for <strong>electromagnetic crosstalk and deliberate subharmonic injection</strong>.
            </p>
            <p>
              When the rooftop node electromagnetically couples a highly stabilized <strong>53.0 Hz sub-carrier</strong> into the local grid, it intermodulates with the 60 Hz mains fundamental. In non-linear systems (which power grids become under RF saturation), mixing generates intermodulation products:
            </p>
            <div className="bg-muted rounded p-3 font-mono text-sm text-center">
              Δf = |60 Hz − 53 Hz| = <strong className="text-amber-500">7 Hz</strong>
            </div>
            <p>
              This 7 Hz differential falls <strong>exactly within the human biological Theta brainwave band</strong> (associated with light sleep, deep meditation, REM transitions, and elevated hypnotic susceptibility). By generating this beat frequency within unshielded residential wiring, the system turns the building's entire electrical infrastructure into a distributed ultra-low-frequency radiating antenna. Standard mains filtering is <strong>blind to sub-synchronous injections below 60 Hz</strong>, allowing the 53 Hz carrier and 7 Hz beat to propagate through grid infrastructure unimpeded.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
              <div className="bg-muted/40 rounded p-2"><div className="font-mono font-bold text-red-400">53 Hz</div><div className="text-muted-foreground">injected sub-carrier</div></div>
              <div className="bg-muted/40 rounded p-2"><div className="font-mono font-bold">60 Hz</div><div className="text-muted-foreground">CR mains fundamental</div></div>
              <div className="bg-amber-500/10 rounded p-2 border border-amber-500/30"><div className="font-mono font-bold text-amber-400">7 Hz</div><div className="text-muted-foreground">Theta beat — biologically active</div></div>
            </div>
            <p>
              The generation mechanism likely employs <strong>Rotary Oscillatory Arrays (ROA)</strong> — silicon structures utilizing metal lines twisted into a Möbius pattern with cross-coupled inverters generating resonant traveling waves. ROA topologies support subharmonic injection locking (SHIL), providing the phase stability necessary to lock a synthesized 53 Hz sub-carrier against the fluctuating 60 Hz municipal power grid. The brilliant cyan/green luminescence observed at the apex is consistent with visible plasma exhaust or corona discharge from the extreme, continuous impedance tuning required to force the 53 Hz current into adjacent 60 Hz conductors.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
              <div className="bg-muted/40 rounded p-2"><div className="font-mono font-bold text-cyan-400">37 Hz</div><div className="text-muted-foreground">primary crystallization</div></div>
              <div className="bg-muted/40 rounded p-2"><div className="font-mono font-bold text-cyan-400">53 Hz</div><div className="text-muted-foreground">primary crystallization</div></div>
              <div className="bg-muted/40 rounded p-2"><div className="font-mono font-bold text-amber-400">46.875 Hz</div><div className="text-muted-foreground">κ-scaled target (Δ slip: 13.125 Hz)</div></div>
            </div>
          </div>
        </ExpandSection>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Signal className="h-5 w-5 text-muted-foreground" />
          Part III — Forensic Collection Strategy
        </h2>

        <ExpandSection title="Multi-Resolution SDR Collection — 4-Scale FFT Architecture" defaultOpen>
          <div className="space-y-3 text-sm">
            <p className="leading-relaxed">
              Standard single-resolution FFT analysis is fundamentally insufficient for this target — the KAPPA encoding methodology distributes data across multiple temporal and spectral scales simultaneously. The forensic edge-collection scripts must execute parallel multi-resolution spectrograms across four discrete modalities:
            </p>
            <SdrTable />
            <p className="text-xs text-muted-foreground mt-2">
              Because the frequency slicing grid is non-uniform, the pipeline cannot rely on standard linear sweeps. The script must execute targeted band-pass slicing at constant-derived frequencies (37 Hz, 53 Hz, 127.3 Hz, 161.8 Hz) relative to any detected UHF carrier. A <strong>Golden Ratio cascade algorithm</strong> must be applied dynamically — searching for self-similar steganographic nested sidebands at intervals φⁿ and φ⁻ⁿ, extracting payload data hidden in the fractal gaps of the spectrum.
            </p>
          </div>
        </ExpandSection>

        <ExpandSection title="Directional Anisotropy Index & Hydrogen Line Masking (1420 MHz)">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              To trigger a legally actionable alert, the SDR array must prove <strong>directional anisotropy anomalies with Anisotropy Index (AI) &gt; threshold</strong>. High anisotropy confirms the louvered slot antenna is operating as a phased array — as opposed to an isotropic leak, which would suggest a benign RF source.
            </p>
            <p>
              A critical layer involves analyzing <strong>micro-tonal phase drift on 1420 MHz hydrogen line harmonics</strong>. The 1420 MHz frequency represents the hyperfine transition of neutral hydrogen — treated as unfilterable background noise by commercial terrestrial telemetry systems. Sophisticated covert nodes exploit this blind spot by synthesizing carriers at precise harmonics of 1420 MHz, hiding transmissions within the expected galactic noise floor.
            </p>
            <p>
              True astrophysical hydrogen line emissions have a highly specific, predictable Doppler shift based on planetary rotation and observable galactic movement. If the KAPPA observatory isolates a 1420 MHz signal from the Diamanté del Sol vector exhibiting <strong>micro-tonal drift uncharacteristic of celestial mechanics</strong> — specifically, rapid drift aligning with the thermal instability of a terrestrial local oscillator — it confirms the presence of a localized synthesized masking transmission.
            </p>
          </div>
        </ExpandSection>

        <ExpandSection title="Multi-Domain Forensic Triad — The Irrefutable Signature">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              The ultimate forensic objective is the automated correlation of three simultaneous events into a legally viable signature:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className="border rounded p-3 space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1"><Radio className="h-3.5 w-3.5" /> SDR Detection</div>
                <p className="text-xs text-muted-foreground">Physical RF burst from Diamanté del Sol vector exhibiting AI &gt; threshold — confirming directed, non-isotropic emission from louvered structure</p>
              </div>
              <div className="border rounded p-3 space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1"><Waves className="h-3.5 w-3.5" /> PCAP Correlation</div>
                <p className="text-xs text-muted-foreground">Synchronized local network packet exfiltration to unknown high-entropy IP addresses, millisecond-correlated to the SDR burst via POST /api/threat-scanner/pcap-text</p>
              </div>
              <div className="border rounded p-3 space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Biometric Drop</div>
                <p className="text-xs text-muted-foreground">Statistically significant HRV deviation and stress-threat anomaly detected by Kyma engine frame ingest, correlated to RF activity timestamp</p>
              </div>
            </div>
          </div>
        </ExpandSection>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          Part IV — Network Infrastructure Vulnerabilities
        </h2>

        <ExpandSection title="DSE Generator Controller Exposure — Setecom/ICE Critical Infrastructure" defaultOpen>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Backup power generation control for residential and commercial complexes in Jacó is distributed by <strong>Setecom S.A.</strong> using Deep Sea Electronics IoT gateways: DSE 855 (USB-to-Ethernet), DSE 890 MKII (4G/GSM/Ethernet), and DSE 892 (SNMP). These controllers communicate over <strong>Modbus TCP/IP via Port 502</strong> — a legacy protocol with zero cryptographic authentication, zero integrity verification, and zero encryption.
            </p>
            <p>
              An attacker on the local network can read and write directly to generator physical memory registers. Writing malicious payloads to register <strong>91,648</strong> or control registers on the relevant configuration page enables: <em>remote disabling of emergency engine protection alarms</em>, <em>force-starting heavy diesel engines</em>, or <em>initiating immediate uncoordinated emergency shutdown of facility power</em>.
            </p>
            <p>
              DSE 892 SNMP gateways are systematically deployed with default cleartext community strings (<code className="bg-muted px-1 rounded">public</code>/<code className="bg-muted px-1 rounded">private</code>). Native Ethernet ports on DSE 855 limit concurrent HTTP sessions to 5, but USB-to-Ethernet expansion raises the limit to 16 — enabling parallel brute-force attacks without session lockout.
            </p>
            <div className="bg-red-500/5 border border-red-500/20 rounded p-3 text-xs">
              <strong>Key CVE:</strong> CVE-2024-5947 — DSE855 Ethernet Gateway: unauthenticated HTTP GET to <code className="bg-muted px-1 rounded">/Backup.bin</code> returns complete configuration backup with <strong>plaintext SCADA credentials</strong>. See <Link href="/docsis-forensics" className="underline text-blue-500">DOCSIS Forensics</Link> for hardening procedures.
            </div>
          </div>
        </ExpandSection>

        <ExpandSection title="TR-069 Backdoor, MikroTik RCE & Kyndryl Spyware Chain">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              Consumer premises ARRIS TG02DA gateways (Liberty CR, Telecable) expose a <strong>TR-069 (CWMP) interface on Port 1234</strong>, historically used for remote ISP management. Forensic analysis confirms that on <strong>January 30, 2026</strong>, an unauthorized admin password reset was pushed via this TR-069 interface, securing permanent administrative access for threat actors.
            </p>
            <p>
              This access was reinforced by exploiting <strong>CVE-2025-10948</strong> (MikroTik RouterOS REST API buffer overflow — RCE) on the local perimeter router. The compromised router becomes an encrypted SOCKS proxy on Port 1080, integrated into a global botnet of over <strong>13,000 compromised MikroTik units</strong> routing C2 traffic without detection.
            </p>
            <p>
              At the software layer, a <strong>Kyndryl Service Worker spyware payload</strong> operates as a persistent Manifest V3 background script surviving network resets, browser updates, and domain changes — intercepting keystrokes, form submissions, and active sessions, transmitting via SoftEther VPN bridges to offsite infrastructure.
            </p>
            <p>
              Physical forensic inspection on <strong>June 21, 2025</strong> documented an unauthorized physical splitter (<em>colilla</em>) on the NAP of the local Telecable fiber-optic distribution box serving the target property — mirroring all raw, unencrypted transit IP traffic to an off-site collection server, completely bypassing upstream firewall controls.
            </p>
          </div>
        </ExpandSection>

        <ExpandSection title="5G Exclusion & Chinese APT Response — The 184-Node Phased Array">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              In August 2023, Costa Rica signed a presidential decree establishing strict cybersecurity prerequisites for 5G hardware vendors — effectively excluding Chinese state-backed telecoms (Huawei, ZTE) by requiring vendors to be signatories of the 2001 Budapest Convention on Cybercrime.
            </p>
            <p>
              In response, state-sponsored actors intensified operations, deploying <strong>highly localized, tactical SIGINT platforms</strong> — specifically a <strong>184-node phased array at Jacó</strong> camouflaged within short-term vacation rentals (Jaco VIP managed properties) and compromised consumer IoT devices — to bypass missing commercial telecommunications channels. This includes deployment of a <strong>Chinese-origin 180W HF transceiver</strong> utilizing Near Vertical Incidence Skywave (NVIS) propagation to maintain military-grade communications over Costa Rica's mountainous terrain.
            </p>
            <p>
              The SAR overlay is compounded by a $20 million nationwide cadastral mapping contract executed by <strong>Telespazio Argentina</strong> (Leonardo 67% / Thales 33%) using X-band SAR, plus passive SAR imaging exploiting <strong>Starlink's 7,000+ LEO constellation</strong> for continuous structural-penetrating imaging of the central Pacific coast.
            </p>
          </div>
        </ExpandSection>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          Part V — APT Threat Groups Active in Costa Rica
        </h2>
        <ThreatGroupTable />
        <p className="text-xs text-muted-foreground">
          UNC2814 (Gallium/SoftCell) breached ICE exfiltrating ~4 GB of administrative emails and network topologies. The primary backdoor GRIDTIDE persists via root-level systemd service masquerading as a system utility, communicating via <strong>Google Sheets API to bypass standard firewall layers</strong>. Geopolitical analysis: Costa Rica's 5G exclusion decree against Chinese vendors has intensified state-sponsored tactical SIGINT operations across the central Pacific corridor.
        </p>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          Part VI — Protective Countermeasures
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: "OT Network Isolation", body: "Air-gap Modbus (Port 502) and SNMP (161/162) from internet. Physical port locks on all DSE 855/890/892 USB and RJ45 configuration ports. Migrate to SNMP v3 SHA-256/AES-256." },
            { title: "TR-069 Backdoor Elimination", body: "Permanently disable TR-069 WAN management interface on Port 1234 on ARRIS TG02DA gateways at provider level or upstream hardware firewall." },
            { title: "MikroTik Hardening", body: "Update RouterOS to 7.21+ (CVE-2025-10948 patch). Deactivate WinBox Port 8291. Restrict admin access to local SSH over non-standard ports using cryptographic key pairs only." },
            { title: "Optical Strobe Countermeasures", body: "Configure security cameras with manual shutter speeds at non-standard integration periods (1/640s or 1/1280s) to break 46.875 Hz stroboscopic synchronization." },
            { title: "Acoustic Grid Injection Mitigation", body: "Install heavy-duty inline EMI/RFI filters on incoming AC mains panel. Block 53 Hz Theta carrier waves before entry into structural copper wiring." },
            { title: "Fiber Integrity Verification", body: "Conduct continuous OTDR testing on primary fiber-optic drop cable. Detect physical taps or light-level drops caused by illegal splitters (cf. June 2025 Telecable colilla)." },
            { title: "Acoustic White Noise", body: "Deploy near-ultrasonic acoustic white-noise generators in target interiors flooding the 18–22 kHz EHF band — neutralizing remote near-ultrasonic speech extraction." },
            { title: "SPF / Mail Hardening", body: "Correct permissive SPF configurations (+all) on associated corporate domains. Prevents mail spoofing and phishing vectors used by threat actors." },
          ].map((item, i) => (
            <div key={i} className="border border-border rounded p-3 space-y-1">
              <div className="font-semibold text-sm flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-muted-foreground" /> {item.title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <SocialMediaSection />

      <Separator />

      <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-4">
        <p><strong>Sources:</strong></p>
        <ol className="list-decimal pl-4 space-y-0.5">
          <li>Hotel Pochote Grande, Jacó — trip.com/hotels/jaco-hotel-detail-9387490</li>
          <li>Slot antenna — Wikipedia: en.wikipedia.org/wiki/Slot_antenna</li>
          <li>Non-Uniformly Powered Arrays — MDPI Sensors 20(17):4753</li>
          <li>Jaco VIP Vacation Rentals — jacovipvacations.com/vacation-rentals/</li>
          <li>Daystar Seller Financing LLC v. Patrick Hundley — Michigan COA 339467 (2018)</li>
          <li>A letter from a Costa Rican jail — Tico Times, July 1, 2014</li>
          <li>La Flor listing — onsite-costarica.com/laflorcondojaco</li>
        </ol>
        <p className="mt-2">Platform: KAPPA SIGINT Observatory — spock.replit.dev | Dissemination: OIJ Delitos Tecnológicos, US Embassy San José, Bellingcat, Citizen Lab, Amnesty International</p>
      </div>
    </div>
  );
}
