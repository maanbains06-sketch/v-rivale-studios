-- Drop and recreate the staff_members_public view without sensitive fields
DROP VIEW IF EXISTS public.staff_members_public;

CREATE VIEW public.staff_members_public AS
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

-- Grant access to the view
GRANT SELECT ON public.staff_members_public TO anon, authenticated;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.staff_members_public IS 'Public view of staff members excluding sensitive data (email, steam_id, discord_id)';