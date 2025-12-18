-- Add discord_banner column to staff_members table
ALTER TABLE public.staff_members 
ADD COLUMN IF NOT EXISTS discord_banner TEXT;

-- Update the public view to include the banner
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
  discord_banner,
  display_order,
  is_active,
  created_at,
  user_id
FROM public.staff_members;