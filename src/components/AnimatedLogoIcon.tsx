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
      setRotation((prev) => (prev + 0.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className={`relative cursor-pointer ${className}`}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Animated outer glow ring */}
      <div 
        className="absolute inset-[-4px] rounded-full opacity-60"
        style={{
          background: `conic-gradient(from ${rotation}deg, 
            hsl(200 100% 50% / 0.8), 
            hsl(280 100% 60% / 0.8), 
            hsl(45 100% 50% / 0.8),
            hsl(200 100% 50% / 0.8))`,
          filter: 'blur(8px)',
        }}
      />

      {/* Secondary rotating ring */}
      <div 
        className="absolute inset-[-2px] rounded-full opacity-40"
        style={{
          background: `conic-gradient(from ${-rotation * 1.5}deg, 
            transparent 0deg,
            hsl(200 100% 70%) 60deg,
            transparent 120deg,
            hsl(45 100% 60%) 180deg,
            transparent 240deg,
            hsl(280 100% 65%) 300deg,
            transparent 360deg)`,
        }}
      />

      {/* Main logo container */}
      <div className="relative w-full h-full flex items-center justify-center rounded-full overflow-hidden">
        {/* Gradient background - Sky theme */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, 
              hsl(210 100% 12%) 0%, 
              hsl(220 80% 18%) 30%,
              hsl(260 60% 20%) 70%,
              hsl(280 50% 15%) 100%)`,
          }}
        />

        {/* Animated stars/particles in background */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) + rotation * 0.3;
          const distance = 12 + (i % 3) * 4;
          const size = 1 + (i % 2);
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                background: i % 2 === 0 ? 'hsl(45 100% 70%)' : 'hsl(200 100% 80%)',
                left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * distance}px)`,
                top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * distance}px)`,
                boxShadow: `0 0 ${size * 2}px ${i % 2 === 0 ? 'hsl(45 100% 70%)' : 'hsl(200 100% 80%)'}`,
              }}
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Orbiting satellite rings */}
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Outer orbit ring */}
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="20"
            fill="none"
            stroke="url(#orbitGradient1)"
            strokeWidth="0.8"
            opacity="0.6"
            transform="rotate(-25 50 50)"
          />
          {/* Inner orbit ring */}
          <ellipse
            cx="50"
            cy="50"
            rx="38"
            ry="16"
            fill="none"
            stroke="url(#orbitGradient2)"
            strokeWidth="0.6"
            opacity="0.4"
            transform="rotate(25 50 50)"
          />
          <defs>
            <linearGradient id="orbitGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(200 100% 60%)" />
              <stop offset="50%" stopColor="hsl(45 100% 60%)" />
              <stop offset="100%" stopColor="hsl(200 100% 60%)" />
            </linearGradient>
            <linearGradient id="orbitGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(280 100% 60%)" />
              <stop offset="100%" stopColor="hsl(200 100% 60%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central hexagonal frame */}
        <svg
          className="absolute w-[70%] h-[70%]"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${-rotation * 0.2}deg)` }}
        >
          <polygon
            points="50,8 85,28 85,72 50,92 15,72 15,28"
            fill="none"
            stroke="url(#hexFrame)"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <defs>
            <linearGradient id="hexFrame" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(200 100% 70%)" />
              <stop offset="50%" stopColor="hsl(45 100% 60%)" />
              <stop offset="100%" stopColor="hsl(280 100% 65%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* SL Monogram - Main Logo */}
        <div className="relative z-10 flex items-center justify-center">
          {/* S letter with gradient */}
          <motion.div
            className="relative"
            animate={{
              textShadow: hovered 
                ? [
                    '0 0 10px hsl(200 100% 60%), 0 0 20px hsl(200 100% 60%), 0 0 30px hsl(45 100% 60%)',
                    '0 0 15px hsl(280 100% 60%), 0 0 25px hsl(280 100% 60%), 0 0 35px hsl(200 100% 60%)',
                    '0 0 10px hsl(200 100% 60%), 0 0 20px hsl(200 100% 60%), 0 0 30px hsl(45 100% 60%)',
                  ]
                : '0 0 8px hsl(200 100% 60%)',
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span
              className="text-[1.4rem] font-black tracking-tighter leading-none"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(200 100% 70%) 0%, 
                  hsl(200 100% 85%) 30%,
                  hsl(45 100% 75%) 70%,
                  hsl(45 100% 60%) 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              SL
            </span>
          </motion.div>
        </div>

        {/* Indian-inspired decorative dots at cardinal points */}
        {[0, 90, 180, 270].map((angle) => (
          <motion.div
            key={angle}
            className="absolute"
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: angle % 180 === 0 
                ? 'linear-gradient(135deg, hsl(45 100% 60%), hsl(25 100% 50%))' 
                : 'linear-gradient(135deg, hsl(200 100% 60%), hsl(280 100% 60%))',
              left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 17}px - 1.5px)`,
              top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 17}px - 1.5px)`,
              boxShadow: `0 0 4px ${angle % 180 === 0 ? 'hsl(45 100% 60%)' : 'hsl(200 100% 60%)'}`,
            }}
            animate={{
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: angle / 360,
            }}
          />
        ))}

        {/* Flying plane/jet silhouette orbiting */}
        <motion.div
          className="absolute"
          style={{
            width: 6,
            height: 3,
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div
            className="absolute"
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '6px solid hsl(45 100% 70%)',
              transform: 'rotate(90deg) translateX(16px)',
              filter: 'drop-shadow(0 0 3px hsl(45 100% 60%))',
            }}
          />
        </motion.div>

        {/* Subtle inner glow */}
        <div 
          className="absolute inset-2 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 30%, 
              hsl(200 100% 70% / 0.4) 0%, 
              transparent 60%)`,
          }}
        />
      </div>

      {/* Rotating corner brackets */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation * 0.1}deg)` }}
      >
        {/* Top-left bracket */}
        <path
          d="M 15 25 L 15 15 L 25 15"
          fill="none"
          stroke="hsl(200 100% 60%)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Top-right bracket */}
        <path
          d="M 75 15 L 85 15 L 85 25"
          fill="none"
          stroke="hsl(45 100% 60%)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Bottom-left bracket */}
        <path
          d="M 15 75 L 15 85 L 25 85"
          fill="none"
          stroke="hsl(280 100% 60%)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Bottom-right bracket */}
        <path
          d="M 75 85 L 85 85 L 85 75"
          fill="none"
          stroke="hsl(200 100% 60%)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
