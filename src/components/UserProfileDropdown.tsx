import { useState, useEffect } from "react";
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
  Settings, 
  LayoutDashboard,
  Shield,
  ChevronDown,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface UserProfileDropdownProps {
  className?: string;
}

const UserProfileDropdown = ({ className = "" }: UserProfileDropdownProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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

  // Check Discord server membership
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsMember(null);
        return;
      }

      // Get discord_id from user metadata (stored during signup)
      const discordId = user.user_metadata?.discord_id;
      
      if (!discordId || !/^\d{17,19}$/.test(discordId)) {
        setIsMember(false);
        return;
      }

      setCheckingMembership(true);

      try {
        const { data, error } = await supabase.functions.invoke('verify-discord-membership', {
          body: { discordId }
        });

        if (error) {
          setIsMember(false);
        } else {
          setIsMember(data.isMember);
        }
      } catch (err) {
        setIsMember(false);
      } finally {
        setCheckingMembership(false);
      }
    };

    if (user && !loading) {
      checkMembership();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
    toast({
      title: "Logged out successfully",
    });
  };

  // Get user avatar from metadata (Discord or other OAuth providers)
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

  // Don't show if not logged in
  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const avatarUrl = getUserAvatar();
  const username = getDiscordUsername();

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger className={`outline-none ${className}`}>
        <motion.div 
          className="flex items-center gap-2 px-1.5 py-1 rounded-full bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Avatar className="w-6 h-6 border border-primary/30">
            <AvatarImage src={avatarUrl || undefined} alt={username} />
            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground/90 max-w-[88px] truncate hidden lg:block">
            {username}
          </span>
          {isMember && <CheckCircle2 className="w-3 h-3 text-green-400 hidden lg:block" />}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-background/95 backdrop-blur-xl border border-border/20 shadow-2xl z-50 p-2"
      >
        {/* Profile Header */}
        <div className="px-3 py-3 mb-2 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/40 shadow-lg shadow-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={username} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {getInitials(username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{username}</p>
              {isMember && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-[10px] px-1.5 py-0">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                    Server Member
                  </Badge>
                </div>
              )}
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
          onClick={() => navigate("/application-status")}
        >
          <Shield className="w-4 h-4 text-accent" />
          <span>Application Status</span>
        </DropdownMenuItem>

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

export default UserProfileDropdown;