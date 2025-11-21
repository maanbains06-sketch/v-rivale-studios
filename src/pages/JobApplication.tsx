import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import JobApplicationForm from "@/components/JobApplicationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Heart, Wrench } from "lucide-react";
import headerJobs from "@/assets/feature-jobs.jpg";

const JobApplication = () => {
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
        </div>
      </main>
    </div>
  );
};

export default JobApplication;
