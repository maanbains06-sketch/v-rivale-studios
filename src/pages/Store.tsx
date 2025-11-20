import Navigation from "@/components/Navigation";

const Store = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
            Coming Soon
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Exclusive SLRP merchandise and server perks will be available soon. Stay tuned for updates!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Store;
