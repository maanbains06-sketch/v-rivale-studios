import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useServerStatus } from "@/hooks/home/useServerStatus";
import { 
  Send, 
  Server, 
  Users, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  RefreshCw,
  Clock,
  Terminal,
  Globe,
  MessageSquare
} from "lucide-react";

type ServerStatusType = "online" | "maintenance" | "offline";

interface StatusConfig {
  status: ServerStatusType;
  players: number;
  maxPlayers: number;
  connectCommand: string;
  nextRestart: string;
  uptime: string;
  customMessage: string;
  websiteUrl: string;
  discordUrl: string;
}

const ServerStatusDiscordSender = () => {
  const { toast } = useToast();
  const { data: currentStatus, refetch: refetchStatus } = useServerStatus();
  const [isSending, setIsSending] = useState(false);
  const [config, setConfig] = useState<StatusConfig>({
    status: "online",
    players: 0,
    maxPlayers: 64,
    connectCommand: "connect cfx.re/join/skylife",
    nextRestart: "in 2 hours",
    uptime: "0 mins",
    customMessage: "",
    websiteUrl: "https://skyliferoleplay.com",
    discordUrl: "https://discord.gg/skyliferp"
  });

  // Sync with real-time server status
  useEffect(() => {
    if (currentStatus) {
      setConfig(prev => ({
        ...prev,
        status: currentStatus.status as ServerStatusType,
        players: currentStatus.players,
        maxPlayers: currentStatus.maxPlayers
      }));
    }
  }, [currentStatus]);

  const handleSendStatus = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-server-status-discord", {
        body: config
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Status Sent Successfully",
        description: "Server status has been posted to Discord.",
      });
    } catch (error: any) {
      console.error("Error sending status:", error);
      toast({
        title: "Failed to Send Status",
        description: error.message || "Could not send server status to Discord.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRefreshStatus = async () => {
    await refetchStatus();
    toast({
      title: "Status Refreshed",
      description: "Server status has been updated from the live server.",
    });
  };

  const getStatusIcon = (status: ServerStatusType) => {
    switch (status) {
      case "online":
        return <Wifi className="w-5 h-5 text-green-500" />;
      case "maintenance":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "offline":
        return <WifiOff className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ServerStatusType) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">🟢 Online</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">🟡 Maintenance</Badge>;
      case "offline":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">🔴 Offline</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-gradient">Website Status Discord Sender</CardTitle>
                <CardDescription>Send real-time website status updates to Discord</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshStatus}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Live Status
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status Preview */}
          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Server className="w-4 h-4" />
                Current Live Status
              </h3>
              {getStatusBadge(config.status)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Users Active: <strong>{config.players}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(config.status)}
                <span>Status: <strong className="capitalize">{config.status}</strong></span>
              </div>
            </div>
          </div>

          {/* Status Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Server Status
              </Label>
              <Select
                value={config.status}
                onValueChange={(value: ServerStatusType) =>
                  setConfig(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <span className="flex items-center gap-2">🟢 Online</span>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <span className="flex items-center gap-2">🟡 Under Maintenance</span>
                  </SelectItem>
                  <SelectItem value="offline">
                    <span className="flex items-center gap-2">🔴 Offline</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="players" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users Active
              </Label>
              <Input
                id="players"
                type="number"
                min="0"
                value={config.players}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, players: parseInt(e.target.value) || 0 }))
                }
                placeholder="Active users on website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website Link
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
              <Label htmlFor="nextRestart" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Next Restart
              </Label>
              <Input
                id="nextRestart"
                value={config.nextRestart}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, nextRestart: e.target.value }))
                }
                placeholder="in 2 hours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uptime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Uptime
              </Label>
              <Input
                id="uptime"
                value={config.uptime}
                onChange={(e) =>
                  setConfig(prev => ({ ...prev, uptime: e.target.value }))
                }
                placeholder="45 mins"
              />
            </div>

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

            <div className="space-y-2 md:col-span-2">
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
                rows={3}
              />
            </div>
          </div>

          {/* Preview Card */}
          <div className="p-4 rounded-xl bg-[#2f3136] border border-[#202225] text-white">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-primary">SkyLife Status Bot</span>
                <Badge className="ml-2 bg-[#5865f2] text-xs">BOT</Badge>
              </div>
            </div>
            <div className={`border-l-4 ${
              config.status === 'online' ? 'border-green-500' : 
              config.status === 'maintenance' ? 'border-yellow-500' : 'border-red-500'
            } bg-[#36393f] p-4 rounded`}>
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src="/images/slrp-logo.png" 
                  alt="SLRP" 
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <span className="text-sm text-gray-400">SkyLife Roleplay India</span>
              </div>
              <h4 className="font-semibold mb-2">🌐 SkyLife Roleplay Website Status</h4>
              <p className="text-sm text-gray-400 mb-3">
                {config.customMessage || "Real-time website status update from SkyLife Status Bot"}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">▎ STATUS</span>
                  <div className="font-semibold">
                    {config.status === 'online' ? '🟢' : config.status === 'maintenance' ? '🟡' : '🔴'} 
                    {' '}{config.status === 'online' ? 'Online' : config.status === 'maintenance' ? 'Under Maintenance' : 'Offline'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">▎ USERS ACTIVE</span>
                  <div className="font-semibold">👥 {config.players}</div>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-gray-400 text-sm">▎ WEBSITE LINK</span>
                <div className="p-2 bg-[#2f3136] rounded font-mono text-sm mt-1">
                  {config.websiteUrl}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                  <span className="text-gray-400">▎ NEXT RESTART</span>
                  <div>⏰ {config.nextRestart}</div>
                </div>
                <div>
                  <span className="text-gray-400">▎ UPTIME</span>
                  <div>⏱️ {config.uptime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendStatus}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerStatusDiscordSender;
