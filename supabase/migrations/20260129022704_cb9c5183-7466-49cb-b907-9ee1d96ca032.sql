-- Create gallery_reactions table for Discord-style emoji reactions
CREATE TABLE public.gallery_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.gallery_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.gallery_reactions ENABLE ROW LEVEL SECURITY;

-- Everyone can view reactions
CREATE POLICY "Anyone can view gallery reactions"
ON public.gallery_reactions
FOR SELECT
USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
ON public.gallery_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.gallery_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_gallery_reactions_submission ON public.gallery_reactions(submission_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_reactions;