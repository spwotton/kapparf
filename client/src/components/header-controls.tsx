import { Moon, Sun, Languages, Newspaper, Shield, Menu } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSiteMode } from "@/lib/site-mode";
import { useLocation, Link } from "wouter";

function ModePill() {
  const { mode, toggle } = useSiteMode();
  const [, navigate] = useLocation();

  const handleToggle = () => {
    toggle();
    if (mode === "kappa") {
      navigate("/");
    } else {
      navigate("/command");
    }
  };

  return (
    <button
      onClick={handleToggle}
      data-testid="button-site-mode-toggle"
      title={mode === "kappa" ? "Switch to Goose Gazette" : "Switch to CIA JW intel platform"}
      className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase transition-colors hover:border-primary hover:text-primary"
      style={{ fontFamily: "var(--font-sans, sans-serif)" }}
    >
      {mode === "kappa" ? (
        <>
          <Newspaper className="h-2.5 w-2.5" />
          <span className="hidden sm:inline">GAZETTE</span>
        </>
      ) : (
        <>
          <Shield className="h-2.5 w-2.5" />
          <span className="hidden sm:inline">CIA JW</span>
        </>
      )}
    </button>
  );
}

export function HeaderControls() {
  const { theme, toggle } = useTheme();
  const { locale, setLocale } = useI18n();

  return (
    <header className="flex items-center justify-between px-3 h-11 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2">
        {/* Sidebar trigger — larger tap target on mobile */}
        <SidebarTrigger
          data-testid="button-sidebar-toggle"
          className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        />
        {/* Site name visible on mobile when sidebar is closed */}
        <Link
          href="/"
          className="md:hidden text-sm font-serif font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          KAPPA
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ModePill />
        <div className="h-3 w-px bg-border" />
        <button
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
          data-testid="button-lang-toggle"
          className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-widest text-muted-foreground hover:text-primary uppercase transition-colors"
        >
          <Languages className="h-3 w-3" />
          <span className="hidden sm:inline">{locale === "en" ? "ES" : "EN"}</span>
        </button>
        <div className="h-3 w-px bg-border" />
        <button
          onClick={toggle}
          data-testid="button-theme-toggle"
          className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-widest text-muted-foreground hover:text-primary uppercase transition-colors"
        >
          {theme === "light" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
          <span className="hidden sm:inline">{theme === "light" ? "DARK" : "LIGHT"}</span>
        </button>
      </div>
    </header>
  );
}
