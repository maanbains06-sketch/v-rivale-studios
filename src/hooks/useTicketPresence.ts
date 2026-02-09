import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceState {
  ticketId: string;
  userId: string;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  joinedAt: string;
}

interface ActiveViewer {
  userId: string;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
}

export const useTicketPresence = (ticketId: string | null) => {
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const joinTicket = useCallback(async () => {
    if (!ticketId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const discordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id || null;
    const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.custom_claims?.global_name || null;
    const discordAvatar = user.user_metadata?.avatar_url || null;

    // Leave previous channel if exists
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`ticket-presence:${ticketId}`, {
      config: {
        presence: { key: user.id },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const viewers: ActiveViewer[] = [];
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (presence.userId !== user.id) {
              viewers.push({
                userId: presence.userId,
                discordId: presence.discordId,
                discordUsername: presence.discordUsername,
                discordAvatar: presence.discordAvatar,
              });
            }
          });
        });
        
        setActiveViewers(viewers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            ticketId,
            userId: user.id,
            discordId,
            discordUsername,
            discordAvatar,
            joinedAt: new Date().toISOString(),
          });
          setIsTracking(true);
        }
      });

    channelRef.current = channel;
  }, [ticketId]);

  const leaveTicket = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsTracking(false);
      setActiveViewers([]);
    }
  }, []);

  useEffect(() => {
    if (ticketId) {
      joinTicket();
    }

    return () => {
      leaveTicket();
    };
  }, [ticketId, joinTicket, leaveTicket]);

  return { activeViewers, isTracking, leaveTicket };
};

// Hook for tracking all tickets being viewed (for list view)
export const useAllTicketPresence = () => {
  const [ticketViewers, setTicketViewers] = useState<Record<string, ActiveViewer[]>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel('all-tickets-presence', {
      config: {
        presence: { key: 'global' },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState & { ticketId: string }>();
        const viewers: Record<string, ActiveViewer[]> = {};
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (presence.ticketId) {
              if (!viewers[presence.ticketId]) {
                viewers[presence.ticketId] = [];
              }
              viewers[presence.ticketId].push({
                userId: presence.userId,
                discordId: presence.discordId,
                discordUsername: presence.discordUsername,
                discordAvatar: presence.discordAvatar,
              });
            }
          });
        });
        
        setTicketViewers(viewers);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return { ticketViewers };
};
