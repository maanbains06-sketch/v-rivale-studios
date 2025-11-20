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
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center animate-fade-in">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6 backdrop-blur-sm">
              <span className="text-sm font-semibold text-primary">{badge}</span>
            </div>
          )}
          
          <h1 className="text-5xl md:text-7xl font-bold text-gradient mb-6 leading-tight">
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
