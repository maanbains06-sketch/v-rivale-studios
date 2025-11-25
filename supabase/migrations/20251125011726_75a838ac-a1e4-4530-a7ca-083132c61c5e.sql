-- Create canned_responses table for support staff quick replies
CREATE TABLE IF NOT EXISTS public.canned_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for canned_responses
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;

-- Policies for canned_responses
CREATE POLICY "Staff can view all canned responses"
  ON public.canned_responses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Staff can insert canned responses"
  ON public.canned_responses
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Staff can update canned responses"
  ON public.canned_responses
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Staff can delete canned responses"
  ON public.canned_responses
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add file attachment support to support_messages
ALTER TABLE public.support_messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Create support_chat_ratings table for user satisfaction
CREATE TABLE IF NOT EXISTS public.support_chat_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for support_chat_ratings
ALTER TABLE public.support_chat_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for support_chat_ratings
CREATE POLICY "Users can insert own ratings"
  ON public.support_chat_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ratings"
  ON public.support_chat_ratings
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Staff can view all ratings"
  ON public.support_chat_ratings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON public.canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_support_chat_ratings_chat_id ON public.support_chat_ratings(chat_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_status_created ON public.support_chats(status, created_at);

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments
CREATE POLICY "Users can upload own chat attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view chat attachments they have access to"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-attachments' 
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'moderator'::app_role)
    )
  );

CREATE POLICY "Staff can upload chat attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  );

-- Add trigger for canned_responses updated_at
CREATE TRIGGER update_canned_responses_updated_at
  BEFORE UPDATE ON public.canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();