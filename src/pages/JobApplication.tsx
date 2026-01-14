import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import JobApplicationForm from "@/components/JobApplicationForm";
import FirefighterApplicationForm from "@/components/FirefighterApplicationForm";
import PDMApplicationForm from "@/components/PDMApplicationForm";
import DOJApplicationForm from "@/components/DOJApplicationForm";
import WeazelNewsApplicationForm from "@/components/WeazelNewsApplicationForm";
import { JobCardsSkeletonGrid } from "@/components/JobCardSkeleton";
import { Shield, Heart, Wrench, Flame, AlertCircle, CheckCircle2, Car, Scale, Gavel, Newspaper, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWhitelistAccess } from "@/hooks/useWhitelistAccess";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import ApplicationsPausedAlert from "@/components/ApplicationsPausedAlert";
import headerJobs from "@/assets/feature-jobs.jpg";
import jobPoliceImg from "@/assets/job-police.jpg";
import jobEmsImg from "@/assets/job-ems.jpg";
import jobMechanicImg from "@/assets/job-mechanic.jpg";
import jobFirefighterImg from "@/assets/job-firefighter.jpg";
import jobPdmImg from "@/assets/job-pdm.jpg";
import headerDoj from "@/assets/header-doj.jpg";
import jobWeazelNewsImg from "@/assets/job-weazel-news.jpg";

