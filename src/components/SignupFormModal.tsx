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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Loader2, ArrowRight, User, Mail, Calendar, Gamepad2 } from "lucide-react";
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

    // Store form data in localStorage for use after Discord OAuth
    localStorage.setItem('slrp_signup_data', JSON.stringify({
      ...formData,
      age,
    }));

    onSubmit(formData);
  };

  const updateField = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Create Your Account
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Fill in your details to join Skylife Roleplay India
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <Mail className="w-3 h-3" />
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-primary h-11"
              required
            />
          </div>

          {/* Display Name Field */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <User className="w-3 h-3" />
              In-Game Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-primary h-11"
              required
            />
          </div>

          {/* Discord Username Field */}
          <div className="space-y-2">
            <Label htmlFor="discordUsername" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <MessageCircle className="w-3 h-3" />
              Discord Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="discordUsername"
              type="text"
              placeholder="username"
              value={formData.discordUsername}
              onChange={(e) => updateField("discordUsername", e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-primary h-11"
              required
            />
          </div>

          {/* Steam ID Field */}
          <div className="space-y-2">
            <Label htmlFor="steamId" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <Gamepad2 className="w-3 h-3" />
              Steam ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="steamId"
              type="text"
              placeholder="STEAM_0:1:12345678"
              value={formData.steamId}
              onChange={(e) => updateField("steamId", e.target.value)}
              className="bg-muted/50 border-border/50 focus:border-primary h-11"
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Select value={formData.dobMonth} onValueChange={(v) => updateField("dobMonth", v)}>
                <SelectTrigger className="bg-muted/50 border-border/50 h-11">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={formData.dobDay} onValueChange={(v) => updateField("dobDay", v)}>
                <SelectTrigger className="bg-muted/50 border-border/50 h-11">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={formData.dobYear} onValueChange={(v) => updateField("dobYear", v)}>
                <SelectTrigger className="bg-muted/50 border-border/50 h-11">
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

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="receiveUpdates"
                checked={formData.receiveUpdates}
                onCheckedChange={(checked) => updateField("receiveUpdates", checked as boolean)}
                className="mt-0.5"
              />
              <Label htmlFor="receiveUpdates" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                (Optional) Send me updates about events, tips, and special offers. You can opt out anytime.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => updateField("agreeToTerms", checked as boolean)}
                className="mt-0.5"
                required
              />
              <Label htmlFor="agreeToTerms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
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
                Continue with Discord
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* Footer Links */}
          <div className="text-center pt-2">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => onOpenChange(false)}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignupFormModal;
