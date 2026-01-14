import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  UserCircle, 
  Mail, 
  Calendar, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Clock,
  LogOut,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  Loader2,
  RefreshCw,
  Crown,
  Skull,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useDiscordProfile } from "@/hooks/useDiscordProfile";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  age: number | null;
  steam_id: string | null;
  discord_username: string | null;
  created_at: string;
  updated_at: string;
}

const DiscordProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Get Discord ID from user metadata
  const discordId = user?.user_metadata?.discord_id;
  const { 
    username: discordUsername, 
    displayName, 
    avatar: discordAvatar,
    banner: discordBanner,
    bannerColor,
    isInServer, 
    hasWhitelistRole, 
    loading: discordLoading,
    refreshProfile 
  } = useDiscordProfile(discordId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getDiscordAvatar = () => {
    // Prefer live Discord avatar from hook
    if (discordAvatar) return discordAvatar;
    
    if (!user) return null;
    const id = user.user_metadata?.discord_id;
    if (id) {
      const avatarHash = user.user_metadata?.avatar;
      if (avatarHash) {
        return `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.png?size=256`;
      }
    }
    return user.user_metadata?.avatar_url || user.user_metadata?.picture;
  };

  const getDiscordName = () => {
    // Prefer live Discord name from hook
    if (displayName) return displayName;
    if (discordUsername) return discordUsername;
    
    if (!user) return "User";
    return user.user_metadata?.username || 
           user.user_metadata?.display_name ||
           user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.preferred_username || 
           user.email?.split("@")[0] || 
           "User";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Quick action cards data
  const quickActions = [
    {
      title: "Apply for Whitelist",
      description: "Join our exclusive RP community",
      icon: FileText,
      href: "/whitelist",
      color: "primary",
      available: true,
    },
    {
      title: "Job Applications",
      description: "Apply for in-game jobs",
      icon: Briefcase,
      href: "/jobs",
      color: "green-500",
      available: hasWhitelistRole,
    },
    {
      title: "Gang Roleplay",
      description: "Join the criminal underworld",
      icon: Skull,
      href: "/gang-rp",
      color: "red-500",
      available: hasWhitelistRole,
    },
    {
      title: "Support Chat",
      description: "Get help from our team",
      icon: MessageSquare,
      href: "/support",
      color: "blue-500",
      available: true,
    },
    {
      title: "Community",
      description: "Events and announcements",
      icon: Users,
      href: "/community",
      color: "purple-500",
      available: true,
    },
    {
      title: "View Staff",
      description: "Meet our staff team",
      icon: Crown,
      href: "/staff",
      color: "amber-500",
      available: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Hero Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect border-border/20 overflow-hidden">
              {/* Banner - Use Discord banner if available */}
              <div 
                className="h-32 md:h-40 relative"
                style={{
                  background: discordBanner 
                    ? `url(${discordBanner}) center/cover no-repeat`
                    : bannerColor 
                      ? bannerColor 
                      : 'linear-gradient(135deg, #5865F2, hsl(var(--primary)), #5865F2)'
                }}
              >
                {!discordBanner && (
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
                )}
              </div>
              
              <CardHeader className="relative pt-0 pb-4">
                {/* Avatar */}
                <div className="absolute -top-16 md:-top-20 left-6">
                  <div className="relative">
                    <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-2xl ring-4 ring-primary/20">
                      <AvatarImage src={getDiscordAvatar() || undefined} alt={getDiscordName()} />
                      <AvatarFallback className="bg-gradient-to-br from-[#5865F2] to-primary text-white text-3xl md:text-4xl font-bold">
                        {getDiscordName().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-background" />
                  </div>
                </div>
                
                {/* Header actions */}
                <div className="flex justify-end pt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshProfile()}
                    disabled={discordLoading}
                    className="glass-effect"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${discordLoading ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="glass-effect hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
                
                {/* User info */}
                <div className="pt-12 md:pt-16">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <CardTitle className="text-2xl md:text-3xl font-bold">
                      {getDiscordName()}
                    </CardTitle>
                    <Badge className="bg-[#5865F2] hover:bg-[#5865F2] text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Discord Connected
                    </Badge>
                  </div>
                  
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {isInServer ? (
                      <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        In SLRP Server
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not in Server
                      </Badge>
                    )}
                    
                    {hasWhitelistRole ? (
                      <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                        <Shield className="w-3 h-3 mr-1" />
                        Whitelisted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        Not Whitelisted
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Info Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-[#5865F2]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-[#5865F2]/20">
                        <UserCircle className="w-4 h-4 text-[#5865F2]" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Username</span>
                    </div>
                    <p className="font-semibold truncate">
                      {discordUsername || profile?.discord_username || getDiscordName()}
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Email</span>
                    </div>
                    <p className="font-semibold truncate">
                      {user?.email || "Not available"}
                    </p>
                  </motion.div>

                  {discordId && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-[#5865F2]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[#5865F2]/20">
                          <Shield className="w-4 h-4 text-[#5865F2]" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Discord ID</span>
                      </div>
                      <p className="font-mono text-sm truncate">
                        {discordId}
                      </p>
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Member Since</span>
                    </div>
                    <p className="font-semibold text-sm">
                      {user?.created_at ? formatDate(user.created_at) : "Unknown"}
                    </p>
                  </motion.div>
                </div>

                <Separator className="bg-border/30" />

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    Quick Actions
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      const isLocked = !action.available;
                      
                      return (
                        <motion.div
                          key={action.title}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          {isLocked ? (
                            <div className="p-4 rounded-xl bg-muted/20 border border-border/30 opacity-60 cursor-not-allowed">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted/50">
                                  <Icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-muted-foreground">{action.title}</p>
                                  <p className="text-xs text-muted-foreground/70">Requires whitelist role</p>
                                </div>
                                <Shield className="w-4 h-4 text-muted-foreground/50" />
                              </div>
                            </div>
                          ) : (
                            <Link to={action.href}>
                              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-${action.color}/20 group-hover:bg-${action.color}/30 transition-colors`}>
                                    <Icon className={`w-5 h-5 text-${action.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{action.title}</p>
                                    <p className="text-xs text-muted-foreground">{action.description}</p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                              </div>
                            </Link>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Whitelist CTA if not whitelisted */}
                {!hasWhitelistRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30">
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                          <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h4 className="font-bold text-lg mb-1">Get Whitelisted to Unlock All Features</h4>
                          <p className="text-sm text-muted-foreground">
                            Join our Discord server and get the whitelist role to access job applications, gang RP, and more!
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="glass-effect">
                            <a href="https://discord.gg/slrp" target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Join Discord
                            </a>
                          </Button>
                          <Button asChild>
                            <Link to="/whitelist">
                              Apply Now
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Session Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-effect border-border/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Auth Method</p>
                    <p className="font-medium">Email + Discord ID</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Sign In</p>
                    <p className="font-medium">
                      {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Unknown"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Email Status</p>
                    <p className="font-medium flex items-center gap-1">
                      {user?.email_confirmed_at ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                          Not verified
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">User ID</p>
                    <p className="font-mono text-xs truncate">{user?.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DiscordProfile;