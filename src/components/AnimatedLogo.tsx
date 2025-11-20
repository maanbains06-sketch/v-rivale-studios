import { useEffect, useState } from "react";

interface AnimatedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const AnimatedLogo = ({ className = "", size = "md" }: AnimatedLogoProps) => {
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [letterRotations, setLetterRotations] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setLetterRotations([
        Math.sin(Date.now() / 1000) * 5,
        Math.sin(Date.now() / 1000 + 1) * 5,
        Math.sin(Date.now() / 1000 + 2) * 5,
        Math.sin(Date.now() / 1000 + 3) * 5,
      ]);
    }, 50);
    return () => clearInterval(rotationInterval);
  }, []);

  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl",
  };

  const glowStyle = {
    filter: `
      drop-shadow(0 0 ${10 + Math.sin(glowIntensity / 10) * 5}px hsl(185 95% 60% / 0.8))
      drop-shadow(0 0 ${20 + Math.sin(glowIntensity / 10) * 10}px hsl(185 95% 60% / 0.6))
      drop-shadow(0 0 ${30 + Math.sin(glowIntensity / 10) * 15}px hsl(275 85% 65% / 0.4))
      drop-shadow(0 0 ${40 + Math.sin(glowIntensity / 10) * 20}px hsl(325 95% 68% / 0.3))
    `,
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Multi-layer background glow effects */}
      <div className="absolute inset-0 -inset-x-8 blur-3xl opacity-50 animate-pulse-slow">
        <div className="w-full h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
      </div>
      
      <div className="absolute inset-0 -inset-x-12 blur-2xl opacity-40">
        <div className="w-full h-full bg-gradient-to-l from-neon-pink via-neon-blue to-neon-cyan animate-pulse" />
      </div>

      {/* Main logo container */}
      <div className="relative" style={glowStyle}>
        {/* Logo text with individual letter animations */}
        <h1 className={`${sizeClasses[size]} font-bold tracking-wider relative z-10 flex items-center justify-center gap-2`}>
          {/* Letter S */}
          <span 
            className="inline-block animate-logo-float"
            style={{ 
              transform: `translateY(${Math.sin(glowIntensity / 10) * 8}px) rotate(${letterRotations[0]}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <span 
              className="relative inline-block"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${185 + glowIntensity} 95% 60%), 
                  hsl(${275 + glowIntensity} 85% 65%))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
              }}
            >
              S
            </span>
            {/* Letter glow underlay */}
            <span className="absolute inset-0 blur-sm opacity-60 bg-gradient-to-br from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              S
            </span>
          </span>

          {/* Letter L */}
          <span 
            className="inline-block animate-logo-float animation-delay-100"
            style={{ 
              transform: `translateY(${Math.sin(glowIntensity / 10 + 1) * 8}px) rotate(${letterRotations[1]}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <span 
              className="relative inline-block"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${275 + glowIntensity} 85% 65%), 
                  hsl(${325 + glowIntensity} 95% 68%))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite 0.5s',
              }}
            >
              L
            </span>
            <span className="absolute inset-0 blur-sm opacity-60 bg-gradient-to-br from-neon-purple to-neon-pink bg-clip-text text-transparent">
              L
            </span>
          </span>

          {/* Letter R */}
          <span 
            className="inline-block animate-logo-float animation-delay-200"
            style={{ 
              transform: `translateY(${Math.sin(glowIntensity / 10 + 2) * 8}px) rotate(${letterRotations[2]}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <span 
              className="relative inline-block"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${325 + glowIntensity} 95% 68%), 
                  hsl(${210 + glowIntensity} 100% 65%))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite 1s',
              }}
            >
              R
            </span>
            <span className="absolute inset-0 blur-sm opacity-60 bg-gradient-to-br from-neon-pink to-neon-blue bg-clip-text text-transparent">
              R
            </span>
          </span>

          {/* Letter P */}
          <span 
            className="inline-block animate-logo-float animation-delay-300"
            style={{ 
              transform: `translateY(${Math.sin(glowIntensity / 10 + 3) * 8}px) rotate(${letterRotations[3]}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <span 
              className="relative inline-block"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${210 + glowIntensity} 100% 65%), 
                  hsl(${185 + glowIntensity} 95% 60%))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite 1.5s',
              }}
            >
              P
            </span>
            <span className="absolute inset-0 blur-sm opacity-60 bg-gradient-to-br from-neon-blue to-neon-cyan bg-clip-text text-transparent">
              P
            </span>
          </span>
        </h1>

        {/* Subtitle with enhanced glow */}
        <div className="text-center mt-4">
          <p 
            className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-wide relative"
            style={{
              background: `linear-gradient(90deg, 
                hsl(${185 + glowIntensity / 2} 95% 70%), 
                hsl(${275 + glowIntensity / 2} 85% 65%), 
                hsl(${325 + glowIntensity / 2} 95% 68%), 
                hsl(${185 + glowIntensity / 2} 95% 70%))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 4s ease infinite',
              filter: 'drop-shadow(0 0 20px hsl(185 95% 60% / 0.5))',
            }}
          >
            Skylife Roleplay India
          </p>
        </div>

        {/* Decorative animated lines */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-0.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
            style={{
              transform: `translateX(${Math.sin(glowIntensity / 5) * 20}px)`,
            }}
          />
        </div>
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 w-10 h-0.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-l from-transparent via-neon-purple to-transparent"
            style={{
              transform: `translateX(${-Math.sin(glowIntensity / 5) * 20}px)`,
            }}
          />
        </div>

        {/* Corner accents */}
        <svg className="absolute -top-6 -left-6 w-8 h-8 opacity-60" viewBox="0 0 40 40">
          <path d="M 0 8 L 0 0 L 8 0" stroke="url(#corner1)" strokeWidth="2" fill="none" />
          <defs>
            <linearGradient id="corner1">
              <stop offset="0%" stopColor="hsl(185 95% 60%)" />
              <stop offset="100%" stopColor="hsl(275 85% 65%)" />
            </linearGradient>
          </defs>
        </svg>
        <svg className="absolute -top-6 -right-6 w-8 h-8 opacity-60" viewBox="0 0 40 40">
          <path d="M 32 0 L 40 0 L 40 8" stroke="url(#corner2)" strokeWidth="2" fill="none" />
          <defs>
            <linearGradient id="corner2">
              <stop offset="0%" stopColor="hsl(275 85% 65%)" />
              <stop offset="100%" stopColor="hsl(325 95% 68%)" />
            </linearGradient>
          </defs>
        </svg>
        <svg className="absolute -bottom-6 -left-6 w-8 h-8 opacity-60" viewBox="0 0 40 40">
          <path d="M 0 32 L 0 40 L 8 40" stroke="url(#corner3)" strokeWidth="2" fill="none" />
          <defs>
            <linearGradient id="corner3">
              <stop offset="0%" stopColor="hsl(325 95% 68%)" />
              <stop offset="100%" stopColor="hsl(210 100% 65%)" />
            </linearGradient>
          </defs>
        </svg>
        <svg className="absolute -bottom-6 -right-6 w-8 h-8 opacity-60" viewBox="0 0 40 40">
          <path d="M 40 32 L 40 40 L 32 40" stroke="url(#corner4)" strokeWidth="2" fill="none" />
          <defs>
            <linearGradient id="corner4">
              <stop offset="0%" stopColor="hsl(210 100% 65%)" />
              <stop offset="100%" stopColor="hsl(185 95% 60%)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Enhanced orbiting particles system */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary orbit */}
        {[0, 90, 180, 270].map((angle, i) => (
          <div
            key={`primary-${i}`}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${
                i === 0 ? 'hsl(185 95% 60%)' :
                i === 1 ? 'hsl(275 85% 65%)' :
                i === 2 ? 'hsl(325 95% 68%)' :
                'hsl(210 100% 65%)'
              }, transparent)`,
              transform: `rotate(${angle + glowIntensity * 3}deg) translateX(80px) rotate(-${angle + glowIntensity * 3}deg)`,
              boxShadow: `0 0 10px ${
                i === 0 ? 'hsl(185 95% 60%)' :
                i === 1 ? 'hsl(275 85% 65%)' :
                i === 2 ? 'hsl(325 95% 68%)' :
                'hsl(210 100% 65%)'
              }`,
            }}
          />
        ))}
        
        {/* Secondary counter-orbit */}
        {[45, 135, 225, 315].map((angle, i) => (
          <div
            key={`secondary-${i}`}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full opacity-60"
            style={{
              background: `radial-gradient(circle, hsl(${185 + i * 40} 95% 65%), transparent)`,
              transform: `rotate(${angle - glowIntensity * 2}deg) translateX(100px) rotate(-${angle - glowIntensity * 2}deg)`,
              boxShadow: `0 0 6px hsl(${185 + i * 40} 95% 65%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedLogo;
