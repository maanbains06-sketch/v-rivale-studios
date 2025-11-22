import { useEffect, useState } from "react";
import { NavLink } from "./NavLink";
import { Users, Shield, FileCheck, LogOut, Menu, UserCircle, Mail, Ban, Briefcase, Gift, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import AnimatedLogoIcon from "./AnimatedLogoIcon";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import CartDrawer from "./CartDrawer";

const Navigation = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
              to="/job-application" 
              className="text-foreground/80 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Jobs
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
            <CartDrawer />
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  className="glass-effect"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] bg-background/95 backdrop-blur-xl border-border/20">
                <SheetHeader>
                  <SheetTitle className="text-gradient">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-6">
                  {isAdmin && (
                    <Button 
                      variant="outline"
                      className="justify-start glass-effect"
                      onClick={() => {
                        navigate("/admin");
                        setIsMenuOpen(false);
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Checking
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Ban Appeals
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Job Applications
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin-staff-applications");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Staff Applications
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin-referrals");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Referral Analytics
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/admin/gallery");
                          setIsMenuOpen(false);
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Gallery Management
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline"
                    className="justify-start glass-effect"
                    onClick={() => {
                      navigate("/support");
                      setIsMenuOpen(false);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Server Owner
                  </Button>
                  {user ? (
                    <>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          navigate("/dashboard");
                          setIsMenuOpen(false);
                        }}
                      >
                        <UserCircle className="w-4 h-4 mr-2" />
                        My Dashboard
                      </Button>
                      <Button 
                        variant="outline"
                        className="justify-start glass-effect"
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => {
                        navigate("/auth");
                        setIsMenuOpen(false);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Now
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
