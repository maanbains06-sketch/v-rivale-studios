import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceAccessReturn {
  hasAccess: boolean;
  isStaffOrOwner: boolean;
  loading: boolean;
  checkAccess: () => Promise<void>;
}

const OWNER_DISCORD_ID = '833680146510381097';

export const useMaintenanceAccess = (): MaintenanceAccessReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isStaffOrOwner, setIsStaffOrOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setHasAccess(false);
        setIsStaffOrOwner(false);
        setLoading(false);
        return;
      }

      // Get Discord ID from user metadata
      const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub;
      
      // Check if owner
      if (discordId === OWNER_DISCORD_ID) {
        setHasAccess(true);
        setIsStaffOrOwner(true);
        setLoading(false);
        return;
      }

      // Check if user has admin or moderator role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])
        .maybeSingle();

      if (roleData) {
        setHasAccess(true);
        setIsStaffOrOwner(true);
        setLoading(false);
        return;
      }

      // Check if user is a staff member via discord_id
      if (discordId) {
        const { data: staffData } = await supabase
          .from('staff_members')
          .select('id, is_active')
          .eq('discord_id', discordId)
          .eq('is_active', true)
          .maybeSingle();

        if (staffData) {
          setHasAccess(true);
          setIsStaffOrOwner(true);
          setLoading(false);
          return;
        }
      }

      setHasAccess(false);
      setIsStaffOrOwner(false);
    } catch (err) {
      console.error('Error checking maintenance access:', err);
      setHasAccess(false);
      setIsStaffOrOwner(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAccess]);

  return { hasAccess, isStaffOrOwner, loading, checkAccess };
};
