-- Fix whitelist_applications SELECT policy to include staff_members check
DROP POLICY IF EXISTS "Users can view own applications" ON public.whitelist_applications;
CREATE POLICY "Users can view own applications" ON public.whitelist_applications
FOR SELECT USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Fix whitelist_applications UPDATE policy to include staff_members check
DROP POLICY IF EXISTS "Admins can update all applications" ON public.whitelist_applications;
CREATE POLICY "Staff can update all applications" ON public.whitelist_applications
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR is_owner(auth.uid())
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Fix job_applications SELECT policy  
DROP POLICY IF EXISTS "Users can view own job applications" ON public.job_applications;
CREATE POLICY "Users can view own job applications" ON public.job_applications
FOR SELECT USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Fix ban_appeals SELECT policy
DROP POLICY IF EXISTS "Users can view own ban appeals" ON public.ban_appeals;
CREATE POLICY "Users can view own ban appeals" ON public.ban_appeals
FOR SELECT USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
    AND sm.is_active = true 
    AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);