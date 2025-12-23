import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle, Shield, Users, Zap, Loader2, ExternalLink, UserPlus, LogIn, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import SignupFormModal, { SignupFormData } from "@/components/SignupFormModal";
import LoginFormModal, { LoginFormData } from "@/components/LoginFormModal";

const DISCORD_INVITE_LINK = "https://discord.gg/W2nU97maBh";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [verifyingMembership, setVerifyingMembership] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('slrp_remember_me') === 'true';
  });
  const location = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");
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
        const urlParams = new URLSearchParams(window.location.search);
        const isSignup = urlParams.get("signup") === "true";
        
        if (isSignup) {
          navigate("/discord-signup");
        } else {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();
          
          if (error || !profile) {
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

          setVerifyingMembership(true);
          const isMember = await verifyDiscordMembership(session.user);
          setVerifyingMembership(false);

          if (!isMember) {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            toast({
              title: "Discord Membership Required",
              description: "You must be a member of the Skylife Roleplay India Discord server to access your account.",
              variant: "destructive",
            });
            return;
          }
          
          navigate("/discord-profile");
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          checkAuth(session, event);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleOpenLoginModal = () => {
    setShowLoginModal(true);
  };

  const handleLoginFormSubmit = async (data: LoginFormData) => {
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
      setShowLoginModal(false);
    }
  };

  const handleOpenSignupModal = () => {
    setShowSignupModal(true);
  };

  const handleSignupFormSubmit = async (data: SignupFormData) => {
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
      setShowSignupModal(false);
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
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Welcome to SLRP
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your gateway to immersive roleplay experiences. Login or create an account to get started.
          </p>
        </div>

        {/* Main Auth Cards */}
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md mx-auto h-14">
              <TabsTrigger value="login" className="text-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LogIn className="w-5 h-5" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserPlus className="w-5 h-5" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="animate-fade-in">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Login Form Card */}
                <Card className="glass-effect border-border/30 shadow-xl">
                  <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                      <LogIn className="w-8 h-8 text-[#5865F2]" />
                    </div>
                    <CardTitle className="text-2xl">Login to Your Account</CardTitle>
                    <CardDescription className="text-base">
                      Already have an account? Sign in with Discord to continue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <Alert className="border-amber-500/30 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertTitle className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                        Existing Members Only
                      </AlertTitle>
                      <AlertDescription className="text-amber-600/80 dark:text-amber-400/80 text-sm">
                        If you're new to SLRP, please use the <strong>Sign Up</strong> tab to create an account first.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <Button
                        onClick={handleOpenLoginModal}
                        disabled={loading || !!user}
                        size="lg"
                        className="w-full h-14 text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50 shadow-lg"
                      >
                        <MessageCircle className="w-6 h-6 mr-3" />
                        {user ? "✓ Connected - Redirecting..." : loading ? "Connecting to Discord..." : "Login with Discord"}
                      </Button>
                    </div>

                    {user && (
                      <Alert className="border-green-500/30 bg-green-500/10">
                        <AlertDescription className="text-green-600 dark:text-green-400 text-center">
                          ✓ Successfully authenticated! Redirecting to your profile...
                        </AlertDescription>
                      </Alert>
                    )}

                    <Separator />

                    <div className="text-center text-sm text-muted-foreground">
                      <p>Don't have an account?</p>
                      <Button 
                        variant="link" 
                        className="text-primary p-0 h-auto"
                        onClick={() => {
                          const tabsList = document.querySelector('[data-state="inactive"][value="signup"]') as HTMLElement;
                          tabsList?.click();
                        }}
                      >
                        Create one now →
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Login Requirements */}
                <div className="space-y-6">
                  <Card className="glass-effect border-border/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Login Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Registered Account</p>
                          <p className="text-sm text-muted-foreground">You must have signed up previously</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Discord Server Member</p>
                          <p className="text-sm text-muted-foreground">Must be in the Skylife Roleplay India Discord server</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Discord Authorization</p>
                          <p className="text-sm text-muted-foreground">Allow SLRP to verify your identity</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    variant="outline"
                    className="w-full border-[#5865F2]/50 text-[#5865F2] hover:bg-[#5865F2]/10"
                    onClick={() => window.open(DISCORD_INVITE_LINK, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Not in Discord? Join Server
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* SIGNUP TAB */}
            <TabsContent value="signup" className="animate-fade-in">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Signup Form Card */}
                <Card className="glass-effect border-border/30 shadow-xl">
                  <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <UserPlus className="w-8 h-8 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Create Your Account</CardTitle>
                    <CardDescription className="text-base">
                      New to SLRP? Start your journey by creating an account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-4">
                    <Alert className="border-blue-500/30 bg-blue-500/10">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <AlertTitle className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        Discord Required
                      </AlertTitle>
                      <AlertDescription className="text-blue-600/80 dark:text-blue-400/80 text-sm">
                        You'll need to join our Discord server to complete registration.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-12 border-[#5865F2]/50 text-[#5865F2] hover:bg-[#5865F2]/10"
                        onClick={() => window.open(DISCORD_INVITE_LINK, '_blank')}
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Step 1: Join Discord Server
                      </Button>

                      <Button
                        onClick={handleOpenSignupModal}
                        disabled={loading || !!user}
                        size="lg"
                        className="w-full h-14 text-lg bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-50 shadow-lg"
                      >
                        <MessageCircle className="w-6 h-6 mr-3" />
                        {user ? "✓ Account Created!" : loading ? "Creating Account..." : "Step 2: Sign Up with Discord"}
                      </Button>
                    </div>

                    {user && (
                      <Alert className="border-green-500/30 bg-green-500/10">
                        <AlertDescription className="text-green-600 dark:text-green-400 text-center">
                          ✓ Discord connected! Redirecting to complete your profile...
                        </AlertDescription>
                      </Alert>
                    )}

                    <Separator />

                    <div className="text-center text-sm text-muted-foreground">
                      <p>Already have an account?</p>
                      <Button 
                        variant="link" 
                        className="text-primary p-0 h-auto"
                        onClick={() => {
                          const tabsList = document.querySelector('[data-state="inactive"][value="login"]') as HTMLElement;
                          tabsList?.click();
                        }}
                      >
                        Login instead →
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Steps */}
                <div className="space-y-6">
                  <Card className="glass-effect border-border/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Registration Process
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#5865F2] font-bold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Join Discord Server</p>
                          <p className="text-sm text-muted-foreground">Click the button to join our community</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#5865F2] font-bold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Authorize with Discord</p>
                          <p className="text-sm text-muted-foreground">Allow SLRP to access your Discord account</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#5865F2] font-bold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Complete Your Profile</p>
                          <p className="text-sm text-muted-foreground">Enter your Steam ID and character name</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-500 font-bold text-sm">✓</span>
                        </div>
                        <div>
                          <p className="font-medium">Start Playing!</p>
                          <p className="text-sm text-muted-foreground">Apply for whitelist and join the server</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-effect border-primary/30 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-semibold">Quick Tip</p>
                          <p className="text-sm text-muted-foreground">
                            Join Discord first for a smoother signup experience!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Login Form Modal */}
      <LoginFormModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSubmit={handleLoginFormSubmit}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
        loading={loading}
        rememberMe={rememberMe}
        onRememberMeChange={handleRememberMeChange}
      />

      {/* Signup Form Modal */}
      <SignupFormModal
        open={showSignupModal}
        onOpenChange={setShowSignupModal}
        onSubmit={handleSignupFormSubmit}
        loading={loading}
      />
    </div>
  );
};

export default Auth;
