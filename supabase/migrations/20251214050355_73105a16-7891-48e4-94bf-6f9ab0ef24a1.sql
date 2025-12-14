-- Create featured_youtubers table
CREATE TABLE public.featured_youtubers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'Streamer',
  is_live BOOLEAN DEFAULT false,
  live_stream_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_youtubers ENABLE ROW LEVEL SECURITY;

-- Public read access for everyone
CREATE POLICY "Anyone can view featured youtubers"
ON public.featured_youtubers
FOR SELECT
USING (is_active = true);

-- Admin/owner can manage
CREATE POLICY "Admins can manage featured youtubers"
ON public.featured_youtubers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
  OR public.is_owner(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_featured_youtubers_updated_at
BEFORE UPDATE ON public.featured_youtubers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();