import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DepartmentKey = 'pd' | 'ems' | 'firefighter' | 'doj' | 'state' | 'mechanic' | 'pdm' | 'weazel';

interface JobPanelAccessState {
  hasAccess: boolean;
  isOwner: boolean;
  accessibleDepartments: DepartmentKey[];
  loading: boolean;
  error: string | null;
}

export const useJobPanelAccess = () => {
  const [state, setState] = useState<JobPanelAccessState>({
    hasAccess: false,
    isOwner: false,
    accessibleDepartments: [],
    loading: true,
    error: null,
  });

  const checkAccess = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState({
          hasAccess: false,
          isOwner: false,
          accessibleDepartments: [],
          loading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-job-panel-access', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking job panel access:', error);
        setState({
          hasAccess: false,
          isOwner: false,
          accessibleDepartments: [],
          loading: false,
          error: 'Failed to verify access',
        });
        return;
      }

      setState({
        hasAccess: data.hasAccess || false,
        isOwner: data.isOwner || false,
        accessibleDepartments: data.accessibleDepartments || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error in useJobPanelAccess:', err);
      setState({
        hasAccess: false,
        isOwner: false,
        accessibleDepartments: [],
        loading: false,
        error: 'An error occurred',
      });
    }
  }, []);

  useEffect(() => {
    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAccess]);

  return { ...state, refetch: checkAccess };
};

// Department display names and metadata
export const DEPARTMENT_INFO: Record<DepartmentKey, { name: string; table: string; color: string; icon: string }> = {
  pd: { name: 'Police Department', table: 'job_applications', color: 'blue', icon: '🚔' },
  ems: { name: 'Emergency Medical Services', table: 'job_applications', color: 'red', icon: '🚑' },
  firefighter: { name: 'Fire Department', table: 'firefighter_applications', color: 'orange', icon: '🚒' },
  doj: { name: 'Department of Justice', table: 'job_applications', color: 'purple', icon: '⚖️' },
  state: { name: 'State Department', table: 'job_applications', color: 'green', icon: '🏛️' },
  mechanic: { name: 'Mechanic Shop', table: 'job_applications', color: 'gray', icon: '🔧' },
  pdm: { name: 'Premium Deluxe Motorsport', table: 'pdm_applications', color: 'amber', icon: '🚗' },
  weazel: { name: 'Weazel News', table: 'weazel_news_applications', color: 'cyan', icon: '📺' },
};
