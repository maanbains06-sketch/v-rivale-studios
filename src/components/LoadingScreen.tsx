import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export const LoadingScreen = ({ onComplete, minDuration = 2500 }: LoadingScreenProps) => {
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
        setTimeout(() => {
          setIsComplete(true);
          onComplete?.();
        }, 300);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      style={{ pointerEvents: isComplete ? "none" : "auto" }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        {/* Scanning line effect */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
          initial={{ top: "-2px" }}
          animate={{ top: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Glowing orbs */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px]"
          animate={{
            x: ["-20%", "120%"],
            y: ["20%", "80%"],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ top: "20%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-[200px] h-[200px] rounded-full bg-neon-cyan/15 blur-[80px]"
          animate={{
            x: ["120%", "-20%"],
            y: ["60%", "20%"],
          }}
          transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ top: "40%", right: "-10%" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Hexagon Logo Container */}
        <div className="relative">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute -inset-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  <stop offset="70%" stopColor="hsl(var(--neon-cyan))" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#ringGradient)"
                strokeWidth="2"
                strokeDasharray="565.48"
                strokeDashoffset="282.74"
              />
            </svg>
          </motion.div>

          {/* Inner pulsing ring */}
          <motion.div
            className="absolute -inset-4"
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.3"
              />
            </svg>
          </motion.div>

          {/* Hexagon with logo */}
          <motion.div
            className="relative w-32 h-32 flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Hexagon background */}
            <svg viewBox="0 0 100 100" className="absolute w-full h-full">
              <defs>
                <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--neon-cyan))" />
                </linearGradient>
                <filter id="hexGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <polygon
                points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                fill="hsl(var(--card))"
                stroke="url(#hexGradient)"
                strokeWidth="2"
                filter="url(#hexGlow)"
              />
            </svg>

            {/* SLRP Text */}
            <motion.div
              className="relative z-10 text-3xl font-italiana font-bold tracking-wider"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-cyan)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 30px hsl(var(--primary) / 0.5)",
              }}
              animate={{ 
                textShadow: [
                  "0 0 20px hsl(var(--primary) / 0.3)",
                  "0 0 40px hsl(var(--primary) / 0.6)",
                  "0 0 20px hsl(var(--primary) / 0.3)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              SL
            </motion.div>
          </motion.div>

          {/* Orbiting particles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary"
              style={{
                boxShadow: "0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))",
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.5,
              }}
              initial={{
                x: 0,
                y: -70 - i * 10,
              }}
            >
              <motion.div
                className="w-full h-full rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Brand text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-italiana tracking-[0.3em] mb-2">
            SKYLIFE ROLEPLAY
          </h1>
          <motion.p
            className="text-sm text-muted-foreground tracking-widest"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            INDIA'S PREMIUM RP SERVER
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-64 md:w-80">
          <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/20 via-neon-cyan/20 to-primary/20"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Progress fill */}
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-neon-cyan rounded-full"
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
            >
              {/* Glow effect at the end */}
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neon-cyan blur-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.div>
          </div>
          
          {/* Progress text */}
          <div className="flex justify-between mt-3 text-xs text-muted-foreground">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              LOADING
            </motion.span>
            <span className="font-mono text-primary">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Loading tips */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.p
            className="text-xs text-muted-foreground/60 max-w-md px-4"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Experience the most immersive roleplay in India
          </motion.p>
        </motion.div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/30" />
    </motion.div>
  );
};

export default LoadingScreen;
