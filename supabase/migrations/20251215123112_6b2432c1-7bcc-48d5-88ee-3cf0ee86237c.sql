-- Drop the overly permissive policy that exposes email addresses
DROP POLICY IF EXISTS "Anyone can view active staff members basic info" ON public.staff_members;

-- Create a more restrictive policy that only allows viewing non-sensitive columns through the view
-- The staff_members_public view already exists and excludes email, steam_id, discord_id, etc.
-- Keep admin/owner access to the full table

-- Ensure staff can view their own full record
CREATE POLICY "Staff can view own full record"
ON public.staff_members
FOR SELECT
USING (auth.uid() = user_id);