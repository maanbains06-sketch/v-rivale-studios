import { ReactNode, memo } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Ultra-minimal page transition for maximum performance
export const PageTransition = memo(({ children }: PageTransitionProps) => {
  // Check for reduced motion or mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Skip all transitions on mobile or reduced motion
  if (prefersReducedMotion || isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      {children}
    </div>
  );
});

PageTransition.displayName = "PageTransition";
