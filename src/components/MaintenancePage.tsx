import { useState, useEffect, useCallback } from "react";
import { Wrench, Clock, Shield, Loader2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceCountdown } from "./MaintenanceCountdown";

interface MaintenancePageProps {
  onAccessGranted?: () => void;
}

const OWNER_DISCORD_ID = '833680146510381097';

const MaintenancePage = ({ onAccessGranted }: MaintenancePageProps) => {
  const [scheduledEnd, setScheduledEnd] = useState<string | null>(null);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const { toast } = useToast();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMaintenance = useCallback(async () => {
    try {
      // Fetch from site_settings for scheduled end time
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['maintenance_scheduled_end']);
      
      const settingsMap: Record<string, string> = {};
      (data || []).forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      setScheduledEnd(settingsMap.maintenance_scheduled_end || null);
    } catch (error) {
      console.error('Error fetching maintenance:', error);
    } finally {
      setLoadingMaintenance(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenance();
    
    // Subscribe to changes in real-time
    const channel = supabase
      .channel('maintenance_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, async (payload: any) => {
        const record = payload.new as { key?: string; value?: string } | undefined;
        
        // If maintenance_mode was turned off, reload the page
        if (record?.key === 'maintenance_mode' && record?.value === 'false') {
          window.location.reload();
        }
        
        // If scheduled_end changed, update it
        if (record?.key === 'maintenance_scheduled_end') {
          setScheduledEnd(record.value || null);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMaintenance]);

  // Auto-check if maintenance ended every 30 seconds
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle();
      
      if (data?.value === 'false') {
        window.location.reload();
      }
    };

    const interval = setInterval(checkMaintenanceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with email/password
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

      // Helper function to grant access immediately
      const grantAccess = (name: string, isOwner: boolean = false) => {
        // Store access in localStorage IMMEDIATELY
        localStorage.setItem('slrp_maintenance_access', JSON.stringify({ 
          hasAccess: true, 
          userId: user.id, 
          timestamp: Date.now() 
        }));
        
        toast({
          title: isOwner ? "Welcome, Owner!" : `Welcome, ${name}!`,
          description: isOwner ? "Access granted during maintenance." : "Staff access granted during maintenance.",
        });
        
        // Call onAccessGranted IMMEDIATELY - no delay
        setLoading(false);
        onAccessGranted?.();
      };

      // Check owner by Discord ID - FASTEST PATH
      if (discordId === OWNER_DISCORD_ID) {
        grantAccess("Owner", true);
        return;
      }

      // Parallel check all staff access methods for speed
      const [roleResult, staffByDiscordResult, staffByUserResult] = await Promise.all([
        // Check user_roles for admin/moderator
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'moderator'])
          .maybeSingle(),
        // Check staff_members by Discord ID
        discordId && /^\d{17,19}$/.test(discordId)
          ? supabase
              .from('staff_members')
              .select('id, name, is_active')
              .eq('discord_id', discordId)
              .eq('is_active', true)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        // Check staff_members by user_id (fallback)
        supabase
          .from('staff_members')
          .select('id, name, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()
      ]);

      // Check results in priority order
      if (!roleResult.error && roleResult.data) {
        grantAccess("Staff");
        return;
      }

      if (!staffByDiscordResult.error && staffByDiscordResult.data) {
        grantAccess(staffByDiscordResult.data.name || "Staff");
        return;
      }

      if (!staffByUserResult.error && staffByUserResult.data) {
        grantAccess(staffByUserResult.data.name || "Staff");
        return;
      }

      // No access - sign out
      await supabase.auth.signOut();
      toast({
        title: "Access Denied",
        description: "Only staff members can access the site during maintenance.",
        variant: "destructive",
      });
      setLoading(false);
    } catch (err) {
      console.error("Staff login error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const getDurationText = () => {
    if (!scheduledEnd) return 'Brief Downtime';
    const end = new Date(scheduledEnd);
    const now = new Date();
    const hoursRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hoursRemaining <= 0) return 'Almost done';
    if (hoursRemaining < 1) return '< 1h';
    return `~${hoursRemaining}h`;
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full text-center px-2"
      >
        <div className="glass-effect rounded-2xl p-6 md:p-12 border-border/20 space-y-4 md:space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-orange-500/20 border border-orange-500/30 mb-2 md:mb-4"
          >
            <Wrench className="w-8 h-8 md:w-12 md:h-12 text-orange-400 animate-bounce" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-4xl font-bold text-gradient"
          >
            Under Maintenance
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-sm md:text-lg px-2"
          >
            We're performing scheduled maintenance to improve your experience. The site will be back online shortly.
          </motion.p>

          {/* Countdown Display */}
          {loadingMaintenance ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-4"
            >
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </motion.div>
          ) : scheduledEnd ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mb-4"
            >
              <MaintenanceCountdown 
                scheduledEnd={scheduledEnd}
                title="Site Maintenance"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-lg bg-muted/30 border border-border/20"
            >
              <p className="text-sm text-muted-foreground">Maintenance in progress. Please check back soon.</p>
            </motion.div>
          )}

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-2 md:gap-4 mt-4 md:mt-8"
          >
            <div className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/20 text-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1 md:mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">Expected Duration</p>
              <p className="font-semibold text-foreground text-sm md:text-base">{getDurationText()}</p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-muted/30 border border-border/20 text-center">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-green-400 mx-auto mb-1 md:mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">Data Status</p>
              <p className="font-semibold text-foreground text-sm md:text-base">Safe & Secure</p>
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