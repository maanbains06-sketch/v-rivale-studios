DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staff_members' AND policyname='Staff can view staff roster'
  ) THEN
    DROP POLICY "Staff can view staff roster" ON public.staff_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staff_members' AND policyname='Roster view access'
  ) THEN
    CREATE POLICY "Roster view access"
    ON public.staff_members
    FOR SELECT
    USING (true);
  END IF;
END $$;