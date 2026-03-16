
-- Staff Time Clock table for clock in/out tracking
CREATE TABLE public.staff_time_clock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out_at TIMESTAMPTZ,
  total_seconds INTEGER DEFAULT 0,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_time_clock ENABLE ROW LEVEL SECURITY;

-- Staff can read their own records
CREATE POLICY "Staff can read own time clock" ON public.staff_time_clock
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Staff can insert their own clock-in
CREATE POLICY "Staff can clock in" ON public.staff_time_clock
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Staff can update their own records (clock out)
CREATE POLICY "Staff can clock out" ON public.staff_time_clock
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Owner/admin can read all records
CREATE POLICY "Owner can read all time clock" ON public.staff_time_clock
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_members 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role_type IN ('owner', 'admin')
    )
  );

-- Index for performance
CREATE INDEX idx_staff_time_clock_staff_member ON public.staff_time_clock(staff_member_id);
CREATE INDEX idx_staff_time_clock_session_date ON public.staff_time_clock(session_date);
CREATE INDEX idx_staff_time_clock_user_id ON public.staff_time_clock(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_time_clock;
