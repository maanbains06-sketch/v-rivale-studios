import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
