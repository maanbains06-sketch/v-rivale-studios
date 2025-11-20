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
    <div className={`relative ${className} flex items-center justify-center px-3 py-1.5`}>
      {/* Bright background glow */}
      <div className="absolute inset-0 rounded-lg blur-lg opacity-60">
        <div className="w-full h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink rounded-lg" />
      </div>

      {/* Logo container with glass effect */}
      <div className="relative flex items-center gap-0.5 px-2 py-1 rounded-lg glass-effect border border-primary/30">
        {/* Letter S */}
        <span 
          className="text-xl font-bold inline-block animate-logo-float"
          style={{
            background: `linear-gradient(135deg, 
              hsl(185 95% 70%), 
              hsl(275 85% 70%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 8px hsl(185 95% 60% / ${0.6 + Math.sin(glowIntensity / 10) * 0.2}))`,
          }}
        >
          S
        </span>

        {/* Letter L */}
        <span 
          className="text-xl font-bold inline-block animate-logo-float animation-delay-100"
          style={{
            background: `linear-gradient(135deg, 
              hsl(275 85% 70%), 
              hsl(325 95% 75%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 8px hsl(275 85% 65% / ${0.6 + Math.sin(glowIntensity / 10 + 1) * 0.2}))`,
          }}
        >
          L
        </span>

        {/* Letter R */}
        <span 
          className="text-xl font-bold inline-block animate-logo-float animation-delay-200"
          style={{
            background: `linear-gradient(135deg, 
              hsl(325 95% 75%), 
              hsl(210 100% 70%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 8px hsl(325 95% 68% / ${0.6 + Math.sin(glowIntensity / 10 + 2) * 0.2}))`,
          }}
        >
          R
        </span>

        {/* Letter P */}
        <span 
          className="text-xl font-bold inline-block animate-logo-float animation-delay-300"
          style={{
            background: `linear-gradient(135deg, 
              hsl(210 100% 70%), 
              hsl(185 95% 70%))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 8px hsl(210 100% 65% / ${0.6 + Math.sin(glowIntensity / 10 + 3) * 0.2}))`,
          }}
        >
          P
        </span>

        {/* Animated accent dots */}
        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" 
          style={{ boxShadow: '0 0 6px hsl(185 95% 60%)' }} 
        />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse animation-delay-200" 
          style={{ boxShadow: '0 0 6px hsl(275 85% 65%)' }} 
        />
      </div>
    </div>
  );
};

export default AnimatedLogoIcon;
