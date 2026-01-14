import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WhitelistAccessData {
  hasAccess: boolean;
  isInServer: boolean;
  hasWhitelistRole: boolean;
  loading: boolean;
  discordId: string | null;
  error: string | null;
}

/**
 * Hook to check if user has whitelist access via Discord role
 * This replaces the old whitelist application check
 */
export const useWhitelistAccess = () => {
  const [accessData, setAccessData] = useState<WhitelistAccessData>({
    hasAccess: false,
    isInServer: false,
    hasWhitelistRole: false,
    loading: true,
    discordId: null,
    error: null,
  });

  const checkAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAccessData({
          hasAccess: false,
          isInServer: false,
          hasWhitelistRole: false,
          loading: false,
          discordId: null,
          error: null,
        });
        return;
      }

      const discordId = user.user_metadata?.discord_id;
      
      if (!discordId || !/^\d{17,19}$/.test(discordId)) {
        setAccessData({
          hasAccess: false,
          isInServer: false,
          hasWhitelistRole: false,
          loading: false,
          discordId: null,
          error: "No valid Discord ID found",
        });
        return;
      }

      // Verify Discord requirements (server membership and whitelist role)
      const { data: reqData, error: reqError } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId }
      });

      if (reqError) {
        console.error("Error verifying Discord requirements:", reqError);
        setAccessData({
          hasAccess: false,
          isInServer: false,
          hasWhitelistRole: false,
          loading: false,
          discordId,
          error: "Failed to verify Discord status",
        });
        return;
      }

      const isInServer = reqData?.isInServer || false;
      const hasWhitelistRole = reqData?.hasWhitelistRole || false;

      setAccessData({
        hasAccess: hasWhitelistRole,
        isInServer,
        hasWhitelistRole,
        loading: false,
        discordId,
        error: null,
      });
    } catch (error: any) {
      console.error("Whitelist access check error:", error);
      setAccessData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const refreshAccess = useCallback(() => {
    setAccessData(prev => ({ ...prev, loading: true }));
    checkAccess();
  }, [checkAccess]);

  return { ...accessData, refreshAccess };
};
