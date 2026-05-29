import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Terminal,
  LayoutDashboard,
  Activity,
  Link2,
  Satellite,
  Server,
  Wrench,
  MapIcon,
  Fingerprint,
  Search,
  Crosshair,
  FlaskConical,
  Brain,
  Sparkles,
  Hexagon,
  Image,
  Microscope,
  ScanEye,
  Network,
  Orbit,
  Atom,
  Radio,
  BookOpen,
  Shield,
  FileWarning,
  Database,
  Globe,
  Building2,
  RotateCw,
  Waves,
  Cpu,
  Mic,
  Camera,
  AlertTriangle,
  Film,
  Newspaper,
  Hash,
  Zap,
  ClipboardList,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useDossier } from "@/lib/dossier";
import { useSiteMode } from "@/lib/site-mode";
import { type KappaStatus, type PhoenixCountdown, THREAT_LEVELS } from "@shared/schema";

function HiddenBookshelf() {
  const { toggleDossierMode } = useDossier();
  const clicksRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    clicksRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { clicksRef.current = 0; }, 5000);
    if (clicksRef.current >= 3) {
      clicksRef.current = 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      toggleDossierMode();
    }
  }, [toggleDossierMode]);

  return (
    <div
      onClick={handleClick}
      title="📚"
      data-testid="bookshelf-hidden"
      style={{ cursor: "default", display: "flex", gap: "2px", alignItems: "flex-end", opacity: 0.35 }}
    >
      {[
        { h: 22, w: 6, color: "#6366f1" },
        { h: 18, w: 5, color: "#8b5cf6" },
        { h: 24, w: 7, color: "#0891b2" },
        { h: 16, w: 5, color: "#059669" },
        { h: 20, w: 6, color: "#d97706" },
        { h: 19, w: 5, color: "#9333ea" },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            width: b.w,
            height: b.h,
            background: b.color,
            borderRadius: "1px 1px 0 0",
          }}
        />
      ))}
    </div>
  );
}

function getThreatColor(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].color;
  }
  return THREAT_LEVELS[0].color;
}

interface NavItem {
  titleKey: string;
  fallback: string;
  url: string;
  icon: typeof Terminal;
}

