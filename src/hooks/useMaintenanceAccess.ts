import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceAccessReturn {
  hasAccess: boolean;
  isStaffOrOwner: boolean;
  loading: boolean;
  checkAccess: () => Promise<void>;
}

const OWNER_DISCORD_ID = '833680146510381097';

// Store access state in localStorage to persist across browser sessions
const STORAGE_KEY = 'slrp_maintenance_access';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache

interface CachedAccess {
  hasAccess: boolean;
  userId: string;
  timestamp: number;
}

export const useMaintenanceAccess = (): MaintenanceAccessReturn => {
  // Initialize from cache IMMEDIATELY for instant access after login
  const getInitialAccess = (): { hasAccess: boolean; isStaffOrOwner: boolean } => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: CachedAccess = JSON.parse(cached);
        // If cache is valid, trust it immediately
        if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.hasAccess) {
          return { hasAccess: true, isStaffOrOwner: true };
        }
      }
    } catch {
      // Ignore
    }
    return { hasAccess: false, isStaffOrOwner: false };
  };

  const initialAccess = getInitialAccess();
  const [hasAccess, setHasAccess] = useState(initialAccess.hasAccess);
  const [isStaffOrOwner, setIsStaffOrOwner] = useState(initialAccess.isStaffOrOwner);
  const [loading, setLoading] = useState(!initialAccess.hasAccess); // If cached access, don't show loading
  const accessCheckedRef = useRef(initialAccess.hasAccess);
  const checkInProgressRef = useRef(false);

  // Check cached access
  const getCachedAccess = useCallback((): CachedAccess | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: CachedAccess = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }, []);

  // Clear cached access on logout
  const clearCachedAccess = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setHasAccess(false);
    setIsStaffOrOwner(false);
  }, []);

  const setCachedAccess = useCallback((access: boolean, userId: string) => {
    try {
      const cacheData: CachedAccess = { hasAccess: access, userId, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    } catch {
      // Ignore
    }
  }, []);

  const checkAccess = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (checkInProgressRef.current) return;
    checkInProgressRef.current = true;
    
    try {
      // FIRST: Check localStorage cache - this is set by MaintenancePage login
      // Trust it immediately without waiting for database
      const cached = getCachedAccess();
      if (cached && cached.hasAccess) {
        setHasAccess(true);
        setIsStaffOrOwner(true);
        setLoading(false);
        accessCheckedRef.current = true;
        checkInProgressRef.current = false;
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        clearCachedAccess();
        setLoading(false);
        checkInProgressRef.current = false;
        return;
      }

      // Check if we have valid cached access for this user
      if (cached && cached.userId === user.id && cached.hasAccess) {
        setHasAccess(true);
        setIsStaffOrOwner(true);
        setLoading(false);
        accessCheckedRef.current = true;
        checkInProgressRef.current = false;
        return;
      }

      // Get Discord ID from user metadata
      const discordId = user.user_metadata?.discord_id || 
                        user.user_metadata?.provider_id || 
                        user.user_metadata?.sub ||
                        user.identities?.[0]?.identity_data?.provider_id ||
                        user.identities?.[0]?.identity_data?.sub ||
                        user.identities?.[0]?.id;
      
      // Check if owner by Discord ID
      if (discordId === OWNER_DISCORD_ID) {
        setHasAccess(true);
        setIsStaffOrOwner(true);
        setCachedAccess(true, user.id);
        setLoading(false);
        checkInProgressRef.current = false;
        return;
      }

      // Parallel check for roles and staff membership
      const [roleResult, staffByDiscordResult, staffByUserResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'moderator'])
          .maybeSingle(),
        discordId && /^\d{17,19}$/.test(discordId)
          ? supabase
              .from('staff_members')
              .select('id, is_active')
              .eq('discord_id', discordId)
              .eq('is_active', true)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from('staff_members')
          .select('id, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()
      ]);

      const hasAdminRole = !roleResult.error && roleResult.data;
      const isStaffByDiscord = !staffByDiscordResult.error && staffByDiscordResult.data;
      const isStaffByUserId = !staffByUserResult.error && staffByUserResult.data;

      const accessGranted = hasAdminRole || isStaffByDiscord || isStaffByUserId;
      
      setHasAccess(accessGranted);
      setIsStaffOrOwner(accessGranted);
      setCachedAccess(accessGranted, user.id);
    } catch (err) {
      console.error('Error checking maintenance access:', err);
      clearCachedAccess();
    } finally {
      accessCheckedRef.current = true;
      setLoading(false);
      checkInProgressRef.current = false;
    }
  }, [clearCachedAccess, getCachedAccess, setCachedAccess]);

  useEffect(() => {
    // If we already have access from initial state, don't recheck
    if (hasAccess && isStaffOrOwner) {
      setLoading(false);
      return;
    }

    // Check cached access first for instant UI
    const cached = getCachedAccess();
    if (cached && cached.hasAccess) {
      setHasAccess(true);
      setIsStaffOrOwner(true);
      setLoading(false);
      accessCheckedRef.current = true;
    } else {
      checkAccess();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearCachedAccess();
      } else if (event === 'SIGNED_IN') {
        // Re-check cache first - MaintenancePage sets it before triggering this
        const freshCache = getCachedAccess();
        if (freshCache && freshCache.hasAccess) {
          setHasAccess(true);
          setIsStaffOrOwner(true);
          setLoading(false);
        } else {
          checkAccess();
        }
      }
    });

    // Listen for localStorage changes (for immediate sync after login)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const cached = getCachedAccess();
        if (cached && cached.hasAccess) {
          setHasAccess(true);
          setIsStaffOrOwner(true);
          setLoading(false);
        } else {
          setHasAccess(false);
          setIsStaffOrOwner(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAccess, clearCachedAccess, getCachedAccess, hasAccess, isStaffOrOwner]);

  return { hasAccess, isStaffOrOwner, loading, checkAccess };
};