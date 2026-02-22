import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ShieldAlert, AlertTriangle, Ban, Bot, Activity, RefreshCw, Clock, Globe, Fingerprint } from "lucide-react";

interface SecurityEvent {
  id: string;
  event_type: string;
  ip_address: string | null;
  discord_id: string | null;
  details: Record<string, any>;
  severity: string;
  created_at: string;
}

const OwnerSecurityDashboard = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState({ failedLogins: 0, blockedIps: 0, botDetections: 0, suspiciousActivities: 0, totalEvents24h: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [eventsResult, statsResult] = await Promise.all([
      supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("security_events").select("event_type").gte("created_at", since24h),
    ]);

    if (eventsResult.data) setEvents(eventsResult.data as SecurityEvent[]);

    if (statsResult.data) {
      const counts = { failedLogins: 0, blockedIps: 0, botDetections: 0, suspiciousActivities: 0, totalEvents24h: statsResult.data.length };
      for (const e of statsResult.data) {
        switch (e.event_type) {
          case "failed_login": counts.failedLogins++; break;
          case "blocked_ip": counts.blockedIps++; break;
          case "bot_detected": counts.botDetections++; break;
          case "suspicious_activity": counts.suspiciousActivities++; break;
        }
      }
      setStats(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("security-events-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_events" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "high": return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      default: return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "failed_login": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "blocked_ip": return <Ban className="w-4 h-4 text-red-400" />;
      case "bot_detected": return <Bot className="w-4 h-4 text-orange-400" />;
      case "suspicious_activity": return <Fingerprint className="w-4 h-4 text-purple-400" />;
      case "lockdown_activated": return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case "lockdown_deactivated": return <Shield className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Failed Logins", value: stats.failedLogins, icon: <AlertTriangle className="w-5 h-5" />, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          { label: "Blocked IPs", value: stats.blockedIps, icon: <Ban className="w-5 h-5" />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { label: "Bot Detections", value: stats.botDetections, icon: <Bot className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          { label: "Suspicious", value: stats.suspiciousActivities, icon: <Fingerprint className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
        ].map((stat, i) => (
          <Card key={i} className={`border ${stat.bg}`}>
            <CardContent className="p-4 text-center">
              <div className={`${stat.color} mb-2 flex justify-center`}>{stat.icon}</div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground/60">Last 24h</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-cyan-400" /> Live Security Feed
              </CardTitle>
              <CardDescription>Real-time security events and threat monitoring</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" /> {stats.totalEvents24h} events (24h)
              </Badge>
              <Button variant="ghost" size="icon" onClick={loadData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-green-400/50 mb-3" />
                <p className="text-muted-foreground">No security events recorded yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Events will appear here as they happen.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className={`flex items-start gap-3 p-3 rounded-lg border ${getSeverityColor(event.severity)}`}>
                    <div className="mt-0.5">{getEventIcon(event.event_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">{event.event_type.replace(/_/g, " ")}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 capitalize">{event.severity}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {event.ip_address && (
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {event.ip_address}</span>
                        )}
                        {event.discord_id && (
                          <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> {event.discord_id}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(event.created_at)}</span>
                      </div>
                      {event.details && Object.keys(event.details).length > 0 && (
                        <p className="text-xs text-muted-foreground/80 mt-1 truncate">{JSON.stringify(event.details).slice(0, 100)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerSecurityDashboard;
