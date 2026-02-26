import { Moon, Sun, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function HeaderControls() {
  const { theme, toggle } = useTheme();
  const { locale, setLocale } = useI18n();

  return (
    <header className="flex items-center justify-between gap-1 p-2 border-b">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setLocale(locale === "en" ? "es" : "en")}
          data-testid="button-lang-toggle"
          className="font-mono text-xs"
        >
          <Languages className="h-4 w-4 mr-1" />
          {locale === "en" ? "ES" : "EN"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggle}
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
