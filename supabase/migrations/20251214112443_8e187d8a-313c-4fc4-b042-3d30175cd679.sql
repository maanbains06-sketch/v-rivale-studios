-- Fix security definer view by using security_invoker
DROP VIEW IF EXISTS public.discord_presence_public;

CREATE VIEW public.discord_presence_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  staff_member_id,
  is_online,
  last_online_at,
  status,
  updated_at,
  created_at
FROM public.discord_presence;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.discord_presence_public TO anon;
GRANT SELECT ON public.discord_presence_public TO authenticated;

-- Also fix staff_members_public view if it has the same issue
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
  discord_username,
  display_order,
  is_active,
  created_at,
  user_id
FROM public.staff_members
WHERE is_active = true;

-- Grant public access to staff_members_public
GRANT SELECT ON public.staff_members_public TO anon;
GRANT SELECT ON public.staff_members_public TO authenticated;