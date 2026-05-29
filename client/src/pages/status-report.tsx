import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useSiteMode } from "@/lib/site-mode";
import { useLocation } from "wouter";
import {
  Terminal, LayoutDashboard, Activity, Link2, Satellite, Server, Wrench,
  MapIcon, Fingerprint, Search, Crosshair, FlaskConical, Brain, Sparkles,
  Hexagon, Image, Microscope, ScanEye, Network, Orbit, Atom, Radio,
  BookOpen, Shield, FileWarning, Database, Globe, Building2, RotateCw,
  Waves, Cpu, Mic, Camera, AlertTriangle, Film, Newspaper, Hash, Zap,
  CheckCircle2, ExternalLink, ArrowRight, Layers,
} from "lucide-react";
import type { KappaStatus } from "@shared/schema";

const MODULES: Array<{
  group: string;
  items: Array<{ name: string; path: string; icon: any; desc: string; status?: "live" | "stable" | "beta" }>;
}> = [
  {
    group: "EVIDENCE & FORENSICS",
    items: [
      { name: "SETECOM Exposé", path: "/setecom", icon: AlertTriangle, desc: "Full SETECOM infrastructure exposure report", status: "live" },
      { name: "CIAJW Home", path: "/whistleblower", icon: Shield, desc: "Case overview and whistleblower portal", status: "live" },
      { name: "Evidence Chain", path: "/evidence", icon: FileWarning, desc: "SHA-256 signed evidence log with HTML export", status: "live" },
      { name: "Audio Recordings", path: "/audio", icon: Mic, desc: "Audio forensics vault with waveform analysis", status: "live" },
      { name: "Video Forensics", path: "/video-forensics", icon: Camera, desc: "Frame extraction, object tracking, trajectory maps", status: "live" },
      { name: "Network Forensics", path: "/forensics", icon: Network, desc: "12 real forensic checks against documented indicators", status: "live" },
      { name: "Conspiracy Board", path: "/board", icon: Globe, desc: "Force-directed evidence graph with 31+ items, 6 clusters", status: "stable" },
      { name: "Suites Cristina", path: "/cristina", icon: Building2, desc: "Property intelligence dossier", status: "stable" },
      { name: "Jacó Valley 3D", path: "/jaco", icon: Globe, desc: "WebGPU terrain map", status: "beta" },
      { name: "C-UAS Intel Library", path: "/drone-intel", icon: Shield, desc: "Counter-UAS intel and threat profiles", status: "live" },
      { name: "Drone Dogfight", path: "/game", icon: Crosshair, desc: "Tactical drone intercept simulation", status: "stable" },
      { name: "Pochote Analysis", path: "/pochote", icon: Layers, desc: "Pochote infrastructure analysis", status: "stable" },
    ],
  },
  {
    group: "COMMAND & CONTROL",
    items: [
      { name: "Command Center", path: "/command", icon: Terminal, desc: "Chat/command interface with live data feed", status: "live" },
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, desc: "Platform overview and KAPPA score readout", status: "live" },
      { name: "Status Report", path: "/status", icon: CheckCircle2, desc: "This page — full platform inventory", status: "live" },
    ],
  },
  {
    group: "MONITOR",
    items: [
      { name: "Events", path: "/events", icon: Activity, desc: "Live event stream from all collectors", status: "live" },
      { name: "Correlations", path: "/correlations", icon: Link2, desc: "22-rule auto-correlator with deduplication", status: "live" },
      { name: "Hypervisor", path: "/hypervisor", icon: Brain, desc: "Adaptive Pipeline Orchestrator — KAPPA engine control", status: "live" },
      { name: "Map", path: "/map", icon: MapIcon, desc: "Leaflet/OSM live event map", status: "live" },
      { name: "Seismic KAPPA", path: "/seismic", icon: Waves, desc: "Multi-agency seismic feed correlation", status: "live" },
      { name: "Cortex Bus", path: "/cortex-bus", icon: Network, desc: "Inter-subsystem message bus monitor", status: "beta" },
      { name: "ATLANTIS Hub", path: "/atlantis", icon: Waves, desc: "FMO lattice hub — Satoshi/Leech/48-layer correlator", status: "live" },
    ],
  },
  {
    group: "FORENSICS",
    items: [
      { name: "Devices", path: "/devices", icon: Fingerprint, desc: "Device fingerprinting and MAC/OUI lookup", status: "live" },
      { name: "Bettercap Bridge", path: "/bettercap", icon: Radio, desc: "React UI for bettercap instance management", status: "stable" },
      { name: "Forensic Hypervisor", path: "/forensic-hypervisor", icon: Crosshair, desc: "24/7 autonomous SQL pattern mining and PCAP analysis", status: "live" },
    ],
  },
  {
    group: "SIGINT",
    items: [
      { name: "KiwiSDR Nodes", path: "/nodes", icon: Server, desc: "71 targets across 33 nodes — 8 priority CA/Caribbean", status: "live" },
      { name: "Satellites", path: "/satellites", icon: Satellite, desc: "CelesTrak TLE tracking + BLACKJACK MANDRAKE intel", status: "live" },
      { name: "Bio-Acoustic Correlator", path: "/bio-acoustic", icon: Activity, desc: "WiFi CSI phase / Chitin Transduction Layer analysis", status: "beta" },
      { name: "Lattice", path: "/lattice", icon: Hexagon, desc: "Signal lattice — FMO entity correlation grid", status: "live" },
      { name: "Superposition", path: "/superposition", icon: Atom, desc: "Quantum Cortex — bio-quantum neural architecture", status: "beta" },
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      { name: "OSINT", path: "/osint", icon: Search, desc: "Open source intelligence aggregation", status: "live" },
      { name: "Intel Reports", path: "/intelligence", icon: Sparkles, desc: "LLM-generated correlation summaries via gpt-4o-mini", status: "live" },
      { name: "Research", path: "/research", icon: Microscope, desc: "Research corpus with claim extraction", status: "live" },
      { name: "Deep Research", path: "/deep-research", icon: Orbit, desc: "12D-TRE — recursive 5-layer query engine", status: "live" },
      { name: "Local LLM", path: "/local-llm", icon: Cpu, desc: "Local LLM inference hypervisor", status: "stable" },
      { name: "Meridian Hypervisor", path: "/meridian", icon: Atom, desc: "FMO entity lattice + GOS Oracle split-test engine", status: "live" },
      { name: "Research Cortex", path: "/cortex", icon: BookOpen, desc: "Auto-indexed doc corpus with synthesis and export", status: "live" },
      { name: "Memory Cortex", path: "/memory", icon: Database, desc: "Semantic vector memory with multi-provider embeddings", status: "live" },
      { name: "Imagery", path: "/imagery", icon: ScanEye, desc: "Image analysis and KiwiSDR Vision Hypervisor output", status: "live" },
      { name: "Ω-GOS 7/4 LNN", path: "/omega-gos", icon: Atom, desc: "8-agent LLM pipeline with specialized math frameworks", status: "live" },
      { name: "Ω-REEL", path: "/reel", icon: Film, desc: "Temporal reel of Ω-GOS outputs", status: "stable" },
      { name: "Media Pitch", path: "/media-pitch", icon: Newspaper, desc: "AI-generated press kit and media outreach materials", status: "live" },
      { name: "Satoshi Lattice", path: "/satoshi-lattice", icon: Hash, desc: "4096-vertex Satoshi lattice signal correlation", status: "live" },
      { name: "Quantum Solver", path: "/quantum-solver", icon: Zap, desc: "Quantum-inspired optimization solver", status: "beta" },
    ],
  },
  {
    group: "OPERATIONS",
    items: [
      { name: "Fleet Tracker", path: "/fleet", icon: Radio, desc: "External device fleet with heartbeat/jitter/uptime", status: "live" },
      { name: "Karachi", path: "/karachi", icon: Crosshair, desc: "Karachi operation intelligence board", status: "stable" },
      { name: "Congusto", path: "/congusto", icon: FlaskConical, desc: "Congusto operation analysis suite", status: "stable" },
      { name: "ICE Briefing", path: "/gallium", icon: Globe, desc: "Gallium — ICE/law enforcement briefing package", status: "stable" },
      { name: "Social Studio", path: "/social", icon: Image, desc: "Dark infographic card generator from live KAPPA data", status: "stable" },
      { name: "Tools", path: "/tools", icon: Wrench, desc: "RF scanners, ELF scans, KiwiSDR target table, PCAP×ELF cross-domain", status: "live" },
    ],
  },
  {
    group: "PUBLIC / GOOSE GAZETTE",
    items: [
      { name: "Goose Gazette", path: "/goose", icon: Newspaper, desc: "Satirical intelligence newspaper — primary cover site", status: "live" },
      { name: "Goose Signals", path: "/goose/signals", icon: Activity, desc: "Goose Gazette signal feed", status: "live" },
      { name: "Goose Editorial", path: "/goose/editorial", icon: BookOpen, desc: "AI-generated editorial suite", status: "live" },
      { name: "Drone Blog", path: "/goose/drone", icon: Camera, desc: "Drone sighting reports in gazette format", status: "live" },
      { name: "Press Room", path: "/goose/press-room", icon: Newspaper, desc: "Gazette Refiner — headline polishing engine", status: "stable" },
      { name: "Hyperobject Intel", path: "/hyperobjects", icon: Atom, desc: "⬡ Hyperobject correlation matrix", status: "beta" },
      { name: "Atlas Observatory", path: "/atlas", icon: ScanEye, desc: "Global signal atlas — public-facing observatory", status: "stable" },
    ],
  },
];

