-- Fix the security definer view issue by recreating it as a regular view
-- The view will respect RLS policies naturally
DROP VIEW IF EXISTS public.staff_members_public;

CREATE VIEW public.staff_members_public 
WITH (security_invoker = true) 
AS
SELECT 
  id,
  name,
  role,
  role_type,
  department,
  bio,
  responsibilities,
  discord_avatar,
  display_order,
  is_active,
  created_at
FROM public.staff_members
WHERE is_active = true;

-- Grant select permissions on the view
GRANT SELECT ON public.staff_members_public TO anon;
GRANT SELECT ON public.staff_members_public TO authenticated;

COMMENT ON VIEW public.staff_members_public IS 'Public view of staff members without sensitive PII (email, discord_id, steam_id)';