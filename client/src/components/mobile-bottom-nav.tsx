import { Link, useLocation } from "wouter";
import { Home, FileWarning, Newspaper, MapIcon, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

const NAV_TABS = [
  { label: "Home",     icon: Home,        href: "/"                     },
  { label: "Evidence", icon: FileWarning, href: "/forensic-evidence"    },
  { label: "Articles", icon: Newspaper,   href: "/articles/ble-vehicle" },
  { label: "Map",      icon: MapIcon,     href: "/map"                  },
] as const;

export function MobileBottomNav() {
  const [location] = useLocation();
  const { toggleSidebar } = useSidebar();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_TABS.map(({ label, icon: Icon, href }) => {
        const active = location === href;
        return (
          <Link
            key={href}
            href={href}
            data-testid={`mobile-nav-${label.toLowerCase()}`}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-sans font-semibold tracking-wide uppercase transition-colors ${
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
            <span>{label}</span>
          </Link>
        );
      })}

      <button
        onClick={toggleSidebar}
        data-testid="mobile-nav-menu"
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-sans font-semibold tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="w-5 h-5 stroke-[1.5]" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
