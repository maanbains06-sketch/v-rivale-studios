import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceAccessReturn {
  hasAccess: boolean;
  isStaffOrOwner: boolean;
  loading: boolean;
  checkAccess: () => Promise<void>;
}

const OWNER_DISCORD_ID = '833680146510381097';

// Store access state in sessionStorage to persist across refreshes
const STORAGE_KEY = 'slrp_maintenance_access';

export const useMaintenanceAccess = (): MaintenanceAccessReturn => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isStaffOrOwner, setIsStaffOrOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const accessCheckedRef = useRef(false);

  // Clear cached access on logout
  const clearCachedAccess = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setHasAccess(false);
    setIsStaffOrOwner(false);
  }, []);

  const checkAccess = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('Maintenance access: No authenticated user');
        clearCachedAccess();
        setLoading(false);
        return;
      }

      // Get Discord ID from user metadata - check ALL possible locations
      const discordId = user.user_metadata?.discord_id || 
                        user.user_metadata?.provider_id || 
                        user.user_metadata?.sub ||
                        user.identities?.[0]?.identity_data?.provider_id ||
                        user.identities?.[0]?.identity_data?.sub ||
                        user.identities?.[0]?.id;
      
      console.log('Maintenance access check - Discord ID:', discordId, 'User ID:', user.id);
      
      // Check if owner by Discord ID
      if (discordId === OWNER_DISCORD_ID) {
        console.log('Maintenance access: Owner detected by Discord ID');
        setHasAccess(true);
        setIsStaffOrOwner(true);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ hasAccess: true, userId: user.id }));
        } catch {
          // Ignore storage errors
        }
        setLoading(false);
        return;
      }

      // Check if user has admin or moderator role in user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])
        .maybeSingle();

      if (!roleError && roleData) {
        console.log('Maintenance access: Admin/moderator role detected');
        setHasAccess(true);
        setIsStaffOrOwner(true);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ hasAccess: true, userId: user.id }));
        } catch {
          // Ignore storage errors
        }
        setLoading(false);
        return;
      }

      // Check if user is a staff member via discord_id
      if (discordId && /^\d{17,19}$/.test(discordId)) {
        const { data: staffData, error: staffError } = await supabase
          .from('staff_members')
          .select('id, is_active')
          .eq('discord_id', discordId)
          .eq('is_active', true)
          .maybeSingle();

        if (!staffError && staffData) {
          console.log('Maintenance access: Staff member detected by discord_id');
          setHasAccess(true);
          setIsStaffOrOwner(true);
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ hasAccess: true, userId: user.id }));
          } catch {
            // Ignore storage errors
          }
          setLoading(false);
          return;
        }
      }

      // Also check by user_id in staff_members
      const { data: staffByUserId, error: staffUserError } = await supabase
        .from('staff_members')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!staffUserError && staffByUserId) {
        console.log('Maintenance access: Staff member by user_id detected');
        setHasAccess(true);
        setIsStaffOrOwner(true);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ hasAccess: true, userId: user.id }));
        } catch {
          // Ignore storage errors
        }
        setLoading(false);
        return;
      }

      // No access - user is not staff/owner
      console.log('Maintenance access: No special access detected');
      clearCachedAccess();
    } catch (err) {
      console.error('Error checking maintenance access:', err);
      clearCachedAccess();
    } finally {
      accessCheckedRef.current = true;
      setLoading(false);
    }
  }, [clearCachedAccess]);

  useEffect(() => {
    // Always verify access on mount - don't trust cached values
    // This ensures maintenance mode works after refresh
    checkAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, 'Session:', !!session);
      
      if (event === 'SIGNED_OUT') {
        clearCachedAccess();
      } else {
        // Re-check access on any auth change
        checkAccess();
      }
    });

    // Also listen for visibility changes to re-check when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAccess();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAccess, clearCachedAccess]);

  return { hasAccess, isStaffOrOwner, loading, checkAccess };
};
