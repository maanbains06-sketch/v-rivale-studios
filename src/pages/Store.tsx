import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";

const Store = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="SLRP Store"
        description="Exclusive merchandise and server perks"
        badge="Coming Soon"
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center min-h-[40vh] flex flex-col items-center justify-center">
            <p className="text-xl text-muted-foreground max-w-2xl">
              Exclusive SLRP merchandise and server perks will be available soon. Stay tuned for updates!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Store;
