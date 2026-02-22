
-- Create player_bans table to store timed bans with expiry
CREATE TABLE public.player_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT,
  reason TEXT NOT NULL DEFAULT 'No reason provided',
  ban_type TEXT NOT NULL DEFAULT 'permanent', -- 'hours', 'days', 'permanent'
  ban_duration_value INTEGER, -- number of hours or days
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means permanent
  banned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_bans ENABLE ROW LEVEL SECURITY;

-- Admin can view all bans
CREATE POLICY "Admins can view all bans"
ON public.player_bans FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.is_owner(auth.uid()));

-- Admin can insert bans
CREATE POLICY "Admins can insert bans"
ON public.player_bans FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.is_owner(auth.uid()));

-- Admin can update bans
CREATE POLICY "Admins can update bans"
ON public.player_bans FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.is_owner(auth.uid()));

-- Admin can delete bans
CREATE POLICY "Admins can delete bans"
ON public.player_bans FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_player_bans_updated_at
BEFORE UPDATE ON public.player_bans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
