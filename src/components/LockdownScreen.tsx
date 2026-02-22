import { useState } from "react";
import { ShieldAlert, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const LockdownScreen = () => {
  const { toast } = useToast();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if the logged-in user is the owner
      const { data: ownerResult } = await supabase.rpc("is_owner", { _user_id: data.user.id });
      if (!ownerResult) {
        await supabase.auth.signOut();
        toast({ title: "Access Denied", description: "Only the site owner can access during lockdown.", variant: "destructive" });
      } else {
        // Reload to let App.tsx re-evaluate isOwnerUser
        window.location.reload();
      }
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-background to-red-950/20" />

      {/* Animated scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 3px)", backgroundSize: "100% 4px" }}
      />

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

        {/* Owner Login Section */}
        {!showLogin ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogin(true)}
            className="mt-8 text-muted-foreground/40 hover:text-muted-foreground/70 text-xs gap-1.5 border border-transparent hover:border-red-500/20 transition-all duration-300"
          >
            <LogIn className="w-3.5 h-3.5" />
            Owner Access
          </Button>
        ) : (
          <form onSubmit={handleLogin} className="mt-8 mx-auto max-w-xs space-y-4 p-5 rounded-xl border border-red-500/20 bg-card/50 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Lock className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Owner Authentication</span>
            </div>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="lockdown-email" className="text-xs text-muted-foreground">Email</Label>
              <Input
                id="lockdown-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                autoComplete="email"
                className="h-9 text-sm border-red-500/20 focus:border-red-500/40 bg-background/50"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="lockdown-password" className="text-xs text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="lockdown-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-9 text-sm pr-9 border-red-500/20 focus:border-red-500/40 bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-9 text-sm bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              {loading ? "Verifying..." : "Login as Owner"}
            </Button>
            <button
              type="button"
              onClick={() => { setShowLogin(false); setEmail(""); setPassword(""); }}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LockdownScreen;
