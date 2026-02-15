
-- Create pending_rewards table for offline prize delivery
CREATE TABLE public.pending_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL,
  prize_key TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pending_rewards ENABLE ROW LEVEL SECURITY;

-- Owner can manage all pending rewards
CREATE POLICY "Owner full access to pending_rewards"
ON public.pending_rewards FOR ALL
USING (public.is_owner(auth.uid()));

-- Users can view their own pending rewards
CREATE POLICY "Users can view own pending rewards"
ON public.pending_rewards FOR SELECT
USING (discord_id = public.get_user_discord_id());
