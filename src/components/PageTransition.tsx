import { ReactNode, memo } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Simplified page transition - removed framer-motion animations for performance
// This prevents layout thrashing and stuck pages
export const PageTransition = memo(({ children }: PageTransitionProps) => {
  return <>{children}</>;
});

PageTransition.displayName = "PageTransition";
