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

      // Check Discord roles for edit/view permission via edge function (live fetch)
      if (discordId && /^\d{17,19}$/.test(discordId)) {
        console.log('Fetching live roster access for Discord ID:', discordId);
        
        const { data, error } = await supabase.functions.invoke('verify-roster-access', {
          body: { discordId }
        });

        if (error) {
          console.error('Error checking roster access:', error);
          // Fall back to staff check - staff can view all but no edit
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

        if (data) {
          console.log('Live roster access response:', data);
          // User has specific Discord roles for roster access
          const departments = (data.accessibleDepartments || []) as RosterDepartmentKey[];
          const editable = (data.editableDepartments || []) as RosterDepartmentKey[];
          
          setAccess({
            hasAccess: data.hasAccess || false,
            canEdit: data.canEdit || false,
            loading: false,
            isOwner: data.isOwner || false,
            isStaff: isStaff || isAdmin || false,
            accessibleDepartments: departments,
            editableDepartments: editable,
          });
          return;
        }
      }

      // Staff members get view access to all departments but need Discord role for edit
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
