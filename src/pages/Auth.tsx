import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle, Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import AuthPanelLogo from "@/components/AuthPanelLogo";

const DISCORD_INVITE_LINK = "https://discord.gg/W2nU97maBh";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(32, "Username must be less than 32 characters"),
  discordId: z.string().regex(/^\d{17,19}$/, "Please enter a valid Discord ID (17-19 digits)"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
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
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [verifyingDiscord, setVerifyingDiscord] = useState(false);
  
  const location = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam === "signup" || location === "/signup") {
      setIsSignup(true);
    }
  }, [tabParam, location]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          navigate("/discord-profile");
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
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse({ username, discordId, email, password, confirmPassword });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setVerifyingDiscord(true);

    // Verify Discord server membership
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-discord-membership', {
        body: { discordId }
      });

      if (verifyError) {
        toast({
          title: "Discord Verification Failed",
          description: "Unable to verify Discord membership. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        setVerifyingDiscord(false);
        return;
      }

      if (!verifyData?.isMember) {
        toast({
          title: "Discord Membership Required",
          description: "You must join our Discord server before signing up. Click the 'Join Discord Server' button above.",
          variant: "destructive",
        });
        setLoading(false);
        setVerifyingDiscord(false);
        return;
      }

      setVerifyingDiscord(false);
    } catch (err) {
      toast({
        title: "Verification Error",
        description: "Unable to verify Discord membership. Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
      setVerifyingDiscord(false);
      return;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          username,
          display_name: username,
          discord_id: discordId,
        },
      },
    });

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Account Created!",
      description: "Welcome to Skylife Roleplay India! Discord verified ✓",
    });
  };

  const handleDiscordJoin = () => {
    window.open(DISCORD_INVITE_LINK, '_blank');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Animated Logo */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%]">
        <AuthPanelLogo />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 xl:w-[55%] flex items-center justify-center p-6 md:p-12 bg-card/50 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignup ? "signup" : "login"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h1
                className="text-3xl md:text-4xl font-bold mb-2"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {isSignup ? "Welcome to Skylife" : "Welcome back"}
              </motion.h1>
              <motion.p
                className="text-muted-foreground"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {isSignup 
                  ? "We're excited to have you! Let's create your account." 
                  : "Sign in to Skylife Roleplay India"}
              </motion.p>
            </div>

            {/* Discord Button - Mandatory */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Button
                type="button"
                onClick={handleDiscordJoin}
                className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Join Discord Server
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Joining our Discord is required to access all features
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="relative my-6"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card/50 backdrop-blur-sm px-4 text-xs text-muted-foreground uppercase tracking-wider">
                  {isSignup ? "Create account with" : "Or continue with"}
                </span>
              </div>
            </motion.div>

            {/* Form */}
            <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-5">
              {/* Username - Signup only */}
              {isSignup && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Provide your desired username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 bg-background/80 border-border/50 rounded-lg focus:border-primary"
                    required
                  />
                </motion.div>
              )}

              {/* Discord ID - Signup only */}
              {isSignup && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.32 }}
                  className="space-y-2"
                >
                  <Label htmlFor="discordId" className="text-sm font-medium">
                    Discord ID
                  </Label>
                  <Input
                    id="discordId"
                    type="text"
                    placeholder="Your Discord User ID (e.g., 123456789012345678)"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    className="h-12 bg-background/80 border-border/50 rounded-lg focus:border-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enable Developer Mode in Discord Settings → Copy your ID by right-clicking your profile
                  </p>
                </motion.div>
              )}

              {/* Email */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: isSignup ? 0.35 : 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isSignup ? "Enter an email" : "name@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-background/80 border-border/50 rounded-lg focus:border-primary"
                  required
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: isSignup ? 0.4 : 0.35 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  {!isSignup && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignup ? "Enter a good password" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-background/80 border-border/50 rounded-lg focus:border-primary pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password - Signup only */}
              {isSignup && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-background/80 border-border/50 rounded-lg focus:border-primary pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: isSignup ? 0.5 : 0.4 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {verifyingDiscord ? "Verifying Discord..." : isSignup ? "Creating Account..." : "Signing in..."}
                    </>
                  ) : (
                    isSignup ? "Create Account" : "Sign in with Email"
                  )}
                </Button>
              </motion.div>

              {/* Switch Mode */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: isSignup ? 0.55 : 0.45 }}
                className="text-center pt-2"
              >
                <p className="text-sm text-muted-foreground">
                  {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignup(!isSignup)}
                    className="text-primary font-semibold hover:underline"
                  >
                    {isSignup ? "Sign In" : "Sign up"}
                  </button>
                </p>
              </motion.div>
            </form>

            {/* Terms - Signup only */}
            {isSignup && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-muted-foreground">
                    By creating account, you agree to our{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
