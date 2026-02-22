import { ShieldAlert, Lock } from "lucide-react";

const LockdownScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-background to-red-950/20" />
      <div className="relative text-center max-w-lg mx-auto px-6 space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-red-500/10 ring-4 ring-red-500/20 flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <h1 className="text-4xl font-bold text-red-400">WEBSITE LOCKED DOWN</h1>
        <p className="text-muted-foreground text-lg">
          This website is currently in emergency lockdown mode. Access is restricted to authorized personnel only.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
          <Lock className="w-4 h-4" />
          <span>All services are temporarily suspended</span>
        </div>
      </div>
    </div>
  );
};

export default LockdownScreen;
