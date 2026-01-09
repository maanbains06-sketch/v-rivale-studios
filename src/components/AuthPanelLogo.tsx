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

        {/* Small stars */}
        {[...Array(40)].map((_, i) => (
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
        {[...Array(10)].map((_, i) => (
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
            background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
          }}
        />
      </div>

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer Glow Effect */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div 
            className="w-80 h-80 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
              filter: "blur(40px)",
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
              background: "conic-gradient(from 0deg, transparent 0%, hsl(var(--primary) / 0.6) 25%, transparent 50%, hsl(var(--primary) / 0.4) 75%, transparent 100%)",
              padding: "2px",
            }}
          >
            <div className="w-full h-full rounded-full bg-background" />
          </div>
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
              background: "conic-gradient(from 180deg, transparent 0%, hsl(186 100% 50% / 0.4) 30%, transparent 60%, hsl(186 100% 50% / 0.3) 80%, transparent 100%)",
              padding: "1px",
            }}
          >
            <div className="w-full h-full rounded-full bg-background" />
          </div>
        </motion.div>

        {/* Logo Image */}
        <motion.div
          className="relative w-52 h-52"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
        >
          {/* Inner Glow */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          
          {/* Logo */}
          <img
            src={slrpLogo}
            alt="Skylife Roleplay India"
            className="relative w-full h-full object-contain drop-shadow-2xl"
            style={{
              filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.5))",
            }}
          />

          {/* Shine Effect */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
              }}
              animate={{ x: ["-200%", "200%"] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Floating Particles around Logo */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full bg-primary"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [0, Math.cos((i * 45 * Math.PI) / 180) * 120, 0],
              y: [0, Math.sin((i * 45 * Math.PI) / 180) * 120, 0],
              opacity: [0, 0.8, 0],
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

        {/* Text Below Logo */}
        <motion.div
          className="mt-8 text-center relative z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.h1
            className="text-5xl font-black tracking-wider"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(186 100% 50%) 50%, hsl(var(--primary)) 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 40px hsl(var(--primary) / 0.5)",
            }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            SLRP
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm tracking-[0.3em] uppercase mt-2 font-medium"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Skylife Roleplay India
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPanelLogo;
