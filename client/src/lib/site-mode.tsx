import { createContext, useContext, useState } from "react";

export type SiteMode = "goose" | "kappa";

interface SiteModeContextValue {
  mode: SiteMode;
  toggle: () => void;
  setMode: (m: SiteMode) => void;
}

const SiteModeContext = createContext<SiteModeContextValue>({
  mode: "kappa",
  toggle: () => {},
  setMode: () => {},
});

function isGooseDomain(): boolean {
  try {
    const h = window.location.hostname.toLowerCase();
    return h === "goosegazette.org" || h === "www.goosegazette.org" || h.endsWith(".goosegazette.org");
  } catch {
    return false;
  }
}

function resolveStoredMode(raw: string | null): SiteMode {
  if (isGooseDomain()) return "goose";
  if (raw === "goose") return "goose";
  return "kappa";
}

export function SiteModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<SiteMode>(() => {
    try {
      return resolveStoredMode(localStorage.getItem("kappa_site_mode"));
    } catch {
      return isGooseDomain() ? "goose" : "kappa";
    }
  });

  const setMode = (m: SiteMode) => {
    setModeState(m);
    if (!isGooseDomain()) {
      try { localStorage.setItem("kappa_site_mode", m); } catch {}
    }
  };

  const toggle = () => setMode(mode === "goose" ? "kappa" : "goose");

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
      title={mode === "goose" ? "Switch to CIA JW — full intel platform" : "Switch to Goose Gazette"}
      className={className}
    >
      {mode === "goose" ? "CIA JW" : "GAZETTE"}
    </button>
  );
}
