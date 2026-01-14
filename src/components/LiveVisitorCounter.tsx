import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

const LiveVisitorCounter = memo(() => {
  const [visitorCount, setVisitorCount] = useState(1);

  useEffect(() => {
    const sessionId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const channel = supabase.channel('website_presence', {
      config: { presence: { key: sessionId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const count = Object.keys(channel.presenceState()).length;
        setVisitorCount(count > 0 ? count : 1);
      })
      .on('presence', { event: 'join' }, () => {
        setVisitorCount(Object.keys(channel.presenceState()).length);
      })
      .on('presence', { event: 'leave' }, () => {
        const count = Object.keys(channel.presenceState()).length;
        setVisitorCount(count > 0 ? count : 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed top-20 right-2 md:right-4 z-50 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse" />
        
        <div className="relative flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-full bg-card/90 border border-green-500/40 backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          
          <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
          
          <span className="text-xs md:text-sm font-bold text-green-500">{visitorCount}</span>
          
          <span className="text-xs text-muted-foreground font-medium">online</span>
        </div>
      </div>
    </div>
  );
});

LiveVisitorCounter.displayName = 'LiveVisitorCounter';

export default LiveVisitorCounter;
