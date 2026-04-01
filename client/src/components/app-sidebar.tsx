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

interface NavGroup {
  label: string;
  items: { title: string; url: string; icon: typeof Terminal }[];
}

const navGroups: NavGroup[] = [
  {
    label: "COMMAND",
    items: [
      { title: "Command Center", url: "/", icon: Terminal },
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "MONITOR",
    items: [
      { title: "Events", url: "/events", icon: Activity },
      { title: "Correlations", url: "/correlations", icon: Link2 },
      { title: "Hypervisor", url: "/hypervisor", icon: Brain },
      { title: "Map", url: "/map", icon: MapIcon },
    ],
  },
  {
    label: "SIGINT",
    items: [
      { title: "KiwiSDR Nodes", url: "/nodes", icon: Server },
      { title: "Satellites", url: "/satellites", icon: Satellite },
      { title: "Lattice", url: "/lattice", icon: Hexagon },
      { title: "Superposition", url: "/superposition", icon: Atom },
    ],
  },
  {
    label: "FORENSICS",
    items: [
      { title: "Devices", url: "/devices", icon: Fingerprint },
      { title: "Bettercap", url: "/bettercap", icon: Radio },
      { title: "Network Forensics", url: "/forensics", icon: Shield },
      { title: "Forensic Hypervisor", url: "/forensic-hypervisor", icon: Crosshair },
      { title: "Evidence Chain", url: "/evidence", icon: FileWarning },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { title: "OSINT", url: "/osint", icon: Search },
      { title: "Intel Reports", url: "/intelligence", icon: Sparkles },
      { title: "Research", url: "/research", icon: Microscope },
      { title: "Deep Research", url: "/deep-research", icon: Orbit },
      { title: "Research Cortex", url: "/cortex", icon: BookOpen },
      { title: "Memory Cortex", url: "/memory", icon: Database },
      { title: "Imagery", url: "/imagery", icon: ScanEye },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { title: "Karachi", url: "/karachi", icon: Crosshair },
      { title: "Congusto", url: "/congusto", icon: FlaskConical },
      { title: "Gallium / China", url: "/gallium", icon: Globe },
      { title: "Board", url: "/board", icon: Network },
      { title: "Social", url: "/social", icon: Image },
      { title: "Tools", url: "/tools", icon: Wrench },
    ],
  },
  {
    label: "PUBLIC",
    items: [
      { title: "CIAJW Public", url: "/ciajw", icon: Shield },
    ],
  },
];

function CollapsibleGroup({ group, location }: { group: NavGroup; location: string }) {
  const hasActive = group.items.some((item) => location === item.url);
  const [open, setOpen] = useState(hasActive || group.label === "COMMAND");

  return (
    <SidebarGroup>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors"
        data-testid={`nav-group-${group.label.toLowerCase()}`}
      >
        <span>{group.label}</span>
        <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  data-active={location === item.url}
                  data-testid={`nav-${item.url.replace("/", "") || "command-center"}`}
                >
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
            KAPPA
          </span>
          <span className="text-[10px] text-muted-foreground font-mono" data-testid="text-app-subtitle">
            SIGINT
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-0">
        {navGroups.map((group) => (
          <CollapsibleGroup key={group.label} group={group} location={location} />
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
