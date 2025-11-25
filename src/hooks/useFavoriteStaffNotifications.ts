import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFavoriteStaffNotifications = (
  favorites: string[],
  onlineStatus: { [userId: string]: { online: boolean } }
) => {
  const { toast } = useToast();

  useEffect(() => {
    if (favorites.length === 0) return;

    // Track previous online status
    const previousStatus: { [key: string]: boolean } = {};

    const checkFavoriteStatus = async () => {
      try {
        const { data: staffMembers } = await supabase
          .from("staff_members")
          .select("id, name, user_id")
          .in("id", favorites);

        if (!staffMembers) return;

        staffMembers.forEach((staff) => {
          if (!staff.user_id) return;

          const isCurrentlyOnline = onlineStatus[staff.user_id]?.online || false;
          const wasPreviouslyOnline = previousStatus[staff.user_id] || false;

          // Staff just came online
          if (isCurrentlyOnline && !wasPreviouslyOnline) {
            toast({
              title: `${staff.name} is now online`,
              description: "Your favorite staff member is now available",
            });

            // Create notification in database
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                supabase
                  .from("notifications")
                  .insert({
                    user_id: user.id,
                    title: "Staff Member Online",
                    message: `${staff.name} is now available`,
                    type: "staff_online",
                    reference_id: staff.id,
                  })
                  .then(({ error }) => {
                    if (error) console.error("Error creating notification:", error);
                  });
              }
            });
          }

          previousStatus[staff.user_id] = isCurrentlyOnline;
        });
      } catch (error) {
        console.error("Error checking favorite staff status:", error);
      }
    };

    checkFavoriteStatus();
  }, [onlineStatus, favorites, toast]);
};
