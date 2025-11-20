import { Users, Zap, Trophy, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import heroBg from "@/assets/hero-bg-enhanced.jpg";

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
    icon: Trophy,
    value: "#1",
    label: "Ranked Server",
  },
];

const Index = () => {
  const navigate = useNavigate();

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
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm text-foreground">Server Online • Players Active</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 text-gradient leading-tight">
              APEX RP
            </h1>
            
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
              Why Choose APEX RP?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              We offer an unparalleled roleplay experience with custom features, dedicated staff, and a passionate community. From realistic economy systems to unique job opportunities, every moment in APEX RP is crafted for maximum immersion.
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
      
      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gradient mb-2">APEX RP</h3>
              <p className="text-muted-foreground text-sm">
                © 2024 APEX RP. All rights reserved. Not affiliated with Rockstar Games.
              </p>
            </div>
            <div className="flex gap-8">
              <div>
                <h4 className="font-semibold text-primary mb-2">Server</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><a href="/features" className="hover:text-primary transition-colors">Features</a></li>
                  <li><a href="/rules" className="hover:text-primary transition-colors">Rules</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Staff Team</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Whitelist</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Community</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><a href="/community" className="hover:text-primary transition-colors">Discord</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Forums</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Gallery</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Events</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Support</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Support Tickets</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Ban Appeals</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
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
