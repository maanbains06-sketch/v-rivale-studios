import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import JobApplicationForm from "@/components/JobApplicationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Heart, Wrench, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import headerJobs from "@/assets/feature-jobs.jpg";
import jobPoliceImg from "@/assets/job-police.jpg";
import jobEmsImg from "@/assets/job-ems.jpg";
import jobMechanicImg from "@/assets/job-mechanic.jpg";

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
                <h2 className="text-3xl font-bold text-gradient mb-3">Choose Your Career Path</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Join one of San Andreas' most prestigious departments. Each position offers unique opportunities for growth, competitive benefits, and the chance to make a real difference in our community.
                </p>
              </div>

              {/* Job Overview Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={jobPoliceImg} 
                      alt="Police Department" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Police Department</h3>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Join LSPD and uphold justice in San Andreas. Protect, serve, and maintain order.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Competitive Pay</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Career Advancement</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Full Training Provided</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={jobEmsImg} 
                      alt="EMS Department" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">EMS</h3>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Save lives and provide critical emergency care when every second counts.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Life-Saving Impact</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Medical Training</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>24/7 Operations</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={jobMechanicImg} 
                      alt="Mechanic" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wrench className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Mechanic</h3>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Master automotive excellence and keep the city's vehicles running smoothly.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Hands-On Work</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Technical Skills</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Flexible Hours</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="police" className="w-full">
                <TabsList className="grid w-full grid-cols-3 glass-effect p-1">
                  <TabsTrigger value="police" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Police</span>
                  </TabsTrigger>
                  <TabsTrigger value="ems" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">EMS</span>
                  </TabsTrigger>
                  <TabsTrigger value="mechanic" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                    <Wrench className="w-4 h-4" />
                    <span className="hidden sm:inline">Mechanic</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-8">
                  <TabsContent value="police" className="space-y-6 mt-0">
                    <JobApplicationForm jobType="Police Department" jobImage={jobPoliceImg} />
                  </TabsContent>
                  
                  <TabsContent value="ems" className="space-y-6 mt-0">
                    <JobApplicationForm jobType="EMS" jobImage={jobEmsImg} />
                  </TabsContent>
                  
                  <TabsContent value="mechanic" className="space-y-6 mt-0">
                    <JobApplicationForm jobType="Mechanic" jobImage={jobMechanicImg} />
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
