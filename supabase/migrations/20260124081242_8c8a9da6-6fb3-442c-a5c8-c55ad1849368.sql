
-- Fix RLS policies for firefighter_applications to include is_owner check
DROP POLICY IF EXISTS "Users can view own firefighter applications" ON public.firefighter_applications;
CREATE POLICY "Users can view own firefighter applications" 
ON public.firefighter_applications 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
      AND sm.is_active = true 
      AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Fix RLS policies for pdm_applications to include is_owner check
DROP POLICY IF EXISTS "Users can view own PDM applications" ON public.pdm_applications;
CREATE POLICY "Users can view own PDM applications" 
ON public.pdm_applications 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
      AND sm.is_active = true 
      AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Fix RLS policies for staff_applications to include is_owner check
DROP POLICY IF EXISTS "Users can view own staff applications" ON public.staff_applications;
CREATE POLICY "Users can view own staff applications" 
ON public.staff_applications 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
      AND sm.is_active = true 
      AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);

-- Fix RLS policies for weazel_news_applications - combine into one comprehensive policy
DROP POLICY IF EXISTS "Admins can view all weazel applications" ON public.weazel_news_applications;
DROP POLICY IF EXISTS "Users can view their own weazel applications" ON public.weazel_news_applications;
CREATE POLICY "Users can view weazel applications" 
ON public.weazel_news_applications 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_owner(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM staff_members sm
    WHERE sm.user_id = auth.uid() 
      AND sm.is_active = true 
      AND sm.role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff')
  )
);
