import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import Investigation from "./pages/Investigation";
import DesignSystemDemo from "./pages/DesignSystemDemo";

/**
 * App shell.
 *
 * Route "/" renders Investigation, which starts directly in the workstation
 * with an empty/new investigation state.
 *
 * Users can access the cinematic landing through navigation or start fresh
 * investigations by uploading imagery and asking questions.
 */
function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Investigation} />
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

