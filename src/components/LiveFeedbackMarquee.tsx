import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, MessageCircle } from "lucide-react";

interface Feedback {
  id: string;
  player_name: string;
  player_role: string | null;
  rating: number;
  testimonial: string;
  avatar_url: string | null;
}

const LiveFeedbackMarquee = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();

    // Set up realtime subscription for new testimonials
    const channel = supabase
      .channel('testimonials_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'testimonials'
        },
        () => {
          fetchFeedbacks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setFeedbacks(data);
    }
    setIsLoading(false);
  };

  // Default feedbacks if none exist in database
  const defaultFeedbacks: Feedback[] = [
    {
      id: '1',
      player_name: 'RajeshGamer',
      player_role: 'Police Officer',
      rating: 5,
      testimonial: 'Best Indian RP server! The community is amazing and staff is super helpful.',
      avatar_url: null
    },
    {
      id: '2',
      player_name: 'MumbaiKing',
      player_role: 'Business Owner',
      rating: 5,
      testimonial: 'Incredible roleplay experience. Been playing for 6 months and loving every moment!',
      avatar_url: null
    },
    {
      id: '3',
      player_name: 'DesiGangster',
      player_role: 'Gang Leader',
      rating: 5,
      testimonial: 'The gang RP here is top notch. Great scripts and even better community.',
      avatar_url: null
    },
    {
      id: '4',
      player_name: 'DrPatel',
      player_role: 'EMS',
      rating: 5,
      testimonial: 'Professional server with amazing medical RP. Highly recommended!',
      avatar_url: null
    },
    {
      id: '5',
      player_name: 'SpeedRacer',
      player_role: 'Mechanic',
      rating: 5,
      testimonial: 'Custom vehicles and great economy system. This server has it all!',
      avatar_url: null
    },
  ];

  const displayFeedbacks = feedbacks.length > 0 ? feedbacks : defaultFeedbacks;
  
  // Duplicate for seamless loop
  const duplicatedFeedbacks = [...displayFeedbacks, ...displayFeedbacks];

  if (isLoading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <MessageCircle className="w-5 h-5 animate-pulse" />
          <span>Loading community feedback...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50"></div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live Community Feedback</span>
        </div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50"></div>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
        
        {/* Scrolling Content */}
        <motion.div
          className="flex gap-6"
          animate={{
            x: [0, -50 * displayFeedbacks.length + '%'],
          }}
          transition={{
            x: {
              duration: displayFeedbacks.length * 8,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {duplicatedFeedbacks.map((feedback, index) => (
            <FeedbackCard key={`${feedback.id}-${index}`} feedback={feedback} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const FeedbackCard = ({ feedback }: { feedback: Feedback }) => {
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex-shrink-0 w-[350px] group">
      <div className="relative h-full">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Card */}
        <div className="relative glass-effect rounded-2xl p-5 border border-border/30 hover:border-primary/40 transition-all duration-300 h-full">
          {/* Quote icon */}
          <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border border-primary/30">
                {feedback.avatar_url ? (
                  <img 
                    src={feedback.avatar_url} 
                    alt={feedback.player_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">{getInitials(feedback.player_name)}</span>
                )}
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card"></span>
            </div>
            
            {/* Name & Role */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground truncate">{feedback.player_name}</h4>
              {feedback.player_role && (
                <p className="text-xs text-primary/80 truncate">{feedback.player_role}</p>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Testimonial */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            "{feedback.testimonial}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveFeedbackMarquee;
