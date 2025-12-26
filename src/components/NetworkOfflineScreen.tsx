import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { useState } from "react";

export const NetworkOfflineScreen = () => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Try to reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        {/* Scanning line effect */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-destructive to-transparent opacity-60"
          initial={{ top: "-2px" }}
          animate={{ top: "100%" }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Glowing orbs - red/orange tint for offline state */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-destructive/10 blur-[100px]"
          animate={{
            x: ["-20%", "120%"],
            y: ["20%", "80%"],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ top: "20%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-[200px] h-[200px] rounded-full bg-neon-orange/15 blur-[80px]"
          animate={{
            x: ["120%", "-20%"],
            y: ["60%", "20%"],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ top: "40%", right: "-10%" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated Icon Container */}
        <div className="relative">
          {/* Outer pulsing ring */}
          <motion.div
            className="absolute -inset-8"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="hsl(var(--destructive))"
                strokeWidth="2"
                opacity="0.3"
              />
            </svg>
          </motion.div>

          {/* Inner rotating ring */}
          <motion.div
            className="absolute -inset-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="offlineRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity="0" />
                  <stop offset="30%" stopColor="hsl(var(--destructive))" stopOpacity="1" />
                  <stop offset="70%" stopColor="hsl(var(--neon-orange))" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(var(--neon-orange))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="url(#offlineRingGradient)"
                strokeWidth="2"
                strokeDasharray="534.07"
                strokeDashoffset="267.03"
              />
            </svg>
          </motion.div>

          {/* Hexagon with icon */}
          <motion.div
            className="relative w-32 h-32 flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Hexagon background */}
            <svg viewBox="0 0 100 100" className="absolute w-full h-full">
              <defs>
                <linearGradient id="offlineHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" />
                  <stop offset="100%" stopColor="hsl(var(--neon-orange))" />
                </linearGradient>
                <filter id="offlineHexGlow" x="-50%" y="-50%" width="200%" height="200%">
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
                stroke="url(#offlineHexGradient)"
                strokeWidth="2"
                filter="url(#offlineHexGlow)"
              />
            </svg>

            {/* WiFi Off Icon */}
            <motion.div
              className="relative z-10"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <WifiOff className="w-12 h-12 text-destructive" />
            </motion.div>
          </motion.div>

          {/* Signal wave effects */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-destructive/30"
              initial={{ width: 60, height: 60, opacity: 0.6 }}
              animate={{
                width: [60 + i * 30, 160 + i * 30],
                height: [60 + i * 30, 160 + i * 30],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-italiana tracking-[0.2em] mb-2 text-destructive">
            CONNECTION LOST
          </h1>
          <motion.p
            className="text-sm text-muted-foreground tracking-widest mb-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            SKYLIFE ROLEPLAY
          </motion.p>
          <p className="text-xs text-muted-foreground/60 max-w-xs mt-4">
            Please check your internet connection and try again
          </p>
        </motion.div>

        {/* Retry button */}
        <motion.button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-destructive/80 to-neon-orange/80 hover:from-destructive hover:to-neon-orange text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.div
            animate={isRetrying ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isRetrying ? Infinity : 0, ease: "linear" }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.div>
          {isRetrying ? "Reconnecting..." : "Retry Connection"}
        </motion.button>

        {/* Loading indicator while retrying */}
        {isRetrying && (
          <motion.div
            className="w-64 md:w-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-destructive/40 via-neon-orange/40 to-destructive/40"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-destructive/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-destructive/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-destructive/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-destructive/30" />

      {/* Bottom tip */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.p
          className="text-xs text-muted-foreground/40 max-w-md px-4"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          We'll automatically reconnect when your connection is restored
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default NetworkOfflineScreen;
