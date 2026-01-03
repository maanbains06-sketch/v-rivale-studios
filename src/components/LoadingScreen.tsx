import { useEffect, useState, memo } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

// Ultra-fast minimal loading screen
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

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      style={{ 
        opacity: isComplete ? 0 : 1, 
        transition: 'opacity 0.15s',
        pointerEvents: isComplete ? "none" : "auto" 
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div 
          className="text-2xl font-bold text-primary"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          SKYLIFE
        </div>
        <div className="w-40 h-0.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
          />
        </div>
      </div>
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
