
-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Staff can view fingerprints" ON public.device_fingerprints;

-- Create a broader SELECT policy that checks both user_roles and staff_members
CREATE POLICY "Staff can view fingerprints" ON public.device_fingerprints
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE (staff_members.user_id = auth.uid() OR staff_members.discord_id = (auth.jwt() -> 'user_metadata' ->> 'discord_id'))
    AND staff_members.is_active = true
    AND staff_members.role_type IN ('admin', 'owner', 'developer')
  )
);
