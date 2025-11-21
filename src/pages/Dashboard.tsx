import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Briefcase, Ban, Clock } from "lucide-react";
import { format } from "date-fns";
import headerCommunity from "@/assets/header-community.jpg";

interface WhitelistApplication {
  id: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface JobApplication {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface BanAppeal {
  id: string;
  status: string;
  created_at: string;
  ban_reason: string;
  admin_notes?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [whitelistApps, setWhitelistApps] = useState<WhitelistApplication[]>([]);
  const [jobApps, setJobApps] = useState<JobApplication[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      await loadAllApplications(user.id);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllApplications = async (userId: string) => {
    // Load whitelist applications
    const { data: whitelistData } = await supabase
      .from("whitelist_applications")
      .select("id, status, created_at, admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (whitelistData) setWhitelistApps(whitelistData);

    // Load job applications
    const { data: jobData } = await supabase
      .from("job_applications")
      .select("id, job_type, status, created_at, admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (jobData) setJobApps(jobData);

    // Load ban appeals
    const { data: banData } = await supabase
      .from("ban_appeals")
      .select("id, status, created_at, ban_reason, admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (banData) setBanAppeals(banData);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="My Dashboard"
          description="Track all your applications in one place"
          badge="Applications"
          backgroundImage={headerCommunity}
        />
        <div className="container mx-auto px-4 pb-16 flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="My Dashboard"
        description="Track all your applications in one place"
        badge="Applications"
        backgroundImage={headerCommunity}
      />
      
      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Whitelist Applications */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-gradient">Whitelist Applications</CardTitle>
              </div>
              <CardDescription>Your server whitelist application status</CardDescription>
            </CardHeader>
            <CardContent>
              {whitelistApps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No whitelist applications found
                </p>
              ) : (
                <div className="space-y-4">
                  {whitelistApps.map((app) => (
                    <Card key={app.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                Submitted on {format(new Date(app.created_at), "PPP")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(app.created_at), "p")}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(app.status)}>
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                        {app.admin_notes && (
                          <div className="mt-4 p-3 rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">{app.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Applications */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <CardTitle className="text-gradient">Job Applications</CardTitle>
              </div>
              <CardDescription>Your job application statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {jobApps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No job applications found
                </p>
              ) : (
                <div className="space-y-4">
                  {jobApps.map((app) => (
                    <Card key={app.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold text-lg mb-2">{app.job_type}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Submitted on {format(new Date(app.created_at), "PPP")}</span>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(app.status)}>
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                        {app.admin_notes && (
                          <div className="mt-4 p-3 rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">{app.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ban Appeals */}
          {banAppeals.length > 0 && (
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Ban Appeals</CardTitle>
                </div>
                <CardDescription>Your ban appeal statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {banAppeals.map((appeal) => (
                    <Card key={appeal.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Ban Reason: {appeal.ban_reason}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Submitted on {format(new Date(appeal.created_at), "PPP")}</span>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(appeal.status)}>
                            {appeal.status.toUpperCase()}
                          </Badge>
                        </div>
                        {appeal.admin_notes && (
                          <div className="mt-4 p-3 rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Admin Response:</p>
                            <p className="text-sm text-muted-foreground">{appeal.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
