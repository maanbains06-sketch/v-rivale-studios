import { useEffect, useState } from "react";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* Subtle background glow */}
      <div className="absolute inset-0 rounded-lg blur-md opacity-40 animate-pulse-slow">
        <div className="w-full h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-lg" />
      </div>

      {/* Logo text */}
      <div className="relative flex items-center gap-0.5 px-2 py-1">
        <span 
          className="text-lg font-bold inline-block animate-logo-float"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${185 + glowIntensity / 2} 95% 65%), 
              hsl(${275 + glowIntensity / 2} 85% 65%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          S
        </span>
        <span 
          className="text-lg font-bold inline-block animate-logo-float animation-delay-100"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${275 + glowIntensity / 2} 85% 65%), 
              hsl(${325 + glowIntensity / 2} 95% 68%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          L
        </span>
        <span 
          className="text-lg font-bold inline-block animate-logo-float animation-delay-200"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${325 + glowIntensity / 2} 95% 68%), 
              hsl(${210 + glowIntensity / 2} 100% 65%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          R
        </span>
        <span 
          className="text-lg font-bold inline-block animate-logo-float animation-delay-300"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${210 + glowIntensity / 2} 100% 65%), 
              hsl(${185 + glowIntensity / 2} 95% 65%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          P
        </span>
      </div>
    </div>
  );
};

export default AnimatedLogoIcon;
