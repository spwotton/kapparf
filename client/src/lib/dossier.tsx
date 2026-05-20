import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface DossierContextType {
  dossierMode: boolean;
  toggleDossierMode: () => void;
}

const DossierContext = createContext<DossierContextType | null>(null);

export function DossierProvider({ children }: { children: ReactNode }) {
  const [dossierMode, setDossierMode] = useState<boolean>(() => {
    try { return sessionStorage.getItem("kappa-dossier") === "1"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dossier", dossierMode);
    try { sessionStorage.setItem("kappa-dossier", dossierMode ? "1" : "0"); } catch {}
  }, [dossierMode]);

  const toggleDossierMode = useCallback(() => setDossierMode(p => !p), []);

  return (
    <DossierContext.Provider value={{ dossierMode, toggleDossierMode }}>
      {children}
    </DossierContext.Provider>
  );
}

export function useDossier() {
  const ctx = useContext(DossierContext);
  if (!ctx) throw new Error("useDossier must be used within DossierProvider");
  return ctx;
}
