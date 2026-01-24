import { useEffect, useState, memo, useRef } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

// Ultra-fast loading screen - uses requestAnimationFrame for smooth 60fps
export const LoadingScreen = memo(({ onComplete, minDuration = 100 }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    let rafId: number;
    
    const animate = () => {
      if (completedRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100 && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
        return;
      }
      
      rafId = requestAnimationFrame(animate);
    };
    
    rafId = requestAnimationFrame(animate);
    
    // Safety timeout - force complete
    const safetyTimeout = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, minDuration + 200);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(safetyTimeout);
    };
  }, [minDuration, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Simple spinner */}
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        
        {/* Compact branding */}
        <div className="text-center">
          <span className="text-sm font-bold tracking-widest text-foreground">SKYLIFE</span>
        </div>

        {/* Progress bar */}
        <div className="w-40 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full gpu-accelerated"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
