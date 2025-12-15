-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Admins can view all creator applications" ON public.creator_applications;
DROP POLICY IF EXISTS "Admins can update creator applications" ON public.creator_applications;

-- Create new policy: Only owner can view all applications
CREATE POLICY "Owner can view all creator applications"
ON public.creator_applications
FOR SELECT
USING (is_owner(auth.uid()));

-- Users can still view their own applications (existing policy already handles this)
-- "Users can view their own creator applications" - USING (auth.uid() = user_id)

-- Create new policy: Only owner can update applications
CREATE POLICY "Owner can update creator applications"
ON public.creator_applications
FOR UPDATE
USING (is_owner(auth.uid()));

-- Create new policy: Only owner can delete applications
CREATE POLICY "Owner can delete creator applications"
ON public.creator_applications
FOR DELETE
USING (is_owner(auth.uid()));