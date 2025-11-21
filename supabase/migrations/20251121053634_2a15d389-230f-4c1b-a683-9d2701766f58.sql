-- Create ban appeals table
CREATE TABLE public.ban_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discord_username TEXT NOT NULL,
  steam_id TEXT NOT NULL,
  ban_reason TEXT NOT NULL,
  appeal_reason TEXT NOT NULL,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ban_appeals ENABLE ROW LEVEL SECURITY;

-- Create policies for ban appeals
CREATE POLICY "Users can insert own ban appeals"
ON public.ban_appeals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ban appeals"
ON public.ban_appeals
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users can update own pending ban appeals"
ON public.ban_appeals
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all ban appeals"
ON public.ban_appeals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ban_appeals_updated_at
BEFORE UPDATE ON public.ban_appeals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();