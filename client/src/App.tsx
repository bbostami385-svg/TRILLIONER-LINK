import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import { UsersManagement } from "./pages/UsersManagement";
import Feed from "./pages/Feed";
const Explore = lazy(() => import("./pages/Explore"));
const Messages = lazy(() => import("./pages/Messages"));
const Videos = lazy(() => import("./pages/Videos"));
const Stories = lazy(() => import("./pages/Stories"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Payment = lazy(() => import("./pages/Payment"));
const LiveStreaming = lazy(() => import("./pages/LiveStreaming"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Groups = lazy(() => import("./pages/Groups").then((module) => ({ default: module.Groups })));
const Events = lazy(() => import("./pages/Events").then((module) => ({ default: module.Events })));
const ReelsPage = lazy(() => import("./pages/Reels").then((module) => ({ default: module.ReelsPage })));
const Collections = lazy(() => import("./pages/Collections").then((module) => ({ default: module.Collections })));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const Challenges = lazy(() => import("./pages/Challenges").then((module) => ({ default: module.Challenges })));
const Verification = lazy(() => import("./pages/Verification").then((module) => ({ default: module.Verification })));
const Polls = lazy(() => import("./pages/Polls").then((module) => ({ default: module.Polls })));
const ARFiltersPage = lazy(() => import("./pages/ARFilters").then((module) => ({ default: module.ARFiltersPage })));
const SoundLibrary = lazy(() => import("./pages/SoundLibrary").then((module) => ({ default: module.SoundLibrary })));
const PagesPage = lazy(() => import("./pages/Pages").then((module) => ({ default: module.PagesPage })));
const AdsDashboard = lazy(() => import("./pages/AdsDashboard").then((module) => ({ default: module.AdsDashboard })));
const VerificationFlowPage = lazy(() => import("./pages/VerificationFlowPage"));
import WelcomeScreen from "./pages/WelcomeScreen";
import ModeSelection from "./pages/ModeSelection";
const AdminVerification = lazy(() => import("./pages/AdminVerification"));
const AdminModerationAppeals = lazy(() => import("./pages/AdminModerationAppeals"));
const AdminModerationReports = lazy(() => import("./pages/AdminModerationReports"));
const AdminMediaDashboard = lazy(() => import("./pages/AdminMediaDashboard"));
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageSelector } from "./components/LanguageSelector";
import { NotificationBell } from "./components/NotificationBell";
const HandleProfile = lazy(() => import("./pages/HandleProfile"));
const Invitations = lazy(() => import("./pages/Invitations"));
const ProfileRewards = lazy(() => import("./pages/ProfileRewards"));
const OfflineVideos = lazy(() => import("./pages/OfflineVideos"));
const WatchLater = lazy(() => import("./pages/WatchLater"));
const WatchHistory = lazy(() => import("./pages/WatchHistory"));
const CreatorPlaylists = lazy(() => import("./pages/CreatorPlaylists"));
const SubscriptionCollections = lazy(() => import("./pages/SubscriptionCollections"));
const PublicPlaylist = lazy(() => import("./pages/PublicPlaylist"));
import { VerificationGate } from "./components/VerificationGate";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { shouldRedirectToWelcome } from "@/lib/modeOnboarding";
import { useTranslation } from "@/hooks/useTranslation";
import { translateDocument } from "@/lib/i18n";
import InstallAppPrompt from "./components/InstallAppPrompt";
import MiniPlayer, { MiniPlayerProvider } from "./components/MiniPlayer";
import "./App.css";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"signup"} component={SignUp} />
      <Route path={"login"} component={Login} />
      <Route path={"/verify"} component={VerificationFlowPage} />
      <Route path={"/welcome"} component={WelcomeScreen} />
      <Route path={"/mode-selection"} component={ModeSelection} />
      <Route path={"/feed"} component={Feed} />
      <Route path={"/explore"} component={Explore} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/videos"} component={Videos} />
      <Route path={"/shorts"} component={ReelsPage} />
      <Route path={"/stories"} component={Stories} />
      <Route path={"/profile"} component={Profile} />
      <Route path="/@/:handle" component={HandleProfile} />
      <Route path="/invitations" component={Invitations} />
      <Route path="/profile-rewards" component={ProfileRewards} />
      <Route path="/offline-videos" component={OfflineVideos} />
      <Route path="/watch-later" component={WatchLater} />
      <Route path="/watch-history" component={WatchHistory} />
      <Route path="/creator-playlists" component={CreatorPlaylists} />
      <Route path="/subscription-topics" component={SubscriptionCollections} />
      <Route path="/playlist/:playlistId" component={PublicPlaylist} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/marketplace"} component={Marketplace} />
      <Route path="/ads-dashboard" component={AdsDashboard} />
      <Route path="/creator-dashboard" component={CreatorDashboard} />
      <Route path="/admin/verification" component={AdminVerification} />
      <Route path="/admin/moderation-appeals" component={AdminModerationAppeals} />
      <Route path="/admin/moderation-reports" component={AdminModerationReports} />
      <Route path="/admin/media" component={AdminMediaDashboard} />
      <Route path="/users-management" component={UsersManagement} />
      <Route path={"/payment"} component={Payment} />
      <Route path={"/live"} component={LiveStreaming} />
      <Route path={"/profile-edit"} component={ProfileEdit} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/groups"} component={Groups} />
      <Route path={"/events"} component={Events} />
      <Route path={"/reels"} component={ReelsPage} />
      <Route path="/collections" component={Collections} />
      <Route path="/collection/:collectionId" component={CollectionDetail} />
      <Route path={"/challenges"} component={Challenges} />
      <Route path={"/verification"} component={Verification} />
      <Route path={"/polls"} component={Polls} />
      <Route path={"/ar-filters"} component={ARFiltersPage} />
      <Route path={"/sound-library"} component={SoundLibrary} />
      <Route path={"/pages"} component={PagesPage} />
      <Route path={"/404"} component={NotFound} />
      <Route path="*" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function ModeSelectionGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const isPublicOrOnboarding = ["/login", "/signup", "/verify", "/welcome", "/mode-selection"].includes(location);
  const currentMode = trpc.dualMode.getCurrentMode.useQuery(undefined, { enabled: isAuthenticated && !isPublicOrOnboarding, retry: false, staleTime: 30_000 });

  useEffect(() => {
    if (currentMode.data && shouldRedirectToWelcome({ isAuthenticated, location, modeSelected: currentMode.data.modeSelected })) setLocation("/welcome");
  }, [currentMode.data, currentMode.isLoading, isAuthenticated, isPublicOrOnboarding, setLocation]);

  return <>{children}</>;
}

function App() {
  const { language } = useTranslation();
  useEffect(() => {
    const translate = () => translateDocument();
    translate();
    const observer = new MutationObserver(translate);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);
  return (
    <ErrorBoundary>
      <div data-language={language}>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <MiniPlayerProvider>
        <TooltipProvider>
          <div className="app-header">
            <div className="app-controls">
              <NotificationBell />
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>
          <VerificationGate>
            <ModeSelectionGate>
              <Suspense fallback={<div className="min-h-screen grid place-items-center p-6 text-muted-foreground">Loading TRILLIONER LINK…</div>}><Router /></Suspense>
            </ModeSelectionGate>
          </VerificationGate>
          <InstallAppPrompt />
          <Toaster />
          <MiniPlayer />
        </TooltipProvider>
        </MiniPlayerProvider>
      </ThemeProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
