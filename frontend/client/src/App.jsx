import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import Home from "./pages/Home";
import Investigation from "./pages/Investigation";
import DesignSystemDemo from "./pages/DesignSystemDemo";

/**
 * App shell.
 *
 * Route "/" renders Home (Omkar's SatQuery AI Earth Observation Workstation),
 * with full VQA, CHANGE, FUSION, and GROUNDING execution tabs.
 *
 * Route "/investigation" renders the conversational investigation UI.
 */
function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/investigation"} component={Investigation} />
      <Route path={"/design-demo"} component={DesignSystemDemo} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;

