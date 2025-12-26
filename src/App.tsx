import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useReferralTracking } from "@/hooks/useReferralTracking";
import { useStaffPresence } from "@/hooks/useStaffPresence";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useState, useEffect } from "react";

const LiveVisitorCounter = lazy(() => import("@/components/LiveVisitorCounter"));
const StaffPresenceTracker = lazy(() => import("@/components/StaffPresenceTracker"));
const LoadingScreen = lazy(() => import("@/components/LoadingScreen"));
const NetworkOfflineScreen = lazy(() => import("@/components/NetworkOfflineScreen"));
import { PageTransition } from "@/components/PageTransition";
import RequireAuth from "@/components/RequireAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import Rules from "./pages/Rules";
import Community from "./pages/Community";
import Whitelist from "./pages/Whitelist";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
import StaffSetup from "./pages/StaffSetup";
import BanAppeal from "./pages/BanAppeal";
import Guides from "./pages/Guides";
import Gallery from "./pages/Gallery";
import Status from "./pages/Status";
import Support from "./pages/Support";
import Confirmation from "./pages/Confirmation";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminStaffApplications from "./pages/AdminStaffApplications";
import AdminReferrals from "./pages/AdminReferrals";
import AdminPromoAnalytics from "./pages/AdminPromoAnalytics";
import AdminGallery from "./pages/AdminGallery";
import SupportChat from "./pages/SupportChat";
import AdminSupportChat from "./pages/AdminSupportChat";
import SupportAnalytics from "./pages/SupportAnalytics";
import AdminStaffStats from "./pages/AdminStaffStats";
import AdminPlayers from "./pages/AdminPlayers";
import JobApplication from "./pages/JobApplication";
import Dashboard from "./pages/Dashboard";
import StaffOnboarding from "./pages/StaffOnboarding";
import ApplicationStatus from "./pages/ApplicationStatus";
import ContactOwner from "./pages/ContactOwner";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import DiscordSignupForm from "./pages/DiscordSignupForm";
import DiscordProfile from "./pages/DiscordProfile";
import OwnerPanel from "./pages/OwnerPanel";
import GangRP from "./pages/GangRP";
import Feedback from "./pages/Feedback";
import AdminYoutubers from "./pages/AdminYoutubers";
import AdminStaffTeams from "./pages/AdminStaffTeams";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useReferralTracking();
  useStaffPresence();
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/features" element={<PageTransition><Features /></PageTransition>} />
        <Route path="/rules" element={<PageTransition><Rules /></PageTransition>} />
        <Route path="/community" element={<PageTransition><Community /></PageTransition>} />
        <Route path="/whitelist" element={<PageTransition><RequireAuth message="Login with Discord to apply for whitelist."><Whitelist /></RequireAuth></PageTransition>} />
        <Route path="/staff" element={<PageTransition><Staff /></PageTransition>} />
        <Route path="/staff/:name" element={<PageTransition><StaffProfile /></PageTransition>} />
        <Route path="/staff-setup" element={<PageTransition><StaffSetup /></PageTransition>} />
        <Route path="/ban-appeal" element={<PageTransition><RequireAuth message="Login with Discord to submit a ban appeal."><BanAppeal /></RequireAuth></PageTransition>} />
        <Route path="/guides" element={<PageTransition><Guides /></PageTransition>} />
        <Route path="/gallery" element={<PageTransition><RequireAuth message="Login with Discord to view the gallery."><Gallery /></RequireAuth></PageTransition>} />
        <Route path="/status" element={<PageTransition><RequireAuth message="Login with Discord to view server status."><Status /></RequireAuth></PageTransition>} />
        <Route path="/support" element={<PageTransition><RequireAuth message="Login with Discord to access support."><Support /></RequireAuth></PageTransition>} />
        <Route path="/confirmation" element={<PageTransition><Confirmation /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/discord-signup" element={<PageTransition><DiscordSignupForm /></PageTransition>} />
        <Route path="/discord-profile" element={<PageTransition><DiscordProfile /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/admin-staff-applications" element={<PageTransition><AdminStaffApplications /></PageTransition>} />
        <Route path="/admin-referrals" element={<PageTransition><AdminReferrals /></PageTransition>} />
        <Route path="/admin-promo-analytics" element={<PageTransition><AdminPromoAnalytics /></PageTransition>} />
        <Route path="/admin/gallery" element={<PageTransition><AdminGallery /></PageTransition>} />
        <Route path="/admin/support-chat" element={<PageTransition><AdminSupportChat /></PageTransition>} />
        <Route path="/admin/support-analytics" element={<PageTransition><SupportAnalytics /></PageTransition>} />
        <Route path="/admin/staff-stats" element={<PageTransition><AdminStaffStats /></PageTransition>} />
        <Route path="/admin/players-active" element={<PageTransition><AdminPlayers /></PageTransition>} />
        <Route path="/admin/youtubers" element={<PageTransition><AdminYoutubers /></PageTransition>} />
        <Route path="/admin/staff-teams" element={<PageTransition><AdminStaffTeams /></PageTransition>} />
        <Route path="/support-chat" element={<PageTransition><RequireAuth message="Login with Discord to access support chat."><SupportChat /></RequireAuth></PageTransition>} />
        <Route path="/job-application" element={<PageTransition><RequireAuth message="Login with Discord to apply for jobs."><JobApplication /></RequireAuth></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><RequireAuth message="Login with Discord to access your dashboard."><Dashboard /></RequireAuth></PageTransition>} />
        <Route path="/staff-onboarding" element={<PageTransition><StaffOnboarding /></PageTransition>} />
        <Route path="/application-status" element={<PageTransition><RequireAuth message="Login with Discord to check your application status."><ApplicationStatus /></RequireAuth></PageTransition>} />
        <Route path="/contact-owner" element={<PageTransition><RequireAuth message="Login with Discord to contact the owner."><ContactOwner /></RequireAuth></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
        <Route path="/owner-panel" element={<PageTransition><OwnerPanel /></PageTransition>} />
        <Route path="/gang-rp" element={<PageTransition><RequireAuth message="Login with Discord to access Gang RP applications."><GangRP /></RequireAuth></PageTransition>} />
        <Route path="/feedback" element={<PageTransition><RequireAuth message="Login with Discord to submit feedback."><Feedback /></RequireAuth></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const { isOnline } = useNetworkStatus();

  return (
    <>
      {!isOnline && (
        <Suspense fallback={null}>
          <NetworkOfflineScreen />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <LiveVisitorCounter />
        <StaffPresenceTracker />
      </Suspense>
      <AppRoutes />
    </>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasVisited = sessionStorage.getItem("slrp_visited");
    if (hasVisited) {
      setIsLoading(false);
      setShowContent(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem("slrp_visited", "true");
    setShowContent(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {isLoading && (
            <Suspense fallback={null}>
              <LoadingScreen onComplete={handleLoadingComplete} minDuration={2500} />
            </Suspense>
          )}
          {showContent && <AppContent />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
