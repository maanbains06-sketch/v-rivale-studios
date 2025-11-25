import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useStaffPresence = () => {
  useEffect(() => {
    const trackPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is staff
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isStaff = roles?.some(r => ['admin', 'moderator'].includes(r.role));
      if (!isStaff) return;

      const channel = supabase.channel('staff-presence');

      channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });

        // Log login activity
        await supabase.rpc('log_staff_activity', {
          p_staff_user_id: user.id,
          p_action_type: 'login',
          p_action_description: 'Staff member logged in',
        });
      });

      // Cleanup on unmount
      return () => {
        channel.untrack();
        supabase.removeChannel(channel);
      };
    };

    trackPresence();
  }, []);
};
