import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useReferralTracking } from "@/hooks/useReferralTracking";
import { useStaffPresence } from "@/hooks/useStaffPresence";
import Index from "./pages/Index";
import About from "./pages/About";
import Features from "./pages/Features";
import Rules from "./pages/Rules";
import Community from "./pages/Community";
import Whitelist from "./pages/Whitelist";
import Staff from "./pages/Staff";
import StaffProfile from "./pages/StaffProfile";
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
import AdminGallery from "./pages/AdminGallery";
import SupportChat from "./pages/SupportChat";
import AdminSupportChat from "./pages/AdminSupportChat";
import SupportAnalytics from "./pages/SupportAnalytics";
import AdminStaffStats from "./pages/AdminStaffStats";
import JobApplication from "./pages/JobApplication";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./contexts/CartContext";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useReferralTracking();
  useStaffPresence();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
      <Route path="/rules" element={<Rules />} />
      <Route path="/community" element={<Community />} />
      <Route path="/whitelist" element={<Whitelist />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/staff/:name" element={<StaffProfile />} />
      <Route path="/ban-appeal" element={<BanAppeal />} />
      <Route path="/guides" element={<Guides />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/status" element={<Status />} />
      <Route path="/support" element={<Support />} />
      <Route path="/store" element={<Store />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/confirmation" element={<Confirmation />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin-staff-applications" element={<AdminStaffApplications />} />
      <Route path="/admin-referrals" element={<AdminReferrals />} />
      <Route path="/admin/gallery" element={<AdminGallery />} />
      <Route path="/admin/support-chat" element={<AdminSupportChat />} />
      <Route path="/admin/support-analytics" element={<SupportAnalytics />} />
      <Route path="/admin/staff-stats" element={<AdminStaffStats />} />
      <Route path="/support-chat" element={<SupportChat />} />
      <Route path="/job-application" element={<JobApplication />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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
