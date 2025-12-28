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
import { 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  Shield,
  ChevronDown
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
    const avatarId = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    return avatarId || null;
  };

  const getDiscordUsername = () => {
    if (!user) return "User";
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.user_name ||
           user.user_metadata?.preferred_username ||
           "User";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Don't show if not logged in
  if (loading || !user) {
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
          <Avatar className="w-7 h-7 border-2 border-primary/30">
            <AvatarImage src={avatarUrl || undefined} alt={username} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground/90 max-w-[100px] truncate hidden lg:block">
            {username}
          </span>
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