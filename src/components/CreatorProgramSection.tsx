import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  Star, 
  Users, 
  Zap, 
  Gift, 
  Shield, 
  MessageSquare, 
  Eye, 
  Sparkles,
  Radio,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  Youtube,
  Twitch,
  Upload,
  FileCheck,
  X,
  TrendingUp,
  Heart,
  Mic2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

const creatorSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  discordUsername: z.string().min(2, "Discord username is required").max(50),
  steamId: z.string().min(5, "Steam ID is required").max(50),
  channelUrl: z.string().url("Please enter a valid URL"),
  platform: z.string().min(1, "Please select a platform"),
  averageViewers: z.string().min(1, "Please select average viewers"),
  contentFrequency: z.string().min(1, "Please select content frequency"),
  rpExperience: z.string().min(20, "Please describe your RP experience (min 20 characters)").max(1000),
  contentStyle: z.string().min(20, "Please describe your content style (min 20 characters)").max(1000),
  whyJoin: z.string().min(50, "Please explain why you want to join (min 50 characters)").max(1500),
  socialLinks: z.string().max(500).optional(),
});

type CreatorFormData = z.infer<typeof creatorSchema>;

const scrollRevealVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.06, 
      delayChildren: 0.1 
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const perks = [
  { icon: Zap, title: "Priority Queue", description: "Skip the line during peak hours" },
  { icon: Shield, title: "Creator Discord Role", description: "Exclusive badge and channels" },
  { icon: Users, title: "Custom RP Storylines", description: "Staff support for your content" },
  { icon: Gift, title: "Sponsorship Opportunities", description: "Brand integration & partnerships" },
  { icon: MessageSquare, title: "Social Promotion", description: "Featured on our platforms" },
  { icon: Star, title: "Dedicated Support", description: "Direct staff assistance" },
  { icon: Eye, title: "Early Access", description: "Preview upcoming updates" },
  { icon: Radio, title: "Creator Events", description: "Exclusive projects & collabs" },
];


const requirements = [
  { text: "Create regular content (streams or videos)", icon: Video },
  { text: "Follow RP rules and IC/OOC boundaries", icon: Shield },
  { text: "Have a stable streaming/recording setup", icon: Mic2 },
  { text: "Willingness to collaborate professionally", icon: Users }
];

const evaluations = [
  { text: "Content quality and production value", icon: Star },
  { text: "Activity and consistency in streaming", icon: TrendingUp },
  { text: "Viewership & community engagement", icon: Heart },
  { text: "RP discipline and roleplay experience", icon: Sparkles }
];

const CreatorProgramSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ownershipProofFile, setOwnershipProofFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<CreatorFormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof CreatorFormData, string>>>({});

  const handleInputChange = (field: keyof CreatorFormData, value: string) => {
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Please upload an image (JPG, PNG, GIF, WebP) or PDF file");
      setOwnershipProofFile(null);
      return;
    }

    // Validate file size (max 10MB)
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

      // Validate ownership proof is required
      if (!ownershipProofFile) {
        setFileError("Please upload ownership proof of your channel");
        setIsSubmitting(false);
        return;
      }

      // Upload ownership proof first
      const proofUrl = await uploadOwnershipProof();

      // Get current user if logged in (optional)
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("creator_applications").insert({
        full_name: validatedData.fullName,
        discord_username: validatedData.discordUsername,
        steam_id: validatedData.steamId,
        channel_url: validatedData.channelUrl,
        platform: validatedData.platform,
        average_viewers: validatedData.averageViewers,
        content_frequency: validatedData.contentFrequency,
        rp_experience: validatedData.rpExperience,
        content_style: validatedData.contentStyle,
        why_join: validatedData.whyJoin,
        social_links: validatedData.socialLinks || null,
        ownership_proof_url: proofUrl,
        user_id: user?.id || null,
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you on Discord within 3-5 days.",
      });

      setFormData({});
      setOwnershipProofFile(null);
      setIsOpen(false);
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
    <motion.section 
      className="py-20 md:py-28 relative z-[10]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={scrollRevealVariants}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-500/8 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden bg-gradient-to-br from-violet-950/40 via-violet-900/20 to-background border border-violet-500/15">
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-14">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-5">
                <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                  <Video className="w-3.5 h-3.5 mr-2" />
                  Creator Program
                </Badge>
              </motion.div>
              
              <motion.h2 
                variants={itemVariants}
                className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5"
              >
                <span className="text-foreground">Become a </span>
                <span className="text-violet-400">SLRP Creator</span>
              </motion.h2>
              
              <motion.p variants={itemVariants} className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Join our exclusive Creator Program and get recognized for your content. 
                We support creators of all sizes — effort matters more than numbers.
              </motion.p>
            </div>


            {/* Perks Grid */}
            <motion.div variants={itemVariants} className="mb-14">
              <h3 className="text-xl font-semibold text-center text-violet-300 mb-6">Program Perks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {perks.map((perk, index) => (
                  <motion.div
                    key={perk.title}
                    variants={itemVariants}
                    className="group p-4 md:p-5 rounded-xl bg-violet-500/5 border border-violet-500/10 hover:bg-violet-500/10 hover:border-violet-500/25 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3 group-hover:bg-violet-500/25 transition-colors">
                      <perk.icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{perk.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{perk.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Requirements & Evaluation */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-12">
              <motion.div 
                variants={itemVariants}
                className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10"
              >
                <h3 className="text-lg font-semibold text-violet-300 mb-5 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <req.icon className="w-4 h-4 text-violet-400/70" />
                      </div>
                      <span className="pt-1.5">{req.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10"
              >
                <h3 className="text-lg font-semibold text-violet-300 mb-5 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  What We Evaluate
                </h3>
                <ul className="space-y-3">
                  {evaluations.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-violet-400/70" />
                      </div>
                      <span className="pt-1.5">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="text-center">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-6 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 text-base group"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Apply for Creator Program
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/98 backdrop-blur-xl border-violet-500/20">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-violet-300 flex items-center gap-2">
                      <Video className="w-6 h-6 text-violet-400" />
                      Creator Program Application
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Fill out the form below to apply for the SLRP Creator Program. We review all applications within 3-5 days.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* Personal Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Your real name"
                          value={formData.fullName || ""}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          className={errors.fullName ? "border-destructive" : ""}
                        />
                        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discordUsername">Discord Username *</Label>
                        <Input
                          id="discordUsername"
                          placeholder="username#0000 or username"
                          value={formData.discordUsername || ""}
                          onChange={(e) => handleInputChange("discordUsername", e.target.value)}
                          className={errors.discordUsername ? "border-destructive" : ""}
                        />
                        {errors.discordUsername && <p className="text-xs text-destructive">{errors.discordUsername}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="steamId">Steam ID *</Label>
                        <Input
                          id="steamId"
                          placeholder="steam:xxxxxxxxx or STEAM_0:X:XXXXX"
                          value={formData.steamId || ""}
                          onChange={(e) => handleInputChange("steamId", e.target.value)}
                          className={errors.steamId ? "border-destructive" : ""}
                        />
                        {errors.steamId && <p className="text-xs text-destructive">{errors.steamId}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platform">Primary Platform *</Label>
                        <Select 
                          value={formData.platform || ""} 
                          onValueChange={(value) => handleInputChange("platform", value)}
                        >
                          <SelectTrigger className={errors.platform ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
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
                        {errors.platform && <p className="text-xs text-destructive">{errors.platform}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="channelUrl">Channel/Stream URL *</Label>
                      <Input
                        id="channelUrl"
                        placeholder="https://youtube.com/c/yourchannel or https://twitch.tv/yourusername"
                        value={formData.channelUrl || ""}
                        onChange={(e) => handleInputChange("channelUrl", e.target.value)}
                        className={errors.channelUrl ? "border-destructive" : ""}
                      />
                      {errors.channelUrl && <p className="text-xs text-destructive">{errors.channelUrl}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="averageViewers">Average Viewers *</Label>
                        <Select 
                          value={formData.averageViewers || ""} 
                          onValueChange={(value) => handleInputChange("averageViewers", value)}
                        >
                          <SelectTrigger className={errors.averageViewers ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 viewers</SelectItem>
                            <SelectItem value="10-50">10-50 viewers</SelectItem>
                            <SelectItem value="50-100">50-100 viewers</SelectItem>
                            <SelectItem value="100-500">100-500 viewers</SelectItem>
                            <SelectItem value="500+">500+ viewers</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.averageViewers && <p className="text-xs text-destructive">{errors.averageViewers}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contentFrequency">Content Frequency *</Label>
                        <Select 
                          value={formData.contentFrequency || ""} 
                          onValueChange={(value) => handleInputChange("contentFrequency", value)}
                        >
                          <SelectTrigger className={errors.contentFrequency ? "border-destructive" : ""}>
                            <SelectValue placeholder="How often do you stream?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="4-6-week">4-6 times per week</SelectItem>
                            <SelectItem value="2-3-week">2-3 times per week</SelectItem>
                            <SelectItem value="weekly">Once a week</SelectItem>
                            <SelectItem value="occasional">Occasionally</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.contentFrequency && <p className="text-xs text-destructive">{errors.contentFrequency}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rpExperience">GTA RP Experience *</Label>
                      <Textarea
                        id="rpExperience"
                        placeholder="Describe your experience with GTA 5 RP servers. Which servers have you played on? How long have you been roleplaying?"
                        value={formData.rpExperience || ""}
                        onChange={(e) => handleInputChange("rpExperience", e.target.value)}
                        className={`min-h-[100px] ${errors.rpExperience ? "border-destructive" : ""}`}
                      />
                      {errors.rpExperience && <p className="text-xs text-destructive">{errors.rpExperience}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contentStyle">Content Style *</Label>
                      <Textarea
                        id="contentStyle"
                        placeholder="Describe your content style. What type of RP scenarios do you enjoy? Are you more into serious RP, comedy, action, etc.?"
                        value={formData.contentStyle || ""}
                        onChange={(e) => handleInputChange("contentStyle", e.target.value)}
                        className={`min-h-[100px] ${errors.contentStyle ? "border-destructive" : ""}`}
                      />
                      {errors.contentStyle && <p className="text-xs text-destructive">{errors.contentStyle}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whyJoin">Why do you want to join SLRP Creator Program? *</Label>
                      <Textarea
                        id="whyJoin"
                        placeholder="Tell us why you want to be part of Skylife RP and what you can bring to our community. What makes you a good fit for our creator program?"
                        value={formData.whyJoin || ""}
                        onChange={(e) => handleInputChange("whyJoin", e.target.value)}
                        className={`min-h-[120px] ${errors.whyJoin ? "border-destructive" : ""}`}
                      />
                      {errors.whyJoin && <p className="text-xs text-destructive">{errors.whyJoin}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="socialLinks">Other Social Media Links (Optional)</Label>
                      <Textarea
                        id="socialLinks"
                        placeholder="Instagram, Twitter, TikTok, etc. (one per line)"
                        value={formData.socialLinks || ""}
                        onChange={(e) => handleInputChange("socialLinks", e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Ownership Proof Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="ownershipProof">Upload Channel Ownership Proof *</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Upload a screenshot of your channel dashboard, analytics page, or any proof that shows you own the channel (JPG, PNG, GIF, WebP, or PDF - Max 10MB)
                      </p>
                      <div className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${fileError ? 'border-destructive bg-destructive/5' : ownershipProofFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-violet-500/30 hover:border-violet-500/50 bg-violet-500/5'}`}>
                        {ownershipProofFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileCheck className="w-8 h-8 text-emerald-500" />
                              <div>
                                <p className="font-medium text-foreground">{ownershipProofFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(ownershipProofFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setOwnershipProofFile(null)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="ownershipProof" className="flex flex-col items-center cursor-pointer">
                            <Upload className="w-10 h-10 text-violet-400 mb-2" />
                            <span className="text-sm font-medium text-foreground">Click to upload</span>
                            <span className="text-xs text-muted-foreground">or drag and drop</span>
                          </label>
                        )}
                        <input
                          type="file"
                          id="ownershipProof"
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      {fileError && <p className="text-xs text-destructive">{fileError}</p>}
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || isUploading}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-6 rounded-xl"
                      >
                        {isSubmitting || isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {isUploading ? "Uploading Proof..." : "Submitting..."}
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      By submitting, you agree to follow all server rules and maintain professional conduct.
                    </p>
                  </form>
                </DialogContent>
              </Dialog>
            </motion.div>

            <motion.div 
              variants={itemVariants} 
              className="flex flex-col md:flex-row items-center justify-center gap-3 mt-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/15">
                <Clock className="w-4 h-4 text-violet-400/70" />
                <span>3-5 day review</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/15">
                <MessageSquare className="w-4 h-4 text-violet-400/70" />
                <span>Discord notification</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/15">
                <Shield className="w-4 h-4 text-violet-400/70" />
                <span>100% confidential</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default CreatorProgramSection;
