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
  Image,
  Calendar,
  Trophy,
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
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Navigation from "@/components/Navigation";
import AnimatedLogo from "@/components/AnimatedLogo";
import LaunchingSoonButton from "@/components/LaunchingSoonButton";
import LiveVisitorCounter from "@/components/LiveVisitorCounter";
import LiveFeedbackMarquee from "@/components/LiveFeedbackMarquee";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroBg from "@/assets/hero-home-gta-thunder.jpg";

// Cinematic text animation - word by word with blur
const WordReveal = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)", rotateX: 90 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.08,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// Glowing character reveal
const GlowingText = ({ children, delay = 0 }: { children: string; delay?: number }) => {
  return (
    <motion.span
      className="relative inline-block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {children.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block relative"
          initial={{ opacity: 0, y: -50, scale: 0 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: delay + i * 0.03,
            type: "spring" as const,
            stiffness: 200,
            damping: 12,
          }}
          whileHover={{
            color: "hsl(185, 90%, 65%)",
            textShadow: "0 0 20px hsl(185 90% 65% / 0.8)",
            scale: 1.2,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Epic floating particles with trails and glow
const FloatingParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 3,
      hue: 185 + Math.random() * 90,
      type: Math.random() > 0.7 ? 'orb' : 'particle',
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[6]">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.type === 'orb' ? particle.size * 2 : particle.size,
            height: particle.type === 'orb' ? particle.size * 2 : particle.size,
          }}
        >
          {/* Main particle */}
          <motion.div
            className="w-full h-full rounded-full"
            style={{
              background: particle.type === 'orb' 
                ? `radial-gradient(circle, hsl(${particle.hue} 90% 70% / 0.9), hsl(${particle.hue} 90% 50% / 0.3), transparent)`
                : `radial-gradient(circle, hsl(${particle.hue} 90% 65% / 0.8), transparent)`,
              boxShadow: particle.type === 'orb'
                ? `0 0 ${particle.size * 4}px hsl(${particle.hue} 90% 65% / 0.6), 0 0 ${particle.size * 8}px hsl(${particle.hue} 90% 65% / 0.3)`
                : `0 0 ${particle.size * 2}px hsl(${particle.hue} 90% 65% / 0.4)`,
            }}
            animate={{
              y: [-20, -150, -20],
              x: [0, Math.sin(particle.id) * 80, 0],
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Particle trail */}
          {particle.type === 'orb' && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 rounded-full"
              style={{
                background: `linear-gradient(to bottom, hsl(${particle.hue} 90% 65% / 0.6), transparent)`,
              }}
              animate={{
                height: [0, 30, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      ))}
      
      {/* Shooting stars */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-20 bg-gradient-to-b from-white via-primary/50 to-transparent rounded-full"
          style={{
            left: `${20 + i * 30}%`,
            top: '-5%',
            transform: 'rotate(45deg)',
          }}
          animate={{
            x: ['0%', '300%'],
            y: ['-100%', '300%'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 4 + 2,
            repeat: Infinity,
            repeatDelay: 8,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
};

// Magnetic button effect hook
const useMagneticEffect = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { springX, springY, handleMouseMove, handleMouseLeave };
};

// Animated counter for stats
const AnimatedCounter = ({ value, delay }: { value: string; delay: number }) => {
  const isNumber = /^\d+$/.test(value);
  
  if (!isNumber) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ delay, type: "spring" as const, stiffness: 100 }}
      >
        {value}
      </motion.span>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {value}
    </motion.span>
  );
};

const stats = [
  {
    icon: Users,
    value: "Coming soon",
    label: "Active Players",
  },
  {
    icon: Zap,
    value: "24/7",
    label: "Uptime",
  },
  {
    icon: CheckCircle,
    value: "Online",
    label: "Server Status",
  },
];

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.8, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 15,
      duration: 0.8,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.9 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
  hover: {
    scale: 1.08,
    boxShadow: "0 0 30px hsl(185 90% 65% / 0.5)",
    transition: { type: "spring" as const, stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.95 },
};

const statsVariants = {
  hidden: { opacity: 0, y: 60, rotateX: -30, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      delay: i * 0.15 + 0.8,
      type: "spring" as const,
      stiffness: 80,
      damping: 12,
    },
  }),
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const rainContainerRef = useRef<HTMLDivElement>(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [hasDiscord, setHasDiscord] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [serverConnectUrl, setServerConnectUrl] = useState("fivem://connect/cfx.re/join/abc123");

  // Check user whitelist and Discord status
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

      // Check if user has Discord connected (via profile)
      const { data: profile } = await supabase
        .from("profiles")
        .select("discord_username")
        .eq("id", user.id)
        .single();

      const discordConnected = !!(profile?.discord_username && profile.discord_username.trim() !== "");
      setHasDiscord(discordConnected);

      // Check if user has approved whitelist application
      const { data: whitelistApp } = await supabase
        .from("whitelist_applications")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();

      setIsWhitelisted(!!whitelistApp);

      // Get server connect URL from settings
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleJoinServer = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to join the server.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!hasDiscord) {
      toast({
        title: "Discord Required",
        description: "Please connect your Discord account to join the server.",
        variant: "destructive",
      });
      return;
    }

    if (!isWhitelisted) {
      toast({
        title: "Whitelist Required",
        description: "Get whitelisted first to join the server!",
        variant: "destructive",
      });
      navigate("/whitelist");
      return;
    }

    // If all checks pass, open the FiveM connect URL
    window.open(serverConnectUrl, "_blank");
  };

  // Get missing requirements for tooltip
  const getMissingRequirements = () => {
    const requirements = [
      { label: "Logged In", met: isLoggedIn, icon: LogIn },
      { label: "Discord Connected", met: hasDiscord, icon: MessageSquare },
      { label: "Whitelisted", met: isWhitelisted, icon: Shield },
    ];
    return requirements;
  };

  const allRequirementsMet = isLoggedIn && hasDiscord && isWhitelisted;

  useEffect(() => {
    const container = rainContainerRef.current;
    if (!container) return;

    // Create rain splash effect
    const createSplash = (left: string) => {
      const splash = document.createElement("div");
      splash.className = "rain-splash";
      splash.style.left = left;
      splash.style.bottom = "0";

      container.appendChild(splash);

      // Remove splash after animation
      setTimeout(() => {
        splash.remove();
      }, 300);
    };

    // Create rain drops
    const createRainDrop = () => {
      const drop = document.createElement("div");
      drop.className = "rain-drop";
      const leftPosition = `${Math.random() * 100}%`;
      drop.style.left = leftPosition;
      const duration = Math.random() * 0.5 + 0.5;
      drop.style.animationDuration = `${duration}s`;
      drop.style.animationDelay = `${Math.random() * 2}s`;
      drop.style.opacity = `${Math.random() * 0.3 + 0.3}`;

      container.appendChild(drop);

      // Create splash when drop hits ground
      setTimeout(() => {
        createSplash(leftPosition);
      }, duration * 1000);

      // Remove drop after animation
      setTimeout(
        () => {
          drop.remove();
        },
        duration * 1000 + 100,
      );
    };

    // Create multiple rain drops
    const rainInterval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        createRainDrop();
      }
    }, 100);

    return () => {
      clearInterval(rainInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <LiveVisitorCounter />

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Rain Animation Layer */}
        <div ref={rainContainerRef} className="absolute inset-0 z-[4] pointer-events-none overflow-hidden" />
        
        {/* Animated Cloud Layers */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          <div
            className="clouds-animation absolute w-[200%] h-full opacity-20"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 25%, transparent 50%, rgba(59, 130, 246, 0.3) 75%, transparent 100%)",
            }}
          />
        </div>

        {/* Animated Lightning Bolts */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <svg
            className="lightning-bolt-1 absolute top-0 left-[20%] w-2 h-full opacity-0"
            viewBox="0 0 10 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 5 0 L 3 40 L 7 40 L 4 100"
              fill="none"
              stroke="rgba(139, 92, 246, 0.9)"
              strokeWidth="2"
              filter="url(#glow)"
            />
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          <svg
            className="lightning-bolt-2 absolute top-0 left-[50%] w-2 h-full opacity-0"
            viewBox="0 0 10 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 5 0 L 4 35 L 6 35 L 3 100"
              fill="none"
              stroke="rgba(59, 130, 246, 0.9)"
              strokeWidth="2"
              filter="url(#glow2)"
            />
            <defs>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          <svg
            className="lightning-bolt-3 absolute top-0 left-[75%] w-2 h-full opacity-0"
            viewBox="0 0 10 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 5 0 L 6 45 L 4 45 L 7 100"
              fill="none"
              stroke="rgba(139, 92, 246, 0.9)"
              strokeWidth="2"
              filter="url(#glow3)"
            />
            <defs>
              <filter id="glow3">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Atmospheric Glow Effects */}
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <div
            className="atmospheric-glow absolute top-[10%] left-[30%] w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
            }}
          />
          <div
            className="atmospheric-glow absolute top-[15%] right-[20%] w-80 h-80 rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
              animationDelay: "2s",
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/60 z-[5]"></div>

        {/* Floating Particles */}
        <FloatingParticles />

        {/* Animated scan lines */}
        <div className="absolute inset-0 z-[7] pointer-events-none overflow-hidden opacity-20">
          <motion.div
            className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ y: ["-100vh", "100vh"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10" style={{ zIndex: 30 }}>
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Launching Soon Button - with dramatic entrance */}
            <motion.div 
              variants={itemVariants} 
              className="mb-6 flex justify-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              >
                <LaunchingSoonButton />
              </motion.div>
            </motion.div>

            {/* Logo with epic reveal */}
            <motion.div 
              variants={itemVariants} 
              className="mb-8 flex justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
              >
                <AnimatedLogo size="lg" />
              </motion.div>
            </motion.div>

            {/* Cinematic text reveal */}
            <motion.div
              variants={itemVariants}
              className="text-xl md:text-2xl text-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              <WordReveal 
                text="Immerse yourself in the stunning visuals and epic moments from the Skylife Roleplay India." 
                delay={0.6}
              />
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                <WordReveal 
                  text="Many players are in a living, breathing city with advanced economy, custom scripts, and a thriving community." 
                  delay={1.8}
                />
              </motion.span>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16 relative z-[60]"
            >
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="relative"
                    >
                      {/* Pulsing ring animation for locked state */}
                      {!allRequirementsMet && (
                        <motion.div
                          className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500/50 via-orange-500/50 to-red-500/50 blur-sm"
                          animate={{
                            opacity: [0.3, 0.7, 0.3],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      {/* Epic glow for unlocked state */}
                      {allRequirementsMet && (
                        <motion.div
                          className="absolute -inset-2 rounded-lg bg-gradient-to-r from-primary via-secondary to-primary blur-md"
                          animate={{
                            opacity: [0.4, 0.8, 0.4],
                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          style={{ backgroundSize: "200% 200%" }}
                        />
                      )}
                      <Button
                        size="lg"
                        className={`relative text-lg px-8 ${
                          allRequirementsMet
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan animate-glow"
                            : "bg-muted/80 hover:bg-muted text-muted-foreground border border-border/50"
                        }`}
                        onClick={handleJoinServer}
                      >
                        {allRequirementsMet ? (
                          <Play className="w-5 h-5 mr-2" />
                        ) : (
                          <Lock className="w-5 h-5 mr-2 animate-pulse" />
                        )}
                        Join Server
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    sideOffset={10}
                    className="p-4 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl max-w-xs z-[100]"
                    style={{ zIndex: 100 }}
                  >
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <motion.div
                          animate={{ rotate: allRequirementsMet ? 0 : [0, -10, 10, 0] }}
                          transition={{ duration: 0.5, repeat: allRequirementsMet ? 0 : Infinity, repeatDelay: 2 }}
                        >
                          {allRequirementsMet ? (
                            <Sparkles className="w-5 h-5 text-primary" />
                          ) : (
                            <Lock className="w-5 h-5 text-destructive" />
                          )}
                        </motion.div>
                        <p className="font-bold text-foreground">
                          {allRequirementsMet ? "Ready to Play!" : "Requirements to Join"}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        {getMissingRequirements().map((req, index) => (
                          <motion.div 
                            key={req.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center gap-3 p-2 rounded-lg ${
                              req.met 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-red-500/10 border border-red-500/30"
                            }`}
                          >
                            <motion.div
                              animate={req.met ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.3 }}
                            >
                              {req.met ? (
                                <Check className="w-5 h-5 text-green-400" />
                              ) : (
                                <X className="w-5 h-5 text-red-400" />
                              )}
                            </motion.div>
                            <req.icon className={`w-4 h-4 ${req.met ? "text-green-400" : "text-red-400"}`} />
                            <span className={`text-sm font-medium ${req.met ? "text-green-400" : "text-red-400"}`}>
                              {req.label}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                      
                      {!allRequirementsMet && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30 text-center"
                        >
                          Complete all requirements to unlock server access
                        </motion.p>
                      )}
                    </motion.div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10 text-lg px-8"
                  onClick={() => navigate("/whitelist")}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Get Whitelisted
                </Button>
              </motion.div>

              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-secondary text-secondary hover:bg-secondary/10 text-lg px-8"
                  asChild
                >
                  <a href="https://www.youtube.com/@Skyliferpindia20" target="_blank" rel="noopener noreferrer">
                    <Youtube className="w-5 h-5 mr-2" />
                    Watch Trailer
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats with epic 3D entrance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto perspective-1000">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  custom={index}
                  variants={statsVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ 
                    scale: 1.08, 
                    rotateY: 8,
                    rotateX: -5,
                    z: 50,
                    boxShadow: "0 25px 50px -15px hsl(185 90% 65% / 0.4), 0 0 30px hsl(185 90% 65% / 0.2)"
                  }}
                  className="glass-effect rounded-2xl p-6 cursor-pointer relative overflow-hidden group"
                  style={{ 
                    perspective: "1000px",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Animated border glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(90deg, hsl(185 90% 65% / 0.3), hsl(275 80% 68% / 0.3), hsl(185 90% 65% / 0.3))",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{
                      backgroundPosition: ["0% 0%", "200% 0%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  
                  {/* Shimmer effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(110deg, transparent 25%, hsl(185 90% 65% / 0.1) 50%, transparent 75%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{
                      backgroundPosition: ["-100% 0%", "200% 0%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                  />

                  <div className="relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180, y: -30 }}
                      animate={{ scale: 1, rotate: 0, y: 0 }}
                      transition={{ 
                        delay: index * 0.2 + 1.2, 
                        type: "spring", 
                        stiffness: 200,
                        damping: 12,
                      }}
                      whileHover={{ 
                        rotate: [0, -10, 10, 0],
                        transition: { duration: 0.5 }
                      }}
                    >
                      <stat.icon className="w-12 h-12 text-primary mx-auto mb-4 drop-shadow-[0_0_10px_hsl(185_90%_65%/0.5)]" />
                    </motion.div>
                    
                    <motion.div 
                      className="text-4xl font-bold text-gradient mb-2"
                      initial={{ opacity: 0, scale: 0, filter: "blur(10px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      transition={{ 
                        delay: index * 0.2 + 1.4, 
                        type: "spring",
                        stiffness: 100,
                      }}
                    >
                      <AnimatedCounter value={stat.value} delay={index * 0.2 + 1.4} />
                    </motion.div>
                    
                    <motion.div 
                      className="text-muted-foreground"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 + 1.6 }}
                    >
                      {stat.label}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Info Section */}
      <section className="py-20 relative z-[10]">
        <div className="container mx-auto px-4">
          <div className="glass-effect rounded-3xl p-8 md:p-12 text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Why Choose SLRP?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              We offer an unparalleled roleplay experience with custom features, dedicated staff, and a passionate
              community. From realistic economy systems to unique job opportunities, every moment in SLRP is crafted for
              maximum immersion.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-xl bg-card/50">
                <h3 className="text-xl font-bold mb-2 text-primary">Professional Development</h3>
                <p className="text-muted-foreground">
                  Custom scripts developed by experienced programmers for optimal performance and unique features.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/50">
                <h3 className="text-xl font-bold mb-2 text-secondary">Active Staff</h3>
                <p className="text-muted-foreground">
                  24/7 support team ready to assist with any issues and ensure fair gameplay for all players.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/50">
                <h3 className="text-xl font-bold mb-2 text-primary">Regular Updates</h3>
                <p className="text-muted-foreground">
                  Constant improvements and new features based on community feedback and suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="glass-effect rounded-3xl p-16 text-center animate-fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_50%)]"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink mb-8 animate-glow shadow-2xl">
                  <MessageCircle className="w-12 h-12 text-background" strokeWidth={2.5} />
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">Join Our Thriving Community</h2>

                <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                  Connect with thousands of players, share your experiences, and be part of something special. Follow us
                  on social media for the latest updates, community highlights, event announcements, and exclusive
                  content.
                </p>

                {/* Live Feedback Marquee */}
                <LiveFeedbackMarquee />

                <TooltipProvider>
                  <div className="flex justify-center gap-6 flex-wrap mb-8">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          className="h-20 w-20 p-0 rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-110 glow-cyan shadow-lg"
                          asChild
                        >
                          <a href="https://www.youtube.com/@Skyliferpindia20" target="_blank" rel="noopener noreferrer">
                            <Youtube
                              className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors"
                              strokeWidth={2}
                            />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-lg font-semibold">
                        <p>Subscribe on YouTube</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          className="h-20 w-20 p-0 rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-110 glow-purple shadow-lg"
                          asChild
                        >
                          <a href="https://www.instagram.com/skyliferpindia/" target="_blank" rel="noopener noreferrer">
                            <Instagram
                              className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors"
                              strokeWidth={2}
                            />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-lg font-semibold">
                        <p>Follow on Instagram</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          className="h-20 w-20 p-0 rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-110 glow-pink shadow-lg"
                          asChild
                        >
                          <a href="https://x.com/Skyliferolp1d" target="_blank" rel="noopener noreferrer">
                            <Twitter
                              className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors"
                              strokeWidth={2}
                            />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-lg font-semibold">
                        <p>Follow on Twitter</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="lg"
                          className="h-20 w-20 p-0 rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-110 glow-cyan shadow-lg"
                          asChild
                        >
                          <a
                            href="https://www.facebook.com/profile.php?id=61583338351412"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Facebook
                              className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors"
                              strokeWidth={2}
                            />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-lg font-semibold">
                        <p>Like on Facebook</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                <p className="text-sm text-muted-foreground/80 mt-6">
                  Stay updated with exclusive content, server news, and community events
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gradient mb-2">SLRP</h3>
              <p className="text-muted-foreground text-sm">
                © 2026 SLRP. All rights reserved. Not affiliated with Rockstar Games.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                  <a href="https://www.instagram.com/skyliferpindia/" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                  <a
                    href="https://www.facebook.com/profile.php?id=61583338351412"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                  <a href="https://x.com/Skyliferolp1d" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                  <a href="https://www.youtube.com/@Skyliferpindia20" target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <h4 className="font-semibold text-primary mb-2">Server</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    <a href="/features" className="hover:text-primary transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="/rules" className="hover:text-primary transition-colors">
                      Rules
                    </a>
                  </li>
                  <li>
                    <a href="/staff" className="hover:text-primary transition-colors">
                      Staff Team
                    </a>
                  </li>
                  <li>
                    <a href="/whitelist" className="hover:text-primary transition-colors">
                      Whitelist
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Community</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    <a href="/community" className="hover:text-primary transition-colors">
                      Discord
                    </a>
                  </li>
                  <li>
                    <a href="/gallery" className="hover:text-primary transition-colors">
                      Gallery
                    </a>
                  </li>
                  <li>
                    <a href="/guides" className="hover:text-primary transition-colors">
                      Guides
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://skylife-roleplay-india.tebex.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      Store
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Support</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    <a href="/support" className="hover:text-primary transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="/support" className="hover:text-primary transition-colors">
                      Support Tickets
                    </a>
                  </li>
                  <li>
                    <a href="/ban-appeal" className="hover:text-primary transition-colors">
                      Ban Appeals
                    </a>
                  </li>
                  <li>
                    <a href="/support" className="hover:text-primary transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Legal</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    <a href="/privacy-policy" className="hover:text-primary transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms-of-service" className="hover:text-primary transition-colors">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="/refund-policy" className="hover:text-primary transition-colors">
                      Refund Policy
                    </a>
                  </li>
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
