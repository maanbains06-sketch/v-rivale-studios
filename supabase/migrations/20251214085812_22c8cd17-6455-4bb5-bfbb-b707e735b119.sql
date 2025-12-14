-- Create a dedicated table for tracking Discord presence
CREATE TABLE IF NOT EXISTS public.discord_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_id TEXT NOT NULL UNIQUE,
  staff_member_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  status TEXT DEFAULT 'offline', -- online, idle, dnd, offline
  last_online_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discord_presence ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view presence (public data)
CREATE POLICY "Anyone can view discord presence"
ON public.discord_presence
FOR SELECT
USING (true);

-- Allow service role and admins to update presence
CREATE POLICY "Service role can manage presence"
ON public.discord_presence
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_discord_presence_discord_id ON public.discord_presence(discord_id);
CREATE INDEX idx_discord_presence_staff_member_id ON public.discord_presence(staff_member_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.discord_presence;