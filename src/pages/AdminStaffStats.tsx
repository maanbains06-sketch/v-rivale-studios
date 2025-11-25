import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  TrendingUp, 
  Award,
  Users,
  Timer,
  Activity,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StaffStats {
  id: string;
  name: string;
  discord_avatar?: string;
  role: string;
  department: string;
  totalActivities: number;
  ticketsResolved: number;
  ticketsAssigned: number;
  avgResponseTime: number | null;
  lastSeen: string | null;
  recentActivities: {
    action_type: string;
    action_description: string;
    created_at: string;
  }[];
}

const AdminStaffStats = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staffStats, setStaffStats] = useState<StaffStats[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadStaffStats();
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      toast({
        title: "Error",
        description: "Failed to verify permissions",
        variant: "destructive",
      });
    }
  };

  const loadStaffStats = async () => {
    try {
      setLoading(true);

      // Get all staff members
      const { data: staffMembers, error: staffError } = await supabase
        .from("staff_members")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (staffError) throw staffError;

      const statsPromises = (staffMembers || []).map(async (staff) => {
        // Get activity count
        const { count: activityCount } = await supabase
          .from("staff_activity_log")
          .select("*", { count: "exact", head: true })
          .eq("staff_user_id", staff.user_id || "");

        // Get recent activities
        const { data: recentActivities } = await supabase
          .from("staff_activity_log")
          .select("action_type, action_description, created_at")
          .eq("staff_user_id", staff.user_id || "")
          .order("created_at", { ascending: false })
          .limit(5);

        // Get tickets resolved
        const { count: resolvedCount } = await supabase
          .from("support_chats")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", staff.user_id || "")
          .eq("status", "closed");

        // Get tickets assigned
        const { count: assignedCount } = await supabase
          .from("support_chats")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", staff.user_id || "");

        // Calculate average response time
        const { data: chatsWithResponse } = await supabase
          .from("support_chats")
          .select("created_at, first_response_at")
          .eq("assigned_to", staff.user_id || "")
          .not("first_response_at", "is", null);

        let avgResponseTime: number | null = null;
        if (chatsWithResponse && chatsWithResponse.length > 0) {
          const totalResponseTime = chatsWithResponse.reduce((sum, chat) => {
            const responseTime = 
              new Date(chat.first_response_at!).getTime() - 
              new Date(chat.created_at).getTime();
            return sum + responseTime;
          }, 0);
          avgResponseTime = totalResponseTime / chatsWithResponse.length / (1000 * 60); // Convert to minutes
        }

        return {
          id: staff.id,
          name: staff.name,
          discord_avatar: staff.discord_avatar,
          role: staff.role,
          department: staff.department,
          totalActivities: activityCount || 0,
          ticketsResolved: resolvedCount || 0,
          ticketsAssigned: assignedCount || 0,
          avgResponseTime,
          lastSeen: staff.last_seen,
          recentActivities: recentActivities || [],
        };
      });

      const stats = await Promise.all(statsPromises);
      setStaffStats(stats);
    } catch (error: any) {
      console.error("Error loading staff stats:", error);
      toast({
        title: "Error",
        description: "Failed to load staff statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getTopPerformers = () => {
    return [...staffStats]
      .sort((a, b) => b.ticketsResolved - a.ticketsResolved)
      .slice(0, 5);
  };

  const getTotalStats = () => {
    return {
      totalStaff: staffStats.length,
      totalTickets: staffStats.reduce((sum, s) => sum + s.ticketsResolved, 0),
      totalActivities: staffStats.reduce((sum, s) => sum + s.totalActivities, 0),
      avgResponseTime: staffStats.length > 0
        ? staffStats.reduce((sum, s) => sum + (s.avgResponseTime || 0), 0) / 
          staffStats.filter(s => s.avgResponseTime !== null).length
        : 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh] pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();
  const topPerformers = getTopPerformers();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Staff Statistics</h1>
          <p className="text-muted-foreground">Comprehensive performance metrics and activity tracking</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Active Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{totalStats.totalStaff}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Tickets Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{totalStats.totalTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">Total closed</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{totalStats.totalActivities}</div>
              <p className="text-xs text-muted-foreground mt-1">Logged actions</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="w-4 h-4 text-orange-500" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">
                {totalStats.avgResponseTime > 0 ? `${Math.round(totalStats.avgResponseTime)}m` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average first response</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="glass-effect">
            <TabsTrigger value="all">All Staff</TabsTrigger>
            <TabsTrigger value="top">Top Performers</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {staffStats.map((staff) => (
              <Card key={staff.id} className="glass-effect border-border/20 hover:border-primary/40 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-primary">
                        <AvatarImage src={staff.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`} />
                        <AvatarFallback>{staff.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{staff.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                          <Badge variant="secondary" className="text-xs">{staff.department}</Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Last Seen</div>
                      <div className="text-sm font-medium">{formatLastSeen(staff.lastSeen)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Activities
                      </div>
                      <div className="text-2xl font-bold text-primary">{staff.totalActivities}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Assigned
                      </div>
                      <div className="text-2xl font-bold text-blue-500">{staff.ticketsAssigned}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Resolved
                      </div>
                      <div className="text-2xl font-bold text-green-500">{staff.ticketsResolved}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Avg Response
                      </div>
                      <div className="text-2xl font-bold text-orange-500">
                        {staff.avgResponseTime ? `${Math.round(staff.avgResponseTime)}m` : "N/A"}
                      </div>
                    </div>
                  </div>

                  {staff.recentActivities.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-muted-foreground">Recent Activities</div>
                      <div className="space-y-2">
                        {staff.recentActivities.map((activity, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs bg-muted/30 rounded-lg p-2">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {activity.action_type}
                            </Badge>
                            <div className="flex-1">
                              <div className="text-foreground">{activity.action_description}</div>
                              <div className="text-muted-foreground text-xs mt-0.5">
                                {formatLastSeen(activity.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="top" className="space-y-4">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Top Performers
                </CardTitle>
                <CardDescription>Staff members with the most tickets resolved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topPerformers.map((staff, index) => (
                  <div key={staff.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {index + 1}
                    </div>
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={staff.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`} />
                      <AvatarFallback>{staff.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gradient">{staff.ticketsResolved}</div>
                      <div className="text-xs text-muted-foreground">tickets resolved</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminStaffStats;
