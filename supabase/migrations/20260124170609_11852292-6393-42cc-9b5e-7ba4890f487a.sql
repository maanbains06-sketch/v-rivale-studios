-- Drop existing update policies and recreate with 'staff' role included

-- Job Applications
DROP POLICY IF EXISTS "Staff can update all applications" ON public.job_applications;
CREATE POLICY "Staff can update all applications" ON public.job_applications
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- PDM Applications
DROP POLICY IF EXISTS "Staff can update all applications" ON public.pdm_applications;
CREATE POLICY "Staff can update all applications" ON public.pdm_applications
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Weazel News Applications
DROP POLICY IF EXISTS "Staff can update all applications" ON public.weazel_news_applications;
CREATE POLICY "Staff can update all applications" ON public.weazel_news_applications
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Firefighter Applications
DROP POLICY IF EXISTS "Staff can update all applications" ON public.firefighter_applications;
CREATE POLICY "Staff can update all applications" ON public.firefighter_applications
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Creator Applications
DROP POLICY IF EXISTS "Staff can update all applications" ON public.creator_applications;
CREATE POLICY "Staff can update all applications" ON public.creator_applications
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Ban Appeals
DROP POLICY IF EXISTS "Staff can update all applications" ON public.ban_appeals;
CREATE POLICY "Staff can update all applications" ON public.ban_appeals
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Staff Applications
DROP POLICY IF EXISTS "Staff can update all applications" ON public.staff_applications;
CREATE POLICY "Staff can update all applications" ON public.staff_applications
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Business Applications
DROP POLICY IF EXISTS "Staff can update all applications" ON public.business_applications;
CREATE POLICY "Staff can update all applications" ON public.business_applications
FOR UPDATE TO authenticated
USING (
  public.is_owner(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.staff_members sm 
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);