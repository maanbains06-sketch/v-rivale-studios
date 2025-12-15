-- Create creator_applications table for the streamer/creator program
CREATE TABLE public.creator_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  steam_id TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  average_viewers TEXT NOT NULL,
  content_frequency TEXT NOT NULL,
  rp_experience TEXT NOT NULL,
  content_style TEXT NOT NULL,
  why_join TEXT NOT NULL,
  social_links TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (no auth required as per user request)
CREATE POLICY "Anyone can submit creator applications" 
ON public.creator_applications 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own applications if logged in
CREATE POLICY "Users can view their own creator applications" 
ON public.creator_applications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all creator applications" 
ON public.creator_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Admins can update applications
CREATE POLICY "Admins can update creator applications" 
ON public.creator_applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_creator_applications_updated_at
BEFORE UPDATE ON public.creator_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();