-- Add roster-specific fields to staff_members
ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS badge_number text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS division text,
  ADD COLUMN IF NOT EXISTS call_sign text,
  ADD COLUMN IF NOT EXISTS strikes text DEFAULT '0/3';

-- Ensure RLS is enabled
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  -- Select policy: allow staff + elevated roles + owner
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staff_members' AND policyname='Staff can view staff roster'
  ) THEN
    CREATE POLICY "Staff can view staff roster"
    ON public.staff_members
    FOR SELECT
    USING (
      public.is_owner(auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'moderator'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.staff_members sm
        WHERE sm.user_id = auth.uid() AND sm.is_active = true
      )
    );
  END IF;

  -- Write policy: owner only (matches Edit/Add permissions)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staff_members' AND policyname='Owner can manage staff roster'
  ) THEN
    CREATE POLICY "Owner can manage staff roster"
    ON public.staff_members
    FOR INSERT
    WITH CHECK (public.is_owner(auth.uid()));

    CREATE POLICY "Owner can update staff roster"
    ON public.staff_members
    FOR UPDATE
    USING (public.is_owner(auth.uid()))
    WITH CHECK (public.is_owner(auth.uid()));

    CREATE POLICY "Owner can delete staff roster"
    ON public.staff_members
    FOR DELETE
    USING (public.is_owner(auth.uid()));
  END IF;
END $$;