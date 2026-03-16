import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStaffAccess } from "@/hooks/useStaffAccess";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Clock, LogIn, LogOut, Timer, Calendar, Activity, Users, TrendingUp } from "lucide-react";
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

    // Fetch current open session
    const { data: openSession } = await supabase
      .from("staff_time_clock")
      .select("*")
      .eq("staff_member_id", staffMemberId)
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    setCurrentSession(openSession);

    // Fetch today's records
    const { data: todayData } = await supabase
      .from("staff_time_clock")
      .select("*")
      .eq("staff_member_id", staffMemberId)
      .eq("session_date", today)
      .order("clock_in_at", { ascending: false });
    
    setTodayRecords(todayData || []);

    // Fetch this week's records (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: weekData } = await supabase
      .from("staff_time_clock")
      .select("*")
      .eq("staff_member_id", staffMemberId)
      .gte("session_date", weekAgo.toISOString().split("T")[0])
      .order("clock_in_at", { ascending: false });
    
    setWeekRecords(weekData || []);

    // Fetch today's overview (owner/admin)
    if (isOwner) {
      // Count unique staff clocked in today
      const { data: todayAll } = await supabase
        .from("staff_time_clock")
        .select("staff_member_id, clock_in_at, clock_out_at, total_seconds")
        .eq("session_date", today);

      if (todayAll) {
        const uniqueStaff = new Set(todayAll.map(r => r.staff_member_id));
        setTotalClockedInToday(uniqueStaff.size);
        const activeNow = todayAll.filter(r => !r.clock_out_at);
        setTotalActiveStaff(activeNow.length);
      }

      // Fetch recent activity from all staff
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
    // Realtime subscription
    const channel = supabase
      .channel("time-clock-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_time_clock" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Redirect non-staff
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Time Clock Card */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border/30">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Clock className="w-6 h-6 text-primary" />
                  My Time Clock
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Welcome & Live Time */}
                <div className="text-center space-y-2">
                  <p className="text-lg text-muted-foreground">
                    Welcome, <span className="font-bold text-foreground">{discordUsername || "Staff"}</span>!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(now, "EEEE, MMMM d, yyyy")} | {format(now, "hh:mm:ss a")} (live)
                  </p>
                </div>

                {/* Clock In / Clock Out Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    disabled={isClockedIn || clockLoading}
                    onClick={handleClockIn}
                    className="flex-1 max-w-xs h-20 text-xl font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 rounded-full shadow-lg"
                  >
                    <LogIn className="w-6 h-6 mr-3" />
                    CLOCK IN
                  </Button>
                  <Button
                    size="lg"
                    disabled={!isClockedIn || clockLoading}
                    onClick={handleClockOut}
                    className="flex-1 max-w-xs h-20 text-xl font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 rounded-full shadow-lg"
                  >
                    <LogOut className="w-6 h-6 mr-3" />
                    CLOCK OUT
                  </Button>
                </div>

                {/* Status Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Status</p>
                    <Badge variant={isClockedIn ? "default" : "secondary"} className={`mt-1 ${isClockedIn ? "bg-green-600" : ""}`}>
                      {isClockedIn ? "CLOCKED IN" : "NOT CLOCKED IN"}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Session</p>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {isClockedIn ? formatDuration(liveElapsed) : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Timezone</p>
                    <p className="text-sm font-medium text-foreground mt-1">{timezone}</p>
                  </div>
                </div>

                {/* Daily Total */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Daily Activity: Today ({format(now, "MMM d")})
                  </p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatDuration(todayTotalSeconds)}
                  </p>
                </div>

                {/* Today's Sessions Log */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Timer className="w-4 h-4" /> Today's Sessions
                  </h3>
                  {todayRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No sessions today yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {todayRecords.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${r.clock_out_at ? "bg-muted-foreground" : "bg-green-500 animate-pulse"}`} />
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
                </div>

                {/* Weekly Summary */}
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Weekly Total (Last 7 Days)
                  </h3>
                  <p className="text-xl font-bold text-accent-foreground">
                    {formatDuration(weekTotalSeconds)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {weekRecords.filter(r => r.clock_out_at).length} completed sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Overview (visible to all staff, extra data for owner) */}
          <div className="space-y-6">
            {/* Attendance Overview */}
            {isOwner && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Today's Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalClockedInToday}</p>
                      <p className="text-xs text-muted-foreground">Staff Clocked In Today</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Activity className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalActiveStaff}</p>
                      <p className="text-xs text-muted-foreground">Currently Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Feed */}
            {isOwner && recentActivity.length > 0 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-80">
                    <div className="space-y-3">
                      {recentActivity.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20">
                          {a.discord_avatar ? (
                            <img src={a.discord_avatar} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {a.staff_name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{a.staff_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.clock_out_at
                                ? `Clocked Out | ${format(new Date(a.clock_out_at), "hh:mm a")} | ${formatDuration(a.total_seconds)}`
                                : `Clocked In | ${format(new Date(a.clock_in_at), "hh:mm a")}`}
                            </p>
                          </div>
                          <div className={`w-2 h-2 rounded-full mt-2 ${a.clock_out_at ? "bg-muted-foreground" : "bg-green-500 animate-pulse"}`} />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* My Stats Card */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">My Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="text-sm font-bold text-foreground">{formatDuration(todayTotalSeconds)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="text-sm font-bold text-foreground">{formatDuration(weekTotalSeconds)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sessions Today</span>
                  <span className="text-sm font-bold text-foreground">{todayRecords.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sessions This Week</span>
                  <span className="text-sm font-bold text-foreground">{weekRecords.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffTimeClock;
