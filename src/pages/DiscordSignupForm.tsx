import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { UserCircle, Save, ExternalLink, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DISCORD_INVITE_LINK = "https://discord.gg/W2nU97maBh";

const DiscordSignupForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    steam_id: "",
    discord_username: "",
    in_game_name: "",
  });

  const getDiscordId = () => {
    if (!user) return null;
    return user.user_metadata?.provider_id || 
           user.user_metadata?.sub || 
           user.identities?.find(i => i.provider === 'discord')?.id;
  };

  const checkDiscordMembership = async () => {
    const discordId = getDiscordId();
    if (!discordId) {
      toast({
        title: "Error",
        description: "Could not retrieve your Discord ID. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setCheckingMembership(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-discord-membership', {
        body: { discordId }
      });

      if (error) {
        console.error('Membership check error:', error);
        toast({
          title: "Verification Error",
          description: "Could not verify Discord membership. Please try again.",
          variant: "destructive",
        });
        setIsMember(null);
      } else {
        setIsMember(data.isMember);
        setMembershipChecked(true);
        
        if (data.isMember) {
          toast({
            title: "Discord Verified!",
            description: "You are a member of the Skylife Roleplay India Discord server.",
          });
        }
      }
    } catch (err) {
      console.error('Membership check failed:', err);
      toast({
        title: "Verification Error",
        description: "Could not verify Discord membership. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingMembership(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      // Pre-fill Discord username from user metadata
      const discordUsername = session.user.user_metadata?.full_name || 
                             session.user.user_metadata?.name ||
                             session.user.user_metadata?.preferred_username || "";
      
      // Check for saved signup data from the signup form modal
      const savedSignupData = localStorage.getItem('slrp_signup_data');
      if (savedSignupData) {
        try {
          const parsedData = JSON.parse(savedSignupData);
          setFormData({
            age: parsedData.age?.toString() || "",
            steam_id: parsedData.steamId || "",
            discord_username: parsedData.discordUsername || discordUsername,
            in_game_name: parsedData.displayName || "",
          });
          // Clear the saved data after using it
          localStorage.removeItem('slrp_signup_data');
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse saved signup data:', e);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        discord_username: discordUsername,
      }));
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (existingProfile) {
        setFormData({
          age: existingProfile.age?.toString() || "",
          steam_id: existingProfile.steam_id || "",
          discord_username: existingProfile.discord_username || discordUsername,
          in_game_name: "",
        });
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Auto-check membership when user is loaded
  useEffect(() => {
    if (user && !membershipChecked) {
      checkDiscordMembership();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Must be a Discord server member
    if (!isMember) {
      toast({
        title: "Discord Membership Required",
        description: "You must join the Skylife Roleplay India Discord server before completing registration.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.age || parseInt(formData.age) < 16) {
      toast({
        title: "Invalid Age",
        description: "You must be at least 16 years old to join SLRP.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.in_game_name.trim()) {
      toast({
        title: "In-Game Name Required",
        description: "Please enter your preferred in-game character name.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        age: parseInt(formData.age),
        steam_id: formData.steam_id || null,
        discord_username: formData.discord_username,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: "Error Saving Profile",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({
      title: "Registration Complete!",
      description: "Your account has been created. Welcome to SLRP!",
    });
    
    navigate("/whitelist");
  };

  const getDiscordAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture;
  };

  const getDiscordName = () => {
    if (!user) return "User";
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.user_metadata?.preferred_username || 
           user.email?.split("@")[0] || 
           "User";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
        <div className="max-w-2xl mx-auto">
          <Card className="glass-effect border-border/20 animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24 border-4 border-primary/30">
                  <AvatarImage src={getDiscordAvatar() || undefined} alt={getDiscordName()} />
                  <AvatarFallback className="bg-primary/20 text-2xl">
                    <UserCircle className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
              <CardDescription>
                Welcome, <span className="text-primary font-semibold">{getDiscordName()}</span>! 
                Please complete the form below and join our Discord server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Discord Membership Status */}
              <div className="mb-6">
                {checkingMembership ? (
                  <Alert className="border-blue-500/20 bg-blue-500/10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Checking Discord Membership</AlertTitle>
                    <AlertDescription>
                      Verifying your membership in the Skylife Roleplay India Discord server...
                    </AlertDescription>
                  </Alert>
                ) : isMember ? (
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-600 dark:text-green-400">Discord Verified!</AlertTitle>
                    <AlertDescription className="text-green-600/80 dark:text-green-400/80">
                      You are a member of the Skylife Roleplay India Discord server. You can complete your registration.
                    </AlertDescription>
                  </Alert>
                ) : membershipChecked ? (
                  <Alert className="border-destructive/20 bg-destructive/10">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <AlertTitle className="text-destructive">Discord Membership Required</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p className="text-destructive/80">
                        You must join the Skylife Roleplay India Discord server before completing registration.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
                          onClick={() => window.open(DISCORD_INVITE_LINK, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Join Discord Server
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={checkDiscordMembership}
                          disabled={checkingMembership}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Re-check Membership
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30">
                  <p className="text-sm text-muted-foreground mb-2">Connected Discord Account:</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getDiscordAvatar() || undefined} />
                      <AvatarFallback className="bg-[#5865F2]/20">
                        {getDiscordName().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{getDiscordName()}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord_username">Discord Username *</Label>
                    <Input
                      id="discord_username"
                      type="text"
                      placeholder="YourUsername"
                      required
                      value={formData.discord_username}
                      onChange={(e) => setFormData({ ...formData, discord_username: e.target.value })}
                      className="glass-effect"
                    />
                    <p className="text-xs text-muted-foreground">
                      This should match your Discord username for verification
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="in_game_name">In-Game Character Name *</Label>
                    <Input
                      id="in_game_name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={formData.in_game_name}
                      onChange={(e) => setFormData({ ...formData, in_game_name: e.target.value })}
                      className="glass-effect"
                    />
                    <p className="text-xs text-muted-foreground">
                      The name you'll use for your character in-game
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="18"
                        min="16"
                        max="100"
                        required
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="glass-effect"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be 16+ to join
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="steam_id">Steam ID *</Label>
                      <Input
                        id="steam_id"
                        type="text"
                        placeholder="STEAM_0:1:12345678"
                        required
                        value={formData.steam_id}
                        onChange={(e) => setFormData({ ...formData, steam_id: e.target.value })}
                        className="glass-effect"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for in-game verification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={saving || !isMember}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : !isMember ? (
                      <>
                        Join Discord First
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                  {!isMember && membershipChecked && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      You must join the Discord server to complete registration
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DiscordSignupForm;
