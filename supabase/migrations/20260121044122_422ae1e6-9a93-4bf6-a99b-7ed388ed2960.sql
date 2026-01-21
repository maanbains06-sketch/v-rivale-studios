-- Drop the current authenticated-only policy and replace with a public read policy
-- This is critical so maintenance mode can be checked by all users (including unauthenticated)

DROP POLICY IF EXISTS "Authenticated users can view site settings" ON public.site_settings;

-- Allow anyone (authenticated or not) to read site settings
-- This is safe because settings like maintenance_mode need to be publicly readable
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
TO public
USING (true);

-- Keep the owner-only policy for managing settings
-- (already exists but we'll ensure it's correct)