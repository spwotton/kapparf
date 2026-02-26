import { Link, useLocation } from "wouter";
import { LayoutDashboard, Activity, Link2, Satellite, Server, Wrench, MapIcon } from "lucide-react";
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
import { useI18n } from "@/lib/i18n";

export function AppSidebar() {
  const { t } = useI18n();
  const [location] = useLocation();

  const items = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("nav.events"), url: "/events", icon: Activity },
    { title: t("nav.correlations"), url: "/correlations", icon: Link2 },
    { title: t("nav.satellites"), url: "/satellites", icon: Satellite },
    { title: t("nav.nodes"), url: "/nodes", icon: Server },
    { title: t("nav.tools"), url: "/tools", icon: Wrench },
    { title: t("nav.map"), url: "/map", icon: MapIcon },
  ];

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
            Navigation
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
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground font-mono">9.9536°N 84.2907°W</p>
      </SidebarFooter>
    </Sidebar>
  );
}
