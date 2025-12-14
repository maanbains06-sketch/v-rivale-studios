import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineStatusData {
  online: boolean;
  status: string;
  lastSeen: string | null;
}

interface DiscordPresencePublic {
  id: string;
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
      // Fetch all active staff members from PUBLIC view (accessible to everyone)
      const { data: staffMembers, error: staffError } = await supabase
        .from("staff_members_public")
        .select("id, user_id")
        .eq("is_active", true);

      if (staffError) {
        // Silently ignore staff-related errors
        setLoading(false);
        return;
      }

      if (!staffMembers || staffMembers.length === 0) {
        setOnlineStatus({});
        setOnlineCount(0);
        setLoading(false);
        return;
      }

      // Fetch Discord presence data from PUBLIC view (accessible to everyone)
      const staffIds = staffMembers.map(m => m.id).filter(Boolean);

      let presenceMap = new Map<string, DiscordPresencePublic>();
      
      if (staffIds.length > 0) {
        // Use the public view that doesn't expose discord_id
        const { data: presenceData, error: presenceError } = await supabase
          .from("discord_presence_public")
          .select("*")
          .in("staff_member_id", staffIds);

        // Silently ignore presence errors
        if (!presenceError && presenceData) {
          presenceData.forEach((presence: DiscordPresencePublic) => {
            if (presence.staff_member_id) {
              presenceMap.set(presence.staff_member_id, presence);
            }
          });
        }
      }

      // Skip staff availability check for public view - use Discord presence only
      // This ensures unauthenticated users can still see online status

      const status: { [staffId: string]: OnlineStatusData } = {};
      const now = new Date();
      let count = 0;

      staffMembers.forEach((member) => {
        let isOnline = false;
        let presenceStatus = 'offline';
        let lastSeenTime: string | null = null;

        // Check Discord presence using staff_member_id (primary and only source for public)
        const presence = presenceMap.get(member.id);
        if (presence) {
          isOnline = presence.is_online;
          presenceStatus = presence.status || 'offline';
          
          // Use Discord's last_online_at if available
          if (presence.last_online_at) {
            lastSeenTime = presence.last_online_at;
          }

          // Check if presence data is stale (more than 15 minutes old)
          const updatedAt = new Date(presence.updated_at);
          const minutesSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000 / 60;
          
          if (minutesSinceUpdate > 15) {
            // Presence data is stale, mark as potentially offline
            isOnline = false;
            presenceStatus = 'unknown';
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
    } catch {
      // Silently ignore all staff-related errors
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
        () => {
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
      if (error) return null;
      await fetchStaffStatus();
      return data;
    } catch {
      // Silently ignore sync errors
      return null;
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