import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, RefreshCw, TrendingUp, AlertCircle, Circle } from "lucide-react";

interface StaffWorkload {
  user_id: string;
  staff_id: string;
  name: string;
  discord_username: string;
  discord_id: string | null;
  current_workload: number;
  max_concurrent_chats: number;
  is_available: boolean;
  workload_percentage: number;
  is_online: boolean;
  discord_status: string;
}

interface DiscordPresenceData {
  staff_member_id: string;
  is_online: boolean;
  status: string;
  updated_at: string;
}

export const StaffWorkloadDashboard = () => {
  const { toast } = useToast();
  const [workloads, setWorkloads] = useState<StaffWorkload[]>([]);
  const [loading, setLoading] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);

  const fetchWorkloads = useCallback(async () => {
    setLoading(true);
    
    try {
      // Fetch staff availability with staff member details
      const { data: availabilityData, error: availError } = await supabase
        .from('staff_availability')
        .select(`
          user_id,
          current_workload,
          max_concurrent_chats,
          is_available,
          staff_members!inner(id, name, discord_username, discord_id, is_active, role_type)
        `)
        .eq('staff_members.is_active', true)
        .in('staff_members.role_type', ['admin', 'moderator', 'owner', 'developer']);

      if (availError) {
        console.error('Error fetching workloads:', availError);
        setLoading(false);
        return;
      }

      // Get staff member IDs to fetch Discord presence
      const staffIds = (availabilityData || []).map((item: any) => item.staff_members.id);
      
      // Fetch Discord presence data
      let presenceMap = new Map<string, DiscordPresenceData>();
      if (staffIds.length > 0) {
        const { data: presenceData, error: presenceError } = await supabase
          .from('discord_presence')
          .select('staff_member_id, is_online, status, updated_at')
          .in('staff_member_id', staffIds);

        if (!presenceError && presenceData) {
          presenceData.forEach((p: DiscordPresenceData) => {
            presenceMap.set(p.staff_member_id, p);
          });
        }
      }

      const now = new Date();
      const formattedData: StaffWorkload[] = (availabilityData || []).map((item: any) => {
        const presence = presenceMap.get(item.staff_members.id);
        let isOnline = false;
        let discordStatus = 'offline';

        if (presence) {
          const updatedAt = new Date(presence.updated_at);
          const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;
          
          // Consider presence data valid if updated within 60 seconds
          if (secondsSinceUpdate <= 60) {
            isOnline = presence.is_online;
            discordStatus = presence.status || 'offline';
          } else if (secondsSinceUpdate <= 120) {
            isOnline = presence.is_online;
            discordStatus = presence.is_online ? 'idle' : 'offline';
          }
        }

        return {
          user_id: item.user_id,
          staff_id: item.staff_members.id,
          name: item.staff_members.name,
          discord_username: item.staff_members.discord_username,
          discord_id: item.staff_members.discord_id,
          current_workload: item.current_workload || 0,
          max_concurrent_chats: item.max_concurrent_chats || 5,
          is_available: item.is_available,
          workload_percentage: ((item.current_workload || 0) / (item.max_concurrent_chats || 5)) * 100,
          is_online: isOnline,
          discord_status: discordStatus,
        };
      });

      setWorkloads(formattedData.sort((a, b) => {
        // Sort by online status first, then by workload
        if (a.is_online !== b.is_online) return b.is_online ? 1 : -1;
        return b.workload_percentage - a.workload_percentage;
      }));
    } catch (error) {
      console.error('Error fetching workloads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkloads();
    
    // Refresh every 15 seconds for real-time Discord status
    const interval = setInterval(fetchWorkloads, 15000);
    
    // Set up real-time subscription for staff_availability changes
    const availabilityChannel = supabase
      .channel('staff-workload-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_availability',
        },
        () => fetchWorkloads()
      )
      .subscribe();

    // Subscribe to Discord presence changes
    const presenceChannel = supabase
      .channel('workload-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discord_presence',
        },
        () => fetchWorkloads()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(availabilityChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [fetchWorkloads]);

  const triggerRebalance = async () => {
    setRebalancing(true);
    
    try {
      const { data, error } = await supabase.rpc('rebalance_staff_workload');

      if (error) throw error;

      const result = data?.[0];
      toast({
        title: "Workload Rebalanced",
        description: result?.message || "Workload has been redistributed among available staff.",
      });

      fetchWorkloads();
    } catch (error) {
      console.error('Error rebalancing workload:', error);
      toast({
        title: "Error",
        description: "Failed to rebalance workload.",
        variant: "destructive",
      });
    } finally {
      setRebalancing(false);
    }
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return "text-destructive";
    if (percentage >= 60) return "text-orange-500";
    if (percentage >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getWorkloadBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "destructive";
    if (percentage >= 60) return "secondary";
    return "default";
  };

  const totalActive = workloads.filter(w => w.is_available).length;
  const totalChats = workloads.reduce((sum, w) => sum + w.current_workload, 0);
  const avgWorkload = totalActive > 0 ? (totalChats / totalActive).toFixed(1) : '0';

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Staff Workload Distribution
            </CardTitle>
            <CardDescription className="mt-2">
              Real-time view of chat assignments across staff members
            </CardDescription>
          </div>
          <Button
            onClick={triggerRebalance}
            disabled={rebalancing || loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${rebalancing ? 'animate-spin' : ''}`} />
            Rebalance
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <div className="text-2xl font-bold text-primary">{totalActive}</div>
            <div className="text-xs text-muted-foreground">Available Staff</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <div className="text-2xl font-bold text-primary">{totalChats}</div>
            <div className="text-xs text-muted-foreground">Active Chats</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <div className="text-2xl font-bold text-primary">{avgWorkload}</div>
            <div className="text-xs text-muted-foreground">Avg per Staff</div>
          </div>
        </div>

        {/* Workload List */}
        <div className="space-y-3">
          {workloads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No staff members available</p>
            </div>
          ) : (
            workloads.map((staff) => (
              <div
                key={staff.user_id}
                className={`p-4 rounded-lg border transition-colors ${
                  staff.is_online 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-border/50 opacity-75'
                } hover:border-primary/50`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Online Status Indicator */}
                    <div className="relative">
                      <Circle 
                        className={`w-3 h-3 ${
                          staff.is_online 
                            ? staff.discord_status === 'dnd' 
                              ? 'fill-red-500 text-red-500'
                              : staff.discord_status === 'idle'
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'fill-green-500 text-green-500 animate-pulse'
                            : 'fill-gray-500 text-gray-500'
                        }`} 
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{staff.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {staff.discord_username}
                        {staff.is_online && (
                          <span className="ml-1 text-green-500">• {staff.discord_status}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={staff.is_online ? "default" : "secondary"}
                      className={staff.is_online ? "bg-green-500/20 text-green-500 border-green-500/50" : ""}
                    >
                      {staff.is_online ? "Online" : "Offline"}
                    </Badge>
                    <Badge variant={staff.is_available ? "default" : "secondary"}>
                      {staff.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <Badge variant={getWorkloadBadgeVariant(staff.workload_percentage)}>
                      {staff.current_workload}/{staff.max_concurrent_chats}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Workload</span>
                    <span className={`font-semibold ${getWorkloadColor(staff.workload_percentage)}`}>
                      {staff.workload_percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={staff.workload_percentage} 
                    className="h-2"
                  />
                </div>

                {staff.workload_percentage >= 80 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    <span>High workload - may need rebalancing</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Auto-assignment Info */}
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Auto-assignment active:</strong> New support chats are automatically 
              distributed to available staff members based on current workload every 2 minutes.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};