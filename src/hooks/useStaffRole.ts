import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StaffRole {
  isStaff: boolean;
  department: string | null;
  roleType: string | null;
  loading: boolean;
}

export const useStaffRole = () => {
  const [staffRole, setStaffRole] = useState<StaffRole>({
    isStaff: false,
    department: null,
    roleType: null,
    loading: true,
  });

  useEffect(() => {
    const checkStaffRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setStaffRole({ isStaff: false, department: null, roleType: null, loading: false });
          return;
        }

        // Check if user is a staff member
        const { data: staffMember } = await supabase
          .from('staff_members')
          .select('department, role_type, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (staffMember) {
          setStaffRole({
            isStaff: true,
            department: staffMember.department,
            roleType: staffMember.role_type,
            loading: false,
          });
        } else {
          setStaffRole({ isStaff: false, department: null, roleType: null, loading: false });
        }
      } catch (error) {
        console.error('Error checking staff role:', error);
        setStaffRole({ isStaff: false, department: null, roleType: null, loading: false });
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
