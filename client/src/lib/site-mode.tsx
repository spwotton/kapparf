import { createContext, useContext, useState, useEffect } from "react";

type SiteMode = "satire" | "evidence";

interface SiteModeContextValue {
  mode: SiteMode;
  toggle: () => void;
  setMode: (m: SiteMode) => void;
}

const SiteModeContext = createContext<SiteModeContextValue>({
  mode: "satire",
  toggle: () => {},
  setMode: () => {},
});

export function SiteModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<SiteMode>(() => {
    try {
      return (localStorage.getItem("kappa_site_mode") as SiteMode) || "satire";
    } catch {
      return "satire";
    }
  });

  const setMode = (m: SiteMode) => {
    setModeState(m);
    try { localStorage.setItem("kappa_site_mode", m); } catch {}
  };

  const toggle = () => setMode(mode === "satire" ? "evidence" : "satire");

  return (
    <SiteModeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </SiteModeContext.Provider>
  );
}

export function useSiteMode() {
  return useContext(SiteModeContext);
}

export function SiteModeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useSiteMode();
  return (
    <button
      onClick={toggle}
      data-testid="button-site-mode-toggle"
      title={mode === "satire" ? "Switch to evidence directory" : "Switch to Goose Gazette"}
      className={className}
    >
      {mode === "satire" ? "EVIDENCE" : "GAZETTE"}
    </button>
  );
}
