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
    }, 20);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseScale((prev) => {
        const newScale = prev + 0.01;
        return newScale > 1.1 ? 1 : newScale;
      });
    }, 40);
    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Outer rotating rainbow glow */}
      <div 
        className="absolute inset-0 rounded-full blur-lg opacity-60"
        style={{
          background: `conic-gradient(from ${rotation}deg, 
            hsl(185 95% 60% / 0.9), 
            hsl(275 85% 65% / 0.9), 
            hsl(325 95% 68% / 0.9), 
            hsl(210 100% 65% / 0.9),
            hsl(185 95% 60% / 0.9))`,
          transform: `rotate(${rotation}deg) scale(${pulseScale})`,
        }}
      />

      {/* Secondary counter-rotating glow */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-40"
        style={{
          background: `conic-gradient(from ${-rotation * 1.2}deg, 
            hsl(325 95% 68% / 0.7), 
            hsl(185 95% 60% / 0.7), 
            hsl(275 85% 65% / 0.7),
            hsl(325 95% 68% / 0.7))`,
          transform: `rotate(${-rotation * 1.2}deg)`,
        }}
      />
      
      {/* Pulsing ring border */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          border: '2px solid',
          borderColor: `hsl(${(rotation + 185) % 360} 95% 60% / 0.8)`,
          transform: `scale(${pulseScale})`,
        }}
      />

      {/* Inner hexagonal frame rotating */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${rotation * 0.4}deg)` }}
      >
        <svg className="w-7 h-7" viewBox="0 0 40 40">
          <polygon
            points="20,6 30,12 30,28 20,34 10,28 10,12"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${(rotation + 185) % 360} 95% 60%)`} />
              <stop offset="50%" stopColor={`hsl(${(rotation + 275) % 360} 85% 65%)`} />
              <stop offset="100%" stopColor={`hsl(${(rotation + 325) % 360} 95% 68%)`} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main content area */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Animated center core with glow */}
        <div 
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{
            background: `radial-gradient(circle, 
              hsl(${(rotation + 185) % 360} 95% 80%), 
              hsl(${(rotation + 275) % 360} 85% 70%))`,
            boxShadow: `0 0 12px hsl(${(rotation + 185) % 360} 95% 60% / 0.9)`,
            transform: `scale(${pulseScale})`,
          }}
        />
        
        {/* Enhanced rotating corner brackets */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ transform: `rotate(${rotation * 1.5}deg)` }}
          viewBox="0 0 40 40"
        >
          <g opacity="0.85">
            {/* Top-left with glow effect */}
            <path 
              d="M 6 6 L 6 14 M 6 6 L 14 6" 
              stroke="url(#g1)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              filter="drop-shadow(0 0 3px hsl(185 95% 60%))"
            />
            <path d="M 8 8 L 8 12 M 8 8 L 12 8" stroke="url(#g1)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            
            {/* Top-right */}
            <path 
              d="M 34 6 L 34 14 M 34 6 L 26 6" 
              stroke="url(#g2)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              filter="drop-shadow(0 0 3px hsl(275 85% 65%))"
            />
            <path d="M 32 8 L 32 12 M 32 8 L 28 8" stroke="url(#g2)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            
            {/* Bottom-left */}
            <path 
              d="M 6 34 L 6 26 M 6 34 L 14 34" 
              stroke="url(#g3)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              filter="drop-shadow(0 0 3px hsl(325 95% 68%))"
            />
            <path d="M 8 32 L 8 28 M 8 32 L 12 32" stroke="url(#g3)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            
            {/* Bottom-right */}
            <path 
              d="M 34 34 L 34 26 M 34 34 L 26 34" 
              stroke="url(#g4)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              filter="drop-shadow(0 0 3px hsl(210 100% 65%))"
            />
            <path d="M 32 32 L 32 28 M 32 32 L 28 32" stroke="url(#g4)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          </g>
          
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${(rotation + 185) % 360} 95% 60%)`} />
              <stop offset="100%" stopColor={`hsl(${(rotation + 275) % 360} 85% 65%)`} />
            </linearGradient>
            <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${(rotation + 275) % 360} 85% 65%)`} />
              <stop offset="100%" stopColor={`hsl(${(rotation + 325) % 360} 95% 68%)`} />
            </linearGradient>
            <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={`hsl(${(rotation + 325) % 360} 95% 68%)`} />
              <stop offset="100%" stopColor={`hsl(${(rotation + 210) % 360} 100% 65%)`} />
            </linearGradient>
            <linearGradient id="g4" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={`hsl(${(rotation + 210) % 360} 100% 65%)`} />
              <stop offset="100%" stopColor={`hsl(${(rotation + 185) % 360} 95% 60%)`} />
            </linearGradient>
          </defs>
        </svg>

        {/* Enhanced Letter S with layered effects */}
        <div className="absolute flex items-center justify-center">
          <div 
            className="text-xl font-bold relative"
            style={{
              background: `linear-gradient(135deg, 
                hsl(${(rotation + 185) % 360} 95% 75%), 
                hsl(${(rotation + 275) % 360} 85% 70%), 
                hsl(${(rotation + 325) % 360} 95% 75%))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 0 6px hsl(${(rotation + 185) % 360} 95% 60% / 0.9))`,
              transform: `scale(${pulseScale})`,
            }}
          >
            S
          </div>
        </div>
      </div>

      {/* Enhanced orbiting particles with trails */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Main particles */}
        {[0, 120, 240].map((baseAngle, i) => {
          const angle = baseAngle + rotation;
          const colors = ['hsl(185 95% 60%)', 'hsl(275 85% 65%)', 'hsl(325 95% 68%)'];
          return (
            <div
              key={`main-${i}`}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
              style={{
                background: colors[i],
                transform: `rotate(${angle}deg) translateX(20px) rotate(-${angle}deg)`,
                boxShadow: `0 0 8px ${colors[i]}, 0 0 4px ${colors[i]}`,
              }}
            />
          );
        })}
        
        {/* Counter-rotating particles */}
        {[60, 180, 300].map((baseAngle, i) => {
          const angle = baseAngle - rotation * 0.8;
          const colors = ['hsl(210 100% 65%)', 'hsl(25 100% 60%)', 'hsl(185 95% 60%)'];
          return (
            <div
              key={`counter-${i}`}
              className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full opacity-70"
              style={{
                background: colors[i],
                transform: `rotate(${angle}deg) translateX(17px) rotate(-${angle}deg)`,
                boxShadow: `0 0 5px ${colors[i]}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedLogoIcon;
