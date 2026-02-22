import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { MessageCircle, Loader2, Eye, EyeOff, ExternalLink, ArrowLeft, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import AuthPanelLogo from "@/components/AuthPanelLogo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { FeatureDisabledAlert } from "@/components/FeatureDisabledAlert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSiteSettings();
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
  const [rememberMe, setRememberMe] = useState(false);
  const [verifyingDiscord, setVerifyingDiscord] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Load remembered email and password on mount
  useEffect(() => {
    try {
      const isRemembered = localStorage.getItem("slrp_remember_me") === "true";
      if (isRemembered) {
        const rememberedEmail = localStorage.getItem("slrp_remembered_email");
        const rememberedPass = localStorage.getItem("slrp_remembered_pass");
        if (rememberedEmail) setEmail(rememberedEmail);
        if (rememberedPass) {
          try { setPassword(atob(rememberedPass)); } catch { /* invalid base64 */ }
        }
        setRememberMe(true);
      }
    } catch (e) {
      // localStorage not available (private browsing)
    }
  }, []);
  
  const location = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (tabParam === "signup" || location === "/signup") {
      setIsSignup(true);
    }
  }, [tabParam, location]);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout to prevent infinite loading on slow networks or browser issues
    const safetyTimeout = setTimeout(() => {
      if (isMounted && checkingAuth) {
        console.log("Auth check timeout - forcing completion");
        setCheckingAuth(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setCheckingAuth(false);
        if (event === 'SIGNED_IN' && session?.user) {
          // Redirect to home page after login/signup
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setCheckingAuth(false);
      if (session?.user) {
        // Redirect to home page if already logged in
        navigate("/");
      }
    }).catch((error) => {
      console.error("Error getting session:", error);
      if (isMounted) {
        setCheckingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [navigate, checkingAuth]);

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

    // Handle Remember Me - save email and password to localStorage
    try {
      if (rememberMe) {
        localStorage.setItem("slrp_remembered_email", email);
        localStorage.setItem("slrp_remembered_pass", btoa(password));
        localStorage.setItem("slrp_remember_me", "true");
      } else {
        localStorage.removeItem("slrp_remembered_email");
        localStorage.removeItem("slrp_remembered_pass");
        localStorage.removeItem("slrp_remember_me");
      }
    } catch (e) {
      // localStorage not available
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });
    
    setLoading(false);
    
    // Navigate to home page after successful login
    // The onAuthStateChange should handle this, but we add a fallback
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if registration is disabled
    if (!settings.registration_enabled) {
      toast({
        title: "Registration Disabled",
        description: "New registrations are currently disabled. Please check back later.",
        variant: "destructive",
      });
      return;
    }
    
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

    // Verify Discord server membership and fetch Discord profile
    let discordUserData: { avatar?: string; banner?: string; displayName?: string } = {};
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-discord-membership', {
        body: { discordId }
      });

      if (verifyError) {
        console.error('Discord verification error:', verifyError);
        toast({
          title: "Discord Verification Failed",
          description: "Unable to verify Discord membership. Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
        setVerifyingDiscord(false);
        return;
      }

      // Check for service unavailability (bot configuration issues)
      if (verifyData?.error && verifyData?.debug) {
        console.error('Discord verification service issue:', verifyData.error, verifyData.debug);
        toast({
          title: "Verification Service Issue",
          description: verifyData.error || "Discord verification is temporarily unavailable. Please contact an administrator.",
          variant: "destructive",
        });
        setLoading(false);
        setVerifyingDiscord(false);
        return;
      }

      if (!verifyData?.isMember) {
        const reason = verifyData?.reason || "You must join our Discord server before signing up. Click the 'Join Discord Server' button above.";
        toast({
          title: "Discord Membership Required",
          description: reason,
          variant: "destructive",
        });
        setLoading(false);
        setVerifyingDiscord(false);
        return;
      }

      // Check if this Discord ID is already registered
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, discord_id')
        .eq('discord_id', discordId)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Error checking existing Discord ID:", profileCheckError);
      }

      if (existingProfile) {
        toast({
          title: "Account Already Exists",
          description: "This Discord ID is already registered with an existing account. Please login instead or use a different Discord ID.",
          variant: "destructive",
        });
        setLoading(false);
        setVerifyingDiscord(false);
        return;
      }

      // Fetch Discord user data (avatar, banner, etc.)
      const { data: userData } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId }
      });
      
      if (userData) {
        discordUserData = {
          avatar: userData.avatar,
          banner: userData.banner,
          displayName: userData.displayName || userData.globalName,
        };
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
          display_name: discordUserData.displayName || username,
          discord_id: discordId,
          avatar_url: discordUserData.avatar,
          discord_avatar: discordUserData.avatar,
          discord_banner: discordUserData.banner,
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

    // Handle Remember Me on signup
    try {
      if (rememberMe) {
        localStorage.setItem("slrp_remembered_email", email);
        localStorage.setItem("slrp_remembered_pass", btoa(password));
        localStorage.setItem("slrp_remember_me", "true");
      }
    } catch (e) { /* localStorage not available */ }

    toast({
      title: "Account Created!",
      description: "Welcome to Skylife Roleplay India! Discord verified ✓",
    });
    
    setLoading(false);
    
    // Navigate to home page after successful signup
    // The onAuthStateChange should handle this, but we add a fallback
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const handleDiscordJoin = () => {
    window.open(DISCORD_INVITE_LINK, '_blank');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = forgotPasswordSchema.safeParse({ email: forgotPasswordEmail });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setSendingResetEmail(true);
    
    try {
      // First generate a reset token via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (resetError) {
        // If it's just a user not found error, still show success (security)
        if (!resetError.message.includes("User not found")) {
          toast({
            title: "Error",
            description: resetError.message,
            variant: "destructive",
          });
          setSendingResetEmail(false);
          return;
        }
      }

      // Send custom email via our edge function for better deliverability
      const { error: emailError } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: forgotPasswordEmail,
          resetUrl: `${window.location.origin}/auth?reset=true`,
        },
      });

      if (emailError) {
        console.error("Custom email failed, but Supabase email may have been sent:", emailError);
      }

      setResetEmailSent(true);
      toast({
        title: "Reset Email Sent!",
        description: "Check your inbox (and spam folder) for the password reset link.",
      });
    } catch (err) {
      console.error("Password reset error:", err);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  const closeForgotPasswordDialog = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setResetEmailSent(false);
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
      <div className="w-full lg:w-1/2 xl:w-[55%] flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, hsl(220 20% 6% / 0.95) 0%, hsl(260 30% 12% / 0.9) 40%, hsl(330 40% 15% / 0.85) 70%, hsl(220 20% 8% / 0.95) 100%)",
        }}
      >
        {/* Ambient background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)", filter: "blur(80px)" }}
          />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, hsl(var(--neon-purple) / 0.4) 0%, transparent 70%)", filter: "blur(60px)" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, hsl(var(--neon-pink) / 0.3) 0%, transparent 60%)", filter: "blur(100px)" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isSignup ? "signup" : "login"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg relative z-10"
          >
            {/* Glass Card Container */}
            <div className="relative rounded-2xl overflow-hidden">
              {/* Neon border glow */}
              <div className="absolute -inset-[1px] rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.6) 0%, hsl(var(--neon-purple) / 0.4) 30%, hsl(var(--neon-pink) / 0.3) 60%, hsl(var(--primary) / 0.5) 100%)",
                }}
              />
              
              {/* Inner card */}
              <div className="relative rounded-2xl p-6 md:p-8"
                style={{
                  background: "linear-gradient(145deg, hsl(220 20% 8% / 0.95) 0%, hsl(220 18% 10% / 0.9) 50%, hsl(220 20% 8% / 0.95) 100%)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.h1
                    className="text-2xl md:text-3xl font-black tracking-wide uppercase mb-1"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--neon-cyan)) 50%, hsl(var(--primary)) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {isSignup ? "Create Account" : "Welcome Back"}
                  </motion.h1>
                  <motion.div
                    className="mx-auto h-[2px] w-32 mb-3"
                    initial={{ width: 0 }}
                    animate={{ width: "8rem" }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                      background: "linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--neon-purple)), hsl(var(--primary)), transparent)",
                    }}
                  />
                  <motion.p
                    className="text-muted-foreground text-sm tracking-wider uppercase"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {isSignup 
                      ? "Join Skylife Roleplay India" 
                      : "Sign in to continue"}
                  </motion.p>
                </div>

                {/* Registration Disabled Alert */}
                {isSignup && !settings.registration_enabled && !settingsLoading && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.18 }}
                    className="mb-4"
                  >
                    <FeatureDisabledAlert feature="registration" />
                  </motion.div>
                )}

                {/* Discord Button */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4"
                >
                  <Button
                    type="button"
                    onClick={handleDiscordJoin}
                    className="w-full h-11 font-bold rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider text-sm border-0"
                    style={{
                      background: "linear-gradient(135deg, #5865F2, #7B68EE)",
                      boxShadow: "0 0 20px rgba(88, 101, 242, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                    }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Join Discord Server
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground/60 mt-1.5">
                    Joining our Discord is required to access all features
                  </p>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="relative my-5"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-[1px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)" }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 text-xs text-muted-foreground/60 uppercase tracking-[0.2em]"
                      style={{ background: "hsl(220 20% 8%)" }}
                    >
                      {isSignup ? "Create account" : "Or continue with"}
                    </span>
                  </div>
                </motion.div>

                {/* Form */}
                <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
                  {/* Username - Signup only */}
                  {isSignup && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-1.5"
                    >
                      <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Provide your desired username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-11 bg-background/60 border-border/40 rounded-lg focus:border-primary/80 text-sm placeholder:text-muted-foreground/40"
                        style={{ boxShadow: "inset 0 1px 4px hsl(220 20% 4% / 0.5)" }}
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
                      className="space-y-1.5"
                    >
                      <Label htmlFor="discordId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                        Discord User ID <span className="text-muted-foreground/50 font-normal normal-case">(not username)</span>
                      </Label>
                      <Input
                        id="discordId"
                        type="text"
                        placeholder="e.g., 833680146510381097"
                        value={discordId}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setDiscordId(value);
                        }}
                        className={`h-11 bg-background/60 border-border/40 rounded-lg focus:border-primary/80 text-sm placeholder:text-muted-foreground/40 ${
                          discordId && !/^\d{17,19}$/.test(discordId) ? 'border-destructive' : ''
                        }`}
                        style={{ boxShadow: "inset 0 1px 4px hsl(220 20% 4% / 0.5)" }}
                        required
                        maxLength={19}
                      />
                      {discordId && !/^\d{17,19}$/.test(discordId) && (
                        <p className="text-xs text-destructive">
                          Discord ID must be 17-19 digits (numbers only)
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground/50 space-y-0.5">
                        <p className="font-medium text-muted-foreground/70">How to find your Discord User ID:</p>
                        <ol className="list-decimal list-inside space-y-0.5 pl-1">
                          <li>Open Discord Settings → Advanced</li>
                          <li>Enable "Developer Mode"</li>
                          <li>Right-click your profile → "Copy User ID"</li>
                        </ol>
                      </div>
                    </motion.div>
                  )}

                  {/* Email */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: isSignup ? 0.35 : 0.3 }}
                    className="space-y-1.5"
                  >
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={isSignup ? "Enter an email" : "name@example.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-background/60 border-border/40 rounded-lg focus:border-primary/80 text-sm placeholder:text-muted-foreground/40"
                      style={{ boxShadow: "inset 0 1px 4px hsl(220 20% 4% / 0.5)" }}
                      required
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: isSignup ? 0.4 : 0.35 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                        Password
                      </Label>
                      {!isSignup && (
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary/80 hover:text-primary hover:underline transition-colors"
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
                        className="h-11 bg-background/60 border-border/40 rounded-lg focus:border-primary/80 pr-12 text-sm placeholder:text-muted-foreground/40"
                        style={{ boxShadow: "inset 0 1px 4px hsl(220 20% 4% / 0.5)" }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Remember Me */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: isSignup ? 0.42 : 0.38 }}
                    className="flex items-center justify-between"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <span className="text-xs text-muted-foreground/60">Remember me</span>
                    </label>
                  </motion.div>

                  {/* Confirm Password - Signup only */}
                  {isSignup && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      className="space-y-1.5"
                    >
                      <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 bg-background/60 border-border/40 rounded-lg focus:border-primary/80 pr-12 text-sm placeholder:text-muted-foreground/40"
                          style={{ boxShadow: "inset 0 1px 4px hsl(220 20% 4% / 0.5)" }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: isSignup ? 0.5 : 0.4 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 font-black text-sm uppercase tracking-wider rounded-lg border-0 relative overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--neon-purple)) 50%, hsl(var(--neon-pink)) 100%)",
                        boxShadow: "0 0 25px hsl(var(--primary) / 0.3), 0 0 50px hsl(var(--neon-purple) / 0.15)",
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {verifyingDiscord ? "Verifying Discord..." : isSignup ? "Creating Account..." : "Signing in..."}
                        </>
                      ) : (
                        isSignup ? "Submit Application" : "Sign In"
                      )}
                    </Button>
                  </motion.div>

                  {/* Switch Mode */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: isSignup ? 0.55 : 0.45 }}
                    className="text-center pt-1"
                  >
                    <p className="text-xs text-muted-foreground/60">
                      {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => setIsSignup(!isSignup)}
                        className="font-bold uppercase tracking-wider hover:underline transition-colors"
                        style={{ color: "hsl(var(--primary))" }}
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
                    className="mt-4"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-muted-foreground/50">
                        By creating account, you agree to our{" "}
                        <Link to="/terms" className="text-primary/80 hover:text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-primary/80 hover:text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={closeForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              {resetEmailSent 
                ? "We've sent a password reset link to your email." 
                : "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>
          
          {resetEmailSent ? (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                <Mail className="w-12 h-12 mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Check your inbox at <strong className="text-foreground">{forgotPasswordEmail}</strong> for the reset link.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Didn't receive it? Check your spam folder or try again.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setResetEmailSent(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  className="flex-1"
                  onClick={closeForgotPasswordDialog}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="h-12"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeForgotPasswordDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendingResetEmail}
                  className="flex-1"
                >
                  {sendingResetEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
