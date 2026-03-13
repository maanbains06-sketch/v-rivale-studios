import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, Users, FileText, MessageSquare, Shield, BarChart3, Calendar, Activity, ChevronDown, ChevronRight, Zap, TrendingUp, Timer, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface StaffMember {
  id: string;
  name: string;
  discord_id: string;
  discord_avatar: string | null;
  role_type: string | null;
  department: string | null;
  user_id: string | null;
}

interface StaffStats {
  ticketsSolved: number;
  confidentialTicketsSolved: number;
  liveChatsSolved: number;
  whitelistApproved: number;
  staffAppsApproved: number;
  jobAppsApproved: Record<string, number>;
  banAppealsApproved: number;
  creatorAppsApproved: number;
  businessAppsApproved: number;
  pdmAppsApproved: number;
  firefighterAppsApproved: number;
  activeTime: number;
  idleTime: number;
  backgroundTime: number;
}

const JOB_TYPES = [
  { key: 'police', label: 'Police', table: 'job_applications', filter: { field: 'department', value: 'police' } },
  { key: 'ems', label: 'EMS', table: 'job_applications', filter: { field: 'department', value: 'ems' } },
  { key: 'fire', label: 'Fire', table: 'job_applications', filter: { field: 'department', value: 'fire' } },
  { key: 'mechanic', label: 'Mechanic', table: 'job_applications', filter: { field: 'department', value: 'mechanic' } },
  { key: 'pdm', label: 'PDM', table: 'pdm_applications' },
  { key: 'firefighter', label: 'Firefighter', table: 'firefighter_applications' },
];

const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const getRoleColor = (role: string | null) => {
  switch (role) {
    case 'owner': return 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-500/40';
    case 'admin': return 'bg-gradient-to-r from-red-500/30 to-rose-500/30 text-red-300 border-red-500/40';
    case 'moderator': return 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 border-blue-500/40';
    case 'developer': return 'bg-gradient-to-r from-purple-500/30 to-violet-500/30 text-purple-300 border-purple-500/40';
    default: return 'bg-muted/50 text-muted-foreground border-border';
  }
};

const getRoleGlow = (role: string | null) => {
  switch (role) {
    case 'owner': return '0 0 12px rgba(245,158,11,0.3)';
    case 'admin': return '0 0 12px rgba(239,68,68,0.25)';
    case 'moderator': return '0 0 12px rgba(59,130,246,0.25)';
    case 'developer': return '0 0 12px rgba(168,85,247,0.25)';
    default: return 'none';
  }
};

