interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  minHeight?: string;
}

const PageHeader = ({ title, description, badge, backgroundImage, backgroundPosition = 'center 25%', minHeight = '40vh' }: PageHeaderProps) => {
  return (
    <section 
      className="relative flex items-center justify-center overflow-hidden mb-12 pt-20"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: backgroundPosition,
        minHeight: minHeight,
      }}
    >
      {/* Gradient overlay - 50% opacity */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/50 to-background/50"></div>
      
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center animate-fade-in flex flex-col items-center">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/30 border border-primary/50 mb-4 backdrop-blur-md shadow-[0_0_25px_rgba(var(--primary),0.5)] animate-pulse">
              <span className="text-sm font-bold text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ filter: 'brightness(1.3)' }}>{badge}</span>
            </div>
          )}
          
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight py-2 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%),_0_4px_16px_rgb(0_0_0_/_60%),_0_0_30px_hsl(var(--primary)_/_50%)]">
            {title}
          </h1>
          
          {description && (
            <p className="text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
