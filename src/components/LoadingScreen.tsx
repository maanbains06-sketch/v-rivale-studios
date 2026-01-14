import { useReducedMotion } from "framer-motion";
import { useEffect, useState, memo } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

// Ultra-lightweight loading screen for maximum performance
export const LoadingScreen = memo(({ onComplete, minDuration = 400 }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const startTime = Date.now();
    
    // Use requestAnimationFrame for smoother updates
    let animationFrame: number;
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        setIsComplete(true);
        onComplete?.();
      } else {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };
    
    animationFrame = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [minDuration, onComplete]);

  // Ultra-minimal for reduced motion or low-end devices
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        style={{ opacity: isComplete ? 0 : 1, transition: 'opacity 0.15s', pointerEvents: isComplete ? "none" : "auto" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-2xl font-bold text-primary">SLRP</div>
          <div className="w-40 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      style={{ 
        opacity: isComplete ? 0 : 1, 
        transition: 'opacity 0.15s',
        pointerEvents: isComplete ? "none" : "auto" 
      }}
    >
      {/* Simple gradient background - no animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      {/* Main content - minimal DOM */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Simple logo */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute w-full h-full">
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
          </svg>
          <div
            className="relative z-10 text-xl font-bold"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SL
          </div>
        </div>

        {/* Brand text */}
        <div className="text-center">
          <h1 className="text-lg md:text-xl font-bold tracking-[0.15em] mb-1" style={{ textShadow: 'none' }}>
            SKYLIFE ROLEPLAY
          </h1>
          <p className="text-[10px] text-muted-foreground tracking-widest">
            INDIA'S PREMIUM RP SERVER
          </p>
        </div>

        {/* Simple progress bar */}
        <div className="w-40 md:w-56">
          <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}
            />
          </div>
          <div className="flex justify-center mt-1.5 text-xs text-muted-foreground">
            <span className="font-mono text-primary">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
