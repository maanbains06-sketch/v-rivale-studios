import { ReactNode } from "react";

interface CyberpunkFormWrapperProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  description?: string;
}

const CyberpunkFormWrapper = ({ children, title, icon, description }: CyberpunkFormWrapperProps) => {
  return (
    <div className="cyberpunk-form-wrapper relative">
      {/* Starry background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="cyberpunk-stars" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[hsl(199,100%,55%,0.06)] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-[hsl(199,100%,55%,0.04)] rounded-full blur-[100px]" />
      </div>

      {/* Main container */}
      <div className="relative z-10">
        {/* Title header */}
        <div className="cyberpunk-title-bar text-center py-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            {icon && <span className="text-[hsl(var(--neon-cyan))]">{icon}</span>}
            <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-[hsl(var(--neon-cyan))] drop-shadow-[0_0_10px_hsl(185,100%,50%,0.5)]">
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-sm text-[hsl(0,0%,70%)] max-w-xl mx-auto mt-1">{description}</p>
          )}
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[hsl(var(--neon-cyan))]" />
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--neon-cyan))] shadow-[0_0_8px_hsl(185,100%,50%,0.6)]" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[hsl(var(--neon-cyan))]" />
          </div>
        </div>

        {/* Form content */}
        <div className="cyberpunk-form-content px-4 md:px-8 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CyberpunkFormWrapper;
