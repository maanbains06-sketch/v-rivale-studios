import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { Users, Shield, FileCheck, LogOut, Menu, UserCircle, Mail, Ban, Briefcase, Gift, Image as ImageIcon, MessageSquare, BarChart3, ChevronDown, Lock, Scale, CreditCard, Ticket, ExternalLink, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { NotificationBell } from "./NotificationBell";
import { useStaffRole } from "@/hooks/useStaffRole";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEBEX_STORE_URL = "https://skylife-roleplay-india.tebex.io";

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, department, loading } = useStaffRole();

  // Check if user has admin panel access (admin role OR leadership/administration/development department)
  const hasAdminAccess = isAdmin || 
    (department && ['leadership', 'administration', 'development'].includes(department.toLowerCase()));

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    // Check if user is owner
    if (user) {
      const { data: ownerResult } = await supabase.rpc('is_owner', { _user_id: user.id });
      setIsOwner(ownerResult || false);
    } else {
      setIsOwner(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
    toast({
      title: "Logged out successfully",
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect nav-glow border-b-2 border-primary/30 shadow-[0_0_60px_rgba(var(--primary),0.25),0_0_120px_rgba(var(--primary),0.1)]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Animated Brand Text */}
            <motion.div 
              className="flex flex-col leading-none cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/")}
            >
              <motion.span 
                className="text-base md:text-lg font-bold tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, hsl(185 100% 50%), hsl(199 89% 48%), hsl(260 90% 60%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontStyle: 'italic',
                  transform: 'skewX(-12deg)',
                }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                SKYLIFE ROLEPLAY
              </motion.span>
              <motion.span 
                className="text-[10px] md:text-xs font-bold tracking-[0.25em] flex gap-0.5 justify-center w-full"
                style={{
                  fontStyle: 'italic',
                  transform: 'skewX(-12deg)',
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <motion.span 
                  animate={{ color: ['#FF9933', '#FFFFFF', '#138808', '#FF9933'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ textShadow: '0 0 6px currentColor' }}
                >I</motion.span>
                <motion.span 
                  animate={{ color: ['#FFFFFF', '#138808', '#FF9933', '#FFFFFF'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                  style={{ textShadow: '0 0 6px currentColor' }}
                >N</motion.span>
                <motion.span 
                  animate={{ color: ['#138808', '#FF9933', '#FFFFFF', '#138808'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  style={{ textShadow: '0 0 6px currentColor' }}
                >D</motion.span>
                <motion.span 
                  animate={{ color: ['#FF9933', '#FFFFFF', '#138808', '#FF9933'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.45 }}
                  style={{ textShadow: '0 0 6px currentColor' }}
                >I</motion.span>
                <motion.span 
                  animate={{ color: ['#FFFFFF', '#138808', '#FF9933', '#FFFFFF'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  style={{ textShadow: '0 0 6px currentColor' }}
                >A</motion.span>
              </motion.span>
            </motion.div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              About
            </NavLink>
            <NavLink 
              to="/features" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Features
            </NavLink>
            <NavLink 
              to="/guides" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Guides
            </NavLink>
            <NavLink 
              to="/gallery" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Gallery
            </NavLink>
            <NavLink 
              to="/staff" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Staff
            </NavLink>
            <NavLink 
              to="/job-application" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Jobs
            </NavLink>
            <NavLink 
              to="/roster" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Roster
            </NavLink>
            <NavLink 
              to="/gang-rp" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Gang RP
            </NavLink>
            <NavLink 
              to="/status" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Status
            </NavLink>
            <NavLink 
              to="/support" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Support
            </NavLink>
            <a
              href={TEBEX_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
            >
              Store
              <ExternalLink className="w-3 h-3" />
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1 outline-none">
                Legal
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background/95 backdrop-blur-xl border border-border/20 shadow-xl z-50">
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => navigate("/privacy-policy")}
                >
                  <Lock className="w-4 h-4 text-primary" />
                  Privacy Policy
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => navigate("/terms-of-service")}
                >
                  <Scale className="w-4 h-4 text-secondary" />
                  Terms of Service
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => navigate("/refund-policy")}
                >
                  <CreditCard className="w-4 h-4 text-primary" />
                  Refund Policy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {hasAdminAccess && (
              <NavLink 
                to="/admin" 
                className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
                activeClassName="text-primary"
              >
                <Shield className="w-4 h-4" />
                Admin
              </NavLink>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="glass-effect md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] bg-background/95 backdrop-blur-xl border-border/20 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-gradient">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  {/* Main Navigation Links - Mobile Only */}
                  <div className="flex flex-col gap-1 pb-4 border-b border-border/30">
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/"); setIsMenuOpen(false); }}>
                      Home
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/about"); setIsMenuOpen(false); }}>
                      About
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/features"); setIsMenuOpen(false); }}>
                      Features
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/guides"); setIsMenuOpen(false); }}>
                      Guides
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/gallery"); setIsMenuOpen(false); }}>
                      Gallery
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/staff"); setIsMenuOpen(false); }}>
                      Staff
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/job-application"); setIsMenuOpen(false); }}>
                      Jobs
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/roster"); setIsMenuOpen(false); }}>
                      Roster
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/gang-rp"); setIsMenuOpen(false); }}>
                      Gang RP
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/status"); setIsMenuOpen(false); }}>
                      Status
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/support"); setIsMenuOpen(false); }}>
                      Support
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild>
                      <a href={TEBEX_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        Store <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/privacy-policy"); setIsMenuOpen(false); }}>
                      Privacy Policy
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/terms-of-service"); setIsMenuOpen(false); }}>
                      Terms of Service
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { navigate("/refund-policy"); setIsMenuOpen(false); }}>
                      Refund Policy
                    </Button>
                  </div>

                  {/* Admin & User Options */}
                  {hasAdminAccess && (
                    <Button 
                      variant="outline"
                      className="justify-start glass-effect"
                      onClick={() => {
                        navigate("/admin");
                        setIsMenuOpen(false);
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}
                  {hasAdminAccess && (
                    <>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Checking
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Ban Appeals
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Job Applications
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin-staff-applications");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Staff Applications
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin-referrals");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Referral Analytics
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin-promo-analytics");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        Promo Code Analytics
                      </Button>
                      <Button
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin/gallery");
                          setIsMenuOpen(false);
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Gallery Management
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin/support-chat");
                          setIsMenuOpen(false);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Support Chat Management
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin/support-analytics");
                          setIsMenuOpen(false);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Support Analytics
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin/staff-stats");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Staff Statistics
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin/players-active");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Players Active
                      </Button>
                    </>
                  )}
                  {isOwner && (
                    <Button 
                      variant="outline"
                      className="justify-start glass-effect border-primary/30"
                      onClick={() => {
                        navigate("/owner-panel");
                        setIsMenuOpen(false);
                      }}
                    >
                      <Crown className="w-4 h-4 mr-2 text-primary" />
                      Owner Panel
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    className="justify-start glass-effect"
                    onClick={() => {
                      navigate("/contact-owner");
                      setIsMenuOpen(false);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Server Owner
                  </Button>
                  
                  {user ? (
                    <>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/dashboard");
                          setIsMenuOpen(false);
                        }}
                      >
                        <UserCircle className="w-4 h-4 mr-2" />
                        My Dashboard
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => {
                        navigate("/auth");
                        setIsMenuOpen(false);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Now
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Desktop User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="glass-effect hidden md:flex"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border border-border/20 shadow-xl z-50">
                {hasAdminAccess && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/admin")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/owner-panel")}>
                    <Crown className="w-4 h-4 mr-2 text-primary" />
                    Owner Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/contact-owner")}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Owner
                </DropdownMenuItem>
                {user ? (
                  <>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/dashboard")}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      My Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/auth")}>
                    <Users className="w-4 h-4 mr-2" />
                    Join Now
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
