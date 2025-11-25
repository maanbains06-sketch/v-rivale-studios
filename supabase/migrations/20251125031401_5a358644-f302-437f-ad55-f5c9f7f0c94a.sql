-- Create gallery_likes table for reactions
CREATE TABLE IF NOT EXISTS public.gallery_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.gallery_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

-- Enable RLS
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view likes"
  ON public.gallery_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like content"
  ON public.gallery_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes"
  ON public.gallery_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_gallery_likes_submission_id ON public.gallery_likes(submission_id);
CREATE INDEX idx_gallery_likes_user_id ON public.gallery_likes(user_id);

-- Create function to get like count
CREATE OR REPLACE FUNCTION public.get_gallery_like_count(submission_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.gallery_likes
  WHERE submission_id = submission_uuid;
$$;