import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StaffMember {
  id: string;
  user_id: string | null;
  name: string;
  discord_id: string;
  discord_avatar: string | null;
  role_type: string | null;
  department: string | null;
}

/**
 * Hook to fetch staff member names indexed by user_id.
 * Returns a lookup map: user_id -> { name, discord_id, discord_avatar, role_type, department }
 */
export const useStaffNames = () => {
  const [staffMap, setStaffMap] = useState<Record<string, StaffMember>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from("staff_members")
          .select("id, user_id, name, discord_id, discord_avatar, role_type, department")
          .eq("is_active", true);

        if (error) throw error;

        const map: Record<string, StaffMember> = {};
        (data || []).forEach((staff) => {
          if (staff.user_id) {
            map[staff.user_id] = staff;
          }
        });
        setStaffMap(map);
      } catch (error) {
        console.error("Error fetching staff names:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const getStaffName = (userId: string | null): string => {
    if (!userId) return "-";
    const staff = staffMap[userId];
    return staff?.name || userId.slice(0, 8) + "...";
  };

  const getStaffInfo = (userId: string | null): StaffMember | null => {
    if (!userId) return null;
    return staffMap[userId] || null;
  };

  return { staffMap, getStaffName, getStaffInfo, loading };
};
