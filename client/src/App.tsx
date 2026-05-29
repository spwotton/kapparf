import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderControls } from "@/components/header-controls";
import { ThemeProvider } from "@/lib/theme";
import { DossierProvider, useDossier } from "@/lib/dossier";
import { SiteModeProvider, useSiteMode } from "@/lib/site-mode";
import { useArrowSequence } from "@/hooks/useArrowSequence";
import { I18nProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import CommandCenterPage from "@/pages/command-center";
import DashboardPage from "@/pages/overview";
import EventsPage from "@/pages/events";
import CorrelationsPage from "@/pages/correlations";
import SatellitesPage from "@/pages/satellites";
import NodesPage from "@/pages/nodes";
import ToolsPage from "@/pages/tools";
import MapPage from "@/pages/map";
import DevicesPage from "@/pages/devices";
import OsintPage from "@/pages/osint";
import KarachiPage from "@/pages/karachi";
import CongustoPage from "@/pages/congusto";
import HypervisorPage from "@/pages/hypervisor";
import IntelligencePage from "@/pages/intelligence";
import LatticePage from "@/pages/lattice";
import SocialPage from "@/pages/social";
import ResearchPage from "@/pages/research";
import DeepResearchPage from "@/pages/deep-research";
import ImageryPage from "@/pages/imagery";
import ConspiracyBoardPage from "@/pages/conspiracy-board";
import SuperpositionPage from "@/pages/superposition";
import BettercapPage from "@/pages/bettercap";
import ResearchCortexPage from "@/pages/research-cortex";
import NetworkForensicsPage from "@/pages/network-forensics";
import EvidenceChainPage from "@/pages/evidence-chain";
import ForensicHypervisorPage from "@/pages/forensic-hypervisor";
import WhistleblowerPage from "@/pages/whistleblower";
import MemoryCortexPage from "@/pages/memory-cortex";
import GalliumPage from "@/pages/gallium";
import SuitesCristinaPage from "@/pages/suites-cristina";
import JacoMapPage from "@/pages/jaco-map";
import DroneIntelPage from "@/pages/drone-intel/index";
import DroneGamePage from "@/pages/drone-game";
import SpokeWheelPage from "@/pages/spoke-wheel";
import OmegaGOSLNNPage from "@/pages/omega-gos-lnn";
import FleetTrackerPage from "@/pages/fleet-tracker";
import SeismicKappaPage from "@/pages/seismic-kappa";
import CortexBusPage from "@/pages/cortex-bus";
import AtlantisHubPage from "@/pages/atlantis-hub";
import LocalLLMHypervisorPage from "@/pages/local-llm-hypervisor";
import MeridianHypervisorPage from "@/pages/meridian-hypervisor";
import BioAcousticPage from "@/pages/bio-acoustic";
import AudioForensicsPage from "@/pages/audio-forensics";
import VideoForensicsPage from "@/pages/video-forensics";
import GooseGazettePage from "@/pages/goose-gazette";
import EvidenceDirectoryPage from "@/pages/evidence-directory";
import GooseSignalsPage from "@/pages/goose-signals";
import SignalLatticePage from "@/pages/signal-lattice";
import GooseHumorPage from "@/pages/goose-humor";
import GooseAdminPage from "@/pages/goose-admin";
import GooseEditorialPage from "@/pages/goose-editorial";
import DroneBlogPage from "@/pages/drone-blog";
import PochoteAnalysisPage from "@/pages/pochote-analysis";
import GazetteRefinerPage from "@/pages/gazette-refiner";
import HyperobjectsPage from "@/pages/hyperobjects";
import AtlasObservatoryPage from "@/pages/atlas-observatory";
import SetecomExposePage from "@/pages/setecom-expose";
import ReelPage from "@/pages/reel";
import MailerPage from "@/pages/mailer";
import MediaPitchPage from "@/pages/media-pitch";
import SatoshiLatticePage from "@/pages/satoshi-lattice";
import QuantumSolverPage from "@/pages/quantum-solver";
import StatusReportPage from "@/pages/status-report";

// ── KAPPA full-platform router (CIA JW mode) ─────────────────────────────────
function KappaRouter() {
  return (
    <Switch>
      <Route path="/" component={CommandCenterPage} />
      <Route path="/status" component={StatusReportPage} />
      <Route path="/whistleblower" component={WhistleblowerPage} />
      <Route path="/command" component={CommandCenterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/correlations" component={CorrelationsPage} />
      <Route path="/devices" component={DevicesPage} />
      <Route path="/satellites" component={SatellitesPage} />
      <Route path="/nodes" component={NodesPage} />
      <Route path="/tools" component={ToolsPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/osint" component={OsintPage} />
      <Route path="/karachi" component={KarachiPage} />
      <Route path="/congusto" component={CongustoPage} />
      <Route path="/hypervisor" component={HypervisorPage} />
      <Route path="/intelligence" component={IntelligencePage} />
      <Route path="/lattice" component={LatticePage} />
      <Route path="/social" component={SocialPage} />
      <Route path="/research" component={ResearchPage} />
      <Route path="/deep-research" component={DeepResearchPage} />
      <Route path="/imagery" component={ImageryPage} />
      <Route path="/board" component={ConspiracyBoardPage} />
      <Route path="/superposition" component={SuperpositionPage} />
      <Route path="/bettercap" component={BettercapPage} />
      <Route path="/cortex" component={ResearchCortexPage} />
      <Route path="/forensics" component={NetworkForensicsPage} />
      <Route path="/evidence" component={EvidenceChainPage} />
      <Route path="/forensic-hypervisor" component={ForensicHypervisorPage} />
      <Route path="/memory" component={MemoryCortexPage} />
      <Route path="/gallium" component={GalliumPage} />
      <Route path="/cristina" component={SuitesCristinaPage} />
      <Route path="/jaco" component={JacoMapPage} />
      <Route path="/drone-intel" component={DroneIntelPage} />
      <Route path="/game" component={DroneGamePage} />
      <Route path="/spoke-wheel" component={SpokeWheelPage} />
      <Route path="/omega-gos" component={OmegaGOSLNNPage} />
      <Route path="/fleet" component={FleetTrackerPage} />
      <Route path="/seismic" component={SeismicKappaPage} />
      <Route path="/cortex-bus" component={CortexBusPage} />
      <Route path="/atlantis" component={AtlantisHubPage} />
      <Route path="/local-llm" component={LocalLLMHypervisorPage} />
      <Route path="/meridian" component={MeridianHypervisorPage} />
      <Route path="/bio-acoustic" component={BioAcousticPage} />
      <Route path="/audio" component={AudioForensicsPage} />
      <Route path="/video-forensics" component={VideoForensicsPage} />
      <Route path="/goose" component={GooseGazettePage} />
      <Route path="/goose/signals" component={GooseSignalsPage} />
      <Route path="/goose/lattice" component={SignalLatticePage} />
      <Route path="/goose/admin" component={GooseAdminPage} />
      <Route path="/goose/editorial" component={GooseEditorialPage} />
      <Route path="/goose/drone" component={DroneBlogPage} />
      <Route path="/goose/press-room" component={GazetteRefinerPage} />
      <Route path="/goose/humor" component={GooseHumorPage} />
      <Route path="/hyperobjects" component={HyperobjectsPage} />
      <Route path="/atlas" component={AtlasObservatoryPage} />
      <Route path="/setecom" component={SetecomExposePage} />
      <Route path="/reel" component={ReelPage} />
      <Route path="/mailer" component={MailerPage} />
      <Route path="/media-pitch" component={MediaPitchPage} />
      <Route path="/satoshi-lattice" component={SatoshiLatticePage} />
      <Route path="/quantum-solver" component={QuantumSolverPage} />
      <Route path="/pochote" component={PochoteAnalysisPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ── Goose Gazette standalone router (default mode) ───────────────────────────
function GooseRouter() {
  return (
    <Switch>
      <Route path="/setecom-report" component={SetecomExposePage} />
      <Route path="/pochote" component={PochoteAnalysisPage} />
      <Route path="/goose/signals" component={GooseSignalsPage} />
      <Route path="/goose/lattice" component={SignalLatticePage} />
      <Route path="/goose/admin" component={GooseAdminPage} />
      <Route path="/goose/editorial" component={GooseEditorialPage} />
      <Route path="/goose/drone" component={DroneBlogPage} />
      <Route path="/goose/press-room" component={GazetteRefinerPage} />
      <Route path="/goose/humor" component={GooseHumorPage} />
      <Route path="/goose" component={GooseGazettePage} />
      <Route component={GooseGazettePage} />
    </Switch>
  );
}

function DossierBadge() {
  const { dossierMode, toggleDossierMode } = useDossier();
  if (!dossierMode) return null;
  return (
    <button
      onClick={toggleDossierMode}
      title="Exit Dossier Mode"
      data-testid="badge-dossier-mode"
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 9999,
        opacity: 0.2,
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#a5b4fc",
        border: "1px solid rgba(165,180,252,0.3)",
        borderRadius: "3px",
        padding: "2px 6px",
        background: "rgba(10,15,30,0.8)",
        cursor: "pointer",
        transition: "opacity 0.2s",
        letterSpacing: "0.05em",
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "0.2")}
    >
      [D] ×
    </button>
  );
}

function AppWithDossier() {
  const { toggleDossierMode } = useDossier();
  const { mode } = useSiteMode();
  useArrowSequence(toggleDossierMode);

  // ── Goose Gazette mode (default) — standalone, no KAPPA sidebar ───────────
  if (mode === "goose") {
    return (
      <>
        <GooseRouter />
        <Toaster />
      </>
    );
  }

  // ── CIA JW / KAPPA mode — full intel platform with sidebar ────────────────
  return (
    <>
      <Switch>
        <Route path="/setecom-report" component={SetecomExposePage} />
        <Route>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <HeaderControls />
                <main className="flex-1 overflow-auto min-h-0">
                  <KappaRouter />
                </main>
              </div>
            </div>
          </SidebarProvider>
        </Route>
      </Switch>
      <Toaster />
      <DossierBadge />
    </>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAuthState(d.authenticated ? "authenticated" : "unauthenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
    <DossierProvider>
    <SiteModeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthGate>
              <AppWithDossier />
            </AuthGate>
          </TooltipProvider>
        </QueryClientProvider>
      </I18nProvider>
    </SiteModeProvider>
    </DossierProvider>
    </ThemeProvider>
  );
}

export default App;
