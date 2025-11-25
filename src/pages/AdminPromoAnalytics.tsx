import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  TrendingUp, 
  Users, 
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PromoStats {
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  expiredCodes: number;
  totalDiscountGiven: number;
  redemptionRate: number;
}

interface PromoCodeDetail {
  id: string;
  code: string;
  user_id: string;
  discount_percentage: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  user_email?: string;
  used_by_email?: string;
}

const AdminPromoAnalytics = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PromoStats>({
    totalCodes: 0,
    usedCodes: 0,
    unusedCodes: 0,
    expiredCodes: 0,
    totalDiscountGiven: 0,
    redemptionRate: 0,
  });
  const [promoCodes, setPromoCodes] = useState<PromoCodeDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

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
        .single();

      if (!roleData || roleData.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadPromoData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    }
  };

  const loadPromoData = async () => {
    setLoading(true);
    try {
      // Fetch all promo codes
      const { data: codes, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with user emails
      const enrichedCodes = await Promise.all(
        (codes || []).map(async (code) => {
          let user_email = "";
          let used_by_email = "";

          if (code.user_id) {
            const { data: userData } = await supabase.auth.admin.getUserById(code.user_id);
            user_email = userData.user?.email || "";
          }

          if (code.used_by) {
            const { data: usedByData } = await supabase.auth.admin.getUserById(code.used_by);
            used_by_email = usedByData.user?.email || "";
          }

          return { ...code, user_email, used_by_email };
        })
      );

      setPromoCodes(enrichedCodes);

      // Calculate statistics
      const now = new Date();
      const used = enrichedCodes.filter(c => c.is_used).length;
      const expired = enrichedCodes.filter(c => 
        c.expires_at && new Date(c.expires_at) < now && !c.is_used
      ).length;
      const totalDiscount = enrichedCodes
        .filter(c => c.is_used)
        .reduce((sum, c) => sum + c.discount_percentage, 0);

      setStats({
        totalCodes: enrichedCodes.length,
        usedCodes: used,
        unusedCodes: enrichedCodes.length - used,
        expiredCodes: expired,
        totalDiscountGiven: totalDiscount,
        redemptionRate: enrichedCodes.length > 0 ? (used / enrichedCodes.length) * 100 : 0,
      });
    } catch (error) {
      console.error("Error loading promo data:", error);
      toast({
        title: "Error",
        description: "Failed to load promo code data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (code: PromoCodeDetail) => {
    if (code.is_used) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Used</Badge>;
    }
    
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    }

    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
  };

  const filteredCodes = promoCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.used_by_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Promo Code Analytics</h1>
              <p className="text-muted-foreground mt-2">Track usage and redemption rates</p>
            </div>
            <Button onClick={loadPromoData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCodes}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.unusedCodes} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Redemption Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.redemptionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.usedCodes} codes redeemed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discount Given</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDiscountGiven}%</div>
                <p className="text-xs text-muted-foreground">
                  Combined discount
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Codes</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expiredCodes}</div>
                <p className="text-xs text-muted-foreground">
                  Unused & expired
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Promo Codes Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Promo Codes</CardTitle>
                <Input
                  placeholder="Search codes or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No promo codes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                        <TableCell>{code.discount_percentage}%</TableCell>
                        <TableCell className="text-sm">{code.user_email || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(code)}</TableCell>
                        <TableCell className="text-sm">
                          {code.used_by_email || "-"}
                          {code.used_at && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(code.used_at).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(code.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : "Never"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPromoAnalytics;
