import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  User,
  Hash,
  Link2,
  Users,
  TrendingUp,
  Clock,
  Gamepad2,
  Palette,
  Gift,
  Upload,
  X,
  Loader2,
  Shield,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const creatorSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  discordUsername: z.string().min(2, "Discord username is required").max(50),
  discordId: z.string().regex(/^\d{17,19}$/, "Discord ID must be 17-19 digits").optional().or(z.literal("")),
  steamId: z.string().min(5, "Steam ID is required").max(50),
  contactEmail: z.string().email("Please enter a valid email address").max(255),
  channelUrl: z.string().url("Please enter a valid URL"),
  platform: z.string().min(1, "Please select a platform"),
  averageViewers: z.string().min(1, "Please select average viewers"),
  contentFrequency: z.string().min(1, "Please select content frequency"),
  averageCcv: z.string().min(1, "Please enter your average CCV").max(100),
  rpExperience: z.string().min(20, "Please describe your RP experience (min 20 characters)").max(1000),
  contentStyle: z.string().min(20, "Please describe your content style (min 20 characters)").max(1000),
  whyJoin: z.string().min(50, "Please explain why you want to join (min 50 characters)").max(1500),
  expectedBenefits: z.string().min(20, "Please describe expected benefits (min 20 characters)").max(1000),
  valueContribution: z.string().min(20, "Please describe your contribution (min 20 characters)").max(1000),
  storylineIdeas: z.string().max(1500).optional(),
  complyWithPolicies: z.boolean().refine(val => val === true, "You must agree to comply with server policies"),
  socialLinks: z.string().max(500).optional(),
});

type CreatorFormData = z.infer<typeof creatorSchema>;

interface CreatorApplicationFormProps {
  onClose: () => void;
}

