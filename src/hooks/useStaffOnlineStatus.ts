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
        // Fetch all staff members with their last_seen timestamp
        const { data: staffMembers, error } = await supabase
          .from("staff_members")
          .select("user_id, last_seen, discord_id")
          .eq("is_active", true)
          .not("user_id", "is", null);

        if (error) throw error;

        if (staffMembers) {
          const status: { [userId: string]: OnlineStatusData } = {};
          const now = new Date();
          
          // Consider staff online if their last_seen is within the last 5 minutes
          // This works with Discord activity tracking
          staffMembers.forEach((member) => {
            if (member.user_id) {
              const lastSeen = member.last_seen;
              let isOnline = false;
              
              if (lastSeen) {
                const lastSeenDate = new Date(lastSeen);
                const minutesSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
                
                // Online if active within last 5 minutes
                isOnline = minutesSinceLastSeen < 5;
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

    // Subscribe to realtime updates on staff_members table
    const channel = supabase
      .channel("staff-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staff_members",
        },
        (payload: any) => {
          if (payload.new.user_id) {
            const now = new Date();
            const lastSeen = payload.new.last_seen;
            let isOnline = false;
            
            if (lastSeen) {
              const lastSeenDate = new Date(lastSeen);
              const minutesSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
              isOnline = minutesSinceLastSeen < 5;
            }
            
            setOnlineStatus((prev) => ({
              ...prev,
              [payload.new.user_id]: {
                online: isOnline,
                lastSeen: lastSeen,
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
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
