import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, Users, FileText, MessageSquare, Shield, BarChart3, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

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
  staffMember: StaffMember;
  ticketsSolved: number;
  confidentialTicketsSolved: number;
  liveChatsSolved: number;
  whitelistApproved: number;
  staffAppsApproved: number;
  jobAppsApproved: number;
  banAppealsApproved: number;
  gangAppsApproved: number;
  creatorAppsApproved: number;
  businessAppsApproved: number;
  pdmAppsApproved: number;
  firefighterAppsApproved: number;
  dojAppsApproved: number;
  activeTime: string;
  idleTime: string;
  backgroundTime: string;
}

interface ActivityData {
  staff_member_id: string;
  active_seconds: number;
  idle_seconds: number;
  background_seconds: number;
  tracking_date: string;
}

const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const OwnerRecords = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, Omit<StaffStats, 'staffMember'>>>({});
  const [activityMap, setActivityMap] = useState<Record<string, ActivityData[]>>({});
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const getDateRange = useCallback(() => {
    const now = new Date();
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
      // Fetch all staff members
      const { data: staff } = await supabase
        .from('staff_members')
        .select('id, name, discord_id, discord_avatar, role_type, department, user_id')
        .eq('is_active', true)
        .order('role_type');

      if (!staff) return;
      setStaffMembers(staff);

      const staffIds = staff.map(s => s.id);
      const userIds = staff.filter(s => s.user_id).map(s => s.user_id!);

      // Fetch all stats in parallel
      const [
        ticketsRes,
        confidentialRes,
        liveChatsRes,
        whitelistRes,
        staffAppsRes,
        jobAppsRes,
        banAppealsRes,
        gangAppsRes,
        creatorAppsRes,
        businessAppsRes,
        activityRes,
      ] = await Promise.all([
        // Tickets solved - use try/catch for tables that might not exist
        supabase.from('confidential_tickets').select('resolved_by').eq('status', 'resolved').in('resolved_by', userIds),
        // Confidential tickets (duplicate for slot)
        supabase.from('confidential_tickets').select('resolved_by').eq('status', 'resolved').in('resolved_by', userIds),
        // Live chats
        supabase.from('support_chats').select('assigned_to').eq('status', 'closed').in('assigned_to', userIds),
        // Whitelist approvals
        supabase.from('whitelist_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        // Staff app approvals
        supabase.from('staff_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        // Job app approvals
        supabase.from('job_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        // Ban appeal approvals
        supabase.from('ban_appeals').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        // Gang app approvals
        supabase.from('gang_applications' as any).select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds).then(r => r.data || []).catch(() => []),
        // Creator app approvals
        supabase.from('creator_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        // Business app approvals
        supabase.from('business_applications').select('reviewed_by').eq('status', 'approved').in('reviewed_by', userIds),
        // Activity tracking
        (() => {
          const range = getDateRange();
          return supabase
            .from('staff_activity_tracking')
            .select('staff_member_id, active_seconds, idle_seconds, background_seconds, tracking_date')
            .in('staff_member_id', staffIds)
            .gte('tracking_date', range.from)
            .lte('tracking_date', range.to);
        })(),
      ]);

      // Build stats map
      const newStatsMap: Record<string, any> = {};
      const newActivityMap: Record<string, ActivityData[]> = {};

      staff.forEach(s => {
        const userId = s.user_id;
        const countBy = (arr: any[], field: string) => {
          if (!arr || !userId) return 0;
          return arr.filter(r => r[field] === userId).length;
        };

        newStatsMap[s.id] = {
          ticketsSolved: 0, // support_tickets may not exist
          confidentialTicketsSolved: countBy(confidentialRes.data || [], 'resolved_by'),
          liveChatsSolved: countBy(liveChatsRes.data || [], 'assigned_to'),
          whitelistApproved: countBy(whitelistRes.data || [], 'reviewed_by'),
          staffAppsApproved: countBy(staffAppsRes.data || [], 'reviewed_by'),
          jobAppsApproved: countBy(jobAppsRes.data || [], 'reviewed_by'),
          banAppealsApproved: countBy(banAppealsRes.data || [], 'reviewed_by'),
          gangAppsApproved: 0,
          creatorAppsApproved: countBy(creatorAppsRes.data || [], 'reviewed_by'),
          businessAppsApproved: countBy(businessAppsRes.data || [], 'reviewed_by'),
          pdmAppsApproved: 0,
          firefighterAppsApproved: 0,
          dojAppsApproved: 0,
        };

        // Activity data
        const activities = (activityRes.data || []).filter(a => a.staff_member_id === s.id);
        newActivityMap[s.id] = activities;

        const totalActive = activities.reduce((sum, a) => sum + (a.active_seconds || 0), 0);
        const totalIdle = activities.reduce((sum, a) => sum + (a.idle_seconds || 0), 0);
        const totalBg = activities.reduce((sum, a) => sum + (a.background_seconds || 0), 0);

        newStatsMap[s.id].activeTime = formatDuration(totalActive);
        newStatsMap[s.id].idleTime = formatDuration(totalIdle);
        newStatsMap[s.id].backgroundTime = formatDuration(totalBg);
      });

      setStatsMap(newStatsMap);
      setActivityMap(newActivityMap);
    } catch (err) {
      console.error('[Records] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();

    // Realtime subscription for activity tracking updates
    const channel = supabase
      .channel('staff_activity_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_activity_tracking',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Also refresh on application status changes for live counts
    const appChannel = supabase
      .channel('app_status_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'whitelist_applications' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'job_applications' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'staff_applications' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ban_appeals' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_chats' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'confidential_tickets' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(appChannel);
    };
  }, [fetchData]);

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'owner': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'moderator': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'developer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getAvatarUrl = (staff: StaffMember) => {
    if (staff.discord_avatar && staff.discord_id) {
      return `https://cdn.discordapp.com/avatars/${staff.discord_id}/${staff.discord_avatar}.png?size=64`;
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Staff Records
          </CardTitle>
          <CardDescription>
            Real-time staff performance tracking — tickets, applications, and activity time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm"
            />
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {staffMembers.length} Staff
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Staff Records Table */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Activity Time
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-center">Tickets</TableHead>
                      <TableHead className="text-center">Confidential</TableHead>
                      <TableHead className="text-center">Live Chats</TableHead>
                      <TableHead className="text-center">Active Time</TableHead>
                      <TableHead className="text-center">Total Apps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => {
                      const stats = statsMap[staff.id];
                      if (!stats) return null;
                      const totalApps = stats.whitelistApproved + stats.staffAppsApproved + stats.jobAppsApproved +
                        stats.banAppealsApproved + stats.creatorAppsApproved + stats.businessAppsApproved;
                      return (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={getAvatarUrl(staff) || undefined} />
                                <AvatarFallback className="text-xs">{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{staff.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getRoleColor(staff.role_type)}`}>
                              {staff.role_type || 'staff'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">{stats.ticketsSolved}</TableCell>
                          <TableCell className="text-center font-mono">{stats.confidentialTicketsSolved}</TableCell>
                          <TableCell className="text-center font-mono">{stats.liveChatsSolved}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-primary font-mono text-sm">{stats.activeTime}</span>
                          </TableCell>
                          <TableCell className="text-center font-mono">{totalApps}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-center">Whitelist</TableHead>
                      <TableHead className="text-center">Staff Apps</TableHead>
                      <TableHead className="text-center">Job Apps</TableHead>
                      <TableHead className="text-center">Ban Appeals</TableHead>
                      <TableHead className="text-center">Creator</TableHead>
                      <TableHead className="text-center">Business</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => {
                      const stats = statsMap[staff.id];
                      if (!stats) return null;
                      return (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={getAvatarUrl(staff) || undefined} />
                                <AvatarFallback className="text-xs">{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{staff.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{stats.whitelistApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{stats.staffAppsApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{stats.jobAppsApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{stats.banAppealsApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{stats.creatorAppsApproved}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">{stats.businessAppsApproved}</Badge>
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

        {/* Activity Time Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Activity Breakdown
              </CardTitle>
              <CardDescription>
                Active = mouse/keyboard activity · Idle = no activity for 5min · Background = different tab
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-center">
                        <span className="text-green-400">Active Time</span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="text-yellow-400">Idle Time</span>
                      </TableHead>
                      <TableHead className="text-center">
                        <span className="text-orange-400">Background Time</span>
                      </TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => {
                      const stats = statsMap[staff.id];
                      const activities = activityMap[staff.id] || [];
                      if (!stats) return null;

                      const totalActive = activities.reduce((s, a) => s + (a.active_seconds || 0), 0);
                      const totalIdle = activities.reduce((s, a) => s + (a.idle_seconds || 0), 0);
                      const totalBg = activities.reduce((s, a) => s + (a.background_seconds || 0), 0);
                      const total = totalActive + totalIdle + totalBg;

                      return (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={getAvatarUrl(staff) || undefined} />
                                <AvatarFallback className="text-xs">{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium text-sm">{staff.name}</span>
                                <Badge className={`text-[10px] ml-2 ${getRoleColor(staff.role_type)}`}>
                                  {staff.role_type || 'staff'}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-green-400 font-bold">{formatDuration(totalActive)}</span>
                              {total > 0 && (
                                <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(totalActive / total) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-yellow-400 font-bold">{formatDuration(totalIdle)}</span>
                              {total > 0 && (
                                <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(totalIdle / total) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-orange-400 font-bold">{formatDuration(totalBg)}</span>
                              {total > 0 && (
                                <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(totalBg / total) * 100}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono text-foreground font-bold">{formatDuration(total)}</span>
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
