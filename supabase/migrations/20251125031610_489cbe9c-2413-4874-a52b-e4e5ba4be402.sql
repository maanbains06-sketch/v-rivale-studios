-- Create gallery_comments table
CREATE TABLE IF NOT EXISTS public.gallery_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.gallery_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view comments on approved submissions"
  ON public.gallery_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gallery_submissions
      WHERE gallery_submissions.id = submission_id
      AND gallery_submissions.status = 'approved'
    )
  );

CREATE POLICY "Authenticated users can add comments"
  ON public.gallery_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments"
  ON public.gallery_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.gallery_comments
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can delete any comment"
  ON public.gallery_comments
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );

-- Create indexes for performance
CREATE INDEX idx_gallery_comments_submission_id ON public.gallery_comments(submission_id);
CREATE INDEX idx_gallery_comments_user_id ON public.gallery_comments(user_id);
CREATE INDEX idx_gallery_comments_created_at ON public.gallery_comments(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_gallery_comments_updated_at
  BEFORE UPDATE ON public.gallery_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();