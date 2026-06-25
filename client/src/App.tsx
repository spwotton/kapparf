import { lazy, Suspense, Component, type ErrorInfo, type ReactNode } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderControls } from "@/components/header-controls";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { DossierProvider, useDossier } from "@/lib/dossier";
import { SiteModeProvider, useSiteMode } from "@/lib/site-mode";
import { useArrowSequence } from "@/hooks/useArrowSequence";
import { I18nProvider } from "@/lib/i18n";
import { Moon, Sun, Shield } from "lucide-react";
import { useLocation } from "wouter";

// ── Error boundary — catches failed lazy chunk loads ──────────────────────────
class RouteErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[KAPPA] Route load error:", error, info);
  }
  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100%", minHeight: "200px",
          gap: "12px", fontFamily: "ui-monospace, monospace", color: "#6b7280",
          fontSize: "12px", padding: "2rem", textAlign: "center",
        }}>
          <span style={{ fontSize: "20px" }}>⚠</span>
          <span style={{ fontWeight: 600 }}>Page failed to load</span>
          <span style={{ opacity: 0.6, maxWidth: 320 }}>
            {(this.state.error as Error).message ?? "Module load error"}
          </span>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              marginTop: "8px", padding: "6px 16px", fontSize: "11px",
              fontFamily: "inherit", letterSpacing: "0.08em", cursor: "pointer",
              border: "1px solid #6b7280", borderRadius: "4px",
              background: "transparent", color: "#6b7280",
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Lazy page imports (code-split per route) ──────────────────────────────────
const NotFound              = lazy(() => import("@/pages/not-found"));
const CommandCenterPage     = lazy(() => import("@/pages/command-center"));
const DashboardPage         = lazy(() => import("@/pages/overview"));
const EventsPage            = lazy(() => import("@/pages/events"));
const CorrelationsPage      = lazy(() => import("@/pages/correlations"));
const SatellitesPage        = lazy(() => import("@/pages/satellites"));
const NodesPage             = lazy(() => import("@/pages/nodes"));
const ToolsPage             = lazy(() => import("@/pages/tools"));
const MapPage               = lazy(() => import("@/pages/map"));
const DevicesPage           = lazy(() => import("@/pages/devices"));
const OsintPage             = lazy(() => import("@/pages/osint"));
const KarachiPage           = lazy(() => import("@/pages/karachi"));
const CongustoPage          = lazy(() => import("@/pages/congusto"));
const HypervisorPage        = lazy(() => import("@/pages/hypervisor"));
const IntelligencePage      = lazy(() => import("@/pages/intelligence"));
const LatticePage           = lazy(() => import("@/pages/lattice"));
const SocialPage            = lazy(() => import("@/pages/social"));
const StudioPage            = lazy(() => import("@/pages/studio"));
const ResearchPage          = lazy(() => import("@/pages/research"));
const DeepResearchPage      = lazy(() => import("@/pages/deep-research"));
const ImageryPage           = lazy(() => import("@/pages/imagery"));
const ConspiracyBoardPage   = lazy(() => import("@/pages/conspiracy-board"));
const SuperpositionPage     = lazy(() => import("@/pages/superposition"));
const BettercapPage         = lazy(() => import("@/pages/bettercap"));
const ResearchCortexPage    = lazy(() => import("@/pages/research-cortex"));
const LiquidCortexPage      = lazy(() => import("@/pages/liquid-cortex"));
const NetworkForensicsPage  = lazy(() => import("@/pages/network-forensics"));
const EvidenceChainPage     = lazy(() => import("@/pages/evidence-chain"));
const ForensicHypervisorPage= lazy(() => import("@/pages/forensic-hypervisor"));
const WhistleblowerPage     = lazy(() => import("@/pages/whistleblower"));
const HomePage              = lazy(() => import("@/pages/home"));
const CrankEditorPage       = lazy(() => import("@/pages/crank"));
const MemoryCortexPage      = lazy(() => import("@/pages/memory-cortex"));
const GalliumPage           = lazy(() => import("@/pages/gallium"));
const SuitesCristinaPage    = lazy(() => import("@/pages/suites-cristina"));
const JacoMapPage           = lazy(() => import("@/pages/jaco-map"));
const DroneIntelPage        = lazy(() => import("@/pages/drone-intel/index"));
const DroneGamePage         = lazy(() => import("@/pages/drone-game"));
const SpokeWheelPage        = lazy(() => import("@/pages/spoke-wheel"));
const OmegaGOSLNNPage       = lazy(() => import("@/pages/omega-gos-lnn"));
const FleetTrackerPage      = lazy(() => import("@/pages/fleet-tracker"));
const SeismicKappaPage      = lazy(() => import("@/pages/seismic-kappa"));
const CortexBusPage         = lazy(() => import("@/pages/cortex-bus"));
const AtlantisHubPage       = lazy(() => import("@/pages/atlantis-hub"));
const LocalLLMHypervisorPage= lazy(() => import("@/pages/local-llm-hypervisor"));
const MeridianHypervisorPage= lazy(() => import("@/pages/meridian-hypervisor"));
const BioAcousticPage       = lazy(() => import("@/pages/bio-acoustic"));
const AudioForensicsPage    = lazy(() => import("@/pages/audio-forensics"));
const VideoForensicsPage    = lazy(() => import("@/pages/video-forensics"));
const GooseGazettePage      = lazy(() => import("@/pages/goose-gazette"));
const EvidenceDirectoryPage = lazy(() => import("@/pages/evidence-directory"));
const GooseSignalsPage      = lazy(() => import("@/pages/goose-signals"));
const SignalLatticePage     = lazy(() => import("@/pages/signal-lattice"));
const GooseHumorPage        = lazy(() => import("@/pages/goose-humor"));
const GooseAdminPage        = lazy(() => import("@/pages/goose-admin"));
const GooseEditorialPage    = lazy(() => import("@/pages/goose-editorial"));
const DroneBlogPage         = lazy(() => import("@/pages/drone-blog"));
const PochoteAnalysisPage   = lazy(() => import("@/pages/pochote-analysis"));
const GazetteRefinerPage    = lazy(() => import("@/pages/gazette-refiner"));
const HyperobjectsPage      = lazy(() => import("@/pages/hyperobjects"));
const AtlasObservatoryPage  = lazy(() => import("@/pages/atlas-observatory"));
const SetecomExposePage     = lazy(() => import("@/pages/setecom-expose"));
const ReelPage              = lazy(() => import("@/pages/reel"));
const MailerPage            = lazy(() => import("@/pages/mailer"));
const MediaPitchPage        = lazy(() => import("@/pages/media-pitch"));
const SatoshiLatticePage    = lazy(() => import("@/pages/satoshi-lattice"));
const QuantumSolverPage     = lazy(() => import("@/pages/quantum-solver"));
const StatusReportPage      = lazy(() => import("@/pages/status-report"));
const NexusSlidesPage       = lazy(() => import("@/pages/nexus-slides"));
const SpectrumPage          = lazy(() => import("@/pages/spectrum"));
const ArticleJacoConvergencePage = lazy(() => import("@/pages/article-jaco-convergence"));
const ArticleBleVehiclePage = lazy(() => import("@/pages/article-ble-vehicle"));
const ArticleRecording37Page= lazy(() => import("@/pages/article-recording-37"));
const FollowTheMoneyPage    = lazy(() => import("@/pages/follow-the-money"));
const ZersetzungPage        = lazy(() => import("@/pages/zersetzung"));
const QuasarHydraPage       = lazy(() => import("@/pages/quasar-hydra"));
const OpticalScanPage       = lazy(() => import("@/pages/optical-scan"));
const ForensicEvidencePage  = lazy(() => import("@/pages/forensic-evidence"));
const PochoteIncidentPage   = lazy(() => import("@/pages/pochote-incident"));
const ParabolicAntennaPage  = lazy(() => import("@/pages/parabolic-antenna"));
const SensorArrayPage       = lazy(() => import("@/pages/sensor-array"));
const DemodexPhonePage      = lazy(() => import("@/pages/demodex-phone"));
const NetworkAnalysisPage   = lazy(() => import("@/pages/network-analysis"));
const PochoteHeadlinerPage  = lazy(() => import("@/pages/pochote-headliner"));
const IsomorphicThreatPage  = lazy(() => import("@/pages/isomorphic-threat"));
const RiverwalkPage         = lazy(() => import("@/pages/riverwalk"));
const ThreatHuntingPage     = lazy(() => import("@/pages/threat-hunting"));
const DocsisForensicsPage   = lazy(() => import("@/pages/docsis-forensics"));
const GOSHyperstructurePage = lazy(() => import("@/pages/gos-hyperstructure"));
const TattooBrandingPage    = lazy(() => import("@/pages/tattoo-branding"));
const DiamanteDelSolPage    = lazy(() => import("@/pages/diamante-del-sol"));
const CameroXaverLdvPage    = lazy(() => import("@/pages/camero-xaver-ldv"));

