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

        // Get Discord ID from user metadata (multiple possible keys)
        const discordId = user.user_metadata?.discord_id || 
                          user.user_metadata?.provider_id || 
                          user.user_metadata?.sub;

        // Check if owner (server-side, matches DB RLS)
        const { data: isOwnerResult, error: ownerError } = await supabase.rpc('is_owner', { _user_id: user.id });
        if (ownerError) {
          console.error('Error checking owner status:', ownerError);
        }

        if (isOwnerResult) {
          setAccess({
            hasAccess: true,
            canEdit: true,
            loading: false,
            isOwner: true,
            isStaff: false,
          });
          return;
        }

        // Check Discord roles for edit/view permission via edge function
        if (discordId && /^\d{17,19}$/.test(discordId)) {
          const { data, error } = await supabase.functions.invoke('verify-roster-access', {
            body: { discordId }
          });

          if (error) {
            console.error('Error checking roster access:', error);
            // Fall back to staff check
            if (isStaff || isAdmin) {
              setAccess({ 
                hasAccess: true, 
                canEdit: false,
                loading: false, 
                isOwner: false, 
                isStaff: true 
              });
              return;
            }
            setAccess({ hasAccess: false, canEdit: false, loading: false, isOwner: false, isStaff: false });
            return;
          }

          if (data) {
            // User has specific Discord roles for roster access
            setAccess({
              hasAccess: data.hasAccess || false,
              canEdit: data.canEdit || false, // Respect the canEdit from Discord roles
              loading: false,
              isOwner: data.isOwner || false,
              isStaff: isStaff || isAdmin || false,
            });
            return;
          }
        }

        // Staff members get view access but need Discord role for edit
        if (isStaff || isAdmin) {
          setAccess({ 
            hasAccess: true, 
            canEdit: false,
            loading: false, 
            isOwner: false, 
            isStaff: true 
          });
          return;
        }

        // No access
        setAccess({ hasAccess: false, canEdit: false, loading: false, isOwner: false, isStaff: false });
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
