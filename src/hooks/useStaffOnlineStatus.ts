import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineStatusData {
  online: boolean;
  lastSeen: string | null;
}

export const useStaffOnlineStatus = () => {
  const [onlineStatus, setOnlineStatus] = useState<{ [userId: string]: OnlineStatusData }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffStatus = async () => {
      try {
        // Fetch all staff members with their last_seen timestamp and availability
        const { data: staffMembers, error: staffError } = await supabase
          .from("staff_members")
          .select(`
            user_id, 
            last_seen, 
            discord_id,
            staff_availability (
              is_available
            )
          `)
          .eq("is_active", true)
          .not("user_id", "is", null);

        if (staffError) throw staffError;

        if (staffMembers) {
          const status: { [userId: string]: OnlineStatusData } = {};
          const now = new Date();
          
          // Consider staff online if:
          // 1. Their last_seen is within the last 5 minutes AND
          // 2. They are marked as available in staff_availability
          staffMembers.forEach((member: any) => {
            if (member.user_id) {
              const lastSeen = member.last_seen;
              let isOnline = false;
              
              if (lastSeen) {
                const lastSeenDate = new Date(lastSeen);
                const minutesSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
                
                // Check if recently active (within last 5 minutes)
                const isRecentlyActive = minutesSinceLastSeen < 5;
                
                // Check if marked as available
                const isAvailable = member.staff_availability?.[0]?.is_available ?? false;
                
                // Online only if both conditions are met
                isOnline = isRecentlyActive && isAvailable;
              }
              
              status[member.user_id] = {
                online: isOnline,
                lastSeen: lastSeen,
              };
            }
          });

          setOnlineStatus(status);
        }
      } catch (error) {
        console.error("Error fetching staff status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStaffStatus, 30000);

    // Subscribe to realtime updates on both staff_members and staff_availability tables
    const staffMembersChannel = supabase
      .channel("staff-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staff_members",
        },
        () => {
          // Refetch when staff_members updates
          fetchStaffStatus();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staff_availability",
        },
        () => {
          // Refetch when staff_availability updates
          fetchStaffStatus();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(staffMembersChannel);
    };
  }, []);

  const isOnline = (userId: string | null) => {
    if (!userId) return false;
    return onlineStatus[userId]?.online || false;
  };

  const getLastSeen = (userId: string | null) => {
    if (!userId) return null;
    return onlineStatus[userId]?.lastSeen || null;
  };

  return {
    onlineStatus,
    isOnline,
    getLastSeen,
    loading,
  };
};
