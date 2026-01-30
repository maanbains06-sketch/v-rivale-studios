import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const commentSchema = z.object({
  comment: z.string()
    .trim()
    .min(1, { message: "Comment cannot be empty" })
    .max(1000, { message: "Comment must be less than 1000 characters" })
});

interface Comment {
  id: string;
  submission_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  discord_avatar?: string;
}

export const useGalleryComments = (submissionId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch Discord user info by ID
  const fetchDiscordUser = useCallback(async (discordId: string) => {
    if (!discordId || !/^\d{17,19}$/.test(discordId)) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId }
      });
      
      if (error || !data) return null;
      
      return {
        displayName: data.displayName || data.globalName || data.username || null,
        avatar: data.avatar || null,
      };
    } catch {
      return null;
    }
  }, []);

  const loadComments = useCallback(async () => {
    if (!submissionId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_comments")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch user profiles with discord info
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, discord_username, discord_id, discord_avatar")
          .in("id", userIds);

        // Build initial comments with profile data
        const commentsWithUsers: Comment[] = data.map(comment => {
          const profile = profiles?.find(p => p.id === comment.user_id);
          return {
            ...comment,
            user_email: profile?.discord_username || "User",
            discord_avatar: profile?.discord_avatar || null,
          };
        });

        setComments(commentsWithUsers);

        // Async enhancement: Fetch Discord names for users with Discord IDs but no username
        const discordIdsToFetch = profiles
          ?.filter(p => p.discord_id && /^\d{17,19}$/.test(p.discord_id) && !p.discord_username)
          .map(p => ({ id: p.id, discord_id: p.discord_id })) || [];

        if (discordIdsToFetch.length > 0) {
          // Fetch in background to not block initial render
          Promise.all(
            discordIdsToFetch.map(async ({ id, discord_id }) => {
              const discordData = await fetchDiscordUser(discord_id);
              if (discordData) {
                return { userId: id, ...discordData };
              }
              return null;
            })
          ).then(results => {
            const validResults = results.filter(Boolean);
            if (validResults.length > 0) {
              setComments(prev => prev.map(comment => {
                const discordInfo = validResults.find(r => r && r.userId === comment.user_id);
                if (discordInfo) {
                  return {
                    ...comment,
                    user_email: discordInfo.displayName || comment.user_email,
                    discord_avatar: discordInfo.avatar || comment.discord_avatar,
                  };
                }
                return comment;
              }));
            }
          });
        }
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error("Error loading comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [submissionId, fetchDiscordUser, toast]);

  useEffect(() => {
    if (!submissionId) return;
    
    loadComments();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_comments',
          filter: `submission_id=eq.${submissionId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId, loadComments]);

  const addComment = async (commentText: string) => {
    try {
      // Validate input
      const validated = commentSchema.parse({ comment: commentText });
      
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to post comments",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from("gallery_comments")
        .insert({
          submission_id: submissionId,
          user_id: user.id,
          comment: validated.comment,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
      
      return true;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to post comment",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("gallery_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  return {
    comments,
    loading,
    submitting,
    addComment,
    deleteComment,
  };
};
