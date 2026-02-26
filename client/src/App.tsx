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
import OverviewPage from "@/pages/overview";
import SignalsPage from "@/pages/signals";
import SatellitesPage from "@/pages/satellites";
import AnomaliesPage from "@/pages/anomalies";
import NodesPage from "@/pages/nodes";
import ConstantsPage from "@/pages/constants";

function Router() {
  return (
    <Switch>
      <Route path="/" component={OverviewPage} />
      <Route path="/signals" component={SignalsPage} />
      <Route path="/satellites" component={SatellitesPage} />
      <Route path="/anomalies" component={AnomaliesPage} />
      <Route path="/nodes" component={NodesPage} />
      <Route path="/constants" component={ConstantsPage} />
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
