import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Briefcase,
  Users,
  AlertTriangle,
  Youtube,
  Flame,
  Tv,
  Car,
  Siren,
  Ambulance,
  Gavel,
  Scale,
  Building,
  Users2,
  RefreshCw,
  Store,
  Home,
  UtensilsCrossed,
  Wrench,
  Gauge,
  Music,
  CheckCircle,
  XCircle
} from "lucide-react";

interface StatusCount {
  approved: number;
  rejected: number;
}

interface ApplicationStats {
  whitelist: StatusCount;
  police: StatusCount;
  ems: StatusCount;
  mechanic: StatusCount;
  judge: StatusCount;
  attorney: StatusCount;
  state: StatusCount;
  gang: StatusCount;
  staff: StatusCount;
  banAppeal: StatusCount;
  creator: StatusCount;
  firefighter: StatusCount;
  weazel: StatusCount;
  pdm: StatusCount;
}

interface BusinessStats {
  realEstate: StatusCount;
  foodJoint: StatusCount;
  mechanicShop: StatusCount;
  tunerShop: StatusCount;
  entertainment: StatusCount;
  total: StatusCount;
}

interface StatButtonProps {
  label: string;
  approved: number;
  rejected: number;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
}

const StatButton = ({ label, approved, rejected, icon, colorClass, onClick }: StatButtonProps) => (
  <Button
    variant="outline"
    className={`flex flex-col items-center justify-center h-28 w-full gap-1 hover:scale-105 transition-transform ${colorClass}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xl font-bold">{approved + rejected}</span>
    </div>
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex items-center gap-3 mt-1">
      <span className="flex items-center gap-1 text-xs">
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span className="text-green-500 font-medium">{approved}</span>
      </span>
      <span className="flex items-center gap-1 text-xs">
        <XCircle className="h-3 w-3 text-red-500" />
        <span className="text-red-500 font-medium">{rejected}</span>
      </span>
    </div>
  </Button>
);

const defaultStatusCount: StatusCount = { approved: 0, rejected: 0 };

export const LiveApplicationStats = () => {
  const [stats, setStats] = useState<ApplicationStats>({
    whitelist: { ...defaultStatusCount },
    police: { ...defaultStatusCount },
    ems: { ...defaultStatusCount },
    mechanic: { ...defaultStatusCount },
    judge: { ...defaultStatusCount },
    attorney: { ...defaultStatusCount },
    state: { ...defaultStatusCount },
    gang: { ...defaultStatusCount },
    staff: { ...defaultStatusCount },
    banAppeal: { ...defaultStatusCount },
    creator: { ...defaultStatusCount },
    firefighter: { ...defaultStatusCount },
    weazel: { ...defaultStatusCount },
    pdm: { ...defaultStatusCount },
  });
  const [businessStats, setBusinessStats] = useState<BusinessStats>({
    realEstate: { ...defaultStatusCount },
    foodJoint: { ...defaultStatusCount },
    mechanicShop: { ...defaultStatusCount },
    tunerShop: { ...defaultStatusCount },
    entertainment: { ...defaultStatusCount },
    total: { ...defaultStatusCount },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all applications with status
      const [
        whitelistRes,
        jobsRes,
        staffRes,
        banAppealRes,
        creatorRes,
        firefighterRes,
        weazelRes,
        pdmRes,
        businessRes,
      ] = await Promise.all([
        supabase.from("whitelist_applications").select("id, status").in("status", ["approved", "rejected"]),
        supabase.from("job_applications").select("id, job_type, status").in("status", ["approved", "rejected"]),
        supabase.from("staff_applications").select("id, status").in("status", ["approved", "rejected"]),
        supabase.from("ban_appeals").select("id, status").in("status", ["approved", "rejected"]),
        supabase.from("creator_applications").select("id, status").in("status", ["approved", "rejected"]),
        supabase.from("firefighter_applications").select("id, status").in("status", ["approved", "rejected"]),
        supabase.from("weazel_news_applications").select("id, status").in("status", ["approved", "rejected"]),
        supabase.from("pdm_applications").select("id, status").in("status", ["approved", "rejected"]),
        supabase.from("business_applications").select("id, business_type, status").in("status", ["approved", "rejected"]),
      ]);

      // Helper to count by status
      const countByStatus = (data: any[] | null): StatusCount => ({
        approved: data?.filter(d => d.status === "approved").length || 0,
        rejected: data?.filter(d => d.status === "rejected").length || 0,
      });

      // Fetch gang applications separately
      let gangCounts: StatusCount = { ...defaultStatusCount };
      try {
        const { data } = await supabase.from("gang_applications" as any).select("id, status").in("status", ["approved", "rejected"]);
        gangCounts = countByStatus(data);
      } catch {
        // Table may not exist
      }

      // Process job applications by type
      const jobApps = jobsRes.data || [];
      const filterJobsByType = (types: string[]) => 
        jobApps.filter(j => types.some(t => j.job_type?.toLowerCase().includes(t)));
      
      const jobCounts = {
        police: countByStatus(filterJobsByType(["police", "pd"])),
        ems: countByStatus(filterJobsByType(["ems", "emergency"])),
        mechanic: countByStatus(filterJobsByType(["mechanic"])),
        judge: countByStatus(filterJobsByType(["judge"])),
        attorney: countByStatus(filterJobsByType(["attorney"])),
        state: countByStatus(filterJobsByType(["state"])),
      };

      // Process business applications by type
      const businessApps = businessRes.data || [];
      const filterBusinessByType = (types: string[]) =>
        businessApps.filter(b => types.some(t => b.business_type?.toLowerCase().includes(t)));

      const businessCounts: BusinessStats = {
        realEstate: countByStatus(filterBusinessByType(["real_estate", "real estate"])),
        foodJoint: countByStatus(filterBusinessByType(["food_joint", "food joint", "food"])),
        mechanicShop: countByStatus(businessApps.filter(b => 
          b.business_type?.toLowerCase().includes("mechanic_shop") || 
          b.business_type?.toLowerCase().includes("mechanic shop") || 
          b.business_type?.toLowerCase() === "mechanic"
        )),
        tunerShop: countByStatus(filterBusinessByType(["tuner_shop", "tuner shop", "tuner"])),
        entertainment: countByStatus(filterBusinessByType(["entertainment"])),
        total: countByStatus(businessApps),
      };

      setStats({
        whitelist: countByStatus(whitelistRes.data),
        police: jobCounts.police,
        ems: jobCounts.ems,
        mechanic: jobCounts.mechanic,
        judge: jobCounts.judge,
        attorney: jobCounts.attorney,
        state: jobCounts.state,
        gang: gangCounts,
        staff: countByStatus(staffRes.data),
        banAppeal: countByStatus(banAppealRes.data),
        creator: countByStatus(creatorRes.data),
        firefighter: countByStatus(firefighterRes.data),
        weazel: countByStatus(weazelRes.data),
        pdm: countByStatus(pdmRes.data),
      });

      setBusinessStats(businessCounts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching application stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Set up realtime subscriptions for all application tables
    const channel = supabase
      .channel("live-application-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "whitelist_applications" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_applications" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "ban_appeals" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "creator_applications" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "firefighter_applications" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "weazel_news_applications" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "pdm_applications" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_applications" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const getTotalCount = (statusCount: StatusCount) => statusCount.approved + statusCount.rejected;
  const totalApproved = Object.values(stats).reduce((a, b) => a + b.approved, 0);
  const totalRejected = Object.values(stats).reduce((a, b) => a + b.rejected, 0);
  const grandTotal = totalApproved + totalRejected + businessStats.total.approved + businessStats.total.rejected;

  return (
    <div className="space-y-6">
      {/* Main Applications Stats */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {grandTotal}
                </Badge>
                Number of Applications
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-4">
                <span>Live count of all applications</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-medium">{totalApproved + businessStats.total.approved}</span>
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">{totalRejected + businessStats.total.rejected}</span>
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchStats}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatButton
              label="Whitelist"
              approved={stats.whitelist.approved}
              rejected={stats.whitelist.rejected}
              icon={<Shield className="h-5 w-5 text-blue-500" />}
              colorClass="border-blue-500/30 hover:bg-blue-500/10"
            />
            <StatButton
              label="Police"
              approved={stats.police.approved}
              rejected={stats.police.rejected}
              icon={<Siren className="h-5 w-5 text-blue-400" />}
              colorClass="border-blue-400/30 hover:bg-blue-400/10"
            />
            <StatButton
              label="EMS"
              approved={stats.ems.approved}
              rejected={stats.ems.rejected}
              icon={<Ambulance className="h-5 w-5 text-red-500" />}
              colorClass="border-red-500/30 hover:bg-red-500/10"
            />
            <StatButton
              label="Mechanic"
              approved={stats.mechanic.approved}
              rejected={stats.mechanic.rejected}
              icon={<Car className="h-5 w-5 text-orange-500" />}
              colorClass="border-orange-500/30 hover:bg-orange-500/10"
            />
            <StatButton
              label="DOJ Judge"
              approved={stats.judge.approved}
              rejected={stats.judge.rejected}
              icon={<Gavel className="h-5 w-5 text-purple-500" />}
              colorClass="border-purple-500/30 hover:bg-purple-500/10"
            />
            <StatButton
              label="DOJ Attorney"
              approved={stats.attorney.approved}
              rejected={stats.attorney.rejected}
              icon={<Scale className="h-5 w-5 text-indigo-500" />}
              colorClass="border-indigo-500/30 hover:bg-indigo-500/10"
            />
            <StatButton
              label="State Dept"
              approved={stats.state.approved}
              rejected={stats.state.rejected}
              icon={<Building className="h-5 w-5 text-teal-500" />}
              colorClass="border-teal-500/30 hover:bg-teal-500/10"
            />
            <StatButton
              label="Gang RP"
              approved={stats.gang.approved}
              rejected={stats.gang.rejected}
              icon={<Users2 className="h-5 w-5 text-yellow-500" />}
              colorClass="border-yellow-500/30 hover:bg-yellow-500/10"
            />
            <StatButton
              label="Staff"
              approved={stats.staff.approved}
              rejected={stats.staff.rejected}
              icon={<Users className="h-5 w-5 text-purple-400" />}
              colorClass="border-purple-400/30 hover:bg-purple-400/10"
            />
            <StatButton
              label="Ban Appeals"
              approved={stats.banAppeal.approved}
              rejected={stats.banAppeal.rejected}
              icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
              colorClass="border-red-400/30 hover:bg-red-400/10"
            />
            <StatButton
              label="Creator"
              approved={stats.creator.approved}
              rejected={stats.creator.rejected}
              icon={<Youtube className="h-5 w-5 text-pink-500" />}
              colorClass="border-pink-500/30 hover:bg-pink-500/10"
            />
            <StatButton
              label="Firefighter"
              approved={stats.firefighter.approved}
              rejected={stats.firefighter.rejected}
              icon={<Flame className="h-5 w-5 text-orange-600" />}
              colorClass="border-orange-600/30 hover:bg-orange-600/10"
            />
            <StatButton
              label="Weazel News"
              approved={stats.weazel.approved}
              rejected={stats.weazel.rejected}
              icon={<Tv className="h-5 w-5 text-cyan-500" />}
              colorClass="border-cyan-500/30 hover:bg-cyan-500/10"
            />
            <StatButton
              label="PDM"
              approved={stats.pdm.approved}
              rejected={stats.pdm.rejected}
              icon={<Briefcase className="h-5 w-5 text-green-500" />}
              colorClass="border-green-500/30 hover:bg-green-500/10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Department Stats - Separate Section */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <Store className="h-5 w-5" />
                <Badge variant="outline" className="text-lg px-3 py-1 border-amber-500/50 text-amber-400">
                  {getTotalCount(businessStats.total)}
                </Badge>
                Business Department
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-4">
                <span>Live count by category</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-medium">{businessStats.total.approved}</span>
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">{businessStats.total.rejected}</span>
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <StatButton
              label="Real Estate"
              approved={businessStats.realEstate.approved}
              rejected={businessStats.realEstate.rejected}
              icon={<Home className="h-5 w-5 text-emerald-500" />}
              colorClass="border-emerald-500/30 hover:bg-emerald-500/10"
            />
            <StatButton
              label="Food Joint"
              approved={businessStats.foodJoint.approved}
              rejected={businessStats.foodJoint.rejected}
              icon={<UtensilsCrossed className="h-5 w-5 text-orange-500" />}
              colorClass="border-orange-500/30 hover:bg-orange-500/10"
            />
            <StatButton
              label="Mechanic Shop"
              approved={businessStats.mechanicShop.approved}
              rejected={businessStats.mechanicShop.rejected}
              icon={<Wrench className="h-5 w-5 text-blue-500" />}
              colorClass="border-blue-500/30 hover:bg-blue-500/10"
            />
            <StatButton
              label="Tuner Shop"
              approved={businessStats.tunerShop.approved}
              rejected={businessStats.tunerShop.rejected}
              icon={<Gauge className="h-5 w-5 text-purple-500" />}
              colorClass="border-purple-500/30 hover:bg-purple-500/10"
            />
            <StatButton
              label="Entertainment"
              approved={businessStats.entertainment.approved}
              rejected={businessStats.entertainment.rejected}
              icon={<Music className="h-5 w-5 text-pink-500" />}
              colorClass="border-pink-500/30 hover:bg-pink-500/10"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
