-- Add public SELECT policy for staff_members so the public view can work
CREATE POLICY "Anyone can view active staff members basic info"
ON public.staff_members
FOR SELECT
USING (is_active = true);