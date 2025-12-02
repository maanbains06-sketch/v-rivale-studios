import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle, Shield, Users, Zap, CheckCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const location = window.location.pathname;
  const defaultTab = location === "/signup" ? "signup" : "login";

  useEffect(() => {
    const checkAuth = async (session: Session | null) => {
      if (session?.user) {
        // Redirect authenticated users to whitelist
        navigate("/whitelist");
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        checkAuth(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAuth(session);
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
                  <h3 className="font-semibold text-lg mb-1">Quick Access</h3>
                  <p className="text-sm text-muted-foreground">
                    One-click authentication gets you into the action immediately.
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
                  
                  <Button
                    onClick={handleDiscordSignIn}
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
                      New to SLRP? Sign up with Discord to get started
                    </p>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-sm font-medium">After signing up, you'll be able to:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Apply for server whitelist</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Access exclusive features and store</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Join our active community</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span>Track your applications and orders</span>
                      </li>
                    </ul>
                  </div>
                  
                  <Button
                    onClick={handleDiscordSignIn}
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
