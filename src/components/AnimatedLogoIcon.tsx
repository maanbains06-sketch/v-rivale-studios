import { useEffect, useState } from "react";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  const [rotation, setRotation] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale((prev) => {
        const newScale = prev + 0.02;
        return newScale > 1.15 ? 1 : newScale;
      });
    }, 50);
    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Multi-layer rotating glow rings */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-70 animate-pulse-slow"
        style={{
          background: `conic-gradient(from ${rotation}deg, 
            hsl(185 95% 60% / 0.8), 
            hsl(275 85% 65% / 0.8), 
            hsl(325 95% 68% / 0.8), 
            hsl(210 100% 65% / 0.8),
            hsl(185 95% 60% / 0.8))`,
          transform: `rotate(${rotation}deg) scale(${pulseScale})`,
        }}
      />

      {/* Secondary counter-rotating glow */}
      <div 
        className="absolute inset-0 rounded-full blur-lg opacity-50"
        style={{
          background: `conic-gradient(from ${-rotation * 1.5}deg, 
            hsl(325 95% 68% / 0.6), 
            hsl(185 95% 60% / 0.6), 
            hsl(275 85% 65% / 0.6),
            hsl(325 95% 68% / 0.6))`,
          transform: `rotate(${-rotation * 1.5}deg)`,
        }}
      />
      
      {/* Outer pulsing ring */}
      <div className="absolute inset-0 rounded-full animate-pulse">
        <div 
          className="w-full h-full rounded-full border-2"
          style={{
            borderColor: `hsl(${(rotation + 185) % 360} 95% 60% / 0.7)`,
          }}
        />
      </div>

      {/* Middle rotating hexagon */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${rotation * 0.5}deg)` }}
      >
        <svg className="w-8 h-8" viewBox="0 0 40 40">
          <polygon
            points="20,5 32,12.5 32,27.5 20,35 8,27.5 8,12.5"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 95% 60%)" />
              <stop offset="50%" stopColor="hsl(275 85% 65%)" />
              <stop offset="100%" stopColor="hsl(325 95% 68%)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Inner logo design */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Animated center core */}
        <div 
          className="absolute w-3 h-3 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, 
              hsl(${(rotation + 185) % 360} 95% 70%), 
              hsl(${(rotation + 275) % 360} 85% 65%))`,
            boxShadow: `0 0 15px hsl(${(rotation + 185) % 360} 95% 60% / 0.8)`,
          }}
        />
        
        {/* Rotating corner brackets */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ transform: `rotate(${rotation * 2}deg)` }}
          viewBox="0 0 40 40"
        >
          {/* Enhanced corner pieces with inner lines */}
          <g opacity="0.9">
            {/* Top-left */}
            <path d="M 7 7 L 7 15 M 7 7 L 15 7" stroke="url(#g1)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 9 9 L 9 13 M 9 9 L 13 9" stroke="url(#g1)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            
            {/* Top-right */}
            <path d="M 33 7 L 33 15 M 33 7 L 25 7" stroke="url(#g2)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 31 9 L 31 13 M 31 9 L 27 9" stroke="url(#g2)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            
            {/* Bottom-left */}
            <path d="M 7 33 L 7 25 M 7 33 L 15 33" stroke="url(#g3)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 9 31 L 9 27 M 9 31 L 13 31" stroke="url(#g3)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            
            {/* Bottom-right */}
            <path d="M 33 33 L 33 25 M 33 33 L 25 33" stroke="url(#g4)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 31 31 L 31 27 M 31 31 L 27 31" stroke="url(#g4)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </g>
          
          {/* Enhanced gradients */}
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 95% 60%)" />
              <stop offset="100%" stopColor="hsl(275 85% 65%)" />
            </linearGradient>
            <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(275 85% 65%)" />
              <stop offset="100%" stopColor="hsl(325 95% 68%)" />
            </linearGradient>
            <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(325 95% 68%)" />
              <stop offset="100%" stopColor="hsl(210 100% 65%)" />
            </linearGradient>
            <linearGradient id="g4" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(210 100% 65%)" />
              <stop offset="100%" stopColor="hsl(185 95% 60%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Letter S with enhanced styling */}
        <div 
          className="absolute text-xl font-bold"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${(rotation + 185) % 360} 95% 70%), 
              hsl(${(rotation + 275) % 360} 85% 65%), 
              hsl(${(rotation + 325) % 360} 95% 68%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 8px hsl(${(rotation + 185) % 360} 95% 60% / 0.8))`,
            transform: `scale(${pulseScale})`,
          }}
        >
          S
        </div>
      </div>

      {/* Multiple orbiting particles with trails */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary particles */}
        <div 
          className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-neon-cyan"
          style={{
            transform: `rotate(${rotation}deg) translateX(22px) rotate(-${rotation}deg)`,
            boxShadow: '0 0 6px hsl(185 95% 60%)',
          }}
        />
        <div 
          className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full bg-neon-purple"
          style={{
            transform: `rotate(${rotation + 120}deg) translateX(22px) rotate(-${rotation + 120}deg)`,
            boxShadow: '0 0 6px hsl(275 85% 65%)',
          }}
        />
        <div 
          className="absolute bottom-0 right-1/2 w-1.5 h-1.5 rounded-full bg-neon-pink"
          style={{
            transform: `rotate(${rotation + 240}deg) translateX(22px) rotate(-${rotation + 240}deg)`,
            boxShadow: '0 0 6px hsl(325 95% 68%)',
          }}
        />
        
        {/* Secondary counter-rotating particles */}
        <div 
          className="absolute top-1/2 right-0 w-1 h-1 rounded-full bg-neon-blue opacity-70"
          style={{
            transform: `rotate(${-rotation * 1.5}deg) translateX(18px) rotate(${rotation * 1.5}deg)`,
            boxShadow: '0 0 4px hsl(210 100% 65%)',
          }}
        />
        <div 
          className="absolute bottom-1/2 left-1/2 w-1 h-1 rounded-full bg-neon-orange opacity-70"
          style={{
            transform: `rotate(${-rotation * 1.5 + 180}deg) translateX(18px) rotate(${rotation * 1.5 - 180}deg)`,
            boxShadow: '0 0 4px hsl(25 100% 60%)',
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedLogoIcon;
