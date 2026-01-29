import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WhitelistRoleStatus {
  isLoading: boolean;
  hasWhitelistRole: boolean;
  isInDiscordServer: boolean;
  discordUsername: string | null;
  discordId: string | null;
  error: string | null;
}

export const useWhitelistRoleSync = (userId: string | null) => {
  const [status, setStatus] = useState<WhitelistRoleStatus>({
    isLoading: true,
    hasWhitelistRole: false,
    isInDiscordServer: false,
    discordUsername: null,
    discordId: null,
    error: null,
  });

  const checkWhitelistRole = useCallback(async () => {
    if (!userId) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get user's Discord ID from auth metadata
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus({
          isLoading: false,
          hasWhitelistRole: false,
          isInDiscordServer: false,
          discordUsername: null,
          discordId: null,
          error: "User not authenticated",
        });
        return;
      }

      const discordId = user.user_metadata?.discord_id;
      
      if (!discordId || !/^\d{17,19}$/.test(discordId)) {
        setStatus({
          isLoading: false,
          hasWhitelistRole: false,
          isInDiscordServer: false,
          discordUsername: null,
          discordId: null,
          error: "No valid Discord ID linked",
        });
        return;
      }

      // Call the verify-discord-requirements function to check live status
      const { data, error } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId }
      });

      if (error) {
        console.error("Error verifying Discord requirements:", error);
        setStatus({
          isLoading: false,
          hasWhitelistRole: false,
          isInDiscordServer: false,
          discordUsername: null,
          discordId,
          error: error.message,
        });
        return;
      }

      console.log("Whitelist role sync result:", data);

      setStatus({
        isLoading: false,
        hasWhitelistRole: data?.hasWhitelistRole || false,
        isInDiscordServer: data?.isInServer || false,
        discordUsername: data?.username || data?.nickname || null,
        discordId,
        error: null,
      });
    } catch (err: any) {
      console.error("Error in useWhitelistRoleSync:", err);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
      }));
    }
  }, [userId]);

  useEffect(() => {
    checkWhitelistRole();
    
    // Set up interval to refresh status every 30 seconds for live updates
    const intervalId = setInterval(checkWhitelistRole, 30000);
    
    return () => clearInterval(intervalId);
  }, [checkWhitelistRole]);

  return {
    ...status,
    refresh: checkWhitelistRole,
  };
};
