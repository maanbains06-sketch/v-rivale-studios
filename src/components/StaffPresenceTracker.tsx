import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWebsitePresence } from '@/hooks/useWebsitePresence';

/**
 * This component tracks staff presence on the website.
 * It monitors ALL active staff members and updates their presence when they visit the site.
 * Uses Discord IDs to track presence.
 */
export const StaffPresenceTracker = () => {
  const [discordId, setDiscordId] = useState<string | null>(null);

  useEffect(() => {
    const checkIfStaff = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in - check if we have a stored discord ID in localStorage
        const storedDiscordId = localStorage.getItem('staff_discord_id');
        if (storedDiscordId) {
          setDiscordId(storedDiscordId);
        }
        return;
      }

      // Check if this user is linked to a staff member
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('discord_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (staffMember?.discord_id) {
        setDiscordId(staffMember.discord_id);
        localStorage.setItem('staff_discord_id', staffMember.discord_id);
        return;
      }

      // Alternative: Check by email match in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('discord_username')
        .eq('id', user.id)
        .single();

      if (profile?.discord_username) {
        // Try to find staff by discord username
        const { data: staffByUsername } = await supabase
          .from('staff_members')
          .select('discord_id')
          .eq('discord_username', profile.discord_username)
          .eq('is_active', true)
          .single();

        if (staffByUsername?.discord_id) {
          setDiscordId(staffByUsername.discord_id);
          localStorage.setItem('staff_discord_id', staffByUsername.discord_id);
        }
      }
    };

    checkIfStaff();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkIfStaff();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Use the presence hook with discord_id
  useWebsitePresence({
    visitorId: discordId || undefined,
    enabled: !!discordId,
  });

  // This component doesn't render anything
  return null;
};

export default StaffPresenceTracker;
