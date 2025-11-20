-- Create table for whitelist application drafts
CREATE TABLE public.whitelist_application_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  steam_id TEXT,
  discord TEXT,
  age INTEGER,
  experience TEXT,
  backstory TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_draft UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.whitelist_application_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own drafts
CREATE POLICY "Users can view own drafts"
ON public.whitelist_application_drafts
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own drafts
CREATE POLICY "Users can insert own drafts"
ON public.whitelist_application_drafts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own drafts
CREATE POLICY "Users can update own drafts"
ON public.whitelist_application_drafts
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own drafts
CREATE POLICY "Users can delete own drafts"
ON public.whitelist_application_drafts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_whitelist_application_drafts_updated_at
BEFORE UPDATE ON public.whitelist_application_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_whitelist_application_drafts_user_id 
ON public.whitelist_application_drafts(user_id);