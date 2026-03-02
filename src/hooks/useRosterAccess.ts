import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStaffRole } from './useStaffRole';

export type RosterDepartmentKey = 'police' | 'ems' | 'fire' | 'mechanic' | 'doj' | 'state' | 'weazel' | 'pdm' | 'staff';

interface RosterAccess {
  hasAccess: boolean;
  canEdit: boolean;
  loading: boolean;
  isOwner: boolean;
  isStaff: boolean;
  accessibleDepartments: RosterDepartmentKey[];
  editableDepartments: RosterDepartmentKey[];
}

export const useRosterAccess = () => {
  const [access, setAccess] = useState<RosterAccess>({
    hasAccess: false,
    canEdit: false,
    loading: true,
    isOwner: false,
    isStaff: false,
    accessibleDepartments: [],
    editableDepartments: [],
  });
  const { isStaff, isAdmin, loading: staffLoading } = useStaffRole();

  const checkAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAccess({ 
          hasAccess: false, 
          canEdit: false, 
          loading: false, 
          isOwner: false, 
          isStaff: false, 
          accessibleDepartments: [],
          editableDepartments: [],
        });
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

      const allDepts: RosterDepartmentKey[] = ['police', 'ems', 'fire', 'mechanic', 'doj', 'state', 'weazel', 'pdm', 'staff'];

      if (isOwnerResult) {
        setAccess({
          hasAccess: true,
          canEdit: true,
          loading: false,
          isOwner: true,
          isStaff: false,
          accessibleDepartments: allDepts,
          editableDepartments: allDepts,
        });
        return;
      }

      // Check manual panel_access table for roster access
      if (discordId && /^\d{17,19}$/.test(discordId)) {
        const { data: panelAccessData, error: panelAccessError } = await supabase
          .from('panel_access')
          .select('roster_departments')
          .eq('discord_id', discordId)
          .eq('panel_type', 'roster')
          .eq('is_active', true)
          .maybeSingle();

        if (!panelAccessError && panelAccessData) {
          // User has manual roster access granted by owner
          let accessibleDepts: RosterDepartmentKey[] = [];
          
          if (!panelAccessData.roster_departments || panelAccessData.roster_departments.length === 0 || panelAccessData.roster_departments.includes('all')) {
            // Full access to all departments
            accessibleDepts = allDepts;
          } else {
            accessibleDepts = panelAccessData.roster_departments as RosterDepartmentKey[];
          }

          console.log('Manual panel_access roster access found:', accessibleDepts);
          
          setAccess({
            hasAccess: true,
            canEdit: true, // Manual access grants edit permission
            loading: false,
            isOwner: false,
            isStaff: isStaff || isAdmin || false,
            accessibleDepartments: accessibleDepts,
            editableDepartments: accessibleDepts,
          });
          return;
        }
      }

      // Panel access is MANUAL ONLY - no automatic Discord role-based access
      // Staff members get view access to all departments but need manual panel_access for edit
      if (isStaff || isAdmin) {
        setAccess({ 
          hasAccess: true, 
          canEdit: false,
          loading: false, 
          isOwner: false, 
          isStaff: true,
          accessibleDepartments: allDepts,
          editableDepartments: [],
        });
        return;
      }

      // No access
      setAccess({ 
        hasAccess: false, 
        canEdit: false, 
        loading: false, 
        isOwner: false, 
        isStaff: false, 
        accessibleDepartments: [],
        editableDepartments: [],
      });
    } catch (error) {
      console.error('Error checking roster access:', error);
      setAccess({ 
        hasAccess: false, 
        canEdit: false, 
        loading: false, 
        isOwner: false, 
        isStaff: false, 
        accessibleDepartments: [],
        editableDepartments: [],
      });
    }
  }, [isStaff, isAdmin]);

  useEffect(() => {
    // Wait for staff role check to complete
    if (!staffLoading) {
      checkAccess();
    }
  }, [staffLoading, checkAccess]);

  // Helper to check if user can access a specific department
  const canAccessDepartment = useCallback((deptKey: string): boolean => {
    if (access.isOwner) return true;
    return access.accessibleDepartments.includes(deptKey as RosterDepartmentKey);
  }, [access.isOwner, access.accessibleDepartments]);

  // Helper to check if user can edit a specific department
  const canEditDepartment = useCallback((deptKey: string): boolean => {
    if (access.isOwner) return true;
    return access.editableDepartments.includes(deptKey as RosterDepartmentKey);
  }, [access.isOwner, access.editableDepartments]);

  // Refetch access (useful for refreshing after role changes)
  const refetch = useCallback(() => {
    setAccess(prev => ({ ...prev, loading: true }));
    checkAccess();
  }, [checkAccess]);

  return { 
    ...access, 
    canAccessDepartment, 
    canEditDepartment,
    refetch,
  };
};