interface NavGroup {
  labelKey: string;
  fallbackLabel: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: "sidebar.evidence", fallbackLabel: "EVIDENCE",
    items: [
      { titleKey: "sidebar.setecomExpose", fallback: "SETECOM Exposé", url: "/setecom", icon: AlertTriangle },
      { titleKey: "sidebar.ciajwHome", fallback: "CIAJW Home", url: "/whistleblower", icon: Shield },
      { titleKey: "sidebar.evidenceChain", fallback: "Evidence Chain", url: "/evidence", icon: FileWarning },
      { titleKey: "sidebar.audioForensics", fallback: "Audio Recordings", url: "/audio", icon: Mic },
      { titleKey: "sidebar.videoForensics", fallback: "Video Forensics Vault", url: "/video-forensics", icon: Mic },
      { titleKey: "sidebar.networkForensics", fallback: "Network Forensics", url: "/forensics", icon: Network },
      { titleKey: "sidebar.board", fallback: "Board", url: "/board", icon: Globe },
      { titleKey: "sidebar.cristina", fallback: "Suites Cristina", url: "/cristina", icon: Building2 },
      { titleKey: "sidebar.jaco", fallback: "Jacó Valley 3D", url: "/jaco", icon: Globe },
      { titleKey: "sidebar.droneIntel", fallback: "C-UAS Intel Library", url: "/drone-intel", icon: Shield },
      { titleKey: "sidebar.game", fallback: "Drone Dogfight", url: "/game", icon: Crosshair },
      { titleKey: "sidebar.spokeWheel", fallback: "24-Gon Spoke Wheel", url: "/spoke-wheel", icon: RotateCw },
    ],
  },
  {
    labelKey: "sidebar.command", fallbackLabel: "COMMAND",
    items: [
      { titleKey: "sidebar.commandCenter", fallback: "Command Center", url: "/command", icon: Terminal },
      { titleKey: "sidebar.dashboard", fallback: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { titleKey: "sidebar.statusReport", fallback: "Status Report", url: "/status", icon: ClipboardList },
    ],
  },
  {
    labelKey: "sidebar.monitor", fallbackLabel: "MONITOR",
    items: [
      { titleKey: "sidebar.events", fallback: "Events", url: "/events", icon: Activity },
      { titleKey: "sidebar.correlations", fallback: "Correlations", url: "/correlations", icon: Link2 },
      { titleKey: "sidebar.hypervisor", fallback: "Hypervisor", url: "/hypervisor", icon: Brain },
      { titleKey: "sidebar.map", fallback: "Map", url: "/map", icon: MapIcon },
      { titleKey: "sidebar.seismicKappa", fallback: "Seismic KAPPA", url: "/seismic", icon: Waves },
      { titleKey: "sidebar.cortexBus", fallback: "Cortex Bus", url: "/cortex-bus", icon: Network },
      { titleKey: "sidebar.atlantis", fallback: "ATLANTIS", url: "/atlantis", icon: Waves },
    ],
  },
  {
    labelKey: "sidebar.forensics", fallbackLabel: "FORENSICS",
    items: [
      { titleKey: "sidebar.devices", fallback: "Devices", url: "/devices", icon: Fingerprint },
      { titleKey: "sidebar.bettercap", fallback: "Bettercap", url: "/bettercap", icon: Radio },
      { titleKey: "sidebar.forensicHypervisor", fallback: "Forensic Hypervisor", url: "/forensic-hypervisor", icon: Crosshair },
    ],
  },
  {
    labelKey: "sidebar.sigint", fallbackLabel: "SIGINT",
    items: [
      { titleKey: "sidebar.kiwiNodes", fallback: "KiwiSDR Nodes", url: "/nodes", icon: Server },
      { titleKey: "sidebar.satellites", fallback: "Satellites", url: "/satellites", icon: Satellite },
      { titleKey: "sidebar.bioAcoustic", fallback: "Bio-Acoustic Correlator", url: "/bio-acoustic", icon: Activity },
      { titleKey: "sidebar.lattice", fallback: "Lattice", url: "/lattice", icon: Hexagon },
      { titleKey: "sidebar.superposition", fallback: "Superposition", url: "/superposition", icon: Atom },
    ],
  },
  {
    labelKey: "sidebar.intelligence", fallbackLabel: "INTELLIGENCE",
    items: [
      { titleKey: "sidebar.osint", fallback: "OSINT", url: "/osint", icon: Search },
      { titleKey: "sidebar.intelReports", fallback: "Intel Reports", url: "/intelligence", icon: Sparkles },
      { titleKey: "sidebar.research", fallback: "Research", url: "/research", icon: Microscope },
      { titleKey: "sidebar.deepResearch", fallback: "Deep Research", url: "/deep-research", icon: Orbit },
      { titleKey: "sidebar.localLLM", fallback: "Local LLM", url: "/local-llm", icon: Cpu },
      { titleKey: "sidebar.meridian", fallback: "Meridian Hypervisor", url: "/meridian", icon: Atom },
      { titleKey: "sidebar.researchCortex", fallback: "Research Cortex", url: "/cortex", icon: BookOpen },
      { titleKey: "sidebar.memoryCortex", fallback: "Memory Cortex", url: "/memory", icon: Database },
      { titleKey: "sidebar.imagery", fallback: "Imagery", url: "/imagery", icon: ScanEye },
      { titleKey: "sidebar.omegaGos", fallback: "Ω-GOS 7/4 LNN", url: "/omega-gos", icon: Atom },
      { titleKey: "sidebar.reel", fallback: "Ω-REEL", url: "/reel", icon: Film },
      { titleKey: "sidebar.mediaPitch", fallback: "Media Pitch", url: "/media-pitch", icon: Newspaper },
      { titleKey: "sidebar.satoshiLattice", fallback: "Satoshi Lattice", url: "/satoshi-lattice", icon: Hash },
      { titleKey: "sidebar.quantumSolver",  fallback: "Quantum Solver",  url: "/quantum-solver",  icon: Zap },
    ],
  },
  {
    labelKey: "sidebar.public", fallbackLabel: "PUBLIC",
    items: [
      { titleKey: "sidebar.hyperobjects", fallback: "⬡ Hyperobject Intel", url: "/hyperobjects", icon: Atom },
      { titleKey: "sidebar.gooseGazette", fallback: "Goose Gazette", url: "/goose", icon: Newspaper },
    ],
  },
  {
    labelKey: "sidebar.operations", fallbackLabel: "OPERATIONS",
    items: [
      { titleKey: "sidebar.fleetTracker", fallback: "Fleet Tracker", url: "/fleet", icon: Radio },
      { titleKey: "sidebar.karachi", fallback: "Karachi", url: "/karachi", icon: Crosshair },
      { titleKey: "sidebar.congusto", fallback: "Congusto", url: "/congusto", icon: FlaskConical },
      { titleKey: "sidebar.iceBriefing", fallback: "ICE Briefing", url: "/gallium", icon: Globe },
      { titleKey: "sidebar.social", fallback: "Social", url: "/social", icon: Image },
      { titleKey: "sidebar.tools", fallback: "Tools", url: "/tools", icon: Wrench },
    ],
  },
];

