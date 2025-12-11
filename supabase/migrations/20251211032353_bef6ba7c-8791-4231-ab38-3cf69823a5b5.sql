-- 1. Drop the existing public view if it exists and recreate without sensitive fields
DROP VIEW IF EXISTS public.staff_members_public;

CREATE VIEW public.staff_members_public AS
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

-- 2. Grant select on the public view to anon and authenticated
GRANT SELECT ON public.staff_members_public TO anon;
GRANT SELECT ON public.staff_members_public TO authenticated;

-- 3. Create is_owner() function that checks site_settings and staff_members
-- This validates server-side by comparing the user's discord_id with owner_discord_id
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_discord text;
  user_discord text;
BEGIN
  -- Get owner discord ID from site_settings
  SELECT value INTO owner_discord
  FROM public.site_settings
  WHERE key = 'owner_discord_id';
  
  -- Get user's discord ID from staff_members
  SELECT discord_id INTO user_discord
  FROM public.staff_members
  WHERE user_id = _user_id AND is_active = true;
  
  -- Return true if they match and both exist
  RETURN owner_discord IS NOT NULL 
    AND user_discord IS NOT NULL 
    AND owner_discord = user_discord;
END;
$$;

-- 4. Update RLS policy on staff_members to restrict public access
-- First drop the existing public policy
DROP POLICY IF EXISTS "Anyone can view public staff info" ON public.staff_members;

-- Create new policy that only allows admins/moderators/owner to see full staff data
CREATE POLICY "Authorized users can view all staff members"
ON public.staff_members
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR is_owner(auth.uid())
);

-- 5. Add policy for owner to manage staff
CREATE POLICY "Owner can manage staff members"
ON public.staff_members
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));