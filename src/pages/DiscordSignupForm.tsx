import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { UserCircle, Save, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DiscordSignupForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    steam_id: "",
    discord_username: "",
  });

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
        });
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!formData.age || parseInt(formData.age) < 16) {
      toast({
        title: "Invalid Age",
        description: "You must be at least 16 years old to join SLRP.",
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
      title: "Profile Complete!",
      description: "Your information has been saved. Welcome to SLRP!",
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
          <div className="animate-pulse text-muted-foreground">Loading...</div>
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
                Please provide additional information to complete your SLRP account.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    <Label htmlFor="discord_username">Discord Username</Label>
                    <Input
                      id="discord_username"
                      type="text"
                      placeholder="YourUsername#0000"
                      value={formData.discord_username}
                      onChange={(e) => setFormData({ ...formData, discord_username: e.target.value })}
                      className="glass-effect"
                    />
                    <p className="text-xs text-muted-foreground">
                      This should match your Discord username for verification
                    </p>
                  </div>

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
                      You must be at least 16 years old to join SLRP
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="steam_id">Steam ID (Optional)</Label>
                    <Input
                      id="steam_id"
                      type="text"
                      placeholder="STEAM_0:1:12345678"
                      value={formData.steam_id}
                      onChange={(e) => setFormData({ ...formData, steam_id: e.target.value })}
                      className="glass-effect"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Steam ID helps us verify your identity in-game
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/whitelist")}
                    className="glass-effect"
                  >
                    Skip for Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
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
