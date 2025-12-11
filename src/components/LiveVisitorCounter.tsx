import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

const LiveVisitorCounter = () => {
  const [visitorCount, setVisitorCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Generate a unique session ID for this visitor
    const sessionId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase.channel('website_presence', {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setVisitorCount(count > 0 ? count : 1);
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        setVisitorCount(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setVisitorCount(count > 0 ? count : 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="fixed top-20 right-4 z-50"
    >
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse"></div>
        
        {/* Main container */}
        <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/80 border border-primary/40 backdrop-blur-md shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300 cursor-default">
          {/* Live indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          
          {/* Icon */}
          <Users className="w-4 h-4 text-primary" />
          
          {/* Count */}
          <motion.span
            key={visitorCount}
            initial={{ scale: 1.3, color: "hsl(185, 100%, 70%)" }}
            animate={{ scale: 1, color: "hsl(185, 100%, 70%)" }}
            transition={{ duration: 0.3 }}
            className="text-sm font-bold text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]"
          >
            {visitorCount}
          </motion.span>
          
          {/* Label */}
          <span className="text-xs text-muted-foreground font-medium">
            {visitorCount === 1 ? 'visitor' : 'visitors'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveVisitorCounter;
