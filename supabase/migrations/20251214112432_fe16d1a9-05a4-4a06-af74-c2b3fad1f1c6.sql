-- Drop the restrictive policy and create a public one for discord_presence
DROP POLICY IF EXISTS "Authenticated users can view discord presence" ON public.discord_presence;

-- Create policy allowing anyone to view discord presence (public access)
CREATE POLICY "Anyone can view discord presence"
ON public.discord_presence
FOR SELECT
USING (true);

-- Also ensure the public view is accessible
-- Recreate the view with security_invoker = false to allow public access
DROP VIEW IF EXISTS public.discord_presence_public;

CREATE VIEW public.discord_presence_public AS
SELECT 
  id,
  staff_member_id,
  is_online,
  last_online_at,
  status,
  updated_at,
  created_at
FROM public.discord_presence;

-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.discord_presence_public TO anon;
GRANT SELECT ON public.discord_presence_public TO authenticated;