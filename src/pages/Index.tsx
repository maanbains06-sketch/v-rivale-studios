import { Users, Zap, CheckCircle, Play, Instagram, Facebook, Twitter, Youtube, MessageCircle, Image, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import AnimatedLogo from "@/components/AnimatedLogo";
import heroBg from "@/assets/hero-home-gta-thunder.jpg";

const stats = [
  {
    icon: Users,
    value: "750+",
    label: "Active Players",
  },
  {
    icon: Zap,
    value: "99.9%",
    label: "Uptime",
  },
  {
    icon: CheckCircle,
    value: "Online",
    label: "Server Status",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const rainContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Thunder sound effect
  const playThunderSound = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Create thunder rumble using multiple oscillators
    const now = audioContext.currentTime;
    
    // Low rumble
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(50, now);
    oscillator1.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    gainNode1.gain.setValueAtTime(0.3, now);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    oscillator1.start(now);
    oscillator1.stop(now + 1.5);

    // Mid rumble
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(100, now);
    oscillator2.frequency.exponentialRampToValueAtTime(60, now + 0.8);
    gainNode2.gain.setValueAtTime(0.2, now);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    oscillator2.start(now);
    oscillator2.stop(now + 1.2);

    // Sharp crack
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioContext.createBufferSource();
    const noiseGain = audioContext.createGain();
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseSource.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    noiseSource.start(now);
  };

  // Thunder timing synchronized with lightning
  useEffect(() => {
    // Lightning bolt 1: 4s cycle, strikes at 10% (0.4s)
    const thunder1 = setInterval(() => {
      setTimeout(() => playThunderSound(), 400);
    }, 4000);

    // Lightning bolt 2: 5s cycle, delay 1.5s, strikes at 10% (0.5s)
    const thunder2 = setInterval(() => {
      setTimeout(() => playThunderSound(), 500);
    }, 5000);
    setTimeout(() => {
      setTimeout(() => playThunderSound(), 500);
    }, 1500);

    // Lightning bolt 3: 6s cycle, delay 3s, strikes at 10% (0.6s)
    const thunder3 = setInterval(() => {
      setTimeout(() => playThunderSound(), 600);
    }, 6000);
    setTimeout(() => {
      setTimeout(() => playThunderSound(), 600);
    }, 3000);

    return () => {
      clearInterval(thunder1);
      clearInterval(thunder2);
      clearInterval(thunder3);
    };
  }, []);

  useEffect(() => {
    const container = rainContainerRef.current;
    if (!container) return;

    // Create rain splash effect
    const createSplash = (left: string) => {
      const splash = document.createElement('div');
      splash.className = 'rain-splash';
      splash.style.left = left;
      splash.style.bottom = '0';
      
      container.appendChild(splash);

      // Remove splash after animation
      setTimeout(() => {
        splash.remove();
      }, 300);
    };

    // Create rain drops
    const createRainDrop = () => {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
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
      }, (duration * 1000));

      // Remove drop after animation
      setTimeout(() => {
        drop.remove();
      }, (duration * 1000) + 100);
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
      
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Rain Animation Layer */}
        <div 
          ref={rainContainerRef}
          className="absolute inset-0 z-[4] pointer-events-none overflow-hidden"
        />
        {/* Animated Cloud Layers */}
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          <div className="clouds-animation absolute w-[200%] h-full opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 25%, transparent 50%, rgba(59, 130, 246, 0.3) 75%, transparent 100%)',
            }}
          />
        </div>

        {/* Animated Lightning Bolts */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <svg className="lightning-bolt-1 absolute top-0 left-[20%] w-2 h-full opacity-0" viewBox="0 0 10 100" preserveAspectRatio="none">
            <path d="M 5 0 L 3 40 L 7 40 L 4 100" fill="none" stroke="rgba(139, 92, 246, 0.9)" strokeWidth="2" filter="url(#glow)" />
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
          
          <svg className="lightning-bolt-2 absolute top-0 left-[50%] w-2 h-full opacity-0" viewBox="0 0 10 100" preserveAspectRatio="none">
            <path d="M 5 0 L 4 35 L 6 35 L 3 100" fill="none" stroke="rgba(59, 130, 246, 0.9)" strokeWidth="2" filter="url(#glow2)" />
            <defs>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>

          <svg className="lightning-bolt-3 absolute top-0 left-[75%] w-2 h-full opacity-0" viewBox="0 0 10 100" preserveAspectRatio="none">
            <path d="M 5 0 L 6 45 L 4 45 L 7 100" fill="none" stroke="rgba(139, 92, 246, 0.9)" strokeWidth="2" filter="url(#glow3)" />
            <defs>
              <filter id="glow3">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Atmospheric Glow Effects */}
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <div className="atmospheric-glow absolute top-[10%] left-[30%] w-96 h-96 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)'
            }}
          />
          <div className="atmospheric-glow absolute top-[15%] right-[20%] w-80 h-80 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
              animationDelay: '2s'
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/60 z-[5]"></div>
        
        <div className="container mx-auto px-4 relative z-10"
          style={{ zIndex: 30 }}
        >
          <div className="text-center animate-fade-in">
            <div className="mb-8 flex justify-center">
              <AnimatedLogo size="lg" />
            </div>
            
            <p className="text-xl md:text-2xl text-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience the most immersive GTA 5 roleplay server. Join thousands of players in a living, breathing city with advanced economy, custom scripts, and a thriving community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 glow-cyan animate-glow"
                onClick={() => navigate("/auth")}
              >
                <Play className="w-5 h-5 mr-2" />
                Join Server
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 text-lg px-8">
                <Play className="w-5 h-5 mr-2" />
                Watch Trailer
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <stat.icon className="w-10 h-10 text-primary mx-auto mb-3" />
                  <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Quick Info Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="glass-effect rounded-3xl p-8 md:p-12 text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
              Why Choose SLRP?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              We offer an unparalleled roleplay experience with custom features, dedicated staff, and a passionate community. From realistic economy systems to unique job opportunities, every moment in SLRP is crafted for maximum immersion.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-xl bg-card/50">
                <h3 className="text-xl font-bold mb-2 text-primary">Professional Development</h3>
                <p className="text-muted-foreground">Custom scripts developed by experienced programmers for optimal performance and unique features.</p>
              </div>
              <div className="p-6 rounded-xl bg-card/50">
                <h3 className="text-xl font-bold mb-2 text-secondary">Active Staff</h3>
                <p className="text-muted-foreground">24/7 support team ready to assist with any issues and ensure fair gameplay for all players.</p>
              </div>
              <div className="p-6 rounded-xl bg-card/50">
                <h3 className="text-xl font-bold mb-2 text-primary">Regular Updates</h3>
                <p className="text-muted-foreground">Constant improvements and new features based on community feedback and suggestions.</p>
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
                
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
                  Join Our Thriving Community
                </h2>
                
                <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  Connect with thousands of players, share your experiences, and be part of something special. Follow us on social media for the latest updates, community highlights, event announcements, and exclusive content.
                </p>
                
                <TooltipProvider>
                  <div className="flex justify-center gap-6 flex-wrap mb-8">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="lg" 
                          className="h-20 w-20 p-0 rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-110 glow-cyan shadow-lg"
                          asChild
                        >
                          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                            <Youtube className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" strokeWidth={2} />
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
                          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" strokeWidth={2} />
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
                          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" strokeWidth={2} />
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
                          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" strokeWidth={2} />
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
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <h4 className="font-semibold text-primary mb-2">Server</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><a href="/features" className="hover:text-primary transition-colors">Features</a></li>
                  <li><a href="/rules" className="hover:text-primary transition-colors">Rules</a></li>
                  <li><a href="/staff" className="hover:text-primary transition-colors">Staff Team</a></li>
                  <li><a href="/whitelist" className="hover:text-primary transition-colors">Whitelist</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Community</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><a href="/community" className="hover:text-primary transition-colors">Discord</a></li>
                  <li><a href="/gallery" className="hover:text-primary transition-colors">Gallery</a></li>
                  <li><a href="/guides" className="hover:text-primary transition-colors">Guides</a></li>
                  <li><a href="/store" className="hover:text-primary transition-colors">Store</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Support</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><a href="/support" className="hover:text-primary transition-colors">Help Center</a></li>
                  <li><a href="/support" className="hover:text-primary transition-colors">Support Tickets</a></li>
                  <li><a href="/ban-appeal" className="hover:text-primary transition-colors">Ban Appeals</a></li>
                  <li><a href="/support" className="hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Legal</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
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
