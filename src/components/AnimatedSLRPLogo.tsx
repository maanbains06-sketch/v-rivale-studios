import { motion } from "framer-motion";
import slrpLogo from "@/assets/slrp-logo.png";

interface AnimatedSLRPLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AnimatedSLRPLogo = ({ size = "md", className = "" }: AnimatedSLRPLogoProps) => {
  const sizeConfig = {
    sm: { container: "w-20 h-20", ring: [56, 48, 40, 32], logo: "w-14 h-14" },
    md: { container: "w-32 h-32", ring: [100, 88, 76, 64], logo: "w-24 h-24" },
    lg: { container: "w-52 h-52", ring: [180, 160, 140, 120], logo: "w-40 h-40" },
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: config.ring[0], height: config.ring[0] }}>
      {/* Outer Pulsing Glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div 
          className="rounded-full"
          style={{
            width: config.ring[0],
            height: config.ring[0],
            background: "radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, hsl(186 100% 50% / 0.2) 40%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </motion.div>

      {/* Third Rotating Ring (outermost, slowest) */}
      <motion.div
        className="absolute"
        style={{ width: config.ring[0], height: config.ring[0] }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.4) 15%, transparent 30%, hsl(186 100% 50% / 0.3) 50%, transparent 70%, hsl(var(--primary) / 0.4) 85%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Second Rotating Ring */}
      <motion.div
        className="absolute"
        style={{ width: config.ring[1], height: config.ring[1] }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.8) 25%, transparent 50%, hsl(var(--primary) / 0.6) 75%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Third Rotating Ring (opposite direction) */}
      <motion.div
        className="absolute"
        style={{ width: config.ring[2], height: config.ring[2] }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: "conic-gradient(from 180deg, transparent 0%, hsl(186 100% 50% / 0.6) 30%, transparent 60%, hsl(186 100% 50% / 0.5) 80%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* Inner Rotating Ring (fastest) */}
      <motion.div
        className="absolute"
        style={{ width: config.ring[3], height: config.ring[3] }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: "conic-gradient(from 90deg, transparent 0%, hsl(var(--primary) / 0.5) 20%, transparent 40%, hsl(186 100% 50% / 0.4) 60%, transparent 80%, hsl(var(--primary) / 0.5) 100%)",
          }}
        />
      </motion.div>

      {/* Logo Image with 3D Rotation */}
      <motion.div
        className={`relative ${config.logo}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.08 }}
        style={{ perspective: "1000px" }}
      >
        {/* Inner Glow */}
        <motion.div 
          className="absolute inset-0 rounded-full"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(186 100% 50% / 0.2) 50%, transparent 70%)",
            filter: "blur(15px)",
          }}
        />
        
        {/* 3D Rotating Logo */}
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: 360 }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.img
            src={slrpLogo}
            alt="Skylife Roleplay India"
            className="relative w-full h-full object-contain"
            animate={{
              filter: [
                "drop-shadow(0 0 20px hsl(var(--primary) / 0.6)) drop-shadow(0 0 40px hsl(var(--primary) / 0.3))",
                "drop-shadow(0 0 30px hsl(var(--primary) / 0.8)) drop-shadow(0 0 60px hsl(var(--primary) / 0.4))",
                "drop-shadow(0 0 20px hsl(var(--primary) / 0.6)) drop-shadow(0 0 40px hsl(var(--primary) / 0.3))",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
            }}
            animate={{ x: ["-200%", "200%"] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Orbiting Dots */}
      <motion.div
        className="absolute"
        style={{ width: config.ring[1] * 0.9, height: config.ring[1] * 0.9 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-primary"
          style={{ 
            boxShadow: "0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5)",
            transform: "translateX(-50%)"
          }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
      <motion.div
        className="absolute"
        style={{ width: config.ring[2] * 0.9, height: config.ring[2] * 0.9 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400"
          style={{ 
            boxShadow: "0 0 8px hsl(186 100% 50%), 0 0 15px hsl(186 100% 50% / 0.5)",
            transform: "translateX(-50%)"
          }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </motion.div>

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: "50%",
            top: "50%",
            background: i % 2 === 0 
              ? "hsl(var(--primary))" 
              : "hsl(186 100% 50%)",
            boxShadow: i % 2 === 0 
              ? "0 0 6px hsl(var(--primary))"
              : "0 0 6px hsl(186 100% 50%)",
          }}
          animate={{
            x: [0, Math.cos((i * 45 * Math.PI) / 180) * (config.ring[0] * 0.6), 0],
            y: [0, Math.sin((i * 45 * Math.PI) / 180) * (config.ring[0] * 0.6), 0],
            opacity: [0, 0.9, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedSLRPLogo;
