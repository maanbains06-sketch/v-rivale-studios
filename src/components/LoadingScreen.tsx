import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, memo } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

// Simplified, much faster loading screen
export const LoadingScreen = memo(({ onComplete, minDuration = 800 }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 32); // Reduced update frequency for better performance

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  // Skip animations for reduced motion preference
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        style={{ opacity: isComplete ? 0 : 1, transition: 'opacity 0.2s', pointerEvents: isComplete ? "none" : "auto" }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="text-3xl font-italiana font-bold text-primary">SLRP</div>
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      style={{ pointerEvents: isComplete ? "none" : "auto" }}
    >
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Simple logo */}
        <motion.div
          className="relative w-24 h-24 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Hexagon background */}
          <svg viewBox="0 0 100 100" className="absolute w-full h-full">
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
          </svg>

          {/* SLRP Text */}
          <div
            className="relative z-10 text-2xl font-italiana font-bold"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SL
          </div>
        </motion.div>

        {/* Brand text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h1 className="text-xl md:text-2xl font-italiana tracking-[0.2em] mb-1">
            SKYLIFE ROLEPLAY
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest">
            INDIA'S PREMIUM RP SERVER
          </p>
        </motion.div>

        {/* Simple progress bar */}
        <div className="w-48 md:w-64">
          <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-center mt-2 text-xs text-muted-foreground">
            <span className="font-mono text-primary">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
