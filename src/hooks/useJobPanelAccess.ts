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

const ALL_DEPARTMENTS: DepartmentKey[] = ['pd', 'ems', 'firefighter', 'doj', 'state', 'mechanic', 'pdm', 'weazel'];

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

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setState({ hasAccess: false, isOwner: false, accessibleDepartments: [], loading: false, error: null });
        return;
      }

      // Check if owner - full access to all departments
      const { data: isOwnerResult } = await supabase.rpc('is_owner', { _user_id: user.id });
      
      if (isOwnerResult) {
        setState({
          hasAccess: true,
          isOwner: true,
          accessibleDepartments: ALL_DEPARTMENTS,
          loading: false,
          error: null,
        });
        return;
      }

      // Check manual panel_access for job panel - NO automatic Discord role access
      const discordId = user.user_metadata?.discord_id || 
                        user.user_metadata?.provider_id || 
                        user.user_metadata?.sub;
      
      if (discordId && /^\d{17,19}$/.test(discordId)) {
        const { data: panelData } = await supabase
          .from('panel_access')
          .select('departments')
          .eq('discord_id', discordId)
          .eq('panel_type', 'job')
          .eq('is_active', true)
          .maybeSingle();
        
        if (panelData) {
          let departments: DepartmentKey[];
          
          if (!panelData.departments || panelData.departments.length === 0 || panelData.departments.includes('all')) {
            departments = ALL_DEPARTMENTS;
          } else {
            departments = panelData.departments.filter(
              (d: string) => ALL_DEPARTMENTS.includes(d as DepartmentKey)
            ) as DepartmentKey[];
          }
          
          setState({
            hasAccess: true,
            isOwner: false,
            accessibleDepartments: departments,
            loading: false,
            error: null,
          });
          return;
        }
      }

      // No access
      setState({ hasAccess: false, isOwner: false, accessibleDepartments: [], loading: false, error: null });
    } catch (err) {
      console.error('Error in useJobPanelAccess:', err);
      setState({ hasAccess: false, isOwner: false, accessibleDepartments: [], loading: false, error: 'An error occurred' });
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
