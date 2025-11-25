import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Clock, CheckCircle, MessageSquare, TrendingUp, Users, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsData {
  totalChats: number;
  openChats: number;
  closedChats: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  totalRatings: number;
  chatsByStatus: { status: string; count: number }[];
  chatsByDay: { date: string; count: number }[];
  ratingDistribution: { rating: number; count: number }[];
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const SupportAnalytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAccess = roles?.some(r => r.role === "admin" || r.role === "moderator");
    
    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch chat statistics
      const { data: chats } = await supabase
        .from("support_chats")
        .select("*");

      const totalChats = chats?.length || 0;
      const openChats = chats?.filter(c => c.status === "open").length || 0;
      const closedChats = chats?.filter(c => c.status === "closed").length || 0;

      // Calculate average response and resolution times
      const { data: messages } = await supabase
        .from("support_messages")
        .select("*, support_chats(created_at)")
        .eq("is_staff", true)
        .order("created_at");

      let totalResponseTime = 0;
      let responseCount = 0;

      if (messages && chats) {
        for (const chat of chats) {
          const firstStaffMessage = messages.find(m => 
            (m as any).support_chats?.created_at && 
            new Date(m.created_at) > new Date((m as any).support_chats.created_at)
          );
          
          if (firstStaffMessage && (firstStaffMessage as any).support_chats) {
            const responseTime = new Date(firstStaffMessage.created_at).getTime() - 
                                new Date((firstStaffMessage as any).support_chats.created_at).getTime();
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      }

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount / 1000 / 60 : 0; // in minutes

      // Calculate average resolution time
      const closedChatsWithTime = chats?.filter(c => c.status === "closed") || [];
      let totalResolutionTime = 0;
      
      for (const chat of closedChatsWithTime) {
        const resolutionTime = new Date(chat.last_message_at).getTime() - new Date(chat.created_at).getTime();
        totalResolutionTime += resolutionTime;
      }

      const avgResolutionTime = closedChatsWithTime.length > 0 
        ? totalResolutionTime / closedChatsWithTime.length / 1000 / 60 / 60 
        : 0; // in hours

      // Fetch satisfaction ratings
      const { data: ratings } = await supabase
        .from("support_chat_ratings")
        .select("*");

      const totalRatings = ratings?.length || 0;
      const satisfactionScore = totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

      // Group chats by status
      const chatsByStatus = [
        { status: "Open", count: openChats },
        { status: "In Progress", count: chats?.filter(c => c.status === "in_progress").length || 0 },
        { status: "Closed", count: closedChats },
      ];

      // Group chats by day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chatsByDay = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: chats?.filter(c => c.created_at.split('T')[0] === date).length || 0,
      }));

      // Rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratings?.filter(r => r.rating === rating).length || 0,
      }));

      setAnalytics({
        totalChats,
        openChats,
        closedChats,
        avgResponseTime,
        avgResolutionTime,
        satisfactionScore,
        totalRatings,
        chatsByStatus,
        chatsByDay,
        ratingDistribution,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Support Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track support team performance and user satisfaction</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.totalChats}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics?.openChats} open, {analytics?.closedChats} closed
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.avgResponseTime.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">minutes</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.avgResolutionTime.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">hours</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics?.satisfactionScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                out of 5 ({analytics?.totalRatings} ratings)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="chats" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chats">Chat Metrics</TabsTrigger>
            <TabsTrigger value="ratings">Satisfaction</TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle>Chats by Status</CardTitle>
                  <CardDescription>Distribution of chat statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.chatsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count }) => `${status}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics?.chatsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle>Chat Volume Trend</CardTitle>
                  <CardDescription>New chats over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics?.chatsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} name="New Chats" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>User satisfaction ratings breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" label={{ value: 'Stars', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10B981" name="Number of Ratings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupportAnalytics;
