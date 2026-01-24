import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  // Show empty animation cards if no real feedback exists
  const hasRealFeedback = feedbacks.length > 0;

  // Generate empty placeholder cards for animation when no feedback
  const emptyPlaceholders: Feedback[] = hasRealFeedback ? [] : [
    { id: 'empty-1', player_name: '', player_role: null, rating: 0, testimonial: '', avatar_url: null },
    { id: 'empty-2', player_name: '', player_role: null, rating: 0, testimonial: '', avatar_url: null },
    { id: 'empty-3', player_name: '', player_role: null, rating: 0, testimonial: '', avatar_url: null },
    { id: 'empty-4', player_name: '', player_role: null, rating: 0, testimonial: '', avatar_url: null },
    { id: 'empty-5', player_name: '', player_role: null, rating: 0, testimonial: '', avatar_url: null },
  ];

  const displayFeedbacks = hasRealFeedback ? feedbacks : emptyPlaceholders;
  
  // Duplicate for seamless loop
  const duplicatedFeedbacks = [...displayFeedbacks, ...displayFeedbacks];

  if (isLoading) {
    return (
      <div className="w-full py-4 md:py-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <MessageCircle className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Loading feedback...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 md:py-8 overflow-hidden content-visibility-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-primary/50" />
        <div className="flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[10px] md:text-xs font-semibold text-primary uppercase tracking-wider">Live Feedback</span>
        </div>
        <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-primary/50" />
      </div>

      {/* Marquee Container - GPU-accelerated CSS animation */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div 
          className="flex gap-4 md:gap-6 gpu-accelerated"
          style={{ 
            width: 'max-content',
            animation: `marquee ${Math.max(displayFeedbacks.length * 8, 30)}s linear infinite`,
          }}
        >
          {duplicatedFeedbacks.map((feedback, index) => (
            <FeedbackCard key={`${feedback.id}-${index}`} feedback={feedback} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .content-visibility-auto { content-visibility: auto; contain-intrinsic-size: 0 200px; }
      `}</style>
    </div>
  );
};

const FeedbackCard = ({ feedback }: { feedback: Feedback }) => {
  const getInitials = (name: string) => name ? name.slice(0, 2).toUpperCase() : '??';
  const isEmpty = !feedback.player_name;

  return (
    <div className="flex-shrink-0 w-[280px] md:w-[350px]">
      <div className={`glass-effect rounded-xl md:rounded-2xl p-4 md:p-5 border h-full relative overflow-hidden ${
        isEmpty ? 'border-border/20 bg-muted/20' : 'border-border/30'
      }`}>
        {isEmpty ? (
          // Empty placeholder card with animated skeleton
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted/40 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/40 rounded animate-pulse w-24" />
                <div className="h-3 bg-muted/30 rounded animate-pulse w-16" />
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded bg-muted/30 animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted/30 rounded animate-pulse w-full" />
              <div className="h-3 bg-muted/30 rounded animate-pulse w-4/5" />
              <div className="h-3 bg-muted/30 rounded animate-pulse w-3/5" />
            </div>
            <p className="text-xs text-muted-foreground/50 text-center italic">
              Be the first to share feedback!
            </p>
          </div>
        ) : (
          // Real feedback card
          <>
            <Quote className="absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 text-primary/20" />
            
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border border-primary/30">
                  {feedback.avatar_url ? (
                    <img src={feedback.avatar_url} alt={feedback.player_name} className="w-full h-full rounded-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-xs md:text-sm font-bold text-primary">{getInitials(feedback.player_name)}</span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground truncate text-sm md:text-base">{feedback.player_name}</h4>
                {feedback.player_role && <p className="text-[10px] md:text-xs text-primary/80 truncate">{feedback.player_role}</p>}
              </div>
              
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 md:w-3.5 md:h-3.5 ${i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
            </div>
            
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-3">"{feedback.testimonial}"</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveFeedbackMarquee;
