import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Users, Search, CalendarDays, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";

interface StaffClockRecord {
  id: string;
  staff_member_id: string;
  staff_name: string;
  discord_avatar: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  total_seconds: number;
  session_date: string;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const OwnerTimeClockManager = () => {
  const [records, setRecords] = useState<StaffClockRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [staffSummary, setStaffSummary] = useState<Record<string, { name: string; avatar: string | null; totalSeconds: number; sessions: number }>>({});
  const [activeCount, setActiveCount] = useState(0);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data: clockData } = await supabase
      .from("staff_time_clock")
      .select("id, staff_member_id, clock_in_at, clock_out_at, total_seconds, session_date")
      .eq("session_date", dateStr)
      .order("clock_in_at", { ascending: false });

    if (!clockData || clockData.length === 0) {
      setRecords([]);
      setStaffSummary({});
      setActiveCount(0);
      setLoading(false);
      return;
    }

    const staffIds = [...new Set(clockData.map(r => r.staff_member_id))];
    const { data: staffInfo } = await supabase
      .from("staff_members")
      .select("id, name, discord_avatar")
      .in("id", staffIds);

    const staffMap: Record<string, { name: string; discord_avatar: string | null }> = {};
    (staffInfo || []).forEach(s => { staffMap[s.id] = s; });

    const enriched: StaffClockRecord[] = clockData.map(r => ({
      ...r,
      total_seconds: r.total_seconds || 0,
      staff_name: staffMap[r.staff_member_id]?.name || "Unknown",
      discord_avatar: staffMap[r.staff_member_id]?.discord_avatar || null,
    }));

    setRecords(enriched);

    // Build summary
    const summary: Record<string, { name: string; avatar: string | null; totalSeconds: number; sessions: number }> = {};
    let active = 0;
    enriched.forEach(r => {
      if (!summary[r.staff_member_id]) {
        summary[r.staff_member_id] = { name: r.staff_name, avatar: r.discord_avatar, totalSeconds: 0, sessions: 0 };
      }
      summary[r.staff_member_id].sessions++;
      if (r.clock_out_at) {
        summary[r.staff_member_id].totalSeconds += r.total_seconds;
      } else {
        active++;
        summary[r.staff_member_id].totalSeconds += Math.floor((Date.now() - new Date(r.clock_in_at).getTime()) / 1000);
      }
    });
    setStaffSummary(summary);
    setActiveCount(active);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchRecords();
    const channel = supabase
      .channel("owner-time-clock")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_time_clock" }, () => fetchRecords())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRecords]);

  const filteredSummary = Object.entries(staffSummary).filter(([, v]) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{Object.keys(staffSummary).length}</p>
              <p className="text-xs text-muted-foreground">Staff Clocked In</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Currently Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatDuration(Object.values(staffSummary).reduce((a, s) => a + s.totalSeconds, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Total Hours Logged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              {format(selectedDate, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Staff Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Staff Hours — {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSummary.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No clock-in records for this date.</p>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {filteredSummary
                  .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
                  .map(([id, s]) => (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/20 hover:bg-secondary/50 transition-colors">
                      {s.avatar ? (
                        <img src={s.avatar} alt="" className="w-10 h-10 rounded-full ring-2 ring-primary/30" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold ring-2 ring-primary/30">
                          {s.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.sessions} session{s.sessions > 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{formatDuration(s.totalSeconds)}</p>
                        {records.some(r => r.staff_member_id === id && !r.clock_out_at) && (
                          <Badge className="bg-green-600 text-xs">Active</Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detailed Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Detailed Session Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {records.filter(r => r.staff_name.toLowerCase().includes(searchQuery.toLowerCase())).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/20">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.clock_out_at ? "bg-muted-foreground" : "bg-green-500 animate-pulse"}`} />
                  {r.discord_avatar ? (
                    <img src={r.discord_avatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {r.staff_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.staff_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.clock_in_at), "hh:mm a")}
                      {r.clock_out_at ? ` → ${format(new Date(r.clock_out_at), "hh:mm a")}` : " → Active"}
                    </p>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {r.clock_out_at ? formatDuration(r.total_seconds) : "Active"}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerTimeClockManager;
