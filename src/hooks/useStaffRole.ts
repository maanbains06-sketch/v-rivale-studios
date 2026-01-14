import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffRole {
  isStaff: boolean;
  isAdmin: boolean;
  department: string | null;
  roleType: string | null;
  loading: boolean;
}

export const useStaffRole = () => {
  const [staffRole, setStaffRole] = useState<StaffRole>({
    isStaff: false,
    isAdmin: false,
    department: null,
    roleType: null,
    loading: true,
  });

  useEffect(() => {
    const checkStaffRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setStaffRole({ isStaff: false, isAdmin: false, department: null, roleType: null, loading: false });
          return;
        }

        // Get Discord ID from user metadata (stored during signup)
        const discordId = user.user_metadata?.discord_id;

        // Check if user is an admin or moderator from user_roles table
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'moderator']);

        const isAdminFromRoles = userRoles && userRoles.length > 0;

        // Check if user is a staff member by Discord ID (primary) or user_id (fallback)
        let staffMember = null;
        
        if (discordId && /^\d{17,19}$/.test(discordId)) {
          // First try to match by Discord ID
          const { data } = await supabase
            .from('staff_members')
            .select('department, role_type, is_active')
            .eq('discord_id', discordId)
            .eq('is_active', true)
            .maybeSingle();
          staffMember = data;
        }
        
        // Fallback to user_id if no match by Discord ID
        if (!staffMember) {
          const { data } = await supabase
            .from('staff_members')
            .select('department, role_type, is_active')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();
          staffMember = data;
        }

        // Determine admin status from staff role_type or user_roles
        const isAdminFromStaff = staffMember?.role_type === 'admin' || 
                                  staffMember?.role_type === 'owner' ||
                                  staffMember?.role_type === 'developer';

        if (staffMember || isAdminFromRoles) {
          setStaffRole({
            isStaff: staffMember ? true : false,
            isAdmin: isAdminFromRoles || isAdminFromStaff,
            department: staffMember?.department || null,
            roleType: staffMember?.role_type || null,
            loading: false,
          });
        } else {
          setStaffRole({ isStaff: false, isAdmin: false, department: null, roleType: null, loading: false });
        }
      } catch (error) {
        console.error('Error checking staff role:', error);
        setStaffRole({ isStaff: false, isAdmin: false, department: null, roleType: null, loading: false });
      }
    };

    checkStaffRole();
  }, []);

  const canAccessCategory = (category: string): boolean => {
    if (!staffRole.isStaff) return false;

    // Screenshots and Videos - all staff members can access
    if (category === 'screenshot' || category === 'video') {
      return true;
    }

    // Events - only specific departments
    if (category === 'event') {
      const allowedDepartments = ['administration', 'development', 'leadership', 'events'];
      return staffRole.department ? allowedDepartments.includes(staffRole.department.toLowerCase()) : false;
    }

    // Community - everyone can access
    if (category === 'community') {
      return true;
    }

    return false;
  };

  return { ...staffRole, canAccessCategory };
};
