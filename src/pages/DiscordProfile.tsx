import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { 
  UserCircle, 
  Mail, 
  Calendar, 
  Shield, 
  ExternalLink, 
  ArrowRight,
  CheckCircle,
  Clock,
  LogOut,
  XCircle,
  RefreshCw,
  Loader2,
  Crown,
  FileText,
  LayoutDashboard,
  MessageCircle
} from "lucide-react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import headerCommunity from "@/assets/header-community.jpg";

interface Profile {
  id: string;
  age: number | null;
  steam_id: string | null;
  discord_username: string | null;
  created_at: string;
  updated_at: string;
}

interface DiscordVerification {
  isInServer: boolean;
  hasWhitelistRole: boolean;
  loading: boolean;
  error: string | null;
}

interface WhitelistApp {
  id: string;
  status: string;
  created_at: string;
}

const DiscordProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [discordVerification, setDiscordVerification] = useState<DiscordVerification>({
    isInServer: false,
    hasWhitelistRole: false,
    loading: true,
    error: null
  });
  const [whitelistApp, setWhitelistApp] = useState<WhitelistApp | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);

      // Fetch whitelist application
      const { data: whitelistData } = await supabase
        .from("whitelist_applications")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setWhitelistApp(whitelistData);

      // Check admin/owner roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const hasAdminRole = userRoles?.some(r => r.role === 'admin' || r.role === 'moderator') || false;
      setIsAdmin(hasAdminRole);

      // Check owner via RPC
      const { data: ownerResult } = await supabase.rpc('is_owner', { _user_id: user.id });
      setIsOwner(ownerResult || false);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const verifyDiscord = useCallback(async () => {
    if (!user) return;

    const discordId = user.user_metadata?.discord_id || 
                      user.user_metadata?.provider_id || 
                      user.user_metadata?.sub;
    
    if (!discordId) {
      setDiscordVerification({
        isInServer: false,
        hasWhitelistRole: false,
        loading: false,
        error: "No Discord ID found in your account"
      });
      return;
    }

    setDiscordVerification(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId }
      });

      if (error) throw error;

      setDiscordVerification({
        isInServer: data?.isInServer || false,
        hasWhitelistRole: data?.hasWhitelistRole || false,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Discord verification error:', err);
      // Fallback to membership check
      try {
        const { data: memberData } = await supabase.functions.invoke('verify-discord-membership', {
          body: { discordId }
        });
        
        setDiscordVerification({
          isInServer: memberData?.isMember || false,
          hasWhitelistRole: false,
          loading: false,
          error: null
        });
      } catch (fallbackErr) {
        setDiscordVerification({
          isInServer: false,
          hasWhitelistRole: false,
          loading: false,
          error: "Could not verify Discord status"
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
      verifyDiscord();
    }
  }, [user, loadData, verifyDiscord]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await verifyDiscord();
    setRefreshing(false);
    toast({
      title: "Profile Refreshed",
      description: "Your profile data has been updated.",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const getDiscordAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture;
  };

  const getDiscordName = () => {
    if (!user) return "User";
    return user.user_metadata?.username ||
           user.user_metadata?.display_name ||
           user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.preferred_username || 
           user.email?.split("@")[0] || 
           "User";
  };

  const getDiscordId = () => {
    if (!user) return null;
    return user.user_metadata?.discord_id || 
           user.user_metadata?.provider_id || 
           user.user_metadata?.sub;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const whitelistStatus = whitelistApp?.status || 'not_applied';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="My Profile"
        description="View and manage your SLRP account"
        backgroundImage={headerCommunity}
      />
      
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect border-border/20 overflow-hidden">
              {/* Profile Banner */}
              <div className="h-32 bg-gradient-to-r from-[#5865F2] via-[#7289DA] to-primary relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />
              </div>
              
              <CardHeader className="relative pt-0">
                <div className="absolute -top-16 left-6">
                  <div className="relative">
                    <Avatar className="w-28 h-28 border-4 border-background shadow-2xl">
                      <AvatarImage src={getDiscordAvatar() || undefined} alt={getDiscordName()} />
                      <AvatarFallback className="bg-[#5865F2] text-white text-3xl font-bold">
                        {getDiscordName().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online Status Indicator */}
                    {!discordVerification.loading && (
                      <div 
                        className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-background ${
                          discordVerification.isInServer ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    )}
                  </div>
                </div>
                
                <div className="pt-16 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl flex items-center gap-3 flex-wrap">
                      {getDiscordName()}
                      <div className="flex flex-wrap gap-2">
                        {discordVerification.loading ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Verifying
                          </Badge>
                        ) : discordVerification.isInServer ? (
                          <Badge className="bg-green-500/15 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Server Member
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not in Server
                          </Badge>
                        )}
                        {discordVerification.hasWhitelistRole && (
                          <Badge className="bg-primary/15 text-primary border-primary/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Whitelisted
                          </Badge>
                        )}
                        {isAdmin && (
                          <Badge className="bg-[#5865F2]/15 text-[#5865F2] border-[#5865F2]/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {isOwner && (
                          <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Welcome to SLRP! Your account is linked to Discord.
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="glass-effect"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="glass-effect text-destructive hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Account Info Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#5865F2]/10 to-transparent border border-[#5865F2]/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-[#5865F2]/20">
                        <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                      </div>
                      <span className="text-sm text-muted-foreground">Discord Username</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {profile?.discord_username || getDiscordName()}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-primary/20">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">Email Address</span>
                    </div>
                    <p className="font-semibold text-lg truncate">
                      {user?.email || "Not available"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-secondary/20">
                        <Shield className="w-4 h-4 text-secondary" />
                      </div>
                      <span className="text-sm text-muted-foreground">Discord ID</span>
                    </div>
                    <p className="font-mono text-sm">
                      {getDiscordId() || "Not available"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-accent/20">
                        <Calendar className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm text-muted-foreground">Account Created</span>
                    </div>
                    <p className="font-semibold">
                      {user?.created_at ? formatDate(user.created_at) : "Unknown"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Email Verified</span>
                    </div>
                    <p className="font-semibold flex items-center gap-2">
                      {user?.email_confirmed_at ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          Not verified
                        </>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-purple-500/20">
                        <FileText className="w-4 h-4 text-purple-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Whitelist Status</span>
                    </div>
                    <p className="font-semibold flex items-center gap-2">
                      {whitelistStatus === 'approved' ? (
                        <Badge className="bg-green-500/15 text-green-400">Approved</Badge>
                      ) : whitelistStatus === 'pending' ? (
                        <Badge className="bg-yellow-500/15 text-yellow-400">Pending</Badge>
                      ) : whitelistStatus === 'rejected' ? (
                        <Badge className="bg-red-500/15 text-red-400">Rejected</Badge>
                      ) : (
                        <Badge variant="outline">Not Applied</Badge>
                      )}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    Quick Actions
                  </h3>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      onClick={() => navigate("/dashboard")}
                      className="h-auto py-4 flex flex-col items-center gap-2"
                    >
                      <LayoutDashboard className="w-6 h-6" />
                      <span>Dashboard</span>
                    </Button>

                    <Button
                      onClick={() => navigate("/whitelist")}
                      variant={whitelistStatus === 'approved' ? "secondary" : "default"}
                      className="h-auto py-4 flex flex-col items-center gap-2"
                    >
                      <FileText className="w-6 h-6" />
                      <span>{whitelistStatus === 'approved' ? 'View Whitelist' : 'Apply for Whitelist'}</span>
                    </Button>

                    {isAdmin && (
                      <Button
                        onClick={() => navigate("/admin")}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 glass-effect"
                      >
                        <Shield className="w-6 h-6 text-[#5865F2]" />
                        <span>Admin Panel</span>
                      </Button>
                    )}

                    {isOwner && (
                      <Button
                        onClick={() => navigate("/owner-panel")}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 glass-effect"
                      >
                        <Crown className="w-6 h-6 text-yellow-500" />
                        <span>Owner Panel</span>
                      </Button>
                    )}

                    <Button
                      onClick={() => window.open("https://discord.gg/W2nU97maBh", "_blank")}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 glass-effect bg-[#5865F2]/10 border-[#5865F2]/30 hover:bg-[#5865F2]/20"
                    >
                      <MessageCircle className="w-6 h-6 text-[#5865F2]" />
                      <span className="flex items-center gap-1">
                        Discord <ExternalLink className="w-3 h-3" />
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Discord Status Warning */}
                {!discordVerification.loading && !discordVerification.isInServer && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-400 mb-1">Discord Server Required</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          You need to join our Discord server to access all SLRP features and apply for whitelist.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => window.open("https://discord.gg/W2nU97maBh", "_blank")}
                          className="bg-[#5865F2] hover:bg-[#4752C4]"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Join Discord Server
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Session Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">Provider</p>
                    <p className="font-medium">Email + Discord</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">Last Sign In</p>
                    <p className="font-medium">
                      {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Unknown"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">Role</p>
                    <p className="font-medium">
                      {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground mb-1">User ID</p>
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
