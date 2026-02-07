-- Update the is_owner() function to use SECURITY DEFINER (without dropping)
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_settings
    WHERE key = 'owner_discord_id'
    AND value = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'discord_id'),
      (auth.jwt() -> 'user_metadata' ->> 'provider_id'),
      (auth.jwt() -> 'user_metadata' ->> 'sub')
    )
  )
$$;

-- Update the is_owner(uuid) function to use SECURITY DEFINER
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
  -- Get owner discord ID from settings
  SELECT value INTO owner_discord
  FROM public.site_settings
  WHERE key = 'owner_discord_id';

  -- Get user discord ID from auth.users metadata
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

-- Drop existing creator_contracts policies
DROP POLICY IF EXISTS "Owner can manage contracts" ON public.creator_contracts;
DROP POLICY IF EXISTS "Creators can view their contracts" ON public.creator_contracts;
DROP POLICY IF EXISTS "Creators can sign their contracts" ON public.creator_contracts;

-- Create new RLS policies for creator_contracts using JWT metadata directly
-- Owner has full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Owner full access to contracts"
ON public.creator_contracts
FOR ALL
TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Creators can view their own contracts
CREATE POLICY "Creators can view own contracts"
ON public.creator_contracts
FOR SELECT
TO authenticated
USING (
  creator_discord_id = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'discord_id'),
    (auth.jwt() -> 'user_metadata' ->> 'provider_id'),
    (auth.jwt() -> 'user_metadata' ->> 'sub')
  )
);

-- Creators can update (sign) their own contracts
CREATE POLICY "Creators can sign own contracts"
ON public.creator_contracts
FOR UPDATE
TO authenticated
USING (
  creator_discord_id = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'discord_id'),
    (auth.jwt() -> 'user_metadata' ->> 'provider_id'),
    (auth.jwt() -> 'user_metadata' ->> 'sub')
  )
)
WITH CHECK (
  creator_discord_id = COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'discord_id'),
    (auth.jwt() -> 'user_metadata' ->> 'provider_id'),
    (auth.jwt() -> 'user_metadata' ->> 'sub')
  )
);