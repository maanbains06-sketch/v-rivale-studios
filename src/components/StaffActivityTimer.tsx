import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * Tracks staff active/idle/background time like a motion-sensor light.
 * Active: mouse/keyboard/scroll activity on the website
 * Idle: no activity for 5 minutes (timer stops)
 * Background: tab is not visible (timer stops active, counts background)
 */
export const StaffActivityTimer = () => {
  const staffMemberIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<'active' | 'idle' | 'background'>('active');
  const intervalRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const sendHeartbeat = useCallback(async () => {
    const staffId = staffMemberIdRef.current;
    if (!staffId) return;

    const now = Date.now();
    const elapsed = Math.round((now - lastHeartbeatRef.current) / 1000);
    lastHeartbeatRef.current = now;

    if (elapsed <= 0 || elapsed > 120) return; // Skip if too long (page was sleeping)

    // Determine current status
    const isTabVisible = document.visibilityState === 'visible';
    let status: 'active' | 'idle' | 'background';

    if (!isTabVisible) {
      status = 'background';
    } else if (now - lastActivityRef.current > IDLE_THRESHOLD) {
      status = 'idle';
    } else {
      status = 'active';
    }

    currentStatusRef.current = status;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-staff-activity`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            staff_member_id: staffId,
            status,
            elapsed_seconds: elapsed,
          }),
        }
      );
    } catch (err) {
      // Silently ignore
    }
  }, []);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Check if user is a staff member
        const discordId = session.user.user_metadata?.discord_id;
        
        let staffMember: any = null;

        // Try by user_id first
        const { data: byUserId } = await supabase
          .from('staff_members')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (byUserId) {
          staffMember = byUserId;
        } else if (discordId && /^\d{17,19}$/.test(discordId)) {
          const { data: byDiscord } = await supabase
            .from('staff_members')
            .select('id')
            .eq('discord_id', discordId)
            .eq('is_active', true)
            .maybeSingle();
          staffMember = byDiscord;
        }

        if (!staffMember?.id) return;

        staffMemberIdRef.current = staffMember.id;
        lastHeartbeatRef.current = Date.now();
        lastActivityRef.current = Date.now();

        // Listen for user activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        const throttledActivity = (() => {
          let lastCall = 0;
          return () => {
            const now = Date.now();
            if (now - lastCall > 2000) { // Throttle to every 2s
              lastCall = now;
              handleActivity();
            }
          };
        })();

        events.forEach(e => document.addEventListener(e, throttledActivity, { passive: true }));

        // Start heartbeat
        intervalRef.current = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        return () => {
          events.forEach(e => document.removeEventListener(e, throttledActivity));
          if (intervalRef.current) clearInterval(intervalRef.current);
        };
      } catch (err) {
        console.error('[ActivityTimer] Init error:', err);
      }
    };

    init();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sendHeartbeat, handleActivity]);

  return null;
};

export default StaffActivityTimer;
