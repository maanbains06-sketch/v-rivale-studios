import { useEffect, useState, useCallback, memo } from "react";
import { NavLink } from "./NavLink";
import { Users, Shield, LogOut, Menu, UserCircle, Mail, Image as ImageIcon, MessageSquare, BarChart3, ChevronDown, Lock, Scale, CreditCard, ExternalLink, Crown, LayoutDashboard, Gift, Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { NotificationBell } from "./NotificationBell";
import { useStaffRole } from "@/hooks/useStaffRole";
import { useRosterAccess } from "@/hooks/useRosterAccess";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useWebsitePresence } from "@/hooks/useWebsitePresence";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEBEX_STORE_URL = "https://skylife-roleplay-india.tebex.io";

// Owner Discord ID for verification - ONLY Maan has owner access
const OWNER_DISCORD_ID = "833680146510381097";

// Staff Discord IDs with admin access (Leadership, Management, Administration, Development)
// NOTE: Owner ID is NOT included here - owner has separate elevated access
const ADMIN_DISCORD_IDS = [
  "727581954408710272", // ASCENDOR - Management
  "1417622059617357824", // Sexy - Management  
  "407091450560643073", // TheKid™ - Management
  "299129047177363466", // Shroud - Administration
  "916158803928567858", // Yug - Administration
  "1055766042871349248", // DagoBato - Development
];

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasStaffAdminAccess, setHasStaffAdminAccess] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userDiscordId, setUserDiscordId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, department, loading } = useStaffRole();
  const { hasAccess: hasRosterAccess, loading: rosterLoading } = useRosterAccess();
  const { settings: siteSettings, loading: siteSettingsLoading } = useSiteSettings();

  // Determine if roster should be visible (hidden during maintenance for non-staff/owner)
  const isMaintenanceMode = siteSettings.maintenance_mode;
  const canSeeRosterDuringMaintenance = isOwner || hasStaffAdminAccess;
  const showRosterLink = hasRosterAccess && (!isMaintenanceMode || canSeeRosterDuringMaintenance);

  // Business header visibility
  // Avoid showing the Business link during initial refresh before settings finish loading.
  // Owners still always see it.
  const showBusinessLink = isOwner || (!siteSettingsLoading && !siteSettings.business_header_hidden);

  // Track staff presence when logged in with Discord ID
  useWebsitePresence({ 
    visitorId: userDiscordId || undefined, 
    enabled: !!userDiscordId && hasStaffAdminAccess 
  });

  // Check if user has admin panel access based on Discord ID
  const checkUserAccess = useCallback(async (currentUser: any) => {
    if (!currentUser) {
      setIsOwner(false);
      setHasStaffAdminAccess(false);
      setUserDiscordId(null);
      return;
    }

    const discordId = currentUser.user_metadata?.discord_id;
    setUserDiscordId(discordId || null);
    
    // Check owner status by Discord ID
    if (discordId === OWNER_DISCORD_ID) {
      setIsOwner(true);
      setHasStaffAdminAccess(true);
      return;
    }

    // Check if user's Discord ID is in hardcoded admin list
    if (discordId && ADMIN_DISCORD_IDS.includes(discordId)) {
      setHasStaffAdminAccess(true);
      return;
    }

    // All staff members get admin panel access
    if (discordId && /^\d{17,19}$/.test(discordId)) {
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('role_type, is_active')
        .eq('discord_id', discordId)
        .eq('is_active', true)
        .maybeSingle();

      if (staffMember) {
        // Check if this staff member is the owner
        if (staffMember.role_type === 'owner') {
          setIsOwner(true);
        }
        // All active staff members get admin panel access
        setHasStaffAdminAccess(true);
        return;
      }
    }

    // Fallback: check database role by user_id
    const { data: ownerResult } = await supabase.rpc('is_owner', { _user_id: currentUser.id });
    if (ownerResult) {
      setIsOwner(true);
      setHasStaffAdminAccess(true);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    await checkUserAccess(user);
  };

  // Helper functions for user avatar
  const getUserAvatar = () => {
    if (!user) return null;
    
    // Try Discord CDN avatar first
    const discordId = user.user_metadata?.discord_id;
    const avatarHash = user.user_metadata?.avatar;
    if (discordId && avatarHash) {
      return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=128`;
    }
    
    // Try other avatar sources from OAuth metadata
    return user.user_metadata?.avatar_url || 
           user.user_metadata?.picture || 
           user.user_metadata?.profile_picture ||
           null;
  };

  const getDiscordUsername = () => {
    if (!user) return "User";
    return user.user_metadata?.username ||
           user.user_metadata?.display_name ||
           user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.user_name ||
           user.user_metadata?.preferred_username ||
           user.email?.split("@")[0] ||
           "User";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = async () => {
    // Clear owner 2FA session on logout
    sessionStorage.removeItem('owner_2fa_verified');
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
    toast({
      title: "Logged out successfully",
    });
  };

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Brand */}
            <Link
              to="/"
              className="flex flex-col items-center leading-none focus:outline-none"
              aria-label="Go to home"
              onClick={() => setIsMenuOpen(false)}
            >
              <span
                className="brand-title text-base md:text-lg font-bold tracking-wide whitespace-nowrap"
              >
                SKYLIFE ROLEPLAY
              </span>
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] flex gap-0.5 justify-center brand-subtitle india-tricolor-text">
                <span className="india-letter-1">I</span>
                <span className="india-letter-2">N</span>
                <span className="india-letter-3">D</span>
                <span className="india-letter-4">I</span>
                <span className="india-letter-5">A</span>
              </span>
            </Link>
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
            {showBusinessLink && (
              <NavLink 
                to="/business" 
                className="text-foreground/80 hover:text-primary transition-colors"
                activeClassName="text-primary"
              >
                Business
              </NavLink>
            )}
            <NavLink 
              to="/gang-rp" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Gang RP
            </NavLink>
            <NavLink 
              to="/support" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Support
            </NavLink>
            {showRosterLink && (
              <NavLink 
                to="/roster" 
                className="text-foreground/80 hover:text-primary transition-colors"
                activeClassName="text-primary"
              >
                Roster
              </NavLink>
            )}
            <NavLink 
              to="/giveaway" 
              className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
              activeClassName="text-primary"
            >
              <Gift className="w-4 h-4" />
              Giveaway
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
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/privacy-policy" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/terms-of-service" className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-secondary" />
                    Terms of Service
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/refund-policy" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Refund Policy
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Admin link moved to hamburger menu only */}
          </div>
          
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {user && <NotificationBell />}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="glass-effect order-last"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] bg-background/95 backdrop-blur-xl border-border/20 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-gradient">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  {/* Staff & Owner Panel Access - Always at top */}
                  {(hasStaffAdminAccess || isOwner) && (
                    <div className="flex flex-col gap-1 pb-4 border-b border-border/30">
                      {hasStaffAdminAccess && !isOwner && (
                        <Button 
                          variant="outline"
                          className="justify-start glass-effect border-primary/30"
                          asChild
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Link to="/admin">
                            <Shield className="w-4 h-4 mr-2 text-primary" />
                            Admin Panel
                          </Link>
                        </Button>
                      )}
                      {isOwner && (
                        <>
                          <Button 
                            variant="outline"
                            className="justify-start glass-effect border-amber-500/30"
                            asChild
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Link to="/owner-panel">
                              <Crown className="w-4 h-4 mr-2 text-amber-400" />
                              Owner Panel
                            </Link>
                          </Button>
                          <Button 
                            variant="outline"
                            className="justify-start glass-effect border-primary/30"
                            asChild
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Link to="/admin">
                              <Shield className="w-4 h-4 mr-2 text-primary" />
                              Admin Panel
                            </Link>
                          </Button>
                          <Button 
                            variant="outline"
                            className="justify-start glass-effect border-green-500/30"
                            asChild
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Link to="/job-panel">
                              <Briefcase className="w-4 h-4 mr-2 text-green-400" />
                              Job Panel
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Main Navigation Links - Mobile Only */}
                  <div className="flex flex-col gap-1 pb-4 border-b border-border/30 md:hidden">
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/">Home</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/about">About</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/features">Features</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/guides">Guides</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/gallery">Gallery</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/staff">Staff</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/job-application">Jobs</Link>
                    </Button>
                    {showBusinessLink && (
                      <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                        <Link to="/business">Business</Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/gang-rp">Gang RP</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/support">Support</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/support-chat" className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Support Chat
                      </Link>
                    </Button>
                    {showRosterLink && (
                      <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                        <Link to="/roster">Roster</Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/giveaway" className="flex items-center">
                        <Gift className="w-4 h-4 mr-2" />
                        Giveaway
                      </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild>
                      <a href={TEBEX_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        Store <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/privacy-policy">Privacy Policy</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/terms-of-service">Terms of Service</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                      <Link to="/refund-policy">Refund Policy</Link>
                    </Button>
                  </div>

                  {/* Quick Admin Links - Only visible to staff */}
                  {hasStaffAdminAccess && (
                    <div className="flex flex-col gap-1 pb-4 border-b border-border/30">
                      <p className="text-xs text-muted-foreground px-2 py-1">Quick Access</p>
                      <Button 
                        variant="ghost"
                        className="justify-start text-sm"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/admin-staff-applications" className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Staff Applications
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost"
                        className="justify-start text-sm"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/admin/support-chat" className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Support Chats
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost"
                        className="justify-start text-sm"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/gallery" className="flex items-center">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Gallery
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost"
                        className="justify-start text-sm"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/admin/staff-stats" className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Link>
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline"
                    className="justify-start glass-effect"
                    asChild
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Link to="/contact-owner" className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Server Owner
                    </Link>
                  </Button>
                  
                  {user ? (
                    <>
                      {/* Mobile User Profile Card */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-primary/40 shadow-lg shadow-primary/20">
                            <AvatarImage src={getUserAvatar() || undefined} alt={getDiscordUsername()} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                              {getInitials(getDiscordUsername())}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{getDiscordUsername()}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/discord-profile" className="flex items-center">
                          <UserCircle className="w-4 h-4 mr-2" />
                          My Profile
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/dashboard" className="flex items-center">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        asChild
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/application-status" className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Application Status
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowLogoutDialog(true);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link to="/auth" className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Join Now
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
          </div>
        </div>
      </div>
    </nav>

    {/* Logout Confirmation Dialog */}
    <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <AlertDialogContent className="bg-background/95 backdrop-blur-xl border border-border/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-destructive" />
            Sign Out
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You'll need to log in again to access your profile and applications.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border/30">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default Navigation;
