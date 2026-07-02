import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Videos from "./pages/Videos";
import Stories from "./pages/Stories";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Marketplace from "./pages/Marketplace";
import CreatorDashboard from "./pages/CreatorDashboard";
import Settings from "./pages/Settings";
import Payment from "./pages/Payment";
import LiveStreaming from "./pages/LiveStreaming";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/signup"} component={SignUp} />
      <Route path={"/feed"} component={Feed} />
      <Route path={"/explore"} component={Explore} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/videos"} component={Videos} />
      <Route path={"/stories"} component={Stories} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/marketplace"} component={Marketplace} />
      <Route path={"/creator-dashboard"} component={CreatorDashboard} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/payment"} component={Payment} />
      <Route path={"/live"} component={LiveStreaming} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
