import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface StaffPresenceProps {
  userId: string;
  lastSeen?: string | null;
  showLastSeen?: boolean;
}

interface PresenceState {
  [key: string]: Array<{
    user_id: string;
    online_at: string;
  }>;
}

const StaffPresence = ({ userId, lastSeen, showLastSeen = true }: StaffPresenceProps) => {
  const [isOnline, setIsOnline] = useState(false);
  const [presenceState, setPresenceState] = useState<PresenceState>({});

  useEffect(() => {
    const channel = supabase.channel('staff-presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string; online_at: string }>();
        setPresenceState(state);
        
        // Check if current user is online
        const online = Object.values(state).some((presences) =>
          presences.some((presence) => presence.user_id === userId)
        );
        setIsOnline(online);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const joined = newPresences.some((p: any) => p.user_id === userId);
        if (joined) setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const left = leftPresences.some((p: any) => p.user_id === userId);
        if (left) setIsOnline(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
          Online
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
          Offline
        </Badge>
      )}
      {!isOnline && showLastSeen && lastSeen && (
        <span className="text-xs text-muted-foreground">
          Last seen {formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}
        </span>
      )}
    </div>
  );
};

export default StaffPresence;
