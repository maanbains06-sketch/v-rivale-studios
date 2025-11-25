-- Add language column to support_chats table
ALTER TABLE public.support_chats 
ADD COLUMN IF NOT EXISTS detected_language TEXT DEFAULT 'en';

-- Add index for language queries
CREATE INDEX IF NOT EXISTS idx_support_chats_language 
ON public.support_chats(detected_language);