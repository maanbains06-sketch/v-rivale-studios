import { MessageCircle, Users, Image, Calendar, HelpCircle, FileText, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

const communityLinks = [
  {
    title: "Discord",
    description: "Join our active community with 10,000+ members",
    icon: MessageCircle,
    color: "from-neon-cyan to-neon-purple",
    action: "Join Discord",
  },
  {
    title: "Forums",
    description: "Participate in discussions and share your stories",
    icon: Users,
    color: "from-neon-purple to-neon-pink",
    action: "Visit Forums",
  },
  {
    title: "Gallery",
    description: "View amazing screenshots from our community",
    icon: Image,
    color: "from-neon-pink to-secondary",
    action: "View Gallery",
  },
  {
    title: "Events",
    description: "Check out upcoming community events and tournaments",
    icon: Calendar,
    color: "from-secondary to-neon-cyan",
    action: "See Events",
  },
];

const supportLinks = [
  {
    title: "FAQ",
    description: "Find answers to commonly asked questions",
    icon: HelpCircle,
  },
  {
    title: "Support Tickets",
    description: "Get help from our dedicated support team",
    icon: FileText,
  },
  {
    title: "Ban Appeals",
    description: "Submit an appeal if you believe you were wrongly banned",
    icon: UserPlus,
  },
  {
    title: "Contact",
    description: "Reach out to us directly for business inquiries",
    icon: Mail,
  },
];

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
              Join Our Community
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with thousands of players and be part of something amazing
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {communityLinks.map((link, index) => (
              <div
                key={link.title}
                className="glass-effect rounded-xl p-8 hover:scale-105 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${link.color} mb-4`}>
                  <link.icon className="w-8 h-8 text-background" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-foreground">{link.title}</h2>
                <p className="text-muted-foreground mb-6">{link.description}</p>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                  {link.action}
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-gradient animate-fade-in">
              Need Support?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportLinks.map((link, index) => (
                <div
                  key={link.title}
                  className="glass-effect rounded-xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <link.icon className="w-10 h-10 text-primary mb-3" />
                  <h3 className="text-lg font-bold mb-2 text-foreground">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-8 text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-gradient">Ready to Start Your Journey?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of players in the most immersive GTA 5 roleplay experience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan">
                <MessageCircle className="w-5 h-5 mr-2" />
                Join Discord
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Connect Now
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground text-sm">
            <p>© 2024 APEX RP. All rights reserved. Not affiliated with Rockstar Games.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Community;
