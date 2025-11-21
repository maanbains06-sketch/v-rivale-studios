import { Users, Zap, CheckCircle, Play, Instagram, Facebook, Twitter, Youtube, MessageCircle, Image, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AnimatedLogo from "@/components/AnimatedLogo";
import heroBg from "@/assets/hero-home-realistic.jpg";

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
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/60"></div>
        
        <div className="container mx-auto px-4 relative z-10">
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
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
              Join Our Thriving Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with thousands of players, share your experiences, and be part of something special
            </p>
          </div>

          {/* Featured Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple mb-4">
                <Trophy className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Weekly Events</h3>
              <p className="text-muted-foreground mb-3">
                Join exciting community events, tournaments, and special activities with amazing rewards
              </p>
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/80 p-0"
                onClick={() => navigate("/community")}
              >
                View Events →
              </Button>
            </div>

            <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink mb-4">
                <Users className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">10,000+ Members</h3>
              <p className="text-muted-foreground mb-3">
                Active community with friendly players ready to welcome you and enhance your experience
              </p>
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/80 p-0"
                onClick={() => navigate("/community")}
              >
                Join Discord →
              </Button>
            </div>

            <div className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-neon-pink to-secondary mb-4">
                <Image className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Player Gallery</h3>
              <p className="text-muted-foreground mb-3">
                Share your best moments and check out incredible screenshots from our community
              </p>
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/80 p-0"
                onClick={() => navigate("/gallery")}
              >
                View Gallery →
              </Button>
            </div>

            {/* Social Media Links */}
            <div className="glass-effect rounded-2xl p-8 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
              <h3 className="text-xl font-bold mb-4 text-foreground">Follow Us</h3>
              <div className="flex justify-center gap-4">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 w-12 p-0 border-primary/50 hover:bg-primary/10 hover:border-primary"
                  asChild
                >
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-5 w-5 text-primary" />
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 w-12 p-0 border-primary/50 hover:bg-primary/10 hover:border-primary"
                  asChild
                >
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-5 w-5 text-primary" />
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 w-12 p-0 border-primary/50 hover:bg-primary/10 hover:border-primary"
                  asChild
                >
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-5 w-5 text-primary" />
                  </a>
                </Button>
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
                  <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Refund Policy</a></li>
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
