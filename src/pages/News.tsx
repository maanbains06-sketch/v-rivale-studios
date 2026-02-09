import PageHeader from "@/components/PageHeader";
import { Newspaper } from "lucide-react";

const News = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="City Chronicle"
        description="AI-Powered RP News — Coming Soon"
      />
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Newspaper className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">City Chronicle</h2>
          <p className="text-muted-foreground max-w-md">
            Auto-generated RP news articles powered by AI. Stay tuned for the latest stories from the streets of Skylife.
          </p>
        </div>
      </div>
    </div>
  );
};

export default News;
