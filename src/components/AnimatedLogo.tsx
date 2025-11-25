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
      {/* Subtle background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 blur-xl" />
      </div>

      {/* Main logo container */}
      <div className="relative">
        {/* Logo text with clean professional style */}
        <h1 className={`${sizeClasses[size]} font-bold tracking-wider relative z-10 flex items-center justify-center gap-1`}>
          {/* S Letter with subtle animation */}
          <span className="inline-block relative group transition-transform duration-300 hover:scale-110">
            <span className="relative text-foreground drop-shadow-lg">
              S
            </span>
          </span>

          <span className="inline-block relative transition-transform duration-300 hover:scale-110 animation-delay-100">
            <span className="relative text-foreground/90 drop-shadow-lg">
              L
            </span>
          </span>
          
          <span className="inline-block relative transition-transform duration-300 hover:scale-110 animation-delay-200">
            <span className="relative text-foreground/90 drop-shadow-lg">
              R
            </span>
          </span>
          
          <span className="inline-block relative transition-transform duration-300 hover:scale-110 animation-delay-300">
            <span className="relative text-foreground/90 drop-shadow-lg">
              P
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <div className="text-center mt-6">
          <p className="text-2xl md:text-3xl lg:text-4xl text-foreground/80 tracking-wide font-medium drop-shadow">
            Skylife Roleplay India
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLogo;
