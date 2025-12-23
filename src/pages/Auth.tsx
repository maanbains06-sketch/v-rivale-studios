import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle, Shield, Users, Zap, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DISCORD_INVITE_LINK = "https://discord.gg/slrp"; // Replace with your actual Discord invite link

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [verifyingMembership, setVerifyingMembership] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('slrp_remember_me') === 'true';
  });
  const location = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");
  const isSignupFlow = searchParams.get("signup") === "true" || location === "/signup" || tabParam === "signup";
  const defaultTab = tabParam === "signup" || location === "/signup" ? "signup" : "login";

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (checked) {
      localStorage.setItem('slrp_remember_me', 'true');
    } else {
      localStorage.removeItem('slrp_remember_me');
    }
  };

  const getDiscordId = (user: User) => {
    return user.user_metadata?.provider_id || 
           user.user_metadata?.sub || 
           user.identities?.find(i => i.provider === 'discord')?.id;
  };

  const verifyDiscordMembership = async (user: User): Promise<boolean> => {
    const discordId = getDiscordId(user);
    if (!discordId) return false;

    try {
      const { data, error } = await supabase.functions.invoke('verify-discord-membership', {
        body: { discordId }
      });

      if (error) {
        console.error('Membership verification error:', error);
        return false;
      }

      return data.isMember === true;
    } catch (err) {
      console.error('Membership check failed:', err);
      return false;
    }
  };

  useEffect(() => {
    const checkAuth = async (session: Session | null, event?: string) => {
      if (session?.user) {
        // Check URL params to determine if this is signup or login flow
        const urlParams = new URLSearchParams(window.location.search);
        const isSignup = urlParams.get("signup") === "true";
        
        if (isSignup) {
          navigate("/discord-signup");
        } else {
          // For login flow, check if user exists in profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();
          
          if (error || !profile) {
            // User is not registered, sign them out and show error
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            toast({
              title: "Account Not Found",
              description: "You are not registered. Please sign up first to create an account.",
              variant: "destructive",
            });
            return;
          }

          // Verify Discord membership on login
          setVerifyingMembership(true);
          const isMember = await verifyDiscordMembership(session.user);
          setVerifyingMembership(false);

          if (!isMember) {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            toast({
              title: "Discord Membership Required",
              description: "You must be a member of the SLRP Discord server to access your account.",
              variant: "destructive",
            });
            return;
          }
          
          navigate("/discord-profile");
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          checkAuth(session, event);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setCheckingAuth(false);
      // Don't auto-check on page load, only on sign-in event
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleDiscordLogin = async () => {
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

  const handleDiscordSignup = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth?signup=true`,
      },
    });

    if (error) {
      toast({
        title: "Discord Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };


  if (checkingAuth || verifyingMembership) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            {verifyingMembership ? "Verifying Discord membership..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">
          {/* Left Side - Benefits */}
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
                Welcome to SLRP
              </h1>
              <p className="text-xl text-muted-foreground">
                Your gateway to immersive roleplay experiences
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg glass-effect border border-primary/20">
                <div className="p-3 rounded-full bg-primary/20">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Secure Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign in securely with your Discord account. No passwords to remember.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg glass-effect border border-primary/20">
                <div className="p-3 rounded-full bg-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Join Our Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with thousands of roleplayers and create unforgettable stories.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg glass-effect border border-primary/20">
                <div className="p-3 rounded-full bg-primary/20">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Discord Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    We verify your Discord membership to ensure a quality community.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Card */}
          <Card className="w-full glass-effect border-border/20 animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Choose your path to join SLRP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Welcome Back!</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign in to access your account and continue your roleplay journey
                    </p>
                  </div>

                  <Alert className="border-blue-500/20 bg-blue-500/10">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-sm">
                      You must be a member of the SLRP Discord server to login.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe}
                      onCheckedChange={handleRememberMeChange}
                    />
                    <Label 
                      htmlFor="remember-me" 
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  
                  <Button
                    onClick={handleDiscordLogin}
                    disabled={loading || !!user}
                    size="lg"
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {user ? "✓ Connected - Redirecting..." : loading ? "Connecting..." : "Login with Discord"}
                  </Button>

                  {user && (
                    <Alert className="border-green-500/20 bg-green-500/10">
                      <AlertDescription className="text-green-600 dark:text-green-400">
                        ✓ Successfully authenticated! Redirecting...
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Create Your Account</h3>
                    <p className="text-sm text-muted-foreground">
                      New to SLRP? Follow these steps to get started
                    </p>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm font-medium">Registration Steps:</p>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-primary">1.</span>
                        <span>Click "Sign Up with Discord" below</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-primary">2.</span>
                        <span>Authorize SLRP to access your Discord</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-primary">3.</span>
                        <span>Fill out your gaming profile details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium text-primary">4.</span>
                        <span>Join our Discord server (required)</span>
                      </li>
                    </ol>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-[#5865F2]/50 text-[#5865F2] hover:bg-[#5865F2]/10"
                    onClick={() => window.open(DISCORD_INVITE_LINK, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Discord Server First (Recommended)
                  </Button>
                  
                  <Button
                    onClick={handleDiscordSignup}
                    disabled={loading || !!user}
                    size="lg"
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {user ? "✓ Account Created!" : loading ? "Creating Account..." : "Sign Up with Discord"}
                  </Button>

                  {user && (
                    <Alert className="border-green-500/20 bg-green-500/10">
                      <AlertDescription className="text-green-600 dark:text-green-400">
                        ✓ Account created! Welcome to SLRP!
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>

              <Separator />
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
