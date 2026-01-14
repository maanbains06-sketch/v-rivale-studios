import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  Server,
  Wifi,
  Network,
  Sparkles,
  Shield,
  Calendar,
  AlertTriangle,
  Package,
  MapPin,
  UserPlus,
  Check,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { User } from "@supabase/supabase-js";

interface ServerStats {
  playersOnline: number;
  maxPlayers: number;
  uptime: string;
  cpu: number;
  memory: number;
  ping: number;
}

interface RecentUpdate {
  id: number;
  title: string;
  date: string;
  type: "update" | "maintenance" | "resource";
}

interface ActiveEvent {
  id: number;
  eventId: string; // actual UUID from database
  name: string;
  startTime: string;
  endTime: string;
  participants: number;
  maxParticipants?: number;
  status: string;
  location?: string;
}

interface ServerStatus {
  status: "online" | "offline" | "maintenance" | "error";
  players: {
    current: number;
    max: number;
  };
  uptime: string;
  uptimeSeconds: number;
  serverLoad: number;
  networkLatency: number;
  serverName?: string;
  error?: string;
}

const Status = () => {
  const [serverData, setServerData] = useState<ServerStatus>({
    status: "offline",
    players: { current: 0, max: 48 },
    uptime: "0h",
    uptimeSeconds: 0,
    serverLoad: 0,
    networkLatency: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUptimeSeconds, setLastUptimeSeconds] = useState<number | null>(null);
  const [showRestartBanner, setShowRestartBanner] = useState(false);
  const [restartTime, setRestartTime] = useState<Date | null>(null);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);

  const fetchServerStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("fivem-server-status");

      if (error) {
        console.error("Error fetching server status:", error);
        toast.error("Failed to fetch server status");
        return;
      }

      // Check for server restart (uptime decreased)
      if (lastUptimeSeconds !== null && data.uptimeSeconds < lastUptimeSeconds && data.status === "online") {
        setShowRestartBanner(true);
        setRestartTime(new Date());
        toast.success("Server Restarted", {
          description: `${data.serverName || "Server"} has been restarted. Current uptime: ${data.uptime}`,
        });
      }

      setLastUptimeSeconds(data.uptimeSeconds);
    } catch (error) {
      console.error("Error fetching server status:", error);
      setServerData((prev) => ({ ...prev, status: "offline" }));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-dismiss restart banner after 5 minutes
  useEffect(() => {
    if (showRestartBanner) {
      const timer = setTimeout(() => {
        setShowRestartBanner(false);
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, [showRestartBanner]);

  const fetchMaintenance = async () => {
    try {
      const { data, error } = await supabase
        .from("maintenance_schedules")
        .select("*")
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_start", { ascending: true });

      if (!error && data) {
        setMaintenance(data);
      }
    } catch (error) {
      console.error("Failed to fetch maintenance schedules:", error);
    }
  };

  const fetchRecentUpdates = async () => {
    try {
      // Fetch recent maintenance/updates from maintenance_schedules
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from("maintenance_schedules")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch server resource updates (auto-detected new scripts/resources)
      const { data: serverUpdatesData, error: serverUpdatesError } = await supabase
        .from("server_updates")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(10);

      const updates: RecentUpdate[] = [];

      // Add server resource updates (new scripts/jobs added)
      if (!serverUpdatesError && serverUpdatesData) {
        serverUpdatesData.forEach((item, index) => {
          updates.push({
            id: index + 1,
            title: item.title,
            date: getTimeAgo(new Date(item.detected_at)),
            type: "resource",
          });
        });
      }

      // Add maintenance items
      if (!maintenanceError && maintenanceData) {
        maintenanceData.forEach((item, index) => {
          updates.push({
            id: updates.length + index + 1,
            title: item.title,
            date: getTimeAgo(new Date(item.created_at)),
            type: "maintenance",
          });
        });
      }

      // Sort by recency and take top 5
      updates.sort((a, b) => {
        const timeA = parseTimeAgo(a.date);
        const timeB = parseTimeAgo(b.date);
        return timeA - timeB;
      });

      setRecentUpdates(updates.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch recent updates:", error);
    }
  };

  const fetchActiveEvents = async () => {
    try {
      // Just fetch from database - Discord sync happens via useEvents hook on Gallery page
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("status", ["upcoming", "running"])
        .order("start_date", { ascending: true })
        .limit(5);

      if (!error && data) {
        const events: ActiveEvent[] = data.map((event, index) => ({
          id: index + 1,
          eventId: event.id,
          name: event.title,
          startTime: getEventStartTime(new Date(event.start_date)),
          endTime: getEventDuration(new Date(event.start_date), new Date(event.end_date)),
          participants: event.current_participants || 0,
          maxParticipants: event.max_participants || undefined,
          status: event.status,
          location: event.location || undefined,
        }));
        setActiveEvents(events);
      }
    } catch (error) {
      console.error("Failed to fetch active events:", error);
    }
  };

  const fetchUserRegistrations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("event_id")
        .eq("user_id", userId);

      if (!error && data) {
        setUserRegistrations(data.map((r) => r.event_id));
      }
    } catch (error) {
      console.error("Failed to fetch user registrations:", error);
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    if (!user) {
      toast.error("Please sign in to register for events");
      return;
    }

    setRegisteringEventId(eventId);

    try {
      const { error } = await supabase.from("event_participants").insert({
        event_id: eventId,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already registered for this event");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully registered for event!");
        setUserRegistrations((prev) => [...prev, eventId]);
        fetchActiveEvents(); // Refresh to get updated participant count
      }
    } catch (error) {
      console.error("Failed to register for event:", error);
      toast.error("Failed to register for event");
    } finally {
      setRegisteringEventId(null);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const parseTimeAgo = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)\s*(minute|hour|day)/);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === "minute") return value;
    if (unit === "hour") return value * 60;
    if (unit === "day") return value * 1440;
    return 0;
  };

  const getEventStartTime = (startDate: Date): string => {
    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Now";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Starting soon";
    if (diffHours < 24) return `In ${diffHours} hours`;
    return `In ${diffDays} days`;
  };

  const getEventDuration = (startDate: Date, endDate: Date): string => {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `${diffHours} hours`;
    return `${diffDays} days`;
  };

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchUserRegistrations(user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRegistrations(session.user.id);
      } else {
        setUserRegistrations([]);
      }
    });

    fetchServerStatus();
    fetchMaintenance();
    fetchRecentUpdates();
    fetchActiveEvents();

    const statusInterval = setInterval(fetchServerStatus, 10000);
    const maintenanceInterval = setInterval(fetchMaintenance, 60000);
    const updatesInterval = setInterval(fetchRecentUpdates, 60000);
    const eventsInterval = setInterval(fetchActiveEvents, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(statusInterval);
      clearInterval(maintenanceInterval);
      clearInterval(updatesInterval);
      clearInterval(eventsInterval);
    };
  }, [lastUptimeSeconds]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "from-green-400 to-green-600";
      case "offline":
        return "from-red-400 to-red-600";
      case "maintenance":
        return "from-yellow-400 to-yellow-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "All Systems Operational";
      case "offline":
        return "Server Offline";
      case "maintenance":
        return "Under Maintenance";
      default:
        return "Status Unknown";
    }
  };

  const getLatencyText = (latency: number) => {
    if (latency < 50) return "Excellent";
    if (latency < 100) return "Good";
    if (latency < 150) return "Fair";
    return "Poor";
  };

  const getLoadText = (load: number) => {
    if (load < 50) return "Optimal";
    if (load < 75) return "Good";
    if (load < 90) return "High";
    return "Critical";
  };

  const updateTypeColors: Record<string, string> = {
    update: "bg-gradient-to-r from-primary/80 to-primary",
    maintenance: "bg-gradient-to-r from-accent/80 to-accent",
    resource: "bg-gradient-to-r from-green-500/80 to-green-600",
  };

  const updateTypeIcons: Record<string, any> = {
    update: Sparkles,
    maintenance: Shield,
    resource: Package,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pb-16 pt-24">
        <div className="container mx-auto px-4">
          {/* Server Restart Notification Banner */}
          {showRestartBanner && (
            <div className="mb-8 animate-fade-in">
              <Card className="glass-effect border-2 border-green-500/50 bg-green-500/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-500/20 animate-spin-slow">
                        <RefreshCw className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-green-500 flex items-center gap-2">
                          <span>Server Restarted Successfully!</span>
                          <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                            Fresh Start
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          The server was restarted {restartTime ? `at ${format(restartTime, "h:mm a")}` : "recently"}. 
                          Current uptime: <span className="font-semibold text-foreground">{serverData.uptime}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-green-500/10"
                      onClick={() => setShowRestartBanner(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scheduled Maintenance Section */}
          {maintenance.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <Card className="glass-effect border-2 border-warning/50 bg-warning/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-warning/20">
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <span>Scheduled Maintenance</span>
                        <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                          {maintenance.length} {maintenance.length === 1 ? "Event" : "Events"}
                        </Badge>
                      </h3>
                      <div className="space-y-4">
                        {maintenance.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2"
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge
                                variant={item.status === "in_progress" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {item.status === "in_progress" ? "🔴 In Progress" : "🟡 Scheduled"}
                              </Badge>
                              <h4 className="font-semibold text-foreground">{item.title}</h4>
                            </div>
                            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(item.scheduled_start), "PPp")} -{" "}
                                {format(new Date(item.scheduled_end), "PPp")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Live Status Hero Banner */}
          <div className="mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl animate-pulse" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl glass-effect border-2 border-primary/40 bg-gradient-to-br from-background/90 via-background/95 to-background/90 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${getStatusColor(serverData.status)} rounded-full flex items-center justify-center shadow-lg shadow-${serverData.status === "online" ? "green" : "red"}-500/50`}
                  >
                    <Server className="w-10 h-10 text-white" />
                  </div>
                  {serverData.status === "online" && (
                    <>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-pulse border-4 border-background" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-ping" />
                    </>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    {getStatusText(serverData.status)}
                  </h2>
                  <p className="text-muted-foreground mt-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: Just now • {isLoading ? "Loading..." : "Live"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {serverData.serverName || "Skylife RP India"}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Badge
                  variant="outline"
                  className={`px-4 py-2 text-sm ${
                    serverData.status === "online"
                      ? "bg-green-500/10 text-green-500 border-green-500/30"
                      : serverData.status === "maintenance"
                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                        : "bg-red-500/10 text-red-500 border-red-500/30"
                  }`}
                >
                  <div
                    className={`w-2 h-2 ${
                      serverData.status === "online"
                        ? "bg-green-500"
                        : serverData.status === "maintenance"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    } rounded-full mr-2 ${serverData.status === "online" ? "animate-pulse" : ""}`}
                  />
                  {serverData.status === "online"
                    ? "Online"
                    : serverData.status === "maintenance"
                      ? "Maintenance"
                      : "Offline"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Stats Grid - Extra Compact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {/* Players Online Card */}
            <Card className="relative overflow-hidden glass-effect border border-primary/30 hover:border-primary/60 transition-all duration-500 group animate-fade-in hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 p-4">
                <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase">Players</CardTitle>
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Users className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-4 pb-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-1">
                  {isLoading ? "--" : serverData.players.current}/{serverData.players.max}
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">Online now</p>
                <div className="relative mb-1.5">
                  <Progress
                    value={(serverData.players.current / serverData.players.max) * 100}
                    className="h-1.5 bg-primary/20"
                  />
                  <div className="absolute inset-0 h-1.5 bg-gradient-to-r from-primary/40 to-secondary/40 blur-sm" />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">
                    {Math.round((serverData.players.current / serverData.players.max) * 100)}%
                  </span>
                  <span
                    className={`font-semibold flex items-center gap-0.5 ${serverData.status === "online" ? "text-green-500" : "text-red-500"}`}
                  >
                    <TrendingUp className="w-2.5 h-2.5" />
                    {serverData.status === "online" ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Server Uptime - Compact */}
            <Card className="relative overflow-hidden glass-effect border border-secondary/30 hover:border-secondary/60 transition-all duration-500 group animate-fade-in animation-delay-100 hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 p-4">
                <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase">Uptime</CardTitle>
                <div className="p-1.5 rounded-lg bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                  <Clock className="h-3 w-3 text-secondary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-4 pb-4">
                <div className="text-3xl font-bold text-secondary mb-1">{isLoading ? "--" : serverData.uptime}</div>
                <p className="text-[10px] text-green-500 font-semibold flex items-center gap-1 mb-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  {serverData.status === "online" ? "Running Stable" : "Offline"}
                </p>
                <div className="p-1.5 rounded-lg bg-secondary/10 border border-secondary/20">
                  <p className="text-[9px] text-muted-foreground text-center">
                    {serverData.status === "online" ? "No Issues" : "Not Available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Server Load - Compact */}
            <Card className="relative overflow-hidden glass-effect border border-accent/30 hover:border-accent/60 transition-all duration-500 group animate-fade-in animation-delay-200 hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 p-4">
                <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase">Load</CardTitle>
                <div className="p-1.5 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                  <Activity className="h-3 w-3 text-accent group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-4 pb-4">
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-medium text-muted-foreground uppercase">Load</span>
                      <span className="text-lg font-bold text-accent">{isLoading ? "--" : serverData.serverLoad}%</span>
                    </div>
                    <Progress value={serverData.serverLoad} className="h-1 bg-accent/20" />
                  </div>
                  <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-[9px] text-muted-foreground text-center">
                      {isLoading ? "Loading..." : getLoadText(serverData.serverLoad)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Latency - Compact */}
            <Card className="relative overflow-hidden glass-effect border border-primary/30 hover:border-primary/60 transition-all duration-500 group animate-fade-in animation-delay-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 relative z-10 p-4">
                <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase">Latency</CardTitle>
                <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Zap className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10 px-4 pb-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                  {isLoading ? "--" : serverData.networkLatency}ms
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex gap-0.5">
                    <div
                      className={`w-0.5 h-3 rounded-full animate-pulse ${serverData.networkLatency < 50 ? "bg-green-500" : "bg-yellow-500"}`}
                    />
                    <div
                      className={`w-0.5 h-3 rounded-full animate-pulse animation-delay-100 ${serverData.networkLatency < 50 ? "bg-green-500" : "bg-yellow-500"}`}
                    />
                    <div
                      className={`w-0.5 h-3 rounded-full animate-pulse animation-delay-200 ${serverData.networkLatency < 50 ? "bg-green-500" : "bg-yellow-500"}`}
                    />
                  </div>
                  <p
                    className={`text-[10px] font-semibold ${serverData.networkLatency < 50 ? "text-green-500" : "text-yellow-500"}`}
                  >
                    {isLoading ? "Loading..." : getLatencyText(serverData.networkLatency)}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-1 justify-center">
                    <Network className="w-2.5 h-2.5 text-primary" />
                    <p className="text-[9px] text-muted-foreground">
                      {serverData.status === "online" ? "Stable" : "Unavailable"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Recent Updates */}
            <Card className="glass-effect border-2 border-border/20 hover:border-primary/30 transition-all duration-300 animate-fade-in">
              <CardHeader className="border-b border-border/20 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      Recent Updates
                    </CardTitle>
                    <CardDescription className="mt-2">Latest server updates and patches</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentUpdates.length > 0 ? (
                    recentUpdates.map((update, index) => {
                      const Icon = updateTypeIcons[update.type];
                      return (
                        <div
                          key={update.id}
                          className="relative flex items-start gap-4 p-4 rounded-xl glass-effect border-2 border-border/10 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="relative">
                            <div
                              className={`w-12 h-12 rounded-xl ${updateTypeColors[update.type]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                              {update.title}
                            </h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {update.date}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {update.type}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent updates available</p>
                      <p className="text-xs mt-2">Check back later for server updates</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Active Events */}
            <Card className="glass-effect border-2 border-border/20 hover:border-secondary/30 transition-all duration-300 animate-fade-in animation-delay-100">
              <CardHeader className="border-b border-border/20 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 rounded-lg bg-secondary/20">
                        <AlertCircle className="w-6 h-6 text-secondary" />
                      </div>
                      Active Events
                    </CardTitle>
                    <CardDescription className="mt-2">Live events happening now</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    {activeEvents.length} Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {activeEvents.length > 0 ? (
                    activeEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className="relative p-5 rounded-xl glass-effect border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-secondary/10 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={event.status === 'running' ? 'default' : 'secondary'}
                            className={`text-xs ${event.status === 'running' ? 'bg-green-500 hover:bg-green-600 animate-pulse' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                          >
                            {event.status === 'running' ? '🔴 LIVE' : '📅 Upcoming'}
                          </Badge>
                        </div>
                        <div className="flex items-start justify-between mb-3 pr-20">
                          <h4 className="font-bold text-lg text-foreground">{event.name}</h4>
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.participants}{event.maxParticipants ? `/${event.maxParticipants}` : ''}
                          </Badge>
                        </div>
                        {event.location && (
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                        )}
                        <Separator className="my-3 bg-border/30" />
                        <div className="flex items-center justify-between text-sm mb-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span className="font-medium">
                              {event.status === 'running' ? 'Started: ' : 'Starts: '}
                              <span className="text-foreground">{event.startTime}</span>
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Duration: <span className="text-foreground font-medium">{event.endTime}</span>
                          </div>
                        </div>
                        {/* Register Button */}
                        {userRegistrations.includes(event.eventId) ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20 cursor-default"
                            disabled
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Registered
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full bg-gradient-to-r from-secondary to-primary hover:opacity-90"
                            onClick={() => handleRegisterForEvent(event.eventId)}
                            disabled={registeringEventId === event.eventId || (event.maxParticipants !== undefined && event.participants >= event.maxParticipants)}
                          >
                            {registeringEventId === event.eventId ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Registering...
                              </>
                            ) : event.maxParticipants !== undefined && event.participants >= event.maxParticipants ? (
                              'Event Full'
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Register Now
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No active events right now</p>
                      <p className="text-xs mt-2">Join our Discord for event announcements</p>
                      <a
                        href="https://discord.gg/W2nU97maBh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 text-sm text-primary hover:underline"
                      >
                        Join Discord Server →
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Server Info */}
          <Card className="glass-effect border-2 border-border/20 hover:border-primary/30 transition-all duration-300 animate-fade-in">
            <CardHeader className="border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Wifi className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Server Connection Information</CardTitle>
                  <CardDescription className="mt-1">Use these details to connect to our server</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a 
                  href="fivem://connect/15.235.234.147:30120" 
                  className="block p-6 rounded-xl glass-effect border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                      <Server className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm text-primary">Connect IP Address</h4>
                  </div>
                  <p className="text-base font-mono font-semibold bg-background/80 p-4 rounded-lg border-2 border-primary/20 text-foreground group-hover:bg-primary/10 transition-colors">
                    15.235.234.147:30120
                  </p>
                </a>
                <a 
                  href="https://discord.gg/W2nU97maBh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-6 rounded-xl glass-effect border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 hover:-translate-y-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                      <Network className="w-5 h-5 text-secondary" />
                    </div>
                    <h4 className="font-bold text-sm text-secondary">Discord Community</h4>
                  </div>
                  <p className="text-base font-mono font-semibold bg-background/80 p-4 rounded-lg border-2 border-secondary/20 text-foreground group-hover:bg-secondary/10 transition-colors">
                    https://discord.gg/W2nU97maBh
                  </p>
                </a>
                <div className="p-6 rounded-xl glass-effect border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <h4 className="font-bold text-sm text-accent">Server Version</h4>
                  </div>
                  <p className="text-base font-mono font-semibold bg-background/80 p-4 rounded-lg border-2 border-accent/20 text-foreground hover:bg-accent/5 transition-colors">
                    Skylife Roleplay India 1.0
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Status;
