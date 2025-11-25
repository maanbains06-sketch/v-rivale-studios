interface AnimatedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const AnimatedLogo = ({ className = "", size = "md" }: AnimatedLogoProps) => {
  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl",
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Enhanced background glow with multiple layers */}
      <div className="absolute inset-0 blur-3xl opacity-40 animate-pulse">
        <div className="w-full h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
      </div>

      {/* Main logo container */}
      <div className="relative">
        {/* Logo text with enhanced effects */}
        <h1 className={`${sizeClasses[size]} font-bold tracking-wider relative z-10 flex items-center justify-center gap-1`}>
          {/* Enhanced S Letter with special effects */}
          <span className="inline-block relative group">
            {/* Outer glow ring */}
            <span className="absolute inset-0 blur-xl opacity-60 animate-pulse">
              <span className="text-neon-cyan">S</span>
            </span>
            
            {/* Multiple shadow layers for depth */}
            <span className="absolute inset-0 animate-logo-float" style={{ 
              textShadow: '0 0 20px hsl(var(--neon-cyan)), 0 0 40px hsl(var(--neon-cyan)), 0 0 60px hsl(var(--neon-cyan))' 
            }}>
              <span className="bg-gradient-to-br from-white via-neon-cyan to-neon-purple bg-clip-text text-transparent">
                S
              </span>
            </span>
            
            {/* Main S letter with shimmer effect */}
            <span className="relative animate-logo-float" style={{
              textShadow: '0 0 10px hsl(var(--neon-cyan)), 0 0 20px hsl(var(--neon-purple)), 0 0 30px hsl(var(--neon-pink)), 0 5px 10px rgba(0,0,0,0.5)',
              filter: 'drop-shadow(0 0 15px hsl(var(--neon-cyan)))'
            }}>
              <span className="bg-gradient-to-br from-white via-neon-cyan to-neon-purple bg-clip-text text-transparent animate-gradient-shift">
                S
              </span>
            </span>
            
            {/* Orbiting particles around S */}
            <span className="absolute top-0 left-0 w-2 h-2 bg-neon-cyan rounded-full blur-sm animate-orbit opacity-80" />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-neon-purple rounded-full blur-sm animate-orbit opacity-80" style={{ animationDelay: '0.5s' }} />
          </span>

          <span className="inline-block animate-logo-float animation-delay-100">
            <span className="relative bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent" style={{
              textShadow: '0 0 10px hsl(var(--neon-purple))'
            }}>
              L
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-200">
            <span className="relative bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent" style={{
              textShadow: '0 0 10px hsl(var(--neon-pink))'
            }}>
              R
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-300">
            <span className="relative bg-gradient-to-r from-neon-blue to-neon-cyan bg-clip-text text-transparent" style={{
              textShadow: '0 0 10px hsl(var(--neon-blue))'
            }}>
              P
            </span>
          </span>
        </h1>

        {/* Subtitle with glow */}
        <div className="text-center mt-6">
          <p className="text-2xl md:text-3xl lg:text-4xl text-primary/90 tracking-wide font-medium" style={{
            textShadow: '0 0 20px hsl(var(--primary) / 0.5)'
          }}>
            Skylife Roleplay India
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLogo;
