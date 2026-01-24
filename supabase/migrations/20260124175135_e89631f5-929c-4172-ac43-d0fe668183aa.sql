-- Create a function to check if current user is the owner
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
    AND value = (
      SELECT COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'provider_id'),
        (auth.jwt() -> 'user_metadata' ->> 'discord_id')
      )
    )
  )
$$;

-- Add DELETE policies for all application tables (owner only)

-- Whitelist Applications
DROP POLICY IF EXISTS "Owner can delete whitelist applications" ON public.whitelist_applications;
CREATE POLICY "Owner can delete whitelist applications"
ON public.whitelist_applications
FOR DELETE
TO authenticated
USING (public.is_owner());

-- Job Applications
DROP POLICY IF EXISTS "Owner can delete job applications" ON public.job_applications;
CREATE POLICY "Owner can delete job applications"
ON public.job_applications
FOR DELETE
TO authenticated
USING (public.is_owner());

-- Staff Applications
DROP POLICY IF EXISTS "Owner can delete staff applications" ON public.staff_applications;
CREATE POLICY "Owner can delete staff applications"
ON public.staff_applications
FOR DELETE
TO authenticated
USING (public.is_owner());

-- Ban Appeals
DROP POLICY IF EXISTS "Owner can delete ban appeals" ON public.ban_appeals;
CREATE POLICY "Owner can delete ban appeals"
ON public.ban_appeals
FOR DELETE
TO authenticated
USING (public.is_owner());

-- Creator Applications
DROP POLICY IF EXISTS "Owner can delete creator applications" ON public.creator_applications;
CREATE POLICY "Owner can delete creator applications"
ON public.creator_applications
FOR DELETE
TO authenticated
USING (public.is_owner());

-- Firefighter Applications
DROP POLICY IF EXISTS "Owner can delete firefighter applications" ON public.firefighter_applications;
CREATE POLICY "Owner can delete firefighter applications"
ON public.firefighter_applications
FOR DELETE
TO authenticated
USING (public.is_owner());

-- Weazel News Applications
DROP POLICY IF EXISTS "Owner can delete weazel news applications" ON public.weazel_news_applications;
CREATE POLICY "Owner can delete weazel news applications"
ON public.weazel_news_applications
FOR DELETE
TO authenticated
USING (public.is_owner());

-- PDM Applications
DROP POLICY IF EXISTS "Owner can delete pdm applications" ON public.pdm_applications;
CREATE POLICY "Owner can delete pdm applications"
ON public.pdm_applications
FOR DELETE
TO authenticated
USING (public.is_owner());

-- Business Applications (if exists)
DROP POLICY IF EXISTS "Owner can delete business applications" ON public.business_applications;
CREATE POLICY "Owner can delete business applications"
ON public.business_applications
FOR DELETE
TO authenticated
USING (public.is_owner());