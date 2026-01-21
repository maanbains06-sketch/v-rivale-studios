-- Fix: allow Owner + active staff to manage maintenance schedules and close/update all application types

-- 1) Maintenance schedules: broaden management policy beyond just user_roles.admin
DROP POLICY IF EXISTS "Admins can manage maintenance schedules" ON public.maintenance_schedules;
CREATE POLICY "Owner/admin can manage maintenance schedules"
ON public.maintenance_schedules
FOR ALL
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
)
WITH CHECK (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
);

-- 2) Applications: ensure owner + active staff can UPDATE (mark closed/on_hold/etc.)

-- job_applications
DROP POLICY IF EXISTS "Admins can update all job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admins can update all job applications (expanded)" ON public.job_applications;
CREATE POLICY "Staff can update all job applications"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
);

-- pdm_applications
DROP POLICY IF EXISTS "Admins can update all PDM applications" ON public.pdm_applications;
DROP POLICY IF EXISTS "Admins can update PDM applications" ON public.pdm_applications;
CREATE POLICY "Staff can update all PDM applications"
ON public.pdm_applications
FOR UPDATE
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
);

-- firefighter_applications
DROP POLICY IF EXISTS "Admins can update all firefighter applications" ON public.firefighter_applications;
CREATE POLICY "Staff can update all firefighter applications"
ON public.firefighter_applications
FOR UPDATE
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
);

-- weazel_news_applications
DROP POLICY IF EXISTS "Admins can update weazel applications" ON public.weazel_news_applications;
CREATE POLICY "Staff can update all weazel applications"
ON public.weazel_news_applications
FOR UPDATE
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
);

-- staff_applications
DROP POLICY IF EXISTS "Admins can update all staff applications" ON public.staff_applications;
CREATE POLICY "Staff can update all staff applications"
ON public.staff_applications
FOR UPDATE
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
);

-- ban_appeals
DROP POLICY IF EXISTS "Admins can update all ban appeals" ON public.ban_appeals;
CREATE POLICY "Staff can update all ban appeals"
ON public.ban_appeals
FOR UPDATE
TO authenticated
USING (
  public.is_owner(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.user_id = auth.uid()
      AND sm.is_active = true
      AND sm.role_type IN ('owner','admin','moderator','developer')
  )
);

-- Note: creator_applications already has owner update policy; keep as-is.
