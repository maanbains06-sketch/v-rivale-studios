import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerStatus from "@/assets/header-status.jpg";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Clock, Zap, TrendingUp, AlertCircle, Server, Wifi, Network, Sparkles, Radio, Shield, Database, HardDrive, Cpu, Signal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface ServerStats {
  playersOnline: number;
  maxPlayers: number;
  uptime: string;
  cpu: number;
  memory: number;
  ping: number;
  disk: number;
  bandwidth: number;
  tps: number;
  healthScore: number;
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
    playersOnline: 87,
    maxPlayers: 128,
    uptime: "7d 14h 32m",
    cpu: 45,
    memory: 62,
    ping: 32,
    disk: 48,
    bandwidth: 75,
    tps: 19.8,
    healthScore: 98,
  });

  const [cpuHistory, setCpuHistory] = useState<number[]>([45, 42, 48, 43, 47, 45, 44, 46, 45, 43]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([62, 61, 63, 62, 64, 62, 61, 63, 62, 63]);

  // Simulate smooth real-time updates
  useEffect(() => {
    const updateStats = () => {
      setStats((prev) => {
        const newCpu = Math.max(35, Math.min(75, prev.cpu + (Math.random() - 0.5) * 6));
        const newMemory = Math.max(55, Math.min(80, prev.memory + (Math.random() - 0.5) * 4));
        const newPing = Math.max(25, Math.min(50, prev.ping + (Math.random() - 0.5) * 8));
        const newPlayers = Math.max(45, Math.min(128, prev.playersOnline + Math.floor((Math.random() - 0.5) * 5)));
        const newTps = Math.max(18.5, Math.min(20, prev.tps + (Math.random() - 0.5) * 0.2));
        const newBandwidth = Math.max(60, Math.min(90, prev.bandwidth + (Math.random() - 0.5) * 10));
        
        // Calculate health score based on metrics
        const healthScore = Math.round(
          ((100 - newCpu) * 0.3) +
          ((100 - newMemory) * 0.2) +
          ((100 - newPing) * 0.2) +
          (newTps / 20 * 100 * 0.15) +
          ((100 - newBandwidth) * 0.15)
        );

        return {
          ...prev,
          cpu: Math.round(newCpu),
          memory: Math.round(newMemory),
          ping: Math.round(newPing),
          playersOnline: newPlayers,
          tps: Number(newTps.toFixed(1)),
          bandwidth: Math.round(newBandwidth),
          healthScore: Math.max(85, Math.min(100, healthScore)),
        };
      });

      // Update history for charts
      setCpuHistory((prev) => [...prev.slice(1), stats.cpu]);
      setMemoryHistory((prev) => [...prev.slice(1), stats.memory]);
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, [stats.cpu, stats.memory]);

  const getHealthColor = (score: number) => {
    if (score >= 95) return { bg: "bg-green-500", text: "text-green-500", status: "Excellent" };
    if (score >= 85) return { bg: "bg-blue-500", text: "text-blue-500", status: "Good" };
    if (score >= 70) return { bg: "bg-yellow-500", text: "text-yellow-500", status: "Fair" };
    return { bg: "bg-red-500", text: "text-red-500", status: "Poor" };
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value < threshold) return "text-green-500";
    if (value < threshold * 1.2) return "text-yellow-500";
    return "text-red-500";
  };

  const healthStatus = getHealthColor(stats.healthScore);

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

          {/* Live Status Hero Banner with Health Score */}
          <div className="mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl animate-pulse" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl glass-effect border-2 border-primary/40 bg-gradient-to-br from-background/90 via-background/95 to-background/90 animate-fade-in">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className={`w-24 h-24 ${healthStatus.bg} bg-opacity-20 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden`}>
                    <div className={`absolute inset-0 ${healthStatus.bg} opacity-20 animate-pulse`} />
                    <div className="relative z-10 text-center">
                      <div className={`text-3xl font-bold ${healthStatus.text}`}>{stats.healthScore}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold">SCORE</div>
                    </div>
                  </div>
                  <div className={`absolute -top-1 -right-1 w-6 h-6 ${healthStatus.bg} rounded-full animate-pulse border-4 border-background`} />
                  <div className={`absolute -top-1 -right-1 w-6 h-6 ${healthStatus.bg} rounded-full animate-ping`} />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    All Systems Operational
                  </h2>
                  <p className={`text-lg font-semibold ${healthStatus.text} mt-1`}>
                    System Health: {healthStatus.status}
                  </p>
                  <p className="text-muted-foreground text-sm mt-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: Just now • Monitoring in real-time</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Badge variant="outline" className="px-4 py-2 text-sm bg-green-500/10 text-green-500 border-green-500/30 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/30">
                  99.9% Uptime
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm bg-secondary/10 text-secondary border-secondary/30 flex items-center gap-1">
                  <Signal className="w-3 h-3" />
                  {stats.tps} TPS
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Stats Grid with Enhanced Visuals and Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Players Online Card */}
            <Card className="relative overflow-hidden glass-effect border-2 border-primary/30 hover:border-primary/60 transition-all duration-500 group animate-fade-in hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">Players Online</CardTitle>
                <div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Users className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-2">
                  {stats.playersOnline}
                </div>
                <p className="text-sm text-muted-foreground mb-4">of {stats.maxPlayers} maximum capacity</p>
                <div className="relative mb-2">
                  <Progress 
                    value={(stats.playersOnline / stats.maxPlayers) * 100} 
                    className="h-3 bg-primary/20"
                  />
                  <div className="absolute inset-0 h-3 bg-gradient-to-r from-primary/40 to-secondary/40 blur-sm" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{Math.round((stats.playersOnline / stats.maxPlayers) * 100)}% Full</span>
                  <span className="text-green-500 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* CPU Usage with Chart */}
            <Card className="relative overflow-hidden glass-effect border-2 border-secondary/30 hover:border-secondary/60 transition-all duration-500 group animate-fade-in animation-delay-100 hover:shadow-2xl hover:shadow-secondary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">CPU Usage</CardTitle>
                <div className="p-3 rounded-xl bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                  <Cpu className="h-6 w-6 text-secondary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={`text-5xl font-bold mb-2 ${getStatusColor(stats.cpu, 70)}`}>
                  {stats.cpu}%
                </div>
                <p className="text-sm text-muted-foreground mb-4">Average load across all cores</p>
                <div className="relative mb-2">
                  <Progress 
                    value={stats.cpu} 
                    className="h-3 bg-secondary/20"
                  />
                </div>
                {/* Mini CPU Chart */}
                <div className="flex items-end gap-1 h-12 mt-4">
                  {cpuHistory.map((value, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-secondary to-secondary/50 rounded-t transition-all duration-300"
                      style={{ height: `${(value / 100) * 100}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage with Chart */}
            <Card className="relative overflow-hidden glass-effect border-2 border-accent/30 hover:border-accent/60 transition-all duration-500 group animate-fade-in animation-delay-200 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">Memory Usage</CardTitle>
                <div className="p-3 rounded-xl bg-accent/20 group-hover:bg-accent/30 transition-colors">
                  <Database className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={`text-5xl font-bold mb-2 ${getStatusColor(stats.memory, 80)}`}>
                  {stats.memory}%
                </div>
                <p className="text-sm text-muted-foreground mb-4">16GB DDR4 RAM utilized</p>
                <div className="relative mb-2">
                  <Progress 
                    value={stats.memory} 
                    className="h-3 bg-accent/20"
                  />
                </div>
                {/* Mini Memory Chart */}
                <div className="flex items-end gap-1 h-12 mt-4">
                  {memoryHistory.map((value, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-accent to-accent/50 rounded-t transition-all duration-300"
                      style={{ height: `${(value / 100) * 100}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Network Latency */}
            <Card className="relative overflow-hidden glass-effect border-2 border-primary/30 hover:border-primary/60 transition-all duration-500 group animate-fade-in animation-delay-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">Network Latency</CardTitle>
                <div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Zap className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  {stats.ping}ms
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1">
                    <div className={`w-1 h-6 ${stats.ping < 50 ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`} />
                    <div className={`w-1 h-6 ${stats.ping < 50 ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse animation-delay-100`} />
                    <div className={`w-1 h-6 ${stats.ping < 50 ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse animation-delay-200`} />
                  </div>
                  <p className={`text-xs font-semibold ${stats.ping < 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {stats.ping < 50 ? 'Excellent' : 'Good'} Connection
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground">Network Stable & Optimized</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disk Usage */}
            <Card className="relative overflow-hidden glass-effect border-2 border-secondary/30 hover:border-secondary/60 transition-all duration-500 group animate-fade-in animation-delay-100 hover:shadow-2xl hover:shadow-secondary/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">Disk Usage</CardTitle>
                <div className="p-3 rounded-xl bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                  <HardDrive className="h-6 w-6 text-secondary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-5xl font-bold text-secondary mb-2">{stats.disk}%</div>
                <p className="text-sm text-muted-foreground mb-4">240GB / 500GB SSD</p>
                <div className="relative mb-2">
                  <Progress 
                    value={stats.disk} 
                    className="h-3 bg-secondary/20"
                  />
                </div>
                <div className="mt-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Free Space</span>
                    <span className="text-secondary font-semibold">260GB Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Uptime */}
            <Card className="relative overflow-hidden glass-effect border-2 border-accent/30 hover:border-accent/60 transition-all duration-500 group animate-fade-in animation-delay-200 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">Server Uptime</CardTitle>
                <div className="p-3 rounded-xl bg-accent/20 group-hover:bg-accent/30 transition-colors">
                  <Clock className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-accent mb-2">{stats.uptime}</div>
                <p className="text-sm text-green-500 font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  99.9% Reliability Record
                </p>
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">This Month</span>
                      <span className="text-accent font-semibold">Zero Downtime</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Last Restart</span>
                      <span className="text-accent font-semibold">7 days ago</span>
                    </div>
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