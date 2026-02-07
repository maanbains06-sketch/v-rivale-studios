-- Create a secure helper function to get user's Discord ID from JWT
CREATE OR REPLACE FUNCTION public.get_user_discord_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'discord_id'),
    (auth.jwt() -> 'user_metadata' ->> 'provider_id'),
    (auth.jwt() -> 'user_metadata' ->> 'sub')
  )
$$;

-- Drop and recreate the policies using the secure function
DROP POLICY IF EXISTS "Creators can view own contracts" ON public.creator_contracts;
DROP POLICY IF EXISTS "Creators can sign own contracts" ON public.creator_contracts;

-- Creators can view their own contracts using secure function
CREATE POLICY "Creators can view own contracts"
ON public.creator_contracts
FOR SELECT
TO authenticated
USING (creator_discord_id = public.get_user_discord_id());

-- Creators can update (sign) their own contracts using secure function
CREATE POLICY "Creators can sign own contracts"
ON public.creator_contracts
FOR UPDATE
TO authenticated
USING (creator_discord_id = public.get_user_discord_id())
WITH CHECK (creator_discord_id = public.get_user_discord_id());