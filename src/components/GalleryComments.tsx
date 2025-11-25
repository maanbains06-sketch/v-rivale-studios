import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { useGalleryComments } from "@/hooks/useGalleryComments";
import { useStaffRole } from "@/hooks/useStaffRole";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GalleryCommentsProps {
  submissionId: string;
}

export const GalleryComments = ({ submissionId }: GalleryCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { comments, loading, submitting, addComment, deleteComment } = useGalleryComments(submissionId);
  const { isStaff } = useStaffRole();

  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  });

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    const success = await addComment(newComment);
    if (success) {
      setNewComment("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
  };

  const canDeleteComment = (commentUserId: string) => {
    return currentUserId === commentUserId || isStaff;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
          rows={3}
          maxLength={1000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">
            {newComment.length}/1000 characters
          </span>
          <Button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="h-[300px] pr-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white/5 rounded-lg p-4 space-y-2 border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {comment.user_email}
                      </span>
                      <span className="text-xs text-white/50">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
                      {comment.comment}
                    </p>
                  </div>
                  {canDeleteComment(comment.user_id) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/50 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteComment(comment.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
