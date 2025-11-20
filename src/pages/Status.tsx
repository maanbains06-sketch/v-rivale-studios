import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStatus from "@/assets/header-status.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Clock, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  type: "update" | "event" | "maintenance";
}

interface ActiveEvent {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  participants: number;
}

const Status = () => {
  const [stats, setStats] = useState<ServerStats>({
    playersOnline: 0,
    maxPlayers: 128,
    uptime: "0d 0h 0m",
    cpu: 0,
    memory: 0,
    ping: 0,
  });

  // Simulate real-time updates
  useEffect(() => {
    const updateStats = () => {
      setStats({
        playersOnline: Math.floor(Math.random() * 128) + 50,
        maxPlayers: 128,
        uptime: "7d 14h 32m",
        cpu: Math.floor(Math.random() * 30) + 40,
        memory: Math.floor(Math.random() * 20) + 60,
        ping: Math.floor(Math.random() * 20) + 30,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const recentUpdates: RecentUpdate[] = [
    { id: 1, title: "New Housing System Released", date: "2 hours ago", type: "update" },
    { id: 2, title: "Bank Heist Event Starting Soon", date: "4 hours ago", type: "event" },
    { id: 3, title: "Server Optimization Complete", date: "1 day ago", type: "maintenance" },
    { id: 4, title: "New Vehicle Pack Added", date: "2 days ago", type: "update" },
  ];

  const activeEvents: ActiveEvent[] = [
    { id: 1, name: "Double XP Weekend", startTime: "Now", endTime: "2 days", participants: 89 },
    { id: 2, name: "Street Racing Tournament", startTime: "In 3 hours", endTime: "6 hours", participants: 24 },
    { id: 3, name: "Police Recruitment Drive", startTime: "Now", endTime: "5 days", participants: 15 },
  ];

  const updateTypeColors = {
    update: "bg-primary",
    event: "bg-secondary",
    maintenance: "bg-accent",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Server Status"
        description="Real-time server statistics and performance metrics"
        badge="🟢 Server Online"
        backgroundImage={headerStatus}
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-effect border-border/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Players Online</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {stats.playersOnline}/{stats.maxPlayers}
                </div>
                <Progress 
                  value={(stats.playersOnline / stats.maxPlayers) * 100} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
                <Clock className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.uptime}</div>
                <p className="text-xs text-muted-foreground mt-2">99.9% reliability</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Load</CardTitle>
                <Activity className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU</span>
                    <span className="text-sm font-semibold">{stats.cpu}%</span>
                  </div>
                  <Progress value={stats.cpu} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory</span>
                    <span className="text-sm font-semibold">{stats.memory}%</span>
                  </div>
                  <Progress value={stats.memory} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latency</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.ping}ms</div>
                <p className="text-xs text-muted-foreground mt-2">Excellent connection</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Updates */}
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUpdates.map((update) => (
                    <div 
                      key={update.id}
                      className="flex items-start gap-3 p-3 rounded-lg glass-effect border border-border/10"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${updateTypeColors[update.type]}`}></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{update.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{update.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {update.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Events */}
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-secondary" />
                  Active Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="p-4 rounded-lg glass-effect border border-secondary/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{event.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {event.participants} joined
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Starts: {event.startTime}</span>
                        <span>•</span>
                        <span>Duration: {event.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Server Info */}
          <Card className="glass-effect border-border/20 mt-6">
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Connect IP</h4>
                  <p className="text-lg font-mono bg-background/50 p-3 rounded-lg">
                    connect.skylifeindia.com:30120
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Discord</h4>
                  <p className="text-lg font-mono bg-background/50 p-3 rounded-lg">
                    discord.gg/skylifeindia
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Version</h4>
                  <p className="text-lg font-mono bg-background/50 p-3 rounded-lg">
                    v2.4.1 (Latest)
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
