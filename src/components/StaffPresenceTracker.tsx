import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes of inactivity = idle
const HEARTBEAT_INTERVAL_MS = 90000; // 90 seconds (increased for less network overhead)

/**
 * Tracks staff presence on the website with proper idle detection.
 * Optimized to reduce event listener overhead.
 */
export const StaffPresenceTracker = () => {
  const staffMemberIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<string>('offline');
  const sessionTokenRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const activityThrottleRef = useRef<number>(0);

  const updatePresence = useCallback(async (isOnline: boolean, status: string) => {
    const staffId = staffMemberIdRef.current;
    if (!staffId) return;
    
    // Don't send duplicate updates
    if (currentStatusRef.current === status && isOnline) return;
    currentStatusRef.current = status;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionTokenRef.current) {
        headers['Authorization'] = `Bearer ${sessionTokenRef.current}`;
      }

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            staff_member_id: staffId,
            is_online: isOnline,
            status: status,
          }),
        }
      );
    } catch (err) {
      console.error('[Presence] Update failed:', err);
    }
  }, []);

  const sendOfflineBeacon = useCallback((staffId: string) => {
    const body = JSON.stringify({
      staff_member_id: staffId,
      is_online: false,
      status: 'offline',
    });

    try {
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionTokenRef.current ? { 'Authorization': `Bearer ${sessionTokenRef.current}` } : {}),
          },
          body,
          keepalive: true,
        }
      );
    } catch {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        body
      );
    }
  }, []);

  // Throttled activity handler - only process once per second
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    if (now - activityThrottleRef.current < 1000) return;
    activityThrottleRef.current = now;
    
    lastActivityRef.current = now;
    
    // If we were idle, update to online
    if (currentStatusRef.current === 'idle' && staffMemberIdRef.current) {
      updatePresence(true, 'online');
    }
  }, [updatePresence]);

  const checkIdleStatus = useCallback(() => {
    const staffId = staffMemberIdRef.current;
    if (!staffId) return;

    // Skip heartbeat when tab is hidden to reduce background CPU/network
    if (document.visibilityState !== 'visible') return;

    const timeSinceActivity = Date.now() - lastActivityRef.current;
    
    let newStatus: string;
    if (timeSinceActivity > IDLE_TIMEOUT_MS) {
      newStatus = 'idle';
    } else {
      newStatus = 'online';
    }

    updatePresence(true, newStatus);
  }, [updatePresence]);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let cleanup: (() => void) | undefined;

    const startTracking = (staffId: string) => {
      staffMemberIdRef.current = staffId;
      lastActivityRef.current = Date.now();
      
      // Set online immediately
      updatePresence(true, 'online');

      // Only listen to click and keydown - removed mousemove for performance
      const activityEvents = ['keydown', 'click', 'touchstart'];
      activityEvents.forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true });
      });

      // Visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          lastActivityRef.current = Date.now();
          updatePresence(true, 'online');
        } else {
          updatePresence(true, 'idle');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Before unload
      const handleBeforeUnload = () => {
        if (staffMemberIdRef.current) {
          sendOfflineBeacon(staffMemberIdRef.current);
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Heartbeat to check idle status
      heartbeatRef.current = window.setInterval(checkIdleStatus, HEARTBEAT_INTERVAL_MS);

      return () => {
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
      };
    };

    const stopTracking = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (staffMemberIdRef.current) {
        sendOfflineBeacon(staffMemberIdRef.current);
        staffMemberIdRef.current = null;
      }
      currentStatusRef.current = 'offline';
    };

    const checkAndStartTracking = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        sessionTokenRef.current = session?.access_token || null;
        
        if (!session?.user) {
          stopTracking();
          return;
        }

        const userMetadata = session.user.user_metadata;
        const discordId = userMetadata?.discord_id;

        // Check if user is already linked as staff member by user_id
        const { data: staffMember } = await supabase
          .from('staff_members')
          .select('id, discord_id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        if (staffMember?.id) {
          if (staffMemberIdRef.current !== staffMember.id) {
            cleanup?.();
            cleanup = startTracking(staffMember.id);
          }
          return;
        }

        // Try to find and link by discord_id from user metadata
        if (discordId && /^\d{17,19}$/.test(discordId)) {
          const { data: staffByDiscordId } = await supabase
            .from('staff_members')
            .select('id, discord_id, user_id')
            .eq('discord_id', discordId)
            .eq('is_active', true)
            .single();

          if (staffByDiscordId?.id) {
            if (!staffByDiscordId.user_id) {
              await supabase
                .from('staff_members')
                .update({ user_id: session.user.id, updated_at: new Date().toISOString() })
                .eq('id', staffByDiscordId.id);
            }

            if (staffMemberIdRef.current !== staffByDiscordId.id) {
              cleanup?.();
              cleanup = startTracking(staffByDiscordId.id);
            }
            return;
          }
        }

        // Not a staff member
        stopTracking();
      } catch (err) {
        console.error('[Presence] Error checking staff status:', err);
      }
    };

    // Initial check
    checkAndStartTracking();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      sessionTokenRef.current = session?.access_token || null;
      
      if (event === 'SIGNED_OUT') {
        stopTracking();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAndStartTracking();
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanup?.();
      stopTracking();
    };
  }, [updatePresence, handleUserActivity, checkIdleStatus, sendOfflineBeacon]);

  return null;
};

export default StaffPresenceTracker;
