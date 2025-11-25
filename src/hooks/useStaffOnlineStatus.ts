import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface OnlineStatus {
  [userId: string]: {
    online: boolean;
    lastSeen: string;
  };
}

export const useStaffOnlineStatus = () => {
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a presence channel for staff
    const presenceChannel = supabase.channel("staff-presence", {
      config: {
        presence: {
          key: "staff-online",
        },
      },
    });

    // Subscribe to presence state changes
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        console.log("Presence sync:", state);

        const newStatus: OnlineStatus = {};
        
        // Process presence state
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.user_id) {
              newStatus[presence.user_id] = {
                online: true,
                lastSeen: presence.online_at || new Date().toISOString(),
              };
            }
          }
        });

        setOnlineStatus(newStatus);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
        
        setOnlineStatus((prev) => {
          const updated = { ...prev };
          newPresences.forEach((presence: any) => {
            if (presence.user_id) {
              updated[presence.user_id] = {
                online: true,
                lastSeen: presence.online_at || new Date().toISOString(),
              };
            }
          });
          return updated;
        });
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
        
        setOnlineStatus((prev) => {
          const updated = { ...prev };
          leftPresences.forEach((presence: any) => {
            if (presence.user_id && updated[presence.user_id]) {
              updated[presence.user_id] = {
                online: false,
                lastSeen: new Date().toISOString(),
              };
            }
          });
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to staff presence channel");
        }
      });

    setChannel(presenceChannel);

    // Cleanup
    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
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
  };
};