const FormField = ({ label, icon, required, error, children }: { 
  label: string; 
  icon?: React.ReactNode; 
  required?: boolean; 
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2 text-sm font-medium">
      {icon}
      {label}
      {required && <span className="text-red-400">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const CreatorApplicationForm = ({ onClose }: CreatorApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ownershipProofFile, setOwnershipProofFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<CreatorFormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof CreatorFormData, string>>>({});

  const handleInputChange = (field: keyof CreatorFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      setOwnershipProofFile(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Please upload an image (JPG, PNG, GIF, WebP) or PDF file");
      setOwnershipProofFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size must be less than 10MB");
      setOwnershipProofFile(null);
      return;
    }

    setOwnershipProofFile(file);
  };

  const uploadOwnershipProof = async (): Promise<string | null> => {
    if (!ownershipProofFile) return null;

    setIsUploading(true);
    try {
      const fileExt = ownershipProofFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-proofs')
        .upload(filePath, ownershipProofFile);

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload ownership proof');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFileError(null);

    try {
      const validatedData = creatorSchema.parse(formData);

      if (!ownershipProofFile) {
        setFileError("Please upload ownership proof of your channel");
        setIsSubmitting(false);
        return;
      }

      const proofUrl = await uploadOwnershipProof();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("creator_applications").insert({
        full_name: validatedData.fullName,
        discord_username: validatedData.discordUsername,
        discord_id: validatedData.discordId || null,
        steam_id: validatedData.steamId,
        contact_email: validatedData.contactEmail,
        channel_url: validatedData.channelUrl,
        platform: validatedData.platform,
        average_viewers: validatedData.averageViewers,
        content_frequency: validatedData.contentFrequency,
        average_ccv: validatedData.averageCcv,
        rp_experience: validatedData.rpExperience,
        content_style: validatedData.contentStyle,
        why_join: validatedData.whyJoin,
        expected_benefits: validatedData.expectedBenefits,
        value_contribution: validatedData.valueContribution,
        storyline_ideas: validatedData.storylineIdeas || null,
        comply_with_policies: validatedData.complyWithPolicies,
        social_links: validatedData.socialLinks || null,
        ownership_proof_url: proofUrl,
        user_id: user?.id || null,
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you on Discord within 24-48 hours.",
      });

      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreatorFormData, string>> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof CreatorFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: "Something went wrong. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-rose-800/90 via-red-800/80 to-rose-800/90 backdrop-blur-xl px-6 py-4 border-b border-rose-300/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Creator Program Application</h2>
              <p className="text-rose-200/60 text-sm">Join the elite creators of SLRP</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-rose-200/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Personal Information */}
        <Card className="border-border/30 bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic details</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <FormField label="Full Name" icon={<User className="w-4 h-4" />} required error={errors.fullName}>
              <Input
                placeholder="Your full name"
                value={formData.fullName || ""}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </FormField>
            <FormField label="Discord Username" icon={<Hash className="w-4 h-4" />} required error={errors.discordUsername}>
              <Input
                placeholder="username#1234"
                value={formData.discordUsername || ""}
                onChange={(e) => handleInputChange("discordUsername", e.target.value)}
              />
            </FormField>
            <FormField label="Discord ID" icon={<Hash className="w-4 h-4" />} error={errors.discordId}>
              <Input
                placeholder="Your 17-19 digit Discord ID"
                value={formData.discordId || ""}
                onChange={(e) => handleInputChange("discordId", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Right-click your profile &gt; Copy User ID</p>
            </FormField>
            <FormField label="Steam ID" icon={<Gamepad2 className="w-4 h-4" />} required error={errors.steamId}>
              <Input
                placeholder="steam:110000xxxxxxxx"
                value={formData.steamId || ""}
                onChange={(e) => handleInputChange("steamId", e.target.value)}
              />
            </FormField>
            <FormField label="Contact Email" icon={<Mail className="w-4 h-4" />} required error={errors.contactEmail}>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.contactEmail || ""}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Channel Details */}
        <Card className="border-border/30 bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5 text-primary" />
              Channel Details
            </CardTitle>
            <CardDescription>Your streaming platform information</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <FormField label="Platform" required error={errors.platform}>
              <Select value={formData.platform || ""} onValueChange={(v) => handleInputChange("platform", v)}>
                <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitch">Twitch</SelectItem>
                  <SelectItem value="facebook">Facebook Gaming</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Channel URL" icon={<Link2 className="w-4 h-4" />} required error={errors.channelUrl}>
              <Input
                placeholder="https://youtube.com/@yourchannel"
                value={formData.channelUrl || ""}
                onChange={(e) => handleInputChange("channelUrl", e.target.value)}
              />
            </FormField>
            <FormField label="Average Viewers" icon={<Users className="w-4 h-4" />} required error={errors.averageViewers}>
              <Select value={formData.averageViewers || ""} onValueChange={(v) => handleInputChange("averageViewers", v)}>
                <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50">0-50</SelectItem>
                  <SelectItem value="50-100">50-100</SelectItem>
                  <SelectItem value="100-500">100-500</SelectItem>
                  <SelectItem value="500-1000">500-1000</SelectItem>
                  <SelectItem value="1000+">1000+</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Content Frequency" icon={<Clock className="w-4 h-4" />} required error={errors.contentFrequency}>
              <Select value={formData.contentFrequency || ""} onValueChange={(v) => handleInputChange("contentFrequency", v)}>
                <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="3-5-week">3-5 times/week</SelectItem>
                  <SelectItem value="1-2-week">1-2 times/week</SelectItem>
                  <SelectItem value="few-month">Few times/month</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Average CCV" icon={<TrendingUp className="w-4 h-4" />} required error={errors.averageCcv}>
              <Input
                placeholder="Your concurrent viewer count"
                value={formData.averageCcv || ""}
                onChange={(e) => handleInputChange("averageCcv", e.target.value)}
              />
            </FormField>
            <FormField label="Social Links (Optional)" icon={<Link2 className="w-4 h-4" />} error={errors.socialLinks}>
              <Input
                placeholder="Twitter, Instagram, etc."
                value={formData.socialLinks || ""}
                onChange={(e) => handleInputChange("socialLinks", e.target.value)}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Experience & Content */}
        <Card className="border-border/30 bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Experience & Content
            </CardTitle>
            <CardDescription>Tell us about your RP experience and content style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="RP Experience" icon={<Gamepad2 className="w-4 h-4" />} required error={errors.rpExperience}>
              <Textarea
                placeholder="Describe your roleplay experience..."
                value={formData.rpExperience || ""}
                onChange={(e) => handleInputChange("rpExperience", e.target.value)}
                className="min-h-[100px]"
              />
            </FormField>
            <FormField label="Content Style" icon={<Palette className="w-4 h-4" />} required error={errors.contentStyle}>
              <Textarea
                placeholder="Describe your content style and approach..."
                value={formData.contentStyle || ""}
                onChange={(e) => handleInputChange("contentStyle", e.target.value)}
                className="min-h-[100px]"
              />
            </FormField>
            <FormField label="Why Join SLRP?" required error={errors.whyJoin}>
              <Textarea
                placeholder="Why do you want to join our creator program?"
                value={formData.whyJoin || ""}
                onChange={(e) => handleInputChange("whyJoin", e.target.value)}
                className="min-h-[120px]"
              />
            </FormField>
            <FormField label="Expected Benefits" icon={<Gift className="w-4 h-4" />} required error={errors.expectedBenefits}>
              <Textarea
                placeholder="What benefits do you expect from this partnership?"
                value={formData.expectedBenefits || ""}
                onChange={(e) => handleInputChange("expectedBenefits", e.target.value)}
                className="min-h-[100px]"
              />
            </FormField>
            <FormField label="Value Contribution" required error={errors.valueContribution}>
              <Textarea
                placeholder="How will you contribute value to SLRP?"
                value={formData.valueContribution || ""}
                onChange={(e) => handleInputChange("valueContribution", e.target.value)}
                className="min-h-[100px]"
              />
            </FormField>
            <FormField label="Storyline Ideas (Optional)" error={errors.storylineIdeas}>
              <Textarea
                placeholder="Share any storyline or content ideas you have..."
                value={formData.storylineIdeas || ""}
                onChange={(e) => handleInputChange("storylineIdeas", e.target.value)}
                className="min-h-[80px]"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card className="border-border/30 bg-background/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Verification
            </CardTitle>
            <CardDescription>Upload proof and agree to terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Ownership Proof" icon={<Upload className="w-4 h-4" />} required error={fileError || undefined}>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot showing you are the owner of the channel (e.g., dashboard screenshot)
                </p>
                {ownershipProofFile && (
                  <p className="text-xs text-green-400">✓ File selected: {ownershipProofFile.name}</p>
                )}
              </div>
            </FormField>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/30">
              <Checkbox
                id="comply"
                checked={formData.complyWithPolicies || false}
                onCheckedChange={(checked) => handleInputChange("complyWithPolicies", checked === true)}
              />
              <div className="space-y-1">
                <label htmlFor="comply" className="text-sm font-medium cursor-pointer">
                  I agree to comply with SLRP server policies and creator guidelines
                </label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you confirm that you will follow all server rules and represent SLRP positively.
                </p>
              </div>
            </div>
            {errors.complyWithPolicies && (
              <p className="text-xs text-red-400">{errors.complyWithPolicies}</p>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isSubmitting || isUploading} 
          className="w-full py-6 text-lg bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600"
        >
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {isUploading ? "Uploading..." : "Submitting..."}
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </form>
    </div>
  );
};

export default CreatorApplicationForm;