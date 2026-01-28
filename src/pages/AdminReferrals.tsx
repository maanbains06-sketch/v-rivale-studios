import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Gift, Search, ArrowUpDown } from "lucide-react";
import headerStore from "@/assets/header-store.jpg";

interface ReferralStats {
  totalReferrals: number;
  totalDiscountsGiven: number;
  activeReferrers: number;
  averageReferralsPerUser: number;
}

interface TopReferrer {
  user_id: string;
  email: string;
  referral_code: string;
  total_referrals: number;
  discount_percentage: number;
}

const AdminReferrals = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalDiscountsGiven: 0,
    activeReferrers: 0,
    averageReferralsPerUser: 0,
  });
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadReferralData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast({
        title: "Error",
        description: "Failed to verify permissions",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadReferralData = async () => {
    try {
      // Get all referral rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("referral_rewards")
        .select("*");

      if (rewardsError) throw rewardsError;

      // Calculate stats
      const totalReferrals = rewardsData.reduce((sum, r) => sum + r.total_referrals, 0);
      const activeReferrers = rewardsData.filter(r => r.total_referrals > 0).length;
      const totalDiscountsGiven = rewardsData.reduce((sum, r) => sum + r.discount_percentage, 0);
      const averageReferrals = activeReferrers > 0 ? totalReferrals / activeReferrers : 0;

      setStats({
        totalReferrals,
        totalDiscountsGiven,
        activeReferrers,
        averageReferralsPerUser: Math.round(averageReferrals * 10) / 10,
      });

      // Get top referrers with user emails
      const { data: topData, error: topError } = await supabase
        .from("referral_rewards")
        .select(`
          user_id,
          total_referrals,
          discount_percentage
        `)
        .gt("total_referrals", 0)
        .order("total_referrals", { ascending: false })
        .limit(20);

      if (topError) throw topError;

      // Fetch referral codes and user emails
      const enrichedData = await Promise.all(
        topData.map(async (referrer) => {
          const { data: codeData } = await supabase
            .from("referral_codes")
            .select("referral_code")
            .eq("user_id", referrer.user_id)
            .single();

          const { data: { user } } = await supabase.auth.admin.getUserById(referrer.user_id);

          return {
            ...referrer,
            email: user?.email || "N/A",
            referral_code: codeData?.referral_code || "N/A",
          };
        })
      );

      setTopReferrers(enrichedData);
    } catch (error) {
      console.error("Error loading referral data:", error);
      toast({
        title: "Error",
        description: "Failed to load referral statistics",
        variant: "destructive",
      });
    }
  };

  const filteredReferrers = topReferrers.filter(
    (r) =>
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader
        title="Referral Analytics"
        description="Manage and track referral program performance"
        backgroundImage={headerStore}
        pageKey="staff"
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-effect border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-accent/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.activeReferrers}</div>
                <p className="text-xs text-muted-foreground">Users with 1+ referrals</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                <Gift className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{stats.totalDiscountsGiven}%</div>
                <p className="text-xs text-muted-foreground">Cumulative rewards</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per User</CardTitle>
                <ArrowUpDown className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.averageReferralsPerUser}</div>
                <p className="text-xs text-muted-foreground">Referrals per active user</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Referrers Table */}
          <Card className="glass-effect border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Referrers</CardTitle>
                  <CardDescription>Users with the most successful referrals</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button onClick={loadReferralData} variant="outline" size="sm">
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Rank</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead className="text-center">Total Referrals</TableHead>
                      <TableHead className="text-center">Discount Earned</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No referrers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferrers.map((referrer, index) => (
                        <TableRow key={referrer.user_id}>
                          <TableCell className="font-medium">
                            {index === 0 && <span className="text-yellow-500">🥇</span>}
                            {index === 1 && <span className="text-gray-400">🥈</span>}
                            {index === 2 && <span className="text-amber-600">🥉</span>}
                            {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{referrer.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {referrer.referral_code}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-primary">{referrer.total_referrals}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{referrer.discount_percentage}%</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={referrer.total_referrals >= 10 ? "default" : "outline"}
                              className={referrer.total_referrals >= 10 ? "bg-green-500" : ""}
                            >
                              {referrer.total_referrals >= 10 ? "Top Performer" : "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminReferrals;
