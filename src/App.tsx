import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useReferralTracking } from "@/hooks/useReferralTracking";
import { useStaffPresence } from "@/hooks/useStaffPresence";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
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
import Store from "./pages/Store";
import Checkout from "./pages/Checkout";
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
import JobApplication from "./pages/JobApplication";
import Dashboard from "./pages/Dashboard";
import StaffOnboarding from "./pages/StaffOnboarding";
import ApplicationStatus from "./pages/ApplicationStatus";
import ContactOwner from "./pages/ContactOwner";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./contexts/CartContext";

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
        <Route path="/whitelist" element={<PageTransition><Whitelist /></PageTransition>} />
        <Route path="/staff" element={<PageTransition><Staff /></PageTransition>} />
        <Route path="/staff/:name" element={<PageTransition><StaffProfile /></PageTransition>} />
        <Route path="/staff-setup" element={<PageTransition><StaffSetup /></PageTransition>} />
        <Route path="/ban-appeal" element={<PageTransition><BanAppeal /></PageTransition>} />
        <Route path="/guides" element={<PageTransition><Guides /></PageTransition>} />
        <Route path="/gallery" element={<PageTransition><Gallery /></PageTransition>} />
        <Route path="/status" element={<PageTransition><Status /></PageTransition>} />
        <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
        <Route path="/store" element={<PageTransition><Store /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/confirmation" element={<PageTransition><Confirmation /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="/admin-staff-applications" element={<PageTransition><AdminStaffApplications /></PageTransition>} />
        <Route path="/admin-referrals" element={<PageTransition><AdminReferrals /></PageTransition>} />
        <Route path="/admin-promo-analytics" element={<PageTransition><AdminPromoAnalytics /></PageTransition>} />
        <Route path="/admin/gallery" element={<PageTransition><AdminGallery /></PageTransition>} />
        <Route path="/admin/support-chat" element={<PageTransition><AdminSupportChat /></PageTransition>} />
        <Route path="/admin/support-analytics" element={<PageTransition><SupportAnalytics /></PageTransition>} />
        <Route path="/admin/staff-stats" element={<PageTransition><AdminStaffStats /></PageTransition>} />
        <Route path="/support-chat" element={<PageTransition><SupportChat /></PageTransition>} />
        <Route path="/job-application" element={<PageTransition><JobApplication /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/staff-onboarding" element={<PageTransition><StaffOnboarding /></PageTransition>} />
        <Route path="/application-status" element={<PageTransition><ApplicationStatus /></PageTransition>} />
        <Route path="/contact-owner" element={<PageTransition><ContactOwner /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
