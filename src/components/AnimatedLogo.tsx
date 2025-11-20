import { useEffect, useState } from "react";

interface AnimatedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const AnimatedLogo = ({ className = "", size = "md" }: AnimatedLogoProps) => {
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl",
  };

  const glowStyle = {
    textShadow: `
      0 0 ${10 + Math.sin(glowIntensity / 10) * 5}px hsl(185 95% 60% / 0.8),
      0 0 ${20 + Math.sin(glowIntensity / 10) * 10}px hsl(185 95% 60% / 0.6),
      0 0 ${30 + Math.sin(glowIntensity / 10) * 15}px hsl(275 85% 65% / 0.4),
      0 0 ${40 + Math.sin(glowIntensity / 10) * 20}px hsl(325 95% 68% / 0.3)
    `,
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 blur-3xl opacity-50 animate-pulse-slow">
        <div className="w-full h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
      </div>

      {/* Main logo container */}
      <div className="relative">
        {/* Logo text with gradient and animations */}
        <h1
          className={`${sizeClasses[size]} font-bold tracking-wider relative z-10`}
          style={glowStyle}
        >
          <span className="inline-block animate-logo-float">
            <span className="text-gradient bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent animate-gradient-shift">
              S
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-100">
            <span className="text-gradient bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent animate-gradient-shift">
              L
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-200">
            <span className="text-gradient bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-purple bg-clip-text text-transparent animate-gradient-shift">
              R
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-300">
            <span className="text-gradient bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple bg-clip-text text-transparent animate-gradient-shift">
              P
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <div className="text-center mt-2">
          <p className="text-base md:text-xl text-primary/80 tracking-wide font-light animate-pulse">
            Skylife Roleplay India
          </p>
        </div>

        {/* Decorative lines */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent to-neon-cyan animate-pulse" />
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-l from-transparent to-neon-purple animate-pulse" />
      </div>

      {/* Orbiting particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-neon-cyan animate-orbit-1" />
        <div className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full bg-neon-purple animate-orbit-2" />
        <div className="absolute bottom-0 right-1/2 w-2 h-2 rounded-full bg-neon-pink animate-orbit-3" />
      </div>
    </div>
  );
};

export default AnimatedLogo;
