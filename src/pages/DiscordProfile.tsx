import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  UserCircle, 
  Mail, 
  Calendar, 
  Shield, 
  ExternalLink, 
  ArrowRight,
  CheckCircle,
  Clock,
  LogOut
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

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
    if (!user) return null;
    // Check for avatar URL from Discord CDN using discord_id
    const discordId = user.user_metadata?.discord_id;
    if (discordId) {
      // If we have a Discord avatar hash, construct the URL
      const avatarHash = user.user_metadata?.avatar;
      if (avatarHash) {
        return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`;
      }
    }
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
    // Discord ID is stored in user metadata during signup
    return user.user_metadata?.discord_id || 
           user.user_metadata?.provider_id || 
           user.user_metadata?.sub;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Discord Account Card */}
          <Card className="glass-effect border-border/20 animate-fade-in overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#5865F2] via-[#7289DA] to-[#5865F2]" />
            <CardHeader className="relative pt-0">
              <div className="absolute -top-12 left-6">
                <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                  <AvatarImage src={getDiscordAvatar() || undefined} alt={getDiscordName()} />
                  <AvatarFallback className="bg-[#5865F2] text-white text-2xl">
                    {getDiscordName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="pt-14 flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {getDiscordName()}
                    <Badge className="bg-[#5865F2] hover:bg-[#5865F2] text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Discord Connected
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Your SLRP account is linked to Discord
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="glass-effect"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Discord Info Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-[#5865F2]/20">
                      <UserCircle className="w-4 h-4 text-[#5865F2]" />
                    </div>
                    <span className="text-sm text-muted-foreground">Discord Username</span>
                  </div>
                  <p className="font-semibold text-lg">
                    {profile?.discord_username || getDiscordName()}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
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

                {getDiscordId() && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-[#5865F2]/20">
                        <Shield className="w-4 h-4 text-[#5865F2]" />
                      </div>
                      <span className="text-sm text-muted-foreground">Discord ID</span>
                    </div>
                    <p className="font-mono text-lg">
                      {getDiscordId()}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Account Created</span>
                  </div>
                  <p className="font-semibold">
                    {user?.created_at ? formatDate(user.created_at) : "Unknown"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* SLRP Profile Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  SLRP Profile Information
                </h3>
                
                {profile ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm text-muted-foreground mb-1">Age</p>
                      <p className="font-semibold text-lg">
                        {profile.age || "Not set"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm text-muted-foreground mb-1">Steam ID</p>
                      <p className="font-mono">
                        {profile.steam_id || "Not set"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                      <p className="text-sm">
                        {profile.updated_at ? formatDate(profile.updated_at) : "Never"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                    <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                      Profile Not Complete
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete your profile to unlock all SLRP features
                    </p>
                    <Button
                      onClick={() => navigate("/discord-signup")}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      Complete Profile
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 min-w-[150px]"
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate("/whitelist")}
                  variant="outline"
                  className="flex-1 min-w-[150px] glass-effect"
                >
                  Apply for Whitelist
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate("/discord-signup")}
                  variant="outline"
                  className="flex-1 min-w-[150px] glass-effect"
                >
                  Edit Profile
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Auth Method</p>
                  <p className="font-medium">Email + Discord ID Verification</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sign In</p>
                  <p className="font-medium">
                    {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email Verified</p>
                  <p className="font-medium flex items-center gap-1">
                    {user?.email_confirmed_at ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Verified
                      </>
                    ) : (
                      "Not verified"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs truncate">{user?.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DiscordProfile;
