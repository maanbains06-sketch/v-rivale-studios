import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Discord Guild ID - replace with your actual Discord server ID
const DISCORD_GUILD_ID = "YOUR_DISCORD_SERVER_ID";

export const useStaffPresence = () => {
  useEffect(() => {
    const trackPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is staff
      const { data: staffMember } = await supabase
        .from("staff_members")
        .select("discord_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!staffMember) return;

      // Sync Discord activity periodically
      const syncDiscordActivity = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("check-discord-activity", {
            body: {
              userId: user.id,
              guildId: DISCORD_GUILD_ID,
            },
          });

          if (error) {
            console.error("Error checking Discord activity:", error);
          } else {
            console.log("Discord activity synced:", data);
          }
        } catch (error) {
          console.error("Failed to sync Discord activity:", error);
        }
      };

      // Initial sync
      syncDiscordActivity();

      // Sync every 2 minutes
      const interval = setInterval(syncDiscordActivity, 120000);

      return () => {
        clearInterval(interval);
      };
    };

    trackPresence();
  }, []);
};
