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
  ArrowRight,
  FileText,
  Scale,
  AlertTriangle,
  Ban,
  DollarSign,
  Gavel,
  UserX,
  ShieldAlert,
  RefreshCw,
  BookOpen
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
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-red-500/8 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden bg-gradient-to-br from-red-950/40 via-red-900/20 to-background border border-red-500/15">
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-14">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-5">
                <Badge className="bg-red-500/15 text-red-300 border border-red-500/30 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                  <Video className="w-3.5 h-3.5 mr-2" />
                  Creator Program
                </Badge>
              </motion.div>
              
              <motion.h2 
                variants={itemVariants}
                className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5"
              >
                <span className="text-foreground">Become a </span>
                <span className="text-red-400">SLRP Creator</span>
              </motion.h2>
              
              <motion.p variants={itemVariants} className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
                Join our exclusive Creator Program and get recognized for your content. 
                We support creators of all sizes — effort matters more than numbers.
              </motion.p>
            </div>


            {/* Perks Grid */}
            <motion.div variants={itemVariants} className="mb-14">
              <h3 className="text-xl font-semibold text-center text-red-300 mb-6">Program Perks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {perks.map((perk, index) => (
                  <motion.div
                    key={perk.title}
                    variants={itemVariants}
                    className="group p-4 md:p-5 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/25 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center mb-3 group-hover:bg-red-500/25 transition-colors">
                      <perk.icon className="w-5 h-5 text-red-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{perk.title}</h4>
                    <p className="text-xs text-foreground/70 leading-relaxed">{perk.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Requirements & Evaluation */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-12">
              <motion.div 
                variants={itemVariants}
                className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10"
              >
                <h3 className="text-lg font-semibold text-red-300 mb-5 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <req.icon className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="pt-1.5">{req.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10"
              >
                <h3 className="text-lg font-semibold text-red-300 mb-5 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  What We Evaluate
                </h3>
                <ul className="space-y-3">
                  {evaluations.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="pt-1.5">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Rules Button */}
              <Dialog open={isRulesOpen} onOpenChange={setIsRulesOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 font-semibold px-6 py-6 rounded-xl transition-all duration-300 text-base group"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    View Creator Rules
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-background via-background to-red-950/20 backdrop-blur-2xl border border-red-400/25 shadow-2xl shadow-red-500/15">
                  <DialogHeader className="pb-4 border-b border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-red-300">Creator Program Agreement & Rules</DialogTitle>
                        <DialogDescription className="text-sm text-foreground/60">Read carefully before applying</DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <p className="text-sm text-foreground/80 mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      By joining the Skylife Roleplay India Creator Program, you agree to maintain professional, responsible, and rule-compliant behavior at all times — both in-city and on your content platforms.
                    </p>

                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-400">1</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">No Exploit / Staff Exposure</h4>
                          <p className="text-xs text-foreground/70">You agree not to show staff tools, dev menus, leaked content, backend systems, exploits, or unfinished features in any video or livestream.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-400">2</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">No Rule-Breaking for Content</h4>
                          <p className="text-xs text-foreground/70">You will not break, bend, bait, or manipulate RP rules for the sake of creating "funny moments," drama, or high-reach clips.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-400">3</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Respect IC / OOC Boundaries</h4>
                          <p className="text-xs text-foreground/70">You will maintain a clear separation between IC (In Character) storytelling and OOC (Out of Character) communication. Using OOC pressure to influence RP is strictly prohibited.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-400">4</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">No Harassment or Toxic Behavior</h4>
                          <p className="text-xs text-foreground/70">You agree to avoid harassment, verbal abuse, discrimination, or targeted toxicity toward players, staff, or other creators — both in content and community spaces.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-400">5</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">No Meta-Gaming or Power-Gaming</h4>
                          <p className="text-xs text-foreground/70">You agree not to use OOC information IC, and not to force unfair RP outcomes for content purposes.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-400">6</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Content Accuracy & Integrity</h4>
                          <p className="text-xs text-foreground/70">You will not intentionally misrepresent Skylife Roleplay India rules, staff decisions, or RP scenarios in a way that harms the server's reputation.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-red-400">7</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Respect Staff Decisions</h4>
                          <p className="text-xs text-foreground/70">You agree to follow staff instructions during scenes, reports, or investigations, and to cooperate professionally at all times.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-orange-400">8</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-orange-300 mb-1">Removal Clause</h4>
                          <p className="text-xs text-foreground/70">You understand that violating these rules or creating harmful situations may result in removal from the Skylife Roleplay India Creator Program, loss of perks, or server disciplinary action.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-red-500/20">
                    <Button 
                      onClick={() => setIsRulesOpen(false)}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-5 rounded-xl"
                    >
                      I Understand
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Terms & Conditions Button */}
              <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 font-semibold px-6 py-6 rounded-xl transition-all duration-300 text-base group"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Terms & Conditions
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-background via-background to-red-950/20 backdrop-blur-2xl border border-red-400/25 shadow-2xl shadow-red-500/15">
                  <DialogHeader className="pb-4 border-b border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                        <Scale className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold text-red-300">Creator Program Terms & Conditions</DialogTitle>
                        <DialogDescription className="text-sm text-foreground/60">Effective upon acceptance • Last updated December 2024</DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-4">
                    {/* Section 1: Eligibility */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">1. Eligibility</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">To be eligible for the Creator Program, you must:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Be at least 13 years of age (or the minimum age required by your platform)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Maintain an active account on an approved platform (e.g., Twitch, YouTube, TikTok)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Follow all SLRP Server Rules, Community Guidelines, and Platform TOS
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Be approved by server administration
                        </li>
                      </ul>
                      <p className="text-xs text-orange-400/80 mt-3 italic">Approval is not guaranteed and may be revoked at any time.</p>
                    </div>

                    {/* Section 2: Creator Responsibilities */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <Users className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">2. Creator Responsibilities</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Creators must:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Represent Skylife Roleplay India in a positive and respectful manner
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Follow all RP rules, lore, and server guidelines
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Avoid power-gaming, meta-gaming, exploiting, or abusing creator status
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Clearly disclose sponsored or promotional content when applicable
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Maintain respectful conduct toward players, staff, and viewers
                        </li>
                      </ul>
                      <p className="text-xs text-orange-400/80 mt-3 italic">Failure to meet these responsibilities may result in removal from the program.</p>
                    </div>

                    {/* Section 3: Content Guidelines */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <Ban className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">3. Content Guidelines</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Creator content must NOT include:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">✗</span>
                          Hate speech, harassment, or discrimination
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">✗</span>
                          Cheating, exploiting, or rule-breaking
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">✗</span>
                          Doxxing or sharing private player/staff information
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">✗</span>
                          Sexual content involving minors
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">✗</span>
                          Content that damages the reputation of the server
                        </li>
                      </ul>
                      <p className="text-xs text-foreground/60 mt-3">Constructive criticism is allowed, but public server drama, staff callouts, or misleading narratives are prohibited.</p>
                    </div>

                    {/* Section 4: Use of Server Content */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <Video className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">4. Use of Server Content</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">By participating in the program:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          You are granted permission to record, stream, and publish content from SLRP
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          The server retains the right to use creator content for promotion, social media, trailers, and server marketing
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Proper credit will be given whenever reasonably possible
                        </li>
                      </ul>
                    </div>

                    {/* Section 5: Creator Benefits */}
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <Gift className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h4 className="text-sm font-bold text-emerald-300">5. Creator Benefits</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Approved creators may receive:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          Priority whitelist access
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          Creator-only Discord channels
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          In-game cosmetic perks
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          Early access to updates or features
                        </li>
                      </ul>
                      <p className="text-xs text-foreground/60 mt-3 italic">All benefits are non-transferable and may be changed or removed at any time.</p>
                    </div>

                    {/* Section 6: Monetization */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">6. Monetization</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Creators may monetize their content under these conditions:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Monetization must comply with platform policies
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Content must not misrepresent the server
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Server assets may not be sold, redistributed, or claimed as original work
                        </li>
                      </ul>
                      <p className="text-xs text-foreground/60 mt-3 italic">The server does not guarantee income, growth, or sponsorship opportunities.</p>
                    </div>

                    {/* Section 7: Staff Authority */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <Gavel className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">7. Staff Authority</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Server staff reserves the right to:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Review creator content at any time
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Remove creators from the program without prior notice
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Revoke perks or whitelist access
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Enforce disciplinary actions for rule violations
                        </li>
                      </ul>
                      <p className="text-xs text-orange-400/80 mt-3 font-medium">Staff decisions are final.</p>
                    </div>

                    {/* Section 8: Termination */}
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <UserX className="w-4 h-4 text-orange-400" />
                        </div>
                        <h4 className="text-sm font-bold text-orange-300">8. Termination</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Creator status may be terminated if:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 mt-0.5">•</span>
                          Server rules or these terms are violated
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 mt-0.5">•</span>
                          The creator becomes inactive for an extended period
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 mt-0.5">•</span>
                          Behavior harms the community or server reputation
                        </li>
                      </ul>
                      <p className="text-xs text-orange-400/80 mt-3 italic">Termination may occur with or without warning.</p>
                    </div>

                    {/* Section 9: Liability Disclaimer */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">9. Liability Disclaimer</h4>
                      </div>
                      <p className="text-xs text-foreground/70 mb-3">Skylife Roleplay India is NOT responsible for:</p>
                      <ul className="space-y-2 text-xs text-foreground/70">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Platform bans or strikes
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Loss of income or viewership
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Technical issues affecting streams or recordings
                        </li>
                      </ul>
                      <p className="text-xs text-foreground/60 mt-3 font-medium">Participation is at your own risk.</p>
                    </div>

                    {/* Section 10: Changes to Terms */}
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-sm font-bold text-red-300">10. Changes to Terms</h4>
                      </div>
                      <p className="text-xs text-foreground/70">
                        These Terms & Conditions may be updated at any time. Continued participation in the Creator Program constitutes acceptance of any changes. We recommend reviewing these terms periodically.
                      </p>
                    </div>

                    {/* Section 11: Acceptance */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h4 className="text-sm font-bold text-emerald-300">11. Acceptance</h4>
                      </div>
                      <p className="text-xs text-foreground/70">
                        By joining the Skylife Roleplay India Creator Program, you acknowledge that you have read, understood, and agreed to these Terms & Conditions. Your application submission serves as your digital signature and acceptance of all terms outlined herein.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-red-500/20">
                    <Button 
                      onClick={() => setIsTermsOpen(false)}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-5 rounded-xl"
                    >
                      I Have Read & Understood
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-6 rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 text-base group"
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Apply for Creator Program
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-background via-background to-red-950/20 backdrop-blur-2xl border border-red-400/25 p-0 shadow-2xl shadow-red-500/15">
                  {/* Animated Background Effects */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
                    {/* Floating particles */}
                    <div className="absolute top-20 left-10 w-1 h-1 bg-red-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
                    <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-rose-400/50 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                    <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                  </div>

                  {/* Form Header with Glassmorphism */}
                  <div className="sticky top-0 z-20 bg-gradient-to-r from-red-900/70 via-rose-900/60 to-red-900/70 backdrop-blur-2xl px-6 py-6 border-b border-red-300/25">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-rose-500/5 to-red-500/5" />
                    <DialogHeader className="relative">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/30 to-rose-500/30 flex items-center justify-center border border-red-400/30 shadow-lg shadow-red-500/20"
                          animate={{ 
                            boxShadow: ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 40px rgba(239, 68, 68, 0.5)', '0 0 20px rgba(239, 68, 68, 0.3)']
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Video className="w-7 h-7 text-red-300" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
                        </motion.div>
                        <div>
                          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-200 via-rose-200 to-red-200 bg-clip-text text-transparent">
                            Creator Program Application
                          </DialogTitle>
                          <DialogDescription className="text-sm text-red-200/70 flex items-center gap-2 mt-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Complete all fields • Review takes 24-48 hours
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mt-5 px-2">
                      {[
                        { num: 1, label: 'Personal' },
                        { num: 2, label: 'Channel' },
                        { num: 3, label: 'Experience' },
                        { num: 4, label: 'Verify' }
                      ].map((step, i) => (
                        <div key={step.num} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <motion.div 
                              className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/40 to-rose-500/40 flex items-center justify-center text-xs font-bold text-red-200 border border-red-400/30 shadow-lg shadow-red-500/20"
                              whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)' }}
                            >
                              {step.num}
                            </motion.div>
                            <span className="text-[10px] text-red-300/70 mt-1.5 font-medium">{step.label}</span>
                          </div>
                          {i < 3 && (
                            <div className="w-8 md:w-16 h-px bg-gradient-to-r from-red-500/50 to-rose-500/50 mx-1 md:mx-2 mt-[-12px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="relative px-6 py-8 space-y-10">
                    {/* Section 1: Personal Info */}
                    <motion.div 
                      className="space-y-5 p-6 rounded-2xl bg-gradient-to-br from-red-500/8 via-background/50 to-rose-500/8 border border-red-400/20 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <motion.div 
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/30 to-rose-500/30 flex items-center justify-center text-sm font-bold text-red-200 border border-red-400/30 shadow-lg shadow-red-500/20"
                          whileHover={{ rotate: 5, scale: 1.05 }}
                        >
                          1
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold bg-gradient-to-r from-red-200 to-rose-200 bg-clip-text text-transparent">Personal Information</h3>
                          <p className="text-xs text-red-300/60">Your basic details</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                          <Label htmlFor="fullName" className="text-red-200/90 flex items-center gap-2 text-sm font-medium">
                            Full Name <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="fullName"
                              placeholder="Your real name"
                              value={formData.fullName || ""}
                              onChange={(e) => handleInputChange("fullName", e.target.value)}
                              className={`bg-white/5 dark:bg-white/5 border-red-300/30 focus:border-red-400/70 focus:ring-2 focus:ring-red-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-5 transition-all duration-300 hover:border-red-400/50 ${errors.fullName ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.fullName && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.fullName}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="discordUsername" className="text-red-200/90 flex items-center gap-2 text-sm font-medium">
                            Discord Username <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="discordUsername"
                              placeholder="username#0000 or username"
                              value={formData.discordUsername || ""}
                              onChange={(e) => handleInputChange("discordUsername", e.target.value)}
                              className={`bg-white/5 dark:bg-white/5 border-red-300/30 focus:border-red-400/70 focus:ring-2 focus:ring-red-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-5 transition-all duration-300 hover:border-red-400/50 ${errors.discordUsername ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.discordUsername && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.discordUsername}</p>}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                          <Label htmlFor="steamId" className="text-red-200/90 flex items-center gap-2 text-sm font-medium">
                            Steam ID <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="steamId"
                              placeholder="steam:xxxxxxxxx or STEAM_0:X:XXXXX"
                              value={formData.steamId || ""}
                              onChange={(e) => handleInputChange("steamId", e.target.value)}
                              className={`bg-white/5 dark:bg-white/5 border-red-300/30 focus:border-red-400/70 focus:ring-2 focus:ring-red-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-5 transition-all duration-300 hover:border-red-400/50 ${errors.steamId ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.steamId && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.steamId}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="contactEmail" className="text-red-200/90 flex items-center gap-2 text-sm font-medium">
                            Contact Email <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="contactEmail"
                              type="email"
                              placeholder="your@email.com"
                              value={formData.contactEmail || ""}
                              onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                              className={`bg-white/5 dark:bg-white/5 border-red-300/30 focus:border-red-400/70 focus:ring-2 focus:ring-red-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-5 transition-all duration-300 hover:border-red-400/50 ${errors.contactEmail ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/5 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.contactEmail && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.contactEmail}</p>}
                        </div>
                      </div>
                    </motion.div>

                    {/* Section 2: Channel Info */}
                    <motion.div 
                      className="space-y-5 p-6 rounded-2xl bg-gradient-to-br from-rose-500/8 via-background/50 to-red-500/8 border border-rose-400/20 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <motion.div 
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/30 to-red-500/30 flex items-center justify-center text-sm font-bold text-rose-200 border border-rose-400/30 shadow-lg shadow-rose-500/20"
                          whileHover={{ rotate: -5, scale: 1.05 }}
                        >
                          2
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold bg-gradient-to-r from-rose-200 to-red-200 bg-clip-text text-transparent">Channel Details</h3>
                          <p className="text-xs text-rose-300/60">Your streaming platform info</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                          <Label htmlFor="platform" className="text-rose-200/90 flex items-center gap-2 text-sm font-medium">
                            Primary Platform <span className="text-red-400">*</span>
                          </Label>
                          <Select 
                            value={formData.platform || ""} 
                            onValueChange={(value) => handleInputChange("platform", value)}
                          >
                            <SelectTrigger className={`bg-white/5 dark:bg-white/5 border-rose-300/30 focus:border-rose-400/70 rounded-xl py-5 transition-all duration-300 hover:border-rose-400/50 ${errors.platform ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/98 backdrop-blur-xl border-rose-400/30 rounded-xl">
                              <SelectItem value="youtube" className="focus:bg-rose-500/20">
                                <span className="flex items-center gap-2"><Youtube className="w-4 h-4 text-red-400" /> YouTube</span>
                              </SelectItem>
                              <SelectItem value="twitch" className="focus:bg-rose-500/20">
                                <span className="flex items-center gap-2"><Twitch className="w-4 h-4 text-purple-400" /> Twitch</span>
                              </SelectItem>
                              <SelectItem value="facebook" className="focus:bg-rose-500/20">Facebook Gaming</SelectItem>
                              <SelectItem value="kick" className="focus:bg-rose-500/20">Kick</SelectItem>
                              <SelectItem value="other" className="focus:bg-rose-500/20">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.platform && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.platform}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="channelUrl" className="text-rose-200/90 flex items-center gap-2 text-sm font-medium">
                            Channel URL <span className="text-red-400">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="channelUrl"
                              placeholder="https://youtube.com/c/yourchannel"
                              value={formData.channelUrl || ""}
                              onChange={(e) => handleInputChange("channelUrl", e.target.value)}
                              className={`bg-white/5 dark:bg-white/5 border-rose-300/30 focus:border-rose-400/70 focus:ring-2 focus:ring-rose-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-5 transition-all duration-300 hover:border-rose-400/50 ${errors.channelUrl ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.channelUrl && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.channelUrl}</p>}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                          <Label htmlFor="averageViewers" className="text-rose-200/90 flex items-center gap-2 text-sm font-medium">
                            Average Viewers <span className="text-red-400">*</span>
                          </Label>
                          <Select 
                            value={formData.averageViewers || ""} 
                            onValueChange={(value) => handleInputChange("averageViewers", value)}
                          >
                            <SelectTrigger className={`bg-white/5 dark:bg-white/5 border-rose-300/30 focus:border-rose-400/70 rounded-xl py-5 transition-all duration-300 hover:border-rose-400/50 ${errors.averageViewers ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/98 backdrop-blur-xl border-rose-400/30 rounded-xl">
                              <SelectItem value="1-10" className="focus:bg-rose-500/20">1-10 viewers</SelectItem>
                              <SelectItem value="10-50" className="focus:bg-rose-500/20">10-50 viewers</SelectItem>
                              <SelectItem value="50-100" className="focus:bg-rose-500/20">50-100 viewers</SelectItem>
                              <SelectItem value="100-500" className="focus:bg-rose-500/20">100-500 viewers</SelectItem>
                              <SelectItem value="500+" className="focus:bg-rose-500/20">500+ viewers</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.averageViewers && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.averageViewers}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="contentFrequency" className="text-rose-200/90 flex items-center gap-2 text-sm font-medium">
                            Content Frequency <span className="text-red-400">*</span>
                          </Label>
                          <Select 
                            value={formData.contentFrequency || ""} 
                            onValueChange={(value) => handleInputChange("contentFrequency", value)}
                          >
                            <SelectTrigger className={`bg-white/5 dark:bg-white/5 border-rose-300/30 focus:border-rose-400/70 rounded-xl py-5 transition-all duration-300 hover:border-rose-400/50 ${errors.contentFrequency ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="How often do you stream?" />
                            </SelectTrigger>
                            <SelectContent className="bg-background/98 backdrop-blur-xl border-rose-400/30 rounded-xl">
                              <SelectItem value="daily" className="focus:bg-rose-500/20">Daily</SelectItem>
                              <SelectItem value="4-6-week" className="focus:bg-rose-500/20">4-6 times per week</SelectItem>
                              <SelectItem value="2-3-week" className="focus:bg-rose-500/20">2-3 times per week</SelectItem>
                              <SelectItem value="weekly" className="focus:bg-rose-500/20">Once a week</SelectItem>
                              <SelectItem value="occasional" className="focus:bg-rose-500/20">Occasionally</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.contentFrequency && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.contentFrequency}</p>}
                        </div>
                      </div>
                      <div className="space-y-2 group">
                        <Label htmlFor="averageCcv" className="text-rose-200/90 flex items-center gap-2 text-sm font-medium">
                          Average CCV (Concurrent Viewers) <span className="text-red-400">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="averageCcv"
                            placeholder="e.g., 50-100 viewers during livestreams"
                            value={formData.averageCcv || ""}
                            onChange={(e) => handleInputChange("averageCcv", e.target.value)}
                            className={`bg-white/5 dark:bg-white/5 border-rose-300/30 focus:border-rose-400/70 focus:ring-2 focus:ring-rose-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl py-5 transition-all duration-300 hover:border-rose-400/50 ${errors.averageCcv ? "border-destructive" : ""}`}
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        {errors.averageCcv && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.averageCcv}</p>}
                      </div>
                    </motion.div>

                    {/* Section 3: Experience */}
                    <motion.div 
                      className="space-y-5 p-6 rounded-2xl bg-gradient-to-br from-orange-500/8 via-background/50 to-red-500/8 border border-orange-400/20 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <motion.div 
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center text-sm font-bold text-orange-200 border border-orange-400/30 shadow-lg shadow-orange-500/20"
                          whileHover={{ rotate: 5, scale: 1.05 }}
                        >
                          3
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold bg-gradient-to-r from-orange-200 to-red-200 bg-clip-text text-transparent">Experience & Style</h3>
                          <p className="text-xs text-orange-300/60">Tell us about your content</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div className="space-y-2 group">
                          <Label htmlFor="rpExperience" className="text-orange-200/90 flex items-center gap-2 text-sm font-medium">
                            GTA RP Experience <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="rpExperience"
                              placeholder="Describe your experience with GTA 5 RP servers. Which servers have you played on? How long have you been roleplaying?"
                              value={formData.rpExperience || ""}
                              onChange={(e) => handleInputChange("rpExperience", e.target.value)}
                              className={`min-h-[100px] bg-white/5 dark:bg-white/5 border-orange-300/30 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl resize-none transition-all duration-300 hover:border-orange-400/50 ${errors.rpExperience ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.rpExperience && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.rpExperience}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="contentStyle" className="text-orange-200/90 flex items-center gap-2 text-sm font-medium">
                            Content Style <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="contentStyle"
                              placeholder="Describe your content style. What type of RP scenarios do you enjoy? Are you more into serious RP, comedy, action, etc.?"
                              value={formData.contentStyle || ""}
                              onChange={(e) => handleInputChange("contentStyle", e.target.value)}
                              className={`min-h-[100px] bg-white/5 dark:bg-white/5 border-orange-300/30 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl resize-none transition-all duration-300 hover:border-orange-400/50 ${errors.contentStyle ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.contentStyle && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.contentStyle}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="whyJoin" className="text-orange-200/90 flex items-center gap-2 text-sm font-medium">
                            Why Join SLRP? <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="whyJoin"
                              placeholder="Tell us why you want to be part of Skylife RP and what you can bring to our community."
                              value={formData.whyJoin || ""}
                              onChange={(e) => handleInputChange("whyJoin", e.target.value)}
                              className={`min-h-[120px] bg-white/5 dark:bg-white/5 border-orange-300/30 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl resize-none transition-all duration-300 hover:border-orange-400/50 ${errors.whyJoin ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.whyJoin && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.whyJoin}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="expectedBenefits" className="text-orange-200/90 flex items-center gap-2 text-sm font-medium">
                            Expected Benefits from Creator Program <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="expectedBenefits"
                              placeholder="What benefits do you expect from being part of the Creator Program?"
                              value={formData.expectedBenefits || ""}
                              onChange={(e) => handleInputChange("expectedBenefits", e.target.value)}
                              className={`min-h-[100px] bg-white/5 dark:bg-white/5 border-orange-300/30 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl resize-none transition-all duration-300 hover:border-orange-400/50 ${errors.expectedBenefits ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.expectedBenefits && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.expectedBenefits}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="valueContribution" className="text-orange-200/90 flex items-center gap-2 text-sm font-medium">
                            Your Value/Contribution to the Server <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="valueContribution"
                              placeholder="What value or contribution will you bring to the server as a creator?"
                              value={formData.valueContribution || ""}
                              onChange={(e) => handleInputChange("valueContribution", e.target.value)}
                              className={`min-h-[100px] bg-white/5 dark:bg-white/5 border-orange-300/30 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl resize-none transition-all duration-300 hover:border-orange-400/50 ${errors.valueContribution ? "border-destructive" : ""}`}
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          {errors.valueContribution && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.valueContribution}</p>}
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="storylineIdeas" className="text-orange-200/90 text-sm font-medium">
                            Storyline Ideas <span className="text-orange-400/60">(Optional)</span>
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="storylineIdeas"
                              placeholder="Do you have any storyline ideas you want us to help you execute? Share your creative ideas here."
                              value={formData.storylineIdeas || ""}
                              onChange={(e) => handleInputChange("storylineIdeas", e.target.value)}
                              className="min-h-[100px] bg-white/5 dark:bg-white/5 border-orange-300/30 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl resize-none transition-all duration-300 hover:border-orange-400/50"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2 group">
                          <Label htmlFor="socialLinks" className="text-orange-200/90 text-sm font-medium">
                            Other Social Media <span className="text-orange-400/60">(Optional)</span>
                          </Label>
                          <div className="relative">
                            <Textarea
                              id="socialLinks"
                              placeholder="Instagram, Twitter, TikTok, etc. (one per line)"
                              value={formData.socialLinks || ""}
                              onChange={(e) => handleInputChange("socialLinks", e.target.value)}
                              className="min-h-[80px] bg-white/5 dark:bg-white/5 border-orange-300/30 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/25 text-foreground placeholder:text-muted-foreground/60 rounded-xl resize-none transition-all duration-300 hover:border-orange-400/50"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                        </div>
                        {/* Policy Compliance */}
                        <div className="space-y-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                          <Label className="text-orange-200/90 flex items-center gap-2 text-sm font-medium">
                            Policy Compliance <span className="text-rose-400">*</span>
                          </Label>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="complyWithPolicies"
                              checked={formData.complyWithPolicies || false}
                              onChange={(e) => handleInputChange("complyWithPolicies", e.target.checked)}
                              className="mt-1 w-5 h-5 rounded border-red-400/40 bg-white/5 text-red-500 focus:ring-red-500/50 focus:ring-2"
                            />
                            <label htmlFor="complyWithPolicies" className="text-sm text-foreground/80 cursor-pointer">
                              I agree to comply with all policies of Skylife Roleplay India Server as a Streamer/Creator. I understand that violation of policies may result in removal from the Creator Program.
                            </label>
                          </div>
                          {errors.complyWithPolicies && <p className="text-xs text-destructive flex items-center gap-1"><X className="w-3 h-3" />{errors.complyWithPolicies}</p>}
                        </div>
                      </div>
                    </motion.div>

                    {/* Section 4: Upload */}
                    <motion.div 
                      className="space-y-5 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/8 via-background/50 to-red-500/8 border border-emerald-400/20 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <motion.div 
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-red-500/30 flex items-center justify-center text-sm font-bold text-emerald-200 border border-emerald-400/30 shadow-lg shadow-emerald-500/20"
                          whileHover={{ rotate: -5, scale: 1.05 }}
                        >
                          4
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-200 to-red-200 bg-clip-text text-transparent">Verification</h3>
                          <p className="text-xs text-emerald-300/60">Prove channel ownership</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="ownershipProof" className="text-emerald-200/90 flex items-center gap-2 text-sm font-medium">
                          Channel Ownership Proof <span className="text-rose-400">*</span>
                        </Label>
                        <p className="text-xs text-emerald-300/60">
                          Upload a screenshot of your channel dashboard or analytics page (JPG, PNG, GIF, WebP, or PDF - Max 10MB)
                        </p>
                        <motion.div 
                          className={`relative border-2 border-dashed rounded-2xl p-10 transition-all duration-500 ${fileError ? 'border-destructive bg-destructive/5' : ownershipProofFile ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5' : 'border-emerald-500/30 hover:border-emerald-400/50 bg-gradient-to-br from-emerald-500/5 to-red-500/5 hover:from-emerald-500/10 hover:to-red-500/10'}`}
                          whileHover={{ scale: ownershipProofFile ? 1 : 1.01 }}
                        >
                          {ownershipProofFile ? (
                            <motion.div 
                              className="flex items-center justify-between"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <div className="flex items-center gap-4">
                                <motion.div 
                                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 flex items-center justify-center border border-emerald-400/30 shadow-lg shadow-emerald-500/20"
                                  animate={{ 
                                    boxShadow: ['0 0 15px rgba(16, 185, 129, 0.2)', '0 0 30px rgba(16, 185, 129, 0.4)', '0 0 15px rgba(16, 185, 129, 0.2)']
                                  }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <FileCheck className="w-7 h-7 text-emerald-300" />
                                </motion.div>
                                <div>
                                  <p className="font-semibold text-emerald-200">{ownershipProofFile.name}</p>
                                  <p className="text-xs text-emerald-300/70 flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {(ownershipProofFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setOwnershipProofFile(null)}
                                className="text-emerald-300/50 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </motion.div>
                          ) : (
                            <label htmlFor="ownershipProof" className="flex flex-col items-center cursor-pointer group">
                              <motion.div 
                                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-red-500/20 flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:border-emerald-400/40 transition-all shadow-lg shadow-emerald-500/10"
                                whileHover={{ rotate: 5, scale: 1.05 }}
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Upload className="w-9 h-9 text-emerald-400" />
                              </motion.div>
                              <span className="text-sm font-semibold text-emerald-200 mb-1 group-hover:text-emerald-100 transition-colors">Click to upload file</span>
                              <span className="text-xs text-emerald-300/50">or drag and drop here</span>
                            </label>
                          )}
                          <input
                            type="file"
                            id="ownershipProof"
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </motion.div>
                        {fileError && <p className="text-xs text-destructive mt-2 flex items-center gap-1"><X className="w-3 h-3" />{fileError}</p>}
                      </div>
                    </motion.div>

                    {/* Submit Section */}
                    <motion.div 
                      className="pt-6 space-y-5"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || isUploading}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:via-rose-500 hover:to-red-500 text-white font-bold py-7 rounded-2xl shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-500 text-base border border-red-400/20 group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                          {isSubmitting || isUploading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                              {isUploading ? "Uploading Proof..." : "Submitting Application..."}
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-3" />
                              Submit Application
                              <Sparkles className="w-4 h-4 ml-3 animate-pulse" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                      <p className="text-xs text-center text-red-300/50 flex items-center justify-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        By submitting, you agree to follow all server rules and maintain professional conduct.
                      </p>
                    </motion.div>
                  </form>
                </DialogContent>
              </Dialog>
            </motion.div>

            <motion.div 
              variants={itemVariants} 
              className="flex flex-col md:flex-row items-center justify-center gap-3 mt-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/15">
                <Clock className="w-4 h-4 text-red-400/70" />
                <span>24-48 hour review</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/15">
                <MessageSquare className="w-4 h-4 text-red-400/70" />
                <span>Discord notification</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/15">
                <Shield className="w-4 h-4 text-red-400/70" />
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
