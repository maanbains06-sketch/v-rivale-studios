import { motion } from "framer-motion";
import slrpLogo from "@/assets/slrp-logo.png";

const AuthPanelLogo = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-background/95">
      {/* Starfield Background */}
      <div className="absolute inset-0">
        {/* Large glowing orbs */}
        <motion.div
          className="absolute top-20 left-20 w-4 h-4 rounded-full bg-primary/60"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: "blur(2px)" }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-cyan-400/50"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          style={{ filter: "blur(1px)" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-5 h-5 rounded-full bg-primary/40"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ filter: "blur(3px)" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-20 w-6 h-6 rounded-full bg-cyan-500/30"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ filter: "blur(4px)" }}
        />

        {/* Small stars */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Larger twinkling stars */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`large-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Ambient glow behind logo */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.2) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer Pulsing Glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div 
            className="w-96 h-96 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, hsl(186 100% 50% / 0.2) 40%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
        </motion.div>

        {/* Third Rotating Ring (outermost, slowest) */}
        <motion.div
          className="absolute w-80 h-80"
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

        {/* Rotating Ring */}
        <motion.div
          className="absolute w-72 h-72"
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

        {/* Second Rotating Ring (opposite direction) */}
        <motion.div
          className="absolute w-64 h-64"
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
          className="absolute w-56 h-56"
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

        {/* Logo Image with Earth-like Rotation */}
        <motion.div
          className="relative w-52 h-52"
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
              filter: "blur(25px)",
            }}
          />
          
          {/* Globe Container with 3D rotation */}
          <motion.div
            className="relative w-full h-full"
            animate={{ rotateY: 360 }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ 
              transformStyle: "preserve-3d",
            }}
          >
            {/* Logo with enhanced glow */}
            <motion.img
              src={slrpLogo}
              alt="Skylife Roleplay India"
              className="relative w-full h-full object-contain"
              animate={{
                filter: [
                  "drop-shadow(0 0 30px hsl(var(--primary) / 0.6)) drop-shadow(0 0 60px hsl(var(--primary) / 0.3))",
                  "drop-shadow(0 0 40px hsl(var(--primary) / 0.8)) drop-shadow(0 0 80px hsl(var(--primary) / 0.4))",
                  "drop-shadow(0 0 30px hsl(var(--primary) / 0.6)) drop-shadow(0 0 60px hsl(var(--primary) / 0.3))",
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

          {/* Rotating Border Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <div 
              className="w-full h-full rounded-full"
              style={{
                background: "conic-gradient(from 0deg, transparent 70%, hsl(var(--primary) / 0.6) 85%, transparent 100%)",
                padding: "2px",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Floating Particles around Logo */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              background: i % 2 === 0 
                ? "hsl(var(--primary))" 
                : "hsl(186 100% 50%)",
              boxShadow: i % 2 === 0 
                ? "0 0 10px hsl(var(--primary))"
                : "0 0 10px hsl(186 100% 50%)",
            }}
            animate={{
              x: [0, Math.cos((i * 30 * Math.PI) / 180) * 140, 0],
              y: [0, Math.sin((i * 30 * Math.PI) / 180) * 140, 0],
              opacity: [0, 0.9, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Orbiting Dots */}
        <motion.div
          className="absolute w-48 h-48"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute -top-1 left-1/2 w-3 h-3 rounded-full bg-primary"
            style={{ 
              boxShadow: "0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary) / 0.5)",
              transform: "translateX(-50%)"
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          className="absolute w-44 h-44"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute -bottom-1 left-1/2 w-2 h-2 rounded-full bg-cyan-400"
            style={{ 
              boxShadow: "0 0 10px hsl(186 100% 50%), 0 0 20px hsl(186 100% 50% / 0.5)",
              transform: "translateX(-50%)"
            }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.div>

        {/* Text Below Logo */}
        <motion.div
          className="mt-10 text-center relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.h1
            className="text-6xl font-black tracking-wider"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(186 100% 60%) 30%, hsl(var(--primary)) 50%, hsl(186 100% 50%) 70%, hsl(var(--primary)) 100%)",
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              textShadow: [
                "0 0 30px hsl(var(--primary) / 0.4)",
                "0 0 50px hsl(var(--primary) / 0.6)",
                "0 0 30px hsl(var(--primary) / 0.4)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            SLRP
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm tracking-[0.35em] uppercase mt-3 font-semibold"
            animate={{ 
              opacity: [0.5, 1, 0.5],
              letterSpacing: ["0.35em", "0.4em", "0.35em"],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            Skylife Roleplay India
          </motion.p>
          
          {/* Underline Effect */}
          <motion.div
            className="mt-2 mx-auto h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPanelLogo;
