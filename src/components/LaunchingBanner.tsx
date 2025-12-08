import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LaunchingBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center py-2">
      <button
        onClick={() => navigate("/whitelist")}
        className="group relative overflow-hidden rounded-full px-6 py-2.5 bg-gradient-to-r from-primary/80 via-secondary/80 to-primary/80 backdrop-blur-md border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary),0.5)] transition-all duration-500 hover:scale-105"
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-50 blur-xl group-hover:opacity-80 transition-opacity animate-gradient-x" />
        
        {/* Content */}
        <div className="relative flex items-center gap-3 text-primary-foreground">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-foreground"></span>
          </span>
          
          <span className="font-semibold text-sm md:text-base tracking-wide flex items-center gap-2">
            <span>Launching Soon</span>
            <span className="text-primary-foreground/70">•</span>
            <span className="flex items-center gap-1.5">
              Pre-Registration Open
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
          </span>
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </button>
    </div>
  );
};

export default LaunchingBanner;
