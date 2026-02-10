import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import SpinWheel from "@/components/spin/SpinWheel";

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
        <div className="container mx-auto px-4 flex flex-col items-center">
          <SpinWheel />
        </div>
      </main>
    </div>
  );
};

export default Spin;
