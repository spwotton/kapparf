import { Moon, Sun, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSiteMode } from "@/lib/site-mode";
import { useLocation } from "wouter";

export function HeaderControls() {
  const { theme, toggle } = useTheme();
  const { locale, setLocale } = useI18n();
  const { mode, toggle: toggleMode } = useSiteMode();
  const [location] = useLocation();

  return (
    <header className="flex items-center justify-between px-4 h-10 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger data-testid="button-sidebar-toggle" className="text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleMode}
          data-testid="button-site-mode-toggle"
          className="font-sans text-[11px] font-semibold tracking-widest text-muted-foreground hover:text-primary uppercase transition-colors"
        >
          {mode === "satire" ? "EVIDENCE" : "GAZETTE"}
        </button>
        <div className="h-3 w-px bg-border"></div>
        <button
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
          data-testid="button-lang-toggle"
          className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-widest text-muted-foreground hover:text-primary uppercase transition-colors"
        >
          <Languages className="h-3 w-3" />
          {locale === "en" ? "ES" : "EN"}
        </button>
        <div className="h-3 w-px bg-border"></div>
        <button
          onClick={toggle}
          data-testid="button-theme-toggle"
          className="flex items-center gap-1.5 font-sans text-[11px] font-semibold tracking-widest text-muted-foreground hover:text-primary uppercase transition-colors"
        >
          {theme === "light" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
          {theme === "light" ? "DARK" : "LIGHT"}
        </button>
      </div>
    </header>
  );
}
