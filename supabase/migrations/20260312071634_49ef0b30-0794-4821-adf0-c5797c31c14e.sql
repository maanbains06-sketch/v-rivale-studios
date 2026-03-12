
-- Password reset OTP codes table
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_password_reset_codes_email ON public.password_reset_codes(email, used, expires_at);

-- RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No direct access from client - only via edge functions
CREATE POLICY "No direct access" ON public.password_reset_codes FOR ALL TO anon, authenticated USING (false);

-- Staff activity time tracking table
CREATE TABLE IF NOT EXISTS public.staff_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_seconds INTEGER DEFAULT 0,
  idle_seconds INTEGER DEFAULT 0,
  background_seconds INTEGER DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ DEFAULT now(),
  last_status TEXT DEFAULT 'offline',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_member_id, tracking_date)
);

-- Index for fast lookups
CREATE INDEX idx_staff_activity_tracking_date ON public.staff_activity_tracking(tracking_date, staff_member_id);
CREATE INDEX idx_staff_activity_tracking_user ON public.staff_activity_tracking(user_id);

-- RLS
ALTER TABLE public.staff_activity_tracking ENABLE ROW LEVEL SECURITY;

-- Owner can read all
CREATE POLICY "Owner can read all activity" ON public.staff_activity_tracking
  FOR SELECT TO authenticated USING (public.is_owner(auth.uid()));

-- Staff can read own
CREATE POLICY "Staff can read own activity" ON public.staff_activity_tracking
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Insert/update via authenticated users (their own data)
CREATE POLICY "Users can insert own activity" ON public.staff_activity_tracking
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activity" ON public.staff_activity_tracking
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Enable realtime for staff activity tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_activity_tracking;
