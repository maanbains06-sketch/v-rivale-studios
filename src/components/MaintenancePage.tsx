import { useState } from "react";
import { Wrench, Clock, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaintenancePageProps {
  onAccessGranted?: () => void;
}

const OWNER_DISCORD_ID = '833680146510381097';

const MaintenancePage = ({ onAccessGranted }: MaintenancePageProps) => {
  const { toast } = useToast();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, attempt to login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast({
          title: "Login Failed",
          description: authError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const user = authData.user;
      if (!user) {
        toast({
          title: "Login Failed",
          description: "Unable to authenticate. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get Discord ID from user metadata
      const discordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id || user.user_metadata?.sub;

      // Check if owner
      if (discordId === OWNER_DISCORD_ID) {
        toast({
          title: "Welcome, Owner!",
          description: "Access granted during maintenance.",
        });
        onAccessGranted?.();
        setLoading(false);
        return;
      }

      // Check if user has admin or moderator role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])
        .maybeSingle();

      if (roleData) {
        toast({
          title: "Welcome, Staff!",
          description: "Access granted during maintenance.",
        });
        onAccessGranted?.();
        setLoading(false);
        return;
      }

      // Check if user is a staff member via discord_id
      if (discordId) {
        const { data: staffData } = await supabase
          .from('staff_members')
          .select('id, name, is_active')
          .eq('discord_id', discordId)
          .eq('is_active', true)
          .maybeSingle();

        if (staffData) {
          toast({
            title: `Welcome, ${staffData.name}!`,
            description: "Staff access granted during maintenance.",
          });
          onAccessGranted?.();
          setLoading(false);
          return;
        }
      }

      // Not a staff member - sign them out
      await supabase.auth.signOut();
      toast({
        title: "Access Denied",
        description: "Only staff members can access the site during maintenance.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("Staff login error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        <div className="glass-effect rounded-2xl p-8 md:p-12 border-border/20 space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-500/20 border border-orange-500/30 mb-4"
          >
            <Wrench className="w-12 h-12 text-orange-400 animate-bounce" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-gradient"
          >
            Under Maintenance
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg"
          >
            We're performing scheduled maintenance to improve your experience. 
            The site will be back online shortly.
          </motion.p>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mt-8"
          >
            <div className="p-4 rounded-lg bg-muted/30 border border-border/20 text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Expected Duration</p>
              <p className="font-semibold text-foreground">Brief Downtime</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/20 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Data Status</p>
              <p className="font-semibold text-foreground">Safe & Secure</p>
            </div>
          </motion.div>

          {/* Staff Login Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            {!showLoginForm ? (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Staff members can access the site during maintenance
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLoginForm(true)} 
                  size="sm"
                >
                  Staff Login
                </Button>
              </>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleStaffLogin}
                className="space-y-4 text-left"
              >
                <div className="space-y-2">
                  <Label htmlFor="staff-email" className="text-sm">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="staff@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-background/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="staff-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-background/80 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoginForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Login as Staff"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Your Discord ID will be verified against staff records
                </p>
              </motion.form>
            )}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-muted-foreground pt-4"
          >
            Thank you for your patience. — SLRP Team
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
