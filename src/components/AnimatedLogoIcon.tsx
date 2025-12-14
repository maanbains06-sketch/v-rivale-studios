import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  const [rotation, setRotation] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.8) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className={`relative cursor-pointer ${className}`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Animated neon glow ring - GTA style */}
      <div 
        className="absolute inset-[-6px] rounded-lg opacity-70"
        style={{
          background: `conic-gradient(from ${rotation}deg, 
            hsl(340 100% 50% / 0.9), 
            hsl(280 100% 60% / 0.9), 
            hsl(200 100% 50% / 0.9),
            hsl(45 100% 50% / 0.9),
            hsl(340 100% 50% / 0.9))`,
          filter: 'blur(10px)',
          borderRadius: '12px',
        }}
      />

      {/* Secondary pulsing ring */}
      <motion.div 
        className="absolute inset-[-3px] rounded-lg opacity-50"
        animate={{
          boxShadow: hovered 
            ? ['0 0 20px hsl(340 100% 50%), 0 0 40px hsl(280 100% 50%)', 
               '0 0 30px hsl(45 100% 50%), 0 0 60px hsl(200 100% 50%)',
               '0 0 20px hsl(340 100% 50%), 0 0 40px hsl(280 100% 50%)']
            : ['0 0 10px hsl(340 100% 50%)', '0 0 20px hsl(280 100% 50%)', '0 0 10px hsl(340 100% 50%)'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          borderRadius: '10px',
        }}
      />

      {/* Main logo container */}
      <div className="relative w-full h-full flex items-center justify-center rounded-lg overflow-hidden">
        {/* Dark gradient background - GTA night city vibe */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `linear-gradient(145deg, 
              hsl(240 30% 8%) 0%, 
              hsl(260 40% 12%) 30%,
              hsl(280 35% 10%) 60%,
              hsl(340 30% 8%) 100%)`,
          }}
        />

        {/* Animated city skyline silhouette */}
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 100 40"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <linearGradient id="skylineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(280 60% 40%)" />
              <stop offset="100%" stopColor="hsl(260 40% 15%)" />
            </linearGradient>
            <linearGradient id="windowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(45 100% 70%)" />
              <stop offset="100%" stopColor="hsl(45 100% 50%)" />
            </linearGradient>
          </defs>
          
          {/* Buildings silhouette */}
          <path
            d="M0,40 L0,28 L8,28 L8,22 L12,22 L12,18 L16,18 L16,25 L20,25 L20,15 L25,15 L25,20 L30,20 L30,12 L35,12 L35,8 L40,8 L40,15 L45,15 L45,10 L50,10 L50,18 L55,18 L55,14 L60,14 L60,20 L65,20 L65,16 L70,16 L70,22 L75,22 L75,18 L80,18 L80,25 L85,25 L85,22 L90,22 L90,28 L95,28 L95,32 L100,32 L100,40 Z"
            fill="url(#skylineGradient)"
            opacity="0.7"
          />
          
          {/* Animated window lights */}
          {[
            { x: 33, y: 12, delay: 0 },
            { x: 42, y: 18, delay: 0.5 },
            { x: 48, y: 14, delay: 1 },
            { x: 58, y: 18, delay: 0.3 },
            { x: 68, y: 20, delay: 0.8 },
            { x: 23, y: 18, delay: 0.6 },
          ].map((window, i) => (
            <motion.rect
              key={i}
              x={window.x}
              y={window.y}
              width="2"
              height="3"
              fill="url(#windowGlow)"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: window.delay,
              }}
            />
          ))}
        </svg>

        {/* Animated car driving across */}
        <motion.div
          className="absolute bottom-[12px] z-20"
          animate={{
            x: [-20, 60],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg width="12" height="5" viewBox="0 0 24 10">
            <defs>
              <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(340 100% 50%)" />
                <stop offset="100%" stopColor="hsl(0 100% 60%)" />
              </linearGradient>
            </defs>
            {/* Car body */}
            <path
              d="M2,6 L4,3 L8,2 L16,2 L20,3 L22,6 L22,8 L2,8 Z"
              fill="url(#carBody)"
            />
            {/* Windows */}
            <path
              d="M5,4 L8,3 L12,3 L12,5 L5,5 Z"
              fill="hsl(200 100% 80%)"
              opacity="0.6"
            />
            {/* Wheels */}
            <circle cx="6" cy="8" r="2" fill="hsl(0 0% 20%)" />
            <circle cx="18" cy="8" r="2" fill="hsl(0 0% 20%)" />
            {/* Headlight glow */}
            <motion.circle
              cx="22"
              cy="6"
              r="1.5"
              fill="hsl(45 100% 80%)"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </svg>
        </motion.div>

        {/* Neon light streaks */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-lg"
          style={{ opacity: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute h-[1px]"
              style={{
                width: '100%',
                top: `${30 + i * 15}%`,
                background: `linear-gradient(90deg, transparent, ${
                  i === 0 ? 'hsl(340 100% 60%)' : i === 1 ? 'hsl(200 100% 60%)' : 'hsl(45 100% 60%)'
                }, transparent)`,
              }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear",
              }}
            />
          ))}
        </motion.div>

        {/* SL Monogram - GTA Style with sharp edges */}
        <div className="relative z-10 flex items-center justify-center">
          <motion.div
            className="relative"
            animate={{
              filter: hovered 
                ? [
                    'drop-shadow(0 0 8px hsl(340 100% 60%)) drop-shadow(0 0 16px hsl(340 100% 40%))',
                    'drop-shadow(0 0 12px hsl(45 100% 60%)) drop-shadow(0 0 20px hsl(45 100% 40%))',
                    'drop-shadow(0 0 8px hsl(340 100% 60%)) drop-shadow(0 0 16px hsl(340 100% 40%))',
                  ]
                : 'drop-shadow(0 0 6px hsl(340 100% 50%))',
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg viewBox="0 0 60 36" className="w-[28px] h-[17px]">
              <defs>
                <linearGradient id="slGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(340 100% 65%)" />
                  <stop offset="30%" stopColor="hsl(0 100% 70%)" />
                  <stop offset="60%" stopColor="hsl(45 100% 65%)" />
                  <stop offset="100%" stopColor="hsl(45 100% 55%)" />
                </linearGradient>
                <linearGradient id="slGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(280 100% 60%)" />
                  <stop offset="50%" stopColor="hsl(200 100% 65%)" />
                  <stop offset="100%" stopColor="hsl(180 100% 60%)" />
                </linearGradient>
              </defs>
              
              {/* S Letter - Bold GTA style */}
              <path
                d="M4,10 L14,4 L24,4 L24,8 L12,8 L8,12 L20,12 L24,16 L24,28 L14,34 L4,34 L4,30 L16,30 L20,26 L8,26 L4,22 Z"
                fill="url(#slGradient)"
                stroke="hsl(45 100% 80%)"
                strokeWidth="0.5"
              />
              
              {/* L Letter - Bold GTA style */}
              <path
                d="M30,4 L40,4 L40,26 L56,26 L56,34 L30,34 Z"
                fill="url(#slGradient2)"
                stroke="hsl(200 100% 80%)"
                strokeWidth="0.5"
              />
            </svg>
          </motion.div>
        </div>

        {/* Floating stars/particles */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60) + rotation * 0.5;
          const distance = 14 + (i % 2) * 4;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: 2,
                height: 2,
                borderRadius: '50%',
                background: i % 3 === 0 
                  ? 'hsl(340 100% 70%)' 
                  : i % 3 === 1 
                    ? 'hsl(45 100% 70%)' 
                    : 'hsl(200 100% 70%)',
                left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * distance}px)`,
                top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * distance}px)`,
                boxShadow: `0 0 4px ${
                  i % 3 === 0 
                    ? 'hsl(340 100% 60%)' 
                    : i % 3 === 1 
                      ? 'hsl(45 100% 60%)' 
                      : 'hsl(200 100% 60%)'
                }`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          );
        })}

        {/* Indian flag colors accent stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] flex overflow-hidden rounded-b-lg">
          <motion.div 
            className="flex-1" 
            style={{ background: 'hsl(24 100% 50%)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="flex-1" 
            style={{ background: 'hsl(0 0% 100%)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div 
            className="flex-1" 
            style={{ background: 'hsl(120 60% 35%)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
        </div>

        {/* Corner neon accents */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Top-left */}
          <motion.path
            d="M 5 20 L 5 5 L 20 5"
            fill="none"
            stroke="hsl(340 100% 60%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {/* Top-right */}
          <motion.path
            d="M 80 5 L 95 5 L 95 20"
            fill="none"
            stroke="hsl(45 100% 60%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
          {/* Bottom-left */}
          <motion.path
            d="M 5 80 L 5 95 L 20 95"
            fill="none"
            stroke="hsl(200 100% 60%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
          />
          {/* Bottom-right */}
          <motion.path
            d="M 80 95 L 95 95 L 95 80"
            fill="none"
            stroke="hsl(280 100% 60%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1.2 }}
          />
        </svg>

        {/* Subtle inner highlight */}
        <div 
          className="absolute inset-1 rounded-lg opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 25% 25%, 
              hsl(340 100% 70% / 0.5) 0%, 
              transparent 50%)`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
