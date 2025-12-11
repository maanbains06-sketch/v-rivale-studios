-- Fix the view to use SECURITY INVOKER (default, more secure)
DROP VIEW IF EXISTS public.staff_members_public;

CREATE VIEW public.staff_members_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  name,
  discord_avatar,
  role,
  role_type,
  department,
  bio,
  responsibilities,
  display_order,
  is_active,
  created_at
FROM public.staff_members
WHERE is_active = true;

-- Re-grant permissions
GRANT SELECT ON public.staff_members_public TO anon;
GRANT SELECT ON public.staff_members_public TO authenticated;