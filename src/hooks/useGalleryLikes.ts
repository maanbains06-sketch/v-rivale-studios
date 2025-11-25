import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGalleryLikes = (submissionId: string) => {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLikeData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`likes-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_likes',
          filter: `submission_id=eq.${submissionId}`,
        },
        () => {
          loadLikeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId]);

  const loadLikeData = async () => {
    try {
      // Get like count
      const { count } = await supabase
        .from("gallery_likes")
        .select("*", { count: "exact", head: true })
        .eq("submission_id", submissionId);

      setLikeCount(count || 0);

      // Check if current user has liked
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("gallery_likes")
          .select("id")
          .eq("submission_id", submissionId)
          .eq("user_id", user.id)
          .single();

        setIsLiked(!!data);
      }
    } catch (error) {
      console.error("Error loading like data:", error);
    }
  };

  const toggleLike = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to like content",
          variant: "destructive",
        });
        return;
      }

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("gallery_likes")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", user.id);

        if (error) throw error;
        
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from("gallery_likes")
          .insert({
            submission_id: submissionId,
            user_id: user.id,
          });

        if (error) throw error;
        
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update like",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    likeCount,
    isLiked,
    loading,
    toggleLike,
  };
};
