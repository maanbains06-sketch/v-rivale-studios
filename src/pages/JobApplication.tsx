import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import JobApplicationForm from "@/components/JobApplicationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Heart, Wrench, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import headerJobs from "@/assets/feature-jobs.jpg";

const JobApplication = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [whitelistStatus, setWhitelistStatus] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkWhitelistStatus();
  }, []);

  const checkWhitelistStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(user);

      // Check whitelist application status
      const { data: application } = await supabase
        .from("whitelist_applications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setWhitelistStatus(application?.status || null);
    } catch (error) {
      console.error("Error checking whitelist status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="Job Applications"
          description="Apply for Police Department, EMS, or Mechanic positions"
          badge="Join Our Team"
          backgroundImage={headerJobs}
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
        title="Job Applications"
        description="Apply for Police Department, EMS, or Mechanic positions"
        badge="Join Our Team"
        backgroundImage={headerJobs}
      />
      
      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {!user ? (
            <Alert className="glass-effect border-border/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription className="mt-2">
                You must be logged in to access job applications.
                <div className="mt-4">
                  <Button onClick={() => navigate("/auth")}>
                    Login / Sign Up
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : whitelistStatus !== "approved" ? (
            <Alert className="glass-effect border-border/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Whitelist Required</AlertTitle>
              <AlertDescription className="mt-2">
                {whitelistStatus === "pending" ? (
                  <>
                    Your whitelist application is currently under review. You'll be able to apply for jobs once your whitelist application is approved.
                  </>
                ) : whitelistStatus === "rejected" ? (
                  <>
                    Your whitelist application was not approved. Please contact server administration for more information.
                  </>
                ) : (
                  <>
                    You must be whitelisted to access job applications. Please submit a whitelist application first.
                    <div className="mt-4">
                      <Button onClick={() => navigate("/whitelist")}>
                        Apply for Whitelist
                      </Button>
                    </div>
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gradient mb-3">Choose Your Career Path</h2>
                <p className="text-muted-foreground">
                  Select a position below to submit your application. All fields are required unless marked optional.
                </p>
              </div>

              <Tabs defaultValue="police" className="w-full">
                <TabsList className="grid w-full grid-cols-3 glass-effect">
                  <TabsTrigger value="police" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Police
                  </TabsTrigger>
                  <TabsTrigger value="ems" className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    EMS
                  </TabsTrigger>
                  <TabsTrigger value="mechanic" className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Mechanic
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="police" className="space-y-4">
                    <JobApplicationForm jobType="Police Department" />
                  </TabsContent>
                  
                  <TabsContent value="ems" className="space-y-4">
                    <JobApplicationForm jobType="EMS" />
                  </TabsContent>
                  
                  <TabsContent value="mechanic" className="space-y-4">
                    <JobApplicationForm jobType="Mechanic" />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobApplication;
