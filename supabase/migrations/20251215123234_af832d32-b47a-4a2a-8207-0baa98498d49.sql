-- Restore public access to view active staff members
-- The staff_members_public view is used by the frontend which excludes sensitive columns like email
CREATE POLICY "Anyone can view active staff members basic info"
ON public.staff_members
FOR SELECT
USING (is_active = true);