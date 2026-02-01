import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreatorApplicationForm from "@/components/CreatorApplicationForm";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const CreatorApplication = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth", { state: { from: "/creator-application" } });
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/auth", { state: { from: "/creator-application" } });
        } else {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-950/20">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-red-500/8 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-foreground/70 hover:text-foreground hover:bg-red-500/10 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>

          <div className="text-center mb-8">
            <Badge className="bg-red-500/15 text-red-300 border border-red-500/30 px-4 py-1.5 text-sm font-medium backdrop-blur-sm mb-4">
              <Video className="w-3.5 h-3.5 mr-2" />
              Creator Program Application
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Apply for <span className="text-red-400">SLRP Creator Program</span>
            </h1>
            <p className="text-foreground/70 max-w-xl mx-auto">
              Fill out the form below to apply for our exclusive Creator Program. 
              We review all applications carefully.
            </p>
          </div>
        </motion.div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-red-400/25 bg-gradient-to-b from-background/95 via-background to-red-950/20 backdrop-blur-2xl shadow-2xl shadow-red-500/10 overflow-hidden">
            <CreatorApplicationForm onClose={() => navigate("/")} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatorApplication;
