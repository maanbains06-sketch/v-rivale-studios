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
      {/* Outer rotating glow */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-50"
        style={{
          background: `conic-gradient(from ${rotation}deg, 
            hsl(185 95% 60% / 0.8), 
            hsl(275 85% 65% / 0.8), 
            hsl(325 95% 68% / 0.8), 
            hsl(185 95% 60% / 0.8))`,
          transform: `rotate(${rotation}deg)`,
        }}
      />

      {/* Main icon container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Background circle */}
        <div className="absolute w-9 h-9 rounded-full bg-gradient-to-br from-background/80 to-card/80 border-2 border-primary/40 backdrop-blur-sm" />

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
            opacity="0.6"
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 95% 60%)" />
              <stop offset="50%" stopColor="hsl(275 85% 65%)" />
              <stop offset="100%" stopColor="hsl(325 95% 68%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Theater masks for roleplay */}
        <svg
          className="absolute w-6 h-6"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${-rotation * 0.5}deg)` }}
        >
          {/* Comedy mask (left) */}
          <g opacity="0.9">
            <ellipse
              cx="35"
              cy="45"
              rx="18"
              ry="20"
              fill="none"
              stroke="url(#maskGradient1)"
              strokeWidth="3"
            />
            {/* Smile */}
            <path
              d="M 27 48 Q 35 55 43 48"
              fill="none"
              stroke="url(#maskGradient1)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Eyes */}
            <circle cx="30" cy="40" r="2" fill="url(#maskGradient1)" />
            <circle cx="40" cy="40" r="2" fill="url(#maskGradient1)" />
          </g>

          {/* Tragedy mask (right) */}
          <g opacity="0.9">
            <ellipse
              cx="65"
              cy="45"
              rx="18"
              ry="20"
              fill="none"
              stroke="url(#maskGradient2)"
              strokeWidth="3"
            />
            {/* Frown */}
            <path
              d="M 57 52 Q 65 45 73 52"
              fill="none"
              stroke="url(#maskGradient2)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Eyes */}
            <circle cx="60" cy="40" r="2" fill="url(#maskGradient2)" />
            <circle cx="70" cy="40" r="2" fill="url(#maskGradient2)" />
          </g>

          <defs>
            <linearGradient id="maskGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 95% 60%)" />
              <stop offset="100%" stopColor="hsl(275 85% 65%)" />
            </linearGradient>
            <linearGradient id="maskGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(275 85% 65%)" />
              <stop offset="100%" stopColor="hsl(325 95% 68%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central "RP" text */}
        <div 
          className="absolute text-[10px] font-bold tracking-tight"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${(rotation + 185) % 360} 95% 70%), 
              hsl(${(rotation + 275) % 360} 85% 70%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 4px hsl(185 95% 60% / 0.6))',
          }}
        >
          RP
        </div>

        {/* Orbiting particles */}
        {[0, 120, 240].map((baseAngle, i) => {
          const angle = baseAngle + rotation * 2;
          const colors = ['hsl(185 95% 60%)', 'hsl(275 85% 65%)', 'hsl(325 95% 68%)'];
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full"
              style={{
                background: colors[i],
                transform: `rotate(${angle}deg) translateX(22px) rotate(-${angle}deg)`,
                boxShadow: `0 0 6px ${colors[i]}`,
              }}
            />
          );
        })}

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-neon-cyan opacity-60 animate-pulse" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-neon-purple opacity-60 animate-pulse animation-delay-100" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-neon-pink opacity-60 animate-pulse animation-delay-200" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-neon-cyan opacity-60 animate-pulse animation-delay-300" />
      </div>
    </div>
  );
};

export default AnimatedLogoIcon;
