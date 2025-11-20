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
      {/* Subtle background glow */}
      <div className="absolute inset-0 blur-2xl opacity-30 animate-pulse-slow">
        <div className="w-full h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
      </div>

      {/* Main logo container */}
      <div className="relative">
        {/* Logo text with simple gradient */}
        <h1 className={`${sizeClasses[size]} font-bold tracking-wider relative z-10`}>
          <span className="inline-block animate-logo-float">
            <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              S
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-100">
            <span className="bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
              L
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-200">
            <span className="bg-gradient-to-r from-neon-pink to-neon-blue bg-clip-text text-transparent">
              R
            </span>
          </span>
          <span className="inline-block animate-logo-float animation-delay-300">
            <span className="bg-gradient-to-r from-neon-blue to-neon-cyan bg-clip-text text-transparent">
              P
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <div className="text-center mt-4">
          <p className="text-2xl md:text-3xl lg:text-4xl text-primary/90 tracking-wide font-medium">
            Skylife Roleplay India
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLogo;
