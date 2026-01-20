-- Fix owner detection for Discord OAuth users (provider_id/sub)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  owner_discord text;
  user_discord text;
BEGIN
  SELECT value INTO owner_discord
  FROM public.site_settings
  WHERE key = 'owner_discord_id';

  -- Primary: read Discord ID stored in auth.users metadata (supports multiple key names)
  SELECT COALESCE(
    u.raw_user_meta_data->>'discord_id',
    u.raw_user_meta_data->>'provider_id',
    u.raw_user_meta_data->>'sub'
  ) INTO user_discord
  FROM auth.users u
  WHERE u.id = _user_id;

  -- Fallback: legacy mapping via staff_members.user_id
  IF user_discord IS NULL THEN
    SELECT sm.discord_id INTO user_discord
    FROM public.staff_members sm
    WHERE sm.user_id = _user_id AND sm.is_active = true
    LIMIT 1;
  END IF;

  RETURN owner_discord IS NOT NULL
     AND owner_discord <> ''
     AND user_discord IS NOT NULL
     AND owner_discord = user_discord;
END;
$$;