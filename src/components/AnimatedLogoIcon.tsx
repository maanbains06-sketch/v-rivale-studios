import { useEffect, useState } from "react";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Outer rotating glow ring */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-60"
        style={{
          background: `conic-gradient(from ${rotation}deg, hsl(185 95% 60%), hsl(275 85% 65%), hsl(325 95% 68%), hsl(185 95% 60%))`,
          transform: `rotate(${rotation}deg)`,
        }}
      />
      
      {/* Middle pulse ring */}
      <div className="absolute inset-0 rounded-full animate-pulse">
        <div className="w-full h-full rounded-full border-2 border-neon-cyan/50" />
      </div>

      {/* Inner logo design */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Center dot */}
        <div className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple animate-pulse" />
        
        {/* Four rotating corner pieces */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ transform: `rotate(${rotation * 2}deg)` }}
          viewBox="0 0 40 40"
        >
          {/* Top-left corner */}
          <path
            d="M 8 8 L 8 14 M 8 8 L 14 8"
            stroke="url(#gradient1)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Top-right corner */}
          <path
            d="M 32 8 L 32 14 M 32 8 L 26 8"
            stroke="url(#gradient2)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bottom-left corner */}
          <path
            d="M 8 32 L 8 26 M 8 32 L 14 32"
            stroke="url(#gradient3)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bottom-right corner */}
          <path
            d="M 32 32 L 32 26 M 32 32 L 26 32"
            stroke="url(#gradient4)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 95% 60%)" />
              <stop offset="100%" stopColor="hsl(275 85% 65%)" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(275 85% 65%)" />
              <stop offset="100%" stopColor="hsl(325 95% 68%)" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(325 95% 68%)" />
              <stop offset="100%" stopColor="hsl(185 95% 60%)" />
            </linearGradient>
            <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 95% 60%)" />
              <stop offset="100%" stopColor="hsl(275 85% 65%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Letter S in the center */}
        <div 
          className="absolute text-lg font-bold text-gradient bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent"
          style={{
            textShadow: '0 0 10px hsl(185 95% 60% / 0.5)',
          }}
        >
          S
        </div>
      </div>

      {/* Orbiting particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 w-1 h-1 rounded-full bg-neon-cyan"
          style={{
            transform: `rotate(${rotation}deg) translateX(20px) rotate(-${rotation}deg)`,
          }}
        />
        <div 
          className="absolute top-1/2 left-0 w-1 h-1 rounded-full bg-neon-purple"
          style={{
            transform: `rotate(${rotation + 120}deg) translateX(20px) rotate(-${rotation + 120}deg)`,
          }}
        />
        <div 
          className="absolute bottom-0 right-1/2 w-1 h-1 rounded-full bg-neon-pink"
          style={{
            transform: `rotate(${rotation + 240}deg) translateX(20px) rotate(-${rotation + 240}deg)`,
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedLogoIcon;
