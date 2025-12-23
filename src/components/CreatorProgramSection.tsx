import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle2,
  TrendingUp,
  Heart,
  Mic2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CreatorApplicationForm from "./CreatorApplicationForm";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

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
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setCheckingAuth(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleApplyClick = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login with Discord to apply for the Creator Program.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setIsOpen(true);
  };
  return (
    <motion.section 
      className="py-20 md:py-28 relative z-[10] bg-background/80"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={scrollRevealVariants}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-red-500/8 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden bg-gradient-to-br from-red-950/40 via-red-900/20 to-background border border-red-500/15">
          
          <div className="relative z-10">
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

            <motion.div variants={itemVariants} className="mb-14">
              <h3 className="text-xl font-semibold text-center text-red-300 mb-6">Program Perks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {perks.map((perk) => (
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

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
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
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-gradient-to-b from-background via-background to-red-950/20 backdrop-blur-2xl border border-red-400/25 p-0 shadow-2xl shadow-red-500/15">
                    <CreatorApplicationForm onClose={() => setIsOpen(false)} />
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  size="lg"
                  onClick={handleApplyClick}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-6 rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 text-base group"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Login to Apply
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default CreatorProgramSection;
