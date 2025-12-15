import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Trophy,
  TrendingUp,
  Heart,
  Play,
  ExternalLink,
  Crown,
  Mic2
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.08, 
      delayChildren: 0.1 
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const floatingAnimation = {
  y: [-5, 5, -5],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

const perks = [
  { icon: Zap, title: "Priority Queue", description: "Skip the line during peak hours", color: "from-yellow-500 to-orange-500" },
  { icon: Shield, title: "Creator Discord Role", description: "Exclusive badge and channels", color: "from-purple-500 to-violet-500" },
  { icon: Users, title: "Custom RP Storylines", description: "Staff support for your content", color: "from-blue-500 to-cyan-500" },
  { icon: Gift, title: "Sponsorship Opportunities", description: "Brand integration & partnerships", color: "from-pink-500 to-rose-500" },
  { icon: MessageSquare, title: "Social Promotion", description: "Featured on our platforms", color: "from-green-500 to-emerald-500" },
  { icon: Star, title: "Dedicated Support", description: "Direct staff assistance", color: "from-amber-500 to-yellow-500" },
  { icon: Eye, title: "Early Access", description: "Preview upcoming updates", color: "from-indigo-500 to-purple-500" },
  { icon: Radio, title: "Creator Events", description: "Exclusive projects & collabs", color: "from-red-500 to-pink-500" },
];

const stats = [
  { value: "50+", label: "Active Creators", icon: Users },
  { value: "1M+", label: "Combined Views", icon: Eye },
  { value: "100%", label: "Support Rate", icon: Heart },
  { value: "24/7", label: "Creator Support", icon: Mic2 },
];

const tiers = [
  {
    name: "Rising Star",
    icon: Star,
    color: "from-slate-400 to-slate-500",
    requirements: "0-50 avg viewers",
    perks: ["Creator Discord Role", "Priority Queue", "Social Shoutouts"]
  },
  {
    name: "Featured Creator",
    icon: Trophy,
    color: "from-amber-400 to-orange-500",
    requirements: "50-200 avg viewers",
    perks: ["All Rising Star perks", "Custom RP Support", "Featured on Homepage"]
  },
  {
    name: "Partner",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    requirements: "200+ avg viewers",
    perks: ["All Featured perks", "Revenue Share", "Exclusive Events", "Dedicated Manager"]
  }
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
      className="py-20 md:py-32 relative z-[10] overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={scrollRevealVariants}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/15 rounded-full blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-full blur-[150px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="glass-effect rounded-3xl p-8 md:p-14 relative overflow-hidden border-purple-500/30">
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 opacity-50 blur-xl pointer-events-none" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
          
          <div className="relative z-10">
            {/* Header with floating animation */}
            <div className="text-center mb-16">
              <motion.div 
                animate={floatingAnimation}
                className="inline-flex items-center gap-2 mb-6"
              >
                <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white border-0 px-6 py-2 text-sm font-bold shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  Creator Program
                  <Crown className="w-4 h-4 ml-2" />
                </Badge>
              </motion.div>
              
              <motion.h2 
                variants={itemVariants}
                className="text-4xl md:text-6xl lg:text-7xl font-black mb-6"
                style={{ transform: 'skewX(-2deg)' }}
              >
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  Become a SLRP
                </span>
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Creator
                </span>
              </motion.h2>
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Join our exclusive Creator Program and get recognized for your content. 
                We support streamers and content creators of <span className="text-purple-400 font-semibold">all sizes</span> — 
                <span className="text-pink-400 font-semibold"> effort matters more than numbers!</span>
              </motion.p>
            </div>

            {/* Stats Section */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 text-center backdrop-blur-sm">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                    <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Tabs for Perks, Tiers, and Requirements */}
            <Tabs defaultValue="perks" className="mb-12">
              <TabsList className="grid w-full grid-cols-3 bg-background/50 border border-purple-500/20 rounded-2xl p-1 mb-8">
                <TabsTrigger value="perks" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                  <Gift className="w-4 h-4 mr-2" />
                  Perks
                </TabsTrigger>
                <TabsTrigger value="tiers" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                  <Trophy className="w-4 h-4 mr-2" />
                  Tiers
                </TabsTrigger>
                <TabsTrigger value="requirements" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Requirements
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="perks" className="mt-0">
                  <motion.div 
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {perks.map((perk, index) => (
                      <motion.div
                        key={perk.title}
                        variants={itemVariants}
                        whileHover={{ scale: 1.03, y: -5 }}
                        className="group p-5 md:p-6 rounded-2xl bg-gradient-to-br from-background/80 to-background/40 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-500 relative overflow-hidden"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${perk.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${perk.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                          <perk.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 group-hover:text-purple-300 transition-colors">{perk.title}</h3>
                        <p className="text-sm text-muted-foreground">{perk.description}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </TabsContent>

                <TabsContent value="tiers" className="mt-0">
                  <motion.div 
                    className="grid md:grid-cols-3 gap-6"
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {tiers.map((tier, index) => (
                      <motion.div
                        key={tier.name}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="relative group"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition-opacity`} />
                        <div className="relative p-6 rounded-2xl bg-background/80 border border-purple-500/20 hover:border-purple-400/40 transition-all backdrop-blur-sm">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4 shadow-lg`}>
                            <tier.icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                          <p className="text-sm text-purple-400 mb-4">{tier.requirements}</p>
                          <ul className="space-y-2">
                            {tier.perks.map((perk, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                {perk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </TabsContent>

                <TabsContent value="requirements" className="mt-0">
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div 
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-6 rounded-2xl bg-background/60 border border-purple-500/20 backdrop-blur-sm"
                    >
                      <h3 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        What We Need From You
                      </h3>
                      <ul className="space-y-4">
                        {[
                          { text: "Create regular content (streams or videos)", icon: Video },
                          { text: "Follow RP rules and IC/OOC boundaries", icon: Shield },
                          { text: "Have a stable streaming/recording setup", icon: Mic2 },
                          { text: "Willingness to collaborate professionally", icon: Users }
                        ].map((req, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-start gap-4 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10"
                            whileHover={{ x: 5 }}
                          >
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                              <req.icon className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-muted-foreground pt-2">{req.text}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>

                    <motion.div 
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-6 rounded-2xl bg-background/60 border border-pink-500/20 backdrop-blur-sm"
                    >
                      <h3 className="text-xl font-bold text-pink-400 mb-6 flex items-center gap-2">
                        <Eye className="w-6 h-6" />
                        What We Evaluate
                      </h3>
                      <ul className="space-y-4">
                        {[
                          { text: "Content quality and production value", icon: Star },
                          { text: "Activity and consistency in streaming", icon: TrendingUp },
                          { text: "Viewership & community engagement", icon: Heart },
                          { text: "RP discipline and roleplay experience", icon: Sparkles }
                        ].map((item, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-start gap-4 p-3 rounded-xl bg-pink-500/5 border border-pink-500/10"
                            whileHover={{ x: 5 }}
                          >
                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                              <item.icon className="w-5 h-5 text-pink-400" />
                            </div>
                            <span className="text-muted-foreground pt-2">{item.text}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="text-center">
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block"
                  >
                    <Button
                      size="lg"
                      className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-bold px-12 py-8 rounded-2xl shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 text-lg group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <Video className="w-6 h-6 mr-3" />
                      Apply for Creator Program
                      <Sparkles className="w-5 h-5 ml-3 animate-pulse" />
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-purple-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                      <Video className="w-6 h-6 text-purple-400" />
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
                      <div className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${fileError ? 'border-destructive bg-destructive/5' : ownershipProofFile ? 'border-green-500 bg-green-500/5' : 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5'}`}>
                        {ownershipProofFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileCheck className="w-8 h-8 text-green-500" />
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
                            <Upload className="w-10 h-10 text-purple-400 mb-2" />
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
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 rounded-xl"
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
              className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>3-5 day review time</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20">
                <MessageSquare className="w-4 h-4 text-pink-400" />
                <span>Discord notification</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Shield className="w-4 h-4 text-orange-400" />
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
