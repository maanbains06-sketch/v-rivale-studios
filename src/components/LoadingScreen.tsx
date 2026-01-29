import { useEffect, memo, useRef } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

/**
 * Ultra-minimal loading screen - completes instantly for returning visitors
 */
export const LoadingScreen = memo(({ onComplete, minDuration = 50 }: LoadingScreenProps) => {
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    
    // Complete on next animation frame for smooth transition
    const rafId = requestAnimationFrame(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    });

    // Fallback timeout
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
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      style={{ contain: 'layout paint' }}
    >
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
});

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
