import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStaffRole } from './useStaffRole';

interface RosterAccess {
  hasAccess: boolean;
  canEdit: boolean;
  loading: boolean;
  isOwner: boolean;
  isStaff: boolean;
}

// Owner Discord ID
const OWNER_DISCORD_ID = "833680146510381097";

export const useRosterAccess = () => {
  const [access, setAccess] = useState<RosterAccess>({
    hasAccess: false,
    canEdit: false,
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
          setAccess({ hasAccess: false, canEdit: false, loading: false, isOwner: false, isStaff: false });
          return;
        }

        const discordId = user.user_metadata?.discord_id;
        
        // Check if owner - full access including edit
        const isOwner = discordId === OWNER_DISCORD_ID;
        
        if (isOwner) {
          setAccess({ 
            hasAccess: true, 
            canEdit: true,
            loading: false, 
            isOwner: true, 
            isStaff: false 
          });
          return;
        }

        // Staff members get view access but NOT edit access
        if (isStaff || isAdmin) {
          // Still check Discord roles for edit permission
          if (discordId && /^\d{17,19}$/.test(discordId)) {
            const { data, error } = await supabase.functions.invoke('verify-roster-access', {
              body: { discordId }
            });

            if (!error && data) {
              setAccess({ 
                hasAccess: true, 
                canEdit: data?.canEdit || false, // Staff only gets edit if they have edit role
                loading: false,
                isOwner: false,
                isStaff: true
              });
              return;
            }
          }
          
          // Staff without edit roles - view only
          setAccess({ 
            hasAccess: true, 
            canEdit: false,
            loading: false, 
            isOwner: false, 
            isStaff: true 
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
            setAccess({ hasAccess: false, canEdit: false, loading: false, isOwner: false, isStaff: false });
            return;
          }

          setAccess({ 
            hasAccess: data?.hasAccess || false, 
            canEdit: data?.canEdit || false,
            loading: false,
            isOwner: false,
            isStaff: false
          });
        } else {
          setAccess({ hasAccess: false, canEdit: false, loading: false, isOwner: false, isStaff: false });
        }
      } catch (error) {
        console.error('Error checking roster access:', error);
        setAccess({ hasAccess: false, canEdit: false, loading: false, isOwner: false, isStaff: false });
      }
    };

    // Wait for staff role check to complete
    if (!staffLoading) {
      checkAccess();
    }
  }, [isStaff, isAdmin, staffLoading]);

  return access;
};
