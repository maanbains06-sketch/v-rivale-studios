import { useEffect, useState, memo } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

// Ultra-simplified loading screen - no animations, maximum performance
export const LoadingScreen = memo(({ onComplete, minDuration = 500 }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

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
    }, 50);

    // Safety timeout - force complete after duration + 500ms
    const safetyTimeout = setTimeout(() => {
      clearInterval(interval);
      setIsComplete(true);
      onComplete?.();
    }, minDuration + 500);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, [minDuration, onComplete]);

  if (isComplete) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Simple logo */}
        <div className="w-20 h-20 flex items-center justify-center rounded-full border-2 border-primary/30 bg-card">
          <span className="text-2xl font-bold text-primary">SL</span>
        </div>

        {/* Brand text */}
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-widest mb-1">
            SKYLIFE ROLEPLAY
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest">
            INDIA
          </p>
        </div>

        {/* Simple progress bar */}
        <div className="w-48">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ 
                width: `${progress}%`,
                transition: 'width 0.05s linear'
              }}
            />
          </div>
          <div className="text-center mt-2 text-xs text-muted-foreground font-mono">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
