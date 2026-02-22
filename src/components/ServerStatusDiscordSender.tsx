import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  Send,
  Globe,
  Users,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Clock,
  MessageSquare,
  Zap,
  Timer,
} from "lucide-react";

type WebsiteStatusType = "online" | "maintenance" | "offline";

interface StatusConfig {
  status: WebsiteStatusType;
  usersActive: number;
  uptime: string;
  customMessage: string;
  websiteUrl: string;
  discordUrl: string;
  maintenanceCountdown: { days: number; hours: number; minutes: number; seconds: number } | null;
  scheduledEndAt: string | null;
}

type SendMode = "manual" | "background";

const ServerStatusDiscordSender = () => {
  const { toast } = useToast();
  const { settings: siteSettings } = useSiteSettings();
  const [isSending, setIsSending] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [storedMessageId, setStoredMessageId] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState(1);
  const [maintenanceStartTime, setMaintenanceStartTime] = useState<Date | null>(null);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  const [config, setConfig] = useState<StatusConfig>({
    status: "online",
    usersActive: 0,
    uptime: "0 mins",
    customMessage: "",
    websiteUrl: "https://skyliferoleplay.com",
    discordUrl: "https://discord.gg/skyliferp",
    maintenanceCountdown: null,
    scheduledEndAt: null,
  });

  // Keep latest values accessible from interval callbacks (avoid stale closures)
  const configRef = useRef(config);
  const storedMessageIdRef = useRef<string | null>(storedMessageId);
  const countdownRef = useRef(countdown);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    storedMessageIdRef.current = storedMessageId;
  }, [storedMessageId]);
  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  // Background sync guards (rate-limit + no overlapping requests)
  const inFlightRef = useRef(false);
  const lastEditAtRef = useRef(0);
  const lastSentFingerprintRef = useRef<string | null>(null);

  // Fetch stored message ID
  useEffect(() => {
    const fetchMessageId = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "discord_status_message_id")
        .maybeSingle();

      if (data?.value) {
        setStoredMessageId(data.value);
      }
    };
    fetchMessageId();
  }, []);

  // Connect to website presence (MUST use the SAME channel topic as the website counter)
  useEffect(() => {
    const sessionId = `status_sender_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const channel = supabase.channel("website_presence", {
      config: { presence: { key: sessionId } },
    });

    const updateCount = () => {
      const count = Object.keys(channel.presenceState()).length;
      setVisitorCount(count > 0 ? count : 1);
    };

    channel
      .on("presence", { event: "sync" }, updateCount)
      .on("presence", { event: "join" }, updateCount)
      .on("presence", { event: "leave" }, updateCount)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch maintenance scheduled end time
  useEffect(() => {
    const fetchMaintenanceEnd = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_scheduled_end")
        .maybeSingle();

      if (data?.value) {
        setMaintenanceEndTime(new Date(data.value));
      }
    };

    fetchMaintenanceEnd();

    // Subscribe to maintenance changes
    const channel = supabase
      .channel("maintenance_status_sender")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
          filter: "key=in.(maintenance_mode,maintenance_scheduled_end)",
        },
        () => {
          fetchMaintenanceEnd();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Listen for lockdown mode
  const [lockdownActive, setLockdownActive] = useState(false);
  useEffect(() => {
    const fetchLockdown = async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "lockdown_mode").maybeSingle();
      setLockdownActive(data?.value === "true");
    };
    fetchLockdown();
    const channel = supabase
      .channel("status-sender-lockdown")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: "key=eq.lockdown_mode" }, (payload: any) => {
        setLockdownActive(payload.new?.value === "true");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Sync with website maintenance mode AND lockdown
  useEffect(() => {
    // Lockdown takes priority → offline, no countdown
    if (lockdownActive) {
      setConfig((prev) => ({
        ...prev,
        status: "offline" as WebsiteStatusType,
        customMessage: "🔒 EMERGENCY LOCKDOWN — Website access restricted to owner only.",
        maintenanceCountdown: null,
        scheduledEndAt: null,
        uptime: "N/A",
      }));
      return;
    }

    const newStatus: WebsiteStatusType = siteSettings.maintenance_mode ? "maintenance" : "online";

    if (newStatus === "maintenance" && configRef.current.status !== "maintenance") {
      setMaintenanceStartTime(new Date());
    } else if (newStatus === "online" && configRef.current.status === "maintenance") {
      setMaintenanceStartTime(new Date());
    }

    setConfig((prev) => ({
      ...prev,
      status: newStatus,
      customMessage: prev.status === "offline" && !lockdownActive ? "" : prev.customMessage,
    }));
  }, [siteSettings.maintenance_mode, lockdownActive]);

  // Update users active count from live visitor counter
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      usersActive: visitorCount,
    }));
  }, [visitorCount]);

  // Calculate uptime
  useEffect(() => {
    if (config.status !== "online") {
      setConfig((prev) => ({ ...prev, uptime: "N/A" }));
      return;
    }

    const startTime = maintenanceStartTime || new Date();

    const updateUptime = () => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let uptimeStr = "";
      if (hours > 0) uptimeStr += `${hours}h `;
      uptimeStr += `${minutes}m`;

      setConfig((prev) => ({ ...prev, uptime: uptimeStr || "0m" }));
    };

    updateUptime();
    const interval = setInterval(updateUptime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [config.status, maintenanceStartTime]);

  // Calculate maintenance countdown (ticks every second)
  useEffect(() => {
    if (config.status !== "maintenance" || !maintenanceEndTime) {
      setCountdown(null);
      setConfig((prev) => ({ ...prev, maintenanceCountdown: null, scheduledEndAt: null }));
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = maintenanceEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown(null);
        setConfig((prev) => ({ ...prev, maintenanceCountdown: null }));
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const newCountdown = { days, hours, minutes, seconds };
      setCountdown(newCountdown);
      setConfig((prev) => ({
        ...prev,
        maintenanceCountdown: newCountdown,
        scheduledEndAt: maintenanceEndTime.toISOString(),
      }));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [config.status, maintenanceEndTime]);

  const sendStatusToDiscord = useCallback(
    async (options: { useStoredId: boolean; mode: SendMode }) => {
      const { useStoredId, mode } = options;

      // Prevent overlapping background edits (Discord rate-limits message edits)
      if (mode === "background") {
        if (inFlightRef.current) return;

        const now = Date.now();
        // Keep a small buffer vs Discord route rate limits
        if (now - lastEditAtRef.current < 1100) return;
      }

      if (mode === "manual") setIsSending(true);
      inFlightRef.current = true;

      try {
        const latestConfig = configRef.current;
        const messageId = useStoredId ? storedMessageIdRef.current : null;

        const payload = {
          ...latestConfig,
          messageId,
        };

        // Fingerprint to avoid useless background edits
        if (mode === "background") {
          const cd = countdownRef.current;
          const cdSeconds = cd ? cd.days * 86400 + cd.hours * 3600 + cd.minutes * 60 + cd.seconds : 0;
          const fp = `${latestConfig.status}|${latestConfig.usersActive}|${latestConfig.uptime}|${cdSeconds}|${latestConfig.customMessage}`;
          if (fp === lastSentFingerprintRef.current) return;
          lastSentFingerprintRef.current = fp;
        }

        const { data, error } = await supabase.functions.invoke("send-server-status-discord", {
          body: payload,
        });

        if (error) throw error;

        if (data?.messageId) {
          setStoredMessageId(data.messageId);
        }

        // Avoid spamming toasts for background realtime updates
        if (mode === "manual") {
          toast({
            title: data?.isEdit ? "Status Updated" : "Status Sent",
            description: data?.isEdit
              ? "Discord message has been updated with latest status."
              : "Website status has been posted to Discord.",
          });
        }

        lastEditAtRef.current = Date.now();
      } catch (error: any) {
        console.error("Error sending status:", error);
        if (mode === "manual") {
          toast({
            title: "Failed to Send Status",
            description: error.message || "Could not send website status to Discord.",
            variant: "destructive",
          });
        }
      } finally {
        inFlightRef.current = false;
        if (mode === "manual") setIsSending(false);
      }
    },
    [toast]
  );

  // Single realtime scheduler:
  // - If no stored message yet and auto-update is on, create it once.
  // - Then edit the same message continuously (1s during maintenance to show ticking seconds).
  useEffect(() => {
    if (!autoUpdate) return;

    let cancelled = false;

    const ensureMessageExists = async () => {
      if (storedMessageIdRef.current) return;
      await sendStatusToDiscord({ useStoredId: false, mode: "background" });
    };

    const tick = async () => {
      if (cancelled) return;

      // Make sure we have a message to edit
      await ensureMessageExists();

      if (storedMessageIdRef.current) {
        await sendStatusToDiscord({ useStoredId: true, mode: "background" });
      }
    };

    // Run immediately, then on interval.
    tick();

    const intervalMs = () => (configRef.current.status === "maintenance" ? 1000 : 5000);
    let interval = window.setInterval(tick, intervalMs());

    // If status flips between maintenance/online, adjust interval automatically
    const adjustInterval = () => {
      clearInterval(interval);
      interval = window.setInterval(tick, intervalMs());
    };

    // Lightweight watcher for status changes
    const statusWatch = window.setInterval(() => {
      // Recreate interval only when required
      const desired = intervalMs();
      // If current is incorrect, adjust (store on function property)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = (adjustInterval as any)._ms as number | undefined;
      if (current !== desired) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adjustInterval as any)._ms = desired;
        adjustInterval();
      }
    }, 750);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(statusWatch);
    };
  }, [autoUpdate, sendStatusToDiscord]);

  const handleSendNew = () => sendStatusToDiscord({ useStoredId: false, mode: "manual" });
  const handleUpdateExisting = () => sendStatusToDiscord({ useStoredId: true, mode: "manual" });

  const getStatusIcon = (status: WebsiteStatusType) => {
    switch (status) {
      case "online":
        return <Wifi className="w-5 h-5 text-green-500" />;
      case "maintenance":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "offline":
        return <WifiOff className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: WebsiteStatusType) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">🟢 Online</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">🟡 Maintenance</Badge>;
      case "offline":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">🔴 Offline</Badge>;
    }
  };

  const formatCountdownDisplay = (cd: { days: number; hours: number; minutes: number; seconds: number } | null) => {
    if (!cd) return "N/A";
    const parts = [];
    if (cd.days > 0) parts.push(`${cd.days}d`);
    if (cd.hours > 0) parts.push(`${cd.hours}h`);
    if (cd.minutes > 0) parts.push(`${cd.minutes}m`);
    parts.push(`${cd.seconds}s`);
    return parts.join(" ");
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-gradient">Website Status Discord Sender</CardTitle>
                <CardDescription>Real-time website status updates to Discord</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoUpdate}
                  onCheckedChange={setAutoUpdate}
                  id="auto-update"
                />
                <Label htmlFor="auto-update" className="text-sm flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Auto-Update
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Status Dashboard */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Live Website Status
              </h3>
              {getStatusBadge(config.status)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Users className="w-4 h-4 text-green-500" />
                <div>
                  <div className="text-muted-foreground text-xs">Users Active</div>
                  <div className="font-bold text-lg">{config.usersActive}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                {getStatusIcon(config.status)}
                <div>
                  <div className="text-muted-foreground text-xs">Status</div>
                  <div className="font-bold capitalize">{config.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-muted-foreground text-xs">Uptime</div>
                  <div className="font-bold">{config.uptime}</div>
                </div>
              </div>
              {config.status === "maintenance" && countdown && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Timer className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="text-muted-foreground text-xs">Countdown</div>
                    <div className="font-bold text-yellow-500">{formatCountdownDisplay(countdown)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website URL
              </Label>
              <Input
                id="websiteUrl"
                value={config.websiteUrl}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, websiteUrl: e.target.value }))
                }
                placeholder="https://skyliferoleplay.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordUrl" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Discord Invite URL
              </Label>
              <Input
                id="discordUrl"
                value={config.discordUrl}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, discordUrl: e.target.value }))
                }
                placeholder="https://discord.gg/..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customMessage" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Custom Message (Optional)
              </Label>
              <Textarea
                id="customMessage"
                value={config.customMessage}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, customMessage: e.target.value }))
                }
                placeholder="Add a custom message to the status update..."
                rows={2}
              />
            </div>
          </div>

          {/* Enhanced Discord Preview */}
          <div className="p-4 rounded-xl bg-[#36393f] border border-[#202225] text-white overflow-hidden">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">SkyLife Status Bot</span>
                <Badge className="bg-[#5865f2] text-xs px-1.5 py-0.5">BOT</Badge>
              </div>
            </div>
            
            {/* Embed */}
            <div className={`border-l-4 ${
              config.status === 'online' ? 'border-green-500' : 
              config.status === 'maintenance' ? 'border-yellow-500' : 'border-red-500'
            } bg-[#2f3136] rounded-r-lg overflow-hidden`}>
              {/* Header */}
              <div className="p-4 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src="/images/slrp-logo.png" 
                    alt="SLRP" 
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <span className="text-sm text-gray-300 font-semibold">✨ SkyLife Roleplay India ✨</span>
                </div>
                <h4 className="font-bold text-lg mb-2">🌐 WEBSITE STATUS</h4>
                <p className="text-sm text-gray-300 border-l-2 border-gray-600 pl-2">
                  {config.customMessage || (
                    config.status === "online" 
                      ? "✅ All systems operational!"
                      : config.status === "maintenance"
                      ? "🔧 Scheduled maintenance in progress..."
                      : "⚠️ Website is currently unavailable."
                  )}
                </p>
              </div>

              {/* Status Fields */}
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1 font-semibold">▎STATUS</div>
                  <div className="font-bold">
                    {config.status === 'online' ? '🟢' : config.status === 'maintenance' ? '🟡' : '🔴'} 
                    <span className="italic">{config.status === 'online' ? 'Online' : config.status === 'maintenance' ? 'Under Maintenance' : 'Offline'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1 font-semibold">▎USERS ACTIVE</div>
                  <div className="font-bold">👥 <span className="italic">{config.usersActive}</span></div>
                </div>
              </div>

              {/* Website Link */}
              <div className="px-4 pb-2">
                <div className="text-xs text-gray-400 mb-1 font-semibold">▎WEBSITE LINK</div>
                <a href={config.websiteUrl} className="text-blue-400 hover:underline font-bold">
                  🌐 <span className="italic">{config.websiteUrl.replace('https://', '')}</span>
                </a>
              </div>

              {/* Uptime and Countdown */}
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1 font-semibold">▎UPTIME</div>
                  <div className="font-bold">⏱️ <span className="italic">{config.uptime}</span></div>
                </div>
                {config.status === "maintenance" && countdown && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-2 font-semibold">⏳ MAINTENANCE COUNTDOWN</div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-md px-3 py-2 text-center min-w-[55px]">
                        <div className="text-lg font-bold text-yellow-400">{countdown.days.toString().padStart(2, '0')}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Days</div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-md px-3 py-2 text-center min-w-[55px]">
                        <div className="text-lg font-bold text-yellow-400">{countdown.hours.toString().padStart(2, '0')}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Hrs</div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-md px-3 py-2 text-center min-w-[55px]">
                        <div className="text-lg font-bold text-yellow-400">{countdown.minutes.toString().padStart(2, '0')}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Min</div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-md px-3 py-2 text-center min-w-[55px]">
                        <div className="text-lg font-bold text-yellow-400">{countdown.seconds.toString().padStart(2, '0')}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Sec</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              <div className="p-4">
                <img 
                  src="/images/social-card.jpg" 
                  alt="SkyLife Banner"
                  className="w-full rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Footer */}
              <div className="px-4 pb-3 flex items-center gap-2 text-xs text-gray-400">
                <img 
                  src="/images/slrp-logo.png" 
                  alt="SLRP" 
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <span>🤖 SkyLife Status Bot • Live Updates</span>
              </div>
            </div>

            {/* Buttons Preview */}
            <div className="flex gap-2 mt-3">
              <div className="px-4 py-2 bg-[#4f545c] rounded text-sm font-medium flex items-center gap-2">
                🌐 Visit Website
              </div>
              <div className="px-4 py-2 bg-[#4f545c] rounded text-sm font-medium flex items-center gap-2">
                💬 Join Discord
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {storedMessageId ? (
              <>
                <Button
                  onClick={handleUpdateExisting}
                  disabled={isSending}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Update Existing Message
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSendNew}
                  disabled={isSending}
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Send className="w-5 h-5" />
                  Send New Message
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSendNew}
                disabled={isSending}
                className="w-full gap-2"
                size="lg"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sending to Discord...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Status to Discord
                  </>
                )}
              </Button>
            )}
          </div>

          {autoUpdate && (
            <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Auto-update enabled: Discord message will update automatically when status changes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerStatusDiscordSender;
