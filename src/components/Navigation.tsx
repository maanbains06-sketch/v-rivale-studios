import { NavLink } from "./NavLink";
import { Users } from "lucide-react";
import { Button } from "./ui/button";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gradient">APEX RP</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <NavLink 
              to="/" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Home
            </NavLink>
            <NavLink 
              to="/features" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Features
            </NavLink>
            <NavLink 
              to="/rules" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Rules
            </NavLink>
            <NavLink 
              to="/community" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Community
            </NavLink>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-effect">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm text-foreground/90">Server Online</span>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Join Now
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
