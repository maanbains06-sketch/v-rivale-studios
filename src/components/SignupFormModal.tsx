import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Loader2, User, Mail, Calendar, Gamepad2, Rocket, CheckCircle2, ArrowRight, Sparkles, Crown, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

interface SignupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SignupFormData) => void;
  onSwitchToLogin: () => void;
  loading: boolean;
}

export interface SignupFormData {
  email: string;
  displayName: string;
  discordUsername: string;
  steamId: string;
  dobMonth: string;
  dobDay: string;
  dobYear: string;
  agreeToTerms: boolean;
  receiveUpdates: boolean;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(32, "Display name must be less than 32 characters"),
  discordUsername: z.string().min(2, "Discord username must be at least 2 characters").max(32, "Discord username must be less than 32 characters"),
  steamId: z.string().min(5, "Please enter a valid Steam ID"),
  dobMonth: z.string().min(1, "Please select your birth month"),
  dobDay: z.string().min(1, "Please select your birth day"),
  dobYear: z.string().min(1, "Please select your birth year"),
  agreeToTerms: z.boolean().refine((val) => val === true, { message: "You must agree to the terms" }),
});

const SignupFormModal = ({ open, onOpenChange, onSubmit, onSwitchToLogin, loading }: SignupFormModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    displayName: "",
    discordUsername: "",
    steamId: "",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    agreeToTerms: false,
    receiveUpdates: false,
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const calculateAge = (): number => {
    if (!formData.dobYear || !formData.dobMonth || !formData.dobDay) return 0;
    const birthDate = new Date(
      parseInt(formData.dobYear),
      months.indexOf(formData.dobMonth),
      parseInt(formData.dobDay)
    );
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse(formData);
    
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    const age = calculateAge();
    if (age < 16) {
      toast({
        title: "Age Requirement",
        description: "You must be at least 16 years old to join Skylife Roleplay India.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('slrp_signup_data', JSON.stringify({
      ...formData,
      age,
    }));

    onSubmit(formData);
  };

  const updateField = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filledFields = [
    formData.email,
    formData.displayName,
    formData.discordUsername,
    formData.steamId,
    formData.dobMonth && formData.dobDay && formData.dobYear ? "dob" : "",
  ].filter(Boolean).length;

  const progressPercentage = (filledFields / 5) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] p-0 overflow-hidden bg-transparent border-0 shadow-none">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="signup-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-2xl rounded-3xl border border-border/30 shadow-2xl overflow-hidden"
            >
              {/* Animated Background Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-primary/15 via-[#5865F2]/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -right-20 w-48 h-48 bg-[#5865F2]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-20 left-1/4 w-52 h-52 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                
                {/* Floating particles */}
                <div className="absolute top-24 right-12 w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
                <div className="absolute top-48 left-8 w-1.5 h-1.5 bg-[#5865F2]/40 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                <div className="absolute bottom-32 right-20 w-1 h-1 bg-green-500/40 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
              </div>
              
              {/* Gradient border glow */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-primary/40 via-[#5865F2]/30 to-green-500/30 -z-10 blur-sm opacity-60" />
              
              {/* Content with scroll */}
              <div className="relative z-10 max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="sticky top-0 z-20 bg-card/90 backdrop-blur-xl px-8 pt-6 pb-5 border-b border-border/20"
                >
                  <div className="flex items-center gap-4">
                    {/* SLRP Logo + Icon */}
                    <div className="relative flex items-center gap-3">
                      {/* SLRP Text Logo */}
                      <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-primary via-[#5865F2] to-primary bg-clip-text text-transparent">
                          SLRP
                        </span>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-10 w-px bg-border/40" />
                      
                      {/* Icon */}
                      <div className="relative">
                        <div className="absolute inset-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-[#5865F2]/30 blur-lg" />
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary to-[#5865F2] flex items-center justify-center shadow-lg shadow-primary/30 border border-white/10">
                          <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-card flex items-center justify-center shadow-lg">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        Create Account
                      </h2>
                      <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                        Join Skylife Roleplay India
                      </p>
                    </div>

                    {/* Progress Circle */}
                    <div className="hidden sm:flex flex-col items-center">
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-muted/30"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${progressPercentage * 1.26} 126`}
                            className="text-primary transition-all duration-500"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-foreground">{filledFields}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                  {/* Two column grid for first fields */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        Email
                      </Label>
                      <div className={`relative group transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-[#5865F2] opacity-0 transition-opacity duration-300 blur-sm ${focusedField === 'email' ? 'opacity-40' : 'group-hover:opacity-20'}`} />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@email.com"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          className="relative h-12 bg-background/80 backdrop-blur-sm border-border/40 rounded-xl text-sm placeholder:text-muted-foreground/40 focus:border-primary focus:ring-0 transition-all duration-300 pr-10"
                          required
                        />
                        {formData.email && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </div>

                    {/* Display Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary" />
                        In-Game Name
                      </Label>
                      <div className={`relative group transition-all duration-300 ${focusedField === 'displayName' ? 'scale-[1.02]' : ''}`}>
                        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-[#5865F2] opacity-0 transition-opacity duration-300 blur-sm ${focusedField === 'displayName' ? 'opacity-40' : 'group-hover:opacity-20'}`} />
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="John Doe"
                          value={formData.displayName}
                          onChange={(e) => updateField("displayName", e.target.value)}
                          onFocus={() => setFocusedField('displayName')}
                          onBlur={() => setFocusedField(null)}
                          className="relative h-12 bg-background/80 backdrop-blur-sm border-border/40 rounded-xl text-sm placeholder:text-muted-foreground/40 focus:border-primary focus:ring-0 transition-all duration-300 pr-10"
                          required
                        />
                        {formData.displayName && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Two column grid for Discord and Steam */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {/* Discord Username Field */}
                    <div className="space-y-2">
                      <Label htmlFor="discordUsername" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-[#5865F2]" />
                        Discord
                      </Label>
                      <div className={`relative group transition-all duration-300 ${focusedField === 'discord' ? 'scale-[1.02]' : ''}`}>
                        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] opacity-0 transition-opacity duration-300 blur-sm ${focusedField === 'discord' ? 'opacity-40' : 'group-hover:opacity-20'}`} />
                        <Input
                          id="discordUsername"
                          type="text"
                          placeholder="username"
                          value={formData.discordUsername}
                          onChange={(e) => updateField("discordUsername", e.target.value)}
                          onFocus={() => setFocusedField('discord')}
                          onBlur={() => setFocusedField(null)}
                          className="relative h-12 bg-background/80 backdrop-blur-sm border-border/40 rounded-xl text-sm placeholder:text-muted-foreground/40 focus:border-[#5865F2] focus:ring-0 transition-all duration-300 pr-10"
                          required
                        />
                        {formData.discordUsername && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </div>

                    {/* Steam ID Field */}
                    <div className="space-y-2">
                      <Label htmlFor="steamId" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                        Steam ID
                      </Label>
                      <div className={`relative group transition-all duration-300 ${focusedField === 'steam' ? 'scale-[1.02]' : ''}`}>
                        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-[#5865F2] opacity-0 transition-opacity duration-300 blur-sm ${focusedField === 'steam' ? 'opacity-40' : 'group-hover:opacity-20'}`} />
                        <Input
                          id="steamId"
                          type="text"
                          placeholder="steam:110000XXXXXXX"
                          value={formData.steamId}
                          onChange={(e) => updateField("steamId", e.target.value)}
                          onFocus={() => setFocusedField('steam')}
                          onBlur={() => setFocusedField(null)}
                          className="relative h-12 bg-background/80 backdrop-blur-sm border-border/40 rounded-xl text-sm placeholder:text-muted-foreground/40 focus:border-primary focus:ring-0 transition-all duration-300 pr-10"
                          required
                        />
                        {formData.steamId && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Date of Birth */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      Date of Birth
                      <span className="text-[10px] font-medium normal-case text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Must be 16+</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Select value={formData.dobMonth} onValueChange={(v) => updateField("dobMonth", v)}>
                        <SelectTrigger className="h-12 bg-background/80 backdrop-blur-sm border-border/40 rounded-xl text-sm focus:border-primary focus:ring-0">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={formData.dobDay} onValueChange={(v) => updateField("dobDay", v)}>
                        <SelectTrigger className="h-12 bg-background/80 backdrop-blur-sm border-border/40 rounded-xl text-sm focus:border-primary focus:ring-0">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={formData.dobYear} onValueChange={(v) => updateField("dobYear", v)}>
                        <SelectTrigger className="h-12 bg-background/80 backdrop-blur-sm border-border/40 rounded-xl text-sm focus:border-primary focus:ring-0">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>

                  {/* Checkboxes in styled container */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="space-y-3 p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl border border-border/30"
                  >
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <Checkbox
                        id="receiveUpdates"
                        checked={formData.receiveUpdates}
                        onCheckedChange={(checked) => updateField("receiveUpdates", checked as boolean)}
                        className="mt-0.5 h-5 w-5 rounded-md border-2 border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200"
                      />
                      <span className="text-sm text-muted-foreground/80 group-hover:text-foreground transition-colors leading-relaxed flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Send me updates about events and special offers
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => updateField("agreeToTerms", checked as boolean)}
                        className="mt-0.5 h-5 w-5 rounded-md border-2 border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200"
                        required
                      />
                      <span className="text-sm text-muted-foreground/80 group-hover:text-foreground transition-colors leading-relaxed">
                        <Shield className="w-4 h-4 inline-block mr-1.5 text-primary" />
                        I agree to the{" "}
                        <a href="/terms" className="text-primary hover:underline underline-offset-4 font-medium" target="_blank">Terms of Service</a>
                        {" "}and{" "}
                        <a href="/privacy" className="text-primary hover:underline underline-offset-4 font-medium" target="_blank">Privacy Policy</a>
                        {" "}<span className="text-destructive">*</span>
                      </span>
                    </label>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={loading || !formData.agreeToTerms}
                      className="relative w-full h-14 text-base font-bold bg-gradient-to-r from-[#5865F2] via-primary to-[#5865F2] hover:from-[#4752C4] hover:via-primary/90 hover:to-[#4752C4] text-white rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connecting to Discord...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Continue with Discord
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Divider */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="relative py-3"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-6 text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
                        Already a member?
                      </span>
                    </div>
                  </motion.div>

                  {/* Footer - Switch to Login */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.3 }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onSwitchToLogin();
                      }}
                      className="relative w-full h-12 text-sm font-semibold text-foreground/80 bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/60 rounded-2xl border border-border/40 transition-all duration-300 hover:border-[#5865F2]/40 hover:text-foreground group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/0 via-[#5865F2]/10 to-[#5865F2]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center justify-center gap-2">
                        Login to your account
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

export default SignupFormModal;
