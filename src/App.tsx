import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useReferralTracking } from "@/hooks/useReferralTracking";
import { useStaffPresence } from "@/hooks/useStaffPresence";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useState, useEffect, memo } from "react";
import { PageTransition } from "@/components/PageTransition";
import RequireAuth from "@/components/RequireAuth";

// Lazy load utility components
const LiveVisitorCounter = lazy(() => import("@/components/LiveVisitorCounter"));
const StaffPresenceTracker = lazy(() => import("@/components/StaffPresenceTracker"));
const LoadingScreen = lazy(() => import("@/components/LoadingScreen"));
const NetworkOfflineScreen = lazy(() => import("@/components/NetworkOfflineScreen"));

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Rules = lazy(() => import("./pages/Rules"));
const Community = lazy(() => import("./pages/Community"));
const Whitelist = lazy(() => import("./pages/Whitelist"));
const Staff = lazy(() => import("./pages/Staff"));
const StaffProfile = lazy(() => import("./pages/StaffProfile"));
const StaffSetup = lazy(() => import("./pages/StaffSetup"));
const BanAppeal = lazy(() => import("./pages/BanAppeal"));
const Guides = lazy(() => import("./pages/Guides"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Status = lazy(() => import("./pages/Status"));
const Support = lazy(() => import("./pages/Support"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminStaffApplications = lazy(() => import("./pages/AdminStaffApplications"));
const AdminReferrals = lazy(() => import("./pages/AdminReferrals"));
const AdminPromoAnalytics = lazy(() => import("./pages/AdminPromoAnalytics"));
const AdminGallery = lazy(() => import("./pages/AdminGallery"));
const SupportChat = lazy(() => import("./pages/SupportChat"));
const AdminSupportChat = lazy(() => import("./pages/AdminSupportChat"));
const SupportAnalytics = lazy(() => import("./pages/SupportAnalytics"));
const AdminStaffStats = lazy(() => import("./pages/AdminStaffStats"));
const AdminPlayers = lazy(() => import("./pages/AdminPlayers"));
const JobApplication = lazy(() => import("./pages/JobApplication"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const StaffOnboarding = lazy(() => import("./pages/StaffOnboarding"));
const ApplicationStatus = lazy(() => import("./pages/ApplicationStatus"));
const ContactOwner = lazy(() => import("./pages/ContactOwner"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const DiscordSignupForm = lazy(() => import("./pages/DiscordSignupForm"));
const DiscordProfile = lazy(() => import("./pages/DiscordProfile"));
const OwnerPanel = lazy(() => import("./pages/OwnerPanel"));
const GangRP = lazy(() => import("./pages/GangRP"));
const Feedback = lazy(() => import("./pages/Feedback"));
const AdminYoutubers = lazy(() => import("./pages/AdminYoutubers"));
const AdminStaffTeams = lazy(() => import("./pages/AdminStaffTeams"));
const AdminDiscordRules = lazy(() => import("./pages/AdminDiscordRules"));
const Giveaway = lazy(() => import("./pages/Giveaway"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized query client - balanced caching with proper data loading on navigation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - garbage collection
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: 'always', // Always check data freshness on mount - CRITICAL for navigation
      refetchOnReconnect: true, // Refetch when reconnecting
      networkMode: 'online', // Normal network mode for reliable data fetching
    },
  },
});

// Minimal page loading fallback
const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = "PageLoader";

const AppRoutes = memo(() => {
  useReferralTracking();
  useStaffPresence();
  const location = useLocation();
  
  return (
    <Suspense fallback={<PageLoader />}>
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
          <Route path="/admin/discord-rules" element={<PageTransition><AdminDiscordRules /></PageTransition>} />
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
          <Route path="/giveaway" element={<PageTransition><Giveaway /></PageTransition>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
});
AppRoutes.displayName = "AppRoutes";

const AppContent = memo(() => {
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
});
AppContent.displayName = "AppContent";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const safeGet = (key: string) => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    };

    const safeSet = (key: string, value: string) => {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // ignore (some browsers/private modes can block storage)
      }
    };

    // If loading screen ever fails to complete, force-unblock the app.
    const hardUnblock = window.setTimeout(() => {
      setShowContent(true);
      setIsLoading(false);
    }, 2500);

    // Check if this is the first visit in this session
    const hasVisited = safeGet("slrp_visited");
    if (hasVisited) {
      window.clearTimeout(hardUnblock);
      setIsLoading(false);
      setShowContent(true);
      return;
    }

    // For low-end devices, reduce loading time
    const isLowEndDevice =
      navigator.hardwareConcurrency <= 4 ||
      (navigator as any).deviceMemory <= 4 ||
      window.innerWidth < 640;

    if (isLowEndDevice) {
      safeSet("slrp_visited", "true");
      window.clearTimeout(hardUnblock);
      setIsLoading(false);
      setShowContent(true);
      return;
    }

    return () => window.clearTimeout(hardUnblock);
  }, []);

  const handleLoadingComplete = () => {
    try {
      sessionStorage.setItem("slrp_visited", "true");
    } catch {
      // ignore
    }
    setShowContent(true);
    setTimeout(() => setIsLoading(false), 200);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {isLoading && (
            <Suspense fallback={null}>
              <LoadingScreen onComplete={handleLoadingComplete} minDuration={500} />
            </Suspense>
          )}
          {showContent && <AppContent />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
