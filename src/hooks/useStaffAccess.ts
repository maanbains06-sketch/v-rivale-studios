import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const OWNER_DISCORD_ID = "833680146510381097";

export const useStaffAccess = () => {
  const [isOwner, setIsOwner] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDiscordId, setUserDiscordId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const [discordAvatar, setDiscordAvatar] = useState<string | null>(null);
  const [staffRoleType, setStaffRoleType] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      const discordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id || user.user_metadata?.sub;
      setUserDiscordId(discordId || null);
      setDiscordUsername(user.user_metadata?.username || user.user_metadata?.display_name || null);
      setDiscordAvatar(user.user_metadata?.avatar_url || null);

      if (discordId === OWNER_DISCORD_ID) {
        setIsOwner(true);
        setIsStaff(true);
        setStaffRoleType("owner");
        setLoading(false);
        return;
      }

      // Check staff_members
      if (discordId && /^\d{17,19}$/.test(discordId)) {
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("role_type, is_active")
          .eq("discord_id", discordId)
          .eq("is_active", true)
          .maybeSingle();

        if (staffMember) {
          if (staffMember.role_type === "owner") setIsOwner(true);
          setIsStaff(true);
          setStaffRoleType(staffMember.role_type);
          setLoading(false);
          return;
        }
      }

      // Fallback: DB owner check
      const { data: ownerResult } = await supabase.rpc("is_owner", { _user_id: user.id });
      if (ownerResult) {
        setIsOwner(true);
        setIsStaff(true);
        setStaffRoleType("owner");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    isOwner,
    isStaff,
    loading,
    userDiscordId,
    userId,
    discordUsername,
    discordAvatar,
    staffRoleType,
    voteWeight: staffRoleType === "owner" ? 5 : staffRoleType === "admin" ? 3 : 1,
  };
};
