import { Toaster } from "@/components/ui/sonner";
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
import ProfileEdit from "./pages/ProfileEdit";
import { Groups } from "./pages/Groups";
import { Events } from "./pages/Events";
import { ReelsPage } from "./pages/Reels";
import { Collections } from "./pages/Collections";
import { Challenges } from "./pages/Challenges";
import { Verification } from "./pages/Verification";
import { Polls } from "./pages/Polls";
import { ARFiltersPage } from "./pages/ARFilters";
import { SoundLibrary } from "./pages/SoundLibrary";
import { PagesPage } from "./pages/Pages";
import { AdsDashboard } from "./pages/AdsDashboard";
import VerificationFlowPage from "./pages/VerificationFlowPage";
import WelcomeScreen from "./pages/WelcomeScreen";
import ModeSelection from "./pages/ModeSelection";
import AdminVerification from "./pages/AdminVerification";
import AdminModerationAppeals from "./pages/AdminModerationAppeals";
import AdminMediaDashboard from "./pages/AdminMediaDashboard";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageSelector } from "./components/LanguageSelector";
import { NotificationBell } from "./components/NotificationBell";
import HandleProfile from "./pages/HandleProfile";
import Invitations from "./pages/Invitations";
import ProfileRewards from "./pages/ProfileRewards";
import OfflineVideos from "./pages/OfflineVideos";
import WatchLater from "./pages/WatchLater";
import CreatorPlaylists from "./pages/CreatorPlaylists";
import SubscriptionCollections from "./pages/SubscriptionCollections";
import PublicPlaylist from "./pages/PublicPlaylist";
import { VerificationGate } from "./components/VerificationGate";
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
      <Route path="/creator-playlists" component={CreatorPlaylists} />
      <Route path="/subscription-topics" component={SubscriptionCollections} />
      <Route path="/playlist/:playlistId" component={PublicPlaylist} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/marketplace"} component={Marketplace} />
      <Route path="/ads-dashboard" component={AdsDashboard} />
      <Route path="/creator-dashboard" component={CreatorDashboard} />
      <Route path="/admin/verification" component={AdminVerification} />
      <Route path="/admin/moderation-appeals" component={AdminModerationAppeals} />
      <Route path="/admin/media" component={AdminMediaDashboard} />
      <Route path="/users-management" component={UsersManagement} />
      <Route path={"/payment"} component={Payment} />
      <Route path={"/live"} component={LiveStreaming} />
      <Route path={"/profile-edit"} component={ProfileEdit} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/groups"} component={Groups} />
      <Route path={"/events"} component={Events} />
      <Route path={"/reels"} component={ReelsPage} />
      <Route path={"/collections"} component={Collections} />
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

function App() {
  return (
    <ErrorBoundary>
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
            <Router />
          </VerificationGate>
          <InstallAppPrompt />
          <Toaster />
          <MiniPlayer />
        </TooltipProvider>
        </MiniPlayerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
