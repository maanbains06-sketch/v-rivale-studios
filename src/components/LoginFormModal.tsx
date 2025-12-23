import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { MessageCircle, Loader2, Mail, Lock, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface LoginFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LoginFormData) => void;
  onSwitchToSignup: () => void;
  loading: boolean;
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
}

export interface LoginFormData {
  email: string;
  password: string;
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

const LoginFormModal = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onSwitchToSignup,
  loading,
  rememberMe,
  onRememberMeChange 
}: LoginFormModalProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse(formData);
    
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('slrp_login_email', formData.email);
    onSubmit(formData);
  };

  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-transparent border-0 shadow-none">
        {/* Main Card with glass effect */}
        <div className="relative bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/40 shadow-2xl overflow-hidden">
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#5865F2]/30 via-transparent to-primary/20 opacity-50" />
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#5865F2]/50 via-transparent to-primary/30 -z-10 blur-sm" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#5865F2]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="relative px-8 pt-8 pb-6 text-center">
              {/* Logo/Icon */}
              <div className="relative inline-flex mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-xl shadow-[#5865F2]/30">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-card flex items-center justify-center animate-pulse">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ textShadow: 'none' }}>
                Welcome Back!
              </h2>
              <p className="text-muted-foreground text-sm">
                Sign in to continue your journey
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#5865F2]" />
                  Email or Username
                </Label>
                <div className="relative group">
                  <Input
                    id="login-email"
                    type="text"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="h-12 bg-background/60 border-border/50 rounded-xl pl-4 pr-4 text-base placeholder:text-muted-foreground/50 focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/20 transition-all duration-300"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#5865F2]/0 via-[#5865F2]/5 to-[#5865F2]/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#5865F2]" />
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-[#5865F2] hover:text-[#4752C4] transition-colors font-medium"
                    onClick={() => window.open('https://discord.com/reset', '_blank')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="h-12 bg-background/60 border-border/50 rounded-xl pl-4 pr-12 text-base placeholder:text-muted-foreground/50 focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/20 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="login-remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => onRememberMeChange(checked as boolean)}
                    className="border-border/60 data-[state=checked]:bg-[#5865F2] data-[state=checked]:border-[#5865F2]"
                  />
                  <Label htmlFor="login-remember" className="text-sm text-muted-foreground cursor-pointer font-normal">
                    Remember me
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl shadow-lg shadow-[#5865F2]/25 hover:shadow-xl hover:shadow-[#5865F2]/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Login with Discord
                  </>
                )}
              </Button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Secured with Discord OAuth2</span>
              </div>

              {/* Divider */}
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-xs text-muted-foreground uppercase tracking-wider">
                    New here?
                  </span>
                </div>
              </div>

              {/* Switch to Signup */}
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToSignup();
                }}
                className="w-full h-11 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted rounded-xl border border-border/50 transition-all duration-300 hover:border-[#5865F2]/30"
              >
                Create an account
              </button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginFormModal;
