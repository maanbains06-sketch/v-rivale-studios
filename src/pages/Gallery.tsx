import Navigation from "@/components/Navigation";

const Gallery = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center min-h-[60vh] flex flex-col items-center justify-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">Coming Soon</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Our media gallery featuring screenshots and videos from the community will be available soon. Check back later!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Gallery;
