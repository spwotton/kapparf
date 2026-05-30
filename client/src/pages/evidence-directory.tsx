import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Radio, Network, FileText, Map, Shield, Cpu,
  Activity, Mic, Video, Zap, ExternalLink, Database
} from "lucide-react";

const SECTIONS = [
  {
    id: "signal",
    icon: Mic,
    title: "Signal Captures",
    subtitle: "Audio · Ultrasound · Spectrogram",
    description: "18.6 kHz tonal bursts — 76 events in IMG_0316, 0 in all indoor/negative controls. Multirotor rotor fundamental 85–127 Hz across 3 clips.",
    links: [
      { label: "Audio Forensics", href: "/audio" },
      { label: "Video Forensics", href: "/video-forensics" },
      { label: "Bio-Acoustic Monitor", href: "/bio-acoustic" },
    ],
    accent: "border-amber-300 dark:border-amber-700",
    badge: "18.6 kHz CONFIRMED",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    id: "network",
    icon: Network,
    title: "Network Forensics",
    subtitle: "PCAP · Packet Analysis · Intrusion",
    description: "TR-069 remote router resets, ePDG Liberty routing, HiPerConTracer probes, Samsung DTIgnite telemetry, Facebook Netseer tracking. 06:30 traffic spike correlation.",
    links: [
      { label: "Network Forensics", href: "/forensics" },
      { label: "Network Analysis", href: "/network-analysis" },
      { label: "Bettercap", href: "/bettercap" },
    ],
    accent: "border-blue-300 dark:border-blue-700",
    badge: "PCAP EVIDENCE",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "chain",
    icon: Shield,
    title: "Chain of Custody",
    subtitle: "SHA-256 · Legal-grade · Timeline",
    description: "Immutable evidence log with SHA-256 integrity hashing, unified incident timeline, and HTML export. Covers 18 months of documented events.",
    links: [
      { label: "Evidence Chain", href: "/evidence" },
      { label: "Forensic Hypervisor", href: "/forensic-hypervisor" },
    ],
    accent: "border-green-300 dark:border-green-700",
    badge: "INTEGRITY VERIFIED",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    id: "rf",
    icon: Radio,
    title: "RF & Spectrum",
    subtitle: "KiwiSDR · HF · ELF · 7410 kHz",
    description: "Hector Mora 180W HF station at 7410 kHz. KiwiSDR scans across 33 nodes. ELF anomalous 50 Hz vs CR 60 Hz mains. Full spectrum pipeline documentation.",
    links: [
      { label: "Tools & RF Scanners", href: "/tools" },
      { label: "Imagery / Spectrograms", href: "/imagery" },
      { label: "Seismic & ELF", href: "/seismic" },
    ],
    accent: "border-purple-300 dark:border-purple-700",
    badge: "7410 kHz LOGGED",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    id: "humint",
    icon: Map,
    title: "HUMINT & Locations",
    subtitle: "Jacó · La Flor · Breakwater · El Mirador",
    description: "La Flor #9 (Carmen Gray), #14 (Toronto Lindsay/Michelle/Bob), Dan/Villa Real, Brian/Hermosa Bungalows, Peralta houses. Parametric emitters at El Mirador + La Flor garage. Ceiling lowered 3ft at Breakwater April 2025.",
    links: [
      { label: "Jacó Incident Map", href: "/jaco" },
      { label: "Network Analysis", href: "/network-analysis" },
      { label: "Correlations", href: "/correlations" },
    ],
    accent: "border-red-300 dark:border-red-700",
    badge: "6 CLUSTERS",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  {
    id: "intel",
    icon: FileText,
    title: "Intelligence Reports",
    subtitle: "HUMINT · Dossiers · Operators",
    description: "Setecom S.A. / Mora Marín dossier. COSMO-SkyMed / Telespazio Argentina cadastral contract 2019LN-000002-0005900001. Cy4gate D-SINT targeting analysis. Scott Ryan / Jaco Vacation network.",
    links: [
      { label: "Setecom / Mora Dossier", href: "/setecom" },
      { label: "Intelligence", href: "/intelligence" },
      { label: "Drone Intel", href: "/drone-intel" },
    ],
    accent: "border-slate-400 dark:border-slate-500",
    badge: "ITALIAN CONNECTION",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    id: "satellite",
    icon: Zap,
    title: "Satellite & Orbital",
    subtitle: "COSMO-SkyMed · Blackjack · TLE",
    description: "DARPA Blackjack / SSC-CASINO OSINT. COSMO-SkyMed CSG SAR calibration grid at 10°N. LeoLabs CRSR Filadelfia 10°36'42.2\" N. TLE consistency checks.",
    links: [
      { label: "Satellites", href: "/satellites" },
      { label: "Fleet Tracker", href: "/fleet" },
      { label: "Atlas Observatory", href: "/atlas" },
    ],
    accent: "border-cyan-300 dark:border-cyan-700",
    badge: "ORBITAL CONFIRMED",
    badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  {
    id: "live",
    icon: Activity,
    title: "Live Correlation Engine",
    subtitle: "KAPPA Score · 22 Rules · Real-time",
    description: "Auto-correlator running 22 rules across satellite, ELF, and network domains. Forensic hypervisor SQL pattern mining every 30 min. Current κ = live.",
    links: [
      { label: "Events Feed", href: "/events" },
      { label: "Correlations", href: "/correlations" },
      { label: "Hypervisor", href: "/hypervisor" },
    ],
    accent: "border-emerald-300 dark:border-emerald-700",
    badge: "LIVE",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];

export default function EvidenceDirectoryPage() {
  const { data: kappaStatus } = useQuery<{ score: number; level: string; eventCount: number; correlationCount: number }>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold tracking-tight">KAPPA Evidence Directory</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">— Jacó, Puntarenas · Dec 2024–present</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Lede */}
        <div className="mb-8 pb-6 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight mb-2">18-Month Surveillance Documentation</h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Technical and forensic record of an electronic harassment and drone surveillance operation in Costa Rica. 
            All data sourced from real captures — audio, PCAP, RF, HUMINT, satellite OSINT. Zero synthetic or reconstructed evidence.
          </p>
          {kappaStatus && (
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono">
              <span className="text-muted-foreground">κ score <span className="text-foreground font-bold">{kappaStatus.score?.toFixed(1)}</span></span>
              <span className="text-muted-foreground">events <span className="text-foreground font-bold">{kappaStatus.eventCount?.toLocaleString()}</span></span>
              <span className="text-muted-foreground">correlations <span className="text-foreground font-bold">{kappaStatus.correlationCount?.toLocaleString()}</span></span>
              <span className="text-muted-foreground">threat <span className="text-foreground font-bold">{kappaStatus.level}</span></span>
            </div>
          )}
        </div>

        {/* Key finding banner */}
        <div className="mb-8 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-4">
          <div className="flex items-start gap-3">
            <Mic className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">Primary acoustic finding — 18.6 kHz tonal signature</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                76 tonal bursts in IMG_0316 (24s drone-overhead clip). Peak: t=20.03s, f=18,666 Hz, 3003× quiet-band baseline. 
                Zero bursts in 201s lossless FLAC negative control, all indoor/ambient captures, and 8 cross-location recordings. 
                Signature is drone-locked, not codec or location-locked. Consistent with ≥60 kHz parametric carrier (Pompei US 8,027,488) aliasing at 48 kHz sampling.
              </p>
            </div>
          </div>
        </div>

        {/* Section grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                data-testid={`evidence-card-${s.id}`}
                className={`rounded-lg border-2 ${s.accent} bg-card p-5 flex flex-col gap-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-semibold leading-tight">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground tracking-wide uppercase mt-0.5">{s.subtitle}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded shrink-0 ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>

                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  {s.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      data-testid={`link-evidence-${s.id}-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-primary border border-border rounded px-2 py-0.5 transition-colors"
                    >
                      {l.label}
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            KAPPA Signal Intelligence Platform · All evidence real captures only · No synthetic data
          </p>
          <Link href="/evidence" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
            Full chain of custody →
          </Link>
        </div>
      </main>
    </div>
  );
}
