import { useState, useEffect } from "react";
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
}

export const useGalleryComments = (submissionId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

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
  }, [submissionId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_comments")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails for comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, discord_username")
          .in("id", userIds);

        const commentsWithUsers = data.map(comment => ({
          ...comment,
          user_email: profiles?.find(p => p.id === comment.user_id)?.discord_username || "Anonymous User"
        }));

        setComments(commentsWithUsers);
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
  };

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
