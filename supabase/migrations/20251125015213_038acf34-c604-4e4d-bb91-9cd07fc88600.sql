-- Create table for AI message ratings
CREATE TABLE IF NOT EXISTS public.ai_message_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_message_ratings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own ratings
CREATE POLICY "Users can insert own ratings"
  ON public.ai_message_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own ratings
CREATE POLICY "Users can view own ratings"
  ON public.ai_message_ratings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can view all ratings
CREATE POLICY "Staff can view all ratings"
  ON public.ai_message_ratings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Add index for faster lookups
CREATE INDEX idx_ai_message_ratings_message_id ON public.ai_message_ratings(message_id);
CREATE INDEX idx_ai_message_ratings_chat_id ON public.ai_message_ratings(chat_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_message_ratings_updated_at
  BEFORE UPDATE ON public.ai_message_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();