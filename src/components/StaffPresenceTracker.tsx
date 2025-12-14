import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks staff presence on the website.
 * Shows staff as online ONLY when they are logged in to the website.
 */
export const StaffPresenceTracker = () => {
  const [discordId, setDiscordId] = useState<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const isTrackingRef = useRef(false);

  const updatePresence = async (discordIdToUpdate: string, isOnline: boolean, status: string = 'online') => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discord_id: discordIdToUpdate,
            is_online: isOnline,
            status: isOnline ? status : 'offline',
          }),
        }
      );
      
      if (!response.ok) {
        console.error('Presence update failed:', await response.text());
      } else {
        console.log(`Presence updated: ${discordIdToUpdate} is ${isOnline ? status : 'offline'}`);
      }
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  };

  const startTracking = async (discordIdToTrack: string) => {
    if (isTrackingRef.current) return;
    isTrackingRef.current = true;

    console.log('Starting presence tracking for discord_id:', discordIdToTrack);
    
    // Set online immediately
    await updatePresence(discordIdToTrack, true, 'online');

    // Handle visibility change (tab focus/blur)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await updatePresence(discordIdToTrack, true, 'online');
      } else {
        await updatePresence(discordIdToTrack, true, 'idle');
      }
    };

    // Handle before unload (page close/navigate away)
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
        JSON.stringify({
          discord_id: discordIdToTrack,
          is_online: false,
          status: 'offline',
        })
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat every 30 seconds
    heartbeatRef.current = window.setInterval(async () => {
      await updatePresence(discordIdToTrack, true, document.visibilityState === 'visible' ? 'online' : 'idle');
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

  const stopTracking = async (discordIdToStop: string) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    isTrackingRef.current = false;
    await updatePresence(discordIdToStop, false, 'offline');
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let currentDiscordId: string | null = null;

    const checkStaffStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User logged out - set offline if we were tracking
        if (currentDiscordId) {
          await stopTracking(currentDiscordId);
          currentDiscordId = null;
          setDiscordId(null);
        }
        return;
      }

      // Check if user is a staff member by user_id
      const { data: staffByUserId } = await supabase
        .from('staff_members')
        .select('discord_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (staffByUserId?.discord_id) {
        if (currentDiscordId !== staffByUserId.discord_id) {
          // New staff login
          if (currentDiscordId) {
            await stopTracking(currentDiscordId);
          }
          currentDiscordId = staffByUserId.discord_id;
          setDiscordId(staffByUserId.discord_id);
          cleanup = await startTracking(staffByUserId.discord_id);
        }
        return;
      }

      // Fallback: Check by discord_username from user metadata
      const discordUsername = user.user_metadata?.discord_username;
      if (discordUsername) {
        const { data: staffByUsername } = await supabase
          .from('staff_members')
          .select('discord_id')
          .ilike('discord_username', discordUsername)
          .eq('is_active', true)
          .single();

        if (staffByUsername?.discord_id) {
          if (currentDiscordId !== staffByUsername.discord_id) {
            if (currentDiscordId) {
              await stopTracking(currentDiscordId);
            }
            currentDiscordId = staffByUsername.discord_id;
            setDiscordId(staffByUsername.discord_id);
            cleanup = await startTracking(staffByUsername.discord_id);
          }
          return;
        }
      }

      // User is logged in but not a staff member
      if (currentDiscordId) {
        await stopTracking(currentDiscordId);
        currentDiscordId = null;
        setDiscordId(null);
      }
    };

    // Initial check
    checkStaffStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT' && currentDiscordId) {
        // User signed out - set offline immediately
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
          JSON.stringify({
            discord_id: currentDiscordId,
            is_online: false,
            status: 'offline',
          })
        );
        currentDiscordId = null;
        setDiscordId(null);
      } else {
        checkStaffStatus();
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanup?.();
      if (currentDiscordId) {
        // Send offline on unmount
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-discord-presence`,
          JSON.stringify({
            discord_id: currentDiscordId,
            is_online: false,
            status: 'offline',
          })
        );
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default StaffPresenceTracker;
