import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStatus from "@/assets/header-status.jpg";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Clock, Zap, TrendingUp, AlertCircle, Server, Wifi, HardDrive, Cpu, MemoryStick, Network } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return "text-green-500";
    if (value <= thresholds.warning) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Server Status"
        description="Real-time server statistics and performance metrics"
        badge="🟢 Live & Operational"
        backgroundImage={headerStatus}
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">

          {/* Live Status Indicator */}
          <div className="mb-8 flex items-center justify-center gap-3 p-6 rounded-xl glass-effect border border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-fade-in">
            <div className="relative">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">All Systems Operational</h3>
              <p className="text-sm text-muted-foreground">Last updated: Just now</p>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-effect border-border/20 hover:border-primary/40 transition-all duration-300 group animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Players Online</CardTitle>
                <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stats.playersOnline}
                </div>
                <p className="text-xs text-muted-foreground mt-1">of {stats.maxPlayers} max</p>
                <Progress 
                  value={(stats.playersOnline / stats.maxPlayers) * 100} 
                  className="mt-3 h-3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round((stats.playersOnline / stats.maxPlayers) * 100)}% capacity
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 hover:border-secondary/40 transition-all duration-300 group animate-fade-in animation-delay-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
                <Clock className="h-5 w-5 text-secondary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-secondary">{stats.uptime}</div>
                <p className="text-xs text-green-500 mt-2 font-semibold">● 99.9% reliability</p>
                <div className="mt-3 p-2 rounded-lg bg-secondary/10">
                  <p className="text-xs text-muted-foreground">Zero downtime this month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 hover:border-accent/40 transition-all duration-300 group animate-fade-in animation-delay-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Load</CardTitle>
                <Activity className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3 h-3" />
                        <span className="text-xs font-medium">CPU</span>
                      </div>
                      <span className={`text-sm font-bold ${getStatusColor(stats.cpu, { good: 50, warning: 75 })}`}>
                        {stats.cpu}%
                      </span>
                    </div>
                    <Progress value={stats.cpu} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-3 h-3" />
                        <span className="text-xs font-medium">RAM</span>
                      </div>
                      <span className={`text-sm font-bold ${getStatusColor(stats.memory, { good: 60, warning: 80 })}`}>
                        {stats.memory}%
                      </span>
                    </div>
                    <Progress value={stats.memory} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 hover:border-primary/40 transition-all duration-300 group animate-fade-in animation-delay-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
                <Zap className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{stats.ping}ms</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-xs text-green-500 font-semibold">Excellent</p>
                </div>
                <div className="mt-3 p-2 rounded-lg bg-primary/10">
                  <div className="flex items-center gap-2">
                    <Network className="w-3 h-3 text-primary" />
                    <p className="text-xs text-muted-foreground">Network stable</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="glass-effect border-border/20 mb-8 animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    Server Performance Metrics
                  </CardTitle>
                  <CardDescription className="mt-2">Detailed performance analysis and resource utilization</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                  Optimal
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg glass-effect border border-border/20 hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CPU Usage</p>
                      <p className="text-2xl font-bold">{stats.cpu}%</p>
                    </div>
                  </div>
                  <Progress value={stats.cpu} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">8 cores @ 3.6 GHz</p>
                </div>

                <div className="p-4 rounded-lg glass-effect border border-border/20 hover:border-secondary/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-secondary/20">
                      <MemoryStick className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Memory Usage</p>
                      <p className="text-2xl font-bold">{stats.memory}%</p>
                    </div>
                  </div>
                  <Progress value={stats.memory} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">32 GB DDR4 RAM</p>
                </div>

                <div className="p-4 rounded-lg glass-effect border border-border/20 hover:border-accent/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <HardDrive className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Disk Usage</p>
                      <p className="text-2xl font-bold">45%</p>
                    </div>
                  </div>
                  <Progress value={45} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">1 TB NVMe SSD</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Updates */}
            <Card className="glass-effect border-border/20 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Updates
                </CardTitle>
                <CardDescription>Latest server updates and patches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUpdates.map((update) => (
                    <div 
                      key={update.id}
                      className="flex items-start gap-3 p-4 rounded-lg glass-effect border border-border/10 hover:border-primary/30 transition-all duration-300 group"
                    >
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${updateTypeColors[update.type]} group-hover:scale-125 transition-transform`}></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{update.title}</h4>
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
            <Card className="glass-effect border-border/20 animate-fade-in animation-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-secondary" />
                  Active Events
                </CardTitle>
                <CardDescription>Live events happening now</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="p-4 rounded-lg glass-effect border border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-foreground">{event.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {event.participants}
                        </Badge>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{event.startTime}</span>
                        </div>
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
          <Card className="glass-effect border-border/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-primary" />
                Server Connection Information
              </CardTitle>
              <CardDescription>Use these details to connect to our server</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg glass-effect border border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <h4 className="font-semibold text-sm mb-3 text-primary flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Connect IP
                  </h4>
                  <p className="text-lg font-mono bg-background/80 p-3 rounded-lg border border-border/20 text-foreground">
                    connect.skylifeindia.com:30120
                  </p>
                </div>
                <div className="p-4 rounded-lg glass-effect border border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                  <h4 className="font-semibold text-sm mb-3 text-secondary flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    Discord
                  </h4>
                  <p className="text-lg font-mono bg-background/80 p-3 rounded-lg border border-border/20 text-foreground">
                    discord.gg/skylifeindia
                  </p>
                </div>
                <div className="p-4 rounded-lg glass-effect border border-accent/20 hover:border-accent/40 transition-all duration-300">
                  <h4 className="font-semibold text-sm mb-3 text-accent flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Version
                  </h4>
                  <p className="text-lg font-mono bg-background/80 p-3 rounded-lg border border-border/20 text-foreground">
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