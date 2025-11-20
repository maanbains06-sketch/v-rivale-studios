import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle, Gamepad2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [steamId, setSteamId] = useState("");
  const [savingSteam, setSavingSteam] = useState(false);
  const [hasSteamId, setHasSteamId] = useState(false);

  useEffect(() => {
    const checkProfile = async (session: Session | null) => {
      if (session?.user) {
        // Check if user has steam_id in profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('steam_id')
          .eq('id', session.user.id)
          .single();
        
        const steamIdExists = !!profile?.steam_id;
        setHasSteamId(steamIdExists);
        
        // Only redirect if both Discord and Steam ID are set
        if (steamIdExists) {
          navigate("/whitelist");
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        checkProfile(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkProfile(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleDiscordSignIn = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      toast({
        title: "Discord Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSaveSteamId = async () => {
    if (!user) return;
    
    // Validate Steam ID format
    const steamIdRegex = /^STEAM_[0-5]:[01]:\d+$/;
    if (!steamIdRegex.test(steamId.trim())) {
      toast({
        title: "Invalid Steam ID",
        description: "Please enter a valid Steam ID format (e.g., STEAM_0:1:12345678)",
        variant: "destructive",
      });
      return;
    }

    setSavingSteam(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ steam_id: steamId.trim() })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Failed to Save Steam ID",
        description: error.message,
        variant: "destructive",
      });
      setSavingSteam(false);
    } else {
      toast({
        title: "Steam ID Saved",
        description: "Your Steam ID has been linked successfully!",
      });
      setHasSteamId(true);
      navigate("/whitelist");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md glass-effect border-border/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-gradient mb-2">Join SLRP</CardTitle>
            <CardDescription>
              Connect Discord and link your Steam ID to start your roleplay journey
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {!user && (
              <Alert className="mb-2">
                <AlertDescription>
                  Step 1: Sign in with Discord first
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleDiscordSignIn}
              disabled={loading || !!user}
              size="lg"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {user ? "✓ Discord Connected" : loading ? "Connecting..." : "Continue with Discord"}
            </Button>

            {user && !hasSteamId && (
              <>
                <Alert className="mb-2">
                  <AlertDescription>
                    Step 2: Enter your Steam ID
                  </AlertDescription>
                </Alert>

                <div className="w-full space-y-2">
                  <Label htmlFor="steamId" className="text-sm font-medium">
                    Steam ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="steamId"
                    placeholder="STEAM_0:1:12345678"
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: STEAM_X:Y:ZZZZZZZZ (e.g., STEAM_0:1:12345678)
                  </p>
                </div>

                <Button
                  onClick={handleSaveSteamId}
                  disabled={savingSteam || !steamId.trim()}
                  size="lg"
                  className="w-full bg-[#171A21] hover:bg-[#1B2838] text-white disabled:opacity-50"
                >
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  {savingSteam ? "Saving..." : "Link Steam Account"}
                </Button>
              </>
            )}

            {user && hasSteamId && (
              <Alert className="border-green-500/20 bg-green-500/10">
                <AlertDescription className="text-green-600 dark:text-green-400">
                  ✓ Both accounts connected! Redirecting to whitelist...
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-sm text-muted-foreground text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
