import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CooldownState {
  isOnCooldown: boolean;
  rejectedAt: string | null;
  loading: boolean;
  cooldownHours: number;
  canReapply: boolean;
  hasPendingApplication: boolean;
  pendingMessage: string | null;
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
    hasPendingApplication: false,
    pendingMessage: null,
  });

  const checkCooldown = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, loading: false, canReapply: true }));
        return;
      }

      // First check for pending applications
      let pendingQuery = supabase
        .from(table)
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'on_hold'])
        .limit(1) as any;

      if (additionalFilter) {
        pendingQuery = pendingQuery.eq(additionalFilter.column, additionalFilter.value);
      }

      const { data: pendingData, error: pendingError } = await pendingQuery.maybeSingle();

      if (pendingError) {
        console.error('Error checking pending applications:', pendingError);
      }

      if (pendingData) {
        // User has a pending application
        const jobType = additionalFilter?.value || table.replace('_applications', '').replace('_', ' ');
        setState({
          isOnCooldown: false,
          rejectedAt: null,
          loading: false,
          cooldownHours,
          canReapply: false,
          hasPendingApplication: true,
          pendingMessage: `You already have a pending ${jobType} application submitted on ${new Date(pendingData.created_at).toLocaleDateString()}. Please wait for a response before submitting another.`,
        });
        return;
      }

      // Check for rejected applications with cooldown
      let rejectedQuery = supabase
        .from(table)
        .select('status, reviewed_at, updated_at, created_at')
        .eq('user_id', user.id)
        .eq('status', 'rejected')
        .order('updated_at', { ascending: false })
        .limit(1) as any;

      if (additionalFilter) {
        rejectedQuery = rejectedQuery.eq(additionalFilter.column, additionalFilter.value);
      }

      const { data, error } = await rejectedQuery.maybeSingle();

      if (error) {
        console.error('Error checking cooldown:', error);
        setState(prev => ({ ...prev, loading: false, canReapply: true }));
        return;
      }

      if (!data) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          isOnCooldown: false, 
          canReapply: true,
          hasPendingApplication: false,
          pendingMessage: null,
        }));
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
          hasPendingApplication: false,
          pendingMessage: null,
        });
      } else {
        setState({
          isOnCooldown: false,
          rejectedAt: null,
          loading: false,
          cooldownHours,
          canReapply: true,
          hasPendingApplication: false,
          pendingMessage: null,
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
