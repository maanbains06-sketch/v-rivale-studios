import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

type CursorVariant = "default" | "hover" | "click" | "text" | "hidden";

const CustomCursor = () => {
  const [cursorVariant, setCursorVariant] = useState<CursorVariant>("default");
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 400 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Check if device has a mouse
    const hasPointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasPointer) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    const handleMouseDown = () => setCursorVariant("click");
    const handleMouseUp = () => setCursorVariant("default");

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Add event listeners for interactive elements
    const addHoverListeners = () => {
      const buttons = document.querySelectorAll("button, a, [role='button'], .cursor-pointer");
      const textInputs = document.querySelectorAll("input, textarea");
      
      buttons.forEach((el) => {
        el.addEventListener("mouseenter", () => setCursorVariant("hover"));
        el.addEventListener("mouseleave", () => setCursorVariant("default"));
      });
      
      textInputs.forEach((el) => {
        el.addEventListener("mouseenter", () => setCursorVariant("text"));
        el.addEventListener("mouseleave", () => setCursorVariant("default"));
      });
    };

    // Initial setup and observe for new elements
    addHoverListeners();
    
    const observer = new MutationObserver(() => {
      addHoverListeners();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      observer.disconnect();
    };
  }, [cursorX, cursorY]);

  const variants = {
    default: {
      width: 16,
      height: 16,
      backgroundColor: "transparent",
      border: "2px solid hsl(185 90% 65%)",
      mixBlendMode: "difference" as const,
    },
    hover: {
      width: 48,
      height: 48,
      backgroundColor: "hsl(185 90% 65% / 0.2)",
      border: "2px solid hsl(185 90% 65%)",
      mixBlendMode: "normal" as const,
    },
    click: {
      width: 12,
      height: 12,
      backgroundColor: "hsl(185 90% 65%)",
      border: "none",
      mixBlendMode: "normal" as const,
    },
    text: {
      width: 4,
      height: 32,
      backgroundColor: "hsl(185 90% 65%)",
      border: "none",
      borderRadius: "2px",
      mixBlendMode: "normal" as const,
    },
    hidden: {
      width: 0,
      height: 0,
      opacity: 0,
    },
  };

  // Don't render on touch devices
  if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }

  return (
    <>
      {/* Main cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={cursorVariant}
        variants={variants}
        transition={{ type: "spring", damping: 25, stiffness: 400, mass: 0.5 }}
        initial={false}
      >
        {cursorVariant === "hover" && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              background: "radial-gradient(circle, hsl(185 90% 65% / 0.3), transparent)",
            }}
          />
        )}
      </motion.div>
      
      {/* Trailing dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] w-2 h-2 rounded-full bg-primary/60"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: cursorVariant === "click" ? 0.5 : 1,
        }}
      />
      
      {/* Glow trail */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997] w-24 h-24 rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, hsl(185 90% 65% / 0.1), transparent 70%)",
        }}
        animate={{
          opacity: isVisible && cursorVariant === "hover" ? 1 : 0,
          scale: cursorVariant === "hover" ? 1.5 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Hide default cursor */}
      <style>{`
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default CustomCursor;
