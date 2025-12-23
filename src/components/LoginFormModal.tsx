import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, Loader2, LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
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

    // Store email for reference after OAuth
    localStorage.setItem('slrp_login_email', formData.email);
    
    onSubmit(formData);
  };

  const updateField = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-background/95 backdrop-blur-xl border-border/50 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-[#5865F2]/20 via-[#5865F2]/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
              <LogIn className="w-7 h-7 text-[#5865F2]" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Welcome Back!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Login to your Skylife Roleplay India account
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <Mail className="w-3 h-3" />
              Email or Discord Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="login-email"
              type="text"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-[#5865F2] h-12 text-base"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => window.open('https://discord.com/reset', '_blank')}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="bg-muted/50 border-border/50 focus:border-[#5865F2] h-12 text-base pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="login-remember"
              checked={rememberMe}
              onCheckedChange={(checked) => onRememberMeChange(checked as boolean)}
            />
            <Label htmlFor="login-remember" className="text-sm text-muted-foreground cursor-pointer">
              Remember me on this device
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full h-12 text-base bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting to Discord...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5 mr-2" />
                Login with Discord
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Your login will be verified through Discord OAuth for security. 
              Make sure you're a member of the{" "}
              <span className="text-primary font-medium">Skylife Roleplay India</span>{" "}
              Discord server.
            </p>
          </div>

          {/* Footer Links */}
          <div className="text-center pt-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => {
                  onOpenChange(false);
                  onSwitchToSignup();
                }}
              >
                Register now
              </button>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginFormModal;
