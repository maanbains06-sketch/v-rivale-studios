import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { MessageCircle, Loader2, Mail, Lock, Eye, EyeOff, Shield, Sparkles, ArrowRight, Stars, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-transparent border-0 shadow-none">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="login-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-2xl rounded-3xl border border-border/30 shadow-2xl overflow-hidden"
            >
              {/* Animated Background Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-b from-[#5865F2]/20 via-[#5865F2]/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#5865F2]/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                
                {/* Floating particles */}
                <div className="absolute top-20 left-10 w-2 h-2 bg-[#5865F2]/40 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
                <div className="absolute top-32 right-16 w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                <div className="absolute bottom-40 left-20 w-1 h-1 bg-[#5865F2]/30 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
              </div>
              
              {/* Gradient border glow */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#5865F2]/40 via-transparent to-primary/40 -z-10 blur-sm opacity-60" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="relative px-8 pt-10 pb-6 text-center"
                >
                  {/* Logo with ring animation */}
                  <div className="relative inline-flex mb-6">
                    <div className="absolute inset-0 w-24 h-24 rounded-2xl bg-[#5865F2]/30 blur-xl animate-pulse" />
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#5865F2] via-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-2xl shadow-[#5865F2]/40 border border-white/10">
                      <MessageCircle className="w-12 h-12 text-white" />
                      
                      {/* Animated ring */}
                      <div className="absolute -inset-2 rounded-2xl border-2 border-[#5865F2]/30 animate-ping" style={{ animationDuration: '2s' }} />
                    </div>
                    
                    {/* Online status */}
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-4 border-card flex items-center justify-center shadow-lg shadow-green-500/30">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent mb-2">
                    Welcome Back!
                  </h2>
                  <p className="text-muted-foreground/80 flex items-center justify-center gap-2">
                    <Stars className="w-4 h-4 text-[#5865F2]" />
                    Sign in to continue your journey
                    <Stars className="w-4 h-4 text-[#5865F2]" />
                  </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
                  {/* Email Field */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#5865F2]" />
                      Email or Username
                    </Label>
                    <div className={`relative group transition-all duration-500 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] opacity-0 transition-opacity duration-300 blur-sm ${focusedField === 'email' ? 'opacity-50' : 'group-hover:opacity-30'}`} />
                      <Input
                        id="login-email"
                        type="text"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="relative h-14 bg-background/80 backdrop-blur-sm border-border/40 rounded-2xl pl-5 pr-5 text-base placeholder:text-muted-foreground/40 focus:border-[#5865F2] focus:ring-0 focus:bg-background transition-all duration-300"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-[#5865F2]" />
                        Password
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-[#5865F2] hover:text-[#4752C4] transition-colors font-semibold hover:underline underline-offset-4"
                        onClick={() => window.open('https://discord.com/reset', '_blank')}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className={`relative group transition-all duration-500 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] opacity-0 transition-opacity duration-300 blur-sm ${focusedField === 'password' ? 'opacity-50' : 'group-hover:opacity-30'}`} />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="relative h-14 bg-background/80 backdrop-blur-sm border-border/40 rounded-2xl pl-5 pr-14 text-base placeholder:text-muted-foreground/40 focus:border-[#5865F2] focus:ring-0 focus:bg-background transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Remember Me - Enhanced */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="flex items-center justify-between pt-1 px-1"
                  >
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <Checkbox
                          id="login-remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => onRememberMeChange(checked as boolean)}
                          className="h-5 w-5 rounded-md border-2 border-border/60 data-[state=checked]:bg-[#5865F2] data-[state=checked]:border-[#5865F2] transition-all duration-200"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground/80 group-hover:text-foreground transition-colors flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" />
                        Remember me
                      </span>
                    </label>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="relative w-full h-14 text-base font-bold bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3a43b8] text-white rounded-2xl shadow-xl shadow-[#5865F2]/30 hover:shadow-2xl hover:shadow-[#5865F2]/40 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Login with Discord
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Security Badge */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="flex items-center justify-center gap-2 pt-3"
                  >
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Secured with Discord OAuth2</span>
                    </div>
                  </motion.div>

                  {/* Divider */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="relative py-4"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-6 text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
                        New to SLRP?
                      </span>
                    </div>
                  </motion.div>

                  {/* Switch to Signup */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.3 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onSwitchToSignup();
                      }}
                      className="relative w-full h-12 text-sm font-semibold text-foreground/80 bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/60 rounded-2xl border border-border/40 transition-all duration-300 hover:border-[#5865F2]/40 hover:text-foreground group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/0 via-[#5865F2]/10 to-[#5865F2]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center justify-center gap-2">
                        Create an account
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default LoginFormModal;