// ── 53-Hyperlattice loading fallback ─────────────────────────────────────────
// BH53 canonical alphabet — 53 chars, visually unambiguous
const BH53 = "02345678ABCDEFGHJKLMNPQRSTUVXYZabcefghijknopqrstuvxyz";

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "200px",
        gap: "12px",
        fontFamily: "ui-monospace, monospace",
        color: "#6b7280",
        fontSize: "11px",
        letterSpacing: "0.08em",
        userSelect: "none",
      }}
    >
      <SpectrogramBar />
      <span style={{ opacity: 0.5 }}>κ = 4/π · GF(53)</span>
    </div>
  );
}

function SpectrogramBar() {
  const cols = 24;
  const bars = Array.from({ length: cols }, (_, i) => {
    const char = BH53[i % BH53.length];
    const h = 8 + ((i * 7 + 13) % 20);
    return { char, h };
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "2px",
        height: "32px",
      }}
    >
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: `${b.h}px`,
            background: `hsl(${210 + i * 3}, 40%, 60%)`,
            borderRadius: "1px",
            animation: `kappa-pulse ${0.8 + (i % 5) * 0.15}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.04}s`,
          }}
          title={b.char}
        />
      ))}
      <style>{`
        @keyframes kappa-pulse {
          from { opacity: 0.3; transform: scaleY(0.6); }
          to   { opacity: 1;   transform: scaleY(1);   }
        }
      `}</style>
    </div>
  );
}

