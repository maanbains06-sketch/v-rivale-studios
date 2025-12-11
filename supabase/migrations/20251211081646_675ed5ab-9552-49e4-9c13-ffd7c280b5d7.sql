-- Drop and recreate the view with security_invoker = false
DROP VIEW IF EXISTS public.staff_members_public;

CREATE VIEW public.staff_members_public 
WITH (security_invoker = false)
AS
SELECT 
  id,
  user_id,
  name,
  role,
  role_type,
  department,
  bio,
  responsibilities,
  discord_avatar,
  is_active,
  display_order,
  created_at
FROM public.staff_members
WHERE is_active = true;

-- Grant SELECT to anon and authenticated users
GRANT SELECT ON public.staff_members_public TO anon;
GRANT SELECT ON public.staff_members_public TO authenticated;