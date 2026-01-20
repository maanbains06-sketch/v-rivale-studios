
-- Update can_edit_roster to work properly by checking if the user's Discord ID 
-- matches the owner OR if they have a linked staff member with appropriate permissions
-- Note: The frontend verifies Discord roles via the edge function, the DB function is for RLS fallback

CREATE OR REPLACE FUNCTION public.can_edit_roster(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_discord text;
  owner_discord text;
  user_role_type text;
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

  -- Check if user is admin/owner via role_type in staff_members
  SELECT sm.role_type INTO user_role_type
  FROM public.staff_members sm
  WHERE (sm.user_id = _user_id OR sm.discord_id = user_discord)
    AND sm.is_active = true
  LIMIT 1;

  -- Staff with admin/owner/moderator role_type can edit
  IF user_role_type IN ('owner', 'admin', 'moderator') THEN
    RETURN true;
  END IF;

  -- Also check if user has admin role in user_roles table
  IF public.has_role(_user_id, 'admin'::app_role) OR public.has_role(_user_id, 'moderator'::app_role) THEN
    RETURN true;
  END IF;

  -- No edit access
  RETURN false;
END;
$function$;
