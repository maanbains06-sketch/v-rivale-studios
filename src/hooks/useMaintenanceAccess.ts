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

      // Get Discord ID from user metadata - check ALL possible locations for mobile compatibility
      const discordId = user.user_metadata?.discord_id || 
                        user.user_metadata?.provider_id || 
                        user.user_metadata?.sub ||
                        user.identities?.[0]?.identity_data?.provider_id ||
                        user.identities?.[0]?.id;
      
      console.log('Maintenance access check - Discord ID:', discordId, 'User metadata:', user.user_metadata);
      
      // Check if owner
      if (discordId === OWNER_DISCORD_ID) {
        console.log('Maintenance access: Owner detected');
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
        console.log('Maintenance access: Admin/moderator role detected');
        setHasAccess(true);
        setIsStaffOrOwner(true);
        setLoading(false);
        return;
      }

      // Check if user is a staff member via discord_id
      if (discordId && /^\d{17,19}$/.test(discordId)) {
        const { data: staffData } = await supabase
          .from('staff_members')
          .select('id, is_active')
          .eq('discord_id', discordId)
          .eq('is_active', true)
          .maybeSingle();

        if (staffData) {
          console.log('Maintenance access: Staff member detected');
          setHasAccess(true);
          setIsStaffOrOwner(true);
          setLoading(false);
          return;
        }
      }

      // Also check by user_id in staff_members
      const { data: staffByUserId } = await supabase
        .from('staff_members')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffByUserId) {
        console.log('Maintenance access: Staff member by user_id detected');
        setHasAccess(true);
        setIsStaffOrOwner(true);
        setLoading(false);
        return;
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
