interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  backgroundImage?: string;
}

const PageHeader = ({ title, description, badge, backgroundImage }: PageHeaderProps) => {
  return (
    <section 
      className="relative min-h-[40vh] flex items-center justify-center overflow-hidden mb-12"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background"></div>
      
      {/* Glowing effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-neon-cyan/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-[250px] h-[200px] bg-neon-purple/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center animate-fade-in">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6 backdrop-blur-sm shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <span className="text-sm font-semibold text-primary">{badge}</span>
            </div>
          )}
          
          <h1 className="text-5xl md:text-7xl font-bold text-gradient mb-6 leading-tight drop-shadow-[0_0_30px_rgba(var(--primary),0.4)]">
            {title}
          </h1>
          
          {description && (
            <p className="text-xl md:text-2xl text-foreground/90 max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
