import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Clock, LogIn, LogOut, Timer, Calendar, Activity, Users, TrendingUp, BarChart3, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";

interface TimeClockRecord {
  id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  total_seconds: number;
  session_date: string;
  notes: string | null;
}

interface StaffClockSummary {
  staff_member_id: string;
  staff_name: string;
  discord_avatar: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  total_seconds: number;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
};

const formatDurationShort = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const StaffTimeClock = () => {
  const { isStaff, isOwner, loading: accessLoading, userId, discordUsername, discordAvatar } = useStaffAccess();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentSession, setCurrentSession] = useState<TimeClockRecord | null>(null);
  const [todayRecords, setTodayRecords] = useState<TimeClockRecord[]>([]);
  const [weekRecords, setWeekRecords] = useState<TimeClockRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState<StaffClockSummary[]>([]);
  const [staffMemberId, setStaffMemberId] = useState<string | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [clockLoading, setClockLoading] = useState(false);
  const [totalClockedInToday, setTotalClockedInToday] = useState(0);
  const [totalActiveStaff, setTotalActiveStaff] = useState(0);
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Live elapsed for active session
  useEffect(() => {
    if (!currentSession || currentSession.clock_out_at) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(currentSession.clock_in_at).getTime()) / 1000);
      setLiveElapsed(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  // Get staff member ID
  useEffect(() => {
    if (!userId) return;
    const fetchStaffId = async () => {
      const { data } = await supabase
        .from("staff_members")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      if (data) setStaffMemberId(data.id);
    };
    fetchStaffId();
  }, [userId]);

  const fetchData = useCallback(async () => {
    if (!userId || !staffMemberId) return;
    const today = new Date().toISOString().split("T")[0];

    const { data: openSession } = await supabase
      .from("staff_time_clock")
      .select("*")
      .eq("staff_member_id", staffMemberId)
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setCurrentSession(openSession);

    const { data: todayData } = await supabase
      .from("staff_time_clock")
      .select("*")
      .eq("staff_member_id", staffMemberId)
      .eq("session_date", today)
      .order("clock_in_at", { ascending: false });

    setTodayRecords(todayData || []);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: weekData } = await supabase
      .from("staff_time_clock")
      .select("*")
      .eq("staff_member_id", staffMemberId)
      .gte("session_date", weekAgo.toISOString().split("T")[0])
      .order("clock_in_at", { ascending: false });

    setWeekRecords(weekData || []);

    if (isOwner) {
      const { data: todayAll } = await supabase
        .from("staff_time_clock")
        .select("staff_member_id, clock_in_at, clock_out_at, total_seconds")
        .eq("session_date", today);

      if (todayAll) {
        const uniqueStaff = new Set(todayAll.map(r => r.staff_member_id));
        setTotalClockedInToday(uniqueStaff.size);
        setTotalActiveStaff(todayAll.filter(r => !r.clock_out_at).length);
      }

      const { data: recentData } = await supabase
        .from("staff_time_clock")
        .select("id, staff_member_id, clock_in_at, clock_out_at, total_seconds")
        .eq("session_date", today)
        .order("clock_in_at", { ascending: false })
        .limit(20);

      if (recentData && recentData.length > 0) {
        const staffIds = [...new Set(recentData.map(r => r.staff_member_id))];
        const { data: staffInfo } = await supabase
          .from("staff_members")
          .select("id, name, discord_avatar")
          .in("id", staffIds);

        const staffMap: Record<string, { name: string; discord_avatar: string | null }> = {};
        (staffInfo || []).forEach(s => { staffMap[s.id] = s; });

        setRecentActivity(recentData.map(r => ({
          staff_member_id: r.staff_member_id,
          staff_name: staffMap[r.staff_member_id]?.name || "Unknown",
          discord_avatar: staffMap[r.staff_member_id]?.discord_avatar || null,
          clock_in_at: r.clock_in_at,
          clock_out_at: r.clock_out_at,
          total_seconds: r.total_seconds || 0,
        })));
      }
    }
  }, [userId, staffMemberId, isOwner]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("time-clock-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_time_clock" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => {
    if (!accessLoading && !isStaff && !isOwner) {
      navigate("/");
    }
  }, [accessLoading, isStaff, isOwner, navigate]);

  const handleClockIn = async () => {
    if (!staffMemberId || !userId) return;
    setClockLoading(true);
    try {
      const { error } = await supabase.from("staff_time_clock").insert({
        staff_member_id: staffMemberId,
        user_id: userId,
        clock_in_at: new Date().toISOString(),
        session_date: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
      toast({ title: "✅ Clocked In!", description: "Your shift has started." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentSession) return;
    setClockLoading(true);
    try {
      const clockOutTime = new Date();
      const totalSecs = Math.floor((clockOutTime.getTime() - new Date(currentSession.clock_in_at).getTime()) / 1000);
      const { error } = await supabase
        .from("staff_time_clock")
        .update({
          clock_out_at: clockOutTime.toISOString(),
          total_seconds: totalSecs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSession.id);
      if (error) throw error;
      toast({ title: "🔴 Clocked Out!", description: `Session: ${formatDuration(totalSecs)}` });
      setCurrentSession(null);
      setLiveElapsed(0);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setClockLoading(false);
    }
  };

  const todayTotalSeconds = todayRecords.reduce((acc, r) => {
    if (r.clock_out_at) return acc + (r.total_seconds || 0);
    return acc + Math.floor((Date.now() - new Date(r.clock_in_at).getTime()) / 1000);
  }, 0);

  const weekTotalSeconds = weekRecords.reduce((acc, r) => acc + (r.total_seconds || 0), 0);
  const isClockedIn = !!currentSession && !currentSession.clock_out_at;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Group week records by date for reports
  const weekByDate = weekRecords.reduce((acc, r) => {
    if (!acc[r.session_date]) acc[r.session_date] = { totalSeconds: 0, sessions: 0 };
    acc[r.session_date].totalSeconds += r.total_seconds || 0;
    acc[r.session_date].sessions++;
    return acc;
  }, {} as Record<string, { totalSeconds: number; sessions: number }>);

  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        {/* Hero Header with 3D effect */}
        <div className="relative mb-8 rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1), hsl(var(--card)))",
          boxShadow: "0 20px 60px -15px hsl(var(--primary) / 0.3), 0 0 0 1px hsl(var(--border) / 0.5), inset 0 1px 0 hsl(var(--primary) / 0.1)",
          transform: "perspective(1000px) rotateX(1deg)",
        }}>
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--primary)), transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--accent)), transparent 50%)",
          }} />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative" style={{
                filter: "drop-shadow(0 8px 24px hsl(var(--primary) / 0.4))",
              }}>
                {discordAvatar ? (
                  <img src={discordAvatar} alt="" className="w-20 h-20 rounded-2xl ring-2 ring-primary/50" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary ring-2 ring-primary/50">
                    {(discordUsername || "S").charAt(0)}
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card ${isClockedIn ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
              </div>

              {/* Welcome Info */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Welcome, <span className="text-primary">{discordUsername || "Staff"}</span>!
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(now, "EEEE, MMMM d, yyyy")} | <span className="text-primary font-mono">{format(now, "hh:mm:ss a")}</span> (live)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timezone}</p>
              </div>

              {/* Clock In/Out Buttons */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  disabled={isClockedIn || clockLoading}
                  onClick={handleClockIn}
                  className="h-16 px-8 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-30"
                  style={{
                    background: isClockedIn ? undefined : "linear-gradient(135deg, hsl(142 71% 45%), hsl(142 71% 35%))",
                    boxShadow: isClockedIn ? undefined : "0 8px 32px hsl(142 71% 45% / 0.4), inset 0 1px 0 hsl(142 71% 65% / 0.3)",
                    transform: "perspective(500px) translateZ(0)",
                  }}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  CLOCK IN
                </Button>
                <Button
                  size="lg"
                  disabled={!isClockedIn || clockLoading}
                  onClick={handleClockOut}
                  className="h-16 px-8 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-30"
                  style={{
                    background: !isClockedIn ? undefined : "linear-gradient(135deg, hsl(0 72% 51%), hsl(0 72% 40%))",
                    boxShadow: !isClockedIn ? undefined : "0 8px 32px hsl(0 72% 51% / 0.4), inset 0 1px 0 hsl(0 72% 70% / 0.3)",
                    transform: "perspective(500px) translateZ(0)",
                  }}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  CLOCK OUT
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="relative rounded-xl overflow-hidden" style={{
            boxShadow: "0 4px 20px hsl(var(--primary) / 0.1)",
          }}>
            <TabsList className="w-full grid grid-cols-3 md:grid-cols-5 gap-1 p-1 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl h-auto">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Attendance</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value="staff-overview" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Staff</span>
                </TabsTrigger>
              )}
              {isOwner && (
                <TabsTrigger value="activity" className="flex items-center gap-2 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="relative overflow-hidden border-border/50" style={{
                background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--card) / 0.8))",
                boxShadow: "0 8px 32px hsl(var(--primary) / 0.1), inset 0 1px 0 hsl(var(--border) / 0.5)",
                transform: "perspective(800px) rotateY(-1deg)",
              }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge className={`mt-2 text-sm ${isClockedIn ? "bg-green-600/90" : "bg-muted"}`}>
                    {isClockedIn ? "⚡ CLOCKED IN" : "NOT CLOCKED IN"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-border/50" style={{
                background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--card) / 0.8))",
                boxShadow: "0 8px 32px hsl(var(--accent) / 0.1), inset 0 1px 0 hsl(var(--border) / 0.5)",
                transform: "perspective(800px) rotateY(1deg)",
              }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-primary" />
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Session</p>
                  <p className="text-2xl font-bold text-primary mt-2 font-mono">
                    {isClockedIn ? formatDuration(liveElapsed) : "—"}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-border/50" style={{
                background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--card) / 0.8))",
                boxShadow: "0 8px 32px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(var(--border) / 0.5)",
                transform: "perspective(800px) rotateY(-0.5deg)",
              }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-accent/50" />
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Today Total</p>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {formatDuration(todayTotalSeconds)}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-border/50" style={{
                background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--card) / 0.8))",
                boxShadow: "0 8px 32px hsl(var(--accent) / 0.08), inset 0 1px 0 hsl(var(--border) / 0.5)",
                transform: "perspective(800px) rotateY(0.5deg)",
              }}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent/50 to-primary/50" />
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Weekly Total</p>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {formatDurationShort(weekTotalSeconds)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 backdrop-blur-sm" style={{
                boxShadow: "0 8px 32px hsl(var(--primary) / 0.05)",
              }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" /> Today's Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No sessions today yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {todayRecords.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/20 hover:bg-secondary/40 transition-all">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${r.clock_out_at ? "bg-muted-foreground" : "bg-green-500 animate-pulse"}`} />
                            <span className="text-sm text-foreground">
                              {format(new Date(r.clock_in_at), "hh:mm a")}
                              {r.clock_out_at ? ` → ${format(new Date(r.clock_out_at), "hh:mm a")}` : " → Active"}
                            </span>
                          </div>
                          <span className="text-sm font-mono text-muted-foreground">
                            {r.clock_out_at ? formatDuration(r.total_seconds) : "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 backdrop-blur-sm" style={{
                boxShadow: "0 8px 32px hsl(var(--accent) / 0.05)",
              }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">My Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border/20">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <span className="text-sm font-bold text-foreground font-mono">{formatDuration(todayTotalSeconds)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border/20">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <span className="text-sm font-bold text-foreground font-mono">{formatDurationShort(weekTotalSeconds)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border/20">
                    <span className="text-sm text-muted-foreground">Sessions Today</span>
                    <span className="text-sm font-bold text-foreground">{todayRecords.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border/20">
                    <span className="text-sm text-muted-foreground">Sessions This Week</span>
                    <span className="text-sm font-bold text-foreground">{weekRecords.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card className="border-border/50" style={{
              boxShadow: "0 12px 40px hsl(var(--primary) / 0.08)",
            }}>
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/30 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="w-5 h-5 text-primary" />
                  Daily Activity: {format(now, "MMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Big total display */}
                <div className="text-center py-8 rounded-xl mb-6" style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.05))",
                  boxShadow: "inset 0 2px 4px hsl(var(--primary) / 0.1), 0 4px 16px hsl(var(--primary) / 0.05)",
                }}>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Hours Today</p>
                  <p className="text-5xl font-bold text-primary font-mono">{formatDuration(todayTotalSeconds)}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Session Log</h3>
                  {todayRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No sessions recorded today.</p>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-2">
                        {todayRecords.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-border/20 bg-card hover:bg-secondary/20 transition-all" style={{
                            boxShadow: "0 2px 8px hsl(var(--primary) / 0.03)",
                          }}>
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${r.clock_out_at ? "bg-muted-foreground" : "bg-green-500 animate-pulse"}`} style={{
                                boxShadow: r.clock_out_at ? undefined : "0 0 12px hsl(142 71% 45% / 0.5)",
                              }} />
                              <div>
                                <span className="text-sm font-medium text-foreground">
                                  {format(new Date(r.clock_in_at), "hh:mm a")}
                                  {r.clock_out_at ? ` → ${format(new Date(r.clock_out_at), "hh:mm a")}` : " → Active"}
                                </span>
                              </div>
                            </div>
                            <Badge variant={r.clock_out_at ? "secondary" : "default"} className={!r.clock_out_at ? "bg-green-600/90" : ""}>
                              {r.clock_out_at ? formatDuration(r.total_seconds) : "Active"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-border/50" style={{
              boxShadow: "0 12px 40px hsl(var(--primary) / 0.08)",
            }}>
              <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 border-b border-border/30 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Report (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Weekly total */}
                <div className="text-center py-6 rounded-xl" style={{
                  background: "linear-gradient(135deg, hsl(var(--accent) / 0.1), hsl(var(--primary) / 0.05))",
                  boxShadow: "inset 0 2px 4px hsl(var(--accent) / 0.1)",
                }}>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Hours This Week</p>
                  <p className="text-4xl font-bold text-primary font-mono">{formatDurationShort(weekTotalSeconds)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {weekRecords.filter(r => r.clock_out_at).length} completed sessions
                  </p>
                </div>

                {/* Daily breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Daily Breakdown</h3>
                  {Object.entries(weekByDate)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([date, data]) => (
                      <div key={date} className="flex items-center justify-between p-4 rounded-xl border border-border/20 bg-card hover:bg-secondary/20 transition-all">
                        <div>
                          <p className="text-sm font-medium text-foreground">{format(new Date(date + "T12:00:00"), "EEEE, MMM d")}</p>
                          <p className="text-xs text-muted-foreground">{data.sessions} session{data.sessions > 1 ? "s" : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary font-mono">{formatDurationShort(data.totalSeconds)}</p>
                          {/* Visual bar */}
                          <div className="w-24 h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                              style={{ width: `${Math.min(100, (data.totalSeconds / 28800) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  {Object.keys(weekByDate).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No records this week.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Overview Tab (Owner Only) */}
          {isOwner && (
            <TabsContent value="staff-overview" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-primary/30" style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--card)))",
                  boxShadow: "0 8px 32px hsl(var(--primary) / 0.15)",
                  transform: "perspective(600px) rotateY(-1deg)",
                }}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <TrendingUp className="w-10 h-10 text-primary" />
                    <div>
                      <p className="text-3xl font-bold text-foreground">{totalClockedInToday}</p>
                      <p className="text-sm text-muted-foreground">Staff Clocked In Today</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-green-500/30" style={{
                  background: "linear-gradient(135deg, hsl(142 71% 45% / 0.1), hsl(var(--card)))",
                  boxShadow: "0 8px 32px hsl(142 71% 45% / 0.15)",
                  transform: "perspective(600px) rotateY(1deg)",
                }}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <Activity className="w-10 h-10 text-green-500" />
                    <div>
                      <p className="text-3xl font-bold text-foreground">{totalActiveStaff}</p>
                      <p className="text-sm text-muted-foreground">Currently Active</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Activity Feed Tab (Owner Only) */}
          {isOwner && (
            <TabsContent value="activity" className="space-y-6">
              <Card className="border-border/50" style={{
                boxShadow: "0 12px 40px hsl(var(--primary) / 0.08)",
              }}>
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-lg">Recent Staff Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity recorded today.</p>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-3">
                        {recentActivity.map((a, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/20 border border-border/20 hover:bg-secondary/30 transition-all" style={{
                            boxShadow: "0 2px 8px hsl(var(--primary) / 0.03)",
                          }}>
                            {a.discord_avatar ? (
                              <img src={a.discord_avatar} alt="" className="w-10 h-10 rounded-xl ring-2 ring-primary/20" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold ring-2 ring-primary/20">
                                {a.staff_name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{a.staff_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {a.clock_out_at
                                  ? `Clocked Out | ${format(new Date(a.clock_out_at), "hh:mm a")} | ${formatDurationShort(a.total_seconds)}`
                                  : `Clocked In | ${format(new Date(a.clock_in_at), "hh:mm a")}`}
                              </p>
                            </div>
                            <Badge variant={a.clock_out_at ? "secondary" : "default"} className={!a.clock_out_at ? "bg-green-600/90" : ""}>
                              {a.clock_out_at ? "Done" : "Active"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default StaffTimeClock;
