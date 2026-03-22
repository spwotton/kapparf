import { Link, useLocation } from "wouter";
import { LayoutDashboard, Activity, Link2, Satellite, Server, Wrench, MapIcon, Fingerprint, Search, Crosshair, FlaskConical, Brain, Sparkles, Hexagon, Image, Microscope, ScanEye, Network, Orbit, Atom } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

  const items = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("nav.events"), url: "/events", icon: Activity },
    { title: t("nav.correlations"), url: "/correlations", icon: Link2 },
    { title: t("nav.devices"), url: "/devices", icon: Fingerprint },
    { title: t("nav.satellites"), url: "/satellites", icon: Satellite },
    { title: t("nav.nodes"), url: "/nodes", icon: Server },
    { title: t("nav.tools"), url: "/tools", icon: Wrench },
    { title: t("nav.map"), url: "/map", icon: MapIcon },
    { title: t("nav.osint"), url: "/osint", icon: Search },
    { title: t("nav.karachi"), url: "/karachi", icon: Crosshair },
    { title: t("nav.congusto"), url: "/congusto", icon: FlaskConical },
    { title: t("nav.hypervisor"), url: "/hypervisor", icon: Brain },
    { title: t("nav.intelligence"), url: "/intelligence", icon: Sparkles },
    { title: t("nav.lattice"), url: "/lattice", icon: Hexagon },
    { title: t("nav.social"), url: "/social", icon: Image },
    { title: t("nav.research"), url: "/research", icon: Microscope },
    { title: "Deep Research", url: "/deep-research", icon: Orbit },
    { title: t("nav.imagery"), url: "/imagery", icon: ScanEye },
    { title: t("nav.board"), url: "/board", icon: Network },
    { title: t("nav.superposition"), url: "/superposition", icon: Atom },
  ];

  const score = kappaStatus?.score ?? 0;
  const threatColor = getThreatColor(score);
  const ewActive = kappaStatus?.eveningWindow?.active ?? false;
  const ewWindow = kappaStatus?.eveningWindow?.window ?? null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight" data-testid="text-app-title">
            {t("app.title")}
          </span>
          <span className="text-xs text-muted-foreground font-mono" data-testid="text-app-subtitle">
            {t("app.subtitle")}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("nav.navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
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
              {ewWindow === "I" ? t("sidebar.ewI") : t("sidebar.ewII")}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono">10.0514°N 84.2187°W</p>
        {phoenixCountdown && (
          <div className="flex items-center justify-between gap-1" data-testid="sidebar-phoenix-countdown">
            <span className="text-xs text-muted-foreground">{t("sidebar.phoenix")}</span>
            <span className="text-xs font-mono font-semibold" data-testid="text-sidebar-phoenix-pct">
              {phoenixCountdown.percentComplete.toFixed(1)}%
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
