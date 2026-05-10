import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Stage1 from "@/pages/stage-1";
import Stage2 from "@/pages/stage-2";
import Stage3 from "@/pages/stage-3";
import Stage4 from "@/pages/stage-4";
import Stage5 from "@/pages/stage-5";
import Stage6 from "@/pages/stage-6";
import Stage7 from "@/pages/stage-7";
import Stage8 from "@/pages/stage-8";
import Stage9 from "@/pages/stage-9";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/session/:sessionId/stage/1" component={Stage1} />
      <Route path="/session/:sessionId/stage/2" component={Stage2} />
      <Route path="/session/:sessionId/stage/3" component={Stage3} />
      <Route path="/session/:sessionId/stage/4" component={Stage4} />
      <Route path="/session/:sessionId/stage/5" component={Stage5} />
      <Route path="/session/:sessionId/stage/6" component={Stage6} />
      <Route path="/session/:sessionId/stage/7" component={Stage7} />
      <Route path="/session/:sessionId/stage/8" component={Stage8} />
      <Route path="/session/:sessionId/stage/9" component={Stage9} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
