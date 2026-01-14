-- Create a function that owner can call to get all users with their Discord info
-- This allows the owner to see all registered users
CREATE OR REPLACE FUNCTION public.get_all_users_for_owner()
RETURNS TABLE (
  out_user_id uuid,
  out_email text,
  out_discord_username text,
  out_discord_id text,
  out_discord_avatar text,
  out_role text,
  out_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow owner to call this function
  IF NOT is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only the owner can access this function';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as out_user_id,
    COALESCE(p.discord_username, 'Unknown') as out_email,
    p.discord_username as out_discord_username,
    p.discord_id as out_discord_id,
    p.discord_avatar as out_discord_avatar,
    COALESCE((
      SELECT ur.role::text 
      FROM user_roles ur 
      WHERE ur.user_id = p.id 
      ORDER BY 
        CASE ur.role 
          WHEN 'admin' THEN 1 
          WHEN 'moderator' THEN 2 
          ELSE 3 
        END
      LIMIT 1
    ), 'user') as out_role,
    p.created_at as out_created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Create a function to sync a user's Discord info by their user_id
CREATE OR REPLACE FUNCTION public.sync_user_discord_info(
  p_user_id uuid,
  p_discord_username text,
  p_discord_avatar text DEFAULT NULL,
  p_discord_banner text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow owner to call this function
  IF NOT is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only the owner can access this function';
  END IF;
  
  UPDATE profiles
  SET 
    discord_username = COALESCE(p_discord_username, discord_username),
    discord_avatar = COALESCE(p_discord_avatar, discord_avatar),
    discord_banner = COALESCE(p_discord_banner, discord_banner),
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Backfill: Add user_roles entries for existing users who don't have one
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'user'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;