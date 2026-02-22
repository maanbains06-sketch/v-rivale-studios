import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that checks if the website is in lockdown mode.
 * Returns { isLocked, isOwner, loading } so pages can block access.
 */
export const useLockdownCheck = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      // Check lockdown status
      const { data: lockdownData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "lockdown_mode")
        .maybeSingle();

      const locked = lockdownData?.value === "true";
      setIsLocked(locked);

      if (locked) {
        // Check if current user is owner
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: ownerResult } = await supabase.rpc("is_owner", { _user_id: user.id });
          setIsOwner(!!ownerResult);
        }
      }

      setLoading(false);
    };

    check();

    // Listen for lockdown changes in realtime
    const channel = supabase
      .channel("lockdown-check")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: "key=eq.lockdown_mode" }, (payload: any) => {
        const newVal = payload.new?.value === "true";
        setIsLocked(newVal);
        if (!newVal) setIsOwner(false); // reset since lockdown is off
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { isLocked, isOwner, loading };
};