const JobApplication = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  
  // Use Discord whitelist role for access control
  const { hasAccess, isInServer, hasWhitelistRole, loading: accessLoading, refreshAccess } = useWhitelistAccess();
  const { settings: siteSettings, loading: settingsLoading } = useSiteSettings();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const jobCategories = [
    {
      id: "police",
      name: "Police Department",
      icon: Shield,
      color: "primary",
      image: jobPoliceImg,
      description: "Join LSPD and uphold justice in San Andreas. Protect, serve, and maintain order.",
      benefits: ["Competitive Pay", "Career Advancement", "Full Training Provided"],
    },
    {
      id: "ems",
      name: "EMS",
      icon: Heart,
      color: "primary",
      image: jobEmsImg,
      description: "Save lives and provide critical emergency care when every second counts.",
      benefits: ["Life-Saving Impact", "Medical Training", "24/7 Operations"],
    },
    {
      id: "firefighter",
      name: "Fire Department",
      icon: Flame,
      color: "orange-500",
      image: jobFirefighterImg,
      description: "Battle blazes and rescue citizens. Be a hero in the fire department.",
      benefits: ["Hero Status", "Team Environment", "Exciting Missions"],
    },
    {
      id: "mechanic",
      name: "Mechanic",
      icon: Wrench,
      color: "primary",
      image: jobMechanicImg,
      description: "Master automotive excellence and keep the city's vehicles running smoothly.",
      benefits: ["Hands-On Work", "Technical Skills", "Flexible Hours"],
    },
    {
      id: "pdm",
      name: "PDM Dealership",
      icon: Car,
      color: "cyan-500",
      image: jobPdmImg,
      description: "Sell luxury vehicles and help customers find their dream cars.",
      benefits: ["Commission Pay", "Sales Training", "Premium Environment"],
    },
    {
      id: "judge",
      name: "DOJ - Judge",
      icon: Gavel,
      color: "amber-500",
      image: headerDoj,
      description: "Preside over court cases and deliver justice in San Andreas courts.",
      benefits: ["High Authority", "Legal Expertise", "Important Decisions"],
    },
    {
      id: "lawyer",
      name: "DOJ - Attorney",
      icon: Scale,
      color: "emerald-500",
      image: headerDoj,
      description: "Represent clients in court and fight for justice as a defense attorney.",
      benefits: ["Legal Career", "Court Appearances", "Client Advocacy"],
    },
    {
      id: "weazel-news",
      name: "Weazel News",
      icon: Newspaper,
      color: "red-500",
      image: jobWeazelNewsImg,
      description: "Report breaking news and cover the biggest stories in Los Santos.",
      benefits: ["Media Exposure", "Exclusive Access", "Creative Freedom"],
    },
  ];

  const isPageLoading = loading || accessLoading || settingsLoading;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="Job Applications"
          description="Apply for various positions in San Andreas"
          badge="Join Our Team"
          backgroundImage={headerJobs}
        />
        <main className="container mx-auto px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gradient mb-3">Choose Your Career Path</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join one of San Andreas' most prestigious departments. Each position offers unique opportunities for growth and the chance to make a real difference.
              </p>
            </div>
            <JobCardsSkeletonGrid />
          </div>
        </main>
      </div>
    );
  }

  const renderForm = () => {
    switch (selectedForm) {
      case "police":
        return <JobApplicationForm jobType="Police Department" jobImage={jobPoliceImg} />;
      case "ems":
        return <JobApplicationForm jobType="EMS" jobImage={jobEmsImg} />;
      case "firefighter":
        return <FirefighterApplicationForm jobImage={jobFirefighterImg} />;
      case "mechanic":
        return <JobApplicationForm jobType="Mechanic" jobImage={jobMechanicImg} />;
      case "pdm":
        return <PDMApplicationForm jobImage={jobPdmImg} />;
      case "judge":
        return <DOJApplicationForm applicationType="judge" jobImage={headerDoj} />;
      case "lawyer":
        return <DOJApplicationForm applicationType="lawyer" jobImage={headerDoj} />;
      case "weazel-news":
        return <WeazelNewsApplicationForm jobImage={jobWeazelNewsImg} />;
      default:
        return null;
    }
  };

  const renderAccessDenied = () => {
    if (!user) {
      return (
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
      );
    }

    if (!isInServer) {
      return (
        <Alert className="glass-effect border-border/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Join Our Discord Server</AlertTitle>
          <AlertDescription className="mt-2">
            You must be a member of our Discord server to access job applications.
            <div className="mt-4 flex gap-3">
              <Button asChild>
                <a href="https://discord.gg/slrp" target="_blank" rel="noopener noreferrer">
                  Join Discord Server
                </a>
              </Button>
              <Button variant="outline" onClick={refreshAccess}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (!hasWhitelistRole) {
      return (
        <Alert className="glass-effect border-border/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Whitelist Role Required</AlertTitle>
          <AlertDescription className="mt-2">
            You need the whitelist role in our Discord server to access job applications. 
            Apply for whitelist or contact server staff if you believe you should have access.
            <div className="mt-4 flex gap-3">
              <Button onClick={() => navigate("/whitelist")}>
                Apply for Whitelist
              </Button>
              <Button variant="outline" onClick={refreshAccess}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Job Applications"
        description="Apply for various positions in San Andreas"
        badge="Join Our Team"
        backgroundImage={headerJobs}
      />
      
      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {siteSettings.applications_paused ? (
            <ApplicationsPausedAlert variant="card" applicationType="Job Applications" />
          ) : !hasAccess ? (
            renderAccessDenied()
          ) : selectedForm ? (
            <div className="space-y-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedForm(null)}
                className="mb-4"
              >
                ← Back to Job Categories
              </Button>
              {renderForm()}
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gradient mb-3">Choose Your Career Path</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Join one of San Andreas' most prestigious departments. Each position offers unique opportunities for growth and the chance to make a real difference.
                </p>
              </div>

              {/* Job Category Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {jobCategories.map((job) => {
                  const Icon = job.icon;
                  return (
                    <Card 
                      key={job.id}
                      className="glass-effect border-border/20 hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1"
                      onClick={() => setSelectedForm(job.id)}
                    >
                      <div className="relative h-36 overflow-hidden">
                        <img 
                          src={job.image} 
                          alt={job.name} 
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent group-hover:via-background/40 transition-all duration-300" />
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                              <Icon className={`w-4 h-4 text-${job.color} group-hover:text-primary transition-colors duration-300`} />
                            </div>
                            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300">{job.name}</h3>
                          </div>
                        </div>
                      </div>
                      <CardContent className="pt-3 pb-4 space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors duration-300">
                          {job.description}
                        </p>
                        <div className="space-y-1">
                          {job.benefits.map((benefit, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground/70 transition-all duration-300"
                              style={{ transitionDelay: `${idx * 50}ms` }}
                            >
                              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                              <span className="group-hover:translate-x-0.5 transition-transform duration-300">{benefit}</span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full mt-3 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300"
                        >
                          <span className="group-hover:scale-105 transition-transform duration-300">Apply Now</span>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobApplication;