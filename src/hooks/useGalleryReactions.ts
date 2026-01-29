import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export const useGalleryReactions = (submissionId: string) => {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!submissionId) return;

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });

    loadReactions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`reactions-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_reactions',
          filter: `submission_id=eq.${submissionId}`,
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId]);

  const loadReactions = async () => {
    if (!submissionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get all reactions for this submission
      const { data, error } = await supabase
        .from("gallery_reactions")
        .select("emoji, user_id")
        .eq("submission_id", submissionId);

      if (error) throw error;

      // Group reactions by emoji and count them
      const reactionMap = new Map<string, { count: number; hasReacted: boolean }>();
      
      (data || []).forEach((reaction) => {
        const existing = reactionMap.get(reaction.emoji) || { count: 0, hasReacted: false };
        existing.count += 1;
        if (user && reaction.user_id === user.id) {
          existing.hasReacted = true;
        }
        reactionMap.set(reaction.emoji, existing);
      });

      const reactionCounts: ReactionCount[] = Array.from(reactionMap.entries()).map(
        ([emoji, { count, hasReacted }]) => ({ emoji, count, hasReacted })
      );

      // Sort by count descending
      reactionCounts.sort((a, b) => b.count - a.count);
      
      setReactions(reactionCounts);
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const toggleReaction = async (emoji: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to react to content",
          variant: "destructive",
        });
        return;
      }

      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(r => r.emoji === emoji && r.hasReacted);

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from("gallery_reactions")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from("gallery_reactions")
          .insert({
            submission_id: submissionId,
            user_id: user.id,
            emoji: emoji,
          });

        if (error) throw error;
      }

      // Reload reactions
      await loadReactions();
    } catch (error: any) {
      console.error("Error toggling reaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update reaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    reactions,
    loading,
    toggleReaction,
    currentUserId,
  };
};
