import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PresenceState {
  chatId: string;
  userId: string;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  isStaff: boolean;
  joinedAt: string;
}

interface ActiveViewer {
  userId: string;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  isStaff: boolean;
}

export const useChatPresence = (chatId: string | null, isStaff: boolean = false) => {
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const joinChat = useCallback(async () => {
    if (!chatId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const discordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id || null;
    const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.custom_claims?.global_name || null;
    const discordAvatar = user.user_metadata?.avatar_url || null;

    // Leave previous channel if exists
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`chat-presence:${chatId}`, {
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
            // Show all viewers except self
            if (presence.userId !== user.id) {
              viewers.push({
                userId: presence.userId,
                discordId: presence.discordId,
                discordUsername: presence.discordUsername,
                discordAvatar: presence.discordAvatar,
                isStaff: presence.isStaff,
              });
            }
          });
        });
        
        setActiveViewers(viewers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            chatId,
            userId: user.id,
            discordId,
            discordUsername,
            discordAvatar,
            isStaff,
            joinedAt: new Date().toISOString(),
          });
          setIsTracking(true);
        }
      });

    channelRef.current = channel;
  }, [chatId, isStaff]);

  const leaveChat = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack();
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsTracking(false);
      setActiveViewers([]);
    }
  }, []);

  useEffect(() => {
    if (chatId) {
      joinChat();
    }

    return () => {
      leaveChat();
    };
  }, [chatId, joinChat, leaveChat]);

  return { activeViewers, isTracking, leaveChat };
};

// Hook for tracking all chats being viewed (for list view)
export const useAllChatPresence = () => {
  const [chatViewers, setChatViewers] = useState<Record<string, ActiveViewer[]>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel('all-chats-presence', {
      config: {
        presence: { key: 'global' },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState & { chatId: string }>();
        const viewers: Record<string, ActiveViewer[]> = {};
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (presence.chatId && presence.isStaff) {
              if (!viewers[presence.chatId]) {
                viewers[presence.chatId] = [];
              }
              viewers[presence.chatId].push({
                userId: presence.userId,
                discordId: presence.discordId,
                discordUsername: presence.discordUsername,
                discordAvatar: presence.discordAvatar,
                isStaff: presence.isStaff,
              });
            }
          });
        });
        
        setChatViewers(viewers);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return { chatViewers };
};
