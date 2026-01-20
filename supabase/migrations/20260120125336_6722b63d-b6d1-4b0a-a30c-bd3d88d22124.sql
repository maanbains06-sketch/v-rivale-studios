-- Create a function to check if a user has roster edit permission
-- This checks owner status OR if user's discord_id is in the roster_edit_discord_ids site setting
CREATE OR REPLACE FUNCTION public.can_edit_roster(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_discord text;
  edit_discord_ids text[];
BEGIN
  -- Owner always can edit
  IF public.is_owner(_user_id) THEN
    RETURN true;
  END IF;

  -- Get user's Discord ID from auth metadata
  SELECT COALESCE(
    u.raw_user_meta_data->>'discord_id',
    u.raw_user_meta_data->>'provider_id',
    u.raw_user_meta_data->>'sub'
  ) INTO user_discord
  FROM auth.users u
  WHERE u.id = _user_id;

  -- Fallback to staff_members if not in metadata
  IF user_discord IS NULL THEN
    SELECT sm.discord_id INTO user_discord
    FROM public.staff_members sm
    WHERE sm.user_id = _user_id AND sm.is_active = true
    LIMIT 1;
  END IF;

  IF user_discord IS NULL THEN
    RETURN false;
  END IF;

  -- Get allowed edit Discord IDs from site_settings
  SELECT string_to_array(value, ',') INTO edit_discord_ids
  FROM public.site_settings
  WHERE key = 'roster_edit_discord_ids';

  -- Check if user's Discord ID is in allowed list
  RETURN user_discord = ANY(edit_discord_ids);
END;
$$;

-- Add the roster edit Discord IDs setting with the IDs from the edge function
INSERT INTO public.site_settings (key, value, description)
VALUES (
  'roster_edit_discord_ids',
  '1463145983448973519,1451442834229039104,1463143254324285583,1451442686115581963,1451442569018998916,1451442460910817371,1451442274037923960,1451747382592012380',
  'Comma-separated Discord IDs that can edit rosters'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now();

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Owner can manage staff roster" ON public.staff_members;
DROP POLICY IF EXISTS "Owner can update staff roster" ON public.staff_members;
DROP POLICY IF EXISTS "Owner can delete staff roster" ON public.staff_members;

-- Create new policies that allow owner OR users with roster edit Discord IDs
CREATE POLICY "Roster managers can insert staff"
ON public.staff_members
FOR INSERT
WITH CHECK (public.can_edit_roster(auth.uid()));

CREATE POLICY "Roster managers can update staff"
ON public.staff_members
FOR UPDATE
USING (public.can_edit_roster(auth.uid()))
WITH CHECK (public.can_edit_roster(auth.uid()));

CREATE POLICY "Roster managers can delete staff"
ON public.staff_members
FOR DELETE
USING (public.can_edit_roster(auth.uid()));