import { useEffect, useState } from "react";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Subtle outer glow - no pulsing */}
      <div 
        className="absolute inset-0 rounded-full blur-lg opacity-40"
        style={{
          background: `conic-gradient(from ${rotation}deg, 
            hsl(185 95% 60% / 0.6), 
            hsl(275 85% 65% / 0.6), 
            hsl(325 95% 68% / 0.6), 
            hsl(185 95% 60% / 0.6))`,
          transform: `rotate(${rotation}deg)`,
        }}
      />

      {/* Main icon container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Background circle with glass effect */}
        <div className="absolute w-9 h-9 rounded-full bg-gradient-to-br from-background/90 to-card/90 border-2 border-primary/50 backdrop-blur-sm" />

        {/* Rotating outer ring with notches */}
        <svg
          className="absolute w-10 h-10"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="2"
            strokeDasharray="8 4"
            opacity="0.7"
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${(rotation + 185) % 360} 95% 60%)`} />
              <stop offset="50%" stopColor={`hsl(${(rotation + 275) % 360} 85% 65%)`} />
              <stop offset="100%" stopColor={`hsl(${(rotation + 325) % 360} 95% 68%)`} />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner rotating hexagon frame */}
        <svg
          className="absolute w-8 h-8"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${-rotation * 0.5}deg)` }}
        >
          <polygon
            points="50,15 80,35 80,65 50,85 20,65 20,35"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="2"
            opacity="0.5"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${(rotation + 275) % 360} 85% 65%)`} />
              <stop offset="100%" stopColor={`hsl(${(rotation + 185) % 360} 95% 60%)`} />
            </linearGradient>
          </defs>
        </svg>

        {/* Large prominent "S" letter - static, no pulsing */}
        <div 
          className="absolute text-3xl font-bold z-10"
          style={{
            background: `linear-gradient(135deg, 
              hsl(185 95% 85%), 
              hsl(275 85% 80%), 
              hsl(325 95% 85%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 6px hsl(185 95% 60% / 0.5))`,
          }}
        >
          S
        </div>

        {/* White backdrop for S to ensure visibility */}
        <div 
          className="absolute text-3xl font-bold opacity-20 z-5"
          style={{
            color: 'white',
          }}
        >
          S
        </div>

        {/* Orbiting particles */}
        {[0, 120, 240].map((baseAngle, i) => {
          const angle = baseAngle + rotation * 2;
          const colors = ['hsl(185 95% 60%)', 'hsl(275 85% 65%)', 'hsl(325 95% 68%)'];
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
              style={{
                background: colors[i],
                transform: `rotate(${angle}deg) translateX(22px) rotate(-${angle}deg)`,
                boxShadow: `0 0 6px ${colors[i]}`,
              }}
            />
          );
        })}

        {/* Corner accent lines */}
        <div 
          className="absolute top-0.5 left-0.5 w-2 h-2 border-l-2 border-t-2 border-neon-cyan opacity-50"
          style={{ transform: `rotate(${rotation * 0.3}deg)` }}
        />
        <div 
          className="absolute top-0.5 right-0.5 w-2 h-2 border-r-2 border-t-2 border-neon-purple opacity-50"
          style={{ transform: `rotate(${-rotation * 0.3}deg)` }}
        />
        <div 
          className="absolute bottom-0.5 left-0.5 w-2 h-2 border-l-2 border-b-2 border-neon-pink opacity-50"
          style={{ transform: `rotate(${rotation * 0.3}deg)` }}
        />
        <div 
          className="absolute bottom-0.5 right-0.5 w-2 h-2 border-r-2 border-b-2 border-neon-cyan opacity-50"
          style={{ transform: `rotate(${-rotation * 0.3}deg)` }}
        />
      </div>
    </div>
  );
};

export default AnimatedLogoIcon;
