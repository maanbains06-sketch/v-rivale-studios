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
  Twitch
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

const CreatorProgramSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<CreatorFormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof CreatorFormData, string>>>({});

  const handleInputChange = (field: keyof CreatorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = creatorSchema.parse(formData);

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
        user_id: user?.id || null,
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you on Discord within 3-5 days.",
      });

      setFormData({});
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
      className="py-16 md:py-24 relative z-[10]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={scrollRevealVariants}
    >
      <div className="container mx-auto px-4">
        <div className="glass-effect rounded-3xl p-8 md:p-14 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-4">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Creator Program
                </Badge>
              </motion.div>
              
              <motion.h2 
                variants={itemVariants}
                className="text-3xl md:text-5xl font-bold mb-4 italic"
                style={{ transform: 'skewX(-3deg)' }}
              >
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Become a SLRP Creator
                </span>
              </motion.h2>
              
              <motion.p variants={itemVariants} className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
                Join our exclusive Creator Program and get recognized for your content. 
                We support streamers and content creators of all sizes — effort matters more than numbers!
              </motion.p>
            </div>

            {/* Perks Grid */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {perks.map((perk, index) => (
                <motion.div
                  key={perk.title}
                  variants={itemVariants}
                  className="group p-4 md:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
                    <perk.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-purple-300 mb-1">{perk.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{perk.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Requirements & Evaluation */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <motion.div 
                variants={itemVariants}
                className="p-6 rounded-2xl bg-background/40 border border-purple-500/20"
              >
                <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {[
                    "Create regular content (streams or videos)",
                    "Follow RP rules and IC/OOC boundaries",
                    "Have a stable streaming/recording setup",
                    "Willingness to collaborate professionally"
                  ].map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm md:text-base text-muted-foreground">
                      <Star className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="p-6 rounded-2xl bg-background/40 border border-pink-500/20"
              >
                <h3 className="text-xl font-bold text-pink-400 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  What We Evaluate
                </h3>
                <ul className="space-y-3">
                  {[
                    "Content quality and production value",
                    "Activity and consistency in streaming",
                    "Viewership & community engagement",
                    "RP discipline and roleplay experience"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm md:text-base text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                      {item}
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
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-bold px-10 py-7 rounded-2xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-lg"
                  >
                    <Video className="w-6 h-6 mr-2" />
                    Apply for Creator Program
                  </Button>
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

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6 rounded-xl"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting...
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

            <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground mt-6">
              <Clock className="w-4 h-4 inline mr-1" />
              Applications are reviewed within 3-5 business days. We'll contact you via Discord.
            </motion.p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default CreatorProgramSection;
