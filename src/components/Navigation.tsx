import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { Users, Shield, Activity, FileCheck, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import AnimatedLogoIcon from "./AnimatedLogoIcon";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/use-toast";

const Navigation = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roleData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    navigate("/");
    toast({
      title: "Logged out successfully",
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Logo Icon */}
            <AnimatedLogoIcon className="w-10 h-10" />
            
            {/* Logo Text */}
            <h1 className="text-2xl font-bold relative z-10">
              <span className="inline-block text-gradient bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent animate-gradient-shift">
                SLRP
              </span>
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              About
            </NavLink>
            <NavLink 
              to="/features" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Features
            </NavLink>
            <NavLink 
              to="/guides" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Guides
            </NavLink>
            <NavLink 
              to="/gallery" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Gallery
            </NavLink>
            <NavLink 
              to="/staff" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Staff
            </NavLink>
            <NavLink 
              to="/status" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Status
            </NavLink>
            <NavLink 
              to="/support" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Support
            </NavLink>
            <NavLink 
              to="/store" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Store
            </NavLink>
            {isAdmin && (
              <NavLink 
                to="/admin" 
                className="text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
                activeClassName="text-primary"
              >
                <Shield className="w-4 h-4" />
                Admin
              </NavLink>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate("/status")}
            >
              <Activity className="w-4 h-4 mr-2" />
              Server Stats
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate("/whitelist")}
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Apply Whitelist
            </Button>
            {user ? (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                <Users className="w-4 h-4 mr-2" />
                Join Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
