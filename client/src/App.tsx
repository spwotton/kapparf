import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderControls } from "@/components/header-controls";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <SidebarProvider>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <HeaderControls />
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
