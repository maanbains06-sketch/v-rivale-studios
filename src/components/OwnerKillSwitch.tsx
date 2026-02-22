import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOwnerAuditLog } from "@/hooks/useOwnerAuditLog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Shield, ShieldAlert, ShieldOff, Power, Lock, Unlock, AlertTriangle, Zap } from "lucide-react";

const OwnerKillSwitch = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [lockdownActive, setLockdownActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadLockdownStatus();
    // Listen for realtime changes
    const channel = supabase
      .channel("lockdown-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: "key=eq.lockdown_mode" }, () => loadLockdownStatus())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadLockdownStatus = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "lockdown_mode").maybeSingle();
    setLockdownActive(data?.value === "true");
    setLoading(false);
  };

  const activateLockdown = async () => {
    setToggling(true);
    // Upsert lockdown mode
    const { error } = await supabase.from("site_settings").upsert({ key: "lockdown_mode", value: "true", description: "Emergency lockdown mode - only owner can access" }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error activating lockdown", description: error.message, variant: "destructive" });
    } else {
      setLockdownActive(true);
      toast({ title: "🔒 LOCKDOWN ACTIVATED", description: "Website is now in lockdown mode. Only the owner can access." });
      logAction({ actionType: "lockdown_activated", actionDescription: "Emergency Kill Switch activated - website in lockdown mode" });
      // Log security event
      await supabase.from("security_events").insert({ event_type: "lockdown_activated", severity: "critical", details: { activated_by: "owner" } });
      // Notify Discord
      try {
        await supabase.functions.invoke("send-discord-notification", {
          body: { type: "lockdown_activated", message: "🔒 **EMERGENCY LOCKDOWN ACTIVATED** - Website is now in lockdown mode. Only the owner can access the site." }
        });
      } catch (e) { console.error("Discord notification failed:", e); }
      // Update Discord status message to offline (lockdown)
      try {
        const { data: msgIdData } = await supabase.from("site_settings").select("value").eq("key", "discord_status_message_id").maybeSingle();
        await supabase.functions.invoke("send-server-status-discord", {
          body: {
            status: "offline",
            usersActive: 0,
            uptime: "N/A",
            customMessage: "🔒 EMERGENCY LOCKDOWN — Website access restricted to owner only.",
            websiteUrl: "https://skyliferoleplay.com",
            discordUrl: "https://discord.gg/skyliferp",
            maintenanceCountdown: null,
            scheduledEndAt: null,
            messageId: msgIdData?.value || null,
          }
        });
      } catch (e) { console.error("Discord status update failed:", e); }
    }
    setToggling(false);
    setConfirmActivate(false);
  };

  const deactivateLockdown = async () => {
    setToggling(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "lockdown_mode", value: "false", description: "Emergency lockdown mode - only owner can access" }, { onConflict: "key" });
    if (error) {
      toast({ title: "Error deactivating lockdown", description: error.message, variant: "destructive" });
    } else {
      setLockdownActive(false);
      toast({ title: "🔓 LOCKDOWN DEACTIVATED", description: "Website is back online for all users." });
      logAction({ actionType: "lockdown_deactivated", actionDescription: "Emergency Kill Switch deactivated - website back online" });
      await supabase.from("security_events").insert({ event_type: "lockdown_deactivated", severity: "critical", details: { deactivated_by: "owner" } });
      try {
        await supabase.functions.invoke("send-discord-notification", {
          body: { type: "lockdown_deactivated", message: "🔓 **LOCKDOWN DEACTIVATED** - Website is back online and accessible to all users." }
        });
      } catch (e) { console.error("Discord notification failed:", e); }
      // Update Discord status message back to online
      try {
        const { data: msgIdData } = await supabase.from("site_settings").select("value").eq("key", "discord_status_message_id").maybeSingle();
        await supabase.functions.invoke("send-server-status-discord", {
          body: {
            status: "online",
            usersActive: 1,
            uptime: "0m",
            customMessage: "🔓 Lockdown lifted — Website is back online!",
            websiteUrl: "https://skyliferoleplay.com",
            discordUrl: "https://discord.gg/skyliferp",
            maintenanceCountdown: null,
            scheduledEndAt: null,
            messageId: msgIdData?.value || null,
          }
        });
      } catch (e) { console.error("Discord status update failed:", e); }
    }
    setToggling(false);
    setConfirmDeactivate(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Kill Switch Card */}
      <Card className={`border-2 transition-all duration-500 ${lockdownActive ? "border-red-500/50 bg-red-950/10 shadow-lg shadow-red-500/10" : "border-green-500/20"}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lockdownActive ? <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" /> : <Shield className="w-6 h-6 text-green-400" />}
              <div>
                <CardTitle className="text-xl">Emergency Kill Switch</CardTitle>
                <CardDescription>Instantly lock down the entire website</CardDescription>
              </div>
            </div>
            <Badge variant={lockdownActive ? "destructive" : "outline"} className={`text-sm px-3 py-1 ${lockdownActive ? "animate-pulse" : ""}`}>
              {lockdownActive ? (
                <><Lock className="w-3 h-3 mr-1" /> LOCKDOWN ACTIVE</>
              ) : (
                <><Unlock className="w-3 h-3 mr-1" /> NORMAL MODE</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className={`p-6 rounded-xl border-2 text-center ${lockdownActive ? "border-red-500/30 bg-red-950/20" : "border-green-500/20 bg-green-950/10"}`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${lockdownActive ? "bg-red-500/20 ring-4 ring-red-500/30 animate-pulse" : "bg-green-500/10 ring-4 ring-green-500/20"}`}>
              <Power className={`w-10 h-10 ${lockdownActive ? "text-red-400" : "text-green-400"}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${lockdownActive ? "text-red-400" : "text-green-400"}`}>
              {lockdownActive ? "WEBSITE LOCKED DOWN" : "Website Online"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {lockdownActive
                ? "All users are blocked from accessing the website. Only you (the owner) can log in and manage the site."
                : "Website is operating normally. All authenticated users can access their permitted areas."
              }
            </p>
          </div>

          {/* What Lockdown Does */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <Lock className="w-4 h-4" />, label: "Disable all user logins", active: lockdownActive },
              { icon: <ShieldOff className="w-4 h-4" />, label: "Lock admin/staff panels", active: lockdownActive },
              { icon: <Zap className="w-4 h-4" />, label: "Block all API access", active: lockdownActive },
              { icon: <AlertTriangle className="w-4 h-4" />, label: "Discord lockdown alert", active: lockdownActive },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${item.active ? "border-red-500/20 bg-red-950/10" : "border-border/50 bg-card/30"}`}>
                <div className={`${item.active ? "text-red-400" : "text-muted-foreground"}`}>{item.icon}</div>
                <span className={`text-sm ${item.active ? "text-red-300" : "text-muted-foreground"}`}>{item.label}</span>
                {item.active && <Badge variant="destructive" className="ml-auto text-[10px] px-1.5">ACTIVE</Badge>}
              </div>
            ))}
          </div>

          {/* Toggle Button */}
          <Button
            variant={lockdownActive ? "outline" : "destructive"}
            size="lg"
            className={`w-full gap-3 text-lg py-6 ${lockdownActive ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "bg-red-600 hover:bg-red-700"}`}
            onClick={() => lockdownActive ? setConfirmDeactivate(true) : setConfirmActivate(true)}
            disabled={toggling}
          >
            {toggling ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : lockdownActive ? (
              <><Unlock className="w-5 h-5" /> Deactivate Lockdown</>
            ) : (
              <><Lock className="w-5 h-5" /> Activate Kill Switch</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Confirm Activate */}
      <AlertDialog open={confirmActivate} onOpenChange={setConfirmActivate}>
        <AlertDialogContent className="border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" /> Activate Emergency Lockdown?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will immediately:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Block ALL users from accessing the website</li>
                <li>Disable all login functionality</li>
                <li>Lock all admin and staff panels</li>
                <li>Send a lockdown alert to Discord</li>
              </ul>
              <p className="font-medium text-foreground">Only you (the owner) will be able to log in.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={activateLockdown} className="bg-red-600 hover:bg-red-700">
              <Lock className="w-4 h-4 mr-2" /> Activate Lockdown
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Deactivate */}
      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-400">
              <Unlock className="w-5 h-5" /> Deactivate Lockdown?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will restore normal website access for all users. The Discord status will also be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deactivateLockdown} className="bg-green-600 hover:bg-green-700">
              <Unlock className="w-4 h-4 mr-2" /> Deactivate Lockdown
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerKillSwitch;
