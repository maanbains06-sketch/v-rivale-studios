import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStaffRole } from './useStaffRole';

interface RosterAccess {
  hasAccess: boolean;
  loading: boolean;
  isOwner: boolean;
  isStaff: boolean;
}

// Owner Discord ID
const OWNER_DISCORD_ID = "833680146510381097";

export const useRosterAccess = () => {
  const [access, setAccess] = useState<RosterAccess>({
    hasAccess: false,
    loading: true,
    isOwner: false,
    isStaff: false,
  });
  const { isStaff, isAdmin, loading: staffLoading } = useStaffRole();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAccess({ hasAccess: false, loading: false, isOwner: false, isStaff: false });
          return;
        }

        const discordId = user.user_metadata?.discord_id;
        
        // Check if owner
        const isOwner = discordId === OWNER_DISCORD_ID;
        
        // If owner or staff member, grant immediate access
        if (isOwner || isStaff || isAdmin) {
          setAccess({ 
            hasAccess: true, 
            loading: false, 
            isOwner, 
            isStaff: isStaff || isAdmin 
          });
          return;
        }

        // Check Discord roles for non-staff users
        if (discordId && /^\d{17,19}$/.test(discordId)) {
          const { data, error } = await supabase.functions.invoke('verify-roster-access', {
            body: { discordId }
          });

          if (error) {
            console.error('Error checking roster access:', error);
            setAccess({ hasAccess: false, loading: false, isOwner: false, isStaff: false });
            return;
          }

          setAccess({ 
            hasAccess: data?.hasAccess || false, 
            loading: false,
            isOwner: false,
            isStaff: false
          });
        } else {
          setAccess({ hasAccess: false, loading: false, isOwner: false, isStaff: false });
        }
      } catch (error) {
        console.error('Error checking roster access:', error);
        setAccess({ hasAccess: false, loading: false, isOwner: false, isStaff: false });
      }
    };

    // Wait for staff role check to complete
    if (!staffLoading) {
      checkAccess();
    }
  }, [isStaff, isAdmin, staffLoading]);

  return access;
};