function CollapsibleGroup({ group, location }: { group: NavGroup; location: string }) {
  const { t } = useI18n();

  const groupLabel = t(group.labelKey as any) !== group.labelKey ? t(group.labelKey as any) : group.fallbackLabel;

  return (
    <div className="mb-6">
      <div className="px-4 mb-2">
        <h4 className="section-label">{groupLabel}</h4>
      </div>
      <ul className="space-y-0.5">
        {group.items.map((item) => {
          const itemTitle = t(item.titleKey as any) !== item.titleKey ? t(item.titleKey as any) : item.fallback;
          const isActive = location === item.url;
          return (
            <li key={item.url}>
              <Link
                href={item.url}
                className={`flex items-center gap-3 px-4 py-1.5 text-sm font-serif transition-colors border-l-2 ${
                  isActive
                    ? "border-primary text-primary font-bold bg-sidebar-accent/50"
                    : "border-transparent text-foreground hover:text-primary hover:bg-sidebar-accent/30"
                }`}
              >
                <span className={item.url === "/jaco" ? "italic" : ""}>{itemTitle}</span>
                {item.url === "/jaco" && (
                  <span className="ml-auto text-[9px] font-mono font-normal not-italic border border-muted-foreground/30 text-muted-foreground/50 rounded px-1 py-0.5 leading-none tracking-wide">WebGPU</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { toggle: toggleMode } = useSiteMode();

  const { data: kappaStatus } = useQuery<KappaStatus>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 5000,
  });

  const { data: phoenixCountdown } = useQuery<PhoenixCountdown>({
    queryKey: ["/api/phoenix/countdown"],
    refetchInterval: 60000,
  });

  const score = kappaStatus?.score ?? 0;
  const threatColor = getThreatColor(score);
  const ewActive = kappaStatus?.eveningWindow?.active ?? false;
  const ewWindow = kappaStatus?.eveningWindow?.window ?? null;

  return (
    <Sidebar className="border-r border-border bg-sidebar h-full flex flex-col w-[260px]">
      <div className="p-6 border-b border-border mb-4">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-serif tracking-tight font-bold text-foreground">KAPPA</h1>
          {/* Mode toggle pill */}
          <button
            onClick={() => {
              toggleMode();
              window.location.href = "/";
            }}
            data-testid="button-sidebar-mode-toggle"
            title="Switch to Goose Gazette"
            className="mt-1 flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Newspaper className="h-2.5 w-2.5" />
            GAZETTE
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: threatColor }}
            />
            <span className="text-sm font-sans font-semibold tracking-tight text-foreground">
              SCORE: {score.toFixed(1)} κ
            </span>
          </div>
          {ewActive && ewWindow && (
            <Badge variant="outline" className="w-fit text-[10px] font-sans rounded-none border-primary text-primary">
              EVENING WINDOW: {ewWindow}
            </Badge>
          )}
        </div>
      </div>

      <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
        {navGroups.map((group) => (
          <CollapsibleGroup key={group.fallbackLabel} group={group} location={location} />
        ))}
      </SidebarContent>

      <div className="p-4 border-t border-border mt-auto">
        <div className="text-[10px] font-sans text-muted-foreground flex flex-col gap-1">
          <span>KAPPA SECURE INTEL</span>
          <span>SYSTEM 4.2.1 ACTIVE</span>
          {phoenixCountdown && (
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/50">
              <span>PHOENIX PROTOCOL</span>
              <span className="font-mono text-primary">{phoenixCountdown.percentComplete.toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-center">
          <HiddenBookshelf />
        </div>
      </div>
    </Sidebar>
  );
}