const STATUS_COLORS = {
  live:   { dot: "#22c55e", label: "LIVE",   bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
  stable: { dot: "#3b82f6", label: "STABLE", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)" },
  beta:   { dot: "#f59e0b", label: "BETA",   bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
};

export default function StatusReportPage() {
  const { data: kappa } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 10000,
  });

  const { toggle, mode } = useSiteMode();
  const [, navigate] = useLocation();

  const handleModeSwitch = () => {
    toggle();
    navigate(mode === "kappa" ? "/" : "/command");
  };

  const score = kappa?.score ?? 0;
  const totalModules = MODULES.reduce((a, g) => a + g.items.length, 0);
  const liveCount = MODULES.flatMap(g => g.items).filter(i => i.status === "live").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 font-sans">
      {/* Header */}
      <div className="mb-10 border-b border-border pb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-2">
              KAPPA SECURE INTEL — PLATFORM STATUS
            </div>
            <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground mb-1">
              System Status Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Full inventory of all active platform modules — generated {new Date().toLocaleString()}
            </p>
          </div>
          <div className="text-right shrink-0 ml-8">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">KAPPA SCORE</div>
            <div className="text-3xl font-mono font-bold" style={{ color: score > 50 ? "#ef4444" : score > 25 ? "#f59e0b" : "#22c55e" }}>
              {score.toFixed(1)} κ
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Modules", value: totalModules, color: "#6366f1" },
            { label: "LIVE", value: liveCount, color: "#22c55e" },
            { label: "Active Mode", value: "CIA JW", color: "#3b82f6" },
          ].map(c => (
            <div key={c.label} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{c.label}</div>
              <div className="text-2xl font-mono font-semibold mt-1" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Module groups */}
      {MODULES.map(group => (
        <div key={group.group} className="mb-10">
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-4 border-b border-border pb-2">
            {group.group}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {group.items.map(item => {
              const st = item.status ?? "stable";
              const sc = STATUS_COLORS[st];
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div className="group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-card transition-all cursor-pointer">
                    <div className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span
                          className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full border"
                          style={{ color: sc.dot, background: sc.bg, borderColor: sc.border }}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="border-t border-border pt-6 mt-4">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>KAPPA SECURE INTEL — SYSTEM 4.2.1 ACTIVE</span>
          <span>{new Date().toISOString()}</span>
        </div>
      </div>
    </div>
  );
}
