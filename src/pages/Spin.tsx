import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";

const Spin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Spin & Win"
        description="Try your luck and win amazing rewards"
        pageKey="spin"
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Content coming soon */}
        </div>
      </main>
    </div>
  );
};

export default Spin;
