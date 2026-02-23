import { ReactNode } from "react";

interface CyberpunkFieldsetProps {
  legend: string;
  children: ReactNode;
  className?: string;
}

const CyberpunkFieldset = ({ legend, children, className = "" }: CyberpunkFieldsetProps) => {
  return (
    <fieldset className={`cyberpunk-fieldset ${className}`}>
      <legend className="cyberpunk-legend">{legend}</legend>
      <div className="p-4 md:p-6 space-y-4">
        {children}
      </div>
    </fieldset>
  );
};

export default CyberpunkFieldset;
