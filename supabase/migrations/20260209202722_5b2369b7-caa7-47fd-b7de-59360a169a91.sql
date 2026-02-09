
-- Fix: Remove insecure user_metadata reference
DROP POLICY IF EXISTS "Staff can view fingerprints" ON public.device_fingerprints;

CREATE POLICY "Staff can view fingerprints" ON public.device_fingerprints
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE staff_members.user_id = auth.uid()
    AND staff_members.is_active = true
    AND staff_members.role_type IN ('admin', 'owner', 'developer')
  )
);
