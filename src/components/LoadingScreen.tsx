import { useEffect, memo, useRef } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

// Ultra-fast loading screen - minimal render, instant complete
export const LoadingScreen = memo(({ onComplete, minDuration = 100 }: LoadingScreenProps) => {
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    
    // Complete as fast as possible
    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, minDuration);

    return () => clearTimeout(timeout);
  }, [minDuration, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background gpu-accelerated">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-widest text-foreground opacity-80">SKYLIFE</span>
      </div>
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
