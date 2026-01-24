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
  RefreshCw
} from "lucide-react";

interface ApplicationStats {
  whitelist: number;
  police: number;
  ems: number;
  mechanic: number;
  judge: number;
  attorney: number;
  state: number;
  gang: number;
  staff: number;
  banAppeal: number;
  creator: number;
  firefighter: number;
  weazel: number;
  pdm: number;
}

interface StatButtonProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
}

const StatButton = ({ label, count, icon, colorClass, onClick }: StatButtonProps) => (
  <Button
    variant="outline"
    className={`flex flex-col items-center justify-center h-24 w-full gap-1 hover:scale-105 transition-transform ${colorClass}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-2xl font-bold">{count}</span>
    </div>
    <span className="text-xs text-muted-foreground">{label}</span>
  </Button>
);

export const LiveApplicationStats = () => {
  const [stats, setStats] = useState<ApplicationStats>({
    whitelist: 0,
    police: 0,
    ems: 0,
    mechanic: 0,
    judge: 0,
    attorney: 0,
    state: 0,
    gang: 0,
    staff: 0,
    banAppeal: 0,
    creator: 0,
    firefighter: 0,
    weazel: 0,
    pdm: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all approved/closed counts in parallel (approved OR closed both count as completed approvals)
      const [
        whitelistRes,
        jobsRes,
        staffRes,
        banAppealRes,
        creatorRes,
        firefighterRes,
        weazelRes,
        pdmRes,
      ] = await Promise.all([
        supabase.from("whitelist_applications").select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]),
        supabase.from("job_applications").select("id, job_type").in("status", ["approved", "closed"]),
        supabase.from("staff_applications").select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]),
        supabase.from("ban_appeals").select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]),
        supabase.from("creator_applications").select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]),
        supabase.from("firefighter_applications").select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]),
        supabase.from("weazel_news_applications").select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]),
        supabase.from("pdm_applications").select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]),
      ]);

      // Fetch gang applications separately (may not exist in all projects)
      let gangCount = 0;
      try {
        const { count } = await supabase.from("gang_applications" as any).select("id", { count: "exact", head: true }).in("status", ["approved", "closed"]);
        gangCount = count || 0;
      } catch {
        gangCount = 0;
      }

      // Process job applications by type
      const jobApps = jobsRes.data || [];
      const jobCounts = {
        police: jobApps.filter(j => j.job_type?.toLowerCase().includes("police") || j.job_type?.toLowerCase().includes("pd")).length,
        ems: jobApps.filter(j => j.job_type?.toLowerCase().includes("ems") || j.job_type?.toLowerCase().includes("emergency")).length,
        mechanic: jobApps.filter(j => j.job_type?.toLowerCase().includes("mechanic")).length,
        judge: jobApps.filter(j => j.job_type?.toLowerCase().includes("judge")).length,
        attorney: jobApps.filter(j => j.job_type?.toLowerCase().includes("attorney")).length,
        state: jobApps.filter(j => j.job_type?.toLowerCase().includes("state")).length,
      };

      setStats({
        whitelist: whitelistRes.count || 0,
        police: jobCounts.police,
        ems: jobCounts.ems,
        mechanic: jobCounts.mechanic,
        judge: jobCounts.judge,
        attorney: jobCounts.attorney,
        state: jobCounts.state,
        gang: gangCount,
        staff: staffRes.count || 0,
        banAppeal: banAppealRes.count || 0,
        creator: creatorRes.count || 0,
        firefighter: firefighterRes.count || 0,
        weazel: weazelRes.count || 0,
        pdm: pdmRes.count || 0,
      });
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const totalApproved = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {totalApproved}
              </Badge>
              Number of Applications
            </CardTitle>
            <CardDescription className="mt-1">
              Live count of all approved & closed applications on the website
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
            count={stats.whitelist}
            icon={<Shield className="h-5 w-5 text-blue-500" />}
            colorClass="border-blue-500/30 hover:bg-blue-500/10"
          />
          <StatButton
            label="Police"
            count={stats.police}
            icon={<Siren className="h-5 w-5 text-blue-400" />}
            colorClass="border-blue-400/30 hover:bg-blue-400/10"
          />
          <StatButton
            label="EMS"
            count={stats.ems}
            icon={<Ambulance className="h-5 w-5 text-red-500" />}
            colorClass="border-red-500/30 hover:bg-red-500/10"
          />
          <StatButton
            label="Mechanic"
            count={stats.mechanic}
            icon={<Car className="h-5 w-5 text-orange-500" />}
            colorClass="border-orange-500/30 hover:bg-orange-500/10"
          />
          <StatButton
            label="DOJ Judge"
            count={stats.judge}
            icon={<Gavel className="h-5 w-5 text-purple-500" />}
            colorClass="border-purple-500/30 hover:bg-purple-500/10"
          />
          <StatButton
            label="DOJ Attorney"
            count={stats.attorney}
            icon={<Scale className="h-5 w-5 text-indigo-500" />}
            colorClass="border-indigo-500/30 hover:bg-indigo-500/10"
          />
          <StatButton
            label="State Dept"
            count={stats.state}
            icon={<Building className="h-5 w-5 text-teal-500" />}
            colorClass="border-teal-500/30 hover:bg-teal-500/10"
          />
          <StatButton
            label="Gang RP"
            count={stats.gang}
            icon={<Users2 className="h-5 w-5 text-yellow-500" />}
            colorClass="border-yellow-500/30 hover:bg-yellow-500/10"
          />
          <StatButton
            label="Staff"
            count={stats.staff}
            icon={<Users className="h-5 w-5 text-purple-400" />}
            colorClass="border-purple-400/30 hover:bg-purple-400/10"
          />
          <StatButton
            label="Ban Appeals"
            count={stats.banAppeal}
            icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
            colorClass="border-red-400/30 hover:bg-red-400/10"
          />
          <StatButton
            label="Creator"
            count={stats.creator}
            icon={<Youtube className="h-5 w-5 text-pink-500" />}
            colorClass="border-pink-500/30 hover:bg-pink-500/10"
          />
          <StatButton
            label="Firefighter"
            count={stats.firefighter}
            icon={<Flame className="h-5 w-5 text-orange-600" />}
            colorClass="border-orange-600/30 hover:bg-orange-600/10"
          />
          <StatButton
            label="Weazel News"
            count={stats.weazel}
            icon={<Tv className="h-5 w-5 text-cyan-500" />}
            colorClass="border-cyan-500/30 hover:bg-cyan-500/10"
          />
          <StatButton
            label="PDM"
            count={stats.pdm}
            icon={<Briefcase className="h-5 w-5 text-green-500" />}
            colorClass="border-green-500/30 hover:bg-green-500/10"
          />
        </div>
      </CardContent>
    </Card>
  );
};
