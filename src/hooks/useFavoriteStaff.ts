import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFavoriteStaff = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("favorite_staff")
        .select("staff_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setFavorites(data?.map(f => f.staff_id) || []);
    } catch (error: any) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (staffId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to favorite staff members",
          variant: "destructive",
        });
        return;
      }

      const isFavorite = favorites.includes(staffId);

      if (isFavorite) {
        const { error } = await supabase
          .from("favorite_staff")
          .delete()
          .eq("user_id", user.id)
          .eq("staff_id", staffId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== staffId));
        toast({
          title: "Removed from favorites",
          description: "You'll no longer receive notifications for this staff member",
        });
      } else {
        const { error } = await supabase
          .from("favorite_staff")
          .insert({
            user_id: user.id,
            staff_id: staffId,
          });

        if (error) throw error;

        setFavorites(prev => [...prev, staffId]);
        toast({
          title: "Added to favorites",
          description: "You'll be notified when this staff member comes online",
        });
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (staffId: string) => favorites.includes(staffId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
  };
};
