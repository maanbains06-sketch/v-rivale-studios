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
import { MessageCircle, Loader2, User, Mail, Calendar, Gamepad2, Rocket, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface SignupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SignupFormData) => void;
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

const SignupFormModal = ({ open, onOpenChange, onSubmit, loading }: SignupFormModalProps) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 overflow-hidden bg-transparent border-0 shadow-none">
        {/* Main Card with glass effect */}
        <div className="relative bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/40 shadow-2xl overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-[#5865F2]/20 opacity-40" />
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/40 via-transparent to-[#5865F2]/40 -z-10 blur-sm" />
          
          {/* Decorative circles */}
          <div className="absolute top-0 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#5865F2]/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/4" />
          
          {/* Content with scroll */}
          <div className="relative z-10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl px-8 pt-6 pb-4 border-b border-border/20">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-[#5865F2] flex items-center justify-center shadow-lg shadow-primary/25">
                    <Rocket className="w-7 h-7 text-white" />
                  </div>
                </div>
                
                {/* Text */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground" style={{ textShadow: 'none' }}>
                    Create Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Join Skylife Roleplay India
                  </p>
                </div>

                {/* Progress */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-muted-foreground mb-1">Progress</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`w-6 h-1.5 rounded-full transition-colors duration-300 ${
                          step <= filledFields ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {/* Two column grid for first fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="h-11 bg-background/60 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      required
                    />
                    {formData.email && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Display Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    In-Game Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.displayName}
                      onChange={(e) => updateField("displayName", e.target.value)}
                      className="h-11 bg-background/60 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      required
                    />
                    {formData.displayName && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Two column grid for Discord and Steam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Discord Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="discordUsername" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-[#5865F2]" />
                    Discord
                  </Label>
                  <div className="relative">
                    <Input
                      id="discordUsername"
                      type="text"
                      placeholder="username"
                      value={formData.discordUsername}
                      onChange={(e) => updateField("discordUsername", e.target.value)}
                      className="h-11 bg-background/60 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/20 transition-all duration-300"
                      required
                    />
                    {formData.discordUsername && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Steam ID Field */}
                <div className="space-y-2">
                  <Label htmlFor="steamId" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                    Steam ID
                  </Label>
                  <div className="relative">
                    <Input
                      id="steamId"
                      type="text"
                      placeholder="steam:110000XXXXXXX"
                      value={formData.steamId}
                      onChange={(e) => updateField("steamId", e.target.value)}
                      className="h-11 bg-background/60 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      required
                    />
                    {formData.steamId && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Date of Birth
                  <span className="text-[10px] font-normal normal-case text-muted-foreground/70">(Must be 16+)</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <Select value={formData.dobMonth} onValueChange={(v) => updateField("dobMonth", v)}>
                    <SelectTrigger className="h-11 bg-background/60 border-border/50 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={formData.dobDay} onValueChange={(v) => updateField("dobDay", v)}>
                    <SelectTrigger className="h-11 bg-background/60 border-border/50 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={formData.dobYear} onValueChange={(v) => updateField("dobYear", v)}>
                    <SelectTrigger className="h-11 bg-background/60 border-border/50 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkboxes in styled container */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="receiveUpdates"
                    checked={formData.receiveUpdates}
                    onCheckedChange={(checked) => updateField("receiveUpdates", checked as boolean)}
                    className="mt-0.5 border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="receiveUpdates" className="text-xs text-muted-foreground cursor-pointer leading-relaxed font-normal">
                    Send me updates about events and special offers (optional)
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => updateField("agreeToTerms", checked as boolean)}
                    className="mt-0.5 border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    required
                  />
                  <Label htmlFor="agreeToTerms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed font-normal">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline" target="_blank">Terms of Service</a>
                    {" "}and{" "}
                    <a href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</a>
                    {" "}<span className="text-destructive">*</span>
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !formData.agreeToTerms}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#5865F2] to-primary hover:from-[#4752C4] hover:to-primary/90 text-white rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting to Discord...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Continue with Discord
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="text-center pt-2 pb-2">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-normal"
                  onClick={() => onOpenChange(false)}
                >
                  Already have an account? <span className="font-medium text-primary">Login</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupFormModal;
