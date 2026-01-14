import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, memo } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = memo(({ children }: PageTransitionProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = "PageTransition";
