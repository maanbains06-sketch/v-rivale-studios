-- Update staff_members_public view to include discord_id and discord_username
DROP VIEW IF EXISTS public.staff_members_public;

CREATE VIEW public.staff_members_public AS
SELECT 
  id,
  user_id,
  name,
  discord_id,
  discord_username,
  discord_avatar,
  role,
  role_type,
  department,
  bio,
  responsibilities,
  is_active,
  display_order,
  created_at
FROM public.staff_members
WHERE is_active = true;