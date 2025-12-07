import { Rocket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LaunchingBanner = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary via-secondary to-primary animate-gradient-x cursor-pointer"
      onClick={() => navigate("/whitelist")}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 py-2.5 text-primary-foreground">
          <Rocket className="w-4 h-4 animate-bounce" />
          <span className="font-semibold text-sm md:text-base tracking-wide">
            🚀 LAUNCHING SOON
          </span>
          <span className="hidden sm:inline text-primary-foreground/90">•</span>
          <span className="hidden sm:flex items-center gap-1 text-sm md:text-base">
            <Sparkles className="w-4 h-4" />
            Pre-Registration Open
          </span>
          <span className="text-xs md:text-sm bg-background/20 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
            Apply Now
          </span>
        </div>
      </div>
    </div>
  );
};

export default LaunchingBanner;
