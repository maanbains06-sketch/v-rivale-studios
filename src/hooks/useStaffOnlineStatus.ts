import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineStatusData {
  online: boolean;
  status: string;
  lastSeen: string | null;
}

interface DiscordPresence {
  id: string;
  discord_id: string;
  staff_member_id: string;
  is_online: boolean;
  status: string;
  last_online_at: string | null;
  updated_at: string;
}

export const useStaffOnlineStatus = () => {
  const [onlineStatus, setOnlineStatus] = useState<{ [staffId: string]: OnlineStatusData }>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStaffStatus = useCallback(async () => {
    try {
      // Fetch all active staff members with their Discord IDs
      const { data: staffMembers, error: staffError } = await supabase
        .from("staff_members")
        .select("id, user_id, last_seen, discord_id")
        .eq("is_active", true);

      if (staffError) throw staffError;

      if (!staffMembers) {
        setOnlineStatus({});
        setOnlineCount(0);
        return;
      }

      // Fetch Discord presence data
      const discordIds = staffMembers
        .filter(m => m.discord_id)
        .map(m => m.discord_id!);

      let presenceMap = new Map<string, DiscordPresence>();
      
      if (discordIds.length > 0) {
        const { data: presenceData, error: presenceError } = await supabase
          .from("discord_presence")
          .select("*")
          .in("discord_id", discordIds);

        if (!presenceError && presenceData) {
          presenceData.forEach((presence: DiscordPresence) => {
            presenceMap.set(presence.discord_id, presence);
          });
        }
      }

      // Get staff availability as fallback
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

      const status: { [staffId: string]: OnlineStatusData } = {};
      const now = new Date();
      let count = 0;

      staffMembers.forEach((member) => {
        let isOnline = false;
        let presenceStatus = 'offline';
        let lastSeenTime = member.last_seen;

        // Check Discord presence first (primary source)
        if (member.discord_id) {
          const presence = presenceMap.get(member.discord_id);
          if (presence) {
            isOnline = presence.is_online;
            presenceStatus = presence.status || 'offline';
            
            // Use Discord's last_online_at if available
            if (presence.last_online_at) {
              lastSeenTime = presence.last_online_at;
            }

            // Check if presence data is stale (more than 10 minutes old)
            const updatedAt = new Date(presence.updated_at);
            const minutesSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000 / 60;
            
            if (minutesSinceUpdate > 10) {
              // Presence data is stale, mark as potentially offline
              isOnline = false;
              presenceStatus = 'unknown';
            }
          }
        }

        // Fallback: Check last_seen for staff without Discord presence
        if (!member.discord_id && member.last_seen) {
          const lastSeenDate = new Date(member.last_seen);
          const minutesSinceLastSeen = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60;
          
          if (minutesSinceLastSeen < 5) {
            // Check availability if they have a user_id
            if (member.user_id) {
              const isAvailable = availabilityMap.get(member.user_id) ?? false;
              isOnline = isAvailable;
              presenceStatus = isAvailable ? 'online' : 'offline';
            } else {
              isOnline = true;
              presenceStatus = 'online';
            }
          }
        }

        status[member.id] = {
          online: isOnline,
          status: presenceStatus,
          lastSeen: lastSeenTime,
        };

        if (isOnline) count++;
      });

      setOnlineStatus(status);
      setOnlineCount(count);
    } catch (error) {
      console.error("Error fetching staff status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStaffStatus, 30000);

    // Subscribe to realtime updates for discord_presence table
    const presenceChannel = supabase
      .channel("discord-presence-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "discord_presence",
        },
        (payload) => {
          console.log("Discord presence changed:", payload);
          fetchStaffStatus();
        }
      )
      .subscribe();

    // Also subscribe to staff_members changes
    const staffChannel = supabase
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
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(staffChannel);
    };
  }, [fetchStaffStatus]);

  const isOnline = (staffIdOrUserId: string | null) => {
    if (!staffIdOrUserId) return false;
    return onlineStatus[staffIdOrUserId]?.online || false;
  };

  const getLastSeen = (staffIdOrUserId: string | null) => {
    if (!staffIdOrUserId) return null;
    return onlineStatus[staffIdOrUserId]?.lastSeen || null;
  };

  const getStatus = (staffIdOrUserId: string | null) => {
    if (!staffIdOrUserId) return 'offline';
    return onlineStatus[staffIdOrUserId]?.status || 'offline';
  };

  // Manual trigger for syncing presence
  const syncPresence = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-discord-presence");
      if (error) throw error;
      console.log("Presence sync triggered:", data);
      await fetchStaffStatus();
      return data;
    } catch (error) {
      console.error("Error syncing presence:", error);
      throw error;
    }
  };

  return {
    onlineStatus,
    onlineCount,
    isOnline,
    getLastSeen,
    getStatus,
    loading,
    syncPresence,
    refresh: fetchStaffStatus,
  };
};