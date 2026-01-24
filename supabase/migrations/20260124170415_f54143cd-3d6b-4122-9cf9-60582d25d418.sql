-- Fix RLS policies for application tables to allow staff members to update
-- Adding 'staff' to the role_type check for consistency with whitelist_applications

-- Drop and recreate the policy for job_applications
DROP POLICY IF EXISTS "Staff can update all job applications" ON public.job_applications;
CREATE POLICY "Staff can update all job applications" ON public.job_applications
FOR UPDATE
TO authenticated
USING (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Drop and recreate the policy for pdm_applications
DROP POLICY IF EXISTS "Staff can update all PDM applications" ON public.pdm_applications;
CREATE POLICY "Staff can update all PDM applications" ON public.pdm_applications
FOR UPDATE
TO authenticated
USING (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Drop and recreate the policy for weazel_news_applications
DROP POLICY IF EXISTS "Staff can update all weazel applications" ON public.weazel_news_applications;
CREATE POLICY "Staff can update all weazel applications" ON public.weazel_news_applications
FOR UPDATE
TO authenticated
USING (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Drop and recreate the policy for firefighter_applications
DROP POLICY IF EXISTS "Staff can update all firefighter applications" ON public.firefighter_applications;
CREATE POLICY "Staff can update all firefighter applications" ON public.firefighter_applications
FOR UPDATE
TO authenticated
USING (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Drop and recreate the policy for creator_applications
DROP POLICY IF EXISTS "Staff can update creator applications" ON public.creator_applications;
CREATE POLICY "Staff can update creator applications" ON public.creator_applications
FOR UPDATE
TO authenticated
USING (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
)
WITH CHECK (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Drop and recreate the policy for ban_appeals
DROP POLICY IF EXISTS "Staff can update all ban appeals" ON public.ban_appeals;
CREATE POLICY "Staff can update all ban appeals" ON public.ban_appeals
FOR UPDATE
TO authenticated
USING (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Drop and recreate the policy for staff_applications
DROP POLICY IF EXISTS "Staff can update all staff applications" ON public.staff_applications;
CREATE POLICY "Staff can update all staff applications" ON public.staff_applications
FOR UPDATE
TO authenticated
USING (
  is_owner(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);