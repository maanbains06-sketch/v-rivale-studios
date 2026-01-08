import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle, Shield, Users, Zap, Loader2, ExternalLink, UserPlus, LogIn, AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle2, Sparkles, ArrowRight, BadgeCheck } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { z } from "zod";

const DISCORD_INVITE_LINK = "https://discord.gg/W2nU97maBh";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  discordUsername: z.string().min(2, "Discord username is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");
  const signupParam = searchParams.get("signup");

  useEffect(() => {
    if (tabParam === "signup" || signupParam === "true") {
      setActiveTab("signup");
    }
  }, [tabParam, signupParam]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          // Redirect to profile after successful login
          setTimeout(() => {
            navigate("/discord-profile");
          }, 100);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setCheckingAuth(false);
      if (session?.user) {
        navigate("/discord-profile");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please check your credentials and try again."
          : error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Welcome Back!",
      description: "You have successfully logged in.",
    });
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse({ 
      email: signupEmail, 
      password: signupPassword, 
      confirmPassword: signupConfirmPassword,
      discordUsername 
    });
    
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          discord_username: discordUsername,
        }
      }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Account Exists",
          description: "This email is already registered. Please login instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      setLoading(false);
      return;
    }

    // Create profile entry
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          discord_username: discordUsername,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    toast({
      title: "Account Created!",
      description: "Your account has been created successfully. You can now login.",
    });
    
    // Switch to login tab
    setActiveTab("login");
    setLoginEmail(signupEmail);
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Welcome to SLRP
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your gateway to immersive roleplay experiences. Login or create an account to get started.
          </p>
        </motion.div>

        {/* Main Auth Cards */}
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="glass-effect border-border/30 shadow-xl">
                    <CardHeader className="text-center pb-2">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <LogIn className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Login to Your Account</CardTitle>
                      <CardDescription className="text-base">
                        Enter your email and password to continue
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-sm font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            Email Address
                          </Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="h-12 bg-background/80 border-border/40 rounded-xl"
                            required
                          />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-sm font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="h-12 bg-background/80 border-border/40 rounded-xl pr-12"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Logging in...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-5 h-5 mr-2" />
                              Login
                            </>
                          )}
                        </Button>
                      </form>

                      <Separator className="my-6" />

                      <div className="text-center text-sm text-muted-foreground">
                        <p>Don't have an account?</p>
                        <Button 
                          variant="link" 
                          className="text-primary p-0 h-auto font-semibold"
                          onClick={() => setActiveTab("signup")}
                        >
                          Create one now →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Login Info */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-6"
                >
                  <Card className="glass-effect border-border/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Account Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Access Dashboard</p>
                          <p className="text-sm text-muted-foreground">View your profile and application status</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Submit Applications</p>
                          <p className="text-sm text-muted-foreground">Apply for whitelist and jobs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Enter Giveaways</p>
                          <p className="text-sm text-muted-foreground">Participate in exclusive giveaways</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Live Support</p>
                          <p className="text-sm text-muted-foreground">Get help from our support team</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert className="border-[#5865F2]/30 bg-[#5865F2]/10">
                    <MessageCircle className="h-4 w-4 text-[#5865F2]" />
                    <AlertTitle className="text-[#5865F2] font-medium">
                      Join Our Discord
                    </AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Get the latest updates and connect with the community.
                    </AlertDescription>
                  </Alert>

                  <Button
                    variant="outline"
                    className="w-full border-[#5865F2]/50 text-[#5865F2] hover:bg-[#5865F2]/10"
                    onClick={() => window.open(DISCORD_INVITE_LINK, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Discord Server
                  </Button>
                </motion.div>
              </div>
            </TabsContent>

            {/* SIGNUP TAB */}
            <TabsContent value="signup" className="animate-fade-in">
              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* Signup Form Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="glass-effect border-border/30 shadow-xl">
                    <CardHeader className="text-center pb-2">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-green-500" />
                      </div>
                      <CardTitle className="text-2xl">Create Your Account</CardTitle>
                      <CardDescription className="text-base">
                        Fill in your details to get started
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <form onSubmit={handleSignup} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            Email Address
                          </Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="h-12 bg-background/80 border-border/40 rounded-xl"
                            required
                          />
                        </div>

                        {/* Discord Username Field */}
                        <div className="space-y-2">
                          <Label htmlFor="discord-username" className="text-sm font-medium flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                            Discord Username
                          </Label>
                          <Input
                            id="discord-username"
                            type="text"
                            placeholder="username"
                            value={discordUsername}
                            onChange={(e) => setDiscordUsername(e.target.value)}
                            className="h-12 bg-background/80 border-border/40 rounded-xl"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Your Discord username for verification
                          </p>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="h-12 bg-background/80 border-border/40 rounded-xl pr-12"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              className="h-12 bg-background/80 border-border/40 rounded-xl pr-12"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 rounded-xl shadow-lg"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5 mr-2" />
                              Create Account
                            </>
                          )}
                        </Button>
                      </form>

                      <Separator className="my-6" />

                      <div className="text-center text-sm text-muted-foreground">
                        <p>Already have an account?</p>
                        <Button 
                          variant="link" 
                          className="text-primary p-0 h-auto font-semibold"
                          onClick={() => setActiveTab("login")}
                        >
                          Login instead →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Signup Info */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="space-y-6"
                >
                  <Card className="glass-effect border-border/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Registration Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#5865F2] font-bold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Join Discord Server</p>
                          <p className="text-sm text-muted-foreground">Join our community first</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Create Account</p>
                          <p className="text-sm text-muted-foreground">Fill in the form with your details</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-500 font-bold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Start Playing!</p>
                          <p className="text-sm text-muted-foreground">Apply for whitelist and join the server</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-14 border-[#5865F2]/50 text-[#5865F2] hover:bg-[#5865F2]/10"
                    onClick={() => window.open(DISCORD_INVITE_LINK, '_blank')}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Step 1: Join Discord Server
                  </Button>

                  <Alert className="border-green-500/30 bg-green-500/10">
                    <BadgeCheck className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-600 dark:text-green-400 font-medium">
                      Quick & Easy
                    </AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Registration takes less than a minute. No email verification required!
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-effect border-border/30 text-center p-6">
              <Shield className="w-10 h-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Secure Platform</h3>
              <p className="text-sm text-muted-foreground">Your data is protected with industry-standard security</p>
            </Card>
            <Card className="glass-effect border-border/30 text-center p-6">
              <Users className="w-10 h-10 mx-auto mb-4 text-[#5865F2]" />
              <h3 className="font-semibold mb-2">Active Community</h3>
              <p className="text-sm text-muted-foreground">Join thousands of players in our roleplay world</p>
            </Card>
            <Card className="glass-effect border-border/30 text-center p-6">
              <Zap className="w-10 h-10 mx-auto mb-4 text-yellow-500" />
              <h3 className="font-semibold mb-2">Instant Access</h3>
              <p className="text-sm text-muted-foreground">Get started immediately after registration</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
