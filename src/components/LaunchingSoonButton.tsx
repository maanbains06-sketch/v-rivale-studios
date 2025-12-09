import { useNavigate } from "react-router-dom";

const LaunchingSoonButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/whitelist")}
      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border/30 hover:bg-muted transition-all duration-300 hover:scale-105 shadow-lg"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <span className="text-sm font-medium text-foreground">
        Launching Soon • Pre-Registration Open
      </span>
    </button>
  );
};

export default LaunchingSoonButton;