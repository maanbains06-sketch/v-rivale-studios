import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks staff presence on the website.
 * Shows staff as online ONLY when they are logged in to the website.
 */
export const StaffPresenceTracker = () => {
  const [staffMemberId, setStaffMemberId] = useState<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const isTrackingRef = useRef(false);
  const sessionTokenRef = useRef<string | null>(null);

  const updatePresence = async (staffIdToUpdate: string, isOnline: boolean, status: string = 'online') => {
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      sessionTokenRef.current = session?.access_token || null;
      
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Send authorization header for authenticated staff updates
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            staff_member_id: staffIdToUpdate,
            is_online: isOnline,
            status: isOnline ? status : 'offline',
          }),
        }
      );
    } catch {
      // Silently ignore presence errors
    }
  };

  const startTracking = async (staffIdToTrack: string) => {
    if (isTrackingRef.current) return;
    isTrackingRef.current = true;
    
    // Set online immediately
    await updatePresence(staffIdToTrack, true, 'online');

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await updatePresence(staffIdToTrack, true, 'online');
      } else {
        await updatePresence(staffIdToTrack, true, 'idle');
      }
    };

    // Handle before unload (page close/navigate away)
    // Note: sendBeacon doesn't support custom headers, but the backend accepts
    // unauthenticated requests for staff_member_id offline updates from the same origin
    const handleBeforeUnload = () => {
      // Use keepalive fetch for better browser support with headers
      try {
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(sessionTokenRef.current ? { 'Authorization': `Bearer ${sessionTokenRef.current}` } : {}),
            },
            body: JSON.stringify({
              staff_member_id: staffIdToTrack,
              is_online: false,
              status: 'offline',
            }),
            keepalive: true, // Allows request to outlive the page
          }
        );
      } catch {
        // Fallback to sendBeacon if fetch fails
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
          JSON.stringify({
            staff_member_id: staffIdToTrack,
            is_online: false,
            status: 'offline',
          })
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat every 30 seconds
    heartbeatRef.current = window.setInterval(async () => {
      await updatePresence(staffIdToTrack, true, document.visibilityState === 'visible' ? 'online' : 'idle');
    }, 30000);

    // Store cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  };

  const stopTracking = async (staffIdToStop: string) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    isTrackingRef.current = false;
    await updatePresence(staffIdToStop, false, 'offline');
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let currentStaffId: string | null = null;

    const checkStaffStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User logged out - set offline if we were tracking
        if (currentStaffId) {
          await stopTracking(currentStaffId);
          currentStaffId = null;
          setStaffMemberId(null);
        }
        return;
      }

      // Check if user is a staff member by user_id
      const { data: staffByUserId } = await supabase
        .from('staff_members')
        .select('id, discord_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (staffByUserId?.id) {
        if (currentStaffId !== staffByUserId.id) {
          // New staff login
          if (currentStaffId) {
            await stopTracking(currentStaffId);
          }
          currentStaffId = staffByUserId.id;
          setStaffMemberId(staffByUserId.id);
          cleanup = await startTracking(staffByUserId.id);
        }
        return;
      }

      // Fallback: Check by discord_username from user metadata
      const discordUsername = user.user_metadata?.discord_username;
      if (discordUsername) {
        const { data: staffByUsername } = await supabase
          .from('staff_members')
          .select('id, discord_id')
          .ilike('discord_username', discordUsername)
          .eq('is_active', true)
          .single();

        if (staffByUsername?.id) {
          if (currentStaffId !== staffByUsername.id) {
            if (currentStaffId) {
              await stopTracking(currentStaffId);
            }
            currentStaffId = staffByUsername.id;
            setStaffMemberId(staffByUsername.id);
            cleanup = await startTracking(staffByUsername.id);
          }
          return;
        }
      }

      // User is logged in but not a staff member
      if (currentStaffId) {
        await stopTracking(currentStaffId);
        currentStaffId = null;
        setStaffMemberId(null);
      }
    };

    // Initial check
    checkStaffStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && currentStaffId) {
        // User signed out - set offline immediately using keepalive fetch
        try {
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(sessionTokenRef.current ? { 'Authorization': `Bearer ${sessionTokenRef.current}` } : {}),
              },
              body: JSON.stringify({
                staff_member_id: currentStaffId,
                is_online: false,
                status: 'offline',
              }),
              keepalive: true,
            }
          );
        } catch {
          // Ignore errors on sign out
        }
        currentStaffId = null;
        setStaffMemberId(null);
      } else {
        checkStaffStatus();
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanup?.();
      if (currentStaffId) {
        // Send offline on unmount using keepalive
        try {
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(sessionTokenRef.current ? { 'Authorization': `Bearer ${sessionTokenRef.current}` } : {}),
              },
              body: JSON.stringify({
                staff_member_id: currentStaffId,
                is_online: false,
                status: 'offline',
              }),
              keepalive: true,
            }
          );
        } catch {
          // Fallback to sendBeacon
          navigator.sendBeacon(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
            JSON.stringify({
              staff_member_id: currentStaffId,
              is_online: false,
              status: 'offline',
            })
          );
        }
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default StaffPresenceTracker;
