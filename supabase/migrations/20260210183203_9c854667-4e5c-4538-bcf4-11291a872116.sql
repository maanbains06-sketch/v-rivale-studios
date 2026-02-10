
-- Table for tracking spin results and cooldowns
CREATE TABLE public.spin_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prize_key TEXT NOT NULL,
  prize_label TEXT NOT NULL,
  is_rare BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  claimed_via TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spin_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own spins
CREATE POLICY "Users can view own spins"
ON public.spin_results FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own spins
CREATE POLICY "Users can insert own spins"
ON public.spin_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Staff/admin/owner can view all spins
CREATE POLICY "Staff can view all spins"
ON public.spin_results FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR is_owner(auth.uid())
);

-- Staff can update claim status
CREATE POLICY "Staff can update spins"
ON public.spin_results FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR is_owner(auth.uid())
);

-- Index for fast cooldown lookups
CREATE INDEX idx_spin_results_user_created ON public.spin_results(user_id, created_at DESC);
