
-- Fix the UPDATE RLS policy for staff_members to use can_edit_roster in WITH CHECK
DROP POLICY IF EXISTS "Roster managers can update staff" ON public.staff_members;

CREATE POLICY "Roster managers can update staff"
ON public.staff_members
FOR UPDATE
USING (public.can_edit_roster(auth.uid()))
WITH CHECK (public.can_edit_roster(auth.uid()));

-- Also ensure admins can update with proper WITH CHECK
DROP POLICY IF EXISTS "Admins can update staff members" ON public.staff_members;

CREATE POLICY "Admins can update staff members"
ON public.staff_members
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
