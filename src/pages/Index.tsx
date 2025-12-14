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

// Featured YouTubers data
const featuredYoutubers = [
  {
    id: "rakazone",
    name: "RakaZone Gaming",
    channelUrl: "https://www.youtube.com/@RakaZoneGaming",
    avatar: "https://yt3.googleusercontent.com/ytc/AIdro_nxq9pChN9pNpOyM9Ub0Y2_cZG7yJN2cNKvElQy=s176-c-k-c0x00ffffff-no-rj",
    role: "Streamer",
  },
  {
    id: "tbone",
    name: "TbOne",
    channelUrl: "https://www.youtube.com/@TbOneGaming",
    avatar: "https://yt3.googleusercontent.com/dE-h3VfrQYjQGDKqQUaR_Y8KNsaX80Wr1SgNR9EBgFxqsZhMHIb8EqQw_YmqXGkTGEwFBlrT=s176-c-k-c0x00ffffff-no-rj",
    role: "Streamer",
  },
  {
    id: "qayzer",
    name: "QAYZER GAMING",
    channelUrl: "https://www.youtube.com/@QAYZERGAMING",
    avatar: "https://yt3.googleusercontent.com/ytc/AIdro_kM3mNWDxVRyEq3OoQGN8xmHbJXyxz2NbCEDdyYUw=s176-c-k-c0x00ffffff-no-rj",
    role: "Streamer",
  },
  {
    id: "raman",
    name: "Raman Chopra",
    channelUrl: "https://www.youtube.com/@RamanChopraLive",
    avatar: "https://yt3.googleusercontent.com/ytc/AIdro_nBxP7xHzk1Fv3bUMkhk4x8WQD2_Y4wL5tZYKLr=s176-c-k-c0x00ffffff-no-rj",
    role: "Streamer",
  },
];

// Scroll animation variants
const scrollRevealVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1]
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

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

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
          setServerPlayers(data.players || 0);
          setMaxPlayers(data.maxPlayers || 64);
        }
      } catch (e) {
        console.log('Server status fetch failed');
      }
    };

    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 60000);

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
      <motion.section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden hero-section"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        
        <div className="absolute inset-0 z-[4] pointer-events-none rain-effect" />
        
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <div className="absolute top-[10%] left-[30%] w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl bg-primary/20 animate-pulse-slow" />
          <div className="absolute top-[15%] right-[20%] w-48 h-48 md:w-80 md:h-80 rounded-full blur-3xl bg-secondary/15 animate-pulse-slow animation-delay-200" />
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

            <motion.div variants={itemVariants} className="mb-8 flex justify-center">
              <AnimatedLogo size="lg" />
            </motion.div>

            <motion.h1 
              variants={itemVariants} 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gradient"
            >
              Skylife Roleplay India
            </motion.h1>

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

            {/* Live Server Status */}
            <motion.div variants={itemVariants} className="flex justify-center">
              <div className="glass-effect rounded-2xl px-6 py-4 inline-flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"></div>
                  </div>
                  <span className="text-green-400 font-semibold text-sm">LIVE</span>
                </div>
                <div className="h-6 w-px bg-border/50"></div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-bold text-lg">
                    {serverPlayers !== null ? serverPlayers : "--"}
                  </span>
                  <span className="text-muted-foreground text-sm">/ {maxPlayers} Players</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

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

      {/* Featured Streamers Section */}
      <motion.section 
        className="py-16 md:py-24 relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scrollRevealVariants}
      >
        <div className="container mx-auto px-4">
          <div className="mb-12 text-left">
            <h2 className="text-4xl md:text-6xl font-bold italic text-gradient mb-4">
              FEATURED STREAMERS
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Watch the most talented Skylife Roleplay India roleplayers showcase their skills. From thrilling heists to immersive roleplay moments, discover what makes our community exceptional.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featuredYoutubers.map((youtuber, index) => (
              <motion.div
                key={youtuber.id}
                variants={itemVariants}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-4">
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-secondary via-primary to-secondary opacity-60 blur-lg group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-secondary/50 group-hover:border-secondary transition-colors duration-300">
                    <img
                      src={youtuber.avatar}
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
                  <a href={youtuber.channelUrl} target="_blank" rel="noopener noreferrer">
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </a>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 md:py-12 relative z-10 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-bold text-gradient mb-2">SKYLIFE ROLEPLAY INDIA</h3>
            <p className="text-muted-foreground text-sm">India's Premier GTA 5 Roleplay Experience</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-primary mb-3 text-sm md:text-base">Server</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="/features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="/rules" className="hover:text-primary transition-colors">Rules</a></li>
                <li><a href="/staff" className="hover:text-primary transition-colors">Staff Team</a></li>
                <li><a href="/whitelist" className="hover:text-primary transition-colors">Whitelist</a></li>
                <li><a href="/gang-rp" className="hover:text-primary transition-colors">Gang RP</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-3 text-sm md:text-base">Community</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="/community" className="hover:text-primary transition-colors">Discord</a></li>
                <li><a href="/gallery" className="hover:text-primary transition-colors">Gallery</a></li>
                <li><a href="/guides" className="hover:text-primary transition-colors">Guides</a></li>
                <li><a href="https://skylife-roleplay-india.tebex.io" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Store</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-3 text-sm md:text-base">Support</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="/support" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="/support" className="hover:text-primary transition-colors">Support Tickets</a></li>
                <li><a href="/ban-appeal" className="hover:text-primary transition-colors">Ban Appeals</a></li>
                <li><a href="/support" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-3 text-sm md:text-base">Legal</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/20">
            <p className="text-muted-foreground text-xs md:text-sm">
              © 2025 Skylife Roleplay India. All rights reserved.
            </p>
            <div className="flex gap-3">
              {[
                { href: "https://discord.gg/skyliferp", icon: MessageCircle },
                { href: "https://www.youtube.com/@Skyliferpindia20", icon: Youtube },
                { href: "https://www.instagram.com/skyliferpindia/", icon: Instagram },
              ].map((social, i) => (
                <Button key={i} size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-primary/10" asChild>
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
