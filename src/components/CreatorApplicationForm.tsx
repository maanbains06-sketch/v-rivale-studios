import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, 
  User,
  Mail,
  Hash,
  Link2,
  Youtube,
  Twitch,
  Users,
  TrendingUp,
  Clock,
  Gamepad2,
  Palette,
  Heart,
  Gift,
  Sparkles,
  Upload,
  FileCheck,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  Shield,
  Eye,
  AlertCircle
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
import { Progress } from "@/components/ui/progress";

const creatorSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  discordUsername: z.string().min(2, "Discord username is required").max(50),
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

const steps = [
  { id: 1, title: "Personal Info", icon: User, description: "Your basic details" },
  { id: 2, title: "Channel Details", icon: Video, description: "Streaming platform info" },
  { id: 3, title: "Experience", icon: Gamepad2, description: "Your RP background" },
  { id: 4, title: "Additional Info", icon: Sparkles, description: "Final details" },
];

const CreatorApplicationForm = ({ onClose }: CreatorApplicationFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
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

  const validateStep = (step: number): boolean => {
    const stepFields: Record<number, (keyof CreatorFormData)[]> = {
      1: ['fullName', 'discordUsername', 'steamId', 'contactEmail'],
      2: ['platform', 'channelUrl', 'averageViewers', 'contentFrequency', 'averageCcv'],
      3: ['rpExperience', 'contentStyle', 'whyJoin', 'expectedBenefits', 'valueContribution'],
      4: ['complyWithPolicies'],
    };

    const fieldsToValidate = stepFields[step] || [];
    const newErrors: Partial<Record<keyof CreatorFormData, string>> = {};
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const value = formData[field];
      if (field === 'complyWithPolicies') {
        if (value !== true) {
          newErrors[field] = "You must agree to comply with server policies";
          isValid = false;
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = "This field is required";
        isValid = false;
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
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

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-red-500/20 via-rose-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-orange-500/15 via-red-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-red-500/5 to-transparent rounded-full" />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-400/40 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-rose-800/60 via-red-800/50 to-rose-800/60 backdrop-blur-2xl px-6 py-6 border-b border-rose-300/20">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(251,113,133,0.05)_50%,transparent_75%)] bg-[length:20px_20px]" />
        
        <div className="relative flex items-center gap-4">
          <motion.div 
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-xl shadow-rose-500/25"
            animate={{ 
              boxShadow: ['0 10px 40px rgba(251, 113, 133, 0.25)', '0 10px 60px rgba(251, 113, 133, 0.4)', '0 10px 40px rgba(251, 113, 133, 0.25)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Video className="w-7 h-7 text-white" />
            <motion.div 
              className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-background flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Check className="w-2.5 h-2.5 text-emerald-900" />
            </motion.div>
          </motion.div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent">
              Creator Program Application
            </h2>
            <p className="text-red-200/60 text-sm mt-0.5">Join the elite creators of SLRP</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="text-red-200/60 hover:text-white hover:bg-red-500/20 rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 relative">
          <div className="absolute inset-0 bg-rose-950/30 rounded-full" />
          <Progress value={progressPercentage} className="h-2 bg-rose-900/40" />
          <div 
            className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 transition-all duration-500 shadow-lg shadow-rose-400/40"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="mt-6 flex justify-between relative">
          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              className="flex flex-col items-center relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  currentStep === step.id 
                    ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg shadow-rose-400/35' 
                    : currentStep > step.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-400/10 text-rose-300/50 border border-rose-400/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </motion.div>
              <span className={`mt-2 text-xs font-medium transition-colors ${
                currentStep === step.id ? 'text-rose-200' : 'text-rose-300/40'
              }`}>
                {step.title}
              </span>
            </motion.div>
          ))}
          <div className="absolute top-6 left-12 right-12 h-0.5 bg-rose-400/15 -z-0">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="relative p-6 space-y-6 max-h-[60vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400/30 to-pink-400/30 flex items-center justify-center border border-rose-300/30">
                  <User className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">Let us know who you are</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="Full Name"
                  icon={<User className="w-4 h-4" />}
                  required
                  error={errors.fullName}
                >
                  <Input
                    placeholder="Your full name"
                    value={formData.fullName || ""}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="form-input-premium"
                  />
                </FormField>

                <FormField
                  label="Discord Username"
                  icon={<Hash className="w-4 h-4" />}
                  required
                  error={errors.discordUsername}
                >
                  <Input
                    placeholder="username#1234"
                    value={formData.discordUsername || ""}
                    onChange={(e) => handleInputChange("discordUsername", e.target.value)}
                    className="form-input-premium"
                  />
                </FormField>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="Steam ID"
                  icon={<Gamepad2 className="w-4 h-4" />}
                  required
                  error={errors.steamId}
                >
                  <Input
                    placeholder="Your Steam ID"
                    value={formData.steamId || ""}
                    onChange={(e) => handleInputChange("steamId", e.target.value)}
                    className="form-input-premium"
                  />
                </FormField>

                <FormField
                  label="Contact Email"
                  icon={<Mail className="w-4 h-4" />}
                  required
                  error={errors.contactEmail}
                >
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.contactEmail || ""}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    className="form-input-premium"
                  />
                </FormField>
              </div>
            </motion.div>
          )}

          {/* Step 2: Channel Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400/30 to-rose-400/30 flex items-center justify-center border border-pink-300/30">
                  <Video className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Channel Details</h3>
                  <p className="text-sm text-muted-foreground">Your streaming platform info</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="Primary Platform"
                  icon={<Video className="w-4 h-4" />}
                  required
                  error={errors.platform}
                >
                  <Select 
                    value={formData.platform || ""} 
                    onValueChange={(value) => handleInputChange("platform", value)}
                  >
                    <SelectTrigger className="form-input-premium">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/98 backdrop-blur-xl border-red-400/30 rounded-xl">
                      <SelectItem value="youtube">
                        <span className="flex items-center gap-2"><Youtube className="w-4 h-4 text-red-500" /> YouTube</span>
                      </SelectItem>
                      <SelectItem value="twitch">
                        <span className="flex items-center gap-2"><Twitch className="w-4 h-4 text-purple-500" /> Twitch</span>
                      </SelectItem>
                      <SelectItem value="facebook">Facebook Gaming</SelectItem>
                      <SelectItem value="kick">Kick</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Channel URL"
                  icon={<Link2 className="w-4 h-4" />}
                  required
                  error={errors.channelUrl}
                >
                  <Input
                    placeholder="https://youtube.com/c/yourchannel"
                    value={formData.channelUrl || ""}
                    onChange={(e) => handleInputChange("channelUrl", e.target.value)}
                    className="form-input-premium"
                  />
                </FormField>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  label="Average Viewers"
                  icon={<Users className="w-4 h-4" />}
                  required
                  error={errors.averageViewers}
                >
                  <Select 
                    value={formData.averageViewers || ""} 
                    onValueChange={(value) => handleInputChange("averageViewers", value)}
                  >
                    <SelectTrigger className="form-input-premium">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/98 backdrop-blur-xl border-red-400/30 rounded-xl">
                      <SelectItem value="1-10">1-10 viewers</SelectItem>
                      <SelectItem value="10-50">10-50 viewers</SelectItem>
                      <SelectItem value="50-100">50-100 viewers</SelectItem>
                      <SelectItem value="100-500">100-500 viewers</SelectItem>
                      <SelectItem value="500+">500+ viewers</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Content Frequency"
                  icon={<Clock className="w-4 h-4" />}
                  required
                  error={errors.contentFrequency}
                >
                  <Select 
                    value={formData.contentFrequency || ""} 
                    onValueChange={(value) => handleInputChange("contentFrequency", value)}
                  >
                    <SelectTrigger className="form-input-premium">
                      <SelectValue placeholder="How often do you stream?" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/98 backdrop-blur-xl border-red-400/30 rounded-xl">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="4-6-week">4-6 times per week</SelectItem>
                      <SelectItem value="2-3-week">2-3 times per week</SelectItem>
                      <SelectItem value="weekly">Once a week</SelectItem>
                      <SelectItem value="occasional">Occasionally</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField
                label="Average CCV (Concurrent Viewers)"
                icon={<TrendingUp className="w-4 h-4" />}
                required
                error={errors.averageCcv}
              >
                <Input
                  placeholder="e.g., 50-100 viewers during livestreams"
                  value={formData.averageCcv || ""}
                  onChange={(e) => handleInputChange("averageCcv", e.target.value)}
                  className="form-input-premium"
                />
              </FormField>
            </motion.div>
          )}

          {/* Step 3: Experience */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-400/30 flex items-center justify-center border border-amber-300/30">
                  <Gamepad2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Experience & Style</h3>
                  <p className="text-sm text-muted-foreground">Tell us about your content</p>
                </div>
              </div>

              <FormField
                label="GTA RP Experience"
                icon={<Gamepad2 className="w-4 h-4" />}
                required
                error={errors.rpExperience}
              >
                <Textarea
                  placeholder="Describe your experience with GTA 5 RP servers..."
                  value={formData.rpExperience || ""}
                  onChange={(e) => handleInputChange("rpExperience", e.target.value)}
                  className="form-input-premium min-h-[100px] resize-none"
                />
              </FormField>

              <FormField
                label="Content Style"
                icon={<Palette className="w-4 h-4" />}
                required
                error={errors.contentStyle}
              >
                <Textarea
                  placeholder="Describe your content style. What type of RP scenarios do you enjoy?"
                  value={formData.contentStyle || ""}
                  onChange={(e) => handleInputChange("contentStyle", e.target.value)}
                  className="form-input-premium min-h-[100px] resize-none"
                />
              </FormField>

              <FormField
                label="Why Join SLRP?"
                icon={<Heart className="w-4 h-4" />}
                required
                error={errors.whyJoin}
              >
                <Textarea
                  placeholder="Tell us why you want to be part of Skylife RP..."
                  value={formData.whyJoin || ""}
                  onChange={(e) => handleInputChange("whyJoin", e.target.value)}
                  className="form-input-premium min-h-[120px] resize-none"
                />
              </FormField>

              <FormField
                label="Expected Benefits"
                icon={<Gift className="w-4 h-4" />}
                required
                error={errors.expectedBenefits}
              >
                <Textarea
                  placeholder="What benefits do you expect from being part of the Creator Program?"
                  value={formData.expectedBenefits || ""}
                  onChange={(e) => handleInputChange("expectedBenefits", e.target.value)}
                  className="form-input-premium min-h-[100px] resize-none"
                />
              </FormField>

              <FormField
                label="Your Value/Contribution"
                icon={<Sparkles className="w-4 h-4" />}
                required
                error={errors.valueContribution}
              >
                <Textarea
                  placeholder="What unique value or content will you bring to SLRP?"
                  value={formData.valueContribution || ""}
                  onChange={(e) => handleInputChange("valueContribution", e.target.value)}
                  className="form-input-premium min-h-[100px] resize-none"
                />
              </FormField>
            </motion.div>
          )}

          {/* Step 4: Additional Info */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center border border-emerald-400/30">
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Additional Information</h3>
                  <p className="text-sm text-muted-foreground">Final details & verification</p>
                </div>
              </div>

              <FormField
                label="Storyline Ideas (Optional)"
                icon={<Eye className="w-4 h-4" />}
                error={errors.storylineIdeas}
              >
                <Textarea
                  placeholder="Share any unique storyline ideas or content series you'd like to create..."
                  value={formData.storylineIdeas || ""}
                  onChange={(e) => handleInputChange("storylineIdeas", e.target.value)}
                  className="form-input-premium min-h-[100px] resize-none"
                />
              </FormField>

              <FormField
                label="Social Media Links (Optional)"
                icon={<Link2 className="w-4 h-4" />}
                error={errors.socialLinks}
              >
                <Textarea
                  placeholder="Twitter, Instagram, TikTok, etc. (one per line)"
                  value={formData.socialLinks || ""}
                  onChange={(e) => handleInputChange("socialLinks", e.target.value)}
                  className="form-input-premium min-h-[80px] resize-none"
                />
              </FormField>

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-foreground flex items-center gap-2 text-sm font-medium">
                  <Upload className="w-4 h-4 text-red-400" />
                  Channel Ownership Proof <span className="text-red-400">*</span>
                </Label>
                <div 
                  className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 ${
                    ownershipProofFile 
                      ? 'border-emerald-500/50 bg-emerald-500/5' 
                      : fileError 
                      ? 'border-destructive/50 bg-destructive/5'
                      : 'border-red-400/30 bg-red-500/5 hover:border-red-400/50 hover:bg-red-500/10'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="text-center">
                    {ownershipProofFile ? (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-emerald-400">{ownershipProofFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(ownershipProofFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            setOwnershipProofFile(null);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-red-400/60 mx-auto mb-3" />
                        <p className="text-sm text-foreground/80 font-medium">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Screenshot showing you own the channel (JPG, PNG, PDF - Max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {fileError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fileError}
                  </p>
                )}
              </div>

              {/* Policy Agreement */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                formData.complyWithPolicies 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : errors.complyWithPolicies
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-red-500/5 border-red-400/20'
              }`}>
                <div className="flex items-start gap-4">
                  <Checkbox
                    id="complyWithPolicies"
                    checked={formData.complyWithPolicies || false}
                    onCheckedChange={(checked) => handleInputChange("complyWithPolicies", checked as boolean)}
                    className="mt-1 border-red-400/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <div>
                    <Label htmlFor="complyWithPolicies" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      I agree to comply with all server policies
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      By checking this box, you confirm that you have read and agree to abide by all Creator Program rules and server guidelines.
                    </p>
                  </div>
                </div>
                {errors.complyWithPolicies && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2 ml-8">
                    <AlertCircle className="w-3 h-3" /> {errors.complyWithPolicies}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Footer Navigation */}
      <div className="relative border-t border-rose-300/15 p-6 bg-gradient-to-r from-rose-800/20 via-background to-rose-800/20">
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-rose-300/30 text-rose-200 hover:bg-rose-400/10 hover:border-rose-300/50 disabled:opacity-30 disabled:cursor-not-allowed px-6 rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Step {currentStep} of 4
          </div>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-lg shadow-rose-400/25 px-6 rounded-xl"
            >
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30 px-8 rounded-xl disabled:opacity-50"
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Form Field Component
interface FormFieldProps {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FormField = ({ label, icon, required, error, children }: FormFieldProps) => (
  <div className="space-y-2 group">
    <Label className="text-foreground/90 flex items-center gap-2 text-sm font-medium">
      {icon && <span className="text-red-400">{icon}</span>}
      {label} {required && <span className="text-red-400">*</span>}
    </Label>
    <div className="relative">
      {children}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        <X className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

export default CreatorApplicationForm;
