import {
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
  Users,
  Radio,
  ExternalLink,
  Eye,
  Heart,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navigation from "@/components/Navigation";
import AnimatedLogo from "@/components/AnimatedLogo";
import LaunchingSoonButton from "@/components/LaunchingSoonButton";
import { MessageSquarePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-home-gta-thunder.jpg";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Lazy load heavy components
const LiveFeedbackMarquee = lazy(() => import("@/components/LiveFeedbackMarquee"));

// Lightweight floating particles - minimal for performance
const FloatingParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 15 + (i * 15),
      y: 20 + (i * 12),
      size: 3 + (i % 2),
      duration: 25 + (i * 3),
      delay: i * 0.8,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[6]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full gpu-accelerated"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `hsl(var(--primary) / 0.5)`,
            boxShadow: `0 0 8px hsl(var(--primary) / 0.3)`,
            animation: `float-particle ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Static text instead of typing animation for performance
const StaticTitle = ({ text, className }: { text: string; className?: string }) => (
  <span className={className}>{text}</span>
);

interface FeaturedYoutuber {
  id: string;
  name: string;
  channel_url: string;
  avatar_url: string | null;
  role: string;
  is_live: boolean;
  live_stream_url: string | null;
}

// Scroll animation variants
const scrollRevealVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.1, 
      delayChildren: 0.1 
    },
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
  const [serverPlayers, setServerPlayers] = useState<number | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number>(64);
  const [featuredYoutubers, setFeaturedYoutubers] = useState<FeaturedYoutuber[]>([]);

  // Simplified scroll - removed heavy transforms
  const { scrollYProgress } = useScroll();

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

    // Fetch server status
    const fetchServerStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fivem-server-status');
        if (!error && data) {
          // Handle players as object {current, max} or as number
          const playerCount = typeof data.players === 'object' ? data.players.current : (data.players || 0);
          const maxCount = typeof data.players === 'object' ? data.players.max : (data.maxPlayers || 64);
          setServerPlayers(playerCount);
          setMaxPlayers(maxCount);
        }
      } catch (e) {
        console.log('Server status fetch failed');
      }
    };

    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 60000);

    // Fetch featured YouTubers
    const fetchYoutubers = async () => {
      const { data, error } = await supabase
        .from('featured_youtubers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!error && data) {
        setFeaturedYoutubers(data);
      }
    };
    fetchYoutubers();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserStatus();
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
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

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden hero-section"
      >
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        
        <div className="absolute inset-0 z-[4] pointer-events-none rain-effect" />
        
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <div className="absolute top-[10%] left-[30%] w-64 h-64 md:w-80 md:h-80 rounded-full blur-2xl bg-primary/20 gpu-accelerated" />
          <div className="absolute top-[15%] right-[20%] w-48 h-48 md:w-64 md:h-64 rounded-full blur-2xl bg-secondary/15 gpu-accelerated" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/70 z-[5]" />

        <FloatingParticles />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-6 flex justify-center">
              <LaunchingSoonButton />
            </motion.div>

            {/* Impressive Server Name - FlameCity Style */}
            <motion.div 
              variants={itemVariants} 
              className="mb-10 relative"
            >
              {/* Glow effect behind text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[300px] bg-gradient-to-r from-violet-500/40 via-purple-500/50 to-violet-500/40 blur-[120px] rounded-full gpu-accelerated"></div>
              </div>
              
              {/* Main Title */}
              <h1 className="relative flex flex-col items-center">
                {/* SKYLIFE with integrated cloud icon */}
                <span 
                  className="flex items-center text-7xl md:text-9xl lg:text-[11rem] font-black leading-none italic"
                  style={{ 
                    fontStyle: 'italic',
                    letterSpacing: '-0.02em',
                    transform: 'skewX(-8deg)',
                  }}
                >
                  <span 
                    className="bg-gradient-to-b from-violet-400 via-purple-500 to-purple-600 bg-clip-text text-transparent"
                    style={{ filter: 'drop-shadow(0 4px 30px hsl(270 70% 50% / 0.5))' }}
                  >
                    SK
                  </span>
                  {/* Cloud Icon replacing Y with floating animation */}
                  <motion.div
                    animate={{ 
                      y: [0, -8, 0],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="inline-flex"
                    style={{ transform: 'skewX(8deg)' }}
                  >
                    <Cloud 
                      className="w-16 h-16 md:w-28 md:h-28 lg:w-36 lg:h-36 -mx-1 md:-mx-2"
                      style={{ 
                        color: 'hsl(270 70% 60%)',
                        filter: 'drop-shadow(0 0 20px hsl(270 70% 50% / 0.8))'
                      }}
                      strokeWidth={2.5}
                      fill="hsl(270 60% 55%)"
                    />
                  </motion.div>
                  <span 
                    className="bg-gradient-to-b from-violet-400 via-purple-500 to-purple-600 bg-clip-text text-transparent"
                    style={{ filter: 'drop-shadow(0 4px 30px hsl(270 70% 50% / 0.5))' }}
                  >
                    LIFE
                  </span>
                </span>
                
                {/* ROLEPLAY - Wide letter spacing, italic */}
                <span 
                  className="block text-2xl md:text-4xl lg:text-5xl font-semibold tracking-[0.3em] md:tracking-[0.4em] text-foreground mt-2 italic"
                  style={{ 
                    fontStyle: 'italic',
                    letterSpacing: '0.4em',
                    transform: 'skewX(-5deg)',
                  }}
                >
                  ROLEPLAY
                </span>
                
                {/* INDIA - Small accent in purple, italic */}
                <span 
                  className="block text-sm md:text-base lg:text-lg font-semibold tracking-[0.3em] mt-3 italic"
                  style={{ 
                    fontStyle: 'italic',
                    letterSpacing: '0.3em',
                    color: 'hsl(270 70% 65%)',
                    transform: 'skewX(-5deg)',
                  }}
                >
                  INDIA
                </span>
              </h1>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 px-4">
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

            {/* Compact Live Server Status */}
            <motion.div variants={itemVariants} className="flex justify-center mt-4">
              <div 
                className="relative group cursor-pointer"
                onClick={handleJoinServer}
              >
                <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/50 bg-background/60 backdrop-blur-sm hover:border-primary/80 transition-all duration-300 hover:bg-background/80 glow-cyan">
                  {/* Live dot */}
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_hsl(185_90%_65%_/_0.8)]"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary animate-ping opacity-60"></div>
                  </div>
                  
                  {/* Player count */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-foreground">
                      {serverPlayers !== null ? serverPlayers : "0"}
                    </span>
                    <span className="text-sm text-muted-foreground/70">/</span>
                    <span className="text-sm text-muted-foreground/70">{maxPlayers}</span>
                    <span className="text-xs text-primary/90 ml-1 uppercase tracking-wide">Online</span>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-4 w-px bg-border/50"></div>
                  
                  {/* Play button */}
                  <div className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="text-sm font-semibold">Play</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Info Section */}
      <motion.section 
        className="py-12 md:py-20 relative z-[10]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scrollRevealVariants}
      >
        <div className="container mx-auto px-4">
          <div className="glass-effect rounded-2xl md:rounded-3xl p-6 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gradient">Why Choose SLRP?</h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto">
              We offer an unparalleled roleplay experience with custom features, dedicated staff, and a passionate community.
            </p>
            <motion.div 
              className="grid md:grid-cols-3 gap-4 md:gap-6 text-left"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={itemVariants} className="p-4 md:p-6 rounded-xl bg-card/50 hover:bg-card/70 transition-colors duration-300">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-primary">🎮 Professional Development</h3>
                <p className="text-sm md:text-base text-muted-foreground">Custom scripts developed by experienced programmers for optimal performance.</p>
              </motion.div>
              <motion.div variants={itemVariants} className="p-4 md:p-6 rounded-xl bg-card/50 hover:bg-card/70 transition-colors duration-300">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-secondary">🛡️ Active Staff</h3>
                <p className="text-sm md:text-base text-muted-foreground">24/7 support team ready to assist with any issues and ensure fair gameplay.</p>
              </motion.div>
              <motion.div variants={itemVariants} className="p-4 md:p-6 rounded-xl bg-card/50 hover:bg-card/70 transition-colors duration-300">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-primary">🚀 Regular Updates</h3>
                <p className="text-sm md:text-base text-muted-foreground">Constant improvements and new features based on community feedback.</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Community Section */}
      <motion.section 
        className="py-16 md:py-32 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scrollRevealVariants}
      >
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
      </motion.section>

      {/* Featured Streamers Section - Only show if there are YouTubers */}
      {featuredYoutubers.length > 0 && (
        <motion.section 
          className="py-16 md:py-24 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={scrollRevealVariants}
        >
          <div className="container mx-auto px-4">
            {/* Currently Live Section */}
            {featuredYoutubers.some(y => y.is_live) && (
              <div className="mb-16">
                <h2 className="text-4xl md:text-6xl font-bold italic text-gradient mb-8">
                  CURRENTLY LIVE
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredYoutubers.filter(y => y.is_live).map((youtuber) => (
                    <a 
                      key={youtuber.id} 
                      href={youtuber.live_stream_url || youtuber.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-2xl overflow-hidden border border-destructive/30 hover:border-destructive transition-colors"
                    >
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-destructive text-destructive-foreground font-bold">LIVE</Badge>
                      </div>
                      <div className="aspect-video bg-card">
                        <img
                          src={youtuber.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${youtuber.name}`}
                          alt={youtuber.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 bg-card/80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
                            <img
                              src={youtuber.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${youtuber.name}`}
                              alt={youtuber.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold group-hover:text-primary transition-colors">{youtuber.name}</h4>
                            <p className="text-sm text-muted-foreground">{youtuber.role}</p>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-12 text-left">
              <h2 className="text-4xl md:text-6xl font-bold italic text-gradient mb-4">
                FEATURED STREAMERS
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Watch the most talented Skylife Roleplay India roleplayers showcase their skills.
              </p>
            </div>

            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {featuredYoutubers.map((youtuber) => (
                <motion.div
                  key={youtuber.id}
                  variants={itemVariants}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-4">
                    {youtuber.is_live && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-destructive text-destructive-foreground animate-pulse">LIVE</Badge>
                      </div>
                    )}
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-secondary via-primary to-secondary opacity-60 blur-lg group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-secondary/50 group-hover:border-secondary transition-colors duration-300">
                      <img
                        src={youtuber.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${youtuber.name}`}
                        alt={youtuber.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg md:text-xl mb-1 group-hover:text-primary transition-colors duration-300">
                    {youtuber.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{youtuber.role}</p>
                  <Button
                    size="sm"
                    className="bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full px-6"
                    asChild
                  >
                    <a href={youtuber.is_live && youtuber.live_stream_url ? youtuber.live_stream_url : youtuber.channel_url} target="_blank" rel="noopener noreferrer">
                      <Youtube className="w-4 h-4 mr-2" />
                      {youtuber.is_live ? "Watch Live" : "YouTube"}
                    </a>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/20 py-12 md:py-16 relative z-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <h3 className="text-2xl md:text-3xl font-bold italic tracking-wide mb-6">
              <span className="text-primary">SKYLIFE</span>
              <span className="text-white ml-2">ROLEPLAY</span>
              <span className="block text-xs md:text-sm font-normal tracking-[0.3em] text-muted-foreground mt-1">INDIA</span>
            </h3>
            
            {/* Copyright */}
            <p className="text-muted-foreground text-sm mb-2">
              © 2026 Skylife Roleplay India. All rights reserved.
            </p>
            
            {/* Developer Credit */}
            <p className="text-muted-foreground text-sm">
              Developed By{" "}
              <a 
                href="https://discord.gg/skyliferp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                SLRP Development Team
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
