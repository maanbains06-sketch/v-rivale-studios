import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineStatusData {
  online: boolean;
  lastSeen: string | null;
}

export const useStaffOnlineStatus = () => {
  const [onlineStatus, setOnlineStatus] = useState<{ [staffId: string]: OnlineStatusData }>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffStatus = async () => {
      try {
        // Fetch all active staff members
        const { data: staffMembers, error: staffError } = await supabase
          .from("staff_members")
          .select("id, user_id, last_seen, discord_id")
          .eq("is_active", true);

        if (staffError) throw staffError;

        if (staffMembers) {
          const status: { [staffId: string]: OnlineStatusData } = {};
          const now = new Date();
          let count = 0;
          
          // For staff with user_ids, check their availability
          const staffWithUserIds = staffMembers.filter(m => m.user_id);
          let availabilityMap = new Map<string, boolean>();
          
          if (staffWithUserIds.length > 0) {
            const { data: availabilityData } = await supabase
              .from("staff_availability")
              .select("user_id, is_available")
              .in("user_id", staffWithUserIds.map(s => s.user_id!));
            
            availabilityData?.forEach((avail) => {
              availabilityMap.set(avail.user_id, avail.is_available);
            });
          }
          
          // Check online status for all staff
          staffMembers.forEach((member) => {
            const lastSeen = member.last_seen;
            let isOnline = false;
            
            if (lastSeen) {
              const lastSeenDate = new Date(lastSeen);
              const minutesSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
              
              // Check if recently active (within last 5 minutes)
              const isRecentlyActive = minutesSinceLastSeen < 5;
              
              // For staff with user_ids, also check availability
              if (member.user_id) {
                const isAvailable = availabilityMap.get(member.user_id) ?? false;
                isOnline = isRecentlyActive && isAvailable;
              } else {
                // For staff without user_ids, just use recent activity
                isOnline = isRecentlyActive;
              }
            }
            
            status[member.id] = {
              online: isOnline,
              lastSeen: lastSeen,
            };
            
            if (isOnline) count++;
          });

          setOnlineStatus(status);
          setOnlineCount(count);
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

    // Subscribe to realtime updates
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
          fetchStaffStatus();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(staffMembersChannel);
    };
  }, []);

  const isOnline = (staffIdOrUserId: string | null) => {
    if (!staffIdOrUserId) return false;
    return onlineStatus[staffIdOrUserId]?.online || false;
  };

  const getLastSeen = (staffIdOrUserId: string | null) => {
    if (!staffIdOrUserId) return null;
    return onlineStatus[staffIdOrUserId]?.lastSeen || null;
  };

  return {
    onlineStatus,
    onlineCount,
    isOnline,
    getLastSeen,
    loading,
  };
};
