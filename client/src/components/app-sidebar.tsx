import { useState } from "react";
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
  ChevronRight,
  Building2,
  RotateCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { type KappaStatus, type PhoenixCountdown, THREAT_LEVELS } from "@shared/schema";

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
      { titleKey: "sidebar.ciajwHome", fallback: "CIAJW Home", url: "/", icon: Shield },
      { titleKey: "sidebar.evidenceChain", fallback: "Evidence Chain", url: "/evidence", icon: FileWarning },
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
    ],
  },
  {
    labelKey: "sidebar.monitor", fallbackLabel: "MONITOR",
    items: [
      { titleKey: "sidebar.events", fallback: "Events", url: "/events", icon: Activity },
      { titleKey: "sidebar.correlations", fallback: "Correlations", url: "/correlations", icon: Link2 },
      { titleKey: "sidebar.hypervisor", fallback: "Hypervisor", url: "/hypervisor", icon: Brain },
      { titleKey: "sidebar.map", fallback: "Map", url: "/map", icon: MapIcon },
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
      { titleKey: "sidebar.researchCortex", fallback: "Research Cortex", url: "/cortex", icon: BookOpen },
      { titleKey: "sidebar.memoryCortex", fallback: "Memory Cortex", url: "/memory", icon: Database },
      { titleKey: "sidebar.imagery", fallback: "Imagery", url: "/imagery", icon: ScanEye },
      { titleKey: "sidebar.omegaGos", fallback: "Ω-GOS 7/4 LNN", url: "/omega-gos", icon: Atom },
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
  const hasActive = group.items.some((item) => location === item.url);
  const [open, setOpen] = useState(hasActive || group.fallbackLabel === "EVIDENCE");

  const groupLabel = t(group.labelKey as any) !== group.labelKey ? t(group.labelKey as any) : group.fallbackLabel;

  return (
    <SidebarGroup>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors"
        data-testid={`nav-group-${group.fallbackLabel.toLowerCase()}`}
      >
        <span>{groupLabel}</span>
        <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => {
              const itemTitle = t(item.titleKey as any) !== item.titleKey ? t(item.titleKey as any) : item.fallback;
              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "") || "command-center"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{itemTitle}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { t } = useI18n();
  const [location] = useLocation();

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
    <Sidebar>
      <SidebarHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0 animate-pulse"
            style={{ backgroundColor: threatColor }}
          />
          <span className="text-base font-bold tracking-tight" data-testid="text-app-title">
            CIAJW
          </span>
          <span className="text-[10px] text-muted-foreground font-mono" data-testid="text-app-subtitle">
            KAPPA SIGINT
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-0">
        {navGroups.map((group) => (
          <CollapsibleGroup key={group.fallbackLabel} group={group} location={location} />
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3 space-y-1.5">
        <div className="flex items-center gap-2" data-testid="sidebar-kappa-status">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: threatColor }}
          />
          <span className="text-sm font-mono font-semibold" data-testid="text-sidebar-score">
            {score.toFixed(0)}
          </span>
          <span className="text-xs text-muted-foreground font-mono">κ</span>
          {ewActive && ewWindow && (
            <Badge variant="secondary" className="text-[10px] ml-auto" data-testid="badge-sidebar-ew">
              EW {ewWindow}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">10.0514°N 84.2187°W</p>
        {phoenixCountdown && (
          <div className="flex items-center justify-between gap-1" data-testid="sidebar-phoenix-countdown">
            <span className="text-[10px] text-muted-foreground">Phoenix</span>
            <span className="text-[10px] font-mono font-semibold" data-testid="text-sidebar-phoenix-pct">
              {phoenixCountdown.percentComplete.toFixed(1)}%
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
