import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DiscordProfileData {
  discordId: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  isInServer: boolean;
  hasWhitelistRole: boolean;
  loading: boolean;
  error: string | null;
}

export const useDiscordProfile = (discordId?: string) => {
  const [profileData, setProfileData] = useState<DiscordProfileData>({
    discordId: null,
    username: null,
    displayName: null,
    avatar: null,
    isInServer: false,
    hasWhitelistRole: false,
    loading: true,
    error: null,
  });

  const fetchDiscordProfile = useCallback(async (id: string) => {
    if (!id || !/^\d{17,19}$/.test(id)) {
      setProfileData(prev => ({ ...prev, loading: false, error: "Invalid Discord ID" }));
      return;
    }

    try {
      // Fetch Discord user info from our edge function
      const { data: userData, error: userError } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId: id }
      });

      if (userError) {
        console.error("Error fetching Discord user:", userError);
      }

      // Verify Discord requirements (server membership and whitelist role)
      const { data: reqData, error: reqError } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId: id }
      });

      if (reqError) {
        console.error("Error verifying Discord requirements:", reqError);
      }

      setProfileData({
        discordId: id,
        username: userData?.username || null,
        displayName: userData?.displayName || userData?.username || null,
        avatar: userData?.avatarUrl || null,
        isInServer: reqData?.isInServer || false,
        hasWhitelistRole: reqData?.hasWhitelistRole || false,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Discord profile fetch error:", error);
      setProfileData(prev => ({
        ...prev,
        loading: false,
        error: "Failed to fetch Discord profile",
      }));
    }
  }, []);

  const refreshProfile = useCallback(() => {
    if (profileData.discordId) {
      setProfileData(prev => ({ ...prev, loading: true }));
      fetchDiscordProfile(profileData.discordId);
    }
  }, [profileData.discordId, fetchDiscordProfile]);

  useEffect(() => {
    const getDiscordId = async () => {
      if (discordId) {
        fetchDiscordProfile(discordId);
        return;
      }

      // Get from user metadata - look for discord_id first (stored during signup)
      const { data: { user } } = await supabase.auth.getUser();
      const userDiscordId = user?.user_metadata?.discord_id;
      
      if (userDiscordId && /^\d{17,19}$/.test(userDiscordId)) {
        fetchDiscordProfile(userDiscordId);
      } else {
        setProfileData(prev => ({ ...prev, loading: false }));
      }
    };

    getDiscordId();

    // Set up real-time refresh every 30 seconds (only if we have a valid Discord ID)
    const interval = setInterval(() => {
      if (profileData.discordId && /^\d{17,19}$/.test(profileData.discordId)) {
        fetchDiscordProfile(profileData.discordId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [discordId, fetchDiscordProfile]);

  return { ...profileData, refreshProfile };
};
