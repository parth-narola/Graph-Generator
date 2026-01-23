import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SingleBarChart from "@/pages/single-bar-chart";
import LineChart from "@/pages/line-chart";
import AreaChart from "@/pages/area-chart";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2">
        <Link href="/">
          <Button
            variant={location === "/" ? "default" : "ghost"}
            size="sm"
            data-testid="nav-comparison"
          >
            Comparison Chart
          </Button>
        </Link>
        <Link href="/single">
          <Button
            variant={location === "/single" ? "default" : "ghost"}
            size="sm"
            data-testid="nav-single"
          >
            Single Bar Chart
          </Button>
        </Link>
        <Link href="/line">
          <Button
            variant={location === "/line" ? "default" : "ghost"}
            size="sm"
            data-testid="nav-line"
          >
            Line Chart
          </Button>
        </Link>
        <Link href="/area">
          <Button
            variant={location === "/area" ? "default" : "ghost"}
            size="sm"
            data-testid="nav-area"
          >
            Area Chart
          </Button>
        </Link>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/single" component={SingleBarChart} />
      <Route path="/line" component={LineChart} />
      <Route path="/area" component={AreaChart} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Navigation />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
