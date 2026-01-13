import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  Shield,
  ChevronDown,
  CheckCircle2,
  XCircle,
  FileText,
  Crown,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface HeaderProfileDropdownProps {
  className?: string;
}

interface DiscordVerification {
  isMember: boolean;
  hasWhitelistRole: boolean;
  loading: boolean;
}

const HeaderProfileDropdown = ({ className = "" }: HeaderProfileDropdownProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [discordVerification, setDiscordVerification] = useState<DiscordVerification>({
    isMember: false,
    hasWhitelistRole: false,
    loading: true
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check Discord membership and roles
  const verifyDiscord = useCallback(async () => {
    if (!user) {
      setDiscordVerification({ isMember: false, hasWhitelistRole: false, loading: false });
      return;
    }

    const discordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id || user.user_metadata?.sub;
    
    if (!discordId) {
      setDiscordVerification({ isMember: false, hasWhitelistRole: false, loading: false });
      return;
    }

    setDiscordVerification(prev => ({ ...prev, loading: true }));

    try {
      // Try verify-discord-requirements first for more complete check
      const { data, error } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId }
      });

      if (!error && data) {
        setDiscordVerification({
          isMember: data.isInServer || false,
          hasWhitelistRole: data.hasWhitelistRole || false,
          loading: false
        });
      } else {
        // Fallback to membership check
        const { data: memberData } = await supabase.functions.invoke('verify-discord-membership', {
          body: { discordId }
        });
        
        setDiscordVerification({
          isMember: memberData?.isMember || false,
          hasWhitelistRole: false,
          loading: false
        });
      }
    } catch (err) {
      console.error('Discord verification error:', err);
      setDiscordVerification({ isMember: false, hasWhitelistRole: false, loading: false });
    }
  }, [user]);

  // Check admin/owner status
  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsOwner(false);
      return;
    }

    try {
      // Check admin role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasAdminRole = userRoles?.some(r => r.role === 'admin' || r.role === 'moderator') || false;
      
      // Check owner using RPC function
      const { data: ownerResult } = await supabase.rpc('is_owner', { _user_id: user.id });
      const hasOwnerRole = ownerResult || false;

      // Check staff member status
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('department, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      const isStaffAdmin = staffMember?.department && 
        ['leadership', 'administration', 'development'].includes(staffMember.department.toLowerCase());

      setIsAdmin(hasAdminRole || isStaffAdmin || false);
      setIsOwner(hasOwnerRole);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user && !loading) {
      verifyDiscord();
      checkAdminStatus();
    }
  }, [user, loading, verifyDiscord, checkAdminStatus]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
    toast({
      title: "Logged out successfully",
    });
  };

  // Get Discord avatar and username from user metadata
  const getDiscordAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  const getDiscordUsername = () => {
    if (!user) return "User";
    return user.user_metadata?.username ||
           user.user_metadata?.display_name ||
           user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.preferred_username ||
           user.email?.split('@')[0] ||
           "User";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Don't show if not logged in
  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const avatarUrl = getDiscordAvatar();
  const username = getDiscordUsername();

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger className={`outline-none ${className}`}>
        <motion.div 
          className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <Avatar className="w-7 h-7 border-2 border-primary/30">
              <AvatarImage src={avatarUrl || undefined} alt={username} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {getInitials(username)}
              </AvatarFallback>
            </Avatar>
            {/* Discord Status Indicator */}
            {!discordVerification.loading && (
              <div 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                  discordVerification.isMember ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            )}
          </div>
          <span className="text-sm font-medium text-foreground/90 max-w-[100px] truncate hidden lg:block">
            {username}
          </span>
          {/* Server Member Badge */}
          {!discordVerification.loading && discordVerification.isMember && (
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0 hidden lg:flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Member
            </Badge>
          )}
          {!discordVerification.loading && !discordVerification.isMember && (
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0 hidden lg:flex items-center gap-1">
              <XCircle className="w-2.5 h-2.5" />
              Not in Server
            </Badge>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-background/95 backdrop-blur-xl border border-border/20 shadow-2xl z-50 p-2"
      >
        {/* Profile Header */}
        <div className="px-3 py-3 mb-2 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-primary/40 shadow-lg shadow-primary/20">
                <AvatarImage src={avatarUrl || undefined} alt={username} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {getInitials(username)}
                </AvatarFallback>
              </Avatar>
              {/* Status Indicator */}
              {!discordVerification.loading && (
                <div 
                  className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background ${
                    discordVerification.isMember ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{username}</p>
              <div className="flex flex-col gap-1 mt-1">
                {discordVerification.loading ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  <>
                    <Badge 
                      className={`text-[10px] px-1.5 py-0 w-fit ${
                        discordVerification.isMember 
                          ? 'bg-green-500/15 text-green-400 border-green-500/25' 
                          : 'bg-red-500/15 text-red-400 border-red-500/25'
                      }`}
                    >
                      {discordVerification.isMember ? (
                        <><CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Server Member</>
                      ) : (
                        <><XCircle className="w-2.5 h-2.5 mr-1" /> Not in Server</>
                      )}
                    </Badge>
                    {discordVerification.hasWhitelistRole && (
                      <Badge className="bg-primary/15 text-primary border-primary/25 text-[10px] px-1.5 py-0 w-fit">
                        <Shield className="w-2.5 h-2.5 mr-1" /> Whitelisted
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2 py-2.5 rounded-lg hover:bg-primary/10"
          onClick={() => navigate("/discord-profile")}
        >
          <UserIcon className="w-4 h-4 text-primary" />
          <span>My Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2 py-2.5 rounded-lg hover:bg-primary/10"
          onClick={() => navigate("/dashboard")}
        >
          <LayoutDashboard className="w-4 h-4 text-secondary" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2 py-2.5 rounded-lg hover:bg-primary/10"
          onClick={() => navigate("/whitelist")}
        >
          <FileText className="w-4 h-4 text-accent" />
          <span>Apply for Whitelist</span>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator className="my-2 bg-border/30" />
            <DropdownMenuItem 
              className="cursor-pointer flex items-center gap-2 py-2.5 rounded-lg hover:bg-primary/10"
              onClick={() => navigate("/admin")}
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          </>
        )}

        {isOwner && (
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2 py-2.5 rounded-lg hover:bg-primary/10"
            onClick={() => navigate("/owner-panel")}
          >
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>Owner Panel</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-2 bg-border/30" />

        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

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

export default HeaderProfileDropdown;