// ── KAPPA full-platform router (CIA JW mode) ──────────────────────────────────
function KappaRouter() {
  return (
    <RouteErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/command-center" component={CommandCenterPage} />
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
        <Route path="/studio" component={StudioPage} />
        <Route path="/research" component={ResearchPage} />
        <Route path="/deep-research" component={DeepResearchPage} />
        <Route path="/imagery" component={ImageryPage} />
        <Route path="/board" component={ConspiracyBoardPage} />
        <Route path="/superposition" component={SuperpositionPage} />
        <Route path="/bettercap" component={BettercapPage} />
        <Route path="/cortex" component={ResearchCortexPage} />
        <Route path="/liquid-cortex" component={LiquidCortexPage} />
        <Route path="/forensics" component={NetworkForensicsPage} />
        <Route path="/evidence-chain" component={EvidenceChainPage} />
        <Route path="/evidence-directory" component={EvidenceDirectoryPage} />
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
        <Route path="/spectrum" component={SpectrumPage} />
        <Route path="/optical-scan" component={OpticalScanPage} />
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
        <Route path="/nexus-slides" component={NexusSlidesPage} />
        <Route path="/articles/jaco-files" component={ArticleJacoConvergencePage} />
        <Route path="/articles/ble-vehicle" component={ArticleBleVehiclePage} />
        <Route path="/articles/recording-37" component={ArticleRecording37Page} />
        <Route path="/follow-the-money" component={FollowTheMoneyPage} />
        <Route path="/zersetzung" component={ZersetzungPage} />
        <Route path="/quasar-hydra" component={QuasarHydraPage} />
        <Route path="/forensic-evidence" component={ForensicEvidencePage} />
        <Route path="/pochote-incident" component={PochoteIncidentPage} />
        <Route path="/parabolic-antenna" component={ParabolicAntennaPage} />
        <Route path="/sensor-array" component={SensorArrayPage} />
        <Route path="/demodex-phone" component={DemodexPhonePage} />
        <Route path="/network-analysis" component={NetworkAnalysisPage} />
        <Route path="/pochote-headliner" component={PochoteHeadlinerPage} />
        <Route path="/isomorphic-threat" component={IsomorphicThreatPage} />
        <Route path="/riverwalk" component={RiverwalkPage} />
        <Route path="/threat-hunting" component={ThreatHuntingPage} />
        <Route path="/docsis-forensics" component={DocsisForensicsPage} />
        <Route path="/tattoo-branding" component={TattooBrandingPage} />
        <Route path="/gos-hyperstructure" component={GOSHyperstructurePage} />
        <Route path="/diamante-del-sol" component={DiamanteDelSolPage} />
        <Route path="/camero-xaver-ldv" component={CameroXaverLdvPage} />
        <Route path="/crank" component={CrankEditorPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
    </RouteErrorBoundary>
  );
}

// ── Goose Gazette standalone router (default mode) ───────────────────────────
function GooseRouter() {
  return (
    <RouteErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/whistleblower" component={WhistleblowerPage} />
        <Route path="/nexus-slides" component={NexusSlidesPage} />
        <Route path="/setecom-report" component={SetecomExposePage} />
        <Route path="/articles/jaco-files" component={ArticleJacoConvergencePage} />
        <Route path="/articles/ble-vehicle" component={ArticleBleVehiclePage} />
        <Route path="/articles/recording-37" component={ArticleRecording37Page} />
        <Route path="/pochote" component={PochoteAnalysisPage} />
        <Route path="/pochote-headliner" component={PochoteHeadlinerPage} />
        <Route path="/diamante-del-sol" component={DiamanteDelSolPage} />
        <Route path="/tattoo-branding" component={TattooBrandingPage} />
        <Route path="/goose/signals" component={GooseSignalsPage} />
        <Route path="/goose/lattice" component={SignalLatticePage} />
        <Route path="/goose/admin" component={GooseAdminPage} />
        <Route path="/goose/editorial" component={GooseEditorialPage} />
        <Route path="/goose/drone" component={DroneBlogPage} />
        <Route path="/goose/press-room" component={GazetteRefinerPage} />
        <Route path="/goose/humor" component={GooseHumorPage} />
        <Route path="/goose" component={GooseGazettePage} />
        <Route path="/" component={WhistleblowerPage} />
        <Route component={WhistleblowerPage} />
      </Switch>
    </Suspense>
    </RouteErrorBoundary>
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

// ── Slim public header for Goose Gazette mode ─────────────────────────────────
function GooseHeader() {
  const { mode, toggle } = useSiteMode();
  const { theme, toggle: toggleTheme } = useTheme();
  const [, navigate] = useLocation();

  const handleModeToggle = () => {
    toggle();
    navigate("/command");
  };

  return (
    <header className="flex items-center justify-end gap-2 px-4 h-9 border-b border-gray-200 bg-white">
      <button
        onClick={handleModeToggle}
        data-testid="button-site-mode-toggle-gazette"
        title="Switch to CIA JW — full intel platform"
        className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-gray-900 border border-gray-300 rounded px-2 py-1 transition-colors"
      >
        <Shield className="h-2.5 w-2.5" />
        <span>CIA JW</span>
      </button>
      <div className="h-3 w-px bg-gray-200" />
      <button
        onClick={toggleTheme}
        data-testid="button-theme-toggle-gazette"
        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors"
      >
        {theme === "light" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
        <span>{theme === "light" ? "DARK" : "LIGHT"}</span>
      </button>
    </header>
  );
}

function AppWithDossier() {
  const { toggleDossierMode } = useDossier();
  const { mode } = useSiteMode();
  useArrowSequence(toggleDossierMode);

  // ── Goose Gazette mode (default) — standalone, no KAPPA sidebar ──────────
  if (mode === "goose") {
    return (
      <>
        <div className="flex flex-col h-screen">
          <GooseHeader />
          <div className="flex-1 overflow-auto min-h-0">
            <GooseRouter />
          </div>
        </div>
        <Toaster />
      </>
    );
  }

  // ── CIA JW / KAPPA mode — full intel platform with sidebar ────────────────
  return (
    <>
      <Switch>
        <Route path="/setecom-report">
          <RouteErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SetecomExposePage />
            </Suspense>
          </RouteErrorBoundary>
        </Route>
        <Route>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <HeaderControls />
                <main className="flex-1 overflow-auto min-h-0 pb-16 md:pb-0">
                  <KappaRouter />
                </main>
              </div>
            </div>
            <MobileBottomNav />
          </SidebarProvider>
        </Route>
      </Switch>
      <Toaster />
      <DossierBadge />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
    <DossierProvider>
    <SiteModeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppWithDossier />
          </TooltipProvider>
        </QueryClientProvider>
      </I18nProvider>
    </SiteModeProvider>
    </DossierProvider>
    </ThemeProvider>
  );
}

export default App;
