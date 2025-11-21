import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
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
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            Job application forms coming soon
          </p>
        </div>
      </main>
    </div>
  );
};

export default JobApplication;
