import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStatus from "@/assets/header-status.jpg";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Clock, Zap, TrendingUp, AlertCircle, Server, Wifi, Network, Sparkles, Radio, Shield } from "lucide-react";
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
    { id: 5, title: "Economy Balance Update", date: "3 days ago", type: "maintenance" },
  ];

  const activeEvents: ActiveEvent[] = [
    { id: 1, name: "Double XP Weekend", startTime: "Now", endTime: "2 days", participants: 89 },
    { id: 2, name: "Street Racing Tournament", startTime: "In 3 hours", endTime: "6 hours", participants: 24 },
    { id: 3, name: "Police Recruitment Drive", startTime: "Now", endTime: "5 days", participants: 15 },
  ];

  const updateTypeColors = {
    update: "bg-gradient-to-r from-primary/80 to-primary",
    event: "bg-gradient-to-r from-secondary/80 to-secondary",
    maintenance: "bg-gradient-to-r from-accent/80 to-accent",
  };

  const updateTypeIcons = {
    update: Sparkles,
    event: Radio,
    maintenance: Shield,
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

          {/* Live Status Hero Banner */}
          <div className="mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl animate-pulse" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl glass-effect border-2 border-primary/40 bg-gradient-to-br from-background/90 via-background/95 to-background/90 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                    <Server className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-pulse border-4 border-background" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-ping" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    All Systems Operational
                  </h2>
                  <p className="text-muted-foreground mt-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: Just now • Monitoring in real-time</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Badge variant="outline" className="px-4 py-2 text-sm bg-green-500/10 text-green-500 border-green-500/30">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Online
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/30">
                  99.9% Uptime
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Stats Grid - All Cards Equal Compact Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Players Online Card */}
            <Card className="relative overflow-hidden glass-effect border-2 border-primary/30 hover:border-primary/60 transition-all duration-500 group animate-fade-in hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-medium text-muted-foreground">Players Online</CardTitle>
                <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-2">
                  {stats.playersOnline}/{stats.maxPlayers}
                </div>
                <p className="text-xs text-muted-foreground mb-3">Active players</p>
                <div className="relative mb-2">
                  <Progress 
                    value={(stats.playersOnline / stats.maxPlayers) * 100} 
                    className="h-2 bg-primary/20"
                  />
                  <div className="absolute inset-0 h-2 bg-gradient-to-r from-primary/40 to-secondary/40 blur-sm" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{Math.round((stats.playersOnline / stats.maxPlayers) * 100)}%</span>
                  <span className="text-green-500 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Server Uptime - Compact */}
            <Card className="relative overflow-hidden glass-effect border-2 border-secondary/30 hover:border-secondary/60 transition-all duration-500 group animate-fade-in animation-delay-100 hover:shadow-2xl hover:shadow-secondary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-medium text-muted-foreground">Server Uptime</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                  <Clock className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-secondary mb-2">{stats.uptime}</div>
                <p className="text-xs text-green-500 font-semibold flex items-center gap-1 mb-3">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  99.9% Uptime
                </p>
                <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <p className="text-xs text-muted-foreground">Zero Downtime</p>
                </div>
              </CardContent>
            </Card>

            {/* Server Load - Compact */}
            <Card className="relative overflow-hidden glass-effect border-2 border-accent/30 hover:border-accent/60 transition-all duration-500 group animate-fade-in animation-delay-200 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-medium text-muted-foreground">Server Load</CardTitle>
                <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                  <Activity className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">CPU</span>
                      <span className="text-xl font-bold text-accent">{stats.cpu}%</span>
                    </div>
                    <Progress value={stats.cpu} className="h-1.5 bg-accent/20" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">RAM</span>
                      <span className="text-xl font-bold text-accent">{stats.memory}%</span>
                    </div>
                    <Progress value={stats.memory} className="h-1.5 bg-accent/20" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Latency - Compact */}
            <Card className="relative overflow-hidden glass-effect border-2 border-primary/30 hover:border-primary/60 transition-all duration-500 group animate-fade-in animation-delay-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-medium text-muted-foreground">Network Latency</CardTitle>
                <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Zap className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {stats.ping}ms
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-4 bg-green-500 rounded-full animate-pulse" />
                    <div className="w-0.5 h-4 bg-green-500 rounded-full animate-pulse animation-delay-100" />
                    <div className="w-0.5 h-4 bg-green-500 rounded-full animate-pulse animation-delay-200" />
                  </div>
                  <p className="text-xs text-green-500 font-semibold">Excellent</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-1.5">
                    <Network className="w-3 h-3 text-primary" />
                    <p className="text-[10px] text-muted-foreground">Stable</p>
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
                  <Badge variant="outline" className="text-xs">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentUpdates.map((update, index) => {
                    const Icon = updateTypeIcons[update.type];
                    return (
                      <div 
                        key={update.id}
                        className="relative flex items-start gap-4 p-4 rounded-xl glass-effect border-2 border-border/10 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-xl ${updateTypeColors[update.type]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
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
                  })}
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
                  {activeEvents.map((event, index) => (
                    <div 
                      key={event.id}
                      className="relative p-5 rounded-xl glass-effect border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-secondary/10 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-lg text-foreground">{event.name}</h4>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.participants}
                        </Badge>
                      </div>
                      <Separator className="my-3 bg-border/30" />
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-secondary" />
                          <span className="font-medium">Starts: <span className="text-foreground">{event.startTime}</span></span>
                        </div>
                        <div className="text-muted-foreground">
                          Duration: <span className="text-foreground font-medium">{event.endTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <div className="p-6 rounded-xl glass-effect border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Server className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm text-primary">Connect IP Address</h4>
                  </div>
                  <p className="text-base font-mono font-semibold bg-background/80 p-4 rounded-lg border-2 border-primary/20 text-foreground hover:bg-primary/5 transition-colors">
                    connect.skylifeindia.com:30120
                  </p>
                </div>
                <div className="p-6 rounded-xl glass-effect border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-secondary/20">
                      <Network className="w-5 h-5 text-secondary" />
                    </div>
                    <h4 className="font-bold text-sm text-secondary">Discord Community</h4>
                  </div>
                  <p className="text-base font-mono font-semibold bg-background/80 p-4 rounded-lg border-2 border-secondary/20 text-foreground hover:bg-secondary/5 transition-colors">
                    discord.gg/skylifeindia
                  </p>
                </div>
                <div className="p-6 rounded-xl glass-effect border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <h4 className="font-bold text-sm text-accent">Server Version</h4>
                  </div>
                  <p className="text-base font-mono font-semibold bg-background/80 p-4 rounded-lg border-2 border-accent/20 text-foreground hover:bg-accent/5 transition-colors">
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