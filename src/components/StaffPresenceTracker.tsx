import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes of inactivity = idle
const HEARTBEAT_INTERVAL_MS = 15000; // 15 seconds

/**
 * Tracks staff presence on the website with proper idle detection.
 * - Online: Active on website (mouse/keyboard/scroll activity)
 * - Idle: No activity for 2+ minutes but website still open
 * - Offline: Logged out or website closed
 */
export const StaffPresenceTracker = () => {
  const staffMemberIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<string>('offline');
  const sessionTokenRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

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
      console.log(`[Presence] Updated: ${status}`);
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

    // Try keepalive fetch first, fallback to sendBeacon
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

  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // If we were idle, update to online
    if (currentStatusRef.current === 'idle' && staffMemberIdRef.current) {
      updatePresence(true, 'online');
    }
  }, [updatePresence]);

  const checkIdleStatus = useCallback(() => {
    const staffId = staffMemberIdRef.current;
    if (!staffId) return;

    const timeSinceActivity = Date.now() - lastActivityRef.current;
    const isTabVisible = document.visibilityState === 'visible';
    
    let newStatus: string;
    if (!isTabVisible || timeSinceActivity > IDLE_TIMEOUT_MS) {
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

      // Activity listeners
      const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
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

      // Heartbeat to check idle status and keep presence alive
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

        // First, check if user is already linked as staff member by user_id
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
            console.log(`[Presence] Started tracking staff: ${staffMember.id}`);
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
            // If user_id is not set, link it now
            if (!staffByDiscordId.user_id) {
              await supabase
                .from('staff_members')
                .update({ user_id: session.user.id, updated_at: new Date().toISOString() })
                .eq('id', staffByDiscordId.id);
              console.log(`[Presence] Linked staff member ${staffByDiscordId.id} to user ${session.user.id}`);
            }

            if (staffMemberIdRef.current !== staffByDiscordId.id) {
              cleanup?.();
              cleanup = startTracking(staffByDiscordId.id);
              console.log(`[Presence] Started tracking staff (by discord_id): ${staffByDiscordId.id}`);
            }
            return;
          }
        }

        // Fallback: check by discord_username
        const discordUsername = userMetadata?.discord_username;
        if (discordUsername) {
          const { data: staffByUsername } = await supabase
            .from('staff_members')
            .select('id, discord_id, user_id')
            .ilike('discord_username', discordUsername)
            .eq('is_active', true)
            .single();

          if (staffByUsername?.id) {
            // If user_id is not set, link it now
            if (!staffByUsername.user_id) {
              await supabase
                .from('staff_members')
                .update({ user_id: session.user.id, updated_at: new Date().toISOString() })
                .eq('id', staffByUsername.id);
              console.log(`[Presence] Linked staff member ${staffByUsername.id} to user ${session.user.id} (by username)`);
            }

            if (staffMemberIdRef.current !== staffByUsername.id) {
              cleanup?.();
              cleanup = startTracking(staffByUsername.id);
              console.log(`[Presence] Started tracking staff (by username): ${staffByUsername.id}`);
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
