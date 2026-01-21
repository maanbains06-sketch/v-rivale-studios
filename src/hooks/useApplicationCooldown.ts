import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CooldownState {
  isOnCooldown: boolean;
  rejectedAt: string | null;
  loading: boolean;
  cooldownHours: number;
  canReapply: boolean;
}

type ApplicationTable = 
  | 'whitelist_applications' 
  | 'staff_applications' 
  | 'job_applications' 
  | 'ban_appeals'
  | 'creator_applications';

export const useApplicationCooldown = (
  table: ApplicationTable,
  cooldownHours: number = 24,
  additionalFilter?: { column: string; value: string }
) => {
  const [state, setState] = useState<CooldownState>({
    isOnCooldown: false,
    rejectedAt: null,
    loading: true,
    cooldownHours,
    canReapply: true,
  });

  const checkCooldown = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, loading: false, canReapply: true }));
        return;
      }

      // Build query based on table - use any to avoid deep type issues
      const baseQuery = supabase
        .from(table)
        .select('status, reviewed_at, updated_at, created_at')
        .eq('user_id', user.id)
        .eq('status', 'rejected')
        .order('updated_at', { ascending: false })
        .limit(1) as any;

      // Add additional filter if provided (e.g., job_type for job_applications)
      const query = additionalFilter 
        ? baseQuery.eq(additionalFilter.column, additionalFilter.value)
        : baseQuery;

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking cooldown:', error);
        setState(prev => ({ ...prev, loading: false, canReapply: true }));
        return;
      }

      if (!data) {
        setState(prev => ({ ...prev, loading: false, isOnCooldown: false, canReapply: true }));
        return;
      }

      // Use reviewed_at if available, otherwise use updated_at
      const rejectedDate = new Date(data.reviewed_at || data.updated_at);
      const cooldownEnd = new Date(rejectedDate.getTime() + cooldownHours * 60 * 60 * 1000);
      const now = new Date();

      if (now < cooldownEnd) {
        setState({
          isOnCooldown: true,
          rejectedAt: data.reviewed_at || data.updated_at,
          loading: false,
          cooldownHours,
          canReapply: false,
        });
      } else {
        setState({
          isOnCooldown: false,
          rejectedAt: null,
          loading: false,
          cooldownHours,
          canReapply: true,
        });
      }
    } catch (error) {
      console.error('Error checking application cooldown:', error);
      setState(prev => ({ ...prev, loading: false, canReapply: true }));
    }
  }, [table, cooldownHours, additionalFilter]);

  useEffect(() => {
    checkCooldown();
  }, [checkCooldown]);

  const handleCooldownEnd = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnCooldown: false,
      rejectedAt: null,
      canReapply: true,
    }));
  }, []);

  return {
    ...state,
    checkCooldown,
    handleCooldownEnd,
  };
};

export default useApplicationCooldown;
