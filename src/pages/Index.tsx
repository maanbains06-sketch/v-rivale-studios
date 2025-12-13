import {
  Users,
  Zap,
  CheckCircle,
  Play,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MessageCircle,
  Lock,
  LogIn,
  MessageSquare,
  Shield,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AnimatedLogo from "@/components/AnimatedLogo";
import LaunchingSoonButton from "@/components/LaunchingSoonButton";
import { MessageSquarePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-home-gta-thunder.jpg";

// Lazy load heavy components
const LiveFeedbackMarquee = lazy(() => import("@/components/LiveFeedbackMarquee"));

// Simplified word reveal - uses CSS instead of per-word motion
const WordReveal = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {text}
    </motion.span>
  );
};

// Optimized floating particles - reduced count, using CSS transforms
const FloatingParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      hue: 185 + Math.random() * 90,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[6]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(${particle.hue} 90% 65% / 0.6), transparent)`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(${particle.hue} 90% 65% / 0.3)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

const stats = [
  { icon: Users, value: "Coming soon", label: "Active Players" },
  { icon: Zap, value: "24/7", label: "Uptime" },
  { icon: CheckCircle, value: "Online", label: "Server Status" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [hasDiscord, setHasDiscord] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [serverConnectUrl, setServerConnectUrl] = useState("fivem://connect/cfx.re/join/abc123");

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoggedIn(false);
        setIsWhitelisted(false);
        setHasDiscord(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("discord_username")
        .eq("id", user.id)
        .single();

      setHasDiscord(!!(profile?.discord_username && profile.discord_username.trim() !== ""));

      const { data: whitelistApp } = await supabase
        .from("whitelist_applications")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();

      setIsWhitelisted(!!whitelistApp);

      const { data: connectSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "fivem_server_connect")
        .single();

      if (connectSetting?.value) {
        setServerConnectUrl(connectSetting.value);
      }
    };

    checkUserStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleJoinServer = () => {
    if (!isLoggedIn) {
      toast({ title: "Login Required", description: "Please log in to join the server.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!hasDiscord) {
      toast({ title: "Discord Required", description: "Please connect your Discord account to join the server.", variant: "destructive" });
      return;
    }

    if (!isWhitelisted) {
      toast({ title: "Whitelist Required", description: "Get whitelisted first to join the server!", variant: "destructive" });
      navigate("/whitelist");
      return;
    }

    window.open(serverConnectUrl, "_blank");
  };

  const getMissingRequirements = () => [
    { label: "Logged In", met: isLoggedIn, icon: LogIn },
    { label: "Discord Connected", met: hasDiscord, icon: MessageSquare },
    { label: "Whitelisted", met: isWhitelisted, icon: Shield },
  ];

  const allRequirementsMet = isLoggedIn && hasDiscord && isWhitelisted;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section - Optimized */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-section">
        {/* Background with CSS-based parallax for mobile */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        
        {/* CSS-based rain effect (no DOM manipulation) */}
        <div className="absolute inset-0 z-[4] pointer-events-none rain-effect" />
        
        {/* Simplified atmospheric effects */}
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <div className="absolute top-[10%] left-[30%] w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl bg-primary/20 animate-pulse-slow" />
          <div className="absolute top-[15%] right-[20%] w-48 h-48 md:w-80 md:h-80 rounded-full blur-3xl bg-secondary/15 animate-pulse-slow animation-delay-200" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/70 z-[5]" />

        <FloatingParticles />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-6 flex justify-center">
              <LaunchingSoonButton />
            </motion.div>

            <motion.div variants={itemVariants} className="mb-8 flex justify-center">
              <AnimatedLogo size="lg" />
            </motion.div>

            <motion.div variants={itemVariants} className="text-lg md:text-xl lg:text-2xl text-foreground mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              <WordReveal text="Immerse yourself in the stunning visuals and epic moments from the Skylife Roleplay India." delay={0.3} />
              <br className="hidden md:block" />
              <WordReveal text="Many players are in a living, breathing city with advanced economy, custom scripts, and a thriving community." delay={0.5} />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-16 px-4">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      className={`text-base md:text-lg px-6 md:px-8 ${
                        allRequirementsMet
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan"
                          : "bg-muted/80 hover:bg-muted text-muted-foreground border border-border/50"
                      }`}
                      onClick={handleJoinServer}
                    >
                      {allRequirementsMet ? <Play className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                      Join Server
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={10} className="p-4 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl max-w-xs z-[100]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        {allRequirementsMet ? <Sparkles className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-destructive" />}
                        <p className="font-bold text-foreground">{allRequirementsMet ? "Ready to Play!" : "Requirements to Join"}</p>
                      </div>
                      <div className="space-y-2">
                        {getMissingRequirements().map((req) => (
                          <div key={req.label} className={`flex items-center gap-3 p-2 rounded-lg ${req.met ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
                            {req.met ? <Check className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5 text-red-400" />}
                            <req.icon className={`w-4 h-4 ${req.met ? "text-green-400" : "text-red-400"}`} />
                            <span className={`text-sm font-medium ${req.met ? "text-green-400" : "text-red-400"}`}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                      {!allRequirementsMet && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30 text-center">
                          Complete all requirements to unlock server access
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 text-base md:text-lg px-6 md:px-8"
                onClick={() => navigate("/whitelist")}
              >
                <Play className="w-5 h-5 mr-2" />
                Get Whitelisted
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10 text-base md:text-lg px-6 md:px-8"
                asChild
              >
                <a href="https://www.youtube.com/@Skyliferpindia20" target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-5 h-5 mr-2" />
                  Watch Trailer
                </a>
              </Button>
            </motion.div>

            {/* Stats - Simplified animations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto px-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="glass-effect rounded-2xl p-4 md:p-6 cursor-pointer gpu-accelerated"
                >
                  <stat.icon className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
                  <div className="text-2xl md:text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Info Section */}
      <section className="py-12 md:py-20 relative z-[10]">
        <div className="container mx-auto px-4">
          <div className="glass-effect rounded-2xl md:rounded-3xl p-6 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gradient">Why Choose SLRP?</h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto">
              We offer an unparalleled roleplay experience with custom features, dedicated staff, and a passionate community.
            </p>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 text-left">
              <div className="p-4 md:p-6 rounded-xl bg-card/50">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-primary">Professional Development</h3>
                <p className="text-sm md:text-base text-muted-foreground">Custom scripts developed by experienced programmers for optimal performance.</p>
              </div>
              <div className="p-4 md:p-6 rounded-xl bg-card/50">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-secondary">Active Staff</h3>
                <p className="text-sm md:text-base text-muted-foreground">24/7 support team ready to assist with any issues and ensure fair gameplay.</p>
              </div>
              <div className="p-4 md:p-6 rounded-xl bg-card/50">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-primary">Regular Updates</h3>
                <p className="text-sm md:text-base text-muted-foreground">Constant improvements and new features based on community feedback.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 md:py-32 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="glass-effect rounded-2xl md:rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary via-secondary to-primary mb-6 md:mb-8 shadow-xl">
                  <MessageCircle className="w-8 h-8 md:w-12 md:h-12 text-background" strokeWidth={2.5} />
                </div>

                <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 text-gradient">Join Our Thriving Community</h2>

                <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
                  Connect with thousands of players, share your experiences, and be part of something special.
                </p>

                <Suspense fallback={<div className="h-32" />}>
                  <LiveFeedbackMarquee />
                </Suspense>

                <div className="flex justify-center mb-8 md:mb-10">
                  <Button
                    size="lg"
                    onClick={() => navigate("/feedback")}
                    className="bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary text-primary-foreground font-bold px-6 md:px-8 py-5 md:py-6 rounded-xl md:rounded-2xl shadow-lg"
                  >
                    <MessageSquarePlus className="w-5 h-5 mr-2" />
                    Share Your Feedback
                  </Button>
                </div>

                <TooltipProvider>
                  <div className="flex justify-center gap-4 md:gap-6 flex-wrap mb-6 md:mb-8">
                    {[
                      { href: "https://www.youtube.com/@Skyliferpindia20", icon: Youtube, label: "YouTube" },
                      { href: "https://www.instagram.com/skyliferpindia/", icon: Instagram, label: "Instagram" },
                      { href: "https://x.com/Skyliferolp1d", icon: Twitter, label: "Twitter" },
                      { href: "https://www.facebook.com/profile.php?id=61583338351412", icon: Facebook, label: "Facebook" },
                    ].map((social) => (
                      <Tooltip key={social.label}>
                        <TooltipTrigger asChild>
                          <Button
                            size="lg"
                            className="h-14 w-14 md:h-20 md:w-20 p-0 rounded-xl md:rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-105"
                            asChild
                          >
                            <a href={social.href} target="_blank" rel="noopener noreferrer">
                              <social.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" strokeWidth={2} />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{social.label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>

                <p className="text-xs md:text-sm text-muted-foreground/80">
                  Stay updated with exclusive content, server news, and community events
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-6 md:py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gradient mb-2">SLRP</h3>
              <p className="text-muted-foreground text-xs md:text-sm">© 2026 SLRP. All rights reserved.</p>
              <div className="flex gap-2 mt-3">
                {[
                  { href: "https://www.instagram.com/skyliferpindia/", icon: Instagram },
                  { href: "https://www.facebook.com/profile.php?id=61583338351412", icon: Facebook },
                  { href: "https://x.com/Skyliferolp1d", icon: Twitter },
                  { href: "https://www.youtube.com/@Skyliferpindia20", icon: Youtube },
                ].map((social, i) => (
                  <Button key={i} size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                    <a href={social.href} target="_blank" rel="noopener noreferrer">
                      <social.icon className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div>
                <h4 className="font-semibold text-primary mb-2 text-sm md:text-base">Server</h4>
                <ul className="space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li><a href="/features" className="hover:text-primary transition-colors">Features</a></li>
                  <li><a href="/rules" className="hover:text-primary transition-colors">Rules</a></li>
                  <li><a href="/staff" className="hover:text-primary transition-colors">Staff Team</a></li>
                  <li><a href="/whitelist" className="hover:text-primary transition-colors">Whitelist</a></li>
                  <li><a href="/gang-rp" className="hover:text-primary transition-colors">Gang RP</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2 text-sm md:text-base">Community</h4>
                <ul className="space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li><a href="/community" className="hover:text-primary transition-colors">Discord</a></li>
                  <li><a href="/gallery" className="hover:text-primary transition-colors">Gallery</a></li>
                  <li><a href="/guides" className="hover:text-primary transition-colors">Guides</a></li>
                  <li><a href="https://skylife-roleplay-india.tebex.io" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Store</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2 text-sm md:text-base">Support</h4>
                <ul className="space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li><a href="/support" className="hover:text-primary transition-colors">Help Center</a></li>
                  <li><a href="/support" className="hover:text-primary transition-colors">Support Tickets</a></li>
                  <li><a href="/ban-appeal" className="hover:text-primary transition-colors">Ban Appeals</a></li>
                  <li><a href="/support" className="hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2 text-sm md:text-base">Legal</h4>
                <ul className="space-y-1 text-xs md:text-sm text-muted-foreground">
                  <li><a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</a></li>
                  <li><a href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
