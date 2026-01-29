import { useEffect, memo, useRef } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

// Ultra-minimal loading screen - completes ASAP
export const LoadingScreen = memo(({ onComplete, minDuration = 100 }: LoadingScreenProps) => {
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    
    // Complete immediately after a single frame
    const rafId = requestAnimationFrame(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    });

    // Safety fallback
    const timeout = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }, minDuration);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeout);
    };
  }, [minDuration, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
