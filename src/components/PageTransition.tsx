import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, memo, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Check for low-end device
const checkLowEndDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4) ||
    window.innerWidth < 640
  );
};

export const PageTransition = memo(({ children }: PageTransitionProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    setIsLowEnd(checkLowEndDevice());
  }, []);

  // Skip animations entirely on low-end devices or reduced motion preference
  if (prefersReducedMotion || isLowEnd) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.15,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = "PageTransition";
