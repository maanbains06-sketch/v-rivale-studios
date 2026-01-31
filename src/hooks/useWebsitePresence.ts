import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWebsitePresenceOptions {
  visitorId?: string;
  enabled?: boolean;
}

export const useWebsitePresence = ({ visitorId, enabled = true }: UseWebsitePresenceOptions = {}) => {
  const isTrackingRef = useRef(false);
  const heartbeatRef = useRef<number | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  // Get current session token
  const getSessionToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }, []);

  const updatePresence = useCallback(async (isOnline: boolean, status: string = 'online') => {
    if (!visitorId) return;

    try {
      // Get fresh session token for authenticated requests
      const token = await getSessionToken();
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Add auth header if we have a token (required for online updates)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call edge function to update presence
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            discord_id: visitorId,
            is_online: isOnline,
            status: isOnline ? status : 'offline',
          }),
        }
      );
      
      if (!response.ok) {
        // Silently ignore auth errors for non-staff users
        const text = await response.text();
        if (response.status !== 401) {
          console.error('Presence update failed:', text);
        }
      }
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  }, [visitorId, getSessionToken]);

  const startTracking = useCallback(async () => {
    if (!visitorId || !enabled || isTrackingRef.current) return;

    isTrackingRef.current = true;
    console.log('Starting presence tracking for:', visitorId);
    
    // Set online immediately
    await updatePresence(true, 'online');

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await updatePresence(true, 'online');
      } else {
        await updatePresence(true, 'idle');
      }
    };

    // Handle before unload (page close)
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status on page close
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        JSON.stringify({
          discord_id: visitorId,
          is_online: false,
          status: 'offline',
        })
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat to keep presence alive every 60 seconds (reduced from 30s for less network overhead)
    heartbeatRef.current = window.setInterval(async () => {
      // Only send heartbeat if tab is visible to reduce background work
      if (document.visibilityState === 'visible') {
        await updatePresence(true, 'online');
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [visitorId, enabled, updatePresence]);

  const stopTracking = useCallback(async () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    isTrackingRef.current = false;
    await updatePresence(false, 'offline');
  }, [updatePresence]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      cleanup = await startTracking();
    };

    if (enabled && visitorId) {
      init();
    }

    return () => {
      cleanup?.();
      if (isTrackingRef.current) {
        // Send offline status on unmount
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
          JSON.stringify({
            discord_id: visitorId,
            is_online: false,
            status: 'offline',
          })
        );
      }
    };
  }, [visitorId, enabled, startTracking]);

  return {
    startTracking,
    stopTracking,
  };
};
