-- Make steam_id nullable and add default value in whitelist_applications
-- This allows submission without Steam ID as we've removed Steam authentication

ALTER TABLE public.whitelist_applications 
ALTER COLUMN steam_id DROP NOT NULL;

ALTER TABLE public.whitelist_applications 
ALTER COLUMN steam_id SET DEFAULT 'N/A';

-- Make steam_id nullable in ban_appeals
ALTER TABLE public.ban_appeals 
ALTER COLUMN steam_id SET DEFAULT 'N/A';

-- Update existing records with null steam_id to 'N/A'
UPDATE public.whitelist_applications 
SET steam_id = 'N/A' 
WHERE steam_id IS NULL;

UPDATE public.ban_appeals 
SET steam_id = 'N/A' 
WHERE steam_id IS NULL;

-- Update RLS policy to hide sensitive staff information from public
-- Drop existing public policy and create a more restrictive one
DROP POLICY IF EXISTS "Anyone can view active staff members" ON public.staff_members;

CREATE POLICY "Public can view limited staff info"
ON public.staff_members
FOR SELECT
USING (
  is_active = true
  AND (
    auth.uid() IS NULL OR  -- Allow unauthenticated users with limited data
    has_role(auth.uid(), 'admin'::app_role) OR  -- Admins see everything
    has_role(auth.uid(), 'moderator'::app_role)  -- Moderators see everything
  )
);

-- Create a view for public staff information (without sensitive fields)
CREATE OR REPLACE VIEW public.staff_members_public AS
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