const getAvatarUrl = (staff: StaffMember) => {
  if (staff.discord_avatar) {
    // Check if it's already a full URL
    if (staff.discord_avatar.startsWith('http')) return staff.discord_avatar;
    // Build CDN URL from discord_id + avatar hash
    if (staff.discord_id) {
      const ext = staff.discord_avatar.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/avatars/${staff.discord_id}/${staff.discord_avatar}.${ext}?size=128`;
    }
  }
  return null;
};

const OwnerRecords = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, StaffStats>>({});
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [jobsExpanded, setJobsExpanded] = useState<Record<string, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getDateRange = useCallback(() => {
    if (dateFilter === 'today') {
      return { from: selectedDate, to: selectedDate };
    } else if (dateFilter === 'week') {
      const start = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
      const end = endOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
      return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') };
    } else {
      const start = startOfMonth(new Date(selectedDate));
      const end = endOfMonth(new Date(selectedDate));
      return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') };
    }
  }, [dateFilter, selectedDate]);

  const fetchData = useCallback(async () => {
    try {
      const { data: staff } = await supabase
        .from('staff_members')
        .select('id, name, discord_id, discord_avatar, role_type, department, user_id')
        .eq('is_active', true)
        .order('role_type');

      if (!staff) return;
      setStaffMembers(staff);

      const staffIds = staff.map(s => s.id);
      const userIds = staff.filter(s => s.user_id).map(s => s.user_id!);

      const range = getDateRange();

      const [
        confidentialRes,
        liveChatsRes,
        whitelistRes,
        staffAppsRes,
        jobAppsRes,
        banAppealsRes,
        creatorAppsRes,
        businessAppsRes,
        pdmAppsRes,
        firefighterAppsRes,
        activityRes,
      ] = await Promise.all([
        supabase.from('confidential_tickets').select('resolved_by').eq('status', 'resolved').in('resolved_by', userIds),
        supabase.from('support_chats').select('assigned_to').eq('status', 'closed').in('assigned_to', userIds),
        supabase.from('whitelist_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('staff_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('job_applications').select('reviewed_by, department').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('ban_appeals').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('creator_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('business_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('pdm_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('firefighter_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        supabase.from('staff_activity_tracking')
          .select('staff_member_id, active_seconds, idle_seconds, background_seconds, tracking_date')
          .in('staff_member_id', staffIds)
          .gte('tracking_date', range.from)
          .lte('tracking_date', range.to),
      ]);

      const newStatsMap: Record<string, StaffStats> = {};

      staff.forEach(s => {
        const userId = s.user_id;
        const countBy = (arr: any[] | null, field: string) => {
          if (!arr || !userId) return 0;
          return arr.filter(r => r[field] === userId).length;
        };
        const countByDept = (arr: any[] | null, field: string, dept: string) => {
          if (!arr || !userId) return 0;
          return arr.filter(r => r[field] === userId && r.department === dept).length;
        };

        const jobApps: Record<string, number> = {};
        JOB_TYPES.forEach(jt => {
          if (jt.table === 'job_applications' && jt.filter) {
            jobApps[jt.key] = countByDept(jobAppsRes.data, 'reviewed_by', jt.filter.value);
          } else if (jt.table === 'pdm_applications') {
            jobApps[jt.key] = countBy(pdmAppsRes.data, 'reviewed_by');
          } else if (jt.table === 'firefighter_applications') {
            jobApps[jt.key] = countBy(firefighterAppsRes.data, 'reviewed_by');
          }
        });

        const activities = (activityRes.data || []).filter(a => a.staff_member_id === s.id);
        const totalActive = activities.reduce((sum, a) => sum + (a.active_seconds || 0), 0);
        const totalIdle = activities.reduce((sum, a) => sum + (a.idle_seconds || 0), 0);
        const totalBg = activities.reduce((sum, a) => sum + (a.background_seconds || 0), 0);

        newStatsMap[s.id] = {
          ticketsSolved: 0,
          confidentialTicketsSolved: countBy(confidentialRes.data, 'resolved_by'),
          liveChatsSolved: countBy(liveChatsRes.data, 'assigned_to'),
          whitelistApproved: countBy(whitelistRes.data, 'reviewed_by'),
          staffAppsApproved: countBy(staffAppsRes.data, 'reviewed_by'),
          jobAppsApproved: jobApps,
          banAppealsApproved: countBy(banAppealsRes.data, 'reviewed_by'),
          creatorAppsApproved: countBy(creatorAppsRes.data, 'reviewed_by'),
          businessAppsApproved: countBy(businessAppsRes.data, 'reviewed_by'),
          pdmAppsApproved: countBy(pdmAppsRes.data, 'reviewed_by'),
          firefighterAppsApproved: countBy(firefighterAppsRes.data, 'reviewed_by'),
          activeTime: totalActive,
          idleTime: totalIdle,
          backgroundTime: totalBg,
        };
      });

      setStatsMap(newStatsMap);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('[Records] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleJobExpand = (staffId: string) => {
    setJobsExpanded(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading staff records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              Staff Records
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Live performance tracking • Auto-refreshes every 10s
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
              <SelectTrigger className="w-[130px] bg-background/50 backdrop-blur-sm border-border/50">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-3 rounded-md border border-border/50 bg-background/50 backdrop-blur-sm text-sm"
            />
            <Badge variant="outline" className="gap-1.5 py-1 px-3 border-primary/30 text-primary">
              <Users className="w-3.5 h-3.5" />
              {staffMembers.length} Staff
            </Badge>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live • {format(lastRefresh, 'HH:mm:ss')}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Tickets', icon: MessageSquare, value: Object.values(statsMap).reduce((s, v) => s + v.confidentialTicketsSolved, 0), color: 'text-blue-400' },
          { label: 'Live Chats', icon: Zap, value: Object.values(statsMap).reduce((s, v) => s + v.liveChatsSolved, 0), color: 'text-emerald-400' },
          { label: 'Apps Approved', icon: FileText, value: Object.values(statsMap).reduce((s, v) => s + v.whitelistApproved + v.staffAppsApproved + Object.values(v.jobAppsApproved).reduce((a, b) => a + b, 0) + v.banAppealsApproved + v.creatorAppsApproved + v.businessAppsApproved, 0), color: 'text-purple-400' },
          { label: 'Total Active', icon: Timer, value: formatDuration(Object.values(statsMap).reduce((s, v) => s + v.activeTime, 0)), color: 'text-amber-400', isString: true },
        ].map((card, i) => (
          <Card key={i} className="border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.isString ? card.value : card.value}</p>
                </div>
                <card.icon className={`w-8 h-8 ${card.color} opacity-30`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-background/50 backdrop-blur-sm border border-border/40">
          <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-primary/10">
            <TrendingUp className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-1.5 data-[state=active]:bg-primary/10">
            <FileText className="w-4 h-4" /> Applications
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 data-[state=active]:bg-primary/10">
            <Activity className="w-4 h-4" /> Activity Time
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-wider">Staff Member</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Role</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Tickets</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Live Chats</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Active Time</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Total Apps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff) => {
                    const stats = statsMap[staff.id];
                    if (!stats) return null;
                    const totalApps = stats.whitelistApproved + stats.staffAppsApproved +
                      Object.values(stats.jobAppsApproved).reduce((a, b) => a + b, 0) +
                      stats.banAppealsApproved + stats.creatorAppsApproved + stats.businessAppsApproved;
                    return (
                      <TableRow key={staff.id} className="border-border/20 hover:bg-primary/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 ring-2 ring-border/30" style={{ boxShadow: getRoleGlow(staff.role_type) }}>
                              <AvatarImage src={getAvatarUrl(staff) || undefined} />
                              <AvatarFallback className="text-xs font-bold bg-muted">{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm">{staff.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-semibold ${getRoleColor(staff.role_type)}`}>
                            {staff.role_type || 'staff'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-blue-400">{stats.confidentialTicketsSolved}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-emerald-400">{stats.liveChatsSolved}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-primary">{formatDuration(stats.activeTime)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-purple-400">{totalApps}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-wider">Staff Member</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Whitelist</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Staff</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">
                      <div className="flex items-center justify-center gap-1">
                        Job Apps <ChevronDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Ban Appeals</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Creator</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-center">Business</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff) => {
                    const stats = statsMap[staff.id];
                    if (!stats) return null;
                    const totalJobs = Object.values(stats.jobAppsApproved).reduce((a, b) => a + b, 0);
                    const isExpanded = jobsExpanded[staff.id];

                    return (
                      <>
                        <TableRow key={staff.id} className="border-border/20 hover:bg-primary/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 ring-2 ring-border/30" style={{ boxShadow: getRoleGlow(staff.role_type) }}>
                                <AvatarImage src={getAvatarUrl(staff) || undefined} />
                                <AvatarFallback className="text-xs font-bold bg-muted">{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-semibold text-sm">{staff.name}</span>
                                <Badge className={`text-[9px] font-semibold ml-2 ${getRoleColor(staff.role_type)}`}>
                                  {staff.role_type || 'staff'}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono font-bold border-green-500/30 text-green-400 bg-green-500/10">{stats.whitelistApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono font-bold border-blue-500/30 text-blue-400 bg-blue-500/10">{stats.staffAppsApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => toggleJobExpand(staff.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors font-mono font-bold text-sm"
                            >
                              {totalJobs}
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono font-bold border-amber-500/30 text-amber-400 bg-amber-500/10">{stats.banAppealsApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono font-bold border-pink-500/30 text-pink-400 bg-pink-500/10">{stats.creatorAppsApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono font-bold border-cyan-500/30 text-cyan-400 bg-cyan-500/10">{stats.businessAppsApproved}</Badge>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${staff.id}-jobs`} className="border-border/10 bg-primary/[0.02]">
                            <TableCell colSpan={7}>
                              <div className="pl-14 py-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {JOB_TYPES.map(jt => (
                                  <div key={jt.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border/30">
                                    <span className="text-xs text-muted-foreground">{jt.label}</span>
                                    <span className="font-mono font-bold text-sm text-foreground">{stats.jobAppsApproved[jt.key] || 0}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Activity Time Tab */}
        <TabsContent value="activity">
          <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Activity Breakdown
              </CardTitle>
              <CardDescription className="flex items-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Active = mouse/keyboard</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Idle = 5min no activity</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Background = other tab</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider">Staff Member</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-center">
                        <span className="text-green-400">⚡ Active</span>
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-center">
                        <span className="text-yellow-400">💤 Idle</span>
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-center">
                        <span className="text-orange-400">🔇 Background</span>
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-center">Total</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-center">Activity %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => {
                      const stats = statsMap[staff.id];
                      if (!stats) return null;

                      const total = stats.activeTime + stats.idleTime + stats.backgroundTime;
                      const activePercent = total > 0 ? Math.round((stats.activeTime / total) * 100) : 0;

                      return (
                        <TableRow key={staff.id} className="border-border/20 hover:bg-primary/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 ring-2 ring-border/30" style={{ boxShadow: getRoleGlow(staff.role_type) }}>
                                <AvatarImage src={getAvatarUrl(staff) || undefined} />
                                <AvatarFallback className="text-xs font-bold bg-muted">{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-semibold text-sm">{staff.name}</span>
                                <Badge className={`text-[9px] font-semibold ml-2 ${getRoleColor(staff.role_type)}`}>
                                  {staff.role_type || 'staff'}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-green-400 font-bold text-sm">{formatDuration(stats.activeTime)}</span>
                              {total > 0 && (
                                <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${(stats.activeTime / total) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-yellow-400 font-bold text-sm">{formatDuration(stats.idleTime)}</span>
                              {total > 0 && (
                                <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${(stats.idleTime / total) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-orange-400 font-bold text-sm">{formatDuration(stats.backgroundTime)}</span>
                              {total > 0 && (
                                <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full transition-all duration-500" style={{ width: `${(stats.backgroundTime / total) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono text-foreground font-bold">{formatDuration(total)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-mono font-bold text-sm ${activePercent >= 70 ? 'text-green-400' : activePercent >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {activePercent}%
                              </span>
                              <div className="w-16 h-2 bg-muted/50 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${activePercent >= 70 ? 'bg-green-500' : activePercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${activePercent}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerRecords;
