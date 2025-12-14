import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWebsitePresenceOptions {
  staffMemberId?: string;
  enabled?: boolean;
}

export const useWebsitePresence = ({ staffMemberId, enabled = true }: UseWebsitePresenceOptions = {}) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isTrackingRef = useRef(false);

  const updatePresenceInDB = useCallback(async (isOnline: boolean, status: string = 'online') => {
    if (!staffMemberId) return;

    try {
      // Get the discord_id for this staff member
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('discord_id')
        .eq('id', staffMemberId)
        .single();

      if (!staffMember?.discord_id) return;

      // Update or insert presence
      const { error } = await supabase
        .from('discord_presence')
        .upsert({
          discord_id: staffMember.discord_id,
          staff_member_id: staffMemberId,
          is_online: isOnline,
          status: isOnline ? status : 'offline',
          last_online_at: isOnline ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'discord_id'
        });

      if (error) {
        console.error('Error updating presence:', error);
      }
    } catch (err) {
      console.error('Error in updatePresenceInDB:', err);
    }
  }, [staffMemberId]);

  const startTracking = useCallback(async () => {
    if (!staffMemberId || !enabled || isTrackingRef.current) return;

    isTrackingRef.current = true;

    // Create presence channel
    const channel = supabase.channel(`staff_presence_${staffMemberId}`, {
      config: {
        presence: {
          key: staffMemberId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await channel.track({
            staff_id: staffMemberId,
            online_at: new Date().toISOString(),
          });
          
          // Update database
          await updatePresenceInDB(true, 'online');
        }
      });

    channelRef.current = channel;

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await updatePresenceInDB(true, 'online');
      } else {
        await updatePresenceInDB(true, 'idle');
      }
    };

    // Handle before unload (page close)
    const handleBeforeUnload = () => {
      // Sync call to update offline status
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        JSON.stringify({
          presenceUpdates: [{
            staff_member_id: staffMemberId,
            is_online: false,
            status: 'offline',
          }]
        })
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat to keep presence alive
    const heartbeatInterval = setInterval(async () => {
      await updatePresenceInDB(true, document.visibilityState === 'visible' ? 'online' : 'idle');
    }, 30000); // Every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
    };
  }, [staffMemberId, enabled, updatePresenceInDB]);

  const stopTracking = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    isTrackingRef.current = false;
    await updatePresenceInDB(false, 'offline');
  }, [updatePresenceInDB]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      cleanup = await startTracking();
    };

    if (enabled && staffMemberId) {
      init();
    }

    return () => {
      cleanup?.();
      stopTracking();
    };
  }, [staffMemberId, enabled, startTracking, stopTracking]);

  return {
    startTracking,
    stopTracking,
  };
};
