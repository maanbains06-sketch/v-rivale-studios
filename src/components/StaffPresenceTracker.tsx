import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWebsitePresence } from '@/hooks/useWebsitePresence';

/**
 * This component tracks staff presence on the website.
 * It should be mounted when a staff member is logged in.
 * It will automatically update their online status in the database.
 */
export const StaffPresenceTracker = () => {
  const [staffMemberId, setStaffMemberId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffMemberId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Check if this user is a staff member
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (staffMember) {
        setStaffMemberId(staffMember.id);
      }
    };

    fetchStaffMemberId();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchStaffMemberId();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Use the presence hook
  useWebsitePresence({
    staffMemberId: staffMemberId || undefined,
    enabled: !!staffMemberId,
  });

  // This component doesn't render anything
  return null;
};

export default StaffPresenceTracker;
